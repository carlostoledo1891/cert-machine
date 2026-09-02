/* EMBER P2a-2 — certified LOWER eigenvalue bounds via Crouzeix–Raviart +
   Liu's explicit-constant theorem, giving two-sided enclosures for the
   steep-trapezoid specimen (upper bounds from P2a-1 / run-p2a.js).

   THE THEOREM CHAIN (verified against the papers 2026-09-01, see PHASE2.md):
   - Framework Thm 2.4 (Liu 2015, Appl.Math.Comput.; quoted in You–Xie–Liu
     arXiv:1808.08148 §2): if ‖u−P_h u‖_N ≤ C_h ‖u−P_h u‖_M for the
     M-projection P_h onto V_h, then λ_k ≥ λ_{h,k}/(1 + C_h² λ_{h,k}).
   - Lemma 3.2 (Liu; quoted ibid.): for ANY triangle K with longest edge
     h_K, the CR interpolation satisfies
       ‖u − Π_h u‖_{0,K} ≤ 0.1893 h_K |u − Π_h u|_{1,K}.
   - Neumann configuration: V = mean-zero H¹, V_h = mean-zero CR space,
     M = broken-gradient inner product, N = L². Π_h is ∇_h-orthogonal
     (eq. 3.11 ibid.), and P_h u = Π_h u − mean(Π_h u): subtracting a mean
     only DECREASES the L² norm, so
       ‖u−P_hu‖_N ≤ ‖u−Π_hu‖_N ≤ 0.1893 h_max |u−Π_hu|_M = 0.1893 h_max |u−P_hu|_M,
     i.e. (2.9) holds with C_h = 0.1893·h_max. Hence for the k-th NONZERO
     Neumann eigenvalue (= full-pencil eigenvalue k+1):
       μ_k ≥ λ_{h,k+1} / (1 + C_h² λ_{h,k+1}).
   Literature citations (constant 0.1893, framework hypotheses incl. CR
   discrete compactness) are the certificate's two citation points.

   THE COMPUTATION (everything below is certified, floats only locate):
   - CR assembly on the mapped n×n grid triangulation with EXACT RATIONAL
     vertices: K entries g_i·g_j/A exact rationals; M is DIAGONAL |T|/3.
   - K·1 = 0 checked EXACTLY (rational row sums) — the zero mode is exact.
   - h_max² = exact rational max edge length²; C_h² = (1893/10000)²·h_max².
   - Discrete lower bounds λ_{h,k} ≥ σ_k by INERTIA: interval LDLᵀ of
     K − σ_k M with certified pivot signs (Sylvester); #negatives = #eigs
     below σ_k. σ_k is picked 1e-4 below the float eigenvalue and converted
     EXACTLY via Q.fromDouble.
   - Final bound σ/(1+C²σ) evaluated with outward rounding, lower end. */
'use strict';

const I = require('../../lib/eqcert/interval.js');
const Q = require('../../lib/eqcert/rational.js');

let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (detail ? ' — ' + detail : ''));
  if (!cond) failures++;
}
const r = (n, d) => Q.R(BigInt(n), BigInt(d === undefined ? 1 : d));
function ratToIv(a) {
  const q0 = Q.toDouble(a);
  let lo = q0, hi = q0;
  for (let w = 0; w < 60; w++) {
    if (Q.inClosed(a, lo, hi)) return [lo, hi];
    lo = I.nextDown(lo); hi = I.nextUp(hi);
  }
  throw new Error('ratToIv: containment never verified');
}

