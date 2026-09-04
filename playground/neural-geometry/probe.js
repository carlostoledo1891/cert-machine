#!/usr/bin/env node
/* probe.js — elicit a dissimilarity matrix from a working model, one row at a time.
   ENVS_ALLOW_NETWORK=1 node playground/neural-geometry/probe.js [--cap 2.00]

   WHY ROW AT A TIME. Asking for the whole matrix in one call is cheaper and
   worse: the model can enforce its own symmetry by looking at what it just
   wrote. Asked row by row, D[i][j] and D[j][i] come from two independent calls
   that never see each other — so agreement between them is a consistency test
   we did not ask for and cannot be given for free. A model with no geometry
   behind its answers has no reason to be symmetric.

   THE SCALE IS INTEGERS ON PURPOSE. Every answer is a whole number 0–100, so
   the matrix is exact rational data and every decision downstream is exact
   arithmetic on integers rather than a threshold on floats.

   THE CAP. Each call's worst case is reserved before it is made, so spend
   cannot cross the cap; it can only come in under. Per process.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const ROOT = path.join(HERE, '..', '..');
const A = require(path.join(ROOT, 'instruments/envs/anthropic.js'));
const SETS = require('./sets.js');

const argv = process.argv.slice(2);
const capArg = argv.indexOf('--cap');
const CAP = Number(capArg >= 0 ? argv[capArg + 1] : (process.env.NG_CAP_USD || 2.00));
const MAXTOK = Number(process.env.NG_MAXTOK || 700);
const MODELS = [
  { id: 'claude-opus-5', model: 'claude-opus-5', effort: 'low' },
  { id: 'claude-sonnet-5', model: 'claude-sonnet-5', effort: 'low' },
  { id: 'claude-haiku-4-5', model: 'claude-haiku-4-5', effort: null },
];

const PROMPT = (item, others) => `Rate how DIFFERENT each of the following is from "${item}".

Use a whole number from 0 to 100, where 0 means identical and 100 means maximally different — as different as any two things in this list could be.

Judge them as the concepts they are, not as strings of letters.

${others.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Answer with JSON only, and nothing else:
{"ratings": [${others.map(() => 'n').join(', ')}]}`;

const state = { spent: 0, calls: 0, stopped: null };
function budgeted(spec) {
  const inner = A.anthropicModel(spec.id, { model: spec.model, maxTokens: MAXTOK, effort: spec.effort });
  return async (prompt) => {
    const reserve = A.worstCase(spec.model, Math.ceil(prompt.length / 4), MAXTOK);
    if (state.spent + reserve > CAP) { state.stopped = state.stopped || 'cap'; const e = new Error('cap'); e.budget = true; throw e; }
    const r = await inner.complete(prompt);
    state.spent += A.costOf(spec.model, r.inTok, r.outTok);
    state.calls += 1;
    return r;
  };
}

function parseRow(text, k) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  let o;
  try { o = JSON.parse(m[0]); } catch (e) { return null; }
  const a = o.ratings;
  if (!Array.isArray(a) || a.length !== k) return null;
  if (!a.every((x) => Number.isInteger(x) && x >= 0 && x <= 100)) return null;
  return a;
}

/* REPAIR asks again only for the rows that came back unparseable, and touches
   nothing else. A single row that a model fumbled should not cost a re-run of
   four hundred calls, and quietly dropping the cell would leave a hole in the
   table that reads like a finding. */
const REPAIR = argv.includes('--repair');

(async () => {
  if (REPAIR) {
    const rec = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'probe.json'), 'utf8'));
    let fixed = 0, tried = 0;
    for (const M of rec.models) {
      const spec = MODELS.find((x) => x.id === M.id);
      if (!spec) continue;
      const call = budgeted(spec);
      for (const S of SETS) {
        const cell = M.sets[S.id];
        if (!cell) continue;
        for (let i = 0; i < cell.n; i++) {
          if (!cell.raw[i].some((x) => x === null)) continue;
          tried++;
          const others = S.items.filter((_, j) => j !== i);
          let r;
          try { r = await call(PROMPT(S.items[i], others)); } catch (e) { continue; }
          const vals = parseRow(r.text, S.items.length - 1);
          if (!vals) { console.log(`  still unparseable: ${M.id} · ${S.id} · row ${i}`); continue; }
          let k = 0;
          for (let j = 0; j < cell.n; j++) { if (j === i) { cell.raw[i][j] = 0; continue; } cell.raw[i][j] = vals[k++]; }
          cell.refused = Math.max(0, (cell.refused || 0) - 1);
          fixed++;
          console.log(`  repaired: ${M.id} · ${S.id} · row ${i} (${S.items[i]})`);
        }
      }
    }
    rec.meta.spent = Number(((rec.meta.spent || 0) + state.spent).toFixed(4));
    rec.meta.calls = (rec.meta.calls || 0) + state.calls;
    rec.meta.repairs = (rec.meta.repairs || 0) + fixed;
    fs.writeFileSync(path.join(HERE, 'out', 'probe.json'), JSON.stringify(rec) + '\n');
    console.log(`\n${fixed}/${tried} repaired · +$${state.spent.toFixed(4)} · total $${rec.meta.spent.toFixed(4)} over ${rec.meta.calls} calls`);
    return;
  }
  const out = { meta: { date: new Date().toISOString().slice(0, 10), cap: CAP, maxTokens: MAXTOK, scale: 100 }, models: [] };
  outer:
  for (const spec of MODELS) {
    const call = budgeted(spec);
    const rec = { id: spec.id, model: spec.model, effort: spec.effort, sets: {} };
    for (const S of SETS) {
      const n = S.items.length;
      const raw = Array.from({ length: n }, () => Array(n).fill(null));
      let refused = 0;
      for (let i = 0; i < n; i++) {
        const others = S.items.filter((_, j) => j !== i);
        let r;
        try { r = await call(PROMPT(S.items[i], others)); }
        catch (e) { if (e.budget || e.outOfCredit) { state.stopped = state.stopped || 'credit'; break outer; } refused++; continue; }
        const vals = parseRow(r.text, n - 1);
        if (!vals) { refused++; continue; }
        let k = 0;
        for (let j = 0; j < n; j++) { if (j === i) { raw[i][j] = 0; continue; } raw[i][j] = vals[k++]; }
        process.stdout.write(`\r  ${spec.id} · ${S.id} · row ${i + 1}/${n} · $${state.spent.toFixed(4)}   `);
      }
      rec.sets[S.id] = { raw, refused, n };
    }
    out.models.push(rec);
  }
  process.stdout.write('\n');
  out.meta.spent = Number(state.spent.toFixed(4));
  out.meta.calls = state.calls;
  out.meta.stopped = state.stopped;
  fs.writeFileSync(path.join(HERE, 'out', 'probe.json'), JSON.stringify(out) + '\n');
  console.log(`$${state.spent.toFixed(4)} of $${CAP.toFixed(2)} over ${state.calls} calls`
    + (state.stopped ? ` · STOPPED: ${state.stopped}` : '') + ` → out/probe.json`);
})();
