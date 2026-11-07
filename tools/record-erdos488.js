#!/usr/bin/env node
/* record-erdos488.js — the independent certification of the refutation of Erdős Problem #488 (D. Gessel with OpenAI's
   GPT-6 Astra in Codex, 2026-09-05; google-deepmind/formal-conjectures PR #5297): every verdict of the pre-registration
   (notes/erdos488-preregistration-2026-11-06.md, P1–P7) read back from the run's facts. Writes certs/erdos488.json;
   `--check` re-derives it and refuses on any difference.

   THE DISCOVERY IS GESSEL'S (with GPT-6 Astra); this record decides whether his Lean proof refutes DeepMind's statement AS
   IT STANDS, on the kernels run here, with the arithmetic re-derived by two independent deciders; who found it first is a
   reading (P6).

   Facts: corpus/erdos488/runs/pod-2026-11-06/ (the pod's logs, exits, check and audit lines; no file of the claim is copied:
   the gist has no stated licence), corpus/erdos488/p4/ (both deciders' outputs, re-run here), corpus/erdos488/p5/ (the
   search's output). The pre-registration was sealed before any code ran (corpus/erdos488/seals.md, digests only).

   usage: node tools/record-erdos488.js [--check]                                                                     MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'certs', 'erdos488.json');
const RUN = path.join(ROOT, 'corpus', 'erdos488', 'runs', 'pod-2026-11-06');
const die = (m) => { console.error('record-erdos488: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const rd = (f) => { const p = path.join(RUN, f); if (!fs.existsSync(p)) die('missing fact ' + f); return fs.readFileSync(p, 'utf8'); };
const ex = (s) => Number(rd(s + '.exit').trim());
const jl = (f) => rd(f).split('\n').filter(Boolean).map((l) => JSON.parse(l));
const wall = (s) => { const m = rd(s + '.time').match(/Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): (\S+)/); return m ? m[1] : null; };
const rss = (s) => { const m = rd(s + '.time').match(/Maximum resident set size \(kbytes\): (\d+)/); return m ? Number(m[1]) : null; };
const STD = ['Classical.choice', 'Quot.sound', 'propext'];

const PIN = {
  entry: { repository: 'github.com/google-deepmind/formal-conjectures', commit: '2055e5a', path: 'FormalConjectures/ErdosProblems/488.lean', sha256: '8eedda95f84b4a04e4615065059ac9dc584678b97e5a6b9df1a3c4812d5eecbe', toolchain: 'leanprover/lean4:v4.33.1', declaration: 'Erdos488.erdos_488' },
  claim: { pr: 'https://github.com/google-deepmind/formal-conjectures/pull/5297', gist: 'https://gist.github.com/declangessel/d8e15e5ff1b6c7e99e3d86d7c66f1d08', commit: '034be67a5c958e55505bb357f9e4ef3015788465', file: 'Erdos488.lean', sha256: 'f2a7dcfde9689e00db7b697c22eb6436c1b02d834555a28a476d9e5e606e9ca0', toolchain: 'leanprover/lean4:v4.33.0', author: 'Declan Gessel, with GPT-6 Astra in Codex (OpenAI)', date: '2026-09-05' },
};
const UNDECIDED = 'The discovery is Declan Gessel\'s, made with OpenAI\'s GPT-6 Astra in Codex (2026-09-05). This record decides whether his Lean proof refutes the entry as it stands in google-deepmind/formal-conjectures, on the kernels run here, with the arithmetic re-derived independently. It does not decide who found the counterexample first (a reading), the least counterexample, or anything the four checkers not run here would add.';

function build() {
  /* P2 · port: unchanged in both environments */
  const gistLog = rd('gist-lean.log');
  const p2 = {
    original: { exit: ex('gist-lean'), axiomsStandard: /'Erdos488ExactAdapter\.refutation' depends on axioms: \[propext, Classical\.choice, Quot\.sound\]/.test(gistLog) },
    deepmind: { exit: ex('port-build'), jobs: Number((rd('port-build.log').match(/Build completed successfully \((\d+) jobs\)/) || [])[1]) },
    portDiff: 'none: the gist\'s file is built byte for byte (corpus/erdos488/runs/pod-2026-11-06/port-files.sha256)',
  };
  const portShas = rd('port-files.sha256');
  if (!portShas.includes(PIN.claim.sha256 + '  Erdos488.lean')) die('the built file is not the pinned gist');
  p2.verdict = p2.original.exit === 0 && p2.original.axiomsStandard && p2.deepmind.exit === 0 ? 'CERTIFIED' : 'REFUTED';

  /* P1 · statement */
  const chk = jl('check.jsonl')[0];
  const ctl = (n, f) => { const log = rd(f + '.log'); return { id: n, exit: ex(f), refusedByTypeMismatch: ex(f) !== 0 && /Type mismatch/.test(log) }; };
  const controls = [
    ctl('Ctl1 · the statement as it read before 2026-10-14 (answer(sorry) ↔ …)', 'ctl-Ctl1-rerun'),
    ctl('Ctl2 · the constant 2 changed to 3', 'ctl-Ctl2'),
    ctl('Ctl3 · m > n changed to m ≥ n', 'ctl-Ctl3'),
  ];
  const ctl1First = { exit: ex('ctl-Ctl1'), refusedByTypeMismatch: /Type mismatch/.test(rd('ctl-Ctl1.log')), why: 'its first run failed on a syntax error (`answer` not imported), not on the statement; rerun with the import, it is refused for the right reason' };
  const p1Axioms = /'Plumb\.p1' depends on axioms: \[propext, Classical\.choice, Quot\.sound\]/.test(rd('p1-build.log'));
  const p1 = {
    build: { exit: ex('p1-build'), axiomsStandard: p1Axioms },
    check: { alphaEquivalent: chk.eqv, strictlyEqual: chk.equal, defeq: chk.defeq, p1IsNotOfDeepMindsStatement: chk.p1IsNotOfFC },
    controls, ctl1FirstRun: ctl1First,
  };
  p1.verdict = p1.build.exit === 0 && p1Axioms && chk.eqv && chk.p1IsNotOfFC && controls.every((c) => c.refusedByTypeMismatch) ? 'CERTIFIED' : 'REFUTED';

  /* P3 · kernels */
  const audit = jl('audit.jsonl'), sum = audit.find((r) => r.type === 'summary');
  const nanodaLog = rd('nanoda.log'), nm = nanodaLog.match(/Checked (\d+) declarations with no typechecker errors/);
  const exp = rd('export.sha256').trim().split('\n');
  const p3 = {
    audit: { declarations: sum.declarations, closure: sum.closure, axiomsInClosure: sum.axiomsInClosure, nonstandard: sum.nonstandard, traversalDisagreements: sum.traversalDisagreements, lean: sum.lean },
    leanchecker: { exit: ex('leanchecker'), wall: wall('leanchecker') },
    fresh: { exit: ex('fresh'), wall: wall('fresh'), peakKB: rss('fresh') },
    nanoda: { exit: ex('nanoda'), declarations: nm ? Number(nm[1]) : null, wall: wall('nanoda'), version: 'v0.4.31 (8de7e0c4)', export: { sha256: exp[0].split(' ')[0], bytes: Number((exp[1] || '').split(' ')[0]), exporter: 'lean4export 3.1.0' }, note: 'its one "pretty printer error: Unable to print axioms" is a display note seen in every nanoda run, not a type error' },
    notRun: ['leanchecker-paranoid', 'con-leche', 'con-ron', 'lean4lean'],
    notRunWhy: 'Lean 4.33.1 does not bundle them, and only nanoda and an exporter were built here',
  };
  const auditOk = JSON.stringify([...sum.axiomsInClosure].sort()) === JSON.stringify(STD) && !sum.nonstandard.length && !sum.traversalDisagreements.length;
  p3.verdict = auditOk && p3.leanchecker.exit === 0 && p3.fresh.exit === 0 ? 'CERTIFIED' : 'REFUTED';
  p3.secondKernel = p3.nanoda.exit === 0 && p3.nanoda.declarations > 0 ? 'ACCEPTS' : 'STOPPED';

  /* P4 · the closed arithmetic, both deciders re-run now */
  const js = JSON.parse(cp.execFileSync('node', [path.join(ROOT, 'tools', 'erdos488-p4.js'), '--controls'], { encoding: 'utf8' }));
  const py = JSON.parse(cp.execFileSync('python3', ['-I', path.join(ROOT, 'tools', 'erdos488-p4.py'), '--controls'], { encoding: 'utf8' }));
  const pf = Object.fromEntries(py.facts.map((f) => [f.id, f]));
  const p4 = {
    facts: js.facts.map((f) => ({ id: f.id, statement: f.what, js: f.ok })),
    python: py.facts.map((f) => ({ id: f.id, statement: f.statement, result: f.result })),
    agree: js.Q === pf.F2.numbers.Q && js.phi === pf.F2.numbers.phi,
    phiOverQ: js.facts.find((f) => f.id === 'constant_ratio').ratioPhiOverQ,
    controlsCaught: { js: js.controlsCaught, python: py.allControlsCaught },
    correction: 'the JavaScript decider\'s first control (3·Q < 15·φ) was itself true, since φ/Q > 1/5; corrected to 14 before recording; the Python decider\'s author computed 14 independently',
  };
  p4.verdict = js.allTrue && py.allTrue && p4.agree && js.controlsCaught && py.allControlsCaught ? 'CERTIFIED' : 'REFUTED';

  /* P5 · the small explicit counterexample: a negative result */
  const scan = fs.readFileSync(path.join(ROOT, 'corpus', 'erdos488', 'p5', 'scan1.out'), 'utf8').split('\n');
  const rows = scan.filter((l) => /^(no|HIT) /.test(l)).map((l) => ({ hit: l.startsWith('HIT'), R: Number(l.match(/R=([\d.]+)/)[1]), A: Number(l.match(/\|A\|=(\d+)/)[1]) }));
  const p5 = {
    configurations: rows.length, hits: rows.filter((r) => r.hit).length, skippedOrEmpty: scan.filter((l) => /^(SKIP|EMPTY)/.test(l)).length,
    sieveLimit: 10000000, bestRatioAll: Math.max(...rows.map((r) => r.R)), bestRatioAtLeast10: Math.max(...rows.filter((r) => r.A >= 10).map((r) => r.R)),
    reading: 'no counterexample in the family of smooth bands (T, cT] with exact counts to 10^7; ratios approach 2 only for one to four generators, where an elementary bound keeps them below 2',
    /* the figure's data: the best ratio in each quarter-decade of |A| (the ratios are doubles of exact counts: COMPUTED; the
       2× test itself was exact integer cross-multiplication) */
    envelope: (() => { const by = new Map(); for (const r of rows) { const b = Math.round(Math.log10(r.A) * 4) / 4; const c = by.get(b); if (!c || r.R > c.R) by.set(b, { bin: b, A: r.A, R: r.R }); }
      return [...by.values()].sort((x, y) => x.bin - y.bin); })(),
    liu: { A: 64844856, n: '6.7e13', ratio: 1.447, limit: 2.288, what: 'Liu (doi:10.5281/zenodo.23439872, §5): p = 61, Λ = 67, T = 10^12, the largest ratio by direct computation, against the limiting value 2.288 as T → ∞; read, not decided here' },
    verdict: 'NEGATIVE (no claim)',
  };

  /* P7 · red team */
  const redAx = (r) => { const s = jl('red-audit-' + r + '.jsonl').find((x) => x.type === 'summary'); return s.axiomsInClosure.filter((a) => !STD.includes(a)); };
  const p7 = [
    { id: 'Red1 · the endpoint gap with 1000 for 4096 (false)', caught: ex('red-Red1') !== 0 && /Tactic `decide` proved that the proposition/.test(rd('red-Red1.log')), how: 'the build fails: decide proves the planted inequality false' },
    { id: 'Red2 · a sorry in constant_ratio', caught: redAx('Red2').includes('sorryAx'), how: 'the audit lists ' + redAx('Red2').join(', ') },
    { id: 'Red3 · an added axiom', caught: redAx('Red3').some((a) => /plumbRedAxiom$/.test(a)), how: 'the audit lists ' + redAx('Red3').join(', ') },
    { id: 'Red4 · native_decide in endpoint_gap', caught: redAx('Red4').some((a) => /native_decide/.test(a)), how: 'the audit lists ' + redAx('Red4').join(', ') },
  ];

  const code = {};
  for (const f of ['tools/record-erdos488.js', 'tools/erdos488-p4.js', 'tools/erdos488-p4.py', 'tools/erdos488-search.c', 'tools/erdos488-lean/P1.lean', 'tools/erdos488-lean/Check.lean', 'tools/erdos488-lean/Ctl1.lean', 'tools/erdos488-lean/Ctl2.lean', 'tools/erdos488-lean/Ctl3.lean', 'tools/erdos488-lean/runpod-488.sh', 'notes/erdos488-preregistration-2026-11-06.md'])
    code[f] = sha(fs.readFileSync(path.join(ROOT, f)));
  const all = [p1, p2, p3, p4].every((q) => q.verdict === 'CERTIFIED') && p3.secondKernel === 'ACCEPTS' && p7.every((r) => r.caught);
  return {
    what: 'The independent certification of the refutation of Erdős Problem #488 (formal-conjectures PR #5297): the pre-registered questions P1–P7, each read back from the run.',
    undecided: UNDECIDED,
    generated: new Date().toISOString().slice(0, 10),
    preregistration: 'notes/erdos488-preregistration-2026-11-06.md',
    seals: fs.readFileSync(path.join(ROOT, 'corpus', 'erdos488', 'seals.md'), 'utf8').trim().split('\n').map((l) => { const c = l.split('|').map((x) => x.trim()); return { seal: Number(c[1]), digest: c[3], anchors: c[4] }; }),
    pins: PIN, code,
    verdict: all ? 'CERTIFIED' : 'REFUSED',
    verdicts: { P1: p1.verdict, P2: p2.verdict, P3: p3.verdict, P3secondKernel: p3.secondKernel, P4: p4.verdict, P5: p5.verdict, P6: 'READING', P7: p7.every((r) => r.caught) ? '4/4 caught' : 'MISSED' },
    P1: p1, P2: p2, P3: p3, P4: p4, P5: p5, P7: p7,
    deviations: [
      { id: 'pin', text: 'The pre-registration gives DeepMind\'s Mathlib as b7eb3304; that is the plausible package\'s pin. Mathlib is v4.33.1 at 0df444a3 (the entry\'s lake-manifest.json; fc-cache.log).' },
      { id: 'P3', text: 'The pre-registered rule names three Lean checkers (leanchecker, leanchecker-paranoid, --fresh); leanchecker-paranoid is not in Lean 4.33.1, so P3 rests on leanchecker and --fresh, with nanoda as an independent kernel. The separate re-elaboration of each source with -Ddebug.skipKernelTC=false was not run; the audit records the kernel check on by default.' },
      { id: 'P7', text: 'The pre-registered false variant (4095 for 4096) is in fact true, 2^4095·32769^53 < 3^4095, so it would not have been a fake; the run used 1000, which is false.' },
    ],
    P6: {
      reading: 'dated 2026-11-06, from Liu (Zenodo doi:10.5281/zenodo.23439872, 2026-10-17) and the sources it cites',
      sources: [
        { who: 'D. Gessel (with GPT-6 Astra in Codex)', date: '2026-09-05', what: 'the counterexample, Lean-verified; formal-conjectures PR #5297; Jig problem 398, statement 40', url: PIN.claim.gist },
        { who: 'woshuajolk (Jig)', date: '2026-09-05', what: 'statement 39: the inequality holds whenever A ⊂ (n/5, n]', url: 'https://jig.so/p/398' },
        { who: 'woshuajolk (Jig)', date: 'undated in the sources read', what: 'statement 41: an explicit instance, A = the 257-smooth integers in (2^384, 2^392]', url: 'https://jig.so/p/398' },
        { who: 'C. Benefield (Jig)', date: '2026-09-06', what: 'statements 42, 43: the ratio exceeds 3, then is unbounded', url: 'https://jig.so/p/398' },
        { who: 'shoal-rat', date: '2026-09-05', what: 'Lean-verified bounds and counterexamples for a sieved variant', url: 'https://github.com/shoal-rat/erdos-488-lean' },
        { who: 'Zongmin (Dylan Z.) Liu', date: '2026-10-17', what: 'the sharp order of the growth; the threshold λ* in [5, 54.18]; open problems', url: 'https://doi.org/10.5281/zenodo.23439872' },
      ],
    },
  };
}

const L = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/erdos488.json is not what the facts and this code give now');
  console.log('record-erdos488: re-derived, identical · ' + L.verdict + ' · ' + Object.entries(L.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('record-erdos488: ' + L.verdict + ' · ' + Object.entries(L.verdicts).map(([k, v]) => k + ' ' + v).join(' · '));
}
