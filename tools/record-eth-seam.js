#!/usr/bin/env node
/* record-eth-seam.js — certs/eth-seam.json: the version seam of the TSavo bridge replay, measured.

   TSavo's Bridge.ethIsFalse_of_claim : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse is
   checked on Lean v4.33.1 with Anthropic's Mathlib 0df444a3 (certs/eth-tsavo-bridge.json), where OpenAI's challenge text
   is re-elaborated; OpenAI proved exact_count_and_sat on Lean v4.34.1 with Mathlib d13f23b7 (certs/eth-kernel.json).
   .github/workflows/eth-seam.yml elaborates the pinned bytes on both sides and SeamExport
   (corpus/eth-refutation/seam/lean/SeamExport.lean) writes each statement's closure as canonical node tables. THE
   COMPARISON LIVES HERE AND NOWHERE ELSE: the workflow writes facts, never a word.

   The words:
     IDENTICAL  TSavo's Claim as elaborated on Anthropic's side, with ClaimAt unfolded once, is the same kernel term as
                exact_count_and_sat's statement as elaborated on OpenAI's side, and every constant of the two closures
                (definitions with their values, theorems with their statements, inductives with their constructors and
                recursors, structures with their projections) is present on both sides as the same kernel term
     DIFFERENT  anything else; every difference is listed and classified (below), the decision is never softened
   Kernel term: the Expr structure with de Bruijn indices, constant names, universe levels (parameters by position),
   literals and projections; binder names, binder infos and metadata dropped, as the kernel drops them. The surface
   comparison (with them) and the proof-erased comparison (every proof subterm replaced by one marker, so the kernel's
   proof irrelevance is applied by hand) are reported beside it, never instead of it.

   Each difference is classified, by the exports alone:
     proof-internal   the constant differs, but after proof erasure the two terms are the same
     proof-reach      the constant is in neither proof-erased closure: only proofs reach it (a theorem's statement, a
                      definition only a proof mentions); it cannot change what the statement says
     definitional     the constant differs outside proofs, or is present on one side only inside the proof-erased
                      closure; the statement's meaning may depend on it (the diff is in the record, read it)
   and carries the kernel's word across the sides (corpus/eth-refutation/seam/lean/SeamCross.lean, the cross jobs):
   each side's term read in the other environment is the same there, definitionally equal there (Lean's kernel accepts
   foreign = local by Eq.refl), not, or cannot be read there (it names constants that environment lacks). Our reading
   of each difference's cause (GROUPS) is written beside it; it never changes a class, a kernel word or the verdict.

   usage: node tools/record-eth-seam.js <run-id>   download the run's four artifacts (gh), keep them, decide
          node tools/record-eth-seam.js            decide again from the latest kept run
          node tools/record-eth-seam.js --check    the battery: the record on disk is what the kept run decides */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const zlib = require('zlib');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const REPO = 'carlostoledo1891/cert-machine';
const ETH = path.join(ROOT, 'corpus', 'eth-refutation');
const RUNS = path.join(ETH, 'seam', 'runs');
const OUT = path.join(ROOT, 'certs', 'eth-seam.json');
const PINS = JSON.parse(fs.readFileSync(path.join(ETH, 'pins.json'), 'utf8'));
const TPINS = JSON.parse(fs.readFileSync(path.join(ETH, 'tsavo', 'pins.json'), 'utf8'));
const NS = 'OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.';
const ROOT_THM = NS + 'exact_count_and_sat';
const CLAIM = NS + 'Claim';
const CLAIM_AT = NS + 'ClaimAt';
const BRIDGE = 'Bridge.ethIsFalse_of_claim';
const ETH_FALSE = 'MainResults.ETHIsFalse';
const PROOF = '⟨proof⟩';
const SIDES = {
  openai: { lean: '4.34.1', toolchain: PINS.claims.openai.toolchain, mathlib: PINS.claims.openai.mathlib, exports: ['challenge', 'claim'] },
  anthropic: { lean: '4.33.1', toolchain: PINS.claims.anthropic.toolchain, mathlib: PINS.claims.anthropic.mathlib, exports: ['challenge', 'claim', 'bridge'] },
};
const CLASS = {
  'proof-internal': 'the constant differs, but after proof erasure the two terms are the same (the kernel identifies proofs of one proposition)',
  'proof-reach': 'in neither proof-erased closure: only proofs reach it (a theorem\'s statement, or a definition only a proof mentions), so it cannot change what the statement says',
  definitional: 'differs outside proofs, or is present on one side only inside the proof-erased closure: the statement\'s meaning may depend on it',
};
/* human readings of individual differences, written after reading the diffs in the record; a reading never changes a
   class or the verdict, it only says in words what the diff shows */
const READINGS = {};
/* the causes, OUR READING of the diffs of run 40947568989, written after reading them: each difference gets the first
   group whose pattern it matches (its name, or the kernel's message when one side's term is read in the other
   environment). A group never changes a class, a kernel status or the verdict; it says in words where a difference
   comes from. A difference no pattern explains stays in 'other' and is listed. */
const HIERARCHY_NAMES = ['Monoid.mk', 'AddMonoid.mk', 'MulOneClass.mk', 'AddZeroClass.mk', 'Monoid.toMul', 'AddMonoid.toAdd', 'MulOneClass.toMul',
  'MulOneClass.toOne', 'AddZeroClass.toZero', 'AddZeroClass.toAdd', 'Monoid.mul_assoc', 'AddMonoid.add_assoc', 'Monoid.toSemigroup',
  'AddMonoid.toAddSemigroup', 'MulOneClass.toMulOne', 'AddZeroClass.toAddZero', 'Semigroup', 'AddSemigroup', 'MulOne ', 'AddZero '];
