#!/usr/bin/env node
/* run-grader-pilot.js — real models against break-the-grader, under a hard cap.
   tools/ · cert-machine

   THE PYTHON PACKAGE IS THE ONLY AUTHORITY. This file chooses which tasks to
   ask and pays for the calls; it never decides one. Tasks come out of
   `break_the_grader.api` and replies go back into it for scoring, so the number
   in the record is the number the shipped package produces and nothing here can
   drift from it.

   THE CAP IS THE POINT. Before every call the runner RESERVES that call's worst
   case — prompt tokens plus the full max_tokens at the model's own rate — and
   refuses to start it if the reservation would cross the cap. Spend can
   therefore never exceed the cap; it can only come in under it. A 402 or any
   credit error stops the run the same way. Partial runs are recorded as partial.
   THE CAP IS PER PROCESS: two concurrent runs must be sized to sum under it.

   ORDERING IS BY TASK, NOT BY MODEL. If the budget stops the run, every model
   has been measured on the same tasks, which is comparable. Running one model to
   completion first would produce a table with a hole shaped like a model.

   HARNESS ARTIFACTS ARE NOT MODEL OUTCOMES. A reply truncated by our own
   max_tokens is recorded and excluded from the rate, as is a model refusal.

   usage: ENVS_ALLOW_NETWORK=1 node tools/run-grader-pilot.js [n] [--cap 4.00] */
'use strict';
const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PKG = path.join(ROOT, 'environments/break_the_grader');
const A = require(path.join(ROOT, 'instruments/envs/anthropic.js'));

const argv = process.argv.slice(2);
const N = Number(argv.find(a => /^\d+$/.test(a)) || 60);
const capArg = argv.indexOf('--cap');
const CAP = Number(capArg >= 0 ? argv[capArg + 1] : (process.env.GRADER_CAP_USD || 4.00));
if (!(CAP > 0)) { console.error('cap must be positive'); process.exit(1); }

/* PILOT FINDING carried from 2026-09-03 and still binding. At default effort the
   5-family spends the whole reply on adaptive thinking and emits nothing
   parseable; at effort "low" the same task answers in a few hundred tokens.
   Haiku 4.5 takes NO effort parameter — it errors — and has no thinking. That
   difference is real, is recorded on every row, and is read with the table. */
const MAXTOK = Number(process.env.GRADER_MAXTOK || 2000);
const MODELS = [
  { id: 'claude-opus-5', model: 'claude-opus-5', effort: 'low' },
  { id: 'claude-sonnet-5', model: 'claude-sonnet-5', effort: 'low' },
  { id: 'claude-haiku-4-5', model: 'claude-haiku-4-5', effort: null }
];

/* --- the package, as a subprocess. One call in, one call out. --- */
function py(script, stdin) {
  const r = cp.spawnSync('python3', ['-c', script], {
    cwd: PKG, input: stdin || '', encoding: 'utf8', maxBuffer: 1 << 28
  });
  if (r.status !== 0) throw new Error('python: ' + (r.stderr || '').slice(-1500));
  return JSON.parse(r.stdout);
}

const tasks = py(`
import json, sys
from break_the_grader.api import preflight, sample
from break_the_grader import __version__
g = preflight(range(64))
rows = sample(${N})
print(json.dumps({"version": __version__, "gate": g, "rows": rows}))
`);
if (!tasks.gate.ok) { console.error('forgery gate failed — refusing to spend'); process.exit(1); }
console.log(`gate green (${tasks.gate.planted} planted, 0 leaked) · package ${tasks.version} · ${N} tasks`);

const baseline = py(`
import json
from break_the_grader.api import sample, score
from break_the_grader.policies import POLICIES
from break_the_grader.task import make_task
rows = sample(${N})
out = []
for name, policy in POLICIES.items():
    tally, total, false = {}, 0.0, 0.0
    for r in rows:
        t = make_task(r["seed"])
        s = score(r["seed"], policy(r["prompt"]))
        total += s["reward"]; false += s["false_claim"]
        c = tally.setdefault(t.rung, [0, 0]); c[1] += 1; c[0] += 1 if s["reward"] >= 1 else 0
    out.append({"policy": name, "n": len(rows), "mean": total/len(rows),
                "solved": sum(c[0] for c in tally.values())/len(rows),
                "false_claims": int(false), "byRung": tally})
print(json.dumps(out))
`);

/* --- the budget wrapper: reserve, call, settle --- */
const state = { spent: 0, calls: 0, stopped: null };
function budgeted(spec) {
  const inner = A.anthropicModel(spec.id, { model: spec.model, maxTokens: MAXTOK, effort: spec.effort });
  return async function complete(prompt) {
    const reserve = A.worstCase(spec.model, Math.ceil(prompt.length / 4), MAXTOK);
    if (state.spent + reserve > CAP) {
      state.stopped = state.stopped || 'cap';
      const e = new Error('budget: reserving $' + reserve.toFixed(4) + ' would cross the $'
        + CAP.toFixed(2) + ' cap at $' + state.spent.toFixed(4) + ' spent — call not made');
      e.budget = true;
      throw e;
    }
    const r = await inner.complete(prompt);
    state.spent += A.costOf(spec.model, r.inTok, r.outTok);
    state.calls += 1;
    return r;
  };
}

