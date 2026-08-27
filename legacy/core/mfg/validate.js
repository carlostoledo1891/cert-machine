/* validate.js — the computer-assisted proof.

   WHAT IS PROVED. Given a numerical candidate x̄ for the stationary MFG system
   (see mfg1d.js), this produces either a REFUSAL or a rigorous statement:

       there exists an exact solution x* of the MFG system with
       ||x* − x̄|| <= r,  and it is the ONLY solution in that ball,

   where r is an explicit number and ||·|| is the weighted ell^1_nu norm on
   Fourier coefficients. Every quantity below is computed in outward-rounded
   interval arithmetic, so the inequalities hold for the exact real arithmetic
   the floating-point computation approximates.

   THE ARGUMENT is Newton–Kantorovich in the radii-polynomial form standard in
   validated numerics (van den Berg–Lessard school). With T(x) = x − A Φ(x) for
   an injective approximate inverse A of DΦ(x̄):

       ||T(x̄) − x̄||         <= Y0
       ||DT(x)||             <= Z1 + Z2 r      for ||x − x̄|| <= r
       p(r) := ½ Z2 r² − (1 − Z1) r + Y0

   If p(r) < 0 for some r > 0 then T is a contraction of the closed ball
   B_r(x̄) into itself, so it has a unique fixed point there, which is a zero
   of Φ, i.e. a solution. [STANDARD: Banach fixed point + the radii-polynomial
   lemma.] Nothing here is new as machinery; what is new is the operator it is
   pointed at.

   THE REPARAMETRISATION THAT MAKES IT WORK. In the (u, m) variables the HJB
   nonlinearity ½(u')² costs a derivative, so the nonlinear term is unbounded
   relative to the linear one and no Banach-algebra estimate closes. Writing the
   unknown as p := u' instead (a_k = p_k/(2πk)) and dividing the Fokker–Planck
   equation by 2πk turns BOTH equations into

       linear part diagonal and O(k)   +   pure convolution quadratic term,

   with no derivative loss anywhere:

     Φ_0     = −½ (p*p)_0 + ρ − c·b_0 − V_0
     Φ^H_k   = σ(2πk) p_k − ½ (p*p)_k − c b_k − V_k          k >= 1
     Φ^F_k   = σ(2πk) b_k + (b*p)_k                          k >= 1

   That is the whole trick, and it is why the claimed obstruction —
   "the forward–backward linearisation is non-coercive, so there is no
   computable bound on the inverse" — does not bind here. We never need an a
   priori bound on ||DΦ⁻¹||. We need an approximate inverse A whose defect
   ||I − A DΦ|| is SMALL, and we get it by construction: numerically on the
   finite block where the forward–backward coupling actually lives, and from
   the diagonal σ(2πk) on the tail, where the coupling is dominated. Coercivity
   is what an ANALYTIC proof would need; a computation needs neither coercivity
   nor monotonicity. See docs/THEORY.md §5 — this is the paper's point, and it
   is a negative result about the obstruction, not a use of monotonicity.

   NORM AND WEIGHTS. Unknowns are (ρ, p_1.., b_1..) with p odd, b even, b_0 = 1
   fixed. The two-sided sequences give basis weights w(ρ) = 1, w(p_k) = 2ν^k,
   w(b_k) = 2ν^k, and ||x|| = Σ_j w_j |x_j|. Operator norms are the induced
   weighted ell^1 norm, i.e. the max over columns of the weighted column sum.

   MIT licensed. Part of mfg-cap. */
'use strict';

const I = require('../interval/interval.js');
const { iv, add, sub, mul, div, neg, abs, mag, ZERO, ONE } = I;
const M1D = require('./mfg1d.js');
const TWO_PI = 2 * Math.PI;
/* Stage 2.4: last-ulp enclosure of the correctly-rounded image of 2π; ν^k by
   repeated mul of encloseFloat(ν) so the weight is not a thin Math.pow. */
