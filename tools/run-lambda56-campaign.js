#!/usr/bin/env node
/* run-lambda56-campaign.js — the lambda(5)/lambda(6) campaign: Mercer's
   remaining conjectured values, and with them the first NON-MONOTONICITY in
   the lambda sequence (lambda(6) < lambda(5)).
   tools/ · cert-machine

   THE PAIR OF THEOREMS SOUGHT:
     lambda(5) = -L(1,2,4,5,6)    ~ 1.6274606644665797
     lambda(6) = -L(1,2,4,6,7,8)  ~ 1.5918323293238500
   Conjectured by Mercer (INTEGERS 19 (2019) #A4, arXiv:1709.06612). Neither
   optimizer is an initial segment, and lambda(6) < lambda(5): proving both
   values proves the sequence lambda(2) < lambda(3) < lambda(4) < lambda(5)
   TURNS DOWN at 6. The lambda(4) engine (instruments/lambda4/, n-generic by
   construction) is the enabling asset and is reused as-is.

   THE GENERIC CASE, the campaign's first discovery (2026-09-01): lambda(4)'s
   generic dip -8/5 does not clear the lambda(5) target, so the weight must
   change. At g0 = 2/3 every pure (1-cos m)^2 atom on a g-member lands base
   EXACTLY 0 (the atom's -1 match cancels (3/2)g0), dip = -5/3 clears both
   targets, and the single atom on the second-largest member minimizes the
   exception count: EIGHT positive-delta families for lambda(5), TEN for
   lambda(6). Exceptions are OUTPUT — every family below carries the
   condition key the engine discovered, never a hand-translated vector.

   INCREMENTAL BY CONSTRUCTION (the 90-minute lesson): the record is written
   after EVERY stage, every stage is failure-tolerant, and a stage that
   throws leaves {ok:false, error} in the record instead of vaporizing the
   session's work.

   usage: node tools/run-lambda56-campaign.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const F = require(path.join(ROOT, 'instruments/lambda4/forms.js'));
const D = require(path.join(ROOT, 'instruments/lambda4/dot.js'));
const EN = require(path.join(ROOT, 'instruments/lambda4/engine.js'));
const Q = require(path.join(ROOT, 'instruments/interval/rational.js'));

const q = D.q;
const t0 = Date.now();
const OUT = path.join(ROOT, 'certs', 'lambda56-campaign.json');

/* ---- the incremental record ---------------------------------------------- */
const record = {
  what: 'The lambda(5)/lambda(6) campaign record: Mercer\'s remaining conjectured values, '
    + 'lambda(5) = -L(1,2,4,5,6) and lambda(6) = -L(1,2,4,6,7,8), whose pair is the first '
    + 'non-monotonicity in the lambda sequence. Section-5 generic cases with exception '
    + 'families DISCOVERED by the symbolic inner product; family closures accumulate below.',
  provenance: 'Statement and strategy: Idris Mercer, INTEGERS 19 (2019) #A4 (arXiv:1709.06612). '
    + 'Engine: instruments/lambda4 (n-generic), calibrated at every run by re-deriving the '
    + 'lambda(4) generic case before any lambda(5)/(6) claim is computed.',
  stages: {},
  meta: {}
};
let failures = 0;
const save = () => {
  const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
  record.meta = { date: new Date().toISOString().slice(0, 10), git, ms: Date.now() - t0, failures };
  const bigints = (k, v) => (typeof v === 'bigint' ? v.toString() : v);
  fs.writeFileSync(OUT, JSON.stringify(record, bigints, 1) + '\n');
};
const stage = (name, fn) => {
  const t = Date.now();
  try {
    record.stages[name] = Object.assign({ ok: true }, fn());
    record.stages[name].ms = Date.now() - t;
    console.log('  stage ' + name + ': ok (' + (Date.now() - t) + ' ms)');
  } catch (e) {
    failures++;
    record.stages[name] = { ok: false, error: e.message, ms: Date.now() - t };
    console.log('  stage ' + name + ': FAILED — ' + e.message.slice(0, 120));
  }
  save();
};

