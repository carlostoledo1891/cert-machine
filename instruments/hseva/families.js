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

   The families and their likelihoods [STANDARD] — the six of the Ocean
   Engineering 2026 paper, and two more:
     normal(μ, σ), lognormal(μ, σ on ln x),
     weibull(k, λ): F = 1 − exp(−(x/λ)^k),
     expweibull(α, k, λ): F = (1 − exp(−(x/λ)^k))^α  (Mudholkar & Srivastava 1993),
     gengamma(α, c, λ): F = P(α, (x/λ)^c), the regularized incomplete gamma
       (Stacy 1962; the paper's (a, d, p) are (λ, cα, c); scipy's gengamma(a, c)),
     gumbel(μ, β): F = exp(−exp(−(x − μ)/β));
     exponential(λ) — a known-answer anchor for the battery, not the paper's;
     lognormal3(μ, σ, γ): the lognormal of x − γ, whose likelihood is unbounded
       as γ → min x (Hill 1963) — here to decide a PRINTED local maximum, never
       to rank.
   Every loglik is the full log-likelihood, constants included, so two
   families' values on the same data can be compared. `signed` names the
   parameters that may be negative; `edge` names a boundary the float search
   can run to with the likelihood still rising, where the climb stops. A stop
   there is a refusal that proves nothing about the boundary; only the
   generalized gamma's lognormal limit is decided (fit.js certifyGG). */
'use strict';
const { makeAD } = require('./ad2.js');

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


/* the next double above x (for an outward pad without importing the interval module) */
function IVup(x) {
  if (!Number.isFinite(x)) return x;
  const b = new Float64Array([x]), u = new BigInt64Array(b.buffer);
  if (x === 0) return Number.MIN_VALUE;
  u[0] += x > 0 ? 1n : -1n;
  return b[0];
}

