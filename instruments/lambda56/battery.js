#!/usr/bin/env node
/* battery.js — the lambda(5)/lambda(6) campaign's gates.
   instruments/lambda56 · cert-machine

   Calibration rule (inherited from lambda(4) and enforced here): the engine
   may not state a lambda(5)/(6) claim until it re-derives, at every run, the
   lambda(4) generic case — same weight, same 14 discovered exceptions, same
   9-family split, extremizer escaping. Then the campaign's own symbolic
   layer is re-derived from scratch: both generic theorems, the worklists,
   both extremizer escapes (by CONDITION-VECTOR evaluation, never labels),
   the sq-atom expansion identity, and the double-sum-core theorem that
   unlocked the a+d = e family. The record (certs/lambda56-campaign.json) is
   walked and its counts checked, so a rotted record refuses, not lingers.

   Red controls — every one a way this engine could lie, demonstrated to
   fail: a classical atom on the double-sum core must refuse (the structural
   obstruction is REAL, or the sq atom was never needed); a comb at too-light
   g0 must refuse the dip; an unregistered positive condition must throw; a
   wrong sub-cone must fail coverage point-by-point; a skip list naming an
   absent set must throw. */
'use strict';

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const F = require(path.join(ROOT, 'instruments/lambda4/forms.js'));
const D = require(path.join(ROOT, 'instruments/lambda4/dot.js'));
const EN = require(path.join(ROOT, 'instruments/lambda4/engine.js'));
const CL = require('./close.js');
const Q = require(path.join(ROOT, 'instruments/interval/rational.js'));

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
const activeAt = (dot, x) => dot.exceptions.filter(e => e.cond.reduce((s, cf, i) => s + Number(cf) * x[i], 0) === 0);
const parseQ = (s) => { const m = s.split('/'); return Q.R(BigInt(m[0]), BigInt(m[1] || 1)); };
const deltaSum = (exs) => exs.reduce((s, e) => Q.add(s, parseQ(e.delta)), q(0));

/* ---- targets --------------------------------------------------------------- */
const L4 = EN.targetEnclosure([1, 2, 3, 4]);
const L5 = EN.targetEnclosure([1, 2, 4, 5, 6]);
const L6 = EN.targetEnclosure([1, 2, 4, 6, 7, 8]);
check('T1 non-monotonicity is enclosure-certified: L(1,2,4,5,6) < L(1,2,4,6,7,8)',
  Q.cmp(L5.hi, L6.lo) < 0);
check('T2 the lambda(5) target sits below lambda(4)\'s: L5 < L4 (sequence still rising at 5)',
  Q.cmp(L5.hi, L4.lo) < 0);

/* ---- calibration: lambda(4) generic re-derived ----------------------------- */
{
  const C4 = F.ctx(['a', 'b', 'c', 'd'], {});
  const g4 = EN.dotTheorem({
    C: C4, S: { order: C4.member.d, xi: D.XI_PI },
    W: [{ atom: { kind: 'omc', form: C4.member.a }, coeff: q(1) },
        { atom: { kind: 'omc', form: C4.member.b }, coeff: q(1) },
        { atom: { kind: 'omcsq', form: C4.member.c }, coeff: q(2) }],
    gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4
  });
  const act = g4.ok ? activeAt(g4, [1, 1, 1, 1]) : [];
  check('C1 lambda(4) generic re-derives: 14 exceptions, 9 positive, extremizer escapes',
    g4.ok && g4.exceptions.length === 14
    && g4.exceptions.filter(e => e.deltaSign > 0).length === 9
    && act.length > 0 && Q.sign(deltaSum(act)) > 0);
}

/* ---- the generic theorems --------------------------------------------------- */
const C5 = F.ctx(['a', 'b', 'c', 'd', 'e'], {});
const gen5 = EN.dotTheorem({
  C: C5, S: { order: C5.member.e, xi: D.XI_PI },
  W: [{ atom: { kind: 'omcsq', form: C5.member.d }, coeff: q(2) }],
  gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], target: L5, witnessBox: 14
});
{
  const pos = gen5.ok ? gen5.exceptions.filter(e => e.deltaSign > 0) : [];
  const act = gen5.ok ? activeAt(gen5, [1, 1, 2, 1, 1]) : [];   /* {1,2,4,5,6} prefix diffs */
  check('G5a lambda(5) generic: base 0, dip -5/3, 8 positive of 15, all inhabited',
    gen5.ok && gen5.base === '0' && gen5.dip === '-5/3'
    && gen5.exceptions.length === 15 && pos.length === 8
    && gen5.exceptions.every(e => e.inhabited));
  check('G5b lambda(5) extremizer {1,2,4,5,6} escapes: 2 positive + 1 negative active, sum positive',
    act.length === 3 && act.filter(e => e.deltaSign > 0).length === 2 && Q.sign(deltaSum(act)) > 0,
    act.map(e => e.label).join(' & '));
}
const C6 = F.ctx(['a', 'b', 'c', 'd', 'e', 'f'], {});
{
  const gen6 = EN.dotTheorem({
    C: C6, S: { order: C6.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C6.member.e }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd', 'e'], anchored: ['f'], target: L6, witnessBox: 14
  });
  const pos = gen6.ok ? gen6.exceptions.filter(e => e.deltaSign > 0) : [];
  const act = gen6.ok ? activeAt(gen6, [1, 1, 2, 2, 1, 1]) : [];  /* {1,2,4,6,7,8} */
  check('G6a lambda(6) generic: base 0, dip -5/3, 10 positive of 19, all inhabited',
    gen6.ok && gen6.base === '0' && gen6.dip === '-5/3'
    && gen6.exceptions.length === 19 && pos.length === 10
    && gen6.exceptions.every(e => e.inhabited));
  check('G6b lambda(6) extremizer {1,2,4,6,7,8} escapes with positive delta sum',
    act.length === 3 && Q.sign(deltaSum(act)) > 0);
}

