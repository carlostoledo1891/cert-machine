#!/usr/bin/env node
/* record-eth-hawkley.js — certs/eth-hawkley-bridge.json: the replay of Daniel Hawkley's ETH cross-formalization
   (github.com/thinkthoughts/math @ d6b79b7d1, a fork of openai/math; RPI-378.3d:
   OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse : ¬ OAI.ParityWL.Complexity.PositiveRateETH →
   MainResults.ETHIsFalse), decided from the facts of runs of .github/workflows/eth-hawkley.yml kept on disk under
   corpus/eth-refutation/hawkley/runs/<run-id>/. THE RULE LIVES HERE AND NOWHERE ELSE: the workflow writes facts, never
   a word; the statement checks are tools/eth-hawkley-gates.js, run again here on the bytes the run checked out.

   The words are certs/eth-kernel.json's:
     CERTIFIED  git's facts hold (HEAD at the pin, a clean tree, the diff against the base naming exactly the pinned
                delta); the statement checks pass on the run's bytes; lake update moved no pinned dependency; Comparator
                exits 0 and prints "Your solution is okay!"; Lean's kernel AND nanoda both print that they accept the
                solution; lake build of the solution module exits 0 without a sorry; and #print axioms (our file) names
                only propext, Classical.choice and Quot.sound for the theorem
     REFUTED    a kernel rejects the solution, in two runs (one run that rejects is recorded as REFUSED, pending the
                second run that would reproduce it)
     REFUSED    no decision, with the exact reason: resources (time, memory, disk), a build failure, bytes differing
                from the pins, a statement check, a moved dependency, Comparator stopping on its own check, or kernels
                disagreeing
   A run is refused outright (nothing written) when it is of another workflow, not completed, or its env names another
   commit than the run's.

   usage: node tools/record-eth-hawkley.js <run-id>...   download each run's artifact (gh), keep it, decide from disk
          node tools/record-eth-hawkley.js               decide again from the kept runs
          node tools/record-eth-hawkley.js --check       the battery: the record on disk is what the kept runs decide */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');
const gates = require('./eth-hawkley-gates.js');

const ROOT = path.resolve(__dirname, '..');
const REPO = 'carlostoledo1891/cert-machine';
const ETH = path.join(ROOT, 'corpus', 'eth-refutation');
const RUNS = path.join(ETH, 'hawkley', 'runs');
const OUT = path.join(ROOT, 'certs', 'eth-hawkley-bridge.json');
const PINS = JSON.parse(fs.readFileSync(path.join(ETH, 'pins.json'), 'utf8'));
const HPINS = JSON.parse(fs.readFileSync(path.join(ETH, 'hawkley', 'pins.json'), 'utf8'));
const STANDARD = gates.STANDARD;
const THEOREM = gates.THEOREM;
const STEPS = ['update', 'cache', 'comparator', 'build', 'axioms'];
const TIME_V = /^\s*(Command being timed|User time|System time|Percent of CPU|Elapsed|Average|Maximum resident|Major|Minor|Voluntary|Involuntary|Swaps|File system|Socket|Signals|Page size|Exit status)/;
const refuse = (why) => { console.error('REFUSED: ' + why); process.exit(1); };
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

