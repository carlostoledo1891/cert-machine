#!/usr/bin/env node
/* r310-live-records.js — the records of /r310/ (corpus/r310-live/), each written from the lane's own files.

   The page /r310/ is the live page of the R(3,10) lane: the case map, the boxes (two opened, one sealed), the
   corrections ledger, the machine at work and the replay of one recorded run. Its builder (tools/build-r310-live.js)
   reads only corpus/r310-live/. This file writes those records from the sources and refuses when a source no longer
   says what a record states: every curated sentence carries a needle that must occur in its source (whitespace,
   bold and code marks ignored), and every count is recomputed from the file it comes from.

   The sources live in the lane's working folder (notes/ramsey-r310-scout-2026-11-21/, never committed). So the
   records can be regenerated only where that folder is; a reader of the public repository has the records, the
   builder and this file.

   THE SEALED BOX. One case is worked on under seal. Its record holds its name, its Bitcoin anchors and a progress
   percentage, rounded down, and nothing else; its corrections are one line each with a date and no detail. This
   file never names that work's files: it finds the running ledger and its registration by their place in the
   folder, and the sealed corrections by a needle searched over the control room's notes.

   usage: node tools/r310-live-records.js            write cases, boxes, corrections, machine, replay
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
/* the control room's notes and its log, searched as one text (the sealed corrections cite by needle only) */
function noteFiles() {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.md')) out.push(p);
    }
  })(path.join(LANE, 'control-room-checks'));
  return out.concat([path.join(LANE, 'control-room-2026-11-22.md')]);
}
/* a sealed correction cites its source line by the first 16 hex digits of the sha256 of that line (whitespace, bold
   and code marks normalised), so this public file quotes nothing of the sealed work and still refuses when the line
   is gone */
