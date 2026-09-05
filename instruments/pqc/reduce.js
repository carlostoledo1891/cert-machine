/* reduce.js — run LLL on a real challenge basis and record what it did.
 *   node experiments/pqc-geometry/reduce.js [--dim 40] [--snaps 140]
 *
 * THE SPLIT THIS PAGE IS ABOUT.
 * The reduction is a SEARCH and the claim about its output is a CLAIM, and they
 * do not need the same arithmetic. Here both are exact anyway, for a reason
 * worth recording: floating-point Gram–Schmidt does not survive first contact
 * with these lattices. A challenge basis of dimension 40 carries a 121-digit
 * modulus in one row and unit entries in the others — 121 orders of dynamic
 * range against a double's sixteen digits — and the orthogonalisation collapses
 * on the first step. That is a property of the lattice, not a bug to patch.
 *
 * So this runs Cohen's integral LLL: every quantity is an integer, every
 * division is exact by construction, and no float touches the search. The Gram
 * determinants d[i] carry ‖b*_i‖² = d[i+1]/d[i] exactly, so even the profile
 * drawn on the page is a ratio of integers rather than a measurement.
 *
 * So the page can draw the two in different inks: the profile the reduction
 * actually reached, and the profile the standard heuristic predicts it should
 * reach. One is measured, the other is assumed, and nobody usually says which is
 * which.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { parse, determinant } = require('./basis.js');
const { decide, ratioBracket, toDecimal } = require('./gh.js');

const arg = (f, d) => { const i = process.argv.indexOf(f); return i > 0 ? +process.argv[i + 1] : d; };
const DIM = arg('--dim', 40), SNAPS = arg('--snaps', 140), DELTA = 0.99;

const text = fs.readFileSync(path.join(__dirname, 'data', `svp-dim${DIM}-seed0.txt`), 'utf8');
const B = parse(text);
const det = determinant(B);
if (!det.ok) throw new Error('determinant refused: ' + det.why);
const n = det.n, q = det.q;

/* ---- exact quantities, always from the BigInt basis ---- */
const norm2 = (v) => v.reduce((t, x) => t + x * x, 0n);
const shortest = () => { let best = null; for (const r of B) { const s = norm2(r); if (s > 0n && (best === null || s < best)) best = s; } return best; };
const dot = (u, v) => { let t = 0n; for (let i = 0; i < u.length; i++) t += u[i] * v[i]; return t; };
const abs = (x) => x < 0n ? -x : x;
/* round-half-up division of exact integers */
function nearest(a, b) {
  let q = a / b, r = a - q * b;
  if (r < 0n) { q -= 1n; r += b; }
  if (2n * r >= b) q += 1n;
  return q;
}
/* log10 of a BigInt, good to a few digits — for drawing only, never for a claim */
function log10big(x) {
  if (x <= 0n) return -Infinity;
  const s = x.toString();
  return s.length - 1 + Math.log10(Number(s.slice(0, 17)) / 10 ** (Math.min(17, s.length) - 1));
}

/* ---- Cohen, Algorithm 2.6.7: LLL entirely over the integers ---------------
   d[i] is the Gram determinant of the first i vectors and lam[i][j] = d[j+1]·μ_ij,
   so every division below is exact. δ = 3/4, the value the integral form is
   written for. */
const d = new Array(n + 1).fill(0n);
const lam = Array.from({ length: n }, () => new Array(n).fill(0n));
d[0] = 1n; d[1] = dot(B[0], B[0]);
let kmax = 0;

function RED(k, l) {
  if (2n * abs(lam[k][l]) <= d[l + 1]) return;
  const qq = nearest(lam[k][l], d[l + 1]);
  for (let i = 0; i < n; i++) B[k][i] -= qq * B[l][i];
  lam[k][l] -= qq * d[l + 1];
  for (let i = 0; i < l; i++) lam[k][i] -= qq * lam[l][i];
}
function SWAP(k) {
  const t = B[k]; B[k] = B[k - 1]; B[k - 1] = t;
  if (k > 1) for (let j = 0; j <= k - 2; j++) { const u = lam[k][j]; lam[k][j] = lam[k - 1][j]; lam[k - 1][j] = u; }
  const l = lam[k][k - 1];
  const Bk = (d[k - 1] * d[k + 1] + l * l) / d[k];
  for (let i = k + 1; i <= kmax; i++) {
    const tt = lam[i][k];
    lam[i][k] = (d[k + 1] * lam[i][k - 1] - l * tt) / d[k];
    lam[i][k - 1] = (Bk * tt + l * lam[i][k]) / d[k + 1];
  }
  d[k] = Bk;
}
/* ‖b*_i‖² = d[i+1]/d[i], exactly */
const profile = () => Array.from({ length: n }, (_, i) =>
  d[i] > 0n && d[i + 1] > 0n ? +((log10big(d[i + 1]) - log10big(d[i])) / 2).toFixed(4) : 0);