/* ---------- rational CR assembly on the mapped grid ---------- */
function buildCR(spec, n) {
  const { b, w1, dx, h } = spec;
  // rational node coordinates
  const N = n + 1;
  const X = [], Y = [];
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const u = r(i, n), v = r(j, n);
      const w = Q.add(b, Q.mul(w1, v));
      X.push(Q.add(Q.mul(u, w), Q.mul(dx, v)));
      Y.push(Q.mul(h, v));
    }
  }
  // triangles + edge numbering
  const edgeId = new Map();
  const edges = [];
  const eid = (p, q2) => {
    const key = p < q2 ? p + ':' + q2 : q2 + ':' + p;
    if (!edgeId.has(key)) { edgeId.set(key, edges.length); edges.push([Math.min(p, q2), Math.max(p, q2)]); }
    return edgeId.get(key);
  };
  const tris = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const a = j * N + i, bb = a + 1, c = a + N, d = c + 1;
    tris.push([a, bb, d], [a, d, c]);
  }
  for (const [p1, p2, p3] of tris) { eid(p1, p2); eid(p2, p3); eid(p3, p1); }
  const ndof = edges.length;
  const K = Array.from({ length: ndof }, () => new Map());
  const Md = Array.from({ length: ndof }, () => Q.ZERO);
  let hmax2 = Q.ZERO;
  const q2gt = (a2, b2) => Q.cmp(a2, b2) > 0;
  for (const [p1, p2, p3] of tris) {
    const x1 = X[p1], y1 = Y[p1], x2 = X[p2], y2 = Y[p2], x3 = X[p3], y3 = Y[p3];
    // 2A = (x2-x1)(y3-y1)-(x3-x1)(y2-y1) > 0 (orientation preserved by the map)
    const twoA = Q.sub(Q.mul(Q.sub(x2, x1), Q.sub(y3, y1)), Q.mul(Q.sub(x3, x1), Q.sub(y2, y1)));
    if (Q.sign(twoA) <= 0) throw new Error('non-positive triangle');
    const A = Q.div(twoA, r(2));
    // g_i = (y_j - y_k, x_k - x_j), (i,j,k) cyclic; K_ij = g_i·g_j / A
    const g = [
      [Q.sub(y2, y3), Q.sub(x3, x2)],
      [Q.sub(y3, y1), Q.sub(x1, x3)],
      [Q.sub(y1, y2), Q.sub(x2, x1)],
    ];
    // CR dof i lives on the edge OPPOSITE vertex i
    const ids = [eid(p2, p3), eid(p3, p1), eid(p1, p2)];
    for (let a2 = 0; a2 < 3; a2++) {
      for (let b2 = 0; b2 < 3; b2++) {
        const val = Q.div(Q.add(Q.mul(g[a2][0], g[b2][0]), Q.mul(g[a2][1], g[b2][1])), A);
        const row = K[ids[a2]];
        row.set(ids[b2], Q.add(row.get(ids[b2]) || Q.ZERO, val));
      }
      Md[ids[a2]] = Q.add(Md[ids[a2]], Q.div(A, r(3)));
    }
    // edge lengths (for h_max): the three side length² of this triangle
    for (const [pa, pb] of [[p1, p2], [p2, p3], [p3, p1]]) {
      const l2 = Q.add(Q.mul(Q.sub(X[pa], X[pb]), Q.sub(X[pa], X[pb])),
                       Q.mul(Q.sub(Y[pa], Y[pb]), Q.sub(Y[pa], Y[pb])));
      if (q2gt(l2, hmax2)) hmax2 = l2;
    }
  }
  return { K, Md, ndof, hmax2 };
}

/* exact check: constants are in the kernel — every K row sums to 0 exactly */
function checkKernelExact(K) {
  for (const row of K) {
    let s = Q.ZERO;
    for (const v of row.values()) s = Q.add(s, v);
    if (!Q.isZero(s)) return false;
  }
  return true;
}

/* ---------- float eigensolve (M diagonal): B = D^{-1/2} K D^{-1/2} ------ */
function jacobiSmallest(Kq, Mdq, count) {
  const n = Kq.length;
  const d = Mdq.map(x => 1 / Math.sqrt(Q.toDouble(x)));
  const A = Array.from({ length: n }, () => new Float64Array(n));
  for (let i2 = 0; i2 < n; i2++)
    for (const [j2, v] of Kq[i2]) A[i2][j2] = Q.toDouble(v) * d[i2] * d[j2];
  for (let sweep = 0; sweep < 24; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q3 = p + 1; q3 < n; q3++) off += A[p][q3] * A[p][q3];
    if (off < 1e-20 * n * n) break;
    for (let p = 0; p < n; p++) for (let q3 = p + 1; q3 < n; q3++) {
      if (Math.abs(A[p][q3]) < 1e-14) continue;
      const th = (A[q3][q3] - A[p][p]) / (2 * A[p][q3]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k2 = 0; k2 < n; k2++) {
        const akp = A[k2][p], akq = A[k2][q3];
        A[k2][p] = c * akp - s * akq; A[k2][q3] = s * akp + c * akq;
      }
      for (let k2 = 0; k2 < n; k2++) {
        const apk = A[p][k2], aqk = A[q3][k2];
        A[p][k2] = c * apk - s * aqk; A[q3][k2] = s * apk + c * aqk;
      }
    }
  }
  const lam = [];
  for (let i2 = 0; i2 < n; i2++) lam.push(A[i2][i2]);
  lam.sort((a, b) => a - b);
  return lam.slice(0, count);
}

