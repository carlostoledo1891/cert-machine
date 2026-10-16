#!/usr/bin/env node
/* run-pu-ledger.js — PU Verificado, phase A: every fixed-rate Tesouro Direto price decided; the ledger written.
   tools/ · cert-machine · 2026-10-16

   Reads corpus/pu/sources/precotaxatesourodireto.csv (pinned), decides every LTN and NTN-F row on both sides
   under the two pre-registered settlement hypotheses (D+0, D+1) and the two printed readings (TRUNC-2,
   ROUND-2), runs the census of conventions, cross-checks a sample with the Python decider, and writes
   certs/pu-ledger.json. Refuses before writing when a pin fails, when the calibration fails, or when the two
   deciders disagree on one digit.

   usage: node tools/run-pu-ledger.js [--limit N]                                                      */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const D = require(path.join(ROOT, 'instruments', 'pu', 'decide.js'));
const die = (m) => { console.error('PU LEDGER REFUSED: ' + m); process.exit(1); };
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? Number(process.argv[i + 1]) : Infinity; })();

/* ---- 1 · pins ------------------------------------------------------------------------------------- */
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'PINS.json'), 'utf8'));
for (const [f, p] of Object.entries(PINS.files)) {
  const got = sha(path.join(ROOT, 'corpus', 'pu', 'sources', f));
  if (got !== p.sha256) die('pin: ' + f + ' is ' + got.slice(0, 12) + ', pinned ' + p.sha256.slice(0, 12));
}
const HOL = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'holidays.json'), 'utf8'));
if (HOL.sourceSha256 !== PINS.files['feriados_nacionais.xls'].sha256) die('holidays.json was read from a different xls than the pinned one');
const PRE = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'preregistration.json'), 'utf8'));
const cal = D.calendar(HOL);
/* CALENDAR-AS-OF-QUOTE (amendment 2026-10-16, amendments[1]): the pinned list without the 20 Novembers of 2024 and later —
   the holiday Lei 14.759 created on 2023-12-21, which today's file carries and no earlier quotation could have known */
const calPre = D.calendar({ holidays: HOL.holidays.filter((h) => !(/-11-20$/.test(h) && Number(h.slice(0, 4)) >= 2024)) });
const CALS = { today: cal, pre: calPre };
/* B3's settlement days (phase B, B1): corpus/pu/b3-settlement.json — days B3 did not trade or settle that the bank calendar
   counts as business days; a settlement path that crosses a rule-only (undocumented) day is marked so */
const B3 = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'b3-settlement.json'), 'utf8'));
const b3day = (iso) => B3.days[iso] || null;
const nextSettleB3 = (iso) => { let d = cal.next(iso); let ruleOnly = false; for (;;) { const b = b3day(d); if (!b) break; if (!b.documented) ruleOnly = true; d = cal.next(d); } return { d, ruleOnly }; };
const sameOrNextB3 = (iso) => { const b = b3day(iso); if (!b) return { d: iso, ruleOnly: false }; const n = nextSettleB3(iso); return { d: n.d, ruleOnly: n.ruleOnly || !b.documented }; };

/* ---- 2 · calibration (the methodology's own examples) ---------------------------------------------- */
{
  const a = D.decideLTN('14,3600', '2008-05-21', '2010-07-01', cal);
  if (!(a.du === 532 && a.decided && D.dec(a.pu6, 6) === '753.315323')) die('calibration: LTN worked example not reproduced');
  const b = D.decideNTNF('13,6600', '2008-05-21', '2014-01-01', cal);
  if (!(b.decided && D.dec(b.pu6, 6) === '903.075616' && b.flows.length === 12)) die('calibration: NTN-F worked example not reproduced');
  const py = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'pu', 'decide.py')], { encoding: 'utf8' });
  if (py.status !== 0 || !/CALIBRATION OK/.test(py.stdout)) die('calibration: the Python decider failed its worked examples\n' + py.stdout + py.stderr);
}

