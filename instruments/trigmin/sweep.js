/* sweep.js — exhaustive Newman min-modulus box campaigns: every n-term
   exponent set {0} ∪ (n-1 of 1..maxA) given an EXACT verdict against a bar
   derived from a certified floor. The mu(n) table rows (mu(6..9) certified
   next door in sin-mfg, mu(10..16) never run anywhere) are records of this
   sweep. NEW CODE (cert-machine, 2026-08-25); the certifier it rides
   (certify-min.js via newman.js) is the lifted instrument, untouched.

   THE CASCADE, cheapest exact kill first — the design whose economics the
   source lab measured (certification is ~1000x the kill stage; 99.999% of
   sets must never reach an enclosure):

     W  root-of-unity integer kill. At an m-th root of unity f depends only
        on the residue counts c_r of A mod m, and for m in {2,3,4,6} every
        2cos(2pi k/m) lies in {0,±1,±2}, so 4|f(w)|^2 is an INTEGER:
          m=2: 4(c0-c1)^2      m=4: 4[(c0-c2)^2 + (c1-c3)^2]
          m=3: 4[c0^2+c1^2+c2^2 - c0c1 - c1c2 - c2c0]
          m=6: (2c0+c1-c2-2c3-c4+c5)^2 + 3(c1+c2-c4-c5)^2
        min|f|^2 <= |f(w)|^2, so ONE integer inequality against the bar
        kills the set — a certificate, fired before any float exists.
     F  float screen (routing only): sampled min of |f|^2 over a K-point
        grid on [0,pi] from precomputed cos/sin tables. Sampling sits ABOVE
        the true min, so it can only route, never admit or kill.
     K  dyadic exact kill at the float argmin: with y0 = p/2^s a dyadic,
        the Chebyshev VALUE recurrence u_{k+1} = 2p u_k - 2^{2s} u_{k-1}
        (u_k = T_k(y0) 2^{sk}) gives |f|^2(y0) as an exact rational with
        NO polynomial assembled; below the bar kills, else the set is
        PROMOTED — a float error costs work, never correctness.
     C  full certification (newman.certifyNewman) for everything that
        survives. Survivor iff certified floor exceeds the bar.

   THE BAR is exact: barFromFloorSq takes a CERTIFIED |f|^2 floor (a double,
   hence a dyadic rational) and steps one ulp down, so the witness that
   produced it can never be killed by its own bar.

   CONSERVATION: killedW + killedDyadic + certifiedBelow + survivors ===
   C(maxA, n-1), asserted before the record is returned — a dropped set is
   a thrown error, not a silent hole in an exhaustion claim.

   ORBITS: dilation A -> kA and reversal preserve min|f| exactly (proved:
   z -> z^k maps the circle onto itself; reversal conjugates). Champion
   selection is certified-floor desc, then PRIMITIVE (gcd 1) before dilated,
   then least degree, then numeric lexicographic — the string-sort tie-break
   that once nearly published a dilated copy as a discovery is the lesson
   this ordering encodes. Survivors are classified against the champion's
   orbit; an unexplained tie surfaces by name.

   Also here: certifyMinEqualsOne — the EQUALITY certificate for
   M(0,1,2,6,9) = 1 (Mercer): |f|^2 - 1 vanishes at y = -1 and, after exact
   deflation by (y+1)^k, the quotient is proved positive on [-1,1] by Sturm
   — so the minimum is EXACTLY 1, attained exactly at z = -1. An enclosure
   can never decide that tie; exact arithmetic does.

   MIT licensed. Part of cert-machine. */
'use strict';

const N = require('./newman.js');
const C = require('./cheb.js');
const CM = require('./certify-min.js');
const IV = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');

/* ---------------- the exact bar ---------------- */

/* a certified |f|^2 floor (double = exact dyadic) -> the bar one ulp below,
   as an exact rational {bn, bd}. Refuses a nonpositive or non-finite floor. */
