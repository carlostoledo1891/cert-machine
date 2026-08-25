/* henon-census.js — a COMPLETE census of the period-p points of the Hénon map,
   by interval branch-and-bound.

   WHAT THIS ADDS OVER KRAWCZYK ALONE. The henon-orbits family certifies
   existence and uniqueness of orbits that float Newton happened to find — a
   LOWER bound on the orbit count, and the family says so in its own REJECT
   text. This instrument closes the other side: it exhausts the phase plane, so
   the output is

       the Hénon map at (a,b) has EXACTLY N points of period p,
       every one enclosed in a certified uniqueness box.

   THE ARGUMENT, in four certified steps.

   1. A PRIORI BOUND. On any periodic orbit, at the index m of maximal modulus
      mu = |x_m|, the recurrence x_{m+1} = 1 - a x_m^2 + b x_{m-1} gives
      |a| mu^2 <= 1 + (1+|b|) mu. So with g(t) = |a| t^2 - (1+|b|) t - 1, any
      M past the vertex of g with g(M) > 0 VERIFIED IN INTERVAL ARITHMETIC
      confines every periodic point of every period to (-M, M)^2 in the
      (x_0, x_1) plane. The search region is closed under the mathematics, not
      chosen by eye.

   2. EXCLUSION BY TUBE. A period-p point is a pair (x_0, x_1); the recurrence
      determines x_2..x_{p+1}, and periodicity says x_p = x_0, x_{p+1} = x_1.
      Iterating the recurrence in outward-rounded intervals from a box
      (U, V), clamping every step to [-M, M], and intersecting the wrapped
      indices: an EMPTY intersection anywhere proves the box contains no
      period-p point. (Interval extensions are inclusion-monotone, so a
      refinement pass with the tightened endpoints only shrinks the tube.)

   3. RESOLUTION BY KRAWCZYK. Where the tube cannot exclude, evaluate the
      Krawczyk operator of the p-dimensional system
          F_n(x) = 1 - a x_n^2 + b x_{n-1} - x_{n+1} = 0   (indices mod p)
      on the tube box W. K(W) disjoint from W proves NO zero in W — the box is
      excluded. K(W) strictly interior to W proves EXACTLY ONE zero in W
      (Krawczyk/Moore), which absorbs every period-p point of the 2D box at
      once. The zero is then shrunk to a tight box S by iterating
      X <- K(X) ∩ X (each iterate provably still contains the zero), and an
      inflated uniqueness box U around it is certified for robust identity
      tests. Neither test decides -> bisect. Budget or depth exhausted -> the
      WHOLE census refuses. It can never return a wrong count.

   4. IDENTITY AND MINIMAL PERIOD, decided by certificates, not by floats.
      Two resolved zeros are THE SAME iff one tight box lies inside the
      other's certified uniqueness domain; DISTINCT iff their tight boxes are
      disjoint; anything else refuses. The system is equivariant under the
      cyclic shift sigma(x)_n = x_{n+1 mod p} — F(sigma x) = sigma F(x) — so
      the shift of a certified zero is a certified zero, and following
      shift-links partitions the N points into orbits whose cycle length IS
      the minimal period. No tolerance comparison decides anything.

   Fixed points of H^p correspond bijectively to period-p sequences (the state
   is (x_{n-1}, x_n) with y = b x_{n-1}, and b != 0 makes the sequence
   recoverable both ways), so N is exactly the number of fixed points of the
   p-th iterate of the map — the count Galias-style computer-assisted proofs
   report, here produced by the engine as one certificate per (a, b, p).

   MIT licensed. Part of cert-machine; NOT part of the lifted eqcert tree —
   it consumes instruments/interval/ and never modifies it. */
'use strict';

const IV = require('#instruments/interval/interval.js');
const { iv, add, sub, mul, sqr, interior, nextUp, nextDown, ONE } = IV;

class Refuse extends Error {}

