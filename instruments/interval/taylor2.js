/* taylor2.js — second-order forward-mode differentiation over intervals, and the
   midpoint rule with its remainder for a function built from it.

   A jet is (v, d1, d2): an enclosure of f, f′ and f″ at an interval argument. Every
   operation propagates all three with interval arithmetic, so evaluating a formula
   on a cell [a, b] gives a rigorous bound on f″ over the cell — exactly what the
   midpoint rule's remainder w³/24 · sup|f″| needs, without anyone differentiating by
   hand. The same jet evaluated at a thin point gives f there.

   ∫ₐᵇ f = Σ_cells ( w · f(mid) + [−1, 1] · w³/24 · sup_cell |f″| ), rigorous.

   Part of eqcert; MIT. */
'use strict';
const I = require('./interval.js');
const T = require('./transcendental.js');
const { iv, ZERO, ONE } = I;

const jet = (v, d1, d2) => ({ v, d1: d1 || ZERO, d2: d2 || ZERO });
const cst = (c) => jet(Array.isArray(c) ? c : iv(c));
const variable = (X) => jet(Array.isArray(X) ? X : iv(X), ONE, ZERO);
const two = iv(2);

const add = (a, b) => jet(I.add(a.v, b.v), I.add(a.d1, b.d1), I.add(a.d2, b.d2));
const sub = (a, b) => jet(I.sub(a.v, b.v), I.sub(a.d1, b.d1), I.sub(a.d2, b.d2));
const neg = (a) => jet(I.neg(a.v), I.neg(a.d1), I.neg(a.d2));
const mul = (a, b) => jet(I.mul(a.v, b.v),
  I.add(I.mul(a.d1, b.v), I.mul(a.v, b.d1)),
  I.add(I.add(I.mul(a.d2, b.v), I.mul(two, I.mul(a.d1, b.d1))), I.mul(a.v, b.d2)));
const scale = (a, c) => { const C = Array.isArray(c) ? c : iv(c); return jet(I.mul(C, a.v), I.mul(C, a.d1), I.mul(C, a.d2)); };
const sqr = (a) => jet(I.sqr(a.v), I.mul(two, I.mul(a.v, a.d1)), I.add(I.mul(two, I.sqr(a.d1)), I.mul(two, I.mul(a.v, a.d2))));
/* 1/a — refuses (throws, through I.div) when a straddles 0 */
function inv(a) {
  const r = I.div(ONE, a.v), r2 = I.sqr(r), r3 = I.mul(r2, r);
  return jet(r, I.neg(I.mul(a.d1, r2)), I.sub(I.mul(two, I.mul(I.sqr(a.d1), r3)), I.mul(a.d2, r2)));
}
const div = (a, b) => mul(a, inv(b));
function exp(a) {
  const e = T.exp(a.v);
  return jet(e, I.mul(e, a.d1), I.mul(e, I.add(I.sqr(a.d1), a.d2)));
}
function sin(a) {
  const s = T.sin(a.v), c = T.cos(a.v);
  return jet(s, I.mul(c, a.d1), I.sub(I.mul(c, a.d2), I.mul(s, I.sqr(a.d1))));
}
function cos(a) {
  const s = T.sin(a.v), c = T.cos(a.v);
  return jet(c, I.neg(I.mul(s, a.d1)), I.neg(I.add(I.mul(c, I.sqr(a.d1)), I.mul(s, a.d2))));
}
function tanh(a) {
  const t = T.tanh(a.v), s = I.sub(ONE, I.sqr(t));          /* sech² */
  return jet(t, I.mul(s, a.d1), I.sub(I.mul(s, a.d2), I.mul(two, I.mul(t, I.mul(s, I.sqr(a.d1))))));
}
/* a^r for real r on a > 0 (refuses otherwise): exp(r log a) */
function powr(a, r) {
  if (!(a.v[0] > 0)) throw new Error('taylor2.powr: base must be positive, got [' + a.v + ']');
  const R = iv(r), p = T.exp(I.mul(R, T.log(a.v)));
  const pv = I.div(p, a.v), pvv = I.div(pv, a.v);
  return jet(p, I.mul(R, I.mul(pv, a.d1)),
    I.add(I.mul(I.mul(R, iv(r - 1)), I.mul(pvv, I.sqr(a.d1))), I.mul(R, I.mul(pv, a.d2))));
}

/* ∫ₐᵇ F(x) dx with F : jet → jet, K cells, midpoint rule with the f″ remainder.
   Returns { value, remainder } — value is the enclosure, remainder the total width it added.
   `guard(cell)` may return an interval enclosing f on the cell to use a plain Riemann
   bound there instead (for cells where F cannot be differentiated: a kink, a zero of a
   root) — the sum stays rigorous either way. */
function integrate(F, a, b, K, guard) {
  let sum = ZERO, rem = 0;
  const w = (b - a) / K, W = I.div(I.sub(iv(b), iv(a)), iv(K));
  const w3over24 = I.div(I.pow(W, 3), iv(24));
  for (let i = 0; i < K; i++) {
    const lo = a + i * w, hi = i === K - 1 ? b : a + (i + 1) * w;
    const cell = iv(lo, hi);
    const g = guard ? guard(cell) : null;
    if (g) { sum = I.add(sum, I.mul(W, g)); rem += I.width(I.mul(W, g)); continue; }
    const mid = 0.5 * (lo + hi);
    const fm = F(variable(iv(mid))).v;
    const f2 = F(variable(cell)).d2;
    const R = I.mul(w3over24, iv(-I.mag(f2), I.mag(f2)));
    sum = I.add(sum, I.add(I.mul(W, fm), R));
    rem += I.width(R);
  }
  return { value: sum, remainder: rem };
}

module.exports = { jet, cst, variable, add, sub, neg, mul, scale, sqr, inv, div, exp, sin, cos, tanh, powr, integrate };