let LINES = null;
function inNotes(lineHash) {
  if (!LINES) {
    LINES = new Set();
    for (const p of noteFiles()) for (const l of fs.readFileSync(p, 'utf8').split('\n')) LINES.add(sha(norm(l).trim()).slice(0, 16));
  }
  need(/^[0-9a-f]{16}$/.test(lineHash) && LINES.has(lineHash), 'no line of the control room’s notes has the hash ' + lineHash);
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

/* ------------------------------------------------------------------ the case map */
function cases() {
  const lit = (who, what, where, when, refereed, rel, needle) => ({ who, what, where, when, refereed, kind: 'literature', src: cite(rel, needle) });
  const chenReport = (what, needle) => ({ who: 'Zhiyang Chen', what, where: 'progress report, version 2 (Zenodo 10.5281/zenodo.23678020)', when: '2026-10-26', refereed: false, kind: 'chen-report', src: cite(CHEN2, needle) });
  const chenRun = (what, rel, needle) => ({ who: 'Zhiyang Chen’s AI run r310_ralph', what, where: 'github.com/jeffchen006/Ramsey-R3-10', when: '2026-11-21 to 2026-11-22', refereed: false, kind: 'chen-run', src: cite(rel, needle) });
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
        lit('Robert McCrea', 'one slice closed: no degree-7 vertex with e(G − N[v]) = 104', 'Zenodo 10.5281/zenodo.23928054', '2026-11-03', false, PRIOR, 'McCrea, Zenodo 10.5281/zenodo.23928054 (3 Nov 2026): no degree-7 vertex with e(G−N[v]) = 104')] },
    { id: 'caseR', parent: 'mtf', label: 'Case R: 9-regular', sub: 'split by the largest codegree', state: 'open',
      note: 'Every vertex has degree 9. Chen splits it by c*, the largest number of common neighbours of two non-adjacent vertices, 3 ≤ c* ≤ 7.',
      credits: [chenReport('the split by c* = 3, …, 7 (Lemma Mc)', '3 ≤ c∗ ≤ 7')] },
    { id: 'r7', parent: 'caseR', label: 'Case R(7): codegree seven', sub: 'closed by Chen’s run; computed again here', state: 'decided', box: 2,
      note: 'Excluded first by Chen’s own AI run. This lane’s run is a second computation of the case, with its own reduction and code, under premises listed in box 2.',
      credits: [
        chenReport('open: 365 of 464 cubes certified, 99 open', 'R(7) is not closed.'),
        chenRun('excluded first: claim C-004 over all 977,008 admissible package pairs, added in round 1 (21 Nov, 16:50:52 UTC) and confirmed in round 2 (17:49:01 UTC) as a certificate with a custom trace; a hand reduction, not Lean', CLAIMS, '| C-004 | C | No R(7) extension for any of the four 27/85 seeds over all 977,008 admissible package pairs, no cutoffs.'),
        ours('a second computation, with our own reduction and code (it uses Chen’s Lemma R7): LRAT proofs for all 977,008 configurations, two checkers, the encoding’s soundness in Lean, under six premises (box 2)', PROD, 'All 977,008 configurations ended CERTIFIED-UNSAT.', 2)] },
    { id: 'c6', parent: 'caseR', label: 'Case R(6): codegree six', sub: 'running, sealed', state: 'sealed', box: 3,
      note: 'Worked on now, under seal: only its name, its Bitcoin anchors and its progress are shown (box 3).',
      credits: [
        chenReport('open', 'Sub-cases R(c∗ ), c∗ = 3..7'),
        chenRun('partial results; not closed', RALPH, 'many split cases closed'),
        ours('a sealed box, running (box 3)', LOG, 'his decisions (dialog) on a live R(3,10) page: sealed-live', 3)] },
    { id: 'r35', parent: 'caseR', label: 'Cases R(3), R(4), R(5)', sub: 'open', state: 'open',
      note: 'Codegree at most five.',
      credits: [
        chenReport('open', 'Sub-cases R(c∗ ), c∗ = 3..7'),
        chenRun('many marked sub-cases excluded; not closed', RALPH, '| Case R, R(3)..R(5) | open | many marked sub-cases excluded; not closed |')] },
    { id: 'sym', parent: 'root', label: 'Graphs with a symmetry', sub: 'partly closed', state: 'open', route: true,
      note: 'Another route, beside the cover: graphs with a given automorphism.',
      credits: [
        chenReport('not a Cayley graph (all 14 groups of order 40, certified); several prime-order automorphism cases closed, others open', 'G is not a Cayley graph (all 14 groups of order 40, certified)'),
        chenRun('more order-2 cases and mixed cores closed; a few cores open', RALPH, '(5,5) cert; many order-2 cases and mixed cores closed; a few cores open')] },
    { id: 'build', parent: 'root', label: 'Building one', sub: 'none found', state: 'open', route: true,
      note: 'The other side of the question: a 40-vertex graph found would make R(3,10) = 41.',
      credits: [
        chenRun('none found; the best 40-vertex graph with valid degrees has 44 independent 10-sets', RALPH, 'none; best degree-valid 40-graph has 44 independent 10-sets'),
        lit('Google DeepMind (AlphaEvolve)', 'matched 39 vertices, no more', 'arXiv 2603.09172', '2026', false, PRIOR, 'AlphaEvolve (Google DeepMind), arXiv 2603.09172: for R(3,10) it only matched 39 vertices')] }
  ];
  /* the map's own two lines per case: a short name and its state in words, short enough for a box of the map */
  const MAP = { root: ['A (3,10;40)-graph', 'triangle-free, α ≤ 9'], deg4: ['Degree 4 or less', 'impossible'],
    c35: ['Contains an induced C35', 'impossible: Theorem C35'], mtf: ['Maximal triangle-free', 'then degrees 6 to 9'],
    s8: ['S8: a degree-8 vertex', 'closed by enumeration'], near: ['Near-regular N(e)', '238 distributions open'],
    caseR: ['Case R: 9-regular', 'split by codegree c*'], r7: ['Case R(7): codegree seven', 'closed first by Chen’s run'],
    c6: ['Case R(6): codegree six', 'running, sealed'], r35: ['Cases R(3) to R(5)', 'open'],
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
    what: 'The (3,10;40) question as a tree of cases, as read from the sources between 2026-11-21 and 2026-11-23: each case with its state and who decided it. A map of the known reduction, not a proof that the cases are exhaustive. States: decided, sealed (running under seal), open, refused.',
    read: '2026-11-23',
    states: STATES,
    chen_c004: { claim: 'C-004', round: 1, commit: c004[0], at, confirmed: { round: 2, commit: conf[0], at: confAt }, pairs: 977008, method: 'custom trace; hand reduction, not Lean' },
    nodes: N
  };
}

