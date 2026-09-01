#!/usr/bin/env node
/* run-lambda4-campaign.js — the lambda(4) campaign, executed in full.
   tools/ · cert-machine

   Re-derives, mechanically and exactly, everything Mercer proved on the way
   to his Section-5 strategy (arXiv:1709.06612 / INTEGERS 19 (2019) #A4), and
   the strategy's own generic case:

     lambda(2) = 9/8               threshold b >= 3 DERIVED, finite part decided
     lambda(3) = -L(1,2,3)         M0's three exceptional families DISCOVERED,
                                   each closed: thresholds a>=3, b>=3, b>=33
                                   derived; 322 finite sets decided exactly;
                                   (1,2,3) the definitional witness
     lambda(4), generic case       the 14 exception conditions DISCOVERED and
                                   matched against Mercer's list — and five of
                                   them carry strictly negative delta, so the
                                   REAL remaining reduction is NINE families,
                                   not fourteen. That worklist is the record's
                                   payload and Phase 1's input.

   Writes certs/lambda4-phase0.json. The battery re-derives every symbolic
   step at every run and re-certifies a deterministic sample of the finite
   part; this runner is the full pass that the record pins.

   usage: node tools/run-lambda4-campaign.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const F = require(path.join(ROOT, 'instruments/lambda4/forms.js'));
const D = require(path.join(ROOT, 'instruments/lambda4/dot.js'));
const EN = require(path.join(ROOT, 'instruments/lambda4/engine.js'));
const LAM = require(path.join(ROOT, 'instruments/trigmin/lambda.js'));

const t0 = Date.now();
const q = D.q;

/* ---- targets ------------------------------------------------------------- */
const L2 = EN.targetEnclosure([1, 2]);
const L3 = EN.targetEnclosure([1, 2, 3]);
const L4 = EN.targetEnclosure([1, 2, 3, 4]);
const encOut = (T) => ({ A: T.A, lo: T.lo.n + '/' + T.lo.d, hi: T.hi.n + '/' + T.hi.d });

/* ---- lambda(2) ------------------------------------------------------------ */
const C2 = F.ctx(['a', 'b'], {});
const lam2closure = EN.anchoredClosure({
  C: C2, members: ['a', 'b'],
  Se: { order: C2.member.b, xi: D.XI_PI }, So: { order: C2.member.a, xi: D.XI_PI },
  tailMember: 'b', target: { lo: q(-9, 8), hi: q(-9, 8) }
});
const lam2finite = EN.finitePart({ C: C2, tailMember: 'b', N0: lam2closure.N0, target: { lo: q(-9, 8), hi: q(-9, 8) }, skip: [[1, 2]] });

/* ---- lambda(3): M0 + the three families ----------------------------------- */
const C3g = F.ctx(['a', 'b', 'c'], {});
const m0 = EN.dotTheorem({
  C: C3g, S: { order: C3g.member.c, xi: D.XI_PI },
  W: [{ atom: { kind: 'omc', form: C3g.member.a }, coeff: q(1) },
      { atom: { kind: 'omc', form: C3g.member.b }, coeff: q(1) }],
  gConst: q(1, 2), gMembers: ['a', 'b'], anchored: ['c'], target: L3
});
if (!m0.ok) throw new Error('lambda3 M0 failed: ' + m0.why);

/* the three families, in the parametrizations that make them cones:
     c = 2a  with a < b < 2a:   a = s+r, b = 2s+r, c = 2s+2r     (s,r >= 1)
     c = 2b  with a < b:        a, b free prefix, c = 2b
     c = a+b with a < b:        a, b free prefix, c = a+b        */
const FAM3 = [
  { label: 'c = 2a', C: { n: 2, names: ['s', 'r'], member: { a: [1n, 1n], b: [2n, 1n], c: [2n, 2n] }, defs: {} },
    Se: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.b, xi: D.XI_PI }),
    tail: 'a', skip: [] },
  { label: 'c = 2b', C: { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 2n] }, defs: {} },
    Se: (C) => ({ order: C.member.b, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.a, xi: D.XI_PI }),
    tail: 'b', skip: [] },
  { label: 'c = a+b', C: { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n] }, defs: {} },
    Se: (C) => ({ order: C.member.b, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }),
    tail: 'b', skip: [[1, 2, 3]] }
];
const fam3 = FAM3.map((f) => {
  const closure = EN.anchoredClosure({ C: f.C, members: ['a', 'b', 'c'], Se: f.Se(f.C), So: f.So(f.C), tailMember: f.tail, target: L3 });
  const finite = EN.finitePart({ C: f.C, tailMember: f.tail, N0: closure.N0, target: L3, skip: f.skip, tol: 1e-10 });
  if (!finite.ok) throw new Error('lambda3 family ' + f.label + ' finite part undecided: ' + JSON.stringify(finite.undecided));
  return { label: f.label, closure, finite };
});

/* the discovered exceptions must BE the three families, exactly */
{
  const got = new Set(m0.exceptions.map(e => e.key));
  const want = new Set([
    F.normKey(F.sub(F.scale(C3g.member.a, 2), C3g.member.c)),
    F.normKey(F.sub(F.scale(C3g.member.b, 2), C3g.member.c)),
    F.normKey(F.sub(F.add(C3g.member.a, C3g.member.b), C3g.member.c))
  ]);
  if (got.size !== want.size || [...want].some(k => !got.has(k)))
    throw new Error('lambda3: discovered exceptions do not match the three families');
}

/* ---- lambda(4), the generic case ------------------------------------------ */
const C4 = F.ctx(['a', 'b', 'c', 'd'], {});
const gen4 = EN.dotTheorem({
  C: C4, S: { order: C4.member.d, xi: D.XI_PI },
  W: [{ atom: { kind: 'omc', form: C4.member.a }, coeff: q(1) },
      { atom: { kind: 'omc', form: C4.member.b }, coeff: q(1) },
      { atom: { kind: 'omcsq', form: C4.member.c }, coeff: q(2) }],
  gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4
});
if (!gen4.ok) throw new Error('lambda4 generic failed: ' + gen4.why);
if (gen4.exceptions.length !== 14) throw new Error('lambda4 generic: expected 14 exceptions, got ' + gen4.exceptions.length);
if (gen4.exceptions.some(e => !e.inhabited)) throw new Error('lambda4 generic: an uninhabited exception');

/* the extremizer must ESCAPE the generic argument (else it would prove a
   false statement); its active conditions and their delta sum are recorded */
const extremizerActive = gen4.exceptions.filter(e => {
  const v = { a: 1, b: 2, c: 3, d: 4 };
  /* evaluate cond over x = member differences: x1=a, x2=b-a, x3=c-b, x4=d-c */
  const x = [v.a, v.b - v.a, v.c - v.b, v.d - v.c];
  return e.cond.reduce((s, cf, i) => s + Number(cf) * x[i], 0) === 0;
});
const Q = require(path.join(ROOT, 'instruments/interval/rational.js'));
const parseQ = (s) => { const m = s.split('/'); return Q.R(BigInt(m[0]), BigInt(m[1] || 1)); };
const extremizerDeltaSum = extremizerActive.reduce((s, e) => Q.add(s, parseQ(e.delta)), q(0));
if (!(extremizerActive.length > 0)) throw new Error('lambda4: the extremizer activates no condition — impossible');
if (Q.sign(extremizerDeltaSum) <= 0)
  throw new Error('lambda4: the generic argument closes the extremizer — it would be proving a false statement');
const extremizerDeltaQ = Q.toString(extremizerDeltaSum);

/* the Phase-1 worklist: the families whose delta is positive */
const worklist = gen4.exceptions.filter(e => e.deltaSign > 0).map(e => ({ family: e.label, delta: e.delta, example: e.example }));
const closedFree = gen4.exceptions.filter(e => e.deltaSign < 0).map(e => ({ family: e.label, delta: e.delta }));
if (worklist.length + closedFree.length !== 14) throw new Error('lambda4: a zero-delta exception appeared — look at it');

