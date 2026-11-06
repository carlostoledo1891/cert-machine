#!/usr/bin/env node
/* zq-v4.js — the Version 4 quartic of the claim "Z is Diophantine in Q" (Glazer et al., Version 4, 2026-11-06):
   V1 the coefficient table, V2 the sum of squares, V3 the certificate replayed from the arithmetic source by the
   manuscript's own step rules. Writes certs/zq-v4.json; `--check` re-derives it and refuses on any difference.

   THE THEOREM IS UNDECIDED HERE. This decides the finite algebra of Version 4 and nothing about the source's
   arithmetic theorem (thm:quartic-selected-source) or the inherited hypotheses it rests on.

   Pre-registered in notes/zq-v4-preregistration-2026-11-06.md (with amendment A) before this file ran.

   CLEAN ROOM: written from quartic_4973.tex (thm:quartic; the literal specification; the source specification; the
   quadratic reductions; the finite realization) and from the JSON as it stands. No line of the repository's .py is
   run, read or ported. Their bytes stay in their clone, $ZQ_V4_REPO, default ~/Projects/zq-scout/v4-5cb2c199
   (unlicensed: nothing is copied here); every file is checked by sha256 before it is read.

   usage: node tools/zq-v4.js [--check]                                                                          MIT */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const REPO = process.env.ZQ_V4_REPO || path.join(os.homedir(), 'Projects', 'zq-scout', 'v4-5cb2c199');
const PKG = 'quartics/quartic-4973/';
const OUT = path.join(ROOT, 'certs', 'zq-v4.json');
const die = (m) => { console.error('zq-v4: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const PIN = {
  repository: 'github.com/elliotglazer/diophantine-z-q',
  commit: '5cb2c1997dde6e358f3c2fe9bbdb4b8f4c23bac6',
  tex: { path: 'quartic_4973.tex', sha256: 'd1700d3450e9646422516efc0d37ca657b89b7a10734496d7fc02a2c09b12c34' },
  table: { path: PKG + 'polynomial.expanded.txt', sha256: '094f6a7ed17e7cc8d5d17a2f809127bbaffd0fe343cb2a32d18ac97e61279876' },
  tableGz: { path: PKG + 'polynomial.expanded.txt.gz', sha256: 'ac7ddfb1a5540ca996b5e7ca97265847b41000887ee4885f9d2b6a2fbf6c5264' },
  residuals: { path: PKG + 'residuals.json.gz', sha256: '67fa6e2554045ba89dad1575dc31299d0cf34ea93611fac7710b7183ea29f7ab' },
  weights: { path: PKG + 'weights.json', sha256: '3dd137c9c1a8930b0f9d2de90cf49d6bd71b24de77b9a0317ac4ce97b9c10da8' },
  variableMap: { path: PKG + 'variable-map.json', sha256: '2402920061d7db7084485d448c8f8c0c9688900d1946d73db390cdf6c21a2a3b' },
  certificate: { path: PKG + 'certificate.jsonl.gz', sha256: '81ca768459a13b76dbdf4bfe81e94fbab9ab99f14a5731f6b1a1b03e28c1df2b' },
  source: { path: PKG + 'source-residuals.jsonl.gz', sha256: '94f8a1972cbfc0cf6493d418e628a18482307dec5c427db72e86d3eacb1a6f5d', uncompressedSha256: '4a82d9a8dc1b5c92eb40a49751c0a6aae073c8f765ca5e276a74802fd56b84be' },
  sourceEntry: { path: PKG + 'source-entry.json', sha256: '39af6e354ce265a7954c2fbae53373862a89f81114e6c24c56eb9ff3020d9857' },
};
/* what the TeX states (thm:quartic 8695-8711; 8713-8729; 10036-10063; 10179-10215) */
const CLAIM = {
  variables: 4973, witnesses: 4972, monomials: 72925, degree: 4, maxAbs: 685783949153203534233890n, bytes: 1622053,
  rows: 4552, sourceCoordinates: 4935, sourceRows: 4513, steps: 551,
  sourceId: 'target2-tangent-first-norm-normalized-linear-pole-k40-q12-a25-h19-s32-4a82d9a8dc1b',
  census: { parity_conic: 1, circuit: 13, linear: 266, eliminate: 121, shear: 2, relation_eliminate: 148 },
};
const UNDECIDED = 'The theorem (Z is Diophantine in Q) is undecided here. This decides the finite algebra of Version 4: that the published quartic is the stated polynomial, that it is the sum of the squares of the published residuals, and that the published certificate carries the published arithmetic source to those residuals by the steps the manuscript describes. It does not decide the source\'s arithmetic theorem (thm:quartic-selected-source) or the inherited hypotheses it rests on.';

/* two kinds of stop, as pre-registered: a condition the prose states fails (REFUTED), or a field cannot be read (REFUSED) */
class Refuse extends Error {}
const refuse = (m) => { throw new Refuse(m); };
const malformed = (m) => { const e = new Refuse(m); e.format = true; throw e; };

/* ---- exact input ---------------------------------------------------------------------------------------------------- */
function readPinned(pin) {
  const p = path.join(REPO, pin.path);
  if (!fs.existsSync(p)) die('the clone has no ' + pin.path + ' (set ZQ_V4_REPO)');
  const b = fs.readFileSync(p);
  if (sha(b) !== pin.sha256) die(pin.path + ' is not the pinned bytes');
  return b;
}
/* integers past 2^53 read from the source text, never through a float (amendment A) */
const JP = (t) => JSON.parse(t, (k, v, c) => (typeof v === 'number' && c && /^-?\d{16,}$/.test(c.source) ? BigInt(c.source) : v));
const big = (x, what) => {
  if (typeof x === 'bigint') return x;
  if (Number.isSafeInteger(x)) return BigInt(x);
  return malformed(what + ' is not an integer: ' + JSON.stringify(String(x)));
};
const idx = (x, what) => { if (!Number.isSafeInteger(x) || x < 0) malformed(what + ' is not a variable index: ' + String(x)); return x; };

/* ---- exact rationals [n, d], d > 0, reduced ------------------------------------------------------------------------- */
const babs = (a) => (a < 0n ? -a : a);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
const fr = (n, d = 1n) => { if (d === 0n) refuse('a zero denominator'); if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; return [n / g, d / g]; };
const fadd = (a, b) => (a[1] === 1n && b[1] === 1n ? [a[0] + b[0], 1n] : fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]));
const fmul = (a, b) => (a[1] === 1n && b[1] === 1n ? [a[0] * b[0], 1n] : fr(a[0] * b[0], a[1] * b[1]));
const fdiv = (a, b) => { if (b[0] === 0n) refuse('a division by zero'); return fr(a[0] * b[1], a[1] * b[0]); };
const feq = (a, b) => a[0] === b[0] && a[1] === b[1];

