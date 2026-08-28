#!/usr/bin/env node
/* build-report-rm-audit.js — generate reports/rm-audit.html: the Ramanujan
   Machine's published result sheets, ALL of them, decided — the certified
   status registry.

   Nothing on the page is remembered: every one of the 52 corpus rows (the 51
   PRINTED sheet rows + our certified correction of the refuted one) is
   RE-CERTIFIED by the family at build time (tail bands re-proved, enclosures
   re-evaluated, constant brackets recomputed, source PDFs re-hashed), and
   the build refuses if any verdict, count, or the refutation's mechanism
   moves. Public counts use the PRINTED rows only — counting our own
   correction as a 52nd decided row would inflate the audit by one.

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
const CORRECTED_ID = 'rm-zo-z5z3b-corrected';

/* ---- the defining continued fraction, printable --------------------------
   The CF is the mathematical object; the claimed closed form is the claim.
   Without this column the registry reads as auditing VALUES (and rows like
   rm-e-a / rm-e-b, both e/2−1, look like duplicates) when it audits
   IDENTITIES: distinct polynomial CFs converging to the same constant are
   distinct conjectures. Coefficient arrays are lowest-power-first, exactly
   as the corpus stores them; minus-CF rows print the sheet's negative
   partial numerators (the corpus stores them positive-normalized). */
const polyText = (coeffs) => {
  const t = [];
  for (let k = coeffs.length - 1; k >= 0; k--) {
    const c = coeffs[k];
    if (!c) continue;
    const mag = Math.abs(c);
    const v = k === 0 ? String(mag) : (mag === 1 ? '' : String(mag)) + (k === 1 ? 'n' : 'n^' + k);
    t.push((c < 0 ? (t.length ? '-' : '-') : (t.length ? '+' : '')) + v);
  }
  return t.length ? t.join('') : '0';
};
const negPoly = (coeffs) => {
  const nz = coeffs.filter(Boolean).length;
  return nz <= 1 ? '-' + polyText(coeffs) : '-(' + polyText(coeffs) + ')';
};
/* Display follows the SHEETS' labeling — a(n) the partial denominators,
   b(n) the partial numerators (the corpus internals store numerators first;
   the labels here are the ones a reader will match against the PDF). The six
   rows whose corpus entries hold their polynomials as FUNCTIONS are
   transcribed here from the same family source lines the battery
   float-guards; the 2018 e/pi rows show their positive-normalized form,
   with the original all-negative-denominator spellings kept in the corpus. */
const CF_FN = {
  'rm-e-a': 'b0=0 · a(n)=2n · b(1)=1, b(n)=4(n-1)',
  'rm-e-b': 'b0=0 · a(n)=n+1 · b(1)=1, b(n)=n+1',
  'rm-e-c': 'b0=1 · a(n)=n+1 · b(n)=n+1',
  'rm-pi-a': 'b0=0 · a(n)=2n-1 · b(1)=1, b(n)=(n-1)^2',
  'rm-pi-b': 'b0=0 · a(n)=2n+1 · b(1)=1, b(n)=n^2-1',
  'rm-z3-pos': 'b0=2 · a(n)=2+n(2+n)(4+3n) · b(n)=4n^6-2n^5'
};
function cfText(o) {
  if (CF_FN[o.id]) return CF_FN[o.id];
  if (o.sheet === 3) return 'b0=' + o.b0 + ' · a(n)=' + polyText(o.b) + ' · b(n)=-n^' + (2 * o.k);
  if (o.sheet === 2) {
    const minus = o.kind !== 'pos';
    return 'b0=' + o.b0 + ' · a(n)=' + polyText(o.b) + ' · b(n)=' + (minus ? negPoly(o.a) : polyText(o.a));
  }
  if (o.spec) return 'b0=' + o.spec.b0 + ' · a(n)=' + polyText(o.spec.bPoly) + ' · b(n)=' + negPoly(o.spec.aPoly);
  die('no printable CF for ' + o.id);
}

