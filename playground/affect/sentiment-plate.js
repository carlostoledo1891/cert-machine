/* sentiment-plate.js — the three marks the affect experiment needs.
 *
 *   circumplex()  the recovered affect plane, in the common oriented frame,
 *                 with the two axes drawn faintly behind it. The axes are drawn
 *                 because they were EARNED: their directions come from the
 *                 scalar answers, which the pairwise questions never saw.
 *
 *   tether()      the same twelve feelings placed twice — once by 132 pairwise
 *                 answers and once by 24 scalar ones — joined by a line. The
 *                 length of the line is the disagreement between two question
 *                 sets that share no words.
 *
 *   deformation() one mood's map against neutral, as arrows. Written now, drawn
 *                 when the treatment runs.
 */
'use strict';
const { align } = require('./plate.js');

function frameOf(pts, size, pad) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const k = (size - 2 * pad) / span;
  return { X: (p) => size / 2 + (p[0] - cx) * k, Y: (p) => size / 2 - (p[1] - cy) * k };
}

/* labels around a ring: each outside its own point, away from the middle, and
   clamped by where the TEXT ends rather than where its anchor sits — an
   end-anchored word runs leftward off the canvas while its x is still positive,
   which is how "miserable" became "iserable". 8.5px mono is ~5.1px per glyph. */
const W = (t) => String(t).length * 5.1;
function ring(X, Y, p, size, text, cls) {
  const a = Math.atan2(Y(p) - size / 2, X(p) - size / 2) || 0;
  const anchor = Math.cos(a) > 0.3 ? 'start' : Math.cos(a) < -0.3 ? 'end' : 'middle';
  const w = W(text), lo = anchor === 'start' ? 3 : anchor === 'end' ? w + 3 : w / 2 + 3;
  const hi = size - (anchor === 'start' ? w + 3 : anchor === 'end' ? 3 : w / 2 + 3);
  const x = Math.max(lo, Math.min(hi, X(p) + Math.cos(a) * 15));
  const y = Math.max(10, Math.min(size - 4, Y(p) + Math.sin(a) * 15 + 3.4));
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" text-anchor="${anchor}">${text}</text>`;
}

function circumplex(cell, items, { size = 340, pad = 76, axes = true } = {}) {
  const pts = cell.oriented, n = pts.length;
  const { X, Y } = frameOf(pts, size, pad);
  let dmax = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) dmax = Math.max(dmax, cell.D[i][j]);
  let out = ``;
  /* the axes sit behind the ring; their captions go in the corners, where no
     feeling ever lands */
  if (axes) out += `<g class="ax"><line x1="14" y1="${size / 2}" x2="${size - 14}" y2="${size / 2}"/>`
    + `<line x1="${size / 2}" y1="14" x2="${size / 2}" y2="${size - 14}"/>`
    + `<text x="${size - 8}" y="${size - 8}" text-anchor="end">pleasant →</text>`
    + `<text x="8" y="14">↑ activated</text></g>`;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const close = 1 - cell.D[i][j] / (dmax || 1);
    if (close <= 0.03) continue;
    out += `<line x1="${X(pts[i]).toFixed(1)}" y1="${Y(pts[i]).toFixed(1)}" x2="${X(pts[j]).toFixed(1)}" y2="${Y(pts[j]).toFixed(1)}" class="ch"`
      + ` stroke-opacity="${(0.03 + 0.6 * Math.pow(close, 2.4)).toFixed(3)}" stroke-width="${(0.5 + 2 * Math.pow(close, 3)).toFixed(2)}"/>`;
  }
  out += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ',' + Y(p).toFixed(1)).join('')}Z" class="ord"/>`;
  out += pts.map((p, i) => `<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="2.8" class="pt"/>`
    + ring(X, Y, p, size, items[i], 'lb')).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="pl">${out}</svg>`;
}

function tether(cv, items, { size = 380, pad = 76 } = {}) {
  const B = cv.base, A = cv.aligned, n = B.length;
  const { X, Y } = frameOf(B.concat(A), size, pad);
  let out = ``;
  for (let i = 0; i < n; i++) {
    out += `<line x1="${X(B[i]).toFixed(1)}" y1="${Y(B[i]).toFixed(1)}" x2="${X(A[i]).toFixed(1)}" y2="${Y(A[i]).toFixed(1)}" class="tie"/>`;
    out += `<circle cx="${X(B[i]).toFixed(1)}" cy="${Y(B[i]).toFixed(1)}" r="3.2" class="pt"/>`;
    out += `<circle cx="${X(A[i]).toFixed(1)}" cy="${Y(A[i]).toFixed(1)}" r="1.9" class="ptb"/>`;
    out += ring(X, Y, B[i], size, items[i], 'lb');
  }
  return `<svg viewBox="0 0 ${size} ${size}" class="pl">${out}</svg>`;
}

function deformation(from, to, items, { size = 300, pad = 52 } = {}) {
  const n = from.length;
  const { X, Y } = frameOf(from.concat(to), size, pad);
  let out = ``
    + `<defs><marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">`
    + `<path d="M0,0.6 L5,3 L0,5.4" fill="none" stroke="#f6f6f8" stroke-width="1"/></marker></defs>`;
  out += `<path d="${from.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ',' + Y(p).toFixed(1)).join('')}Z" class="ghost"/>`;
  for (let i = 0; i < n; i++) {
    out += `<line x1="${X(from[i]).toFixed(1)}" y1="${Y(from[i]).toFixed(1)}" x2="${X(to[i]).toFixed(1)}" y2="${Y(to[i]).toFixed(1)}" class="arr" marker-end="url(#ah)"/>`;
    out += `<circle cx="${X(from[i]).toFixed(1)}" cy="${Y(from[i]).toFixed(1)}" r="1.6" class="ptb"/>`;
  }
  return `<svg viewBox="0 0 ${size} ${size}" class="pl">${out}</svg>`;
}

module.exports = { circumplex, tether, deformation, align };
