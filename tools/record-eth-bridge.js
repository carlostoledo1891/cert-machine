#!/usr/bin/env node
/* record-eth-bridge.js — certs/eth-bridge.json: the ETH bridge (corpus/eth-refutation/bridge), recorded from ONE green
   run of .github/workflows/eth-bridge.yml. The gates are tools/eth-bridge-gates.js and nowhere else; this file runs
   them again on the downloaded logs and on the checkout, and writes the ledger only when every one passes.

   The word, per theorem:
     PROVED   the project built (lake build exit 0) on the claim's own Lean and Mathlib, the theorem's #print axioms
              names only propext, Classical.choice and Quot.sound (or nothing), and no Lean file of the project
              contains sorry, admit, native_decide, an axiom declaration, implemented_by, extern, unsafe or
              debug.skipKernelTC. One kernel checked it: Lean's own, inside `lake build`.
   Anything else is REFUSED and nothing is written: a run not completed or not green, a run of another workflow, a
   log with a sorry, an error or a non-standard axiom, a theorem without an axioms line, or sources whose sha256
   (as the run hashed them) differ from the checkout's — the ledger must describe the bytes on disk.

   The run's logs are kept beside the sources, corpus/eth-refutation/bridge/runs/<run-id>/<project>/.

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
  const keep = path.join(RUNS, run, p);
  fs.mkdirSync(keep, { recursive: true });
  for (const f of KEEP) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(keep, f));
  projects[p] = {
    toolchain: gates.PROJECTS[p].toolchain,
    leanVersion: (/^Lean \(version [^)]*\)[^\n]*/m.exec(env) || [null])[0],
    mathlib: mathlibRan,
    packages: manifest.packages.map((x) => ({ name: x.name, rev: x.rev })),
    buildSeconds: Number(fs.readFileSync(path.join(dir, 'build-seconds.txt'), 'utf8').trim()),
    files: src.facts.files[p],
    theorems: thms.map((t) => ({ name: t.name, word: 'PROVED', axioms: logs.axioms[t.name], doc: t.doc, statement: t.statement, file: t.file, line: t.line })),
    logs: path.relative(ROOT, keep),
  };
}

const theorem = (p, n) => projects[p].theorems.find((t) => t.name === n);
const record = {
  what: 'The ETH bridge: Lean proofs, written here, that each claimed refutation of the Exponential Time Hypothesis, taken as its OWN Lean statement, implies that the textbook ETH (Impagliazzo–Paturi: s_k > 0 for every k ≥ 3, s_k the infimum of the δ for which k-SAT has an O(2^{δn}) algorithm) is false, stated once over an abstract model and instantiated with each claimant\'s own machine model and input encoding. It does NOT re-prove either claim (certs/eth-kernel.json certifies that each claimant proved its own statement); it closes the step from that statement to the textbook hypothesis that each claimant left to prose (corpus/eth-refutation/readings/first.md §I.4, §II.4).',
  campaign: 'eth-refutation; the bridge lane agreed with the operator 2026-10-28 (HANDOFF)',
  words: {
    PROVED: 'lake build exit 0 on the claim\'s own Lean and Mathlib; #print axioms names only propext, Classical.choice, Quot.sound (or nothing); no Lean file of the project contains sorry, admit, native_decide, an axiom declaration, implemented_by, extern, unsafe or debug.skipKernelTC. One kernel (Lean\'s, in lake build)',
  },
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
  notProved: [
    'The cross-model bridges stay prose for both claimants and here: that a PrimitiveMachine (OpenAI) or a FinTM2 machine (Anthropic) is simulated by a word RAM or a multitape Turing machine with polynomial overhead (first.md B1, B1′), and that a textbook 3-CNF is rewritten into encodeCNF / encClauses in time polynomial in its length (B2, B2′). ETH is proved false here in each claimant\'s own model, not in a model-free sense.',
    'MainResults.ETH → ETHBridge.ETH (the converse of eth_of_eth) is not proved: it needs s_3 ≤ s_k for k ≥ 3, and Anthropic\'s encoding depends on k (k slots per clause), so a machine for 3-SAT does not run on a k-SAT word without a re-encoding machine. It is not needed for the bridge.',
    'Nothing here re-checks either claimant\'s proof: certs/eth-kernel.json is that lane.',
  ],
  projects,
};
writeStable(OUT, record);
console.log('wrote ' + path.relative(ROOT, OUT) + ': run ' + run + ' at ' + meta.headSha.slice(0, 8) + ', ' +
  Object.entries(projects).map(([p, x]) => p + ' ' + x.theorems.length + ' theorems PROVED').join(', '));