/* ---- polynomials: Map(monomial key -> [n, d]); a monomial is a sorted index list, key 'i,j,…', '' the constant ---- */
const mkey = (a) => a.join(',');
const mvars = (k) => (k === '' ? [] : k.split(',').map(Number));
function mmulKey(k1, k2) {
  if (k1 === '') return k2; if (k2 === '') return k1;
  const a = mvars(k1), b = mvars(k2), r = []; let i = 0, j = 0;
  while (i < a.length && j < b.length) r.push(a[i] <= b[j] ? a[i++] : b[j++]);
  while (i < a.length) r.push(a[i++]); while (j < b.length) r.push(b[j++]);
  return r.join(',');
}
const pnew = () => new Map();
function pacc(P, k, c) { const o = P.get(k); const s = o ? fadd(o, c) : c; if (s[0] === 0n) P.delete(k); else P.set(k, s); }
function prow(terms, what) {   /* a JSON row [[coef, [indices]], ...] */
  if (!Array.isArray(terms)) malformed(what + ' is not a list of terms');
  const P = pnew();
  for (const t of terms) {
    if (!Array.isArray(t) || t.length !== 2 || !Array.isArray(t[1])) malformed(what + ' has a malformed term');
    const ix = t[1].map((x) => idx(x, what)).sort((a, b) => a - b);
    pacc(P, mkey(ix), [big(t[0], what + ' coefficient'), 1n]);
  }
  return P;
}
const pconst = (c) => { const P = pnew(); if (c[0] !== 0n) P.set('', c); return P; };
const pvar = (v, c = [1n, 1n]) => { const P = pnew(); P.set(String(v), c); return P; };
const pmono = (ix, c) => { const P = pnew(); P.set(mkey([...ix].sort((a, b) => a - b)), c); return P; };
function padd(P, Q) { const R = new Map(P); for (const [k, c] of Q) pacc(R, k, c); return R; }
function pscale(P, f) { const R = pnew(); if (f[0] === 0n) return R; for (const [k, c] of P) R.set(k, fmul(c, f)); return R; }
const psub = (P, Q) => padd(P, pscale(Q, [-1n, 1n]));
function pmul(P, Q) { const R = pnew(); for (const [k1, c1] of P) for (const [k2, c2] of Q) pacc(R, mmulKey(k1, k2), fmul(c1, c2)); return R; }
function ppow(P, e) { let R = pconst([1n, 1n]); for (let i = 0; i < e; i++) R = pmul(R, P); return R; }
const pdeg = (P) => { let d = -1; for (const k of P.keys()) d = Math.max(d, k === '' ? 0 : k.split(',').length); return d; };
const pvarsOf = (P) => { const s = new Set(); for (const k of P.keys()) for (const v of mvars(k)) s.add(v); return s; };
function peq(P, Q) { if (P.size !== Q.size) return false; for (const [k, c] of P) { const d = Q.get(k); if (!d || !feq(c, d)) return false; } return true; }
/* P = λ·Q with λ ≠ 0 (both zero counts as proportional) */
function pprop(P, Q) {
  if (P.size === 0 || Q.size === 0) return P.size === Q.size;
  const [k0, c0] = P.entries().next().value; const d0 = Q.get(k0); if (!d0) return false;
  return peq(P, pscale(Q, fdiv(c0, d0)));
}
/* substitute variable v by the polynomial S */
function psubst(P, v, S) {
  const R = pnew(), pw = [pconst([1n, 1n])];
  for (const [k, c] of P) {
    const ix = mvars(k); const rest = ix.filter((x) => x !== v); const e = ix.length - rest.length;
    if (e === 0) { pacc(R, k, c); continue; }
    while (pw.length <= e) pw.push(pmul(pw[pw.length - 1], S));
    const m = mkey(rest);
    for (const [k2, c2] of pw[e]) pacc(R, mmulKey(m, k2), fmul(c, c2));
  }
  return R;
}
/* a product definition: exactly α·t + β·x·y (t not among x, y) — returns {t, c: -β/α, a: x, b: y} */
function asDefinition(P) {
  if (P.size !== 2) return null;
  const e = [...P.entries()].map(([k, c]) => ({ ix: mvars(k), c }));
  const lin = e.find((x) => x.ix.length === 1), quad = e.find((x) => x.ix.length === 2);
  if (!lin || !quad || quad.ix.includes(lin.ix[0])) return null;
  return { t: lin.ix[0], c: fdiv([-quad.c[0], quad.c[1]], lin.c), a: quad.ix[0], b: quad.ix[1] };
}
const show = (P, n = 6) => [...P.entries()].slice(0, n).map(([k, c]) => (c[1] === 1n ? String(c[0]) : c[0] + '/' + c[1]) + (k ? '·x[' + k + ']' : '')).join(' + ') + (P.size > n ? ' + …' : '');

/* ---- V1: the coefficient table ------------------------------------------------------------------------------------- */
function lexLess(a, b) { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] < b[i]; return a.length < b.length; }
function decideV1(txt, gz) {
  if (sha(txt) !== PIN.table.sha256) refuse('V1: the table is not the bytes whose sha256 the TeX states');
  if (txt.length !== CLAIM.bytes) refuse('V1: the table has ' + txt.length + ' bytes, the TeX states ' + CLAIM.bytes);
  if (!zlib.gunzipSync(gz).equals(txt)) refuse('V1: the gzip companion is not the same bytes');
  const lines = txt.toString('utf8').split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  if (!lines[0].startsWith('#')) refuse('V1: the first line is not a comment');
  const phi = new Map(); let prev = null, deg = 0, maxAbs = 0n; const used = new Set();
  for (let i = 1; i < lines.length; i++) {
    const tok = lines[i].split(' ');
    if (!/^-?[1-9]\d*$/.test(tok[0])) refuse('V1: line ' + (i + 1) + ' does not start with a nonzero integer');
    const c = BigInt(tok[0]), ix = tok.slice(1).map((t) => { if (!/^(0|[1-9]\d*)$/.test(t)) refuse('V1: line ' + (i + 1) + ' has a malformed index'); return Number(t); });
    for (let j = 1; j < ix.length; j++) if (ix[j] < ix[j - 1]) refuse('V1: line ' + (i + 1) + ' indices are not nondecreasing');
    if (prev && !lexLess(prev, ix)) refuse('V1: line ' + (i + 1) + ' is not after line ' + i + ' in lexicographic index-list order (or repeats it)');
    prev = ix; phi.set(mkey(ix), c); deg = Math.max(deg, ix.length); if (babs(c) > maxAbs) maxAbs = babs(c);
    for (const v of ix) used.add(v);
  }
  const maxIndex = Math.max(...used);
  const n = { bytes: txt.length, monomials: phi.size, degree: deg, variables: used.size, maxIndex, witnesses: used.size - 1, inputOccurs: used.has(0), maxAbsCoefficient: String(maxAbs), below2to80: maxAbs < (1n << 80n) };
  const differs = [];
  if (n.monomials !== CLAIM.monomials) differs.push('monomials ' + n.monomials);
  if (n.degree !== CLAIM.degree) differs.push('degree ' + n.degree);
  if (n.variables !== CLAIM.variables || maxIndex !== CLAIM.variables - 1 || !n.inputOccurs) differs.push('variables ' + n.variables + ' (largest index ' + maxIndex + ')');
  if (maxAbs !== CLAIM.maxAbs || !n.below2to80) differs.push('max |coefficient| ' + maxAbs);
  return { phi, n, verdict: differs.length ? 'REFUTED' : 'CERTIFIED', differs };
}