const TWO_PI_I = I.encloseFloat(TWO_PI);
const TWO_PI_HI = TWO_PI_I[1];
function wNuI(nu, k) {
  if (k === 0) return ONE;
  let r = I.encloseFloat(nu);
  for (let i = 1; i < k; i++) r = mul(r, I.encloseFloat(nu));
  return mul(iv(2), r);
}
function lamI(sigma, k) { return mul(iv(sigma), mul(TWO_PI_I, iv(k))); }

/* ---------- index layout ----------
   j = 0        -> rho
   j = 1..K     -> p_1..p_K
   j = K+1..2K  -> b_1..b_K                                             */
const IDX = K => ({
  n: 2 * K + 1, K,
  rho: 0,
  p: k => k,
  b: k => K + k,
  weight: (j, nu) => (j === 0 ? 1 : 2 * Math.pow(nu, j <= K ? j : j - K))
});

/* interval sequence helpers: arrays hold k = 0..K, parity given separately */
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
/* ||f||_nu for a two-sided sequence stored as f[0..K] (either parity) */
function normNu(f, nu, hasZero) {
  let s = hasZero ? abs(f[0]) : ZERO;
  let nk = ONE;
  const nuI = iv(nu);
  for (let k = 1; k < f.length; k++) {
    nk = mul(nk, nuI);
    s = add(s, mul(iv(2), mul(abs(f[k]), nk)));
  }
  return s;
}

/* ---------- Φ and DΦ in the (ρ, p, b) variables, over intervals ---------- */
/* xbar: {rho, p[0..N], b[0..N]} as intervals (b[0] = 1 exactly) */
function buildPhi(xb, P, K) {
  /* returns Φ components for k = 0..K (H rows) and k = 1..K (F rows) */
  const { sigma, c, V } = P;
  const pp = convI(xb.p, xb.p, K, 'o', 'o');
  const bp = convI(xb.b, xb.p, K, 'e', 'o');
  const H = new Array(K + 1), F = new Array(K + 1);
  const Vi = k => (k < V.length ? iv(V[k]) : ZERO);
  H[0] = add(sub(mul(iv(-0.5), pp[0]), mul(iv(c), xb.b[0])), sub(xb.rho, Vi(0)));
  F[0] = ZERO;
  for (let k = 1; k <= K; k++) {
    const l = lamI(sigma, k);
    H[k] = sub(sub(mul(l, atO(xb.p, k)), mul(iv(0.5), pp[k])),
               add(mul(iv(c), atE(xb.b, k)), Vi(k)));
    F[k] = add(mul(l, atE(xb.b, k)), bp[k]);
  }
  return { H, F };
}

/* DΦ entry: row (type,k) column j, as an interval.
     ∂Φ_0/∂ρ = 1,  ∂Φ_0/∂p_m = 2 p_m
     ∂Φ^H_k/∂p_m = σ(2πk) δ_{km} − ( p_{k−m} − p_{k+m} )
     ∂Φ^H_k/∂b_m = −c δ_{km}
     ∂Φ^F_k/∂p_m = b_{k−m} − b_{k+m}
     ∂Φ^F_k/∂b_m = σ(2πk) δ_{km} + ( p_{k−m} + p_{k+m} )                  */
function dRow(type, k, xb, P, K) {
  const { sigma, c } = P;
  const row = { rho: ZERO, p: new Array(K + 1).fill(ZERO), b: new Array(K + 1).fill(ZERO) };
  if (type === 'H' && k === 0) {
    row.rho = ONE;
    for (let m = 1; m <= K; m++) row.p[m] = mul(iv(2), atO(xb.p, m));
    return row;
  }
  if (type === 'H') {
    const l = lamI(sigma, k);
    for (let m = 1; m <= K; m++) {
      let v = neg(sub(atO(xb.p, k - m), atO(xb.p, k + m)));
      if (m === k) v = add(v, l);
      row.p[m] = v;
      row.b[m] = (m === k) ? iv(-c) : ZERO;
    }
    return row;
  }
  const l = lamI(sigma, k);
  for (let m = 1; m <= K; m++) {
    row.p[m] = sub(atE(xb.b, k - m), atE(xb.b, k + m));
    let v = add(atO(xb.p, k - m), atO(xb.p, k + m));
    if (m === k) v = add(v, l);
    row.b[m] = v;
  }
  return row;
}

