/* basemap-style.js — the LIGHT twin of the pinned Protomaps basemap style, once, for every map app.
   design/ · cert-machine

   Moved here from apps/skyaudit/build.js on 2026-11-16, when a second app (apps/atalaia, Mission Control) needed the
   same light basemap: a rule written twice diverges, so the table and the function live in one file and both builds
   require it. SkyAudit's output is byte-identical to before (checked at the move).

   THE LIGHT BASEMAP (2026-10-30 late, the operator: "the apps take the light theme too — light basemaps").
   The same pinned tiles, the same style, every grey re-pointed by its role at a print-register value
   (design/print/tokens.js): on paper the land is the page, the water a step down, the roads and the parks a step or two
   down from the land, the labels in the guide and ink-3 grades. No tile is fetched and no new colour is made; a grey this
   table does not name refuses the build, so a re-vendored style cannot slip a dark value onto the light map. The sprite
   (shields, arrows, town dots) stays the dark flavour's: a light sprite would be a new unpinned asset.            MIT */
'use strict';
const path = require('path');

const LIGHT_GREY = {
  '#141414': '--paper', '#101010': '--paper', '#111111': '--paper',                   /* the land, its halos and casings */
  '#0a0a0a': '--o-1', '#161616': '--o-1', '#181818': '--o-1', '#191919': '--o-1',      /* buildings, parks, sand, zoo, aerodrome */
  '#1a1a1a': '--o-1', '#1c1c1c': '--o-1', '#1d1d1d': '--o-1',                          /* wood, grass, hospital */
  '#1f1f1f': '--grid', '#2b2b2b': '--grid', '#333333': '--grid',                       /* minor roads; the sea and the water */
  '#292929': '--o-3', '#323232': '--o-3',                                              /* major roads, rail, runways */
  '#3d3d3d': '--guide', '#525252': '--guide', '#5c5c5c': '--guide', '#707070': '--guide', /* labels, boundaries */
  '#999999': '--ink-3',                                                                /* the places' names */
};
function lightStyle(style) {
  const PR = require(path.join(__dirname, 'print', 'tokens.js'));
  const out = JSON.parse(JSON.stringify(style)), bad = new Set();
  const walk = (v) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v)
    ? (LIGHT_GREY[v.toLowerCase()] ? PR.hex(LIGHT_GREY[v.toLowerCase()]) : (bad.add(v), v))
    : Array.isArray(v) ? v.map(walk) : v);
  for (const l of out.layers) for (const k of Object.keys(l.paint || {})) if (/color/.test(k)) l.paint[k] = walk(l.paint[k]);
  if (bad.size) throw new Error('REFUSED: the light basemap has no print-register value for ' + [...bad].join(' ') + ' (apps/skyaudit/build.js LIGHT_GREY)');
  out.name = (out.name || 'basemap') + ' (light: print register)';
  return out;
}

module.exports = { LIGHT_GREY, lightStyle };
