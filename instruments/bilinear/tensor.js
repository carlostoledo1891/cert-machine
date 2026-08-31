/* tensor.js — exact audits of bilinear algorithms over F2.

   THE CLAIM SHAPE. A rank-r bilinear algorithm for a target tensor T with
   dimensions na x nb x nc is three 0/1 matrices U (na x r), V (nb x r),
   W (nc x r) over F2: compute L_t = sum_a U[a][t]·A_a and R_t = sum_b
   V[b][t]·B_b, then every output coordinate is C_c = sum_t W[c][t]·L_t·R_t.
   That program is correct for ALL inputs iff one finite identity holds —
   for every (a, b, c):

       sum_t  U[a][t] · V[b][t] · W[c][t]  =  T[a][b][c]     (mod 2)

   na·nb·nc equations, each an exact sum of bits. This instrument decides
   them all. There is no float anywhere in it and no bound argument to make:
   over F2 a sum is a parity, so the arithmetic is exact by construction.

   WHY THIS EXISTS BESIDE instruments/strassen. That instrument decides one
   tensor family — matrix multiplication — over Z and over F2, with integer
   coefficients and a bound argument. This one decides ANY target over F2,
   which is what the generation front needs the moment it points at
   polynomial products. The two overlap on <n,m,p> over F2, and the battery
   USES that overlap: Strassen's rank 7 is put through both, and they must
   agree. An instrument that agrees with an older, independently written
   instrument on the case they share is worth more than either alone.

   THE TARGET IS REBUILT HERE, NOT IMPORTED. A certifier that took the
   claimant's word for what tensor was being decomposed would certify
   nothing: any scheme decomposes some tensor. So this file constructs T
   from the NAME of the target, by literal arithmetic — actual polynomial
   multiplication with a convolution and a reduction step, actual matrix
   multiplication over indices — never by importing the index formulas the
   search uses. The battery asserts the two derivations agree. That is the
   one honest form of duplication: two independent routes to the same
   object, checked against each other, rather than one rule copied.

   MIT. Part of cert-machine. */
'use strict';

/* ---- rebuilding the target, independently --------------------------------
   Everything below derives the tensor from what the object IS, not from a
   closed-form index expression. `basis(i)` is the polynomial X^i; the
   product of two basis polynomials is computed by convolution and then
   folded by the family's own rule. */

/** convolution of two F2 coefficient arrays — the definition of a product */
function convolve(f, g) {
  const out = new Uint8Array(f.length + g.length - 1);
  for (let i = 0; i < f.length; i++) {
    if (!f[i]) continue;
    for (let j = 0; j < g.length; j++) if (g[j]) out[i + j] ^= 1;
  }
  return out;
}

/** X^i as a coefficient array of length n */
function basis(i, n) { const v = new Uint8Array(n); v[i] = 1; return v; }

/** reduce an F2 coefficient array modulo a monic modulus, by long division */
function reduceMod(f, mod) {
  const a = Uint8Array.from(f);
  const d = mod.length - 1;                 /* deg(mod); mod[d] must be 1 */
  for (let i = a.length - 1; i >= d; i--) {
    if (!a[i]) continue;
    for (let k = 0; k <= d; k++) a[i - d + k] ^= mod[k];
  }
  return a.slice(0, d);
}

/**
 * target(name) -> { name, na, nb, nc, T }  with T a Uint8Array(na*nb*nc)
 *
 * Accepts the same names the search uses — '<n,m,p>', 'P<n>', 'T<n>',
 * 'C<n>', 'C<n>-' — and refuses anything else rather than guess.
 */
function target(name) {
  const mm = /^<(\d+),(\d+),(\d+)>$/.exec(String(name));
  if (mm) {
    const [n, m, p] = mm.slice(1).map(Number);
    const na = n * m, nb = m * p, nc = p * n;
    const T = new Uint8Array(na * nb * nc);
    /* the identity C[i][k] = sum_j A[i][j] B[j][k], written out: the
       coefficient of a_{ij} b_{j'k} in C_{ki} is 1 exactly when j = j'. */
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      for (let jp = 0; jp < m; jp++) for (let k = 0; k < p; k++) {
        if (j !== jp) continue;
        const a = i * m + j, b = jp * p + k, c = k * n + i;
        T[(a * nb + b) * nc + c] ^= 1;
      }
    }
    return { name, na, nb, nc, T };
  }

  const pm = /^([PTC])(\d+)(-?)$/i.exec(String(name));
  if (!pm) throw new Error('unrecognised target "' + name + '"');
  const fam = pm[1].toUpperCase(), n = Number(pm[2]), nega = !!pm[3];
  if (nega && fam !== 'C') throw new Error('only the cyclic family has a negacyclic variant');
  if (n < 1) throw new Error('target size must be at least 1');

  /* how each family folds the raw convolution X^i · X^j, of length 2n-1 */
  let nc, fold;
  if (fam === 'P') {
    nc = 2 * n - 1;
    fold = (v) => v;                                    /* nothing is folded */
  } else if (fam === 'T') {
    nc = n;
    fold = (v) => v.slice(0, n);                        /* the low n survive */
  } else {
    nc = n;
    /* X^n - 1 and X^n + 1 are the same polynomial in characteristic 2, so
       the cyclic and negacyclic targets coincide over F2 — the modulus is
       built the same way for both and the caller is not misled into
       thinking a separate search exists. */
    const mod = new Uint8Array(n + 1); mod[0] = 1; mod[n] = 1;
    fold = (v) => reduceMod(v, mod);
  }

  const T = new Uint8Array(n * n * nc);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const prod = fold(convolve(basis(i, n), basis(j, n)));
    for (let c = 0; c < nc; c++) if (prod[c]) T[(i * n + j) * nc + c] ^= 1;
  }
  return { name, na: n, nb: n, nc, T };
}

