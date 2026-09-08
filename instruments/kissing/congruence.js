/* instruments/kissing/congruence.js — are two kissing configurations the SAME
   configuration up to an isometry?

   Two direction sets A and B in R^d, each at one rational shell norm, are
   congruent iff there is a bijection pi with <a_i,a_j> = c·<b_pi(i),b_pi(j)>
   for every pair (c the ratio of shell norms). That is an isomorphism of two
   complete graphs whose edges are coloured by the exact normalised inner
   product — decided here by individualisation-refinement (colour refinement
   as the invariant, backtracking over the smallest cell), exactly as nauty
   does it, without nauty.

   Refinement is a sound invariant, so a search that exhausts is a PROOF of
   non-congruence; a found bijection is verified against every one of the
   n(n-1)/2 edge colours, and then made into a certificate anyone can check
   without repeating the search: the bijection pi and the orthogonal matrix T
   over Q(sqrt2) with T·s·a_i = b_pi(i) for every i (s the scale). T is
   solved from eleven independent vectors and verified on all of them and
   against T^T T = I, all in exact Q(sqrt2) arithmetic.

   Refusals: configurations without one shell norm, or whose norm ratio is
   not the square of a rational, are refused (null), because then the edge
   colours of the two sides are not comparable by one scale. */
'use strict';
const K = require('./kissing.js');
const Z = K.Z;

