/* tensor.js — exact audits of fast matrix-multiplication algorithms.

   THE CLAIM SHAPE. A rank-r algorithm for multiplying n×m by m×p matrices
   is three integer matrices U (nm×r), V (mp×r), W (np×r) over a ring R:
   compute L_t = Σ_i U[i][t]·A_i and R_t = Σ_j V[j][t]·B_j, then every
   entry of C = A·B is C_k = Σ_t W[k][t]·L_t·R_t. That program is correct
   for ALL matrices iff one finite identity holds — for every A-index
   (a,b), B-index (b',c) and C-index k:

       Σ_t  U[ab][t] · V[b'c][t] · W[k][t]  =  [b = b'] · [k = index(a,c)]

   — nm·mp·np equations, each an exact integer sum. This instrument decides
   them all, over Q (exact integers) or over F2 (the same sums mod 2, for
   algorithms that only claim characteristic 2, like AlphaTensor's rank-47
   4×4). The C-index layout (row-major (a,c) or the transposed (c,a)) is a
   publishing convention, not mathematics: the audit tries both and RECORDS
   which one the identity holds under; failing both is REFUTED.

   EXACTNESS WITHOUT BigInt: every published coefficient here is a small
   integer, so each equation's sum is bounded by r·maxU·maxV·maxW. The
   audit verifies that bound is below 2^53 BEFORE summing in doubles —
   integers below 2^53 are exact in IEEE754, so the fast path is exact, and
   the battery cross-checks one full audit against a BigInt evaluation to
   keep that argument honest. Anything past the bound is refused, never
   approximated.

   COMPOSITION, the generator: decompositions Kronecker-multiply —
   ⟨n1,m1,p1⟩ rank r1 times ⟨n2,m2,p2⟩ rank r2 gives ⟨n1n2, m1m2, p1p2⟩
   rank r1·r2. compose() builds it exactly; the audit then re-decides the
   result from scratch (Strassen⊗Strassen = the rank-49 4×4 baseline that
   AlphaTensor's 47 and AlphaEvolve's 48 beat).

   MIT licensed. Part of cert-machine. */
'use strict';

const EXACT = 9007199254740992;          /* 2^53 */

const rankOf = (U) => (U.length ? U[0].length : 0);

/* the target tensor entry for layout L: 'AC' means C-index k = a*p + c */
function target(dims, layout, ab, bc, k) {
  const [n, m, p] = dims;
  const a = Math.floor(ab / m), b = ab % m;
  const b2 = Math.floor(bc / p), c = bc % p;
  if (b !== b2) return 0;
  const kk = layout === 'AC' ? a * p + c : c * n + a;
  return k === kk ? 1 : 0;
}

/* one full identity check for a fixed layout; exact by the bound argument */
function checkLayout(dims, U, V, W, ring, layout) {
  const [n, m, p] = dims;
  const r = rankOf(U);
  let maxU = 0, maxV = 0, maxW = 0;
  for (const row of U) for (const x of row) maxU = Math.max(maxU, Math.abs(x));
  for (const row of V) for (const x of row) maxV = Math.max(maxV, Math.abs(x));
  for (const row of W) for (const x of row) maxW = Math.max(maxW, Math.abs(x));
  if (r * maxU * maxV * maxW + 1 >= EXACT)
    return { ok: false, refused: true, why: 'coefficient bound ' + r * maxU * maxV * maxW + ' too large for exact double summation' };
  const uv = new Array(r);
  for (let ab = 0; ab < n * m; ab++) {
    for (let bc = 0; bc < m * p; bc++) {
      for (let t = 0; t < r; t++) uv[t] = U[ab][t] * V[bc][t];
      for (let k = 0; k < n * p; k++) {
        let s = 0;
        const Wk = W[k];
        for (let t = 0; t < r; t++) s += uv[t] * Wk[t];
        const want = target(dims, layout, ab, bc, k);
        const okEq = ring === 'F2' ? (((s - want) % 2) === 0) : (s === want);
        if (!okEq) return { ok: false, why: 'equation (ab=' + ab + ', bc=' + bc + ', k=' + k + '): sum ' + s + ', target ' + want + (ring === 'F2' ? ' (mod 2)' : '') };
      }
    }
  }
  return { ok: true };
}

/* audit(claim) — claim: { dims: [n,m,p], rank, U, V, W, ring: 'Q'|'F2' }.
   VERIFIED iff the identity holds under some C-layout over the claimed
   ring; the layout is recorded in the certificate, never assumed. */
