/* build.js — site/playground/answer-shape/index.html.

   Crossed from the bench (see PROVENANCE.json), page rebuilt here. This is NOT
   the same experiment as /playground/neural-geometry, which is ours: eighteen
   sets, 527 calls, $0.78. This one asks seven subjects with every pair put both
   ways round — 132 calls per model on a twelve-item set — and spends its budget
   on asymmetry rather than on breadth.

   What it is here for is the components. A table of distances fixes nothing
   about rotation, reflection or overall size, so putting three models in one
   frame means removing exactly those freedoms and nothing else — and what is
   left is disagreement about SHAPE. That comparison, the heat tables under it,
   and the triangle-inequality matrix are the parts the operator asked for by
   name, and they are now available to every page here.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));                    /* the grammar's words (WARRANT v2, 2026-10-28) */
const GR = require(path.join(PG, '..', 'design', 'grammar.js'));    /* the ink-* classes, and IDENTITY for the overlay */
const { mstUnique } = require(path.join(PG, 'mst.js'));   /* one uniqueness test for every tree drawn */

/* WARRANT v2 (2026-10-28) — THE TREES. page.js and plate.js are crossed byte for byte (PROVENANCE.json), so the
   grammar is applied here, in the shell, and they stay untouched. Where a subject has no order each plate draws the
   minimum spanning tree, built with a strict "<": where two edges tie, the first found wins, and a tree picked by a
   tie-break is ONE MEMBER of the set of minimum spanning trees the numbers admit — CHOSEN, dotted. Five of the six
   trees here tie. plate() and overlay() are wrapped BEFORE page.js reads them (it destructures them at load), and
   the wrapper only adds a class to the tree it was handed; every count is gated after the body is built. */
