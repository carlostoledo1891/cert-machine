#!/usr/bin/env node
/* record-eth-bridge.js — certs/eth-bridge.json: the ETH bridge (corpus/eth-refutation/bridge), recorded from ONE green
   run of .github/workflows/eth-bridge.yml. The gates are tools/eth-bridge-gates.js and nowhere else; this file runs
   them again on the downloaded logs and on the checkout, and writes the ledger only when every one passes.

   The word, per theorem:
     PROVED   the project built (lake build exit 0) on the claim's own Lean and Mathlib, the theorem's #print axioms
              names only propext, Classical.choice and Quot.sound (or nothing), and no Lean file of the project
              contains sorry, admit, native_decide, an axiom declaration, implemented_by, extern, unsafe or
              debug.skipKernelTC. Lean's own kernel checked it, inside `lake build`.
   The kernels, per theorem (the field `kernels`, ids explained in the record's `kernelIds`):
     lean-build        Lean's kernel inside lake build (the bridge job);
     lean-comparator   Lean's kernel again, replaying the lean4export export of the solution inside Comparator (the
                       kernels job, a fresh runner, before anything else built the bridge there);
     nanoda            nanoda on the same export, run by Comparator.
   A theorem gets the last two only when the kernels gate passes for its project: Comparator exit 0, "Your solution is
   okay!", both kernels print that they accept, the theorem is in the config and in the solution export, and the
   challenge, config and lakefile the run used are exactly what the checkout builds.
   Anything else is REFUSED and nothing is written: a run not completed or not green, a run of another workflow, a
   log with a sorry, an error or a non-standard axiom, a theorem without an axioms line, a kernel job missing or
   refused, or sources whose sha256 (as the run hashed them) differ from the checkout's — the ledger must describe
   the bytes on disk.

   The run's logs are kept beside the sources, corpus/eth-refutation/bridge/runs/<run-id>/<project>/ (the kernel job's
   in <project>/kernels/).

   usage: node tools/record-eth-bridge.js <run-id> */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { writeStable } = require('./stable-json.js');
const gates = require('./eth-bridge-gates.js');

const ROOT = path.resolve(__dirname, '..');
const REPO = 'carlostoledo1891/cert-machine';
const OUT = process.env.ETH_BRIDGE_OUT || path.join(ROOT, 'certs', 'eth-bridge.json');
const RUNS = path.join(gates.BRIDGE, 'runs');
const KEEP = ['env.txt', 'build.log', 'build-exit.txt', 'build-seconds.txt', 'axioms.log', 'axioms-exit.txt',
  'lake-manifest.json', 'sources.sha256', 'sources-gate.txt', 'logs-gate.txt'];
const KEEP_KERNELS = ['env.txt', 'machine.txt', 'builders.txt', 'nanoda.patch', 'lake-manifest.json', 'sources.sha256', 'sources-gate.txt',
  'challenge-step.txt', gates.CHALLENGE_FILE, gates.CONFIG_FILE, 'lakefile.toml', 'comparator.log', 'comparator.err', 'comparator.exit',
  'comparator.start', 'comparator.end', 'mem.tsv', 'free-end.txt', 'kernels-gate.txt'];
const KERNEL_IDS = {
  'lean-build': 'Lean\'s kernel inside lake build, on the claim\'s own Lean and Mathlib (the bridge job)',
  'lean-comparator': 'Lean\'s kernel again: Comparator (leanprover/comparator d03acab1, tag v4.34.0, built with Lean v4.34.1) replays the lean4export export of the solution module ETHBridge into its own Lean kernel (the kernels job, on a fresh runner on which nothing built the bridge before Comparator did)',
  nanoda: 'nanoda (ammkrn/nanoda_lib 3a240721 with the issue44 patch and a 1 GiB stack, as lane K builds it), an independently written kernel in Rust, run by Comparator on the same export',
};
const rd = (d, n) => (fs.existsSync(path.join(d, n)) ? fs.readFileSync(path.join(d, n), 'utf8') : null);
function memPeak(d, t0, t1) {
  const t = rd(d, 'mem.tsv');
  if (!t || t0 == null) return null;
  const v = t.split('\n').map((l) => l.trim().split(/\s+/).map(Number)).filter((p) => p.length === 2 && p[0] >= t0 && p[0] <= t1).map((p) => p[1]);
  return v.length ? Math.max(...v) : null;
}

