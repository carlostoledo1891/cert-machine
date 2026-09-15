/* build.js — site/instruments/stereo-reach/index.html.
   playground/stereo-reach/ · cert-machine · 2026-09-12

   The error budget of a stereo-video wave rig, as enclosures, with a dial for
   every input: how far from two cameras can a wave height still be bounded to
   a tolerance? Built for the low-cost rigs of Vieira, Guimarães et al. (JMSE
   2020, Coastal Engineering 2024) and the Big Wave Tracker at Nazaré.

   NO FICTION ON /instruments: the geometry is instruments/stereo/budget.js
   over instruments/interval/interval.js, inlined here byte for byte and run
   by the tab; the Leme 2020 preset's literals are the paper's, its boxes are
   what the paper does not state, and every scenario value is marked chosen.
   The facts stated in prose about that rig are computed at build by the same
   code the battery runs (instruments/stereo/presets.js → lemeFacts). */
'use strict';
const fs = require('fs');
const path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));
const IV = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const TR = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const { makeBudget } = require(path.join(ROOT, 'instruments', 'stereo', 'budget.js'));
const PR = require(path.join(ROOT, 'instruments', 'stereo', 'presets.js'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const IVSRC = fs.readFileSync(path.join(ROOT, 'instruments', 'interval', 'interval.js'), 'utf8');
const BUDGET = fs.readFileSync(path.join(ROOT, 'instruments', 'stereo', 'budget.js'), 'utf8');
const PRESETS = fs.readFileSync(path.join(ROOT, 'instruments', 'stereo', 'presets.js'), 'utf8');
const Bd = makeBudget(IV);
const F = PR.lemeFacts(Bd, TR.PI);
const L = PR.leme2020;
const cm = (x) => (x >= 1 ? x.toFixed(2) + ' m' : x >= 0.01 ? (x * 100).toFixed(1) + ' cm' : (x * 1000).toFixed(1) + ' mm');
const nf = (x, d) => Number(x).toLocaleString('en-US', { maximumFractionDigits: d });
/* the facts the prose states, gated as the battery gates them */
if (!(F.bestAtGauge > 0.02 && F.bestAtGauge < 0.04 && F.worstAtGauge > 0.2 && F.worstAtGauge < 0.5)) throw new Error('stereo-reach: the Leme facts moved; rewrite the prose');
if (!L.observed.rmse.every((x) => x >= F.bestAtGauge && x <= F.worstAtGauge)) throw new Error('stereo-reach: an observed RMSE is outside the best–worst span; the sentence would be false');
if (!(F.bestAtNear > L.quoted.zQuantization)) throw new Error('stereo-reach: the quoted quantization is not below the best-case near cell; the sentence would be false');

const SPEC = {
  PI: TR.PI,
  marks: { decided: W.attrs(W.DECIDED, { width: 2 }), chosen: W.attrs(W.CHOSEN, { width: 2 }), computed: W.attrs(W.COMPUTED, { width: 2 }) },
  presets: PR.PRESETS,
};

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">instruments &middot; stereo reach &middot; the error budget of two cameras, as enclosures, in your tab</div>
  <h1>How far can two cameras bound a wave?</h1>
  <p class="lede">A stereo-video rig recovers the sea surface from the pixel offset between two images. Every pixel is a box &mdash; a disparity known to a fraction of a pixel, a vertical coordinate to half of one, a shutter that fired a few milliseconds late &mdash; and the set of elevations the rig cannot tell apart at a given range is a cell whose height is computed here exactly, in outward-rounded interval arithmetic, over inputs that may themselves be boxes. Turn the baseline, the height, the lens, the lag, the sea; read the bound at any range and the range at which the bound first exceeds a tolerance. Preset: the two-smartphone rig of
  <a href="https://doi.org/10.3390/jmse8110831">Vieira, Guimar&atilde;es, Violante-Carvalho, Benetazzo, Bergamasco and Pereira (2020)</a> at Leme, with the paper's numbers as literals and the ones it does not state as boxes.</p>
</div></header>

<section class="wrap">
  <div class="sr-wrap">
    <div>
      <div class="sr-fig"><svg id="sr-svg" viewBox="0 0 900 460" role="img" aria-label="The upper bound on the elevation error of the selected rig against horizontal range, on log axes, with its four terms, the tolerance line and the reach"></svg></div>
      <p class="sr-note">Four curves, each the UPPER end of an enclosure: the quantization cell (disparity to &plusmn;&delta;d pixels, vertical coordinate to &plusmn;&frac12; pixel; tight, because each measured quantity enters once), the cell with the synchronisation lag's texture shift added to the disparity, the slope term (a horizontal misplacement read on the steepest slope of the wave), and their total with the surface's own motion over the lag. The shaded band is the preset's imaged range; the thin vertical is the range you chose; the vertical marker is the reach at the tolerance. Solid where every input is a literal or a box from a source; dotted where any input is a choice.</p>
      ${W.legendHtml({ exclude: [W.COMPUTED, W.REFUSED] })}
      <p class="sr-note" id="sr-source"></p>
    </div>
    <div class="sr-panel">
      <div><label for="sr-preset">rig</label><select id="sr-preset"><option value="leme2020">${esc(PR.leme2020.short)}</option><option value="nazare">${esc(PR.nazare.short)}</option></select></div>
      <div class="sr-in" id="sr-inputs"></div>
      <div><label for="sr-tol">tolerance, % of the wave height</label><input id="sr-tol" type="text" inputmode="decimal" value="10"></div>
      <div><label for="sr-R">range <span id="sr-Rv"></span></label><input id="sr-R" type="range"></div>
      <div class="sr-read">
        <div><div class="k">quantization cell</div><div class="v" id="r-cell"></div><div class="k" id="r-cell-note"></div></div>
        <div><div class="k">+ sync lag</div><div class="v" id="r-sync"></div><div class="k" id="r-sync-note"></div></div>
        <div><div class="k">slope term</div><div class="v" id="r-slope"></div><div class="k" id="r-slope-note"></div></div>
        <div><div class="k">surface motion</div><div class="v" id="r-vel"></div></div>
        <div class="full"><div class="k">total bound at this range</div><div class="v" id="r-total"></div></div>
      </div>
      <div class="sr-verdict" id="sr-verdict"></div>
    </div>
  </div>
</section>

<section class="wrap">
  <h2 class="t2">The Leme rig, re-read</h2>
  <p class="lede">Two Samsung Galaxy J5 Pro phones ${L.B.v} m apart, ${L.Hc.v} m above the water, imaging ${L.rangeLo}&ndash;${L.rangeHi} m of surf with a pressure gauge at ~${L.gaugeRange} m; ${L.T.v}-second swell of ${L.H.v} m. The paper gives the baseline, the height, the focal length and the sea; it does not give the pixel pitch of the 1080p video or the precision of its matches, so those are boxes, and the audio synchronisation is taken to the frame.</p>
  <div class="sr-paper">
    <div class="c"><div class="k">certified cell at the gauge, best corner</div><div class="v w-decided">${cm(F.bestAtGauge)}</div><div class="n">pitch ${nf(Number(L.best.p) * 1e6, 2)} &micro;m, &delta;d ${L.best.dd} px, perfect sync &mdash; nothing the geometry alone can beat at ${L.gaugeRange} m</div></div>
    <div class="c"><div class="k">bound at the gauge, worst corner of the box</div><div class="v w-chosen">${cm(F.worstAtGauge)}</div><div class="n">pitch ${nf(Number(L.worst.p) * 1e6, 2)} &micro;m, &delta;d ${L.worst.dd} px, half a frame of lag with ${L.utex.v} m/s of texture (the lag and the texture speed are chosen)</div></div>
    <div class="c"><div class="k">observed, Table 1</div><div class="v">${L.observed.rmse.map((x) => cm(x)).join(' &middot; ')}</div><div class="n">RMSE of the surface elevation against the pressure gauge over four 19-minute records; biases ${L.observed.bias.map((x) => (x * 100).toFixed(0) + ' cm').join(', ')}</div></div>
    <div class="c"><div class="k">quoted z-quantization</div><div class="v">${cm(L.quoted.zQuantization)}</div><div class="n">&sect;4: "0.9 mm, 9.9 mm, and 1.1 mm for the x, y and z-axes"; the range it holds at is not stated. The best-case cell at the near edge (${L.rangeLo} m) is ${cm(F.bestAtNear)}.</div></div>
  </div>
  <p class="sr-note">Read together: every observed RMSE lies between the best and worst corners of the budget, so the geometry with the paper's own numbers accounts for the deviation from the gauge without invoking anything else &mdash; and the disparity at the gauge is only ${nf(F.disparityAtGauge[0], 0)}&ndash;${nf(F.disparityAtGauge[1], 0)} pixels, which is why a pixel of matching error is ${cm(F.worstAtGauge)} of elevation there. The quoted quantization of ${cm(L.quoted.zQuantization)} is below what this model gives for any corner of the box at any range in the imaged area; the paper takes it from a formula in its reference [42] that we do not hold, so this is a number we could not reproduce, not one we refute.</p>
</section>

<section class="section"><div class="wrap">
  <div class="prose">
    <h2 class="t2">What is decided, and what is assumed</h2>
    <p>The model is the standard rectified pinhole pair with both cameras aimed at the surface point: Z = fB/d, Y = Zv/f, and a rotation by the pitch. Nothing in it is new; what is new is that the cell is an <em>enclosure</em> &mdash; each measured quantity appears once in the elevation and once in the range, so the interval evaluation over the pixel box is tight, and it holds over the whole of a box input such as an unstated pixel pitch. The three added terms are bounds, not cells: the texture the matcher correlates is taken to move with the water (its orbital speed) plus a texture speed you choose; the surface rises or falls by at most &omega;H/2 over the lag; a horizontal misplacement is read on the steepest slope, kH/2. Deep-water dispersion gives &omega; and k from the period. A total is an interval and its upper end is what the verdict uses.</p>
    <p><strong>It bounds geometry, not matching.</strong> A matcher can fail outright on glare, foam or a textureless surface, and no error budget bounds a failed match; the disparity precision you enter is the precision of the matches that succeed. The pitch of the optical axis is set by aiming at the point &mdash; a point at the edge of a wide field of view sits off-axis and its cell differs. Lens distortion, calibration error and refraction are not in the budget. The Nazar&eacute; preset is a scenario with every number chosen, in the shape of the Big Wave Tracker, to be replaced by the rig's own.</p>
    <p class="mono" style="font-size:var(--text-eyebrow); color:var(--ink-4); line-height:2; margin-top:var(--s-5);">
    node instruments/stereo/battery.js<br>
    node playground/build.js</p>
  </div>
</div></section>`;

function build(OUTDIR) {
  const dir = path.join(OUTDIR, 'stereo-reach');
  fs.mkdirSync(dir, { recursive: true });
  const json = JSON.stringify(SPEC).replace(/</g, '\\u003c');
  const html = page({
    title: 'How far can two cameras bound a wave? — cert-machine',
    desc: 'The error budget of a stereo-video wave rig as enclosures: the quantization cell, the synchronisation lag, the slope, computed in interval arithmetic in your tab for the Leme 2020 smartphone rig and any rig you dial in; the range at which the bound first exceeds a tolerance.',
    root: '../', here: 'instruments',
    head: `<style>${CSS}</style>`,
    body: `<main>${body}</main>`,
    script: `<script id="sr-spec" type="application/json">${json}</script>\n<script>window.IV = (function () { const module = { exports: {} }; ${IVSRC.replace(/'use strict';/, '')}\n return module.exports; })();</script>\n<script>${BUDGET}</script>\n<script>${PRESETS}</script>\n<script>${APP}</script>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, bestAtGauge: F.bestAtGauge, worstAtGauge: F.worstAtGauge, bestAtNear: F.bestAtNear };
}

