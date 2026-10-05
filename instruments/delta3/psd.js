/* psd.js — exact proofs that a symmetric rational matrix is positive semidefinite,
   and exact witnesses when it is not.
   instruments/delta3 · cert-machine

   The method (floats PROPOSE, integers DECIDE):
     1. Exact preliminaries. Symmetry is checked exactly. A row that is exactly zero is
        dropped (A ⪰ 0 iff the rest is). A negative diagonal entry, or a zero diagonal
        entry with a nonzero row, is an exact proof of NOT PSD.
     2. Exact dyadic rescaling A' = DAD, D = diag(2^−k_i) with 2^−2k_i ≈ 1/A_ii, so the
        float factorisation sees unit-scale entries. D is invertible, so A ⪰ 0 ⟺ A' ⪰ 0.
     3. Float Cholesky of A' − τI, for τ walking down from 1 by halves until it succeeds.
        Its factor, rounded to the dyadic lattice 2^−T, is a matrix L̃ of exact rationals.
     4. The remainder E = A' − L̃L̃ᵀ is computed EXACTLY (clear denominators, BigInt) and
        accepted only if it is diagonally dominant with nonnegative diagonal:
        E_ii ≥ Σ_{j≠i} |E_ij|. Gershgorin then gives E ⪰ 0, and A' = L̃L̃ᵀ + E ⪰ 0.
        Nothing about L̃ needs to be right — any real matrix makes L̃L̃ᵀ ⪰ 0 — so the float
        step can only cost completeness, never soundness.
     5. If no τ yields a dominated remainder, the float LDLᵀ at τ = 0 is run to its first
        nonpositive pivot k and turned into a vector v = (−A11⁻¹a_k, 1, 0, …); vᵀA'v is
        evaluated exactly, and a negative value is an exact proof of NOT PSD.
     6. Otherwise fraction-free (Bareiss) elimination decides exactly: every leading
        principal minor > 0 proves positive definiteness (Sylvester); a negative minor
        after positive ones proves NOT PSD; a zero minor leaves it UNDECIDED, which the
        caller turns into a refusal.

   MIT licensed. Part of cert-machine. */
'use strict';

const Q = require('../interval/rational.js');

const babs = x => (x < 0n ? -x : x);
function lcm(a, b) { return a / Q.gcd(a, b) * b; }

/* float Cholesky of F − τI; returns {L} or {fail: k, L} (L filled up to row k) */
function cholesky(F, tau) {
  const n = F.length;
  const L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = F[i][j] - (i === j ? tau : 0);
      const Li = L[i], Lj = L[j];
      for (let k = 0; k < j; k++) s -= Li[k] * Lj[k];
      if (i === j) {
        if (!(s > 0)) return { fail: i, L, schur: s };
        Li[i] = Math.sqrt(s);
      } else Li[j] = s / Lj[j];
    }
  }
  return { L };
}

/* exact remainder test for a float factor L: is Z·2^(2T)/den − L̃L̃ᵀ diagonally dominant?
   Z is the integer matrix A'·den. Returns the smallest row margin as a rational (≥ 0 ok). */
function remainderDominated(Z, den, L, T) {
  const n = Z.length;
  const S = 2 ** T;
  const Lz = L.map(row => Array.from(row, x => BigInt(Math.round(x * S))));
  const scale = 1n << BigInt(2 * T);
  let worst = null;
  const E = Array.from({ length: n }, () => new Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let g = 0n;
      const Li = Lz[i], Lj = Lz[j];
      for (let k = 0; k <= j; k++) if (Li[k] !== 0n && Lj[k] !== 0n) g += Li[k] * Lj[k];
      E[i][j] = E[j][i] = Z[i][j] * scale - g * den;     /* = (A' − L̃L̃ᵀ)·den·2^(2T) */
    }
  }
  for (let i = 0; i < n; i++) {
    let off = 0n;
    for (let j = 0; j < n; j++) if (j !== i) off += babs(E[i][j]);
    const margin = E[i][i] - off;
    if (worst === null || margin < worst) worst = margin;
  }
  return Q.R(worst, den * scale);
}

/* vᵀA'v exactly, v dyadic from floats */
function quadForm(Z, den, v) {
  const T = 80, S = 2 ** T;
  const vz = v.map(x => BigInt(Math.round(x * S)));
  let acc = 0n;
  const n = Z.length;
  for (let i = 0; i < n; i++) {
    if (vz[i] === 0n) continue;
    let row = 0n;
    for (let j = 0; j < n; j++) if (vz[j] !== 0n) row += Z[i][j] * vz[j];
    acc += vz[i] * row;
  }
  return Q.R(acc, den * (1n << BigInt(2 * T)));
}

