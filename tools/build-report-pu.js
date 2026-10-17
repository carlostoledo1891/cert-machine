#!/usr/bin/env node
/* build-report-pu.js — reports/pu-verificado.html: every fixed-rate Tesouro Direto price re-decided from the
   official rule table. Every number is read from certs/pu-ledger.json (tools/run-pu-ledger.js), whose battery is
   run here before a word is written; the two worked examples are re-decided live for the certificate section.

   usage: node tools/build-report-pu.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const D = require(path.join(ROOT, 'instruments', 'pu', 'decide.js'));
const die = (m) => { console.error('PU REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n) => Number(n).toLocaleString('en-US');
const pct = (a, b) => (100 * a / b).toFixed(2) + '%';

/* the battery first — it re-hashes the pins and re-sums the ledger */
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'pu', 'battery.js')], { encoding: 'utf8' });
const bm = /ALL PASS\s+\((\d+) checks, (\d+)\/(\d+) red controls fired\)/.exec(bat.stdout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the battery did not pass whole:\n' + bat.stdout.slice(-1500));
const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'pu-ledger.json'), 'utf8'));
const PRE = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'preregistration.json'), 'utf8'));
const HOL = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'holidays.json'), 'utf8'));
const cal = D.calendar(HOL);
const V = L.counts.byVerdict, N = L.scope.pairsDecided;
/* the adoption of the 20 November holiday, read from the per-day window the ledger keeps (after the law's date) */
const ADOPT = (() => { const w = (L.adoption && L.adoption.window) || []; const after = w.filter(([d]) => d >= '2023-12-01');
  const first = after.find(([, c]) => c.today > 0 && c.pre === 0), last = after.filter(([, c]) => c.pre > 0 && c.today === 0).pop();
  return { first: first ? first[0] : null, last: last ? last[0] : null }; })();
const REP = V.REPRODUCED || 0, OFF = V.OFF || 0, REF = V.REFUSED || 0, ND = V['NEEDS DATA'] || 0, CON = V.CONSISTENT || 0;
if (REP + CON + OFF + REF + ND !== N) die('the counts do not sum');
const conByKind = {}; for (const [k, n] of Object.entries((L.consistent && L.consistent.byKindYear) || {})) { const kind = k.split('|')[0]; conByKind[kind] = (conByKind[kind] || 0) + n; }
/* amendment 6: CONSISTENT is decided under every settlement hypothesis of the side, the primary first; `under` says which held first */
let conPrim = 0, conOther = 0; const conOtherBy = {};
for (const [k, m] of Object.entries((L.consistent && L.consistent.bySideYearUnder) || {})) { const prim = k.split('|')[1] === 'C' ? 'D1' : 'D0'; for (const [h, n] of Object.entries(m)) { if (h === prim) conPrim += n; else { conOther += n; conOtherBy[h] = (conOtherBy[h] || 0) + n; } } }

