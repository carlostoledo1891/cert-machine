/* stage-pointwise.js — solid-mean pointwise machinery + the CORE-ZONE
   certificate. instruments/hotspots · cert-machine (ember port, 2026-09-02)

   Port of cert-pointwise.js (pinned in frontier-ref/) with three
   tightenings found in the port review:
   T1  I₀ = 5/48 is DERIVED IN EXACT RATIONALS here (∫₀¹ t^a ln^k t dt =
       (−1)^k k!/(a+1)^{k+1} termwise over the expanded kernel), not
       asserted-and-numerically-eyeballed. The numeric parity check stays.
   T2  The core/collar split is decided CELL-BY-CELL ON ONE GRID (1/100,
       exact rational corners): a cell is CORE iff min over its corners of
       depth ≥ 3/40 — exact, because depth is concave on a convex domain
       so its min over a cell is at a corner — and COLLAR otherwise; cells
       entirely inside a tip disk (R1, exact) go to the tip lemmas. This
       stage kills every CORE cell (kill-or-refine, whole-cell value
       bound + the R=0.07 solid-mean e-bound, valid at every point since
       core cells are ≥ 3/40 > 0.07 deep everywhere); stage-collar kills
       the complementary cells. The bench used two different grids with a
       corner-max ≥ 0.075 inclusion bar — unsound for a concave depth
       (its max lives mid-cell), leaving quantization slivers covered by
       neither sweep. One grid + complementary exact criteria closes the
       partition by construction.
   T3  Witness balls B_R(w) ⊂ Ω are decided in EXACT RATIONALS (witness
       coordinates are doubles = dyadic rationals; depth ≥ R is a rational
       statement), not float-padded.
   The improved deep min witness (the bench computed it mid-collar) also
   lives here — it is the same solid-mean machinery. MIT. */
'use strict';

const I = require('../interval/interval.js');
const Q = require('../interval/rational.js');
const S = require('../ivspecial/ivspecial.js');
const T = require('../interval/transcendental.js');
const SP = require('./specimen.js');
const UE = require('./ueval.js');
const REC = require('./record.js');

const { iv } = I;
const { r_, ratToIv, VF, LAM } = SP;

/* ---------- T1: I₀ = 5/48 in exact rationals ----------
   I₀ = ∫₀¹ (−ln t − (1−t²)/2)² t dt. Expand in powers of L = ln t:
   L²·t + L·(t − t³) + (t − 2t³ + t⁵)/4, and integrate termwise with
   ∫₀¹ t^a L^k dt = (−1)^k k! / (a+1)^{k+1}. Returns the exact rational. */
function I0Exact() {
  const parts = [
    { k: 2, poly: [[1, 1, 1]] },                                  // L²·t
    { k: 1, poly: [[1, 1, 1], [-1, 1, 3]] },                      // L·(t − t³)
    { k: 0, poly: [[1, 4, 1], [-2, 4, 3], [1, 4, 5]] },           // (t − 2t³ + t⁵)/4
  ];
  let s = Q.ZERO;
  for (const { k, poly } of parts) {
    for (const [num, den, a] of poly) {
      // coefficient num/den times ∫ t^a L^k = (−1)^k k!/(a+1)^{k+1}
      const fact = k === 2 ? 2 : 1;
      const sign = (k % 2 === 0) ? 1 : -1;
      let denom = 1;
      for (let i = 0; i <= k; i++) denom *= (a + 1);
      s = Q.add(s, Q.R(BigInt(sign * num * fact), BigInt(den * denom)));
    }
  }
  return s;
}