/* ---- V2: the sum of squares ---------------------------------------------------------------------------------------- */
function intRow(terms, what) {   /* integer polynomial as a list of [BigInt, key] after collecting */
  const P = prow(terms, what);
  for (const c of P.values()) if (c[1] !== 1n) refuse(what + ' has a non-integer coefficient');
  return P;
}
function decideV2(residualRows, weights, vmap, phi) {
  if (residualRows.length !== CLAIM.rows) refuse('V2: ' + residualRows.length + ' residuals, the TeX states ' + CLAIM.rows);
  if (!Array.isArray(weights) || weights.length !== residualRows.length || !weights.every((w) => w === 1)) refuse('V2: the weights are not ' + residualRows.length + ' ones');
  if (!Array.isArray(vmap) || vmap.length !== CLAIM.variables || vmap[0] !== 0 || new Set(vmap).size !== vmap.length || !vmap.every((x) => Number.isSafeInteger(x) && x >= 0)) refuse('V2: the variable map is not a bijection of ' + CLAIM.variables + ' indices fixing 0');
  const R = residualRows.map((r, i) => intRow(r, 'V2: residual ' + i));
  R.forEach((P, i) => { if (P.size === 0) refuse('V2: residual ' + i + ' is zero'); if (pdeg(P) > 2) refuse('V2: residual ' + i + ' has degree ' + pdeg(P)); });
  const sum = new Map();
  for (const P of R) {
    const e = [...P.entries()].map(([k, c]) => [k, c[0]]);
    for (let i = 0; i < e.length; i++) for (let j = 0; j < e.length; j++) {
      const k = mmulKey(e[i][0], e[j][0]); const s = (sum.get(k) || 0n) + e[i][1] * e[j][1];
      if (s === 0n) sum.delete(k); else sum.set(k, s);
    }
  }
  const keys = new Set([...sum.keys(), ...phi.keys()]); const bad = [];
  for (const k of keys) if ((sum.get(k) || 0n) !== (phi.get(k) || 0n)) bad.push(k);
  bad.sort((a, b) => (lexLess(mvars(a), mvars(b)) ? -1 : 1));
  return { verdict: bad.length ? 'REFUTED' : 'CERTIFIED', R, n: { residuals: R.length, maxResidualDegree: Math.max(...R.map(pdeg)), weightsAllOne: true, expansionMonomials: sum.size, differingMonomials: bad.length, firstDiffering: bad[0] === undefined ? null : { monomial: bad[0], fromSquares: String(sum.get(bad[0]) || 0n), inTable: String(phi.get(bad[0]) || 0n) } } };
}

/* ---- V3: the certificate replay ------------------------------------------------------------------------------------ */
class System {
  constructor() { this.rows = new Map(); this.occ = new Map(); this.ever = new Set(); }
  set(id, P) {
    const old = this.rows.get(id);
    if (old) for (const v of pvarsOf(old)) { const s = this.occ.get(v); s.delete(id); if (!s.size) this.occ.delete(v); }
    if (P.size === 0) { this.rows.delete(id); return; }
    this.rows.set(id, P);
    for (const v of pvarsOf(P)) { if (!this.occ.has(v)) this.occ.set(v, new Set()); this.occ.get(v).add(id); this.ever.add(v); }
  }
  get(id) { return this.rows.get(id) || pnew(); }
  where(v) { return this.occ.get(v) || new Set(); }
}
const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const fracOf = (x, what) => (Array.isArray(x) ? fr(big(x[0], what), big(x[1], what)) : [big(x, what), 1n]);
const ratPoly = (o, what) => { if (!o || !Array.isArray(o.terms)) malformed(what + ' is not {denominator, terms}'); return pscale(prow(o.terms, what), fr(1n, big(o.denominator, what + ' denominator'))); };

/* the parity block of the prose (TeX 10125-10172), in private symbols */
const SYM = {}; ['b', 't', 'U', 'e', 'p', 'q', 's', 'h', 'u', 'v', 'a', 'z', 'c', 'w', 'j', 'k'].forEach((s, i) => { SYM[s] = 1e9 + i; });
const X = (s) => pvar(SYM[s]), K = (n) => pconst([BigInt(n), 1n]);
const M = (...f) => f.reduce((A, B) => pmul(A, B)), A = (...f) => f.reduce((P, Q) => padd(P, Q)), S = psub;
const OLD = [
  S(M(X('U'), A(K(1), M(X('b'), X('t'), X('t')))), M(X('b'), S(K(1), M(X('b'), X('t'), X('t'))))),
  S(M(X('p'), X('p')), M(K(17), X('b'), S(A(K(1), M(K(2), X('e'))), M(K(3), X('e'), X('e'))))),
  S(X('h'), M(X('e'), S(M(K(17), X('b')), M(X('U'), X('U'))))),
  S(M(K(17), X('b'), X('q'), X('q')), M(S(M(X('s'), X('s')), M(K(17), X('b'), X('h'))), A(M(X('s'), X('s')), M(K(51), X('b'), X('h'))))),
];
const NEW = [
  S(X('z'), M(X('u'), X('u'))), S(X('a'), M(X('b'), X('v'))), S(A(X('z'), M(X('v'), X('a'))), M(X('b'), X('b'))), S(X('c'), M(X('b'), X('e'))),
  A(S(S(M(X('p'), X('p')), M(K(17), X('b'))), M(K(34), X('c'))), M(K(51), X('e'), X('c'))),
  A(S(X('w'), M(K(17), X('b'), X('c'))), M(X('c'), X('z'))),
  S(X('j'), M(X('s'), X('s'))), S(X('k'), M(X('b'), X('q'))),
  S(S(A(M(X('j'), X('j')), M(K(34), X('j'), X('w'))), M(K(867), X('w'), X('w'))), M(K(17), X('q'), X('k'))),
];
const OLD_ORDER = ['t', 'U', 'e', 'p', 'q', 's', 'h'], NEW_ORDER = ['u', 'v', 'a', 'z', 'e', 'p', 'c', 'w', 's', 'q', 'j', 'k'];
function rename(P, map) { let R = P; for (const [from, to] of map) R = psubst(R, from, pvar(to)); return R; }
function matchSet(rows, targets, what) {   /* each row proportional to a distinct target, every target used */
  const used = new Set();
  for (const [id, P] of rows) {
    const i = targets.findIndex((T, j) => !used.has(j) && pprop(P, T));
    if (i < 0) refuse(what + ': row ' + id + ' (' + show(P, 4) + ') is no equation of the prose');
    used.add(i);
  }
  if (used.size !== targets.length) refuse(what + ': ' + (targets.length - used.size) + ' equation(s) of the prose have no row');
}
/* the identities the prose displays, and the forward map into the nine, as exact rational functions N/δ^k */
function parityIdentities() {
  const b = X('b'), t = X('t'), u = X('u'), v = X('v');
  const delta = A(K(1), M(b, t, t));
  const I1 = S(A(ppow(M(b, S(K(1), M(b, t, t))), 2), M(b, ppow(M(K(2), b, t), 2))), M(b, b, ppow(delta, 2)));
  const I2 = S(A(M(S(u, b), ppow(A(u, b), 2)), M(b, A(u, b), v, v)), M(A(u, b), S(A(M(u, u), M(b, v, v)), M(b, b))));
  if (I1.size || I2.size) refuse('V3 parity_conic: an identity the prose displays is false');
  /* rational functions (N, k) = N/δ^k */
  const lift = (r, k) => (r[1] === k ? r[0] : pmul(r[0], ppow(delta, k - r[1])));
  const radd = (r, s) => { const k = Math.max(r[1], s[1]); return [padd(lift(r, k), lift(s, k)), k]; };
  const rmul = (r, s) => [pmul(r[0], s[0]), r[1] + s[1]];
  const rsubst = (P, env) => {   /* env: symbol -> rational function; others stay */
    let acc = [pnew(), 0];
    for (const [k, c] of P) {
      let term = [pconst(c), 0];
      for (const x of mvars(k)) term = rmul(term, env[x] || [pvar(x), 0]);
      acc = radd(acc, term);
    }
    return acc;
  };
  const U = [M(b, S(K(1), M(b, t, t))), 1];                        /* the first old equation solved, δ ≠ 0 */
  const h = rsubst(M(X('e'), S(M(K(17), b), M(X('U'), X('U')))), { [SYM.U]: U });   /* the third solved */
  const V = [M(K(2), b, t), 1];
  const env = {
    [SYM.u]: U, [SYM.v]: V, [SYM.a]: rmul([b, 0], V), [SYM.z]: rmul(U, U), [SYM.c]: [M(b, X('e')), 0],
    [SYM.w]: rmul([b, 0], h), [SYM.j]: [M(X('s'), X('s')), 0], [SYM.k]: [M(b, X('q')), 0], [SYM.U]: U, [SYM.h]: h,
  };
  const o2 = rsubst(OLD[1], env), o4 = rsubst(OLD[3], env);
  const prop = (r, s) => pprop(lift(r, Math.max(r[1], s[1])), lift(s, Math.max(r[1], s[1])));
  const out = NEW.map((N, i) => { const r = rsubst(N, env); return r[0].size === 0 ? 'zero' : prop(r, o2) ? 'a multiple of the second old equation' : prop(r, o4) ? 'a multiple of the fourth old equation' : refuse('V3 parity_conic: the forward map does not carry new equation ' + (i + 1) + ' into the old ones'); });
  return { displayedIdentities: 2, forward: out };
}

