/* template.js — the page shell. Every HTML file in this repository comes out
   of here, and nothing else emits a <style> block or a <body>.
   design/ · cert-machine

   render({title, headRaw, bodyRaw, footRaw}) -> a complete standalone document.

   SELF-CONTAINED BY CONSTRUCTION. The CSS is inlined, the figures are inline
   SVG, and the only scripts are two readouts: the few lines components.flow()
   ships for the machine schematic, and the one delegated listener charts.script()
   ships for chart hover. With scripts off the schematic keeps its default
   narration, the charts keep every axis tick and direct label, and nothing else
   on the page changes — neither readout is the only route to a number. The only
   network reference is the Google Fonts stylesheet, and every face has a real
   fallback stack in tokens.TYPE, so the page is fully legible offline — which
   matters here, because these pages are read locally and the machine that
   generates them has no network guarantee.

   THE SKIN (operator instruction, 2026-09-01): these rules reproduce the
   frontier design system — design/frontier-ref/{tokens,base}.css, the terra
   atlas look — on the house component classes. Dark-only, grayscale-only;
   verdicts by WEIGHT + SHAPE (filled / outlined / dashed), never colour-alone;
   Inter for prose and display, JetBrains Mono for every number. The selectors
   are unchanged from the previous skin, so no component or builder moved.

   The stylesheet below is the ONLY place a selector is written. A component in
   components.js emits a class; this file says what that class looks like. If a
   component needs a new class, it is added here in the same change — a class
   with no rule is the drift that makes a page look right on the day it ships
   and wrong three pages later. */
'use strict';

const T = require('./tokens.js');

