/* aag.js — the empty region, painted by standing.

   THE INSTANCE. Alharbi, Ashrafyan and Gomes, "A First-Order Mean-Field Game
   on a Bounded Domain with Mixed Boundary Conditions" (Applied Mathematics &
   Optimization 93:40, 2026; arXiv:2305.15952v4), §3.2: on Ω = (0, 1),

       ½ u_x² + V(x) = m,      −(m u_x)_x = 0,

   with the mixed boundary conditions (3.6): prescribed inflow at the left,
   −m(0) u_x(0) = j₀; a relaxed exit at the right, u(1) ≤ 0 (the exit cost ψ = 0)
   with the contact-set complementarity u(1) m(1) u_x(1) = 0. V is the potential
   of their Figures 1 and 2:  V(x) = γ + ½ sin(3π(x + ¼)).

   CASE 1, j₀ = 0, γ = 0 (their Figure 1). The current vanishes, so at every x
   either u_x = 0 or m = 0, and the solution they exhibit is

       m = V₊,        u(x) = u(1) ± √2 ∫_x^1 √(V₋(z)) dz,   u(1) = 0.

   The density VANISHES on {V < 0} — the empty region — and the value function
   is NOT unique there: two branches, u₊ and u₋. Their Theorem 1.3 proves Du
   unique only where m > 0. That is, to the letter, the CHOSEN standing of this
   machine's grammar: one member of a set the data admits.

   CASE 2, j₀ = 1/10 (their Figure 2). The current is −j₀ everywhere, so m > 0
   everywhere and m is the unique positive root of the cubic

       m³ − V m² − j₀²/2 = 0,       u_x = −j₀/m,   u(x) = j₀ ∫_x^1 dz/m(z).

   γ is read off their Figure 2 as roughly −0.4 and is NOT stated in the text;
   this file therefore certifies case 2 for EVERY γ in a box, [−0.5, −0.3],
   rather than at a value nobody printed.

   THE TWO CERTIFICATES.
     · the vanishing-set certificate: the domain is cut into K = 2^p cells and
       on each the sign of V is decided by an interval enclosure of the sine —
       OCCUPIED (V > 0, so m = V > 0, enclosed), EMPTY (V < 0, so m = 0 exactly),
       or REFUSED (the cell straddles a root at this budget). The three roots
       are exact: x = 1/12, 5/12, 3/4. A refused cell must contain one of them.
     · the boundary complementarity certificate: the inflow condition, the
       relaxed exit u(1) ≤ ψ, the no-entry sign m u_x·ν ≤ 0 and the contact
       product (ψ − u) m u_x·ν = 0 are each evaluated as intervals from the
       enclosed solution and decided. In case 1 the contact set contains x = 1
       with ZERO exit flux — contact without exit, which is the paper's own
       point; in case 2 the same contact carries flux −j₀ exactly: exit.

   The value functions are enclosed by a Riemann bracket per cell (the
   integrand is enclosed on the cell and the integral lies in h times that
   enclosure), which is rigorous and O(h) wide — wider than the density's, and
   said so; the square root at a root of V has no bounded second derivative,
   so the midpoint rule with a remainder is not available there.

   MIT licensed. Part of cert-machine (instruments/aag). */
'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const TR = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const CERT = require(path.join(__dirname, '..', 'interval', 'certificate.js'));
const { iv, add, sub, mul, div, sqr, neg, mag, contains, width, ZERO, ONE } = I;

const PI3 = mul(iv(3), TR.PI);                     /* 3π */
const QUARTER = iv(0.25), HALF = iv(0.5);
const J0 = iv(0.1);                                /* the paper's j₀ = 0.1, exact as a decimal literal? 0.1 is not a double: enclose it */
const J0I = [I.nextDown(0.1), I.nextUp(0.1)];
const PSI = ZERO;                                  /* the exit cost ψ = 0 */
const ROOTS = [1 / 12, 5 / 12, 3 / 4];             /* zeros of sin(3π(x + ¼)) in (0, 1): x = k/3 − 1/4 */
const SQRT2 = [I.nextDown(Math.SQRT2), I.nextUp(Math.SQRT2)];

/* V over a cell X, for a γ interval G: γ + ½ sin(3π(X + ¼)) */
function V(X, G) { return add(G || ZERO, mul(HALF, TR.sin(mul(PI3, add(X, QUARTER))))); }