/* ---------- interval box helpers ---------- */
const isect = (x, y) => {
  const lo = Math.max(x[0], y[0]), hi = Math.min(x[1], y[1]);
  return lo <= hi ? [lo, hi] : null;
};
const maxWidth = (B) => Math.max.apply(null, B.map(w => w[1] - w[0]));
const subsetBox = (A, B) => A.every((a, i) => B[i][0] <= a[0] && a[1] <= B[i][1]);
const disjointBox = (A, B) => A.some((a, i) => a[1] < B[i][0] || a[0] > B[i][1]);
const rotate1 = (B) => B.map((_, n) => B[(n + 1) % B.length]);

/* ---------- 1. the a priori bound ---------- */
function aprioriBound(a, b) {
  if (!(Math.abs(a) > 0)) return { ok: false, why: 'a = 0: the recurrence is affine and the quadratic bound argument does not apply' };
  const aa = Math.abs(a), c = 1 + Math.abs(b);
  const vtxUp = IV.div(iv(c), iv(2 * aa))[1];            /* upper bound of the vertex of g */
  let M = (c + Math.sqrt(c * c + 4 * aa)) / (2 * aa) * (1 + 1e-9) + 1e-12;
  for (let t = 0; t < 80; t++) {
    /* g(M) = |a| M^2 - c M - 1, enclosed; g increasing past the vertex, so
       g(M) > 0 with M past the vertex proves mu < M for every periodic mu */
    const g = sub(sub(mul(iv(aa), sqr(iv(M))), mul(iv(c), iv(M))), ONE);
    if (g[0] > 0 && M > vtxUp) return { ok: true, M };
    M = M * (1 + 1e-6);
  }
  return { ok: false, why: 'the a priori bound did not verify in interval arithmetic' };
}

/* ---------- float layer: candidates and preconditioners. Proves nothing. ---------- */
function residualF(v, a, b) {
  const p = v.length, r = new Array(p);
  for (let n = 0; n < p; n++)
    r[n] = 1 - a * v[n] * v[n] + b * v[(n - 1 + p) % p] - v[(n + 1) % p];
  return r;
}
function jacF(v, a, b) {
  const p = v.length;
  const J = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let n = 0; n < p; n++) {
    J[n][n] += -2 * a * v[n];
    J[n][(n - 1 + p) % p] += b;
    J[n][(n + 1) % p] += -1;
  }
  return J;
}
function inverse(M) {
  const n = M.length;
  const A = M.map((row, i) => row.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    if (Math.abs(A[piv][c]) < 1e-14) return null;
    if (piv !== c) { const t = A[piv]; A[piv] = A[c]; A[c] = t; }
    const d = A[c][c];
    for (let j = 0; j < 2 * n; j++) A[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c];
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j];
    }
  }
  return A.map(row => row.slice(n));
}
function newtonF(v0, a, b, iters) {
  let v = v0.slice();
  for (let k = 0; k < (iters || 60); k++) {
    const r = residualF(v, a, b);
    const Ji = inverse(jacF(v, a, b));
    if (!Ji) return null;
    let mx = 0;
    for (let i = 0; i < v.length; i++) {
      let s = 0;
      for (let j = 0; j < v.length; j++) s += Ji[i][j] * r[j];
      v[i] -= s; mx = Math.max(mx, Math.abs(s));
    }
    if (!v.every(Number.isFinite)) return null;
    if (mx < 1e-14) break;
  }
  return v;
}

/* ---------- 2. the tube ---------- */
/* From (U,V) enclosing (x_0,x_1): iterate to X_{p+1} in intervals, clamp to
   [-M,M], and intersect indices mod p. Returns the p-dim box W, or null —
   null is a PROOF that no period-p point has (x_0,x_1) in the input box. */
function tubeBox(U, V, a, b, p, M, refine) {
  const IA = iv(a), IB = iv(b), CL = [-M, M];
  let W0 = U, W1 = V, W = null;
  for (let pass = 0; pass <= (refine == null ? 1 : refine); pass++) {
    const X = new Array(p + 2);
    X[0] = isect(W0, CL); if (!X[0]) return null;
    X[1] = isect(W1, CL); if (!X[1]) return null;
    for (let n = 2; n <= p + 1; n++) {
      const t = add(sub(ONE, mul(IA, sqr(X[n - 1]))), mul(IB, X[n - 2]));
      X[n] = isect(t, CL); if (!X[n]) return null;
    }
    const Wn = X.slice(0, p);
    for (let t = p; t <= p + 1; t++) {
      const n = t % p;
      Wn[n] = isect(Wn[n], X[t]); if (!Wn[n]) return null;
    }
    W = Wn; W0 = W[0]; W1 = W[1 % p];
  }
  return W;
}

