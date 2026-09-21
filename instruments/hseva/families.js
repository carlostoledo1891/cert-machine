/* instruments/hseva/families.js — five distribution families for significant
   wave height, written ONCE over an arithmetic `ops` so the same formulas run
   in floats (to find a candidate) and in outward-rounded intervals (to certify
   it). A formula written twice diverges; here the float path and the interval
   path cannot disagree on anything but rounding.

   Each family gives, for parameters θ and data x (with L = ln x precomputed):
     score(ops, θ, D)    the gradient of the log-likelihood — the MLE is its zero
     hess(ops, θ, D)     the Hessian, for Newton and for Krawczyk
     cdf(ops, θ, x)      F(x)
     quantile(ops, θ, p) F⁻¹(p)
     init(D)             a float starting point
     names               the parameter names, in order
   D = { n, x: number[] or interval[], L: same, sx, sL, ... } — the data as the
   ops sees it. The sums are re-done per call; nothing is cached across boxes.

   The families and their likelihoods [STANDARD]:
     normal(μ, σ), lognormal(μ, σ on ln x), exponential(λ, scale),
     weibull(k, λ): F = 1 − exp(−(x/λ)^k),
     expweibull(α, k, λ): F = (1 − exp(−(x/λ)^k))^α  (Mudholkar & Srivastava 1993)
   — the two the Ocean Engineering 2026 paper found best, and three of its
   other candidates; the generalized gamma needs the digamma function, which
   this machine does not yet enclose, and is not here. */
'use strict';

/* Φ and Φ⁻¹ over the ops: erf by its Taylor series for |z| ≤ 2 (alternating,
   terms decreasing from k ≥ z², the truncation bounded by the first dropped
   term), erfc by Laplace's continued fraction beyond (both convergent orders
   evaluated; consecutive convergents of a positive fraction bracket the
   value). In floats the same code runs with thin values. */
function makePhi(ops) {
  const { add, sub, mul, div, exp, c, neg, abs, lo, hi } = ops;
  const SQRT_PI = ops.sqrt(c(Math.PI)), SQRT2 = ops.sqrt(c(2));
  function erfTaylor(z, N) {            /* Σ (−1)^k z^(2k+1) / (k! (2k+1)), times 2/√π */
    N = N || 40;
    let term = z, sum = z, z2 = mul(z, z);
    for (let k = 1; k <= N; k++) {
      term = div(mul(term, z2), c(k));   /* z^(2k+1)/k!  (sign handled below) */
      const t = div(term, c(2 * k + 1));
      sum = (k % 2) ? sub(sum, t) : add(sum, t);
    }
    /* the truncation: the next term, in magnitude, as a symmetric pad */
    const nxt = div(div(mul(term, z2), c(N + 1)), c(2 * N + 3));
    const pad = abs(nxt);
    const s = mul(div(c(2), SQRT_PI), sum);
    return ops.widen(s, pad);
  }
  function convergent(x, N) {          /* the N-th convergent of √π e^{x²} erfc(x) = 1/(x + (1/2)/(x + 1/(x + …))) */
    let t = x;
    for (let k = N; k >= 1; k--) t = add(x, div(c(k / 2), t));
    return div(c(1), t);
  }
  function erfcCF(x, N) {              /* x ≥ 1 */
    N = N || 80;
    const a = convergent(x, N), b = convergent(x, N + 1);
    const hull = ops.hull(a, b);
    return mul(div(exp(neg(mul(x, x))), SQRT_PI), hull);
  }
  /* Φ(z) = ½ erfc(−z/√2); pieces by the magnitude of z/√2 */
  function Phi(z) {
    const u = div(z, SQRT2);
    if (hi(abs(u)) <= 2) return mul(c(0.5), add(c(1), erfTaylor(u)));
    if (lo(u) >= 1) return sub(c(1), mul(c(0.5), erfcCF(u)));
    if (hi(u) <= -1) return mul(c(0.5), erfcCF(neg(u)));
    /* a box straddling the pieces: evaluate on the hull of the two forms */
    const A = mul(c(0.5), add(c(1), erfTaylor(ops.clampAbs(u, 2))));
    return ops.hull(A, lo(u) > 0 ? sub(c(1), mul(c(0.5), erfcCF(ops.max(u, c(1))))) : mul(c(0.5), erfcCF(ops.max(neg(u), c(1)))));
  }
  return { Phi, erfTaylor, erfcCF };
}

