#!/usr/bin/env node
/* battery.js — the NIST curve-seeds audit: the pins, the published parameters read from them, the two deciders'
   calibration and agreement, the ledger's counts, and the red controls (each must fail).   cert-machine · 2026-10-16

   usage: node instruments/curveseeds/battery.js            exit 0 = ALL PASS                                   */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const D = require(path.join(__dirname, 'decide.js'));
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
let fails = 0, checks = 0, reds = 0, redsFired = 0;
const ok = (name, cond, note) => { checks++; if (!cond) fails++; console.log('  ' + (cond ? 'ok  ' : 'FAIL') + ' ' + name + (note ? '  ' + note : '')); };
const red = (name, firedIfTrue) => { reds++; if (firedIfTrue) redsFired++; console.log('       RED ' + (firedIfTrue ? 'ok   ' : 'MISSED ') + name); if (!firedIfTrue) fails++; };

/* ---- 1 · the pins and the published parameters ----------------------------------------------------- */
const PINS = J('corpus/curveseeds/PINS.json');
let pinsOk = true;
for (const [f, p] of Object.entries(PINS.files)) { const got = sha(fs.readFileSync(path.join(ROOT, 'corpus', 'curveseeds', 'sources', f))); if (got !== p.sha256) { pinsOk = false; console.log('       ' + f + ' ' + got.slice(0, 12) + ' ≠ ' + p.sha256.slice(0, 12)); } }
ok('1  every pinned source re-hashes to its pin', pinsOk, '[' + Object.keys(PINS.files).length + ' files]');
const PUB = J('corpus/curveseeds/published.json');
ok('2  published.json was read from the pinned FIPS text and OpenSSL table', PUB.sources['fips186-2.txt'] === PINS.files['fips186-2.txt'].sha256 && PUB.sources['openssl-ec_curve.c'] === PINS.files['openssl-ec_curve.c'].sha256 && PUB.sources['fips186-2.pdf'] === PINS.files['fips186-2.pdf'].sha256);
const disagree = Object.entries(PUB.agreement).flatMap(([n, d]) => Object.entries(d).filter(([, v]) => v === false).map(([k]) => n + '.' + k));
ok('3  FIPS 186-2 and OpenSSL agree on every NIST field they share', disagree.length === 0, '[' + Object.keys(PUB.agreement).length + ' curves' + (disagree.length ? '; ' + disagree.join(', ') : '') + ']');
ok('4  the five prime and five binary NIST curves and the five X9.62 example curves are present', Object.keys(PUB.fips186_2.prime).length === 5 && Object.keys(PUB.fips186_2.binary).length === 5 && ['prime192v2', 'prime192v3', 'prime239v1', 'prime239v2', 'prime239v3'].every((n) => PUB.openssl[n] && PUB.openssl[n].seed));

/* ---- 2 · the deciders ------------------------------------------------------------------------------- */
const js = D.decideAll();
ok('5  calibration: FIPS\'s printed c for P-256, srand48\'s low bits, B-233\'s normal-basis b', Object.values(js.calibration).every(Boolean), JSON.stringify(js.calibration));
const py = cp.spawnSync('python3', ['-I', path.join(__dirname, 'decide.py'), '--json'], { encoding: 'utf8', maxBuffer: 1 << 26 });
ok('6  the Python decider (int, hashlib) produces the same JSON as the JS one (BigInt, crypto), field for field', py.status === 0 && JSON.stringify(JSON.parse(py.stdout)) === JSON.stringify(js));
const rows = [...Object.values(js.S), ...Object.values(js.D), ...Object.values(js.G)];
ok('7  34 claim rows decided (14 seeds, 14 derivations, 6 base points), none REFUSED or NEEDS DATA', rows.length === 34 && rows.every((r) => r.verdict === 'CERTIFIED' || r.verdict === 'REFUTED'), '[' + rows.filter((r) => r.verdict === 'CERTIFIED').length + ' CERTIFIED, ' + rows.filter((r) => r.verdict === 'REFUTED').length + ' REFUTED]');

/* ---- 3 · the ledger ---------------------------------------------------------------------------------- */
const LP = path.join(ROOT, 'certs', 'curveseeds-ledger.json');
if (!fs.existsSync(LP)) console.log('  (no certs/curveseeds-ledger.json yet — run tools/run-curveseeds-ledger.js; the ledger checks are skipped)');
else {
  const L = J('certs/curveseeds-ledger.json');
  ok('8  the ledger\'s rows equal a fresh decision, verdict for verdict', L.rows.length === rows.length && L.rows.every((r) => { const f = js[r.claim][r.curve]; return f && f.verdict === r.verdict && JSON.stringify(f) === JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'claim' && k !== 'curve'))); }));
  ok('9  the ledger\'s counts sum to its rows and its pins are today\'s', Object.values(L.counts.byVerdict).reduce((a, b) => a + b, 0) === L.rows.length && Object.entries(L.pins).every(([f, h]) => PINS.files[f] && PINS.files[f].sha256 === h));
  ok('10 the ledger records zero cross-check differences and every red control fired', L.crossCheck.differences === 0 && L.redControls.fired === L.redControls.of);
}

/* ---- 4 · the red controls ---------------------------------------------------------------------------- */
const R = D.reds();
for (const [name, certified] of Object.entries(R)) red(name, !certified);
const pyRed = cp.spawnSync('python3', ['-I', path.join(__dirname, 'decide.py'), '--red'], { encoding: 'utf8' });
red('the Python decider\'s red controls all fail too', pyRed.status === 0);
{ const buf = Buffer.from(fs.readFileSync(path.join(ROOT, 'corpus', 'curveseeds', 'sources', 'fips186-2.txt'))); buf[1000] ^= 1; red('a corrupted pin is caught by the hash', sha(buf) !== PINS.files['fips186-2.txt'].sha256); }
{ const a = JSON.parse(JSON.stringify(js)); a.S['P-256'].produced = a.S['P-256'].produced.replace(/^c/, 'd'); red('one differing field between the deciders is a disagreement', JSON.stringify(a) !== JSON.stringify(js)); }

console.log(fails ? '  FAILED (' + fails + ')' : '  ALL PASS   (' + checks + ' checks, ' + redsFired + '/' + reds + ' red controls fired)');
process.exit(fails ? 1 : 0);