/* ---------- 3. Krawczyk on a given box ---------- */
/* K(W) = m - A F(m) + (I - A DF(W))(W - m), every operation outward-rounded.
   'disjoint': no zero of F in W, proved.  'interior': exactly one, proved
   (strict interior containment — subset is NOT accepted).  'none': undecided. */
function kOnBox(a, b, p, W) {
  const m = W.map(w => (w[0] + w[1]) / 2);
  const A = inverse(jacF(m, a, b));
  if (!A) return { status: 'none' };

  const Fm = new Array(p);
  for (let n = 0; n < p; n++) {
    let t = sub(ONE, mul(iv(a), sqr(iv(m[n]))));
    t = add(t, mul(iv(b), iv(m[(n - 1 + p) % p])));
    Fm[n] = sub(t, iv(m[(n + 1) % p]));
  }
  const J = Array.from({ length: p }, () => Array.from({ length: p }, () => iv(0)));
  for (let n = 0; n < p; n++) {
    J[n][n] = add(J[n][n], mul(iv(-2 * a), W[n]));
    const pm = (n - 1 + p) % p, np = (n + 1) % p;
    J[n][pm] = add(J[n][pm], iv(b));
    J[n][np] = add(J[n][np], iv(-1));
  }

  const K = new Array(p);
  let allInterior = true;
  for (let i = 0; i < p; i++) {
    let d = iv(0);
    for (let j = 0; j < p; j++) d = add(d, mul(iv(A[i][j]), Fm[j]));
    let acc = sub(iv(m[i]), d);
    for (let j = 0; j < p; j++) {
      let s = iv(0);
      for (let k = 0; k < p; k++) {
        const jk = J[k][j];
        if (jk[0] === 0 && jk[1] === 0) continue;
        s = add(s, mul(iv(A[i][k]), jk));
      }
      let Mij = [-s[1], -s[0]];
      if (i === j) Mij = add(ONE, Mij);
      if (Mij[0] === 0 && Mij[1] === 0) continue;
      acc = add(acc, mul(Mij, sub(W[j], iv(m[j]))));
    }
    K[i] = acc;
    if (acc[1] < W[i][0] || acc[0] > W[i][1]) return { status: 'disjoint', K };
    if (!interior(acc, W[i])) allInterior = false;
  }
  return { status: allInterior ? 'interior' : 'none', K };
}

/* ---------- resolved zero -> tight box S, uniqueness domain U ---------- */
function resolveRecord(a, b, p, W, first) {
  /* Near a bifurcation the Krawczyk contraction rate approaches 1, so the
     shrink is PATIENT: slow linear progress still converges, and a box that
     will not shrink below 1e-8 is not recorded at all — the census bisects
     instead. (An early version broke off at <30% improvement per round and
     recorded a 1e-1-wide box at a=0.96, p=4, which the shift-classification
     then rightly refused. A fat record can now never exist.) */
  let cur = W, K = first.K;
  for (let t = 0; t < 400; t++) {
    const next = new Array(p);
    for (let i = 0; i < p; i++) {
      const s = isect(K[i], cur[i]);
      if (!s) throw new Refuse('shrinking a certified box emptied it — inconsistent certificates');
      next[i] = s;
    }
    const before = maxWidth(cur);
    cur = next;
    if (maxWidth(cur) < 1e-12 || maxWidth(cur) > before * 0.97) break;
    const r = kOnBox(a, b, p, cur);
    if (!r.K) break;
    K = r.K;
  }
  const S = cur;
  if (maxWidth(S) > 1e-8) return null;   /* undecided — caller bisects */
  const z = S.map(w => (w[0] + w[1]) / 2);

  /* inflate: the largest certified uniqueness box around the zero, so that
     identity and shift tests compare a ~1e-12 box against a >=1e-6 domain */
  let U = null;
  for (const r of [1e-3, 1e-4, 1e-5, 1e-6]) {
    const cand = z.map(zi => [nextDown(zi - r), nextUp(zi + r)]);
    if (!subsetBox(S, cand)) continue;
    if (kOnBox(a, b, p, cand).status === 'interior') { U = cand; break; }
  }
  if (!U) U = W;                       /* uniqueness in W is already certified */
  return { z, S, U };
}