/* ---- shared helpers ------------------------------------------------------- */
const encOut = (T) => ({ A: T.A, lo: T.lo.n + '/' + T.lo.d, hi: T.hi.n + '/' + T.hi.d });

/* evaluate an x-space condition vector at a concrete member tuple of the
   PREFIX context (x_i = a_i - a_{i-1}) — the only legal way to ask which
   conditions a set activates (hand-translation is how lambda(4) nearly
   shipped a hole) */
const activeAt = (dot, members) => {
  const x = members.map((v, i) => (i ? v - members[i - 1] : v));
  return dot.exceptions.filter(e => e.cond.reduce((s, cf, i) => s + Number(cf) * x[i], 0) === 0);
};
const parseQ = (s) => { const m = s.split('/'); return Q.R(BigInt(m[0]), BigInt(m[1] || 1)); };
const deltaSum = (exs) => exs.reduce((s, e) => Q.add(s, parseQ(e.delta)), q(0));

/* ---- targets: shared by every stage --------------------------------------- */
const L4 = EN.targetEnclosure([1, 2, 3, 4]);
const L5 = EN.targetEnclosure([1, 2, 4, 5, 6]);
const L6 = EN.targetEnclosure([1, 2, 4, 6, 7, 8]);

/* generic dots are shared between their own stage and the worklist stage */
let gen5 = null, gen6 = null;

/* ---- stage: calibration --------------------------------------------------- */
/* The gate: the engine must re-derive the lambda(4) generic case — same
   weight, same 14 discovered exceptions, same 9-family split, extremizer
   escaping with positive delta — before a single lambda(5) claim is made. */
stage('calibration-lambda4-generic', () => {
  const C4 = F.ctx(['a', 'b', 'c', 'd'], {});
  const gen4 = EN.dotTheorem({
    C: C4, S: { order: C4.member.d, xi: D.XI_PI },
    W: [{ atom: { kind: 'omc', form: C4.member.a }, coeff: q(1) },
        { atom: { kind: 'omc', form: C4.member.b }, coeff: q(1) },
        { atom: { kind: 'omcsq', form: C4.member.c }, coeff: q(2) }],
    gConst: q(3, 5), gMembers: ['a', 'b', 'c'], anchored: ['d'], target: L4
  });
  if (!gen4.ok) throw new Error('lambda(4) generic did not re-derive: ' + gen4.why);
  if (gen4.exceptions.length !== 14) throw new Error('lambda(4) generic: expected 14 exceptions, got ' + gen4.exceptions.length);
  const pos = gen4.exceptions.filter(e => e.deltaSign > 0);
  if (pos.length !== 9) throw new Error('lambda(4) generic: expected 9 positive families, got ' + pos.length);
  const act = activeAt(gen4, [1, 2, 3, 4]);
  if (!act.length || Q.sign(deltaSum(act)) <= 0)
    throw new Error('lambda(4) extremizer does not escape the generic argument — engine broken');
  return { base: gen4.base, dip: gen4.dip, exceptions: 14, positive: 9,
    extremizerActive: act.map(e => e.label) };
});

/* ---- stage: targets ------------------------------------------------------- */
stage('targets', () => {
  /* the non-monotonicity the campaign exists to prove, at enclosure level:
     L(1,2,4,5,6) < L(1,2,4,6,7,8) strictly, so -L5 > -L6 */
  if (Q.cmp(L5.hi, L6.lo) >= 0)
    throw new Error('target enclosures do not separate: non-monotonicity ill-posed');
  /* and both conjectured optimizers beat their initial segments' values,
     i.e. the initial segments dip strictly below the conjectured lambda */
  const seg5 = EN.targetEnclosure([1, 2, 3, 4, 5]);
  const seg6 = EN.targetEnclosure([1, 2, 3, 4, 5, 6]);
  if (Q.cmp(seg5.hi, L5.lo) >= 0) throw new Error('{1,2,3,4,5} does not dip below the lambda(5) target');
  if (Q.cmp(seg6.hi, L6.lo) >= 0) throw new Error('{1,2,3,4,5,6} does not dip below the lambda(6) target');
  return { L4: encOut(L4), L5: encOut(L5), L6: encOut(L6),
    initialSegments: { seg5: encOut(seg5), seg6: encOut(seg6) },
    nonMonotonicity: 'L(1,2,4,5,6).hi < L(1,2,4,6,7,8).lo certified' };
});