const snaps = [];
function snap(step, swaps) {
  const s = shortest();
  snaps.push({ step, swaps, profile: profile(), minNorm2: s.toString(), minNorm: Math.sqrt(Number(s)) });
}

let k = 1, steps = 0, swaps = 0;
const t0 = Date.now();
snap(0, 0);
while (k < n) {
  if (k > kmax) {
    kmax = k;
    for (let j = 0; j <= k; j++) {
      let u = dot(B[k], B[j]);
      for (let i = 0; i < j; i++) u = (d[i + 1] * u - lam[k][i] * lam[j][i]) / d[i];
      if (j < k) lam[k][j] = u; else d[k + 1] = u;
    }
    if (d[k + 1] === 0n) throw new Error('basis vectors are dependent');
  }
  RED(k, k - 1);
  if (4n * (d[k + 1] * d[k - 1] + lam[k][k - 1] * lam[k][k - 1]) < 3n * d[k] * d[k]) {
    SWAP(k); swaps++; k = Math.max(1, k - 1);
  } else {
    for (let l = k - 2; l >= 0; l--) RED(k, l);
    k++;
  }
  steps++;
  if (steps % 2 === 0 && snaps.length < SNAPS) snap(steps, swaps);
  if (Date.now() - t0 > 150000) { console.log('  (time limit reached)'); break; }
}
snap(steps, swaps);

/* ---- the heuristic, for the dashed line ----
   The Geometric Series Assumption: after reduction the log profile is a straight
   line, ‖b*_i‖ = δ₀^(n−1−2i) · det^(1/n), with δ₀ the root-Hermite factor. For
   LLL the textbook figure is 1.0219, measured on random lattices and asserted
   everywhere since. It is not a theorem and it is drawn dashed. */
const D0 = 1.0219;
const logDet = log10big(q);
const gsa = Array.from({ length: n }, (_, i) => (n - 1 - 2 * i) * Math.log10(D0) + logDet / n);

/* ---- what was actually found, decided exactly ---- */
const finalN2 = shortest();
const br = ratioBracket(n, q, finalN2, 1n);
const verdict = decide(n, q, finalN2, 1n);
/* the same for the published record at this dimension */
const out = {
  dim: n, seed: 0, qDigits: q.toString().length, logDet,
  delta: DELTA, steps, swaps, ms: Date.now() - t0,
  snaps, gsa, d0: D0,
  final: {
    norm2: finalN2.toString(),
    norm: Math.sqrt(Number(finalN2)),
    ratioLo: toDecimal(br.loNum, br.den, 6), ratioHi: toDecimal(br.hiNum, br.den, 6),
    verdict,
  },
};
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', `reduce-${n}.json`), JSON.stringify(out));

console.log(`LLL on the real dimension-${n} challenge basis (q has ${out.qDigits} digits)`);
console.log(`  ${steps} steps, ${swaps} swaps, ${(out.ms / 1000).toFixed(1)} s, ${snaps.length} snapshots`);
console.log(`  start ‖b₀‖² had ${snaps[0].minNorm2.length} digits, ended with ${snaps[snaps.length - 1].minNorm2.length}`);
const detNow = d[n];
console.log(`  lattice preserved: det² = q²  ${detNow === q * q ? 'YES' : 'NO — ' + detNow}`);
console.log(`  found ‖v‖² = ${finalN2}  (‖v‖ ≈ ${out.final.norm.toFixed(1)})`);
console.log(`  exact ‖v‖/GH ∈ [${out.final.ratioLo}, ${out.final.ratioHi}]  →  ${verdict} at f = 1.05`);
console.log(`  the published record at this dimension is norm 1273`);