const run = process.argv[2];
if (!/^\d+$/.test(run || '')) { console.error('usage: record-eth-bridge.js <run-id>'); process.exit(2); }
const refuse = (why) => { console.error('REFUSED: ' + why); process.exit(1); };

const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,headBranch,status,conclusion,url,createdAt,updatedAt,workflowName,displayTitle`, { encoding: 'utf8' }));
if (meta.workflowName !== 'eth-bridge') refuse('run ' + run + ' is of the workflow ' + meta.workflowName);
if (meta.status !== 'completed' || meta.conclusion !== 'success') refuse('run ' + run + ' is ' + meta.status + '/' + meta.conclusion);

const src = gates.checkSources();
if (!src.ok) refuse('the checkout fails the source gates:\n  ' + src.fails.join('\n  '));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eth-bridge-'));
cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} --pattern 'eth-bridge-*'`, { stdio: 'inherit' });

const projects = {};
for (const p of Object.keys(gates.PROJECTS)) {
  const dir = path.join(tmp, 'eth-bridge-' + p);
  if (!fs.existsSync(dir)) refuse('no artifact eth-bridge-' + p);
  const thms = src.facts.theorems[p];
  const logs = gates.checkLogs(p, dir, thms.map((t) => t.name));
  if (!logs.ok) refuse(logs.fails.join('; '));
  /* the run's hashes of its sources must be the checkout's */
  const ranHashes = {};
  for (const l of fs.readFileSync(path.join(dir, 'sources.sha256'), 'utf8').split('\n').filter(Boolean)) {
    const m = /^([0-9a-f]{64})\s+\.\/(.+)$/.exec(l);
    if (m) ranHashes[m[2]] = m[1];
  }
  const diff = Object.keys(src.facts.files[p]).filter((f) => ranHashes[f] !== src.facts.files[p][f])
    .concat(Object.keys(ranHashes).filter((f) => !(f in src.facts.files[p])));
  if (diff.length) refuse(p + ': the run built other bytes than the checkout holds: ' + diff.join(', '));
  const env = fs.readFileSync(path.join(dir, 'env.txt'), 'utf8');
  if (!env.includes('commit: ' + meta.headSha)) refuse(p + ': env.txt names another commit than the run');
  const mathlibRan = (/^mathlib: ([0-9a-f]{40})$/m.exec(env) || [])[1];
  if (mathlibRan !== gates.PROJECTS[p].mathlib) refuse(p + ': the run checked out mathlib ' + mathlibRan);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'lake-manifest.json'), 'utf8'));
  /* the kernel job: Comparator, Lean's kernel and nanoda, on every theorem */
  const kdir = path.join(tmp, 'eth-bridge-kernels-' + p);
  if (!fs.existsSync(kdir)) refuse('no artifact eth-bridge-kernels-' + p + ' (the second kernel did not run)');
  const kern = gates.checkKernels(p, kdir, thms.map((t) => t.name));
  if (!kern.ok) refuse(kern.fails.join('; '));
  const kenv = rd(kdir, 'env.txt') || '';
  if (!kenv.includes('commit: ' + meta.headSha)) refuse(p + ': the kernel job\'s env.txt names another commit than the run');
  const kmathlib = (/^mathlib: ([0-9a-f]{40})$/m.exec(kenv) || [])[1];
  if (kmathlib !== gates.PROJECTS[p].mathlib) refuse(p + ': the kernel job checked out mathlib ' + kmathlib);
  const t0 = Number((rd(kdir, 'comparator.start') || '').trim()) || null;
  const t1 = Number((rd(kdir, 'comparator.end') || '').trim()) || null;
  const rss = /Maximum resident set size \(kbytes\): (\d+)/.exec(rd(kdir, 'comparator.err') || '');
  const keep = path.join(RUNS, run, p);
  fs.mkdirSync(path.join(keep, 'kernels'), { recursive: true });
  for (const f of KEEP) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(keep, f));
  for (const f of KEEP_KERNELS) if (fs.existsSync(path.join(kdir, f))) fs.copyFileSync(path.join(kdir, f), path.join(keep, 'kernels', f));
  const kernelsOf = ['lean-build', 'lean-comparator', 'nanoda'];
  projects[p] = {
    toolchain: gates.PROJECTS[p].toolchain,
    leanVersion: (/^Lean \(version [^)]*\)[^\n]*/m.exec(env) || [null])[0],
    mathlib: mathlibRan,
    packages: manifest.packages.map((x) => ({ name: x.name, rev: x.rev })),
    buildSeconds: Number(fs.readFileSync(path.join(dir, 'build-seconds.txt'), 'utf8').trim()),
    files: src.facts.files[p],
    theorems: thms.map((t) => ({ name: t.name, word: 'PROVED', axioms: logs.axioms[t.name], kernels: kernelsOf, doc: t.doc, statement: t.statement, file: t.file, line: t.line })),
    logs: path.relative(ROOT, keep),
    kernelReplay: {
      tool: 'Comparator, config ' + gates.CONFIG_FILE + ': challenge ' + gates.CHALLENGE_MODULE + ' (generated: the two bridge files as one module, every proof replaced by sorry), solution ' + gates.SOLUTION_MODULE + ', every theorem of the project, permitted axioms propext, Quot.sound, Classical.choice, enable_nanoda true',
      config: JSON.parse(rd(kdir, gates.CONFIG_FILE)),
      challengeSha256: kern.facts[gates.CHALLENGE_FILE],
      lakefileAmendment: gates.CHALLENGE_LIB.trim(),
      lakefileAsRunSha256: kern.facts['lakefile.toml'],
      exit: Number(kern.facts.exit),
      verdictLines: kern.facts.lines,
      theoremsExported: kern.facts.exported,
      seconds: t0 && t1 ? t1 - t0 : null,
      maxRssKB: rss ? Number(rss[1]) : null,
      usedMemPeakKB: memPeak(kdir, t0, t1),
      leanVersion: (/^Lean \(version [^)]*\)[^\n]*/m.exec(kenv) || [null])[0],
      lean4export: (/^lean4export .*$/m.exec(kenv) || [null])[0],
      env: kenv.split('\n').filter((l) => /^(comparator|nanoda|landrun|GLIBC_TUNABLES|runner|cpus|MemTotal|SwapTotal|vm\.max_map_count|kernel|landlock): /.test(l)),
      logs: path.relative(ROOT, path.join(keep, 'kernels')),
    },
  };
}

