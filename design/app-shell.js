/* app-shell.js — the SECOND page view of the design system: a full-viewport
   application surface (100% width x 100dvh) with a fixed top bar, a lateral
   panel of cards, and a bottom transport dock. Same palette tokens, same type
   tokens and the same three-state theme rule as template.js.

   TYPE HISTORY, because this block used to diverge and the reason mattered.
   The operator's 2026-08-27 definition gave app pages their own stack —
   sans-serif UI (Inter) plus the house mono — under the rule "no serif on app
   pages", which was correct while the reports ran on a display serif and a
   serif for prose. On 2026-08-31 the whole site moved to sans, so the reason
   for a second stack expired with it. --f-sans, --f-display and --f-mono now
   all come from tokens.js: the app keeps its own variable NAMES, because its
   CSS is written against them, but it no longer owns a single font VALUE.
   One family list, one font request, for reports and apps alike.

   renderApp({ title, description, panelHtml, dockHtml, brand, appName,
               homeHref, navLinks, configJson, scripts, styles }) -> document.

   App verdict tokens (--v-cert / --v-refu / --v-refd) are defined HERE in
   both palettes with the standard three-state guards; WebGL clients read
   the computed values at runtime — no literal colour leaves this block.   */
'use strict';

const T = require('./tokens.js');

const APP_LIGHT = { '--v-cert': '#2C6142', '--v-refu': '#C64B42', '--v-refd': '#8F8798',
  '--v-cert-soft': '#DEEBE3', '--v-refu-soft': '#F4DEDC', '--v-refd-soft': '#E8E5EC',
  '--shadow': '0 10px 30px rgba(22,18,26,.14)' };
const APP_DARK  = { '--v-cert': '#79C79B', '--v-refu': '#E06B62', '--v-refd': '#8E8499',
  '--v-cert-soft': '#16281E', '--v-refu-soft': '#2E1917', '--v-refd-soft': '#211C29',
  '--shadow': '0 12px 34px rgba(0,0,0,.5)' };

/* the SAME request the reports make — derived, never restated */
const APP_FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="' + T.GOOGLE_FONTS + '">';

function vars(o) { return Object.entries(o).map(([k, v]) => k + ':' + v).join(';'); }

