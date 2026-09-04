/* build-neural-geometry.js — render site/neural-geometry/index.html
   node experiments/neural-geometry/probe.js --live
   node experiments/neural-geometry/decide.js
   node tools/build-neural-geometry.js

   Three models, the same questions, the same arithmetic, drawn so the three can
   be held against each other. Nothing on the page is predicted and nothing is
   fitted: every number is a decision about a table of integers the models
   produced one call at a time. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
/* PATCH (declared in PROVENANCE.json): the bench shell is replaced by build.js
   in this repository's design system. */
const { plate, overlay, fieldPNG } = require(path.join(__dirname, 'plate.js'));
const { encodePNG } = require(path.join(__dirname, '..', 'png.js'));
const G = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'geometry.json'), 'utf8'));

const MODELS = G.models;
/* the prompts asked for "4 o'clock" and "the note C"; the plates have room for
   neither. Shortening happens here, never in sets.js — the question that was
   actually asked is not editable after the fact. */
const SHORT = (sub) => sub.items.map(x => String(x)
  .replace(/\s*o[\u2019']clock$/, '')          // the set writes a curly apostrophe
  .replace(/ sharp$/, '\u266f').replace(/ flat$/, '\u266d')
  .replace(/^domestic /, '').replace(/^(Arctic|African|spotted|striped) /, ''));
const S = (id) => G.subjects.find(s => s.id === id);
const pct = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
const calls = G.subjects.reduce((t, s) => t + s.n * (s.n - 1), 0) * MODELS.length;

/* ---------- marks -------------------------------------------------------- */
const triptych = (sub, size = 330) => `<div class="trip">${MODELS.map(M => {
  const r = sub.byModel[M.id];
  return `<figure><div class="art">${plate(r, { size, short: SHORT(sub) })}</div>
    <figcaption><span class="mname">${M.label}</span>${r.fits ? `<span class="fit">line ${pct(r.fits.line.resid)} · cycle ${pct(r.fits.cycle.resid)}</span>` : `<span class="fit">rank ${r.spectrum.effRank} · neg ${pct(r.spectrum.negMass)}</span>`}</figcaption></figure>`;
}).join('')}</div>`;

const fieldRow = (sub) => `<div class="fields">${MODELS.map(M => {
  const r = sub.byModel[M.id];
  /* the model's own table, which every number after it is a function of */
  const f = fieldPNG(r.D, encodePNG, { cell: Math.max(10, Math.round(150 / sub.n)) });
  return `<figure><img src="${f.uri}" alt="${M.label} distance table"><figcaption><span class="mname">${M.label}</span><span class="fit">max ${f.max}</span></figcaption></figure>`;
}).join('')}<figure class="wide"><img src="${fieldPNG(sub.cross, encodePNG, { cell: Math.max(10, Math.round(150 / sub.n)) }).uri}" alt="disagreement"><figcaption><span class="mname">spread across the three</span><span class="fit">max ${Math.max(...sub.cross.flat())}</span></figcaption></figure></div>`;

/* the gate, as a field: every cell is one model on one subject */
const gateGrid = () => {
  const worst = Math.max(...G.subjects.flatMap(s => MODELS.map(M => s.byModel[M.id].gate.badTriples / s.byModel[M.id].gate.totTriples)));
  return `<div class="gate"><div class="gh"></div>${MODELS.map(M => `<div class="gh">${M.label}</div>`).join('')}
  ${G.subjects.map(s => `<div class="gl">${s.id}</div>` + MODELS.map(M => {
    const g = s.byModel[M.id].gate, f = g.badTriples / g.totTriples;
    return `<div class="gc${g.ok ? ' ok' : ''}" style="--f:${(f / worst).toFixed(3)}">
      <span class="gv">${g.ok ? 'metric' : pct(f, 1)}</span>
      <span class="gs">${g.ok ? `contrast ${s.byModel[M.id].contrast.toFixed(1)}×` : `worst −${Math.abs(g.worstSlack)} (${pct(g.relSlack)} of max)`}</span></div>`;
  }).join('')).join('')}</div>`;
};

/* line against cycle, one bar each, for the sets that have an order */
const fitBars = () => {
  const ord = G.subjects.filter(s => s.order);
  return `<div class="bars">${ord.map(s => `<div class="bg">
    <div class="bl">${s.id}</div>
    ${MODELS.map(M => { const f = s.byModel[M.id].fits; return `<div class="brow">
      <span class="bm">${M.label}</span>
      <span class="bt">line</span><span class="btr"><i style="width:${(100 * Math.min(1, f.line.resid)).toFixed(1)}%"></i></span><span class="bv">${pct(f.line.resid)}</span>
      <span class="bt">cycle</span><span class="btr"><i style="width:${(100 * Math.min(1, f.cycle.resid)).toFixed(1)}%"></i></span><span class="bv">${pct(f.cycle.resid)}</span>
    </div>`; }).join('')}
  </div>`).join('')}</div>`;
};

/* ---------- the numbers that carry the argument -------------------------- */
const clock = S('clock'), digits = S('digits'), nons = S('nonsense'), chrom = S('chromatic');
const bestClock = MODELS.map(M => ({ M, v: clock.byModel[M.id].fits.cycle.resid })).sort((a, b) => a.v - b.v)[0];
const bestDigit = MODELS.map(M => ({ M, v: digits.byModel[M.id].fits.line.resid })).sort((a, b) => a.v - b.v)[0];
const metricPasses = G.subjects.flatMap(s => MODELS.filter(M => s.byModel[M.id].gate.ok).map(M => `${s.id}/${M.label}`));
const worstDigit = MODELS.map(M => ({ M, r: digits.byModel[M.id] })).sort((a, b) => b.r.fits.line.resid - a.r.fits.line.resid)[0];
/* how many of the raw answers land exactly on k·|i−j|, for the best k */
const exactLine = (r, n) => {
  const k = r.raw[0][n - 1] / (n - 1);
  let hit = 0, tot = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (i === j) continue; tot++; if (r.raw[i][j] === k * Math.abs(i - j)) hit++; }
  return { k, hit, tot };
};
const EL = exactLine(digits.byModel[bestDigit.M.id], digits.n);

const CSS = `
/* A grid track with a definite max is sized to that max and OVERFLOWS its
   container — only fr tracks flex. minmax(0,480px) beside a 1fr therefore
   held 480px on a 390px phone and pushed the document 78px sideways. One
   column until there is room for two. */
.ovsec { margin-top:var(--s-6); display:grid; grid-template-columns:minmax(0,1fr); gap:var(--s-6); align-items:start; }
@media (min-width:880px){ .ovsec { grid-template-columns:minmax(0,480px) minmax(0,1fr); } }
.trip { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--s-4); }
.fields { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:var(--s-4); }
@media (max-width:900px){ .trip,.fields{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:560px){ .trip,.fields{ grid-template-columns:1fr; } }
figure { margin:0; }
.art, .fields img { background:var(--bg-raised); border:1px solid var(--border); border-radius:var(--radius-m); padding:var(--s-2); display:block; width:100%; }
.fields img { padding:0; image-rendering:pixelated; aspect-ratio:1; object-fit:contain; }
figcaption { display:flex; justify-content:space-between; gap:var(--s-3); margin-top:6px; font-family:var(--font-mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
.mname { color:var(--ink-2); } .fit { color:var(--ink-5); text-transform:none; letter-spacing:.04em; }
svg.pl { width:100%; height:auto; display:block; border-radius:var(--radius-s); }
svg.pl .ch { stroke:#f6f6f8; }
svg.pl .ord { fill:none; stroke:#f6f6f8; stroke-opacity:.8; stroke-width:1.5; }
svg.pl .clo { fill:none; stroke:#f6f6f8; stroke-opacity:.9; stroke-width:1.5; stroke-dasharray:5 4; }
svg.pl .mst { fill:none; stroke:#f6f6f8; stroke-opacity:.55; stroke-width:1.2; }
svg.pl .pt { fill:#0a0a0c; stroke:#f6f6f8; stroke-width:1.2; }
svg.pl .pt.first { fill:#f6f6f8; }
svg.pl .lb { fill:var(--ink-3); font-family:var(--font-mono); font-size:8.5px; }
svg.pl .lb.first { fill:#f6f6f8; }
svg.pl .ov { fill:none; stroke:#f6f6f8; }
svg.pl .ov.m0 { stroke-opacity:.95; stroke-width:1.7; }
svg.pl .ov.m1 { stroke-opacity:.62; stroke-width:1.3; stroke-dasharray:6 4; }
svg.pl .ov.m2 { stroke-opacity:.42; stroke-width:1.1; stroke-dasharray:1.6 3.4; }
svg.pl .ovp { fill:#f6f6f8; }
svg.pl .ovp.m1 { fill-opacity:.62; } svg.pl .ovp.m2 { fill-opacity:.42; }
.gate { display:grid; grid-template-columns:120px repeat(3,minmax(0,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; }
.gh,.gl,.gc { background:var(--bg-raised); padding:var(--s-3) var(--s-4); font-family:var(--font-mono); font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-5); }
.gl { color:var(--ink-3); display:flex; align-items:center; }
.gc { background:color-mix(in srgb, #f6f6f8 calc(var(--f) * 15%), var(--bg-raised)); display:flex; flex-direction:column; gap:3px; }
.gc.ok { background:var(--bg-raised); box-shadow: inset 0 0 0 1px var(--ink-5); }
.gv { color:var(--ink); font-size:var(--text-small); letter-spacing:.02em; text-transform:none; font-variant-numeric:tabular-nums; }
.gs { color:var(--ink-5); text-transform:none; letter-spacing:.02em; font-size:9px; }
.bars { display:grid; gap:var(--s-4); }
.bg { border:1px solid var(--border); border-radius:var(--radius-m); background:var(--bg-raised); padding:var(--s-4); }
.bl { font-family:var(--font-mono); font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-4); margin-bottom:var(--s-3); }
.brow { display:grid; grid-template-columns:82px 30px 1fr 42px 34px 1fr 42px; gap:var(--s-3); align-items:center; font-family:var(--font-mono); font-size:9.5px; color:var(--ink-5); margin-top:5px; }
.bm { color:var(--ink-2); } .bt { color:var(--ink-4); }
.btr { height:4px; background:var(--surface-2); border-radius:2px; overflow:hidden; }
.btr i { display:block; height:100%; background:#f6f6f8; opacity:.72; }
.bv { color:var(--ink-3); text-align:right; font-variant-numeric:tabular-nums; }
.stats { display:grid; grid-template-columns:150px repeat(3,minmax(0,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; margin-top:var(--s-5); }
.stats div { background:var(--bg-raised); padding:6px var(--s-4); font-family:var(--font-mono); font-size:10px; color:var(--ink-2); font-variant-numeric:tabular-nums; }
.stats .h { color:var(--ink-5); font-size:9px; letter-spacing:.08em; text-transform:uppercase; }
.agree { display:grid; grid-template-columns:110px repeat(3,minmax(0,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-m); overflow:hidden; margin-top:var(--s-5); }
.agree div { background:var(--bg-raised); padding:var(--s-3) var(--s-4); font-family:var(--font-mono); font-size:var(--text-eyebrow); color:var(--ink-3); }
.agree .h { color:var(--ink-5); font-size:9px; letter-spacing:.12em; text-transform:uppercase; }
.subhead { display:flex; align-items:baseline; gap:var(--s-4); flex-wrap:wrap; }
.note { font-family:var(--font-mono); font-size:var(--text-eyebrow); line-height:1.75; color:var(--ink-4); background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-s); padding:var(--s-4); margin-top:var(--s-4); }
.note b { color:var(--ink-2); font-weight:500; }
.legend { display:flex; gap:var(--s-5); flex-wrap:wrap; font-family:var(--font-mono); font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-5); margin-top:var(--s-4); }
.legend i { display:inline-block; width:26px; height:0; border-top:2px solid #f6f6f8; vertical-align:middle; margin-right:7px; }
.legend .l1 i { opacity:.62; border-top-style:dashed; } .legend .l2 i { opacity:.42; border-top-style:dotted; }`;

const subjectSection = (sub, extra = '') => `
<section class="section">
  <div class="container">
    <div class="reveal subhead">
      <div>
        <div class="eyebrow">${sub.n} items · ${sub.n * (sub.n - 1)} calls per model · ${sub.order ? 'ordered' : 'no canonical order'}</div>
        <h2 class="t1" style="margin-top:var(--s-2); max-width:24ch;">${sub.title}</h2>
      </div>
    </div>
    <p class="lede reveal" style="margin-top:var(--s-4); max-width:70ch; font-size:var(--text-body); color:var(--ink-3);">${sub.note}</p>
    <div class="reveal" style="margin-top:var(--s-5);">${triptych(sub)}</div>
    ${extra}
    <div class="reveal" style="margin-top:var(--s-6);">
      <div class="eyebrow">the tables themselves, and where the three disagree</div>
      <div style="margin-top:var(--s-3);">${fieldRow(sub)}</div>
    </div>
    <div class="agree reveal">
      <div class="h">agreement</div>${sub.pairs.map(p => `<div class="h">${MODELS.find(m => m.id === p.a).label} · ${MODELS.find(m => m.id === p.b).label}</div>`).join('')}
      <div class="h">distances, r</div>${sub.pairs.map(p => `<div>${p.r.toFixed(2)}</div>`).join('')}
      <div class="h">shape gap</div>${sub.pairs.map(p => `<div>${p.gap === null ? '—' : pct(p.gap)}</div>`).join('')}
    </div>
  </div>
</section>`;

const overlaySection = (sub, tail = '') => `<div class="reveal ovsec">
  <div class="art">${overlay(MODELS.map(M => sub.byModel[M.id]), sub.items, sub.order, { short: SHORT(sub) })}</div>
  <div>
    <div class="eyebrow">all three on one frame</div>
    <p style="margin-top:var(--s-3); color:var(--ink-3); font-size:var(--text-body); line-height:1.7;">Each model's picture is its own; a table of distances fixes nothing about rotation, reflection or overall size, so putting three of them in one frame means removing exactly those freedoms and nothing else. What is left is disagreement about shape.${tail}</p>
    <div class="legend">${MODELS.map((M, k) => `<span class="l${k}"><i></i>${M.label}</span>`).join('')}</div>
    ${statTable(sub)}
  </div>
</div>`;

/* the numbers behind every plate, which otherwise appear nowhere */
const statTable = (sub) => `<div class="stats">
  <div class="h"></div>${MODELS.map(M => `<div class="h">${M.label}</div>`).join('')}
  ${[
    ['effective rank', M => sub.byModel[M.id].spectrum.effRank],
    ['negative mass', M => pct(sub.byModel[M.id].spectrum.negMass, 1)],
    ['exact signature', M => { const g = sub.byModel[M.id].signature; return `(${g.p}, ${g.q}, ${g.z})`; }],
    ['δ / diameter', M => sub.byModel[M.id].hyp.relative.toFixed(3)],
    ['contrast, max/min', M => sub.byModel[M.id].contrast.toFixed(1) + '×'],
    ['both orders differ by', M => pct(sub.byModel[M.id].asym.rel, 1) + ' of a distance'],
    ...(sub.order ? [['closing step', M => sub.byModel[M.id].closure.ratio.toFixed(2) + '× the median']] : []),
  ].map(([k, f]) => `<div class="h">${k}</div>${MODELS.map(M => `<div>${f(M)}</div>`).join('')}`).join('')}
</div>`;

const body = `
<header class="hero">
  <div class="container">
    <div class="eyebrow reveal">experiments · three models, one question at a time</div>
    <h1 class="display reveal" style="margin-top:var(--s-5); max-width:20ch;">The shape of an answer</h1>
    <p class="lede reveal" style="margin-top:var(--s-6); max-width:64ch;">Ask a model how far apart two things are and you get a number. Ask it about every pair, in separate calls that cannot see one another, and the numbers acquire a shape &mdash; a line, a circle, a tree, or nothing. This asks three models the same ${calls.toLocaleString()} questions about ${G.subjects.length} small worlds and draws what came back, with no fitting anywhere: every mark is a decision about a table of integers, taken in exact arithmetic.</p>
    <div class="hero-meta reveal">
      <span class="item"><span class="k">models</span><span class="v">${MODELS.length}</span></span>
      <span class="item"><span class="k">calls</span><span class="v">${calls.toLocaleString()}</span></span>
      <span class="item"><span class="k">answers</span><span class="v">integers, 0&ndash;${G.scale}</span></span>
      <span class="item"><span class="k">decisions</span><span class="v">exact rationals</span></span>
      ${G.spend ? `<span class="item"><span class="k">cost</span><span class="v">$${G.spend.reduce((t, s) => t + s.usd, 0).toFixed(2)}</span></span>` : ''}
    </div>
  </div>
</header>

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">What is asked, and what is never asked</h2>
      <p>Each pair is put twice, once in each direction, in two calls that never meet. Nothing in any prompt mentions geometry, dimension, circles or distance matrices &mdash; only &ldquo;how far apart are these two, as a single integer&rdquo;. A model that answers out of a structure has a reason to be consistent across ${calls.toLocaleString()} isolated questions; a model that answers out of a reflex does not, and the difference is measurable without asking either of them anything about itself.</p>
      <p>The two directions are then <em>added</em> rather than averaged, because the sum is an integer where the mean is a half, doubling a table changes no triangle inequality and no signature, and integers keep every later step in exact arithmetic. From there: the metric gate, the doubly-centred Gram matrix and its exact signature by symmetric congruence, the float spectrum beside it, and &mdash; where the items have an order &mdash; two one-parameter fits, a line and a circle, each with a single free scale so neither can flatter itself by having more knobs.</p>
      <p><strong>The scale is part of the experiment.</strong> Answers run 0&ndash;${G.scale}, not 0&ndash;100, because a cycle of six or twelve contains the ratios 1&nbsp;:&nbsp;2&nbsp;:&nbsp;3 and 100 is not divisible by 3 &mdash; on a 0&ndash;100 scale a model can be correct to the nearest integer and still hand back something that is not a distance, by one unit.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Same numerals, two frames</h2><span class="eyebrow">the experiment this was built for</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>The twelve hours of a clock and the ten digits are almost the same symbols, and they have opposite geometries. Eleven and one are neighbours; nine and one are eight apart. Nothing in either prompt says which frame is in play &mdash; only the phrase &ldquo;on a clock face&rdquo; or &ldquo;as digits&rdquo;. If a model is carrying the structure rather than a lookup of numeral similarity, the same numerals must come back as a circle in one and a line in the other.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${triptych(clock, 300)}</div>
    <div class="reveal" style="margin-top:var(--s-4);">${triptych(digits, 300)}</div>
    <div class="note reveal" style="max-width:78ch;">
<b>${bestClock.M.label}</b>  holds the twelve hours as a circle to ${pct(bestClock.v)} residual, and the ten digits as a line to ${pct(digits.byModel[bestClock.M.id].fits.line.resid)}.
<b>the line</b>   ${EL.hit === EL.tot ? `every one of ${bestDigit.M.label}'s ${EL.tot} digit answers is exactly ${EL.k}·|i−j| — 0, ${digits.byModel[bestDigit.M.id].raw[0].slice(1, 5).join(', ')}, … ${digits.byModel[bestDigit.M.id].raw[0][9]} — in ${EL.tot} calls that never saw each other, with not one exception.` : `closest is ${bestDigit.M.label} at ${pct(bestDigit.v)}; ${EL.hit} of ${EL.tot} answers land exactly on ${EL.k}·|i−j|.`}
<b>and note</b>   ${EL.k}·9 = ${EL.k * 9}, so it did not merely order the digits — it spread them across the whole of the 0–${G.scale} scale in exact proportion, one isolated answer at a time.
<b>and against</b> the same tables fit a circle at ${pct(digits.byModel[bestDigit.M.id].fits.cycle.resid)}, so the frame is not a tie being broken — it is the wrong shape by a wide margin.
<b>the weakest</b> ${worstDigit.M.label} gives ${worstDigit.r.fits.line.resid > 0.2 ? 'neither shape' : 'a rough line'} — its answers from zero read ${worstDigit.r.raw[0].join(', ')}, which is not monotone in the digit.
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Line, or circle</h2><span class="eyebrow">one free parameter each</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>For every set with an order, the same table is held against the two shapes it could have: <span class="mono">d&nbsp;&prop;&nbsp;|i&nbsp;&minus;&nbsp;j|</span> and <span class="mono">d&nbsp;&prop;&nbsp;min(|i&nbsp;&minus;&nbsp;j|,&nbsp;n&nbsp;&minus;&nbsp;|i&nbsp;&minus;&nbsp;j|)</span>. Each has exactly one free scale, fixed in closed form, so the residuals are comparable. Shorter is better.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${fitBars()}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><h2 class="t1">Where the triangle inequality fails</h2><span class="eyebrow">the gate, as a measurement</span></div>
    <div class="prose reveal" style="max-width:70ch;">
      <p>A table of distances must satisfy <span class="mono">d(a,c) &le; d(a,b) + d(b,c)</span> for every triple, or no arrangement of points in any space has those distances. Each cell below is one model on one world: the share of triples that break, and by how much against the largest distance that model was willing to name.</p>
    </div>
    <div class="reveal" style="margin-top:var(--s-5);">${gateGrid()}</div>
    <div class="note reveal" style="max-width:78ch;">
<b>passes</b>     ${metricPasses.join(', ')} — ${metricPasses.length} of ${G.subjects.length * MODELS.length}
<b>and yet</b>    the set every model turns into a metric space is the one with no structure in it. Its distances all sit within a factor of ${Math.max(...MODELS.map(M => nons.byModel[M.id].contrast)).toFixed(1)}, and any table whose values lie within a factor of two is a metric for free: two of them can never fall short of the third.
<b>so</b>         passing this gate is not a compliment. It is what a model produces when it has nothing to say and answers &ldquo;very different&rdquo; ${nons.n * (nons.n - 1)} times.
<b>the failures</b> are not rounding. The worst triple in ${chrom.title} misses by ${pct(Math.max(...MODELS.map(M => chrom.byModel[M.id].gate.relSlack)))} of the whole scale.
    </div>
    <div class="prose reveal" style="max-width:70ch; margin-top:var(--s-6);">
      <p>The gate is reported here rather than enforced. Classical scaling is defined on any symmetric table with a zero diagonal, and the negative mass beside each plate already says how far from Euclidean it is; refusing to draw would discard the more interesting fact, which is that <strong>the triangle inequality fails almost exactly where a model knows something</strong>. Structure is what produces the near-zero distances that let a triangle break. Flatness is what protects it.</p>
    </div>
  </div>
</section>

${subjectSection(S('weekdays'), overlaySection(S('weekdays')))}
${subjectSection(S('chromatic'), overlaySection(S('chromatic')))}
${subjectSection(S('hues'), overlaySection(S('hues')))}
${subjectSection(S('carnivores'), overlaySection(S('carnivores')))}
${subjectSection(S('nonsense'), overlaySection(S('nonsense'), ' Here there is nothing else: seven words with no relation to each other and no relation for the models to agree about, so the three frames fall on top of one another only by accident.'))}

<section class="section">
  <div class="container narrow">
    <div class="prose reveal">
      <h2 class="t2">What this can and cannot say</h2>
      <p>It cannot say a model &ldquo;represents&rdquo; the week as a circle. Nothing here opens a model or reads a weight; the only evidence is what came back through the same interface anyone else has, and a shape in the answers is a fact about the answers.</p>
      <p>What it can say is sharper than it looks, because the facts on this page live in <em>no single answer</em>. &ldquo;Eleven and one are 22 apart&rdquo; carries no information about a circle. The circle exists only in ${clock.n * (clock.n - 1)} answers at once, and it survived being cut into ${clock.n * (clock.n - 1)} independent questions and reassembled by arithmetic no model saw. A model that produced these numbers one at a time, without memory between calls, and reconstructed a ${pct(bestClock.v)}-residual circle, was consulting something with that shape in it.</p>
      <p>The decisions are exact. Symmetrised tables are integers, the Gram matrix is built in rational arithmetic, the signature comes from symmetric congruence rather than an eigensolver, and the two shape fits have one parameter each. There is no threshold anywhere that was chosen after seeing the results. The float spectrum is printed beside the exact signature for the reason it always must be: an exact signature is infinitely sensitive, and a single unit of quantisation turns a rank-one table full-rank without changing anything anyone would care about.</p>
      <h2 class="t2" style="margin-top:var(--s-7);">Reproduce</h2>
      <p class="mono" style="font-size:var(--text-eyebrow); color:var(--ink-4); line-height:2;">node experiments/neural-geometry/probe.js --live<br>node experiments/neural-geometry/decide.js<br>node tools/build-neural-geometry.js</p>
      <p>Without <span class="mono">--live</span> the probe touches no network and prints the prompts it would send. ${G.spend ? `The run behind this page cost $${G.spend.reduce((t, s) => t + s.usd, 0).toFixed(2)}: ${G.spend.map(s => `${s.label} $${s.usd.toFixed(2)}`).join(', ')}.` : ''}</p>
    </div>
  </div>
</section>`;

/* PATCH (declared): export the body instead of writing the bench's page. */
module.exports = { body, CSS, G };
