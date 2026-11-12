#!/usr/bin/env node
/* record-percolation-critical.js — certs/percolation-critical.json: theta(p_c) = 0 on Z^d, the two labs' Lean proofs
   (Anthropic's, every d >= 2; OpenAI's, d = 3) bridged to one statement written independently from Grimmett. Re-derived
   from corpus/percolation-critical (the lane's records copied byte for byte, each pinned in PROVENANCE.json) and refused
   on any difference: every exit code, every axiom list, every kernel's line, the planted statements, the seam's counts,
   the money. Rules sealed before each stage (seals 18 and 20), results after (19 and 21). `--check` compares.     MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const P = path.join(ROOT, 'corpus', 'percolation-critical');
const die = (m) => { console.error('PERCOLATION RECORD REFUSED: ' + m); process.exit(1); };
const rd = (rel) => { try { return fs.readFileSync(path.join(P, rel), 'utf8'); } catch (e) { die('missing ' + rel); } };
const ex = (rel) => Number(rd(rel + '.exit').trim());
const secs = (rel) => Number(rd(rel + '.seconds').trim());
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(P, rel))).digest('hex');
const STD = /depends on axioms: \[propext,\s*Classical\.choice,\s*Quot\.sound\]/;
const axiomsOK = (rel, names) => {
  const t = rd(rel).replace(/\n\s+/g, ' ');
  for (const n of names) {
    const line = t.split('\n').find((l) => l.includes("'" + n + "' depends on axioms"));
    if (!line || !STD.test(line)) die(rel + ': ' + n + ' is not on exactly the three standard axioms');
  }
  if (/sorryAx/.test(t)) die(rel + ' mentions sorryAx');
  return names.length;
};
const accepts = (rel) => ['nanoda kernel accepts the solution', 'Lean default kernel accepts the solution', 'Your solution is okay!']
  .every((s) => rd(rel).includes(s)) || die(rel + ' does not hold the three accepting lines');

/* every copied file is the one pinned */
const PROV = JSON.parse(rd('PROVENANCE.json'));
for (const f of PROV.files) if (sha(f.path) !== f.sha256) die(f.path + ' is not the pinned file');

/* the statement */
const TEXTBOOK = '4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae';
if (sha('perc/Textbook.lean') !== TEXTBOOK) die('perc/Textbook.lean is not the sealed statement');
const lines = (rel) => rd(rel).split('\n').length - 1;

/* P1 — Anthropic's development replayed */
const p1 = 'results/percolation/p1/runs/';
if (ex(p1 + 'build') !== 0 || ex(p1 + 'axioms') !== 0 || ex(p1 + 'comparator') !== 0 || ex(p1 + 'fresh') !== 0) die('a P1 step did not exit 0');
if (ex(p1 + 'red-d1') === 0 || ex(p1 + 'red-theta1') === 0) die('a P1 red control was accepted');
accepts(p1 + 'comparator.log');
const auditNames = [...rd(p1 + 'axioms.log').matchAll(/^'([^']+)' depends on axioms/gm)].map((m) => m[1]);
if (auditNames.length !== 7) die('P1 audited ' + auditNames.length + ' theorems, not 7');
axiomsOK(p1 + 'axioms.log', auditNames);

/* P6 — the orchestrator's replay of both bridges, our statement as the challenge */
const p6 = 'results/percolation/p6/runs/';
for (const s of ['A-build', 'A-axioms', 'A-comparator', 'A-fresh', 'O-build', 'O-axioms', 'O-comparator3', 'O-fresh']) if (ex(p6 + s) !== 0) die(s + ' did not exit 0');
accepts(p6 + 'A-comparator.log'); accepts(p6 + 'O-comparator3.log');
axiomsOK(p6 + 'A-axioms.log', ['bridgeA', 'statement_from_anthropic']);
axiomsOK(p6 + 'O-axioms.log', ['BridgeO.bridgeO', 'BridgeO.statement3_from_openai']);
if (!rd(p6 + 'A-sha.log').includes('Textbook.lean: OK') || !rd(p6 + 'O-sha.log').includes('Textbook.lean: OK')) die('the statement was not the sealed one in a P6 environment');

/* the planted statements of the agents' runs (R1–R3) */
const redA = ['R1', 'R2', 'R3'].map((r) => ex('perc/bridgeA/red/' + r));
const redO = rd('perc/bridgeO/red/summary.txt');
if (redA.some((x) => x === 0) || !['R1', 'R2', 'R3'].every((r) => new RegExp(r + ' EXIT=1').test(redO))) die('an R1–R3 plant was accepted');

/* A1 — the anchors in each lab's environment, and R4 */
const a1 = 'results/percolation/a1/r4/runs/';
for (const s of ['A-green', 'A-axioms', 'A-R4-plantedfalse', 'A-R4-axioms', 'A-restore', 'O-green', 'O-axioms', 'O-R4-plantedfalse', 'O-R4-axioms', 'O-restore']) if (ex(a1 + s) !== 0) die(s + ' did not exit 0');
if (ex(a1 + 'A-R4-bridge') === 0 || ex(a1 + 'O-R4-bridge') === 0) die('a bridge accepted R4');
if (!/^error: (bridge\/)?Bridge\.lean/m.test(rd(a1 + 'A-R4-bridge.log')) || !/^error: bridge\/Bridge\.lean/m.test(rd(a1 + 'O-R4-bridge.log'))) die('an R4 refusal is not an error inside the bridge');
axiomsOK(a1 + 'A-axioms.log', ['bridgeA', 'statement_from_anthropic', 'TextbookPercolation.theta_zero', 'TextbookPercolation.theta_one', 'TextbookPercolation.pc_mem', 'pc_lt_one_from_anthropic']);
axiomsOK(a1 + 'O-axioms.log', ['BridgeO.bridgeO', 'BridgeO.statement3_from_openai', 'TextbookPercolation.theta_zero', 'TextbookPercolation.theta_one', 'TextbookPercolation.pc_mem', 'pc3_lt_one_from_openai']);
for (const s of ['A-R4-axioms', 'O-R4-axioms']) axiomsOK(a1 + s + '.log', ['TextbookPercolation.planted_statement_false', 'TextbookPercolation.planted_statement3_false']);
const mac = rd('results/percolation/p5/mac-builds.log');
if ((mac.match(/Build completed successfully/g) || []).length !== 4) die('the Mac anchor builds are not four successes');

