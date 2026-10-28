/* build.js — site/playground/exact-geometry/index.html.

   The control page. Every other geometry page here asks a model for a table of
   dissimilarities and decides what shape the answers have; this one asks
   NOTHING. Each set is points whose shape is known by construction — an array of
   telescopes projected onto a plane at one instant, a chord of a curve, nine
   points thrown into seven dimensions — and the same instrument is pointed at
   them. If it does not return the shape that is there, every number on every
   other page is worthless.

   That makes it the one page whose result is supposed to be boring, and the one
   page that has to be built first.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));                    /* the grammar's words (WARRANT v2, 2026-10-28) */
const GR = require(path.join(PG, '..', 'design', 'grammar.js'));    /* the ink-* classes */
const { mstUnique } = require(path.join(PG, 'mst.js'));   /* one uniqueness test for every tree drawn */
const E = require('./page.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');

const rows = E.rows;
const n = rows.length;
const agreed = E.agreed;
const refused = rows.filter((x) => !x.r.gate.ok).length;
const euclid = rows.filter((x) => x.r.gate.ok && x.r.spectrum.negMass < 0.01).length;

/* WARRANT v2 (2026-10-28) — the control page, read for what its own marks stand on. page.js, plate.js, sets.js and
   decide.js are crossed (PROVENANCE.json) and stay byte-identical; everything below is the shell.

   FOUR FINDINGS, each fixed here and gated so it cannot come back.
   1. "EXACTLY EUCLIDEAN: 6". The hero counted negative mass under 1% — a float spectrum under a chosen tolerance —
      and called it exact. Exactly (the signature has no negative direction) it is 1 of 8: the random set. Both counts
      are printed now, each in its own standing.
   2. "AGREED: YES", EIGHT TIMES. The prediction is prose written first; the AGREEMENT is graded by page.js verdict(),
      a rule with tolerances in it (negative mass under 1% read as none, over 5% as present, a closing ratio within
      0.05 of one, and an effective rank counted at 99% of the spectrum in decide.js). A verdict that holds under a
      chosen threshold says so, in the conditional, on every card it applies to. Two predictions say "exactly" — array-a
      "exactly a plane", hex-chord "exactly Euclidean" — and read literally they do not hold: the exact signatures of
      those integer tables carry negative directions. That is quantisation, which the page already explains; the
      literal count is printed beside the graded one.
   3. "DECIDED: effective rank 2, negative mass 0.00%, …". The card's second line was labelled decided and led with two
      floats. It is "returned" now, and the two floats carry their standing: effective rank CHOSEN (a count under the
      99% cutoff), negative mass COMPUTED. The exact signature and the closing ratio are the decided parts.
   4. TWO SENTENCES OF THE CROSSED PROSE. "It reproduces both, to the digit": the rim, yes, to the digit; the
      hexagon, not — 0.45% negative mass against 0.00%, signature (4,1,1) against (3,2,1), because 50√3 rounds to 87
      on the model's scale. And "one carries no negative mass at all … which is the exact statement that no
      arrangement … has those distances": the chord table carries 0.003%, and the exact statement of non-embeddability
      is the SIGNATURE's, which says it of both integer tables. The negative mass says how much; it is a float.
   The closing edge was dashed (5 4) to mark its role; dash carries standing only, so it rides opacity now. The three
   trees drawn here are unique — gated, because the page's "the same tree both times" rests on it. Nothing here is red:
   the one refused table fails its triangle inequality by construction, and nobody claimed it was a distance. */
