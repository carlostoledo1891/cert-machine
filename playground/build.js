#!/usr/bin/env node
/* build.js — the whole of /playground, into site/instruments/.
   node playground/build.js

   WHAT THIS DOES NOT DO, deliberately. It does not call tools/build-site.js and
   is not called by it. None of this repository's gates apply here: no scope
   line, no certificate table that must agree with disk, no stale-claim sweep.
   Those gates exist because those pages make claims. This place makes none —
   nothing under /instruments is certified and every page here says so out loud.

   What it still does is read. Every number on these pages comes out of a record
   in this folder, and every record comes out of running the code beside it.
   Freedom from ceremony is not freedom from arithmetic.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const HERE = __dirname;
const ROOT = path.join(HERE, '..');
const OUT = path.join(ROOT, 'site', 'instruments');
const { page } = require(path.join(HERE, 'design', 'shell.js'));
const { uvSVG } = require(path.join(HERE, 'uv-art.js'));
const SIMPLEX = require(path.join(HERE, 'simplex', 'build.js'));
const NG = require(path.join(HERE, 'neural-geometry', 'build.js'));
const SH = require(path.join(HERE, 'shape-hunt', 'build.js'));
const CS = require(path.join(HERE, 'curveset', 'build.js'));
const W = require(path.join(HERE, 'warrant.js'));
const PL = require(path.join(HERE, 'plates', 'build.js'));
const XG = require(path.join(HERE, 'exact-geometry', 'build.js'));
const AS = require(path.join(HERE, 'answer-shape', 'build.js'));
const AF = require(path.join(HERE, 'affect', 'build.js'));
/* the affect card's numbers, read out of the record rather than typed. A card
   that repeats a page's figures by hand is a second copy, and a second copy
   drifts. */
const AFX = (() => {
  const M = AF.M, ids = M.models.map((m) => m.id);
  const cx = ids.map((id) => M.circumplex['neutral|' + id]);
  const cell = ids.map((id) => M.cells['neutral|affect|' + id]);
  /* the control's own movement: the shape gap the twelve clock hours pick up
     under a mood, which by construction should be nothing */
  const clock = Object.keys(M.effects)
    .filter((k) => /\|clock\|/.test(k) && !/^neutral\|/.test(k))
    .map((k) => M.effects[k].gap)
    .filter((g) => typeof g === 'number');
  return {
    rx: cx.map((c) => c.rx), ang: cx.map((c) => c.leadingAxisAngle),
    rank: cell.map((c) => c.spectrum.effRank), neg: cell.map((c) => c.spectrum.negMass),
    worstClock: clock.length ? Math.round(100 * Math.max(...clock)) : null,
  };
})();

const n = (x, d = 2) => Number(x).toFixed(d);
const fmt = (x) => Number(x).toLocaleString('en-US');

/* ---- the interferometer's own records, read not retyped ------------------ */
const IFM = path.join(HERE, 'interferometer');
const D = JSON.parse(fs.readFileSync(path.join(IFM, 'out', 'page-data.json'), 'utf8'));
const M = D.meta;
const SWEEP = (() => { try { return JSON.parse(fs.readFileSync(path.join(IFM, 'out', 'cp-sweep.json'), 'utf8')); } catch (e) { return null; } })();
const worst = SWEEP ? Math.max(...SWEEP.rows.map(r => r.ratio)) : null;
const best = SWEEP ? Math.min(...SWEEP.rows.map(r => r.ratio)) : null;

const BEST_NIGHT = path.join(IFM, 'data', 'L2V1_M87_2018_111_b3_hops_netcal_10s_StokesI.csv');
const UV = uvSVG(BEST_NIGHT, { size: 900 });

/* THE PLATE TAKES THE ART'S OWN ASPECT RATIO, read off the viewBox.
   Every plate was 4/3 and SEVEN OF THE NINE arts are square, so each of those
   was letterboxed into 75% of the width — a drawing floating in a dark box,
   which is what "full black charts" looks like from the outside. Measured
   before the change: the arts filled between 52% and 131% of their plate.
   Nothing here knows which instrument it is drawing; it reads the number the
   art already declares. */