function replay(lines, sourceRows, sourceHeader, sourceEntrySha, sourceSha) {
  const census = {}; const sys = new System(); const notes = { reuseScales: {}, circuitOutputs: [], parity: null };
  const touch = (line, i, kind, allowed, patches) => {
    if (!Array.isArray(patches)) malformed('line ' + i + ' (' + kind + '): no patches');
    const ids = new Set(); const out = new Map();
    for (const p of patches) {
      if (!Array.isArray(p) || p.length !== 2) malformed('line ' + i + ' (' + kind + '): a malformed patch');
      const id = idx(p[0], 'line ' + i + ' patch row');
      if (ids.has(id)) malformed('line ' + i + ' (' + kind + '): row ' + id + ' patched twice');
      ids.add(id); out.set(id, prow(p[1], 'line ' + i + ' patch ' + id));
    }
    if (!sameSet(ids, allowed)) refuse('line ' + i + ' (' + kind + '): the patched rows are not the rows the step may change');
    return out;
  };
  const apply = (i, kind, patched, declaredNew) => {   /* freshness, degree, then the change */
    const before = new Set(sys.occ.keys());
    for (const [id, P] of patched) {
      if (pdeg(P) > 2) refuse('line ' + i + ' (' + kind + '): row ' + id + ' has degree ' + pdeg(P));
      for (const v of pvarsOf(P)) if (!before.has(v)) {
        if (!declaredNew.has(v)) refuse('line ' + i + ' (' + kind + '): row ' + id + ' uses x' + v + ', which is not in the current system and not declared new');
        if (sys.ever.has(v)) refuse('line ' + i + ' (' + kind + '): x' + v + ' is not fresh');
      }
    }
    for (const [id, P] of patched) sys.set(id, P);
    if (!sys.occ.has(0)) refuse('line ' + i + ' (' + kind + '): the input x0 no longer occurs');
  };
  const noInput = (i, kind, vs) => { for (const v of vs) if (v === 0) refuse('line ' + i + ' (' + kind + '): input coordinate 0 is a target of deletion or redefinition'); };

  /* line 0, the quadratic lift */
  const L0 = lines[0];
  if (!L0 || L0.kind !== 'initial') malformed('line 0 is not the initial lift');
  if (L0.source_sha256 !== sourceSha || L0.source_entry_sha256 !== sourceEntrySha || L0.source_id !== CLAIM.sourceId) refuse('line 0 names another source');
  if (L0.source_rows !== CLAIM.sourceRows || sourceRows.length !== CLAIM.sourceRows || sourceHeader.residuals !== CLAIM.sourceRows) refuse('line 0: the source does not have ' + CLAIM.sourceRows + ' residuals');
  if (L0.source_variables !== CLAIM.sourceCoordinates || sourceHeader.witnesses + 1 !== CLAIM.sourceCoordinates) refuse('line 0: the source does not have ' + CLAIM.sourceCoordinates + ' coordinates');
  const SRC = sourceRows.map((r, j) => prow(r, 'source row ' + j));
  const srcVars = new Set(); SRC.forEach((P) => pvarsOf(P).forEach((v) => srcVars.add(v)));
  if (Math.max(...srcVars) >= CLAIM.sourceCoordinates) refuse('line 0: a source row uses a coordinate beyond ' + (CLAIM.sourceCoordinates - 1));
  const srcDegree = Math.max(...SRC.map(pdeg));
  /* amendment B: the header's degree is that of the sum of squares (TeX 6614-6615, "degree-eight sum-of-squares encoding") */
  if (sourceHeader.degree !== 2 * srcDegree) malformed('line 0: the source header states degree ' + sourceHeader.degree + ', and its rows square to degree ' + 2 * srcDegree);
  const gates = L0.gates, reuse = L0.reuse, lifted = L0.rows;
  if (!Array.isArray(gates) || !Array.isArray(reuse) || !Array.isArray(lifted) || lifted.length !== CLAIM.sourceRows + gates.length) refuse('line 0: the lift is not the source rows followed by one row per gate');
  const def = new Map();
  for (const r of reuse) {
    const v = idx(r.variable, 'reuse'), a = idx(r.product[0], 'reuse'), b = idx(r.product[1], 'reuse'), an = idx(r.anchor, 'reuse');
    const s = fr(big(r.scale[0], 'scale'), 1n), s1 = fr(big(r.scale[1], 'scale'), 1n);
    notes.reuseScales[r.scale.join('/')] = (notes.reuseScales[r.scale.join('/')] || 0) + 1;
    const want = psub(pmono([v], s), pmono([a, b], s1));
    if (!SRC[an] || !pprop(SRC[an], want) || SRC[an].size !== 2) refuse('line 0: reuse x' + v + ' — source row ' + an + ' is not ' + show(want) + ' up to nonzero scale');
    if (!peq(prow(lifted[an], 'lifted ' + an), SRC[an])) refuse('line 0: reuse anchor row ' + an + ' is changed in the lift');
    if (def.has(v)) refuse('line 0: x' + v + ' defined twice');
    def.set(v, { c: fdiv(s1, s), a, b });
  }
  gates.forEach((g, k) => {
    const v = idx(g.variable, 'gate'), a = idx(g.product[0], 'gate'), b = idx(g.product[1], 'gate');
    if (v < CLAIM.sourceCoordinates || srcVars.has(v) || def.has(v)) refuse('line 0: gate x' + v + ' is not fresh');
    if (!pprop(prow(lifted[CLAIM.sourceRows + k], 'gate row'), psub(pvar(v), pmono([a, b], [1n, 1n])))) refuse('line 0: gate ' + k + ' (x' + v + ' = x' + a + '·x' + b + '): lifted row ' + (CLAIM.sourceRows + k) + ' is not its definition');
    def.set(v, { c: [1n, 1n], a, b });
  });
  noInput(0, 'initial', def.keys());
  /* amendment C: a lifted row is its source row up to a nonzero rational factor, modulo the definitions. The gates (new,
     shallow) are substituted first; a reuse is substituted only where the two sides still differ, a level at a time — the
     source's 25 anchor squarings make a full expansion into undefined variables astronomically long (x1^(2^25)). */
  const gateSet = new Set(gates.map((g) => g.variable));
  const memo = new Map(), visiting = new Set();
  const expandGate = (v) => {
    if (!gateSet.has(v)) return [[1n, 1n], [v]];
    if (memo.has(v)) return memo.get(v);
    if (visiting.has(v)) refuse('line 0: the definitions are cyclic at x' + v);
    visiting.add(v); const d = def.get(v), A1 = expandGate(d.a), B1 = expandGate(d.b); visiting.delete(v);
    const r = [fmul(d.c, fmul(A1[0], B1[0])), [...A1[1], ...B1[1]].sort((x, y) => x - y)]; memo.set(v, r); return r;
  };
  const NFg = (P) => { const R = pnew(); for (const [k, c] of P) { let cc = c, ix = []; for (const v of mvars(k)) { const e = expandGate(v); cc = fmul(cc, e[0]); ix = ix.concat(e[1]); } pacc(R, mkey(ix.sort((x, y) => x - y)), cc); } return R; };
  const factor = (P, Q) => { const [k0, c0] = P.entries().next().value; const d0 = Q.get(k0); return d0 ? fdiv(c0, d0) : null; };
  notes.liftFactors = {}; notes.liftRowsNeedingReuse = 0;
  for (let j = 0; j < lifted.length; j++) {
    const P = prow(lifted[j], 'lifted row ' + j);
    if (pdeg(P) > 2) refuse('line 0: lifted row ' + j + ' has degree ' + pdeg(P));
    if (j < CLAIM.sourceRows) {
      let G = NFg(P), H = SRC[j], rounds = 0;
      while (!pprop(G, H)) {
        if (++rounds > 6) malformed('line 0: lifted row ' + j + ' is not shown equal to source row ' + j + ' by the gates and six levels of reuse substitution (a limit of this reader)');
        const only = (A1, B1) => [...pvarsOf(A1)].filter((v) => def.has(v) && !gateSet.has(v) && !pvarsOf(B1).has(v));
        const subIn = (A1, vs) => vs.reduce((R, v) => psubst(R, v, pmono([def.get(v).a, def.get(v).b], def.get(v).c)), A1);
        const g = only(G, H), h = only(H, G);
        if (!g.length && !h.length) refuse('line 0: lifted row ' + j + ', definitions substituted back, is not source row ' + j + ' up to a nonzero factor');
        G = subIn(G, g); H = subIn(H, h); notes.liftRowsNeedingReuse += rounds === 1 ? 1 : 0;
      }
      const f = G.size ? factor(G, H) : [1n, 1n]; const fk = f[1] === 1n ? String(f[0]) : f[0] + '/' + f[1];
      notes.liftFactors[fk] = (notes.liftFactors[fk] || 0) + 1;
    }
    sys.set(j, P);
  }
  srcVars.forEach((v) => sys.ever.add(v));
  census.initial = 1;

  /* lines 1 … the steps */
  let i = 1;
  for (; i < lines.length && !['weights', 'final'].includes(lines[i].kind); i++) {
    const L = lines[i], kind = L.kind, d = L.data || {};
    census[kind] = (census[kind] || 0) + 1;
    if (kind === 'linear') {
      const a = big(d.a, 'a'), b = big(d.b, 'b'), t = idx(d.target, 'target'), o = idx(d.other, 'other');
      if (a === 0n) refuse('line ' + i + ' (linear): a = 0');
      if (t === o) refuse('line ' + i + ' (linear): other = target');
      if (!sys.rows.has(o) || !sys.rows.has(t)) refuse('line ' + i + ' (linear): a row is not in the current system');
      const P = touch(L, i, kind, new Set([t]), L.patches);
      const comb = padd(pscale(sys.get(t), [a, 1n]), pscale(sys.get(o), [b, 1n]));   /* amendment D: up to the row normalization */
      if (!pprop(P.get(t), comb) || (P.get(t).size === 0) !== (comb.size === 0)) refuse('line ' + i + ' (linear): the new row is not a nonzero multiple of a·R' + t + ' + b·R' + o);
      if (comb.size) { const [k0, c0] = P.get(t).entries().next().value; const f = fdiv(c0, comb.get(k0)); const fk = f[1] === 1n ? String(f[0]) : f[0] + '/' + f[1]; notes.linearFactors = notes.linearFactors || {}; notes.linearFactors[fk] = (notes.linearFactors[fk] || 0) + 1; }
      apply(i, kind, P, new Set());
    } else if (kind === 'eliminate') {
      const v = idx(d.variable, 'variable'), row = idx(d.row, 'row');
      noInput(i, kind, [v]);
      const F = prow(d.replacement, 'replacement'), c = big(d.denominator, 'denominator');
      if (c === 0n) refuse('line ' + i + ' (eliminate): a zero denominator');
      if (pvarsOf(F).has(v)) refuse('line ' + i + ' (eliminate): the replacement contains x' + v);
      if (!pprop(sys.get(row), psub(pvar(v, [c, 1n]), F))) refuse('line ' + i + ' (eliminate): row ' + row + ' is not c·x' + v + ' − F up to scale');
      const aff = new Set((d.affected || []).map((x) => idx(x, 'affected')));
      const occ = new Set(sys.where(v)); occ.delete(row);
      if (!sameSet(aff, occ)) refuse('line ' + i + ' (eliminate): the affected rows are not every other row containing x' + v);
      const P = touch(L, i, kind, new Set([row, ...aff]), L.patches);
      if (P.get(row).size) refuse('line ' + i + ' (eliminate): the defining row is not deleted');
      const Fc = pscale(F, fr(1n, c));
      for (const j of aff) if (!pprop(P.get(j), psubst(sys.get(j), v, Fc))) refuse('line ' + i + ' (eliminate): row ' + j + ' is not a nonzero multiple of itself with x' + v + ' := F/c');
      apply(i, kind, P, new Set());
      if (sys.occ.has(v)) refuse('line ' + i + ' (eliminate): x' + v + ' still occurs');
    } else if (kind === 'relation_eliminate') {
      const x = idx(d.variable, 'variable'), row = idx(d.row, 'row');
      noInput(i, kind, [x]);
      const N = ratPoly(d.replacement, 'replacement');
      if (pvarsOf(N).has(x)) refuse('line ' + i + ' (relation_eliminate): the replacement contains x' + x);
      if (!pprop(sys.get(row), psub(pvar(x), N))) refuse('line ' + i + ' (relation_eliminate): row ' + row + ' is not x' + x + ' − N up to scale');
      const red = new Map((d.reductions || []).map((r) => [idx(r.row, 'reduction row'), r.terms || []]));
      const occ = new Set(sys.where(x)); occ.delete(row);
      if (!sameSet(new Set(red.keys()), occ)) refuse('line ' + i + ' (relation_eliminate): the reduced rows are not every other row containing x' + x);
      const changed = new Set([row, ...red.keys()]);
      const P = touch(L, i, kind, changed, L.patches);
      if (P.get(row).size) refuse('line ' + i + ' (relation_eliminate): the defining row is not deleted');
      for (const [j, terms] of red) {
        let E = psubst(sys.get(j), x, N);
        for (const tm of terms) {
          const k = idx(tm.support, 'support');
          if (changed.has(k) || !sys.rows.has(k) || pvarsOf(sys.get(k)).has(x)) refuse('line ' + i + ' (relation_eliminate): support row ' + k + ' is not an unchanged x' + x + '-free row');
          E = psub(E, pmul(ratPoly(tm.multiplier, 'multiplier'), sys.get(k)));
        }
        if (!pprop(E, P.get(j))) refuse('line ' + i + ' (relation_eliminate): the identity for row ' + j + ' fails (F(N) − ΣM·H is not a nonzero multiple of the new row)');
      }
      apply(i, kind, P, new Set());
      if (sys.occ.has(x)) refuse('line ' + i + ' (relation_eliminate): x' + x + ' still occurs');
    } else if (kind === 'shear') {
      const v = idx(d.variable, 'variable'), w = idx(d.other, 'other'), c = fracOf(d.scalar, 'scalar');
      noInput(i, kind, [v]);
      if (v === w || !sys.occ.has(w)) refuse('line ' + i + ' (shear): the other witness is not a retained one');
      const aff = new Set((d.affected || []).map((x) => idx(x, 'affected')));
      if (!sameSet(aff, sys.where(v))) refuse('line ' + i + ' (shear): the affected rows are not every row containing x' + v);
      const P = touch(L, i, kind, aff, L.patches);
      const sub = padd(pvar(v), pvar(w, c));
      for (const j of aff) if (!pprop(P.get(j), psubst(sys.get(j), v, sub))) refuse('line ' + i + ' (shear): row ' + j + ' is not a nonzero multiple of itself with x' + v + ' := x' + v + ' + c·x' + w);
      apply(i, kind, P, new Set());
    } else if (kind === 'circuit') {
      const oldRows = d.old_rows.map((x) => idx(x, 'old row')), oldT = d.old_targets.map((x) => idx(x, 'old target')), newT = d.new_targets.map((x) => idx(x, 'new target')), outs = d.outputs.map((x) => idx(x, 'output'));
      if (oldRows.length !== oldT.length) refuse('line ' + i + ' (circuit): old rows and targets do not pair');
      const oldDef = new Map();
      oldRows.forEach((r, k) => { const D = asDefinition(sys.get(r)); if (!D || D.t !== oldT[k]) refuse('line ' + i + ' (circuit): old row ' + r + ' is not the definition of x' + oldT[k]); oldDef.set(D.t, D); });
      const P = touch(L, i, kind, new Set(oldRows), L.patches);
      const newDef = new Map();
      oldRows.forEach((r, k) => {
        if (k < newT.length) { const D = asDefinition(P.get(r)); if (!D || D.t !== newT[k]) refuse('line ' + i + ' (circuit): new row ' + r + ' is not the definition of x' + newT[k]); newDef.set(D.t, D); }
        else if (P.get(r).size) refuse('line ' + i + ' (circuit): row ' + r + ' should be deleted');
      });
      const val = (defs, v, seen = new Set()) => { const D = defs.get(v); if (!D) return [[1n, 1n], [v]]; if (seen.has(v)) refuse('line ' + i + ' (circuit): cyclic'); seen.add(v); const a = val(defs, D.a, seen), b = val(defs, D.b, seen); seen.delete(v); return [fmul(D.c, fmul(a[0], b[0])), [...a[1], ...b[1]].sort((x, y) => x - y)]; };
      const kept = oldT.filter((t) => newDef.has(t));
      for (const o of outs) if (!kept.includes(o)) refuse('line ' + i + ' (circuit): output x' + o + ' is not kept');
      for (const t of kept) { const a = val(oldDef, t), b = val(newDef, t); if (!feq(a[0], b[0]) || mkey(a[1]) !== mkey(b[1])) refuse('line ' + i + ' (circuit): x' + t + ' has another value through the new definitions'); }
      const base = new Set(outs.flatMap((o) => val(newDef, o)[1]));
      notes.circuitOutputs.push(outs.map((o) => val(newDef, o)[1].length) .join('/') + (base.size === 1 ? '' : ' (several bases)'));
      const deleted = oldT.filter((t) => !newDef.has(t));
      noInput(i, kind, deleted);
      for (const t of deleted) for (const r of sys.where(t)) if (!oldRows.includes(r)) refuse('line ' + i + ' (circuit): deleted target x' + t + ' is used in row ' + r);
      apply(i, kind, P, new Set(newT.filter((t) => !oldDef.has(t))));
      for (const t of deleted) if (sys.occ.has(t)) refuse('line ' + i + ' (circuit): deleted target x' + t + ' still occurs');
    } else if (kind === 'parity_conic') {
      const b = idx(d.input, 'input'), oldW = d.old_witnesses.map((x) => idx(x, 'old witness')), nv = d.new_variables.map((x) => idx(x, 'new variable'));
      const defs = d.definitions.map(([r, v]) => [idx(r, 'definition row'), idx(v, 'definition variable')]), resRows = d.residual_rows.map((x) => idx(x, 'residual row'));
      if (oldW.length !== 7 || nv.length !== 12 || resRows.length !== 4) refuse('line ' + i + ' (parity_conic): not the prose\'s seven old witnesses, twelve new variables and four equations');
      noInput(i, kind, [...oldW, ...defs.map((x) => x[1])]);
      const block = new Set([...resRows, ...defs.map((x) => x[0])]);
      const dmap = new Map();
      for (const [r, v] of defs) { const D = asDefinition(sys.get(r)); if (!D || D.t !== v) refuse('line ' + i + ' (parity_conic): row ' + r + ' is not the definition of x' + v); dmap.set(v, D); }
      for (const v of [...oldW, ...dmap.keys()]) for (const r of sys.where(v)) if (!block.has(r)) refuse('line ' + i + ' (parity_conic): x' + v + ' is not private to the block (row ' + r + ')');
      const val = (v) => { const D = dmap.get(v); if (!D) return pvar(v); return pscale(pmul(val(D.a), val(D.b)), D.c); };
      const toSym = new Map([[b, SYM.b], ...oldW.map((v, k) => [v, SYM[OLD_ORDER[k]]])]);
      const oldEqs = resRows.map((r) => { let E = sys.get(r); for (const v of dmap.keys()) E = psubst(E, v, val(v)); for (const v of pvarsOf(E)) if (!toSym.has(v)) refuse('line ' + i + ' (parity_conic): row ' + r + ' uses x' + v + ' outside the block'); return [r, rename(E, toSym)]; });
      matchSet(oldEqs, OLD, 'line ' + i + ' (parity_conic) old block');
      const P = touch(L, i, kind, block, L.patches);
      const toNew = new Map([[b, SYM.b], ...nv.map((v, k) => [v, SYM[NEW_ORDER[k]]])]);
      const newEqs = [...P].filter(([, Q]) => Q.size).map(([r, Q]) => { for (const v of pvarsOf(Q)) if (!toNew.has(v)) refuse('line ' + i + ' (parity_conic): new row ' + r + ' uses x' + v); return [r, rename(Q, toNew)]; });
      matchSet(newEqs, NEW, 'line ' + i + ' (parity_conic) new block');
      notes.parity = parityIdentities();
      apply(i, kind, P, new Set(nv));
      for (const v of [...oldW, ...dmap.keys()]) if (sys.occ.has(v)) refuse('line ' + i + ' (parity_conic): x' + v + ' still occurs');
    } else malformed('line ' + i + ': an unknown step kind ' + JSON.stringify(kind));
  }
  const W = lines[i], F = lines[i + 1];
  if (!W || W.kind !== 'weights' || !F || F.kind !== 'final' || lines.length !== i + 2) malformed('the certificate does not end with its weights and final lines');
  return { sys, census, notes, weights: W.values, final: F, steps: i - 1 };
}

