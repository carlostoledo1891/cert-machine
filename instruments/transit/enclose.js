/* enclose.js — the set of radius ratios a transit light curve allows.
 *
 * THE PROGRAM.  Fix a candidate k = Rp/R*. The light curve is consistent with k
 * exactly when there is a nonnegative measure mu on [0,1] with
 *
 *     INT dmu = 1,        l_j <= INT W_j dmu <= u_j     (j = 1..m)
 *
 * where W_j is the transit kernel over the j-th time bin and [l_j, u_j] is the
 * stated error budget around the measured depth. Nothing else. No law, no
 * smoothness, no monotonicity — those are rungs, added one at a time below.
 *
 * FEASIBILITY IS A HULL QUESTION.  Because mu is a probability measure,
 * INT W dmu ranges over exactly conv{ W(r) : r in [0,1] } — the convex hull of
 * the kernel's moment curve. So k is consistent iff that hull meets the box
 * [l, u], and the whole problem is: does a curve in R^m meet a box.
 *
 *   - it meets it     -> the meeting point is a finite convex combination of
 *                        kernel values, i.e. an ATOMIC MEASURE. The witness.
 *   - it misses it    -> the separating direction is a FARKAS CERTIFICATE:
 *                        with alpha, beta >= 0 and h(r) = SUM alpha_j Wlo_j(r)
 *                        - SUM beta_j Whi_j(r),
 *                            min_r h(r) > SUM alpha_j u_j - SUM beta_j l_j
 *                        refutes k for every mu at once, because
 *                        0 <= INT (h - min h) dmu forces the reverse.
 *
 * Frank-Wolfe delivers both from one run: its linear oracle is a 1-D scan of
 * the kernel, its iterate is the convex combination, and p - q at convergence
 * is the separating direction. Nothing in the optimiser has to be trusted — it
 * only PROPOSES; the certificate is then re-checked over the continuum with
 * interval arithmetic, and a witness is re-checked as a measure from scratch.
 *
 * THE GEOMETRY IS A BOX, NOT A NUMBER.  a/R*, b and t0 are not known either.
 * Each bin's kernel is therefore enclosed over the whole geometry box AND over
 * the bin's own time span, giving an interval-valued kernel [Wlo, Whi]. Because
 * mu >= 0, INT W dmu lies between INT Wlo dmu and INT Whi dmu, so the single
 * two-sided constraint splits into two one-sided ones with different kernels:
 *
 *     INT Wlo_j dmu <= u_j        and       INT Whi_j dmu >= l_j
 *
 * which is still linear. Treating each bin's geometry as free to vary
 * independently is a RELAXATION: the answer is wider than the truth, never
 * narrower, which is the direction this kind of argument has to err in.
 *
 * THE LADDER.  Assumptions enter by changing the KERNEL, not the machinery:
 *
 *   'none'      dmu(r) = 2 pi r I(r) dr with I >= 0.  Kernel w(r; z, k).
 *   'monotone'  I additionally non-increasing outward.  Every such I is a
 *               mixture of uniform disks, I(r) = INT 1{r <= s} dnu(s), so with
 *               dnu'(s) = s^2 dnu(s) the problem is the SAME shape in nu' and
 *               the kernel becomes the intersection AREA, lensArea(s,z,k)/pi s^2.
 *
 * That is the dial: one rung is one kernel, and the price of the assumption is
 * read off in the units of the answer.
 */
'use strict';
const I = require('../interval/interval.js');
const T = require('./transit.js');

