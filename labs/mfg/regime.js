#!/usr/bin/env node
/* regime.js — THE REGIME OBSERVATORY.

   Partitions a rectangle of mean-field-game parameters into cells and decides
   each cell, with no gaps between the samples:

     MULTIPLE   two exact solutions for EVERY parameter in the cell, each in its
                own certified ball, the two balls provably disjoint. The witness
                is exact: two predictors, two radii, a separation lower bound.
     UNIQUE     the cell lies in the monotone half-plane c >= 0, where
                Lasry-Lions gives GLOBAL uniqueness [cited, not ours], and our
                box certificate encloses that unique solution over the cell.
     UNDECIDED  everything else, with the refusal reason kept verbatim.

   The model is the stationary quadratic MFG on the 1-torus (see
   legacy/core/mfg/mfg1d.js):

       -sigma u'' + 1/2 (u')^2 + rho = c m + A cos 2 pi x
       -sigma m'' - (m u')' = 0,   int m = 1,  int u = 0,  m > 0

   with c the coupling (c > 0 crowd-aversion, c < 0 herding) and A the depth of
   the potential well. sigma is held at 1/2; the plane swept is (c, A).

   WHY A MAP AND NOT A TABLE. mfg-cap proves multiplicity at ONE parameter
   triple. A grid of point results proves nothing between its points, so it
   cannot be a partition. Every cell here is decided UNIFORMLY over its own
   rectangle by labs/mfg/box.js, so the union of the MULTIPLE cells is a set of
   positive measure on which uniqueness provably fails, and the UNDECIDED cells
   are the honest remainder -- not a sampling artefact.

   ADAPTIVE. A cell that refuses is quartered and retried, to a bounded depth.
   Refinement is only attempted where it can help (a validation refused, or two
   distinct solutions were found but their balls were not yet disjoint), so the
   refined cells cluster exactly on the two curves the theory predicts: the
   bifurcation line c* = -sigma^2 (2 pi)^2 of the constant state, and the fold
   where the herding branch and the aligned branch collide.

   usage: node labs/mfg/regime.js [--fast]        writes certs/mfg-regime-map.json
   MIT licensed. Part of cert-machine (labs/mfg). */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require(path.join(ROOT, 'legacy', 'core', 'mfg', 'mfg1d.js'));
const B = require(path.join(__dirname, 'box.js'));

const CONFIG = {
  model: 'stationary quadratic MFG on the 1-torus, F(m) = c m, V(x) = A cos 2 pi x',
  sigma: 0.5,
  N: 16,                       /* Fourier modes carried by the candidate      */
  nu: 1.02,                    /* Banach-algebra weight                       */
  cRange: [-18, 2],
  aRange: [0, 1.2],
  baseCell: { c: 0.125, A: 0.05 },   /* measured: the herding branch certifies at ~0.06 in c */
  maxDepth: 2,
  atlas: { dc: 0.125, dA: 0.05 },   /* warm-start grid — SEEDS ONLY, never a claim */
  cellCap: 40000,
  collapseTol: 0.05,           /* below this nu-separation the two solves are
                                  the same branch, not two branches           */
};
const cStarAt = s => -(s * s) * (2 * Math.PI) * (2 * Math.PI);

/* ---- the warm-start atlas ----------------------------------------------
   SEEDS ONLY. box.js's decideCell can find both branches from scratch (and
   does, in the browser), but re-running the continuation from the pitchfork
   for every one of tens of thousands of cells costs more than the proof does.
   So the sweep precomputes a float grid of branch candidates and hands them in
   as opts.seedT / opts.seedH.

   A seed is not evidence. Nothing here is trusted: the certificate decides, and
   an atlas seed that landed on the wrong branch simply produces a cell whose
   two candidates fail the separation test. battery.js A1 checks that the
   atlas-seeded verdict and the self-seeded verdict agree on sample cells --
   the seeding must not be able to change an answer.                          */
