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
/* ONLY=<substring> reruns just the matching stages, carrying every other
   stage forward from the existing record UNCHANGED — an iteration tool for
   family assembly. A full no-ONLY run (the one that counts) recomputes
   everything; the battery checks the record whichever way it was written. */
const ONLY = process.env.ONLY || null;
if (ONLY) {
  try {
    const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    record.stages = prev.stages || {};
    console.log('  ONLY="' + ONLY + '": carrying ' + Object.keys(record.stages).length + ' recorded stages forward');
  } catch (e) { console.log('  ONLY set but no existing record — running matching stages fresh'); }
}
const stage = (name, fn) => {
  /* the calibration gate and the generic theorems always run — they are
     cheap, they are the gate, and the family stages consume their output */
  const always = name.includes('generic') || name.includes('calibration') || name === 'targets';
  const wanted = !ONLY || ONLY.split('|').some(pat => name.includes(pat));
  if (ONLY && !wanted && !always) return;
  const t = Date.now();
  try {
    record.stages[name] = Object.assign({ ok: true }, fn());
    record.stages[name].ms = Date.now() - t;
    console.log('  stage ' + name + ': ok (' + (Date.now() - t) + ' ms)');
  } catch (e) {
    failures++;
    record.stages[name] = { ok: false, error: e.message, ms: Date.now() - t };
    console.log('  stage ' + name + ': FAILED — ' + e.message.slice(0, 160));
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

/* ---- lambda(5) family: a+2d = 2e ------------------------------------------- */
/* a = 2*al, e = d + al. Six level-3 subtrees off the omcsq-a dot: three
   close with zero exceptions (2d = 3a, e = 2d-b, e = 2d-c), the rest reduce
   to 2-dof leaves closed by searched anchors. d = 2a triangulates on the
   midpoint 3al (which is what dissolves its parity constraint) into seven
   cones. No walls: {1,2,4,5,6} is not in this family. */
stage('lambda5-family: a+2d = 2e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  const C = { n: 4, names: ['al', 'p', 'q', 'r'], member: { a: [2n, 0n, 0n, 0n], b: [2n, 1n, 0n, 0n], c: [2n, 1n, 1n, 0n], d: [2n, 1n, 1n, 1n], e: [3n, 1n, 1n, 1n] }, defs: {} };
  const K = (member) => ({ kind: 'auto', C: { n: 2, names: ['x', 'y'], member, defs: {} } });
  const dotW = (C3, m, subs) => ({
    kind: 'dot', C: C3, S: { order: C3.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member[m] }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], subs: subs || {}
  });

  /* E2: b = 2a, cone (al,q,r) */
  const E2C = { n: 3, names: ['al', 'q', 'r'], member: { a: [2n, 0n, 0n], b: [4n, 0n, 0n], c: [4n, 1n, 0n], d: [4n, 1n, 1n], e: [5n, 1n, 1n] }, defs: {} };
  const E2ral = K({ a: [2n, 0n], b: [4n, 0n], c: [4n, 1n], d: [5n, 1n], e: [6n, 1n] });  /* r = al (two keys, one hyperplane) */
  /* E3: c = 2a, split on p vs al */
  const E3a = { n: 3, names: ['p', 'i', 'r'], member: { a: [2n, 2n, 0n], b: [3n, 2n, 0n], c: [4n, 4n, 0n], d: [4n, 4n, 1n], e: [5n, 5n, 1n] }, defs: {} };
  const E3c = { n: 3, names: ['i', 'j', 'r'], member: { a: [2n, 2n, 0n], b: [4n, 3n, 0n], c: [4n, 4n, 0n], d: [4n, 4n, 1n], e: [5n, 5n, 1n] }, defs: {} };
  const E3cral = K({ a: [2n, 2n], b: [4n, 3n], c: [4n, 4n], d: [5n, 4n], e: [6n, 5n] });  /* r = i, two keys */
  /* E4: d = 2a, split on the midpoint 3al */
  const E4i = { n: 3, names: ['p', 'q', 'r'], member: { a: [2n, 2n, 2n], b: [3n, 2n, 2n], c: [3n, 3n, 2n], d: [4n, 4n, 4n], e: [5n, 5n, 5n] }, defs: {} };
  const E4iiiA = { n: 3, names: ['p', 'm', 'j'], member: { a: [2n, 2n, 2n], b: [3n, 2n, 2n], c: [4n, 4n, 3n], d: [4n, 4n, 4n], e: [5n, 5n, 5n] }, defs: {} };
  const E4iiiC = { n: 3, names: ['s', 'm', 'i'], member: { a: [2n, 2n, 2n], b: [3n, 3n, 2n], c: [4n, 3n, 3n], d: [4n, 4n, 4n], e: [5n, 5n, 5n] }, defs: {} };
  const E4v = { n: 3, names: ['u', 'v', 'w'], member: { a: [2n, 2n, 2n], b: [4n, 3n, 3n], c: [4n, 4n, 3n], d: [4n, 4n, 4n], e: [5n, 5n, 5n] }, defs: {} };

  return CL.closeFamily(rootKeyOf(gen5, 'a+2d = 2e'), {
    kind: 'dot', familyLabel: 'a+2d = 2e', C,
    S: { order: C.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.a }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'],
    subs: {
      '1,-1,-1,-1': dotW({ n: 3, names: ['p', 'q', 'r'], member: { a: [2n, 2n, 2n], b: [3n, 2n, 2n], c: [3n, 3n, 2n], d: [3n, 3n, 3n], e: [4n, 4n, 4n] }, defs: {} }, 'd'),  /* 2d = 3a */
      '2,-1,0,0': dotW(E2C, 'c', {                                        /* b = 2a */
        '2,0,-2': E2ral, '1,0,-1': E2ral,
        '3,1,-1': K({ a: [2n, 0n], b: [4n, 0n], c: [4n, 1n], d: [7n, 2n], e: [8n, 2n] }),
        '4,1,-1': K({ a: [2n, 0n], b: [4n, 0n], c: [4n, 1n], d: [8n, 2n], e: [9n, 2n] }),
        '3,0,-1': K({ a: [2n, 0n], b: [4n, 0n], c: [4n, 1n], d: [7n, 1n], e: [8n, 1n] }),
        '2,1,-1': K({ a: [2n, 0n], b: [4n, 0n], c: [4n, 1n], d: [6n, 2n], e: [7n, 2n] }),
        '2,1,-2': K({ a: [2n, 0n], b: [4n, 0n], c: [4n, 2n], d: [5n, 3n], e: [6n, 3n] })
      }),
      '2,-1,-1,0': { kind: 'split', parts: [                              /* c = 2a */
        Object.assign(dotW(E3a, 'b', {
          '1,-1,-1': K({ a: [4n, 2n], b: [5n, 3n], c: [8n, 4n], d: [8n, 5n], e: [10n, 6n] }),
          '2,0,-1': K({ a: [2n, 2n], b: [3n, 2n], c: [4n, 4n], d: [6n, 4n], e: [7n, 5n] }),
          '2,1,-1': K({ a: [2n, 2n], b: [3n, 2n], c: [4n, 4n], d: [6n, 5n], e: [7n, 6n] })
        }), { partLabel: 'b-a < al' }),
        Object.assign(K({ a: [2n, 0n], b: [3n, 0n], c: [4n, 0n], d: [4n, 1n], e: [5n, 1n] }), { partLabel: 'b-a = al' }),
        Object.assign(dotW(E3c, 'b', {
          '2,0,-2': E3cral, '1,0,-1': E3cral,
          '3,1,-1': K({ a: [2n, 2n], b: [4n, 3n], c: [4n, 4n], d: [7n, 5n], e: [8n, 6n] }),
          '4,2,-1': K({ a: [2n, 2n], b: [4n, 3n], c: [4n, 4n], d: [8n, 6n], e: [9n, 7n] }),
          '2,0,-1': K({ a: [2n, 2n], b: [4n, 3n], c: [4n, 4n], d: [6n, 4n], e: [7n, 5n] }),
          '2,-1,-2': K({ a: [2n, 6n], b: [4n, 10n], c: [4n, 12n], d: [5n, 12n], e: [6n, 15n] }),
          '3,2,-1': K({ a: [2n, 2n], b: [4n, 3n], c: [4n, 4n], d: [7n, 6n], e: [8n, 7n] })
        }), { partLabel: 'b-a > al' })
      ] },
      '2,-1,-1,-1': { kind: 'split', parts: [                             /* d = 2a */
        Object.assign(dotW(E4i, 'b', {
          '1,-1,-1': K({ a: [4n, 4n], b: [5n, 5n], c: [6n, 5n], d: [8n, 8n], e: [10n, 10n] }),
          '1,0,-1': K({ a: [4n, 2n], b: [5n, 2n], c: [5n, 3n], d: [8n, 4n], e: [10n, 5n] })
        }), { partLabel: 'b,c < 3al' }),
        Object.assign(K({ a: [2n, 2n], b: [3n, 2n], c: [3n, 3n], d: [4n, 4n], e: [5n, 5n] }), { partLabel: 'c = 3al' }),
        Object.assign(dotW(E4iiiA, 'b', {
          '1,-1,-1': K({ a: [4n, 4n], b: [5n, 5n], c: [8n, 7n], d: [8n, 8n], e: [10n, 10n] })
        }), { partLabel: 'b<3al<c, b-2al < c-3al' }),
        Object.assign(K({ a: [2n, 2n], b: [3n, 2n], c: [4n, 3n], d: [4n, 4n], e: [5n, 5n] }), { partLabel: 'b<3al<c, equal offsets' }),
        Object.assign(dotW(E4iiiC, 'b', {
          '1,1,-1': K({ a: [4n, 4n], b: [5n, 5n], c: [7n, 6n], d: [8n, 8n], e: [10n, 10n] })
        }), { partLabel: 'b<3al<c, b-2al > c-3al' }),
        Object.assign(K({ a: [2n, 2n], b: [3n, 3n], c: [4n, 3n], d: [4n, 4n], e: [5n, 5n] }), { partLabel: 'b = 3al' }),
        Object.assign(dotW(E4v, 'b', {
          '2,0,-1': K({ a: [6n, 2n], b: [10n, 3n], c: [10n, 4n], d: [12n, 4n], e: [15n, 5n] }),
          '2,-1,-1': { kind: 'split', parts: [
            Object.assign(K({ a: [6n, 6n], b: [10n, 10n], c: [11n, 10n], d: [12n, 12n], e: [15n, 15n] }), { partLabel: 'v < u' }),
            Object.assign({ kind: 'ray', A: [6, 10, 11, 12, 15] }, { partLabel: 'v = u' }),
            Object.assign(K({ a: [6n, 6n], b: [10n, 10n], c: [12n, 11n], d: [12n, 12n], e: [15n, 15n] }), { partLabel: 'v > u' })
          ] }
        }), { partLabel: '3al < b' })
      ] },
      '1,0,-1,-1': dotW({ n: 3, names: ['p', 'q', 'r'], member: { a: [0n, 2n, 2n], b: [1n, 2n, 2n], c: [1n, 3n, 2n], d: [1n, 3n, 3n], e: [1n, 4n, 4n] }, defs: {} }, 'd'),  /* e = 2d-b */
      '1,0,0,-1': dotW({ n: 3, names: ['al', 'p', 'q'], member: { a: [2n, 0n, 0n], b: [2n, 1n, 0n], c: [2n, 1n, 1n], d: [3n, 1n, 1n], e: [4n, 1n, 1n] }, defs: {} }, 'd')  /* e = 2d-c */
    }
  }, { target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5) });
});

