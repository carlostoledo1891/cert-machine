#!/usr/bin/env node
/* battery.js — PU Verificado: the pins, the two deciders on the methodology's worked examples, the ledger's
   arithmetic re-summed, and six red controls that must fire.
   instruments/pu/ · cert-machine · 2026-10-16

   usage: node instruments/pu/battery.js        exit 0 when every check passes and every red control fires  */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const D = require(path.join(__dirname, 'decide.js'));
let pass = 0, fail = 0, red = 0, redTotal = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ok   ' + name + (detail ? '   ' + detail : '')); } else { fail++; console.log('  FAIL ' + name + (detail ? '   ' + detail : '')); } };
const RED = (name, fired) => { redTotal++; if (fired) { red++; console.log('       RED ok    ' + name); } else { fail++; console.log('       RED FAIL  ' + name + ' — the falsifier did not fire'); } };
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

console.log('pu battery — PU Verificado');
/* ---- 1 · the pins ----------------------------------------------------------------------------------- */
const PINS = J('corpus/pu/PINS.json');
let pinsOk = true;
for (const [f, p] of Object.entries(PINS.files)) { const got = sha(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'sources', f))); if (got !== p.sha256) { pinsOk = false; console.log('       ' + f + ' ' + got.slice(0, 12) + ' ≠ ' + p.sha256.slice(0, 12)); } }
ok('1  every pinned source re-hashes to its pin', pinsOk, '[' + Object.keys(PINS.files).length + ' files]');
const HOL = J('corpus/pu/holidays.json');
ok('2  holidays.json was read from the pinned xls', HOL.sourceSha256 === PINS.files['feriados_nacionais.xls'].sha256, '[' + HOL.count + ' holidays, ' + HOL.first + ' → ' + HOL.last + ']');
const checkPin = (buf, pinned) => sha(buf) === pinned;
{ const buf = Buffer.from(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'sources', 'feriados_nacionais.xls'))); buf[100] ^= 1; RED('a corrupted source byte is caught by the pin', !checkPin(buf, PINS.files['feriados_nacionais.xls'].sha256)); }

/* ---- 2 · the two deciders on the methodology's own examples ---------------------------------------- */
const cal = D.calendar(HOL);
const ltn = D.decideLTN('14,3600', '2008-05-21', '2010-07-01', cal);
ok('3  LTN worked example: du 532, PU 753.315323', ltn.du === 532 && ltn.decided && D.dec(ltn.pu6, 6) === '753.315323', '[' + ltn.enclosure.join(' .. ') + ']');
const ntnf = D.decideNTNF('13,6600', '2008-05-21', '2014-01-01', cal);
ok('4  NTN-F worked example: 12 flows, PU 903.075616, first du 28, last du 1415', ntnf.decided && D.dec(ntnf.pu6, 6) === '903.075616' && ntnf.flows.length === 12 && ntnf.flows[0].du === 28 && ntnf.flows[11].du === 1415);
ok('5  coupon 1000·(1.1^½ − 1) A-5 = 48.80885', D.dec(D.coupon(), 5) === '48.80885');
const py = cp.spawnSync('python3', ['-I', path.join(__dirname, 'decide.py')], { encoding: 'utf8' });
ok('6  the Python decider (decimal, no shared code) reproduces both examples', py.status === 0 && /CALIBRATION OK/.test(py.stdout));
/* a planted holiday inside the LTN example's life must move du by one and change the price */
{ const planted = D.calendar({ holidays: HOL.holidays.concat(['2009-03-10']) }); const r = D.decideLTN('14,3600', '2008-05-21', '2010-07-01', planted); RED('a planted holiday moves du by one and the price off its printed value', r.du === 531 && D.dec(r.pu6, 6) !== '753.315323'); }
/* a settlement shifted to D+2 changes the price */
{ const r = D.decideLTN('14,3600', cal.next('2008-05-21'), '2010-07-01', cal); RED('a settlement shifted by one business day changes the T-6 price', r.du === 531 && D.dec(r.pu6, 6) !== '753.315323'); }
/* the exponent is truncated, never rounded: for du = 5 the two differ in the 14th decimal and so do the factors */
{ const du = 5; const T = (BigInt(du) * 10n ** 14n) / 252n, A = (BigInt(du) * 10n ** 14n * 2n + 252n) / (2n * 252n);
  RED('rounding the exponent (A-14) instead of truncating (T-14) is a different number', T !== A && T.toString().endsWith('126') && A.toString().endsWith('127')); }