/* ---- generalised lens area: disk of radius s meets disk of radius k at z --- */
function lensAreaG(s, z, k) {
  if (s <= 0 || k <= 0) return 0;
  if (z >= s + k) return 0;
  const mn = Math.min(s, k);
  if (z <= Math.abs(s - k)) return Math.PI * mn * mn;
  const c1 = (z * z + s * s - k * k) / (2 * z * s), c2 = (z * z + k * k - s * s) / (2 * z * k);
  const cl = x => x < -1 ? -1 : x > 1 ? 1 : x;
  const t = (-z + s + k) * (z + s - k) * (z - s + k) * (z + s + k);
  return s * s * Math.acos(cl(c1)) + k * k * Math.acos(cl(c2)) - 0.5 * Math.sqrt(Math.max(0, t));
}
function lensAreaGIv(S, Z, k) {
  /* The clamped closed form is the function in EVERY regime, not just the
     overlapping one: disjoint drives both cosines to 1 and the radical to 0,
     containment drives one cosine to -1 and the radical to 0, and both give the
     right answer. So there is no case analysis here either — only a clamp, and
     the clamp is monotone so it goes on each endpoint separately. */
  const K = [k, k];
  const cl = x => x < -1 ? -1 : x > 1 ? 1 : x;
  const clIv = G => [cl(G[0]), cl(G[1])];
  const num1 = I.sub(I.add(I.sqr(Z), I.sqr(S)), I.sqr(K)), den1 = I.mul([2, 2], I.mul(Z, S));
  const num2 = I.sub(I.add(I.sqr(Z), I.sqr(K)), I.sqr(S)), den2 = I.mul([2, 2], I.mul(Z, K));
  const A1 = T.iacos(clIv(I.div(num1, den1))), A2 = T.iacos(clIv(I.div(num2, den2)));
  const p1 = I.add(I.sub(S, Z), K), p2 = I.add(I.sub(Z, K), S), p3 = I.add(I.sub(Z, S), K), p4 = I.add(I.add(Z, S), K);
  const TT0 = I.mul(I.mul(p1, p2), I.mul(p3, p4));
  const TT = [Math.max(0, TT0[0]), Math.max(0, TT0[1])];
  const raw = I.sub(I.add(I.mul(I.sqr(S), A1), I.mul(I.sqr(K), A2)), I.mul([0.5, 0.5], T.isqrt(TT)));
  /* the area cannot leave [0, pi min(s,k)^2]; intersecting is a free tightening */
  const cap = Math.PI * Math.min(S[1], k) * Math.min(S[1], k);
  const lo = Math.max(0, raw[0]), hi = Math.min(cap, raw[1]);
  return lo <= hi ? [lo, hi] : [0, cap];
}

/* ---- the two rungs, as kernels -------------------------------------------- */
const RUNGS = {
  none: {
    label: 'nonnegative brightness, nothing else',
    f: (x, z, k) => T.arcFrac(x, z, k),
    iv: (X, Z, k) => T.arcFracIv(X, Z, k)
  },
  monotone: {
    label: 'and the profile does not brighten outward',
    f: (x, z, k) => x <= 0 ? 0 : lensAreaG(x, z, k) / (Math.PI * x * x),
    iv: (X, Z, k) => {
      if (X[1] <= 0) return [0, 0];
      if (Z[0] >= X[1] + k) return [0, 0];        /* disjoint over the whole cell */
      if (X[0] <= 0) {
        /* s -> 0 is a 0/0 in the ratio, so it is decided by geometry instead: a
           disk of radius s <= z - k never reaches the planet at all. Returning
           the sound hull [0,1] here instead poisoned the certificate scan,
           because that cell can never be refined away. */
        if (X[1] <= Z[0] - k) return [0, 0];
        if (Z[1] + X[1] <= k) return [1, 1];
        return [0, 1];
      }
      const A = lensAreaGIv(X, Z, k);
      return I.div(A, I.mul(T.PI, I.sqr(X)));
    }
  }
};

/* ---- problem assembly ----------------------------------------------------- *
 * geom = { aR:[lo,hi], b:[lo,hi], t0:[lo,hi], P }.  Each bin gets one interval
 * kernel covering both its time span and the whole geometry box.
 */
function zSpan(bin, geom) {
  const DT = [bin.tmin - geom.t0[1], bin.tmax - geom.t0[0]];
  const lo = DT[0] <= 0 && DT[1] >= 0 ? 0 : Math.min(Math.abs(DT[0]), Math.abs(DT[1]));
  const hi = Math.max(Math.abs(DT[0]), Math.abs(DT[1]));
  return T.zIv([lo, hi], geom.aR, geom.b, geom.P);   /* z depends on |dt| only */
}

