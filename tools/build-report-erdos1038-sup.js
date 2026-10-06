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

   FRAMING DISCIPLINE. The supremum is a THEOREM, and not ours: Tao proved
   sup = 2*sqrt(2) over all probability measures on [-1,1], with the two-atom
   measure the only case of equality (forum thread of 21 Dec 2025; notes of
   22 and 27 Dec 2025, Theorem 2.1) — six days after posing it in
   teorth/erdosproblems#179. erdosproblems.com/1038 records sup = 2*sqrt(2)
   and google-deepmind/formal-conjectures marks erdos_1038.parts.ii
   "research solved". Until 2026-10-05 this page called it an open
   conjecture; that was wrong (paper/tex/erdos1038-sup.tex had already
   corrected it). Everything here is per-degree: independent re-decisions of
   a known theorem, not progress. The sources are pinned in
   corpus/sources/erdos1038 and re-hashed at every build. Machine-derived;
   not peer-reviewed.

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
const PIN = require(path.join(ROOT, 'instruments', 'pin.js'));

const die = (m) => { console.error('ERDOS1038-SUP REPORT REFUSED: ' + m); process.exit(1); };

/* ---- the sources the framing rests on, re-hashed: the page states a theorem of the literature, so the bytes
   that state it must still be the bytes read on 2026-10-05 (the problem page's sup = 2√2, formal-conjectures'
   "research solved", the forum's 21 Dec 2025 posts, Tao's #179, and the pin note for his two PDFs) */
const SRC = {
  page: 'erdos1038/erdosproblems-1038_2026-10-05.html',
  forum: 'erdos1038/erdosproblems-1038-forum_2026-10-05.html',
  fc: 'erdos1038/formal-conjectures-1038_89294ea0.lean',
  issue: 'erdos1038/teorth-erdosproblems-179_2026-10-05.json',
  notes: 'erdos1038/tao-notes-pin.txt'
};
for (const f of Object.values(SRC)) { const v = PIN.verify(f); if (!v.ok) die('pinned source ' + f + ': ' + v.why); }
{
  const rd = (f) => fs.readFileSync(path.join(ROOT, 'corpus', 'sources', f), 'utf8');
  if (!/\\sup\s*=\s*2\\sqrt\{2\}/.test(rd(SRC.page))) die('the pinned problem page no longer records sup = 2√2');
  if (!/@\[category research solved, AMS 28\]\s*\ntheorem erdos_1038\.parts\.ii/.test(rd(SRC.fc))) die('the pinned formal-conjectures file no longer marks parts.ii research solved');
  if (!/This proves that the \$sup\$ is indeed \$2 \\sqrt 2\$/.test(rd(SRC.forum))) die('the pinned forum thread no longer holds the 21 Dec 2025 confirmation');
}
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const S2 = 2 * Math.SQRT2;

/* ---- the record ----------------------------------------------------------- */
const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'sublevel-tao179.json'), 'utf8'));
const TH = rec.theorems || {};
const need = ['deg3', 'deg5', 'deg7', 'deg4', 'deg6'];
for (const k of need) if (!Object.keys(TH).some(t => t.startsWith(k) && !TH[t].failed)) die('theorem ' + k + ' missing from the record');
if (!rec.meta || !/^\d{4}-\d{2}-\d{2}$/.test(rec.meta.date || '')) die('the record carries no campaign date');
const thmRows = Object.entries(TH).filter(([, v]) => !v.failed);
const failedRows = Object.entries(TH).filter(([, v]) => v.failed);
const totalBoxes = thmRows.reduce((s, [, v]) => s + v.explored, 0);
/* the degree lists and their count are read off the record, never typed: the deck once said "the first seven
   degrees" over a record that holds six (3–8, degree 9 refused) */