/* the seam, as measured */
const seam = rd('perc/seam/READING.md');
const sm = /2,488 in common, of\s*which \*\*2,032 identical\*\*/.exec(seam) || die('the seam counts moved');

/* money: the lane's pod rows */
const pod = rd('pods.txt').split('\n').filter((l) => /DELETED/.test(l) && /percolation|p-perc|flb0x16odc1310|xim7c7qjmugr39|rli0cel1sleq5l/.test(l));
const usd = pod.map((l) => Number((/≈ US\$([0-9.]+)\)/.exec(l) || [0, NaN])[1])).filter((x) => !Number.isNaN(x));
if (usd.length !== 3) die('expected three deleted percolation pods, found ' + usd.length);

const R = {
  undecided: 'The proofs are Anthropic’s (J. Leder with Claude, anthropics/formal-math 795efb86, unmerged) and OpenAI’s (openai/math, family 213, CriticalZ3). This record checks that their Lean theorems prove a statement written independently from Grimmett (1999, §1.3–1.4); it checks neither informal paper nor Kozma–Nitzan’s reduction as printed.',
  statement: { file: 'perc/Textbook.lean', sha256: TEXTBOOK, lines: lines('perc/Textbook.lean'), source: 'G. Grimmett, Percolation, 2nd ed., Springer 1999, §1.3–1.4', pc: 'sup {p : θ(p) = 0}' },
  anthropic: {
    pins: { repository: 'https://github.com/anthropics/formal-math', commit: '795efb86f191735c5481675763537cfb4ff37e55', tarballSha256: '10f3e6b94b9584799670bfd842e3cadb2287fa9e9f50b9fb6b5ec9a2756955c4', toolchain: 'v4.32.0', mathlib: '81a5d257' },
    replay: { buildSeconds: secs(p1 + 'build'), audited: auditNames.length, comparator: 'accepts (Lean, nanoda)', redControls: 2, freshSeconds: secs(p1 + 'fresh') },
    bridge: { lines: lines('perc/bridgeA/Bridge.lean'), sha256: sha('perc/bridgeA/Bridge.lean'), dims: 'every d ≥ 2', uses: 'theta_mono_holds', comparatorSeconds: secs(p6 + 'A-comparator'), freshSeconds: secs(p6 + 'A-fresh') }
  },
  openai: {
    pins: { repository: 'https://github.com/openai/math', commit: '4eaee87548250b2682affda7d05d947c05554bae', toolchain: 'v4.34.1', mathlib: 'd13f23b7' },
    bridge: { lines: lines('perc/bridgeO/Bridge.lean'), sha256: sha('perc/bridgeO/Bridge.lean'), dims: 'd = 3', monotonicityLines: 79, comparatorSeconds: secs(p6 + 'O-comparator3'), freshSeconds: secs(p6 + 'O-fresh') }
  },
  anchors: { theorems: ['θ_d(0) = 0', 'θ_d(1) = 1 (d ≥ 1)', 'p_c(d) ∈ [0, 1]', 'Statement ⇒ p_c(d) < 1'], pins: 2, inBothLabsEnvironments: true },
  planted: [
    { id: 'R1', what: 'θ(p_c) = 1', false: true, refusedA: true, refusedO: true },
    { id: 'R2', what: 'the statement at d = 1 (A) / p_c of ℤ¹ (O)', false: true, refusedA: true, refusedO: true },
    { id: 'R3', what: 'p_c as inf {θ > 0}', false: false, refusedA: true, refusedO: true, note: 'still true: shows dependence on how p_c is written, not a refusal of a false claim' },
    { id: 'R4', what: 'p_c as sup {θ > 0}', false: true, provedFalse: true, refusedA: true, refusedO: true }
  ],
  seam: { common: 2488, identical: 2032, word: 'a reading' },
  money: { pods: usd.length, usd: Math.round(usd.reduce((a, b) => a + b, 0) * 100) / 100 },
  seals: [18, 19, 20, 21],
  provenance: { files: PROV.files.length, sourceCommit: PROV.source_commit },
  verdicts: { bridgeA: 'CERTIFIED', bridgeO: 'CERTIFIED', replayA: 'REPLAYED', anchors: 'CERTIFIED', seam: 'READ, NOT DECIDED' }
};
const out = path.join(ROOT, 'certs', 'percolation-critical.json');
const text = JSON.stringify(R, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(out, 'utf8') !== text) die('certs/percolation-critical.json differs from what corpus/percolation-critical gives');
  console.log('certs/percolation-critical.json re-derived: identical');
} else {
  fs.writeFileSync(out, text);
  console.log('certs/percolation-critical.json written · ' + Object.entries(R.verdicts).map(([k, v]) => k + ' ' + v).join(' · ') + ' · US$' + R.money.usd);
}