(async () => {
  const runners = MODELS.map(m => ({ spec: m, call: budgeted(m) }));
  const replies = [];
  outer:
  for (const row of tasks.rows) {                 // by task, so a stop is level
    for (const { spec, call } of runners) {
      let r;
      try {
        r = await call(row.prompt);
      } catch (e) {
        if (e.budget || e.outOfCredit) { state.stopped = state.stopped || 'credit'; break outer; }
        replies.push({ seed: row.seed, model: spec.id, effort: spec.effort, maxTokens: MAXTOK,
                       error: String(e.message).slice(0, 200) });
        continue;
      }
      replies.push({ seed: row.seed, model: spec.id, effort: spec.effort, maxTokens: MAXTOK,
                     text: r.text, inTok: r.inTok, outTok: r.outTok, stopReason: r.stopReason,
                     truncated: r.truncated, refused: r.refused, servedBy: r.servedBy,
                     cost: A.costOf(spec.model, r.inTok, r.outTok) });
    }
    process.stdout.write(`\r  ${replies.length} calls · $${state.spent.toFixed(4)} of $${CAP.toFixed(2)}   `);
  }
  process.stdout.write('\n');

  /* scoring, in one pass, by the package */
  const scored = py(`
import json, sys
from break_the_grader.api import score
from break_the_grader.task import make_task
replies = json.load(sys.stdin)
out = []
for r in replies:
    t = make_task(r["seed"])
    row = dict(r, rung=t.rung, attackable=t.attackable, band=t.band,
               fact_id=t.fact.id, grader=t.grader.kind)
    if "text" in r:
        row.update(score(r["seed"], r["text"]))
    out.append(row)
print(json.dumps(out))
`, JSON.stringify(replies));

  const models = MODELS.map(m => {
    const mine = scored.filter(r => r.model === m.id);
    const usable = mine.filter(r => r.verdict && !r.truncated && !r.refused);
    const tally = {};
    for (const r of usable) {
      const c = tally[r.rung] || (tally[r.rung] = [0, 0]);
      c[1] += 1; c[0] += r.reward >= 1 ? 1 : 0;
    }
    return {
      id: m.id, model: m.model, effort: m.effort, maxTokens: MAXTOK,
      calls: mine.length, usable: usable.length,
      truncated: mine.filter(r => r.truncated).length,
      refused: mine.filter(r => r.refused).length,
      errors: mine.filter(r => r.error).length,
      mean: usable.length ? usable.reduce((s, r) => s + r.reward, 0) / usable.length : null,
      solved: usable.length ? usable.filter(r => r.reward >= 1).length / usable.length : null,
      false_claims: usable.filter(r => r.verdict === 'WRONG').length,
      unsupported: usable.filter(r => r.verdict === 'UNSUPPORTED').length,
      refused_parse: usable.filter(r => r.verdict === 'REFUSED_PARSE').length,
      byRung: tally,
      cost: mine.reduce((s, r) => s + (r.cost || 0), 0)
    };
  });

  const git = cp.execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  const record = {
    meta: {
      date: new Date().toISOString().slice(0, 10), git,
      package: 'break-the-grader', version: tasks.version,
      n: N, maxTokens: MAXTOK, cap: CAP,
      spent: Number(state.spent.toFixed(4)), calls: state.calls,
      stopped: state.stopped,
      note: 'Scored by the shipped package (break_the_grader.api.score); this runner '
          + 'chooses and pays for calls and decides nothing.'
    },
    gate: tasks.gate, baseline, models, rows: scored
  };
  const out = path.join(ROOT, 'certs/grader-pilot.json');
  fs.writeFileSync(out, JSON.stringify(record, null, 2) + '\n');

  console.log(`\n$${state.spent.toFixed(4)} of $${CAP.toFixed(2)} over ${state.calls} calls`
    + (state.stopped ? ` · STOPPED: ${state.stopped}` : '') + `\n`);
  const rungs = ['impossible', 'razor', 'narrow', 'wide'];
  console.log(['policy/model'.padEnd(18), 'n'.padStart(4), 'mean'.padStart(8), 'solved'.padStart(7),
               'false'.padStart(6), ...rungs.map(r => r.padStart(11))].join(' '));
  for (const b of baseline)
    console.log([b.policy.padEnd(18), String(b.n).padStart(4), b.mean.toFixed(3).padStart(8),
      (100 * b.solved).toFixed(0).padStart(6) + '%', String(b.false_claims).padStart(6),
      ...rungs.map(r => `${(b.byRung[r] || [0, 0])[0]}/${(b.byRung[r] || [0, 0])[1]}`.padStart(11))].join(' '));
  for (const m of models)
    console.log([m.id.padEnd(18), String(m.usable).padStart(4),
      (m.mean === null ? '—' : m.mean.toFixed(3)).padStart(8),
      (m.solved === null ? '—' : (100 * m.solved).toFixed(0) + '%').padStart(7),
      String(m.false_claims).padStart(6),
      ...rungs.map(r => `${(m.byRung[r] || [0, 0])[0]}/${(m.byRung[r] || [0, 0])[1]}`.padStart(11))].join(' ')
      + `   $${m.cost.toFixed(4)}${m.truncated ? ` · ${m.truncated} truncated` : ''}`);
  console.log(`\nwrote ${path.relative(ROOT, out)}`);
})();
