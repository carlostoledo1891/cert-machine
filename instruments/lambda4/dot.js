/* dot.js — Mercer's dot product on equispaced sets, symbolically and exactly.
   instruments/lambda4 · cert-machine

   For S = {theta : m*theta = xi (mod 2pi)} equispaced of order m, and f, g
   trigonometric polynomials, <f,g>_S = (1/m) sum_{theta in S} f g. The whole
   calculus reduces to one primitive (theta_0 = xi/m):

     <1, cos(k theta)>_S = cos(t*xi)   if k = t*m for an integer t,
                         = 0           otherwise,

   and products of cosines expand by cos A cos B = (cos(A+B) + cos(A-B))/2.
   With xi in {pi, 2pi/3}, every cos(t*xi) is RATIONAL — so for a family of
   integer sets the inner product is an exact rational, PIECEWISE over the
   finitely many linear collision conditions "k = t*m" that forms.multiplesIn
   enumerates. The base value is the no-collision case; each condition
   carries the exact delta its activation adds. Mercer's Section 5 exception
   list is exactly the conditions of one such computation, and this file is
   what lets the machine re-derive — not transcribe — it.

   WEIGHTS. Lemma 3.4 needs w >= 0 on the circle AND w not identically zero
   on S. Weights are built only from the nonnegative cone (constants,
   1 - cos, (1 - cos)^2 with nonnegative rational coefficients), so w >= 0 is
   by construction; the second hypothesis is discharged by computing <w,1>_S
   and requiring its base value > 0 (any collision on it is surfaced). The
   textbook statement of Lemma 3.4 omits that hypothesis and is FALSE without
   it — w vanishing identically on S satisfies <w,g>_S = 0 <= 0 against a g
   that is positive everywhere on S. The battery keeps a red control on this.

   MIT licensed. Part of cert-machine. */
'use strict';

const F = require('./forms.js');
const Q = require('#instruments/interval/rational.js');

const q = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));

/* ---------------- angles: rational multiples of pi ----------------------- */
/* xi = (p/r)*pi. Menu: pi (1/1) and 2pi/3 (2/3). cosOfMultiple(t, xi) is
   cos(t*xi) as an exact rational — defined exactly for these two anchors. */
const XI_PI = { p: 1n, r: 1n, name: 'pi' };
const XI_2PI3 = { p: 2n, r: 3n, name: '2pi/3' };
const XI_PI3 = { p: 1n, r: 3n, name: 'pi/3' };   /* cos(t*pi/3) in {1, 1/2, -1/2, -1} */
const XI_PI2 = { p: 1n, r: 2n, name: 'pi/2' };   /* cos(t*pi/2) in {1, 0, -1} */
const XI_4PI3 = { p: 4n, r: 3n, name: '4pi/3' };
const XI_ZERO = { p: 0n, r: 1n, name: '0' };     /* companion anchor for reflection estimates */
const XI_PI6 = { p: 1n, r: 6n, name: 'pi/6' };   /* rational only at even t and t = 3, 9 (mod 12) */

function cosOfMultiple(t, xi) {
  const T = BigInt(t);
  if (xi.r === 1n) return (T * xi.p) % 2n === 0n ? q(1) : q(-1);
  if (xi.r === 2n) {
    const m = ((T * xi.p) % 4n + 4n) % 4n;             /* angle = m*pi/2 */
    return m === 0n ? q(1) : m === 2n ? q(-1) : q(0);
  }
  if (xi.r === 3n) {
    const m = ((T * xi.p) % 6n + 6n) % 6n;             /* angle = m*pi/3 */
    if (m === 0n) return q(1);
    if (m === 3n) return q(-1);
    if (m === 1n || m === 5n) return q(1, 2);
    return q(-1, 2);                                    /* 2pi/3, 4pi/3 */
  }
  if (xi.r === 6n) {
    const m = ((T * xi.p) % 12n + 12n) % 12n;          /* angle = m*pi/6 */
    if (m === 0n) return q(1);
    if (m === 6n) return q(-1);
    if (m === 3n || m === 9n) return q(0);
    if (m === 2n || m === 10n) return q(1, 2);
    if (m === 4n || m === 8n) return q(-1, 2);
    throw new Error('dot: cos(' + m + 'pi/6) is irrational — this multiple cannot anchor');
  }
  throw new Error('dot: unsupported anchor xi = ' + xi.p + 'pi/' + xi.r);
}

/* ---------------- cosine expressions ------------------------------------- */
/* {c0: rational, terms: Map key -> {form, coeff}} meaning c0 + sum coeff*cos(form*theta).
   Forms are sign-normalized on entry (cos is even); identically-zero forms
   fold into the constant. */
function expr(c0) { return { c0: c0 || q(0), terms: new Map() }; }

function addCos(E, form, coeff) {
  if (F.isZero(form)) { E.c0 = Q.add(E.c0, coeff); return E; }
  const lead = form.find(a => a !== 0n);
  const f = lead < 0n ? F.neg(form) : form;
  const k = F.key(f);
  const cur = E.terms.get(k);
  if (cur) {
    cur.coeff = Q.add(cur.coeff, coeff);
    if (Q.isZero(cur.coeff)) E.terms.delete(k);
  } else E.terms.set(k, { form: f, coeff });
  return E;
}