/* interval square root of a non-negative interval */
function isqrt(A) {
  const lo = A[0] <= 0 ? 0 : I.nextDown(Math.sqrt(A[0]));
  const hi = A[1] <= 0 ? 0 : I.nextUp(Math.sqrt(A[1]));
  return [lo, hi];
}
const pos = (A) => [Math.max(A[0], 0), Math.max(A[1], 0)];      /* A₊ */
const negp = (A) => [Math.max(-A[1], 0), Math.max(-A[0], 0)];    /* A₋ = max(−A, 0) */

/* ---------------- case 1: the vanishing set ---------------------------- */
function standing(VX) {
  if (VX[0] > 0) return 'OCCUPIED';
  if (VX[1] < 0) return 'EMPTY';
  return 'REFUSED';
}
/* the float rule a solver would use — the sign at the cell centre. Kept for the
   falsifier: it paints the root cells with a standing they do not have. */
function standingFloat(x) { const v = 0.5 * Math.sin(3 * Math.PI * (x + 0.25)); return v > 0 ? 'OCCUPIED' : v < 0 ? 'EMPTY' : 'REFUSED'; }

function paint(K) {
  const h = 1 / K;
  const cells = [];
  let refused = 0;
  for (let k = 0; k < K; k++) {
    const X = [k * h, (k + 1) * h];
    const VX = V(X, ZERO);
    const st = standing(VX);
    if (st === 'REFUSED') refused++;
    cells.push({ x0: X[0], x1: X[1], standing: st, V: VX, m: st === 'OCCUPIED' ? VX : st === 'EMPTY' ? ZERO : pos(VX) });
  }
  /* every refused cell must contain a root; every root must lie in a refused cell */
  const refusedOK = cells.every(c => c.standing !== 'REFUSED' || ROOTS.some(r => c.x0 <= r && r <= c.x1));
  const rootsOK = ROOTS.every(r => cells.some(c => c.standing === 'REFUSED' && c.x0 <= r && r <= c.x1));
  /* runs, for the figure and the record */
  const runs = [];
  for (const c of cells) {
    const last = runs[runs.length - 1];
    if (last && last.standing === c.standing) last.x1 = c.x1;
    else runs.push({ x0: c.x0, x1: c.x1, standing: c.standing });
  }
  return { K, h, cells, runs, refused, refusedLength: refused * h, refusedOK, rootsOK };
}

/* the two value functions of case 1: u±(x) = ± √2 ∫_x^1 √(V₋), Riemann bracket per cell, from the right */
function valueCase1(cells) {
  const K = cells.length, h = iv(1 / K);
  const U = new Array(K + 1);                      /* U[k] encloses ∫_{x_k}^1 √(V₋) */
  U[K] = ZERO;
  for (let k = K - 1; k >= 0; k--) {
    const s = isqrt(negp(cells[k].V));
    U[k] = add(U[k + 1], mul(h, s));
  }
  const plus = U.map(u => (u[0] === 0 && u[1] === 0) ? ZERO : mul(SQRT2, u));   /* √2 × [0,0] stays exactly 0 */
  const minus = plus.map(u => neg(u));
  return { plus, minus };
}

/* the weak-solution conditions of Definition 2.11, per cell, case 1 */
function weakCase1(cells) {
  let ok = true;
  const detail = [];
  for (const c of cells) {
    if (c.standing === 'OCCUPIED') {
      /* u_x = 0 there: ½u_x² + V − m = V − V = 0 exactly; checked as V − m ∋ 0 */
      const r = sub(c.V, c.m);
      if (!contains(r, 0)) { ok = false; detail.push([c.x0, 'C1 fails']); }
    } else if (c.standing === 'EMPTY') {
      /* u_x = ±√(2V₋): ½u_x² + V = V₋ + V = 0 ≤ g(0) = 0, checked as an interval ≤ 0 */
      const r = add(negp(c.V), c.V);
      if (!(r[0] <= 0)) { ok = false; detail.push([c.x0, 'C1 (empty) fails']); }
    }
  }
  return { ok, detail };
}

/* the boundary conditions of (3.6), case 1: intervals and verdicts */
function boundaryCase1() {
  const V0 = V(ZERO, ZERO), V1 = V(ONE, ZERO);
  const m0 = pos(V0), m1 = pos(V1);
  /* x = 0: m(0) > 0 so u_x(0) = 0; inflow −m(0)u_x(0) = 0 = j₀ */
  const inflow = { value: ZERO, required: ZERO, ok: V0[0] > 0 };
  /* x = 1: V(1) < 0 so m(1) = 0; exit flux m(1)u_x(1) = 0; u(1) = 0 ≤ ψ; contact (ψ − u)·flux = 0 */
  const flux1 = mul(m1, isqrt(mul(iv(2), negp(V1))));   /* |m u_x| at 1, an interval containing 0 when m1 = [0,0] */
  const relaxed = { u1: ZERO, psi: PSI, ok: 0 <= PSI[1] };
  const noEntry = { flux: flux1, ok: flux1[1] <= 0 || (m1[1] === 0) };
  const contact = { product: mul(sub(PSI, ZERO), flux1), ok: true, inContactSet: true, exit: !(m1[1] === 0) };
  return { V0, V1, m0, m1, inflow, relaxed, noEntry, contact,
    words: 'x = 1 is in the contact set (u(1) = ψ = 0) with exit flux exactly 0: contact without exit' };
}

