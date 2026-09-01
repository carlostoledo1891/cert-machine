/* forms.js — linear forms over ordered integer parameters, exactly.
   instruments/lambda4 · cert-machine

   THE CAMPAIGN: prove lambda(4) = -L(1,2,3,4) by executing the strategy
   Mercer published in Section 5 of arXiv:1709.06612 (INTEGERS 19 (2019) #A4)
   and could not execute: a weight-function argument closes every set whose
   largest element avoids finitely many linear combinations of the others,
   and what remains is a finite list of lower-dimensional families. This file
   is the bottom layer: the symbolic objects the whole argument runs on.

   A CONTEXT is n strictly increasing positive integers a_1 < ... < a_n,
   re-parametrized as a_i = x_1 + ... + x_i with every x_j >= 1 an integer —
   the standard cone parametrization that turns each ordering constraint into
   a coordinate. Derived members (a family's forced d = phi(a,b,c)) are
   linear forms over the same x. A FORM is a BigInt coefficient vector over
   x. Everything the proof needs to know about a form — is it positive, can
   it be a multiple of another form, when exactly — becomes a statement about
   nonnegative integer vectors, decided exactly:

     · certPos(f): every coefficient >= 0 and their sum >= 1 certifies
       f >= 1 at every integer point of the cone (min at x = 1). This is a
       ONE-SIDED test on purpose: a form it cannot certify is treated as
       unknown, never as negative.
     · multiplesIn(k, m): the finite case analysis "k = t*m is impossible /
       always true / possible exactly when this linear condition holds",
       obtained by certifying k >= 1 and B*m - k >= 1 for a small B and then
       testing each t < B. This is precisely the move Mercer performs in
       prose ("the positive numbers 2c+a, 2c+b, 3c are all less than 3d,
       and hence if any of them are multiples of d, they are equal to d or
       2d") — mechanized, so it cannot skip a case.

   MIT licensed. Part of cert-machine. */
'use strict';

/* ---------------- vectors of BigInt over the x-parametrization ----------- */

const vec = (n, fill) => Array.from({ length: n }, () => fill === undefined ? 0n : fill);
const add = (u, v) => u.map((a, i) => a + v[i]);
const sub = (u, v) => u.map((a, i) => a - v[i]);
const scale = (u, s) => u.map(a => a * BigInt(s));
const neg = (u) => u.map(a => -a);
const isZero = (u) => u.every(a => a === 0n);
const equal = (u, v) => u.length === v.length && u.every((a, i) => a === v[i]);
const key = (u) => u.join(',');

/* sign-normalized key: cos is even and a condition f = 0 equals -f = 0, so
   both orientations must collide to one key. Leading nonzero made positive. */
function normKey(u) {
  const lead = u.find(a => a !== 0n);
  const w = (lead !== undefined && lead < 0n) ? neg(u) : u;
  return key(w);
}

/* ---------------- contexts ---------------------------------------------- */

/* ctx(names, defs): names are the FREE members, strictly increasing positive
   integers in the given order; defs maps a derived member name to its form
   over the free members (member-space coefficients), e.g. {d: {c:2}} for the
   family d = 2c. All forms are stored in x-space. */
function ctx(names, defs) {
  const n = names.length;
  const C = { n, names, member: {}, defs: {} };
  names.forEach((nm, i) => {
    const f = vec(n);
    for (let j = 0; j <= i; j++) f[j] = 1n;      /* a_i = x_1 + ... + x_i */
    C.member[nm] = f;
  });
  for (const nm of Object.keys(defs || {})) {
    C.defs[nm] = combo(C, defs[nm]);
    C.member[nm] = C.defs[nm];
  }
  return C;
}

/* combo(C, {name: integerCoeff, ...}) -> x-space form */
function combo(C, coeffs) {
  let f = vec(C.n);
  for (const nm of Object.keys(coeffs)) {
    if (!C.member[nm]) throw new Error('forms: unknown member ' + nm);
    f = add(f, scale(C.member[nm], coeffs[nm]));
  }
  return f;
}

/* ---------------- certified positivity ----------------------------------- */

/* f >= 1 everywhere on the integer cone x_j >= 1?  Certified iff every
   coefficient is >= 0 and the value at x = (1,..,1) is >= 1. One-sided. */
function certPos(f) {
  let s = 0n;
  for (const a of f) { if (a < 0n) return false; s += a; }
  return s >= 1n;
}
const certNonneg = (f) => f.every(a => a >= 0n);

/* ---------------- the multiple analysis ---------------------------------- */

/* multiplesIn(k, m, Bmax): full case analysis of k = t*m, t >= 1, over the
   cone. Returns one of
     {kind:'zero'}                                  k is identically 0
     {kind:'exact', t}                              k = t*m identically
     {kind:'never'}                                 no t is possible
     {kind:'conditional', conds:[{t, cond, key}]}   k = t*m iff cond = 0
   The bound B with k < B*m certified is found by trying B = 1..Bmax; a form
   that cannot be bounded is an error, never a silent skip. */
