/* engine.js — the network census, in exact rationals, for Node and the browser.
   playground/census/ · cert-machine · 2026-09-07

   THE OBJECT. Two populations enter a directed network at entrances a and b
   and drain at the exit nodes. When the edge cost depends only on the TOTAL
   flow, the equilibrium conditions fix the totals but cannot see how two
   populations share an edge: the set of per-population splits compatible with
   one total is a FACE, and its dimension is

       k = |shared| − rank(M) = |shared| − cons + z,

   `shared` the edges both populations can reach, M their two conservation
   systems stacked and restricted to those edges, cons the non-exit nodes the
   shared edges touch, z the number of components of the shared subgraph that
   contain no exit. That theorem is instruments/facelaw (Python, exact over
   Fractions, 7,850 networks); this file is the same arithmetic written again
   in JavaScript with BigInt rationals so a browser can decide k while you
   edit the network, and make-facts.mjs checks it against the record before a
   page is built on it. A rule written twice is a rule that can diverge, so
   the second copy is gated against the first.

   What is decided here: the dimension of the set the equilibrium lives in,
   and the directions that span it. What is NOT: the equilibrium itself — the
   totals on the published network come from the paper's Table I, reproduced
   and proved within rounding on the Wardrop page; the split shown is ONE
   member of the face, and is drawn as one.

   No fiction on /instruments: every number on the page is produced by this
   code; make-facts.mjs writes them; build.js only reads. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CENSUS = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------- rationals over BigInt ---------------- */
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
  function Q(n, d) {
    n = BigInt(n); d = d === undefined ? 1n : BigInt(d);
    if (d === 0n) throw new Error('rational: zero denominator');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    return { n: n / g, d: d / g };
  }
  const q0 = Q(0), q1 = Q(1);
  const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => Q(a.n * b.n, a.d * b.d);
  const div = (a, b) => { if (b.n === 0n) throw new Error('rational: division by zero'); return Q(a.n * b.d, a.d * b.n); };
  const neg = (a) => Q(-a.n, a.d);
  const isZero = (a) => a.n === 0n;
  const cmp = (a, b) => { const l = a.n * b.d, r = b.n * a.d; return l < r ? -1 : l > r ? 1 : 0; };
  const toNum = (a) => Number(a.n) / Number(a.d);
  const str = (a) => (a.d === 1n ? a.n.toString() : a.n.toString() + '/' + a.d.toString());
  const fromNum = (x) => {                        /* a float that is really an integer or a short decimal */
    if (Number.isInteger(x)) return Q(x);
    const s = x.toString();
    if (/e/i.test(s)) throw new Error('rational: use integers or short decimals');
    const [i, f] = s.split('.');
    return Q(BigInt(i + f), 10n ** BigInt(f.length));
  };

  /* ---------------- the graph ---------------- */
  function reach(edges, entrance) {
    const out = {};
    edges.forEach((e, i) => { (out[e[0]] = out[e[0]] || []).push(i); });
    const act = [], seen = new Set(), nodes = new Set([entrance]), stack = [entrance];
    while (stack.length) {
      const u = stack.pop();
      for (const i of (out[u] || [])) {
        if (seen.has(i)) continue;
        seen.add(i); act.push(i);
        const v = edges[i][1];
        if (!nodes.has(v)) { nodes.add(v); stack.push(v); }
      }
    }
    return act.sort((a, b) => a - b);
  }
  /* conservation rows (one per non-exit node touched) over the active edges: +1 out, −1 in */
  function kirchhoff(edges, act, exits) {
    const nodes = new Set();
    for (const i of act) { nodes.add(edges[i][0]); nodes.add(edges[i][1]); }
    const rows = [...nodes].filter(n => !exits.has(n)).sort((a, b) => a - b);
    const ri = new Map(rows.map((n, r) => [n, r]));
    const K = rows.map(() => act.map(() => q0));
    act.forEach((i, c) => {
      const [u, v] = edges[i];
      if (ri.has(u)) K[ri.get(u)][c] = q1;
      if (ri.has(v)) K[ri.get(v)][c] = Q(-1);
    });
    return { K, rows };
  }
  /* reduced row echelon form over Q: returns the rank, the pivot columns and the reduced matrix */
  function rref(M, ncols) {
    const A = M.map(r => r.slice());
    let r = 0; const piv = [];
    for (let c = 0; c < ncols && r < A.length; c++) {
      let p = -1;
      for (let i = r; i < A.length; i++) if (!isZero(A[i][c])) { p = i; break; }
      if (p < 0) continue;
      [A[r], A[p]] = [A[p], A[r]];
      const inv = div(q1, A[r][c]);
      A[r] = A[r].map(x => mul(x, inv));
      for (let i = 0; i < A.length; i++) {
        if (i === r || isZero(A[i][c])) continue;
        const f = A[i][c];
        A[i] = A[i].map((x, j) => sub(x, mul(f, A[r][j])));
      }
      piv.push(c); r++;
    }
    return { rank: r, piv, A };
  }
  /* a basis of the null space, from the rref: one vector per free column */
  function nullspace(M, ncols) {
    const { rank, piv, A } = rref(M, ncols);
    const free = [];
    for (let c = 0; c < ncols; c++) if (!piv.includes(c)) free.push(c);
    const basis = free.map(fc => {
      const v = Array.from({ length: ncols }, () => q0);
      v[fc] = q1;
      piv.forEach((pc, r) => { v[pc] = neg(A[r][fc]); });
      return v;
    });
    return { rank, nullity: ncols - rank, basis };
  }
  function components(edgeList) {
    const adj = new Map();
    for (const [u, v] of edgeList) {
      if (!adj.has(u)) adj.set(u, new Set()); if (!adj.has(v)) adj.set(v, new Set());
      adj.get(u).add(v); adj.get(v).add(u);
    }
    const seen = new Set(), comps = [];
    for (const s of adj.keys()) {
      if (seen.has(s)) continue;
      const comp = new Set(), stack = [s];
      while (stack.length) { const n = stack.pop(); if (comp.has(n)) continue; comp.add(n); seen.add(n); for (const m of adj.get(n)) if (!comp.has(m)) stack.push(m); }
      comps.push(comp);
    }
    return comps;
  }

  /* the face: exact k by the null space, the shortcut, and the theorem's k with z */
  function face(edges, exitsArr, ea, eb) {
    const exits = new Set(exitsArr);
    const a1 = reach(edges, ea), a2 = reach(edges, eb);
    const shared = a1.filter(i => a2.includes(i));
    const base = { shared, a1, a2 };
    if (!shared.length) return Object.assign(base, { k: 0, rank: 0, cons: 0, shortcut: 0, z: 0, theoremK: 0, agree: true, basis: [], components: [] });
    const K1 = kirchhoff(edges, a1, exits), K2 = kirchhoff(edges, a2, exits);
    const i1 = new Map(a1.map((e, c) => [e, c])), i2 = new Map(a2.map((e, c) => [e, c]));
    const M = K1.K.map(row => shared.map(e => row[i1.get(e)])).concat(K2.K.map(row => shared.map(e => row[i2.get(e)])));
    const ns = nullspace(M, shared.length);
    const nodes = new Set();
    for (const i of shared) { nodes.add(edges[i][0]); nodes.add(edges[i][1]); }
    const cons = [...nodes].filter(n => !exits.has(n)).length;
    const comps = components(shared.map(i => edges[i]));
    const z = comps.filter(c => ![...c].some(n => exits.has(n))).length;
    const shortcut = shared.length - cons;
    return Object.assign(base, { k: ns.nullity, rank: ns.rank, cons, shortcut, z, theoremK: shared.length - cons + z,
      agree: ns.nullity === shortcut, basis: ns.basis, components: comps.map(c => [...c].sort((a, b) => a - b)) });
  }

  /* Edmonds–Karp over rationals on the shared edges. Supplies: the entrance's inflow
     Q1 plus what the private (population-1-only) edges deliver at their heads, minus
     what they draw at their tails; sinks: the exits. Returns population 1's flow on
     the shared edges, or null when the total routed falls short of the supply. */
  function flowRoute(edges, exits, ea, a1, sh, fixed, T, Q1, seed) {
    const supply = new Map();
    const addS = (n, v) => supply.set(n, add(supply.get(n) || q0, v));
    addS(ea, Q1);
    a1.forEach(e => { if (fixed[e] !== null && !isZero(fixed[e])) { addS(edges[e][1], fixed[e]); addS(edges[e][0], neg(fixed[e])); } });
    /* residual graph on the shared edges: forward capacity T − x, backward x */
    const x = sh.map(() => q0);
    const cap = (c, fwd) => (fwd ? sub(T[sh[c]], x[c]) : x[c]);
    const nbrs = new Map();
    sh.forEach((e, c) => { const [u, v] = edges[e]; if (!nbrs.has(u)) nbrs.set(u, []); if (!nbrs.has(v)) nbrs.set(v, []); nbrs.get(u).push({ c, fwd: true, to: v }); nbrs.get(v).push({ c, fwd: false, to: u }); });
    /* a deterministic permutation of every arc list, so different seeds reach different
       vertices of the face. The key is a pure function of (seed, arc): no comparator with
       state, so Node and every browser order the arcs identically. */
    if (seed) for (const [, arr] of nbrs) {
      const key = (a) => { let h = (seed * 2654435761 + a.c * 40503 + (a.fwd ? 97 : 0)) >>> 0; h ^= h >>> 13; h = (h * 1274126177) >>> 0; return h ^ (h >>> 16); };
      arr.sort((a, b) => key(a) - key(b));
    }
    const sources = [...supply.entries()].filter(([n, v]) => cmp(v, q0) > 0 && !exits.has(n));
    let total = q0, need = q0;
    for (const [, v] of sources) need = add(need, v);
    const left = new Map(sources);
    for (;;) {
      /* BFS from any source with supply left to any exit */
      const prev = new Map(); const queue = [];
      for (const [n, v] of left) if (cmp(v, q0) > 0) { prev.set(n, { src: n }); queue.push(n); }
      let hit = null;
      while (queue.length && hit === null) {
        const u = queue.shift();
        for (const a of (nbrs.get(u) || [])) {
          if (cmp(cap(a.c, a.fwd), q0) <= 0 || prev.has(a.to)) continue;
          prev.set(a.to, { from: u, c: a.c, fwd: a.fwd });
          if (exits.has(a.to)) { hit = a.to; break; }
          queue.push(a.to);
        }
      }
      if (hit === null) break;
      /* bottleneck along the path, capped by the source's remaining supply */
      const pathArcs = []; let n = hit;
      while (prev.get(n).from !== undefined) { const p = prev.get(n); pathArcs.push(p); n = p.from; }
      const src = n;
      let bott = left.get(src);
      for (const p of pathArcs) { const cp = cap(p.c, p.fwd); if (cmp(cp, bott) < 0) bott = cp; }
      for (const p of pathArcs) x[p.c] = p.fwd ? add(x[p.c], bott) : sub(x[p.c], bott);
      left.set(src, sub(left.get(src), bott));
      total = add(total, bott);
    }
    return cmp(total, need) === 0 ? x : null;
  }

  /* ---------------- the split family on a network with published totals ----------------
     Given totals T (one per edge) and population 1's inflow Q1 at its entrance, the
     per-population splits compatible with T form an affine set: population 1's flow j¹
     satisfies its own conservation with inflow Q1, equals T on edges population 2 cannot
     reach, is 0 on edges population 1 cannot reach, and 0 ≤ j¹ ≤ T; population 2 takes
     the rest. Its dimension is k, its directions the null-space basis. A base point is
     found as the least-norm solution of the equality part, pushed inside the box by a
     deterministic search along the basis when it lands outside. */
  function splitFamily(edges, exitsArr, ea, eb, totals, Q1) {
    const exits = new Set(exitsArr);
    const f = face(edges, exitsArr, ea, eb);
    const T = totals.map(t => (typeof t === 'object' && t.n !== undefined) ? t : fromNum(t));
    const n = edges.length;
    const a1 = new Set(f.a1), a2 = new Set(f.a2);
    /* unknowns: j¹ on the shared edges; fixed: T on a1\a2, 0 elsewhere */
    const fixed = Array.from({ length: n }, (_, i) => (a1.has(i) && !a2.has(i)) ? T[i] : (!a1.has(i) ? q0 : null));
    const sh = f.shared;
    if (!sh.length) return null;
    const K = kirchhoff(edges, f.a1, exits);
    const i1 = new Map(f.a1.map((e, c) => [e, c]));
    /* rows: conservation at population 1's non-exit nodes; rhs: Q1 at the entrance, 0 elsewhere, minus the fixed part */
    const rows = K.rows;
    const A = rows.map(() => sh.map(() => q0));
    const b = rows.map((node) => (node === ea ? fromNum(Q1) : q0));
    rows.forEach((node, r) => {
      f.a1.forEach((e) => {
        const coef = K.K[r][i1.get(e)];
        if (isZero(coef)) return;
        const sc = sh.indexOf(e);
        if (sc >= 0) A[r][sc] = coef;
        else b[r] = sub(b[r], mul(coef, fixed[e]));
      });
    });
    /* consistency of the equality part: a zero row with nonzero rhs means no split exists */
    const { rank, A: R } = rref(A.map((row, r) => row.concat([b[r]])), sh.length);
    for (let r = rank; r < R.length; r++) if (!isZero(R[r][sh.length])) return { face: f, feasible: false, why: 'the totals admit no population-1 flow' };
    /* a feasible particular solution by max-flow: population 1's forced arrivals at the
       heads of its private edges are pushed to the exits through the shared edges
       under the capacities T; if the max flow falls short, no split exists */
    const vertices = [];
    for (let seed = 0; seed < 12; seed++) { const v = flowRoute(edges, exits, ea, f.a1, sh, fixed, T, fromNum(Q1), seed); if (v) vertices.push(v); }
    if (!vertices.length) return { face: f, feasible: false, why: 'the totals admit no population-1 flow within the capacities' };
    /* the average of the vertices reached is feasible (the box is convex) and interior in every direction they differ */
    const x = sh.map((_, c) => div(vertices.reduce((acc, v) => add(acc, v[c]), q0), Q(vertices.length)));
    const basis = nullspace(A, sh.length).basis;
    const box = (v) => v.every((val, c) => cmp(val, q0) >= 0 && cmp(val, T[sh[c]]) <= 0);
    const slack = (v) => { let m = null; v.forEach((val, c) => { for (const s of [val, sub(T[sh[c]], val)]) if (m === null || cmp(s, m) < 0) m = s; }); return m; };
    /* push inside: try the base and rational steps along each basis direction, keep the largest minimum slack */
    /* centring: a coordinate search that maximises the minimum slack, along single
       basis directions and along pairs (a face vertex is often blocked in every single
       direction and open along a sum), until no step of any size improves it */
    /* the objective is lexicographic: first the number of bounds that are TIGHT (to be
       minimised — a vertex is tight in many), then the smallest slack (to be maximised) */
    const tight = (v) => { let n = 0; v.forEach((val, c) => { if (isZero(val) || isZero(sub(T[sh[c]], val))) n++; }); return n; };
    const better = (cand, candSlack, refTight, refSlack) => { const ct = tight(cand); return ct < refTight || (ct === refTight && cmp(candSlack, refSlack) > 0); };
    let best = x, bestSlack = slack(x), bestTight = tight(x);
    const steps = [Q(1, 8), Q(1, 4), Q(1, 2), Q(1), Q(2), Q(4), Q(8), Q(16)];
    const dirs = basis.slice();
    for (let i = 0; i < basis.length; i++) for (let j = i + 1; j < basis.length; j++) {
      dirs.push(basis[i].map((v, c) => add(v, basis[j][c])));
      dirs.push(basis[i].map((v, c) => sub(v, basis[j][c])));
    }
    /* weighted pairs and triples, so bounds that only lift together can be lifted together */
    for (let i = 0; i < basis.length; i++) for (let j = 0; j < basis.length; j++) {
      if (i === j) continue;
      for (const w of [2, 3]) dirs.push(basis[i].map((v, c) => add(mul(Q(w), v), basis[j][c])));
    }
    if (basis.length <= 7) for (let i = 0; i < basis.length; i++) for (let j = i + 1; j < basis.length; j++) for (let l = j + 1; l < basis.length; l++) {
      for (const [a, b2, c2] of [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2], [1, -1, 1], [1, 1, -1], [-1, 1, 1]]) {
        dirs.push(basis[i].map((v, c) => add(add(mul(Q(a), v), mul(Q(b2), basis[j][c])), mul(Q(c2), basis[l][c]))));
      }
    }
    /* every ±1 combination of the whole basis (k ≤ 8), so several bounds can lift at once */
    if (basis.length <= 8 && basis.length >= 3) {
      for (let mask = 0; mask < (1 << basis.length); mask++) {
        dirs.push(basis[0].map((_, c) => basis.reduce((acc, v, i) => ((mask >> i) & 1) ? add(acc, v[c]) : sub(acc, v[c]), q0)));
      }
    }
    /* the lift: a direction in the span of the basis that moves EVERY binding bound
       inward at once (+1 at a lower bound, −1 at an upper bound), found by solving the
       small linear system over Q; then the longest step that keeps the box */
    const liftDir = (pt) => {
      const rows = [], rhs = [];
      pt.forEach((val, c) => {
        const lo = val, hi = sub(T[sh[c]], val);
        const m = cmp(lo, hi) < 0 ? lo : hi;
        if (cmp(m, bestSlack) <= 0) { rows.push(basis.map(v => v[c])); rhs.push(cmp(lo, hi) < 0 ? q1 : Q(-1)); }
      });
      if (!rows.length) return null;
      const { rank, piv, A: R } = rref(rows.map((row, r) => row.concat([rhs[r]])), basis.length);
      for (let r = rank; r < R.length; r++) if (!isZero(R[r][basis.length])) return null;
      const a = basis.map(() => q0);
      piv.forEach((pc, r) => { a[pc] = R[r][basis.length]; });
      return pt.map((_, c) => basis.reduce((acc, v, i) => add(acc, mul(a[i], v[c])), q0));
    };
    for (let round = 0; round < 40; round++) {
      let improved = false;
      const lift = liftDir(best);
      if (lift) dirs.push(lift);
      for (const v of dirs) for (const s of steps) for (const sg of [1, -1]) {
        const cand = best.map((val, c) => add(val, mul(Q(sg), mul(s, v[c]))));
        const sl = slack(cand);
        if (cmp(sl, q0) < 0) continue;                                    /* stay inside the box */
        if (better(cand, sl, bestTight, bestSlack)) { best = cand; bestSlack = sl; bestTight = tight(cand); improved = true; }
      }
      if (!improved) break;
    }
    const feasible = box(best);
    /* the slider range along each basis direction from the base point, keeping 0 ≤ j¹ ≤ T */
    const ranges = basis.map(v => {
      let lo = null, hi = null;
      v.forEach((vc, c) => {
        if (isZero(vc)) return;
        const room0 = div(neg(best[c]), vc), roomT = div(sub(T[sh[c]], best[c]), vc);   /* t where j¹ hits 0 and T */
        const a = cmp(room0, roomT) < 0 ? room0 : roomT, bnd = cmp(room0, roomT) < 0 ? roomT : room0;
        if (lo === null || cmp(a, lo) > 0) lo = a;
        if (hi === null || cmp(bnd, hi) < 0) hi = bnd;
      });
      return { lo, hi };
    });
    const full = Array.from({ length: n }, (_, i) => fixed[i] !== null ? fixed[i] : best[sh.indexOf(i)]);
    return { face: f, feasible, base: best, baseFull: full, basis, ranges, T, shared: sh, minSlack: bestSlack };
  }

  /* ---------------- repairing published totals ----------------
     A printed table of rounded flows is not a flow: conservation fails by units at
     several nodes. The nearest conserving totals in the least-squares sense are
     T′ = T + Kᵀ y with (K Kᵀ) y = −(K T − b), solved exactly over Q on the total
     network (every edge active, inflows at both entrances). The result is one
     conserving flow inside the rounding box — CHOSEN, and drawn as such. */
  function solveSquare(A, b) {
    const n = b.length;
    const { rank, A: R } = rref(A.map((row, r) => row.concat([b[r]])), n);
    if (rank < n) return null;
    return R.map(row => row[n]);
  }
  function repairTotals(edges, exitsArr, inflows, totals) {
    const exits = new Set(exitsArr);
    const all = edges.map((_, i) => i);
    const K = kirchhoff(edges, all, exits);
    const T = totals.map(fromNum);
    const b = K.rows.map(node => (inflows[node] !== undefined ? fromNum(inflows[node]) : q0));
    const r = K.K.map((row, i) => sub(row.reduce((acc, kij, j) => add(acc, mul(kij, T[j])), q0), b[i]));
    const KKt = K.K.map(ri => K.K.map(rj => ri.reduce((acc, v, j) => add(acc, mul(v, rj[j])), q0)));
    const y = solveSquare(KKt, r.map(neg));
    if (!y) return null;
    const corr = all.map(j => K.K.reduce((acc, row, i) => add(acc, mul(row[j], y[i])), q0));
    const Tp = T.map((t, j) => add(t, corr[j]));
    const residual = r.map(str);
    let maxDev = q0;
    corr.forEach(c => { const a = cmp(c, q0) < 0 ? neg(c) : c; if (cmp(a, maxDev) > 0) maxDev = a; });
    return { T: Tp, correction: corr, residualBefore: residual, maxDev, rows: K.rows };
  }

  return { Q, q0, q1, add, sub, mul, div, neg, cmp, isZero, toNum, str, fromNum,
    reach, kirchhoff, rref, nullspace, components, face, splitFamily, repairTotals };
}));