function run() {
  const checks = [];
  const t0 = Date.now();

  const eig = REC.read('eigenpair');
  const dfct = REC.read('defect');
  const { coef } = UE.trialCoef();
  checks.push({
    name: 'trial identity vs defect record',
    ok: coef.every((a, i) => Object.is(a, dfct.trial.coefficients[i])),
  });

  const E_L2 = eig.eigenfunctionL2Error;
  const DLAM = eig.deltaLambda;
  const MU1_UP = eig.mu1[1];

  /* I₀ exact + numeric parity */
  const I0 = I0Exact();
  const I0is548 = Q.isZero(Q.sub(I0, r_(5, 48)));
  checks.push({ name: 'I₀ = 5/48 DERIVED in exact rationals', ok: I0is548 });
  {
    let num = 0;
    const n = 20000;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const a = -Math.log(t) - (1 - t * t) / 2;
      num += a * a * t / n;
    }
    checks.push({ name: 'I₀ numeric parity', ok: Math.abs(num - 5 / 48) < 1e-4, detail: num.toFixed(6) });
  }
  const GAMMA_G = S.sqrtIv(I.div(ratToIv(r_(5, 48)), T.TWO_PI));

  /* ---------- float landscape: boundary extrema + witnesses ---------- */
  let bMax = { v: -Infinity }, bMin = { v: Infinity };
  for (let e = 0; e < 4; e++) {
    const A = VF[e], B = VF[(e + 1) % 4];
    for (let i = 0; i <= 400; i++) {
      const t = i / 400;
      const x = A[0] + (B[0] - A[0]) * t, y = A[1] + (B[1] - A[1]) * t;
      const v = UE.uFloat(x, y);
      if (v > bMax.v) bMax = { v, x, y, e, t };
      if (v < bMin.v) bMin = { v, x, y, e, t };
    }
  }

  function inwardPoint(hit, depth) {
    const A = VF[hit.e], B = VF[(hit.e + 1) % 4];
    const ex = B[0] - A[0], ey = B[1] - A[1], L = Math.hypot(ex, ey);
    const nx = -ey / L, ny = ex / L;
    let x = hit.x + nx * depth, y = hit.y + ny * depth;
    if (!SP.insideQF(x, y) || SP.depthF(x, y) < depth * 0.9) {
      const cx = 0.525, cy = 0.45;
      const dx2 = cx - hit.x, dy2 = cy - hit.y, dd = Math.hypot(dx2, dy2);
      x = hit.x + dx2 / dd * depth * 1.5; y = hit.y + dy2 / dd * depth * 1.5;
    }
    return { x, y, depth: SP.depthF(x, y) };
  }
  const wMax = inwardPoint(bMax, 0.04), wMin = inwardPoint(bMin, 0.04);
  const wMinDeep = { x: 0.8305, y: 0.881, depth: SP.depthF(0.8305, 0.881) };

  /* T3: exact double → exact rational, and the exact ball-in-Ω decision */
  function dbl2rat(x) {
    if (!Number.isFinite(x)) throw new Error('dbl2rat: non-finite');
    let e = 0, y = x;
    while (!Number.isInteger(y)) { y *= 2; e++; if (e > 1200) throw new Error('dbl2rat overflow'); }
    return SP.rat(BigInt(y), 1n << BigInt(e));
  }
  function ballInside(w, R) {
    // depth(w) ≥ R decided exactly (doubles are dyadic rationals)
    return SP.depthGeQ([dbl2rat(w.x), dbl2rat(w.y)], dbl2rat(R));
  }
  const RwMax = wMax.depth * 0.95 - 1e-6, RwMin = wMin.depth * 0.95 - 1e-6, RwDeep = 0.018;
  checks.push({ name: 'witness(+) ball inside Ω (exact rational decision)', ok: ballInside(wMax, RwMax) });
  checks.push({ name: 'witness(−) ball inside Ω (exact rational decision)', ok: ballInside(wMin, RwMin) });
  checks.push({ name: 'deep min witness ball inside Ω (exact rational decision)', ok: ballInside(wMinDeep, RwDeep) });

  /* ---------- global ‖u‖ upper (bounding-box value cells) ---------- */
  let nuUp2 = 0;
  {
    const H = 0.0125;
    for (let x = 0; x < 1.0; x += H) for (let y = 0; y < 0.9; y += H) {
      const cell = UE.uEval(iv(x, x + H), iv(y, y + H), false);
      const sup = Math.max(Math.abs(cell.val[0]), Math.abs(cell.val[1]));
      nuUp2 = I.nextUp(nuUp2 + sup * sup * H * H);
    }
  }
  const NU_UP = I.nextUp(Math.sqrt(nuUp2));

  function eBoundGlobal(R) {
    return I.nextUp(E_L2 / (Math.sqrt(Math.PI) * R)
      + GAMMA_G[1] * R * (MU1_UP * E_L2 + DLAM * NU_UP));
  }

  /* ---------- witnesses first (the sweep's kill bars) ---------- */
  const R_CORE = 0.07; // valid at every core-cell point (depth ≥ 3/40 > 0.07)
  const eCoreWorst = eBoundGlobal(R_CORE);
  const eWitP = eBoundGlobal(RwMax);
  const eWitM = eBoundGlobal(RwMin);
  const eWitDeep = I.nextUp(E_L2 / (Math.sqrt(Math.PI) * RwDeep)
    + GAMMA_G[1] * RwDeep * (MU1_UP * E_L2 + DLAM * NU_UP));

  const wMaxIv = UE.uEval(iv(wMax.x), iv(wMax.y), false).val;
  const wMinIv = UE.uEval(iv(wMin.x), iv(wMin.y), false).val;
  const wDeepIv = UE.uEval(iv(wMinDeep.x), iv(wMinDeep.y), false).val;
  const WIT_P = I.nextDown(wMaxIv[0] - eWitP);
  const WIT_M = I.nextDown(-wMinIv[1] - eWitM);
  const WIT_M_DEEP = I.nextDown(-wDeepIv[1] - eWitDeep);
  checks.push({ name: 'deep min witness beats the shallow one', ok: WIT_M_DEEP > WIT_M, detail: `${WIT_M_DEEP.toFixed(6)} > ${WIT_M.toFixed(6)}` });

  /* ---------- T2: kill every CORE cell of the 1/100 grid ----------
     CORE cell: corner-min depth ≥ 3/40 (exact; = cell-min by concavity).
     Kill bar: sup_cell u + eCoreWorst < WIT_P (max side) and
     sup_cell(−u) + eCoreWorst < WIT_M (min side); refine up to two
     levels (1/400) where the centered-form bound is too fat. Any
     survivor REFUSES the stage. */
  const coverStats = { coreCells: 0, evals: 0, refined: 0, survivors: 0 };
  let supP = -Infinity, supM = -Infinity;
  const fl = (r) => Number(r.n) / Number(r.d);
  function cellBounds(x0, x1, y0, y1) {
    const cellIv = UE.uEval(iv(x0, x1), iv(y0, y1), true);
    coverStats.evals++;
    const gmag = Math.sqrt(I.mag(cellIv.gx) ** 2 + I.mag(cellIv.gy) ** 2);
    const half = I.nextUp(Math.hypot(x1 - x0, y1 - y0) / 2);
    const ctr = UE.uEval(iv((x0 + x1) / 2), iv((y0 + y1) / 2), false);
    return {
      upP: I.nextUp(ctr.val[1] + gmag * half),
      upM: I.nextUp(-ctr.val[0] + gmag * half),
    };
  }
  function killCore(x0, x1, y0, y1, level) {
    const b = cellBounds(x0, x1, y0, y1);
    const okP = I.nextUp(b.upP + eCoreWorst) < WIT_P;
    const okM = I.nextUp(b.upM + eCoreWorst) < WIT_M;
    if (okP && okM) {
      supP = Math.max(supP, b.upP); supM = Math.max(supM, b.upM);
      return true;
    }
    if (level >= 2) { coverStats.survivors++; return false; }
    coverStats.refined++;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    let all = true;
    for (const [a, bb, c, d] of [[x0, mx, y0, my], [mx, x1, y0, my], [x0, mx, my, y1], [mx, x1, my, y1]]) {
      if (!killCore(a, bb, c, d, level + 1)) all = false;
    }
    return all;
  }
  {
    const D = 100;
    for (let ix = 0; ix < D; ix++) {
      for (let iy = 0; iy < 90; iy++) {
        const x0r = SP.rat(ix, D), y0r = SP.rat(iy, D), hr = SP.rat(1, D);
        const x1r = SP.radd(x0r, hr), y1r = SP.radd(y0r, hr);
        const corners = SP.cellCorners(x0r, x1r, y0r, y1r);
        if (SP.cellInTipQ(corners)) continue;            // R1 → tip lemmas
        if (SP.cellTouchesSubCoreQ(corners)) continue;   // collar cell → stage-collar
        coverStats.coreCells++;
        const x0 = I.nextDown(fl(x0r)), x1 = I.nextUp(fl(x1r));
        const y0 = I.nextDown(fl(y0r)), y1 = I.nextUp(fl(y1r));
        killCore(x0, x1, y0, y1, 0);
      }
    }
  }
  checks.push({
    name: 'CORE: every core cell killed on both sides (zero survivors)',
    ok: coverStats.survivors === 0,
    detail: JSON.stringify(coverStats),
  });
  checks.push({ name: 'CORE (max side) margin positive', ok: WIT_P > I.nextUp(supP + eCoreWorst), detail: `${WIT_P.toFixed(6)} > ${(supP + eCoreWorst).toFixed(6)}` });
  checks.push({ name: 'CORE (min side) margin positive', ok: WIT_M > I.nextUp(supM + eCoreWorst), detail: `${WIT_M.toFixed(6)} > ${(supM + eCoreWorst).toFixed(6)}` });
  const cover = { supP, supM };

  const ok = checks.every(c => c.ok);
  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: 'Every CORE cell of the 1/100 grid (corner-min depth ≥ 3/40, exact — cell-min by concavity) is killed on both sides: certified witnesses beat the certified whole-cell sup + solid-mean e-bound. With stage-collar killing the complementary cells and the tips covering R1 cells, the interior partition closes by construction. Solid-mean lemma with EXACT kernel norm I₀ = 5/48 (derived in rationals).',
    I0: '5/48',
    kernelNote: 'G_R(r) = (1/2π)(ln(R/r) − (R²−r²)/2R²), ‖G_R‖_{L²(B_R)} = R√(I₀/2π)',
    inputs: { E_L2, deltaLambda: DLAM, mu1up: MU1_UP, from: ['certs/ember-eigenpair.json'] },
    NuUpGlobal: NU_UP,
    witnesses: {
      max: { x: wMax.x, y: wMax.y, R: RwMax, eBound: eWitP, value: WIT_P, meaning: 'φ̂(w₊) ≥ value' },
      min: { x: wMin.x, y: wMin.y, R: RwMin, eBound: eWitM, value: WIT_M, meaning: '−φ̂(w₋) ≥ value' },
      minDeep: { x: wMinDeep.x, y: wMinDeep.y, R: RwDeep, eBound: eWitDeep, value: WIT_M_DEEP, meaning: '−φ̂(w₋′) ≥ value — the collar/corner witness' },
    },
    core: {
      depthFloor: '3/40', grid: '1/100, refine to 1/400',
      rule: 'CORE cell ⇔ corner-min depth ≥ 3/40 (exact rational; cell-min by concavity); complementary cells are stage-collar\'s; entirely-in-tip cells (R1) are the tip lemmas\'',
      supPlus: cover.supP, supMinus: cover.supM,
      eBoundCore: eCoreWorst, R: R_CORE,
      marginMax: WIT_P - I.nextUp(cover.supP + eCoreWorst),
      marginMin: WIT_M - I.nextUp(cover.supM + eCoreWorst),
      cells: coverStats,
    },
    boundaryLandscape: { max: bMax, min: bMin, note: 'float steering only — no claim' },
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run, I0Exact };
