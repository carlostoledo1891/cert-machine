#!/usr/bin/env node
/* record-eth-tsavo.js — certs/eth-tsavo-bridge.json: the replay of TSavo's ETH bridge (github.com/TSavo/eth-bridge @
   34f9ca20: Bridge.ethIsFalse_of_claim : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse),
   decided from the facts of runs of .github/workflows/eth-tsavo.yml kept on disk under corpus/eth-refutation/tsavo/
   runs/<run-id>/. THE RULE LIVES HERE AND NOWHERE ELSE: the workflow writes facts, never a word; the statement checks
   are tools/eth-tsavo-gates.js, run again here on the bytes the run checked out.

   The words are certs/eth-kernel.json's:
     CERTIFIED  the statement checks pass on the run's bytes; Comparator exits 0 and prints "Your solution is okay!";
                Lean's kernel AND nanoda both print that they accept the solution; lake build Bridge exits 0; and
                #print axioms (our file) names only propext, Classical.choice and Quot.sound for both theorems
     REFUTED    a kernel rejects the solution, in two runs (one run that rejects is recorded as REFUSED, pending the
                second run that would reproduce it)
     REFUSED    no decision, with the exact reason: resources (time, memory), a build failure, bytes differing from the
                pins, a statement check, Comparator stopping on its own check, or kernels disagreeing
   A run is refused outright (nothing written) when it is of another workflow, not completed, or its env names another
   commit than the run's.

   usage: node tools/record-eth-tsavo.js <run-id>...   download each run's artifact (gh), keep it, decide from disk
          node tools/record-eth-tsavo.js               decide again from the kept runs
          node tools/record-eth-tsavo.js --check       the battery: the record on disk is what the kept runs decide */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const { writeStable } = require('./stable-json.js');
const gates = require('./eth-tsavo-gates.js');

const ROOT = path.resolve(__dirname, '..');
const REPO = 'carlostoledo1891/cert-machine';
const ETH = path.join(ROOT, 'corpus', 'eth-refutation');
const RUNS = path.join(ETH, 'tsavo', 'runs');
const OUT = path.join(ROOT, 'certs', 'eth-tsavo-bridge.json');
const PINS = JSON.parse(fs.readFileSync(path.join(ETH, 'pins.json'), 'utf8'));
const TPINS = JSON.parse(fs.readFileSync(path.join(ETH, 'tsavo', 'pins.json'), 'utf8'));
const STANDARD = gates.STANDARD;
const THEOREMS = ['Bridge.ethIsFalse_of_claim', 'Bridge.two_proofs_one_statement'];
const STEPS = ['cache', 'comparator-readme', 'comparator-amended', 'build', 'axioms'];
const AUDIT_FILES = ['audit-config-tsavo.json', 'AuditAxiomsTsavo.lean'];
const TIME_V = /^\s*(Command being timed|User time|System time|Percent of CPU|Elapsed|Average|Maximum resident|Major|Minor|Voluntary|Involuntary|Swaps|File system|Socket|Signals|Page size|Exit status)/;
const refuse = (why) => { console.error('REFUSED: ' + why); process.exit(1); };
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

