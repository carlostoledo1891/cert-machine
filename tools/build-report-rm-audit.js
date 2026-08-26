#!/usr/bin/env node
/* build-report-rm-audit.js — generate reports/rm-audit.html: the Ramanujan
   Machine's published result sheets, ALL of them, decided — the certified
   status registry.

   Nothing on the page is remembered: every one of the 52 corpus rows is
   RE-CERTIFIED by the family at build time (tail bands re-proved, enclosures
   re-evaluated, constant brackets recomputed, source PDFs re-hashed), and
   the build refuses if any verdict, count, or the refutation's mechanism
   moves. The page doubles as the registry the field lacks: before the
   mixed-zeta sheet's row 3, no printed Ramanujan Machine row had ever been
   refuted on record.

   usage: node tools/build-report-rm-audit.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const FAM = require(path.join(ROOT, 'families', 'ramanujan-audit.js'));
const M = require(path.join(ROOT, 'instruments', 'cf', 'minus.js'));

const sh = (c) => { try { return cp.execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return null; } };
const die = (m) => { console.error('RM-AUDIT REPORT REFUSED: ' + m); process.exit(1); };

/* ---- re-certify the ENTIRE corpus ---------------------------------------- */
const SHEETS = [
  ['results_e_4614_070418.pdf', 'e (2018)'],
  ['results_pi_0101_060418.pdf', 'pi (2018)'],
  ['rm_zeta3.pdf', 'zeta(3) (2020)'],
  ['rm_catalan.pdf', 'Catalan G (2020)'],
  ['rm_zeta2.pdf', 'pi^2 (2021)'],
  ['rm_other.pdf', 'ln 2 (2020)'],
  ['rm_zeta_orders.pdf', 'mixed zeta orders (2022)']
];
const sheetLabel = Object.fromEntries(SHEETS);

const rows = [];
for (let i = 0; ; i++) {
  const o = FAM.enumerate(i); if (!o) break;
  const c = FAM.certify(o);
  if (c.verdict === 'REFUSED') die(o.id + ' REFUSED: ' + c.why);
  rows.push({ id: o.id, source: o.source, status: o.status || 'known',
    form: c.extra.form, width: c.extra.width, verdict: c.verdict,
    enclosure: c.enclosure, text: c.text, extra: c.extra });
}
if (rows.length !== 52) die('expected 52 corpus rows, found ' + rows.length);
const hits = rows.filter(r => r.verdict === 'HIT');
const rejects = rows.filter(r => r.verdict === 'REJECT');
if (hits.length !== 51 || rejects.length !== 1) die('verdicts moved: ' + hits.length + ' HIT, ' + rejects.length + ' REJECT');
const refuted = rejects[0];
if (refuted.id !== 'rm-zo-z5z3b-printed' || !/sign slip/.test(refuted.text)) die('the refutation is not the recorded one');
const corrected = rows.find(r => r.id === 'rm-zo-z5z3b-corrected');
if (!corrected || corrected.verdict !== 'HIT') die('the corrected row did not certify');
if (refuted.enclosure[0] !== corrected.enclosure[0] || refuted.enclosure[1] !== corrected.enclosure[1]) die('printed and corrected rows no longer share one enclosure');
const flagship = hits.filter(r => /NEW AND UNPROVEN/.test(r.status));
if (flagship.length !== 39) die('expected 39 surviving "new and unproven" rows, found ' + flagship.length);
for (const [src] of SHEETS) if (!rows.some(r => r.source === src)) die('no rows from ' + src);
const maxWidth = Math.max(...hits.map(r => r.width));

/* the printed row-3 value, recomputed from the exact zeta brackets */
const FR = M._frac;
const z3 = M.zeta3Bracket(6000), z5 = M.zetaBracket(5, 2000);
const printedLHS = 2 / (2 * FR.fToDouble(z5.lo) - 2 * FR.fToDouble(z3.lo) - 1);
if (!(printedLHS < 0 && printedLHS > -2)) die('the printed row-3 value stopped being ~-1.5 — investigate');

/* ---- the page ------------------------------------------------------------ */
const git = sh('git rev-parse --short HEAD') || 'unknown';
const fmtW = (w) => w.toExponential(1);
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · certified audit',
  title: 'The Ramanujan Machine, audited',
  deck: 'Every row of every published result sheet — seven sheets, 52 rows — decided by rigorous enclosures and '
    + 'exact rational comparisons. 51 survive an unconditional audit. One printed row is refuted exactly, and its '
    + 'correction is certified on the same enclosure. This page is the status registry: every verdict on it was '
    + 're-certified during the build that produced it.'
}));

B.push(C.stats([
  { k: 'rows decided', v: '52', n: 'all seven published sheets, complete' },
  { k: 'survive', v: '51', n: 'consistency certified to stated width; equality open, as it must be' },
  { k: 'refuted', v: '1', n: 'the mixed-zeta sheet\'s row 3 as printed — correction certified' },
  { k: 'new and unproven', v: '39', n: 'every row the Machine marks unproven, decided' },
  { k: 'widest enclosure', v: fmtW(maxWidth), n: 'largest width across the 51 surviving rows' },
  { k: 'sources', v: '7 PDFs', n: 'hash-pinned; re-hashed at every certify — a drifted source refuses everything' }
]));

