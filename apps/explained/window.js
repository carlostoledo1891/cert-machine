/* apps/explained/window.js — the window widget's matrix, ONCE: degree-4 even windows, D₁ at fifteen terms, exactly, from the
   definitions (the same chain the Riemann companion's generator re-derives), embedded in a story page as rationals. It was
   written out twice, in apps/explained/build.js and apps/explained-v1/build.js, line for line (2026-10-28: one module, the
   corpus.js lesson). Requiring it adds WIN, WIN_PSTAR4, WIN_PQUARTIC15, WIN_CSTAR2 and WIN_CSTAR4 to the records' V, and
   refuses the build unless the matrix reproduces the companion's numbers.                                            MIT */
'use strict';
const { V, need } = require('./records.js');

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
class Q { constructor(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); } sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); } mul(o) { return new Q(this.n * o.n, this.d * o.d); } div(o) { return new Q(this.n * o.d, this.d * o.n); }
  toString() { return this.n + '/' + this.d; } }
const fact = (n) => { let r = 1n; for (let i = 2n; i <= n; i++) r *= i; return r; };
const binom = (n, k) => { let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = r * (BigInt(n) - i + 1n) / i; return r; };
const aK = (k) => new Q(2n * 4n ** (BigInt(k) + 1n) * fact(BigInt(k)), fact(2n * BigInt(k) + 2n));
const epsK = (K) => { const qq = BigInt((K + 2) * (2 * K + 3)); return aK(K).mul(new Q(qq, qq - 2n * BigInt(K + 1))); };
const padd = (p, e, v) => { p[e] = (p[e] || new Q(0n)).add(v); };
const convPair = (i, j) => { const out = {}; const half = new Q(1n, 2n);
  for (let a = 0; a <= 2 * j; a++) { const c = new Q(binom(2 * j, a)); const n = 2 * i + a + 1;
    for (let e = 0; e <= n; e++) { let v = new Q(binom(n, e)); for (let t = 0; t < n - e; t++) v = v.mul(half); if (e % 2) v = new Q(-v.n, v.d); padd(out, e + 2 * j - a, c.mul(v).div(new Q(BigInt(n)))); }
    let v0 = new Q(1n); for (let t = 0; t < n; t++) v0 = v0.mul(half); if (n % 2) v0 = new Q(-v0.n, v0.d); padd(out, 2 * j - a, new Q(-1n).mul(c).mul(v0).div(new Q(BigInt(n)))); }
  return out; };
const pmul = (p, q2) => { const r = {}; for (const a in p) for (const b in q2) padd(r, Number(a) + Number(b), p[a].mul(q2[b])); return r; };
const integ01 = (p) => { let s = new Q(0n); for (const e in p) s = s.add(p[e].div(new Q(BigInt(Number(e) + 1)))); return s; };
const d1 = (K) => { const p = { 1: new Q(1n), 2: new Q(-4n) }; for (let k = 0; k < K; k++) padd(p, 2 * k + 3, aK(k)); return p; };
const intEven = (i) => new Q(1n, 4n ** BigInt(i) * BigInt(2 * i + 1));
function quadForm(m, K) { const D = d1(K); const b = [], M = [];
  for (let i = 0; i < m; i++) { b.push(intEven(i)); M.push([]); for (let j = 0; j < m; j++) { const H = integ01(pmul(D, convPair(i, j))).mul(new Q(2n)); const Hji = integ01(pmul(D, convPair(j, i))).mul(new Q(2n)); M[i].push(intEven(i + j).add(H.add(Hji).div(new Q(2n)))); } }
  return { M, b }; }
function solveQ(M, b) { const n = b.length; const A = M.map((row, i) => row.concat([b[i]]));
  for (let col = 0; col < n; col++) { let piv = col; while (A[piv][col].n === 0n) piv++; [A[col], A[piv]] = [A[piv], A[col]]; const pv = A[col][col]; A[col] = A[col].map((x) => x.div(pv));
    for (let r = 0; r < n; r++) if (r !== col && A[r][col].n !== 0n) { const f = A[r][col]; A[r] = A[r].map((x, k) => x.sub(f.mul(A[col][k]))); } }
  return A.map((row) => row[n]); }
const K15 = 15; const { M, b } = quadForm(3, K15); const x = solveQ(M, b); let bx = new Q(0n); for (let i = 0; i < 3; i++) bx = bx.add(b[i].mul(x[i]));
const kstar = new Q(1n).div(bx); const cstar = x.map((xi) => xi.div(x[0])); const eps15 = epsK(K15);
/* a decimal TRUNCATED at k places: the window's P values are positive and printed as what a window "reaches", so the cut is a floor */
const decOf = (q, k) => { const neg = q.n < 0n; const a = neg ? -q.n : q.n; const s = 10n ** BigInt(k); const t = ((a * s) / q.d).toString().padStart(k + 1, '0'); return (neg ? '-' : '') + t.slice(0, -k) + '.' + t.slice(-k); };
const pOf = (c) => { let num = new Q(0n), den = new Q(0n); for (let i = 0; i < 3; i++) { den = den.add(b[i].mul(c[i])); for (let j = 0; j < 3; j++) num = num.add(c[i].mul(c[j]).mul(M[i][j])); } return new Q(2n).sub(num.div(den.mul(den))).sub(eps15); };
const Pstar4 = new Q(2n).sub(kstar).sub(eps15); const quartic = [new Q(1n), new Q(-7n, 25n), new Q(-102n, 25n)]; const Pq = pOf(quartic);
need(decOf(Pstar4, 9) === '0.868641400' && decOf(Pq, 8) === '0.86864051' && decOf(pOf(cstar), 12) === decOf(Pstar4, 12), 'the degree-4 window matrix at fifteen terms does not reproduce the companion\'s numbers');
V.WIN = JSON.stringify({ M: M.map((r) => r.map(String)), b: b.map(String), eps: String(eps15), cstar: cstar.map(String), pstar: String(Pstar4), pquartic: String(Pq) });
V.WIN_PSTAR4 = decOf(Pstar4, 10); V.WIN_PQUARTIC15 = decOf(Pq, 10); V.WIN_CSTAR2 = decOf(cstar[1], 4); V.WIN_CSTAR4 = decOf(cstar[2], 4);

module.exports = { WIN: V.WIN };
