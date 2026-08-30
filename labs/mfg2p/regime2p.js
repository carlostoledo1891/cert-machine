#!/usr/bin/env node
/* regime2p.js — THE TWO-POPULATION REGIME OBSERVATORY.

   Partitions a rectangle of two-population mean-field-game COUPLING matrices
   into cells and decides each cell, with no gaps between the samples:

     MULTIPLE   two exact solutions for EVERY parameter in the cell, each in its
                own certified ball, the two balls provably disjoint, both
                densities positive throughout. The witness is exact.
     UNIQUE     the cell lies in the Lasry-Lions monotone region [CITED], where
                the coupling matrix satisfies C + C^T ⪰ 0 over the WHOLE cell,
                and our box certificate encloses that unique solution.
     UNDECIDED  everything else, with the refusal reason kept verbatim.

   THE PLANE. Fix c_11 = c_22 = cs and write the cross-coupling as

       c_12 = s + d,        c_21 = s - d,

   so s is the SYMMETRIC part of the cross-interaction and d the ANTISYMMETRIC
   part — d is exactly the attack-defense asymmetry, one population pursuing
   what the other flees. Lasry-Lions monotonicity reads |s| <= cs and does NOT
   mention d at all. That is the prediction this map tests.

   A CELL IN (s, d) IS CERTIFIED THROUGH ITS ENCLOSING (c_12, c_21) RECTANGLE,
   which is a strict superset of the cell's image (a rotated square). Proving a
   statement over a superset implies it on the cell, for MULTIPLE and for the
   monotonicity test alike, so the enclosure is conservative in the direction
   that costs us — never in the direction that flatters us.

   d >= 0 ONLY, and that is not a shortcut: swapping the two populations maps
   (s, d) -> (s, -d) and leaves the system invariant when c_11 = c_22 and
   A_1 = A_2, which is exactly this slice. The map is symmetric in d by a
   proved symmetry of the model, so half of it is the whole of it.

   MIT licensed. Part of cert-machine (labs/mfg2p). */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const M2 = require(path.join(__dirname, 'mfg2p.js'));
const B = require(path.join(__dirname, 'box2p.js'));

const CONFIG = {
  model: 'stationary quadratic two-population MFG on the 1-torus, F_i(m) = sum_j c_ij m_j, V_i(x) = A cos 2 pi x',
  sigma: 0.5,
  cs: 1,                       /* self-coupling c_11 = c_22 (crowd aversion)  */
  A: 1,                        /* well depth, both populations                */
  N: 16,                       /* Fourier modes carried by each population    */
  nu: 1.02,                    /* Banach-algebra weight                       */
  sRange: [0, 15],
  dRange: [0, 1.5],
  /* TWO SCALES, by construction rather than by refinement. Below sFine the map
     is a corridor whose verdict does not change with resolution, so it is swept
     coarsely; at and above sFine every cell starts at the width the calibration
     says actually closes (cell side w gives the coupling box half-width w, and
     0.025 is what certifies on the segregated branch). Starting coarse there
     would spend three refinement levels just getting back down to this size. */
  sFine: 10,
  baseCell: { s: 0.2, d: 0.25 },
  fineCell: { s: 0.025, d: 0.025 },
  maxDepth: 1,
  atlas: { ds: 0.05, dd: 0.05 },
  cellCap: 60000,
  collapseTol: 1e-4,
};

const cellBox = (s0, s1, d0, d1, cfg) => ({
  sigma: [cfg.sigma, cfg.sigma],
  c: {
    c11: [cfg.cs, cfg.cs], c22: [cfg.cs, cfg.cs],
    c12: [s0 + d0, s1 + d1],           /* enclosing rectangle of the cell image */
    c21: [s0 - d1, s1 - d0],
  },
  A: [[cfg.A, cfg.A], [cfg.A, cfg.A]],
  N: cfg.N,
});

/* ---- the warm-start atlas ------------------------------------------------
   SEEDS ONLY. decideCell finds both branches from scratch when it has to, but
   re-running the continuation for every cell costs far more than the proofs do.
   A seed is not evidence: the certificate decides, and a seed that lands on the
   wrong branch simply produces a cell whose candidates fail the separation
   test. battery.js A1 requires the atlas-seeded and self-seeded verdicts to
   agree — the seeding must not be able to change an answer.                  */
