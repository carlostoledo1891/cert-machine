/* plate.js — a constellation with the shape the hunt found drawn on top.

   The points are faint and the FINDING is bright, because the argument of this
   page is about what you notice: a pentagon picked out of five hundred subsets
   looks like a pentagon whether or not there is one.
*/
'use strict';

function shapePlate(pts, items, sub, { size = 460, pad = 58, closed = true, label = '' } = {}) {
  const n = pts.length;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const k = (size - 2 * pad) / span;
  const X = (i) => size / 2 + (pts[i][0] - cx) * k;
  const Y = (i) => size / 2 - (pts[i][1] - cy) * k;

  const inSub = new Set(sub || []);
  const faint = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    faint.push(`<line x1="${X(i).toFixed(1)}" y1="${Y(i).toFixed(1)}" x2="${X(j).toFixed(1)}" y2="${Y(j).toFixed(1)}" class="shf"/>`);

  const poly = (sub && sub.length)
    ? `<path d="${sub.map((i, t) => (t ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(i).toFixed(1)).join('') + (closed ? 'Z' : '')}" class="shp"/>`
    : '';

  const dots = Array.from({ length: n }, (_, i) =>
    `<circle cx="${X(i).toFixed(1)}" cy="${Y(i).toFixed(1)}" r="${inSub.has(i) ? 5 : 2.6}" class="shd${inSub.has(i) ? ' on' : ''}"/>`
    + (inSub.has(i) ? `<text x="${(X(i) + 9).toFixed(1)}" y="${(Y(i) + 4).toFixed(1)}" class="shl">${String(items[i]).slice(0, 12)}</text>` : '')).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="shape" role="img" aria-label="${label}">
<g class="shfaint">${faint.join('')}</g>${poly}${dots}</svg>`;
}

module.exports = { shapePlate };

/* symPlate — a permutation drawn on the configuration it nearly preserves.
   Each point is joined to where the permutation sends it, so a rotation reads
   as a fan of parallel chords and a reflection as a set of rungs across an
   axis. The shape of the bundle IS the group element. */
function symPlate(pts, items, perm, { size = 460, pad = 58, label = '' } = {}) {
  const n = pts.length;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const k = (size - 2 * pad) / span;
  const X = (i) => size / 2 + (pts[i][0] - cx) * k;
  const Y = (i) => size / 2 - (pts[i][1] - cy) * k;

  const arcs = [];
  for (let i = 0; i < n; i++) {
    const j = perm[i];
    if (i === j) continue;
    const x1 = X(i), y1 = Y(i), x2 = X(j), y2 = Y(j);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const bx = mx - (dy / L) * L * 0.16, by = my + (dx / L) * L * 0.16;
    arcs.push(`<path d="M${x1.toFixed(1)},${y1.toFixed(1)}Q${bx.toFixed(1)},${by.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}" class="sya"/>`);
  }
  const dots = Array.from({ length: n }, (_, i) =>
    `<circle cx="${X(i).toFixed(1)}" cy="${Y(i).toFixed(1)}" r="3.6" class="shd on"/>`
    + `<text x="${(X(i) + 8).toFixed(1)}" y="${(Y(i) + 4).toFixed(1)}" class="shl">${String(items[i]).slice(0, 11)}</text>`).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="shape" role="img" aria-label="${label}">${arcs.join('')}${dots}</svg>`;
}
module.exports.symPlate = symPlate;
