/* lambda.js — the Chowla/Erdős-#510 lambda side: for a set A of DISTINCT
   POSITIVE integers, f_A(x) = sum cos(a x), lambda_A = -min_x f_A, and
   lambda(n) is the INFIMUM over n-element sets. Minimising lambda means
   MAXIMISING min f_A; a box optimiser is a certified UPPER bound on
   lambda(n) plus completeness over the named box — it is NOT a value, and
   no box can give a lower bound. NEW CODE (cert-machine, 2026-08-25); the
   certifier core (certify-min.certify, the lifted instrument) is untouched.

   THE DIRECTION TRAPS, encoded rather than remembered — each one is a
   failure the source lab's lambda probe actually produced in a day:
     · the bar is NEGATIVE (min of a zero-mean nonconstant cosine sum is
       always < 0). A non-negative bar is the wrong-endpoint bug — it sits
       above every minimum in existence, kills the whole box INCLUDING the
       champion, and reports "nothing beats the champion" as a SUCCESS
       shape. sweepLambdaBox REFUSES it by name (LAMBDA-BAR-NOT-NEGATIVE),
       and the battery demonstrates the disaster it prevents.
     · NO reversal symmetry: the mu side's champion/mirror pairs come from
       the difference multiset, which does not exist here. Orbits are
       dilation-only (f_{kA}(x) = f_A(kx), circle onto itself).
     · cross-n comparisons are FORBIDDEN in records: two box upper bounds
       order nothing (lambda(6) < lambda(5) needs a LOWER bound no box
       gives). Records carry the caveat in their own text.

   The cascade is sweep.js's, one degree simpler because f is LINEAR in the
   residue counts at a root of unity: for m in {2,3,4,6}, 2*f_A(2*pi/m) is
   an INTEGER (2cos values in {0,±1,±2}) — one integer inequality against
   the bar kills a set before any float exists. The dyadic exact kill
   evaluates sum T_a(y0) by the same Chebyshev value recurrence, no
   polynomial assembled; survivors get the full certificate.

   MIT licensed. Part of cert-machine. */
'use strict';

const CM = require('./certify-min.js');
const IV = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');

/* ---------------- the certificate ---------------- */

const gcdInt = (a, b) => { while (b) { const t = a % b; a = b; b = t; } return a; };
const setGcd = (A) => { let g = 0; for (const a of A) g = gcdInt(g, a); return g || 1; };

function validateLambdaSet(A) {
  if (!Array.isArray(A) || A.length < 1) throw new Error('lambda: A must be a non-empty array');
  for (const a of A) if (!Number.isInteger(a) || a < 1) throw new Error('lambda: members must be POSITIVE integers (no 0 — this is not the Newman side), got ' + a);
  for (let i = 1; i < A.length; i++) if (A[i] <= A[i - 1]) throw new Error('lambda: A must be strictly increasing');
  return A;
}

/* certifyLambda(A) — certified enclosures of min f_A and lambda_A.
   Dilation-reduced first: f_{gA'}(x) = f_A'(gx), same min, lower degree. */
function certifyLambda(A, opts) {
  validateLambdaSet(A);
  const g = setGcd(A);
  const Ar = g > 1 ? A.map(a => a / g) : A;
  const res = CM.certify(Ar, { tol: (opts && opts.tol) || 1e-12 });
  const minE = res.minEnclosure;
  return {
    A: A.slice(), gcd: g, reduced: Ar.slice(),
    minEnclosure: minE,
    lambda: [-minE[1], -minE[0]],
    degree: Ar[Ar.length - 1],
    method: 'sum of T_a -> ' + res.method,
    counts: res.counts
  };
}

/* ---------------- stage W: integer values of 2*f at roots of unity ---------------- */

function stageWMin2(A) {
  let c0 = 0, c1 = 0, d0 = 0, d1 = 0, d2 = 0, e0 = 0, e1 = 0, e2 = 0, e3 = 0,
    f0 = 0, f1 = 0, f2 = 0, f3 = 0, f4 = 0, f5 = 0;
  for (const a of A) {
    (a & 1) ? c1++ : c0++;
    const r3 = a % 3; r3 === 0 ? d0++ : r3 === 1 ? d1++ : d2++;
    const r4 = a & 3; r4 === 0 ? e0++ : r4 === 1 ? e1++ : r4 === 2 ? e2++ : e3++;
    const r6 = a % 6;
    r6 === 0 ? f0++ : r6 === 1 ? f1++ : r6 === 2 ? f2++ : r6 === 3 ? f3++ : r6 === 4 ? f4++ : f5++;
  }
  /* 2*f at x = 2pi/m: m=2: 2(c0-c1); m=3: 2c0-c1-c2; m=4: 2(c0-c2); m=6: 2c0+c1-c2-2c3-c4+c5 */
  return Math.min(2 * (c0 - c1), 2 * d0 - d1 - d2, 2 * (e0 - e2), 2 * f0 + f1 - f2 - 2 * f3 - f4 + f5);
}