/* ---- stage: the lambda(5) generic case ------------------------------------ */
const C5 = F.ctx(['a', 'b', 'c', 'd', 'e'], {});
stage('lambda5-generic', () => {
  gen5 = EN.dotTheorem({
    C: C5, S: { order: C5.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C5.member.d }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], target: L5, witnessBox: 14
  });
  if (!gen5.ok) throw new Error('lambda(5) generic failed: ' + gen5.why);
  if (gen5.exceptions.some(e => !e.inhabited)) throw new Error('lambda(5) generic: an uninhabited exception');
  const act = activeAt(gen5, [1, 2, 4, 5, 6]);
  if (!act.length || Q.sign(deltaSum(act)) <= 0)
    throw new Error('lambda(5): the generic argument closes the extremizer — it would prove a false statement');
  const pos = gen5.exceptions.filter(e => e.deltaSign > 0);
  const neg = gen5.exceptions.filter(e => e.deltaSign < 0);
  if (pos.length + neg.length !== gen5.exceptions.length)
    throw new Error('lambda(5) generic: a zero-delta exception appeared — look at it');
  return {
    base: gen5.base, posBase: gen5.posBase, dip: gen5.dip,
    target: gen5.target,
    weight: 'g0 = 2/3, w = 2(1-cos d)^2 — pure omcsq atoms are the base-0 shape at the heavier g0',
    exceptions: gen5.exceptions.map(e => ({ key: e.key, label: e.label, delta: e.delta, example: e.example })),
    worklist: pos.map(e => ({ family: e.label, key: e.key, delta: e.delta, example: e.example })),
    closedFree: neg.map(e => ({ family: e.label, delta: e.delta })),
    extremizerEscape: { set: [1, 2, 4, 5, 6], active: act.map(e => e.label + ' (' + e.delta + ')'),
      deltaSum: Q.toString(deltaSum(act)) }
  };
});

/* ---- stage: the lambda(6) generic case ------------------------------------ */
const C6 = F.ctx(['a', 'b', 'c', 'd', 'e', 'f'], {});
stage('lambda6-generic', () => {
  gen6 = EN.dotTheorem({
    C: C6, S: { order: C6.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C6.member.e }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd', 'e'], anchored: ['f'], target: L6, witnessBox: 14
  });
  if (!gen6.ok) throw new Error('lambda(6) generic failed: ' + gen6.why);
  if (gen6.exceptions.some(e => !e.inhabited)) throw new Error('lambda(6) generic: an uninhabited exception');
  const act = activeAt(gen6, [1, 2, 4, 6, 7, 8]);
  if (!act.length || Q.sign(deltaSum(act)) <= 0)
    throw new Error('lambda(6): the generic argument closes the extremizer — it would prove a false statement');
  const pos = gen6.exceptions.filter(e => e.deltaSign > 0);
  const neg = gen6.exceptions.filter(e => e.deltaSign < 0);
  if (pos.length + neg.length !== gen6.exceptions.length)
    throw new Error('lambda(6) generic: a zero-delta exception appeared — look at it');
  return {
    base: gen6.base, posBase: gen6.posBase, dip: gen6.dip,
    target: gen6.target,
    weight: 'g0 = 2/3, w = 2(1-cos e)^2',
    exceptions: gen6.exceptions.map(e => ({ key: e.key, label: e.label, delta: e.delta, example: e.example })),
    worklist: pos.map(e => ({ family: e.label, key: e.key, delta: e.delta, example: e.example })),
    closedFree: neg.map(e => ({ family: e.label, delta: e.delta })),
    extremizerEscape: { set: [1, 2, 4, 6, 7, 8], active: act.map(e => e.label + ' (' + e.delta + ')'),
      deltaSum: Q.toString(deltaSum(act)) }
  };
});

