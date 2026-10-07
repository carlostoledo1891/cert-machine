/* style.js — the Janela app's own rules, appended to the app shell's ONE
   <style> block (design/app-shell.js, cssRaw). Every size, step, weight and
   duration is a design token; the app's own dimensions (the bar, the rail, the
   sheet's heights) are named ONCE in :root below.

   INK (PRODUCT.md, binding): what is DECIDED — the verdict glyphs and the
   measured band — is solid; what is FORECAST — the deterministic line, the
   ensemble, the crests and streaks on the map — is dashed, hatched or italic.
   The verdict hues are the shell's annunciator set and never travel alone: every
   glyph has a shape (filled · crossed · hatched · dotted) and a word.
   apps/janela/app · cert-machine                                         MIT */
'use strict';

module.exports = () => `
/* ---- Janela (apps/janela/app/style.js) ---- */
:root{--jn-top:56px;--jn-rail:404px;--jn-edge:12px;--jn-peek:206px;--jn-half:58dvh;--jn-sheet:var(--jn-peek);--jn-glyph:12px;--jn-cell:11px;--jn-grip:44px;--n:1;--f:0;--i:0;--w:1}
body{font-size:var(--text-small)}
.as-map{background:var(--paper)}
.as-map .maplibregl-ctrl-bottom-right{right:calc(var(--jn-rail) + var(--jn-edge) * 2)}
.as-map .maplibregl-ctrl-attrib{background:var(--sunk);color:var(--ink-4)}
.as-map .maplibregl-ctrl-attrib a{color:var(--ink-3)}
.jn-layer{position:fixed;inset:0;pointer-events:none;z-index:5;width:100%;height:100%}
.jn-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ---- the top bar: the three modes, the run ---- */
.as-top .brand{flex:none}
.jn-modes{display:flex;gap:var(--s-1);background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-1);margin-left:var(--s-2)}
.jn-modes button{border:0;background:transparent;color:var(--ink-3);font-family:var(--f-mono);font-size:var(--text-eyebrow);font-weight:var(--weight-strong);
  letter-spacing:var(--track-loose);padding:var(--s-1) var(--s-3);border-radius:var(--radius-s);cursor:pointer;min-height:28px}
.jn-modes button:hover{color:var(--ink)}
.jn-modes button[aria-selected="true"]{background:var(--surface2);color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule-strong)}
.jn-modes button:focus-visible,.jn-chip-b:focus-visible,.jn-seg button:focus-visible,.jn-row:focus-visible,.jn-strip:focus-visible,.jn-btn:focus-visible,.jn-grip:focus-visible,.jn-x:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.as-top .meta b{color:var(--ink);font-weight:var(--weight-strong)}

/* ---- the panel: a right rail on a desk ---- */
.as-panel{top:calc(var(--jn-top) + var(--jn-edge));bottom:var(--jn-edge);right:var(--jn-edge);width:var(--jn-rail);gap:0;overflow:hidden;
  background:var(--paper);border:1px solid var(--rule);border-radius:var(--radius-l);box-shadow:var(--shadow)}
.jn-grip{display:none}
.jn-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;padding:var(--s-3);display:flex;flex-direction:column;gap:var(--s-3)}
.jn-pane{display:flex;flex-direction:column;gap:var(--s-3)}
.jn-pane[hidden],.jn-box[hidden]{display:none}
.jn-box{background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-3) var(--s-4)}
.jn-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-eyebrow);text-transform:uppercase;color:var(--ink-4);margin:0 0 var(--s-2)}
.jn-k b{color:var(--ink-3);font-weight:var(--weight-strong)}
.jn-p{margin:0;color:var(--ink-2);font-size:var(--text-small);line-height:var(--leading-body)}
.jn-p + .jn-p{margin-top:var(--s-2)}
.jn-fine{margin:var(--s-2) 0 0;color:var(--ink-4);font-size:var(--text-eyebrow);line-height:var(--leading-body)}
.jn-fine a,.jn-p a{color:var(--ink-3)}
.jn-mono{font-family:var(--f-mono)}
.jn-fc{font-style:italic;color:var(--ink-3)}

/* ---- the answer line: first, plain Portuguese ---- */
.jn-late{margin:0 0 var(--s-2);padding:var(--s-2) var(--s-3);border:1px dashed var(--v-refd);border-radius:var(--radius-s);background:var(--v-refd-soft);color:var(--ink);font-size:var(--text-small);line-height:var(--leading-body)}
.jn-late b{font-weight:var(--weight-strong)}
#jn-run.late{color:var(--v-refd)}
.jn-answer{padding:var(--s-3) var(--s-4) var(--s-3);background:var(--surface);border:1px solid var(--rule-strong);border-radius:var(--radius-m)}
.jn-ans{margin:0;font-size:var(--text-3);line-height:var(--leading-snug);font-weight:var(--weight-title);color:var(--ink);letter-spacing:var(--track-title)}
.jn-ans .jn-dim{color:var(--ink-3);font-weight:var(--weight-body)}
.jn-ans .jn-t{font-family:var(--f-mono);font-weight:var(--weight-strong);letter-spacing:0;white-space:nowrap}
.jn-sub{margin:var(--s-2) 0 0;display:flex;align-items:baseline;justify-content:space-between;gap:var(--s-1) var(--s-3);font-size:var(--text-eyebrow);color:var(--ink-3);font-family:var(--f-mono);letter-spacing:var(--track-slight);line-height:var(--leading-snug)}
.jn-sub a{color:var(--ink-2)}
.jn-notal{flex:none;white-space:nowrap}
.jn-crit{margin:var(--s-3) 0 0}
.jn-crit button small.v{display:flex;align-items:center;justify-content:center;gap:var(--s-1);font-weight:var(--weight-strong);letter-spacing:var(--track-slight);color:var(--ink-3)}
.jn-crit button small.v.L{color:var(--v-cert)}
.jn-crit button small.v.V{color:var(--v-refu)}
.jn-crit button small.v.I{color:var(--ink-2)}
.jn-crit button small.v.S,.jn-crit button small.v.R{color:var(--v-refd)}
.jn-crit button small .jn-g{--jn-glyph:9px}
#jn-critx{margin-top:var(--s-2)}
details.jn-src summary{cursor:pointer;list-style:none;color:var(--ink-3)}
details.jn-src summary::-webkit-details-marker{display:none}
details.jn-src summary:after{content:' +';color:var(--ink-4)}
details.jn-src[open] summary:after{content:' −'}
details.jn-src[open] summary{margin-bottom:var(--s-1)}

/* ---- verdict words and glyphs: SHAPE + word, the hue only beside them ---- */
.jn-w{display:inline-flex;align-items:center;gap:var(--s-1);font-family:var(--f-mono);font-size:0.86em;font-weight:var(--weight-strong);letter-spacing:var(--track-loose);
  padding:0 var(--s-2);border-radius:var(--radius-s);border:1px solid;white-space:nowrap;line-height:var(--leading-body);vertical-align:0.08em}
.jn-w.L{color:var(--v-cert);border-color:var(--v-cert);background:var(--v-cert-soft)}
.jn-w.V{color:var(--v-refu);border-color:var(--v-refu);background:var(--v-refu-soft)}
.jn-w.I{color:var(--ink-2);border-color:var(--ink-3);background:var(--surface2)}
.jn-w.S,.jn-w.R{color:var(--v-refd);border-color:var(--v-refd);background:var(--v-refd-soft)}
.jn-w.n,.jn-w.x{color:var(--ink-4);border-color:var(--rule-strong);background:transparent}
.jn-g{display:inline-block;width:var(--jn-glyph);height:var(--jn-glyph);border-radius:2px;flex:none;box-sizing:border-box}
.jn-g.L{background:var(--v-cert)}
.jn-g.V{border:1.5px solid var(--v-refu);background:linear-gradient(45deg,transparent 42%,var(--v-refu) 42% 58%,transparent 58%),linear-gradient(-45deg,transparent 42%,var(--v-refu) 42% 58%,transparent 58%)}
.jn-g.I{border:1px solid var(--ink-2);background:repeating-linear-gradient(135deg,var(--ink-2) 0 1px,transparent 1px 3px)}
.jn-g.S,.jn-g.R{border:0;background:radial-gradient(circle,var(--v-refd) 0.9px,transparent 1.1px) 0 0/3px 3px;box-shadow:inset 0 0 0 1px var(--v-refd-soft)}
.jn-g.n{border:1px solid var(--rule-strong);background:transparent;transform:scale(.55);border-radius:50%}
.jn-g.x{background:var(--rule);transform:scale(.3);border-radius:50%}

/* ---- the clock: a day strip that IS the scrubber ---- */
.jn-time{padding:var(--s-3) var(--s-4)}
.jn-timeh{display:flex;align-items:center;gap:var(--s-2);margin:0 0 var(--s-2);min-width:0}
.jn-timeh .jn-lead{overflow:hidden;text-overflow:ellipsis}
.jn-when{font-family:var(--f-mono);font-size:var(--text-body);font-weight:var(--weight-strong);color:var(--ink);white-space:nowrap}
.jn-lead{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);white-space:nowrap}
.jn-timeh .jn-grow{flex:1}
.jn-btn{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-2);background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-s);
  min-width:30px;min-height:30px;padding:0 var(--s-2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:var(--s-1)}
.jn-btn:hover{border-color:var(--rule-strong);color:var(--ink)}
.jn-btn[aria-pressed="true"]{color:var(--ink);border-color:var(--ink-3);background:var(--surface2)}
.jn-days{display:grid;grid-template-columns:repeat(29,minmax(0,1fr));font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);margin:0 0 var(--s-1)}
.jn-days span{grid-column:span var(--n);white-space:nowrap;overflow:hidden;border-left:1px solid var(--rule-strong);padding-left:var(--s-1);line-height:var(--leading-snug)}
.jn-days span.today{color:var(--ink-2)}
.jn-strip{position:relative;display:grid;grid-template-columns:repeat(29,minmax(0,1fr));gap:1px;height:28px;cursor:pointer;touch-action:none;border-radius:var(--radius-s);user-select:none}
.jn-strip > i{display:flex;align-items:center;justify-content:center;background:var(--sunk);min-width:0}
.jn-strip > i.d0{box-shadow:inset 1px 0 0 var(--rule-strong)}
.jn-strip > i.past{opacity:.45}
.jn-strip .jn-g{--jn-glyph:var(--jn-cell)}
.jn-strip > i b{display:block;width:70%;height:calc(var(--f) * 100%);background:var(--v-cert);align-self:flex-end}
.jn-cur{position:absolute;top:calc(var(--s-1) * -1);bottom:calc(var(--s-1) * -1);left:calc(var(--i) * 100% / 29 - 1px);width:calc(100% / 29 + 2px);border:1.5px solid var(--ink);border-radius:var(--radius-s);pointer-events:none;transition:left var(--dur-fast) var(--ease-out)}
.jn-span{position:absolute;bottom:calc(var(--s-2) * -1);height:2px;left:calc(var(--i) * 100% / 29);width:calc(var(--w) * 100% / 29);background:var(--ink-3);pointer-events:none;transition:left var(--dur-fast) var(--ease-out),width var(--dur-fast) var(--ease-out)}

/* ---- the operation and the criterion ---- */
.jn-chips{display:flex;flex-wrap:wrap;gap:var(--s-1)}
.jn-chip-b{font-family:var(--f-sans);font-size:var(--text-small);color:var(--ink-2);background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-pill);
  padding:var(--s-1) var(--s-3);cursor:pointer;min-height:32px;white-space:nowrap}
.jn-chip-b:hover{border-color:var(--rule-strong);color:var(--ink)}
.jn-chip-b[aria-checked="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink);font-weight:var(--weight-medium)}
.jn-edit{display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--s-2) var(--s-3);margin:var(--s-3) 0 0}
.jn-edit label{display:flex;flex-direction:column;gap:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}
.jn-in{font-family:var(--f-mono);font-size:var(--text-small);width:72px;background:var(--sunk);color:var(--ink);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:var(--s-1) var(--s-2);min-height:32px}
.jn-in.wide{width:120px}
.jn-in:focus{outline:2px solid var(--ink-3);outline-offset:0}
.jn-in[readonly]{color:var(--ink-3);border-style:dotted}
select.jn-in{width:100%}
.jn-src{margin:var(--s-3) 0 0;padding:var(--s-2) var(--s-3);border-left:2px solid var(--rule-strong);font-size:var(--text-eyebrow);color:var(--ink-3);line-height:var(--leading-body)}
.jn-src.cited{border-left-color:var(--ink-2)}
.jn-src b{color:var(--ink-2);font-weight:var(--weight-strong)}
.jn-src ul{margin:var(--s-1) 0 0;padding-left:var(--s-4)}
.jn-tag{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;color:var(--ink-3);border:1px solid var(--rule-strong);border-radius:var(--radius-s);padding:0 var(--s-1);margin-right:var(--s-1)}
.jn-seg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-1);background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-m);padding:var(--s-1)}
.jn-seg button{border:0;background:transparent;color:var(--ink-3);font-family:var(--f-sans);font-size:var(--text-small);padding:var(--s-2) var(--s-1);border-radius:var(--radius-s);cursor:pointer;line-height:var(--leading-snug);min-height:36px}
.jn-seg button small{display:block;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);margin-top:2px}
.jn-seg button:hover{color:var(--ink)}
.jn-seg button[aria-checked="true"]{background:var(--surface2);color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule-strong)}
.jn-seg button[aria-checked="true"] small{color:var(--ink-3)}
.jn-seg.four{grid-template-columns:repeat(4,minmax(0,1fr))}
.jn-seg.six{grid-template-columns:repeat(6,minmax(0,1fr))}
.jn-seg.three-l{grid-template-columns:repeat(3,minmax(0,1fr))}
.jn-seg.tight button{min-height:28px;padding:var(--s-1);font-size:var(--text-eyebrow)}
.jn-find + .jn-seg{margin-top:var(--s-2)}

/* ---- the list: every place, ranked by its next window ---- */
.jn-find{display:flex;gap:var(--s-2);align-items:center}
.jn-find .jn-in{flex:1;width:auto}
.jn-fleet{display:flex;flex-wrap:wrap;gap:var(--s-1) var(--s-3);margin:var(--s-2) 0 0;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3)}
.jn-fleet span{display:inline-flex;align-items:center;gap:var(--s-1)}
.jn-rows{display:flex;flex-direction:column;margin:var(--s-2) calc(var(--s-4) * -1) 0}
.jn-row{display:grid;grid-template-columns:var(--jn-glyph) minmax(0,1fr) auto;grid-template-rows:auto auto;gap:2px var(--s-2);align-items:center;text-align:left;
  background:transparent;border:0;border-top:1px solid var(--rule-soft);padding:var(--s-2) var(--s-4);cursor:pointer;color:inherit;font:inherit;width:100%}
.jn-row:hover{background:var(--surface2)}
.jn-row .nm{font-weight:var(--weight-medium);color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jn-row .nm small{font-weight:var(--weight-body);color:var(--ink-4);margin-left:var(--s-1)}
.jn-row .nx{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);text-align:right;white-space:nowrap}
.jn-row .nx b{color:var(--ink);font-weight:var(--weight-strong)}
.jn-row .nx small{display:block;color:var(--ink-4)}
.jn-row .ms{grid-column:2 / 4;display:grid;grid-template-columns:repeat(29,minmax(0,1fr));gap:1px;height:8px}
.jn-row .ms > i{background:var(--sunk)}
.jn-row .ms > i.L{background:var(--v-cert)}
.jn-row .ms > i.V{background:linear-gradient(var(--v-refu),var(--v-refu)) center/100% 2px no-repeat,var(--sunk)}
.jn-row .ms > i.I{background:repeating-linear-gradient(135deg,var(--ink-3) 0 1px,var(--sunk) 1px 3px)}
.jn-row .ms > i.S,.jn-row .ms > i.R{background:radial-gradient(circle,var(--v-refd) 0.8px,var(--sunk) 1px) 0 0/3px 3px}
.jn-row .ms > i.cur{box-shadow:0 0 0 1px var(--ink)}
.jn-more{margin:var(--s-2) 0 0;width:100%}

/* ---- the site card ---- */
.jn-card{display:flex;flex-direction:column;gap:var(--s-3)}
.jn-ch{display:flex;align-items:flex-start;gap:var(--s-3)}
.jn-ch h2{margin:0;font-size:var(--text-2);line-height:var(--leading-tight);font-weight:var(--weight-title);letter-spacing:var(--track-title);color:var(--ink)}
.jn-ch .jn-grow{flex:1;min-width:0}
.jn-x{flex:none;width:32px;height:32px;border-radius:var(--radius-s);border:1px solid var(--rule);background:var(--sunk);color:var(--ink-3);cursor:pointer;font-size:var(--text-body);line-height:1}
.jn-x:hover{color:var(--ink);border-color:var(--rule-strong)}
.jn-node{margin:var(--s-2) 0 0;color:var(--ink-3);font-size:var(--text-eyebrow);line-height:var(--leading-body)}
.jn-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-1)}
.jn-three > div{background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-s);padding:var(--s-2);display:flex;flex-direction:column;gap:var(--s-1);min-width:0}
.jn-three > div.on{border-color:var(--ink-3);background:var(--surface2)}
.jn-three > div.est{border-style:dotted}
.jn-three .h{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);letter-spacing:var(--track-slight)}
.jn-three .w{font-size:var(--text-eyebrow)}
.jn-three .jn-w{white-space:normal;line-height:var(--leading-snug)}
.jn-three .e{font-size:var(--text-eyebrow);color:var(--ink-3);line-height:var(--leading-snug);font-family:var(--f-mono)}
.jn-why{margin:0;color:var(--ink);font-size:var(--text-small);line-height:var(--leading-body)}
.jn-mx{display:grid;grid-template-columns:72px minmax(0,1fr);gap:var(--s-1) var(--s-2);align-items:center}
.jn-mx .l{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);white-space:nowrap}
.jn-mx .l.on{color:var(--ink)}
.jn-mx .ms{display:grid;grid-template-columns:repeat(29,minmax(0,1fr));gap:1px;height:12px;cursor:pointer}
.jn-mx .ms > i{display:flex;align-items:center;justify-content:center;background:var(--sunk);min-width:0}
.jn-mx .ms > i .jn-g{--jn-glyph:8px}
.jn-mx .ms > i.cur{box-shadow:0 0 0 1px var(--ink)}
.jn-fig{margin:0}
.jn-fig svg{display:block;width:100%;height:auto;overflow:visible}
.jn-fig figcaption{font-size:var(--text-eyebrow);color:var(--ink-4);margin-top:var(--s-1);line-height:var(--leading-body)}
.jn-key{display:flex;flex-wrap:wrap;gap:var(--s-1) var(--s-3);margin:var(--s-1) 0 0;padding:0;list-style:none;font-size:var(--text-eyebrow);color:var(--ink-3)}
.jn-key li{display:inline-flex;align-items:center;gap:var(--s-1)}
.jn-key li.fc{font-style:italic}
.jn-key svg{width:22px;height:10px;flex:none}
svg .ax{fill:var(--ink-4);font-family:var(--f-mono);font-size:var(--text-eyebrow)}
svg .gl{stroke:var(--rule);stroke-width:1}
svg .dl{stroke:var(--rule-strong);stroke-width:1}
svg .band{fill:var(--band-fill);stroke:var(--ink);stroke-width:1.5;stroke-linejoin:round}
svg .det{fill:none;stroke:var(--ink-3);stroke-width:1.5;stroke-dasharray:5 4}
svg .ens{stroke:none}
svg .hl{stroke:var(--ink-4);stroke-width:1}
svg .swr{fill:none;stroke:var(--ink-5);stroke-width:1}
svg .lim{stroke:var(--ink-2);stroke-width:1;stroke-dasharray:2 3}
svg .opwf{stroke:var(--ink-4);stroke-width:1;stroke-dasharray:2 3}
svg .limt{fill:var(--ink-2);font-family:var(--f-mono);font-size:var(--text-eyebrow);paint-order:stroke;stroke:var(--surface);stroke-width:3}
svg .opwft{fill:var(--ink-4);font-family:var(--f-mono);font-size:var(--text-eyebrow);paint-order:stroke;stroke:var(--surface);stroke-width:3}
svg .win{fill:var(--band-fill);stroke:var(--rule-strong);stroke-width:1}
svg .cur{stroke:var(--ink);stroke-width:1}
svg .arr{fill:none;stroke:var(--ink-3);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
svg .arrw{fill:none;stroke:var(--ink-4);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
svg .w1{fill:var(--c-1)}
svg .w2{fill:var(--c-3)}
svg .w3{fill:var(--c-2);stroke:var(--ink);stroke-width:1;stroke-dasharray:1.5 2}
svg .wv{fill:var(--ink-3);font-family:var(--f-mono);font-size:var(--text-eyebrow)}
.jn-dir{display:grid;grid-template-columns:44px minmax(0,1fr);gap:var(--s-1) var(--s-2);align-items:center}
.jn-dir .l{font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);font-style:italic}
.jn-note{border-left:2px solid var(--v-refd);padding:var(--s-1) var(--s-3);color:var(--ink-2);font-size:var(--text-eyebrow);line-height:var(--leading-body)}
.jn-note b{color:var(--ink)}

/* ---- ALÍVIO CRÍTICO: the user's tanks against the next window ---- */
.jn-tank{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-2)}
.jn-tank label{display:flex;flex-direction:column;gap:var(--s-1);font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4)}
.jn-tank .jn-in{width:100%}
.jn-crit-a{display:flex;align-items:center;gap:var(--s-3);margin:var(--s-3) 0 0;padding:var(--s-2) var(--s-3);border-radius:var(--radius-s);border:2px solid var(--v-refu);background:var(--v-refu-soft)}
.jn-crit-a .t{font-family:var(--f-mono);font-weight:var(--weight-strong);letter-spacing:var(--track-loose);color:var(--v-refu)}
.jn-crit-a .t:before{content:'';display:inline-block;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid var(--v-refu);margin-right:var(--s-2);vertical-align:-1px}
.jn-crit-a p{margin:0;color:var(--ink);font-size:var(--text-eyebrow);line-height:var(--leading-body)}
.jn-crit-ok{margin:var(--s-3) 0 0;color:var(--ink-2);font-size:var(--text-eyebrow);line-height:var(--leading-body)}

/* ---- the month ---- */
.jn-season{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-2)}
.jn-season > div{background:var(--sunk);border:1px solid var(--rule);border-radius:var(--radius-s);padding:var(--s-2) var(--s-3)}
.jn-season .big{font-family:var(--f-mono);font-size:var(--text-2);font-weight:var(--weight-strong);color:var(--ink);line-height:var(--leading-tight)}
.jn-season .s{font-size:var(--text-eyebrow);color:var(--ink-3);line-height:var(--leading-body);margin-top:var(--s-1)}
.jn-tbl{width:100%;border-collapse:collapse;font-family:var(--f-mono);font-size:var(--text-eyebrow)}
.jn-tbl th{font-weight:var(--weight-body);color:var(--ink-4);text-align:right;padding:var(--s-1);border-bottom:1px solid var(--rule)}
.jn-tbl th:first-child,.jn-tbl td:first-child{text-align:left}
.jn-tbl td{text-align:right;padding:var(--s-1);color:var(--ink-2);border-bottom:1px solid var(--rule-soft)}
.jn-tbl td.est{font-style:italic;color:var(--ink-3)}
.jn-tbl tr.y td{color:var(--ink);border-top:1px solid var(--rule-strong)}

/* ---- the scoreboard ---- */
.jn-prop .big{font-family:var(--f-mono);font-size:var(--text-2);font-weight:var(--weight-strong);color:var(--ink);line-height:var(--leading-tight)}
.jn-adm{display:inline-flex;align-items:center;gap:var(--s-2);margin-top:var(--s-2)}
.jn-w.jn-st{color:var(--ink-2);border-color:var(--rule-strong);background:transparent}
.jn-w.jn-st.pend{border-style:dashed;color:var(--ink-3)}
.jn-w.jn-st.cut{color:var(--ink);border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}

/* ---- the map's own furniture ---- */
.jn-clock{position:fixed;z-index:12;left:var(--jn-edge);top:calc(var(--jn-top) + var(--jn-edge));display:flex;align-items:center;gap:var(--s-2);
  background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-pill);padding:var(--s-1) var(--s-3);box-shadow:var(--shadow);font-family:var(--f-mono);font-size:var(--text-small);color:var(--ink)}
.jn-clock .jn-lead{color:var(--ink-4)}
.jn-legend{position:fixed;z-index:12;left:var(--jn-edge);bottom:var(--jn-edge);max-width:360px;background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius-m);
  padding:var(--s-2) var(--s-3);box-shadow:var(--shadow);font-size:var(--text-eyebrow);color:var(--ink-3)}
.jn-legend .row{display:flex;flex-wrap:wrap;gap:var(--s-1) var(--s-3);align-items:center}
.jn-legend .row + .row{margin-top:var(--s-2);padding-top:var(--s-2);border-top:1px solid var(--rule-soft)}
.jn-legend .row span{display:inline-flex;align-items:center;gap:var(--s-1)}
.jn-legend .fc{font-style:italic}
.jn-legend svg{width:22px;height:12px}
.jn-legend svg .cr{fill:none;stroke:var(--ink-2);stroke-width:1.4;stroke-linecap:round}
.jn-legend svg .st{fill:none;stroke:var(--ink-3);stroke-width:1;stroke-linecap:round}
.jn-tip{position:fixed;z-index:25;display:none;pointer-events:none;max-width:260px;background:var(--surface2);border:1px solid var(--rule-strong);border-radius:var(--radius-s);
  padding:var(--s-2) var(--s-3);box-shadow:var(--shadow);font-size:var(--text-eyebrow);color:var(--ink-2);line-height:var(--leading-body)}
.jn-tip b{color:var(--ink);font-size:var(--text-small);font-weight:var(--weight-medium)}
.jn-tip.on{display:block}
.jn-status{position:fixed;z-index:12;left:50%;top:calc(var(--jn-top) + var(--jn-edge));transform:translateX(-50%);display:none;background:var(--surface);border:1px solid var(--rule-strong);
  border-radius:var(--radius-pill);padding:var(--s-1) var(--s-3);font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-3);box-shadow:var(--shadow)}
.jn-status.on{display:block}
.jn-check{margin:0;font-family:var(--f-mono);font-size:var(--text-eyebrow);color:var(--ink-4);line-height:var(--leading-body)}
.jn-trust .jn-p{font-size:var(--text-eyebrow);color:var(--ink-3)}
.jn-nota{display:none}

/* ---- a phone: the map fills the window, the panel is a sheet in three heights ---- */
@media (max-width:720px){
  :root{--jn-top:48px;--jn-edge:8px;--jn-cell:9px}
  .as-top{gap:var(--s-2)}
  .as-top .brand,.as-top .sep{display:none}
  .jn-modes{margin-left:auto}
  .jn-modes button{padding:var(--s-1) var(--s-2)}
  .as-panel{left:0;right:0;top:auto;bottom:0;width:auto;max-height:none;height:var(--jn-sheet);border-radius:var(--radius-l) var(--radius-l) 0 0;border-bottom:0;
    transition:height var(--dur-med) var(--ease-out);z-index:22}
  .as-panel.drag{transition:none}
  #panel[data-sheet="half"]{--jn-sheet:var(--jn-half)}
  #panel[data-sheet="full"]{--jn-sheet:calc(100dvh - var(--jn-top) - var(--jn-edge))}
  .jn-grip{display:flex;justify-content:center;align-items:center;flex:none;width:100%;height:22px;background:none;border:0;padding:0;cursor:grab;touch-action:none}
  .jn-grip i{display:block;width:var(--jn-grip);height:4px;border-radius:var(--radius-pill);background:var(--rule-strong)}
  .jn-scroll{padding:0 var(--s-2) var(--s-6);gap:var(--s-2)}
  #panel[data-sheet="peek"] .jn-scroll{overflow:hidden}
  .jn-answer{padding:var(--s-2) var(--s-3)}
  .jn-ans{font-size:var(--text-body)}
  .jn-crit{margin-top:var(--s-2)}
  .jn-crit button{min-height:0;padding:var(--s-1)}
  #panel[data-sheet="peek"] #jn-critx,#panel[data-sheet="peek"] .jn-notal{display:none}
  #panel[data-sheet="peek"] .jn-sub > span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jn-timeh .jn-lead{display:none}
  .jn-box,.jn-time{padding:var(--s-2) var(--s-3)}
  .jn-rows{margin:var(--s-2) calc(var(--s-3) * -1) 0}
  .jn-row{padding:var(--s-2) var(--s-3)}
  .jn-legend{display:none}
  .jn-legend.open{display:block;left:var(--jn-edge);right:var(--jn-edge);bottom:calc(var(--jn-sheet) + var(--jn-edge));max-width:none}
  .jn-clock{font-size:var(--text-eyebrow)}
  .as-map .maplibregl-ctrl-bottom-right{display:none}
  .jn-seg button{font-size:var(--text-eyebrow)}
}
@media (min-width:721px){ .jn-keybtn{display:none} }
@media (prefers-reduced-motion:reduce){ .as-panel,.jn-cur,.jn-span{transition:none} }

/* ---- NOTA DE DECISÃO: the one page that prints ---- */
@media print{
  :root{color-scheme:light}
  html,body{height:auto;overflow:visible;background:Canvas;color:CanvasText}
  body > *:not(#jn-nota){display:none}
  #jn-nota{display:block;color:CanvasText;background:Canvas;font-family:var(--f-sans);font-size:var(--text-small);line-height:var(--leading-body)}
  #jn-nota h1{font-size:var(--text-3);margin:0 0 var(--s-2)}
  #jn-nota h2{font-size:var(--text-small);text-transform:uppercase;letter-spacing:var(--track-loose);margin:var(--s-4) 0 var(--s-1);border-bottom:1px solid CanvasText}
  #jn-nota p{margin:0 0 var(--s-1)}
  #jn-nota table{border-collapse:collapse;width:100%;font-family:var(--f-mono);font-size:var(--text-eyebrow)}
  #jn-nota th,#jn-nota td{border:1px solid CanvasText;padding:2px var(--s-1);text-align:left}
  #jn-nota .mono{font-family:var(--f-mono);font-size:var(--text-eyebrow);word-break:break-all}
  #jn-nota .v{font-family:var(--f-mono);font-weight:var(--weight-strong);border:1.5px solid CanvasText;padding:0 var(--s-1)}
}
`;
