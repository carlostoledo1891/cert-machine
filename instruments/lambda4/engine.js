/* engine.js — proof assembly for the lambda(4) campaign.
   instruments/lambda4 · cert-machine

   Three moves, each certified, compose every theorem this campaign states:

     dotTheorem       the Section-5 shape: a nonnegative weight and a target
                      on an equispaced set force a dip at some theta of S,
                      exact anchored members add their constants, and the
                      argument holds EXCEPT on the finitely many collision
                      conditions the symbolic inner product discovers. The
                      exceptions are OUTPUT, never input: the machine derives
                      the family list Mercer wrote by hand, and the battery
                      refuses if they ever disagree.
     anchoredClosure  the Lemma 3.1/3.2/3.3 shape: close a family for every
                      value of its tail parameter >= N_0, with N_0 derived,
                      not guessed.
     finitePart       what remains is a finite list of explicit sets, each
                      DECIDED by the certified minimum instrument
                      (trigmin/certify-min via the lambda adapter) against
                      the target enclosure. A set that decides the WRONG way
                      is not an error to swallow: it would refute the
                      conjectured value, and the engine says so and aborts.

   Every function returns a plain data object carrying each certified
   comparison with its exact endpoints — the eventual human-readable proof
   is generated FROM these objects, so prose can never drift from what was
   actually proved.

   MIT licensed. Part of cert-machine. */
'use strict';

const F = require('./forms.js');
const D = require('./dot.js');
const E = require('./estimates.js');
const Q = require('#instruments/interval/rational.js');
const LAM = require('#instruments/trigmin/lambda.js');
const CM = require('#instruments/trigmin/certify-min.js');

const q = D.q;

/* ---------------- targets ------------------------------------------------ */
/* L(A) = min_theta sum cos(a theta) as an exact rational enclosure, from the
   certified minimum instrument. The dip comparisons run against .lo. */
function targetEnclosure(A, tol) {
  const r = CM.certify(A, { tol: tol || 1e-13 });
  return {
    A: A.slice(),
    lo: Q.fromDouble(r.minEnclosure[0]),
    hi: Q.fromDouble(r.minEnclosure[1])
  };
}

/* ---------------- labels -------------------------------------------------- */
/* x-space form -> member-space equation string, e.g. 'd = 2c + a' or
   '2d = 3c'. The member map is triangular only for the free prefix
   parametrization, so this solves member coefficients exactly instead:
   express cond in the member basis of the FREE members via back-substitution
   x_i = a_i - a_{i-1}. Contexts with custom parametrizations pass their own
   labels; this helper is for the generic (prefix) contexts. */
function memberEq(C, cond) {
  const n = C.n, mu = [];
  for (let i = 0; i < n; i++) mu.push(cond[i] - (i + 1 < n ? cond[i + 1] : 0n));
  const left = [], right = [];
  mu.forEach((m, i) => {
    const nm = C.names[i];
    if (m > 0n) left.push((m === 1n ? '' : m + '') + nm);
    else if (m < 0n) right.push((m === -1n ? '' : (-m) + '') + nm);
  });
  return (left.join('+') || '0') + ' = ' + (right.join('+') || '0');
}

/* ---------------- move 1: the dot-product theorem ------------------------- */
/* spec: {C, S:{order,xi}, W (weight atom list), gConst, gMembers, anchored,
          target, witnessBox}
   Claim shape: for every gcd-reduced point of C on which NO exception
   condition holds, min f_A <= -gConst + sum(anchored values), and that dip
   clears target.lo. Exceptions are returned labeled and inhabited. */
