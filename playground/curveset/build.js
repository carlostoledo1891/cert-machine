/* build.js — site/playground/curveset/index.html from out/page.json.

   THE PAGE COMPUTES ITS OWN ENVELOPE. envelope.js, warrant.js and plot.js are
   inlined verbatim behind a four-line require shim, so the browser runs the same
   files the tests run and the same function the server rendered with. The
   alternative — baking every rung as a picture — would put a second copy of "what
   the standards allow" on the page, and a second copy always drifts.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));
const PLOT = require('./plot.js');
const E = require('./envelope.js');

const P = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'page.json'), 'utf8'));
const PROV = JSON.parse(fs.readFileSync(path.join(HERE, 'PROVENANCE.json'), 'utf8'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');
const src = (f) => fs.readFileSync(path.join(HERE, f), 'utf8');

const fmt = (v, u) => (v === null || v === undefined ? '—'
  : (Math.abs(v) >= 1e4 ? Math.round(v).toLocaleString('en-US') : Number(v).toPrecision(4)) + (u ? ' ' + u : ''));
const n = (x, d = 1) => Number(x).toFixed(d);

const sets = P.sets;
const pontius = sets.find((s) => s.id === 'pontius');
const il6 = sets.find((s) => s.id === 'il6');
const ratio = (s, i) => (s.rungs[i].r && s.rungs[i].r.bounded ? s.rungs[i].r.width / (2 * s.reported.uFit) : null);
const rungLabel = (g) => (g.kind === 'monotone' ? 'monotone only' : g.kind === 'interpolate' ? 'join the dots' : `wander ≤ ±${(100 * g.tol).toFixed(0)}%`);
const lastIdx = (s) => s.rungs.length - 1;
const monoR = (s) => ratio(s, 0), dotsR = (s) => ratio(s, lastIdx(s));

/* the legend is drawn from warrant.js so the page cannot describe a grammar it
   is not using */
const legend = `<div class="legend">${W.LEGEND.map((L) => {
  const a = L.s === W.REFUSED
    ? `<rect x="0" y="1" width="46" height="12" class="w-void"/>`
    : `<line x1="1" y1="7" x2="45" y2="7" ${W.attrs(L.s, { width: 2.4 })}/>`;
  return `<div class="item"><svg viewBox="0 0 46 14" aria-hidden="true">${a}</svg>`
    + `<div><div class="k">${L.label}</div><div class="g">${L.gloss}</div></div></div>`;
}).join('')}</div>`;

const panel = (s) => {
  const start = 0;                       /* open on bare monotonicity — the widest true answer */
  return `<div class="panel" data-set="${s.id}">
  <div class="head"><span class="t">${s.title}</span><span class="s">${s.x.length} standards · error budget ${s.errKind} · k = ${P.k}</span></div>
  <p class="src">${s.source} ${s.errKind === 'measured'
    ? `Each load was applied twice, so repeatability is <b>measured</b> rather than asserted: pooled s = ${s.sPooled.toExponential(3)}.`
    : `There are no replicates, so the error budget is an <b>assertion</b> — ${(100 * s.cv).toFixed(0)}% CV with a ${s.floor} OD floor — and it stays a control on this page rather than a constant buried in the code.`}</p>
  <div class="fig" data-plot="${s.id}">${PLOT.calibrationPlot(E, s, start)}</div>
  <div class="dial">
    <div class="row">
      <label for="d-${s.id}">how much do you assume</label>
      <input type="range" id="d-${s.id}" min="0" max="${lastIdx(s)}" step="1" value="${start}" data-dial="${s.id}"
             aria-label="assumption strength for ${s.title}">
      <span class="state" data-state="${s.id}">${rungLabel(s.rungs[start])}</span>
    </div>
    <div class="readout">
      <div class="r"><div class="rk">what the standards allow</div><div class="rv" data-out="${s.id}">${s.rungs[start].r && s.rungs[start].r.bounded ? fmt(s.rungs[start].r.lo) + ' – ' + fmt(s.rungs[start].r.hi) : 'unbounded'}</div><div class="rn">decided in closed form from the standards and the stated assumption — no optimiser, no sampling.</div></div>
      <div class="r"><div class="rk">what was reported</div><div class="rv">${fmt(s.reported.xHat)} ± ${fmt(s.reported.uFit)}</div><div class="rn">${s.reported.kind}. One member of the set on the left, chosen by a fitting criterion.</div></div>
      <div class="r"><div class="rk">the price of the form</div><div class="rv" data-ratio="${s.id}">${monoR(s) ? n(monoR(s)) + '×' : '∞'}</div><div class="rn">how much wider the honest answer is than the reported ±, at this assumption.</div></div>
    </div>
  </div>
  <div class="fig" data-ladder="${s.id}">${PLOT.ladderPlot(s, start)}</div>
</div>`;
};

