/* minus.js — rigorous enclosures for MINUS continued fractions: the zeta(3)
   family the positive-tail argument cannot touch, decided unconditionally.

   The Ramanujan Machine's zeta(3) table is all minus-CFs:

       x = b0 − a1/(b1 − a2/(b2 − a3/(b3 − ...)))          a_n > 0, b_n > 0

   For these the positive-CF seed t ∈ (0, a/b] (cf.js) does not apply: the
   subtraction can, in principle, take a tail anywhere. What replaces it is a
   TAIL BAND, proved rather than assumed. Write the tail from level n as

       s_n = b_n − a_{n+1}/s_{n+1},     x = b0 − a1/s_1 ,

   and let the certificate name two rational-coefficient polynomials L(n),
   U(n) and a base index N0. Four families of polynomial inequalities, each
   decided EXACTLY by shift-and-check — substitute n = N0 + m, expand over
   BigInt rationals, and require every coefficient nonnegative, which proves
   nonnegativity for all integer n >= N0 — establish, for all n >= N0:

     (T)  L(n) <= b_n <= U(n)                      terminal containment
     (I−) b_n − a_{n+1}/L(n+1) >= L(n)             band invariance from below
     (I+) b_n − a_{n+1}/U(n+1) <= U(n)             band invariance from above
     (P)  L(n) > 0, a_n > 0                        positivity

   THE ARGUMENT, elementary and complete. Fix a depth k >= n >= N0 and let
   s_n^(k) be the depth-k truncation (s_k^(k) = b_k). By (T) the terminal
   value lies in the band; each map f_n(t) = b_n − a_{n+1}/t is INCREASING in
   t for t > 0, so (I−)/(I+) push the band down one level at a time: by
   finite induction s_n^(k) ∈ [L(n), U(n)] for every N0 <= n <= k. Seed the
   backward INTERVAL iteration with [L(N+1), U(N+1)], outward-rounded: the
   result encloses s_1^(k) — and hence the convergent x_k — for EVERY depth
   k >= N+1 simultaneously. Convergence is proved, not consumed: comparing
   depths k and k+1, the terminal drops (b_k − a_{k+1}/b_{k+1} < b_k), and
   increasing maps propagate the drop, so x_k is strictly decreasing in k;
   it is bounded below by the enclosure's lower end; hence it converges, and
   its limit lies in the closed enclosure. (Positivity of every intermediate
   s_n^(k) — needed for "increasing" — is certified by the bands for
   n >= N0 and by the interval iteration keeping a positive lower bound for
   the head levels n < N0; the evaluator REFUSES if it does not.)

   ZETA(3) ITSELF, with no consumed theorem: from the defining series
   sum 1/k^3, summed EXACTLY over BigInt to K terms. The tail is bracketed
   by convexity alone: the tangent-line bound gives
       tail <= INT_{K+1/2}^inf x^-3 dx = 2/(2K+1)^2,
   and the Taylor-remainder bound on the midpoint rule gives
       tail >= 2/(2K+1)^2 − 2/(2K−1)^4.
   Both ends are exact rationals; at K = 6000 the bracket is 9.6e-17 wide.
   Every comparison against the CF enclosure is then made in exact rational
   arithmetic (doubles convert losslessly via fromDouble) — the verdict
   never touches floating point.

   MIT licensed. Part of cert-machine. */
'use strict';

const IV = require('#instruments/interval/interval.js');
const Q = require('#instruments/interval/rational.js');

/* ---- univariate polynomials over Q: array of rationals, index = power ---- */
const pTrim = (p) => { const o = p.slice(); while (o.length && Q.isZero(o[o.length - 1])) o.pop(); return o; };
function pAdd(a, b) {
  const o = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) o.push(Q.add(a[i] || Q.ZERO, b[i] || Q.ZERO));
  return pTrim(o);
}
function pSub(a, b) { return pAdd(a, b.map(Q.neg)); }
function pMul(a, b) {
  const o = new Array(Math.max(a.length + b.length - 1, 0)).fill(Q.ZERO);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) o[i + j] = Q.add(o[i + j], Q.mul(a[i], b[j]));
  return pTrim(o);
}
/* p(n + s) by binomial expansion — the SHIFT in shift-and-check */
function pShift(p, s) {
  const S = Q.R(BigInt(s));
  let out = [];
  for (let i = p.length - 1; i >= 0; i--) out = pAdd(pMul(out, [S, Q.ONE]), [p[i]]);   /* Horner in (n + s) */
  return out;
}
function pEvalQ(p, n) {           /* exact value at integer n */
  const N = Q.R(BigInt(n));
  let s = Q.ZERO;
  for (let i = p.length - 1; i >= 0; i--) s = Q.add(Q.mul(s, N), p[i]);
  return s;
}
const pOfInts = (ints) => ints.map(c => Q.R(BigInt(c)));

