/* holmes-census.js — the EXACT number of period-p points of the Holmes cubic
   Hénon map,  x_{n+1} = d x_n - x_n^3 + b x_{n-1}.

   The second map through the census instrument, and the test that the
   instrument generalises: everything Hénon-shaped — the tube, the Krawczyk
   contraction, the shift-link classification — is inherited; this file
   supplies only the SPEC (the recurrence, its two partial derivatives, and
   the a priori bound) and the parameter grid.

   THE BOUND, this map's own proof obligation. On any periodic orbit, at the
   index m of maximal modulus mu:  x_m^3 = d x_m + b x_{m-1} - x_{m+1},  so
   mu^3 <= (|d| + |b| + 1) mu, hence mu^2 <= |d| + |b| + 1. Any M with
   M^2 - (|d|+|b|+1) > 0 VERIFIED IN INTERVAL ARITHMETIC confines every
   periodic point of every period to (-M, M)^2.

   CALIBRATION with closed forms: the fixed points solve x^3 = (d+b-1)x —
   exactly 0 and, for d+b > 1, ±sqrt(d+b-1). Three period-1 points at the
   classical parameters (b, d) = (0.2, 2.77), each of which the census must
   find and enclose. The map is odd, so nonsymmetric orbits come in ± pairs —
   a structural check the battery exercises for free. */
'use strict';

const IV = require('#instruments/interval/interval.js');
const { iv, add, sub, mul, sqr, ONE } = IV;
const { censusSpec, recheckSpec, newtonSpec } = require('#instruments/census/henon-census.js');

function holmesBound(d, b) {
  const c = Math.abs(d) + Math.abs(b) + 1;
  let M = Math.sqrt(c) * (1 + 1e-9) + 1e-12;
  for (let t = 0; t < 80; t++) {
    /* g(M) = M^2 - c, increasing for M > 0; g(M) > 0 proves mu < M */
    const g = sub(sqr(iv(M)), iv(c));
    if (g[0] > 0) return { ok: true, M };
    M = M * (1 + 1e-6);
  }
  return { ok: false, why: 'the cubic a priori bound did not verify in interval arithmetic' };
}

function holmesSpec(d, b) {
  const ID = iv(d), IB = iv(b), I3 = iv(3);
  return {
    name: 'holmes', params: { d, b },
    stepF: (cur, prev) => (d * cur - cur * cur * cur) + b * prev,
    dCurF: (cur) => d - 3 * cur * cur,
    dPrevF: () => b,
    stepIV: (cur, prev) => add(sub(mul(ID, cur), IV.pow(cur, 3)), mul(IB, prev)),
    dCurIV: (cur) => sub(ID, mul(I3, sqr(cur))),
    dPrevIV: () => IB,
    bound: () => holmesBound(d, b)
  };
}

/* the grid: b = 0.2 classical, d sweeping from below the pitchfork (d+b = 1)
   through the chaotic regime at d = 2.77; periods 1..6 */
const D_VALUES = [];
for (let i = 0; i <= 30; i++) D_VALUES.push(Number((0.6 + i * 0.075).toFixed(4)));
const B_VALUES = [0.2];
const PERIODS = [1, 2, 3, 4];   /* p>=5 costs ~90s+ per cell at d=2.77 — one-off records, not grid cells */

function decode(i) {
  let x = i;
  const p = PERIODS[x % PERIODS.length]; x = Math.floor(x / PERIODS.length);
  const b = B_VALUES[x % B_VALUES.length]; x = Math.floor(x / B_VALUES.length);
  if (x >= D_VALUES.length) return null;
  return { d: D_VALUES[x], b, p };
}

function floatCount(spec, p, M) {
  const g = 0.6180339887498949;
  const found = new Set();
  for (let s = 0; s < 40; s++) {
    const v0 = new Array(p);
    for (let n = 0; n < p; n++) v0[n] = -M + 2 * M * (((s + 1) * g * (n + 1)) % 1);
    const v = newtonSpec(spec, v0, 80);
    if (!v || v.some(x => Math.abs(x) > M)) continue;
    found.add(v.map(x => x.toFixed(9)).join(','));
  }
  return found.size;
}

function describe(byMinimalPeriod) {
  return Object.keys(byMinimalPeriod).map(Number).sort((x, y) => x - y)
    .map(dd => byMinimalPeriod[dd] + (dd === 1 ? ' fixed' : ' of period ' + dd)).join(', ');
}

module.exports = {
  holmesSpec, holmesBound,
  name: 'holmes-census',
  statement: 'a parameter pair (d,b) and period p for which the number of period-p points of the Holmes cubic Hénon map is determined EXACTLY: every fixed point of H^p enclosed in a certified uniqueness box, the rest of the plane excluded by interval arithmetic',
  enumerate(i) {
    return decode(i);
  },
  value(o) {
    const spec = holmesSpec(o.d, o.b);
    const bd = spec.bound();
    return bd.ok ? floatCount(spec, o.p, bd.M) : NaN;
  },
  interesting() {
    return true;              /* every cell of the grid deserves a decision */
  },
  key: (o) => o.d + '|' + o.b + '|' + o.p,
  certify(o) {
    const spec = holmesSpec(o.d, o.b);
    const c = censusSpec(spec, o.p, o._opts);
    if (!c.ok) return { verdict: 'REFUSED', why: c.why };

    const rc = recheckSpec(spec, o.p, c);
    if (!rc.ok) return { verdict: 'REFUSED', why: 'internal recheck found a periodic point outside every certified box — instrument fault, no certificate emitted' };

    return {
      verdict: 'HIT',
      enclosure: [c.points, c.points],
      text: 'the Holmes cubic map with d=' + o.d + ', b=' + o.b + ' has EXACTLY ' + c.points
        + ' point' + (c.points === 1 ? '' : 's') + ' of period ' + o.p
        + (c.points ? ' (' + describe(c.byMinimalPeriod) + ')' : '')
        + ' — every one in a certified uniqueness box, the rest of the plane excluded'
        + ' (bound |x| < ' + c.bound.toFixed(6) + ', ' + c.stats.boxes + ' boxes)',
      extra: {
        d: o.d, b: o.b, p: o.p,
        points: c.points,
        byMinimalPeriod: c.byMinimalPeriod,
        orbits: c.orbits,
        bound: c.bound,
        stats: c.stats,
        recheck: { converged: rc.converged, unmatched: rc.unmatched },
        completeness: 'exhaustive: a certified a priori bound confines all periodic points, interval exclusion covers the plane, Krawczyk resolves every remainder'
      }
    };
  }
};
