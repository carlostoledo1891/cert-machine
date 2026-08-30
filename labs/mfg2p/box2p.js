/* box2p.js — UNIFORM-OVER-A-PARAMETER-BOX validation for the TWO-POPULATION
   stationary quadratic mean-field game, with a tangent predictor.

   Same argument as labs/mfg/box.js, one population more. It proves

       for EVERY parameter s in the box S there is an exact solution x*(s) of
       the two-population system with ||x*(s) - xbar(s)|| <= r, and it is the
       only solution in that ball,

   where xbar(s) is an explicit affine predictor through the box. Two disjoint
   box certificates over one cell therefore prove MULTIPLICITY for every
   parameter in that cell — a set of positive measure on which uniqueness fails,
   carrying its own exact witness.

   WHAT THE SECOND POPULATION CHANGES, exactly:

     (1) THE STATE SPACE doubles. The norm is the weighted ell^1 norm over the
         concatenated vector, so ||f*g|| <= ||f|| ||g|| still applies inside each
         population and the operator norm is still a maximum over columns. The
         price is honest and visible: two decoupled populations have twice the
         Y0 of one, because Y0 is a SUM over components.

     (2) THE COUPLING MATRIX enters ONLY as constants. Every nonlinearity is
         intra-population, so DPhi's off-diagonal blocks are the constant -c_ij
         on the (H_{i,k}, b_{j,k}) entries. In the analytic tail bound that
         shows up in one place and it matters: the b_{i,m} column now collects
         |c_{j,i}| summed over EVERY population j, not a single |c|. A coupling
         term left out of the tail is a hole in the proof, not a small error.

     (3) SEVEN PARAMETER DIRECTIONS instead of three — sigma, the four c_ij, and
         the two well depths A_i. Each live direction costs one tangent solve
         against the already-factored midpoint Jacobian.

   THE SIGMA CAVEAT, INHERITED AND UNCHANGED. A must be a FIXED operator, so its
   tail diagonal is built at the MIDPOINT sigma; the tail of I - A DPhi then
   carries 1 - sigma/sigma0, which does not decay in k and is added to Z1 by
   hand. A sigma box is therefore expensive here exactly as it is in box.js.
   That is why regime2p.js maps the COUPLING plane at fixed sigma: the finding
   does not need the sigma axis, and claiming a cheap sigma box would be a lie.

   MIT licensed. Part of cert-machine (labs/mfg2p). */
'use strict';

const I = require('../../legacy/core/interval/interval.js');
const M2 = require('./mfg2p.js');

const { iv, add, sub, mul, div, neg, abs, mag, mig, ZERO, ONE } = I;
const TWO_PI = 2 * Math.PI;
const TWO_PI_I = I.encloseFloat(TWO_PI);
const TWO_PI_HI = TWO_PI_I[1];
const NPOP = M2.P;

function wNuI(nu, k) {                       /* nu^k, never a thin Math.pow */
  if (k === 0) return ONE;
  let r = I.encloseFloat(nu);
  for (let i = 1; i < k; i++) r = mul(r, I.encloseFloat(nu));
  return mul(iv(2), r);
}

/* index layout: population i occupies [i*(2N+1), (i+1)*(2N+1)) as
   rho_i, p_{i,1..N}, b_{i,1..N} — the same order mfg2p.js packs. */