/* all coefficients of p(N0 + m) nonnegative — a PROOF that p(n) >= 0 for
   every integer n >= N0 (each term of the shifted polynomial is >= 0 at
   m >= 0). Sufficient, not necessary: a certificate that fails here is
   refused, never patched. */
function nonnegFor(p, N0) {
  const sh = pShift(p, N0);
  for (let i = 0; i < sh.length; i++) if (Q.sign(sh[i]) < 0) {
    return { ok: false, why: 'coefficient of m^' + i + ' in p(N0+m) is ' + Q.toString(sh[i]) + ' < 0' };
  }
  return { ok: true };
}

/* ---- the tail-band certificate, checked exactly --------------------------- */
function checkTailCert(spec, cert) {
  const a = pOfInts(spec.aPoly), b = pOfInts(spec.bPoly);
  const { N0, L, U } = cert;
  const a1 = pShift(a, 1), L1 = pShift(L, 1), U1 = pShift(U, 1);   /* composed at n+1 */
  const checks = [];
  const need = (p, label) => {
    const r = nonnegFor(p, N0);
    if (!r.ok) return { ok: false, why: label + ' FAILS for n >= ' + N0 + ': ' + r.why };
    checks.push(label + ' for all n >= ' + N0 + ' (shift-and-check coefficient positivity)');
    return null;
  };

  /* positivity: a(n) > 0 for n >= 1; L(n) > 0 for n >= N0 */
  {
    const r = nonnegFor(a, 1);
    if (!r.ok || Q.sign(pEvalQ(a, 1)) <= 0) return { ok: false, why: 'a(n) > 0 for n >= 1 not certified: ' + (r.ok ? 'a(1) <= 0' : r.why) };
    checks.push('a(n) > 0 for all n >= 1');
  }
  {
    const r = nonnegFor(L, N0);
    if (!r.ok || Q.sign(pEvalQ(L, N0)) <= 0) return { ok: false, why: 'L(n) > 0 for n >= N0 not certified: ' + (r.ok ? 'L(N0) <= 0' : r.why) };
    checks.push('L(n) > 0 for all n >= ' + N0);
  }

  let bad;
  /* (T) terminal containment: L <= b <= U */
  if ((bad = need(pSub(b, L), '(T) b(n) − L(n) >= 0'))) return bad;
  if ((bad = need(pSub(U, b), '(T) U(n) − b(n) >= 0'))) return bad;
  /* (I−): b·L(n+1) − a(n+1) − L·L(n+1) >= 0   (divide by L(n+1) > 0) */
  if ((bad = need(pSub(pSub(pMul(b, L1), a1), pMul(L, L1)), '(I−) band invariance from below'))) return bad;
  /* (I+): U·U(n+1) − b·U(n+1) + a(n+1) >= 0   (divide by U(n+1) > 0) */
  if ((bad = need(pAdd(pSub(pMul(U, U1), pMul(b, U1)), a1), '(I+) band invariance from above'))) return bad;

  return { ok: true, checks };
}

/* ---- the evaluator -------------------------------------------------------- */
/* encloseMinus({b0, aPoly, bPoly}, cert, N) — an enclosure of the minus-CF
   containing every convergent x_k with k >= N+1 and their (proved) limit. */