/* ---- family closures accumulate below ------------------------------------- */
/* Each closed family is its own stage writing into record.stages under
   'lambda5-family: <label>' — the battery counts them against the worklist.
   Every registry key below was read off the engine (never hand-derived);
   the driver refuses if the engine ever raises a different set. */

const CL = require(path.join(ROOT, 'instruments/lambda56/close.js'));

/* root condition vectors, keyed exactly as gen5/gen6 emitted them */
const rootCondsOf = (gen) => {
  const m = {};
  for (const e of gen.exceptions.filter(e => e.deltaSign > 0)) m[e.key] = e.cond;
  return m;
};
const rootKeyOf = (gen, label) => {
  const hit = gen.exceptions.find(e => e.deltaSign > 0 && e.label === label);
  if (!hit) throw new Error('no generic positive condition labeled "' + label + '"');
  return hit.key;
};

/* ---- lambda(5) family: e = 2d --------------------------------------------- */
stage('lambda5-family: 2d = e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  /* level 2: family cone, S(d, 2pi/3) anchors cos d = cos 2d = -1/2, single
     omcsq atom on c (base 0 at g0 = 2/3), dip -5/3. Three positives. */
  const CF = F.ctx(['a', 'b', 'c', 'd'], { e: { d: 2 } });
  /* level 3 cones */
  const S1 = F.ctx(['a', 'b', 'c'], { d: { c: 2 }, e: { c: 4 } });          /* & d = 2c  */
  const S2 = F.ctx(['a', 'b', 'c'], { d: { a: 1, c: 1 }, e: { a: 2, c: 2 } }); /* & d = a+c */
  const S3 = F.ctx(['a', 'b', 'c'], { d: { b: 1, c: 1 }, e: { b: 2, c: 2 } }); /* & d = b+c */
  /* level 4 cones (2-dof), anchors found by search, thresholds DERIVED */
  const P11 = F.ctx(['a', 'b'], { c: { b: 2 }, d: { b: 4 }, e: { b: 8 } });
  const P12 = F.ctx(['a', 'b'], { c: { a: 1, b: 1 }, d: { a: 2, b: 2 }, e: { a: 4, b: 4 } });
  const P21 = { n: 2, names: ['a', 't'], member: { a: [1n, 0n], b: [1n, 1n], c: [1n, 2n], d: [2n, 2n], e: [4n, 4n] }, defs: {} };
  const P22 = F.ctx(['a', 'b'], { c: { b: 2 }, d: { a: 1, b: 2 }, e: { a: 2, b: 4 } });
  const P31 = { n: 2, names: ['a', 'w'], member: { a: [1n, 0n], b: [2n, 0n], c: [2n, 1n], d: [4n, 1n], e: [8n, 2n] }, defs: {} };
  const P32 = { n: 2, names: ['s', 't'], member: { a: [1n, 1n], b: [1n, 2n], c: [2n, 2n], d: [3n, 4n], e: [6n, 8n] }, defs: {} };

  const closure = (C, Se, So, boundForm) => ({
    kind: 'closure', C,
    closures: [{ Se, So }],
    bounds: (cls) => [{ form: boundForm, N0: cls[0].N0 }]
  });
  const omcsq2 = (f) => [{ atom: { kind: 'omcsq', form: f }, coeff: q(2) }];

  const spec = {
    kind: 'dot', familyLabel: '2d = e', C: CF,
    S: { order: CF.member.d, xi: D.XI_2PI3 },
    W: omcsq2(CF.member.c), gConst: q(2, 3), gMembers: ['a', 'b', 'c'], anchored: ['d', 'e'],
    subs: {
      '1,1,1,-1': {                                        /* 2c = d */
        kind: 'dot', C: S1, S: { order: S1.member.c, xi: D.XI_2PI3 },
        W: omcsq2(S1.member.b), gConst: q(2, 3), gMembers: ['a', 'b'], anchored: ['c', 'd', 'e'],
        subs: {
          '1,1,-1': closure(P11, { order: P11.member.b, xi: D.XI_2PI3 }, { order: P11.member.a, xi: D.XI_PI }, P11.member.b),
          '1,0,-1': closure(P12, { order: P12.member.c, xi: D.XI_2PI3 }, { order: P12.member.a, xi: D.XI_4PI3 }, P12.member.c)
        }
      },
      '1,0,0,-1': {                                        /* a+c = d */
        kind: 'dot', C: S2, S: { order: S2.member.d, xi: D.XI_2PI3 },
        W: omcsq2(S2.member.b), gConst: q(2, 3), gMembers: ['a', 'b', 'c'], anchored: ['d', 'e'],
        subs: {
          '0,1,-1': closure(P21, { order: P21.member.b, xi: D.XI_2PI3 }, { order: P21.member.a, xi: D.XI_2PI3 }, P21.member.b),
          '1,1,-1': closure(P22, { order: P22.member.b, xi: D.XI_2PI3 }, { order: P22.member.a, xi: D.XI_4PI3 }, P22.member.b)
        }
      },
      '1,1,0,-1': {                                        /* b+c = d */
        kind: 'dot', C: S3, S: { order: S3.member.d, xi: D.XI_2PI3 },
        W: omcsq2(S3.member.a), gConst: q(2, 3), gMembers: ['a', 'b', 'c'], anchored: ['d', 'e'],
        subs: {
          '1,-1,0': closure(P31, { order: P31.member.d, xi: D.XI_2PI3 }, { order: P31.member.a, xi: D.XI_2PI3 }, P31.member.d),
          '1,-1,-1': closure(P32, { order: P32.member.a, xi: D.XI_2PI3 }, { order: P32.member.b, xi: D.XI_4PI3 }, P32.member.a)
        }
      }
    }
  };
  return CL.closeFamily(rootKeyOf(gen5, '2d = e'), spec, {
    target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5)
  });
});