function buildAtlas(cfg) {
  const { sigma, cs, A, N } = cfg;
  const n = 2 * (2 * N + 1);
  const ss = [], ds = [];
  for (let s = cfg.sRange[0]; s <= cfg.sRange[1] + 1e-9; s += cfg.atlas.ds) ss.push(Number(s.toFixed(6)));
  for (let d = cfg.dRange[0]; d <= cfg.dRange[1] + 1e-9; d += cfg.atlas.dd) ds.push(Number(d.toFixed(6)));
  const mk = (s, d) => M2.makeProblem({ sigma, C: [cs, s + d, s - d, cs], A: [A, A], N });

  /* the PRIMARY branch: Newton from the trivial state, everywhere */
  const T = ss.map(() => new Array(ds.length).fill(null));
  for (let i = 0; i < ss.length; i++) {
    let x = null;
    for (let j = 0; j < ds.length; j++) {
      const r = M2.solve(mk(ss[i], ds[j]), x ? { x0: x, tol: 1e-15, maxIter: 300 } : { tol: 1e-15, maxIter: 300 });
      if (r.resNorm < 1e-11) { x = r.x; T[i][j] = r.x; } else x = null;
    }
  }

  /* the SEGREGATED branch: enter at the top of the s range on d = 0 with a cold
     asymmetric seed, walk DOWN in s (the branch ends at the pitchfork), then
     from each surviving s walk UP in d (the branch ends at the fold). */
  const H = ss.map(() => new Array(ds.length).fill(null));
  let entry = null;
  for (let i = ss.length - 1; i >= 0 && !entry; i--) {
    for (const amp of [0.3, 0.45, 0.2, 0.6, 0.15]) {
      const x = new Float64Array(n);
      for (let q = 0; q < 2; q++) {
        const o = q * (2 * N + 1), sg = q === 0 ? 1 : -1;
        x[o] = cs; x[o + 1] = -sg * amp * 0.1; x[o + N + 1] = sg * amp;
      }
      const r = M2.solve(mk(ss[i], 0), { x0: x, tol: 1e-15, maxIter: 800 });
      if (r.resNorm < 1e-11 && asym(r.x, N) > 1e-6) { entry = { i, x: r.x }; break; }
    }
  }
  if (entry) {
    let x = entry.x;
    for (let i = entry.i; i >= 0; i--) {                       /* down in s */
      const r = M2.solve(mk(ss[i], 0), { x0: x, tol: 1e-15, maxIter: 400 });
      if (!(r.resNorm < 1e-11) || asym(r.x, N) < 1e-6) break;
      x = r.x; H[i][0] = r.x;
    }
    for (let i = entry.i + 1; i < ss.length; i++) {            /* up in s */
      const prev = H[i - 1][0]; if (!prev) break;
      const r = M2.solve(mk(ss[i], 0), { x0: prev, tol: 1e-15, maxIter: 400 });
      if (!(r.resNorm < 1e-11) || asym(r.x, N) < 1e-6) break;
      H[i][0] = r.x;
    }
    for (let i = 0; i < ss.length; i++) {                      /* up in d */
      let y = H[i][0];
      for (let j = 1; j < ds.length; j++) {
        if (!y) { H[i][j] = null; continue; }
        const r = M2.solve(mk(ss[i], ds[j]), { x0: y, tol: 1e-15, maxIter: 400 });
        if (r.resNorm < 1e-11 && asym(r.x, N) > 1e-6) { y = r.x; H[i][j] = r.x; } else y = null;
      }
    }
  }
  const near = (arr, s, d) => {
    const i = Math.max(0, Math.min(ss.length - 1, Math.round((s - cfg.sRange[0]) / cfg.atlas.ds)));
    const j = Math.max(0, Math.min(ds.length - 1, Math.round((d - cfg.dRange[0]) / cfg.atlas.dd)));
    return arr[i][j];
  };
  const segCount = H.reduce((a, row) => a + row.filter(Boolean).length, 0);
  return { ss, ds, segCount, seedT: (s, d) => near(T, s, d), seedH: (s, d) => near(H, s, d) };
}
function asym(x, N) {
  const st = M2.unpack(x, N);
  let a = 0;
  for (let k = 1; k <= N; k++) a = Math.max(a, Math.abs(st[0].b[k] - st[1].b[k]));
  return a;
}