const degs = thmRows.map(([, v]) => v.n).sort((a, b) => a - b);
const oddD = degs.filter((n) => n % 2 === 1), evenD = degs.filter((n) => n % 2 === 0);
const list = (a, conj) => (a.length < 2 ? String(a[0]) : a.slice(0, -1).join(', ') + ' ' + conj + ' ' + a[a.length - 1]);
const WORD = { 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten' };
const nWord = WORD[degs.length] || String(degs.length);
const span = degs.length && degs[degs.length - 1] - degs[0] + 1 === degs.length ? degs[0] + ' to ' + degs[degs.length - 1] : list(degs, 'and');

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
  deck: 'On 16 December 2025 Tao reformulated Erdős #1038 over discrete probability measures, asked for the '
    + 'supremum of |{U_μ < 0}|, and conjectured 2√2 — “this may be hard to prove completely.” Within the week the '
    + 'problem\'s forum had a proof, written up by Tao with its equality case. For rational weights the question is about root-constrained '
    + 'polynomials, decidable degree by degree; this machine re-decided degrees ' + span + ' in exact arithmetic, '
    + 'sharing no idea and no code with the proof: the odd ones stay below 2.82, and the even ones are placed in '
    + '[2√2, 2.82845]. Re-decisions of a known theorem, not progress on it.'
}));
B.push(C.scope('A known theorem, re-decided. That |{U_μ < 0}| ≤ 2√2 for every probability measure on [−1,1], '
  + 'with the two-atom measure the only case of equality, is Theorem 2.1 of Tao\'s notes of December 2025; '
  + 'erdosproblems.com/1038 records sup = 2√2 and google-deepmind/formal-conjectures marks erdos_1038.parts.ii '
  + '“research solved”. The per-degree certificates below neither use nor replace it. Until 2026-10-05 this page '
  + 'called the supremum an open conjecture; that was wrong. Every number on this page is a certified outward '
  + 'enclosure recomputed at this build; nothing is decided in floating point. Not peer-reviewed.'));

B.push(C.tldr({
  findingRaw: 'For every monic polynomial of degree <b>' + list(oddD, 'or') + '</b> with all roots in [−1,1]: '
    + C.m('|{|q|<1}| < 2.82 < 2√2') + ' — an explicit margin under the supremum. That each odd degree falls '
    + 'strictly below 2√2 already follows from Tao\'s equality clause; the 2.82 is what the certificates add. '
    + 'For degrees <b>' + list(evenD, 'and') + '</b>: the degree supremum lies in ' + C.m('[2√2, 2.82845]')
    + ', the left end attained by (x²−1)^{N/2} — 2.3×10⁻⁵ weaker than the theorem, which gives exactly 2√2.',
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
  { k: 'the witness', v: '2√2', vRaw: '2√2', n: 'x²−1: certified [' + wit.loD.toFixed(10) + ', ' + wit.hiD.toFixed(10) + '] — the two-atom measure, the only maximizer by Tao\'s theorem.' },
  { k: 'box certificates', v: totalBoxes.toLocaleString('en-US'), n: 'Across all theorems; the cubic needed 127 boxes, the heaviest even degree carries the rest.' },
  { k: 'configurations swept', v: Object.values(rec.sweeps).reduce((s, v) => s + v.configs, 0).toLocaleString('en-US'), n: 'Certified grid champions behind the landscape story, before any theorem was attempted.' }
]));