const VERDICT_SRC = fs.readFileSync(path.join(HERE, 'page.js'), 'utf8'), DECIDE_SRC = fs.readFileSync(path.join(HERE, 'decide.js'), 'utf8');
for (const [src, lit, what] of [[VERDICT_SRC, 'neg < 0.01', 'the 1% negative-mass tolerance'], [VERDICT_SRC, 'neg > 0.05', 'the 5% presence threshold'],
  [VERDICT_SRC, 'Math.abs(r.closure.ratio - 1) < 0.05', 'the closing-ratio tolerance'], [DECIDE_SRC, 'acc / tot >= 0.99', 'the 99% effective-rank cutoff']]) {
  if (!src.includes(lit)) throw new Error('exact-geometry: ' + what + ' (' + lit + ') is no longer in the verdict rule; rewrite the sentence that names it');
}
const exactEuclid = rows.filter((x) => x.r.gate.ok && x.r.signature.q === 0).length;
const literalNo = rows.filter(({ r }) => r.gate.ok && /exactly/i.test(r.predict) && r.signature.q > 0);
if (literalNo.some(({ v }) => !v.held)) throw new Error('exact-geometry: a literal-reading failure is also a graded failure; rewrite the head paragraph');
const dirs = (q) => q + ' negative direction' + (q === 1 ? '' : 's');
const RANK_T = 'chosen — a count of the eigenvalues that reach 99% of a float spectrum: a cutoff, on floats';
const tolGiven = '<em>given the rule&rsquo;s tolerances</em>';
for (const id of ['array-a', 'array-b', 'random']) {
  const r = rows.find((x) => x.r.id === id).r;
  if (r.mst && !mstUnique(r.D, r.mst)) throw new Error('exact-geometry: the ' + id + ' spanning tree ties; "the cheapest tree" is one of several — rewrite');
}
const CMPROW = (id) => E.CMP && E.CMP.rows.find((x) => x.id === id);
const pct2 = (x) => (100 * x).toFixed(2) + '%';

const head = `
<header class="hero"><div class="container">
  <div class="eyebrow">instruments · exact geometry · the control, and it is meant to be boring</div>
  <h1 class="display mt4">Point the instrument at something whose shape is already known</h1>
  <p class="lede mt6">Every other geometry page here asks a model for a table of dissimilarities and decides what shape its answers have. <b>This one asks nothing.</b> Each set below is points whose shape is fixed by construction, and the same exact instrument is pointed at them. If it does not return the shape that is there, every number on every other page is worthless — so this page is built first and its result is supposed to be dull.</p>
  <div class="hero-meta">
    <span class="item"><span class="k">sets</span><span class="v">${n}</span></span>
    <span class="item"><span class="k">prediction held</span><span class="v">${W.value(agreed + ' of ' + n, W.CHOSEN, { title: 'chosen — graded by a rule with tolerances; read literally, ' + (agreed - literalNo.length) + ' of ' + n })}</span></span>
    <span class="item"><span class="k">exactly euclidean</span><span class="v">${exactEuclid}</span></span>
    <span class="item"><span class="k">within 1% negative mass</span><span class="v">${W.value(String(euclid), W.CHOSEN, { title: 'chosen — negative mass under 1%, a tolerance, on a float spectrum' })}</span></span>
    <span class="item"><span class="k">refused at the gate</span><span class="v">${refused}</span></span>
    <span class="item"><span class="k">model calls</span><span class="v">none</span></span>
  </div>
</div></header>

<section class="section"><div class="container">
  <div class="eyebrow">how to read a card</div>
  <h2 class="t2 mt3">Predicted, decided, agreed — in that order, and written before the run.</h2>
  <div class="prose mt5">
    <p>Each card states the shape the construction guarantees, then the shape the instrument decided from the integer table alone, then whether they matched. <b>The prediction is written first</b>, in <code>sets.js</code>, and it is not edited afterwards — which is the only thing that makes "agreed" mean anything.</p>
    <p>Two of the readings are deliberately awkward and are kept that way. Quantising a projection to integers guarantees the exact signature will <em>not</em> come back clean, so the signature is printed beside the effective rank rather than instead of it. And a set that violates the metric gate is <b>refused</b> rather than scored: the arithmetic downstream assumes a metric, and running it anyway would produce a plausible number from a broken input.</p>
    <p><b>And &ldquo;agreed&rdquo; is a verdict with tolerances in it.</b> The prediction is prose; the rule that grades it reads a float spectrum against chosen thresholds — negative mass under 1% counts as none, an effective rank is counted at 99% of the spectrum&rsquo;s mass, a closing ratio within 0.05 of one is one. So every <em>yes</em> below holds ${tolGiven}, and each card says so. ${literalNo.length ? `${literalNo.length === 2 ? 'Two predictions' : literalNo.length + ' predictions'} use the word <em>exactly</em> (${literalNo.map(({ r }) => r.id).join(', ')}), and read literally they do not hold: the exact signatures of those integer tables carry ${literalNo.map(({ r }) => dirs(r.signature.q)).join(' and ')}. That is the quantisation of the paragraph above, not a fault in the geometry — the points those tables round are exactly planar and exactly on a circle — but read literally the count is ${agreed - literalNo.length} of ${n}, and the hero prints both. Only ${exactEuclid} of the ${n} tables is exactly Euclidean, by its signature; ${euclid} are within 1% by their float spectrum.` : ''} The exact signature and the closing ratio are decided; the effective rank and the negative mass beside them are not, and wear their standing.</p>
  </div>
  ${W.legendHtml({ exclude: [W.REFUSED], compact: true })}
</div></section>`;

