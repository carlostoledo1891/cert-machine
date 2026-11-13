#!/usr/bin/env node
/* record-percolation-critical.js — certs/percolation-critical.json: theta(p_c) = 0 on Z^d, the two labs' Lean proofs
   (Anthropic's, every d >= 2; OpenAI's, d = 3) bridged to one statement written independently from Grimmett. Re-derived
   from corpus/percolation-critical (the lane's records copied byte for byte, each pinned in PROVENANCE.json) and refused
   on any difference: every exit code, every axiom list, every kernel's line, the planted statements, the seam's counts,
   the money. Rules sealed before each stage (seals 18, 20 and 24), results after (19, 21 and 25). Amendment A2
   (2026-11-12, evening): the statement proved false at d = 1, and both labs' proofs, both bridges and the statement in
   ONE Lean, by the orchestrator's replay. The three follow-ups of 2026-11-13 (`followUps`): theta continuous on [0, 1]
   for d >= 2, PROVED on the lab's library; Kozma-Nitzan's Conjecture 3 as printed against the lab's Lean statement and
   Conjecture 1 as printed against a third party's Lean proof, each by transport, with its red controls and its blind
   control (rules sealed as seals 26, 27 and 30; results as 28, 29 and 31). `--check` compares.     MIT */
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

/* ---- the three follow-ups of 2026-11-13 (rules sealed as seals 26, 27 and 30; results as 28, 29 and 31). Every fact
   below is read from the orchestrator's replays under results/cont, results/kn3 and results/kn1; the verdict words are
   read out of the three VERDICT.md files and refused if a record does not carry them. ---- */
const exf = (rel) => Number(rd(rel).trim());
const within = (rel, names) => {
  const t = rd(rel).replace(/\n\s+/g, ' ');
  for (const n of names) {
    const mm = new RegExp("'" + n.replace(/[.]/g, '\\.') + "' depends on axioms: \\[([^\\]]*)\\]").exec(t);
    if (!mm || mm[1].split(',').map((s) => s.trim()).some((ax) => !['propext', 'Classical.choice', 'Quot.sound'].includes(ax))) die(rel + ': ' + n + ' is not within the three standard axioms');
  }
  if (/sorryAx/.test(t)) die(rel + ' mentions sorryAx');
  return names.length;
};
const walksOf = (rel, word) => {
  const out = []; let cur = null;
  for (const l of rd(rel).split('\n')) {
    const mm = new RegExp('(?:^|\\s)' + word + ' (\\S+): (\\d+) constants reached').exec(l);
    if (mm) cur = { name: mm[1], constants: Number(mm[2]) };
    const v = /^\s*verdict: (CLEAN|FLAGGED)\s*$/.exec(l);
    if (v && cur) { out.push(Object.assign(cur, { verdict: v[1] })); cur = null; }
  }
  return out;
};
const MISMATCH = (name) => 'Challenge and solution theorem statement do not match: \'' + name + '\'';
const word = (rel, re, what) => (re.exec(rd(rel)) || die(rel + ' does not carry ' + what))[1];
const printedIn = (rel, sentence) => rd(rel).replace(/\n>? ?/g, ' ').replace(/\s+/g, ' ').includes(sentence) ? sentence : die(rel + ' does not quote the printed sentence this record states');
const sealedIn = (prereg, rel) => rd(prereg).includes(sha(rel)) || die(rel + ' is not the file whose sha256 ' + prereg + ' seals');