const FAMILIES = {
  normal: {
    names: ['mu', 'sigma'],
    init: (D) => { const m = D.sxf / D.n; return [m, Math.sqrt(D.sxxf / D.n - m * m)]; },
    score: (o, th, D) => {
      const [mu, s] = th; const n = o.c(D.n);
      let s1 = o.c(0), s2 = o.c(0);
      for (const x of D.x) { const d = o.sub(x, mu); s1 = o.add(s1, d); s2 = o.add(s2, o.mul(d, d)); }
      const s2q = o.mul(s, s), s3 = o.mul(s2q, s);
      return [o.div(s1, s2q), o.add(o.neg(o.div(n, s)), o.div(s2, s3))];
    },
    hess: (o, th, D) => {
      const [mu, s] = th; const n = o.c(D.n);
      let s1 = o.c(0), s2 = o.c(0);
      for (const x of D.x) { const d = o.sub(x, mu); s1 = o.add(s1, d); s2 = o.add(s2, o.mul(d, d)); }
      const s2q = o.mul(s, s), s3 = o.mul(s2q, s), s4 = o.mul(s2q, s2q);
      const a = o.neg(o.div(n, s2q)), b = o.neg(o.div(o.mul(o.c(2), s1), s3)), d = o.sub(o.div(n, s2q), o.div(o.mul(o.c(3), s2), s4));
      return [[a, b], [b, d]];
    },
    cdf: (o, th, x) => o.Phi(o.div(o.sub(x, th[0]), th[1])),
    quantile: (o, th, p) => o.add(th[0], o.mul(th[1], o.PhiInv(p))),
    loglik: (o, th, D) => { const [mu, s] = th; let q = o.c(0); for (const x of D.x) { const d = o.sub(x, mu); q = o.add(q, o.mul(d, d)); } return o.sub(o.neg(o.mul(o.c(D.n), o.log(s))), o.div(q, o.mul(o.c(2), o.mul(s, s)))); },
  },
  lognormal: {
    names: ['mu', 'sigma'],
    init: (D) => { const m = D.sLf / D.n; return [m, Math.sqrt(D.sLLf / D.n - m * m)]; },
    score: (o, th, D) => FAMILIES.normal.score(o, th, { n: D.n, x: D.L }),
    hess: (o, th, D) => FAMILIES.normal.hess(o, th, { n: D.n, x: D.L }),
    cdf: (o, th, x) => o.Phi(o.div(o.sub(o.log(x), th[0]), th[1])),
    quantile: (o, th, p) => o.exp(o.add(th[0], o.mul(th[1], o.PhiInv(p)))),
    loglik: (o, th, D) => FAMILIES.normal.loglik(o, th, { n: D.n, x: D.L }),
  },
  exponential: {
    names: ['lambda'],
    init: (D) => [D.sxf / D.n],
    score: (o, th, D) => { const [l] = th; let sx = o.c(0); for (const x of D.x) sx = o.add(sx, x); return [o.add(o.neg(o.div(o.c(D.n), l)), o.div(sx, o.mul(l, l)))]; },
    hess: (o, th, D) => { const [l] = th; let sx = o.c(0); for (const x of D.x) sx = o.add(sx, x); const l2 = o.mul(l, l); return [[o.sub(o.div(o.c(D.n), l2), o.div(o.mul(o.c(2), sx), o.mul(l2, l)))]]; },
    cdf: (o, th, x) => o.sub(o.c(1), o.exp(o.neg(o.div(x, th[0])))),
    quantile: (o, th, p) => o.neg(o.mul(th[0], o.log(o.sub(o.c(1), p)))),
    loglik: (o, th, D) => { let sx = o.c(0); for (const x of D.x) sx = o.add(sx, x); return o.sub(o.neg(o.mul(o.c(D.n), o.log(th[0]))), o.div(sx, th[0])); },
  },
  weibull: {
    names: ['k', 'lambda'],
    init: (D) => {
      /* the standard moment start: k from the variance of ln x, λ from the mean of x^k */
      const m = D.sLf / D.n, v = D.sLLf / D.n - m * m;
      const k = Math.min(20, Math.max(0.3, 1.2825 / Math.sqrt(Math.max(v, 1e-12))));
      let s = 0; for (const x of D.xf) s += Math.pow(x, k);
      return [k, Math.pow(s / D.n, 1 / k)];
    },
    sums: (o, th, D) => {
      const [k, l] = th; const lnl = o.log(l);
      let S0 = o.c(0), S1 = o.c(0), S2 = o.c(0), SL = o.c(0);      /* Σ y^k, Σ y^k ln y, Σ y^k (ln y)², Σ ln y */
      for (let i = 0; i < D.n; i++) {
        const ly = o.sub(D.L[i], lnl);
        const yk = o.exp(o.mul(k, ly));
        const t1 = o.mul(yk, ly);
        S0 = o.add(S0, yk); S1 = o.add(S1, t1); S2 = o.add(S2, o.mul(t1, ly)); SL = o.add(SL, ly);
      }
      return { S0, S1, S2, SL, k, l, n: o.c(D.n) };
    },
    score: (o, th, D) => {
      const { S0, S1, SL, k, l, n } = FAMILIES.weibull.sums(o, th, D);
      return [o.sub(o.add(o.div(n, k), SL), S1), o.mul(o.div(k, l), o.sub(S0, n))];
    },
    hess: (o, th, D) => {
      const { S0, S1, S2, k, l, n } = FAMILIES.weibull.sums(o, th, D);
      const kk = o.sub(o.neg(o.div(n, o.mul(k, k))), S2);
      const kl = o.div(o.add(o.sub(S0, n), o.mul(k, S1)), l);
      const ll = o.mul(o.div(k, o.mul(l, l)), o.sub(n, o.mul(o.add(o.c(1), k), S0)));
      return [[kk, kl], [kl, ll]];
    },
    cdf: (o, th, x) => o.sub(o.c(1), o.exp(o.neg(o.exp(o.mul(th[0], o.sub(o.log(x), o.log(th[1]))))))),
    quantile: (o, th, p) => o.mul(th[1], o.exp(o.div(o.log(o.neg(o.log(o.sub(o.c(1), p)))), th[0]))),
    loglik: (o, th, D) => { const { S0, SL, k, l, n } = FAMILIES.weibull.sums(o, th, D); return o.sub(o.add(o.sub(o.mul(n, o.log(k)), o.mul(o.mul(n, k), o.log(l))), o.mul(o.sub(k, o.c(1)), o.add(SL, o.mul(n, o.log(l))))), S0); },
  },
  expweibull: {
    names: ['alpha', 'k', 'lambda'],
    init: (D) => { const w = FAMILIES.weibull.init(D); return [1.0, w[0], w[1]]; },
    sums: (o, th, D) => {
      const [a, k, l] = th; const lnl = o.log(l);
      /* z = y^k, g = 1/(e^z − 1); the sums the score and Hessian need */
      let Sz = o.c(0), Szl = o.c(0), Szl2 = o.c(0), SL = o.c(0), Slw = o.c(0);
      let Sgz = o.c(0), Sgzl = o.c(0), Sgzl2a = o.c(0), Sgzb = o.c(0), Sgzc = o.c(0);
      for (let i = 0; i < D.n; i++) {
        const ly = o.sub(D.L[i], lnl);
        const z = o.exp(o.mul(k, ly));
        const ez = o.exp(z);
        const g = o.div(o.c(1), o.sub(ez, o.c(1)));                 /* 1/(e^z − 1) */
        const w = o.sub(o.c(1), o.exp(o.neg(z)));                    /* 1 − e^{−z} */
        const gz = o.mul(g, z), zl = o.mul(z, ly), gzl = o.mul(gz, ly);
        const onePlusGz = o.mul(o.add(o.c(1), g), z);               /* (1+g) z */
        Sz = o.add(Sz, z); Szl = o.add(Szl, zl); Szl2 = o.add(Szl2, o.mul(zl, ly)); SL = o.add(SL, ly); Slw = o.add(Slw, o.log(w));
        Sgz = o.add(Sgz, gz); Sgzl = o.add(Sgzl, gzl);
        Sgzl2a = o.add(Sgzl2a, o.mul(o.mul(gzl, ly), o.sub(o.c(1), onePlusGz)));                 /* g z (ln y)² (1 − (1+g) z) */
        Sgzb = o.add(Sgzb, o.mul(gz, o.sub(o.sub(o.mul(k, o.mul(onePlusGz, ly)), o.mul(k, ly)), o.c(1))));   /* g z [k(1+g) z ln y − k ln y − 1] */
        Sgzc = o.add(Sgzc, o.mul(gz, o.add(o.c(1), o.mul(k, o.sub(o.c(1), onePlusGz)))));        /* g z [1 + k(1 − (1+g) z)] */
      }
      return { Sz, Szl, Szl2, SL, Slw, Sgz, Sgzl, Sgzl2a, Sgzb, Sgzc, a, k, l, n: o.c(D.n), am1: o.sub(a, o.c(1)) };
    },
    score: (o, th, D) => {
      const S = FAMILIES.expweibull.sums(o, th, D);
      const da = o.add(o.div(S.n, S.a), S.Slw);
      const dk = o.add(o.sub(o.add(o.div(S.n, S.k), S.SL), S.Szl), o.mul(S.am1, S.Sgzl));   /* n/k + Σ ln y − Σ z ln y + (α−1) Σ g z ln y */
      const dl = o.mul(o.div(S.k, S.l), o.sub(o.sub(S.Sz, S.n), o.mul(S.am1, S.Sgz)));
      return [da, dk, dl];
    },
    hess: (o, th, D) => {
      const S = FAMILIES.expweibull.sums(o, th, D);
      const aa = o.neg(o.div(S.n, o.mul(S.a, S.a)));
      const ak = S.Sgzl;
      const al = o.neg(o.mul(o.div(S.k, S.l), S.Sgz));
      const kk = o.add(o.sub(o.neg(o.div(S.n, o.mul(S.k, S.k))), S.Szl2), o.mul(S.am1, S.Sgzl2a));
      const kl = o.div(o.add(o.add(o.neg(S.n), o.add(o.mul(S.k, S.Szl), S.Sz)), o.mul(S.am1, S.Sgzb)), S.l);
      const l2 = o.mul(S.l, S.l);
      const ll = o.add(o.sub(o.div(o.mul(S.n, S.k), l2), o.mul(o.div(o.mul(S.k, o.add(o.c(1), S.k)), l2), S.Sz)), o.mul(o.mul(S.am1, o.div(S.k, l2)), S.Sgzc));
      return [[aa, ak, al], [ak, kk, kl], [al, kl, ll]];
    },
    loglik: (o, th, D) => { const S = FAMILIES.expweibull.sums(o, th, D); const lnl = o.log(S.l);
      /* n ln α + n ln k − n k ln λ + (k−1) Σ ln x − Σ z + (α−1) Σ ln w, with Σ ln x = Σ ln y + n ln λ */
      return o.add(o.sub(o.add(o.sub(o.add(o.mul(S.n, o.log(S.a)), o.mul(S.n, o.log(S.k))), o.mul(o.mul(S.n, S.k), lnl)), o.mul(o.sub(S.k, o.c(1)), o.add(S.SL, o.mul(S.n, lnl)))), S.Sz), o.mul(S.am1, S.Slw)); },
    cdf: (o, th, x) => { const z = o.exp(o.mul(th[1], o.sub(o.log(x), o.log(th[2])))); return o.exp(o.mul(th[0], o.log(o.sub(o.c(1), o.exp(o.neg(z)))))); },
    quantile: (o, th, p) => { const w = o.exp(o.div(o.log(p), th[0])); const z = o.neg(o.log(o.sub(o.c(1), w))); return o.mul(th[2], o.exp(o.div(o.log(z), th[1]))); },
  },
};

module.exports = { FAMILIES, makePhi };