/* ---------------- the weight cone ---------------------------------------- */
/* atoms: {kind:'const', v} | {kind:'omc', form} | {kind:'omcsq', form}
   (omc = one minus cos; omcsq = its square). weight = [{atom, coeff>=0}]. */
function weightExpr(W) {
  const E = expr(q(0));
  for (const { atom, coeff } of W) {
    if (Q.sign(coeff) < 0) throw new Error('dot: weight coefficients must be >= 0');
    if (atom.kind === 'const') {
      if (Q.sign(atom.v) < 0) throw new Error('dot: constant atom must be >= 0');
      E.c0 = Q.add(E.c0, Q.mul(coeff, atom.v));
    } else if (atom.kind === 'omc') {          /* 1 - cos k */
      E.c0 = Q.add(E.c0, coeff);
      addCos(E, atom.form, Q.neg(coeff));
    } else if (atom.kind === 'omcsq') {        /* (1-cos k)^2 = 3/2 - 2cos k + (1/2)cos 2k */
      E.c0 = Q.add(E.c0, Q.mul(coeff, q(3, 2)));
      addCos(E, atom.form, Q.mul(coeff, q(-2)));
      addCos(E, F.scale(atom.form, 2), Q.mul(coeff, q(1, 2)));
    } else if (atom.kind === 'opc') {          /* 1 + cos k = 2cos^2(k/2) >= 0 */
      E.c0 = Q.add(E.c0, coeff);
      addCos(E, atom.form, coeff);
    } else if (atom.kind === 'opcsq') {        /* (1+cos k)^2 = 3/2 + 2cos k + (1/2)cos 2k */
      E.c0 = Q.add(E.c0, Q.mul(coeff, q(3, 2)));
      addCos(E, atom.form, Q.mul(coeff, q(2)));
      addCos(E, F.scale(atom.form, 2), Q.mul(coeff, q(1, 2)));
    } else throw new Error('dot: unknown weight atom ' + atom.kind);
  }
  return E;
}

/* ---------------- the symbolic inner product ------------------------------ */
/* inner(We, Ge, S) where S = {order: form m, xi}. Returns
     { base: rational, colls: Map condKey -> {cond, t, delta, via:[labels]} }
   base is the inner product when NO collision condition holds; activating a
   condition adds its delta. Simultaneous conditions add their deltas — the
   primitive <1,cos k> depends on each k's own condition alone, so additivity
   is exact, not an approximation. */
function inner(We, Ge, S) {
  const out = { base: q(0), colls: new Map() };
  const contrib = (form, weightQ, via) => {
    if (Q.isZero(weightQ)) return;
    if (F.isZero(form)) { out.base = Q.add(out.base, weightQ); return; }  /* cos 0 = 1 */
    const an = F.multiplesInEven(form, S.order);
    if (an.kind === 'zero') { out.base = Q.add(out.base, weightQ); return; }
    if (an.kind === 'never') return;
    if (an.kind === 'exact') {
      out.base = Q.add(out.base, Q.mul(weightQ, cosOfMultiple(an.t, S.xi)));
      return;
    }
    for (const c of an.conds) {
      const delta = Q.mul(weightQ, cosOfMultiple(c.t, S.xi));
      const cur = out.colls.get(c.key);
      if (cur) { cur.delta = Q.add(cur.delta, delta); cur.via.push(via); }
      else out.colls.set(c.key, { cond: c.cond, t: c.t, delta, via: [via] });
    }
  };

  out.base = Q.add(out.base, Q.mul(We.c0, Ge.c0));                    /* const x const */
  for (const { form, coeff } of Ge.terms.values())
    contrib(form, Q.mul(We.c0, coeff), 'w0*cos');
  for (const { form, coeff } of We.terms.values())
    contrib(form, Q.mul(coeff, Ge.c0), 'cos*g0');
  for (const w of We.terms.values()) for (const g of Ge.terms.values()) {
    const half = Q.mul(Q.mul(w.coeff, g.coeff), q(1, 2));
    contrib(F.add(w.form, g.form), half, 'sum');
    contrib(F.sub(w.form, g.form), half, 'diff');
  }
  /* prune conditions whose delta cancelled to zero */
  for (const [k, v] of out.colls) if (Q.isZero(v.delta)) out.colls.delete(k);
  return out;
}

/* ---------------- exact member values on S -------------------------------- */
/* For a member form that is an exact multiple of the order, its cosine is a
   constant on S. Returns {value} or null if not anchored. */
function anchoredValue(form, S) {
  if (F.isZero(form)) return { value: q(1) };
  const an = F.multiplesIn(form, S.order);
  return an.kind === 'exact' ? { value: cosOfMultiple(an.t, S.xi) } : null;
}

module.exports = { q, XI_PI, XI_2PI3, XI_PI3, XI_PI2, XI_4PI3, XI_ZERO, XI_PI6, cosOfMultiple, expr, addCos, weightExpr, inner, anchoredValue };
