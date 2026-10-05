/* model.js — the twelve-block colouring φ*, its kernel image g*, the first-order
   weight h = −φ*g*, and the exact areas of R = {(a,b) ∈ [0,1]² : a/2 ≤ b ≤ (1+a)/2}.
   instruments/delta3 · cert-machine

   Clean-room: everything here is derived from the mathematics in
   claimant/THEOREM-EXACT.md and CERT-FORMAT.md, not from the claimant's code.
   Every value with proof force is an exact rational (instruments/interval/rational.js)
   or an exact BigInt; nothing here ever rounds.

   Units. Every grid point used by the certificates is an integer x meaning x/1096
   (U = 1096 = 2·548), so φ*'s edges k/548 are the EVEN integers. Areas are carried as
   the integer 4u²·area, which is what the trapezoid rule produces on these lattices.

   MIT licensed. Part of cert-machine. */
'use strict';

const Q = require('../interval/rational.js');

const U = 1096;
/* PRS's twelve blocks in units of 1/548, colours alternating (+ − + − …). Q and h are
   both invariant under φ* → −φ*, so the starting colour carries no information. */
const BLOCKS = [28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28];
const EDGES = (() => { const e = [0]; for (const b of BLOCKS) e.push(e[e.length - 1] + 2 * b); return e; })();
const SIGNS = BLOCKS.map((_, k) => (k % 2 === 0 ? 1 : -1));
const r = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));

/* the block containing the open interval (p, q) (integers, units 1/U), or −1 when an
   edge of φ* lies strictly inside — then φ* has no constant sign on the cell */
function blockOf(p, q) {
  for (let k = 0; k < BLOCKS.length; k++) if (EDGES[k] <= p && q <= EDGES[k + 1]) return k;
  return -1;
}

/* Φ(t) = ∫_0^t φ*, t rational in [0,1]. Φ is linear between edges with slope ±1. */
const PHI_AT_EDGE = (() => { const v = [r(0)]; for (let k = 0; k < BLOCKS.length; k++) v.push(Q.add(v[k], r(SIGNS[k] * (EDGES[k + 1] - EDGES[k]), U))); return v; })();
function Phi(t) {
  if (Q.sign(t) < 0 || Q.cmp(t, r(1)) > 0) throw new Error('Phi: argument outside [0,1]');
  for (let k = 0; k < BLOCKS.length; k++) {
    const hiEdge = r(EDGES[k + 1], U);
    if (Q.cmp(t, hiEdge) <= 0) return Q.add(PHI_AT_EDGE[k], Q.mul(r(SIGNS[k]), Q.sub(t, r(EDGES[k], U))));
  }
  throw new Error('Phi: unreachable');
}

/* g*(a) = ½(∫_{a/2}^{(1+a)/2} φ* + ∫_{[2a−1,2a]∩[0,1]} φ*): the kernel of R symmetrised
   (THEOREM-EXACT §1; the two integrals are the b-section and the a-section of R). */
function gStar(a) {
  const half = r(1, 2), one = r(1), zero = r(0);
  const f1 = Q.sub(Phi(Q.mul(Q.add(one, a), half)), Phi(Q.mul(a, half)));
  const top = Q.cmp(Q.mul(r(2), a), one) < 0 ? Q.mul(r(2), a) : one;
  const bot = Q.cmp(Q.sub(Q.mul(r(2), a), one), zero) > 0 ? Q.sub(Q.mul(r(2), a), one) : zero;
  const f2 = Q.sub(Phi(top), Phi(bot));
  return Q.mul(half, Q.add(f1, f2));
}

/* Where g* can kink. Φ kinks only at edges e; each term of g* is Φ composed with one of
   a ↦ a/2, (1+a)/2, 2a, 2a−1, so it kinks only at preimages of edges — 2e, 2e−1, e/2,
   (1+e)/2 — plus a = 1/2 where the clipping to [0,1] switches. h = −φ*g* adds the edges
   themselves. If every candidate inside (0,1) is an integer in units 1/U, h is LINEAR on
   every [x, x+1]/U, and the 1097 node values determine h exactly. Returns the
   non-integral candidates (empty = proved). */
