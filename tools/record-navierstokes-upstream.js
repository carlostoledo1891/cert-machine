#!/usr/bin/env node
/* record-navierstokes-upstream.js — corpus/navier-stokes/upstream-f9e8bc5b.json: what the one
   upstream commit after our pin changed in github.com/openai/NavierStokesAndEuler, decided at the
   level the 2026-09-09 audit worked (statement read, build on this machine, axioms asked of the
   kernel), and the corpus copies of every file the finding rests on, pinned by sha256.

   The audit pinned 8937a8f4 (2026-09-08, the commit the announcement shipped). Upstream HEAD is
   f9e8bc5b (2026-09-10). This record decides ONE field — whether the finite-energy clause of the
   paper's Theorem 1.1 is a formal conclusion — at both commits, and refuses unless the decider says
   NOT FORMAL at the pin (the pin is the red control: a decider that calls the pin formal cannot fail).

   Inputs (outside this repository, like the pinned clone):
     LEAN_HEAD_CLONE  ~/Projects/navier-stokes-lean/NavierStokesAndEuler-f9e8bc5b — a copy-on-write
                      clone of the pinned, built workspace, checked out at f9e8bc5b
     BUILD_LOG        ~/Projects/navier-stokes-lean/build-f9e8bc5b.log — written by
                      tools/build-navierstokes-head.py (Lake v4.34.0-rc2 aborts at start on this
                      machine's current OS, so the pinned `lean` is driven directly; see that file)
   Refuses if the clone is not at f9e8bc5b or is modified, if the build log has no EXIT line, if Lean
   cannot be asked, or if upstream has moved past f9e8bc5b (then this record would be stale on write).
   With NO_BUILD=1 it records the reading only and labels it read-not-built.

   usage: node tools/record-navierstokes-upstream.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const HOME = os.homedir();
const PIN = '8937a8f4cbc7abaab5e9e97d1cc7f5d2319d9538';
const HEAD = 'f9e8bc5b38b6e212696e8a30e3e91517af887bbd';
const CLONE = process.env.LEAN_HEAD_CLONE || path.join(HOME, 'Projects', 'navier-stokes-lean', 'NavierStokesAndEuler-f9e8bc5b');
const LOG = process.env.BUILD_LOG || path.join(HOME, 'Projects', 'navier-stokes-lean', 'build-f9e8bc5b.log');
const MSGS = path.join(path.dirname(LOG), 'build-f9e8bc5b-msgs');
const OUT = path.join(ROOT, 'corpus', 'navier-stokes', 'upstream-f9e8bc5b.json');
const COPY = path.join(ROOT, 'corpus', 'navier-stokes', 'lean', 'f9e8bc5b');
const NO_BUILD = process.env.NO_BUILD === '1';
const die = (m) => { console.error('UPSTREAM RECORD REFUSED: ' + m); process.exit(1); };
const sh = (c, a, opt = {}) => cp.execFileSync(c, a, { cwd: CLONE, encoding: 'utf8', maxBuffer: 1 << 28, ...opt });
const git = (...a) => sh('git', a);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

if (!fs.existsSync(CLONE)) die('no clone at ' + CLONE);
if (git('rev-parse', 'HEAD').trim() !== HEAD) die('clone not at ' + HEAD);
if (git('status', '--porcelain', '--untracked-files=no').trim()) die('the clone has local modifications');

/* is f9e8bc5b still upstream HEAD? a record that calls a superseded commit "current" is the bug this record fixes */
let remote = null;
try { remote = cp.execFileSync('git', ['ls-remote', 'https://github.com/openai/NavierStokesAndEuler.git', 'refs/heads/main'], { encoding: 'utf8', timeout: 60000 }).split(/\s/)[0]; } catch (e) { remote = null; }
if (remote && remote !== HEAD) die('upstream main is now ' + remote + ', past ' + HEAD + ' — audit that commit first');

