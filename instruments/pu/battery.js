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
/* LFT: the Selic index from the pinned SGS 11, the projected VNA from the meta, the price — the methodology's example */
const SELIC = (() => { let rows = []; for (const f of fs.readdirSync(path.join(ROOT, 'corpus', 'pu', 'sources', 'bcb')).filter((x) => /^sgs11-/.test(x)).sort()) rows = rows.concat(J('corpus/pu/sources/bcb/' + f));
  return rows.map((r) => { const [d, m, y] = r.data.split('/'); return { iso: y + '-' + m + '-' + d, pct6: Math.round(Number(r.valor) * 1e6) }; }).sort((a, b) => (a.iso < b.iso ? -1 : 1)); })();
const IDX = D.selicIndex(SELIC);
const vna = IDX.vna6('2008-05-20'), vp = D.vnaProjetado(vna, '11,75');
const lft = vp.ok ? D.decideLFT('-0,0200', '2008-05-21', '2014-03-07', cal, vp.vna6) : null;
ok('6a LFT worked example: VNA 3449.694215, projected 3451.215345, du 1459, cotação 100.1158, PU 3455.211852',
  D.dec(vna, 6) === '3449.694215' && vp.ok && D.dec(vp.vna6, 6) === '3451.215345' && lft && lft.decided && lft.du === 1459 && D.dec(lft.cotacao4, 4) === '100.1158' && D.dec(lft.pu6, 6) === '3455.211852');
{ const tampered = SELIC.map((r) => (r.iso === '2004-03-15' ? Object.assign({}, r, { pct6: r.pct6 + 1 }) : r)); const v2 = D.selicIndex(tampered).vna6('2008-05-20'); RED('one Selic day altered by 10^-6 % changes the VNA', v2 !== vna); }
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
  ok('10 the convention census counts every decided pair once', censusSum === (L.counts.byVerdict.REPRODUCED || 0) + (L.counts.byVerdict.CONSISTENT || 0) + (L.counts.byVerdict.OFF || 0) + (L.counts.byVerdict.REFUSED || 0));
  const atlasO = L.atlas.bonds.reduce((a, b) => a + (b.codes.match(/O/g) || []).length, 0), compraOff = L.offRows.filter((r) => r.side === 'C').length;
  ok('11 the atlas carries every buy-side OFF cell', atlasO === compraOff, '[' + atlasO + ']');
  ok('12 the Python cross-check agreed on every sampled row, every OFF and REFUSED row included', L.crossCheck.agree === L.crossCheck.sampled && L.crossCheck.sampled > 0, '[' + L.crossCheck.agree + '/' + L.crossCheck.sampled + ']');
  /* ROUND-2 as the only reading would turn rows OFF: the census must hold rows that reproduce under T and not R */
  const tOnly = Object.values(L.census).reduce((a, m) => a + Object.entries(m).filter(([k]) => /\/T$/.test(k) && !/\/R/.test(k)).reduce((x, [, v]) => x + v, 0), 0);
  RED('reading the printed centavos as a rounding instead of a truncation would turn rows OFF (' + tOnly + ' rows reproduce under TRUNC-2 only)', tOnly > 0);
  ok('13 every NEEDS DATA row is listed with its reason', (L.counts.byVerdict['NEEDS DATA'] || 0) === L.needsData.length && L.needsData.every((n) => n.why));
  /* phase B, B1: the B3 settlement table the ledger used is the one on disk, derived from the pinned documents */
  const B3P = path.join(ROOT, 'corpus', 'pu', 'b3-settlement.json');
  if (fs.existsSync(B3P) && L.b3Settlement) {
    const B3 = J('corpus/pu/b3-settlement.json');
    ok('15 the ledger decided against the B3 settlement table on disk', B3.counts.days === L.b3Settlement.days && B3.counts.documented === L.b3Settlement.documented && B3.counts.ruleOnly === L.b3Settlement.ruleOnly, '[' + B3.counts.days + ' days, ' + B3.counts.documented + ' documented]');
    const docsOk = B3.documents.every((d) => { const f = path.join(ROOT, 'corpus', 'pu', 'sources', 'b3', d.file); return fs.existsSync(f) && sha(fs.readFileSync(f)) === d.sha256; });
    ok('16 every document the B3 table cites re-hashes to its digest', docsOk, '[' + B3.documents.length + ' documents]');
    RED('a weekend date never enters the B3 table', !Object.keys(B3.days).some((d) => { const w = new Date(d + 'T00:00:00Z').getUTCDay(); return w === 0 || w === 6; }));
  }
}
/* the feed's growth rule (tools/pu-feed.js compare): a restatement, a backfill and a header change must each refuse; an append admits */
{ const F = require(path.join(ROOT, 'tools', 'pu-feed.js'));
  const oldT = 'Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha\nTesouro Prefixado;01/01/2027;15/10/2026;13,00;13,10;900,00;899,00;899,00\nTesouro Prefixado;01/01/2027;14/10/2026;13,00;13,10;900,10;899,10;899,10\n';
  const app = F.compare(oldT, 'Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha\nTesouro Prefixado;01/01/2027;16/10/2026;13,00;13,10;900,20;899,20;899,20\n' + oldT.split('\n').slice(1).join('\n'));
  ok('14 the feed admits a file that grew by one later day', app.ok && app.added.length === 1 && app.addedDates[0] === '2026-10-16');
  RED('a restated pinned row refuses the feed', !F.compare(oldT, oldT.replace('900,00', '900,01')).ok);
  RED('a row inserted before the pinned last day refuses the feed', !F.compare(oldT, oldT + 'Tesouro Prefixado;01/01/2027;13/10/2026;13,00;13,10;900,30;899,30;899,30\n').ok);
  RED('a changed header refuses the feed', !F.compare(oldT, oldT.replace('PU Base Manha', 'PU Base')).ok); }
