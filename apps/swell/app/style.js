/* style.js — Swell's own rules, appended to the app shell's one <style> block (design/app-shell.js).
   apps/swell/app · cert-machine

   frontier's Swell layout (a rail on the right on a desk, a bottom sheet with three heights on a phone, three tabs),
   rewritten on the house tokens: no literal colour here — every value is a var(--…) of design/tokens.js or the app
   shell's verdict tokens. THE INK GRAMMAR (CLAUDE.md, the app doctrine): what is DECIDED is solid, upper-case mono and
   carries the verdict tokens (PERIGO, ATENÇÃO); what is FORECAST is sans, lower-case, grayscale, and a forecast
   warning is DASHED (dash = provenance: assumed, never decided). The two never share a colour or a typography.  MIT */
'use strict';

module.exports = function css() {
  return `
:root{--sw-rail:404px;--sw-peek:252px;--sw-top:56px;--sw-gap:14px;--sw-e:cubic-bezier(.2,.8,.2,1);--sw-e2:cubic-bezier(.16,1,.3,1);
  --sw-panel:color-mix(in srgb,var(--paper) 92%,transparent)}
@media (max-width:720px){:root{--sw-top:48px}}
button{font:inherit;color:inherit}
.sw-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:7px;font:500 12.5px/1 var(--f-sans);color:var(--ink-3);
  padding:8px 11px;border-radius:9px;white-space:nowrap;transition:background .18s var(--sw-e),color .18s var(--sw-e)}
.sw-btn:hover{color:var(--ink);background:var(--surface2)}
.sw-btn.on{color:var(--ink);background:var(--surface2);box-shadow:inset 0 0 0 1px var(--rule-strong)}
:focus-visible{outline:1.5px solid var(--ink-2);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}}

/* ---- the top bar (the shell's), Swell's controls in it ---- */
.sw-topctl{display:flex;align-items:center;gap:6px;margin-left:8px}
.sw-lang{display:flex;border-radius:9px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-lang button{all:unset;cursor:pointer;font:600 11px/1 var(--f-mono);padding:8px 9px;color:var(--ink-4)}
.sw-lang button.on{color:var(--paper);background:var(--ink)}
#sw-sos{color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule-strong)}
@media (max-width:899px){.sw-topctl .sw-btn span{display:none}.sw-topctl .sw-btn{padding:8px}}

/* ---- the intro, while the day arrives ---- */
#sw-intro{position:fixed;inset:0;z-index:40;background:var(--paper);display:grid;place-items:center;transition:opacity .7s var(--sw-e),visibility .7s}
#sw-intro.gone{opacity:0;visibility:hidden;pointer-events:none}
#sw-intro .mark{display:grid;justify-items:center;gap:18px;transform:translateY(-4vh)}
#sw-intro .word{font:600 clamp(28px,5vw,44px)/1 var(--f-sans);letter-spacing:.34em;margin-left:.34em;color:var(--ink)}
#sw-intro .line{width:min(60vw,420px);height:28px;overflow:hidden}
#sw-intro .line svg{width:100%;height:100%;display:block}
#sw-intro .line path{fill:none;stroke:var(--ink-3);stroke-width:1.2;animation:sw-crest 2.6s ease-in-out infinite}
@keyframes sw-crest{0%,100%{opacity:.25}50%{opacity:1}}
#sw-intro .sub{font:400 13px/1.5 var(--f-sans);color:var(--ink-4);text-align:center;max-width:38ch}

/* ---- the map and what is drawn over it ---- */
canvas#sw-windfx,canvas#sw-flowfx{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:1}
.maplibregl-ctrl-bottom-left{left:var(--sw-gap);bottom:10px}
.maplibregl-ctrl-attrib{background:color-mix(in srgb,var(--paper) 70%,transparent)!important;color:var(--ink-4);font:10px var(--f-sans);border-radius:6px}
.maplibregl-ctrl-attrib a{color:var(--ink-4)}
.maplibregl-marker{z-index:2}
.sw-bl{display:flex;align-items:center;gap:6px;cursor:pointer;font:600 11.5px/1 var(--f-sans);color:var(--ink);
  text-shadow:0 1px 3px var(--paper),0 0 10px var(--paper);white-space:nowrap;transition:opacity .2s}
.sw-bl i.dot{width:8px;height:8px;border-radius:50%;background:var(--ink-4);box-shadow:0 0 0 1.5px var(--paper);flex:none}
.sw-bl[data-v="good"] i.dot{background:var(--ink);box-shadow:0 0 0 1.5px var(--paper),0 0 0 4px color-mix(in srgb,var(--ink) 22%,transparent)}
.sw-bl[data-v="fair"] i.dot{background:transparent;box-shadow:inset 0 0 0 2px var(--ink),0 0 0 1.5px var(--paper)}
.sw-bl[data-d="V"] i.dot{width:0;height:0;border-radius:0;background:none;box-shadow:none;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid var(--v-refu)}
.sw-bl[data-d="I"] i.dot{background:transparent;box-shadow:inset 0 0 0 2px var(--v-refd),0 0 0 1.5px var(--paper)}
.sw-bl[data-r="1"] i.dot{background:transparent;box-shadow:inset 0 0 0 1px var(--ink-4)}
.sw-bl .ic{display:flex;gap:3px;margin-left:1px}
.sw-bl .ic b,.sw-mini b{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--paper) 88%,transparent);color:var(--ink-3);box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-bl .ic b.good,.sw-mini b.good{background:var(--ink);color:var(--paper);box-shadow:none}
.sw-bl .ic b.fair,.sw-mini b.fair{color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink-2)}
.sw-bl .ic b.V,.sw-mini b.V{color:var(--v-refu);box-shadow:inset 0 0 0 1.5px var(--v-refu);background:var(--v-refu-soft)}
.sw-bl .ic b.I,.sw-mini b.I{color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--v-refd)}
.sw-bl.off{opacity:.55}.sw-bl.off .nm{font-weight:500;color:var(--ink-2)}
.sw-bl.sel .nm{text-decoration:underline;text-underline-offset:3px}
.sw-bl.hidden{opacity:0;pointer-events:none}
body.z-far .sw-bl:not(.sel) .nm,body.z-far .sw-bl .ic b:not(:first-child){display:none}
body.z-far .sw-bl .ic b{width:16px;height:16px}
body:not(.z-near):not(.z-far) .sw-bl .ic b:nth-child(n+4){display:none}
.sw-poi{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:var(--surface);color:var(--ink-2);box-shadow:0 0 0 1px var(--rule-strong)}
.sw-poi-lifeguard{color:var(--ink);background:var(--surface2);box-shadow:0 0 0 1.5px var(--ink-3)}
body.z-far .sw-poi,body.pois-off .sw-poi,body:not(.z-near) .sw-poi-police,body:not(.z-near) .sw-poi-ramp,body:not(.z-near) .sw-poi-marina,body:not(.z-near) .sw-poi-health,body:not(.z-near) .sw-poi-fire{display:none}
.sw-pop .maplibregl-popup-content{background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:10px;padding:10px 28px 10px 12px;font:12.5px/1.45 var(--f-sans);display:grid;gap:2px}
.sw-pop .maplibregl-popup-content span{color:var(--ink-3)}
.sw-pop .maplibregl-popup-tip{border-top-color:var(--surface)!important;border-bottom-color:var(--surface)!important}

/* ---- the panel: a rail (desk), a sheet (phone) — overrides the shell's .as-panel ---- */
#panel.as-panel{position:fixed;z-index:25;background:var(--sw-panel);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);
  border:1px solid var(--rule);display:flex;flex-direction:column;box-shadow:var(--shadow);padding:0;gap:0;overflow:hidden;max-height:none}
.sw-grab{display:none}
.sw-phead{padding:18px 20px 6px;flex:none}
#sw-answer{font:500 17px/1.38 var(--f-sans);letter-spacing:-.012em;color:var(--ink-2);margin:0 0 14px;min-height:calc(1.38em * 2)}
#sw-answer b{color:var(--ink);font-weight:600}
#sw-answer .dec{font:600 11px/1 var(--f-mono);letter-spacing:.06em;color:var(--v-refu);white-space:nowrap}
#sw-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin:0 0 8px;height:44px}
#sw-days button{all:unset;cursor:pointer;text-align:center;padding:7px 2px 0;border-radius:9px;color:var(--ink-3);font:500 11.5px/1 var(--f-sans);white-space:nowrap;overflow:hidden}
#sw-days button:hover{color:var(--ink)}
#sw-days button i{display:block;height:3px;margin:8px auto 0;width:68%;border-radius:2px;background:var(--rule-strong)}
#sw-days button i b{display:block;height:100%;border-radius:2px;background:var(--ink-4)}
#sw-days button.on{color:var(--ink);background:var(--surface2)}
#sw-days button.on i b{background:var(--ink)}
.sw-hourrow{display:grid;grid-template-columns:1fr 52px auto;gap:10px;align-items:center;height:42px}
.sw-scrub{position:relative;height:36px}
#sw-daystrip{position:absolute;left:0;right:0;top:0;width:100%;height:20px}
#sw-hour{position:absolute;left:0;right:0;bottom:2px;width:100%;margin:0;-webkit-appearance:none;appearance:none;height:14px;background:transparent;cursor:ew-resize}
#sw-hour::-webkit-slider-runnable-track{height:2px;background:var(--rule-strong);border-radius:1px}
#sw-hour::-moz-range-track{height:2px;background:var(--rule-strong);border-radius:1px}
#sw-hour::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--ink);margin-top:-6px;box-shadow:0 0 0 3px var(--paper)}
#sw-hour::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;background:var(--ink);box-shadow:0 0 0 3px var(--paper)}
#sw-hour-v{font:600 12.5px var(--f-mono);text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
.sw-tabs{display:flex;gap:2px;padding:0 12px;border-bottom:1px solid var(--rule);flex:none;position:relative}
.sw-tab{all:unset;cursor:pointer;position:relative;padding:11px 10px 12px;font:500 12.5px/1 var(--f-sans);color:var(--ink-4);display:inline-flex;align-items:center;gap:7px}
.sw-tab:hover{color:var(--ink-2)}
.sw-tab.on{color:var(--ink)}
.sw-tab .ct{font:500 10px var(--f-mono);color:var(--ink-5);padding:2px 5px;border-radius:4px;box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-tab.on .ct{color:var(--ink-3)}
.sw-tabs .ul{position:absolute;bottom:-1px;height:2px;background:var(--ink);border-radius:1px;transition:left .3s var(--sw-e2),width .3s var(--sw-e2)}
.sw-scroll{overflow-y:auto;overscroll-behavior:contain;padding:4px 20px 20px;flex:1;scrollbar-width:thin;scrollbar-color:var(--rule-strong) transparent}
.sw-pane{display:none}
.sw-pane.on{display:block}
h2.sw-sec{font:600 10.5px/1 var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin:18px 0 10px;display:flex;align-items:center;gap:10px}
h2.sw-sec::after{content:'';flex:1;height:1px;background:var(--rule)}
.sw-filter{display:flex;gap:3px;padding:12px 0 4px;flex-wrap:wrap}
.sw-fl{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 9px;border-radius:9px;color:var(--ink-3);font:550 12px/1 var(--f-sans)}
.sw-fl:hover{color:var(--ink);background:var(--surface2)}
.sw-fl.on{color:var(--paper);background:var(--ink)}
.sw-fl span{display:none}.sw-fl.on span{display:inline}

/* the list */
#sw-rank ol{list-style:none;margin:0;padding:0}
#sw-rank li{display:grid;grid-template-columns:18px 1fr auto;gap:2px 10px;align-items:baseline;padding:11px 10px 10px;margin:0 -10px;border-radius:12px;cursor:pointer}
#sw-rank li:hover{background:var(--surface2)}
#sw-rank li .n{font:500 11px var(--f-mono);color:var(--ink-4)}
#sw-rank li .b{font:580 14.5px/1.25 var(--f-sans);letter-spacing:-.01em;color:var(--ink)}
#sw-rank li .b small{display:block;font:450 11px var(--f-sans);color:var(--ink-4);margin-top:2px}
#sw-rank li .h{font:600 15px var(--f-mono);text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
#sw-rank li .h small{display:block;font:500 10px var(--f-mono);color:var(--ink-4);margin-top:2px}
#sw-rank li .d{grid-column:2 / 4;font:12px/1.3 var(--f-sans);color:var(--ink-3);display:flex;gap:8px;align-items:center;margin-top:3px;flex-wrap:wrap}
#sw-rank li .d .sp{flex:1}
#sw-rank li.refused .h{color:var(--ink-4)}
.sw-mini{display:inline-flex;gap:3px}
.sw-mini b{width:18px;height:18px}
.sw-spark{display:block;width:100%;height:16px;margin-top:6px;grid-column:2 / 4;opacity:.9}

/* forecast words: sans, lower case, grayscale */
.sw-chip{font:550 11px/1 var(--f-sans);padding:4px 7px;border-radius:5px;white-space:nowrap}
.sw-chip.good{background:var(--ink);color:var(--paper)}
.sw-chip.fair{box-shadow:inset 0 0 0 1px var(--ink-3);color:var(--ink)}
.sw-chip.poor,.sw-chip.flat,.sw-chip.none{color:var(--ink-4);box-shadow:inset 0 0 0 1px var(--rule-strong)}
/* a forecast WARNING: dashed (assumed), never solid */
.sw-fw{font:550 11px/1 var(--f-sans);padding:3px 6px;border-radius:5px;white-space:nowrap;color:var(--ink-2);border:1px dashed var(--ink-3)}
/* DECIDED: solid, upper-case mono, the verdict tokens */
.sw-dec{font:650 10px/1 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;padding:4px 7px;border-radius:4px;white-space:nowrap}
.sw-dec.V{color:var(--v-refu);background:var(--v-refu-soft);box-shadow:inset 0 0 0 1.5px var(--v-refu)}
.sw-dec.V::before{content:'▲ ';font-size:8px}
.sw-dec.I{color:var(--ink);background:var(--v-refd-soft);box-shadow:inset 0 0 0 1.5px var(--v-refd)}
.sw-dec.L{color:var(--v-cert);box-shadow:inset 0 0 0 1px var(--v-cert);background:transparent}
.sw-dec.R,.sw-dec.S{color:var(--ink-3);box-shadow:inset 0 0 0 1px var(--rule-strong)}

/* your beaches */
.sw-fav{all:unset;cursor:pointer;display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;width:100%;box-sizing:border-box;padding:9px 10px;margin:0 -10px 2px;border-radius:10px}
.sw-fav:hover{background:var(--surface2)}
.sw-fav .b{font:560 13.5px var(--f-sans);color:var(--ink)}.sw-fav .w{grid-column:1;font:12px var(--f-sans);color:var(--ink-3)}

/* a beach */
#sw-card[hidden],#sw-rank[hidden],#sw-favs[hidden]{display:none}
.sw-back{margin:10px -11px 2px}
#sw-card .head{display:flex;align-items:center;gap:10px;margin:6px 0 2px;flex-wrap:wrap}
#sw-card h1{font:620 26px/1.08 var(--f-sans);letter-spacing:-.025em;margin:0;flex:1;color:var(--ink)}
#sw-card .where{font:12px var(--f-sans);color:var(--ink-4)}
#sw-card .acts-here{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 2px}
#sw-card .ah{all:unset;display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px 0 6px;border-radius:13px;font:550 11.5px/1 var(--f-sans);color:var(--ink-4);box-shadow:inset 0 0 0 1px var(--rule-strong);cursor:pointer}
#sw-card .ah.good{color:var(--paper);background:var(--ink);box-shadow:none}
#sw-card .ah.fair{color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink-2)}
#sw-card .ah.V{color:var(--v-refu);box-shadow:inset 0 0 0 1.5px var(--v-refu);background:var(--v-refu-soft)}
#sw-card .ah.sel{outline:1.5px solid var(--ink-2);outline-offset:2px}
#sw-card .big{display:flex;align-items:flex-end;gap:14px;margin:16px 0 4px}
#sw-card .big b{font:600 46px/0.9 var(--f-mono);letter-spacing:-.04em;font-variant-numeric:tabular-nums;color:var(--ink)}
#sw-card .big span{font:12.5px/1.45 var(--f-sans);color:var(--ink-3)}
#sw-card .band{font:12px/1.5 var(--f-sans);color:var(--ink-3);margin:2px 0 0}
#sw-card .band b{font:600 12px var(--f-mono);color:var(--ink)}
#sw-card .why{font:13.5px/1.55 var(--f-sans);color:var(--ink-2);margin:12px 0;padding:0 0 0 12px;border-left:2px solid var(--ink-4)}
.sw-decl{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:baseline;margin:10px 0;font:12.5px/1.5 var(--f-sans);color:var(--ink-2)}
.sw-warn{display:flex;gap:9px;align-items:flex-start;font:13px/1.5 var(--f-sans);color:var(--ink);border:1px dashed var(--ink-3);padding:10px 12px;border-radius:10px;margin:10px 0}
.sw-refused{font:13px/1.55 var(--f-sans);color:var(--ink-2);padding:10px 12px;border-radius:10px;box-shadow:inset 0 0 0 1px var(--rule-strong);margin:12px 0}
#sw-card dl{display:grid;grid-template-columns:112px 1fr;gap:10px 12px;margin:12px 0 6px;font-size:13px}
#sw-card dt{color:var(--ink-4);font:500 11.5px/1.5 var(--f-sans)}
#sw-card dd{margin:0;color:var(--ink-2);line-height:1.5}
#sw-card dd .fc{color:var(--ink-4);font-size:11px}
.sw-guard{display:flex;gap:9px;align-items:flex-start;font:13px/1.5 var(--f-sans);color:var(--ink-2);margin:0 0 8px}
.sw-guard svg{flex:none;margin-top:3px}
.sw-sosline{color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule-strong)}
#sw-card canvas.week{width:100%;height:104px;display:block;cursor:pointer}
#sw-card .actions{margin:14px 0 0;display:flex;gap:4px;flex-wrap:wrap}
.sw-cert{font:11.5px/1.55 var(--f-mono);color:var(--ink-3);background:var(--sunk);border:1px solid var(--rule);border-radius:10px;padding:10px 12px;margin:8px 0;overflow-wrap:anywhere}
.sw-cert b{color:var(--ink);font-weight:600}
.sw-cert .ok{color:var(--v-cert)}
.sw-cert .bad{color:var(--v-refu)}

/* the week tab */
#sw-tl-line{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;font:12.5px/1.35 var(--f-sans);color:var(--ink-3);min-height:18px;margin:14px 0 8px}
#sw-tl-line b{font:600 12.5px var(--f-mono);color:var(--ink)}
#sw-tl-chart{width:100%;height:168px;display:block;cursor:ew-resize;touch-action:none;border-radius:10px}
.sw-tlb{display:flex;gap:2px;margin:8px -6px 0;align-items:center}
.sw-tlb .sp{flex:1}
.sw-legend{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center;margin:14px 0 0;font:12px/1.4 var(--f-sans);color:var(--ink-3)}
.sw-legend i{display:block;width:22px;height:0;border-top:2px solid var(--ink)}
.sw-legend i.wv{border-top:6px solid color-mix(in srgb,var(--c-2) 35%,transparent)}
.sw-legend i.bd{border-top:6px solid var(--band-fill);box-shadow:inset 0 1px 0 var(--ink-3)}
.sw-legend i.td{border-top:1px solid var(--ink-4)}
.sw-legend i.q{height:6px;border:0;background:var(--ink);border-radius:1px}
.sw-legend i.q2{height:5px;width:21px;border:1px solid var(--ink-3);background:none;border-radius:1px}
.sw-legend i.dv{height:6px;border:0;background:var(--v-refu);border-radius:1px}

/* the map tab */
.sw-lay{display:grid;grid-template-columns:18px 1fr;gap:4px 10px;align-items:center;padding:10px 0;cursor:pointer;border-bottom:1px solid var(--rule)}
.sw-lay input{margin:0;accent-color:var(--ink-2);width:15px;height:15px}
.sw-lay .nm{font:550 13px var(--f-sans);color:var(--ink)}
.sw-lay .lg{grid-column:2;display:grid;gap:4px}
.sw-lay .lg svg{display:block;width:100%;height:22px}
.sw-lay .lg em{display:flex;justify-content:space-between;font:9.5px var(--f-mono);font-style:normal;color:var(--ink-4)}
.sw-lay .lg small{font:11px/1.4 var(--f-sans);color:var(--ink-4)}
.sw-lay .poi-row{display:flex;gap:4px}.sw-lay .poi-row .sw-poi{width:20px;height:20px;cursor:default}
.sw-note{color:var(--ink-4);font:12px/1.5 var(--f-sans)}
#sw-toast{position:fixed;z-index:45;left:50%;top:calc(var(--sw-top) + 8px);transform:translateX(-50%);padding:9px 13px;border-radius:9px;font:12.5px var(--f-sans);color:var(--ink-2);background:var(--sw-panel);border:1px solid var(--rule);display:none;max-width:min(92vw,520px);text-align:center}

/* the sheets: how we know, the scoreboard, emergency */
.sw-sheet{position:fixed;z-index:35;left:var(--sw-gap);top:calc(var(--sw-top) + 6px);width:min(500px,calc(100vw - 28px));max-height:calc(100vh - var(--sw-top) - 24px);overflow-y:auto;
  background:var(--sw-panel);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--rule-strong);border-radius:14px;padding:18px 20px;box-shadow:var(--shadow)}
.sw-sheet[hidden]{display:none}
.sw-sheet h2{font:620 17px/1.3 var(--f-sans);margin:0 0 8px;letter-spacing:-.01em;color:var(--ink)}
.sw-sheet p,.sw-sheet li{font:13px/1.6 var(--f-sans);color:var(--ink-2)}
.sw-sheet h3{font:600 10.5px/1 var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin:20px 0 6px}
.sw-sheet b{color:var(--ink);font-weight:600}
.sw-sheet .x{float:right;margin:-4px -8px 0 0}
.sw-sheet table{width:100%;border-collapse:collapse;font:12px/1.45 var(--f-sans);color:var(--ink-2);margin:6px 0}
.sw-sheet th{font:600 10px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-4);text-align:left;border-bottom:1px solid var(--rule);padding:4px 6px 4px 0}
.sw-sheet td{border-bottom:1px solid var(--rule-soft);padding:5px 6px 5px 0;vertical-align:top}
.sw-sheet td.n{font-family:var(--f-mono);text-align:right;white-space:nowrap}
.sw-tel{display:grid;grid-template-columns:64px 1fr;align-items:center;gap:12px;padding:12px 14px;margin:6px 0;border-radius:11px;text-decoration:none;color:var(--ink);background:var(--surface2);box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-tel b{font:650 22px var(--f-mono);letter-spacing:-.02em}.sw-tel span{font:13px var(--f-sans);color:var(--ink-2)}

@media (min-width:900px){
  #panel.as-panel{right:var(--sw-gap);top:calc(var(--sw-top) + 6px);bottom:var(--sw-gap);width:var(--sw-rail);border-radius:18px;left:auto}
  .sw-sheet{left:auto;right:calc(var(--sw-rail) + var(--sw-gap) * 2)}
}
@media (max-width:899px){
  #panel.as-panel{left:0;right:0;bottom:0;top:auto;width:auto;height:90vh;height:90dvh;border-radius:20px 20px 0 0;border-bottom:0;
    transform:translateY(calc(90dvh - var(--sw-peek)));transition:transform .32s var(--sw-e2);touch-action:none}
  #panel.as-panel.half{transform:translateY(40dvh)}#panel.as-panel.full{transform:translateY(0)}#panel.as-panel.dragging{transition:none}
  #panel .sw-scroll{touch-action:pan-y;padding-bottom:calc(24px + env(safe-area-inset-bottom))}
  #panel:not(.full):not(.half) .sw-scroll{overflow:hidden}
  .sw-grab{display:block;padding:10px 0 0;cursor:grab;flex:none}
  .sw-grab::before{content:'';display:block;width:40px;height:4px;border-radius:2px;background:var(--rule-strong);margin:0 auto}
  .sw-phead{padding:8px 16px 4px}
  #sw-answer{font-size:15.5px;margin-bottom:10px;min-height:0}
  .sw-scroll{padding:4px 16px 20px}
  .sw-tabs{padding:0 8px}
  .sw-sheet{left:8px;right:8px;width:auto;top:auto;bottom:8px;max-height:82dvh}
}`;
};
