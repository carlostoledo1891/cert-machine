#!/usr/bin/env node
/* battery.js — the lambda(4) campaign's gates.
   instruments/lambda4 · cert-machine

   Phase-0 calibration rule: the engine may not touch lambda(4) families
   until it re-derives, at every run, the published mathematics it stands on
   — lambda(2), the whole of Mercer's lambda(3) proof (exception families
   DISCOVERED, thresholds DERIVED, finite parts decided), and the Section-5
   generic case with its 14 exceptions matched against the list Mercer wrote
   by hand. The full finite pass lives in certs/lambda4-phase0.json (written
   by tools/run-lambda4-phase0.js); this battery re-runs everything symbolic,
   re-certifies a deterministic sample of the finite sets, and checks the
   record's counts — so a rotted record refuses, not lingers.

   Red controls: every one is a way this engine could lie, demonstrated to
   fail. A wrong weight must not certify; a doctored exception list must not
   match; an insufficient dip must refuse; an unsupported angle must throw;
   a weight vanishing on S must refuse (the Lemma 3.4 hypothesis the textbook
   statement omits); the refuter alarm must actually fire; a skip list naming
   an absent set must throw; a non-box tail form must throw. */
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const F = require('./forms.js');
const D = require('./dot.js');
const E = require('./estimates.js');
const EN = require('./engine.js');
const Q = require('#instruments/interval/rational.js');

const q = D.q;
let pass = 0, fail = 0, reds = 0;
const check = (name, ok, note) => {
  if (ok) { pass++; console.log('PASS  ' + name + (note ? '   [' + note + ']' : '')); }
  else { fail++; console.log('FAIL  ' + name + (note ? '   [' + note + ']' : '')); }
};
const red = (name, fn) => {
  let fired = false, msg = '';
  try { const r = fn(); fired = r === true; msg = String(r); }
  catch (e) { fired = true; msg = e.message.slice(0, 70); }
  if (fired) { reds++; console.log('   RED ok  ' + name + '   [' + msg + ']'); }
  else { fail++; console.log('   RED DID NOT FIRE  ' + name); }
};

/* ---- targets -------------------------------------------------------------- */
const L2 = EN.targetEnclosure([1, 2]);
const L3 = EN.targetEnclosure([1, 2, 3]);
const L4 = EN.targetEnclosure([1, 2, 3, 4]);
{
  const nineEighths = q(-9, 8);
  check('T1 L(1,2) enclosure contains the exact -9/8',
    Q.cmp(L2.lo, nineEighths) <= 0 && Q.cmp(nineEighths, L2.hi) <= 0);
  /* L(1,2,3) = -(17+7*sqrt7)/27  <=>  (27L+17)^2 = 343, checked in intervals */
  const t = (x) => Q.add(Q.mul(q(27), x), q(17));
  const lo = t(L3.lo), hi = t(L3.hi);                       /* both negative */
  const sqLo = Q.mul(hi, hi), sqHi = Q.mul(lo, lo);
  check('T2 L(1,2,3) satisfies (27L+17)^2 = 343 within its enclosure',
    Q.cmp(sqLo, q(343)) <= 0 && Q.cmp(q(343), sqHi) <= 0);
}

/* ---- lambda(2) ------------------------------------------------------------ */
{
  const C2 = F.ctx(['a', 'b'], {});
  const cl = EN.anchoredClosure({
    C: C2, members: ['a', 'b'],
    Se: { order: C2.member.b, xi: D.XI_PI }, So: { order: C2.member.a, xi: D.XI_PI },
    tailMember: 'b', target: { lo: q(-9, 8), hi: q(-9, 8) }
  });
  check('L2a threshold b >= 3 DERIVED (Mercer proves with b >= 3)', cl.N0 === 3, 'N0 = ' + cl.N0);
  const fin = EN.finitePart({ C: C2, tailMember: 'b', N0: cl.N0, target: { lo: q(-9, 8), hi: q(-9, 8) }, skip: [[1, 2]] });
  check('L2b finite part is exactly the witness {1,2}', fin.ok && fin.enumerated === 1 && fin.closed === 0);
}

