/* build.js — site/playground/interferometer/index.html, from the records in out/.

   Lifted from frontier-apps/tools/build-interferometer.js and changed in exactly
   three ways: it reads its inputs from this folder, it wears the playground shell
   instead of the bench's, and the sheet carries the Stage 0.5 bracket. The page
   itself — the render, the controls, the argument — is the same page. That was
   the point of the port.

   Inputs, never retyped:
     out/page-data.json   the ensemble + the amplitude extremes the page draws
     out/profile.json     the full-data Stage 0 profile
     out/cp-sweep.json    the Chambolle–Pock bracket (Stage 0.5)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const { page } = require(path.join(PG, 'design', 'shell.js'));

const D = JSON.parse(fs.readFileSync(path.join(HERE, 'out', 'page-data.json'), 'utf8'));
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const SHELLCSS = fs.readFileSync(path.join(PG, 'design', 'shell.css'), 'utf8');
const M = D.meta;
const n = (x, d) => Number(x).toFixed(d === undefined ? 3 : d);
const readOut = (f) => { try { return JSON.parse(fs.readFileSync(path.join(HERE, 'out', f), 'utf8')); } catch (e) { return null; } };
const SWEEP = readOut('cp-sweep.json');

const chi0 = D.members.filter(m => m.phase === 0).map(m => m.chi2);
const chi1 = D.members.filter(m => m.phase === 1 && !m.drop).map(m => m.chi2);
const avg = a => a.reduce((s, x) => s + x, 0) / a.length;

const ceilRows = D.ceiling.map(x => `<tr><td>${x.r0}</td><td>${n(x.value, 4)}</td><td>${n(x.upper, 4)}</td><td>${n(x.chi2, 1)}</td></tr>`).join('');
const profRows = D.profileFull ? D.profileFull.rows.map(r =>
  `<tr><td>${r.r0}</td><td>${n(r.lower, 4)}</td><td>${n(r.upper, 4)}</td><td>${n(r.upper / Math.max(r.lower, 1e-9), 1)}×</td></tr>`).join('') : '';
const cpRows = SWEEP ? SWEEP.rows.map(r =>
  `<tr><td>${r.r0}</td><td>${n(r.witness, 4)}</td><td>${n(r.ceiling, 4)}</td><td><b>${n(r.ratio, 2)}×</b></td></tr>`).join('') : '';
const cpWorst = SWEEP ? Math.max(...SWEEP.rows.map(r => r.ratio)) : null;

const slider = (id, label, min, max, step) =>
  `<div class="ctrl"><label for="${id}">${label}</label><output id="${id}Out"></output><input type="range" id="${id}" min="${min}" max="${max}" step="${step}"></div>`;

const body = `
<canvas id="stage"></canvas>

<div class="ov ov-title">
  <div class="eyebrow">M87 &middot; ${M.date} &middot; ${M.freqGHz.toFixed(0)} GHz</div>
  <h1 style="margin-top:var(--s-3);">Not the picture.<br>The set of pictures.</h1>
  <p>Every sky drawn here is one the Event Horizon Telescope&rsquo;s released data allow. What they agree on is ink. What they disagree on is texture.</p>
</div>

<div class="ov ov-foot">
  <div class="rd">
    <span class="item"><span class="k">skies drawn</span><span class="v" id="rSkies">—</span></span>
    <span class="item"><span class="k">information used</span><span class="v" id="rPhase">—</span></span>
    <span class="item"><span class="k">compact flux</span><span class="v" id="rFlux">—</span></span>
    <span class="item"><span class="k">mean disagreement</span><span class="v" id="rSpread">—</span></span>
  </div>
  <div class="cap" id="rCap">&nbsp;</div>
  <div class="src">${M.K} visibilities &middot; ${M.snapshots} snapshots &middot; ${M.stations.length} stations &middot; ${M.triangles} closure triangles &middot; EHT release 2024-D01-01</div>
</div>

<button class="pt" id="panelToggle">controls</button>

<aside class="panel">
  <div class="grp">
    <span class="eyebrow">the one control that matters</span>
    ${slider('cPhase', 'phase information', 0, 1, 0.01)}
    <div class="note-sm">At zero, only the visibility <em>amplitudes</em> are used &mdash; and amplitudes cannot see position, so the ring dissolves. Slide right to bring in the closure phases, the only phase information in these files that survives calibration.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">render</span>
    <div class="row-btns">
      <button data-mode="contour">contour</button>
      <button data-mode="field">field</button>
      <button data-mode="stipple">stipple</button>
      <button data-mode="scan">scan</button>
    </div>
    ${slider('cBeam', 'restoring beam', 0, 26, 1)}
    ${slider('cGamma', 'gamma', 0.25, 1.6, 0.01)}
    ${slider('cBlack', 'black point', 0, 0.4, 0.005)}
    ${slider('cLevels', 'contour levels', 3, 24, 1)}
    ${slider('cDensity', 'texture density', 0.2, 2.2, 0.05)}
    ${slider('cSpread', 'disagreement gain', 0, 3, 0.05)}
    ${slider('cZoom', 'zoom', 0.6, 2.2, 0.01)}
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">filter the ensemble</span>
    ${slider('cChi', 'closure fit, worse than', 1, 60, 1)}
    ${slider('cFlux', 'compact flux at most', 0.4, 8, 0.1)}
    <div class="row-btns" style="margin-top:var(--s-3);">
      <button data-flag="extremes">include amplitude extremes</button>
    </div>
    <div class="note-sm">The extremes are the skies that push as much flux as the amplitudes allow into a small disk. They are legal and they look nothing like a black hole &mdash; which is the point.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">telescopes</span>
    <div class="chips" id="stations"></div>
    <div class="note-sm">Switching one off removes its baselines from the u&ndash;v map and drops the ensemble members fitted without it.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">overlays</span>
    <div class="row-btns">
      <button data-flag="register" title="align every sky on its own centroid">register</button>
      <button data-flag="ring">ring</button>
      <button data-flag="uv">u&ndash;v</button>
      <button data-flag="grid">grid</button>
      <button data-flag="invert">invert</button>
    </div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <div class="row-btns"><button id="aboutOpen">what this is</button></div>
    <div class="note-sm">Computed on one laptop from the released files. Nothing certified yet &mdash; see the notes.</div>
  </div>
</aside>

<div class="sheet" id="sheet">
  <button class="pt close" id="aboutClose">close</button>
  <div class="inner">
    <h2>What this is</h2>
    <p>The famous image of M87 is one sky chosen from the infinitely many that fit the data, by an imaging prior. This page carries the ensemble instead: ${D.members.length} skies fitted from the released ${M.date} visibilities under different weights, seeds, smoothness and telescope subsets, plus ${D.ceiling.length} extremal skies that push the data&rsquo;s limits. The render shows their weighted mean as brightness and their disagreement as texture.</p>

    <h3>Why the amplitudes alone cannot make a ring</h3>
    <p>Translate a sky and every visibility is multiplied by a phase; its modulus does not change. A constraint set built from amplitudes alone is therefore blind to position: any sky that fits still fits after you slide it across the field. Set the phase slider to zero and the ring dissolves, because at that setting the picture is drawn only from information that cannot locate anything.</p>
    <p>Why not use the phases directly? These visibilities are network-calibrated, which fixes amplitudes, but not self-calibrated &mdash; residual per-station phases are still in the file, and every published image of them is made <em>with</em> self-calibration. Measured here: a nonnegative sky confined to this field fits the released complex visibilities no better than &chi;&sup2; = 4.8 per datum with a worst residual of 33 released sigmas, and the set of skies fitting them at three sigma is empty. Closure phases are the way out: the sum of three visibility phases around a triangle of stations, in which every station&rsquo;s unknown phase cancels. There are ${M.triangles} such triangles in these snapshots.</p>
    <p>The difference is measurable, and it is the arc this page draws: skies fitted to the amplitudes alone score a closure &chi;&sup2; of about ${n(avg(chi0), 0)}; skies fitted with the closure phases reach ${n(avg(chi1), 1)}.</p>

    <h3>The ceiling, and why it is a ceiling</h3>
    <p>For any nonnegative sky &mu; in the field and any complex multipliers y with a constant &lambda; &ge; 0, if the pointwise inequality below holds everywhere in the field, then the bound underneath it holds for <em>every</em> sky the data allow &mdash; not just for the ones we happened to find.</p>
    <pre>f(x)   &le;   Re &Sigma;<sub>k</sub> conj(y<sub>k</sub>) exp(&minus;2&pi;i (u<sub>k</sub>l + v<sub>k</sub>m))  +  &lambda;

&int; f d&mu;   &le;   &Sigma;<sub>k</sub> |y<sub>k</sub>| A<sub>k</sub>  +  &lambda; F</pre>
    <p>Nonnegative multipliers, one pointwise inequality over a continuum, checked by subdividing the field. The optimiser that proposes y is not part of the proof. It is the same certificate shape the bench used on <a href="../erdos1038/index.html">an Erd&odblac;s problem about the positivity set of a potential</a>, with cosines in place of a logarithmic kernel &mdash; which is why this front exists at all.</p>
    <p>On the ${M.K} rows this page carries, with the extremal skies as witnesses:</p>
    <table><thead><tr><th>r (µas)</th><th>witness (Jy)</th><th>ceiling (Jy)</th><th>closure &chi;&sup2;</th></tr></thead><tbody>${ceilRows}</tbody></table>
    ${profRows ? `<p>And on the full ${D.profileFull.data.K ? '' : ''}set above ${D.profileFull.data.bcut} Gλ:</p>
    <table><thead><tr><th>r (µas)</th><th>witness (Jy)</th><th>ceiling (Jy)</th><th>ratio</th></tr></thead><tbody>${profRows}</tbody></table>` : ''}

    ${cpRows ? `<h3>The bracket, once the solver stopped being the problem</h3>
    <p>A ceiling seventy times its own witness was never a statement about the mathematics &mdash; linear-programming duality leaves no gap to hide in &mdash; it was a statement about the search for multipliers. Both nonsmooth pieces of the program have exact proximal operators: a block soft-threshold on each complex y, and a clamp for the constraint. A primal&ndash;dual method uses them directly instead of smoothing them, and its dual variable <em>is</em> a nonnegative measure on the working set &mdash; so the witness converges alongside the ceiling, for free.</p>
    <table><thead><tr><th>r (µas)</th><th>witness (Jy)</th><th>ceiling (Jy)</th><th>gap</th></tr></thead><tbody>${cpRows}</tbody></table>
    <p>A ${((cpWorst - 1) * 100).toFixed(0)}% bracket at worst, prior-free and phase-free, on a ${2 * SWEEP.opts.fov} µas field with at most ${SWEEP.opts.F} Jy in it. The flux hypothesis is nearly inactive: a tenfold weaker one costs about a sixth.</p>` : ''}

    <h3>What is not here</h3>
    <p>Nothing on this page is certified in the bench&rsquo;s sense. The pointwise inequality is checked on a fine grid with a Lipschitz margin covering the gaps between samples &mdash; a float safeguard, not a proof &mdash; and the ceilings are loose, by up to a factor of seventy, because the search for good multipliers is. The ensemble is an ensemble, not a posterior: it says these skies are allowed, never how likely they are. Everything was computed on one laptop from the public release; nothing has been sent anywhere.</p>
    <p><strong>Stated hypotheses, in full:</strong> a ${2 * M.fov} µas field of view, nonnegativity, a total flux ceiling of ${M.F} Jy inside it, baselines above ${M.bcut} Gλ only, and amplitude ceilings at ${M.nsig}&sigma; plus ${(100 * M.gain).toFixed(0)}% gain. Nothing else is assumed and nothing else is used.</p>
  </div>
</div>

<script id="ifm-data" type="application/json">${JSON.stringify(D).replace(/</g, '\\u003c')}</script>`;

function build(OUT) {
  const html = page({
    title: 'Not the picture — the set of pictures · playground',
    desc: 'Every sky the Event Horizon Telescope data allow for M87, drawn at once: agreement as ink, disagreement as texture.',
    root: '../', here: 'interferometer', body,
    head: '<link rel="stylesheet" href="../design/base.css">',
    script: `<style>${SHELLCSS}\n${CSS}</style>\n<script>${APP}</script>\n<script>(function(){document.getElementById('aboutOpen').onclick=function(){document.body.classList.add('sheet-open');};document.getElementById('aboutClose').onclick=function(){document.body.classList.remove('sheet-open');};document.addEventListener('keydown',function(e){if(e.key==='Escape')document.body.classList.remove('sheet-open');});})();</script>`,
  });
  const dir = path.join(OUT, 'interferometer');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, members: D.members.length, extremes: D.ceiling.length,
           K: M.K, bracket: cpWorst, sweep: SWEEP ? SWEEP.rows.length : 0 };
}

module.exports = { build, D, M, SWEEP, cpWorst };