B.push(C.section({
  lab: '§1 · the problem', title: 'The other end of #1038',
  bodyRaw: [
    C.pRaw('Erdős #1038 asks how small, and how large, the sublevel set of a polynomial with constrained roots can '
      + 'be. Its <em>infimum</em> side is still open on the problem page: three AI-assisted proof claims of 2026 '
      + 'report the same constant, none examined by the site, and this lab '
      + '<a href="verify-lemniscate.html">independently verified the computational fragment</a> of one of them '
      + '(Darvas–Peng–Tao) and <a href="erdos1038-inf.html">brackets the infimum</a> unconditionally. In '
      + '<a href="https://github.com/teorth/erdosproblems/issues/179">erdosproblems#179</a> (16 December 2025), Tao '
      + 'posed the other end: over discrete probability measures μ = Σ pᵢ δ_{aᵢ} on [−1,1], with logarithmic '
      + 'potential U_μ(x) = Σ pᵢ log|x − aᵢ|, how LARGE can |{x : U_μ(x) &lt; 0}| be?'),
    C.pRaw('His conjecture: the supremum is ' + C.m('2√2') + ', attained by the uniform measure on {−1, +1} — '
      + 'and “this may be hard to prove completely.” It was proved within the week, in '
      + '<a href="https://www.erdosproblems.com/forum/thread/1038">the problem\'s forum thread</a>: on 21 December '
      + '2025 Tao posted a write-up completing the proof (AlphaEvolve proposed the weights for one regime), two '
      + 'participants confirmed it the same day, and his notes '
      + '(<a href="https://terrytao.wordpress.com/wp-content/uploads/2025/12/erdos-1038-2.pdf">27 December 2025</a>, '
      + 'Theorem 2.1) state it with its equality case: ' + C.m('L(μ) ≥ 2√2') + ' forces ' + C.m('μ = ½δ₋₁ + ½δ₁')
      + '. The <a href="https://www.erdosproblems.com/1038">problem page</a> records ' + C.m('sup = 2√2') + '; '
      + '<a href="https://github.com/google-deepmind/formal-conjectures/blob/89294ea02bd7cd678d59984add52cb4baef3dbf4/FormalConjectures/ErdosProblems/1038.lean">formal-conjectures</a> '
      + 'marks ' + C.m('erdos_1038.parts.ii') + ' “research solved”, proved in Tao\'s notes. This campaign '
      + '(' + C.esc(rec.meta.date) + ') was framed on the GitHub issue, which had no '
      + 'replies; the forum\'s resolution predates it.'),
    C.eq('p = k⁄N rational  ⟹  U_μ(x) &lt; 0  ⟺  |q(x)| &lt; 1,&nbsp;&nbsp; q(x) = Π (x − aᵢ)^{kᵢ} monic, roots in [−1,1]'),
    C.pRaw('So the theorem, restricted to rational weights of denominator N, is a statement about degree-N '
      + 'polynomials — a finite-dimensional object that exact arithmetic can decide degree by degree, without the '
      + 'potential theory. That is what this page re-decides: a second route to statements already known, not a '
      + 'new one.')
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
      + '2√2 the way the odd ones do.') + '</div>'
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
          + 'family (x²−1)²(x−r) climbs higher, to about 2.801 near r = 0.884, then descends steeply — the '
          + 'sublevel set splits into two intervals. A dashed rule marks 2√2, above both curves.',
        series: [
          { name: 'cubic (x²−1)(x−r)', pts: cubicPts },
          { name: 'quintic (x²−1)²(x−r)', pts: quinticPts }
        ],
        rules: [{ v: S2, t: '2√2 — the supremum (Tao, December 2025)', dashed: true }]
      }),
      caption: 'Both curves are certified enclosures recomputed at this build (the plotted value is the upper '
        + 'endpoint; widths are below picture resolution). The cubic family\'s best certified value is at an '
        + 'INTERIOR root — ' + rec.cubicChampion.measure.hiD.toFixed(6) + ' at r = 201/256 — not at a lattice '
        + 'point. The quintic family peaks at ' + rec.quinticPeak.measure.hiD.toFixed(6) + ' near r = 905/1024 '
        + 'and then descends steeply but continuously (for fixed degree the measure is continuous in the roots): '
        + 'a local maximum of |q| inside the sublevel interval crosses 1, a gap opens and widens, and {|q|<1} '
        + 'becomes two intervals. Until 2026-10-05 this caption called the descent a discontinuous drop where two '
        + 'components merge; both were wrong. The odd-degree families climb toward 2√2 without reaching it, as '
        + 'Tao\'s equality clause requires.'
    })
  ].join('\n')
}));

