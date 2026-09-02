/* stage-eigenpair.js — the assembled eigenpair certificate.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   Port of cert-assemble.js (pinned in frontier-ref/). For the exact-
   Helmholtz trial u: r(v) = a(u,v) − λ̃m(u,v) = ∫_∂Ω(∂νu)v ds, so with the
   star-shaped trace constant C_tr (rational: ‖v‖²_∂ ≤ ((R+2)/c0)‖v‖²_B,
   x0 = (21/40, 9/20)) and D ≥ ‖∂νu‖: Σ c_k²(μ_k−λ̃)²/(1+μ_k) ≤ ε² =
   (D·C_tr)². With F = max(1/λ̃², (1+μ2lo)/(μ2lo−λ̃)²) and a certified
   ‖u‖_{L²} lower bound: c₁² ≥ Nu_lo² − ε²F, |μ1−λ̃| ≤ ε√(1+μ1up)/c₁,
   ‖u−c₁φ₁‖_{L²} ≤ ε√F. Inputs are READ FROM RECORDS (defect, spectrum) —
   the bench hand-copied them. Also derived here (used downstream):
   δλ = the |λ̃−μ1| bound and |e|_{H¹} ≤ ε√G, G = μ2lo(1+μ2lo)/(μ2lo−λ̃)².
   MIT. */
'use strict';

const I = require('../interval/interval.js');
const Q = require('../interval/rational.js');
const S = require('../ivspecial/ivspecial.js');
const SP = require('./specimen.js');
const UE = require('./ueval.js');
const REC = require('./record.js');

const { iv, add, sub, mul, div } = I;
const { r_, ratToIv, VQ, LAM } = SP;

/* rational star-shaped trace constant; exported for the cross stage */
function traceConstant() {
  const X0 = [r_(21, 40), r_(9, 20)];
  let c0Iv = null, R2max = Q.ZERO;
  for (let e = 0; e < 4; e++) {
    const A = VQ[e], B = VQ[(e + 1) % 4];
    const ex = Q.sub(B[0], A[0]), ey = Q.sub(B[1], A[1]);
    const L2 = Q.add(Q.mul(ex, ex), Q.mul(ey, ey));
    const dot = Q.sub(Q.mul(Q.sub(A[0], X0[0]), ey), Q.mul(Q.sub(A[1], X0[1]), ex));
    const val = div(ratToIv(dot), S.sqrtIv(ratToIv(L2)));
    if (!(val[0] > 0)) throw new Error('x0 not a star center');
    c0Iv = c0Iv === null ? val : [Math.min(c0Iv[0], val[0]), Math.min(c0Iv[1], val[1])];
    const dR = Q.add(Q.mul(Q.sub(A[0], X0[0]), Q.sub(A[0], X0[0])), Q.mul(Q.sub(A[1], X0[1]), Q.sub(A[1], X0[1])));
    if (Q.cmp(dR, R2max) > 0) R2max = dR;
  }
  const Rv = S.sqrtIv(ratToIv(R2max));
  const Ctr = S.sqrtIv(div(add(Rv, iv(2)), c0Iv));
  return { X0: ['21/40', '9/20'], c0: c0Iv, R: Rv, R2maxExact: Q.toString ? Q.toString(R2max) : String(Q.toDouble(R2max)), Ctr };
}

