/* f2scheme.js — bilinear schemes over F2, as bitmasks.

   The generation front needs three things from a representation, and this
   file is the one place that knows all three:

     the OBJECT      a rank-r decomposition, as r triples of F2 vectors
     the FITNESS     how far it is from being a decomposition, exactly
     the MOVES       flips, splits and reductions — what a proposer applies

   NONE OF THE THREE IS ABOUT MATRICES. A target is a triple of dimensions
   and a list of the (a,b,c) it sets to 1, and everything below is written
   against that and nothing else — so the same walk, the same exact residual
   and the same moves work on matrix multiplication and on polynomial
   products without a line changing. The targets live in `targets.js`.

   Over F2 a vector is a bit pattern, so a term is three integers and the
   whole scheme is 3r integers. The tensor identity is then an exact XOR
   computation over machine words: no floats, no rationals, no rounding, and
   fast enough that a proposer can be graded thousands of times a second.

   THE FITNESS IS THE RESIDUAL. `residual()` returns the exact number of
   tensor equations the scheme gets wrong. Zero means the scheme IS an
   algorithm for the target; anything else is a distance, and it is an
   integer, not a score. That is the graduated-but-exact signal the whole
   design turns on: a proposer cannot argue with it and cannot game it,
   because it is arithmetic over the object the proposer submitted.

   MIT. Part of cert-machine. */
'use strict';

/* ---- the target ----------------------------------------------------------
   A target is { name, statement, na, nb, nc, triples } — see targets.js,
   which is the one definition of every family the front attacks. This file
   only ever asks a target two things: how big it is, and which (a,b,c) it
   sets to 1. */

/** the target as a Set of packed keys, for O(1) membership */
function targetSet(target) {
  const s = new Set();
  for (const [a, b, c] of target.triples) s.add((a * target.nb + b) * target.nc + c);
  return s;
}

/* ---- the residual: the exact fitness --------------------------------------
   Expand sum_t u_t (x) v_t (x) w_t over F2 and compare with the target,
   equation by equation. The count of disagreements is the distance.

   A scheme is a list of [u, v, w] bitmask triples. */
function residual(scheme, target) {
  const { na, nb, nc } = target;
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
  const T = targetSet(target);
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

const isDecomposition = (scheme, target) => residual(scheme, target).violations === 0;

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

/** PLUS. The rank-INCREASING move: one term becomes two.

      u(x)v(x)w  =  u(x)v(x)w1 + u(x)v(x)w2      whenever w1 + w2 = w

    over F2, and likewise in the other two positions. It costs a unit of rank
    and buys nothing directly, which is exactly why it is here: a walk that
    can only flip and reduce cannot leave a local minimum, and the low-rank
    regions of the flip graph are not reachable from every starting point
    without first going UP. (Kauers & Moosbauer's plus transition.) This was
    not a guess — the walk was measured without it first, and it reproduced
    the published rank for the full products P2..P4 and then stalled above it
    from P5 on; the calibration ladder in instruments/bilinear/battery.js is
    what says whether it is still stalling today.

    `mask` is the new factor at `pos`; the second term takes the complement.
    Both must be nonzero or the move is not a split, so a caller that hands
    over 0 or the original factor gets its scheme back unchanged. */
function split(scheme, i, pos, mask) {
  const orig = scheme[i][pos];
  if (mask === 0 || mask === orig) return scheme;
  const s = scheme.map(t => t.slice());
  const other = s[i].slice();
  s[i][pos] = mask;
  other[pos] = orig ^ mask;
  s.push(other);
  return s;
}

/** the width of each factor position, for a caller drawing a random mask */
const widths = (target) => [target.na, target.nb, target.nc];

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
/** the definition itself, as an algorithm: one product per 1 in the target.
    Always correct, never fast — the rank every search has to beat. */
function naive(target) {
  return target.triples.map(([a, b, c]) => [1 << a, 1 << b, 1 << c]);
}

/* ---- handing the object to the certifier ----------------------------------
   A certifier decides U/V/W column form, so a scheme is converted to it. The
   generation loop screens with residual() and CERTIFIES with an instrument —
   the same split the engine already uses: screen in fast arithmetic, decide
   with the authority. `target` names which tensor the claim is against, so
   the certifier can rebuild it independently rather than take our word.

   For a matrix-multiplication target the extra `dims` field is filled in,
   because instruments/strassen asks for it by name. */
function toClaim(scheme, target, id) {
  const col = (size, get) => Array.from({ length: size }, (_, row) =>
    scheme.map(t => (get(t) >> row) & 1));
  const claim = {
    id: id || 'generated',
    target: target.name,
    ring: 'F2',
    rank: scheme.length,
    U: col(target.na, t => t[0]),
    V: col(target.nb, t => t[1]),
    W: col(target.nc, t => t[2])
  };
  if (/^<\d+,\d+,\d+>$/.test(target.name)) claim.dims = target.name.slice(1, -1).split(',').map(Number);
  return claim;
}

const key = (scheme) => scheme.map(t => t.join(':')).sort().join('|');

module.exports = {
  targetSet, residual, isDecomposition,
  flipSites, flip, split, widths, reduce, naive, toClaim, key
};