/* ---- reaching the segregated branch, on purpose ------------------------
   A cold seed CANNOT find the second equilibrium when d != 0, and that is not a
   defect of the seeding — it is the subject of this map. Once the population-
   swap symmetry is broken the pitchfork has unfolded, the primary branch is
   smooth, and nothing local points at the other branch.

   What does work is to go where the symmetry still exists. At d = 0 the second
   branch is born in a pitchfork and a cold asymmetric seed lands on it; from
   there it can be CONTINUED in d to any cell. This function does exactly that,
   and it is deliberately NOT the routine buildAtlas uses: the build-time gate
   re-reaches the branch by its own path, so a bug in the atlas's grid walk
   cannot certify itself.                                                     */
function reachSegregated(s, d, cfg, steps) {
  const { sigma, cs, A, N } = cfg;
  const n = 2 * (2 * N + 1);
  const mk = (ss, dd) => M2.makeProblem({ sigma, C: [cs, ss + dd, ss - dd, cs], A: [A, A], N });
  const coldAt = (ss) => {
    for (const amp of [0.3, 0.45, 0.2, 0.6, 0.15]) {
      const y = new Float64Array(n);
      for (let q = 0; q < 2; q++) {
        const o = q * (2 * N + 1), sg = q === 0 ? 1 : -1;
        y[o] = cs; y[o + 1] = -sg * amp * 0.1; y[o + N + 1] = sg * amp;
      }
      const r = M2.solve(mk(ss, 0), { x0: y, tol: 1e-15, maxIter: 800 });
      if (r.resNorm < 1e-11 && asym(r.x, N) > 1e-3) return r.x;
    }
    return null;
  };
  /* A cold seed only bites in a window just past the pitchfork; far above it the
     asymmetric guess is no longer in any basin. So enter wherever the cold seed
     DOES work — scanning down from the target — and then continue back up in s
     before turning into d. This is the same physics the atlas uses and a
     deliberately different implementation of it. */
  let entryS = null, x = null;
  for (let ss = s; ss > 0 && !x; ss -= 0.25) { x = coldAt(Number(ss.toFixed(6))); if (x) entryS = Number(ss.toFixed(6)); }
  if (!x) return null;
  const walk = (from, to, x0, dd) => {
    let y = x0;
    const K = Math.max(4, Math.ceil(Math.abs(to - from) / 0.05));
    for (let i = 1; i <= K; i++) {
      const t = from + (to - from) * i / K;
      const r = M2.solve(mk(dd === undefined ? t : t, dd === undefined ? 0 : dd), { x0: y, tol: 1e-15, maxIter: 400 });
      if (!(r.resNorm < 1e-11) || asym(r.x, N) < 1e-6) return null;
      y = r.x;
    }
    return y;
  };
  if (entryS !== s) { x = walk(entryS, s, x, undefined); if (!x) return null; }
  if (d > 0) {
    const K = steps || Math.max(8, Math.ceil(d / 0.02));
    for (let i = 1; i <= K; i++) {
      const r = M2.solve(mk(s, d * i / K), { x0: x, tol: 1e-15, maxIter: 400 });
      if (!(r.resNorm < 1e-11)) return null;
      x = r.x;
    }
  }
  return x;
}

/* ---- the sweep ----------------------------------------------------------
   The cell decision lives in box2p.js — ONE definition. This file only walks
   the plane, hands in seeds, and refines what refuses.                       */