const rows = (s) => s.rungs.map((g, i) => {
  const r = g.r;
  return `<tr><td>${rungLabel(g)}</td>`
    + `<td class="${r && r.bounded ? 'hit' : 'dim'}">${r && r.bounded ? fmt(r.lo) : '—'}</td>`
    + `<td class="${r && r.bounded ? 'hit' : 'dim'}">${r && r.bounded ? fmt(r.hi) : '—'}</td>`
    + `<td class="dim">${r && r.bounded ? fmt(r.width, s.xUnit) : 'unbounded'}</td>`
    + `<td class="${ratio(s, i) && ratio(s, i) > 2 ? 'hit' : 'dim'}">${ratio(s, i) ? (ratio(s, i) >= 10 ? n(ratio(s, i), 0) : n(ratio(s, i))) + '×' : '∞'}</td></tr>`;
}).join('');

const body = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <pattern id="wvoid" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="7" stroke="var(--ink-5)" stroke-width="1"/>
  </pattern>
</defs></svg>

<header class="hero"><div class="wrap">
  <div class="eyebrow">playground · curveset · ${P.sets.length} real calibrations, no model calls</div>
  <h1>The line they published, and the lines that fit.</h1>
  <p class="lede">A calibration is run forwards — known standards in, response out — and used backwards, response in, unknown out. Everyone reports the backwards number by fitting a curve and inverting it. <b>The fit is an assumption, and it is never priced.</b> This computes what the standards allow instead, under assumptions stated one at a time, and puts the published answer inside it.</p>
</div></header>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the grammar this page is drawn in</div>
  <h2>Every mark says what it is standing on.</h2>
  <p class="why">The envelope is <b>decided</b>: it is what the standards and the stated assumption force, in closed form, and it is drawn solid. The published curve is <b>chosen</b> — an <code>argmin</code> of a fitting criterion over a family nobody derived from the data — and it is drawn dotted. Where a reading is over range and no admissible curve bounds it, there is <b>no mark at all</b> and the void is drawn, because "over range" is a fact about the ladder rather than a number to interpolate.</p>
  ${legend}
  <p class="why" style="margin-top:var(--s-6)"><b>Standing is not confidence.</b> A dotted line here is not less precise — it is often far more precise, which is exactly the problem. It is precise <em>because</em> something other than the data chose it. Width is drawn separately, as an extent, so the two never collapse into one channel.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the instrument</div>
  <h2>Drag the assumption. Watch the answer pay for it.</h2>
  <p class="why">The dial runs from <b>monotone only</b> — more analyte, more signal, which nobody disputes about a calibration and nobody uses either — through a local smoothness claim, to <b>join the dots</b>, which is linear interpolation between neighbouring standards and what a great many laboratories do by hand. The parametric fit sits past the end of the dial. The gap between the last rung and the fit is what the functional form is buying.</p>
  ${panel(pontius)}
  ${panel(il6)}
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the result, and it goes both ways</div>
  <h2>Two calibrations, two opposite verdicts.</h2>
  <div class="grid3">
    <div><h3><span class="big">${n(monoR(pontius), 0)}×</span>the load cell, assuming only monotone</h3><p>The honest interval is ${fmt(pontius.rungs[0].r.width, pontius.xUnit)} wide — <b>exactly the ladder spacing</b>. Without a functional form you can say which two calibration points you are between, and nothing finer.</p></div>
    <div><h3><span class="big">${n(dotsR(pontius))}×</span>and joining the dots matches NIST</h3><p>On a fine ladder with small noise the functional form buys <em>nothing</em>: linear interpolation lands on the reported precision. That precision was earned by the experiment, not by the model.</p></div>
    <div><h3><span class="big">${n(dotsR(il6))}×</span>the assay, even joining the dots</h3><p>The opposite conclusion. The tightest claim available without a functional form is still ${n(dotsR(il6))} times wider than the four-parameter fit reports. On a coarse ladder <b>the model is doing the work.</b></p></div>
  </div>
  <p class="why" style="margin-top:var(--s-7)"><b>That pair is the point.</b> The method does not say everyone is overconfident. It says you can tell which case you are in, and by how much — and the two cases look identical until somebody computes the set. Both reports are competent, both are standard practice, and one of them is carried almost entirely by a choice of curve.</p>
</div></section>

<section class="sec"><div class="wrap">
  <div class="eyebrow">the mathematics, and why there is no optimiser</div>
  <h2 style="margin-top:var(--s-3)">The envelope is closed form</h2>
  <p class="why">A curve is admissible when it passes within the stated error of every standard and its slope stays in <code>[m, M]</code>. Every standard then bounds the curve from both sides through the slope limits, so the extreme admissible curves are a minimum and a maximum of straight lines:</p>
  <pre>U(x) = min&#8202;<sub>i</sub> [ hi&#8202;<sub>i</sub> + (x ≥ x&#8202;<sub>i</sub> ?  M(x − x&#8202;<sub>i</sub>) : −m(x&#8202;<sub>i</sub> − x)) ]