function css() {
  const { SCALE, MEASURE } = T;
  return `
${T.rootCss()}

*{box-sizing:border-box}
html{color-scheme:dark;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink-2);
  font-family:var(--f-sans);font-size:${SCALE.body};line-height:1.65;font-weight:400;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
::selection{background:var(--ink);color:var(--paper)}
.page{max-width:${MEASURE.page};margin:0 auto;padding:calc(${SCALE.pagePadY} + 60px) ${SCALE.pagePadX} 96px}

.topnav{position:fixed;top:0;left:0;right:0;z-index:50;background:var(--paper);
  background:color-mix(in srgb, var(--paper) 82%, transparent);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--rule)}
.topnav-in{padding:0 ${SCALE.pagePadX};height:60px;
  display:flex;align-items:center;justify-content:space-between;gap:24px}
.topnav .brand{font-family:var(--f-mono);font-weight:600;font-size:.8125rem;letter-spacing:.22em;
  text-transform:uppercase;color:var(--ink);text-decoration:none;border:none}
.navlinks{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.navlinks a{font-family:var(--f-mono);font-size:${SCALE.eyebrow};letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink-4);text-decoration:none;border:none;transition:color .16s}
.navlinks a:hover{color:var(--ink)}
.navlinks .ghbtn{border:1px solid var(--rule);border-radius:999px;width:34px;height:34px;
  display:inline-flex;align-items:center;justify-content:center;
  color:var(--ink-3);background:var(--surface);transition:color .16s,border-color .16s}
.navlinks .ghbtn:hover{border-color:var(--rule-strong);color:var(--ink)}
.navlinks .ghbtn svg{display:block}
.gh-t{display:none}

/* the drawer: pure CSS state — a checkbox the burger label toggles */
.nav-ck{position:absolute;opacity:0;width:1px;height:1px;margin:0;pointer-events:none}
.nav-burger{display:none;width:40px;height:40px;align-items:center;justify-content:center;
  cursor:pointer;margin-right:-8px;border-radius:6px}
.nav-burger .nb{position:relative;display:block;width:18px;height:2px;background:var(--ink);
  border-radius:1px;transition:transform .18s ease}
.nav-burger .nb::before,.nav-burger .nb::after{content:'';position:absolute;left:0;width:18px;height:2px;
  background:var(--ink);border-radius:1px;transition:transform .18s ease,opacity .18s ease}
.nav-burger .nb::before{top:-6px}
.nav-burger .nb::after{top:6px}
.nav-ck:focus-visible ~ .topnav-in .nav-burger{outline:2px solid var(--ink);outline-offset:2px}
@media (max-width:680px){
  .nav-burger{display:flex}
  .navlinks{display:none;position:absolute;top:60px;left:0;right:0;
    flex-direction:column;align-items:stretch;gap:0;
    background:var(--paper);border-bottom:1px solid var(--rule);padding:6px 28px 16px}
  .navlinks a{padding:13px 0;border-bottom:1px solid var(--rule-soft)}
  .navlinks a:last-child{border-bottom:none}
  .navlinks .ghbtn{width:auto;height:auto;border:none;border-radius:0;background:none;
    justify-content:flex-start;gap:10px;border-bottom:1px solid var(--rule-soft)}
  .gh-t{display:inline}
  .nav-ck:checked ~ .topnav-in .navlinks{display:flex}
  .nav-ck:checked ~ .topnav-in .nav-burger .nb{transform:rotate(45deg)}
  .nav-ck:checked ~ .topnav-in .nav-burger .nb::before{transform:rotate(90deg) translateX(6px)}
  .nav-ck:checked ~ .topnav-in .nav-burger .nb::after{opacity:0}
}
[id]{scroll-margin-top:84px}
.col{max-width:${MEASURE.prose};margin-left:auto;margin-right:auto}
.wide{max-width:${MEASURE.wide};margin-left:auto;margin-right:auto}
/* A wide element (table, card grid, figure) emitted inside a prose column
   breaks out to the page-wide track: .col and .page are both centered, so
   centering on the viewport IS centering on the page. Width never exceeds
   the viewport minus the page padding, so the body never scrolls sideways —
   anything wider (a table) scrolls inside its own .tw container. */
.col .wide{position:relative;left:50%;transform:translateX(-50%);
  width:min(${MEASURE.wide},calc(100vw - 2*${SCALE.pagePadX}))}

h1,h2,h3{font-family:var(--f-display);color:var(--ink);text-wrap:balance}
h1{font-size:${SCALE.h1};line-height:1.04;margin:16px 0 0;letter-spacing:-.035em;font-weight:550}
h2{font-size:${SCALE.h2};line-height:1.12;margin:0 0 8px;letter-spacing:-.02em;font-weight:530}
h3{font-size:${SCALE.h3};line-height:1.25;margin:0 0 6px;letter-spacing:-.02em;font-weight:530}
.eyebrow,.lab{font-family:var(--f-mono);font-size:${SCALE.eyebrow};font-weight:500;
  letter-spacing:.16em;text-transform:uppercase}
.eyebrow{color:var(--ink-4)}
.lab{color:var(--ink-4)}
.deck{font-size:${SCALE.deck};line-height:1.55;color:var(--ink-3);font-weight:400;margin:24px 0 0;
  max-width:56ch;text-wrap:pretty}
p{margin:0 0 18px}
a{color:var(--ink);text-decoration:none;border-bottom:1px solid var(--sig-2);transition:border-color .16s}
a:hover{border-bottom-color:var(--ink)}
a:focus-visible{outline:2px solid var(--ink);outline-offset:3px;border-radius:2px}
strong{color:var(--ink);font-weight:480}
em{font-style:italic}
.m{font-family:var(--f-mono);font-size:.85em;background:var(--surface2);border:1px solid var(--rule);
  border-radius:4px;padding:.08em .38em;color:var(--ink-2)}

section{margin:${SCALE.section} 0 0}
.sec-head{display:flex;flex-direction:column;gap:9px;margin-bottom:32px}
.sec-head .lab{color:var(--ink-4)}

/* stat tiles — the fused grid: 1px gaps painted by the border colour */
.stats{margin:48px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
  gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:10px;overflow:hidden}
.stat{background:var(--sunk);padding:24px;display:flex;flex-direction:column;gap:8px}
.stat .k{font-family:var(--f-mono);font-size:${SCALE.eyebrow};letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4)}
.stat .v{font-family:var(--f-display);font-weight:530;font-size:clamp(1.4rem,1.05rem + 1.1vw,2rem);
  line-height:1.1;color:var(--ink);letter-spacing:-.02em;font-variant-numeric:tabular-nums;min-width:0}
.stat .v.sm{font-size:.875rem;font-family:var(--f-mono);font-weight:500;letter-spacing:-.01em;white-space:nowrap;line-height:1.45}
.stat .n{font-size:${SCALE.eyebrow};font-family:var(--f-mono);line-height:1.5;color:var(--ink-4)}

.scope{margin:24px auto 0;max-width:${MEASURE.prose};border-left:2px solid var(--rule-strong);padding-left:18px;
  color:var(--ink-3);font-size:${SCALE.small};line-height:1.6}

figure{margin:0}
.figbox{background:var(--sunk);border:1px solid var(--rule);border-radius:10px;
  padding:${SCALE.figPad};overflow-x:auto}
.figbox svg{display:block;width:100%;height:auto}
figcaption{color:var(--ink-4);font-size:${SCALE.small};line-height:1.55;margin-top:16px}
.figbox svg text{font-family:var(--f-mono)}
.t-ax{font-size:12px;fill:var(--ink-3)}
.t-lab{font-size:13px;fill:var(--ink)}
.t-key{font-size:12.5px;fill:var(--ink);font-weight:500}
.t-held{font-size:12.5px;fill:var(--ink);font-weight:600}
.t-warn{font-size:12.5px;fill:var(--ink-3);font-weight:500}
.t-note{font-size:11.5px;fill:var(--ink-4)}

/* --- the chart kit (design/charts.js) ---
   The hover readout is the second scripted element this design system ships,
   after the machine schematic. It ENHANCES: every value a chart shows is also
   in a direct label, an axis tick, or the prose beside it, so with scripts off
   nothing is gated — the charts simply stop following the pointer. */
.cm-tip{position:absolute;z-index:60;display:none;pointer-events:none;
  background:var(--surface);border:1px solid var(--rule-strong);border-radius:6px;
  padding:7px 10px;font-family:var(--f-mono);font-size:12px;line-height:1.45;
  color:var(--ink);box-shadow:0 8px 28px rgba(0,0,0,.55);max-width:280px}
.cm-tip b{display:block;font-weight:600;color:var(--ink)}
.cm-tip span{display:block;color:var(--ink-3)}
.figbox [data-cm]{cursor:crosshair}
.figbox [data-cm]:focus{outline:2px solid var(--ink);outline-offset:1px}
.figbox [data-cm]:focus:not(:focus-visible){outline:none}
svg.cm-spark{display:inline-block;width:132px;height:30px;vertical-align:middle}
@media (prefers-reduced-motion:no-preference){.figbox [data-cm]{transition:opacity .12s}}

.pull{font-family:var(--f-display);font-weight:530;font-size:${SCALE.pull};
  line-height:1.25;letter-spacing:-.02em;margin:32px 0;text-wrap:balance;color:var(--ink-2)}
.pull b{color:var(--ink);font-weight:550}

.eq{background:var(--sunk);border:1px solid var(--rule);border-radius:10px;
  padding:20px 22px;margin:22px 0;text-align:center;
  font-family:var(--f-mono);font-size:.875rem;line-height:1.8;color:var(--ink);overflow-x:auto}

pre.code{background:var(--sunk);border:1px solid var(--rule);border-radius:10px;
  padding:20px 22px;margin:22px 0;
  font-family:var(--f-mono);font-size:.75rem;line-height:1.7;color:var(--ink-2);overflow-x:auto}

.after-fig{margin-top:26px}

.note{background:var(--surface);border:1px solid var(--rule);border-radius:10px;
  padding:20px 24px;margin:24px 0;font-size:${SCALE.body};line-height:1.6;color:var(--ink-3)}
.note .lab{display:block;margin-bottom:8px;color:var(--ink-4)}
.note p:last-child{margin-bottom:0}

blockquote{margin:22px 0;padding-left:20px;border-left:2px solid var(--rule-strong);
  font-size:${SCALE.deck};line-height:1.55;color:var(--ink)}
blockquote cite{display:block;margin-top:10px;font-style:normal;font-size:${SCALE.eyebrow};
  font-family:var(--f-mono);color:var(--ink-4);letter-spacing:.06em;line-height:1.5}

.tw{overflow-x:auto;border:1px solid var(--rule);border-radius:10px;background:var(--sunk);margin:0 0 26px}
table{border-collapse:collapse;width:100%;min-width:560px;
  font-family:var(--f-mono);font-size:${SCALE.small};font-variant-numeric:tabular-nums}
th{font-family:var(--f-mono);font-size:${SCALE.eyebrow};letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-4);font-weight:500;text-align:left;padding:12px 16px;border-bottom:1px solid var(--rule-strong);white-space:nowrap}
td{padding:12px 16px;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink-2)}
tbody tr{transition:background .16s}
tbody tr:hover{background:var(--surface)}
tr:last-child td{border-bottom:0}
td.k{color:var(--ink);font-weight:500;white-space:nowrap}
td.v{font-size:.75rem;color:var(--ink);word-break:break-all}
td.n{font-size:.75rem;color:var(--ink-2);white-space:nowrap;text-align:right}

/* verdict chips — WEIGHT + SHAPE, never colour-alone:
   certified/held FILL, refuted/deprecated OUTLINE, open/refused DIM + DASH. */
.tag{display:inline-flex;align-items:center;gap:.45em;font-family:var(--f-mono);font-size:.625rem;
  font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:.35em .8em;
  border-radius:999px;white-space:nowrap}
.tag.held{background:var(--ink);color:var(--paper)}
.tag.cert{background:var(--ink);color:var(--paper)}
.tag.open{border:1px dashed var(--ink-4);color:var(--ink-3);background:transparent}
.tag.dep{border:1px solid var(--rule-strong);color:var(--ink-3);background:transparent}

.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin:8px 0 0}
@media (max-width:680px){.cards{grid-template-columns:1fr}}
a.card{display:flex;flex-direction:column;gap:10px;background:var(--surface);
  border:1px solid var(--rule);border-radius:10px;padding:24px;
  color:inherit;text-decoration:none;
  transition:border-color .28s cubic-bezier(.22,1,.36,1),transform .28s cubic-bezier(.22,1,.36,1),background .28s}
a.card:hover{border-color:var(--rule-strong);background:var(--surface2);transform:translateY(-3px)}
a.card:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.card-k{font-family:var(--f-mono);font-size:${SCALE.eyebrow};letter-spacing:.13em;text-transform:uppercase;color:var(--ink-4)}
.card-t{font-family:var(--f-display);font-weight:530;font-size:1.2rem;line-height:1.25;
  letter-spacing:-.015em;color:var(--ink);text-wrap:balance}
.card-d{font-size:${SCALE.small};line-height:1.55;color:var(--ink-3)}
.card-n{margin-top:auto;padding-top:12px;border-top:1px solid var(--rule);
  font-family:var(--f-mono);font-size:${SCALE.eyebrow};letter-spacing:.05em;color:var(--ink-5)}

/* PICKER — CSS-state tabs. Radios carry the state, labels are the controls,
   the panels are siblings. Same device as the nav drawer: no script, so it
   works in a reader that runs none, and the radios keep arrow-key semantics
   for free. The nth-of-type pairs are generated below. */
.picker{margin:8px 0 0}
.pk-r{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.pk-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.pk-t{display:flex;flex-direction:column;gap:3px;cursor:pointer;padding:10px 14px;
  border:1px solid var(--rule);border-radius:8px;background:var(--surface);
  transition:border-color .16s ease,background .16s ease}
.pk-t:hover{border-color:var(--rule-strong)}
.pk-t .pk-k{font-family:var(--f-mono);font-size:.625rem;letter-spacing:.12em;
  text-transform:uppercase;color:var(--ink-4)}
.pk-t .pk-n{font-family:var(--f-display);font-weight:530;font-size:.9375rem;color:var(--ink-3);line-height:1.2}
.pk-p{display:none}
.pk-p .pk-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:6px}
.pk-p h3{font-family:var(--f-display);font-weight:530;font-size:1.3rem;letter-spacing:-.015em;
  color:var(--ink);margin:0}
.pk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
@media (max-width:680px){.pk-grid{grid-template-columns:1fr}}
.pk-box{background:var(--sunk);border:1px solid var(--rule);border-radius:8px;padding:18px 20px}
.pk-box .lab{display:block;margin-bottom:8px;font-family:var(--f-mono);font-size:.625rem;
  letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4)}
.pk-box.warn .lab{color:var(--ink-3)}
.pk-box p{margin:0;font-size:${SCALE.small};line-height:1.55;color:var(--ink-3)}
${Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return `.pk-r:nth-of-type(${n}):checked ~ .pk-tabs > .pk-t:nth-child(${n})`
    + `{border-color:var(--ink-3);background:var(--surface2)}\n`
    + `.pk-r:nth-of-type(${n}):checked ~ .pk-tabs > .pk-t:nth-child(${n}) .pk-n{color:var(--ink)}\n`
    + `.pk-r:nth-of-type(${n}):checked ~ .pk-tabs > .pk-t:nth-child(${n}) .pk-k{color:var(--ink-2)}\n`
    + `.pk-r:nth-of-type(${n}):focus-visible ~ .pk-tabs > .pk-t:nth-child(${n})`
    + `{outline:2px solid var(--ink);outline-offset:3px}\n`
    + `.pk-r:nth-of-type(${n}):checked ~ .pk-panes > .pk-p:nth-child(${n}){display:block}`;
}).join('\n')}

ul.plain{list-style:none;padding:0;margin:0}
ul.plain li{padding:16px 0;border-top:1px solid var(--rule);font-size:${SCALE.body};line-height:1.6;color:var(--ink-3)}
ul.plain li:first-child{border-top:0}
ul.plain b{color:var(--ink);font-weight:480}

footer{margin:${SCALE.section} 0 0;padding-top:32px;border-top:1px solid var(--rule);
  color:var(--ink-5);font-size:${SCALE.eyebrow};letter-spacing:.08em;line-height:1.9;font-family:var(--f-mono);text-transform:uppercase}
footer p{margin:0 0 12px}
footer a{color:var(--ink-3);border-bottom-color:var(--rule-strong);text-transform:none;letter-spacing:.04em}
footer a:hover{color:var(--ink)}

/* ---- the machine schematic (components.flow) ----
   Nodes are keyboard-focusable buttons; the readout above the drawing narrates
   whichever node is active. Without scripts the readout keeps its default text
   and hover still highlights — the figure degrades, it does not vanish. */
.mach .figbox{padding-top:18px}
/* the schematic is drawn vertical at 800 design units; cap the rendered width
   at that same 800 so desktop renders near 1:1 and never inflates the type */
.mach svg{max-width:800px;margin:0 auto}
.mach-ro{display:grid;grid-template-columns:auto 1fr;gap:4px 18px;align-items:baseline;
  border-bottom:1px solid var(--rule);padding-bottom:14px;margin-bottom:10px}
.mach-ro .k{font-family:var(--f-mono);font-size:11px;letter-spacing:.13em;text-transform:uppercase;
  color:var(--ink-4);white-space:nowrap}
.mach-ro .d{font-size:${SCALE.small};line-height:1.55;color:var(--ink-3);min-height:3em}
.mach svg .nd{cursor:pointer;outline:none}
.mach svg .nd-box{fill:var(--surface);stroke:var(--rule);stroke-width:1;transition:stroke .16s ease}
.mach svg .nd:hover .nd-box,.mach svg .nd:focus-visible .nd-box{stroke:var(--ink-3);stroke-width:1.5}
.mach svg .nd.on .nd-box{stroke:var(--ink);stroke-width:1.6}
.mach svg .acc-sig{fill:var(--ink)}
.mach svg .acc-held{fill:var(--ink-2)}
.mach svg .acc-warn{fill:var(--ink-4)}
.mach svg .acc-dep{fill:var(--mark)}
.mach svg .nd-k{font-size:10px;letter-spacing:.1em;fill:var(--ink-4)}
.mach svg .nd-v{font-size:12.5px;fill:var(--ink);font-weight:500}
.mach svg .ed{fill:none;stroke:var(--rule-strong);stroke-width:1.5}
.mach svg .ed-f{fill:none;stroke:var(--ink-3);stroke-width:1.5;stroke-dasharray:5 90;visibility:hidden}
.mach svg .ed-lab{font-size:11px;fill:var(--ink-4)}
@media (prefers-reduced-motion:no-preference){
  .mach svg .ed-f{visibility:visible;animation:machflow 3.4s linear infinite}
}
@keyframes machflow{from{stroke-dashoffset:0}to{stroke-dashoffset:-95}}

@media (prefers-reduced-motion:no-preference){
  h1,.deck,.stats{animation:up .52s cubic-bezier(.22,1,.36,1) both}
  .deck{animation-delay:.05s}.stats{animation-delay:.1s}
}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--rule-strong);border-radius:5px;border:2px solid var(--paper)}
::-webkit-scrollbar-track{background:transparent}
`.trim();
}