const PL = require('./plate.js');
const marked = { plates: 0, overlays: 0 };
{
  const plate0 = PL.plate, overlay0 = PL.overlay;
  PL.plate = (rec, opts) => {
    const svg = plate0(rec, opts);
    if (rec && rec.pts && !rec.order && rec.mst && !mstUnique(rec.D, rec.mst)) { marked.plates++; return svg.replace('class="mst"', 'class="mst ink-chosen-sm"'); }
    return svg;
  };
  PL.overlay = (recs, items, order, opts) => {
    let svg = overlay0(recs, items, order, opts);
    if (order) return svg;
    recs.filter((r) => r && r.pts).forEach((r, k) => {
      if (r.mst && !mstUnique(r.D, r.mst)) { marked.overlays++; svg = svg.replace(`class="ov m${k}"`, `class="ov m${k} ${GR.pick(GR.IDENTITY[k].weight) === GR.PICK ? 'ink-chosen' : 'ink-chosen-sm'}"`); }
    });
    return svg;
  };
}
const A = require('./page.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
const G = A.G;
const spend = (G.spend || []).reduce((a, x) => a + x.usd, 0);
const calls = (G.subjects || []).reduce((a, s) => a + (s.items ? s.items.length * (s.items.length - 1) : 0), 0);

const head = () => `
<header class="hero"><div class="container">
  <div class="eyebrow">instruments · answer shape · ${G.subjects.length} subjects × ${G.models.length} models · $${spend.toFixed(2)}, already spent</div>
  <h1 class="display mt4">The shape of an answer</h1>
  <p class="lede mt6">Ask a model how different two things are, one pair at a time, and you get a table of numbers. A table of distances is a shape — or it is not one, and the difference is decidable. <b>Every pair is asked both ways round</b>, so the asymmetry is measured rather than averaged away, and the two halves of each pair come from calls that never see each other. What is decided here is integer arithmetic: the metric gate, the exact signature, δ. The plates, the spectra, the shape fits and the agreement scores are floating point and carry the dashed underline, the effective rank (a count under a 99% cutoff) the dotted one; and where a set has no order, the tree drawn is dotted when the numbers tie and it is one of several, as ${TIED} of the ${TREES.length} are.</p>
  <div class="hero-meta">
    <span class="item"><span class="k">subjects</span><span class="v">${G.subjects.map((s) => s.id).join(' · ')}</span></span>
    <span class="item"><span class="k">models</span><span class="v">${G.models.map((m) => m.label).join(' · ')}</span></span>
    <span class="item"><span class="k">decided in</span><span class="v">exact integer arithmetic</span></span>
  </div>
  ${W.legendHtml({ compact: true })}
</div></header>`;

const foot = `
`;

const sectionsRaw = (() => { const i = A.body.indexOf('<section class="section'); return i < 0 ? A.body : A.body.slice(i); })();

/* WARRANT v2 (2026-10-28) — THE REST OF THE GRAMMAR, applied to the crossed body and stylesheet here, each by a gated
   replacement: if page.js ever renders differently, the build stops rather than silently dropping a mark.

   COMPUTED (float): the negative mass (a Jacobi spectrum), the line and cycle residuals and their bars (closed-form
   least squares in float), the agreement r and the shape gap (Procrustes). CHOSEN: the tied trees above, and the
   effective rank — a count of the float eigenvalues that reach 99% of the spectrum's mass, a cutoff (exact-geometry
   says the same of its own). DECIDED: the metric gate and its counts, the exact signature, δ/diameter, the contrast,
   the asymmetry, the closing step.

   Two dashes were carrying ROLE and IDENTITY, which dash never does: the closing edge (5 4, the claim pattern, on a
   step computed exactly like every other) and the overlay's model chips (dashed and dotted for the second and third
   model, while the lines they name are all solid — the overlay had moved to weight and opacity and its legend had
   not). Both now ride opacity alone.

   And one sentence read its own number wrong: "the worst triple misses by 64% of the whole scale". 64% is that
   triple's miss against the largest distance ITS model named (Haiku 4.5 named nothing above 115); against the whole
   0–198 scale the worst miss is 118 (Opus 5), 60%. Both readings are printed now. */
const once = (s, from, to, what) => {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error('answer-shape: expected one ' + what + ' in the crossed page, found ' + n + ' — page.js changed; re-read it');
  return s.split(from).join(to);
};
/* D10, R23, R30 (2026-10-30). Every printed value carries the address of the record cell it is, or of the cells it is
   computed from, in the record page.js reads (out/geometry.json, pinned in PROVENANCE.json); every plate names that
   record and the check that would stop it. A cell printed as the record holds it is W.val (tools/check-marks.js re-reads
   it); a number computed from cells (a fraction printed as a percentage, a count with its label) is derived: [its cells].
   One kind of readout at a time, in page.js's order: the k-th match must be exactly what page.js prints from the record
   (`from`), and becomes the same text with every number marked and addressed (`to`); the count is gated. */
const RD = require(path.join(PG, '..', 'design', 'record.js'));
const DC = require(path.join(PG, '..', 'design', 'components.js'));
/* REDRAWN IN TOKENS (2026-10-30, the operator: the instruments take the light theme). page.js is lifted and keeps its
   literal screen inks (#f6f6f8 strokes, a #0a0a0c hollow point); the page, its sheet and its card go out through
   playground/design/inks.js, which re-points each at the token holding that very value: the same pixels in the dark,
   ink on paper in the light. */
const INK = require(path.join(PG, 'design', 'inks.js'));
const REC = 'playground/answer-shape/out/geometry.json';
const at = (ptr) => `${REC}#${ptr}`;
const SUB = (id) => G.subjects.find((s) => s.id === id);
const P = (s, M, rest) => `/subjects[id=${s.id}]/byModel/${RD.key(M.id)}/${rest}`;
const seq = (s, re, list, what) => {
  let k = 0;
  const out = s.replace(re, (whole) => {
    const it = list[k++];
    if (!it || whole !== it.from) throw new Error(`answer-shape: ${what} #${k} reads ${JSON.stringify(whole)}, the record gives ${it ? JSON.stringify(it.from) : 'nothing more'} — page.js changed; re-read it`);
    return it.to;
  });
  if (k !== list.length) throw new Error('answer-shape: expected ' + list.length + ' ' + what + ', found ' + k + ' — page.js changed; re-read it');
  return out;
};
const RANK_WHY = 'chosen — a count of the eigenvalues that reach 99% of a float spectrum: a cutoff, on floats';
const C = (x, ptrs) => W.value(x, W.COMPUTED, { derived: ptrs.map(at) });
const RANK = (x, ptrs) => W.value(x, W.CHOSEN, { title: RANK_WHY, derived: ptrs.map(at) });
/* a record cell printed by a record.js format; `was` is what page.js printed, which must be what the record prints */
const V = (was, ptr, fmt, standing = W.COMPUTED, why) => {
  const now = RD.print(RD.read(REC, ptr), fmt, W.NAME[standing].toLowerCase());
  if (was !== now) throw new Error(`answer-shape: page.js printed ${JSON.stringify(was)} where ${ptr} prints ${JSON.stringify(now)} (${fmt})`);
  return W.val({ rec: { path: REC, ptr }, standing, fmt, why });
};
const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;                /* page.js's own */
if (!fs.readFileSync(path.join(PG, 'exact-geometry', 'decide.js'), 'utf8').includes('acc / tot >= 0.99')) throw new Error('answer-shape: the effective rank is no longer cut at 99% (exact-geometry/decide.js spectrumOf); rewrite the sentences that say so');
const scaleTop = 2 * G.scale;                                       /* the two directions are ADDED: 0–198 */
const chromS = G.subjects.find((s) => s.id === 'chromatic');
const missOf = (M) => Math.abs(chromS.byModel[M.id].gate.worstSlack || 0);
const worstAbs = G.models.reduce((a, M) => (missOf(M) > missOf(a) ? M : a));
const worstRel = G.models.reduce((a, M) => (chromS.byModel[M.id].gate.relSlack > chromS.byModel[a.id].gate.relSlack ? M : a));
const pct0 = (x) => `${(100 * x).toFixed(0)}%`;
let sections = sectionsRaw;
sections = once(sections, `The worst triple in ${chromS.title} misses by ${pct0(chromS.byModel[worstRel.id].gate.relSlack)} of the whole scale.`,
  `The worst triple in ${chromS.title} misses by ${pct0(missOf(worstAbs) / scaleTop)} of the whole 0–${scaleTop} scale (${worstAbs.label}, ${missOf(worstAbs)} units), and by ${pct0(chromS.byModel[worstRel.id].gate.relSlack)} of the largest distance ${worstRel.label} named.`, 'chromatic worst-triple sentence');
/* the plates, in page.js's order: the paired clock and digits, then the five subject sections */
const PLATES = ['clock', 'digits', 'weekdays', 'chromatic', 'hues', 'carnivores', 'nonsense'].map(SUB);
if (PLATES.length !== G.subjects.length || PLATES.some((s) => !s)) throw new Error('answer-shape: the record\'s subjects are no longer the seven page.js draws');
sections = seq(sections, /<span class="fit">(?:line \d+% · cycle \d+%|rank \d+ · neg \d+%)<\/span>/g, PLATES.flatMap((s) => G.models.map((M) => {
  const r = s.byModel[M.id];
  return r.fits
    ? { from: `<span class="fit">line ${pct(r.fits.line.resid)} · cycle ${pct(r.fits.cycle.resid)}</span>`,
      to: `<span class="fit">${C(`line ${pct(r.fits.line.resid)} · cycle ${pct(r.fits.cycle.resid)}`, [P(s, M, 'fits/line/resid'), P(s, M, 'fits/cycle/resid')])}</span>` }
    : { from: `<span class="fit">rank ${r.spectrum.effRank} · neg ${pct(r.spectrum.negMass)}</span>`,
      to: `<span class="fit">${RANK(`rank ${r.spectrum.effRank}`, [P(s, M, 'spectrum/effRank')])} · ${C(`neg ${pct(r.spectrum.negMass)}`, [P(s, M, 'spectrum/negMass')])}</span>` };
})), 'plate residual captions');
sections = seq(sections, /<span class="bv">\d+%<\/span>/g, G.subjects.filter((s) => s.order).flatMap((s) => G.models.flatMap((M) => ['line', 'cycle'].map((k) => {
  const v = pct(s.byModel[M.id].fits[k].resid);
  return { from: `<span class="bv">${v}</span>`, to: `<span class="bv">${C(v, [P(s, M, `fits/${k}/resid`)])}</span>` };
}))), 'fit-bar values');
/* each subject section: its stat table's two float rows, then its agreement table */
const row = (h, cells) => `<div class="h">${h}</div>` + cells.map((c) => `<div>${c}</div>`).join('');
sections = seq(sections, /<div class="h">(?:effective rank|negative mass|distances, r|shape gap)<\/div>(?:<div>[^<]*<\/div>){3}/g, PLATES.slice(2).flatMap((s) => {
  const ix = (p) => s.pairs.indexOf(p);
  return [
    { from: row('effective rank', G.models.map((M) => s.byModel[M.id].spectrum.effRank)),
      to: row('effective rank', G.models.map((M) => V(String(s.byModel[M.id].spectrum.effRank), P(s, M, 'spectrum/effRank'), 'int', W.CHOSEN, RANK_WHY))) },
    { from: row('negative mass', G.models.map((M) => pct(s.byModel[M.id].spectrum.negMass, 1))),
      to: row('negative mass', G.models.map((M) => C(pct(s.byModel[M.id].spectrum.negMass, 1), [P(s, M, 'spectrum/negMass')]))) },
    { from: row('distances, r', s.pairs.map((p) => p.r.toFixed(2))),
      to: row('distances, r', s.pairs.map((p) => V(p.r.toFixed(2), `/subjects[id=${s.id}]/pairs/${ix(p)}/r`, 'fixed:2'))) },
    { from: row('shape gap', s.pairs.map((p) => (p.gap === null ? '—' : pct(p.gap)))),
      to: row('shape gap', s.pairs.map((p) => (p.gap === null ? '—' : C(pct(p.gap), [`/subjects[id=${s.id}]/pairs/${ix(p)}/gap`])))) },
  ];
}), 'float table rows');
/* the paired experiment's note and the closing paragraph: the model page.js picks (lowest clock cycle residual, lowest
   digit line residual) is read off all three models' cells, so each value names the cells it was picked from too */
{
  const clock = SUB('clock'), digits = SUB('digits');
  const bestClock = G.models.map((M) => ({ M, v: clock.byModel[M.id].fits.cycle.resid })).sort((a, b) => a.v - b.v)[0].M;
  const bestDigit = G.models.map((M) => ({ M, v: digits.byModel[M.id].fits.line.resid })).sort((a, b) => a.v - b.v)[0].M;
  const clockCycles = G.models.map((M) => P(clock, M, 'fits/cycle/resid')), digitLines = G.models.map((M) => P(digits, M, 'fits/line/resid'));
  const circle = pct(clock.byModel[bestClock.id].fits.cycle.resid), circleAt = [P(clock, bestClock, 'fits/cycle/resid'), ...clockCycles.filter((p) => p !== P(clock, bestClock, 'fits/cycle/resid'))];
  const line = pct(digits.byModel[bestClock.id].fits.line.resid), against = pct(digits.byModel[bestDigit.id].fits.cycle.resid);
  sections = seq(sections, /(?:as a circle to |as a line to |fit a circle at )\d+%/g, [
    { from: `as a circle to ${circle}`, to: `as a circle to ${C(circle, circleAt)}` },
    { from: `as a line to ${line}`, to: `as a line to ${C(line, [P(digits, bestClock, 'fits/line/resid'), ...clockCycles])}` },
    { from: `fit a circle at ${against}`, to: `fit a circle at ${C(against, [P(digits, bestDigit, 'fits/cycle/resid'), ...digitLines])}` },
  ], 'note residuals');
  sections = seq(sections, /reconstructed a \d+%-residual circle/g, [{ from: `reconstructed a ${circle}-residual circle`, to: `reconstructed a ${C(circle, circleAt)}-residual circle` }], 'closing residual');
}
sections = once(sections, 'Each has exactly one free scale, fixed in closed form, so the residuals are comparable. Shorter is better.',
  'Each has exactly one free scale, fixed in closed form, so the residuals are comparable. Shorter is better. The residuals are float arithmetic, so the bars and their numbers are computed; a bar carries its value in its length, so its body stays solid and the number beside it carries the dashed underline.', 'fit-bar prose');
let CSS_AS = A.CSS;
CSS_AS = once(CSS_AS, 'svg.pl .clo { fill:none; stroke:#f6f6f8; stroke-opacity:.9; stroke-width:1.5; stroke-dasharray:5 4; }',
  'svg.pl .clo { fill:none; stroke:#f6f6f8; stroke-opacity:.45; stroke-width:1.5; }', 'closing-edge rule');
CSS_AS = once(CSS_AS, '.mchips .l1 i { opacity:.62; border-top-style:dashed; } .mchips .l2 i { opacity:.42; border-top-style:dotted; }',
  '.mchips .l1 i { opacity:.62; } .mchips .l2 i { opacity:.42; }', 'model-chip rule');
const TREES = G.subjects.filter((s) => !s.order).flatMap((s) => G.models.map((M) => s.byModel[M.id]).filter((r) => r && r.mst));
const TIED = TREES.filter((r) => !mstUnique(r.D, r.mst)).length;
if (marked.plates !== TIED || marked.overlays !== TIED) throw new Error(`answer-shape: ${TIED} tied trees in the record, but ${marked.plates} plates and ${marked.overlays} overlay paths were dotted`);
/* the ordered plates (R30, 2026-10-30): the paired experiment page.js's prose is built on says "the same numerals must
   come back as a circle in one and a line in the other", and the set notes (sets.js) name the shape of each ordered set —
   the digits a line ("nine is not adjacent to zero"), every other ordered set a cycle. Every model's table fits its own
   set's shape better than the other one, today; a table that fits the other at least as well stops its plate. */
const SHAPE = (s) => (s.id === 'digits' ? ['line', 'cycle'] : ['cycle', 'line']);
const SHAPE_WORD = { line: 'a line', cycle: 'a circle' };
for (const s of G.subjects.filter((x) => x.order)) for (const M of G.models) {
  const f = s.byModel[M.id].fits, [own, other] = SHAPE(s);
  if (!(f[own].resid < f[other].resid)) throw new Error(`answer-shape: ${M.label}'s table for ${s.title} fits ${SHAPE_WORD[other]} at least as well as ${SHAPE_WORD[own]}; its plate stops`);
}
/* R23, R30 — each of the twenty-one plates names its record and the check above that would stop it. The record line comes
   from design/components.js figure() itself, so its shape and its sha are the house's own; the distance-table images
   beside them draw no standing and are left as they are. */
{
  const tail = (stop) => {
    const m = /<figcaption([^>]*)>([\s\S]*)<\/figcaption>/.exec(DC.figure({ svgRaw: '', captionRaw: '', record: REC, stop, wide: false }));
    if (!m) throw new Error('answer-shape: components.figure() no longer writes a figcaption; re-read it');
    return { attr: m[1], html: m[2] };
  };
  const figs = PLATES.flatMap((s) => G.models.map((M) => ({ M, s, stop: s.order
    ? `${M.label}'s table for ${s.title} fits ${SHAPE_WORD[SHAPE(s)[1]]} at least as well as ${SHAPE_WORD[SHAPE(s)[0]]}`
    : 'the plates and the overlays dot a different number of trees than the record holds tied' })));
  let k = 0;
  sections = sections.replace(/<figcaption>(<span class="mname">([^<]*)<\/span>(<span class="fit">[\s\S]*?))<\/figcaption>/g, (whole, inner, label, fit) => {
    if (!/\bw-val\b/.test(fit)) return whole;                   /* a distance-table image: no standing drawn */
    const f = figs[k++];
    const lead = f && (f.s.order ? 'line ' : 'rank ');
    if (!f || f.M.label !== label || !fit.replace(/<[^>]+>/g, '').startsWith(lead)) throw new Error(`answer-shape: plate ${k} (${label}) is not the one its record line was written for — page.js changed; re-read it`);
    const t = tail(f.stop);
    return `<figcaption${t.attr}>${inner}${t.html}</figcaption>`;
  });
  if (k !== figs.length) throw new Error('answer-shape: expected ' + figs.length + ' plates, found ' + k);
}
/* the record line and the stop sentence each on a line of their own under a plate's caption: design/template.js's rule,
   which this page's own sheet does not carry; page.js sets its figcaption as one flex row, so a captioned one wraps */
CSS_AS += '\nfigcaption[data-record] { flex-wrap:wrap; }\nfigcaption .fig-rec, figcaption .fig-stop { display:block; flex-basis:100%; margin-top:var(--s-2); font-size:var(--text-eyebrow); color:var(--ink-4); text-transform:none; letter-spacing:normal; }';

/* the distance tables are pixel buffers (plate.js fieldPNG: a cell's grey is its distance over the table's max, bright =
   far, on a near-black ground) and no caption names a brightness; in the light theme each is inverted, so a far pair is
   dark ink on paper like every other mark here. The filter takes the image's own border with it, so the border is
   given the complement of --border, read from the token, and comes out of the inversion as --border. The dark render
   is untouched. */
const FIELDS_LIGHT = ':root[data-theme="light"] .fields img { filter:invert(1); border-color:rgb(from var(--border) calc(255 - r) calc(255 - g) calc(255 - b)); }';

function build(OUT) {
  const foot = `<p><a href="../exact-geometry/index.html">the control this is judged against</a> · <a href="../affect/index.html">the same twelve, asked under six moods</a> · <a href="../shape-hunt/index.html">and what survives a null</a> · crossed from the bench ${PROV.liftedOn}</p>`;
  const html = page({
    foot,
    title: 'The shape of an answer · instruments',
    desc: 'Seven subjects, three models, every pair asked both ways round — and the exact decision of whether the answers are a shape at all: the exact signature and where the triangle inequality fails, with the float effective rank and negative mass beside them.',
    path: '/instruments/answer-shape/', body: INK.assertNoLiterals(INK.tokenInks(head() + sections + foot), 'answer-shape'),
    css: INK.assertNoLiterals(INK.tokenInks(`${BENCHCSS}\n${CSS_AS}\n${GR.css()}\n${FIELDS_LIGHT}`), 'answer-shape\'s sheet'),
  });
  const dir = path.join(OUT, 'answer-shape');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, subjects: G.subjects.length, models: G.models.length, spend, calls };
}
function cardArt() { const m = sections.match(/<svg[\s\S]{200,}?<\/svg>/); return m ? INK.assertNoLiterals(INK.tokenInks(m[0]), 'the answer-shape card') : ''; }
module.exports = { build, cardArt, G, spend, PROV };