/* ---- Phase 1, family d = 2c: CLOSED --------------------------------------- */
/* Second-level Section-5 move on the family's own context: anchor S on order
   c at 2pi/3 (cos c = cos 2c = -1/2 exactly), weight 2(1-cos a)^2 +
   2(1-cos b)^2 over the two free members. Base -2/5; the four positive-delta
   sub-conditions each get a 2-dof cone, an anchored closure with a DERIVED
   threshold, and a finite part decided by the certified instrument. S1's two
   parameters are independently unbounded, so it takes a UNION of two
   closures (tail a >= 19, tail c >= 19) and a two-tail box remainder. */
const CF = F.ctx(['a', 'b', 'c'], { d: { c: 2 } });
const famD2C = (() => {
  const dot = EN.dotTheorem({
    C: CF, S: { order: CF.member.c, xi: D.XI_2PI3 },
    W: [{ atom: { kind: 'omcsq', form: CF.member.a }, coeff: q(2) },
        { atom: { kind: 'omcsq', form: CF.member.b }, coeff: q(2) }],
    gConst: q(3, 5), gMembers: ['a', 'b'], anchored: ['c', 'd'], target: L4, witnessBox: 20
  });
  if (!dot.ok) throw new Error('family d=2c: dot theorem failed: ' + dot.why);
  const positives = dot.exceptions.filter(e => e.deltaSign > 0);
  if (positives.length !== 4) throw new Error('family d=2c: expected 4 positive sub-conditions, got ' + positives.length);

  const SUBS = [
    { label: 'b = 2a', C: { n: 2, names: ['a', 'e'], member: { a: [1n, 0n], b: [2n, 0n], c: [2n, 1n], d: [4n, 2n] }, defs: {} },
      closures: [
        { Se: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.c, xi: D.XI_2PI3 }), tail: 'a' },
        { Se: (C) => ({ order: C.member.c, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }), tail: 'c' }
      ] },
    { label: 'c = 2a', C: { n: 2, names: ['s', 'r'], member: { a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [4n, 4n] }, defs: {} },
      closures: [{ Se: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.b, xi: D.XI_PI }), tail: 'a' }] },
    { label: 'c = 2b', C: { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 2n], d: [4n, 4n] }, defs: {} },
      closures: [{ Se: (C) => ({ order: C.member.b, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.a, xi: D.XI_PI }), tail: 'b' }] },
    { label: 'c = a+b', C: { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [4n, 2n] }, defs: {} },
      closures: [{ Se: (C) => ({ order: C.member.b, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }), tail: 'b' }] }
  ];
  const subfamilies = SUBS.map((s) => {
    const closures = s.closures.map((cl) =>
      EN.anchoredClosure({ C: s.C, members: ['a', 'b', 'c', 'd'], Se: cl.Se(s.C), So: cl.So(s.C), tailMember: cl.tail, target: L4 }));
    const bounds = closures.map((cl) => ({ tailMember: cl.tailMember, N0: cl.N0 }));
    const finite = EN.finitePart({ C: s.C, bounds, target: L4, skip: [], tol: 1e-10 });
    if (!finite.ok) throw new Error('family d=2c, subfamily ' + s.label + ': finite part undecided');
    return { label: s.label, closures, finite };
  });

  /* coverage: every family point activating a positive condition, with all
     members <= 40, is produced by its subfamily cone — checked point by point.
     The engine's labels for the four conditions are matched EXACTLY: an
     unrecognized positive condition refuses, it does not slip through. */
  const CONDS = {
    '2a = b': { sub: 0, holds: (a, b, c) => b === 2 * a },
    '2a = c': { sub: 1, holds: (a, b, c) => c === 2 * a },
    '2b = c': { sub: 2, holds: (a, b, c) => c === 2 * b },
    'a+b = c': { sub: 3, holds: (a, b, c) => c === a + b }
  };
  const coverage = positives.map((p) => {
    const m = CONDS[p.label];
    if (!m) throw new Error('family d=2c: positive condition "' + p.label + '" has no registered subfamily');
    const sub = SUBS[m.sub];
    const raw = new Set();
    for (let a = 1; a <= 20; a++) for (let b = a + 1; b <= 40; b++) for (let c = b + 1; c <= 40; c++)
      if (m.holds(a, b, c)) raw.add([a, b, c, 2 * c].join(','));
    const covered = new Set();
    for (let x1 = 1; x1 <= 60; x1++) for (let x2 = 1; x2 <= 60; x2++) {
      const v = (f) => Number(f[0]) * x1 + Number(f[1]) * x2;
      covered.add([v(sub.C.member.a), v(sub.C.member.b), v(sub.C.member.c), v(sub.C.member.d)].join(','));
    }
    const missing = [...raw].filter(k => !covered.has(k));
    if (missing.length) throw new Error('family d=2c: subfamily ' + sub.label + ' cone misses ' + missing[0]);
    return { condition: p.label, subfamily: sub.label, pointsChecked: raw.size };
  });

  return {
    family: 'd = 2c', status: 'CLOSED',
    dot: { base: dot.base, posBase: dot.posBase, dip: dot.dip,
      exceptions: dot.exceptions.map(e => ({ label: e.label, delta: e.delta, example: e.example })) },
    subfamilies, coverage
  };
})();

/* ---- Phase 1, the general family driver ----------------------------------- */
/* closeFamily(spec): one dot theorem on the family's own cone, positive
   sub-conditions matched against a REGISTRY by exact condition vector (an
   unregistered positive refuses), each subfamily closed by anchored closures
   with derived thresholds and a decided finite part, and two point-by-point
   checks: the family cone is ONTO the family (raw enumeration vs cone box),
   and each positive condition's points are covered by its subfamily cone. */
function memberTuples(C, xbox) {
  const out = new Set();
  const names = ['a', 'b', 'c', 'd'];
  const x = new Array(C.n).fill(1);
  const rec = (i) => {
    if (i === C.n) {
      out.add(names.map(nm => C.member[nm].reduce((s, cf, j) => s + Number(cf) * x[j], 0)).join(','));
      return;
    }
    for (let v = 1; v <= xbox; v++) { x[i] = v; rec(i + 1); }
    x[i] = 1;
  };
  rec(0);
  return out;
}
function closeFamily(spec) {
  const dot = EN.dotTheorem(spec.dot);
  if (!dot.ok) throw new Error('family ' + spec.label + ': dot theorem failed: ' + dot.why);
  const positives = dot.exceptions.filter(e => e.deltaSign > 0);
  const reg = spec.conds || {};
  for (const p of positives) if (reg[p.key] === undefined)
    throw new Error('family ' + spec.label + ': unregistered positive condition ' + p.label + ' [' + p.key + ']');
  if (Object.keys(reg).length !== positives.length)
    throw new Error('family ' + spec.label + ': registry size != positive count');

  const subfamilies = (spec.subs || []).map((s) => {
    const closures = s.closures.map((cl) =>
      EN.anchoredClosure({ C: s.C, members: ['a', 'b', 'c', 'd'], Se: cl.Se, So: cl.So,
        tailMember: cl.tail || null, target: L4, capN: 400 }));
    const bounds = s.bounds(closures);
    const finite = EN.finitePart({ C: s.C, bounds, target: L4, skip: s.skip || [], tol: 1e-10 });
    if (!finite.ok) throw new Error('family ' + spec.label + ', subfamily ' + s.label + ': finite part undecided');
    return { label: s.label, closures, finite };
  });

  /* onto: every raw family point with members <= box comes out of the cone */
  const box = spec.box || 24;
  const famCone = memberTuples(spec.dot.C, spec.xbox || 30);
  const rawAll = [];
  for (let a = 1; a <= box; a++) for (let b = a + 1; b <= box; b++) for (let c = b + 1; c <= box; c++) {
    const d = spec.dOf(a, b, c);
    if (d === null || d <= c || d > 2 * box + box) continue;
    rawAll.push([a, b, c, d]);
    if (!famCone.has([a, b, c, d].join(',')))
      throw new Error('family ' + spec.label + ': cone misses family point ' + [a, b, c, d]);
  }
  /* coverage: each positive condition's points land in the UNION of its
     subfamily cones (a condition may triangulate into several) */
  const coverage = positives.map((p) => {
    const m = reg[p.key];
    const subIdx = Array.isArray(m.sub) ? m.sub : [m.sub];
    const subs = subIdx.map(i => spec.subs[i]);
    const union = new Set();
    for (const s of subs) for (const k of memberTuples(s.C, spec.xbox || 30)) union.add(k);
    let n = 0;
    for (const pt of rawAll) if (m.holds(pt[0], pt[1], pt[2], pt[3])) {
      n++;
      if (!union.has(pt.join(',')))
        throw new Error('family ' + spec.label + ': cones {' + subs.map(s => s.label) + '} miss ' + pt);
    }
    if (!n) throw new Error('family ' + spec.label + ': condition ' + p.label + ' matched no point in the box');
    return { condition: p.label, subfamilies: subs.map(s => s.label), pointsChecked: n };
  });

  return {
    family: spec.label, status: 'CLOSED',
    dot: { base: dot.base, posBase: dot.posBase, dip: dot.dip,
      exceptions: dot.exceptions.map(e => ({ label: e.label, delta: e.delta, example: e.example })) },
    subfamilies, coverage, ontoChecked: rawAll.length
  };
}

