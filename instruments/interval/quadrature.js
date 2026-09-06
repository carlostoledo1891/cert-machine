/* quadrature.js — a rigorous integral over [0, 1], and nothing more.

   The midpoint rule with its remainder carried as an interval:

       ∫_cell f  =  h · f(c)  +  E,        |E| ≤ (h³ / 24) · sup_cell |f''|

   for any C² integrand, on every cell. The caller supplies two enclosures and
   this file supplies the arithmetic: `fAt(c)` must enclose f at the exact
   midpoint c, `f2On(X)` must enclose f'' over the whole cell X. Both are
   intervals; the sum of the cell terms is an interval; the remainder is added
   as a symmetric interval whose radius is an OUTWARD-rounded bound. What comes
   back therefore contains the true integral, provided the two callbacks are
   themselves enclosures — the rigor is exactly as good as theirs, which is why
   they are the caller's, in the open, and not hidden behind a float.

   Only [0, 1] and only K = 2^p cells. That restriction is the point: h = 1/K
   and every node k/K and midpoint (2k+1)/(2K) are then EXACT doubles, so the
   cells tile [0, 1] with no rounding at the seams and the midpoint the rule is
   evaluated at is the midpoint of the true cell. A general [a, b] would need a
   widened node and a widened midpoint on every cell; nothing here needs it.

   `remainder: false` exists for the falsifier only — the test must show that
   dropping the remainder term produces an interval that MISSES the true value
   on a coarse grid. A rule that stays green without its remainder is not
   rigorous, it is lucky.

   MIT licensed. Part of eqcert (instruments/interval). */
'use strict';

const I = require('./interval.js');
const { iv, add, mul, div, pow, mag, ZERO } = I;

function isPow2(K) { return Number.isInteger(K) && K >= 1 && (K & (K - 1)) === 0; }

/* ∫_0^1 f, as an interval.  o = { K, fAt, f2On, remainder = true } */
function midpoint01(o) {
  const K = o.K;
  if (!isPow2(K)) throw new Error('quadrature.midpoint01: K must be a power of two, got ' + K);
  if (typeof o.fAt !== 'function' || typeof o.f2On !== 'function')
    throw new Error('quadrature.midpoint01: fAt and f2On are required');
  const h = 1 / K;                                  /* exact */
  const hI = iv(h);
  let S = ZERO;
  let sup2 = ZERO;                                  /* Σ_k sup_cell |f''|, rounded up */
  for (let k = 0; k < K; k++) {
    const xl = k * h, xr = (k + 1) * h, c = (2 * k + 1) / (2 * K);   /* all exact */
    const fc = o.fAt(c);
    if (!Array.isArray(fc) || !(fc[0] <= fc[1])) throw new Error('quadrature: fAt returned a non-interval at c=' + c);
    S = add(S, mul(hI, fc));
    if (o.remainder !== false) {
      const f2 = o.f2On([xl, xr]);
      if (!Array.isArray(f2) || !(f2[0] <= f2[1])) throw new Error('quadrature: f2On returned a non-interval on cell ' + k);
      sup2 = add(sup2, iv(mag(f2)));
    }
  }
  if (o.remainder === false) return S;
  /* R = h³/24 · Σ sup|f''|, kept as an interval so every rounding goes outward */
  const R = mul(div(pow(hI, 3), iv(24)), sup2);
  return add(S, [-R[1], R[1]]);
}

/* A running version for cumulative integrals: returns the K+1 boundary values
   U_k = ∫_0^{k/K} f as intervals, U_0 = [0,0]. Same rule, same remainder, per
   cell. Widths accumulate — that is the truth of a cumulative sum and it is
   reported, not hidden. */
function cumulative01(o) {
  const K = o.K;
  if (!isPow2(K)) throw new Error('quadrature.cumulative01: K must be a power of two, got ' + K);
  const h = 1 / K, hI = iv(h);
  const R1 = div(pow(hI, 3), iv(24));
  const U = new Array(K + 1);
  U[0] = ZERO;
  for (let k = 0; k < K; k++) {
    const xl = k * h, xr = (k + 1) * h, c = (2 * k + 1) / (2 * K);
    let cell = mul(hI, o.fAt(c));
    if (o.remainder !== false) {
      const r = mul(R1, iv(mag(o.f2On([xl, xr]))));
      cell = add(cell, [-r[1], r[1]]);
    }
    U[k + 1] = add(U[k], cell);
  }
  return U;
}

module.exports = { midpoint01, cumulative01, isPow2 };
