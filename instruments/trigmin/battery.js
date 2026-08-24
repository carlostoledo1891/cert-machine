/* battery.js — assertions for the chowla-cosine probe. Deterministic, exit 1
   on any failure. PROBE — research/probes/chowla-cosine · ships nowhere ·
   claimless: every number asserted here is a measured fact of THIS setup.

   Coverage, in dependency order:
     1  T_0..T_7 coefficients against hand values
     2  P_{1,2,3} exact values at y in {0, ±1/2, ±1} against hand values
     3  polyForSet == sum of chebT (structural)
     4  exact endpoint identities P(1)=|A|, P(-1)=sum (-1)^a
     5  hornerInterval (core/interval ops) encloses the exact rational value
     6  Sturm machinery on known polynomials, incl. a non-square-free input
     7  certify() on hand-checkable sets: {1}→-1, {1,2}→-9/8, {2}→-1,
        {2,4}→-9/8 (and it must take the sturm-bisection fallback: y=0 is an
        exact critical point on the grid), dilation invariance {1,2,3} vs
        {2,4,6}
     8  sampling cross-check: dense float sampling falls INSIDE the certified
        enclosure (+ the analytic grid slack) on several sets
     9  RED CONTROL (a): off-by-one constant coefficient must move the
        certified min by exactly 1 — enclosures must SEPARATE
    10  RED CONTROL (b): 'narrow' sabotage (refinement stopped coarse, Taylor
        remainder discarded, enclosure collapsed to the bare midpoint value)
        must be CAUGHT by the sampling cross-check on at least one case
    11  the c=1 landmark sanity: every certified c here is an enclosure, and
        -min <= sqrt(n)·cHi holds by construction (arithmetic re-check) */
'use strict';
const path = require('path');
const C = require('./cheb.js');
const M = require('./certify-min.js');
const Q = C.Q, IV = C.IV;

let pass = 0, fails = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('PASS  ' + msg); }
  else { fails++; console.log('FAIL  ' + msg); }
}
function eqPoly(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }

/* ---- 1. Chebyshev coefficients, hand values ---- */
const HAND = {
  0: [1n], 1: [0n, 1n], 2: [-1n, 0n, 2n], 3: [0n, -3n, 0n, 4n],
  4: [1n, 0n, -8n, 0n, 8n], 5: [0n, 5n, 0n, -20n, 0n, 16n],
  6: [-1n, 0n, 18n, 0n, -48n, 0n, 32n], 7: [0n, -7n, 0n, 56n, 0n, -112n, 0n, 64n]
};
for (const a of Object.keys(HAND)) {
  ok(eqPoly(C.chebT(+a), HAND[a]), 'T_' + a + ' coefficients match hand values');
}

/* ---- 2. P_{1,2,3} exact values at rationals, hand-derived ----
   P = T1+T2+T3 = 4y^3 + 2y^2 - 2y - 1:
   P(0) = -1, P(1) = 3, P(-1) = -1, P(1/2) = -1, P(-1/2) = 0. */
const P123 = C.polyForSet([1, 2, 3]);
ok(eqPoly(P123, [-1n, -2n, 2n, 4n]), 'P_{1,2,3} = 4y^3+2y^2-2y-1');
const at = (p, q) => C.evalExact(P123, Q.R(p, q));
ok(Q.cmp(at(0n, 1n), Q.R(-1n)) === 0, 'P_{1,2,3}(0) = -1 exactly');
ok(Q.cmp(at(1n, 1n), Q.R(3n)) === 0, 'P_{1,2,3}(1) = 3 exactly');
ok(Q.cmp(at(-1n, 1n), Q.R(-1n)) === 0, 'P_{1,2,3}(-1) = -1 exactly');
ok(Q.cmp(at(1n, 2n), Q.R(-1n)) === 0, 'P_{1,2,3}(1/2) = -1 exactly');
ok(Q.cmp(at(-1n, 2n), Q.R(0n)) === 0, 'P_{1,2,3}(-1/2) = 0 exactly');

/* ---- 3. polyForSet == sum of chebT ---- */
{
  const A = [2, 5, 9];
  const direct = C.polyForSet(A);
  const acc = new Array(10).fill(0n);
  for (const a of A) { const t = C.chebT(a); for (let i = 0; i < t.length; i++) acc[i] += t[i]; }
  ok(eqPoly(direct, C.trim(acc)), 'polyForSet({2,5,9}) equals sum of chebT');
}