function plate(art, scaleLabel) {
  /* An art whose viewBox is not square is CROPPED to the square plate instead
     of letterboxed into it — 'slice' fills the box and takes the overflow off
     the long edge, which is what a thumbnail does. Letterboxing is what made
     these read as black boxes in the first place, and matching the plate to
     each art instead made the grid ragged: a half-height card looks broken. */
  /* wide arts are LETTERBOXED into the square, never cropped — a figure is not
     a photograph and its edges carry the argument. The plate has no fill, so
     the band above and below reads as the page. */
  return '<div class="plate">' + art
    + (scaleLabel ? '<span class="uv-scale">' + scaleLabel + '</span>' : '') + '</div>';
}

/* ---- the page ------------------------------------------------------------ */
const CSS = fs.readFileSync(path.join(HERE, 'index.css'), 'utf8');

/* the neural-geometry headlines, averaged over the models rather than picked */
const ngSet = (id) => NG.G.sets.find((s) => s.id === id);
const ngClose = (id) => n(ngSet(id).models.reduce((a, m) => a + m.closure.ratio, 0) / ngSet(id).models.length, 2);
const ngQ = [...new Set(ngSet('unrelated').models.map((m) => m.signature.q))].join('/');

const fact = (k, v, note) =>
  `<div class="f"><span class="fk">${k}</span><span class="fv">${v}</span>${note ? `<span class="fn">${note}</span>` : ''}</div>`;

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">cert-machine &middot; instruments</div>
  <h1>Nine instruments, and each one says what decides it.</h1>
  <p class="lede">This page used to open by saying that nothing here was certified. That was the wrong claim and it had stopped being true: two of these pages draw a certificate straight from the shelf the rest of the site gates, and five of them decide their headline number in exact integer or rational arithmetic. <b>What is true is that nothing here is gated</b> &mdash; no number on these pages has a certificate row the build checks, no page here can refuse a deploy, and none of them is covered by <code>make test</code>. That is a fact about ceremony, not about the mathematics, and the two are not the same thing.</p>
  <p class="lede" style="margin-top:var(--s-5)">So instead of one disclaimer at the door, <b>every card below says what backs its headline number</b>, in the same words the pages use: exact rationals, exact integers, a record from the certificate shelf, or floats. Where it is floats, the page says so beside the number rather than at the bottom.</p>
</div></header>

