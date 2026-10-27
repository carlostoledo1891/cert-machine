/* graphon-second.js — the SECOND implementation of the two Ramsey-multiplicity graphon densities the registry's C_89b
   (K5) and C_89c (K6) rest on (J. SK, pull requests 277 and 279), written here from the registry's definitions
   (constants/89b.md, 89c.md) and the data files' schemas. No code shared with the claimant's evaluators (kept as
   text, never run) or with the first implementation here (instruments/optq/graphon_k5.py, graphon_k6.py: Python,
   Fraction). What differs: K5 is counted modulo ten 25-bit primes in double arithmetic on the common support of each
   block pair and lifted by the Chinese remainder theorem; K6 is reduced by translation, the row classes of the first
   four vectors, the fifth vector's binomials and the S4 quotient, in BigInt. Each has a brute-force selftest.

   K5 (89b): m equal blocks, red value R_ij/D on the block pair (i,j), diagonal included; t(K5,W) = m^-5 Σ over ORDERED
   5-tuples of blocks of the product of the ten pair values; value = (N(R) + N(D − R)) / (m^5 D^10) with
     N(X) = Σ_{i,j} X_ij · tr((diag(u) X)^3),  u_k = X_ik X_jk   (the ten pairs: ij | ik jk | il jl | im jm | kl lm mk).
   K6 (89c): 2^n blocks x ∈ Z_2^n, red value f[|x ⊕ y|]/D; value = (N(f) + N(D − f)) / (2^6n D^15) with
     N(f) = Σ over ordered 6-tuples of Π_{a<b} f[|x_a ⊕ x_b|]; translation fixes x1 = 0; the ten distances among
     x1..x5 depend only on the count vector of the 4-bit column patterns (n!/Π m_q! tuples share it); x6 is summed by
     choosing j_q of the m_q coordinates in class q (C(m_q, j_q) ways); permuting x2..x5 permutes the pattern bits, so
     one count vector per S4-orbit is evaluated, times its orbit size.

   usage: node instruments/optq/graphon-second.js --selftest       brute force vs both reductions, random small inputs
          require(...): { k5Value(R, D), k6Value(f, D), decodeGraph6(text), decimals(num, den, places) }     MIT */
'use strict';

/* ---- shared ---------------------------------------------------------------------------------------------------- */
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const reduce = (num, den) => { const g = gcd(num, den); return { num: num / g, den: den / g }; };
function decimals(num, den, places) { const ip = num / den; let r = num % den, s = ip.toString() + '.'; for (let i = 0; i < places; i++) { r *= 10n; s += (r / den).toString(); r %= den; } return s; }
const fact = (k) => { let r = 1n; for (let i = 2n; i <= BigInt(k); i++) r *= i; return r; };
const binom = (a, b) => fact(a) / (fact(b) * fact(a - b));

