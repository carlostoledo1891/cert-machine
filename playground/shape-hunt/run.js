#!/usr/bin/env node
/* run.js — the hunt, over every set and model already on disk, plus the two
   synthetic sets that decide whether the hunter works at all.
   node playground/shape-hunt/run.js

   No model calls. Everything here is arithmetic on answers already given.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const H = require('./hunt.js');
const SOL = require('./solids.js');
const R = require('../rational.js');
const HERE = __dirname;

const G = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'neural-geometry', 'out', 'geometry.json'), 'utf8'));
/* 50 shuffles per case, and rings only to k = 5. The k = 6 search is 924
   subsets times 60 cyclic orders, which is 55,000 tests per hunt and 200 of
   those per case — an afternoon for a number no more informative than the
   pentagon. A null you cannot afford to run is a null you will end up skipping. */
const NULLS = 50;
const RING_K = [4, 5];

/* ---- the two sets that are not answers ----------------------------------- */
/* A PERFECT REGULAR 12-GON. Its distances are exact chords, rounded to the same
   0–100 integer grid the models answer on, so the hunter sees the same kind of
   data it sees everywhere else. If it cannot find the ring in this, it finds
   nothing anywhere. */
function regularNgon(n, scale = 100) {
  const D = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const lag = Math.min(Math.abs(i - j), n - Math.abs(i - j));
    D[i][j] = Math.round(scale * Math.sin((Math.PI * lag) / n) / Math.sin(Math.PI / 2));
  }
  return D;
}
/* PURE NOISE on the same grid. Whatever the hunter reports here is what it
   reports about nothing, and every real finding has to beat it. */
function noiseD(n, seed = 7) {
  const rnd = H.seeded(seed);
  const D = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) D[i][j] = D[j][i] = Math.round(20 + 70 * rnd());
  return D;
}

/* ---- one hunt over one matrix ------------------------------------------- */
function hunt(D) {
  const n = D.length;
  const best = (subs, f) => subs.reduce((a, s) => { const v = f(D, s); return v < a.v ? { v, s } : a; }, { v: Infinity, s: null });

  const tri = H.comb(n, 3), quad = H.comb(n, 4);
  /* the violations, counted before anything is minimised: how often these
     answers are outside every Euclidean arrangement at all */
  let ptolViol = 0, ptolWorst = 0;
  for (const q of quad) { const v = H.ptolemySigned(D, q); if (v < -EPS) { ptolViol++; ptolWorst = Math.min(ptolWorst, v); } }
  let triViol = 0;
  for (const t of tri) if (H.collinearSigned(D, t) < 0) triViol++;
  const out = {
    n,
    tests: 0,
    collinear: best(tri, H.collinearF),
    equilateral: best(tri, H.equilateralF),
    concyclic: best(quad, H.ptolemyF),
    rings: {},
    ring_whole: H.ringDefectF(D, Array.from({ length: n }, (_, i) => i)),
    ptolemy: { violations: ptolViol, of: quad.length, worst: ptolWorst, eps: EPS },
    triangle: { violations: triViol, of: tri.length },
  };
  out.tests += tri.length * 2 + quad.length;

  for (const k of RING_K) {
    if (k > n) continue;
    let bv = Infinity, bs = null;
    for (const sub of H.comb(n, k)) for (const ord of H.cyclicOrders(sub)) {
      out.tests++;
      const v = H.ringDefectF(D, ord);
      if (v < bv) { bv = v; bs = ord; }
    }
    out.rings[k] = { v: bv, s: bs };
  }
  return out;
}

/* WHICH KNOWN SHAPE IS THIS NEAREST? Compared by distance SPECTRUM, which does
   not care how the vertices are labelled — so an icosahedron can be tested
   against twelve items without trying 479 million labellings. The catalogue
   holds flat shapes and degenerate ones beside the solids, because scoring a
   genuine ring only against polyhedra would report it as a poor icosahedron
   when the true answer is that it is an excellent 12-gon. */