/* ---- the sq atom ------------------------------------------------------------ */
{
  /* |(1 - 2 e^{ih} + e^{2ih})/2|^2 = (1 - cos h)^2: the sq atom must agree
     with the omcsq atom EXACTLY, term by term, on a live inner product */
  const h = C5.member.c;
  const sqW = [{ atom: { kind: 'sq', terms: [
    { form: F.scale(h, 0), coeff: q(1, 2) },
    { form: h, coeff: q(-1) },
    { form: F.scale(h, 2), coeff: q(1, 2) }
  ] }, coeff: q(2) }];
  const omW = [{ atom: { kind: 'omcsq', form: h }, coeff: q(2) }];
  const S = { order: C5.member.e, xi: D.XI_PI };
  const g = D.expr(q(2, 3));
  for (const nm of ['a', 'b', 'c', 'd']) D.addCos(g, C5.member[nm], q(1));
  const a1 = D.inner(D.weightExpr(sqW), g, S);
  const a2 = D.inner(D.weightExpr(omW), g, S);
  const collEq = a1.colls.size === a2.colls.size
    && [...a1.colls.entries()].every(([k, v]) => a2.colls.has(k) && Q.cmp(v.delta, a2.colls.get(k).delta) === 0);
  check('Q1 sq atom reproduces omcsq exactly (base and every collision delta)',
    Q.cmp(a1.base, a2.base) === 0 && collEq);
}

/* ---- the double-sum core ---------------------------------------------------- */
const U4 = { n: 3, names: ['a', 'u', 'v'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [1n, 1n, 1n], d: [1n, 2n, 1n], e: [2n, 2n, 1n] }, defs: {} };
const combW = (() => {
  const ae = F.add(U4.member.a, U4.member.e), be = F.add(U4.member.b, U4.member.e);
  const terms = [];
  [1n, 1n].forEach((cj, j) => [5n, 7n, 5n].forEach((ck, k) =>
    terms.push({ form: F.add(F.scale(ae, j), F.scale(be, k)), coeff: Q.R(cj * ck, 1n) })));
  return [{ atom: { kind: 'sq', terms }, coeff: q(1) }];
})();
const coreSpec = (g0) => ({
  C: U4, S: { order: U4.member.e, xi: D.XI_2PI3, Bmax: 14 },
  W: combW, gConst: g0, gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], target: L5, witnessBox: 20
});
{
  const core = EN.dotTheorem(coreSpec(q(7, 6)));
  const pos = core.ok ? core.exceptions.filter(e => e.deltaSign > 0) : [];
  const act = core.ok ? activeAt(core, [1, 1, 2]) : [];           /* {1,2,4,5,6} in (a,u,v) */
  const actKeys = new Set(act.map(e => e.key));
  check('Q2 core theorem (b+c = a+d = e): comb weight lands base -8, dip -5/3, 6 positive',
    core.ok && core.base === '-8' && core.dip === '-5/3' && pos.length === 6);
  check('Q3 core extremizer escapes on exactly the three walls K2/K3/K6',
    act.length === 3 && Q.sign(deltaSum(act)) > 0
    && actKeys.has('2,0,-1') && actKeys.has('1,1,-1') && actKeys.has('1,-1,0'));
}
red('R1 the structural obstruction is real: every classical atom refuses on the core', () => {
  for (const m of ['a', 'b', 'c', 'd']) for (const xi of [D.XI_PI, D.XI_2PI3]) {
    const r = EN.dotTheorem({ C: U4, S: { order: U4.member.e, xi },
      W: [{ atom: { kind: 'omcsq', form: U4.member[m] }, coeff: q(2) }],
      gConst: xi === D.XI_PI ? q(2, 3) : q(7, 6),
      gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], target: L5, witnessBox: 16 });
    if (r.ok) return 'atom ' + m + ' certified — obstruction gone, sq atom unjustified';
  }
  return true;
});
red('R2 a comb at g0 = 9/8 must refuse: the dip -13/8 does not clear the target', () => {
  const r = EN.dotTheorem(coreSpec(q(9, 8)));
  return r.ok ? 'certified with an insufficient dip' : true;
});
red('R3 an unregistered positive condition must throw in the driver', () => {
  CL.closeNode('red-control', {
    kind: 'dot', C: U4, S: { order: U4.member.e, xi: D.XI_2PI3, Bmax: 14 },
    W: combW, gConst: q(7, 6), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'],
    subs: {}                                        /* six positives, none registered */
  }, { target: L5, tol: 1e-10, cap: 16, rootConds: {}, stats: { dots: 0, closures: 0, finiteSets: 0 } });
  return 'driver accepted unregistered positives';
});
red('R4 a wrong sub-cone must fail coverage point-by-point', () => {
  /* K5's cone registered under K6's key (u = a, i.e. b = 2a): must miss */
  const K5 = { n: 2, names: ['a', 'u'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [2n, 2n], e: [3n, 2n] }, defs: {} };
  const subs = {};
  for (const key of ['1,-1,-1', '2,0,-1', '1,1,-1', '2,1,-1', '1,0,-1', '1,-1,0'])
    subs[key] = { kind: 'delegate', rootKey: 'anything' };
  subs['1,-1,0'] = { kind: 'closure', C: K5,
    closures: [{ Se: { order: K5.member.b, xi: D.XI_PI3 }, So: { order: K5.member.a, xi: D.XI_2PI3 } }],
    bounds: (cls) => [{ form: K5.member.b, N0: cls[0].N0 }] };
  CL.closeNode('red-control', Object.assign({ kind: 'dot', subs }, coreSpec(q(7, 6))),
    { target: L5, tol: 1e-10, cap: 16, rootConds: { anything: [9n, 9n, 9n] },
      stats: { dots: 0, closures: 0, finiteSets: 0 } });
  return 'wrong cone passed coverage';
});
red('R5 a skip list naming an absent set must throw', () => {
  const C2 = F.ctx(['a', 'b'], {});
  EN.finitePart({ C: C2, tailMember: 'b', N0: 3, target: { lo: q(-9, 8), hi: q(-9, 8) }, skip: [[7, 9]] });
  return 'absent skip accepted';
});

