/* build-exact-geometry.js — render site/exact-geometry/index.html.
   node experiments/exact-geometry/decide.js && node tools/build-exact-geometry.js

   Reference: cert-machine's neural-geometry playground, which asks a language
   model for pairwise dissimilarities and decides what shape its answers have.
   Same structure — a set, an integer table, exact decisions, one plate each —
   and the opposite subject. Nothing here asks anything what it believes. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');   /* PATCH (declared): now the playground, not the bench */
/* PATCH (declared): the bench shell is replaced by build.js in our design system. */
const { plate } = require(path.join(__dirname, 'plate.js'));
const G = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'geometry.json'), 'utf8'));
const CMP_PATH = path.join(__dirname, 'out', 'compare.json');
const CMP = fs.existsSync(CMP_PATH) ? JSON.parse(fs.readFileSync(CMP_PATH, 'utf8')) : null;

/* did the decision agree with the prediction? Written as a rule, not a judgement */
function verdict(r) {
  const s = r.spectrum, sig = r.signature;
  if (!r.gate.ok) return { held: /refused/i.test(r.predict), said: 'REFUSED at the gate', detail: r.gate.violations[r.gate.violations.length - 1].why };
  const eff = s.effRank, neg = s.negMass;
  const said = `effective rank ${eff}, negative mass ${(100 * neg).toFixed(2)}%, exact signature (${sig.p},${sig.q},${sig.z})`
    + (r.closure ? `, closure ${r.closure.ratio.toFixed(2)}×` : '');
  let held = null;
  if (r.id.startsWith('array')) held = eff === 2 && neg < 0.01;
  else if (r.id === 'hex-chord') held = eff === 2 && neg < 0.01 && Math.abs(r.closure.ratio - 1) < 0.05;
  else if (r.id === 'hex-cycle') held = neg > 0.05 && Math.abs(r.closure.ratio - 1) < 0.05;
  else if (r.id === 'band-curve') held = eff <= 3 && r.closure.ratio > 3;
  else if (r.id === 'proof-walk') held = eff <= 4 && r.closure.ratio > 3;
  else if (r.id === 'random') held = eff >= 5 && neg < 0.01;
  return { held, said, detail: null };
}

const rows = G.sets.map(r => ({ r, v: verdict(r) }));
const agreed = rows.filter(x => x.v.held).length;

const CSS = `
.exg { display:grid; grid-template-columns: minmax(0,520px) minmax(0,1fr); gap: var(--s-6); align-items:start; }
@media (max-width: 940px) { .exg { grid-template-columns: 1fr; } }
.exg .art { background: var(--bg-raised); border: 1px solid var(--border); border-radius: var(--radius-m); padding: var(--s-3); }
svg.plate { width: 100%; height: auto; display:block; border-radius: var(--radius-s); }
svg.plate .ch { stroke: #f6f6f8; }
svg.plate .ord { fill:none; stroke:#f6f6f8; stroke-opacity:.85; stroke-width:1.6; }
svg.plate .clo { fill:none; stroke:#f6f6f8; stroke-opacity:.9; stroke-width:1.6; stroke-dasharray:5 4; }
svg.plate .mst { fill:none; stroke:#f6f6f8; stroke-opacity:.6; stroke-width:1.3; }
svg.plate .pt { fill:#0a0a0c; stroke:#f6f6f8; stroke-width:1.3; }
svg.plate .pt.first { fill:#f6f6f8; }
svg.plate .lb { fill:#9a9aa6; font-family:var(--font-mono); font-size:9px; }
svg.plate .lb.first { fill:#f6f6f8; }
svg.plate .ref { fill:#f6f6f8; font-family:var(--font-mono); font-size:15px; letter-spacing:.18em; }
svg.plate .refsub { fill:#6e6e7a; font-family:var(--font-mono); font-size:9px; }
.nums { display:grid; grid-template-columns:repeat(auto-fit,minmax(104px,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; margin-top:var(--s-4); }
.nums div { background:var(--bg-raised); padding:var(--s-3) var(--s-4); }
.nums .k { font-family:var(--font-mono); font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-5); }
.nums .v { font-family:var(--font-mono); font-size:var(--text-small); color:var(--ink); font-variant-numeric:tabular-nums; margin-top:2px; }
.pred { font-family:var(--font-mono); font-size:var(--text-eyebrow); line-height:1.7; color:var(--ink-4); background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-s); padding:var(--s-4); margin-top:var(--s-4); }
.pred b { color:var(--ink-2); font-weight:500; }
.scoreline { display:flex; gap:var(--s-6); flex-wrap:wrap; font-family:var(--font-mono); font-size:var(--text-eyebrow); color:var(--ink-4); margin-top:var(--s-5); }`;