function multiplesIn(k, m, Bmax) {
  if (isZero(k)) return { kind: 'zero' };
  if (!certPos(k)) throw new Error('forms.multiplesIn: k not certifiably >= 1: [' + key(k) + ']');
  if (!certPos(m)) throw new Error('forms.multiplesIn: order m not certifiably >= 1: [' + key(m) + ']');
  let B = null;
  for (let b = 1; b <= (Bmax || 6); b++) {
    if (certPos(sub(scale(m, b), k))) { B = b; break; }
  }
  if (B === null) throw new Error('forms.multiplesIn: cannot bound k < B*m for B <= ' + (Bmax || 6));
  const conds = [];
  for (let t = 1; t < B; t++) {
    const cond = sub(k, scale(m, t));
    if (isZero(cond)) return { kind: 'exact', t };
    if (certPos(cond) || certPos(neg(cond))) continue;   /* impossible */
    conds.push({ t, cond, key: normKey(cond) });
  }
  return conds.length ? { kind: 'conditional', conds } : { kind: 'never' };
}

/* multiplesInEven(k, m, Bmax): the same analysis for a form of UNKNOWN sign,
   under evenness (cos(k theta) = cos(-k theta) = cos(|k| theta)): |k| = t*m
   with t >= 0. A mixed-sign form can VANISH, so t = 0 (condition k = 0) is a
   real case here — cos 0 = 1 — where a certified-positive form excludes it.
   Conditions come in both orientations k = t*m and k = -t*m; they normalize
   to distinct keys and each carries the same |t|. */
function multiplesInEven(k, m, Bmax) {
  if (isZero(k)) return { kind: 'zero' };
  if (certPos(k)) return multiplesIn(k, m, Bmax);
  if (certPos(neg(k))) {
    const an = multiplesIn(neg(k), m, Bmax);
    if (an.kind !== 'conditional') return an;
    return { kind: 'conditional', conds: an.conds.map(c => ({ t: c.t, cond: c.cond, key: c.key })) };
  }
  /* mixed sign: bound |k| < B*m */
  if (!certPos(m)) throw new Error('forms.multiplesInEven: order m not certifiably >= 1');
  let B = null;
  for (let b = 1; b <= (Bmax || 6); b++) {
    if (certPos(sub(scale(m, b), k)) && certPos(add(scale(m, b), k))) { B = b; break; }
  }
  if (B === null) throw new Error('forms.multiplesInEven: cannot bound |k| < B*m for B <= ' + (Bmax || 6));
  const conds = [{ t: 0, cond: k, key: normKey(k) }];          /* k = 0 is possible */
  for (let t = 1; t < B; t++) {
    for (const cond of [sub(k, scale(m, t)), add(k, scale(m, t))]) {
      if (isZero(cond)) throw new Error('forms.multiplesInEven: mixed-sign form is an exact multiple — unreachable');
      if (certPos(cond) || certPos(neg(cond))) continue;
      conds.push({ t, cond, key: normKey(cond) });
    }
  }
  return { kind: 'conditional', conds };
}

/* ---------------- integer witnesses -------------------------------------- */

/* A brute-force integer point of the cone satisfying every equation in eqs
   (forms that must vanish), searched over 1 <= x_j <= box. Used to certify
   that a discovered family is INHABITED — an exception list padded with an
   impossible condition would misdescribe the theorem. */
function witness(C, eqs, box) {
  const B = box || 40;
  const x = vec(C.n, 1n);
  const evalF = (f) => f.reduce((s, a, i) => s + a * x[i], 0n);
  const rec = (i) => {
    if (i === C.n) return eqs.every(f => evalF(f) === 0n);
    for (let v = 1; v <= B; v++) { x[i] = BigInt(v); if (rec(i + 1)) return true; }
    x[i] = 1n;
    return false;
  };
  if (!rec(0)) return null;
  const out = {};
  for (const nm of Object.keys(C.member)) out[nm] = Number(C.member[nm].reduce((s, a, i) => s + a * x[i], 0n));
  return out;
}

/* ---------------- exact 2-form decomposition ----------------------------- */

/* decompose(C, k, m1, m2): integers u, v with k = u*m1 + v*m2 IDENTICALLY,
   or null. This is both the estimate layer's member decomposition and the
   gcd certificate: if every member of the context decomposes integrally over
   (m1, m2), then gcd(m1, m2) divides gcd(all members) = 1 (the lambda
   context is gcd-reduced), which is what Lemma 3.1 consumes. */
function decompose(C, k, m1, m2) {
  /* solve the n x 2 system exactly over Q by two independent rows, verify all */
  let r1 = -1, r2 = -1;
  for (let i = 0; i < C.n && r2 < 0; i++) {
    if (m1[i] === 0n && m2[i] === 0n) continue;
    if (r1 < 0) { r1 = i; continue; }
    /* independence of rows r1, i */
    if (m1[r1] * m2[i] - m1[i] * m2[r1] !== 0n) r2 = i;
  }
  if (r1 < 0) return null;
  let u, v; /* rationals as [num, den], den > 0 */
  if (r2 < 0) {
    /* rank 1: m2 parallel to m1 (or zero); try v = 0 */
    if (m1[r1] === 0n) return null;
    if (k[r1] % m1[r1] !== 0n) return null;
    u = k[r1] / m1[r1]; v = 0n;
  } else {
    const det = m1[r1] * m2[r2] - m1[r2] * m2[r1];
    const un = k[r1] * m2[r2] - k[r2] * m2[r1];
    const vn = m1[r1] * k[r2] - m1[r2] * k[r1];
    if (un % det !== 0n || vn % det !== 0n) return null;
    u = un / det; v = vn / det;
  }
  const rebuilt = add(scale(m1, u), scale(m2, v));
  if (!equal(rebuilt, k)) return null;
  return { u, v };
}

module.exports = {
  vec, add, sub, scale, neg, isZero, equal, key, normKey,
  ctx, combo, certPos, certNonneg, multiplesIn, multiplesInEven, witness, decompose
};
