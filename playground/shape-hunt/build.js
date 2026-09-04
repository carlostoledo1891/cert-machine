/* build.js — site/playground/shape-hunt/index.html from out/shapes.json.
   Static. The finding is a negative one and a slider would not help it. */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const { shapePlate, symPlate } = require('./plate.js');

const S = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'shapes.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');
const n = (x, d = 4) => (x === null || x === undefined ? '—' : Number(x).toFixed(d));
const short = (id) => id.replace('claude-', '').replace('-4-5', ' 4.5').replace('-5', ' 5');
const fmt = (x) => Number(x).toLocaleString('en-US');

const rows = S.rows;
const real = rows.filter((r) => !r.synthetic);
const gon = rows.find((r) => r.set === 'a perfect 12-gon');
const noise = rows.find((r) => r.set === 'pure noise');
const beats = (k) => real.filter((r) => (k === 'r4' || k === 'r5' ? (r.found.rings[k[1]] || {}).beats : r.found[k].beats)).length;
const ratio = (r) => r.symmetry.nullP05 / Math.max(r.symmetry.best.defect, 1e-9);
const topSym = real.slice().sort((a, b) => ratio(b) - ratio(a));
const ctl = real.filter((r) => r.shape === 'none');
const ptol = (r) => (100 * r.ptolemy.violations) / r.ptolemy.of;
const byPtol = real.slice().sort((a, b) => ptol(b) - ptol(a));

const fig = (title, sub, svg, note) =>
  `<div class="fig"><div class="cap"><span class="t">${title}</span><span class="s">${sub}</span></div>${svg}<p class="note">${note}</p></div>`;

const tbl = real.slice().sort((a, b) => ratio(b) - ratio(a)).map((r) => {
  const r4 = r.found.rings['4'] || {}, r5 = r.found.rings['5'] || {};
  return `<tr><td>${r.set}</td><td>${short(r.model)}</td>`
    + `<td class="${r.found.concyclic.beats ? 'hit' : 'dim'}">${n(r.found.concyclic.exact)}</td><td class="dim">${n(r.found.concyclic.null)}</td>`
    + `<td class="${r4.beats ? 'hit' : 'dim'}">${n(r4.exact)}</td>`
    + `<td class="${r5.beats ? 'hit' : 'dim'}">${n(r5.exact)}</td>`
    + `<td class="${ratio(r) > 3 ? 'hit' : 'dim'}">${n(r.symmetry.best.defect)}</td><td class="dim">${n(r.symmetry.nullP05)}</td>`
    + `<td class="${ratio(r) > 3 ? 'hit' : 'dim'}">${ratio(r).toFixed(1)}×</td><td>${r.symmetry.best.kind}</td>`
    + `<td class="${ptol(r) > 30 ? 'hit' : 'dim'}">${ptol(r).toFixed(0)}%</td></tr>`;
}).join('');

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">playground · shape hunt · ${fmt(S.meta.totalTests)} tests, no model calls</div>
  <h1>Nothing here is a perfect circle. Some things are closer than luck.</h1>
  <p class="lede">The elicited geometries look like they contain shapes — a pentagon here, four points that fall on a circle there. So this looks, exhaustively: every triple, every quadruple, every five-subset, of every set, from every model. <b>${fmt(S.meta.totalTests)} tests.</b> At that volume something will be perfect, so nothing counts until it beats the same hunt run on the same numbers with the geometry shuffled out of them.</p>
</div></header>

