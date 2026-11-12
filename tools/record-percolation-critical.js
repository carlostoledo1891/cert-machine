#!/usr/bin/env node
/* record-percolation-critical.js — certs/percolation-critical.json: theta(p_c) = 0 on Z^d, the two labs' Lean proofs
   (Anthropic's, every d >= 2; OpenAI's, d = 3) bridged to one statement written independently from Grimmett. Re-derived
   from corpus/percolation-critical (the lane's records copied byte for byte, each pinned in PROVENANCE.json) and refused
   on any difference: every exit code, every axiom list, every kernel's line, the planted statements, the seam's counts,
   the money. Rules sealed before each stage (seals 18, 20 and 24), results after (19, 21 and 25). Amendment A2
   (2026-11-12, evening): the statement proved false at d = 1, and both labs' proofs, both bridges and the statement in
   ONE Lean, by the orchestrator's replay. `--check` compares.     MIT */
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

/* A2 — the statement's body false at d = 1 (the orchestrator's replay at both pins) */
const d1 = 'results/percolation/a2/dimone-replay/';
const D1 = ['TextbookPercolation.theta_dim_one_eq_zero', 'TextbookPercolation.pc_dim_one', 'TextbookPercolation.statement_body_false_at_dim_one'];
for (const pin of ['p432', 'p4341']) {
  const b = rd(d1 + pin + '-build.log');
  if (!/Build completed successfully/.test(b) || /^(error|warning)/m.test(b) || /sorry/.test(b)) die('the d = 1 build at ' + pin + ' is not a clean success');
  axiomsOK(d1 + pin + '-axioms.txt', D1);
  if (!rd('results/percolation/a2/dimone/' + pin + '-DimOne.sha256').includes(sha('perc/anchors/DimOne.lean'))) die('the d = 1 file built at ' + pin + ' is not perc/anchors/DimOne.lean');
}
if (/\bsorry\b|^\s*axiom\b|native_decide/m.test(rd('perc/anchors/DimOne.lean').replace(/\/-[\s\S]*?-\//g, ''))) die('perc/anchors/DimOne.lean holds a forbidden token');

/* A2 — one Lean: the orchestrator's replay, attempt 2 (attempt 1 is on record and must have failed as recorded) */
const a2 = 'results/percolation/a2/replay/';
const E3 = ['E-clean-build', 'E-build-statement-files', 'E-axioms', 'E-comparator-ours', 'E-comparator-openai', 'E-comparator-anthropic', 'E-fresh'];
for (const st of E3) if (ex(a2 + 'runs/' + st) !== 0) die('one Lean: ' + st + ' did not exit 0');
const cb = rd(a2 + 'runs/E-clean-build.log');
if (!/Build completed successfully \(8948 jobs\)/.test(cb) || /^error|✖/m.test(cb) || /^warning/m.test(cb) || rd(a2 + 'runs/E-clean-build.sorry.txt').trim() !== '') die('one Lean: the clean build is not a clean success without sorry');
for (const c of ['ours', 'openai', 'anthropic']) accepts(a2 + 'runs/E-comparator-' + c + '.log');
if (!rd(a2 + 'runs/E-comparator-ours.log').includes('configurations: comparator-ours.json') || !rd(a2 + 'runs/E-comparator-openai.log').includes('configurations: comparator-openai.json')) die('one Lean: a Comparator run did not use the configuration it is named for');
axiomsOK(a2 + 'runs/E-axioms.log', ['OneLean.statement_from_anthropic', 'OneLean.statement3_from_openai', 'OAI.CriticalZ3.critical_no_infinite', 'BondPercolation.percolation_continuity']);
const REDS = ['R1A-BridgeA', 'R1A-OneLean', 'R1O-BridgeO', 'R1O-OneLean', 'R1-OneLean', 'R4-BridgeA', 'R4-BridgeO', 'R4-OneLean'];
for (const r of REDS) {
  if (ex(a2 + 'runs/' + r) === 0) die('one Lean: the planted statement ' + r + ' was accepted');
  if (!/^error: Bridge[AO]\.lean:\d+:\d+: (Application t|T)ype mismatch/m.test(rd(a2 + 'runs/' + r + '.log'))) die('one Lean: ' + r + ' is not refused by a type mismatch inside a bridge');
}
for (const st of ['R4-plantedfalse', 'R4-axioms', 'restore-build', 'restore-axioms']) if (ex(a2 + 'runs/' + st) !== 0) die('one Lean: ' + st + ' did not exit 0');
axiomsOK(a2 + 'runs/R4-axioms.log', ['TextbookPercolation.planted_statement_false', 'TextbookPercolation.planted_statement3_false']);
axiomsOK(a2 + 'runs/restore-axioms.log', ['OneLean.statement_from_anthropic', 'OneLean.statement3_from_openai']);
if (rd(a2 + 'runs/E-oleans-before.sha256') !== rd(a2 + 'runs/E-oleans-after.sha256')) die('one Lean: the oleans after the restore are not the ones the kernels were shown');
if (sha(a2 + 'E/Textbook.lean') !== TEXTBOOK || sha(a2 + 'E/BridgeA.lean') !== sha('perc/bridgeA/Bridge.lean')) die('one Lean: the statement or bridge A in the environment is not the sealed file');
const ck = rd(a2 + 'runs/CHECKS.txt'), ck2 = rd(a2 + 'runs/CHECKS-attempt2.txt');
const port = /OpenAI closure: (\d+) pinned files, (\d+) in the port; byte-identical (\d+), changed (\d+)/.exec(ck) || die('one Lean: the port counts are missing');
const moved = /lines removed \/ added over the changed files: (\d+) \/ (\d+)/.exec(ck) || die('one Lean: the changed-line counts are missing');
if (!ck.includes('OpenAI statement file, E vs the pinned checkout: BYTE-IDENTICAL') || !/forbidden tokens on ADDED lines \([^)]*\): 0\n/.test(ck)) die('one Lean: the statement file is not byte-identical, or an added line holds a forbidden token');
if (!ck2.includes('AppleDouble files left anywhere in E outside .lake: 0') || !ck2.includes('the same 35 paths, the same sha256 each')) die('one Lean: attempt 2 did not start from the manifest\'s tree');
if (ex(a2 + 'runs-attempt1/E-clean-build') !== 1 || !rd(a2 + 'runs-attempt1/E-clean-build.log').includes('OAI: some modules have bad imports')) die('one Lean: attempt 1 is not the failed run on record');

/* the seam, as measured */
const seam = rd('perc/seam/READING.md');
const sm = /2,488 in common, of\s*which \*\*2,032 identical\*\*/.exec(seam) || die('the seam counts moved');

/* money: the lane's pod rows */
const pod = rd('pods.txt').split('\n').filter((l) => /^\S+ \S+ DELETED /.test(l) && /flb0x16odc1310|xim7c7qjmugr39|rli0cel1sleq5l|l9a01mpxra4o4q|fwwcomdlxq6mqc/.test(l));
const usd = pod.map((l) => Number((/≈ US\$([0-9.]+)[) ]/.exec(l) || [0, NaN])[1])).filter((x) => !Number.isNaN(x));
if (usd.length !== 5) die('expected five deleted percolation pods, found ' + usd.length);
const podMin = pod.map((l) => { const m = /≈ (?:(\d+) h )?(\d+) min/.exec(l); return m ? Number(m[1] || 0) * 60 + Number(m[2]) : NaN; });
if (podMin.some((x) => Number.isNaN(x))) die('a pod line does not state its minutes');

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
    { id: 'R2', what: 'the statement at d = 1 (A) / p_c of ℤ¹ (O)', false: true, refusedA: true, refusedO: true, provedFalseAtDimOne: true },
    { id: 'R3', what: 'p_c as inf {θ > 0}', false: false, refusedA: true, refusedO: true, note: 'still true: shows dependence on how p_c is written, not a refusal of a false claim' },
    { id: 'R4', what: 'p_c as sup {θ > 0}', false: true, provedFalse: true, refusedA: true, refusedO: true }
  ],
  seam: { common: 2488, identical: 2032, word: 'a reading', supersededBy: 'oneLean' },
  dimOne: { file: 'perc/anchors/DimOne.lean', sha256: sha('perc/anchors/DimOne.lean'), lines: lines('perc/anchors/DimOne.lean'), theorems: ['θ₁(p) = 0 for every p < 1', 'p_c(1) = 1', 'the statement’s body at d = 1 is false'], pins: 2 },
  oneLean: {
    toolchain: 'v4.32.0', mathlib: '81a5d257', ported: 'OpenAI’s ℤ³ proof, to Anthropic’s version',
    port: { files: Number(port[1]), identical: Number(port[3]), changed: Number(port[4]), linesOut: Number(moved[1]), linesIn: Number(moved[2]), statementFile: 'byte-identical', bridgeOLinesChanged: 3 },
    cleanBuildSeconds: secs(a2 + 'runs/E-clean-build'), comparators: 3, comparatorOursSeconds: secs(a2 + 'runs/E-comparator-ours'), freshSeconds: secs(a2 + 'runs/E-fresh'),
    planted: REDS.length, attempts: 2, firstAttempt: 'its build failed on 34 stray files from the checker’s own archive; kept on record'
  },
  money: { pods: usd.length, usd: Math.round(usd.reduce((a, b) => a + b, 0) * 100) / 100, minutes: podMin.reduce((a, b) => a + b, 0) },
  seals: [18, 19, 20, 21, 24, 25],
  provenance: { files: PROV.files.length, sourceCommit: PROV.source_commit },
  note: (() => { const n = JSON.parse(rd('note.json')); if (n.published && !/^10\.5281\/zenodo\.\d+$/.test(n.doi)) die('note.json: a published note needs a Zenodo DOI'); return { doi: n.doi, published: !!n.published }; })(),
  verdicts: { bridgeA: 'CERTIFIED', bridgeO: 'CERTIFIED', replayA: 'REPLAYED', anchors: 'CERTIFIED', seam: 'READ, NOT DECIDED', oneLean: 'CERTIFIED', dimOne: 'CERTIFIED' }
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