function barFromFloorSq(floorSq) {
  if (!Number.isFinite(floorSq) || floorSq <= 0) throw new Error('sweep: bar needs a positive finite certified floor');
  const b = IV.nextDown(floorSq);
  const r = Q.fromDouble(b);
  if (!(Q.cmp(r, Q.fromDouble(floorSq)) < 0)) throw new Error('sweep: bar failed to sit strictly below the floor');
  return { bn: r.n, bd: r.d, asDouble: b };
}

/* ---------------- stage W: integer kills at roots of unity ---------------- */

/* 4|f(w_m)|^2 for m in {2,3,4,6} from residue counts; returns the smallest. */
function stageWMin4(A) {
  let c0 = 0, c1 = 0;                                  /* mod 2 */
  let d0 = 0, d1 = 0, d2 = 0;                          /* mod 3 */
  let e0 = 0, e1 = 0, e2 = 0, e3 = 0;                  /* mod 4 */
  let f0 = 0, f1 = 0, f2 = 0, f3 = 0, f4 = 0, f5 = 0;  /* mod 6 */
  for (const a of A) {
    (a & 1) ? c1++ : c0++;
    const r3 = a % 3; r3 === 0 ? d0++ : r3 === 1 ? d1++ : d2++;
    const r4 = a & 3; r4 === 0 ? e0++ : r4 === 1 ? e1++ : r4 === 2 ? e2++ : e3++;
    const r6 = a % 6;
    r6 === 0 ? f0++ : r6 === 1 ? f1++ : r6 === 2 ? f2++ : r6 === 3 ? f3++ : r6 === 4 ? f4++ : f5++;
  }
  const m2 = 4 * (c0 - c1) * (c0 - c1);
  const m3 = 4 * (d0 * d0 + d1 * d1 + d2 * d2 - d0 * d1 - d1 * d2 - d2 * d0);
  const m4 = 4 * ((e0 - e2) * (e0 - e2) + (e1 - e3) * (e1 - e3));
  const re6 = 2 * f0 + f1 - f2 - 2 * f3 - f4 + f5;
  const im6 = f1 + f2 - f4 - f5;
  const m6 = re6 * re6 + 3 * im6 * im6;
  return Math.min(m2, m3, m4, m6);
}

/* ---------------- stage K: exact dyadic point evaluation ---------------- */

const DY_BITS = 26;
const DY_SCALE = 1 << DY_BITS;
const DY_SQ = 1n << BigInt(2 * DY_BITS);

/* |f|^2 at y0 = p/2^DY_BITS as an exact rational, via the T_k value
   recurrence — no polynomial. Returns true iff the value is < bar. */
function dyadicBelowBar(counts, n, p, maxD, bar) {
  const P2 = 2n * BigInt(p);
  let uPrev = 1n, uCur = BigInt(p);          /* u_k = T_k(y0) * 2^(k*DY_BITS) */
  /* accumulate 2 * sum m_d T_d(y0), all over the common denominator 2^(maxD*DY_BITS) */
  let acc = 0n;                               /* numerator pieces, scaled below */
  const shift = (k) => BigInt((maxD - k) * DY_BITS);
  if (counts.get(1)) acc += 2n * BigInt(counts.get(1)) * (uCur << shift(1));
  for (let k = 2; k <= maxD; k++) {
    const uNext = P2 * uCur - DY_SQ * uPrev;
    uPrev = uCur; uCur = uNext;
    const m = counts.get(k);
    if (m) acc += 2n * BigInt(m) * (uCur << shift(k));
  }
  const den = 1n << BigInt(maxD * DY_BITS);
  const num = BigInt(n) * den + acc;          /* |f|^2(y0) = num / den exactly */
  /* num/den < bn/bd  <=>  num*bd < bn*den */
  return num * bar.bd < bar.bn * den;
}

/* ---------------- orbits ---------------- */

const gcdInt = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
const setGcd = (A) => { let g = 0; for (const a of A) g = gcdInt(g, a); return g || 1; };
const reverseSet = (A) => { const m = A[A.length - 1]; return A.map(a => m - a).reverse(); };
const dilate = (A, k) => A.map(a => a * k);
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function primitiveOf(A) { const g = setGcd(A); return g > 1 ? A.map(a => a / g) : A.slice(); }

