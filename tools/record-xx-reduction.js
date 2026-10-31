#!/usr/bin/env node
/* record-xx-reduction.js — certs/xx-reduction-lean.json: the x^x reduction (lean/xx-reduction), recorded from ONE green
   run of .github/workflows/xx-reduction.yml. The gates are tools/xx-reduction-gates.js and nowhere else; this file runs
   them again on the downloaded logs and on the checkout, and writes the record only when every one passes. The pattern
   is tools/record-eth-bridge.js's, for one project.

   The word, per theorem:
     PROVED   lake build exit 0 on Lean v4.34.1 and Mathlib d13f23b7, the theorem's #print axioms names only propext,
              Classical.choice and Quot.sound (or nothing), no Lean file of the project contains sorry, admit,
              native_decide, an axiom declaration, implemented_by, extern, unsafe or debug.skipKernelTC; and the
              kernels gate passes: Comparator exit 0, "Your solution is okay!", Lean's kernel and nanoda accept, the
              theorem in the config and in the solution export, the challenge, config and lakefile as the checkout
              builds them. The kernels per theorem are in `kernels` (ids in `kernelIds`).
   Anything else is REFUSED and nothing is written. The run's logs are kept in corpus/xx-reduction-lean/runs/<run-id>/
   (the kernel job's in kernels/). tools/run-xx-ledger.py reads the record and re-hashes the Lean files against it.

   usage: node tools/record-xx-reduction.js <run-id>                                                            MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { writeStable } = require('./stable-json.js');
const gates = require('./xx-reduction-gates.js');

const ROOT = path.resolve(__dirname, '..');
const REPO = 'carlostoledo1891/cert-machine';
const OUT = process.env.XX_REDUCTION_OUT || path.join(ROOT, 'certs', 'xx-reduction-lean.json');
const RUNS = path.join(ROOT, 'corpus', 'xx-reduction-lean', 'runs');
const KEEP = ['env.txt', 'build.log', 'build-exit.txt', 'build-seconds.txt', 'axioms.log', 'axioms-exit.txt',
  'lake-manifest.json', 'sources.sha256', 'sources-gate.txt', 'logs-gate.txt'];
const KEEP_KERNELS = ['env.txt', 'machine.txt', 'builders.txt', 'nanoda.patch', 'lake-manifest.json', 'sources.sha256', 'sources-gate.txt',
  'challenge-step.txt', gates.CHALLENGE_FILE, gates.CONFIG_FILE, 'lakefile.toml', 'comparator.log', 'comparator.err', 'comparator.exit',
  'comparator.start', 'comparator.end', 'kernels-gate.txt'];
const KERNEL_IDS = {
  'lean-build': 'Lean\'s kernel inside lake build, Lean v4.34.1 and Mathlib d13f23b7 (the build job)',
  'lean-comparator': 'Lean\'s kernel again: Comparator (leanprover/comparator d03acab1, tag v4.34.0, built with Lean v4.34.1) replays the lean4export export of the solution module XXReduction into its own Lean kernel (the kernels job, on a fresh runner on which nothing built the project before Comparator did)',
  nanoda: 'nanoda (ammkrn/nanoda_lib 3a240721 with the issue44 patch and a 1 GiB stack, as lane K builds it), an independently written kernel in Rust, run by Comparator on the same export',
};
const rd = (d, n) => (fs.existsSync(path.join(d, n)) ? fs.readFileSync(path.join(d, n), 'utf8') : null);

const run = process.argv[2];
if (!/^\d+$/.test(run || '')) { console.error('usage: record-xx-reduction.js <run-id>'); process.exit(2); }
const refuse = (why) => { console.error('REFUSED: ' + why); process.exit(1); };

const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,headBranch,status,conclusion,url,createdAt,workflowName`, { encoding: 'utf8' }));
if (meta.workflowName !== 'xx-reduction') refuse('run ' + run + ' is of the workflow ' + meta.workflowName);
if (meta.status !== 'completed' || meta.conclusion !== 'success') refuse('run ' + run + ' is ' + meta.status + '/' + meta.conclusion);

const src = gates.checkSources();
if (!src.ok) refuse('the checkout fails the source gates:\n  ' + src.fails.join('\n  '));
const names = src.facts.theorems.map((t) => t.name);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xx-reduction-'));
cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} --pattern 'xx-reduction*'`, { stdio: 'inherit' });
const dir = path.join(tmp, 'xx-reduction'), kdir = path.join(tmp, 'xx-reduction-kernels');
if (!fs.existsSync(dir)) refuse('no artifact xx-reduction');
if (!fs.existsSync(kdir)) refuse('no artifact xx-reduction-kernels (the second kernel did not run)');

const logs = gates.checkLogs(dir, names);
if (!logs.ok) refuse(logs.fails.join('; '));
const ranHashes = {};
for (const l of fs.readFileSync(path.join(dir, 'sources.sha256'), 'utf8').split('\n').filter(Boolean)) {
  const m = /^([0-9a-f]{64})\s+\.\/(.+)$/.exec(l);
  if (m) ranHashes[m[2]] = m[1];
}
const diff = Object.keys(src.facts.files).filter((f) => ranHashes[f] !== src.facts.files[f]).concat(Object.keys(ranHashes).filter((f) => !(f in src.facts.files)));
if (diff.length) refuse('the run built other bytes than the checkout holds: ' + diff.join(', '));
const env = rd(dir, 'env.txt') || '';
if (!env.includes('commit: ' + meta.headSha)) refuse('env.txt names another commit than the run');
const mathlibRan = (/^mathlib: ([0-9a-f]{40})$/m.exec(env) || [])[1];
if (mathlibRan !== gates.MATHLIB) refuse('the run checked out mathlib ' + mathlibRan);
const kern = gates.checkKernels(kdir, names);
if (!kern.ok) refuse(kern.fails.join('; '));
const kenv = rd(kdir, 'env.txt') || '';
if (!kenv.includes('commit: ' + meta.headSha)) refuse('the kernel job\'s env.txt names another commit than the run');
if ((/^mathlib: ([0-9a-f]{40})$/m.exec(kenv) || [])[1] !== gates.MATHLIB) refuse('the kernel job checked out another mathlib');

const keep = path.join(RUNS, run);
fs.mkdirSync(path.join(keep, 'kernels'), { recursive: true });
for (const f of KEEP) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(keep, f));
for (const f of KEEP_KERNELS) if (fs.existsSync(path.join(kdir, f))) fs.copyFileSync(path.join(kdir, f), path.join(keep, 'kernels', f));
const t0 = Number((rd(kdir, 'comparator.start') || '').trim()) || null, t1 = Number((rd(kdir, 'comparator.end') || '').trim()) || null;
const rss = /Maximum resident set size \(kbytes\): (\d+)/.exec(rd(kdir, 'comparator.err') || '');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'lake-manifest.json'), 'utf8'));
const KALL = Object.keys(KERNEL_IDS);

const record = {
  what: 'The x^x reduction, proved in Lean 4 with Mathlib: x^x <= 1 on (0, 1] and strictly increasing on [1, oo); for N >= 2, x^x = N has exactly one positive real root, and it is above 1; and for whole numbers 1 <= q <= p, p/q < x iff p^p < N^q·q^p, p/q <= x iff p^p <= N^q·q^p, x < p/q iff N^q·q^p < p^p, x <= p/q iff N^q·q^p <= p^p, with the whole-number bounds at q = 1. That is the step from the root to the integer comparison every verdict of certs/xx-ledger.json rests on; the ledger names the theorem behind each kind of comparison. Every theorem is checked by Lean\'s kernel in lake build and replayed by Lean\'s kernel again and by nanoda, an independently written kernel, through Comparator.',
  campaign: 'reports/xx.html, the AI-assisted formalization pipeline completed (the operator, 2026-10-31)',
  words: { PROVED: 'lake build exit 0 on Lean v4.34.1 and Mathlib d13f23b7; #print axioms names only propext, Classical.choice, Quot.sound (or nothing); no Lean file contains sorry, admit, native_decide, an axiom declaration, implemented_by, extern, unsafe or debug.skipKernelTC; Comparator\'s kernels gate passed (both kernels accept, the theorem exported)' },
  kernelIds: KERNEL_IDS,
  run: { id: meta.databaseId, url: meta.url, commit: meta.headSha, branch: meta.headBranch, createdAt: meta.createdAt, conclusion: meta.conclusion },
  gates: 'tools/xx-reduction-gates.js (sources: pins, nothing forbidden, every theorem printed; logs: exit codes, no sorry, no error, standard axioms only; kernels: Comparator, Lean\'s kernel and nanoda)',
  toolchain: gates.TOOLCHAIN,
  leanVersion: (/^Lean \(version [^)]*\)[^\n]*/m.exec(env) || [null])[0],
  mathlib: mathlibRan,
  packages: manifest.packages.map((x) => ({ name: x.name, rev: x.rev })),
  buildSeconds: Number((rd(dir, 'build-seconds.txt') || '').trim()) || null,
  files: src.facts.files,
  theorems: src.facts.theorems.map((t) => ({ name: t.name, word: 'PROVED', axioms: logs.axioms[t.name], kernels: KALL, doc: t.doc, statement: t.statement, file: t.file, line: t.line })),
  kernelReplay: {
    config: JSON.parse(rd(kdir, gates.CONFIG_FILE)),
    challengeSha256: kern.facts[gates.CHALLENGE_FILE],
    lakefileAmendment: gates.CHALLENGE_LIB.trim(),
    exit: Number(kern.facts.exit),
    verdictLines: kern.facts.lines,
    theoremsExported: kern.facts.exported,
    seconds: t0 && t1 ? t1 - t0 : null,
    maxRssKB: rss ? Number(rss[1]) : null,
    leanVersion: (/^Lean \(version [^)]*\)[^\n]*/m.exec(kenv) || [null])[0],
    lean4export: (/^lean4export .*$/m.exec(kenv) || [null])[0],
    env: kenv.split('\n').filter((l) => /^(comparator|nanoda|landrun|runner|cpus|MemTotal|kernel): /.test(l)),
  },
  logs: path.relative(ROOT, keep),
  notProved: [
    'The negative-base convention. Every theorem is about positive reals (Mathlib\'s Real.rpow); what x^x means for a negative x, and that no negative x is a root worth counting, is a reading of the problem (claimbox/library/selfpower.py), not proved here.',
    'The decider\'s code. tools/run-xx-ledger.py computes p^p and N^q·q^p with Python\'s integers and compares them; the Lean theorems say that comparison decides the bracket, and nothing here proves that the Python computes it. Its red controls (planted wrong brackets, mutants) test it; they do not prove it.',
    'The transcendence of the roots (reports/xx.html §3, one) rests on the Gelfond–Schneider theorem, cited; Mathlib at d13f23b7 holds no Gelfond–Schneider theorem, and none is proved here.',
    'The Comparator challenge is generated from our own file (every proof replaced by sorry), so its statement match checks our text against itself.',
  ],
};
writeStable(OUT, record);
console.log('wrote ' + path.relative(ROOT, OUT) + ': run ' + run + ' at ' + meta.headSha.slice(0, 8) + ', ' + record.theorems.length + ' theorems PROVED, ' + kern.facts.lines.join('; '));
