/* plate.js — one model's answers about one set, rendered.

   The mark is the whole matrix, not a summary of it. Every pair gets a chord
   whose weight is how SIMILAR the model called them, so the texture of the
   plate is the raw judgement — n(n−1)/2 of them — and the shape you see is the
   shape those judgements have, not a shape drawn over them.

   Two lines are drawn on top and they are the test. The ORDER PATH walks the
   items in their own order, Monday to Sunday, January to December, 0 to 9. The
   CLOSING EDGE goes from the last back to the first, and it is drawn apart
   because everything hangs on its length: on a circle it is one more step, on
   a line it is the entire journey home.
*/
'use strict';

function plate(m, items, { size = 560, pad = 66 } = {}) {
  const n = m.n;
  const xs = m.pts.map((p) => p[0]), ys = m.pts.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const k = (size - 2 * pad) / span;
  const X = (i) => size / 2 + (m.pts[i][0] - cx) * k;
  const Y = (i) => size / 2 - (m.pts[i][1] - cy) * k;

  let dmax = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) dmax = Math.max(dmax, m.D[i][j]);

  const chords = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const close = 1 - m.D[i][j] / (dmax || 1);          // 1 = the model called them the same
    if (close <= 0.02) continue;
    chords.push(`<line x1="${X(i).toFixed(1)}" y1="${Y(i).toFixed(1)}" x2="${X(j).toFixed(1)}" y2="${Y(j).toFixed(1)}"`
      + ` class="ch" stroke-opacity="${(0.05 + 0.80 * Math.pow(close, 2.2)).toFixed(3)}"`
      + ` stroke-width="${(0.7 + 3.0 * Math.pow(close, 3)).toFixed(2)}"/>`);
  }

  const order = Array.from({ length: n }, (_, i) => i);
  const pathD = order.map((i, t) => (t ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(i).toFixed(1)).join('');
  const closeD = `M${X(n - 1).toFixed(1)},${Y(n - 1).toFixed(1)}L${X(0).toFixed(1)},${Y(0).toFixed(1)}`;

  const dots = order.map((i) => {
    const a = Math.atan2(Y(i) - size / 2, X(i) - size / 2);
    const lx = X(i) + Math.cos(a) * 18, ly = Y(i) + Math.sin(a) * 18;
    const anchor = Math.cos(a) > 0.34 ? 'start' : Math.cos(a) < -0.34 ? 'end' : 'middle';
    const label = String(items[i]).length > 10 ? String(items[i]).slice(0, 9) + '·' : items[i];
    return `<circle cx="${X(i).toFixed(1)}" cy="${Y(i).toFixed(1)}" r="${i === 0 ? 5 : 3.4}" class="pt${i === 0 ? ' first' : ''}"/>`
      + `<text x="${lx.toFixed(1)}" y="${(ly + 4.6).toFixed(1)}" class="lb${i === 0 ? ' first' : ''}" text-anchor="${anchor}">${label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="plate" role="img" aria-label="${items.length} items placed by one model's own dissimilarity judgements; every pair drawn as a chord, the item order as a path, and the closing step drawn apart.">
<g class="chords">${chords.join('')}</g>
<path d="${pathD}" class="ord"/>
<path d="${closeD}" class="clo"/>
${dots}
</svg>`;
}

module.exports = { plate };