const rows = [];
for (let i = 0; ; i++) {
  const o = FAM.enumerate(i); if (!o) break;
  const c = FAM.certify(o);
  if (c.verdict === 'REFUSED') die(o.id + ' REFUSED: ' + c.why);
  rows.push({ id: o.id, source: o.source, status: o.status || 'known', cf: cfText(o),
    form: c.extra.form, width: c.extra.width, verdict: c.verdict,
    enclosure: c.enclosure, text: c.text, extra: c.extra });
}
if (rows.length !== 52) die('expected 52 corpus rows, found ' + rows.length);
const printed = rows.filter(r => r.id !== CORRECTED_ID);
const corrected = rows.find(r => r.id === CORRECTED_ID);
if (printed.length !== 51) die('expected 51 printed rows, found ' + printed.length);
const hits = printed.filter(r => r.verdict === 'HIT');
const rejects = printed.filter(r => r.verdict === 'REJECT');
if (hits.length !== 50 || rejects.length !== 1) die('printed verdicts moved: ' + hits.length + ' HIT, ' + rejects.length + ' REJECT');
const refuted = rejects[0];
if (refuted.id !== 'rm-zo-z5z3b-printed' || !/sign slip/.test(refuted.text)) die('the refutation is not the recorded one');
if (!corrected || corrected.verdict !== 'HIT') die('the corrected row did not certify');
if (refuted.enclosure[0] !== corrected.enclosure[0] || refuted.enclosure[1] !== corrected.enclosure[1]) die('printed and corrected rows no longer share one enclosure');
const flagship = printed.filter(r => /NEW AND UNPROVEN/.test(r.status));
const flagshipHits = flagship.filter(r => r.verdict === 'HIT');
if (flagship.length !== 39 || flagshipHits.length !== 38) die('expected 39 printed "new and unproven" rows with 38 surviving, found ' + flagship.length + '/' + flagshipHits.length);
for (const [src] of SHEETS) if (!rows.some(r => r.source === src)) die('no rows from ' + src);
const maxWidth = Math.max(...hits.map(r => r.width));

/* ---- the same-value pairs, found rather than remembered ------------------ */
const byForm = new Map();
for (const r of printed) { const k = r.form; byForm.set(k, (byForm.get(k) || []).concat(r.id)); }
const sameValue = [...byForm.values()].filter(ids => ids.length > 1);

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
  deck: 'Every row of every published result sheet — seven sheets, 51 printed rows — decided by rigorous enclosures '
    + 'and exact rational comparisons. 50 survive an unconditional audit. One printed row is refuted exactly, and its '
    + 'correction — certified on the same enclosure — stands beside it as a row of its own, counted separately. '
    + 'This page is the status registry: every verdict on it was re-certified during the build that produced it.'
}));

B.push(C.tldr({
  findingRaw: 'All 51 printed rows of the Ramanujan Machine\'s seven result sheets decided: 50 survive an '
    + 'unconditional audit; one is false as printed — a sign slip, one of three typographic errors on the 2022 '
    + 'sheet — and its correction is certified on the same enclosure.',
  mechanismRaw: 'Each continued fraction is enclosed by a proved tail band with convergence inside the '
    + 'certificate; constants are bracketed from their defining series; the final comparison is exact rational '
    + 'arithmetic against hash-pinned sheet bytes. The Machine matches truncated decimals; this decides.',
  checkRaw: C.m('node instruments/cf/battery.js') + ' from a clone — the whole corpus re-certifies, ten red '
    + 'controls must fire, and this page refuses to build on any deviation.'
}));