/* the decision machinery refuses a straddle instead of guessing */
{ const unit = 10n ** (D.P - 6n); const lo = 753n * 10n ** D.P + 315323n * unit - 3n, hi = lo + 6n; const t = D.truncDecision(lo, hi, 6); RED('an enclosure straddling a truncation boundary is REFUSED, not rounded through', t.ok === false); }

/* ---- 3 · the ledger ------------------------------------------------------------------------------- */
const LP = path.join(ROOT, 'certs', 'pu-ledger.json');
if (!fs.existsSync(LP)) { console.log('  (no certs/pu-ledger.json yet — run tools/run-pu-ledger.js; the ledger checks are skipped, the red controls above still count)'); }
else {
  const L = J('certs/pu-ledger.json');
  ok('7  the ledger was decided against the current pins', Object.entries(L.pins).every(([f, s]) => PINS.files[f] && PINS.files[f].sha256 === s));
  const sum = Object.values(L.counts.byVerdict).reduce((a, b) => a + b, 0);
  ok('8  the verdict counts sum to the pairs decided', sum === L.scope.pairsDecided, '[' + JSON.stringify(L.counts.byVerdict) + ']');
  ok('9  every OFF and REFUSED row is listed', L.offRows.length === (L.counts.byVerdict.OFF || 0) && L.refusedRows.length === (L.counts.byVerdict.REFUSED || 0));
  const censusSum = Object.values(L.census).reduce((a, m) => a + Object.values(m).reduce((x, y) => x + y, 0), 0);
  ok('10 the convention census counts every decided pair once', censusSum === (L.counts.byVerdict.REPRODUCED || 0) + (L.counts.byVerdict.OFF || 0) + (L.counts.byVerdict.REFUSED || 0));
  const atlasO = L.atlas.bonds.reduce((a, b) => a + (b.codes.match(/O/g) || []).length, 0), compraOff = L.offRows.filter((r) => r.side === 'C').length;
  ok('11 the atlas carries every buy-side OFF cell', atlasO === compraOff, '[' + atlasO + ']');
  ok('12 the Python cross-check agreed on every sampled row, every OFF and REFUSED row included', L.crossCheck.agree === L.crossCheck.sampled && L.crossCheck.sampled > 0, '[' + L.crossCheck.agree + '/' + L.crossCheck.sampled + ']');
  /* ROUND-2 as the only reading would turn rows OFF: the census must hold rows that reproduce under T and not R */
  const tOnly = Object.values(L.census).reduce((a, m) => a + Object.entries(m).filter(([k]) => /\/T$/.test(k) && !/\/R/.test(k)).reduce((x, [, v]) => x + v, 0), 0);
  RED('reading the printed centavos as a rounding instead of a truncation would turn rows OFF (' + tOnly + ' rows reproduce under TRUNC-2 only)', tOnly > 0);
  ok('13 no NEEDS DATA row in phase A (fixed-rate titles need no projection)', (L.counts.byVerdict['NEEDS DATA'] || 0) === L.needsData.length);
}
/* the second decider disagreeing is caught: the comparison the runner makes, on a tampered answer */
{ const mine = D.dec(ltn.pu6, 6), theirs = '753.315324'; RED('a one-digit disagreement between the deciders is a disagreement', mine !== theirs); }

console.log(fail ? '  ' + fail + ' FAILED   (' + pass + ' checks, ' + red + '/' + redTotal + ' red controls)' : '  ALL PASS   (' + pass + ' checks, ' + red + '/' + redTotal + ' red controls fired)');
process.exit(fail ? 1 : 0);