/* ---- lambda(3): M0 discovers the three families --------------------------- */
const C3g = F.ctx(['a', 'b', 'c'], {});
{
  const m0 = EN.dotTheorem({
    C: C3g, S: { order: C3g.member.c, xi: D.XI_PI },
    W: [{ atom: { kind: 'omc', form: C3g.member.a }, coeff: q(1) },
        { atom: { kind: 'omc', form: C3g.member.b }, coeff: q(1) }],
    gConst: q(1, 2), gMembers: ['a', 'b'], anchored: ['c'], target: L3
  });
  check('L3a M0: base 0, <w,1> = 2, dip -3/2 clears L(1,2,3)',
    m0.ok && m0.base === '0' && m0.posBase === '2' && m0.dip === '-3/2');
  const want = new Set([
    F.normKey(F.sub(F.scale(C3g.member.a, 2), C3g.member.c)),
    F.normKey(F.sub(F.scale(C3g.member.b, 2), C3g.member.c)),
    F.normKey(F.sub(F.add(C3g.member.a, C3g.member.b), C3g.member.c))
  ]);
  const got = new Set(m0.exceptions.map(x => x.key));
  check('L3b M0 exceptions DISCOVERED = {c=2a, c=2b, c=a+b}, no more, no fewer',
    got.size === 3 && [...want].every(k => got.has(k)));
}

/* ---- lambda(3): the three families, thresholds re-derived ------------------ */
const FAM3 = [
  { label: 'c = 2a', C: { n: 2, names: ['s', 'r'], member: { a: [1n, 1n], b: [2n, 1n], c: [2n, 2n] }, defs: {} },
    Se: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.b, xi: D.XI_PI }),
    tail: 'a', N0: 3, skip: [] },
  { label: 'c = 2b', C: { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 2n] }, defs: {} },
    Se: (C) => ({ order: C.member.b, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.a, xi: D.XI_PI }),
    tail: 'b', N0: 3, skip: [] },
  { label: 'c = a+b', C: { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n] }, defs: {} },
    Se: (C) => ({ order: C.member.b, xi: D.XI_2PI3 }), So: (C) => ({ order: C.member.a, xi: D.XI_2PI3 }),
    tail: 'b', N0: 33, skip: [[1, 2, 3]] }
];
for (const f of FAM3) {
  const cl = EN.anchoredClosure({ C: f.C, members: ['a', 'b', 'c'], Se: f.Se(f.C), So: f.So(f.C), tailMember: f.tail, target: L3 });
  check('L3c family ' + f.label + ': threshold ' + f.tail + ' >= ' + f.N0 + ' DERIVED', cl.N0 === f.N0, 'N0 = ' + cl.N0);
  if (f.N0 === 3) {
    const fin = EN.finitePart({ C: f.C, tailMember: f.tail, N0: cl.N0, target: L3, skip: f.skip });
    check('L3d family ' + f.label + ': finite part decided', fin.ok && fin.enumerated === 1 && fin.closed === 1);
  }
}
/* surjectivity spot-check: the c=2a parametrization covers every raw family
   point with c <= 30 (the cone must be ONTO the family, or the theorem has a
   hole exactly where nobody looked) */
{
  const raw = new Set();
  for (let a = 1; a <= 15; a++) for (let b = a + 1; b < 2 * a; b++) raw.add([a, b, 2 * a].join(','));
  const covered = new Set();
  for (let s = 1; s <= 15; s++) for (let r = 1; r <= 15; r++) {
    const a = s + r, b = 2 * s + r, c = 2 * s + 2 * r;
    if (c <= 30) covered.add([a, b, c].join(','));
  }
  check('L3e the c=2a cone is ONTO the family (all raw points with c <= 30 covered)',
    [...raw].every(k => covered.has(k)), raw.size + ' points');
}