function dotTheorem(spec) {
  const { C, S, W, gConst, gMembers, anchored, target } = spec;
  const We = D.weightExpr(W);
  const Ge = D.expr(gConst);
  for (const nm of gMembers) D.addCos(Ge, C.member[nm], q(1));

  /* member coverage: g-members plus anchored members = the whole set, once */
  const all = new Set([...gMembers, ...anchored]);
  if (all.size !== gMembers.length + anchored.length)
    throw new Error('dotTheorem: a member appears in both g and anchored');
  for (const nm of Object.keys(C.member)) if (!all.has(nm))
    throw new Error('dotTheorem: member ' + nm + ' is covered by neither g nor the anchors');

  const ip = D.inner(We, Ge, S);
  if (Q.sign(ip.base) > 0) return { ok: false, why: 'base inner product is positive', base: Q.toString(ip.base) };

  /* Lemma 3.4 hypothesis: w not identically 0 on S — and it must hold on
     EVERY branch the theorem closes, so the check is the worst case over all
     collision subsets: base plus every negative delta of <w,1>_S. That is
     conservative (inconsistent subsets only help), never optimistic. */
  const pos = D.inner(We, D.expr(q(1)), S);
  let posWorst = pos.base;
  for (const v of pos.colls.values()) if (Q.sign(v.delta) < 0) posWorst = Q.add(posWorst, v.delta);
  if (Q.sign(posWorst) <= 0) return { ok: false, why: '<w,1>_S can reach ' + Q.toString(posWorst) + ' on a branch — Lemma 3.4 does not apply', posBase: Q.toString(pos.base) };

  /* the dip: g <= 0 somewhere on S, so sum over gMembers <= -gConst; each
     anchored member contributes its exact constant on S */
  let dip = Q.neg(gConst);
  const anchoredVals = {};
  for (const nm of anchored) {
    const av = D.anchoredValue(C.member[nm], S);
    if (!av) return { ok: false, why: 'member ' + nm + ' is not exactly anchored on S' };
    anchoredVals[nm] = Q.toString(av.value);
    dip = Q.add(dip, av.value);
  }
  if (Q.cmp(dip, target.lo) >= 0)
    return { ok: false, why: 'dip does not clear the target', dip: Q.toString(dip), targetLo: Q.toString(target.lo) };

  /* the exceptions, labeled and inhabited */
  const exceptions = [];
  for (const [key, v] of ip.colls) {
    const w = F.witness(C, [v.cond], spec.witnessBox || 14);
    exceptions.push({
      key, label: memberEq(C, v.cond), cond: v.cond,
      delta: Q.toString(v.delta), deltaSign: Q.sign(v.delta),
      inhabited: !!w, example: w
    });
  }
  exceptions.sort((a, b) => a.label < b.label ? -1 : 1);
  return {
    ok: true, base: Q.toString(ip.base), posBase: Q.toString(pos.base),
    dip: Q.toString(dip), dipQ: dip, target: { lo: Q.toString(target.lo), hi: Q.toString(target.hi) },
    anchoredVals, exceptions
  };
}

/* ---------------- move 2: the anchored closure ---------------------------- */
/* spec: {C, members, Se, So, tailMember, target, capN}
   Closes the family for every point whose tailMember value is >= N0. */
function anchoredClosure(spec) {
  const { C, members, Se, So, tailMember, target } = spec;
  const ab = E.anchoredBound(C, members, Se, So);
  const N0 = E.threshold(ab.expr, target, ab.validityFloor, spec.capN);
  const bAtN0 = E.boundAt(ab.expr, N0);
  return {
    ok: true, tailMember, N0, validityFloor: ab.validityFloor,
    expr: { A: Q.toString(ab.expr.A), B: Q.toString(ab.expr.B), C: Q.toString(ab.expr.C), D: Q.toString(ab.expr.D || D.q(0)) },
    boundAtN0: { lo: Q.toString(bAtN0.lo), hi: Q.toString(bAtN0.hi) },
    target: { lo: Q.toString(target.lo), hi: Q.toString(target.hi) },
    pieces: ab.pieces
  };
}