/* ---- the record ------------------------------------------------------------- */
{
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda56-campaign.json'), 'utf8'));
  const st = rec.stages || {};
  const names = Object.keys(st);
  check('W1 record: every stage ok', names.length >= 8 && names.every(n => st[n].ok === true),
    names.filter(n => !st[n].ok).join(',') || 'all ok');
  const closed = names.filter(n => n.startsWith('lambda5-family:') && st[n].ok && st[n].status === 'CLOSED');
  const wl = (st['lambda5-generic'] && st['lambda5-generic'].worklist) || [];
  const closedSet = new Set(closed.map(n => n.replace('lambda5-family: ', '')));
  check('W2 record: EVERY lambda(5) worklist family is CLOSED — the reduction is complete',
    wl.length === 8 && wl.every(w => closedSet.has(w.family)),
    closed.length + '/8: ' + [...closedSet].join(' · '));
  const wl5 = st['lambda5-generic'] && st['lambda5-generic'].worklist;
  check('W3 record: lambda(5) worklist has 8 families, lambda(6) 10',
    wl5 && wl5.length === 8
    && st['lambda6-generic'] && st['lambda6-generic'].worklist.length === 10);
  const closed6 = names.filter(n => n.startsWith('lambda6-family:') && st[n].ok && st[n].status === 'CLOSED');
  check('W5 record: lambda(6) families closed so far (>= 2: d+e = f, 2e = f)',
    closed6.length >= 2, closed6.map(n => n.replace('lambda6-family: ', '')).join(' · '));
  /* the extremizer must be walled off exactly 4 times in the a+d=e tree
     (cone B of the 3c=2a+2d split, and K2/K3/K6 of the core) */
  const raw = JSON.stringify(st['lambda5-family: a+d = e'] || {});
  const walls = (raw.match(/"skipped":\s*\[\s*"1,2,4,5,6"\s*\]/g) || []).length;
  check('W4 record: {1,2,4,5,6} is the definitional witness on exactly 4 walls', walls === 4, walls + ' walls');
}

/* ---- the witness ------------------------------------------------------------ */
{
  /* {1,2,4,5,6} must sit exactly ON the target (it defines it), and the
     conjectured value must be consistent with a fresh certification */
  const r = EN.targetEnclosure([1, 2, 4, 5, 6], 1e-12);
  check('X1 witness re-certifies onto the lambda(5) target enclosure',
    Q.cmp(r.lo, L5.hi) <= 0 && Q.cmp(L5.lo, r.hi) <= 0);
}

console.log('\n' + pass + ' pass, ' + fail + ' fail, ' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
