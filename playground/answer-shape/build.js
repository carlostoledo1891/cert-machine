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
const A = require('./page.js');
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const BENCHCSS = fs.readFileSync(path.join(PG, 'design', 'bench.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');
const G = A.G;
const spend = (G.spend || []).reduce((a, x) => a + x.usd, 0);
const calls = (G.subjects || []).reduce((a, s) => a + (s.items ? s.items.length * (s.items.length - 1) : 0), 0);

const head = `
<header class="hero"><div class="container">
  <div class="eyebrow">playground · answer shape · ${G.subjects.length} subjects × ${G.models.length} models · $${spend.toFixed(2)}, already spent</div>
  <h1 class="display" style="margin-top:var(--s-4);max-width:20ch;">The shape of an answer</h1>
  <p class="lede" style="margin-top:var(--s-6);">Ask a model how different two things are, one pair at a time, and you get a table of numbers. A table of distances is a shape — or it is not one, and the difference is decidable. <b>Every pair is asked both ways round</b>, so the asymmetry is measured rather than averaged away, and the two halves of each pair come from calls that never see each other.</p>
  <div class="hero-meta">
    <span class="item"><span class="k">subjects</span><span class="v">${G.subjects.map((s) => s.id).join(' · ')}</span></span>
    <span class="item"><span class="k">models</span><span class="v">${G.models.map((m) => m.label).join(' · ')}</span></span>
    <span class="item"><span class="k">decided in</span><span class="v">exact integer arithmetic</span></span>
  </div>
</div></header>`;

const foot = `
<footer class="foot"><div class="container"><div class="line">
  <span>cert-machine / playground</span>
  <a href="../index.html">the playground</a>
  <a href="../exact-geometry/index.html">the control this is judged against</a>
  <a href="../affect/index.html">the same twelve, asked under six moods</a>
  <a href="../shape-hunt/index.html">and what survives a null</a>
  <span>crossed from the bench ${PROV.liftedOn}</span>
</div></div></footer>`;

const sections = (() => { const i = A.body.indexOf('<section class="section'); return i < 0 ? A.body : A.body.slice(i); })();

function build(OUT) {
  const html = page({
    title: 'The shape of an answer · playground',
    desc: 'Seven subjects, three models, every pair asked both ways round — and the exact decision of whether the answers are a shape at all: effective rank, negative mass, the exact signature, and where the triangle inequality fails.',
    root: '../', here: 'answer-shape', body: head + sections + foot,
    script: `<style>${SHELLCSS}\n${BENCHCSS}\n${A.CSS}</style>`,
  });
  const dir = path.join(OUT, 'answer-shape');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, subjects: G.subjects.length, models: G.models.length, spend, calls };
}
function cardArt() { const m = sections.match(/<svg[\s\S]{200,}?<\/svg>/); return m ? m[0] : ''; }
module.exports = { build, cardArt, G, spend, PROV };
