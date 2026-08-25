/* covering.js — certified lower bounds for topological entropy via covering
   relations: the instrument that turns census boxes into a named dynamical
   invariant.

   THE SHAPE. An h-set is a parallelogram N = c + A·[−1,1]² with a nominally
   expanding (u, first column of A) and contracting (s, second column)
   direction. A COVERING RELATION N1 =F⇒ N2 asserts that F stretches N1
   across N2 correctly: in the target's own coordinates
   g(t) = A2^{-1}(F(c1 + A1·t) − c2),

     (A)  g([−1,1]²) avoids the target's two s-LIDS {|u| ≤ 1, s = ±1} —
          the image may extend far past the target in u (a long horseshoe
          leg does), but it must never touch the lids: it enters and exits
          through the u-ends only; and
     (B)  the two u-edges g({−1}×[−1,1]), g({+1}×[−1,1]) land strictly
          beyond u = −1 and u = +1, on OPPOSITE sides.

   Both are finite sets of strict interval inequalities, verified here by
   adaptive subdivision with outward rounding — the certifier can refuse
   (budget exhausted, condition not resolvable) but cannot certify a false
   covering. A2^{-1} is enclosed in intervals, so the conditions hold for
   the true parallelogram, not a float approximation of it.

   THE THEOREM CONSUMED (the one external ingredient, used the way Krawczyk's
   theorem is): Zgliczyński–Gidea covering relations — given pairwise
   DISJOINT h-sets and verified covering relations along the edges of a
   graph G, every bi-infinite path through G is realized by an orbit, and
   distinct itineraries give distinct orbits; hence F's invariant set
   semi-conjugates onto the subshift σ_G and

       h_top(F) ≥ ln sp(T),   T the adjacency matrix of the certified graph.

   Every edge in one graph is a relation for the SAME fixed iterate F^k
   (default k = 1), so the bookkeeping is one division and nothing subtler:
   h_top(F) = h_top(F^k)/k ≥ ln sp(T)/k. The single-step expansion of the
   Hénon map at classical parameters averages ~1.5 — not enough for
   box-to-box stretching — so useful graphs there run at k of a few, with
   adaptive subdivision absorbing the composed nonlinearity; boxes stay
   small, so the intervals stay tight.

   THE SPECTRAL BOUND is exact: sp(T) ≥ (min positive row sum of T^m)^(1/m)
   over any strongly connected component, all in BigInt — the bound is a
   rational power of an integer, never a float eigenvalue.

   Disjointness is the separating-axis test with outward rounding —
   conservative: it can fail to separate genuinely disjoint sets (refuse),
   never separate intersecting ones.

   MIT licensed. Part of cert-machine. */
'use strict';

const IV = require('#instruments/interval/interval.js');

/* ---- interval linear algebra for 2x2 ------------------------------------- */
const ivPt = (v) => [IV.iv(v[0]), IV.iv(v[1])];

/* enclosure of A^{-1} for a float 2x2 A = [[a,b],[c,d]] */
function invIV(A) {
  const a = IV.iv(A[0][0]), b = IV.iv(A[0][1]), c = IV.iv(A[1][0]), d = IV.iv(A[1][1]);
  const det = IV.sub(IV.mul(a, d), IV.mul(b, c));
  if (det[0] <= 0 && det[1] >= 0) return null;             /* possibly singular */
  return [
    [IV.div(d, det), IV.neg(IV.div(b, det))],
    [IV.neg(IV.div(c, det)), IV.div(a, det)]
  ];
}
const matVecIV = (M, v) => [
  IV.add(IV.mul(M[0][0], v[0]), IV.mul(M[0][1], v[1])),
  IV.add(IV.mul(M[1][0], v[0]), IV.mul(M[1][1], v[1]))
];

/* ---- the Hénon map, x' = 1 − a x² + b y, y' = x --------------------------- */
function henonSpec(a, b) {
  const IA = IV.iv(a), IB = IV.iv(b), ONE = IV.iv(1);
  return {
    name: 'henon', a, b,
    fF: (x, y) => [1 - a * x * x + b * y, x],
    dfF: (x, y) => [[-2 * a * x, b], [1, 0]],
    fIV: (X) => [IV.add(IV.sub(ONE, IV.mul(IA, IV.sqr(X[0]))), IV.mul(IB, X[1])), X[0]]
  };
}

/* point of N1's t-box mapped through F^steps into N2's coordinates, all
   intervals. The boxes are small and the subdivision is adaptive, so a few
   composed steps stay tight; the certificate records `steps` and the
   entropy bookkeeping divides by it. */
function gEval(map, N1, inv2, c2, tU, tS, steps) {
  let X = [
    IV.add(IV.iv(N1.c[0]), IV.add(IV.mul(IV.iv(N1.A[0][0]), tU), IV.mul(IV.iv(N1.A[0][1]), tS))),
    IV.add(IV.iv(N1.c[1]), IV.add(IV.mul(IV.iv(N1.A[1][0]), tU), IV.mul(IV.iv(N1.A[1][1]), tS)))
  ];
  for (let s = 0; s < (steps || 1); s++) X = map.fIV(X);
  return matVecIV(inv2, [IV.sub(X[0], IV.iv(c2[0])), IV.sub(X[1], IV.iv(c2[1]))]);
}

