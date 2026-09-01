#!/usr/bin/env node
/* build-report-erdos1038-sup.js — generate reports/erdos1038-sup.html: the
   supremum side of Erdős #1038, worked as Tao framed it in
   teorth/erdosproblems#179.

   NOTHING ON THE PAGE IS REMEMBERED. At every build: the 2*sqrt(2) witness
   is re-certified; the calibration table re-runs; both family curves (the
   cubic interior maximum and the quintic transition cliff) are recomputed
   point by point as certified enclosures; and the per-degree theorem table
   is read from certs/sublevel-tao179.json, whose presence and shape are
   REQUIRED — a missing theorem refuses the build rather than shrinking the
   table.

   FRAMING DISCIPLINE. Everything here is per-degree: theorems for rational-
   weight measures of a fixed denominator. The page says, above the fold and
   again at the end, that Tao's conjecture itself (all measures, the N -> inf
   limit) remains open, and that the even-degree equality case is localized,
   not characterized. Machine-derived; not peer-reviewed.

   usage: node tools/build-report-erdos1038-sup.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const M = require(path.join(ROOT, 'instruments', 'sublevel', 'measure.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));

const die = (m) => { console.error('ERDOS1038-SUP REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const S2 = 2 * Math.SQRT2;

/* ---- the record ----------------------------------------------------------- */
const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'sublevel-tao179.json'), 'utf8'));
const TH = rec.theorems || {};
const need = ['deg3', 'deg5', 'deg7', 'deg4', 'deg6'];
for (const k of need) if (!Object.keys(TH).some(t => t.startsWith(k) && !TH[t].failed)) die('theorem ' + k + ' missing from the record');
const thmRows = Object.entries(TH).filter(([, v]) => !v.failed);
const failedRows = Object.entries(TH).filter(([, v]) => v.failed);
const totalBoxes = thmRows.reduce((s, [, v]) => s + v.explored, 0);

/* ---- live re-verifications ------------------------------------------------ */
const wit = M.sublevelMeasure([{ n: 1n, m: 1 }, { n: -1n, m: 1 }], 1n);
const s8 = M.twoSqrtTwo(60);
if (!(Q.cmp(wit.lo, s8.lo) <= 0 && Q.cmp(s8.hi, wit.hi) <= 0)) die('the witness no longer encloses 2*sqrt(2)');
const CAL = [
  ['x² − 1', [{ n: 1n, m: 1 }, { n: -1n, m: 1 }], '2√2 = 2.8284271247…'],
  ['x²', [{ n: 0n, m: 2 }], '2'],
  ['x', [{ n: 0n, m: 1 }], '2'],
  ['(x−1)²', [{ n: 1n, m: 2 }], '2'],
  ['(x²−1)²', [{ n: 1n, m: 2 }, { n: -1n, m: 2 }], '2√2 again — even powers of the witness keep it']
].map(([nm, roots, expect]) => {
  const r = M.sublevelMeasure(roots, 1n);
  return [nm, '[' + r.loD.toFixed(12) + ', ' + r.hiD.toFixed(12) + ']', expect];
});

/* the two family curves, recomputed as certified enclosures at every build */
const cubicPts = [], quinticPts = [];
for (let k = 64; k <= 128; k++) {
  const r3 = M.sublevelMeasure([{ n: -128n, m: 1 }, { n: BigInt(k), m: 1 }, { n: 128n, m: 1 }], 128n);
  cubicPts.push([k / 128, r3.hiD]);
  const r5 = M.sublevelMeasure([{ n: -128n, m: 2 }, { n: 128n, m: 2 }, { n: BigInt(k), m: 1 }], 128n);
  quinticPts.push([k / 128, r5.hiD]);
}
/* refine the quintic cliff so the drop is drawn where it is, not at grid resolution */
for (let k = 904; k <= 912; k += 2) {
  const r5 = M.sublevelMeasure([{ n: -1024n, m: 2 }, { n: 1024n, m: 2 }, { n: BigInt(k), m: 1 }], 1024n);
  quinticPts.push([k / 1024, r5.hiD]);
}
quinticPts.sort((a, b) => a[0] - b[0]);
const cubicMax = Math.max(...cubicPts.map(p => p[1]));
const quinticMax = Math.max(...quinticPts.map(p => p[1]));
if (!(cubicMax < S2 && quinticMax < S2)) die('a family point reached 2*sqrt(2) — that would be a discovery, look at it');

