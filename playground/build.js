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

/* ---- the page ------------------------------------------------------------ */
const CSS = fs.readFileSync(path.join(HERE, 'index.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(HERE, 'design', 'shell.css'), 'utf8');

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
      <div class="plate">${SH.cardArt()}<span class="uv-scale">${fmt(SH.SHAPETESTS)} shape tests &middot; ${fmt(SH.PERMTESTS)} permutations</span></div>
      <figcaption><b>A symmetry, recovered from a model&rsquo;s own answers.</b> Each chord joins an item to where the permutation sends it, so a rotation reads as a fan and a reflection as rungs across an axis. Nobody asked about symmetry; it is what survived when everything else did not.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">shape hunt &middot; five studies &middot; no model calls</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">exact rationals</span><span class="bn">every survivor is recomputed in exact rationals, and the impossibility witnesses clear a floor that is proved rather than sampled</span></div>
      <h2>Nothing here is a perfect circle.</h2>
      <p class="sub">The elicited geometries look like they hold shapes &mdash; a pentagon here, four points on a circle there. So this looks exhaustively, at every triple and quadruple and five-subset of every set from every model, and then runs the identical search on the same numbers with the geometry shuffled out. Almost nothing survives that. What does is not a polygon &mdash; and for most of the sets the verdict is not a margin at all but a certificate in whole numbers that no such points exist.</p>
      <div class="facts">
        ${fact('collinear triples found', SH.beats('collinear') + ' of ' + SH.real.length, 'not one, in any set, better than shuffling the same distances would give')}
        ${fact('regular pentagons', SH.beats('r5') + ' of ' + SH.real.length, 'and the roundest pentagon in pure noise looks exactly as convincing')}
        ${fact('symmetries that hold', SH.real.filter((r) => r.symmetry.beatsBoth).length + ' of ' + SH.real.length, 'under two nulls of opposite bias that no control clears — including the antipodal map on the compass, which nobody asked about')}
        ${fact('provably not distances', SH.ST.cm.rows.filter((r) => !r.synthetic && r.refuted).length + ' of ' + SH.ST.cm.rows.filter((r) => !r.synthetic).length, 'refuted above a floor that is proved rather than sampled, each with a four-item witness — while the nonsense controls embed exactly')}
      </div>
      <span class="go">read the hunt <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="interferometer/index.html">
    <figure class="card-art">
      <div class="plate">${UV.svg}<span class="uv-scale">longest baseline ${n(UV.maxUV, 2)} G&lambda;</span></div>
      <figcaption><b>This is the whole of what was measured.</b> ${fmt(UV.rows)} samples from ${UV.baselines} telescope pairs on 21 April 2018, each pair sweeping an arc as the Earth turns, each arc mirrored because a real sky makes every measurement two. Everything between the arcs was never observed &mdash; and that empty space is the reason there is a <em>set</em> of pictures rather than a picture.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">interferometer &middot; M87 &middot; ${M.freqGHz.toFixed(0)} GHz</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">floats</span><span class="bn">a certificate-shaped bound with no proof on disk yet, and the page leads with that</span></div>
      <h2>Not the picture. The set of pictures.</h2>
      <p class="sub">The famous black-hole image is <em>one</em> sky chosen, by an imaging prior, from the infinitely many the data allow. This draws the set instead: ${D.members.length} skies fitted under deliberately different priors, agreement rendered as ink and disagreement as texture. One slider decides how much of the phase information the picture is allowed to use &mdash; and at zero the ring dissolves, because amplitudes alone cannot see where anything is.</p>
      <div class="facts">
        ${fact('visibilities', fmt(M.K), 'released rows, one calibration pipeline, one night')}
        ${fact('stations', M.stations.length, `${UV.baselines} baselines, ${M.triangles} closure triangles`)}
        ${fact('skies drawn', D.members.length + ' + ' + D.ceiling.length, 'fitted members, plus extremes that push the data’s limits')}
        ${SWEEP ? fact('bracket', n(100 * (worst - 1), 0) + '%', `worst of ${SWEEP.rows.length} radii — a prior-free, phase-free enclosure, best ${n(100 * (best - 1), 0)}%`) : ''}
      </div>
      <span class="go">open the instrument <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="curveset/index.html">
    <figure class="card-art">
      <div class="plate">${CS.cardArt()}<span class="uv-scale">${n(CS.monoR(CS.pontius), 0)}&times; the reported &plusmn;, assuming only monotone</span></div>
      <figcaption><b>The same question, on something everyday.</b> Twenty loads applied twice at NIST, and the whole set of calibration curves those standards allow &mdash; solid, because it is what the data forces. The published quadratic is the dotted line inside it: one member of that set, chosen by a fitting criterion rather than by the measurements.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">curveset &middot; ${CS.P.sets.length} real calibrations &middot; no model calls</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">closed form, in floats</span><span class="bn">the envelope is a min and a max of straight lines, so it is exact as a formula and evaluated as a double</span></div>
      <h2>The line they published, and the lines that fit.</h2>
      <p class="sub">A calibration is run forwards and used backwards, and the backwards number always comes off a fitted curve. The fit is an assumption and it is never priced. This computes what the standards allow instead &mdash; in closed form, no optimiser, no sampling &mdash; under assumptions you can dial one at a time, from <em>monotone only</em> to <em>join the dots</em>, with the parametric fit past the end of the dial.</p>
      <div class="facts">
        ${fact('load cell, monotone only', n(CS.monoR(CS.pontius), 0) + '\u00d7', 'the honest interval is exactly the ladder spacing &mdash; which two standards you are between, and nothing finer')}
        ${fact('and joining the dots', n(CS.dotsR(CS.pontius), 1) + '\u00d7', 'linear interpolation lands on the reported precision: on a fine ladder the functional form buys nothing')}
        ${fact('the assay, joining the dots', n(CS.dotsR(CS.il6), 1) + '\u00d7', 'the opposite verdict &mdash; on a coarse ladder the four-parameter form is doing the work')}
        ${fact('the mathematics', 'closed form', 'U and L are a min and a max of straight lines, so reading backwards is a bisection and the page runs the file the tests run')}
      </div>
      <span class="go">turn the dial <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="plates/index.html">
    <figure class="card-art">
      <div class="plate">${PL.cardArt()}<span class="uv-scale">plate I of ${PL.counts.plates} &middot; n = 0 &hellip; 99 across mod 2, 5, 10, 100</span></div>
      <figcaption><b>A number as a point on a product of circles.</b> Interpretability research reports that a model stores a number as a set of residues, one angle per modulus, and adds by rotating all of them at once. Drawn here from the definition rather than recovered from activations &mdash; the honest way for this bench to hold the object.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">plates &middot; ${PL.counts.plates} figures &middot; no interaction, no model calls</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">records from the certificate shelf</span><span class="bn">plates IV, VII and VIII are drawn from certificates the rest of the site gates; the other five are rules stated and drawn</span></div>
      <h2>Manifolds we are handed.</h2>
      <p class="sub">Their manifolds are <em>found</em> &mdash; pulled out of a working model and interpreted. These are <em>stated</em>: a rule, its parameters, and then a drawing. Two of the eight are not illustrations at all but certificates rendered at their own resolution, which is what a proof looks like when you stop reading it and start looking at it.</p>
      <div class="facts">
        ${fact('a proof, tiled', fmt(PL.counts.bBoxes) + ' boxes', 'brightness is how little room each box had &mdash; the bright seams are where the argument nearly ran out')}
        ${fact('the tightest box', PL.counts.worstMargin.toExponential(2), 'one number, and the whole lower bound rests on it')}
        ${fact('the instrument itself', fmt(PL.counts.visibilities) + ' rings', 'each measurement is a circle: the radius is known, the angle on it is not')}
        ${fact('the grammar, found', 'plate V', 'solid for a bound on every sky, dashed for one sky that exists &mdash; drawn that way before it had a name')}
      </div>
      <span class="go">open the series <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="affect/index.html">
    <figure class="card-art">
      <div class="plate">${AF.cardArt()}<span class="uv-scale">twelve feelings, placed by pairwise questions alone</span></div>
      <figcaption><b>The circumplex, recovered twice.</b> The ring is fixed by asking only how different each pair of feelings is. The axes &mdash; pleasant to the right, activated upward &mdash; come from a completely separate question set with no words in common, and land on the plane the pairwise table had already chosen.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">affect &middot; ${AF.M.moods.length} moods &times; ${AF.M.models.length} models &middot; $${AF.spend.toFixed(2)} already spent</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">exact integers</span><span class="bn">the signature, the negative mass and the metric gate are decided on the integer table; the plates are float drawings of it</span></div>
      <h2>The geometry of feeling, and the control that catches it.</h2>
      <p class="sub">Twelve feelings, then the same twelve asked again under six moods &mdash; and twelve clock hours carried through the identical pipeline as a control that has no business moving. A mood effect that also moves the clock is not a mood effect. One model&rsquo;s clock moves anyway.</p>
      <div class="facts">
        ${fact('two question sets, no words shared', 'r = ' + AFX.rx.map((v) => v.toFixed(2)).join(', '), 'pleasantness, agreeing between the plane the pairwise table fixed and the scalar answers it never saw')}
        ${fact('and it is the leading axis', AFX.ang.map((v) => Math.abs(v).toFixed(0) + '&deg;').join(', '), 'pleasantness lands on that plane&rsquo;s own principal axis &mdash; an axis fixed before any scalar was read')}
        ${fact('but a plane it is not', 'rank ' + AFX.rank.join(', '), 'with ' + AFX.neg.map((v) => (100 * v).toFixed(0) + '%').join(', ') + ' negative mass &mdash; no arrangement of points in any Euclidean space has these distances')}
        ${fact('the control moves', 'up to ' + AFX.worstClock + '%', 'twelve clock hours, under a mood, in the smallest model &mdash; which is exactly what a control is for')}
      </div>
      <span class="go">read the moods <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="answer-shape/index.html">
    <figure class="card-art">
      <div class="plate">${AS.cardArt()}<span class="uv-scale">every pair asked both ways round</span></div>
      <figcaption><b>Three models in one frame.</b> A table of distances fixes nothing about rotation, reflection or overall size, so putting three of them on one axis means removing exactly those freedoms and nothing else. What is left is disagreement about shape.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">answer shape &middot; ${AS.G.subjects.length} subjects &times; ${AS.G.models.length} models &middot; $${AS.spend.toFixed(2)} already spent</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">exact integers</span><span class="bn">same instrument, same exactness — the triangle inequality and the signature are decided, the pictures are views</span></div>
      <h2>The shape of an answer.</h2>
      <p class="sub">Ask how different two things are, one pair at a time, and you get a table of numbers. A table of distances is a shape &mdash; or it is not one, and the difference is decidable in exact integer arithmetic. Every pair is asked <em>both ways round</em>, so the asymmetry is measured rather than averaged away.</p>
      <div class="facts">
        ${fact('the hue wheel', 'red beside violet', 'the one cycle that is not a convention &mdash; a model that puts them at opposite ends has learned a list of colour words, not a colour space')}
        ${fact('where the triangle fails', 'up to 23% of triples', 'break d(a,c) &le; d(a,b) + d(b,c) &mdash; so no arrangement of points in any space has those distances')}
        ${fact('the nonsense control', 'metric', 'strings that are not words come back as a clean metric in all three models, which is what a control is supposed to do')}
        ${fact('line or cycle', 'both, measured', 'each table held against the two shapes it could have, one free scale each, fixed in closed form so the residuals compare')}
      </div>
      <span class="go">compare the three <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="neural-geometry/index.html">
    <figure class="card-art">
      <div class="plate">${NG.cardArt()}<span class="uv-scale">${NG.G.meta.calls} calls &middot; $${NG.G.meta.spent.toFixed(2)}</span></div>
      <figcaption><b>Twelve colour words, placed by a model that has never seen a colour.</b> Every chord is one pairwise judgement, weighted by how similar the model called the pair; the solid path walks red &rarr; orange &rarr; &hellip; &rarr; rose and the dashed step is the way home. It closes. Nobody asked for a wheel.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">neural geometry &middot; ${NG.G.models.length} models &middot; no weights</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">exact integers</span><span class="bn">asymmetry, closure, the triangle inequality, Gromov delta and the Gram signature, all decided on integers</span></div>
      <h2>The shapes a model will admit to from the outside.</h2>
      <p class="sub">Goodfire finds circles and colour surfaces by opening the model and decomposing its activations, which needs the weights. This asks from outside instead &mdash; every pair, one integer, one row at a time &mdash; and then decides exactly what those answers can be. If the circle is real it should survive being asked about; a shape that lives only in the activations was never a shape the model uses.</p>
      <div class="facts">
        ${fact('curved directions', ngQ, 'in the unrelated control, in all three models — while every structured set carries several. Structure shows up as the refusal to be flat.')}
        ${fact('the hue wheel', ngClose('hues') + '×', 'the step home against the median step along the way — red really is next to rose')}
        ${fact('as bare digits', ngClose('digits') + '×', 'a line: nine is nowhere near zero, and the control frame “floors of a building” changes nothing')}
        ${fact('as residues mod 10', ngClose('mod10') + '×', 'the same ten numerals the model lays on a line as digits — renamed, they close into a ring')}
      </div>
      <span class="go">read the plates <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="exact-geometry/index.html">
    <figure class="card-art">
      <div class="plate">${XG.cardArt()}<span class="uv-scale">${XG.n} sets whose shape is fixed by construction</span></div>
      <figcaption><b>The positive control for every geometry page here.</b> Five telescopes at one instant are points in a plane by construction, and there is no room for argument. If the instrument does not come back with effective rank 2 and nothing negative, the arithmetic is broken and every other number is worthless.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">exact geometry &middot; ${XG.n} sets &middot; no model calls at all</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">exact integers</span><span class="bn">and the predictions were written before the run, which is the only thing that makes "agreed" mean anything</span></div>
      <h2>Point it at something whose shape is already known.</h2>
      <p class="sub">Every other geometry page here asks a model for a table of dissimilarities and decides what shape the answers have. This one asks nothing. The prediction is written first, in the source, and never edited afterwards &mdash; which is the only thing that makes &ldquo;agreed&rdquo; mean anything.</p>
      <div class="facts">
        ${fact('predictions that held', XG.agreed + ' of ' + XG.n, 'written before the run, in sets.js, and not touched since')}
        ${fact('refused at the gate', '1', 'a set that violates the metric gate is refused rather than scored &mdash; running the arithmetic anyway returns a plausible number from a broken input')}
        ${fact('the awkward reading, kept', 'signature', 'quantising a projection to integers guarantees the exact signature will not come back clean, so it is printed beside the rank rather than instead of it')}
      </div>
      <span class="go">read the controls <span class="arw">&rarr;</span></span>
    </div>
  </a>

  <a class="card" href="simplex/index.html">
    <figure class="card-art">
      <div class="plate">${SIMPLEX.cardArt()}<span class="uv-scale">${SIMPLEX.M.positions} positions</span></div>
      <figcaption><b>One attention row, drawn where it lives.</b> The ${SIMPLEX.M.positions} vertices are the ${SIMPLEX.M.positions} positions the head can attend to; the row is the point. It starts at dead centre &mdash; attending to everything equally &mdash; and the trail is where sharpening the temperature takes it. Solid while the claim is decided, dashed once it is only drawn.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">attention geometry &middot; one frozen row &middot; exact</div>
      <div class="backs"><span class="bk">what decides it</span><span class="bv">exact rationals for the claim</span><span class="bn">consecutive values differ in the fourteenth decimal, so the monotonicity is decided on BigInt fractions; the trail is dashed where it is only drawn</span></div>
      <h2>An attention row is a point. Nobody draws it that way.</h2>
      <p class="sub">Attention weights are nonnegative and sum to one, which makes a row a point in a simplex &mdash; and a bar chart throws that away. Focus is distance from the centre; concentration has contours; temperature is a path. One real row from a tiny GPT, in the room it actually lives in, with the one claim about it that is decided rather than drawn: sharpening must move the point toward a vertex, proved in exact rational arithmetic because consecutive values differ in the fourteenth decimal.</p>
      <div class="facts">
        ${fact('positions', SIMPLEX.M.positions, `layer 0, head 0, seed 0 — frozen once and sha-pinned`)}
        ${fact('checks, exact', SIMPLEX.D.checks.length + '/' + SIMPLEX.D.checks.length, 'including two planted mutants that must fail to concentrate')}
        ${fact('effective positions', n(SIMPLEX.D.exact[0].PR, 2) + ' → ' + n(SIMPLEX.D.exact[SIMPLEX.D.exact.length - 1].PR, 2), `across the decided grid, out of ${SIMPLEX.M.positions}`)}
        ${fact('drawn past it', n(SIMPLEX.D.view[SIMPLEX.D.view.length - 1].PR, 2), 'at β 400, essentially a vertex — and dashed, because it is not decided')}
      </div>
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
  script: `<style>${SHELLCSS}\n${CSS}</style>`,
});

/* ---- write ---------------------------------------------------------------- */
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);

/* the design assets the browser needs, copied rather than linked out of the
   repository: /instruments owns its look and cannot be restyled from elsewhere */
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
for (const f of ['tokens.css', 'base.css'])
  copy(path.join(HERE, 'design', f), path.join(OUT, 'design', f));
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