/* ---- covering check ------------------------------------------------------- */
/* condition (A): the image of the whole box avoids the target's s-lids
   {|u| ≤ 1, s = ±1}. A cell is clear when its g_s interval contains
   neither −1 nor +1, or when it lies entirely outside the target in u —
   long images that overshoot the target are admissible, images that touch
   a lid are not. Adaptive bisection, outward rounding. */
function checkS(map, N1, inv2, c2, budget, steps) {
  const stack = [[[-1, 1], [-1, 1]]];
  let cells = 0;
  while (stack.length) {
    if (++cells > budget.cells) return { ok: false, why: 's-lid condition: cell budget exhausted', cells };
    const [u, s] = stack.pop();
    const g = gEval(map, N1, inv2, c2, u, s, steps);
    const sFree = (g[1][0] > -1 && g[1][1] < 1) || g[1][1] < -1 || g[1][0] > 1;
    const uOutside = g[0][1] < -1 || g[0][0] > 1;
    if (sFree || uOutside) continue;
    const du = u[1] - u[0], ds = s[1] - s[0];
    if (du < budget.minWidth && ds < budget.minWidth)
      return { ok: false, why: 's-lid condition fails near t=(' + u[0].toFixed(4) + ',' + s[0].toFixed(4) + '): g_u = [' + g[0][0].toFixed(3) + ',' + g[0][1].toFixed(3) + '], g_s = [' + g[1][0].toFixed(3) + ',' + g[1][1].toFixed(3) + ']', cells };
    if (du >= ds) { const m = (u[0] + u[1]) / 2; stack.push([[u[0], m], s], [[m, u[1]], s]); }
    else { const m = (s[0] + s[1]) / 2; stack.push([u, [s[0], m]], [u, [m, s[1]]]); }
  }
  return { ok: true, cells };
}

/* condition (B), one u-edge: g_u entirely < −1 (side −1) or entirely > +1 */
function checkEdge(map, N1, inv2, c2, uVal, budget, steps) {
  const stack = [[-1, 1]];
  let side = 0, cells = 0;
  while (stack.length) {
    if (++cells > budget.cells) return { ok: false, why: 'u-edge: cell budget exhausted' };
    const s = stack.pop();
    const g = gEval(map, N1, inv2, c2, [uVal, uVal], s, steps);
    let here = 0;
    if (g[0][1] < -1) here = -1;
    else if (g[0][0] > 1) here = 1;
    if (here !== 0) {
      if (side === 0) side = here;
      else if (side !== here) return { ok: false, why: 'u-edge lands on both sides' };
      continue;
    }
    if (s[1] - s[0] < budget.minWidth)
      return { ok: false, why: 'u-edge at u=' + uVal + ' not beyond ±1: g_u = [' + g[0][0].toFixed(3) + ',' + g[0][1].toFixed(3) + ']' };
    const m = (s[0] + s[1]) / 2;
    stack.push([s[0], m], [m, s[1]]);
  }
  return { ok: true, side, cells };
}

/* covers(map, N1, N2) — certify the covering relation N1 =F⇒ N2, or refuse */
function covers(map, N1, N2, opts) {
  const budget = { cells: (opts && opts.cells) || 20000, minWidth: (opts && opts.minWidth) || 1e-6 };
  const steps = (opts && opts.steps) || 1;
  const inv2 = invIV(N2.A);
  if (!inv2) return { ok: false, why: 'target A-matrix not certifiably invertible' };
  const L = checkEdge(map, N1, inv2, N2.c, -1, budget, steps);
  if (!L.ok) return { ok: false, why: L.why };
  const R = checkEdge(map, N1, inv2, N2.c, 1, budget, steps);
  if (!R.ok) return { ok: false, why: R.why };
  if (L.side === R.side) return { ok: false, why: 'both u-edges land on the same side — no stretching across' };
  const S = checkS(map, N1, inv2, N2.c, budget, steps);
  if (!S.ok) return { ok: false, why: S.why };
  return { ok: true, orientation: R.side, cells: L.cells + R.cells + S.cells };
}

