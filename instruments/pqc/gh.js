/* gh.js — the SVP-challenge acceptance predicate, decided exactly.
 *
 *   GH(L) = ( det L · Γ(n/2+1) / π^(n/2) )^(1/n)
 *   accept  ⟺  ‖v‖ ≤ f · GH(L)        (f = 1.05 on the challenge)
 *
 * Raised to the n-th power every root disappears, and for a Goldstein–Mayer
 * challenge lattice det L = q is an integer read straight off the basis file.
 * What is left is a comparison of two exact rationals and a power of π:
 *
 *   n = 2m       (‖v‖²)^m · π^m  ≤  f^n · q · m!
 *   n = 2m+1     (‖v‖²)^n · π^(2m) · 4^(2m+2) · ((m+1)!)²
 *                              ≤  f^(2n) · q² · ((2m+2)!)²
 *
 * The odd case squares once more to clear the leftover ‖v‖, and its √π cancels
 * against π^(n/2) — Γ(m+3/2) = (2m+2)!·√π / (4^(m+1)(m+1)!). So no irrational
 * survives except π, and a certified bracket on π decides the whole thing.
 *
 * ‖v‖² is a RATIONAL here, not an integer, on purpose. The hall of fame prints
 * the norm rounded to a whole number, so the true squared norm is only known to
 * lie in [(N−½)², (N+½)²]. Deciding at the upper end is sound: a record that
 * clears the wall at the worst norm consistent with what was published is
 * admissible whatever its vector was.
 */
'use strict';
const { piScaled } = require('./pi.js');

const fact = (k) => { let r = 1n; for (let i = 2n; i <= k; i++) r *= i; return r; };

/* Is (nsNum/nsDen) — a squared norm — within f = fN/fD times GH, for the
   Goldstein–Mayer lattice of dimension n and determinant q?
   Returns 'ADMISSIBLE' | 'REFUSED' | 'UNDECIDED' (π bracket too loose). */
/* The Python port refuses a float at ingest with a sentence; here the same
   mistake surfaced as "cannot mix BigInt and other types" from four frames
   down. Same outcome, worse message, and a caller reading it learns nothing
   about which argument was wrong. */
class IngestError extends TypeError {}
const exact = (x, what) => {
  if (typeof x !== 'bigint') {
    throw new IngestError(
      `${what} must be an exact BigInt, got ${typeof x} ${JSON.stringify(x)}. ` +
      `A Number has already lost the value you meant.`);
  }
  return x;
};

function decide(n, q, nsNum, nsDen, fN = 21n, fD = 20n, digits = 40) {
  exact(q, 'the determinant'); exact(nsNum, 'the squared norm');
  exact(nsDen, 'the squared-norm denominator');
  exact(fN, 'the factor numerator'); exact(fD, 'the factor denominator');
  if (!Number.isInteger(n)) throw new IngestError(`the dimension must be an integer, got ${n}`);
  const N = BigInt(n), pi = piScaled(digits);
  const side = (piNum, piDen) => {
    if (N % 2n === 0n) {
      const m = N / 2n;
      // LHS = ns^m · π^m ;  RHS = (fN/fD)^n · q · m!
      const lhs = nsNum ** m * piNum ** m * fD ** N;
      const rhs = fN ** N * q * fact(m) * nsDen ** m * piDen ** m;
      return { lhs, rhs };
    }
    const m = (N - 1n) / 2n;
    // LHS = ns^n · π^(2m) · 4^(2m+2) · ((m+1)!)² ; RHS = (fN/fD)^(2n) · q² · ((2m+2)!)²
    const lhs = nsNum ** N * piNum ** (2n * m) * 4n ** (2n * m + 2n) * fact(m + 1n) ** 2n * fD ** (2n * N);
    const rhs = fN ** (2n * N) * q ** 2n * fact(2n * m + 2n) ** 2n * nsDen ** N * piDen ** (2n * m);
    return { lhs, rhs };
  };
  /* the largest π makes the left side largest, so it decides admissibility;
     the smallest π decides refusal. Both must agree or the answer is undecided. */
  const hi = side(pi.hi, pi.S);
  const lo = side(pi.lo, pi.S);
  if (hi.lhs <= hi.rhs) return 'ADMISSIBLE';
  if (lo.lhs > lo.rhs) return 'REFUSED';
  return 'UNDECIDED';
}

/* A certified bracket on the ratio ‖v‖ / GH, obtained by bisecting the factor f
   with the exact predicate above — so the bracket inherits the proof and needs
   no n-th root anywhere. */
function ratioBracket(n, q, nsNum, nsDen, digits = 40, steps = 34) {
  let lo = 0n, hi = 4n, den = 1n;                    // ratio lies in [0, 4)
  for (let i = 0; i < steps; i++) {
    lo *= 2n; hi *= 2n; den *= 2n;
    const mid = (lo + hi) / 2n;
    const v = decide(n, q, nsNum, nsDen, mid, den, digits);
    if (v === 'UNDECIDED') break;
    if (v === 'ADMISSIBLE') hi = mid; else lo = mid;
  }
  return { loNum: lo, hiNum: hi, den };
}

const toDecimal = (num, den, places) => {
  const s = 10n ** BigInt(places);
  const v = num * s / den;
  return (v / s) + '.' + (v % s).toString().padStart(places, '0');
};

module.exports = { decide, ratioBracket, fact, toDecimal, IngestError };