/* ---------------- move 3: the finite part --------------------------------- */
/* Enumerate every gcd-reduced point of the family in the BOX where every
   listed tail value is below its threshold, and decide each with the
   certified minimum instrument. `bounds` is [{tailMember, N0}] (the single
   tailMember/N0 pair is accepted as shorthand); together the tails must give
   every coordinate a positive coefficient, or the box is not finite. skip
   lists the sets excluded as definitional witnesses (the conjectured
   extremal set: equality, not a violation). Every skipped set must appear. */
function finitePart(spec) {
  const { C, target, skip } = spec;
  const bounds = (spec.bounds || [{ tailMember: spec.tailMember, N0: spec.N0 }])
    .map(b => ({ tf: b.form || C.member[b.tailMember], N0: b.N0, name: b.tailMember || 'form' }));
  for (const b of bounds) if (!b.tf) throw new Error('finitePart: unknown tail member ' + b.name);
  for (let i = 0; i < C.n; i++)
    if (!bounds.some(b => b.tf[i] >= 1n))
      throw new Error('finitePart: tail form must have every coefficient >= 1 so the enumeration is a finite box'
        + ' (coordinate ' + i + ' is bounded by no tail)');
  const names = Object.keys(C.member);
  const points = [];
  const x = F.vec(C.n, 1n);
  const val = (f) => Number(f.reduce((s, a, i) => s + a * x[i], 0n));
  const outside = () => bounds.some(b => val(b.tf) >= b.N0);
  const rec = (i) => {
    if (outside()) return;                        /* every tail increases in every x_i */
    if (i === C.n) {
      const A = names.map(nm => val(C.member[nm])).sort((p, r) => p - r);
      for (let j = 1; j < A.length; j++) if (A[j] === A[j - 1]) return;  /* not a set */
      let g = 0; for (const a of A) { let b = a; while (b) { const t = g % b; g = b; b = t; } }
      if (g !== 1) return;                        /* not gcd-reduced: not in N'_n */
      points.push(A);
      return;
    }
    /* deeper coordinates are at their minimum (1) here, and every tail is
       nondecreasing in every coordinate, so once some tail exceeds its bound
       no larger v (and no deeper choice) can re-enter the box */
    const cap = 4 * Math.max(...bounds.map(b => b.N0)) + 4;
    for (let v = 1; v <= cap; v++) {
      x[i] = BigInt(v);
      if (outside()) break;
      rec(i + 1);
    }
    x[i] = 1n;
  };
  rec(0);

  const skipKeys = new Set((skip || []).map(s => s.join(',')));
  const seenSkips = new Set();
  const decided = [], undecided = [], refuters = [];
  const seen = new Set();
  for (const A of points) {
    const k = A.join(',');
    if (seen.has(k)) continue;
    seen.add(k);
    if (skipKeys.has(k)) { seenSkips.add(k); continue; }
    const r = LAM.certifyLambda(A, { tol: spec.tol || 1e-11 });
    const hi = Q.fromDouble(r.minEnclosure[1]), lo = Q.fromDouble(r.minEnclosure[0]);
    if (Q.cmp(hi, target.lo) < 0) decided.push({ A, minHi: r.minEnclosure[1] });
    else if (Q.cmp(lo, target.hi) > 0) refuters.push({ A, minEnclosure: r.minEnclosure });
    else undecided.push({ A, minEnclosure: r.minEnclosure });
  }
  if (refuters.length)
    throw new Error('finitePart: REFUTER FOUND — a family set fails to dip below the target: '
      + JSON.stringify(refuters) + '. This would disprove the conjectured value; stop and look.');
  for (const k of skipKeys) if (!seenSkips.has(k))
    throw new Error('finitePart: skip set [' + k + '] never appeared in the enumeration — the skip list is wrong');
  return {
    ok: undecided.length === 0,
    enumerated: seen.size, closed: decided.length,
    skipped: [...seenSkips], undecided
  };
}

module.exports = { targetEnclosure, memberEq, dotTheorem, anchoredClosure, finitePart, q };