/* ---- 4. endpoint identities ---- */
for (const A of [[1, 2, 3, 4, 5, 6], [3, 7, 11], [2, 4, 8]]) {
  const P = C.polyForSet(A);
  const alt = A.reduce((s, a) => s + (a % 2 === 0 ? 1n : -1n), 0n);
  ok(Q.cmp(C.evalExact(P, Q.R(1n)), Q.R(BigInt(A.length))) === 0,
    'P(1) = |A| for ' + JSON.stringify(A));
  ok(Q.cmp(C.evalExact(P, Q.R(-1n)), Q.R(alt)) === 0,
    'P(-1) = sum (-1)^a for ' + JSON.stringify(A));
}

/* ---- 5. hornerInterval encloses the exact value (seeded points) ---- */
{
  const P = C.polyForSet([1, 2, 3, 7]);
  let seed = 12345, bad = 0;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x80000000;
  for (let i = 0; i < 40; i++) {
    const num = BigInt(Math.floor((2 * rnd() - 1) * 1024)), den = 1024n;
    const exact = C.evalExact(P, Q.R(num, den));
    const y = Number(num) / 1024;                    /* dyadic: exact as a double */
    const enc = C.hornerInterval(P, IV.iv(y));
    if (!Q.inClosed(exact, enc[0], enc[1])) bad++;
  }
  ok(bad === 0, 'hornerInterval encloses the exact rational value at 40 seeded dyadic points');
}

/* ---- 6. Sturm machinery ---- */
{
  const p = [0n, -1n, 0n, 1n];                       /* y^3 - y: roots -1, 0, 1 */
  const sf = M.squarefreePart(p);
  ok(C.deg(sf) === 3, 'y^3-y is already square-free (sf degree 3)');
  const iso = M.isolateAll(sf, Q.R(-2n), Q.R(2n));
  ok(iso.total === 3 && iso.intervals.length === 3, 'y^3-y: three roots isolated on (-2,2]');
  const roots = [-1, 0, 1];
  let hit = 0;
  for (const [l, r] of iso.intervals) {
    const seg = M.refineRoot(sf, C.polyDeriv(sf), null, l, r, Q.R(1n, 1n << 40n), null);
    const lo = Q.toDouble(seg[0]), hi = Q.toDouble(seg[1]);
    if (roots.some(t => lo - 1e-10 <= t && t <= hi + 1e-10)) hit++;
  }
  ok(hit === 3, 'y^3-y: refined enclosures land on -1, 0, 1');

  const nsq = [1n, 0n, -8n, 0n, 16n];               /* (4y^2-1)^2 — NOT square-free */
  const sf2 = M.squarefreePart(nsq);
  ok(C.deg(sf2) === 2, '(4y^2-1)^2: square-free part has degree 2');
  const iso2 = M.isolateAll(sf2, Q.R(-2n), Q.R(2n));
  ok(iso2.total === 2, '(4y^2-1)^2: two DISTINCT roots counted');
  let hit2 = 0;
  for (const [l, r] of iso2.intervals) {
    const seg = M.refineRoot(sf2, C.polyDeriv(sf2), null, l, r, Q.R(1n, 1n << 40n), null);
    const lo = Q.toDouble(seg[0]), hi = Q.toDouble(seg[1]);
    if ([-0.5, 0.5].some(t => lo - 1e-10 <= t && t <= hi + 1e-10)) hit2++;
  }
  ok(hit2 === 2, '(4y^2-1)^2: refined enclosures land on ±1/2');
}

