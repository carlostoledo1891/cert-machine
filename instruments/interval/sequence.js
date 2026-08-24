/* sequence.js — two-sided sequences with a declared PARITY, and the weighted
   ell^1_nu algebra on them.

   ||f||_nu = sum_{k in Z} |f_k| nu^{|k|},  nu >= 1

   is a BANACH ALGEBRA norm for convolution: ||f*g|| <= ||f|| ||g||. That one
   inequality is why every quadratic bound in a spectral validation is a
   one-liner instead of a Sobolev embedding with an unevaluated constant, and
   it is the reason validations of this kind live in ell^1_nu rather than in
   an L^2 space.

   PARITY IS A FIRST-CLASS ARGUMENT, and that is not fussiness. A real even
   function has f_{-k} = f_k; its derivative is ODD, f_{-k} = −f_k. Storing
   both as "the array f[0..N]" and extending both the same way produces a
   Galerkin system that is not the one you meant — and its residual is
   machine-zero, because it is solving the wrong system exactly. That bug was
   live in this repository: the Fourier residual read 1e-16 at a point whose
   pointwise PDE residual was 4e-2. Nothing about the residual could reveal it.

   So there is no default parity here. Every lookup and every convolution takes
   it explicitly, and passing the wrong one changes the answer loudly rather
   than quietly.

   Works over any arithmetic that provides {add, sub, mul, abs, ZERO, ONE} —
   pass the interval module for rigorous bounds, or a float shim for speed.

   MIT licensed. Part of eqcert. */
'use strict';

const EVEN = 'e', ODD = 'o';

/* float arithmetic in the shape the interval module exposes, so the same code
   drives both. Used for the fast pass; the certified pass passes intervals. */
const FLOAT = {
  ZERO: 0, ONE: 1,
  add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b,
  abs: a => Math.abs(a)
};

/* lookup at any j in Z on a sequence stored as f[0..N] with declared parity */
function at(f, j, parity) {
  const a = j < 0 ? -j : j;
  if (a >= f.length) return undefined;              /* caller supplies ZERO */
  if (j < 0 && parity === ODD) return null;         /* signals "negate me" */
  return f[a];
}

/* the safe accessor: returns A.ZERO outside the band and negates for odd */
function get(f, j, parity, A) {
  const a = j < 0 ? -j : j;
  if (a >= f.length) return A.ZERO;
  const v = f[a];
  if (j < 0 && parity === ODD) return A.sub(A.ZERO, v);
  return v;
}

/* (f*g)_k for k = 0..K, over Z, with declared parities */
function conv(f, g, K, pf, pg, A) {
  A = A || FLOAT;
  const out = new Array(K + 1);
  const Jf = f.length - 1, Jg = g.length - 1;
  for (let k = 0; k <= K; k++) {
    let s = A.ZERO;
    for (let j = -Jf; j <= Jf; j++) {
      const t = k - j;
      if (t < -Jg || t > Jg) continue;
      s = A.add(s, A.mul(get(f, j, pf, A), get(g, t, pg, A)));
    }
    out[k] = s;
  }
  return out;
}

/* ||f||_nu for a two-sided sequence stored as f[0..N].
   hasZero=false for odd sequences (f_0 = 0 always) so the zero mode is not
   double counted. Parity does not affect the norm, only the zero mode does. */
function normNu(f, nu, hasZero, A) {
  A = A || FLOAT;
  const nuv = (A === FLOAT) ? nu : (Array.isArray(nu) ? nu : [nu, nu]);
  let s = hasZero ? A.abs(f[0]) : A.ZERO;
  let nk = A.ONE;
  for (let k = 1; k < f.length; k++) {
    nk = A.mul(nk, nuv);
    s = A.add(s, A.mul((A === FLOAT ? 2 : [2, 2]), A.mul(A.abs(f[k]), nk)));
  }
  return s;
}

/* the weight of the basis direction at index k: ||e_k|| = 2 nu^k for k >= 1
   (the pair ±k moves together), 1 for the zero mode / a scalar unknown. */
const weight = (k, nu) => (k === 0 ? 1 : 2 * Math.pow(nu, k));

/* sup_x |f(x) − g(x)| <= ||f − g||_1 <= ||f − g||_nu for nu >= 1.
   Used to turn a coefficient enclosure into a pointwise one — the step that
   makes "the density is positive over the whole ball" checkable. */
function supFromNorm(normValue) { return normValue; }

module.exports = { EVEN, ODD, FLOAT, at, get, conv, normNu, weight, supFromNorm };
