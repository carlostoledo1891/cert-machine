/* plate.js — three models' answers about one structure, drawn so they can be
 * compared rather than admired one at a time.
 *
 * FOUR MARKS, and each answers a different question.
 *
 *   plate()      one model. Every pair is a chord weighted by how CLOSE that
 *                model called them, so the texture is the raw judgement —
 *                n(n−1)/2 of them — and the shape is the shape those numbers
 *                have. The order path walks the items; the closing edge returns
 *                from the last to the first and is drawn apart, because
 *                everything hangs on its length. Where there is no canonical
 *                order the skeleton is the minimum spanning tree instead.
 *
 *   overlay()    all three models in one frame. Each embedding is its own; to
 *                put them on one picture they are aligned to their consensus by
 *                Procrustes — rotation, reflection and scale, which are exactly
 *                the freedoms a distance matrix does not fix. What is left after
 *                that is disagreement about SHAPE, which is the only kind worth
 *                drawing.
 *
 *   fieldPNG()   a matrix as a raster. Used twice: for each model's asymmetry
 *                |D[i][j] − D[j][i]|, which is the consistency test nobody asked
 *                it to pass, and for the spread across the three models, which
 *                is where they disagree about the world.
 */
'use strict';

/* ---- Procrustes: the freedoms a distance matrix leaves undetermined --------
   Move P onto Q using only rotation, reflection and uniform scale, which are
   exactly the transformations a table of distances does not determine. What is
   left over is real disagreement about shape.

   In two dimensions this needs no SVD. For a fixed reflection the optimal angle
   is atan2(Σ a×b, Σ a·b) in closed form, and the optimal scale is then the
   projection of the rotated points onto the target over their own norm; both
   reflections are tried and the better kept. Because scale is optimal, k = 0 is
   always available, so the residual can never exceed the target's own norm —
   the gap is bounded by 1 and reads as the fraction of shape unexplained.

   (An earlier version of this used a closed-form 2×2 SVD written from memory.
   It was wrong, and wrong in the worst way: it returned plausible-looking
   numbers, failing the identity case by 76%. Hence procrustes.test.js.) */
function align(P, Q) {
  const n = P.length;
  const cen = (X) => {
    const cx = X.reduce((s, p) => s + p[0], 0) / n, cy = X.reduce((s, p) => s + p[1], 0) / n;
    return X.map(p => [p[0] - cx, p[1] - cy]);
  };
  const A = cen(P), B = cen(Q);
  let best = null;
  for (const flip of [false, true]) {
    const F = flip ? A.map(p => [p[0], -p[1]]) : A;
    let cross = 0, dot0 = 0;
    for (let i = 0; i < n; i++) {
      cross += F[i][0] * B[i][1] - F[i][1] * B[i][0];
      dot0 += F[i][0] * B[i][0] + F[i][1] * B[i][1];
    }
    const th = Math.atan2(cross, dot0), c = Math.cos(th), s = Math.sin(th);
    const R = F.map(p => [c * p[0] - s * p[1], s * p[0] + c * p[1]]);
    let dot = 0, na = 0;
    for (let i = 0; i < n; i++) { dot += R[i][0] * B[i][0] + R[i][1] * B[i][1]; na += R[i][0] ** 2 + R[i][1] ** 2; }
    const k = na > 0 ? Math.max(0, dot / na) : 1;
    const S = R.map(p => [k * p[0], k * p[1]]);
    let resid = 0;
    for (let i = 0; i < n; i++) resid += (S[i][0] - B[i][0]) ** 2 + (S[i][1] - B[i][1]) ** 2;
    if (!best || resid < best.resid) best = { resid, S };
  }
  return best.S;
}

function frame(pts, size, pad) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const k = (size - 2 * pad) / span;
  return { X: (p) => size / 2 + (p[0] - cx) * k, Y: (p) => size / 2 - (p[1] - cy) * k };
}

/* labels are the part that breaks. Points crowd, names are long, and a rank-1
   layout puts every label on one horizontal line where they overlap outright.
   So: names are shortened by the caller, the offset alternates by index to
   split neighbours apart, and the text is clamped inside the frame. */
function label(X, Y, p, size, i, text, cls, base) {
  const a = Math.atan2(Y(p) - size / 2, X(p) - size / 2);
  const anchor = Math.cos(a) > 0.34 ? 'start' : Math.cos(a) < -0.34 ? 'end' : 'middle';
  const rad = (base || 13) + (i % 2) * 9;
  let x = X(p) + Math.cos(a) * rad, y = Y(p) + Math.sin(a) * rad + 3.6;
  if (Math.abs(Math.sin(a)) < 0.34) y += (i % 2 ? 9 : -6);          // split a flat run
  x = Math.max(5, Math.min(size - 5, x));
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" text-anchor="${anchor}">${text}</text>`;
}

