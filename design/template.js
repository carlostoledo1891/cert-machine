/* template.js — the page shell. Every HTML file in this repository comes out
   of here, and nothing else emits a <style> block or a <body>.
   design/ · cert-machine

   render({title, headRaw, bodyRaw, footRaw}) -> a complete standalone document.

   SELF-CONTAINED BY CONSTRUCTION. The CSS is inlined, the figures are inline
   SVG, and the only scripts are two readouts: the few lines components.flow()
   ships for the machine schematic, and the one delegated listener charts.script()
   ships for chart hover. With scripts off the schematic keeps its default
   narration, the charts keep every axis tick and direct label, and nothing else
   on the page changes — neither readout is the only route to a number. The only network reference is the Google
   Fonts stylesheet, and every face has a real fallback stack in tokens.TYPE,
   so the page is fully legible offline — which matters here, because these
   pages are read locally and the machine that generates them has no network
   guarantee.

   The stylesheet below is the ONLY place a selector is written. A component in
   components.js emits a class; this file says what that class looks like. If a
   component needs a new class, it is added here in the same change — a class
   with no rule is the drift that makes a page look right on the day it ships
   and wrong three pages later. */
'use strict';

const T = require('./tokens.js');

function css() {
  const { TYPE, SCALE, MEASURE } = T;
  return `
${T.rootCss()}

*{box-sizing:border-box}
html{color-scheme:light dark}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:${TYPE.body};font-size:${SCALE.body};line-height:1.66;-webkit-font-smoothing:antialiased}
.page{max-width:${MEASURE.page};margin:0 auto;padding:calc(${SCALE.pagePadY} + 52px) ${SCALE.pagePadX} 96px}

.topnav{position:fixed;top:0;left:0;right:0;z-index:50;background:var(--paper);
  background:color-mix(in srgb, var(--paper) 72%, transparent);
  -webkit-backdrop-filter:blur(12px) saturate(1.4);backdrop-filter:blur(12px) saturate(1.4);
  border-bottom:1px solid var(--rule)}
.topnav-in{padding:0 28px;height:52px;
  display:flex;align-items:center;justify-content:space-between;gap:18px}
.topnav .brand{font-family:${TYPE.mono};font-weight:400;font-size:11.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--sig);text-decoration:none;border:none}
.navlinks{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.navlinks a{font-family:${TYPE.mono};font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink-2);text-decoration:none;border:none}
.navlinks a:hover{color:var(--sig)}
.navlinks .ghbtn{border:1px solid var(--rule);border-radius:999px;width:34px;height:34px;
  display:inline-flex;align-items:center;justify-content:center;
  color:var(--ink);background:var(--surface)}
.navlinks .ghbtn:hover{border-color:var(--sig);color:var(--sig)}
.navlinks .ghbtn svg{display:block}
.gh-t{display:none}

/* the drawer: pure CSS state — a checkbox the burger label toggles */
.nav-ck{position:absolute;opacity:0;width:1px;height:1px;margin:0;pointer-events:none}
.nav-burger{display:none;width:40px;height:40px;align-items:center;justify-content:center;
  cursor:pointer;margin-right:-8px;border-radius:4px}
.nav-burger .nb{position:relative;display:block;width:18px;height:2px;background:var(--ink);
  border-radius:1px;transition:transform .18s ease}
.nav-burger .nb::before,.nav-burger .nb::after{content:'';position:absolute;left:0;width:18px;height:2px;
  background:var(--ink);border-radius:1px;transition:transform .18s ease,opacity .18s ease}
.nav-burger .nb::before{top:-6px}
.nav-burger .nb::after{top:6px}
.nav-ck:focus-visible ~ .topnav-in .nav-burger{outline:2px solid var(--sig);outline-offset:2px}
@media (max-width:680px){
  .nav-burger{display:flex}
  .navlinks{display:none;position:absolute;top:52px;left:0;right:0;
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
[id]{scroll-margin-top:76px}
.col{max-width:${MEASURE.prose};margin-left:auto;margin-right:auto}
.wide{max-width:${MEASURE.wide};margin-left:auto;margin-right:auto}
/* A wide element (table, card grid, figure) emitted inside a prose column
   breaks out to the page-wide track: .col and .page are both centered, so
   centering on the viewport IS centering on the page. Width never exceeds
   the viewport minus the page padding, so the body never scrolls sideways —
   anything wider (a table) scrolls inside its own .tw container. */
.col .wide{position:relative;left:50%;transform:translateX(-50%);
  width:min(${MEASURE.wide},calc(100vw - 2*${SCALE.pagePadX}))}

h1,h2,h3{font-family:${TYPE.display};font-weight:700;letter-spacing:-.018em;text-wrap:balance}
h1{font-size:${SCALE.h1};line-height:1.0;margin:16px 0 0}
h2{font-size:${SCALE.h2};line-height:1.14;margin:0 0 8px}
h3{font-size:${SCALE.h3};line-height:1.3;margin:0 0 6px;font-weight:600}
.eyebrow,.lab{font-family:${TYPE.mono};font-size:11px;letter-spacing:.15em;text-transform:uppercase}
.eyebrow{color:var(--sig)}
.lab{color:var(--ink-3)}
.deck{font-size:${SCALE.deck};line-height:1.5;color:var(--ink-2);font-weight:300;margin:24px 0 0}
p{margin:0 0 18px}
a{color:var(--sig);text-decoration:none;border-bottom:1px solid var(--sig-2)}
a:hover{border-bottom-width:2px}
a:focus-visible{outline:2px solid var(--sig);outline-offset:3px;border-radius:2px}
strong{font-weight:600}
em{font-style:italic}
.m{font-family:${TYPE.mono};font-size:.88em}

section{margin:${SCALE.section} 0 0}
.sec-head{display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
.sec-head .lab{color:var(--sig)}

.stats{margin:40px 0 0;display:flex;flex-wrap:wrap;gap:14px}
.stat{background:var(--surface);border:1px solid var(--rule);border-radius:4px;
  padding:22px 24px;display:flex;flex-direction:column;gap:7px;
  flex:1 1 240px;min-width:200px}
.stat .k{font-family:${TYPE.mono};font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-3)}
.stat .v{font-family:${TYPE.display};font-weight:700;font-size:27px;line-height:1.05;color:var(--sig);letter-spacing:-.02em}
.stat .v.sm{font-size:14px;font-family:${TYPE.mono};font-weight:500;letter-spacing:-.02em;white-space:nowrap;line-height:1.45}
.stat .v.held{color:var(--held)}
.stat .v.warn{color:var(--warn)}
.stat .n{font-size:14.5px;line-height:1.4;color:var(--ink-2)}

.scope{margin:24px auto 0;max-width:${MEASURE.prose};border-left:2px solid var(--sig);padding-left:18px;
  color:var(--ink-2);font-size:15.5px;line-height:1.55}

figure{margin:0}
.figbox{background:var(--surface);border:1px solid var(--rule);border-radius:4px;
  padding:${SCALE.figPad};overflow-x:auto}
.figbox svg{display:block;width:100%;height:auto}
figcaption{color:var(--ink-2);font-size:15.5px;line-height:1.5;margin-top:14px}
.figbox svg text{font-family:${TYPE.mono}}
.t-ax{font-size:12px;fill:var(--ink-3)}
.t-lab{font-size:13px;fill:var(--ink)}
.t-key{font-size:12.5px;fill:var(--sig);font-weight:500}
.t-held{font-size:12.5px;fill:var(--held);font-weight:500}
.t-warn{font-size:12.5px;fill:var(--warn);font-weight:500}
.t-note{font-size:11.5px;fill:var(--ink-3)}

/* --- the chart kit (design/charts.js) ---
   The hover readout is the second scripted element this design system ships,
   after the machine schematic. It ENHANCES: every value a chart shows is also
   in a direct label, an axis tick, or the prose beside it, so with scripts off
   nothing is gated — the charts simply stop following the pointer. */
.cm-tip{position:absolute;z-index:60;display:none;pointer-events:none;
  background:var(--paper);border:1px solid var(--rule);border-radius:6px;
  padding:7px 10px;font-family:${TYPE.mono};font-size:12px;line-height:1.45;
  color:var(--ink);box-shadow:0 6px 22px rgba(0,0,0,.16);max-width:280px}
.cm-tip b{display:block;font-weight:500;color:var(--ink)}
.cm-tip span{display:block;color:var(--ink-2)}
.figbox [data-cm]{cursor:crosshair}
.figbox [data-cm]:focus{outline:2px solid var(--sig);outline-offset:1px}
.figbox [data-cm]:focus:not(:focus-visible){outline:none}
svg.cm-spark{display:inline-block;width:132px;height:30px;vertical-align:middle}
@media (prefers-reduced-motion:no-preference){.figbox [data-cm]{transition:opacity .12s}}

.pull{font-family:${TYPE.display};font-weight:700;font-size:${SCALE.pull};
  line-height:1.2;letter-spacing:-.02em;margin:32px 0;text-wrap:balance}
.pull b{color:var(--sig)}

.eq{background:var(--sunk);border:1px solid var(--rule-soft);border-radius:4px;
  padding:20px 22px;margin:22px 0;text-align:center;
  font-family:${TYPE.mono};font-size:15px;line-height:1.8;color:var(--ink);overflow-x:auto}

pre.code{background:var(--sunk);border:1px solid var(--rule-soft);border-radius:4px;
  padding:16px 18px;margin:22px 0;
  font-family:${TYPE.mono};font-size:13px;line-height:1.75;color:var(--ink);overflow-x:auto}

.after-fig{margin-top:26px}

.note{background:var(--sunk);border:1px solid var(--rule-soft);border-radius:4px;
  padding:19px 22px;margin:24px 0;font-size:16px;line-height:1.55;color:var(--ink-2)}
.note .lab{display:block;margin-bottom:8px;color:var(--sig)}
.note p:last-child{margin-bottom:0}

blockquote{margin:22px 0;padding-left:20px;border-left:2px solid var(--sig-2);
  font-size:18px;line-height:1.5;color:var(--ink)}
blockquote cite{display:block;margin-top:10px;font-style:normal;font-size:12.5px;
  font-family:${TYPE.mono};color:var(--ink-3);letter-spacing:.02em;line-height:1.5}

.tw{overflow-x:auto;border:1px solid var(--rule);border-radius:4px;background:var(--surface);margin:0 0 26px}
table{border-collapse:collapse;width:100%;min-width:560px;font-size:15px}
th{font-family:${TYPE.mono};font-size:10.5px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--ink-3);font-weight:500;text-align:left;padding:13px 16px;border-bottom:1px solid var(--rule);white-space:nowrap}
td{padding:14px 16px;border-bottom:1px solid var(--rule-soft);vertical-align:top;color:var(--ink-2)}
tr:last-child td{border-bottom:0}
td.k{color:var(--ink);font-weight:600;white-space:nowrap;font-family:${TYPE.display}}
td.v{font-family:${TYPE.mono};font-size:12.5px;color:var(--ink);word-break:break-all}
td.n{font-family:${TYPE.mono};font-size:12.5px;color:var(--ink-2);white-space:nowrap;text-align:right}
.tag{display:inline-block;font-family:${TYPE.mono};font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;padding:3px 8px;border-radius:2px;white-space:nowrap}
.tag.held{background:var(--held-soft);color:var(--held)}
.tag.cert{background:var(--sig-soft);color:var(--sig)}
.tag.open{background:var(--warn-soft);color:var(--warn)}
.tag.dep{background:var(--sunk);color:var(--ink-3);border:1px solid var(--rule)}

.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:8px 0 0}
@media (max-width:680px){.cards{grid-template-columns:1fr}}
a.card{display:flex;flex-direction:column;gap:9px;background:var(--surface);
  border:1px solid var(--rule);border-radius:4px;padding:22px 24px;
  color:inherit;text-decoration:none;transition:border-color .15s ease}
a.card:hover{border:1px solid var(--sig)}
a.card:focus-visible{outline:2px solid var(--sig);outline-offset:3px}
.card-k{font-family:${TYPE.mono};font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--sig)}
.card-t{font-family:${TYPE.display};font-weight:700;font-size:19.5px;line-height:1.22;
  letter-spacing:-.012em;color:var(--ink);text-wrap:balance}
.card-d{font-size:14.5px;line-height:1.52;color:var(--ink-2)}
.card-n{margin-top:auto;padding-top:6px;font-family:${TYPE.mono};font-size:11px;
  letter-spacing:.05em;color:var(--ink-3)}

/* PICKER — CSS-state tabs. Radios carry the state, labels are the controls,
   the panels are siblings. Same device as the nav drawer: no script, so it
   works in a reader that runs none, and the radios keep arrow-key semantics
   for free. The nth-of-type pairs are generated below. */
.picker{margin:8px 0 0}
.pk-r{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.pk-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.pk-t{display:flex;flex-direction:column;gap:3px;cursor:pointer;padding:10px 14px;
  border:1px solid var(--rule);border-radius:4px;background:var(--surface);
  transition:border-color .15s ease,background .15s ease}
.pk-t:hover{border-color:var(--sig)}
.pk-t .pk-k{font-family:${TYPE.mono};font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--ink-3)}
.pk-t .pk-n{font-family:${TYPE.display};font-weight:650;font-size:15px;color:var(--ink-2);line-height:1.2}
.pk-p{display:none}
.pk-p .pk-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:6px}
.pk-p h3{font-family:${TYPE.display};font-weight:700;font-size:21px;letter-spacing:-.012em;
  color:var(--ink);margin:0}
.pk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
@media (max-width:680px){.pk-grid{grid-template-columns:1fr}}
.pk-box{background:var(--sunk);border:1px solid var(--rule-soft);border-radius:4px;padding:18px 20px}
.pk-box .lab{display:block;margin-bottom:8px;font-family:${TYPE.mono};font-size:10.5px;
  letter-spacing:.12em;text-transform:uppercase;color:var(--sig)}
.pk-box.warn .lab{color:var(--warn)}
.pk-box p{margin:0;font-size:15px;line-height:1.55;color:var(--ink-2)}
${Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return `.pk-r:nth-of-type(${n}):checked ~ .pk-tabs > .pk-t:nth-child(${n})`
    + `{border-color:var(--sig);background:var(--sig-soft)}\n`
    + `.pk-r:nth-of-type(${n}):checked ~ .pk-tabs > .pk-t:nth-child(${n}) .pk-n{color:var(--ink)}\n`
    + `.pk-r:nth-of-type(${n}):checked ~ .pk-tabs > .pk-t:nth-child(${n}) .pk-k{color:var(--sig)}\n`
    + `.pk-r:nth-of-type(${n}):focus-visible ~ .pk-tabs > .pk-t:nth-child(${n})`
    + `{outline:2px solid var(--sig);outline-offset:3px}\n`
    + `.pk-r:nth-of-type(${n}):checked ~ .pk-panes > .pk-p:nth-child(${n}){display:block}`;
}).join('\n')}

ul.plain{list-style:none;padding:0;margin:0}
ul.plain li{padding:16px 0;border-top:1px solid var(--rule-soft);font-size:16.5px;line-height:1.55;color:var(--ink-2)}
ul.plain li:first-child{border-top:0}
ul.plain b{color:var(--ink);font-weight:600}

footer{margin:76px 0 0;padding-top:24px;border-top:1px solid var(--rule);
  color:var(--ink-3);font-size:14px;line-height:1.65;font-family:${TYPE.mono}}
footer p{margin:0 0 12px}
footer a{color:var(--ink-2);border-bottom-color:var(--rule)}

/* ---- the machine schematic (components.flow) ----
   Nodes are keyboard-focusable buttons; the readout above the drawing narrates
   whichever node is active. Without scripts the readout keeps its default text
   and hover still highlights — the figure degrades, it does not vanish. */
.mach .figbox{padding-top:18px}
/* the schematic is drawn vertical at 800 design units; cap the rendered width
   at that same 800 so desktop renders near 1:1 and never inflates the type */
.mach svg{max-width:800px;margin:0 auto}
.mach-ro{display:grid;grid-template-columns:auto 1fr;gap:4px 18px;align-items:baseline;
  border-bottom:1px solid var(--rule-soft);padding-bottom:14px;margin-bottom:10px}
.mach-ro .k{font-family:${TYPE.mono};font-size:11px;letter-spacing:.13em;text-transform:uppercase;
  color:var(--sig);white-space:nowrap}
.mach-ro .d{font-size:14.5px;line-height:1.5;color:var(--ink-2);min-height:3em}
.mach svg .nd{cursor:pointer;outline:none}
.mach svg .nd-box{fill:var(--sunk);stroke:var(--rule);stroke-width:1;transition:stroke .15s ease}
.mach svg .nd:hover .nd-box,.mach svg .nd:focus-visible .nd-box{stroke:var(--sig);stroke-width:1.5}
.mach svg .nd.on .nd-box{stroke:var(--sig);stroke-width:1.6}
.mach svg .acc-sig{fill:var(--sig)}
.mach svg .acc-held{fill:var(--held)}
.mach svg .acc-warn{fill:var(--warn)}
.mach svg .acc-dep{fill:var(--mark)}
.mach svg .nd-k{font-size:10px;letter-spacing:.1em;fill:var(--ink-3)}
.mach svg .nd-v{font-size:12.5px;fill:var(--ink);font-weight:500}
.mach svg .ed{fill:none;stroke:var(--rule);stroke-width:1.5}
.mach svg .ed-f{fill:none;stroke:var(--sig-2);stroke-width:1.5;stroke-dasharray:5 90;visibility:hidden}
.mach svg .ed-lab{font-size:11px;fill:var(--ink-3)}
@media (prefers-reduced-motion:no-preference){
  .mach svg .ed-f{visibility:visible;animation:machflow 3.4s linear infinite}
}
@keyframes machflow{from{stroke-dashoffset:0}to{stroke-dashoffset:-95}}

@media (prefers-reduced-motion:no-preference){
  h1,.deck,.stats{animation:up .55s cubic-bezier(.2,.7,.3,1) both}
  .deck{animation-delay:.05s}.stats{animation-delay:.1s}
}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
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