function encloseMinus(spec, cert, N) {
  const tc = checkTailCert(spec, cert);
  if (!tc.ok) return { ok: false, why: 'tail certificate refused: ' + tc.why };
  if (!(Number.isInteger(N) && N >= cert.N0)) return { ok: false, why: 'depth N must be an integer >= N0 = ' + cert.N0 };

  /* coefficient values are ENCLOSED, never trusted to a format: below
     nExact (found by exact BigInt binary search) the Number-Horner value is
     the true integer and enters as a THIN interval; beyond it, interval
     Horner with outward rounding — sound at any depth, n^6 blowing past
     2^53 costs width (~1 ulp per level), never soundness. The exact branch
     requires nonnegative coefficients so Horner intermediates are bounded
     by the final value. */
  const aInt = spec.aPoly.map(Number), bInt = spec.bPoly.map(Number);
  const pIV = (c, n) => {
    let s = IV.iv(0);
    const NN = IV.iv(n);
    for (let i = c.length - 1; i >= 0; i--) s = IV.add(IV.mul(s, NN), IV.iv(c[i]));
    return s;
  };
  const nonneg = spec.aPoly.every(c => c >= 0) && spec.bPoly.every(c => c >= 0);
  let nExact = 0;
  if (nonneg) {
    const big = (c, n) => { let s = 0n; const NN = BigInt(n); for (let i = c.length - 1; i >= 0; i--) s = s * NN + BigInt(c[i]); return s; };
    const fits = (n) => big(spec.aPoly, n) < 9007199254740992n && big(spec.bPoly, n) < 9007199254740992n;
    let lo = 0, hi = N + 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (fits(mid)) lo = mid; else hi = mid - 1; }
    nExact = lo;
  }
  const numHorner = (c, n) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = s * n + c[i]; return s; };
  const coeff = (c, n) => (n <= nExact ? IV.iv(numHorner(c, n)) : pIV(c, n));
  if (spec.b0 !== undefined && Q.cmp(pEvalQ(pOfInts(spec.bPoly), 0), Q.R(BigInt(spec.b0))) !== 0)
    return { ok: false, why: 'b0 disagrees with bPoly(0)' };

  /* seed: the PROVED band at level N+1, outward-rounded */
  const Lv = Q.toDouble(pEvalQ(cert.L, N + 1)), Uv = Q.toDouble(pEvalQ(cert.U, N + 1));
  let S = [IV.nextDown(Lv), IV.nextUp(Uv)];
  for (let n = N; n >= 1; n--) {
    if (S[0] <= 0) return { ok: false, why: 'tail interval lost positivity at level ' + (n + 1) + ' — head positivity uncertified, REFUSING' };
    S = IV.sub(coeff(bInt, n), IV.div(coeff(aInt, n + 1), S));
  }
  if (S[0] <= 0) return { ok: false, why: 'tail interval lost positivity at level 1' };
  const enc = IV.sub(coeff(bInt, 0), IV.div(coeff(aInt, 1), S));
  return {
    ok: true, enclosure: enc, width: enc[1] - enc[0], N, checks: tc.checks,
    note: 'minus-CF backward interval evaluation from the PROVED tail band [L(n), U(n)]; encloses every '
      + 'convergent of depth > ' + N + ' and their limit (monotone decreasing, bounded below — convergence '
      + 'proved inside the certificate, no external theorem consumed)'
  };
}

/* ---- zeta(3), bracketed exactly from the defining series ------------------ */
/* raw fractions [num, den], den > 0, NEVER reduced (gcd on 60k-digit
   integers is the only thing here that would be slow) */
const fAdd = (x, y) => [x[0] * y[1] + y[0] * x[1], x[1] * y[1]];
const fSub = (x, y) => [x[0] * y[1] - y[0] * x[1], x[1] * y[1]];
const fCmp = (x, y) => { const l = x[0] * y[1], r = y[0] * x[1]; return l < r ? -1 : l > r ? 1 : 0; };
function fToDouble(x) {
  const bits = (v) => (v < 0n ? -v : v).toString(2).length;
  const sh = BigInt(Math.max(0, Math.max(bits(x[0]), bits(x[1])) - 512));
  return Number(x[0] >> sh) / Number(x[1] >> sh);
}

function sumInvCubes(lo, hi) {          /* balanced tree: BigInt products stay even-sized */
  if (lo === hi) { const k = BigInt(lo); return [1n, k * k * k]; }
  const mid = (lo + hi) >> 1;
  return fAdd(sumInvCubes(lo, mid), sumInvCubes(mid + 1, hi));
}