/* Bareiss: leading principal minors of the integer matrix Z, exactly */
function bareiss(Z) {
  const n = Z.length;
  const A = Z.map(r => r.slice());
  let prev = 1n;
  for (let k = 0; k < n; k++) {
    const piv = A[k][k];
    if (piv <= 0n) return { k, minorSign: piv < 0n ? -1 : 0 };
    for (let i = k + 1; i < n; i++) {
      for (let j = k + 1; j < n; j++) A[i][j] = (piv * A[i][j] - A[i][k] * A[k][j]) / prev;
    }
    prev = piv;
  }
  return { k: n, minorSign: 1 };
}

function provePSD(A0, opts) {
  opts = opts || {};
  const n0 = A0.length;
  for (let i = 0; i < n0; i++) for (let j = 0; j < i; j++)
    if (Q.cmp(A0[i][j], A0[j][i]) !== 0) return { verdict: 'UNDECIDED', why: 'matrix not symmetric at (' + i + ',' + j + ')' };
  /* 1. exact preliminaries */
  const keep = [];
  for (let i = 0; i < n0; i++) {
    const zeroRow = A0[i].every(x => Q.sign(x) === 0);
    if (zeroRow) continue;
    const s = Q.sign(A0[i][i]);
    if (s < 0) return { verdict: 'NOT_PSD', why: 'negative diagonal entry at ' + i, witness: Q.toString(A0[i][i]) };
    if (s === 0) return { verdict: 'NOT_PSD', why: 'zero diagonal entry with a nonzero row at ' + i };
    keep.push(i);
  }
  const n = keep.length;
  if (n === 0) return { verdict: 'PSD', method: 'zero matrix' };
  /* 2. exact dyadic rescaling */
  const sh = keep.map(i => Math.round(Math.log2(Q.toDouble(A0[i][i])) / 2));
  const A = keep.map((i, a) => keep.map((j, b) => {
    const e = -(sh[a] + sh[b]);
    const x = A0[i][j];
    return e >= 0 ? Q.R(x.n << BigInt(e), x.d) : Q.R(x.n, x.d << BigInt(-e));
  }));
  let den = 1n;
  for (const row of A) for (const x of row) if (x.d !== 1n) den = lcm(den, x.d);
  const Z = A.map(row => row.map(x => x.n * (den / x.d)));
  const F = A.map(row => row.map(x => Q.toDouble(x)));
  /* 3–4. τ ladder with exact remainder checks */
  let firstOk = -1;
  for (let k = 1; k <= 120; k++) {
    const tau = 2 ** -k;
    const ch = cholesky(F, tau);
    if (ch.fail !== undefined) { if (firstOk >= 0 && k > firstOk + 8) break; continue; }
    if (firstOk < 0) firstOk = k;
    const T = Math.min(1000, k + 60);
    const margin = remainderDominated(Z, den, ch.L, T);
    if (Q.sign(margin) >= 0) {
      return { verdict: 'PSD', method: 'dyadic Cholesky of A − 2^−' + k + 'I (rows rescaled by powers of 2), remainder diagonally dominant', tauExp: k, minMargin: margin, dim: n, dropped: n0 - n, floatFactorFound: true };
    }
    if (k > firstOk + 8) break;
  }
  const floatFactorFound = firstOk >= 0;               /* reported so the battery can show its float-blind control bites */
  /* 5. exact witness of failure */
  const ch0 = cholesky(F, 0);
  if (ch0.fail !== undefined) {
    const k = ch0.fail, L = ch0.L;
    const l = Array.from(L[k].slice(0, k));               /* l = L11⁻¹ a_k */
    const x = new Array(k).fill(0);                      /* x = L11⁻ᵀ l */
    for (let i = k - 1; i >= 0; i--) {
      let s = l[i];
      for (let j = i + 1; j < k; j++) s -= L[j][i] * x[j];
      x[i] = s / L[i][i];
    }
    const v = new Array(n).fill(0);
    for (let i = 0; i < k; i++) v[i] = -x[i];
    v[k] = 1;
    const val = quadForm(Z, den, v);
    if (Q.sign(val) < 0) return { verdict: 'NOT_PSD', why: 'exact witness vᵀAv < 0 at pivot ' + keep[k] + ' (rescaled value ' + Q.toDouble(val).toExponential(4) + ')', witness: Q.toDouble(val), floatFactorFound };
  }
  if (opts.noBareiss) return { verdict: 'UNDECIDED', why: 'no dominated remainder and no negative witness', floatFactorFound };
  /* 6. exact elimination */
  const t0 = Date.now();
  const bz = bareiss(Z);
  const secs = (Date.now() - t0) / 1000;
  if (bz.minorSign > 0) return { verdict: 'PSD', method: 'Bareiss: all leading principal minors > 0 (' + secs + ' s)', dim: n, floatFactorFound };
  if (bz.minorSign < 0) return { verdict: 'NOT_PSD', why: 'leading minor ' + (bz.k + 1) + ' is negative after positive ones (Bareiss)', floatFactorFound };
  return { verdict: 'UNDECIDED', why: 'leading minor ' + (bz.k + 1) + ' is zero; positive semidefiniteness not decided', floatFactorFound };
}

module.exports = { provePSD, cholesky, bareiss };
