#!/usr/bin/env node
/* instruments/sumdiff/battery.js — the entropy certificates for C3b and C3c, calibrated where the ratio is
   known in closed form, the claimants' files re-hashed against their pins, the registry's two asterisked
   bounds decided, and red controls that must fire: a reader that rounds big integers, weights that do not sum
   to one, a negative weight, a repeated point, a claim a double cannot separate from the truth, a precision
   too low to decide, and an exact equality — each must be refused or refuted, never certified.

   Prints: "sumdiff battery: N pass, 0 fail, R/R red controls fired". */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const S = require('./sumdiff.js');
const B = require('../bigfloat/bigfloat.js');
const F = require('../bigfloat/functions.js');

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };
const refuses = (f) => { try { f(); return false; } catch (e) { return /REFUSED|not an integer|unsafe/.test(e.message); } };

const CORPUS = path.join(ROOT, 'corpus', 'optimization-constants');
const M = JSON.parse(fs.readFileSync(path.join(CORPUS, 'meta.json'), 'utf8'));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(CORPUS, f))).digest('hex');
const cert = (f) => S.readCertificate(S.parseExact(fs.readFileSync(path.join(CORPUS, f), 'utf8')));

/* ---- the pins: every file the ledger reads is the file that was fetched ---- */
ok(Object.entries(M.files).every(([f, h]) => sha(f) === h), 'every pinned file re-hashes to its sha256 (' + Object.keys(M.files).length + ' files)');
{
  const man = fs.readFileSync(path.join(CORPUS, 'mi2026', 'MANIFEST.sha256'), 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/));
  ok(man.length === 13 && man.every(([h, f]) => sha(path.join('mi2026', f.replace(/^\.\//, ''))) === h), 'the Mosaic Intelligence archive matches its own manifest, file for file');
}

/* ---- calibration: laws whose ratio is known exactly ---- */
{
  const P = 256;
  /* X, Y independent fair bits: H(X) = H(Y) = ln 2, H(X ± Y) = (3/2) ln 2, so the 3b ratio is exactly 1 */
  const bits = S.door({ problem: '3b', pts: [[0n, 0n, 1n], [0n, 1n, 1n], [1n, 0n, 1n], [1n, 1n, 1n]], den: 4n });
  const ln2 = F.ln2(P), HX = S.entropy(bits, [1, 0], P), HD = S.entropy(bits, [1, -1], P);
  const threeHalf = B.mul(B.fromRatio(3n, 2n, P), ln2, P);
  ok(B.cmp(HX.lo, ln2.hi) <= 0 && B.cmp(ln2.lo, HX.hi) <= 0 && B.cmp(HD.lo, threeHalf.hi) <= 0 && B.cmp(threeHalf.lo, HD.hi) <= 0, 'two fair bits: H(X) encloses ln 2 and H(X − Y) encloses (3/2) ln 2');
  ok(S.decide(bits, '0.999').verdict === 'CERTIFIED' && S.decide(bits, '1.001').verdict === 'REFUTED', 'two fair bits: the ratio 1 certifies 0.999 and refutes 1.001');
  red(S.decide(bits, '1').verdict === 'REFUSED', 'an exact equality (ratio = 1, claim 1) is REFUSED at every precision, never certified');
  /* X uniform on four values, Y ≡ 0: every entropy is ln 4 */
  const four = S.door({ problem: '3c', pts: [[0n, 0n, 1n], [1n, 0n, 1n], [2n, 0n, 1n], [3n, 0n, 1n]], den: 4n });
  const H4 = S.ratio(four, P);
  ok(S.decide(four, '0.9999').verdict === 'CERTIFIED' && S.decide(four, '1.0001').verdict === 'REFUTED' && B.cmp(H4.HT.lo, B.mul(B.fromInt(2), ln2, P).hi) <= 0, 'a uniform X on four points with Y constant: every entropy is ln 4, the ratio 1');
}

/* ---- the certificates ---- */
const C3B = cert('mi2026/c3b_pr92/certificate_3b_13pt.json');
const C95 = cert('mi2026/c3c_pr93/certificate_3c_v3_95pt.json');
const C147 = cert('l2026/certificate_3c_147pt.json');
ok(C3B.pts.length === 13 && C95.pts.length === 95 && C147.pts.length === 147, 'the three certificates read: 13, 95 and 147 points, each summing to exactly 1');
{
  const d = S.decide(C3B, '1.77898884');
  ok(d.verdict === 'CERTIFIED', 'C3b >= 1.77898884, the registry\'s asterisked bound: CERTIFIED at ' + d.P + ' bits, ρ in ' + S.digits(d.R.rho, 24).join(' … '));
  ok(S.decide(C3B, '1.778988841420693549').verdict === 'CERTIFIED' && S.decide(C3B, '1.778988841420693550').verdict === 'REFUTED', 'the certificate\'s printed "true value" 1.778988841420693549 is a truncation of the certified ratio');
  ok(S.decide(C3B, '1.77898').verdict === 'CERTIFIED', 'it improves the previous record 1.77898');
}
{
  const d = S.decide(C95, '1.6747338950208249'), d39 = S.decide(C95, '1.674733895020824993378207577602265184970');
  ok(d.verdict === 'CERTIFIED' && d39.verdict === 'CERTIFIED', 'the superseded 95-point C3c certificate: 1.6747338950208249 and its 39-digit string CERTIFIED');
}
{
  const d = S.decide(C147, '1.6747338950414058'), d60 = S.decide(C147, '1.674733895041405870063135756722213999136383713818148696811828');
  ok(d.verdict === 'CERTIFIED' && d60.verdict === 'CERTIFIED', 'C3c >= 1.6747338950414058, the registry\'s asterisked bound, and the certificate\'s 60-digit string: CERTIFIED (' + d60.P + ' bits for the 60 digits)');
  /* the improvement the registry prints: 2.06e-11 over the 95-point certificate */
  const P = 256, a = S.ratio(C147, P).rho, b = S.ratio(C95, P).rho, gap = B.sub(a, b, P), lo = B.fromRatio(2058n, 10n ** 14n, P), hi = B.fromRatio(2059n, 10n ** 14n, P);
  ok(B.cmp(gap.lo, lo.hi) > 0 && B.cmp(gap.hi, hi.lo) < 0, 'the 147-point ratio exceeds the 95-point one by a certified 2.058…e-11 (the registry prints 2.06 × 10⁻¹¹)');
  /* the certificate says the four constrained entropies agree to 33 digits */
  const Hs = S.ratio(C147, P).Hs, lo0 = Hs.map((h) => h.lo).reduce((x, y) => (B.cmp(x, y) <= 0 ? x : y)), hi0 = Hs.map((h) => h.hi).reduce((x, y) => (B.cmp(x, y) >= 0 ? x : y));
  const spread = B.sub(B.I(hi0), B.I(lo0), P);
  ok(B.cmp(spread.hi, B.fromRatio(1n, 10n ** 33n, P).lo) < 0, 'H(X), H(Y), H(X+Y) and H(X+2Y) of the 147-point law agree to 33 digits, as the certificate says');
}

/* ---- red controls ---- */
{
  const raw = fs.readFileSync(path.join(CORPUS, 'l2026', 'certificate_3c_147pt.json'), 'utf8');
  red(refuses(() => S.readCertificate(JSON.parse(raw))), 'a reader that parses the 320-digit numerators as doubles is refused at the door, never decided');
  const c = cert('l2026/certificate_3c_147pt.json');
  red(refuses(() => S.door({ problem: c.problem, den: c.den, pts: c.pts.map((p, i) => (i ? p : [p[0], p[1], p[2] + 1n])) })), 'one numerator raised by one (weights summing to 1 + 10⁻³²⁰) is refused at the door');
  red(refuses(() => S.door({ problem: '3b', den: 4n, pts: [[0n, 0n, 3n], [1n, 0n, 2n], [0n, 1n, -1n]] })), 'a negative weight is refused at the door');
  red(refuses(() => S.door({ problem: '3b', den: 4n, pts: [[0n, 0n, 1n], [0n, 0n, 1n], [1n, 1n, 2n]] })), 'a point listed twice is refused at the door');
  /* three decimal strings that are the same double: a comparison in floating point cannot tell the true bound from a false one */
  const truth60 = '1.674733895041405870063135756722213999136383713818148696811828', falseClaim = '1.6747338950414059';
  const same = Number(falseClaim) === Number(truth60) && Number('1.6747338950414058800') === Number(truth60);
  red(same && S.decide(C147, falseClaim).verdict === 'REFUTED' && S.decide(C147, '1.6747338950414058800').verdict === 'REFUTED', 'C3c >= 1.6747338950414059 is FALSE, and as a double it equals the true 60-digit bound: this instrument REFUTES it where a double-precision comparison cannot');
  red(S.decide(C3B, '1.778988841420693549', [16]).verdict === 'REFUSED', 'at 16 bits the 19-digit C3b claim is REFUSED, not certified: precision too low to decide is a refusal');
}

/* ---- the ledger and the second implementation ---- */
{
  const cp = require('child_process');
  let led = false, py = '';
  try { led = /identical/.test(cp.execFileSync(process.execPath, [path.join(ROOT, 'tools', 'run-sumdiff-ledger.js'), '--check'], { encoding: 'utf8' })); } catch (e) { led = false; }
  ok(led, 'certs/sumdiff-ledger.json re-derived from the pinned certificates and this code: identical');
  try { py = cp.execFileSync('python3', [path.join(ROOT, 'tools', 'verify_sumdiff.py')], { encoding: 'utf8' }); } catch (e) { py = ''; }
  ok((py.match(/^CERTIFIED/gm) || []).length === 4 && /fired\s+RED control/.test(py), 'tools/verify_sumdiff.py, the standard library alone, certifies the same four claims and refutes the false one');
}

console.log('sumdiff battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
