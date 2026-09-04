/* build.js — site/playground/plates/index.html.

   plates.js is the bench's plate series, crossed byte-for-byte apart from the
   two patches declared in PROVENANCE.json: the record paths point at OUR
   records, and the page-writing tail is replaced by an export. This file is the
   shell — the part that was always going to be rebuilt here.

   ONE THING WORTH SAYING OUT LOUD, and it is the reason these plates belong on
   this site rather than only on the bench. PLATE V already draws the grammar:
   solid for a bound that holds over every sky the data allow, dashed for one
   sky that was exhibited and checked. That distinction was made by hand, on
   that plate, before anything called warrant.js existed — which is the best
   evidence available that the grammar is describing something real rather than
   inventing a convention. So the page names it, and the legend is emitted from
   warrant.js rather than drawn again.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));
const P = require('./plates.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');
const fmt = (x) => Number(x).toLocaleString('en-US');

/* the legend comes out of warrant.js, so the page cannot describe a grammar it
   is not using. REFUSED has no stroke and no plate here uses it, so it is left
   out rather than drawn as a shape it does not have. */
const legend = `<div class="legend">${W.LEGEND.filter((L) => L.s !== W.REFUSED).map((L) =>
  `<div class="item"><svg viewBox="0 0 46 14" aria-hidden="true"><line x1="1" y1="7" x2="45" y2="7" ${W.attrs(L.s, { width: 2.4 })}/></svg>`
  + `<div><div class="k">${L.label}</div><div class="g">${L.gloss}</div></div></div>`).join('')}</div>`;

const grammar = `
<section class="section">
  <div class="container">
    <div class="eyebrow">the grammar, found rather than imposed</div>
    <h2 class="t2" style="margin-top:var(--s-3)">Plate V was already drawn this way.</h2>
    <div class="prose" style="margin-top:var(--s-5)">
      <p>Its own caption reads <em>solid: a bound on every sky. dashed: a sky that exists.</em> One line is a statement about every brightness distribution consistent with ${fmt(P.counts.visibilities)} measurements; the other is a single distribution that was exhibited and checked. Those are different kinds of claim, and the plate distinguished them with a stroke because there was no other honest way to put both on one axis.</p>
      <p>That was drawn by hand, on that plate, before anything in this repository was called a grammar. It is the best evidence available that the distinction is real rather than a convention somebody invented: it got reached for under pressure, by someone trying to avoid lying on an axis.</p>
    </div>
    ${legend}
    <div class="prose" style="margin-top:var(--s-5)">
      <p><b>Standing is not confidence.</b> The dashed curve on Plate V is not less certain than the solid one — the witness is exhibited and checked, so it is as certain as anything on the page. It is a different <em>kind</em> of thing: one member, rather than a bound over all of them. The band between them is not error and not uncertainty in the statistical sense; it is the set of answers that survive.</p>
    </div>
  </div>
</section>`;

/* the grammar section goes in after Plate V, where the reader has just seen it */
const body = (() => {
  const marker = '\n${plate({\n  idx: \'PLATE VI\',';
  const b = P.body;
  const i = b.indexOf('PLATE VI');
  if (i < 0) return b + grammar;
  const cut = b.lastIndexOf('<section class="section plate', i);
  return cut < 0 ? b + grammar : b.slice(0, cut) + grammar + '\n' + b.slice(cut);
})();

const foot = `
<footer class="foot"><div class="container"><div class="line">
  <span>cert-machine / instruments</span>
  <a href="../index.html">all nine instruments</a>
  <a href="../interferometer/index.html">the instrument behind plates II, V and VI</a>
  <a href="../curveset/index.html">the same question, on a calibration</a>
  <span>crossed from the bench ${PROV.liftedOn}</span>
</div></div></footer>`;

function build(OUT) {
  const html = page({
    title: 'Manifolds we are handed · instruments',
    desc: 'Eight plates. Interpretability pulls geometry out of a working model and asks what it means; these are stated as a rule and its parameters, then drawn — including two that are certificates rendered at their own resolution.',
    root: '../', here: 'plates',
    body: body + foot,
    script: `<style>${SHELLCSS}\n${CSS}\n${P.CSS}</style>`,
  });
  const dir = path.join(OUT, 'plates');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, ...P.counts };
}

/* the card art is Plate I, the hinge plate: the one object that is read both
   ways, found inside a model and stated from a definition */
function cardArt() {
  const m = P.body.match(/<svg viewBox="0 0 980 560"[\s\S]*?<\/svg>/);
  return m ? m[0] : '';
}

module.exports = { build, cardArt, counts: P.counts, PROV };
