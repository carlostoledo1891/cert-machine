#!/usr/bin/env node
/* record-heptagon.js — Pálvölgyi's non-Ramsey heptagon and his appendix Theorem A.3, decided in Lean through OpenAI's
   classification of finite Euclidean Ramsey configurations, transported to Google DeepMind's statement of Graham's
   conjecture (formal-conjectures erdos_174.variants.graham). Every verdict of the pre-registration
   (notes/heptagon-preregistration-2026-11-07.md, H1–H6 and the corollary D) read back from the runs' facts. Writes
   certs/heptagon.json; `--check` re-derives it, re-running decider B and its three mutants, and refuses on any
   difference; `--full` also re-runs decider A (sympy, about four minutes).

   THE MATHEMATICS IS NOT OURS: the heptagon and Theorem A.3 are Dömötör Pálvölgyi's, with ChatGPT (arXiv:2609.23327, whose
   appendix is labelled "by ChatGPT — unchecked"); the classification and its Lean are OpenAI's (openai/math). This record
   decides them in Lean's kernel and four others; the Lean is ours (github.com/carlostoledo1891/heptagon-ramsey-lean).

   Facts: corpus/heptagon/h1/ (the two clean-room deciders and their outputs), runs/published-A/ (REPRODUCE.sh with
   --kernels --variant on the published code, a RunPod CPU machine, 2026-11-07), runs/published-B/ (the default run on a
   fresh box), runs/published-forged/ (a forged export), runs/kernels-before-rename/ (the four second kernels on the same
   proofs before the library's namespace was renamed for publication; only their verdict logs are kept here, NOTE.md),
   seals.md, timeline.json.

   usage: node tools/record-heptagon.js [--check] [--full]                                                           MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'certs', 'heptagon.json');
const CORP = path.join(ROOT, 'corpus', 'heptagon');
const die = (m) => { console.error('record-heptagon: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rdAt = (dir) => (f) => { const p = path.join(CORP, dir, f); if (!fs.existsSync(p)) die('missing fact ' + dir + '/' + f); return fs.readFileSync(p, 'utf8'); };
const A = rdAt('runs/published-A'), B = rdAt('runs/published-B'), F = rdAt('runs/published-forged'), K = rdAt('runs/kernels-before-rename');
const exitOf = (rd, s) => Number(rd(s + '.exit').trim());
const timeOf = (rd, s) => {
  const t = rd(s + '.time'), w = t.match(/Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (\S+)/), m = t.match(/Maximum resident set size \(kbytes\): (\d+)/), e = t.match(/Exit status: (\d+)/);
  return { wall: w ? w[1] : null, peakKB: m ? Number(m[1]) : null, exitStatus: e ? Number(e[1]) : null };
};
const STD = ['Classical.choice', 'Quot.sound', 'propext'];
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

const PIN = {
  lean: { repository: 'https://github.com/carlostoledo1891/heptagon-ramsey-lean', commit: '914298f37e6f4c7096d924f22f7436cac2dff1e1', tag: 'v1.0.0', license: 'MIT' },
  openai: { repository: 'github.com/openai/math', commit: '4eaee87548250b2682affda7d05d947c05554bae', toolchain: 'leanprover/lean4:v4.34.1', mathlib: 'd13f23b7' },
  entry: { repository: 'github.com/google-deepmind/formal-conjectures', commit: '2055e5a', path: 'FormalConjectures/ErdosProblems/174.lean', sha256: 'b6ac1bcd7d91', declaration: 'Erdos174.erdos_174.variants.graham', pr: 'https://github.com/google-deepmind/formal-conjectures/pull/7706', linkedAt: '81b7906812371c1674f333d71e18d84c0c57e613' },
  paper: { arxiv: '2609.23327v1', author: 'Dömötör Pálvölgyi (proofs by ChatGPT, per the paper)', title: 'A cyclic non-Ramsey heptagon', date: '2026-09-20', tex: 'spherical_non_ramsey.tex', texSha256: '681c953f883506f573a2c59435d0ddbfed061be7852ee2a3a96004d27852d0f1' },
};
const UNDECIDED = 'The heptagon and Theorem A.3 are Dömötör Pálvölgyi\'s, with ChatGPT (arXiv:2609.23327, 2026-09-20; the appendix labelled unchecked by its author); the classification that decides them is OpenAI\'s (openai/math). This record decides, in Lean\'s kernel and four independent kernels, that the heptagon is not Ramsey, that formal-conjectures\' statement of Graham\'s conjecture is false, and that Theorem A.3 holds as printed. It does not decide the "almost every" clause of A.3, the appendix\'s other theorems, the six-point case (others\' Lean), or that OpenAI\'s and formal-conjectures\' definitions capture the informal notions.';

/* the three theorem kinds the page reports, each one an audit target of the published run */
const THM = {
  not_fieldCriterion: 'HeptagonRamsey.Heptagon.not_fieldCriterion', not_ramsey: 'HeptagonRamsey.Heptagon.not_ramsey',
  graham_false: 'HeptagonRamsey.Heptagon.graham_false', graham_false2: "HeptagonRamsey.Heptagon.graham_false'",
  a3: 'HeptagonRamsey.Generic.generic_seven_not_ramsey', seven: 'HeptagonRamsey.Generic.seven_circle_configuration',
};