/* ---- lambda(5) family: b+2d = 2e ------------------------------------------- */
/* b = 2*be, e = d + be. Root splits on a vs be; the extremizer {1,2,4,5,6}
   sits INTERIOR to the a = be cone and is walled in both of that cone's
   sum leaves (2a = c-b and a = e-d). */
stage('lambda5-family: b+2d = 2e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  const M = (names, mm) => ({ n: names.length, names, member: mm, defs: {} });
  const K = (mm, skip) => ({ kind: 'auto', C: M(['x', 'y'], mm), skip: skip || [] });
  const dotW = (C3, m, subs) => ({
    kind: 'dot', C: C3, S: { order: C3.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member[m] }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: Object.keys(C3.member).filter(x => x !== 'e'), anchored: ['e'], subs: subs || {}
  });
  const W16 = [1, 2, 4, 5, 6];

  const BB1 = M(['a', 'i', 'q', 's'], { a: [1n, 0n, 0n, 0n], b: [2n, 2n, 0n, 0n], c: [2n, 2n, 1n, 0n], d: [2n, 2n, 1n, 1n], e: [3n, 3n, 1n, 1n] });
  const BB2 = M(['a', 'q', 's'], { a: [1n, 0n, 0n], b: [2n, 0n, 0n], c: [2n, 1n, 0n], d: [2n, 1n, 1n], e: [3n, 1n, 1n] });
  const BB3 = M(['t', 'm', 'q', 's'], { a: [2n, 1n, 0n, 0n], b: [2n, 2n, 0n, 0n], c: [2n, 2n, 1n, 0n], d: [2n, 2n, 1n, 1n], e: [3n, 3n, 1n, 1n] });
  const BB32 = M(['t', 'm', 's'], { a: [2n, 1n, 0n], b: [2n, 2n, 0n], c: [4n, 2n, 0n], d: [4n, 2n, 1n], e: [5n, 3n, 1n] });
  const BB33a = M(['q', 'i', 'm'], { a: [2n, 2n, 1n], b: [2n, 2n, 2n], c: [3n, 2n, 2n], d: [4n, 4n, 2n], e: [5n, 5n, 3n] });
  const BB33c = M(['i', 'j', 'm'], { a: [2n, 2n, 1n], b: [2n, 2n, 2n], c: [4n, 3n, 2n], d: [4n, 4n, 2n], e: [5n, 5n, 3n] });
  const BB35 = M(['t', 'm', 'q'], { a: [2n, 1n, 0n], b: [2n, 2n, 0n], c: [2n, 2n, 1n], d: [3n, 2n, 1n], e: [4n, 3n, 1n] });

  return CL.closeFamily(rootKeyOf(gen5, 'b+2d = 2e'), {
    kind: 'split', familyLabel: 'b+2d = 2e',
    parts: [
      Object.assign(dotW(BB1, 'a'), { partLabel: 'a < be' }),
      Object.assign(dotW(BB2, 'b', {
        '1,-1,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [3n, 2n], d: [3n, 3n], e: [4n, 4n] }),
        '2,-1,0': K({ a: [1n, 0n], b: [2n, 0n], c: [4n, 0n], d: [4n, 1n], e: [5n, 1n] }, [W16]),
        '1,0,-1': K({ a: [1n, 0n], b: [2n, 0n], c: [2n, 1n], d: [3n, 1n], e: [4n, 1n] }, [W16])
      }), { partLabel: 'a = be (extremizer cone)' }),
      Object.assign(dotW(BB3, 'a', {
        '1,-1,-1,-1': dotW(M(['m', 'q', 's'], { a: [3n, 2n, 2n], b: [4n, 2n, 2n], c: [4n, 3n, 2n], d: [4n, 3n, 3n], e: [6n, 4n, 4n] }), 'b'),
        '2,0,-1,0': dotW(BB32, 'b', {
          '1,-1,1': K({ a: [3n, 1n], b: [4n, 2n], c: [6n, 2n], d: [6n, 3n], e: [8n, 4n] }),
          '1,1,-1': K({ a: [2n, 1n], b: [2n, 2n], c: [4n, 2n], d: [5n, 3n], e: [6n, 4n] }),
          '0,2,-1': K({ a: [2n, 1n], b: [2n, 2n], c: [4n, 2n], d: [4n, 4n], e: [5n, 5n] })
        }),
        '2,0,-1,-1': { kind: 'split', parts: [
          Object.assign(dotW(BB33a, 'b', {
            '1,1,-1': K({ a: [3n, 3n], b: [4n, 4n], c: [5n, 4n], d: [6n, 6n], e: [8n, 8n] }),
            '0,1,-1': K({ a: [2n, 3n], b: [2n, 4n], c: [3n, 4n], d: [4n, 6n], e: [5n, 8n] })
          }), { partLabel: 'q < t' }),
          Object.assign(K({ a: [2n, 1n], b: [2n, 2n], c: [3n, 2n], d: [4n, 2n], e: [5n, 3n] }), { partLabel: 'q = t' }),
          Object.assign(dotW(BB33c, 'b', {
            '1,1,-1': K({ a: [3n, 3n], b: [4n, 4n], c: [6n, 5n], d: [6n, 6n], e: [8n, 8n] })
          }), { partLabel: 'q > t' })
        ] },
        '1,0,-1,-1': dotW(M(['m', 'q', 's'], { a: [1n, 2n, 2n], b: [2n, 2n, 2n], c: [2n, 3n, 2n], d: [2n, 3n, 3n], e: [3n, 4n, 4n] }), 'd'),
        '1,0,0,-1': dotW(BB35, 'b', {
          '0,1,-1': K({ a: [2n, 1n], b: [2n, 2n], c: [2n, 3n], d: [3n, 3n], e: [4n, 4n] }),
          '1,2,-1': K({ a: [2n, 1n], b: [2n, 2n], c: [3n, 4n], d: [4n, 4n], e: [5n, 5n] })
        })
      }), { partLabel: 'be < a < 2be' })
    ]
  }, { target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5) });
});

/* ---- lambda(5) family: c+2d = 2e ------------------------------------------- */
/* c = 2*gam, e = d + gam. Root splits on b vs gam, then (above gam) on a vs
   w = b - gam and a vs gam: seven cones. Four close with no exceptions; the
   rest bottom out in 2-dof leaves. No walls: the extremizer is not here. */