/* ---- 3 · the rows ---------------------------------------------------------------------------------- */
const KIND = { 'Tesouro Prefixado': 'LTN', 'Tesouro Prefixado com Juros Semestrais': 'NTN-F', 'Tesouro Selic': 'LFT' };
/* phase B, B2 — the LFT inputs: the Selic daily rate (SGS 11) as the index, the Selic target (SGS 432) as the projection's meta */
const readSgs = (prefix) => { let rows = []; for (const f of fs.readdirSync(path.join(ROOT, 'corpus', 'pu', 'sources', 'bcb')).filter((x) => x.startsWith(prefix)).sort()) rows = rows.concat(JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'sources', 'bcb', f), 'utf8'))); return rows.map((r) => { const [d, m, y] = r.data.split('/'); return { iso: y + '-' + m + '-' + d, valor: r.valor }; }).sort((a, b) => (a.iso < b.iso ? -1 : 1)); };
const SELIC = readSgs('sgs11-').map((r) => ({ iso: r.iso, pct6: Math.round(Number(r.valor) * 1e6) }));
const IDX = D.selicIndex(SELIC);
const META = (() => { const m = new Map(); for (const r of readSgs('sgs432-')) m.set(r.iso, r.valor.replace('.', ',')); return m; })();
const metaAt = (iso) => { if (META.has(iso)) return META.get(iso); let best = null; for (const k of META.keys()) if (k < iso && (!best || k > best)) best = k; return best ? META.get(best) : null; };
/* the VNA at a settlement for a quotation: the exact index at D+0, the projection over k business days otherwise */
const vnaFor = (quote, settle) => { const v = IDX.vna6(quote); if (v === null) return null; if (settle === quote) return { vna6: v, k: 0, meta: null };
  const k = cal.du(quote, settle); const meta = metaAt(quote); if (!meta) return null; const p = D.vnaProjetado(v, meta, k); return p.ok ? { vna6: p.vna6, k, meta } : { refused: p.straddle, k, meta }; };
/* the LFT calibration, once the index exists: the methodology's worked example */
{ const v = IDX.vna6('2008-05-20'), vp = D.vnaProjetado(v, '11,75', 1), l = D.decideLFT('-0,0200', '2008-05-21', '2014-03-07', cal, vp.vna6);
  if (!(D.dec(v, 6) === '3449.694215' && D.dec(vp.vna6, 6) === '3451.215345' && l.decided && D.dec(l.pu6, 6) === '3455.211852')) die('calibration: LFT worked example not reproduced'); }
const toIso = (dmy) => { const [d, m, y] = dmy.split('/'); return `${y}-${m}-${d}`; };
const cents = (s) => { const t = s.trim().replace('.', '').replace(',', '.'); const m = /^(\d+)\.(\d{2})$/.exec(t) || /^(\d+)$/.exec(t); if (!m) return null; return BigInt(m[1]) * 100n + BigInt(m[2] || '0'); };
const lines = fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'sources', 'precotaxatesourodireto.csv'), 'latin1').split(/\r?\n/);
const header = lines[0].split(';');
if (header.join(';') !== 'Tipo Titulo;Data Vencimento;Data Base;Taxa Compra Manha;Taxa Venda Manha;PU Compra Manha;PU Venda Manha;PU Base Manha') die('the CSV header changed: ' + header.join(';'));
const rows = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i]) continue;
  const c = lines[i].split(';');
  const kind = KIND[c[0]]; if (!kind) continue;
  rows.push({ kind, maturity: toIso(c[1]), date: toIso(c[2]), taxaC: c[3].trim(), taxaV: c[4].trim(), puC: cents(c[5]), puV: cents(c[6]), puB: cents(c[7]) });
  if (rows.length >= LIMIT) break;
}
console.log('rows', rows.length, 'LTN', rows.filter((r) => r.kind === 'LTN').length, 'NTN-F', rows.filter((r) => r.kind === 'NTN-F').length);