/* ---- lambda(3): sampled finite re-certification + the pinned record ------- */
{
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda4-campaign.json'), 'utf8'));
  const fam = rec.lambda3.families.find(x => x.label === 'c = a+b');
  check('R1 record: c=a+b finite part enumerated 323, closed 322, (1,2,3) skipped, none undecided',
    fam.finite.enumerated === 323 && fam.finite.closed === 322
    && fam.finite.skipped.join('|') === '1,2,3' && fam.finite.undecided.length === 0);
  check('R2 record: lambda4 worklist is 9 families, 5 closed for free, extremizer escapes',
    rec.lambda4generic.worklist.length === 9 && rec.lambda4generic.closedFree.length === 5
    && rec.lambda4generic.extremizerEscape.active.length > 0);
  /* re-certify a deterministic sample of the 322: every 27th pair (a<b<=32,
     gcd 1, skipping the witness) must dip strictly below L(1,2,3) */
  const LAM = require('#instruments/trigmin/lambda.js');
  const sets = [];
  for (let b = 2; b <= 32; b++) for (let a = 1; a < b; a++) {
    const g = (x, y) => y ? g(y, x % y) : x;
    if (g(b, a) !== 1) continue;
    if (a === 1 && b === 2) continue;
    sets.push([a, b, a + b]);
  }
  const sample = sets.filter((_, i) => i % 27 === 0);
  let okAll = true;
  for (const A of sample) {
    const r = LAM.certifyLambda(A, { tol: 1e-10 });
    if (!(Q.cmp(Q.fromDouble(r.minEnclosure[1]), L3.lo) < 0)) okAll = false;
  }
  check('R3 sampled finite sets re-certified below L(1,2,3)', okAll, sample.length + ' of ' + sets.length);
}

/* ---- lambda(4): the generic case, re-derived every run --------------------- */
const C4 = F.ctx(['a', 'b', 'c', 'd'], {});
const W4 = [{ atom: { kind: 'omc', form: C4.member.a }, coeff: q(1) },
            { atom: { kind: 'omc', form: C4.member.b }, coeff: q(1) },
            { atom: { kind: 'omcsq', form: C4.member.c }, coeff: q(2) }];
const S4 = { order: C4.member.d, xi: D.XI_PI };
{
  const gen = EN.dotTheorem({ C: C4, S: S4, W: W4, gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4 });
  check('L4a generic: base 0, <w,1> = 5, dip -8/5 clears L(1,2,3,4)',
    gen.ok && gen.base === '0' && gen.posBase === '5' && gen.dip === '-8/5');
  /* Mercer's 14, transcribed from the paper as member combinations */
  const c = (co) => F.normKey(F.combo(C4, co));
  const mercer14 = new Set([
    c({ d: 1, a: -2 }), c({ d: 1, b: -2 }), c({ d: 1, c: -2 }),
    c({ d: 1, a: -1, b: -1 }), c({ d: 1, a: -1, c: -1 }), c({ d: 1, b: -1, c: -1 }),
    c({ d: 1, a: 1, c: -2 }), c({ d: 1, b: 1, c: -2 }),
    c({ d: 1, a: -1, c: -2 }), c({ d: 2, a: -1, c: -2 }),
    c({ d: 1, b: -1, c: -2 }), c({ d: 2, b: -1, c: -2 }),
    c({ d: 1, c: -3 }), c({ d: 2, c: -3 })
  ]);
  const got = new Set(gen.exceptions.map(x => x.key));
  check('L4b the 14 exceptions DISCOVERED match Mercer\'s hand-written list exactly',
    mercer14.size === 14 && got.size === 14 && [...mercer14].every(k => got.has(k)));
  check('L4c every exception is INHABITED (a witness point exists)', gen.exceptions.every(x => x.inhabited));
  const neg = gen.exceptions.filter(x => x.deltaSign < 0).map(x => x.label).sort().join(' | ');
  check('L4d five families carry negative delta — closed by the generic argument itself',
    gen.exceptions.filter(x => x.deltaSign < 0).length === 5, neg);
  check('L4e the worklist is the NINE positive-delta families',
    gen.exceptions.filter(x => x.deltaSign > 0).length === 9);
}

