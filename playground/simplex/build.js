/* build.js — site/playground/simplex/index.html, from out/decision.json.
   Every number is read from that record. Re-run decide.js and they all move.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));

const D = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'decision.json'), 'utf8'));
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const M = D.meta;
const n = (x, d) => Number(x).toFixed(d === undefined ? 3 : d);

if (!D.ok) throw new Error('simplex: the decision record is red — refusing to build a page on it');

const last = D.exact[D.exact.length - 1];
const endView = D.view[D.view.length - 1];
const chips = D.checks.map((c) => `<span class="chk ${c.ok ? 'ok' : ''}">${c.ok ? '✓' : '✗'} ${c.name}</span>`).join('');
const exactRows = D.exact.map((r) => `<tr><td>${r.beta}</td><td>${n(r.PR, 9)}</td><td>${n(r.S2, 9)}</td></tr>`).join('');

const body = `
<div class="stage">
  <div class="hd">
    <div class="eyebrow">instruments · attention geometry · ${M.positions} positions</div>
    <h1>An attention row is a point. Nobody draws it that way.</h1>
    <p>Attention weights are nonnegative and sum to one, so a row is <b>a point in a simplex</b> — and a bar chart throws that away. Here is one real row from a tiny GPT, drawn where it actually lives, with the one thing about it that is <b>decided rather than drawn</b>: sharpening the temperature must move the point toward a vertex, and that is proved in exact arithmetic.</p>
  </div>

  <div>
    <div class="panel">
      <span class="eyebrow">the whole simplex, affinely</span>
      <svg id="fan" viewBox="0 0 1000 1000" role="img" aria-label="The attention row plotted as a point in a 31-gon standing for the simplex, with its temperature path."></svg>
      <p class="cap"><b>The ${M.positions} vertices of the simplex, placed on a regular ${M.positions}-gon.</b> The point is Σ pᵢvᵢ — a linear map, so the uniform row lands dead centre and a row that attends to one position lands on that position. The solid trail is the part of the temperature sweep the decision covers; the dashed part is drawn only. Two different rows can project to the same dot and no contour drawn here would be true, so nothing is drawn here but the point, its trail, and the vertices it is heading for.</p>
      <div class="ctl">
        <label for="cBeta">inverse temperature</label>
        <input type="range" id="cBeta">
        <output id="cBetaOut"></output>
      </div>
      <div class="rd">
        <span><span class="k">β</span><span class="v" id="rBeta">—</span></span>
        <span><span class="k">effective positions (PR)</span><span class="v" id="rPR">—</span></span>
        <span><span class="k">largest weight</span><span class="v" id="rMax">—</span></span>
        <span><span class="k">entropy</span><span class="v" id="rH">—</span></span>
      </div>
      <div class="state" id="rState">—</div>
    </div>
  </div>

  <div>
    <div class="panel">
      <span class="eyebrow">one exact face, where the contours are true</span>
      <svg id="face" viewBox="0 0 620 620" role="img" aria-label="The row restricted to its three most-attended positions, on a triangle, with participation-ratio contours."></svg>
      <p class="cap"><b>Restrict the row to positions ${D.top3.join(', ')} and renormalise.</b> That is a real 2-face of the same simplex, in barycentric coordinates, where PR = 1/Σpᵢ² <em>is</em> 1/Σpᵢ² — so its level sets are circles and can be drawn honestly. The rings are labelled in effective positions: 3.00 at the centre, 1.00 at a corner.</p>
    </div>

    <div class="panel">
      <span class="eyebrow">the decision, and the two that must fail</span>
      <svg id="ladder" viewBox="0 0 620 320" role="img" aria-label="Participation ratio against inverse temperature: the real row descending, and two planted mutants failing to."></svg>
      <p class="cap"><b>PR against β on the decided grid.</b> The row descends strictly; the flat mutant sits at ${M.positions} forever and the (β−3)²·s mutant turns around, because its factor passes through zero. An instrument that cannot go red on those two is theatre.</p>
      <div class="checks">${chips}</div>
      <div style="margin-top:var(--s-5)"><button class="btn" id="sheetOpen">what is decided here</button></div>
    </div>
  </div>
</div>

<div class="sheet" id="sheet">
  <button class="btn close" id="sheetClose">close</button>
  <div class="inner">
    <h2>What is decided here, and what is only drawn</h2>
    <p>The object is one causal attention row — last query, layer 0, head 0 — from a tiny GPT at seed 0, frozen once, ${M.positions} positions. It is not trained on anything you care about and it is not a claim about how language models work. It is a real row, and the point of the page is what a real row looks like when you stop drawing it as bars.</p>

    <h3>Why a simplex is the right room for it</h3>
    <p>The weights are nonnegative and sum to one. That is the definition of the standard simplex Δ<sup>${M.positions - 1}</sup>, and it means every question about the row is a question about position: “this head is focused” means <em>far from the barycentre</em>, “it spreads” means <em>near it</em>, and “it sharpened” means <em>it moved toward a vertex</em>. Participation ratio, PR = 1/Σpᵢ², is the number of positions the row effectively attends to — ${M.positions} at the centre, 1 at a corner — and its level sets are spheres cut by the simplex, so concentration is a landscape rather than a statistic.</p>

    <h3>The decision</h3>
    <p>For the rational kernel w ∝ (1 + βs)<sup>${M.p}</sup>, PR strictly decreases across the grid, decided in exact arithmetic on BigInt fractions. That matters here and is not pedantry: consecutive values on this row differ in the fourteenth decimal place, and a float comparison of them decides nothing at all.</p>
    <table><thead><tr><th>β</th><th>PR (effective positions)</th><th>Σpᵢ² (the dual)</th></tr></thead><tbody>${exactRows}</tbody></table>
    <p>Every IEEE double is exactly a dyadic rational, so turning the frozen scores into fractions loses nothing — it is a change of representation, not a rounding.</p>

    <h3>The falsifiers</h3>
    <p>Two mutants are planted and must fail. Flat scores give PR = ${M.positions} at every β, exactly — no temperature sharpens a row that has nothing to sharpen. The scale (β−3)²·s passes through zero at β = 3, so its PR climbs back to ${M.positions} and descends again. Both are checked and both go red, which is the only reason to believe the green one.</p>

    <h3>What is drawn and not decided</h3>
    <p>Softmax is transcendental. Its curve here is ordinary floating point, calibrated against the source pack's own stored rows to ${D.checks.find((c) => /reproduces/.test(c.name)).detail} — close enough to trust for a picture and not close enough to call a proof. The sound interval enclosure of the softmax story exists in the lab this fixture came from and is not restated here as though we had re-derived it.</p>
    <p><b>And the honest proportion:</b> the decided grid runs to β = ${last.beta}, where the row still has ${n(last.PR, 2)} effective positions out of ${M.positions}. The dashed trail runs to β = ${M.viewMaxBeta}, where it reaches ${n(endView.PR, 2)} — a point essentially at a vertex. Almost the whole journey you can see is the part that is only drawn. The page says so with a dashed line rather than a footnote.</p>

    <h3>Provenance</h3>
    <p>The fixture is <code>fixtures/frozen_attn_scores.json</code> from the attention-geometry pack in this operator's own research tree, carried here with its sha256 — <code>${M.sha256.slice(0, 32)}…</code> — checked at every run, and <em>re-derived</em> rather than quoted: the softmax rows on this page are recomputed and then compared against the stored ones, which is the only version of “agrees with the source” worth anything. The concentration phenomenon itself is classical (majorization; Mattei &amp; Loureiro, Dabah &amp; Tirer). Nothing here claims otherwise. What is contributed is the room the row is drawn in, and the exact decision underneath it.</p>

    <h3>Rebuild it</h3>
    <pre>node playground/simplex/decide.js   # ${D.checks.length} checks, exact
node playground/build.js            # the pages</pre>
  </div>
</div>

<script id="sx-data" type="application/json">${JSON.stringify(D).replace(/</g, '\\u003c')}</script>`;

function build(OUT) {
  const html = page({
    title: 'An attention row is a point · instruments',
    desc: 'Attention weights sum to one, so a row is a point in a simplex. One real row from a tiny GPT, drawn where it lives, with its concentration decided in exact arithmetic.',
    root: '../', here: 'simplex', body,
    script: `<style>${CSS}</style>\n<script>${APP}</script>`,
  });
  const dir = path.join(OUT, 'simplex');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, checks: D.checks.length, positions: M.positions, endPR: endView.PR };
}

/* the card art for the gathering page: the same fan, small, with the trail —
   the whole point of the project in one mark. Generated from the same record. */
