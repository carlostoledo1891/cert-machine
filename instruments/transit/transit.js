/* transit.js — the forward map of a transit, and nothing else.
 *
 * THE OBJECT.  A star of unit radius with surface brightness I(r) >= 0. Write
 * the flux it emits between radii r and r+dr as
 *
 *     dmu(r) = 2 pi r I(r) dr,        mu >= 0,      INT_0^1 dmu = 1
 *
 * so mu is a NONNEGATIVE MEASURE on [0,1] and the normalisation is exactly the
 * statement that the light curve is 1 out of transit. No pixel basis, no
 * atmosphere model, no limb-darkening law, no smoothness, no monotonicity —
 * those are the assumptions this front exists to price, and none of them is
 * here.
 *
 * THE MEASUREMENT IS LINEAR.  A planet of radius k whose centre is at sky-plane
 * distance z from the star's centre covers a fraction w(r; z, k) of the circle
 * of radius r, so the missing flux is
 *
 *     d(z, k) = INT_0^1 w(r; z, k) dmu(r),      F_obs = 1 - d.
 *
 * Every datum is therefore a two-sided LINEAR constraint on a nonnegative
 * measure — the interferometer's object, in one dimension.
 *
 * THE KERNEL, AND WHY THERE IS NO BRANCHING.  With
 *
 *     g = (z^2 + r^2 - k^2) / (2 z r),          w = acos(clamp(g, -1, 1)) / pi
 *
 * every case is already handled by the clamp: g <= -1 exactly when z + r <= k
 * (the whole circle is behind the planet, w = 1), and g >= 1 exactly when
 * r + k <= z or r >= z + k (they do not meet, w = 0). The three regimes meet
 * continuously because those are the same conditions, so the clamped form is
 * the function, not an approximation of it — which is what makes the interval
 * enclosure below sound with no case analysis to get wrong.
 *
 * WHERE THE KINKS ARE.  w has a square-root kink in r at r = |z-k| and
 * r = z+k, where dw/dr is unbounded. That is why `scan2`'s second-order margin
 * does not transfer from the interferometer, and why the continuum is closed
 * here by INTERVAL ARITHMETIC over a partition instead: an interval enclosure
 * of a clamped acos needs no derivative and does not care that one is missing.
 */
'use strict';
const I = require('../interval/interval.js');
const { nextUp, nextDown } = I;

/* --- interval primitives eqcert does not carry (acos, sqrt) ------------------
   Both are monotone, which is the whole proof: enclose the argument, apply the
   monotone map to the endpoints, then widen by a few ulps to cover the
   library's own rounding. `PAD` ulps of slack on a monotone map is sound as
   long as Math.acos / Math.sqrt are accurate to fewer than PAD ulps, which is
   asserted by the tests against exact values rather than assumed. */
const PAD = 4;
const padDown = x => { let y = x; for (let i = 0; i < PAD; i++) y = nextDown(y); return y; };
const padUp = x => { let y = x; for (let i = 0; i < PAD; i++) y = nextUp(y); return y; };

function iacos(A) {                       /* acos is DECREASING on [-1,1] */
  const a = Math.max(A[0], -1), b = Math.min(A[1], 1);
  if (a > b) throw new Error('iacos: argument interval misses [-1,1]');
  return [padDown(Math.acos(b)), padUp(Math.acos(a))];
}
function isqrt(A) {
  if (A[1] < 0) throw new Error('isqrt: negative interval');
  const a = Math.max(A[0], 0);
  return [padDown(Math.sqrt(a)), padUp(Math.sqrt(A[1]))];
}
const PI = [padDown(Math.PI), padUp(Math.PI)];

/* --- the kernel ----------------------------------------------------------- */

/* fraction of the circle of radius r that lies inside the planet disk */
function arcFrac(r, z, k) {
  if (k <= 0) return 0;
  if (z + r <= k) return 1;
  if (r + k <= z || r >= z + k) return 0;
  if (r === 0) return z < k ? 1 : 0;
  const g = (z * z + r * r - k * k) / (2 * z * r);
  return Math.acos(g < -1 ? -1 : g > 1 ? 1 : g) / Math.PI;
}