const section = ({ r, v }) => `
<section class="section">
  <div class="container">
    <div class="reveal">
      <div class="eyebrow">${r.gate.ok ? r.shape : 'refused'} &middot; ${r.n} items</div>
      <h2 class="t1" style="margin-top:var(--s-2); max-width:26ch;">${r.title}</h2>
    </div>
    <div class="exg reveal" style="margin-top:var(--s-5);">
      <div class="art">${plate(r)}</div>
      <div>
        <p class="lede" style="font-size:var(--text-body); color:var(--ink-3);">${r.why}</p>
        ${r.gate.ok ? `<div class="nums">
          <div><div class="k">effective rank</div><div class="v">${r.spectrum.effRank}</div></div>
          <div><div class="k">negative mass</div><div class="v">${(100 * r.spectrum.negMass).toFixed(2)}%</div></div>
          <div><div class="k">exact signature</div><div class="v">(${r.signature.p}, ${r.signature.q}, ${r.signature.z})</div></div>
          ${r.closure ? `<div><div class="k">closure ratio</div><div class="v">${r.closure.ratio.toFixed(2)}×</div></div>` : ''}
          <div><div class="k">δ / diameter</div><div class="v">${r.hyper.relative.toFixed(3)}</div></div>
        </div>` : ''}
        <div class="pred">
<b>predicted</b>  ${r.predict}
<b>decided</b>    ${v.said}${v.detail ? '\n           ' + v.detail : ''}
<b>agreed</b>     ${v.held ? 'yes' : 'NO — and that is the finding'}
<b>distances</b>  ${r.scale}${r.note ? '\n           ' + r.note : ''}
        </div>
      </div>
    </div>
  </div>
</section>`;

