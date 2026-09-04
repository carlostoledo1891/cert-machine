/* solids.js — a catalogue of shapes with known answers, as distance spectra.

   WHY SPECTRA AND NOT COORDINATES. Asking "are these twelve items an
   icosahedron" by fitting coordinates means trying every way of labelling
   twelve vertices, which is 479 million labellings. But the multiset of pairwise
   distances does not care which vertex is which: a cube has exactly three
   distinct distances in the proportions 12 : 12 : 4, and nothing else does. So
   the catalogue stores each shape's sorted, scale-normalised distance spectrum,
   and matching is a comparison of two sorted lists.

   WHY PLANAR SHAPES ARE IN A CATALOGUE OF SOLIDS. Because otherwise the question
   is rigged. A set that really is a flat ring would be scored against
   icosahedra and cuboctahedra and reported as a poor polyhedron, when the true
   answer is that it is an excellent 12-gon. The catalogue holds the flat shapes,
   the degenerate ones and the solids together, and each set is simply told which
   member it is nearest.
*/
'use strict';

const PHI = (1 + Math.sqrt(5)) / 2;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], (a[2] || 0) - (b[2] || 0));

/* the invariant: every pairwise distance, sorted, divided by their mean */
function spectrum(pts) {
  const d = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) d.push(dist(pts[i], pts[j]));
  const mean = d.reduce((a, x) => a + x, 0) / d.length;
  return d.map((x) => x / mean).sort((a, b) => a - b);
}
function spectrumOfD(D) {
  const d = [];
  for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) d.push(D[i][j]);
  const mean = d.reduce((a, x) => a + x, 0) / d.length;
  return mean > 0 ? d.map((x) => x / mean).sort((a, b) => a - b) : d;
}
/* root-mean-square gap between two spectra of the same length */
function spectrumDistance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}

/* ---- the shapes ---------------------------------------------------------- */
const ngon = (n) => Array.from({ length: n }, (_, i) => [Math.cos((2 * Math.PI * i) / n), Math.sin((2 * Math.PI * i) / n), 0]);
const line = (n) => Array.from({ length: n }, (_, i) => [i, 0, 0]);
/* every pair the same distance: the shape of no structure at all */
const simplex = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
const grid = (a, b) => { const p = []; for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) p.push([i, j, 0]); return p; };
const antiprism = (m) => {
  const p = [], h = 0.7;
  for (let i = 0; i < m; i++) p.push([Math.cos((2 * Math.PI * i) / m), Math.sin((2 * Math.PI * i) / m), h]);
  for (let i = 0; i < m; i++) p.push([Math.cos((2 * Math.PI * (i + 0.5)) / m), Math.sin((2 * Math.PI * (i + 0.5)) / m), -h]);
  return p;
};
const bipyramid = (m) => [...ngon(m), [0, 0, 1.2], [0, 0, -1.2]];
const cube = () => { const p = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) p.push([x, y, z]); return p; };
const octahedron = () => [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const tetrahedron = () => [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
const icosahedron = () => {
  const p = [];
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
    p.push([0, s1, s2 * PHI]); p.push([s1, s2 * PHI, 0]); p.push([s2 * PHI, 0, s1]);
  }
  return p;
};
const cuboctahedron = () => {
  const p = [];
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) { p.push([s1, s2, 0]); p.push([s1, 0, s2]); p.push([0, s1, s2]); }
  return p;
};

/* a spectrum for the equidistant case, built directly (the simplex helper above
   returns indicator vectors whose pairwise distance is a constant) */
const catalogue = (n) => {
  const out = [];
  const add = (name, kind, pts) => { if (pts.length === n) out.push({ name, kind, spectrum: spectrum(pts) }); };
  add(`regular ${n}-gon`, 'planar', ngon(n));
  add(`${n} points on a line`, 'degenerate', line(n));
  add(`${n} equidistant points`, 'degenerate', simplex(n));
  for (let a = 2; a * a <= n; a++) if (n % a === 0 && n / a >= 2) { add(`${a} × ${n / a} grid`, 'planar', grid(a, n / a)); }
  if (n % 2 === 0) add(`${n / 2}-antiprism`, 'solid', antiprism(n / 2));
  if (n >= 5) add(`${n - 2}-gon bipyramid`, 'solid', bipyramid(n - 2));
  add('cube', 'solid', cube());
  add('octahedron', 'solid', octahedron());
  add('tetrahedron', 'solid', tetrahedron());
  add('icosahedron', 'solid', icosahedron());
  add('cuboctahedron', 'solid', cuboctahedron());
  return out;
};

module.exports = { catalogue, spectrum, spectrumOfD, spectrumDistance };