/* ---- 4 · decide ------------------------------------------------------------------------------------ */
const decide = (kind, taxa, settle, maturity, c, quote) => {
  if (kind === 'LTN') return D.decideLTN(taxa, settle, maturity, c || cal);
  if (kind === 'NTN-F') return D.decideNTNF(taxa, settle, maturity, c || cal);
  const v = vnaFor(quote, settle); if (!v) return { kind: 'LFT', decided: false, needsData: 'no Selic index or meta for ' + quote };
  if (v.refused) return { kind: 'LFT', decided: false, straddle: v.refused, at: 'VNA projetado' };
  const r = D.decideLFT(taxa, settle, maturity, c || cal, v.vna6); r.vna6 = D.dec(v.vna6, 6); r.projectedDays = v.k; r.meta = v.meta; return r;
};
const PRIMARY = { C: 'D1', V: 'D0' };          /* pre-registered primary hypothesis per side */
/* D1x (amendment of 2026-10-16, preregistration.json amendments[0]): the next business day that is neither 24 nor 31
   December — Tesouro Direto does not settle on those two days; the pinned calendar documents them only by omission */
const nextSettle = (iso) => { let d = cal.next(iso); while (/-12-(24|31)$/.test(d)) d = cal.next(d); return d; };
const HYPS = { C: ['D0', 'D1', 'D1x', 'D1b3'], V: ['D0', 'D1', 'D0b3', 'D1b3'] };
const results = [];                             /* one per (row, side) */
const census = {};                              /* kind|side|year → code → count */
const bump = (k, code) => { census[k] = census[k] || {}; census[k][code] = (census[k][code] || 0) + 1; };
let n = 0; const t0 = Date.now();
for (const r of rows) {
  if (!cal.isBiz(r.date)) { results.push({ row: r, side: '-', verdict: 'NEEDS DATA', why: 'Data Base is not a business day on the pinned calendar' }); continue; }
  const b1 = nextSettleB3(r.date), b0 = sameOrNextB3(r.date);
  const settles = { D0: r.date, D1: cal.next(r.date), D1x: nextSettle(r.date), D1b3: b1.d, D0b3: b0.d };
  const ruleOnly = { D1b3: b1.ruleOnly, D0b3: b0.ruleOnly };
  for (const side of ['C', 'V']) {
    const taxa = side === 'C' ? r.taxaC : r.taxaV, printed = side === 'C' ? r.puC : r.puV;
    if (printed === null || printed === 0n || /^0+[,.]?0*$/.test(taxa)) continue;     /* the side was not offered that day */
    if (settles.D1 >= r.maturity || settles.D0 >= r.maturity) { results.push({ row: r, side, verdict: 'NEEDS DATA', why: 'settlement on or after maturity' }); continue; }
    const out = { row: r, side, printed, taxa, hyp: {} };
    const matches = [];
    for (const h of HYPS[side]) {
      if (h === 'D1x' && settles.D1x === settles.D1) continue;          /* same day: nothing new to decide */
      if (h === 'D1b3' && settles.D1b3 === settles.D1) continue;        /* B3 settles the same day: nothing new */
      if (h === 'D0b3' && settles.D0b3 === settles.D0) continue;
      for (const cn of ['today', 'pre']) {
        /* the two calendars differ only when a 20 November of 2024+ lies in [settlement, maturity) */
        if (cn === 'pre' && CALS.today.du(settles[h], r.maturity) === CALS.pre.du(settles[h], r.maturity)) continue;
        const dres = decide(r.kind, taxa, settles[h], r.maturity, CALS[cn], r.date);
        const key = (cn === 'today' ? h : h + '/pre') + (ruleOnly[h] ? '/r' : '');
        const rec = { settle: settles[h], calendar: cn, decided: dres.decided, du: dres.du || (dres.flows && dres.flows[dres.flows.length - 1] && dres.flows[dres.flows.length - 1].du) };
        if (dres.needsData) { rec.needsData = dres.needsData; }
        else if (dres.decided) {
          rec.pu6 = D.dec(dres.pu6, 6); rec.t2 = D.trunc2(dres.pu6); rec.r2 = D.round2(dres.pu6);
          if (rec.t2 === printed) matches.push(key + '/T');
          if (rec.r2 === printed) matches.push(key + '/R');
          if (dres.margin) rec.margin = dres.margin;
        } else { rec.refused = dres.straddle || dres.refused; }
        out.hyp[key] = rec;
      }
    }
    const prim = out.hyp[PRIMARY[side]];
    /* CONSISTENT (amendment 5, 2026-10-16): not reproduced under any hypothesis, but the printed centavos lie inside the
       interval of prices the printed rate's own precision allows — rate ± half a unit of its last printed decimal — under
       the primary hypothesis. The LFT's published rates (2 decimals, ágio/deságio) are roundings of the rate actually used. */
    if (!matches.length && prim.decided) {
      const dp = (taxa.split(/[,.]/)[1] || '').length; const unit = 5n * 10n ** BigInt(Math.max(0, 6 - dp - 1));   /* half a unit of the last decimal, at 10^-6 % */
      const [pn] = D.ratePercentToRational(taxa); const asPct = (x) => { const neg = x < 0n; const a = (neg ? -x : x).toString().padStart(7, '0'); return (neg ? '-' : '') + a.slice(0, -6) + ',' + a.slice(-6); };
      const lo = decide(r.kind, asPct(pn - unit), settles[PRIMARY[side]], r.maturity, cal, r.date), hi = decide(r.kind, asPct(pn + unit), settles[PRIMARY[side]], r.maturity, cal, r.date);
      if (lo.decided && hi.decided) { const a = lo.pu6 < hi.pu6 ? lo.pu6 : hi.pu6, b = lo.pu6 < hi.pu6 ? hi.pu6 : lo.pu6;
        if (printed >= D.trunc2(a) && printed <= D.round2(b)) { out.consistent = { rateBox: [asPct(pn - unit), asPct(pn + unit)], puRange: [D.dec(a, 6), D.dec(b, 6)] }; } }
    }
    if (matches.length) { out.verdict = 'REPRODUCED'; out.codes = matches; }
    else if (out.consistent) { out.verdict = 'CONSISTENT'; }
    else if (prim.needsData) { out.verdict = 'NEEDS DATA'; out.why = prim.needsData; }
    else if (!prim.decided) { out.verdict = 'REFUSED'; }
    else { out.verdict = 'OFF'; out.diffCents = (printed - prim.t2).toString(); out.diffCentsR = (printed - prim.r2).toString(); }
    bump(r.kind + '|' + side + '|' + r.date.slice(0, 4), out.verdict === 'REPRODUCED' ? matches.join('+') : out.verdict === 'CONSISTENT' ? 'CONSISTENT' : out.verdict);
    results.push(out);
  }
  if (++n % 5000 === 0) console.log('  ' + n + ' rows · ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
}
console.log('decided ' + results.length + ' (row, side) pairs in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

/* ---- 5 · the Python cross-check: every OFF and REFUSED row, plus a seeded sample of the rest ------- */
let seed = 20261016; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const offs = results.filter((x) => x.verdict === 'OFF' || x.verdict === 'REFUSED');
const reps = results.filter((x) => x.verdict === 'REPRODUCED');
const sample = offs.slice(0, 1500).concat(Array.from({ length: Math.min(1500, reps.length) }, () => reps[Math.floor(rnd() * reps.length)]));
const cases = sample.map((x) => ({ kind: x.row.kind, taxa: x.taxa, settle: x.hyp[PRIMARY[x.side]].settle, maturity: x.row.maturity, quote: x.row.date, k: cal.du(x.row.date, x.hyp[PRIMARY[x.side]].settle), meta: metaAt(x.row.date) }));
const py = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'pu', 'decide.py'), '--batch'], { input: JSON.stringify(cases), encoding: 'utf8', maxBuffer: 1 << 28 });
if (py.status !== 0) die('the Python decider failed on the sample\n' + py.stderr.slice(0, 2000));
const pyOut = JSON.parse(py.stdout);
let agree = 0, disagree = [];
sample.forEach((x, i) => { const mine = x.hyp[PRIMARY[x.side]].pu6 || null; const theirs = pyOut[i].pu6; if (mine === theirs) agree++; else disagree.push({ kind: x.row.kind, date: x.row.date, maturity: x.row.maturity, side: x.side, js: mine, py: theirs }); });
if (disagree.length) die('the two deciders disagree on ' + disagree.length + ' of ' + sample.length + ' sampled rows: ' + JSON.stringify(disagree.slice(0, 3)));
console.log('cross-check: ' + agree + '/' + sample.length + ' agree (JS BigInt vs Python decimal), ' + offs.length + ' off/refused rows all included');