/* ---------- interval inertia: right-looking elimination with DIAGONAL
   pivoting + symmetric float pre-scaling. Both are congruences (permutation
   and diagonal), so inertia is preserved (Sylvester). Unpivoted LDLᵀ hit
   near-zero elimination pivots mid-stream (ordering artifact) — pivoting on
   the largest-mignitude remaining diagonal fixes it. ---------- */
function mulIv(al, ah, bl, bh) {
  const p1 = al * bl, p2 = al * bh, p3 = ah * bl, p4 = ah * bh;
  return [I.nextDown(Math.min(p1, p2, p3, p4)), I.nextUp(Math.max(p1, p2, p3, p4))];
}
function inertiaBelow(Kq, Mdq, sigmaQ) {
  const n = Kq.length;
  // float symmetric scaling s_i = 1/sqrt(|diag|) (exact float constants)
  const s = new Float64Array(n);
  for (let i2 = 0; i2 < n; i2++) {
    const dQ = Q.sub(Kq[i2].get(i2) || Q.ZERO, Q.mul(sigmaQ, Mdq[i2]));
    const dv = Math.abs(Q.toDouble(dQ));
    s[i2] = dv > 0 ? 1 / Math.sqrt(dv) : 1;
  }
  const lo = Array.from({ length: n }, () => new Float64Array(n));
  const hi = Array.from({ length: n }, () => new Float64Array(n));
  for (let i2 = 0; i2 < n; i2++) {
    for (const [j2, v] of Kq[i2]) {
      const e = ratToIv(j2 === i2 ? Q.sub(v, Q.mul(sigmaQ, Mdq[i2])) : v);
      const sc = mulIv(e[0], e[1], s[i2] * s[j2], s[i2] * s[j2]);
      lo[i2][j2] = sc[0]; hi[i2][j2] = sc[1];
    }
    if (!Kq[i2].has(i2)) {
      const e = ratToIv(Q.neg(Q.mul(sigmaQ, Mdq[i2])));
      const sc = mulIv(e[0], e[1], s[i2] * s[i2], s[i2] * s[i2]);
      lo[i2][i2] = sc[0]; hi[i2][i2] = sc[1];
    }
  }
  const perm = Array.from({ length: n }, (_, i2) => i2); // perm[t] = original row in slot t
  let neg = 0;
  for (let step = 0; step < n; step++) {
    // pick remaining diagonal with largest mignitude (determinate sign)
    let best = -1, bestMig = -1;
    for (let t = step; t < n; t++) {
      const i2 = perm[t];
      const a = lo[i2][i2], b2 = hi[i2][i2];
      const mig = a > 0 ? a : (b2 < 0 ? -b2 : -1);
      if (mig > bestMig) { bestMig = mig; best = t; }
    }
    if (bestMig <= 0) {
      const i2 = perm[best < 0 ? step : best];
      return { ok: false, at: step, piv: [lo[i2][i2], hi[i2][i2]], neg };
    }
    const tmp = perm[step]; perm[step] = perm[best]; perm[best] = tmp;
    const p = perm[step];
    const plo = lo[p][p], phi = hi[p][p];
    if (phi < 0) neg++;
    // rank-1 update on the remaining block: S_ij -= S_ip * S_jp / S_pp
    for (let ti = step + 1; ti < n; ti++) {
      const i2 = perm[ti];
      const ra = lo[i2][p], rb = hi[i2][p];
      if (ra === 0 && rb === 0) continue;
      // t_i = S_ip / S_pp
      const q1 = ra / plo, q2 = ra / phi, q3 = rb / plo, q4 = rb / phi;
      const tl = I.nextDown(Math.min(q1, q2, q3, q4)), th = I.nextUp(Math.max(q1, q2, q3, q4));
      for (let tj = ti; tj < n; tj++) {
        const j2 = perm[tj];
        const ja = lo[j2][p], jb = hi[j2][p];
        if (ja === 0 && jb === 0) continue;
        const m = mulIv(tl, th, ja, jb);
        const nlo = I.nextDown(lo[i2][j2] - m[1]);
        const nhi = I.nextUp(hi[i2][j2] - m[0]);
        lo[i2][j2] = nlo; hi[i2][j2] = nhi;
        lo[j2][i2] = nlo; hi[j2][i2] = nhi;
      }
    }
  }
  return { ok: true, neg };
}

