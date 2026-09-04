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
const E = require('./page.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');

const rows = E.rows;
const n = rows.length;
const agreed = E.agreed;
const refused = rows.filter((x) => !x.r.gate.ok).length;
const euclid = rows.filter((x) => x.r.gate.ok && x.r.spectrum.negMass < 0.01).length;

const head = `
<header class="hero"><div class="container">
  <div class="eyebrow">playground · exact geometry · the control, and it is meant to be boring</div>
  <h1 class="display" style="margin-top:var(--s-4)">Point the instrument at something whose shape is already known</h1>
  <p class="lede" style="margin-top:var(--s-6);">Every other geometry page here asks a model for a table of dissimilarities and decides what shape its answers have. <b>This one asks nothing.</b> Each set below is points whose shape is fixed by construction, and the same exact instrument is pointed at them. If it does not return the shape that is there, every number on every other page is worthless — so this page is built first and its result is supposed to be dull.</p>
  <div class="hero-meta">
    <span class="item"><span class="k">sets</span><span class="v">${n}</span></span>
    <span class="item"><span class="k">prediction held</span><span class="v">${agreed} of ${n}</span></span>
    <span class="item"><span class="k">exactly euclidean</span><span class="v">${euclid}</span></span>
    <span class="item"><span class="k">refused at the gate</span><span class="v">${refused}</span></span>
    <span class="item"><span class="k">model calls</span><span class="v">none</span></span>
  </div>
</div></header>

<section class="section"><div class="container">
  <div class="eyebrow">how to read a card</div>
  <h2 class="t2" style="margin-top:var(--s-3)">Predicted, decided, agreed — in that order, and written before the run.</h2>
  <div class="prose" style="margin-top:var(--s-5)">
    <p>Each card states the shape the construction guarantees, then the shape the instrument decided from the integer table alone, then whether they matched. <b>The prediction is written first</b>, in <code>sets.js</code>, and it is not edited afterwards — which is the only thing that makes "agreed" mean anything.</p>
    <p>Two of the readings are deliberately awkward and are kept that way. Quantising a projection to integers guarantees the exact signature will <em>not</em> come back clean, so the signature is printed beside the effective rank rather than instead of it. And a set that violates the metric gate is <b>refused</b> rather than scored: the arithmetic downstream assumes a metric, and running it anyway would produce a plausible number from a broken input.</p>
  </div>
</div></section>`;

const foot = `
<footer class="foot"><div class="container"><div class="line">
  <span>cert-machine / playground</span>
  <a href="../index.html">the playground</a>
  <a href="../neural-geometry/index.html">the same instrument, pointed at a model</a>
  <a href="../plates/index.html">the plates</a>
  <span>crossed from the bench ${PROV.liftedOn}</span>
</div></div></footer>`;

/* the crossed body opens with the bench's own hero; ours replaces it, so take
   the page from its first set section onward */
const sections = (() => {
  const i = E.body.indexOf('<section class="section">');
  return i < 0 ? E.body : E.body.slice(i);
})();

function build(OUT) {
  const html = page({
    title: 'Exact geometry · playground',
    desc: 'The control page: an instrument that decides what shape a table of distances has, pointed at point sets whose shape is fixed by construction — so that its answers on the pages that ask a model mean something.',
    root: '../', here: 'exact-geometry',
    body: head + sections + foot,
    script: `<style>${SHELLCSS}\n${BENCHCSS}\n${E.CSS}</style>`,
  });
  const dir = path.join(OUT, 'exact-geometry');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, sets: n, agreed, refused, euclid };
}

function cardArt() {
  const m = sections.match(/<svg[^>]*class="plate"[\s\S]*?<\/svg>/);
  return m ? m[0] : '';
}

module.exports = { build, cardArt, rows, agreed, n, PROV };
