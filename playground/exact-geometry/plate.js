/* plate.js — one object's distance table, drawn.
 *
 * The mark is the whole table, not a summary of it: every pair gets a chord
 * whose weight is how CLOSE the table called them, so what you see is the
 * n(n−1)/2 numbers themselves and not a shape drawn over them.
 *
 * Two lines go on top and they are the test. Where the items have a canonical
 * order the ORDER PATH walks it and the CLOSING EDGE returns from the last to
 * the first, drawn apart because everything hangs on its length: one more step
 * on a cycle, the whole journey home on a line. Where there is no order — an
 * array of dishes has no first station — the skeleton is the minimum spanning
 * tree, which is the cheapest tree the numbers themselves admit.
 *
 * The positions come from a float eigensolver and are a VIEW. Every verdict on
 * the page was decided before any of this was drawn.
 */
'use strict';

function plate(rec, { size = 520, pad = 62 } = {}) {
  const n = rec.n, items = rec.items;
  if (!rec.pts) {
    return `<svg viewBox="0 0 ${size} ${size}" class="plate"><rect width="${size}" height="${size}" fill="var(--bg-raised)"/>`
      + `<text x="${size / 2}" y="${size / 2 - 8}" text-anchor="middle" class="ref">REFUSED</text>`
      + `<text x="${size / 2}" y="${size / 2 + 14}" text-anchor="middle" class="refsub">this table is not a distance, so there is nothing to place</text></svg>`;
  }
  const xs = rec.pts.map(p => p[0]), ys = rec.pts.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const k = (size - 2 * pad) / span;
  const X = (i) => size / 2 + (rec.pts[i][0] - cx) * k;
  const Y = (i) => size / 2 - (rec.pts[i][1] - cy) * k;

  let dmax = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) dmax = Math.max(dmax, rec.D[i][j]);

  const chords = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const close = 1 - rec.D[i][j] / (dmax || 1);
    if (close <= 0.02) continue;
    chords.push(`<line x1="${X(i).toFixed(1)}" y1="${Y(i).toFixed(1)}" x2="${X(j).toFixed(1)}" y2="${Y(j).toFixed(1)}" class="ch"`
      + ` stroke-opacity="${(0.04 + 0.72 * Math.pow(close, 2.2)).toFixed(3)}"`
      + ` stroke-width="${(0.6 + 2.6 * Math.pow(close, 3)).toFixed(2)}"/>`);
  }

  let over = '';
  if (rec.order) {
    const d = Array.from({ length: n }, (_, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(i).toFixed(1)).join('');
    over += `<path d="${d}" class="ord"/>`;
    over += `<path d="M${X(n - 1).toFixed(1)},${Y(n - 1).toFixed(1)}L${X(0).toFixed(1)},${Y(0).toFixed(1)}" class="clo"/>`;
  } else if (rec.mst) {
    over += `<path d="${rec.mst.map(([i, j]) => `M${X(i).toFixed(1)},${Y(i).toFixed(1)}L${X(j).toFixed(1)},${Y(j).toFixed(1)}`).join('')}" class="mst"/>`;
  }

  const dots = Array.from({ length: n }, (_, i) => {
    const a = Math.atan2(Y(i) - size / 2, X(i) - size / 2);
    const lx = X(i) + Math.cos(a) * 17, ly = Y(i) + Math.sin(a) * 17;
    const anchor = Math.cos(a) > 0.34 ? 'start' : Math.cos(a) < -0.34 ? 'end' : 'middle';
    const label = String(items[i]).length > 11 ? String(items[i]).slice(0, 10) + '·' : items[i];
    const first = rec.order && i === 0;
    return `<circle cx="${X(i).toFixed(1)}" cy="${Y(i).toFixed(1)}" r="${first ? 4.6 : 3.2}" class="pt${first ? ' first' : ''}"/>`
      + `<text x="${lx.toFixed(1)}" y="${(ly + 4.2).toFixed(1)}" class="lb${first ? ' first' : ''}" text-anchor="${anchor}">${label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="plate" role="img" aria-label="${n} items placed by their own distance table; every pair drawn as a chord.">`
    + `<rect width="${size}" height="${size}" fill="var(--bg-raised)"/><g class="chords">${chords}</g>${over}${dots}</svg>`;
}

module.exports = { plate };