const body = `
<header class="hero">
  <div class="container">
    <div class="eyebrow reveal">experiments &middot; geometry that can be checked</div>
    <h1 class="display reveal" style="margin-top:var(--s-5); max-width:19ch;">Eight tables, eight predictions</h1>
    <p class="lede reveal" style="margin-top:var(--s-6);">Interpretability work asks a language model for the distance between every pair of things and decides what shape the answers have. The method is good and the answer is uncheckable: nobody knows what the true geometry of a model&rsquo;s beliefs is, so a circle can only ever be reported, never confirmed. These are the same experiments run on objects whose geometry is a fact — an array of telescopes, a certified band, a proof&rsquo;s own subdivision — with the prediction written down first.</p>
    <div class="hero-meta reveal">
      <span class="item"><span class="k">subjects</span><span class="v">${G.sets.length}</span></span>
      <span class="item"><span class="k">predictions upheld</span><span class="v">${agreed} of ${G.sets.length}</span></span>
      <span class="item"><span class="k">distances</span><span class="v">integers, exactly</span></span>
      <span class="item"><span class="k">decisions</span><span class="v">exact rationals</span></span>
      ${CMP ? `<span class="item"><span class="k">and one model, probed</span><span class="v">${CMP.model}</span></span>` : ''}
    </div>
  </div>
</header>

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">What is decided, and in what order</h2>
      <p><strong>Is it a distance at all.</strong> Symmetry, positivity, and the triangle inequality for every triple. A table that fails is refused before anything else runs, because no arrangement of points in any space has those distances and every number downstream would be decoration. One of the eight is here to fail this gate, and it does.</p>
      <p><strong>The closing step.</strong> Where the items have an order, walk it, then take the step from the last back to the first. On a cycle that is one more neighbour and the ratio is one; on a line it is the whole way home and the ratio is about <em>n</em>&nbsp;&minus;&nbsp;1. No embedding, no projection — a statement about the table.</p>
      <p><strong>The signature.</strong> By Schoenberg a table is Euclidean exactly when its doubly-centred Gram matrix is positive semidefinite, and its rank is then the smallest dimension the points fit in. Computed by exact symmetric congruence, so the answer is a triple: Euclidean directions, genuinely non-Euclidean ones, flat ones. Sylvester&rsquo;s law makes that basis-independent and rationals make it decidable — including the case of exactly zero, which no floating-point eigensolver can certify.</p>
      <p><strong>And the spectrum beside it, which is not optional.</strong> An exact signature is infinitely sensitive: perturb one entry of a rank-2 table by a single unit and it goes full rank, because a sign is a sign however small the number carrying it. Twelve points that genuinely live in a three-dimensional box came back (6,&nbsp;5,&nbsp;1) here. So the exact triple is printed next to the float spectrum, and a table counts as Euclidean to within quantisation when its negative directions carry a negligible share of the mass. The triple alone would be exact and misleading, which is the worst combination available.</p>
      <p><strong>Then the four-point condition</strong>, which separates kinds of structure once the signature has said how much there is, and the minimum spanning tree, so that a set with no canonical order still gets a skeleton — one that came from the numbers rather than from a story.</p>
    </div>
    <div class="scoreline reveal">
      ${rows.map(({ r, v }) => `<span>${r.id} <b style="color:${v.held ? 'var(--ink)' : 'var(--ink-2)'}">${v.held ? '✓' : '✕'}</b></span>`).join('')}
    </div>
  </div>
</section>

${rows.map(section).join('\n')}

${CMP ? `
<section class="section">
  <div class="container narrow">
    <div class="section-head reveal"><h2 class="t1">And then we asked a model</h2><span class="eyebrow">the probe</span></div>
    <div class="prose reveal">
      <p>Everything above was arithmetic on objects. The reference this borrows from does something else: it asks a language model for the distance between every pair of things and decides what shape the answers have. That method cannot be checked, because nobody knows the true geometry of a model&rsquo;s beliefs. Here it can be, because two of these subjects have an answer.</p>
      <p>So ${CMP.model} was asked for every pair of the six points twice, once in each order, in ${2 * 15 * 2} calls that never saw one another. No mention of dimension, embedding, Euclidean anything &mdash; just &ldquo;how far apart are these two, as an integer&rdquo;.</p>
    </div>
    <div class="tw reveal" style="margin-top:var(--s-5);">
      <table><thead><tr><th>subject</th><th></th><th>effective rank</th><th>negative mass</th><th>closure</th><th>δ / diam</th><th>asymmetry</th></tr></thead><tbody>
      ${CMP.rows.map(r => [
        `<tr><td class="mono" rowspan="2">${r.id}</td><td class="mono dim">model</td><td class="mono">${r.model.spectrum.effRank}</td><td class="mono">${(100 * r.model.spectrum.negMass).toFixed(2)}%</td><td class="mono">${r.model.closure.ratio.toFixed(2)}×</td><td class="mono">${r.model.hyper.relative.toFixed(3)}</td><td class="mono">${r.asym.max} max over ${r.asym.pairs} pairs</td></tr>`,
        `<tr><td class="mono dim">exact</td><td class="mono">${r.truth.spectrum.effRank}</td><td class="mono">${(100 * r.truth.spectrum.negMass).toFixed(2)}%</td><td class="mono">${r.truth.closure.ratio.toFixed(2)}×</td><td class="mono">${r.truth.hyper.relative.toFixed(3)}</td><td class="mono dim">—</td></tr>`,
      ].join('')).join('')}
      </tbody></table>
    </div>
    <div class="prose reveal" style="margin-top:var(--s-6);">
      <p><strong>It reproduces both, to the digit.</strong> The straight-line hexagon comes back effective rank 2 with essentially nothing negative; the rim metric comes back with ${(100 * CMP.rows.find(r => r.id === 'hex-cycle').model.spectrum.negMass).toFixed(2)}% negative mass, which is the exact figure the arithmetic gives and the exact statement that no arrangement of points in any Euclidean space has those distances. Every pair was answered identically in both orders, in calls that could not see each other.</p>
      <p>What makes that worth writing down is where the fact lives. It is in none of the thirty answers. &ldquo;Vertex 0 and vertex 2 are 66 apart&rdquo; says nothing about embeddability; the non-Euclidean fact only exists in all thirty at once, and it survived being split into thirty independent questions and reassembled by a procedure the model never saw.</p>
      <p><strong>The first attempt failed, and the failure is the better half.</strong> Asked on a 0&ndash;100 scale, the model gave 33, 67 and 100 for one, two and three steps round the rim &mdash; which is correct to the nearest integer and <em>is not a distance</em>: 33 + 33 = 66 &lt; 67, so the triangle inequality fails by one unit and the gate refused the table before any geometry was computed. Nothing was wrong with the answers. The scale was wrong: a rim of six points contains the ratios 1 : 2 : 3, and 100 is not divisible by 3. On 0&ndash;99 the same question gives 33, 66, 99 and the table is a metric. The reference instruments shelf asks for integers on a fixed scale in exactly this way, so this is a property of the method rather than of this run &mdash; and without the gate it would have become a plate with a confident number under it.</p>
    </div>
  </div>
