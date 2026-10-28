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
  ${W.legendHtml({ exclude: [W.REFUSED], compact: true })}
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
const wrapAll = (s, re, expect, what, f) => {
  let n = 0;
  const out = s.replace(re, (...m) => { n++; return f(...m); });
  if (n !== expect) throw new Error('answer-shape: expected ' + expect + ' ' + what + ', found ' + n + ' — page.js changed; re-read it');
  return out;
};
const C = (x) => W.value(x, W.COMPUTED);
const RANK = (x) => W.value(x, W.CHOSEN, { title: 'chosen — a count of the eigenvalues that reach 99% of a float spectrum: a cutoff, on floats' });
if (!fs.readFileSync(path.join(PG, 'exact-geometry', 'decide.js'), 'utf8').includes('acc / tot >= 0.99')) throw new Error('answer-shape: the effective rank is no longer cut at 99% (exact-geometry/decide.js spectrumOf); rewrite the sentences that say so');
const ORD = G.subjects.filter((s) => s.order).length, NM = G.models.length;
const scaleTop = 2 * G.scale;                                       /* the two directions are ADDED: 0–198 */
const chromS = G.subjects.find((s) => s.id === 'chromatic');
const missOf = (M) => Math.abs(chromS.byModel[M.id].gate.worstSlack || 0);
const worstAbs = G.models.reduce((a, M) => (missOf(M) > missOf(a) ? M : a));
const worstRel = G.models.reduce((a, M) => (chromS.byModel[M.id].gate.relSlack > chromS.byModel[a.id].gate.relSlack ? M : a));
const pct0 = (x) => `${(100 * x).toFixed(0)}%`;
let sections = sectionsRaw;
sections = once(sections, `The worst triple in ${chromS.title} misses by ${pct0(chromS.byModel[worstRel.id].gate.relSlack)} of the whole scale.`,
  `The worst triple in ${chromS.title} misses by ${pct0(missOf(worstAbs) / scaleTop)} of the whole 0–${scaleTop} scale (${worstAbs.label}, ${missOf(worstAbs)} units), and by ${pct0(chromS.byModel[worstRel.id].gate.relSlack)} of the largest distance ${worstRel.label} named.`, 'chromatic worst-triple sentence');
sections = wrapAll(sections, /<span class="fit">(?:(line \d+% · cycle \d+%)|(rank \d+) · (neg \d+%))<\/span>/g, 3 * (2 + 5), 'plate residual captions',
  (m, fits, rank, neg) => `<span class="fit">${fits ? C(fits) : RANK(rank) + ' · ' + C(neg)}</span>`);
sections = wrapAll(sections, /<span class="bv">(\d+%)<\/span>/g, 2 * NM * ORD, 'fit-bar values', (m, v) => `<span class="bv">${C(v)}</span>`);
sections = wrapAll(sections, /(<div class="h">(effective rank|negative mass|distances, r|shape gap)<\/div>)((?:<div>[^<]*<\/div>){3})/g, 4 * 5, 'float table rows',
  (m, h, k, cells) => h + cells.replace(/<div>([^<]*)<\/div>/g, (x, v) => `<div>${v === '—' ? v : (k === 'effective rank' ? RANK(v) : C(v))}</div>`));
sections = wrapAll(sections, /(as a circle to |as a line to |fit a circle at )(\d+%)/g, 3, 'note residuals', (m, k, v) => k + C(v));
sections = wrapAll(sections, /reconstructed a (\d+%)-residual circle/g, 1, 'closing residual', (m, v) => `reconstructed a ${C(v)}-residual circle`);
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

function build(OUT) {
  const foot = `<p><a href="../exact-geometry/index.html">the control this is judged against</a> · <a href="../affect/index.html">the same twelve, asked under six moods</a> · <a href="../shape-hunt/index.html">and what survives a null</a> · crossed from the bench ${PROV.liftedOn}</p>`;
  const html = page({
    foot,
    title: 'The shape of an answer · instruments',
    desc: 'Seven subjects, three models, every pair asked both ways round — and the exact decision of whether the answers are a shape at all: the exact signature and where the triangle inequality fails, with the float effective rank and negative mass beside them.',
    path: '/instruments/answer-shape/', body: head() + sections + foot,
    css: `${BENCHCSS}\n${CSS_AS}\n${GR.css()}`,
  });
  const dir = path.join(OUT, 'answer-shape');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, subjects: G.subjects.length, models: G.models.length, spend, calls };
}
function cardArt() { const m = sections.match(/<svg[\s\S]{200,}?<\/svg>/); return m ? m[0] : ''; }
module.exports = { build, cardArt, G, spend, PROV };
