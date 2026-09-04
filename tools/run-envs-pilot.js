#!/usr/bin/env node
/* run-envs-pilot.js — the §6 pilot: real models against the two environments,
   under a HARD spend cap.
   tools/ · cert-machine

   THE CAP IS THE POINT. Before every call the runner RESERVES that call's worst
   case — prompt tokens plus the full max_tokens at the model's own rate — and
   refuses to start it if the reservation would cross the cap. Spend can
   therefore never exceed the cap; it can only come in under it. A 402 or any
   credit/quota error stops the run the same way. Partial runs are recorded as
   partial, never padded.

   ORDERING is by rung, not by model: if the budget stops the run, every model
   has been measured on the same rungs, which is comparable. Running one model
   to completion first would produce a table with a hole shaped like a model.

   HARNESS ARTIFACTS ARE NOT MODEL OUTCOMES. A reply truncated by our own
   max_tokens is recorded and excluded from the pass rate, exactly as the eval
   board excludes its budget-exhausted rows.

   usage: ENVS_ALLOW_NETWORK=1 node tools/run-envs-pilot.js [k] [--cap 11.80] */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const H = require(path.join(ROOT, 'instruments/envs/harness.js'));
const A = require(path.join(ROOT, 'instruments/envs/anthropic.js'));
const EU = require(path.join(ROOT, 'instruments/envs/env-uniformity.js'));
const EC = require(path.join(ROOT, 'instruments/envs/env-canary.js'));

const argv = process.argv.slice(2);
const K = Number(argv.find(a => /^\d+$/.test(a)) || 8);
const capArg = argv.indexOf('--cap');
const CAP = Number(capArg >= 0 ? argv[capArg + 1] : (process.env.ENVS_CAP_USD || 11.80));
if (!(CAP > 0)) { console.error('cap must be positive'); process.exit(1); }
/* PILOT FINDING, 2026-09-03, and the reason for both settings below. At the
   default effort the 5-family spends the whole 4096-token reply on adaptive
   thinking and emits nothing parseable: every uniformity call from Opus 5 and
   Sonnet 5 truncated, at ~$0.105 each, for zero information. At effort "low"
   the SAME task answers in 311 tokens for about a cent. So: effort low where
   the model supports it, and a max_tokens with headroom over the largest
   observed reply (311) rather than over nothing.
   Haiku 4.5 takes NO effort parameter — it errors — and has no thinking, so it
   runs bare. That difference is real, is recorded on every row, and has to be
   read with the table rather than hidden inside it. */
const MAXTOK = Number(process.env.ENVS_MAXTOK || 3000);
const MODELS = [
  { id: 'claude-opus-5', model: 'claude-opus-5', effort: 'low' },
  { id: 'claude-sonnet-5', model: 'claude-sonnet-5', effort: 'low' },
  { id: 'claude-haiku-4-5', model: 'claude-haiku-4-5', effort: null }
];

const state = { spent: 0, calls: 0, stopped: null, cell: null };

/* the budget wrapper: reserve, call, settle */
function budgeted(spec) {
  const inner = A.anthropicModel(spec.id, { model: spec.model, maxTokens: MAXTOK, effort: spec.effort });
  return {
    id: spec.id, kind: 'anthropic', model: spec.model,
    async complete(prompt, meta) {
      const promptTok = Math.ceil(prompt.length / 4);
      const reserve = A.worstCase(spec.model, promptTok, MAXTOK);
      if (state.spent + reserve > CAP) {
        state.stopped = state.stopped || 'cap';
        const e = new Error('budget: reserving $' + reserve.toFixed(4) + ' would cross the $' + CAP.toFixed(2)
          + ' cap at $' + state.spent.toFixed(4) + ' spent — call not made');
        e.budget = true;
        throw e;
      }
      let r;
      try { r = await inner.complete(prompt, meta); }
      catch (e) { if (e.outOfCredit) { state.stopped = 'credit'; } throw e; }
      state.spent += A.costOf(spec.model, r.inTok, r.outTok);
      state.calls++;
      if (state.cell) {
        if (r.truncated) state.cell.truncated++;
        if (r.refused) state.cell.refused++;
      }
      return r;
    }
  };
}