const foot = `
`;

/* the crossed body opens with the bench's own hero; ours replaces it, so take
   the page from its first set section onward */
const sectionsRaw = (() => {
  const i = E.body.indexOf('<section class="section">');
  return i < 0 ? E.body : E.body.slice(i);
})();

/* the cards and the crossed prose, by gated replacement (see the WARRANT v2 note above) */
const once = (str, from, to, what) => {
  const k = str.split(from).length - 1;
  if (k !== 1) throw new Error('exact-geometry: expected one ' + what + ' in the crossed page, found ' + k + ' — page.js changed; re-read it');
  return str.split(from).join(to);
};
const wrapAll = (str, re, expect, what, f) => {
  let k = 0;
  const out = str.replace(re, (...m) => { k++; return f(...m); });
  if (k !== expect) throw new Error('exact-geometry: expected ' + expect + ' ' + what + ', found ' + k + ' — page.js changed; re-read it');
  return out;
};
const RANK = (x) => W.value(x, W.CHOSEN, { title: RANK_T });
const NEG = (x) => W.value(x, W.COMPUTED);
const OK = rows.filter((x) => x.r.gate.ok).length;
let sections = sectionsRaw;
/* each card: its "agreed" and "decided" lines, found after its own title so no card can take another's words */
{
  let at = 0;
  for (const { r, v } of rows) {
    const t = sections.indexOf(`>${r.title}</h2>`, at);
    if (t < 0) throw new Error('exact-geometry: the card for ' + r.id + ' is missing');
    const end = sections.indexOf('</section>', t);
    let card = sections.slice(t, end);
    if (r.gate.ok) {
      const lit = literalNo.find((x) => x.r.id === r.id);
      card = once(card, '<b>agreed</b>     yes', `<b>agreed</b>     yes, ${tolGiven}${lit ? ` &mdash; read literally, no: the exact signature has ${dirs(r.signature.q)}` : ''}`, r.id + ' agreed line');
      card = once(card, '<b>decided</b>    effective rank ' + r.spectrum.effRank + ', negative mass ' + (100 * r.spectrum.negMass).toFixed(2) + '%',
        '<b>returned</b>   effective rank ' + RANK(String(r.spectrum.effRank)) + ', negative mass ' + NEG((100 * r.spectrum.negMass).toFixed(2) + '%'), r.id + ' decided line');
    }
    sections = sections.slice(0, t) + card + sections.slice(end);
    at = t + card.length;
  }
}
sections = wrapAll(sections, /(<div class="k">effective rank<\/div><div class="v">)([^<]*)(<\/div>)/g, OK, 'effective-rank cards', (m, a, x, b) => a + RANK(x) + b);
sections = wrapAll(sections, /(<div class="k">negative mass<\/div><div class="v">)([^<]*)(<\/div>)/g, OK, 'negative-mass cards', (m, a, x, b) => a + NEG(x) + b);
if (E.CMP) {
  sections = wrapAll(sections, /(<td class="mono dim">(?:model|exact)<\/td><td class="mono">)([^<]*)(<\/td><td class="mono">)([^<]*)(<\/td>)/g, 2 * E.CMP.rows.length, 'comparison rows',
    (m, a, rk, b, ng, c) => a + RANK(rk) + b + NEG(ng) + c);
  const ch = CMPROW('hex-chord'), cy = CMPROW('hex-cycle');
  const sig = (g) => `(${g.p},${g.q},${g.z})`;
  const exactRim = rows.find((x) => x.r.id === 'hex-cycle').r.D;   /* "the model's integers are the exact ones, scaled": every cell in proportion */
  const scaled = cy && cy.M.every((row, i) => row.every((m, j) => m * exactRim[0][1] === exactRim[i][j] * cy.M[0][1]));
  const rimSame = scaled && cy.model.spectrum.negMass.toFixed(6) === cy.truth.spectrum.negMass.toFixed(6) && sig(cy.model.signature) === sig(cy.truth.signature);
  const hexDiffers = ch && pct2(ch.model.spectrum.negMass) !== pct2(ch.truth.spectrum.negMass) && sig(ch.model.signature) !== sig(ch.truth.signature)
    && ch.model.spectrum.effRank === ch.truth.spectrum.effRank && ch.model.closure.ratio === ch.truth.closure.ratio;
  if (!(rimSame && hexDiffers)) throw new Error('exact-geometry: the comparison record moved; rewrite the "reproduces" paragraph');
  sections = once(sections, '<strong>It reproduces both, to the digit.</strong> The straight-line hexagon comes back effective rank 2 with essentially nothing negative; the rim metric comes back with',
    `<strong>It reproduces the rim to the digit, and the hexagon in shape.</strong> The straight-line hexagon comes back effective rank ${RANK(String(ch.model.spectrum.effRank))}, closing in one step, as the exact table does &mdash; but with ${NEG(pct2(ch.model.spectrum.negMass))} negative mass against ${NEG(pct2(ch.truth.spectrum.negMass))} and the exact signature ${sig(ch.model.signature)} against ${sig(ch.truth.signature)}, because its chords are rounded on its own scale (${ch.M[0][2]} for ${ch.M[0][1]}&radic;3). The rim metric comes back with`, 'reproduces sentence');
  sections = once(sections, 'negative mass, which is the exact figure the arithmetic gives and the exact statement that no arrangement of points in any Euclidean space has those distances.',
    `negative mass, the figure the arithmetic gives on the exact table: the model&rsquo;s integers are the exact ones, scaled. That figure is a float; the exact statement that no arrangement of points in any Euclidean space has those distances is the signature&rsquo;s, ${sig(cy.model.signature)}.`, 'rim sentence');
}
{
  const hc = rows.find((x) => x.r.id === 'hex-chord').r, hy = rows.find((x) => x.r.id === 'hex-cycle').r;
  if (!(hc.signature.q > 0 && hy.signature.q > 0 && hc.spectrum.negMass > 0)) throw new Error('exact-geometry: the hexagon pair moved; rewrite the pair paragraph');
  sections = once(sections, `one carries no negative mass at all and the other carries ${(100 * hy.spectrum.negMass).toFixed(1)}% of it, which is the exact statement that no arrangement of points in any Euclidean space has those distances.`,
    `one carries ${NEG((100 * hc.spectrum.negMass).toFixed(3) + '%')} of its mass in negative directions &mdash; rounding, nothing more &mdash; and the other ${NEG((100 * hy.spectrum.negMass).toFixed(1) + '%')}. Exactly, both integer tables are non-Euclidean: the signature says so of each, which is why it cannot tell them apart. The negative mass says how much, and that is a float, not a decision.`, 'pair sentence');
}
let CSS_XG = once(E.CSS, 'svg.plate .clo { fill:none; stroke:#f6f6f8; stroke-opacity:.9; stroke-width:1.6; stroke-dasharray:5 4; }',
  'svg.plate .clo { fill:none; stroke:#f6f6f8; stroke-opacity:.45; stroke-width:1.6; }', 'closing-edge rule');

function build(OUT) {
  const foot = `<p><a href="../neural-geometry/index.html">the same instrument, pointed at a model</a> · <a href="../plates/index.html">the plates</a> · crossed from the bench ${PROV.liftedOn}</p>`;
  const html = page({
    foot,
    title: 'Exact geometry · instruments',
    desc: 'The control page: an instrument that decides what shape a table of distances has, pointed at point sets whose shape is fixed by construction — so that its answers on the pages that ask a model mean something.',
    path: '/instruments/exact-geometry/',
    body: head + sections + foot,
    css: `${BENCHCSS}\n${CSS_XG}\n${GR.css()}`,
  });
  const dir = path.join(OUT, 'exact-geometry');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, sets: n, agreed, refused, euclid, exactEuclid, literal: agreed - literalNo.length };
}

function cardArt() {
  const m = sections.match(/<svg[^>]*class="plate"[\s\S]*?<\/svg>/);
  return m ? m[0] : '';
}

module.exports = { build, cardArt, rows, agreed, n, PROV };