/* ------------------------------------------------------------------ the boxes */
function sealedLedger() {
  /* the running computation's ledger copy and its registration, found by their place in the control room's folder */
  const base = path.join(LANE, 'control-room-checks');
  const hits = [];
  for (const d of fs.readdirSync(base, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const f = path.join(base, d.name, 'pod-partial', 'out', 'cores.jsonl');
    if (fs.existsSync(f)) hits.push(path.join(base, d.name));
  }
  need(hits.length === 1, 'expected one running ledger copy, found ' + hits.length);
  const dir = hits[0];
  const reg = fs.readdirSync(dir).filter((f) => /-FULL-PREREG\.md$/.test(f));
  need(reg.length === 1, 'expected one registration beside the ledger');
  const m = /all ([\d,]+) lines present once/.exec(fs.readFileSync(path.join(dir, reg[0]), 'utf8'));
  need(m, 'the registration no longer states its total');
  const total = Number(m[1].replace(/,/g, ''));
  const rows = fs.readFileSync(path.join(dir, 'pod-partial', 'out', 'cores.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const seen = new Set(rows.map((r) => r.line));
  need(seen.size === rows.length, 'the ledger copy repeats a row');
  need(rows.every((r) => typeof r.ended_utc === 'string'), 'a ledger row has no end time');
  const last = rows.map((r) => r.ended_utc).sort().pop();
  return { percent: Math.floor(100 * rows.length / total), as_of: last };
}
function boxes() {
  const s = sealedLedger();
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
  cite(LOG, 'block 976983 (00…9074f204, 2026-11-22T03:26:46Z)');
  cite(LOG, 'block 977031 (00…83fb8294, 2026-11-22T09:29:47Z)');
  cite(LOG, 'digest ed00c76571823fc3e412ea029b9aacdb36678a5bffc8ebfd799a3ca75f9969e4');
  cite(LOG, 'digest 75dd6cf73a79b7d95b751136da8a6a8ebb8f994710875d731417dd057fe985eb');
  /* the sealed box's anchors (the control room's reading of its receipts, with its own erratum of 04:4x UTC) */
  cite(LOG, '977085 (2026-11-22 18:17:27 UTC; merkle root aec92a7c…ff68 = blockstream’s header)');
  cite(LOG, 'block 977089 (2026-11-22 19:03:33 UTC)');
  cite(LOG, '977108 (22:02:41 UTC)');
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
  const ADDS = 'What ours adds to C-004, as facts: LRAT proofs; two checkers, one formally verified (cake_lpr); a Lean proof that the encoding is sound (T0, T1); the CNF bytes recomputed from the Lean definition on every row (T2, computed); the premises written out; the rules timestamped before the pod existed; four controls before production.';
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
    what: 'The three boxes of /r310/: two opened (Theorem C35; the second computation of Case R(7)), one sealed (Case R(6): codegree six). A sealed box shows its name, its Bitcoin anchors and its progress, rounded down to a whole percent, and nothing else; it opens only after audit, on Carlos Toledo’s word.',
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
      { n: 3, id: 'c6', state: 'sealed', label: 'Case R(6): codegree six',
        stamps: [
          { block: 977085, at: '2026-11-22T18:17:27Z', what: 'the registration of the running computation' },
          { block: 977089, at: '2026-11-22T19:03:33Z', what: 'further derivations' },
          { block: 977108, at: '2026-11-22T22:02:41Z', what: 'a draw registration' }],
        progress_percent: s.percent, as_of: s.as_of }
    ]
  };
}

/* ------------------------------------------------------------------ the corrections ledger */
/* whose / caught_by name a track or a tool, never a person. `where`: c35, r7, lane (the lane's own files), sealed. */
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
    ['2026-11-23T03:39Z', 'r7', CM, 'an outside review I pasted in', 'reading our records', 'The two seals’ Bitcoin receipts were still pending in our records, hours after a block could confirm them.', 'upgraded and verified: blocks 976983 and 977031', LOG, 'both seals’ receipts upgraded and final (an outside review he pasted pointed out "still pending")'],
    ['2026-11-23T04:02Z', 'r7', CM, CM, 'rereading Chen’s repository before a note to him', 'Our result note (in its sealed text too), our reveal draft and our first note to Chen called R(7) Chen’s open case. His own AI run had excluded it first, on 21 Nov at 16:50:52 UTC.', 'our wording changed: a second computation of a case his run closed first; the sealed sentence is corrected beside it, in box 2', LOG, 'The reveal draft’s "their report says R(7) is open" is out of date'],
    ['2026-11-23T05:05Z', 'c35', 'our prior-art scout (an agent)', 'the reveal day’s prior-art re-check (an agent)', 'searching again', 'Our prior-art scout of 21 Nov missed a public note (andrey-kokoev/marici, dated 9 Nov) that had posed the induced-C35 question and left it not excluded.', 'the page cites it beside the theorem', RECHECK, 'Not found by the 21 Nov scout.'],
    ['2026-11-23T05:15Z', 'r7', CM, 'the reveal package (an agent), reading Chen’s history', 'git history', 'Our 04:02 note put the label “cert (custom trace)” of Chen’s C-004 at his round 1; it arrived in round 2, at 17:49:01 UTC.', 'corrected in the reveal’s source and here', REVEAL2, 'by the history it arrived in round 2'],
    ['2026-11-23T04:41Z', 'c35', AS, AG, 'reading the source', 'A model’s reading called a lower bound “Chen’s”; it is an unnumbered lemma in an idea-scout note of his run, not in his claims list.', 'the page names it as the scout note’s', CHENAUD, 'Calling it "his" lower bound in an e-mail overstates its'],
    /* the sealed box: one line each, the date and nothing of the method */
    ['2026-11-22T15:25Z', 'sealed', 'a model track', AG, 'an audit', 'A step in a model’s proof was worded ambiguously; the step was valid.', 'noted', null, '41a395cf8ce0004c'],
    ['2026-11-22T16:06Z', 'sealed', AS, AG, 'an audit', 'A claim that rules were fixed before a test was backed only by local clocks.', 'refused', null, '1fee7e8b97681ed6'],
    ['2026-11-22T16:43Z', 'sealed', AS, AG, 'an audit', 'A second claim of registration before the outcome was backed only by local clocks.', 'refused', null, 'e649f4aa9f102833'],
    ['2026-11-22T16:43Z', 'sealed', AS, AG, 'an audit', 'A check described as separate was the same track’s own, written three minutes later.', 'noted', null, '8b2a8ab36157d9a0'],
    ['2026-11-22T18:21Z', 'sealed', CM, CM, 'the running machine', 'Our time estimate for the running computation was too low.', 'recorded as a deviation; I chose to let it run', null, '52972550233ee2ed'],
    ['2026-11-22T18:50Z', 'sealed', AS, AG, 'an audit', 'Audited files were edited in place: the originals were kept, but a hash manifest stopped checking.', 'restored at the audited hashes (19:29 UTC)', null, 'e2ad3d8bb1835414'],
    ['2026-11-22T18:50Z', 'sealed', AS, AG, 'brute force', 'An earlier formula, carried into a new setting, failed there.', 'replaced', null, 'f4ca7c7b7ca88568'],
    ['2026-11-22T18:50Z', 'sealed', AS, AG, 'an audit', 'A report gave figures with no file behind them.', 'the files were produced later (20:39 UTC)', null, '4396cbd154cf25ed'],
    ['2026-11-22T18:50Z', 'sealed', AS, AG, 'reading the program', 'A safeguard claimed for a future test was not what its program checked.', 'refused; rebuilt and certified by reading (22:06 UTC)', null, '6fa1b60b481cd573'],
    ['2026-11-22T19:20Z', 'sealed', CL, AG, 'an audit', 'Four phrases in a model’s report said more than its files.', 'listed', null, 'cab4b6c5dbbe1ed3'],
    ['2026-11-22T19:29Z', 'sealed', AS, AG, 'an audit', 'Audited files were replaced in place again, and a hash list went stale.', 'a rule: an audited file is never overwritten; a new version takes a new name', null, 'ec12862a17af6fee'],
    ['2026-11-22T20:39Z', 'sealed', AS, AG, 'an audit', 'A test receipt shown as the track’s own was ours, read in place from our seal folder.', 'noted', null, '13e1e3e3c2fcb057'],
    ['2026-11-22T20:39Z', 'sealed', AG, AG, 'its own log', 'An agent ran two read-only commands on our seal folder and left one empty file.', 'noted', null, '9e95efa2a9831f9a'],
    ['2026-11-22T22:06Z', 'sealed', CM, AG, 'an audit', 'Three hash suffixes were misprinted in our audit notes; the files were right.', 'noted', null, 'f45bfd12b144cfad'],
    ['2026-11-23T03:14Z', 'sealed', AS, AG, 'an audit', 'Programs sent a User-Agent naming the project to two public services from a private lane.', 'noted', null, '6810f64b016395d6'],
    ['2026-11-23T03:14Z', 'sealed', AS, AG, 'an audit', 'A machine presented as independent was a virtual machine on the same computer.', 'refused as independent', null, 'f94cb1f2d24a8cc9'],
    ['2026-11-23T03:14Z', 'sealed', CL, AG, 'an audit', 'Two statements in a model’s note were refuted; one more had never been measured.', 'refuted; listed', null, '011be3beb4378a7c'],
    ['2026-11-23T03:14Z', 'sealed', CM, 'the Claude track, then an audit', 'a model’s note', 'A reason given in one of our audit notes was wrong; its conclusion stood.', 'erratum filed', null, '0f416a98f3d00100'],
    ['2026-11-23T03:14Z', 'sealed', CM, AG, 'an audit', 'A slip in one of our own notes was carried into a model’s text.', 'noted', null, 'b13fecea47c03618'],
    ['2026-11-23T04:30Z', 'sealed', AS, AG, 'an audit', 'A model’s cost estimate was not supported.', 'refused', null, '1bad09a8ef035abb'],
    ['2026-11-23T04:30Z', 'sealed', AS, AG, 'an audit', 'Three wording slips in a model’s report.', 'listed', null, '43cdc8643c577e37'],
    ['2026-11-23T04:45Z', 'sealed', CM, CM, 'reading the receipt whole', 'We read a timestamp receipt only in part and “corrected” a registration’s time to a later one; the whole receipt proves the earlier time.', 'the correction withdrawn', null, 'a1dd2067e5c9b5c4']
  ];
  const rows = E.map((e, i) => {
    const [at, where, whose, caught_by, how, what, outcome, rel, needle] = e;
    if (rel) cite(rel, needle); else inNotes(needle);
    const side = /track|model session|a model track/.test(whose) ? 'a model track' : 'cert-machine';   /* the control room, its agents, scripts and documents */
    return { id: 'E' + String(i + 1).padStart(2, '0'), at, where, whose, side, caught_by, how, what, outcome, src: rel || 'the control room’s notes, sealed', line_sha256_16: rel ? undefined : needle };
  }).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  rows.forEach((r, i) => { r.n = i + 1; });
  /* five that mattered (the control room's choice, 2026-11-23): a title and one line each, for the page's strip */
  const M5 = [
    ['called R(7) Chen’s open case', 'Chen’s run had closed R(7) first', 'Found by our own reread of his repository before writing to him. Our wording changed to “a second computation”, and a sentence of our sealed note is corrected beside it.'],
    ['We wrote that no theorem joins the CNF’s soundness proof', 'A gap that was not there', 'We wrote that no theorem joined the two halves of the R(7) Lean chain. The Claude track showed the join; we withdrew the claim and filed an erratum.'],
    ['The pilot’s pinned CNF generator was changed after it was pinned', 'A pinned file changed after pinning', 'The pilot’s CNF generator was edited after its hash was pinned. The pinned bytes were restored beside it and the gap was listed.'],
    ['A note said three native runs passed', 'Three runs with no files', 'A model’s note said three runs had passed; no log, script or binary was in its folder. The control room ran them again itself.'],
    ['A reason given in one of our audit notes was wrong', 'Our own wrong reason', 'Inside the sealed box: a reason given in one of our audit notes was wrong. Its conclusion stood, and an erratum was filed.']];
  M5.forEach(([needle, title, line], i) => {
    const hit = rows.filter((r) => r.what.includes(needle));
    need(hit.length === 1, 'the five that mattered: ' + hit.length + ' rows say “' + needle + '”');
    hit[0].mattered = { n: i + 1, title, line };
  });
  const count = (f) => rows.filter(f).length;
  return {
    what: 'Every error caught in the R(3,10) lane, by whom and how, from the control room’s log and notes: ours and the models’ alike, never a person’s. Errors inside the sealed box are one line each with a date and nothing of the method. A correction of a correction is one row, never counted as a finding.',
    counts: { all: rows.length, sealed: count((r) => r.where === 'sealed'), opened: count((r) => r.where === 'c35' || r.where === 'r7'), lane: count((r) => r.where === 'lane'),
      cert_machine: count((r) => r.side === 'cert-machine'), model_tracks: count((r) => r.side === 'a model track') },
    rows
  };
}

