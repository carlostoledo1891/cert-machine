/* f2scheme.js — matrix-multiplication schemes over F2, as bitmasks.

   The generation front needs three things from a representation, and this
   file is the one place that knows all three:

     the OBJECT      a rank-r decomposition, as r triples of F2 vectors
     the FITNESS     how far it is from being a decomposition, exactly
     the MOVES       flips and reductions — the operations a proposer applies

   Over F2 a vector is a bit pattern, so a term is three integers and the
   whole scheme is 3r integers. The tensor identity is then an exact XOR
   computation over machine words: no floats, no rationals, no rounding, and
   fast enough that a proposer can be graded thousands of times a second.

   THE FITNESS IS THE RESIDUAL. `residual()` returns the exact number of
   tensor equations the scheme gets wrong. Zero means it IS a matrix
   multiplication algorithm; anything else is a distance, and it is an
   integer, not a score. That is the graduated-but-exact signal the whole
   design turns on: a proposer cannot argue with it and cannot game it,
   because it is arithmetic over the object the proposer submitted.

   MIT. Part of cert-machine. */
'use strict';

/* ---- the target tensor ---------------------------------------------------
   <n,m,p>: C[i][k] = sum_j A[i][j] B[j][k]. The coefficient of
   a_{ij} b_{jk} c_{ki} is 1, everything else 0. Index layout is row-major
   throughout this file, and the CONVENTION IS STATED rather than assumed:
     a index = i*m + j      (n*m of them)
     b index = j*p + k      (m*p of them)
     c index = k*n + i      (p*n of them)  -- the transposed C layout
*/
function dimsOf(n, m, p) { return { na: n * m, nb: m * p, nc: p * n }; }

/** the set of (a,b,c) triples the target tensor sets to 1 */
function targetTriples(n, m, p) {
  const out = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) for (let k = 0; k < p; k++) {
    out.push([i * m + j, j * p + k, k * n + i]);
  }
  return out;
}

/** the target as a Set of packed keys, for O(1) membership */
function targetSet(n, m, p) {
  const { nb, nc } = dimsOf(n, m, p);
  const s = new Set();
  for (const [a, b, c] of targetTriples(n, m, p)) s.add((a * nb + b) * nc + c);
  return s;
}

/* ---- the residual: the exact fitness --------------------------------------
   Expand sum_t u_t (x) v_t (x) w_t over F2 and compare with the target,
   equation by equation. The count of disagreements is the distance.

   A scheme is a list of [u, v, w] bitmask triples. */
function residual(scheme, n, m, p) {
  const { na, nb, nc } = dimsOf(n, m, p);
  const acc = new Uint8Array(na * nb * nc);
  for (const [u, v, w] of scheme) {
    for (let a = 0; a < na; a++) {
      if (!((u >> a) & 1)) continue;
      for (let b = 0; b < nb; b++) {
        if (!((v >> b) & 1)) continue;
        const base = (a * nb + b) * nc;
        for (let c = 0; c < nc; c++) if ((w >> c) & 1) acc[base + c] ^= 1;
      }
    }
  }
  const T = targetSet(n, m, p);
  let bad = 0, first = null;
  for (let a = 0; a < na; a++) for (let b = 0; b < nb; b++) for (let c = 0; c < nc; c++) {
    const idx = (a * nb + b) * nc + c;
    const want = T.has(idx) ? 1 : 0;
    if (acc[idx] !== want) {
      bad++;
      /* the MECHANISM a proposer is handed back: which equation, what the
         scheme produced, what the tensor requires. Not "wrong" — repairable. */
      if (!first) first = { a, b, c, got: acc[idx], want };
    }
  }
  return { violations: bad, equations: na * nb * nc, first };
}

const isDecomposition = (scheme, n, m, p) => residual(scheme, n, m, p).violations === 0;