/* Same zero iff one tight box sits inside the other's certified uniqueness
   domain; distinct iff the tight boxes are disjoint. Anything else refuses. */
function addRecord(records, rec) {
  for (const r of records) {
    if (subsetBox(rec.S, r.U)) return false;
    if (subsetBox(r.S, rec.U)) return false;
    if (!disjointBox(rec.S, r.S))
      throw new Refuse('two certified boxes overlap without a containment decision');
  }
  records.push(rec);
  return true;
}

/* ---------- 4. shift-links -> orbits and minimal periods ---------- */
function classify(records, p) {
  const n = records.length;
  const link = new Array(n);
  for (let i = 0; i < n; i++) {
    const rot = rotate1(records[i].S);
    const js = [];
    for (let j = 0; j < n; j++) if (subsetBox(rot, records[j].U)) js.push(j);
    if (js.length !== 1)
      throw new Refuse('the shift of a certified zero matched ' + js.length + ' records (must be exactly 1)');
    link[i] = js[0];
  }
  const seen = new Array(n).fill(false);
  const orbits = [];
  for (let i = 0; i < n; i++) {
    if (seen[i]) continue;
    const members = [];
    let j = i;
    do { seen[j] = true; members.push(j); j = link[j]; } while (j !== i && members.length <= n);
    const d = members.length;
    if (p % d !== 0) throw new Refuse('a shift-cycle of length ' + d + ' does not divide the period ' + p);
    orbits.push({ minimalPeriod: d, members });
  }
  return orbits;
}