function makeProblem(bins, k, rungName, geom, budget) {
  const rung = RUNGS[rungName];
  if (!rung) throw new Error(`unknown rung ${rungName}`);
  const m = bins.length;
  const lo = new Float64Array(m), hi = new Float64Array(m);
  const d = new Float64Array(m), sig = new Float64Array(m), Z = [];
  let thin = true;
  for (let j = 0; j < m; j++) {
    d[j] = 1 - bins[j].f;                                      /* measured depth */
    sig[j] = bins[j].sigma + budget.sys;
    const eps = budget.nsig * bins[j].sigma + budget.sys;
    lo[j] = d[j] - eps; hi[j] = d[j] + eps;
    const z = zSpan(bins[j], geom);
    if (z[1] - z[0] > 1e-12) thin = false;
    Z.push(z);
  }
  /* THE ERROR BUDGET IS A HYPOTHESIS AND IT HAS TWO SHAPES.
     'box'  — every bin within nsig sigma of its measurement, independently.
              The weakest statement; it is what the interferometer used, and it
              permits chi2/dof up to nsig^2, which is far looser than any
              published fit.
     'ball' — SUM ((v-d)/sigma)^2 <= chi2 * m. Convex, so the machinery is
              unchanged, and it is the SAME shape the published error bars come
              from, which is the only way to compare like with like.
     'ball' needs one kernel per bin rather than a lo/hi pair, so it is only
     offered when the geometry is a point. A fat geometry box keeps the box. */
  /* A bin's own time span makes its kernel interval-valued even when the
     geometry is a point, so `thin` is essentially never true and the ball has
     nowhere to live yet. Refuse rather than fall back silently: a budget that
     quietly becomes a different budget is the kind of thing that ships wrong
     and returns plausible numbers for two days. */
  if (budget.shape === 'ball' && !thin) throw new Error('ball budget needs a point kernel; bins carry a time span (see the log, Stage 2)');
  const shape = budget.shape === 'ball' ? 'ball' : 'box';
  const R = shape === 'ball' ? Math.sqrt((budget.chi2 || 1.3) * m) : 0;
  return { m, lo, hi, d, sig, Z, k, rung, bins, geom, shape, single: thin, R };
}

/* kernel enclosure of bin j over the r-cell X.
 *
 * ADAPTIVE IN z, NOT ONLY IN r. The kernel's closed form mentions z five times,
 * so over a z-interval the terms stop cancelling and the naive enclosure blows
 * up: on the monotone rung at k = 0.996 the true kernel is 0.997 and the
 * enclosure over a z-box only 0.0115 wide came back as [0.16, 1.00]. Refining
 * the r-cell cannot fix that — the width is in z — and the loose bound had let
 * a planet the size of its star pass as admissible. So z is split too,
 * adaptively, and only where the enclosure is actually wide.
 */
function kIv(P, j, X) {
  const Z = P.Z[j];
  const A = P.rung.iv(X, Z, P.k);
  if (A[1] - A[0] <= 0.02 || Z[1] - Z[0] <= 1e-12) return A;
  const rec = (zlo, zhi, d) => {
    const a = P.rung.iv(X, [zlo, zhi], P.k);
    if (d === 0 || a[1] - a[0] <= 0.02) return a;
    const m = 0.5 * (zlo + zhi);
    const l = rec(zlo, m, d - 1), r = rec(m, zhi, d - 1);
    return [Math.min(l[0], r[0]), Math.max(l[1], r[1])];
  };
  return rec(Z[0], Z[1], P.zdepth === undefined ? 4 : P.zdepth);
}

/* ---- Frank-Wolfe over conv{ V(r) } vs the box ----------------------------- *
 * V(r) is 2m long: the first m are the LOW kernel endpoints (constrained above
 * by u), the last m the HIGH endpoints (constrained below by l).
 */