function kinkCandidatesOffLattice() {
  const bad = [];
  const cands = [r(U, 2)];                                 /* a = 1/2, in units */
  for (const e of EDGES) cands.push(r(2 * e), r(2 * e - U), r(e, 2), r(U + e, 2), r(e));
  for (const c of cands) if (Q.sign(c) > 0 && Q.cmp(c, r(U)) < 0 && c.d !== 1n) bad.push(Q.toString(c));
  return bad;
}

/* h at the lattice node x/U. At an interior edge φ* changes sign, so h is continuous
   there only if g*(e) = 0; that is checked (a discontinuity throws), never assumed. */
function hNode(x) {
  const g = gStar(r(x, U));
  const sL = x > 0 ? SIGNS[blockOf(x - 1, x)] : null;
  const sR = x < U ? SIGNS[blockOf(x, x + 1)] : null;
  if (sL !== null && sR !== null && sL !== sR) {
    if (Q.sign(g) !== 0) throw new Error('h is discontinuous at the edge ' + x + '/' + U + ' (g* = ' + Q.toString(g) + ')');
    return r(0);
  }
  return Q.mul(r(-(sL !== null ? sL : sR)), g);
}

let H_CACHE = null;
function hNodes() {
  if (!H_CACHE) { H_CACHE = []; for (let x = 0; x <= U; x++) H_CACHE.push(hNode(x)); }
  return H_CACHE;
}
/* h at any rational t, by the lattice interpolation that kinkCandidatesOffLattice proves */
function hAt(t) {
  const hn = hNodes();
  const x = t.n * BigInt(U) / t.d;                         /* floor(t·U) */
  const k = Number(x >= BigInt(U) ? BigInt(U - 1) : x);
  const frac = Q.sub(Q.mul(t, r(U)), r(k));
  return Q.add(hn[k], Q.mul(frac, Q.sub(hn[k + 1], hn[k])));
}

/* ∫_α^β h exactly (α ≤ β rational): split at lattice nodes, trapezoid on each linear piece */
function hIntegral(alpha, beta) {
  const pts = [alpha];
  const lo = alpha.n * BigInt(U) / alpha.d + 1n;
  for (let x = lo; Q.cmp(r(x, U), beta) < 0; x++) pts.push(r(x, U));
  pts.push(beta);
  let acc = r(0);
  for (let k = 0; k + 1 < pts.length; k++) {
    const len = Q.sub(pts[k + 1], pts[k]);
    if (Q.sign(len) <= 0) continue;
    acc = Q.add(acc, Q.mul(Q.mul(len, r(1, 2)), Q.add(hAt(pts[k]), hAt(pts[k + 1]))));
  }
  return acc;
}

/* ---- areas ----------------------------------------------------------------
   area4(p,q,s0,s1,u) = 4u²·area(R ∩ [p/u,q/u]×[s0/u,s1/u]) for BigInt p<q, s0<s1.
   For fixed a the section of R is b ∈ [a/2, (1+a)/2]; its overlap with [s0,s1] has
   doubled length D(a) = max(0, min(2s1, u+a) − max(2s0, a)), piecewise linear in a with
   kinks only at a ∈ {2s0, 2s1, 2s0−u, 2s1−u} (the max(0,·) clip switches exactly at
   a = 2s1 and a = 2s0−u, already listed). Between kinks the trapezoid rule is exact, and
   on the integer lattice every term is an integer: 4u²·area = Σ (D_k + D_{k+1})·Δa. */
function area4(p, q, s0, s1, u) {
  const D = a => { const top = 2n * s1 < u + a ? 2n * s1 : u + a; const bot = 2n * s0 > a ? 2n * s0 : a; return top > bot ? top - bot : 0n; };
  const cuts = [2n * s0, 2n * s1, 2n * s0 - u, 2n * s1 - u].filter(t => t > p && t < q).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  const pts = [p];
  for (const c of cuts) if (c !== pts[pts.length - 1]) pts.push(c);
  pts.push(q);
  let acc = 0n;
  for (let k = 0; k + 1 < pts.length; k++) acc += (D(pts[k]) + D(pts[k + 1])) * (pts[k + 1] - pts[k]);
  return acc;
}