const gcdN = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
const dot = (x, y) => { let acc = [0n, 0n]; for (let i = 0; i < x.P.length; i++) acc = Z.add(acc, Z.mul([x.P[i], x.Q[i]], [y.P[i], y.Q[i]])); return acc; };
const isqrt = (n) => { if (n < 0n) return null; if (n < 2n) return n; let x = BigInt(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x * x === n ? x : null; };

/* ---------------- Q(sqrt2) as (p + q*sqrt2)/den, den > 0, reduced ---------------- */
const F = {
  red(x) { let { p, q, d } = x; if (d < 0n) { p = -p; q = -q; d = -d; } const g = gcdN(gcdN(p, q), d) || 1n; return { p: p / g, q: q / g, d: d / g }; },
  of: (p, q = 0n, d = 1n) => F.red({ p: BigInt(p), q: BigInt(q), d: BigInt(d) }),
  add: (x, y) => F.red({ p: x.p * y.d + y.p * x.d, q: x.q * y.d + y.q * x.d, d: x.d * y.d }),
  sub: (x, y) => F.add(x, { p: -y.p, q: -y.q, d: y.d }),
  mul: (x, y) => F.red({ p: x.p * y.p + 2n * x.q * y.q, q: x.p * y.q + x.q * y.p, d: x.d * y.d }),
  inv(x) { const nrm = x.p * x.p - 2n * x.q * x.q; if (nrm === 0n) throw new Error('Q(sqrt2): inverse of zero'); return F.red({ p: x.d * x.p, q: -x.d * x.q, d: nrm }); },
  isZero: (x) => x.p === 0n && x.q === 0n,
  eq: (x, y) => x.p === y.p && x.q === y.q && x.d === y.d,
  str: (x) => (x.q === 0n ? String(x.p) : x.p + '+' + x.q + '√2') + (x.d === 1n ? '' : '/' + x.d),
  toJSON: (x) => [String(x.p), String(x.q), String(x.d)],
  fromJSON: (a) => F.of(BigInt(a[0]), BigInt(a[1]), BigInt(a[2])),
};
const ZERO = F.of(0), ONE = F.of(1);

/* uniform rational shell norm, or null */
function shellNorm(V) {
  if (!V.length) return null;
  const N = dot(V[0], V[0]);
  if (N[1] !== 0n || N[0] <= 0n) return null;
  for (const v of V) if (!Z.eq(dot(v, v), N)) return null;
  return N[0];
}

/* the exact scale s (rational) with s^2 * N_A = N_B, or null */
function scaleFor(NA, NB) {
  const g = gcdN(NA, NB); const a = NA / g, b = NB / g; /* s^2 = b/a in lowest terms */
  const sb = isqrt(b), sa = isqrt(a);
  if (sb === null || sa === null) return null;
  return F.of(sb, 0n, sa);
}

/* ---------------- the decision ---------------- */
function congruent(A, B, opts = {}) {
  const t0 = Date.now();
  const n = A.length;
  if (n !== B.length) return { verdict: 'NOT CONGRUENT', reason: 'different sizes', ms: 0 };
  const d = A[0].P.length;
  if (B[0].P.length !== d) return { verdict: 'NOT CONGRUENT', reason: 'different dimensions', ms: 0 };
  const NA = shellNorm(A), NB = shellNorm(B);
  if (NA === null || NB === null) return null;                 /* refused: no single shell norm */
  const scale = scaleFor(NA, NB);
  if (scale === null) return null;                             /* refused: norm ratio not a rational square */

  /* edge colours: the normalised inner product, one table for both sides */
  const table = new Map();
  const key = (s, g) => { const c = gcdN(gcdN(s[0], s[1]), g); return (s[0] / c) + ',' + (s[1] / c) + '/' + (g / c); };
  const colour = (s, g) => { const k = key(s, g); if (!table.has(k)) table.set(k, table.size); return table.get(k); };
  const mat = (V, g) => { const M = new Uint16Array(n * n); for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const c = colour(dot(V[i], V[j]), g); M[i * n + j] = M[j * n + i] = c; } return M; };
  const MA = mat(A, NA), MB = mat(B, NB);
  const hist = (c, k) => { const h = new Int32Array(k); for (const x of c) h[x]++; return h; };
  const sameHist = (a, b) => { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
  let refines = 0, nodes = 0;

  /* joint colour refinement: the same signature gets the same colour on both sides */
  function refine(cA, cB, k) {
    for (;;) {
      refines++;
      const mult = k + 1;
      const sig = (M, c) => { const out = new Array(n); const arr = new Float64Array(n - 1);
        for (let v = 0; v < n; v++) { let m = 0; for (let u = 0; u < n; u++) { if (u === v) continue; arr[m++] = M[v * n + u] * mult + c[u]; } arr.sort(); out[v] = c[v] + ':' + arr.join(','); }
        return out; };
      const sA = sig(MA, cA), sB = sig(MB, cB);
      const all = [...new Set([...sA, ...sB])].sort();
      const id = new Map(all.map((s, i) => [s, i]));
      const nA = Int32Array.from(sA, (s) => id.get(s)), nB = Int32Array.from(sB, (s) => id.get(s));
      const m = all.length;
      if (m === k) return { cA: nA, cB: nB, k: m };
      cA = nA; cB = nB; k = m;
      if (k === n) return { cA, cB, k };
    }
  }
  function search(cA, cB, k) {
    nodes++;
    const r = refine(cA, cB, k); cA = r.cA; cB = r.cB; k = r.k;
    if (!sameHist(hist(cA, k), hist(cB, k))) return null;
    if (k === n) {
      const pi = new Int32Array(n), posB = new Int32Array(n);
      for (let w = 0; w < n; w++) posB[cB[w]] = w;
      for (let v = 0; v < n; v++) pi[v] = posB[cA[v]];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (MA[i * n + j] !== MB[pi[i] * n + pi[j]]) return null;
      return pi;
    }
    const h = hist(cA, k); let c = -1;
    for (let i = 0; i < k; i++) if (h[i] >= 2 && (c < 0 || h[i] < h[c])) c = i;
    let v = -1; for (let i = 0; i < n; i++) if (cA[i] === c) { v = i; break; }
    const ws = []; for (let i = 0; i < n; i++) if (cB[i] === c) ws.push(i);
    for (const w of ws) { const a = cA.slice(), b = cB.slice(); a[v] = k; b[w] = k; const res = search(a, b, k + 1); if (res) return res; }
    return null;
  }
  const pi = search(new Int32Array(n), new Int32Array(n), 1);
  if (!pi) return { verdict: 'NOT CONGRUENT', reason: 'individualisation-refinement exhausted', edgeColours: table.size, nodes, refines, ms: Date.now() - t0 };

  /* the certificate: T with T·s·a_i = b_pi(i), solved from d independent vectors, verified on all */
  const As = A.map((v) => v.P.map((p, i) => F.mul(scale, F.of(p, v.Q[i]))));
  const Bs = B.map((v) => v.P.map((p, i) => F.of(p, v.Q[i])));
  const T = solveIsometry(As, Bs, pi, d);
  const check = verifyCertificate(A, B, { pi: Array.from(pi), T: T.map((r) => r.map(F.toJSON)), scale: F.toJSON(scale) });
  if (!check.ok) throw new Error('congruence: the solved isometry failed its own verification — ' + check.reason);
  const signedPerm = T.every((row) => row.filter((x) => !F.isZero(x)).length === 1 && row.every((x) => F.isZero(x) || (x.d === 1n && x.q === 0n && (x.p === 1n || x.p === -1n))));
  const usesSqrt2 = T.some((row) => row.some((x) => x.q !== 0n));
  return {
    verdict: 'CONGRUENT', n, dim: d, edgeColours: table.size, nodes, refines, ms: Date.now() - t0,
    isometry: signedPerm ? 'signed coordinate permutation' : (usesSqrt2 ? 'orthogonal over Q(sqrt2)' : 'orthogonal over Q'),
    certificate: { pi: Array.from(pi), T: T.map((r) => r.map(F.toJSON)), scale: F.toJSON(scale) },
  };
}

function solveIsometry(As, Bs, pi, d) {
  const basis = [], idx = [];
  for (let i = 0; i < As.length && idx.length < d; i++) {
    let r = As[i].slice();
    for (const { row, piv } of basis) if (!F.isZero(r[piv])) { const f = F.mul(r[piv], F.inv(row[piv])); r = r.map((x, k) => F.sub(x, F.mul(f, row[k]))); }
    const piv = r.findIndex((x) => !F.isZero(x));
    if (piv >= 0) { basis.push({ row: r, piv }); idx.push(i); }
  }
  if (idx.length < d) throw new Error('congruence: the configuration does not span R^' + d);
  const M = [...Array(d)].map((_, r) => idx.map((i) => As[i][r]));
  const N = [...Array(d)].map((_, r) => idx.map((i) => Bs[pi[i]][r]));
  const a = M.map((row, i) => row.concat([...Array(d)].map((_, j) => (i === j ? ONE : ZERO))));
  for (let c = 0; c < d; c++) {
    let p = c; while (p < d && F.isZero(a[p][c])) p++;
    if (p === d) throw new Error('congruence: singular basis');
    [a[c], a[p]] = [a[p], a[c]];
    const f = F.inv(a[c][c]); a[c] = a[c].map((x) => F.mul(x, f));
    for (let r = 0; r < d; r++) { if (r === c || F.isZero(a[r][c])) continue; const g = a[r][c]; a[r] = a[r].map((x, k) => F.sub(x, F.mul(g, a[c][k]))); }
  }
  const Minv = a.map((row) => row.slice(d));
  return [...Array(d)].map((_, r) => [...Array(d)].map((_, c) => { let s = ZERO; for (let k = 0; k < d; k++) s = F.add(s, F.mul(N[r][k], Minv[k][c])); return s; }));
}

/* verifyCertificate(A, B, cert) — re-check a certificate exactly, without searching:
   pi a bijection, T orthogonal, T·s·a_i = b_pi(i) for every i. */
function verifyCertificate(A, B, cert) {
  const n = A.length, d = A[0].P.length;
  if (!cert || !Array.isArray(cert.pi) || cert.pi.length !== n || B.length !== n) return { ok: false, reason: 'shape' };
  const seen = new Set(cert.pi); if (seen.size !== n || cert.pi.some((x) => x < 0 || x >= n)) return { ok: false, reason: 'pi is not a bijection' };
  const scale = F.fromJSON(cert.scale);
  const T = cert.T.map((r) => r.map(F.fromJSON));
  if (T.length !== d || T.some((r) => r.length !== d)) return { ok: false, reason: 'T shape' };
  for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) { let s = ZERO; for (let k = 0; k < d; k++) s = F.add(s, F.mul(T[k][i], T[k][j])); if (!F.eq(s, i === j ? ONE : ZERO)) return { ok: false, reason: 'T is not orthogonal' }; }
  for (let i = 0; i < n; i++) {
    const a = A[i].P.map((p, k) => F.mul(scale, F.of(p, A[i].Q[k]))), b = B[cert.pi[i]];
    for (let r = 0; r < d; r++) { let s = ZERO; for (let k = 0; k < d; k++) s = F.add(s, F.mul(T[r][k], a[k])); if (!F.eq(s, F.of(b.P[r], b.Q[r]))) return { ok: false, reason: 'T·s·a_' + i + ' ≠ b_pi(' + i + ')' }; }
  }
  return { ok: true };
}

module.exports = { congruent, verifyCertificate, F, shellNorm, scaleFor };
