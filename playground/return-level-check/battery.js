#!/usr/bin/env node
/* playground/return-level-check/battery.js — THE decision of a fit someone printed (printed.js), one module for the
   return-level check and the return-level atlas, decided on known cases: the Campos cell's 384 monthly maxima (the
   atlas's pinned file), certified by the ledger's own fit.js; the certified fits printed back REPRODUCED and
   CONSISTENT; red controls that must fire (a scale 2% off, a negative shape, a GEV whose end falls below the record,
   a location above every value, digits that are not a plain decimal); the printed design table's ledger
   (certs/design-table-audit.json) re-derived whole, its GEV sign convention shown load-bearing; and neither page holding
   a ladder of its own.
   It lives beside the module, not in instruments/hseva, whose bytes the atlas's served commit pins.

   Prints: "printed-fit battery: N pass, 0 fail, R/R red controls fired". */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const FT = require(path.join(ROOT, 'instruments', 'hseva', 'fit.js'));
const { FAMILIES } = require(path.join(ROOT, 'instruments', 'hseva', 'families.js'));
const BR = require(path.join(ROOT, 'instruments', 'hseva', 'blockrule.js'));
const PR = require(path.join(__dirname, 'printed.js'));

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.error('FAIL ' + name); } };
const red = (fired, name) => { reds++; if (fired) { redsFired++; pass++; } else { fail++; console.error('RED DID NOT FIRE ' + name); } };

const H = { FT, FAM: { FAMILIES } };
const CP = path.join(ROOT, 'corpus', 'ww3-grid', 'cells', '-22.5_-40.i16'), MP = path.join(ROOT, 'corpus', 'ww3-grid', 'meta.json');
const M = JSON.parse(fs.readFileSync(MP, 'utf8')), buf = fs.readFileSync(CP);
const v = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2), d0 = Date.parse(M.first + 'T00:00:00Z'), t = [], h = [];
for (let i = 0; i < v.length; i++) { t.push(new Date(d0 + i * 864e5).toISOString().slice(0, 10)); h.push(v[i] / 500); }
const BM = BR.blockMaxima({ n: v.length, t, h, den: 500, step: 24 }, 'monthly'), T = [100, 1000];
const rec = (f) => PR.recordOf(H, FT.certify(f, BM.x), T, BM.hours);
const W = rec('weibull'), G = rec('gev');
const say = (f, fit, strs, loc, pending) => PR.decide(H, { f, strs, loc: loc || '', x: BM.x, hours: BM.hours, fit, lognormal: null, T, pending: pending || null });
const mid = (r) => r.box.map((b) => (b[0] + b[1]) / 2);

