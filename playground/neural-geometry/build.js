/* build.js — site/playground/neural-geometry/index.html, from out/geometry.json.
   Static plates. Nothing here moves, because the finding is not a slider.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const { plate } = require('./plate.js');

const G = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'geometry.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');
const n = (x, d) => Number(x).toFixed(d === undefined ? 2 : d);
const short = (id) => id.replace('claude-', '').replace('-4-5', ' 4.5').replace('-5', ' 5');

const byId = (s, id) => s.models.find((m) => m.id === id);
const sets = G.sets;
const model = (id) => G.models.find((m) => m.id === id);
const IDS = G.models.map((m) => m.id);

/* the three facts the page is built on, computed here rather than asserted */
const structured = sets.filter((s) => s.id !== 'unrelated');
const control = sets.find((s) => s.id === 'unrelated');
const qStructured = structured.flatMap((s) => s.models.map((m) => m.signature.q));
const qControl = control.models.map((m) => m.signature.q);
const capStructured = structured.flatMap((s) => s.models.map((m) => m.captured));
const capControl = control.models.map((m) => m.captured);
const asymBy = IDS.map((id) => ({ id, worst: Math.max(...sets.map((s) => byId(s, id).asym.max)) }));
const cyclicBy = IDS.map((id) => ({ id, hits: sets.filter((s) => byId(s, id).cyclic).length }));
const hues = sets.find((s) => s.id === 'hues');
const digits = sets.find((s) => s.id === 'digits');
const weekdays = sets.find((s) => s.id === 'weekdays');
const closeOf = (s) => s.models.map((m) => m.closure.ratio);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

const plateBlock = (s, m) => `
  <div class="pl">
    <div class="who"><span class="m">${short(m.id)}</span><span class="c">${m.n} items · ${(m.n * (m.n - 1)) / 2} pairs</span></div>
    ${plate(m, s.items)}
    <div class="nums">
      <span><span class="k">closure</span><span class="v ${m.closure.ratio < 1.6 ? 'hit' : ''}">${n(m.closure.ratio)}×</span></span>
      <span><span class="k">curved dirs</span><span class="v ${m.signature.q > 0 ? 'hit' : ''}">${m.signature.q}</span></span>
      <span><span class="k">2D holds</span><span class="v ${m.captured > 0.8 ? 'hit' : ''}">${(100 * m.captured).toFixed(0)}%</span></span>
      <span><span class="k">order</span><span class="v ${m.cyclic ? 'hit' : ''}">${m.cyclic ? 'kept' : 'broken'}</span></span>
    </div>
  </div>`;

const setBlock = (s) => `
<section class="set"><div class="wrap">
  <div class="head">
    <div>
      <div class="eyebrow">${s.id} · predicted: ${s.predict}</div>
      <h2>${s.title}</h2>
      <div class="verdict"><span class="tag">closure ratio</span> ${closeOf(s).map((c) => n(c)).join(' · ')}<br>
      <span class="tag">curved directions</span> ${s.models.map((m) => m.signature.q).join(' · ')} of ${s.models[0].n - 1}</div>
    </div>
    <p class="why">${s.why}</p>
  </div>
  <div class="plates">${s.models.map((m) => plateBlock(s, m)).join('')}</div>
</div></section>`;

const rows = sets.map((s) => s.models.map((m) => `<tr><td>${s.id}</td><td>${short(m.id)}</td>`
  + `<td>${n(m.closure.ratio)}</td><td>${n(m.closure.closing, 1)}</td><td>${n(m.closure.median, 1)}</td>`
  + `<td>${m.signature.p}+ ${m.signature.q}− ${m.signature.z}z</td><td>${(100 * m.captured).toFixed(0)}%</td>`
  + `<td>${m.asym.max}</td><td>${m.cyclic ? 'kept' : 'broken'}</td></tr>`).join('')).join('');

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">playground · neural geometry · ${G.meta.calls} calls, $${G.meta.spent.toFixed(2)}</div>
  <h1>The shapes a model will admit to from the outside.</h1>
  <p class="lede">Goodfire finds geometry by opening the model: decompose the activations and days of the week come out as a circle, colours as a surface. That needs the weights. <b>This asks from outside instead.</b> Every pair of items, one integer, one row at a time — and then the question is what those answers <em>can</em> be. A shape that only exists inside the activations was never a shape the model uses; if the circle is real, it should survive being asked about.</p>
</div></header>

<section class="finding"><div class="wrap"><div class="grid">
  <div>
    <h3><span class="big">${qControl.every((q) => q === 0) ? 'q = 0' : 'q = ' + qControl.join('/')}</span>Structure is curvature.</h3>
    <p>Every structured set produces answers that are <b>not Euclidean</b> — the Gram matrix carries ${Math.min(...qStructured)}–${Math.max(...qStructured)} negative directions, in all three models. The unrelated nouns produce <b>zero</b>, in all three. A model squeezing a cycle into pairwise distances cannot do it flatly, and the failure to be flat is the fingerprint of the structure.</p>
  </div>
  <div>
    <h3><span class="big">${n(mean(closeOf(hues)))}× vs ${n(mean(closeOf(digits)))}×</span>The wheel closes. The line does not.</h3>
    <p>Walk the items in order and compare the step home to the steps along the way. For the hues that ratio averages ${n(mean(closeOf(hues)))} — red really is next to rose. For the digits it averages ${n(mean(closeOf(digits)))}: nine is not adjacent to zero, and the control that must not be a circle is not one.</p>
  </div>
  <div>
    <h3><span class="big">${n(mean(closeOf(weekdays)))}×</span>But the week does not close.</h3>
    <p>The prediction was a circle and the answers say otherwise: Monday and Sunday sit <b>${n(mean(closeOf(weekdays)))} neighbour-steps apart</b>, further than any adjacent pair. The year closes and the hue wheel closes; the week is bent but open. Whatever these models hold, the weekend is a real edge in it.</p>
  </div>