function buildGrid(P, G) {
  const w = P.single ? 1 : 2;
  const grid = new Float64Array(G), V = [];
  for (let g = 0; g < G; g++) {
    const x = (g + 0.5) / G;
    grid[g] = x;
    const v = new Float64Array(w * P.m);
    for (let j = 0; j < P.m; j++) {
      const A = kIv(P, j, [x, x]);
      v[j] = A[0]; if (w === 2) v[P.m + j] = A[1];
    }
    V.push(v);
  }
  return { grid, V };
}

/* nearest point of the admissible set. Box: a clamp. Ball: the exact
   projection onto the scaled ellipsoid, by bisection on its multiplier. */
function clampBox(P, p, q) {
  if (P.shape === 'ball') {
    let s2 = 0;
    for (let j = 0; j < P.m; j++) { const u = (p[j] - P.d[j]) / P.sig[j]; s2 += u * u; }
    if (s2 <= P.R * P.R) { q.set(p); return; }
    const rad = mu => { let t = 0; for (let j = 0; j < P.m; j++) { const v = p[j] - P.d[j], sj = P.sig[j] * P.sig[j], u = v * sj / (sj + mu); t += u * u / sj; } return t; };
    let a = 0, b = 1;
    while (rad(b) > P.R * P.R) b *= 4;
    for (let i = 0; i < 80; i++) { const c = 0.5 * (a + b); if (rad(c) > P.R * P.R) a = c; else b = c; }
    const mu = b;
    for (let j = 0; j < P.m; j++) { const sj = P.sig[j] * P.sig[j]; q[j] = P.d[j] + (p[j] - P.d[j]) * sj / (sj + mu); }
    return;
  }
  for (let j = 0; j < P.m; j++) {
    q[j] = Math.min(p[j], P.hi[j]);
    if (!P.single) q[P.m + j] = Math.max(p[P.m + j], P.lo[j]);
    else q[j] = Math.max(q[j], P.lo[j]);
  }
}

/* projection onto the probability simplex (Duchi et al.), exact and O(n log n) */
function projSimplex(v) {
  const n = v.length, u = Array.from(v).sort((a, b) => b - a);
  let cs = 0, rho = -1, theta = 0;
  for (let i = 0; i < n; i++) { cs += u[i]; const t = (cs - 1) / (i + 1); if (u[i] - t > 0) { rho = i; theta = t; } }
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.max(0, v[i] - theta);
  return out;
}

/* Frank-Wolfe with a FULLY CORRECTIVE step.
 *
 * Plain FW converges like 1/t, and 1/t is not good enough here: at the true k
 * of a synthetic curve it stalled at ||p-q|| ~ 1e-3, which is thirty times the
 * error bars, so a FEASIBLE k looked separated. The fix is not more iterations
 * — it is to re-optimise the weights over the whole active atom set after every
 * addition, which is a small smooth convex problem on the simplex.
 */