const FAMILIES = {
  normal: {
    names: ['mu', 'sigma'],
    init: (D) => { const m = D.sxf / D.n; return [m, Math.sqrt(D.sxxf / D.n - m * m)]; },
    score: (o, th, D) => {
      const [mu, s] = th; const n = o.c(D.n);
      const a1 = o.acc(), a2 = o.acc();
      for (const x of D.x) { const d = o.sub(x, mu); a1.add(d); a2.add(o.mul(d, d)); }
      const s1 = a1.value(), s2 = a2.value();
      const s2q = o.mul(s, s), s3 = o.mul(s2q, s);
      return [o.div(s1, s2q), o.add(o.neg(o.div(n, s)), o.div(s2, s3))];
    },
    hess: (o, th, D) => {
      const [mu, s] = th; const n = o.c(D.n);
      const a1 = o.acc(), a2 = o.acc();
      for (const x of D.x) { const d = o.sub(x, mu); a1.add(d); a2.add(o.mul(d, d)); }
      const s1 = a1.value(), s2 = a2.value();
      const s2q = o.mul(s, s), s3 = o.mul(s2q, s), s4 = o.mul(s2q, s2q);
      const a = o.neg(o.div(n, s2q)), b = o.neg(o.div(o.mul(o.c(2), s1), s3)), d = o.sub(o.div(n, s2q), o.div(o.mul(o.c(3), s2), s4));
      return [[a, b], [b, d]];
    },
    cdf: (o, th, x) => o.Phi(o.div(o.sub(x, th[0]), th[1])),
    sf: (o, th, x) => o.Phi(o.div(o.sub(th[0], x), th[1])),                   /* 1 − Φ(z) = Φ(−z): the far tail without cancellation */
    quantile: (o, th, p) => o.add(th[0], o.mul(th[1], o.PhiInv(p))),
    loglik: (o, th, D) => { const [mu, s] = th; const aq = o.acc(); for (const x of D.x) { const d = o.sub(x, mu); aq.add(o.mul(d, d)); } const q = aq.value(); return o.sub(o.sub(o.neg(o.mul(o.c(D.n), o.log(s))), o.div(q, o.mul(o.c(2), o.mul(s, s)))), o.mul(o.c(D.n / 2), o.log(o.mul(o.c(2), o.PI)))); },
  },
  lognormal: {
    names: ['mu', 'sigma'],
    init: (D) => { const m = D.sLf / D.n; return [m, Math.sqrt(D.sLLf / D.n - m * m)]; },
    score: (o, th, D) => FAMILIES.normal.score(o, th, { n: D.n, x: D.L }),
    hess: (o, th, D) => FAMILIES.normal.hess(o, th, { n: D.n, x: D.L }),
    cdf: (o, th, x) => o.Phi(o.div(o.sub(o.log(x), th[0]), th[1])),
    sf: (o, th, x) => o.Phi(o.div(o.sub(th[0], o.log(x)), th[1])),
    quantile: (o, th, p) => o.exp(o.add(th[0], o.mul(th[1], o.PhiInv(p)))),
    loglik: (o, th, D) => { const aL = o.acc(); for (const l of D.L) aL.add(l); const sL = aL.value(); return o.sub(FAMILIES.normal.loglik(o, th, { n: D.n, x: D.L }), sL); },
  },
  exponential: {
    names: ['lambda'],
    init: (D) => [D.sxf / D.n],
    score: (o, th, D) => { const [l] = th; const ax = o.acc(); for (const x of D.x) ax.add(x); const sx = ax.value(); return [o.add(o.neg(o.div(o.c(D.n), l)), o.div(sx, o.mul(l, l)))]; },
    hess: (o, th, D) => { const [l] = th; const ax = o.acc(); for (const x of D.x) ax.add(x); const sx = ax.value(); const l2 = o.mul(l, l); return [[o.sub(o.div(o.c(D.n), l2), o.div(o.mul(o.c(2), sx), o.mul(l2, l)))]]; },
    cdf: (o, th, x) => o.sub(o.c(1), o.exp(o.neg(o.div(x, th[0])))),
    quantile: (o, th, p) => o.neg(o.mul(th[0], o.log(o.sub(o.c(1), p)))),
    loglik: (o, th, D) => { const ax = o.acc(); for (const x of D.x) ax.add(x); const sx = ax.value(); return o.sub(o.neg(o.mul(o.c(D.n), o.log(th[0]))), o.div(sx, th[0])); },
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
      const a0 = o.acc(), a1 = o.acc(), a2 = o.acc(), aL = o.acc();      /* Σ y^k, Σ y^k ln y, Σ y^k (ln y)², Σ ln y */
      for (let i = 0; i < D.n; i++) {
        const ly = o.sub(D.L[i], lnl);
        const yk = o.exp(o.mul(k, ly));
        const t1 = o.mul(yk, ly);
        a0.add(yk); a1.add(t1); a2.add(o.mul(t1, ly)); aL.add(ly);
      }
      return { S0: a0.value(), S1: a1.value(), S2: a2.value(), SL: aL.value(), k, l, n: o.c(D.n) };
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
    sf: (o, th, x) => o.exp(o.neg(o.exp(o.mul(th[0], o.sub(o.log(x), o.log(th[1])))))),
    quantile: (o, th, p) => o.mul(th[1], o.exp(o.div(o.log(o.neg(o.log(o.sub(o.c(1), p)))), th[0]))),
    loglik: (o, th, D) => { const { S0, SL, k, l, n } = FAMILIES.weibull.sums(o, th, D); return o.sub(o.add(o.sub(o.mul(n, o.log(k)), o.mul(o.mul(n, k), o.log(l))), o.mul(o.sub(k, o.c(1)), o.add(SL, o.mul(n, o.log(l))))), S0); },
  },
  expweibull: {
    names: ['alpha', 'k', 'lambda'],
    init: (D) => { const w = FAMILIES.weibull.init(D); return [1.0, w[0], w[1]]; },
    edge: (th) => (th[0] > 1e4 ? 'the climb passed α = 10⁴ with λ → 0, the likelihood still rising toward a boundary of the family' : null),
    sums: (o, th, D) => {
      const [a, k, l] = th; const lnl = o.log(l);
      /* z = y^k, g = 1/(e^z − 1); the sums the score and Hessian need */
      const A = Array.from({ length: 10 }, () => o.acc());
      for (let i = 0; i < D.n; i++) {
        const ly = o.sub(D.L[i], lnl);
        const z = o.exp(o.mul(k, ly));
        const ez = o.exp(z);
        const g = o.div(o.c(1), o.sub(ez, o.c(1)));                 /* 1/(e^z − 1) */
        const w = o.sub(o.c(1), o.exp(o.neg(z)));                    /* 1 − e^{−z} */
        const gz = o.mul(g, z), zl = o.mul(z, ly), gzl = o.mul(gz, ly);
        const onePlusGz = o.mul(o.add(o.c(1), g), z);               /* (1+g) z */
        A[0].add(z); A[1].add(zl); A[2].add(o.mul(zl, ly)); A[3].add(ly); A[4].add(o.log(w));
        A[5].add(gz); A[6].add(gzl);
        A[7].add(o.mul(o.mul(gzl, ly), o.sub(o.c(1), onePlusGz)));                 /* g z (ln y)² (1 − (1+g) z) */
        A[8].add(o.mul(gz, o.sub(o.sub(o.mul(k, o.mul(onePlusGz, ly)), o.mul(k, ly)), o.c(1))));   /* g z [k(1+g) z ln y − k ln y − 1] */
        A[9].add(o.mul(gz, o.add(o.c(1), o.mul(k, o.sub(o.c(1), onePlusGz)))));        /* g z [1 + k(1 − (1+g) z)] */
      }
      const [Sz, Szl, Szl2, SL, Slw, Sgz, Sgzl, Sgzl2a, Sgzb, Sgzc] = A.map((q) => q.value());
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
    /* 1 − (1 − w)^α with w = e^{−z}: for small αw/(1 − w), u = −α ln(1 − w) lies in [αw, αw/(1 − w)] and 1 − e^{−u} in [u − u²/2, u] */
    sf: (o, th, x) => {
      const z = o.exp(o.mul(th[1], o.sub(o.log(x), o.log(th[2])))), w = o.exp(o.neg(z));
      const u = o.mul(th[0], w), uu = o.div(u, o.sub(o.c(1), w));
      if (o.hi(uu) < 1e-3) return o.hull(o.sub(u, o.mul(o.c(0.5), o.mul(uu, uu))), uu);
      return o.sub(o.c(1), o.exp(o.mul(th[0], o.log(o.sub(o.c(1), w)))));
    },
    quantile: (o, th, p) => { const w = o.exp(o.div(o.log(p), th[0])); const z = o.neg(o.log(o.sub(o.c(1), w))); return o.mul(th[2], o.exp(o.div(o.log(z), th[1]))); },
  },
  /* The same exponentiated Weibull in its Gumbel coordinates: k, θ = λ^k, β = θ ln α.
     Where the (α, k, λ) climb runs to α in the millions or trillions, the family is in a
     regime its first coordinates cannot hold: with u = x^k, w = (u − β)/θ, t = e^{−u/θ},
       ln f = ln k − ln θ + (k − 1) ln x − w − e^{−w} Λ(t) + t Λ(t),   Λ(t) = −ln(1 − t)/t,
       F    = exp(−e^{−w} Λ(t)),
     and as t → 0 over the data that is a Gumbel law of H^k with location β and scale θ.
     In these coordinates nothing is of order α: the same distribution, its maximum an
     ordinary point. Used where t ≤ 0.5 at every datum (α ≥ 1 and the data above the
     family's lower reach); the score and Hessian by second-order forward differentiation
     (ad2.js) of the per-datum log-density, Λ and its derivatives by their series in t
     with a proved tail. */
  expweibullG: {
    names: ['k', 'theta', 'beta'], signed: ['beta'],
    edge: (th) => (th[0] < 1e-3 ? 'the climb passed k = 0.001' : null),
    lam: (o, t) => {                                                /* Λ, Λ′, Λ″ at t (enclosures over an interval t) */
      const tl = o.lo(t), th = o.hi(t);
      if (!(tl >= 0 && th <= 0.5)) throw new Error('expweibullG: e^(-x^k/θ) = ' + th + ' at a datum, outside the Gumbel regime (≤ 0.5)');
      let J = 3; while (J < 160 && Math.pow(th, J - 2) * (J + 1) / ((1 - th) * (1 - th)) > 1e-22) J++;
      const at = (x) => {                                           /* partial sums at a thin point */
        const X = o.c(x); let p = o.c(1), s0 = o.c(0), s1 = o.c(0), s2 = o.c(0), pm1 = o.c(0), pm2 = o.c(0);
        for (let j = 0; j < J; j++) {
          s0 = o.add(s0, o.div(p, o.c(j + 1)));
          if (j >= 1) s1 = o.add(s1, o.div(o.mul(o.c(j), pm1), o.c(j + 1)));
          if (j >= 2) s2 = o.add(s2, o.div(o.mul(o.c(j * (j - 1)), pm2), o.c(j + 1)));
          pm2 = pm1; pm1 = p; p = o.mul(p, X);
        }
        return [s0, s1, s2];
      };
      const lo = at(tl), hi = tl === th ? lo : at(th);
      const pad = [Math.pow(th, J) / ((J + 1) * (1 - th)), Math.pow(th, J - 1) / (1 - th), Math.pow(th, J - 2) * (J + 1) / ((1 - th) * (1 - th))];
      if (!o.isInterval) return lo;
      return lo.map((L, i) => [L[0], IVup(hi[i][1] + pad[i] * 1.0001)]);   /* each of Λ, Λ′, Λ″ increases in t */
    },
    perDatum: (o, A, P, L) => {                                    /* the log-density at one datum, as an AD number */
      const [k, th, be] = P;
      const u = A.exp(A.mul(k, A.K(L)));
      const w = A.div(A.sub(u, be), th);
      const E = A.exp(A.neg(w));
      const t = A.exp(A.neg(A.div(u, th)));
      const [l0, l1, l2] = FAMILIES.expweibullG.lam(o, t.v);
      const Lam = A.unary(t, l0, l1, l2);
      return { u, w, E, t, Lam, ll: A.sub(A.sub(A.neg(w), A.mul(E, Lam)), A.neg(A.mul(t, Lam))) };
    },
    ad: (o, th, D) => {
      const A = makeAD(o, 3), P = [A.V(th[0], 0), A.V(th[1], 1), A.V(th[2], 2)];
      const acc = Array.from({ length: 13 }, () => o.acc());
      let SL = o.acc();
      for (let i = 0; i < D.n; i++) {
        const r = FAMILIES.expweibullG.perDatum(o, A, P, D.L[i]).ll;
        acc[0].add(r.v); for (let a = 0; a < 3; a++) acc[1 + a].add(r.g[a]); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) acc[4 + 3 * a + b].add(r.H[a][b]);
        SL.add(D.L[i]);
      }
      const n = o.c(D.n), v = acc.map((x) => x.value()), sL = SL.value();
      const [k, T] = th;
      /* + n ln k − n ln θ + (k − 1) Σ ln x, and its derivatives */
      const ll = o.add(o.add(v[0], o.sub(o.mul(n, o.log(k)), o.mul(n, o.log(T)))), o.mul(o.sub(k, o.c(1)), sL));
      const g = [o.add(v[1], o.add(o.div(n, k), sL)), o.sub(v[2], o.div(n, T)), v[3]];
      const H = [[o.sub(v[4], o.div(n, o.mul(k, k))), v[5], v[6]], [v[7], o.add(v[8], o.div(n, o.mul(T, T))), v[9]], [v[10], v[11], v[12]]];
      return { ll, g, H };
    },
    score: (o, th, D) => FAMILIES.expweibullG.ad(o, th, D).g,
    hess: (o, th, D) => FAMILIES.expweibullG.ad(o, th, D).H,
    loglik: (o, th, D) => FAMILIES.expweibullG.ad(o, th, D).ll,
    /* F = exp(−e^{−w} Λ(t)) */
    cdf: (o, th, x) => {
      const [k, T, be] = th, u = o.exp(o.mul(k, o.log(x))), w = o.div(o.sub(u, be), T), t = o.exp(o.neg(o.div(u, T)));
      return o.exp(o.neg(o.mul(o.exp(o.neg(w)), FAMILIES.expweibullG.lam(o, t)[0])));
    },
    /* 1 − F with s = e^{−w} Λ(t): in [s − s²/2, s] once s is small */
    sf: (o, th, x) => {
      const [k, T, be] = th, u = o.exp(o.mul(k, o.log(x))), w = o.div(o.sub(u, be), T), t = o.exp(o.neg(o.div(u, T)));
      const s = o.mul(o.exp(o.neg(w)), FAMILIES.expweibullG.lam(o, t)[0]);
      if (o.hi(s) < 1e-3) return o.hull(o.sub(s, o.mul(o.c(0.5), o.mul(s, s))), s);
      return o.sub(o.c(1), o.exp(o.neg(s)));
    },
    /* F⁻¹(p): (1 − t)^α = p with α = e^{β/θ}, so t = −expm1(a), a = ln p · e^{−β/θ}, and u = −θ ln t.
       Where a is small, t = −a·s with s = (e^a − 1)/a = 1 + a/2 + a²/6 + …, and u = β − θ (ln(−ln p) + ln s):
       e^{−β/θ} is never formed, so a β/θ past the doubles (α beyond 10³⁰⁸) still has its quantile. */
    quantile: (o, th, p) => {
      const [k, T, be] = th, bT = o.div(be, T), lp = o.log(p);                 /* ln p < 0 */
      const lnA = Math.log(o.hi(o.abs(lp))) - o.lo(bT);                        /* ln of a bound on |a|, in floats: only chooses the branch */
      let u;
      if (lnA < -600) {
        /* |a| < e^(−600)·(1 + 1e-12): s ∈ [1 + a/2, 1] (e^a between 1 + a and 1 + a + a²/2 for a < 0), so ln s ∈ [−1e-260, 0] */
        u = o.sub(be, o.mul(T, o.add(o.log(o.neg(lp)), o.hull(o.c(-1e-260), o.c(0)))));
      } else {
        const a = o.mul(lp, o.exp(o.neg(bT)));                                /* ln p / α, negative */
        if (o.hi(o.abs(a)) < 0.1) {                                            /* s by its series, tail by the next term's geometric bound */
          let s = o.c(1), term = o.c(1);
          for (let j = 2; j <= 24; j++) { term = o.div(o.mul(term, a), o.c(j)); s = o.add(s, term); }
          const pad = Math.pow(o.hi(o.abs(a)), 24) / 6.2e23 * 2;
          u = o.sub(be, o.mul(T, o.add(o.log(o.neg(lp)), o.log(o.widen(s, o.c(pad))))));
        } else u = o.neg(o.mul(T, o.log(o.sub(o.c(1), o.exp(a)))));
      }
      return o.exp(o.div(o.log(u), k));
    },
    toEW: (th) => { const [k, T, be] = th; return [Math.exp(be / T), k, Math.pow(T, 1 / k)]; },
    fromEW: (th) => { const [a, k, l] = th, T = Math.pow(l, k); return [k, T, T * Math.log(a)]; },
  },
  gengamma: {
    names: ['alpha', 'c', 'lambda'], limit: 'lognormal', fallback: 'gengammaP',
    /* at α = 1 it is the Weibull: start there */
    init: (D) => { const w = FAMILIES.weibull.init(D); return [1.0, w[0], w[1]]; },
    edge: (th) => (th[0] > 500 ? 'the climb passed α = 500, the likelihood still rising toward the family\'s lognormal limit (α → ∞, c → 0)' : null),
    sums: (o, th, D) => {
      const [a, cc, l] = th; const lnl = o.log(l);
      /* y = x/λ, z = y^c: Σ ln y, Σ z, Σ z ln y, Σ z (ln y)² */
      const aL = o.acc(), az = o.acc(), azL = o.acc(), azL2 = o.acc();
      for (let i = 0; i < D.n; i++) {
        const ly = o.sub(D.L[i], lnl);
        const z = o.exp(o.mul(cc, ly));
        const zl = o.mul(z, ly);
        aL.add(ly); az.add(z); azL.add(zl); azL2.add(o.mul(zl, ly));
      }
      return { SL: aL.value(), Sz: az.value(), SzL: azL.value(), SzL2: azL2.value(), a, cc, l, n: o.c(D.n) };
    },
    score: (o, th, D) => {
      const S = FAMILIES.gengamma.sums(o, th, D);
      return [o.add(o.neg(o.mul(S.n, o.digamma(S.a))), o.mul(S.cc, S.SL)),         /* −n ψ(α) + c Σ ln y */
        o.sub(o.add(o.div(S.n, S.cc), o.mul(S.a, S.SL)), S.SzL),                       /* n/c + α Σ ln y − Σ z ln y */
        o.mul(o.div(S.cc, S.l), o.sub(S.Sz, o.mul(S.n, S.a)))];                        /* (c/λ)(Σ z − nα) */
    },
    hess: (o, th, D) => {
      const S = FAMILIES.gengamma.sums(o, th, D);
      const aa = o.neg(o.mul(S.n, o.trigamma(S.a)));
      const ac = S.SL;
      const al = o.neg(o.div(o.mul(S.n, S.cc), S.l));
      const c2 = o.sub(o.neg(o.div(S.n, o.mul(S.cc, S.cc))), S.SzL2);
      const cl = o.div(o.sub(o.add(S.Sz, o.mul(S.cc, S.SzL)), o.mul(S.n, S.a)), S.l);
      const l2 = o.mul(o.div(S.cc, o.mul(S.l, S.l)), o.sub(o.mul(S.n, S.a), o.mul(o.add(o.c(1), S.cc), S.Sz)));
      return [[aa, ac, al], [ac, c2, cl], [al, cl, l2]];
    },
    /* n ln c − n ln λ − n lnΓ(α) + (cα − 1) Σ ln y − Σ z */
    loglik: (o, th, D) => {
      const S = FAMILIES.gengamma.sums(o, th, D);
      return o.sub(o.add(o.sub(o.sub(o.mul(S.n, o.log(S.cc)), o.mul(S.n, o.log(S.l))), o.mul(S.n, o.lgamma(S.a))), o.mul(o.sub(o.mul(S.cc, S.a), o.c(1)), S.SL)), S.Sz);
    },
    cdf: (o, th, x) => o.gammaP(th[0], o.exp(o.mul(th[1], o.sub(o.log(x), o.log(th[2]))))),
    quantile: (o, th, p) => o.mul(th[2], o.exp(o.div(o.log(o.gammaPinv(th[0], p)), th[1]))),
  },
  /* The same generalized gamma in Prentice's coordinates (Prentice 1974; Lawless 1980):
     Q = 1/√α, σ = 1/(c√α), μ = ln λ + ln(α)/c, so w = (ln x − μ)/σ and the Stacy
     variable is z = α e^{Qw}. Along the ridge where the likelihood of the (α, c, λ) form is
     nearly flat and its three parameters move together exponentially, these three barely
     move but Q, and the Krawczyk box can be narrow where the other form cannot. Q > 0 is
     the paper's family; the lognormal is its Q → 0 limit, and in the series form below an
     ordinary point, which is how certifyGG (fit.js) searches next to the limit and decides
     the limit itself. A fit certified here is the same distribution as in (α, c, λ).
       ℓ = n ln Q + n a ln a − n lnΓ(a) − n ln σ − Σ ln x + Σw/Q − Σe^{Qw}/Q²,  a = Q⁻². */
  gengammaP: {
    names: ['mu', 'sigma', 'q'],
    edge: (th) => (th[2] < 0.002 ? 'the climb passed Q = 0.002, running to Q → 0, the family\'s lognormal limit' : null),
    /* near the limit (|Q| ≤ 0.2, every |Qw| ≤ 2) the series form below; the direct form above it */
    nearLimit: (o, th, D) => {
      if (o.hi(o.abs(th[2])) > 0.2) return false;
      if (D.Lmin === undefined) { let a = Infinity, b = -Infinity; for (let i = 0; i < D.n; i++) { a = Math.min(a, o.lo(D.L[i])); b = Math.max(b, o.hi(D.L[i])); } D.Lmin = o.isInterval ? [a, a] : a; D.Lmax = o.isInterval ? [b, b] : b; }
      const W = Math.max(Math.abs(o.hi(o.sub(D.Lmax, th[0]))), Math.abs(o.lo(o.sub(D.Lmin, th[0])))) / o.lo(th[1]);
      return o.hi(o.abs(th[2])) * W <= 2;
    },
    sums: (o, th, D) => {
      if (FAMILIES.gengammaP.nearLimit(o, th, D)) return FAMILIES.gengammaP.seriesSums(o, th, D);
      const [mu, s, q] = th;
      const aw = o.acc(), aE = o.acc(), awE = o.acc(), aw2E = o.acc(), ay = o.acc();
      for (let i = 0; i < D.n; i++) {
        const w = o.div(o.sub(D.L[i], mu), s);
        const E = o.exp(o.mul(q, w));
        const wE = o.mul(w, E);
        aw.add(w); aE.add(E); awE.add(wE); aw2E.add(o.mul(wE, w)); ay.add(D.L[i]);
      }
      return { Sw: aw.value(), SE: aE.value(), SwE: awE.value(), Sw2E: aw2E.value(), Sy: ay.value(), s, q, n: o.c(D.n), a: o.div(o.c(1), o.mul(q, q)) };
    },
    /* THE SERIES FORM. ℓ's pieces carry Q⁻², Q⁻³, Q⁻⁴ that cancel; evaluated as written, an
       interval over a box of Q loses everything to that cancellation. Rewritten with
       u = Qw, E1(u) = (eᵘ − 1)/u and E2(u) = (eᵘ − 1 − u)/u² as power series with a proved
       tail, and the gamma-function part as special.js's C, C′, C″, nothing is divided by Q
       and the lognormal (Q = 0) is an ordinary point:
         ℓ   = n C(Q) − n ln σ − Σ y − Σ w² E2(u)
         ∂μ  = Σ w E1 / σ,   ∂σ = (Σ w² E1 − n) / σ,   ∂Q = n C′(Q) − Σ w³ E2′
         ∂μμ = −Σ eᵘ / σ²,   ∂μσ = −Σ w (E1 + eᵘ) / σ²,   ∂σσ = (n − Σ w² (2E1 + eᵘ)) / σ²
         ∂μQ = Σ w² E1′ / σ,  ∂σQ = Σ w³ E1′ / σ,  ∂QQ = n C″(Q) − Σ w⁴ E2″.
       Each series Σ_j c_j uʲ has c_j ≤ 1/(j+s)! (s = 1 for E1, E1′; 2 for E2, E2′, E2″), so
       the terms from j = J on sum to at most |u|^J e^{|u|} / (J+1)!; J is taken where that is
       below 10⁻²⁵ and the bound is added as a pad. The coefficients 1/k! are built by
       exact division, so in intervals they are enclosures too. */
    seriesSums: (o, th, D) => {
      const [mu, s, q] = th;
      if (!o.__prentice) {                                   /* the coefficients, once per arithmetic */
        const F = [o.c(1)]; for (let k = 1; k <= 48; k++) F.push(o.div(F[k - 1], o.c(k)));
        const C = { E1: [], E1p: [], E2: [], E2p: [], E2pp: [] };
        for (let j = 0; j < 44; j++) {
          C.E1.push(F[j + 1]); C.E1p.push(o.mul(o.c(j + 1), F[j + 2])); C.E2.push(F[j + 2]);
          C.E2p.push(o.mul(o.c(j + 1), F[j + 3])); C.E2pp.push(o.mul(o.c((j + 1) * (j + 2)), F[j + 4]));
        }
        o.__prentice = C;
      }
      const C = o.__prentice;
      const horner = (u, J, cf) => { let v = cf[J - 1]; for (let j = J - 2; j >= 0; j--) v = o.add(cf[j], o.mul(u, v)); return v; };
      const acc = Array.from({ length: 11 }, () => o.acc());
      for (let i = 0; i < D.n; i++) {
        const w = o.div(o.sub(D.L[i], mu), s), u = o.mul(q, w);
        const U = Math.max(Math.abs(o.lo(u)), Math.abs(o.hi(u)));
        let J = 4, tail = Math.pow(U, J) * Math.exp(U) / 120;
        while (tail > 1e-25 && J < 44) { J++; tail = tail * U / (J + 1); }
        const pad = o.c(tail * 1.001 + 1e-300);
        const E1 = o.widen(horner(u, J, C.E1), pad), E1p = o.widen(horner(u, J, C.E1p), pad);
        const E2 = o.widen(horner(u, J, C.E2), pad), E2p = o.widen(horner(u, J, C.E2p), pad), E2pp = o.widen(horner(u, J, C.E2pp), pad);
        const E = o.exp(u), w2 = o.mul(w, w), w3 = o.mul(w2, w), w4 = o.mul(w2, w2);
        acc[0].add(o.mul(w, E1)); acc[1].add(o.mul(w2, E1)); acc[2].add(o.mul(w3, E2p)); acc[3].add(o.mul(w2, E2));
        acc[4].add(E); acc[5].add(o.mul(w, E)); acc[6].add(o.mul(w2, E));
        acc[7].add(o.mul(w2, E1p)); acc[8].add(o.mul(w3, E1p)); acc[9].add(o.mul(w4, E2pp)); acc[10].add(D.L[i]);
      }
      const v = acc.map((x) => x.value());
      return { series: true, S1: v[0], S2: v[1], S3: v[2], SL: v[3], SE: v[4], SwE: v[5], Sw2E: v[6], T2: v[7], T3: v[8], T4: v[9], Sy: v[10], s, q, n: o.c(D.n) };
    },
    score: (o, th, D) => {
      const S = FAMILIES.gengammaP.sums(o, th, D);
      if (S.series) return [o.div(S.S1, S.s), o.div(o.sub(S.S2, S.n), S.s), o.sub(o.mul(S.n, o.prenticeC1(S.q)), S.S3)];
      const qs = o.mul(S.q, S.s), q2 = o.mul(S.q, S.q), q3 = o.mul(q2, S.q);
      const G = o.gap1(S.q);                                                           /* ln a + 1 − ψ(a), as a series in Q */
      const dm = o.div(o.sub(S.SE, S.n), qs);
      const ds = o.div(o.sub(o.div(o.sub(S.SwE, S.Sw), S.q), S.n), S.s);
      const dq = o.add(o.sub(o.sub(o.sub(o.div(S.n, S.q), o.div(o.mul(o.mul(o.c(2), S.n), G), q3)), o.div(S.Sw, q2)), o.div(S.SwE, q2)), o.div(o.mul(o.c(2), S.SE), q3));
      return [dm, ds, dq];
    },
    hess: (o, th, D) => {
      const S = FAMILIES.gengammaP.sums(o, th, D);
      if (S.series) {
        const s2 = o.mul(S.s, S.s);
        const mm = o.neg(o.div(S.SE, s2));
        const ms = o.neg(o.div(o.add(S.S1, S.SwE), s2));
        const ss = o.div(o.sub(S.n, o.add(o.mul(o.c(2), S.S2), S.Sw2E)), s2);
        const mq = o.div(S.T2, S.s), sq = o.div(S.T3, S.s);
        const qq = o.sub(o.mul(S.n, o.prenticeC2(S.q)), S.T4);
        return [[mm, ms, mq], [ms, ss, sq], [mq, sq, qq]];
      }
      const s2 = o.mul(S.s, S.s), q2 = o.mul(S.q, S.q), q3 = o.mul(q2, S.q), q4 = o.mul(q2, q2), q6 = o.mul(q4, q2);
      const G = o.gap1(S.q);
      const mm = o.neg(o.div(S.SE, s2));
      const ms = o.sub(o.neg(o.div(S.SwE, s2)), o.div(o.sub(S.SE, S.n), o.mul(S.q, s2)));
      const mq = o.sub(o.div(S.SwE, o.mul(S.q, S.s)), o.div(o.sub(S.SE, S.n), o.mul(q2, S.s)));
      const ss = o.div(o.sub(o.sub(S.n, o.div(o.mul(o.c(2), o.sub(S.SwE, S.Sw)), S.q)), S.Sw2E), s2);
      const sq = o.div(o.sub(o.div(S.Sw2E, S.q), o.div(o.sub(S.SwE, S.Sw), q2)), S.s);
      /* −n/Q² + 6nG/Q⁴ + 4n(Q² − ψ′(a))/Q⁶ + 2Σw/Q³ − Σw²E/Q² + 4ΣwE/Q³ − 6ΣE/Q⁴ */
      const qq = o.sub(o.add(o.add(o.sub(o.add(o.add(o.neg(o.div(S.n, q2)), o.div(o.mul(o.mul(o.c(6), S.n), G), q4)),
        o.div(o.mul(o.mul(o.c(4), S.n), o.gap2(S.q)), q6)), o.neg(o.div(o.mul(o.c(2), S.Sw), q3))), o.neg(o.div(S.Sw2E, q2))), o.div(o.mul(o.c(4), S.SwE), q3)), o.div(o.mul(o.c(6), S.SE), q4));
      return [[mm, ms, mq], [ms, ss, sq], [mq, sq, qq]];
    },
    loglik: (o, th, D) => {
      const S = FAMILIES.gengammaP.sums(o, th, D);
      if (S.series) return o.sub(o.sub(o.sub(o.mul(S.n, o.prenticeC(S.q)), o.mul(S.n, o.log(S.s))), S.Sy), S.SL);
      const q2 = o.mul(S.q, S.q);
      return o.sub(o.add(o.sub(o.sub(o.sub(o.add(o.mul(S.n, o.log(S.q)), o.mul(o.mul(S.n, S.a), o.log(S.a))), o.mul(S.n, o.lgamma(S.a))), o.mul(S.n, o.log(S.s))), S.Sy), o.div(S.Sw, S.q)), o.div(S.SE, q2));
    },
    cdf: (o, th, x) => { const a = o.div(o.c(1), o.mul(th[2], th[2])); const w = o.div(o.sub(o.log(x), th[0]), th[1]); return o.gammaP(a, o.mul(a, o.exp(o.mul(th[2], w)))); },
    quantile: (o, th, p) => { const a = o.div(o.c(1), o.mul(th[2], th[2])); const z = o.gammaPinv(a, p); return o.exp(o.add(th[0], o.mul(th[1], o.div(o.log(o.div(z, a)), th[2])))); },
    /* the (α, c, λ) point of a (μ, σ, Q) point, and back */
    toStacy: (th) => { const [m, s, q] = th, a = 1 / (q * q), c = q / s; return [a, c, Math.exp(m - Math.log(a) / c)]; },
    fromStacy: (th) => { const [a, c, l] = th, q = 1 / Math.sqrt(a); return [Math.log(l) + Math.log(a) / c, q / c, q]; },
  },
  gumbel: {
    names: ['mu', 'beta'],
    /* the moment start: β = s√6/π, μ = x̄ − γ_E β */
    init: (D) => { const m = D.sxf / D.n, sd = Math.sqrt(D.sxxf / D.n - m * m), b = sd * Math.sqrt(6) / Math.PI; return [m - 0.5772156649015329 * b, b]; },
    sums: (o, th, D) => {
      const [mu, b] = th;
      /* z = (x − μ)/β: Σ z, Σ e^{−z}, Σ z e^{−z}, Σ z² e^{−z} */
      const az = o.acc(), ae = o.acc(), aze = o.acc(), az2e = o.acc();
      for (const x of D.x) {
        const z = o.div(o.sub(x, mu), b);
        const e = o.exp(o.neg(z));
        const ze = o.mul(z, e);
        az.add(z); ae.add(e); aze.add(ze); az2e.add(o.mul(ze, z));
      }
      return { Sz: az.value(), Se: ae.value(), Sze: aze.value(), Sz2e: az2e.value(), b, n: o.c(D.n) };
    },
    score: (o, th, D) => { const S = FAMILIES.gumbel.sums(o, th, D); return [o.div(o.sub(S.n, S.Se), S.b), o.div(o.sub(o.sub(S.Sz, S.Sze), S.n), S.b)]; },
    hess: (o, th, D) => {
      const S = FAMILIES.gumbel.sums(o, th, D); const b2 = o.mul(S.b, S.b);
      const mm = o.neg(o.div(S.Se, b2));
      const mb = o.div(o.sub(o.sub(S.Se, S.Sze), S.n), b2);
      const bb = o.div(o.sub(o.add(o.sub(S.n, o.mul(o.c(2), S.Sz)), o.mul(o.c(2), S.Sze)), S.Sz2e), b2);
      return [[mm, mb], [mb, bb]];
    },
    loglik: (o, th, D) => { const S = FAMILIES.gumbel.sums(o, th, D); return o.sub(o.sub(o.neg(o.mul(S.n, o.log(S.b))), S.Sz), S.Se); },
    cdf: (o, th, x) => o.exp(o.neg(o.exp(o.neg(o.div(o.sub(x, th[0]), th[1]))))),
    /* 1 − e^{−t} with t = e^{−z}: in [t − t²/2, t] when t is small */
    sf: (o, th, x) => { const t = o.exp(o.neg(o.div(o.sub(x, th[0]), th[1]))); return o.hi(t) < 1e-3 ? o.hull(o.sub(t, o.mul(o.c(0.5), o.mul(t, t))), t) : o.sub(o.c(1), o.exp(o.neg(t))); },
    quantile: (o, th, p) => o.sub(th[0], o.mul(th[1], o.log(o.neg(o.log(p))))),
  },
  lognormal3: {
    names: ['mu', 'sigma', 'gamma'], signed: ['mu', 'gamma'],
    init: (D) => { const m = D.sLf / D.n; return [m, Math.sqrt(D.sLLf / D.n - m * m), 0]; },
    sums: (o, th, D) => {
      const [mu, s, g] = th;
      /* w = x − γ, y = ln w, d = y − μ, r = 1/w */
      const A = Array.from({ length: 7 }, () => o.acc());
      for (const x of D.x) {
        const w = o.sub(x, g);
        const y = o.log(w), d = o.sub(y, mu), r = o.div(o.c(1), w), r2 = o.mul(r, r);
        A[0].add(y); A[1].add(d); A[2].add(o.mul(d, d)); A[3].add(r); A[4].add(o.mul(d, r)); A[5].add(r2); A[6].add(o.mul(d, r2));
      }
      const [Sy, Sd, Sd2, Sr, Sdr, Sr2, Sdr2] = A.map((q) => q.value());
      return { Sy, Sd, Sd2, Sr, Sdr, Sr2, Sdr2, s, n: o.c(D.n) };
    },
    score: (o, th, D) => {
      const S = FAMILIES.lognormal3.sums(o, th, D); const s2 = o.mul(S.s, S.s);
      return [o.div(S.Sd, s2), o.add(o.neg(o.div(S.n, S.s)), o.div(S.Sd2, o.mul(s2, S.s))), o.add(S.Sr, o.div(S.Sdr, s2))];
    },
    hess: (o, th, D) => {
      const S = FAMILIES.lognormal3.sums(o, th, D); const s2 = o.mul(S.s, S.s), s3 = o.mul(s2, S.s), s4 = o.mul(s2, s2);
      const mm = o.neg(o.div(S.n, s2)), ms = o.neg(o.div(o.mul(o.c(2), S.Sd), s3)), mg = o.neg(o.div(S.Sr, s2));
      const ss = o.sub(o.div(S.n, s2), o.div(o.mul(o.c(3), S.Sd2), s4)), sg = o.neg(o.div(o.mul(o.c(2), S.Sdr), s3));
      const gg = o.add(S.Sr2, o.div(o.sub(S.Sdr2, S.Sr2), s2));
      return [[mm, ms, mg], [ms, ss, sg], [mg, sg, gg]];
    },
    loglik: (o, th, D) => {
      const S = FAMILIES.lognormal3.sums(o, th, D); const s2 = o.mul(S.s, S.s);
      return o.sub(o.sub(o.sub(o.neg(S.Sy), o.mul(S.n, o.log(S.s))), o.div(S.Sd2, o.mul(o.c(2), s2))), o.mul(o.c(D.n / 2), o.log(o.mul(o.c(2), o.PI))));
    },
    cdf: (o, th, x) => o.Phi(o.div(o.sub(o.log(o.sub(x, th[2])), th[0]), th[1])),
    sf: (o, th, x) => o.Phi(o.div(o.sub(th[0], o.log(o.sub(x, th[2]))), th[1])),
    quantile: (o, th, p) => o.add(th[2], o.exp(o.add(th[0], o.mul(th[1], o.PhiInv(p))))),
  },
};

/* The paper's six, in the order its §2.1 introduces them. */
const PAPER_SIX = ['normal', 'lognormal', 'weibull', 'expweibull', 'gengamma', 'gumbel'];

module.exports = { FAMILIES, PAPER_SIX, makePhi };