function buildAtlas(cfg) {
  const { sigma, N } = cfg;
  const mk = (c, A) => M.makeProblem({ sigma, c, A, N });
  const cs = [], As = [];
  for (let c = cfg.cRange[0]; c <= cfg.cRange[1] + 1e-9; c += cfg.atlas.dc) cs.push(Number(c.toFixed(6)));
  for (let A = cfg.aRange[0]; A <= cfg.aRange[1] + 1e-9; A += cfg.atlas.dA) As.push(Number(A.toFixed(6)));
  const n = 2 * N + 1;
  const T = [], H = [];
  const cStar = cStarAt(sigma);

  for (let i = 0; i < cs.length; i++) {                 /* the aligned branch */
    T.push([]);
    let x = new Float64Array(n); x[0] = cs[i];
    for (let j = 0; j < As.length; j++) {
      const r = M.solve(mk(cs[i], As[j]), { x0: j === 0 ? x : (T[i][j - 1] || x), maxIter: 300 });
      T[i].push(r.resNorm < 1e-11 ? r.x : null);
    }
  }
  const cEnter = cStar - 0.25;                          /* the herding branch */
  const seed = new Float64Array(n);
  seed[0] = cEnter; seed[1] = -sigma * 0.35; seed[N + 1] = 0.35;
  const st = M.solve(mk(cEnter, 0), { x0: seed, maxIter: 400 });
  const H0 = new Array(cs.length).fill(null);
  if (st.resNorm < 1e-11) {
    let idx = cs.length - 1;
    while (idx > 0 && cs[idx] > cEnter) idx--;
    let x = st.x;
    for (let i = idx; i >= 0; i--) {
      const r = M.solve(mk(cs[i], 0), { x0: x, maxIter: 300 });
      if (!(r.resNorm < 1e-11)) break;
      x = r.x; H0[i] = r.x;
    }
  }
  for (let i = 0; i < cs.length; i++) {
    H.push([]);
    let x = H0[i];
    for (let j = 0; j < As.length; j++) {
      if (!x) { H[i].push(null); continue; }
      const r = M.solve(mk(cs[i], As[j]), { x0: x, maxIter: 300 });
      if (r.resNorm < 1e-11) { x = r.x; H[i].push(r.x); } else { x = null; H[i].push(null); }
    }
  }
  const near = (arr, c, A) => {
    const i = Math.max(0, Math.min(cs.length - 1, Math.round((c - cfg.cRange[0]) / cfg.atlas.dc)));
    const j = Math.max(0, Math.min(As.length - 1, Math.round((A - cfg.aRange[0]) / cfg.atlas.dA)));
    return arr[i][j];
  };
  return { cs, As, seedT: (c, A) => near(T, c, A), seedH: (c, A) => near(H, c, A) };
}

/* ---- the sweep --------------------------------------------------------- */
/* The cell decision itself lives in box.js — ONE definition, shared with the
   in-browser paste box. This file only walks the plane, hands in seeds, and
   refines what refuses. */
/* ---- the sweep --------------------------------------------------------- */
function sweep(cfg, log) {
  log = log || (() => {});
  const atlas = buildAtlas(cfg);
  const cells = [];
  const queue = [];
  const nc = Math.round((cfg.cRange[1] - cfg.cRange[0]) / cfg.baseCell.c);
  const na = Math.round((cfg.aRange[1] - cfg.aRange[0]) / cfg.baseCell.A);
  for (let i = 0; i < nc; i++) for (let j = 0; j < na; j++) {
    queue.push({ c0: cfg.cRange[0] + i * cfg.baseCell.c, c1: cfg.cRange[0] + (i + 1) * cfg.baseCell.c,
                 a0: cfg.aRange[0] + j * cfg.baseCell.A, a1: cfg.aRange[0] + (j + 1) * cfg.baseCell.A, depth: 0 });
  }
  let done = 0;
  while (queue.length) {
    const cell = queue.shift();
    if (cells.length >= cfg.cellCap) { cells.push(Object.assign({}, cell, { verdict: 'UNDECIDED', why: 'cell cap reached before this cell was decided', enclosures: 0, capped: true })); continue; }
    const cm = 0.5 * (cell.c0 + cell.c1), am = 0.5 * (cell.a0 + cell.a1);
    const d = B.decideCell({ sigma: [cfg.sigma, cfg.sigma], c: [cell.c0, cell.c1],
                             A: [cell.a0, cell.a1], N: cfg.N },
                           { nu: cfg.nu, collapseTol: cfg.collapseTol,
                             seedT: atlas.seedT(cm, am), seedH: atlas.seedH(cm, am) });
    d.depth = cell.depth;
    if (d.verdict === 'UNDECIDED' && d.refinable && cell.depth < cfg.maxDepth) {
      const cm = 0.5 * (cell.c0 + cell.c1), am = 0.5 * (cell.a0 + cell.a1);
      queue.push({ c0: cell.c0, c1: cm, a0: cell.a0, a1: am, depth: cell.depth + 1 });
      queue.push({ c0: cm, c1: cell.c1, a0: cell.a0, a1: am, depth: cell.depth + 1 });
      queue.push({ c0: cell.c0, c1: cm, a0: am, a1: cell.a1, depth: cell.depth + 1 });
      queue.push({ c0: cm, c1: cell.c1, a0: am, a1: cell.a1, depth: cell.depth + 1 });
      continue;
    }
    delete d.refinable;
    cells.push(d);
    if (++done % 200 === 0) log('  ' + done + ' cells decided, ' + queue.length + ' queued');
  }
  return { cells };
}