{
  const rows = thmRows
    .sort((a, b) => a[1].n - b[1].n)
    .map(([k, v]) => [
      { raw: C.m('N = ' + v.n) },
      { raw: v.n % 2 === 1
        ? C.esc('every degree-' + v.n + ' polynomial stays below 2.82 < 2√2 — an explicit margin under the supremum')
        : C.esc('the degree supremum lies in [2√2, 2.82845]; (x²−1)^' + (v.n / 2) + ' attains the left end (the theorem gives exactly 2√2)') },
      { raw: C.m(v.explored.toLocaleString('en-US')) },
      { raw: C.m(v.maxDepth + '') },
      { raw: C.m((v.ms / 1000).toFixed(v.ms > 10000 ? 0 : 1) + ' s') },
      { raw: v.n % 2 === 1 ? C.tag('strict', 'held') : C.tag('localized', 'cert') }
    ]);
  B.push(C.section({
    lab: '§4 · the certificates', title: nWord + ' degrees, re-decided', wide: true,
    bodyRaw: [
      C.table({ cols: [{ h: 'degree' }, { h: 'certified statement' }, { h: 'boxes', cls: 'v' }, { h: 'depth', cls: 'v' }, { h: 'time', cls: 'v' }, { h: '' }], rows }),
      '<div class="col">' + C.pRaw('Each row quantifies over EVERY root configuration in [−1,1]ᴺ — collisions and '
        + 'multiplicities included — through the ordered-and-mirrored branch-and-bound: a box is closed when the '
        + 'certified measure of {Π dist(x, Iᵢ) &lt; 1} falls below the threshold, and that bound equals the true '
        + 'measure on thin boxes (a battery check). In measure language: every discrete probability measure on '
        + '[−1,1] whose weights have denominator ' + list(oddD, 'or') + ' satisfies |{U_μ &lt; 0}| &lt; 2.82; for '
        + 'denominators ' + list(evenD, 'and') + ', the certified upper end is within 2.3×10⁻⁵ of 2√2 — weaker than '
        + 'Tao\'s theorem, which gives exactly 2√2 there, reached by an unrelated route.')
        + (failedRows.length ? C.note({
          lab: 'not decided', bodyRaw: C.pRaw(failedRows.map(([k, v]) => C.m(k) + ': ' + C.esc(String(v.failed))).join('<br>')
            + ' — recorded as attempted and refused, not silently dropped. Its answer is known from the theorem; '
            + 'the refusal is the instrument\'s budget, not an open question.')
        }) : '') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§5 · what this is', title: 'The honest boundary',
  bodyRaw: [
    C.plainList([
      { b: 'The theorem is Tao\'s, and it is settled.', raw: C.esc('sup |{U_μ < 0}| = 2√2 over all probability '
        + 'measures on [−1,1], with the two-atom measure the only case of equality, is Theorem 2.1 of his notes of '
        + 'December 2025, completed on the forum on 21 December 2025. These certificates neither use nor replace it: they are '
        + 'independent re-decisions of a known theorem, not progress on it. Until 2026-10-05 this page said the '
        + 'conjecture remained open; the write-up, ') + C.m('paper/tex/erdos1038-sup.tex') + C.esc(', had already '
        + 'corrected that framing.') },
      { b: 'What the certificates add.', text: 'An explicit margin at odd degrees (below 2.82, about ' + (S2 - 2.82).toFixed(4) + ' under '
        + '2√2) that the theorem does not state; certified landscape data for the families that approach the '
        + 'witness; and a refusal at the first degree the budget could not close. That each odd degree falls '
        + 'strictly below 2√2 is already a consequence of the theorem\'s equality clause.' },
      { b: 'The even-degree equality case is the theorem\'s, not ours.', text: 'The certificates place the '
        + 'even-degree supremum in [2√2, 2.82845]; Tao\'s theorem gives exactly 2√2, with the witness the only '
        + 'maximizer. A certificate of this kind cannot reach 2√2 itself, because the witness attains it.' },
      { b: 'Higher degrees are compute, not new ideas.', text: 'The branch-and-bound certificates grow with '
        + 'dimension but nothing structural changes — a statement about the instrument, not a certified one.' },
      { b: 'Machine-derived, not peer-reviewed.', text: 'Every claim re-derives in one command; the record is '
        + 'certs/sublevel-tao179.json; the sources this framing rests on are pinned in corpus/sources/erdos1038; '
        + 'refutations are invited.' }
    ])
  ].join('\n')
}));

const foot = ''
  + '<p>' + C.esc('Generated by tools/build-report-erdos1038-sup.js — witness, calibrations and both family curves re-certified at build; theorem table read from the campaign record; the five framing sources re-hashed against corpus/sources/PINS.json.') + '</p>'
  + '<p>' + C.esc('git ' + gitrev + ' · the theorem: T. Tao, forum thread 1038 (21 Dec 2025) and notes of 22 and 27 Dec 2025, Theorem 2.1 · framing: teorth/erdosproblems#179 · the infimum side: three claimed proofs, the Darvas–Peng–Tao computational fragment verified at reports/verify-lemniscate.html') + '</p>'
  + '';

fs.writeFileSync(path.join(ROOT, 'reports', 'erdos1038-sup.html'),
  TPL.render({
    title: 'The supremum side of Erdős #1038 · cert-machine',
    bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot,
    desc: 'Erdős #1038, supremum side: Tao\'s theorem sup = 2√2 (December 2025) re-decided degree by degree in exact '
      + 'arithmetic — odd degrees ' + list(oddD, 'and') + ' below 2.82; even degrees ' + list(evenD, 'and') + ' placed in '
      + '[2√2, 2.82845] with the two-atom witness at the left end. Independent re-decisions of a known theorem, not '
      + 'progress; machine-derived, not peer-reviewed.',
    path: '/reports/erdos1038-sup.html'
  }));
console.log('reports/erdos1038-sup.html written: ' + thmRows.length + ' theorems, '
  + totalBoxes.toLocaleString('en-US') + ' boxes, curves ' + cubicPts.length + '+' + quinticPts.length + ' certified points @ git ' + gitrev);
