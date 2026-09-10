/* build.js — site/instruments/navier-stokes/index.html
   playground/navier-stokes/ · cert-machine · 2026-09-09

   ONE CANVAS, THE SIZE OF THE WINDOW. The instrument beside the report: /reports/navier-
   stokes.html decides whether OpenAI's proof stands; this is the object it is about, turned.

   The interferometer draws the black hole as the SET of skies the data allow rather than the
   photograph a prior picked. This is that move one door along — everyone else will render a
   fluid simulation of the blowup, and a simulation is the one thing here nobody can certify,
   so this renders the object the proof CONSTRUCTS. The prose that explains it is behind a
   button; the default state of the page is the picture.

   THE SHELL IS NOT USED, deliberately: design/shell.js opens a document flow with a nav band
   and a footer, and this page is a viewport rather than a document. It carries the site's
   links as an overlay so a reader can still leave, and nothing else.

   Reads playground/navier-stokes/out/scene.json (node scene.js), written from the audit's own
   records. Nothing here is retyped from the report. */
'use strict';
const fs = require('fs'), path = require('path');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { esc } = require(path.join(PG, 'design', 'shell.js'));
const NAV = require(path.join(ROOT, 'design', 'nav.js'));
const GRAMMAR = require(path.join(ROOT, 'design', 'grammar.js'));

