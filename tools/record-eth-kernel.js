#!/usr/bin/env node
/* record-eth-kernel.js — certs/eth-kernel.json: the kernel lane of the check of the two claimed refutations of the
   Exponential Time Hypothesis, decided from the facts on disk (corpus/eth-refutation/runs/<run>/<claim>.json, written
   by tools/import-runpod-eth.js from a pod running tools/runpod-eth.sh). THE RULE LIVES HERE AND NOWHERE ELSE: the pod
   writes facts, never a word.

   One row per claim, three words:
     CERTIFIED  Comparator exits 0 and prints "Your solution is okay!", Lean's kernel AND nanoda both print that they
                accept the solution, and `#print axioms` (our file) names only propext, Classical.choice and Quot.sound
                for every main theorem. It says the Lean theorems state exactly the claim's own challenge statements and
                are proved; it says nothing about whether those statements are the paper's theorem (a reading, not
                this lane).
     REFUTED    a kernel rejects the solution (Comparator's Lean kernel, its quotient post-check, nanoda, or
                leanchecker --fresh). Stated nowhere until a second run reproduces it.
     REFUSED    no decision, with the exact reason: resources (time, memory), a tool that cannot read the toolchain, a
                build failure, the pod's bytes differing from pins.json, Comparator stopping for a statement or axiom
                mismatch, or the kernels disagreeing.
   leanchecker --fresh (the claim's own toolchain's kernel, replaying every constant from the .olean files) is a third
   replay beside the rule: if it rejects while the rest accepts, the row cannot be CERTIFIED; if it does not finish,
   the row says so and the rule stands on the two kernels. Only a kernel message is a rejection (a tool failure, a
   time or memory limit, or deep recursion leaves it NOT DECIDED). Its facts are the latest run at the claim's pin that
   ran it, which may be a later fresh-only pod (runpod-eth.sh FRESH_ONLY=1); the row then names both runs.

   usage: node tools/record-eth-kernel.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
// ETH_RUNS / ETH_KERNEL_OUT: the red controls' synthetic run store and ledger (never the real ones)
const RUNS = process.env.ETH_RUNS || path.join(ROOT, 'corpus', 'eth-refutation', 'runs');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'eth-refutation', 'pins.json'), 'utf8'));
const OUT = process.env.ETH_KERNEL_OUT || path.join(ROOT, 'certs', 'eth-kernel.json');
const STANDARD = ['propext', 'Classical.choice', 'Quot.sound'];
const CLAIMS = {
  openai: { label: 'OpenAI, openai/math family 378 (SubexponentialSAT)', theorems: ['OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat'],
    solutionModule: 'OAI.Algorithms.SubexponentialSAT.Main', challengeModule: 'ComparatorChallenges.SubexponentialSAT',
    prior: 'certs/openai-math-kernel-7ef5c0cc.json row SubexponentialSAT: REFUSED, the hosted runner (4 vCPU, 16 GB) terminated the job, exit 143, run 40520726442, 2026-10-27' },
  anthropic: { label: 'Anthropic, anthropics/formal-math eth/ (MainResults)', theorems: ['MainResults.ethIsFalse', 'MainResults.mainTheorem'],
    solutionModule: 'Solution', challengeModule: 'Challenge', prior: null },
};

const tail = (arr) => (arr || []).slice(-1)[0] || '';
const killedByMemory = (s) => s && (s.exit === 137 || /exited with 137|Killed|out of memory|std::bad_alloc|SIGKILL/i.test((s.errTail || []).concat(s.logTail || []).join('\n')));

function leancheckerWord(f) {
  const s = f.steps && f.steps.leanchecker;
  if (!s) return { word: 'NOT RUN', why: 'leanchecker --fresh was not run (or not yet)' };
  if (!f.verify || !f.verify.ok) return { word: 'NOT DECIDED', why: 'the checkout of the run that replayed differs from corpus/eth-refutation/pins.json' };
  if (s.running) return { word: 'RUNNING', why: 'leanchecker --fresh was still running at import' };
  if (s.exit === 0) return { word: 'REPLAYED', why: 'leanchecker --fresh exit 0: the toolchain\'s kernel replayed, into an empty environment, every constant the solution module imports or declares' };
  if (s.timedOut) return { word: 'NOT DECIDED', why: 'leanchecker --fresh hit its time limit after ' + s.seconds + ' s (resources)' };
  if (killedByMemory(s)) return { word: 'NOT DECIDED', why: 'leanchecker --fresh was killed for memory (exit ' + s.exit + ')' };
  // a rejection is the kernel's own word: Lean.Replay wraps every kernel exception as "while replaying declaration
  // '<name>'" and compares constructors and recursors as "Invalid/No such constructor/recursor"; deep recursion is the
  // kernel running out of stack (resources), and any other non-zero exit is the tool failing, never a rejection
  const lines = [...new Set(((f.leanchecker && f.leanchecker.errorLines) || []).concat(s.errTail || [], s.logTail || []))];
  const kernel = lines.find((l) => /while replaying declaration|\(kernel\)|Invalid constructor|Invalid recursor|No such constructor|No such recursor/.test(l));
  if (kernel && /deep recursion|interrupted|maximum recursion/i.test(lines.join('\n'))) return { word: 'NOT DECIDED', why: 'leanchecker --fresh exit ' + s.exit + ', the kernel out of stack or interrupted (resources): ' + kernel };
  if (kernel) return { word: 'REJECTED', why: 'leanchecker --fresh exit ' + s.exit + ': ' + lines.filter((l) => /while replaying|\(kernel\)|Invalid|No such/.test(l)).slice(-3).join(' ') };
  return { word: 'NOT DECIDED', why: 'leanchecker --fresh exit ' + s.exit + ' with no kernel message (the tool failed; not a rejection): ' + tail(lines) };
}

// lcf: the facts whose leanchecker step counts (default f itself; a later fresh-only run at the same pin otherwise)
function decide(f, claim, lcf) {
  const st = f.steps || {};
  if (!f.verify || !f.verify.ok) return { word: 'REFUSED', stage: 'bytes', why: 'the pod\'s checkout differs from corpus/eth-refutation/pins.json (' + JSON.stringify(f.verify && (f.verify.mismatches || []).concat(f.verify.unpinned || []).slice(0, 3)) + ')' };
  if (!st.prepare || st.prepare.exit !== 0) return { word: 'REFUSED', stage: 'prepare', why: 'preparing the claim failed (clone, ' + (claim === 'openai' ? 'lake update, ' : '') + 'cache): ' + tail(st.prepare && st.prepare.errTail.concat(st.prepare.logTail)) };
  const c = st.comparator;
  if (!c || c.running) return null;   // not decided yet
  const k = f.comparator.kernels.join('\n');
  const rejecting = f.comparator.kernels.filter((l) => /rejects|rejected/.test(l));
  if (rejecting.length) {
    // one kernel against the other is recorded as such: nanoda rejected sound Mathlib proofs before the #44 patch
    const disagree = k.includes('Lean default kernel accepts the solution') || k.includes('nanoda kernel accepts the solution');
    return { word: 'REFUTED', stage: 'comparator', reproduced: false, kernelsDisagree: disagree,
      why: rejecting.join('; ') + (disagree ? ' while the other kernel accepts (the kernels disagree)' : '') + ' (stated nowhere until a second run reproduces it)' };
  }
  const lc = leancheckerWord(lcf || f);
  if (lc.word === 'REJECTED') return { word: 'REFUTED', stage: 'leanchecker', reproduced: false, why: lc.why + ' (stated nowhere until a second run reproduces it)' };
  if (c.timedOut) return { word: 'REFUSED', stage: 'comparator', why: 'resources: Comparator hit the time limit after ' + c.seconds + ' s' };
  if (killedByMemory(c)) return { word: 'REFUSED', stage: 'comparator', why: 'resources: memory (exit ' + c.exit + ', container peak ' + c.containerPeakKB + ' kB): ' + tail(c.errTail) };
  if (/Error while interacting with/.test(k)) return { word: 'REFUSED', stage: 'comparator', why: 'a kernel could not be run: ' + f.comparator.kernels.find((l) => /Error while/.test(l)) };
  if (c.exit !== 0 || !f.comparator.okay) {
    const lines = (c.errTail || []).concat(c.logTail || []);
    const mismatch = lines.find((l) => /does not match|not permitted|disallowed axiom|axiom/i.test(l));
    if (mismatch) return { word: 'REFUSED', stage: 'comparator', why: 'Comparator stopped on the claim\'s own check: ' + mismatch };
    const stage = (f.comparator.stages || []).slice(-1)[0] || 'before its first stage';
    return { word: 'REFUSED', stage: 'comparator', why: 'Comparator exit ' + c.exit + ' at "' + stage + '": ' + tail(c.errTail) };
  }
  const accepts = ['Lean default kernel accepts the solution', 'nanoda kernel accepts the solution'].filter((l) => k.includes(l));
  if (accepts.length < 2) return { word: 'REFUSED', stage: 'comparator', why: 'Comparator accepted but printed ' + accepts.length + ' of the two kernel acceptances (' + f.comparator.kernels.join('; ') + ')' };
  const printed = (f.axioms && f.axioms.printed) || [];
  const theorems = CLAIMS[claim].theorems;
  const missing = theorems.filter((t) => !printed.some((p) => p.theorem === t));
  if (missing.length) return { word: 'REFUSED', stage: 'axioms', why: 'the axiom print did not name ' + missing.join(', ') + ' (axioms step exit ' + (st.axioms && st.axioms.exit) + ')' };
  const extra = printed.filter((p) => theorems.includes(p.theorem)).flatMap((p) => p.axioms.filter((a) => !STANDARD.includes(a)).map((a) => p.theorem + ': ' + a));
  if (extra.length) return { word: 'REFUSED', stage: 'axioms', why: 'Comparator accepted, but the axiom print names ' + extra.join(', ') + ' — the two disagree; read before any word' };
  if (lc.word === 'RUNNING') return { word: 'CERTIFIED', why: 'Comparator exit 0; Lean\'s kernel and nanoda both accept; the axioms are ' + STANDARD.join(', ') + '; leanchecker --fresh still running' };
  return { word: 'CERTIFIED', why: 'Comparator exit 0; Lean\'s kernel and nanoda both accept; every main theorem\'s axioms are among ' + STANDARD.join(', ') + '; leanchecker --fresh: ' + lc.word };
}

const brief = (s) => s && { exit: s.exit, seconds: s.seconds, timedOut: s.timedOut, maxRssKB: s.maxRssKB, containerPeakKB: s.containerPeakKB };
const runs = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => fs.existsSync(path.join(RUNS, d, '_run.json'))) : [];
const rows = [];
const notRunYet = [];
for (const [claim, meta] of Object.entries(CLAIMS)) {
  const pin = PINS.claims[claim];
  const history = [];
  for (const r of runs) {
    const p = path.join(RUNS, r, claim + '.json');
    if (!fs.existsSync(p)) continue;
    const run = JSON.parse(fs.readFileSync(path.join(RUNS, r, '_run.json'), 'utf8'));
    const f = JSON.parse(fs.readFileSync(p, 'utf8'));
    const d = decide(f, claim);
    history.push({ run: r, auditSha: run.auditSha, at: run.updatedAt, host: run.host, nanodaBuild: run.nanodaBuild, mode: run.mode || 'full', decided: d, fact: f });
  }
  history.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const decidedRuns = history.filter((h) => h.decided);
  const lastDecided = decidedRuns.slice(-1)[0];
  if (!lastDecided) { notRunYet.push(claim); continue; }
  const f = lastDecided.fact;
  // the third replay: the latest run at this pin that ran leanchecker --fresh, which may be a later fresh-only pod
  // (FRESH_ONLY=1: prepare, build, leanchecker; the Comparator facts stay those of the decided run)
  const lcRun = history.filter((h) => h.fact.steps && h.fact.steps.leanchecker && h.fact.verify && h.fact.verify.commit === pin.commit).slice(-1)[0] || lastDecided;
  const lcf = lcRun.fact;
  const last = lcRun === lastDecided ? lastDecided : Object.assign({}, lastDecided, { decided: decide(f, claim, lcf) });
  const lcEnv = (k) => ((lcf.env || []).find((l) => l.startsWith(k)) || '').slice(k.length) || null;
  const lcStep = lcf.steps.leanchecker;
  rows.push({
    claim, label: meta.label, repository: pin.repository, commit: pin.commit, toolchain: pin.toolchain, mathlib: pin.mathlib,
    pinnedFiles: pin.fileCount, pinnedListSha256: pin.listSha256,
    config: pin.comparatorConfig.content, configSha256: pin.comparatorConfig.sha256,
    theorems: meta.theorems,
    word: last.decided.word, why: last.decided.why, stage: last.decided.stage || null, reproduced: last.decided.reproduced,
    kernelsDisagree: last.decided.kernelsDisagree,
    axiomsPrinted: (f.axioms && f.axioms.printed) || [],
    kernels: f.comparator.kernels,
    leanchecker: Object.assign(leancheckerWord(lcf), brief(lcStep) || {}, {
      command: lcf.leanchecker && lcf.leanchecker.command,
      module: lcStep ? meta.solutionModule : null, toolchain: lcStep ? pin.toolchain : null, lean: lcStep ? lcEnv('lean: ') : null,
      output: lcStep ? (lcStep.logTail || []).concat(lcStep.errTail || []).slice(-10) : [],
      run: lcStep ? lcRun.run : null, mode: lcStep ? lcRun.mode : null, at: lcStep ? lcRun.at : null, host: lcStep ? lcRun.host : null,
      auditSha: lcStep ? lcRun.auditSha : null,
      build: lcStep && lcRun !== lastDecided ? brief(lcf.steps.build) : null,
      prepare: lcStep && lcRun !== lastDecided ? brief(lcf.steps.prepare) : null,
    }),
    steps: { prepare: brief(f.steps.prepare), comparator: brief(f.steps.comparator), build: brief(f.steps.build), axioms: brief(f.steps.axioms) },
    env: f.env,
    run: last.run, auditSha: last.auditSha, at: last.at, host: last.host, nanodaBuild: last.nanodaBuild,
    runs: history.map((h) => (h.mode === 'fresh-only'
      ? { run: h.run, at: h.at, mode: h.mode, word: 'LEANCHECKER ' + leancheckerWord(h.fact).word, why: leancheckerWord(h.fact).why }
      : { run: h.run, at: h.at, word: h.decided ? h.decided.word : 'NOT DECIDED (in progress)', why: h.decided ? h.decided.why : null })),
    prior: meta.prior,
  });
}
const freshOnly = rows.filter((r) => r.leanchecker.mode === 'fresh-only');
const words = {};
for (const r of rows) words[r.word] = (words[r.word] || 0) + 1;
const record = {
  what: 'The kernel lane of the check of the two claimed refutations of the Exponential Time Hypothesis (OpenAI openai/math family 378; Anthropic formal-math eth/), decided by tools/record-eth-kernel.js from the facts a RunPod pod served (tools/runpod-eth.sh, imported by tools/import-runpod-eth.js). CERTIFIED here means each Lean theorem states exactly the claim\'s OWN challenge statement, uses only propext, Classical.choice and Quot.sound, and two independently written kernels accept the proof. It does NOT mean that the Lean statement is the paper\'s theorem, nor that ETH is false: no machine checks that, and both claimants say so (Anthropic\'s README; OpenAI\'s scope note lean/docs/378.md states a weaker bound than its manuscript).',
  campaign: 'eth-refutation, operator\'s go 2026-10-28 (budget cap US$50 of rented compute); the pins (corpus/eth-refutation/pins.json) and the static census (corpus/eth-refutation/census.json) were recorded before any run',
  words: {
    CERTIFIED: 'Comparator exit 0 with "Your solution is okay!", Lean\'s kernel and nanoda both accept, and #print axioms (our file) names only propext, Classical.choice, Quot.sound for every main theorem',
    REFUTED: 'a kernel rejects the solution; stated nowhere until a second run reproduces it',
    REFUSED: 'no decision, with the exact reason (resources, a tool that cannot read the toolchain, a build failure, bytes differing from the pins, Comparator stopping on the claim\'s own check, or kernels disagreeing)',
  },
  decider: 'Comparator leanprover/comparator d03acab1 (tag v4.34.0, lane K\'s pin) built with Lean v4.34.1, for BOTH claims; lean4export of each claim\'s toolchain (076e8e57 = v4.34.0 built with v4.34.1; 15f6055e = v4.33.0 built with v4.33.1); landrun 811cfff5; nanoda ammkrn/nanoda_lib 3a240721 with lane K\'s build (issue44 patch, 1 GiB stack); leanchecker of each claim\'s own toolchain; on one RunPod CPU pod, the claims one at a time, the bytes checked against the pins before anything ran',
  declaredChanges: [
    'enable_nanoda: true on each claim\'s own Comparator config (OpenAI ships false; Anthropic ships true); nothing else in either config changes',
    'GLIBC_TUNABLES=glibc.malloc.mmap_max=0:glibc.malloc.arena_max=1 for every Lean step of both claims (each row\'s env says so): the workaround OpenAI\'s own lean/README.md prescribes when vm.max_map_count is too low (the pod\'s is 65,530), which lane K needed on RunPod (amendments 15 and 16). A malloc setting: it changes how Lean allocates memory, never what it checks',
    'nanoda as lane K builds it: the ammkrn/nanoda_lib#44 patch (src/tc.rs) and the worker stack raised to 1 GiB (src/lib.rs); the diff is kept with the run (_nanoda.patch)',
    'for Anthropic (Lean v4.33.1): Comparator v4.34.0 built with v4.34.1, so Comparator\'s Lean kernel is v4.34.1 replaying a v4.33.1 export (the v4.33.0 tag lacks the quotient post-check and the issue-68 fix, which v4.34.0 has); the export is made by lean4export v4.33.0 built with the claim\'s own v4.33.1, whose format differs from v4.34.0\'s only in omitting partial definitions (neither tree has one: census.json); leanchecker --fresh replays with the claim\'s own v4.33.1 kernel. Anthropic\'s own CI uses Comparator 57567492 and robsimmons/nanoda_lib 68d5ca9d; neither is used here',
  ].concat(freshOnly.length ? ['leanchecker --fresh ran on a later pod in fresh-only mode (' + [...new Set(freshOnly.map((r) => r.leanchecker.run))].join(', ')
    + '; tools/runpod-eth.sh FRESH_ONLY=1): each claim cloned again and checked against the same pins, prepared as before (OpenAI: lake update, the resolved revisions against the pinned manifest; both: lake exe cache get), built with the claimant\'s own build command outside any sandbox, then replayed. No Comparator, export or nanoda ran on that pod: each row\'s Comparator, kernel and axiom facts are its decided run\'s (run, at), and its leanchecker facts are that pod\'s (leanchecker.run, leanchecker.at)'] : []),
  trustBase: 'the two kernels (Lean\'s, inside Comparator; nanoda), leanchecker, lean4export, Comparator\'s comparison code, landrun\'s Landlock sandbox (Comparator calls it with --best-effort; the pod\'s LSM list is in each row\'s env), the Mathlib cache fetched by lake exe cache get, the claimants\' lakefiles (OpenAI\'s applies dependency patches at lake update; none touches Mathlib, census.json), and RunPod\'s machine',
  counts: { decided: rows.length, of: Object.keys(CLAIMS).length, words },
  notRunYet,
  rows,
};
writeStable(OUT, record);
console.log('certs/eth-kernel.json: ' + rows.map((r) => r.claim + ' ' + r.word + (r.stage ? ' (' + r.stage + ')' : '')).join('; ') + (notRunYet.length ? '; not run yet: ' + notRunYet.join(', ') : ''));
