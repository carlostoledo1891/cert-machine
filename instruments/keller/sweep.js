/* sweep.js — GENERATE Jacobian-conjecture counterexamples, then certify them.

   The audit (keller.js) decides published claims. This file makes new ones:
   Speyer's tangent-sweep mechanism, reduced to an exact-rational recipe that
   emits, for each degree d >= 2, an explicit polynomial map C^3 -> C^3 with

       det J == -2  (a polynomial identity over Q), and
       two DISTINCT RATIONAL points with the same image,

   i.e. a certified counterexample of geometric degree d+1. At d = 2 the
   recipe reproduces Alpöge's map EXACTLY (curve, twist and all) — that is
   the generator's calibration case, checked in the battery.

   THE RECIPE (Gao, arXiv:2608.00222, made computational).
   A curve K(w) = (p(w), q(w)) with the normalization q'(w) = (w/2) p'(w) has
   tangent sweep S(gamma, w) = (p(w) + 2 gamma, q(w) + gamma w) with
   det J(S) = 2 gamma. The monomial twist
       gamma = g0 + a·xy + b·x^2 z,   u = 1 + xy,   w = gamma·u
   lifts S to F = (B/x^2, A/x, gamma·x) where
       A = sum_k c_k gamma^{k-1} u^k + 2,
       B = sum_k (k c_k)/(2(k+1)) gamma^{k-1} u^{k+1} + u,
   and the divisions are EXACT precisely when
       p(g0) = -2 g0          (kills A's x^0 term),
       q(g0) = -g0^2          (kills B's x^0 term),
       a = -(g0^2 + g0 q'(g0)) / (q'(g0) + 2 g0)   (kills B's x^1 term).
   The first two are linear in c_1, c_2 with system determinant g0^4/12 != 0,
   so any free choice of c_3..c_d completes to a curve. NOTHING here is
   trusted: the divisions are verified monomial by monomial, the determinant
   is expanded symbolically over Q and required constant and nonzero, and the
   collision points go through the same exact audit as a published claim. A
   derivation error cannot ship — it fails one of those checks loudly.

   COLLISIONS, rational by construction. Preimages of (X, Y) under S
   correspond to roots of the tangency polynomial, i.e. to intersections of
   the fixed curve  phi(w) = q(w) - (w/2) p(w)  with the line Y - (X/2) w. A
   line through two chosen rational points (w1, phi(w1)), (w2, phi(w2)) gives
   a rational target hit twice; each root lifts to a rational (x, y, z) via
       gamma_i = (X - p(w_i))/2,  u_i = w_i/gamma_i,  x_i = t/gamma_i,
       y_i = (u_i - 1)/x_i,       z_i = (gamma_i - g0 - a x_i y_i)/(b x_i^2),
   the shared t forcing the third image coordinate gamma·x = t to agree.

   MIT licensed. Part of cert-machine. */
'use strict';

const K = require('#instruments/keller/keller.js');
const Q = require('#instruments/interval/rational.js');

const qpow = (base, e) => { let r = Q.R(1n); for (let i = 0; i < e; i++) r = Q.mul(r, base); return r; };

/* the curve completed from the free coefficients: c_1, c_2 solved exactly */
function curve(d, free, g0) {
  const c = new Array(d + 1).fill(Q.ZERO);
  for (let k = 3; k <= d; k++) c[k] = free[k] || Q.ZERO;
  let r1 = Q.mul(Q.R(-2n), g0), r2 = Q.neg(qpow(g0, 2));
  for (let k = 3; k <= d; k++) {
    r1 = Q.sub(r1, Q.mul(c[k], qpow(g0, k)));
    r2 = Q.sub(r2, Q.mul(Q.mul(c[k], Q.R(BigInt(k), BigInt(2 * (k + 1)))), qpow(g0, k + 1)));
  }
  const A11 = g0, A12 = qpow(g0, 2), A21 = Q.mul(Q.R(1n, 4n), qpow(g0, 2)), A22 = Q.mul(Q.R(1n, 3n), qpow(g0, 3));
  const det = Q.sub(Q.mul(A11, A22), Q.mul(A12, A21));       /* = g0^4/12, nonzero for g0 != 0 */
  c[1] = Q.div(Q.sub(Q.mul(r1, A22), Q.mul(A12, r2)), det);
  c[2] = Q.div(Q.sub(Q.mul(A11, r2), Q.mul(r1, A21)), det);
  return c;
}
const evalP = (c, d, w) => { let s = Q.ZERO, wp = Q.R(1n);
  for (let k = 1; k <= d; k++) { wp = Q.mul(wp, w); s = Q.add(s, Q.mul(c[k], wp)); } return s; };
