/* fit.js — the conventional analysis, run here so the comparison is fair.
 *
 * Not part of the enclosure. Its job is to answer two questions the enclosure
 * cannot answer about itself:
 *
 *   1. Does the pipeline reproduce what the field gets? If a quadratic
 *      limb-darkening fit of THIS extracted curve lands on the published radius
 *      ratio, the extraction is sound. If it does not, nothing downstream means
 *      anything. (Check the harness first.)
 *   2. How wide must the error budget be so that the field's own model is NOT
 *      refused? A budget that refutes the conventional solution is a broken
 *      budget, not a strong result — so the budget is measured, not chosen.
 */
'use strict';
const T = require('./transit.js');

/* quadratic law: I(mu) = 1 - u1 (1-mu) - u2 (1-mu)^2, mu = sqrt(1-r^2) */
function quadMeasure(u1, u2, NR = 3000) {
  const w = new Float64Array(NR), r = new Float64Array(NR);
  let n = 0;
  for (let i = 0; i < NR; i++) {
    r[i] = (i + 0.5) / NR;
    const mu = Math.sqrt(Math.max(0, 1 - r[i] * r[i]));
    const Iv = 1 - u1 * (1 - mu) - u2 * (1 - mu) * (1 - mu);
    w[i] = 2 * Math.PI * r[i] * Iv / NR; n += w[i];
  }
  for (let i = 0; i < NR; i++) w[i] /= n;
  return { r, w };
}
const depthOf = (M, z, k) => { let s = 0; for (let i = 0; i < M.r.length; i++) s += T.arcFrac(M.r[i], z, k) * M.w[i]; return s; };

function score(bins, M, k, aR, b, P, sys) {
  let c2 = 0, mx = 0, se = 0;
  for (const bn of bins) {
    const v = depthOf(M, T.zOf(bn.tmid, aR, b, P), k);
    const e = (v - (1 - bn.f)) / (bn.sigma + sys);
    c2 += e * e; se += (v - (1 - bn.f)) * (v - (1 - bn.f)) * 1e12;
    if (Math.abs(e) > mx) mx = Math.abs(e);
  }
  return { chi2dof: c2 / bins.length, worstSigma: mx, rmsPpm: Math.sqrt(se / bins.length) };
}

/* coordinate descent from a stated start; deterministic, no randomness */
function fit(bins, start, P, sys) {
  let x = start.slice();
  let step = [0.15, 0.15, 0.004, 0.35, 0.02];
  const at = v => score(bins, quadMeasure(v[0], v[1]), v[2], v[3], v[4], P, sys).chi2dof;
  let f = at(x);
  for (let it = 0; it < 90; it++) {
    let moved = false;
    for (let i = 0; i < 5; i++) for (const s of [1, -1]) {
      const y = x.slice(); y[i] += s * step[i];
      if (y[0] < 0 || y[1] < -0.6 || y[2] <= 0.01 || y[3] < 2 || y[4] < 0 || y[4] > 0.999) continue;
      const g = at(y);
      if (g < f - 1e-12) { f = g; x = y; moved = true; }
    }
    if (!moved) for (let i = 0; i < 5; i++) step[i] *= 0.55;
  }
  const s = score(bins, quadMeasure(x[0], x[1]), x[2], x[3], x[4], P, sys);
  return { u1: x[0], u2: x[1], k: x[2], aR: x[3], b: x[4], ...s };
}

module.exports = { quadMeasure, depthOf, score, fit };
