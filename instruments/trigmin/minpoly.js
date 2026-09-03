#!/usr/bin/env node
/* minpoly.js — the exact minimal polynomial of a certified cosine-sum minimum.
   instruments/trigmin · cert-machine

   WHAT THIS DECIDES. certify-min.js returns a certified ENCLOSURE of
   L(A) = min_theta sum_{a in A} cos(a theta). This module turns that
   enclosure into an exact algebraic identity: the integer polynomial the
   minimum satisfies, and — when the reduction test succeeds — the proof that
   the polynomial is irreducible, so it IS the minimal polynomial and the
   minimum's algebraic degree is its degree.

   THE ARGUMENT, in four exactly-checkable steps.
     1. P_A(c) = sum_a T_a(c) is the cosine sum in c = cos theta, integer
        coefficients (cheb.js). The minimum over theta is the minimum of P_A
        over [-1, 1].
     2. If P_A(-1) and P_A(1) are both strictly above the enclosure, the
        minimum is attained in the OPEN interval, so it is a critical value:
        P_A'(c*) = 0 and L = P_A(c*). Both endpoint values are exact integers;
        the comparison is exact.
     3. R(y) = Res_c(P_A'(c), P_A(c) - y) is an integer polynomial (Sylvester
        determinant, fraction-free Bareiss — no division that is not exact,
        no floating point anywhere) whose roots are EXACTLY the critical
        values of P_A. Both leading coefficients are nonzero constants in c,
        so the resultant vanishes iff the two polynomials share a root.
        By step 2, R(L) = 0.
     4. Sturm's theorem on the square-free part of R counts the roots of R in
        the enclosure. If that count is 1, the unique root is L — the
        enclosure and the polynomial pin the same number.
   Then irreducibility: if R stays degree-d modulo a prime p and is
   irreducible over F_p, it is irreducible over Q (the standard reduction
   criterion — a NAMED EXTERNAL THEOREM consumed here, like Krawczyk's
   elsewhere in this lab; the F_p test itself is exact — Rabin's criterion,
   cross-checked at degree <= 5 by an exhaustive root-and-quadratic search
   that shares no code with it).
   Irreducible + primitive + R(L) = 0 means R is the minimal polynomial of L
   up to sign, so L has algebraic degree deg R.

   WHAT THIS DOES NOT DECIDE. Whether the root is expressible in radicals:
   that is the Galois group of R, and nothing here computes it. A degree-5
   irreducible polynomial may or may not be solvable, and this module says
   nothing either way.

   usage: node instruments/trigmin/minpoly.js 1 2 4 5 6 */
'use strict';

const path = require('path');
const C = require('./cheb.js');
const CM = require('./certify-min.js');
const Q = require('../interval/rational.js');

/* ---- exact linear algebra -------------------------------------------------- */

/* Sylvester matrix of f (degree m) and g (degree n), both coefficient arrays
   low->high: (m+n) x (m+n), n shifted rows of f above m shifted rows of g. */
function sylvester(f, g) {
  const m = f.length - 1, n = g.length - 1;
  if (m < 1 || n < 1) throw new Error('sylvester: both polynomials must have positive degree');
  const N = m + n;
  const M = Array.from({ length: N }, () => new Array(N).fill(0n));
  for (let i = 0; i < n; i++) for (let k = 0; k <= m; k++) M[i][i + (m - k)] = f[k];
  for (let i = 0; i < m; i++) for (let k = 0; k <= n; k++) M[n + i][i + (n - k)] = g[k];
  return M;
}

/* Bareiss fraction-free elimination: an integer determinant with no rational
   arithmetic and no rounding — every division in the loop is exact by
   construction (Bareiss's identity). */
function det(M) {
  const n = M.length;
  const a = M.map(r => r.slice());
  let prev = 1n, sign = 1n;
  for (let k = 0; k < n - 1; k++) {
    if (a[k][k] === 0n) {
      let s = -1;
      for (let i = k + 1; i < n; i++) if (a[i][k] !== 0n) { s = i; break; }
      if (s < 0) return 0n;
      const t = a[k]; a[k] = a[s]; a[s] = t; sign = -sign;
    }
    for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++)
      a[i][j] = (a[i][j] * a[k][k] - a[i][k] * a[k][j]) / prev;
    prev = a[k][k];
  }
  return sign * a[n - 1][n - 1];
}

/* ---- the critical-value polynomial ----------------------------------------- */