/* ---- pairwise disjointness: separating axes, outward-rounded -------------- */
function projIV(N, axis) {
  const cx = IV.mul(axis[0], IV.iv(N.c[0])), cy = IV.mul(axis[1], IV.iv(N.c[1]));
  const e1 = IV.abs(IV.add(IV.mul(axis[0], IV.iv(N.A[0][0])), IV.mul(axis[1], IV.iv(N.A[1][0]))));
  const e2 = IV.abs(IV.add(IV.mul(axis[0], IV.iv(N.A[0][1])), IV.mul(axis[1], IV.iv(N.A[1][1]))));
  const r = IV.add(e1, e2), c = IV.add(cx, cy);
  return [c[0] - r[1], c[1] + r[1]];
}
function disjoint(N1, N2) {
  const axes = [];
  for (const N of [N1, N2]) {
    axes.push([IV.iv(N.A[1][0]), IV.neg(IV.iv(N.A[0][0]))]);   /* normal to u-edge */
    axes.push([IV.iv(N.A[1][1]), IV.neg(IV.iv(N.A[0][1]))]);   /* normal to s-edge */
  }
  for (const ax of axes) {
    const p1 = projIV(N1, ax), p2 = projIV(N2, ax);
    if (p1[1] < p2[0] || p2[1] < p1[0]) return true;           /* strictly separated */
  }
  return false;                                                /* not PROVED disjoint */
}

/* ---- exact spectral lower bound over strongly connected components -------- */
function sccs(T) {
  const n = T.length, idx = new Array(n).fill(-1), low = new Array(n).fill(0);
  const onStack = new Array(n).fill(false), stack = [], out = [];
  let counter = 0;
  function strong(v) {
    idx[v] = low[v] = counter++;
    stack.push(v); onStack[v] = true;
    for (let w = 0; w < n; w++) {
      if (!T[v][w]) continue;
      if (idx[w] < 0) { strong(w); low[v] = Math.min(low[v], low[w]); }
      else if (onStack[w]) low[v] = Math.min(low[v], idx[w]);
    }
    if (low[v] === idx[v]) {
      const comp = [];
      for (;;) { const w = stack.pop(); onStack[w] = false; comp.push(w); if (w === v) break; }
      out.push(comp);
    }
  }
  for (let v = 0; v < n; v++) if (idx[v] < 0) strong(v);
  return out;
}

/* logSpectralLB(T) -> { logLB, m, scc } : ln sp(T) ≥ logLB, exactly.
   sp(T) ≥ sp(T|scc) ≥ (min row sum of (T|scc)^m)^(1/m), BigInt throughout. */
function logSpectralLB(T, maxM) {
  let best = { logLB: 0, m: 0, scc: null };
  for (const comp of sccs(T)) {
    const k = comp.length;
    const hasEdge = comp.some(v => comp.some(w => T[v][w]));
    if (!hasEdge) continue;
    let M = comp.map(v => comp.map(w => BigInt(T[v][w])));
    const step = comp.map(v => comp.map(w => BigInt(T[v][w])));
    for (let m = 1; m <= (maxM || 24); m++) {
      let minRS = null;
      for (let i = 0; i < k; i++) {
        let rs = 0n;
        for (let j = 0; j < k; j++) rs += M[i][j];
        if (minRS === null || rs < minRS) minRS = rs;
      }
      if (minRS > 0n && Number(minRS) < 1e300) {
        const lb = Math.log(Number(minRS)) / m;
        if (lb > best.logLB) best = { logLB: lb, m, scc: comp.slice() };
      }
      /* next power */
      const N = [];
      for (let i = 0; i < k; i++) {
        N.push([]);
        for (let j = 0; j < k; j++) {
          let s = 0n;
          for (let l = 0; l < k; l++) s += M[i][l] * step[l][j];
          N[i].push(s);
        }
      }
      M = N;
    }
  }
  return best;
}

/* ---- the assembled theorem ------------------------------------------------ */
/* certifyGraph(map, hsets, candidateEdges) -> the certified subgraph and the
   entropy bound it proves. Every edge is re-derived here; uncertified edges
   are DROPPED (which can only lower the bound); non-disjoint h-sets refuse
   the whole graph. */
function certifyGraph(map, hsets, candidateEdges, opts) {
  for (let i = 0; i < hsets.length; i++) for (let j = i + 1; j < hsets.length; j++) {
    if (!disjoint(hsets[i], hsets[j]))
      return { ok: false, why: 'h-sets ' + i + ' and ' + j + ' not provably disjoint — itineraries would not separate orbits' };
  }
  const T = hsets.map(() => hsets.map(() => 0));
  const certified = [], refused = [];
  for (const [i, j] of candidateEdges) {
    const c = covers(map, hsets[i], hsets[j], opts);
    if (c.ok) { T[i][j] = 1; certified.push([i, j]); }
    else refused.push([i, j, c.why]);
  }
  const sb = logSpectralLB(T, opts && opts.maxM);
  const steps = (opts && opts.steps) || 1;
  const hLB = sb.logLB / steps;
  return {
    ok: true, T, certified, refused, steps,
    logLB: sb.logLB, hLB, powerM: sb.m, core: sb.scc,
    text: 'h_top >= ' + hLB.toFixed(6) + ' — ' + certified.length + ' covering relations certified over '
      + hsets.length + ' pairwise-disjoint h-sets, every edge a strict interval inequality set for the single '
      + 'iterate F^' + steps + ' (h_top(F) = h_top(F^k)/k); spectral bound exact via BigInt row sums at power m=' + sb.m
  };
}

module.exports = { henonSpec, covers, disjoint, certifyGraph, logSpectralLB, invIV, sccs };
