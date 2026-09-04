/* build.js — site/playground/affect/index.html.

   Crossed from the bench (see PROVENANCE.json), page rebuilt here.

   Twelve feelings, placed by pairwise questions alone. Then the circumplex axes
   — pleasantness and activation — recovered from a SECOND question set with no
   words in common with the first, and landing on the pairwise plane's own
   leading principal axis for all three models independently. Then the same
   twelve asked again under six moods, with twelve clock hours carried through
   the identical pipeline as a control that has no business moving.

   The control is the page. A mood effect that also moves the clock is not a
   mood effect, and one model's clock moves by 69 to 85 per cent.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const A = require('./page.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
const M = A.M;
const spend = (M.spend || []).reduce((a, x) => a + x.usd, 0);
const moods = (M.moods || []).map((m) => m.id || m);

const head = `
<header class="hero"><div class="container">
  <div class="eyebrow">instruments · affect · ${moods.length} moods × ${M.models.length} models · $${spend.toFixed(2)}, already spent</div>
  <h1 class="display" style="margin-top:var(--s-4)">The geometry of feeling</h1>
  <p class="lede" style="margin-top:var(--s-6);">Twelve feelings, placed by asking only how different each pair is. Then the two axes psychology has used for fifty years — <b>pleasantness and activation</b> — asked separately, in a question set with no words in common with the first, and checked against the plane the pairwise table already fixed. Then the whole thing again under six moods, with twelve clock hours carried through the identical pipeline as a control that has no business moving.</p>
  <div class="hero-meta">
    <span class="item"><span class="k">moods</span><span class="v">${moods.join(' · ')}</span></span>
    <span class="item"><span class="k">models</span><span class="v">${M.models.map((m) => m.label).join(' · ')}</span></span>
    <span class="item"><span class="k">the control</span><span class="v">twelve hours of a clock</span></span>
  </div>
</div></header>`;

const foot = `
<footer class="foot"><div class="container"><div class="line">
  <span>cert-machine / instruments</span>
  <a href="../index.html">all nine instruments</a>
  <a href="../answer-shape/index.html">the same instrument, seven other subjects</a>
  <a href="../exact-geometry/index.html">the control it is judged against</a>
  <span>crossed from the bench ${PROV.liftedOn}</span>
</div></div></footer>`;

const sections = (() => { const i = A.body.indexOf('<section class="section'); return i < 0 ? A.body : A.body.slice(i); })();

function build(OUT) {
  const html = page({
    title: 'The geometry of feeling · instruments',
    desc: 'Twelve feelings placed by pairwise questions, the circumplex axes recovered from a question set with no words in common, and the same twelve asked again under six moods — with twelve clock hours as the control that has no business moving.',
    root: '../', here: 'affect', body: head + sections + foot,
    script: `<style>${BENCHCSS}\n${A.CSS}</style>`,
  });
  const dir = path.join(OUT, 'affect');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, moods: moods.length, models: M.models.length, spend };
}
function cardArt() { const m = sections.match(/<svg[\s\S]{200,}?<\/svg>/); return m ? m[0] : ''; }
module.exports = { build, cardArt, M, spend, PROV };
