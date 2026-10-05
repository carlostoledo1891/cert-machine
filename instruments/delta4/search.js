#!/usr/bin/env node
/* search.js — look for a block colouring better than BCG's (floats PROPOSE; nothing here
   decides). Basin hopping on block colourings of [0,1]: a move (merge a block away,
   insert a block, jiggle every edge), then Newton polish of the edges on F (float sweep
   for F, float h₄(e⁺) = ∂F/∂e as the gradient, its finite differences as the Hessian),
   blocks that shrink to nothing merged away; a move is kept only if the polished F drops.
   (A discrete multiscale descent on [N] from random starts, BCG's own procedure, was tried
   first at N = 800 and stalled in 70+-block minima ≈ 5% above BCG; dropped.)

   Anything that ended below F(BCG) would be handed to the exact pipeline (exact F, exact
   h₄, exact Newton step to the stationary point). Nothing has.

     node instruments/delta4/search.js basin|bcg <seed> <hops>   writes search-<mode>-<seed>.json
                                                             (to $SEARCH_OUT, default beside it)

   MIT licensed. Part of cert-machine. */
'use strict';

const M = require('./model.js');

/* ---- stage 2: continuum polish (floats) ------------------------------------------ */
function colFromEdges(edges, first) {
  const E = [0, ...edges, 1];
  const c = E.slice(0, -1).map((_, k) => ((k % 2 === 0) === (first === 1) ? 1 : -1));
  return { W: 1, classes: [{ E, c }] };
}
const Ff = col => M.F(col);
function gradient(col) {
  const E = col.classes[0].E, g = [];
  for (let j = 1; j < E.length - 1; j++) g.push(M.h4Acc(col, 60 * E[j], 1) / 360);   /* ∂F/∂e_j = h₄(e_j⁺) */
  return g;
}
/* Newton on the edges with the model Hessian, approximated in floats by finite
   differences of the gradient; damped, with merging of vanishing blocks */
function polish(edges, first, iters) {
  let e = edges.slice(), f = first;
  for (let it = 0; it < iters; it++) {
    let col = colFromEdges(e, f);
    const g = gradient(col), n = g.length;
    const gn = Math.sqrt(g.reduce((s, x) => s + x * x, 0));
    if (gn < 1e-13) break;
    const h = 1e-7, H = [];
    for (let j = 0; j < n; j++) { const e2 = e.slice(); e2[j] += h; const g2 = gradient(colFromEdges(e2, f)); H.push(g2.map((x, k) => (x - g[k]) / h)); }
    for (let j = 0; j < n; j++) for (let k = j + 1; k < n; k++) { const s = (H[j][k] + H[k][j]) / 2; H[j][k] = H[k][j] = s; }
    let step = solve(H, g.map(x => -x));
    const F0 = Ff(col);
    let t = 1, ok = false;
    for (let ls = 0; ls < 30; ls++) {
      const cand = e.map((x, j) => x + t * step[j]);
      if (isSorted(cand)) { const F1 = Ff(colFromEdges(cand, f)); if (F1 < F0) { e = cand; ok = true; break; } }
      t /= 2;
    }
    if (!ok) {                                               /* fall back to a gradient step */
      t = 1e-3; for (let ls = 0; ls < 40; ls++) { const cand = e.map((x, j) => x - t * g[j]); if (isSorted(cand) && Ff(colFromEdges(cand, f)) < F0) { e = cand; ok = true; break; } t /= 2; }
    }
    ({ e, f } = mergeTiny(e, f, 1e-9));
    if (!ok) break;
  }
  return { edges: e, first: f, F: Ff(colFromEdges(e, f)) };
}
const isSorted = e => { if (e[0] <= 0 || e[e.length - 1] >= 1) return false; for (let k = 1; k < e.length; k++) if (e[k] <= e[k - 1]) return false; return true; };
function mergeTiny(e, f, tol) {
  let E = [0, ...e, 1], first = f, changed = true;
  while (changed) {
    changed = false;
    for (let k = 0; k + 1 < E.length; k++) if (E[k + 1] - E[k] < tol) {
      if (k === 0) { E.splice(1, 1); first = -first; } else if (k + 1 === E.length - 1) { E.splice(E.length - 2, 1); } else { E.splice(k, 2); }
      changed = true; break;
    }
  }
  return { e: E.slice(1, -1), f: first };
}
function solve(A, b) {
  const n = b.length, M2 = A.map((r, i) => [...r, b[i]]);
  for (let k = 0; k < n; k++) {
    let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M2[i][k]) > Math.abs(M2[p][k])) p = i;
    [M2[k], M2[p]] = [M2[p], M2[k]];
    if (Math.abs(M2[k][k]) < 1e-300) return new Array(n).fill(0);
    for (let i = k + 1; i < n; i++) { const fct = M2[i][k] / M2[k][k]; for (let j = k; j <= n; j++) M2[i][j] -= fct * M2[k][j]; }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M2[i][n]; for (let j = i + 1; j < n; j++) s -= M2[i][j] * x[j]; x[i] = s / M2[i][i]; }
  return x;
}

