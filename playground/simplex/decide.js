#!/usr/bin/env node
/* decide.js — the exact decision, and the record the page reads.
   node playground/simplex/decide.js

   Nothing on the page is typed. This writes out/decision.json and the page
   reads it; re-run it and every number moves together or none of them do.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const R = require('./rational.js');
const A = require('./attn.js');

const HERE = __dirname;
const raw = fs.readFileSync(path.join(HERE, 'fixture.json'));
const fx = JSON.parse(raw);
const sha = crypto.createHash('sha256').update(raw).digest('hex');

/* the pin published with the source pack. A fixture that has drifted is a
   different fixture, and every number below would be about something else. */
const PIN = '4f15743ea33e7972fb91ed4df412c6cd71c5d8aeb57639d2717e22876c8a9ca3';

const scores = fx.scores.map(R.fromFloat);
const betas = fx.beta_grid.map(R.fromFloat);
const n = scores.length;
const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok, detail }); return ok; };

check('fixture sha256 matches the published pin', sha === PIN, sha.slice(0, 16) + '…');

/* --- the decision, exactly ------------------------------------------------ */
const rows = A.curveExact(scores, betas, A.P_PRIMARY, A.SCALES.rational.scale);
const PRs = rows.map((r) => r.PR);
check(`rational-kernel PR strictly decreases over ${betas.length} betas (p=${A.P_PRIMARY})`,
  A.strictlyDown(PRs), R.toNumber(PRs[0]).toFixed(9) + ' → ' + R.toNumber(PRs[PRs.length - 1]).toFixed(9));
check('the dual Σpᵢ² strictly increases', A.strictlyUp(rows.map((r) => r.S2)));
check('p = 1 decreases as well', A.strictlyDown(A.curveExact(scores, betas, 1, A.SCALES.rational.scale).map((r) => r.PR)));

/* --- the falsifiers: these MUST fail ------------------------------------- */
const mutants = {};
for (const key of ['flat', 'quadratic']) {
  const m = A.curveExact(scores, betas, A.P_PRIMARY, A.SCALES[key].scale);
  const down = A.strictlyDown(m.map((r) => r.PR));
  mutants[key] = { label: A.SCALES[key].label, down, PR: m.map((r) => R.toNumber(r.PR)) };
  check(`mutant "${A.SCALES[key].label}" fails strict decrease`, !down,
    key === 'flat' ? 'PR = ' + R.toNumber(m[0].PR) + ' at every β' : 'non-monotone through β = 3');
}
check('flat scores give PR = n exactly',
  R.cmp(A.railExact(scores.map(() => R.int(0)), A.P_PRIMARY).PR, R.int(n)) === 0, 'PR = ' + n);

/* --- softmax: float here, and calibrated against the fixture's own rows --- */
let worst = 0;
const soft = fx.beta_grid.map((b, i) => {
  const p = A.softmaxFloat(fx.scores, b);
  const pr = A.prFloat(p), h = A.entropyFloat(p);
  worst = Math.max(worst, Math.abs(pr - fx.rows[i].participation_ratio), Math.abs(h - fx.rows[i].entropy));
  return { beta: b, PR: pr, H: h };
});
check('our softmax reproduces the fixture’s stored rows', worst < 1e-12, 'worst Δ ' + worst.toExponential(2));
check('softmax PR decreases too (float view)', soft.every((r, i) => i === 0 || r.PR < soft[i - 1].PR));

/* --- what the page draws -------------------------------------------------- */
/* the certified grid, plus a float continuation past it — the row barely leaves
   the barycentre inside the grid, which is the honest finding, so the page can
   show where it eventually goes as long as it says which part is decided. */
const VIEW = [];
for (let i = 0; i <= 160; i++) {
  const b = 0.25 * Math.pow(400 / 0.25, i / 160);           // 0.25 → 400, log spaced
  const p = A.softmaxFloat(fx.scores, b);
  VIEW.push({ beta: b, w: p, PR: A.prFloat(p), H: A.entropyFloat(p), certified: b <= 8 + 1e-12 });
}
const top3 = fx.scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => x[1]);

const ok = checks.every((c) => c.ok);
const out = {
  meta: {
    source: 'sin-mfg/research/ml/attention-geometry — fixtures/frozen_attn_scores.json',
    what: 'one causal attention row (last query, layer 0, head 0) from a tiny GPT at seed 0',
    positions: n, seed: fx.seed, sha256: sha, p: A.P_PRIMARY,
    grid: fx.beta_grid, viewMaxBeta: 400,
    date: new Date().toISOString().slice(0, 10),
  },
  ok, checks,
  exact: rows.map((r, i) => ({ beta: fx.beta_grid[i], PR: R.toNumber(r.PR), S2: R.toNumber(r.S2), w: r.weights })),
  softmax: soft,
  mutants,
  view: VIEW,
  top3,
  contours: A.faceContours([1.05, 1.2, 1.5, 2, 2.5, 2.8, 2.95]),
};
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'out', 'decision.json'), JSON.stringify(out) + '\n');

for (const c of checks) console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? '   ' + c.detail : ''}`);
console.log(`\n${checks.filter((c) => c.ok).length}/${checks.length} · ${ok ? 'ALL CHECKS PASS' : 'FAILED'} · out/decision.json`);
process.exit(ok ? 0 : 1);