/* area accounting — the partition is exact, so the areas must add up */
function tally(cells, cfg) {
  const t = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
  const area = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
  let enclosedOnly = 0, enclosedArea = 0;
  for (const c of cells) {
    const a = (c.c1 - c.c0) * (c.a1 - c.a0);
    t[c.verdict]++; area[c.verdict] += a;
    if (c.verdict === 'UNDECIDED' && c.enclosures >= 1) { enclosedOnly++; enclosedArea += a; }
  }
  const total = (cfg.cRange[1] - cfg.cRange[0]) * (cfg.aRange[1] - cfg.aRange[0]);
  return { counts: t, area, total, enclosedOnly, enclosedArea,
           covered: area.MULTIPLE + area.UNIQUE + area.UNDECIDED };
}

/* ---- the record ---------------------------------------------------------
   Compact on purpose. Pretty-printing ~20,000 cells costs 13 MB of leading
   spaces, and a record that large is a record a host may silently drop. So:
   one cell per line (still greppable, still diffable), and the UNDECIDED
   reasons interned into a table at the top instead of repeated tens of
   thousands of times. Nothing is rounded — every witness number is written at
   full round-trip precision, because the witness is the point. */
function serialize(rec) {
  const reasons = [], index = new Map();
  const cells = rec.cells.map(c => {
    const o = { c0: c.c0, c1: c.c1, a0: c.a0, a1: c.a1, depth: c.depth || 0,
                verdict: c.verdict, enclosures: c.enclosures };
    if (c.why !== undefined) {
      if (!index.has(c.why)) { index.set(c.why, reasons.length); reasons.push(c.why); }
      o.why = index.get(c.why);
    }
    if (c.witness) o.witness = c.witness;
    if (c.aligned) o.aligned = c.aligned;
    if (c.capped) o.capped = true;
    return o;
  });
  const head = Object.assign({}, rec);
  delete head.cells;
  head.reasons = reasons;
  head.reasonsNote = 'cell.why is an index into reasons[]';
  const parts = Object.keys(head).map(k => JSON.stringify(k) + ':' + JSON.stringify(head[k]));
  return '{' + parts.join(',\n') + ',\n"cells":[\n'
    + cells.map(c => JSON.stringify(c)).join(',\n') + '\n]}\n';
}

if (require.main === module) {
  const fast = process.argv.includes('--fast');
  const cfg = JSON.parse(JSON.stringify(CONFIG));
  /* --fast is a real sweep of a small window, not a coarser one: the cell size
     is what decides whether anything certifies, so lowering it would only prove
     that a coarse map is empty. */
  if (fast) { cfg.cRange = [-13, 1]; cfg.aRange = [0, 0.3]; }
  const t0 = Date.now();
  console.log('MFG REGIME OBSERVATORY — sweeping ' + JSON.stringify(cfg.cRange) + ' x ' + JSON.stringify(cfg.aRange) + ' at sigma = ' + cfg.sigma);
  const { cells } = sweep(cfg, console.log);
  const tl = tally(cells, cfg);
  const rec = {
    generated: new Date().toISOString().slice(0, 10),
    config: cfg,
    cStar: cStarAt(cfg.sigma),
    statement: 'Each cell is decided UNIFORMLY over its own rectangle by labs/mfg/box.js: a MULTIPLE cell '
      + 'carries two disjoint certified balls valid for every parameter in the cell, so at least two exact '
      + 'solutions exist there; a UNIQUE cell lies in the monotone half-plane where Lasry-Lions gives global '
      + 'uniqueness (cited) and carries our enclosure of that solution; an UNDECIDED cell states its reason.',
    tally: tl,
    seconds: Math.round((Date.now() - t0) / 1000),
    cells
  };
  const body = serialize(rec);
  const outp = path.join(ROOT, 'certs', 'mfg-regime-map.json');
  fs.writeFileSync(outp, body);
  console.log('\ncells        ' + cells.length);
  console.log('MULTIPLE     ' + tl.counts.MULTIPLE + '   area ' + tl.area.MULTIPLE.toFixed(4));
  console.log('UNIQUE       ' + tl.counts.UNIQUE + '   area ' + tl.area.UNIQUE.toFixed(4));
  console.log('UNDECIDED    ' + tl.counts.UNDECIDED + '   area ' + tl.area.UNDECIDED.toFixed(4) + '   (of which ' + tl.enclosedOnly + ' carry >= 1 enclosure)');
  console.log('area check   covered ' + tl.covered.toFixed(6) + ' vs domain ' + tl.total.toFixed(6));
  console.log('wrote ' + path.relative(ROOT, outp) + '  (' + (body.length / 1024).toFixed(0) + ' KB, ' + rec.seconds + ' s)');
  console.log('sha256 ' + crypto.createHash('sha256').update(body).digest('hex').slice(0, 16) + '...');
}

module.exports = { CONFIG, cStarAt, buildAtlas, sweep, tally, decideCell: B.decideCell };
