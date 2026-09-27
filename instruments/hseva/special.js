/* instruments/hseva/special.js — the gamma-function family, enclosed: lnΓ, the
   digamma ψ, the trigamma ψ′, and the regularized incomplete gamma P(a, z)
   with its inverse. The generalized gamma needs all five: ψ and ψ′ in its
   score and Hessian, lnΓ and P in its CDF, P⁻¹ in its return levels.

   Written once over an arithmetic `ops` (families.js does the same), so the
   float candidate and the interval certificate run the same lines.

   THE TAILS, and why each bound holds for real z > 0. Binet's second formula
   (Whittaker & Watson §12.32) gives, with the Bernoulli numbers B_2k,
     lnΓ(z) = (z − ½) ln z − z + ½ ln 2π + 2∫₀^∞ arctan(t/z) / (e^{2πt} − 1) dt,
     ψ(z)   = ln z − 1/(2z) − 2∫₀^∞ t / ((t² + z²)(e^{2πt} − 1)) dt,
     ψ′(z)  = 1/z + 1/(2z²) + 4z ∫₀^∞ t / ((t² + z²)² (e^{2πt} − 1)) dt.
   Expanding arctan(w), 1/(1 + u) and 1/(1 + u)² to m terms leaves remainders
   bounded by w^{2m+1}/(2m+1), u^m and (m+1)u^m for every w, u ≥ 0, and
   ∫₀^∞ t^{2k−1}/(e^{2πt} − 1) dt = |B_2k|/(4k); so after m terms of each
   asymptotic series the error is at most the first omitted term:
     lnΓ: |B_{2m+2}| / ((2m+2)(2m+1) z^{2m+1}),  ψ: |B_{2m+2}| / ((2m+2) z^{2m+2}),
     ψ′: |B_{2m+2}| / z^{2m+3}.
   Here m = 8 and z ≥ 20 after the recurrences Γ(z+1) = zΓ(z), ψ(z+1) = ψ(z) + 1/z,
   ψ′(z+1) = ψ′(z) − 1/z², so every tail is below 10⁻²³ and is added as a pad.

   P(a, z) = z^a e^{−z} / Γ(a+1) · Σ_{n≥0} z^n / ((a+1)…(a+n)). Once the ratio
   r = z/(a+N+1) is below 1, every later ratio is smaller still, so the terms
   after the N-th sum to at most t_N r/(1 − r): that is the pad.

   INTERVAL ARGUMENTS by monotonicity, never by running a series on a wide
   box: ψ increases and ψ′ decreases on (0, ∞); lnΓ decreases up to its
   minimum at x* = 1.46163… and increases after it; P increases in z and
   decreases in a, so P over a box is its value at two corners, and P⁻¹(a, p)
   increases in both a and p. P⁻¹ is a bisection that tightens only where the
   sign of P(a, z) − p is certain. */
'use strict';

/* B_2 … B_18, exact */
const B2K = [[1, 6], [-1, 30], [1, 42], [-1, 30], [5, 66], [-691, 2730], [7, 6], [-3617, 510], [43867, 798]];
const M = 8;             /* terms kept; B_18 bounds the tail */
const SHIFT = 20;        /* the recurrences lift the argument to at least this */
const XSTAR = 1.4616321449683622;               /* the minimum of Γ on (0, ∞) */
const LGAMMA_MIN = -0.12148629053584962;        /* lnΓ(x*); a lower bound is taken 1e-15 below it */