function nearestShape(D, rnd) {
  const cat = SOL.catalogue(D.length);
  if (!cat.length) return null;
  const spec = SOL.spectrumOfD(D);
  const scored = cat.map((c) => ({ name: c.name, kind: c.kind, d: SOL.spectrumDistance(spec, c.spectrum) }))
    .sort((a, b) => a.d - b.d);
  /* THE NULL HAD TO BE THROWN AWAY AND REBUILT. The first one shuffled the
     distances into new positions, which is the right null everywhere else on
     this page and is worthless here: a spectrum IS the multiset of distances,
     and shuffling their positions leaves it identical. It scored the perfect
     12-gon at 0.0020 against a null of 0.0020 — the same number twice, a test
     that could never pass or fail.

     What the question actually needs is other CONFIGURATIONS, not other
     labellings: how near does a random cloud of n points get to the closest
     member of this catalogue? Uniform in a ball, in two and three dimensions,
     because that is where the catalogue lives. */
  const nulls = [];
  for (let t = 0; t < 400; t++) {
    const dim = t % 2 ? 2 : 3;
    const pts = [];
    while (pts.length < D.length) {
      const q = [rnd() * 2 - 1, rnd() * 2 - 1, dim === 3 ? rnd() * 2 - 1 : 0];
      if (q[0] * q[0] + q[1] * q[1] + q[2] * q[2] <= 1) pts.push(q);
    }
    const sp = SOL.spectrum(pts);
    nulls.push(Math.min(...cat.map((c) => SOL.spectrumDistance(sp, c.spectrum))));
  }
  nulls.sort((a, b) => a - b);
  return { best: scored[0], top: scored.slice(0, 3), all: scored, nullP05: nulls[Math.floor(0.05 * nulls.length)], trials: nulls.length };
}

/* the symmetry test: the 2n dihedral candidates against random permutations */
function symmetry(D, rnd) {
  const n = D.length;
  const cands = H.dihedral(n).map((c) => ({ ...c, defect: H.permDefect(D, c.perm) }))
    .sort((a, b) => a.defect - b.defect);
  const k = cands.length;                       /* 2n − 1 candidates are tried */

  /* THE OLD NULL WAS THE WRONG SHAPE and every case cleared it. It compared the
     BEST of 2n−1 dihedral permutations against the 5th percentile of single
     random draws — a minimum against a typical value. The matched null takes
     the same number of random permutations, takes ITS minimum, and repeats: the
     question is whether the dihedral group beats any 2n−1 permutations at all,
     which is a far harder thing to clear. Both are reported, because the change
     moved the answer and the page has to show that it did. */
  const single = [];
  for (let t = 0; t < 2000; t++) single.push(H.permDefect(D, H.randPerm(n, rnd)));
  single.sort((a, b) => a - b);

  const bestOf = [];
  for (let t = 0; t < 400; t++) {
    let m = Infinity;
    for (let i = 0; i < k; i++) m = Math.min(m, H.permDefect(D, H.randPerm(n, rnd)));
    bestOf.push(m);
  }
  bestOf.sort((a, b) => a - b);

  return { best: cands[0], top: cands.slice(0, 3), candidates: k,
           nullP05: single[Math.floor(0.05 * single.length)],
           nullMatched: bestOf[Math.floor(0.05 * bestOf.length)],
           nullMatchedMedian: bestOf[Math.floor(0.5 * bestOf.length)],
           trials: single.length, matchedTrials: bestOf.length };
}

/* the null for a best-of-many defect: same distances, no geometry */
function nullHunt(D, rnd) {
  const acc = { collinear: [], equilateral: [], concyclic: [], rings: { 4: [], 5: [] } };
  for (let t = 0; t < NULLS; t++) {
    const h = hunt(H.shuffledD(D, rnd));
    acc.collinear.push(h.collinear.v);
    acc.equilateral.push(h.equilateral.v);
    acc.concyclic.push(h.concyclic.v);
    for (const k of RING_K) if (h.rings[k]) acc.rings[k].push(h.rings[k].v);
  }
  const p05 = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(0.05 * s.length)]; };
  return {
    collinear: p05(acc.collinear), equilateral: p05(acc.equilateral), concyclic: p05(acc.concyclic),
    rings: Object.fromEntries(RING_K.filter((k) => acc.rings[k].length).map((k) => [k, p05(acc.rings[k])])),
    trials: NULLS,
  };
}

