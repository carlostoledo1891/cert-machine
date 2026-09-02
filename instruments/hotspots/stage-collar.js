/* stage-collar.js — the collar sweep: every sub-core cell killed.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   Port of cert-collar.js (pinned in frontier-ref/). Kills every COLLAR
   cell of the 1/100 grid — corner-min depth < 3/40 (the exact complement
   of stage-pointwise's core cells), excluding only cells ENTIRELY inside
   a tip disk (R1, exact; the bench skipped on min-corner distance < 0.11,
   leaving slivers beyond r = 0.11 uncovered — the port's R1 closes that).
   Kill: whole-cell value bound + REFLECTED pointwise-e bound (even
   reflection of φ̂ across the nearest open edge is exact; u's reflection
   adds a single-layer ≤ sup|∂νu|·3R/π, per-edge sups READ FROM THE DEFECT
   RECORD) against the certified witnesses (max side; DEEP min witness),
   kill-or-refine two levels (to 1/400). ZERO residual cells required —
   the record refuses otherwise. MIT. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');
const S = require('../ivspecial/ivspecial.js');
const SP = require('./specimen.js');
const UE = require('./ueval.js');
const REC = require('./record.js');

const { iv } = I;
const { r_, ratToIv, VF } = SP;

/* the sweep machinery, parameterized so the battery can drive it with
   MUTATED inputs (an inflated flux sup must refuse a kill — the layer
   term is load-bearing, not decorative) */
function makeKiller({ E_L2, DLAM, MU1_UP, NU_UP, SUPD, WIT_P, WIT_M_DEEP }) {
  const GAMMA_G = S.sqrtIv(I.div(ratToIv(r_(5, 48)), T.TWO_PI));

  /* reflected pointwise-e bound at a float point near an open edge */
  function eBoundReflected(x, y) {
    let best = { d: Infinity, e: -1 };
    for (let e = 0; e < 4; e++) {
      const d = SP.distToSegF(x, y, VF[e], VF[(e + 1) % 4]);
      if (d < best.d) best = { d, e };
    }
    const e = best.e;
    let R = Infinity;
    R = Math.min(R, Math.hypot(x - VF[e][0], y - VF[e][1]));
    R = Math.min(R, Math.hypot(x - VF[(e + 1) % 4][0], y - VF[(e + 1) % 4][1]));
    for (let e2 = 0; e2 < 4; e2++) {
      if (e2 === e) continue;
      R = Math.min(R, SP.distToSegF(x, y, VF[e2], VF[(e2 + 1) % 4]));
    }
    R = R * 0.9 - 1e-6;
    if (R <= 0.002) return { bound: Infinity, R };
    const sq2 = Math.SQRT2;
    const b = I.nextUp(sq2 * E_L2 / (Math.sqrt(Math.PI) * R)
      + GAMMA_G[1] * R * (MU1_UP * sq2 * E_L2 + DLAM * sq2 * NU_UP)
      + SUPD[e] * 3 * R / Math.PI);
    return { bound: b, R };
  }

  /* kill-or-refine one collar cell — RATIONAL bounds throughout so the
     exterior skip stays exact through refinement (halving is exact) */
  const stats = { collarCells: 0, evals: 0, refined: 0, survivors: 0, worstP: -Infinity, worstM: -Infinity, survivorCells: [] };
  const fl = (r) => Number(r.n) / Number(r.d);
  function killCollar(x0r, y0r, hr, level) {
    const x1r = SP.radd(x0r, hr), y1r = SP.radd(y0r, hr);
    if (!SP.cellMeetsDomainQ(x0r, x1r, y0r, y1r)) return true; // exterior sub-cell (exact SAT): nothing to kill
    const x0 = I.nextDown(fl(x0r)), x1 = I.nextUp(fl(x1r));
    const y0 = I.nextDown(fl(y0r)), y1 = I.nextUp(fl(y1r));
    const ctr = UE.uEval(iv((x0 + x1) / 2), iv((y0 + y1) / 2), false);
    const cellG = UE.uEval(iv(x0, x1), iv(y0, y1), true);
    stats.evals++;
    const gmag = Math.sqrt(I.mag(cellG.gx) ** 2 + I.mag(cellG.gy) ** 2);
    const half = I.nextUp(Math.hypot(x1 - x0, y1 - y0) / 2);
    const cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    const ebW = Math.max(...cs.map(p => eBoundReflected(p[0], p[1]).bound));
    const supP = I.nextUp(ctr.val[1] + gmag * half + ebW);
    const supM = I.nextUp(-ctr.val[0] + gmag * half + ebW);
    const okP = supP < WIT_P, okM = supM < WIT_M_DEEP;
    if (okP && okM) {
      stats.worstP = Math.max(stats.worstP, supP);
      stats.worstM = Math.max(stats.worstM, supM);
      return true;
    }
    if (level >= 3) {
      stats.survivors++;
      stats.survivorCells.push({ x0, y0, h: x1 - x0, supP, supM, okP, okM, ebW });
      return false;
    }
    stats.refined++;
    const h2 = SP.rat(hr.n, hr.d * 2n);
    const xm = SP.radd(x0r, h2), ym = SP.radd(y0r, h2);
    let all = true;
    for (const [a, b] of [[x0r, y0r], [xm, y0r], [x0r, ym], [xm, ym]]) {
      if (!killCollar(a, b, h2, level + 1)) all = false;
    }
    return all;
  }

  return { eBoundReflected, killCollar, stats };
}

