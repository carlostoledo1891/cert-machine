/* afg.js — the first-order stationary mean-field game of Almulla, Ferreira and
   Gomes (Dynamic Games and Applications 7(4) 657–682, 2017; arXiv:1511.06576),
   enclosed by the current.

   THE SYSTEM (their (1.1)), on the 1-torus, first order:

       u_x²/2 + V(x) + b(x) u_x  =  ln m + H̄
       −( m (u_x + b) )_x        =  0
       ∫ u = 0,  ∫ m = 1,  m > 0

   with V = sin 2πx and, in the case this file exists for, b = cos² 2πx — their
   Figures 7 and 8, of which the paper says (§2.1): "If ∫ b dx ≠ 0, we are not
   aware of any closed-form solution." Here ∫ b = 1/2.

   THE REDUCTION (the one-dimensional current formulation, Gomes–Nurbekyan–
   Prazeres; theirs, cited, not ours). The Fokker–Planck equation integrates
   once: m (u_x + b) = j, a constant — the current. Then u_x = j/m − b and the
   Hamilton–Jacobi equation becomes, at every x, a SCALAR equation in m:

       φ_j(m) := ln m − j² / (2 m²)  =  V(x) − b(x)²/2 − H̄  =: r(x)

   φ_j is strictly increasing in m > 0 (φ' = 1/m + j²/m³), so m(x) is the
   unique inverse for any (j, H̄). Two scalars remain, fixed by two integral
   conditions:

       F₁(j, H̄) = ∫ m − 1 = 0            (mass)
       F₂(j, H̄) = j ∫ 1/m − ∫ b = 0      (periodicity of u: ∫ u_x = 0)

   ∫ b = 0 forces j = 0 and gives back their closed form. ∫ b ≠ 0 forces j ≠ 0.

   THE CERTIFICATE. A Krawczyk enclosure of (j, H̄) in R², with every integral a
   rigorous midpoint quadrature (instruments/interval/quadrature.js) whose
   integrand and second derivative are interval enclosures built from the
   verified scalar inverse below. Existence and local uniqueness of (j, H̄) in
   the box give a classical solution (u, m, H̄): m = φ⁻¹ is C^∞ by the implicit
   function theorem, u = ∫(j/m − b) is periodic because F₂ = 0, and the two
   equations hold by construction. Global uniqueness is THEIRS (Lemma 2.3, the
   operator is monotone) and is assumed here, not re-proved.

   The only place a float is trusted is as a CANDIDATE: the Newton iterate and
   the approximate inverse A. Everything that is asserted is an interval.

   MIT licensed. Part of cert-machine (instruments/afg). */
'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const RD = require(path.join(__dirname, '..', 'interval', 'radii.js'));
const Q = require(path.join(__dirname, '..', 'interval', 'quadrature.js'));
const CERT = require(path.join(__dirname, '..', 'interval', 'certificate.js'));
const { iv, add, sub, mul, div, sqr, neg, mag, mig, width, ZERO, ONE } = I;

const TWO_PI = TR.TWO_PI;
const TP2 = sqr(TWO_PI);
const HALF = iv(0.5);

/* ---- the two instances -------------------------------------------------- */
const CASES = {
  A: { id: 'A', label: 'b = 0', intB: ZERO, hasB: false,
       words: 'their closed form: u = 0, m = e^V / ∫e^V, H̄ = ln ∫e^V — the control' },
  B: { id: 'B', label: 'b = cos²(2πx)', intB: iv(0.5), hasB: true,
       words: '∫b = 1/2; "we are not aware of any closed-form solution" — the instance' }
};

/* ---- the data: V, b and two derivatives, as intervals over X ---------- */
function fields(cs, X) {
  const th = mul(TWO_PI, X);
  const s = TR.sin(th), c = TR.cos(th);
  const V = s, V1 = mul(TWO_PI, c), V2 = neg(mul(TP2, s));
  if (!cs.hasB) return { V, V1, V2, b: ZERO, b1: ZERO, b2: ZERO };
  const th2 = mul(iv(2), th);
  const b = sqr(c);                                   /* cos² θ */
  const b1 = neg(mul(TWO_PI, TR.sin(th2)));           /* −2π sin 2θ */
  const b2 = neg(mul(mul(iv(2), TP2), TR.cos(th2)));  /* −2(2π)² cos 2θ */
  return { V, V1, V2, b, b1, b2 };
}
const rOf = (f, H) => sub(sub(f.V, mul(HALF, sqr(f.b))), H);
const r1Of = (f) => sub(f.V1, mul(f.b, f.b1));
const r2Of = (f) => sub(f.V2, add(sqr(f.b1), mul(f.b, f.b2)));

