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
/* the balanced n-item grid lives in design/grid.js so /instruments can reach it
   too — the legend there was declaring its column count by hand on four pages */
const { balancedGrid } = require('./grid.js');
const NAVJS = require('./nav.js');

/* which nav link is the current one, from the page's own path */
function sectionOf(p) {
  const m = /^\/(reports|instruments|machine|about)\b/.exec(p || '');
  return m ? m[1] : '';
}

/* ---- THE FULL-ROW RULE (2026-09-02, standing) --------------------------
   A grid must never expose an empty track. The fused stats grid paints its
   1px rules with the CONTAINER background, so an unfilled row renders as a
   giant blank "cell" — the broken-grid look the operator flagged across
   the site. The rule, enforced by construction + a battery gate:
   · .stats carries data-n = its cell count (components.js emits it; the
     design battery refuses any built page where they disagree). Rows are
     BALANCED at build: n cells split into ceil(n/4) rows whose sizes
     differ by at most 1; the track count is the lcm of the row sizes and
     every cell spans lcm/rowsize — so every row is exactly full at every
     count. Mobile-first base is 2 columns with the odd last cell spanning
     both; the per-count desktop rules live in a min-width query, so no
     specificity fight.
   · every other fixed-column grid (.cards, .pk-grid, the app shell's
     block grids) carries remainder guards: the last row's cells span the
     leftover tracks, whatever the count. */