function run() {
  const checks = [];
  const t0 = Date.now();

  const spec = REC.read('spectrum');
  const dfct = REC.read('defect');

  /* the frozen trial must be the one the defect record certified */
  const { coef } = UE.trialCoef();
  const sameTrial = coef.length === dfct.trial.coefficients.length &&
    coef.every((a, i) => Object.is(a, dfct.trial.coefficients[i])) &&
    Object.is(LAM, dfct.trial.lambdaTilde);
  checks.push({ name: 'trial identity: regenerated coefficients match the defect record element-exact', ok: sameTrial });

  const D_DEFECT = dfct.defectUpper;
  const MU1_CR = spec.mu1;
  const MU2_LO = spec.mu2lo;

  /* bridge: interval u vs float evaluation at interior points */
  for (const [x, y] of [[0.4, 0.3], [0.55, 0.5], [0.62, 0.42]]) {
    const fv = UE.uFloat(x, y);
    const e = UE.uEval(iv(x), iv(y), false);
    checks.push({
      name: `bridge u(${x},${y})`,
      ok: I.contains(e.val, fv) || Math.abs(fv - (e.val[0] + e.val[1]) / 2) < 1e-7,
      detail: `float=${fv.toFixed(8)} iv=[${e.val[0].toFixed(8)},${e.val[1].toFixed(8)}]`,
    });
  }

  /* interior-box certified ‖u‖ lower bound */
  const BOX = [0.35, 0.65, 0.25, 0.6];
  const NX = 44, NY = 44;
  let norm2lo = 0;
  for (let a = 0; a < NX; a++) {
    for (let b = 0; b < NY; b++) {
      const hx = (BOX[1] - BOX[0]) / NX, hy = (BOX[3] - BOX[2]) / NY;
      const cx = BOX[0] + (a + 0.5) * hx, cy = BOX[2] + (b + 0.5) * hy;
      const ctr = UE.uEval(iv(cx), iv(cy), false);
      const cell = UE.uEval(iv(BOX[0] + a * hx, BOX[0] + (a + 1) * hx), iv(BOX[2] + b * hy, BOX[2] + (b + 1) * hy), true);
      const gmag = Math.sqrt(I.mag(cell.gx) ** 2 + I.mag(cell.gy) ** 2);
      const dev = I.nextUp(gmag * Math.hypot(hx, hy) / 2 + Math.max(ctr.val[1] - ctr.val[0], 0) / 2);
      const lo = Math.max(0, Math.min(Math.abs(ctr.val[0]), Math.abs(ctr.val[1])) - dev);
      const cellLo = (ctr.val[0] <= 0 && ctr.val[1] >= 0) ? 0 : lo;
      norm2lo = I.nextDown(norm2lo + I.nextDown(cellLo * cellLo * I.nextDown(hx * hy)));
    }
  }
  const NU_LO = Math.sqrt(norm2lo);
  checks.push({ name: '‖u‖ lower bound positive and sane', ok: NU_LO > 0.1 && NU_LO < 1.5, detail: NU_LO.toFixed(4) });

  /* rational trace constant */
  const TC = traceConstant();

  /* assembly */
  const eps = I.nextUp(D_DEFECT * TC.Ctr[1]);
  const lamI = iv(LAM);
  const F1 = div(I.ONE, mul(lamI, lamI));
  const gap2 = sub(iv(MU2_LO), lamI);
  if (!(gap2[0] > 0)) throw new Error('λ̃ not below μ2 lower bound');
  const F2 = div(add(I.ONE, iv(MU2_LO)), mul(gap2, gap2));
  const F = Math.max(F1[1], F2[1]);
  const eps2F = I.nextUp(eps * eps * F);
  const c1sq = I.nextDown(NU_LO * NU_LO - eps2F);
  checks.push({ name: 'c1² > 0', ok: c1sq > 0, detail: c1sq.toFixed(4) });
  const c1lo = Math.sqrt(c1sq);
  const muBound = I.nextUp(eps * Math.sqrt(1 + MU1_CR[1]) / c1lo);
  const mu1 = [Math.max(MU1_CR[0], LAM - muBound), Math.min(MU1_CR[1], LAM + muBound)];
  const efun = I.nextUp(eps * Math.sqrt(F));

  /* global H¹ error (the bench computed this in cert-collar; it belongs
     with the residual framework): G decreasing on [μ2lo, ∞), limit 1 */
  {
    const f = m => m * (1 + m) / Math.pow(m - LAM, 2);
    let mono = true;
    for (let m = MU2_LO; m < 400; m += 0.5) if (f(m + 0.5) > f(m) + 1e-12) mono = false;
    checks.push({ name: 'G decreasing on [μ2lo, ∞) (numeric guard + limit 1)', ok: mono && f(400) > 1 });
  }
  const Gfac = div(mul(iv(MU2_LO), add(I.ONE, iv(MU2_LO))), I.sqr(sub(iv(MU2_LO), lamI)));
  const E_H1 = I.nextUp(eps * S.sqrtIv(Gfac)[1]);

  checks.push({
    name: 'μ1 enclosure tightened vs CR',
    ok: (mu1[1] - mu1[0]) < (MU1_CR[1] - MU1_CR[0]) / 50,
    detail: `width ${(mu1[1] - mu1[0]).toExponential(2)} vs CR ${(MU1_CR[1] - MU1_CR[0]).toExponential(2)}`,
  });
  checks.push({
    name: 'eigenfunction error below core budget',
    ok: efun / c1lo < 1.9e-3 / 2,
    detail: (efun / c1lo).toExponential(2) + ' vs budget 1.9e-3',
  });

  const ok = checks.every(c => c.ok);
  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: 'μ1 ∈ mu1 and ‖u − c₁φ₁‖_{L²} ≤ eigenfunctionL2Error, via the boundary-residual identity, the rational star-shaped trace constant, and the CR spectrum localization; also |e|_{H¹} ≤ EH1 and the δλ = |λ̃ − μ1| bound used by the pointwise machinery.',
    inputs: { defectUpper: D_DEFECT, mu1CR: MU1_CR, mu2lo: MU2_LO, from: ['certs/ember-defect.json', 'certs/ember-spectrum.json'] },
    trace: { x0: TC.X0, c0lo: TC.c0[0], Rup: TC.R[1], Ctr: TC.Ctr[1] },
    normLower: NU_LO,
    epsilon: eps,
    F,
    c1lo,
    mu1,
    mu1width: mu1[1] - mu1[0],
    deltaLambda: muBound,
    eigenfunctionL2Error: efun,
    relativeL2Error: efun / c1lo,
    G: Gfac[1],
    EH1: E_H1,
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run, traceConstant };