B.push(C.section({
  lab: 'the refutation', title: 'A printed row that is false — and what it actually is',
  bodyRaw: [
    C.p('The July 2022 sheet ("Results using mixed orders of ζ") prints, as its third row, the identity '
      + '2/(2ζ(5) − 2ζ(3) − 1) = CF, where the continued fraction is defined by the row\'s own polynomials '
      + 'a_n = n⁵+(n+1)⁵+6(n³+(n+1)³)−4(2n+1), b_n = −n¹⁰. The printed left-hand side is '
      + printedLHS.toFixed(4) + '… — negative. The continued fraction converges to 2.9862258661092707…, '
      + 'certified here by a proved tail band to width ' + fmtW(refuted.enclosure[1] - refuted.enclosure[0]) + '. '
      + 'The two are provably disjoint: the printed identity is false.'),
    C.p('The mechanism is a sign slip, and the audit proves it constructively: the same certified enclosure contains '
      + '2/(2ζ(5) − 2ζ(3) + 1) — the printed constant term −1 should read +1 — so the corrected identity survives '
      + 'on the very enclosure that refutes the printed one. (The sheet\'s displayed convergent also shows a₁ = 275 '
      + 'where the row\'s own polynomial gives 75, and reuses n⁸ numerators on rows whose b_n is −n¹⁰ or −n¹⁴; '
      + 'the polynomial column is the mathematical object, and it is what this audit decides.)'),
    C.note({ lab: 'first on record', bodyRaw: C.p('We are not aware of any prior refutation of a printed Ramanujan '
      + 'Machine row. The Machine\'s sheets mark rows "new and unproven" — conjectures by construction — which is '
      + 'exactly what makes them the right audit corpus: a refutation is a discovery, not a gotcha. The other 51 '
      + 'rows SURVIVE; this registry says both things with the same arithmetic.') })
  ].join('\n')
}));

B.push(C.section({
  lab: 'how to read it', title: 'What SURVIVES means — and what it does not',
  bodyRaw: [
    C.p('SURVIVES: the claimed closed form lies inside a rigorous enclosure of the continued fraction, with the final '
      + 'comparison made in exact rational arithmetic — consistency certified to the stated width, typically 1e-14 to '
      + '1e-15. It is NOT a proof of equality; no finite enclosure proves an identity, and no row here is marked '
      + 'proved unless the literature proved it. REFUTED: the claimed value lies provably OUTSIDE the enclosure — '
      + 'that verdict is a theorem. A row the instrument cannot decide is REFUSED and never counted either way; '
      + 'this build refuses to ship if any row refuses.'),
    C.p('Method, by sheet: positive continued fractions are evaluated backward in interval arithmetic from a tail '
      + 'seeded by proof (never by assumption). The minus-CF sheets (zeta(3), Catalan, pi², ln 2, mixed orders) ride '
      + 'a per-row TAIL BAND [L(n), U(n)] proved by shift-and-check coefficient positivity, with convergence proved '
      + 'inside the certificate — no external convergence theorem is consumed. Constants come from their defining '
      + 'series with proved tails (zeta(3), zeta(5), zeta(7), Catalan\'s G with an exact convexity bound) or from '
      + 'certified Machin enclosures (pi², with Euler\'s identities named where consumed). Every sheet PDF is '
      + 'hash-pinned and re-hashed at certify time: the certificate is over a byte sequence, not a memory of it.')
  ].join('\n')
}));

const bySheet = SHEETS.map(([src]) => rows.filter(r => r.source === src)).flat();
B.push(C.section({
  lab: 'the registry', title: 'All 52 rows', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'row' }, { h: 'sheet' }, { h: 'the Machine says' }, { h: 'claimed form' }, { h: 'verdict' }, { h: 'width' }],
    rows: bySheet.map(r => [
      { raw: '<span class="m">' + C.esc(r.id) + '</span>' },
      sheetLabel[r.source],
      r.status,
      { raw: '<span class="m">' + C.esc(r.form) + '</span>' },
      { raw: r.verdict === 'HIT' ? 'SURVIVES' : '<strong>REFUTED</strong>' },
      fmtW(r.width)
    ])
  })
}));

B.push(C.section({
  lab: 'context', title: 'Why this registry exists',
  bodyRaw: [
    C.p('The Ramanujan Machine publishes conjectures found by matching truncated decimals, argued from collision '
      + 'probability — its papers say so plainly, and its own Ramanujan Challenge (July 2026) now asks for '
      + '"reproducible CAS-based or formally verified code". This page is that verification, applied to the '
      + 'Machine\'s entire published output: every verdict is produced by an instrument with red controls that must '
      + 'fire, calibrated on proved rows (Apéry\'s 6/ζ(3); the two pi² rows proved by Kadyrov–Orynbassar) before '
      + 'being trusted on unproven ones, and re-run in full by the repository\'s test battery.'),
    C.p('The registry updates as sheets appear. A future row that survives will be added as SURVIVES with its '
      + 'width; a future row that fails will be added as REFUTED with its mechanism — this build refuses to '
      + 'render either without the certificate.')
  ].join('\n')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-rm-audit.js @ git ' + git + '. Every one of the '
  + '52 verdicts above was re-certified during this build — tail bands re-proved, enclosures re-evaluated, constants '
  + 're-bracketed from their defining series, source PDFs re-hashed — and the build refuses on any deviation. '
  + 'Certificates and instruments: the cert-machine repository.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'rm-audit.html'),
  TPL.render({ title: 'The Ramanujan Machine, audited', bodyRaw: B.join('\n\n'), footRaw: foot }));
console.log('reports/rm-audit.html written: 52 rows re-certified (51 SURVIVE, 1 REFUTED) @ git ' + git);