/* ---- the census, folded ------------------------------------------------------------------------------ */
const cens = L.census;                                   /* kind|side|year → code → n */
const yearsAll = [...new Set(Object.keys(cens).map((k) => k.split('|')[2]))].sort();
const fold = (filter) => { const out = {}; for (const [k, m] of Object.entries(cens)) { if (!filter(k)) continue; for (const [c, n] of Object.entries(m)) out[c] = (out[c] || 0) + n; } return out; };
const sideFold = (side) => fold((k) => k.split('|')[1] === side);
const cC = sideFold('C'), cV = sideFold('V');
const sumIf = (m, re) => Object.entries(m).filter(([k]) => re.test(k)).reduce((a, [, v]) => a + v, 0);
const preOnly = (m) => Object.entries(m).filter(([k]) => k !== 'OFF' && k !== 'REFUSED' && k.split('+').every((c) => /\/pre\//.test(c))).reduce((a, [, v]) => a + v, 0);
const anyPre = (m) => Object.entries(m).filter(([k]) => /\/pre\//.test(k)).reduce((a, [, v]) => a + v, 0);
const buyD1 = sumIf(cC, /(^|\+)D1(\/pre)?\/T/), buyD1x = sumIf(cC, /(^|\+)D1x/), buyPre = preOnly(cC), buyOff = cC.OFF || 0, buyRef = cC.REFUSED || 0;
const sellD0 = sumIf(cV, /(^|\+)D0(\/pre)?\/T/), sellD1 = sumIf(cV, /(^|\+)D1(\/pre)?\/T/), sellPre = preOnly(cV), sellOff = cV.OFF || 0, sellRef = cV.REFUSED || 0;
const SW = L.sellSwitch || {};
const preTotal = preOnly(cC) + preOnly(cV);
const b3Only = (m) => Object.entries(m).filter(([k]) => k !== 'OFF' && k !== 'REFUSED' && k.split('+').every((c) => /b3/.test(c))).reduce((a, [, v]) => a + v, 0);
const b3RuleOnly = (m) => Object.entries(m).filter(([k]) => k !== 'OFF' && k !== 'REFUSED' && k.split('+').every((c) => /b3/.test(c)) && k.split('+').every((c) => /\/r\b/.test(c))).reduce((a, [, v]) => a + v, 0);
const b3Total = b3Only(cC) + b3Only(cV), b3Rule = b3RuleOnly(cC) + b3RuleOnly(cV);
const B3T = L.b3Settlement || null;
const tOnly = Object.values(cens).reduce((a, m) => a + Object.entries(m).filter(([k]) => /\/T$/.test(k) && !/\/R/.test(k)).reduce((x, [, v]) => x + v, 0), 0);
const rOnly = Object.values(cens).reduce((a, m) => a + Object.entries(m).filter(([k]) => /\/R/.test(k) && !/\/T/.test(k)).reduce((x, [, v]) => x + v, 0), 0);

/* per-year table for the buy side */
const yearRows = yearsAll.map((y) => {
  const m = fold((k) => k.endsWith('|C|' + y)), mv = fold((k) => k.endsWith('|V|' + y));
  const tot = Object.values(m).reduce((a, b) => a + b, 0), totV = Object.values(mv).reduce((a, b) => a + b, 0);
  return [y, fmt(tot), fmt(sumIf(m, /(^|\+)D1(\/pre)?\/T/)), fmt(preOnly(m)), fmt(b3Only(m)), fmt(m.OFF || 0), fmt(totV), fmt(sumIf(mv, /(^|\+)D1(\/pre)?\/T/)), fmt(sumIf(mv, /(^|\+)D0(\/pre)?\/T/)), fmt(preOnly(mv)), fmt(b3Only(mv)), fmt(mv.OFF || 0)];
});

/* ---- the atlas: run-length SVG, one row per bond --------------------------------------------------- */
function atlasSvg() {
  const bonds = L.atlas.bonds;
  const x0 = Math.min(...bonds.map((b) => b.from)), x1 = Math.max(...bonds.map((b) => b.from + b.codes.length));
  const W = 1000, LPAD = 112, RPAD = 12, TOP = 22, rowH = 7, H = TOP + bonds.length * rowH + 30;
  const LABEL_EVERY = 3;                                   /* 12px labels on 7px rows: one label per three rows */
  const X = (i) => LPAD + (i - x0) / (x1 - x0) * (W - LPAD - RPAD);
  const out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + C.escAttr('Every fixed-rate Tesouro Direto title on a row, every quotation day on the x axis, one verdict per cell: ' + fmt(REP) + ' reproduced, ' + fmt(OFF) + ' off, ' + fmt(REF) + ' refused') + '" class="pu-atlas">'];
  /* year gridlines */
  for (let y = 2005; y <= 2026; y++) { const i = cal.du(L.atlas.origin, y + '-01-01'); if (i < x0 || i > x1) continue; const x = X(i).toFixed(1); out.push('<line x1="' + x + '" y1="' + TOP + '" x2="' + x + '" y2="' + (TOP + bonds.length * rowH) + '" stroke="var(--c-grid)" stroke-width="1"/>'); if (y % 2 === 1) out.push('<text x="' + x + '" y="' + (TOP + bonds.length * rowH + 16) + '" class="t-ax" text-anchor="middle">' + y + '</text>'); }
  let lastKind = ''; let groupRow = 0;
  bonds.forEach((b, r) => {
    const y = TOP + r * rowH;
    let groupStart = false;
    if (b.kind !== lastKind) { out.push('<text x="4" y="' + (y + 6) + '" class="t-lab">' + C.esc(b.kind) + '</text>'); lastKind = b.kind; groupStart = true; groupRow = r; }
    if ((r - groupRow) % LABEL_EVERY === 0) out.push('<text x="' + (LPAD - 6) + '" y="' + (y + 6) + '" class="t-ax" text-anchor="end">' + C.esc(b.maturity.slice(0, 7)) + '</text>');
    /* runs of equal codes */
    let i = 0; const s = b.codes;
    while (i < s.length) { let j = i; while (j < s.length && s[j] === s[i]) j++; const code = s[i];
      const xa = X(b.from + i), xb = X(b.from + j);
      if (code === 'R' || code === 'r') out.push('<rect x="' + xa.toFixed(1) + '" y="' + (y + 2) + '" width="' + Math.max(0.6, xb - xa).toFixed(1) + '" height="2" fill="var(' + (code === 'R' ? '--ink-4' : '--ink-3') + ')"/>');
      else if (code === 'x') out.push('<rect x="' + xa.toFixed(1) + '" y="' + (y + 1) + '" width="' + Math.max(1.2, xb - xa).toFixed(1) + '" height="4" fill="var(--held)"/>');
      else if (code === 'k') out.push('<rect x="' + xa.toFixed(1) + '" y="' + (y + 1.5) + '" width="' + Math.max(0.6, xb - xa).toFixed(1) + '" height="3" fill="var(--ink-2)"/>');
      else if (code === 'O') { for (let k = i; k < j; k++) { const cx = X(b.from + k); out.push('<path d="M' + cx.toFixed(1) + ' ' + (y - 0.5) + ' l3 3.5 l-3 3.5 l-3 -3.5 Z" fill="var(--warn)"/>'); } }
      else if (code === 'X') { for (let k = i; k < j; k++) { const cx = X(b.from + k); out.push('<line x1="' + (cx - 2).toFixed(1) + '" y1="' + (y + 5.5) + '" x2="' + (cx + 2).toFixed(1) + '" y2="' + (y + 0.5) + '" stroke="var(--ink-2)" stroke-width="1.2"/>'); } }
      i = j; }
  });
  out.push('</svg>');
  return out.join('\n');
}

/* ---- slips by year ------------------------------------------------------------------------------- */
const offByYear = L.counts.offByYear || {};
const slipRows = yearsAll.map((y) => ({ k: y, v: offByYear[y] || 0 }));
/* the leading pattern among the remaining OFF rows: the quotation's next business day (today's calendar) is a day B3 does not
   settle — a São Paulo holiday it observed (25 January, 9 July, 20 November before 2024) or 24/31 December — or the quotation
   is the last day before 1 January. Counted, not assumed; it is a hypothesis for phase B (B3's historical trading calendar is not pinned). */
const B3_DAYS = /-(01-25|07-09|11-20|12-24|12-31|01-01)$/;
const eveRows = L.offRows.filter((r) => B3_DAYS.test(cal.next(r.date)) || /-12-3[01]$/.test(r.date) || /-12-2[3-9]$/.test(r.date)).length;
const slipMax = Math.max(1, ...slipRows.map((r) => r.v));
const slipsSvg = OFF ? CH.bars({ rows: slipRows, max: slipMax * 1.15, xTicks: [0, Math.round(slipMax / 2), slipMax], alt: 'OFF prices per quotation year, both sides', rowH: 18, w: 900 }) : null;

/* ---- the certificate rows ------------------------------------------------------------------------ */
const ex = D.decideLTN('14,3600', '2008-05-21', '2010-07-01', cal);
const firstOff = L.offRows[0] || null;
let offCert = null;
if (firstOff) {
  const h = firstOff.primary;
  const prim = firstOff.kind === 'LTN' ? D.decideLTN(firstOff.taxa, firstOff.settle, firstOff.maturity, cal) : D.decideNTNF(firstOff.taxa, firstOff.settle, firstOff.maturity, cal);
  offCert = { row: firstOff, prim, h };
}
const tag = (v) => C.tag(v, v === 'REPRODUCED' ? 'held' : v === 'OFF' ? 'open' : 'dep');

/* ---- the page ------------------------------------------------------------------------------------ */
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · certified decisions · Tesouro Direto',
  title: 'PU Verificado',
  deck: 'Tesouro Direto publishes a price for every federal bond it sells, every business day, and the Treasury publishes the '
    + 'formula that produces it — down to a table saying which intermediate value is truncated and which is rounded, and at '
    + 'how many decimals. So each published price has exactly one value under its own rule. This page re-decides every '
    + 'price of the titles that need no price index — Tesouro Prefixado (LTN), Prefixado com Juros Semestrais (NTN-F) and Tesouro Selic (LFT) — in the public history, ' + fmt(N) + ' of them, in exact arithmetic: ' + fmt(REP) + ' are the rule’s '
    + 'value to the centavo, ' + fmt(CON) + ' lie inside the interval the published rate’s two decimals allow, ' + fmt(OFF) + ' are not the rule’s value, ' + fmt(REF) + ' could not be decided. The conventions the publisher follows '
    + 'but does not print — which day a purchase settles, whether the centavos are cut or rounded — are measured, not assumed.'
}));
B.push(C.scope('The pinned history precotaxatesourodireto.csv (Tesouro Transparente, ODbL; ' + fmt(L.scope.rows) + ' rows of Tesouro Prefixado = LTN, Tesouro Prefixado com Juros Semestrais = NTN-F and Tesouro Selic = LFT, '
  + L.scope.firstDate + ' to ' + L.scope.lastDate + ', ' + L.scope.bonds + ' titles), the ANBIMA national-holiday file to 2099, and the STN methodology of 29/04/2024 whose Tabela 3 is the rule '
  + '(= ANBIMA 2021 §22), every byte sha256-pinned in corpus/pu/PINS.json. Pre-registered in corpus/pu/preregistration.json, with ' + (PRE.amendments.length === 1 ? 'one dated amendment' : PRE.amendments.length + ' dated amendments') + '. '
  + 'For the LFT, the Selic daily rate (BCB SGS 11) builds the VNA and the Selic target (SGS 432) the projection, both pinned' + (L.lft ? ' (' + fmt(L.lft.selicDays) + ' Selic days, ' + C.esc(L.lft.selicFirst) + ' → ' + C.esc(L.lft.selicLast) + ')' : '') + '; the settlement days B3 did not trade are derived from B3’s circulars and archived calendar pages (corpus/pu/b3-settlement.json). '
  + 'Both sides of every row (compra, venda) under the pre-registered settlement hypotheses and printed readings. Still out: the IPCA-indexed titles (their daily projection is not public), ANBIMA’s secondary-market prices and B3’s.'));