function cardArt(size = 900) {
  const N = M.positions, R = size * 0.372, c = size / 2;
  const vert = [];
  for (let i = 0; i < N; i++) {
    const th = -Math.PI / 2 + (2 * Math.PI * i) / N;
    vert.push([c + R * Math.cos(th), c + R * Math.sin(th)]);
  }
  const proj = (w) => {
    let x = 0, y = 0;
    for (let i = 0; i < N; i++) { x += w[i] * vert[i][0]; y += w[i] * vert[i][1]; }
    return x.toFixed(1) + ',' + y.toFixed(1);
  };
  const cut = D.view.findIndex((v) => !v.certified);
  const seg = (a, b) => D.view.slice(a, b).map((v, i) => (i ? 'L' : 'M') + proj(v.w)).join('');
  const dots = vert.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${D.top3.includes(i) ? 7 : 4}" class="sxv${D.top3.includes(i) ? ' hi' : ''}"/>`).join('');
  const end = D.view[D.view.length - 1];
  return `<svg class="sx" viewBox="0 0 ${size} ${size}" role="img" aria-label="One attention row plotted as a point in the simplex, with the path it takes as the temperature sharpens.">
  <circle cx="${c}" cy="${c}" r="${R.toFixed(1)}" class="sxhull"/>
  ${dots}
  <path d="${seg(0, cut < 0 ? D.view.length : cut + 1)}" class="sxtrail cert"/>
  ${cut >= 0 ? `<path d="${seg(cut, D.view.length)}" class="sxtrail ext"/>` : ''}
  <circle cx="${c}" cy="${c}" r="3" class="sxbary"/>
  <circle cx="${proj(end.w).split(',')[0]}" cy="${proj(end.w).split(',')[1]}" r="9" class="sxdot"/>
</svg>`;
}

module.exports = { build, cardArt, D, M };