/* ---------- certified lower bound for the k-th nonzero eigenvalue ------ */
function certifiedLower(Kq, Mdq, lamFloat, kNonzero, Ch2) {
  // sigma just below the float location of full-pencil eigenvalue kNonzero+1
  const target = lamFloat[kNonzero]; // lamFloat[0] ~ 0
  const sigma = Q.fromDouble(target * (1 - 1e-4));
  const inr = inertiaBelow(Kq, Mdq, sigma);
  if (!inr.ok) return { ok: false, why: 'pivot sign undecided at ' + inr.at };
  if (inr.neg !== kNonzero) return { ok: false, why: `inertia ${inr.neg} ≠ ${kNonzero}` };
  // mu_k >= sigma/(1 + Ch2*sigma), evaluated outward, lower end
  const sIv = ratToIv(sigma);
  const denom = I.add(I.ONE, I.mul(Ch2, sIv));
  const bound = I.div(sIv, denom);
  return { ok: true, lower: bound[0], sigma: Q.toDouble(sigma) };
}

/* ---------- specimens ---------- */
function runSpecimen(name, spec, n, uppers, exact1) {
  console.log(`\n=== ${name} (CR mesh n=${n}) ===`);
  const t0 = Date.now();
  const { K, Md, ndof, hmax2 } = buildCR(spec, n);
  console.log(`ndof=${ndof} hmax=${Math.sqrt(Q.toDouble(hmax2)).toFixed(4)}`);
  check(name + ' K·1 = 0 exactly (rational)', checkKernelExact(K));
  let mdPos = true;
  for (const v of Md) if (Q.sign(v) <= 0) mdPos = false;
  check(name + ' M diagonal positive', mdPos);

  const lam = jacobiSmallest(K, Md, 5);
  check(name + ' float λ_h,1 ≈ 0', Math.abs(lam[0]) < 1e-9, lam[0].toExponential(2));
  console.log('float CR eigenvalues:', lam.slice(0, 4).map(x => +x.toFixed(6)).join(' '));

  // C_h² = (1893/10000)² · hmax²  (Lemma 3.2 constant, longest edge)
  const Ch2 = ratToIv(Q.mul(Q.mul(r(1893, 10000), r(1893, 10000)), hmax2));

  const lo1 = certifiedLower(K, Md, lam, 1, Ch2);
  const lo2 = certifiedLower(K, Md, lam, 2, Ch2);
  check(name + ' inertia certificate μ1', lo1.ok, lo1.ok ? `σ=${lo1.sigma.toFixed(6)}` : lo1.why);
  check(name + ' inertia certificate μ2', lo2.ok, lo2.ok ? `σ=${lo2.sigma.toFixed(6)}` : lo2.why);
  if (!lo1.ok || !lo2.ok) return null;

  const res = { mu1: [lo1.lower, uppers ? uppers[0] : null], mu2: [lo2.lower, uppers ? uppers[1] : null] };
  console.log(JSON.stringify({
    certLower1: +lo1.lower.toFixed(6), certUpper1: uppers ? uppers[0] : null,
    certLower2: +lo2.lower.toFixed(6), certUpper2: uppers ? uppers[1] : null,
    secs: +((Date.now() - t0) / 1000).toFixed(1),
  }));
  if (exact1) check(name + ' encloses exact μ1', lo1.lower <= exact1 && (!uppers || exact1 <= uppers[0]),
    `[${lo1.lower.toFixed(6)}, ${uppers ? uppers[0].toFixed(6) : '—'}] ∋ ${exact1.toFixed(6)}`);
  if (uppers) {
    check(name + ' lower1 ≤ upper1', lo1.lower <= uppers[0]);
    check(name + ' CERTIFIED SPECTRAL GAP: lower(μ2) > upper(μ1)', lo2.lower > uppers[0],
      `${lo2.lower.toFixed(4)} > ${uppers[0].toFixed(4)}`);
  }
  return res;
}

/* rectangle 1×0.9 regression (exact μ1 = π²) */
const rectSpec = { b: Q.ONE, w1: Q.ZERO, dx: Q.ZERO, h: r(9, 10) };
runSpecimen('rectangle 1x0.9', rectSpec, 12,
  [9.8696045, 12.1846968],   // P2a-1 certified uppers (run-p2a.js output, rounded up)
  Math.PI * Math.PI);

/* the flag specimen */
const trapSpec = { b: Q.ONE, w1: r(-2, 5), dx: r(1, 4), h: r(9, 10) };
runSpecimen('steep trapezoid', trapSpec, 12,
  [12.04181916, 14.12684697]); // P2a-1 certified uppers, rounded up in the last digit

console.log(failures ? `\nFAILURES: ${failures}` : '\nALL PASS');
process.exit(failures ? 1 : 0);