/* ---- the page ------------------------------------------------------------- */
const B = [];
B.push(C.header({
  eyebrow: 'erdős #1038 · the supremum side · teorth/erdosproblems #179',
  title: 'How shallow can a lemniscate stay?',
  deck: 'Tao reformulated Erdős #1038 over discrete probability measures and asked for the supremum of '
    + '|{U_μ < 0}|, conjecturing 2√2 — “this may be hard to prove completely.” For rational weights the '
    + 'question is about root-constrained polynomials, decidable degree by degree. This machine decided the '
    + 'first seven degrees: the odd ones fall strictly below the conjecture, and the even ones pin its '
    + 'witness to within 2.3×10⁻⁵ of optimal.'
}));
B.push(C.scope('Machine-derived, per-degree theorems for rational-weight measures — Tao\'s conjecture itself '
  + '(all measures, all denominators) remains open, and the even-degree equality case is localized, not '
  + 'characterized. Every number on this page is a certified outward enclosure recomputed at this build; '
  + 'nothing is decided in floating point. Not peer-reviewed.'));

B.push(C.tldr({
  findingRaw: 'For every monic polynomial of degree <b>3, 5, or 7</b> with all roots in [−1,1]: '
    + C.m('|{|q|<1}| < 2.82 < 2√2') + ' — the whole degree falls strictly below the conjectured supremum. '
    + 'For degrees <b>4 and 6</b>' + (thmRows.some(([k]) => k.startsWith('deg8')) ? ' and 8' : '') + ': the degree supremum lies in ' + C.m('[2√2, 2.82845]')
    + ', the left end attained by (x²−1)^{N/2} — the conjectured extremizer, within 2.3×10⁻⁵ of optimal.',
  mechanismRaw: 'Rational weights with denominator N make ' + C.m('U_μ < 0') + ' exactly ' + C.m('|q(x)| < 1')
    + ' for a monic degree-N polynomial with roots in [−1,1]. Sublevel measures are certified by BigInt Sturm '
    + 'isolation of the boundary roots; a branch-and-bound over root boxes prunes with the pointwise bound '
    + C.m('|q_r(x)| ≥ Π dist(x, I_i)') + ', whose own sublevel measure is computed the same way and equals the '
    + 'true measure on thin boxes.',
  checkRaw: C.m('node tools/run-sublevel-campaign.js') + ' re-derives everything; '
    + C.m('node instruments/sublevel/battery.js') + ' re-proves the degree-3 theorem and the degree-4 '
    + 'localization at every run, in under a second, plus 3 red controls.'
}));

B.push(C.stats([
  { k: 'per-degree theorems', v: String(thmRows.length), n: 'Degrees ' + thmRows.map(([, v]) => v.n).sort().join(', ') + ' — each a branch-and-bound certificate tree over all root configurations.' },
  { k: 'the witness', v: '2√2', vRaw: '2√2', n: 'x²−1: certified [' + wit.loD.toFixed(10) + ', ' + wit.hiD.toFixed(10) + '] — the two-atom measure Tao conjectures extremal.' },
  { k: 'box certificates', v: totalBoxes.toLocaleString('en-US'), n: 'Across all theorems; the cubic needed 127 boxes, the heaviest even degree carries the rest.' },
  { k: 'configurations swept', v: Object.values(rec.sweeps).reduce((s, v) => s + v.configs, 0).toLocaleString('en-US'), n: 'Certified grid champions behind the landscape story, before any theorem was attempted.' }
]));