const MOVED_MODULES = ['Mathlib.Data.Real.Basic', 'Mathlib.Basic.Real.Basic', 'Mathlib.Data.Complex.Basic', 'Mathlib.Basic.Complex.Basic', 'Mathlib.Data.NNReal.Defs', 'Mathlib.Basic.NNReal.Defs'];
const GROUPS = [
  { group: 'kernel-identified', label: 'identified by the kernel both ways', test: (n, det, k) => k === 'identified both ways',
    reading: 'The two terms differ, mostly in instance paths (which chain of parent projections reaches an instance: DivisionSemiring.toSemiring against CommSemiring.toSemiring from the same Field, in the Cauchy-sequence construction of ℝ), and Lean\'s kernel, reading each side\'s term in the other environment, finds them definitionally equal there, both ways.' },
  { group: 'elsewhere-identified', label: 'in one closure only, identical in the other environment', test: (n, det, k) => k === 'one side only, identified in the other environment',
    reading: 'Present in one closure only, but the constant exists in the other environment and the kernel identifies it there; the other side\'s terms simply reach the same instance by another path.' },
  { group: 'monoid-hierarchy', label: 'the Monoid hierarchy\'s new shape in Mathlib', test: (n, det) => /^(Monoid|AddMonoid|MulOneClass|AddZeroClass)\./.test(n) || HIERARCHY_NAMES.some((h) => det.includes(h)),
    reading: 'Mathlib\'s Monoid hierarchy changed shape between the two commits. In 0df444a3 (Anthropic\'s side) Monoid.mk takes a Semigroup and MulOneClass.mk a MulOne (AddMonoid, AddZeroClass likewise); in d13f23b7 (OpenAI\'s side) Monoid.mk takes One, Mul and mul_assoc directly and MulOneClass.mk takes One and Mul (Monoid.toMul, AddMonoid.toAdd, MulOneClass.toOne, … exist only there). The fields are the same propositions, but the structures carrying them are different inductive types, so every instance built with these constructors (on ℕ, ℚ, ℝ, ℂ, NNReal, Multiset: Real.commRing among them) and every statement projecting through them is a different term. Where Anthropic\'s term only projects (an instance path through Monoid.toSemigroup), it reads in d13f23b7 and the kernel identifies it there; where it builds a Monoid, it does not type-check there.' },
  { group: 'moved-file', label: 'the moved files that construct ℝ, ℂ and NNReal', test: (n, det) => (((n.includes('_private.') || n.includes('._@.')) && MOVED_MODULES.some((m) => n.includes(m))) || MOVED_MODULES.some((m) => det.includes(m))),
    reading: 'The files that construct ℝ, ℂ and NNReal moved (Mathlib/Data/Real/Basic.lean → Mathlib/Basic/Real/Basic.lean, likewise Complex.Basic and NNReal.Defs). Private definitions (Real.add, Real.mul, Real.le, Real.inv\', …) and the irreducible_def wrappers (Real.definition._@…, Real.wrapped._@…) carry their module in their names, so the same definitions appear under different names on the two sides, and the instances that use them (Real.instAdd, Real.instLE, …) name constants the other environment does not have.' },
  { group: 'lean-core', label: 'Lean core\'s Bool.and', test: (n) => n.startsWith('Bool.'),
    reading: 'Lean core: Bool.and is compiled through the matcher Bool.and.match_1 in v4.33.1 and directly by Bool.rec in v4.34.1; OpenAI\'s Bool.and, read in Anthropic\'s environment, is definitionally equal there.' },
  { group: 'renamed', label: 'a rename under the real power', test: (n, det) => ['setCongr', 'equivOfEq', 'orderIsoOfEq'].some((s) => n.includes(s) || det.includes(s)),
    reading: 'A rename used by Real.sinOrderIso (so by Real.arcsin, Complex.arg, Complex.log, the real power): Equiv.setCongr and OrderIso.setCongr (0df444a3, universe parameters changed) against Set.equivOfEq and Set.orderIsoOfEq (d13f23b7).' },
  { group: 'nonneg', label: 'NNReal\'s Nonneg', test: (n, det) => n.startsWith('Nonneg') || det.includes('Nonneg'),
    reading: 'NNReal\'s carrier: d13f23b7 has a definition Nonneg for the subtype {x // 0 ≤ x} that the NNReal instances name; 0df444a3 writes the subtype directly.' },
  { group: 'binder-order', label: 'a proof-only binder order', test: (n) => n === 'Set.Ici.semilatticeSup._proof_1',
    reading: 'An auxiliary proof whose implicit binders {a} and [SemilatticeSup α] come in the other order; only proofs reach it.' },
];
const groupOf = (n, det, k) => (GROUPS.find((g) => g.test(n, det, k)) || { group: 'other' }).group;

const refuse = (why) => { console.error('REFUSED: ' + why); process.exit(1); };
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const H = (s) => crypto.createHash('sha256').update(s).digest('base64');

