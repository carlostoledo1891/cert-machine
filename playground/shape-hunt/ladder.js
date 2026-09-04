/* ladder.js — every defect on this page, read in percent noise.

   The page reports margins: a symmetry 12x better than its null, a catalogue
   match 47x better than its null, a pentagon no better than chance. Those are
   honest numbers and they are not comparable to each other, because each test
   has its own null and its own units. "12x" and "47x" answer different
   questions.

   So: take a shape whose answer is known — the perfect regular 12-gon — and
   pour noise into it. Each point is displaced by a uniform draw from a disc of
   radius EPS times the circle's radius, the distances are recomputed and rounded
   back onto the same 0-100 integer grid, and every test on the page is run
   again with its own null. Do that at a ladder of noise levels and each test
   acquires a BREAKING POINT: the noise at which it stops seeing a shape that is
   still, by construction, there.

   Now the units are shared. A defect of any kind can be quoted as the amount of
   noise a perfect 12-gon needs before it looks the same — and the tests can be
   ranked by how much damage they survive, which is the only fair way to say one
   is sharper than another.

   THE NOISE IS APPLIED TO THE POINTS, NOT THE DISTANCES. A perturbed point set
   is still a Euclidean configuration, so this ladder measures how the SHAPE
   tests degrade without also breaking the metric under them. The Euclidean
   tests get their own ladder, further down, where the distances are perturbed
   directly — because that is the damage those tests are for.
*/
'use strict';
const H = require('./hunt.js');
const CM = require('./cm.js');
const { hunt, nullHunt, symmetry, nearestShape, certify } = require('./engine.js');

/* the base: a regular n-gon inscribed so its diameter is the grid's 100 */
function ngonPts(n, R = 50) {
  return Array.from({ length: n }, (_, i) => [R * Math.cos((2 * Math.PI * i) / n), R * Math.sin((2 * Math.PI * i) / n)]);
}
function distD(pts) {
  const n = pts.length, D = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    D[i][j] = D[j][i] = Math.round(Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  return D;
}
/* displace every point inside a disc of radius eps * R */
function jitter(pts, eps, rnd, R = 50) {
  return pts.map((p) => {
    const a = 2 * Math.PI * rnd(), r = eps * R * Math.sqrt(rnd());
    return [p[0] + r * Math.cos(a), p[1] + r * Math.sin(a)];
  });
}
/* the other ladder: damage the DISTANCES, which is what breaks a metric */
function jitterD(D, eps, rnd) {
  const n = D.length, diam = Math.max(...D.map((r) => Math.max(...r)));
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++)
    out[i][j] = out[j][i] = Math.max(1, Math.round(D[i][j] + eps * diam * (2 * rnd() - 1)));
  return out;
}

/* every margin on the page, for one matrix. A margin above 1 means the test
   still sees the shape; below 1 means it has lost it. */
function margins(D, rnd, quads, floor) {
  const h = hunt(D);
  const nl = nullHunt(D, rnd);
  const sym = symmetry(D, rnd);
  const near = nearestShape(D, rnd);
  const ex = certify(D, h);
  const dec = CM.decide(D, quads);
  const nts = dec.negtype.best ? dec.negtype.best.s : -1;
  const r = (nul, val) => nul / Math.max(val, 1e-9);
  return {
    tests: h.tests * (1 + nl.trials) + quads.length * 2,
    symmetry: r(sym.nullMatched, sym.best.defect),
    ring4: h.rings[4] ? r(nl.rings[4], ex.rings[4]) : null,
    ring5: h.rings[5] ? r(nl.rings[5], ex.rings[5]) : null,
    concyclic: r(nl.concyclic, ex.concyclic),
    catalogue: near ? near.nullP05 / Math.max(near.best.d, 1e-12) : null,
    /* Euclidean is pass/fail, not a ratio: the margin is how far the best
       negative-type witness sits above the grid's own rounding floor */
    euclidean: floor / Math.max(nts, 1e-12),
    negtype: nts,
    cmNegative: dec.cm.negative,
    ptolemy: h.ptolemy.violations,
    element: sym.best.kind,
  };
}

const med = (a) => { const s = a.filter((x) => x !== null && Number.isFinite(x)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const rate = (a) => { const s = a.filter((x) => x !== null); return s.length ? s.filter((x) => x > 1).length / s.length : null; };

/* the ladder: levels of noise, trials at each, one row per level */
function run(n, levels, trials, seed, mode = 'points') {
  const quads = H.comb(n, 4);
  const base = ngonPts(n);
  const baseD = distD(base);
  /* THE FLOOR IS THE GRID'S OWN NOISE, measured on the unperturbed shape, the
     same way the page's Ptolemy floor was measured. A perfect 12-gon rounded
     onto integers is very slightly non-Euclidean, and nothing shallower than
     that is ever counted as a violation anywhere. */
  const floor = Math.max(CM.decide(baseD, quads).negtype.best.s, 1e-9);
  const rows = [];
  for (const eps of levels) {
    const acc = [];
    for (let t = 0; t < trials; t++) {
      const rnd = H.seeded(seed + 7919 * t + Math.round(1e6 * eps));
      const D = eps === 0 ? baseD : (mode === 'points' ? distD(jitter(base, eps, rnd)) : jitterD(baseD, eps, rnd));
      acc.push(margins(D, rnd, quads, floor));
    }
    const col = (k) => acc.map((a) => a[k]);
    rows.push({
      eps, trials, tests: acc.reduce((a, x) => a + x.tests, 0),
      median: Object.fromEntries(['symmetry', 'ring4', 'ring5', 'concyclic', 'catalogue', 'euclidean'].map((k) => [k, med(col(k))])),
      pass: Object.fromEntries(['symmetry', 'ring4', 'ring5', 'concyclic', 'catalogue', 'euclidean'].map((k) => [k, rate(col(k))])),
      cmNegative: med(col('cmNegative')), ptolemy: med(col('ptolemy')),
      reversed: acc.filter((a) => /rotation|reflection/.test(a.element)).length,
    });
  }
  return { n, mode, floor, levels, trials, rows };
}

/* where a test's median margin crosses 1, by straight interpolation between the
   two levels that bracket it — the breaking point, in percent noise */
function breakingPoint(rows, key) {
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1].median[key], b = rows[i].median[key];
    if (a === null || b === null) continue;
    if (a >= 1 && b < 1) {
      const f = (a - 1) / (a - b);
      return rows[i - 1].eps + f * (rows[i].eps - rows[i - 1].eps);
    }
  }
  const last = rows[rows.length - 1];
  return last.median[key] !== null && last.median[key] >= 1 ? Infinity : 0;
}
/* the inverse reading: what noise level has this margin? */
function noiseFor(rows, key, margin) {
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1].median[key], b = rows[i].median[key];
    if (a === null || b === null) continue;
    if (a >= margin && b < margin) {
      const f = (a - margin) / (a - b);
      return rows[i - 1].eps + f * (rows[i].eps - rows[i - 1].eps);
    }
  }
  const first = rows[0].median[key], last = rows[rows.length - 1].median[key];
  if (first !== null && margin > first) return 0;
  if (last !== null && margin <= last) return null;          /* off the end of the ladder */
  return null;
}

module.exports = { ngonPts, distD, jitter, jitterD, margins, run, breakingPoint, noiseFor };