function decideV3(lines, sourceText, sourceEntrySha, residualRows, vmap, v1) {
  const src = sourceText.toString('utf8').split('\n').filter((l) => l.length).map(JP);
  const r = replay(lines, src.slice(1), src[0], sourceEntrySha, PIN.source.sha256);
  const differs = [];
  for (const [k, n] of Object.entries(CLAIM.census)) if (r.census[k] !== n) differs.push(k + ' ' + r.census[k] + ' (TeX ' + n + ')');
  if (r.steps !== CLAIM.steps) differs.push('steps ' + r.steps);
  const rows = [...r.sys.rows.entries()].sort((a, b) => a[0] - b[0]);
  /* the weights line has one entry per row id of the lift (deleted rows included); the rule is that every one is 1 */
  if (!Array.isArray(r.weights) || !r.weights.every((w) => w === 1) || rows.some(([id]) => id >= r.weights.length)) differs.push('the weights are not all one over the rows');
  if (rows.length !== CLAIM.rows) differs.push(rows.length + ' rows replayed');
  /* the variable map: vmap[new] = old, read from the data */
  const occurring = new Set(r.sys.occ.keys());
  if (!sameSet(new Set(vmap), occurring)) refuse('V3: the variable map\'s values are not the variables of the replayed system');
  const toNew = new Map(vmap.map((old, nw) => [old, nw]));
  const canon = (P, map) => [...P.entries()].map(([k, c]) => { if (c[1] !== 1n) refuse('V3: a replayed row has a non-integer coefficient'); return [mkey(mvars(k).map((v) => (map ? map.get(v) : v)).sort((x, y) => x - y)), c[0]]; }).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(([k, c]) => c + ':' + k).join(' ');
  const mine = rows.map(([, P]) => canon(P, toNew)).sort();   /* the replay is in its own indices; the published residuals already in the table's */
  const theirs = residualRows.map((t, j) => canon(intRow(t, 'residual ' + j))).sort();
  const same = mine.length === theirs.length && mine.every((x, j) => x === theirs[j]);
  const sameInOrder = same && rows.every(([, P], j) => canon(P, toNew) === canon(intRow(residualRows[j], 'residual ' + j)));
  if (!same) differs.push('the replayed system is not the published residuals');
  const rep = r.final.report || {};
  const reportAgrees = rep.rows === CLAIM.rows && rep.variables === CLAIM.variables && rep.witnesses === CLAIM.witnesses && rep.degree === CLAIM.degree && rep.monomials === v1.n.monomials && big(rep.max_abs_coefficient, 'report') === CLAIM.maxAbs;
  if (!reportAgrees) differs.push('the final report\'s counts');
  return {
    verdict: differs.length ? 'REFUTED' : 'CERTIFIED', differs,
    n: { sourceCoordinates: CLAIM.sourceCoordinates, sourceResiduals: src.length - 1, sourceDegree: src[0].degree, liftGates: lines[0].gates.length, liftReuses: lines[0].reuse.length, liftedRows: lines[0].rows.length, steps: r.steps, census: r.census, weightsLineEntries: r.weights.length, replayedRows: rows.length, equalsPublishedResiduals: same, sameOrderAsPublished: sameInOrder, variableMapDirection: 'variable-map.json[new index] = replayed index', finalReportAgrees: reportAgrees, finalRowsSha256: 'not checked: its serialization is not stated' },
    notes: r.notes,
  };
}