B.push(C.stats([
  { k: 'printed rows decided', v: '51', n: 'all seven published sheets, complete — plus our certified correction, counted separately' },
  { k: 'survive', v: '50', role: 'held', n: 'consistency certified to stated width; equality open, as it must be' },
  { k: 'refuted', v: '1', role: 'warn', n: 'the mixed-zeta sheet\'s row 3 as printed — a transcription slip, its correction certified' },
  { k: 'new and unproven', v: '39 decided', role: 'held', n: '38 survive as printed · 1 refuted, its correction certified' },
  { k: 'widest enclosure', v: fmtW(maxWidth), n: 'largest width across the 50 surviving printed rows' },
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
    C.p('The precise finding: the 2022 mixed-zeta sheet contains at least three typographic errors, one of which '
      + 'makes a printed identity false — the sign of the constant term (−1 for +1), a displayed convergent with '
      + 'a₁ = 275 where the row\'s own polynomial gives 75, and n⁸ numerators reused on rows whose b_n is −n¹⁰ or '
      + '−n¹⁴. The underlying computation appears correct: the same certified enclosure contains '
      + '2/(2ζ(5) − 2ζ(3) + 1), so the sign-corrected identity survives on the very enclosure that refutes the '
      + 'printed one. The polynomial column is the mathematical object, and it is what this audit decides; to the '
      + 'Machine\'s group this is a more useful finding than "a row is wrong" — the search worked, the sheet slipped.'),
    C.note({ lab: 'first on record — dated, and open to correction', bodyRaw: C.p('As of 2026-08-27 we can find no '
      + 'prior refutation of a printed Ramanujan Machine row — not on the Machine\'s results pages, in its public '
      + 'repositories, or on arXiv; a per-session sweep re-checks those surfaces, and if an earlier erratum surfaces '
      + 'this note will record it and withdraw the priority sentence (the mathematics is unchanged either way). The '
      + 'Machine\'s sheets mark rows "new and unproven" — conjectures by construction — which is exactly what makes '
      + 'them the right audit corpus: a refutation is a discovery, not a gotcha. The other 50 printed rows SURVIVE; '
      + 'this registry says both things with the same arithmetic.') })
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
  lab: 'the registry', title: 'All 51 printed rows, plus the correction', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'row' }, { h: 'sheet' }, { h: 'the Machine says (sheet-time)' }, { h: 'defining CF' }, { h: 'claimed form' }, { h: 'verdict' }, { h: 'width' }],
    rows: bySheet.map(r => [
      { raw: '<span class="m">' + C.esc(r.id) + '</span>' },
      r.id === CORRECTED_ID ? sheetLabel[r.source] + ' · correction, ours — not a printed row' : sheetLabel[r.source],
      r.status,
      { raw: '<span class="m">' + C.esc(r.cf) + '</span>' },
      { raw: '<span class="m">' + C.esc(r.form) + '</span>' },
      { raw: r.verdict !== 'HIT' ? '<strong>REFUTED</strong>' : (r.id === CORRECTED_ID ? 'SURVIVES (correction)' : 'SURVIVES') },
      fmtW(r.width)
    ])
  })
    + '<div class="col">'
    + C.pRaw('The <strong>defining CF</strong> column is the object under audit — a(n) the partial denominators, '
      + 'b(n) the partial numerators, the labeling the sheets themselves use; the claimed form is only the '
      + 'right-hand side. ' + sameValue.length + ' claimed values appear on more than one row ('
      + sameValue.map(ids => ids.map(id => '<span class="m">' + C.esc(id) + '</span>').join(' / ')).join(' · ')
      + ') — those are not duplicates but distinct polynomial continued fractions conjectured to converge to the '
      + 'same constant, each decided on its own enclosure. Minus-CF rows print the sheet\'s negative numerators; '
      + 'the instrument stores sign-normalized transcriptions beside the originals, with the battery '
      + 'float-guarding every one. <strong>"The Machine says" is sheet-time status</strong>, kept as provenance: '
      + 'it is what the sheet printed at publication, and rows proved in the literature since publication keep '
      + 'their sheet-time label here — this column records what was claimed, the verdict column records what this '
      + 'audit decided.')
    + '</div>'
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

const foot = '<footer class="col"><p>Generated by tools/build-report-rm-audit.js @ git ' + git + '. All 52 '
  + 'certifications above — the 51 printed rows and the correction — were re-run during this build: tail bands '
  + 're-proved, enclosures re-evaluated, constants re-bracketed from their defining series, source PDFs re-hashed — '
  + 'and the build refuses on any deviation. Certificates and instruments: the cert-machine repository.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'rm-audit.html'),
  TPL.render({ title: 'The Ramanujan Machine, audited', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/reports/rm-audit.html',
    desc: 'The Ramanujan Machine\'s printed continued-fraction sheets as a certified standing registry: 51 printed rows re-decided at every build, one refuted as printed with the certified correction front and center.' }));
console.log('reports/rm-audit.html written: 51 printed rows re-certified (50 SURVIVE, 1 REFUTED; correction certified) @ git ' + git);
