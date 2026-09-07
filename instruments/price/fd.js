/* fd.js — a finite-difference solver for the same price-formation system, in floats.
   instruments/price · cert-machine · 2026-09-07

   A PORT, NOT A LIFT. This is the MPR kernel of the source lab (sin-mfg research/mfg-lab/
   mfg-lab.html, module `const MPR=(()=>{`, kernel sha256 65c89093…, artifact sha256 37c0e3bd…)
   written again here with three generalisations: the domain [xa, xb] is a parameter (the lab
   fixes [0, 1] — the battery box), a running set-point potential η(x − κ)²/2 can be switched
   on, and the state is returned instead of drawn. With the lab's parameters it reproduces the
   lab's price to the last bit (FINDINGS_LIT.md); nothing here is used as an authority.

   THE SCHEME (the lab's): implicit upwind HJB backward in time with the payment inside the
   Lagrangian, implicit upwind Fokker–Planck forward with NO-FLUX walls, the clearing map
   ϖ ← −Q − ∫u_x m / ∫m, damped and accelerated by Anderson-1 with the lab's cooling rule,
   the residual measured BEFORE the step it judges, warm-started at a volume-calibrated
   posted tariff. c = 1 throughout, as in the lab.

   WHAT THIS IS FOR. Two things and no more: (i) on a domain wide enough that the walls never
   bind, its price must approach the exact closed form of price.js as the mesh refines — a
   check on the closed form and on the port at once; (ii) on the lab's own box it MEASURES how
   far a walled fleet's price sits from the unconstrained one, and whether the walls keep the
   energy the market cleared. Both are floats; the report draws them as such. */
'use strict';

function makeTri(n) {
  const cp = new Float64Array(n), dp = new Float64Array(n);
  return function (a, b, c, d, out) {
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (let i = 1; i < n; i++) { const w = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / w; dp[i] = (d[i] - a[i] * dp[i - 1]) / w; }
    out[n - 1] = dp[n - 1];
    for (let i = n - 2; i >= 0; i--) out[i] = dp[i] - cp[i] * out[i + 1];
  };
}
const bump = (t, c, wd) => Math.exp(-((t - c) ** 2) / (2 * wd * wd));

/* the lab's supply scenario at its four sliders (peak cut, midday width, adequacy, σ) — bit-identical to makeQ */
function labScenario(o) {
  const NX = 120, NT = 240, T = 1.0, H = 1 / (NX - 1), DT = T / NT, XSOC = 0.85;
  const apk = o.apk, aw = o.aw, adeq = o.adeq, sig = o.sig;
  const shape = new Float64Array(NT + 1); let integ = 0;
  for (let n = 0; n <= NT; n++) {
    const t = n * DT;
    shape[n] = Math.max(0.05, 1 - apk * bump(t, 0.10, 0.10) + aw * bump(t, 0.50, 0.17) - 0.45 * bump(t, 0.99, 0.07));
    integ += shape[n] * DT;
  }
  const qbar = adeq * (XSOC - 0.30) / integ;
  const Q = new Float64Array(NT + 1); for (let n = 0; n <= NT; n++) Q[n] = qbar * shape[n];
  const xs = new Float64Array(NX); for (let i = 0; i < NX; i++) xs[i] = i * H;
  const m0 = new Float64Array(NX); let s0 = 0;
  for (let i = 0; i < NX; i++) { m0[i] = Math.exp(-((xs[i] - 0.30) ** 2) / (2 * 0.12 * 0.12)); s0 += m0[i]; }
  for (let i = 0; i < NX; i++) m0[i] /= s0 * H;
  return { xa: 0, xb: 1, NX, NT, T, nu: 0.5 * sig * sig, gamma: 2 * 6.0, zeta: XSOC, eta: 0, kappa: 0, Q, m0, xs, TOL: 1e-9, MAX_ITER: 200, THMIX: 0.35 };
}