/* ---- the run, and the controls ------------------------------------------------------------------------------------- */
function inputs() {
  const tex = readPinned(PIN.tex);
  const txt = readPinned(PIN.table), gz = readPinned(PIN.tableGz);
  const residuals = JP(zlib.gunzipSync(readPinned(PIN.residuals)).toString('utf8'));
  const weights = JP(readPinned(PIN.weights).toString('utf8'));
  const vmap = JP(readPinned(PIN.variableMap).toString('utf8'));
  const cert = zlib.gunzipSync(readPinned(PIN.certificate)).toString('utf8').split('\n').filter((l) => l.length).map(JP);
  const source = zlib.gunzipSync(readPinned(PIN.source));
  if (sha(source) !== PIN.source.uncompressedSha256) die('the source\'s uncompressed bytes are not the sha256 the TeX states');
  const entrySha = sha(readPinned(PIN.sourceEntry));
  const t = tex.toString('utf8');
  for (const s of [PIN.table.sha256, PIN.certificate.sha256, PIN.source.sha256, PIN.source.uncompressedSha256, CLAIM.sourceId, '685783949153203534233890', '72\\,925', '4\\,973', '4\\,552', '4\\,513', '4\\,935'])
    if (!t.includes(s)) die('the TeX does not state ' + s + ' (the claim this decides moved)');
  return { txt, gz, residuals, weights, vmap, cert, source, entrySha };
}
const clone = (x) => JSON.parse(JSON.stringify(x, (k, v) => (typeof v === 'bigint' ? { $big: String(v) } : v)), (k, v) => (v && typeof v === 'object' && '$big' in v ? BigInt(v.$big) : v));
function refusedBy(fn) { try { fn(); return null; } catch (e) { if (e instanceof Refuse) return e.message; throw e; } }
function controls(I, v1) {
  const out = [];
  const push = (id, what, msg, expect) => out.push({ id, what, refused: msg !== null, refusal: msg, passed: msg !== null && (!expect || expect.test(msg)) });
  /* C1 */
  const lines = I.txt.toString('utf8').split('\n'); const tok = lines[2].split(' '); tok[0] = String(BigInt(tok[0]) + 1n); lines[2] = tok.join(' ');
  const txt1 = Buffer.from(lines.join('\n'));
  push('C1a', 'one coefficient of the table changed by one: V1', refusedBy(() => decideV1(txt1, I.gz)), /V1/);
  push('C1b', 'the same change: V2 (the squares no longer give the table)', refusedBy(() => { const phi = new Map(v1.phi); const k = mkey(tok.slice(1).map(Number)); phi.set(k, phi.get(k) + 1n); const r = decideV2(I.residuals, I.weights, I.vmap, phi); if (r.verdict !== 'CERTIFIED') refuse('V2: ' + r.n.differingMonomials + ' monomial(s) differ'); }), /V2/);
  /* C2 */
  push('C2a', 'one residual dropped', refusedBy(() => { const r = decideV2(I.residuals.slice(1), I.weights.slice(1), I.vmap, v1.phi); if (r.verdict !== 'CERTIFIED') refuse('V2: differs'); }), /V2/);
  push('C2b', 'one weight set to 2', refusedBy(() => { const w = I.weights.slice(); w[0] = 2; decideV2(I.residuals, w, I.vmap, v1.phi); }), /weights/);
  /* C3, one planted mutant per kind, each refused at its line */
  const first = (kind, ok = () => true) => I.cert.findIndex((l) => l.kind === kind && ok(l));
  const mutant = (id, what, line, mutate) => {
    const C = clone(I.cert); mutate(C[line]);
    const msg = refusedBy(() => decideV3(C, I.source, I.entrySha, I.residuals, I.vmap, v1));
    push(id, what + ' (line ' + line + ')', msg, new RegExp('^line ' + line + '\\b'));
  };
  mutant('C3a', 'initial: a gate\'s product changed', 0, (L) => { L.gates[0].product[1] += 1; });
  mutant('C3b', 'linear: a = 0', first('linear'), (L) => { L.data.a = 0; });
  mutant('C3c', 'eliminate: one affected row left out', first('eliminate', (l) => l.data.affected.length > 1), (L) => { L.data.affected.pop(); });
  mutant('C3d', 'relation_eliminate: one multiplier coefficient changed', first('relation_eliminate', (l) => l.data.reductions.some((r) => r.terms.length)), (L) => { const t = L.data.reductions.find((r) => r.terms.length).terms[0].multiplier.terms[0]; t[0] = big(t[0], 'm') + 1n; });
  mutant('C3e', 'shear: the scalar changed', first('shear'), (L) => { L.data.scalar = [L.data.scalar[0], big(L.data.scalar[1], 's') + 1n]; });
  mutant('C3f', 'circuit: r^24 defined as r^16·r^4', first('circuit', (l) => l.data.new_targets.length === 7), (L) => {
    const [, r4, r8, , r24] = L.data.new_targets; const p = L.patches.find((q) => q[1].some((t) => t[1].length === 1 && t[1][0] === r24));
    for (const t of p[1]) if (t[1].length === 2) t[1] = t[1].map((x) => (x === r8 ? r4 : x));
  });
  mutant('C3g', 'parity_conic: one coefficient of a new equation changed', first('parity_conic'), (L) => { const p = L.patches.find((q) => q[1].some((t) => Number(t[0]) === 867)); const t = p[1].find((x) => Number(x[0]) === 867); t[0] = 868; });
  mutant('C3h', 'the input coordinate 0 as the eliminated variable', first('eliminate'), (L) => { L.data.variable = 0; });
  /* C4, the arithmetic against a red list */
  const P = prow([[3, [1]], [-2, [2, 5]], [7, []]], 'c4'), Q = prow([[5, [2]], [1, [1, 1]]], 'c4');
  const lhs = pmul(padd(P, Q), padd(P, Q)), rhs = A(pmul(P, P), pscale(pmul(P, Q), [2n, 1n]), pmul(Q, Q));
  const sub = psubst(pmul(P, Q), 2, padd(pvar(1), K(3)));
  const sub2 = pmul(psubst(P, 2, padd(pvar(1), K(3))), psubst(Q, 2, padd(pvar(1), K(3))));
  const greens = peq(lhs, rhs) && peq(sub, sub2) && pprop(pscale(P, fr(-3n, 7n)), P) && feq(fadd(fr(1n, 3n), fr(1n, 6n)), fr(1n, 2n));
  const reds = [peq(lhs, padd(pmul(P, P), pmul(Q, Q))), pprop(padd(P, K(1)), P), peq(sub, pmul(P, Q)), pprop(P, pnew())];
  push('C4', 'our arithmetic: four identities hold, four planted non-identities are seen', greens && reds.every((x) => !x) ? 'every planted non-identity was seen' : null);
  return out;
}