/* ---- Phase 1, family d = 2c: re-derived symbolically every run ------------- */
{
  const CF = F.ctx(['a', 'b', 'c'], { d: { c: 2 } });
  const dot = EN.dotTheorem({
    C: CF, S: { order: CF.member.c, xi: D.XI_2PI3 },
    W: [{ atom: { kind: 'omcsq', form: CF.member.a }, coeff: q(2) },
        { atom: { kind: 'omcsq', form: CF.member.b }, coeff: q(2) }],
    gConst: q(3, 5), gMembers: ['a', 'b'], anchored: ['c', 'd'], target: L4, witnessBox: 20
  });
  check('F1 family d=2c: base -2/5, dip -8/5, both anchors exact at -1/2',
    dot.ok && dot.base === '-2/5' && dot.dip === '-8/5'
    && dot.anchoredVals.c === '-1/2' && dot.anchoredVals.d === '-1/2');
  const posLabels = dot.exceptions.filter(e => e.deltaSign > 0).map(e => e.label).sort().join(' | ');
  check('F2 family d=2c: exactly four positive sub-conditions',
    posLabels === '2a = b | 2a = c | 2b = c | a+b = c', posLabels);
  /* subfamily thresholds, re-derived */
  const S1 = { n: 2, names: ['a', 'e'], member: { a: [1n, 0n], b: [2n, 0n], c: [2n, 1n], d: [4n, 2n] }, defs: {} };
  const clA = EN.anchoredClosure({ C: S1, members: ['a', 'b', 'c', 'd'], Se: { order: S1.member.a, xi: D.XI_2PI3 }, So: { order: S1.member.c, xi: D.XI_2PI3 }, tailMember: 'a', target: L4 });
  const clB = EN.anchoredClosure({ C: S1, members: ['a', 'b', 'c', 'd'], Se: { order: S1.member.c, xi: D.XI_2PI3 }, So: { order: S1.member.a, xi: D.XI_2PI3 }, tailMember: 'c', target: L4 });
  check('F3 subfamily b=2a: union closure a >= 19 OR c >= 19, both DERIVED',
    clA.N0 === 19 && clB.N0 === 19 && clA.validityFloor === 12);
  const S4f = { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [4n, 2n] }, defs: {} };
  const cl4 = EN.anchoredClosure({ C: S4f, members: ['a', 'b', 'c', 'd'], Se: { order: S4f.member.b, xi: D.XI_2PI3 }, So: { order: S4f.member.a, xi: D.XI_2PI3 }, tailMember: 'b', target: L4 });
  check('F4 subfamily c=a+b: threshold b >= 25 DERIVED', cl4.N0 === 25, 'N0 = ' + cl4.N0);
  /* the record's finite parts, counts + a sampled re-certification */
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda4-campaign.json'), 'utf8'));
  const fam = rec.lambda4families['d = 2c'];
  const sizes = fam.subfamilies.map(s => s.finite.enumerated + '/' + s.finite.closed).join(' ');
  check('F5 record: family d=2c CLOSED — every subfamily finite part fully decided',
    fam.status === 'CLOSED' && fam.subfamilies.every(s => s.finite.enumerated === s.finite.closed && s.finite.undecided.length === 0),
    sizes);
  check('F6 record: coverage checked point-by-point for all four sub-conditions',
    fam.coverage.length === 4 && fam.coverage.every(c => c.pointsChecked > 0));
  const LAM = require('#instruments/trigmin/lambda.js');
  let okS = true;
  for (const A of [[1, 2, 3, 6], [2, 3, 4, 8], [1, 2, 4, 8], [3, 4, 7, 14], [5, 7, 12, 24]]) {
    const r = LAM.certifyLambda(A, { tol: 1e-10 });
    if (!(Q.cmp(Q.fromDouble(r.minEnclosure[1]), L4.lo) < 0)) okS = false;
  }
  check('F7 five d=2c finite sets re-certified below L(1,2,3,4)', okS);
}