/* ---- keep: download the run's two artifacts and keep them beside the pins ---- */
function keep(run) {
  const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,headBranch,status,conclusion,url,createdAt,updatedAt,workflowName,event`, { encoding: 'utf8' }));
  if (meta.workflowName !== 'eth-seam') refuse('run ' + run + ' is of the workflow ' + meta.workflowName);
  if (meta.status !== 'completed') refuse('run ' + run + ' is ' + meta.status);
  const jobs = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json jobs`, { encoding: 'utf8' })).jobs
    .map((j) => ({ name: j.name, conclusion: j.conclusion, startedAt: j.startedAt, completedAt: j.completedAt }));
  const dest = path.join(RUNS, String(run));
  fs.rmSync(dest, { recursive: true, force: true });
  for (const side of Object.keys(SIDES)) {
    for (const [art, dir] of [['eth-seam-' + side, side], ['eth-seam-cross-' + side, 'cross-' + side]]) {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-seam-'));
      cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} -n ${art}`, { stdio: 'inherit' });
      fs.mkdirSync(path.join(dest, dir), { recursive: true });
      for (const e of fs.readdirSync(tmp)) {
        const src = path.join(tmp, e);
        // the long logs and the cross results are kept compressed; everything else as the run wrote it
        if (/\.(log|jsonl)$/.test(e) && fs.statSync(src).size > 64 * 1024) fs.writeFileSync(path.join(dest, dir, e + '.gz'), zlib.gzipSync(fs.readFileSync(src), { level: 9 }));
        else fs.cpSync(src, path.join(dest, dir, e), { recursive: true });
      }
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  fs.writeFileSync(path.join(dest, '_run.json'), JSON.stringify(Object.assign({}, meta, { jobs }), null, 1) + '\n');
  console.log('kept run ' + run + ' (' + meta.conclusion + ') in ' + path.relative(ROOT, dest));
}

/* ---- the node tables ---- */
/* Merkle hashes of a table, bottom up (children precede parents): K the kernel term, S the surface term */
function merkle(tab) {
  const n = tab.length;
  const K = new Array(n);
  const S = new Array(n);
  for (let i = 0; i < n; i++) {
    const d = tab[i];
    switch (d[0]) {
      case 'a': K[i] = H('a' + K[d[1]] + K[d[2]]); S[i] = H('a' + S[d[1]] + S[d[2]]); break;
      case 'l': case 'p': K[i] = H(d[0] + K[d[3]] + K[d[4]]); S[i] = H(d[0] + JSON.stringify([d[1], d[2]]) + S[d[3]] + S[d[4]]); break;
      case 'z': K[i] = H('z' + K[d[2]] + K[d[3]] + K[d[4]]); S[i] = H('z' + JSON.stringify([d[1], d[5]]) + S[d[2]] + S[d[3]] + S[d[4]]); break;
      case 'm': K[i] = K[d[2]]; S[i] = H('m' + JSON.stringify(d[1]) + S[d[2]]); break;
      case 'j': K[i] = H('j' + JSON.stringify([d[1], d[2]]) + K[d[3]]); S[i] = H('j' + JSON.stringify([d[1], d[2]]) + S[d[3]]); break;
      default: K[i] = S[i] = H(JSON.stringify(d)); // b s c n t (and f ? never expected)
    }
  }
  return { tab, K, S, root: n - 1 };
}
const rootK = (tab) => { const m = merkle(tab); return { K: m.K[m.root], S: m.S[m.root] }; };

/* a term as text, our printer: de Bruijn indices as #i, at most `budget` characters */
function render(M, i, budget = 320) {
  const out = [];
  let left = budget;
  const put = (s) => { out.push(s); left -= s.length; };
  (function go(i) {
    if (left <= 0) return;
    const d = M.tab[i];
    switch (d[0]) {
      case 'b': put('#' + d[1]); break;
      case 's': put('Sort ' + d[1]); break;
      case 'c': put(d[1] + (d[2].length ? '.{' + d[2].join(', ') + '}' : '')); break;
      case 'a': {
        const args = [];
        let h = i;
        while (M.tab[h][0] === 'a') { args.unshift(M.tab[h][2]); h = M.tab[h][1]; }
        put('('); go(h);
        for (const x of args) { if (left <= 0) break; put(' '); go(x); }
        put(')');
        break;
      }
      case 'l': put('(fun (' + d[1] + ' : '); go(d[3]); put(') => '); go(d[4]); put(')'); break;
      case 'p': put('(∀ (' + d[1] + ' : '); go(d[3]); put('), '); go(d[4]); put(')'); break;
      case 'z': put('(let ' + d[1] + ' : '); go(d[2]); put(' := '); go(d[3]); put('; '); go(d[4]); put(')'); break;
      case 'n': put(d[1]); break;
      case 't': put(JSON.stringify(d[1])); break;
      case 'm': go(d[2]); break;
      case 'j': put('('); go(d[3]); put(').' + d[1] + '#' + d[2]); break;
      default: put(JSON.stringify(d));
    }
  })(i);
  const s = out.join('');
  return s.length > budget ? s.slice(0, budget) + '…' : s;
}

/* the first place two terms differ: descend while the heads agree, into the first child that differs */
function firstDiff(A, B, mode) {
  const HA = mode === 'K' ? A.K : A.S;
  const HB = mode === 'K' ? B.K : B.S;
  let i = A.root;
  let j = B.root;
  const steps = [];
  let ctx = null;
  for (let guard = 0; guard < 1e6; guard++) {
    if (HA[i] === HB[j]) return null;
    let a = A.tab[i];
    let b = B.tab[j];
    if (mode === 'K') {
      while (a[0] === 'm') { i = a[2]; a = A.tab[i]; }
      while (b[0] === 'm') { j = b[2]; b = B.tab[j]; }
    }
    const here = (why) => ({ at: steps.join(' › ') || 'the root', why, x: render(A, i), y: render(B, j), xIn: ctx ? render(A, ctx[0]) : null, yIn: ctx ? render(B, ctx[1]) : null });
    if (a[0] !== b[0]) return here('different node kinds');
    if (a[0] === 'a') {
      const sa = [];
      const sb = [];
      let ha = i;
      let hb = j;
      while (A.tab[ha][0] === 'a') { sa.unshift(A.tab[ha][2]); ha = A.tab[ha][1]; }
      while (B.tab[hb][0] === 'a') { sb.unshift(B.tab[hb][2]); hb = B.tab[hb][1]; }
      if (sa.length !== sb.length) return here('applications of different arity');
      const head = render(A, ha, 80);
      ctx = [i, j];
      if (HA[ha] !== HB[hb]) { steps.push('head'); i = ha; j = hb; continue; }
      const k = sa.findIndex((x, q) => HA[x] !== HB[sb[q]]);
      steps.push('arg ' + (k + 1) + ' of ' + head);
      i = sa[k]; j = sb[k];
      continue;
    }
    if (a[0] === 'l' || a[0] === 'p') {
      if (mode === 'S' && (a[1] !== b[1] || a[2] !== b[2])) return here('binder name or info');
      const w = a[0] === 'l' ? 'λ' : '∀';
      if (HA[a[3]] !== HB[b[3]]) { steps.push(w + ' ' + a[1] + ' type'); i = a[3]; j = b[3]; } else { steps.push(w + ' ' + a[1] + ' body'); i = a[4]; j = b[4]; }
      continue;
    }
    if (a[0] === 'z') {
      if (mode === 'S' && (a[1] !== b[1] || a[5] !== b[5])) return here('let name or nonDep flag');
      const q = [2, 3, 4].find((q) => HA[a[q]] !== HB[b[q]]);
      steps.push('let ' + a[1] + ' ' + ['', '', 'type', 'value', 'body'][q]); i = a[q]; j = b[q];
      continue;
    }
    if (a[0] === 'm') {
      if (JSON.stringify(a[1]) !== JSON.stringify(b[1])) return here('metadata keys');
      steps.push('mdata'); i = a[2]; j = b[2];
      continue;
    }
    if (a[0] === 'j') {
      if (a[1] !== b[1] || a[2] !== b[2]) return here('different projections');
      steps.push('proj ' + a[1] + '#' + a[2]); i = a[3]; j = b[3];
      continue;
    }
    return here('different leaves');
  }
  return { at: '(gave up)', why: 'too deep' };
}

/* ---- an export: one header line, one line per constant, the pseudo-entries ---- */
function lines(file) {
  const buf = zlib.gunzipSync(fs.readFileSync(file));
  return { text: buf.toString('utf8'), sha256: sha256(buf) };
}
function loadExport(file) {
  const { text, sha256: sha } = lines(file);
  const ls = text.split('\n').filter(Boolean);
  const header = JSON.parse(ls[0]);
  const map = new Map();
  const pseudo = new Map();
  let nodes = 0;
  for (let q = 1; q < ls.length; q++) {
    const e = JSON.parse(ls[q]);
    if (e.k === 'unfolded' || e.k === 'typeOnly') { pseudo.set(e.n, e); continue; }
    nodes += e.t.length + (e.v ? e.v.length : 0);
    const t = rootK(e.t);
    const v = e.v ? rootK(e.v) : null;
    const rules = e.rules ? e.rules.map(([c, nf, tb]) => [c, nf, rootK(tb)]) : null;
    const meta = JSON.stringify(e.meta);
    const s = {
      n: e.n, k: e.k, lp: e.lp, mod: e.mod, from: e.from, hints: e.hints, inE: Boolean(e.e), fromE: e.e ? e.e.from : null,
      tK: t.K, vK: v && v.K, tS: t.S, vS: v && v.S, meta,
      rulesK: rules && JSON.stringify(rules.map((r) => [r[0], r[1], r[2].K])), rulesS: rules && JSON.stringify(rules.map((r) => [r[0], r[1], r[2].S])),
    };
    s.kSig = H(JSON.stringify([s.k, s.lp.length, s.meta, s.tK, s.vK, s.rulesK]));
    s.sSig = H(JSON.stringify([s.lp, s.hints, s.tS, s.vS, s.rulesS]));
    if (e.e) {
      s.etK = e.e.t === 'same' ? s.tK : rootK(e.e.t).K;
      s.evK = e.e.v === 'same' ? s.vK : (e.e.v ? rootK(e.e.v).K : null);
      s.eSig = H(JSON.stringify([s.k, s.lp.length, s.meta, s.etK, s.evK, s.rulesK]));
    }
    map.set(e.n, s);
  }
  return { file, sha256: sha, header, map, pseudo, nodes, constants: map.size };
}
/* the full entries of a few names (a second pass, for the diffs) */
function fetchEntries(file, names) {
  const want = new Set(names);
  const out = new Map();
  if (!want.size) return out;
  for (const l of lines(file).text.split('\n')) {
    if (!l) continue;
    const m = /^\{"n":("(?:[^"\\]|\\.)*")/.exec(l);
    if (m && want.has(JSON.parse(m[1]))) { const e = JSON.parse(l); out.set(e.n, e); }
  }
  return out;
}

/* ---- comparing two closures ---- */
function compare(X, Y, exX = [], exY = []) {
  const nx = [...X.map.keys()].filter((n) => !exX.includes(n));
  const ny = [...Y.map.keys()].filter((n) => !exY.includes(n));
  const sy = new Set(ny);
  const sx = new Set(nx);
  const onlyX = nx.filter((n) => !sy.has(n));
  const onlyY = ny.filter((n) => !sx.has(n));
  const both = nx.filter((n) => sy.has(n));
  const kernelDiffer = both.filter((n) => X.map.get(n).kSig !== Y.map.get(n).kSig);
  const surfaceOnly = both.filter((n) => X.map.get(n).kSig === Y.map.get(n).kSig && X.map.get(n).sSig !== Y.map.get(n).sSig);
  const ex = nx.filter((n) => X.map.get(n).inE);
  const ey = ny.filter((n) => Y.map.get(n).inE);
  const sey = new Set(ey);
  const sex = new Set(ex);
  const eOnlyX = ex.filter((n) => !sey.has(n));
  const eOnlyY = ey.filter((n) => !sex.has(n));
  const eDiffer = ex.filter((n) => sey.has(n) && X.map.get(n).eSig !== Y.map.get(n).eSig);
  const classify = (n) => {
    const a = X.map.get(n);
    const b = Y.map.get(n);
    if (!a || !b) return (a || b).inE ? 'definitional' : 'proof-reach';
    if (!a.inE && !b.inE) return 'proof-reach';
    if (a.inE && b.inE && a.eSig === b.eSig) return 'proof-internal';
    return 'definitional';
  };
  return {
    counts: { x: { full: nx.length, erased: ex.length }, y: { full: ny.length, erased: ey.length } },
    common: both.length,
    onlyX, onlyY, kernelDiffer, surfaceOnly,
    erased: { onlyX: eOnlyX, onlyY: eOnlyY, differ: eDiffer },
    identical: !onlyX.length && !onlyY.length && !kernelDiffer.length,
    identicalModuloProofs: !eOnlyX.length && !eOnlyY.length && !eDiffer.length,
    surfaceIdentical: !onlyX.length && !onlyY.length && !kernelDiffer.length && !surfaceOnly.length,
    classify,
  };
}
const whatDiffers = (a, b) => ['k', 'lp.length', 'meta', 'tK', 'vK', 'rulesK'].filter((f) => {
  const g = (s) => (f === 'lp.length' ? s.lp.length : s[f]);
  return g(a) !== g(b);
}).map((f) => ({ k: 'kind', 'lp.length': 'universe parameters', meta: 'kernel facts', tK: 'type', vK: 'value', rulesK: 'recursor rules' })[f]);
const surfaceWhat = (a, b) => [['lp', 'universe parameter names'], ['hints', 'reducibility hints'], ['tS', 'type (binder names, binder infos or metadata)'], ['vS', 'value (binder names, binder infos or metadata)'], ['rulesS', 'recursor rules (binder names)']]
  .filter(([f]) => JSON.stringify(a[f]) !== JSON.stringify(b[f])).map(([, w]) => w);
const pathOf = (X, n) => {
  const out = [];
  let cur = n;
  for (let g = 0; g < 12 && cur && X.map.has(cur); g++) { const s = X.map.get(cur); out.push(s.from[1] === 'root' ? cur : cur + ' (' + s.from[1] + ' of)'); if (s.from[1] === 'root') break; cur = s.from[0]; }
  return out.join(' ← ');
};
/* the itemised differences of one comparison, with a short diff for each (a second pass over the exports) */
function itemise(X, Y, c, sideX, sideY, crossOf) {
  const names = [...new Set([...c.kernelDiffer, ...c.onlyX, ...c.onlyY, ...c.surfaceOnly])];
  const ex = fetchEntries(X.file, names.filter((n) => X.map.has(n)));
  const ey = fetchEntries(Y.file, names.filter((n) => Y.map.has(n)));
  const items = [];
  for (const n of c.kernelDiffer) {
    const a = X.map.get(n);
    const b = Y.map.get(n);
    const ea = ex.get(n);
    const eb = ey.get(n);
    const parts = whatDiffers(a, b);
    const diffs = {};
    if (parts.includes('type')) diffs.type = firstDiff(merkle(ea.t), merkle(eb.t), 'K');
    if (parts.includes('value') && ea.v && eb.v) diffs.value = firstDiff(merkle(ea.v), merkle(eb.v), 'K');
    if (parts.includes('kernel facts')) diffs.meta = { x: ea.meta, y: eb.meta };
    if (parts.includes('universe parameters')) diffs.levelParams = { x: ea.lp, y: eb.lp };
    if (parts.includes('recursor rules')) diffs.rules = { x: ea.rules.map((r) => [r[0], r[1]]), y: eb.rules.map((r) => [r[0], r[1]]) };
    const cls = c.classify(n);
    const item = { name: n, kind: a.k + (a.k !== b.k ? ' / ' + b.k : ''), module: { [sideX]: a.mod, [sideY]: b.mod }, differs: parts, class: cls, diffs,
      inErasedClosure: { [sideX]: a.inE, [sideY]: b.inE }, reachedVia: { [sideX]: pathOf(X, n), [sideY]: pathOf(Y, n) } };
    if (cls === 'definitional' && a.inE && b.inE) {
      const et = (e) => (e.e.t === 'same' ? e.t : e.e.t);
      const ev = (e) => (e.e.v === 'same' ? e.v : e.e.v);
      item.erasedDiffs = {};
      if (a.etK !== b.etK) item.erasedDiffs.type = firstDiff(merkle(et(ea)), merkle(et(eb)), 'K');
      if (a.evK !== b.evK && ev(ea) && ev(eb)) item.erasedDiffs.value = firstDiff(merkle(ev(ea)), merkle(ev(eb)), 'K');
    }
    if (crossOf) { item.cross = crossOf(n); item.defeqBothWays = item.cross.both; }
    if (READINGS[n]) item.reading = READINGS[n];
    items.push(item);
  }
  for (const [only, M, side, E] of [[c.onlyX, X, sideX, ex], [c.onlyY, Y, sideY, ey]]) {
    for (const n of only) {
      const s = M.map.get(n);
      const e = E.get(n);
      const item = { name: n, kind: s.k, module: { [side]: s.mod }, presentOnly: side, class: c.classify(n), inErasedClosure: s.inE, reachedVia: pathOf(M, n),
        type: e ? render(merkle(e.t), e.t.length - 1, 400) : null };
      if (crossOf) item.cross = crossOf(n);
      if (READINGS[n]) item.reading = READINGS[n];
      items.push(item);
    }
  }
  const surface = c.surfaceOnly.map((n) => {
    const a = X.map.get(n);
    const b = Y.map.get(n);
    const w = surfaceWhat(a, b);
    const ea = ex.get(n);
    const eb = ey.get(n);
    const out = { name: n, kind: a.k, differs: w };
    if (w[0] && w[0].startsWith('type')) out.diff = firstDiff(merkle(ea.t), merkle(eb.t), 'S');
    else if (w[0] && w[0].startsWith('value')) out.diff = firstDiff(merkle(ea.v), merkle(eb.v), 'S');
    else if (w.includes('universe parameter names')) out.diff = { x: ea.lp, y: eb.lp };
    else if (w.includes('reducibility hints')) out.diff = { x: ea.hints, y: eb.hints };
    return out;
  });
  return { items, surface };
}
const summary = (c, sx, sy) => ({
  identical: c.identical, identicalModuloProofs: c.identicalModuloProofs, surfaceIdentical: c.surfaceIdentical,
  constants: { [sx]: c.counts.x, [sy]: c.counts.y, common: c.common },
  presentOnly: { [sx]: c.onlyX.length, [sy]: c.onlyY.length },
  kernelDiffer: c.kernelDiffer.length, surfaceOnly: c.surfaceOnly.length,
  erased: { presentOnly: { [sx]: c.erased.onlyX.length, [sy]: c.erased.onlyY.length }, differ: c.erased.differ.length },
});

/* ---- the facts of a kept run ---- */
const rd = (d, n) => {
  if (fs.existsSync(path.join(d, n))) return fs.readFileSync(path.join(d, n), 'utf8');
  if (fs.existsSync(path.join(d, n + '.gz'))) return zlib.gunzipSync(fs.readFileSync(path.join(d, n + '.gz'))).toString('utf8');
  return null;
};
/* the other side's exports read on this side (SeamCross): per label, name -> { status, part, detail } */
function crossFacts(d, side, otherShas) {
  const f = { side, fails: [], labels: {} };
  f.env = (rd(d, 'env.txt') || '').trim().split('\n');
  f.buildExit = rd(d, 'build.exit') ? Number(rd(d, 'build.exit').trim()) : null;
  if (f.buildExit !== 0) f.fails.push('cross on ' + side + ': lake build exit ' + f.buildExit);
  if (!f.env.includes('toolchain: ' + SIDES[side].toolchain)) f.fails.push('cross on ' + side + ': the toolchain is not ' + SIDES[side].toolchain);
  const foreign = {};
  for (const l of (rd(d, 'foreign.sha256') || '').split('\n').filter(Boolean)) { const m = /^([0-9a-f]{64})\s+(\S+)$/.exec(l); if (m) foreign[m[2]] = m[1]; }
  for (const x of ['challenge', 'claim']) {
    const cap = x[0].toUpperCase() + x.slice(1);
    const exit = rd(d, 'cross-' + cap + '.exit');
    if (exit == null || Number(exit.trim()) !== 0) { f.fails.push('cross on ' + side + ': ' + x + ' exit ' + (exit && exit.trim())); continue; }
    if (foreign[x + '.jsonl'] !== otherShas[x + '.jsonl']) f.fails.push('cross on ' + side + ': it read another ' + x + ' export than the one kept');
    const text = rd(d, 'cross-' + x + '.jsonl');
    if (!text) { f.fails.push('cross on ' + side + ': no cross-' + x + '.jsonl'); continue; }
    const ls = text.split('\n').filter(Boolean);
    const head = JSON.parse(ls[0]);
    const map = new Map();
    for (const l of ls.slice(1)) { const e = JSON.parse(l); map.set(e.n, e); }
    const secs = rd(d, 'cross-' + cap + '.seconds');
    f.labels[x] = { header: head, map, seconds: secs == null ? null : Number(secs.trim()) };
  }
  return f;
}
const CROSS_OK = ['same', 'same-kernel', 'defeq'];
function sideFacts(d, side) {
  const want = SIDES[side];
  const f = { side, fails: [] };
  f.env = (rd(d, 'env.txt') || '').trim().split('\n');
  f.buildExit = rd(d, 'build.exit') ? Number(rd(d, 'build.exit').trim()) : null;
  if (f.buildExit !== 0) f.fails.push(side + ': lake build exit ' + f.buildExit);
  const mathlib = (f.env.find((l) => l.startsWith('mathlib: ')) || '').slice(9);
  if (mathlib !== want.mathlib) f.fails.push(side + ': mathlib ' + mathlib + ', not ' + want.mathlib);
  if (!f.env.includes('toolchain: ' + want.toolchain)) f.fails.push(side + ': the toolchain is not ' + want.toolchain);
  const build = rd(d, 'build.log') || '';
  f.buildErrors = build.split('\n').filter((l) => /(^|\s)error:/.test(l)).slice(0, 5);
  f.sorryWarnings = [...build.matchAll(/^warning: (\S+?):\d+:\d+: declaration uses [`']sorry[`']/gm)].map((m) => m[1]);
  f.exports = {};
  const shas = {};
  for (const l of (rd(d, 'exports.sha256') || '').split('\n').filter(Boolean)) { const m = /^([0-9a-f]{64})\s+(?:.*\/)?([^/]+)$/.exec(l); if (m) shas[m[2]] = m[1]; }
  for (const x of want.exports) {
    const cap = x[0].toUpperCase() + x.slice(1);
    const exit = rd(d, 'export-' + cap + '.exit');
    const log = rd(d, 'export-' + cap + '.log') || '';
    const rss = /Maximum resident set size \(kbytes\): (\d+)/.exec(log);
    const secs = rd(d, 'export-' + cap + '.seconds');
    f.exports[x] = { exit: exit == null ? null : Number(exit.trim()), seconds: secs == null ? null : Number(secs.trim()), maxRssKB: rss ? Number(rss[1]) : null,
      line: (log.split('\n').find((l) => l.startsWith('SeamExport ')) || '').replace(/; \/.*$/, '') };
    if (f.exports[x].exit !== 0) f.fails.push(side + ': export ' + x + ' exit ' + f.exports[x].exit);
    const file = path.join(d, x + '.jsonl.gz');
    if (!fs.existsSync(file)) { f.fails.push(side + ': no ' + x + '.jsonl.gz'); continue; }
    f.exports[x].file = file;
    f.exports[x].wantSha256 = shas[x + '.jsonl'] || null;
  }
  return f;
}