/* ---- the exact re-decision of whatever the screen proposed --------------- */
const x = (v) => (v === null ? null : R.toNumber(v));
function certify(D, h) {
  const Dq = H.Q(D);
  const out = {
    collinear: Math.abs(x(H.collinearX(Dq, h.collinear.s))),
    equilateral: x(H.equilateralX(Dq, h.equilateral.s)),
    concyclic: Math.abs(x(H.ptolemyX(Dq, h.concyclic.s))),
    rings: {},
  };
  for (const k of Object.keys(h.rings)) out.rings[k] = x(H.ringX(Dq, h.rings[k].s));
  return out;
}

/* classical MDS, so the two synthetic cases can be drawn beside the real ones.
   The perfect 12-gon and the noise have no model behind them and therefore no
   coordinates in the geometry record; without a picture they would be a claim
   the page asks you to take on trust. */
function coords(D) {
  const n = D.length;
  const S = D.map((r) => r.map((d) => d * d));
  const rows = S.map((r) => r.reduce((a, x) => a + x, 0) / n);
  const grand = rows.reduce((a, x) => a + x, 0) / n;
  const G2 = S.map((r, i) => r.map((v, j) => -0.5 * (v - rows[i] - rows[j] + grand)));
  const A = G2.map((r) => r.slice());
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-20) break;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][j]) < 1e-16) continue;
      const th = 0.5 * Math.atan2(2 * A[i][j], A[i][i] - A[j][j]), c = Math.cos(th), sn = Math.sin(th);
      for (let k = 0; k < n; k++) { const a1 = A[i][k], a2 = A[j][k]; A[i][k] = c * a1 + sn * a2; A[j][k] = -sn * a1 + c * a2; }
      for (let k = 0; k < n; k++) {
        const b1 = A[k][i], b2 = A[k][j]; A[k][i] = c * b1 + sn * b2; A[k][j] = -sn * b1 + c * b2;
        const v1 = V[k][i], v2 = V[k][j]; V[k][i] = c * v1 + sn * v2; V[k][j] = -sn * v1 + c * v2;
      }
    }
  }
  const ord = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  const e = ord.map((i) => Math.sqrt(Math.max(A[i][i], 0)));
  return Array.from({ length: n }, (_, i) => [e[0] * V[i][ord[0]], e[1] * V[i][ord[1]]]);
}

/* THE INSTRUMENT HAS TO BE CALIBRATED BEFORE IT COUNTS ANYTHING.

   Ptolemy's inequality holds for any four points in any Euclidean space, so a
   negative value means those four answers are outside every Euclidean
   arrangement. That is a real and strong finding — and the first version of it
   was nonsense, because on a PERFECT regular 12-gon every quadruple sits exactly
   at equality, and the answers live on an integer grid. Rounding then pushes
   half of them a hair below zero: 240 of 495 "violations" in a shape that is
   Euclidean by construction.

   So the threshold is measured, not chosen. The worst violation the perfect
   12-gon produces is entirely rounding, and nothing shallower than that is
   counted anywhere else. A gate whose floor is the noise of its own grid is the
   only honest kind. */
const EPS = (() => {
  const D = regularNgon(12);
  let worst = 0;
  for (const q of H.comb(12, 4)) worst = Math.min(worst, H.ptolemySigned(D, q));
  return Math.abs(worst);
})();
console.log(`calibration: a perfect 12-gon on this integer grid produces Ptolemy dips to ${(-EPS).toFixed(5)} from rounding alone — that is the floor, and nothing above it is counted as a violation.`);

const rows = [];
const cases = [];
for (const s of G.sets) for (const m of s.models) {
  if (m.incomplete) continue;
  cases.push({ set: s.id, shape: s.shape, model: m.id, items: s.items, D: m.D, pts: m.pts, synthetic: false });
}
cases.push({ set: 'a perfect 12-gon', shape: 'synthetic', model: 'not a model', synthetic: true,
  items: Array.from({ length: 12 }, (_, i) => 'p' + i), D: regularNgon(12), pts: 'mds' });