/* ---------- the validation ---------- */
/* opts: { nu, KC } — KC is how far columns are computed explicitly before the
   analytic tail bound takes over; it must be >= 2N for the analytic bound's
   hypothesis (B e_j reaches only tail rows) to hold. */
function validate(xFloat, P, opts) {
  opts = opts || {};
  const N = P.N;
  const nu = opts.nu || 1.05;
  const KC = opts.KC || 3 * N;             /* explicit columns up to index KC */
  const KR = KC + N;                       /* rows they can reach            */
  const { sigma, c } = P;

  /* --- candidate in (ρ, p, b) form, as thin intervals (exactly the floats) --- */
  const un = M1D.unpack(xFloat, N);
  const pbar = new Array(N + 1).fill(ZERO), bbar = new Array(N + 1).fill(ZERO);
  bbar[0] = ONE;
  for (let k = 1; k <= N; k++) {
    pbar[k] = mul(TWO_PI_I, iv(k * un.a[k]));
    bbar[k] = iv(un.b[k]);
  }
  const xb = { rho: iv(un.rho), p: pbar, b: bbar };

  const normP = normNu(pbar, nu, false);
  const normB = normNu(bbar, nu, true);          /* includes b_0 = 1 */
  const normBt = sub(normB, ONE);                /* the unknown part */

  /* --- finite Jacobian on indices <= N, its numerical inverse A_N --- */
  const L = IDX(N);
  const n = L.n;
  const Jf = new Float64Array(n * n);
  for (let k = 0; k <= N; k++) {
    const rowH = dRow('H', k, xb, P, N);
    const ri = (k === 0) ? 0 : L.p(k);
    Jf[ri * n + 0] = rowH.rho[0];
    for (let m = 1; m <= N; m++) {
      Jf[ri * n + L.p(m)] = rowH.p[m][0];
      Jf[ri * n + L.b(m)] = rowH.b[m][0];
    }
    if (k >= 1) {
      const rowF = dRow('F', k, xb, P, N);
      const rj = L.b(k);
      Jf[rj * n + 0] = rowF.rho[0];
      for (let m = 1; m <= N; m++) {
        Jf[rj * n + L.p(m)] = rowF.p[m][0];
        Jf[rj * n + L.b(m)] = rowF.b[m][0];
      }
    }
  }
  const AN = M1D.inverse(Jf, n);
  if (!AN) return { ok: false, why: 'finite Jacobian numerically singular' };

  /* A applied to a residual vector indexed by rows:
       rows with index <= N  -> A_N (dense)
       rows with index >  N  -> divide by σ2πk (diagonal tail inverse)      */
  const tailInv = k => div(ONE, lamI(sigma, k));

  /* ---------- Y0 = || A Φ(x̄) || ---------- */
  const Phi = buildPhi(xb, P, 2 * N);          /* x̄ band-limited ⇒ Φ dies past 2N */
  let Y0;
  {
    /* finite part: A_N · Φ_{<=N}, measured in the weighted norm */
    const rvec = new Array(n).fill(ZERO);
    rvec[0] = Phi.H[0];
    for (let k = 1; k <= N; k++) { rvec[L.p(k)] = Phi.H[k]; rvec[L.b(k)] = Phi.F[k]; }
    let s = ZERO;
    for (let i = 0; i < n; i++) {
      let acc = ZERO;
      for (let j = 0; j < n; j++) acc = add(acc, mul(iv(AN[i * n + j]), rvec[j]));
      s = add(s, mul(iv(L.weight(i, nu)), abs(acc)));
    }
    /* tail part: rows N < k <= 2N, divided by the diagonal */
    for (let k = N + 1; k <= 2 * N; k++) {
      const w = wNuI(nu, k);
      s = add(s, mul(w, abs(mul(tailInv(k), Phi.H[k]))));
      s = add(s, mul(w, abs(mul(tailInv(k), Phi.F[k]))));
    }
    Y0 = s;
  }

  /* ---------- Z1 = || I − A DΦ(x̄) || (max over columns) ---------- */
  let Z1 = ZERO, worstCol = null;
  {
    /* Pre-compute the rows of DΦ we need, up to KR. */
    const rowsH = [], rowsF = [];
    for (let k = 0; k <= KR; k++) {
      rowsH.push(dRow('H', k, xb, P, KC));
      rowsF.push(k >= 1 ? dRow('F', k, xb, P, KC) : null);
    }
    /* column j (explicit) for j = 0..(2KC+1) in the extended layout */
    const colNorm = (kind, m) => {
      /* entries of DΦ in this column, by row */
      const entH = new Array(KR + 1).fill(ZERO), entF = new Array(KR + 1).fill(ZERO);
      for (let k = 0; k <= KR; k++) {
        if (kind === 'rho') { entH[k] = (k === 0) ? ONE : ZERO; }
        else if (kind === 'p') { entH[k] = rowsH[k].p[m] || ZERO; if (k >= 1) entF[k] = rowsF[k].p[m] || ZERO; }
        else { entH[k] = rowsH[k].b[m] || ZERO; if (k >= 1) entF[k] = rowsF[k].b[m] || ZERO; }
      }
      /* apply A: finite rows through A_N, tail rows through the diagonal */
      const fin = new Array(n).fill(ZERO);
      fin[0] = entH[0];
      for (let k = 1; k <= N; k++) { fin[L.p(k)] = entH[k]; fin[L.b(k)] = entF[k]; }
      const out = new Array(n).fill(ZERO);
      for (let i = 0; i < n; i++) {
        let acc = ZERO;
        for (let jj = 0; jj < n; jj++) acc = add(acc, mul(iv(AN[i * n + jj]), fin[jj]));
        out[i] = acc;
      }
      /* subtract the identity column */
      const jIdx = kind === 'rho' ? 0 : (kind === 'p' ? (m <= N ? L.p(m) : -1) : (m <= N ? L.b(m) : -1));
      let s = ZERO;
      for (let i = 0; i < n; i++) {
        const e = (i === jIdx) ? ONE : ZERO;
        s = add(s, mul(iv(L.weight(i, nu)), abs(sub(e, out[i]))));
      }
      /* tail rows k > N: (I − A DΦ) entry = δ − (1/σ2πk)·DΦ entry */
      for (let k = N + 1; k <= KR; k++) {
        const w = wNuI(nu, k);
        const eH = (kind === 'p' && m === k) ? ONE : ZERO;
        const eF = (kind === 'b' && m === k) ? ONE : ZERO;
        s = add(s, mul(w, abs(sub(eH, mul(tailInv(k), entH[k])))));
        s = add(s, mul(w, abs(sub(eF, mul(tailInv(k), entF[k])))));
      }
      /* normalise by the column's own weight */
      return div(s, kind === 'rho' ? ONE : wNuI(nu, m));
    };
    const cand = [['rho', 0]];
    for (let m = 1; m <= KC; m++) { cand.push(['p', m]); cand.push(['b', m]); }
    for (const [kind, m] of cand) {
      const v = colNorm(kind, m);
      if (v[1] > mag(Z1)) { Z1 = v; worstCol = kind + (kind === 'rho' ? '' : '_' + m); }
    }
    /* analytic bound for columns m > KC: there B e_j reaches only tail rows
       (|k − m| <= N forces k >= m − N > KC − N >= N), so A acts as the diagonal
       and ||A B e_j||/w_j <= max(||p̄||+||b̄||, c+||p̄||) / (σ 2π (KC+1−N)).   */
    const pert = Math.max(mag(add(normP, normB)), mag(add(iv(c), normP)));
    const denom = mul(iv(sigma), mul(TWO_PI_I, iv(KC + 1 - N)));
    const tailAnalytic = div(iv(pert), denom);
    if (tailAnalytic[1] > mag(Z1)) { Z1 = tailAnalytic; worstCol = 'tail(analytic)'; }
  }

  /* ---------- Z2: Φ is quadratic, so DΦ is affine and the Lipschitz
     constant of x ↦ A DΦ(x) is a CONSTANT. For a perturbation h,
       (DΦ(x̄+h) − DΦ(x̄)) δ  has H-rows −(h_p * δp) and F-rows
       (h_b * δp) + (δb * h_p),  so its norm is <= 2||h|| by the Banach
     algebra property. Multiplying by A costs ||A||. ---------- */
  let Z2;
  {
    /* ||A|| in the induced norm: max over columns of A_N (weighted), and the
       tail diagonal 1/(σ2π(N+1)). */
    let anorm = 0;
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s = I.nextUp(s + L.weight(i, nu) * Math.abs(AN[i * n + j]));
      const v = I.nextUp(s / L.weight(j, nu));
      if (v > anorm) anorm = v;
    }
    const tailA = 1 / (sigma * TWO_PI * (N + 1));
    const A = Math.max(anorm, tailA);
    Z2 = iv(I.nextUp(2 * A));
  }

  /* ---------- radii polynomial  p(r) = ½Z2 r² − (1−Z1) r + Y0 ---------- */
  const y0 = mag(Y0), z1 = mag(Z1), z2 = mag(Z2);
  const res = { N, nu, KC, sigma, c, A: P.A, Y0: y0, Z1: z1, Z2: z2, worstCol };
  if (!(z1 < 1)) {
    return Object.assign(res, { ok: false, why: 'Z1 >= 1 — the approximate inverse is not good enough (raise N, or the problem is too stiff)' });
  }
  const disc = (1 - z1) * (1 - z1) - 2 * z2 * y0;
  if (!(disc > 0)) {
    return Object.assign(res, { ok: false, why: 'discriminant <= 0 — no radius closes the contraction' });
  }
  /* Roots of ½Z2 r² − (1−Z1) r + Y0. The float roots are only a starting
     point: the reported radius must satisfy p(r) < 0 RIGOROUSLY, so it is
     verified in interval arithmetic and enlarged until the upper bound of the
     enclosure of p(r) is strictly negative. Reporting the root itself would be
     wrong — there p(r) = 0 and the contraction is not strict. */
  const sq = Math.sqrt(disc);
  const rMin = I.nextUp(((1 - z1) - sq) / z2);
  const rMax = I.nextDown(((1 - z1) + sq) / z2);
  const pOf = rr => {
    const R = iv(rr);
    return add(sub(mul(mul(iv(0.5), Z2), mul(R, R)), mul(sub(ONE, Z1), R)), Y0);
  };
  let rStar = rMin, found = false;
  for (let t = 0; t < 200; t++) {
    if (rStar > rMax) break;
    if (pOf(rStar)[1] < 0) { found = true; break; }
    rStar = I.nextUp(rStar * 1.05 + Number.MIN_VALUE);
  }
  if (!found) {
    return Object.assign(res, { ok: false, why: 'no radius verified p(r) < 0 in interval arithmetic', rMin, rMax });
  }

  /* ---------- THE CONTRACTION FACTOR, and it was not being checked ----------
     Added 2026-07-29. Acceptance was exactly two tests: Z1 < 1, and p(r) < 0 in
     intervals. Neither of them is the hypothesis the theorem needs.

     T(x) = x − AΦ(x), so on B_r(x̄) the Lipschitz constant of T is bounded by
         kappa(r) = Z1 + Z2·r,
     because Z2 bounds the Lipschitz constant of x ↦ A·DΦ(x) (see the Z2 block
     above). The ½-variant of the radii polynomial,
         p(r) = ½Z2 r² − (1−Z1) r + Y0 < 0,
     gives T(B_r) ⊆ B_r — a SELF-MAP — and rearranges only to Z1 + Z2r < 2 − Z1.
     A self-map of a ball in an infinite-dimensional Banach space need not have a
     fixed point at all, so without kappa < 1 neither Banach existence nor the
     uniqueness half follows. This is the theorem's own hypothesis, not a
     refinement of it. (The ½-free variant of the radii polynomial DOES imply it;
     this file uses the ½ variant, and that is the whole gap.)

     WHY CHECKING AT rStar IS BOTH CORRECT AND OPTIMAL: kappa is increasing in r,
     and the loop above returns the SMALLEST radius with p(r) < 0. So rStar
     carries the smallest kappa available among admissible radii — if it fails
     here it fails at every larger radius too, and there is nothing to retry.

     MEASURED HERE, 2026-07-29, by running this code path — not quoted from the
     review that found the gap, whose figures came out of a different evaluation
     point and did not reproduce:
         (sigma, c, A, N)                 kappa      r
         (0.5,  1,   1,   16)             0.0260     1.17e-15
         (0.3,  2,   1.5, 20)             0.0644     4.60e-15
         (0.5,  1,   0.5, 16)             0.0223     9.44e-16
         (0.5,  1,   1.5, 16)             0.0297     1.44e-15
         (0.5, -12,  0,   16)             0.2247     7.22e-15
         (0.5, -16,  0,   16)             0.2996     1.33e-14
         (0.5, -24,  0,   16)             0.4494     2.03e-14
     Every reported instance holds with margin, so no published result moves and
     the multiplicity table is unaffected. What changes is that the hypothesis is
     verified rather than assumed — and it CAN fail: kappa grows with |c|
     (0.22 -> 0.30 -> 0.45 above), and near tangency the roots pinch together and
     push rStar up, which is precisely the regime where a verifier must not be
     believed on the strength of a discriminant alone. */
  const kappaOf = rr => add(Z1, mul(Z2, iv(rr)));
  const kappa = kappaOf(rStar);
  if (!(kappa[1] < 1)) {
    return Object.assign(res, {
      ok: false, rMin, rMax, r: rStar, kappa: kappa[1],
      why: 'contraction factor Z1 + Z2*r >= 1 at the smallest radius closing p(r) < 0 — ' +
           'T is a self-map of the ball but NOT a contraction on it, so neither existence nor ' +
           'local uniqueness follows (kappa is increasing in r, so no larger radius helps)'
    });
  }
  return Object.assign(res, { ok: true, rMin, rMax, r: rStar, pAtR: pOf(rStar)[1], kappa: kappa[1], disc });
}