/* the commits after the pin */
const commits = git('log', '--format=%H|%aI|%cI|%an|%s', PIN + '..' + HEAD).trim().split('\n').map((l) => { const [sha_, authored, committed, author, msg] = l.split('|'); return { sha: sha_, authored, committed, author, msg }; });
const status = git('diff', '--name-status', PIN, HEAD).trim().split('\n').map((l) => l.split('\t'));
const numstat = git('diff', '--numstat', PIN, HEAD).trim().split('\n').map((l) => l.split('\t'));
const diff = {
  files: status.length, added: status.filter((s) => s[0] === 'A').length, modified: status.filter((s) => s[0] === 'M').length, deleted: status.filter((s) => s[0] === 'D').length,
  insertions: numstat.reduce((n, r) => n + Number(r[0]), 0), deletions: numstat.reduce((n, r) => n + Number(r[1]), 0),
  modifiedFiles: status.filter((s) => s[0] === 'M').map((s) => s[1]),
  addedUnder: status.filter((s) => s[0] === 'A').reduce((o, s) => { const d = path.dirname(s[1]); o[d] = (o[d] || 0) + 1; return o; }, {}),
  eulerTouched: status.some((s) => s[1].startsWith('Euler')),
};
/* load-bearing files the diff did NOT touch: the challenge (what Comparator judges), the solution-side definitions,
   the R3 problem statement whose structure carries the clause, the energy lemma, and the build pins */
const UNCHANGED = ['ComparatorChallenges/NavierStokes.lean', 'ComparatorChallenges/NavierStokes.json', 'ComparatorChallenges/Euler.lean', 'NavierStokes/ComparatorDefinitions.lean', 'NavierStokes/ComparatorSolution.lean',
  'NavierStokes/ProblemStatement.lean', 'NavierStokes/R3/ProblemStatement.lean', 'NavierStokes/R3/CompactEnergy.lean', 'lean-toolchain', 'lake-manifest.json', 'lakefile.toml'];
const unchanged = Object.fromEntries(UNCHANGED.map((f) => { try { git('diff', '--quiet', PIN, HEAD, '--', f); return [f, true]; } catch (e) { return [f, false]; } }));
for (const [f, same] of Object.entries(unchanged)) if (!same && /ComparatorChallenges|ComparatorDefinitions/.test(f)) die(f + ' changed — the Comparator-judged statement is not the one audited; re-read it');

/* the files the finding rests on, copied into the corpus and pinned */
const PINNED = ['NavierStokes/R3/Theorem.lean', 'NavierStokes/R3/ActualCandidate.lean', 'NavierStokes/R3/ProblemStatement.lean', 'NavierStokes/R3/CompactEnergy.lean',
  'NavierStokes/R3/PositiveTimeForce.lean', 'NavierStokes/R3/ComparatorBridge.lean', 'NavierStokes/ComparatorR3Theorem.lean', 'NavierStokes/ComparatorTheorem.lean',
  'NavierStokes/PeriodicPaperTheorem.lean', 'formalization.yaml', 'LICENSE'];