/* decider B (stdlib) run into a scratch directory, never over the committed outputs */
function runB(mutant) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'hept-b-'));
  fs.copyFileSync(path.join(CORP, 'h1', 'decider-b', 'decider_b.py'), path.join(d, 'decider_b.py'));
  if (mutant) fs.mkdirSync(path.join(d, 'mutants'));
  cp.execFileSync('python3', ['-I', path.join(d, 'decider_b.py')], { cwd: d, env: Object.assign({}, process.env, { MUTANT: mutant || '' }), stdio: 'ignore' });
  const r = JSON.parse(fs.readFileSync(path.join(d, mutant ? path.join('mutants', 'result-b-' + mutant + '.json') : 'result-b.json'), 'utf8'));
  fs.rmSync(d, { recursive: true, force: true });
  return r;
}
function runA() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'hept-a-'));
  fs.copyFileSync(path.join(CORP, 'h1', 'decider-a', 'decide_a.py'), path.join(d, 'decide_a.py'));
  cp.execFileSync('python3', [path.join(d, 'decide_a.py')], { cwd: d, stdio: 'ignore' });
  const r = JSON.parse(fs.readFileSync(path.join(d, 'result-a.json'), 'utf8'));
  fs.rmSync(d, { recursive: true, force: true });
  return r;
}
const verdictsOf = (r) => r.identities.map((i) => i.name + ' ' + i.verdict).join('\n');