/* ---- the audit ------------------------------------------------------------ */

/** every coefficient of U/V/W must be a bit; a claim with anything else is
    not a claim about F2 and is refused rather than silently reduced */
function bits(M, rows, r, label) {
  if (!Array.isArray(M) || M.length !== rows) {
    return 'the ' + label + ' matrix has ' + (Array.isArray(M) ? M.length : 'no') + ' rows, the target needs ' + rows;
  }
  for (let i = 0; i < rows; i++) {
    if (!Array.isArray(M[i]) || M[i].length !== r) {
      return 'row ' + i + ' of ' + label + ' has ' + (Array.isArray(M[i]) ? M[i].length : 'no') + ' entries, the claimed rank is ' + r;
    }
    for (let t = 0; t < r; t++) if (M[i][t] !== 0 && M[i][t] !== 1) {
      return label + '[' + i + '][' + t + '] is ' + M[i][t] + ', which is not a bit';
    }
  }
  return null;
}

/**
 * audit(claim) -> { verdict, target, rank, equations, ring, why, first }
 *
 * VERIFIED  every equation holds
 * REFUTED   some equation fails — `first` names it and says what it needed
 * REFUSED   the claim is malformed, or is not about F2
 */
function audit(claim) {
  const ring = claim.ring || 'F2';
  if (ring !== 'F2') {
    return { verdict: 'REFUSED', target: claim.target, ring,
      why: 'this instrument decides F2 only; the claim says ' + ring };
  }
  let tg;
  try { tg = target(claim.target); }
  catch (e) { return { verdict: 'REFUSED', target: claim.target, ring, why: e.message }; }

  const { na, nb, nc, T } = tg;
  const r = claim.rank;
  if (!Number.isInteger(r) || r < 0) {
    return { verdict: 'REFUSED', target: claim.target, ring, why: 'the claimed rank is not a non-negative integer' };
  }
  for (const [M, rows, label] of [[claim.U, na, 'U'], [claim.V, nb, 'V'], [claim.W, nc, 'W']]) {
    const bad = bits(M, rows, r, label);
    if (bad) return { verdict: 'REFUSED', target: claim.target, ring, rank: r, why: bad };
  }

  const equations = na * nb * nc;
  let first = null, failures = 0;
  for (let a = 0; a < na; a++) for (let b = 0; b < nb; b++) for (let c = 0; c < nc; c++) {
    let s = 0;
    for (let t = 0; t < r; t++) s ^= claim.U[a][t] & claim.V[b][t] & claim.W[c][t];
    const want = T[(a * nb + b) * nc + c];
    if (s !== want) {
      failures++;
      if (!first) first = { a, b, c, got: s, want };
    }
  }
  if (failures) {
    return { verdict: 'REFUTED', target: claim.target, ring, rank: r, equations, failures, first,
      why: 'equation (a=' + first.a + ',b=' + first.b + ',c=' + first.c + ') sums to ' + first.got
        + ', the tensor requires ' + first.want + ' (' + failures + ' of ' + equations + ' fail)' };
  }
  return { verdict: 'VERIFIED', target: claim.target, ring, rank: r, equations, failures: 0, first: null, why: null };
}

/** the definition as an algorithm, in claim form — the rank to beat */
function naiveClaim(name) {
  const { na, nb, nc, T } = target(name);
  const terms = [];
  for (let a = 0; a < na; a++) for (let b = 0; b < nb; b++) for (let c = 0; c < nc; c++) {
    if (T[(a * nb + b) * nc + c]) terms.push([a, b, c]);
  }
  const col = (rows, which) => Array.from({ length: rows }, (_, i) => terms.map(t => (t[which] === i ? 1 : 0)));
  return { id: 'naive-' + name, target: name, ring: 'F2', rank: terms.length,
    U: col(na, 0), V: col(nb, 1), W: col(nc, 2) };
}

module.exports = { audit, target, naiveClaim, convolve, reduceMod, basis };