function run() {
  const checks = [];
  const t0 = Date.now();

  const eig = REC.read('eigenpair');
  const dfct = REC.read('defect');
  const pw = REC.read('pointwise');
  const { coef } = UE.trialCoef();
  checks.push({
    name: 'trial identity vs defect record',
    ok: coef.every((a, i) => Object.is(a, dfct.trial.coefficients[i])),
  });

  const inputs = {
    E_L2: eig.eigenfunctionL2Error,
    DLAM: eig.deltaLambda,
    MU1_UP: eig.mu1[1],
    NU_UP: pw.NuUpGlobal,
    SUPD: dfct.supFluxPerEdge,
    WIT_P: pw.witnesses.max.value,
    WIT_M_DEEP: pw.witnesses.minDeep.value,
  };
  const { E_L2, DLAM, MU1_UP, NU_UP, SUPD, WIT_P, WIT_M_DEEP } = inputs;
  const { killCollar, stats } = makeKiller(inputs);

  const D = 100;
  for (let ix = 0; ix < D; ix++) {
    for (let iy = 0; iy < 90; iy++) {
      const x0r = SP.rat(ix, D), y0r = SP.rat(iy, D), hr = SP.rat(1, D);
      const x1r = SP.radd(x0r, hr), y1r = SP.radd(y0r, hr);
      const corners = SP.cellCorners(x0r, x1r, y0r, y1r);
      if (SP.cellInTipQ(corners)) continue;                 // R1 → tip lemmas
      if (!SP.cellTouchesSubCoreQ(corners)) continue;       // core cell → stage-pointwise
      if (!SP.cellMeetsDomainQ(x0r, x1r, y0r, y1r)) continue; // fully exterior (exact SAT)
      stats.collarCells++;
      killCollar(x0r, y0r, hr, 0);
    }
  }

  checks.push({
    name: 'COLLAR: ZERO residual cells (both sides, deep min witness)',
    ok: stats.survivors === 0,
    detail: JSON.stringify(stats),
  });
  checks.push({
    name: 'collar kill margins positive',
    ok: stats.worstP < WIT_P && stats.worstM < WIT_M_DEEP,
    detail: `max side ${stats.worstP.toFixed(6)} < ${WIT_P.toFixed(6)}; min side ${stats.worstM.toFixed(6)} < ${WIT_M_DEEP.toFixed(6)}`,
  });

  const ok = checks.every(c => c.ok);
  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: 'Every collar cell of the 1/100 grid (corner-min depth < 3/40, not entirely inside a tip disk) is killed on both sides by the value argument with REFLECTED pointwise-e bounds — zero residual cells. Together with stage-pointwise (core cells) and the tips (R1 cells) the interior partition closes by construction.',
    inputs: {
      E_L2, deltaLambda: DLAM, mu1up: MU1_UP, NuUp: NU_UP,
      supFluxPerEdge: SUPD,
      witnessMax: WIT_P, witnessMinDeep: WIT_M_DEEP,
      from: ['certs/ember-eigenpair.json', 'certs/ember-defect.json', 'certs/ember-pointwise.json'],
    },
    reflectionNote: 'even reflection of φ̂ across an open edge is exact; u\'s reflection carries a single-layer with density 2∂νu, bounded by supD·3R/π',
    sweep: stats,
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run, makeKiller };
