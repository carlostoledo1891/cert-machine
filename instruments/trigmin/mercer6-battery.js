#!/usr/bin/env node
/* mercer6-battery.js — the gate on the mu(5) <= 1 + pi/m ladder.

   Calibration on PROVED mathematics: m = 5 must reproduce Mercer's Table-5
   conclusion (exactly one eligible quadruple -> (1,2,3,4)) and m = 6 his
   Tables 6 and 7 (six rows, six tuples) — both transcribed from the pinned
   PDF, which this battery RE-HASHES every run. Cross-lab: the m = 6 cases
   must match the source lab's results/mu5-pi6.json — same six tuples, every
   one closed at y = -1 with g = 1 exactly. The certs/mercer-mu5.json rungs
   at m = 5..8 are re-run IN FULL and compared; every higher rung has its bar
   re-derived and every recorded case re-certified by re-evaluating |f|^2 at
   the recorded point in exact rationals against the re-derived bar — the
   recorded point IS the certificate, and it is re-proved here, not trusted.

   Reds that must fire: the dropped-identity sabotage inflates the m = 6 row
   count (the printed-table comparison has teeth); a pi override above the
   certified enclosure and an insane pi enclosure are refused BY NAME; the
   CASE-FAILS path fires on a true min (min|f(0,3,7,8,9)| = 1, the reversal
   of Mercer's own witness and our Sturm equality theorem) against a forged
   bar of 1/2; the a <= 0 discard guard fires on a synthetic row. */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const M = require('#instruments/trigmin/mercer6.js');
const C = require('#instruments/trigmin/cheb.js');
const Q = require('#instruments/interval/rational.js');

const ROOT = path.resolve(__dirname, '..', '..');
const CERT = path.join(ROOT, 'certs', 'mercer-mu5.json');
const SOURCE_LAB_RECORD = '/Users/carlostoledo/Documents/sin-mfg/research/probes/mercer-program/results/mu5-pi6.json';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- the pinned source: re-hash the PDF the printed tables were read from ---- */
{
  const bytes = fs.readFileSync(M.SOURCE_PDF.file);
  const h = crypto.createHash('sha256').update(bytes).digest('hex');
  ok(h === M.SOURCE_PDF.sha256, 'PIN: Mercer 2019 PDF re-hashes to its pin (' + h.slice(0, 12) + '...)');
}

/* ---- calibration: m = 5 (Table 5's conclusion) ---- */
{
  const r = M.runM(5);
  ok(r.search.rows.length === 1 && r.search.rows[0] === '1/4 1/4 1/3 2/3',
    'CALIBRATION m=5: exactly one eligible quadruple, (1/4, 1/4, 1/3, 2/3) — Mercer Table 5');
  ok(r.cases.length === 1 && r.cases[0].tuple.join(',') === '1,2,3,4' && r.verdict === 'CERTIFIED',
    'CALIBRATION m=5: it derives (1,2,3,4) and the case certifies');
}

/* ---- calibration: m = 6 (Tables 6 and 7) + cross-lab ---- */
{
  const r = M.runM(6);
  ok(r.search.rows.length === 6 && M.PRINTED_TABLE6.every(p => r.search.rows.includes(p.join(' '))),
    'CALIBRATION m=6: the search IS Mercer Table 6 (six rows, set equality)');
  ok(r.cases.length === 6 && M.PRINTED_TABLE7.every(p => r.cases.some(c => c.tuple.join(',') === p.join(','))),
    'CALIBRATION m=6: the derived tuples ARE Mercer Table 7 (six tuples, set equality)');
  ok(r.cases.every(c => c.caseCheck.verdict === 'CERTIFIED' && c.caseCheck.gExact === '1' && c.caseCheck.at.y === '-1'),
    'CALIBRATION m=6: every case closes at z = -1 with g = 1 EXACTLY');
  const lab = JSON.parse(fs.readFileSync(SOURCE_LAB_RECORD, 'utf8'));
  ok(JSON.stringify(lab.table6.found) === JSON.stringify(r.search.rows),
    'CROSS-LAB m=6: row-for-row identical to the source lab record (order included)');
  ok(lab.cases.length === 6 && lab.cases.every(lc =>
    r.cases.some(c => c.tuple.join(',') === lc.tuple.join(',') && c.caseCheck.gExact === lc.caseCheck.gExact)),
    'CROSS-LAB m=6: the six case certificates match the source lab (same tuples, same exact g)');
}