const evalQ = (c, d, w) => { let s = Q.ZERO, wp = Q.mul(w, w);
  for (let k = 1; k <= d; k++) { s = Q.add(s, Q.mul(Q.mul(c[k], Q.R(BigInt(k), BigInt(2 * (k + 1)))), wp)); wp = Q.mul(wp, w); } return s; };
const evalQp = (c, d, w) => { let s = Q.ZERO, wp = Q.R(1n);       /* q'(w) = (w/2) p'(w) */
  for (let k = 1; k <= d; k++) { wp = Q.mul(wp, w); s = Q.add(s, Q.mul(Q.mul(c[k], Q.R(BigInt(k), 2n)), wp)); } return s; };

/* the lifted map, with every divisibility verified */
function lift(d, c, a, g0, b) {
  const n = 3;
  const x = K.pvar(0, n), y = K.pvar(1, n), z = K.pvar(2, n);
  const xy = K.pmul(x, y);
  const u = K.padd(K.pconst(Q.R(1n), n), xy);
  const gam = K.padd(K.pconst(g0, n), K.pscale(xy, a), K.pscale(K.pmul(K.pmul(x, x), z), b));
  const gp = [K.pconst(Q.R(1n), n)]; for (let k = 1; k <= d; k++) gp.push(K.pmul(gp[k - 1], gam));
  const up = [K.pconst(Q.R(1n), n)]; for (let k = 1; k <= d + 1; k++) up.push(K.pmul(up[k - 1], u));
  let A = K.pconst(Q.R(2n), n), B = u;
  for (let k = 1; k <= d; k++) {
    A = K.padd(A, K.pscale(K.pmul(gp[k - 1], up[k]), c[k]));
    B = K.padd(B, K.pscale(K.pmul(gp[k - 1], up[k + 1]), Q.mul(c[k], Q.R(BigInt(k), BigInt(2 * (k + 1))))));
  }
  const divX = (p, e) => {
    const out = new Map();
    for (const [key, v] of p) {
      const ex = key.split(',').map(Number);
      if (ex[0] < e) return null;                /* the divisibility conditions failed */
      ex[0] -= e;
      out.set(ex.join(','), v);
    }
    return out;
  };
  const f2 = divX(A, 1), f1 = divX(B, 2);
  if (!f1 || !f2) return null;
  return [f1, f2, K.pmul(gam, x)];
}

/* generate(d, opts) -> { ok, claim, meta } — a certified counterexample of
   geometric degree d+1, or an honest refusal. Deterministic for fixed input. */
function generate(d, opts) {
  opts = opts || {};
  if (!(Number.isInteger(d) && d >= 2)) return { ok: false, why: 'need integer degree d >= 2' };
  const g0 = opts.g0 || Q.R(2n);
  const b = opts.b || Q.R(-1n);
  const free = opts.free || (d >= 3 ? { [d]: Q.R(1n) } : {});
  const c = curve(d, free, g0);
  if (opts.sabotage === 'breakCurve') c[2] = Q.add(c[2], Q.R(1n, 1000000n));   /* RED-control hook */

  const qp = evalQp(c, d, g0);
  const aden = Q.add(qp, Q.mul(Q.R(2n), g0));
  if (Q.isZero(aden)) return { ok: false, why: "degenerate twist: q'(g0) + 2 g0 = 0" };
  const a = Q.neg(Q.div(Q.add(qpow(g0, 2), Q.mul(g0, qp)), aden));

  const F = lift(d, c, a, g0, b);
  if (!F) return { ok: false, why: 'a divisibility condition failed — the curve does not satisfy the twist equations' };

  const D = K.pdet(K.jacobian(F, 3));
  if (!K.pIsConst(D)) return { ok: false, why: 'det J is not constant for this parameter choice' };
  const dv = K.pConstVal(D);
  if (Q.sign(dv) === 0) return { ok: false, why: 'det J is identically zero' };

  /* rational collision pair from a secant line of phi(w) = q(w) - (w/2) p(w) */
  const phi = (w) => Q.sub(evalQ(c, d, w), Q.mul(Q.mul(w, Q.R(1n, 2n)), evalP(c, d, w)));
  const PAIRS = [[Q.R(1n), Q.R(-1n)], [Q.R(1n), Q.R(2n)], [Q.R(1n), Q.R(-2n)], [Q.R(2n), Q.R(-1n)], [Q.R(1n, 2n), Q.R(-1n)]];
  const t = opts.t || Q.R(1n);
  for (const [w1, w2] of PAIRS) {
    const slope = Q.div(Q.sub(phi(w1), phi(w2)), Q.sub(w1, w2));
    const X = Q.mul(Q.R(-2n), slope);
    const pts = [];
    for (const w of [w1, w2]) {
      const g = Q.div(Q.sub(X, evalP(c, d, w)), Q.R(2n));
      if (Q.isZero(g)) { pts.length = 0; break; }
      const u = Q.div(w, g);
      const xi = Q.div(t, g);
      const yi = Q.div(Q.sub(u, Q.R(1n)), xi);
      const zi = Q.div(Q.sub(Q.sub(g, g0), Q.mul(a, Q.mul(xi, yi))), Q.mul(b, Q.mul(xi, xi)));
      pts.push([xi, yi, zi]);
    }
    if (pts.length !== 2) continue;
    const image = F.map(f => K.peval(f, pts[0]));
    const claim = { F, det: dv, collisions: pts, image };
    if (K.audit(claim).verdict === 'VERIFIED') {
      return {
        ok: true, claim,
        meta: {
          d, geometricDegree: d + 1,
          p: c.slice(1).map(Q.toString),          /* p(w) = c_1 w + ... + c_d w^d */
          a: Q.toString(a), g0: Q.toString(g0), b: Q.toString(b),
          det: Q.toString(dv),
          secant: [Q.toString(w1), Q.toString(w2)]
        }
      };
    }
  }
  return { ok: false, why: 'no secant in the search list produced a certified collision pair' };
}

