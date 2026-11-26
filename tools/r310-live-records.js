#!/usr/bin/env node
/* r310-live-records.js — the records of /r310/ (corpus/r310-live/), each written from the lane's own files.

   The page /r310/ is the live page of the R(3,10) lane: the case map, the boxes (three, all opened), the
   corrections ledger, the machine at work and the replay of one recorded run. Its builder (tools/build-r310-live.js)
   reads only corpus/r310-live/. This file writes those records from the sources and refuses when a source no longer
   says what a record states: every curated sentence carries a needle that must occur in its source (whitespace,
   bold and code marks ignored), and every count is recomputed from the file it comes from.

   The sources live in the lane's working folder (notes/ramsey-r310-scout-2026-11-21/, never committed). So the
   records can be regenerated only where that folder is; a reader of the public repository has the records, the
   builder and this file.

   THE SEAL, OPENED (2026-11-25). Until the night of 25 November 2026 one case (Case R(6)) was worked on under seal:
   its record held its name, its Bitcoin anchors and a progress percentage, and its corrections were one line each,
   cited by the hash of a line of the control room's notes. On the operator's word that night ("Everything, seal
   opened", a dialog answer with the options spelled out) the lane's privacy ended: box 3 is written here in full from
   its files, its corrections carry their sources and their words, and its anchors are kept as they were shown.

   THE WHOLE PROCESS (also from 2026-11-25): process.json holds every round, line and gate of the attack on 40 (the
   gate rows themselves live in tools/r310-live-gates.js, each with its needles), the running sessions read from their
   own run files, and the earlier rounds of the control room's log; paths.json is the path ledger (round5/PATHS.md)
   parsed row by row; fieldmap.json is the explanatory content of the lane's private field map, rebuilt from its
   source with a needle per sentence and number. The cited files are copied into corpus/r310-live/sources/ after a
   redaction pass (sources/MANIFEST.json says what was withheld and why; third-party texts and big data are named
   with their sha256 instead).

   usage: node tools/r310-live-records.js            write cases, boxes, corrections, machine, replay, process,
                                                      paths, fieldmap, and the sources folder
          node tools/r310-live-records.js --check    recompute them and refuse on any difference with corpus/r310-live/
          node tools/r310-live-records.js --log "what changed"   append a dated entry to page-log.json with the state
                                                                                                                  MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const LANE = path.join(ROOT, 'notes', 'ramsey-r310-scout-2026-11-21');
const OUT = path.join(ROOT, 'corpus', 'r310-live');
const die = (m) => { console.error('R310-LIVE RECORDS REFUSED: ' + m); process.exit(1); };
const need = (ok, m) => { if (!ok) die(m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const read = (rel) => { const p = path.join(LANE, rel); if (!fs.existsSync(p)) die('a source is gone: ' + rel); return fs.readFileSync(p, 'utf8'); };
const norm = (s) => String(s).replace(/\n[ \t]*>[ ]?/g, '\n').replace(/\*\*/g, '').replace(/`/g, '').replace(/\u00a0/g, ' ').replace(/\ufb02/g, 'fl').replace(/\ufb01/g, 'fi').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\s+/g, ' ');
const has = (text, needle) => norm(text).includes(norm(needle));
/* a source and the phrase that must stand in it; the source's sha256 goes into the record (one click down on the page) */
const SRC = new Map();
function cite(rel, needle) {
  const t = read(rel);
  need(has(t, needle), rel + ' no longer says: ' + needle);
  if (!SRC.has(rel)) SRC.set(rel, sha(fs.readFileSync(path.join(LANE, rel))).slice(0, 12));
  return rel;
}
const LOG = 'control-room-2026-11-22.md';
const PRIOR = 'prior-art-2026-11-21.md';
const CHEN2 = 'audit/chen-23678020/chen-v2.txt';
const RALPH = 'audit/chen-ralph-2026-11-23/repo/ralph/FINAL_REPORT.md';
const CLAIMS = 'audit/chen-ralph-2026-11-23/repo/ralph/CLAIMS.md';
const P1 = 'cert-machine-r1/P1-RESULT.md';
const PROD = 'claude-r7/PROD-RESULT.md';
const REVEAL = 'reveal-draft/REVEAL-DRAFT.md';
const CHENAUD = 'control-room-checks/CHEN-RALPH-READING-AUDIT.md';
const C35REV = 'control-room-checks/C35-REVIEW-CHECK.md';   /* the control room's check of an outside reading of C35 (06:22 UTC 23 Nov) */
const README = 'corpus/r310-c35-r7/README.md';   /* the published record's README (in the repository, not the lane) */
/* a phrase that must stand in a file of the repository itself, not of the lane */
function citeRepo(rel, needle) {
  const p = path.join(ROOT, rel);
  need(fs.existsSync(p), 'a repository file is gone: ' + rel);
  need(has(fs.readFileSync(p, 'utf8'), needle), rel + ' no longer says: ' + needle);
  return rel;
}
const REVEAL2 = 'reveal-draft/REVEAL-v2-2026-11-23.md';   /* the reveal's source of truth (written 04:25–05:15 UTC 23 Nov) */
const RECHECK = 'reveal-draft/PRIOR-ART-RECHECK-2026-11-23.md';
const GR13 = 'audit/gr2013/gr2013.txt';   /* Goedgebeur–Radziszowski 2013, as read (arXiv 1210.5826) */
/* box 3, opened 2026-11-25: the reveal package of 24 Nov (its source of truth) and the run's own files */
const R6 = 'reveal-draft/r6-2026-11-24/REVEAL-R6.md';
const R6SPEC = 'reveal-draft/r6-2026-11-24/PAGE-SPEC-R6.md';
const R6FIN = 'control-room-checks/r6-full/pod-final-resumed/';
const R6PRE = 'control-room-checks/r6-full/R6-FULL-PREREG.md';
const JOINW = 'control-room-checks/emit-join-final/WORKLOG.md';
const HALLD = 'control-room-checks/HALL-DISAGREEMENT-2026-11-23.md';
/* the attack on 40 (rounds 1–5, 23–25 Nov) and the field map */
const LEDG = 'round1/LEDGER.md';
const PATHSF = 'round5/PATHS.md';
const FMAP = 'round5/dashboard/r310-field-map.html';
const GATES = require(path.join(__dirname, 'r310-live-gates.js'));

/* ------------------------------------------------------------------ the case map */
function cases() {
  const lit = (who, what, where, when, refereed, rel, needle) => ({ who, what, where, when, refereed, kind: 'literature', src: cite(rel, needle) });
  const chenReport = (what, needle) => ({ who: 'Zhiyang Chen', what, where: 'progress report, version 2 (Zenodo 10.5281/zenodo.23678020)', when: '2026-10-26', refereed: false, kind: 'chen-report', src: cite(CHEN2, needle) });
  const chenRun = (what, rel, needle) => ({ who: 'Zhiyang Chen’s AI run r310_ralph', what, where: 'github.com/jeffchen006/Ramsey-R3-10', when: '2026-11-21 to 2026-11-22', refereed: false, kind: 'chen-run', src: cite(rel, needle) });
  const late = (c) => Object.assign(c, { when: '2026-11-24 to 2026-11-25', where: 'the process below' });
  const ours = (what, rel, needle, box) => ({ who: 'this lane', what, where: box ? 'box ' + box + ' below' : 'this page', when: '2026-11-21 to 2026-11-23', refereed: false, kind: 'ours', box: box || null, src: cite(rel, needle) });
  cite(CHEN2, 'Version 2, 26 October 2026');
  const N = [
    { id: 'root', parent: null, label: 'A (3,10;40)-graph', sub: '40 vertices, no triangle, no 10 pairwise non-adjacent', state: 'open',
      note: 'If no such graph exists, R(3,10) = 40; if one does, R(3,10) = 41. Nothing on this page decides which.',
      credits: [
        lit('Geoffrey Exoo', 'R(3,10) ≥ 40: a 39-vertex graph with no triangle and no independent 10-set', 'SIAM J. Discrete Math. 2(4) 488–490', '1989', true, PRIOR, 'Exoo, SIAM J. Discrete Math. 2(4) (1989) 488–490'),
        lit('Jan Goedgebeur and Stanisław Radziszowski', 'R(3,10) ≤ 42; Δ = 9 and 161 ≤ e ≤ 180 for any such graph', 'Electron. J. Combin. 20(1) P30', '2013', true, PRIOR, 'Δ = 9 and 161 ≤ e ≤ 180 (GR Table 5)'),
        lit('Vigleik Angeltveit', 'R(3,10) ≤ 41', 'Electron. J. Combin. 32(4) P4.30', '2025-11-03', true, PRIOR, 'EJC 32(4) P4.30, published 3 Nov 2025'),
        chenRun('R(3,10) not decided, still 40 or 41; no (3,10;40)-graph found and no proof that none exists', RALPH, 'R(3,10) is not decided. It is still 40 or 41.')] },
    { id: 'deg4', parent: 'root', label: 'A vertex of degree 4 or less', sub: 'impossible', state: 'decided',
      note: 'Degree at least 4 follows from R(3,9) = 36. Degree exactly 4 was excluded four times before this lane, each without a referee.',
      credits: [
        lit('Daugherty, Ward and Ryan', 'no vertex of degree 4 (SAT proof; the earliest)', 'Zenodo 10.5281/zenodo.22945442', '2026-09-24', false, PRIOR, 'Daugherty–Ward–Ryan, Zenodo 10.5281/zenodo.22945442, 24 Sep 2026 (the earliest)'),
        lit('algal-lab', 'no vertex of degree 4 (its release link now answers 404)', 'github.com/hraness/algal-lab', '2026-09-28', false, PRIOR, 'hraness/algal-lab, 28 Sep 2026 (the release URL now returns 404)'),
        lit('Unsolved Lab', 'no vertex of degree 4 (method M09)', 'its R(3,10) page', '2026-10-01', false, PRIOR, 'Unsolved Lab M09, 1 Oct 2026'),
        chenReport('every degree is at least 4, from R(3,9) = 36; and degree 4 excluded', 'so 4 ≤ d ≤ 9 (R(3, 9) = 36 [D-R3])'),
        ours('again, as a corollary of Theorem C35, given Goedgebeur–Radziszowski’s uniqueness of the (3,9;35)-graph; known before', P1, 'Corollary (not pre-registered) | CERTIFIED given one named premise', 1)] },
    { id: 'c35', parent: 'root', label: 'Contains an induced C35(1,7,11,16)', sub: 'impossible at 40 vertices', state: 'decided', box: 1,
      note: 'Theorem C35: such a graph has at most 39 vertices, so no (3,10;40)-graph contains an induced C35(1,7,11,16). The question was posed in public at least three times before; nobody had decided it.',
      credits: [
        lit('Unsolved Lab', 'posed it: “Extension from C35”, an open question, not run (M20)', 'its R(3,10) page', '2026-10-01', false, PRIOR, 'M20, "Extension from C35"'),
        lit('andrey-kokoev/marici', 'posed it: the five new vertices must induce a 5-cycle; “this extension family has not been excluded”', 'a note in a public repository, dated 9 Nov, committed 16 Nov', '2026-11-09', false, RECHECK, 'No 40-vertex graph has been found, and this extension family has not been excluded.'),
        chenRun('posed it: an idea scout ran the C35 + 5 formula, “TIMEOUT at 13 min; no answer”', RECHECK, 'TIMEOUT at 13 min; no answer'),
        lit('Jan Goedgebeur and Stanisław Radziszowski', 'the (3,9;35)-graph is unique: the circulant C35(1,7,11,16)', 'Electron. J. Combin. 20(1) P30, Theorem 3', '2013', true, PRIOR, 'The 35-vertex graph is unique: GR Thm 3, the circulant {1,7,11,16}'),
        lit('J. G. Kalbfleisch', 'found the cyclic graph on 35 vertices with circular distances {1,7,11,16}, as Goedgebeur and Radziszowski credit it', 'Chromatic Graphs and Ramsey’s Theorem, Ph.D. thesis, University of Waterloo', '1966', 'a thesis', GR13, 'tices with circular distances {1,7,11,16}, found by Kalbfleisch [11] in 1966'),
        ours('Theorem C35, in Lean (box 1)', P1, 'Theorem C35 is proved in Lean with the standard axioms only', 1),
        Object.assign(ours('a corollary: in a triangle-free graph on 40 vertices with no independent set of size 10, deleting any 5 vertices leaves an independent set of size 9; so at least 6 deletions are needed to leave none', REVEAL2, 'deleting any 5 vertices leaves an independent set of size 9; so at least 6 deletions are needed to leave none.'),
          { label: 'prose proof, not in Lean, conditional on Goedgebeur–Radziszowski’s uniqueness of the (3,9;35)-graph' })] },
    { id: 'mtf', parent: 'root', label: 'Maximal triangle-free, degrees 6 to 9', sub: 'a reduction', state: 'decided',
      note: 'One may assume no edge can be added without a triangle; then every degree is 6, 7, 8 or 9. The cover below is the split that follows.',
      credits: [
        chenReport('without loss of generality maximal triangle-free; then degrees 6 to 9; 545 possible degree distributions', 'degrees 6..9 after the WLOG reduction to maximal triangle-free graphs'),
        lit('Pandey and Ravi', 'diameter 2 or 3; diameter 2 forces minimum degree 6', 'arXiv 2601.03572', '2026-01', false, PRIOR, 'Pandey–Ravi, arXiv 2601.03572 (Jan 2026): the diameter is 2 or 3')] },
    { id: 's8', parent: 'mtf', label: 'A degree-8 vertex v, e(G − N[v]) ≤ 96', sub: 'closed by gluing, an enumeration', state: 'decided',
      note: 'Closed by Chen’s exhaustive gluing runs (his Theorem 6.1: floors 97 at degree 8 and 88 at degree 9). They are enumerations with no checked proof, their runs are not published, and nobody has refereed them; the case rests on them.',
      credits: [chenReport('closed: no degree-8 vertex has e(G − N[v]) ≤ 96, by an enumeration with no checked proof (Theorem 6.1)', 'S8 is closed (Theorem 6.1).'),
        Object.assign(chenReport('the gluing runs’ evidence is not in the repository; the floors 97 (degree 8) and 88 (degree 9) rest on them', 'no degree-8 vertex has e(Gv ) ≤ 96 (all'), { src: cite('reveal-draft/CHEN-NOTE-DRAFT-v2-2026-11-23.md', 'are enumerations without certificates, and the final report says their evidence is not in the repository') })] },
    { id: 'near', parent: 'mtf', label: 'Near-regular distributions N(e), 162 ≤ e ≤ 179', sub: 'open', state: 'open',
      note: 'Degree distributions that are not 9-regular. The count of those still open fell during Chen’s run.',
      credits: [
        chenReport('524 distributions open', '524 with 162 ≤ e ≤ 179'),
        chenRun('238 still open at the end of the run (from 524)', RALPH, '| Near-regular MTF degree distributions N(e), 162 <= e <= 179 | 524 open | 238 open |'),
        lit('Robert McCrea', 'one slice closed: no degree-7 vertex with e(G − N[v]) = 104', 'Zenodo 10.5281/zenodo.23928054', '2026-11-03', false, PRIOR, 'McCrea, Zenodo 10.5281/zenodo.23928054 (3 Nov 2026): no degree-7 vertex with e(G−N[v]) = 104'),
        late(ours('283 of the 519 distributions left after five integer rays are excluded at published edge floors, every one by two programs; 236 survive', LEDG, '283 of 519 excluded, every one of the ten beyond G16\'s 273 now re-derived by a second program'))] },
    { id: 'caseR', parent: 'mtf', label: 'Case R: 9-regular', sub: 'split by the largest codegree', state: 'open',
      note: 'Every vertex has degree 9. Chen splits it by c*, the largest number of common neighbours of two non-adjacent vertices, 3 ≤ c* ≤ 7.',
      credits: [chenReport('the split by c* = 3, …, 7 (Lemma Mc)', '3 ≤ c∗ ≤ 7')] },
    { id: 'r7', parent: 'caseR', label: 'Case R(7): codegree seven', sub: 'closed by Chen’s run; computed again here', state: 'decided', box: 2,
      note: 'Excluded first by Chen’s own AI run. This lane’s run is a second computation of the case, with its own reduction and code, under premises listed in box 2.',
      credits: [
        chenReport('open: 365 of 464 cubes certified, 99 open', 'R(7) is not closed.'),
        chenRun('excluded first: claim C-004 over all 977,008 admissible package pairs, added in round 1 (21 Nov, 16:50:52 UTC) and confirmed in round 2 (17:49:01 UTC) as a certificate with a custom trace; a hand reduction, not Lean', CLAIMS, '| C-004 | C | No R(7) extension for any of the four 27/85 seeds over all 977,008 admissible package pairs, no cutoffs.'),
        ours('a second computation, with our own reduction and code (it uses Chen’s Lemma R7): LRAT proofs for all 977,008 configurations, two checkers, the encoding’s soundness in Lean, under six premises (box 2)', PROD, 'All 977,008 configurations ended CERTIFIED-UNSAT.', 2)] },
    { id: 'c6', parent: 'caseR', label: 'Case R(6): codegree six', sub: 'one branch computed; open', state: 'open', box: 3,
      note: 'Split by the number of cross-edges of a marked pair, three to nine (Chen’s Lemma F). The three-edge branch is computed here under six premises (box 3). Of the four-edge branch only a 20-core cost pilot ran; five to nine cross-edges were not run. The case is not closed.',
      credits: [
        chenReport('open', 'Sub-cases R(c∗ ), c∗ = 3..7'),
        chenRun('partial results; not closed; in its final commit, an idea-scout note on the three-edge branch with 16 pilot inputs and “no production certificate”', R6, 'There is no production certificate'),
        ours('the three-edge branch: all 23,409 cores excluded under six premises, with a second program for the counting only (box 3); the case is not closed', R6, 'It does not decide R(3,10), and it does not close Case R(6).', 3)] },
    { id: 'r35', parent: 'caseR', label: 'Cases R(3), R(4), R(5)', sub: 'open', state: 'open',
      note: 'Codegree at most five.',
      credits: [
        chenReport('open', 'Sub-cases R(c∗ ), c∗ = 3..7'),
        chenRun('many marked sub-cases excluded; not closed', RALPH, '| Case R, R(3)..R(5) | open | many marked sub-cases excluded; not closed |'),
        late(ours('codegree 3: covered by seven rooted configurations (two programs), none closed; every graph of its local window found with a symmetry of order 5 or a fixed-point-free involution is one graph, which has an independent 10-set', LEDG, 'Two checks now stand behind the cover (Astra; a Claude agent). All seven profiles are open.')),
        late(ours('codegree 4: 69 six-row profiles, 9 closed by short arguments (two derivations), 60 open', LEDG, 'contains one of 60 six-row cases with one of 493 words'))] },
    { id: 'sym', parent: 'root', label: 'Graphs with a symmetry', sub: 'partly closed', state: 'open', route: true,
      note: 'Another route, beside the cover: graphs with a given automorphism.',
      credits: [
        chenReport('not a Cayley graph (all 14 groups of order 40, certified); several prime-order automorphism cases closed, others open', 'G is not a Cayley graph (all 14 groups of order 40, certified)'),
        chenRun('more order-2 cases and mixed cores closed; a few cores open', RALPH, '(5,5) cert; many order-2 cases and mixed cores closed; a few cores open'),
        late(ours('lane 41: no Cayley graph on any of the 14 groups of order 40 is a (3,10;40)-graph (LRAT, two checkers; Chen’s repository had it first, unrefereed)', LEDG, 'no Cayley graph on any of the 14 groups of order 40 (C40, i.e. circulants, included), any degree, is a'))] },
    { id: 'build', parent: 'root', label: 'Building one', sub: 'none found', state: 'open', route: true,
      note: 'The other side of the question: a 40-vertex graph found would make R(3,10) = 41.',
      credits: [
        chenRun('none found; the best 40-vertex graph with valid degrees has 44 independent 10-sets', RALPH, 'none; best degree-valid 40-graph has 44 independent 10-sets'),
        lit('Google DeepMind (AlphaEvolve)', 'matched 39 vertices, no more', 'arXiv 2603.09172', '2026', false, PRIOR, 'AlphaEvolve (Google DeepMind), arXiv 2603.09172: for R(3,10) it only matched 39 vertices'),
        late(ours('lane 41: none found; none of the 258 distinct 39-vertex graphs on disk extends by one vertex (LRAT, two checkers)', LEDG, 'none of the 258 distinct 39-vertex Ramsey graphs on disk (165–172 edges) extends by one vertex'))] }
  ];
  /* the map's own two lines per case: a short name and its state in words, short enough for a box of the map */
  const MAP = { root: ['A (3,10;40)-graph', 'triangle-free, α ≤ 9'], deg4: ['Degree 4 or less', 'impossible'],
    c35: ['Contains an induced C35', 'impossible: Theorem C35'], mtf: ['Maximal triangle-free', 'then degrees 6 to 9'],
    s8: ['S8: a degree-8 vertex', 'closed by enumeration'], near: ['Near-regular N(e)', '238 distributions open'],
    caseR: ['Case R: 9-regular', 'split by codegree c*'], r7: ['Case R(7): codegree seven', 'closed first by Chen’s run'],
    c6: ['Case R(6): codegree six', 'one branch computed; open'], r35: ['Cases R(3) to R(5)', 'open'],
    sym: ['Graphs with a symmetry', 'partly closed'], build: ['Building one', 'none found'] };
  need(has(read(RALPH), '| 524 open | **238 open** |'), 'the map says 238 distributions open; Chen’s final report does not');
  for (const n of N) { need(MAP[n.id], 'case ' + n.id + ' has no map label'); n.map = MAP[n.id]; }
  const ids = new Set(N.map((n) => n.id));
  for (const n of N) need(n.parent === null || ids.has(n.parent), 'case ' + n.id + ' has an unknown parent');
  const STATES = ['decided', 'sealed', 'open', 'refused'];
  for (const n of N) need(STATES.includes(n.state), 'case ' + n.id + ' has no state');
  /* Chen's C-004: the commit and its time, read from his repository as cloned (committer date, his clock) */
  const clone = path.join(LANE, 'audit', 'chen-ralph-2026-11-23', 'repo');
  const c004 = cp.execFileSync('git', ['-C', clone, 'show', '-s', '--format=%H %cI', '3248382c'], { encoding: 'utf8' }).trim().split(' ');
  const at = new Date(c004[1]).toISOString().replace('.000', '');
  need(at === '2026-11-21T16:50:52Z', 'C-004’s commit time is ' + at);
  cite(LOG, 'Its claim C-004 (round 1, commit 3248382c, 2026-11-21 16:50:52 UTC)');
  cite(REVEAL2, 'Round 2 (commit ab6d5ebd, 17:49:01 UTC) relabelled it cert');
  const conf = cp.execFileSync('git', ['-C', clone, 'show', '-s', '--format=%H %cI', 'ab6d5ebd'], { encoding: 'utf8' }).trim().split(' ');
  const confAt = new Date(conf[1]).toISOString().replace('.000', '');
  need(confAt === '2026-11-21T17:49:01Z', 'C-004’s confirmation time is ' + confAt);
  return {
    what: 'The (3,10;40) question as a tree of cases, as read from the sources between 2026-11-21 and 2026-11-25: each case with its state and who decided it. A map of the known reduction, not a proof that the cases are exhaustive. States: decided, open, refused (sealed is no longer used: the seal was opened on 25 Nov 2026).',
    read: '2026-11-25',
    states: STATES,
    chen_c004: { claim: 'C-004', round: 1, commit: c004[0], at, confirmed: { round: 2, commit: conf[0], at: confAt }, pairs: 977008, method: 'custom trace; hand reduction, not Lean' },
    nodes: N
  };
}

/* ------------------------------------------------------------------ the boxes */
/* box 3, opened 2026-11-25: Case R(6), the three-edge branch, recounted from its final ledger; the rest of the case
   (the four-edge branch's cost pilot, the draws, the derivations) from the control room's log */
function r6box() {
  const tallyRel = R6FIN + 'out/TALLY.txt', ledgerRel = R6FIN + 'out/cores.jsonl', finalRel = R6FIN + 'FINAL.sha256';
  const tally = read(tallyRel);
  need(tally.includes('EXCLUDED 23409, OPEN 0, WITNESS 0') && /\nALL-EXCLUDED\s*$/.test(tally), 'the R(6) tally does not read EXCLUDED 23409, OPEN 0, WITNESS 0');
  const ledgerBytes = fs.readFileSync(path.join(LANE, ledgerRel));
  const ledgerSha = sha(ledgerBytes);
  need(read(finalRel).includes(ledgerSha + '  out/cores.jsonl'), 'the R(6) ledger is not the one FINAL.sha256 lists');
  const finalSha = sha(fs.readFileSync(path.join(LANE, finalRel)));
  need(finalSha === 'e77693016f554bfdd407b6a0d2b3803cdd1e0beb9cd3fd5dc93b52630e45fb0a', 'FINAL.sha256 is not the file the receipt of block 977301 commits to');
  cite(JOINW, 'JOIN: 23377 equal, 32 predicted differences, 0 unexpected, v2 agrees on 32 of 32');
  /* our own recount of the ledger, row by row */
  const rows = ledgerBytes.toString('utf8').trim().split('\n').map((l) => JSON.parse(l));
  const lines = new Set(rows.map((r) => r.line));
  need(rows.length === 23409 && lines.size === 23409 && Math.min(...lines) === 0 && Math.max(...lines) === 23408, 'the R(6) ledger does not hold lines 0..23408 once each');
  need(rows.every((r) => r.verdict === 'EXCLUDED'), 'an R(6) ledger row is not EXCLUDED');
  const sum = (f) => rows.reduce((t, r) => t + f(r), 0);
  const T = { cores: rows.length, excluded: rows.length, open: 0, witness: 0, baseline: sum((r) => r.baseline), screened: sum((r) => r.hall),
    open_by_tests: sum((r) => r.open_by_tests), open_cores: rows.filter((r) => r.open_by_tests > 0).length,
    infeasible_by_search: sum((r) => (r.direct || {}).infeasible || 0), at_node_limit: sum((r) => (r.direct || {}).node_limit || 0), completions: sum((r) => ((r.direct || {}).completion || 0) + r.xcheck_completion),
    sampled: sum((r) => r.xcheck_sampled), sample_infeasible: sum((r) => r.xcheck_infeasible), sample_undecided: sum((r) => r.xcheck_undecided),
    contradictions: rows.filter((r) => r.contradiction).length,
    reasons: ['no_row', 'uncovered', 'degree', 'pigeon', 'saturated'].reduce((o, k) => (o[k] = sum((r) => (r.reasons || {})[k] || 0), o), {}) };
  T.refuted_by_tests = T.screened - T.open_by_tests;
  need(T.baseline === 101564232221 && T.screened === 92080292598 && T.refuted_by_tests === 92080264258 && T.open_by_tests === 28340 && T.infeasible_by_search === 28340, 'the R(6) recount does not give the tally’s sums');
  need(T.sampled === 5992486 && T.sample_infeasible === 5992486 && T.sample_undecided === 0 && T.completions === 0 && T.contradictions === 0 && T.at_node_limit === 0, 'the R(6) cross-check sample does not recount');
  need(T.reasons.no_row + T.reasons.uncovered + T.reasons.degree + T.reasons.pigeon + T.reasons.saturated === T.refuted_by_tests, 'the refutation reasons do not sum to the refuted records');
  cite(tallyRel, 'baseline configurations, sum: 101564232221');
  T.sample_share_percent = (100 * T.sampled / T.screened).toFixed(4);
  /* the two machines, by the machines' own clock: the first stopped at 16:25 UTC on 23 Nov, the second started 16:35 */
  const STOP = '2026-11-23T16:30:00Z';
  const first = rows.filter((r) => r.ended_utc < STOP), second = rows.filter((r) => r.ended_utc >= STOP);
  need(first.length === 16927 && second.length === 6482, 'the two machines’ rows are not 16,927 and 6,482');
  const minS = (a) => a.map((r) => r.started_utc).sort()[0], maxE = (a) => a.map((r) => r.ended_utc).sort().pop();
  const cm = /CPU seconds, sum: enum (\d+), tests (\d+), direct (\d+), cross-check ([\d.]+)/.exec(tally);
  need(cm, 'the tally states no CPU sums');
  const cpu = Math.round(Number(cm[1]) + Number(cm[2]) + Number(cm[3]) + Number(cm[4]));
  need(Math.abs(cpu - sum((r) => r.enum.cpu + ((r.tight || {}).cpu || 0) + ((r.direct || {}).cpu || 0) + (r.xcheck_cpu || 0))) < 5, 'the ledger’s CPU seconds do not sum to the tally’s');
  cite(tallyRel, 'CPU seconds, sum: enum 1669011, tests 1764836, direct 403, cross-check 26179.0');
  cite(R6, 'The first (AMD EPYC 7713) wrote 16,927 rows, 22 November 18:10:23 UTC to 23 November 16:25 UTC');
  /* the run, hour by hour: cores finished, for the page's figure (the machine's clock) */
  const t0 = Date.parse('2026-11-22T18:00:00Z');
  const hours = [];
  for (const r of rows) { const h = Math.floor((Date.parse(r.ended_utc) - t0) / 3600000); hours[h] = (hours[h] || 0) + 1; }
  const perHour = Array.from({ length: hours.length }, (_, i) => hours[i] || 0);
  need(perHour.reduce((a, b) => a + b, 0) === 23409, 'the hourly counts do not sum to the cores');
  /* the anchors (heights and times as the control room read them at two explorers) */
  cite(LOG, '977085 (2026-11-22 18:17:27 UTC; merkle root aec92a7c…ff68 = blockstream’s header)');
  cite(LOG, 'block 977301 (2026-11-24 01:10:46 UTC; merkle root 57e5fcee…14d3 = blockstream’s header');
  cite(LOG, 'Claude track\'s four-edge derivations R6E4-INDEPENDENCE.sha256 → block 977089');
  cite(LOG, 'the round-32 R(6) toy registration FROZEN.sha256 → 977108 (22:02:41 UTC)');
  cite(LOG, 'FROZEN.sha256.ots → f091e4a9…4da6, anchor 977197');
  const before = rows.filter((r) => r.ended_utc <= '2026-11-22T18:17:27Z').length;
  need(before === 87, 'cores with a result by block 977085: ' + before);
  cite(R6, 'By then 87 cores had ended and 119 had');
  const stamps = [
    { block: 977085, at: '2026-11-22T18:17:27Z', what: 'the rules of the three-edge run (stamped 18:07 UTC by our clock; the run began 18:10:23 UTC)', file_sha256: 'b23f918c…767f' },
    { block: 977089, at: '2026-11-22T19:03:33Z', what: 'the Claude track’s four-edge derivations (and a second attestation of the rules)', file_sha256: null },
    { block: 977108, at: '2026-11-22T22:02:41Z', what: 'a toy draw registration of the Astra track’s draw gate (round 32)', file_sha256: null },
    { block: 977197, at: null, by: '2026-11-23T12:38Z', what: 'the registration of the four-edge cost pilot r6-e4-cost-01, confirmed by 12:38 UTC on 23 November, before its beacon block 977229 (the block’s own time is not in the log)', file_sha256: 'ca25ea59…d621d' },
    { block: 977301, at: '2026-11-24T01:10:46Z', what: 'the final record of the three-edge run (FINAL.sha256)', file_sha256: 'e7769301…fb0a' }];
  cite(LOG, 'beacon H = 977229');
  cite(LOG, '12:36–12:38 UTC — r6-e4-cost-01: both anchors confirmed and recorded before H');
  /* what the reveal package fixed as the statement, the premises and the limits */
  const STATEMENT = 'If premises P1–P6 hold: no 9-regular triangle-free graph on 40 vertices with no independent set of size 10 has two non-adjacent vertices with exactly six common neighbours and exactly three edges between their other neighbours (the three other neighbours of the one, and the three of the other).';
  cite(R6, 'has two non-adjacent vertices with exactly six common neighbours and exactly three edges between their other neighbours (the three other neighbours of the one, and the three of the other).');
  const premises = [
    { id: 'P1', text: 'there are exactly 23,409 triangle-free graphs on 26 vertices with 75 edges and no independent 8-set (Goedgebeur–Radziszowski 2013, Table 13)', checked: 'from the literature; not checked here', needle: 'There are exactly 23,409 triangle-free graphs on 26 vertices with 75 edges and no independent 8-set' },
    { id: 'P2', text: 'our catalogue file holds 23,409 such graphs, no two isomorphic', checked: 'computed twice: our own code without nauty, and nauty three ways', needle: 'The catalogue file holds 23,409 such graphs, no two isomorphic.' },
    { id: 'P3', text: 'the reduction: in a graph of the branch, the 26 vertices adjacent to neither marked vertex form such a graph, and the conditions the tests use hold', checked: 'proved in Lean 4.35.0 with Mathlib, the three standard axioms only; built and read by the control room; it rests on Zhiyang Chen’s Lean library as compiled; leanchecker --fresh not run; no graph of the branch is exhibited', needle: 'Rests on Chen\'s Lean library as compiled. --fresh not run.' },
    { id: 'P4', text: 'the programs test exactly those conditions and drop no completion', checked: 'prose, in 25 conditions, each read against the code by our agents; a second implementation agrees on 477 + 30 records; no Lean about the C', needle: 'a second implementation agrees on 477 + 30 records' },
    { id: 'P5', text: 'the two machines ran the pinned programs, and the ledger says what they computed', checked: 'the run itself: pins checked and the gate passed on each machine; a second program gives the same enumeration, within the limits below', needle: 'The two machines ran the pinned programs and the ledger says what they computed.' },
    { id: 'P6', text: 'the tools: gcc 13.3.0, Python 3.12.3, Lean’s kernel and Mathlib, nauty', checked: 'trusted as tools', needle: 'The tools: gcc 13.3.0, Python 3.12.3, Lean\'s kernel and Mathlib, nauty.' }];
  for (const p of premises) { cite(R6, p.needle); delete p.needle; }
  const LIMITS = [
    ['One branch of the case, not the case.', 'Chen splits Case R(6) by the number of cross-edges of a marked pair, three to nine. This box is the branch with exactly three. Of the four-edge branch only a 20-core cost pilot ran; five to nine were not run. Case R(6) is not closed, and nothing here decides R(3,10).', R6, 'One branch of the case, not the case.'],
    ['A second program checked the counting, not the verdicts.', 'It counts the same records as ours and has no verdict. Every “excluded” rests on our own tests; no second program touched them.', R6SPEC, 'A second program checked the counting, not the verdicts.'],
    ['No single version of that program was run on every core in agreement with ours.', 'Version 1 ran on all 23,409 cores and differs from ours on 32. A corrected version 2 agrees with ours on 129 cores on a laptop and on 6,512 cores on a rented machine, where its run was stopped on cost; it was never run on all 23,409.', LOG, '6,512 of 6,512 equal, exit 0 on every row'],
    ['It was not written blind.', 'Its track had read and patched our counting program before writing its own. The correction that makes version 2 is ours. An omission shared by both programs would not show.', R6SPEC, 'It was not written blind.'],
    ['The chain from a graph to a verdict is partly prose.', 'The conditions the tests rest on are proved in Lean. That the C programs test exactly those conditions is prose, read by our own agents and tried on samples. There is no proof file per record.', R6SPEC, 'The chain from a graph to a verdict is partly prose.'],
    ['The list of cores is complete only if a published count is right:', '23,409, from Goedgebeur and Radziszowski’s Table 13. Our file has 23,409 valid graphs, no two isomorphic. Nobody here re-derived the count.', R6SPEC, 'The list of cores is complete only if a published count is right:'],
    ['The run did not follow its registration in every step.', 'It was stopped at 16,927 cores and finished on a second machine. Its time estimate was wrong. The registered recheck of 12 cores on a second kind of machine was made late, after the result was known (12 of 12 equal). The machine’s own hash list was not kept. Our separate tally kept no program.', LOG, '12 of 12 equal, made late'],
    ['The rules are in Bitcoin from seven minutes after the run began,', 'not from before it (the anchors, below).', R6SPEC, 'The rules are in Bitcoin from seven minutes after the run began,'],
    ['Nobody outside has read it.', 'One person, models of two families, our own audits.', R6SPEC, 'Nobody outside has read it.']];
  for (const l of LIMITS) cite(l[2], l[3]);
  cite(R6SPEC, 'It was stopped at 16,927 cores and finished on a');
  cite(R6SPEC, 'Version 1 ran on all 23,409 cores and differs from ours on 32.');
  cite(LOG, 'the run 09:32:42–10:01:57 UTC, stopped cleanly by the control room');
  const SECOND = 'A counter written by the other model family lists the same records. Version 1 ran on all 23,409 cores: on 23,377 it wrote the same screened records as ours, byte for byte by hash. On 32 it wrote more, 14,895 records in all: it applied one of the screen’s three side conditions. Ours applies all three, and our tests refute every one of the 14,895 anyway, so no verdict depends on which program is right. With our correction (version 2) it agrees with ours on those 32 and on 97 other cores tried on a laptop, and on 6,512 of 6,512 cores of a rented run that was stopped on cost after 29 minutes. It was not run on the rest.';
  cite(R6SPEC, 'On 32 it wrote more, 14,895 records in all: it applied one of the screen\'s three side conditions.');
  cite(R6SPEC, 'With our correction it agrees with ours on those 32 and on 97 other cores tried.');
  const CHEN = 'The branch is Zhiyang Chen’s. His notes define it and parked it in October. As we last read his repository (23 November, commit 055ae277), his AI run r310_ralph has a scout note on the same branch, with the same two tests in other words: no assignment survived on 16 pilot inputs, no production run, and an inventory of 23,037 of the 23,409 cores, 372 missing. It says of itself that it changes the status of no case. Ours is a run over all 23,409, with tests that do not assume Case R(7). We have not run his scout.';
  cite(R6SPEC, 'no assignment survived on 16 pilot inputs, no production run, and an inventory of 23,037 of');
  const FIXES = 'A derivation note in the record says “R(7), not yet closed”: Chen’s run had closed R(7) the day before it was written. The rules say “Timestamped before the pod exists”: the chain shows them only from seven minutes after the run began. Stamped and pinned files cannot change, so both are corrected here.';
  cite(R6SPEC, 'A derivation note in it says "R(7), not yet closed"');
  /* the rest of the case: the four-edge branch, as far as it went */
  const REST = {
    four_edge: 'The four-edge branch: its reduction was derived by both model tracks and certified by our reading (the only possible shape is a perfect matching plus one edge; the core then has 76 edges, 216,151 graphs by Table 13). A blind cost pilot was registered and anchored before its beacon, drew 20 of the 216,151 cores, and excluded 20 of 20 (no open, no witness). Its cost, extrapolated to all cores: about US$2,530 as registered, about US$3,111 weighted by the catalogue, about US$510 with four measured optimizations. It was not run: the operator stopped spending on pods that would not close the problem.',
    five_to_nine: 'Five to nine cross-edges: nothing run here.',
    pilot: { cores: 20, excluded: 20, catalogue: 216151, registered_usd: '2,530', weighted_usd: '3,111', optimized_usd: '510' } };
  cite(LOG, 'Four cross-edges: CERTIFIED');
  cite(LOG, 'the only possible one is a perfect matching plus one edge (36 labelled copies)');
  cite(LOG, 'r6-e4-cost-01 PILOT COMPLETE: 20 of 20 cores EXCLUDED');
  cite(LOG, 'Catalogue-weighted, today\'s programs: 863.5 s/core ≈ US$3,111.');
  cite(LOG, '+O3 ≈ US$510 (462–626)');
  cite(LOG, 'I want to stop spending on pods that will not close the problem');
  return { tally: T, ledger: { file: ledgerRel, sha256: ledgerSha, final_sha256: finalSha, bytes: ledgerBytes.length },
    run: { machines: 2, vcpu: 32, cpu_s: cpu, cpu_hours: Math.round(cpu / 3600), started: minS(rows), ended: maxE(rows),
      first: { cores: first.length, start: minS(first), stop: maxE(first), cpu: 'AMD EPYC 7713' }, second: { cores: second.length, start: minS(second), end: maxE(second), cpu: 'AMD EPYC 7713P' },
      per_hour: { from: '2026-11-22T18:00:00Z', counts: perHour } },
    stamps, statement: STATEMENT, premises, limits: LIMITS.map(([b, t]) => ({ b, text: t })), second_program: SECOND, chen: CHEN, corrections_beside: FIXES, rest: REST,
    catalogue: { cores: 23409, sha256: '0d3d2caf830c9d5af9ad64ce6da120c83cd12600bc0acf70ae90f747dfab208d' }, bundle_sha256: '3c3e0b08b1a2c6b411dd43aa86a65de02adf8e56b64320fd82b2061016c26dd2',
    results_before_first_block: before };
}
function boxes() {
  const r6 = r6box();
  /* the C35 statement: the first sentence of the sealed text, as the reveal draft fixes it */
  const stmtFile = path.join(os.homedir(), 'Projects', 'seals', 'r310-c35-2026-11-22', 'src', 'STATEMENT.md');
  need(fs.existsSync(stmtFile), 'the sealed C35 statement is not on this machine');
  const C35 = 'Any finite triangle-free simple graph with no independent set of size 10 that contains an induced copy of the circulant C35(1,7,11,16) (vertices 0..34, u ~ v iff v − u ≡ ±1, ±7, ±11 or ±16 mod 35) has at most 39 vertices, and any four distinct vertices outside the copy induce a 4-cycle.';
  need(has(fs.readFileSync(stmtFile, 'utf8'), C35), 'the sealed C35 statement no longer reads as the page states it');
  cite(REVEAL, C35);
  cite(REVEAL, '"The bound 39 is attained" may be said');
  const R7 = 'If P1–P6 hold (as they stand in item 1 above): no 9-regular triangle-free graph on 40 vertices with independence number at most 9 has two non-adjacent vertices with exactly 7 common neighbours.';
  cite(PROD, R7);
  cite(PROD, '879,379 at level 3, 97,627 at level 4, and 2 at level 7 (the full CNF)');
  cite(PROD, '677,467 CPU-seconds (188 CPU-hours of the 400 registered), 22,466 s of wall time on 32 vCPU');
  cite(LOG, 'timestamped with OpenTimestamps at 02:13 UTC, before the pod existed');
  cite(LOG, '(2026-11-22 02:48:33 UTC; merkle root 98a276dd…f0c7 = blockstream’s header), is 31 minutes after production began');
  cite(LOG, 'block 976983 (00…9074f204, 2026-11-22T03:26:46Z)');
  cite(LOG, 'block 977031 (00…83fb8294, 2026-11-22T09:29:47Z)');
  cite(LOG, 'digest ed00c76571823fc3e412ea029b9aacdb36678a5bffc8ebfd799a3ca75f9969e4');
  cite(LOG, 'digest 75dd6cf73a79b7d95b751136da8a6a8ebb8f994710875d731417dd057fe985eb');
  /* the sealed box's anchors (the control room's reading of its receipts, with its own erratum of 04:4x UTC) */
  cite(LOG, '977085 (2026-11-22 18:17:27 UTC; merkle root aec92a7c…ff68 = blockstream’s header)');
  cite(LOG, 'block 977089 (2026-11-22 19:03:33 UTC)');
  cite(LOG, '977108 (22:02:41 UTC)');
  cite(LOG, 'block 977301 (2026-11-24 01:10:46 UTC; merkle root 57e5fcee…14d3 = blockstream’s header');
  const CREDITS = [
    { who: 'The Claude track (Claude Code)', model: 'Claude Opus 5.5, then Claude Fable 5.2 from 01:22 UTC 22 Nov', what: 'C35: the question whether a (3,10;40)-graph contains an induced C35, Lemma P stated, the first enumeration. R(7): the counting, completion and CNF programs, the pilot, the production program, the reduction written out, the registration, and the encoding’s soundness in Lean.' },
    { who: 'The Astra track (Codex, two chats)', model: 'GPT-6.2-astra', what: 'C35: the direct CNF and its LRAT proofs, the claim as handed over, the Lean statement of Lemma P and the bridge. R(7): the reading of the reduction, the counting rules, the Lean chain to the closing theorem.' },
    { who: 'cert-machine, the control room (Claude Code)', model: 'Claude Opus 5.5; Claude Fable 5.2 from 01:27 to 23:13 UTC 22 Nov; Claude Opus 5.5 since', what: 'C35: the registration, our own search, Lemma P checked by the kernel, the controls, the second checkers. R(7): the byte-identical enumeration, our own decider, the tally, the result note, the rented machines, the readings, both seals; this page.' }];
  cite(REVEAL2, 'claude-opus-5-5 from 13:30 UTC 21 Nov (transcript line 37) to 01:22 UTC 22 Nov');
  cite(REVEAL2, 'claude-fable-5-2 from 01:22:38 UTC 22 Nov (line 1762) to 22:59 UTC (line 4434)');
  cite(REVEAL2, 'claude-fable-5-2 from 01:27:15 UTC 22 Nov (line 2880) to 23:13 UTC (line 11835)');
  cite(REVEAL2, 'cert-machine, since 23:13 UTC 22 Nov | claude-opus-5-5');
  cite(REVEAL2, 'all 44 turn contexts gpt-6.2-astra');
  /* box 1, after the outside reading checked by the control room (C35-REVIEW-CHECK.md, claims 1, 2 and 4) */
  const WHY39 = 'Call the copy’s 35 vertices the core and the rest outside. If an outside vertex were unjoined to two other outside vertices, their three core-neighbourhoods would be three sets that Lemma P, a finite fact checked by computer, says cannot exist; so the missing edges among the outside vertices form a matching. Five outside vertices missing only a matching always contain a triangle, so there are at most four, and 35 + 4 = 39; four with no triangle must miss two disjoint edges, which leaves exactly a 4-cycle.';
  cite(C35REV, 'So each outside vertex misses at most one of the others: the missing edges among outside vertices form a matching. Five outside vertices would then always contain a triangle');
  cite(C35REV, '| 1 mechanism | CERTIFIED |');
  const EXOO = { text: 'Of the 82,251 ways to remove four of the 39 vertices of Exoo’s 1989 graph, exactly one leaves an induced copy of C35(1,7,11,16), and the four removed vertices induce a 4-cycle: the equality case of the theorem appears in Exoo’s example.', caveat: 'checked on the isomorphism class identified from our own files; Exoo’s pinned bytes were not at home' };
  cite(C35REV, 'Of the C(39,4) = 82,251 four-subsets W');
  cite(C35REV, '| 2 Exoo\'s square | CERTIFIED (count and C4), on the class identified from our files | 1 of 82,251 four-subsets leaves C35(1,7,11,16), and it induces C4.');
  const SMALLER = 'A smaller certificate for Lemma P: 385 of the 3,360 independent 8-sets suffice, in five orbits of the circulant’s 210 affine symmetries (105 + 70 + 70 + 105 + 35). No union of whole orbits with fewer sets works (1,082 non-empty unions checked). Smaller sub-families exist (an irredundant one of 368 sets), so 385 is minimal only among unions of whole orbits. Confirmed by our own search and by a SAT proof that lrat-check and cake_lpr accept.';
  cite(C35REV, '| 4 smaller certificate | CERTIFIED as stated | 3,360 sets, 6 multipliers, 210 maps, 23 orbits. One union of five orbits (105 + 70 + 70 + 105 + 35 = 385) has no triple');
  cite(C35REV, '1,082 non-empty');
  cite(C35REV, 'A greedy pass gives an irredundant 368-set sub-family');
  const FOUND = 'That Exoo’s graph is C35 plus four vertices in exactly one way was already reported by Unsolved Lab; the full count over all 82,251 four-subsets and the smaller certificate came from a reading by GPT-6.2-astra (via Carlos Toledo’s chat); all of it is checked by our own code.';
  /* box 2: the full ledger, released */
  const RELEASE = { url: 'https://github.com/carlostoledo1891/cert-machine/releases/tag/r310-r7-ledger-2026-11-23', index: 29, package: 'r7-ledger-prod-tsv-reveal.tar.gz',
    package_sha256: '4e1b1b5d01a2411ddaa4d3903627ae877a85d9f81db96d11d47d5b972260e8ee', prod_sha256: 'ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793' };
  citeRepo(README, 'published as a sealed reveal package (index 29) in the release https://github.com/carlostoledo1891/cert-machine/releases/tag/r310-r7-ledger-2026-11-23 (2026-11-23; r7-ledger-prod-tsv-reveal.tar.gz, sha256 4e1b1b5d01a2411ddaa4d3903627ae877a85d9f81db96d11d47d5b972260e8ee)');
  citeRepo(README, 'Ledger sha256 ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793');
  cite(LOG, 'on his word, the R(7) ledger released');
  /* the two full-CNF configurations regenerated from public sources (the control room's kit, corpus/r310-c35-r7/r7/regen-two/) */
  const KIT = 'corpus/r310-c35-r7/r7/regen-two/';
  const REGEN = { ids: [332942, 745446], seconds: '62.89', where: 'a laptop (an arm64 Mac)', kit: KIT, kit_url: 'https://github.com/carlostoledo1891/cert-machine/tree/main/' + KIT,
    tar: 'regen-two.tar.gz', tar_sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, KIT, 'regen-two.tar.gz'))).digest('hex') };
  need(REGEN.tar_sha256 === 'afbfe98e59d705e464271885b94768b24a4fcaff66fb1730d47fd46d7cbeeb50', 'the regeneration kit is not the one the control room pinned');
  citeRepo(KIT + 'README.md', 'This replay does not determine R(3,10) or establish proof-byte reproducibility for other configurations. On the arm64 Mac, both full CNFs and both regenerated LRAT proofs matched their production hashes. For each proof, lrat-check printed c VERIFIED and cake_lpr printed s VERIFIED UNSAT');
  citeRepo(KIT + 'README.md', '62.89 seconds elapsed');
  citeRepo(KIT + 'README.md', '| 332942 | X1 |');
  citeRepo(KIT + 'README.md', '| 745446 | X2 |');
  const reg = fs.readFileSync(path.join(ROOT, 'seals', 'registry.jsonl'), 'utf8').trim().split('\n');
  const line = (dg) => reg.findIndex((l) => l.includes(dg)) + 1;
  const dC = 'ed00c76571823fc3e412ea029b9aacdb36678a5bffc8ebfd799a3ca75f9969e4', dR = '75dd6cf73a79b7d95b751136da8a6a8ebb8f994710875d731417dd057fe985eb';
  need(line(dC) > 0 && line(dR) > 0, 'a seal digest is not in seals/registry.jsonl');
  const premises = [
    { id: 'P1', text: 'e(3,8,27) = 85 (Goedgebeur–Radziszowski)', checked: 'from the literature; not checked here' },
    { id: 'P2', text: 'McKay’s list of (3,8;27)-graphs is complete (Brinkmann and Goedgebeur, 2012, by McKay’s page)', checked: 'from the literature; our filter of it finds 4 graphs with 85 edges and none below, which does not test completeness' },
    { id: 'P3', text: 'the list of 977,008 configurations is complete', checked: 'a checked statement on the four cores: the cover formula is unsatisfiable on each, both checkers accept, two generators give the same clauses; in Lean it enters as a hypothesis' },
    { id: 'P4', text: 'the CNF written for each configuration is the formula the reduction describes', checked: 'the encoding’s soundness (T0, T1) is proved in Lean, built and replayed by the control room and accepted by nanoda, con-leche and leanchecker --fresh; that the program’s bytes equal the formula was computed on all 977,008 rows (T2), not proved; Lean holds no instance of the 977,008 refutations' },
    { id: 'P5', text: 'the reduction from a graph to a configuration', checked: 'a Lean chain from the other model family, a conditional whose hypotheses are the literature, the cover and every record’s refutation; read once by one agent; Lean does not prove that its embedded data are the pinned file' },
    { id: 'P6', text: 'the two proof checkers, lrat-check and cake_lpr', checked: 'trusted as tools; cake_lpr is formally verified' }
  ];
  cite(PROD, 'P3, now a checked statement on the four cores.');
  cite(PROD, 'T2 is computed on all 977,008 rows, not proved');
  cite(PROD, 'P6 (unchanged): the two proof checkers, lrat-check and cake_lpr.');
  cite(REVEAL2, 'accepted by nanoda and con-leche, and by leanchecker --fresh');
  cite(REVEAL2, 'McKay\'s page credits the completeness to Brinkmann and Goedgebeur, 2012');
  cite(REVEAL2, 'One agent of the control room read it once');
  const SETEQ = 'Our 977,008 configurations are Chen’s package pairs, set for set, by our reading of his pair_packages.py: his filters re-implemented, not run.';
  cite(REVEAL2, 'our 977,008 configurations are Chen\'s package pairs, set for set, by our reading of his pair_packages.py');
  const ADDS = 'What ours adds to C-004, as facts: LRAT proofs; two checkers, one formally verified (cake_lpr); a Lean proof that the encoding is sound (T0, T1); the CNF bytes recomputed from the Lean definition on every row (T2, computed); the premises written out; the rules stamped with OpenTimestamps at 02:13 UTC, before the pod was created (Bitcoin confirms the stamp from block 976978, 02:48 UTC, 31 minutes after production began); four controls before production.';
  cite(REVEAL2, ADDS);
  const SEALFIX = 'The sealed result note says “It is Chen’s open case R(7)”. That sentence is wrong: it was written from his report v2, which lists the case as open; his run had excluded it a day earlier.';
  cite(REVEAL2, 'at line 25, "It is Chen\'s open case R(7)"');
  const ALSO = 'So no triangle-free graph on 40 vertices with no independent 10-set contains an induced C35(1,7,11,16).';
  cite(REVEAL2, 'so no triangle-free graph on 40 vertices with no independent 10-set contains an induced C35(1,7,11,16)');
  const POSED = 'The question was posed in public before: by Unsolved Lab (M20, 1 Oct, not run), in the repository andrey-kokoev/marici (a note dated 9 Nov: “this extension family has not been excluded”) and by an idea scout of Chen’s run (21 Nov, timed out). Nobody had decided it.';
  cite(REVEAL2, 'The induced-C35 question was posed in public at least three times before our theorem');
  const COROL = { text: 'In a triangle-free graph on 40 vertices with no independent set of size 10, deleting any 5 vertices leaves an independent set of size 9; so at least 6 deletions are needed to leave none.', label: 'prose proof, not in Lean, conditional on Goedgebeur–Radziszowski’s uniqueness of the (3,9;35)-graph; derived in a reading by GPT-6.2-astra (a control-room session) and checked by the control room' };
  cite(REVEAL2, COROL.text);
  return {
    what: 'The three boxes of /r310/, all opened: Theorem C35; the second computation of Case R(7); Case R(6), the three-edge branch (sealed until 25 November 2026, opened on Carlos Toledo’s word that night, with the rest of the case).',
    credits: CREDITS,
    boxes: [
      { n: 1, id: 'c35', state: 'opened', label: 'Theorem C35', statement: C35, attained: 'The bound 39 is attained.', also: ALSO, posed: POSED, corollary: COROL,
        why39: WHY39, exoo_square: EXOO, smaller_certificate: SMALLER, found_by: FOUND,
        seal: { block: 976983, at: '2026-11-22T03:26:46Z', digest: dC, registry_line: line(dC) },
        rows: [
          { id: 'S', what: 'the Lean statements say the claim (read once, by cert-machine)', verdict: 'CERTIFIED' },
          { id: 'D1', what: 'a SAT decider: our formula equals the other family’s; lrat-check and the verified cake_lpr accept both proofs', verdict: 'CERTIFIED' },
          { id: 'D2', what: 'a second decider, no SAT: our own branching search closes every branch, 403,541 nodes', verdict: 'CERTIFIED' },
          { id: 'L', what: 'Lemma P checked by Lean’s kernel on a 32,529-node certificate, no native code; the three standard axioms only', verdict: 'CERTIFIED' },
          { id: 'B', what: 'the bridge from Lemma P to the theorem, the other family’s files unchanged', verdict: 'CERTIFIED' },
          { id: 'K', what: 'second checkers: leanchecker replay, nanoda, con-leche (leanchecker --fresh not run)', verdict: 'CERTIFIED' },
          { id: 'corollary', what: 'no vertex of degree 4, given Goedgebeur–Radziszowski’s uniqueness of the (3,9;35)-graph; known before', verdict: 'CERTIFIED' }],
        lean: { lean: '4.35.0', axioms: 'propext, Classical.choice, Quot.sound', nodes: 32529, search_nodes: 403541 } },
      { n: 2, id: 'r7', state: 'opened', label: 'Case R(7), a second computation', statement: R7,
        first: 'C-004', registered: '2026-11-22T02:13Z', set_equal: SETEQ, adds: ADDS, sealed_correction: SEALFIX, ledger_release: RELEASE, regenerated: REGEN,
        seal: { block: 977031, at: '2026-11-22T09:29:47Z', digest: dR, registry_line: line(dR) },
        configurations: 977008, by_level: { level3: 879379, level4: 97627, full: 2 },
        run: { start: '2026-11-22T02:17:45Z', end: '2026-11-22T08:32:12Z', cpu_s: 677467, wall_s: 22466, vcpu: 32 },
        premises },
      Object.assign({ n: 3, id: 'c6', state: 'opened', label: 'Case R(6), the three-edge branch', map_label: 'Case R(6): codegree six',
        opened: { on: '2026-11-25', words: 'Everything, seal opened', what: 'The box was sealed from 22 to 25 November 2026: only its name, its Bitcoin anchors and its progress were shown. On the operator’s word on 25 November 2026 (a dialog answer, the options spelled out) the seal was opened: everything of the case is shown, with the anchors shown while it was sealed.' } }, r6)
    ]
  };
}

/* ------------------------------------------------------------------ the corrections ledger */
/* whose / caught_by name a track or a tool, never a person. `where`: c35, r7, r6 (box 3), lane (the lane's own files). */
function corrections() {
  const CM = 'cert-machine', AG = 'a cert-machine agent', CL = 'the Claude track', AS = 'the Astra track';   /* the models behind each: the credits table */
  const E = [
    /* the opened boxes and the lane, told in full */
    ['2026-11-21T18:05Z', 'c35', CM, CM, 'building it', 'A note said the verified checker cake_lpr was built only for x86; its final release ships an ARMv8 build, which ran on the Mac.', 'corrected in the result note', P1, 'An earlier note here said cake_lpr was x86-only. That was wrong'],
    ['2026-11-22T09:00Z', 'c35', 'the plan and the prior-art scout (an agent)', 'the reveal draft (an agent, reading our own files against each other)', 'cross-reading', 'Two of our files said the Lean bridge rests on a native_decide axiom; the proof as checked uses none, only the three standard axioms. Both were written before the kernel proof.', 'the result note is the record', REVEAL, 'say the bridge rests on a native_decide axiom'],
    ['2026-11-22T09:00Z', 'c35', 'the sealed statement', 'the reveal draft (an agent)', 'reading the statement against the record', 'The sealed text adds that Exoo’s 39-vertex graph attains the bound. Our record shows only that a 39-vertex graph attains it; that it is Exoo’s rests on the two tracks’ checks.', 'the page says “the bound 39 is attained”', REVEAL, 'That Exoo’s graph is one rests on the two chats’ checks'],
    ['2026-11-22T09:00Z', 'c35', CM, 'the reveal draft (an agent)', 'comparing times', 'Our pre-registration says it was written about 17:35 UTC; its timestamp receipt was submitted at 17:22 UTC.', 'listed; the receipt is the time', REVEAL, 'P1-PREREG.md says "written ~17:35 UTC"; P1-RESULT.md says its receipt was submitted at 17:22 UTC'],
    ['2026-11-22T09:00Z', 'c35', CM, 'the reveal draft (an agent)', 'comparing files', 'Our plan still listed the verified checker as not run on C35; the result note has it accepting both proofs. One check time was also given as 0.6 s in three files and 0.31 s in the result.', 'the result note is the record', REVEAL, 'lrat-check on path. 0.6 s in cert-machine-r1/README.md, PLAN.md, P1-PREREG.md; 0.31 s in P1-RESULT.md'],
    ['2026-11-22T09:00Z', 'c35', 'our files', 'the reveal draft (an agent)', 'comparing files', 'Our files disagree on who first stated C35: the brief, the round files and the sealed statement give three different splits between the two model tracks.', 'open: the credit is mine to give', REVEAL, 'Who stated C35. Section 5: the brief, the round files and the sealed statement give three different splits.'],
    ['2026-11-22T00:40Z', 'lane', AS, CM, 'recounting with our own code', 'A field of the global scout’s results held |J|, the touched part of a neighbourhood, under the name of |T| = |J| + 1; the claim was the same.', 'the track was asked to name the field so', LOG, 'I read your number as |J|, the touched part of N(v), with |T| = |J| + 1'],
    ['2026-11-22T01:40Z', 'lane', CM, CM, 'rereading the log', 'Round 2 of the control room’s log was first stamped 02:15 UTC; it was written about 01:40.', 'corrected in the heading', LOG, 'Round 2, ~01:40 UTC (first written as 02:15 by mistake)'],
    ['2026-11-22T01:40Z', 'r7', CL, CM, 'checking the pins', 'The pilot’s pinned CNF generator was changed after it was pinned, and the pinned bytes were not on disk.', 'the pinned bytes restored beside the changed file; listed as a gap', LOG, 'GAP: artifacts.sha256 no longer checks for r7cnf.c'],
    ['2026-11-22T01:40Z', 'r7', CL, CM, 'reading the machine', 'A first report said nothing was running; a second benchmark was running on four workers.', 'noted', LOG, 'The first report said nothing was running. By 01:27 UTC the second benchmark'],
    ['2026-11-22T08:36Z', 'r7', 'the production script (the Claude track)', CM, 're-hashing the pull', 'The run’s script hashed one of its files and then appended the end time to it, so one listed hash is of the file’s earlier state.', 'listed; the file without its last line has the listed hash', PROD, 'One hash in OUT.sha256 is of an earlier state of its file.'],
    ['2026-11-22T09:40Z', 'lane', CM, CM, 'reading the registration', 'A registration’s header said a draft’s hash was “in the block below”; it is in a separate file.', 'noted in the log', LOG, 'Slip: its header says the draft’s sha256 is "in the block below"'],
    ['2026-11-22T09:41Z', 'lane', 'a session brief', CM, 'reading the report', 'A brief gave the report’s author a wrong first name. The report and its Zenodo record name him Zhiyang Chen.', 'corrected', 'audit/AUDIT-PREREG-P2.md', 'The report and Zenodo name the author Zhiyang Chen.'],
    ['2026-11-22T10:09Z', 'r7', AS, AG, 'building and reading by our own route', 'A report called one Lean theorem “every independence clause at levels 3, 4 and full depth”: it is one theorem with the level idle, and no clause of the CNF is in that Lean.', 'listed in the reading; no theorem changed', 'control-room-checks/P5-READ.md', 'one theorem, with the level idle'],
    ['2026-11-22T10:09Z', 'r7', AG, AG, 'its own log', 'An agent called leanchecker --help, which has no such flag and starts a full replay; stopped after about two minutes, nothing written. It happened again at 18:25 UTC.', 'stopped; every later tool ran under a wrapper with limits', 'control-room-checks/P5-READ.md', 'leanchecker --help started a replay with no module named'],
    ['2026-11-22T10:49Z', 'r7', 'the cover run’s script (cert-machine)', CM, 're-hashing the pull', 'The same slip as in production, this time in our script: it appended to a progress log after hashing it.', 'listed', 'control-room-checks/p3-pod/P3-RESULT.md', 'The same slip as in the production run, this time in my script.'],
    ['2026-11-22T11:40Z', 'r7', AG, AG, 'exit codes', 'The first five replays exited 1 within a second: the tool started Lean from a path with no default toolchain.', 'rerun with the toolchain first on the path; the failed logs kept', 'control-room-checks/P5-READ-2.md', 'The first five leanchecker runs exited 1 within a second'],
    ['2026-11-22T11:40Z', 'r7', AS, AG, 'reading the files', 'A report cited a Lean line for the independence proof that holds another definition.', 'listed in the reading', 'control-room-checks/P5-READ-2.md', 'Citation slip in the report'],
    ['2026-11-22T12:40Z', 'r7', CL, AG, 'reading the files', 'A note said three native runs passed; no log, script or binary of them is in its folder. The control room reproduced them.', 'listed; reproduced', 'control-room-checks/P4-LEAN-READ.md', 'Not supported by a file: the native "3 of 3".'],
    ['2026-11-22T13:40Z', 'r7', AS, AG, 'reading the files', 'A report’s list of what the production argument still needs was short by five items; its own note had two of them.', 'listed in the reading', 'control-room-checks/P5-READ-3.md', 'The production inference still needs T2 and the checkers’ interpretation'],
    ['2026-11-22T15:10Z', 'r7', AS, AG, 'reading the log', 'A report said a planted change was “caught at the first changed index”; the replay log holds no such control.', 'listed in the reading', 'control-room-checks/P5-READ-4.md', 'the log holds no negative control'],
    ['2026-11-22T17:51Z', 'r7', CM, CM, 'the pod’s clock', 'The rented machine of the all-rows byte check stood idle 20 minutes after the run ended, because a notice arrived late: about US$0.32.', 'deleted; pods are now checked near their expected end', 'control-room-checks/t2-pod/T2-RESULT.md', 'the pod stood idle for 20 minutes after the run ended'],
    ['2026-11-22T18:53Z', 'r7', CL, AG, 'reading the files', 'A note said 39 native rows matched the ledger’s hashes; its log held the word SAME and no hashes.', 'the track added the 39 hashes (19:12 UTC)', 'control-room-checks/P4-KERNEL2-CHECK.md', '"39 with the ledger\'s sha256" is the word SAME.'],
    ['2026-11-22T18:59Z', 'r7', CM, CL, 'the track’s reply, then the files', 'We wrote that no theorem joins the CNF’s soundness proof (T1) to the other track’s closing theorem. Wrong: its bridge applies T1, and the closing theorem’s hypothesis is written with the same constants. It repeated a gap that file had closed.', 'withdrawn; erratum filed', 'control-room-checks/t2-pod/T2-RESULT.md', 'That was wrong, and the error was mine'],
    ['2026-11-22T19:12Z', 'r7', 'a model session (by its content, the Astra track’s)', CL, 'its own file hashes', 'A session of the other track wrote into two of the Claude track’s result notes, under that track’s heading; it happened again at 19:32 UTC.', 'the blocks moved out verbatim to a dated file; a rule: each track writes only in its own folders', LOG, 'Another session wrote into two of Claude’s notes'],
    ['2026-11-22T19:46Z', 'r7', CL, CM, 'hashing the file', 'A hash given in a message was taken before the file’s last write.', 'checked against the file on disk', LOG, 'the file and Claude’s own hash list were written together at 19:32:10 UTC, after the message’s hash was taken'],
    ['2026-11-22T20:22Z', 'r7', AS, AG, 'reading the log', 'A report said a fresh replay (leanchecker --fresh) had passed; its log had no such line. A transcript was filed later, without a time.', 'refused, then on file', 'control-room-checks/P4-ROUND3-CHECK.md', 'Not supported by a file: "leanchecker --fresh passed" (their log has no such line)'],
    ['2026-11-22T22:50Z', 'lane', CM, 'the session’s classifier (a model)', 'before the commit', 'Our first draft of a public status line named this private lane’s rented machine. The commit was refused before it was made.', 'rewritten with the public lane only', LOG, 'My first HANDOFF text named the private lane’s pod in the money line'],
    ['2026-11-24T03:31Z', 'r7', CM, CM, 'reading a receipt that had never been upgraded', 'The page said the rules of the R(7) run were timestamped before the pod existed. The stamp was submitted at 02:13 UTC, before the pod; Bitcoin confirms it only from block 976978 (02:48 UTC), 31 minutes after production began. The sealed box’s line had the same wording.', 'both sentences reworded; the sealed record files keep the old words, with this line beside them', LOG, 'the chain shows the rules existed before the run ended (08:32 UTC) and before most of its results, not before the pod'],
    ['2026-11-23T03:39Z', 'r7', CM, 'an outside review I pasted in', 'reading our records', 'The two seals’ Bitcoin receipts were still pending in our records, hours after a block could confirm them.', 'upgraded and verified: blocks 976983 and 977031', LOG, 'both seals’ receipts upgraded and final (an outside review he pasted pointed out "still pending")'],
    ['2026-11-23T04:02Z', 'r7', CM, CM, 'rereading Chen’s repository before a note to him', 'Our result note (in its sealed text too), our reveal draft and our first note to Chen called R(7) Chen’s open case. His own AI run had excluded it first, on 21 Nov at 16:50:52 UTC.', 'our wording changed: a second computation of a case his run closed first; the sealed sentence is corrected beside it, in box 2', LOG, 'The reveal draft’s "their report says R(7) is open" is out of date'],
    ['2026-11-23T05:05Z', 'c35', 'our prior-art scout (an agent)', 'the reveal day’s prior-art re-check (an agent)', 'searching again', 'Our prior-art scout of 21 Nov missed a public note (andrey-kokoev/marici, dated 9 Nov) that had posed the induced-C35 question and left it not excluded.', 'the page cites it beside the theorem', RECHECK, 'Not found by the 21 Nov scout.'],
    ['2026-11-23T05:15Z', 'r7', CM, 'the reveal package (an agent), reading Chen’s history', 'git history', 'Our 04:02 note put the label “cert (custom trace)” of Chen’s C-004 at his round 1; it arrived in round 2, at 17:49:01 UTC.', 'corrected in the reveal’s source and here', REVEAL2, 'by the history it arrived in round 2'],
    ['2026-11-23T04:41Z', 'c35', AS, AG, 'reading the source', 'A model’s reading called a lower bound “Chen’s”; it is an unnumbered lemma in an idea-scout note of his run, not in his claims list.', 'the page names it as the scout note’s', CHENAUD, 'Calling it "his" lower bound in an e-mail overstates its'],
    /* box 3 (Case R(6)), sealed until 25 Nov 2026 and cited then by a line hash only: now with its words and its source.
       Each needle is a phrase of the control room's log line that the hash named. */
    ['2026-11-22T15:25Z', 'r6', 'a model track', AG, 'an audit of the tightened pruning rule', 'In the proof of the tightened pruning rule of the three-edge branch, one step was worded ambiguously. The step was valid: on 2,094 real graphs with the exact bound and 104,700 weight vectors the rule rejected no real graph’s own side triple.', 'noted', LOG, 'every proof step valid (one worded ambiguously)'],
    ['2026-11-22T16:06Z', 'r6', AS, AG, 'an audit of the blind pilot on 16 catalogue cores', 'The pilot was presented as blind in time, its rules fixed before the draw. Only local clocks backed it: no OpenTimestamps receipt, no commit. File birth times and the session log agreed on the order, but neither is outside the Mac.', 'refused', LOG, 'Blind in time: REFUSED.'],
    ['2026-11-22T16:43Z', 'r6', AS, AG, 'an audit of the second pilot (four fresh cores)', 'A second claim of registration before any outcome, again backed only by local clocks (no receipt).', 'refused', LOG, 'Registered before any outcome: REFUSED'],
    ['2026-11-22T16:43Z', 'r6', AS, AG, 'reading the files', 'The second pilot’s “separate verifier” was the same track’s code, written three minutes later.', 'noted', LOG, 'the "separate verifier" is the same track\'s, written three minutes later'],
    ['2026-11-22T18:21Z', 'r6', CM, CM, 'the running machine', 'Our estimate for the full three-edge run was 9 to 11 hours and about US$10. After 115 cores it measured 125 s of wall per core, a projection of 15 to 25 hours; the run took about 961 CPU-hours on two machines in the end.', 'recorded as a deviation; the operator chose to let it run', LOG, 'Projection 15 to 25 hours, US$15 to 24, not 9 to 11 hours and US$10.'],
    ['2026-11-22T18:50Z', 'r6', AS, AG, 'an audit of the corrected records', 'Four audited record files of the two pilots were corrected in place. The originals were kept under as-run/ with the audited hashes, but the two registrations’ bodies were edited, so their FROZEN.sha256 no longer checked and FREEZE.txt named a hash the file no longer had.', 'restored at the audited hashes (19:29 UTC)', LOG, 'each preserved under as-run/ with the audited hash'],
    ['2026-11-22T18:50Z', 'r6', AS, AG, 'brute force over 2^12 patterns', 'The three-edge formula of the Hall screen, carried into the four-edge branch, is wrong there on 252 patterns of 4,096.', 'replaced by the four-edge closed form, which brute force confirms on 4,096 of 4,096', LOG, 'The three-edge formula is wrong on 252 patterns.'],
    ['2026-11-22T18:50Z', 'r6', AS, AG, 'reading the report against its folder', 'A report gave figures for its development core 0 (863,744 records; two sent to the fill search) with no file behind them.', 'the files were produced later (20:39 UTC)', LOG, 'no file behind them: development core 0 (863,744 records; two to the fill search).'],
    ['2026-11-22T18:50Z', 'r6', AS, AG, 'reading the program', 'A safeguard was claimed for future draws: “a draw cannot start without an outside receipt”. The program checked the receipt against FREEZE.txt’s bytes, never opened FROZEN.sha256, and the draw program asked for no receipt.', 'refused; rebuilt and certified by reading (22:06 UTC)', LOG, 'FREEZE.txt\'s bytes but never opens FROZEN.sha256'],
    ['2026-11-22T19:20Z', 'r6', CL, AG, 'an audit of the four-edge work', 'Four phrases in the Claude track’s four-edge note said more than its files: “both tests assume…”, “16 agree” (14 before, 2 after), “none at k = 5”, and “before the other file was opened”.', 'listed', LOG, 'Wording the files do not support, for Claude'],
    ['2026-11-22T19:29Z', 'r6', AS, AG, 'checking the hashes', 'Audited files were replaced in place again: the three-edge reduction’s .tex and .pdf (19:06:07 UTC; the page our first note hashed no longer resolved at its path, and our reader rebuilt it byte for byte) and the four-edge reduction note. A hash list went stale on 10 of 61 lines.', 'a rule: an audited file is never overwritten; a new version takes a new name', LOG, 'The track replaced audited files in place again'],
    ['2026-11-22T20:39Z', 'r6', AS, AG, 'an audit of the draw gate', 'A test receipt shown as the track’s own, a “genuine receipt at block 974704”, was our first seal’s receipt, read in place from our seal folder.', 'noted', LOG, 'is OUR first seal\'s receipt, read in place from ~/Projects/seals'],
    ['2026-11-22T20:39Z', 'r6', AG, AG, 'its own log', 'An agent of ours ran two read-only git commands on our seal folder and left one empty file in the session’s scratch folder.', 'noted', LOG, 'two read-only git commands on the seal folder'],
    ['2026-11-22T22:06Z', 'r6', CM, AG, 'an audit of draw gate v4', 'Three hash suffixes were misprinted in our audit notes (…2d94 for …2fb2, …5d94 for …2d94, …632e for …023a); the files were right.', 'noted', LOG, 'Three suffix slips in our own notes (the files are right)'],
    ['2026-11-23T03:14Z', 'r6', AS, AG, 'an audit of the toy draws', 'Both draw gates sent the User-Agent “cert-machine/round21” to the two block services, naming the project from a private lane.', 'noted', LOG, 'send User-Agent "cert-machine/round21" to the two services'],
    ['2026-11-23T03:14Z', 'r6', AS, AG, 'an audit of the second counting program', 'A run presented as on an independent machine, “Debian 12 arm64”, was a virtual machine on the same Mac.', 'refused as independent', LOG, '"Debian 12 arm64" was a Lima VM on this same Mac'],
    ['2026-11-23T03:14Z', 'r6', CL, AG, 'an audit of the Claude track’s note', 'Two statements in the Claude track’s note were refuted (that the pigeon test can fire on a Hall survivor; a gap claimed as a catalogue fact), and a third, “the bare point already obeys (mu)”, had never been measured: it fails on 2 of 60 as returned.', 'refuted; listed', LOG, 'was never measured: fails on 2 of 60 as returned'],
    ['2026-11-23T03:14Z', 'r6', CM, 'the Claude track, then an audit', 'a model’s note', 'A reason given in one of our audit notes was wrong: it said only an R(7)-type premise forbids two equal common rows, but codegree 8 and 9 are impossible outright on 40 vertices. Its conclusion stood; no verdict changed.', 'erratum filed', LOG, 'R6-TIGHT-AUDIT.md line 30\'s reason is wrong'],
    ['2026-11-23T03:14Z', 'r6', CM, AG, 'an audit of the four-edge spec', 'A slip in our own note (a size-three row described by its size instead of its zero type) was carried into a model’s spec.', 'noted', LOG, 'the slip began in OUR v1 note'],
    ['2026-11-23T04:30Z', 'r6', AS, AG, 'an audit of the four-edge catalogue plan', 'A model’s estimate of 42 to 43 minutes to build the four-edge catalogue was not supported.', 'refused', LOG, 'the 42–43 min estimate REFUSED'],
    ['2026-11-23T04:30Z', 'r6', AS, AG, 'an audit of the prose items', 'Three wording slips in a model’s report on the three-edge branch’s prose items; no error in our programs.', 'listed', LOG, 'Errors: none in our programs; three wording slips in the report.'],
    ['2026-11-23T07:31Z', 'r6', 'the second program (the Astra track’s code)', AG, 'a second program’s full run, joined with ours by our own code', 'The second counting program, run over every core, disagreed with ours on 16 of the 10,425 cores then compared (32 of 23,409 in the end): it wrote more records after the Hall screen. Until each was decided, nothing about the box could say “all excluded”.', 'resolved at 08:01 UTC; no verdict changes', LOG, 'the second counting program ENDED on all 23,409 cores, and it DISAGREES with ours on 16'],
    ['2026-11-23T04:45Z', 'r6', CM, CM, 'reading the receipt whole', 'We read the three-edge registration’s timestamp receipt only in part (its listing cut after four lines) and “corrected” its Bitcoin time to 02:08 UTC on 23 November. The whole receipt holds three attestations, the earliest block 977085 at 18:17:27 UTC on 22 November.', 'the correction withdrawn', LOG, 'I cut ots info with head -4'],
    ['2026-11-23T17:23Z', 'r6', CM, CM, 'reading the pilot’s run log', 'The four-edge cost pilot’s ENDED line was lost: our launch line sent its standard output to /dev/null after appending it to run.log, so run.log is empty. The pilot log, the room ledger and the summary are intact.', 'listed as a deviation', LOG, 'the pilot\'s ENDED line was lost'],
    ['2026-11-23T19:21Z', 'r6', CM, AG, 'optimizing before deciding', 'The registered cost of the four-edge branch, about US$2,530, was biased low: 9 of the 20 drawn cores were on the enumerator’s slow path, where 66.4% of the catalogue sits. Weighted by the catalogue: about US$3,111.', 'the estimate replaced; the branch not run', LOG, 'The registered US$2,530 was biased LOW'],
    ['2026-11-24T03:24Z', 'r6', CM, 'the reveal package (an agent)', 'the final join', 'This ledger said the second program would be corrected and compared again over every input when the run ended. The corrected version was compared on 129 cores, then on 6,512 on a rented machine before that run was stopped on cost; never on all 23,409.', 'said in box 3', R6SPEC, 'This ledger said the second program would be corrected and compared again over every input when the run ended.'],
    ['2026-11-24T03:24Z', 'r6', CM, 'the reveal package (an agent)', 'the final join', 'This ledger called the second program independent. Its counting path was written after its track had read and patched ours: separately written, not blind.', 'reworded', R6SPEC, 'This ledger called the second program independent.'],
    ['2026-11-24T03:55Z', 'r6', CM, 'the reveal package (an agent)', 'reading the registration against the files', 'Three steps registered for after the run had no record or not the registered form: the same programs on 12 cores on a second kind of machine, the machine’s own hash list, and a separate tally with its program kept.', 'the 12-core recheck was then made, late: 12 of 12 equal (09:51 UTC, 24 Nov); the other two are listed in box 3', R6SPEC, 'Three steps registered for after the run have no record or not the registered form'],
    ['2026-11-24T03:55Z', 'r6', CM, 'the reveal package (an agent)', 'reading the registration against the files', 'The file of deviations lists one. The stop at 16,927 cores, the second machine and a start by hand were recorded in the log only.', 'listed in box 3', R6SPEC, 'The file of deviations lists one.'],
    ['2026-11-24T03:55Z', 'r6', CL, 'the reveal package (an agent)', 'reading the record before it opened', 'A derivation note in the record says “R(7), not yet closed”. Chen’s run had closed it the day before.', 'corrected beside the file, in box 3', R6SPEC, 'Chen\'s run had closed it the day before.'],
    ['2026-11-24T09:26Z', 'r6', CM, 'the reveal package (an agent)', 'hashing the files', 'Our log called the ledger’s hash (34a67324…5d7b) the hash of FINAL.sha256; it is the ledger’s line inside it. The file FINAL.sha256 itself, which the receipt commits to, hashes to e7769301…fb0a.', 'corrected in the log', LOG, '34a67324…5d7b is the ledger\'s line INSIDE FINAL.sha256'],
    /* the attack on 40 (23–25 Nov): errors the control room's ledger records, ours and the models' */
    ['2026-11-24T10:52Z', 'lane', AS, CM, 'ruling the gate by its own words', 'A report called gate G4b a PASS. By the gate’s own terms it is a FAIL: the gate asked for a route with a finite projected total under 5,000 core-hours, and the report’s own first line says no complete argument has a defensible price.', 'ruled FAIL', LEDG, 'BY THE GATE\'S OWN TERMS IT IS A FAIL'],
    ['2026-11-24T17:31Z', 'lane', 'a file of round 1 (the Claude track)', CM, 'counting edges', 'A control file named exoo39.g6 has 172 edges; the class identified as Exoo’s graph has 167. Both are valid 39-vertex controls; the file’s name is not a claim that it is Exoo’s.', 'renamed in the ledger’s words', LEDG, 'round1/claude-b/critique/exoo39.g6 has 172 edges'],
    ['2026-11-24T18:12Z', 'lane', CM, AG, 'an audit run over all 6,180 non-regular distributions', 'Our roster of 519 non-regular distributions was built with Chen’s unchecked floors. Without them, one more key survives at the lower tier, (8,0,0,32); the hole closes at the higher tier.', 'listed; the key later excluded by the three-lows theorem', LEDG, 'A HOLE FOUND IN OUR OWN ROSTER'],
    ['2026-11-24T19:02Z', 'lane', AS, AG, 'a second ladder table', 'The one-level counting row at k = 8 was given as 30; with neighbours’ degrees per vertex the true row is 29.', 'corrected: 19, 24, 29, 36, 43', LEDG, 'the true one-level row is 19, 24, 29, 36, 43'],
    ['2026-11-24T20:40Z', 'lane', AG, AG, 'its own next report', 'An agent’s report gave 7 and 10 roots at (23,6); the numbers were 6 and 9.', 'corrected by the agent', LEDG, '(A correction by the agent to its G14 report: 6 and 9 roots there, not 7 and 10.)'],
    ['2026-11-24T21:09Z', 'lane', AS, CM, 'ruling the gate by its own words', 'A report’s verdict line said “PASS UNIFORM” for an inequality whose weights can differ by host: that is the LP’s dual in one form, not one inequality. Part 3 of the gate was not met.', 'ruled: part 1 met, part 3 not', LEDG, 'that is the LP\'s dual in one form, not ONE'],
    ['2026-11-24T21:09Z', 'lane', AS, AS, 'its own control', 'A control file called control167.g6 has 168 edges; the audited 167-edge graph was used for the reported control.', 'corrected by the track', LEDG, 'the file it had called control167.g6 has 168 edges'],
    ['2026-11-25T01:50Z', 'lane', AG, AG, 'brute force on sample cards', 'Two bugs in an auditor’s own search were caught by its completeness checks against a brute force, before the full run.', 'fixed before the run', LEDG, 'Two bugs in the audit\'s own search were caught by these']
  ];
  /* a resolved entry's full resolution, in words that reveal no method (the control room's, 2026-11-23) */
  const RESOLVED = { '2026-11-23T07:31Z r6': 'Resolved at 08:01 UTC: the second program was the one in error. It applied only the first of the Hall screen’s three side conditions, an omission inherited from its pilot version; ours applies all three. Across the catalogue: 32 cores, 14,895 extra records, every one refuted by our tests and found infeasible by our direct decider, so no verdict would change even if they were counted. The corrected version agrees with ours on 129 cores (a laptop) and on 6,512 (a rented run stopped on cost); it was never run on all 23,409.' };
  cite(LOG, 'RESOLVED — our enum_own is right, emit is wrong');
  cite(R6, 'The second program applied only the');
  const rows = E.map((e, i) => {
    const [at, where, whose, caught_by, how, what, outcome, rel, needle] = e;
    cite(rel, needle);
    const side = whose === 'not yet known' ? 'not yet known' : /track|model session|a model track/.test(whose) ? 'a model track' : 'cert-machine';   /* the control room, its agents, scripts and documents */
    const status = /^OPEN/.test(outcome) ? 'open' : 'closed';
    const resolution = RESOLVED[at + ' ' + where];
    return { id: 'E' + String(i + 1).padStart(2, '0'), at, where, whose, side, status, caught_by, how, what, outcome, resolution, src: rel };
  }).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  rows.forEach((r, i) => { r.n = i + 1; });
  /* five that mattered (the control room's choice, 2026-11-23): a title and one line each, for the page's strip */
  const M5 = [
    ['called R(7) Chen’s open case', 'Chen’s run had closed R(7) first', 'Found by our own reread of his repository before writing to him. Our wording changed to “a second computation”, and a sentence of our sealed note is corrected beside it.'],
    ['We wrote that no theorem joins the CNF’s soundness proof', 'A gap that was not there', 'We wrote that no theorem joined the two halves of the R(7) Lean chain. The Claude track showed the join; we withdrew the claim and filed an erratum.'],
    ['The pilot’s pinned CNF generator was changed after it was pinned', 'A pinned file changed after pinning', 'The pilot’s CNF generator was edited after its hash was pinned. The pinned bytes were restored beside it and the gap was listed.'],
    ['A note said three native runs passed', 'Three runs with no files', 'A model’s note said three runs had passed; no log, script or binary was in its folder. The control room ran them again itself.'],
    ['A reason given in one of our audit notes was wrong', 'Our own wrong reason', 'In box 3: our audit note said only an R(7)-type premise forbids two equal common rows. Codegree 8 and 9 are impossible outright on 40 vertices. The conclusion stood; an erratum was filed.']];
  M5.forEach(([needle, title, line], i) => {
    const hit = rows.filter((r) => r.what.includes(needle));
    need(hit.length === 1, 'the five that mattered: ' + hit.length + ' rows say “' + needle + '”');
    hit[0].mattered = { n: i + 1, title, line };
  });
  const count = (f) => rows.filter(f).length;
  return {
    what: 'Every error caught in the R(3,10) lane, by whom and how, from the control room’s log, its notes and its gate ledger: ours and the models’ alike, never a person’s. The rows of box 3 were one line each while it was sealed; since 25 Nov 2026 they carry their words and sources. A correction of a correction is one row, never counted as a finding.',
    counts: { all: rows.length, r6: count((r) => r.where === 'r6'), opened: count((r) => r.where === 'c35' || r.where === 'r7' || r.where === 'r6'), lane: count((r) => r.where === 'lane'),
      cert_machine: count((r) => r.side === 'cert-machine'), model_tracks: count((r) => r.side === 'a model track'), not_yet_known: count((r) => r.side === 'not yet known'),
      open: count((r) => r.status === 'open') },
    rows
  };
}

/* ------------------------------------------------------------------ the machine at work */
function machine() {
  cite(LOG, 'cpu3c 32 vCPU / 64 GB, US$0.96/h');
  cite(LOG, 'copied home and deleted at US$20, now about 17:00 UTC');
  cite(LOG, 'never started (16 min, runtime null, EU-RO-1): deleted 05:10;');
  cite(LOG, 'created 05:10.');
  cite(LOG, 'about US$2.6 used (the two emit pods)');
  const SECOND = { what: 'a machine for box 3’s second counting program', vcpu: 32, usd_per_hour: '0.96', from: '2026-11-23T05:10Z', to: 'shortly after 07:40 UTC', state: 'deleted',
    earlier: 'one created at 04:54 UTC that never started, deleted at 05:10 UTC', usd_both: '2.6' };
  /* the model sessions run from this Mac (GPT-6.2 Astra by command line), read from their own run files */
  /* every folder with a RUN.txt: astra-runs/* (the side tasks of 23 Nov) and the attack's lines B–E (round4/astra-*,
     round5/astra-*); rounds 1–3 are archived and not counted */
  const runDirs = [];
  for (const [par, rx] of [['astra-runs', /./], ['round4', /^astra-/], ['round5', /^astra-/]])
    for (const d of fs.readdirSync(path.join(LANE, par), { withFileTypes: true })) if (d.isDirectory() && rx.test(d.name)) runDirs.push(path.join(LANE, par, d.name));
  let started = 0, finished = 0, tasks = 0, firstAt = null, lastAt = null;
  for (const dir of runDirs) {
    const f = path.join(dir, 'RUN.txt');
    if (!fs.existsSync(f)) continue;
    const L = fs.readFileSync(f, 'utf8').split('\n');
    const st = L.filter((l) => /^start |^resume /.test(l)), en = L.filter((l) => /^end /.test(l));
    started++;
    tasks += st.length;
    /* a session runs while its last line is a start or a resume (a session killed at the freeze of 25 Nov 02:46 UTC
       has a resume with no end, then a later resume) */
    if (/^end /.test(L.filter((l) => /^(?:start|resume|end) /.test(l)).pop() || '')) finished++;
    for (const l of L) { const m = /^(?:start|end|resume|end \d+|resume \d+) (?:\d+ )?(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ)/.exec(l); if (m && (!lastAt || m[1] > lastAt)) lastAt = m[1]; }
    const t = (/^start (\S+)/.exec(L[0]) || [])[1];
    if (t && (!firstAt || t < firstAt)) firstAt = t;
  }
  /* the audits: the control room's notes, one file one audit; an erratum file is a correction of ours, not an audit */
  const top = fs.readdirSync(path.join(LANE, 'control-room-checks')).filter((f) => f.endsWith('.md'));
  const OPEN_BOX = ['C35-REVIEW-CHECK.md', 'CHEN-RALPH-READING-AUDIT.md', 'P3-X0-CHECK.md', 'P4-KERNEL2-CHECK.md', 'P4-LEAN-READ.md', 'P4-PAGE-TEST.md', 'P4-ROUND3-CHECK.md', 'P4-ROUND4-CHECK.md',
    'P5-READ.md', 'P5-READ-2.md', 'P5-READ-3.md', 'P5-READ-4.md'];
  for (const f of OPEN_BOX) need(top.includes(f), 'an audit note of the opened boxes is gone: ' + f);
  const sealedNotes = top.filter((f) => !OPEN_BOX.includes(f) && !/ERRATUM/i.test(f)).length;
  const runNotes = ['control-room-checks/t2-pod/T2-RESULT.md', 'control-room-checks/p3-pod/P3-RESULT.md'];
  for (const r of runNotes) read(r);
  /* the verdicts on the opened boxes, one row per check, each read from the log or its note */
  const V = [
    ['c35', '2026-11-21T18:05Z', 'S: the Lean statements say the claim', 'CERTIFIED', P1, 'S statement fidelity | CERTIFIED (read once, by cert-machine)'],
    ['c35', '2026-11-21T18:05Z', 'D1: the SAT formula and both proofs', 'CERTIFIED', P1, 'D1 SAT decider | CERTIFIED'],
    ['c35', '2026-11-21T18:05Z', 'D2: our own search, no SAT', 'CERTIFIED', P1, 'D2 non-SAT decider | CERTIFIED'],
    ['c35', '2026-11-21T18:05Z', 'L: Lemma P by the kernel', 'CERTIFIED', P1, 'L Lemma P without native code | CERTIFIED'],
    ['c35', '2026-11-21T18:05Z', 'B: the bridge', 'CERTIFIED', P1, 'B the bridge | CERTIFIED'],
    ['c35', '2026-11-21T18:05Z', 'K: three second checkers', 'CERTIFIED', P1, 'K second checkers | CERTIFIED by three checkers'],
    ['c35', '2026-11-21T18:05Z', 'the degree-4 corollary, given one premise', 'CERTIFIED', P1, 'Corollary (not pre-registered) | CERTIFIED given one named premise'],
    ['c35', '2026-11-23T04:41Z', 'the τ₉ ≥ 6 corollary, in prose, given one premise', 'CERTIFIED', CHENAUD, 'CERTIFIED (proof above; prose, conditional on both premises)'],
    ['c35', '2026-11-23T06:22Z', 'an outside reading’s mechanism for 39: a matching, then a 4-cycle', 'CERTIFIED', C35REV, '| 1 mechanism | CERTIFIED |'],
    ['c35', '2026-11-23T06:22Z', 'Exoo’s square: 1 of 82,251 four-subsets leaves C35, and it induces a 4-cycle', 'CERTIFIED', C35REV, '| 2 Exoo\'s square | CERTIFIED (count and C4)'],
    ['c35', '2026-11-23T06:22Z', 'the label of the fourth removed vertex, without Exoo’s pinned bytes', 'REFUSED', C35REV, 'Label 22: REFUSED here'],
    ['c35', '2026-11-23T06:22Z', 'the corollary as the page states it', 'CERTIFIED', C35REV, '| 3 corollary on the page | CERTIFIED (stated correctly)'],
    ['c35', '2026-11-23T06:22Z', 'a smaller certificate: 385 sets in five orbits, minimal among orbit unions', 'CERTIFIED', C35REV, '| 4 smaller certificate | CERTIFIED as stated |'],
    ['r7', '2026-11-22T01:40Z', 'our own enumeration: the 977,008 configurations byte for byte', 'EQUAL', LOG, 'It equals the track’s configs.bin byte for byte: 977,008 records'],
    ['r7', '2026-11-22T01:40Z', 'our own decider on 24 configurations and 14 controls', 'AGREED', LOG, 'K = 9, 24 configurations'],
    ['r7', '2026-11-22T02:17Z', 'the four controls before production', 'PASS', LOG, 'Controls at 02:17:43 UTC, all PASS'],
    ['r7', '2026-11-22T08:37Z', 'our own tally of the ledger', 'EQUAL', LOG, '977,008 rows, 977,008 distinct indices, 0 rows failing a rule'],
    ['r7', '2026-11-22T08:37Z', 'the registered cross-check of 1,000, and the 2 full-CNF configurations', 'AGREED', LOG, 'the 1,000 registered configurations agree'],
    ['r7', '2026-11-22T10:09Z', 'the first Lean files of the reduction', 'CERTIFIED', LOG, 'all ten public theorems rest on the three standard axioms'],
    ['r7', '2026-11-22T10:49Z', 'P3, the cover, on all four cores', 'CERTIFIED', 'control-room-checks/p3-pod/P3-RESULT.md', 'CERTIFIED on all four cores:'],
    ['r7', '2026-11-22T11:14Z', 'the P4 page rebuilt the bytes alone: 77 of 77', 'PASS', LOG, '77 of 77 ledger hashes at the first reading'],
    ['r7', '2026-11-22T11:40Z', 'seven Lean modules of the reduction', 'CERTIFIED', LOG, 'all seven modules build and replay; 29 public theorems'],
    ['r7', '2026-11-22T12:49Z', 'the CNF soundness proof (T0, T1), built by our route', 'PASS', LOG, 'P4 is now: T0 and T1 built by our route'],
    ['r7', '2026-11-22T13:36Z', 'the bridge from a completion to the CNF', 'CERTIFIED', LOG, 'the six new modules build and replay'],
    ['r7', '2026-11-22T15:08Z', 'the closing theorem, as a conditional', 'CERTIFIED', LOG, 'the closing theorem no_r7_production rests on the three standard axioms'],
    ['r7', '2026-11-22T17:51Z', 'T2: the bytes on all 977,008 rows', 'EQUAL', LOG, 'all 977,008 rows equal.'],
    ['r7', '2026-11-22T18:54Z', 'second kernels on the soundness proof', 'CERTIFIED', LOG, 'nanoda, con-leche and Lean’s kernel: CERTIFIED'],
    ['r7', '2026-11-22T20:22Z', 'the bytes read back as the clause list', 'CERTIFIED', LOG, 'Claude’s bytes theorem: CERTIFIED.'],
    ['r7', '2026-11-22T20:22Z', 'the join of the two tracks’ Lean', 'CERTIFIED', LOG, 'Astra’s join R7ProductionP4.lean: CERTIFIED'],
    ['r7', '2026-11-22T20:22Z', '“a fresh replay passed”', 'REFUSED', LOG, '"leanchecker --fresh passed": REFUSED, not on file'],
    ['r7', '2026-11-22T22:43Z', 'the variable bound', 'CERTIFIED', LOG, 'Claude’s variable bound CERTIFIED'],
    ['r7', '2026-11-22T22:43Z', 'the closing theorem on the reader’s output', 'CERTIFIED', LOG, 'Astra’s R7ProductionRead CERTIFIED'],
    ['r7', '2026-11-23T04:41Z', 'Chen’s 977,008 pairs are ours, core by core', 'CERTIFIED', CHENAUD, 'So the list our production refuted is exactly Chen’s compatible-pair set, core by core.']
  ].map(([box, at, what, verdict, rel, needle]) => { cite(rel, needle); return { box, at, what, verdict, src: rel }; });
  const tally = {};
  for (const v of V) tally[v.verdict] = (tally[v.verdict] || 0) + 1;
  /* money per result, from the log's own figures (about; a rate times hours, as the provider bills it) */
  cite(LOG, 'after the pull was hashed. About US$7.');
  cite(LOG, 'deleted at about 10:48 UTC. About US$0.25.');
  cite(LOG, 'deleted at 17:51 UTC. About US$4.80.');
  const usd = [{ what: 'the production run: 977,008 configurations, 32 vCPU, about 6 hours', usd: '7' }, { what: 'the cover check (P3) on the four graph cores, 8 vCPU', usd: '0.25' },
    { what: 'the byte check (T2) on all 977,008 rows, 32 vCPU, about 4.5 hours', usd: '4.80' }];
  const total = usd.reduce((s, u) => s + Math.round(Number(u.usd) * 100), 0);
  return {
    what: 'The machine at work, as of the newest record read: what runs now, the counts of audits and verdicts (deduplicated; our own corrections are never counted as findings), and the money per result.',
    as_of: lastAt,
    now: { rented: { for: 'box 3, the three-edge run', vcpu: 32, usd_per_hour: '0.96', state: 'finished; both machines are deleted', second: SECOND },
      astra: { model: 'GPT-6.2 Astra, by command line from the Mac', since: firstAt, started, finished, running: started - finished, tasks } },
    audits: { boxes_1_2: OPEN_BOX.length + runNotes.length, box_3: sealedNotes },
    verdicts: { rows: V, tally },
    money: { r7: { items: usd, total_usd: (total / 100).toFixed(2) }, c35: { where: 'the Mac (an M2 with 16 GB); no rented machine', usd: '0' } }
  };
}

/* ------------------------------------------------------------------ the replay of the R(7) run */
async function replay() {
  const cfg = fs.readFileSync(path.join(LANE, 'claude-r7', 'configs.bin'));
  need(cfg.length === 977008 * 10, 'configs.bin is not 977,008 records of 10 bytes');
  need(sha(cfg).startsWith('76c2666b'), 'configs.bin is not the pinned file');
  const coreOf = (i) => cfg.readUInt16LE(i * 10);
  const sizes = [0, 0, 0, 0], start = [];
  for (let i = 0; i < 977008; i++) { const c = coreOf(i); if (start[c] === undefined) start[c] = i; sizes[c]++; }
  need(sizes.join(',') === '261824,261586,226943,226655', 'the per-core counts are not the registered ones');
  /* the ledger's rows in the order the workers finished them; the run log's checkpoints give the wall time */
  const logL = read('claude-r7/prod-out/prod.log').split('\n');
  const pts = [[0, 0]];
  for (const l of logL) { const m = /^(\d+) done, \d+ CPU-s, (\d+) s wall$/.exec(l); if (m) pts.push([Number(m[1]), Number(m[2])]); }
  const endM = /run ended: (\d+) new records, 0 left unstarted, (\d+) CPU-s in this ledger, (\d+) s wall/.exec(logL.join('\n'));
  need(endM && endM[1] === '977008', 'the run log does not end with all 977,008 records');
  pts.push([977008, Number(endM[3])]);
  const tAt = (k) => { let j = 1; while (pts[j][0] < k + 1) j++; const [a, ta] = pts[j - 1], [b, tb] = pts[j]; return ta + (tb - ta) * ((k + 1 - a) / (b - a)); };
  const W = 1000;
  const cells = sizes.map((n) => Array.from({ length: Math.ceil(n / W) }, () => ({ t: 0, n: 0, l4: 0, l7: 0 })));
  const byLevel = { 3: 0, 4: 0, 7: 0 };
  const seen = new Uint8Array(977008);
  const frames = 120, wall = Number(endM[3]);
  const fr = Array.from({ length: frames + 1 }, () => sizes.map(() => 0));
  const rl = require('readline').createInterface({ input: fs.createReadStream(path.join(LANE, 'claude-r7', 'prod-out', 'prod.tsv')) });
  let k = -1;
  for await (const line of rl) {
    if (k === -1) { need(line.startsWith('idx\tK\toutcome\tlevel'), 'the ledger header changed'); k = 0; continue; }
    const f = line.split('\t');
    const idx = Number(f[0]), lev = Number(f[3]);
    need(f[2] === 'CERTIFIED-UNSAT' && f[7] === 'c VERIFIED' && f[8] === 's VERIFIED UNSAT', 'ledger row ' + idx + ' is not refuted by both checkers');
    need(!seen[idx], 'ledger row ' + idx + ' repeats');
    seen[idx] = 1;
    byLevel[lev]++;
    const c = coreOf(idx), j = Math.floor((idx - start[c]) / W), t = tAt(k), cell = cells[c][j];
    cell.t = Math.max(cell.t, t); cell.n++; if (lev === 4) cell.l4++; if (lev === 7) cell.l7++;
    fr[Math.min(frames, Math.ceil(t / wall * frames))][c]++;
    k++;
  }
  need(k === 977008, 'the ledger has ' + k + ' rows');
  need(byLevel[3] === 879379 && byLevel[4] === 97627 && byLevel[7] === 2, 'the levels are not 879,379 / 97,627 / 2');
  for (let i = 1; i <= frames; i++) for (let c = 0; c < 4; c++) fr[i][c] += fr[i - 1][c];
  need(fr[frames].join(',') === sizes.join(','), 'the frames do not end at the per-core totals');
  return {
    what: 'A replay of the recorded R(7) run, not a live one: the 977,008 configurations of the four cores in the order the 32 workers finished them, binned into squares of 1,000 consecutive configurations of a core; a square is refuted when its last configuration is. Times are interpolated between the run log’s checkpoints of 5,000 rows.',
    run: { start: '2026-11-22T02:17:45Z', end: '2026-11-22T08:32:12Z', wall_s: wall, cpu_s: Number(endM[2]), workers: 32 },
    square: W,
    by_level: { level3: byLevel[3], level4: byLevel[4], full: byLevel[7] },
    full_cnf_records: [332942, 745446],
    cores: sizes.map((n, c) => ({ core: 'X' + c, configurations: n, squares: cells[c].map((x) => [Math.round(x.t), x.l4, x.l7]) })),
    frames: { n: frames, every_s: wall / frames, refuted: fr }
  };
}

/* ------------------------------------------------------------------ the whole process: rounds, lines, gates */
function processRec() {
  const rounds = GATES.ROUNDS.map((r) => { cite(r.file, r.needle); return { round: r.round, opened: r.opened, plain: r.plain, src: r.file }; });
  const OUT = ['PASS', 'FAIL', 'PARTIAL', 'CONFIRMED', 'NOT CONFIRMED', 'OPEN', 'DEAD', 'UNDECIDED', 'RUNNING'];
  const gates = GATES.GATES.map((g) => {
    need(OUT.includes(g.outcome), 'gate ' + g.id + ' has no outcome word');
    need(rounds.some((r) => r.round === g.round), 'gate ' + g.id + ' names an unknown round');
    if (g.condition_file) cite(g.condition_file, g.condition_needle);
    cite(LEDG, g.ledger_needle);
    if (g.report) read(g.report);
    return { id: g.id, round: g.round, line: g.line, ruled: g.ruled, outcome: g.outcome, condition: g.condition, condition_written_first: !!g.condition_file,
      condition_src: g.condition_file, count: g.count, ruled_out: g.ruled_out, report: g.report, src: LEDG };
  });
  for (let i = 1; i < gates.length; i++) need(gates[i].ruled >= gates[i - 1].ruled, 'the gates are not in the ledger’s order at ' + gates[i].id);
  /* what runs now: the two Astra sessions, read from their run files and their own newest checkpoint (not a ruling) */
  const running = [['D', 'round4/astra-nonregular'], ['E', 'round5/astra-reach']].map(([line, dir]) => {
    const runL = read(dir + '/RUN.txt').trim().split('\n');
    const last = runL[runL.length - 1];
    const m = /^resume (\d+) (\S+Z) /.exec(last);
    if (!m) return { line: 'Astra ' + line, folder: dir, running: false, last };
    const fu = dir + '/FOLLOWUP-' + m[1] + '.md';
    const g = /Gate (\S+) \(written before you start\): (PASS when [^]*?)(?:;|\.\s|\n\n)/.exec(read(fu));
    need(g, fu + ' states no gate');
    const cond = g[2].replace(/\s+/g, ' ').trim();
    cite(fu, cond);
    const bud = /Budget: ([^\n]+)\./.exec(read(fu));
    /* the session's own newest checkpoint for this gate, if it has written one yet */
    const cdir = path.join(LANE, dir, 'work', g[1].toLowerCase());
    let checkpoint = null;
    if (fs.existsSync(cdir)) {
      const cps = fs.readdirSync(cdir).filter((f) => /^CHECKPOINT-\d{4}\.md$/.test(f)).sort();
      if (cps.length) {
        const cpRel = dir + '/work/' + g[1].toLowerCase() + '/' + cps[cps.length - 1];
        const v = new RegExp('^' + g[1] + ': .*$', 'm').exec(read(cpRel));
        if (v) { cite(cpRel, v[0]); const hhmm = cps[cps.length - 1].slice(11, 15); checkpoint = { file: cpRel, hhmm_utc: hhmm.slice(0, 2) + ':' + hhmm.slice(2), line: v[0] }; }
      }
    }
    return { line: 'Astra ' + line, folder: dir, running: true, gate: g[1], task: Number(m[1]), resumed: m[2], brief: fu, condition: cond, budget: bud ? bud[1] : null, checkpoint };
  });
  /* the earlier rounds (21–23 Nov): the control room's log, one heading per round, verbatim */
  const early = [];
  read(LOG).split('\n').forEach((l) => { const m = /^# Round (\d+), (.+)$/.exec(l); if (m) early.push({ n: Number(m[1]), heading: m[2].trim() }); });
  need(early.length >= 37 && early.every((e, i) => e.n === i + 2), 'the control room’s log does not hold rounds 2 to 38 in order');
  cite(LOG, '# Control room log, R(3,10) (PRIVATE), 2026-11-22 ~00:40 UTC');
  cite(LOG, '## Checks by cert-machine (own code)');
  early.unshift({ n: 1, heading: '~00:40 UTC: the log opens; checks by cert-machine with its own code; messages for the two model tracks' });
  const tally = {};
  for (const g of gates) tally[g.outcome] = (tally[g.outcome] || 0) + 1;
  return { what: 'The whole process of the R(3,10) lane in order: the control room’s rounds of 22 and 23 November (C35, Case R(7), Case R(6)), then the attack on 40 (rounds 1 to 5, 23 to 25 November) and the 41 side, every gate with its pass condition as written before the run (or the ledger’s words when it was sent in a message), its outcome as the control room ruled it, its key count and what it ruled out; and the sessions running at the records’ minute, read from their own run files. A checkpoint is the session’s own words, not a ruling.',
    rounds, gates, tally, running, early: { src: LOG, rounds: early } };
}

/* ------------------------------------------------------------------ the path ledger, parsed */
function pathsRec() {
  const parse = (rel, rx) => read(rel).split('\n').filter((l) => rx.test(l)).map((l) => {
    const c = l.replace(/^\|\s*/, '').replace(/\s*\|\s*$/, '').split(' | ');
    need(c.length >= 4, rel + ': a row with fewer than four cells: ' + l.slice(0, 40));
    return c;
  });
  const cls = (st) => /^DEAD/.test(st) ? 'dead' : /^(RUNNING|QUEUED)/.test(st) ? (/^QUEUED/.test(st) ? 'queued' : 'running')
    : /^(PROVED|ANSWERED|DONE|REPRODUCED|STAGE 1 DONE|G16 CONFIRMED)/.test(st) ? 'stands' : /^FAIL/.test(st) ? 'dead' : 'open';
  const rows = parse(PATHSF, /^\| (F|N)\d+ \|/).map((c) => ({ id: c[0], family: c[1], path: c.slice(2, c.length - 2).join(' | '), status: c[c.length - 2], by: c[c.length - 1] }));
  /* two rows whose status the path ledger did not update after a later ruling: the ledger's ruling beside them */
  const LATER = { N16: ['the monovariant M1 (gate M1) FAILED at 02:50 UTC on 25 Nov: as a bounded-move monovariant this path is dead through moves of size 4', 'N16 as a bounded-move monovariant is DEAD through r = 4 on (3,7;22)'],
    N21: ['G14 then passed at 0 roots (the twin (18,5) excluded without the independence clause) and G15 showed both local windows at 40 non-empty', 'G15 (the local window at 40): PASS — both windows are NON-EMPTY'] };
  for (const r of rows) {
    r.class = cls(r.status);
    if (LATER[r.id]) { cite(LEDG, LATER[r.id][1]); r.later = LATER[r.id][0]; if (r.id === 'N16') r.class = 'dead'; }
  }
  need(rows.length >= 36, 'the path ledger has ' + rows.length + ' rows');
  const ids = rows.map((r) => r.id);
  need(new Set(ids).size === ids.length, 'a path id repeats');
  const side41 = parse('lane41/LANE.md', /^\| A\d+b? \|/).map((c) => ({ id: c[0], path: c[1], status: c.slice(2, c.length - 1).join(' | '), by: c[c.length - 1] }));
  for (const r of side41) r.class = cls(r.status);
  const A2 = side41.find((r) => r.id === 'A2');
  if (A2 && /^RUNNING/.test(A2.status)) { cite(LEDG, 'lane 41, gate A2 (as amended): FAIL — no witness; Cayley graphs of order 40 EXCLUDED with LRAT'); A2.class = 'open';
    A2.later = 'gate A2 FAILED at 08:25 UTC on 25 Nov (no witness); its exclusions stand: none of the 258 known 39-vertex graphs extends, and no Cayley graph of order 40 is a (3,10;40)-graph'; }
  cite(PATHSF, 'a path is DEAD only with the number');
  cite(PATHSF, 'a path SURVIVES only after a second, independent program reproduces its first result');
  const tally = {};
  for (const r of rows) tally[r.class] = (tally[r.class] || 0) + 1;
  return { what: 'The path ledger of the attack on 40 (round5/PATHS.md, opened 24 Nov 16:35 UTC), row by row as the control room keeps it: a path gets a row before anybody works on it; it is dead only with the number that killed it; it survives only after a second program reproduces it. The class (dead, stands, open, running, queued) is read from the status’s first word; two rows not updated after a later ruling carry the ledger’s ruling beside them. Then the 41 side (lane41/LANE.md).',
    src: PATHSF, rows, tally, side41: { src: 'lane41/LANE.md', rows: side41 } };
}

/* ------------------------------------------------------------------ the field map's explanatory content */
function fieldmapRec() {
  const F = (needle) => { cite(FMAP, needle); return FMAP; };
  const ladder = [[3, 6, 'Folklore; a short pencil argument.'], [4, 9, 'Proved by hand (1955).'], [5, 14, 'Proved by hand (1955).'], [6, 18, 'Proved by hand; a four-page proof exists.'],
    [7, 23, 'Proved by hand in 1968. The last rung with a proof a person can read.'], [8, 28, 'Computer, 1992: every candidate for the untouched part was listed.'], [9, 36, '1982. Counting alone closes the hard case here.'],
    [10, null, 'Open: 40 or 41. Lower bound 1989, upper bound 41 in 2025 after about three CPU-years.']].map(([k, v, why]) => {
    F('[' + k + ',' + (v === null ? 40 : v) + ",'" + why + "']"); return { k, value: v, why };
  });
  const nested = [[0, 40, 'the whole graph', 'unknown: the question'], [1, 35, 'R(3,9) = 36', '1 graph'], [2, 27, 'R(3,8) = 28', '477,142 graphs'], [3, 22, 'R(3,7) = 23', '191 graphs'], [4, 17, 'R(3,6) = 18', '7 graphs'],
    [5, 13, 'R(3,5) = 14', '1 graph'], [6, 8, 'R(3,4) = 9', '3 graphs'], [7, 5, 'R(3,3) = 6', '1 graph: the 5-cycle'], [8, 2, 'two points', '1 graph: a single line'], [9, 0, 'nothing left', 'every point is touched']].map(([j, cap, by, count]) => {
    F('[' + j + ',' + cap + ",'" + by + "','" + count + "'"); return { j, cap, by, count };
  });
  cite(LEDG, 'all 7 (3,6;17), all 191 (3,7;22), all 477,142 (3,8;27), the (3,9;35)-graph');
  const slack = [['18', 'k = 6', 0, 'Closed by hand.'], ['23', 'k = 7', 1, 'Closed by hand in 1968.'], ['28', 'k = 8', 5, 'Closed in 1992 by listing every candidate untouched part.'], ['36', 'k = 9', -5, 'Counting alone: the untouched part would need 85 lines and gets 80.'],
    ['42', 'k = 10', 4, 'Closed in 2013: 2,104,151 candidates glued, about 50 CPU-years.'], ['40', 'k = 10', 13, 'Open. The untouched part has 99 lines; the minimum is 86.']].map(([n, k, v, why]) => {
    F("['" + n + "','" + k + "'," + v + ",'" + why + "']"); return { n: Number(n), k, slack: v, why };
  });
  cite(LEDG, 'the twin terms 0, +1, +5, −5, +4, +8.5, +13 (the methods scout\'s table re-derived)');
  const methods = [[43, 'One-level line counting (the classical method)'], [43, 'Line counts at every nested level'], [43, 'Counts of unconnected sets inside the untouched part'], [43, 'The same with shared whole-number profiles'],
    [43, 'Spectral moments plus line counting'], [43, 'Split by whether a rigid 8-point core exists'], [43, 'Subsets of one largest unconnected set'], [43, 'Unions of neighbourhood traces'], [43, 'Subsets of one neighbourhood'],
    [43, 'Deletion test without the full list one point below'], [45, 'Counts of unconnected sets with domination'], [45, 'Spectral moments alone'], [46, 'A degree-based weight function fitted to the small cases']].map(([reach, name]) => {
    F('[' + reach + ",'" + name + "']"); return { reach, name };
  });
  F('One more method, colouring, reaches only 82 and is off the scale.');
  const published = [[42, 2013, 'Published bound 42 (2013): about 50 CPU-years and a list of part of the level below.'], [41, 2025, 'Published bound 41 (2025): about 3 CPU-years and a larger such list.']].map(([reach, year, why]) => {
    F('[' + reach + ",'" + year + "','" + why + "']"); return { reach, year, why };
  });
  cite(LEDG, 'Fourteen methods measured at k = 6..10. At k = 10 every one that needs no catalogue');
  const phantoms = [
    { name: 'The one-view phantom', blind: 'blind to agreement', what: 'Take one real graph on 30 points and pretend it is what every one of the 40 points sees outside its neighbours. Every count made from a single point is then consistent, at any depth.', why: 'It forgets that the views of two points overlap and must agree where they do. This is why ten methods stop at 43. Sharper methods are fooled the same way by a blend of about seven real graphs.', n1: 'Every count made from a single point is then consistent, at any depth.', n2: 'Sharper methods are fooled the same way by a blend of about seven real graphs.' },
    { name: 'The pair phantom', blind: 'blind to triples', what: 'A table of how many pairs of each kind exist, with every pair consistent in itself. It satisfies 35 exact equations in whole numbers.', why: 'Pairs are never asked to agree on a third point. The same phantom, one level up. Found at the stratum with largest codegree 4.', n1: 'It satisfies 35 exact equations in whole numbers.', n2: 'Pairs are never asked to agree on a third point.' },
    { name: 'The scale phantom', blind: 'blind to size', what: 'A real graph with the same proportions as ours, 320 points with 72 neighbours each, where every neighbourhood is a largest unconnected set. Built from a 2010 paper’s recipe.', why: 'Any argument that only uses ratios would exclude it too, and it exists. So ratios alone can never work.', n1: '320 points with 72 neighbours each, where every neighbourhood is a largest unconnected set.', n2: 'Any argument that only uses ratios would exclude it too, and it exists. So ratios alone can never work.' }];
  for (const p of phantoms) { F(p.n1); F(p.n2); delete p.n1; delete p.n2; }
  const fourth = 'Real graphs on 40 points obey every local rule (9 neighbours each, no triangle, 1 to 3 shared neighbours) and still contain ten unconnected points. So nothing built from local rules alone can finish the proof.';
  F(fourth);
  const notFooled = 'Three kinds of input survive all three phantoms: an exact small Ramsey number applied to a region of the graph (18 points untouched by 4 chosen ones must contain 6 unconnected, since R(3,6) = 18); whole-number constraints; and statements that force two or more points’ views to agree.';
  F('Three kinds of input survive all three phantoms: an exact small Ramsey number applied to a region of the graph');
  cite(LEDG, 'a fourth phantom.');
  const funnel = [['An idea', 'from a paper, an agent, or from the operator'], ['A row in the ledger', 'written before any work starts'], ['The test bench', '22 points: possible; 23 points: impossible'], ['A second program', 'written separately, same answer'], ['The gate', 'ruled by the words written before the run'], ['Run at 40', 'only what passed everything above']];
  F("['A row in the ledger','written before','any work starts']");
  F("['The test bench','22 points: possible','23 points: impossible']");
  F('Dead, with the number that killed it');
  const bench = 'The test bench is the pair 22 and 23. At 22 points ten graphs of the regular kind exist; at 23 none does; and counting leaves slack there, as it does at 40. A method must say “possible” at 22 and “impossible” at 23 without being handed the list of smaller graphs.';
  F('The test bench is the pair 22 and 23. At 22 points ten graphs of the regular kind exist; at 23 none does');
  const tools = [['Astra, four at once', 'GPT sessions started from this Mac. Each gets one bounded task and a gate. They read everything, write only in their own folder.'], ['Claude agents', 'The second programs: re-derive a result from the written mathematics before opening the first program’s output. Also the paper scouts.'],
    ['Complete catalogues', 'Every graph at the solved rungs, on disk (477,142 at one of them). A method that “excludes” a graph that exists is wrong.'], ['Two proof checkers', 'Every machine refutation is replayed by two independent checkers before it counts.'],
    ['Gates written first', 'What counts as pass or fail is written and timestamped before the run, then ruled by its own words.'], ['The path ledger', 'A row before any work. Dead only with the number that killed it. Alive only after a second program.'],
    ['Claimbox', 'End of the funnel: a surviving lemma becomes a decidable object over a pinned catalogue.'], ['One Mac', '8 cores, no rented machines. Any route ending in thousands of CPU-hours is out by rule.']].map(([b, t]) => { F(b); F(t.split('. ')[0].replace(/’/g, "'").replace(/[“”]/g, '"')); return { b, t }; });
  const questions = [
    ['What flips between 22 and 23?', 'Ten regular graphs exist on 22 points; none on 23. Every count we can write is satisfied on both sides. Something that is not a count separates them. At 18 points the answer is now known: the counts are forced to a single table, every local piece is a real graph, and still the pieces cannot be assembled into one graph, even ignoring the ten-set rule. At 23 they can be assembled, so something more breaks there. Name it, and it is the thing to carry up to 40.'],
    ['What is the smallest statement about two views agreeing?', 'Each point sees 30 others outside its neighbours. Two joined points share 22 of those. A proof must use that overlap. Listing all overlaps is the brute force we ruled out; a single inequality about them is what is missing.'],
    ['Why do extreme graphs end 8, 5, 2, 0?', 'In every solved case, a graph at the limit contains unconnected sets whose untouched parts are a fixed 8-point graph, then a 5-cycle, then a single line. All 477,142 graphs one rung down do. At 40 only the last step is proved. Counting cannot prove the next; it would need 45 points.'],
    ['Is the regular case the whole problem?', 'In every catalogue, whenever a graph exists, one with the maximum possible number of lines exists too. If that held at 40, a counterexample would exist only if a 9-regular one did, and half the map would vanish. No proof is known at any size.'],
    ['Can rigid spots be forced, then chained?', 'When a region is exactly as large as a Ramsey number allows, its shape is one of a handful. One such spot (three points fully joined to four) fixes seven whole neighbourhoods. The open question is whether such spots must exist, and whether two of them can coexist.'],
    ['Where do the 13 extra lines go?', 'Each untouched part has 13 more lines than the leanest possible graph of its size. The leanest graphs are understood, built from a few patterns. Nothing is known 13 lines above them. A description of what the surplus must look like would be new mathematics.']].map(([q, t]) => { F(q); F(t); return { q, text: t }; });
  const glossary = [['unconnected set', 'Points with no line between any two of them. Mathematicians say “independent set”.'], ['regular', 'Every point has the same number of neighbours. Here 9, giving 180 lines.'], ['codegree', 'How many neighbours two unjoined points share.'],
    ['outside graph', 'What is left after removing a point and all its neighbours.'], ['gate', 'A pass/fail rule written before a run.'], ['phantom', 'Something that passes a method’s checks without being a real graph.']].map(([w, d]) => { F('<dt>' + w + '</dt><dd>' + d.replace(/’/g, "'").replace(/[“”]/g, '"') + '</dd>'); return { word: w, def: d, src: FMAP }; });
  glossary.push({ word: 'largest codegree c*', def: 'The most neighbours two unjoined points have in common; the regular case is split by it, from 3 to 7.', src: F('the most neighbours two unjoined points have in common') });
  glossary.push({ word: 'window W(n, d, cap)', def: 'The d-regular triangle-free graphs on n vertices in which every two non-adjacent vertices have between 1 and cap common neighbours, with no independence condition at all.', src: PATHSF });
  cite(PATHSF, 'does a d-regular triangle-free graph with every non-adjacent codegree in 1..cap exist at all, with NO independence condition?');
  glossary.push({ word: 'the twins', def: 'The regular cases already closed that are built like the case at 40: (6,18), (7,23), (8,28). Every path is asked first to close them without the catalogue of the level below.', src: PATHSF });
  cite(PATHSF, 'Every path is asked first to close those twins without the catalogue of the level below.');
  glossary.push({ word: 'second program', def: 'Code written from the statement alone by another session, without reading the first program; “independent” on this page means that and nothing more.', src: FMAP });
  /* the lane's own map of where a counterexample could hide, at the records' minute (the field map's figures of
     25 Nov 01:56 UTC, brought up to the ledger's last entries) */
  const strata = [
    { k: 'Not regular', what: 'Some vertex has 6, 7 or 8 neighbours.', state: 'reduced, open', done: 283, of: 519, unit: 'degree distributions excluded',
      text: '283 of the 519 distributions left after five integer rays are excluded at published edge floors, every one by two programs: at most two vertices of degree 6 (two routes), then (0,16,0,24), (0,4,28,8) and a degree-7 floor of 109 with its 8 keys. 236 survive. The floor 110 is running (G31).', needles: [[LEDG, 'STANDING: 283 of 519 excluded, every one of the ten beyond G16\'s 273 now re-derived by a second program'], [LEDG, 'THEOREM, NOW ON TWO PROGRAMS: a maximal triangle-free graph on 40 vertices with α ≤ 9 has AT MOST TWO VERTICES OF']] },
    { k: 'Codegree 3', what: 'Regular; no two unjoined vertices share more than 3.', state: 'reduced, open', done: null,
      text: 'Covered by 7 rooted configurations (two programs), none closed. Its local window looks rigid: every symmetric member found is one graph G, which has an independent 10-set. Proved with LRAT: no member other than G has a symmetry of order 5, 7 or a prime ≥ 11, a fixed-point-free involution, or an involution fixing exactly two vertices; involutions fixing four or six vertices remain (the next gate is running); the asymmetric case is priced at 298 core-hours or more and parked.', needles: [[LEDG, 'With W1c (5^8 = {G}): the involution type 2^20 is DECIDED.'], [LEDG, 'No member of W(40,9,3) admits an involution fixing exactly two vertices'], [LEDG, 'at least ~298 core-hours, probably far more']] },
    { k: 'Codegree 4', what: 'Regular; the largest shared neighbourhood is 4.', state: 'reduced, open', done: 9, of: 69, unit: 'profiles closed',
      text: '69 six-row profiles, 9 closed by short arguments a person can read (two derivations), 60 open. A rigid 2K₂ root is forced at every maximum pair (confirmed), but a real 40-vertex graph satisfies all of its one- and two-point cards.', needles: [[LEDG, 'G7 CONFIRMED by a second derivation'], [LEDG, 'has a 2K_2 root J whose one-point and two-point cards are ALL legal']] },
    { k: 'Codegree 5', what: 'Regular; the largest is 5.', state: 'open', done: 0, of: 1957, unit: 'profiles (single-source count)',
      text: '1,839 + 118 profiles before any exclusion (one session’s count). Not attacked.', needles: [[LEDG, 'c* = 5: 1,839 + 118 profiles before exclusion']] },
    { k: 'Codegree 6', what: 'Regular; the largest is 6.', state: 'one branch computed', done: 1, of: 7, unit: 'cross-edge branches computed',
      text: 'The three-edge branch: all 23,409 cores excluded under six premises (box 3). The four-edge branch: a 20-core cost pilot only. Five to nine cross-edges: not run.', needles: [[R6, 'It does not decide R(3,10), and it does not close Case R(6).']] },
    { k: 'Codegree 7', what: 'Regular; the largest is 7.', state: 'excluded', done: 1, of: 1, unit: 'computed twice',
      text: 'Excluded: 977,008 configurations, every one refuted; first by Chen’s run, then by ours (box 2).', needles: [[PROD, 'All 977,008 configurations ended CERTIFIED-UNSAT.']] }];
  for (const st of strata) { for (const [rel, nd] of st.needles) cite(rel, nd); st.src = st.needles.map((n) => n[0]); delete st.needles; }
  const settled = 'Also settled: a vertex with 4 or 5 neighbours is impossible; codegree above 7 is impossible; codegree 1 and 2 are excluded (the second conditionally).';
  F('a point with 4 or 5 neighbours is impossible; codegree above 7 is impossible; codegree 1 and 2 are excluded (the second conditionally).');
  /* forecasts: the field map's numbers, never a fact */
  const forecasts = { at: '2026-11-25T01:56Z', src: FMAP, items: [
    { value: '≈ 80%', what: 'that the answer is 40' }, { value: '20–25%', what: 'that anyone gives a complete, checked answer within a year' }, { value: '≈ 7%', what: 'that this lane alone settles it within a year (up from 5% on two confirmed gates)' }],
    moves: 'The lane’s number moves up if something closes the 23-point regular case without the list below it, and again if the same thing bites at 40. It moves down if all three attempts on that case fail the same way.' };
  F('The answer is 40. Unmoved by today.'); F('Anyone gives a complete, checked answer within a year.'); F('This lane alone does. Up from 5% on two confirmed gates.');
  F('It moves down if all three attempts on that case fail the same way.');
  F('state at 01:56 UTC, 25 Nov 2026');
  return { what: 'The explanatory content of the lane’s private field map (round5/dashboard/r310-field-map.html, state at 01:56 UTC on 25 Nov 2026), rebuilt as data with a needle per sentence and number: the ladder of R(3,k), the nested structure, the slack, the reach of methods, the three phantoms, the funnel and its tools, six open questions, a glossary, the lane’s own map of strata brought up to the ledger’s last entries, and the field map’s forecasts, kept apart as forecasts.',
    src: FMAP, ladder, nested, slack, methods, published, phantoms, fourth, not_fooled: notFooled, funnel, bench, tools, questions, glossary, strata, settled, forecasts };
}

/* ------------------------------------------------------------------ the sources, published with a redaction pass */
const HOLD = [[/^audit\/gr2013\//, 'a published paper’s text (Goedgebeur and Radziszowski 2013): linked, not republished'],
  [/^audit\/chen-23678020\//, 'Zhiyang Chen’s report as read: linked to its Zenodo record, not republished'],
  [/^audit\/chen-ralph-2026-11-23\/repo\//, 'a file of Zhiyang Chen’s public repository (github.com/jeffchen006/Ramsey-R3-10): linked, not republished'],
  [/CHEN-NOTE/, 'a draft of a note to Zhiyang Chen: correspondence with a person, not republished (its facts are cited in the records)']];
const REDACT = [[/ssh -i|root@|\b\d{1,3}(?:\.\d{1,3}){3}\b/, 'an ssh host or a network address'], [/id_ed25519|api[_ -]?key|password|secret key|token=/i, 'a credential'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/, 'an e-mail address'],
  [/\bsequent\b|outreach\/|\bplumb\b|sagui|atalaia|null-edit|job appl|Patrick White/i, 'another private project or private correspondence']];
function publishSources() {
  const dest = path.join(OUT, 'sources');
  const files = [];
  for (const [rel] of [...SRC.entries()].sort()) {
    const buf = fs.readFileSync(path.join(LANE, rel));
    const hold = HOLD.find(([rx]) => rx.test(rel));
    const e = { file: rel, sha256: sha(buf), bytes: buf.length };
    if (hold) { Object.assign(e, { published: false, why: hold[1] }); files.push(e); continue; }
    if (buf.length > 5e6) { Object.assign(e, { published: false, why: 'too large for the repository; named by its sha256' }); files.push(e); continue; }
    const withheld = [];
    const out = buf.toString('utf8').split('\n').map((l, i) => { const r = REDACT.find(([rx]) => rx.test(l)); if (!r) return l; withheld.push({ line: i + 1, why: r[1] }); return '[line ' + (i + 1) + ' withheld from the public copy: ' + r[1] + ']'; }).join('\n');
    Object.assign(e, { published: true, path: 'corpus/r310-live/sources/' + rel, published_sha256: sha(Buffer.from(out)), withheld });
    files.push(e);
    e._out = out;
  }
  return { files, dest };
}

/* ------------------------------------------------------------------ write / check / log */
const J = (o) => JSON.stringify(o, null, 1) + '\n';
async function all() {
  const recs = { 'cases.json': cases(), 'boxes.json': boxes(), 'corrections.json': corrections(), 'machine.json': machine(), 'replay.json': await replay(),
    'process.json': processRec(), 'paths.json': pathsRec(), 'fieldmap.json': fieldmapRec() };
  /* every source cited, with the first twelve hex digits of its sha256, for the page's trust layer */
  recs['cases.json'].sources = [...SRC.entries()].sort().map(([rel, h]) => ({ file: rel, sha256_12: h }));
  const pub = publishSources();
  recs['sources/MANIFEST.json'] = { what: 'The lane files the records of /r310/ cite, as published here: each with the sha256 of the original; a public copy (corpus/r310-live/sources/<path>) when it may be published, with every line withheld from it named with its reason (the original keeps every line; the published copy’s sha256 is given); or the reason it is not republished. Third-party texts are linked, not copied; big data is named by its sha256.',
    published_on: '2026-11-25', files: pub.files.map((f) => { const o = Object.assign({}, f); delete o._out; return o; }) };
  recs._sourceBytes = pub.files.filter((f) => f.published).map((f) => [f.path, f._out]);
  return recs;
}
(async () => {
  const argv = process.argv.slice(2);
  if (argv[0] === '--log') {
    const what = argv.slice(1).join(' ').trim();
    need(what, 'a log entry says what changed');
    const B = JSON.parse(fs.readFileSync(path.join(OUT, 'boxes.json'), 'utf8')), K = JSON.parse(fs.readFileSync(path.join(OUT, 'corrections.json'), 'utf8'));
    const f = path.join(OUT, 'page-log.json');
    const L = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { what: 'The public change log of /r310/: one dated entry per change of the page or of its state. The builder refuses when the newest entry’s state is not the records’.', entries: [] };
    L.entries.push({ at: new Date().toISOString().slice(0, 16) + 'Z', box3: B.boxes[2].state, corrections: K.counts.all, what });
    fs.writeFileSync(f, J(L));
    console.log('page-log.json: entry ' + L.entries.length + ' at ' + L.entries[L.entries.length - 1].at);
    return;
  }
  const recs = await all();
  if (argv.includes('--check')) {
    let bad = 0;
    for (const [f, o] of Object.entries(recs)) {
      if (f === '_sourceBytes') continue;
      const p = path.join(OUT, f);
      if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== J(o)) { console.error('  differs: corpus/r310-live/' + f); bad++; }
    }
    if (bad) die(bad + ' record(s) differ from their sources');
    console.log('corpus/r310-live: ' + Object.keys(recs).length + ' records re-derived, all equal');
    return;
  }
  fs.mkdirSync(path.join(OUT, 'sources'), { recursive: true });
  for (const [f, o] of Object.entries(recs)) if (f !== '_sourceBytes') fs.writeFileSync(path.join(OUT, f), J(o));
  for (const [p, bytes] of recs._sourceBytes) { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), bytes); }
  const B = recs['boxes.json'].boxes[2], K = recs['corrections.json'].counts, P = recs['process.json'], M = recs['sources/MANIFEST.json'].files;
  console.log('corpus/r310-live written: ' + recs['cases.json'].nodes.length + ' cases, box 3 ' + B.state + ' (' + B.tally.excluded + ' of ' + B.tally.cores + ' cores excluded), '
    + K.all + ' corrections (' + K.r6 + ' in box 3), ' + P.gates.length + ' gates, ' + P.running.length + ' sessions running, ' + recs['paths.json'].rows.length + ' paths, '
    + recs['machine.json'].verdicts.rows.length + ' verdict rows, ' + SRC.size + ' sources (' + M.filter((f) => f.published).length + ' published, ' + M.reduce((t, f) => t + (f.withheld ? f.withheld.length : 0), 0) + ' lines withheld)');
})().catch((e) => die(e.stack || e.message));