const SCENE = path.join(HERE, 'out', 'scene.json');
if (!fs.existsSync(SCENE)) { console.error('navier-stokes: no scene.json — run node playground/navier-stokes/scene.js'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(SCENE, 'utf8'));
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const OVERLAY = fs.readFileSync(path.join(PG, 'design', 'overlay.css'), 'utf8');
const nf = (x) => Number(x).toLocaleString('en-US');
const MONO = "'JetBrains Mono var','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

/* THE OVERLAY GRAMMAR IS THE INTERFEROMETER'S, and it is now shared rather than copied:
   playground/design/overlay.css defines #stage, .ov, .ov-title, .ov-foot, .rd, .ov-panel, .pt,
   .grp, .eyebrow, .hr-thin, .ctrl, .row-btns, .chip, .note-sm, .sheet. What follows is only
   what this instrument adds. A rule defined twice diverges. */
/* The base layer the shell would have given us. This page does not use the shell (it is a
   viewport, not a document), so it declares the same three things the shell declares and
   nothing more: the reset, the ground and the type. */
const CSS = OVERLAY + `
*,*::before,*::after{box-sizing:border-box;}
html,body{height:100%;overflow:hidden;}
/* THE PANEL HIDES WITHOUT LEAVING THE PAGE. The shared grammar slides it out with
   translateX(100%), which is fine on a page that never starts hidden — the interferometer
   never does. This one starts hidden on a phone, and a translated box outside the viewport
   extends the document: the layout ruler read 330px of page overflow at 1440 and a whole
   viewport at 390, and was right to. So here it fades and steps 8px instead, which overflows
   nothing and needs no clipping wrapper. */
body.ov-panel-hidden .ov-panel{transform:none;opacity:0;visibility:hidden;pointer-events:none;}
body{margin:0;background:var(--bg);color:var(--ink-2);font-family:var(--font-sans);
  font-size:var(--text-body);line-height:var(--leading-body);-webkit-font-smoothing:antialiased;}
h1{margin:0;font-family:var(--font-sans);}
#stage{background:var(--bg);}
.ov-title h1{color:var(--ink);}
.ov-verdict{left:50%;transform:translateX(-50%);top:clamp(4.6rem,9vh,6.4rem);max-width:min(62ch,66vw);text-align:center;
  opacity:0;transition:opacity var(--dur-med) var(--ease-out);}
.ov-verdict.on{opacity:1;}
.ov-verdict .tag{display:inline-block;font-family:var(--font-mono);font-size:9px;letter-spacing:.2em;
  text-transform:uppercase;background:var(--ink);color:var(--bg);border-radius:var(--radius-s);padding:2px 9px;margin-bottom:var(--s-2);}
.ov-verdict p{font-size:var(--text-small);line-height:1.6;color:var(--ink-2);background:color-mix(in srgb,var(--bg) 82%,transparent);
  padding:var(--s-2) var(--s-3);border-radius:var(--radius-s);display:inline-block;margin:0;}
.ov-transport{left:50%;transform:translateX(-50%);bottom:clamp(1rem,3vh,2rem);display:flex;align-items:center;gap:var(--s-3);
  background:color-mix(in srgb,var(--bg-raised) 86%,transparent);border:1px solid var(--border);
  border-radius:var(--radius-pill);padding:6px 12px;backdrop-filter:blur(14px);}
.ov-transport input[type=range]{width:min(34vw,340px);accent-color:var(--ink-2);}
.ov-transport .k{font-family:var(--font-mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-5);}
#play{width:30px;height:26px;padding:0;font-size:11px;font-family:var(--font-mono);background:transparent;
  border:1px solid var(--border-strong);color:var(--ink-3);border-radius:var(--radius-pill);cursor:pointer;}
#play:hover{color:var(--ink);}
.ov-chips{left:34%;right:min(330px,88vw);bottom:clamp(4.2rem,9vh,5.4rem);display:flex;
  flex-wrap:wrap;gap:var(--s-2);justify-content:flex-end;}
body.ov-panel-hidden .ov-chips{right:clamp(1rem,3vw,2.5rem);}
.ov-foot{max-width:40ch;}
.ov-foot .rd{gap:var(--s-2) var(--s-5);}

.ov-why{left:50%;transform:translateX(-50%);bottom:clamp(4.2rem,9vh,5.4rem);width:min(60ch,72vw);
  background:color-mix(in srgb,var(--bg-raised) 96%,transparent);border:1px solid var(--border-strong);
  border-radius:var(--radius-m);padding:var(--s-4);opacity:0;transition:opacity var(--dur-fast) var(--ease-out);cursor:pointer;}
.ov-why.on{opacity:1;}
.ov-why b{display:block;font-size:var(--text-small);color:var(--ink);margin-bottom:var(--s-2);}
.ov-why span{display:block;font-size:var(--text-eyebrow);line-height:1.6;color:var(--ink-4);}
.ov-why code{display:block;margin-top:var(--s-2);font-family:var(--font-mono);font-size:var(--text-eyebrow);
  color:var(--ink);background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-s);padding:6px 8px;}
.erow{display:grid;grid-template-columns:58px 70px 56px;gap:var(--s-2);padding:3px 0;border-top:1px solid var(--border);
  font-family:var(--font-mono);font-size:9.5px;align-items:baseline;}
.erow .s{color:var(--ink-2);} .erow .e{color:var(--ink-4);} .erow .v{color:var(--ink);text-align:right;}
.spk{width:100%;height:40px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-s);margin-top:var(--s-2);}

/* THE MECHANISM, in the left gutter between the title and the foot — the one column of the
   drawing where nothing else sits. It is the only overlay on this page that is a DIAGRAM
   rather than a readout, so it is SVG in the document (crisp type, real tokens, measurable by
   the ruler) and not canvas: it changes when you turn a dial, never when the clock ticks. */
.ov-mech{left:clamp(1rem,3vw,2.5rem);top:clamp(18.5rem,35vh,22rem);width:318px;
  background:color-mix(in srgb,var(--bg) 90%,transparent);border:1px solid var(--border);
  border-radius:var(--radius-m);padding:8px;backdrop-filter:blur(9px);}
.ov-mech .hd{display:flex;align-items:baseline;justify-content:space-between;gap:var(--s-2);margin-bottom:4px;}
.ov-mech .key{font-family:var(--font-mono);font-size:8px;letter-spacing:.04em;line-height:1.5;color:var(--ink-5);margin:3px 0 5px;}
.ov-mech .hd .eyebrow{font-size:9px;}
.tagx{font-family:var(--font-mono);font-size:8.5px;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap;
  border:1px solid var(--border-strong);border-radius:var(--radius-pill);padding:1px 7px;color:var(--ink-3);}
.tagx.on{background:var(--ink);border-color:var(--ink);color:var(--bg);}
.ov-mech .fig svg{display:block;width:100%;height:auto;}
.ov-mech .lb,.ov-mech .lb2{paint-order:stroke;stroke:var(--bg);stroke-width:2.5px;stroke-linejoin:round;}
.ov-mech .lb{font-family:var(--font-mono);font-size:7.5px;fill:var(--ink-3);}
.ov-mech .lb2{font-family:var(--font-mono);font-size:9px;fill:#f6f6f8;}
.ov-mech .cap{margin-top:5px;min-height:27px;font-family:var(--font-mono);font-size:9px;line-height:1.5;color:var(--ink-4);}
.ov-mech .cap b{color:var(--ink-2);font-weight:500;}
${GRAMMAR.css('.ov-mech')}
/* it needs its own column and 300px of height; below either it hides rather than collide */
@media (max-width:1180px),(max-height:790px){.ov-mech{display:none;}}
@media (max-width:820px){
  .ov-title{max-width:88vw;} .ov-title p{display:none;}
  .ov-foot{display:none;}
  .ov-chips{display:none;}
  .ov-verdict{top:auto;bottom:calc(7.5rem + 90px);max-width:92vw;}
  .ov-why{width:94vw;bottom:5.2rem;}
  .ov-transport input[type=range]{width:44vw;}
  .ov-panel{width:100vw;padding-top:4.4rem;}
}
`;

const D = S.dichotomy;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Turn the singularity — cert-machine</title>
<meta name="description" content="${esc('The object OpenAI\u2019s Navier\u2013Stokes proof constructs, drawn at full size and turned: iso-speed contours of a self-similar vortex core collapsing in real time, with every verdict about the parameter it hangs on decided in your tab in exact integer arithmetic.')}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="Turn the singularity">
<meta property="og:description" content="A Millennium proof\u2019s singularity, drawn as the object it is rather than simulated.">
<meta property="og:type" content="website">
<link rel="stylesheet" href="../design/tokens.css">
<style>${CSS}</style>
</head>
<body>
${NAV.navHtml({ here: 'instruments', root: '../../' })}
<canvas id="stage" aria-label="Iso-speed contours of a self-similar vortex core collapsing toward a point, with the meridional streamlines, the core's box and the dotted pulse annulus, all shrinking as the time remaining falls."></canvas>

<div class="ov ov-title">
  <div class="eyebrow">cert-machine / instruments &nbsp;·&nbsp; the object a Millennium proof constructs</div>
  <h1>Turn the singularity.</h1>
  <p>A smooth force drives a fluid from rest to infinite speed in finite time. This is the object
  the proof builds — drawn, not simulated.</p>
</div>

<div class="ov ov-verdict" id="verdict"></div>
<div class="ov ov-why" id="why"></div>
<div class="ov ov-chips" id="chips"></div>

<div class="ov ov-mech" id="mech">
  <div class="hd"><span class="eyebrow">what the pulses are for</span><span class="tagx" id="mech-verdict">—</span></div>
  <div class="fig" id="mech-cone"></div>
  <div class="key">hatched: the cone (4.22) &nbsp;·&nbsp; faint rim: what the waves reach</div>
  <div class="fig" id="mech-supply"></div>
  <div class="key">curve: the stress needed &nbsp;·&nbsp; bands: the two shares</div>
  <div class="cap" id="mech-line"></div>
</div>

<div class="ov ov-foot">
  <div class="rd">
    <div class="item"><span class="k">time left</span><span class="v" id="h-tau">—</span></div>
    <div class="item"><span class="k">zoom</span><span class="v" id="h-zoom">—</span></div>
    <div class="item"><span class="k">speed |u|</span><span class="v" id="h-u">—</span></div>
    <div class="item"><span class="k">ℓz / ℓr</span><span class="v" id="h-asp">—</span></div>
  </div>
  <div class="rd">
    <div class="item"><span class="k">h</span><span class="v" id="h-h">—</span></div>
    <div class="item"><span class="k">criteria met</span><span class="v" id="h-met">—</span></div>
    <div class="item"><span class="k">ten times longer at</span><span class="v" id="h-10">—</span></div>
    <div class="item"><span class="k">fps</span><span class="v" id="h-fps">—</span></div>
  </div>
  <div class="cap">Click any verdict to see the arithmetic that decided it.</div>
  <div class="src">nothing here is gated · the audit that is: <a href="../../reports/navier-stokes.html">/reports/navier-stokes.html</a></div>
</div>

<div class="ov ov-transport">
  <button id="play" aria-label="play or pause">❚❚</button>
  <span class="k">τ = 1 − t</span>
  <input id="sc" type="range" min="-13" max="-0.15" step="0.005" value="-1" aria-label="time remaining before the singularity">
  <span class="k">→ 0</span>
</div>

<button class="pt" id="pt">controls</button>

<aside class="ov-panel">
  <div class="grp">
    <span class="eyebrow">the one control that matters</span>
    <div class="ctrl"><label for="hs">h, the smallness parameter</label><output id="hsOut">1/100</output>
      <input type="range" id="hs" min="0" max="300" step="1" value="10"></div>
    <div class="row-btns">
      <button data-h="0">0</button><button data-h="10">1/100</button>
      <button data-h="60">3/50</button><button data-h="167">past 1/6</button>
    </div>
    <div class="note-sm">The paper prints 0 &lt; h &lt; 1/100 and never says where the bound comes
    from. It comes from two places: below zero the axisymmetric Liouville theorems exclude the flow,
    at 1/6 the dissipation stops being integrable. Every verdict along the foot is a rational
    inequality in h, decided here in integers.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">what the pulses are for</span>
    <div class="note-sm" style="margin-top:0">The core alone does not solve Navier–Stokes. §5 leaves a
    residual equal to −div(annular stress) plus a flat remainder; that stress is what the WAVES must
    produce. It is producible only if it lies in a cone (4.22)/(4.23), and then Proposition 7.5 turns it
    into two <b>positive</b> squared amplitudes whose square roots are the real wave amplitudes. Turn the
    stress out of the cone and one of them goes negative: no real pair supplies it, and nothing cancels
    the residual.</div>
    <div class="ctrl" style="margin-top:var(--s-3)"><label for="m-d">stress direction s</label><output id="m-dOut">3/10</output>
      <input type="range" id="m-d" min="-1600" max="1600" step="5" value="300"></div>
    <div class="ctrl"><label for="m-s">cone slope m</label><output id="m-sOut">9/10</output>
      <input type="range" id="m-s" min="150" max="2000" step="5" value="900"></div>
    <div class="ctrl"><label for="m-t">shear tilt ts</label><output id="m-tOut">1/4</output>
      <input type="range" id="m-t" min="-900" max="900" step="5" value="250"></div>
    <div class="rd" style="margin-top:var(--s-3)">
      <div class="item"><span class="k">vs = 2 + 2/m²</span><span class="v" id="m-vs">—</span></div>
      <div class="item"><span class="k">cone: |s| &lt;</span><span class="v" id="m-slope">—</span></div>
      <div class="item"><span class="k">waves reach</span><span class="v" id="m-wave">—</span></div>
    </div>
    <div class="note-sm">The wedge is turned by its slope m rather than by the paper's vs, because
    m = √(2/(vs − 2)) is what the drawing shows and vs = 2 + 2/m² is then an exact rational — so both
    crossings are equalities, not limits. ts rotates the wedge (the frame change of (4.23) has
    determinant 1 + ts², so it cannot fold it). The outer, faint wedge is what two real amplitudes
    reach; the gap to the hatched one is the margin η<sub>c</sub> = ${esc(S.mechanism.etaC.n + '/' + S.mechanism.etaC.d)} of Proposition 7.5's
    proof, which absorbs the errors of (7.28). <b>Decided</b> in integers. The stress path itself is
    drawn: a bump vanishing at both annular edges with a direction that turns across them.
    <a href="../../reports/navier-stokes.html">The audit is next door.</a></div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">render</span>
    <div class="row-btns">
      <button data-mode="both">both</button>
      <button data-mode="stress">the stress</button>
      <button data-mode="contour">contour</button>
      <button data-mode="stream">stream</button>
      <button data-mode="stipple">stipple</button>
    </div>
    <div class="ctrl" style="margin-top:var(--s-3)"><label for="m-l">contour levels</label><output id="m-lOut">16</output>
      <input type="range" id="m-l" min="6" max="26" step="1" value="16"></div>
    <div class="ctrl"><label for="sp">time speed</label><output id="spOut">0.17</output>
      <input type="range" id="sp" min="0" max="0.6" step="0.01" value="0.17"></div>
    <div class="row-btns" style="margin-top:var(--s-2)">
      <button id="follow">follow the core</button>
      <button id="trace">travelling marks</button>
    </div>
    <div class="note-sm">Follow the core and the camera dives with the collapse; the picture stops
    moving, which is what self-similar means. Let it go and watch the thing vanish instead.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">the dichotomy</span>
    <div class="row-btns"><button id="axi">make it axisymmetric</button></div>
    <div class="note-sm">${esc(D.claim)} At h = 0 the swirl is bounded and the flow is exactly type I,
    which the axisymmetric Liouville theorems exclude. Above zero it is type II and escapes them —
    and the swirl diverges, which the maximum principle forbids for a flow driven from rest by a
    bounded force. The construction survives only by leaving the axisymmetric class, and the paper
    never says so.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">every scale, exactly</span>
    <div id="exact-body"></div>
    <div class="note-sm">Rational exponents of τ in h, evaluated at the τ on screen. Decided with
    BigInt, so h = 0 and h = 1/6 are equalities rather than limits.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">computed here</span>
    <svg class="spk" id="sp-ext" role="img" aria-label="The exterior swirl profile falling with Z."></svg>
    <div class="note-sm">H(Z), the one closed form in the construction: the exterior solves the
    radial heat equation exactly. Residual of (A.37) at Z = 1: <b id="ext-res">—</b>.</div>
    <svg class="spk" id="sp-pulse" role="img" aria-label="The pulse amplitude rising then falling."></svg>
    <div class="note-sm">The shear feeds the oscillation, then shortens its wavelength until
    viscosity wins. Peak amplification <b id="pulse-pk">—</b>.</div>
  </div>
  <hr class="hr-thin">

  <div class="grp">
    <span class="eyebrow">what backs each mark</span>
    <div class="note-sm"><b>Decided.</b> ${esc(S.backing.criteria.how)}</div>
    <div class="note-sm"><b>Decided.</b> ${esc(S.backing.mechanism.how)}. Every formula is re-derived
    from the paper by <code>instruments/navierstokes/probes/stress_cone.py</code>, which carries six red
    controls — among them that a stress just outside the cone forces a negative squared amplitude, and
    that at angular mode zero the averages of Proposition 7.5 Step 1 both fail.</div>
    <div class="note-sm"><b>Computed.</b> ${esc(S.backing.exterior.how)}</div>
    <div class="note-sm"><b>Drawn.</b> ${esc(S.backing.core.how)}</div>
    <div class="note-sm">The construction is OpenAI's, <i>Finite time blowup for Navier–Stokes</i>,
    ${nf(S.paper.pages)} pages, sha256 ${esc(S.paper.sha256.slice(0, 12))}…. The audit next door built its
    ${nf(S.build.modules)}-module Lean proof on one laptop in ${nf(S.build.minutes)} minutes and had
    Comparator and a second, independently written kernel accept both theorems.
    <a href="../../reports/navier-stokes.html">What is certified is next door.</a></div>
  </div>
</aside>

<script type="application/json" id="ns-grammar">${JSON.stringify({ identity: GRAMMAR.IDENTITY, guide: GRAMMAR.dash.guide, none: GRAMMAR.dash.none })}</script>
<script type="application/json" id="ns-scene">${JSON.stringify(S).replace(/</g, '\\u003c')}</script>
<script>${APP}</script>
</body>
</html>`;

function build() {
  const dir = path.join(ROOT, 'site', 'instruments', 'navier-stokes');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length };
}

/* the card: the funnel the core traces, with the spiral drawn into it */
function cardArt() {
  const w = 560, hh = 560, cx = w / 2, cy = hh / 2, out = [];
  out.push(`<svg viewBox="0 0 ${w} ${hh}" class="shape" role="img" aria-label="The funnel a self-similar collapsing vortex traces in space-time: nested rectangles shrinking to a point, with spiral tracers drawn into them.">`);
  for (let k = 0; k < 26; k++) {
    const t = Math.pow(10, -0.15 * k);
    const lr = Math.sqrt(2 * 2.6 * t) * 152, lz = Math.pow(t, 0.49) * 214;
    if (lr < 0.5) break;
    if (lr > 258 || lz > 258) continue;
    out.push(`<rect x="${(cx - lr).toFixed(1)}" y="${(cy - lz).toFixed(1)}" width="${(2 * lr).toFixed(1)}" height="${(2 * lz).toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity="${(0.09 + 0.55 * (1 - k / 26)).toFixed(3)}" stroke-width="1.1"/>`);
  }
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * Math.PI * 2, r0 = 244;
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 0.84;
    const x1 = cx + Math.cos(a + 1.6) * 11, y1 = cy + Math.sin(a + 1.6) * 11;
    out.push(`<path d="M${x0.toFixed(1)},${y0.toFixed(1)} Q${(cx + Math.cos(a + 0.85) * r0 * 0.54).toFixed(1)},${(cy + Math.sin(a + 0.85) * r0 * 0.46).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="currentColor" stroke-opacity="0.26" stroke-width="1"/>`);
  }
  out.push(`<circle cx="${cx}" cy="${cy}" r="3" fill="currentColor"/></svg>`);
  return out.join('');
}

module.exports = { build, cardArt, facts: { criteria: S.criteria.length, exponents: S.exponents.length, paper: S.paper.sha256.slice(0, 8) } };