<section class="projects"><div class="wrap">
  <div class="count">
    <span class="eyebrow">the projects</span>
    <span class="eyebrow">nine, so far</span>
  </div>

  <div class="cards">
  <a class="card" href="shape-hunt/index.html">
    <figure class="card-art">
      ${plate(SH.cardArt(), `${fmt(SH.SHAPETESTS)} shape tests &middot; ${fmt(SH.PERMTESTS)} permutations`)}
    </figure>
    <div class="card-body">
      <h2>Nothing here is a perfect circle.</h2>
      <p class="sub">The elicited geometries look like they hold shapes &mdash; a pentagon here, four points on a circle there. So this looks exhaustively, at every triple and quadruple and five-subset of every set from every model, and then runs the identical search on the same numbers with the geometry shuffled out. Almost nothing survives that. What does is not a polygon &mdash; and for most of the sets the verdict is not a margin at all but a certificate in whole numbers that no such points exist.</p>
      <span class="go">read the hunt <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="interferometer/index.html">
    <figure class="card-art">
      ${plate(UV.svg, `longest baseline ${n(UV.maxUV, 2)} G&lambda;`)}
    </figure>
    <div class="card-body">
      <h2>Not the picture. The set of pictures.</h2>
      <p class="sub">The famous black-hole image is <em>one</em> sky chosen, by an imaging prior, from the infinitely many the data allow. This draws the set instead: ${D.members.length} skies fitted under deliberately different priors, agreement rendered as ink and disagreement as texture. One slider decides how much of the phase information the picture is allowed to use &mdash; and at zero the ring dissolves, because amplitudes alone cannot see where anything is.</p>
      <span class="go">open the instrument <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <!-- THE GRAMMAR, once, where the marks first appear. check-wiring refuses any
       page that draws a w-* mark without printing this: "a grammar nobody is
       told about is a decoration" was a comment in warrant.js for a week. -->
  <div class="wrap" style="margin-top:var(--s-8)">
    <div class="eyebrow">what the marks below mean</div>
    ${W.legendHtml({ exclude: [W.DECIDED] })}
  </div>

  <a class="card" href="curveset/index.html">
    <figure class="card-art">
      ${plate(CS.cardArt(), `${n(CS.monoR(CS.pontius), 0)}&times; the reported &plusmn;, assuming only monotone`)}
    </figure>
    <div class="card-body">
      <h2>The line they published, and the lines that fit.</h2>
      <p class="sub">A calibration is run forwards and used backwards, and the backwards number always comes off a fitted curve. The fit is an assumption and it is never priced. This computes what the standards allow instead &mdash; in closed form, no optimiser, no sampling &mdash; under assumptions you can dial one at a time, from <em>monotone only</em> to <em>join the dots</em>, with the parametric fit past the end of the dial.</p>
      <span class="go">turn the dial <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="plates/index.html">
    <figure class="card-art">
      ${plate(PL.cardArt(), `plate I of ${PL.counts.plates} &middot; n = 0 &hellip; 99 across mod 2, 5, 10, 100`)}
    </figure>
    <div class="card-body">
      <h2>Manifolds we are handed.</h2>
      <p class="sub">Their manifolds are <em>found</em> &mdash; pulled out of a working model and interpreted. These are <em>stated</em>: a rule, its parameters, and then a drawing. Two of the eight are not illustrations at all but certificates rendered at their own resolution, which is what a proof looks like when you stop reading it and start looking at it.</p>
      <span class="go">open the series <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="affect/index.html">
    <figure class="card-art">
      ${plate(AF.cardArt(), `twelve feelings, placed by pairwise questions alone`)}
    </figure>
    <div class="card-body">
      <h2>The geometry of feeling, and the control that catches it.</h2>
      <p class="sub">Twelve feelings, then the same twelve asked again under six moods &mdash; and twelve clock hours carried through the identical pipeline as a control that has no business moving. A mood effect that also moves the clock is not a mood effect. One model&rsquo;s clock moves anyway.</p>
      <span class="go">read the moods <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="answer-shape/index.html">
    <figure class="card-art">
      ${plate(AS.cardArt(), `every pair asked both ways round`)}
    </figure>
    <div class="card-body">
      <h2>The shape of an answer.</h2>
      <p class="sub">Ask how different two things are, one pair at a time, and you get a table of numbers. A table of distances is a shape &mdash; or it is not one, and the difference is decidable in exact integer arithmetic. Every pair is asked <em>both ways round</em>, so the asymmetry is measured rather than averaged away.</p>
      <span class="go">compare the three <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="neural-geometry/index.html">
    <figure class="card-art">
      ${plate(NG.cardArt(), `${NG.G.meta.calls} calls &middot; $${NG.G.meta.spent.toFixed(2)}`)}
    </figure>
    <div class="card-body">
      <h2>The shapes a model will admit to from the outside.</h2>
      <p class="sub">Goodfire finds circles and colour surfaces by opening the model and decomposing its activations, which needs the weights. This asks from outside instead &mdash; every pair, one integer, one row at a time &mdash; and then decides exactly what those answers can be. If the circle is real it should survive being asked about; a shape that lives only in the activations was never a shape the model uses.</p>
      <span class="go">read the plates <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="exact-geometry/index.html">
    <figure class="card-art">
      ${plate(XG.cardArt(), `${XG.n} sets whose shape is fixed by construction`)}
    </figure>
    <div class="card-body">
      <h2>Point it at something whose shape is already known.</h2>
      <p class="sub">Every other geometry page here asks a model for a table of dissimilarities and decides what shape the answers have. This one asks nothing. The prediction is written first, in the source, and never edited afterwards &mdash; which is the only thing that makes &ldquo;agreed&rdquo; mean anything.</p>
      <span class="go">read the controls <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="simplex/index.html">
    <figure class="card-art">
      ${plate(SIMPLEX.cardArt(), `${SIMPLEX.M.positions} positions`)}
    </figure>
    <div class="card-body">
      <h2>An attention row is a point. Nobody draws it that way.</h2>
      <p class="sub">Attention weights are nonnegative and sum to one, which makes a row a point in a simplex &mdash; and a bar chart throws that away. Focus is distance from the centre; concentration has contours; temperature is a path. One real row from a tiny GPT, in the room it actually lives in, with the one claim about it that is decided rather than drawn: sharpening must move the point toward a vertex, proved in exact rational arithmetic because consecutive values differ in the fourteenth decimal.</p>
      <span class="go">open the instrument <span class="arw">&rarr;</span></span>
    </div>
  </a>
  </div>
  <span>built ${new Date().toISOString().slice(0, 10)}</span>
