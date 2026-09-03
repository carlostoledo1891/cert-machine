/* ENVS — harness.js: the shared model harness.  MIT, clean-room.
   Built in frontier-apps for porting to cert-machine.

   WHY THIS EXISTS.  Before today both environments were closed systems of hand-written solvers:
   there was no model client anywhere in this repository, so no rung/model table could exist at all.
   This file is the missing middle — one harness that every environment plugs into, so that the
   prompt, the parser, the grader and the ledger are IDENTICAL across models and backends.  That
   sameness is the credibility of the eventual table; most published evals leak it by letting each
   model have its own prompt or its own parser.

   NETWORK IS OFF BY DEFAULT.  A model call sends the prompt off this machine.  The bench's standing
   rule is that nothing leaves without an explicit decision, so callModel() REFUSES to reach the
   network unless ENVS_ALLOW_NETWORK=1 is set.  Everything here is exercised end-to-end offline
   against stub models; flipping the switch is the operator's call, not the harness's.

   THE ENVIRONMENT INTERFACE.  An environment is an object:
       name           string
       rungs          [{ id, label, note }]           monotone difficulty, easiest first
       makeTask       (rungId, seed) -> task          DETERMINISTIC from (rungId, seed)
       renderPrompt   (task) -> string                identical for every model
       parse          (text) -> {ok:true, submission} | {ok:false, why}
       grade          (task, submission) -> { score, verdict, note }
       forgeries      (rungId) -> [{ task, submission, why }]   must ALL fail, or the run aborts
   Scores are in [-1, 1]; the harness treats score >= 1 as "solved" for pass-rate purposes and
   distinguishes PARSE-REFUSED from graded-wrong, because conflating them is how an eval reports a
   model as wrong when it was merely unreadable.                                                    */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');

/* ------------------------------------------------------------------ statistics */
/* Wilson score interval. At k = 64 a 2.9% pass rate is 1.9 successes and its 95% interval runs to
   about 10% — so a bare point estimate at this k is not a measurement, it is a decoration. The
   harness therefore refuses to report a rate without one. */
function wilson(x, n, z = 1.96) {
  if (!n) return { p: 0, lo: 0, hi: 0, n: 0, x: 0 };
  const p = x / n, z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z / denom) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
  return { p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half), n, x };
}
const fmtCI = w => `${(100 * w.p).toFixed(1)}% [${(100 * w.lo).toFixed(1)}–${(100 * w.hi).toFixed(1)}]`;

/* ------------------------------------------------------------------ models */
/* Every model is { id, kind, complete(prompt, opts) -> {text, inTok, outTok} }.
   Stubs let the whole pipeline be exercised, calibrated and page-built with no network and no spend.
   They are also the honest reference points for a sweep: "what does a pure sampler score" is a row
   a buyer wants, and it costs nothing. */
function stubModel(id, fn) {
  return { id, kind: 'stub', async complete(prompt, opts) { const text = fn(prompt, opts); return { text, inTok: Math.ceil(prompt.length / 4), outTok: Math.ceil(text.length / 4) }; } };
}

/* the OpenAI-compatible client: one code path for hosted APIs and for vLLM on your own GPUs */
function apiModel(id, { baseUrl, apiKey, model, temperature = 1, effort = null, maxTokens = 4096 }) {
  return {
    id, kind: 'api', model, temperature, effort,
    async complete(prompt) {
      if (process.env.ENVS_ALLOW_NETWORK !== '1')
        throw new Error(`network is disabled: a model call would send the prompt off this machine. ` +
          `Set ENVS_ALLOW_NETWORK=1 to allow it (this is a deliberate, per-run decision).`);
      const body = { model, messages: [{ role: 'user', content: prompt }], temperature, max_tokens: maxTokens };
      if (effort) body.reasoning_effort = effort;
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${id}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      const j = await res.json();
      return {
        text: j.choices?.[0]?.message?.content ?? '',
        inTok: j.usage?.prompt_tokens ?? 0,
        outTok: j.usage?.completion_tokens ?? 0,
      };
    },
  };
}

/* ------------------------------------------------------------------ the forgery gate */
/* Planted before any model is called. Each forgery is a submission that MUST NOT grade as solved.
   If one does, the environment's grader is unsound and every number the run would produce is void,
   so the run aborts rather than reporting. This is the one check whose failure is not a data point. */