/* the solver: cfg = {xa, xb, NX, NT, T, nu, gamma, zeta, eta, kappa, Q, m0, TOL, MAX_ITER, THMIX, walls: 'lab' (default) | 'constrained', clearing: 'control' (default, the lab's) | 'flux'} */
function solve(cfg) {
  const { NX, NT, T, nu, gamma, zeta, eta, kappa, Q, m0 } = cfg;
  const H = (cfg.xb - cfg.xa) / (NX - 1), DT = T / NT;
  const TOL = cfg.TOL || 1e-9, MAX_ITER = cfg.MAX_ITER || 200, THMIX = cfg.THMIX || 0.35;
  const xs = new Float64Array(NX); for (let i = 0; i < NX; i++) xs[i] = cfg.xa + i * H;
  const tri = makeTri(NX);
  const A = new Float64Array(NX), B = new Float64Array(NX), C = new Float64Array(NX), D = new Float64Array(NX);
  const ap = new Float64Array(NX + 1), am = new Float64Array(NX + 1);
  const V = new Float64Array(NX); for (let i = 0; i < NX; i++) V[i] = 0.5 * eta * (xs[i] - kappa) ** 2;
  const rd = DT * nu / (H * H), rh = DT / H;
  const constrained = cfg.walls === 'constrained';

  function solveHJB(w, U) {
    const uT = U.subarray(NT * NX);
    for (let i = 0; i < NX; i++) uT[i] = 0.5 * gamma * (xs[i] - zeta) ** 2;
    for (let n = NT - 1; n >= 0; n--) {
      const uN = U.subarray((n + 1) * NX, (n + 2) * NX), uC = U.subarray(n * NX, (n + 1) * NX);
      const wn = w[n + 1];
      for (let i = 0; i < NX; i++) {
        const pm = ((i > 0) ? (uN[i] - uN[i - 1]) / H : 0) + wn, pp = ((i < NX - 1) ? (uN[i + 1] - uN[i]) / H : 0) + wn;
        const fL = (i > 0) ? 1 : 0, fR = (i < NX - 1) ? 1 : 0;
        /* the lab's walls: a missing neighbour counts as u_x = 0, so a wall cell may still point its
           control INTO the wall and be paid the Lagrangian for energy the Fokker–Planck wall then
           discards. The constrained walls forbid that control: no leftward motion at xa, no
           rightward at xb — the state-constraint boundary condition. */
        const vm = (constrained && !fL) ? 0 : Math.max(pm, 0), vp = (constrained && !fR) ? 0 : Math.min(pp, 0);
        A[i] = -rd * fL - rh * vm; C[i] = -rd * fR + rh * vp;
        B[i] = 1 + rd * (fL + fR) + rh * vm - rh * vp;
        D[i] = uN[i] + DT * (0.5 * (vm * vm + vp * vp) - wn * (vm + vp)) + DT * V[i];
      }
      tri(A, B, C, D, uC);
    }
  }
  function solveFP(U, w, M) {
    M.subarray(0, NX).set(m0);
    for (let n = 0; n < NT; n++) {
      const u = U.subarray(n * NX, (n + 1) * NX), m = M.subarray(n * NX, (n + 1) * NX), mNew = M.subarray((n + 1) * NX, (n + 2) * NX);
      const wn = w[n];
      ap[0] = am[0] = ap[NX] = am[NX] = 0;
      for (let i = 0; i < NX - 1; i++) { const s = (u[i + 1] - u[i]) / H + wn; ap[i + 1] = Math.max(-s, 0); am[i + 1] = Math.min(-s, 0); }
      for (let i = 0; i < NX; i++) {
        const fL = (i > 0) ? 1 : 0, fR = (i < NX - 1) ? 1 : 0;
        A[i] = -rd * fL - rh * ap[i]; C[i] = -rd * fR + rh * am[i + 1];
        B[i] = 1 + rd * (fL + fR) + rh * ap[i + 1] - rh * am[i];
        D[i] = m[i];
      }
      tri(A, B, C, D, mNew);
    }
  }
  function uxC(u, i) {
    if (i === 0) return (u[1] - u[0]) / H;
    if (i === NX - 1) return (u[NX - 1] - u[NX - 2]) / H;
    return (u[i + 1] - u[i - 1]) / (2 * H);
  }
  function demand(U, M, w, Da) {
    for (let n = 0; n <= NT; n++) {
      const u = U.subarray(n * NX, (n + 1) * NX), m = M.subarray(n * NX, (n + 1) * NX);
      let s = 0; for (let i = 0; i < NX; i++) s += -(uxC(u, i) + w[n]) * m[i];
      Da[n] = s * H;
    }
  }
  function priceFrom(U, M, wOut) {
    for (let n = 0; n <= NT; n++) {
      const u = U.subarray(n * NX, (n + 1) * NX), m = M.subarray(n * NX, (n + 1) * NX);
      let s = 0, mass = 0; for (let i = 0; i < NX; i++) { s += uxC(u, i) * m[i]; mass += m[i]; }
      wOut[n] = -Q[n] - s * H / (mass * H);
    }
  }

  /* FLUX CLEARING (ours, not the lab's): the cleared quantity is the discrete mean velocity of
     the Fokker–Planck step itself, so the fleet's mean charge moves by exactly DT·Q_n per step
     and no energy can vanish in a wall. One implicit FP step is monotone non-increasing in the
     price, so the price that clears it is found by bisection; the sweep is forward in time. */
  const mNew = new Float64Array(NX);
  function meanStep(u, m, wn, out) {
    ap[0] = am[0] = ap[NX] = am[NX] = 0;
    for (let i = 0; i < NX - 1; i++) { const s = (u[i + 1] - u[i]) / H + wn; ap[i + 1] = Math.max(-s, 0); am[i + 1] = Math.min(-s, 0); }
    for (let i = 0; i < NX; i++) {
      const fL = (i > 0) ? 1 : 0, fR = (i < NX - 1) ? 1 : 0;
      A[i] = -rd * fL - rh * ap[i]; C[i] = -rd * fR + rh * am[i + 1];
      B[i] = 1 + rd * (fL + fR) + rh * ap[i + 1] - rh * am[i];
      D[i] = m[i];
    }
    tri(A, B, C, D, out);
    let s = 0; for (let i = 0; i < NX; i++) s += xs[i] * out[i]; return s * H;
  }
  let unreachable = 0;
  function priceFromFlux(U, M, wOut) {
    M.subarray(0, NX).set(m0);
    for (let n = 0; n < NT; n++) {
      const u = U.subarray(n * NX, (n + 1) * NX), m = M.subarray(n * NX, (n + 1) * NX), next = M.subarray((n + 1) * NX, (n + 2) * NX);
      let mean = 0; for (let i = 0; i < NX; i++) mean += xs[i] * m[i]; mean *= H;
      const target = mean + DT * Q[n];
      let lo = -64, hi = 64;
      for (let k = 0; k < 64; k++) { const mid = 0.5 * (lo + hi); if (meanStep(u, m, mid, mNew) > target) lo = mid; else hi = mid; }
      const w = 0.5 * (lo + hi);
      const got = meanStep(u, m, w, next);
      if (Math.abs(got - target) > 1e-9) unreachable++;
      wOut[n] = w;
    }
    /* the last grid time has no step after it: the terminal identity, as the lab writes it */
    const u = U.subarray(NT * NX), m = M.subarray(NT * NX);
    let s = 0, mass = 0; for (let i = 0; i < NX; i++) { s += uxC(u, i) * m[i]; mass += m[i]; }
    wOut[NT] = -Q[NT] - s * H / (mass * H);
  }
  const flux = cfg.clearing === 'flux';

  const U = new Float64Array((NT + 1) * NX), M = new Float64Array((NT + 1) * NX);
  const w0 = new Float64Array(NT + 1), D0 = new Float64Array(NT + 1);
  /* the lab's warm start: a posted tariff −Q + c0, c0 bisected so the fleet buys the day's energy */
  let tgt = 0; for (let n = 0; n <= NT; n++) tgt += Q[n] * DT;
  let lo = -4, hi = 4;
  const E = (c0) => {
    for (let n = 0; n <= NT; n++) w0[n] = -Q[n] + c0;
    solveHJB(w0, U); solveFP(U, w0, M); demand(U, M, w0, D0);
    let e = 0; for (let n = 0; n <= NT; n++) e += D0[n] * DT;
    return e;
  };
  for (let k = 0; k < 40; k++) { const mid = 0.5 * (lo + hi); if (E(mid) > tgt) lo = mid; else hi = mid; }
  E(0.5 * (lo + hi));
  let qMax = 0, imb = 0;
  for (let n = 0; n <= NT; n++) { if (Q[n] > qMax) qMax = Q[n]; const d = D0[n] - Q[n]; if (d > imb) imb = d; }
  const rebound = 100 * imb / qMax;

  const wBar = new Float64Array(NT + 1), wRaw = new Float64Array(NT + 1), wTil = new Float64Array(NT + 1);
  const rPrev = new Float64Array(NT + 1), rCur = new Float64Array(NT + 1), GPrev = new Float64Array(NT + 1), Deq = new Float64Array(NT + 1);
  wBar.set(w0);
  const residHist = []; let it = 0, best = Infinity, bad = 0, cool = 0, resPrev = Infinity, converged = false;
  for (;;) {
    solveHJB(wBar, U);
    if (flux) { unreachable = 0; priceFromFlux(U, M, wRaw); } else { solveFP(U, wBar, M); priceFrom(U, M, wRaw); }
    let res = 0; for (let n = 0; n <= NT; n++) { const d = Math.abs(wRaw[n] - wBar[n]); if (d > res) res = d; }
    demand(U, M, wRaw, Deq);
    if (flux) for (let n = 0; n < NT; n++) { let a = 0, b = 0; for (let i = 0; i < NX; i++) { a += xs[i] * M[n * NX + i]; b += xs[i] * M[(n + 1) * NX + i]; } Deq[n] = (b - a) * H / DT; }
    residHist.push(res);
    if (res < TOL || it >= MAX_ITER - 1) { converged = res < TOL; it++; break; }
    for (let n = 0; n <= NT; n++) { wTil[n] = (1 - THMIX) * wBar[n] + THMIX * wRaw[n]; rCur[n] = wTil[n] - wBar[n]; }
    if (res < best) best = res;
    if (res > resPrev * 1.1 || res > best * 3) bad++; else bad = Math.max(0, bad - 1);
    if (bad >= 3) { cool = 6; bad = 0; }
    if (cool > 0) cool--;
    let anderson = (it >= 2 && cool === 0);
    if (anderson) {
      let num = 0, den = 0;
      for (let n = 0; n <= NT; n++) { const dr = rCur[n] - rPrev[n]; num += rCur[n] * dr; den += dr * dr; }
      const gam = den > 1e-30 ? num / den : 0;
      if (isFinite(gam) && Math.abs(gam) < 10) { for (let n = 0; n <= NT; n++) wBar[n] = wTil[n] - gam * (wTil[n] - GPrev[n]); }
      else anderson = false;
    }
    if (!anderson) { const th = Math.pow(it + 2, -0.67); for (let n = 0; n <= NT; n++) wBar[n] = wBar[n] + th * rCur[n] / THMIX; }
    rPrev.set(rCur); GPrev.set(wTil);
    resPrev = res; it++;
  }
  /* the fleet's mean charge and mass at every time, from the density the solver produced */
  const Xi = new Float64Array(NT + 1), mass = new Float64Array(NT + 1);
  for (let n = 0; n <= NT; n++) { let s = 0, mm = 0; for (let i = 0; i < NX; i++) { s += xs[i] * M[n * NX + i]; mm += M[n * NX + i]; } Xi[n] = s * H; mass[n] = mm * H; }
  let xbar0 = 0; for (let i = 0; i < NX; i++) xbar0 += xs[i] * m0[i] * H;
  let dmax = 0; for (let n = 0; n <= NT; n++) dmax = Math.max(dmax, Math.abs(Deq[n] - Q[n]));
  return { w: wBar, wRaw, it, res: residHist[residHist.length - 1], converged, residHist, rebound, Xi, mass, xbar0, Deq, clearGap: dmax, unreachable, U, M, xs, H, DT };
}

/* a Gaussian initial fleet on a given grid, normalised on it */
function gaussian(xa, xb, NX, mean, sd) {
  const H = (xb - xa) / (NX - 1), m0 = new Float64Array(NX); let s = 0;
  for (let i = 0; i < NX; i++) { const x = xa + i * H; m0[i] = Math.exp(-((x - mean) ** 2) / (2 * sd * sd)); s += m0[i]; }
  for (let i = 0; i < NX; i++) m0[i] /= s * H;
  return m0;
}

module.exports = { solve, labScenario, gaussian, makeTri, bump };