/* Res_c(P'(c), P(c) - y) as an integer polynomial in y, primitive with a
   positive leading coefficient. Computed by exact interpolation: the
   resultant is a polynomial in y of degree at most deg(P'), so deg(P')+1
   integer determinants determine it, and extra points VERIFY it. */
function critValuePoly(P) {
  const Pd = C.polyDeriv(P);
  const d = Pd.length - 1;
  if (d < 1) throw new Error('critValuePoly: P must have positive-degree derivative');
  const resAt = (y) => { const g = P.slice(); g[0] = g[0] - y; return det(sylvester(Pd, g)); };

  const pts = [];
  for (let i = 0; i <= d + 2; i++) pts.push([BigInt(i) - BigInt(d), resAt(BigInt(i) - BigInt(d))]);

  /* exact Lagrange interpolation in rationals */
  let coef = new Array(pts.length).fill(null).map(() => Q.R(0n, 1n));
  for (let i = 0; i < pts.length; i++) {
    let basis = [Q.R(1n, 1n)], den = Q.R(1n, 1n);
    for (let j = 0; j < pts.length; j++) {
      if (j === i) continue;
      const nb = new Array(basis.length + 1).fill(null).map(() => Q.R(0n, 1n));
      for (let k = 0; k < basis.length; k++) {
        nb[k + 1] = Q.add(nb[k + 1], basis[k]);
        nb[k] = Q.add(nb[k], Q.mul(basis[k], Q.R(-pts[j][0], 1n)));
      }
      basis = nb;
      den = Q.mul(den, Q.R(pts[i][0] - pts[j][0], 1n));
    }
    const s = Q.div(Q.R(pts[i][1], 1n), den);
    for (let k = 0; k < basis.length; k++) coef[k] = Q.add(coef[k], Q.mul(basis[k], s));
  }
  let lcm = 1n;
  for (const c of coef) lcm = lcm * c.d / Q.gcd(lcm, c.d);
  let R = coef.map(c => c.n * (lcm / c.d));
  R = C.trim(R);
  const ct = R.reduce((g, x) => Q.gcd(g, x < 0n ? -x : x), 0n);
  if (ct > 1n) R = R.map(x => x / ct);
  if (R[R.length - 1] < 0n) R = R.map(x => -x);

  /* VERIFY the interpolant on points it was not built from: the raw
     resultant must be the same constant multiple of R at every one of them.
     A wrong degree assumption or an arithmetic slip dies here. */
  const probe = [BigInt(d + 5), BigInt(d + 9), BigInt(-d - 7)];
  let ratio = null;
  for (const y of probe) {
    const a = resAt(y), b = C.evalHom(R, y, 1n);
    if (b === 0n) throw new Error('critValuePoly: probe point is a root — retry with a different point');
    if (a % b !== 0n) throw new Error('critValuePoly: interpolant does not divide the resultant at y = ' + y);
    const r = a / b;
    if (ratio === null) ratio = r;
    else if (r !== ratio) throw new Error('critValuePoly: interpolant is not a constant multiple of the resultant');
  }
  return { R, contentRatio: ratio, degree: R.length - 1 };
}

/* ---- irreducibility over F_p ------------------------------------------------ */

/* Exhaustive and exact for degree <= 5: a polynomial of that degree over F_p
   is irreducible iff it has no root in F_p and no monic quadratic factor.
   Kept as the CROSS-CHECK on the general test below — two implementations
   that share no code must agree wherever both apply. Returns null when the
   reduction drops the degree (the criterion does not apply at that prime). */
function irreducibleModP(c, p) {
  const P = BigInt(p);
  if (P < 2n) throw new Error('irreducibleModP: p must be a prime >= 2');
  const d = c.length - 1;
  if (d < 2) throw new Error('irreducibleModP: degree must be at least 2');
  if (d > 5) throw new Error('irreducibleModP: this exhaustive test is stated for degree <= 5');
  const a = c.map(x => ((x % P) + P) % P);
  if (a[d] === 0n) return null;
  const inv = (x) => { let r = 1n, e = P - 2n, b = x % P; while (e > 0n) { if (e & 1n) r = r * b % P; b = b * b % P; e >>= 1n; } return r; };
  const norm = (u) => { while (u.length > 1 && u[u.length - 1] === 0n) u.pop(); return u; };
  const rem = (u, v) => {
    u = u.slice();
    const dv = v.length - 1, lv = inv(v[dv]);
    for (let i = u.length - 1; i >= dv; i--) {
      const qh = u[i] * lv % P;
      if (qh === 0n) continue;
      for (let j = 0; j <= dv; j++) u[i - dv + j] = ((u[i - dv + j] - qh * v[j]) % P + P) % P;
    }
    return norm(u);
  };
  for (let x = 0n; x < P; x++) {
    let v = 0n;
    for (let i = d; i >= 0; i--) v = (v * x + a[i]) % P;
    if (v === 0n) return false;
  }
  if (d < 4) return true;                                  /* no root and deg < 4 => irreducible */
  for (let b = 0n; b < P; b++) for (let cc = 0n; cc < P; cc++) {
    const r = rem(a, [cc, b, 1n]);
    if (r.length === 1 && r[0] === 0n) return false;
  }
  return true;
}