const z3cache = new Map();
/* zeta3Bracket(K) -> { lo, hi, width } — exact rational bracket:
     sum_{k<=K} 1/k^3 + [ 2/(2K+1)^2 − 2/(2K−1)^4 ,  2/(2K+1)^2 ].
   Upper tail: x^-3 is convex, so 1/k^3 <= INT_{k−1/2}^{k+1/2} x^-3 dx
   (tangent line at k lies below the curve; integrate). Lower tail: the
   midpoint-rule error on each cell is at most max f''/24 = (k−1/2)^-5 / 2,
   and sum (k−1/2)^-5 <= INT_{K−1/2}^inf x^-5 dx — Taylor with remainder and
   one more integral bound, nothing else. */
function zeta3Bracket(K) {
  if (z3cache.has(K)) return z3cache.get(K);
  const S = sumInvCubes(1, K);
  const twoK1 = BigInt(2 * K + 1), twoKm1 = BigInt(2 * K - 1);
  const tailHi = [2n, twoK1 * twoK1];
  const err = [2n, twoKm1 * twoKm1 * twoKm1 * twoKm1];
  const hi = fAdd(S, tailHi);
  const lo = fSub(hi, err);
  const r = { lo, hi, width: fToDouble(err), K };
  z3cache.set(K, r);
  return r;
}

/* ---- the decision --------------------------------------------------------- */
/* decideZeta3Form(enclosure, r, K) — is the exact bracket of r/zeta(3)
   disjoint from a rigorous CF enclosure [lo, hi] (doubles)? The comparison
   is exact end to end: enclosure endpoints convert losslessly via
   fromDouble; nothing floating decides. Shared by the minus evaluator and
   by positive-CF rows whose claimed form speaks zeta(3). */
function decideZeta3Form(enclosure, r, K) {
  const z = zeta3Bracket(K || 6000);
  if (Q.sign(r) <= 0) return { verdict: 'REFUSED', why: 'form r/zeta(3) needs r > 0' };
  /* r/zeta(3) ∈ [ r/zHi, r/zLo ] — zeta(3) > 1 so both ends positive */
  const formLo = [r.n * z.hi[1], r.d * z.hi[0]];
  const formHi = [r.n * z.lo[1], r.d * z.lo[0]];
  const cfLoQ = Q.fromDouble(enclosure[0]), cfHiQ = Q.fromDouble(enclosure[1]);
  const disjoint = fCmp([cfHiQ.n, cfHiQ.d], formLo) < 0 || fCmp(formHi, [cfLoQ.n, cfLoQ.d]) < 0;
  return { disjoint, formWidth: fToDouble(fSub(formHi, formLo)),
    zeta3: { lo: fToDouble(z.lo), hi: fToDouble(z.hi), width: z.width, K: z.K } };
}

/* decideMinus(spec, r, cert, opts) — the claimed closed form is r / zeta(3),
   r a positive rational {n, d} (Q). REFUTED iff the exact form bracket and
   the exact CF enclosure are disjoint; SURVIVES otherwise. */
function decideMinus(spec, r, cert, opts) {
  opts = opts || {};
  const e = encloseMinus(spec, cert, opts.N || cert.depth);
  if (!e.ok) return { verdict: 'REFUSED', why: e.why };
  const f = decideZeta3Form(e.enclosure, r, opts.K);
  if (f.verdict) return f;                                   /* refused */
  const base = { cf: e.enclosure, cfWidth: e.width, formWidth: f.formWidth,
    zeta3: f.zeta3, N: e.N, checks: e.checks, note: e.note };
  if (f.disjoint) return { verdict: 'REFUTED', ...base,
    why: 'the claimed form lies provably OUTSIDE the rigorous minus-CF enclosure — the conjecture is false' };
  return { verdict: 'SURVIVES', ...base,
    note2: 'the claimed form lies inside a rigorous enclosure of width ' + e.width.toExponential(2)
      + ' — consistency certified to that slack, equality not proved' };
}

module.exports = { checkTailCert, encloseMinus, zeta3Bracket, decideMinus, decideZeta3Form,
  _poly: { pAdd, pSub, pMul, pShift, pEvalQ, pOfInts, nonnegFor } };