/* ---- the five families closed by the driver -------------------------------- */
const nk = F.normKey;
const FAMILIES = (() => {
  const out = {};

  /* d = 2a — every exception is negative: closed generically, no subfamilies */
  const C2a = { n: 3, names: ['r', 'u2', 'u3'], member: { a: [1n, 1n, 1n], b: [1n, 2n, 1n], c: [1n, 2n, 2n], d: [2n, 2n, 2n] }, defs: {} };
  out['d = 2a'] = closeFamily({
    label: 'd = 2a', dOf: (a, b, c) => (c < 2 * a && 2 * a > c ? 2 * a : null),
    dot: { C: C2a, S: { order: C2a.member.a, xi: D.XI_2PI3 },
      W: [{ atom: { kind: 'omcsq', form: C2a.member.b }, coeff: q(2) },
          { atom: { kind: 'omcsq', form: C2a.member.c }, coeff: q(2) }],
      gConst: q(3, 5), gMembers: ['b', 'c'], anchored: ['a', 'd'], target: L4, witnessBox: 16 },
    conds: {}, subs: []
  });

  /* d = b+c — one exception, negative: closed generically */
  const Cbc = F.ctx(['a', 'b', 'c'], { d: { b: 1, c: 1 } });
  out['d = b+c'] = closeFamily({
    label: 'd = b+c', dOf: (a, b, c) => b + c,
    dot: { C: Cbc, S: { order: Cbc.member.d, xi: D.XI_PI },
      W: [{ atom: { kind: 'omcsq', form: Cbc.member.a }, coeff: q(2) }],
      gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4, witnessBox: 16 },
    conds: {}, subs: []
  });

  /* d = a+b — one positive: the doubly-constrained E = {d=a+b, 2d=3c},
     closed on the half-frequency set S(gamma, pi/2) with the pi/2 lemma */
  const Cab = { n: 3, names: ['r', 'u2', 'u3'], member: { a: [1n, 0n, 1n], b: [1n, 1n, 1n], c: [1n, 1n, 2n], d: [2n, 1n, 2n] }, defs: {} };
  out['d = a+b'] = closeFamily({
    label: 'd = a+b', dOf: (a, b, c) => (a + b > c ? a + b : null),
    dot: { C: Cab, S: { order: Cab.member.d, xi: D.XI_PI },
      W: [{ atom: { kind: 'omcsq', form: Cab.member.c }, coeff: q(2) }],
      gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4, witnessBox: 16 },
    conds: { [nk([-1n, 1n, 2n])]: { sub: 0, holds: (a, b, c, d) => 2 * d === 3 * c } },
    subs: [{ label: 'E: 2d = 3c', C: { n: 2, names: ['p', 'q'], member: { a: [3n, 1n], b: [3n, 2n], c: [4n, 2n], d: [6n, 3n] }, defs: {} },
      closures: [{ Se: { order: [2n, 1n], xi: D.XI_PI2 }, So: { order: [1n, 0n], xi: D.XI_PI2 } }],
      bounds: (cls) => [{ form: [2n, 1n], N0: cls[0].N0 }], skip: [] }]
  });

  /* d = a+c — the first equality family: the AP subfamily {b-t, b, b+t, 2b}
     carries the extremizer and closes by the reflection estimate (companion
     anchor xi = 0); the 3b = 2d subfamily closes on S(beta, pi/2) */
  const Cac = F.ctx(['a', 'b', 'c'], { d: { a: 1, c: 1 } });
  out['d = a+c'] = closeFamily({
    label: 'd = a+c', dOf: (a, b, c) => a + c,
    dot: { C: Cac, S: { order: Cac.member.d, xi: D.XI_PI },
      W: [{ atom: { kind: 'omcsq', form: Cac.member.b }, coeff: q(2) }],
      gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4, witnessBox: 16 },
    conds: {
      [nk(F.combo(Cac, { b: 2, a: -1, c: -1 }))]: { sub: 0, holds: (a, b, c, d) => 2 * b === a + c },
      [nk(F.combo(Cac, { b: 3, a: -2, c: -2 }))]: { sub: 1, holds: (a, b, c, d) => 3 * b === 2 * (a + c) }
    },
    subs: [
      { label: 'AP: 2b = a+c', C: { n: 2, names: ['t', 's'], member: { a: [0n, 1n], b: [1n, 1n], c: [2n, 1n], d: [2n, 2n] }, defs: {} },
        closures: [{ Se: { order: [1n, 1n], xi: D.XI_PI }, So: { order: [1n, 0n], xi: D.XI_ZERO }, tail: 'b' }],
        bounds: (cls) => [{ tailMember: 'b', N0: cls[0].N0 }], skip: [[1, 2, 3, 4]] },
      { label: '3b = 2d', C: { n: 2, names: ['a', 'm'], member: { a: [1n, 0n], b: [2n, 2n], c: [2n, 3n], d: [3n, 3n] }, defs: {} },
        closures: [{ Se: { order: [1n, 1n], xi: D.XI_PI2 }, So: { order: [1n, 0n], xi: D.XI_PI2 } }],
        bounds: (cls) => [{ form: [1n, 1n], N0: cls[0].N0 }], skip: [] }
    ]
  });

  /* 2d = 2c+a (a = 2t) — four positive conditions, six cones. The condition
     vectors were read off the engine, not hand-translated: an earlier hand
     translation was WRONG and the coverage gate caught it (the registry
     refused an unregistered key). P3 (c = 2a) triangulates on b vs 3a: two
     cones and the single scale-orbit {2,3,4,5}. */
  const Cca = { n: 3, names: ['t', 'u2', 'u3'], member: { a: [2n, 0n, 0n], b: [2n, 1n, 0n], c: [2n, 1n, 1n], d: [3n, 1n, 1n] }, defs: {} };
  out['2d = 2c+a'] = closeFamily({
    label: '2d = 2c+a', dOf: (a, b, c) => (a % 2 === 0 ? c + a / 2 : null),
    dot: { C: Cca, S: { order: Cca.member.d, xi: D.XI_PI },
      W: [{ atom: { kind: 'omcsq', form: Cca.member.a }, coeff: q(2) }],
      gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4, witnessBox: 20 },
    conds: {
      [nk([1n, -1n, -1n])]: { sub: 0, holds: (a, b, c, d) => 2 * c === 3 * a },
      [nk([2n, -1n, 0n])]: { sub: 1, holds: (a, b, c, d) => b === 2 * a },
      [nk([2n, -1n, -1n])]: { sub: [2, 3, 4], holds: (a, b, c, d) => c === 2 * a },
      [nk([1n, 0n, -1n])]: { sub: 5, holds: (a, b, c, d) => 2 * c === 2 * b + a }
    },
    subs: [
      /* P1: 2c = 3a -> {2al, b, 3al, 4al}, 2al < b < 3al; al = s+r, b = 2al+s */
      { label: '2c = 3a', C: { n: 2, names: ['s', 'r'], member: { a: [2n, 2n], b: [3n, 2n], c: [3n, 3n], d: [4n, 4n] }, defs: {} },
        closures: [{ Se: { order: [1n, 1n], xi: D.XI_PI3 }, So: { order: [1n, 0n], xi: D.XI_2PI3 } }],
        bounds: (cls) => [{ form: [1n, 1n], N0: cls[0].N0 }], skip: [] },
      /* P2: b = 2a -> {2al, 4al, c, c+al}, c > 4al; two-closure union on (al, c) */
      { label: 'b = 2a', C: { n: 2, names: ['al', 'w'], member: { a: [2n, 0n], b: [4n, 0n], c: [4n, 1n], d: [5n, 1n] }, defs: {} },
        closures: [
          { Se: { order: [1n, 0n], xi: D.XI_2PI3 }, So: { order: [4n, 1n], xi: D.XI_2PI3 } },
          { Se: { order: [4n, 1n], xi: D.XI_2PI3 }, So: { order: [1n, 0n], xi: D.XI_2PI3 }, tail: 'c' }],
        bounds: (cls) => [{ form: [1n, 0n], N0: cls[0].N0 }, { tailMember: 'c', N0: cls[1].N0 }], skip: [] },
      /* P3: c = 2a -> {2al, b, 4al, 5al}, 2al < b < 4al, split on b vs 3al */
      { label: 'c = 2a, b < 3a/2·2', C: { n: 2, names: ['s', 'r'], member: { a: [2n, 2n], b: [3n, 2n], c: [4n, 4n], d: [5n, 5n] }, defs: {} },
        closures: [{ Se: { order: [1n, 1n], xi: D.XI_2PI3 }, So: { order: [1n, 0n], xi: D.XI_4PI3 } }],
        bounds: (cls) => [{ form: [1n, 1n], N0: cls[0].N0 }], skip: [] },
      { label: 'c = 2a, b = 3al', C: { n: 1, names: ['g'], member: { a: [2n], b: [3n], c: [4n], d: [5n] }, defs: {} },
        closures: [], bounds: () => [{ form: [1n], N0: 2 }], skip: [] },
      { label: 'c = 2a, b > 3al', C: { n: 2, names: ['e', 'f'], member: { a: [2n, 2n], b: [4n, 3n], c: [4n, 4n], d: [5n, 5n] }, defs: {} },
        closures: [{ Se: { order: [1n, 1n], xi: D.XI_2PI3 }, So: { order: [1n, 0n], xi: D.XI_2PI3 } }],
        bounds: (cls) => [{ form: [1n, 1n], N0: cls[0].N0 }], skip: [] },
      /* P4: 2c = 2b+a -> {2al, b, b+al, b+2al}, b > 2al; union on (al, b) */
      { label: '2c = 2b+a', C: { n: 2, names: ['al', 's'], member: { a: [2n, 0n], b: [2n, 1n], c: [3n, 1n], d: [4n, 1n] }, defs: {} },
        closures: [
          { Se: { order: [1n, 0n], xi: D.XI_PI2 }, So: { order: [2n, 1n], xi: D.XI_PI2 } },
          { Se: { order: [2n, 1n], xi: D.XI_PI2 }, So: { order: [1n, 0n], xi: D.XI_PI2 }, tail: 'b' }],
        bounds: (cls) => [{ form: [1n, 0n], N0: cls[0].N0 }, { tailMember: 'b', N0: cls[1].N0 }], skip: [] }
    ]
  });

  /* d = 2b — the second equality family. The region a < b < c < 2b is not a
     chain (a and c-b are incomparable), so it triangulates on a vs c-b:
       D1 (a < c-b) and D3 (a > c-b): second-level dot theorems, whose ten
       positive conditions consolidate to SIX subfamilies (several shapes
       recur across the cones, one is the AP family already met in d = a+c);
       D2 (a = c-b, i.e. c = a+b): closed directly by an anchored closure,
       with the extremizer {1,2,3,4} skipped as the definitional witness.
     Every condition key below was read off the engine, never hand-derived. */
  out['d = 2b'] = (() => {
    const D1 = { n: 3, names: ['a', 'e', 'r'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n] }, defs: {} };
    const D3 = { n: 3, names: ['u3', 'e', 'w'], member: { a: [1n, 1n, 0n], b: [1n, 1n, 1n], c: [2n, 1n, 1n], d: [2n, 2n, 2n] }, defs: {} };
    const D2 = { n: 2, names: ['a', 'r'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [2n, 2n] }, defs: {} };
    const W2 = (C) => [{ atom: { kind: 'omcsq', form: C.member.a }, coeff: q(2) },
                       { atom: { kind: 'omcsq', form: C.member.c }, coeff: q(2) }];
    const dots = [D1, D3].map((C, i) => {
      const r = EN.dotTheorem({ C, S: { order: C.member.b, xi: D.XI_2PI3 }, W: W2(C),
        gConst: q(3, 5), gMembers: ['a', 'c'], anchored: ['b', 'd'], target: L4, witnessBox: 16 });
      if (!r.ok) throw new Error('d=2b cone ' + (i ? 'D3' : 'D1') + ' dot failed: ' + r.why);
      return r;
    });

    /* the six subfamilies (U1..U6), each with its own cone(s) and closure */
    const SUBS = [
      { label: 'U1: b = 2a', holds: (a, b, c, d) => b === 2 * a,
        cones: [
          { n: 2, names: ['j', 'k'], member: { a: [1n, 1n], b: [2n, 2n], c: [3n, 2n], d: [4n, 4n] }, defs: {} },
          { n: 2, names: ['l', 'm'], member: { a: [1n, 1n], b: [2n, 2n], c: [4n, 3n], d: [4n, 4n] }, defs: {} },
          { n: 1, names: ['g'], member: { a: [1n], b: [2n], c: [3n], d: [4n] }, defs: {} }],
        close: (C) => C.n === 1
          ? { bounds: [{ form: [1n], N0: 2 }], skip: [[1, 2, 3, 4]] }
          : { closures: [{ Se: { order: [1n, 1n], xi: D.XI_2PI3 }, So: { order: C.member.c, xi: D.XI_2PI3 } }],
              bounds: (cls) => [{ form: [1n, 1n], N0: cls[0].N0 }], skip: [] } },
      { label: 'U2: c = 2b-a (AP)', holds: (a, b, c, d) => c === 2 * b - a,
        cones: [{ n: 2, names: ['t', 's'], member: { a: [0n, 1n], b: [1n, 1n], c: [2n, 1n], d: [2n, 2n] }, defs: {} }],
        close: () => ({ closures: [{ Se: { order: [1n, 1n], xi: D.XI_PI }, So: { order: [1n, 0n], xi: D.XI_ZERO }, tail: 'b' }],
          bounds: (cls) => [{ tailMember: 'b', N0: cls[0].N0 }], skip: [[1, 2, 3, 4]] }) },
      { label: 'U3: c = 3b-2a', holds: (a, b, c, d) => c === 3 * b - 2 * a,
        cones: [{ n: 2, names: ['s', 'r'], member: { a: [1n, 1n], b: [2n, 1n], c: [4n, 1n], d: [4n, 2n] }, defs: {} }],
        close: (C) => ({ closures: [{ Se: { order: C.member.b, xi: D.XI_2PI3 }, So: { order: [1n, 1n], xi: D.XI_2PI3 }, tail: 'b' }],
          bounds: (cls) => [{ tailMember: 'b', N0: cls[0].N0 }], skip: [] }) },
      { label: 'U4: 2c = 3b+a', holds: (a, b, c, d) => 2 * c === 3 * b + a,
        cones: [{ n: 2, names: ['a', 't'], member: { a: [1n, 0n], b: [1n, 2n], c: [2n, 3n], d: [2n, 4n] }, defs: {} }],
        close: (C) => ({ closures: [{ Se: { order: C.member.b, xi: D.XI_2PI3 }, So: { order: [0n, 1n], xi: D.XI_2PI3 }, tail: 'b' }],
          bounds: (cls) => [{ tailMember: 'b', N0: cls[0].N0 }], skip: [] }) },
      { label: 'U5: 2c = 3b-a', holds: (a, b, c, d) => 2 * c === 3 * b - a,
        cones: [{ n: 2, names: ['a', 't'], member: { a: [1n, 0n], b: [1n, 2n], c: [1n, 3n], d: [2n, 4n] }, defs: {} }],
        close: () => ({ closures: [
            { Se: { order: [0n, 1n], xi: D.XI_2PI3 }, So: { order: [1n, 0n], xi: D.XI_4PI3 } },
            { Se: { order: [1n, 0n], xi: D.XI_2PI3 }, So: { order: [0n, 1n], xi: D.XI_ZERO } }],
          bounds: (cls) => [{ form: [0n, 1n], N0: cls[0].N0 }, { form: [1n, 0n], N0: cls[1].N0 }], skip: [] }) },
      { label: 'U6: c = 2a', holds: (a, b, c, d) => c === 2 * a,
        cones: [{ n: 2, names: ['s', 'r'], member: { a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [4n, 2n] }, defs: {} }],
        close: () => ({ closures: [{ Se: { order: [1n, 1n], xi: D.XI_2PI3 }, So: { order: [2n, 1n], xi: D.XI_2PI3 } }],
          bounds: (cls) => [{ form: [1n, 1n], N0: cls[0].N0 }], skip: [] }) }
    ];
    const REG = {                                     /* cond key -> U-index, per cone */
      D1: { '1,-1,-1': 0, '1,0,-1': 1, '1,-1,-2': 2, '0,1,-1': 3, '2,1,-1': 4 },
      D3: { '1,1,-1': 0, '1,0,-1': 1, '1,0,-2': 2, '2,0,-1': 4, '0,1,-1': 5 }
    };
    [['D1', dots[0]], ['D3', dots[1]]].forEach(([cn, dot]) => {
      const reg = REG[cn];
      const pos = dot.exceptions.filter(e => e.deltaSign > 0);
      for (const p of pos) if (reg[p.key] === undefined)
        throw new Error('d=2b cone ' + cn + ': unregistered positive condition [' + p.key + ']');
      if (pos.length !== Object.keys(reg).length)
        throw new Error('d=2b cone ' + cn + ': positive count moved');
    });

    /* close every subfamily cone */
    const subfamilies = SUBS.map((s) => {
      const parts = s.cones.map((C) => {
        const spec = s.close(C);
        const closures = (spec.closures || []).map((cl) =>
          EN.anchoredClosure({ C, members: ['a', 'b', 'c', 'd'], Se: cl.Se, So: cl.So, tailMember: cl.tail || null, target: L4, capN: 400 }));
        const bounds = typeof spec.bounds === 'function' ? spec.bounds(closures) : spec.bounds;
        const finite = EN.finitePart({ C, bounds, target: L4, skip: spec.skip || [], tol: 1e-10 });
        if (!finite.ok) throw new Error('d=2b subfamily ' + s.label + ': finite part undecided');
        return { closures, finite };
      });
      return { label: s.label, parts };
    });

    /* D2 (c = a+b): anchored closure + finite with the extremizer skipped */
    const d2cl = EN.anchoredClosure({ C: D2, members: ['a', 'b', 'c', 'd'],
      Se: { order: D2.member.b, xi: D.XI_2PI3 }, So: { order: D2.member.a, xi: D.XI_2PI3 }, tailMember: 'b', target: L4 });
    const d2fin = EN.finitePart({ C: D2, tailMember: 'b', N0: d2cl.N0, target: L4, skip: [[1, 2, 3, 4]], tol: 1e-10 });
    if (!d2fin.ok) throw new Error('d=2b cone D2: finite part undecided');

    /* onto + coverage, point by point over the box */
    const cones = { D1: memberTuples(D1, 30), D2: memberTuples(D2, 30), D3: memberTuples(D3, 30) };
    const subCones = SUBS.map(s => {
      const u = new Set(); for (const C of s.cones) for (const k of memberTuples(C, 40)) u.add(k); return u;
    });
    let ontoN = 0;
    const covCount = SUBS.map(() => 0);
    for (let a = 1; a <= 24; a++) for (let b = a + 1; b <= 24; b++) for (let c = b + 1; c < 2 * b; c++) {
      const pt = [a, b, c, 2 * b], k = pt.join(',');
      ontoN++;
      const inD = (a < c - b && cones.D1.has(k)) || (a === c - b && cones.D2.has(k)) || (a > c - b && cones.D3.has(k));
      if (!inD) throw new Error('d=2b: triangulation misses ' + k);
      SUBS.forEach((s, i) => { if (s.holds(a, b, c, 2 * b)) { covCount[i]++; if (!subCones[i].has(k)) throw new Error('d=2b: ' + s.label + ' cone misses ' + k); } });
    }
    for (let i = 0; i < SUBS.length; i++) if (!covCount[i]) throw new Error('d=2b: ' + SUBS[i].label + ' matched no point');

    return {
      family: 'd = 2b', status: 'CLOSED',
      cones: {
        D1: { base: dots[0].base, dip: dots[0].dip, exceptions: dots[0].exceptions.map(e => ({ key: e.key, delta: e.delta })) },
        D2: { closure: d2cl, finite: d2fin },
        D3: { base: dots[1].base, dip: dots[1].dip, exceptions: dots[1].exceptions.map(e => ({ key: e.key, delta: e.delta })) }
      },
      subfamilies, coverage: SUBS.map((s, i) => ({ subfamily: s.label, pointsChecked: covCount[i] })), ontoChecked: ontoN
    };
  })();

  /* 2d = 2c+b — the third equality family (b = 2*beta, d = c+beta; {1,2,3,4}
     satisfies it: 8 = 6+2). Triangulates on a vs beta. Cone ii (a = beta)
     closes by a two-closure anchored union with the extremizer skipped; cones
     i and iii close by dot theorems on S(c, pi) — where cos c = -1 and the
     d = c+beta relation pairs d against the weight. Two of the sub-conditions
     turn out to BE other families of the nine (d = 2a, d = a+b): their sets
     are already closed there, and the record says so instead of re-proving. */
  out['2d = 2c+b'] = (() => {
    const Ci = { n: 3, names: ['a', 'g', 'u3'], member: { a: [1n, 0n, 0n], b: [2n, 2n, 0n], c: [2n, 2n, 1n], d: [3n, 3n, 1n] }, defs: {} };
    const Cii = { n: 2, names: ['be', 'u3'], member: { a: [1n, 0n], b: [2n, 0n], c: [2n, 1n], d: [3n, 1n] }, defs: {} };
    const Ciii = { n: 3, names: ['h', 'k', 'u3'], member: { a: [2n, 1n, 0n], b: [2n, 2n, 0n], c: [2n, 2n, 1n], d: [3n, 3n, 1n] }, defs: {} };
    const dots = [Ci, Ciii].map((C, i) => {
      const r = EN.dotTheorem({ C, S: { order: C.member.c, xi: D.XI_PI },
        W: [{ atom: { kind: 'omcsq', form: C.member.a }, coeff: q(2) }],
        gConst: q(3, 5), gMembers: ['a', 'b', 'd'], anchored: ['c'], target: L4, witnessBox: 16 });
      if (!r.ok) throw new Error('2d=2c+b cone ' + (i ? 'iii' : 'i') + ' dot failed: ' + r.why);
      return r;
    });
    const REG = {
      i: { '1,-1,-1': 'V1', '1,0,-1': 'V2' },
      iii: { '1,-1,-1': 'V3', '2,0,-2': 'V4', '3,1,-1': 'V5', '2,0,-1': 'V6', '2,-1,-2': 'V7', '2,1,-1': 'V2' }
    };
    [['i', dots[0]], ['iii', dots[1]]].forEach(([cn, dot]) => {
      const pos = dot.exceptions.filter(e => e.deltaSign > 0);
      for (const p of pos) if (!REG[cn][p.key])
        throw new Error('2d=2c+b cone ' + cn + ': unregistered positive condition [' + p.key + ']');
      if (pos.length !== Object.keys(REG[cn]).length) throw new Error('2d=2c+b cone ' + cn + ': positive count moved');
    });

    const close = (C, Se, So, tail, skip, boundsOf) => {
      const cl = EN.anchoredClosure({ C, members: ['a', 'b', 'c', 'd'], Se, So, tailMember: tail || null, target: L4, capN: 400 });
      const bounds = boundsOf(cl);
      const finite = EN.finitePart({ C, bounds, target: L4, skip: skip || [], tol: 1e-10 });
      if (!finite.ok) throw new Error('2d=2c+b: a finite part is undecided');
      return { closure: cl, finite };
    };
    const subfamilies = {};
    /* V1: d = b+2a -> {a, 2be, be+2a, 2be+2a}, be/2 < a < be */
    const V1C = { n: 2, names: ['g', 'm'], member: { a: [1n, 1n], b: [4n, 2n], c: [4n, 3n], d: [6n, 4n] }, defs: {} };
    subfamilies.V1 = { label: 'd = b+2a', ...close(V1C, { order: [2n, 1n], xi: D.XI_2PI3 }, { order: [1n, 1n], xi: D.XI_PI }, null, [],
      (cl) => [{ form: [2n, 1n], N0: cl.N0 }]) };
    /* V2: c = a+b -> {a, 2be, 2be+a, 3be+a}, a < 2be; three cones, one closure
       shape; the a = be ray is the extremizer's dilation orbit */
    const V2cones = [
      { n: 2, names: ['a', 'g'], member: { a: [1n, 0n], b: [2n, 2n], c: [3n, 2n], d: [4n, 3n] }, defs: {} },   /* a < be */
      { n: 1, names: ['g'], member: { a: [1n], b: [2n], c: [3n], d: [4n] }, defs: {} },                          /* a = be */
      { n: 2, names: ['h', 'k'], member: { a: [2n, 1n], b: [2n, 2n], c: [4n, 3n], d: [5n, 4n] }, defs: {} }      /* a > be */
    ];
    subfamilies.V2 = { label: 'c = a+b', parts: V2cones.map((C) => C.n === 1
      ? { finite: EN.finitePart({ C, bounds: [{ form: [1n], N0: 2 }], target: L4, skip: [[1, 2, 3, 4]], tol: 1e-10 }) }
      : close(C, { order: C.n === 2 && C.names[0] === 'a' ? [1n, 1n] : [1n, 1n], xi: D.XI_2PI3 }, { order: C.member.a, xi: D.XI_4PI3 }, null, [],
          (cl) => [{ form: [1n, 1n], N0: cl.N0 }])) };
    /* V3, V4: the sets ALSO satisfy d = 2a resp. d = a+b — closed there */
    subfamilies.V3 = { label: 'd = 2a', delegated: 'family d = 2a' };
    subfamilies.V4 = { label: 'd = a+b', delegated: 'family d = a+b' };
    /* V5: d = 2c-2a -> {a, 2c-4a, c, 2c-2a}, 5a/2 < c < 3a */
    const V5C = { n: 2, names: ['m', 'n'], member: { a: [1n, 2n], b: [2n, 2n], c: [3n, 5n], d: [4n, 6n] }, defs: {} };
    subfamilies.V5 = { label: 'd = 2c-2a', ...close(V5C, { order: [2n, 3n], xi: D.XI_PI2 }, { order: [1n, 2n], xi: D.XI_PI }, null, [],
      (cl) => [{ form: [2n, 3n], N0: cl.N0 }]) };
    /* V6: c = 2a -> {a, 2be, 2a, 2a+be}, be < a < 2be */
    const V6C = { n: 2, names: ['h', 'k'], member: { a: [2n, 1n], b: [2n, 2n], c: [4n, 2n], d: [5n, 3n] }, defs: {} };
    subfamilies.V6 = { label: 'c = 2a', ...close(V6C, { order: [2n, 1n], xi: D.XI_2PI3 }, { order: [1n, 1n], xi: D.XI_4PI3 }, null, [],
      (cl) => [{ form: [2n, 1n], N0: cl.N0 }]) };
    /* V7: 2c = 3a (a = 2al, c = 3al) -> {2al, 2be, 3al, 3al+be}, al < be < 3al/2 */
    const V7C = { n: 2, names: ['j', 'm'], member: { a: [4n, 2n], b: [6n, 2n], c: [6n, 3n], d: [9n, 4n] }, defs: {} };
    subfamilies.V7 = { label: '2c = 3a', ...close(V7C, { order: [2n, 1n], xi: D.XI_PI3 }, { order: [3n, 1n], xi: D.XI_PI2 }, null, [],
      (cl) => [{ form: [2n, 1n], N0: cl.N0 }]) };
    /* cone ii (a = be): anchored union + finite, extremizer skipped */
    const ii1 = EN.anchoredClosure({ C: Cii, members: ['a', 'b', 'c', 'd'],
      Se: { order: [1n, 0n], xi: D.XI_2PI3 }, So: { order: Cii.member.c, xi: D.XI_2PI3 }, tailMember: 'a', target: L4 });
    const ii2 = EN.anchoredClosure({ C: Cii, members: ['a', 'b', 'c', 'd'],
      Se: { order: Cii.member.c, xi: D.XI_2PI3 }, So: { order: [1n, 0n], xi: D.XI_2PI3 }, tailMember: 'c', target: L4 });
    const iiFin = EN.finitePart({ C: Cii, bounds: [{ tailMember: 'a', N0: ii1.N0 }, { tailMember: 'c', N0: ii2.N0 }],
      target: L4, skip: [[1, 2, 3, 4]], tol: 1e-10 });
    if (!iiFin.ok) throw new Error('2d=2c+b cone ii: finite part undecided');

    /* onto + coverage over the box */
    const cones = { i: memberTuples(Ci, 30), ii: memberTuples(Cii, 40), iii: memberTuples(Ciii, 30) };
    const HOLDS = {
      V1: (a, b, c, d) => d === b + 2 * a, V2: (a, b, c, d) => c === a + b,
      V3: (a, b, c, d) => d === 2 * a, V4: (a, b, c, d) => d === a + b,
      V5: (a, b, c, d) => d === 2 * c - 2 * a, V6: (a, b, c, d) => c === 2 * a,
      V7: (a, b, c, d) => 2 * c === 3 * a
    };
    const subCones = {
      V1: memberTuples(V1C, 40), V5: memberTuples(V5C, 40), V6: memberTuples(V6C, 40), V7: memberTuples(V7C, 40),
      V2: (() => { const u = new Set(); for (const C of V2cones) for (const k of memberTuples(C, 40)) u.add(k); return u; })()
    };
    /* SCOPING: a condition raised by cone i's dot theorem only obliges its
       subfamily to cover cone-i points (a < be); likewise cone iii. A point
       on the a = be boundary — the extremizer among them — is closed by cone
       ii's own closure, not by any condition. V2 arises in BOTH dot cones
       and its cones cover the whole family, so it stays region-free. */
    const SCOPE = { V1: 'i', V2: 'any', V3: 'iii', V4: 'iii', V5: 'iii', V6: 'iii', V7: 'iii' };
    let ontoN = 0; const covCount = {};
    for (let be = 1; be <= 12; be++) for (let a = 1; a < 2 * be; a++) for (let c = 2 * be + 1; c <= 30; c++) {
      const pt = [a, 2 * be, c, c + be]; if (a >= 2 * be) continue;
      const k = pt.join(','); ontoN++;
      const inD = (a < be && cones.i.has(k)) || (a === be && cones.ii.has(k)) || (a > be && cones.iii.has(k));
      if (!inD) throw new Error('2d=2c+b: triangulation misses ' + k);
      for (const v of Object.keys(HOLDS)) if (HOLDS[v](...pt)) {
        if (SCOPE[v] === 'i' && !(a < be)) continue;
        if (SCOPE[v] === 'iii' && !(a > be)) continue;
        covCount[v] = (covCount[v] || 0) + 1;
        if (v === 'V3') { if (pt[3] !== 2 * pt[0]) throw new Error('V3 delegation wrong at ' + k); continue; }
        if (v === 'V4') { if (pt[3] !== pt[0] + pt[1]) throw new Error('V4 delegation wrong at ' + k); continue; }
        if (!subCones[v].has(k)) throw new Error('2d=2c+b: ' + v + ' cone misses ' + k);
      }
    }
    for (const v of Object.keys(HOLDS)) if (!covCount[v]) throw new Error('2d=2c+b: ' + v + ' matched no point');

    return {
      family: '2d = 2c+b', status: 'CLOSED',
      cones: {
        i: { base: dots[0].base, dip: dots[0].dip, exceptions: dots[0].exceptions.map(e => ({ key: e.key, delta: e.delta })) },
        ii: { closures: [ii1, ii2], finite: iiFin },
        iii: { base: dots[1].base, dip: dots[1].dip, exceptions: dots[1].exceptions.map(e => ({ key: e.key, delta: e.delta })) }
      },
      subfamilies, coverage: Object.keys(HOLDS).map(v => ({ subfamily: v, pointsChecked: covCount[v] })), ontoChecked: ontoN
    };
  })();

  /* 2d = 3c — the last family (c = 2*gam, d = 3*gam; strict: c is even, so
     {1,2,3,4} is not here). On S(gam, pi/3) the anchors give cos c = -1/2,
     cos d = -1 exactly, and the linear weight (1-cos a)+(1-cos b) against
     g = 1/10 + cos a + cos b leaves base -4/5. The region triangulates into
     seven cones (b vs gam, then a vs p = b-gam, then j = a-p vs p); their
     positive conditions consolidate to FOUR subfamily shapes, one delegation
     to the closed family d = a+b, and four singleton rays. Two closures ride
     the new pi/6 anchor, whose rational multiples suffice exactly here.
     NOTE: conditions (2,0,-2) and (1,0,-1) in cone W3c define the SAME
     hyperplane (unequal keys, equal content) — both map to X3, and their
     deltas co-activate additively, which the branch accounting handles. */
  out['2d = 3c'] = (() => {
    const W1 = { n: 3, names: ['a', 'u2', 'u3'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 2n], d: [3n, 3n, 3n] }, defs: {} };
    const W2 = { n: 2, names: ['a', 'u'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 2n], d: [3n, 3n] }, defs: {} };
    const W3a = { n: 3, names: ['a', 'e', 'r'], member: { a: [1n, 0n, 0n], b: [2n, 2n, 1n], c: [2n, 2n, 2n], d: [3n, 3n, 3n] }, defs: {} };
    const W3b = { n: 2, names: ['p', 'r'], member: { a: [1n, 0n], b: [2n, 1n], c: [2n, 2n], d: [3n, 3n] }, defs: {} };
    const W3c = { n: 3, names: ['j', 'k', 'r'], member: { a: [2n, 1n, 0n], b: [2n, 2n, 1n], c: [2n, 2n, 2n], d: [3n, 3n, 3n] }, defs: {} };
    const W3d = { n: 2, names: ['p', 'r'], member: { a: [2n, 0n], b: [2n, 1n], c: [2n, 2n], d: [3n, 3n] }, defs: {} };
    const W3e = { n: 3, names: ['p', 'l', 'm'], member: { a: [2n, 1n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 2n], d: [3n, 3n, 3n] }, defs: {} };
    const GAM = { W1: [1n, 1n, 1n], W2: [1n, 1n], W3a: [1n, 1n, 1n], W3b: [1n, 1n], W3c: [1n, 1n, 1n], W3d: [1n, 1n], W3e: [1n, 1n, 1n] };
    const dotCones = { W1, W3a, W3b, W3c, W3d, W3e };
    const dots = {};
    for (const [cn, C] of Object.entries(dotCones)) {
      const r = EN.dotTheorem({ C, S: { order: GAM[cn], xi: D.XI_PI3 },
        W: [{ atom: { kind: 'omc', form: C.member.a }, coeff: q(1) },
            { atom: { kind: 'omc', form: C.member.b }, coeff: q(1) }],
        gConst: q(1, 10), gMembers: ['a', 'b'], anchored: ['c', 'd'], target: L4, witnessBox: 16 });
      if (!r.ok) throw new Error('2d=3c cone ' + cn + ' dot failed: ' + r.why);
      dots[cn] = r;
    }
    const RAYS = { R1346: [1, 3, 4, 6], R4569: [4, 5, 6, 9], R2469: [2, 4, 6, 9], R67812: [6, 7, 8, 12] };
    const REG = {
      W1: {},
      W3a: { '1,1,-1': 'X1', '1,0,-1': 'X2' },
      W3b: { '1,-1': 'R1346' },
      W3c: { '2,0,-2': 'X3', '1,0,-1': 'X3', '1,-1,-3': 'X4', '1,1,-1': 'X1', '1,0,-2': 'X5', '2,1,-1': 'X2' },
      W3d: { '1,-1': 'X3', '2,-2': 'X3', '1,-2': 'R4569', '2,-1': 'R2469', '1,-3': 'R67812' },
      W3e: { '1,-1,-1': 'X1', '2,0,-2': 'X3', '1,0,-1': 'X3', '1,-1,-3': 'X4', '1,-1,-2': 'X5', '2,0,-1': 'X2' }
    };
    for (const [cn, dot] of Object.entries(dots)) {
      const pos = dot.exceptions.filter(e => e.deltaSign > 0);
      for (const p of pos) if (!REG[cn][p.key])
        throw new Error('2d=3c cone ' + cn + ': unregistered positive condition [' + p.key + ']');
      if (pos.length !== Object.keys(REG[cn]).length) throw new Error('2d=3c cone ' + cn + ': positive count moved');
    }

    const close = (C, Se, So, boundForm, skip) => {
      const cl = EN.anchoredClosure({ C, members: ['a', 'b', 'c', 'd'], Se, So, tailMember: null, target: L4, capN: 400 });
      const finite = EN.finitePart({ C, bounds: [{ form: boundForm, N0: cl.N0 }], target: L4, skip: skip || [], tol: 1e-10 });
      if (!finite.ok) throw new Error('2d=3c: a finite part is undecided');
      return { closure: cl, finite };
    };
    const ray = (A) => {
      const g = A[0];
      const C = { n: 1, names: ['g'], member: { a: [BigInt(A[0])], b: [BigInt(A[1])], c: [BigInt(A[2])], d: [BigInt(A[3])] }, defs: {} };
      const finite = EN.finitePart({ C, bounds: [{ form: [1n], N0: 2 }], target: L4, skip: [], tol: 1e-10 });
      if (!finite.ok || finite.closed !== 1) throw new Error('2d=3c ray ' + A + ' not decided');
      return { finite };
    };

    /* X1: 2b = 3gam -> {a, 3s, 4s, 6s}, a < 3s: three cones + two rays inside */
    const X1cones = [
      { n: 2, names: ['a', 'v'], member: { a: [1n, 0n], b: [3n, 3n], c: [4n, 4n], d: [6n, 6n] }, defs: {} },
      { n: 2, names: ['v', 'w'], member: { a: [2n, 1n], b: [3n, 3n], c: [4n, 4n], d: [6n, 6n] }, defs: {} },
      { n: 2, names: ['w', 'z'], member: { a: [3n, 2n], b: [3n, 3n], c: [4n, 4n], d: [6n, 6n] }, defs: {} }
    ];
    const X1sforms = [[1n, 1n], [1n, 1n], [1n, 1n]];
    const subfamilies = {};
    subfamilies.X1 = { label: '2b = 3gam', parts: X1cones.map((C, i) =>
      close(C, { order: X1sforms[i], xi: D.XI_PI6 }, { order: C.member.a, xi: D.XI_PI }, X1sforms[i], [])) };
    subfamilies.X1.rays = [ray(RAYS.R1346), ray([2, 3, 4, 6])];
    /* X2: a+b = c -> {a, 2gam-a, 2gam, 3gam}, a < gam */
    const X2C = { n: 2, names: ['a', 'm'], member: { a: [1n, 0n], b: [1n, 2n], c: [2n, 2n], d: [3n, 3n] }, defs: {} };
    subfamilies.X2 = { label: 'a+b = c', ...close(X2C, { order: [1n, 1n], xi: D.XI_PI3 }, { order: [1n, 0n], xi: D.XI_4PI3 }, [1n, 1n], []) };
    /* X3: a = gam -> {gam, b, 2gam, 3gam}, gam < b < 2gam */
    const X3C = { n: 2, names: ['p', 'r'], member: { a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [3n, 3n] }, defs: {} };
    subfamilies.X3 = { label: 'a = gam', ...close(X3C, { order: [1n, 1n], xi: D.XI_PI2 }, { order: [2n, 1n], xi: D.XI_PI }, [1n, 1n], []) };
    /* X4: 4a = 3c -> {3t, b, 4t, 6t}, 3t < b < 4t */
    const X4C = { n: 2, names: ['t', 'u'], member: { a: [3n, 3n], b: [4n, 3n], c: [4n, 4n], d: [6n, 6n] }, defs: {} };
    subfamilies.X4 = { label: '4a = 3c', ...close(X4C, { order: [1n, 1n], xi: D.XI_PI6 }, { order: [4n, 3n], xi: D.XI_PI }, [1n, 1n], []) };
    subfamilies.X5 = { label: 'a+b = d', delegated: 'family d = a+b' };
    for (const [k, A] of Object.entries(RAYS)) subfamilies[k] = { label: '{' + A + '} ray', ...ray(A) };
    /* W2 (b = gam): anchored closure + finite */
    const w2 = close(W2, { order: [1n, 1n], xi: D.XI_PI2 }, { order: [1n, 0n], xi: D.XI_PI }, [1n, 1n], []);

    /* onto + coverage over the box */
    const cones = {};
    for (const [cn, C] of Object.entries({ W1, W2, W3a, W3b, W3c, W3d, W3e })) cones[cn] = memberTuples(C, 30);
    const subConesX = {
      X1: (() => { const u = new Set(); for (const C of X1cones) for (const k of memberTuples(C, 40)) u.add(k);
        for (const A of [RAYS.R1346, [2, 3, 4, 6]]) u.add(A.join(',')); return u; })(),
      X2: memberTuples(X2C, 40), X3: memberTuples(X3C, 40), X4: memberTuples(X4C, 40)
    };
    const HOLDS = {
      X1: (a, b, c, d) => 2 * b === 3 * (c / 2), X2: (a, b, c, d) => a + b === c,
      X3: (a, b, c, d) => 2 * a === c, X4: (a, b, c, d) => 4 * a === 3 * c,
      X5: (a, b, c, d) => a + b === d,
      R1346: (a, b, c, d) => [a, b, c, d].join(',') === '1,3,4,6',
      R4569: (a, b, c, d) => [a, b, c, d].join(',') === '4,5,6,9',
      R2469: (a, b, c, d) => [a, b, c, d].join(',') === '2,4,6,9',
      R67812: (a, b, c, d) => [a, b, c, d].join(',') === '6,7,8,12'
    };
    let ontoN = 0; const covCount = {};
    const g2 = (x, y) => y ? g2(y, x % y) : x;
    for (let gam = 2; gam <= 12; gam++) for (let a = 1; a < 2 * gam; a++) for (let b = a + 1; b < 2 * gam; b++) {
      const pt = [a, b, 2 * gam, 3 * gam], k = pt.join(',');
      if (pt.reduce((s, v) => g2(s, v)) !== 1) continue;          /* the theorem's domain is N'_4 */
      ontoN++;
      const p = b - gam;
      const inD = (b < gam && cones.W1.has(k)) || (b === gam && cones.W2.has(k))
        || (b > gam && a < p && cones.W3a.has(k)) || (b > gam && a === p && cones.W3b.has(k))
        || (b > gam && a > p && a - p < p && cones.W3c.has(k)) || (b > gam && a - p === p && cones.W3d.has(k))
        || (b > gam && a - p > p && cones.W3e.has(k));
      if (!inD) throw new Error('2d=3c: triangulation misses ' + k);
      for (const v of Object.keys(HOLDS)) if (HOLDS[v](...pt)) {
        covCount[v] = (covCount[v] || 0) + 1;
        if (v === 'X5') { if (pt[0] + pt[1] !== pt[3]) throw new Error('X5 delegation wrong'); continue; }
        if (v.startsWith('R')) continue;               /* rays are decided directly */
        if (!subConesX[v].has(k)) throw new Error('2d=3c: ' + v + ' cone misses ' + k);
      }
    }
    for (const v of ['X1', 'X2', 'X3', 'X4', 'X5']) if (!covCount[v]) throw new Error('2d=3c: ' + v + ' matched no point');

    return {
      family: '2d = 3c', status: 'CLOSED',
      cones: Object.fromEntries(Object.entries(dots).map(([cn, r]) =>
        [cn, { base: r.base, dip: r.dip, exceptions: r.exceptions.map(e => ({ key: e.key, delta: e.delta })) }])
        .concat([['W2', { closure: w2.closure, finite: w2.finite }]])),
      subfamilies, coverage: Object.keys(covCount).map(v => ({ subfamily: v, pointsChecked: covCount[v] })), ontoChecked: ontoN
    };
  })();

  return out;
})();