function sweep(cfg, log) {
  const atlas = buildAtlas(cfg);
  log('atlas: ' + atlas.ss.length + ' x ' + atlas.ds.length + ' seeds, segregated branch present at ' + atlas.segCount + ' nodes');
  const cells = [];
  const counts = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
  let done = 0;
  const t0 = Date.now();

  const doCell = (s0, s1, d0, d1, depth) => {
    if (cells.length >= cfg.cellCap) return;
    const box = cellBox(s0, s1, d0, d1, cfg);
    const sm = 0.5 * (s0 + s1), dm = 0.5 * (d0 + d1);
    const r = B.decideCell(box, {
      nu: cfg.nu, collapseTol: cfg.collapseTol,
      seedPrimary: atlas.seedT(sm, dm), seedSeg: atlas.seedH(sm, dm),
    });
    done++;
    if (done % 200 === 0) {
      const el = (Date.now() - t0) / 1000;
      log('  ' + done + ' cells, ' + el.toFixed(0) + 's, ' + JSON.stringify(counts));
    }
    if (r.verdict === 'UNDECIDED' && r.refinable && depth < cfg.maxDepth) {
      const ms = 0.5 * (s0 + s1), md = 0.5 * (d0 + d1);
      doCell(s0, ms, d0, md, depth + 1); doCell(ms, s1, d0, md, depth + 1);
      doCell(s0, ms, md, d1, depth + 1); doCell(ms, s1, md, d1, depth + 1);
      return;
    }
    counts[r.verdict]++;
    const rec = { s: [s0, s1], d: [d0, d1], depth, verdict: r.verdict };
    if (r.verdict === 'MULTIPLE') {
      rec.sep = r.sep; rec.need = r.need; rec.ratio = r.ratio; rec.radii = r.radii;
      rec.kappas = r.kappas; rec.minM = r.minM;
    } else if (r.verdict === 'UNIQUE') {
      rec.r = r.r; rec.kappa = r.kappa; rec.minM = r.minM; rec.detLo = r.lasryLions.detLo;
    } else {
      rec.reason = r.reason; rec.enclosed = r.enclosed || 0; rec.refinable = !!r.refinable;
    }
    cells.push(rec);
  };

  /* each band tiles its own rectangle exactly, so the two together tile the
     whole domain — areaCheck() re-derives that and the report refuses without it */
  const bands = [
    { s0: cfg.sRange[0], s1: cfg.sFine, cell: cfg.baseCell },
    { s0: cfg.sFine, s1: cfg.sRange[1], cell: cfg.fineCell },
  ];
  for (const bnd of bands) {
    for (let s = bnd.s0; s < bnd.s1 - 1e-9; s += bnd.cell.s)
      for (let d = cfg.dRange[0]; d < cfg.dRange[1] - 1e-9; d += bnd.cell.d)
        doCell(Number(s.toFixed(6)), Number(Math.min(bnd.s1, s + bnd.cell.s).toFixed(6)),
               Number(d.toFixed(6)), Number(Math.min(cfg.dRange[1], d + bnd.cell.d).toFixed(6)), 0);
  }
  return { cells, counts, atlas: { segCount: atlas.segCount } };
}

/* the area identity: the decided areas must sum to the swept rectangle, or the
   partition has a hole and a picture of it would be a lie. */
function areaCheck(cells, cfg) {
  let tot = 0; const by = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
  for (const c of cells) {
    const a = (c.s[1] - c.s[0]) * (c.d[1] - c.d[0]);
    tot += a; by[c.verdict] += a;
  }
  const want = (cfg.sRange[1] - cfg.sRange[0]) * (cfg.dRange[1] - cfg.dRange[0]);
  return { total: tot, want, ok: Math.abs(tot - want) < 1e-6 * want, by };
}

if (require.main === module) {
  const cfg = CONFIG;
  const log = m => { process.stdout.write(m + '\n'); };
  log('two-population regime sweep: sigma=' + cfg.sigma + ' cs=' + cfg.cs + ' A=' + cfg.A + ' N=' + cfg.N + ' nu=' + cfg.nu);
  const { cells, counts, atlas } = sweep(cfg, log);
  const area = areaCheck(cells, cfg);
  const out = {
    what: 'two-population MFG regime map — each cell decided UNIFORMLY over its own rectangle of coupling matrices',
    rerun: 'node labs/mfg2p/regime2p.js',
    config: cfg, counts, area, atlas, cells,
    generatedBy: 'labs/mfg2p/regime2p.js',
  };
  const p = path.join(ROOT, 'certs', 'mfg2p-regime-map.json');
  fs.writeFileSync(p, JSON.stringify(out));
  log('counts ' + JSON.stringify(counts));
  log('area identity: ' + (area.ok ? 'HOLDS' : 'FAILS') + ' (' + area.total.toFixed(6) + ' vs ' + area.want.toFixed(6) + ')');
  log('wrote ' + p + '  sha256 ' + crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 16));
}

module.exports = { CONFIG, cellBox, buildAtlas, sweep, areaCheck, asym, reachSegregated };