<section class="sec"><div class="wrap">
  <div class="eyebrow">first, does the hunter work</div>
  <h2>Two shapes with known answers</h2>
  <p class="why">Before any result about a model, two matrices that are not answers. One is a <b>perfect regular 12-gon</b>, its exact chords rounded onto the same 0–100 integer grid the models reply on. The other is <b>pure noise</b> on that grid. A hunter that cannot find the ring in the first, or that finds one in the second, has nothing to say about anything in between.</p>
  <div class="two">
    ${fig('a perfect 12-gon', 'symmetry ' + n(gon.symmetry.best.defect) + ' vs null ' + n(gon.symmetry.nullP05, 3),
      symPlate(gon.pts, gon.items, gon.symmetry.best.perm, { label: 'A perfect 12-gon with the rotation the hunt recovered drawn as chords.' }),
      `<b>Found, exactly.</b> The best symmetry is <b>${gon.symmetry.best.kind}</b> at a defect of ${n(gon.symmetry.best.defect)} against a random-permutation null of ${n(gon.symmetry.nullP05, 3)}. The chords fan because a rotation moves every point the same way round. Its best quadruple is concyclic to ${n(gon.found.concyclic.exact)} — which it should be, since on a 12-gon every quadruple is.`)}
    ${fig('pure noise', 'symmetry ' + n(noise.symmetry.best.defect) + ' vs null ' + n(noise.symmetry.nullP05, 3),
      shapePlate(noise.pts, noise.items, (noise.found.rings['5'] || {}).sub, { label: 'Pure noise with the most pentagon-like five points the hunt could find in it.' }),
      `<b>And here is the trap.</b> That is the roundest pentagon in ${fmt(noise.tests)} tests on random numbers, and it looks like a pentagon. Its defect is ${n((noise.found.rings['5'] || {}).exact)} against a shuffled null of ${n((noise.found.rings['5'] || {}).null)} — <b>no better than chance</b>. Every shape below is one of these until it proves otherwise.`)}
  </div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the result nobody wants</div>
  <h2>The polygons are not there.</h2>
  <div class="grid3">
    <div><h3><span class="big">${beats('collinear')} of ${real.length}</span>collinear triples</h3><p>Not one set, in any model, contains three items whose distances add up better than shuffling the same distances would produce.</p></div>
    <div><h3><span class="big">${beats('concyclic')} of ${real.length}</span>concyclic quadruples</h3><p>Ptolemy's equality, exactly. Four survivors out of fifty-four cases, and none of them dramatic.</p></div>
    <div><h3><span class="big">${beats('r5')} of ${real.length}</span>regular pentagons</h3><p>Squares fare a little better at ${beats('r4')}. Equilateral triangles: ${beats('equilateral')}. This is what ${fmt(S.meta.totalTests)} tests buys.</p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>That is the honest headline and it took the whole apparatus to earn.</b> Every one of those hunts finds <em>something</em> — a best quadruple always exists — and every one of them looks convincing drawn. What kills them is the null: run the identical search on the same distances with their geometry shuffled away, and the shuffled version does just as well. The shapes were in the looking.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">what survives</div>
  <h2>Not the polygons. The groups.</h2>
  <p class="why">One test is different in kind. Instead of searching hundreds of subsets for a shape, it asks whether the <em>whole</em> configuration is preserved by a symmetry: a permutation π with D[π(i)][π(j)] = D[i][j]. There are only ${'2n'} candidates to try — the rotations and reflections — so there is almost nothing to overfit, and the answer is a named group element rather than a lucky subset.</p>
  <div class="three">
    ${topSym.slice(0, 3).map((r) => fig(r.set + ' · ' + short(r.model), r.symmetry.best.kind,
      symPlate(r.pts, r.items, r.symmetry.best.perm, { label: r.set + ' with the recovered symmetry drawn as chords.' }),
      `Defect <b>${n(r.symmetry.best.defect)}</b> against a random-permutation null of ${n(r.symmetry.nullP05, 3)} — <b>${ratio(r).toFixed(0)}× better</b>.`)).join('')}
  </div>
  <p class="why" style="margin-top:var(--s-6)">
    <b>The compass one is worth stopping on.</b> The element the hunt recovers there is <em>rotation by four</em> on eight points — which is the antipodal map, north↔south and east↔west. Nobody asked about opposites; the model was asked how different each direction is from each other one, one row at a time, and the answers turn out to be invariant under swapping every direction for its opposite.
  </p>
  <p class="why" style="margin-top:var(--s-4)">
    And the bar has to be read carefully: all ${real.length} cases beat the 5th percentile of random permutations, which is a weak thing to beat. Only <b>${real.filter((r) => ratio(r) > 3).length}</b> beat it threefold and <b>${real.filter((r) => ratio(r) > 5).length}</b> fivefold. The controls sit at ${ctl.map((r) => ratio(r).toFixed(1) + '×').join(', ')} — they clear the bar and clear it by nothing.
  </p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the instrument counting its own grid</div>
  <h2>The calibration that had to come first</h2>
  <p class="why">Ptolemy's inequality holds for any four points in any Euclidean space, so a violation means four answers that <em>no</em> Euclidean arrangement can produce. The first version of that count was worthless. On the perfect 12-gon every quadruple sits exactly at equality, the answers live on an integer grid, and rounding pushed half of them a hair below zero: <b>240 violations out of 495 in a shape that is Euclidean by construction</b>.</p>
  <p class="why" style="margin-top:var(--s-4)">So the floor is measured rather than chosen. The worst dip a perfect 12-gon produces on this grid is <b>${n(S.meta.eps, 5)}</b>, all of it rounding, and nothing shallower is counted anywhere. The 12-gon then reports <b>0 of 495</b>, and the numbers below are what is left.</p>
  <div class="grid3" style="margin-top:var(--s-7)">
    <div><h3><span class="big">${ptol(byPtol[0]).toFixed(0)}%</span>${byPtol[0].set} · ${short(byPtol[0].model)}</h3><p>of all ${byPtol[0].ptolemy.of} quadruples are outside every Euclidean arrangement — not merely curved, but impossible to place at all.</p></div>
    <div><h3><span class="big">0%</span>every nonsense control</h3><p>The strings that are not words produce answers that are perfectly Euclidean. So do the unrelated nouns, near enough. <b>Structure is what breaks the geometry.</b></p></div>
    <div><h3><span class="big">${fmt(S.meta.totalTests)}</span>tests, ${S.meta.nulls} shuffles per case</h3><p>Run on answers already on disk. The hunt costs nothing but arithmetic, which is the only reason a null this large is affordable.</p></div>
  </div>
