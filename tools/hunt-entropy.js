#!/usr/bin/env node
/* hunt-entropy.js — hunt a certified topological-entropy lower bound for the
   Hénon map at the classical parameters, and detach the certificate.

   The float layer proposes: a long orbit samples the attractor (which is the
   closure of the saddle's unstable manifold), binning thins it to ~one
   center per cell, local geometry gives each box its expanding direction
   (neighbor tangent) and contracting direction (backward-Jacobian
   iteration), and generous float tests nominate candidate covering edges.
   NOTHING the float layer does is believed: instruments/entropy/covering.js
   re-derives every edge as strict interval inequalities, drops what fails,
   proves the survivors pairwise disjoint, and takes an exact BigInt spectral
   bound on the certified graph. The hunt tries several scales and keeps the
   best CERTIFIED bound.

   Output: certs/entropy-henon.json — h-sets, certified edges, and the bound;
   the entropy battery re-verifies the whole certificate from scratch.

   usage: node tools/hunt-entropy.js [a] [b] */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const E = require(path.join(ROOT, 'instruments', 'entropy', 'covering.js'));

const a = Number(process.argv[2] || 1.4), b = Number(process.argv[3] || 0.3);
const map = E.henonSpec(a, b);

/* ---- sample the attractor ------------------------------------------------- */
function orbitPoints(n) {
  let x = 0.1, y = 0.1;
  for (let i = 0; i < 1000; i++) { const [nx, ny] = map.fF(x, y); x = nx; y = ny; }
  const pts = [];
  for (let i = 0; i < n; i++) { const [nx, ny] = map.fF(x, y); x = nx; y = ny; pts.push([x, y]); }
  return pts;
}

/* one representative per delta-cell, plus each cell's local tangent by PCA
   over the orbit points that fell in it and its neighbors */
function buildBoxes(pts, delta, uHalf, sHalf) {
  const key = (p) => Math.round(p[0] / delta) + '|' + Math.round(p[1] / delta);
  const cells = new Map();
  for (const p of pts) {
    const k = key(p);
    if (!cells.has(k)) cells.set(k, []);
    if (cells.get(k).length < 400) cells.get(k).push(p);
  }
  const boxes = [];
  for (const members of cells.values()) {
    /* center = mean, u-dir = principal axis of the cell's points */
    let cx = 0, cy = 0;
    for (const p of members) { cx += p[0]; cy += p[1]; }
    cx /= members.length; cy /= members.length;
    let sxx = 0, sxy = 0, syy = 0;
    for (const p of members) {
      const dx = p[0] - cx, dy = p[1] - cy;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    }
    const tr = sxx + syy, det = sxx * syy - sxy * sxy;
    const lam = tr / 2 + Math.sqrt(Math.max(tr * tr / 4 - det, 0));
    let ux = sxy, uy = lam - sxx;
    if (Math.abs(ux) + Math.abs(uy) < 1e-12) { ux = 1; uy = 0; }
    const un = Math.hypot(ux, uy); ux /= un; uy /= un;
    /* s-dir: iterate the inverse Jacobian (backward dynamics contracts onto
       the stable direction); float proposal only */
    let wx = 0, wy = 1;
    for (let it = 0; it < 3; it++) {
      const nx = wy, ny = wx / b + (2 * a * cx / b) * wy;   /* DF^{-1}·w */
      const nn = Math.hypot(nx, ny); wx = nx / nn; wy = ny / nn;
    }
    boxes.push({ c: [cx, cy], A: [[uHalf * ux, sHalf * wx], [uHalf * uy, sHalf * wy]] });
  }
  return boxes;
}

/* greedy pairwise-disjoint subset (certified test, so the survivors are
   provably disjoint before any covering work starts) */
function disjointSubset(boxes) {
  const keep = [];
  for (const bx of boxes) {
    if (keep.every(k => E.disjoint(k, bx))) keep.push(bx);
  }
  return keep;
}

