#!/usr/bin/env node
/* pu-b3-calendar.js — the days B3 did not trade or settle that the national bank calendar calls business days,
   derived from B3's own documents and written to corpus/pu/b3-settlement.json with a citation per date.
   tools/ · cert-machine · 2026-10-16

   WHY. Tesouro Direto settles through B3. The STN methodology counts du on the national (bank) calendar — the
   pinned ANBIMA file — but a purchase whose next business day is a day B3 did not operate settles on the next B3
   day, and the published price says so (phase A left 887 such prices OFF). This file turns B3's rule into dates.

   THE RULES, each with the documents that state it (corpus/pu/sources/b3/):
     R1  25 January (São Paulo's anniversary): non-trading through 2021; normal from 2022 (CE 109/2021 Quadro B)
     R2  9 July (Revolução Constitucionalista): non-trading through 2021, except 2020 (OC 072/2020)
     R3  20 November (Consciência Negra): non-trading 2006–2021, except 2020 (OC 072/2020); national from 2024
         (already in the ANBIMA file; 2022 and 2023 normal)
     R4  24 December: non-trading every year
     R5  31 December: non-trading every year; when it falls on a weekend, the preceding Friday (29 or 30)
     R6  2014 World Cup: the opening (12 June, a municipal holiday) and Brazil's match days listed as non-trading
         on the exchange's own 2014 calendar page (Wayback captures)
     (R7, withdrawn 2026-10-16: the circulars' 'first settlement on the second business day' for 2018 and 2019 is NOT
      what the published prices follow — see the report)
   A date is DOCUMENTED when a pinned document covering its year names the holiday (the name is searched, and
   for R7 the date); otherwise it follows the rule alone and is marked so — a row that reproduces only through
   such a date is counted apart (/b3r). The cross-check is QuantLib's Brazil::Exchange (BSD; crosscheck/brazil.cpp),
   which agrees on R1–R5 except 2006-11-20 and 2020 (where the documents win).

   usage: node tools/pu-b3-calendar.js      writes corpus/pu/b3-settlement.json                                  */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'corpus', 'pu', 'sources', 'b3');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ');
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* every pinned document: its text and the years it speaks about */
const docs = [];
for (const dir of ['oc', 'wayback', '.']) {
  const d = path.join(SRC, dir);
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f); if (!fs.statSync(p).isFile()) continue;
    if (!/\.(txt|html)$/.test(f) || /^cdx-|SHA256SUMS/.test(f)) continue;
    /* the captures come in both encodings: read as UTF-8 and fall back to Latin-1 when the decoding left replacement characters */
    const buf = fs.readFileSync(p);
    let txt = buf.toString('utf8'); if (txt.includes('\uFFFD')) txt = buf.toString('latin1');
    const t = fold(strip(txt)) + ' ' + fold(strip(buf.toString('latin1')));
    const years = new Set((t.match(/\b20[0-2]\d\b/g) || []));
    docs.push({ file: (dir === '.' ? '' : dir + '/') + f, text: t, years, sha256: sha(p) });
  }
}
const covering = (y) => docs.filter((d) => d.years.has(String(y)));
const cites = (y, needles) => covering(y).filter((d) => needles.some((n) => d.text.includes(fold(n)))).map((d) => d.file);

const wd = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay();
const weekday = (iso) => wd(iso) !== 0 && wd(iso) !== 6;
const days = {};
const add = (iso, rule, docsFor) => { if (!weekday(iso)) return; days[iso] = { rule, documented: docsFor.length > 0, sources: docsFor }; };

for (let y = 2004; y <= 2026; y++) {
  if (y <= 2021) add(`${y}-01-25`, 'R1', cites(y, ['aniversario de sao paulo', 'aniversario da cidade', '25/01']));
  if (y <= 2021 && y !== 2020) add(`${y}-07-09`, 'R2', cites(y, ['revolucao constitucionalista', '09/07']));
  if (y >= 2006 && y <= 2021 && y !== 2020) add(`${y}-11-20`, 'R3', cites(y, ['consciencia negra', '20/11']));
  add(`${y}-12-24`, 'R4', cites(y, ['vespera de natal', '24/12']));
  const d31 = `${y}-12-31`;
  if (weekday(d31)) add(d31, 'R5', cites(y, ['vespera de ano novo', 'ultimo dia util', '31/12']));
  else { const w = wd(d31); const fri = w === 6 ? `${y}-12-30` : `${y}-12-29`; add(fri, 'R5', cites(y, ['vespera de ano novo', 'ultimo dia util', fri.slice(8) + '/12'])); }
}
/* R6: the 2014 World Cup days named on the exchange's 2014 calendar (June capture) — 12 June (opening), 17 and 23 June (matches) */
for (const iso of ['2014-06-12', '2014-06-17', '2014-06-23']) add(iso, 'R6', cites(2014, ['abertura da copa', 'jogo da selecao']));
/* R6, July: Brazil's match days of 4 and 8 July 2014 — the June page states the rule (Brazil's match days non-trading);
   the July page was not captured, so these two dates follow the rule alone and are marked so (the match dates are FIFA's) */
add('2014-07-04', 'R6', []); add('2014-07-08', 'R6', []);
/* NOT a settlement day in this table: the circulars for 2018 and 2019 say the Treasury asked for the year's first settlement
   on the SECOND business day (OC 111/2016 and OC 021/2017 footnotes), yet the published prices of 28 December 2017 and
   28 December 2018 are the rule's value for settlement on the FIRST business day of the next year. The prices decide; the
   footnote is recorded in the report as a disagreement between the circular and the published numbers. */

const out = {
  what: 'B3 non-trading / non-settlement days that the national bank calendar (the pinned ANBIMA file) counts as business days, 2004–2026, derived by tools/pu-b3-calendar.js from B3\'s own circulars and the exchange\'s calendar pages as captured by the Wayback Machine (corpus/pu/sources/b3/). Each date carries its rule and the documents covering its year that name the holiday; a date with none is rule-only and is used apart.',
  rules: { R1: '25 January non-trading through 2021', R2: '9 July non-trading through 2021 except 2020', R3: '20 November non-trading 2006–2021 except 2020', R4: '24 December non-trading', R5: '31 December non-trading, or the preceding Friday when it falls on a weekend', R6: '2014 World Cup: 12, 17 and 23 June per the exchange\'s 2014 calendar page; 4 and 8 July (Brazil\'s matches) by the same rule, rule-only' },
  generated: new Date().toISOString(),
  documents: docs.map((d) => ({ file: d.file, sha256: d.sha256, years: [...d.years].sort() })),
  crosscheck: 'crosscheck/brazil.cpp (QuantLib Brazil::Exchange, BSD): the same rules R1–R5 except 2006-11-20 (QuantLib starts 20 November in 2007; the BM&F 2006 page lists it) and 2020 (QuantLib keeps 9 July and 20 November; OC 072/2020 says normal operation)',
  counts: { days: Object.keys(days).length, documented: Object.values(days).filter((d) => d.documented).length, ruleOnly: Object.values(days).filter((d) => !d.documented).length },
  days
};
fs.writeFileSync(path.join(ROOT, 'corpus', 'pu', 'b3-settlement.json'), JSON.stringify(out, null, 1) + '\n');
console.log('corpus/pu/b3-settlement.json: ' + out.counts.days + ' days, ' + out.counts.documented + ' documented, ' + out.counts.ruleOnly + ' rule-only, from ' + docs.length + ' documents');
for (const [iso, d] of Object.entries(days).filter(([, d]) => !d.documented)) console.log('  rule-only ' + iso + ' ' + d.rule);