/* An independent second route to the same number, used only as a cross-check: clip the
   rectangle by the two half-planes of R (Sutherland–Hodgman, exact rationals) and take
   the shoelace area. Returns 4u²·area as a rational (it must be an integer). */
function area4Clip(p, q, s0, s1, u) {
  let poly = [[p, s0], [q, s0], [q, s1], [p, s1]].map(([x, y]) => [r(x), r(y)]);
  const U2 = r(u);
  const halfPlanes = [
    ([x, y]) => Q.sub(Q.mul(r(2), y), x),                   /* 2b − a ≥ 0 */
    ([x, y]) => Q.sub(Q.add(U2, x), Q.mul(r(2), y)),        /* u + a − 2b ≥ 0 */
  ];
  for (const f of halfPlanes) {
    const out = [];
    for (let k = 0; k < poly.length; k++) {
      const P = poly[k], N = poly[(k + 1) % poly.length];
      const fp = f(P), fn = f(N);
      if (Q.sign(fp) >= 0) out.push(P);
      if ((Q.sign(fp) > 0 && Q.sign(fn) < 0) || (Q.sign(fp) < 0 && Q.sign(fn) > 0)) {
        const t = Q.div(fp, Q.sub(fp, fn));
        out.push([Q.add(P[0], Q.mul(t, Q.sub(N[0], P[0]))), Q.add(P[1], Q.mul(t, Q.sub(N[1], P[1])))]);
      }
    }
    poly = out;
    if (poly.length === 0) return r(0);
  }
  let twice = r(0);
  for (let k = 0; k < poly.length; k++) {
    const P = poly[k], N = poly[(k + 1) % poly.length];
    twice = Q.add(twice, Q.sub(Q.mul(P[0], N[1]), Q.mul(N[0], P[1])));
  }
  return Q.mul(Q.abs(twice), r(2));                        /* 4·area = 2·|shoelace| */
}

/* Q(φ*) from block-pair areas alone — no h, no g*, so it is independent of hNodes. */
function QstarByAreas() {
  let acc = 0n;
  for (let b = 0; b < BLOCKS.length; b++) for (let c = 0; c < BLOCKS.length; c++)
    acc += BigInt(SIGNS[b] * SIGNS[c]) * area4(BigInt(EDGES[b]), BigInt(EDGES[b + 1]), BigInt(EDGES[c]), BigInt(EDGES[c + 1]), BigInt(U));
  return Q.R(acc, 4n * BigInt(U) * BigInt(U));
}

/* ---- the bathtub (THEOREM-EXACT §2, first bullet) ---------------------------
   For a cell [p,q] (units), F(y) = min{∫ hσ : 0 ≤ σ ≤ 1, avg σ = y} = ∫_0^{wy} h^*, h^* the
   increasing rearrangement. F'(0) = w·min h, and F'' = w²/m'(v) with
   m(v) = |{h < v}|. On this lattice m' is the SUM, over the linear pieces whose open
   value range contains v, of 1/|slope| — pieces at different places in the cell
   overlap in value whenever h is not monotone on the cell, and each contributes. So
   M = sup m' is taken over every gap between consecutive distinct node values, and
   b = w²/(2M). A flat piece makes m jump (M = ∞), and then b = 0. Reading "max m_i'"
   as the largest single 1/|slope| would overstate b on non-monotone cells; this is the
   sound reading. */