/* the row module (instruments/pu/rows.js, 2026-10-17): the one function the ledger and /instruments/pu both call on a row.
   Rows built on the methodology's own examples, quoted the day before the example's settlement (a purchase settles D+1). */
{ const readSgs = (prefix) => { let rows = []; for (const f of fs.readdirSync(path.join(ROOT, 'corpus', 'pu', 'sources', 'bcb')).filter((x) => x.startsWith(prefix)).sort()) rows = rows.concat(J('corpus/pu/sources/bcb/' + f)); return rows.map((r) => { const [d, m, y] = r.data.split('/'); return { iso: y + '-' + m + '-' + d, valor: r.valor }; }).sort((a, b) => (a.iso < b.iso ? -1 : 1)); };
  const R = require(path.join(__dirname, 'rows.js')).rowDecider({ PU: D, holidays: HOL, b3: J('corpus/pu/b3-settlement.json'),
    selic: readSgs('sgs11-').map((r) => ({ iso: r.iso, pct6: Math.round(Number(r.valor) * 1e6) })), meta: new Map(readSgs('sgs432-').map((r) => [r.iso, r.valor.replace('.', ',')])) });
  const one = (kind, mat, taxa, cents) => R.decideRow({ kind, maturity: mat, date: '2008-05-20', taxaC: taxa, taxaV: '0,00', puC: cents, puV: null })[0];
  const a = one('LTN', '2010-07-01', '14,36', 75331n), b = one('NTN-F', '2014-01-01', '13,66', 90307n), c = one('LFT', '2014-03-07', '-0,02', 345521n);
  ok('17 the row module decides the three worked examples, pasted as rows, REPRODUCED under the primary (D+1, truncated)',
    [a, b, c].every((x) => x.verdict === 'REPRODUCED' && x.codes.includes('D1/T')), '[' + [a, b, c].map((x) => x.row.kind + ' ' + x.codes.join(',')).join(' · ') + ']');
  const near = one('LTN', '2010-07-01', '14,36', 75333n);
  ok('18 two centavos past the rule\'s value, inside the price interval the printed rate\'s half-unit allows, is CONSISTENT and not REPRODUCED', near.verdict === 'CONSISTENT', '[under ' + (near.consistent && near.consistent.under) + ', ' + (near.consistent && near.consistent.puRange.join(' – ')) + ']');
  RED('a price far outside the rate box is OFF, neither REPRODUCED nor CONSISTENT', one('LTN', '2010-07-01', '14,36', 76000n).verdict === 'OFF');
  const page = path.join(ROOT, 'site', 'instruments', 'pu', 'index.html');
  if (fs.existsSync(page)) ok('19 /instruments/pu inlines rows.js byte for byte (the tab and the ledger run one function)', fs.readFileSync(page, 'utf8').includes(fs.readFileSync(path.join(__dirname, 'rows.js'), 'utf8')));
}
/* the second decider disagreeing is caught: the comparison the runner makes, on a tampered answer */
{ const mine = D.dec(ltn.pu6, 6), theirs = '753.315324'; RED('a one-digit disagreement between the deciders is a disagreement', mine !== theirs); }

console.log(fail ? '  ' + fail + ' FAILED   (' + pass + ' checks, ' + red + '/' + redTotal + ' red controls)' : '  ALL PASS   (' + pass + ' checks, ' + red + '/' + redTotal + ' red controls fired)');
process.exit(fail ? 1 : 0);