ok(W.certified && G.certified && BM.n === 384, 'the Campos cell\'s 384 monthly maxima: the Weibull and the GEV certified');
const w4 = mid(W).map((m) => m.toFixed(4)), g4 = mid(G).map((m) => m.toFixed(4));
ok(say('weibull', W, w4).code === 'REPRODUCED' && say('gev', G, g4).code === 'REPRODUCED', 'the certified Weibull and GEV printed to four decimals (' + w4.join(', ') + ' · ' + g4.join(', ') + ') are REPRODUCED');
ok(say('weibull', W, mid(W).map((m) => m.toPrecision(15))).code === 'CONSISTENT', 'fifteen significant digits of the certified Weibull lie inside its box: CONSISTENT');
ok(/regular maximum/.test(say('gev', G, g4).verdict), 'a GEV verdict names the regular maximum (its likelihood has no global one)');
{ const p = say('weibull', W, w4, '', 'certify first'); ok(p.code === null && p.lines[0] === 'certify first', 'nothing certified yet: the page\'s own words, no verdict'); }
ok(say('weibull', W, w4).lines.some((l) => /^100-year level over every value the printed digits allow: \[5\.143, 5\.143\] m; the certified fit's: 5\.143 m\.$/.test(l)), 'the printed fit\'s 100-year level over its digits, beside the certified fit\'s (5.143 m)');
red(say('weibull', W, [w4[0], (mid(W)[1] * 1.02).toFixed(4)]).code === 'OFF THE MAXIMUM', 'a printed Weibull scale 2% off the certified one is OFF THE MAXIMUM, its likelihood proved lower');
red(say('weibull', W, ['-5.6', '3.6']).code === 'NOT A MEMBER OF THE FAMILY', 'a negative printed shape is NOT A MEMBER OF THE FAMILY, decided before anything is certified');
red(say('gev', G, ['3.12', '0.56', '-0.5']).code === 'OUTSIDE ITS SUPPORT', 'a printed GEV whose upper end μ − σ/ξ = 4.24 m lies below the record 5.56 m is OUTSIDE ITS SUPPORT');
red(say('weibull', W, w4, '9').code === 'OUTSIDE ITS SUPPORT', 'a printed location above every value is OUTSIDE ITS SUPPORT');
let threw = false; try { say('weibull', W, ['5.6e0', '3.6']); } catch (e) { threw = /plain decimal/.test(e.message); }
red(threw, 'digits that are not a plain decimal are refused, never read loosely');
/* the printed design table (certs/design-table-audit.json): re-derived whole, and the sign convention of its GEV load-bearing */
{
  const cp = require('child_process');
  let okCheck = false; try { okCheck = /identical/.test(cp.execFileSync(process.execPath, [path.join(ROOT, 'tools', 'run-design-table-audit.js'), '--check'], { encoding: 'utf8' })); } catch (e) { okCheck = false; }
  ok(okCheck, 'certs/design-table-audit.json re-derived from the table, the pinned cells and this code: identical');
  const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'design-table-audit.json'), 'utf8'));
  const r16 = L.rows.find((r) => r.la === 16), c16 = r16.cells[0], cell = M.cells.find((c) => c.id === c16.id);
  const b16 = fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-grid', cell.file)), v16 = new Int16Array(b16.buffer, b16.byteOffset, b16.length / 2), t16 = [], h16 = [];
  for (let i = 0; i < v16.length; i++) { t16.push(new Date(d0 + i * 864e5).toISOString().slice(0, 10)); h16.push(v16[i] / 500); }
  const A16 = BR.blockMaxima({ n: v16.length, t: t16, h: h16, den: 500, step: 24 }, 'annual'), G16 = PR.recordOf(H, FT.certify('gev', A16.x), T, A16.hours);
  const asPrinted = ['2.16', '0.17', '0.09'];   /* the table's k = 0.09 read as ξ, its sign unchanged */
  ok(c16.decided.gevML.verdict === 'OUTSIDE ITS SUPPORT' && c16.decided.gevML.digits.join(' ') === '2.16 0.17 -0.09', 'LA16\'s GEV (k = 0.09, so ξ = −0.09: an upper end at 4.05 m) is OUTSIDE ITS SUPPORT at the nearest cell, whose record reaches ' + c16.max + ' m');
  red(PR.decide(H, { f: 'gev', strs: asPrinted, loc: '', x: A16.x, hours: A16.hours, fit: G16, lognormal: null, T }).code !== c16.decided.gevML.verdict, 'reading the table\'s k as ξ with its sign unchanged gives another verdict: the convention is load-bearing');
}
/* one module: neither page keeps a ladder of its own, and both builds inline this one */
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const appC = read('playground', 'return-level-check', 'app.js'), appA = read('playground', 'return-level-atlas', 'app.js');
ok(![appC, appA].some((a) => /OFF THE MAXIMUM —|NOT THE CERTIFIED FIT —|function relation/.test(a)) && /printed\.js/.test(read('playground', 'return-level-check', 'build.js')) && /printed\.js/.test(read('playground', 'return-level-atlas', 'build.js')),
  'the decision lives in printed.js alone: neither page\'s app.js holds a ladder of its own, both builds inline the module');

console.log('printed-fit battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired');
process.exit(fail ? 1 : 0);