/* ---- 7. certify() on hand-checkable sets ---- */
function contains(enc, v) { return enc[0] <= v && v <= enc[1]; }
{
  const r1 = M.certify([1]);
  ok(contains(r1.minEnclosure, -1) && r1.width < 1e-12, '{1}: min enclosure holds -1, width < 1e-12');
  ok(contains(r1.cNormalized, 1), '{1}: c enclosure holds 1');

  const r12 = M.certify([1, 2]);                     /* min = -9/8 at y = -1/4 */
  ok(contains(r12.minEnclosure, -1.125) && r12.width < 1e-9, '{1,2}: min enclosure holds -9/8');
  ok(contains(r12.cNormalized, 1.125 / Math.sqrt(2)), '{1,2}: c enclosure holds 9/(8·sqrt(2))');

  const r2 = M.certify([2]);                         /* min = -1 at y = 0, exact grid hit */
  ok(contains(r2.minEnclosure, -1) && r2.width < 1e-12, '{2}: min enclosure holds -1');
  ok(r2.counts.isolation === 'sturm-bisection',
    '{2}: y=0 critical point forces the Sturm-bisection fallback (fallback exercised)');

  const r24 = M.certify([2, 4]);                     /* dilated {1,2}: same min -9/8 */
  ok(contains(r24.minEnclosure, -1.125) && r24.width < 1e-9, '{2,4}: min enclosure holds -9/8');
  ok(r24.counts.isolation === 'sturm-bisection', '{2,4}: even set exercises the fallback too');

  const r123 = M.certify([1, 2, 3]);
  const r246 = M.certify([2, 4, 6]);                 /* f_{2A}(x) = f_A(2x): same min */
  ok(Math.max(Math.abs(r123.minEnclosure[0] - r246.minEnclosure[0]),
              Math.abs(r123.minEnclosure[1] - r246.minEnclosure[1])) < 1e-9,
    'dilation invariance: {1,2,3} and {2,4,6} certify the same min (measured, not assumed)');
}

/* ---- 8. sampling cross-check falls INSIDE the enclosure ---- */
const CASES = [[1, 2, 3], [1, 2, 3, 4, 5, 6, 7, 8], [1, 3, 4, 5, 9], [2, 3, 5, 7, 11, 13]];
for (const A of CASES) {
  const r = M.certify(A);
  const cc = M.crossCheck(A, r.minEnclosure, 200000);
  ok(cc.ok, 'cross-check inside enclosure for ' + JSON.stringify(A) +
    ' (sampled ' + cc.sampledMin.toFixed(9) + ' vs [' + cc.lo.toFixed(9) + ', ' + cc.hi.toFixed(9) + '])');
}

/* ---- 9. RED CONTROL (a): off-by-one coefficient separates the enclosures ---- */
{
  const P = C.polyForSet([1, 2, 3]);
  const base = M.certifyPoly(P, { n: 3 });
  const shifted = P.slice(); shifted[0] += 1n;       /* P + 1: min moves by exactly +1 */
  const shift = M.certifyPoly(shifted, { n: 3 });
  ok(shift.minEnclosure[0] > base.minEnclosure[1],
    'RED (a): shifted-coefficient enclosure SEPARATES from the original (lo_shift > hi_base)');
  ok(Math.abs((shift.minEnclosure[0] - base.minEnclosure[0]) - 1) < 1e-9,
    'RED (a): the separation is the injected +1, reproduced to 1e-9');
}

/* ---- 10. RED CONTROL (b): narrowed enclosure caught by the cross-check ---- */
{
  let caught = 0, cleanOk = 0;
  for (const A of CASES) {
    const sab = M.certify(A, { sabotage: 'narrow' });
    const ccSab = M.crossCheck(A, sab.minEnclosure, 200000);
    if (!ccSab.ok && ccSab.violation === 'below-lo') caught++;
    const clean = M.certify(A);
    if (M.crossCheck(A, clean.minEnclosure, 200000).ok) cleanOk++;
  }
  ok(caught >= 1, 'RED (b): narrowed rounding caught by the sampling cross-check on ' +
    caught + '/' + CASES.length + ' cases (>= 1 required)');
  ok(cleanOk === CASES.length, 'RED (b) control: the un-sabotaged runs all pass the same cross-check');
}

/* ---- 11. c-arithmetic re-check on a mid-size set ---- */
{
  const A = Array.from({ length: 20 }, (_, i) => i + 1);   /* {1..20} */
  const r = M.certify(A);
  const c = r.cNormalized;
  ok(r.minEnclosure[0] >= -c[1] * Math.sqrt(20) - 1e-12,
    '{1..20}: -min <= cHi·sqrt(n) (outward c arithmetic consistent)');
  const cc = M.crossCheck(A, r.minEnclosure, 200000);
  ok(cc.ok, '{1..20}: cross-check inside enclosure (sampled ' + cc.sampledMin.toFixed(6) + ')');
}

console.log('battery: ' + pass + ' pass, ' + fails + ' fail');
process.exit(fails === 0 ? 0 : 1);