</div></div></footer>
`;

const html = page({
  title: 'instruments · cert-machine',
  desc: 'Instruments made touchable. Nothing here is certified — that is the entire permission.',
  root: '', here: 'home', body,
  script: `<style>${CSS}</style>`,
});

/* ---- write ---------------------------------------------------------------- */
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);

/* the design assets the browser needs, copied rather than linked out of the
   repository: /instruments owns its look and cannot be restyled from elsewhere */
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
/* tokens.css is GENERATED from design/tokens.js — there is no source copy to
   drift from the palette, and it is the ONLY stylesheet a page links. base.css
   was retired in phase 2: 79 classes shipped to one page that used four. */
fs.mkdirSync(path.join(OUT, 'design'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'design', 'tokens.css'), require(path.join(ROOT, 'design', 'tokens.js')).instrumentsCss());
for (const f of ['inter-var.woff2', 'jetbrains-mono-var.woff2'])
  copy(path.join(HERE, 'assets', 'fonts', f), path.join(OUT, 'assets', 'fonts', f));

const ifm = require(path.join(IFM, 'build.js')).build(OUT);
const sx = SIMPLEX.build(OUT);
const ng = NG.build(OUT);
const sh = SH.build(OUT);
const cs = CS.build(OUT);
const pl = PL.build(OUT);
const xg = XG.build(OUT);
const as = AS.build(OUT);
const af = AF.build(OUT);

const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) { return 'unknown'; } })();
console.log(`site/instruments/index.html            ${(html.length / 1024).toFixed(0)} KB  ·  u–v art from ${fmt(UV.rows)} released rows, ${UV.baselines} baselines`);
console.log(`site/instruments/interferometer/       ${(ifm.bytes / 1024).toFixed(0)} KB  ·  ${ifm.members} members + ${ifm.extremes} extremes, ${fmt(ifm.K)} rows`
  + (ifm.bracket ? `, bracket ${n(100 * (ifm.bracket - 1), 0)}% over ${ifm.sweep} radii` : ''));
console.log(`site/instruments/simplex/            ${(sx.bytes / 1024).toFixed(0)} KB  ·  ${sx.checks}/${sx.checks} exact checks, ${sx.positions} positions, PR down to ${n(sx.endPR, 2)} at the far end`);
console.log(`site/instruments/neural-geometry/     ${(ng.bytes / 1024).toFixed(0)} KB  ·  ${ng.sets} sets × ${ng.models} models, ${ng.calls} calls, $${ng.spent.toFixed(2)}`);
console.log(`site/instruments/shape-hunt/         ${(sh.bytes / 1024).toFixed(0)} KB  ·  ${fmt(sh.tests)} shape tests over ${sh.cases} cases`);
console.log(`site/instruments/curveset/          ${(cs.bytes / 1024).toFixed(0)} KB  ·  ${cs.sets} calibrations · load cell ${n(cs.mono, 0)}× monotone, ${n(cs.dots, 1)}× joining the dots; assay ${n(cs.assay, 1)}×`);
console.log(`site/instruments/plates/            ${(pl.bytes / 1024).toFixed(0)} KB  ·  ${pl.plates} plates · ${fmt(pl.visibilities)} visibilities, ${pl.cells} certified cells, ${fmt(pl.bBoxes)} proof boxes`);
console.log(`site/instruments/exact-geometry/    ${(xg.bytes / 1024).toFixed(0)} KB  ·  ${xg.sets} sets whose shape is known, ${xg.agreed} predictions held, ${xg.refused} refused at the gate`);
console.log(`site/instruments/answer-shape/      ${(as.bytes / 1024).toFixed(0)} KB  ·  ${as.subjects} subjects × ${as.models} models, every pair both ways, $${as.spend.toFixed(2)}`);
console.log(`site/instruments/affect/            ${(af.bytes / 1024).toFixed(0)} KB  ·  ${af.moods} moods × ${af.models} models, clock hours as the control, $${af.spend.toFixed(2)}`);
console.log(`@ git ${git}`);