fs.mkdirSync(COPY, { recursive: true });
const files = PINNED.map((f) => {
  const b = cp.execFileSync('git', ['show', HEAD + ':' + f], { cwd: CLONE, maxBuffer: 1 << 26 });
  const dest = path.join(COPY, f.replace(/\//g, '-'));
  fs.writeFileSync(dest, b);
  const st = status.find((s) => s[1] === f);
  return { path: f, sha256: sha(b), bytes: b.length, corpusCopy: path.relative(path.join(ROOT, 'corpus', 'navier-stokes'), dest), sincePin: st ? (st[0] === 'A' ? 'added' : st[0] === 'M' ? 'modified' : st[0]) : 'unchanged' };
});

/* ---- the decided field, at a revision, from the source text ---- */
const show = (rev, f) => { try { return git('show', rev + ':' + f); } catch (e) { return null; } };
const lineOf = (text, re) => { if (text == null) return null; const i = text.split('\n').findIndex((l) => re.test(l)); return i < 0 ? null : i + 1; };
function decide(rev) {
  const ps = show(rev, 'NavierStokes/R3/ProblemStatement.lean');
  const block = ps && (/structure CandidateProperties[\s\S]*?\n\n/.exec(ps) || [''])[0];
  const fieldInStructure = !!block && /energy_bounded : UniformFiniteEnergy \(Ico 0 1\) u/.test(block);
  const breakdownUsesProperties = !!ps && /def breakdownStatement : Prop :=[\s\S]*?CandidateProperties ν u p f K ∧ ¬ Nonempty \(GlobalFiniteEnergySolution ν f\)/.test(ps);
  const grep = (re) => { try { return git('grep', '-n', '-E', re, rev, '--', 'NavierStokes').trim().split('\n').filter(Boolean).map((l) => l.replace(rev + ':', '')); } catch (e) { return []; } };
  const producers = grep('^theorem [A-Za-z0-9_.]+ : (NavierStokesR3\\.)?ProblemStatement\\.breakdownStatement');
  const energyUses = grep('uniform_finite_energy').filter((l) => !/^NavierStokes\/R3\/CompactEnergy\.lean:/.test(l));
  const forceSupportProducers = grep('force_compactPositiveTimeSupport|CompactPositiveTimeSupport \\(force');
  return {
    fieldInStructure, breakdownUsesProperties, producersOfBreakdownStatement: producers, usesOfUniformFiniteEnergy: energyUses,
    producersOfPositiveTimeForceSupport: forceSupportProducers,
    formal: fieldInStructure && breakdownUsesProperties && producers.length > 0 && energyUses.length > 0,
  };
}
const atPin = decide(PIN), atHead = decide(HEAD);
if (atPin.formal) die('the decider calls the PIN formal — it cannot fail, so its HEAD answer means nothing');
if (!atPin.fieldInStructure) die('the pin no longer reads as the audit read it (no energy_bounded field in CandidateProperties)');

/* where, computed from the bytes rather than typed */
const T = show(HEAD, 'NavierStokes/R3/Theorem.lean'), AC = show(HEAD, 'NavierStokes/R3/ActualCandidate.lean'), PS = show(HEAD, 'NavierStokes/R3/ProblemStatement.lean');
const CE = show(HEAD, 'NavierStokes/R3/CompactEnergy.lean'), CB = show(HEAD, 'NavierStokes/R3/ComparatorBridge.lean'), CR = show(HEAD, 'NavierStokes/ComparatorR3Theorem.lean'), CT = show(HEAD, 'NavierStokes/ComparatorTheorem.lean'), PT = show(HEAD, 'NavierStokes/PeriodicPaperTheorem.lean');
const locations = {
  energyFieldHole: 'NavierStokes/R3/ActualCandidate.lean:' + lineOf(AC, /^\s*energy_bounded := \?_/),
  energySupplied: 'NavierStokes/R3/ActualCandidate.lean:' + lineOf(AC, /exact CompactEnergy\.uniform_finite_energy/),
  forceSupportSupplied: 'NavierStokes/R3/ActualCandidate.lean:' + lineOf(AC, /^\s*force_support := hsupport/),
  forceSupportFrom: 'NavierStokes/R3/ActualCandidate.lean:' + lineOf(AC, /PositiveTimeForce\.force_compactPositiveTimeSupport/),
  ofLocalizedFields: 'NavierStokes/R3/ActualCandidate.lean:' + lineOf(AC, /^theorem of_localized_fields/),
  theorem_1_1: 'NavierStokes/R3/Theorem.lean:' + lineOf(T, /^theorem theorem_1_1 : ProblemStatement\.breakdownStatement/),
  theorem_1_1_with_dissipation: 'NavierStokes/R3/Theorem.lean:' + lineOf(T, /^theorem theorem_1_1_with_dissipation/),
  candidateProperties: 'NavierStokes/R3/ProblemStatement.lean:' + lineOf(PS, /^structure CandidateProperties/),
  energyField: 'NavierStokes/R3/ProblemStatement.lean:' + lineOf(PS, /energy_bounded : UniformFiniteEnergy \(Ico 0 1\) u/),
  forceSupportField: 'NavierStokes/R3/ProblemStatement.lean:' + lineOf(PS, /force_support : CompactPositiveTimeSupport f/),
  globalFiniteEnergySolution: 'NavierStokes/R3/ProblemStatement.lean:' + lineOf(PS, /^structure GlobalFiniteEnergySolution/),
  breakdownStatement: 'NavierStokes/R3/ProblemStatement.lean:' + lineOf(PS, /^def breakdownStatement : Prop/),
  uniformFiniteEnergy: 'NavierStokes/R3/CompactEnergy.lean:' + lineOf(CE, /^theorem uniform_finite_energy/),
  comparatorOfBreakdown: 'NavierStokes/R3/ComparatorBridge.lean:' + lineOf(CB, /^theorem comparator_of_breakdown/),
  clayCFromTheorem11: 'NavierStokes/ComparatorR3Theorem.lean:' + lineOf(CR, /NavierStokesR3\.theorem_1_1 ν hν/),
  clayDFromPeriodicCorollary: 'NavierStokes/ComparatorTheorem.lean:' + lineOf(CT, /PeriodicPaper\.periodic_corollary ν hν/),
  periodicCorollary: 'NavierStokes/PeriodicPaperTheorem.lean:' + lineOf(PT, /^theorem periodic_corollary : breakdownStatement/),
};
for (const [k, v] of Object.entries(locations)) if (/:null$/.test(v)) die('location ' + k + ' not found at HEAD');
const acLines = AC.split('\n'), hole = Number(locations.energyFieldHole.split(':')[1]), sup = Number(locations.energySupplied.split(':')[1]);
const energyBullet = acLines.slice(sup - 1, sup + 3).map((l) => l.trim()).join(' ');

/* ---- the same greps the pin's lean-repo.json counts, at HEAD (code lines only) ---- */
const tree = git('ls-tree', '-r', '--name-only', HEAD).trim().split('\n').filter((f) => f.endsWith('.lean'));
const lib = (f) => f.split('/')[0].replace(/\.lean$/, '');
const stripComments = (s) => s.replace(/\/-[\s\S]*?-\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/--.*$/gm, '');
const PROOF = ['NavierStokes', 'Euler'];
const counts = {}; const hy = { sorry: 0, axiom: 0, native_decide: 0, unsafe: 0, opaque: 0, partial_def: 0, implemented_by: 0, macro_elab_syntax: 0, maxHeartbeats: 0, maxRecDepth: 0 };
const RX = { sorry: /\bsorry\b/, axiom: /^\s*axiom\b/, native_decide: /native_decide/, unsafe: /\bunsafe\b/, opaque: /^\s*opaque\b/, partial_def: /\bpartial def\b/, implemented_by: /implemented_by|@\[extern/, macro_elab_syntax: /^\s*(macro|elab|syntax|macro_rules)\b/, maxHeartbeats: /set_option maxHeartbeats/, maxRecDepth: /set_option maxRecDepth/ };
for (const f of tree) {
  const s = git('show', HEAD + ':' + f); const k = lib(f);
  counts[k] = counts[k] || { files: 0, lines: 0 }; counts[k].files++; counts[k].lines += s.split('\n').length;
  if (!PROOF.includes(k)) continue;
  for (const l of stripComments(s).split('\n')) for (const [n, re] of Object.entries(RX)) if (re.test(l)) hy[n]++;
}
const yaml = show(HEAD, 'formalization.yaml');
const mainResults = [...yaml.matchAll(/declaration: "([^"]+)"/g)].map((m) => m[1]);

/* ---- the build on this machine, and the kernel ---- */
const STANDARD = ['Classical.choice', 'Quot.sound', 'propext'];
const DECLS = ['NavierStokes.Comparator.navier_stokes_breakdown_R3', 'NavierStokes.Comparator.navier_stokes_breakdown_periodic', 'Euler.euler_breakdown_R3', 'Euler.exists_compact_smooth_euler_singularity',
  'NavierStokesR3.theorem_1_1', 'NavierStokesR3.theorem_1_1_with_dissipation', 'NavierStokes.PeriodicPaper.periodic_corollary'];
let build = { verdict: 'NOT BUILT', note: 'read from source only (NO_BUILD=1)' }, axioms = null, kernelType = null;
if (!NO_BUILD) {
  if (!fs.existsSync(LOG)) die('no build log at ' + LOG + ' (set NO_BUILD=1 to record a reading only)');
  const raw = fs.readFileSync(LOG, 'utf8');
  const exit = /^EXIT (\d+)$/m.exec(raw); if (!exit) die('the build has not finished (no EXIT line in ' + LOG + ')');
  const built = (raw.match(/^✔ \[\d+\/\d+\] Built /gm) || []).length, failedL = raw.split('\n').filter((l) => /^✖ /.test(l));
  const set = /rebuild set (\d+) modules \((\d+) changed \.lean, (\d+) in the ComparatorSolution\/R3\.Theorem closure\)/.exec(raw);
  const real = [...raw.matchAll(/^real (\d+)m([\d.]+)s/gm)].map((m) => Number(m[1]) * 60 + Number(m[2]));
  const dates = raw.split('\n').filter((l) => /^\w{3} \w{3} +\d+ \d\d:\d\d:\d\d/.test(l));
  const closure = /^CLOSURE DONE \(ComparatorSolution \+ R3\.Theorem\) at (\d+)s$/m.exec(raw);
  const slowest = [...raw.matchAll(/Built (\S+) \(([\d.]+)s\)/g)].map((m) => ({ module: m[1], seconds: Number(m[2]) })).sort((a, b) => b.seconds - a.seconds).slice(0, 6);
  const msgFiles = fs.existsSync(MSGS) ? fs.readdirSync(MSGS).filter((f) => fs.statSync(path.join(MSGS, f)).size > 0) : [];
  const msgErrors = msgFiles.filter((f) => /error:/.test(fs.readFileSync(path.join(MSGS, f), 'utf8')));
  const driver = path.join(ROOT, 'tools', 'build-navierstokes-head.py');
  build = {
    method: 'incremental over the pin\'s build: a copy-on-write clone of the built 8937a8f4 workspace checked out at f9e8bc5b; every .lean the diff touched and everything importing one, transitively, recompiled by the pinned `lean` driven directly (tools/build-navierstokes-head.py, the same compile line Lake records in the pin\'s .trace files, minus --setup and the C output); every other module keeps its olean from the 2026-09-09 build on this machine. `lake` is not used because the v4.34.0-rc2 Lake binary aborts at start on this OS (pthread TSD cleanup, "pointer being freed was not allocated", exit 133 even for --version); the same toolchain\'s compiled lean4export and comparator abort the same way, while `lean` runs clean.',
    driver: 'tools/build-navierstokes-head.py', driverSha256: fs.existsSync(driver) ? sha(fs.readFileSync(driver)) : null,
    toolchain: (/^toolchain: (.*)$/m.exec(raw) || [])[1] || null, threads: (/^LEAN_NUM_THREADS=(\d+) JOBS=(\d+)$/m.exec(raw) || []).slice(1).join(' threads × ') + ' jobs',
    started: dates[0] || null, finished: dates[dates.length - 1] || null,
    rebuildSet: set ? Number(set[1]) : null, changedLean: set ? Number(set[2]) : null, closure: set ? Number(set[3]) : null,
    modulesAtHead: tree.filter((f) => /^(NavierStokes|Euler|ComparatorChallenges)/.test(f)).length,
    built, failed: failedL, modulesWithMessages: msgFiles.length, modulesWithErrors: msgErrors,
    buildSeconds: real.length ? real[real.length - 1] : null, closureSeconds: closure ? Number(closure[1]) : null, slowest,
    exitCode: Number(exit[1]),
  };
  build.reused = build.modulesAtHead - build.built;
  build.verdict = build.exitCode === 0 && !failedL.length && !msgErrors.length && set && built === build.rebuildSet ? 'PASS' : 'FAIL';

  /* ask the kernel, exactly as the pin's build record did, plus the new theorem and its type */
  const LEAN = path.join(HOME, '.elan', 'toolchains', 'leanprover--lean4---' + show(HEAD, 'lean-toolchain').trim().replace('leanprover/lean4:', ''), 'bin', 'lean');
  const lp = [path.join(CLONE, '.lake', 'build', 'lib', 'lean')].concat(fs.readdirSync(path.join(CLONE, '.lake', 'packages')).sort().map((p) => path.join(CLONE, '.lake', 'packages', p, '.lake', 'build', 'lib', 'lean')));
  const scratch = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ns-axioms-')), 'AxiomsProbe.lean');
  fs.writeFileSync(scratch, ['import NavierStokes.ComparatorSolution', 'import NavierStokes.R3.Theorem', 'import NavierStokes.PeriodicPaperTheorem', 'import Euler.Solution']
    .concat(DECLS.map((d) => '#print axioms ' + d), ['#check (NavierStokesR3.theorem_1_1 : NavierStokesR3.ProblemStatement.breakdownStatement)']).join('\n') + '\n');
  let out = '';
  try { out = cp.execFileSync(LEAN, [scratch], { cwd: CLONE, env: { ...process.env, LEAN_PATH: lp.join(':') }, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 30 * 60 * 1000 }); }
  catch (e) { die('lean failed: ' + String(e.stdout || '') + String(e.stderr || '')); }
  axioms = {};
  for (const m of out.matchAll(/'([^']+)' depends on axioms: \[([^\]]*)\]/g)) axioms[m[1]] = m[2].split(',').map((s) => s.trim()).filter(Boolean).sort();
  for (const d of DECLS) if (!axioms[d]) die('no axiom line for ' + d + ' in:\n' + out);
  kernelType = (out.split('\n').find((l) => /^NavierStokesR3\.theorem_1_1 : /.test(l)) || '').trim() || null;
  if (!kernelType) die('lean did not type theorem_1_1 as breakdownStatement:\n' + out);
}
const onlyStandard = axioms ? Object.values(axioms).every((ax) => ax.every((a) => STANDARD.includes(a))) : null;

const rec = {
  what: 'The one upstream commit after the audited pin of github.com/openai/NavierStokesAndEuler, read and ' + (build.verdict === 'NOT BUILT' ? 'NOT built' : 'built') + ' here: what it changes, whether the finite-energy clause of the paper\'s Theorem 1.1 is now a formal conclusion (decided at both commits; the pin is the red control), and the corpus copies of every file the finding rests on, pinned by sha256. Written by tools/record-navierstokes-upstream.js; the report and the register read it and retype nothing.',
  pin: PIN, head: HEAD, upstreamMainAtCheck: remote, remoteChecked: !!remote, checkedOn: new Date().toISOString().slice(0, 10),
  commits, diff, unchangedSincePin: unchanged,
  files,
  decided: {
    field: 'energyClauseFormal',
    question: 'Is sup_{0≤t<1} ‖u(t)‖_{L²} < ∞ — the clause of Theorem 1.1 the 2026-09-09 audit found NOT among the formal conclusions — a conclusion of a theorem the repository proves?',
    rule: 'formal iff (1) CandidateProperties (R3/ProblemStatement.lean) carries energy_bounded : UniformFiniteEnergy (Ico 0 1) u, (2) breakdownStatement quantifies that structure with the no-global-solution clause, (3) some theorem is typed ProblemStatement.breakdownStatement, and (4) uniform_finite_energy is used outside its own file; at HEAD the kernel must also type theorem_1_1 as breakdownStatement and report its axioms',
    atPin, atHead,
    energyClauseFormalAtPin: atPin.formal, energyClauseFormalAtHead: atHead.formal && (NO_BUILD || !!kernelType),
    redControl: { what: 'the same decider run on the pinned commit, which the audit read as NOT formal', expect: false, got: atPin.formal, fired: atPin.formal === false },
  },
  locations, energyBullet,
  hygieneAtHead: hy, filesAtHead: tree.length, byLibraryAtHead: counts,
  formalizationYamlAtHead: { mainResults, mainResultsUnchanged: JSON.stringify(mainResults) === JSON.stringify(['NavierStokes.Comparator.navier_stokes_breakdown_R3', 'NavierStokes.Comparator.navier_stokes_breakdown_periodic', 'Euler.euler_breakdown_R3', 'Euler.exists_compact_smooth_euler_singularity']), theorem_1_1Declared: mainResults.includes('NavierStokesR3.theorem_1_1') },
  machine: { model: (() => { try { return cp.execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim(); } catch (e) { return os.platform(); } })(), cpus: os.cpus().length, memoryGB: Math.round(os.totalmem() / 2 ** 30), os: os.platform() + ' ' + os.release(), arch: os.arch() },
  build, axioms, onlyStandardAxioms: onlyStandard, standardAxioms: STANDARD, kernelType,
  comparator: { ranAtHead: false, why: 'the toolchain\'s compiled comparator, lean4export and lake binaries all abort at start on this OS (exit 133); Comparator\'s 2026-09-09 acceptance of both configurations is a fact about 8937a8f4. At f9e8bc5b the challenge files and the solution-side definitions are byte-identical to the pin (unchangedSincePin), so the judged statements are the same; the new proofs were kernel-checked by `lean` as they compiled and their axioms asked above, but not replayed through nanoda.' },
  recorded: new Date().toISOString(),
};
fs.writeFileSync(OUT, JSON.stringify(rec, null, 2) + '\n');
console.log(path.relative(ROOT, OUT) + ': ' + diff.files + ' files changed since the pin; energy clause formal at pin ' + atPin.formal + ', at head ' + rec.decided.energyClauseFormalAtHead
  + '; build ' + build.verdict + (build.built ? ' (' + build.built + ' modules rebuilt, ' + Math.round((build.buildSeconds || 0) / 60) + ' min)' : '') + (axioms ? '; axioms standard: ' + onlyStandard : '') + '; red control ' + (rec.decided.redControl.fired ? 'fired' : 'DEAD'));