/* ---- lambda(5) family: c+d = e --------------------------------------------- */
/* The whole family closes in ONE dot: S(e, pi), omcsq b, base 0, dip -5/3,
   and the symbolic inner product raises NO positive-delta condition. */
stage('lambda5-family: c+d = e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  const C = F.ctx(['a', 'b', 'c', 'd'], { e: { c: 1, d: 1 } });
  return CL.closeFamily(rootKeyOf(gen5, 'c+d = e'), {
    kind: 'dot', familyLabel: 'c+d = e', C,
    S: { order: C.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.b }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], subs: {}
  }, { target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5) });
});

/* ---- lambda(5) family: b+d = e --------------------------------------------- */
/* One positive at each of two dot levels (2a = c, then its k = v slice),
   ending in a single 2-dof anchored closure. */
stage('lambda5-family: b+d = e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  const C = F.ctx(['a', 'b', 'c', 'd'], { e: { b: 1, d: 1 } });
  /* & c = 2a, cone (u,k,v): a=u+k, b=2u+k, c=2u+2k, d=2u+2k+v */
  const BD1 = { n: 3, names: ['u', 'k', 'v'], member: { a: [1n, 1n, 0n], b: [2n, 1n, 0n], c: [2n, 2n, 0n], d: [2n, 2n, 1n], e: [4n, 3n, 1n] }, defs: {} };
  /* & k = v: {u+k, 2u+k, 2u+2k, 2u+3k, 4u+4k} */
  const BDL = { n: 2, names: ['u', 'k'], member: { a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [2n, 3n], e: [4n, 4n] }, defs: {} };
  return CL.closeFamily(rootKeyOf(gen5, 'b+d = e'), {
    kind: 'dot', familyLabel: 'b+d = e', C,
    S: { order: C.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.a }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'],
    subs: {
      '1,-1,-1,0': {
        kind: 'dot', C: BD1, S: { order: BD1.member.e, xi: D.XI_PI },
        W: [{ atom: { kind: 'omcsq', form: BD1.member.c }, coeff: q(2) }],
        gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'],
        subs: {
          '0,1,-1': { kind: 'closure', C: BDL,
            closures: [{ Se: { order: BDL.member.a, xi: D.XI_PI2 }, So: { order: BDL.member.b, xi: D.XI_PI } }],
            bounds: (cls) => [{ form: BDL.member.a, N0: cls[0].N0 }] }
        }
      }
    }
  }, { target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5) });
});