/* the same, enclosing every (r, z) in the boxes R and Z. k is a point. */
function arcFracIv(R, Z, k) {
  if (k <= 0) return [0, 0];
  if (Z[1] + R[1] <= k) return [1, 1];
  if (R[1] + k <= Z[0] || R[0] >= Z[1] + k) return [0, 0];
  if (R[0] <= 0) {
    /* r = 0 is in the cell and the formula divides by r. w is continuous at
       r = 0 (the clamp sends g to -1 or +1 according to z < k or z > k), so the
       two clean regimes are exact and only a cell the planet's EDGE crosses is
       left to the hull. A cell anchored at 0 cannot be refined away, so this is
       where the scan loses resolution — it happens only when the planet reaches
       the stellar centre, i.e. k > b, which no real transit here does. */
    if (Z[1] + R[1] <= k) return [1, 1];
    if (R[1] + k <= Z[0]) return [0, 0];
    return [0, 1];                       /* sound hull; not refinable */
  }
  const num = I.sub(I.add(I.sqr(Z), I.sqr(R)), [k * k, k * k]);
  const den = I.mul([2, 2], I.mul(Z, R));
  const g = I.div(num, den);
  const cl = x => x < -1 ? -1 : x > 1 ? 1 : x;      /* clamp is MONOTONE, so it
     must be applied to each endpoint in turn; [max(lo,-1), min(hi,1)] inverts
     the interval whenever it lies wholly outside [-1,1] and that threw. */
  const gc = [cl(g[0]), cl(g[1])];
  return I.div(iacos(gc), PI);
}

/* --- geometry ------------------------------------------------------------ *
 * Circular orbit. dt is time from mid-transit in days; aR = a/R*; b the impact
 * parameter; P the period. cos i = b/aR, so
 *
 *     z(dt) = aR * sqrt( sin^2(th) + (b/aR)^2 cos^2(th) ),   th = 2 pi dt / P
 *
 * and z(0) = b, as it must. Eccentricity is not carried: it is a hypothesis
 * this front does not need, and adding it would put a fourth nuisance into the
 * box for no gain on a 2.5-day orbit.
 */
function zOf(dt, aR, b, P) {
  const th = 2 * Math.PI * dt / P, s = Math.sin(th), c = Math.cos(th);
  return Math.sqrt(aR * aR * s * s + b * b * c * c);
}
function zIv(DT, AR, B, P) {
  const TH = I.div(I.mul([2 * Math.PI, 2 * Math.PI], DT), [P, P]);
  const S = I.encloseSin(0), C = I.encloseCos(0);   /* placeholders, replaced below */
  void S; void C;
  const sinT = encloseSinIv(TH), cosT = encloseCosIv(TH);
  return isqrt(I.add(I.mul(I.sqr(AR), I.sqr(sinT)), I.mul(I.sqr(B), I.sqr(cosT))));
}
/* sin/cos over an interval. Near mid-transit |th| is far below pi/2, where both
   are monotone, so the endpoints suffice; anything wider is refused rather than
   handled wrongly, because this front never looks outside the transit. */
function encloseSinIv(TH) {
  if (TH[0] < -1.5 || TH[1] > 1.5) throw new Error('encloseSinIv: |theta| too large for the monotone branch');
  const a = I.encloseSin(TH[0]), b = I.encloseSin(TH[1]);
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
}
function encloseCosIv(TH) {
  if (TH[0] < -1.5 || TH[1] > 1.5) throw new Error('encloseCosIv: |theta| too large for the monotone branch');
  const lo = Math.max(Math.abs(TH[0]), Math.abs(TH[1])), hi = TH[0] <= 0 && TH[1] >= 0 ? 0 : Math.min(Math.abs(TH[0]), Math.abs(TH[1]));
  const a = I.encloseCos(lo), b = I.encloseCos(hi);
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
}

