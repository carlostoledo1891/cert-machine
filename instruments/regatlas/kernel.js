/* kernel.js — the p-Laplacian-regularized stationary first-order MFG of Ferreira–Gomes–Üçer
   (arXiv:2506.21212, operator (3.1)) on the one-dimensional torus, enclosed by a radii polynomial
   in a derivative-weighted ℓ¹ space.
   instruments/regatlas · cert-machine · 2026-09-07

   THE MODEL (Problem 1 with the power-growth Hamiltonian H = a|p|² − b m, a = ½, b = 1, on 𝕋 = ℝ/ℤ):
     −u − u′²/2 + m + V = 0                      (HJ, discounted)        ⇒  m = u + u′²/2 − V
     m − (m u′)′ − 1 = 0                          (transport)
   THE REGULARIZATION (3.1): the γ̄-Laplacian and the γ̄-power of u in the transport slot, with
   γ̄ = α(β+1)/β = 4 here, so |Du|^{γ̄−2}Du = u′³ and |u|^{γ̄−2}u = u³ — polynomial:
     F_ε(u) := m − (m u′ + ε u′³)′ + ε u³ − 1 = 0,     m = u + u′²/2 − V,     V = A cos 2πx.
   At V = 0 the solution is the constant u = m = the real root of ε u³ + u = 1 (u = 1 at ε = 0).

   THE LINEARISATION is Sturm–Liouville:  DF(ū)h = −(c h′)′ + e h  with
     c = m̄ + (1 + 3ε) ū′² = ū + (3/2 + 3ε) ū′² − V,      e = 1 − ū″ + 3ε ū².
   It is elliptic wherever c > 0, and c ≥ m̄: the first-order game (ε = 0) is, after
   eliminating m, a second-order elliptic equation for u — that is why the certifier below
   works at ε = 0 as well as at ε > 0, and why the atlas can measure the regularisation.

   THE SPACE. Even real functions as cosine sequences u = (u_k)_{k≥0}, u(x) = u_0 + 2Σ u_k cos 2πkx,
     ‖u‖_s = |u_0| + 2 Σ_{k≥1} |u_k| (1 + k)^s ν^k,   s ∈ {0, 1, 2},  ν ≥ 1.
   Each ‖·‖_s is a Banach-algebra norm (1 + |k| ≤ (1 + |j|)(1 + |k − j|)), ‖h′‖_{s−1} ≤ 2π‖h‖_s.
   F : X_2 → X_0. The approximate inverse A is the dense inverse of the N-mode Galerkin Jacobian on
   modes 0..N and the diagonal 1/λ_k, λ_k = c_0 (2πk)² + e_0, beyond. The radii polynomial
     p(r) = Y0 − (1 − Z1) r + ½ Z2 r²
   with Y0 = ‖A F(ū)‖_2, Z1 ≥ ‖I − A DF(ū)‖_{2→2} (explicit columns to KEXP ≥ 3N, an analytic
   tail beyond), Z2 r ≥ ‖A (DF(x) − DF(ū))‖ on the ball — proves a unique zero of F in the
   ball B_r(ū) ⊂ X_2 (van den Berg–Lessard; Krawczyk/Moore). A zero in X_2 is C² with an
   analytic Fourier series, so it is a classical solution; with m > 0 certified on the ball it
   is a strong solution in the paper's sense with m bounded away from zero.

   WHAT IS NOT CLAIMED. Uniqueness outside the ball, or outside the even subspace; anything
   where the density would vanish (the certifier refuses there: the void of the atlas); the
   paper's d-dimensional generality. */