/* Every generated page carries the same discoverability head: description
   (page-specific when the builder passes `desc`, the positioning sentence
   otherwise), canonical + og:url when the builder passes `path` (the
   root-absolute served path — pass it for pages with one canonical home),
   Open Graph / Twitter cards against the one build-generated og image, and
   the favicon. The canonical host is the apex — www 301s to it. */
const SITE_ORIGIN = 'https://carlostoledo.co';
const DEFAULT_DESC = 'Verification layers under which AI-scale mathematical search produces only certified '
  + 'output — exact rational decisions, interval enclosures, red-controlled instruments, reward signals that '
  + 'cannot be hacked, and certified audits of published AI-generated mathematics. Every number recomputed at '
  + 'build; a build that drifts refuses to ship.';

function render({ title, bodyRaw, footRaw, desc, path: pagePath }) {
  const CO = require('./components.js');
  const NAV = CO.nav({
    brand: 'Carlos Toledo', brandHref: '/',
    links: [{ t: 'Reports', href: '/reports/' }, { t: 'Machine', href: '/machine/' }, { t: 'About', href: '/about/' }],
    github: 'https://github.com/carlostoledo1891/cert-machine'
  });
  const d = desc || DEFAULT_DESC;
  const canon = pagePath ? SITE_ORIGIN + pagePath : null;
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${CO.esc(title)}</title>
<meta name="description" content="${CO.escAttr(d)}">
<meta name="author" content="Carlos Toledo">
${canon ? `<link rel="canonical" href="${canon}">\n<meta property="og:url" content="${canon}">` : ''}
<meta property="og:title" content="${CO.escAttr(title)}">
<meta property="og:description" content="${CO.escAttr(d)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="cert-machine · Carlos Toledo">
<meta property="og:image" content="${SITE_ORIGIN}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${CO.escAttr(title)}">
<meta name="twitter:description" content="${CO.escAttr(d)}">
<meta name="twitter:image" content="${SITE_ORIGIN}/og.png">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${T.GOOGLE_FONTS}">
<script defer src="/_vercel/insights/script.js"></script>

<style>
${css()}
</style>

${NAV}

<div class="page">

${bodyRaw}

${footRaw || ''}

</div>
</html>
`;
}

module.exports = { render, css };
