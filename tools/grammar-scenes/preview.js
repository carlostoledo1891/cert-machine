#!/usr/bin/env node
/* preview.js — render one scene module as a standalone page, for looking at it (never served, never gated).
   usage: node tools/grammar-scenes/preview.js tools/grammar-scenes/<file>.js <out.html> */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const [file, out] = process.argv.slice(2);
if (!file || !out) { console.error('usage: preview.js <module> <out.html>'); process.exit(2); }
const guard = (plain, ok, msg) => { if (!ok) throw new Error('scene REFUSES: ' + (msg ? msg + ' — ' : '') + plain); };
const mod = require(path.resolve(file));
const blocks = mod.scenes.map((fn) => {
  const s = fn(guard);
  const art = s.usual ? '<div class="gx-pair"><div class="gx-pane">' + s.usual + '</div><div class="gx-pane">' + s.warrant + '</div></div>' : '<div class="gx-solo">' + s.warrant + '</div>';
  return '<div class="col"><div class="gx-k">' + C.esc(s.form || '') + ' · ' + C.esc(s.kind) + '</div><h3>' + C.esc(s.title) + '</h3><p>' + C.esc(s.hides) + '</p></div>'
    + C.figure({ svgRaw: art, record: s.kind === 'record' ? s.record : undefined, source: s.kind === 'illustration' ? 'illustration' : s.kind === 'built' ? s.source : undefined, stop: s.stop, captionRaw: s.caption });
});
const CSS = `.gx-pair{display:grid;gap:var(--s-5);grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.gx-pair{grid-template-columns:repeat(2,minmax(0,1fr))}}
.gx-pane{min-width:0}.gx-pane > svg,.gx-solo > svg{display:block;width:100%;height:auto}
.gx-solo{max-width:56rem;margin:0 auto}
.gx-k{font-family:var(--f-mono);font-size:var(--text-eyebrow);text-transform:uppercase;color:var(--ink-3);margin-top:var(--s-8)}
.gx-eb{font-family:var(--f-mono);font-size:var(--text-eyebrow);letter-spacing:var(--track-loose);text-transform:uppercase;fill:var(--ink-4)}
.gx-it{font-style:italic;fill:var(--ink-2);paint-order:stroke;stroke:var(--sunk);stroke-width:4;stroke-linejoin:round}`;
const html = TPL.render({ title: 'Scene preview · ' + mod.topic.title, bodyRaw: C.header({ title: mod.topic.title, deck: mod.topic.lead || '' }) + '\n' + W.legendHtml() + '\n' + blocks.join('\n'), footRaw: '<p>preview</p>', path: '/grammar/', cssRaw: CSS });
fs.writeFileSync(out, html);
console.log(out + ' written: ' + mod.scenes.length + ' scene(s)');