/* ---- the moves -----------------------------------------------------------
   FLIP. Two terms sharing one factor can be rewritten, keeping the tensor
   they sum to and keeping the rank:

     u(x)v1(x)w1 + u(x)v2(x)w2  =  u(x)(v1+v2)(x)w1 + u(x)v2(x)(w1+w2)

   over F2, because the cross term u(x)v2(x)w1 appears twice and cancels.
   The same identity holds in the other two positions by symmetry. A flip
   changes nothing about correctness and everything about what reductions
   become available — which is why a random walk on flips finds shorter
   schemes at all. (Kauers & Moosbauer's flip graph, in bitmask form.)

   REDUCE. Two terms sharing TWO factors merge, and the rank drops:

     u(x)v(x)w1 + u(x)v(x)w2  =  u(x)v(x)(w1+w2)

   and if w1+w2 = 0 the term vanishes entirely and the rank drops by two. */

/** every (i, j, position) where terms i and j share the factor at `position` */
function flipSites(scheme) {
  const out = [];
  for (let i = 0; i < scheme.length; i++) {
    for (let j = 0; j < scheme.length; j++) {
      if (i === j) continue;
      for (let pos = 0; pos < 3; pos++) if (scheme[i][pos] === scheme[j][pos]) out.push([i, j, pos]);
    }
  }
  return out;
}

/** apply one flip; returns a NEW scheme, never mutates */
function flip(scheme, i, j, pos) {
  const s = scheme.map(t => t.slice());
  const [x, y] = [(pos + 1) % 3, (pos + 2) % 3];
  /* term i keeps its `pos` factor, takes the XOR at x, keeps its own at y;
     term j keeps its `pos` and x factors, takes the XOR at y */
  const iy = s[i][y];
  s[i][x] = s[i][x] ^ s[j][x];
  s[j][y] = s[j][y] ^ iy;
  return s;
}

/** drop zero terms and merge any pair sharing two factors, repeatedly */
function reduce(scheme) {
  let s = scheme.filter(([u, v, w]) => u !== 0 && v !== 0 && w !== 0);
  let changed = true;
  while (changed) {
    changed = false;
    outer:
    for (let i = 0; i < s.length; i++) {
      for (let j = i + 1; j < s.length; j++) {
        for (let pos = 0; pos < 3; pos++) {
          const [x, y] = [(pos + 1) % 3, (pos + 2) % 3];
          if (s[i][x] === s[j][x] && s[i][y] === s[j][y]) {
            const merged = s[i].slice();
            merged[pos] = s[i][pos] ^ s[j][pos];
            const rest = s.filter((_, k) => k !== i && k !== j);
            s = merged[pos] === 0 ? rest : rest.concat([merged]);
            changed = true;
            break outer;
          }
        }
      }
    }
    s = s.filter(([u, v, w]) => u !== 0 && v !== 0 && w !== 0);
  }
  return s;
}

/* ---- seeds ---------------------------------------------------------------- */
/** the naive rank-nmp algorithm: one product per (i,j,k) */
function naive(n, m, p) {
  return targetTriples(n, m, p).map(([a, b, c]) => [1 << a, 1 << b, 1 << c]);
}

/* ---- handing the object to the certifier ----------------------------------
   instruments/strassen decides integer factor matrices, so a scheme is
   converted to U/V/W column form. The generation loop screens with
   residual() and CERTIFIES with the instrument — the same split the engine
   already uses, screen in fast arithmetic, decide with the authority. */
function toClaim(scheme, n, m, p, id) {
  const { na, nb, nc } = dimsOf(n, m, p);
  const col = (size, get) => Array.from({ length: size }, (_, row) =>
    scheme.map(t => (get(t) >> row) & 1));
  return {
    id: id || 'generated',
    dims: [n, m, p],
    ring: 'F2',
    rank: scheme.length,
    U: col(na, t => t[0]),
    V: col(nb, t => t[1]),
    W: col(nc, t => t[2])
  };
}

const key = (scheme) => scheme.map(t => t.join(':')).sort().join('|');

module.exports = {
  dimsOf, targetTriples, targetSet, residual, isDecomposition,
  flipSites, flip, reduce, naive, toClaim, key
};