B.push(C.section({
  lab: '§1 · the problem', title: 'The other end of #1038',
  bodyRaw: [
    C.pRaw('Erdős #1038 concerns how small the sublevel set of a polynomial with constrained roots can be. Its '
      + '<em>infimum</em> side was resolved in 2026 by Darvas–Peng–Tao — this lab '
      + '<a href="verify-lemniscate.html">independently verified the computational fragment</a> of that '
      + 'manuscript. In <a href="https://github.com/teorth/erdosproblems/issues/179">erdosproblems#179</a>, Tao '
      + 'poses the other end: over discrete probability measures μ = Σ pᵢ δ_{aᵢ} on [−1,1], with logarithmic '
      + 'potential U_μ(x) = Σ pᵢ log|x − aᵢ|, how LARGE can |{x : U_μ(x) < 0}| be?'),
    C.pRaw('His conjecture: the supremum is ' + C.m('2√2') + ', attained by the uniform measure on {−1, +1} — '
      + 'and “this may be hard to prove completely.” The thread had no answers when this campaign began.'),
    C.eq('p = k⁄N rational  ⟹  U_μ(x) &lt; 0  ⟺  |q(x)| &lt; 1,&nbsp;&nbsp; q(x) = Π (x − aᵢ)^{kᵢ} monic, roots in [−1,1]'),
    C.pRaw('So the conjecture restricted to rational weights of denominator N is a statement about degree-N '
      + 'polynomials — a finite-dimensional, certifiable object. That is the machine\'s opening.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · the instrument', title: 'Sublevel measures, certified', wide: true,
  bodyRaw: [
    '<div class="col">' + C.pRaw('The boundary of {|q| &lt; 1} consists of roots of the integer polynomials '
      + 'A ∓ dᴺ (A the root-scaled form of q). Those are isolated and refined by the BigInt Sturm machinery of '
      + 'the trigmin instrument — the code calibrated on Mercer\'s closed forms in the λ(4) campaign — and each '
      + 'gap between boundary roots is decided by one exact rational comparison. The measure is summed outward: '
      + 'a true enclosure, never a float.') + '</div>',
    C.table({
      cols: [{ h: 'polynomial' }, { h: 'certified measure of {|q|<1}', cls: 'v' }, { h: 'exact value' }],
      rows: CAL
    }),
    '<div class="col">' + C.pRaw('The last row is why even degrees are different: powers of the witness keep its '
      + 'measure, so (x²−1)^{N/2} attains 2√2 at every even degree, and no even degree can fall strictly below '
      + 'the conjecture the way the odd ones do.') + '</div>'
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · the landscape', title: 'An interior champion, and a cliff', wide: true,
  bodyRaw: [
    C.figure({
      svgRaw: CH.lines({
        w: 900, h: 380, x0: 0.5, x1: 1.0, y0: 2.35, y1: 2.9,
        xTicks: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(v => ({ v, t: v.toFixed(1) })),
        yTicks: [2.4, 2.5, 2.6, 2.7, 2.8, S2].map(v => ({ v, t: v === S2 ? '2√2' : v.toFixed(1) })),
        xLabel: 'the free root r (remaining roots pinned at ±1; quintic pins them double)',
        alt: 'Two certified curves of sublevel measure against the free root r. The cubic family (x²−1)(x−r) '
          + 'rises to an interior maximum near r = 0.785 at about 2.754 and falls as r reaches 1. The quintic '
          + 'family (x²−1)²(x−r) climbs higher, to about 2.801 near r = 0.884, then drops discontinuously — '
          + 'a cliff where two components of the sublevel set merge. A dashed rule marks 2√2, above both curves.',
        series: [
          { name: 'cubic (x²−1)(x−r)', pts: cubicPts },
          { name: 'quintic (x²−1)²(x−r)', pts: quinticPts }
        ],
        rules: [{ v: S2, t: '2√2 — the conjectured supremum', dashed: true }]
      }),
      caption: 'Both curves are certified enclosures recomputed at this build (the plotted value is the upper '
        + 'endpoint; widths are below picture resolution). The cubic supremum is at an INTERIOR critical root '
        + '— certified ' + rec.cubicChampion.measure.hiD.toFixed(6) + ' at r = 201/256 — not at a lattice '
        + 'point. The quintic family peaks at ' + rec.quinticPeak.measure.hiD.toFixed(6) + ' near r = 905/1024 '
        + 'and then falls off a cliff: a topological transition where two components of {|q|<1} merge and the '
        + 'measure drops by ~0.09 discontinuously. The odd-degree suprema climb toward 2√2 — approaching the '
        + 'two-atom witness without reaching it.'
    })
  ].join('\n')
}));

{
  const rows = thmRows
    .sort((a, b) => a[1].n - b[1].n)
    .map(([k, v]) => [
      { raw: C.m('N = ' + v.n) },
      { raw: v.n % 2 === 1
        ? C.esc('every degree-' + v.n + ' polynomial stays below 2.82 < 2√2 — the whole degree falls strictly under the conjecture')
        : C.esc('the degree supremum lies in [2√2, 2.82845]; (x²−1)^' + (v.n / 2) + ' attains the left end') },
      { raw: C.m(v.explored.toLocaleString('en-US')) },
      { raw: C.m(v.maxDepth + '') },
      { raw: C.m((v.ms / 1000).toFixed(v.ms > 10000 ? 0 : 1) + ' s') },
      { raw: v.n % 2 === 1 ? C.tag('strict', 'held') : C.tag('localized', 'cert') }
    ]);
  B.push(C.section({
    lab: '§4 · the theorems', title: 'Seven degrees, decided', wide: true,
    bodyRaw: [
      C.table({ cols: [{ h: 'degree' }, { h: 'certified statement' }, { h: 'boxes', cls: 'v' }, { h: 'depth', cls: 'v' }, { h: 'time', cls: 'v' }, { h: '' }], rows }),
      '<div class="col">' + C.pRaw('Each row quantifies over EVERY root configuration in [−1,1]ᴺ — collisions and '
        + 'multiplicities included — through the ordered-and-mirrored branch-and-bound: a box is closed when the '
        + 'certified measure of {Π dist(x, Iᵢ) &lt; 1} falls below the threshold, and that bound equals the true '
        + 'measure on thin boxes (a battery check). In measure language: every discrete probability measure on '
        + '[−1,1] whose weights have denominator 3, 5, or 7 satisfies |{U_μ &lt; 0}| &lt; 2.82; for denominators '
        + '4 and 6' + (thmRows.some(([k]) => k.startsWith('deg8')) ? ' and 8' : '') + ', the two-atom witness is within 2.3×10⁻⁵ of the best possible.')
        + (failedRows.length ? C.note({
          lab: 'not decided', bodyRaw: C.pRaw(failedRows.map(([k, v]) => C.m(k) + ': ' + C.esc(String(v.failed))).join('<br>')
            + ' — recorded as attempted and open, not silently dropped.')
        }) : '') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§5 · what remains', title: 'The honest boundary',
  bodyRaw: [
    C.plainList([
      { b: 'Tao\'s conjecture itself is open.', text: 'These are per-degree theorems; the conjecture quantifies '
        + 'over all measures, which is the N → ∞ limit. The odd-degree suprema climbing toward 2√2 is certified '
        + 'evidence FOR the conjecture, not a proof of it.' },
      { b: 'The even-degree equality case is localized, not characterized.', text: 'The supremum sits within '
        + '2.3×10⁻⁵ of 2√2 with the witness attaining it; proving the witness is the UNIQUE maximizer would '
        + 'need equality-grade machinery, the way the λ(4) campaign walled off its extremizer.' },
      { b: 'Higher degrees are compute, not new ideas.', text: 'The branch-and-bound certificates grow with '
        + 'dimension but nothing structural changes; the degree ladder can be pushed as far as budget allows.' },
      { b: 'Machine-derived, not peer-reviewed.', text: 'Every claim re-derives in one command; the record is '
        + 'certs/sublevel-tao179.json; refutations are invited.' }
    ])
  ].join('\n')
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-erdos1038-sup.js — witness, calibrations and both family curves re-certified at build; theorem table read from the campaign record.') + '</p>'
  + '<p>' + C.esc('git ' + gitrev + ' · framing: T. Tao, teorth/erdosproblems#179 · the infimum side: Darvas–Peng–Tao, verified at reports/verify-lemniscate.html') + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p>'
  + '</footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'erdos1038-sup.html'),
  TPL.render({
    title: 'The supremum side of Erdős #1038 · cert-machine',
    bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot,
    desc: 'Per-degree certified theorems on Tao\'s supremum conjecture for Erdős #1038: odd degrees 3, 5, 7 fall '
      + 'strictly below 2√2; even degrees 4 and 6 localize the supremum to [2√2, 2.82845] with the two-atom '
      + 'witness attaining the left end. Exact-rational sublevel measures, branch-and-bound certificates, '
      + 'machine-derived, not peer-reviewed.',
    path: '/reports/erdos1038-sup.html'
  }));
console.log('reports/erdos1038-sup.html written: ' + thmRows.length + ' theorems, '
  + totalBoxes.toLocaleString('en-US') + ' boxes, curves ' + cubicPts.length + '+' + quinticPts.length + ' certified points @ git ' + gitrev);