function frankWolfe(P, GR, opts = {}) {
  const outer = opts.iters || 500, inner = opts.inner || 60;
  /* one block per bin when the kernel is a point, two when it is an interval —
     buildGrid sizes its vectors the same way, and reading past them gave NaN. */
  const n2 = (P.single ? 1 : 2) * P.m;
  const V = GR.V, G = V.length;
  const p = new Float64Array(n2), q = new Float64Array(n2), d = new Float64Array(n2);
  let S = [0], lam = Float64Array.from([1]);

  const mix = (S, lam) => { p.fill(0); for (let i = 0; i < S.length; i++) { const A = V[S[i]], w = lam[i]; for (let t = 0; t < n2; t++) p[t] += w * A[t]; } };
  const resid = () => { clampBox(P, p, q); let s = 0; for (let t = 0; t < n2; t++) { d[t] = p[t] - q[t]; s += d[t] * d[t]; } return s; };
  const dot = (a, b) => { let s = 0; for (let t = 0; t < n2; t++) s += a[t] * b[t]; return s; };

  let L = 0; for (let g = 0; g < G; g++) { let s = 0; const A = V[g]; for (let t = 0; t < n2; t++) s += A[t] * A[t]; if (s > L) L = s; }
  const step = 1 / Math.max(L, 1e-30);

  mix(S, lam);
  let dist2 = resid();
  for (let it = 0; it < outer; it++) {
    /* linear oracle over the whole grid */
    let bg = -1, bv = Infinity;
    for (let g = 0; g < G; g++) { const v = dot(d, V[g]); if (v < bv) { bv = v; bg = g; } }
    if (bg < 0) break;
    if (bv >= dot(d, p) - 1e-20 && it > 0) break;          /* separated: no atom helps */
    if (!S.includes(bg)) { S = S.concat([bg]); const nl = new Float64Array(S.length); nl.set(lam); nl[S.length - 1] = 0; lam = nl; }
    /* fully corrective: projected gradient on the simplex over the active set */
    for (let k2 = 0; k2 < inner; k2++) {
      mix(S, lam); resid();
      const g = new Float64Array(S.length);
      for (let i = 0; i < S.length; i++) g[i] = dot(V[S[i]], d);
      const trial = new Float64Array(S.length);
      for (let i = 0; i < S.length; i++) trial[i] = lam[i] - step * g[i];
      lam = projSimplex(trial);
    }
    mix(S, lam);
    const nd = resid();
    if (nd >= dist2 * (1 - 1e-14) && it > 4) { dist2 = nd; break; }
    dist2 = nd;
    if (dist2 <= 0) break;
    if ((it & 15) === 15) {                                  /* prune dust */
      const keep = [];
      for (let i = 0; i < S.length; i++) if (lam[i] > 1e-13) keep.push(i);
      if (keep.length && keep.length < S.length) {
        S = keep.map(i => S[i]);
        const nl = new Float64Array(S.length);
        let tot = 0; for (let i = 0; i < keep.length; i++) { nl[i] = lam[keep[i]]; tot += nl[i]; }
        for (let i = 0; i < nl.length; i++) nl[i] /= tot;
        lam = nl; mix(S, lam); dist2 = resid();
      }
    }
  }
  mix(S, lam); dist2 = resid();
  const atoms = [];
  for (let i = 0; i < S.length; i++) if (lam[i] > 1e-13) atoms.push({ g: S[i], w: lam[i] });
  let tot = 0; for (const a of atoms) tot += a.w; for (const a of atoms) a.w /= tot;
  return { dist2, y: Float64Array.from(d), atoms, p: Float64Array.from(p) };
}

/* ---- rigorous verification ------------------------------------------------ */

/* max over the box of <y, q>, exactly */
function boxMax(P, y) {
  if (P.shape === 'ball') {
    let dot = 0, n2 = 0;
    for (let j = 0; j < P.m; j++) { dot += y[j] * P.d[j]; const t = y[j] * P.sig[j]; n2 += t * t; }
    return dot + P.R * Math.sqrt(n2);
  }
  let s = 0;
  for (let j = 0; j < P.m; j++) {
    if (P.single) { s += y[j] > 0 ? y[j] * P.hi[j] : y[j] * P.lo[j]; continue; }
    if (y[j] > 0) s += y[j] * P.hi[j]; else if (y[j] < 0) return Infinity;
    if (y[P.m + j] < 0) s += y[P.m + j] * P.lo[j]; else if (y[P.m + j] > 0) return Infinity;
  }
  return s;
}

/* certified min over r in [0,1] of h(r) = SUM a_j Wlo_j(r) - SUM b_j Whi_j(r),
   by adaptive interval subdivision. Returns { min, cells, resolved }. */