function appCss() {
  return `
:root{${vars(APP_LIGHT)}}   /* --f-sans/--f-display/--f-mono come from T.rootCss(), emitted just above */
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(APP_DARK)}}}
:root[data-theme="dark"]{${vars(APP_DARK)}}
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden;background:var(--paper);color:var(--ink)}
body{font-family:var(--f-sans);font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
a{color:inherit}
.as-map{position:fixed;inset:0}
.as-map canvas{outline:none}

/* ---- top bar ---- */
.as-top{position:fixed;top:0;left:0;right:0;height:56px;z-index:30;display:flex;align-items:center;
  gap:14px;padding:0 20px;background:var(--paper);border-bottom:1px solid var(--rule)}
.as-top .brand{font-family:var(--f-mono);font-weight:600;font-size:11px;letter-spacing:.14em;
  color:var(--ink);text-decoration:none;white-space:nowrap}
.as-top .sep{width:1px;height:20px;background:var(--rule)}
.as-top .appname{font-family:var(--f-display);font-weight:700;letter-spacing:-.01em;font-size:14px;letter-spacing:.01em;color:var(--ink)}
.as-top .meta{font-family:var(--f-mono);font-size:10.5px;letter-spacing:.1em;color:var(--ink-3);
  border:1px solid var(--rule);border-radius:999px;padding:3px 10px;white-space:nowrap}
.as-top .spacer{flex:1}
.as-top a.navx{color:var(--ink-2);text-decoration:none;font-family:var(--f-mono);font-size:10.5px;
  letter-spacing:.12em;text-transform:uppercase;padding:6px 2px;transition:color .12s}
.as-top a.navx:hover{color:var(--sig)}

/* ---- panels: right = tabbed workspace; left = the selected flight ---- */
.as-panel{position:fixed;top:68px;right:12px;bottom:92px;width:404px;z-index:20;overflow-y:auto;
  display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}
.as-left{position:fixed;top:68px;left:12px;bottom:92px;width:372px;z-index:21;overflow-y:auto;
  display:none;flex-direction:column;gap:10px;scrollbar-width:thin}
.as-left.open{display:flex}
.as-left.min{bottom:auto}
.as-left.min .as-card > *:not(.as-lhead){display:none}
.as-lhead{display:flex;align-items:center;gap:8px;margin:-2px 0 8px}
.as-left.min .as-lhead{margin:0}
.as-lhead .t{font-family:var(--f-mono);font-weight:600;font-size:12px;letter-spacing:.06em;flex:1}
.as-lhead button{width:24px;height:24px;border-radius:6px;border:1px solid var(--rule);
  background:var(--sunk);color:var(--ink-2);cursor:pointer;font-size:12px;line-height:1;padding:0}
.as-lhead button:hover{border-color:var(--sig);color:var(--sig)}

/* ---- tab bar (right panel) ---- */
.as-tabs{display:flex;gap:4px;background:var(--surface);border:1px solid var(--rule);
  border-radius:12px;padding:4px;box-shadow:var(--shadow);flex:none}
.as-tabs button{flex:1;border:0;background:transparent;font-family:var(--f-mono);font-weight:600;
  font-size:11px;letter-spacing:.12em;color:var(--ink-3);padding:8px 0;border-radius:9px;
  cursor:pointer;transition:all .15s}
.as-tabs button:hover{color:var(--sig)}
.as-tabs button[data-on="1"]{background:var(--sig-soft);color:var(--sig)}
.as-tabbody{display:none;flex-direction:column;gap:10px}
.as-tabbody.on{display:flex}

/* ---- annunciators (cockpit lozenge: binary states) ---- */
.as-ann{display:inline-flex;align-items:center;justify-content:center;min-width:64px;
  font-family:var(--f-mono);font-weight:700;font-size:11px;letter-spacing:.14em;
  padding:5px 10px;border-radius:6px;border:1px solid}
.as-ann.go{color:var(--v-cert);border-color:var(--v-cert);background:var(--v-cert-soft)}
.as-ann.no{color:var(--v-refu);border-color:var(--v-refu);background:var(--v-refu-soft)}
.as-ann.na{color:var(--v-refd);border-color:var(--v-refd);background:var(--v-refd-soft)}

/* ---- arc gauge ---- */
.as-gauge{display:block;margin:0 auto}
.as-gauge .bg{stroke:var(--sunk);stroke-width:9;fill:none}
.as-gauge .fg{stroke:var(--v-cert);stroke-width:9;fill:none;stroke-linecap:round;
  transition:stroke-dashoffset .45s cubic-bezier(.4,0,.2,1)}
.as-gauge text{font-family:var(--f-mono);fill:var(--ink)}
.as-gaugelbl{font-family:var(--f-mono);font-size:9.5px;letter-spacing:.12em;color:var(--ink-3);
  text-transform:uppercase;text-align:center;margin-top:2px}

/* ---- fleet silhouettes ---- */
.as-fleet{display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-height:30px}
.as-fleet svg{width:30px;height:30px;transition:all .3s cubic-bezier(.34,1.56,.64,1)}
.as-fleet svg.on{color:var(--sig)}
.as-fleet svg.off{color:var(--rule);transform:scale(.82)}

/* ---- battery pictogram ---- */
.as-batt{display:flex;align-items:center;gap:10px}
.as-batt .shell{position:relative;width:64px;height:26px;border:2px solid var(--rule);
  border-radius:5px;flex:none}
.as-batt .shell:after{content:'';position:absolute;right:-6px;top:7px;width:4px;height:8px;
  background:var(--rule);border-radius:0 2px 2px 0}
.as-batt .fill{position:absolute;inset:2px;border-radius:2px;background:var(--v-cert);
  transform-origin:left;transition:transform .3s,background .3s}
.as-routebadge{font-family:var(--f-mono);font-size:10px;letter-spacing:.08em;color:var(--ink-3)}

/* ---- live mission ---- */
.as-dispatch{font-family:var(--f-mono);font-weight:700;font-size:11px;letter-spacing:.12em;
  color:var(--sig);border:1px solid var(--sig);background:var(--sig-soft);border-radius:6px;
  padding:5px 12px;cursor:pointer;transition:all .15s}
.as-dispatch:hover{filter:brightness(1.15);transform:translateY(-1px)}
.as-dispatch[disabled]{opacity:.35;cursor:not-allowed;transform:none}
.as-datablocks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
.as-db{background:var(--sunk);border:1px solid var(--rule-soft);border-radius:8px;padding:7px 9px}
.as-db span{display:block;font-family:var(--f-mono);font-size:8.5px;letter-spacing:.14em;
  color:var(--ink-3);text-transform:uppercase}
.as-db b{font-family:var(--f-mono);font-weight:600;font-size:15px;color:var(--ink);white-space:nowrap}
.as-db.live b{color:var(--sig)}
.as-journey{display:flex;align-items:center;gap:8px;font-family:var(--f-mono);font-weight:600;
  font-size:12px;margin:6px 0 2px}
.as-journey .bar{flex:1;height:5px;border-radius:3px;background:var(--sunk);overflow:hidden;
  border:1px solid var(--rule-soft)}
.as-journey .bar i{display:block;height:100%;background:var(--sig);border-radius:3px;
  transition:width .3s linear}
.as-missions{font-family:var(--f-mono);font-size:10px;letter-spacing:.1em;color:var(--sig)}
.as-card{background:var(--surface);border:1px solid var(--rule);border-radius:12px;
  padding:14px 16px;box-shadow:var(--shadow)}
.as-h{font-family:var(--f-mono);font-weight:600;font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink-3);margin:0 0 10px}
.as-note{font-size:12px;color:var(--ink-2);line-height:1.55}
.as-note b{color:var(--ink);font-weight:600}
.as-fine{font-size:11px;color:var(--ink-3);line-height:1.5}
details.as-more summary{cursor:pointer;font-family:var(--f-mono);font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--ink-3);margin-top:10px}
details.as-more summary:hover{color:var(--sig)}
details.as-more[open] summary{margin-bottom:6px}

/* ---- the aircraft x rule matrix ---- */
.as-mx{display:grid;grid-template-columns:1fr auto auto;gap:7px 8px;align-items:center}
.as-mx .name{font-weight:500;font-size:12.5px;color:var(--ink)}
.as-cell{font-family:var(--f-mono);font-size:10px;letter-spacing:.06em;padding:5px 10px;
  border-radius:7px;border:1px solid var(--rule);background:var(--sunk);color:var(--ink-2);
  cursor:pointer;transition:all .12s;display:inline-flex;align-items:center;gap:6px}
.as-cell:hover{border-color:var(--sig-2);color:var(--sig)}
.as-cell[data-on="1"]{border-color:var(--sig);background:var(--sig-soft);color:var(--sig);font-weight:600}
.as-dot{width:7px;height:7px;border-radius:50%;flex:none}

.as-score{grid-column:1/-1;font-family:var(--f-mono);font-weight:600;font-size:22px;color:var(--ink);
  padding-bottom:2px}
.as-score span{font-family:var(--f-sans);font-weight:400;font-size:11.5px;color:var(--ink-3);margin-left:6px}
/* ---- stat tiles ---- */
.as-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.as-stat{background:var(--sunk);border:1px solid var(--rule-soft);border-radius:9px;
  padding:9px 11px;border-left-width:3px}
/* the big number is always the signature pink (operator ruling 2026-08-31);
   the verdict stays on the tile's left border, never on the number */
.as-stat b{display:block;font-family:var(--f-mono);font-weight:600;font-size:20px;line-height:1.1;color:var(--sig)}
.as-stat span{font-family:var(--f-mono);font-size:9px;letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase}
.as-stat.c{border-left-color:var(--v-cert)} .as-stat.r{border-left-color:var(--v-refu)} .as-stat.f{border-left-color:var(--v-refd)}

/* ---- frontier rows ---- */
.as-frow{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:7px 0;
  border-top:1px solid var(--rule-soft)}
.as-frow:first-of-type{border-top:0;padding-top:0}
.as-frow .name{font-weight:500;font-size:12.5px}
.as-frow .val{font-family:var(--f-mono);font-weight:600;font-size:13px;white-space:nowrap}
.as-frow .val.zero{color:var(--ink-3);font-weight:400}
.as-frow .sub{display:block;font-size:10.5px;color:var(--ink-3);margin-top:1px}

/* ---- selected flight ---- */
.as-kv{display:grid;grid-template-columns:auto 1fr;gap:3px 14px;font-size:12px;color:var(--ink-3)}
.as-kv b{color:var(--ink);font-weight:600;font-family:var(--f-mono);font-size:12px}
.as-verdict{border-left:3px solid var(--rule);background:var(--sunk);border-radius:9px;
  padding:10px 13px;margin:12px 0 10px}
.as-verdict .w{font-family:var(--f-mono);font-weight:700;font-size:14px;letter-spacing:.08em}
.as-verdict .e{font-size:11.5px;color:var(--ink-2);margin-top:4px;line-height:1.5}
.as-verdict.C{border-left-color:var(--v-cert);background:var(--v-cert-soft)} .as-verdict.C .w{color:var(--v-cert)}
.as-verdict.R{border-left-color:var(--v-refu);background:var(--v-refu-soft)} .as-verdict.R .w{color:var(--v-refu)}
.as-verdict.F{border-left-color:var(--v-refd);background:var(--v-refd-soft)} .as-verdict.F .w{color:var(--v-refd)}

/* ---- enclosure viz ---- */
.as-enc{margin:10px 0 4px}
.as-encrow{display:grid;grid-template-columns:64px 1fr;gap:8px;align-items:center;margin:5px 0}
.as-encrow .lbl{font-family:var(--f-mono);font-size:9.5px;letter-spacing:.1em;color:var(--ink-3);text-transform:uppercase;text-align:right}
.as-encrow .track{position:relative;height:12px;background:var(--sunk);border:1px solid var(--rule-soft);border-radius:6px}
.as-encrow .band{position:absolute;top:1px;bottom:1px;border-radius:5px;min-width:4px}
.as-encrow .band.u{background:var(--v-cert)} .as-encrow .band.d{background:var(--v-refu)}
.as-encscale{display:grid;grid-template-columns:64px 1fr;gap:8px;font-family:var(--f-mono);font-size:9.5px;color:var(--ink-3)}
.as-encscale div{display:flex;justify-content:space-between}
.as-encvals{font-family:var(--f-mono);font-size:10.5px;color:var(--ink-2);margin-top:6px;line-height:1.6}

/* ---- buttons + segmented ---- */
button{font-family:inherit}
.as-btn{font-family:var(--f-mono);font-size:11px;letter-spacing:.06em;background:var(--sunk);
  color:var(--ink);border:1px solid var(--rule);border-radius:8px;padding:7px 12px;cursor:pointer;transition:all .12s}
.as-btn:hover{border-color:var(--sig);color:var(--sig)}
.as-btn[data-on="1"]{border-color:var(--sig);color:var(--sig);background:var(--sig-soft)}
select.as-sel{font-family:var(--f-mono);font-size:11px;background:var(--sunk);color:var(--ink);
  border:1px solid var(--rule);border-radius:8px;padding:6px 8px;color-scheme:light dark;max-width:100%}
select.as-sel:hover{border-color:var(--sig)}
.as-seg{display:inline-flex;background:var(--sunk);border:1px solid var(--rule);border-radius:9px;padding:2px;gap:2px}
.as-seg button{border:0;background:transparent;font-family:var(--f-mono);font-size:10.5px;
  letter-spacing:.04em;color:var(--ink-2);padding:5px 10px;border-radius:7px;cursor:pointer;transition:all .12s}
.as-seg button:hover{color:var(--sig)}
.as-seg button[data-on="1"]{background:var(--sig-soft);color:var(--sig);font-weight:600}

/* ---- dock ---- */
.as-dock{position:fixed;left:0;right:0;bottom:0;height:76px;z-index:30;display:flex;align-items:center;
  gap:16px;padding:0 20px;background:var(--paper);border-top:1px solid var(--rule)}
.as-play{width:42px;height:42px;flex:none;border-radius:50%;border:1px solid var(--rule);
  background:var(--sunk);color:var(--ink);font-size:13px;cursor:pointer;transition:all .12s;
  display:flex;align-items:center;justify-content:center}
.as-play:hover{border-color:var(--sig);color:var(--sig)}
.as-clock{font-family:var(--f-mono);font-weight:600;font-size:14px;color:var(--ink);min-width:96px;text-align:center}
.as-dock .attr{margin-left:auto;font-size:9.5px;color:var(--ink-3);text-align:right;line-height:1.4;max-width:220px}
.as-dock .attr a{color:var(--ink-3)}

/* ---- the scrubber ---- */
input[type=range].as-scrub{flex:1;min-width:0;-webkit-appearance:none;appearance:none;height:26px;background:transparent;cursor:pointer}
.as-scrub::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:var(--rule)}
.as-scrub::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;
  background:var(--sig);margin-top:-5px;border:2px solid var(--paper);box-shadow:0 1px 4px rgba(0,0,0,.35)}
.as-scrub::-moz-range-track{height:4px;border-radius:2px;background:var(--rule)}
.as-scrub::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--sig);border:2px solid var(--paper)}

.maplibregl-ctrl-attrib{font-size:10px}
.as-panel::-webkit-scrollbar{width:6px}
.as-panel::-webkit-scrollbar-thumb{background:var(--rule);border-radius:3px}

@media (max-width:720px){
  .as-top{height:48px;padding:0 12px;gap:10px}
  .as-top .appname{font-size:12.5px}
  .as-top .meta,.as-top .navx{display:none}
  .as-panel{left:8px;right:8px;top:auto;bottom:88px;width:auto;max-height:44dvh;gap:8px}
  .as-left{left:8px;right:8px;top:auto;bottom:88px;width:auto;max-height:52dvh;z-index:24}
  .as-card{padding:12px 13px;border-radius:11px}
  .as-dock{gap:9px;padding:0 10px;height:64px}
  .as-play{width:36px;height:36px}
  .as-clock{min-width:78px;font-size:12.5px}
  .as-dock .attr{display:none}
  #speed{display:none}
  .as-seg button{padding:5px 8px;font-size:10px}
}`;
}