/* ---- Rabin's test, any degree ---------------------------------------------- */
/* f of degree d over F_p is irreducible iff x^(p^d) = x mod f and
   gcd(x^(p^(d/q)) - x, f) = 1 for every prime q dividing d. The Frobenius
   powers are built one p-th power at a time, so the huge exponent p^k is
   never formed. Arithmetic is BigInt modulo p throughout. */
function rabinIrreducibleModP(c, p) {
  const P = BigInt(p);
  if (P < 2n) throw new Error('rabinIrreducibleModP: p must be a prime >= 2');
  const d = c.length - 1;
  if (d < 1) throw new Error('rabinIrreducibleModP: degree must be at least 1');
  const a = c.map(x => ((x % P) + P) % P);
  if (a[d] === 0n) return null;                            /* degree drops: criterion does not apply */
  if (d === 1) return true;
  const inv = (x) => { let r = 1n, e = P - 2n, b = x % P; while (e > 0n) { if (e & 1n) r = r * b % P; b = b * b % P; e >>= 1n; } return r; };
  const norm = (u) => { const v = u.slice(); while (v.length > 1 && v[v.length - 1] === 0n) v.pop(); return v; };
  const isZero = (u) => u.length === 1 && u[0] === 0n;
  const monic = (u) => { const l = inv(u[u.length - 1]); return u.map(x => x * l % P); };
  const rem = (u, v) => {
    const w = u.slice(), dv = v.length - 1, lv = inv(v[dv]);
    for (let i = w.length - 1; i >= dv; i--) {
      const qh = w[i] * lv % P;
      if (qh === 0n) continue;
      for (let j = 0; j <= dv; j++) w[i - dv + j] = ((w[i - dv + j] - qh * v[j]) % P + P) % P;
    }
    return norm(w);
  };
  const mulmod = (u, v, f) => {
    const o = new Array(u.length + v.length - 1).fill(0n);
    for (let i = 0; i < u.length; i++) { if (u[i] === 0n) continue;
      for (let j = 0; j < v.length; j++) o[i + j] = (o[i + j] + u[i] * v[j]) % P; }
    return rem(norm(o), f);
  };
  const powmod = (u, e, f) => {                            /* u^e mod f, e a BigInt */
    let r = [1n], b = rem(u.slice(), f), k = e;
    while (k > 0n) { if (k & 1n) r = mulmod(r, b, f); b = mulmod(b, b, f); k >>= 1n; }
    return r;
  };
  const gcd = (u, v) => {
    let x = norm(u), y = norm(v);
    while (!isZero(y)) { const t = rem(x, monic(y)); x = y; y = t; }
    return isZero(x) ? x : monic(x);
  };
  const f = monic(a);
  const sub = (u, v) => {                                  /* u - v over F_p */
    const n = Math.max(u.length, v.length), o = new Array(n).fill(0n);
    for (let i = 0; i < n; i++) o[i] = (((u[i] || 0n) - (v[i] || 0n)) % P + P) % P;
    return norm(o);
  };
  const primesOf = (n) => { const s = new Set(); let m = n; for (let q = 2; q * q <= m; q++) while (m % q === 0) { s.add(q); m /= q; } if (m > 1) s.add(m); return [...s]; };

  let g = [0n, 1n];                                        /* x */
  const frob = (u) => powmod(u, P, f);                     /* one p-th power */
  const marks = new Set(primesOf(d).map(q => d / q));
  for (let k = 1; k <= d; k++) {
    g = frob(g);
    if (marks.has(k)) { if (!(gcd(sub(g, [0n, 1n]), f).length === 1)) return false; }
  }
  return isZero(sub(g, [0n, 1n]));
}

