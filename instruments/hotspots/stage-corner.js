/* stage-corner.js — the four corner-tip certificates.
   instruments/hotspots · cert-machine (ember port, 2026-09-02)

   Port of cert-corner.js (pinned in frontier-ref/). In each corner sector
   φ̂ = Σ_k b_k J_{kν}(√μ₁ r)cos(kνθ) exactly (Neumann separation + H¹
   regularity exclude the singular family). Certified b₀, b₁, b₂ by
   big-annulus L² extraction (own fan exact via angular orthogonality; far
   part by second-order midpoint cells; e-contamination ≤ E·√D_k), Parseval
   tail. Tip arguments on r ≤ 0.11:
     A: max side ∂rφ̂ < 0 (cells + factored inner disk); min side value.
     B, D: value kill both sides.
     C: max side value; min side split at θ₁ = 0.35 — gradient min-form on
        [θ₁, ω] down to r = 1e-5 + analytic limit piece, and on the wedge
        [0, θ₁] normal monotonicity φ̂_nn ≥ c₂ > 0 via the BESSEL LADDER
        identity ∂t² = (μ/4)[J_{ν+2}cos((ν+2)θ) + J_{ν−2}cos((ν−2)θ) −
        2J_νcos(νθ)] (sign-explicit; the b₁ < 0 singular term HELPS), with
        the exact second-order Taylor from the Neumann edge.
   CONDITION OF ENTRY (EMBER-PORT.md 3d): the coefficients are re-extracted
   at a SECOND annulus; the two enclosures of each b_k must intersect —
   they both contain the true coefficient, so a miss refutes the
   extraction. Port deltas: the unused tailHess helper is dropped; witness
   bars are READ from the pointwise record. MIT. */
'use strict';

const I = require('../interval/interval.js');
const T = require('../interval/transcendental.js');
const S = require('../ivspecial/ivspecial.js');
const SP = require('./specimen.js');
const UE = require('./ueval.js');
const REC = require('./record.js');

const { iv, add, sub, mul, div, neg } = I;
const { CORN, VF, K_FAN, LAM } = SP;
const sqlamIv = UE.sqlamIv;

const RTIP = 0.11;
const ANN1 = [[0.10, 0.45], [0.10, 0.45], [0.08, 0.42], [0.08, 0.42]];
const ANN2 = [[0.13, 0.40], [0.13, 0.40], [0.11, 0.38], [0.11, 0.38]];
const KX = 3;

function int1D(f, a, b, n) {
  let lo = 0, hi = 0;
  const h = (b - a) / n;
  for (let m = 0; m < n; m++) {
    const e = f(iv(a + m * h, a + (m + 1) * h));
    lo = I.nextDown(lo + e[0] * h); hi = I.nextUp(hi + e[1] * h);
  }
  return [lo, hi];
}

