/* centre.js — put the fold where the data say, using nothing but symmetry.
 *
 * The archive ephemeris left the folded curve of TrES-2 b asymmetric by 136 ppm
 * rms, three times its own measured out-of-transit scatter. A mis-centred fold
 * is a systematic that looks exactly like a limb-darkening residual, so it has
 * to go before any of this means anything — and it has to go without assuming a
 * transit model, or the enclosure would inherit one through the back door.
 *
 * THE ONLY ASSUMPTION IS THE ONE THE ENCLOSURE ALREADY MAKES. A transit of a
 * circular orbit across a circularly symmetric star is symmetric in time about
 * mid-transit, whatever the brightness profile is. So the fold is centred by
 * minimising
 *
 *     A(dt0, dP) = SUM_t [ F(+t) - F(-t) ]^2
 *
 * over a shift and a period correction. No limb darkening, no radius, no
 * impact parameter — only the mirror.
 */
'use strict';

function foldedProfile(pts, dt0, dP, nb, span) {
  const sum = new Float64Array(nb), cnt = new Float64Array(nb);
  for (const p of pts) {
    const t = p.t - dt0 - dP * p.ep;
    if (Math.abs(t) >= span) continue;
    const i = Math.floor((t + span) / (2 * span) * nb);
    sum[i] += p.f; cnt[i]++;
  }
  const out = new Float64Array(nb);
  for (let i = 0; i < nb; i++) out[i] = cnt[i] ? sum[i] / cnt[i] : NaN;
  return out;
}

/* the mirror statistic, restricted to bins where both sides are populated */
function asym(pts, dt0, dP, nb, span) {
  const f = foldedProfile(pts, dt0, dP, nb, span);
  let s = 0, n = 0;
  for (let i = 0; i < nb >> 1; i++) {
    const a = f[i], b = f[nb - 1 - i];
    if (Number.isFinite(a) && Number.isFinite(b)) { s += (a - b) * (a - b); n++; }
  }
  return n ? Math.sqrt(s / n) : Infinity;
}

/* coarse-to-fine search over (shift, period correction) */
function centre(pts, opt = {}) {
  const nb = opt.nb || 220, span = opt.span || 0.09;
  let best = { dt0: 0, dP: 0, a: asym(pts, 0, 0, nb, span) };
  const before = best.a;
  let w0 = opt.w0 || 300 / 86400, wP = opt.wP || 3e-5;
  for (let round = 0; round < 7; round++) {
    let improved = null;
    for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
      const dt0 = best.dt0 + i * w0 / 6, dP = best.dP + j * wP / 6;
      const a = asym(pts, dt0, dP, nb, span);
      if (a < best.a - 1e-15 && (!improved || a < improved.a)) improved = { dt0, dP, a };
    }
    if (improved) best = improved;
    w0 /= 3; wP /= 3;
  }
  return { ...best, before, gain: before / best.a };
}

/* apply the centring: shift each point's time onto the corrected fold */
const applyCentre = (pts, c) => pts.map(p => ({ ...p, t: p.t - c.dt0 - c.dP * p.ep }))
  .sort((a, b) => a.t - b.t);

module.exports = { centre, applyCentre, asym, foldedProfile };