/* ---- the certificate -------------------------------------------------------- */

/* The whole argument, for a frequency set A and a certified enclosure of its
   minimum. Returns a record; `ok` is true only when every step held. */
function certifyMinPoly(A, enc, opts) {
  const o = opts || {};
  const primes = o.primes || [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
  const P = C.polyForSet(A);
  const at1 = C.evalHom(P, 1n, 1n), atm1 = C.evalHom(P, -1n, 1n);

  /* step 2: the minimum is interior — both endpoint values strictly above
     the enclosure's upper end */
  const interior = Q.cmp(Q.R(at1, 1n), enc.hi) > 0 && Q.cmp(Q.R(atm1, 1n), enc.hi) > 0;

  /* step 3 */
  const { R, degree } = critValuePoly(P);

  /* step 4: exact sign change and Sturm count on the enclosure */
  const sLo = C.evalSign(R, enc.lo), sHi = C.evalSign(R, enc.hi);
  const signChange = sLo * sHi < 0;
  const chain = CM.sturmChain(CM.squarefreePart(R));
  const roots = CM.signVarAt(chain, enc.lo) - CM.signVarAt(chain, enc.hi);

  /* irreducibility */
  let prime = null, crossChecked = null;
  for (const p of primes) {
    const v = rabinIrreducibleModP(R, p);
    if (v === true) {
      prime = p;
      /* where the exhaustive test applies, the two must agree — a silent
         disagreement would mean one of them is wrong, so it refuses */
      if (degree <= 5) {
        crossChecked = irreducibleModP(R, p);
        if (crossChecked !== true) throw new Error('minpoly: irreducibility tests disagree at p = ' + p);
      }
      break;
    }
  }

  /* the same polynomial in lambda = -L: S(x) = ±R(-x), positive leading */
  let S = R.map((c, i) => (i % 2 === 0 ? c : -c));
  if (S[S.length - 1] < 0n) S = S.map(x => -x);

  return {
    A: A.slice(), P, R, S, degree,
    endpoints: { at1: at1.toString(), atMinus1: atm1.toString() },
    interior, signChange, rootsInEnclosure: roots,
    irreducible: prime !== null, prime, crossChecked,
    ok: interior && signChange && roots === 1 && prime !== null
  };
}

/* Pretty-print a coefficient array low->high as a polynomial in `v`. */
function fmt(c, v) {
  const parts = [];
  for (let k = c.length - 1; k >= 0; k--) {
    if (c[k] === 0n) continue;
    const neg = c[k] < 0n, mag = neg ? -c[k] : c[k];
    const unit = mag === 1n && k > 0 ? '' : mag.toString();
    const pw = k === 0 ? '' : (k === 1 ? v : v + '^' + k);
    parts.push((parts.length === 0 ? (neg ? '-' : '') : (neg ? ' - ' : ' + ')) + unit + pw);
  }
  return parts.join('') || '0';
}

module.exports = { sylvester, det, critValuePoly, irreducibleModP, rabinIrreducibleModP, certifyMinPoly, fmt };

if (require.main === module) {
  const A = process.argv.slice(2).map(Number);
  if (!A.length) { console.error('usage: node instruments/trigmin/minpoly.js 1 2 4 5 6'); process.exit(1); }
  const EN = require('../lambda4/engine.js');
  const enc = EN.targetEnclosure(A, 1e-13);
  const r = certifyMinPoly(A, enc);
  console.log('A = {' + A.join(',') + '}');
  console.log('P_A(c) = ' + fmt(r.P, 'c'));
  console.log('L in [' + Q.toDouble(enc.lo) + ', ' + Q.toDouble(enc.hi) + ']');
  console.log('endpoints: P(1) = ' + r.endpoints.at1 + ', P(-1) = ' + r.endpoints.atMinus1 + '  interior: ' + r.interior);
  console.log('R(y) = ' + fmt(r.R, 'y') + '   [degree ' + r.degree + ']');
  console.log('sign change: ' + r.signChange + '   roots in enclosure: ' + r.rootsInEnclosure);
  console.log('irreducible: ' + r.irreducible + (r.prime ? ' (mod ' + r.prime + ')' : ''));
  console.log('S(lambda) = ' + fmt(r.S, 'y') + '   [lambda = -L]');
  console.log(r.ok ? 'CERTIFIED: the minimal polynomial' : 'REFUSED: a step did not hold');
}