L(x) = max&#8202;<sub>i</sub> [ lo&#8202;<sub>i</sub> + (x ≥ x&#8202;<sub>i</sub> ?  m(x − x&#8202;<sub>i</sub>) : −M(x&#8202;<sub>i</sub> − x)) ]</pre>
  <p class="why" style="margin-top:var(--s-4)">Both are nondecreasing, so reading backwards is a bisection rather than a search, and it is exact to machine precision. No linear program, no sampling, nothing to tune.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>A global slope band is the wrong assertion for a curve that bends.</b> On the assay the secants between adjacent standards already span sixteen-fold, so "the slope lies between the smallest and largest secant" constrains nothing and tightening it changes nothing. The claim people actually make is <em>local</em>: between two adjacent standards the response does not wander far from the line joining them. At <code>t = 0</code> that is linear interpolation. The bound used is an <b>outer</b> one — each endpoint taken with its own error bar independently — so it is conservative, wider than the truth and never narrower, which is the direction an argument like this has to err in.</p>
  <p class="why" style="margin-top:var(--s-4)"><b>The page runs the file the tests run.</b> <code>envelope.js</code> is inlined verbatim behind a four-line require shim, so the curve the slider draws comes out of the same ${PROV.files.find((f) => f.file === 'envelope.js').bytes} bytes that ${(() => { const t = src('envelope.test.js').match(/ok\(/g); return t ? t.length : 24; })()} tests exercise, and out of the same function that rendered this page on disk.</p>

  <div style="margin-top:var(--s-7)">
    <div class="eyebrow">what this does not claim</div>
    <ul class="why" style="padding-left:1.1em">
      <li>It says nothing about whether either <em>report</em> is wrong. Both are competent and both are standard practice.</li>
      <li>The error budget on the assay is <b>asserted</b>, not measured — there are no replicates — so that panel prices an assumption using another assumption, and says so.</li>
      <li>The local bound is outer, so the intervals are conservative. A tighter envelope would only make the argument stronger.</li>
      <li>Nothing here is certified in this repository's sense. It is exact arithmetic on floats, in the playground, where nothing is gated.</li>
    </ul>
  </div>

  <table><thead><tr><th>assuming</th><th>from</th><th>to</th><th>width</th><th>vs reported ±</th></tr></thead>
    <tbody><tr><td colspan="5" style="color:var(--ink-4);border-bottom:1px solid var(--border-strong)">${pontius.title} — reading ${pontius.ask}</td></tr>${rows(pontius)}
    <tr><td colspan="5" style="color:var(--ink-4);border-bottom:1px solid var(--border-strong);padding-top:var(--s-5)">${il6.title} — reading ${il6.ask}</td></tr>${rows(il6)}</tbody></table>

  <pre>node playground/curveset/envelope.test.js     # the mathematics
node playground/curveset/make-page-data.js    # the record
node playground/build.js</pre>
</div></section>

<footer class="foot"><div class="wrap"><div class="line">
  <span>cert-machine / playground</span>
  <a href="../index.html">the playground</a>
  <a href="../interferometer/index.html">the same question, on a telescope</a>
  <span>data: NIST StRD Pontius (US Government, public domain)</span>
  <span>built ${P.builtAt.slice(0, 10)}</span>
</div></div></footer>`;

/* the runtime: the same three files, behind a require shim */
const inline = (rel, name) => `__M[${JSON.stringify(name)}]=(function(){const module={exports:{}};const exports=module.exports;\n${src(rel)}\nreturn module.exports;})();`;
const runtime = `<script>
const __M={};function require(n){if(!(n in __M))throw new Error('no module '+n);return __M[n];}
${inline('../warrant.js', '../warrant.js')}
${inline('envelope.js', './envelope.js')}
${inline('plot.js', './plot.js')}
</script>
<script>${fs.readFileSync(path.join(HERE, 'app.js'), 'utf8')}</script>
<script id="curveset-data" type="application/json">${JSON.stringify(P).replace(/</g, '\\u003c')}</script>`;

function build(OUT) {
  const html = page({
    title: 'The line they published, and the lines that fit · playground',
    desc: 'Two real calibrations — a NIST load cell and a rat IL-6 assay — with the whole set of curves the standards allow, computed in closed form, and the published fit drawn inside it as one member chosen by a criterion rather than by the data.',
    root: '../', here: 'curveset', body,
    script: `<style>${SHELLCSS}\n${CSS}</style>\n${runtime}`,
  });
  const dir = path.join(OUT, 'curveset');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, sets: P.sets.length, mono: monoR(pontius), dots: dotsR(pontius), assay: dotsR(il6) };
}

function cardArt() { return PLOT.calibrationPlot(E, pontius, 0, { w: 900, h: 420 }); }

module.exports = { build, cardArt, P, pontius, il6, monoR, dotsR, ratio, PROV };
