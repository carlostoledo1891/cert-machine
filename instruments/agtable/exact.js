/* exact.js — the two analytic solutions of Ashrafyan–Gomes §8 (arXiv:2403.02785v2), enclosed.
   instruments/agtable · cert-machine · 2026-09-07

   Both numerical tests of the paper are run against "semi-explicit" solutions the paper
   writes down. Here those solutions are evaluated as INTERVALS — every π, e, sin, cos, tanh
   and integral carries its rounding — so a scheme's error against them is a measured
   distance and not a comparison of two floats.

   THE SUPPLY (both tests, eq. 8.3):  Q̇ = 5 sin(3πt) − 4Q,  Q(0) = −1/2, T = 1.
     Q(t) = A sin ωt + B cos ωt + C e^{−4t},   ω = 3π,  A = 20/(16+ω²),  B = −5ω/(16+ω²),  C = −1/2 − B.
     K(t) = ∫₀ᵗ Q,   L(t) = ∫₀ᵗ K,   J(t) = L(1) − L(t) = ∫ₜ¹ K.

   TEST 1 (§8.1): l₀ = α²/2, V = (x − 1/4)²/2 (η = 1, τ = 1/4), ū ≡ 0, m̄ the bump (8.2).
     The paper's price:  ϖ = η(τ − ∫x m̄)(T − t) − η∫ₜᵀ∫₀ˢQ − cQ  — with ∫x m̄ = 0 by symmetry,
       ϖ₁(t) = −Q(t) + (1 − t)/4 − J(t).
     The value function u = a₀ + a₁x + a₂x² (the paper's ansatz; the coefficients here are
     closed except a₀, which is one rigorous integral):
       a₂(t) = ½ tanh(1 − t),   a₁(t) = J(t) − (1 − t)/4 − tanh(1 − t) K(t),
       a₀(0) = −∫₀¹ [ (Q + tanh(1 − s) K)²/2 − 1/32 ] ds.
     The density is the initial bump transported by an affine flow: mean K(t), scale
       σ(t) = cosh(1 − t)/cosh(1):   m(x, t) = m̄((x − K(t))/σ(t))/σ(t).

   TEST 2 (§8.2): l₀ = 3|α|^{4/3}/4, V = x (η = 1, τ = 0), ū ≡ 0, m̄ the bump (with 1.2).
       ϖ₂(t) = −Q(t)^{1/3} − (1 − t),   u(x, 0) = −∫₀¹ |Q|^{4/3}/4 + x,   m(x, t) = m̄(x − K(t)).

   THE BUMP. The paper prints m̂ = exp(−1/(1 − (λx)²)) for |x| < 1 (λ = 1.1 or 1.2) and 0
   otherwise. As printed the exponent is POSITIVE and unbounded on 1/λ < |x| < 1, so that
   density has no finite integral; the only integrable reading is the standard bump with
   support |x| < 1/λ, and that is what is enclosed here. Said on the page. */
'use strict';
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const J2 = require(path.join(__dirname, '..', 'interval', 'taylor2.js'));
const { iv, ZERO, ONE, add, sub, mul, div, neg, sqr } = I;

/* ---- the supply and its integrals, as interval functions and as jets ---- */
const OMEGA = mul(iv(3), T.PI);
const DEN = add(iv(16), sqr(OMEGA));
const A = div(iv(20), DEN), B = neg(div(mul(iv(5), OMEGA), DEN)), C = sub(iv(-0.5), B);
const FOUR = iv(4);

const Qiv = (t) => add(add(mul(A, T.sin(mul(OMEGA, t))), mul(B, T.cos(mul(OMEGA, t)))), mul(C, T.exp(mul(iv(-4), t))));
const Kiv = (t) => add(add(div(mul(A, sub(ONE, T.cos(mul(OMEGA, t)))), OMEGA), div(mul(B, T.sin(mul(OMEGA, t))), OMEGA)), div(mul(C, sub(ONE, T.exp(mul(iv(-4), t)))), FOUR));
const Liv = (t) => add(add(div(mul(A, sub(t, div(T.sin(mul(OMEGA, t)), OMEGA))), OMEGA), neg(div(mul(B, T.cos(mul(OMEGA, t))), sqr(OMEGA)))), div(mul(C, add(t, div(T.exp(mul(iv(-4), t)), FOUR))), FOUR));
const L1 = Liv(ONE);
const Jiv = (t) => sub(L1, Liv(t));

/* jets, for the integrands that need f″ */
const Qj = (t) => J2.add(J2.add(J2.scale(J2.sin(J2.scale(t, OMEGA)), A), J2.scale(J2.cos(J2.scale(t, OMEGA)), B)), J2.scale(J2.exp(J2.scale(t, iv(-4))), C));
const Kj = (t) => J2.add(J2.add(J2.scale(J2.sub(J2.cst(ONE), J2.cos(J2.scale(t, OMEGA))), div(A, OMEGA)), J2.scale(J2.sin(J2.scale(t, OMEGA)), div(B, OMEGA))), J2.scale(J2.sub(J2.cst(ONE), J2.exp(J2.scale(t, iv(-4)))), div(C, FOUR)));