/* ---- φ and its verified inverse ------------------------------------------ */
function phi(M, J) { return sub(TR.log(M), div(mul(HALF, sqr(J)), sqr(M))); }

/* The root m of φ_j(m) = r, for float r and float j ≥ 0, as a VERIFIED bracket:
   φ_j is strictly increasing, so sup φ(lo) < r < inf φ(hi) proves exactly one
   root in (lo, hi). The float Newton iterate is only the candidate. */
/* The sign check itself, exposed so the battery can show it refusing: TRUE only
   when sup φ_j(lo) < r < inf φ_j(hi) in outward-rounded arithmetic. */
function bracketOK(lo, hi, r, j) {
  if (!(lo > 0) || !(lo < hi)) return false;
  const J = iv(j);
  const plo = phi(iv(lo), J), phi_ = phi(iv(hi), J);
  return plo[1] < r && phi_[0] > r;
}

function invertPoint(r, j) {
  let m = Math.exp(r);                                /* the j = 0 solution, as the start */
  for (let it = 0; it < 100; it++) {
    const f = Math.log(m) - j * j / (2 * m * m) - r;
    const fp = 1 / m + j * j / (m * m * m);
    const step = f / fp;
    m -= step;
    if (!(m > 0)) m = 1e-9;
    if (Math.abs(step) < 1e-16 * Math.max(1, m)) break;
  }
  let d = 4e-16 * Math.max(1, m);
  for (let t = 0; t < 60; t++) {
    if (bracketOK(m - d, m + d, r, j)) return [m - d, m + d];
    d *= 4;
  }
  throw new Error('afg.invertPoint: no verified bracket at r=' + r + ' j=' + j);
}

/* m over a set of (r, j): m is increasing in r and in |j|, so the hull of the
   two corner inverses encloses every m the set can produce. */
function solveM(R, J) {
  const lo = invertPoint(R[0], mig(J))[0];
  const hi = invertPoint(R[1], mag(J))[1];
  return [lo, hi];
}

/* Everything one cell (or one point) needs: m, φ', φ'', m', m'' over X × J × H */
function cellState(cs, X, J, H) {
  const f = fields(cs, X);
  const r = rOf(f, H);
  const M = solveM(r, J);
  const Ja = iv(mig(J), mag(J)), J2 = sqr(Ja);
  const M2 = sqr(M), M3 = mul(M2, M), M4 = sqr(M2);
  const ph1 = add(div(ONE, M), div(J2, M3));                       /* φ'  > 0 */
  const ph2 = neg(add(div(ONE, M2), div(mul(iv(3), J2), M4)));     /* φ'' */
  const r1 = r1Of(f), r2 = r2Of(f);
  const m1 = div(r1, ph1);                                         /* m' = r'/φ' */
  const m2 = div(sub(mul(r2, ph1), mul(mul(r1, ph2), m1)), sqr(ph1));
  const g2 = add(neg(div(m2, M2)), div(mul(iv(2), sqr(m1)), M3));  /* (1/m)'' */
  return { f, r, M, M2, M3, ph1, m1, m2, g2 };
}

/* ---- F and its Jacobian --------------------------------------------------- */
/* F at a THIN point (j, H): the rigorous midpoint rule with the remainder. */
function Fthin(cs, j, H, K) {
  const J = iv(j), HI = iv(H);
  const intM = Q.midpoint01({ K,
    fAt: c => cellState(cs, iv(c), J, HI).M,
    f2On: X => cellState(cs, X, J, HI).m2 });
  const intInv = Q.midpoint01({ K,
    fAt: c => div(ONE, cellState(cs, iv(c), J, HI).M),
    f2On: X => cellState(cs, X, J, HI).g2 });
  return { F: [sub(intM, ONE), sub(mul(J, intInv), cs.intB)], intM, intInv };
}

/* DF over a BOX: a Riemann enclosure on K cells (O(h) wide, which is all the
   contraction test needs — the width lands in ‖I − A·DF‖, never in the radius). */
function DFbox(cs, J, H, K) {
  const h = 1 / K, hI = iv(h);
  let dMdj = ZERO, dMdH = ZERO, invM = ZERO, dInvdj = ZERO, dInvdH = ZERO;
  for (let k = 0; k < K; k++) {
    const st = cellState(cs, [k * h, (k + 1) * h], J, H);
    const mj = div(div(J, st.M2), st.ph1);            /* ∂m/∂j = (j/m²)/φ'  (signed j) */
    const mH = neg(div(ONE, st.ph1));                 /* ∂m/∂H = −1/φ' */
    dMdj = add(dMdj, mul(hI, mj));
    dMdH = add(dMdH, mul(hI, mH));
    invM = add(invM, mul(hI, div(ONE, st.M)));
    dInvdj = add(dInvdj, mul(hI, neg(div(mj, st.M2))));
    dInvdH = add(dInvdH, mul(hI, neg(div(mH, st.M2))));
  }
  return [[dMdj, dMdH],
          [add(invM, mul(J, dInvdj)), mul(J, dInvdH)]];
}

