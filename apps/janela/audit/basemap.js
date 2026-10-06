/* basemap.js — the land of the Brazilian margin for Janela's map, derived from the pinned source.
   apps/janela/audit · cert-machine

   land(box) -> a GeoJSON FeatureCollection of land polygons clipped to the box.

   Source: Natural Earth 1:10m land + minor islands (public domain), pinned by sha256 in
   corpus/basemap/PINS.json — a file that does not hash to its pin is REFUSED. Every ring is
   clipped to the box (Sutherland–Hodgman against the four edges; the box is convex, so the
   clip of a ring is a ring), coordinates rounded to 0.005° (~500 m, below what the map draws
   at basin zoom and close to Natural Earth's own 1:10m resolution), repeats dropped, rings of
   fewer than four points dropped. The map draws it; nothing is decided from it.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..', '..');
const DIR = path.join(ROOT, 'corpus', 'basemap');
const BOX = { w: -58, e: -25, s: -37, n: 8 };
const ROUND = 200;                                  /* 1/200 degree */

function read(name) {
  const pins = JSON.parse(fs.readFileSync(path.join(DIR, 'PINS.json'), 'utf8'));
  const buf = fs.readFileSync(path.join(DIR, name));
  const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (!pins.files[name] || pins.files[name].sha256 !== h) throw new Error('REFUSED: ' + name + ' does not hash to its pin');
  return JSON.parse(buf.toString('utf8'));
}

function clipEdge(pts, inside, cross) {
  const out = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[(k + 1) % pts.length];
    const ia = inside(a), ib = inside(b);
    if (ia && ib) out.push(b);
    else if (ia && !ib) out.push(cross(a, b));
    else if (!ia && ib) { out.push(cross(a, b)); out.push(b); }
  }
  return out;
}
const atX = (x) => (a, b) => [x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])];
const atY = (y) => (a, b) => [a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y];

function clipRing(ring, box) {
  let p = ring.slice(0, -1);                        /* GeoJSON rings repeat the first point */
  p = clipEdge(p, (q) => q[0] >= box.w, atX(box.w)); if (!p.length) return null;
  p = clipEdge(p, (q) => q[0] <= box.e, atX(box.e)); if (!p.length) return null;
  p = clipEdge(p, (q) => q[1] >= box.s, atY(box.s)); if (!p.length) return null;
  p = clipEdge(p, (q) => q[1] <= box.n, atY(box.n)); if (!p.length) return null;
  const r = [];
  for (const q of p) {
    const x = Math.round(q[0] * ROUND) / ROUND, y = Math.round(q[1] * ROUND) / ROUND;
    const l = r[r.length - 1];
    if (!l || l[0] !== x || l[1] !== y) r.push([x, y]);
  }
  if (r.length && (r[0][0] !== r[r.length - 1][0] || r[0][1] !== r[r.length - 1][1])) r.push(r[0]);
  return r.length >= 4 ? r : null;
}

function land(box = BOX) {
  const polys = [];
  for (const name of ['ne_10m_land.geojson', 'ne_10m_minor_islands.geojson']) {
    for (const f of read(name).features) {
      const g = f.geometry;
      const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const poly of list) {
        const outer = clipRing(poly[0], box);
        if (!outer) continue;
        const holes = poly.slice(1).map((h) => clipRing(h, box)).filter(Boolean);
        polys.push([outer, ...holes]);
      }
    }
  }
  return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { source: 'Natural Earth 1:10m land + minor islands (public domain), corpus/basemap', box },
    geometry: { type: 'MultiPolygon', coordinates: polys } }] };
}

module.exports = { land, BOX };