/* ---------------- stage K: exact dyadic evaluation of sum T_a ---------------- */

const DY_BITS = 26;
const DY_SCALE = 1 << DY_BITS;
const DY_SQ = 1n << BigInt(2 * DY_BITS);

/* is f_A(y0) = sum_{a in Ar} T_a(y0) < bar, exactly? (members, multiplicity 1) */
function dyadicBelowBar(Ar, p, bar) {
  const maxD = Ar[Ar.length - 1];
  const members = new Set(Ar);
  const P2 = 2n * BigInt(p);
  let uPrev = 1n, uCur = BigInt(p);
  let acc = 0n;
  const shift = (k) => BigInt((maxD - k) * DY_BITS);
  if (members.has(1)) acc += uCur << shift(1);
  for (let k = 2; k <= maxD; k++) {
    const uNext = P2 * uCur - DY_SQ * uPrev;
    uPrev = uCur; uCur = uNext;
    if (members.has(k)) acc += uCur << shift(k);
  }
  const den = 1n << BigInt(maxD * DY_BITS);
  /* acc/den < bn/bd  <=>  acc*bd < bn*den   (bd > 0) */
  return acc * bar.bd < bar.bn * den;
}

/* ---------------- the bar (NEGATIVE, or refused by name) ---------------- */

function lambdaBarFromFloor(minFloor) {
  if (!Number.isFinite(minFloor)) throw new Error('LAMBDA-BAR-NOT-FINITE');
  if (minFloor >= 0) throw new Error('LAMBDA-BAR-NOT-NEGATIVE: a bar of ' + minFloor
    + ' sits above every cosine-sum minimum in existence and would kill the champion itself — wrong-endpoint bug');
  const b = IV.nextDown(minFloor);
  const r = Q.fromDouble(b);
  return { bn: r.n, bd: r.d, asDouble: b };
}

/* ---------------- orbits: dilation ONLY ---------------- */

const dilate = (A, k) => A.map(a => a * k);
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
function primitiveOf(A) { const g = setGcd(A); return g > 1 ? A.map(a => a / g) : A.slice(); }
function inOrbit(B, P, M) {
  for (let k = 1; k * P[P.length - 1] <= M; k++) if (sameSet(B, dilate(P, k))) return true;
  return false;
}
function lexLess(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) { if (a[i] !== b[i]) return a[i] < b[i]; }
  return a.length < b.length;
}

/* ---------------- the sweep ---------------- */

function binom(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }

/* sweepLambdaBox({n, M, seed, K, log}) — every n-subset of 1..M decided
   exactly against the bar from the CERTIFIED seed. Returns the exhaustion
   record; throws on a conservation failure or a non-negative bar. */
