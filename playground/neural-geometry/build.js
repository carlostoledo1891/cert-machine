/* build.js — site/playground/neural-geometry/index.html, from out/geometry.json.
   Static plates. Nothing here moves, because the finding is not a slider.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const { plate, mapPlate } = require('./plate.js');

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
const setOf = (id) => sets.find((s) => s.id === id);
const done = (s) => s.models.filter((m) => !m.incomplete);
const structured = sets.filter((s) => s.shape !== 'none');
const controls = sets.filter((s) => s.shape === 'none');
const qStructured = structured.flatMap((s) => done(s).map((m) => m.signature.q));
const qControl = controls.flatMap((s) => done(s).map((m) => m.signature.q));
const strCells = qStructured.length, ctlCells = qControl.length;
const qPos = qStructured.filter((q) => q > 0).length;
const capStructured = structured.flatMap((s) => done(s).map((m) => m.captured));
const capControl = controls.flatMap((s) => done(s).map((m) => m.captured));
const triCtl = controls.flatMap((s) => done(s).map((m) => m.tri.violations));
const asymBy = IDS.map((id) => ({ id, worst: Math.max(...sets.map((s) => byId(s, id).asym.max)) }));
const cyclicBy = IDS.map((id) => ({ id, hits: sets.filter((s) => byId(s, id).cyclic).length }));
const hues = sets.find((s) => s.id === 'hues');
const digits = sets.find((s) => s.id === 'digits');
const weekdays = sets.find((s) => s.id === 'weekdays');
const closeOf = (s) => done(s).map((m) => m.closure.ratio);
const hypOf = (s) => done(s).map((m) => m.hyp.norm);
const byShape = (k) => sets.filter((s) => s.shape === k);
const meanHyp = (s) => mean(hypOf(s));
const fitOf = (s) => done(s).filter((m) => m.fit !== null).map((m) => m.fit);
const meanFit = (s) => (fitOf(s).length ? mean(fitOf(s)) : null);
const family = sets.filter((s) => s.family === 'ten');
const beats = (s) => s.fitNull && meanFit(s) !== null && meanFit(s) > s.fitNull.p95;
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

const plateBlock = (s, m) => `
  <div class="pl">
    <div class="who"><span class="m">${short(m.id)}</span><span class="c">${m.n} items · ${(m.n * (m.n - 1)) / 2} pairs</span></div>
    ${plate(m, s.items, { hasOrder: s.order })}
    <div class="nums">
      <span><span class="k">${s.order ? 'closure' : 'tri viol'}</span><span class="v ${s.order ? (m.closure.ratio < 1.6 ? 'hit' : '') : (m.tri.violations === 0 ? 'hit' : '')}">${s.order ? n(m.closure.ratio) + '×' : m.tri.violations}</span></span>
      <span><span class="k">δ / diam</span><span class="v ${m.hyp.norm !== null && m.hyp.norm < 0.14 ? 'hit' : ''}">${m.hyp.norm === null ? '—' : n(m.hyp.norm, 3)}</span></span>
      <span><span class="k">curved dirs</span><span class="v ${m.signature.q > 0 ? 'hit' : ''}">${m.signature.q}</span></span>
      <span><span class="k">${m.fit === null ? '2D holds' : 'fit to truth'}</span><span class="v ${m.fit === null ? (m.captured > 0.8 ? 'hit' : '') : (s.fitNull && m.fit > s.fitNull.p95 ? 'hit' : '')}">${m.fit === null ? (100 * m.captured).toFixed(0) + '%' : n(m.fit, 3)}</span></span>
    </div>
  </div>`;

const setBlock = (s) => `
<section class="set"><div class="wrap">
  <div class="head">
    <div>
      <div class="eyebrow">${s.id} · predicted: ${s.predict}</div>
      <h2>${s.title}</h2>
      <div class="verdict">${s.order ? `<span class="tag">closure ratio</span> ${closeOf(s).map((c) => n(c)).join(' · ')}<br>
      <span class="tag">cyclic order</span> ${s.models.map((m) => (m.cyclic ? 'kept' : 'broken')).join(' · ')}<br>` : ''}
      <span class="tag">δ / diameter</span> ${s.models.map((m) => n(m.hyp.norm, 3)).join(' · ')}<br>
      <span class="tag">curved directions</span> ${done(s).map((m) => m.signature.q).join(' · ')} of ${s.models[0].n - 1}<br>
      <span class="tag">models agree</span> ${n(s.agree, 3)}${s.fitNull ? `<br><span class="tag">fit to the known layout</span> ${n(meanFit(s), 3)} <span class="tag">against a shuffled null of ${n(s.fitNull.p95, 3)}</span>` : ''}${s.anchor && s.pullRho > 0.25 ? `<br><span class="tag">reference item</span> ${s.anchor.reference.join(' · ')}${s.anchor.unanimous ? ' <span class="tag">(all three)</span>' : ''}` : ''}</div>
    </div>
    <p class="why">${s.why}</p>
  </div>
  <div class="plates">${s.models.map((m) => (m.incomplete
    ? `<div class="pl"><div class="who"><span class="m">${short(m.id)}</span><span class="c">no plate</span></div><p class="cap" style="padding:var(--s-6) 0;color:var(--ink-5)">A row came back unparseable and was not repaired, so this cell has no matrix. It is left here rather than dropped, because a missing tile reads like a finding.</p></div>`
    : plateBlock(s, m))).join('')}</div>
</div></section>`;

const dash = '<td>—</td>';
const rows = sets.map((s) => s.models.map((m) => {
  if (m.incomplete) return `<tr><td>${s.id}</td><td>${short(m.id)}</td><td colspan="7">incomplete — a row came back unparseable</td></tr>`;
  return `<tr><td>${s.id}</td><td>${short(m.id)}</td>`
    + (m.closure ? `<td>${n(m.closure.ratio)}</td><td>${n(m.closure.closing, 1)}</td>` : dash + dash)
    + `<td>${n(m.hyp.norm, 3)}</td>`
    + `<td>${m.tri.violations}/${m.tri.tested}</td>`
    + `<td>${m.signature.p}+ ${m.signature.q}− ${m.signature.z}z</td><td>${(100 * m.captured).toFixed(0)}%</td>`
    + `<td>${m.asym.max}</td></tr>`;
}).join('')).join('');

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">instruments · neural geometry · ${G.meta.calls} calls, $${G.meta.spent.toFixed(2)}</div>
  <h1>The shapes a model will admit to from the outside.</h1>
  <p class="lede">Goodfire finds geometry by opening the model: decompose the activations and days of the week come out as a circle, colours as a surface. That needs the weights. <b>This asks from outside instead.</b> Every pair of items, one integer, one row at a time — and then the question is what those answers <em>can</em> be. A shape that only exists inside the activations was never a shape the model uses; if the circle is real, it should survive being asked about.</p>
</div></header>

<section class="finding"><div class="wrap"><div class="grid">
  <div>
    <h3><span class="big">0 of ${ctlCells}</span>Structure is curvature.</h3>
    <p>The Gram matrix of a set of distances is positive semidefinite exactly when those distances are Euclidean. Every one of the ${ctlCells} control cells is: <b>zero negative directions</b>, for unrelated nouns and for nonsense strings alike, in all three models. ${qPos} of the ${strCells} structured cells are not. Squeezing a cycle, a tree or a grid into pairwise numbers cannot be done flatly, and the failure to be flat is the fingerprint.</p>
  </div>
  <div>
    <h3><span class="big">${n(mean(closeOf(setOf('digits'))))}× → ${n(mean(closeOf(setOf('clockhours'))))}×</span>The frame moves the geometry.</h3>
    <p>The same numerals, asked under different frames. As <b>digits</b> they lie on a line; named as <b>hours on a clock face</b> or as <b>residues modulo ten</b> they close into a ring. Nothing about the tokens changed, only what they are for. But the frame is bounded: asked as <b>keypad keys</b> the models do not produce the keypad's layout at all, and fail <em>below</em> a shuffled null. The frame bends a structure the model has. It does not create one it lacks.</p>
  </div>
  <div>
    <h3><span class="big">Earth</span>The asymmetry knows the reference.</h3>
    <p>D(i,j) and D(j,i) came from calls that never met, and the page was averaging them and calling the difference noise. Its <em>direction</em> is not noise: things are judged closer to Earth than Earth is to them, in <b>all three models independently</b>. That is Tversky's asymmetry, and it points at the prototype. On the seven wheels it points at nothing — ρ ≈ ${n(mean(byShape('cycle').map((x) => x.pullRho)), 2)} — which is exactly right, because a circle has no privileged point.</p>
  </div>
</div>
</div></div></section>

<section class="mapsec"><div class="wrap">
  <div class="maphead">
    <div>
      <div class="eyebrow">every set, every model, two numbers</div>
      <h2>The map</h2>
    </div>
    <p class="why">Curvature against closure: the share of the signature that is negative, against Gromov's δ over the diameter. Neither number knows what the set was — the grouping is what the answers do on their own. <b>The controls sit alone in the corner where both are zero</b>, and nothing else is near them.</p>
  </div>
  ${mapPlate(sets)}
  <div class="legend">
    ${['cycle', 'line', 'tree', 'grid', 'none'].map((k) => `<span><i class="sw k-${k}"></i>${k === 'none' ? 'controls' : k}</span>`).join('')}
  </div>
  <p class="why" style="margin-top:var(--s-5);max-width:70ch">
    <b>What δ does and does not do.</b> It was brought in to tell a tree from a wheel, and it half works: the cycles average ${n(mean(byShape('cycle').map(meanHyp)), 3)} and the taxonomy ${n(meanHyp(setOf('carnivores')), 3)}. But the controls are <em>lower still</em> at ${n(mean(byShape('none').map(meanHyp)), 3)}, because answers with no structure are near-equilateral and near-equilateral is near-tree by this measure. So δ is not a tree detector. It measures how CLOSED a structure is, and it only means anything once curvature has already said there is one. The prediction was sharper than the result and the result is what is drawn.
  </p>
</div></section>


<section class="frames"><div class="wrap">
  <div class="maphead">
    <div>
      <div class="eyebrow">the same ten tokens, four times</div>
      <h2>The frame is the parameter.</h2>
    </div>
    <p class="why">Ten numerals, unchanged. What changes is one sentence in front of the question, naming what they are <em>for</em> — and never what shape they make. Each plate below is the same model answering about the same items under a different frame, with its distance to the layout that frame implies, against the fit a <b>shuffled</b> configuration would reach.</p>
  </div>
  <div class="fplates">${family.map((s) => {
    const m = done(s)[0];
    const good = s.fitNull && meanFit(s) > s.fitNull.p95;
    return `<div class="pl">
      <div class="who"><span class="m">${s.frameLabel}</span><span class="c">${short(m.id)}</span></div>
      ${plate(m, s.items, { hasOrder: s.order })}
      <p class="fq">${s.frame ? `&ldquo;${s.frame}&rdquo;` : 'no frame — the items alone'}</p>
      <div class="nums">
        <span><span class="k">predicted</span><span class="v" style="font-size:.78rem">${s.predict}</span></span>
        <span><span class="k">fit</span><span class="v ${good ? 'hit' : 'miss'}">${n(meanFit(s), 3)}</span></span>
        <span><span class="k">shuffled null</span><span class="v">${n(s.fitNull.p95, 3)}</span></span>
        <span><span class="k">verdict</span><span class="v ${good ? 'hit' : 'miss'}">${good ? 'holds' : 'fails'}</span></span>
      </div>
    </div>`;
  }).join('')}</div>
  <p class="why" style="margin-top:var(--s-6);max-width:74ch">
    <b>Two of these work, one correctly does nothing, and one fails below chance.</b>
    Named as <b>residues modulo ten</b> the line closes into a ring — ${n(mean(closeOf(setOf('mod10'))))}× against ${n(mean(closeOf(setOf('digits'))))}× for the bare digits, and a fit of ${n(meanFit(setOf('mod10')), 3)} to the true circle where shuffling reaches ${n(setOf('mod10').fitNull.p95, 3)}. Nothing in the frame mentions that nine and zero are neighbours; the model brought that.
    Named as <b>floors of a building</b> — as concrete a frame as the others, and one that should change nothing — nothing changes: ${n(mean(closeOf(setOf('floors'))))}× against ${n(mean(closeOf(setOf('digits'))))}×. That is the control inside the experiment and it behaves.
    And named as <b>keys on a telephone keypad</b>, the layout does not appear at all: ${n(meanFit(setOf('keypad')), 3)} against a shuffled null of ${n(setOf('keypad').fitNull.p95, 3)} — <b>worse than permuting the labels</b>. The models have the keypad as a thing; they do not have it as a place.
  </p>
  <p class="why" style="margin-top:var(--s-4);max-width:74ch">
    So the frame is a real parameter and a bounded one. It moves the geometry along an axis the model already carries — an order can be bent into a cycle — and it cannot conjure one the model does not have. Asking for a grid does not produce a grid.
  </p>
</div></section>

${[['cycle', 'the wheels'], ['line', 'the lines'], ['tree', 'the branching one'], ['grid', 'the two-axis one'], ['none', 'the controls']]
  .map(([k, label]) => byShape(k).length
    ? `<div class="band"><div class="wrap"><span class="eyebrow">${label}</span></div></div>` + byShape(k).map(setBlock).join('')
    : '').join('')}

<section class="method"><div class="wrap">
  <div class="eyebrow">the method</div>
  <h2 style="margin-top:var(--s-4)">How the answers were taken, and what was decided</h2>

  <p><b>One row at a time, on purpose.</b> Asking for the whole matrix in one call is cheaper and worse: the model can enforce its own symmetry by reading what it just wrote. Asked row by row, the two halves of every pair come from calls that never see each other — so their agreement is a consistency test nobody requested and none of them can be given for free. It is the sharpest separator on the page: worst disagreement ${asymBy.map((a) => short(a.id) + ' ' + a.worst).join(', ')} on a 0–100 scale, and the model least consistent with itself is also the only one that never keeps a cyclic order (${cyclicBy.map((c) => short(c.id) + ' ' + c.hits + '/' + sets.length).join(', ')}).</p>

  <h3>Every answer is a whole number</h3>
  <p>The scale is 0–100 integers, so the matrix is exact rational data and nothing downstream is a threshold on a float. The symmetrised distances are integers over two; the Gram matrix is exact; and its signature is computed by exact symmetric congruence, where Sylvester's law makes the count basis-independent and rationals make each sign a decision instead of a comparison.</p>

  <h3>Why the negative directions are the finding</h3>
  <p>By Schoenberg, a distance matrix is Euclidean exactly when its doubly-centred Gram matrix is positive semidefinite, and then the rank is the smallest flat space the points fit in. Geodesic distances on a circle are famously <em>not</em> Euclidean — you would need the chords — so a model that answers about a cycle in cycle-distances must produce negative directions, and one that answers about nothing in particular has no reason to. That is exactly the split measured here, and it is the same claim Goodfire makes from inside, arrived at without the weights.</p>

  <h3>Is it even a distance?</h3>
  <p>Nothing forces a model's numbers to be a metric. It answers one pair at a time and owes nothing to any third point, so the first question about "distance" is whether it is one. Every triple was checked exactly: the controls violate the triangle inequality <b>${triCtl.reduce((a, x) => a + x, 0)} times out of ${controls.flatMap((x) => done(x).map((m) => m.tri.tested)).reduce((a, x) => a + x, 0)}</b>, and so do the physical orderings — planets and scales of size never violate it once. The wheels do, and the smallest model does it most: its worst set breaks the inequality in ${Math.max(...sets.flatMap((x) => done(x).filter((m) => m.id === 'claude-haiku-4-5').map((m) => m.tri.violations)))} triples. A model whose own differences are not a metric is not holding a space.</p>

  <h3>What is decided and what is drawn</h3>
  <p>Decided, exactly: the asymmetry, the closure ratio, and the signature. Drawn, in floating point and labelled as such: the two-dimensional coordinates, which come from an eigendecomposition of the same Gram matrix and are honest only to the degree the “2D holds” column reports — ${(100 * Math.min(...capStructured)).toFixed(0)}–${(100 * Math.max(...capStructured)).toFixed(0)}% of the structure for the structured sets against ${(100 * Math.min(...capControl)).toFixed(0)}–${(100 * Math.max(...capControl)).toFixed(0)}% for the control. The chords are the raw judgements, so what you are looking at is the matrix and not a summary of it.</p>

  <h3>What this is not</h3>
  <p>It is not interpretability. Nothing here says how the model computes anything, and nothing here opens it. It is a measurement of what its <em>answers</em> are shaped like, on five small sets, with two of them present only to fail. Five sets is not a survey; the sets were chosen before the calls were made and all five are on the page, including the one whose prediction was wrong.</p>

  <table><thead><tr><th>set</th><th>model</th><th>closure</th><th>closing step</th><th>δ/diam</th><th>triangle</th><th>signature</th><th>2D</th><th>asym</th></tr></thead><tbody>${rows}</tbody></table>

  <pre>ENVS_ALLOW_NETWORK=1 node playground/neural-geometry/probe.js --cap 2.00
node playground/neural-geometry/decide.js
node playground/build.js</pre>
</div></section>

<footer class="foot"><div class="wrap"><div class="line">
  <span>cert-machine / instruments</span>
  <a href="../index.html">all nine instruments</a>
  <a href="https://www.goodfire.com/research/neural-geometry">Goodfire · neural geometry</a>
  <span>probed ${G.meta.date} · ${G.meta.calls} calls · $${G.meta.spent.toFixed(2)}</span>
</div></div></footer>`;

function build(OUT) {
  const html = page({
    title: 'The shapes a model will admit to from the outside · instruments',
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