/* ---- the record ----------------------------------------------------------- */
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const record = {
  what: 'The lambda(4) campaign record. Phase 0: Mercer arXiv:1709.06612 Section 5 executed '
    + 'mechanically — lambda(2) and lambda(3) re-derived end to end as calibration, the lambda(4) '
    + 'generic case derived with its exception list DISCOVERED, and the remaining reduction measured '
    + 'at NINE families (five of Mercer\'s fourteen carry strictly negative delta and are closed by '
    + 'the generic argument itself unless a positive-delta condition holds simultaneously). '
    + 'Phase 1, in progress: families closed so far are listed in lambda4families with their full '
    + 'derivations — second-level dot theorems, subfamily cones, derived thresholds, decided finite parts.',
  provenance: 'Statement and strategy: Idris Mercer, INTEGERS 19 (2019) #A4 (arXiv:1709.06612), read at source. '
    + 'Every threshold below is DERIVED by the engine, never transcribed.',
  targets: { L2: encOut(L2), L3: encOut(L3), L4: encOut(L4), L2exact: '-9/8' },
  lambda2: { closure: lam2closure, finite: lam2finite },
  lambda3: { M0: m0, families: fam3 },
  lambda4generic: {
    base: gen4.base, posBase: gen4.posBase, dip: gen4.dip,
    exceptions: gen4.exceptions.map(e => ({ label: e.label, delta: e.delta, example: e.example })),
    extremizerEscape: { active: extremizerActive.map(e => e.label), deltaSum: extremizerDeltaQ, note: 'positive by inspection — the generic argument correctly fails on {1,2,3,4}' },
    worklist, closedFree
  },
  lambda4families: Object.assign({ 'd = 2c': famD2C }, FAMILIES),
  meta: { date: new Date().toISOString().slice(0, 10), git, ms: Date.now() - t0 }
};

const bigints = (k, v) => (typeof v === 'bigint' ? v.toString() : v);
fs.writeFileSync(path.join(ROOT, 'certs', 'lambda4-campaign.json'), JSON.stringify(record, bigints, 1) + '\n');
console.log('certs/lambda4-campaign.json written');
console.log('  lambda(2): N0 = ' + lam2closure.N0 + ', finite decided; lambda(3): three families, N0 = '
  + fam3.map(f => f.closure.N0).join('/') + ', ' + fam3.reduce((s, f) => s + f.finite.closed, 0) + ' finite sets closed');
console.log('  lambda(4) generic: dip ' + gen4.dip + ', 14 exceptions discovered, worklist ' + worklist.length
  + ' families, ' + closedFree.length + ' closed for free');
const famNames = Object.keys(record.lambda4families);
console.log('  families CLOSED (' + famNames.length + '/9): ' + famNames.join(' · '));
console.log('  ' + (Date.now() - t0) + ' ms');