/* ---- the certified ladder: certs/mercer-mu5.json ---- */
{
  const rec = JSON.parse(fs.readFileSync(CERT, 'utf8'));
  const ms = Object.keys(rec.rows).map(Number).sort((a, b) => a - b);
  ok(ms.length >= 4 && ms[0] === 5 && ms.includes(7) && ms.includes(8),
    'LADDER: the record holds rungs m = ' + ms.join(', '));
  ok(ms.every(m => rec.rows[m].verdict === 'CERTIFIED'),
    'LADDER: every recorded rung is CERTIFIED');

  /* m = 5..8 re-run IN FULL and compared to the record */
  for (const m of ms.filter(m => m <= 8)) {
    const fresh = M.runM(m);
    const same = JSON.stringify(fresh.search.rows) === JSON.stringify(rec.rows[m].search.rows)
      && JSON.stringify(fresh.cases.map(c => [c.tuple, c.caseCheck.verdict, c.caseCheck.gExact])) ===
         JSON.stringify(rec.rows[m].cases.map(c => [c.tuple, c.caseCheck.verdict, c.caseCheck.gExact]))
      && fresh.bar.barExact === rec.rows[m].bar.barExact
      && fresh.verdict === rec.rows[m].verdict;
    ok(same, 'RE-RUN m=' + m + ': full pipeline reproduces the record byte-for-byte where it matters (rows, tuples, verdicts, exact g, exact bar)');
  }

  /* every higher rung: bar re-derived, every case re-proved at its recorded point */
  for (const m of ms.filter(m => m > 8)) {
    const row = rec.rows[m];
    const freshBar = M.bar(m);
    let barOK = freshBar.barExact === row.bar.barExact;
    let cons = row.conservation.derived + row.conservation.discarded === row.conservation.rows
      && row.conservation.certified === row.conservation.distinctTuples
      && row.conservation.failed === 0 && row.conservation.refused === 0;
    let reproved = 0, broken = 0;
    for (const c of row.cases) {
      if (!(c.caseCheck.verdict === 'CERTIFIED' && c.caseCheck.how === 'exact-point')) { broken++; continue; }
      const { G } = M.gPolyFor(c.tuple);
      const parts = c.caseCheck.at.y.split('/');
      const y = Q.R(BigInt(parts[0]), BigInt(parts[1] || '1'));
      const g = C.evalExact(G, y);
      if (Q.toString(g) === c.caseCheck.gExact && Q.cmp(g, freshBar.barQ) <= 0) reproved++;
      else broken++;
    }
    ok(barOK && cons && broken === 0 && reproved === row.cases.length,
      'RE-PROVE m=' + m + ': bar re-derived exactly; all ' + row.cases.length + ' recorded case points re-evaluated in exact rationals and every one clears the bar');
  }

  /* the equality-theorem link: from m = 10 the exceptional list contains
     (3,7,8,9) — the reversal of Mercer's witness {0,1,2,6,9}, whose minimum
     is EXACTLY 1 (Sturm; certs battery sweep-battery.js holds the theorem).
     Its case must close with g = 1 exactly — the bar always exceeds 1. */
  if (ms.includes(10)) {
    const c = rec.rows[10].cases.find(c => c.tuple.join(',') === '3,7,8,9');
    ok(!!c && c.caseCheck.gExact === '1',
      'LINK m=10: (3,7,8,9) — the reversal of the M(0,1,2,6,9) = 1 witness — is in the list and closes with g = 1 exactly');
  }
}

/* ---- reds: every one must fire ---- */
{
  const sab = M.search(6, { sabotage: 'drop-uv-identity' });
  ok(sab.rows.length > 6,
    'RED: dropping r(1+v) = u(1+s) inflates the m=6 search to ' + sab.rows.length + ' rows — the Table-6 comparison has teeth');
}
{
  let threw = '';
  try { M.bar(6, { piLoOverride: 3.15 }); } catch (e) { threw = e.message; }
  ok(threw.startsWith('PI-LO-ABOVE-ENCLOSURE'),
    'RED: a pi lower "bound" above the certified enclosure is refused BY NAME');
}
{
  let threw = '';
  try { M.bar(6, { sabotagePi: { lo: { m: 3n, e: 0 }, hi: { m: 4n, e: 0 } } }); } catch (e) { threw = e.message; }
  ok(threw.startsWith('PI-ENCLOSURE-INSANE'),
    'RED: an insane pi enclosure fails the 223/71 < pi < 22/7 sandwich BY NAME');
}
{
  const res = M.caseCheck([3, 7, 8, 9], Q.R(1n, 4n));
  ok(res.verdict === 'CASE-FAILS',
    'RED: against a forged bar of 1/2, (3,7,8,9) — true min EXACTLY 1 — lands CASE-FAILS: the failure path fires');
}
{
  const d = M.deriveTuple({ r: Q.R(1n, 4n), s: Q.R(1n, 2n), u: Q.R(1n, 3n), v: Q.R(1n, 2n) });
  ok(!!d.discarded && d.discarded.includes('<= 0'),
    'RED: a synthetic row with r/u - r - s = 0 is DISCARDED with its reason, never certified');
}

console.log('mercer6 battery: ' + pass + ' pass, ' + fail + ' fail');
process.exitCode = fail ? 1 : 0;