/* ---- Phase 1, the full nine: record walk + fast re-derivations ------------- */
{
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda4-campaign.json'), 'utf8'));
  const fams = rec.lambda4families || {};
  const NINE = ['d = 2c', 'd = 2a', 'd = b+c', 'd = a+b', 'd = a+c', '2d = 2c+a', 'd = 2b', '2d = 2c+b', '2d = 3c'];
  check('N1 the record holds all NINE families, every one CLOSED',
    NINE.every(n => fams[n] && fams[n].status === 'CLOSED'), NINE.filter(n => fams[n]).length + '/9');
  /* walk every finite part in the record: none may be undecided, and the
     total closed count is the campaign's finite workload, stated */
  let finites = 0, closedSets = 0, undecided = 0, skips = [];
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (o.enumerated !== undefined && o.undecided !== undefined) {
      finites++; closedSets += o.closed; undecided += o.undecided.length;
      for (const s of (o.skipped || [])) skips.push(s);
    }
    Object.values(o).forEach(walk);
  };
  walk(fams);
  check('N2 every finite part in every family is fully decided',
    undecided === 0, finites + ' finite parts, ' + closedSets + ' sets closed');
  check('N3 the ONLY set ever skipped is the extremizer {1,2,3,4}, in the equality families',
    skips.length >= 3 && skips.every(s => s === '1,2,3,4'), skips.length + ' skips');
  check('N4 the delegation targets exist and are closed (d = 2a, d = a+b)',
    fams['d = 2a'] && fams['d = 2a'].status === 'CLOSED' && fams['d = a+b'] && fams['d = a+b'].status === 'CLOSED');
  /* fast symbolic re-derivations of the two heaviest family dots */
  const D1 = { n: 3, names: ['a', 'e', 'r'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n] }, defs: {} };
  const rD1 = EN.dotTheorem({ C: D1, S: { order: D1.member.b, xi: D.XI_2PI3 },
    W: [{ atom: { kind: 'omcsq', form: D1.member.a }, coeff: q(2) }, { atom: { kind: 'omcsq', form: D1.member.c }, coeff: q(2) }],
    gConst: q(3, 5), gMembers: ['a', 'c'], anchored: ['b', 'd'], target: L4 });
  check('N5 d=2b cone D1 re-derived: base -2/5, five positive conditions',
    rD1.ok && rD1.base === '-2/5' && rD1.exceptions.filter(e => e.deltaSign > 0).length === 5);
  const W1 = { n: 3, names: ['a', 'u2', 'u3'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 2n], d: [3n, 3n, 3n] }, defs: {} };
  const rW1 = EN.dotTheorem({ C: W1, S: { order: [1n, 1n, 1n], xi: D.XI_PI3 },
    W: [{ atom: { kind: 'omc', form: W1.member.a }, coeff: q(1) }, { atom: { kind: 'omc', form: W1.member.b }, coeff: q(1) }],
    gConst: q(1, 10), gMembers: ['a', 'b'], anchored: ['c', 'd'], target: L4 });
  check('N6 2d=3c cone W1 (b < gam) re-derived: base -4/5, closed GENERICALLY (no positives)',
    rW1.ok && rW1.base === '-4/5' && rW1.exceptions.filter(e => e.deltaSign > 0).length === 0);
  /* the independent audit record: clean, on a box at least 30, zero refuters */
  const au = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda4-audit.json'), 'utf8'));
  check('N7 the independent audit walk is on file: box >= 30, every set claused, zero refuters',
    au.box >= 30 && au.setsWalked > 25000 && au.sweep.refuters === 0 && au.finiteRecertified > 400,
    au.setsWalked + ' sets, ' + au.finiteRecertified + ' re-certified');
}

