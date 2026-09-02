/* EMBER P2c-2b — the corner-tip certificates (the last lemma).  v2.

   In each corner sector φ̂ = Σ_k b_k J_{kν}(√μ₁ r)cos(kνθ) exactly.
   Design (v2, after the small-annulus v1 failed — see PHASE2.md):
   - BIG per-corner annuli (outer 0.45 at A/B, 0.42 at C/D — inside every
     sector's clearance to non-adjacent boundary, ≥ 0.578): the k=1 norms
     D₁ are then O(1e-4), extraction of b₀, b₁ is well-conditioned, and
     the Parseval tail evaluated at r ≤ 0.11 gains (r/0.35)^{kν} ratios.
   - Extract ONLY b₀, b₁; everything k ≥ 2 lives in the certified tail.
   - Quadrature: centered first-order cells with dev = (|∇u(center)| +
     HBcell·halfdiag)·halfdiag, HBcell = per-cell far-fan Hessian bound
     (own fan handled EXACTLY via angular orthogonality — the singular
     part never meets the 2-D quadrature).
   Tip arguments (r ≤ RTIP = 0.11, covering every interior point within
   0.11 of a vertex, by convexity):
     A: min-side value kill; max-side radial ∂rφ̂ < 0 (cells + factored
        inner disk; ν_A = 2.417 > 2 so the b₀ term dominates as r→0).
     B, D: value kill on both sides.
     C: max-side value kill; min-side split at θ₁ = 0.35 — gradient
        min-form on [θ₁, ω] (quadratic in c = cos νθ), normal
        monotonicity (φ̂_nn ≥ c₂ > 0, exact 2nd-order Taylor from the
        Neumann edge) on the wedge [0, θ₁].
   Witnesses: φ̂(w₊) ≥ 2.126029, −φ̂(w₋′) ≥ 1.993811 (certified). */
'use strict';

const I = require('../../lib/eqcert/interval.js');
const T = require('../../lib/eqcert/transcendental.js');
const Q = require('../../lib/eqcert/rational.js');
const S = require('./ivspecial.js');
const MPS = require('./run-p2b-mps.js');

const { iv, add, sub, mul, div, neg } = I;
let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}
const r_ = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));
function ratToIv(a) {
  const q0 = Q.toDouble(a);
  let lo = q0, hi = q0;
  for (let w = 0; w < 60; w++) {
    if (Q.inClosed(a, lo, hi)) return [lo, hi];
    lo = I.nextDown(lo); hi = I.nextUp(hi);
  }
  throw new Error('ratToIv failed');
}
const VQ = [[r_(0), r_(0)], [r_(1), r_(0)], [r_(17, 20), r_(9, 10)], [r_(1, 4), r_(9, 10)]];
const V = VQ.map(p => p.map(ratToIv));
const VF = VQ.map(p => p.map(Q.toDouble));
function angleOfIv(dx, dy) {
  if (dx[0] > 0) return S.atanIv(div(dy, dx));
  if (dx[1] < 0) {
    if (dy[0] >= 0) return sub(T.PI, S.atanIv(div(dy, neg(dx))));
    if (dy[1] <= 0) return add(T.PI, S.atanIv(div(neg(dy), neg(dx))));
    return sub(T.PI, S.atanIv(div(dy, neg(dx))));
  }
  if (dy[0] > 0) return sub(T.HALF_PI, S.atanIv(div(dx, dy)));
  if (dy[1] < 0) return sub(neg(T.HALF_PI), S.atanIv(div(dx, neg(dy))));
  throw new Error('angleOfIv failed');
}
const CORN = [];
for (let c = 0; c < 4; c++) {
  const Vv = V[c], Vn = V[(c + 1) % 4], Vp = V[(c + 3) % 4];
  const a1 = angleOfIv(sub(Vn[0], Vv[0]), sub(Vn[1], Vv[1]));
  const a2 = angleOfIv(sub(Vp[0], Vv[0]), sub(Vp[1], Vv[1]));
  let om = sub(a2, a1);
  if (om[1] <= 0) om = add(om, T.TWO_PI);
  CORN.push({ V: Vv, a1, om, nub: div(T.PI, om) });
}
const K_FAN = 10, LAM = 12.021687243;
const scan = MPS.defectAt(K_FAN, LAM);
const A_COEF = Array.from(scan.coef);
const sqlamIv = S.sqrtIv(iv(LAM));

