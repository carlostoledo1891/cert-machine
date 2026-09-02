/* ueval.js — the certified interval evaluator of the frozen trial.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   u = Σ aᵢψᵢ over the four corner Fourier–Bessel fans, evaluated in
   interval arithmetic through instruments/ivspecial. One copy — the bench
   duplicated this evaluator in four cert scripts (pinned in frontier-ref/;
   the copies were line-identical, so a single module ports all four).

   Corner-containing cells: values fall back to the full sector angle hull
   (cos(νθ) enclosed over the sector); gradients there REFUSE — no stage
   needs them. Outward rounding can push a square-sum to −5e-324; clamping
   to 0 only tightens (a square is nonnegative). MIT. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');
const S = require('../ivspecial/ivspecial.js');
const SP = require('./specimen.js');
const TRIAL = require('./trial.js');

const { iv, add, sub, mul, div, neg } = I;
const { CORN, angleOfIv, K_FAN, LAM } = SP;

const sqlamIv = S.sqrtIv(iv(LAM));

/* the frozen trial coefficients, regenerated deterministically once per
   process; stages compare them element-exactly against the defect record */
let A_COEF = null, FLOAT_DEFECT = null;
function trialCoef() {
  if (!A_COEF) {
    const scan = TRIAL.defectAt(K_FAN, LAM);
    A_COEF = Array.from(scan.coef);
    FLOAT_DEFECT = scan.d;
  }
  return { coef: A_COEF, floatDefect: FLOAT_DEFECT };
}

function uEval(x, y, needGrad) {
  const { coef } = trialCoef();
  let val = I.ZERO, gx = I.ZERO, gy = I.ZERO;
  for (let c = 0; c < 4; c++) {
    const C = CORN[c];
    const dx = sub(x, C.V[0]), dy = sub(y, C.V[1]);
    const r2raw = add(I.sqr(dx), I.sqr(dy));
    const r2 = [Math.max(0, r2raw[0]), r2raw[1]];
    const r = S.sqrtIv(r2);
    const xB = mul(sqlamIv, r);
    let th, phi = null;
    const definite = dx[0] > 0 || dx[1] < 0 || dy[0] > 0 || dy[1] < 0;
    if (definite) {
      phi = angleOfIv(dx, dy);
      th = sub(phi, C.a1);
      if (th[1] < 0) th = add(th, T.TWO_PI);
      if (th[0] > C.om[1] + 0.02) th = sub(th, T.TWO_PI);
    } else {
      if (needGrad) throw new Error('uEval: gradient requested on a corner-containing cell');
      th = [-0.02, C.om[1] + 0.02];
    }
    for (let k = 0; k < K_FAN; k++) {
      const a = coef[c * K_FAN + k];
      if (a === 0) continue;
      const nu = k === 0 ? I.ZERO : mul(iv(k), C.nub);
      const J = S.besselJIv(nu, xB);
      const ang = mul(nu, th);
      const ct = T.cos(ang);
      val = add(val, mul(iv(a), mul(J, ct)));
      if (needGrad) {
        const Jd = S.besselJdIv(nu, xB);
        const st = T.sin(ang);
        const dr = mul(sqlamIv, mul(Jd, ct));
        const dth = k === 0 ? I.ZERO : neg(div(mul(nu, mul(J, st)), r));
        const cp = T.cos(phi), sp = T.sin(phi);
        gx = add(gx, mul(iv(a), sub(mul(dr, cp), mul(dth, sp))));
        gy = add(gy, mul(iv(a), add(mul(dr, sp), mul(dth, cp))));
      }
    }
  }
  return { val, gx, gy };
}

/* own fan of corner c in its local frame (r, θ intervals) */
function fanEval(c, rI, thI) {
  const { coef } = trialCoef();
  let val = I.ZERO;
  const xB = mul(sqlamIv, rI);
  for (let k = 0; k < K_FAN; k++) {
    const a = coef[c * K_FAN + k];
    if (a === 0) continue;
    const nu = k === 0 ? I.ZERO : mul(iv(k), CORN[c].nub);
    val = add(val, mul(iv(a), mul(S.besselJIv(nu, xB), T.cos(mul(nu, thI)))));
  }
  return val;
}

/* float trial evaluation (bridges only) */
function uFloat(x, y) {
  const { coef } = trialCoef();
  const csF = TRIAL.corners();
  const bv = TRIAL.basisEval(csF, K_FAN, Math.sqrt(LAM), x, y, false);
  let s = 0;
  for (let i = 0; i < coef.length; i++) s += coef[i] * bv.vals[i];
  return s;
}

module.exports = { sqlamIv, trialCoef, uEval, fanEval, uFloat };
