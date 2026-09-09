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

const SCENE = path.join(HERE, 'out', 'scene.json');
if (!fs.existsSync(SCENE)) { console.error('navier-stokes: no scene.json — run node playground/navier-stokes/scene.js'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(SCENE, 'utf8'));
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const nf = (x) => Number(x).toLocaleString('en-US');
const MONO = "'JetBrains Mono var','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

const CSS = `
*{box-sizing:border-box;}
html,body{margin:0;padding:0;height:100%;overflow:hidden;background:var(--bg);color:var(--ink);
  font-family:'Inter var',Inter,-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
body{opacity:0;transition:opacity .5s ease;} body.ready{opacity:1;}
canvas{position:fixed;inset:0;display:block;}
.mono{font-family:${MONO};}

.nav-wrap{position:fixed;top:0;left:0;right:0;z-index:40;padding:14px 22px;display:flex;
  justify-content:space-between;align-items:center;pointer-events:none;
  background:linear-gradient(180deg,color-mix(in srgb, var(--bg) 72%, transparent),transparent);transition:opacity .6s ease;}
.nav-wrap a{pointer-events:auto;font-family:${MONO};text-decoration:none;}
body.faded .nav-wrap{opacity:.3;}
.brand{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);}
.brand:hover{color:var(--ink);}
.navlinks{display:flex;gap:16px;}
.navlinks a{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);}
.navlinks a:hover{color:var(--ink);}

.title{position:fixed;top:62px;left:26px;z-index:30;max-width:min(30ch,44vw);pointer-events:none;
  transition:opacity .8s ease;}
body.faded .title{opacity:.22;}
.title h1{margin:0;font-size:clamp(1.6rem,1rem+2.2vw,2.9rem);font-weight:550;letter-spacing:-.025em;line-height:1.03;}
.title p{margin:10px 0 0;font-size:12.5px;line-height:1.55;color:var(--ink-3);max-width:34ch;}
.title p b{color:var(--ink-2);font-weight:500;}

.hud{position:fixed;left:26px;bottom:150px;z-index:30;display:grid;grid-template-columns:auto auto;
  gap:2px 12px;font-family:${MONO};font-size:11px;color:var(--ink-4);pointer-events:none;transition:opacity .6s ease;}
body.faded .hud{opacity:.35;}
.hud b{color:var(--ink);font-weight:400;text-align:right;font-variant-numeric:tabular-nums;}

.transport{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:35;
  display:flex;align-items:center;gap:12px;padding:9px 14px;border-radius:var(--radius-pill);
  background:color-mix(in srgb, var(--bg-raised) 82%, transparent);border:1px solid var(--border);backdrop-filter:blur(14px);}
.transport input[type=range]{width:min(44vw,400px);accent-color:var(--ink);}
button{font-family:${MONO};background:transparent;color:var(--ink-3);border:1px solid var(--border);
  border-radius:var(--radius-pill);font-size:11px;letter-spacing:.06em;padding:5px 11px;cursor:pointer;
  transition:color .15s,border-color .15s,background .15s;}
button:hover{color:var(--ink);border-color:var(--border-strong);}
button.on{background:var(--ink);color:var(--bg);border-color:var(--ink);}
#play{width:34px;height:30px;padding:0;font-size:12px;}
.tlab{font-family:${MONO};font-size:10.5px;color:var(--ink-5);white-space:nowrap;}
button .tlab{color:inherit;opacity:.55;}

.rail{position:fixed;right:22px;top:50%;transform:translateY(-50%);z-index:35;display:flex;
  flex-direction:column;gap:8px;align-items:stretch;transition:opacity .6s ease;width:218px;}
body.faded .rail{opacity:.42;}
.grp{background:color-mix(in srgb, var(--bg-raised) 82%, transparent);border:1px solid var(--border);border-radius:var(--radius-m);padding:12px;backdrop-filter:blur(14px);}
.grp label{display:flex;justify-content:space-between;font-family:${MONO};font-size:10.5px;color:var(--ink-4);margin-bottom:7px;}
.grp label b{color:var(--ink);font-weight:400;}
.grp input[type=range]{width:100%;accent-color:var(--ink);}
.pills{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap;}
.pills button{font-size:10px;padding:3px 7px;}
.stack{display:flex;flex-direction:column;gap:6px;}
.stack button{text-align:left;}

.chips{position:fixed;left:26px;right:26px;bottom:64px;z-index:32;display:flex;gap:5px;flex-wrap:wrap;
  justify-content:center;pointer-events:none;transition:opacity .6s ease;}
body.faded .chips{opacity:.25;}
.chip{pointer-events:auto;font-size:10px;letter-spacing:.04em;padding:3px 8px;border-radius:var(--radius-pill);
  border:1px solid var(--border);color:var(--ink-4);background:color-mix(in srgb, var(--bg-raised) 70%, transparent);backdrop-filter:blur(8px);cursor:pointer;}
.chip.ok{color:var(--ink-2);border-color:var(--border-strong);}
.chip.bad{color:var(--bg);background:var(--ink);border-color:var(--ink);}
.chip.off{opacity:.32;}

.verdict{position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:33;
  max-width:min(64ch,88vw);text-align:center;opacity:0;pointer-events:none;transition:opacity .45s ease;}
.verdict.on{opacity:1;}
.verdict b{display:block;font-family:${MONO};font-size:11px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--bg);background:var(--ink);border-radius:3px;padding:3px 10px;margin:0 auto 9px;width:max-content;}
.verdict em{font-style:normal;font-size:12.5px;line-height:1.6;color:var(--ink-2);background:color-mix(in srgb, var(--bg) 78%, transparent);
  padding:7px 13px;border-radius:var(--radius-s);display:inline-block;backdrop-filter:blur(8px);}

.why{position:fixed;left:50%;bottom:104px;transform:translateX(-50%);z-index:36;width:min(62ch,90vw);
  background:color-mix(in srgb, var(--bg-raised) 94%, transparent);border:1px solid var(--border-strong);border-radius:var(--radius-m);padding:14px 16px;
  opacity:0;pointer-events:none;transition:opacity .25s ease;backdrop-filter:blur(16px);cursor:pointer;}
.why.on{opacity:1;pointer-events:auto;}
.why b{display:block;font-size:13px;margin-bottom:6px;}
.why span{display:block;font-size:12px;line-height:1.55;color:var(--ink-3);margin-bottom:4px;}
.why code{display:block;margin-top:8px;font-family:${MONO};font-size:11.5px;color:var(--ink);
  background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-s);padding:7px 9px;}

.panel{position:fixed;right:22px;top:62px;bottom:76px;width:min(430px,90vw);z-index:38;
  background:color-mix(in srgb, var(--bg-raised) 96%, transparent);border:1px solid var(--border-strong);border-radius:var(--radius-l);padding:20px;
  overflow:auto;opacity:0;pointer-events:none;transform:translateX(12px);
  transition:opacity .28s ease,transform .28s ease;backdrop-filter:blur(20px);}
.panel.on{opacity:1;pointer-events:auto;transform:none;}
.panel h2{margin:0 0 6px;font-size:16px;font-weight:550;letter-spacing:-.01em;}
.panel h3{margin:18px 0 6px;font-family:${MONO};font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink-4);font-weight:400;}
.panel p{margin:0 0 10px;font-size:12.5px;line-height:1.62;color:var(--ink-3);}
.panel p b{color:var(--ink);font-weight:500;} .panel p em{color:var(--ink-2);font-style:italic;}
.panel a{color:var(--ink-2);}
.erow{display:grid;grid-template-columns:62px 76px 60px 1fr;gap:6px;padding:4px 0;border-top:1px solid var(--chart-grid);
  font-family:${MONO};font-size:10.5px;align-items:baseline;}
.erow span{color:var(--ink-2);} .erow b{color:var(--ink-3);font-weight:400;}
.erow i{color:var(--ink);font-style:normal;text-align:right;}
.erow em{color:var(--ink-5);font-style:normal;font-family:'Inter var',Inter,sans-serif;font-size:10px;}
.ins{display:flex;gap:10px;align-items:center;margin:6px 0 2px;}
.ins svg{flex:0 0 190px;height:46px;background:var(--bg);border:1px solid var(--chart-grid);border-radius:var(--radius-s);}
.ins div{font-size:11px;line-height:1.5;color:var(--ink-4);}
.tag{display:inline-block;font-family:${MONO};font-size:9px;letter-spacing:.12em;text-transform:uppercase;
  border:1px solid var(--border-strong);border-radius:var(--radius-pill);padding:1px 7px;color:var(--ink-4);margin-right:5px;}
.tag.d{background:var(--ink);color:var(--bg);border-color:var(--ink);}

@media (max-width:820px){
  /* THE PHONE IS A DIFFERENT INSTRUMENT. Nine chips wrap to four lines and eat the picture,
     so on a phone the verdicts live in the panel and the HUD keeps three rows in the corner. */
  .title{top:52px;left:16px;max-width:88vw;}
  .title p{display:none;}
  .title h1{font-size:1.7rem;}
  .chips{display:none;}
  .hud{left:auto;right:14px;top:52px;bottom:auto;font-size:10px;gap:1px 10px;}
  .hud span:nth-of-type(n+5),.hud b:nth-of-type(n+5){display:none;}
  .rail{right:8px;left:8px;top:auto;bottom:70px;transform:none;width:auto;flex-direction:column;gap:6px;}
  .grp{padding:9px 10px;}
  .grp label{margin-bottom:5px;}
  .stack{flex-direction:row;gap:6px;}
  .stack button{flex:1;text-align:center;padding:6px 4px;font-size:10px;}
  .stack button .tlab{display:none;}
  .pills{margin-top:7px;}
  .transport{bottom:10px;gap:8px;padding:7px 11px;}
  .transport input[type=range]{width:46vw;}
  .transport .tlab{display:none;}
  .verdict{top:auto;bottom:270px;max-width:94vw;}
  .verdict em{font-size:11.5px;padding:6px 10px;}
  .why{bottom:70px;width:94vw;padding:11px 12px;}
  .why span{font-size:11px;}
  .panel{right:8px;left:8px;width:auto;top:52px;bottom:60px;padding:15px;}
}
@media (max-width:820px) and (orientation:landscape){
  .rail{flex-direction:row;flex-wrap:wrap;}
  .grp{flex:1 1 46%;}
  .verdict{bottom:200px;}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;}}
`;

const D = S.dichotomy;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Turn the singularity — cert-machine</title>
<meta name="description" content="${esc('The object OpenAI\u2019s Navier\u2013Stokes proof constructs, drawn at full size and turned: a self-similar vortex core collapsing in real time, every verdict about the parameter it hangs on decided in your tab in exact integer arithmetic.')}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="Turn the singularity">
<meta property="og:description" content="A Millennium proof\u2019s singularity, drawn as the object it is rather than simulated.">
<meta property="og:type" content="website">
<link rel="stylesheet" href="../design/tokens.css">
<style>${CSS}</style>
</head>
<body>
<canvas id="ns-cv" aria-label="A self-similar vortex core collapsing toward a point: thousands of tracers spiral inward and are flung along the axis while the swirl glows out of the page, the core's box shrinking as the time remaining falls."></canvas>

<div class="nav-wrap">
  <a class="brand" href="../../index.html">Carlos Toledo</a>
  <div class="navlinks">
    <a href="../../reports/navier-stokes.html">the audit</a>
    <a href="../index.html">instruments</a>
  </div>
</div>

<div class="title">
  <h1>Turn the singularity.</h1>
  <p>A Millennium proof says a smooth force can drive a fluid from rest to infinite speed in finite time.
  This is <b>the object it constructs</b>, not a simulation of it.</p>
</div>

<div class="chips" id="chips"></div>
<div class="verdict" id="verdict"></div>
<div class="why" id="why"></div>

<div class="hud mono">
  <span>τ</span><b id="h-tau">—</b>
  <span>zoom</span><b id="h-zoom">—</b>
  <span>speed |u|</span><b id="h-u">—</b>
  <span>ℓz/ℓr</span><b id="h-asp">—</b>
  <span>h</span><b id="h-h">—</b>
  <span>criteria met</span><b id="h-met">—</b>
  <span>10× longer at τ</span><b id="h-10">—</b>
  <span>fps</span><b id="h-fps">—</b>
</div>

<div class="rail">
  <div class="grp">
    <label>h, the parameter it hangs on <b id="h-h2"></b></label>
    <input id="hs" type="range" min="0" max="300" step="1" value="10" aria-label="the smallness parameter h">
    <div class="pills">
      <button data-h="0">0</button>
      <button data-h="10">1/100</button>
      <button data-h="60">3/50</button>
      <button data-h="167">past 1/6</button>
    </div>
  </div>
  <div class="grp stack">
    <button id="follow">follow the core <span class="tlab">f</span></button>
    <button id="axi">make it axisymmetric <span class="tlab">a</span></button>
    <button id="trace">tracers <span class="tlab">t</span></button>
  </div>
  <div class="stack">
    <button data-panel="exact">every scale, exactly</button>
    <button data-panel="about">what this is</button>
  </div>
</div>

<div class="transport">
  <button id="play" aria-label="play or pause">❚❚</button>
  <span class="tlab">τ = 1 − t</span>
  <input id="sc" type="range" min="-13" max="-0.15" step="0.005" value="-1" aria-label="time remaining before the singularity">
  <span class="tlab">→ 0</span>
</div>

<div class="panel" id="p-exact">
  <h2>Every scale, exactly</h2>
  <p><span class="tag d">decided</span> Each exponent is a rational in h with integer numerators, evaluated at the h you
  have set. The chips along the top are the same arithmetic: your tab compares them with BigInt and never with a float,
  so h = 0 and h = 1/6 are decided as equalities rather than approached. Click any chip for its comparison.</p>
  <div id="exact-body"></div>
  <h3>the exterior, integrated here <span class="tag">computed</span></h3>
  <div class="ins"><svg id="sp-ext" role="img" aria-label="The exterior swirl profile falling with Z."></svg>
    <div>H(Z) — the one closed form in the construction. The exterior solves the radial heat equation exactly.
    Residual of (A.37) at Z = 1: <b id="ext-res">—</b>.</div></div>
  <h3>the pulse <span class="tag">computed</span></h3>
  <div class="ins"><svg id="sp-pulse" role="img" aria-label="The pulse amplitude rising then falling."></svg>
    <div>The shear feeds the oscillation, then shortens its wavelength until viscosity wins.
    Peak amplification <b id="pulse-pk">—</b>.</div></div>
</div>

<div class="panel" id="p-about">
  <h2>What this is</h2>
  <p>On 2026-09-08 OpenAI published a proof that the Navier–Stokes equations can break down in finite time under a
  smooth force, with a machine-checked certificate. Everyone will render a fluid simulation of that. A simulation is
  the one thing here nobody can certify, so this page renders <b>the object the proof constructs</b>: a vortex whose
  core shrinks like τ<sup>1/2</sup> across and τ<sup>1/2−h</sup> along while its speed grows like τ<sup>−1/2−h</sup>.</p>
  <p>Press <em>follow the core</em> and the camera dives with the collapse. The picture stops moving — that is what
  self-similar means, and no still figure can show it.</p>
  <h3>the dichotomy this instrument exists for</h3>
  <p>${esc(D.claim)} Press <em>make it axisymmetric</em> and move h. ${esc(D.atZero)} ${esc(D.above)}</p>
  <p>${esc(D.so)}</p>
  <p style="font-size:11.5px">${esc(D.hypotheses)}</p>
  <h3>what backs each mark</h3>
  <p><span class="tag d">decided</span> ${esc(S.backing.criteria.how)}</p>
  <p><span class="tag">computed</span> ${esc(S.backing.exterior.how)}</p>
  <p><span class="tag">drawn</span> ${esc(S.backing.core.how)}</p>
  <h3>the asymptotics, said out loud</h3>
  <p>At the paper's h = 1/100 the core is ten times longer than wide only at τ = 10<sup>−100</sup>, and the pulse count
  grows by two per cent per hundred decades. Slide h up to see the mechanism — and note that past 1/6 you have left the
  window where the dissipation stays integrable.</p>
  <h3>provenance</h3>
  <p>The construction is OpenAI's, <i>Finite time blowup for Navier–Stokes</i>, ${nf(S.paper.pages)} pages,
  sha256 ${esc(S.paper.sha256.slice(0, 12))}…. The audit next door built its ${nf(S.build.modules)}-module Lean proof on
  one laptop in ${nf(S.build.minutes)} minutes, asked the kernel what it rests on, and had Comparator and a second,
  independently written kernel accept both theorems. Nothing on <em>this</em> page is certified —
  <b>a drawing is not a proof</b>. <a href="../../reports/navier-stokes.html">What is certified is next door.</a></p>
</div>

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