function certifiedMin(P, y, target, opts = {}) {
  const maxCells = opts.maxCells || 300000, minW = opts.minWidth || 1e-11;
  /* the multiplier is SPARSE — only the bins whose box side is actually active
     carry weight — so the scan touches a handful of kernels, not all of them */
  const act = [];
  for (let j = 0; j < P.m; j++) {
    const a = P.single ? Math.max(0, y[j]) : (y[j] > 0 ? y[j] : 0);
    const b = P.single ? Math.max(0, -y[j]) : (y[P.m + j] < 0 ? -y[P.m + j] : 0);
    if (a !== 0 || b !== 0) act.push([j, a, b]);
  }
  const hlo = X => {
    let s = 0;
    for (let i = 0; i < act.length; i++) {
      const [j, a, b] = act[i], A = kIv(P, j, X);
      if (a !== 0) s += a * A[0];
      if (b !== 0) s -= b * A[1];
    }
    return s;
  };
  /* min over cells of hlo IS a rigorous lower bound on min_r h(r), whether or
     not a cell was subdivided, so it is tracked over every cell examined and
     reported as the certified minimum. */
  let stack = [[0, 1]], lowest = Infinity, cells = 0;
  while (stack.length) {
    const X = stack.pop(); cells++;
    const v = hlo(X);
    if (cells > maxCells) return { min: Math.min(lowest, v), cells, resolved: false, active: act.length };
    if (v > target) { lowest = Math.min(lowest, v); continue; }
    if (X[1] - X[0] <= minW) { lowest = Math.min(lowest, v); continue; }
    const mid = 0.5 * (X[0] + X[1]);
    stack.push([X[0], mid], [mid, X[1]]);
  }
  return { min: lowest, cells, resolved: true, active: act.length };
}

/* Does the certificate hold? min_r h(r) must EXCEED the box maximum. */
function verifyRefutation(P, y, opts) {
  const bm = boxMax(P, y);
  if (!Number.isFinite(bm)) return { ok: false, why: 'multiplier has the wrong sign' };
  const { min, cells, resolved } = certifiedMin(P, y, bm, opts);
  return { ok: resolved && min > bm, margin: min - bm, boxMax: bm, minH: min, cells, resolved };
}

/* Re-check a witness from scratch as a measure: atoms, weights, every bin.
   The bin is satisfiable when the interval [INT Wlo dmu, INT Whi dmu] meets
   [l_j, u_j] — because the true kernel lies between the two endpoints and mu is
   nonnegative, some geometry in the box realises every value in between. */
function verifyWitness(P, atoms, grid) {
  let sw = 0;
  for (const a of atoms) { if (a.w < 0) return { ok: false, why: 'negative atom' }; sw += a.w; }
  if (Math.abs(sw - 1) > 1e-9) return { ok: false, why: `mass ${sw}` };
  let worst = 0, at = -1, chi2 = 0;
  for (let j = 0; j < P.m; j++) {
    let lo = [0, 0], hi = [0, 0];
    for (const a of atoms) {
      const x = grid[a.g], A = kIv(P, j, [x, x]), W = [a.w, a.w];
      lo = I.add(lo, I.mul(W, [A[0], A[0]]));
      hi = I.add(hi, I.mul(W, [A[1], A[1]]));
    }
    if (P.shape === 'ball') {
      const e = Math.max(0, Math.max(P.d[j] - hi[1], lo[0] - P.d[j])) / P.sig[j];
      chi2 += e * e; continue;
    }
    const v = Math.max(P.lo[j] - hi[1], lo[0] - P.hi[j], 0);
    if (v > worst) { worst = v; at = j; }
  }
  if (P.shape === 'ball') {
    const ok = chi2 <= P.R * P.R;
    return { ok, chi2dof: chi2 / P.m, budget: P.R * P.R / P.m, atoms: atoms.length };
  }
  return { ok: worst === 0, violation: worst, bin: at, atoms: atoms.length };
}

/* ---- decide one k --------------------------------------------------------- *
 * Order matters. Try to ADMIT first — a verified witness is a positive fact and
 * costs nothing to check — and only then try to REFUTE. Neither verdict trusts
 * the optimiser: the witness is re-checked as a measure against every bin, and
 * the certificate is re-checked over the continuum by interval subdivision.
 *
 * The witness is sought against a box shrunk by `shrink` of its half-width, so
 * that landing near the shrunk box puts it strictly inside the real one. A
 * conservative shrink can only lose an admission, never invent one.
 */