function build() {
  const ids = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => /^\d+$/.test(d) && fs.existsSync(path.join(RUNS, d, '_run.json'))) : [];
  if (!ids.length) return null;
  const runs = ids.map((id) => ({ id, run: JSON.parse(rd(path.join(RUNS, id), '_run.json')) })).sort((a, b) => String(a.run.createdAt).localeCompare(String(b.run.createdAt)));
  const { id, run } = runs[runs.length - 1];
  const d = path.join(RUNS, id);
  const facts = {};
  const fails = [];
  for (const side of Object.keys(SIDES)) {
    facts[side] = sideFacts(path.join(d, side), side);
    fails.push(...facts[side].fails);
    if (!facts[side].env.includes('commit: ' + run.headSha)) fails.push(side + ': env.txt names another commit than the run');
  }
  const shasOf = (side) => ({ 'challenge.jsonl': facts[side].exports.challenge.wantSha256, 'claim.jsonl': facts[side].exports.claim.wantSha256 });
  const cross = {
    openai: crossFacts(path.join(d, 'cross-openai'), 'openai', shasOf('anthropic')),
    anthropic: crossFacts(path.join(d, 'cross-anthropic'), 'anthropic', shasOf('openai')),
  };
  for (const s of Object.keys(cross)) {
    fails.push(...cross[s].fails);
    if (!cross[s].env.includes('commit: ' + run.headSha)) fails.push('cross on ' + s + ': env.txt names another commit than the run');
  }
  if (fails.length) refuse('run ' + id + ': ' + fails.join('; '));
  /* a constant's term from one side, read in the other environment (challenge closure first, then claim's) */
  const look = (side, n) => (cross[side].labels.challenge.map.get(n) || cross[side].labels.claim.map.get(n) || null);
  const brief = (e) => (e ? { status: e.status, part: e.part || undefined, detail: e.detail || undefined } : { status: 'not read' });
  const crossOf = (n) => {
    const oInA = brief(look('anthropic', n));
    const aInO = brief(look('openai', n));
    return { openaiTermReadInAnthropic: oInA, anthropicTermReadInOpenAI: aInO, both: CROSS_OK.includes(oInA.status) && CROSS_OK.includes(aInO.status) };
  };
  const ex = {};
  for (const side of Object.keys(SIDES)) {
    ex[side] = {};
    for (const x of SIDES[side].exports) {
      const E = loadExport(facts[side].exports[x].file);
      if (facts[side].exports[x].wantSha256 && E.sha256 !== facts[side].exports[x].wantSha256) refuse(side + '/' + x + ': the export is not the bytes the run hashed');
      if (E.header.lean !== SIDES[side].lean && !String(E.header.lean).startsWith(SIDES[side].lean)) refuse(side + '/' + x + ': written by Lean ' + E.header.lean + ', not ' + SIDES[side].lean);
      if (E.header.truncated) refuse(side + '/' + x + ': the closure was truncated at ' + E.header.cap);
      if (E.header.missing.length || E.header.missingErased.length) refuse(side + '/' + x + ': constants missing from the environment: ' + E.header.missing.concat(E.header.missingErased).slice(0, 5).join(', '));
      ex[side][x] = E;
    }
  }
  const O = ex.openai;
  const A = ex.anthropic;
  for (const side of ['openai', 'anthropic']) {
    if (!ex[side].challenge.map.has(ROOT_THM)) refuse(side + ': the challenge export has no ' + ROOT_THM);
    if (!ex[side].claim.map.has(CLAIM) || !ex[side].claim.map.has(CLAIM_AT)) refuse(side + ': the claim export lacks Claim or ClaimAt');
    if (!ex[side].claim.pseudo.has('⟨unfolded⟩ ' + CLAIM)) refuse(side + ': the claim export has no unfolded Claim');
  }

  /* the bridge theorem's hypothesis, from its challenge file (Anthropic's side) */
  const bt = A.bridge.pseudo.get('⟨type⟩ ' + BRIDGE);
  if (!bt) refuse('the bridge export has no statement of ' + BRIDGE);
  const bm = merkle(bt.t);
  const top = bt.t[bm.root];
  const hyp = top[0] === 'p' ? bt.t[top[3]] : null;
  const concl = top[0] === 'p' ? bt.t[top[4]] : null;
  const bridgeHyp = {
    theorem: BRIDGE, module: bt.mod, statement: render(bm, bm.root, 400),
    hypothesis: hyp && hyp[0] === 'c' ? hyp[1] : null, conclusion: concl && concl[0] === 'c' ? concl[1] : null,
  };
  bridgeHyp.ok = bridgeHyp.hypothesis === CLAIM && bridgeHyp.conclusion === ETH_FALSE && top[0] === 'p';

  /* the statement terms */
  const stmt = (E, which) => {
    if (which === 'claim') { const u = E.claim.pseudo.get('⟨unfolded⟩ ' + CLAIM); return { raw: u.t, erased: u.e.t === 'same' ? u.t : u.e.t }; }
    const e = fetchEntries(E.challenge.file, [ROOT_THM]).get(ROOT_THM);
    return { raw: e.t, erased: e.e.t === 'same' ? e.t : e.e.t };
  };
  const st = { openai: { claim: stmt(O, 'claim'), challenge: stmt(O, 'challenge') }, anthropic: { claim: stmt(A, 'claim'), challenge: stmt(A, 'challenge') } };
  const termCmp = (a, b) => {
    const ma = merkle(a.raw);
    const mb = merkle(b.raw);
    const ea = merkle(a.erased);
    const eb = merkle(b.erased);
    return {
      kernelEqual: ma.K[ma.root] === mb.K[mb.root], surfaceEqual: ma.S[ma.root] === mb.S[mb.root], erasedEqual: ea.K[ea.root] === eb.K[eb.root],
      kernelDiff: firstDiff(ma, mb, 'K'), surfaceDiff: firstDiff(ma, mb, 'S'), nodes: [a.raw.length, b.raw.length],
    };
  };

  /* the headline: TSavo's hypothesis where he uses it (Anthropic's side) against OpenAI's statement where OpenAI proved it */
  const headTerm = termCmp(st.anthropic.claim, st.openai.challenge);
  const headC = compare(A.claim, O.challenge, [CLAIM, CLAIM_AT], [ROOT_THM]);
  const headItems = itemise(A.claim, O.challenge, headC, 'anthropic', 'openai', crossOf);
  /* the pieces of the chain */
  const chC = compare(A.challenge, O.challenge, [ROOT_THM], [ROOT_THM]);
  const clC = compare(A.claim, O.claim, [], []);
  const inA = compare(A.claim, A.challenge, [CLAIM, CLAIM_AT], [ROOT_THM]);
  const inO = compare(O.claim, O.challenge, [CLAIM, CLAIM_AT], [ROOT_THM]);
  const chItems = chC.identical && chC.surfaceIdentical ? null : itemise(A.challenge, O.challenge, chC, 'anthropic', 'openai');

  const identical = headTerm.kernelEqual && headC.identical;
  const moduloProofs = headTerm.erasedEqual && headC.identicalModuloProofs;
  const byClass = {};
  const defeqCount = { bothWays: 0, notBothWays: 0, byClass: {} };
  for (const it of headItems.items) {
    if (it.presentOnly) continue;
    const k = it.defeqBothWays ? 'bothWays' : 'notBothWays';
    defeqCount[k]++;
    defeqCount.byClass[it.class] = defeqCount.byClass[it.class] || { bothWays: 0, notBothWays: 0 };
    defeqCount.byClass[it.class][k]++;
  }
  const crossCounts = Object.fromEntries(Object.keys(cross).map((s) => [s === 'anthropic' ? 'openaiTermsReadInAnthropic' : 'anthropicTermsReadInOpenAI',
    Object.fromEntries(Object.entries(cross[s].labels).map(([x, L]) => [x, Object.assign({ seconds: L.seconds, lean: L.header.lean }, { counts: L.header.counts })]))]));
  const stmtCross = {
    openaiClaimReadInAnthropic: brief(cross.anthropic.labels.claim.map.get('⟨unfolded⟩ ' + CLAIM)),
    anthropicClaimReadInOpenAI: brief(cross.openai.labels.claim.map.get('⟨unfolded⟩ ' + CLAIM)),
    openaiChallengeReadInAnthropic: brief(cross.anthropic.labels.challenge.map.get(ROOT_THM)),
    anthropicChallengeReadInOpenAI: brief(cross.openai.labels.challenge.map.get(ROOT_THM)),
  };
  for (const it of headItems.items) byClass[it.class] = (byClass[it.class] || 0) + 1;

  /* each difference: the kernel's word across the sides, then our reading of its cause */
  const kernelCode = (it) => {
    const a = it.cross.anthropicTermReadInOpenAI.status;
    const o = it.cross.openaiTermReadInAnthropic.status;
    const ok = (s) => CROSS_OK.includes(s);
    if (it.presentOnly) return ok(it.presentOnly === 'anthropic' ? a : o) ? 'one side only, identified in the other environment' : 'one side only';
    return ok(a) && ok(o) ? 'identified both ways' : ok(a) ? 'identified in OpenAI\'s environment only' : ok(o) ? 'identified in Anthropic\'s environment only' : 'not identified';
  };
  const byGroup = {};
  for (const it of headItems.items) {
    const det = [it.cross.anthropicTermReadInOpenAI.detail, it.cross.openaiTermReadInAnthropic.detail].filter(Boolean).join(' ');
    it.kernel = kernelCode(it);
    it.group = groupOf(it.name, det, it.kernel);
    byGroup[it.group] = byGroup[it.group] || { total: 0 };
    byGroup[it.group].total++;
    byGroup[it.group][it.kernel] = (byGroup[it.group][it.kernel] || 0) + 1;
  }
  const groups = Object.fromEntries(Object.entries(byGroup).map(([g, c]) => [g, Object.assign({ reading: (GROUPS.find((x) => x.group === g) || {}).reading || 'not explained by any pattern: read the diffs' }, c)]));
  const kernelTotals = {};
  for (const it of headItems.items) kernelTotals[it.kernel] = (kernelTotals[it.kernel] || 0) + 1;

  /* the statement's own vocabulary: the challenge's OAI definitions, and every constant their types and values name */
  const oaiNames = [...O.challenge.map.keys()].filter((n) => n.startsWith('OAI.'));
  const oaiEntries = fetchEntries(O.challenge.file, oaiNames);
  const vocab = new Set();
  for (const e of oaiEntries.values()) for (const tab of [e.t, e.v].filter(Boolean)) for (const nd of tab) if (nd[0] === 'c' && !nd[1].startsWith('OAI.')) vocab.add(nd[1]);
  const kEq = (n) => A.challenge.map.has(n) && O.challenge.map.has(n) && A.challenge.map.get(n).kSig === O.challenge.map.get(n).kSig;
  const itemOf = new Map(headItems.items.map((it) => [it.name, it]));
  const vocabulary = {
    note: 'the constants the statement is written in: the challenge\'s own OAI definitions, and every constant their types and values name directly (instances included)',
    oaiDefinitions: oaiNames.length,
    oaiDiffering: oaiNames.filter((n) => !kEq(n)).sort().map((n) => ({ name: n, class: itemOf.has(n) ? itemOf.get(n).class : null, group: itemOf.has(n) ? itemOf.get(n).group : null })),
    named: vocab.size,
    namedDiffering: [...vocab].filter((n) => !kEq(n)).sort().map((n) => ({ name: n, class: itemOf.has(n) ? itemOf.get(n).class : null, group: itemOf.has(n) ? itemOf.get(n).group : null, kernel: itemOf.has(n) ? itemOf.get(n).kernel : null })),
  };

  const verdict = identical ? 'IDENTICAL' : 'DIFFERENT';
  const nGroup = (g) => (byGroup[g] ? byGroup[g].total : 0);
  const why = identical
    ? 'TSavo\'s Claim on Anthropic\'s side (Lean ' + A.claim.header.lean + ', Mathlib ' + SIDES.anthropic.mathlib.slice(0, 8) + '), with ClaimAt unfolded once, is the same kernel term as exact_count_and_sat\'s statement on OpenAI\'s side (Lean ' + O.challenge.header.lean + ', Mathlib ' + SIDES.openai.mathlib.slice(0, 8) + '), and all ' + headC.common + ' constants of the two closures are present on both sides as the same kernel terms' + (headC.surfaceIdentical && headTerm.surfaceEqual ? ', binder names and infos included' : ' (binder names, binder infos or metadata differ in ' + (headC.surfaceOnly.length + (headTerm.surfaceEqual ? 0 : 1)) + ' places; the kernel ignores them)')
    : (headTerm.kernelEqual ? 'the two statements are the same kernel term (' + (headTerm.surfaceEqual ? 'binder names included' : 'only a binder name differs: hk against an anonymous arrow binder') + '), ' : 'the statement terms differ (' + (headTerm.kernelDiff ? headTerm.kernelDiff.at : '') + '), ') +
      (vocabulary.oaiDiffering.length ? '' : 'all ' + vocabulary.oaiDefinitions + ' OAI constants of the challenge are the same kernel terms on both sides, ') +
      'but the closures are not: of ' + headC.common + ' common constants ' + headC.kernelDiffer.length + ' differ, and ' + (headC.onlyX.length + headC.onlyY.length) + ' are present on one side only (' +
      Object.entries(byClass).map(([k, v]) => v + ' ' + k).join(', ') + '). Lean\'s kernel, reading each side\'s terms in the other environment, identifies ' + (kernelTotals['identified both ways'] || 0) + ' of the differing constants both ways and ' +
      ((kernelTotals['identified in OpenAI\'s environment only'] || 0) + (kernelTotals['identified in Anthropic\'s environment only'] || 0)) + ' one way. By cause (our reading, every one of the ' + headItems.items.length + ' differences): ' +
      GROUPS.filter((g) => nGroup(g.group)).map((g) => g.label + ' ' + nGroup(g.group)).concat(nGroup('other') ? ['unexplained ' + nGroup('other')] : []).join(', ') + '. ' +
      vocabulary.namedDiffering.length + ' of the ' + vocabulary.named + ' constants the statement names directly differ: ' + vocabulary.namedDiffering.map((x) => x.name).join(', ') + '. Modulo proofs: ' + (moduloProofs ? 'IDENTICAL' : 'DIFFERENT');

  const header = (E) => ({ lean: E.header.lean, githash: E.header.githash, roots: E.header.roots, rootModules: E.header.rootModules, modulesImported: E.header.modulesImported, closure: E.header.full, erasedClosure: E.header.erased, nodes: E.nodes, eraseErrors: E.header.eraseErrors, ms: E.header.ms, sha256: E.sha256 });
  return {
    what: 'The version seam of the TSavo bridge replay (certs/eth-tsavo-bridge.json, gaps), measured. TSavo\'s Bridge.ethIsFalse_of_claim takes as hypothesis OpenAI\'s challenge statement as TSavo\'s file states it (def Claim := ∀ k, 2 ≤ k → ClaimAt k), elaborated on Lean v4.33.1 with Anthropic\'s Mathlib 0df444a3; OpenAI proved exact_count_and_sat on Lean v4.34.1 with Mathlib d13f23b7 (certs/eth-kernel.json). The bytes are the same (the statement check); this record asks whether the ELABORATED statements are the same term, and so is every definition they can unfold to. It does not re-check any proof.',
    campaign: 'eth-refutation; the TSavo bridge lane, its version-seam gap; decided by tools/record-eth-seam.js from a GitHub-hosted run of .github/workflows/eth-seam.yml',
    words: {
      IDENTICAL: 'Claim on Anthropic\'s side, ClaimAt unfolded once, is the same kernel term as exact_count_and_sat\'s statement on OpenAI\'s side, and every constant of the two closures is present on both sides as the same kernel term',
      DIFFERENT: 'anything else; every difference listed and classified (proof-internal, proof-reach, definitional), the verdict never softened by the classes',
    },
    kernelTerm: 'the Expr structure: de Bruijn indices, constant names, universe levels with each parameter by its position, literals, projections; binder names, binder infos and metadata dropped (the kernel drops them). Surface: with them. Proof-erased: every subterm whose type is a proposition (Meta.isProof) replaced by one marker, and the closure taken over what remains',
    closure: 'from the root: definitions and opaques with their type and value; theorems with their statement only (proofs never followed); axioms and Quot with their type; inductives with their type, constructors, recursor, mutual block and, for a structure, its projection functions; constructors with their inductive; recursors with every rule\'s right-hand side. The proof-erased closure follows only what survives erasure, so it reaches no theorem',
    statements: {
      challenge: { repository: PINS.claims.openai.repository, commit: PINS.claims.openai.commit, path: 'lean/ComparatorChallenges/SubexponentialSAT.lean', sha256: PINS.claims.openai.files['lean/ComparatorChallenges/SubexponentialSAT.lean'], module: 'ComparatorChallenges.SubexponentialSAT', root: ROOT_THM },
      tsavo: { repository: TPINS.tsavo.repository, commit: TPINS.tsavo.commit, path: 'bridge/Bridge/OpenAIStatement.lean', sha256: TPINS.tsavo.files['bridge/Bridge/OpenAIStatement.lean'], module: 'Bridge.OpenAIStatement', root: CLAIM, unfolded: CLAIM_AT },
      bridgeHypothesis: bridgeHyp,
    },
    sides: {
      openai: { project: 'corpus/eth-refutation/bridge/openai (autoImplicit false, as OpenAI\'s lakefile) + the two statement modules', toolchain: SIDES.openai.toolchain, mathlib: SIDES.openai.mathlib, exports: { challenge: header(O.challenge), claim: header(O.claim) } },
      anthropic: { project: 'anthropics/formal-math@' + PINS.claims.anthropic.commit.slice(0, 8) + ' eth/ with TSavo\'s bridge/ as eth-tsavo.yml sets it up (README block + the declared challenge-lib amendment) + the challenge module', toolchain: SIDES.anthropic.toolchain, mathlib: SIDES.anthropic.mathlib, exports: { challenge: header(A.challenge), claim: header(A.claim), bridge: header(A.bridge) } },
    },
    verdict,
    why,
    moduloProofs: moduloProofs ? 'IDENTICAL' : 'DIFFERENT',
    headline: {
      compares: 'Claim (TSavo\'s file, Anthropic\'s side, ClaimAt unfolded once) against exact_count_and_sat\'s statement (OpenAI\'s file, OpenAI\'s side); closures without Claim, ClaimAt and exact_count_and_sat',
      statementTerm: Object.assign({}, headTerm, { readAcross: stmtCross }),
      closure: summary(headC, 'anthropic', 'openai'),
      vocabulary,
      byClass,
      kernelAcrossSides: Object.assign({ note: 'each side\'s term read in the other environment (SeamCross): identified = same, same up to binder names, or definitionally equal there by Lean\'s kernel (theorem _ : foreign = local := Eq.refl accepted)' }, kernelTotals),
      groups,
      kernelDefeqAcrossSides: defeqCount,
      crossCounts,
      differences: headItems.items,
      surfaceOnly: headItems.surface,
    },
    chain: {
      note: 'the headline factored: the same text on the two sides, then the declared change (theorem → def ClaimAt + def Claim) on each side',
      challengeAcrossSides: Object.assign({ statementTerm: termCmp(st.anthropic.challenge, st.openai.challenge) }, summary(chC, 'anthropic', 'openai'), chItems ? { differences: chItems.items.map((i) => ({ name: i.name, class: i.class, differs: i.differs || ('present only on ' + i.presentOnly) })) } : {}),
      claimAcrossSides: Object.assign({ statementTerm: termCmp(st.anthropic.claim, st.openai.claim) }, summary(clC, 'anthropic', 'openai')),
      claimVsChallengeAnthropic: Object.assign({ statementTerm: termCmp(st.anthropic.claim, st.anthropic.challenge) }, summary(inA, 'claim', 'challenge')),
      claimVsChallengeOpenAI: Object.assign({ statementTerm: termCmp(st.openai.claim, st.openai.challenge) }, summary(inO, 'claim', 'challenge')),
    },
    classes: CLASS,
    run: { id: Number(id), url: run.url, commit: run.headSha, branch: run.headBranch, createdAt: run.createdAt, conclusion: run.conclusion, jobs: run.jobs },
    steps: Object.fromEntries(Object.keys(SIDES).map((s) => [s, { env: facts[s].env.filter((l) => !/^(runner|cpus|MemTotal|SwapTotal|\/dev|Filesystem)/.test(l)), buildExit: facts[s].buildExit, buildErrors: facts[s].buildErrors, sorryWarnings: facts[s].sorryWarnings,
      exports: Object.fromEntries(Object.entries(facts[s].exports).map(([k, v]) => [k, { exit: v.exit, seconds: v.seconds, maxRssKB: v.maxRssKB, line: v.line }])) }])),
    logs: path.relative(ROOT, d),
    gaps: [
      'The comparison is of terms, not of meanings: two different kernel terms can still denote the same proposition; DIFFERENT says only that the terms differ, and the classes say where.',
      'The kernel check across the sides is constant by constant: a foreign term is read with the LOCAL meaning of every constant it names. It identifies differences of instance paths and of compilation; it cannot identify two different inductive types (the Monoid constructors of the two Mathlibs), so ℝ\'s ring and field structures stay unidentified, and no single kernel has checked that the two statements are the same proposition.',
      'The groups are our reading of the diffs, by name patterns written after reading them (GROUPS in this tool); the kernel statuses and the diffs beside each difference are the evidence.',
      'Proof erasure trusts Meta.isProof on each subterm (Lean\'s elaborator-side type inference, not the kernel); an erase error is counted in each export header (eraseErrors) and keeps the subterm, which can only add differences, never hide one.',
      'The exports are written by our metaprogram running inside each Lean; a bug in it that is the same on both sides would hide nothing it serialises faithfully but could miss a field it does not serialise: the kernel-relevant fields written are kind, universe parameters, type, value, safety, mutual block, inductive/constructor/recursor counts and flags, and recursor rules.',
      'OpenAI\'s side is our project on OpenAI\'s toolchain and Mathlib (as corpus/eth-refutation/bridge/openai), not openai/math itself: the challenge module imports Mathlib alone, so the other dependencies of openai/math cannot reach its elaboration; the package option is autoImplicit false, as theirs.',
    ],
  };
}

const args = process.argv.slice(2);
if (args[0] === '--check') {
  const r = build();
  if (!r) refuse('no kept run');
  const tmp = path.join(os.tmpdir(), 'eth-seam-check-' + process.pid + '.json');
  writeStable(tmp, r);
  const a = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  fs.rmSync(tmp, { force: true });
  const b = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (JSON.stringify(a) !== JSON.stringify(b)) refuse('certs/eth-seam.json is not what the kept run decides');
  console.log('certs/eth-seam.json: ' + b.verdict + ', as the kept run decides');
  process.exit(0);
}
for (const id of args) { if (!/^\d+$/.test(id)) refuse('not a run id: ' + id); keep(id); }
const record = build();
if (!record) refuse('no kept run under ' + path.relative(ROOT, RUNS));
writeStable(OUT, record);
console.log('certs/eth-seam.json: ' + record.verdict + ' (modulo proofs ' + record.moduloProofs + ') — ' + record.why);