const IDX = N => ({
  n: NPOP * (2 * N + 1), N,
  rho: i => i * (2 * N + 1),
  p: (i, k) => i * (2 * N + 1) + k,
  b: (i, k) => i * (2 * N + 1) + N + k,
  weight: (j, nu) => {
    const q = j % (2 * N + 1);
    return q === 0 ? 1 : 2 * Math.pow(nu, q <= N ? q : q - N);
  }
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

/* ---- the box -----------------------------------------------------------
   box = { sigma:[lo,hi], c:{c11,c12,c21,c22} each [lo,hi], A:[[lo,hi],[lo,hi]], N }.
   A thin box is [t,t]. V_i(x) = A_i cos 2 pi x, so V_{i,1} = A_i/2 and halving
   is exact in binary floating point — a thin A box stays thin.            */
const mid = t => 0.5 * (t[0] + t[1]);
const half = t => 0.5 * (t[1] - t[0]);
const CKEYS = ['c11', 'c12', 'c21', 'c22'];
const cIndex = { c11: [0, 0], c12: [0, 1], c21: [1, 0], c22: [1, 1] };

function midProblem(box) {
  return M2.makeProblem({
    sigma: mid(box.sigma),
    C: CKEYS.map(k => mid(box.c[k])),
    A: [mid(box.A[0]), mid(box.A[1])],
    N: box.N
  });
}
function VboxI(box, thin) {
  const V = [];
  for (let i = 0; i < NPOP; i++) {
    const Vi = new Array(box.N + 1).fill(ZERO);
    if (box.N >= 1) {
      const a = box.A[i];
      Vi[1] = thin ? iv(mid(a) / 2) : iv(a[0] / 2, a[1] / 2);
    }
    V.push(Vi);
  }
  return V;
}
function Cbox(box, thin) {
  const C = [];
  for (const k of CKEYS) C.push(thin ? iv(mid(box.c[k])) : iv(box.c[k][0], box.c[k][1]));
  return C;                                   /* row-major [c11,c12,c21,c22] */
}

/* Phi over intervals. xb is [{rho, p[], b[]}, ...], one entry per population. */
function buildPhiI(xb, SIG, C, V, K) {
  const H = [], F = [];
  for (let i = 0; i < NPOP; i++) {
    const pp = convI(xb[i].p, xb[i].p, K, 'o', 'o');
    const bp = convI(xb[i].b, xb[i].p, K, 'e', 'o');
    const Hi = new Array(K + 1), Fi = new Array(K + 1);
    const Vi = k => (k < V[i].length ? V[i][k] : ZERO);
    const lam = k => mul(SIG, mul(TWO_PI_I, iv(k)));
    /* the coupling, and the ONLY place populations meet: sum_j c_ij b_{j,k} */
    const cpl = k => { let s = ZERO; for (let j = 0; j < NPOP; j++) s = add(s, mul(C[i * NPOP + j], atE(xb[j].b, k))); return s; };
    Hi[0] = add(sub(mul(iv(-0.5), pp[0]), cpl(0)), sub(xb[i].rho, Vi(0)));
    Fi[0] = ZERO;
    for (let k = 1; k <= K; k++) {
      Hi[k] = sub(sub(mul(lam(k), atO(xb[i].p, k)), mul(iv(0.5), pp[k])), add(cpl(k), Vi(k)));
      Fi[k] = add(mul(lam(k), atE(xb[i].b, k)), bp[k]);
    }
    H.push(Hi); F.push(Fi);
  }
  return { H, F };
}

/* a row of DPhi over intervals. Returns entries against every population's
   variables: rho[i], p[i][m], b[i][m]. */
function dRowI(type, i, k, xb, SIG, C, K) {
  const row = {
    rho: new Array(NPOP).fill(ZERO),
    p: Array.from({ length: NPOP }, () => new Array(K + 1).fill(ZERO)),
    b: Array.from({ length: NPOP }, () => new Array(K + 1).fill(ZERO))
  };
  const lam = mul(SIG, mul(TWO_PI_I, iv(k)));
  if (type === 'H' && k === 0) {
    row.rho[i] = ONE;
    for (let m = 1; m <= K; m++) row.p[i][m] = mul(iv(2), atO(xb[i].p, m));
    /* b_{j,0} is fixed at 1 — no column */
    return row;
  }
  if (type === 'H') {
    for (let m = 1; m <= K; m++) {
      let v = neg(sub(atO(xb[i].p, k - m), atO(xb[i].p, k + m)));
      if (m === k) v = add(v, lam);
      row.p[i][m] = v;
      for (let j = 0; j < NPOP; j++) row.b[j][m] = (m === k) ? neg(C[i * NPOP + j]) : ZERO;
    }
    return row;
  }
  for (let m = 1; m <= K; m++) {
    row.p[i][m] = sub(atE(xb[i].b, k - m), atE(xb[i].b, k + m));
    let v = add(atO(xb[i].p, k - m), atO(xb[i].p, k + m));
    if (m === k) v = add(v, lam);
    row.b[i][m] = v;
  }
  return row;
}

/* DPhi(x) applied to a direction d = [{rho, p[], b[]}, ...] */
function dPhiApply(xb, d, SIG, C, K) {
  const H = [], F = [];
  for (let i = 0; i < NPOP; i++) {
    const pdp = convI(xb[i].p, d[i].p, K, 'o', 'o');
    const bdp = convI(xb[i].b, d[i].p, K, 'e', 'o');
    const dbp = convI(d[i].b, xb[i].p, K, 'e', 'o');
    const Hi = new Array(K + 1), Fi = new Array(K + 1);
    const lam = k => mul(SIG, mul(TWO_PI_I, iv(k)));
    const cpl = k => { let s = ZERO; for (let j = 0; j < NPOP; j++) s = add(s, mul(C[i * NPOP + j], atE(d[j].b, k))); return s; };
    Hi[0] = sub(sub(d[i].rho, pdp[0]), cpl(0));   /* d_b0 = 0, so cpl(0) = 0 */
    Fi[0] = ZERO;
    for (let k = 1; k <= K; k++) {
      Hi[k] = sub(sub(mul(lam(k), atO(d[i].p, k)), pdp[k]), cpl(k));
      Fi[k] = add(mul(lam(k), atE(d[i].b, k)), add(bdp[k], dbp[k]));
    }
    H.push(Hi); F.push(Fi);
  }
  return { H, F };
}

/* d/d(dir) of Phi at fixed x — the parameter derivative.
     sigma : H_{i,k} = (2 pi k) p_{i,k},  F_{i,k} = (2 pi k) b_{i,k}
     c_ij  : H_{i,0} = -b_{j,0} = -1,     H_{i,k} = -b_{j,k}
     A_i   : H_{i,1} = -1/2                                                  */
function dParamPhi(dir, xb, K) {
  const H = Array.from({ length: NPOP }, () => new Array(K + 1).fill(ZERO));
  const F = Array.from({ length: NPOP }, () => new Array(K + 1).fill(ZERO));
  if (dir === 'sigma') {
    for (let i = 0; i < NPOP; i++) for (let k = 1; k <= K; k++) {
      const tk = mul(TWO_PI_I, iv(k));
      H[i][k] = mul(tk, atO(xb[i].p, k));
      F[i][k] = mul(tk, atE(xb[i].b, k));
    }
  } else if (cIndex[dir]) {
    const [i, j] = cIndex[dir];
    H[i][0] = neg(atE(xb[j].b, 0));
    for (let k = 1; k <= K; k++) H[i][k] = neg(atE(xb[j].b, k));
  } else if (dir === 'A1' || dir === 'A2') {
    const i = dir === 'A1' ? 0 : 1;
    if (K >= 1) H[i][1] = iv(-0.5);
  }
  return { H, F };
}

const DIRS = ['sigma', 'c11', 'c12', 'c21', 'c22', 'A1', 'A2'];
function widths(box) {
  const h = { sigma: half(box.sigma), A1: half(box.A[0]), A2: half(box.A[1]) };
  for (const k of CKEYS) h[k] = half(box.c[k]);
  return h;
}

/* ---- the validation, uniform over the box ------------------------------ */
function validateBox(xFloat, box, opts) {
  opts = opts || {};
  const N = box.N;
  const nu = opts.nu || 1.05;
  const KC = opts.KC || 3 * N;
  const KR = KC + N;
  if (!(box.sigma[0] > 0)) return { ok: false, why: 'sigma box must be strictly positive' };
  const SIG = iv(box.sigma[0], box.sigma[1]);
  const C = Cbox(box, false), C0 = Cbox(box, true);
  const V = VboxI(box, false), V0 = VboxI(box, true);
  const sigma0 = mid(box.sigma), SIG0 = iv(sigma0);
  const hs = widths(box);
  const L = IDX(N), n = L.n;

  /* the candidate at the midpoint, in (rho, p, b), thin */
  const st = M2.unpack(xFloat, N);
  const xb0 = [];
  for (let i = 0; i < NPOP; i++) {
    const p0 = new Array(N + 1).fill(ZERO), b0 = new Array(N + 1).fill(ZERO);
    b0[0] = ONE;
    for (let k = 1; k <= N; k++) { p0[k] = mul(TWO_PI_I, iv(k * st[i].a[k])); b0[k] = iv(st[i].b[k]); }
    xb0.push({ rho: iv(st[i].rho), p: p0, b: b0 });
  }

  /* A, part 1: the dense inverse of the MIDPOINT Jacobian on indices <= N */
  const Jf = new Float64Array(n * n);
  const putRow = (ri, row) => {
    for (let i = 0; i < NPOP; i++) {
      Jf[ri * n + L.rho(i)] = row.rho[i][0];
      for (let m = 1; m <= N; m++) {
        Jf[ri * n + L.p(i, m)] = row.p[i][m][0];
        Jf[ri * n + L.b(i, m)] = row.b[i][m][0];
      }
    }
  };
  for (let i = 0; i < NPOP; i++) {
    putRow(L.rho(i), dRowI('H', i, 0, xb0, SIG0, C0, N));
    for (let k = 1; k <= N; k++) {
      putRow(L.p(i, k), dRowI('H', i, k, xb0, SIG0, C0, N));
      putRow(L.b(i, k), dRowI('F', i, k, xb0, SIG0, C0, N));
    }
  }
  const AN = M2.inverse(Jf, n);
  if (!AN) return { ok: false, why: 'midpoint Jacobian numerically singular' };
  /* A, part 2: the tail diagonal, at the MIDPOINT sigma (A must not vary over S) */
  const tailInv = k => div(ONE, mul(SIG0, mul(TWO_PI_I, iv(k))));

  /* ||A v|| for a vector v given as H[i][0..K] and F[i][1..K] */
  function ANorm(H, F, K) {
    const rvec = new Array(n).fill(ZERO);
    for (let i = 0; i < NPOP; i++) {
      rvec[L.rho(i)] = H[i][0];
      for (let k = 1; k <= N; k++) { rvec[L.p(i, k)] = H[i][k]; rvec[L.b(i, k)] = F[i][k]; }
    }
    let s = ZERO;
    for (let a = 0; a < n; a++) {
      let acc = ZERO;
      for (let b = 0; b < n; b++) acc = add(acc, mul(iv(AN[a * n + b]), rvec[b]));
      s = add(s, mul(iv(L.weight(a, nu)), abs(acc)));
    }
    for (let i = 0; i < NPOP; i++) for (let k = N + 1; k <= K; k++) {
      const w = wNuI(nu, k);
      s = add(s, mul(w, abs(mul(tailInv(k), H[i][k]))));
      s = add(s, mul(w, abs(mul(tailInv(k), F[i][k]))));
    }
    return s;
  }

  /* ---- the tangent predictor: DPhi xdot = -d_dir Phi, one solve per live
     direction, reusing the factored midpoint Jacobian. opts.freezePredictor
     zeroes every tangent — the fixed-candidate bound a single-point argument
     gives when pointed at a box — so the battery can require the same cell to
     fail without it. A trick nobody can switch off is a trick nobody has
     measured.                                                              */
  const dirs = DIRS.filter(d => hs[d] > 0);
  const zeroDir = () => Array.from({ length: NPOP }, () => ({ rho: ZERO, p: new Array(N + 1).fill(ZERO), b: new Array(N + 1).fill(ZERO) }));
  const xdot = {};
  for (const dir of dirs) {
    if (opts.freezePredictor) { xdot[dir] = zeroDir(); continue; }
    const g = dParamPhi(dir, xb0, N);
    const rhs = new Float64Array(n);
    for (let i = 0; i < NPOP; i++) {
      rhs[L.rho(i)] = -g.H[i][0][0];
      for (let k = 1; k <= N; k++) { rhs[L.p(i, k)] = -g.H[i][k][0]; rhs[L.b(i, k)] = -g.F[i][k][0]; }
    }
    const z = M2.solveLin(Jf, rhs, n);
    if (!z) return { ok: false, why: 'tangent solve failed (midpoint Jacobian singular)' };
    const d = [];
    for (let i = 0; i < NPOP; i++) {
      const di = { rho: iv(z[L.rho(i)]), p: new Array(N + 1).fill(ZERO), b: new Array(N + 1).fill(ZERO) };
      for (let k = 1; k <= N; k++) { di.p[k] = iv(z[L.p(i, k)]); di.b[k] = iv(z[L.b(i, k)]); }
      d.push(di);
    }
    xdot[dir] = d;
  }

  /* the predictor over the box: xbar(s) = x0 + sum_dir (s_dir - s0_dir) xdot_dir */
  const xb = xb0.map(v => ({ rho: v.rho, p: v.p.slice(), b: v.b.slice() }));
  for (const dir of dirs) {
    const t = iv(-hs[dir], hs[dir]), d = xdot[dir];
    for (let i = 0; i < NPOP; i++) {
      xb[i].rho = add(xb[i].rho, mul(t, d[i].rho));
      for (let k = 1; k <= N; k++) { xb[i].p[k] = add(xb[i].p[k], mul(t, d[i].p[k])); xb[i].b[k] = add(xb[i].b[k], mul(t, d[i].b[k])); }
    }
  }
  const normP = xb.map(v => normNu(v.p, nu, false));
  const normB = xb.map(v => normNu(v.b, nu, true));

  /* ---- Y0: centre term + mean-value term in each live direction ---- */
  let Y0;
  {
    const Phi0 = buildPhiI(xb0, SIG0, C0, V0, 2 * N);
    Y0 = ANorm(Phi0.H, Phi0.F, 2 * N);
    for (const dir of dirs) {
      const a1 = dPhiApply(xb, xdot[dir], SIG, C, 2 * N);
      const a2 = dParamPhi(dir, xb, 2 * N);
      const H = [], F = [];
      for (let i = 0; i < NPOP; i++) {
        const Hi = new Array(2 * N + 1), Fi = new Array(2 * N + 1);
        for (let k = 0; k <= 2 * N; k++) { Hi[k] = add(a1.H[i][k], a2.H[i][k]); Fi[k] = add(a1.F[i][k] || ZERO, a2.F[i][k] || ZERO); }
        H.push(Hi); F.push(Fi);
      }
      Y0 = add(Y0, mul(iv(hs[dir]), ANorm(H, F, 2 * N)));
    }
  }

  /* ---- Z1 = sup_S || I - A DPhi(xbar(s)) || (max over columns) ---- */
  let Z1 = ZERO, worstCol = null;
  {
    const rowsH = [], rowsF = [];
    for (let i = 0; i < NPOP; i++) {
      const rh = [], rf = [];
      for (let k = 0; k <= KR; k++) {
        rh.push(dRowI('H', i, k, xb, SIG, C, KC));
        rf.push(k >= 1 ? dRowI('F', i, k, xb, SIG, C, KC) : null);
      }
      rowsH.push(rh); rowsF.push(rf);
    }
    /* one column of I - A DPhi, identified by (kind, population, mode m) */
    const colNorm = (kind, ci, m) => {
      const entH = Array.from({ length: NPOP }, () => new Array(KR + 1).fill(ZERO));
      const entF = Array.from({ length: NPOP }, () => new Array(KR + 1).fill(ZERO));
      for (let i = 0; i < NPOP; i++) for (let k = 0; k <= KR; k++) {
        if (kind === 'rho') { entH[i][k] = (k === 0 && i === ci) ? ONE : ZERO; }
        else if (kind === 'p') { entH[i][k] = rowsH[i][k].p[ci][m] || ZERO; if (k >= 1) entF[i][k] = rowsF[i][k].p[ci][m] || ZERO; }
        else { entH[i][k] = rowsH[i][k].b[ci][m] || ZERO; if (k >= 1) entF[i][k] = rowsF[i][k].b[ci][m] || ZERO; }
      }
      const fin = new Array(n).fill(ZERO);
      for (let i = 0; i < NPOP; i++) {
        fin[L.rho(i)] = entH[i][0];
        for (let k = 1; k <= N; k++) { fin[L.p(i, k)] = entH[i][k]; fin[L.b(i, k)] = entF[i][k]; }
      }
      const out = new Array(n).fill(ZERO);
      for (let a = 0; a < n; a++) {
        let acc = ZERO;
        for (let b = 0; b < n; b++) acc = add(acc, mul(iv(AN[a * n + b]), fin[b]));
        out[a] = acc;
      }
      const jIdx = kind === 'rho' ? L.rho(ci) : (m <= N ? (kind === 'p' ? L.p(ci, m) : L.b(ci, m)) : -1);
      let s = ZERO;
      for (let a = 0; a < n; a++) {
        const e = (a === jIdx) ? ONE : ZERO;
        s = add(s, mul(iv(L.weight(a, nu)), abs(sub(e, out[a]))));
      }
      for (let i = 0; i < NPOP; i++) for (let k = N + 1; k <= KR; k++) {
        const w = wNuI(nu, k);
        const eH = (kind === 'p' && i === ci && m === k) ? ONE : ZERO;
        const eF = (kind === 'b' && i === ci && m === k) ? ONE : ZERO;
        s = add(s, mul(w, abs(sub(eH, mul(tailInv(k), entH[i][k])))));
        s = add(s, mul(w, abs(sub(eF, mul(tailInv(k), entF[i][k])))));
      }
      return div(s, kind === 'rho' ? ONE : wNuI(nu, m));
    };
    const cand = [];
    for (let i = 0; i < NPOP; i++) cand.push(['rho', i, 0]);
    for (let m = 1; m <= KC; m++) for (let i = 0; i < NPOP; i++) { cand.push(['p', i, m]); cand.push(['b', i, m]); }
    for (const [kind, ci, m] of cand) {
      const v = colNorm(kind, ci, m);
      if (v[1] > mag(Z1)) { Z1 = v; worstCol = kind + (kind === 'rho' ? '' : '_' + m) + '@pop' + (ci + 1); }
    }
    /* columns m > KC: A acts as the midpoint diagonal there, so
         (I - A DPhi) e_m = (1 - sigma/sigma0) e_m - (quadratic part)/(sigma0 2 pi k).
       THE COUPLING LIVES IN THE SECOND TERM. Column p_{i,m} sees ||p_i|| from
       the H_i rows and ||b_i|| from the F_i rows. Column b_{i,m} sees |c_{j,i}|
       from EVERY population j's H rows -- the whole i-th COLUMN of C, not one
       entry -- plus ||p_i|| from F_i. Dropping the j != i terms here would be a
       hole in the proof, so the sum is taken over j explicitly. */
    const diagDefect = mag(sub(ONE, div(SIG, SIG0)));
    let pert = 0;
    for (let i = 0; i < NPOP; i++) {
      pert = Math.max(pert, mag(add(normP[i], normB[i])));           /* column p_{i,m} */
      let ccol = ZERO;
      for (let j = 0; j < NPOP; j++) ccol = add(ccol, abs(C[j * NPOP + i]));
      pert = Math.max(pert, mag(add(ccol, normP[i])));               /* column b_{i,m} */
    }
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
  const res = { N, nu, KC, dirs: dirs.slice(), Y0: y0, Z1: z1, Z2: z2, worstCol };
  if (!(z1 < 1)) return Object.assign(res, { ok: false, why: 'Z1 >= 1 over the box — the midpoint inverse does not control the whole cell' });
  const disc = (1 - z1) * (1 - z1) - 2 * z2 * y0;
  if (!(disc > 0)) return Object.assign(res, { ok: false, why: 'discriminant <= 0 — no radius closes the contraction over the box' });
  const sq = Math.sqrt(disc);
  const rMin = I.nextUp(((1 - z1) - sq) / z2);
  const rMax = I.nextDown(((1 - z1) + sq) / z2);
  const pAt = rr => { const R = iv(rr); return add(sub(mul(mul(iv(0.5), Z2), mul(R, R)), mul(sub(ONE, Z1), R)), Y0); };
  let rStar = rMin, found = false;
  for (let t = 0; t < 400; t++) {
    if (rStar > rMax) break;
    if (pAt(rStar)[1] < 0) { found = true; break; }
    rStar = I.nextUp(rStar * 1.05 + Number.MIN_VALUE);
  }
  if (!found) return Object.assign(res, { ok: false, why: 'no radius verified p(r) < 0 in interval arithmetic', rMin, rMax });
  const kappa = add(Z1, mul(Z2, iv(rStar)));
  if (!(kappa[1] < 1)) {
    return Object.assign(res, { ok: false, r: rStar, kappa: kappa[1], rMin, rMax,
      why: 'contraction factor Z1 + Z2 r >= 1 at the smallest admissible radius — T is a self-map but not a contraction' });
  }
  return Object.assign(res, { ok: true, rMin, rMax, r: rStar, pAtR: pAt(rStar)[1], kappa: kappa[1], disc,
    predictor: xb.map(v => ({ rho: [v.rho[0], v.rho[1]], p: v.p.map(z => [z[0], z[1]]), b: v.b.map(z => [z[0], z[1]]) })) });
}

/* ---- positivity of BOTH densities over the whole enclosure, over the whole
   box. The nu-norm dominates ell^1, which dominates the sup norm, so
   sup_x |m_i(x) - mbar_i(x)| <= r for each i, and a rigorous lower bound on
   min mbar_i over the box, minus r, bounds min m_i below for every parameter in
   the cell. m_i > 0 is a HYPOTHESIS of the model, so it is certified, never
   assumed — and with two populations BOTH must clear it.                    */
function boxPositivity(predictor, N, r, G) {
  const out = [];
  for (let i = 0; i < NPOP; i++) {
    const bI = predictor[i].b;
    let Lc = 0;
    for (let k = 1; k <= N; k++) Lc = I.nextUp(Lc + 2 * TWO_PI_HI * k * mag(bI[k]));
    let g0 = G || 4096, lo = Infinity, guard = 0;
    for (;;) {
      lo = Infinity;
      for (let g = 0; g < g0; g++) {
        const t = g / g0;
        let m = iv(1);
        for (let k = 1; k <= N; k++) {
          const ci = I.encloseCos(TWO_PI * k * t);
          m = add(m, mul([2 * bI[k][0], 2 * bI[k][1]], ci));   /* doubling is exact */
        }
        if (m[0] < lo) lo = m[0];
      }
      const slack = I.nextUp(Lc / (2 * g0));
      if (slack < 0.25 * Math.abs(lo) || g0 >= (1 << 21) || ++guard > 12) break;
      g0 *= 4;
    }
    const minMbar = I.nextDown(lo - I.nextUp(Lc / (2 * g0)));
    const minM = I.nextDown(minMbar - r);
    out.push({ minMbar, minM, positive: minM > 0, L: Lc, G: g0 });
  }
  return { perPop: out, positive: out.every(o => o.positive), minM: Math.min(...out.map(o => o.minM)) };
}

/* ---- separation: a rigorous LOWER bound on ||xbar1(s) - xbar2(s)||_nu over
   the WHOLE cell, summed across both populations. Every step rounds DOWN,
   because the multiplicity claim needs the separation to be at least this
   large. Two certified balls of radii r1, r2 whose predictors are separated by
   more than r1 + r2 are disjoint, so the two solutions they enclose are
   distinct for EVERY parameter in the cell.                                 */
function separationBox(v1, v2, N, nu) {
  let s = 0;
  for (let i = 0; i < NPOP; i++) {
    s = I.nextDown(s + mig(sub(v1[i].rho, v2[i].rho)));
    let nk = 1;
    for (let k = 1; k <= N; k++) {
      nk = I.nextDown(nk * nu);
      s = I.nextDown(s + I.nextDown(2 * nk * mig(sub(v1[i].p[k], v2[i].p[k]))));
      s = I.nextDown(s + I.nextDown(2 * nk * mig(sub(v1[i].b[k], v2[i].b[k]))));
    }
  }
  /* nextDown(0) steps to a negative denormal and a NORM is never negative;
     clamping at 0 only TIGHTENS a lower bound, so the enclosure survives. */
  return Math.max(0, s);
}

/* ---- LASRY-LIONS MONOTONICITY, UNIFORM OVER THE COUPLING BOX -------------
   The hypothesis that buys uniqueness is that m -> (sum_j c_ij m_j) is
   monotone, i.e. sum_ij c_ij <w_i, w_j> >= 0 for all w, i.e. C + C^T ⪰ 0.
   For the symmetric 2x2 matrix S = C + C^T that is s11 >= 0, s22 >= 0 and
   det S >= 0. Over a BOX of coupling matrices we need it at EVERY point, so we
   take the worst corner of each condition: the smallest s11 and s22, and the
   smallest determinant, which pairs the smallest s11 s22 with the largest
   |s12|. Every bound rounds the wrong way for us on purpose.

   THIS IS A CITED THEOREM APPLIED, NOT A RESULT OF OURS [Lasry-Lions]. It is
   also only SUFFICIENT: its failure permits multiplicity, it does not prove
   any. That asymmetry is the whole reason the map needs certificates.       */
function lasryLionsBox(box) {
  const c11 = box.c.c11, c12 = box.c.c12, c21 = box.c.c21, c22 = box.c.c22;
  const s11lo = 2 * c11[0], s22lo = 2 * c22[0];
  /* |s12| is maximised at a corner of the (c12, c21) rectangle */
  const s12abs = Math.max(Math.abs(c12[0] + c21[0]), Math.abs(c12[1] + c21[1]),
                          Math.abs(c12[0] + c21[1]), Math.abs(c12[1] + c21[0]));
  const detLo = I.nextDown(I.nextDown(s11lo * s22lo) - I.nextUp(s12abs * s12abs));
  return { monotone: s11lo >= 0 && s22lo >= 0 && detLo >= 0, s11lo, s22lo, s12abs, detLo };
}

/* ---- THE CELL DECISION — one definition, shared by the sweep and any page.
   Returns MULTIPLE / UNIQUE / UNDECIDED with the reason kept verbatim.

     MULTIPLE   two certified balls over the SAME cell, both densities positive
                throughout, and the predictors separated by more than r1 + r2 —
                so for EVERY parameter in the cell there are two distinct exact
                solutions. The witness is exact and checkable by hand.
     UNIQUE     the cell lies in the Lasry-Lions monotone region, where the
                cited theorem gives global uniqueness, AND our box certificate
                encloses that unique solution over the whole cell.
     UNDECIDED  everything else, carrying the reason.

   A cell is never called UNIQUE on the strength of one solve: a single
   certificate proves local uniqueness in its own ball, never global. The
   global half is the cited theorem and it is only invoked where its hypothesis
   is verified over the entire cell.                                          */
function decideCell(box, opts) {
  opts = opts || {};
  const N = box.N, nu = opts.nu || 1.02;
  const vopt = { nu, KC: opts.KC };
  const Pb = midProblem(box);
  const cands = [];
  const seen = [];
  const push = (tag, x) => {
    if (!x) return;
    for (const q of seen) {
      let d = 0;
      for (let i = 0; i < x.length; i++) d = Math.max(d, Math.abs(x[i] - q[i]));
      if (d < (opts.collapseTol || 1e-4)) return;         /* same branch */
    }
    seen.push(x); cands.push({ tag, x });
  };
  /* maxIter is deliberately short. A Newton started from an atlas seed either
     converges in a handful of steps or is not going to, and the sweep's cost is
     dominated by the ones that are not: at 400 iterations with a line search,
     a single doomed solve cost seconds and there are tens of thousands of them.
     Missing a candidate costs an UNDECIDED cell, never a wrong verdict — the
     certificate is the only authority here, and it never sees this number. */
  const MAXIT = opts.maxIter || 60;
  const tryFrom = (tag, x0) => {
    const r = M2.solve(Pb, x0 ? { x0, tol: 1e-15, maxIter: MAXIT } : { tol: 1e-15, maxIter: MAXIT });
    if (r.resNorm < (opts.solveTol || 1e-11)) push(tag, r.x);
  };
  tryFrom('primary', opts.seedPrimary || null);
  if (opts.seedSeg) tryFrom('segregated', opts.seedSeg);
  /* self-seeding, so a cell can be decided with no atlas at all (battery A1
     requires the atlas-seeded and self-seeded verdicts to agree). */
  if (cands.length < 2 && !opts.noSelfSeed) {
    const n = NPOP * (2 * N + 1);
    for (const amp of (opts.amps || [0.15, 0.3, 0.45])) {
      const x = new Float64Array(n);
      for (let i = 0; i < NPOP; i++) {
        const o = i * (2 * N + 1), sg = i === 0 ? 1 : -1;
        x[o] = mid(box.c.c11);
        x[o + 1] = -sg * amp * 0.1;
        x[o + N + 1] = sg * amp;
      }
      tryFrom('segregated', x);
      if (cands.length >= 2) break;
    }
  }
  const certs = [];
  for (const cd of cands) {
    const v = validateBox(cd.x, box, vopt);
    if (!v.ok) { certs.push({ tag: cd.tag, ok: false, why: v.why, Y0: v.Y0, Z1: v.Z1 }); continue; }
    const pos = boxPositivity(asIv(v.predictor), N, v.r);
    certs.push({ tag: cd.tag, ok: true, r: v.r, kappa: v.kappa, Y0: v.Y0, Z1: v.Z1, Z2: v.Z2,
                 positive: pos.positive, minM: pos.minM, predictor: v.predictor, x: cd.x });
  }
  const good = certs.filter(c => c.ok && c.positive);
  const ll = lasryLionsBox(box);
  if (good.length >= 2) {
    const [a, b] = good;
    const sep = separationBox(asIv(a.predictor), asIv(b.predictor), N, nu);
    const need = I.nextUp(a.r + b.r);
    if (sep > need) {
      return { verdict: 'MULTIPLE', refinable: false, sep, need, ratio: sep / need,
               radii: [a.r, b.r], kappas: [a.kappa, b.kappa], minM: Math.min(a.minM, b.minM),
               lasryLions: ll, certs };
    }
    return { verdict: 'UNDECIDED', refinable: true, reason: 'two certificates but their balls are not provably disjoint (separation ' +
             sep.toExponential(3) + ' <= r1 + r2 = ' + need.toExponential(3) + ')', enclosed: 2, lasryLions: ll, certs };
  }
  if (good.length === 1) {
    if (ll.monotone) {
      return { verdict: 'UNIQUE', refinable: false, r: good[0].r, kappa: good[0].kappa, minM: good[0].minM,
               lasryLions: ll, certs,
               basis: 'Lasry-Lions monotonicity holds over the whole cell [CITED] and the box certificate encloses the solution' };
    }
    /* REFINEMENT CANNOT HELP HERE and pretending otherwise would burn the
       sweep's whole budget on the corridor between the monotone region and the
       bifurcation. One solution is certified over the cell; what is missing is
       a THEOREM (monotonicity), not resolution. A smaller cell yields the same
       sentence. It is refinable only if some candidate's certificate refused —
       that is the failure a smaller cell can actually repair. */
    return { verdict: 'UNDECIDED', refinable: certs.some(c => !c.ok),
             reason: 'one solution certified over the cell, but monotonicity fails somewhere in it (det(C+C^T) lower bound ' +
             ll.detLo.toExponential(3) + '), so uniqueness is not available', enclosed: 1, lasryLions: ll, certs };
  }
  const why = certs.length ? certs.map(c => c.tag + ': ' + (c.why || 'density not provably positive')).join(' | ')
                           : 'no numerical candidate converged in this cell';
  return { verdict: 'UNDECIDED', refinable: true, reason: why, enclosed: 0, lasryLions: ll, certs };
}

const asIv = v => v.map(p => ({ rho: iv(p.rho[0], p.rho[1]), p: p.p.map(z => iv(z[0], z[1])), b: p.b.map(z => iv(z[0], z[1])) }));

module.exports = { validateBox, boxPositivity, separationBox, midProblem, Cbox, VboxI, IDX, asIv, mid, half, CKEYS, DIRS, NPOP, lasryLionsBox, decideCell };
