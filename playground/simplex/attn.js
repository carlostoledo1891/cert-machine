/* attn.js — an attention row as a point on the simplex, and the one thing about
   it that is decided rather than drawn.

   THE OBJECT. A row of attention weights is nonnegative and sums to one. That
   is not a bar chart with a normalisation bolted on; it is a point in the
   standard simplex Δⁿ⁻¹, and almost everything interesting about attention is a
   statement about WHERE in that simplex the point sits. "This head is focused"
   means "far from the barycentre". "It spreads" means "near it".

   THE SCALAR. Participation ratio, PR = 1 / Σ pᵢ², is the number of positions
   the row effectively attends to: n at the barycentre, 1 at a vertex, and its
   level sets are spheres cut by the simplex — so concentration has contours you
   can draw. Entropy tells a similar story less geometrically.

   THE DECISION. Sharpening the temperature must move the point toward a vertex:
   PR strictly decreases in β. For the RATIONAL kernel w ∝ (1+βs)^p this is
   decided here in exact arithmetic on BigInt fractions, because consecutive PRs
   on this row differ in the fourteenth decimal and a float comparison of them
   decides nothing. Softmax is transcendental and is drawn in float on this page,
   labelled as a view; its sound interval enclosure lives in the source lab and
   is not restated here as though we had re-derived it.

   THE FALSIFIERS. Two planted mutants must FAIL to concentrate: flat scores
   (PR = n exactly, at every β) and a quadratic scale (β−3)²·s, which is
   non-monotone by construction because the factor dips to zero at β = 3. An
   instrument that cannot go red on those is theatre.

   Scores: one causal attention row (last query, layer 0, head 0) from a tiny
   GPT at seed 0, frozen once, 31 positions — the fixture from sin-mfg's
   attention-geometry pack, carried here with its sha256 and re-derived rather
   than quoted.
*/
'use strict';
const R = require('./rational.js');

const P_PRIMARY = 2;

/* --- the kernels ---------------------------------------------------------- */

/* w ∝ (1 + logit)^p, exactly. Returns the unnormalised weights and Σ, Σ². */
function railExact(logits, p) {
  const us = logits.map((l) => {
    const base = R.add(R.int(1), l);
    if (R.sign(base) <= 0) throw new Error('kernel base non-positive — outside the kernel’s domain');
    return R.pow(base, p);
  });
  const Z = us.reduce((a, u) => R.add(a, u), R.int(0));
  const S2u = us.reduce((a, u) => R.add(a, R.mul(u, u)), R.int(0));
  const S2 = R.div(S2u, R.mul(Z, Z));         // Σ pᵢ²
  return { us, Z, S2, PR: R.div(R.int(1), S2) };
}

/* the three logit scalings the page draws: the row, and its two falsifiers */
const SCALES = {
  rational: { label: 'the row', scale: (b, s) => R.mul(b, s) },
  flat: { label: 'mutant · flat scores', scale: () => R.int(0) },
  quadratic: { label: 'mutant · (β−3)²·s', scale: (b, s) => R.mul(R.mul(R.sub(b, R.int(3)), R.sub(b, R.int(3))), s) },
};

/* PR and Σp² across the β grid, exactly, for one scaling */
function curveExact(scores, betas, p, scale) {
  return betas.map((b) => {
    const { PR, S2, us, Z } = railExact(scores.map((s) => scale(b, s)), p);
    return { beta: R.toNumber(b), PR, S2, weights: us.map((u) => R.toNumber(R.div(u, Z))) };
  });
}

const strictlyDown = (v) => v.every((x, i) => i === 0 || R.lt(x, v[i - 1]));
const strictlyUp = (v) => v.every((x, i) => i === 0 || R.gt(x, v[i - 1]));

/* --- softmax: float, and said so ------------------------------------------ */
function softmaxFloat(scores, beta) {
  const m = Math.max(...scores.map((s) => beta * s));
  const e = scores.map((s) => Math.exp(beta * s - m));
  const Z = e.reduce((a, x) => a + x, 0);
  return e.map((x) => x / Z);
}
const prFloat = (p) => 1 / p.reduce((a, x) => a + x * x, 0);
const entropyFloat = (p) => -p.reduce((a, x) => a + (x > 0 ? x * Math.log(x) : 0), 0);

/* --- the geometry the page draws ------------------------------------------ */

/* The point's TRUE position on a 2-face of the simplex: pick three positions,
   renormalise onto them. This is not a projection or an embedding — it is the
   exact barycentric coordinate of the row restricted to a real triangular face,
   which is why it can carry exact contours drawn on top of it. */
function face(weights, idx) {
  const s = idx.reduce((a, i) => a + weights[i], 0);
  return idx.map((i) => weights[i] / s);
}

/* PR level sets on that face, as polylines in barycentric coordinates. PR is
   1/Σpᵢ² there too, so a contour is a circle in the plane of the triangle —
   drawn by walking the ray from the barycentre in every direction and solving
   for the radius where Σpᵢ² hits its target. */
function faceContours(levels, steps = 240) {
  const bary = [1 / 3, 1 / 3, 1 / 3];
  const out = [];
  for (const L of levels) {
    const target = 1 / L;                       // Σpᵢ² at PR = L
    /* A contour is a circle in the plane of the triangle, but the TRIANGLE is
       not the plane: past PR ≈ 1.33 the circle leaves the face and comes back,
       so the contour is several ARCS. Closing across the gap drew phantom
       triangles in the corners — the picture asserting a level set where the
       face has none. Runs of consecutive in-face samples are emitted as
       separate open polylines instead. */
    const runs = [];
    let run = [];
    for (let k = 0; k <= steps; k++) {
      const th = (2 * Math.PI * (k % steps)) / steps;
      const d = [Math.cos(th), Math.cos(th - (2 * Math.PI) / 3), Math.cos(th + (2 * Math.PI) / 3)];
      const dd = d.reduce((a, x) => a + x * x, 0);
      // Σ(bary + t·d)² = 1/3 + t²·Σd²  (the cross term vanishes on the barycentre)
      const t2 = (target - 1 / 3) / dd;
      let p = null;
      if (t2 > 0) {
        const t = Math.sqrt(t2);
        const q = bary.map((b, i) => b + t * d[i]);
        if (q.every((x) => x >= 0 && x <= 1)) p = q;
      }
      if (p) run.push(p);
      else { if (run.length > 2) runs.push(run); run = []; }
    }
    if (run.length > 2) runs.push(run);
    /* a contour that wrapped all the way round is one closed loop */
    const closed = runs.length === 1 && runs[0].length >= steps;
    for (const r of runs) out.push({ level: L, pts: r, closed });
  }
  return out;
}

module.exports = { P_PRIMARY, SCALES, railExact, curveExact, strictlyDown, strictlyUp,
                   softmaxFloat, prFloat, entropyFloat, face, faceContours };
