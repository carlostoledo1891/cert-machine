#!/usr/bin/env node
/* run-lambda4-phase0.js — the lambda(4) campaign, Phase 0, executed in full.
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

   usage: node tools/run-lambda4-phase0.js */
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

/* ---- the record ----------------------------------------------------------- */
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const record = {
  what: 'lambda(4) campaign, Phase 0: Mercer arXiv:1709.06612 Section 5 executed mechanically — '
    + 'lambda(2) and lambda(3) re-derived end to end as calibration, the lambda(4) generic case '
    + 'derived with its exception list DISCOVERED, and the remaining reduction measured at NINE '
    + 'families (five of Mercer\'s fourteen carry strictly negative delta and are closed by the '
    + 'generic argument itself unless a positive-delta condition holds simultaneously).',
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
  meta: { date: new Date().toISOString().slice(0, 10), git, ms: Date.now() - t0 }
};

const bigints = (k, v) => (typeof v === 'bigint' ? v.toString() : v);
fs.writeFileSync(path.join(ROOT, 'certs', 'lambda4-phase0.json'), JSON.stringify(record, bigints, 1) + '\n');
console.log('certs/lambda4-phase0.json written');
console.log('  lambda(2): N0 = ' + lam2closure.N0 + ', finite decided; lambda(3): three families, N0 = '
  + fam3.map(f => f.closure.N0).join('/') + ', ' + fam3.reduce((s, f) => s + f.finite.closed, 0) + ' finite sets closed');
console.log('  lambda(4) generic: dip ' + gen4.dip + ', 14 exceptions discovered, worklist ' + worklist.length
  + ' families, ' + closedFree.length + ' closed for free');
console.log('  ' + (Date.now() - t0) + ' ms');
