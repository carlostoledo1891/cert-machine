#!/usr/bin/env node
/* run-curveseeds-ledger.js — the NIST curve-seeds audit: every claim row decided by both deciders, the ledger written.
   tools/ · cert-machine · 2026-10-16

   Refuses before writing when a pin fails, when published.json was not read from the pinned bytes, when a calibration
   fails, when a red control certifies, or when the two deciders (instruments/curveseeds/decide.js, decide.py — no shared
   code) differ on one field. Writes certs/curveseeds-ledger.json. If corpus/curveseeds/scan.json exists (the optional
   point-counting lane, tools/curveseeds-scan.py + PARI), its summary is carried in the ledger, counted apart.

   usage: node tools/run-curveseeds-ledger.js                                                                    */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const D = require(path.join(ROOT, 'instruments', 'curveseeds', 'decide.js'));
const die = (m) => { console.error('CURVESEEDS LEDGER REFUSED: ' + m); process.exit(1); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/* ---- 1 · pins ------------------------------------------------------------------------------------- */
const PINS = J('corpus/curveseeds/PINS.json');
for (const [f, p] of Object.entries(PINS.files)) {
  const got = sha(path.join(ROOT, 'corpus', 'curveseeds', 'sources', f));
  if (got !== p.sha256) die('pin: ' + f + ' is ' + got.slice(0, 12) + ', pinned ' + p.sha256.slice(0, 12));
}
const PUB = J('corpus/curveseeds/published.json');
for (const [f, h] of Object.entries(PUB.sources)) {
  if (f === 'opensslCommit') continue;
  if (PINS.files[f].sha256 !== h) die('published.json was read from a ' + f + ' other than the pinned one');
}
const PRE = J('corpus/curveseeds/preregistration.json');
const disagreements = Object.entries(PUB.agreement).flatMap(([n, d]) => Object.entries(d).filter(([, v]) => v === false).map(([k]) => n + '.' + k));
if (disagreements.length) die('FIPS 186-2 and OpenSSL disagree on ' + disagreements.join(', '));

/* ---- 2 · the two deciders ------------------------------------------------------------------------- */
const js = D.decideAll();
if (!Object.values(js.calibration).every(Boolean)) die('calibration (JS): ' + JSON.stringify(js.calibration));
const py = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'curveseeds', 'decide.py'), '--json'], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (py.status !== 0) die('the Python decider failed\n' + py.stdout + py.stderr);
const pyRes = JSON.parse(py.stdout);
const diffs = [];
(function walk(a, b, at) {
  if (Array.isArray(a) || Array.isArray(b)) { if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(at); return; }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], at + '.' + k);
    return;
  }
  if (a !== b) diffs.push(at + ' (' + JSON.stringify(a) + ' vs ' + JSON.stringify(b) + ')');
})(js, pyRes, '');
if (diffs.length) die('the two deciders differ on ' + diffs.length + ' field(s): ' + diffs.slice(0, 8).join('; '));
const fieldsCompared = JSON.stringify(js).split(/[,{}]/).length;

/* ---- 3 · the red controls, both deciders ----------------------------------------------------------- */
const redsJs = D.reds();
const redFired = Object.entries(redsJs).filter(([, v]) => !v).map(([k]) => k);
if (redFired.length !== Object.keys(redsJs).length) die('a red control certified (JS): ' + Object.entries(redsJs).filter(([, v]) => v).map(([k]) => k).join(', '));
const pyRed = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'curveseeds', 'decide.py'), '--red'], { encoding: 'utf8' });
if (pyRed.status !== 0) die('a red control certified (Python)\n' + pyRed.stdout);

/* ---- 4 · the ledger ------------------------------------------------------------------------------- */
const rows = [];
for (const [name, r] of Object.entries(js.S)) rows.push(Object.assign({ claim: 'S', curve: name }, r));
for (const [name, r] of Object.entries(js.D)) rows.push(Object.assign({ claim: 'D', curve: name }, r));
for (const [name, r] of Object.entries(js.G)) rows.push(Object.assign({ claim: 'G', curve: name }, r));
const counts = {}; for (const r of rows) { counts[r.claim] = counts[r.claim] || {}; counts[r.claim][r.verdict] = (counts[r.claim][r.verdict] || 0) + 1; }
const byVerdict = {}; for (const r of rows) byVerdict[r.verdict] = (byVerdict[r.verdict] || 0) + 1;