/* ---- keep: download a run's artifact and keep its facts beside the pins ---- */
function keep(run) {
  const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,headBranch,status,conclusion,url,createdAt,updatedAt,workflowName,event`, { encoding: 'utf8' }));
  if (meta.workflowName !== 'eth-hawkley') refuse('run ' + run + ' is of the workflow ' + meta.workflowName);
  if (meta.status !== 'completed') refuse('run ' + run + ' is ' + meta.status);
  const jobs = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json jobs`, { encoding: 'utf8' })).jobs
    .map((j) => ({ name: j.name, conclusion: j.conclusion, startedAt: j.startedAt, completedAt: j.completedAt }));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-hawkley-'));
  cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} -n eth-hawkley`, { stdio: 'inherit' });
  const dest = path.join(RUNS, String(run));
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(tmp, { withFileTypes: true })) {
    if (e.name === 'src') continue;   // the checked-out delta: gated below, its hashes kept, never kept twice
    fs.cpSync(path.join(tmp, e.name), path.join(dest, e.name), { recursive: true });
  }
  const src = path.join(tmp, 'src');
  const tree = {};
  if (fs.existsSync(src)) {
    (function walk(d, rel) {
      for (const x of fs.readdirSync(path.join(d, rel), { withFileTypes: true })) {
        const r = rel ? rel + '/' + x.name : x.name;
        if (x.isDirectory()) walk(d, r); else tree[r] = sha256(fs.readFileSync(path.join(d, r)));
      }
    })(src, '');
    const g = gates.checkSources(src);
    fs.writeFileSync(path.join(dest, 'src-gate.json'), JSON.stringify({ ok: g.ok, fails: g.fails, facts: g.facts }, null, 1) + '\n');
  }
  fs.writeFileSync(path.join(dest, '_run.json'), JSON.stringify(Object.assign({}, meta, { jobs, srcTree: tree }), null, 1) + '\n');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('kept run ' + run + ' (' + meta.conclusion + ') in ' + path.relative(ROOT, dest));
}

/* ---- facts ---- */
const rd = (d, n) => (fs.existsSync(path.join(d, n)) ? fs.readFileSync(path.join(d, n), 'utf8') : null);
const num = (s) => (s != null && /^-?\d+$/.test(s.trim()) ? Number(s.trim()) : null);
function memPeak(d, t0, t1) {
  const t = rd(d, 'mem.tsv');
  if (!t || t0 == null) return null;
  const v = t.split('\n').map((l) => l.trim().split(/\s+/).map(Number)).filter((p) => p.length === 2 && p[0] >= t0 && p[0] <= (t1 == null ? Infinity : t1)).map((p) => p[1]);
  return v.length ? Math.max(...v) : null;
}
function step(d, s) {
  const ex = num(rd(d, s + '.exit'));
  const t0 = num(rd(d, s + '.start'));
  const t1 = num(rd(d, s + '.end'));
  if (ex == null && t0 == null) return null;
  const err = rd(d, s + '.err') || '';
  const log = rd(d, s + '.log') || '';
  const rss = /Maximum resident set size \(kbytes\): (\d+)/.exec(err);
  return {
    exit: ex, seconds: t0 != null && t1 != null ? t1 - t0 : null, timedOut: ex === 124, maxRssKB: rss ? Number(rss[1]) : null, usedMemPeakKB: memPeak(d, t0, t1),
    logTail: log.split('\n').filter((l) => l.trim()).slice(-25), errTail: err.split('\n').filter((l) => l.trim() && !TIME_V.test(l)).slice(-25),
    text: log + '\n' + err,
  };
}
function comparatorFacts(s) {
  if (!s) return null;
  const t = s.text;
  return {
    okay: /^Your solution is okay!$/m.test(t),
    kernels: [...new Set([...t.matchAll(/^(.*kernel (?:accepts|rejects|rejected).*|Quotient post-check rejects.*|Error while interacting with .*)$/gm)].map((m) => m[1].trim()))].sort(),
    stages: [...t.matchAll(/^(Building \S+|Exporting .*? from \S+|Running .*kernel.*)$/gm)].map((m) => m[1]).slice(0, 20),
    lakeErrors: t.split('\n').filter((l) => /(^|\s)error:/.test(l)).slice(0, 5),
  };
}
function hashes(d, n) {
  const t = rd(d, n);
  if (!t) return null;
  const out = {};
  for (const l of t.split('\n').filter(Boolean)) { const m = /^([0-9a-f]{64})\s+(.+)$/.exec(l); if (m) out[m[2].replace(/^\.\//, '')] = m[1]; }
  return out;
}
function axiomsOf(s) {
  const out = {};
  if (!s) return out;
  for (const m of s.text.matchAll(/^'([^']+)' depends on axioms: \[([^\]]*)\]/gm)) out[m[1]] = m[2].split(',').map((x) => x.trim()).filter(Boolean);
  for (const m of s.text.matchAll(/^'([^']+)' does not depend on any axioms/gm)) out[m[1]] = [];
  return out;
}
const killedByMemory = (s) => s && (s.exit === 137 || /exited with 137|Killed|out of memory|std::bad_alloc|SIGKILL/i.test(s.errTail.concat(s.logTail).join('\n')));
const outOfDisk = (s) => s && /No space left on device|ENOSPC/i.test(s.errTail.concat(s.logTail).join('\n'));

function facts(id) {
  const d = path.join(RUNS, id);
  const run = JSON.parse(rd(d, '_run.json'));
  const f = { id, run, dir: path.relative(ROOT, d), fails: [] };
  f.env = (rd(d, 'env.txt') || '').trim().split('\n');
  if (!f.env.includes('commit: ' + run.headSha)) f.envCommitMismatch = true;
  f.head = (rd(d, 'head.txt') || '').trim();
  f.headAfter = (rd(d, 'head-after.txt') || '').trim();
  f.statusBefore = (rd(d, 'status-before.txt') || '').trim();
  f.statusAfter = (rd(d, 'status-after.txt') || '').trim().split('\n').filter(Boolean);
  f.baseAncestor = /is an ancestor of HEAD/.test(rd(d, 'base-ancestor.txt') || '');
  const dc = rd(d, 'delta-check.json');
  f.deltaCheck = dc ? JSON.parse(dc) : null;
  const sg = rd(d, 'src-gate.json');
  f.srcGate = sg ? JSON.parse(sg) : null;
  const want = HPINS.hawkley.files;
  f.srcTreeOk = Boolean(run.srcTree && Object.keys(want).every((p) => run.srcTree[p] === want[p]) && Object.keys(run.srcTree).every((p) => p in want));
  const after = hashes(d, 'delta-after.sha256');
  f.deltaAfterOk = Boolean(after && Object.keys(want).every((p) => after[p] === want[p]));
  const sf = rd(d, 'sources-facts.json');
  f.ciSources = sf ? JSON.parse(sf) : null;
  f.controls = (rd(d, 'controls-gate.txt') || '').includes('every red control refused; the clean copy passes');
  f.manifestOk = /^all \d+ dependency revisions equal the pinned manifest/m.test(rd(d, 'manifest-check.txt') || '');
  f.mathlib = ((rd(d, 'mathlib.txt') || '').match(/mathlib: ([0-9a-f]{40})/) || [])[1] || null;
  f.steps = {};
  for (const s of STEPS) f.steps[s] = step(d, s);
  f.comparator = comparatorFacts(f.steps.comparator);
  f.axioms = axiomsOf(f.steps.axioms);
  f.buildLog = f.steps.build ? { sorry: /declaration uses 'sorry'/.test(f.steps.build.text), errors: f.steps.build.text.split('\n').filter((l) => /(^|\s)error:/.test(l)).slice(0, 5) } : null;
  f.machine = (rd(d, 'machine.txt') || '').trim().split('\n');
  const ac = rd(d, 'audit-config.json');
  f.auditConfig = ac ? JSON.parse(ac) : null;
  return f;
}

/* ---- the rule ---- */
function decide(f) {
  const pin = HPINS.hawkley.commit;
  if (f.envCommitMismatch) return { word: 'REFUSED', stage: 'run', why: 'env.txt names another commit than the run (' + f.run.headSha + ')' };
  if (f.head !== pin) return { word: 'REFUSED', stage: 'bytes', why: 'the clone\'s HEAD is ' + (f.head || 'absent') + ', not the pinned ' + pin };
  if (!f.baseAncestor) return { word: 'REFUSED', stage: 'bytes', why: 'the base commit ' + HPINS.hawkley.base.commit + ' is not an ancestor of the fork\'s pin in the clone' };
  if (f.statusBefore) return { word: 'REFUSED', stage: 'bytes', why: 'the clone was not clean at the pin: ' + f.statusBefore.split('\n').slice(0, 3).join('; ') };
  if (!f.deltaCheck || !f.deltaCheck.ok) return { word: 'REFUSED', stage: 'bytes', why: 'git\'s diff against the base does not name exactly the pinned delta: ' + JSON.stringify(f.deltaCheck && { missing: f.deltaCheck.missing, extra: f.deltaCheck.extra }) };
  if (!f.srcTreeOk) return { word: 'REFUSED', stage: 'bytes', why: 'the delta the run checked out differs from corpus/eth-refutation/hawkley/pins.json' };
  if (!f.srcGate || !f.srcGate.ok) return { word: 'REFUSED', stage: 'statement', why: 'the statement checks refuse the run\'s bytes: ' + (f.srcGate ? f.srcGate.fails.join('; ') : 'not run') };
  if (!f.ciSources || !f.ciSources.ok) return { word: 'REFUSED', stage: 'statement', why: 'the statement checks in the run refused: ' + (f.ciSources ? f.ciSources.fails.join('; ') : 'not run (an earlier step failed)') };
  if (!f.controls) return { word: 'REFUSED', stage: 'statement', why: 'the red controls in the run did not all behave' };
  const up = f.steps.update;
  if (!up || up.exit !== 0) return { word: 'REFUSED', stage: 'prepare', why: 'lake update ' + (up ? (outOfDisk(up) ? 'resources: disk; ' : '') + 'exit ' + up.exit + ': ' + (up.errTail.slice(-1)[0] || up.logTail.slice(-1)[0] || '') : 'did not run') };
  if (!f.manifestOk) return { word: 'REFUSED', stage: 'prepare', why: 'lake update moved a pinned dependency (manifest-check.txt)' };
  const cache = f.steps.cache;
  if (!cache || cache.exit !== 0) return { word: 'REFUSED', stage: 'prepare', why: 'lake exe cache get ' + (cache ? (outOfDisk(cache) ? 'resources: disk; ' : '') + 'exit ' + cache.exit + ': ' + (cache.errTail.slice(-1)[0] || '') : 'did not run') };
  if (f.mathlib !== PINS.claims.openai.mathlib) return { word: 'REFUSED', stage: 'prepare', why: 'Mathlib resolved to ' + f.mathlib + ', the pin is ' + PINS.claims.openai.mathlib };
  if (!f.auditConfig || f.auditConfig.enable_nanoda !== true) return { word: 'REFUSED', stage: 'comparator', why: 'the config Comparator ran had nanoda off' };
  const s = f.steps.comparator;
  const c = f.comparator;
  if (!s) return { word: 'REFUSED', stage: 'comparator', why: 'Comparator did not run' };
  const rejecting = c.kernels.filter((l) => /rejects|rejected/.test(l));
  if (rejecting.length) {
    const disagree = c.kernels.includes('Lean default kernel accepts the solution') || c.kernels.includes('nanoda kernel accepts the solution');
    return { word: 'REJECTED', stage: 'comparator', kernelsDisagree: disagree, why: rejecting.join('; ') + (disagree ? ' while the other kernel accepts (the kernels disagree)' : '') };
  }
  if (s.timedOut) return { word: 'REFUSED', stage: 'comparator', why: 'resources: Comparator hit its time limit after ' + s.seconds + ' s' };
  if (killedByMemory(s)) return { word: 'REFUSED', stage: 'comparator', why: 'resources: memory (exit ' + s.exit + ', used-memory peak ' + s.usedMemPeakKB + ' kB): ' + (s.errTail.slice(-1)[0] || '') };
  if (outOfDisk(s)) return { word: 'REFUSED', stage: 'comparator', why: 'resources: disk (exit ' + s.exit + ')' };
  const errLine = c.kernels.find((l) => /Error while interacting/.test(l));
  if (errLine) return { word: 'REFUSED', stage: 'comparator', why: 'a kernel could not be run: ' + errLine };
  if (s.exit !== 0 || !c.okay) {
    const lines = s.errTail.concat(s.logTail);
    const mismatch = lines.find((l) => /does not match|not permitted|disallowed axiom|axiom/i.test(l));
    if (mismatch) return { word: 'REFUSED', stage: 'comparator', why: 'Comparator stopped on its own check: ' + mismatch };
    const stage = c.stages.slice(-1)[0] || 'before its first stage';
    return { word: 'REFUSED', stage: 'comparator', why: 'Comparator exit ' + s.exit + ' at "' + stage + '": ' + (c.lakeErrors[0] || s.errTail.slice(-1)[0] || s.logTail.slice(-1)[0] || '') };
  }
  const accepts = ['Lean default kernel accepts the solution', 'nanoda kernel accepts the solution'].filter((l) => c.kernels.includes(l));
  if (accepts.length < 2) return { word: 'REFUSED', stage: 'comparator', why: 'Comparator accepted but printed ' + accepts.length + ' of the two kernel acceptances (' + c.kernels.join('; ') + ')' };
  const b = f.steps.build;
  if (!b) return { word: 'REFUSED', stage: 'build', why: 'lake build did not run' };
  if (b.timedOut) return { word: 'REFUSED', stage: 'build', why: 'resources: lake build hit its time limit after ' + b.seconds + ' s' };
  if (killedByMemory(b)) return { word: 'REFUSED', stage: 'build', why: 'resources: memory in lake build (exit ' + b.exit + ')' };
  if (b.exit !== 0) return { word: 'REFUSED', stage: 'build', why: 'lake build exit ' + b.exit + ': ' + (f.buildLog.errors[0] || b.errTail.slice(-1)[0] || '') };
  if (f.buildLog.sorry) return { word: 'REFUSED', stage: 'build', why: 'lake build reports a declaration that uses sorry' };
  if (!(THEOREM in f.axioms)) return { word: 'REFUSED', stage: 'axioms', why: 'the axiom print did not name ' + THEOREM + ' (exit ' + (f.steps.axioms && f.steps.axioms.exit) + ')' };
  const extra = f.axioms[THEOREM].filter((a) => !STANDARD.includes(a));
  if (extra.length) return { word: 'REFUSED', stage: 'axioms', why: 'the axiom print names ' + extra.join(', ') };
  if (!f.deltaAfterOk) return { word: 'REFUSED', stage: 'bytes', why: 'the delta\'s bytes changed during the run' };
  if (f.headAfter !== pin) return { word: 'REFUSED', stage: 'bytes', why: 'HEAD moved during the run' };
  return { word: 'CERTIFIED', why: 'git\'s facts hold (HEAD at the pin, a clean tree, the diff against openai/math@' + HPINS.hawkley.base.commit.slice(0, 8) + ' naming exactly the pinned delta); the statement checks pass on the run\'s bytes; lake update moved no pinned dependency; Comparator exit 0 with "Your solution is okay!" on the claimant\'s config with nanoda on; Lean\'s kernel and nanoda both accept; lake build exit 0; the theorem\'s axioms are among ' + STANDARD.join(', ') };
}

/* ---- the record ---- */
const brief = (s) => s && { exit: s.exit, seconds: s.seconds, timedOut: s.timedOut, maxRssKB: s.maxRssKB, usedMemPeakKB: s.usedMemPeakKB };
function build() {
  const ids = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => /^\d+$/.test(d) && fs.existsSync(path.join(RUNS, d, '_run.json'))) : [];
  const hist = ids.map((id) => { const f = facts(id); return { f, d: decide(f) }; }).sort((a, b) => String(a.f.run.createdAt).localeCompare(String(b.f.run.createdAt)));
  if (!hist.length) return null;
  const last = hist[hist.length - 1];
  const rejections = hist.filter((h) => h.d.word === 'REJECTED');
  let word = last.d.word;
  let why = last.d.why;
  if (word === 'REJECTED') {
    if (rejections.length >= 2) word = 'REFUTED';
    else { word = 'REFUSED'; why = 'a kernel rejected the solution in run ' + last.f.id + ' (' + last.d.why + '); REFUTED waits for a second run that reproduces it'; }
  }
  const f = last.f;
  const src = f.srcGate && f.srcGate.facts;
  const ci = f.ciSources && f.ciSources.facts;
  const H = HPINS.hawkley;
  const gaps = [
    'The hypothesis is ParityLifts\' predicate, not OpenAI\'s checked statement. ¬ OAI.ParityWL.Complexity.PositiveRateETH is a definition of OpenAI\'s combinatorics library (lean/OAI/Combinatorics/ParityLifts/SATChoice.lean, lines 24–35, sliced into the challenge), while what OpenAI\'s release checks with Comparator is OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat (certs/eth-kernel.json). The link from OpenAI\'s theorem to ¬ PositiveRateETH is the claimant\'s SEPARATE theorem OAI.Bridges.ETH.not_positiveRateETH (lean/OAI/Bridges/ETH/FinalImplication.lean, his components A–C of 2026-11-01, commit 81ec97cd2 whose message says "NOT built in this environment"; his page says a later VPS build passed), which imports OpenAI\'s whole family-378 proof and is NOT replayed here (the hosted runner cannot hold that build: certs/openai-math-kernel-7ef5c0cc.json; a pod run is the operator\'s word). So this record, if CERTIFIED, decides ¬ PositiveRateETH → ETHIsFalse and nothing about ETH itself.',
    'nanoda is off in the claimant\'s shipped config (enable_nanoda: false, like every challenge of openai/math); this replay turns it on, its one declared change, so both kernels decide here. The claimant reports nanoda aborting inside Comparator on a 32 MB thread stack in his harness and a standalone nanoda acceptance with a 1 GiB stack; here nanoda runs inside Comparator with the eth-kernel lane\'s 1 GiB-stack build.',
    'The claimant states three qualifications of his own harness run (Landlock ABI v7 with an older landrun 3ee150a, no systemd-run wrapper, nanoda\'s stack); none applies here (landrun 811cfff5 as the eth-kernel lane pins it, the runner\'s LSM list in machine.txt), and his VPS run is his own report, not read here.',
    'Independence of the proof from both labs\' results is the claimant\'s claim, checked by his Audit.lean at constant level; here it is checked at the import level only (tools/eth-hawkley-gates.js closure: the solution reaches ' + (src && src.closure ? src.closure.openaiModules.join(', ') : '?') + ' and Mathlib, nothing under OAI.Algorithms or OAI.Bridges.ETH) and by Comparator\'s own statement comparison; his Audit module is not built here.',
    'Anthropic\'s MainResults.lean is vendored into OpenAI\'s project and re-elaborated on Lean v4.34.1 with Mathlib d13f23b7, while Anthropic proved ETHIsFalse on Lean v4.33.1 with Mathlib 0df444a3 (certs/eth-kernel.json): the bytes are the same (the gates), the elaborated terms are not compared here — the same seam certs/eth-seam.json measured for the TSavo bridge, in the other direction.',
    'leanchecker --fresh was not run on this theorem; the rule stands on Lean\'s kernel and nanoda inside Comparator.',
  ];
  if (src && src.census && src.census.mentionsInComments.length) gaps.push('Mentions of forbidden words inside comments (facts, not holes): ' + src.census.mentionsInComments.map((m) => m.file + ' (' + m.what + ' ×' + m.count + ')').join('; ') + '.');
  const steps = {};
  for (const s of STEPS) if (f.steps[s]) steps[s] = brief(f.steps[s]);
  return {
    what: 'The replay of a third party\'s Lean proof that joins the two claimed refutations of the Exponential Time Hypothesis in the other direction from TSavo\'s: Daniel Hawkley\'s OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse : ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse (github.com/thinkthoughts/math @ d6b79b7d1, RPI-378.3d, a fork of openai/math: OpenAI ParityLifts\' ETH predicate, negated, implies Anthropic\'s ETHIsFalse), built inside OpenAI\'s lean/ project at openai/math @ 7ef5c0cc, decided by tools/record-eth-hawkley.js from a GitHub-hosted run of .github/workflows/eth-hawkley.yml. CERTIFIED here means the statements are the two labs\' own bytes (Anthropic\'s MainResults.lean byte for byte; OpenAI\'s ParityLifts definitions sliced byte for byte, checked against our pins), the theorem states exactly ¬ PositiveRateETH → ETHIsFalse, uses only propext, Classical.choice and Quot.sound, and two independently written kernels accept it. It does NOT mean that ETH is false, nor that OpenAI\'s checked theorem implies Anthropic\'s: the hypothesis is ParityLifts\' predicate, whose link to OpenAI\'s checked statement is the claimant\'s separate, heavier theorem, not replayed here (gaps).',
    campaign: 'eth-refutation; the Hawkley bridge lane (the claim arrived by the site\'s contact form on 2026-11-03, pointing at formalize.now/378/); pins recorded before any run (corpus/eth-refutation/hawkley/pins.json)',
    words: {
      CERTIFIED: 'git\'s facts hold; the statement checks pass on the run\'s bytes; lake update moved no pinned dependency; Comparator exit 0 with "Your solution is okay!"; Lean\'s kernel and nanoda both accept; lake build exit 0; #print axioms (our file) names only propext, Classical.choice, Quot.sound',
      REFUTED: 'a kernel rejects the solution, reproduced by a second run',
      REFUSED: 'no decision, with the exact reason (resources, a build failure, bytes differing from the pins, a statement check, a moved dependency, Comparator stopping on its own check, kernels disagreeing, or one kernel rejection not yet reproduced)',
    },
    claim: { repository: H.repository, forkOf: H.forkOf, commit: H.commit, commitDate: H.commitDate, author: H.author + ' (Daniel Hawkley, formalize.now, per his message and his page)', license: H.license, theorem: THEOREM, solutionModule: gates.SOLUTION, challengeModule: gates.CHALLENGE_MODULE, config: H.comparatorConfig.content, configSha256: H.comparatorConfig.sha256, delta: H.delta, commitsAhead: H.commits.length, pinnedFiles: H.fileCount, pinnedListSha256: H.listSha256 },
    project: { repository: 'https://github.com/openai/math', commit: H.base.commit, toolchain: PINS.claims.openai.toolchain, mathlib: PINS.claims.openai.mathlib, lakefileChange: { insertedAfterLine: H.lakefile.insertedAfterLine, lines: H.lakefile.insertedLines } },
    word, why, stage: last.d.stage || null,
    gaps,
    closes: 'What the theorem moves out of prose, if CERTIFIED: a Lean proof that ParityLifts\' multitape machines run on Mathlib\'s FinTM2 within a linear number of steps (his simulationHypothesis_proved) and that Anthropic\'s input word encClauses converts into ParityLifts\' encodeFormula within a polynomial of one fixed degree (his converterHypothesis_proved), so that one machine per rate on OpenAI\'s side becomes one machine per rate on Anthropic\'s. What stays prose: that OpenAI\'s checked theorem gives ¬ PositiveRateETH (his separate bridge, not replayed), and Anthropic\'s own step from FinTM2 on encClauses to the textbook hypothesis (corpus/eth-refutation/readings/), the step certs/eth-bridge.json also leaves to prose.',
    statementChecks: {
      git: { head: f.head, baseAncestor: f.baseAncestor, cleanBefore: !f.statusBefore, deltaByGit: f.deltaCheck, statusAfter: f.statusAfter, deltaBytesUnchangedAfter: f.deltaAfterOk },
      tree: src && src.tree,
      cloneBase: ci && ci.cloneBase,
      mainResults: src && src.mainResults,
      slices: src && src.slices,
      challenge: src && src.challenge,
      config: { ok: true, shipped: src && src.config, ran: f.auditConfig },
      census: src && { leanFiles: src.census.leanFiles, forbiddenOutsideComments: src.census.forbidden, challengeHole: src.census.challengeHole, mentionsInComments: src.census.mentionsInComments },
      lakefile: src && src.lakefile,
      closure: src && src.closure,
      controls: f.controls ? 'every red control refused by the check it targets; the clean copy passes (controls-gate.txt)' : 'NOT all behaved',
    },
    dependencies: { manifestChecked: f.manifestOk, mathlib: f.mathlib },
    comparator: f.comparator && { exit: f.steps.comparator.exit, okay: f.comparator.okay, kernels: f.comparator.kernels, stages: f.comparator.stages, lakeErrors: f.comparator.lakeErrors },
    axiomsPrinted: [{ theorem: THEOREM, axioms: f.axioms[THEOREM] || null }],
    decider: 'Comparator leanprover/comparator d03acab1 (tag v4.34.0) built with Lean v4.34.1 and its lean4export 076e8e57; landrun 811cfff5; nanoda ammkrn/nanoda_lib 3a240721 with the issue44 patch and a 1 GiB stack: the OpenAI row of certs/eth-kernel.json, on a GitHub-hosted runner, the clone checked by git and against the pins before anything ran',
    declaredChanges: [
      'enable_nanoda: true on the claimant\'s config (he ships false): the ONE change to his bytes, so that both kernels decide',
      'GLIBC_TUNABLES=' + ((f.env.find((l) => l.startsWith('GLIBC_TUNABLES: ')) || '').slice(16) || 'unset') + ' for every Lean step (the value the eth-kernel lane declared; a malloc setting, never what Lean checks)',
      'nanoda as the eth-kernel lane builds it (issue44 patch, 1 GiB stack; nanoda.patch kept with the run)',
      'lake update before anything else (OpenAI\'s post_update hook; lane K\'s rule), every resolved revision checked against the pinned manifest',
      'a blob-filtered sparse clone (lean/ top-level files, OAI/Combinatorics, OAI/Bridges, ComparatorChallenges, Vendor, scripts, docs): the other 50,000 files of openai/math are not checked out; git\'s diff against the base names the delta on the full trees',
      'Comparator runs BEFORE lake build (its README\'s second assumption: nothing outside the sandbox has built the solution)',
    ],
    trustBase: 'the two kernels (Lean\'s inside Comparator, nanoda), lean4export, Comparator\'s comparison code, landrun\'s Landlock sandbox (--best-effort; the runner\'s LSM list is in machine.txt), the Mathlib cache fetched by lake exe cache get, OpenAI\'s lakefile and its post_update hook, git\'s object hashing for the base, and GitHub\'s runner; the statement files are trusted only because they are byte-checked against the two labs\' pinned files',
    run: { id: Number(f.id), url: f.run.url, commit: f.run.headSha, branch: f.run.headBranch, createdAt: f.run.createdAt, conclusion: f.run.conclusion, jobs: f.run.jobs },
    machine: f.machine,
    env: f.env.filter((l) => !/^(runner|cpus|MemTotal|SwapTotal|vm\.|kernel|landlock|\/dev)/.test(l)),
    steps,
    logs: f.dir,
    runs: hist.map((h) => ({ run: Number(h.f.id), at: h.f.run.createdAt, commit: h.f.run.headSha, word: h.d.word === 'REJECTED' ? 'REJECTED (one run)' : h.d.word, why: h.d.why })),
  };
}

const args = process.argv.slice(2);
if (args[0] === '--check') {
  const r = build();
  if (!r) refuse('no kept run');
  const tmp = path.join(os.tmpdir(), 'eth-hawkley-check-' + process.pid + '.json');
  writeStable(tmp, r);
  const a = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  fs.rmSync(tmp, { force: true });
  const b = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (JSON.stringify(a) !== JSON.stringify(b)) refuse('certs/eth-hawkley-bridge.json is not what the kept runs decide');
  console.log('certs/eth-hawkley-bridge.json: ' + b.word + ', as the kept runs decide');
  process.exit(0);
}
for (const id of args) { if (!/^\d+$/.test(id)) refuse('not a run id: ' + id); keep(id); }
const record = build();
if (!record) refuse('no kept run under ' + path.relative(ROOT, RUNS));
writeStable(OUT, record);
console.log('certs/eth-hawkley-bridge.json: ' + record.word + (record.stage ? ' (' + record.stage + ')' : '') + ' — ' + record.why);