function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---- stage 3: basin hopping on block colourings (floats) ------------------------- */
function hop(edges, first, rng) {
  const E = edges.slice(), r = rng();
  if (r < 0.35 && E.length > 4) {                           /* merge: delete one interior block */
    const k = 1 + Math.floor(rng() * (E.length - 1));        /* block k = (E[k-1], E[k]) */
    E.splice(k - 1, 2);
    return { edges: E, first, move: 'merge' };
  }
  if (r < 0.7) {                                             /* split: insert a block */
    const x = 0.01 + 0.98 * rng(), w = 1e-3 + 2e-2 * rng();
    const cand = [...E, x, x + w].sort((a, b) => a - b);
    return { edges: cand, first, move: 'split' };
  }
  const s = [1e-3, 3e-3, 1e-2][Math.floor(rng() * 3)];
  const cand = E.map(x => x + s * (rng() + rng() + rng() - 1.5)).sort((a, b) => a - b);
  return { edges: cand, first, move: 'jiggle' };
}
function basin(edges, first, hops, rng, log) {
  let cur = polish(edges, first, 25);
  for (let h = 0; h < hops; h++) {
    const prop = hop(cur.edges, cur.first, rng);
    if (!isSorted(prop.edges)) continue;
    const m = mergeTiny(prop.edges, prop.first, 1e-6);
    const pol = polish(m.e, m.f, 25);
    if (pol.F < cur.F - 1e-13) { cur = pol; if (log) log(h, prop.move, cur); }
  }
  return cur;
}

if (require.main === module) {
  const mode = process.argv[2] || 'basin';
  const seed = Number(process.argv[3] || 1), hops = Number(process.argv[4] || 60);
  const Qr = require('../interval/rational.js');
  const bcg = M.blocksCol(M.BCG_BLOCKS), Fbcg = Qr.toDouble(M.F(bcg)), W = Number(bcg.W);
  const rng = mulberry(seed), t0 = Date.now();
  let start;
  if (mode === 'bcg') start = { edges: bcg.classes[0].E.slice(1, -1).map(e => Number(e) / W), first: 1 };
  else {
    const K = 20 + Math.floor(rng() * 30), e = [];
    for (let k = 0; k < K - 1; k++) e.push(rng());
    e.sort((a, b) => a - b);
    start = { edges: e, first: 1 };
  }
  const log = (h, move, c) => console.log(`  hop ${h} ${move}: blocks ${c.edges.length + 1} F=${c.F.toFixed(12)} F-F_BCG=${(c.F - Fbcg).toExponential(3)} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  const out = basin(start.edges, start.first, hops, rng, log);
  const res = { mode, seed, hops, blocks: out.edges.length + 1, F: out.F, minusBCG: out.F - Fbcg, first: out.first, edges: out.edges, seconds: (Date.now() - t0) / 1000 };
  console.log(JSON.stringify({ ...res, edges: undefined }));
  require('fs').writeFileSync(require('path').join(process.env.SEARCH_OUT || __dirname, `search-${mode}-${seed}.json`), JSON.stringify(res));
}

module.exports = { colFromEdges, gradient, polish, mergeTiny, hop, basin };