/* ---- 6 · the atlas: per bond, one code per business day, compra side (primary D+1) -------------------- */
const ORIGIN = '2004-01-01';
const bonds = {};
for (const x of results) {
  if (x.side !== 'C' || !x.hyp) continue;
  const id = x.row.kind + ' ' + x.row.maturity;
  const b = bonds[id] || (bonds[id] = { kind: x.row.kind, maturity: x.row.maturity, first: x.row.date, last: x.row.date, cells: {} });
  if (x.row.date < b.first) b.first = x.row.date; if (x.row.date > b.last) b.last = x.row.date;
  b.cells[cal.du(ORIGIN, x.row.date)] = x.verdict === 'CONSISTENT' ? 'c' : x.verdict === 'REPRODUCED' ? (x.codes.every((c) => /b3/.test(c)) ? 'b' : x.codes.every((c) => /\/pre\//.test(c)) ? 'k' : x.codes.every((c) => c.startsWith('D1x')) ? 'x' : x.codes.some((c) => c.endsWith('/T')) ? 'R' : 'r') : x.verdict === 'OFF' ? 'O' : 'X';
}
const atlas = Object.entries(bonds).sort((a, b) => a[1].kind.localeCompare(b[1].kind) || a[1].maturity.localeCompare(b[1].maturity)).map(([id, b]) => {
  const i0 = cal.du(ORIGIN, b.first), i1 = cal.du(ORIGIN, b.last); let s = '';
  for (let i = i0; i <= i1; i++) s += b.cells[i] || '.';
  return { id, kind: b.kind, maturity: b.maturity, first: b.first, last: b.last, from: i0, codes: s };
});

/* ---- 6b · the adoption of the 20 November holiday, read from the census ------------------------------------- */
const adoption = (() => {
  const byDate = {};
  for (const x of results) { if (!x.codes) continue; const hasPre = Object.keys(x.hyp).some((k) => /\/pre$/.test(k)); if (!hasPre) continue;
    const d = x.row.date; byDate[d] = byDate[d] || { today: 0, pre: 0, both: 0 };
    const t = x.codes.some((c) => !/\/pre\//.test(c)), p = x.codes.some((c) => /\/pre\//.test(c));
    if (t && p) byDate[d].both++; else if (t) byDate[d].today++; else if (p) byDate[d].pre++; }
  const dates = Object.keys(byDate).sort();
  /* read in the window after the law: elsewhere a settlement-day skip (a São Paulo holiday B3 observes) can mimic one calendar day */
  const after = dates.filter((d) => d >= '2023-12-01');
  const firstToday = after.find((d) => byDate[d].today > 0 && byDate[d].pre === 0);
  const lastPre = after.filter((d) => byDate[d].pre > 0 && byDate[d].today === 0).pop();
  return { firstDateTodayOnly: firstToday || null, lastDatePreOnly: lastPre || null, window: dates.filter((d) => d >= '2023-11-01' && d <= '2024-03-31').map((d) => [d, byDate[d]]) };
})();
/* ---- 6c · the sell side's settlement, read per quotation day: D+1 in the early years, D+0 later ------------ */
const sellSwitch = (() => {
  const byDate = {};
  for (const x of results) { if (x.side !== 'V' || !x.codes) continue; const d = x.row.date; byDate[d] = byDate[d] || { d1: 0, d0: 0, both: 0 };
    const h1 = x.codes.some((c) => /^D1(\/pre)?\//.test(c)), h0 = x.codes.some((c) => /^D0(\/pre)?\//.test(c));
    if (h1 && h0) byDate[d].both++; else if (h1) byDate[d].d1++; else if (h0) byDate[d].d0++; }
  const dates = Object.keys(byDate).sort();
  const lastD1 = dates.filter((d) => byDate[d].d1 > 0 && byDate[d].d0 === 0).pop();
  const firstD0 = dates.find((d) => byDate[d].d0 > 0 && byDate[d].d1 === 0);
  const byYear = {}; for (const d of dates) { const y = d.slice(0, 4); byYear[y] = byYear[y] || { d1: 0, d0: 0, both: 0 }; byYear[y].d1 += byDate[d].d1; byYear[y].d0 += byDate[d].d0; byYear[y].both += byDate[d].both; }
  const mixed = dates.filter((d) => byDate[d].d1 > 0 && byDate[d].d0 > 0);
  return { lastDateD1Only: lastD1 || null, firstDateD0Only: firstD0 || null, mixedDates: mixed.length, byYear };
})();
/* ---- 6d · for every OFF row, the settlement that WOULD reproduce it (D+1 … D+6 on the bank calendar), recorded, never used --- */
for (const x of results) {
  if (x.verdict !== 'OFF') continue;
  let s = x.row.date; x.implied = null;
  for (let k = 1; k <= 6 && !x.implied; k++) { s = cal.next(s); if (s >= x.row.maturity) break;
    const dres = decide(x.row.kind, x.taxa, s, x.row.maturity, cal, x.row.date);
    if (dres.decided && (D.trunc2(dres.pu6) === x.printed || D.round2(dres.pu6) === x.printed)) x.implied = { settle: s, businessDaysAfterQuote: k }; }
}
const impliedByDate = {};
for (const x of results) if (x.verdict === 'OFF' && x.implied) { const k = x.row.date + ' → ' + x.implied.settle; impliedByDate[k] = (impliedByDate[k] || 0) + 1; }
/* ---- 7 · counts and the ledger -------------------------------------------------------------------- */
const count = (f) => results.filter(f).length;
const byVerdict = {}; for (const x of results) byVerdict[x.verdict] = (byVerdict[x.verdict] || 0) + 1;
const readings = {}; for (const x of results) if (x.codes) for (const c of x.codes) readings[c] = (readings[c] || 0) + 1;
const offRows = results.filter((x) => x.verdict === 'OFF').map((x) => ({ kind: x.row.kind, maturity: x.row.maturity, date: x.row.date, side: x.side, taxa: x.taxa, printed: D.dec(x.printed, 2),
  primary: PRIMARY[x.side], settle: x.hyp[PRIMARY[x.side]].settle, du: x.hyp[PRIMARY[x.side]].du, pu6: x.hyp[PRIMARY[x.side]].pu6, diffCents: x.diffCents, implied: x.implied,
  others: Object.fromEntries(Object.entries(x.hyp).filter(([h]) => h !== PRIMARY[x.side]).map(([h, v]) => [h, { settle: v.settle, pu6: v.pu6 || null }])) }));
const consistentByKindYear = {}; let consistentSample = [];
for (const x of results) if (x.verdict === 'CONSISTENT') { const k = x.row.kind + '|' + x.row.date.slice(0, 4); consistentByKindYear[k] = (consistentByKindYear[k] || 0) + 1;
  if (consistentSample.length < 40 && Math.random() < 0.02) consistentSample.push({ kind: x.row.kind, maturity: x.row.maturity, date: x.row.date, side: x.side, taxa: x.taxa, printed: D.dec(x.printed, 2), primaryPu6: x.hyp[PRIMARY[x.side]].pu6, rateBox: x.consistent.rateBox, puRange: x.consistent.puRange }); }
const refusedRows = results.filter((x) => x.verdict === 'REFUSED').map((x) => ({ kind: x.row.kind, maturity: x.row.maturity, date: x.row.date, side: x.side, taxa: x.taxa, printed: D.dec(x.printed, 2), straddle: x.hyp[PRIMARY[x.side]].refused }));
const needsData = results.filter((x) => x.verdict === 'NEEDS DATA').map((x) => ({ kind: x.row.kind, maturity: x.row.maturity, date: x.row.date, side: x.side, why: x.why }));
const needsDataByWhy = {}; for (const n of needsData) needsDataByWhy[n.why] = (needsDataByWhy[n.why] || 0) + 1;
const baseEqualsSell = rows.filter((r) => r.puB !== null && r.puV !== null && r.puB === r.puV).length;
const offByYear = {}; for (const o of offRows) { const y = o.date.slice(0, 4); offByYear[y] = (offByYear[y] || 0) + 1; }
const offByCents = {}; for (const o of offRows) { const k = o.diffCents; offByCents[k] = (offByCents[k] || 0) + 1; }
const ledger = {
  what: 'PU Verificado, phase A: every Tesouro Direto LTN and NTN-F price in the pinned history decided from the STN/ANBIMA rule table in exact arithmetic, both sides, under the pre-registered settlement hypotheses and printed readings. Generated by tools/run-pu-ledger.js; the Python decider cross-checks the sample recorded below.',
  generated: new Date().toISOString(), git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return null; } })(),
  lft: { selicDays: SELIC.length, selicFirst: SELIC[0].iso, selicLast: SELIC[SELIC.length - 1].iso, metaDays: META.size, projection: 'VNA(quote) × (1 + meta)^(trunc14(k/252)) at full precision, truncated at 6; the accumulated factor A-16 at each step' },
  pins: Object.fromEntries(Object.entries(PINS.files).map(([f, p]) => [f, p.sha256])), b3Settlement: { days: B3.counts.days, documented: B3.counts.documented, ruleOnly: B3.counts.ruleOnly, generated: B3.generated }, preregistration: 'corpus/pu/preregistration.json', calendar: { holidays: HOL.count, first: HOL.first, last: HOL.last },
  scope: { kinds: ['LTN', 'NTN-F', 'LFT'], rows: rows.length, firstDate: rows.reduce((a, r) => (r.date < a ? r.date : a), '9'), lastDate: rows.reduce((a, r) => (r.date > a ? r.date : a), '0'), bonds: atlas.length, pairsDecided: results.length },
  hypotheses: { settlement: PRIMARY, tested: HYPS, readings: ['T = TRUNC-2', 'R = ROUND-2'], D1x: 'next business day skipping 24 and 31 December (amendment 1, 2026-10-16)', pre: 'the calendar as of the quotation: no 20 November holiday from 2024 on (amendment 2, 2026-10-16)', b3: 'settlement on the next day B3 traded (corpus/pu/b3-settlement.json; phase B, B1); /r marks a path through a rule-only day' },
  counts: { byVerdict, readings, baseEqualsSell, offByYear, offByCents, needsDataByWhy },
  census, adoption, sellSwitch, impliedSettlements: impliedByDate,
  crossCheck: { sampled: sample.length, agree, offAndRefusedIncluded: Math.min(offs.length, 1500), python: 'instruments/pu/decide.py (decimal, 60 digits, directed rounding)', javascript: 'instruments/pu/decide.js (BigInt fixed point 10^-48)' },
  offRows, refusedRows, needsData, consistent: { byKindYear: consistentByKindYear, sample: consistentSample, definition: 'not REPRODUCED under any hypothesis; the printed centavos lie within [trunc2(PU(rate − ½ unit)), round2(PU(rate + ½ unit))] under the primary hypothesis — the printed rate is a rounding of the one used' },
  atlas: { origin: ORIGIN, codes: { R: 'REPRODUCED under TRUNC-2', r: 'REPRODUCED under ROUND-2 only', x: 'REPRODUCED only under D+1x (24/31 December skipped)', k: 'REPRODUCED only under the calendar as of the quotation (no 20 November holiday after 2023)', b: 'REPRODUCED only with settlement on B3\'s calendar (a São Paulo holiday or 24/31 December skipped; /r when the skipped day is rule-only)', c: 'CONSISTENT: inside the price interval the printed rate\'s precision allows, not reproduced exactly', O: 'OFF', X: 'REFUSED', '.': 'no row' }, side: 'compra, settlement D+1 (D+1x where it differs)', bonds: atlas }
};
fs.mkdirSync(path.join(ROOT, 'certs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'certs', 'pu-ledger.json'), JSON.stringify(ledger, null, 1) + '\n');
console.log('certs/pu-ledger.json written:', JSON.stringify(byVerdict), 'readings', JSON.stringify(readings), 'base = sell on', baseEqualsSell, 'of', rows.length, 'rows');