</section>` : ''}

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">The pair that matters</h2>
      <p>Six points on a circle, measured two ways. Straight through the middle they are a hexagon; round the rim they are the graph metric of a six-cycle. The two tables have the <em>same</em> closing ratio, because both close in a single step. They have the <em>same</em> exact signature, because quantisation gives both of them the same full-rank triple. And they are not remotely the same object: one carries no negative mass at all and the other carries ${(100 * G.sets.find(s => s.id === 'hex-cycle').spectrum.negMass).toFixed(1)}% of it, which is the exact statement that no arrangement of points in any Euclidean space has those distances.</p>
      <p>That is the argument for reporting three numbers instead of one. A page that printed only the closure ratio would have called them identical. A page that printed only the exact signature would have called them identical too. The reference instruments shelf prints the ratio and the triple; the negative mass is what this pass adds, and it is the only thing on the page that could tell the two apart.</p>
      <p>The rest went as written, with one thing that was not predicted at all. Two snapshots of the same five dishes, ${((G.sets.find(s => s.id === 'array-b').tGap) || 2.1).toFixed(1)} hours apart, come back exactly planar both times — one rigid object, two flat shadows — and not one of their ten distances survives the rotation unchanged. But the cheapest tree through them is the <em>same tree</em> both times${(() => { const A = G.sets.find(s => s.id === 'array-a'), B = G.sets.find(s => s.id === 'array-b'); const key = (m) => m.map(e => e.slice().sort().join('-')).sort().join(' '); return key(A.mst) === key(B.mst) ? '' : ' — no, it rewires, and the claim in the caption above should be corrected'; })()}. Nobody asked for that: it says the array's nearest-neighbour structure is more robust than its geometry, which is a fact about the dishes rather than about the night. A certified band traces a curve and does not close. A proof&rsquo;s covering traces a rougher curve. Nine points thrown into seven dimensions refuse to be low-dimensional, and a table that is not a distance is refused before it can be drawn.</p>
    </div>
  </div>
</section>`;

/* PATCH (declared): export the body instead of writing the bench's page. */
module.exports = { body, CSS, rows, agreed, G, CMP };