/* ---------------------------------------------------------------------------
   GALLAGHER'S NORMALIZATION (Zenodo 10.5281/zenodo.21479195, 2026-07-20).
   Same mechanism, different gauge: a seed p with p(0) = 0, p(1) = -c and
   INT_0^1 p = 0; q from c q' = w p'; kappa = p'(1)/c != -2 and
   a = -(1+kappa)/(2+kappa); gamma = 1 + a·xy + b·x^2 z, u = 1 + xy, w = u·gamma;
   F = (alpha/x^2, beta/x, x·gamma) with beta = c + p(w)/gamma,
   alpha = u + q(w)/gamma^2, and det J F = b·c. Fiber degree = deg p + 1 via
   the inverse equation R(w) = wP - cQ, R = INT_0^w p — which is LINEAR in
   the target data, so two chosen rational roots w1, w2 determine a rational
   target hit twice, exactly as in generate(). Every seed condition, every
   division, the determinant and the collisions are verified here; a seed
   that fails any condition is refused. */
function fromSeed(opts) {
  const d = opts.pCoeffs.length;                     /* pCoeffs = [c_1..c_d] */
  const c = opts.c || Q.R(1n);
  const b = opts.b || Q.R(1n);
  const cf = [Q.ZERO].concat(opts.pCoeffs);          /* cf[k] = coefficient of w^k */
  if (Q.isZero(c) || Q.isZero(b)) return { ok: false, why: 'b and c must be nonzero' };
  if (opts.sabotage === 'breakSeed') cf[d] = Q.add(cf[d], Q.R(1n, 1000000n));   /* RED-control hook */

  /* the three seed conditions, verified exactly */
  let p1 = Q.ZERO, int01 = Q.ZERO, pp1 = Q.ZERO;
  for (let k = 1; k <= d; k++) {
    p1 = Q.add(p1, cf[k]);
    int01 = Q.add(int01, Q.div(cf[k], Q.R(BigInt(k + 1))));
    pp1 = Q.add(pp1, Q.mul(cf[k], Q.R(BigInt(k))));
  }
  if (Q.cmp(p1, Q.neg(c)) !== 0) return { ok: false, why: 'seed violates p(1) = -c' };
  if (!Q.isZero(int01)) return { ok: false, why: 'seed violates INT_0^1 p = 0' };
  const kappa = Q.div(pp1, c);
  const den = Q.add(kappa, Q.R(2n));
  if (Q.isZero(den)) return { ok: false, why: 'kappa = -2: the twist coefficient is undefined' };
  const a = Q.neg(Q.div(Q.add(kappa, Q.R(1n)), den));

  /* the lift, with gamma_0 = 1: beta = c + sum c_k gamma^{k-1} u^k,
     alpha = u + sum (k c_k)/(c(k+1)) gamma^{k-1} u^{k+1} */
  const n = 3;
  const x = K.pvar(0, n), y = K.pvar(1, n), z = K.pvar(2, n);
  const xy = K.pmul(x, y);
  const u = K.padd(K.pconst(Q.R(1n), n), xy);
  const gam = K.padd(K.pconst(Q.R(1n), n), K.pscale(xy, a), K.pscale(K.pmul(K.pmul(x, x), z), b));
  const gp = [K.pconst(Q.R(1n), n)]; for (let k = 1; k <= d; k++) gp.push(K.pmul(gp[k - 1], gam));
  const up = [K.pconst(Q.R(1n), n)]; for (let k = 1; k <= d + 1; k++) up.push(K.pmul(up[k - 1], u));
  let beta = K.pconst(c, n), alpha = u;
  for (let k = 1; k <= d; k++) {
    beta = K.padd(beta, K.pscale(K.pmul(gp[k - 1], up[k]), cf[k]));
    alpha = K.padd(alpha, K.pscale(K.pmul(gp[k - 1], up[k + 1]), Q.div(Q.mul(cf[k], Q.R(BigInt(k))), Q.mul(c, Q.R(BigInt(k + 1))))));
  }
  const divX = (p, e) => {
    const out = new Map();
    for (const [key, v] of p) {
      const ex = key.split(',').map(Number);
      if (ex[0] < e) return null;
      ex[0] -= e;
      out.set(ex.join(','), v);
    }
    return out;
  };
  const f2 = divX(beta, 1), f1 = divX(alpha, 2);
  if (!f1 || !f2) return { ok: false, why: 'a divisibility condition failed — the seed does not satisfy the construction' };
  const F = [f1, f2, K.pmul(gam, x)];

  const D = K.pdet(K.jacobian(F, 3));
  if (!K.pIsConst(D)) return { ok: false, why: 'det J is not constant for this seed' };
  const dv = K.pConstVal(D);
  if (Q.cmp(dv, Q.mul(b, c)) !== 0) return { ok: false, why: 'det J = ' + Q.toString(dv) + ' != bc' };

  /* rational collisions from the inverse equation R(w) = wP - cQ:
     two rational roots w1, w2 fix P and cQ linearly */
  const evalPw = (w) => { let s = Q.ZERO, wp = Q.R(1n);
    for (let k = 1; k <= d; k++) { wp = Q.mul(wp, w); s = Q.add(s, Q.mul(cf[k], wp)); } return s; };
  const evalR = (w) => { let s = Q.ZERO, wp = w;
    for (let k = 1; k <= d; k++) { wp = Q.mul(wp, w); s = Q.add(s, Q.div(Q.mul(cf[k], wp), Q.R(BigInt(k + 1)))); } return s; };
  const PAIRS = [[Q.R(1n), Q.R(-1n)], [Q.R(1n), Q.R(2n)], [Q.R(1n), Q.R(-2n)], [Q.R(2n), Q.R(-1n)], [Q.R(1n, 2n), Q.R(-1n)]];
  const t = Q.R(1n);                                 /* C, the shared third coordinate */
  for (const [w1, w2] of PAIRS) {
    const P = Q.div(Q.sub(evalR(w1), evalR(w2)), Q.sub(w1, w2));
    const pts = [];
    for (const w of [w1, w2]) {
      const g = Q.div(Q.sub(P, evalPw(w)), c);
      if (Q.isZero(g)) { pts.length = 0; break; }
      const ui = Q.div(w, g);
      const xi = Q.div(t, g);
      const yi = Q.div(Q.sub(ui, Q.R(1n)), xi);
      const zi = Q.div(Q.sub(Q.sub(g, Q.R(1n)), Q.mul(a, Q.sub(ui, Q.R(1n)))), Q.mul(b, Q.mul(xi, xi)));
      pts.push([xi, yi, zi]);
    }
    if (pts.length !== 2) continue;
    const image = F.map(f => K.peval(f, pts[0]));
    const claim = { F, det: dv, collisions: pts, image };
    if (K.audit(claim).verdict === 'VERIFIED') {
      return { ok: true, claim, meta: { d, geometricDegree: d + 1, p: cf.slice(1).map(Q.toString),
        a: Q.toString(a), b: Q.toString(b), c: Q.toString(c), det: Q.toString(dv),
        secant: [Q.toString(w1), Q.toString(w2)] } };
    }
  }
  return { ok: false, why: 'no secant produced a certified collision pair' };
}

/* Gallagher's seed family: p_d = 2w - 3w^2 + w(1-w)(w^{d-2} - k), k = 6/(d(d+1)),
   c = 1 — every generic fiber degree d+1 >= 3, det J == b (b = 1 in the paper) */
function gallagherSeed(d) {
  const k = Q.R(6n, BigInt(d * (d + 1)));
  const cf = new Array(d + 1).fill(Q.ZERO);          /* cf[j] = coeff of w^j */
  cf[1] = Q.add(cf[1], Q.R(2n));
  cf[2] = Q.add(cf[2], Q.R(-3n));
  if (d >= 3) {
    /* w(1-w)(w^{d-2} - k) = w^{d-1} - w^d - k w + k w^2 */
    cf[d - 1] = Q.add(cf[d - 1], Q.R(1n));
    cf[d] = Q.add(cf[d], Q.R(-1n));
    cf[1] = Q.sub(cf[1], k);
    cf[2] = Q.add(cf[2], k);
  }
  return cf.slice(1);
}

module.exports = { generate, curve, lift, fromSeed, gallagherSeed };