const readings = [
  { id: 'R1', what: 'candidate 876 of the P-256 run, three P-224 candidates and seven X9.62 candidates also yield prime-order curves "with parameters chosen the same way"', status: 'NOT DECIDED HERE', why: 'needs the order of a 192–256-bit curve (Schoof–Elkies–Atkin), outside the standard library; the optional lane (tools/curveseeds-scan.py, PARI/GP) counts apart if run', wouldDecide: 'a point count per candidate below the published index, under a stated root convention for b' },
  { id: 'R2', what: 'the 1/5810 chance that four of ten seeds have a zero top bit in all twenty 32-bit words', status: 'READING', why: 'a probability under a null model the post does not state; not a property of the published bytes', wouldDecide: 'the null model, written down' },
  { id: 'R3', what: '"this makes a backdoor much less plausible"', status: 'INTERPRETATION', why: 'not a computation; the post itself keeps the search-over-timestamps possibility open', wouldDecide: 'nothing in the numbers' },
  { id: 'R4', what: 'the binary curves\' clock halved (srand48(t/2))', status: 'CONVENTION OF THE CLAIM', why: 'the post calls it a reading ("if that reading is right"); under it the four seeds reproduce (S rows), under the unhalved clock they do not (red control)', wouldDecide: 'the generating program' },
  { id: 'R5', what: 'B-163\'s seed; the base points of P-224, P-256, P-384, P-521 and of the binary curves', status: 'OPEN, SAID SO', why: 'the post states these as unexplained; nothing here changes that', wouldDecide: 'a generator and parameters that reproduce them' },
  { id: 'R6', what: 'how many generation runs there were', status: 'NEEDS DATA', why: 'not recoverable from the published numbers; the post says so', wouldDecide: 'the program\'s records' },
];

const conventions = [
  'timestamps are UTC; the srand48 argument is the Unix time (the binary curves: its integer half)',
  'candidate n is 1-based: the n-th block of 20 lrand48 calls (prime) or 5 calls (binary) — the post: "the first 20 bytes are candidate 1"',
  'prime-curve byte = lrand48() >> 23, the top 8 bits of the 48-bit state; binary-curve word = lrand48(), 31 bits printed as a 32-bit word',
  'the seed → curve step is ANSI X9.62-1998 A.3.3 as FIPS 186-2 prints its intermediates: the prime case clears the leftmost bit of the first SHA-1 block (amendment 1), the binary case does not; FIPS gives the binary seed and b in the normal basis',
  'base points: FreeLIP zrstarts(seed) / zrandom / zrandomb as lip.c codes them, NBITS = 26 (the SINGLE_MUL build), seven zrandom draws discarded first (the post\'s reading of the generating program), the first x with x³ − 3x + b a quadratic residue',
];

const out = {
  what: 'The NIST curve-seeds audit: Anthropic\'s 2026-10-16 claim that the 14 NIST / X9.62 curve seeds are lrand48 candidates seeded from Unix timestamps, and that six base points come from FreeLIP\'s generator — every checkable row re-decided from the POSIX, X9.62/FIPS 186-2 and FreeLIP specifications by two deciders sharing no code with each other or with the claimant; the claims beyond the checkable core listed as readings.',
  generated: new Date().toISOString(),
  git: cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(),
  claimant: PRE.claimant,
  pins: Object.fromEntries(Object.entries(PINS.files).map(([f, p]) => [f, p.sha256])),
  preregistration: 'corpus/curveseeds/preregistration.json',
  amendments: PRE.amendments.length,
  calibration: js.calibration,
  conventions,
  rows,
  counts: { byClaim: counts, byVerdict, rows: rows.length },
  readings,
  unexplained: PRE.claim.table.unexplained,
  crossCheck: { javascript: 'instruments/curveseeds/decide.js (BigInt, crypto SHA-1)', python: 'instruments/curveseeds/decide.py (int, hashlib)', fieldsCompared, differences: 0 },
  redControls: { fired: redFired.length, of: Object.keys(redsJs).length, names: redFired, python: 'all fired' },
};
const scanPath = path.join(ROOT, 'corpus', 'curveseeds', 'scan.json');   /* the lane's record — a derived file beside the corpus, not a certificate */
if (fs.existsSync(scanPath)) { const S = JSON.parse(fs.readFileSync(scanPath, 'utf8')); out.scan = { what: (S.what || '') + ' — the optional lane, PARI/GP point counting; counted apart from the certificate above', runs: (S.summary || {}).runs || {}, text: (S.summary || {}).text || '', pod: S.pod || null }; }

fs.writeFileSync(path.join(ROOT, 'certs', 'curveseeds-ledger.json'), JSON.stringify(out, null, 1) + '\n');
console.log('certs/curveseeds-ledger.json written:', JSON.stringify(byVerdict), 'rows', rows.length, '· reds', redFired.length + '/' + Object.keys(redsJs).length, '· cross-check fields', fieldsCompared, '· readings', readings.length);
