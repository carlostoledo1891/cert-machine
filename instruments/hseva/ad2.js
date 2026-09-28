/* instruments/hseva/ad2.js — second-order forward differentiation over an
   arithmetic (fit.js floatOps or intervalOps), for a family whose score and
   Hessian are safer derived by the chain rule than written out by hand.

   A number is { v, g, H }: its value, its gradient in the m parameters, and
   its m×m Hessian — each component an arithmetic value (a float, or an
   interval that encloses it). Every operation propagates all three by the
   exact rules (product rule; f(a): g = f′·∇a, H = f′·∇²a + f″·∇a∇aᵀ), so in
   intervals the result encloses the value and both derivatives of the
   function over the box — the same guarantee as a hand-written formula, with
   no algebra to get wrong. A unary primitive supplies f, f′, f″ as
   enclosures over its argument. */
'use strict';

function makeAD(o, m) {
  const Z = () => o.c(0);
  const zeros = () => Array.from({ length: m }, Z);
  const zeros2 = () => Array.from({ length: m }, () => zeros());
  const K = (x) => ({ v: typeof x === 'number' ? o.c(x) : x, g: zeros(), H: zeros2() });
  const V = (x, i) => { const g = zeros(); g[i] = o.c(1); return { v: x, g, H: zeros2() }; };
  const add = (a, b) => ({ v: o.add(a.v, b.v), g: a.g.map((x, i) => o.add(x, b.g[i])), H: a.H.map((r, i) => r.map((x, j) => o.add(x, b.H[i][j]))) });
  const sub = (a, b) => ({ v: o.sub(a.v, b.v), g: a.g.map((x, i) => o.sub(x, b.g[i])), H: a.H.map((r, i) => r.map((x, j) => o.sub(x, b.H[i][j]))) });
  const scale = (a, s) => ({ v: o.mul(a.v, s), g: a.g.map((x) => o.mul(x, s)), H: a.H.map((r) => r.map((x) => o.mul(x, s))) });
  const mul = (a, b) => ({
    v: o.mul(a.v, b.v),
    g: a.g.map((x, i) => o.add(o.mul(a.v, b.g[i]), o.mul(b.v, x))),
    H: a.H.map((r, i) => r.map((x, j) => o.add(o.add(o.mul(a.v, b.H[i][j]), o.mul(b.v, x)), o.add(o.mul(a.g[i], b.g[j]), o.mul(a.g[j], b.g[i]))))),
  });
  /* f(a) from f, f′, f″ at a.v */
  const unary = (a, f, f1, f2) => ({
    v: f, g: a.g.map((x) => o.mul(f1, x)),
    H: a.H.map((r, i) => r.map((x, j) => o.add(o.mul(f1, x), o.mul(f2, o.mul(a.g[i], a.g[j]))))),
  });
  const exp = (a) => { const e = o.exp(a.v); return unary(a, e, e, e); };
  const log = (a) => { const r = o.div(o.c(1), a.v); return unary(a, o.log(a.v), r, o.neg(o.mul(r, r))); };
  const recip = (a) => { const r = o.div(o.c(1), a.v), r2 = o.mul(r, r); return unary(a, r, o.neg(r2), o.mul(o.c(2), o.mul(r2, r))); };
  const div = (a, b) => mul(a, recip(b));
  const neg = (a) => scale(a, o.c(-1));
  return { K, V, add, sub, mul, div, neg, exp, log, recip, scale, unary, m };
}

if (typeof module !== 'undefined') module.exports = { makeAD };