function plate(rec, { size = 360, pad = 62, labels = true, short = null } = {}) {
  const n = rec.n, items = (short || rec.items);
  if (!rec.pts) return `<svg viewBox="0 0 ${size} ${size}" class="pl"><rect width="${size}" height="${size}" fill="#0a0a0c"/>`
    + `<text x="${size / 2}" y="${size / 2}" text-anchor="middle" class="ref">REFUSED</text></svg>`;
  const { X, Y } = frame(rec.pts, size, pad);
  let dmax = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) dmax = Math.max(dmax, rec.D[i][j]);
  const ch = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const close = 1 - rec.D[i][j] / (dmax || 1);
    if (close <= 0.02) continue;
    ch.push(`<line x1="${X(rec.pts[i]).toFixed(1)}" y1="${Y(rec.pts[i]).toFixed(1)}" x2="${X(rec.pts[j]).toFixed(1)}" y2="${Y(rec.pts[j]).toFixed(1)}" class="ch"`
      + ` stroke-opacity="${(0.03 + 0.66 * Math.pow(close, 2.3)).toFixed(3)}" stroke-width="${(0.5 + 2.2 * Math.pow(close, 3)).toFixed(2)}"/>`);
  }
  let over = '';
  if (rec.order) {
    over += `<path d="${rec.pts.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ',' + Y(p).toFixed(1)).join('')}" class="ord"/>`;
    over += `<path d="M${X(rec.pts[n - 1]).toFixed(1)},${Y(rec.pts[n - 1]).toFixed(1)}L${X(rec.pts[0]).toFixed(1)},${Y(rec.pts[0]).toFixed(1)}" class="clo"/>`;
  } else if (rec.mst) {
    over += `<path d="${rec.mst.map(([i, j]) => `M${X(rec.pts[i]).toFixed(1)},${Y(rec.pts[i]).toFixed(1)}L${X(rec.pts[j]).toFixed(1)},${Y(rec.pts[j]).toFixed(1)}`).join('')}" class="mst"/>`;
  }
  const dots = rec.pts.map((p, i) => {
    const lab = String(items[i]).length > 12 ? String(items[i]).slice(0, 11) + '·' : items[i];
    const first = rec.order && i === 0;
    return `<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="${first ? 4 : 2.7}" class="pt${first ? ' first' : ''}"/>`
      + (labels ? label(X, Y, p, size, i, lab, 'lb' + (first ? ' first' : '')) : '');
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="pl"><rect width="${size}" height="${size}" fill="#0a0a0c"/><g class="chords">${ch}</g>${over}${dots}</svg>`;
}

function overlay(recs, itemsIn, order, { size = 520, pad = 92, short = null } = {}) {
  const items = short || itemsIn;
  const live = recs.filter(r => r && r.pts);
  if (live.length < 2) return '';
  const n = items.length;
  const ref = live[0].pts;
  const A = live.map(r => align(r.pts, ref));
  const consensus = Array.from({ length: n }, (_, i) => [
    A.reduce((s, P) => s + P[i][0], 0) / A.length, A.reduce((s, P) => s + P[i][1], 0) / A.length]);
  const { X, Y } = frame([].concat(...A), size, pad);
  const cls = ['m0', 'm1', 'm2'];
  let out = '';
  A.forEach((P, k) => {
    const d = order
      ? P.map((p, i) => (i ? 'L' : 'M') + X(p).toFixed(1) + ',' + Y(p).toFixed(1)).join('') + `L${X(P[0]).toFixed(1)},${Y(P[0]).toFixed(1)}`
      : (live[k].mst || []).map(([i, j]) => `M${X(P[i]).toFixed(1)},${Y(P[i]).toFixed(1)}L${X(P[j]).toFixed(1)},${Y(P[j]).toFixed(1)}`).join('');
    out += `<path d="${d}" class="ov ${cls[k]}"/>`;
    out += P.map(p => `<circle cx="${X(p).toFixed(1)}" cy="${Y(p).toFixed(1)}" r="1.9" class="ovp ${cls[k]}"/>`).join('');
  });
  out += consensus.map((p, i) => label(X, Y, p, size, i,
    String(items[i]).length > 12 ? String(items[i]).slice(0, 11) + '·' : items[i], 'lb', 26)).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="pl"><rect width="${size}" height="${size}" fill="#0a0a0c"/>${out}</svg>`;
}

/* a matrix as a raster: cell (i,j) shaded by value / max */
function fieldPNG(M, encodePNG, { cell = 22, gamma = 0.62 } = {}) {
  const n = M.length, W = n * cell;
  let mx = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) mx = Math.max(mx, M[i][j]);
  const rgb = new Float64Array(W * W * 3);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const v = M[Math.floor(j / cell)][Math.floor(i / cell)];
    const edge = (i % cell === 0 || j % cell === 0) ? 0.06 : 0;
    const g = Math.max(edge, 0.02 + 0.95 * Math.pow(mx ? v / mx : 0, gamma));
    const o = (j * W + i) * 3; rgb[o] = rgb[o + 1] = rgb[o + 2] = g;
  }
  return { uri: 'data:image/png;base64,' + encodePNG(W, W, rgb).toString('base64'), max: mx, n };
}

module.exports = { plate, overlay, fieldPNG, align };