const E_L2 = 6.5353e-5;
const MU1 = [12.020976127, 12.022398359];
const sqmu = S.sqrtIv(MU1);
const WIT_P = 2.126029, WIT_M = 1.993811;
const RTIP = 0.11;
const ANN = [[0.10, 0.45], [0.10, 0.45], [0.08, 0.42], [0.08, 0.42]]; // per corner [r0, r1]

/* own fan of corner c in its frame */
function fanEval(c, rI, thI) {
  let val = I.ZERO;
  const xB = mul(sqlamIv, rI);
  for (let k = 0; k < K_FAN; k++) {
    const a = A_COEF[c * K_FAN + k];
    if (a === 0) continue;
    const nu = k === 0 ? I.ZERO : mul(iv(k), CORN[c].nub);
    val = add(val, mul(iv(a), mul(S.besselJIv(nu, xB), T.cos(mul(nu, thI)))));
  }
  return val;
}
function uEvalXY(x, y, needGrad) {
  let val = I.ZERO, gx = I.ZERO, gy = I.ZERO;
  for (let c = 0; c < 4; c++) {
    const C = CORN[c];
    const dx = sub(x, C.V[0]), dy = sub(y, C.V[1]);
    const r2raw = add(I.sqr(dx), I.sqr(dy));
    const r2 = [Math.max(0, r2raw[0]), r2raw[1]];
    const r = S.sqrtIv(r2);
    const phi = angleOfIv(dx, dy);
    let th = sub(phi, C.a1);
    if (th[1] < 0) th = add(th, T.TWO_PI);
    if (th[0] > C.om[1] + 0.02) th = sub(th, T.TWO_PI);
    const xB = mul(sqlamIv, r);
    for (let k = 0; k < K_FAN; k++) {
      const a = A_COEF[c * K_FAN + k];
      if (a === 0) continue;
      const nu = k === 0 ? I.ZERO : mul(iv(k), C.nub);
      const J = S.besselJIv(nu, xB);
      const ang = mul(nu, th);
      const ct = T.cos(ang);
      val = add(val, mul(iv(a), mul(J, ct)));
      if (needGrad) {
        const Jd = S.besselJdIv(nu, xB);
        const st = T.sin(ang);
        const drc = mul(sqlamIv, mul(Jd, ct));
        const dth = k === 0 ? I.ZERO : neg(div(mul(nu, mul(J, st)), r));
        const cp = T.cos(phi), sp = T.sin(phi);
        gx = add(gx, mul(iv(a), sub(mul(drc, cp), mul(dth, sp))));
        gy = add(gy, mul(iv(a), add(mul(drc, sp), mul(dth, cp))));
      }
    }
  }
  return { val, gx, gy };
}