/* ---------- the census ---------- */
function census(a, b, p, opts) {
  opts = opts || {};
  const t0 = Date.now();
  const maxBoxes = opts.maxBoxes || 4e6;
  const maxDepth = opts.maxDepth || 64;
  const kTubeWidth = opts.kTubeWidth || 0.5;   /* attempt Krawczyk when the tube is this tight */
  const stats = { boxes: 0, tubeExcluded: 0, kExcluded: 0, resolved: 0, kCalls: 0, maxDepth: 0 };

  const bound = aprioriBound(a, b);
  if (!bound.ok) return { ok: false, why: bound.why, stats };
  let M = bound.M;
  /* RED-CONTROL HOOK: deliberately under-covers the plane; recheckCensus must
     catch the periodic points the shrunken bound cuts off. Never set in real runs. */
  if (opts.sabotage === 'shrinkBound') M = M * 0.45;

  const records = [];
  const stack = [{ u: [-M, M], v: [-M, M], depth: 0 }];
  try {
    while (stack.length) {
      if (++stats.boxes > maxBoxes)
        return { ok: false, why: 'box budget exhausted (' + maxBoxes + ') — absence of proof, not a count', stats };
      const B = stack.pop();
      stats.maxDepth = Math.max(stats.maxDepth, B.depth);

      const W = tubeBox(B.u, B.v, a, b, p, M, opts.refine);
      if (!W) { stats.tubeExcluded++; continue; }

      /* Krawczyk as a CONTRACTION, not only a one-shot test. Near a strongly
         unstable orbit the tube box is violently anisotropic (later
         coordinates ~Lambda x wider), and no single interior test can close.
         But every zero of T lies in K(T), so T <- K(T) ∩ T is a sound pruning
         step: it rebalances the box toward the zero's own scale, after which
         'interior' or 'disjoint' decides. Undecided after that -> bisect. */
      if (maxWidth(W) <= kTubeWidth) {
        let T = W, decided = false;
        for (let round = 0; round < 8; round++) {
          stats.kCalls++;
          const r = kOnBox(a, b, p, T);
          if (r.status === 'disjoint') { stats.kExcluded++; decided = true; break; }
          if (r.status === 'interior') {
            const rec = resolveRecord(a, b, p, T, r);
            if (!rec) break;             /* would not shrink — bisect instead */
            addRecord(records, rec);
            stats.resolved++;
            decided = true; break;
          }
          if (!r.K) break;                     /* singular preconditioner */
          /* 'none' guarantees every coordinate of K meets T, so this is nonempty */
          const next = T.map((t, i) => isect(r.K[i], t));
          if (next.some(t => !t)) { stats.kExcluded++; decided = true; break; }
          const before = maxWidth(T);
          T = next;
          if (maxWidth(T) > 0.75 * before) break;
        }
        if (decided) continue;
      }

      if (B.depth >= maxDepth)
        return { ok: false, why: 'depth cap at box u=[' + B.u + '] v=[' + B.v + '] — likely near-parabolic orbit; absence of proof, not a count', stats };
      const du = B.u[1] - B.u[0], dv = B.v[1] - B.v[0];
      if (du >= dv) {
        const m = (B.u[0] + B.u[1]) / 2;
        stack.push({ u: [B.u[0], m], v: B.v, depth: B.depth + 1 });
        stack.push({ u: [m, B.u[1]], v: B.v, depth: B.depth + 1 });
      } else {
        const m = (B.v[0] + B.v[1]) / 2;
        stack.push({ u: B.u, v: [B.v[0], m], depth: B.depth + 1 });
        stack.push({ u: B.u, v: [m, B.v[1]], depth: B.depth + 1 });
      }
    }

    const orbits = classify(records, p).map(o => {
      const rep = records[Math.min.apply(null, o.members)];
      return { minimalPeriod: o.minimalPeriod, points: o.members.length,
               vector: rep.z.slice(), box: rep.S.map(w => [w[0], w[1]]) };
    });
    const byMinimalPeriod = {};
    for (const o of orbits) byMinimalPeriod[o.minimalPeriod] = (byMinimalPeriod[o.minimalPeriod] || 0) + 1;

    return {
      ok: true, a, b, p, bound: M,
      points: records.length,
      orbits, byMinimalPeriod,
      records: records.map(r => ({ z: r.z.slice(), S: r.S.map(w => [w[0], w[1]]) })),
      stats, ms: Date.now() - t0
    };
  } catch (e) {
    if (e instanceof Refuse) return { ok: false, why: e.message, stats };
    throw e;
  }
}

/* ---------- independent float recheck (a control, not a certificate) ----------
   Dense multistart Newton; every converged period-p point must land inside a
   recorded zero. A census with a record deleted, or run with a sabotaged
   bound, fails here. */
function recheckCensus(a, b, p, result, opts) {
  opts = opts || {};
  if (!result || !result.ok) return { ok: false, why: 'no completed census to recheck' };
  const starts = opts.starts || 400;
  const bound = aprioriBound(a, b);
  const M = bound.ok ? bound.M : 3;
  const g = 0.6180339887498949;
  let converged = 0, unmatched = 0;
  for (let s = 0; s < starts; s++) {
    const v0 = new Array(p);
    for (let n = 0; n < p; n++) v0[n] = -M + 2 * M * (((s + 1) * g * (n + 1)) % 1);
    const v = newtonF(v0, a, b, 80);
    if (!v) continue;
    const res = Math.max.apply(null, residualF(v, a, b).map(Math.abs));
    if (res > 1e-10) continue;
    if (v.some(x => Math.abs(x) > M)) continue;
    converged++;
    const hit = result.records.some(r => v.every((x, i) => Math.abs(x - r.z[i]) < 1e-6));
    if (!hit) unmatched++;
  }
  return { ok: unmatched === 0, converged, unmatched };
}

module.exports = { census, recheckCensus, aprioriBound, tubeBox, kOnBox, newtonF, residualF };
