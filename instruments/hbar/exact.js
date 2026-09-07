/* exact.js — the effective Hamiltonian of a one-dimensional mechanical Hamiltonian, enclosed.
   instruments/hbar · cert-machine · 2026-09-07

   THE CELL PROBLEM (Gomes–Yang, arXiv:1810.03483, (1.1)):  H(x, P + u′) = H̄(P) on 𝕋, with
   H(x, p) = p²/2 + V(x). In one dimension the answer is classical (the paper's §6.1 quotes it
   for V = sin 2πx from Cacace–Camilli):
     H̄(P) = max V                              for |P| ≤ P₀ := ∫₀¹ √(2(max V − V(x))) dx,
     H̄(P) = c, the unique c > max V with  Q(c) := ∫₀¹ √(2(c − V(x))) dx = |P|,   for |P| > P₀.
   Q is strictly increasing in c (Q′(c) = ∫ 1/√(2(c − V)) > 0), so c is bracketed by bisection
   as soon as Q can be bounded (and tightened by the mean value theorem with the period as Q′ once
   bisection stalls), and Q is bounded by the midpoint rule with its remainder from
   the second-order interval jet (taylor2.js) — except that near c = max V the integrand's
   second derivative blows up like (c − V)^{−3/2}, the remainder with it, and the enclosure
   of Q widens toward P₀, and at P₀ itself the point is left undecided. That is the degeneracy of
   the cell problem, met as a refusal rather than smoothed over.

   THE MATHER MEASURE. For |P| > P₀ the projected Mather measure is absolutely continuous,
   m(x) = 1/(T(c)√(2(c − V(x)))) with T(c) = Q′(c) the period; for |P| < P₀ it is the Dirac
   mass at the maximum of V (the paper's own statement at P = P₀ for V = sin 2πx: δ_{3/4}).
   Both are stated here; only the first is enclosed, and only where T(c) can be.

   THE POTENTIALS. V = sin 2πx (the paper's (4.2)), cos 2πx (the separable 2-D example),
   −sin 2πx (§6.4–6.5). For all three max V = 1 and P₀ = 4/π exactly (2(1 − sin 2πx) =
   4 sin²(πx − π/4)); the general quadrature is run anyway and must contain 4/π. */
'use strict';
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const J2 = require(path.join(__dirname, '..', 'interval', 'taylor2.js'));
const { iv, ZERO, ONE, add, sub, mul, div, neg } = I;

const POTS = {
  sin: { name: 'sin 2πx', max: ONE, argmax: 0.25, jet: (x) => J2.sin(J2.scale(x, T.TWO_PI)), iv: (x) => T.sin(mul(T.TWO_PI, x)) },
  cos: { name: 'cos 2πx', max: ONE, argmax: 0, jet: (x) => J2.cos(J2.scale(x, T.TWO_PI)), iv: (x) => T.cos(mul(T.TWO_PI, x)) },
  msin: { name: '−sin 2πx', max: ONE, argmax: 0.75, jet: (x) => J2.neg(J2.sin(J2.scale(x, T.TWO_PI))), iv: (x) => neg(T.sin(mul(T.TWO_PI, x))) }
};
const sqrtIv = (X) => { const lo = Math.max(0, X[0]); return iv(I.nextDown(Math.sqrt(lo)), I.nextUp(Math.sqrt(Math.max(0, X[1])))); };

/* ∫₀¹ √(2(c − V)) dx as an interval, c an interval with c[0] > max V required (else refused).
   Cells where the interval base 2(c − V(cell)) does not stay positive by a margin take the plain
   Riemann bound (the integrand's range on the cell); the rest the midpoint rule with f″. */
function Q(c, pot, K) {
  if (!(c[0] > pot.max[1])) return { ok: false, why: 'c ≤ max V: the integrand is not real on the whole torus' };
  const F = (x) => J2.powr(J2.scale(J2.sub(J2.cst(c), pot.jet(x)), iv(2)), 0.5);
  const guard = (cell) => {
    const base = mul(iv(2), sub(c, pot.iv(cell)));
    if (base[0] > 1e-9 * Math.max(1, base[1])) return null;
    return sqrtIv(base);
  };
  const r = J2.integrate(F, 0, 1, K, guard);
  return { ok: true, value: r.value, width: I.width(r.value) };
}
/* the period T(c) = ∫ 1/√(2(c − V)): the same, with the reciprocal (refused where the base touches 0) */
function period(c, pot, K) {
  if (!(c[0] > pot.max[1])) return { ok: false, why: 'c ≤ max V' };
  const F = (x) => J2.powr(J2.scale(J2.sub(J2.cst(c), pot.jet(x)), iv(2)), -0.5);
  const guard = (cell) => {
    const base = mul(iv(2), sub(c, pot.iv(cell)));
    if (base[0] > 1e-6 * Math.max(1, base[1])) return null;
    if (!(base[0] > 0)) return { refuse: true };
    return div(ONE, sqrtIv(base));
  };
  let refused = false;
  const r = J2.integrate(F, 0, 1, K, (cell) => { const g = guard(cell); if (g && g.refuse) { refused = true; return iv(0, 1e300); } return g; });
  if (refused) return { ok: false, why: 'the period integrand is unbounded on a cell touching max V' };
  return { ok: true, value: r.value, width: I.width(r.value) };
}
/* P₀ = ∫ √(2(max V − V)): the cusp cells take the Riemann bound, the rest the midpoint rule */
function P0(pot, K) {
  const F = (x) => J2.powr(J2.scale(J2.sub(J2.cst(pot.max), pot.jet(x)), iv(2)), 0.5);
  const guard = (cell) => {
    const base = mul(iv(2), sub(pot.max, pot.iv(cell)));
    if (base[0] > 1e-6) return null;
    return sqrtIv(base);
  };
  const r = J2.integrate(F, 0, 1, K, guard);
  return { value: r.value, width: I.width(r.value) };
}