/* ------------------------------------------------------------------ the machine at work */
function machine() {
  cite(LOG, 'cpu3c 32 vCPU / 64 GB, US$0.96/h');
  cite(LOG, 'copied home and deleted at US$20, now about 17:00 UTC');
  /* the model sessions run from this Mac (GPT-6.2 Astra by command line), read from their own run files */
  const ar = path.join(LANE, 'astra-runs');
  let started = 0, finished = 0, firstAt = null, lastAt = null;
  for (const d of fs.readdirSync(ar, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const f = path.join(ar, d.name, 'RUN.txt');
    if (!fs.existsSync(f)) continue;
    const L = fs.readFileSync(f, 'utf8').split('\n');
    const st = L.filter((l) => /^start |^resume /.test(l)), en = L.filter((l) => /^end /.test(l));
    started++;
    if (st.length === en.length) finished++;
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
    now: { rented: { for: 'box 3, the sealed computation', vcpu: 32, usd_per_hour: '0.96', state: 'running' },
      astra: { model: 'GPT-6.2 Astra, by command line from the Mac', since: firstAt, started, finished, running: started - finished } },
    audits: { opened_boxes: OPEN_BOX.length + runNotes.length, sealed_box: sealedNotes },
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

/* ------------------------------------------------------------------ write / check / log */
const J = (o) => JSON.stringify(o, null, 1) + '\n';
async function all() {
  const recs = { 'cases.json': cases(), 'boxes.json': boxes(), 'corrections.json': corrections(), 'machine.json': machine(), 'replay.json': await replay() };
  /* every source cited, with the first twelve hex digits of its sha256, for the page's trust layer */
  recs['cases.json'].sources = [...SRC.entries()].sort().map(([rel, h]) => ({ file: rel, sha256_12: h }));
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
    L.entries.push({ at: new Date().toISOString().slice(0, 16) + 'Z', progress_percent: B.boxes[2].progress_percent, corrections: K.counts.all, what });
    fs.writeFileSync(f, J(L));
    console.log('page-log.json: entry ' + L.entries.length + ' at ' + L.entries[L.entries.length - 1].at);
    return;
  }
  const recs = await all();
  if (argv.includes('--check')) {
    let bad = 0;
    for (const [f, o] of Object.entries(recs)) {
      const p = path.join(OUT, f);
      if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== J(o)) { console.error('  differs: corpus/r310-live/' + f); bad++; }
    }
    if (bad) die(bad + ' record(s) differ from their sources');
    console.log('corpus/r310-live: ' + Object.keys(recs).length + ' records re-derived, all equal');
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  for (const [f, o] of Object.entries(recs)) fs.writeFileSync(path.join(OUT, f), J(o));
  const B = recs['boxes.json'].boxes[2], K = recs['corrections.json'].counts;
  console.log('corpus/r310-live written: ' + recs['cases.json'].nodes.length + ' cases, sealed box at ' + B.progress_percent + '% (as of ' + B.as_of + '), '
    + K.all + ' corrections (' + K.sealed + ' sealed), ' + recs['machine.json'].verdicts.rows.length + ' verdict rows, ' + SRC.size + ' sources');
})().catch((e) => die(e.stack || e.message));
