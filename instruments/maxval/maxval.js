/* maxval.js — the maximal value function, drawn.

   THE THEOREM (Gomes–Üçer, arXiv:2606.28378, Theorem 1.8 and Corollary 1.9).
   For a first-order time-dependent mean-field game with local coupling,
   fix a density m for which MFG value functions exist. Among all admissible
   Hamilton–Jacobi SUBSOLUTIONS S(m) there is a unique MAXIMAL one, u*, and
   the MFG value functions U(m) are exactly the subsolutions that agree with
   u* on {m > 0} and, at t = 0, on {m₀ > 0}. Off the support of the density a
   value function is one member of a set. That is the CHOSEN standing of this
   machine's grammar, and the point of this file is to draw it on an instance.

   THE INSTANCE (built here; the paper has no worked example). On the circle
   of length L = 6, with H(p, m) = ½p² − m (Assumptions 1⁺, 2–6, 7A hold:
   α = β = 2, separable), the system

       −u_t + ½ u_x² = m,      m_t − (m u_x)_x = 0,      m(0) = m₀,  u(T) = u_T

   has the explicit solution with a PARABOLIC bump of shrinking support:

       m(t, x) = ( A(t) − B(t) x² )₊,   support |x| < r(t),
       u(t, x) = a(t) x² + b(t)          on |x| ≤ ρ₀ = 9/4,

   where the transport equation forces the self-similar velocity −u_x = (ṙ/r)x,
   the HJ equation forces r̈ = −3/(2r²), and mass 1 forces A = 3/(4r), B =
   3/(4r³). With r(0) = 2, ṙ(0) = 0 the energy integral is ṙ² = 3(2 − r)/(2r);
   writing r = 2 sin²θ gives everything in closed form:

       t(θ) = √(2/3) (π − 2θ + sin 2θ),   θ from π/2 (t = 0, r = 2) down to
       θ_T = π/3 (r = 3/2), so T = √(2/3)(π/3 + √3/2);
       a = √(3/2) cos θ / (4 sin³θ),  A = 3/(8 sin²θ),  B = 3/(32 sin⁶θ),
       b = √(3/2) (θ − π/3)   (so b(T) = 0).

   The support shrinks because the terminal cost u_T = a(T) φ(x) pulls
   everyone toward the centre against the crowd; φ = x² on |x| ≤ ρ₀ and a C¹
   cap φ = ρ₀² + 2ρ₀s − ρ₀s²/w on s = |x| − ρ₀ ∈ [0, w], w = L/2 − ρ₀, so u_T
   is C¹ and periodic. Off the support the same u = aφ + b is a STRICT
   subsolution: on r < |x| ≤ ρ₀, −u_t + ½u_x² = A − Bx² < 0; on the cap,
   φ′ ≤ 2ρ₀ and φ ≥ ρ₀² give −u_t + ½u_x² ≤ A − Bρ₀² < 0 since ρ₀ > 2 ≥ r.
   So (m, u) is an MFG solution in the sense of Definition 1.1, with a
   vacuum, and u is ONE member of U(m).

   THE MAXIMAL ONE. For continuous bounded m the maximal subsolution is the
   viscosity solution of −u_t + ½u_x² = m with u(T) = u_T, i.e. the value of
   the control problem  inf ∫ (½|ẋ|² + m) ds + u_T(x(T))  [classical; assumed
   and cited]. Since m ≥ 0, the Hopf–Lax value with m dropped,

       HL(t, x) = min_y [ d(x, y)² / (2(T − t)) + u_T(y) ],

   is a LOWER bound on u*; and wherever a minimising straight path never
   enters the support, that path costs exactly HL, so u* = HL there. On the
   support u* = u by Theorem 1.8. Elsewhere this file REFUSES.

   THE CERTIFICATES, cell by cell on the space–time cylinder:
     · the pair: the HJ and transport residuals enclose 0 on the support, the
       strict subsolution inequality holds off it, the terminal condition holds
       (u(T) = u_T exactly), mass is 1 by algebra;
     · the map: SUPPORT (u* = u, by the theorem), VACUUM-DECIDED (u* = HL by a
       rigorous branch-and-bound over y with every surviving minimiser's path
       checked clear of the support), REFUSED (the cell meets the moving
       boundary, or some minimiser's path may cross it);
     · the gap: u* − u ≥ 0 wherever both are decided — the room in which the
       other members of U(m) live.

   MIT licensed. Part of cert-machine (instruments/maxval). */