function build(rerun) {
  /* H1 · the identities, two clean-room deciders (the third exact check of the heptagon; the first of A.3's finite content) */
  const ra = JSON.parse(fs.readFileSync(path.join(CORP, 'h1', 'decider-a', 'result-a.json'), 'utf8'));
  const rb = JSON.parse(fs.readFileSync(path.join(CORP, 'h1', 'decider-b', 'result-b.json'), 'utf8'));
  const mut = ['weight', 'offcircle', 'generic-weight'].map((m) => ({ id: m, r: JSON.parse(fs.readFileSync(path.join(CORP, 'h1', 'decider-b', 'mutants', 'result-b-' + m + '.json'), 'utf8')) }));
  if (rerun.b) {
    if (verdictsOf(runB('')) !== verdictsOf(rb)) die('decider B re-run here does not give its committed verdicts');
    for (const m of mut) if (verdictsOf(runB(m.id)) !== verdictsOf(m.r)) die('decider B\'s mutant ' + m.id + ' re-run here does not give its committed verdicts');
  }
  if (rerun.a && verdictsOf(runA()) !== verdictsOf(ra)) die('decider A re-run here does not give its committed verdicts');
  const aIds = ra.identities, aOk = aIds.filter((i) => i.verdict === 'CERTIFIED').length;
  const aCtl = ra.negative_controls || [], aCtlRefused = aCtl.filter((c) => c.verdict === 'CONTROL-OK (mutant refuted)').length;
  if (ra.controls_summary.mutants !== aCtl.length || ra.controls_summary.wrongly_accepted !== aCtl.length - aCtlRefused) die('decider A\'s control summary disagrees with its controls');
  const witness = rb.identities.find((i) => /witness: M evaluated at t = /.test(i.name));
  if (!witness || !witness.M_at_witness) die('decider B lost the Equation (2) witness');
  const heptM = rb.identities.find((i) => /^\(4\) M = sum lambda D\(p\) p\^T = 0/.test(i.name));
  const h1 = {
    A: { system: ra.tool, identities: aIds.length, certified: aOk, refuted: aIds.length - aOk, controls: aCtl.length, controlsRefused: aCtlRefused, code: 'corpus/heptagon/h1/decider-a/decide_a.py', patched: 'one line, the private path of the pinned TeX it never reads (sha256 of the run copy 185ec9ee… → 8832a7e2…), re-run here on 2026-11-07' },
    B: { system: rb.system, identities: rb.summary.decided, certified: rb.summary.certified, refuted: rb.summary.refuted, mutants: mut.map((m) => ({ id: m.id, refuted: m.r.summary.refuted, caught: m.r.summary.refuted > 0 })), code: 'corpus/heptagon/h1/decider-b/decider_b.py' },
    equation2: {
      heptagon: { M: 'zero', verdict: heptM ? heptM.verdict : null, reading: 'for the heptagon the main text\'s Equation (2) holds: M = Σλ D(p) pᵀ is the zero matrix' },
      a3: { t: '(0, 1, 2, 3, 5, 7, 11)', M: witness.M_at_witness, symmetric: true, zero: false, verdict: witness.verdict, reading: 'for Theorem A.3\'s configuration M is symmetric and not zero: Equation (2) does not hold there, Lemma A.1\'s symmetric condition does, and the appendix\'s proof uses Lemma A.1' },
    },
  };
  h1.verdict = h1.A.refuted === 0 && h1.A.certified > 0 && h1.B.refuted === 0 && h1.B.certified > 0 && h1.B.mutants.every((m) => m.caught) && !witness.M_at_witness.every((row) => row.every((x) => x === '0')) ? 'CERTIFIED' : 'REFUTED';

  /* the published run: build, audit, planted controls, verbatim checks, the planted variant */
  const st = A('STATUS.txt'), stB = B('STATUS.txt');
  if (!/REPRODUCE: ALL CHECKS PASSED/.test(st) || !/REPRODUCE: ALL CHECKS PASSED/.test(stB)) die('a published run did not end ALL CHECKS PASSED');
  const audit = JSON.parse(A('audit.json')), auditB = B('audit.json');
  if (sha(A('audit.json')) !== sha(auditB)) die('run B\'s audit is not byte-identical to run A\'s');
  const tgt = (name) => { const t = audit.targets.find((x) => x.target === name); if (!t) die('the audit lacks ' + name); return { type: t.type, verdict: t.verdict, axioms: t.axiomsOurs, axiomsLean: t.axiomsLean, closureConstants: t.closureConstants, closureModules: t.closureModules, ours: t.oursInClosure, module: t.module }; };
  const theorems = Object.fromEntries(Object.entries(THM).map(([k, n]) => [k, Object.assign({ name: n }, tgt(n))]));
  const allStd = Object.values(theorems).every((t) => t.verdict === 'PASS' && same(t.axioms, STD) && same(t.axiomsLean, STD));
  const jobs = Number((A('build-roots.log').match(/Build completed successfully \((\d+) jobs\)/) || [])[1]);
  const planted = A('planted/audit-planted.expect').split('\n').filter((l) => /^as required /.test(l)).map((l) => { const m = l.match(/^as required (\S+): (REFUSED|PASS)/); return { id: m[1], verdict: m[2] }; });
  const plantedOk = /PLANTED CONTROLS: all as required/.test(A('planted/audit-planted.expect')) && planted.length === 8;
  const v174 = A('verbatim-174.log'), vSeven = A('verbatim-seven.log');
  const verbatim = {
    formalConjectures: { exit: exitOf(A, 'verbatim-174'), pass: /VERBATIM CHECK: PASS — 273 bytes of IsRamsey and 113 bytes of the graham statement identical to the pin/.test(v174), mutantRefused: /control: the one-token mutant \(1 ≤ k -> 2 ≤ k\) refused, as required/.test(st) },
    openaiNine: { exit: exitOf(A, 'verbatim-seven'), pass: /VERBATIM CHECK: PASS/.test(vSeven), mutantsRefused: (vSeven.match(/PLANTED \([^)]*\): FAIL, as required/g) || []).length },
  };
  const variant = { exit: exitOf(A, 'planted-variant'), refusedAt: (A('planted-variant.log').match(/error: (\S+): unsolved goals/) || [])[1] || null, restored: /PLANTED VARIANT: REFUSED, originals restored green/.test(A('planted-variant.log')) };
  const sources = A('sources.sha256').trim().split('\n').map((l) => { const [h, f] = l.split(/\s+/); return { file: f, sha256: h }; });

  /* H3 · the kernels: on the published code, Lean from scratch three times, nanoda, con-ron; before the rename, the same
     proofs through lean4lean and con-leche too, on the closures and on the whole environments */
  const fresh = ['HeptagonRamsey-Heptagon-Transport', 'HeptagonRamsey-Generic-A3', 'HeptagonRamsey-Generic-Seven'].map((r) => Object.assign({ root: r.replace(/-/g, '.'), exit: exitOf(A, 'fresh-' + r), replayed: new RegExp('replaying ' + r.replace(/-/g, '\\.') + ' with --fresh').test(A('fresh-' + r + '.log')) }, timeOf(A, 'fresh-' + r)));
  const exp = A('export.log').trim().split('\n').filter((l) => !/^warning:/.test(l));
  const nan = A('nanoda.log').match(/Checked (\d+) declarations with no typechecker errors/), cr = A('con-ron.log').match(/con-ron: accepted (\d+) declarations \(--verified\)/);
  const ncfg = JSON.parse(A('nanoda.config.json'));
  const published = {
    fresh,
    export: { sha256: (exp.find((l) => /closure\.ndjson$/.test(l) && /^[0-9a-f]{64}/.test(l)) || '').slice(0, 64), bytes: Number(((exp.find((l) => /closure\.ndjson$/.test(l) && /^-rw/.test(l)) || '').split(/\s+/)[4]) || 0), lines: Number(exp[exp.length - 1]), exporter: 'lean4export 076e8e57 (format 3.1.0)' },
    nanoda: { exit: exitOf(A, 'nanoda'), declarations: nan ? Number(nan[1]) : null, version: 'nanoda_lib 0.4.31 (8de7e0c4)', hardAxiomError: ncfg.unpermitted_axiom_hard_error, permitted: ncfg.permitted_axioms },
    conron: { exit: exitOf(A, 'con-ron'), declarations: cr ? Number(cr[1]) : null, version: 'con-ron 97eead2d --verified' },
    forged: {
      what: 'one record of the export changed: the theorem E_ne_zero given the type of E_mul, its proof unchanged',
      nanoda: { exitStatus: timeOf(F, 'nanoda').exitStatus, rejected: /panicked at/.test(F('nanoda.log')) },
      conron: { exitStatus: timeOf(F, 'con-ron').exitStatus, rejected: /con-ron: rejected: type mismatch in theorem \[at theorem HeptagonRamsey\.Heptagon\.E_ne_zero/.test(F('con-ron.log')) },
    },
  };
  const kline = (b) => { const l = K(b + '.log'), m = l.match(/(?:Checked|checked|accepted) (\d+) declarations/); return Object.assign({ exit: exitOf(K, b), declarations: m ? Number(m[1]) : null }, timeOf(K, b)); };
  const before = [
    ['nanoda', 'the heptagon closure', 'nanoda'], ['nanoda', 'the A.3 closure', 'g-nanoda'], ['nanoda', 'the corollary closure', 's-nanoda'], ['nanoda', 'the whole environment of both', 'nanoda-union-r2'],
    ['con-ron', 'the heptagon closure', 'con-ron'], ['con-ron', 'the A.3 closure', 'g-con-ron'], ['con-ron', 'the corollary closure', 's-con-ron'], ['con-ron', 'the heptagon’s whole environment', 'con-ron-env'], ['con-ron', 'the whole environment of both', 'con-ron-union'],
    ['lean4lean', 'the heptagon closure', 'lean4lean'], ['lean4lean', 'the A.3 closure', 'g-lean4lean'], ['lean4lean', 'the corollary closure', 's-lean4lean'], ['lean4lean', 'the heptagon’s whole environment', 'lean4lean-env'], ['lean4lean', 'the whole environment of both', 'lean4lean-union'],
    ['con-leche', 'the heptagon closure', 'con-leche'], ['con-leche', 'the A.3 closure', 'g-con-leche'], ['con-leche', 'the corollary closure', 's-con-leche'], ['con-leche', 'the whole environment of both', 'con-leche-union'],
  ].map(([kernel, on, b]) => Object.assign({ kernel, on, log: b }, kline(b)));
  const VERS = { nanoda: 'nanoda_lib 8de7e0c4', 'con-ron': 'con-ron 97eead2d --verified', lean4lean: 'lean4lean arena bce34481', 'con-leche': 'con-leche 701d72ae --verified' };
  const h3 = {
    published, beforeRename: before, versions: VERS,
    beforeRenameWhy: 'run on the same proofs before the library’s namespace was renamed for publication; the rename substituted the name and nothing else (each renamed file equals its original after the reverse substitution, byte for byte). Only the verdict logs are kept here: the other logs carry the old name.',
    gaps: [
      'leanchecker --paranoid does not exist in Lean v4.34.1 (its only flags are --verbose and --fresh); not run.',
      'The four second kernels read lean4export’s output: what they check is what the exporter wrote.',
      'nanoda on the whole environment accepted with the environment’s 15 axioms permitted (all declared in Lean’s core); with the hard error on it stops on core’s own Lean.trustCompiler. That the six theorems use only the three standard axioms rests on the audit and on the closure exports, checked with the hard error on.',
      'On the published code two second kernels were re-run (nanoda, con-ron) on the closure, not all four, and not the whole environment.',
    ],
  };
  h3.verdict = fresh.every((f) => f.exit === 0 && f.replayed) && published.nanoda.exit === 0 && published.nanoda.declarations > 0 && published.nanoda.hardAxiomError === true && same(published.nanoda.permitted, STD)
    && published.conron.exit === 0 && published.conron.declarations > 0 && published.forged.nanoda.rejected && published.forged.conron.rejected && before.every((k) => k.exit === 0 && k.declarations > 0) ? 'CERTIFIED' : 'REFUSED';

  const h2 = { theorems: ['not_fieldCriterion', 'not_ramsey', 'graham_false', 'graham_false2'], build: { exit: exitOf(A, 'build-roots'), jobs }, verbatim: verbatim.formalConjectures };
  h2.verdict = h2.build.exit === 0 && allStd && h2.theorems.every((k) => theorems[k].verdict === 'PASS') && verbatim.formalConjectures.pass && verbatim.formalConjectures.exit === 0 ? 'CERTIFIED' : 'REFUSED';
  const h4 = { theorem: 'a3', finiteContent: 'H1, both deciders', verdict: theorems.a3.verdict === 'PASS' && h1.verdict === 'CERTIFIED' ? 'CERTIFIED' : 'REFUSED' };
  const d = { theorem: 'seven', verbatim: verbatim.openaiNine, verdict: theorems.seven.verdict === 'PASS' && verbatim.openaiNine.pass && verbatim.openaiNine.mutantsRefused === 2 ? 'CERTIFIED' : 'REFUSED' };
  const h6 = [
    ...planted.filter((p) => p.id !== 'planted_clean').map((p) => ({ id: 'the audit: ' + ({ planted_sorry: 'a sorry', planted_axiom: 'a new axiom', planted_native: 'native_decide', planted_trust: 'Lean.trustCompiler', planted_implby: '@[implemented_by]', planted_extern: '@[extern]', planted_def: 'a definition given as the theorem' }[p.id] || p.id), caught: p.verdict === 'REFUSED' })),
    { id: 'a heptagon weight 2 → 1', caught: variant.exit === 0 && !!variant.refusedAt && variant.restored },
    { id: 'the copied statement, one token changed', caught: verbatim.formalConjectures.mutantRefused },
    { id: 'the nine-point shape, two tokens changed (two mutants)', caught: verbatim.openaiNine.mutantsRefused === 2 },
    { id: 'a forged export (both kernels)', caught: published.forged.nanoda.rejected && published.forged.conron.rejected },
  ];

  const tl = JSON.parse(fs.readFileSync(path.join(CORP, 'timeline.json'), 'utf8'));
  const gitTime = (c) => new Date(cp.execSync('git show -s --format=%cI ' + c, { cwd: ROOT }).toString().trim()).toISOString().slice(0, 19) + 'Z';
  const code = {};
  for (const f of ['tools/record-heptagon.js', 'corpus/heptagon/h1/decider-a/decide_a.py', 'corpus/heptagon/h1/decider-b/decider_b.py', 'notes/heptagon-preregistration-2026-11-07.md'])
    code[f] = sha(fs.readFileSync(path.join(ROOT, f)));
  const all = [h1, h2, h3, h4, d].every((q) => q.verdict === 'CERTIFIED') && h6.every((r) => r.caught) && plantedOk;
  return {
    what: 'Pálvölgyi\'s heptagon and his appendix Theorem A.3 decided in Lean through OpenAI\'s classification, transported to formal-conjectures\' statement of Graham\'s conjecture: the pre-registered questions H1–H6 and the corollary D, each read back from the runs.',
    undecided: UNDECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/heptagon-preregistration-2026-11-07.md',
    seals: fs.readFileSync(path.join(CORP, 'seals.md'), 'utf8').trim().split('\n').map((l) => { const c = l.split('|').map((x) => x.trim()); return { seal: Number(c[1]), what: c[2], digest: c[3], anchors: c[4] }; }),
    pins: PIN, code, sources,
    verdict: all ? 'CERTIFIED' : 'REFUSED',
    verdicts: { H1: h1.verdict, H2: h2.verdict, H3: h3.verdict, H4: h4.verdict, D: d.verdict, H5: 'READING', H6: h6.filter((r) => r.caught).length + '/' + h6.length + ' caught' },
    theorems, H1: h1, H2: h2, H3: h3, H4: h4, D: d, H6: h6, plantedAudit: planted,
    /* the priors, sealed in seal 5 (and amendment D's before its code), graded at the reveal */
    predictions: [
      { q: 'H1 CERTIFIED', prior: 0.97, outcome: h1.verdict === 'CERTIFIED' },
      { q: 'H2 CERTIFIED inside the three-week clock', prior: 0.50, outcome: h2.verdict === 'CERTIFIED' },
      { q: 'someone else’s Lean proof of the heptagon appears first', prior: 0.35, outcome: false, how: 'none found at the reveal, 19:24 UTC on 7 November: formal-conjectures, openai/math, the authors of the six-point Lean, a code search' },
      { q: 'H3: every second kernel accepts', prior: 0.45, outcome: h3.verdict === 'CERTIFIED' },
      { q: 'H4 read clean or better', prior: 0.80, outcome: h4.verdict === 'CERTIFIED' },
      { q: 'H4 CERTIFIED (A.3 in Lean)', prior: 0.25, outcome: h4.verdict === 'CERTIFIED' },
      { q: 'the corollary D CERTIFIED the same day', prior: 0.80, outcome: d.verdict === 'CERTIFIED' },
    ],
    timeline: {
      seals: tl.seals.map((s) => ({ k: s.k, at: gitTime(s.commit), source: 'cert-machine ' + s.commit + ' (seals/registry.jsonl)' })),
      written: tl.written, run: tl.run, published: tl.published,
    },
    deviations: [
      { id: 'provenance', text: 'The prior-art review said Theorem A.3 had been checked by nobody. Read again before the reveal: wstrinz (Will Strinz) had certified one instance exactly on 16 October (three rational and four algebraically independent circle points, J2-F7 in wstrinz/spherical-ramsey) and uses A.3 by hand for half of a circle phase diagram. Corrected in a dated amendment: the first proof of A.3 as stated, and the first in Lean.' },
      { id: 'rename', text: 'The library’s namespace was renamed for publication after the checks had run. The rename was checked to change the name and nothing else, and the build, the audit, Lean’s from-scratch check on all three roots, two second kernels, both verbatim checks and a planted variant were re-run on the published code.' },
      { id: 'export', text: 'The first export of the published run was void: it named the root file, which is not a Lake module, so it came out empty and both kernels “accepted 0 declarations”. It was stopped and recorded; the script now exports the two leaf modules and refuses an empty export.' },
      { id: 'paranoid', text: 'The rules name leanchecker --paranoid; Lean v4.34.1 has no such mode, so the check rests on leanchecker --fresh and the four independent kernels.' },
    ],
    /* the Palomar entry the PR's author asked for, read from corpus/heptagon/palomar.json (Palomar's API and public runs) */
    palomar: (() => { const P = JSON.parse(fs.readFileSync(path.join(CORP, 'palomar.json'), 'utf8')); if (P.review.blocking_problems_identified !== false || P.verification.conclusion !== 'success' || !/^PALOMAR-\d{4}-\d{2}-\d{2}-\d{6}$/.test(P.id)) die('the Palomar facts do not say registered after a clean verification and review'); return P; })(),
    outcome: { pr: PIN.entry.pr, author: 'anxkhn (Anas Khan), the pull request\'s author', at: '2026-11-07T19:30:24Z', commit: PIN.entry.linkedAt, what: 'added the proof\'s pinned link as the entry\'s formal_proof, with the declaration-local Palomar opt-out; checked the linked source himself (IsRamsey byte-identical, the statement up to namespace and whitespace, no proof placeholders or custom axioms; his file builds); did not re-run our Lean 4.34.1 build or kernels; asked for a Palomar entry', state: 'open, waiting on a maintainer' },
    H5: {
      reading: 'dated 2026-11-07, from the sources themselves',
      sources: [
        { who: 'fedja (MathOverflow)', date: '2018-05-20', what: 'a field-automorphism construction for almost-monochromatic sets, which the paper names as where the author started', url: 'https://mathoverflow.net/questions/300604/almost-monochromatic-point-sets#comment748363_300604' },
        { who: 'Dömötör Pálvölgyi (proofs by ChatGPT)', date: '2026-09-20', what: 'the heptagon (Theorem 1) and the appendix with Theorem A.3, labelled unchecked', url: 'https://arxiv.org/abs/2609.23327' },
        { who: 'OpenAI', date: '2026-09-23', what: 'the classification of finite Euclidean Ramsey configurations, in Lean, with twelve- and nine-point counterexamples; cites the heptagon and says A.3 already implies its nine-point result', url: 'https://github.com/openai/math' },
        { who: 'JD Jones', date: '2026-10-07', what: 'six concyclic points satisfy the criterion, in Lean; an exact certificate that the heptagon fails it, the argument on paper', url: 'https://github.com/JD-Jones-ASES/six-concyclic-lean' },
        { who: 'wstrinz (Will Strinz)', date: '2026-10-16', what: 'six circle points are Ramsey, end to end in Lean; one instance of A.3 certified exactly (J2-F7); the circle phase diagram', url: 'https://github.com/wstrinz/spherical-ramsey' },
        { who: 'pw (byclaude)', date: '2026-10-22', what: 'formal-conjectures issue #7517: OpenAI’s twelve-point theorem transported to formal-conjectures’ IsRamsey; an exact check of the heptagon’s identities', url: 'https://github.com/google-deepmind/formal-conjectures/issues/7517' },
        { who: 'anxkhn (Anas Khan)', date: '2026-10-31', what: 'formal-conjectures pull request #7706: the entry re-tagged solved with the statement ¬ (∀ …), without a proof', url: 'https://github.com/google-deepmind/formal-conjectures/pull/7706' },
      ],
    },
  };
}

const want = { a: process.argv.includes('--full'), b: process.argv.includes('--check') };
const L = build(want);
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/heptagon.json is not what the facts and this code give now');
  console.log('record-heptagon: re-derived, identical' + (want.a ? ' (both deciders re-run)' : ' (decider B and its mutants re-run)') + ' · ' + L.verdict + ' · ' + Object.entries(L.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('record-heptagon: ' + L.verdict + ' · ' + Object.entries(L.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
}