B.push(C.tldr({
  findingRaw: '<b>' + pct(REP, N) + ' of ' + fmt(N) + ' prices are the rule’s value to the centavo.</b> The census decides the conventions: a purchase settles on the next business day '
    + '(D+1, ' + fmt(buyD1) + ' buy-side prices, the whole history); a sale settled on the next business day too until ' + C.esc(SW.lastDateD1Only || '—') + ' (' + fmt(sellD1) + ' prices) and on the quotation day since (D+0, ' + fmt(sellD0) + ' prices; every sell-side price from 2022 on); and the centavos are the 6-decimal price '
    + '<em>truncated</em>, never rounded (' + fmt(tOnly) + ' prices reproduce only under truncation; ' + fmt(rOnly) + ' only under rounding). '
    + (preTotal ? '<b>' + fmt(preTotal) + ' prices reproduce only under the calendar in force on the day they were published:</b> 20 November became a national holiday on 2023-12-21 (Lei 14.759), today\u2019s holiday file carries it from 2024 on, and every earlier quotation of a title maturing after 2024 was priced without it — one business day more per weekday 20 November between settlement and maturity. The data place the publisher\u2019s switch to the new calendar ' + (ADOPT.first ? 'at the quotation of ' + C.esc(ADOPT.first) + ' (the last quotation priced on the old calendar: ' + C.esc(ADOPT.last || '—') + ')' : 'nowhere yet') + '. ' : '')
    + (b3Total ? '<b>' + fmt(b3Total) + ' prices reproduce only with settlement on the next day B3 traded</b> — a São Paulo holiday the exchange observed (25 January, 9 July, 20 November through 2021), 24 or 31 December, or the 2014 World Cup days — the settlement calendar is B3\u2019s, derived here from B3\u2019s own circulars and the exchange\u2019s archived calendar pages' + (B3T ? ' (' + fmt(B3T.days) + ' such days 2004–2026, ' + fmt(B3T.documented) + ' named in a pinned document, ' + fmt(B3T.ruleOnly) + ' following the rule alone' + (b3Rule ? '; ' + fmt(b3Rule) + ' prices rest on a rule-only day' : '') + ')' : '') + '. ' : '')
    + (CON ? '<b>' + fmt(CON) + ' prices are CONSISTENT, not reproduced:</b> Tesouro Direto prints the LFT’s ágio/deságio at two decimals and prices with more — the printed centavos lie inside the interval the printed rate’s half-unit allows, and no closer decision is possible from what is published (' + Object.entries(conByKind).map(([k, n]) => k + ' ' + fmt(n)).join(', ') + ').' + (conOther ? ' The box holds under the side’s primary settlement for ' + fmt(conPrim) + ' of them and only under another pre-registered settlement for ' + fmt(conOther) + ' (' + Object.entries(conOtherBy).map(([h, n]) => h + ' ' + fmt(n)).join(', ') + ') — the sell side settled D+1 until ' + C.esc(SW.lastDateD1Only || '—') + ', and the primary D+0 alone never saw those rows (amendment 6).' : '') + ' ' : '')
    + '<b>' + fmt(OFF) + ' prices are OFF</b>: not the rule’s value under any pre-registered settlement; ' + fmt(REF) + ' REFUSED (the enclosure straddled a truncation boundary). Each is listed with its exact value and the difference in centavos.',
  mechanismRaw: 'Every step of the Treasury’s formula is exact: business days on the pinned calendar, the rate truncated at 6 decimals, the exponent du/252 truncated at 14, each NTN-F flow rounded at 9, '
    + 'the price truncated at 6. The one irrational step, (1 + taxa)^(du/252), is an enclosure — BigInt fixed point with every series remainder bounded — and each truncation is a decision from the two ends '
    + 'or a refusal. A second decider in Python (decimal, 60 digits, directed rounding; no shared code) re-derives every OFF and REFUSED row and a seeded sample (' + fmt(L.crossCheck.agree) + '/' + fmt(L.crossCheck.sampled) + ' agree). '
    + 'The methodology’s own worked examples (LTN 753.315323, NTN-F 903.075616 with its twelve flows, LFT 3455.211852 with its VNA and projection) are reproduced digit for digit before any row is decided.',
  checkRaw: C.m('node tools/run-pu-ledger.js') + ' (about a quarter of an hour on a laptop) · ' + C.m('node instruments/pu/battery.js') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls · ' + C.m('python3 -I instruments/pu/decide.py') + ' re-decides the worked examples with no engine present.'
}));
B.push(C.stats([
  { k: 'prices decided', v: fmt(N), n: 'LTN + NTN-F + LFT, buy and sell, ' + L.scope.firstDate.slice(0, 4) + ' → ' + L.scope.lastDate },
  { k: 'reproduced', v: pct(REP, N), n: fmt(REP) + ' prices equal the rule’s value truncated to the centavo' },
  { k: 'consistent', v: fmt(CON), n: 'inside the price interval the printed rate’s precision allows — ' + Object.entries(conByKind).map(([k, n]) => k + ' ' + fmt(n)).join(' · ') },
  { k: 'off', v: fmt(OFF), n: 'not the rule’s value under any pre-registered settlement — each listed below' },
  { k: 'refused', v: fmt(REF), n: 'the enclosure straddled a truncation boundary; not claimed either way' },
  { k: 'cross-checked', v: fmt(L.crossCheck.agree) + '/' + fmt(L.crossCheck.sampled), n: 'rows re-derived by the Python decider; every OFF and REFUSED row included' }
]));