cases.push({ set: 'pure noise', shape: 'synthetic', model: 'not a model', synthetic: true,
  items: Array.from({ length: 12 }, (_, i) => 'n' + i), D: noiseD(12), pts: 'mds' });

for (const c of cases) {
  const rnd = H.seeded(20260904);
  const h = hunt(c.D);
  const nl = nullHunt(c.D, rnd);
  const sym = symmetry(c.D, rnd);
  const near = nearestShape(c.D, rnd);
  const ex = certify(c.D, h);
  rows.push({
    set: c.set, shape: c.shape, model: c.model, synthetic: c.synthetic, items: c.items,
    n: h.n, tests: h.tests, pts: c.pts === 'mds' ? coords(c.D) : c.pts, D: c.D,
    found: {
      collinear: { sub: h.collinear.s, screen: h.collinear.v, exact: ex.collinear, null: nl.collinear, beats: ex.collinear < nl.collinear },
      equilateral: { sub: h.equilateral.s, screen: h.equilateral.v, exact: ex.equilateral, null: nl.equilateral, beats: ex.equilateral < nl.equilateral },
      concyclic: { sub: h.concyclic.s, screen: h.concyclic.v, exact: ex.concyclic, null: nl.concyclic, beats: ex.concyclic < nl.concyclic },
      rings: Object.fromEntries(Object.keys(h.rings).map((k) => [k, {
        sub: h.rings[k].s, screen: h.rings[k].v, exact: ex.rings[k], null: nl.rings[k], beats: ex.rings[k] < nl.rings[k],
      }])),
    },
    ringWhole: h.ring_whole,
    ptolemy: h.ptolemy, triangle: h.triangle,
    symmetry: sym, nearest: near,
    nullTrials: nl.trials,
  });
  process.stdout.write(`\r  hunted ${rows.length}/${cases.length}  ${c.set} · ${c.model.replace('claude-','')}          `);
}
process.stdout.write('\n');

const totalTests = rows.reduce((a, r) => a + r.tests * (1 + r.nullTrials), 0);
const out = { meta: { date: new Date().toISOString().slice(0, 10), cases: rows.length, nulls: NULLS, totalTests, eps: EPS }, rows };
fs.writeFileSync(path.join(HERE, 'out', 'shapes.json'), JSON.stringify(out) + '\n');

const f = (v) => (v === null || v === undefined ? '  —  ' : v.toFixed(4));
console.log(`\n${'set'.padEnd(16)} ${'model'.padEnd(10)} ${'concyclic'.padStart(9)} ${'vs null'.padStart(8)} ${'best ring'.padStart(9)} ${'vs null'.padStart(8)} ${'symmetry'.padStart(9)} ${'vs null'.padStart(8)}  ptolemy viol`);
for (const r of rows) {
  const rk = Object.keys(r.found.rings).map((k) => [k, r.found.rings[k]]).sort((a, b) => a[1].exact - b[1].exact)[0];
  console.log(`${r.set.padEnd(16)} ${r.model.replace('claude-', '').padEnd(10)} `
    + `${f(r.found.concyclic.exact)} ${f(r.found.concyclic.null).padStart(8)} `
    + `${(rk ? f(rk[1].exact) : '—').padStart(9)} ${(rk ? f(rk[1].null) : '—').padStart(8)} `
    + `${f(r.symmetry.best.defect).padStart(9)} ${f(r.symmetry.nullP05).padStart(8)}  `
    + `${(r.ptolemy.violations + '/' + r.ptolemy.of).padStart(9)}  `
    + `${(r.nearest ? r.nearest.best.name + ' ' + r.nearest.best.d.toFixed(3) + (r.nearest.best.d < r.nearest.nullP05 ? ' ✓' : ' ✗') : '').padEnd(30)}`
    + `${r.symmetry.best.defect < r.symmetry.nullMatched ? 'SYM ' + r.symmetry.best.kind : ''}`);
}
console.log(`\n${totalTests.toLocaleString('en-US')} shape tests · ${NULLS} shuffles per case · out/shapes.json`);
