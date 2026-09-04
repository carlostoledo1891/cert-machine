#!/usr/bin/env node
/* build.js — the whole of /playground, into site/playground/.
   node playground/build.js

   WHAT THIS DOES NOT DO, deliberately. It does not call tools/build-site.js and
   is not called by it. None of this repository's gates apply here: no scope
   line, no certificate table that must agree with disk, no stale-claim sweep.
   Those gates exist because those pages make claims. This place makes none —
   nothing under /playground is certified and every page here says so out loud.

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
const OUT = path.join(ROOT, 'site', 'playground');
const { page } = require(path.join(HERE, 'design', 'shell.js'));
const { uvSVG } = require(path.join(HERE, 'uv-art.js'));
const SIMPLEX = require(path.join(HERE, 'simplex', 'build.js'));

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

const fact = (k, v, note) =>
  `<div class="f"><span class="fk">${k}</span><span class="fv">${v}</span>${note ? `<span class="fn">${note}</span>` : ''}</div>`;

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">cert-machine &middot; playground</div>
  <h1>Nothing here is certified. That is the entire permission.</h1>
  <p class="lede">The rest of this repository proves things, and gates itself accordingly &mdash; a page there cannot ship if a number on it has drifted from the record underneath. This place is for the other half of the work: <b>the instruments made touchable</b>, the mathematics dressed so that you would want to look at it. Everything here is real and computed on this machine from data on disk. None of it is a proof, and none of it will pretend to be.</p>
</div></header>

<section class="projects"><div class="wrap">
  <div class="count">
    <span class="eyebrow">the projects</span>
    <span class="eyebrow">two, so far</span>
  </div>

  <a class="card" href="interferometer/index.html">
    <figure class="card-art">
      <div class="plate">${UV.svg}<span class="uv-scale">longest baseline ${n(UV.maxUV, 2)} G&lambda;</span></div>
      <figcaption><b>This is the whole of what was measured.</b> ${fmt(UV.rows)} samples from ${UV.baselines} telescope pairs on 21 April 2018, each pair sweeping an arc as the Earth turns, each arc mirrored because a real sky makes every measurement two. Everything between the arcs was never observed &mdash; and that empty space is the reason there is a <em>set</em> of pictures rather than a picture.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">interferometer &middot; M87 &middot; ${M.freqGHz.toFixed(0)} GHz</div>
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

  <a class="card" href="simplex/index.html">
    <figure class="card-art">
      <div class="plate">${SIMPLEX.cardArt()}<span class="uv-scale">${SIMPLEX.M.positions} positions</span></div>
      <figcaption><b>One attention row, drawn where it lives.</b> The ${SIMPLEX.M.positions} vertices are the ${SIMPLEX.M.positions} positions the head can attend to; the row is the point. It starts at dead centre &mdash; attending to everything equally &mdash; and the trail is where sharpening the temperature takes it. Solid while the claim is decided, dashed once it is only drawn.</figcaption>
    </figure>
    <div class="card-body">
      <div class="eyebrow">attention geometry &middot; one frozen row &middot; exact</div>
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
</div></section>

<section class="rules"><div class="wrap">
  <span class="eyebrow">how this place works</span>
  <div class="grid">
    <div>
      <h3>No gates.</h3>
      <p>This folder is built by its own thirty-line script. It is not wired into the repository&rsquo;s site build and none of that build&rsquo;s refusals apply to it. Nothing here can block anything there, and nothing there can slow anything here down.</p>
    </div>
    <div>
      <h3>But no fiction either.</h3>
      <p>Every number on every page comes out of a record in this folder, and every record comes out of running the code beside it. Freedom from ceremony is not freedom from arithmetic. Where a thing is a float and not a proof, the page says so in the same breath as the number.</p>
    </div>
    <div>
      <h3>The data is not ours.</h3>
      <p>The Event Horizon Telescope files here are the public release, byte for byte, under the collaboration&rsquo;s own terms &mdash; the code is MIT and the data is not. They are carried so the pages can be re-run rather than believed.</p>
    </div>
  </div>
</div></section>

<footer class="foot"><div class="wrap"><div class="line">
  <span>cert-machine / playground</span>
  <a href="../index.html">the machine</a>
  <a href="https://github.com/carlostoledo1891/cert-machine">source</a>
  <span>built ${new Date().toISOString().slice(0, 10)}</span>
</div></div></footer>
`;

const html = page({
  title: 'playground · cert-machine',
  desc: 'Instruments made touchable. Nothing here is certified — that is the entire permission.',
  root: '', here: 'home', body,
  script: `<style>${SHELLCSS}\n${CSS}</style>`,
});

/* ---- write ---------------------------------------------------------------- */
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);

/* the design assets the browser needs, copied rather than linked out of the
   repository: /playground owns its look and cannot be restyled from elsewhere */
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
for (const f of ['tokens.css', 'base.css'])
  copy(path.join(HERE, 'design', f), path.join(OUT, 'design', f));
for (const f of ['inter-var.woff2', 'jetbrains-mono-var.woff2'])
  copy(path.join(HERE, 'assets', 'fonts', f), path.join(OUT, 'assets', 'fonts', f));

const ifm = require(path.join(IFM, 'build.js')).build(OUT);
const sx = SIMPLEX.build(OUT);

const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) { return 'unknown'; } })();
console.log(`site/playground/index.html            ${(html.length / 1024).toFixed(0)} KB  ·  u–v art from ${fmt(UV.rows)} released rows, ${UV.baselines} baselines`);
console.log(`site/playground/interferometer/       ${(ifm.bytes / 1024).toFixed(0)} KB  ·  ${ifm.members} members + ${ifm.extremes} extremes, ${fmt(ifm.K)} rows`
  + (ifm.bracket ? `, bracket ${n(100 * (ifm.bracket - 1), 0)}% over ${ifm.sweep} radii` : ''));
console.log(`site/playground/simplex/            ${(sx.bytes / 1024).toFixed(0)} KB  ·  ${sx.checks}/${sx.checks} exact checks, ${sx.positions} positions, PR down to ${n(sx.endPR, 2)} at the far end`);
console.log(`@ git ${git}`);
