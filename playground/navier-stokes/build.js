/* build.js — site/instruments/navier-stokes/index.html
   playground/navier-stokes/ · cert-machine · 2026-09-09

   The instrument beside the report. /reports/navier-stokes.html decides whether OpenAI's
   proof stands; this page lets you turn the object it is about.

   THE MOVE, the interferometer's one door along: that page draws the black hole as the SET
   of skies the data allow rather than the photograph a prior picked. This one draws the
   singularity as the OBJECT THE PROOF CONSTRUCTS rather than the fluid simulation everyone
   else renders — because a simulation is the one thing here that could not be certified,
   and we do not show what we cannot back.

   What the page does that no fluid demo can: every verdict about the smallness parameter h
   is an exact rational inequality decided in the reader's tab with BigInt, and dragging h
   walks the construction into and out of two classical exclusions that close on h = 0 from
   opposite sides. That dichotomy is this audit's own finding and it is drawn here.

   Reads playground/navier-stokes/out/scene.json, which node scene.js writes from the audit's
   records. Nothing on this page is retyped from the report. */
'use strict';
const fs = require('fs'), path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));

const SCENE = path.join(HERE, 'out', 'scene.json');
if (!fs.existsSync(SCENE)) { console.error('navier-stokes: no scene.json — run node playground/navier-stokes/scene.js'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(SCENE, 'utf8'));
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');

const CSS = `
.ns-wrap{max-width:min(1180px,94vw);margin:0 auto;padding:0 var(--gutter);}
.ns-hero{padding:clamp(3rem,8vh,5.5rem) 0 1.5rem;}
.ns-hero h1{font-family:var(--font-sans);font-size:var(--text-1);font-weight:var(--weight-display);letter-spacing:var(--track-title);line-height:var(--leading-tight);margin:0 0 var(--s-4);max-width:20ch;}
.ns-hero .deck{color:var(--ink-3);font-size:var(--text-body);line-height:var(--leading-body);max-width:74ch;margin:0;}
.ns-eyebrow{font-family:var(--font-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin-bottom:var(--s-4);}
.ns-grid{display:grid;grid-template-columns:1fr 340px;gap:var(--s-5);align-items:start;}
@media (max-width:900px){.ns-grid{grid-template-columns:1fr;}}
.ns-stage{position:relative;background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius-m);overflow:hidden;}
#ns-core{display:block;width:100%;height:min(60vh,520px);}
.ns-side{display:flex;flex-direction:column;gap:var(--s-4);}
.ns-card{background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius-m);padding:var(--s-4);}
.ns-card h3{font-family:var(--font-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin:0 0 var(--s-3);font-weight:400;}
.ctl{display:flex;flex-direction:column;gap:6px;margin-bottom:var(--s-4);}
.ctl label{font-family:var(--font-mono);font-size:var(--text-small);color:var(--ink-3);display:flex;justify-content:space-between;gap:8px;}
.ctl label b{color:var(--ink);font-weight:500;}
input[type=range]{width:100%;accent-color:var(--ink);background:transparent;}
.seg{display:flex;gap:0;border:1px solid var(--border);border-radius:var(--radius-m);overflow:hidden;}
.seg button{flex:1;background:transparent;border:0;color:var(--ink-3);font-family:var(--font-mono);font-size:var(--text-small);padding:8px 6px;cursor:pointer;}
.seg button.on{background:var(--ink);color:var(--bg);}
.chk{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:var(--text-small);color:var(--ink-3);margin-bottom:6px;cursor:pointer;}
.pill{display:inline-flex;gap:6px;flex-wrap:wrap;}
.pill button{background:transparent;border:1px solid var(--border);color:var(--ink-3);font-family:var(--font-mono);font-size:11px;padding:3px 7px;border-radius:var(--radius-pill);cursor:pointer;}
.pill button:hover{border-color:var(--border-strong);color:var(--ink);}
.nrow{display:grid;grid-template-columns:74px 62px 1fr;gap:4px 8px;font-family:var(--font-mono);font-size:11px;padding:4px 0;border-top:1px solid var(--border);color:var(--ink-4);align-items:baseline;}
.nrow .nw{grid-column:1/-1;font-size:10px;color:var(--ink-5);line-height:1.35;}
.nrow:first-child{border-top:0;}
.nrow .ns{color:var(--ink-2);} .nrow .ne{color:var(--ink-3);} .nrow .nv{color:var(--ink);text-align:right;}
.nrow sup{font-size:9px;}
.ns-sec{padding:clamp(2.5rem,6vh,4rem) 0;border-top:1px solid var(--border);}
.ns-sec h2{font-family:var(--font-sans);font-size:var(--text-2);font-weight:var(--weight-title);letter-spacing:var(--track-title);margin:0 0 var(--s-3);}
.ns-sec p{color:var(--ink-3);font-size:var(--text-body);line-height:var(--leading-body);max-width:74ch;margin:0 0 var(--s-4);}
.ns-sec p b{color:var(--ink-2);font-weight:500;} .ns-sec p em{color:var(--ink-2);font-style:italic;}
.two{display:grid;grid-template-columns:1fr 1fr;gap:var(--s-5);}
@media (max-width:860px){.two{grid-template-columns:1fr;}}
svg.fig{width:100%;height:auto;display:block;background:var(--bg-raised);border:1px solid var(--border);border-radius:var(--radius-m);}
svg.fig .ax{font-family:var(--font-mono);font-size:9px;fill:var(--ink-5);}
svg.fig .lb{font-family:var(--font-mono);font-size:10px;fill:var(--ink-3);}
svg.fig .lb.strong{fill:var(--ink);}
.crow{display:grid;grid-template-columns:150px 1fr;gap:2px 14px;padding:10px 0;border-top:1px solid var(--border);}
.crow .cv{font-family:var(--font-mono);font-size:10.5px;letter-spacing:.06em;color:var(--bg);background:var(--ink);border-radius:3px;padding:2px 6px;justify-self:start;align-self:start;}
.crow.bad .cv{background:var(--ink-4);color:var(--bg);}
.crow.off{opacity:.42;} .crow.off .cv{background:transparent;color:var(--ink-5);border:1px solid var(--border);}
.crow .cn{font-size:var(--text-small);color:var(--ink-2);}
.crow .cs,.crow .ch{grid-column:2;font-size:12px;color:var(--ink-4);line-height:1.5;}
.crow .ch{color:var(--ink-3);}
.crow .ex{font-family:var(--font-mono);font-size:11px;color:var(--ink-5);}
.dich{border:1px solid var(--border);border-radius:var(--radius-m);padding:var(--s-4);margin:var(--s-4) 0;background:var(--surface);}
.dich b{display:block;color:var(--ink);font-size:var(--text-body);font-weight:500;line-height:1.5;margin-bottom:6px;}
.dich span{color:var(--ink-3);font-size:var(--text-small);line-height:1.6;}
.dich.no{border-color:var(--border-strong);background:linear-gradient(180deg,rgba(246,246,248,0.05),transparent);}
.badge{display:inline-block;font-family:var(--font-mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-4);border:1px solid var(--border);border-radius:var(--radius-pill);padding:2px 8px;margin-right:6px;}
.badge.dec{color:var(--bg);background:var(--ink);border-color:var(--ink);}
.foot-note{color:var(--ink-4);font-size:var(--text-small);line-height:1.6;max-width:78ch;}
`;

const nf = (x) => Number(x).toLocaleString('en-US');
const D = S.dichotomy;

const body = `
<main>
<div class="ns-wrap ns-hero">
  <div class="ns-eyebrow">cert-machine · instruments · the object a Millennium proof constructs</div>
  <h1>Turn the singularity.</h1>
  <p class="deck">On 2026-09-08 OpenAI published a proof that a smooth force can drive a viscous fluid from rest to
  infinite speed in finite time. Everyone else will render a fluid simulation of it. A simulation is the one thing
  here that cannot be certified, so this page does not show one. It shows <b>the object the proof actually builds</b> —
  a vortex whose core shrinks like τ<sup>1/2</sup> across and τ<sup>1/2−h</sup> along while its speed grows like
  τ<sup>−1/2−h</sup> — and it lets you move the one number the whole construction hangs on. Every verdict below about
  that number is an exact rational inequality, decided in your tab in integer arithmetic.
  <a href="../../reports/navier-stokes.html">The audit that backs it is next door.</a></p>
</div>

<div class="ns-wrap ns-grid">
  <div class="ns-stage"><canvas id="ns-core" aria-label="The collapsing core of the constructed singularity, drawn in the physical plane with its streamlines, its pulse annulus and the funnel it traces in space-time."></canvas></div>
  <div class="ns-side">
    <div class="ns-card">
      <h3>the two dials</h3>
      <div class="ctl">
        <label>τ = 1 − t, time left <b id="ns-tau">10^-3.00</b></label>
        <input id="ns-tau-r" type="range" min="-12" max="-0.05" step="0.01" value="-3">
      </div>
      <div class="ctl">
        <label>h, the smallness parameter <b id="ns-h">1/100</b></label>
        <input id="ns-h-r" type="range" min="0" max="300" step="1" value="10">
        <div class="pill">
          <button data-seth="0">h = 0</button>
          <button data-seth="10">1/100 (the paper)</button>
          <button data-seth="167">just past 1/6</button>
          <button data-seth="60">3/50</button>
        </div>
      </div>
      <div class="seg" id="ns-view">
        <button data-view="physical" class="on">physical</button>
        <button data-view="similarity">similarity</button>
      </div>
      <div style="height:10px"></div>
      <label class="chk"><input type="checkbox" id="ns-axisym"> pretend the flow is axisymmetric</label>
      <label class="chk"><input type="checkbox" id="ns-trails" checked> draw the funnel it traces</label>
      <label class="chk"><input type="checkbox" id="ns-spin" checked> animate the pulses</label>
    </div>
    <div class="ns-card">
      <h3>every scale, at this τ and this h</h3>
      <div id="ns-nums"></div>
      <p class="foot-note" id="ns-el10" style="margin:var(--s-3) 0 0;font-size:11.5px"></p>
    </div>
  </div>
</div>

<div class="ns-wrap ns-sec">
  <h2>The window h has to live in</h2>
  <p>The paper prints <b>0 &lt; h &lt; 1/100</b> and never says where the bound comes from. It comes from two places,
  and they are not the same place. Below, the line is h; the two shaded regions are what forbids it.</p>
  <svg class="fig" id="ns-window" role="img" aria-label="A number line for h from 0 to 0.3, with the type-I exclusion closing it at zero and the loss of integrable dissipation closing it at one sixth."></svg>
  <p style="margin-top:var(--s-4)"><span class="badge dec">decided</span> Each row below is a rational inequality in h with integer
  numerators. Your tab decides it with BigInt and never with a float, so the boundary cases — h = 0 and h = 1/6 exactly —
  are decided as equalities rather than approached. <b id="ns-met">—</b> of the classical conditions are met at the h you have set.</p>
  <div id="ns-criteria"></div>
</div>

<div class="ns-wrap ns-sec">
  <h2>The dichotomy the paper never states</h2>
  <p>${esc(D.claim)} Switch the flow to axisymmetric in the panel above and move h: at zero, one exclusion fires; anywhere
  above it, the other does.</p>
  <div id="ns-dich" class="dich"></div>
  <div class="two">
    <div>
      <svg class="fig" id="ns-swirl" role="img" aria-label="The swirl of the construction against the ceiling the maximum principle puts on a forced axisymmetric flow started from rest: a rising line crossing a flat one."></svg>
      <p class="foot-note" style="margin-top:8px"><b>At h = 0</b> ${esc(D.atZero)} <b>Above it</b> ${esc(D.above)}</p>
    </div>
    <div>
      <svg class="fig" id="ns-ext" role="img" aria-label="The exterior swirl profile H of Z, computed by quadrature in the browser, falling monotonically."></svg>
      <p class="foot-note" style="margin-top:8px"><span class="badge">computed</span> The one field in the whole construction with a closed form: the
      exterior swirl solves the radial heat equation exactly. H(Z) is integrated in your tab and the residual of its
      differential equation (A.37) at Z = 1 is <b id="ns-res">—</b>. The battery beside the report checks the same
      integral to 25 digits.</p>
    </div>
  </div>
  <p style="margin-top:var(--s-5)">${esc(D.so)}</p>
  <p class="foot-note">${esc(D.hypotheses)}</p>
</div>

<div class="ns-wrap ns-sec">
  <h2>The pulse, and why it has to stop growing</h2>
  <p>The core alone cannot balance its own momentum. The missing stress is supplied by two families of oscillatory
  pulses which the background shear amplifies — and the same shear tilts their wavevectors, shortening the radial
  wavelength until viscosity overtakes the amplification. The paper chooses the initial wavelength so that growth wins
  first and damping wins later. <span class="badge">computed</span> Below, that competition is integrated in your tab by
  fourth-order Runge–Kutta from the WKB amplitude equation; drag the wavenumber and watch the window open and close.</p>
  <div class="two">
    <div><svg class="fig" id="ns-pulse" role="img" aria-label="The pulse amplitude against slot time: a rise while the shear feeds it, then a fall once the shortening wavelength lets viscosity win."></svg></div>
    <div>
      <div class="ns-card">
        <h3>the pulse</h3>
        <div class="ctl"><label>initial radial wavenumber k₀ <b id="ns-k0-v">26</b></label><input id="ns-k0" type="range" min="6" max="60" step="1" value="26"></div>
        <div class="ctl"><label>background shear σ <b id="ns-shear-v">1.00</b></label><input id="ns-shear" type="range" min="0.3" max="2.5" step="0.05" value="1"></div>
        <p class="foot-note" style="margin:0">peak amplification <b id="ns-peak">—</b></p>
      </div>
      <p class="foot-note" style="margin-top:var(--s-4)">This reproduces the shape of the paper's own Figure 3(b) from the
      mechanism rather than copying the figure. It is the honest minimum: one wavevector, one amplitude, a shear that
      tilts and a viscosity that damps. The paper's construction is this competition carried out on infinitely many
      pulses at once, on scales that shrink with the core.</p>
    </div>
  </div>
</div>

<div class="ns-wrap ns-sec">
  <h2>What backs each mark</h2>
  <p>The house rule is that a page says what decides it. Three kinds of mark appear above and the page never mixes them.</p>
  <div class="crow"><div class="cv">DECIDED</div><div class="cn">the criteria board, the window on h, the dichotomy</div><div class="ch">${esc(S.backing.criteria.how)}</div></div>
  <div class="crow"><div class="cv">COMPUTED</div><div class="cn">the exterior profile, the pulse, the axis profile</div><div class="ch">${esc(S.backing.exterior.how)} — ${esc(S.backing.pulse.how)}</div></div>
  <div class="crow bad"><div class="cv">DRAWN</div><div class="cn">the core picture and its streamlines</div><div class="ch">${esc(S.backing.core.how)}</div></div>
  <p style="margin-top:var(--s-5)" class="foot-note">The construction is OpenAI's, <i>Finite time blowup for Navier–Stokes</i>,
  2026-09-08, ${nf(S.paper.pages)} pages, sha256 ${esc(S.paper.sha256.slice(0, 16))}…. The audit next door built its
  ${nf(S.build.modules)}-module Lean proof on one laptop in ${nf(S.build.minutes)} minutes, asked the kernel what it rests
  on (${esc(S.build.axioms.join(', '))}), and had Comparator and a second, independently written kernel accept both
  theorems. The probe battery behind these curves is ${esc(S.probes.scripts)} scripts with ${esc(String(S.probes.reds))} red
  controls, all firing. Nothing on this page is certified — <b>a drawing is not a proof, and a decided inequality about an
  exponent is not a decided theorem about a fluid.</b> What is certified is next door, and it says so there.</p>
</div>
</main>`;

function build() {
  const dir = path.join(ROOT, 'site', 'instruments', 'navier-stokes');
  fs.mkdirSync(dir, { recursive: true });
  const html = page({
    title: 'Turn the singularity — cert-machine',
    desc: 'The object OpenAI\'s Navier–Stokes proof constructs, drawn and turned: a self-similar core that collapses as you move time, the smallness parameter h on a line with the two classical exclusions that close on it from opposite sides, every verdict an exact rational inequality decided in your tab.',
    root: '../', here: 'instruments',
    head: `<style>${G.css()}${CSS}</style>`,
    body,
    script: `<script type="application/json" id="ns-scene">${JSON.stringify(S).replace(/</g, '\\u003c')}</script>\n<script>${APP}</script>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length };
}

/* the card: the core's funnel, static, at the paper's h */
function cardArt() {
  const w = 560, hh = 560, cx = w / 2, cy = hh / 2, out = [];
  out.push(`<svg viewBox="0 0 ${w} ${hh}" class="shape" role="img" aria-label="The funnel a self-similar collapsing vortex core traces in space-time: nested rectangles shrinking toward a point, wider than they are tall by a ratio that grows.">`);
  for (let k = 0; k < 22; k++) {
    const t = Math.pow(10, -0.16 * k);
    const lr = Math.sqrt(2 * 2.6 * t) * 150, lz = Math.pow(t, 0.49) * 210;
    if (lr < 0.4) break;
    if (lz > 262 || lr > 262) continue;   /* the first few rectangles are larger than the frame */
    const o = (0.10 + 0.62 * (1 - k / 22)).toFixed(3);
    out.push(`<rect x="${(cx - lr).toFixed(1)}" y="${(cy - lz).toFixed(1)}" width="${(2 * lr).toFixed(1)}" height="${(2 * lz).toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity="${o}" stroke-width="1.2"/>`);
  }
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, r0 = 236;
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 0.86;
    const x1 = cx + Math.cos(a + 1.5) * r0 * 0.10, y1 = cy + Math.sin(a + 1.5) * r0 * 0.10;
    out.push(`<path d="M${x0.toFixed(1)},${y0.toFixed(1)} Q${(cx + Math.cos(a + 0.8) * r0 * 0.55).toFixed(1)},${(cy + Math.sin(a + 0.8) * r0 * 0.48).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity="0.30" stroke-width="1"/>`);
  }
  out.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="currentColor"/>`);
  out.push('</svg>');
  return out.join('');
}

module.exports = { build, cardArt, facts: { criteria: S.criteria.length, exponents: S.exponents.length, paper: S.paper.sha256.slice(0, 8) } };
