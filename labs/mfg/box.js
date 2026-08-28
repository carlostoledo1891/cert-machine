/* box.js — UNIFORM-OVER-A-PARAMETER-BOX validation for the stationary
   quadratic mean-field game, with a tangent predictor.

   WHAT IS NEW HERE. The lifted kernel (legacy/core/mfg/validate.js) proves, for
   ONE parameter triple s = (sigma, c, A):

       there exists an exact solution x* with ||x* - xbar|| <= r,
       and it is the only solution in that ball.

   This file proves the same sentence with a quantifier in front of it:

       for EVERY s in the box S, there exists an exact solution x*(s) with
       ||x*(s) - xbar(s)|| <= r, and it is the only solution in that ball,

   where xbar(s) is an explicit AFFINE predictor through the box. One solve, one
   radius, a whole rectangle of parameters. That upgrade is what turns the
   mfg-cap point result into a MAP: two disjoint box-certificates over the same
   cell prove multiplicity for every parameter in the cell, so a picture of the
   parameter plane can be partitioned with nothing unproved between the samples.

   WHY THE PREDICTOR IS NOT OPTIONAL. With a FIXED candidate, Y0 = ||A Phi_s(xbar)||
   grows linearly in the cell width h, and the radii polynomial needs
   2 Z2 Y0 < (1 - Z1)^2, so admissible cells shrink like 1/||A||^2 — measured on
   the multiplicity branch at c = -12, that is h < 0.004, a hairline, not a map.
   Carrying the tangent xdot (DPhi xdot = -d_s Phi, one linear solve per
   direction, reusing the Jacobian already factored for A) makes the first-order
   term cancel and leaves Y0 = O(h^2). The bound used is the mean-value form

       ||A Phi_s(xbar(s))||  <=  ||A Phi_s0(xbar(s0))||
                                 + sum_dir h_dir * sup_S || A d_dir[ Phi(xbar) ] ||,

   which is rigorous because Phi is a polynomial and S is a box, so the whole
   segment [s0, s] lies in S. The second term is evaluated in interval
   arithmetic over S; it vanishes at s0 by the choice of xdot, hence is itself
   O(h), hence the product is O(h^2).

   TWO THINGS TO WATCH, both handled explicitly below:
     (1) A must be a FIXED linear operator, or "I - A DPhi" is not one operator
         at all. So A is built once at the box midpoint: the dense inverse A_N of
         the midpoint Jacobian, and the tail diagonal 1/(sigma0 2 pi k) with
         sigma0 the MIDPOINT sigma.
     (2) Because of (1) the tail of I - A DPhi no longer cancels: at row k it
         carries 1 - sigma/sigma0, which does NOT decay in k. That term is the
         honest price of a wide sigma box and it is added to Z1 by hand in the
         analytic tail bound (explicit columns pick it up automatically).

   AT ZERO WIDTH this file must reproduce validate.js EXACTLY -- same Y0, Z1, Z2,
   same radius, same kappa, same verdict, bit for bit. That is not a hope, it is
   battery.js check G1, re-run at every build of the page. Two implementations of
   one argument WILL diverge unless something fires when they do.

   MIT licensed. Part of cert-machine (labs/mfg). */