stage('lambda5-family: c+2d = 2e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  const M = (names, mm) => ({ n: names.length, names, member: mm, defs: {} });
  const K = (mm) => ({ kind: 'auto', C: M(['x', 'y'], mm) });
  const dotW = (C3, m, subs) => ({
    kind: 'dot', C: C3, S: { order: C3.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member[m] }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: Object.keys(C3.member).filter(x => x !== 'e'), anchored: ['e'], subs: subs || {}
  });

  const CC1 = M(['a', 'p', 'r', 's'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [2n, 2n, 2n, 0n], d: [2n, 2n, 2n, 1n], e: [3n, 3n, 3n, 1n] });
  const CC2 = M(['a', 'p', 's'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 0n], d: [2n, 2n, 1n], e: [3n, 3n, 1n] });
  const CC3 = M(['a', 'm', 'i', 's'], { a: [1n, 0n, 0n, 0n], b: [2n, 2n, 1n, 0n], c: [2n, 2n, 2n, 0n], d: [2n, 2n, 2n, 1n], e: [3n, 3n, 3n, 1n] });
  const CC4 = M(['w', 'i', 's'], { a: [1n, 0n, 0n], b: [2n, 1n, 0n], c: [2n, 2n, 0n], d: [2n, 2n, 1n], e: [3n, 3n, 1n] });
  const CC5 = M(['w', 'k', 'l', 's'], { a: [1n, 1n, 0n, 0n], b: [2n, 1n, 1n, 0n], c: [2n, 2n, 2n, 0n], d: [2n, 2n, 2n, 1n], e: [3n, 3n, 3n, 1n] });
  const CC51 = M(['w', 'k', 's'], { a: [1n, 1n, 0n], b: [2n, 2n, 0n], c: [2n, 4n, 0n], d: [2n, 4n, 1n], e: [3n, 6n, 1n] });
  const CC6 = M(['w', 'i', 's'], { a: [1n, 1n, 0n], b: [2n, 1n, 0n], c: [2n, 2n, 0n], d: [2n, 2n, 1n], e: [3n, 3n, 1n] });
  const CC7 = M(['t', 'm', 'i', 's'], { a: [2n, 1n, 1n, 0n], b: [2n, 2n, 1n, 0n], c: [2n, 2n, 2n, 0n], d: [2n, 2n, 2n, 1n], e: [3n, 3n, 3n, 1n] });
  const CC72 = M(['t', 'm', 'i'], { a: [2n, 1n, 1n], b: [2n, 2n, 1n], c: [2n, 2n, 2n], d: [4n, 2n, 2n], e: [5n, 3n, 3n] });

  return CL.closeFamily(rootKeyOf(gen5, 'c+2d = 2e'), {
    kind: 'split', familyLabel: 'c+2d = 2e',
    parts: [
      Object.assign(dotW(CC1, 'b'), { partLabel: 'b < gam' }),
      Object.assign(dotW(CC2, 'a'), { partLabel: 'b = gam' }),
      Object.assign(dotW(CC3, 'a'), { partLabel: 'gam < b, a < w' }),
      Object.assign(dotW(CC4, 'a'), { partLabel: 'gam < b, a = w' }),
      Object.assign(dotW(CC5, 'a', {
        '0,1,-1,0': dotW(CC51, 'b', {
          '2,0,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [2n, 4n], d: [4n, 4n], e: [5n, 6n] }),
          '1,-2,-1': K({ a: [3n, 1n], b: [6n, 2n], c: [8n, 2n], d: [8n, 3n], e: [12n, 4n] }),
          '1,0,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [2n, 4n], d: [3n, 4n], e: [4n, 6n] })
        })
      }), { partLabel: 'gam < b, w < a < gam' }),
      Object.assign(dotW(CC6, 'b', {
        '1,-1,-1': K({ a: [2n, 1n], b: [3n, 2n], c: [4n, 2n], d: [4n, 3n], e: [6n, 4n] }),
        '1,0,-1': K({ a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [3n, 2n], e: [4n, 3n] })
      }), { partLabel: 'gam < b, a = gam' }),
      Object.assign(dotW(CC7, 'a', {
        '1,-1,-1,-1': dotW(M(['m', 'i', 's'], { a: [3n, 3n, 2n], b: [4n, 3n, 2n], c: [4n, 4n, 2n], d: [4n, 4n, 3n], e: [6n, 6n, 4n] }), 'b'),
        '2,0,0,-1': dotW(CC72, 'b', {
          '1,-1,1': K({ a: [3n, 2n], b: [4n, 3n], c: [4n, 4n], d: [6n, 4n], e: [8n, 6n] }),
          '1,-1,0': K({ a: [3n, 1n], b: [4n, 1n], c: [4n, 2n], d: [6n, 2n], e: [8n, 3n] })
        }),
        '1,0,0,-1': dotW(M(['t', 'm', 'i'], { a: [2n, 1n, 1n], b: [2n, 2n, 1n], c: [2n, 2n, 2n], d: [3n, 2n, 2n], e: [4n, 3n, 3n] }), 'd'),
        '1,0,-1,-1': dotW(M(['m', 'i', 's'], { a: [1n, 3n, 2n], b: [2n, 3n, 2n], c: [2n, 4n, 2n], d: [2n, 4n, 3n], e: [3n, 6n, 4n] }), 'c')
      }), { partLabel: 'gam < b, gam < a < b' })
    ]
  }, { target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5) });
});

/* ---- lambda(5) family: 3d = 2e --------------------------------------------- */
/* d = 2*dl, e = 3*dl, c < 2*dl. The family region triangulates on where c,
   b, a fall against dl (and, above dl, against the offsets v = b-dl,
   w = c-dl): SEVENTEEN cones — the price of the parity relation, exactly as
   lambda(4)'s 2d = 3c was its widest family. Every cone closes by a
   classical dot; conditions bottom out in 2-dof leaves. No walls. */