</div></div></section>

${sets.map(setBlock).join('')}

<section class="method"><div class="wrap narrow">
  <div class="eyebrow">the method</div>
  <h2 style="margin-top:var(--s-4)">How the answers were taken, and what was decided</h2>

  <p><b>One row at a time, on purpose.</b> Asking for the whole matrix in one call is cheaper and worse: the model can enforce its own symmetry by reading what it just wrote. Asked row by row, the two halves of every pair come from calls that never see each other — so their agreement is a consistency test nobody requested and none of them can be given for free. It is the sharpest separator on the page: worst disagreement ${asymBy.map((a) => short(a.id) + ' ' + a.worst).join(', ')} on a 0–100 scale, and the model least consistent with itself is also the only one that never keeps a cyclic order (${cyclicBy.map((c) => short(c.id) + ' ' + c.hits + '/' + sets.length).join(', ')}).</p>

  <h3>Every answer is a whole number</h3>
  <p>The scale is 0–100 integers, so the matrix is exact rational data and nothing downstream is a threshold on a float. The symmetrised distances are integers over two; the Gram matrix is exact; and its signature is computed by exact symmetric congruence, where Sylvester's law makes the count basis-independent and rationals make each sign a decision instead of a comparison.</p>

  <h3>Why the negative directions are the finding</h3>
  <p>By Schoenberg, a distance matrix is Euclidean exactly when its doubly-centred Gram matrix is positive semidefinite, and then the rank is the smallest flat space the points fit in. Geodesic distances on a circle are famously <em>not</em> Euclidean — you would need the chords — so a model that answers about a cycle in cycle-distances must produce negative directions, and one that answers about nothing in particular has no reason to. That is exactly the split measured here, and it is the same claim Goodfire makes from inside, arrived at without the weights.</p>

  <h3>What is decided and what is drawn</h3>
  <p>Decided, exactly: the asymmetry, the closure ratio, and the signature. Drawn, in floating point and labelled as such: the two-dimensional coordinates, which come from an eigendecomposition of the same Gram matrix and are honest only to the degree the “2D holds” column reports — ${(100 * Math.min(...capStructured)).toFixed(0)}–${(100 * Math.max(...capStructured)).toFixed(0)}% of the structure for the structured sets against ${(100 * Math.min(...capControl)).toFixed(0)}–${(100 * Math.max(...capControl)).toFixed(0)}% for the control. The chords are the raw judgements, so what you are looking at is the matrix and not a summary of it.</p>

  <h3>What this is not</h3>
  <p>It is not interpretability. Nothing here says how the model computes anything, and nothing here opens it. It is a measurement of what its <em>answers</em> are shaped like, on five small sets, with two of them present only to fail. Five sets is not a survey; the sets were chosen before the calls were made and all five are on the page, including the one whose prediction was wrong.</p>

  <table><thead><tr><th>set</th><th>model</th><th>closure</th><th>closing</th><th>median step</th><th>signature</th><th>2D</th><th>asym</th><th>order</th></tr></thead><tbody>${rows}</tbody></table>

  <pre>ENVS_ALLOW_NETWORK=1 node playground/neural-geometry/probe.js --cap 2.00
node playground/neural-geometry/decide.js
node playground/build.js</pre>
</div></section>

<footer class="foot"><div class="wrap"><div class="line">
  <span>cert-machine / playground</span>
  <a href="../index.html">the playground</a>
  <a href="https://www.goodfire.com/research/neural-geometry">Goodfire · neural geometry</a>
  <span>probed ${G.meta.date} · ${G.meta.calls} calls · $${G.meta.spent.toFixed(2)}</span>
</div></div></footer>`;

function build(OUT) {
  const html = page({
    title: 'The shapes a model will admit to from the outside · playground',
    desc: 'Neural geometry without the weights: elicit every pairwise dissimilarity from three working models, then decide exactly what those answers can be. The hue wheel closes, the digits do not, and the week is bent but open.',
    root: '../', here: 'neural-geometry', body,
    script: `<style>${SHELLCSS}\n${CSS}</style>`,
  });
  const dir = path.join(OUT, 'neural-geometry');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, sets: sets.length, models: IDS.length, calls: G.meta.calls, spent: G.meta.spent };
}

/* the card art: the hue wheel from the model that drew it cleanest */
function cardArt() {
  const best = hues.models.reduce((a, m) => (m.closure.ratio < a.closure.ratio ? m : a));
  return plate(best, hues.items, { size: 560, pad: 92 });
}

module.exports = { build, cardArt, G };
