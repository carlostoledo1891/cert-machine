/* geo.js — Brazil's real boundaries for the Eleições 2026 page, from the pinned IBGE meshes (corpus/eleicoes2026/geo,
   GEO-PINS.json): a plain equirectangular projection with longitude scaled by cos 15°S (Brazil spans the equator to 34°S,
   and nobody reads this map for areas), coordinates rounded to the half-pixel, consecutive repeats dropped.

     choropleth({ level, value, w, alt, legend })   one path per state (level 'uf') or municipality ('mun'), filled by
                                                    value(code) → { fill, label, detail } or null (drawn empty)
                                                                                                                      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require(path.join(__dirname, '..', '..', 'design', 'components.js'));
const GEO = path.join(__dirname, '..', '..', 'corpus', 'eleicoes2026', 'geo');
const K = Math.cos(15 * Math.PI / 180);
const BOX = { lon0: -74.2, lon1: -28.6, lat0: 5.4, lat1: -33.9 };     /* the mainland plus Fernando de Noronha */

const cache = {};
function load(level) {
  if (!cache[level]) cache[level] = JSON.parse(fs.readFileSync(path.join(GEO, level === 'uf' ? 'br-uf.json' : 'br-mun.json'), 'utf8'));
  return cache[level];
}

function projector(w) {
  const sx = w / ((BOX.lon1 - BOX.lon0) * K);
  const h = Math.ceil((BOX.lat0 - BOX.lat1) * sx);
  return { h, p: ([lon, lat]) => [((lon - BOX.lon0) * K * sx), ((BOX.lat0 - lat) * sx)] };
}

function ringPath(ring, P, q) {
  let d = '', last = '';
  for (const pt of ring) {
    const [x, y] = P.p(pt);
    const s = (Math.round(x / q) * q).toFixed(1).replace(/\.0$/, '') + ' ' + (Math.round(y / q) * q).toFixed(1).replace(/\.0$/, '');
    if (s === last) continue;
    d += (d ? 'L' : 'M') + s;
    last = s;
  }
  return d + 'Z';
}

function geomPath(g, P, q) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.map((poly) => poly.map((r) => ringPath(r, P, q)).join('')).join('');
}

function choropleth({ level, value, w, alt, legendRaw, stroke }) {
  const P = projector(w);
  const q = level === 'uf' ? 0.5 : 0.75;
  const out = ['  <svg viewBox="0 0 ' + w + ' ' + (P.h + (legendRaw ? 44 : 4)) + '" role="img" aria-label="' + C.escAttr(alt) + '">'];
  for (const f of load(level).features) {
    const code = String(f.properties.codarea);
    const v = value(code);
    const d = geomPath(f.geometry, P, q);
    out.push('    <path d="' + d + '" fill="' + (v ? v.fill : 'var(--sunk)') + '" stroke="' + (stroke || 'var(--paper)') + '" stroke-width="' + (level === 'uf' ? 1 : 0.25) + '"'
      + (v && v.label ? ' data-cm="' + C.escAttr(v.label) + '" data-cmv="' + C.escAttr(v.detail || '') + '" tabindex="0"' : '') + '/>');
  }
  if (legendRaw) out.push(legendRaw.replace(/\{Y\}/g, String(P.h + 6)));
  out.push('  </svg>');
  return out.join('\n');
}

/* the UF code (IBGE) → the two letters */
const UF_CODE = { 11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB',
  26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT',
  52: 'GO', 53: 'DF' };

module.exports = { choropleth, UF_CODE };