/* ---------- rigorous positivity of the density over the WHOLE enclosure ----------
   The enclosure controls coefficients in ||·||_nu with nu >= 1, and that norm
   dominates the plain ell^1 norm, which dominates the sup norm:
       sup_x |m(x) − m̄(x)|  <=  Σ_k |Δb_k|  <=  ||Δb||_nu  <=  r.
   So a rigorous lower bound on min m̄ minus r is a rigorous lower bound on
   min m. min m̄ is bounded below by sampling on a grid and paying the modulus
   of continuity, with the derivative bound L = Σ_k 2·2πk|b̄_k| — no sampling
   argument is left unquantified. m > 0 is a HYPOTHESIS of the model, so it is
   certified, never assumed. */
function certifyPositivity(xFloat, P, r, G) {
  const N = P.N;
  const un = M1D.unpack(xFloat, N);
  let L = 0;
  for (let k = 1; k <= N; k++) L = I.nextUp(L + 2 * TWO_PI_HI * k * Math.abs(un.b[k]));
  /* The grid must resolve the density, not merely be large: refine until the
     modulus-of-continuity term is small next to the sampled minimum, so a
     REFUSAL is a statement about m and not about the sampling. */
  G = G || 4096;
  let lo = Infinity, guard = 0;
  for (;;) {
  lo = Infinity;
  for (let g = 0; g < G; g++) {
    const t = g / G;
    let m = iv(1);
    for (let k = 1; k <= N; k++) {
      const ang = TWO_PI * k * t;
      /* Stage 2.4: derived trig pad (eqcert.encloseCos), not a remembered ±1e-15. */
      const ci = I.encloseCos(ang);
      m = add(m, mul(iv(2 * un.b[k]), ci));
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

module.exports = { validate, certifyPositivity, IDX, convI, normNu, buildPhi, dRow };