/* (1) continuity of θ on [0, 1], d ≥ 2: PROVED in our encoding, on the lab's library */
const cV = 'results/cont/VERDICT.md', cr = 'results/cont/replay/';
sealedIn('PREREG-CONT.md', 'perc/cont/Continuity.lean');
if (/^### A\d/m.test(rd('PREREG-CONT.md'))) die('PREREG-CONT.md has an amendment this record does not state');
for (const s of ['inputs', 'sealed', 'copy', 'build', 'axioms', 'imports', 'tokens', 'fresh', 'challenge-build', 'comparator', 'planted-challenge-build']) if (exf(cr + 'runs/' + s + '.exit') !== 0) die('continuity: ' + s + ' did not exit 0');
const cBuild = rd(cr + 'runs/build.log');
if (!/Build completed successfully/.test(cBuild) || /^(error|warning)/m.test(cBuild) || /sorry/.test(cBuild)) die('continuity: the build is not a clean success');
if (sha(cr + 'percolation/Textbook.lean') !== TEXTBOOK || sha(cr + 'percolation/Bridge.lean') !== sha('perc/bridgeA/Bridge.lean')) die('continuity: the statement or bridge A in the replay is not the sealed file');
if (rd(cr + 'percolation/ContStatement.lean') !== 'import Textbook\n' + rd('perc/cont/Continuity.lean')) die('continuity: the statement in the replay is not `import Textbook` plus the sealed bytes');
if (sha(cr + 'percolation/ContProof.lean') !== sha('perc/cont/proof/ContProof.lean')) die('continuity: the replayed proof is not the author\'s file');
const C_TEXT = '∀ d : ℕ, 2 ≤ d → Continuous (θ d)';
if (!rd('perc/cont/Continuity.lean').includes('def ContinuityStatement : Prop :=\n  ' + C_TEXT + '\n')) die('continuity: the sealed statement is not the text this record states');
const C_THMS = ['theta_continuous', 'theta_right_continuous', 'theta_left_continuous_above_pc', 'theta_continuous_iff_critical'];
const C_PLANTED = ['TextbookPercolation.not_planted_dimOne', 'TextbookPercolation.not_planted_constant'];
const C_LAB = ['Percolation.Literature.Grimmett1999_numInfiniteClusters_le_one_holds', 'Percolation.Literature.Grimmett1999_prob_exists_percolatesAt_holds'];
axiomsOK(cr + 'runs/axioms.log', C_THMS.concat(C_PLANTED, C_LAB));
accepts(cr + 'runs/comparator.log');
if (exf(cr + 'runs/planted-comparator.exit') === 0 || !rd(cr + 'runs/planted-comparator.log').includes(MISMATCH('theta_continuous'))) die('continuity: Comparator accepted the planted challenge');
const cRed = rd(cr + 'runs/red/summary.txt').split('\n').filter(Boolean).map((l) => /^(\S+) exit=(\d+) /.exec(l) || die('continuity: a red line is unreadable'));
const cRefused = cRed.filter((x) => x[1] !== 'Red0_true');
if (cRefused.length !== 4 || cRefused.some((x) => x[2] !== '1') || !cRed.some((x) => x[1] === 'Red0_true' && x[2] === '0')) die('continuity: the proof pointed at a planted statement was not refused four times, or the positive control failed');
if (rd(cr + 'runs/tokens.log').trim() !== '') die('continuity: the forbidden-token grep is not empty');
if (!/in two compile attempts/.test(rd(cV)) || !/Not "first": the prior-art search was partial/.test(rd(cV))) die('continuity: the verdict no longer says how the proof was made, or that it is not a first');
if (!/the scout's code search of openai\/math ran out; Mathlib, Isabelle AFP,\s+Coq, formal-conjectures and the lab's own README were read, and none has it/.test(rd(cV)) || !/which the lab's own listing does not cover/.test(rd(cV))) die('continuity: the verdict no longer says what was read for prior art, or that the lab\'s listing does not cover its uniqueness theorem');
const CONT = {
  verdict: word(cV, /^## The word: (PROVED)$/m, 'the word PROVED'),
  says: 'θ is continuous on [0, 1] for every d ≥ 2, in Lean, on top of Anthropic’s library',
  statement: { file: 'perc/cont/Continuity.lean', sha256: sha('perc/cont/Continuity.lean'), lines: lines('perc/cont/Continuity.lean'), text: C_TEXT, encoding: 'the definitions of perc/Textbook.lean, unchanged' },
  theorems: [
    { name: 'theta_continuous', says: 'θ_d is continuous on [0, 1], every d ≥ 2' },
    { name: 'theta_right_continuous', says: 'θ_d is right-continuous, every d' },
    { name: 'theta_left_continuous_above_pc', says: 'θ_d is left-continuous above p_c, every d (van den Berg–Keane)' },
    { name: 'theta_continuous_iff_critical', says: 'θ_d continuous ⇔ θ_d(p_c) = 0, every d ≥ 1' }],
  proof: { file: 'perc/cont/proof/ContProof.lean', sha256: sha('perc/cont/proof/ContProof.lean'), lines: lines('perc/cont/proof/ContProof.lean'), helperLines: lines('perc/cont/proof/UnitAux.lean'), compileAttempts: 2 },
  on: { commit: '795efb86f191735c5481675763537cfb4ff37e55', toolchain: 'v4.32.0', mathlib: '81a5d257' },
  buildSeconds: exf(cr + 'runs/build.seconds'), axiomsStandard: C_THMS.length + C_PLANTED.length, labTheoremsAlsoOnStandardAxioms: C_LAB.length, labOwnListingCoversThem: false,
  freshSeconds: exf(cr + 'runs/fresh.seconds'), comparatorSeconds: exf(cr + 'runs/comparator.seconds'), comparator: 'accepts (Lean, nanoda), our statement as the challenge',
  planted: { provedFalse: ['the same statement from d ≥ 1', 'θ constant'], scriptRefusals: cRefused.length, comparatorRefused: true },
  ingredients: { whose: 'Anthropic’s', list: ['uniqueness of the infinite cluster, every d and p', 'the zero–one law', 'the uniform-label coupling and monotonicity', 'θ as a limit of finite-box probabilities, continuous in p', 'θ(p_c) = 0'] },
  mathematics: 'the step from θ(p_c) = 0 to continuity is classical (Grimmett, Percolation, §8.3; van den Berg and Keane 1984); θ(p_c) = 0 is the lab’s theorem',
  labListsItAsNotClaimed: /lists "continuity of θ as a function on\s+\[0, 1\] as a formal statement" as NOT CLAIMED/.test(rd('PREREG-CONT.md')) || die('PREREG-CONT.md no longer says the lab does not claim continuity'),
  claimsFirst: false, priorArtSearch: 'partial', priorArt: { read: ['Mathlib', 'Isabelle AFP', 'Coq', 'formal-conjectures', 'Anthropic’s own README'], found: 0, unfinished: 'a code search of openai/math' },
  amendments: 0
};

/* (2) Kozma–Nitzan's Conjecture 3 as printed, against the lab's Lean statement */
const kV = 'results/kn3/VERDICT.md', kr = 'results/kn3/replay/';
sealedIn('PREREG-KN3.md', 'perc/kn3/Printed.lean');
if (sha(kr + 'percolation/Printed.lean') !== sha('perc/kn3/Printed.lean')) die('Conjecture 3: the statement in the replay is not the sealed file');
for (const s of ['build', 'cache', 'tools']) if (exf('results/kn3/k1/' + s + '.exit') !== 0) die('Conjecture 3: K1 ' + s + ' did not exit 0');
if (!rd('results/kn3/k1.out').includes('formal-math-795efb86.tar.gz: OK')) die('Conjecture 3: K1 did not check the pinned tarball');
for (const s of ['inputs', 'sealed', 'tools', 'copy', 'setup', 'build', 'axioms', 'walk', 'tokens', 'imports', 'fresh', 'challenge-build', 'comparator', 'kr4-challenge-build', 'red']) if (exf(kr + 'runs/' + s + '.exit') !== 0) die('Conjecture 3: ' + s + ' did not exit 0');
const K_READ = [
  { id: 'R0', name: 'Conjecture3', what: 'every finite graph, a probability on each edge (the primary)', there: 'lab_to_R0', back: 'R0_to_lab' },
  { id: 'RB', name: 'Conjecture3_readingB', what: 'every countable graph (“any graph G” taken literally)', there: 'lab_to_RB', back: 'RB_to_lab', note: 'one direction is an exhaustion over finite subgraphs: more than a re-encoding' },
  { id: 'N2', name: 'Neighbour2_constantProbability', what: 'finite graphs, one common p', there: 'lab_to_N2', back: null, note: 'the converse was not attempted' },
  { id: 'N3', name: 'Neighbour3_properSubset', what: 'A a proper subset', there: 'lab_to_N3', back: 'N3_to_lab' },
  { id: 'N4', name: 'Neighbour4_nonemptyA', what: 'A nonempty', there: 'lab_to_N4', back: 'N4_to_lab' }];
const K_CMP = ['lab_iff_nearOneGluing', 'lab_iff_labForm'].concat(...K_READ.map((r) => [r.there, r.back].filter(Boolean))).map((n) => 'KN3Compare.' + n);
const K_PROVED = ['conjecture3_as_printed', 'conjecture3_readingB_as_printed'];
axiomsOK(kr + 'runs/axioms.log', K_PROVED.concat(K_CMP));
const kAx = [...rd(kr + 'runs/axioms.log').matchAll(/^'([^']+)' depends on axioms/gm)].map((x) => x[1]);
if (kAx.length !== K_PROVED.length + K_CMP.length) die('Conjecture 3: the axiom listing names ' + kAx.length + ' theorems, not ' + (K_PROVED.length + K_CMP.length));
const kW = walksOf(kr + 'runs/walk.log', 'depwalk');
const kClean = kW.filter((w) => w.verdict === 'CLEAN'), kFlag = kW.filter((w) => w.verdict === 'FLAGGED');
if (JSON.stringify(kClean.map((w) => w.name).sort()) !== JSON.stringify([...K_CMP].sort())) die('Conjecture 3: the clean walks are not exactly the comparison theorems');
const kCheats = kFlag.filter((w) => w.name.startsWith('KN3Cheat.'));
if (kCheats.length !== 3 || kFlag.length !== 4 || !kFlag.some((w) => w.name === 'conjecture3_as_printed')) die('Conjecture 3: the flagged walks are not the three cheats and the K3 theorem');
if (/N2_to_lab/.test(rd(kr + 'runs/axioms.log')) || !/\| N2 one common p \| PROVED \| NOT PROVED \(not attempted/.test(rd(kV))) die('Conjecture 3: the one-common-p converse is no longer NOT PROVED (not attempted)');
accepts(kr + 'runs/comparator.log');
if (exf(kr + 'runs/kr4-comparator.exit') === 0 || !rd(kr + 'runs/kr4-comparator.log').includes(MISMATCH('conjecture3_as_printed'))) die('Conjecture 3: Comparator accepted the planted challenge');
const kRed = rd(kr + 'red/summary.txt');
const kr1b = (kRed.match(/^KR1b plant \d: REFUSED \(exit 1,/gm) || []).length, kr1a = (kRed.match(/^KR1a plant \d: REFUSED \(exit 1,/gm) || []).length;
if (kr1b !== 3 || kr1a !== 3 || ['KR1a-R3', 'KR1a-R4', 'KR1a-R5', 'KR1b-R3', 'KR1b-R4', 'KR1b-R5', 'KR2-WalkRed'].some((r) => exf(kr + 'red/' + r + '.exit') === 0)) die('Conjecture 3: a planted statement was not refused');
if (!/^KR1a plant 3: .*KN3\/Frag\.lean/m.test(kRed) || !kRed.includes('ALL RED CONTROLS REFUSED, FILES RESTORED')) die('Conjecture 3: the red run is not the one on record');
if (rd(kr + 'red/sha256-before.txt') !== rd(kr + 'red/sha256-after.txt')) die('Conjecture 3: the files after the red run are not the ones before it');
const kr3Other = rd(kr + 'red/KR3-other-files.txt').split('\n').filter(Boolean).length;
if (rd(kr + 'red/KR3-proof-files.txt').trim() !== '' || rd(kr + 'red/KR3-unclassified.txt').trim() !== '') die('Conjecture 3: a proof file holds a forbidden token, or a match is unclassified');
const kAmend = (rd('PREREG-KN3.md').match(/^### A\d/gm) || []).length;
/* the three planted variants of Conjecture 3 proved false, and A nonempty proved immaterial: read where the sealed fragment was rebuilt, in the Conjecture 1 replay */
const K_FALSE = ['KN3Planted.planted3_false', 'KN3Planted.planted4_false', 'KN3Planted.planted5_false'];
axiomsOK('results/kn1/replay/runs/axioms.log', K_FALSE.concat(['KN3Planted.conjecture3_iff_neighbour4']));
const KN3 = {
  verdict: word(kV, /\*\*(CERTIFIED, as printed under reading R0)\*\* \(and under RB, N3, N4\)/, 'its word'),
  proved: word(kV, /\*\*K3: (PROVED)\*\*/, 'K3: PROVED'),
  source: { paper: 'G. Kozma and S. Nitzan, arXiv:2401.12397v1', where: '§4, p. 15', url: 'https://arxiv.org/abs/2401.12397' },
  claim: 'Anthropic’s README calls its Lean statement the conjecture “verbatim”',
  printed: printedIn('perc/kn3/Printed.lean', 'For every ε > 0 there exists δ > 0 such that for any graph G, any A ⊂ G, and any 0, b ∈ G which satisfy P(0 ↔ A) > 1 − δ and P(a ↔ b) > 1 − δ for all a ∈ A, we have P(0 ↔ b) > 1 − ε.'),
  statement: { file: 'perc/kn3/Printed.lean', sha256: sha('perc/kn3/Printed.lean'), lines: lines('perc/kn3/Printed.lean'), reading: 'perc/kn3/READING.md', choices: 9, writtenFrom: 'the paper alone; no formalization opened',
    caveat: /One caveat, the author's own: the encoding style was taken from our `perc\/Textbook\.lean`,\s+which was written after reading the labs' θ\(p_c\) statement files \(not this conjecture\)/.test(rd('PREREG-KN3.md')) ? 'its encoding style follows perc/Textbook.lean, which was written after reading the labs’ θ(p_c) statement files (not this conjecture)' : die('PREREG-KN3.md no longer carries the statement author’s caveat'),
    sealedBefore: 'the lab’s statement of the conjecture was opened by the orchestrator or by the bridge’s author' },
  lab: { statement: 'Percolation.Literature.KozmaNitzan2024_conjecture3', theorem: 'kozmaNitzan_conjecture3_holds', k1BuildSeconds: exf('results/kn3/k1/build.seconds') },
  method: { file: 'perc/kn3/bridge/Transport.lean', lines: lines('perc/kn3/bridge/Transport.lean'), exhaustionLines: lines('perc/kn3/bridge/Exhaustion.lean'), what: 'a Mathlib-only mirror of the lab’s definitions, proved equivalent to our statement; in the lab’s environment the mirror is the lab’s statement by Iff.rfl' },
  readings: K_READ.map((r) => Object.assign({ id: r.id, what: r.what, labImpliesIt: 'PROVED', itImpliesLab: r.back ? 'PROVED' : 'NOT PROVED' }, r.note ? { note: r.note } : {})),
  walks: { clean: kClean.length, constantsMin: Math.min(...kClean.map((w) => w.constants)), constantsMax: Math.max(...kClean.map((w) => w.constants)), cheatsFlagged: kCheats.length, seconds: exf(kr + 'runs/walk.seconds') },
  buildSeconds: exf(kr + 'runs/build.seconds'), axiomsStandard: kAx.length, freshSeconds: exf(kr + 'runs/fresh.seconds'), comparatorSeconds: exf(kr + 'runs/comparator.seconds'),
  red: { plantedProvedFalse: K_FALSE.length, scriptRefusals: kr1b, scriptRefusalsAddedAfterSeal: true, letterRefusals: kr1a, letterRefusalsReachBridge: false, cheatsFlagged: kCheats.length, comparatorRefused: true, tokenLinesInProofFiles: 0, tokenLinesElsewhere: kr3Other, tokenRuleMetToTheLetter: false },
  amendments: kAmend,
  encoding: ['there is no graph, only a weight in [0, 1] on every unordered pair of Fin n, weight 0 meaning “no edge”', 'the diagonal pairs carry weights too, which change nothing', 'A is a finite set (Finset), and may be empty'],
  blind: { verdict: word(kV, /\*\*(FOUND BLIND)\.\*\*/, 'the blind control’s word'), closedTo: 'the orchestrator, the statement’s author and the bridge’s author, until the results were sealed', scoutThatFoundItSetAside: true, point: 'the Lean statement allows A = ∅, where the third party’s restatement takes A nonempty', whose: 'Ahmed Bou-Rabee’s manuscript (nitromannitol/percolation-after-anthropic)', ours: 'choice A4 of the reading sheet and the sealed neighbour N4, decided immaterial by proof', caution: 'under the primary reading the point is not a divergence: the printed sentence does not exclude A = ∅' }
};
if (kAmend !== 2) die('PREREG-KN3.md does not have the two amendments this record states');
if (!/Neither the orchestrator, nor the statement's author, nor the bridge's author has read that passage/.test(rd('PREREG-KN3.md')) || !/The scout that found it\s+is not used again in this lane/.test(rd('PREREG-KN3.md')) || !/opened 2026-11-13 ~03:57Z, AFTER the results above were sealed/.test(rd(kV))) die('Conjecture 3: the records no longer say to whom the blind passage was closed, and until when');

/* (3) Kozma–Nitzan's Conjecture 1 as printed, against a third party's Lean proof */
const nV = 'results/kn1/VERDICT.md', nr = 'results/kn1/replay/', n0 = 'results/kn1/k0-replay/out/';
const nPre = rd('PREREG-KN1.md');
const TP = { commit: (/at commit\s+([0-9a-f]{40})/.exec(nPre) || die('PREREG-KN1.md: no commit'))[1], tarball: (/tarball sha256\s+([0-9a-f]{64})/.exec(nPre) || die('PREREG-KN1.md: no tarball hash'))[1] };
for (const f of ['perc/kn1/Printed1.lean', 'perc/kn1/Planted1.lean', 'perc/kn1/READING1.md', 'perc/kn1/OBLIGATIONS1.md']) sealedIn('PREREG-KN1.md', f);
if (sha(nr + 'tree/Printed1.lean') !== sha('perc/kn1/Printed1.lean') || sha(nr + 'tree/Planted1.lean') !== sha('perc/kn1/Planted1.lean') || sha(nr + 'tree/Printed.lean') !== sha('perc/kn3/Printed.lean')) die('Conjecture 1: a statement file in the replay is not the sealed file');
/* K0: our own files, before the third party's bytes reached the machine */
const defs = rd(n0 + 'definitions.tsv').split('\n').slice(1).filter(Boolean).map((l) => l.split('\t'));
if (defs.some((d) => d[4] !== 'ELABORATES' || d[5] !== '0')) die('Conjecture 1: a sealed definition did not elaborate');
const k0v = /Axioms\.lean: (\d+) #print commands, (\d+) printed, (\d+) outside \[propext, Classical\.choice, Quot\.sound\]/.exec(rd(n0 + 'axioms-verdict.txt')) || die('Conjecture 1: the K0 axiom verdict is unreadable');
const k0thm = rd(n0 + 'theorems-ours.txt').split('\n').filter(Boolean);
if (k0v[1] !== k0v[2] || k0v[3] !== '0' || Number(k0v[1]) !== k0thm.length || rd(n0 + 'theorems-printed.txt') !== rd(n0 + 'theorems-ours.txt')) die('Conjecture 1: a K0 theorem is unprinted or outside the three axioms');
const k0false = k0thm.filter((t) => /^KN1K0\.planted\d+_false$/.test(t)).length;
const K0_REQ = ['conjecture1_iff_existsForm', 'conjecture1_iff_lowerBound', 'onFin_of_conjecture1', 'existsForm_iff_sealedNeighbour1', 'planted12_true'];
const K0_OPT = ['minimiser', 'emptyMinIs', 'distinct', 'properSubset', 'isLeast', 'sInf', 'iInf', 'ennreal'].map((s) => 'conjecture1_iff_' + s);
for (const t of K0_REQ.concat(K0_OPT)) if (!k0thm.includes('KN1K0.' + t)) die('Conjecture 1: K0 lacks ' + t);
if (rd(n0 + 'sealed.check').split('\n').filter(Boolean).some((l) => !/: OK$/.test(l)) || !rd(n0 + 'paste.check').startsWith('PASTE BYTE-EXACT') || rd(n0 + 'grep-proof-files.txt').trim() !== '') die('Conjecture 1: the K0 replay did not run on the sealed bytes, or a proof file holds a forbidden token');
if (k0thm.includes('KN1K0.conjecture1_of_onFin') || !/NOT proved: RF → R0 \(not attempted\)/.test(rd(nV))) die('Conjecture 1: RF → R0 is no longer “not attempted”');
/* the author's own K0 run, the one made with no byte of the third party on the machine, says the same */
const a0 = 'results/kn1/k0/run-final/';
if (rd(a0 + 'definitions.tsv') !== rd(n0 + 'definitions.tsv') || rd(a0 + 'theorems-ours.txt') !== rd(n0 + 'theorems-ours.txt') || rd(a0 + 'axioms-verdict.txt') !== rd(n0 + 'axioms-verdict.txt')) die('Conjecture 1: the author\'s K0 run and its replay do not agree');
if (!/K0 ran 13:23–13:57Z; the third party's tarball reached the pod at 13:58Z/.test(rd(nV))) die('Conjecture 1: the verdict no longer says K0 ran before the third party\'s bytes arrived');
/* K1: the third party's environment */
for (const s of ['fetch', 'cache', 'build', 'axioms']) if (exf('results/kn1/bridge/env/' + s + '.exit') !== 0) die('Conjecture 1: K1 ' + s + ' did not exit 0');
const N_THEIRS = ['KNAll.conjecture1_holds', 'KN1Statement.multiplicativeGluing_holds', 'KN1Corollary.kozmaNitzan_conjecture1'];
axiomsOK('results/kn1/bridge/env/axioms.log', N_THEIRS);
if (!rd('results/kn1/bridge/env/k1third.out').includes(TP.commit + '.tar.gz: OK')) die('Conjecture 1: K1 did not check the pinned tarball');
/* K2, K3 and the red controls: the orchestrator's replay */
for (const s of ['inputs', 'tools', 'copy', 'setup', 'build', 'axioms', 'walk', 'tokens', 'imports', 'k3', 'red']) if (exf(nr + 'runs/' + s + '.exit') !== 0) die('Conjecture 1: ' + s + ' did not exit 0');
const N_IMPL = ['T1_to_R0', 'R0_to_T1', 'T2_to_R0', 'R0_to_T2', 'T3_to_R0', 'R0_to_T3'].map((n) => 'KN1Compare.' + n);
const nBridge = [...rd(nr + 'runs/axioms.log').matchAll(/KN1\/Bridge\/Axioms\.lean:\d+:\d+: '([^']+)' depends on axioms/g)].map((x) => x[1]);
within(nr + 'runs/axioms.log', nBridge);
axiomsOK(nr + 'runs/axioms.log', ['conjecture1_as_printed'].concat(N_IMPL));
const nW = walksOf(nr + 'runs/walk.log', 'kn1walk');
const nOurs = nW.filter((w) => /^(KN1Compare|KN1Targets)\./.test(w.name)), nLib = nW.filter((w) => /prodBernoulli\._proof_1$/.test(w.name));
if (nOurs.length !== 15 || nOurs.some((w) => w.verdict !== 'CLEAN') || nLib.some((w) => w.verdict !== 'CLEAN') || N_IMPL.some((n) => !nOurs.some((w) => w.name === n))) die('Conjecture 1: a comparison walk is not CLEAN');
const nCheats = nW.filter((w) => w.name.startsWith('KN1Cheat.'));
if (nCheats.length !== 5 || nCheats.some((w) => w.verdict !== 'FLAGGED') || !nW.some((w) => w.name === 'conjecture1_as_printed' && w.verdict === 'FLAGGED') || nW.length !== nOurs.length + nLib.length + nCheats.length + 1) die('Conjecture 1: the flagged walks are not the five cheats and the K3 theorem');
const nForb = /forbidden names: (\d+), of which not in this environment: \[\]\n\s*forbidden statements: (\d+), of which not in this environment: \[\]/.exec(rd(nr + 'runs/walk.log')) || die('Conjecture 1: the forbidden list is unreadable');
for (const s of ['fresh', 'challenge-build', 'comparator']) if (exf(nr + 'k3/' + s + '.exit') !== 0) die('Conjecture 1: K3 ' + s + ' did not exit 0');
accepts(nr + 'k3/comparator.log');
const KR4 = ['kr4-1', 'kr4-3', 'kr4-4'];
for (const k of KR4) if (exf(nr + 'k3/' + k + '-comparator.exit') === 0 || !rd(nr + 'k3/' + k + '-comparator.log').includes(MISMATCH('conjecture1_as_printed'))) die('Conjecture 1: Comparator accepted the planted challenge ' + k);
const nRed = rd(nr + 'red/summary.txt');
const nKr1 = (nRed.match(/^KR1 Planted\d+_\w+: K2 scripts exit 1, .* K3 script exit 1, .* — REFUSED \(both fail to compile\)$/gm) || []).length;
const nKr2 = (nRed.match(/^KR2 KN1Cheat\.\S+: FLAGGED by the walk/gm) || []).length;
const nKr3 = /^KR3 proof files \((\d+) files\): 0 matching lines$/m.exec(nRed) || die('Conjecture 1: a proof file holds a forbidden token');
if (nKr1 !== k0false || nKr2 !== nCheats.length || (nRed.match(/^KR1 harness control .*compiles, exit 0/gm) || []).length !== 2 || !nRed.includes('ALL RED CONTROLS REFUSED AS THEY MUST') || !nRed.includes('working set unchanged by the red run')) die('Conjecture 1: the red run is not the one on record');
const nAmend = (nPre.match(/^### A\d/gm) || []).length;
if (nAmend !== 1) die('PREREG-KN1.md does not have the one amendment this record states');
if (!/The scout is not used again in this lane/.test(nPre) || !/the scout also saw declaration NAMES in the three KN1 files/.test(nPre)) die('PREREG-KN1.md no longer says what the scout saw');
const KN1 = {
  verdict: word(nV, /\*\*(CERTIFIED, as printed)\*\* \(T1, and apart, T2 and T3\)/, 'its word'),
  proved: word(nV, /\*\*K3: (PROVED)\*\*/, 'K3: PROVED'),
  source: { paper: 'G. Kozma and S. Nitzan, arXiv:2401.12397v1', where: 'p. 3', url: 'https://arxiv.org/abs/2401.12397' },
  printed: printedIn('perc/kn1/Printed1.lean', 'Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two vertices and let A ⊂ G be a set of vertices. Then P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}.'),
  thirdParty: { author: 'Ahmed Bou-Rabee', repository: 'https://github.com/nitromannitol/percolation-after-anthropic', commit: TP.commit, tarballSha256: TP.tarball, licence: 'Apache-2.0', toolchain: 'v4.32.0', dependsOn: 'anthropics/formal-math 795efb86', theorem: 'KNAll.conjecture1_holds',
    restatementSince: word(nV, /Mathlib-only restatement \(T2\) since (2026-09-05)/, 'the date of the third party’s restatement'), madeWith: word(nV, /the third party's Lean was produced with (Claude\s+and ChatGPT)/, 'how the third party’s Lean was made').replace(/\s+/g, ' '), k1BuildSeconds: exf('results/kn1/bridge/env/build.seconds') },
  statement: { file: 'perc/kn1/Printed1.lean', sha256: sha('perc/kn1/Printed1.lean'), lines: lines('perc/kn1/Printed1.lean'), reading: 'perc/kn1/READING1.md', choices: 18, writtenFrom: 'the paper alone, with no compiler; the third party’s files unread', sealedBefore: 'any statement of the third party was opened by the orchestrator, the statement’s author or the bridge’s author', scout: 'a scouting agent saw file and declaration names and one passage of the README, and was not used again',
    text: 'for every finite graph, every p on its edges, every set A of vertices, every o, b and every real m: if m is the least of the P(a ↔ b), a ∈ A, then P(o ↔ b) ≥ P(o ↔ A) · m' },
  k0: { authorRunAgrees: true, definitions: defs.length, elaborated: defs.filter((d) => d[4] === 'ELABORATES').length, repaired: 0, theorems: k0thm.length, readingsProvedEquivalent: 2 + K0_OPT.length, oneWayOnly: 'the form on Fin n: ours implies it; the converse was not attempted', plantedProvedFalse: k0false, plantedRequired: 3, planted12: 'PROVED TRUE', notProved: ['RF → R0 (not attempted)', 'the truth of planted variants 13 to 15 (they need Harris–FKG)'], thirdPartyBytesPresent: false },
  targets: [
    { id: 'T1', what: 'KNAll.Conjecture1, the type of KNAll.conjecture1_holds', toOurs: 'PROVED', fromOurs: 'PROVED', decidesTheWord: true },
    { id: 'T2', what: 'KN1Statement.MultiplicativeGluing, his own Mathlib-only statement', toOurs: 'PROVED', fromOurs: 'PROVED' },
    { id: 'T3', what: 'the type of KN1Corollary.kozmaNitzan_conjecture1', toOurs: 'PROVED', fromOurs: 'PROVED' }],
  oneSentence: true,
  method: { file: 'perc/kn1/bridge/Transport1.lean', lines: lines('perc/kn1/bridge/Transport1.lean'), what: 'a Mathlib-only mirror of his sentence, proved equivalent to our statement on top of the Conjecture 3 transport; in his environment three Iff.rfl say the mirror is each target' },
  walks: { clean: nOurs.length, cheatsFlagged: nCheats.length, forbiddenNames: Number(nForb[1]), forbiddenStatements: Number(nForb[2]), seconds: exf(nr + 'runs/walk.seconds'), libraryTheoremReached: 'prodBernoulli._proof_1 (an auxiliary proof inside the measure’s definition; its own walk is clean)' },
  buildSeconds: exf(nr + 'runs/build.seconds'), bridgeTheorems: nBridge.length, freshSeconds: exf(nr + 'k3/fresh.seconds'), comparatorSeconds: exf(nr + 'k3/comparator.seconds'),
  red: { plantedProvedFalse: k0false, scriptRefusals: nKr1, cheatsFlagged: nKr2, comparatorRefusals: KR4.length, proofFiles: Number(nKr3[1]), tokenLinesInProofFiles: 0 },
  amendments: nAmend,
  encoding: ['the vertices are Fin n', 'there is no graph, only a weight on every unordered pair, weight 0 meaning “no edge”', 'the diagonal pairs carry weights too, which change nothing', 'the measure lives on sets of pairs', 'A is a nonempty Finset, where the printed sentence says “a set of vertices”', 'the minimum is Finset.inf\', where the hand-written statement has a number m with two hypotheses'],
  nonempty: { printed: false, inHisRestatement: true, inHisLean: true, onHisNotLiteralList: false, ours: 'choice B8 of the reading sheet', immaterial: 'PROVED' },
  independence: 'by procedure only', claimsFirst: false,
  blind: { verdict: word(nV, /\*\*(NOTHING TO FIND)\*\*/, 'the blind control’s word'), why: 'his list of non-literal correspondences names no divergence for Conjecture 1, so the control could not test recall; recorded as that, not as a pass', notBlind: 'the comments in his Lean files name the encoding and the nonempty A, and the bridge’s author read them with the statements' },
  accidents: { sessionRestartedBeforeHandBack: true, authorSummaryUnfilledSections: 3, verdictRestsOn: 'the replay', idleMinutes: Number((/idle about (\d+) min/.exec(rd('pods-followups.txt')) || die('the idle minutes are missing'))[1]), uploadHungMinutes: Number((/hung once for (\d+) minutes/.exec(rd(nV)) || die('the hung upload is missing'))[1]) }
};
if (!/idle from about 14:41Z to 15:24Z/.test(rd(nV)) || !/was left with three unfilled sections/.test(rd(nV))) die('Conjecture 1: the accidents on record moved');
if (!/does not print\s+"nonempty"/.test(rd(nV)) || !/the documents do not list it among the\s+non-literal correspondences/.test(rd(nV)) || !/K0 PROVED it immaterial/.test(rd(nV))) die('Conjecture 1: the verdict no longer carries the three facts about the unprinted “nonempty”');
if (!/Not independence beyond procedure/.test(rd(nV)) || !/Not "first"/.test(rd(nV))) die('Conjecture 1: the verdict no longer says the independence is by procedure, or that it is not a first');

/* money and seals of the follow-ups. The six digests and their anchors are the public parts of the seals, copied into
   the corpus; each digest must also be a line of this repository's seals/registry.jsonl (the one file read outside the corpus). */
const fpod = rd('pods-followups.txt').split('\n').filter((l) => /^\S+ (awmetpkks84h6o|9e6yrzg3cxft6h) DELETED /.test(l));
const fusd = fpod.map((l) => Number((/(?:≈|about) US\$([0-9.]+) by the clock/.exec(l) || [0, NaN])[1]));
const fmin = fpod.map((l) => { const mm = /(?:≈|=) (\d+) h (\d+) min/.exec(l); return mm ? Number(mm[1]) * 60 + Number(mm[2]) : NaN; });
if (fpod.length !== 2 || fusd.concat(fmin).some((x) => Number.isNaN(x)) || fpod.some((l) => !/get-pod 404/.test(l))) die('expected the two deleted pods of the follow-ups, each with its cost and minutes');
const REGISTRY = fs.readFileSync(path.join(ROOT, 'seals', 'registry.jsonl'), 'utf8');
const SEALS = [[26, 'rules', 'Conjecture 3', kV], [27, 'rules', 'continuity', cV], [28, 'results', 'Conjecture 3', kV], [29, 'results', 'continuity', null], [30, 'rules', 'Conjecture 1', nV], [31, 'results', 'Conjecture 1', nV]].map(([n, holds, of, named]) => {
  const digest = rd('seals/' + n + '/digest.txt').trim(), an = JSON.parse(rd('seals/' + n + '/anchors.json'));
  if (!/^[0-9a-f]{64}$/.test(digest) || !REGISTRY.includes('"digest": "' + digest + '"')) die('seal ' + n + ': its digest is not in seals/registry.jsonl');
  if (an.length !== 1 || an[0].kind !== 'git' || an[0].path !== 'seals/registry.jsonl') die('seal ' + n + ': its anchor is not the registry');
  if (named && !new RegExp('seal ' + n + '[ ,(]+registry ' + an[0].commit.slice(0, 8)).test(rd(named))) die('seal ' + n + ': the verdict does not name its registry commit');
  return { n, holds, of, digest, registryCommit: an[0].commit };
});
const FU = {
  date: '2026-11-13',
  undecided: 'Three follow-ups on the same development. None is a first: a restatement of Conjecture 1 by the third party exists since 2026-09-05, and the search for an earlier formal proof of continuity was partial. The heavy ingredients of the continuity proof are Anthropic’s (uniqueness of the infinite cluster, the zero–one law, θ(p_c) = 0); the proofs of Conjectures 3 and 1 are Anthropic’s and Ahmed Bou-Rabee’s. “CERTIFIED, as printed” says the Lean sentence and our reading of the printed sentence are the same statement, by proof; it does not say the paper’s authors endorse either. On Conjecture 1 the independence is by procedure only.',
  continuity: CONT, conjecture3: KN3, conjecture1: KN1,
  money: { pods: fpod.length, usd: Math.round(fusd.reduce((x, y) => x + y, 0) * 100) / 100, minutes: fmin.reduce((x, y) => x + y, 0), read: 'by the clock, not a billing read' },
  seals: SEALS
};

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
  provenance: { files: PROV.files.length, sourceCommit: PROV.source_commit, followUpsCommit: PROV.followups.source_commit, followUpsFiles: PROV.followups.files },
  note: (() => { const n = JSON.parse(rd('note.json')); if (n.published && !/^10\.5281\/zenodo\.\d+$/.test(n.doi)) die('note.json: a published note needs a Zenodo DOI'); return { doi: n.doi, published: !!n.published, version: n.version, holdsFollowUps: !!n.followUps }; })(),
  followUps: FU,
  verdicts: { bridgeA: 'CERTIFIED', bridgeO: 'CERTIFIED', replayA: 'REPLAYED', anchors: 'CERTIFIED', seam: 'READ, NOT DECIDED', oneLean: 'CERTIFIED', dimOne: 'CERTIFIED',
    continuity: CONT.verdict, conjecture3: KN3.verdict, conjecture3Proved: KN3.proved, conjecture3Blind: KN3.blind.verdict, conjecture1: KN1.verdict, conjecture1Proved: KN1.proved, conjecture1Blind: KN1.blind.verdict }
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