B.push(C.section({
  lab: '§1 · the atlas', title: 'Every title, every day, one verdict', wide: true,
  bodyRaw: C.figure({ svgRaw: atlasSvg(), caption: 'Rows: the ' + L.scope.bonds + ' fixed-rate titles by maturity; x: quotation days from ' + L.scope.firstDate + '. A thin faint line is a run of REPRODUCED prices (buy side, D+1, today\u2019s calendar); a brighter line is a run that reproduces only under the calendar in force on the quotation day (no 20 November holiday after 2023); a heavier bar is a run that reproduces only with 24 and 31 December skipped as settlement days; a diamond is an OFF price; a slash is a REFUSED one. Weight and shape carry the verdict; the one semantic hue marks OFF.' })
    + '<div class="col">' + C.pRaw('The field is the result: an almost uniform texture of reproduced prices, with the exceptions where they are. The buy side is drawn because it carries the settlement convention; the sell side (D+0) reproduces at ' + pct(Object.values(cV).reduce((x, y) => x + y, 0) - sellOff - sellRef, Object.values(cV).reduce((x, y) => x + y, 0)) + ' and its exceptions are in the table of §3.') + '</div>'
}));

B.push(C.section({
  lab: '§2 · the census', title: 'The conventions the publisher follows, measured', wide: true,
  bodyRaw: '<div class="col">' + C.pRaw('Three things the methodology does not say about Tesouro Direto’s published prices were pre-registered as hypotheses and decided row by row: on which day a purchase and a sale settle, '
    + 'and how a 6-decimal price becomes the 2-decimal one printed. The census answers: <b>buy D+1</b> across the whole history; <b>sell D+1 until ' + C.esc(SW.lastDateD1Only || '—') + ', sell D+0 since</b> — a change of settlement convention made during 2021 and not printed beside the price (' + fmt((SW.byYear && SW.byYear['2021'] && SW.byYear['2021'].d0) || 0) + ' sell-side prices of 2021 reproduce only under D+0, every one from 2022 on; ' + fmt(Object.entries(SW.byYear || {}).filter(([y]) => y < '2021').reduce((a, [, v]) => a + v.d0, 0)) + ' earlier prices do too, on ' + fmt(SW.mixedDates || 0) + ' days where both settlements were quoted); <b>centavos truncated</b> throughout. Where every hypothesis fails, the row is OFF; the table shows how many, by year.') + '</div>'
    + C.table({ cols: [{ h: 'year' }, { h: 'buy prices' }, { h: 'buy D+1' }, { h: 'of which old calendar only' }, { h: 'buy on B3\u2019s next day only' }, { h: 'buy OFF' }, { h: 'sell prices' }, { h: 'sell D+1' }, { h: 'sell D+0' }, { h: 'of which old calendar only' }, { h: 'sell on B3\u2019s next day only' }, { h: 'sell OFF' }], rows: yearRows })
    + '<div class="col">' + C.pRaw('<b>A calendar is dated.</b> The pinned holiday file is the one ANBIMA serves today, and it carries a holiday that did not exist when most of these prices were published: 20 November, national since Lei 14.759 of 21 December 2023. A quotation of 2019 for a title maturing in 2029 was priced with the calendar of 2019, in which 2024, 2025, 2026 and 2028 each had one more business day than today\u2019s file says (2027\u2019s 20 November is a Saturday). Re-decided with today\u2019s calendar those prices are OFF by exactly that many days; re-decided with the calendar as of the quotation they are the rule\u2019s value to the centavo. The pre-registration\u2019s second amendment added that hypothesis after the full run showed the pattern (du + 1 for 2025 maturities, + 2 for 2026, + 4 for 2029 on a seeded sample of 30 rows); the rows that need it are the brighter lines in the atlas and the \u201ccalendar as of quote only\u201d columns here.'
      + (L.adoption && L.adoption.window && L.adoption.window.length ? ' Around the law\u2019s date the census reads, per quotation day, how many rows reproduce only under today\u2019s calendar and how many only under the old one; the last day priced on the old calendar is ' + C.esc(ADOPT.last || '—') + ' and the first priced on the new one is ' + C.esc(ADOPT.first || '—') + '.' : '')) + '</div>'
    + '<div class="col">' + C.pRaw('<b>The settlement calendar is the exchange\u2019s.</b> The methodology counts du on the national bank calendar, but Tesouro Direto settles through B3, which did not operate on São Paulo\u2019s own holidays (25 January, 9 July, and 20 November from 2006) through 2021, on 24 and 31 December every year, and on the 2014 World Cup days the exchange listed. A purchase quoted the day before settles on the next day B3 traded, and the published price says so. <span class="m">corpus/pu/b3-settlement.json</span> derives those days from B3\u2019s circulars (2017–2026) and from the exchange\u2019s calendar pages as the Wayback Machine captured them (2004–2016), citing for each date the documents that name the holiday; dates no captured document names (2007 and 2008 among them) follow the rule alone and the prices resting on them are counted apart. The July 2014 match days are not in the table because no page listing them was captured; those prices stay OFF.') + '</div>'
    + '<div class="col">' + C.pRaw('The settlement skip: Tesouro Direto quotes on 24 and 31 December but does not settle on them, and the ANBIMA holiday file says in its own notes that it lists only days that close bank reserves and omits the last business day of the year. '
      + 'The amendment of 2026-10-16 in the pre-registration added that hypothesis after the first 4,000 rows showed it; the rows that need it are counted apart, never folded into the primary count.') + '</div>'
}));