function css() {
  const { SCALE, LAYOUT } = T;
  const NAVCSS = NAVJS.navCss(SCALE.pagePadX);
  return `
${T.rootCss()}

*{box-sizing:border-box}
html{color-scheme:dark;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink-2);
  font-family:var(--f-sans);font-size:${SCALE.body};line-height:1.65;font-weight:400;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
::selection{background:var(--ink);color:var(--paper)}
.page{max-width:${LAYOUT.container};margin:0 auto;padding:calc(${SCALE.pagePadY} + 60px) ${SCALE.pagePadX} 96px}

${NAVCSS}
/* ---- THE TWO TRACKS, and there are only two (2026-09-04, phase 2) ----
   '.col' USED TO BE A CENTRED 68ch BOX inside a centred 900px figure track,
   which put the prose at x=398 and every table at x=270 — a figure standing
   128px proud of the paragraph above it on both sides, and a left edge that
   moved depending on what an element was. The ruler counted three such spines
   across the site and the front page shared none of them with /instruments.

   The fix is the one playground/design/shell.css already found: THE COLUMN
   DOES NOT CAP THE WIDTH, IT CAPS THE TEXT. '.col' runs the full container so
   whatever comes next — a table, a card grid, a figure — already has the
   track, and only the reading elements inside it take the measure. There is
   nothing left for a breakout to break out OF, so '.col .wide' is a no-op and
   the translateX trick that produced the 1849px table is gone. */
.col,.wide{max-width:none;margin-left:0;margin-right:0}
.col > p,.col > ul,.col > ol,.col > blockquote,.col > .deck,.col > .scope,
.col > h1,.col > h2,.col > h3,.col > h4{max-width:${LAYOUT.read}}
.col .wide{position:static;left:auto;transform:none;width:auto}

h1,h2,h3{font-family:var(--f-display);color:var(--ink);text-wrap:balance}
h1{font-size:${SCALE.h1};line-height:1.04;margin:16px 0 0;letter-spacing:-.035em;font-weight:550}
h2{font-size:${SCALE.h2};line-height:1.12;margin:0 0 8px;letter-spacing:-.02em;font-weight:530}
h3{font-size:${SCALE.h3};line-height:1.25;margin:0 0 6px;letter-spacing:-.02em;font-weight:530}
.eyebrow,.lab{font-family:var(--f-mono);font-size:${SCALE.eyebrow};font-weight:500;
  letter-spacing:.16em;text-transform:uppercase}
.eyebrow{color:var(--ink-4)}
.lab{color:var(--ink-4)}
.deck{font-size:${SCALE.deck};line-height:1.55;color:var(--ink-3);font-weight:400;margin:24px 0 0;
  max-width:${LAYOUT.read};text-wrap:pretty}
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

/* stat tiles — the fused grid: 1px gaps painted by the border colour.
   FULL-ROW RULE: mobile-first 2 columns with the odd last cell spanning
   both; the balanced per-count desktop layouts (see statsGridRules) live
   in the min-width query below, keyed on data-n. */
.stats{margin:48px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
  gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:10px;overflow:hidden}
.stats .stat:last-child:nth-child(odd){grid-column:1/-1}
@media (min-width:681px){
${balancedGrid('.stats', '.stat')}
}
.stat{background:var(--sunk);padding:24px;display:flex;flex-direction:column;gap:8px}
.stat .k{font-family:var(--f-mono);font-size:${SCALE.eyebrow};letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4)}
.stat .v{font-family:var(--f-display);font-weight:530;font-size:clamp(1.4rem,1.05rem + 1.1vw,2rem);
  line-height:1.1;color:var(--ink);letter-spacing:-.02em;font-variant-numeric:tabular-nums;min-width:0}
.stat .v.sm{font-size:.875rem;font-family:var(--f-mono);font-weight:500;letter-spacing:-.01em;white-space:nowrap;line-height:1.45}
.stat .n{font-size:${SCALE.eyebrow};font-family:var(--f-mono);line-height:1.5;color:var(--ink-4)}

/* DISCLOSURE — a long table folded after its first rows. Script-free: a reader
   who wants the rest opens it, and one who does not is not made to scroll past
   it. The summary carries the count, so the fold says what it is hiding rather
   than just saying "more". */
details.more{margin-top:24px}
.wide details.more .wide{position:static;left:auto;transform:none;width:auto;max-width:none}
details.more > summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:10px;
  font-family:var(--f-mono);font-size:${SCALE.eyebrow};letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-3);border:1px solid var(--rule-strong);border-radius:999px;padding:7px 16px;
  transition:color .15s ease,border-color .15s ease}
details.more > summary::-webkit-details-marker{display:none}
details.more > summary::after{content:'+';font-size:14px;line-height:1;color:var(--ink-4)}
details.more[open] > summary::after{content:'\u2212'}
details.more > summary:hover{color:var(--ink);border-color:var(--ink-3)}
details.more > summary:focus-visible{outline:2px solid var(--ink-3);outline-offset:3px}
details.more[open] > summary{margin-bottom:24px}
.scope{margin:24px 0 0;max-width:${LAYOUT.read};border-left:2px solid var(--rule-strong);padding-left:18px;
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
  color:var(--ink);box-shadow:var(--shadow);max-width:280px}
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
.cards>:last-child:nth-child(odd){grid-column:1/-1} /* FULL-ROW RULE: an odd last card fills its row */
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
.pk-grid>:last-child:nth-child(odd){grid-column:1/-1} /* FULL-ROW RULE */
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

/* Structured data for answer engines: type picked by served path, content
   drawn from the SAME title/desc the visible head carries — one source, so
   the card and the page can never disagree. Emitted only for pages with a
   canonical home. */
const GITHUB_REPO = 'https://github.com/carlostoledo1891/cert-machine';
const CONCEPT_DOI = 'https://doi.org/10.5281/zenodo.22225860';
const PERSON = {
  '@type': 'Person', name: 'Carlos Toledo', url: SITE_ORIGIN + '/about/',
  sameAs: ['https://github.com/carlostoledo1891', GITHUB_REPO],
};
function ldJson(pagePath, title, d, canon) {
  let obj = null;
  if (pagePath === '/') {
    obj = {
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: 'cert-machine · Carlos Toledo', url: SITE_ORIGIN, description: d,
      author: PERSON, sameAs: [GITHUB_REPO, CONCEPT_DOI],
    };
  } else if (pagePath === '/about/') {
    obj = {
      '@context': 'https://schema.org', '@type': 'ProfilePage',
      url: canon, mainEntity: Object.assign({}, PERSON, { description: d }),
    };
  } else if (pagePath.startsWith('/reports/') && pagePath.endsWith('.html')) {
    obj = {
      '@context': 'https://schema.org', '@type': 'ScholarlyArticle',
      headline: title, description: d, url: canon,
      image: SITE_ORIGIN + '/og.png', author: PERSON,
      isPartOf: { '@type': 'WebSite', name: 'cert-machine', url: SITE_ORIGIN },
      isBasedOn: GITHUB_REPO,
    };
  }
  if (!obj) return '';
  const json = JSON.stringify(obj).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function render({ title, bodyRaw, footRaw, desc, path: pagePath }) {
  const CO = require('./components.js');
  /* the nav — links, markup and CSS — is design/nav.js, so /instruments can
     carry the same one. It used to be a link list inline in this function. */
  const NAV = NAVJS.navHtml({ here: sectionOf(pagePath) });
  const d = desc || DEFAULT_DESC;
  const canon = pagePath ? SITE_ORIGIN + pagePath : null;
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${CO.esc(title)}</title>
<meta name="description" content="${CO.escAttr(d)}">
<meta name="author" content="Carlos Toledo">
<meta name="theme-color" content="#0a0a0c">
<meta name="robots" content="max-image-preview:large">
${canon ? `<link rel="canonical" href="${canon}">\n<meta property="og:url" content="${canon}">` : ''}
<meta property="og:title" content="${CO.escAttr(title)}">
<meta property="og:description" content="${CO.escAttr(d)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="cert-machine · Carlos Toledo">
<meta property="og:image" content="${SITE_ORIGIN}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="cert-machine — certified mathematics by Carlos Toledo: dark control-room landing page">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${CO.escAttr(title)}">
<meta name="twitter:description" content="${CO.escAttr(d)}">
<meta name="twitter:image" content="${SITE_ORIGIN}/og.png">
${pagePath ? ldJson(pagePath, title, d, canon) : ''}
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

module.exports = { render, css, DEFAULT_DESC };