stage('lambda5-family: 3d = 2e', () => {
  if (!gen5) throw new Error('lambda5-generic did not run');
  const M = (names, mm) => ({ n: names.length, names, member: mm, defs: {} });
  const K = (mm) => ({ kind: 'auto', C: M(['x', 'y'], mm) });
  const dotW = (C3, m, subs) => ({
    kind: 'dot', C: C3, S: { order: C3.member.e, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member[m] }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd'], anchored: ['e'], subs: subs || {}
  });
  const P = (partLabel, node) => Object.assign(node, { partLabel });

  return CL.closeFamily(rootKeyOf(gen5, '3d = 2e'), {
    kind: 'split', familyLabel: '3d = 2e',
    parts: [
      P('c < dl', dotW(M(['a', 'p', 'q', 'r'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [1n, 1n, 1n, 0n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'c')),
      P('c = dl', dotW(M(['a', 'p', 'q'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [1n, 1n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'b')),
      P('b < dl < c, w < a', dotW(M(['w', 'k', 'p', 'i'], { a: [1n, 1n, 0n, 0n], b: [1n, 1n, 1n, 0n], c: [2n, 1n, 1n, 1n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'b', {
        '0,1,1,-1': dotW(M(['w', 'k', 'p'], { a: [1n, 1n, 0n], b: [1n, 1n, 1n], c: [2n, 2n, 2n], d: [2n, 4n, 4n], e: [3n, 6n, 6n] }), 'a', {
          '1,1,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [4n, 4n], d: [6n, 8n], e: [9n, 12n] })
        })
      })),
      P('b < dl < c, w = a', dotW(M(['a', 'p', 'i'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 1n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'a', {
        '1,-1,0': K({ a: [1n, 0n], b: [2n, 0n], c: [3n, 1n], d: [4n, 2n], e: [6n, 3n] })
      })),
      P('b < dl < c, a < w < b', dotW(M(['a', 'm', 'j', 'i'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 1n, 0n], c: [2n, 2n, 1n, 1n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'a', {
        '1,-1,-1,0': dotW(M(['m', 'j', 'i'], { a: [1n, 1n, 0n], b: [2n, 2n, 0n], c: [4n, 3n, 1n], d: [4n, 4n, 2n], e: [6n, 6n, 3n] }), 'b', {
          '0,1,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [4n, 4n], d: [4n, 6n], e: [6n, 9n] })
        })
      })),
      P('b < dl < c, w = b', dotW(M(['a', 'p', 'i'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'b')),
      P('b < dl < c, b < w', dotW(M(['a', 'p', 'm', 'i'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [2n, 2n, 2n, 1n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'b')),
      P('b = dl, w < a', dotW(M(['w', 'k', 'i'], { a: [1n, 1n, 0n], b: [1n, 1n, 1n], c: [2n, 1n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'a', {
        '0,1,-1': K({ a: [1n, 1n], b: [1n, 2n], c: [2n, 2n], d: [2n, 4n], e: [3n, 6n] })
      })),
      P('b = dl, w = a', dotW(M(['a', 'i'], { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [2n, 2n], e: [3n, 3n] }), 'a')),
      P('b = dl, a < w', dotW(M(['a', 'm', 'i'], { a: [1n, 0n, 0n], b: [1n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'a')),
      P('dl < b, a < v', dotW(M(['a', 'k', 'm', 'j'], { a: [1n, 0n, 0n, 0n], b: [2n, 2n, 1n, 1n], c: [2n, 2n, 2n, 1n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'a')),
      P('dl < b, a = v', dotW(M(['a', 'm', 'j'], { a: [1n, 0n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'a')),
      P('dl < b, v < a < w', dotW(M(['v', 'k', 'mm', 'j'], { a: [1n, 1n, 0n, 0n], b: [2n, 1n, 1n, 1n], c: [2n, 2n, 2n, 1n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'a', {
        '0,1,-1,-1': dotW(M(['v', 'mm', 'j'], { a: [1n, 1n, 1n], b: [2n, 2n, 2n], c: [2n, 4n, 3n], d: [2n, 4n, 4n], e: [3n, 6n, 6n] }), 'c', {
          '1,0,-1': K({ a: [2n, 1n], b: [4n, 2n], c: [5n, 4n], d: [6n, 4n], e: [9n, 6n] })
        })
      })),
      P('dl < b, a = w', dotW(M(['v', 'm', 'j'], { a: [1n, 1n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'a', {
        '0,1,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [2n, 3n], d: [2n, 4n], e: [3n, 6n] })
      })),
      P('dl < b, w < a < dl', dotW(M(['v', 'm', 'k', 'j'], { a: [1n, 1n, 1n, 0n], b: [2n, 1n, 1n, 1n], c: [2n, 2n, 1n, 1n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'a', {
        '0,0,1,-1': dotW(M(['v', 'm', 'k'], { a: [1n, 1n, 1n], b: [2n, 1n, 2n], c: [2n, 2n, 2n], d: [2n, 2n, 4n], e: [3n, 3n, 6n] }), 'b', {
          /* the {2m+3k,...} leaf: no menu anchor certifies, but its own dot
             closes with zero exceptions (the family dips far below target) */
          '1,-1,-2': dotW(M(['m', 'k'], { a: [2n, 3n], b: [3n, 6n], c: [4n, 6n], d: [4n, 8n], e: [6n, 12n] }), 'c'),
          '1,0,-2': K({ a: [1n, 3n], b: [1n, 6n], c: [2n, 6n], d: [2n, 8n], e: [3n, 12n] })
        }),
        '0,1,1,-1': dotW(M(['v', 'm', 'k'], { a: [1n, 1n, 1n], b: [2n, 2n, 2n], c: [2n, 3n, 2n], d: [2n, 4n, 4n], e: [3n, 6n, 6n] }), 'b', {
          /* like its twin above: no menu anchor, but the leaf's own dot
             closes with zero exceptions */
          '1,-1,-2': dotW(M(['m', 'k'], { a: [2n, 3n], b: [4n, 6n], c: [5n, 6n], d: [6n, 8n], e: [9n, 12n] }), 'a'),
          '1,-2,-2': dotW(M(['m', 'k'], { a: [3n, 3n], b: [6n, 6n], c: [7n, 6n], d: [8n, 8n], e: [12n, 12n] }), 'a')
        })
      })),
      P('dl < b, a = dl', dotW(M(['v', 'm', 'j'], { a: [1n, 1n, 1n], b: [2n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [3n, 3n, 3n] }), 'b', {
        '1,-1,-1': K({ a: [2n, 2n], b: [3n, 3n], c: [4n, 3n], d: [4n, 4n], e: [6n, 6n] }),
        '1,0,-1': K({ a: [2n, 1n], b: [3n, 1n], c: [3n, 2n], d: [4n, 2n], e: [6n, 3n] })
      })),
      P('dl < a', dotW(M(['z', 'y', 'm', 'j'], { a: [2n, 1n, 1n, 1n], b: [2n, 2n, 1n, 1n], c: [2n, 2n, 2n, 1n], d: [2n, 2n, 2n, 2n], e: [3n, 3n, 3n, 3n] }), 'a', {
        '1,-1,-1,-1': dotW(M(['y', 'm', 'j'], { a: [3n, 3n, 3n], b: [4n, 3n, 3n], c: [4n, 4n, 3n], d: [4n, 4n, 4n], e: [6n, 6n, 6n] }), 'b'),
        '1,0,0,-1': dotW(M(['z', 'y', 'm'], { a: [3n, 1n, 1n], b: [3n, 2n, 1n], c: [3n, 2n, 2n], d: [4n, 2n, 2n], e: [6n, 3n, 3n] }), 'b', {
          '0,1,-1': K({ a: [3n, 2n], b: [3n, 3n], c: [3n, 4n], d: [4n, 4n], e: [6n, 6n] })
        }),
        '1,0,-1,-1': dotW(M(['y', 'm', 'j'], { a: [1n, 3n, 3n], b: [2n, 3n, 3n], c: [2n, 4n, 3n], d: [2n, 4n, 4n], e: [3n, 6n, 6n] }), 'c')
      }))
    ]
  }, { target: L5, tol: 1e-10, cap: 24, topC: C5, rootConds: rootCondsOf(gen5) });
});

/* ---- lambda(6) families: the two that close in one dot ---------------------- */
/* d+e = f and 2e = f each close with ZERO positive conditions — the same
   single-atom shape as lambda(5)'s c+d = e. The other eight lambda(6)
   families await their trees (probes so far: c+e = f raises one condition,
   b+e = f two, a+e = f six and carries the extremizer {1,2,4,6,7,8}). */
stage('lambda6-family: d+e = f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  const C = F.ctx(['a', 'b', 'c', 'd', 'e'], { f: { d: 1, e: 1 } });
  return CL.closeFamily(rootKeyOf(gen6, 'd+e = f'), {
    kind: 'dot', familyLabel: 'd+e = f', C,
    S: { order: C.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.c }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd', 'e'], anchored: ['f'], subs: {}
  }, { target: L6, tol: 1e-10, cap: 21, topC: C6, rootConds: rootCondsOf(gen6) });
});
stage('lambda6-family: 2e = f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  const C = F.ctx(['a', 'b', 'c', 'd', 'e'], { f: { e: 2 } });
  return CL.closeFamily(rootKeyOf(gen6, '2e = f'), {
    kind: 'dot', familyLabel: '2e = f', C,
    S: { order: C.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.d }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd', 'e'], anchored: ['f'], subs: {}
  }, { target: L6, tol: 1e-10, cap: 21, topC: C6, rootConds: rootCondsOf(gen6) });
});

/* ---- lambda(6) family: c+e = f --------------------------------------------- */
/* One condition (d = 2b), whose region c-b < b splits on w = c-b vs a. */
stage('lambda6-family: c+e = f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  const M = (names, mm) => ({ n: names.length, names, member: mm, defs: {} });
  const K = (mm) => ({ kind: 'auto', C: M(['x', 'y'], mm) });
  const dotW = (C3, m, subs) => ({
    kind: 'dot', C: C3, S: { order: C3.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member[m] }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: Object.keys(C3.member).filter(x => x !== 'f'), anchored: ['f'], subs: subs || {}
  });
  const C = F.ctx(['a', 'b', 'c', 'd', 'e'], { f: { c: 1, e: 1 } });
  return CL.closeFamily(rootKeyOf(gen6, 'c+e = f'), {
    kind: 'dot', familyLabel: 'c+e = f', C,
    S: { order: C.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.b }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd', 'e'], anchored: ['f'],
    subs: {
      '1,1,-1,-1,0': { kind: 'split', parts: [
        Object.assign(dotW(M(['w', 'k', 'j', 's'], { a: [1n, 1n, 0n, 0n], b: [1n, 1n, 1n, 0n], c: [2n, 1n, 1n, 0n], d: [2n, 2n, 2n, 0n], e: [2n, 2n, 2n, 1n], f: [4n, 3n, 3n, 1n] }), 'a', {
          '1,1,-1,0': dotW(M(['w', 'k', 's'], { a: [1n, 1n, 0n], b: [2n, 2n, 0n], c: [3n, 2n, 0n], d: [4n, 4n, 0n], e: [4n, 4n, 1n], f: [7n, 6n, 1n] }), 'd', {
            '1,2,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [3n, 2n], d: [4n, 4n], e: [5n, 6n], f: [8n, 8n] })
          })
        }), { partLabel: 'w < a' }),
        Object.assign(dotW(M(['a', 'j', 's'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 1n, 0n], d: [2n, 2n, 0n], e: [2n, 2n, 1n], f: [4n, 3n, 1n] }), 'a', {
          '1,-1,0': K({ a: [1n, 0n], b: [2n, 0n], c: [3n, 0n], d: [4n, 0n], e: [4n, 1n], f: [7n, 1n] })
        }), { partLabel: 'w = a' }),
        Object.assign(dotW(M(['a', 'i', 'j', 's'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 1n, 0n], c: [2n, 2n, 1n, 0n], d: [2n, 2n, 2n, 0n], e: [2n, 2n, 2n, 1n], f: [4n, 4n, 3n, 1n] }), 'a', {
          '1,-1,-1,0': dotW(M(['i', 'j', 's'], { a: [1n, 1n, 0n], b: [2n, 2n, 0n], c: [4n, 3n, 0n], d: [4n, 4n, 0n], e: [4n, 4n, 1n], f: [8n, 7n, 1n] }), 'd', {
            '0,1,-1': K({ a: [1n, 1n], b: [2n, 2n], c: [4n, 3n], d: [4n, 4n], e: [4n, 5n], f: [8n, 8n] })
          })
        }), { partLabel: 'a < w < b' })
      ] }
    }
  }, { target: L6, tol: 1e-10, cap: 21, topC: C6, rootConds: rootCondsOf(gen6) });
});

/* ---- lambda(6) family: b+e = f --------------------------------------------- */
/* Two conditions, c = 2a and d = 2a; both single cones; four of their five
   sub-cones close with zero exceptions. */
stage('lambda6-family: b+e = f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  const M = (names, mm) => ({ n: names.length, names, member: mm, defs: {} });
  const K = (mm) => ({ kind: 'auto', C: M(['x', 'y'], mm) });
  const dotW = (C3, m, subs) => ({
    kind: 'dot', C: C3, S: { order: C3.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member[m] }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: Object.keys(C3.member).filter(x => x !== 'f'), anchored: ['f'], subs: subs || {}
  });
  const C = F.ctx(['a', 'b', 'c', 'd', 'e'], { f: { b: 1, e: 1 } });
  const BE12leaf = K({ a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [4n, 4n], e: [4n, 5n], f: [6n, 6n] });  /* k = s: two keys, one hyperplane */
  return CL.closeFamily(rootKeyOf(gen6, 'b+e = f'), {
    kind: 'dot', familyLabel: 'b+e = f', C,
    S: { order: C.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.a }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd', 'e'], anchored: ['f'],
    subs: {
      '1,-1,-1,0,0': dotW(M(['u', 'k', 'p', 's'], { a: [1n, 1n, 0n, 0n], b: [2n, 1n, 0n, 0n], c: [2n, 2n, 0n, 0n], d: [2n, 2n, 1n, 0n], e: [2n, 2n, 1n, 1n], f: [4n, 3n, 1n, 1n] }), 'c', {
        '0,1,-1,-1': dotW(M(['u', 'p', 's'], { a: [1n, 1n, 1n], b: [2n, 1n, 1n], c: [2n, 2n, 2n], d: [2n, 3n, 2n], e: [2n, 3n, 3n], f: [4n, 4n, 4n] }), 'a'),
        '2,2,-1,0': dotW(M(['u', 'k', 's'], { a: [1n, 1n, 0n], b: [2n, 1n, 0n], c: [2n, 2n, 0n], d: [4n, 4n, 0n], e: [4n, 4n, 1n], f: [6n, 5n, 1n] }), 'd', {
          '0,1,-1': BE12leaf, '0,2,-2': BE12leaf,
          '2,3,-1': K({ a: [1n, 1n], b: [2n, 1n], c: [2n, 2n], d: [4n, 4n], e: [6n, 7n], f: [8n, 8n] })
        }),
        '0,1,0,-1': dotW(M(['u', 'k', 'p'], { a: [1n, 1n, 0n], b: [2n, 1n, 0n], c: [2n, 2n, 0n], d: [2n, 2n, 1n], e: [2n, 3n, 1n], f: [4n, 4n, 1n] }), 'a')
      }),
      '1,-1,-1,-1,0': dotW(M(['u', 'v', 'k', 's'], { a: [1n, 1n, 1n, 0n], b: [2n, 1n, 1n, 0n], c: [2n, 2n, 1n, 0n], d: [2n, 2n, 2n, 0n], e: [2n, 2n, 2n, 1n], f: [4n, 3n, 3n, 1n] }), 'c', {
        '0,1,-1,-1': dotW(M(['u', 'k', 's'], { a: [1n, 2n, 1n], b: [2n, 2n, 1n], c: [2n, 3n, 2n], d: [2n, 4n, 2n], e: [2n, 4n, 3n], f: [4n, 6n, 4n] }), 'd'),
        '0,1,0,-1': dotW(M(['u', 'v', 'k'], { a: [1n, 1n, 1n], b: [2n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [2n, 3n, 2n], f: [4n, 4n, 3n] }), 'a')
      })
    }
  }, { target: L6, tol: 1e-10, cap: 21, topC: C6, rootConds: rootCondsOf(gen6) });
});

/* ---- lambda(6) family: a+e = f — the extremizer's family -------------------- */
/* The deepest tree of the whole campaign. Its six sub-conditions are the
   lambda(5) worklist one level down. THREE comb cores appear: the full
   double sum system b+d = a+e = 2c = f, and two 3x=2f self-wrap cones
   (3c = 2f under b+d = f, and the b+c = f slices of 3d = 2f, where the
   atom's second harmonic wraps through the defining relation — the same
   +lambda/4 obstruction, broken the same way). {1,2,4,6,7,8} is walled at
   three leaves: c = 2b and b = 2a inside the core, and d = 3*gam inside
   the b = gam slice of c+2d = 2f. */
stage('lambda6-family: a+e = f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  const M = (names, mm) => ({ n: names.length, names, member: mm, defs: {} });
  const K = (mm, skip) => ({ kind: 'auto', C: M(['x', 'y'], mm), skip: skip || [] });
  const RAY = (A) => ({ kind: 'ray', A });
  const P = (partLabel, node) => Object.assign(node, { partLabel });
  const dotW = (C3, m, subs) => ({
    kind: 'dot', C: C3, S: { order: C3.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C3.member[m] }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: Object.keys(C3.member).filter(x => x !== 'f'), anchored: ['f'], subs: subs || {}
  });
  const combW = (C3, subs) => {
    const f1 = F.add(C3.member.a, C3.member.f), f2 = F.add(C3.member.b, C3.member.f);
    const terms = [];
    [1n, 1n].forEach((cj, j) => [5n, 7n, 5n].forEach((ck, k) =>
      terms.push({ form: F.add(F.scale(f1, j), F.scale(f2, k)), coeff: Q.R(cj * ck, 1n) })));
    return { kind: 'dot', C: C3, S: { order: C3.member.f, xi: D.XI_2PI3, Bmax: 18 },
      W: [{ atom: { kind: 'sq', terms }, coeff: q(1) }],
      gConst: q(7, 6), gMembers: Object.keys(C3.member).filter(x => x !== 'f'), anchored: ['f'],
      witnessBox: 20, subs: subs || {} };
  };
  const W8 = [1, 2, 4, 6, 7, 8];
  const C = F.ctx(['a', 'b', 'c', 'd', 'e'], { f: { a: 1, e: 1 } });

  /* ---- S4: b+d = f, and inside it the core and 3c = 2f -------------------- */
  const S4 = M(['a', 'u', 'v', 'w'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [1n, 1n, 1n, 0n], d: [1n, 1n, 1n, 1n], e: [1n, 2n, 1n, 1n], f: [2n, 2n, 1n, 1n] });
  const CORE = M(['a', 'u', 'v'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [1n, 1n, 1n], d: [1n, 1n, 2n], e: [1n, 2n, 2n], f: [2n, 2n, 2n] });
  const coreVeqA = K({ a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [3n, 1n], e: [3n, 2n], f: [4n, 2n] });   /* v = a: keys [2,0,-2] and [1,0,-1] */
  const S42 = M(['a', 'i', 'j'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 2n], d: [2n, 2n, 3n], e: [2n, 3n, 3n], f: [3n, 3n, 3n] });
  const S4node = dotW(S4, 'c', {
    '0,0,1,-1': combW(CORE, {                                 /* 2c = f: THE CORE */
      '2,0,-2': coreVeqA, '1,0,-1': coreVeqA,
      '1,-1,-2': K({ a: [1n, 2n], b: [2n, 2n], c: [2n, 3n], d: [2n, 4n], e: [3n, 4n], f: [4n, 6n] }),
      '1,1,-1': K({ a: [1n, 0n], b: [1n, 1n], c: [2n, 2n], d: [3n, 3n], e: [3n, 4n], f: [4n, 4n] }, [W8]),   /* c = 2b: WALL */
      '1,1,-2': { kind: 'split', parts: [
        P('a<v', K({ a: [1n, 0n], b: [2n, 2n], c: [3n, 3n], d: [4n, 4n], e: [5n, 6n], f: [6n, 6n] })),
        P('a=v', RAY([1, 2, 3, 4, 5, 6])),
        P('a>v', K({ a: [2n, 1n], b: [2n, 2n], c: [3n, 3n], d: [4n, 4n], e: [4n, 5n], f: [6n, 6n] }))
      ] },
      '1,0,-2': K({ a: [2n, 0n], b: [2n, 1n], c: [3n, 1n], d: [4n, 1n], e: [4n, 2n], f: [6n, 2n] }),
      '2,1,-1': K({ a: [1n, 0n], b: [1n, 1n], c: [3n, 2n], d: [5n, 3n], e: [5n, 4n], f: [6n, 4n] }),
      '2,1,-2': K({ a: [1n, 0n], b: [1n, 2n], c: [2n, 3n], d: [3n, 4n], e: [3n, 6n], f: [4n, 6n] }),
      '1,-1,0': K({ a: [1n, 0n], b: [2n, 0n], c: [2n, 1n], d: [2n, 2n], e: [3n, 2n], f: [4n, 2n] }, [W8])    /* b = 2a: WALL */
    }),
    '1,1,-1,2': combW(S42, {                                  /* 3c = 2f: self-wrap core */
      '1,-1,-3': K({ a: [1n, 3n], b: [2n, 3n], c: [4n, 8n], d: [4n, 9n], e: [5n, 9n], f: [6n, 12n] }),
      '1,1,-1': K({ a: [1n, 0n], b: [1n, 1n], c: [4n, 4n], d: [5n, 5n], e: [5n, 6n], f: [6n, 6n] }),
      '1,0,-2': K({ a: [2n, 0n], b: [2n, 1n], c: [6n, 2n], d: [7n, 2n], e: [7n, 3n], f: [9n, 3n] }),
      '1,0,-3': K({ a: [3n, 0n], b: [3n, 1n], c: [8n, 2n], d: [9n, 2n], e: [9n, 3n], f: [12n, 3n] }),
      '1,0,-1': K({ a: [1n, 0n], b: [1n, 1n], c: [4n, 2n], d: [5n, 2n], e: [5n, 3n], f: [6n, 3n] }),
      '1,-1,0': K({ a: [1n, 0n], b: [2n, 0n], c: [4n, 2n], d: [4n, 3n], e: [5n, 3n], f: [6n, 3n] })
    })
  });

  /* ---- S3: b+2d = 2f (b = 2*be, f = d+be, e = d+be-a) --------------------- */
  const S3 = M(['a', 'i', 'q', 's'], { a: [1n, 0n, 0n, 0n], b: [2n, 2n, 0n, 0n], c: [2n, 2n, 1n, 0n], d: [2n, 2n, 1n, 1n], e: [2n, 3n, 1n, 1n], f: [3n, 3n, 1n, 1n] });
  const S32 = M(['a', 'i', 's'], { a: [1n, 0n, 0n], b: [2n, 2n, 0n], c: [4n, 4n, 0n], d: [4n, 4n, 1n], e: [4n, 5n, 1n], f: [5n, 5n, 1n] });
  const s32SeqBeta = K({ a: [1n, 0n], b: [2n, 2n], c: [4n, 4n], d: [5n, 5n], e: [5n, 6n], f: [6n, 6n] });   /* s = be: keys [1,1,-1] and [2,2,-2] */
  const S3node = dotW(S3, 'b', {
    '1,1,-1,-1': { kind: 'split', parts: [                    /* 2d = 3b */
      P('a<q', dotW(M(['a', 'x', 's'], { a: [1n, 0n, 0n], b: [2n, 2n, 2n], c: [3n, 3n, 2n], d: [3n, 3n, 3n], e: [3n, 4n, 4n], f: [4n, 4n, 4n] }), 'd')),
      P('a=q', dotW(M(['a', 's'], { a: [1n, 0n], b: [2n, 2n], c: [3n, 2n], d: [3n, 3n], e: [3n, 4n], f: [4n, 4n] }), 'd')),
      P('a>q', dotW(M(['q', 'k', 'l'], { a: [1n, 1n, 0n], b: [2n, 2n, 2n], c: [3n, 2n, 2n], d: [3n, 3n, 3n], e: [3n, 3n, 4n], f: [4n, 4n, 4n] }), 'd'))
    ] },
    '2,2,-1,0': dotW(S32, 'c', {                              /* c = 2b */
      '1,1,-1': s32SeqBeta, '2,2,-2': s32SeqBeta,
      '2,2,-1': K({ a: [1n, 0n], b: [2n, 2n], c: [4n, 4n], d: [6n, 6n], e: [6n, 7n], f: [7n, 7n] }),
      '3,3,-1': K({ a: [1n, 0n], b: [2n, 2n], c: [4n, 4n], d: [7n, 7n], e: [7n, 8n], f: [8n, 8n] }),
      '4,4,-1': K({ a: [1n, 0n], b: [2n, 2n], c: [4n, 4n], d: [8n, 8n], e: [8n, 9n], f: [9n, 9n] })
    }),
    '2,2,-1,-1': { kind: 'split', parts: [                    /* d = 2b, on q vs be and a */
      P('q<be, a<q', dotW(M(['a', 'x', 'r'], { a: [1n, 0n, 0n], b: [2n, 2n, 2n], c: [3n, 3n, 2n], d: [4n, 4n, 4n], e: [4n, 5n, 5n], f: [5n, 5n, 5n] }), 'c', {
        '1,1,-1': K({ a: [1n, 0n], b: [4n, 4n], c: [5n, 5n], d: [8n, 8n], e: [9n, 10n], f: [10n, 10n] }) })),
      P('q<be, a=q', K({ a: [1n, 0n], b: [2n, 2n], c: [3n, 2n], d: [4n, 4n], e: [4n, 5n], f: [5n, 5n] })),
      P('q<be, a>q', dotW(M(['q', 't', 'u'], { a: [1n, 1n, 0n], b: [2n, 2n, 2n], c: [3n, 2n, 2n], d: [4n, 4n, 4n], e: [4n, 4n, 5n], f: [5n, 5n, 5n] }), 'c', {
        '1,-1,-1': K({ a: [2n, 1n], b: [4n, 4n], c: [5n, 5n], d: [8n, 8n], e: [8n, 9n], f: [10n, 10n] }) })),
      P('q=be', K({ a: [1n, 0n], b: [2n, 2n], c: [3n, 3n], d: [4n, 4n], e: [4n, 5n], f: [5n, 5n] })),
      P('q>be, a<v', dotW(M(['a', 'y', 'w'], { a: [1n, 0n, 0n], b: [2n, 2n, 2n], c: [4n, 4n, 3n], d: [4n, 4n, 4n], e: [4n, 5n, 5n], f: [5n, 5n, 5n] }), 'c', {
        '2,2,-1': K({ a: [1n, 0n], b: [6n, 6n], c: [10n, 10n], d: [12n, 12n], e: [14n, 15n], f: [15n, 15n] }) })),
      P('q>be, a=v', K({ a: [1n, 0n], b: [2n, 2n], c: [4n, 3n], d: [4n, 4n], e: [4n, 5n], f: [5n, 5n] })),
      P('q>be, a>v', dotW(M(['v', 't2', 'z'], { a: [1n, 1n, 0n], b: [2n, 2n, 2n], c: [4n, 3n, 3n], d: [4n, 4n, 4n], e: [4n, 4n, 5n], f: [5n, 5n, 5n] }), 'c', {
        '2,-1,-1': { kind: 'split', parts: [
          P('t2<v', K({ a: [2n, 1n], b: [6n, 6n], c: [10n, 10n], d: [12n, 12n], e: [13n, 14n], f: [15n, 15n] })),
          P('t2=v', RAY([2, 6, 10, 12, 13, 15])),
          P('t2>v', K({ a: [3n, 2n], b: [6n, 6n], c: [10n, 10n], d: [12n, 12n], e: [12n, 13n], f: [15n, 15n] }))
        ] } }))
    ] },
    '1,1,0,-1': dotW(M(['a', 'i', 'q'], { a: [1n, 0n, 0n], b: [2n, 2n, 0n], c: [2n, 2n, 1n], d: [3n, 3n, 1n], e: [3n, 4n, 1n], f: [4n, 4n, 1n] }), 'd')  /* f = b+c: d floats free */
  });

  /* ---- S5: c+2d = 2f (c = 2*gam, f = d+gam, e = d+gam-a), 5-cone split ---- */
  const S5iii = M(['a', 'm', 'i', 's'], { a: [1n, 0n, 0n, 0n], b: [2n, 2n, 1n, 0n], c: [2n, 2n, 2n, 0n], d: [2n, 2n, 2n, 1n], e: [2n, 3n, 3n, 1n], f: [3n, 3n, 3n, 1n] });
  const S5v = M(['w', 'k', 'l', 's'], { a: [1n, 1n, 0n, 0n], b: [2n, 1n, 1n, 0n], c: [2n, 2n, 2n, 0n], d: [2n, 2n, 2n, 1n], e: [2n, 2n, 3n, 1n], f: [3n, 3n, 3n, 1n] });
  const S5node = { kind: 'split', parts: [
    P('b<gam', dotW(M(['a', 'p', 'r', 's'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [2n, 2n, 2n, 0n], d: [2n, 2n, 2n, 1n], e: [2n, 3n, 3n, 1n], f: [3n, 3n, 3n, 1n] }), 'b')),
    P('b=gam (extremizer)', dotW(M(['a', 'p', 's'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 0n], d: [2n, 2n, 1n], e: [2n, 3n, 1n], f: [3n, 3n, 1n] }), 'c', {
      '1,1,-1': K({ a: [1n, 0n], b: [1n, 1n], c: [2n, 2n], d: [3n, 3n], e: [3n, 4n], f: [4n, 4n] }, [W8])   /* d = 3gam: WALL */
    })),
    P('gam<b, a<w', dotW(S5iii, 'b', {
      '1,1,-1,-1': { kind: 'split', parts: [
        P('i<a', dotW(M(['i', 'k', 'm'], { a: [1n, 1n, 0n], b: [3n, 2n, 2n], c: [4n, 2n, 2n], d: [4n, 3n, 3n], e: [5n, 3n, 4n], f: [6n, 4n, 4n] }), 'c')),
        P('i=a', K({ a: [1n, 0n], b: [3n, 2n], c: [4n, 2n], d: [4n, 3n], e: [5n, 4n], f: [6n, 4n] })),
        P('i>a', dotW(M(['a', 'j', 'n'], { a: [1n, 0n, 0n], b: [3n, 3n, 2n], c: [4n, 4n, 2n], d: [4n, 4n, 3n], e: [5n, 6n, 4n], f: [6n, 6n, 4n] }), 'c'))
      ] },
      '2,2,0,-1': dotW(M(['a', 'm', 'i'], { a: [1n, 0n, 0n], b: [2n, 2n, 1n], c: [2n, 2n, 2n], d: [4n, 4n, 2n], e: [4n, 5n, 3n], f: [5n, 5n, 3n] }), 'c', {
        '1,1,-1': K({ a: [1n, 0n], b: [3n, 3n], c: [4n, 4n], d: [6n, 6n], e: [7n, 8n], f: [8n, 8n] }) }),
      '1,1,0,-1': dotW(M(['a', 'm', 'i'], { a: [1n, 0n, 0n], b: [2n, 2n, 1n], c: [2n, 2n, 2n], d: [3n, 3n, 2n], e: [3n, 4n, 3n], f: [4n, 4n, 3n] }), 'd')
    })),
    P('gam<b, a=w', dotW(M(['w', 'i', 's'], { a: [1n, 0n, 0n], b: [2n, 1n, 0n], c: [2n, 2n, 0n], d: [2n, 2n, 1n], e: [2n, 3n, 1n], f: [3n, 3n, 1n] }), 'b', {
      '1,-1,-1': K({ a: [1n, 1n], b: [3n, 2n], c: [4n, 2n], d: [4n, 3n], e: [5n, 3n], f: [6n, 4n] }),
      '2,0,-1': K({ a: [1n, 0n], b: [2n, 1n], c: [2n, 2n], d: [4n, 2n], e: [4n, 3n], f: [5n, 3n] }),
      '1,0,-1': K({ a: [1n, 0n], b: [2n, 1n], c: [2n, 2n], d: [3n, 2n], e: [3n, 3n], f: [4n, 3n] })
    })),
    P('gam<b, w<a<gam', dotW(S5v, 'b', {
      '1,-1,-1,-1': dotW(M(['k', 'l', 's'], { a: [2n, 1n, 1n], b: [3n, 3n, 2n], c: [4n, 4n, 2n], d: [4n, 4n, 3n], e: [4n, 5n, 3n], f: [6n, 6n, 4n] }), 'c'),
      '2,0,0,-1': dotW(M(['w', 'k', 'l'], { a: [1n, 1n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 2n], d: [4n, 2n, 2n], e: [4n, 2n, 3n], f: [5n, 3n, 3n] }), 'c', {
        '1,-1,-1': K({ a: [2n, 1n], b: [3n, 3n], c: [4n, 4n], d: [6n, 6n], e: [6n, 7n], f: [8n, 8n] }) }),
      '1,0,0,-1': dotW(M(['w', 'k', 'l'], { a: [1n, 1n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 2n], d: [3n, 2n, 2n], e: [3n, 2n, 3n], f: [4n, 3n, 3n] }), 'd')
    }))
  ] };

  /* ---- S2: 3d = 2f, the 15-cone split ------------------------------------- */
  const S2node = { kind: 'split', parts: [
    P('R1 c<dl', dotW(M(['a', 'p', 'q', 'r'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [1n, 1n, 1n, 0n], d: [2n, 2n, 2n, 2n], e: [2n, 3n, 3n, 3n], f: [3n, 3n, 3n, 3n] }), 'c')),
    P('R2 c=dl', dotW(M(['a', 'p', 'q'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [1n, 1n, 1n], d: [2n, 2n, 2n], e: [2n, 3n, 3n], f: [3n, 3n, 3n] }), 'b')),
    P('R3a w<a', dotW(M(['w', 'k', 'p', 'i'], { a: [1n, 1n, 0n, 0n], b: [1n, 1n, 1n, 0n], c: [2n, 1n, 1n, 1n], d: [2n, 2n, 2n, 2n], e: [2n, 2n, 3n, 3n], f: [3n, 3n, 3n, 3n] }), 'b', {
      '0,1,1,-1': dotW(M(['w', 'k', 'p'], { a: [1n, 1n, 0n], b: [1n, 1n, 1n], c: [2n, 2n, 2n], d: [2n, 4n, 4n], e: [2n, 5n, 6n], f: [3n, 6n, 6n] }), 'c', {
        '1,-2,-2': K({ a: [3n, 2n], b: [3n, 3n], c: [6n, 6n], d: [8n, 8n], e: [9n, 10n], f: [12n, 12n] }) }) })),
    P('R3b w=a', dotW(M(['a', 'p', 'i'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 1n, 1n], d: [2n, 2n, 2n], e: [2n, 3n, 3n], f: [3n, 3n, 3n] }), 'b', {
      '0,1,-1': K({ a: [1n, 0n], b: [1n, 1n], c: [2n, 2n], d: [2n, 4n], e: [2n, 6n], f: [3n, 6n] }) })),
    P('R3c a<w<b', dotW(M(['a', 'm', 'j', 'i'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 1n, 0n], c: [2n, 2n, 1n, 1n], d: [2n, 2n, 2n, 2n], e: [2n, 3n, 3n, 3n], f: [3n, 3n, 3n, 3n] }), 'b', {
      '0,0,1,-1': dotW(M(['a', 'm', 'j'], { a: [1n, 0n, 0n], b: [1n, 1n, 1n], c: [2n, 2n, 2n], d: [2n, 2n, 4n], e: [2n, 3n, 6n], f: [3n, 3n, 6n] }), 'c', {
        '1,1,-2': { kind: 'split', parts: [
          P('a<j', K({ a: [1n, 0n], b: [3n, 3n], c: [6n, 6n], d: [8n, 8n], e: [11n, 12n], f: [12n, 12n] })),
          P('a=j', RAY([1, 3, 6, 8, 11, 12])),
          P('a>j', K({ a: [2n, 1n], b: [3n, 3n], c: [6n, 6n], d: [8n, 8n], e: [10n, 11n], f: [12n, 12n] }))
        ] } }) })),
    P('R3d w=b', dotW(M(['a', 'p', 'i'], { a: [1n, 0n, 0n], b: [1n, 1n, 0n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [2n, 3n, 3n], f: [3n, 3n, 3n] }), 'b')),
    P('R3e b<w<dl', dotW(M(['a', 'p', 'm', 'i'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [2n, 2n, 2n, 1n], d: [2n, 2n, 2n, 2n], e: [2n, 3n, 3n, 3n], f: [3n, 3n, 3n, 3n] }), 'b')),
    P('R4a w<a', dotW(M(['w', 'k', 'i'], { a: [1n, 1n, 0n], b: [1n, 1n, 1n], c: [2n, 1n, 1n], d: [2n, 2n, 2n], e: [2n, 2n, 3n], f: [3n, 3n, 3n] }), 'c', {
      '1,-1,-1': K({ a: [2n, 1n], b: [2n, 2n], c: [3n, 3n], d: [4n, 4n], e: [4n, 5n], f: [6n, 6n] }) })),
    P('R4b w=a', dotW(M(['a', 'i'], { a: [1n, 0n], b: [1n, 1n], c: [2n, 1n], d: [2n, 2n], e: [2n, 3n], f: [3n, 3n] }), 'c', {
      '1,-1': RAY([1, 2, 3, 4, 5, 6]) })),
    P('R4c a<w', dotW(M(['a', 'm', 'i'], { a: [1n, 0n, 0n], b: [1n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [2n, 3n, 3n], f: [3n, 3n, 3n] }), 'c', {
      '1,1,-1': K({ a: [1n, 0n], b: [2n, 2n], c: [3n, 3n], d: [4n, 4n], e: [5n, 6n], f: [6n, 6n] }) })),
    P('R5a a<v', dotW(M(['a', 'k', 'm', 'j'], { a: [1n, 0n, 0n, 0n], b: [2n, 2n, 1n, 1n], c: [2n, 2n, 2n, 1n], d: [2n, 2n, 2n, 2n], e: [2n, 3n, 3n, 3n], f: [3n, 3n, 3n, 3n] }), 'b', {
      '1,1,-1,-1': { kind: 'split', parts: [
        P('a<m', dotW(M(['a', 't', 'j'], { a: [1n, 0n, 0n], b: [3n, 3n, 3n], c: [4n, 4n, 3n], d: [4n, 4n, 4n], e: [5n, 6n, 6n], f: [6n, 6n, 6n] }), 'c')),
        P('a=m', K({ a: [1n, 0n], b: [3n, 3n], c: [4n, 3n], d: [4n, 4n], e: [5n, 6n], f: [6n, 6n] })),
        P('a>m', dotW(M(['m', 't2', 'u'], { a: [1n, 1n, 0n], b: [3n, 3n, 3n], c: [4n, 3n, 3n], d: [4n, 4n, 4n], e: [5n, 5n, 6n], f: [6n, 6n, 6n] }), 'c'))
      ] },
      '1,1,0,-1': combW(M(['a', 'k', 'm'], { a: [1n, 0n, 0n], b: [3n, 3n, 1n], c: [3n, 3n, 2n], d: [4n, 4n, 2n], e: [5n, 6n, 3n], f: [6n, 6n, 3n] }), {
        '2,0,-1': K({ a: [1n, 0n], b: [5n, 3n], c: [7n, 3n], d: [8n, 4n], e: [11n, 6n], f: [12n, 6n] }),
        '1,0,-1': K({ a: [1n, 0n], b: [4n, 3n], c: [5n, 3n], d: [6n, 4n], e: [8n, 6n], f: [9n, 6n] })
      }) })),
    P('R5b a=v', dotW(M(['a', 'm', 'j'], { a: [1n, 0n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [2n, 3n, 3n], f: [3n, 3n, 3n] }), 'b', {
      '1,-1,-1': K({ a: [1n, 1n], b: [3n, 3n], c: [4n, 3n], d: [4n, 4n], e: [5n, 5n], f: [6n, 6n] }),
      '1,0,-1': K({ a: [1n, 0n], b: [3n, 1n], c: [3n, 2n], d: [4n, 2n], e: [5n, 3n], f: [6n, 3n] })
    })),
    P('R5c v<a<w', dotW(M(['v', 'k', 'mm', 'j'], { a: [1n, 1n, 0n, 0n], b: [2n, 1n, 1n, 1n], c: [2n, 2n, 2n, 1n], d: [2n, 2n, 2n, 2n], e: [2n, 2n, 3n, 3n], f: [3n, 3n, 3n, 3n] }), 'b', {
      '1,-1,-1,-1': dotW(M(['k', 'mm', 'j'], { a: [2n, 1n, 1n], b: [3n, 3n, 3n], c: [4n, 4n, 3n], d: [4n, 4n, 4n], e: [4n, 5n, 5n], f: [6n, 6n, 6n] }), 'c'),
      '1,0,0,-1': combW(M(['v', 'k', 'mm'], { a: [1n, 1n, 0n], b: [3n, 1n, 1n], c: [3n, 2n, 2n], d: [4n, 2n, 2n], e: [5n, 2n, 3n], f: [6n, 3n, 3n] }), {
        '1,-1,1': K({ a: [2n, 1n], b: [4n, 2n], c: [5n, 4n], d: [6n, 4n], e: [7n, 5n], f: [9n, 6n] }),
        '2,1,-1': K({ a: [1n, 1n], b: [5n, 2n], c: [7n, 4n], d: [8n, 4n], e: [11n, 5n], f: [12n, 6n] }),
        '1,0,-1': K({ a: [1n, 1n], b: [4n, 1n], c: [5n, 2n], d: [6n, 2n], e: [8n, 2n], f: [9n, 3n] })
      }) })),
    P('R5d a=w', dotW(M(['v', 'm', 'j'], { a: [1n, 1n, 0n], b: [2n, 1n, 1n], c: [2n, 2n, 1n], d: [2n, 2n, 2n], e: [2n, 2n, 3n], f: [3n, 3n, 3n] }), 'b', {
      '1,-1,-1': K({ a: [2n, 1n], b: [3n, 3n], c: [4n, 3n], d: [4n, 4n], e: [4n, 5n], f: [6n, 6n] }),
      '1,0,-1': K({ a: [1n, 1n], b: [3n, 1n], c: [3n, 2n], d: [4n, 2n], e: [5n, 2n], f: [6n, 3n] })
    })),
    P('R5e w<a<dl', dotW(M(['v', 'm', 'k', 'j'], { a: [1n, 1n, 1n, 0n], b: [2n, 1n, 1n, 1n], c: [2n, 2n, 1n, 1n], d: [2n, 2n, 2n, 2n], e: [2n, 2n, 2n, 3n], f: [3n, 3n, 3n, 3n] }), 'b', {
      '1,-1,-1,-1': dotW(M(['m', 'k', 'j'], { a: [2n, 2n, 1n], b: [3n, 3n, 3n], c: [4n, 3n, 3n], d: [4n, 4n, 4n], e: [4n, 4n, 5n], f: [6n, 6n, 6n] }), 'c'),
      '1,0,-1,-1': combW(M(['m', 'k', 'j'], { a: [1n, 2n, 1n], b: [1n, 3n, 3n], c: [2n, 3n, 3n], d: [2n, 4n, 4n], e: [2n, 4n, 5n], f: [3n, 6n, 6n] }), {
        '0,1,-1': K({ a: [1n, 3n], b: [1n, 6n], c: [2n, 6n], d: [2n, 8n], e: [2n, 9n], f: [3n, 12n] }),
        '1,1,-1': K({ a: [2n, 3n], b: [4n, 6n], c: [5n, 6n], d: [6n, 8n], e: [7n, 9n], f: [9n, 12n] })
      }) }))
  ] };

  return CL.closeFamily(rootKeyOf(gen6, 'a+e = f'), {
    kind: 'dot', familyLabel: 'a+e = f', C,
    S: { order: C.member.f, xi: D.XI_PI },
    W: [{ atom: { kind: 'omcsq', form: C.member.d }, coeff: q(2) }],
    gConst: q(2, 3), gMembers: ['a', 'b', 'c', 'd', 'e'], anchored: ['f'],
    subs: {
      '0,1,1,1,-1': dotW(M(['a', 'u', 'v', 'w'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [1n, 1n, 1n, 0n], d: [1n, 1n, 1n, 1n], e: [1n, 2n, 2n, 2n], f: [2n, 2n, 2n, 2n] }), 'c'),   /* 2d = f */
      '1,-1,-1,-1,2': S2node,                                 /* 3d = 2f */
      '1,-1,0,0,2': S3node,                                   /* b+2d = 2f */
      '0,1,0,0,-1': S4node,                                   /* b+d = f: extremizer */
      '1,-1,-1,0,2': S5node,                                  /* c+2d = 2f: extremizer */
      '0,1,1,0,-1': dotW(M(['a', 'u', 'v', 'w'], { a: [1n, 0n, 0n, 0n], b: [1n, 1n, 0n, 0n], c: [1n, 1n, 1n, 0n], d: [1n, 1n, 1n, 1n], e: [1n, 2n, 2n, 1n], f: [2n, 2n, 2n, 1n] }), 'b')    /* c+d = f */
    }
  }, { target: L6, tol: 1e-10, cap: 30, topC: C6, rootConds: rootCondsOf(gen6) });
});

/* ---- the interleave generator for parity-family roots ----------------------- */
/* single definition in instruments/lambda56/close.js — the generator is part
   of the certified driver, not runner-local convenience */
const { parityCones, parityMatrix } = CL;
const vadd = (u, v) => u.map((x, i) => x + v[i]);
const vscale = (u, s) => u.map(x => x * BigInt(s));

/* ---- lambda(6): the four remaining parity families, auto-closed ------------- */
stage('lambda6-family: b+2e = 2f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  /* b = 2*be, f = e+be; below-2be members: {a}; c,d,e free above 2be */
  const parts = parityCones(['a']).map((cone) => ({
    kind: 'autoClose', partLabel: cone.label,
    C: parityMatrix(cone, ['a'], 3, (formOf, eps, tail, nP) => {
      const b = vscale(eps, 2);
      const c = vadd(b, tail(0)), d = vadd(c, tail(1)), e = vadd(d, tail(2));
      return { n: nP, names: Array.from({ length: nP }, (_, i) => 'x' + i),
        member: { a: formOf('a'), b, c, d, e, f: vadd(e, eps) }, defs: {} };
    })
  }));
  return CL.closeFamily(rootKeyOf(gen6, 'b+2e = 2f'), { kind: 'split', familyLabel: 'b+2e = 2f', parts },
    { target: L6, tol: 1e-10, cap: 24, topC: C6, rootConds: rootCondsOf(gen6), witness: [1, 2, 4, 6, 7, 8] });
});

stage('lambda6-family: c+2e = 2f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  /* c = 2*gam, f = e+gam; below: {a,b}; d,e free above 2gam */
  const parts = parityCones(['a', 'b']).map((cone) => ({
    kind: 'autoClose', partLabel: cone.label,
    C: parityMatrix(cone, ['a', 'b'], 2, (formOf, eps, tail, nP) => {
      const c = vscale(eps, 2);
      const d = vadd(c, tail(0)), e = vadd(d, tail(1));
      return { n: nP, names: Array.from({ length: nP }, (_, i) => 'x' + i),
        member: { a: formOf('a'), b: formOf('b'), c, d, e, f: vadd(e, eps) }, defs: {} };
    })
  }));
  return CL.closeFamily(rootKeyOf(gen6, 'c+2e = 2f'), { kind: 'split', familyLabel: 'c+2e = 2f', parts },
    { target: L6, tol: 1e-10, cap: 24, topC: C6, rootConds: rootCondsOf(gen6) });
});

stage('lambda6-family: d+2e = 2f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  /* d = 2*dl, f = e+dl; below: {a,b,c}; e free above 2dl */
  const parts = parityCones(['a', 'b', 'c']).map((cone) => ({
    kind: 'autoClose', partLabel: cone.label,
    C: parityMatrix(cone, ['a', 'b', 'c'], 1, (formOf, eps, tail, nP) => {
      const d = vscale(eps, 2);
      const e = vadd(d, tail(0));
      return { n: nP, names: Array.from({ length: nP }, (_, i) => 'x' + i),
        member: { a: formOf('a'), b: formOf('b'), c: formOf('c'), d, e, f: vadd(e, eps) }, defs: {} };
    })
  }));
  return CL.closeFamily(rootKeyOf(gen6, 'd+2e = 2f'), { kind: 'split', familyLabel: 'd+2e = 2f', parts },
    { target: L6, tol: 1e-10, cap: 24, topC: C6, rootConds: rootCondsOf(gen6) });
});

stage('lambda6-family: 3e = 2f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  /* e = 2*ep, f = 3*ep; below: {a,b,c,d} — the widest triangulation of the
     whole campaign, generated, not hand-written */
  const parts = parityCones(['a', 'b', 'c', 'd']).map((cone) => ({
    kind: 'autoClose', partLabel: cone.label,
    C: parityMatrix(cone, ['a', 'b', 'c', 'd'], 0, (formOf, eps, tail, nP) => ({
      n: nP, names: Array.from({ length: nP }, (_, i) => 'x' + i),
      member: { a: formOf('a'), b: formOf('b'), c: formOf('c'), d: formOf('d'),
        e: vscale(eps, 2), f: vscale(eps, 3) }, defs: {} })
    )
  }));
  return CL.closeFamily(rootKeyOf(gen6, '3e = 2f'), { kind: 'split', familyLabel: '3e = 2f', parts },
    { target: L6, tol: 1e-10, cap: 24, topC: C6, rootConds: rootCondsOf(gen6) });
});

/* ---- lambda(6) family: a+2e = 2f ------------------------------------------- */
/* a = 2*al, f = e+al. Six of the eight conditions fall to the mechanical
   shapes; d = 2a and e = 2a are midpoint splits around 3*al — the same
   interleave generator as the parity roots, with a shifted reconstruction
   (below members are 2*al + value, above members 3*al + offset). */
stage('lambda6-family: a+2e = 2f', () => {
  if (!gen6) throw new Error('lambda6-generic did not run');
  const C = { n: 5, names: ['al', 'p', 'q', 'r', 's'], member: {
    a: [2n, 0n, 0n, 0n, 0n], b: [2n, 1n, 0n, 0n, 0n], c: [2n, 1n, 1n, 0n, 0n],
    d: [2n, 1n, 1n, 1n, 0n], e: [2n, 1n, 1n, 1n, 1n], f: [3n, 1n, 1n, 1n, 1n] }, defs: {} };
  /* midpoint splits: members `mids` live in (2al, k*al top end); everything
     reconstructs from the interleave of their below-3al values and
     above-3al offsets, with alpha = eps of the generator */
  const midSplit = (mids, fixed) => parityCones(mids).map((cone) => ({
    kind: 'autoClose', partLabel: cone.label,
    C: parityMatrix(cone, mids, fixed.nExtra, (formOf, alpha, tail, nP) => {
      /* value v: member = 2al + v; tie: 2al + al = 3al; offset o: the
         generator's formOf already returns al + o, so member = 2al + (al+o)
         = 3al + o — one uniform rule for all three kinds */
      const mm = { a: vscale(alpha, 2) };
      for (const nm of mids) mm[nm] = vadd(vscale(alpha, 2), formOf(nm));
      return fixed.finish(mm, alpha, tail, nP);
    })
  }));

  return CL.closeFamily(rootKeyOf(gen6, 'a+2e = 2f'), {
    kind: 'autoClose', familyLabel: 'a+2e = 2f', C,
    manual: {
      '2,-1,-1,-1,0': { kind: 'split', parts: midSplit(['b', 'c'], {
        nExtra: 1,
        finish: (mm, alpha, tail, nP) => {
          mm.d = vscale(alpha, 4);
          mm.e = vadd(mm.d, tail(0));
          mm.f = vadd(mm.e, alpha);
          return { n: nP, names: Array.from({ length: nP }, (_, i) => 'y' + i), member: mm, defs: {} };
        } }) },
      '2,-1,-1,-1,-1': { kind: 'split', parts: midSplit(['b', 'c', 'd'], {
        nExtra: 0,
        finish: (mm, alpha, tail, nP) => {
          mm.e = vscale(alpha, 4);
          mm.f = vscale(alpha, 5);
          return { n: nP, names: Array.from({ length: nP }, (_, i) => 'y' + i), member: mm, defs: {} };
        } }) }
    }
  }, { target: L6, tol: 1e-10, cap: 26, topC: C6, rootConds: rootCondsOf(gen6) });
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