/* --- known answers, used by the tests and by the reds -------------------- *
 * The area of intersection of the unit disk with a disk of radius k whose
 * centre is at distance z. This is the closed form INT_0^1 w(r;z,k) 2r dr must
 * reproduce, and it is the strongest check available on the kernel because it
 * comes from a different derivation entirely. */
function lensArea(z, k) {
  if (z >= 1 + k) return 0;
  if (z <= 1 - k) return Math.PI * k * k;
  if (z <= k - 1) return Math.PI;
  const d1 = (z * z + 1 - k * k) / (2 * z), d2 = (z * z - 1 + k * k) / (2 * z);
  const t1 = Math.acos(Math.min(1, Math.max(-1, d1)));
  const t2 = Math.acos(Math.min(1, Math.max(-1, d2 / k)));
  return t1 + k * k * t2 - z * Math.sin(t1);
}
/* the depth a UNIFORM star of unit radius shows: lensArea / pi. For a planet
   fully on the disk this is exactly k^2, which is the test's anchor. */
const uniformDepth = (z, k) => lensArea(z, k) / Math.PI;

/* --- the light curve ------------------------------------------------------ */
function loadCurve(file) {
  const fs = require('fs');
  const txt = fs.readFileSync(file, 'utf8');
  const meta = [];
  const pts = [];
  for (const ln of txt.split('\n')) {
    if (!ln) continue;
    if (ln[0] === '#') { meta.push(ln.slice(1).trim()); continue; }
    const [t, f, e, ep] = ln.split(',');
    pts.push({ t: +t, f: +f, e: +e, ep: ep === undefined ? 0 : +ep });
  }
  pts.sort((a, b) => a.t - b.t);
  return { meta, pts };
}

/* Fold into phase bins. Each bin carries the MEAN flux of its members and the
 * span of times they cover, because the constraint the bin states is about the
 * mean, and the kernel must be averaged over exactly the same times.
 *
 * `edges` is given rather than computed so the caller can put fine bins where
 * the light curve is steep, which is where the radius information is. */
function binCurve(pts, edges) {
  const bins = [];
  for (let j = 0; j < edges.length - 1; j++) bins.push({ lo: edges[j], hi: edges[j + 1], ts: [], fs: [], f: 0, e2: 0, n: 0 });
  for (const p of pts) {
    let j = 0, hi = bins.length - 1;                  /* binary search */
    while (j < hi) { const m = (j + hi) >> 1; if (p.t < bins[m].hi) hi = m; else j = m + 1; }
    const b = bins[j];
    if (p.t < b.lo || p.t >= b.hi) continue;
    b.ts.push(p.t); b.fs.push(p.f); b.f += p.f; b.e2 += p.e * p.e; b.n++;
  }
  const out = [];
  for (const b of bins) {
    if (b.n === 0) continue;
    b.f /= b.n;
    b.stated = Math.sqrt(b.e2) / b.n;                 /* propagated from the mission's errors */
    /* and the scatter the members actually show, which is the only honest
       number when the two disagree. Measure the noise floor; never assume it. */
    let s2 = 0; for (const p2 of b.fs) s2 += (p2 - b.f) * (p2 - b.f);
    b.measured = b.n > 3 ? Math.sqrt(s2 / (b.n - 1) / b.n) : b.stated;
    b.sigma = Math.max(b.stated, b.measured);
    b.tmin = Math.min(...b.ts); b.tmax = Math.max(...b.ts);
    b.tmid = b.ts.reduce((a, t) => a + t, 0) / b.n;
    out.push(b);
  }
  return out;
}

module.exports = {
  iacos, isqrt, padDown, padUp, PI,
  arcFrac, arcFracIv, zOf, zIv, encloseSinIv, encloseCosIv,
  lensArea, uniformDepth, loadCurve, binCurve
};