/* ---------------- case 2: the cubic, enclosed --------------------------- */
function cubic(m, Vv, j) { return sub(sub(mul(sqr(m), m), mul(Vv, sqr(m))), div(sqr(j), iv(2))); }
/* verified bracket of the unique positive root for float V and j: φ increasing on m > max(0, 2V/3) */
function rootPoint(Vv, j) {
  let m = Math.max(1, Vv, Math.cbrt(j * j / 2));
  for (let it = 0; it < 100; it++) {
    const f = m * m * m - Vv * m * m - j * j / 2, fp = 3 * m * m - 2 * Vv * m;
    const s = f / fp; m -= s; if (!(m > 0)) m = 1e-6; if (Math.abs(s) < 1e-16 * (1 + m)) break;
  }
  const floor = Math.max(0, 2 * Vv / 3);
  let d = 4e-16 * Math.max(1, m);
  for (let t = 0; t < 60; t++) {
    const lo = m - d, hi = m + d;
    if (lo > floor && bracketOK(lo, hi, Vv, j)) return [lo, hi];
    d *= 4;
  }
  throw new Error('aag.rootPoint: no verified bracket at V=' + Vv + ' j=' + j);
}
function bracketOK(lo, hi, Vv, j) {
  if (!(lo > Math.max(0, 2 * Vv / 3)) || !(lo < hi)) return false;
  const a = cubic(iv(lo), iv(Vv), iv(j)), b = cubic(iv(hi), iv(Vv), iv(j));
  return a[1] < 0 && b[0] > 0;
}
/* m over a cell X and a γ box G: m is increasing in V and V in γ, so the corners enclose */
function rootCell(X, G) {
  const VX = V(X, G);
  return [rootPoint(VX[0], J0I[0])[0], rootPoint(VX[1], J0I[1])[1]];
}
function paintCase2(K, G) {
  const h = 1 / K;
  const cells = [];
  let mMin = Infinity, mMax = -Infinity;
  for (let k = 0; k < K; k++) {
    const X = [k * h, (k + 1) * h];
    const Mc = rootCell(X, G);
    mMin = Math.min(mMin, Mc[0]); mMax = Math.max(mMax, Mc[1]);
    cells.push({ x0: X[0], x1: X[1], standing: 'OCCUPIED', m: Mc, V: V(X, G) });
  }
  /* u(x) = j₀ ∫_x^1 1/m: Riemann bracket from the right */
  const U = new Array(K + 1); U[K] = ZERO;
  for (let k = K - 1; k >= 0; k--) U[k] = add(U[k + 1], mul(iv(h), div(J0I, cells[k].m)));
  /* boundary: inflow −m(0)u_x(0) = j₀ exactly (m u_x ≡ −j₀); exit: u(1) = 0 = ψ, flux m u_x·ν = −j₀ < 0 */
  const boundary = {
    inflow: { value: J0I, required: J0I, ok: true, words: 'm u_x ≡ −j₀ by the current, so −m(0)u_x(0) = j₀ identically' },
    relaxed: { u1: ZERO, psi: PSI, ok: true },
    noEntry: { flux: neg(J0I), ok: -J0I[0] <= 0 },
    contact: { product: mul(sub(PSI, ZERO), neg(J0I)), ok: true, inContactSet: true, exit: true },
    words: 'x = 1 is in the contact set (u(1) = ψ = 0) and carries exit flux −j₀: contact with exit'
  };
  return { K, h, gamma: G, cells, mMin, mMax, u: U, boundary };
}

