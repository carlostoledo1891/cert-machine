/* app-shell.js — the SECOND page view of the design system: a full-viewport
   application surface (100% width x 100dvh) with a fixed top bar, a lateral
   panel, and a bottom dock. Same tokens, same type stack, same three-state
   theme rule as template.js; none of its prose column. Born for apps/
   (operator definition, 2026-08-27: "a real flight dashboard with lateral
   panels"). DESIGN.md carries the view's row.

   renderApp({ title, description, panelHtml, dockHtml, brand, homeHref,
               configJson, scripts, styles }) -> complete document.

   App verdict tokens (--v-cert / --v-refu / --v-refd) are defined HERE, in
   both palettes, following the same light-on-:root / dark-twice guard
   pattern as tokens.rootCss — no literal colour leaves this block.        */
'use strict';

const T = require('./tokens.js');

const APP_LIGHT = { '--v-cert': '#2C6142', '--v-refu': '#C64B42', '--v-refd': '#8F8798' };
const APP_DARK  = { '--v-cert': '#79C79B', '--v-refu': '#E06B62', '--v-refd': '#6E6678' };

function vars(o) { return Object.entries(o).map(([k, v]) => k + ':' + v).join(';'); }

function appCss() {
  return `
:root{${vars(APP_LIGHT)}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(APP_DARK)}}}
:root[data-theme="dark"]{${vars(APP_DARK)}}
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden;background:var(--paper);color:var(--ink)}
body{font-family:${T.TYPE.body};font-size:14px}
.as-map{position:fixed;inset:0}
.as-top{position:fixed;top:0;left:0;right:0;height:48px;z-index:30;display:flex;align-items:center;
  gap:18px;padding:0 16px;background:var(--paper);border-bottom:1px solid var(--rule)}
.as-top .brand{font-family:${T.TYPE.mono};font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink);text-decoration:none;white-space:nowrap}
.as-top .appname{font-family:${T.TYPE.mono};font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;
  color:var(--sig)}
.as-top .spacer{flex:1}
.as-top a{color:var(--ink-2);text-decoration:none;font-family:${T.TYPE.mono};font-size:11px;
  letter-spacing:.1em;text-transform:uppercase}
.as-top a:hover{color:var(--sig)}
.as-panel{position:fixed;top:58px;right:10px;bottom:86px;width:372px;z-index:20;overflow-y:auto;
  background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:14px 16px}
.as-panel.closed{display:none}
.as-dock{position:fixed;left:0;right:0;bottom:0;height:72px;z-index:30;display:flex;align-items:center;
  gap:14px;padding:0 16px;background:var(--paper);border-top:1px solid var(--rule)}
.as-dock .attr{margin-left:auto;font-size:10px;color:var(--ink-3);text-align:right;line-height:1.35}
.as-dock .attr a{color:var(--ink-3)}
.as-h{font-family:${T.TYPE.mono};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-3);margin:14px 0 6px}
.as-h:first-child{margin-top:0}
button.as-btn{font-family:${T.TYPE.mono};font-size:11px;letter-spacing:.08em;background:var(--sunk);
  color:var(--ink);border:1px solid var(--rule);border-radius:7px;padding:6px 10px;cursor:pointer}
button.as-btn:hover{border-color:var(--sig);color:var(--sig)}
button.as-btn[data-on="1"]{border-color:var(--sig);color:var(--sig);background:var(--sig-soft)}
.as-chip{display:inline-flex;align-items:center;gap:6px;font-family:${T.TYPE.mono};font-size:10.5px;
  border:1px solid var(--rule);border-radius:999px;padding:3px 9px;cursor:pointer;color:var(--ink-2)}
.as-chip[data-on="1"]{border-color:var(--sig);color:var(--sig);background:var(--sig-soft)}
.as-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
input[type=range].as-scrub{flex:1;accent-color:var(--sig);height:26px}
select.as-sel{font-family:${T.TYPE.mono};font-size:11px;background:var(--sunk);color:var(--ink);
  border:1px solid var(--rule);border-radius:7px;padding:5px 6px}
.as-clock{font-family:${T.TYPE.mono};font-size:13px;color:var(--ink);min-width:88px}
.as-kv{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:12.5px;color:var(--ink-2)}
.as-kv b{color:var(--ink);font-weight:600}
.as-note{font-size:11.5px;color:var(--ink-3);line-height:1.45}
.as-bar{position:relative;height:18px;background:var(--sunk);border:1px solid var(--rule-soft);
  border-radius:5px;overflow:hidden;margin:4px 0}
.as-bar .seg{position:absolute;top:0;bottom:0}
.maplibregl-ctrl-attrib{font-size:10px}
@media (max-width:720px){
  .as-panel{left:8px;right:8px;top:auto;bottom:86px;width:auto;max-height:42dvh}
  .as-top .navx{display:none}
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
${T.GOOGLE_FONTS}
${(o.styles || []).map((h) => `<link rel="stylesheet" href="${h}">`).join('\n')}
<style>${T.rootCss()}${appCss()}</style>
</head><body>
<div id="map" class="as-map" aria-label="${o.mapAria || 'interactive map'}"></div>
<header class="as-top">
  <a class="brand" href="${o.homeHref || '/'}">${o.brand || 'CERT-MACHINE'}</a>
  <span class="appname">${o.appName || ''}</span>
  <span class="spacer"></span>
  ${(o.navLinks || []).map((l) => `<a class="navx" href="${l.href}">${l.label}</a>`).join('\n  ')}
</header>
<aside class="as-panel" id="panel">${o.panelHtml || ''}</aside>
<footer class="as-dock" id="dock">${o.dockHtml || ''}</footer>
${cfg}
${(o.scripts || []).map((s) => `<script src="${s}"></script>`).join('\n')}
</body></html>`;
}

module.exports = { renderApp, appCss };