B.push(C.section({
  lab: '§3 · the slips', title: fmt(OFF) + ' published prices that are not their rule’s value', wide: true,
  bodyRaw: (slipsSvg ? C.figure({ svgRaw: slipsSvg, caption: 'OFF prices per quotation year, both sides. A slip is the publisher’s printed number differing from its own methodology’s value for its own published rate; it is not a refutation of the methodology.' }) : '')
    + C.table({ cols: [{ h: 'title' }, { h: 'quoted' }, { h: 'side' }, { h: 'rate % a.a.' }, { h: 'printed' }, { h: 'the rule’s value (T-6), ' + (OFF ? 'at ' + L.offRows[0].primary : '') }, { h: 'diff ¢' }, { h: 'under the other settlements' }],
      rows: L.offRows.slice(0, 80).map((r) => [r.kind + ' ' + r.maturity, r.date, r.side === 'C' ? 'buy' : 'sell', r.taxa, r.printed, r.pu6, r.diffCents,
        { raw: Object.entries(r.others || {}).map(([h, v]) => C.esc(h) + ' ' + C.esc(v.settle) + ': ' + C.esc(v.pu6 || 'refused')).join('<br>') }]) })
    + '<div class="col">' + C.pRaw((OFF > 80 ? 'The first 80 of ' + fmt(OFF) + ' rows; every row is in <span class="m">certs/pu-ledger.json</span> (offRows). ' : 'Every OFF row is listed; the same rows are in <span class="m">certs/pu-ledger.json</span>. ')
      + 'A difference of a few centavos with the sign of a later settlement is a settlement-day convention; a difference of about R$ 48 on an NTN-F quoted on the last business day of the year is a coupon gone ex because settlement crossed 1 January. '
      + 'Of the ' + fmt(OFF) + ' rows that remain OFF after the B3 settlement calendar, ' + fmt(L.offRows.filter((r) => r.implied).length) + ' are the rule\u2019s value for a settlement one to six bank business days later than any pre-registered hypothesis — the record carries that implied settlement for each, and it is never used to decide. The largest groups: '
      + Object.entries(L.impliedSettlements || {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => C.esc(k) + ' (' + n + ')').join(', ') + '. '
      + 'Three of those groups are the last quotation days of 2014, 2015 and 2016, whose prices are the value for settlement on the SECOND business day of the next year; the exchange\u2019s circulars state that practice for 2018 and 2019 (OC 111/2016 and OC 021/2017: \u201cpor solicitação da Secretaria do Tesouro Nacional, a primeira liquidação de compra e de venda será realizada no segundo dia útil\u201d), yet the published prices of 28 December 2017 and 28 December 2018 are the value for the first business day. A circular and the published numbers disagree; neither is assumed here, and no first-business-day skip is in the settlement table. The others — 26 and 30 June 2014, 2 July 2010, 20 June 2008, 2 February 2018 — are days no pinned document names. '
      + 'What is claimed: the printed number is not the methodology’s value for the printed rate on the pinned calendar under the pre-registered settlements. What is not claimed: that the publisher erred — a settlement rule or a calendar the publisher used and did not publish is a NEEDS DATA reading, and the pre-registration names it as such.') + '</div>'
}));

B.push(C.section({
  lab: '§4 · the certificate', title: 'One price, every step',
  bodyRaw: C.pRaw('The methodology’s own LTN example, re-decided here with every truncation shown. Maturity 01/07/2010, settlement 21/05/2008, rate 14,3600% a.a.')
    + C.plainList([
      { b: 'du = ' + ex.du + '.', text: 'Business days from settlement (inclusive) to maturity (exclusive) on the pinned ANBIMA calendar.' },
      { b: 'Exponent T-14.', text: 'du/252 = 2.111111111111111… truncated at 14 decimals → 2.11111111111111 (the rule truncates; rounding would give the same digits here, and a different number for du = 5).' },
      { b: 'The irrational step as an enclosure.', raw: '1000 / (1.143600)^(2.11111111111111) ∈ [' + C.esc(ex.enclosure[0]) + ', ' + C.esc(ex.enclosure[1]) + '] — twelve decimals shown of forty-eight carried; the two ends agree on every digit the rule keeps.' },
      { b: 'PU T-6.', raw: 'Truncated at 6 decimals: <span class="m">' + C.esc(D.dec(ex.pu6, 6)) + '</span>, the methodology’s printed answer; margin to the nearest truncation boundary ' + C.esc(ex.margin[0]) + ' / ' + C.esc(ex.margin[1]) + '.' }
    ])
    + (offCert ? C.pRaw('And the first OFF row of the ledger: ' + C.esc(offCert.row.kind + ' ' + offCert.row.maturity) + ' quoted ' + C.esc(offCert.row.date) + ' (' + (offCert.row.side === 'C' ? 'buy' : 'sell') + '), rate ' + C.esc(offCert.row.taxa) + '%, printed R$ ' + C.esc(offCert.row.printed) + '.')
      + C.plainList([
        { b: 'Under ' + offCert.h + ' (settles ' + offCert.row.settle + ').', raw: 'du = ' + C.esc(String(offCert.row.du)) + '; the rule’s value <span class="m">' + C.esc(offCert.row.pu6) + '</span>; truncated to the centavo it differs from the printed price by ' + C.esc(offCert.row.diffCents) + ' centavos.' },
        ...Object.entries(offCert.row.others || {}).map(([h, v]) => ({ b: 'Under ' + h + ' (settles ' + v.settle + ').', raw: 'the rule’s value <span class="m">' + C.esc(v.pu6 || 'refused') + '</span>.' })),
        { b: 'Verdict.', raw: tag('OFF') + ' — the printed price is none of these to the centavo. The nearest hypothesis and the sign of the difference say what convention would produce it; the record carries all of them.' }
      ]) : '')
}));

B.push(C.section({
  lab: '§5 · what this is, and is not', title: 'Scope, limits, and what comes next',
  bodyRaw: C.plainList([
    { b: 'The titles without a price index.', text: 'LTN and NTN-F need none; the LFT’s VNA is recomputed from the pinned Selic series under the rule (the accumulated factor rounded at 16 decimals each day) and projected to the settlement with the Selic target, as the methodology’s own example does. IPCA+ and IGPM+ need, before the month’s index is published, a projection the publisher used and does not print beside the price; no public archive of it was found, so those titles would be NEEDS DATA by construction — the count of them is the honest headline of that slice, and it is next.' },
    { b: 'One publisher.', text: 'Tesouro Direto’s own prices against the Treasury’s own rule. ANBIMA publishes indicative prices for the same titles at 6 decimals and B3 states the same formulas with no truncation rule at all; measuring the three against each other is phase B, pending ANBIMA’s republication terms.' },
    { b: 'The rate is the publisher’s.', text: 'The published rate (2 decimals) is taken as the input the rule names; whether that rate is itself a rounding of an internal one is not decidable from what is published.' },
    { b: 'What a slip is.', text: 'A printed number differing from its own rule’s value for its own inputs. It is not an error attributed to anyone, and a convention the publisher follows without publishing is named as NEEDS DATA where the record cannot say which it was.' },
    { b: 'Daily.', text: 'The history re-decides at every build; the day’s new prices are the next step: one run after the publisher posts, appended to the ledger, with the publication time and the decision time kept apart.' }
  ])
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-pu.js from certs/pu-ledger.json (' + L.generated + '); battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls; pins corpus/pu/PINS.json; @ git ' + git + '.') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'pu-verificado.html'), TPL.render({
  title: 'PU Verificado', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/reports/pu-verificado.html',
  cssRaw: '.pu-atlas .t-lab{font-weight:600}',
  desc: 'Every fixed-rate Tesouro Direto price since ' + L.scope.firstDate.slice(0, 4) + ' re-decided from the Treasury’s own rule table in exact arithmetic: ' + fmt(N) + ' prices, ' + pct(REP, N) + ' the rule’s value to the centavo, ' + fmt(OFF) + ' off with the exact value and the difference, the settlement and rounding conventions measured.'
}));
console.log('reports/pu-verificado.html written · ' + fmt(N) + ' prices · ' + fmt(REP) + ' reproduced · ' + fmt(OFF) + ' off · ' + fmt(REF) + ' refused');