function makeGamma(ops) {
  const { add, sub, mul, div, c, log, exp, lo, hi, abs } = ops;
  const bern = (k) => div(c(B2K[k][0]), c(B2K[k][1]));        /* B_{2(k+1)} */
  const HALF_LN_2PI = mul(c(0.5), log(mul(c(2), ops.PI)));
  const thin = (x) => c(x);

  function lgammaPoint(x) {                                   /* x thin, > 0 */
    let z = x, prod = null;
    while (hi(z) < SHIFT) { prod = prod ? mul(prod, z) : z; z = add(z, c(1)); }
    const z2 = mul(z, z);
    let s = add(sub(mul(sub(z, c(0.5)), log(z)), z), HALF_LN_2PI);
    let zp = z;                                               /* z^{2k−1} */
    for (let k = 1; k <= M; k++) { s = add(s, div(bern(k - 1), mul(c(2 * k * (2 * k - 1)), zp))); zp = mul(zp, z2); }
    s = ops.widen(s, abs(div(bern(M), mul(c((2 * M + 2) * (2 * M + 1)), zp))));
    return prod ? sub(s, log(prod)) : s;
  }
  function digammaPoint(x) {
    let z = x, acc = null;
    while (hi(z) < SHIFT) { const r = div(c(1), z); acc = acc ? add(acc, r) : r; z = add(z, c(1)); }
    const z2 = mul(z, z);
    let s = sub(log(z), div(c(1), mul(c(2), z)));
    let zp = z2;                                              /* z^{2k} */
    for (let k = 1; k <= M; k++) { s = sub(s, div(bern(k - 1), mul(c(2 * k), zp))); zp = mul(zp, z2); }
    s = ops.widen(s, abs(div(bern(M), mul(c(2 * M + 2), zp))));
    return acc ? sub(s, acc) : s;
  }
  function trigammaPoint(x) {
    let z = x, acc = null;
    while (hi(z) < SHIFT) { const r = div(c(1), mul(z, z)); acc = acc ? add(acc, r) : r; z = add(z, c(1)); }
    const z2 = mul(z, z);
    let s = add(div(c(1), z), div(c(1), mul(c(2), z2)));
    let zp = mul(z2, z);                                      /* z^{2k+1} */
    for (let k = 1; k <= M; k++) { s = add(s, div(bern(k - 1), zp)); zp = mul(zp, z2); }
    s = ops.widen(s, abs(div(bern(M), zp)));
    return acc ? add(s, acc) : s;
  }
  /* P(a, z) at a thin point: the series with its geometric tail */
  function gammaPPoint(a, z) {
    if (hi(z) <= 0) return c(0);
    let t = c(1), S = c(1);
    for (let n = 1; n <= 20000; n++) {
      t = mul(t, div(z, add(a, c(n))));
      S = add(S, t);
      const r = div(z, add(a, c(n + 1)));
      if (hi(r) < 0.95) {
        const tail = mul(t, div(r, sub(c(1), r)));
        if (hi(tail) <= 1e-18 * lo(S)) { S = ops.widen(S, abs(tail)); break; }
      }
      if (n === 20000) throw new Error('gammaP: the series did not settle (a ' + lo(a) + ', z ' + lo(z) + ')');
    }
    const pre = exp(sub(sub(mul(a, log(z)), z), lgammaPoint(add(a, c(1)))));
    const P = mul(pre, S);
    return ops.clamp01 ? ops.clamp01(P) : P;
  }

  /* over boxes, by monotonicity */
  /* The two combinations the Prentice form of the generalized gamma needs, at a = Q⁻²:
       gap1(Q) = ln a + 1 − ψ(a) = 1 + Q²/2 + Σ_k B_2k Q^{4k}/(2k) − R,   |R| ≤ |B_{2m+2}| Q^{4m+4}/(2m+2)
       gap2(Q) = 1/a − ψ′(a)     = −Q⁴/2 − Σ_k B_2k Q^{4k+2} − R′,       |R′| ≤ |B_{2m+2}| Q^{4m+6}
     — Binet's series of ψ and ψ′ with a = Q⁻², written in Q. As differences of ψ and ln a
     they cancel to O(Q²) and O(Q⁴) and an interval over a box of Q loses everything to
     the dependency; as polynomials in Q nothing cancels. Used for Q ≤ 0.2 (a ≥ 25), where
     the tail is below 10⁻²⁸; above it the differences are harmless and taken directly. */
  function gap1(Q) {
    if (hi(abs(Q)) > 0.2) { const a = div(c(1), mul(Q, Q)); return sub(add(log(a), c(1)), ops.digamma(a)); }
    const Q2 = mul(Q, Q), Q4 = mul(Q2, Q2);
    let s = add(c(1), mul(c(0.5), Q2)), qp = Q4;               /* Q^{4k} */
    for (let k = 1; k <= M; k++) { s = add(s, div(mul(bern(k - 1), qp), c(2 * k))); qp = mul(qp, Q4); }
    return ops.widen(s, abs(div(mul(bern(M), qp), c(2 * M + 2))));
  }
  function gap2(Q) {
    if (hi(abs(Q)) > 0.2) { const a = div(c(1), mul(Q, Q)); return sub(div(c(1), a), ops.trigamma(a)); }
    const Q2 = mul(Q, Q), Q4 = mul(Q2, Q2);
    let s = ops.neg(mul(c(0.5), Q4)), qp = mul(Q4, Q2);          /* Q^{4k+2} */
    for (let k = 1; k <= M; k++) { s = sub(s, mul(bern(k - 1), qp)); qp = mul(qp, Q4); }
    return ops.widen(s, abs(mul(bern(M), qp)));
  }

  if (!ops.isInterval) {                                      /* floats: a point is its own box */
    return { lgamma: lgammaPoint, digamma: digammaPoint, trigamma: trigammaPoint, gammaP: gammaPPoint,
      gammaPinv: (A, Pr) => gammaPinvPoint(A, Pr), gap1, gap2, lgammaPoint, digammaPoint, trigammaPoint, gammaPPoint };
  }
  const lgamma = (X) => {
    if (lo(X) >= XSTAR + 1e-12) return ops.hull(lgammaPoint(thin(lo(X))), lgammaPoint(thin(hi(X))));
    if (hi(X) <= XSTAR - 1e-12) return ops.hull(lgammaPoint(thin(hi(X))), lgammaPoint(thin(lo(X))));
    const a = lgammaPoint(thin(lo(X))), b = lgammaPoint(thin(hi(X)));
    return ops.hull(ops.hull(a, b), c(LGAMMA_MIN - 1e-15));
  };
  const digamma = (X) => ops.hull(digammaPoint(thin(lo(X))), digammaPoint(thin(hi(X))));
  const trigamma = (X) => ops.hull(trigammaPoint(thin(hi(X))), trigammaPoint(thin(lo(X))));
  const gammaP = (A, Z) => ops.hull(gammaPPoint(thin(hi(A)), thin(lo(Z))), gammaPPoint(thin(lo(A)), thin(hi(Z))));

  /* P⁻¹(a, p) at thin a and thin p: the z with P(a, z) = p, bracketed on certain signs */
  function gammaPinvPoint(a, p) {
    const below = (z) => hi(gammaPPoint(a, c(z))) < lo(p);    /* certainly P(a, z) < p */
    const above = (z) => lo(gammaPPoint(a, c(z))) > hi(p);    /* certainly P(a, z) > p */
    let zl = 0, zh = Math.max(1, 2 * lo(a));
    for (let i = 0; i < 200 && !above(zh); i++) { zl = zh; zh *= 2; }
    for (let i = 0; i < 200; i++) {
      const mid = (zl + zh) / 2;
      if (above(mid)) zh = mid; else if (below(mid)) zl = mid; else break;
      if (zh - zl <= 1e-13 * zh) break;
    }
    return ops.pair(zl, zh);
  }
  const gammaPinv = (A, Pr) => ops.hull(gammaPinvPoint(thin(lo(A)), thin(lo(Pr))), gammaPinvPoint(thin(hi(A)), thin(hi(Pr))));

  return { lgamma, digamma, trigamma, gammaP, gammaPinv, gap1, gap2, lgammaPoint, digammaPoint, trigammaPoint, gammaPPoint };
}

module.exports = { makeGamma, B2K, XSTAR, LGAMMA_MIN };
