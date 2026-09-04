/* uv-art.js — the card art, and it is not decoration.

   An interferometer never measures a picture. It measures the sky's Fourier
   transform at one point per pair of telescopes per instant, and as the Earth
   turns, each pair sweeps an arc. What you see below is the whole of what was
   measured on the best night: every arc, and its mirror image, because a real
   sky makes V(-u) the conjugate of V(u) and so every measurement is two.

   Everything between the arcs was never observed. That empty space is the
   reason there is a set of pictures rather than a picture.
*/
'use strict';
const fs = require('fs');

function uvTracks(csvPath, { maxG = 8.2 } = {}) {
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
  const head = lines.findIndex(l => l.startsWith('#time'));
  const rows = [];
  for (let i = head + 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    if (c.length < 8) continue;
    rows.push({ t: +c[0], b: c[1] + '-' + c[2], u: +c[3] / 1e9, v: +c[4] / 1e9 });
  }
  const by = new Map();
  for (const r of rows) {
    if (!Number.isFinite(r.u) || !Number.isFinite(r.v)) continue;
    if (!by.has(r.b)) by.set(r.b, []);
    by.get(r.b).push(r);
  }
  const tracks = [];
  for (const [b, pts] of by) {
    pts.sort((a, c) => a.t - c.t);
    /* thin along the arc — a track is smooth, and 300 identical points is not
       information, it is weight on the page */
    const keep = [];
    let last = null;
    for (const p of pts) {
      if (!last || Math.hypot(p.u - last.u, p.v - last.v) > 0.02) { keep.push(p); last = p; }
    }
    if (keep.length) tracks.push({ b, pts: keep });
  }
  /* two different numbers, and the label must be the honest one: `maxUV` is the
     longest baseline actually observed, `R` is the plot radius with a little air
     around it. Printing the padded radius as if it were the data was the first
     version of this file. */
  const maxUV = Math.max(...rows.map(r => Math.hypot(r.u, r.v)));
  const R = Math.min(maxG, maxUV * 1.06);
  return { tracks, R, maxUV, rows: rows.length, baselines: by.size };
}

function uvSVG(csvPath, { size = 900, maxG = 8.2 } = {}) {
  const { tracks, R, maxUV, rows, baselines } = uvTracks(csvPath, { maxG });
  const c = size / 2, k = c / R;
  const P = (u, v) => `${(c + u * k).toFixed(1)},${(c - v * k).toFixed(1)}`;
  const paths = [];
  for (const t of tracks) {
    for (const sgn of [1, -1]) {
      const d = t.pts.map((p, i) => (i ? 'L' : 'M') + P(sgn * p.u, sgn * p.v)).join('');
      paths.push(`<path d="${d}"/>`);
    }
  }
  /* rings at round baseline lengths — the fringe spacing each one resolves */
  const rings = [2, 4, 6, 8].filter(g => g < R).map(g =>
    `<circle cx="${c}" cy="${c}" r="${(g * k).toFixed(1)}"/>`).join('');
  return {
    svg: `<svg class="uv" viewBox="0 0 ${size} ${size}" role="img" aria-label="The u–v coverage of the M87 April 21 2018 band 3 observation: every baseline's arc and its conjugate mirror.">
  <g class="uv-rings">${rings}</g>
  <g class="uv-tracks">${paths.join('')}</g>
</svg>`,
    rows, baselines, R, maxUV
  };
}

module.exports = { uvSVG, uvTracks };