'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../legacy/core/interval/interval.js'),
                             require('../../legacy/core/mfg/mfg1d.js'));
  } else {
    root.MFGBox = factory(root.EqInterval, root.MFG1D);
  }
})(typeof self !== 'undefined' ? self : this, function (I, M1D) {

const { iv, add, sub, mul, div, neg, abs, mag, mig, ZERO, ONE } = I;
const TWO_PI = 2 * Math.PI;
const TWO_PI_I = I.encloseFloat(TWO_PI);
const TWO_PI_HI = TWO_PI_I[1];

function wNuI(nu, k) {                       /* nu^k, never a thin Math.pow */
  if (k === 0) return ONE;
  let r = I.encloseFloat(nu);
  for (let i = 1; i < k; i++) r = mul(r, I.encloseFloat(nu));
  return mul(iv(2), r);
}
const IDX = K => ({
  n: 2 * K + 1, K, rho: 0, p: k => k, b: k => K + k,
  weight: (j, nu) => (j === 0 ? 1 : 2 * Math.pow(nu, j <= K ? j : j - K))
});

const atE = (f, j) => { const a = j < 0 ? -j : j; return a < f.length ? f[a] : ZERO; };
const atO = (f, j) => {
  const a = j < 0 ? -j : j;
  if (a >= f.length) return ZERO;
  return j < 0 ? neg(f[a]) : f[a];
};
function convI(f, g, K, pf, pg) {
  const gf = pf === 'o' ? atO : atE, gg = pg === 'o' ? atO : atE;
  const out = new Array(K + 1);
  const Jf = f.length - 1, Jg = g.length - 1;
  for (let k = 0; k <= K; k++) {
    let s = ZERO;
    for (let j = -Jf; j <= Jf; j++) {
      const t = k - j;
      if (t < -Jg || t > Jg) continue;
      s = add(s, mul(gf(f, j), gg(g, t)));
    }
    out[k] = s;
  }
  return out;
}
function normNu(f, nu, hasZero) {
  let s = hasZero ? abs(f[0]) : ZERO;
  let nk = ONE;
  const nuI = iv(nu);
  for (let k = 1; k < f.length; k++) { nk = mul(nk, nuI); s = add(s, mul(iv(2), mul(abs(f[k]), nk))); }
  return s;
}

/* ---- the box ------------------------------------------------------------
   box = { sigma:[lo,hi], c:[lo,hi], A:[lo,hi], N }; a thin box is [t,t].
   V(x) = A cos 2 pi x, so V_1 = A/2 and every other coefficient is zero.   */
const mid = t => 0.5 * (t[0] + t[1]);
const half = t => 0.5 * (t[1] - t[0]);
function midProblem(box) {
  return M1D.makeProblem({ sigma: mid(box.sigma), c: mid(box.c), A: mid(box.A), N: box.N });
}
/* halving is EXACT in binary floating point, so V_1 needs no outward pad and a
   thin A box stays thin -- which is what makes gate G1 an equality. */
function VboxI(box) {
  const V = new Array(box.N + 1).fill(ZERO);
  if (box.N >= 1) V[1] = iv(box.A[0] / 2, box.A[1] / 2);
  return V;
}

/* Phi over intervals: H rows k = 0..K, F rows k = 1..K */
function buildPhiI(xb, SIG, C, V, K) {
  const pp = convI(xb.p, xb.p, K, 'o', 'o');
  const bp = convI(xb.b, xb.p, K, 'e', 'o');
  const H = new Array(K + 1), F = new Array(K + 1);
  const Vi = k => (k < V.length ? V[k] : ZERO);
  const lam = k => mul(SIG, mul(TWO_PI_I, iv(k)));
  H[0] = add(sub(mul(iv(-0.5), pp[0]), mul(C, xb.b[0])), sub(xb.rho, Vi(0)));
  F[0] = ZERO;
  for (let k = 1; k <= K; k++) {
    H[k] = sub(sub(mul(lam(k), atO(xb.p, k)), mul(iv(0.5), pp[k])),
               add(mul(C, atE(xb.b, k)), Vi(k)));
    F[k] = add(mul(lam(k), atE(xb.b, k)), bp[k]);
  }
  return { H, F };
}

/* a row of DPhi over intervals */
function dRowI(type, k, xb, SIG, C, K) {
  const row = { rho: ZERO, p: new Array(K + 1).fill(ZERO), b: new Array(K + 1).fill(ZERO) };
  const lam = mul(SIG, mul(TWO_PI_I, iv(k)));
  if (type === 'H' && k === 0) {
    row.rho = ONE;
    for (let m = 1; m <= K; m++) row.p[m] = mul(iv(2), atO(xb.p, m));
    return row;
  }
  if (type === 'H') {
    for (let m = 1; m <= K; m++) {
      let v = neg(sub(atO(xb.p, k - m), atO(xb.p, k + m)));
      if (m === k) v = add(v, lam);
      row.p[m] = v;
      row.b[m] = (m === k) ? neg(C) : ZERO;
    }
    return row;
  }
  for (let m = 1; m <= K; m++) {
    row.p[m] = sub(atE(xb.b, k - m), atE(xb.b, k + m));
    let v = add(atO(xb.p, k - m), atO(xb.p, k + m));
    if (m === k) v = add(v, lam);
    row.b[m] = v;
  }
  return row;
}

/* DPhi(x) applied to a direction d = {rho, p[], b[]} (d_b0 = 0, b_0 is fixed):
     row H_0 : d_rho - (p * d_p)_0
     row H_k : sigma(2 pi k) d_p,k - (p * d_p)_k - c d_b,k
     row F_k : sigma(2 pi k) d_b,k + (b * d_p)_k + (d_b * p)_k                */
function dPhiApply(xb, d, SIG, C, K) {
  const pdp = convI(xb.p, d.p, K, 'o', 'o');
  const bdp = convI(xb.b, d.p, K, 'e', 'o');
  const dbp = convI(d.b, xb.p, K, 'e', 'o');
  const H = new Array(K + 1), F = new Array(K + 1);
  const lam = k => mul(SIG, mul(TWO_PI_I, iv(k)));
  H[0] = sub(d.rho, pdp[0]); F[0] = ZERO;
  for (let k = 1; k <= K; k++) {
    H[k] = sub(sub(mul(lam(k), atO(d.p, k)), pdp[k]), mul(C, atE(d.b, k)));
    F[k] = add(mul(lam(k), atE(d.b, k)), add(bdp[k], dbp[k]));
  }
  return { H, F };
}

/* d/d(dir) of Phi at fixed x — the parameter derivative
     c     : H_0 = -b_0 = -1,  H_k = -b_k,          F_k = 0
     sigma : H_0 = 0,          H_k = (2 pi k) p_k,  F_k = (2 pi k) b_k
     A     : H_1 = -1/2,       everything else 0     (V_1 = A/2)             */
function dParamPhi(dir, xb, K) {
  const H = new Array(K + 1).fill(ZERO), F = new Array(K + 1).fill(ZERO);
  if (dir === 'c') {
    H[0] = neg(xb.b[0]);
    for (let k = 1; k <= K; k++) H[k] = neg(atE(xb.b, k));
  } else if (dir === 'sigma') {
    for (let k = 1; k <= K; k++) {
      const tk = mul(TWO_PI_I, iv(k));
      H[k] = mul(tk, atO(xb.p, k));
      F[k] = mul(tk, atE(xb.b, k));
    }
  } else if (dir === 'A') {
    if (K >= 1) H[1] = iv(-0.5);
  }
  return { H, F };
}

/* ---- the validation, uniform over the box ------------------------------- */
function validateBox(xFloat, box, opts) {
  opts = opts || {};
  const N = box.N;
  const nu = opts.nu || 1.05;
  const KC = opts.KC || 3 * N;
  const KR = KC + N;
  if (!(box.sigma[0] > 0)) return { ok: false, why: 'sigma box must be strictly positive' };
  const SIG = iv(box.sigma[0], box.sigma[1]), C = iv(box.c[0], box.c[1]);
  const V = VboxI(box);
  const sigma0 = mid(box.sigma), c0 = mid(box.c), A0 = mid(box.A);
  const SIG0 = iv(sigma0), C0 = iv(c0);
  const V0 = VboxI({ N, A: [A0, A0] });
  const hs = { sigma: half(box.sigma), c: half(box.c), A: half(box.A) };
  const L = IDX(N), n = L.n;

  /* the candidate at the midpoint, in (rho, p, b), thin */
  const un = M1D.unpack(xFloat, N);
  const p0 = new Array(N + 1).fill(ZERO), b0 = new Array(N + 1).fill(ZERO);
  b0[0] = ONE;
  for (let k = 1; k <= N; k++) { p0[k] = mul(TWO_PI_I, iv(k * un.a[k])); b0[k] = iv(un.b[k]); }
  const xb0 = { rho: iv(un.rho), p: p0, b: b0 };

  /* A, part 1: the dense inverse of the MIDPOINT Jacobian on indices <= N */
  const Jf = new Float64Array(n * n);
  for (let k = 0; k <= N; k++) {
    const rowH = dRowI('H', k, xb0, SIG0, C0, N);
    const ri = (k === 0) ? 0 : L.p(k);
    Jf[ri * n + 0] = rowH.rho[0];
    for (let m = 1; m <= N; m++) { Jf[ri * n + L.p(m)] = rowH.p[m][0]; Jf[ri * n + L.b(m)] = rowH.b[m][0]; }
    if (k >= 1) {
      const rowF = dRowI('F', k, xb0, SIG0, C0, N);
      const rj = L.b(k);
      Jf[rj * n + 0] = rowF.rho[0];
      for (let m = 1; m <= N; m++) { Jf[rj * n + L.p(m)] = rowF.p[m][0]; Jf[rj * n + L.b(m)] = rowF.b[m][0]; }
    }
  }
  const AN = M1D.inverse(Jf, n);
  if (!AN) return { ok: false, why: 'midpoint Jacobian numerically singular' };
  /* A, part 2: the tail diagonal, at the MIDPOINT sigma (A must not vary over S) */
  const tailInv = k => div(ONE, mul(SIG0, mul(TWO_PI_I, iv(k))));

  /* ||A v|| for a row vector v given as H (k = 0..K) and F (k = 1..K) */
  function ANorm(H, F, K) {
    const rvec = new Array(n).fill(ZERO);
    rvec[0] = H[0];
    for (let k = 1; k <= N; k++) { rvec[L.p(k)] = H[k]; rvec[L.b(k)] = F[k]; }
    let s = ZERO;
    for (let i = 0; i < n; i++) {
      let acc = ZERO;
      for (let j = 0; j < n; j++) acc = add(acc, mul(iv(AN[i * n + j]), rvec[j]));
      s = add(s, mul(iv(L.weight(i, nu)), abs(acc)));
    }
    for (let k = N + 1; k <= K; k++) {
      const w = wNuI(nu, k);
      s = add(s, mul(w, abs(mul(tailInv(k), H[k]))));
      s = add(s, mul(w, abs(mul(tailInv(k), F[k]))));
    }
    return s;
  }

  /* ---- the tangent predictor: DPhi xdot = -d_dir Phi, one solve per live
     direction, reusing the factored midpoint Jacobian. A direction with zero
     width gets no tangent (and costs nothing).                             */
  const dirs = ['sigma', 'c', 'A'].filter(d => hs[d] > 0);
  const xdot = {};
  /* opts.freezePredictor sets every tangent to zero, which is exactly the
     FIXED-candidate bound the literature's single-point argument gives when it
     is pointed at a box. It exists so the battery can turn the predictor off
     and require the same cell to fail: a trick nobody can switch off is a trick
     nobody has measured. */
  for (const dir of dirs) {
    if (opts.freezePredictor) {
      xdot[dir] = { rho: ZERO, p: new Array(N + 1).fill(ZERO), b: new Array(N + 1).fill(ZERO) };
      continue;
    }
    const g = dParamPhi(dir, xb0, N);
    const rhs = new Float64Array(n);
    rhs[0] = -g.H[0][0];
    for (let k = 1; k <= N; k++) { rhs[L.p(k)] = -g.H[k][0]; rhs[L.b(k)] = -g.F[k][0]; }
    const z = M1D.solveLin(Jf, rhs, n);
    if (!z) return { ok: false, why: 'tangent solve failed (midpoint Jacobian singular)' };
    const d = { rho: iv(z[0]), p: new Array(N + 1).fill(ZERO), b: new Array(N + 1).fill(ZERO) };
    for (let k = 1; k <= N; k++) { d.p[k] = iv(z[L.p(k)]); d.b[k] = iv(z[L.b(k)]); }
    xdot[dir] = d;
  }

  /* the predictor over the box: xbar(s) = x0 + sum_dir (s_dir - s0_dir) xdot_dir */
  const xb = { rho: xb0.rho, p: p0.slice(), b: b0.slice() };
  for (const dir of dirs) {
    const t = iv(-hs[dir], hs[dir]), d = xdot[dir];
    xb.rho = add(xb.rho, mul(t, d.rho));
    for (let k = 1; k <= N; k++) { xb.p[k] = add(xb.p[k], mul(t, d.p[k])); xb.b[k] = add(xb.b[k], mul(t, d.b[k])); }
  }

  const normP = normNu(xb.p, nu, false);
  const normB = normNu(xb.b, nu, true);

  /* ---- Y0: centre term + mean-value term in each live direction ---- */
  let Y0;
  {
    const Phi0 = buildPhiI(xb0, SIG0, C0, V0, 2 * N);
    Y0 = ANorm(Phi0.H, Phi0.F, 2 * N);
    for (const dir of dirs) {
      /* d_dir [ Phi_s(xbar(s)) ] = DPhi_s(xbar(s)) xdot_dir + d_dir Phi(xbar(s)),
         enclosed over the whole box; it vanishes at the midpoint by the choice
         of xdot, so this whole term is O(h) and its product with h is O(h^2). */
      const a1 = dPhiApply(xb, xdot[dir], SIG, C, 2 * N);
      const a2 = dParamPhi(dir, xb, 2 * N);
      const H = new Array(2 * N + 1), F = new Array(2 * N + 1);
      for (let k = 0; k <= 2 * N; k++) { H[k] = add(a1.H[k], a2.H[k]); F[k] = add(a1.F[k] || ZERO, a2.F[k] || ZERO); }
      Y0 = add(Y0, mul(iv(hs[dir]), ANorm(H, F, 2 * N)));
    }
  }

  /* ---- Z1 = sup_S || I - A DPhi(xbar(s)) || (max over columns) ---- */
  let Z1 = ZERO, worstCol = null;
  {
    const rowsH = [], rowsF = [];
    for (let k = 0; k <= KR; k++) {
      rowsH.push(dRowI('H', k, xb, SIG, C, KC));
      rowsF.push(k >= 1 ? dRowI('F', k, xb, SIG, C, KC) : null);
    }
    const colNorm = (kind, m) => {
      const entH = new Array(KR + 1).fill(ZERO), entF = new Array(KR + 1).fill(ZERO);
      for (let k = 0; k <= KR; k++) {
        if (kind === 'rho') { entH[k] = (k === 0) ? ONE : ZERO; }
        else if (kind === 'p') { entH[k] = rowsH[k].p[m] || ZERO; if (k >= 1) entF[k] = rowsF[k].p[m] || ZERO; }
        else { entH[k] = rowsH[k].b[m] || ZERO; if (k >= 1) entF[k] = rowsF[k].b[m] || ZERO; }
      }
      const fin = new Array(n).fill(ZERO);
      fin[0] = entH[0];
      for (let k = 1; k <= N; k++) { fin[L.p(k)] = entH[k]; fin[L.b(k)] = entF[k]; }
      const out = new Array(n).fill(ZERO);
      for (let i = 0; i < n; i++) {
        let acc = ZERO;
        for (let jj = 0; jj < n; jj++) acc = add(acc, mul(iv(AN[i * n + jj]), fin[jj]));
        out[i] = acc;
      }
      const jIdx = kind === 'rho' ? 0 : (kind === 'p' ? (m <= N ? L.p(m) : -1) : (m <= N ? L.b(m) : -1));
      let s = ZERO;
      for (let i = 0; i < n; i++) {
        const e = (i === jIdx) ? ONE : ZERO;
        s = add(s, mul(iv(L.weight(i, nu)), abs(sub(e, out[i]))));
      }
      for (let k = N + 1; k <= KR; k++) {
        const w = wNuI(nu, k);
        const eH = (kind === 'p' && m === k) ? ONE : ZERO;
        const eF = (kind === 'b' && m === k) ? ONE : ZERO;
        s = add(s, mul(w, abs(sub(eH, mul(tailInv(k), entH[k])))));
        s = add(s, mul(w, abs(sub(eF, mul(tailInv(k), entF[k])))));
      }
      return div(s, kind === 'rho' ? ONE : wNuI(nu, m));
    };
    const cand = [['rho', 0]];
    for (let m = 1; m <= KC; m++) { cand.push(['p', m]); cand.push(['b', m]); }
    for (const [kind, m] of cand) {
      const v = colNorm(kind, m);
      if (v[1] > mag(Z1)) { Z1 = v; worstCol = kind + (kind === 'rho' ? '' : '_' + m); }
    }
    /* columns m > KC: A acts as the midpoint diagonal there, so
         (I - A DPhi) e_m = (1 - sigma/sigma0) e_m - (quadratic part)/(sigma0 2 pi k).
       The first term is the price of the sigma box and does NOT decay in k; the
       second is the lifted kernel's bound, with sigma0 in the denominator
       because that is the operator actually applied. */
    const diagDefect = mag(sub(ONE, div(SIG, SIG0)));
    const pert = Math.max(mag(add(normP, normB)), mag(add(abs(C), normP)));
    const denom = mul(SIG0, mul(TWO_PI_I, iv(KC + 1 - N)));
    const tailAnalytic = I.nextUp(diagDefect + mag(div(iv(pert), denom)));
    if (tailAnalytic > mag(Z1)) { Z1 = iv(tailAnalytic); worstCol = 'tail(analytic)'; }
  }

  /* ---- Z2 = 2||A||. Phi is quadratic in x and its x-quadratic part carries no
     parameter, so DPhi(x) - DPhi(y) is parameter-free: Z2 does not see the box. */
  let Z2;
  {
    let anorm = 0;
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s = I.nextUp(s + L.weight(i, nu) * Math.abs(AN[i * n + j]));
      const v = I.nextUp(s / L.weight(j, nu));
      if (v > anorm) anorm = v;
    }
    const tailA = 1 / (sigma0 * TWO_PI * (N + 1));
    Z2 = iv(I.nextUp(2 * Math.max(anorm, tailA)));
  }

  /* ---- the radii polynomial, then the contraction factor ---- */
  const y0 = mag(Y0), z1 = mag(Z1), z2 = mag(Z2);
  const res = { N, nu, KC, dirs: dirs.slice(),
                box: { sigma: box.sigma.slice(), c: box.c.slice(), A: box.A.slice() },
                Y0: y0, Z1: z1, Z2: z2, worstCol };
  if (!(z1 < 1)) return Object.assign(res, { ok: false, why: 'Z1 >= 1 over the box — the midpoint inverse does not control the whole cell' });
  const disc = (1 - z1) * (1 - z1) - 2 * z2 * y0;
  if (!(disc > 0)) return Object.assign(res, { ok: false, why: 'discriminant <= 0 — no radius closes the contraction over the box' });
  const sq = Math.sqrt(disc);
  const rMin = I.nextUp(((1 - z1) - sq) / z2);
  const rMax = I.nextDown(((1 - z1) + sq) / z2);
  const pOf = rr => { const R = iv(rr); return add(sub(mul(mul(iv(0.5), Z2), mul(R, R)), mul(sub(ONE, Z1), R)), Y0); };
  let rStar = rMin, found = false;
  for (let t = 0; t < 400; t++) {
    if (rStar > rMax) break;
    if (pOf(rStar)[1] < 0) { found = true; break; }
    rStar = I.nextUp(rStar * 1.05 + Number.MIN_VALUE);
  }
  if (!found) return Object.assign(res, { ok: false, why: 'no radius verified p(r) < 0 in interval arithmetic', rMin, rMax });
  const kappa = add(Z1, mul(Z2, iv(rStar)));
  if (!(kappa[1] < 1)) {
    return Object.assign(res, { ok: false, r: rStar, kappa: kappa[1], rMin, rMax,
      why: 'contraction factor Z1 + Z2 r >= 1 at the smallest admissible radius — T is a self-map but not a contraction' });
  }
  return Object.assign(res, { ok: true, rMin, rMax, r: rStar, pAtR: pOf(rStar)[1], kappa: kappa[1], disc,
                              tangents: dirs.reduce((o, d) => (o[d] = { rho: xdot[d].rho[0],
                                p: xdot[d].p.map(z => z[0]), b: xdot[d].b.map(z => z[0]) }, o), {}),
                              predictor: { rho: [xb.rho[0], xb.rho[1]],
                                           p: xb.p.map(z => [z[0], z[1]]),
                                           b: xb.b.map(z => [z[0], z[1]]) } });
}

/* ---- positivity of the density over the WHOLE enclosure, over the WHOLE box.
   The nu-norm dominates ell^1, which dominates the sup norm, so
       sup_x |m(x) - mbar(x)| <= r,
   and a rigorous lower bound on min mbar over the box, minus r, bounds min m
   below for every parameter in the cell. min mbar is bounded by sampling and
   paying the modulus of continuity with L = sum_k 2 (2 pi k) |b_k| -- no
   sampling argument is left unquantified. m > 0 is a HYPOTHESIS of the model,
   so it is certified, never assumed. At zero width this reproduces
   validate.js's certifyPositivity exactly (gate G2).                        */
function boxPositivity(bI, N, r, G) {
  let L = 0;
  for (let k = 1; k <= N; k++) L = I.nextUp(L + 2 * TWO_PI_HI * k * mag(bI[k]));
  G = G || 4096;
  let lo = Infinity, guard = 0;
  for (;;) {
    lo = Infinity;
    for (let g = 0; g < G; g++) {
      const t = g / G;
      let m = iv(1);
      for (let k = 1; k <= N; k++) {
        const ci = I.encloseCos(TWO_PI * k * t);
        m = add(m, mul([2 * bI[k][0], 2 * bI[k][1]], ci));   /* doubling is exact */
      }
      if (m[0] < lo) lo = m[0];
    }
    const slack = I.nextUp(L / (2 * G));
    if (slack < 0.25 * Math.abs(lo) || G >= (1 << 21) || ++guard > 12) break;
    G *= 4;
  }
  const minMbar = I.nextDown(lo - I.nextUp(L / (2 * G)));
  const minM = I.nextDown(minMbar - r);
  return { minMbar, minM, positive: minM > 0, L, G };
}

/* ---- separation: a rigorous LOWER bound on ||xbar1(s) - xbar2(s)||_nu, valid
   for EVERY s in the cell. Weights w(rho) = 1, w(p_k) = w(b_k) = 2 nu^k, as in
   validate.js. Each coefficient difference is an interval (the two predictors
   move with s); mig() takes the smallest modulus it can have, and every step
   rounds DOWN, because the multiplicity claim needs the separation to be at
   least this large.                                                         */
function separationBox(v1, v2, N, nu) {
  const dr = sub(v1.rho, v2.rho);
  let s = mig(dr), nk = 1;
  for (let k = 1; k <= N; k++) {
    nk = I.nextDown(nk * nu);
    const dp = mig(sub(v1.p[k], v2.p[k]));       /* already in p = u' coordinates */
    const db = mig(sub(v1.b[k], v2.b[k]));
    s = I.nextDown(s + I.nextDown(2 * nk * dp));
    s = I.nextDown(s + I.nextDown(2 * nk * db));
  }
  /* nextDown(0) steps to a negative denormal, and a NORM is never negative:
     clamping at 0 only TIGHTENS a lower bound, so the enclosure survives. Same
     lesson as sqr() in the interval library's own header. */
  return Math.max(0, s);
}
/* the same for two plain float candidates (thin cell) — the (rho, a, b) form
   the solver returns, matching test-cap.js's M1 exactly. */
function separationNu(x1, x2, N, nu) {
  const u1 = M1D.unpack(x1, N), u2 = M1D.unpack(x2, N);
  let s = Math.abs(u1.rho - u2.rho), nk = 1;
  for (let k = 1; k <= N; k++) {
    nk = I.nextDown(nk * nu);
    s = I.nextDown(s + I.nextDown(2 * nk * Math.abs(TWO_PI * k * u1.a[k] - TWO_PI * k * u2.a[k])));
    s = I.nextDown(s + I.nextDown(2 * nk * Math.abs(u1.b[k] - u2.b[k])));
  }
  return s;
}

/* ---- REFUTATION: no exact solution within delta of a claimed equilibrium ---
   Given a candidate x (Fourier coefficients, exactly as the model stores them)
   and a claimed accuracy delta in the nu-norm, this decides the NEGATIVE
   statement. For any y with ||y - x||_nu <= delta and any single equation j,

       |Phi_j(y)|  >=  |Phi_j(x)|  -  L_j * delta,      L_j := max_i |DPhi_j,i| / w_i

   (the dual norm of the row, over the whole ball and the whole parameter box).
   So one equation whose residual exceeds its own row bound times delta REFUTES
   the claim outright: no exact solution of the system lies that close, whatever
   the rest of the vector does. The witness is that equation, its enclosed
   residual, and its row bound -- checkable by hand.

   This is the direction a solver can never give you. A residual near zero is
   evidence; a residual provably too large is a proof.                        */
function refuteCandidate(xFloat, box, delta, opts) {
  opts = opts || {};
  const N = box.N, nu = opts.nu || 1.05;
  if (!(delta > 0)) return { verdict: 'REFUSED', reason: 'delta must be a positive number' };
  if (!(box.sigma[0] > 0)) return { verdict: 'REFUSED', reason: 'sigma must be strictly positive' };
  const SIG = iv(box.sigma[0], box.sigma[1]), C = iv(box.c[0], box.c[1]), V = VboxI(box);
  const un = M1D.unpack(xFloat, N);
  const p0 = new Array(N + 1).fill(ZERO), b0 = new Array(N + 1).fill(ZERO);
  b0[0] = ONE;
  for (let k = 1; k <= N; k++) { p0[k] = mul(TWO_PI_I, iv(k * un.a[k])); b0[k] = iv(un.b[k]); }
  /* the ball itself: every coefficient may move by delta/w_i, so enclose it */
  const D = iv(-delta, delta);
  const ball = { rho: add(iv(un.rho), D), p: p0.slice(), b: b0.slice() };
  for (let k = 1; k <= N; k++) {
    const wk = div(D, wNuI(nu, k));
    ball.p[k] = add(ball.p[k], wk); ball.b[k] = add(ball.b[k], wk);
  }
  const xb = { rho: iv(un.rho), p: p0, b: b0 };
  const Phi = buildPhiI(xb, SIG, C, V, 2 * N);
  const rowBound = (type, k) => {
    const KK = k + N + 1;
    const row = dRowI(type, k, ball, SIG, C, KK);
    let L = mag(row.rho);                                  /* w(rho) = 1 */
    for (let m = 1; m <= KK; m++) {
      const w = wNuI(nu, m);
      L = Math.max(L, mag(div(row.p[m], w)), mag(div(row.b[m], w)));
    }
    return L;
  };
  let best = null;
  for (let k = 0; k <= 2 * N; k++) {
    for (const type of (k === 0 ? ['H'] : ['H', 'F'])) {
      const v = type === 'H' ? Phi.H[k] : Phi.F[k];
      const lo = mig(v);                                   /* |Phi_j(x)| from below */
      if (!(lo > 0)) continue;
      const L = k <= N ? rowBound(type, k) : mag(mul(SIG, mul(TWO_PI_I, iv(k))));
      const margin = I.nextDown(lo - I.nextUp(L * delta));
      if (margin > 0 && (!best || margin > best.margin)) {
        best = { equation: type + '_' + k, residual: lo, rowBound: L, margin };
      }
    }
  }
  if (best) {
    return { verdict: 'REFUTED', mechanism: Object.assign({ kind: 'residual_exceeds_row_bound', delta, nu }, best),
      statement: 'no exact solution of this MFG lies within ' + delta + ' (nu-weighted ell^1, nu = ' + nu
        + ') of the pasted candidate: equation ' + best.equation + ' has |Phi| >= ' + best.residual.toExponential(6)
        + ' while the whole ball can move it by at most ' + I.nextUp(best.rowBound * delta).toExponential(6) + '.' };
  }
  return { verdict: 'REFUSED',
    reason: 'no single equation exceeds its own row bound at delta = ' + delta
      + ' — this candidate is not refuted at that accuracy (which is NOT a certificate that it is right; '
      + 'run the certifier for that)' };
}

/* ---- THE CELL DECISION, self-contained -----------------------------------
   ONE definition, used by the sweep (labs/mfg/regime.js) and by the in-browser
   paste box (labs/mfg/widget.js). Both branches are re-derived from scratch
   here -- no atlas, no remembered candidate -- so the answer depends on nothing
   but the cell you hand it:

     aligned  the continuation of the constant state (u = 0, m = 1, rho = c),
              which is the EXACT solution at A = 0; continued up in A.
     herding  born at the pitchfork c* = -sigma^2 (2 pi)^2, continued down in c
              at A = 0, then up in A.

   Verdicts:
     MULTIPLE   both branches certified over the cell, balls provably disjoint,
                both densities positive: at least two exact solutions for EVERY
                parameter in the cell.
     UNIQUE     the cell lies in c >= 0, where Lasry-Lions gives GLOBAL
                uniqueness [cited, not proved here], and our certificate
                encloses that solution uniformly over the cell.
     UNDECIDED  everything else, reason kept verbatim.                       */
function seedAligned(box) {
  const cm = mid(box.c), am = mid(box.A), sg = mid(box.sigma), N = box.N;
  let x = new Float64Array(2 * N + 1); x[0] = cm;
  const steps = Math.max(1, Math.ceil(am / 0.05));
  for (let i = 1; i <= steps; i++) {
    const r = M1D.solve(M1D.makeProblem({ sigma: sg, c: cm, A: am * i / steps, N }), { x0: x, maxIter: 300 });
    if (!(r.resNorm < 1e-11)) return seedDirect(box);   /* the branch folded — try a cold start */
    x = r.x;
  }
  return x;
}
/* Above the fold the constant-state continuation dies, but solutions still
   exist there (measured: at c = -12, A >= 1.1 a branch with b_1 < 0, the
   density peaked AWAY from the potential minimum). A cold Newton from a few
   structured starts finds one; which seeding produced a certificate is recorded
   on the cell, because a reader is entitled to know how the candidate was
   reached even though only the certificate decides anything. */
function seedDirect(box) {
  const cm = mid(box.c), am = mid(box.A), sg = mid(box.sigma), N = box.N;
  const P = M1D.makeProblem({ sigma: sg, c: cm, A: am, N });
  for (const [p1, b1] of [[0, 0], [-0.2, 0.2], [0.4, -0.4], [-0.6, 0.6], [0.8, -0.8]]) {
    const x = new Float64Array(2 * N + 1);
    x[0] = cm; x[1] = p1; x[N + 1] = b1;
    const r = M1D.solve(P, { x0: x, maxIter: 500 });
    if (r.resNorm < 1e-11) return r.x;
  }
  return null;
}
/* a supplied warm start is always re-solved AT the cell midpoint before it is
   used, so a stale seed cannot smuggle in a candidate for the wrong parameters */
function refine(x0, box) {
  const P = M1D.makeProblem({ sigma: mid(box.sigma), c: mid(box.c), A: mid(box.A), N: box.N });
  const r = M1D.solve(P, { x0, maxIter: 400 });
  return r.resNorm < 1e-11 ? r.x : null;
}
function seedHerding(box) {
  const cm = mid(box.c), am = mid(box.A), sg = mid(box.sigma), N = box.N;
  const cStar = -(sg * sg) * TWO_PI * TWO_PI;
  if (!(cm < cStar)) return null;                    /* the branch is not born yet */
  const cEnter = cStar - 0.25;                       /* just past the pitchfork, where the branch amplitude is still O(sqrt(c*-c)) */
  const seed = new Float64Array(2 * N + 1);
  seed[0] = cEnter; seed[1] = -sg * 0.35; seed[N + 1] = 0.35;
  const st = M1D.solve(M1D.makeProblem({ sigma: sg, c: cEnter, A: 0, N }), { x0: seed, maxIter: 400 });
  if (!(st.resNorm < 1e-11)) return null;
  const steps = Math.max(8, Math.ceil(Math.abs(cEnter - cm) / 0.25));
  const br = M1D.continueBranch(c => M1D.makeProblem({ sigma: sg, c, A: 0, N }), cEnter, cm, steps, st.x);
  if (!br.ok) return null;
  let x = br.x;
  const as = Math.max(1, Math.ceil(am / 0.05));
  for (let i = 1; i <= as; i++) {
    const r = M1D.solve(M1D.makeProblem({ sigma: sg, c: cm, A: am * i / as, N }), { x0: x, maxIter: 300 });
    if (!(r.resNorm < 1e-11)) return null;
    x = r.x;
  }
  return x;
}
function decideCell(box, opts) {
  opts = opts || {};
  const nu = opts.nu || 1.02, N = box.N;
  const collapseTol = opts.collapseTol === undefined ? 0.05 : opts.collapseTol;
  const out = { c0: box.c[0], c1: box.c[1], a0: box.A[0], a1: box.A[1] };
  const rec = ct => ({ r: ct.r, Z1: ct.Z1, Z2: ct.Z2, Y0: ct.Y0, kappa: ct.kappa });

  /* A SEED IS NOT EVIDENCE. Supplied or self-found, the candidate is only a
     starting point; the certificate is the only thing that decides. */
  let xT = opts.seedT ? refine(opts.seedT, box) : seedAligned(box);
  if (!xT) xT = seedAligned(box);
  if (!xT) { out.verdict = 'UNDECIDED'; out.why = 'no numerical candidate on the aligned branch at the cell midpoint'; out.enclosures = 0; out.refinable = false; return out; }
  const certT = validateBox(xT, box, { nu });
  let posT = null;
  if (certT.ok) {
    posT = boxPositivity(certT.predictor.b, N, certT.r);
    if (!posT.positive) { certT.ok = false; certT.why = 'density positivity not certified over the ball (min m <= 0)'; }
  }

  let xH = opts.seedH ? refine(opts.seedH, box) : seedHerding(box);
  let certH = null, posH = null, sep = null;
  if (xH && separationNu(xH, xT, N, nu) <= collapseTol) xH = null;   /* same branch, not two */
  if (xH) {
    certH = validateBox(xH, box, { nu });
    if (certH.ok) {
      posH = boxPositivity(certH.predictor.b, N, certH.r);
      if (!posH.positive) { certH.ok = false; certH.why = 'density positivity not certified over the ball (min m <= 0)'; }
    }
    if (certT.ok && certH.ok) sep = separationBox(certT.predictor, certH.predictor, N, nu);
  }
  out.enclosures = (certT.ok ? 1 : 0) + (certH && certH.ok ? 1 : 0);

  if (certT.ok && certH && certH.ok && sep !== null && sep > certT.r + certH.r) {
    out.verdict = 'MULTIPLE';
    out.witness = { separation: sep, rSum: certT.r + certH.r, aligned: rec(certT), herding: rec(certH),
                    minM: Math.min(posT.minM, posH.minM),
                    b1: [certT.predictor.b[1], certH.predictor.b[1]] };
    out.refinable = false;
    return out;
  }
  if (box.c[0] >= 0 && certT.ok) {
    out.verdict = 'UNIQUE';
    out.witness = { basis: 'Lasry-Lions monotone coupling (c >= 0) — global uniqueness is CITED, not proved here',
                    enclosure: rec(certT), minM: posT.minM };
    out.refinable = false;
    return out;
  }
  out.verdict = 'UNDECIDED';
  out.why = !certT.ok ? ('aligned branch: ' + certT.why)
          : !xH ? 'only one solution found at the cell midpoint — a second branch is not excluded, it is not exhibited'
          : !certH.ok ? ('herding branch: ' + certH.why)
          : 'two solutions found but their certified balls are not yet disjoint (separation ' + sep.toExponential(3)
            + ' <= r1+r2 ' + (certT.r + certH.r).toExponential(3) + ')';
  out.refinable = !certT.ok || (!!xH && (!certH.ok || sep <= certT.r + certH.r));
  if (certT.ok) out.aligned = rec(certT);
  return out;
}

/* the bifurcation curve of the constant state: c* = -sigma^2 (2 pi)^2, where the
   linearisation loses invertibility and NO enclosure can exist. Returned as an
   interval over a sigma box, so a cell can be tested for straddling it. */
function cStarBox(sigmaBox) {
  const S = iv(sigmaBox[0], sigmaBox[1]);
  return neg(mul(mul(S, S), mul(TWO_PI_I, TWO_PI_I)));
}

return { validateBox, boxPositivity, refuteCandidate, decideCell, seedAligned, seedHerding, seedDirect,
         separationBox, separationNu, cStarBox,
         midProblem, VboxI, normNu, IDX, wNuI, mid, half, buildPhiI, convI };
});