</div></section>

<section class="sec"><div class="wrap narrow">
  <div class="eyebrow">the method</div>
  <h2 style="margin-top:var(--s-3)">Screen in floats, decide in rationals</h2>
  <p class="why">The 2D pictures on these pages are a float shadow of something living in four to ten dimensions, so a pentagon spotted in a drawing may not be in the data at all. Every test here is a statement about the distance matrix, which arrived as whole numbers: three points are collinear when the longest side equals the sum of the other two; four are concyclic exactly when Ptolemy's inequality is tight; a subset is a regular k-gon when its distances depend only on how far apart the two items sit around the ring.</p>
  <p class="why" style="margin-top:var(--s-4)">Floats enumerate the candidates — hundreds of subsets per set, fast, and allowed only to <em>prune</em>. Every survivor is then recomputed in exact rationals, and it is the exact number that is printed. That is the same screen-then-certify split the rest of this repository runs on, applied to a question about shapes.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>What this is not.</b> It is not a claim that models have no geometry — the pages next door measure plenty. It is a claim about a specific and seductive kind of finding: that a beautiful subset picked out of five hundred is not evidence, and that the way to tell is to run the identical search on the same numbers with the structure removed. Most of what looked like a shape here did not survive that, and the page leads with the count of what did.</p>

  <table><thead><tr><th>set</th><th>model</th><th>concyclic</th><th>null</th><th>4-gon</th><th>5-gon</th><th>symmetry</th><th>null</th><th>ratio</th><th>element</th><th>ptolemy</th></tr></thead><tbody>${tbl}</tbody></table>

  <pre>node playground/shape-hunt/run.js    # ${fmt(S.meta.totalTests)} tests, no network
node playground/build.js</pre>
</div></section>

<footer class="foot"><div class="wrap"><div class="line">
  <span>cert-machine / playground</span>
  <a href="../index.html">the playground</a>
  <a href="../neural-geometry/index.html">where the geometries came from</a>
  <span>hunted ${S.meta.date}</span>
</div></div></footer>`;

function build(OUT) {
  const html = page({
    title: 'Nothing here is a perfect circle · playground',
    desc: 'Sixteen million exhaustive tests for hidden polygons in geometries elicited from language models — and what happens when you run the same search on the same numbers with the geometry shuffled out.',
    root: '../', here: 'shape-hunt', body,
    script: `<style>${SHELLCSS}\n${CSS}</style>`,
  });
  const dir = path.join(OUT, 'shape-hunt');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, cases: rows.length, tests: S.meta.totalTests };
}

function cardArt() {
  const r = topSym[0];
  return symPlate(r.pts, r.items, r.symmetry.best.perm, { size: 560, pad: 96, label: 'The symmetry recovered from a model’s own answers, drawn as the chords it moves each item along.' });
}

module.exports = { build, cardArt, S, topSym, real, beats, ratio };