function forgeryGate(env) {
  const results = [];
  for (const r of env.rungs) {
    for (const f of env.forgeries(r.id)) {
      let g;
      try { g = env.grade(f.task, f.submission); } catch (e) { g = { score: -1, verdict: 'THREW', note: e.message }; }
      const passed = g.score >= 1;
      results.push({ rung: r.id, why: f.why, verdict: g.verdict, score: g.score, leaked: passed });
    }
  }
  const leaked = results.filter(r => r.leaked);
  return { total: results.length, leaked: leaked.length, results, ok: leaked.length === 0 };
}

/* ------------------------------------------------------------------ the rollout runner */
async function runCell(env, rung, model, k, seed0, opts = {}) {
  const rows = [];
  for (let i = 0; i < k; i++) {
    const seed = seed0 + i * 7919;
    const task = env.makeTask(rung.id, seed);
    const prompt = env.renderPrompt(task);
    let text = '', inTok = 0, outTok = 0, err = null;
    /* task is passed for STUB models only — a real model sees nothing but the prompt string.
       Stubs need it to synthesise a realistic answer without a network call. */
    try { const r = await model.complete(prompt, { rung: rung.id, seed, task }); text = r.text; inTok = r.inTok; outTok = r.outTok; }
    catch (e) { err = e.message; }
    let verdict, score, note;
    if (err) { verdict = 'ERROR'; score = 0; note = err; }
    else {
      const p = env.parse(text);
      if (!p.ok) { verdict = 'REFUSED_PARSE'; score = 0; note = p.why; }
      else { const g = env.grade(task, p.submission); verdict = g.verdict; score = g.score; note = g.note; }
    }
    rows.push({ env: env.name, rung: rung.id, model: model.id, seed, verdict, score, note, inTok, outTok });
    if (opts.onRow) opts.onRow(rows[rows.length - 1]);
  }
  const solved = rows.filter(r => r.score >= 1).length;
  const refusedParse = rows.filter(r => r.verdict === 'REFUSED_PARSE').length;
  const abstained = rows.filter(r => r.verdict === 'UNDECIDED').length;
  const wrong = rows.filter(r => r.score < 0).length;
  const inTok = rows.reduce((a, r) => a + r.inTok, 0), outTok = rows.reduce((a, r) => a + r.outTok, 0);
  return {
    env: env.name, rung: rung.id, model: model.id, k,
    solved, wrong, abstained, refusedParse,
    pass: wilson(solved, rows.length),
    /* refusal rate is reported against FAILURES, not against all attempts: the interesting question
       is "when it did not solve, did it say so or did it guess", and the denominator has to say so. */
    refusalOfFailures: wilson(refusedParse + abstained, Math.max(1, rows.length - solved)),
    inTok, outTok, rows,
  };
}

async function sweep(envs, models, { k = 16, seed = 20260903, onCell } = {}) {
  const gates = {}, cells = [];
  for (const env of envs) {
    const gate = forgeryGate(env);
    gates[env.name] = gate;
    if (!gate.ok) {
      throw new Error(`FORGERY GATE FAILED for ${env.name}: ${gate.leaked} of ${gate.total} planted ` +
        `forgeries graded as solved. The grader is unsound; aborting before any model is called.`);
    }
  }
  for (const env of envs) for (const rung of env.rungs) for (const model of models) {
    const cell = await runCell(env, rung, model, k, seed);
    cells.push(cell);
    if (onCell) onCell(cell);
  }
  return { gates, cells, k, seed, at: new Date().toISOString() };
}

/* ------------------------------------------------------------------ the ledger */
/* Append-only, one JSON object per line, each row carrying everything needed to re-run it:
   model id and kind, temperature/effort where they exist, seed, verdict, tokens. A sweep that
   cannot be re-derived from its own ledger is a screenshot, not a measurement. */
function appendLedger(file, sweepResult, meta = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = [];
  for (const c of sweepResult.cells) {
    const { rows, pass, refusalOfFailures, ...head } = c;
    const rec = {
      ...head, at: sweepResult.at, seed: sweepResult.seed,
      passP: pass.p, passLo: pass.lo, passHi: pass.hi,
      refusalP: refusalOfFailures.p,
      ...meta,
    };
    rec.sha = crypto.createHash('sha256').update(JSON.stringify(rec)).digest('hex').slice(0, 16);
    lines.push(JSON.stringify(rec));
  }
  fs.appendFileSync(file, lines.join('\n') + '\n');
  return lines.length;
}

module.exports = { wilson, fmtCI, stubModel, apiModel, forgeryGate, runCell, sweep, appendLedger };