function makeMachinery(E_L2, MU1) {
  const sqmu = S.sqrtIv(MU1);
  const { coef } = UE.trialCoef();

  /* per-cell far-fan Hessian bound */
  function farHessCell(c, px, py) {
    let B2 = 0;
    for (let cc = 0; cc < 4; cc++) {
      if (cc === c) continue;
      const d = Math.hypot(px - VF[cc][0], py - VF[cc][1]);
      const rlo = Math.max(0.05, d - 0.02), rhi = d + 0.02;
      const xB = mul(sqlamIv, iv(rlo, rhi));
      for (let k = 0; k < K_FAN; k++) {
        const a = Math.abs(coef[cc * K_FAN + k]);
        if (a === 0) continue;
        const nu = k === 0 ? 0 : k * CORN[cc].nub[1];
        const J = I.mag(S.besselJIv(k === 0 ? I.ZERO : mul(iv(k), CORN[cc].nub), xB));
        const Jd = I.mag(S.besselJdIv(k === 0 ? I.ZERO : mul(iv(k), CORN[cc].nub), xB));
        const xlo = Math.sqrt(LAM * 0.999) * rlo;
        const Jdd = (1 + (nu * nu) / (xlo * xlo)) * J + Jd / xlo;
        B2 += a * (LAM * 1.01 * Jdd + 2 * nu * 3.5 * Jd / rlo + (nu * nu + nu) * J / (rlo * rlo) + 3.5 * Jd / rlo);
      }
    }
    return I.nextUp(B2);
  }

  /* extraction at annulus ANN[c] = [R0A, R1A] */
  function extract(c, ANNc) {
    const C = CORN[c], om = C.om, nub = C.nub;
    const [R0A, R1A] = ANNc;
    const NR = 70, NT = 70;
    const hr = (R1A - R0A) / NR;
    const M = [I.ZERO, I.ZERO, I.ZERO];
    let uN2hi = 0;
    const a1m = (C.a1[0] + C.a1[1]) / 2, omm = (om[0] + om[1]) / 2;
    const nus = [I.ZERO, nub, mul(iv(2), nub)];
    for (let ir = 0; ir < NR; ir++) {
      const rc = R0A + (ir + 0.5) * hr;
      const rcI = iv(rc);
      for (let it = 0; it < NT; it++) {
        const thc = omm * (it + 0.5) / NT;
        const hth = omm / NT;
        const px = VF[c][0] + rc * Math.cos(a1m + thc), py = VF[c][1] + rc * Math.sin(a1m + thc);
        const g = UE.uEval(iv(px), iv(py), true);
        const gm = Math.sqrt(I.mag(g.gx) ** 2 + I.mag(g.gy) ** 2);
        const HB = farHessCell(c, px, py);
        const own = UE.fanEval(c, rcI, iv(thc));
        const farC = sub(g.val, own);
        const fAbs = I.mag(farC), uAbs = I.mag(g.val);
        let og1 = 0, og2 = 0;
        for (let kk = 0; kk < K_FAN; kk++) {
          const ak = Math.abs(coef[c * K_FAN + kk]);
          if (ak === 0) continue;
          const nuk = kk * CORN[c].nub[1];
          const nuI = kk === 0 ? I.ZERO : mul(iv(kk), CORN[c].nub);
          const Jm = I.mag(S.besselJIv(nuI, mul(sqlamIv, rcI)));
          const Jdm = I.mag(S.besselJdIv(nuI, mul(sqlamIv, rcI)));
          const xk = sqlamIv[0] * rc;
          const Jddm = (1 + nuk * nuk / (xk * xk)) * Jm + Jdm / xk;
          og1 = I.nextUp(og1 + ak * (sqlamIv[1] * Jdm + nuk * Jm / rc));
          og2 = I.nextUp(og2 + ak * (LAM * 1.001 * Jddm + 2 * nuk * sqlamIv[1] * Jdm / rc + nuk * (nuk + 1) * Jm / (rc * rc)));
        }
        const fGrad = I.nextUp(gm + og1), fHess = I.nextUp(HB + og2);
        for (let k = 0; k < KX; k++) {
          const nu = nus[k];
          const J = S.besselJIv(nu, mul(sqmu, rcI));
          const ct = T.cos(mul(nu, iv(thc)));
          const w = mul(mul(J, ct), rcI);
          const nuv = nu[1];
          const Jm = I.mag(J), Jdm = I.mag(S.besselJdIv(nu, mul(sqmu, rcI)));
          const x = sqmu[0] * rc;
          const Jddm = I.nextUp((1 + nuv * nuv / (x * x)) * Jm + Jdm / x);
          const wr = I.nextUp(sqmu[1] * Jdm * rc + Jm);
          const wrr = I.nextUp(MU1[1] * Jddm * rc + 2 * sqmu[1] * Jdm);
          const wth = I.nextUp(nuv * Jm * rc), wthth = I.nextUp(nuv * nuv * Jm * rc);
          const grr = I.nextUp(fAbs * wrr + 2 * fGrad * wr + fHess * Jm * rc);
          const gtt = I.nextUp(fAbs * wthth + 2 * (fGrad * rc) * wth + (fHess * rc * rc + fGrad * rc) * Jm * rc);
          const errC = I.nextUp((grr * hr * hr + gtt * hth * hth) / 24 * hr * hth);
          const cell = mul(mul(farC, w), iv(hr * hth));
          M[k] = add(M[k], [I.nextDown(cell[0] - errC), I.nextUp(cell[1] + errC)]);
        }
        const uHess = fHess, uGrad = fGrad;
        const g2rr = I.nextUp((2 * uGrad * uGrad + 2 * uAbs * uHess) * rc + 4 * uAbs * uGrad);
        const g2tt = I.nextUp((2 * (uGrad * rc) * (uGrad * rc) + 2 * uAbs * (uHess * rc * rc + uGrad * rc)) * rc);
        const err2 = I.nextUp((g2rr * hr * hr + g2tt * hth * hth) / 24 * hr * hth);
        const s2 = I.sqr(g.val);
        uN2hi = I.nextUp(uN2hi + s2[1] * rc * hr * hth + err2);
      }
    }
    const Ds = [], Ns = [];
    for (let k = 0; k < KX; k++) {
      const nu = nus[k];
      const wk = k === 0 ? om : div(om, iv(2));
      const Dk = mul(wk, int1D(rI => mul(I.sqr(S.besselJIv(nu, mul(sqmu, rI))), rI), R0A, R1A, 300));
      const Xk = mul(wk, int1D(rI => mul(mul(S.besselJIv(nu, mul(sqlamIv, rI)), S.besselJIv(nu, mul(sqmu, rI))), rI), R0A, R1A, 300));
      const ak = coef[c * K_FAN + k] || 0;
      const Nk = add(mul(iv(ak), Xk), M[k]);
      const ek = I.nextUp(E_L2 * Math.sqrt(Dk[1]));
      Ns.push([Nk[0] - ek, Nk[1] + ek]);
      Ds.push(Dk);
    }
    const bs = Ns.map((N, k) => div(N, Ds[k]));
    const nUp = I.nextUp(Math.pow(Math.sqrt(uN2hi) + E_L2, 2));
    let expl = 0;
    for (let k = 0; k < KX; k++) {
      const mig = Ns[k][0] > 0 ? Ns[k][0] : (Ns[k][1] < 0 ? -Ns[k][1] : 0);
      expl = I.nextDown(expl + mig * mig / Ds[k][1]);
    }
    const T2 = Math.max(0, I.nextUp(nUp - expl));
    return { b0: bs[0], b1: bs[1], b2: bs[2], bs, Ds, T2, ann: ANNc };
  }

  /* pointwise tails over an r-band [rLo, rHi] */
  function tailBounds(c, X, rHi, rLoIn) {
    const rLo = Math.max(rLoIn === undefined ? rHi : rLoIn, 1e-9);
    const [, R1A] = X.ann;
    const rq = 0.8 * R1A;
    const om = CORN[c].om[0], nub = CORN[c].nub;
    const Tv = Math.sqrt(X.T2);
    let sv = 0, sg = 0, lastV = Infinity;
    for (let k = KX; k < 60; k++) {
      const nu = mul(iv(k), nub);
      const Jm = S.besselJIv(nu, mul([sqmu[0], sqmu[0]], iv(rq)));
      if (!(Jm[0] > 0)) break;
      const Dlo = I.nextDown(om / 2 * Jm[0] * Jm[0] * (R1A * R1A - rq * rq) / 2);
      const Jr = S.besselJIv(nu, mul(sqmu, iv(rHi)));
      const bk = Tv / Math.sqrt(Dlo);
      const tv = bk * Jr[1];
      sv = I.nextUp(sv + tv);
      const Jdr = S.besselJdIv(nu, mul(sqmu, iv(rHi)));
      sg = I.nextUp(sg + bk * (sqmu[1] * I.mag(Jdr) + nu[1] * Jr[1] / rLo));
      if (tv < 1e-18 && k > 6) { lastV = tv; break; }
      lastV = tv;
    }
    const q = Math.pow(rHi / rq, CORN[c].nub[0]);
    if (!(q < 0.9)) throw new Error('tail ratio not < 0.9');
    sv = I.nextUp(sv + lastV * q / (1 - q) + 1e-15);
    sg = I.nextUp(sg * (1 + q / (1 - q)) + 1e-12);
    return { sv, sg };
  }

  function expVal(c, X, tails, rI, thI) {
    const nub = CORN[c].nub, nu2 = mul(iv(2), CORN[c].nub);
    let v = mul(X.b0, S.besselJIv(I.ZERO, mul(sqmu, rI)));
    v = add(v, mul(X.b1, mul(S.besselJIv(nub, mul(sqmu, rI)), T.cos(mul(nub, thI)))));
    v = add(v, mul(X.b2, mul(S.besselJIv(nu2, mul(sqmu, rI)), T.cos(mul(nu2, thI)))));
    return [I.nextDown(v[0] - tails.sv), I.nextUp(v[1] + tails.sv)];
  }
  function expDr(c, X, tails, rI, thI) {
    const nub = CORN[c].nub, nu2 = mul(iv(2), CORN[c].nub);
    let v = mul(X.b0, mul(sqmu, S.besselJdIv(I.ZERO, mul(sqmu, rI))));
    v = add(v, mul(X.b1, mul(sqmu, mul(S.besselJdIv(nub, mul(sqmu, rI)), T.cos(mul(nub, thI))))));
    v = add(v, mul(X.b2, mul(sqmu, mul(S.besselJdIv(nu2, mul(sqmu, rI)), T.cos(mul(nu2, thI))))));
    return [I.nextDown(v[0] - tails.sg), I.nextUp(v[1] + tails.sg)];
  }

  /* the Bessel ladder ∂t² of one mode */
  function ladderTT(c, bk, kk, rI, thI) {
    const nu = kk === 0 ? I.ZERO : mul(iv(kk), CORN[c].nub);
    const x = mul(sqmu, rI);
    const Jp = S.besselJIv(add(nu, iv(2)), x);
    const Jm = kk === 0 ? S.besselJIv(iv(2), x) : S.besselJIv(sub(nu, iv(2)), x);
    const J = S.besselJIv(nu, x);
    const t1 = mul(Jp, T.cos(mul(add(nu, iv(2)), thI)));
    const t2 = mul(Jm, T.cos(mul(sub(nu, iv(2)), thI)));
    const t3 = mul(iv(2), mul(J, T.cos(mul(nu, thI))));
    return mul(bk, mul(div(MU1, iv(4)), sub(add(t1, t2), t3)));
  }

  return { sqmu, extract, tailBounds, expVal, expDr, ladderTT };
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

  const E_L2 = eig.eigenfunctionL2Error;
  const MU1 = eig.mu1;
  const WIT_P = pw.witnesses.max.value;
  const WIT_M = pw.witnesses.minDeep.value;
  const MC = makeMachinery(E_L2, MU1);
  const { sqmu } = MC;

  /* extraction at BOTH annuli; overlap is the condition of entry */
  const tips = [], tips2 = [];
  const tipSecs = [];
  for (let c = 0; c < 4; c++) {
    const tc = Date.now();
    tips.push(MC.extract(c, ANN1[c]));
    tips2.push(MC.extract(c, ANN2[c]));
    tipSecs.push(+((Date.now() - tc) / 1000).toFixed(1));
    const X = tips[c], Y = tips2[c];
    for (let k = 0; k < KX; k++) {
      const a = X.bs[k], b = Y.bs[k];
      checks.push({
        name: `corner ${'ABCD'[c]} b${k}: two-annulus enclosures intersect`,
        ok: !(a[1] < b[0] || a[0] > b[1]),
        detail: `ann1=[${a[0].toFixed(4)},${a[1].toFixed(4)}] ann2=[${b[0].toFixed(4)},${b[1].toFixed(4)}]`,
      });
    }
  }

  /* value ranges over each tip (primary extraction) */
  function tipValueRange(c) {
    const om = CORN[c].om;
    let loAll = Infinity, hiAll = -Infinity;
    for (let ir = 0; ir < 10; ir++) {
      const rHi = (ir + 1) * RTIP / 10;
      const rI = iv(ir * RTIP / 10, rHi);
      const tails = MC.tailBounds(c, tips[c], rHi);
      for (let it = 0; it < 8; it++) {
        const thI = mul(om, iv(it / 8, (it + 1) / 8));
        const v = MC.expVal(c, tips[c], tails, rI, thI);
        loAll = Math.min(loAll, v[0]); hiAll = Math.max(hiAll, v[1]);
      }
    }
    return [loAll, hiAll];
  }
  const ranges = [0, 1, 2, 3].map(tipValueRange);
  checks.push({ name: 'tip B: value-kill both sides', ok: ranges[1][1] < WIT_P && -ranges[1][0] < WIT_M, detail: `[${ranges[1][0].toFixed(3)}, ${ranges[1][1].toFixed(3)}]` });
  checks.push({ name: 'tip D: value-kill both sides', ok: ranges[3][1] < WIT_P && -ranges[3][0] < WIT_M, detail: `[${ranges[3][0].toFixed(3)}, ${ranges[3][1].toFixed(3)}]` });
  checks.push({ name: 'tip A: min-side value-kill', ok: -ranges[0][0] < WIT_M, detail: (-ranges[0][0]).toFixed(3) });
  checks.push({ name: 'tip C: max-side value-kill', ok: ranges[2][1] < WIT_P, detail: ranges[2][1].toFixed(3) });

  /* A: ∂rφ̂ < 0 on the tip */
  let radialWorst = -Infinity, innerA = null;
  {
    const c = 0;
    let ok = true;
    for (let ir = 0; ir < 25; ir++) {
      const rLo = 0.008 + ir * (RTIP - 0.008) / 25, rHi = 0.008 + (ir + 1) * (RTIP - 0.008) / 25;
      const tails = MC.tailBounds(c, tips[c], rHi, rLo);
      for (let it = 0; it < 10; it++) {
        const thI = mul(CORN[c].om, iv(it / 10, (it + 1) / 10));
        const d = MC.expDr(c, tips[c], tails, iv(rLo, rHi), thI);
        radialWorst = Math.max(radialWorst, d[1]);
        if (!(d[1] < 0)) ok = false;
      }
    }
    checks.push({ name: 'tip A: ∂rφ̂ < 0 on r ∈ [0.008, 0.11]', ok, detail: `worst ${radialWorst.toExponential(2)}` });
    const x1 = sqmu[1] * 0.008;
    const nu1 = CORN[0].nub;
    const gam = S.gammaIv(add(nu1, I.ONE));
    const b1term = I.nextUp(I.mag(tips[0].b1) * MU1[1] * (nu1[1] / 2) * Math.pow(x1 / 2, nu1[0] - 2) / gam[0] * 1.1);
    const tail8 = MC.tailBounds(0, tips[0], 0.008);
    innerA = I.nextUp(-tips[0].b0[0] * MU1[0] / 2 * (1 - x1 * x1 / 8) + b1term + tail8.sg / 0.008);
    checks.push({ name: 'tip A: ∂rφ̂/r < 0 on r ≤ 0.008 (factored inner disk)', ok: innerA < 0, detail: innerA.toFixed(3) });
  }

  /* C: min side, θ ∈ [0.35, ω]: gradient min-form */
  let minFormWorst = Infinity;
  {
    const c = 2, TH1 = 0.35;
    const om = CORN[c].om, nu1 = CORN[c].nub, nu2 = mul(iv(2), nu1);
    checks.push({ name: 'tip C: b1 certified negative (ann1)', ok: tips[c].b1[1] < 0, detail: `b1_up=${tips[c].b1[1].toFixed(3)}` });
    checks.push({ name: 'tip C: b1 certified negative (ann2)', ok: tips2[c].b1[1] < 0, detail: `b1_up=${tips2[c].b1[1].toFixed(3)}` });
    let ok = true;
    const rEdges = [];
    for (let e = 0; e <= 12; e++) rEdges.push(1e-5 * Math.pow(RTIP / 1e-5, e / 12));
    for (let e = 1; e <= 20; e++) rEdges.push(0.01 + (RTIP - 0.01) * e / 20);
    rEdges.sort((a, b) => a - b);
    for (let ir = 0; ir + 1 < rEdges.length; ir++) {
      const rLo = rEdges[ir], rHi = rEdges[ir + 1];
      const rI = iv(rLo, rHi);
      const tails = MC.tailBounds(c, tips[c], rHi, rLo);
      const J2v = S.besselJIv(nu2, mul(sqmu, rI));
      const J2d = S.besselJdIv(nu2, mul(sqmu, rI));
      const p2 = I.nextUp(I.mag(tips[c].b2) * (sqmu[1] * I.mag(J2d) + nu2[1] * I.mag(J2v) / rLo));
      const pert = I.nextUp(tails.sg + p2);
      for (let it = 0; it < 12; it++) {
        const thLo = TH1 + (om[0] - TH1) * it / 12, thHi = TH1 + (om[1] - TH1) * (it + 1) / 12;
        const R0 = neg(mul(tips[c].b0, mul(sqmu, S.besselJIv(I.ONE, mul(sqmu, rI)))));
        const R1 = mul(tips[c].b1, mul(sqmu, S.besselJdIv(nu1, mul(sqmu, rI))));
        const J1v = S.besselJIv(nu1, mul(sqmu, rI));
        const TH = div(mul(I.abs(tips[c].b1), mul(nu1, J1v)), rI);
        const cRange = T.cos(mul(nu1, iv(thLo, thHi)));
        const fAt = c2 => {
          const t1 = I.sqr(add(R0, mul(R1, c2)));
          const t2 = mul(I.sqr(TH), sub(I.ONE, I.sqr(c2)));
          return add(t1, [Math.max(0, t2[0]), t2[1]]);
        };
        let fmin = Math.min(fAt(iv(cRange[0]))[0], fAt(iv(cRange[1]))[0]);
        const A2 = sub(I.sqr(R1), I.sqr(TH));
        if (!(A2[0] > 0)) fmin = Math.min(fmin, fAt(cRange)[0]);
        const gradLo = Math.sqrt(Math.max(0, fmin)) - pert;
        minFormWorst = Math.min(minFormWorst, gradLo);
        if (!(gradLo > 0)) { ok = false; }
      }
    }
    checks.push({ name: 'tip C: |∇φ̂| > 0 on θ ∈ [0.35, ω], r ∈ [1e-5, 0.11]', ok, detail: `min ${minFormWorst.toFixed(4)}` });
    /* analytic inner piece r ≤ 1e-5 */
    const rr = 1e-5, xS = sqmu[1] * rr;
    const gam = S.gammaIv(add(nu1, I.ONE));
    const b1lo = -tips[c].b1[1];
    const thetaCoef = I.nextDown(b1lo * nu1[0] * Math.pow(sqmu[0] / 2, nu1[0]) / gam[1] * (1 - xS * xS / (4 * (nu1[0] + 1))));
    const thetaTerm = thetaCoef * Math.pow(rr, nu1[0] - 1);
    const tailInner = MC.tailBounds(c, tips[c], rr);
    const J2rr = S.besselJIv(nu2, mul(sqmu, iv(rr)));
    const p2i = I.nextUp(I.mag(tips[c].b2) * (sqmu[1] * I.mag(S.besselJdIv(nu2, mul(sqmu, iv(rr)))) + nu2[1] * J2rr[1] / rr));
    const others = I.nextUp(I.mag(tips[c].b0) * MU1[1] / 2 * rr + tailInner.sg + p2i);
    checks.push({ name: 'tip C: inner piece r ≤ 1e-5 (limit form)', ok: thetaTerm > others, detail: `θ-term ${thetaTerm.toExponential(2)} vs others ${others.toExponential(2)}` });
  }

  /* C: the wedge θ ∈ [0, 0.35]: φ̂_nn ≥ c₂ > 0 via the ladder identity */
  let wedgeWorst = Infinity, wedgeInner = null;
  {
    const c = 2, TH1 = 0.35;
    const nu1 = CORN[c].nub;
    /* ladder bridge vs float second differences (diagnostic slack 1.0) */
    for (const [rr, tt] of [[0.06, 0.15], [0.09, 0.05]]) {
      const a1m = (CORN[c].a1[0] + CORN[c].a1[1]) / 2;
      const px = VF[c][0] + rr * Math.cos(a1m + tt), py = VF[c][1] + rr * Math.sin(a1m + tt);
      const tx = Math.cos(a1m), ty = Math.sin(a1m);
      const h = 1e-4;
      const num = (UE.uFloat(px + tx * h, py + ty * h) - 2 * UE.uFloat(px, py) + UE.uFloat(px - tx * h, py - ty * h)) / (h * h);
      let lad = I.ZERO;
      for (const [bk, kk] of [[tips[c].b0, 0], [tips[c].b1, 1], [tips[c].b2, 2]])
        lad = add(lad, MC.ladderTT(c, bk, kk, iv(rr), iv(tt)));
      checks.push({
        name: `ladder bridge (r=${rr}, θ=${tt})`,
        ok: num > lad[0] - 1.0 && num < lad[1] + 1.0,
        detail: `num=${num.toFixed(3)} ladder=[${lad[0].toFixed(3)},${lad[1].toFixed(3)}]`,
      });
    }
    let ok = true;
    const rEdges = [];
    for (let e = 0; e <= 42; e++) rEdges.push(1e-6 * Math.pow(0.12 / 1e-6, e / 42));
    for (let ir = 0; ir + 1 < rEdges.length; ir++) {
      const rLo = rEdges[ir], rHi = rEdges[ir + 1];
      const rI = iv(rLo, rHi);
      const thI = iv(0, TH1);
      const tails = MC.tailBounds(c, tips[c], rHi, rLo);
      let ttUp = I.ZERO;
      for (const [bk, kk] of [[tips[c].b0, 0], [tips[c].b1, 1], [tips[c].b2, 2]])
        ttUp = add(ttUp, MC.ladderTT(c, bk, kk, rI, thI));
      let ttTail = 0;
      {
        const [, R1A] = tips[c].ann;
        const rq = 0.8 * R1A;
        const Tv = Math.sqrt(tips[c].T2);
        let last = 0;
        for (let k = KX; k < 60; k++) {
          const nu = mul(iv(k), nu1);
          const Jq = S.besselJIv(nu, mul([sqmu[0], sqmu[0]], iv(rq)));
          if (!(Jq[0] > 0)) break;
          const Dlo = I.nextDown(CORN[c].om[0] / 2 * Jq[0] * Jq[0] * (R1A * R1A - rq * rq) / 2);
          const bk = Tv / Math.sqrt(Dlo);
          const x = mul(sqmu, iv(rHi));
          const s2 = bk * MU1[1] / 4 * (I.mag(S.besselJIv(add(nu, iv(2)), x)) + I.mag(S.besselJIv(sub(nu, iv(2)), x)) + 2 * I.mag(S.besselJIv(nu, x)));
          ttTail = I.nextUp(ttTail + s2);
          if (s2 < 1e-15 && k > KX + 3) { last = s2; break; }
          last = s2;
        }
        const q = Math.pow(rHi / rq, nu1[0]);
        ttTail = I.nextUp(ttTail + last * q / (1 - q));
      }
      const phiVal = MC.expVal(c, tips[c], tails, rI, thI);
      const c2lo = I.nextDown(-MU1[1] * phiVal[1] - ttUp[1] - ttTail);
      wedgeWorst = Math.min(wedgeWorst, c2lo);
      if (!(c2lo > 0)) ok = false;
    }
    checks.push({ name: 'tip C: φ̂_nn ≥ c₂ > 0 on the wedge θ ≤ 0.35, r ∈ [1e-6, 0.12]', ok, detail: `worst c₂ ${wedgeWorst.toFixed(2)}` });
    /* inner piece r ≤ 1e-6 */
    const r6 = 1e-6;
    const tt0 = MC.ladderTT(c, tips[c].b0, 0, iv(1e-12, r6), iv(0, TH1));
    const tt2i = MC.ladderTT(c, tips[c].b2, 2, iv(1e-12, r6), iv(0, TH1));
    const tails6 = MC.tailBounds(c, tips[c], r6, r6);
    const phi6 = MC.expVal(c, tips[c], tails6, iv(1e-12, r6), iv(0, TH1));
    wedgeInner = I.nextDown(-MU1[1] * phi6[1] - tt0[1] - tt2i[1] - tails6.sv);
    checks.push({ name: 'tip C: wedge inner piece r ≤ 1e-6', ok: tips[c].b1[1] < 0 && wedgeInner > 0, detail: `c₂ ≥ ${wedgeInner.toFixed(2)}` });
  }

  const ok = checks.every(c => c.ok);
  const bsOut = (X) => ({ b0: X.b0, b1: X.b1, b2: X.b2, T2: X.T2, ann: X.ann });
  return {
    verdict: ok ? 'VERIFIED' : 'REFUSED',
    statement: 'The four corner tips (full sectors r ≤ 0.11; the C wedge to 0.12) admit no interior extremum: A by ∂rφ̂ < 0, B/D by value, C max side by value, C min side by the gradient min-form plus the ladder-identity normal-monotonicity wedge. Corner coefficients certified by big-annulus L² extraction AND re-extracted at a second annulus (enclosures must intersect — condition of entry).',
    inputs: { E_L2, mu1: MU1, witnessMax: WIT_P, witnessMinDeep: WIT_M, from: ['certs/ember-eigenpair.json', 'certs/ember-pointwise.json', 'certs/ember-defect.json'] },
    RTIP,
    tips: {
      A: { ...bsOut(tips[0]), secondAnnulus: bsOut(tips2[0]), valueRange: ranges[0], radialWorst, innerDisk: innerA },
      B: { ...bsOut(tips[1]), secondAnnulus: bsOut(tips2[1]), valueRange: ranges[1] },
      C: { ...bsOut(tips[2]), secondAnnulus: bsOut(tips2[2]), valueRange: ranges[2], minFormWorst, wedgeWorstC2: wedgeWorst, wedgeInnerC2: wedgeInner },
      D: { ...bsOut(tips[3]), secondAnnulus: bsOut(tips2[3]), valueRange: ranges[3] },
    },
    ladder: '∂t²[J_ν(kr)cos(νθ)] = (k²/4)[J_{ν+2}cos((ν+2)θ) + J_{ν−2}cos((ν−2)θ) − 2J_νcos(νθ)]',
    extractSecs: tipSecs,
    checks,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

module.exports = { run, ANN1, ANN2, makeMachinery };