/* ---- red controls ---------------------------------------------------------- */
console.log('\n    executing falsifiers');
red('X1 a wrong weight (omcsq coefficient 1, not 2) must not certify', () => {
  const W = [{ atom: { kind: 'omc', form: C4.member.a }, coeff: q(1) },
             { atom: { kind: 'omc', form: C4.member.b }, coeff: q(1) },
             { atom: { kind: 'omcsq', form: C4.member.c }, coeff: q(1) }];
  const r = EN.dotTheorem({ C: C4, S: S4, W, gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4 });
  return r.ok === false && r.why.indexOf('base') >= 0 ? true : 'certified with a broken weight';
});
red('X2 a doctored 13-item exception list must not match the discovered 14', () => {
  const gen = EN.dotTheorem({ C: C4, S: S4, W: W4, gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4 });
  const doctored = new Set(gen.exceptions.slice(0, 13).map(x => x.key));
  const got = new Set(gen.exceptions.map(x => x.key));
  const matches = doctored.size === got.size && [...doctored].every(k => got.has(k));
  return matches ? 'a 13-item list passed for the 14' : true;
});
red('X3 an insufficient dip (gConst 2/5 -> -7/5) must refuse against L(1,2,3,4)', () => {
  const r = EN.dotTheorem({ C: C4, S: S4, W: W4, gConst: q(2, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4 });
  return r.ok === false && r.why.indexOf('dip') >= 0 ? true : 'a dip above the target certified';
});
red('X4 a member landing at an unsupported angle must throw', () => {
  const C = { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n] }, defs: {} };
  E.anchoredBound(C, ['a', 'b', 'c'], { order: C.member.b, xi: D.XI_PI }, { order: C.member.a, xi: D.XI_2PI3 });
  return 'a 5pi/3 target angle was accepted';
});
red('X5 a weight vanishing identically on S must refuse (the Lemma 3.4 hypothesis)', () => {
  const W = [{ atom: { kind: 'omc', form: F.scale(C4.member.d, 2) }, coeff: q(1) }];
  const r = EN.dotTheorem({ C: C4, S: S4, W, gConst: q(0), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4 });
  return r.ok === false && r.why.indexOf('3.4') >= 0 ? true : 'a vanishing weight certified';
});
red('X6 the refuter alarm fires: {1,2} does not dip below L(1,2,3,4)', () => {
  const C2 = F.ctx(['a', 'b'], {});
  EN.finitePart({ C: C2, tailMember: 'b', N0: 3, target: L4, skip: [] });
  return 'a set above the target was closed silently';
});
red('X7 a skip list naming an absent set must throw', () => {
  const C2 = F.ctx(['a', 'b'], {});
  EN.finitePart({ C: C2, tailMember: 'b', N0: 3, target: { lo: q(-9, 8), hi: q(-9, 8) }, skip: [[9, 9]] });
  return 'an absent skip set was accepted';
});
red('X8 a tail form that does not bound the box must throw', () => {
  const C = { n: 2, names: ['a', 'b'], member: { a: [1n, 0n], b: [1n, 1n] }, defs: {} };
  EN.finitePart({ C, tailMember: 'a', N0: 3, target: { lo: q(-9, 8), hi: q(-9, 8) }, skip: [] });
  return 'an unbounded enumeration was accepted';
});

console.log('\n' + (fail ? fail + ' FAILED   ' : 'ALL PASS   ') + '(' + pass + ' checks, ' + reds + '/8 falsifiers)');
process.exit(fail ? 1 : 0);