/* ---- keep: download a run's artifact and keep its facts beside the pins ---- */
function keep(run) {
  const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,headBranch,status,conclusion,url,createdAt,updatedAt,workflowName,event`, { encoding: 'utf8' }));
  if (meta.workflowName !== 'eth-tsavo') refuse('run ' + run + ' is of the workflow ' + meta.workflowName);
  if (meta.status !== 'completed') refuse('run ' + run + ' is ' + meta.status);
  const jobs = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json jobs`, { encoding: 'utf8' })).jobs
    .map((j) => ({ name: j.name, conclusion: j.conclusion, startedAt: j.startedAt, completedAt: j.completedAt }));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-tsavo-'));
  cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} -n eth-tsavo`, { stdio: 'inherit' });
  const dest = path.join(RUNS, String(run));
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(tmp, { withFileTypes: true })) {
    if (e.name === 'src') continue;   // the checked-out TSavo tree: compared with the kept copy below, never kept twice
    fs.cpSync(path.join(tmp, e.name), path.join(dest, e.name), { recursive: true });
  }
  // the bytes the run checked out, as facts: their sha256 (the decision checks them against the pins and gates them)
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
    unknownChallenge: /unknown (?:target|module) `BridgeChallenge`/.test(t),
    lakeErrors: t.split('\n').filter((l) => /(^|\s)error:/.test(l)).slice(0, 5),
  };
}
function hashes(d, n) {
  const t = rd(d, n);
  if (!t) return null;
  const out = {};
  for (const l of t.split('\n').filter(Boolean)) { const m = /^([0-9a-f]{64})\s+\.\/(.+)$/.exec(l); if (m) out[m[2]] = m[1]; }
  return out;
}
/* every file the build directory held (outside .lake): Anthropic's at its pin, TSavo's at its pin, the lakefile as
   classified, and our two audit files; nothing else */
function checkHashes(h, lakefileSha, phase) {
  const fails = [];
  const ant = PINS.claims.anthropic.files;
  const ts = TPINS.tsavo.files;
  const antHere = Object.keys(ant).filter((p) => p.startsWith('eth/')).map((p) => p.slice(4));
  for (const [f, s] of Object.entries(h)) {
    if (f === 'lakefile.toml') { if (s !== lakefileSha) fails.push(phase + ': lakefile.toml ' + s + ' is not the classified lakefile'); continue; }
    if (AUDIT_FILES.includes(f)) continue;
    const want = ant['eth/' + f] || ((f.startsWith('bridge/') || f === 'comparator_bridge.json') ? ts[f] : undefined);
    if (!want) fails.push(phase + ': unpinned file ' + f);
    else if (want !== s) fails.push(phase + ': ' + f + ' differs from its pin');
  }
  for (const f of antHere) if (!(f in h)) fails.push(phase + ': pinned eth/' + f + ' missing');
  for (const f of Object.keys(ts).filter((p) => p.startsWith('bridge/') || p === 'comparator_bridge.json')) if (!(f in h)) fails.push(phase + ': TSavo\'s ' + f + ' missing');
  return fails;
}
function axiomsOf(s) {
  const out = {};
  if (!s) return out;
  for (const m of s.text.matchAll(/^'([^']+)' depends on axioms: \[([^\]]*)\]/gm)) out[m[1]] = m[2].split(',').map((x) => x.trim()).filter(Boolean);
  for (const m of s.text.matchAll(/^'([^']+)' does not depend on any axioms/gm)) out[m[1]] = [];
  return out;
}
const killedByMemory = (s) => s && (s.exit === 137 || /exited with 137|Killed|out of memory|std::bad_alloc|SIGKILL/i.test(s.errTail.concat(s.logTail).join('\n')));

function facts(id) {
  const d = path.join(RUNS, id);
  const run = JSON.parse(rd(d, '_run.json'));
  const f = { id, run, dir: path.relative(ROOT, d), fails: [] };
  f.env = (rd(d, 'env.txt') || '').trim().split('\n');
  if (!f.env.includes('commit: ' + run.headSha)) f.envCommitMismatch = true;
  const v = rd(d, 'verify-anthropic.json');
  f.verifyAnthropic = v && v.trim().startsWith('{') ? JSON.parse(v) : null;
  const sg = rd(d, 'src-gate.json');
  f.srcGate = sg ? JSON.parse(sg) : null;
  const srcTreeOk = run.srcTree && Object.keys(TPINS.tsavo.files).every((p) => run.srcTree[p] === TPINS.tsavo.files[p]) && Object.keys(run.srcTree).every((p) => p in TPINS.tsavo.files);
  f.srcTreeOk = Boolean(srcTreeOk);
  const sf = rd(d, 'sources-facts.json');
  f.ciSources = sf ? JSON.parse(sf) : null;
  f.controls = (rd(d, 'controls-gate.txt') || '').includes('every red control refused; the clean copy passes');
  const lake = rd(d, 'lakefile.toml');
  f.lakefile = lake ? gates.classifyLakefile(lake) : { ok: false, why: 'no lakefile.toml in the artifact' };
  f.steps = {};
  for (const s of STEPS) f.steps[s] = step(d, s);
  f.comparator = { readme: comparatorFacts(f.steps['comparator-readme']), amended: comparatorFacts(f.steps['comparator-amended']) };
  f.amendment = rd(d, 'amendment.txt');
  const before = hashes(d, 'sources-before.sha256');
  const after = hashes(d, 'sources-after.sha256');
  const lakeSha = lake ? sha256(Buffer.from(lake, 'utf8')) : null;
  const readmeLake = rd(d, 'lakefile-readme.toml');
  f.hashFails = [];
  if (before) f.hashFails.push(...checkHashes(before, readmeLake ? sha256(Buffer.from(readmeLake, 'utf8')) : null, 'before'));
  if (after) f.hashFails.push(...checkHashes(after, lakeSha, 'after'));
  if (!before || !after) f.hashFails.push('the run hashed no sources ' + (!before ? 'before' : 'after'));
  f.axioms = axiomsOf(f.steps.axioms);
  f.buildLog = f.steps.build ? { sorry: /declaration uses 'sorry'/.test(f.steps.build.text), errors: f.steps.build.text.split('\n').filter((l) => /(^|\s)error:/.test(l)).slice(0, 5) } : null;
  f.machine = (rd(d, 'machine.txt') || '').trim().split('\n');
  return f;
}

/* ---- the rule ---- */
function decide(f) {
  if (f.envCommitMismatch) return { word: 'REFUSED', stage: 'run', why: 'env.txt names another commit than the run (' + f.run.headSha + ')' };
  if (!f.verifyAnthropic || !f.verifyAnthropic.ok) return { word: 'REFUSED', stage: 'bytes', why: 'the run\'s Anthropic checkout differs from corpus/eth-refutation/pins.json: ' + JSON.stringify(f.verifyAnthropic && (f.verifyAnthropic.mismatches || []).concat(f.verifyAnthropic.unpinned || []).slice(0, 3)) };
  if (!f.srcTreeOk) return { word: 'REFUSED', stage: 'bytes', why: 'the TSavo tree the run checked out differs from corpus/eth-refutation/tsavo/pins.json' };
  if (!f.srcGate || !f.srcGate.ok) return { word: 'REFUSED', stage: 'statement', why: 'the statement checks refuse the run\'s bytes: ' + (f.srcGate ? f.srcGate.fails.join('; ') : 'not run') };
  if (!f.ciSources || !f.ciSources.ok) return { word: 'REFUSED', stage: 'statement', why: 'the statement checks in the run refused: ' + (f.ciSources ? f.ciSources.fails.join('; ') : 'not run (an earlier step failed)') };
  if (!f.controls) return { word: 'REFUSED', stage: 'statement', why: 'the red controls in the run did not all behave' };
  if (!f.lakefile.ok) return { word: 'REFUSED', stage: 'bytes', why: f.lakefile.why };
  if (f.hashFails.length) return { word: 'REFUSED', stage: 'bytes', why: f.hashFails.slice(0, 5).join('; ') };
  const cache = f.steps.cache;
  if (!cache || cache.exit !== 0) return { word: 'REFUSED', stage: 'prepare', why: 'lake exe cache get ' + (cache ? 'exit ' + cache.exit + ': ' + (cache.errTail.slice(-1)[0] || '') : 'did not run') };
  const which = f.steps['comparator-amended'] ? 'amended' : 'readme';
  const s = f.steps['comparator-' + which];
  const c = f.comparator[which];
  if (!s) return { word: 'REFUSED', stage: 'comparator', why: 'Comparator did not run' };
  const rejecting = c.kernels.filter((l) => /rejects|rejected/.test(l));
  if (rejecting.length) {
    const disagree = c.kernels.includes('Lean default kernel accepts the solution') || c.kernels.includes('nanoda kernel accepts the solution');
    return { word: 'REJECTED', stage: 'comparator', layout: which, kernelsDisagree: disagree, why: rejecting.join('; ') + (disagree ? ' while the other kernel accepts (the kernels disagree)' : '') };
  }
  if (s.timedOut) return { word: 'REFUSED', stage: 'comparator', layout: which, why: 'resources: Comparator hit its time limit after ' + s.seconds + ' s' };
  if (killedByMemory(s)) return { word: 'REFUSED', stage: 'comparator', layout: which, why: 'resources: memory (exit ' + s.exit + ', used-memory peak ' + s.usedMemPeakKB + ' kB): ' + (s.errTail.slice(-1)[0] || '') };
  const errLine = c.kernels.find((l) => /Error while interacting/.test(l));
  if (errLine) return { word: 'REFUSED', stage: 'comparator', layout: which, why: 'a kernel could not be run: ' + errLine };
  if (s.exit !== 0 || !c.okay) {
    const lines = s.errTail.concat(s.logTail);
    const mismatch = lines.find((l) => /does not match|not permitted|disallowed axiom|axiom/i.test(l));
    if (mismatch) return { word: 'REFUSED', stage: 'comparator', layout: which, why: 'Comparator stopped on its own check: ' + mismatch };
    const stage = c.stages.slice(-1)[0] || 'before its first stage';
    return { word: 'REFUSED', stage: 'comparator', layout: which, why: 'Comparator exit ' + s.exit + ' at "' + stage + '": ' + (c.lakeErrors[0] || s.errTail.slice(-1)[0] || s.logTail.slice(-1)[0] || '') };
  }
  const accepts = ['Lean default kernel accepts the solution', 'nanoda kernel accepts the solution'].filter((l) => c.kernels.includes(l));
  if (accepts.length < 2) return { word: 'REFUSED', stage: 'comparator', layout: which, why: 'Comparator accepted but printed ' + accepts.length + ' of the two kernel acceptances (' + c.kernels.join('; ') + ')' };
  const b = f.steps.build;
  if (!b) return { word: 'REFUSED', stage: 'build', layout: which, why: 'lake build Bridge did not run' };
  if (b.timedOut) return { word: 'REFUSED', stage: 'build', layout: which, why: 'resources: lake build Bridge hit its time limit after ' + b.seconds + ' s' };
  if (killedByMemory(b)) return { word: 'REFUSED', stage: 'build', layout: which, why: 'resources: memory in lake build Bridge (exit ' + b.exit + ')' };
  if (b.exit !== 0) return { word: 'REFUSED', stage: 'build', layout: which, why: 'lake build Bridge exit ' + b.exit + ': ' + (f.buildLog.errors[0] || b.errTail.slice(-1)[0] || '') };
  if (f.buildLog.sorry) return { word: 'REFUSED', stage: 'build', layout: which, why: 'lake build Bridge reports a declaration that uses sorry' };
  const missing = THEOREMS.filter((t) => !(t in f.axioms));
  if (missing.length) return { word: 'REFUSED', stage: 'axioms', layout: which, why: 'the axiom print did not name ' + missing.join(', ') + ' (exit ' + (f.steps.axioms && f.steps.axioms.exit) + ')' };
  const extra = THEOREMS.flatMap((t) => f.axioms[t].filter((a) => !STANDARD.includes(a)).map((a) => t + ': ' + a));
  if (extra.length) return { word: 'REFUSED', stage: 'axioms', layout: which, why: 'the axiom print names ' + extra.join(', ') };
  return { word: 'CERTIFIED', layout: which, why: 'the statement checks pass on the run\'s bytes; Comparator exit 0 with "Your solution is okay!" on TSavo\'s config' + (which === 'amended' ? ' (with the declared lakefile amendment)' : '') + '; Lean\'s kernel and nanoda both accept; lake build Bridge exit 0; both theorems\' axioms are among ' + STANDARD.join(', ') };
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
  const src = f.srcGate.facts;
  const ci = f.ciSources && f.ciSources.facts;
  const readme = f.comparator.readme;
  const gaps = [];
  if (f.steps['comparator-amended']) {
    gaps.push('TSavo\'s README build does not run Comparator on TSavo\'s own config: on the README\'s lakefile (Anthropic\'s, plus [[lean_lib]] Bridge, srcDir "bridge", globs ["Bridge.+"]) Comparator stops at "Building BridgeChallenge" because Lake ' +
      (readme && readme.unknownChallenge ? 'reports unknown target `BridgeChallenge`' : 'cannot build it') + ' (exit ' + f.steps['comparator-readme'].exit + '): the glob Bridge.+ names Bridge and its submodules, and BridgeChallenge is neither. The replay declares ONE amendment, a [[lean_lib]] named BridgeChallenge with srcDir "bridge" appended to the lakefile (no Lean byte and no config byte changes), and decides on the run with it. TSavo\'s README says Anthropic\'s CI script accepted the bridge on 2026-10-27; the lakefile that run used must have made BridgeChallenge resolvable, and the README does not show how.');
  }
  gaps.push('The seam between the two lanes is the Lean and Mathlib version: the bridge\'s Claim is OpenAI\'s challenge text re-elaborated on Lean v4.33.1 and Anthropic\'s Mathlib 0df444a3, while OpenAI\'s proof (certs/eth-kernel.json) is of exact_count_and_sat on Lean v4.34.1 and Mathlib d13f23b7. The source text is the same byte for byte (the statement check); that the two elaborate to the same term is not checked here, so OpenAI\'s theorem and TSavo\'s implication compose by reading, not by one kernel.');
  gaps.push('Comparator decides Bridge.ethIsFalse_of_claim only (the config\'s one theorem). Bridge.two_proofs_one_statement = ⟨MainResults.ethIsFalse, ethIsFalse_of_claim⟩ is checked by one kernel (Lean\'s, in lake build) and by its axiom print.');
  if (src.census.mentionsInComments.some((m) => m.file === 'bridge/Bridge/Main.lean')) gaps.push('A stale comment: bridge/Bridge/Main.lean\'s header still says "Each `sorry` below is one of the four lemmas named in the plan"; no sorry remains outside comments (the census).');
  /* what the kernel lane ran is read from its record, never typed: leanchecker --fresh replayed the claims' own proofs
     there (both by 2026-10-30), and never this join */
  const kRows = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'eth-kernel.json'), 'utf8')).rows;
  const kFresh = kRows.filter((r) => r.leanchecker && r.leanchecker.word === 'REPLAYED').map((r) => r.claim);
  gaps.push('leanchecker --fresh was not run on this join' + (kFresh.length === kRows.length ? ' (the eth-kernel lane replayed both claims\' own proofs with it, not the join)'
    : kFresh.length ? ' (the eth-kernel lane replayed ' + kFresh.join(', ') + '\'s own proof with it, not the join)' : ' (nor anywhere in the eth-kernel lane)') + '; the rule stands on Lean\'s kernel and nanoda inside Comparator.');
  const steps = {};
  for (const s of STEPS) if (f.steps[s]) steps[s] = brief(f.steps[s]);
  return {
    what: 'The replay of a third party\'s Lean proof that joins the two claimed refutations of the Exponential Time Hypothesis: TSavo\'s Bridge.ethIsFalse_of_claim : OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse (github.com/TSavo/eth-bridge @ 34f9ca20; OpenAI\'s challenge statement as a proposition implies Anthropic\'s ETHIsFalse), built inside Anthropic\'s eth project at 16a5ce41 as its README says, decided by tools/record-eth-tsavo.js from a GitHub-hosted run of .github/workflows/eth-tsavo.yml. CERTIFIED here means the statements are the two labs\' own (checked byte for byte against our pins), the theorem states exactly Claim → ETHIsFalse, uses only propext, Classical.choice and Quot.sound, and two independently written kernels accept it. It does NOT mean that ETH is false: the implication needs OpenAI\'s Claim, which OpenAI proved (certs/eth-kernel.json) on another Lean and Mathlib (see gaps), and no machine checks that MainResults.ETH is the textbook hypothesis (corpus/eth-refutation/readings/).',
    campaign: 'eth-refutation; the TSavo bridge lane (the claim was posted on anthropics/formal-math#36 with a request for a check); pins recorded before any run (corpus/eth-refutation/tsavo/pins.json)',
    words: {
      CERTIFIED: 'the statement checks pass on the run\'s bytes; Comparator exit 0 with "Your solution is okay!"; Lean\'s kernel and nanoda both accept; lake build Bridge exit 0; #print axioms (our file) names only propext, Classical.choice, Quot.sound for both theorems',
      REFUTED: 'a kernel rejects the solution, reproduced by a second run',
      REFUSED: 'no decision, with the exact reason (resources, a build failure, bytes differing from the pins, a statement check, Comparator stopping on its own check, kernels disagreeing, or one kernel rejection not yet reproduced)',
    },
    claim: { repository: TPINS.tsavo.repository, commit: TPINS.tsavo.commit, author: 'TSavo (written with Claude, per its README and commits)', license: 'Apache-2.0', theorems: THEOREMS, config: TPINS.tsavo.comparatorConfig.content, configSha256: TPINS.tsavo.comparatorConfig.sha256, pinnedFiles: TPINS.tsavo.fileCount, pinnedListSha256: TPINS.tsavo.listSha256 },
    project: { repository: PINS.claims.anthropic.repository, commit: PINS.claims.anthropic.commit, toolchain: PINS.claims.anthropic.toolchain, mathlib: PINS.claims.anthropic.mathlib },
    word, why, stage: last.d.stage || null,
    gaps,
    closes: 'What the theorem moves out of prose, if CERTIFIED: our reading of OpenAI\'s claim (corpus/eth-refutation/readings/first.md §I.4) needs B1 (a PrimitiveMachine simulated with polynomial overhead) and B2 (a plain 3-CNF rewritten into encodeCNF in polynomial time), both by eye. TSavo proves, in Lean, B1 into Anthropic\'s model (a PrimitiveMachine as a Groundwork.Stepped computation, compiled to a Mathlib FinTM2 machine by Anthropic\'s exists_tm, its state size bounded by OpenAI\'s own visited-space bound) and B2 from Anthropic\'s plain 3-CNF code (a polynomial-time map from Sat3.enc to encodeCNF, insertion sort proved equal to Finset.sort), then Anthropic\'s own lemma WidthThree.ethFails_of_subexpTM carries Sat3.SubexpTM to MainResults.ETHIsFalse, so OpenAI\'s Claim lands on Anthropic\'s ETHIsFalse. What stays prose is then Anthropic\'s own step from FinTM2 on encClauses to the textbook hypothesis (B1′, B2′ of the same reading), the step certs/eth-bridge.json also leaves to prose. Only ClaimAt 3 is used.',
    statementChecks: {
      tree: src.tree,
      openaiStatement: Object.assign({ file: 'bridge/Bridge/OpenAIStatement.lean', against: 'openai/math@7ef5c0cc lean/ComparatorChallenges/SubexponentialSAT.lean' }, src.statement,
        { change: 'theorem exact_count_and_sat (k : ℕ) (hk : 2 ≤ k) : <23 lines> := by sorry  →  def ClaimAt (k : ℕ) : Prop := <the same 23 lines>, plus def Claim : Prop := ∀ k : ℕ, 2 ≤ k → ClaimAt k; undoing it gives the pinned bytes' }),
      mainResults: ci && ci.mainResults,
      lakefile: { pinned: ci && ci.lakefile, asBuilt: { layout: f.lakefile.layout, sha256: f.lakefile.sha256, readmeBlock: f.lakefile.block } },
      challenge: src.challenge,
      config: { ok: true, content: src.config },
      census: { leanFiles: src.census.leanFiles, forbiddenOutsideComments: src.census.forbidden, challengeHole: src.census.challengeHole, mentionsInComments: src.census.mentionsInComments },
      controls: f.controls ? 'every red control refused by the check it targets; the clean copy passes (controls-gate.txt)' : 'NOT all behaved',
    },
    anthropicModules: ci && ci.anthropic && {
      note: 'Bridge.Main and Bridge.Joint import Anthropic\'s UNTRUSTED proof development (eth/proof/**), every file pinned in pins.json; its constants that the bridge theorem reaches are inside the solution export, so Comparator replays them in both kernels here; the kernel lane (certs/eth-kernel.json) already replayed the whole development for Anthropic\'s own theorems',
      directImports: ci.anthropic.directAnthropicImports,
      bridgeMain: { count: ci.anthropic.closure['Bridge.Main'].anthropicCount, modules: ci.anthropic.closure['Bridge.Main'].anthropicModules.map((m) => m.module) },
      bridgeJoint: { count: ci.anthropic.closure['Bridge.Joint'].anthropicCount, includesSolution: ci.anthropic.closure['Bridge.Joint'].includesSolution },
    },
    comparator: {
      deciding: last.d.layout || null,
      readme: readme && { exit: f.steps['comparator-readme'].exit, okay: readme.okay, kernels: readme.kernels, stages: readme.stages, unknownChallenge: readme.unknownChallenge, lakeErrors: readme.lakeErrors },
      amended: f.comparator.amended && { exit: f.steps['comparator-amended'].exit, okay: f.comparator.amended.okay, kernels: f.comparator.amended.kernels, stages: f.comparator.amended.stages },
      amendment: f.amendment ? gates.CHALLENGE_LIB : null,
    },
    axiomsPrinted: THEOREMS.map((t) => ({ theorem: t, axioms: f.axioms[t] || null })),
    decider: 'Comparator leanprover/comparator d03acab1 (tag v4.34.0) built with Lean v4.34.1; lean4export 15f6055e (tag v4.33.0) built with the claim\'s v4.33.1; landrun 811cfff5; nanoda ammkrn/nanoda_lib 3a240721 with the issue44 patch and a 1 GiB stack: the Anthropic row of certs/eth-kernel.json, on a GitHub-hosted runner, both clones checked against the pins before anything ran',
    declaredChanges: [
      'enable_nanoda: true on TSavo\'s config, as on every config this campaign runs: TSavo ships true, so the JSON Comparator reads is TSavo\'s content unchanged',
      'GLIBC_TUNABLES=' + ((f.env.find((l) => l.startsWith('GLIBC_TUNABLES: ')) || '').slice(16) || 'unset') + ' for every Lean step (the value the eth-kernel lane declared; a malloc setting, never what Lean checks)',
      'nanoda as the eth-kernel lane builds it (issue44 patch, 1 GiB stack; nanoda.patch kept with the run)',
      'Comparator\'s Lean kernel is v4.34.1 replaying a v4.33.1 export, as in the eth-kernel lane\'s Anthropic row',
      'Comparator runs BEFORE lake build Bridge (its README\'s second assumption: nothing outside the sandbox has built the solution); TSavo\'s README runs lake build Bridge first',
    ].concat(f.amendment ? ['the ONE amendment to TSavo\'s build: [[lean_lib]] name = "BridgeChallenge" srcDir = "bridge" appended to the lakefile after the README\'s block, applied only because Comparator on the README\'s lakefile could not resolve the challenge module (the run\'s amendment.txt)'] : []),
    trustBase: 'the two kernels (Lean\'s inside Comparator, nanoda), lean4export, Comparator\'s comparison code, landrun\'s Landlock sandbox (--best-effort; the runner\'s LSM list is in machine.txt), the Mathlib cache fetched by lake exe cache get, Anthropic\'s lakefile, and GitHub\'s runner; the statement files are trusted only because they are byte-checked against the two labs\' pinned files',
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
  const tmp = path.join(os.tmpdir(), 'eth-tsavo-check-' + process.pid + '.json');
  writeStable(tmp, r);
  const a = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  fs.rmSync(tmp, { force: true });
  const b = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  if (JSON.stringify(a) !== JSON.stringify(b)) refuse('certs/eth-tsavo-bridge.json is not what the kept runs decide');
  console.log('certs/eth-tsavo-bridge.json: ' + b.word + ', as the kept runs decide');
  process.exit(0);
}
for (const id of args) { if (!/^\d+$/.test(id)) refuse('not a run id: ' + id); keep(id); }
const record = build();
if (!record) refuse('no kept run under ' + path.relative(ROOT, RUNS));
writeStable(OUT, record);
console.log('certs/eth-tsavo-bridge.json: ' + record.word + (record.stage ? ' (' + record.stage + ')' : '') + ' — ' + record.why);