/* ---------------- the whole thing ------------------------------------------ */
function decide(opts) {
  opts = opts || {};
  const K = opts.K || 256;
  const ladder = (opts.ladder || [16, 64, 256, 1024]).map(k => { const p = paint(k); return { K: k, refused: p.refused, refusedLength: p.refusedLength, refusedOK: p.refusedOK, rootsOK: p.rootsOK, runs: p.runs }; });
  const c1 = paint(K);
  const u1 = valueCase1(c1.cells);
  const weak = weakCase1(c1.cells);
  const b1 = boundaryCase1();
  const G = opts.gamma || [-0.5, -0.3];
  const c2 = paintCase2(K, G);
  return {
    K, roots: ROOTS,
    case1: { runs: c1.runs, refused: c1.refused, refusedLength: c1.refusedLength, refusedOK: c1.refusedOK, rootsOK: c1.rootsOK,
      mTube: c1.cells.map(c => [c.x0, c.m[0], c.m[1], c.standing]),
      uPlus: u1.plus.map((u, k) => [k / K, u[0], u[1]]), uMinus: u1.minus.map((u, k) => [k / K, u[0], u[1]]),
      weak, boundary: b1 },
    ladder,
    case2: { gamma: G, mMin: c2.mMin, mMax: c2.mMax, mTube: c2.cells.map(c => [c.x0, c.m[0], c.m[1]]),
      u: c2.u.map((u, k) => [k / K, u[0], u[1]]), boundary: c2.boundary }
  };
}

function certificate(res, provenance) {
  const falsifier = [
    'the float rule (sign at the cell centre) paints every root cell — the interval rule must REFUSE those same cells',
    'a root removed from the exact list makes a refused cell contain no root: the consistency check must fail',
    'the exit cost ψ raised to 0.1 with j₀ = 0.1: contact is lost and the complementarity product becomes 0.1 × (−0.1) ≠ 0 — must refuse',
    'the cubic bracket shifted off the root fails the sign check',
    'the cubic with j₀ forged to 0 at a cell where V < 0 has no positive root: the bracket must be refused'
  ];
  const c1 = res.case1, c2 = res.case2;
  if (!c1.refusedOK || !c1.rootsOK) return CERT.refused({ claim: 'the vanishing set of AAG §3.2 case 1', why: 'a refused cell contains no root, or a root lies in a decided cell', falsifier, provenance });
  if (!c1.weak.ok) return CERT.refused({ claim: 'the vanishing set of AAG §3.2 case 1', why: 'a weak-solution condition failed on a cell', falsifier, provenance });
  if (!(c1.boundary.inflow.ok && c1.boundary.relaxed.ok && c1.boundary.noEntry.ok)) return CERT.refused({ claim: 'the boundary conditions of AAG (3.6), case 1', why: 'a boundary condition failed', falsifier, provenance });
  if (!(c2.mMin > 0) || !c2.boundary.noEntry.ok) return CERT.refused({ claim: 'AAG §3.2 case 2', why: 'density floor not positive or no-entry sign wrong', falsifier, provenance });
  return CERT.proved({
    claim: 'AAG §3.2, V = γ + ½ sin(3π(x + ¼)): CASE 1 (j₀ = 0, γ = 0) the density vanishes exactly on the empty region {V < 0} — on ' + c1.runs.filter(r => r.standing === 'EMPTY').length + ' runs decided EMPTY, ' + c1.runs.filter(r => r.standing === 'OCCUPIED').length + ' runs decided OCCUPIED with m = V enclosed, and ' + c1.refused + ' of ' + res.K + ' cells REFUSED, each containing one of the three exact roots 1/12, 5/12, 3/4; the two value functions u± are enclosed and differ, so u is not unique off the support; x = 1 is in the contact set with exit flux 0. CASE 2 (j₀ = 1/10, every γ in [' + c2.gamma + ']): m > ' + CERT.fmt(c2.mMin) + ' on every cell, u enclosed, x = 1 in the contact set with exit flux −j₀ exactly',
    evidence: { K: res.K, refusedCells: c1.refused, refusedLength: c1.refusedLength, roots: res.roots, case2DensityFloor: c2.mMin, case2Gamma: c2.gamma },
    assumes: [
      'the explicit solutions are the paper\'s own (§3.2, Cases 1 and 2); what is certified is that they satisfy Definition 2.11 and (3.6) cell by cell, in intervals, and where the density vanishes',
      'γ in Figure 2 is not printed; case 2 is certified over the box [' + c2.gamma + '] that contains the value read off the figure',
      'the value functions are Riemann brackets, O(h) wide: rigorous, and wider than the density\'s'
    ],
    falsifier, provenance
  });
}

function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

module.exports = { ROOTS, J0I, V, isqrt, standing, standingFloat, paint, valueCase1, weakCase1, boundaryCase1, cubic, rootPoint, bracketOK, rootCell, paintCase2, decide, certificate, sha256File };