const theorem = (p, n) => projects[p].theorems.find((t) => t.name === n);
const record = {
  what: 'The ETH bridge: Lean proofs, written here, that each claimed refutation of the Exponential Time Hypothesis, taken as its OWN Lean statement, implies that the textbook ETH (Impagliazzo–Paturi: s_k > 0 for every k ≥ 3, s_k the infimum of the δ for which k-SAT has an O(2^{δn}) algorithm) is false, stated once over an abstract model and instantiated with each claimant\'s own machine model and input encoding; and, since both statements COUNT satisfying assignments, that each implies the counting hypothesis #ETH (Dell–Husfeldt–Marx–Taslaman–Wahlén: s#_k > 0 for every k ≥ 3) is false in that claimant\'s own counting model. Every theorem is checked by Lean\'s kernel in lake build and replayed by a second, independently written kernel (nanoda) and by Lean\'s kernel again, through Comparator (`kernels`). It does NOT re-prove either claim (certs/eth-kernel.json certifies that each claimant proved its own statement); it closes the step from that statement to the textbook hypotheses that each claimant left to prose (corpus/eth-refutation/readings/first.md §I.4, §II.4).',
  campaign: 'eth-refutation; the bridge lane agreed with the operator 2026-10-28 (HANDOFF); #ETH and the second kernel added 2026-10-29',
  words: {
    PROVED: 'lake build exit 0 on the claim\'s own Lean and Mathlib; #print axioms names only propext, Classical.choice, Quot.sound (or nothing); no Lean file of the project contains sorry, admit, native_decide, an axiom declaration, implemented_by, extern, unsafe or debug.skipKernelTC. Checked there by Lean\'s kernel (in lake build); the kernels that replayed the theorem are listed in its `kernels` field (ids in `kernelIds`)',
  },
  kernelIds: KERNEL_IDS,
  run: { id: meta.databaseId, url: meta.url, commit: meta.headSha, branch: meta.headBranch, createdAt: meta.createdAt, conclusion: meta.conclusion },
  gates: 'tools/eth-bridge-gates.js (sources: copies against pins.json, generic file identical, nothing forbidden, every theorem printed; logs: exit codes, no sorry, no error, standard axioms only)',
  copies: {
    openai: { source: 'openai/math@7ef5c0cc5ca4b0e072b7a050fca09ab24bc6fa3a lean/ComparatorChallenges/SubexponentialSAT.lean', copy: 'corpus/eth-refutation/bridge/openai/ETHBridge/OpenAIChallenge.lean', pinnedSha256: src.facts.openaiChallenge.pinned, rebuiltSha256: src.facts.openaiChallenge.rebuilt,
      change: 'ONE declared change: the closing theorem exact_count_and_sat, whose proof the challenge leaves open, becomes `def OpenAIClaim : Prop := ∀ (k : ℕ) (hk : 2 ≤ k), <its 23 statement lines unchanged>`; undoing it gives the pinned bytes (tools/eth-bridge-gates.js)' },
    anthropic: { source: 'anthropics/formal-math@16a5ce41304fcdaea4e0be7c132e1c361dc26da5 eth/MainResults.lean', copy: 'corpus/eth-refutation/bridge/anthropic/MainResults.lean', pinnedSha256: src.facts.mainResults.pinned, rebuiltSha256: src.facts.mainResults.rebuilt, change: 'none (a header comment above the unchanged bytes)' },
  },
  generic: { file: 'ETHBridge/Generic.lean (byte-identical in both projects)', sha256: src.facts.genericSha256 },
  bridges: {
    openai: { theorem: theorem('openai', 'ETHBridge.OpenAI.not_eth_of_claim'), reads: 'If OpenAI\'s challenge statement exact_count_and_sat holds, then ETH (s_k > 0 for every k ≥ 3) is false for PrimitiveMachines on encodeCNF; indeed s_k = 0 for every k ≥ 2 (s_eq_zero_of_claim).' },
    anthropic: { theorem: theorem('anthropic', 'ETHBridge.Anthropic.not_eth_of_ethIsFalse'), reads: 'Anthropic\'s ETHIsFalse implies that ETH (s_k > 0 for every k ≥ 3) is false for FinTM2 machines on encClauses; the generic DecidesKSat, InTime and s ARE Anthropic\'s, by definition (decidesKSat_iff, inTime_iff, s_eq).' },
  },
  sharpEth: {
    source: 'Dell, Husfeldt, Marx, Taslaman, Wahlén, "Exponential time complexity of the permanent and the Tutte polynomial", ACM Transactions on Algorithms 10(4), 2014, art. 21: #ETH, the counting analogue of ETH (counting the satisfying assignments of a 3-CNF on n variables takes time 2^{cn} for some c > 0)',
    reads: 'Stated once, generically, as ETH is: a CountModel gives the machines, formulas, instances, which assignments satisfy a formula, the input word, and what "halts within t steps with the number c written on its output" means; numSat is the number of satisfying assignments (Nat.card, defined once); s#_k is the infimum of the δ for which some admissible machine counts every #k-SAT instance on n variables within ⌊c·2^{δn}⌋ steps; #ETH is s#_k > 0 for every k ≥ 3. Each definition mirrors the ETH definition of the same shape (DecidesKSat/CountsKSat, InTime/CountInTime, s/sharpS, ETH/SharpETH). A polynomial factor changes no infimum; s#_3 = 0 (sharpS_eq_zero_of_claim, sharpS_eq_zero_of_mainTheorem) refutes the k = 3 form too.',
    file: 'ETHBridge/Generic.lean (byte-identical in both projects)',
    definitions: gates.definitions(path.join(gates.BRIDGE, 'openai', 'ETHBridge', 'Generic.lean'), gates.SHARP_DEFS),
    theorems: ['ETHBridge.sharpS_eq_zero_of_forall_countInTime', 'ETHBridge.not_sharpEth_iff', 'ETHBridge.not_sharpEth_of_forall_countInTime'].map((n) => theorem('openai', n)),
  },
  sharpBridges: {
    openai: { theorem: theorem('openai', 'ETHBridge.OpenAI.not_sharpEth_of_claim'), reads: 'If OpenAI\'s challenge statement exact_count_and_sat holds, then #ETH (s#_k > 0 for every k ≥ 3) is false for PrimitiveMachines on encodeCNF, the count read where OpenAI writes it; indeed s#_k = 0 for every k ≥ 2 (sharpS_eq_zero_of_claim). The generic count is OpenAI\'s SAT.count (numSat_eq_count).',
      convention: 'OpenAI\'s: a counting machine is a PrimitiveMachine with its count tape, chosen together before the constants and the formulas, as exact_count_and_sat chooses them; it halts (a state inl b) within t steps with the count tape exactly Tape.mk₁ ((countWord c).map some), the binary digits of c lowest first (Nat.bits; the single digit 0 for c = 0). Formulas, instances (WidthAtMost k) and input word (encodeCNF) as in the ETH model.' },
    anthropic: { theorem: theorem('anthropic', 'ETHBridge.Anthropic.not_sharpEth_of_mainTheorem'), reads: 'If Anthropic\'s MainTheorem holds, then #ETH (s#_k > 0 for every k ≥ 3) is false for FinTM2 machines with finite alphabets on encInput, the count read where Anthropic writes it, on the formulas MainTheorem speaks of; indeed s#_k = 0 for every k ≥ 1 (sharpS_eq_zero_of_mainTheorem). The generic count is Anthropic\'s numSat (numSat_eq), and the generic CountsKSat is Anthropic\'s CountsWithin on that class (countsKSat_iff).',
      convention: 'Anthropic\'s: the input word is encInput k φ (1ᵏ 0, then encClauses k φ); the output is TM2OutputsInTime with output binary n c, the lowest n + 1 bits of c, lowest bit first, through the output alphabet. The #k-SAT instances are those MainTheorem speaks of: IsKCNF k φ, at least two clauses, at least four variables, every variable occurring (AllOccur).' },
  },
  notProved: [
    'The cross-model bridges stay prose for both claimants and here: that a PrimitiveMachine (OpenAI) or a FinTM2 machine (Anthropic) is simulated by a word RAM or a multitape Turing machine with polynomial overhead (first.md B1, B1′), and that a textbook 3-CNF is rewritten into encodeCNF / encClauses in time polynomial in its length (B2, B2′). ETH is proved false here in each claimant\'s own model, not in a model-free sense. The same holds for #ETH (and for encInput).',
    'MainResults.ETH → ETHBridge.ETH (the converse of eth_of_eth) is not proved: it needs s_3 ≤ s_k for k ≥ 3, and Anthropic\'s encoding depends on k (k slots per clause), so a machine for 3-SAT does not run on a k-SAT word without a re-encoding machine. It is not needed for the bridge.',
    'Anthropic\'s #ETH is #ETH on the formulas MainTheorem speaks of (IsKCNF k φ, at least two clauses, at least four variables, every variable occurring): MainResults.lean says nothing about any other input word. The other k-CNFs reduce to that class by standard steps (a finite table for fewer than four variables and k fixed; a closed form for fewer than two clauses; a variable that occurs nowhere doubles the count) that are NOT formalized. OpenAI\'s #ETH has no such restriction: its statement covers every formula of width at most k.',
    'ETH and #ETH are separate consequences here: ETH → #ETH (counting is at least as hard as deciding) is not proved in either model, and neither refutation is derived from the other.',
    'The Comparator challenge is generated from our own bridge files (every proof replaced by sorry), so its statement match checks our text against itself; the claimants\' statements enter only through the pinned copies, as in lake build. leanchecker was not run (as in the eth-kernel and eth-tsavo lanes).',
    'Nothing here re-checks either claimant\'s proof: certs/eth-kernel.json is that lane.',
  ],
  projects,
};
writeStable(OUT, record);
console.log('wrote ' + path.relative(ROOT, OUT) + ': run ' + run + ' at ' + meta.headSha.slice(0, 8) + ', ' +
  Object.entries(projects).map(([p, x]) => p + ' ' + x.theorems.length + ' theorems PROVED').join(', '));
