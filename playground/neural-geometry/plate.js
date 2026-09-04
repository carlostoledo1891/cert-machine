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

function plate(m, items, { size = 560, pad = 66, hasOrder = true } = {}) {
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

  /* WHAT GOES ON TOP depends on whether the set has an order to walk. Days of
     the week do; a taxonomy does not, and drawing "the path from cat to raccoon"
     would be inventing a sequence the world has no opinion about. Where there is
     no order the skeleton is the MINIMUM SPANNING TREE — the cheapest tree the
     model's own numbers admit, and the thing a taxonomy should look like. */
  const order = Array.from({ length: n }, (_, i) => i);
  let pathD = '', closeD = '', treeD = '';
  if (hasOrder) {
    pathD = order.map((i, t) => (t ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(i).toFixed(1)).join('');
    closeD = `M${X(n - 1).toFixed(1)},${Y(n - 1).toFixed(1)}L${X(0).toFixed(1)},${Y(0).toFixed(1)}`;
  } else if (m.mst) {
    treeD = m.mst.map(([i, j]) => `M${X(i).toFixed(1)},${Y(i).toFixed(1)}L${X(j).toFixed(1)},${Y(j).toFixed(1)}`).join('');
  }

  const dots = order.map((i) => {
    const a = Math.atan2(Y(i) - size / 2, X(i) - size / 2);
    const lx = X(i) + Math.cos(a) * 18, ly = Y(i) + Math.sin(a) * 18;
    const anchor = Math.cos(a) > 0.34 ? 'start' : Math.cos(a) < -0.34 ? 'end' : 'middle';
    const label = String(items[i]).length > 10 ? String(items[i]).slice(0, 9) + '·' : items[i];
    const first = hasOrder && i === 0;
    return `<circle cx="${X(i).toFixed(1)}" cy="${Y(i).toFixed(1)}" r="${first ? 5 : 3.4}" class="pt${first ? ' first' : ''}"/>`
      + `<text x="${lx.toFixed(1)}" y="${(ly + 4.6).toFixed(1)}" class="lb${first ? ' first' : ''}" text-anchor="${anchor}">${label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="plate" role="img" aria-label="${items.length} items placed by one model's own dissimilarity judgements; every pair drawn as a chord, the item order as a path, and the closing step drawn apart.">
<g class="chords">${chords.join('')}</g>
${pathD ? `<path d="${pathD}" class="ord"/>` : ''}
${closeD ? `<path d="${closeD}" class="clo"/>` : ''}
${treeD ? `<path d="${treeD}" class="mst"/>` : ''}
${dots}
</svg>`;
}

module.exports = { plate };

/* mapPlate — every cell on the page at once, in the plane of the two numbers.

   Curvature (how much of the available signature is negative) against closure
   (Gromov's δ over the diameter). Neither number knows what the set was; the
   grouping is what the answers do on their own. The controls land in the corner
   where both are zero, and nothing else does.
*/
function mapPlate(sets, { size = 1000, pad = 92 } = {}) {
  const cells = [];
  for (const s of sets) for (const m of s.models) {
    if (m.incomplete) continue;
    cells.push({ set: s.id, shape: s.shape, model: m.id, x: m.hyp.norm, y: m.signature.q / (m.n - 1) });
  }
  const x1 = Math.max(0.52, ...cells.map((c) => c.x)) * 1.04;
  const y1 = Math.max(0.55, ...cells.map((c) => c.y)) * 1.06;
  const X = (v) => pad + (v / x1) * (size - 2 * pad);
  const Y = (v) => size - pad - (v / y1) * (size - 2 * pad);

  const grid = [];
  for (let k = 0; k <= 4; k++) {
    const gx = (k / 4) * x1, gy = (k / 4) * y1;
    grid.push(`<line x1="${X(gx).toFixed(1)}" y1="${Y(0).toFixed(1)}" x2="${X(gx).toFixed(1)}" y2="${Y(y1).toFixed(1)}" class="mg"/>`);
    grid.push(`<line x1="${X(0).toFixed(1)}" y1="${Y(gy).toFixed(1)}" x2="${X(x1).toFixed(1)}" y2="${Y(gy).toFixed(1)}" class="mg"/>`);
    grid.push(`<text x="${X(gx).toFixed(1)}" y="${(size - pad + 20).toFixed(1)}" class="max" text-anchor="middle">${gx.toFixed(2)}</text>`);
    grid.push(`<text x="${(pad - 10).toFixed(1)}" y="${(Y(gy) + 4).toFixed(1)}" class="max" text-anchor="end">${gy.toFixed(2)}</text>`);
  }

  /* ONE hull, and only one: the controls. Drawing an envelope round every kind
     produced five overlapping polygons that asserted a tidiness the points do
     not have. The controls are the claim — both numbers at zero, alone — so
     they get the ring and everything else is left as marks. */
  const ctl = cells.filter((c) => c.shape === 'none').map((c) => [X(c.x), Y(c.y)]);
  let blobs = '';
  if (ctl.length >= 3) {
    const cx = ctl.reduce((a, q) => a + q[0], 0) / ctl.length, cy = ctl.reduce((a, q) => a + q[1], 0) / ctl.length;
    const r = Math.max(20, ...ctl.map((q) => Math.hypot(q[0] - cx, q[1] - cy))) + 14;
    blobs = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" class="mb k-none"/>`
      + `<text x="${(cx + r + 10).toFixed(1)}" y="${(cy + 4).toFixed(1)}" class="ml ctl">the controls</text>`;
  }

  const marks = cells.map((c) =>
    `<circle cx="${X(c.x).toFixed(1)}" cy="${Y(c.y).toFixed(1)}" r="5" class="mp k-${c.shape}"><title>${c.set} · ${c.model.replace('claude-', '')} — δ/diam ${c.x.toFixed(3)}, curvature ${c.y.toFixed(2)}</title></circle>`).join('');

  /* one label per SET, at its own centroid, then pushed apart — six sets pile
     into the top-right corner and overlapping labels are worse than none */
  /* the two controls sit on top of each other inside the ring, which is already
     labelled — two names in one place is worse than one name for both */
  const labs = sets.filter((s) => s.shape !== 'none' && s.models.some((m) => !m.incomplete)).map((s) => {
    const cs = cells.filter((c) => c.set === s.id);
    return { id: s.id, x: cs.reduce((a, c) => a + X(c.x), 0) / cs.length, y: cs.reduce((a, c) => a + Y(c.y), 0) / cs.length - 13 };
  }).sort((a, b) => a.y - b.y);
  for (let pass = 0; pass < 90; pass++) {
    let moved = false;
    for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) {
      const dx = Math.abs(labs[i].x - labs[j].x), dy = labs[j].y - labs[i].y;
      if (dx < 96 && dy < 17) { labs[j].y = labs[i].y + 17; moved = true; }
    }
    if (!moved) break;
  }
  const labels = labs.map((l) => `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" class="ml" text-anchor="middle">${l.id}</text>`).join('');

  return `<svg viewBox="0 0 ${size} ${size}" class="map" role="img" aria-label="Every set and model placed by two exact numbers: Gromov delta over diameter on the horizontal, share of negative Gram directions on the vertical. The controls sit alone in the corner where both are zero.">
<g class="grids">${grid.join('')}</g>
${blobs}${marks}${labels}
<text x="${(size / 2).toFixed(1)}" y="${(size - 22).toFixed(1)}" class="max ax" text-anchor="middle">δ / diameter  —  how far from a tree, how close to a cycle</text>
<text class="max ax" text-anchor="middle" transform="translate(${(pad - 44).toFixed(1)},${(size / 2).toFixed(1)}) rotate(-90)">curvature — share of the signature that is negative</text>
</svg>`;
}

module.exports.mapPlate = mapPlate;
