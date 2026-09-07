/* build.js — site/instruments/census/index.html.
   playground/census/ · cert-machine · 2026-09-07

   THE ENGINE COMPUTES; THIS ONLY READS. Every number below comes out of
   playground/census/out/facts.json, which make-facts.mjs writes by running the
   engine and refusing unless it agrees with certs/facelaw-theorem.json on every
   k, z and shortcut it shares with it. The page then hands the same engine to
   the browser.

   NO FICTION ON /instruments. Nothing here is gated as a report is; the page
   says what backs each number: k is decided over Q; the totals are one
   conserving flow inside Table I's rounding box (chosen); the split is one
   member of the face (chosen). */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));

const OUT = path.join(HERE, 'out');
const F = JSON.parse(fs.readFileSync(path.join(OUT, 'facts.json'), 'utf8'));
const CARD = fs.readFileSync(path.join(OUT, 'card.svg'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const ENGINE = fs.readFileSync(path.join(HERE, 'engine.js'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
if (!F.checks.paperK) throw new Error('census: the engine did not agree with the record — no page');

const P = F.paper;
const nz = P.repair.residualBefore.map((r, i) => [P.repair.rows[i], r]).filter(([, r]) => r !== '0');

/* a small static drawing of a network for the gallery */
function mini(edges, exits, ea, eb, components) {
  const nodes = {}; edges.forEach(e => { nodes[e[0]] = 1; nodes[e[1]] = 1; });
  const ids = Object.keys(nodes).map(Number).sort((a, b) => a - b);
  const pos = {}; ids.forEach((n, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / ids.length; pos[n] = [90 + 70 * Math.cos(a), 90 + 70 * Math.sin(a)]; });
  const exitFree = new Set(); (components || []).forEach(c => { if (!c.some(n => exits.includes(n))) c.forEach(n => exitFree.add(n)); });
  const s = ['<svg viewBox="0 0 180 180" role="img" aria-label="a small directed network">'];
  edges.forEach(([u, v]) => { const a = pos[u], b = pos[v]; s.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${exitFree.has(u) && exitFree.has(v) ? 'var(--ink)' : 'var(--ink-3)'}" stroke-width="${exitFree.has(u) && exitFree.has(v) ? 2.2 : 1}"/>`); });
  ids.forEach(n => { const q = pos[n]; s.push(`<circle cx="${q[0]}" cy="${q[1]}" r="${(n === ea || n === eb) ? 7 : 5}" fill="${exits.includes(n) ? 'var(--ink)' : 'var(--paper)'}" stroke="var(--ink)" stroke-width="1.2"/>`); });
  s.push('</svg>');
  return s.join('');
}

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">instruments &middot; census &middot; k decided over &#8474; in your tab</div>
  <h1>Unique totals, and the split nobody can see.</h1>
  <p class="lede">Two populations cross the same network and pay the same price per edge.
  The equilibrium fixes how much flows on every edge, and cannot say <em>whose</em>
  flow it is: the set of splits it cannot tell apart is a face, and its dimension is a
  number this page decides in exact rationals &mdash; ${P.face.k} on the network of
  <a href="https://arxiv.org/abs/2504.16028">Bakaryan, Aoun, de Lima Ribeiro, Hovakimyan and Gomes</a>.
  Drag a direction of that face and watch the two populations trade an edge while every
  total holds. Drop an edge and watch the dimension re-decided.</p>
</div></header>

<section class="wrap">
  <div class="ce-wrap">
    <div>
      <div class="ce-fig" id="ce-host">${CARD}</div>
      <p class="ce-note" id="ce-note">Dotted strokes are one member of the face: population a in ink, population b in the second ink, their sum the total on the edge. Filled nodes are exits; the two larger nodes are the entrances a and b.</p>
      ${W.legendHtml({ exclude: [W.COMPUTED, W.REFUSED] })}
    </div>
    <div class="ce-panel">
      <div><label for="ce-preset">network</label><select id="ce-preset"></select></div>
      <div class="ce-read" id="ce-read">
        <div><div class="k">k, exact over &#8474;</div><div class="v w-decided">${P.face.k}</div></div>
        <div><div class="k">shortcut |shared| &minus; cons</div><div class="v w-decided">${P.face.shortcut}</div></div>
        <div><div class="k">z, exit-free shared components</div><div class="v w-decided">${P.face.z}</div></div>
        <div><div class="k">|shared| &middot; cons</div><div class="v">${P.face.shared.length} &middot; ${P.face.cons}</div></div>
      </div>
      <div id="ce-sliders" class="ce-panel"></div>
    </div>
  </div>
</section>

<section class="wrap">
  <h2>What backs what</h2>
  <p><b>k is decided.</b> The two populations&rsquo; conservation systems are stacked, restricted
  to the ${P.face.shared.length} edges both can reach, and their null space is computed over
  the rationals: dimension ${P.face.k}, rank ${P.face.rank}. The same arithmetic runs in this
  tab. It is the theorem of <a href="../../reports/terra.html">the face law</a>,
  k = |shared| &minus; cons + z, decided in Python on 7,850 networks and recorded in
  <span class="mono">certs/facelaw-theorem.json</span>; the JavaScript engine here is a
  second copy of that rule, and the page refuses to build unless the two agree on every
  k, z and shortcut they share (${F.checks.cycleFamily} cycle rows, ${F.checks.failingInstances}
  failing instances, the paper&rsquo;s network).</p>
  <p><b>The totals are chosen.</b> Table I of the paper prints rounded integers, and rounded
  integers are not a flow: at node${nz.length > 1 ? 's' : ''} ${nz.map(([n, r]) => `${n} (${r > 0 ? '+' : ''}${r})`).join(', ')}
  the printed outflow does not equal the inflow. The totals drawn are the nearest conserving
  flow to Table I in the least-squares sense, solved exactly &mdash; no edge moves by more than
  ${P.repair.maxDev} (${P.repair.maxDevNum.toFixed(3)}), inside the rounding. That is one member of
  the rounding box, so it is drawn dotted. The totals themselves are reproduced within their
  rounding and proved on <a href="../../reports/wardrop-repro.html">the Wardrop page</a>; this
  page does not re-prove them.</p>
  <p><b>The split is chosen.</b> Population a&rsquo;s share of each shared edge is one point of the
  face, found by exact max-flow and centred so that no flow sits at zero (smallest slack
  ${P.split.minSlack}). The sliders move it along the ${P.face.k} directions of the null space;
  the ranges are where a flow would turn negative. Nothing decides which point the players
  actually chose &mdash; the paper&rsquo;s own scenario S1 has unique totals and a split that
  moves across re-seeds, which is exactly the non-uniqueness this face measures.</p>
</section>

<section class="wrap">
  <h2>The census</h2>
  <p>The shortcut k = |shared| &minus; cons is what one would guess and what the paper&rsquo;s
  network makes look like a law (z = 0 there). It is wrong exactly when the shared subgraph has
  a component with no exit, and then it undercounts by that number of components. Across
  ${F.census.fresh.tested.toLocaleString('en-US')} random networks the theorem was tested on
  (seed ${F.census.fresh.seed}), the shortcut failed ${F.census.fresh.shortcutFailures} times and
  z was positive ${F.census.fresh.zPositive} times &mdash; the same ${F.census.fresh.shortcutFailures}
  networks. Three of them, from the record, and the constructed family that forces it:</p>
  <div class="ce-gal">
    ${F.failing.map((f, i) => `<figure>${mini(f.edges, f.exits, f.ea, f.eb, f.components)}<figcaption>#${i + 1} &middot; k = ${f.k}, shortcut ${f.shortcut}, z = ${f.z}. The heavy edges are the exit-free shared component.</figcaption></figure>`).join('\n')}
    ${F.cycle.slice(0, 1).map(c => `<figure>${mini(c.edges, c.exits, c.ea, c.eb, [[100, 101, 102]])}<figcaption>the shared ${c.L}-cycle with no exit &middot; k = ${c.k}, shortcut ${c.shortcut}, z = ${c.z}; the same for every cycle length from 3 to 8.</figcaption></figure>`).join('\n')}
  </div>
  <p class="note">Every network in the gallery is a preset above. The engine that decided them
  is <span class="mono">playground/census/engine.js</span>, written fresh in JavaScript with
  BigInt rationals against the Python record, and the facts on this page were written by
  <span class="mono">make-facts.mjs</span> after that cross-check passed.</p>
</section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'census');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'Unique totals, and the split nobody can see — cert-machine',
    desc: 'Two populations on one network: the equilibrium fixes the totals and not the split. The face of splits it cannot tell apart has dimension ' + P.face.k + ' on the published network, decided in exact rationals in your tab.',
    root: '../', here: 'instruments',
    head: `<style>${CSS}</style>`,
    body,
    script: `<script id="ce-spec" type="application/json">${JSON.stringify(F).replace(/</g, '\\u003c')}</script>\n<script>${ENGINE}</script>\n<script>${APP}</script>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, k: P.face.k, tested: F.census.fresh.tested, failures: F.census.fresh.shortcutFailures };
}

function cardArt() { return CARD; }

module.exports = { build, cardArt, facts: F };