/* the bracket on c for a given |P| > P₀: bisection with rigorous Q, stopping when Q's own enclosure
   can no longer separate the two sides (the degeneracy) or when the bracket is below tol */
function cOf(P, pot, opts) {
  opts = opts || {};
  const K = opts.K || 2048, tol = opts.tol || 1e-10, maxIt = opts.maxIt || 80;
  let lo = pot.max[1], hi = Math.max(pot.max[1] + 1, P * P / 2 + pot.max[1] + 1);      /* Q(c) ≥ √(2(c − max V)) so c ≤ P²/2 + max V */
  /* the upper end must certify Q(hi) ≥ P */
  { const q = Q(iv(hi), pot, K); if (!q.ok || !(q.value[0] >= P)) return { ok: false, why: 'no certified upper end of the bracket' }; }
  let it = 0, stalled = false, tightened = false, lastQ = null;
  while (hi - lo > tol && it < maxIt) {
    const mid = 0.5 * (lo + hi);
    const q = Q(iv(mid), pot, K);
    lastQ = q;
    if (!q.ok) { lo = mid; it++; continue; }                 /* mid ≤ max V cannot happen for mid > lo ≥ max V, but keep the branch honest */
    if (q.value[1] < P) lo = mid;
    else if (q.value[0] > P) hi = mid;
    else {
      /* Q(mid) straddles P: bisection cannot move. Tighten with the mean value theorem instead:
         Q(c) − Q(mid) = Q′(ξ)(c − mid) with Q′ = T ≥ T_lo on [lo, hi], so
         c ∈ mid + [P − Q(mid)_hi, P − Q(mid)_lo] / T_lo, intersected with [lo, hi]. */
      const per = period(iv(lo, hi), pot, K);
      if (per.ok && per.value[0] > 0) {
        const Tlo = per.value[0];
        const a = I.nextDown(mid + (P - q.value[1]) / Tlo), b = I.nextUp(mid + (P - q.value[0]) / Tlo);
        lo = Math.max(lo, a); hi = Math.min(hi, b);
        tightened = true;
      }
      stalled = true; break;
    }
    it++;
  }
  return { ok: true, lo, hi, width: hi - lo, it, stalled, tightened, qWidth: lastQ && lastQ.ok ? lastQ.width : null };
}

/* the effective Hamiltonian at P: FLAT (decided, exactly max V), ROTATING (a bracket), or UNDECIDED (P inside the P₀ enclosure) */
function hbar(P, pot, opts) {
  const p0 = P0(pot, (opts && opts.K) || 2048);
  const aP = Math.abs(P);
  if (aP <= p0.value[0]) return { P, regime: 'FLAT', value: [pot.max[0], pot.max[1]], width: I.width(pot.max), P0: p0.value, mather: 'Dirac at x = ' + pot.argmax };
  if (aP < p0.value[1]) return { P, regime: 'UNDECIDED', why: '|P| lies inside the enclosure of P₀ = [' + p0.value + ']', P0: p0.value };
  const c = cOf(aP, pot, opts);
  if (!c.ok) return { P, regime: 'REFUSED', why: c.why, P0: p0.value };
  return { P, regime: 'ROTATING', value: [c.lo, c.hi], width: c.width, stalled: c.stalled, tightened: c.tightened, it: c.it, qWidth: c.qWidth, P0: p0.value, mather: 'absolutely continuous, density 1/(T(c)√(2(c − V)))' };
}
/* the Mather density at points x for a rotating P, as intervals, where the period can be enclosed */
function matherDensity(cInt, pot, xs, K) {
  const per = period(cInt, pot, K || 2048);
  if (!per.ok) return { ok: false, why: per.why };
  const dens = xs.map(x => { const base = mul(iv(2), sub(cInt, pot.iv(iv(x)))); return div(ONE, mul(per.value, sqrtIv(base))); });
  return { ok: true, T: per.value, density: dens.map(d => [d[0], d[1]]) };
}

module.exports = { POTS, Q, period, P0, cOf, hbar, matherDensity, sqrtIv };