function renderApp(o) {
  const cfg = o.configJson ? '<script>window.SKYAUDIT = ' + o.configJson + ';</script>' : '';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${o.title}</title>
<meta name="description" content="${o.description || ''}">
${APP_FONTS}
${(o.styles || []).map((h) => `<link rel="stylesheet" href="${h}">`).join('\n')}
<style>${T.rootCss()}${appCss()}</style>
<script>/* ?theme=light|dark stamps the explicit theme state; absent = system */
(function(){var t=new URLSearchParams(location.search).get('theme');
if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;})();</script>
</head><body>
<div id="map" class="as-map" aria-label="${o.mapAria || 'interactive map'}"></div>
<header class="as-top">
  <a class="brand" href="${o.homeHref || '/'}">${o.brand || 'CERT-MACHINE'}</a>
  <span class="sep"></span>
  <span class="appname">${o.appName || ''}</span>
  ${o.meta ? `<span class="meta">${o.meta}</span>` : ''}
  <span class="spacer"></span>
  ${(o.navLinks || []).map((l) => `<a class="navx" href="${l.href}">${l.label}</a>`).join('\n  ')}
</header>
<aside class="as-left" id="leftpanel">${o.leftHtml || ''}</aside>
<aside class="as-panel" id="panel">${o.panelHtml || ''}</aside>
<footer class="as-dock" id="dock">${o.dockHtml || ''}</footer>
${cfg}
${(o.scripts || []).map((s) => `<script src="${s}"></script>`).join('\n')}
</body></html>`;
}

module.exports = { renderApp, appCss };