/* the card: the four curves of the Leme rig, drawn at build */
function cardArt() {
  const inp = PR.toIntervals(L, Bd, TR.PI);
  const S0 = 560, ML = 40, MB = 40;
  const grid = []; for (let x = 4; x <= 80; x *= 1.06) grid.push(x);
  const rows = grid.map((R) => ({ R, c: Bd.cell(inp, Bd.lit(String(R))) }));
  const px = (R) => ML + (Math.log10(R) - Math.log10(4)) / (Math.log10(80) - Math.log10(4)) * (S0 - ML - 20);
  const py = (v) => S0 - MB - (Math.log10(Math.max(v, 1e-3)) + 3) / 3 * (S0 - MB - 30);
  const pathOf = (pick) => rows.map((r, i) => (i ? 'L' : 'M') + px(r.R).toFixed(1) + ' ' + py(pick(r.c)).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${S0} ${S0}" class="shape" role="img" aria-label="Four curves rising with range on log axes: the quantization cell of the Leme rig, the cell with the synchronisation lag, the slope term, and their total.">`
    + `<path d="${pathOf((c) => c.terms.cell)}" fill="none" stroke="currentColor" stroke-width="2" stroke-opacity="0.9"/>`
    + `<path d="${pathOf((c) => c.terms.slope)}" ${W.attrs(W.CHOSEN, { width: 1.6 })}/>`
    + `<path d="${pathOf((c) => c.terms.cellWithSync)}" ${W.attrs(W.CHOSEN, { width: 1.6 })}/>`
    + `<path d="${pathOf((c) => c.total[1])}" ${W.attrs(W.CHOSEN, { width: 2.4 })}/>`
    + `<line x1="${ML}" y1="${S0 - MB}" x2="${S0 - 20}" y2="${S0 - MB}" stroke="currentColor" stroke-opacity="0.35" stroke-width="1"/>`
    + '</svg>';
}

module.exports = { build, cardArt, facts: { bestAtGauge: F.bestAtGauge, worstAtGauge: F.worstAtGauge, gauge: L.gaugeRange } };