/* ---- K5: modular counting on the common support, CRT ------------------------------------------------------------- */
function primesBelow(limit, count) {
  const out = [];
  for (let n = limit - 1; out.length < count; n--) { let ok = n > 1; for (let q = 2; q * q <= n && ok; q++) if (n % q === 0) ok = false; if (ok) out.push(n); }
  return out;
}
function egcd(a, b) { let [x0, x1, y0, y1] = [1n, 0n, 0n, 1n]; while (b) { const q = a / b; [a, b] = [b, a % b]; [x0, x1] = [x1, x0 - q * x1]; [y0, y1] = [y1, y0 - q * y1]; } return [a, x0, y0]; }
function crt(residues, primes) {
  let x = 0n, M = 1n;
  for (let i = 0; i < primes.length; i++) {
    const p = BigInt(primes[i]), r = BigInt(residues[i]);
    const [, inv] = egcd(M % p, p);
    const t = ((((r - x) % p) + p) % p) * ((inv % p + p) % p) % p;
    x += M * t; M *= p;
  }
  return x;
}
function Nmod(X, p) {                            // X: m rows of exact non-negative integers (Numbers), symmetric; p < 2^26
  const m = X.length, Xp = X.map((row) => row.map((v) => v % p));
  let total = 0;
  const u = new Float64Array(m), S = new Int32Array(m);
  for (let i = 0; i < m; i++) for (let j = i; j < m; j++) {
    if (X[i][j] === 0) continue;
    let s = 0;
    for (let k = 0; k < m; k++) if (X[i][k] !== 0 && X[j][k] !== 0) { S[s] = k; u[s] = (Xp[i][k] * Xp[j][k]) % p; s++; }
    if (s === 0) continue;
    const M = new Float64Array(s * s);
    for (let a = 0; a < s; a++) { const ua = u[a], row = Xp[S[a]]; for (let b = 0; b < s; b++) M[a * s + b] = (ua * row[S[b]]) % p; }
    const M2 = new Float64Array(s * s);
    for (let a = 0; a < s; a++) for (let c = 0; c < s; c++) { const mac = M[a * s + c]; if (mac === 0) continue; for (let b = 0; b < s; b++) M2[a * s + b] = (M2[a * s + b] + mac * M[c * s + b]) % p; }
    let tr = 0;
    for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) tr = (tr + M2[a * s + b] * M[b * s + a]) % p;
    const term = (Xp[i][j] * tr) % p;
    total = (total + (i === j ? term : (2 * term) % p)) % p;
  }
  return total;
}
/* enough 25-bit primes that their product exceeds m^5 · D^10 — the CRT lift is then the integer itself */
function primesFor(m, D) { const bits = 5 * Math.log2(m) + 10 * Math.log2(D) + 2; return primesBelow(1 << 25, Math.ceil(bits / 24.9)); }
function N5(X, primes) { return crt(primes.map((p) => Nmod(X, p)), primes); }
function k5Value(R, Dn) {                        // R: m×m symmetric integer matrix in [0, D] (Numbers); Dn: Number
  const m = R.length;
  for (let i = 0; i < m; i++) { if (R[i].length !== m) throw new Error('R is not square'); for (let j = 0; j < m; j++) { if (R[i][j] !== R[j][i]) throw new Error('R is not symmetric'); if (!(Number.isInteger(R[i][j]) && R[i][j] >= 0 && R[i][j] <= Dn)) throw new Error('an entry is outside [0, D]'); } }
  const primes = primesFor(m, Dn);
  const Nr = N5(R, primes), Nb = N5(R.map((row) => row.map((v) => Dn - v)), primes);
  const v = reduce(Nr + Nb, BigInt(m) ** 5n * BigInt(Dn) ** 10n);
  return { Nred: Nr, Nblue: Nb, num: v.num, den: v.den, primes: primes.length };
}
function N5brute(X) {                            // every ordered 5-tuple, BigInt — the selftest's oracle
  const m = X.length, B = X.map((r) => r.map(BigInt)); let t = 0n;
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) for (let k = 0; k < m; k++) for (let l = 0; l < m; l++) for (let q = 0; q < m; q++)
    t += B[i][j] * B[i][k] * B[i][l] * B[i][q] * B[j][k] * B[j][l] * B[j][q] * B[k][l] * B[k][q] * B[l][q];
  return t;
}

/* ---- K6: translation, row classes, the fifth vector by binomials, the S4 quotient ---------------------------------- */
function N6(f, n) {                              // f: n+1 BigInt weights by Hamming distance; Σ over ordered 6-tuples in (Z_2^n)^6
  const F = fact(n);
  const permute = (arr) => { if (arr.length <= 1) return [arr]; const out = []; for (let i = 0; i < arr.length; i++) for (const rest of permute(arr.slice(0, i).concat(arr.slice(i + 1)))) out.push([arr[i]].concat(rest)); return out; };
  const perms = permute([0, 1, 2, 3]).map((pr) => Array.from({ length: 16 }, (_, q) => { let q2 = 0; for (let b = 0; b < 4; b++) if (q >> b & 1) q2 |= 1 << pr[b]; return q2; }));
  const key = (m) => m.join(',');
  let total = 0n, reps = 0, orbitsSum = 0n;
  const m = new Array(16).fill(0), j = new Array(16).fill(0);
  const visit = () => {
    const me = key(m); let fixed = 0;
    for (const p of perms) { const img = new Array(16); for (let q = 0; q < 16; q++) img[p[q]] = m[q]; const k = key(img); if (k < me) return; if (k === me) fixed++; }
    const orbit = BigInt(24 / fixed); reps++; orbitsSum += orbit;
    let mult = F; for (let q = 0; q < 16; q++) mult /= fact(m[q]);
    const d1 = [0, 0, 0, 0], dab = new Array(16).fill(0);
    for (let q = 0; q < 16; q++) if (m[q]) for (let a = 0; a < 4; a++) { if (q >> a & 1) d1[a] += m[q]; for (let b = a + 1; b < 4; b++) if (((q >> a) ^ (q >> b)) & 1) dab[a * 4 + b] += m[q]; }
    let P = 1n;
    for (let a = 0; a < 4; a++) { P *= f[d1[a]]; for (let b = a + 1; b < 4; b++) P *= f[dab[a * 4 + b]]; }
    if (P === 0n) return;
    const classes = []; for (let q = 0; q < 16; q++) if (m[q]) classes.push(q);
    let S6 = 0n;
    const rec = (ci, ways) => {
      if (ci === classes.length) {
        let d0 = 0; const da = [0, 0, 0, 0];
        for (const q of classes) { d0 += j[q]; for (let a = 0; a < 4; a++) da[a] += (q >> a & 1) ? m[q] - j[q] : j[q]; }
        let t = f[d0]; for (let a = 0; a < 4; a++) t *= f[da[a]];
        S6 += ways * t; return;
      }
      const q = classes[ci];
      for (let v = 0; v <= m[q]; v++) { j[q] = v; rec(ci + 1, ways * binom(m[q], v)); }
      j[q] = 0;
    };
    rec(0, 1n);
    total += orbit * mult * P * S6;
  };
  const compose = (q, left) => { if (q === 15) { m[15] = left; visit(); return; } for (let v = 0; v <= left; v++) { m[q] = v; compose(q + 1, left - v); } m[q] = 0; };
  compose(0, n);
  if (orbitsSum !== binom(n + 15, 15)) throw new Error('the S4 orbit sizes do not sum to the number of count vectors');
  return { N: (1n << BigInt(n)) * total, reps };
}
function k6Value(f, D) {                         // f: n+1 BigInt in [0, D]; D: BigInt
  const n = f.length - 1;
  if (!f.every((v) => v >= 0n && v <= D)) throw new Error('a weight is outside [0, D]');
  const r = N6(f, n), b = N6(f.map((v) => D - v), n);
  const v = reduce(r.N + b.N, (1n << BigInt(6 * n)) * D ** 15n);
  return { Nred: r.N, Nblue: b.N, num: v.num, den: v.den, reps: r.reps };
}
function N6brute(f, n) {
  const B = 1 << n; let t = 0n; const pc = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const x = new Array(6).fill(0);
  const rec = (a) => { if (a === 6) { let p = 1n; for (let i = 0; i < 6; i++) for (let k = i + 1; k < 6; k++) p *= f[pc(x[i] ^ x[k])]; t += p; return; } for (let v = 0; v < B; v++) { x[a] = v; rec(a + 1); } };
  rec(0); return t;
}