function build() {
  const t0 = Date.now();
  const I = inputs();
  const v1 = decideV1(I.txt, I.gz);
  const v2 = decideV2(I.residuals, I.weights, I.vmap, v1.phi);
  let v3;
  try { v3 = decideV3(I.cert, I.source, I.entrySha, I.residuals, I.vmap, v1); }
  catch (e) { if (!(e instanceof Refuse)) throw e; v3 = { verdict: e.format ? 'REFUSED' : 'REFUTED', differs: [e.message], n: null, notes: null }; }
  const ctl = controls(I, v1);
  const controlsOk = ctl.every((c) => c.passed);
  const verdicts = { V1: v1.verdict, V2: v2.verdict, V3: v3.verdict };
  const verdict = !controlsOk ? 'REFUSED' : Object.values(verdicts).every((v) => v === 'CERTIFIED') ? 'CERTIFIED' : Object.values(verdicts).includes('REFUTED') ? 'REFUTED' : 'REFUSED';
  const reason = !controlsOk ? 'a control did not come out as pre-registered: ' + ctl.filter((c) => !c.passed).map((c) => c.id).join(', ')
    : verdict === 'CERTIFIED' ? 'the table is the stated polynomial; it is exactly the sum of the squares of the 4,552 published residuals; and all 551 certificate steps check by the manuscript\'s rules, from the published source to exactly those residuals; every control refused'
      : 'see the question that is not CERTIFIED';
  return {
    rec: {
      what: 'The Version 4 quartic of the claim "Z is Diophantine in Q" (Glazer et al., Version 4, 2026-11-06): V1 its coefficient table, V2 the sum of squares, V3 its certificate replayed from the arithmetic source by the manuscript\'s own step rules, by a clean-room reader (Node, BigInt, exact rationals; none of the repository\'s .py run, read or ported).',
      undecided: UNDECIDED,
      generated: new Date().toISOString().slice(0, 10),
      preregistration: 'notes/zq-v4-preregistration-2026-11-06.md',
      pins: PIN,
      code: { 'tools/zq-v4.js': sha(fs.readFileSync(__filename)) },
      claim: { variables: CLAIM.variables, witnesses: CLAIM.witnesses, monomials: CLAIM.monomials, degree: CLAIM.degree, maxAbsCoefficient: String(CLAIM.maxAbs), residuals: CLAIM.rows, sourceCoordinates: CLAIM.sourceCoordinates, sourceResiduals: CLAIM.sourceRows, steps: CLAIM.steps, census: CLAIM.census, sources: ['quartic_4973.tex thm:quartic (8695-8711)', '8713-8729 (the table)', '10036-10063 (the source)', '10179-10215 (the finite realization)'] },
      verdict, reason, verdicts,
      V1: { verdict: v1.verdict, differs: v1.differs, numbers: v1.n },
      V2: { verdict: v2.verdict, numbers: v2.n },
      V3: { verdict: v3.verdict, differs: v3.differs, numbers: v3.n, notes: v3.notes },
      readings: {
        V1: 'the TeX\'s rules for the table (8716-8723): one comment line; a nonzero integer then a nondecreasing index list per line; rows strictly increasing in lexicographic index-list order, so like terms are collected; the variables are the indices that occur.',
        V2: 'Σ Rᵢ² expanded by our own code, every product of two terms, compared monomial by monomial with the table.',
        V3: 'each step kind checked by the condition TeX 10065-10177 states (pre-registration, amendment A); the rows the certificate patches are adopted only after the check; the step\'s proofs that the rational input projection is preserved are read, not decided, except the parity block\'s displayed identities and its forward map, checked as exact rational functions.',
      },
      controls: ctl,
    },
    seconds: (Date.now() - t0) / 1000,
  };
}