/* ---- the float candidate (trusted for nothing) --------------------------- */
function floatF(cs, j, H, K) {
  let mass = 0, inv = 0;
  for (let k = 0; k < K; k++) {
    const x = (k + 0.5) / K, th = 2 * Math.PI * x;
    const b = cs.hasB ? Math.cos(th) ** 2 : 0;
    const r = Math.sin(th) - b * b / 2 - H;
    let m = Math.exp(r);
    for (let it = 0; it < 60; it++) {
      const f = Math.log(m) - j * j / (2 * m * m) - r, fp = 1 / m + j * j / (m * m * m);
      const s = f / fp; m -= s; if (!(m > 0)) m = 1e-9; if (Math.abs(s) < 1e-15) break;
    }
    mass += m; inv += 1 / m;
  }
  const ib = cs.hasB ? 0.5 : 0;
  return [mass / K - 1, j * inv / K - ib];
}
function candidate(cs, K) {
  let j = cs.hasB ? 0.3 : 0, H = 0.2;
  for (let it = 0; it < 80; it++) {
    const f = floatF(cs, j, H, K), e = 1e-7;
    const a = floatF(cs, j + e, H, K), c = floatF(cs, j, H + e, K);
    const Jm = [[(a[0] - f[0]) / e, (c[0] - f[0]) / e], [(a[1] - f[1]) / e, (c[1] - f[1]) / e]];
    const det = Jm[0][0] * Jm[1][1] - Jm[0][1] * Jm[1][0];
    const dj = (Jm[1][1] * f[0] - Jm[0][1] * f[1]) / det;
    const dH = (-Jm[1][0] * f[0] + Jm[0][0] * f[1]) / det;
    j -= dj; H -= dH;
    if (Math.abs(dj) + Math.abs(dH) < 1e-14) break;
  }
  if (!cs.hasB) j = 0;                                /* the exact symmetry point is the better centre */
  const f = floatF(cs, j, H, K), e = 1e-6;
  const a = floatF(cs, j + e, H, K), c = floatF(cs, j, H + e, K);
  const Jm = [[(a[0] - f[0]) / e, (c[0] - f[0]) / e], [(a[1] - f[1]) / e, (c[1] - f[1]) / e]];
  const det = Jm[0][0] * Jm[1][1] - Jm[0][1] * Jm[1][0];
  const A = [[Jm[1][1] / det, -Jm[0][1] / det], [-Jm[1][0] / det, Jm[0][0] / det]];
  return { x0: [j, H], A };
}

/* ---- the enclosure -------------------------------------------------------- */
/* opts: { KF (thin quadrature, 2^p), KD (box Jacobian, 2^p), KP (plot cells), x0, A } */
function enclose(caseId, opts) {
  opts = opts || {};
  const cs = CASES[caseId];
  if (!cs) throw new Error('afg.enclose: unknown case ' + caseId);
  const KF = opts.KF || 16384, KD = opts.KD || 2048, KP = opts.KP || 256;
  const cand = opts.x0 ? { x0: opts.x0, A: opts.A } : candidate(cs, 4096);
  if (!cand.A) cand.A = candidate(cs, 4096).A;

  const F = (X) => Fthin(cs, X[0][0], X[1][0], KF).F;      /* the library calls F on the thin centre only */
  const DF = (X) => DFbox(cs, X[0], X[1], KD);
  const kr = RD.krawczyk(F, DF, cand.x0, cand.A, { maxRounds: 12, radCap: 0.05 });
  if (!kr.ok) return { ok: false, case: caseId, why: kr.why, x0: cand.x0 };

  const J = kr.box[0], H = kr.box[1];

  /* pointwise tubes over KP plot cells, valid for EVERY (j, H̄) in the box */
  const h = 1 / KP;
  const mTube = [], uPrime = [];
  let mMin = Infinity, mMax = -Infinity;
  for (let k = 0; k < KP; k++) {
    const X = [k * h, (k + 1) * h];
    const st = cellState(cs, X, J, H);
    mTube.push([X[0], st.M[0], st.M[1]]);
    mMin = Math.min(mMin, st.M[0]); mMax = Math.max(mMax, st.M[1]);
    uPrime.push(sub(mul(J, div(ONE, st.M)), st.f.b));     /* u' = j/m − b over the cell */
  }
  /* u at the KF+1 fine boundaries: cumulative midpoint rule on u' = j/m − b,
     (u')'' = j (1/m)'' − b'' */
  const U = Q.cumulative01({ K: KF,
    fAt: c => { const st = cellState(cs, iv(c), J, H); return sub(mul(J, div(ONE, st.M)), st.f.b); },
    f2On: X => { const st = cellState(cs, X, J, H); return sub(mul(J, st.g2), st.f.b2); } });
  /* ∫u over each fine cell ⊂ h_f · (U_k + [0, h_f] · U'(cell)); U' over the fine
     cell is enclosed by the plot-cell value that contains it (coarser, so wider) */
  const hf = 1 / KF, hfI = iv(hf);
  let intU = ZERO;
  const per = KF / KP;
  for (let k = 0; k < KF; k++) {
    const up = uPrime[Math.floor(k / per)];
    intU = add(intU, mul(hfI, add(U[k], mul([0, hf], up))));
  }
  const uTube = [];
  for (let p = 0; p <= KP; p++) {
    const u = sub(U[p * per], intU);
    uTube.push([p * h, u[0], u[1]]);
  }
  const closure = U[KF];                                   /* ∫u_x — must contain 0 */

  const out = {
    ok: true, case: caseId, label: cs.label, words: cs.words,
    K: { thin: KF, jacobian: KD, plot: KP },
    x0: cand.x0, rounds: kr.rounds,
    j: J, H: H, jWidth: width(J), HWidth: width(H),
    mMin, mMax, mTube, uTube, uMean: intU, closure,
    F0: Fthin(cs, cand.x0[0], cand.x0[1], KF).F
  };
  if (!cs.hasB) {
    /* the control: H̄ = ln ∫ e^V, enclosed by the same quadrature */
    const intExpV = Q.midpoint01({ K: KF,
      fAt: c => TR.exp(fields(cs, iv(c)).V),
      f2On: X => { const f = fields(cs, X); return mul(TR.exp(f.V), add(sqr(f.V1), f.V2)); } });
    out.closedForm = { intExpV, H: TR.log(intExpV) };
  }
  return out;
}

