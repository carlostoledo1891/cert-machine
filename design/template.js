/* template.js — the page shell. Every HTML file in this repository comes out
   of here, and nothing else emits a <style> block or a <body>.
   design/ · cert-machine

   render({title, headRaw, bodyRaw, footRaw}) -> a complete standalone document.

   SELF-CONTAINED BY CONSTRUCTION. The CSS is inlined, the figures are inline
   SVG, and the only script is the few lines components.flow() ships for its
   readout — with scripts off the schematic keeps its default narration and
   nothing else on the page changes. The only network reference is the Google
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
.page{max-width:${MEASURE.page};margin:0 auto;padding:${SCALE.pagePadY} ${SCALE.pagePadX} 96px}
.col{max-width:${MEASURE.prose};margin:0 auto}
.wide{max-width:${MEASURE.wide};margin:0 auto}

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
figcaption{color:var(--ink-2);font-size:15.5px;line-height:1.5;margin-top:14px;max-width:70ch}
.figbox svg text{font-family:${TYPE.mono}}
.t-ax{font-size:12px;fill:var(--ink-3)}
.t-lab{font-size:13px;fill:var(--ink)}
.t-key{font-size:12.5px;fill:var(--sig);font-weight:500}
.t-held{font-size:12.5px;fill:var(--held);font-weight:500}
.t-warn{font-size:12.5px;fill:var(--warn);font-weight:500}
.t-note{font-size:11.5px;fill:var(--ink-3)}

.pull{font-family:${TYPE.display};font-weight:700;font-size:${SCALE.pull};
  line-height:1.2;letter-spacing:-.02em;margin:32px 0;text-wrap:balance}
.pull b{color:var(--sig)}

.eq{background:var(--sunk);border:1px solid var(--rule-soft);border-radius:4px;
  padding:20px 22px;margin:22px 0;text-align:center;
  font-family:${TYPE.mono};font-size:15px;line-height:1.8;color:var(--ink);overflow-x:auto}

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

function render({ title, bodyRaw, footRaw }) {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${require('./components.js').esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${T.GOOGLE_FONTS}">
<script defer src="/_vercel/insights/script.js"></script>

<style>
${css()}
</style>

<div class="page">

${bodyRaw}

${footRaw || ''}

</div>
</html>
`;
}

module.exports = { render, css };