function bathtub(p, q) {
  const hn = hNodes();
  const w = r(q - p, U);
  let min = hn[p];
  for (let x = p; x <= q; x++) if (Q.cmp(hn[x], min) < 0) min = hn[x];
  const a = Q.mul(w, min);
  const pieces = [];
  let flat = false;
  for (let x = p; x < q; x++) {
    const k = Q.mul(Q.sub(hn[x + 1], hn[x]), r(U));      /* slope in true units */
    if (Q.sign(k) === 0) flat = true;
    const lo = Q.cmp(hn[x], hn[x + 1]) < 0 ? hn[x] : hn[x + 1];
    const hi = Q.cmp(hn[x], hn[x + 1]) < 0 ? hn[x + 1] : hn[x];
    pieces.push({ lo, hi, inv: Q.sign(k) === 0 ? null : Q.abs(Q.div(r(1), k)) });
  }
  if (flat) return { a, b: r(0), min, M: null, flat: true };
  const vals = hn.slice(p, q + 1).slice().sort(Q.cmp).filter((v, k, s) => k === 0 || Q.cmp(v, s[k - 1]) !== 0);
  let M = null;
  for (let k = 0; k + 1 < vals.length; k++) {
    const mid = Q.mul(r(1, 2), Q.add(vals[k], vals[k + 1]));
    let mp = r(0);
    for (const pc of pieces) if (Q.cmp(pc.lo, mid) < 0 && Q.cmp(mid, pc.hi) < 0) mp = Q.add(mp, pc.inv);
    if (M === null || Q.cmp(mp, M) > 0) M = mp;
  }
  const b = M === null ? r(0) : Q.div(Q.mul(w, w), Q.mul(r(2), M));
  return { a, b, min, M, flat: false };
}

/* the exact bathtub minimiser on a cell: the sublevel set {h < v} of measure t.
   Returns the list of [α, β] (rationals) where σ = 1, and ∫ h over them. Used by the
   tests to push σ exactly onto the bathtub's worst case. */
function sublevel(p, q, t) {
  const hn = hNodes();
  const meas = v => {                                     /* |{x ∈ [p,q] : h(x) < v}| */
    let acc = r(0);
    for (let x = p; x < q; x++) {
      const h0 = hn[x], h1 = hn[x + 1];
      const lo = Q.cmp(h0, h1) < 0 ? h0 : h1, hi = Q.cmp(h0, h1) < 0 ? h1 : h0;
      if (Q.cmp(v, lo) <= 0) continue;
      if (Q.cmp(v, hi) >= 0) { acc = Q.add(acc, r(1, U)); continue; }
      acc = Q.add(acc, Q.mul(r(1, U), Q.div(Q.sub(v, lo), Q.sub(hi, lo))));
    }
    return acc;
  };
  const vals = hn.slice(p, q + 1).slice().sort(Q.cmp).filter((v, k, s) => k === 0 || Q.cmp(v, s[k - 1]) !== 0);
  if (Q.sign(t) <= 0) return { set: [], v: vals[0] };
  let v = null;
  for (let k = 0; k + 1 < vals.length; k++) {
    const m0 = meas(vals[k]), m1 = meas(vals[k + 1]);
    if (Q.cmp(m0, t) <= 0 && Q.cmp(t, m1) <= 0) {        /* m is linear between node values */
      v = Q.cmp(m1, m0) === 0 ? vals[k] : Q.add(vals[k], Q.mul(Q.sub(vals[k + 1], vals[k]), Q.div(Q.sub(t, m0), Q.sub(m1, m0))));
      break;
    }
  }
  if (v === null) v = vals[vals.length - 1];
  const set = [];
  for (let x = p; x < q; x++) {
    const h0 = hn[x], h1 = hn[x + 1], a0 = r(x, U), a1 = r(x + 1, U);
    const below0 = Q.cmp(h0, v) < 0, below1 = Q.cmp(h1, v) < 0;
    if (!below0 && !below1) continue;
    let s = a0, e = a1;
    if (below0 && !below1) e = Q.add(a0, Q.mul(r(1, U), Q.div(Q.sub(v, h0), Q.sub(h1, h0))));
    if (!below0 && below1) s = Q.add(a0, Q.mul(r(1, U), Q.div(Q.sub(v, h0), Q.sub(h1, h0))));
    if (set.length && Q.cmp(set[set.length - 1][1], s) === 0) set[set.length - 1][1] = e; else set.push([s, e]);
  }
  return { set, v };
}

module.exports = {
  U, BLOCKS, EDGES, SIGNS, r, blockOf, Phi, gStar, hNode, hNodes, hAt, hIntegral,
  kinkCandidatesOffLattice, area4, area4Clip, QstarByAreas, bathtub, sublevel,
};