/* ---- test 1 ---- */
const tanh1mt = (t) => T.tanh(sub(ONE, t));
const price1 = (t) => sub(add(neg(Qiv(t)), div(sub(ONE, t), FOUR)), Jiv(t));
const a2 = (t) => div(tanh1mt(t), iv(2));
const a1 = (t) => sub(sub(Jiv(t), div(sub(ONE, t), FOUR)), mul(tanh1mt(t), Kiv(t)));
/* a₀(0) = −∫₀¹ [ (Q + tanh(1−s) K)²/2 − 1/32 ] ds */
function a0at0(K) {
  const F = (s) => {
    const th = J2.tanh(J2.sub(J2.cst(ONE), s));
    const g = J2.add(Qj(s), J2.mul(th, Kj(s)));
    return J2.sub(J2.scale(J2.sqr(g), iv(0.5)), J2.cst(iv(1 / 32)));
  };
  const r = J2.integrate(F, 0, 1, K);
  return { value: neg(r.value), remainder: r.remainder };
}
/* u(x, 0) for test 1 at a thin x, given a₀(0) */
const u1at0 = (x, a0) => add(add(a0, mul(a1(ZERO), x)), mul(a2(ZERO), sqr(x)));
const COSH1 = div(add(T.exp(ONE), T.exp(iv(-1))), iv(2));
const sigmaT = div(ONE, COSH1);

/* ---- the bump ---- */
/* m̂(y) = exp(−1/(1 − (λy)²)) on |y| < 1/λ, as an interval function of an interval y */
function bump(y, lam) {
  const v = sub(ONE, sqr(mul(iv(lam), y)));
  if (v[1] <= 0) return ZERO;
  const e = neg(div(ONE, v[0] <= 0 ? iv(v[1]) : v));               /* the cell touches the edge: 0 ≤ m̂ ≤ its value at the inner end */
  if (e[1] < -700) return iv(0, 1e-304);                              /* exp(e) ≤ exp(−700) < 1e−304: below every double the page prints */
  const r = T.exp(e);
  return v[0] <= 0 ? iv(0, r[1]) : r;
}
/* Z = ∫ m̂ over the support, rigorous: the midpoint rule with f″ on [−r, r], r just inside
   1/λ, plus a bound on the two edge slivers where the bump is below its value at r */
function bumpMass(lam, K) {
  const F = (y) => J2.exp(J2.neg(J2.inv(J2.sub(J2.cst(ONE), J2.sqr(J2.scale(y, iv(lam)))))));
  const edge = 1 / lam, delta = 1e-3, r = edge - delta;
  const core = J2.integrate(F, -r, r, K);
  const sliver = mul(iv(2 * delta), iv(0, bump(iv(r), lam)[1]));   /* twice, one sliver each side; m̂ decreasing outward */
  return { value: add(core.value, sliver), remainder: core.remainder + I.width(sliver) };
}
/* m̄(y) = m̂(y)/Z at an interval y */
const mbar = (y, lam, Z) => div(bump(y, lam), Z);

/* test 1: m(x, T) = m̄((x − K(1))/σ(T))/σ(T);  test 2: m(x, T) = m̄(x − K(1)) */
const m1atT = (x, Z) => div(mbar(div(sub(x, Kiv(ONE)), sigmaT), 1.1, Z), sigmaT);
const m2atT = (x, Z) => mbar(sub(x, Kiv(ONE)), 1.2, Z);

/* ---- test 2 ---- */
/* a verified interval cube root: Math.cbrt at the endpoints, padded, and checked by cubing */
function cbrt(X) {
  const pad = (y) => [I.nextDown(I.nextDown(y)), I.nextUp(I.nextUp(y))];
  let lo = pad(Math.cbrt(X[0])), hi = pad(Math.cbrt(X[1]));
  for (let k = 0; k < 8 && !(I.pow(iv(lo[0]), 3)[1] <= X[0]); k++) lo[0] = I.nextDown(lo[0]);
  for (let k = 0; k < 8 && !(I.pow(iv(hi[1]), 3)[0] >= X[1]); k++) hi[1] = I.nextUp(hi[1]);
  if (!(I.pow(iv(lo[0]), 3)[1] <= X[0] && I.pow(iv(hi[1]), 3)[0] >= X[1])) throw new Error('cbrt: could not verify');
  return iv(lo[0], hi[1]);
}
const price2 = (t) => sub(neg(cbrt(Qiv(t))), sub(ONE, t));
/* ∫₀¹ |Q|^{4/3}/4: midpoint with f″ where Q keeps its sign, a Riemann bound on cells where Q crosses 0 */
function int2(K) {
  const F = (s) => { const q = Qj(s); const aq = q.v[0] > 0 ? q : J2.neg(q); return J2.scale(J2.powr(aq, 4 / 3), iv(0.25)); };
  const guard = (cell) => {
    const q = Qiv(cell);
    if (q[0] > 0 || q[1] < 0) return null;
    const m = I.mag(q); const f = mul(iv(0.25), mul(iv(m), cbrt(iv(m))));
    return iv(0, f[1]);
  };
  return J2.integrate(F, 0, 1, K, guard);
}
const u2at0 = (x, int) => add(neg(int), x);

module.exports = { OMEGA, A, B, C, Qiv, Kiv, Jiv, price1, a0at0, a1, a2, u1at0, sigmaT, COSH1, bump, bumpMass, mbar, m1atT, m2atT, cbrt, price2, int2, u2at0 };