/* per-cell far-fan Hessian bound (fan cc evaluated at distance range) */
function farHessCell(c, px, py) {
  let B2 = 0;
  for (let cc = 0; cc < 4; cc++) {
    if (cc === c) continue;
    const d = Math.hypot(px - VF[cc][0], py - VF[cc][1]);
    const rlo = Math.max(0.05, d - 0.02), rhi = d + 0.02;
    const xB = mul(sqlamIv, iv(rlo, rhi));
    for (let k = 0; k < K_FAN; k++) {
      const a = Math.abs(A_COEF[cc * K_FAN + k]);
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

function int1D(f, a, b, n) {
  let lo = 0, hi = 0;
  const h = (b - a) / n;
  for (let m = 0; m < n; m++) {
    const e = f(iv(a + m * h, a + (m + 1) * h));
    lo = I.nextDown(lo + e[0] * h); hi = I.nextUp(hi + e[1] * h);
  }
  return [lo, hi];
}

/* ---------- extraction: b0, b1, b2 + Parseval tail (2nd-order cells) ----
   Flat-measure midpoint in (r,θ): ∫∫ g dr dθ = Σ g(center)·hr·hθ + err,
   err ≤ (|g_rr|hr² + |g_θθ|hθ²)/24 per cell. For g = f·w (f = u-far or u²,
   w = J·cos·r analytic): |D²g| ≤ |f||D²w| + 2|Df||Dw| + |D²f||w|, with
   u's polar-derivative bounds from |∇u|(point) and the far-Hessian HB
   (the own fan is handled EXACTLY and never meets the quadrature). */
const KX = 3; // extracted modes 0..KX−1; tails start at KX
function extract(c) {
  const C = CORN[c], om = C.om, nub = C.nub;
  const [R0A, R1A] = ANN[c];
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
      const g = uEvalXY(iv(px), iv(py), true);
      const gm = Math.sqrt(I.mag(g.gx) ** 2 + I.mag(g.gy) ** 2);
      const HB = farHessCell(c, px, py);
      const own = fanEval(c, rcI, iv(thc));
      const farC = sub(g.val, own);
      const fAbs = I.mag(farC), uAbs = I.mag(g.val);
      // honest own-fan derivative bounds at this radius:
      //   |∇own| ≤ Σ|a_k|(√λ|J'| + kν|J|/r),
      //   |D²own| ≤ Σ|a_k|(λ|J''| + 2kν√λ|J'|/r + kν(kν+1)|J|/r²)
      let og1 = 0, og2 = 0;
      for (let kk = 0; kk < K_FAN; kk++) {
        const ak = Math.abs(A_COEF[c * K_FAN + kk]);
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
        const Jd = S.besselJdIv(nu, mul(sqmu, rcI));
        const ct = T.cos(mul(nu, iv(thc)));
        const w = mul(mul(J, ct), rcI);
        // w-derivative magnitudes (r,θ): |w_r| ≤ |√μJ'·r| + |J|; |w_θ| ≤ kν|J|r
        // |w_rr| ≤ μ|J''|r + 2√μ|J'|; |w_θθ| ≤ (kν)²|J|r
        const nuv = nu[1];
        const Jm = I.mag(J), Jdm = I.mag(Jd);
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
      // ‖u‖²: g2 = u²·r; |D²g2| ≤ (2|∇u|²+2|u|HBu)·r + 4|u||∇u| + 2|u|²/r-ish
      const uHess = fHess;                 // |D²u| ≤ far-Hessian + own-fan Hessian
      const uGrad = fGrad;                 // |∇u| ≤ |∇u(pt)| + own bound (conservative)
      const g2rr = I.nextUp((2 * uGrad * uGrad + 2 * uAbs * uHess) * rc + 4 * uAbs * uGrad);
      const g2tt = I.nextUp((2 * (uGrad * rc) * (uGrad * rc) + 2 * uAbs * (uHess * rc * rc + uGrad * rc)) * rc);
      const err2 = I.nextUp((g2rr * hr * hr + g2tt * hth * hth) / 24 * hr * hth);
      const s2 = I.sqr(g.val);
      uN2hi = I.nextUp(uN2hi + s2[1] * rc * hr * hth + err2);
    }
  }
  // own-fan cross integrals + norms
  const Ds = [], Ns = [];
  for (let k = 0; k < KX; k++) {
    const nu = nus[k];
    const wk = k === 0 ? om : div(om, iv(2));
    const Dk = mul(wk, int1D(rI => mul(I.sqr(S.besselJIv(nu, mul(sqmu, rI))), rI), R0A, R1A, 300));
    const Xk = mul(wk, int1D(rI => mul(mul(S.besselJIv(nu, mul(sqlamIv, rI)), S.besselJIv(nu, mul(sqmu, rI))), rI), R0A, R1A, 300));
    const ak = A_COEF[c * K_FAN + k] || 0;
    const Nk = add(mul(iv(ak), Xk), M[k]);
    const ek = I.nextUp(E_L2 * Math.sqrt(Dk[1]));
    Ns.push([Nk[0] - ek, Nk[1] + ek]);
    Ds.push(Dk);
  }
  const bs = Ns.map((N, k) => div(N, Ds[k]));
  // Parseval tail via N-form: explained_k ≥ mig(N)²/D_up
  const nUp = I.nextUp(Math.pow(Math.sqrt(uN2hi) + E_L2, 2));
  let expl = 0;
  for (let k = 0; k < KX; k++) {
    const mig = Ns[k][0] > 0 ? Ns[k][0] : (Ns[k][1] < 0 ? -Ns[k][1] : 0);
    expl = I.nextDown(expl + mig * mig / Ds[k][1]);
  }
  const T2 = Math.max(0, I.nextUp(nUp - expl));
  return { b0: bs[0], b1: bs[1], b2: bs[2], bs, Ds, T2 };
}

/* pointwise tails over an r-BAND [rLo, rHi]: J-factors at rHi (increasing —
   arguments stay below the first Bessel max for kν ≥ KX·ν), divisions at
   rLo. Called with rLo = rHi for point evaluations. */
function tailBounds(c, T2, rHi, rLoIn) {
  const rLo = Math.max(rLoIn === undefined ? rHi : rLoIn, 1e-9);
  const [, R1A] = ANN[c];
  const rq = 0.8 * R1A;
  const om = CORN[c].om[0], nub = CORN[c].nub;
  const Tv = Math.sqrt(T2);
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
  const q = Math.pow(rHi / rq, nub[0]);
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
/* tail HESSIAN bound: Σ_{k≥KX} b̄_k·[μ|J″| + 2ν_k√μ|J'|/r + ν_k(ν_k+1)|J|/r²] */
function tailHess(c, T2, rHi2, rLo2) {
  const r = rHi2, rD = Math.max(rLo2 === undefined ? rHi2 : rLo2, 1e-9);
  const [, R1A] = ANN[c];
  const rq = 0.8 * R1A;
  const om = CORN[c].om[0], nub = CORN[c].nub;
  const Tv = Math.sqrt(T2);
  let sh = 0, last = Infinity;
  for (let k = KX; k < 60; k++) {
    const nu = mul(iv(k), nub);
    const Jm = S.besselJIv(nu, mul([sqmu[0], sqmu[0]], iv(rq)));
    if (!(Jm[0] > 0)) break;
    const Dlo = I.nextDown(om / 2 * Jm[0] * Jm[0] * (R1A * R1A - rq * rq) / 2);
    const bk = Tv / Math.sqrt(Dlo);
    const Jr = I.mag(S.besselJIv(nu, mul(sqmu, iv(r))));
    const Jdr = I.mag(S.besselJdIv(nu, mul(sqmu, iv(Math.max(r, 1e-9)))));
    const nuv = nu[1];
    
    const Jdd = (1 + nuv * nuv / (sqmu[0]*rD * sqmu[0]*rD)) * Jr + Jdr / (sqmu[0]*rD);
    const term = bk * (MU1[1] * Jdd + 2 * nuv * sqmu[1] * Jdr / rD + nuv * (nuv + 1) * Jr / (rD * rD));
    sh = I.nextUp(sh + term);
    if (term < 1e-15 && k > KX + 4) { last = term; break; }
    last = term;
  }
  const q = Math.pow(r / rq, nub[0]);
  return I.nextUp(sh + (Number.isFinite(last) ? last : 0) * q / (1 - q) + 1e-12);
}

/* ---------- run ---------- */
const tips = [];
for (let c = 0; c < 4; c++) {
  const t0 = Date.now();
  tips.push(extract(c));
  const X = tips[c];
  console.log(`corner ${'ABCD'[c]}: b0=[${X.b0[0].toFixed(4)},${X.b0[1].toFixed(4)}] b1=[${X.b1[0].toFixed(4)},${X.b1[1].toFixed(4)}] T²=${X.T2.toExponential(2)} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

/* value ranges over each tip */
function tipValueRange(c) {
  const om = CORN[c].om;
  let loAll = Infinity, hiAll = -Infinity;
  for (let ir = 0; ir < 10; ir++) {
    const rHi = (ir + 1) * RTIP / 10;
    const rI = iv(ir * RTIP / 10, rHi);
    const tails = tailBounds(c, tips[c].T2, rHi);
    for (let it = 0; it < 8; it++) {
      const thI = mul(om, iv(it / 8, (it + 1) / 8));
      const v = expVal(c, tips[c], tails, rI, thI);
      loAll = Math.min(loAll, v[0]); hiAll = Math.max(hiAll, v[1]);
    }
  }
  return [loAll, hiAll];
}
const ranges = [0, 1, 2, 3].map(tipValueRange);
for (let c = 0; c < 4; c++)
  console.log(`tip ${'ABCD'[c]} value range: [${ranges[c][0].toFixed(4)}, ${ranges[c][1].toFixed(4)}]`);

check('tip B: value-kill both sides', ranges[1][1] < WIT_P && -ranges[1][0] < WIT_M,
  `[${ranges[1][0].toFixed(3)}, ${ranges[1][1].toFixed(3)}]`);
check('tip D: value-kill both sides', ranges[3][1] < WIT_P && -ranges[3][0] < WIT_M,
  `[${ranges[3][0].toFixed(3)}, ${ranges[3][1].toFixed(3)}]`);
check('tip A: min-side value-kill', -ranges[0][0] < WIT_M, (-ranges[0][0]).toFixed(3));
check('tip C: max-side value-kill', ranges[2][1] < WIT_P, ranges[2][1].toFixed(3));

/* A: ∂rφ̂ < 0 */
{
  const c = 0;
  let ok = true, worst = -Infinity;
  for (let ir = 0; ir < 25; ir++) {
    const rLo = 0.008 + ir * (RTIP - 0.008) / 25, rHi = 0.008 + (ir + 1) * (RTIP - 0.008) / 25;
    const tails = tailBounds(c, tips[c].T2, rHi, rLo);
    for (let it = 0; it < 10; it++) {
      const thI = mul(CORN[c].om, iv(it / 10, (it + 1) / 10));
      const d = expDr(c, tips[c], tails, iv(rLo, rHi), thI);
      worst = Math.max(worst, d[1]);
      if (!(d[1] < 0)) ok = false;
    }
  }
  check('tip A: ∂rφ̂ < 0 on r ∈ [0.008, 0.11]', ok, `worst ${worst.toExponential(2)}`);
  // inner disk r ≤ 0.008: factored by r
  const x1 = sqmu[1] * 0.008;
  const nu1 = CORN[0].nub;
  const gam = S.gammaIv(add(nu1, I.ONE));
  const b1term = I.nextUp(I.mag(tips[0].b1) * MU1[1] * (nu1[1] / 2) * Math.pow(x1 / 2, nu1[0] - 2) / gam[0] * 1.1);
  const tail8 = tailBounds(0, tips[0].T2, 0.008);
  const innerUp = I.nextUp(-tips[0].b0[0] * MU1[0] / 2 * (1 - x1 * x1 / 8) + b1term + tail8.sg / 0.008);
  check('tip A: ∂rφ̂/r < 0 on r ≤ 0.008', innerUp < 0, innerUp.toFixed(3));
}

/* C: min-side, θ ∈ [0.35, ω]: gradient min-form (modes 0,1; mode 2 + tails
   as perturbation), log-spaced r-bands down to 1e-5, analytic inner piece */
{
  const c = 2, TH1 = 0.35;
  const om = CORN[c].om, nu1 = CORN[c].nub, nu2 = mul(iv(2), nu1);
  check('tip C: b1 is certified negative', tips[c].b1[1] < 0, `b1_up=${tips[c].b1[1].toFixed(3)}`);
  let ok = true, worstMin = Infinity;
  const rEdges = [];
  for (let e = 0; e <= 12; e++) rEdges.push(1e-5 * Math.pow(RTIP / 1e-5, e / 12));
  // refine the upper decade linearly too
  for (let e = 1; e <= 20; e++) rEdges.push(0.01 + (RTIP - 0.01) * e / 20);
  rEdges.sort((a, b) => a - b);
  for (let ir = 0; ir + 1 < rEdges.length; ir++) {
    const rLo = rEdges[ir], rHi = rEdges[ir + 1];
    const rI = iv(rLo, rHi);
    const tails = tailBounds(c, tips[c].T2, rHi, rLo);
    // mode-2 full magnitude as perturbation
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
      worstMin = Math.min(worstMin, gradLo);
      if (!(gradLo > 0)) { ok = false; }
    }
  }
  check('tip C: |∇φ̂| > 0 on θ ∈ [0.35, ω], r ∈ [1e-5, 0.11]', ok, `min ${worstMin.toFixed(4)}`);
  // analytic inner piece r ≤ 1e-5: with R1-coef = Θ-coef in the r→0 limit,
  // f → Θ²(c² + 1 − c²) = Θ², so |∇| ≥ Θcoef·r^{ν−1}(1−δ) − R0coef·r − pert(r);
  // the ratio (R0coef·r)/(Θcoef·r^{ν−1}) = C·r^{2−ν} shrinks as r ↓, so one
  // endpoint check at r = 1e-5 suffices.
  const rr = 1e-5, xS = sqmu[1] * rr;
  const gam = S.gammaIv(add(nu1, I.ONE));
  const b1lo = -tips[c].b1[1];
  const thetaCoef = I.nextDown(b1lo * nu1[0] * Math.pow(sqmu[0] / 2, nu1[0]) / gam[1] * (1 - xS * xS / (4 * (nu1[0] + 1))));
  const thetaTerm = thetaCoef * Math.pow(rr, nu1[0] - 1);
  const tailInner = tailBounds(c, tips[c].T2, rr);
  const J2rr = S.besselJIv(nu2, mul(sqmu, iv(rr)));
  const p2i = I.nextUp(I.mag(tips[c].b2) * (sqmu[1] * I.mag(S.besselJdIv(nu2, mul(sqmu, iv(rr)))) + nu2[1] * J2rr[1] / rr));
  const others = I.nextUp(I.mag(tips[c].b0) * MU1[1] / 2 * rr + tailInner.sg + p2i);
  check('tip C: inner piece r ≤ 1e-5 (limit form)', thetaTerm > others,
    `θ-term ${thetaTerm.toExponential(2)} vs others ${others.toExponential(2)}`);
}
/* C: min-side, θ ∈ [0, 0.35]: normal monotonicity φ̂_nn ≥ c₂ > 0.
   φ̂_tt via the BESSEL LADDER identity (t̂ = the θ=0 ray = the top edge):
     ∂t²[J_ν(kr)cos(νθ)] = (k²/4)[J_{ν+2}cos((ν+2)θ) + J_{ν−2}cos((ν−2)θ)
                                    − 2 J_ν cos(νθ)]
   (∂z, ∂z̄ ladder for Helmholtz solutions). The polar-split pieces diverge
   individually like r^{ν−2} with cancelling signs invisible to interval
   arithmetic; the ladder form is exact and sign-explicit — mode 1 has
   b₁ < 0 × J_{ν−2} > 0 × cos((ν−2)θ) > 0, so its singular piece HELPS c₂
   at every radius, automatically. Verified below against float second
   differences (bridge). */
function ladderTT(c, bk, kk, rI, thI) {
  const nu = kk === 0 ? I.ZERO : mul(iv(kk), CORN[c].nub);
  const x = mul(sqmu, rI);
  const Jp = S.besselJIv(add(nu, iv(2)), x);
  // J_{ν−2}: for mode 0 the order is exactly −2 (integer): J_{−2} = J_{2};
  // otherwise a negative FRACTIONAL order > −1 handled by the series.
  const Jm = kk === 0 ? S.besselJIv(iv(2), x) : S.besselJIv(sub(nu, iv(2)), x);
  const J = S.besselJIv(nu, x);
  const t1 = mul(Jp, T.cos(mul(add(nu, iv(2)), thI)));
  const t2 = mul(Jm, T.cos(mul(sub(nu, iv(2)), thI)));
  const t3 = mul(iv(2), mul(J, T.cos(mul(nu, thI))));
  return mul(bk, mul(div(MU1, iv(4)), sub(add(t1, t2), t3)));
}
{
  const c = 2, TH1 = 0.35;
  const nu1 = CORN[c].nub;
  // bridge: ladder φ̂_tt (modes 0..2) vs float second difference of u along
  // the top-edge direction at interior wedge points
  const csF2 = MPS.corners();
  const uF2 = (x, y) => {
    const bv = MPS.basisEval(csF2, K_FAN, Math.sqrt(LAM), x, y, false);
    let s2 = 0;
    for (let i2 = 0; i2 < A_COEF.length; i2++) s2 += A_COEF[i2] * bv.vals[i2];
    return s2;
  };
  for (const [rr, tt] of [[0.06, 0.15], [0.09, 0.05]]) {
    const a1m = (CORN[c].a1[0] + CORN[c].a1[1]) / 2;
    const px = VF[c][0] + rr * Math.cos(a1m + tt), py = VF[c][1] + rr * Math.sin(a1m + tt);
    const tx = Math.cos(a1m), ty = Math.sin(a1m);
    const h = 1e-4;
    const num = (uF2(px + tx * h, py + ty * h) - 2 * uF2(px, py) + uF2(px - tx * h, py - ty * h)) / (h * h);
    let lad = I.ZERO;
    for (const [bk, kk] of [[tips[c].b0, 0], [tips[c].b1, 1], [tips[c].b2, 2]])
      lad = add(lad, ladderTT(c, bk, kk, iv(rr), iv(tt)));
    const slack = 1.0; // tail-tt + (u − φ̂) second-difference slack; diagnostic only
    check(`ladder bridge (r=${rr}, θ=${tt})`, num > lad[0] - slack && num < lad[1] + slack,
      `num=${num.toFixed(3)} ladder=[${lad[0].toFixed(3)},${lad[1].toFixed(3)}]`);
  }
  let ok = true, worst = Infinity;
  const rEdges = [];
  for (let e = 0; e <= 42; e++) rEdges.push(1e-6 * Math.pow(0.12 / 1e-6, e / 42));
  for (let ir = 0; ir + 1 < rEdges.length; ir++) {
    const rLo = rEdges[ir], rHi = rEdges[ir + 1];
    const rI = iv(rLo, rHi);
    const thI = iv(0, TH1);
    const tails = tailBounds(c, tips[c].T2, rHi, rLo);
    let ttUp = I.ZERO;
    for (const [bk, kk] of [[tips[c].b0, 0], [tips[c].b1, 1], [tips[c].b2, 2]])
      ttUp = add(ttUp, ladderTT(c, bk, kk, rI, thI));
    // tail tt via the ladder form at rHi (J's increasing on our arguments)
    let ttTail = 0;
    {
      const [, R1A] = ANN[c];
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
    const phiVal = expVal(c, tips[c], tails, rI, thI);
    const c2lo = I.nextDown(-MU1[1] * phiVal[1] - ttUp[1] - ttTail);
    worst = Math.min(worst, c2lo);
    if (!(c2lo > 0)) ok = false;
  }
  check('tip C: φ̂_nn ≥ c₂ > 0 on the wedge θ ≤ 0.35, r ∈ [1e-6, 0.12]', ok, `worst c₂ ${worst.toFixed(2)}`);
  // inner piece r ≤ 1e-6: φ̂ → b0; mode-0 tt → −b0·μ/2 (positive, bounded);
  // mode-1 tt ≤ 0 (b1 < 0 certified, J_{ν−2} > 0, cos((ν−2)θ) > 0) — dropped;
  // mode-2 and tails vanish like r^{2ν−2}:
  const r6 = 1e-6;
  const tt0 = ladderTT(c, tips[c].b0, 0, iv(1e-12, r6), iv(0, TH1));
  const tt2i = ladderTT(c, tips[c].b2, 2, iv(1e-12, r6), iv(0, TH1));
  const tails6 = tailBounds(c, tips[c].T2, r6, r6);
  const phi6 = expVal(c, tips[c], tails6, iv(1e-12, r6), iv(0, TH1));
  const c2inner = I.nextDown(-MU1[1] * phi6[1] - tt0[1] - tt2i[1] - tails6.sv);
  check('tip C: wedge inner piece r ≤ 1e-6', tips[c].b1[1] < 0 && c2inner > 0, `c₂ ≥ ${c2inner.toFixed(2)}`);
}

console.log(failures ? `\nFAILURES: ${failures}`
  : '\nALL PASS — four tips certified; with core + collar the THEOREM is complete.');
process.exit(failures ? 1 : 0);