'use strict';
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const SQ = require(path.join(__dirname, '..', 'interval', 'sequence.js'));
const RP = require(path.join(__dirname, '..', 'interval', 'radii.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { iv, ZERO, ONE } = I;
const { EVEN, ODD } = SQ;
const TWO_PI_F = 2 * Math.PI;
const TWO_PI = T.TWO_PI;

/* arithmetic shims: the same code runs in float and in intervals */
const FL = Object.assign({}, SQ.FLOAT, { twoPi: TWO_PI_F, k: (n) => n, neg: (a) => -a, div: (a, b) => a / b });
const IV = { ZERO, ONE, add: I.add, sub: I.sub, mul: I.mul, abs: I.abs, twoPi: TWO_PI, k: (n) => iv(n), neg: I.neg, div: I.div };

/* derivatives: even → odd (f′ = i·g, g_k = 2πk f_k) and odd → even ((i g)′ = −2πk g_k) */
function Deo(f, A) { const g = new Array(f.length); for (let k = 0; k < f.length; k++) g[k] = A.mul(A.mul(A.twoPi, A.k(k)), f[k]); return g; }
function Doe(g, A) { const f = new Array(g.length); for (let k = 0; k < g.length; k++) f[k] = A.neg(A.mul(A.mul(A.twoPi, A.k(k)), g[k])); return f; }
/* products with the parity bookkeeping: even·even, odd·odd (= −g∗h), even·odd */
const convEE = (f, g, K, A) => SQ.conv(f, g, K, EVEN, EVEN, A);
const convOO = (g, h, K, A) => SQ.conv(g, h, K, ODD, ODD, A).map(v => A.neg(v));
const convEO = (f, g, K, A) => SQ.conv(f, g, K, EVEN, ODD, A);
const scale = (f, s, A) => f.map(v => A.mul(A.k(s), v));
const addSeq = (f, g, A) => { const n = Math.max(f.length, g.length), o = new Array(n); for (let k = 0; k < n; k++) o[k] = A.add(k < f.length ? f[k] : A.ZERO, k < g.length ? g[k] : A.ZERO); return o; };
const subSeq = (f, g, A) => addSeq(f, g.map(v => A.neg(v)), A);
const pad = (f, n, A) => { const o = f.slice(); while (o.length < n + 1) o.push(A.ZERO); return o; };

/* the potential V = A cos 2πx: V_1 = A/2 in the two-sided convention */
const Vseq = (amp, K, A) => { const v = new Array(K + 1).fill(A.ZERO); v[1] = A.mul(A.k(amp), A.k(0.5)); return v; };

/* the pieces at a candidate u (length N+1): m, c, e, F — all as sequences of their natural bandwidth */
function pieces(u, P, A) {
  const N = u.length - 1;
  const w = Deo(u, A);                                          /* u′, odd */
  const w2 = convOO(w, w, 2 * N, A);                            /* u′², even */
  const V = Vseq(P.A, 2 * N, A);
  const m = subSeq(addSeq(pad(u, 2 * N, A), scale(w2, 0.5, A), A), V, A);          /* m = u + u′²/2 − V */
  const mw = convEO(m, w, 3 * N, A);                            /* m u′, odd */
  const w3 = convEO(w2, w, 3 * N, A);                           /* u′³ = −i (g∗g∗g)… as odd real part: convOO gave −g∗g, so w2∗w carries the sign: u′³ ↔ w2 · (i g) = i(w2∗g) */
  const q = addSeq(mw, scale(w3, P.eps, A), A);                 /* m u′ + ε u′³, odd */
  const u2 = convEE(u, u, 2 * N, A), u3 = convEE(u2, u, 3 * N, A);
  const F = subSeq(addSeq(pad(m, 3 * N, A), scale(u3, P.eps, A), A), Doe(q, A), A);
  F[0] = A.sub(F[0], A.ONE);
  const c = addSeq(m, scale(w2, 1 + 3 * P.eps, A), A);          /* c = m + (1 + 3ε) u′², even, 2N */
  const e = subSeq(scale(u2, 3 * P.eps, A), Doe(Deo(pad(u, 2 * N, A), A), A), A);  /* e = 1 − u″ + 3ε u² */
  e[0] = A.add(e[0], A.ONE);
  return { N, w, w2, m, c, e, F, u2 };
}
/* DF(ū) applied to a sequence h (any length), to bandwidth K: −(c h′)′ + e h */
function applyL(pc, h, K, A) {
  const hp = Deo(h, A);
  const chp = convEO(pc.c, hp, K, A);
  return subSeq(convEE(pc.e, h, K, A), Doe(chp, A), A);
}
/* the unit even vector e_k^+ (a single stored entry) */
const unit = (k, n, A) => { const o = new Array(n + 1).fill(A.ZERO); o[k] = A.ONE; return o; };

/* ---- float: the Galerkin Jacobian and Newton ---- */
function jacobianF(u, P) {
  const N = u.length - 1, pc = pieces(u, P, FL), J = [];
  for (let i = 0; i <= N; i++) J.push(new Array(N + 1).fill(0));
  for (let k = 0; k <= N; k++) { const col = applyL(pc, unit(k, N, FL), N, FL); for (let i = 0; i <= N; i++) J[i][k] = col[i]; }
  return J;
}
function solveF(M, b) {
  const n = b.length, A = M.map(r => r.slice()), x = b.slice();
  for (let k = 0; k < n; k++) {
    let p = k; for (let r = k + 1; r < n; r++) if (Math.abs(A[r][k]) > Math.abs(A[p][k])) p = r;
    [A[k], A[p]] = [A[p], A[k]]; [x[k], x[p]] = [x[p], x[k]];
    for (let r = k + 1; r < n; r++) { const f = A[r][k] / A[k][k]; if (!f) continue; for (let c = k; c < n; c++) A[r][c] -= f * A[k][c]; x[r] -= f * x[k]; }
  }
  for (let k = n - 1; k >= 0; k--) { let s = x[k]; for (let c = k + 1; c < n; c++) s -= A[k][c] * x[c]; x[k] = s / A[k][k]; }
  return x;
}
function invF(M) { const n = M.length, out = []; for (let i = 0; i < n; i++) out.push(new Array(n)); for (let j = 0; j < n; j++) { const e = new Array(n).fill(0); e[j] = 1; const col = solveF(M, e); for (let i = 0; i < n; i++) out[i][j] = col[i]; } return out; }
function newton(u0, P, opts) {
  let u = u0.slice(); const N = u.length - 1; let res = Infinity, it = 0;
  for (it = 0; it < (opts && opts.maxIter || 40); it++) {
    const pc = pieces(u, P, FL);
    res = Math.max(...pc.F.slice(0, N + 1).map(Math.abs));
    if (res < 1e-15) break;
    const d = solveF(jacobianF(u, P), pc.F.slice(0, N + 1).map(v => -v));
    for (let k = 0; k <= N; k++) u[k] += d[k];
  }
  return { u, res, it };
}
/* a candidate from the constant solution, continued in A (the float pass) */
function candidate(P, N, steps) {
  let u = new Array(N + 1).fill(0); u[0] = 1 - P.eps;
  const S = steps || 8;
  for (let s = 1; s <= S; s++) { const r = newton(u, Object.assign({}, P, { A: P.A * s / S })); u = r.u; }
  return newton(u, P);
}

/* ---- the weighted norms ---- */
const wgt = (k, s, nu) => (k === 0 ? 1 : 2 * Math.pow(1 + k, s) * Math.pow(nu, k));
const wgtI = (k, s, nu) => (k === 0 ? ONE : I.mul(iv(2), I.mul(I.pow(iv(1 + k), s), I.pow(iv(nu), k))));
function normI(f, s, nu) { let acc = ZERO; for (let k = 0; k < f.length; k++) { if (f[k][0] === 0 && f[k][1] === 0) continue; acc = I.add(acc, I.mul(I.abs(f[k]), wgtI(k, s, nu))); } return acc; }
/* a rigorous lower bound of an even cosine series on the torus: interval evaluation on cells */
function minOnTorus(f, cells) {
  let lo = Infinity;
  for (let c = 0; c < cells; c++) {
    const x = iv(c / cells, (c + 1) / cells);
    let s = f[0];
    for (let k = 1; k < f.length; k++) { if (f[k][0] === 0 && f[k][1] === 0) continue; s = I.add(s, I.mul(iv(2), I.mul(f[k], T.cos(I.mul(TWO_PI, I.mul(iv(k), x)))))); }
    if (s[0] < lo) lo = s[0];
  }
  return lo;
}

/* ---- the certificate ---- */
function certify(uF, P, opts) {
  opts = opts || {};
  const N = uF.length - 1, nu = opts.nu || 1.05, KEXP = Math.max(6 * N, opts.KEXP || 0);
  const u = uF.map(v => iv(v));
  const pc = pieces(u, P, IV);
  const c0 = pc.c[0], e0 = pc.e[0];
  const base = { N, nu, KEXP, c0: [c0[0], c0[1]], e0: [e0[0], e0[1]] };
  if (!(c0[0] > 0)) return Object.assign({ ok: false, why: 'the mean of the principal coefficient c = m + (1+3ε)u′² is not positive: the linearisation is not elliptic on average' }, base);
  if (!(e0[0] >= 0)) return Object.assign({ ok: false, why: 'e_0 < 0: the tail bound assumes λ_k ≥ c_0 (2πk)²' }, base);
  const lam = (k) => I.add(I.mul(c0, I.sqr(I.mul(TWO_PI, iv(k)))), e0);
  /* A_N: the float inverse of the float Galerkin Jacobian, as thin intervals */
  const AN = invF(jacobianF(uF, P)).map(r => r.map(v => iv(v)));
  const applyA = (v) => {                                     /* v: interval sequence (any length ≥ N+1) → A v, length v.length */
    const out = new Array(v.length).fill(ZERO);
    for (let i = 0; i <= N; i++) { let s = ZERO; for (let j = 0; j <= N; j++) { if (v[j][0] === 0 && v[j][1] === 0) continue; s = I.add(s, I.mul(AN[i][j], v[j])); } out[i] = s; }
    for (let i = N + 1; i < v.length; i++) out[i] = I.div(v[i], lam(i));
    return out;
  };
  /* Y0 */
  const Y0 = normI(applyA(pc.F), 2, nu);
  /* Z1: explicit columns 0..KEXP */
  let Z1 = ZERO, worst = -1;
  for (let k = 0; k <= KEXP; k++) {
    const col = applyL(pc, unit(k, Math.max(k, N), IV), k + 2 * N, IV);
    const Acol = applyA(col);
    Acol[k] = I.sub(Acol[k], ONE);                              /* (A DF − I) e_k^+ */
    const z = I.div(normI(Acol, 2, nu), wgtI(k, 2, nu));
    if (z[1] > Z1[1]) { Z1 = z; worst = k; }
  }
  /* the analytic tail: columns k > KEXP, with k₀ = KEXP + 1 the worst case of every k-dependent factor */
  const k0 = KEXP + 1;
  let Z1tail = ZERO;
  for (let n = -2 * N; n <= 2 * N; n++) {
    if (n === 0 || k0 + n < 1) continue;
    const an = Math.abs(n);
    const cn = an < pc.c.length ? pc.c[an] : ZERO, en = an < pc.e.length ? pc.e[an] : ZERO;
    const rho = n < 0 ? iv(k0 / (k0 + n)) : ONE;
    const om = n > 0 ? I.sqr(iv((1 + k0 + n) / (1 + k0))) : ONE;
    const nun = n > 0 ? I.pow(iv(nu), n) : ONE;
    const fac = I.mul(I.mul(rho, om), nun);
    const termC = I.mul(I.div(I.abs(cn), c0), fac);
    const termE = I.mul(I.div(I.abs(en), lam(k0 + n)), I.mul(om, nun));
    Z1tail = I.add(Z1tail, I.add(termC, termE));
  }
  const Z1all = Z1tail[1] > Z1[1] ? Z1tail : Z1;
  /* ‖A‖_{0→2} */
  let ANnorm = 0;
  for (let j = 0; j <= N; j++) { let s = ZERO; for (let i = 0; i <= N; i++) s = I.add(s, I.mul(I.abs(AN[i][j]), wgtI(i, 2, nu))); const v = I.div(s, wgtI(j, 0, nu)); if (v[1] > ANnorm) ANnorm = v[1]; }
  const Atail = I.div(I.sqr(iv(N + 2)), lam(N + 1))[1];
  const Anorm = iv(Math.max(ANnorm, Atail));
  /* Z2(r) = ‖A‖ (4π² Γ(r) + H(r)), Γ = ‖γ‖_1 ≤ g1 r + g2 r², H = ‖η‖_0 ≤ h1 r + h2 r² */
  const up1 = normI(pc.w, 1, nu), u0n = normI(pad(u, N, IV), 0, nu);
  const cf = iv(1.5 + 3 * P.eps), fourPi2 = I.sqr(TWO_PI);
  const g1 = I.add(ONE, I.mul(cf, I.mul(I.mul(iv(2), TWO_PI), up1))), g2 = I.mul(cf, fourPi2);
  const h1 = I.add(fourPi2, I.mul(iv(6 * P.eps), u0n)), h2 = iv(3 * P.eps);
  const Z2a = I.mul(Anorm, I.add(I.mul(fourPi2, g1), h1)), Z2b = I.mul(Anorm, I.add(I.mul(fourPi2, g2), h2));
  let result = null;
  for (const rCap of [1, 0.1, 0.01, 1e-3, 1e-4]) {
    const Z2 = I.add(Z2a, I.mul(Z2b, iv(rCap)));
    const rp = RP.radiiPolynomial(Y0, Z1all, Z2);
    if (rp.ok && rp.r <= rCap) { result = Object.assign(rp, { rCap, Z2: Z2[1] }); break; }
    if (!rp.ok && rp.why && rp.why.startsWith('Z1')) { result = rp; break; }
    result = result || rp;
  }
  const out = Object.assign({}, base, { Y0: Y0[1], Z1: Z1[1], Z1worst: worst, Z1tail: Z1tail[1], Anorm: Anorm[1], Z2a: Z2a[1], Z2b: Z2b[1] });
  if (!result || !result.ok) return Object.assign(out, { ok: false, why: (result && result.why) || 'no radius closed within the cap', kappa: result && result.kappa });
  const r = result.r;
  /* the density on the ball: m(x) ≥ min m̄ − (r + 2π‖ū′‖_0 r + 2π² r²) */
  const mMin = minOnTorus(pc.m, 512);
  const wp0 = normI(pc.w, 0, nu);
  const slack = I.add(I.add(iv(r), I.mul(I.mul(TWO_PI, wp0), iv(r))), I.mul(I.mul(iv(2), I.sqr(iv(Math.PI))), iv(r * r)))[1];
  const mLow = mMin - slack;
  if (!(mLow > 0)) return Object.assign(out, { ok: false, why: 'the density is not certified positive on the ball: min m̄ = ' + mMin.toExponential(3) + ', ball slack ' + slack.toExponential(2), r, kappa: result.kappa, mMin, mLow });
  return Object.assign(out, { ok: true, r, kappa: result.kappa, Z2: result.Z2, rCap: result.rCap, mMin, mLow });
}

/* ‖u − v‖_2 for two float candidates, exactly as an interval (thin inputs) */
function dist2(uA, uB, nu) { const n = Math.max(uA.length, uB.length); const d = []; for (let k = 0; k < n; k++) d.push(I.sub(iv(k < uA.length ? uA[k] : 0), iv(k < uB.length ? uB[k] : 0))); return normI(d, 2, nu); }

module.exports = { pieces, applyL, jacobianF, newton, candidate, certify, dist2, normI, minOnTorus, FL, IV, Deo, Doe, convEE, convOO, convEO };