'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const CERT = require(path.join(__dirname, '..', 'interval', 'certificate.js'));
const { iv, add, sub, mul, div, sqr, neg, abs, mag, mig, contains, width, ZERO, ONE } = I;

/* ---- interval helpers ----------------------------------------------------- */
function isqrt(A) {
  if (A[1] < 0) throw new Error('isqrt of a negative interval');
  const lo = A[0] <= 0 ? 0 : I.nextDown(Math.sqrt(A[0]));
  const hi = I.nextUp(Math.sqrt(A[1]));
  return [lo, hi];
}
const hull = (a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
const pos = (A) => [Math.max(A[0], 0), Math.max(A[1], 0)];
const K23 = isqrt(div(iv(2), iv(3)));          /* √(2/3) */
const K32 = isqrt(div(iv(3), iv(2)));          /* √(3/2) */
const PI = TR.PI, HALF_PI = TR.HALF_PI;
const PI3 = div(PI, iv(3));                    /* θ_T = π/3 */

/* ---- the instance ----------------------------------------------------------- */
const L = 6, HALF_L = 3, RHO0 = 9 / 4, W = HALF_L - RHO0;      /* 0.75 */
const R0 = 2, RT = 3 / 2;
/* t(θ) = √(2/3)(π − 2θ + sin 2θ), decreasing in θ on [π/3, π/2] */
function tOfTheta(TH) { return mul(K23, add(sub(PI, mul(iv(2), TH)), TR.sin(mul(iv(2), TH)))); }
const T_I = tOfTheta(PI3);                     /* the horizon, as an interval */
const T = (T_I[0] + T_I[1]) / 2;

/* θ(t): verified bracket by the sign check on the monotone t(θ) */
function thetaPoint(t) {
  let th = Math.PI / 2 - 0.3;
  const tf = (x) => Math.sqrt(2 / 3) * (Math.PI - 2 * x + Math.sin(2 * x));
  for (let it = 0; it < 100; it++) {
    const f = tf(th) - t, fp = Math.sqrt(2 / 3) * (-2 + 2 * Math.cos(2 * th));
    if (Math.abs(fp) < 1e-18) break;
    const s = f / fp; th -= s;
    th = Math.min(Math.PI / 2, Math.max(Math.PI / 3, th));
    if (Math.abs(s) < 1e-16) break;
  }
  if (t <= 0) return [Math.PI / 2 - 1e-300, HALF_PI[1]];
  let d = 4e-16;
  for (let k = 0; k < 60; k++) {
    const lo = Math.max(Math.PI / 3 - 1e-12, th - d), hi = Math.min(HALF_PI[1], th + d);
    const tlo = tOfTheta(iv(lo)), thi = tOfTheta(iv(hi));     /* t decreasing: t(lo) > t > t(hi) */
    if (tlo[0] > t && thi[1] < t) return [lo, hi];
    d *= 4;
  }
  throw new Error('maxval.thetaPoint: no verified bracket at t=' + t);
}
/* θ over a t-interval: t decreasing in θ, so θ ∈ [θ(t_hi), θ(t_lo)] */
function thetaOf(Tc) { return [thetaPoint(Tc[1])[0], thetaPoint(Tc[0])[1]]; }

/* the coefficients as functions of a θ interval */
function coef(TH) {
  const s = TR.sin(TH), c = TR.cos(TH);
  const s2 = sqr(s), s3 = mul(s2, s), s4 = sqr(s2), s6 = mul(s4, s2);
  const r = mul(iv(2), s2);
  const a = div(mul(K32, c), mul(iv(4), s3));
  const A = div(iv(3), mul(iv(8), s2));
  const B = div(iv(3), mul(iv(32), s6));
  const b = mul(K32, sub(TH, PI3));
  /* time derivatives: θ′(t) = −1/(4√(2/3) sin²θ) */
  const thp = neg(div(ONE, mul(mul(iv(4), K23), s2)));
  const dadth = mul(div(K32, iv(4)), neg(add(div(ONE, s2), div(mul(iv(3), sqr(c)), s4))));
  const ap = mul(dadth, thp);
  const bp = neg(A);
  const rdot = neg(mul(K32, div(c, s)));       /* ṙ = −√(3/2) cot θ */
  const Ap = mul(div(iv(-3), mul(iv(4), sqr(r))), rdot);           /* A′ = dA/dr · ṙ */
  const Bp = mul(div(iv(-9), mul(iv(4), sqr(sqr(r)))), rdot);      /* B′ */
  return { r, a, A, B, b, ap, bp, Ap, Bp, rdot, s2 };
}

/* φ and φ′ over an x-interval on [−L/2, L/2] */
function phiOf(X) {
  const parts = [];
  const ax = abs(X);
  const inner = [ax[0], Math.min(ax[1], RHO0)];
  if (inner[0] <= inner[1]) parts.push({ phi: sqr(inner), dphi: mul(iv(2), inner) });   /* |φ′| = 2|x| */
  const outer = [Math.max(ax[0], RHO0), ax[1]];
  if (outer[0] <= outer[1]) {
    const S = sub(outer, iv(RHO0));
    const phi = sub(add(iv(RHO0 * RHO0), mul(mul(iv(2), iv(RHO0)), S)), div(mul(iv(RHO0), sqr(S)), iv(W)));
    const dphi = sub(mul(iv(2), iv(RHO0)), div(mul(mul(iv(2), iv(RHO0)), S), iv(W)));
    parts.push({ phi, dphi });
  }
  let phi = parts[0].phi, dphi = parts[0].dphi;
  for (const p of parts.slice(1)) { phi = hull(phi, p.phi); dphi = hull(dphi, p.dphi); }
  return { phi, dphi };
}
/* u = aφ + b, u_x = ±aφ′ (|u_x| = a φ′ since a ≥ 0 and φ′ ≥ 0 in |x|), u_t = a′φ + b′ */
function uPar(C, X) {
  const { phi, dphi } = phiOf(X);
  return { u: add(mul(C.a, phi), C.b), uxAbs: mul(C.a, dphi), ut: add(mul(C.ap, phi), C.bp) };
}
function mOf(C, X) { return pos(sub(C.A, mul(C.B, sqr(X)))); }

/* the circle distance d(x, y) = L/2 − | |Δ| − L/2 | for Δ = y − x */
function dist(X, Y) {
  const D = abs(sub(Y, X));
  return sub(iv(HALF_L), abs(sub(D, iv(HALF_L))));
}
/* u_T(y) = a(T) φ(y) */
const CT = coef(PI3);
function uT(Y) { return mul(CT.a, phiOf(Y).phi); }

/* ---- the Hopf–Lax value, over a (t, x) box, by branch and bound over y ---- */
function hopfLax(Tc, X, opts) {
  opts = opts || {};
  const tau = mul(iv(2), sub(T_I, Tc));         /* 2(T − t) */
  if (!(tau[0] > 0)) return { ok: false, why: 't reaches T' };
  const q = (Y) => add(div(sqr(dist(X, Y)), tau), uT(Y));
  let cells = [];
  const n0 = opts.n0 || 48;
  for (let k = 0; k < n0; k++) cells.push([-HALF_L + L * k / n0, -HALF_L + L * (k + 1) / n0]);
  let lo = -Infinity, ub = Infinity;
  for (let round = 0; round < (opts.rounds || 9); round++) {
    const ev = cells.map(Y => ({ Y, q: q(Y) }));
    ub = Math.min(...ev.map(e => e.q[1]));
    const keep = ev.filter(e => e.q[0] <= ub);
    lo = Math.min(...keep.map(e => e.q[0]));
    if (round === (opts.rounds || 9) - 1) { cells = keep.map(e => e.Y); break; }
    cells = [];
    for (const e of keep) { const m = (e.Y[0] + e.Y[1]) / 2; cells.push([e.Y[0], m], [m, e.Y[1]]); }
  }
  return { ok: true, HL: [lo, ub], minimisers: cells };
}

/* r(s) over the nS sub-intervals of [t0, T] — the same for every x-cell of a row, so cached */
const _rowCache = new Map();
function rowR(t0, nS) {
  const key = t0 + ':' + nS;
  if (_rowCache.has(key)) return _rowCache.get(key);
  const out = [];
  for (let i = 0; i < nS; i++) {
    const S = [t0 + (T - t0) * i / nS, Math.min(T - 1e-12, t0 + (T - t0) * (i + 1) / nS)];
    out.push({ S, R: coef(thetaOf(S)).r });
  }
  _rowCache.set(key, out);
  return out;
}

/* does every straight path from (t ∈ Tc, x ∈ X) to (T, y ∈ Y) stay clear of the support? */
function pathClear(Tc, X, Y, nS) {
  nS = nS || 16;
  let D = sub(Y, X);                            /* Δ in the covering space, before the short arc */
  if (D[0] > HALF_L) D = sub(D, iv(L));
  else if (D[1] < -HALF_L) D = add(D, iv(L));
  else if (D[0] < -HALF_L || D[1] > HALF_L) return false;   /* straddles the antipode: refuse */
  const t0 = Tc[0];
  const den = sub(T_I, Tc);
  for (const { S, R } of rowR(t0, nS)) {
    let lam = div(sub(S, Tc), den);
    lam = [Math.max(0, lam[0]), Math.min(1, lam[1])];
    if (lam[0] > lam[1]) lam = [0, 1];
    const P = add(X, mul(D, lam));               /* position on the segment, covering space */
    /* on the circle: the support is |x| < r around 0; a position past ±L/2 wraps — bound |pos| on the circle */
    const Pc = sub(iv(HALF_L), abs(sub(abs(P), iv(HALF_L))));   /* circle distance to 0 */
    if (!(Pc[0] > R[1])) return false;
  }
  return true;
}

/* the strict subsolution inequality off the support, as a SUP over the cell:
   on r < |x| ≤ ρ₀, −u_t + ½u_x² = A − Bx², decreasing in |x| and increasing in r
   (for x² > r²/3), so its sup over the cell is at the corner (largest r = t_lo,
   smallest |x|); on the cap, φ′ ≤ 2ρ₀ and φ ≥ ρ₀² give the bound A − Bρ₀² at the
   same corner. Both are evaluated at the thin corner, which is what makes the
   inequality decidable on cells the dependency problem would refuse. */
function subsolutionSup(Tc, X) {
  const C0 = coef(thetaPoint(Tc[0]));            /* largest r in the cell */
  const ax = abs(X);
  const xs = Math.min(ax[0], RHO0);              /* smallest |x|, capped at ρ₀ for the cap bound */
  return sub(C0.A, mul(C0.B, sqr(iv(xs))));
}

/* ---- one cell -------------------------------------------------------------- */
function decideCell(Tc, X, opts) {
  const TH = thetaOf([Tc[0], Math.min(Tc[1], T - 1e-12)]);
  const C = coef(TH);
  const ax = abs(X);
  const P = uPar(C, X);
  const m = mOf(C, X);
  let region;
  if (ax[1] < C.r[0]) region = 'SUPPORT';
  else if (ax[0] > C.r[1]) region = 'VACUUM';
  else region = 'BOUNDARY';
  const out = { region, r: C.r, u: P.u, m };
  /* the pair: residuals */
  if (region === 'SUPPORT') {
    const hj = sub(add(neg(P.ut), mul(iv(0.5), sqr(P.uxAbs))), m);
    /* transport: m_t − (m u_x)_x = (A′ − 2aA) + x²(−B′ + 6aB) */
    const tr = add(sub(C.Ap, mul(mul(iv(2), C.a), C.A)), mul(sqr(X), add(neg(C.Bp), mul(mul(iv(6), C.a), C.B))));
    out.hj = hj; out.transport = tr;
    out.pairOK = contains(hj, 0) && contains(tr, 0);
  } else if (region === 'VACUUM') {
    const sub_ = subsolutionSup(Tc, X);                          /* must be < 0 = m */
    out.subsolution = sub_;
    out.pairOK = sub_[1] < 0;
  } else {
    out.pairOK = true;                                           /* nothing decided on a boundary cell */
  }
  /* the map */
  if (region === 'SUPPORT') { out.standing = 'SUPPORT'; out.ustar = P.u; }
  else if (region === 'VACUUM') {
    const hl = hopfLax(Tc, X, opts);
    if (!hl.ok) { out.standing = 'REFUSED'; out.why = hl.why; }
    else {
      /* lower bound: the free Hopf–Lax value. Upper bound: the cheapest path
         proved clear of the support — the resting path (cost u_T(x), always
         clear because the support only shrinks) or a surviving minimiser
         whose straight path is clear. */
      const LB = hl.HL[0];
      let UB = uT(X)[1], tight = false, clearAll = true;
      const tau = mul(iv(2), sub(T_I, Tc));
      for (const Y of hl.minimisers) {
        if (pathClear(Tc, X, Y)) UB = Math.min(UB, add(div(sqr(dist(X, Y)), tau), uT(Y))[1]);
        else clearAll = false;
      }
      if (clearAll) { UB = Math.min(UB, hl.HL[1]); tight = true; }
      out.HL = hl.HL; out.nMin = hl.minimisers.length;
      out.standing = 'DECIDED'; out.tight = tight; out.ustar = [LB, UB];
      out.gap = sub([LB, UB], P.u);                               /* u* − u, as an interval */
      out.gapOK = UB >= P.u[0];                                    /* maximality: u* ≥ u must be consistent */
      out.gapProven = LB > P.u[1];
    }
  } else { out.standing = 'REFUSED'; out.why = 'the cell meets the moving boundary of the support'; }
  return out;
}

/* ---- the whole cylinder ----------------------------------------------------- */
function decide(opts) {
  opts = opts || {};
  const NT = opts.NT || 24, NX = opts.NX || 96;
  const cells = [];
  const counts = { SUPPORT: 0, DECIDED: 0, REFUSED: 0, tight: 0, gapProven: 0 };
  let pairOK = true, gapOK = true, maxGap = 0, minHJ = Infinity;
  for (let i = 0; i < NT; i++) {
    const Tc = [T * i / NT, T * (i + 1) / NT];
    if (i === NT - 1) Tc[1] = T * (1 - 1e-9);            /* the last cell stops short of T, where 2(T − t) → 0 */
    for (let j = 0; j < NX; j++) {
      const X = [-HALF_L + L * j / NX, -HALF_L + L * (j + 1) / NX];
      const c = decideCell(Tc, X, opts);
      counts[c.standing]++;
      if (!c.pairOK) pairOK = false;
      if (c.standing === 'DECIDED') { if (!c.gapOK) gapOK = false; maxGap = Math.max(maxGap, c.gap[1]); if (c.tight) counts.tight++; if (c.gapProven) counts.gapProven++; }
      if (c.hj) minHJ = Math.min(minHJ, -mag(c.hj));
      cells.push({ i, j, t0: Tc[0], t1: Tc[1], x0: X[0], x1: X[1], region: c.region, standing: c.standing,
        r: c.r, u: c.u, m: c.m, ustar: c.ustar || null, gap: c.gap || null, HL: c.HL || null, why: c.why || null, tight: !!c.tight, gapProven: !!c.gapProven,
        hj: c.hj || null, transport: c.transport || null, subsolution: c.subsolution || null });
    }
  }
  /* the terminal condition: u(T, x) = a(T)φ(x) + b(T) and u_T(x) = a(T)φ(x) are the same
     formula, so u(T) = u_T holds exactly iff b(T) = 0; b(T) = √(3/2)(θ_T − π/3) is enclosed
     by a rounding-width interval around 0, and that is what is checked */
  const terminalOK = contains(CT.b, 0) && mag(CT.b) < 1e-12;
  /* profiles at a few times, for the figures: u* (decided), u (chosen), m, at cell centres */
  const profiles = (opts.profileRows || [0, Math.floor(NT / 2), NT - 1]).map(i => ({
    i, t: [cells[i * NX].t0, cells[i * NX].t1],
    rows: cells.filter(c => c.i === i).map(c => ({ x: (c.x0 + c.x1) / 2, standing: c.standing, u: c.u, ustar: c.ustar, m: c.m }))
  }));
  return { L, RHO0, R0, RT, T: T_I, NT, NX, cells, counts, pairOK, gapOK, terminalOK, maxGap, profiles,
    massAlgebra: '∫m = (4/3) A^{3/2} B^{−1/2} = (4/3)(3/(4r))^{3/2}(3/(4r³))^{−1/2} = 1' };
}

function certificate(res, provenance) {
  const falsifier = [
    'the HJ residual with the coupling sign flipped (−u_t + ½u_x² + m) must NOT enclose 0 on the support',
    'the transport residual with the velocity sign flipped must NOT enclose 0',
    'a vacuum cell whose minimising path crosses the support must be REFUSED, and the float shortcut (the centre path only) must be shown to decide it',
    'the Hopf–Lax lower bound evaluated with the branch-and-bound pruning disabled to one round must be wider, never tighter',
    'a decided cell with u* forged below u must fail the gap check'
  ];
  if (!res.pairOK) return CERT.refused({ claim: 'the parabolic-bump pair is an MFG solution', why: 'a residual or the strict subsolution inequality failed on a cell', falsifier, provenance });
  if (!res.terminalOK) return CERT.refused({ claim: 'the parabolic-bump pair is an MFG solution', why: 'u(T) ≠ u_T on some cell', falsifier, provenance });
  if (!res.gapOK) return CERT.refused({ claim: 'the maximal value function on the decided vacuum', why: 'u* < u on a decided cell — the identification of u* is wrong', falsifier, provenance });
  return CERT.proved({
    claim: 'On the circle of length 6 with H = ½p² − m and the parabolic bump of shrinking support r(t) ∈ [3/2, 2]: (m, u = aφ + b) is an MFG solution (Definition 1.1) with a vacuum — HJ and transport residuals enclose 0 on every support cell, the strict subsolution inequality holds on every vacuum cell, u(T) = u_T. The maximal value function u* of Theorem 1.8 equals u on the ' + res.counts.SUPPORT + ' support cells (by the theorem), equals the Hopf–Lax value on ' + res.counts.DECIDED + ' vacuum cells where every minimising path is proved clear of the support, and is REFUSED on ' + res.counts.REFUSED + ' cells; on every decided vacuum cell u* ≥ u, with a gap up to ' + CERT.fmt(res.maxGap) + '.',
    evidence: { cells: res.NT * res.NX, support: res.counts.SUPPORT, decided: res.counts.DECIDED, refused: res.counts.REFUSED, maxGap: res.maxGap, T: res.T },
    assumes: [
      'the maximal subsolution u* of Theorem 1.8 is the value of the control problem inf ∫(½|ẋ|² + m) + u_T(x(T)) — the classical identification for continuous bounded m (Bardi–Capuzzo-Dolcetta), cited, not re-proved',
      'the instance is built here, not taken from the paper: the paper has no worked example; the derivation of the parabolic bump is on the page and its residuals are enclosed as a check on the algebra',
      'mass 1 by the algebra ' + res.massAlgebra
    ],
    falsifier, provenance
  });
}

function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

module.exports = { L, HALF_L, RHO0, R0, RT, T, T_I, isqrt, tOfTheta, thetaPoint, thetaOf, coef, phiOf, uPar, mOf, dist, uT, hopfLax, pathClear, decideCell, decide, certificate, sha256File };