/* is B in the dilation/reversal orbit of the primitive set P inside exponent bound maxA? */
function inOrbit(B, P, maxA) {
  const deg = P[P.length - 1];
  for (let k = 1; k * deg <= maxA; k++) {
    const D = dilate(P, k);
    if (sameSet(B, D) || sameSet(B, reverseSet(D))) return true;
  }
  return false;
}

/* numeric lexicographic */
function lexLess(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) { if (a[i] !== b[i]) return a[i] < b[i]; }
  return a.length < b.length;
}

/* ---------------- the sweep ---------------- */

function binom(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }

/* sweepBox({n, maxA, seed, K, log}) — seed is a WITNESS exponent set (with 0),
   certified here to derive the bar. Returns the exhaustion record; throws if
   the conservation identity fails. */
function sweepBox(opts) {
  const { n, maxA } = opts;
  const K = opts.K || 1024;
  const log = opts.log || (() => {});
  if (!Number.isInteger(n) || n < 3 || !Number.isInteger(maxA) || maxA < n) throw new Error('sweep: bad box');
  const t0 = Date.now();

  /* the bar, from the seed's certified floor — and DYNAMIC from there: every
     candidate that certifies above the current bar raises it. Soundness is
     one line: a set killed against an earlier (lower) bar is below the final
     bar a fortiori, so the exhaustion claim against the FINAL bar holds for
     every kill ever made. A weak seed now costs minutes, not days. */
  const seed = opts.seed;
  N.validateSet(seed);
  if (seed.length !== n) throw new Error('sweep: seed must have exactly n terms');
  if (seed[seed.length - 1] > maxA) throw new Error('sweep: seed must live inside the box');
  const seedCert = N.certifyNewman(seed, { bar: 0 });
  let bestFloorSq = seedCert.modSq[0];
  let bar = barFromFloorSq(bestFloorSq);
  let barFloat = bar.asDouble;

  /* float tables: cos/sin(a*theta_j) for a <= maxA, theta_j = pi*j/K */
  const cosT = new Float64Array((maxA + 1) * (K + 1));
  const sinT = new Float64Array((maxA + 1) * (K + 1));
  for (let a = 0; a <= maxA; a++) for (let j = 0; j <= K; j++) {
    const th = Math.PI * j / K;
    cosT[a * (K + 1) + j] = Math.cos(a * th);
    sinT[a * (K + 1) + j] = Math.sin(a * th);
  }

  const total = binom(maxA, n - 1);
  let killedW = 0, killedDyadic = 0, certifiedBelow = 0;
  const survivors = [];

  /* enumerate (n-1)-subsets of 1..maxA lexicographically, A = [0, ...subset] */
  const idx = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) idx[i] = i + 1;
  const A = new Array(n); A[0] = 0;
  let seen = 0;

  const certifyCandidate = (Aset) => {
    const cert = N.certifyNewman(Aset, { bar: 0 });
    const floorQ = Q.fromDouble(cert.modSq[0]);
    if (floorQ.n * bar.bd > bar.bn * floorQ.d) {
      survivors.push({ A: Aset.slice(), modSq: cert.modSq, modulus: cert.modulus,
        degree: Aset[Aset.length - 1], gcd: setGcd(Aset) });
      if (cert.modSq[0] > bestFloorSq) {           /* ratchet the bar upward */
        bestFloorSq = cert.modSq[0];
        bar = barFromFloorSq(bestFloorSq);
        barFloat = bar.asDouble;
      }
    } else certifiedBelow++;
  };

  /* advance to the next combination; false when exhausted */
  const advance = () => {
    let i = n - 2;
    while (i >= 0 && idx[i] === maxA - (n - 2 - i)) i--;
    if (i < 0) return false;
    idx[i]++;
    for (let j = i + 1; j < n - 1; j++) idx[j] = idx[j - 1] + 1;
    return true;
  };

  for (;;) {
    for (let i = 0; i < n - 1; i++) A[i + 1] = idx[i];
    seen++;

    /* the battery's sabotage seam (C10): a deliberately dropped verdict that
       the conservation identity MUST catch — never set by a real campaign */
    if (opts._dropVerdictAt === seen) { if (!advance()) break; continue; }

    /* W */
    const w4 = stageWMin4(A);
    if (BigInt(w4) * bar.bd < 4n * bar.bn) killedW++;
    else {
      /* F — float screen from the tables */
      let best = Infinity, bestJ = 0;
      for (let j = 0; j <= K; j++) {
        let re = 0, im = 0;
        for (let i = 0; i < n; i++) { const o = A[i] * (K + 1) + j; re += cosT[o]; im += sinT[o]; }
        const v = re * re + im * im;
        if (v < best) { best = v; bestJ = j; }
      }
      if (best < barFloat + 1e-9) {
        /* K — exact dyadic kill at the argmin (and one neighbour each side) */
        const raw = N.differenceCounts(A);
        const red = N.reduceByGcd(raw);
        let killed = false;
        for (const dj of [0, -1, 1]) {
          const j = bestJ + dj; if (j < 0 || j > K) continue;
          /* y in the REDUCED variable: cos(g*theta_j) */
          const y = Math.cos(red.g * Math.PI * j / K);
          const p = Math.max(-DY_SCALE, Math.min(DY_SCALE, Math.round(y * DY_SCALE)));
          let maxD = 0; for (const d of red.counts.keys()) if (d > maxD) maxD = d;
          if (dyadicBelowBar(red.counts, n, p, maxD, bar)) { killed = true; break; }
        }
        if (killed) killedDyadic++;
        else certifyCandidate(A);            /* promoted — float said kill, exact said no */
      } else certifyCandidate(A);            /* candidate above the bar */
    }

    /* next combination */
    if (!advance()) break;
    if (seen % 2000000 === 0) log(seen + '/' + total + ' W=' + killedW + ' D=' + killedDyadic + ' S=' + survivors.length);
  }

  /* demote survivors the rising bar has since passed: kept iff above the
     FINAL bar, so the survivor list is exactly the final-bar exhaustion */
  const finalSurvivors = survivors.filter(s => {
    const q = Q.fromDouble(s.modSq[0]);
    return q.n * bar.bd > bar.bn * q.d;
  });
  certifiedBelow += survivors.length - finalSurvivors.length;
  survivors.length = 0; survivors.push(...finalSurvivors);

  /* conservation — an exhaustion claim dies here rather than lies here */
  if (seen !== total) throw new Error('sweep: enumerated ' + seen + ' sets, expected C(' + maxA + ',' + (n - 1) + ') = ' + total);
  if (killedW + killedDyadic + certifiedBelow + survivors.length !== total) {
    throw new Error('sweep: conservation identity FAILED: ' + killedW + '+' + killedDyadic + '+' + certifiedBelow + '+' + survivors.length + ' != ' + total);
  }

  /* champion: floor desc -> primitive before dilated -> least degree -> numeric lex */
  const ranked = survivors.slice().sort((x, y) =>
    y.modSq[0] - x.modSq[0] || (x.gcd === 1 ? 0 : 1) - (y.gcd === 1 ? 0 : 1) ||
    x.degree - y.degree || (lexLess(x.A, y.A) ? -1 : 1));
  const champion = ranked[0] || null;
  let orbit = null;
  if (champion) {
    const P = primitiveOf(champion.A);
    const inO = survivors.map(s => inOrbit(s.A, P, maxA));
    orbit = { primitive: P, uniqueUpToDilationAndReversal: inO.every(Boolean),
      outsiders: survivors.filter((s, i) => !inO[i]).map(s => s.A) };
  }

  return {
    what: 'exhaustive Newman min-modulus sweep: every ' + n + '-term set {0} u (subset of 1..' + maxA + ') decided exactly against the bar',
    n, maxA, totalSets: total, K,
    seed: { A: seed.slice(), modSq: seedCert.modSq },
    barSq: { num: bar.bn.toString(), den: bar.bd.toString(), asDouble: barFloat },
    killedAtRootsOfUnity: killedW, killedDyadic, certifiedBelow,
    survivors: survivors.map(s => ({ A: s.A, modSq: s.modSq, modulus: s.modulus, degree: s.degree, gcd: s.gcd })),
    champion: champion && { A: champion.A, modSq: champion.modSq, modulus: champion.modulus, degree: champion.degree, gcd: champion.gcd },
    maximumOrbit: orbit,
    conservation: killedW + '+' + killedDyadic + '+' + certifiedBelow + '+' + survivors.length + ' = ' + total,
    elapsedMs: Date.now() - t0,
    convention: 'TERMS (n = |A|); a box maximum is a certified LOWER bound on mu(n) plus the statement that nothing in the box does better — it is not a value for mu(n)'
  };
}