function audit(claim) {
  const { dims, U, V, W } = claim;
  const ring = claim.ring || 'Q';
  const [n, m, p] = dims;
  const r = rankOf(U);
  if (claim.rank !== undefined && claim.rank !== r)
    return { verdict: 'REFUTED', why: 'claimed rank ' + claim.rank + ' but the factors have ' + r + ' columns' };
  if (U.length !== n * m || V.length !== m * p || W.length !== n * p)
    return { verdict: 'REFUTED', why: 'factor shapes do not match dims <' + dims + '>' };
  if (![...U, ...V, ...W].every(row => row.length === r && row.every(Number.isInteger)))
    return { verdict: 'REFUTED', why: 'factors are not integer matrices of uniform rank' };
  for (const layout of ['AC', 'CA']) {
    const c = checkLayout(dims, U, V, W, ring, layout);
    if (c.ok) return { verdict: 'VERIFIED', layout, rank: r, ring,
      equations: n * m * m * p * n * p, naive: n * m * p };
    if (c.refused) return { verdict: 'REFUSED', why: c.why };
    if (layout === 'CA') return { verdict: 'REFUTED', why: 'identity fails under BOTH C-layouts; last failure: ' + c.why };
  }
}

/* the same audit, entirely in BigInt — the battery's cross-check of the
   exact-double bound argument, never the production path */
function auditBig(claim) {
  const { dims, U, V, W } = claim;
  const ring = claim.ring || 'Q';
  const [n, m, p] = dims;
  const r = rankOf(U);
  for (const layout of ['AC', 'CA']) {
    let ok = true;
    for (let ab = 0; ab < n * m && ok; ab++) for (let bc = 0; bc < m * p && ok; bc++) for (let k = 0; k < n * p && ok; k++) {
      let s = 0n;
      for (let t = 0; t < r; t++) s += BigInt(U[ab][t]) * BigInt(V[bc][t]) * BigInt(W[k][t]);
      const want = BigInt(target(dims, layout, ab, bc, k));
      if (ring === 'F2' ? ((s - want) % 2n !== 0n) : (s !== want)) ok = false;
    }
    if (ok) return { verdict: 'VERIFIED', layout };
  }
  return { verdict: 'REFUTED' };
}

/* ---- generators ----------------------------------------------------------- */
/* naive rank-nmp algorithm: one product per C-entry contribution */
function naive(n, m, p) {
  const r = n * m * p;
  const U = Array.from({ length: n * m }, () => new Array(r).fill(0));
  const V = Array.from({ length: m * p }, () => new Array(r).fill(0));
  const W = Array.from({ length: n * p }, () => new Array(r).fill(0));
  let t = 0;
  for (let a = 0; a < n; a++) for (let b = 0; b < m; b++) for (let c = 0; c < p; c++) {
    U[a * m + b][t] = 1; V[b * p + c][t] = 1; W[a * p + c][t] = 1; t++;
  }
  return { dims: [n, m, p], rank: r, U, V, W, ring: 'Q' };
}

/* Kronecker composition of two decompositions (both must certify under the
   SAME layout; the composite inherits it) */
function compose(d1, d2) {
  const [n1, m1, p1] = d1.dims, [n2, m2, p2] = d2.dims;
  const r1 = rankOf(d1.U), r2 = rankOf(d2.U);
  const mix = (M1, M2, R1, C1, R2, C2) => {
    /* rows indexed by ((x1,y1),(x2,y2)) -> (x1*R2+x2)*(C1*C2) + (y1*C2+y2) */
    const out = Array.from({ length: R1 * R2 * C1 * C2 }, () => new Array(r1 * r2).fill(0));
    for (let x1 = 0; x1 < R1; x1++) for (let y1 = 0; y1 < C1; y1++)
      for (let x2 = 0; x2 < R2; x2++) for (let y2 = 0; y2 < C2; y2++) {
        const row = (x1 * R2 + x2) * (C1 * C2) + (y1 * C2 + y2);
        for (let t1 = 0; t1 < r1; t1++) for (let t2 = 0; t2 < r2; t2++)
          out[row][t1 * r2 + t2] = M1[x1 * C1 + y1][t1] * M2[x2 * C2 + y2][t2];
      }
    return out;
  };
  return {
    dims: [n1 * n2, m1 * m2, p1 * p2], rank: r1 * r2,
    U: mix(d1.U, d2.U, n1, m1, n2, m2),
    V: mix(d1.V, d2.V, m1, p1, m2, p2),
    W: mix(d1.W, d2.W, n1, p1, n2, p2),
    ring: d1.ring === 'F2' || d2.ring === 'F2' ? 'F2' : 'Q'
  };
}

/* Strassen 1969 — the calibration case with the textbook answer */
function strassen() {
  return {
    dims: [2, 2, 2], rank: 7, ring: 'Q',
    U: [ /* rows: a11 a12 a21 a22; columns: M1..M7 */
      [1, 0, 1, 0, 1, -1, 0],
      [0, 0, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 0, 1, 0],
      [1, 1, 0, 1, 0, 0, -1]
    ],
    V: [ /* rows: b11 b12 b21 b22 */
      [1, 1, 0, -1, 0, 1, 0],
      [0, 0, 1, 0, 0, 1, 0],
      [0, 0, 0, 1, 0, 0, 1],
      [1, 0, -1, 0, 1, 0, 1]
    ],
    W: [ /* rows: c11 c12 c21 c22 (layout AC) */
      [1, 0, 0, 1, -1, 0, 1],
      [0, 0, 1, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 0, 0],
      [1, -1, 1, 0, 0, 1, 0]
    ]
  };
}

module.exports = { audit, auditBig, naive, compose, strassen, rankOf, target };
