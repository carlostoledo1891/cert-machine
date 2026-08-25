/* henon-census.js — the EXACT number of period-p points of the Hénon map.

   The henon-orbits family certifies orbits float Newton happened to find — its
   counts are lower bounds, and its REJECT text says so. This family closes the
   gap with the branch-and-bound census instrument: the phase plane is confined
   by a certified a priori bound, exhausted by interval exclusion, and every
   surviving region is resolved by Krawczyk into a box holding exactly one
   periodic point. A HIT is a completeness theorem:

       the Hénon map at (a,b) has EXACTLY N points of period p, every one
       enclosed in a certified uniqueness box, classified by minimal period.

   That is the record-with-completeness shape: not "we found 7 period-8
   orbits" but "there are exactly 7, and nothing else anywhere in the plane".
   The census can refuse (budget, depth cap, an undecidable containment) but
   can never return a wrong count; a REFUSED here is absence of proof, never
   evidence of absence.

   The float layer (value) is a multistart Newton COUNT ESTIMATE — the
   prediction the census then makes exact. It screens nothing out: every
   (a, b, p) cell is worth deciding. */
'use strict';

const { census, recheckCensus, newtonF, residualF } = require('#instruments/census/henon-census.js');

/* the same parameter sweep the orbit family runs: classical b, the a-interval
   holding the period-doubling cascade and the a=1.4 attractor */
const A_VALUES = [];
for (let i = 0; i <= 40; i++) A_VALUES.push(Number((0.6 + i * 0.02).toFixed(4)));
const B_VALUES = [0.3];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function decode(i) {
  let x = i;
  const p = PERIODS[x % PERIODS.length]; x = Math.floor(x / PERIODS.length);
  const b = B_VALUES[x % B_VALUES.length]; x = Math.floor(x / B_VALUES.length);
  if (x >= A_VALUES.length) return null;
  return { a: A_VALUES[x], b, p };
}

/* float multistart: how many distinct period-p points does Newton reach?
   An estimate, never an authority. */
function floatCount(a, b, p) {
  const g = 0.6180339887498949;
  const found = new Set();
  for (let s = 0; s < 40; s++) {
    const v0 = new Array(p);
    for (let n = 0; n < p; n++) v0[n] = -1.6 + 3.2 * (((s + 1) * g * (n + 1)) % 1);
    const v = newtonF(v0, a, b, 80);
    if (!v) continue;
    if (Math.max.apply(null, residualF(v, a, b).map(Math.abs)) > 1e-10) continue;
    if (v.some(x => Math.abs(x) > 4)) continue;
    found.add(v.map(x => x.toFixed(9)).join(','));
  }
  return found.size;
}

function describe(byMinimalPeriod) {
  return Object.keys(byMinimalPeriod).map(Number).sort((x, y) => x - y)
    .map(d => byMinimalPeriod[d] + (d === 1 ? ' fixed' : ' of period ' + d)).join(', ');
}

module.exports = {
  name: 'henon-census',
  statement: 'a parameter pair (a,b) and period p for which the number of period-p points of the Hénon map is determined EXACTLY: every fixed point of H^p enclosed in a certified uniqueness box, the rest of the plane excluded by interval arithmetic',
  enumerate(i) {
    return decode(i);
  },
  /* the float prediction of the count the census will make exact */
  value(o) {
    return floatCount(o.a, o.b, o.p);
  },
  interesting() {
    return true;              /* every cell of the grid deserves a decision */
  },
  key: (o) => o.a + '|' + o.b + '|' + o.p,
  certify(o) {
    const { a, b, p } = o;
    const c = census(a, b, p, o._opts);
    if (!c.ok) return { verdict: 'REFUSED', why: c.why };

    /* the certificate does not ship unless the independent float recheck
       agrees: every Newton-reachable periodic point must be a recorded one */
    const rc = recheckCensus(a, b, p, c);
    if (!rc.ok) return { verdict: 'REFUSED', why: 'internal recheck found a periodic point outside every certified box — instrument fault, no certificate emitted' };

    return {
      verdict: 'HIT',
      enclosure: [c.points, c.points],           /* an exact integer, certified */
      text: 'the Hénon map with a=' + a + ', b=' + b + ' has EXACTLY ' + c.points
        + ' point' + (c.points === 1 ? '' : 's') + ' of period ' + p
        + (c.points ? ' (' + describe(c.byMinimalPeriod) + ')' : '')
        + ' — every one in a certified uniqueness box, the rest of the plane excluded'
        + ' (bound |x| < ' + c.bound.toFixed(6) + ', ' + c.stats.boxes + ' boxes)',
      extra: {
        a, b, p,
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