(async () => {
  if (process.env.ENVS_ALLOW_NETWORK !== '1') {
    console.error('ENVS_ALLOW_NETWORK is not 1 — this run would send prompts off the machine. Refusing.');
    process.exit(1);
  }
  /* the forgery gate runs BEFORE any model is called: if a grader is unsound,
     every dollar spent after it buys a number that means nothing */
  for (const env of [EU, EC]) {
    const g = H.forgeryGate(env);
    console.log(env.name + ': ' + g.total + ' forgeries planted, ' + g.leaked + ' leaked -> ' + (g.ok ? 'GATE GREEN' : 'GATE FAILED'));
    if (!g.ok) { console.error('a forgery leaked — refusing to spend anything'); process.exit(1); }
  }
  console.log('\nPILOT · cap $' + CAP.toFixed(2) + ' · k=' + K + ' · ' + MODELS.length + ' models · max_tokens ' + MAXTOK);
  console.log('worst case if nothing stops it: $'
    + (MODELS.reduce((a, m) => a + A.worstCase(m.model, 320, MAXTOK) * K * 8, 0)).toFixed(2) + '\n');

  const cells = [];
  const seed0 = 20260903;
  /* the attacker ladder first: it is the cheaper environment and the novel one,
     so a budget stop leaves the more interesting table complete. ENVS_ONLY
     restricts the run to one environment — used to re-measure a single
     environment after a harness setting changed, without repaying for the
     other. */
  const ONLY = process.env.ENVS_ONLY || null;
  const RUN = [EC, EU].filter(e => !ONLY || e.name === ONLY);
  if (!RUN.length) { console.error('ENVS_ONLY names no environment: ' + ONLY); process.exit(1); }
  outer:
  for (const env of RUN) {
    const ONLYR = process.env.ENVS_RUNGS ? process.env.ENVS_RUNGS.split(',') : null;
    for (const rung of env.rungs.filter(r => !ONLYR || ONLYR.includes(r.id))) {
      for (const spec of MODELS) {
        state.cell = { truncated: 0, refused: 0 };
        const model = budgeted(spec);
        const cell = await H.runCell(env, rung, model, K, seed0, {});
        cell.truncated = state.cell.truncated;
        cell.apiRefused = state.cell.refused;
        cell.costUsd = Number(state.spent.toFixed(6));
        cells.push(cell);
        const budgetRows = cell.rows.filter(r => /^budget:/.test(r.note || '')).length;
        console.log('  ' + (env.name + '/' + rung.id).padEnd(24) + spec.id.padEnd(18)
          + 'solved ' + String(cell.solved).padStart(2) + '/' + K
          + '  wrong ' + String(cell.wrong).padStart(2)
          + '  refused ' + String(cell.refusedParse).padStart(2)
          + (cell.truncated ? '  trunc ' + cell.truncated : '')
          + (budgetRows ? '  BUDGET-STOPPED ' + budgetRows : '')
          + '   spent $' + state.spent.toFixed(4));
        if (state.stopped) break outer;
      }
    }
  }

  const sweep = { at: new Date().toISOString(), seed: seed0, cells };
  const n = H.appendLedger(path.join(ROOT, 'certs', 'envs-ledger.jsonl'), sweep, {
    envVersion: 'pilot-v1', maxTokens: MAXTOK, capUsd: CAP, real: true,
    effortNote: 'effort=low on Opus 5 and Sonnet 5; Haiku 4.5 takes no effort parameter and runs without thinking',
    thinkingNote: 'no thinking parameter sent: each model runs its own default (Opus 5 and Sonnet 5 adaptive, Haiku 4.5 none)'
  });
  console.log('\n' + n + ' ledger rows appended · ' + state.calls + ' calls · $' + state.spent.toFixed(4)
    + ' of $' + CAP.toFixed(2) + (state.stopped ? ' · STOPPED BY ' + state.stopped.toUpperCase() : ' · completed'));
})().catch(e => { console.error('PILOT FAILED: ' + e.message); process.exit(1); });
