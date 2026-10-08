/* style.js — Swell's own rules, appended to the app shell's one <style> block (design/app-shell.js).
   apps/swell/app · cert-machine

   frontier's Swell layout (a rail on the right on a desk, a bottom sheet with three heights on a phone, three tabs),
   rewritten on the house tokens: no literal colour here — every value is a var(--…) of design/tokens.js or the app
   shell's verdict tokens.

   THE ICON GRAMMAR (one per activity, everywhere: the list, the pins, the card, the week grid, the legend): filled =
   good, ringed = doable, dim = poor, red with a triangle = danger DECIDED over the measured band, a violet ring =
   caution (the band straddles a decided limit), a DASHED ring = a forecast warning (dash = assumed, never decided).
   Decided and forecast never share a colour or a stroke.                                                     MIT */
'use strict';

module.exports = function css() {
  return `
:root{--sw-rail:420px;--sw-peek:272px;--sw-top:56px;--sw-gap:14px;--sw-e:cubic-bezier(.2,.8,.2,1);--sw-e2:cubic-bezier(.16,1,.3,1);
  --sw-panel:color-mix(in srgb,var(--paper) 93%,transparent)}
@media (max-width:720px){:root{--sw-top:48px}}
button{font:inherit;color:inherit}
.sw-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:7px;font:500 12.5px/1 var(--f-sans);color:var(--ink-3);
  padding:var(--s-2) 11px;border-radius:9px;white-space:nowrap;transition:background var(--dur-fast) var(--sw-e),color var(--dur-fast) var(--sw-e)}
.sw-btn:hover{color:var(--ink);background:var(--surface2)}
.sw-btn.on{color:var(--ink);background:var(--surface2);box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-btn.ic{padding:var(--s-2)}
:focus-visible{outline:1.5px solid var(--ink-2);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important;animation-duration:.01ms!important}}
.sw-arr{--r:0deg;display:inline-flex;vertical-align:-2px;transform:rotate(var(--r));color:var(--ink-3)}

/* ---- the top bar (the shell's), Swell's controls in it ---- */
.sw-topctl{display:flex;align-items:center;gap:6px;margin-left:var(--s-2)}
.sw-lang{display:flex;border-radius:9px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-lang button{all:unset;cursor:pointer;font:600 11px/1 var(--f-mono);padding:var(--s-2) 9px;color:var(--ink-4)}
.sw-lang button.on{color:var(--paper);background:var(--ink)}
#sw-sos{color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule-strong)}
@media (max-width:1180px){.sw-topctl .sw-btn span{display:none}.sw-topctl .sw-btn{padding:var(--s-2)}}

/* ---- the intro, while the day arrives ---- */
#sw-intro{position:fixed;inset:0;z-index:40;background:var(--paper);display:grid;place-items:center;transition:opacity var(--dur-slow) var(--sw-e),visibility var(--dur-slow)}
#sw-intro.gone{opacity:0;visibility:hidden;pointer-events:none}
#sw-intro .mark{display:grid;justify-items:center;gap:18px;transform:translateY(-4vh)}
#sw-intro .word{font:600 clamp(28px,5vw,44px)/1 var(--f-sans);letter-spacing:.34em;margin-left:.34em;color:var(--ink)}
#sw-intro .line{width:min(60vw,420px);height:28px;overflow:hidden}
#sw-intro .line svg{width:100%;height:100%;display:block}
#sw-intro .line path{fill:none;stroke:var(--ink-3);stroke-width:1.2;animation:sw-crest 2.6s ease-in-out infinite}
@keyframes sw-crest{0%,100%{opacity:.25}50%{opacity:1}}
#sw-intro .sub{font:400 13px/1.5 var(--f-sans);color:var(--ink-4);text-align:center;max-width:38ch}

/* ---- THE ICON: one per activity, its shape the condition ---- */
.sw-ai{width:22px;height:22px;border-radius:50%;display:inline-grid;place-items:center;flex:none;position:relative;cursor:pointer;
  color:var(--ink-4);background:transparent;box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-ai.good{background:var(--ink);color:var(--paper);box-shadow:none}
.sw-ai.fair{color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink-2)}
.sw-ai.poor{color:var(--ink-5);box-shadow:inset 0 0 0 1px var(--rule)}
.sw-ai.V{color:var(--v-refu);background:var(--v-refu-soft);box-shadow:inset 0 0 0 1.5px var(--v-refu)}
.sw-ai.V::after{content:'';position:absolute;right:-3px;top:-3px;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:7px solid var(--v-refu)}
.sw-ai.I{color:var(--ink);background:var(--v-refd-soft);box-shadow:inset 0 0 0 1.5px var(--v-refd)}
.sw-ai.W{color:var(--ink-2);box-shadow:none;border:1.5px dashed var(--ink-3)}
.sw-ai.off{opacity:.35}
.sw-ai.foc{outline:1.5px solid var(--ink);outline-offset:2px}
.sw-legend2{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;font:11px/1.3 var(--f-sans);color:var(--ink-3);margin:10px 0 2px}
.sw-legend2 span{display:inline-flex;align-items:center;gap:5px}
.sw-legend2 .sw-ai{width:16px;height:16px;cursor:default}
.sw-legend2 .sw-ai svg{width:10px;height:10px}
.sw-legend2.wide{margin:0 0 6px}
.sw-legend2.wide h3{width:100%;margin:6px 0 2px}
#sw-tip{position:fixed;z-index:50;max-width:260px;padding:var(--s-2) 10px;border-radius:9px;background:var(--surface);border:1px solid var(--rule-strong);
  box-shadow:var(--shadow);font:12px/1.45 var(--f-sans);color:var(--ink-2);pointer-events:none}
#sw-tip b{color:var(--ink)}
#sw-tip .w{color:var(--ink-3)}
#sw-tip .d.V{color:var(--v-refu);font:600 11px var(--f-mono);text-transform:uppercase;letter-spacing:.05em}
#sw-tip .d.I{color:var(--ink);font:600 11px var(--f-mono)}

/* ---- the map and what is drawn over it ---- */
canvas#sw-windfx,canvas#sw-flowfx{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:1}
.maplibregl-ctrl-bottom-left{left:var(--sw-gap);bottom:10px}
.maplibregl-ctrl-attrib{background:color-mix(in srgb,var(--paper) 70%,transparent)!important;color:var(--ink-4);font:10px var(--f-sans);border-radius:6px}
.maplibregl-ctrl-attrib a{color:var(--ink-4)}
.maplibregl-marker{z-index:2}
.sw-bl{display:flex;align-items:center;gap:6px;cursor:pointer;font:600 11.5px/1 var(--f-sans);color:var(--ink);
  text-shadow:0 1px 3px var(--paper),0 0 10px var(--paper);white-space:nowrap;transition:opacity var(--dur-med)}
.sw-bl i.dot{width:7px;height:7px;border-radius:50%;background:var(--ink-2);box-shadow:0 0 0 1.5px var(--paper);flex:none}
.sw-bl[data-r="1"] i.dot{background:transparent;box-shadow:inset 0 0 0 1px var(--ink-4)}
.sw-bl .ic{display:flex;gap:3px;margin-left:1px}
.sw-bl .ic .sw-ai{width:19px;height:19px;text-shadow:none}
.sw-bl .ic .sw-ai:not(.good){background:color-mix(in srgb,var(--paper) 88%,transparent)}
.sw-bl .ic .sw-ai.V{background:var(--v-refu-soft)}
.sw-bl.off{opacity:.38}
.sw-bl.sel .nm{text-decoration:underline;text-underline-offset:3px}
.sw-bl.sel i.dot{transform:scale(1.4);background:var(--ink)}
.sw-bl.hidden{opacity:0;pointer-events:none}
body.z-far .sw-bl:not(.sel) .nm,body.z-far .sw-bl .ic .sw-ai:not(:first-child){display:none}
body.z-far .sw-bl .ic .sw-ai{width:16px;height:16px}
body:not(.z-near):not(.z-far) .sw-bl .ic .sw-ai:nth-child(n+3){display:none}
.sw-poi{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:var(--surface);color:var(--ink-2);box-shadow:0 0 0 1px var(--rule-strong)}
.sw-poi-lifeguard{color:var(--ink);background:var(--surface2);box-shadow:0 0 0 1.5px var(--ink-3)}
body.z-far .sw-poi,body.pois-off .sw-poi,body:not(.z-near) .sw-poi-police,body:not(.z-near) .sw-poi-ramp,body:not(.z-near) .sw-poi-marina,body:not(.z-near) .sw-poi-health,body:not(.z-near) .sw-poi-fire{display:none}
.sw-pop .maplibregl-popup-content{background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:10px;padding:10px 28px 10px var(--s-3);font:12.5px/1.45 var(--f-sans);display:grid;gap:2px}
.sw-pop .maplibregl-popup-content span{color:var(--ink-3)}
.sw-pop .maplibregl-popup-tip{border-top-color:var(--surface)!important;border-bottom-color:var(--surface)!important}

/* ---- the panel: a rail (desk), a sheet (phone) — overrides the shell's .as-panel ---- */
#panel.as-panel{position:fixed;z-index:25;background:var(--sw-panel);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);
  border:1px solid var(--rule);display:flex;flex-direction:column;box-shadow:var(--shadow);padding:0;gap:0;overflow:hidden;max-height:none}
.sw-grab{display:none}
.sw-phead{padding:var(--s-4) 18px 6px;flex:none}
#sw-when{font:600 10.5px/1 var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin:2px 0 var(--s-2)}
#sw-sea{font:500 15.5px/1.4 var(--f-sans);letter-spacing:-.01em;color:var(--ink-2);margin:0 0 var(--s-3)}
#sw-sea b{color:var(--ink);font-weight:620}
#sw-sea .sub{display:block;color:var(--ink-4);font:12px/1.4 var(--f-sans);margin-top:3px}
.sw-cap{font:600 9.5px/1 var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-4);margin:0 0 6px}
.sw-acts{display:grid;grid-template-columns:repeat(6,1fr);gap:var(--s-1);margin:0 0 6px}
.sw-act{all:unset;cursor:pointer;position:relative;display:grid;justify-items:center;gap:5px;padding:var(--s-2) 2px 7px;border-radius:10px;
  color:var(--ink-4);box-shadow:inset 0 0 0 1px var(--rule);transition:background var(--dur-fast),box-shadow var(--dur-fast)}
.sw-act:hover{background:var(--surface2)}
.sw-act .ic{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-act.good{color:var(--ink)}
.sw-act.good .ic{background:var(--ink);color:var(--paper);box-shadow:none}
.sw-act.fair{color:var(--ink-2)}
.sw-act.fair .ic{box-shadow:inset 0 0 0 1.5px var(--ink-2);color:var(--ink)}
.sw-act .nm{font:550 11px/1 var(--f-sans)}
.sw-act .ct{font:600 10.5px/1 var(--f-mono);color:var(--ink-3)}
.sw-act.good .ct{color:var(--ink)}
.sw-act .dg{position:absolute;top:4px;right:5px;font:700 9px/1 var(--f-mono);color:var(--v-refu)}
.sw-act.on{background:var(--surface2);box-shadow:inset 0 0 0 1.5px var(--ink)}
#sw-focus{font:13px/1.5 var(--f-sans);color:var(--ink-2);margin:var(--s-2) 0 var(--s-1);padding:9px 11px;border-radius:10px;background:var(--sunk);border:1px solid var(--rule)}
#sw-focus b{color:var(--ink);font-weight:600}
#sw-focus .dec{font:600 11px/1 var(--f-mono);color:var(--v-refu);white-space:nowrap}
#sw-focus[hidden]{display:none}
.sw-go{all:unset;cursor:pointer;font:600 11.5px/1 var(--f-sans);color:var(--ink);padding:var(--s-1) var(--s-2);border-radius:6px;box-shadow:inset 0 0 0 1px var(--ink-3);margin-left:2px;white-space:nowrap}
.sw-go:hover{background:var(--surface2)}
.sw-go.x{color:var(--ink-4);box-shadow:none;float:right}
#sw-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin:var(--s-2) 0 var(--s-1)}
#sw-days button{all:unset;cursor:pointer;text-align:center;padding:7px 2px 6px;border-radius:9px;color:var(--ink-3);font:500 11.5px/1 var(--f-sans);white-space:nowrap;overflow:hidden}
#sw-days button:hover{color:var(--ink)}
#sw-days button em{display:flex;justify-content:center;gap:2px;margin:7px auto 0}
#sw-days button em i{width:4px;height:4px;border-radius:1px;background:var(--rule-strong)}
#sw-days button em i.fair{background:var(--ink-4)}
#sw-days button em i.good{background:var(--ink-2)}
#sw-days button em i.foc{outline:1px solid var(--ink-3);outline-offset:1px}
#sw-days button.on{color:var(--ink);background:var(--surface2)}
#sw-days button.on em i.good{background:var(--ink)}
.sw-hourrow{display:grid;grid-template-columns:1fr 46px auto;gap:10px;align-items:center;height:42px}
.sw-scrub{position:relative;height:36px}
#sw-daystrip{position:absolute;left:0;right:0;top:0;width:100%;height:20px}
#sw-hour{position:absolute;left:0;right:0;bottom:2px;width:100%;margin:0;-webkit-appearance:none;appearance:none;height:14px;background:transparent;cursor:ew-resize}
#sw-hour::-webkit-slider-runnable-track{height:2px;background:var(--rule-strong);border-radius:1px}
#sw-hour::-moz-range-track{height:2px;background:var(--rule-strong);border-radius:1px}
#sw-hour::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--ink);margin-top:-6px;box-shadow:0 0 0 3px var(--paper)}
#sw-hour::-moz-range-thumb{width:14px;height:14px;border:0;border-radius:50%;background:var(--ink);box-shadow:0 0 0 3px var(--paper)}
#sw-hour-v{font:600 12.5px var(--f-mono);text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
.sw-tabs{display:flex;gap:2px;padding:0 10px;border-bottom:1px solid var(--rule);flex:none;position:relative}
.sw-tab{all:unset;cursor:pointer;position:relative;padding:11px 10px var(--s-3);font:500 12.5px/1 var(--f-sans);color:var(--ink-4);display:inline-flex;align-items:center;gap:7px}
.sw-tab:hover{color:var(--ink-2)}
.sw-tab.on{color:var(--ink)}
.sw-tabs .ul{position:absolute;bottom:-1px;height:2px;background:var(--ink);border-radius:1px;transition:left var(--dur-med) var(--sw-e2),width var(--dur-med) var(--sw-e2)}
.sw-scroll{overflow-y:auto;overscroll-behavior:contain;padding:2px 18px 20px;flex:1;scrollbar-width:thin;scrollbar-color:var(--rule-strong) transparent}
.sw-pane{display:none}
.sw-pane.on{display:block}
h2.sw-sec{font:600 10.5px/1 var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin:18px 0 var(--s-2);display:flex;align-items:center;gap:10px}
h2.sw-sec::after{content:'';flex:1;height:1px;background:var(--rule)}

/* the list: every beach, by region, the same sea */
#sw-rank ol{list-style:none;margin:0;padding:0}
#sw-rank li{display:grid;grid-template-columns:1fr auto;gap:3px 10px;align-items:baseline;padding:9px var(--s-2) var(--s-2);margin:0;border-radius:12px;cursor:pointer;transition:opacity var(--dur-med),background var(--dur-fast)}
#sw-rank li:hover{background:var(--surface2)}
#sw-rank li.dim{opacity:.38}
#sw-rank li.dim:hover{opacity:.8}
#sw-rank li .b{font:580 14px/1.25 var(--f-sans);letter-spacing:-.01em;color:var(--ink)}
#sw-rank li .b small{font:450 11px var(--f-sans);color:var(--ink-4);margin-left:6px}
#sw-rank li .b .star{font-style:normal;color:var(--ink-3);font-size:11px}
#sw-rank li .h{font:600 14.5px var(--f-mono);text-align:right;font-variant-numeric:tabular-nums;color:var(--ink);white-space:nowrap}
#sw-rank li .h small{font:500 10px var(--f-mono);color:var(--ink-4);margin-left:6px}
#sw-rank li .h.off{color:var(--ink-4)}
#sw-rank li .d{grid-column:1 / 3;display:flex;gap:var(--s-2);align-items:center}
#sw-rank li .d .w{font:12px/1.3 var(--f-sans);color:var(--ink-3)}
#sw-rank li .d .sp{flex:1}
.sw-icons{display:inline-flex;gap:var(--s-1)}
.sw-spark{display:block;width:100%;height:12px;margin-top:3px;grid-column:1 / 3;opacity:.75}
#sw-legend[hidden]{display:none}

/* DECIDED: solid, upper-case mono, the verdict tokens */
.sw-dec{font:650 10px/1 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;padding:var(--s-1) 7px;border-radius:4px;white-space:nowrap}
.sw-dec.V{color:var(--v-refu);background:var(--v-refu-soft);box-shadow:inset 0 0 0 1.5px var(--v-refu)}
.sw-dec.V::before{content:'▲ ';font-size:8px}
.sw-dec.I{color:var(--ink);background:var(--v-refd-soft);box-shadow:inset 0 0 0 1.5px var(--v-refd)}
.sw-dec.L{color:var(--v-cert);box-shadow:inset 0 0 0 1px var(--v-cert);background:transparent}
.sw-dec.R,.sw-dec.S{color:var(--ink-3);box-shadow:inset 0 0 0 1px var(--rule-strong)}

/* a beach */
#sw-card[hidden],#sw-rank[hidden]{display:none}
.sw-cbar{display:flex;align-items:center;gap:2px;margin:var(--s-2) 0 0}
.sw-cbar .sp{flex:1}
#sw-card h1{font:640 27px/1.08 var(--f-sans);letter-spacing:-.025em;margin:6px 0 var(--s-1);color:var(--ink)}
#sw-card .where{font:12px var(--f-sans);color:var(--ink-4)}
.sw-hero{display:grid;grid-template-columns:1.3fr 1fr;gap:10px;margin:14px 0 6px}
.sw-hero > div{display:grid;gap:5px;padding:var(--s-3) var(--s-3) 10px;border-radius:12px;background:var(--sunk);border:1px solid var(--rule)}
.sw-hero b{font:600 36px/1 var(--f-mono);letter-spacing:-.04em;font-variant-numeric:tabular-nums;color:var(--ink)}
.sw-hero b small{font:600 14px var(--f-mono);letter-spacing:0;color:var(--ink-3)}
.sw-hero span{font:12px/1.35 var(--f-sans);color:var(--ink-3)}
.sw-band{font:12px/1.5 var(--f-sans);color:var(--ink-3);margin:6px 0 0}
.sw-band b{font:600 12px var(--f-mono);color:var(--ink)}
#sw-card .why{font:13.5px/1.55 var(--f-sans);color:var(--ink-2);margin:var(--s-3) 0;padding:0 0 0 var(--s-3);border-left:2px solid var(--ink-4)}
.sw-acts-card{display:grid;gap:2px;margin:0}
.sw-arow{border-radius:10px}
.sw-arow.open,.sw-arow:hover{background:var(--surface2)}
.sw-arow.foc .an{text-decoration:underline;text-underline-offset:3px}
.sw-ahead{all:unset;cursor:pointer;display:grid;grid-template-columns:24px 52px auto 1fr 10px;gap:var(--s-2);align-items:center;width:100%;box-sizing:border-box;padding:7px var(--s-2)}
.sw-arow.na{display:grid;grid-template-columns:24px 52px 1fr;gap:var(--s-2);align-items:center;padding:7px var(--s-2);color:var(--ink-5);font:12px var(--f-sans)}
.sw-arow.na .ai{display:grid;place-items:center}
.sw-ahead .an{font:600 12.5px/1 var(--f-sans);color:var(--ink)}
.sw-ahead .aw{font:550 11.5px/1 var(--f-sans);color:var(--ink-3);white-space:nowrap}
.sw-ahead .aw.good{color:var(--ink)}
.sw-ahead .aw.V{color:var(--v-refu);font:650 10.5px/1 var(--f-mono);text-transform:uppercase;letter-spacing:.06em}
.sw-ahead .aw.I{color:var(--ink);font:600 11px/1 var(--f-mono)}
.sw-ahead .am{font:11.5px/1.35 var(--f-sans);color:var(--ink-4);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sw-ahead .chev{color:var(--ink-4);transition:transform var(--dur-fast)}
.sw-arow.open .chev{transform:rotate(90deg)}
.sw-adet{display:none;padding:0 10px 10px 40px}
.sw-arow.open .sw-adet{display:block}
.sw-rule{font:12px/1.5 var(--f-sans);color:var(--ink-4);margin:6px 0 0}
.sw-decl{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:baseline;margin:6px 0;font:12.5px/1.5 var(--f-sans);color:var(--ink-2)}
.sw-warn{display:flex;gap:9px;align-items:flex-start;font:13px/1.5 var(--f-sans);color:var(--ink);border:1px dashed var(--ink-3);padding:10px var(--s-3);border-radius:10px;margin:10px 0}
.sw-warn.sm{font-size:12px;padding:7px 9px;margin:6px 0}
.sw-refused{font:13px/1.55 var(--f-sans);color:var(--ink-2);padding:10px var(--s-3);border-radius:10px;box-shadow:inset 0 0 0 1px var(--rule-strong);margin:var(--s-3) 0}
#sw-card dl{display:grid;grid-template-columns:104px 1fr;gap:10px var(--s-3);margin:10px 0 6px;font-size:13px}
#sw-card dt{color:var(--ink-4);font:500 11.5px/1.5 var(--f-sans)}
#sw-card dd{margin:0;color:var(--ink-2);line-height:1.5}
#sw-card dd .fc{color:var(--ink-4);font-size:11px}
.sw-guard{display:flex;gap:9px;align-items:flex-start;font:13px/1.5 var(--f-sans);color:var(--ink-2);margin:0 0 var(--s-2)}
.sw-guard svg{flex:none;margin-top:3px}
.sw-sosline{color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule-strong)}
#sw-card canvas.week{width:100%;height:96px;display:block;cursor:pointer}
#sw-card canvas.grid{width:100%;display:block;cursor:pointer;margin-top:6px}
#sw-card .actions{margin:var(--s-3) 0 0;display:flex;gap:var(--s-1);flex-wrap:wrap}
.sw-cert{font:11.5px/1.55 var(--f-mono);color:var(--ink-3);background:var(--sunk);border:1px solid var(--rule);border-radius:10px;padding:10px var(--s-3);margin:var(--s-2) 0;overflow-wrap:anywhere}
.sw-cert b{color:var(--ink);font-weight:600}
.sw-cert .ok{color:var(--v-cert)}
.sw-cert .bad{color:var(--v-refu)}

/* the week tab */
#sw-tl-line{display:flex;flex-wrap:wrap;gap:var(--s-1) var(--s-3);align-items:baseline;font:12.5px/1.35 var(--f-sans);color:var(--ink-3);min-height:18px;margin:14px 0 var(--s-2)}
#sw-tl-line b{font:600 12.5px var(--f-sans);color:var(--ink)}
#sw-tl-chart{width:100%;height:160px;display:block;cursor:ew-resize;touch-action:none;border-radius:10px}
#sw-tl-grid{width:100%;display:block;cursor:pointer;margin:var(--s-1) 0 0}
.sw-tlb{display:flex;gap:2px;margin:var(--s-2) 0 0;align-items:center}
.sw-tlb .sp{flex:1}
.sw-legend{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:center;margin:14px 0 0;font:12px/1.4 var(--f-sans);color:var(--ink-3)}
.sw-legend i{display:block;width:22px;height:0;border-top:2px solid var(--ink)}
.sw-legend i.wv{border-top:6px solid color-mix(in srgb,var(--c-2) 35%,transparent)}
.sw-legend i.bd{border-top:6px solid var(--band-fill);box-shadow:inset 0 1px 0 var(--ink-3)}
.sw-legend i.td{border-top:1px solid var(--ink-4)}

/* the map tab */
.sw-lay{display:grid;grid-template-columns:18px 1fr;gap:var(--s-1) 10px;align-items:center;padding:10px 0;cursor:pointer;border-bottom:1px solid var(--rule)}
.sw-lay input{margin:0;accent-color:var(--ink-2);width:15px;height:15px}
.sw-lay .nm{font:550 13px var(--f-sans);color:var(--ink)}
.sw-lay .lg{grid-column:2;display:grid;gap:var(--s-1)}
.sw-lay .lg svg{display:block;width:100%;height:22px}
.sw-lay .lg em{display:flex;justify-content:space-between;font:9.5px var(--f-mono);font-style:normal;color:var(--ink-4)}
.sw-lay .lg small{font:11px/1.4 var(--f-sans);color:var(--ink-4)}
.sw-lay .poi-row{display:flex;gap:var(--s-1)}.sw-lay .poi-row .sw-poi{width:20px;height:20px;cursor:default}
.sw-note{color:var(--ink-4);font:12px/1.5 var(--f-sans)}
#sw-toast{position:fixed;z-index:45;left:50%;top:calc(var(--sw-top) + 8px);transform:translateX(-50%);padding:9px 13px;border-radius:9px;font:12.5px var(--f-sans);color:var(--ink-2);background:var(--sw-panel);border:1px solid var(--rule);display:none;max-width:min(92vw,520px);text-align:center}

/* the sheets: how we know, the scoreboard, emergency */
.sw-sheet{position:fixed;z-index:35;left:var(--sw-gap);top:calc(var(--sw-top) + 6px);width:min(520px,calc(100vw - 28px));max-height:calc(100vh - var(--sw-top) - 24px);overflow-y:auto;
  background:var(--sw-panel);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--rule-strong);border-radius:14px;padding:18px 20px;box-shadow:var(--shadow)}
.sw-sheet[hidden]{display:none}
.sw-sheet h2{font:620 17px/1.3 var(--f-sans);margin:0 0 var(--s-2);letter-spacing:-.01em;color:var(--ink)}
.sw-sheet p,.sw-sheet li{font:13px/1.6 var(--f-sans);color:var(--ink-2)}
.sw-sheet h3{font:600 10.5px/1 var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-4);margin:20px 0 6px}
.sw-sheet b{color:var(--ink);font-weight:600}
.sw-sheet .x{float:right;margin:-4px -8px 0 0}
.sw-sheet table{width:100%;border-collapse:collapse;font:12px/1.45 var(--f-sans);color:var(--ink-2);margin:6px 0}
.sw-sheet th{font:600 10px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-4);text-align:left;border-bottom:1px solid var(--rule);padding:var(--s-1) 6px var(--s-1) 0}
.sw-sheet td{border-bottom:1px solid var(--rule-soft);padding:5px 6px 5px 0;vertical-align:top}
.sw-sheet td.n{font-family:var(--f-mono);text-align:right;white-space:nowrap}
.sw-tel{display:grid;grid-template-columns:64px 1fr;align-items:center;gap:var(--s-3);padding:var(--s-3) 14px;margin:6px 0;border-radius:11px;text-decoration:none;color:var(--ink);background:var(--surface2);box-shadow:inset 0 0 0 1px var(--rule-strong)}
.sw-tel b{font:650 22px var(--f-mono);letter-spacing:-.02em}.sw-tel span{font:13px var(--f-sans);color:var(--ink-2)}

@media (min-width:900px){
  #panel.as-panel{right:var(--sw-gap);top:calc(var(--sw-top) + 6px);bottom:var(--sw-gap);width:var(--sw-rail);border-radius:18px;left:auto}
  .sw-sheet{left:auto;right:calc(var(--sw-rail) + var(--sw-gap) * 2)}
}
@media (max-width:899px){
  #panel.as-panel{left:0;right:0;bottom:0;top:auto;width:auto;height:90vh;height:90dvh;border-radius:20px 20px 0 0;border-bottom:0;
    transform:translateY(calc(90dvh - var(--sw-peek)));transition:transform var(--dur-med) var(--sw-e2);touch-action:none}
  #panel.as-panel.half{transform:translateY(40dvh)}#panel.as-panel.full{transform:translateY(0)}#panel.as-panel.dragging{transition:none}
  #panel .sw-scroll{touch-action:pan-y;padding-bottom:calc(24px + env(safe-area-inset-bottom))}
  #panel:not(.full):not(.half) .sw-scroll{overflow:hidden}
  .sw-grab{display:block;padding:9px 0 0;cursor:grab;flex:none}
  .sw-grab::before{content:'';display:block;width:40px;height:4px;border-radius:2px;background:var(--rule-strong);margin:0 auto}
  .sw-phead{padding:6px 14px 2px}
  #sw-when{margin:var(--s-1) 0 6px}
  #sw-sea{font-size:14.5px;margin-bottom:10px}
  .sw-act{padding:6px 1px}
  .sw-act .nm{display:none}
  .sw-scroll{padding:2px 14px 20px}
  .sw-tabs{padding:0 6px}
  .sw-sheet{left:8px;right:8px;width:auto;top:auto;bottom:8px;max-height:82dvh}
  .sw-hero b{font-size:30px}
}`;
};
