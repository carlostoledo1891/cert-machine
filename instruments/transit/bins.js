/* bins.js — how the folded light curve is grouped, and why it is not uniform.
 *
 * A bin states ONE constraint: the mean depth over its time span. The kernel
 * must therefore be enclosed over that same span, so a wide bin buys a cheap
 * constraint and pays for it with a fat kernel. Where the curve is flat that
 * costs nothing; across ingress it costs everything, because the flux moves by
 * more across one wide bin than the noise moves in a hundred.
 *
 * So the edges are placed to keep the FLUX CHANGE across a bin below a target,
 * measured from the data rather than from a model: a coarse first pass gives a
 * slope, and the walk closes a bin when the accumulated change reaches the
 * target or the width reaches its cap. Fine at the limb crossings, coarse in
 * the flat parts, and no transit model anywhere in the decision.
 */
'use strict';

function edges(pts, opt = {}) {
  const target = opt.target || 40e-6, wMin = opt.wMin || 3 / 86400, wMax = opt.wMax || 400 / 86400;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
  /* coarse pass: uniform 60 s means, to get |dF/dt| without a model */
  const cw = 60 / 86400, nc = Math.max(4, Math.ceil((t1 - t0) / cw));
  const sum = new Float64Array(nc), cnt = new Float64Array(nc);
  for (const p of pts) { const i = Math.min(nc - 1, Math.floor((p.t - t0) / (t1 - t0) * nc)); sum[i] += p.f; cnt[i]++; }
  const mid = [], val = [];
  for (let i = 0; i < nc; i++) if (cnt[i] > 0) { mid.push(t0 + (i + 0.5) * (t1 - t0) / nc); val.push(sum[i] / cnt[i]); }
  const slope = t => {                                  /* |dF/dt| by nearest secant */
    let i = 0; while (i < mid.length - 2 && mid[i + 1] < t) i++;
    const j = Math.min(mid.length - 1, i + 1);
    return Math.abs((val[j] - val[i]) / Math.max(1e-9, mid[j] - mid[i]));
  };
  const E = [t0];
  let t = t0;
  while (t < t1) {
    const s = slope(t);
    let w = s > 0 ? target / s : wMax;
    w = Math.max(wMin, Math.min(wMax, w));
    t = Math.min(t1, t + w);
    E.push(t);
  }
  if (E[E.length - 1] < t1) E.push(t1);
  return E;
}

module.exports = { edges };