const { rec: L, seconds } = build();
const strip = (x) => JSON.stringify(Object.assign({}, x, { generated: null }));
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) die('no record to check');
  if (strip(JSON.parse(fs.readFileSync(OUT, 'utf8'))) !== strip(L)) die('certs/zq-v4.json is not what the pinned package and this code give now');
  console.log('zq-v4: re-derived, identical · ' + L.verdict + ' · V1 ' + L.verdicts.V1 + ' · V2 ' + L.verdicts.V2 + ' · V3 ' + L.verdicts.V3 + ' · ' + seconds.toFixed(1) + ' s');
} else {
  fs.writeFileSync(OUT, JSON.stringify(L, null, 1) + '\n');
  console.log('zq-v4: ' + L.verdict + ' · V1 ' + L.verdicts.V1 + (L.V1.differs.length ? ' (' + L.V1.differs.join('; ') + ')' : '') + ' · V2 ' + L.verdicts.V2 + ' · V3 ' + L.verdicts.V3 + (L.V3.differs.length ? ' (' + L.V3.differs.join('; ') + ')' : '') + ' · controls ' + L.controls.filter((c) => c.passed).length + '/' + L.controls.length + ' · ' + seconds.toFixed(1) + ' s');
  for (const c of L.controls.filter((x) => !x.passed)) console.log('  control ' + c.id + ' NOT as predicted: ' + c.refusal);
}