/* candidate edges: map each box's u-segment through F^k in float; nominate
   every box whose center lies near the image curve */
function candidates(boxes, rho, steps) {
  const out = [];
  for (let i = 0; i < boxes.length; i++) {
    const B = boxes[i];
    const img = [];
    for (let t = -1; t <= 1.0001; t += 0.01) {
      let x = B.c[0] + t * B.A[0][0], y = B.c[1] + t * B.A[1][0];
      for (let s = 0; s < steps; s++) { const n = map.fF(x, y); x = n[0]; y = n[1]; }
      img.push([x, y]);
    }
    for (let j = 0; j < boxes.length; j++) {
      const C = boxes[j];
      if (img.some(p => Math.hypot(p[0] - C.c[0], p[1] - C.c[1]) < rho)) out.push([i, j]);
    }
  }
  return out;
}

/* ---- the hunt: several scales, best certified bound wins ------------------ */
let best = null;
const pts = orbitPoints(400000);
for (const cfg of [
  { delta: 0.05, uHalf: 0.5, sHalf: 0.06, steps: 4 },
  { delta: 0.045, uHalf: 0.5, sHalf: 0.07, steps: 4 },
  { delta: 0.04, uHalf: 0.5, sHalf: 0.07, steps: 4 },
  { delta: 0.04, uHalf: 0.5, sHalf: 0.07, steps: 5 },
  { delta: 0.035, uHalf: 0.5, sHalf: 0.08, steps: 5 },
  { delta: 0.05, uHalf: 0.6, sHalf: 0.06, steps: 4 },
  { delta: 0.045, uHalf: 0.6, sHalf: 0.07, steps: 5 }
]) {
  const t0 = Date.now();
  const raw = buildBoxes(pts, cfg.delta, cfg.uHalf * cfg.delta, cfg.sHalf * cfg.delta);
  const boxes = disjointSubset(raw);
  const cand = candidates(boxes, 1.6 * cfg.delta, cfg.steps);
  const g = E.certifyGraph(map, boxes, cand, { cells: 8000, maxM: 64, steps: cfg.steps });
  const line = 'delta=' + cfg.delta + ' k=' + cfg.steps + ': ' + boxes.length + ' boxes, ' + cand.length + ' candidates';
  if (!g.ok) { console.log(line + ' — graph refused: ' + g.why); continue; }
  console.log(line + ', ' + g.certified.length + ' certified, h >= ' + g.hLB.toFixed(6)
    + ' (m=' + g.powerM + ', core ' + (g.core ? g.core.length : 0) + ' boxes, ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
  if (!best || g.hLB > best.hLB) best = { cfg, boxes, g, hLB: g.hLB };
}

if (!best || best.hLB <= 0) {
  console.error('hunt failed: no configuration certified a positive bound');
  process.exit(1);
}

const cert = {
  what: 'Certified lower bound for the topological entropy of the Hénon map x\' = 1 − a x² + b y, y\' = x '
    + '(parameters are the exact doubles nearest the stated values). The h-sets are pairwise disjoint '
    + 'parallelograms; each edge is a covering relation for F itself, verified as strict interval inequalities '
    + 'with outward rounding; the spectral bound is exact (BigInt row sums). Consumes one external theorem: '
    + 'covering relations imply semi-conjugacy to the subshift (Zgliczynski–Gidea).',
  a, b,
  hLB: best.hLB,
  steps: best.cfg.steps,
  powerM: best.g.powerM,
  boxes: best.boxes,
  edges: best.g.certified,
  config: best.cfg,
  huntedBy: 'tools/hunt-entropy.js'
};
fs.mkdirSync(path.join(ROOT, 'certs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'certs', 'entropy-henon.json'), JSON.stringify(cert, null, 1) + '\n');
console.log('');
console.log('certs/entropy-henon.json: h_top(' + a + ', ' + b + ') >= ' + best.hLB.toFixed(6)
  + '  [' + best.boxes.length + ' h-sets, ' + best.g.certified.length + ' certified covering relations]');