function decide(bins, k, rung, geom, budget, opts = {}) {
  const P = makeProblem(bins, k, rung, geom, budget);
  const GR = buildGrid(P, opts.grid || 1200);
  const fw = frankWolfe(P, GR, opts);

  const tryWitness = (Q) => {
    const f = frankWolfe(Q, GR, opts);
    const w = verifyWitness(P, f.atoms, GR.grid);
    return w.ok ? { w, atoms: f.atoms } : null;
  };

  const w0 = verifyWitness(P, fw.atoms, GR.grid);
  let adm = w0.ok ? { w: w0, atoms: fw.atoms } : null;
  /* A witness that lands ON the boundary fails its own re-check, so the search
     is repeated against a shrunk admissible set. A shrink can only lose an
     admission, never invent one, so trying several is sound. */
  /* the shrink ladder is coarse-to-fine AND ends fine: a near-atomic witness
     (a star with a bright ring) only landed inside once a 2% shrink was tried,
     because a big shrink moves the target off the hull entirely. */
  for (const sh of (opts.shrinks || [0.30, 0.10, 0.55, 0.02, 0.005])) {
    if (adm) break;
    const Q = makeProblem(bins, k, rung, geom, budget);
    if (Q.shape === 'ball') Q.R *= (1 - sh);
    else for (let j = 0; j < Q.m; j++) { const h = 0.5 * (Q.hi[j] - Q.lo[j]) * sh; Q.lo[j] += h; Q.hi[j] -= h; }
    adm = tryWitness(Q);
  }
  if (adm) return { k, verdict: 'admitted', witness: adm.w, atoms: adm.atoms.map(a => ({ x: GR.grid[a.g], w: a.w })) };

  const v = verifyRefutation(P, fw.y, opts);
  if (v.ok) return { k, verdict: 'refuted', cert: v };
  return { k, verdict: 'undecided', why: 'neither a witness nor a certificate verified', cert: v };
}

/* ---- the bracket ---------------------------------------------------------- *
 * Outer: every k outside [kOutLo, kOutHi] carries a verified refutation.
 * Inner: every k inside [kInLo, kInHi] carries a verified witness.
 * The gap between them is the solver's looseness and is reported, not hidden.
 */
function bracket(bins, rung, geom, budget, opts = {}) {
  const k0 = opts.k0, span = opts.span || 0.25, steps = opts.steps || 24;
  const probe = k => decide(bins, k, rung, geom, budget, opts);
  /* coarse scan for an admitted seed */
  let seed = null;
  for (let i = 0; i <= steps; i++) {
    const k = k0 * (1 - span + 2 * span * i / steps);
    const r = probe(k);
    if (opts.trace) opts.trace(r);
    if (r.verdict === 'admitted') { seed = k; break; }
  }
  if (seed === null) return { ok: false, why: 'no admitted k found in the scan' };
  const edge = (dir) => {
    /* walk out until refuted, then bisect between admitted and refuted */
    let good = seed, bad = null, step = 0.02 * k0;
    for (let i = 0; i < 40 && bad === null; i++) {
      const k = good + dir * step;
      if (k <= 0 || k > 1) { bad = k; break; }
      const r = probe(k);
      if (opts.trace) opts.trace(r);
      if (r.verdict === 'refuted') bad = k; else if (r.verdict === 'admitted') good = k; else { step *= 1.6; }
      if (bad === null) step *= 1.35;
    }
    if (bad === null) return { in: good, out: null };
    for (let i = 0; i < (opts.bisect || 14); i++) {
      const mid = 0.5 * (good + bad);
      const r = probe(mid);
      if (opts.trace) opts.trace(r);
      if (r.verdict === 'refuted') bad = mid; else if (r.verdict === 'admitted') good = mid; else break;
    }
    return { in: good, out: bad };
  };
  const hi = edge(+1), lo = edge(-1);
  return {
    ok: true, seed,
    inner: [lo.in, hi.in],
    outer: [lo.out === null ? 0 : lo.out, hi.out === null ? 1 : hi.out]
  };
}

module.exports = {
  lensAreaG, lensAreaGIv, RUNGS, makeProblem, buildGrid, frankWolfe,
  boxMax, certifiedMin, verifyRefutation, verifyWitness, decide, bracket, zSpan
};