function sweepLambdaBox(opts) {
  const { n, M } = opts;
  const K = opts.K || 1024;
  const log = opts.log || (() => {});
  if (!Number.isInteger(n) || n < 2 || !Number.isInteger(M) || M < n) throw new Error('lambda sweep: bad box');
  const t0 = Date.now();

  const seed = opts.seed;
  validateLambdaSet(seed);
  if (seed.length !== n) throw new Error('lambda sweep: seed must have exactly n members');
  if (seed[seed.length - 1] > M) throw new Error('lambda sweep: seed must live inside the box');
  const seedCert = certifyLambda(seed);
  const bar = lambdaBarFromFloor(seedCert.minEnclosure[0]);
  const barFloat = bar.asDouble;

  /* cos tables (no sin — f IS the cosine sum) */
  const cosT = new Float64Array((M + 1) * (K + 1));
  for (let a = 1; a <= M; a++) for (let j = 0; j <= K; j++) cosT[a * (K + 1) + j] = Math.cos(a * Math.PI * j / K);

  const total = binom(M, n);
  let killedW = 0, killedDyadic = 0, certifiedBelow = 0;
  const survivors = [];

  const idx = new Array(n);
  for (let i = 0; i < n; i++) idx[i] = i + 1;
  const A = new Array(n);
  let seen = 0;

  const certifyCandidate = (Aset) => {
    const cert = certifyLambda(Aset);
    const floorQ = Q.fromDouble(cert.minEnclosure[0]);
    if (floorQ.n * bar.bd > bar.bn * floorQ.d) {
      survivors.push({ A: Aset.slice(), minEnclosure: cert.minEnclosure, lambda: cert.lambda,
        degree: Aset[Aset.length - 1], gcd: setGcd(Aset) });
    } else certifiedBelow++;
  };

  const advance = () => {
    let i = n - 1;
    while (i >= 0 && idx[i] === M - (n - 1 - i)) i--;
    if (i < 0) return false;
    idx[i]++;
    for (let j = i + 1; j < n; j++) idx[j] = idx[j - 1] + 1;
    return true;
  };

  for (;;) {
    for (let i = 0; i < n; i++) A[i] = idx[i];
    seen++;

    if (opts._dropVerdictAt === seen) { if (!advance()) break; continue; }

    /* W: 2f integer vs 2*bar */
    const w2 = stageWMin2(A);
    if (BigInt(w2) * bar.bd < 2n * bar.bn) killedW++;
    else {
      /* F: float sampled min */
      let best = Infinity, bestJ = 0;
      for (let j = 0; j <= K; j++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += cosT[A[i] * (K + 1) + j];
        if (s < best) { best = s; bestJ = j; }
      }
      if (best < barFloat + 1e-9) {
        /* K: exact dyadic kill near the argmin, in the reduced variable */
        const g = setGcd(A);
        const Ar = g > 1 ? A.map(a => a / g) : A.slice();
        let killed = false;
        for (const dj of [0, -1, 1]) {
          const j = bestJ + dj; if (j < 0 || j > K) continue;
          const y = Math.cos(g * Math.PI * j / K);
          const p = Math.max(-DY_SCALE, Math.min(DY_SCALE, Math.round(y * DY_SCALE)));
          if (dyadicBelowBar(Ar, p, bar)) { killed = true; break; }
        }
        if (killed) killedDyadic++;
        else certifyCandidate(A);
      } else certifyCandidate(A);
    }

    if (!advance()) break;
    if (seen % 2000000 === 0) log(seen + '/' + total + ' W=' + killedW + ' D=' + killedDyadic + ' S=' + survivors.length);
  }

  if (seen !== total) throw new Error('lambda sweep: enumerated ' + seen + ' sets, expected C(' + M + ',' + n + ') = ' + total);
  if (killedW + killedDyadic + certifiedBelow + survivors.length !== total) {
    throw new Error('lambda sweep: conservation identity FAILED: ' + killedW + '+' + killedDyadic + '+' + certifiedBelow + '+' + survivors.length + ' != ' + total);
  }

  /* optimiser: min-floor desc -> primitive first -> least max member -> lex */
  const ranked = survivors.slice().sort((x, y) =>
    y.minEnclosure[0] - x.minEnclosure[0] || (x.gcd === 1 ? 0 : 1) - (y.gcd === 1 ? 0 : 1) ||
    x.degree - y.degree || (lexLess(x.A, y.A) ? -1 : 1));
  const opt = ranked[0] || null;
  let orbit = null;
  if (opt) {
    const P = primitiveOf(opt.A);
    const inO = survivors.map(s => inOrbit(s.A, P, M));
    orbit = { primitive: P, uniqueUpToDilation: inO.every(Boolean),
      outsiders: survivors.filter((s, i) => !inO[i]).map(s => s.A) };
  }

  return {
    what: 'exhaustive lambda sweep: every ' + n + '-subset of 1..' + M + ' decided exactly against the bar',
    n, M, totalSets: total, K,
    seed: { A: seed.slice(), minEnclosure: seedCert.minEnclosure },
    bar: { num: bar.bn.toString(), den: bar.bd.toString(), asDouble: barFloat },
    killedAtRootsOfUnity: killedW, killedDyadic, certifiedBelow,
    survivors: survivors.map(s => ({ A: s.A, minEnclosure: s.minEnclosure, lambda: s.lambda, degree: s.degree, gcd: s.gcd })),
    optimiser: opt && { A: opt.A, minEnclosure: opt.minEnclosure, lambda: opt.lambda, degree: opt.degree, gcd: opt.gcd },
    maximumOrbit: orbit,
    conservation: killedW + '+' + killedDyadic + '+' + certifiedBelow + '+' + survivors.length + ' = ' + total,
    elapsedMs: Date.now() - t0,
    caveat: 'lambda(n) is an INFIMUM: this record is a certified UPPER bound on lambda(n) plus the statement that '
      + 'nothing inside the box does better. A box gives NO lower bound, so records at different n order NOTHING.'
  };
}

module.exports = { certifyLambda, sweepLambdaBox, lambdaBarFromFloor, stageWMin2, dyadicBelowBar,
  _orbit: { primitiveOf, dilate, inOrbit, setGcd } };