/* ---------------- the equality certificate ---------------- */

/* exact synthetic division by (y + 1); returns null unless the remainder is
   exactly 0 */
function deflateAtMinusOne(c) {
  const d = c.length - 1;
  const q = new Array(d);
  let carry = c[d];
  for (let i = d - 1; i >= 0; i--) { q[i] = carry; carry = c[i] - carry; } /* c(y) = (y+1)q(y) + carry */
  return carry === 0n ? q : null;
}

function evalAtMinusOne(c) { let s = 0n; for (let i = c.length - 1; i >= 0; i--) s = -s + c[i]; return s; }
function evalAtOne(c) { let s = 0n; for (const x of c) s += x; return s; }

/* certifyMinEqualsOne(A) — is min|f| EXACTLY 1, attained exactly at z = -1?
   G - 1 = (y+1)^k H with H > 0 on [-1,1] proved by Sturm. Anything else
   REFUSES with a named reason; a refusal is not a verdict about A. */
function certifyMinEqualsOne(A) {
  N.validateSet(A);
  const n = A.length;
  const raw = N.differenceCounts(A);
  const { counts, g } = N.reduceByGcd(raw);
  const G = N.polyForCounts(counts, n, 2);        /* |f|^2 in y, BigInt */
  const Gm1 = G.slice(); Gm1[0] -= 1n;
  if (evalAtMinusOne(Gm1) !== 0n) return { verdict: 'REFUSED', why: '|f(-1)|^2 != 1 — the equality claim needs the minimum at z = -1' };
  let H = Gm1, k = 0;
  for (;;) {
    const q = deflateAtMinusOne(H);
    if (q === null) break;
    H = C.trim(q); k++;
    if (evalAtMinusOne(H) !== 0n) break;
  }
  if (k === 0) return { verdict: 'REFUSED', why: 'deflation did not run — impossible if G(-1) = 1' };
  const hm1 = evalAtMinusOne(H), h1 = evalAtOne(H);
  if (hm1 <= 0n || h1 <= 0n) return { verdict: 'REFUSED', why: 'quotient H not positive at an endpoint (H(-1) = ' + hm1 + ', H(1) = ' + h1 + ')' };
  const sf = CM.squarefreePart(H);
  const chain = CM.sturmChain(sf);
  const roots = CM.signVarAt(chain, Q.R(-1n)) - CM.signVarAt(chain, Q.R(1n));
  if (roots !== 0) return { verdict: 'REFUSED', why: 'H has ' + roots + ' root(s) in (-1,1] — the minimum dips below 1 somewhere' };
  return {
    verdict: 'EQUALITY',
    statement: 'min_{|z|=1} |f_A(z)| = 1 EXACTLY for A = {' + A.join(',') + '}, attained at z = -1' + (g > 1 ? ' (and its g=' + g + ' rotations)' : '') + ' and nowhere else',
    k, gcd: g, degreeH: H.length - 1,
    proof: '|f|^2 - 1 = (y+1)^' + k + ' * H(y) with H(-1) = ' + hm1 + ' > 0, H(1) = ' + h1 + ' > 0, and Sturm counts 0 roots of H in (-1,1] — so |f|^2 >= 1 on the circle with equality exactly at y = -1. Exact integer arithmetic end to end; no enclosure could decide this tie.'
  };
}

module.exports = { sweepBox, barFromFloorSq, stageWMin4, dyadicBelowBar, certifyMinEqualsOne,
  _orbit: { primitiveOf, reverseSet, dilate, inOrbit, setGcd } };