/* ---- graph6 (McKay): a 0/1 adjacency matrix from the standard text encoding, for the published-graph control ------- */
function decodeGraph6(text) {
  let s = text.trim().split('\n')[0].trim(); if (s.startsWith('>>graph6<<')) s = s.slice(10);
  const bytes = Array.from(s, (c) => c.charCodeAt(0) - 63);
  let n, pos;
  if (bytes[0] !== 63) { n = bytes[0]; pos = 1; } else if (bytes[1] !== 63) { n = (bytes[1] << 12) | (bytes[2] << 6) | bytes[3]; pos = 4; } else throw new Error('graph6: n >= 2^18 not handled');
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  let bit = 0;
  for (let j = 1; j < n; j++) for (let i = 0; i < j; i++) {
    const b = (bytes[pos + (bit >> 3) * 0 + Math.floor(bit / 6)] >> (5 - bit % 6)) & 1; bit++;
    A[i][j] = b; A[j][i] = b;
  }
  return A;
}

module.exports = { k5Value, k6Value, decodeGraph6, decimals, N5brute, N6brute, N6, primesFor };

if (require.main === module && process.argv.includes('--selftest')) {
  let seed = 4242; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; };
  for (let trial = 0; trial < 6; trial++) {
    const m = 4 + (trial % 3), top = trial < 3 ? 7 : 1048576;
    const X = Array.from({ length: m }, () => new Array(m).fill(0));
    for (let i = 0; i < m; i++) for (let j = i; j < m; j++) { const v = rnd() % 3 === 0 ? 0 : rnd() % top; X[i][j] = v; X[j][i] = v; }
    const a = N5brute(X), b = N5(X, primesFor(m, top));
    if (a !== b) { console.log('K5 SELFTEST FAILED on trial ' + trial); process.exit(1); }
  }
  for (const n of [3, 4]) {
    const f = Array.from({ length: n + 1 }, () => BigInt(rnd() % 50));
    if (N6brute(f, n) !== N6(f, n).N) { console.log('K6 SELFTEST FAILED at n = ' + n); process.exit(1); }
  }
  const D = 1n << 20n, half = k6Value(Array.from({ length: 11 }, () => D / 2n), D);
  const halfOk = half.num * 16384n === half.den;                          // W ≡ 1/2: value = 2 · 2^-15
  const half5 = k5Value(Array.from({ length: 3 }, () => [524288, 524288, 524288]), 1048576);
  const half5Ok = half5.num * 512n === half5.den;                          // W ≡ 1/2: value = 2 · 2^-10
  console.log('graphon-second selftest: K5 brute force = modular identity + CRT on 6 matrices; K6 brute force = reduction at n = 3, 4; W ≡ 1/2 gives 2^-14 (K6) ' + halfOk + ' and 2^-9 (K5) ' + half5Ok);
  process.exit(halfOk && half5Ok ? 0 : 1);
}