/* ---- lambda(5) family: a+d = e — the extremizer's family ------------------- */
/* The deepest tree of the campaign, and the site of its structural discovery:
   the sub-cone b+c = a+d (a double sum system, e = a+d = b+c) provably
   admits NO classical Section-5 weight — on S(e, pi) every match is
   annihilated by its complement wrap (cos k*pi + cos (k-1)*pi = 0), so base
   = w0*g0 > 0 for EVERY nonnegative weight. On S(e, 2pi/3) the wrap sum at
   k = 1 mod 3 is -1, and a Fejer-Riesz comb along the classes m+e pumps the
   base negative at g0 = 7/6 (dip -7/6 - 1/2 = -5/3 still clears): the 'sq'
   atom |(1 + z_a)(5 + 7 z_b + 5 z_b^2)|^2 with z_m = e^{i(m+e)theta} gives
   base -8. Its six positive conditions are ordinary 2-dof cones. The
   extremizer {1,2,4,5,6} lives on THREE walls: cone B of the 3c = 2a+2d
   split, and cones K3/K6 of the core. */
stage('lambda5-family: a+d = e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  const C = F.ctx(['a', 'b', 'c', 'd'], { e: { a: 1, d: 1 } });
  const cl2 = (C2, Se, So, boundForm, skip) => ({
    kind: 'closure', C: C2,
    closures: [{ Se, So }],
    bounds: (cls) => [{ form: boundForm, N0: cls[0].N0 }],
    skip: skip || []
  });
  const W16 = [1, 2, 4, 5, 6];

  /* sub1: 2c = a+d, cone (a,u,v): d = 2c-a, e = 2c */
  const U1 = { n: 3, names: ['a', 'u', 'v'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [1n, 1n, 1n], d: [1n, 2n, 2n], e: [2n, 2n, 2n] }, defs: {} };
  /* sub2: 3c = 2a+2d (c = 2gam, d = 3gam-a, e = 3gam; a < gam, a < b < 2gam),
     triangulated on b vs gam and, above gam, on a vs w = b - gam */
  const S2A = { n: 3, names: ['a', 'p', 'r'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 2n], d: [2n, 3n, 3n], e: [3n, 3n, 3n] }, defs: {} };
  const S2B = { n: 2, names: ['a', 'r'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 2n], d: [2n, 3n], e: [3n, 3n] }, defs: {} };
  const S2C1 = { n: 3, names: ['a', 'i', 'j'], member: { a: [1n, 0n, 0n], b: [2n, 2n, 1n], c: [2n, 2n, 2n], d: [2n, 3n, 3n], e: [3n, 3n, 3n] }, defs: {} };
  const S2C2 = { n: 3, names: ['w', 'k', 'l'], member: { a: [1n, 1n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 2n], d: [2n, 2n, 3n], e: [3n, 3n, 3n] }, defs: {} };
  const S2C3 = { n: 2, names: ['a', 'l'], member: { a: [1n, 0n], b: [2n, 1n], c: [2n, 2n], d: [2n, 3n], e: [3n, 3n] }, defs: {} };
  const K7 = { n: 2, names: ['a', 'i'], member: { a: [1n, 0n], b: [3n, 3n], c: [4n, 4n], d: [5n, 6n], e: [6n, 6n] }, defs: {} };
  const K8 = { n: 2, names: ['k', 'l'], member: { a: [2n, 1n], b: [3n, 3n], c: [4n, 4n], d: [4n, 5n], e: [6n, 6n] }, defs: {} };
  /* sub3: b+2c = 2a+2d (b = 2*(a+d-c)), cone (a,s,t) */
  const U3 = { n: 3, names: ['a', 's', 't'], member: { a: [1n, 0n, 0n], b: [2n, 2n, 0n], c: [2n, 2n, 1n], d: [2n, 3n, 1n], e: [3n, 3n, 1n] }, defs: {} };
  const T1 = { n: 2, names: ['a', 's'], member: { a: [1n, 0n], b: [2n, 2n], c: [3n, 3n], d: [3n, 4n], e: [4n, 4n] }, defs: {} };
  const T2 = { n: 2, names: ['a', 's'], member: { a: [1n, 0n], b: [2n, 2n], c: [4n, 4n], d: [4n, 5n], e: [5n, 5n] }, defs: {} };
  /* sub4: b+c = a+d, THE CORE, cone (a,u,v) with u = b-a, v = c-b */
  const U4 = { n: 3, names: ['a', 'u', 'v'], member: { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [1n, 1n, 1n], d: [1n, 2n, 1n], e: [2n, 2n, 1n] }, defs: {} };
  const K1 = { n: 2, names: ['u', 'v'], member: { a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [3n, 2n], e: [4n, 3n] }, defs: {} };
  const K2 = { n: 2, names: ['a', 'u'], member: { a: [1n, 0n], b: [1n, 1n], c: [3n, 1n], d: [3n, 2n], e: [4n, 2n] }, defs: {} };
  const K3 = { n: 2, names: ['a', 'u'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 2n], d: [2n, 3n], e: [3n, 3n] }, defs: {} };
  const K4 = { n: 2, names: ['a', 'u'], member: { a: [1n, 0n], b: [1n, 1n], c: [3n, 2n], d: [3n, 3n], e: [4n, 3n] }, defs: {} };
  const K5 = { n: 2, names: ['a', 'u'], member: { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [2n, 2n], e: [3n, 2n] }, defs: {} };
  const K6 = { n: 2, names: ['a', 'v'], member: { a: [1n, 0n], b: [2n, 0n], c: [2n, 1n], d: [3n, 1n], e: [4n, 1n] }, defs: {} };
  /* the Fejer-Riesz comb weight for the core */
  const ae = F.add(U4.member.a, U4.member.e), be = F.add(U4.member.b, U4.member.e);
  const combTerms = [];
  [1n, 1n].forEach((cj, j) => [5n, 7n, 5n].forEach((ck, k) =>
    combTerms.push({ form: F.add(F.scale(ae, j), F.scale(be, k)), coeff: Q.R(cj * ck, 1n) })));

  const dotB = (C3, extra) => Object.assign({
    kind: 'dot', C: C3, S: { order: C3.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member.b }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], subs: {}
  }, extra || {});

  return CL.closeFamily(rootKeyOf(gen5, 'a+d = e'), {
    kind: 'dot', familyLabel: 'a+d = e', C,
    S: { order: C.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.c }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'],
    subs: {
      '0,1,1,-1': dotB(U1),                                   /* 2c = a+d: no positives */
      '1,-1,-1,2': {                                          /* 3c = 2a+2d: 5-cone split */
        kind: 'split', parts: [
          Object.assign(dotB(S2A), { partLabel: 'b<gam' }),
          Object.assign(cl2(S2B, { order: S2B.member.b, xi: D.XI_2PI3 }, { order: S2B.member.a, xi: D.XI_PI }, S2B.member.b, [W16]), { partLabel: 'b=gam (wall)' }),
          Object.assign(dotB(S2C1, { subs: {
            '1,1,-1': cl2(K7, { order: [1n, 1n], xi: D.XI_PI3 }, { order: K7.member.a, xi: D.XI_PI }, [1n, 1n]) } }), { partLabel: 'b>gam, a<w' }),
          Object.assign(dotB(S2C2, { subs: {
            '1,-1,-1': cl2(K8, { order: [1n, 1n], xi: D.XI_PI3 }, { order: K8.member.a, xi: D.XI_PI }, [1n, 1n]) } }), { partLabel: 'b>gam, a>w' }),
          Object.assign(cl2(S2C3, { order: [1n, 1n], xi: D.XI_PI2 }, { order: S2C3.member.a, xi: D.XI_PI2 }, [1n, 1n]), { partLabel: 'b=gam+a' })
        ]
      },
      '1,-1,0,2': dotB(U3, { subs: {                          /* b+2c = 2a+2d */
        '1,1,-1': cl2(T1, { order: [1n, 1n], xi: D.XI_PI3 }, { order: T1.member.a, xi: D.XI_2PI3 }, [1n, 1n]),
        '2,2,-1': cl2(T2, { order: [1n, 1n], xi: D.XI_2PI3 }, { order: T2.member.a, xi: D.XI_2PI3 }, [1n, 1n]) } }),
      '0,1,0,-1': {                                           /* b+c = a+d: THE CORE */
        kind: 'dot', C: U4, S: { order: U4.member.e, xi: D.XI_2PI3, Bmax: 14 },
        W: [{ atom: { kind: 'sq', terms: combTerms }, coeff: q(1) }],
        gConst: q(7, 6), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], witnessBox: 20,
        subs: {
          '1,-1,-1': cl2(K1, { order: K1.member.a, xi: D.XI_PI3 }, { order: K1.member.b, xi: D.XI_2PI3 }, K1.member.a),
          '2,0,-1': cl2(K2, { order: K2.member.b, xi: D.XI_PI }, { order: K2.member.a, xi: D.XI_PI }, K2.member.b, [W16]),
          '1,1,-1': cl2(K3, { order: K3.member.b, xi: D.XI_2PI3 }, { order: K3.member.a, xi: D.XI_PI }, K3.member.b, [W16]),
          '2,1,-1': cl2(K4, { order: K4.member.b, xi: D.XI_PI }, { order: K4.member.a, xi: D.XI_PI }, K4.member.b),
          '1,0,-1': cl2(K5, { order: K5.member.b, xi: D.XI_PI3 }, { order: K5.member.a, xi: D.XI_2PI3 }, K5.member.b),
          '1,-1,0': cl2(K6, { order: K6.member.c, xi: D.XI_PI2 }, { order: K6.member.a, xi: D.XI_PI2 }, K6.member.c, [W16])
        }
      }
    }
  }, { target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5) });
});

save();
console.log('certs/lambda56-campaign.json written · ' + failures + ' failed stage(s) · ' + (Date.now() - t0) + ' ms');
if (record.stages['lambda5-generic'] && record.stages['lambda5-generic'].ok) {
  const s = record.stages['lambda5-generic'];
  console.log('  lambda(5) generic: base ' + s.base + ', dip ' + s.dip + ', worklist ' + s.worklist.length
    + ' families, ' + s.closedFree.length + ' closed free');
  console.log('    worklist: ' + s.worklist.map(w => w.family).join(' · '));
}
if (record.stages['lambda6-generic'] && record.stages['lambda6-generic'].ok) {
  const s = record.stages['lambda6-generic'];
  console.log('  lambda(6) generic: base ' + s.base + ', dip ' + s.dip + ', worklist ' + s.worklist.length
    + ' families, ' + s.closedFree.length + ' closed free');
  console.log('    worklist: ' + s.worklist.map(w => w.family).join(' · '));
}
process.exit(failures ? 1 : 0);
