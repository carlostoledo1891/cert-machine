/* chart.js — the ladder, drawn. One line per test, noise across, margin up.

   The y axis is logarithmic because the margins on this page span four orders
   of magnitude — a perfect ring's symmetry against its null is six hundred to
   one and a pentagon's is one to one — and a linear axis would render every
   result except the largest as the same flat line on the floor.

   THE ONLY LINE THAT MEANS ANYTHING IS y = 1. Above it the test still sees the
   shape; below it the test has lost a shape that is still, by construction,
   there. So that line is drawn solid and labelled, and the gridlines are not.
*/
'use strict';

function ladderChart(rows, series, { w = 900, h = 420, pad = { l: 52, r: 150, t: 18, b: 44 } } = {}) {
  const xs = rows.map((r) => r.eps);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const vals = [];
  for (const s of series) for (const r of rows) { const v = r.median[s.key]; if (v !== null && Number.isFinite(v) && v > 0) vals.push(v); }
  const ymin = Math.max(Math.min(...vals, 0.5) / 1.6, 1e-3);
  const ymax = Math.min(Math.max(...vals, 2) * 1.6, 1e4);
  const X = (e) => pad.l + ((e - xmin) / (xmax - xmin)) * (w - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (Math.log(Math.min(Math.max(v, ymin), ymax)) - Math.log(ymin)) / (Math.log(ymax) - Math.log(ymin))) * (h - pad.t - pad.b);

  const decades = [];
  for (let e = Math.ceil(Math.log10(ymin)); e <= Math.floor(Math.log10(ymax)); e++) decades.push(10 ** e);
  const grid = decades.map((d) => `<line x1="${pad.l}" y1="${Y(d).toFixed(1)}" x2="${w - pad.r}" y2="${Y(d).toFixed(1)}" class="cg"/>`
    + `<text x="${pad.l - 8}" y="${(Y(d) + 3.5).toFixed(1)}" class="cyl">${d >= 1 ? d + '×' : d}</text>`).join('');
  const ticks = rows.filter((_, i) => i % 2 === 0).map((r) =>
    `<text x="${X(r.eps).toFixed(1)}" y="${h - pad.b + 18}" class="cxl">${(100 * r.eps).toFixed(0)}%</text>`).join('');

  /* the y = 1 label goes INSIDE the plot, above its own line: in the right-hand
     gutter it lands on whichever series happens to end near 1 and the two words
     print on top of each other. */
  const one = `<line x1="${pad.l}" y1="${Y(1).toFixed(1)}" x2="${w - pad.r}" y2="${Y(1).toFixed(1)}" class="cone"/>`
    + `<text x="${pad.l + 8}" y="${(Y(1) - 7).toFixed(1)}" class="conel">below: the test has lost it</text>`;

  /* the series labels sit in the right gutter at the height of each line's last
     point, so two lines that converge print their names on top of each other.
     Push them apart to a minimum spacing, keeping their order. */
  const drawn = series.map((s, si) => {
    const pts = rows.map((r) => [r.eps, r.median[s.key]]).filter(([, v]) => v !== null && Number.isFinite(v) && v > 0);
    return { s, si, pts, y: pts.length ? Y(pts[pts.length - 1][1]) : null };
  }).filter((d) => d.pts.length);
  const GAP = 15;
  const order = drawn.slice().sort((a, b) => a.y - b.y);
  for (let i = 1; i < order.length; i++) if (order[i].y - order[i - 1].y < GAP) order[i].y = order[i - 1].y + GAP;
  const overshoot = order.length ? Math.max(0, order[order.length - 1].y - (h - pad.b)) : 0;
  for (const o of order) o.y -= overshoot;

  const lines = drawn.map(({ s, si, pts, y }) => {
    const d = pts.map(([e, v], i) => (i ? 'L' : 'M') + X(e).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
    const last = pts[pts.length - 1];
    const dots = pts.map(([e, v]) => `<circle cx="${X(e).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.4" class="cd s${si % 3}"/>`).join('');
    /* a leader from the line's end to a label that had to move */
    const lead = Math.abs(y - Y(last[1])) > 1
      ? `<line x1="${(w - pad.r).toFixed(1)}" y1="${Y(last[1]).toFixed(1)}" x2="${(w - pad.r + 5).toFixed(1)}" y2="${y.toFixed(1)}" class="cl s${si % 3}" stroke-width="1" opacity="0.5"/>` : '';
    return `<path d="${d}" class="cl s${si % 3}"/>${dots}${lead}`
      + `<text x="${(w - pad.r + 8).toFixed(1)}" y="${(y + 3.5).toFixed(1)}" class="cll s${si % 3}">${s.label}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${w} ${h}" class="chart" role="img" aria-label="Each test's margin over its own null as noise is poured into a perfect 12-gon.">
<g class="cgrid">${grid}</g>${one}${lines}
<line x1="${pad.l}" y1="${h - pad.b}" x2="${w - pad.r}" y2="${h - pad.b}" class="cax"/>
${ticks}<text x="${((pad.l + w - pad.r) / 2).toFixed(0)}" y="${h - 6}" class="cxt">noise poured into the shape, as a fraction of its radius</text></svg>`;
}

module.exports = { ladderChart };