/* ---- the certificate object ---------------------------------------------- */
function certificate(res, provenance) {
  const cs = CASES[res.case];
  const falsifier = [
    'the quadrature with its remainder term deleted (the interval then misses a value it must contain)',
    'the scalar inverse with the sign check disabled (a bracket that does not bracket is refused)',
    'Krawczyk started from a candidate 0.05 away from the root (must return no contraction)',
    'case A: the closed-form H̄ shifted by 1e-7 must lie OUTSIDE the enclosure',
    'a certified density floor forged to ≤ 0 must refuse'
  ];
  if (!res.ok) return CERT.refused({ claim: 'enclosure of (j, H̄) for AFG (1.1), ' + cs.label,
    why: res.why, falsifier, provenance });
  if (!(res.mMin > 0)) return CERT.refused({ claim: 'enclosure of (j, H̄) for AFG (1.1), ' + cs.label,
    why: 'the certified density floor is ' + res.mMin + ', not strictly positive — m > 0 is load-bearing (ln m) and is not assumed',
    falsifier, provenance });
  if (!(res.closure[0] <= 0 && 0 <= res.closure[1])) return CERT.refused({ claim: 'enclosure of (j, H̄) for AFG (1.1), ' + cs.label,
    why: 'the enclosure of ∫u_x does not contain 0 — u would not be periodic', falsifier, provenance });
  return CERT.proved({
    claim: 'AFG (1.1) with V = sin 2πx, ' + cs.label + ': a classical solution (u, m, H̄) exists with current j ∈ '
      + CERT.fmt(res.j) + ' and H̄ ∈ ' + CERT.fmt(res.H) + ', locally unique in that box, density in ['
      + CERT.fmt(res.mMin) + ', ' + CERT.fmt(res.mMax) + '] > 0',
    evidence: { j: res.j, H: res.H, jWidth: res.jWidth, HWidth: res.HWidth, mMin: res.mMin, mMax: res.mMax,
      krawczykRounds: res.rounds, thinCells: res.K.thin, jacobianCells: res.K.jacobian },
    assumes: [
      'global uniqueness of the solution: AFG Lemma 2.3 (the operator is monotone in L²×L²) with Lasry–Lions; cited, not re-proved here — what is proved is uniqueness of (j, H̄) in the box',
      'classical solutions of (1.1) carry a constant current m(u_x + b) = j — the one-dimensional current formulation (Gomes–Nurbekyan–Prazeres), which is an identity for C¹ solutions on the torus',
      '∫ b is entered exactly (0 for b = 0; 1/2 for cos² 2πx)'
    ],
    falsifier, provenance
  });
}

function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

module.exports = { CASES, fields, phi, bracketOK, invertPoint, solveM, cellState, Fthin, DFbox, floatF, candidate, enclose, certificate, sha256File };
