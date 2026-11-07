#!/usr/bin/env node
/* c51-replay.js — the C51 replay (teorth/optimizationproblems PR #184, row [R2026b], C51 >= 0.5850788196744): the
   JavaScript half, and the writer of certs/c51-replay.json. Pre-registered in
   notes/c51-replay-preregistration-2026-11-07.md before this file existed.

   What is decided: for the exact K = 3.5681854310698435, alpha = 3.9615431126097391 the claimant publishes,
       A = max_theta |P(theta)| <= 1/0.5850788196744,   P(theta) = 2 sum_{n>=0} K^{-T_n} e^{i alpha T_n} cos((2n+1) theta),
   T_n = n(n+1)/2, on the whole circle with the infinite tail. What is READ and not decided: He–Tang's Theorem 2.8
   with Lemma 3.1 (arXiv:2602.12217), beta(f_{K,eps}) = 1/A.

   Two implementations sharing no code with each other, with the claimant's scripts (never read, never run) or with
   arhancanli's replay (never read, never run):
     this file    BigInt decimal fixed point 10^-100, outward rounding; N = 13; cover [0, 3927/2500]; e^{ix} by Taylor
                  series at x/2^12 and twelve squarings, e^{i alpha T_n} directly from alpha*T_n (no reduction mod 2 pi);
                  K^{-T_n} by repeated outward-rounded products; pi from Strassnitzky's arctan(1/2)+arctan(1/5)+
                  arctan(1/8); cell bound F(m) + |F'(m)| r + G2 r^2/2 with the exact rational G2 = 2(g0 g2 + g1^2) >=
                  sup|F''|, and the monotonicity test |F'(m)| > G2 r; depth-first decision with a gap refusal;
                  enclosure by refining every surviving cell each round
     tools/c51-replay.py   Python integers, binary fixed point 2^-320; N = 14; cover [0, 1609/1024]; the mean-value
                  form with the interval extension of F' over the cell; best-first enclosure (run here as a child)

   usage: node tools/c51-replay.js           re-check the pins over the network, run both implementations, every row,
                                             control and self-test → certs/c51-replay.json (~45 s)
          node tools/c51-replay.js --check   the battery, offline: both implementations re-derived and compared with
                                             the record; nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'certs', 'c51-replay.json');
const PRE = 'notes/c51-replay-preregistration-2026-11-07.md';
const PY = 'tools/c51-replay.py';
const ME = 'tools/c51-replay.js';
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('C51 REPLAY REFUSED: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

/* ---- the pins (pre-registered) ------------------------------------------------------------------------------------ */
const CERT_COMMIT = 'ed6387399cf6de02eaa4cf10c43787633496619a';
const PR_HEAD = 'f7003e2e1893a522593fc8072ad072672168cff3';
const PINS = {
  data: { url: `https://raw.githubusercontent.com/AndreRoehrig/optimization-constants-certificates/${CERT_COMMIT}/certificates/maximum_term.json`, sha256: 'dcf9d1bc0f6d7b295e0eff548cf73faf092efd8d038829e4d19755f07df33683' },
  manifest: { url: `https://raw.githubusercontent.com/AndreRoehrig/optimization-constants-certificates/${CERT_COMMIT}/MANIFEST.sha256`, sha256: 'ff8af05cdbe590ea8c75f9c451760281ff19fa9628dbf79b9a62413ee06b5368' },
  note: { url: `https://raw.githubusercontent.com/AndreRoehrig/optimization-constants-certificates/${CERT_COMMIT}/notes/maximum_term.md`, sha256: 'f81bb57a98a8daec96837224b7a5d0f5ce108c645c205cd693ca928bb8a9fe41' },
  page51a: { url: `https://raw.githubusercontent.com/teorth/optimizationproblems/${PR_HEAD}/constants/51a.md`, sha256: 'ee27509994f3f7e967d21f9fb0206fcf57cec8c22febb13400dc153fddc41c01' },
  paper: { url: 'https://arxiv.org/pdf/2602.12217v1', sha256: 'd61ee288717d1a7b436d270d10b88bcf9c95049814d8cdc897a9f5346f08bce9' },
};
const ARHAN = { url: 'https://github.com/teorth/optimizationproblems/pull/184#issuecomment-6705699711', id: 6705699711, createdAt: '2026-11-07T10:36:28Z', bodySha256: '3f99e9a35cd4c2a6fab5c63ae16e646ebd5bc334f601b51152ad1d66e241769c',
  A: ['1.709171425067672530527823486722', '1.709171425067672530527824486723'], beta: ['0.585078819674513477028433803123', '0.585078819674513477028434145442'],
  betaOld: ['0.585078819653352950854632279223', '0.585078819653352950854632621542'], theta: '0.6455415545', gap: '1.16e-15', x: '0.6503' };
const NOTE = { maxUpper: '1.709171425067816128872617735945', betaLower: '0.585078819674464320841496314106', betaOldUpper: '0.585078819653352950854632621542' };

/* ---- exact rationals ---------------------------------------------------------------------------------------------- */
const fdiv = (a, b) => { const q = a / b; return (a % b !== 0n && ((a < 0n) !== (b < 0n))) ? q - 1n : q; };
const cdiv = (a, b) => { const q = a / b; return (a % b !== 0n && ((a < 0n) === (b < 0n))) ? q + 1n : q; };
const gcd = (a, b) => { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { const t = a % b; a = b; b = t; } return a; };
const R = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
const rParse = (s) => {
  if (s.includes('/')) { const [a, b] = s.split('/'); return R(BigInt(a), BigInt(b)); }
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s); if (!m) throw new Error('not a decimal: ' + s);
  const f = m[3] || ''; return R(BigInt(m[1] + m[2] + f), 10n ** BigInt(f.length));
};
const rAdd = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
const rSub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
const rMul = (a, b) => R(a.n * b.n, a.d * b.d);
const rDiv = (a, b) => R(a.n * b.d, a.d * b.n);
const rPow = (a, k) => R(a.n ** BigInt(k), a.d ** BigInt(k));
const rCmp = (a, b) => { const x = a.n * b.d - b.n * a.d; return x < 0n ? -1 : x > 0n ? 1 : 0; };
const rI = (k) => R(BigInt(k));
const p10 = (k) => (k >= 0 ? R(10n ** BigInt(k)) : R(1n, 10n ** BigInt(-k)));
function rDec(r, digits, mode) {   /* rounded in the stated direction: an upper end is never cut down */
  const sc = 10n ** BigInt(digits);
  const v = mode === 'floor' ? fdiv(r.n * sc, r.d) : cdiv(r.n * sc, r.d);
  const neg = v < 0n, a = neg ? -v : v;
  return (neg ? '-' : '') + (a / sc).toString() + (digits ? '.' + (a % sc).toString().padStart(digits, '0') : '');
}
function rSci(r, digits, mode) {
  if (r.n === 0n) return '0';
  const ab = R(r.n < 0n ? -r.n : r.n, r.d);
  let e = ab.n.toString().length - ab.d.toString().length;
  while (rCmp(ab, p10(e)) < 0) e--;
  while (rCmp(ab, p10(e + 1)) >= 0) e++;
  const m = rDiv(ab, p10(e));
  return rDec(r.n < 0n ? R(-m.n, m.d) : m, digits, mode) + 'e' + e;
}
function isqrt(n) {
  if (n < 0n) throw new Error('isqrt of a negative');
  if (n < 2n) return n;
  let x = 1n << (BigInt(n.toString(2).length) / 2n + 1n);
  for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; }
}
class Refuse extends Error {}

/* ---- decimal fixed-point intervals [lo, hi] meaning [lo/S, hi/S], rounded outward ------------------------------- */
function Arith(D) {
  const S = 10n ** BigInt(D);
  const lo = (r) => fdiv(r.n * S, r.d), hi = (r) => cdiv(r.n * S, r.d);
  const q = (r) => [lo(r), hi(r)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[1], a[1] - b[0]];
  const mul = (a, b) => {
    const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
    let m = p[0], M = p[0];
    for (let i = 1; i < 4; i++) { if (p[i] < m) m = p[i]; if (p[i] > M) M = p[i]; }
    return [fdiv(m, S), cdiv(M, S)];
  };
  const sqr = (a) => {
    if (a[0] >= 0n) return [fdiv(a[0] * a[0], S), cdiv(a[1] * a[1], S)];
    if (a[1] <= 0n) return [fdiv(a[1] * a[1], S), cdiv(a[0] * a[0], S)];
    const u = a[0] * a[0] > a[1] * a[1] ? a[0] * a[0] : a[1] * a[1];
    return [0n, cdiv(u, S)];
  };
  const scale = (a, k) => (k >= 0n ? [a[0] * k, a[1] * k] : [a[1] * k, a[0] * k]);
  const shrink = (a, k) => [fdiv(a[0], k), cdiv(a[1], k)];
  const unit = (a) => {
    const l = a[0] < -S ? -S : a[0], h = a[1] > S ? S : a[1];
    if (l > h) throw new Error('a cosine enclosure left [-1, 1]');
    return [l, h];
  };
  const cmul = (x, y) => [sub(mul(x[0], y[0]), mul(x[1], y[1])), add(mul(x[0], y[1]), mul(x[1], y[0]))];
  const csq = (x) => [sub(sqr(x[0]), sqr(x[1])), scale(mul(x[0], x[1]), 2n)];
  const absmax = (a) => { const u = a[0] < 0n ? -a[0] : a[0], v = a[1] < 0n ? -a[1] : a[1]; return u > v ? u : v; };
  /* e^{ix} for every x in the interval: Taylor at y = x/2^12 with the remainder |y|^k/k! on both parts, then 12 squarings */
  function expi(x) {
    const y = shrink(x, 4096n), Y = absmax(y);
    let re = [S, S], im = [0n, 0n], t = [S, S], u = S;
    for (let k = 1; ; k++) {
      u = cdiv(u * Y, S * BigInt(k));
      if (u <= 1n) { re = [re[0] - u, re[1] + u]; im = [im[0] - u, im[1] + u]; break; }
      if (k > 5000) throw new Refuse('the exponential series did not converge');
      t = shrink(mul(t, y), BigInt(k));
      switch (k % 4) { case 0: re = add(re, t); break; case 1: im = add(im, t); break; case 2: re = sub(re, t); break; default: im = sub(im, t); }
    }
    let z = [unit(re), unit(im)];
    for (let j = 0; j < 12; j++) { const w = csq(z); z = [unit(w[0]), unit(w[1])]; }
    return z;
  }
  return { D, S, lo, hi, q, add, sub, mul, sqr, scale, shrink, unit, cmul, csq, absmax, expi };
}

const Tn = (n) => (n * (n + 1)) / 2;
function piStrassnitzky(A) {   /* pi/4 = arctan(1/2) + arctan(1/5) + arctan(1/8), alternating series, outward */
  let tot = [0n, 0n];
  for (const q of [2n, 5n, 8n]) {
    let s = [0n, 0n];
    for (let k = 0n; ; k++) {
      const den = (2n * k + 1n) * q ** (2n * k + 1n);
      const t = [fdiv(A.S, den), cdiv(A.S, den)];
      if (t[1] <= 1n) { s = [s[0] - 1n, s[1] + 1n]; break; }
      s = k % 2n === 0n ? A.add(s, t) : A.sub(s, t);
    }
    tot = A.add(tot, s);
  }
  return A.scale(tot, 4n);
}

/* ---- P_N for one parameter set -------------------------------------------------------------------------------- */
function makeFn(A, K, al, N) {
  const kinv = A.q(rDiv(rI(1), K));
  const c = [];
  let pw = [A.S, A.S];
  for (let n = 0; n <= N; n++) {
    if (n > 0) for (let j = 0; j < n; j++) pw = A.mul(pw, kinv);
    const E = A.expi(A.q(rMul(al, rI(Tn(n)))));
    c.push([A.mul(pw, E[0]), A.mul(pw, E[1])]);
  }
  const iK = rDiv(rI(1), K);
  const tau = rDiv(rMul(rI(2), rPow(iK, Tn(N + 1))), rSub(rI(1), rPow(iK, N + 2)));
  const g = [0, 1, 2].map((k) => { let s = rI(0); for (let n = 0; n <= N; n++) s = rAdd(s, rMul(rI(2 * (2 * n + 1) ** k), rPow(iK, Tn(n)))); return s; });
  const G2 = rMul(rI(2), rAdd(rMul(g[0], g[2]), rMul(g[1], g[1])));
  const G2hi = A.hi(G2);
  const S = A.S;
  function at(th) {
    const z = A.expi(th), z2 = A.csq(z);
    let Z = z, PR = [0n, 0n], PI = [0n, 0n], DR = [0n, 0n], DI = [0n, 0n];
    for (let n = 0; n <= N; n++) {
      const C = A.unit(Z[0]), Sn = A.unit(Z[1]), k = BigInt(2 * n + 1);
      PR = A.add(PR, A.mul(c[n][0], C)); PI = A.add(PI, A.mul(c[n][1], C));
      DR = A.sub(DR, A.scale(A.mul(c[n][0], Sn), k)); DI = A.sub(DI, A.scale(A.mul(c[n][1], Sn), k));
      Z = A.cmul(Z, z2);
    }
    PR = A.scale(PR, 2n); PI = A.scale(PI, 2n); DR = A.scale(DR, 2n); DI = A.scale(DI, 2n);
    return { F: A.add(A.sqr(PR), A.sqr(PI)), Fd: A.scale(A.add(A.mul(DR, PR), A.mul(DI, PI)), 2n) };
  }
  const memo = new Map();
  const Fpt = (t) => { const key = t.toString(); let v = memo.get(key); if (!v) { v = at([t, t]).F; if (memo.size < 200000) memo.set(key, v); } return v; };
  function cell(a, b) {
    const s = a + b;
    if (s % 2n !== 0n) throw new Refuse('working precision exhausted: a cell midpoint is not representable');
    const m = s / 2n, r = (b - a) / 2n;
    const { F, Fd } = at([m, m]);
    let ub = F[1] + cdiv(A.absmax(Fd) * r, S) + cdiv(G2hi * r * r, 2n * S * S);
    let how = 'taylor';
    const G2r = G2hi * r;
    if (Fd[0] * S > G2r) { const e = Fpt(b)[1]; if (e < ub) { ub = e; how = 'monotone'; } }
    else if (Fd[1] * S < -G2r) { const e = Fpt(a)[1]; if (e < ub) { ub = e; how = 'monotone'; } }
    return { ub, m, F, how };
  }
  return { A, K, al, N, c, tau, G2, G2hi, at, cell, Fpt };
}

const MAX_DEPTH = 64, BUDGET = 400000;
function decide(fn, aClaim, U, piI, opt = {}) {
  const A = fn.A, S = A.S;
  const Ui = A.lo(U);
  if (rCmp(R(Ui, S), U) !== 0) return { verdict: 'REFUSED', why: 'U is not representable at this precision' };
  if (rCmp(aClaim, fn.tau) <= 0) return { verdict: 'REFUSED', why: 'the tail bound exceeds the claim' };
  const tc = A.lo(rPow(rSub(aClaim, fn.tau), 2)), tr = A.hi(rPow(rAdd(aClaim, fn.tau), 2));
  const stack = [[0n, Ui, 0]], leaves = [];
  let cells = 0, depth = 0, mono = 0;
  try {
    while (stack.length) {
      const [a, b, d] = stack.pop();
      cells++; if (d > depth) depth = d;
      if (cells > BUDGET) return { verdict: 'REFUSED', why: 'cell budget exhausted', cells, depth };
      const { ub, m, F, how } = fn.cell(a, b);
      if (ub <= tc) { leaves.push([a, b]); if (how === 'monotone') mono++; continue; }
      if (F[0] > tr) return { verdict: 'REFUTED', why: 'a witness theta with |P_N| - tau above the claim', witnessTheta: rDec(R(m, S), 30, 'floor'), cells, depth, excessF: rSci(rSub(R(F[0], S), rPow(rAdd(aClaim, fn.tau), 2)), 6, 'floor') };
      if (F[0] > tc) return { verdict: 'REFUSED', why: 'gap: a point lies above the certification threshold and below the refutation threshold (the tail bound and the precision leave the claim undecidable here)', cells, depth };
      if (d >= MAX_DEPTH) return { verdict: 'REFUSED', why: 'depth budget exhausted', cells, depth };
      stack.push([m, b, d + 1], [a, m, d + 1]);
    }
  } catch (e) { if (e instanceof Refuse) return { verdict: 'REFUSED', why: e.message, cells, depth }; throw e; }
  if (opt.dropLeaf) leaves.splice(leaves.length >> 1, 1);
  leaves.sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0));
  let ok = leaves.length > 0 && leaves[0][0] === 0n && leaves[leaves.length - 1][1] === Ui, why = 'contiguous';
  for (let i = 1; ok && i < leaves.length; i++) if (leaves[i][0] !== leaves[i - 1][1]) { ok = false; why = 'a gap or overlap at a cell edge'; }
  if (!ok) return { verdict: 'REFUSED', why: 'coverage check: ' + (why === 'contiguous' ? 'the cover does not span [0, U]' : why), cells, leaves: leaves.length };
  if (rCmp(rMul(rI(2), U), R(piI[1], 10n ** 100n)) < 0) return { verdict: 'REFUSED', why: 'coverage check: 2U < upper end of pi, [0, U] may miss [0, pi/2]', cells, leaves: leaves.length, U: U.n + '/' + U.d };
  return { verdict: 'CERTIFIED', cells, leaves: leaves.length, depth, monotoneLeaves: mono };
}

function enclose(fn, U, tol) {   /* every round: drop cells below the best lower bound, split those not yet within tol */
  const A = fn.A, S = A.S, Ui = A.lo(U), tolI = A.hi(tol);
  let ev = [{ a: 0n, b: Ui, ...fn.cell(0n, Ui) }];
  let L = ev[0].F[0], Larg = ev[0].m, cells = 1, rounds = 0;
  for (;;) {
    ev = ev.filter((c) => c.ub >= L);
    let top = ev[0].ub; for (const c of ev) if (c.ub > top) top = c.ub;
    if (top - L <= tolI) {
      ev.sort((x, y) => (x.a < y.a ? -1 : 1));
      const near = A.hi(R(1n, 10n ** 9n)), cl = [];
      for (const c of ev) { if (cl.length && c.a - cl[cl.length - 1][1] <= near) { if (c.b > cl[cl.length - 1][1]) cl[cl.length - 1][1] = c.b; cl[cl.length - 1][2]++; } else cl.push([c.a, c.b, 1]); }
      const A_lo = rSub(R(isqrt(L * S), S), fn.tau);
      const sh = isqrt(top * S), A_hi = rAdd(R(sh * sh === top * S ? sh : sh + 1n, S), fn.tau);
      return { A_lo, A_hi, cells, rounds, theta: R(Larg, S), clusters: cl.map(([a, b, k]) => [R(a, S), R(b, S), k]) };
    }
    if (cells > BUDGET) throw new Refuse('enclosure budget exhausted');
    const next = [];
    for (const c of ev) {
      if (c.ub - L <= tolI) { next.push(c); continue; }
      const m = (c.a + c.b) / 2n;
      for (const [x, y] of [[c.a, m], [m, c.b]]) {
        const e = { a: x, b: y, ...fn.cell(x, y) }; cells++;
        if (e.F[0] > L) { L = e.F[0]; Larg = e.m; }
        next.push(e);
      }
    }
    ev = next; rounds++;
  }
}
function summary(e, digits = 30) {
  return {
    A: [rDec(e.A_lo, digits, 'floor'), rDec(e.A_hi, digits, 'ceil')],
    beta: [rDec(rDiv(rI(1), e.A_hi), digits, 'floor'), rDec(rDiv(rI(1), e.A_lo), digits, 'ceil')],
    width: rSci(rSub(e.A_hi, e.A_lo), 3, 'ceil'),
    argmaxTheta: rDec(e.theta, 12, 'floor'),
    maximizerIn: e.clusters.map(([a, b, k]) => ({ theta: [rDec(a, 12, 'floor'), rDec(b, 12, 'ceil')], cells: k })),
    cells: e.cells, rounds: e.rounds,
  };
}

/* ---- the JavaScript run --------------------------------------------------------------------------------------- */
const PARAMS = { R2026b: ['3.5681854310698435', '3.9615431126097391'], S2026: ['3.568182317714', '3.961543335688'], HT2026: ['7137/2000', '198074929/50000000'] };
const CLAIM = '0.5850788196744';
const N_JS = 13, U_JS = R(3927n, 2500n), TOL = R(1n, 10n ** 32n);

function runJs() {
  const A = Arith(100), Api = Arith(100);
  const piI = piStrassnitzky(Api);
  const b0 = rParse(CLAIM), inv = (b) => rDiv(rI(1), b);
  const fn = {}; for (const k of Object.keys(PARAMS)) fn[k] = makeFn(A, rParse(PARAMS[k][0]), rParse(PARAMS[k][1]), N_JS);
  const out = { impl: 'javascript', node: process.version, D: 100, N: N_JS, U: '3927/2500', claim: CLAIM, params: PARAMS,
    pi: [rDec(R(piI[0], A.S), 40, 'floor'), rDec(R(piI[1], A.S), 40, 'ceil')], tau: rSci(fn.R2026b.tau, 3, 'ceil'), G2: rDec(fn.R2026b.G2, 6, 'ceil') };
  const rows = {};
  rows.R1 = decide(fn.R2026b, inv(b0), U_JS, piI);
  rows.R2 = decide(fn.R2026b, rParse(NOTE.maxUpper), U_JS, piI);
  const E = enclose(fn.R2026b, U_JS, TOL);
  const Sm = summary(E);
  const F0 = fn.R2026b.Fpt(0n), tau = fn.R2026b.tau, S = A.S;
  const s0 = isqrt(F0[1] * S);
  const P0 = [rSub(R(isqrt(F0[0] * S), S), tau), rAdd(R(s0 * s0 === F0[1] * S ? s0 : s0 + 1n, S), tau)];
  Sm.absP0 = [rDec(P0[0], 30, 'floor'), rDec(P0[1], 30, 'ceil')];
  const gl = rSub(E.A_lo, P0[1]), gh = rSub(E.A_hi, P0[0]);
  Sm.maxMinusAbsP0 = [rSci(gl, 4, 'floor'), rSci(gh, 4, 'ceil')];
  Sm.interiorMaximumProved = gl.n > 0n;
  out.enclosure = Sm;
  rows.R1.marginBeta = rSci(rSub(rDiv(rI(1), E.A_hi), b0), 4, 'floor');
  rows.R1.marginA = rSci(rSub(inv(b0), E.A_hi), 4, 'floor');
  const ctl = {};
  const bl = rDiv(rI(1), E.A_hi), bh = rDiv(rI(1), E.A_lo), T13 = 10n ** 13n;
  const bUp = R(cdiv(bh.n * T13, bh.d), T13), bDn = R(fdiv(bl.n * T13, bl.d), T13);
  ctl.C1a = { ...decide(fn.R2026b, inv(bUp), U_JS, piI), claim: rDec(bUp, 13, 'floor') };
  ctl.C1b = { ...decide(fn.R2026b, inv(bDn), U_JS, piI), claim: rDec(bDn, 13, 'floor') };
  const fa = makeFn(A, rParse(PARAMS.R2026b[0]), rAdd(rParse(PARAMS.R2026b[1]), R(1n, 10n ** 6n)), N_JS);
  ctl.C2 = { ...decide(fa, inv(b0), U_JS, piI), enclosure: summary(enclose(fa, U_JS, R(1n, 10n ** 24n)), 20) };
  ctl.C3a = decide(fn.S2026, inv(b0), U_JS, piI);
  ctl.C3b = { ...decide(fn.S2026, inv(rParse('0.585078819653')), U_JS, piI), claim: '0.585078819653' };
  const Eo = enclose(fn.S2026, U_JS, TOL);
  ctl.C3c = { ...summary(Eo), betaHiBelowNoteUpper: rCmp(rDiv(rI(1), Eo.A_lo), rParse(NOTE.betaOldUpper)) <= 0 };
  ctl.C4a = { ...decide(fn.HT2026, inv(rParse('0.58507')), U_JS, piI), claim: '0.58507' };
  ctl.C4b = { ...decide(fn.HT2026, inv(rParse('0.5850724')), U_JS, piI), claim: '0.5850724', enclosure: summary(enclose(fn.HT2026, U_JS, R(1n, 10n ** 24n)), 20) };
  const ht5 = makeFn(A, rParse(PARAMS.HT2026[0]), rParse(PARAMS.HT2026[1]), 5);
  const th = A.mul(piI, A.q(R(2n * 1794536n, 2000000n)));
  const Fm = ht5.at(th).F, sh = isqrt(Fm[1] * S);
  const v = [R(isqrt(Fm[0] * S), S), R(sh * sh === Fm[1] * S ? sh : sh + 1n, S)], pr = rParse('1.709176397414741464507875');
  ctl.C4c = { absP5: [rDec(v[0], 30, 'floor'), rDec(v[1], 30, 'ceil')], printed: '1.709176397414741464507875',
    agreesToPrintedDigits: rCmp(rSub(pr, p10(-24)), v[0]) <= 0 && rCmp(v[1], rAdd(pr, p10(-24))) <= 0,
    sameFirst25Digits: rDec(v[0], 24, 'floor') === '1.709176397414741464507875' && rDec(v[1], 24, 'floor') === '1.709176397414741464507875' };
  ctl.C5a = decide(fn.R2026b, inv(b0), R(3n, 2n), piI);
  ctl.C5b = decide(fn.R2026b, inv(b0), U_JS, piI, { dropLeaf: true });
  const f2 = makeFn(A, rParse(PARAMS.R2026b[0]), rParse(PARAMS.R2026b[1]), 2);
  ctl.C6 = { ...decide(f2, inv(b0), U_JS, piI), tau: rSci(f2.tau, 4, 'ceil') };
  const f10 = makeFn(Arith(10), rParse(PARAMS.R2026b[0]), rParse(PARAMS.R2026b[1]), N_JS);
  ctl.C7 = decide(f10, inv(b0), U_JS, piI);
  ctl.C8a = decide(fn.R2026b, rSub(E.A_lo, p10(-25)), U_JS, piI);
  ctl.C8b = decide(fn.R2026b, rAdd(E.A_hi, p10(-25)), U_JS, piI);
  out.rows = rows; out.controls = ctl;
  out.selftests = selftestsJs(A, piI, fn.R2026b);
  out._E = E;
  return out;
}

function selftestsJs(A, piI, fn) {
  const S = A.S, o = {};
  const PI50 = rParse('3.14159265358979323846264338327950288419716939937510');
  o.piStrassnitzkyContainsPublished50 = rCmp(R(piI[0], S), rAdd(PI50, p10(-50))) <= 0 && rCmp(rSub(PI50, p10(-50)), R(piI[1], S)) <= 0;
  const half = A.q(R(1n, 2n));
  const z3 = A.expi(A.shrink(piI, 3n)), z6 = A.expi(A.shrink(piI, 6n));
  o.cosPiOver3ContainsHalf = z3[0][0] <= half[0] && half[1] <= z3[0][1];
  o.sinPiOver6ContainsHalf = z6[1][0] <= half[0] && half[1] <= z6[1][1];
  let seed = 51n; const rnd = (n) => { seed = (seed * 6364136223846793005n + 1442695040888963407n) % (1n << 64n); return (seed >> 11n) % n; };
  let okN = true, okSym = true, okCell = true, okG2 = true;
  for (let i = 0; i < 40; i++) {
    const t = rnd(S * 3n / 2n);
    const z = A.expi([t, t]), n2 = A.add(A.sqr(z[0]), A.sqr(z[1]));
    okN = okN && n2[0] <= S && S <= n2[1];
    const F1 = fn.at([t, t]).F, F2 = fn.at([-t, -t]).F, F3 = fn.at(A.sub(piI, [t, t])).F;
    const lo = [F1[0], F2[0], F3[0]].reduce((a, b) => (a > b ? a : b)), hi = [F1[1], F2[1], F3[1]].reduce((a, b) => (a < b ? a : b));
    okSym = okSym && lo <= hi;
    const h = S / 10n ** 6n;
    const Fp = fn.at([t + h, t + h]).F[0], Fc = fn.at([t, t]).F[0], Fm = fn.at([t - h, t - h]).F[0];
    const d2 = (Fp - 2n * Fc + Fm) * S / (h * h);
    okG2 = okG2 && (d2 < 0n ? -d2 : d2) <= fn.G2hi;
  }
  const Ui = A.lo(U_JS);
  for (let i = 0; i < 30; i++) {
    const w = [Ui >> 8n, Ui >> 14n, Ui >> 22n][i % 3] & ~1n;
    let a = rnd(Ui - w); a -= a & 1n;
    const { ub } = fn.cell(a, a + w);
    for (let j = 0; j < 7; j++) { const t = a + rnd(w + 1n); okCell = okCell && fn.at([t, t]).F[0] <= ub; }
  }
  o.unitModulus = okN; o.symmetries = okSym; o.cellBoundAboveSamples = okCell; o.G2AboveSecondDifferences = okG2;
  let nx = rI(0); const iK = rDiv(rI(1), fn.K);
  for (let n = fn.N + 1; n <= fn.N + 40; n++) nx = rAdd(nx, rMul(rI(2), rPow(iK, Tn(n))));
  o.tailAboveNext40Terms = rCmp(fn.tau, nx) >= 0;
  return o;
}

/* ---- the Python run, and the comparison ------------------------------------------------------------------------- */
function runPy() {
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, PY)], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) die('the Python implementation failed: ' + (r.stderr || '').slice(-400));
  return JSON.parse(r.stdout);
}
const PRED = {   /* the pre-registered predictions */
  R1: 'CERTIFIED', R2: 'CERTIFIED', C1a: 'REFUTED', C1b: 'CERTIFIED', C2: 'REFUTED', C3a: 'REFUTED', C3b: 'CERTIFIED',
  C4a: 'CERTIFIED', C4b: 'CERTIFIED', C5a: 'REFUSED', C5b: 'REFUSED', C6: 'REFUSED', C7: 'REFUSED', C8a: 'REFUTED', C8b: 'CERTIFIED',
};
const WORDS = {
  R1: 'beta >= 0.5850788196744 at the pinned K, alpha (the registry row)', R2: 'A <= 1.709171425067816128872617735945 (the claimant\'s printed maximum)',
  C1a: 'the least 13-decimal claim above our beta-enclosure', C1b: 'the greatest 13-decimal claim below it', C2: 'alpha + 1e-6, the claim 0.5850788196744',
  C3a: '[S2026] parameters, the claim 0.5850788196744', C3b: '[S2026] parameters, its own 0.585078819653', C4a: 'He–Tang (K0, alpha0), 0.58507',
  C4b: 'He–Tang (K0, alpha0), the registry\'s 0.5850724', C5a: 'the cover [0, 3/2] only', C5b: 'a certified cover with one accepted cell removed',
  C6: 'truncation N = 2', C7: 'working precision starved (2^-32 / 10^-10)', C8a: 'A <= (our lower end - 1e-25)', C8b: 'A <= (our upper end + 1e-25)',
};
function lt(a, b) { return rCmp(rParse(a), rParse(b)) <= 0; }
function compare(js, py) {
  const items = {};
  for (const k of Object.keys(PRED)) {
    const j = (js.rows[k] || js.controls[k]).verdict, p = (py.rows[k] || py.controls[k]).verdict;
    items[k] = { what: WORDS[k], predicted: PRED[k], js: j, py: p, agree: j === p, asPredicted: j === PRED[k] && p === PRED[k] };
  }
  const eJ = js.enclosure, eP = py.enclosure;
  const encl = {
    A: [lt(eJ.A[0], eP.A[0]) ? eP.A[0] : eJ.A[0], lt(eJ.A[1], eP.A[1]) ? eJ.A[1] : eP.A[1]],
    beta: [lt(eJ.beta[0], eP.beta[0]) ? eP.beta[0] : eJ.beta[0], lt(eJ.beta[1], eP.beta[1]) ? eJ.beta[1] : eP.beta[1]],
  };
  encl.intersect = lt(encl.A[0], encl.A[1]) && lt(encl.beta[0], encl.beta[1]);
  return { items, encl };
}

/* ---- the pins over the network (record mode only) ---------------------------------------------------------------- */
async function checkPins() {
  const got = {};
  for (const [k, p] of Object.entries(PINS)) {
    const r = await fetch(p.url);
    if (!r.ok) die(k + ': HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (sha(buf) !== p.sha256) die(k + ' does not match its pin');
    got[k] = buf;
  }
  const d = JSON.parse(got.data.toString('utf8'));
  if (d.constant !== 'C_51' || d.K !== PARAMS.R2026b[0] || d.alpha !== PARAMS.R2026b[1] || d.lower_bound !== CLAIM || d.N !== 9) die('the pinned data file does not carry the literals');
  if (!got.manifest.toString('utf8').split('\n').includes(PINS.data.sha256 + '  certificates/maximum_term.json')) die('the MANIFEST does not state the data file\'s sha256');
  const page = got.page51a.toString('utf8');
  const row = page.split('\n').find((x) => x.startsWith('| $0.5850788196744$\\* | [R2026b] |')) || die('no [R2026b] row at the PR head');
  if (!row.includes('$K=3.5681854310698435$, $\\alpha=3.9615431126097391$')) die('the row does not print the pinned parameters');
  if (!page.includes('P(\\theta)=2\\sum_{n=0}^\\infty K^{-T_n}e^{i\\alpha T_n}\\cos((2n+1)\\theta)') || !page.includes('let $T\\_n=n(n+1)/2$')) die('the page no longer states P and T_n as read');
  let arhan = 'not re-verified (gh unavailable)';
  try {
    const body = cp.execFileSync('gh', ['api', 'repos/teorth/optimizationproblems/issues/comments/' + ARHAN.id, '--jq', '.body'], { encoding: 'utf8' });
    arhan = sha(Buffer.from(body.replace(/\n$/, ''), 'utf8')) === ARHAN.bodySha256 || sha(Buffer.from(body, 'utf8')) === ARHAN.bodySha256 ? 'unchanged since read' : 'CHANGED since read';
  } catch (e) { /* offline */ }
  return { dataFields: { constant: d.constant, K: d.K, alpha: d.alpha, lower_bound: d.lower_bound, N: d.N }, manifestStatesData: true, rowAtHead: true, arhancanliComment: arhan };
}

function git(args) { return cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim(); }

async function main() {
  const js = runJs();
  const E = js._E; delete js._E;
  const py = runPy();
  if (py.params.R2026b[0] !== PARAMS.R2026b[0] || py.params.R2026b[1] !== PARAMS.R2026b[1] || py.claim !== CLAIM) die('the two implementations carry different literals');
  const cmp = compare(js, py);
  const allAgree = Object.values(cmp.items).every((x) => x.agree);
  const allPred = Object.values(cmp.items).every((x) => x.asPredicted);
  const r1 = cmp.items.R1;
  const verdict = r1.agree && r1.js !== 'REFUSED' ? r1.js : 'REFUSED';
  const deciders = { js: sha(fs.readFileSync(path.join(ROOT, ME))), py: sha(fs.readFileSync(path.join(ROOT, PY))) };
  const head = (o) => ({ verdict: o.verdict, why: o.why, cells: o.cells, depth: o.depth, leaves: o.leaves, witnessTheta: o.witnessTheta });
  if (CHECK) {
    const was = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const bad = [];
    if (was.verdict !== verdict) bad.push('verdict ' + was.verdict + ' -> ' + verdict);
    for (const k of Object.keys(PRED)) {
      const w = k[0] === 'R' ? { js: was.rows[k].js.verdict, py: was.rows[k].py.verdict } : was.controls[k];
      if (w.js !== cmp.items[k].js || w.py !== cmp.items[k].py) bad.push(k);
    }
    for (const side of ['js', 'py']) for (const q of ['A', 'beta']) if (JSON.stringify(was.enclosure[side][q]) !== JSON.stringify((side === 'js' ? js : py).enclosure[q])) bad.push(side + ' ' + q);
    if (JSON.stringify(was.enclosure.intersection) !== JSON.stringify(cmp.encl)) bad.push('intersection');
    if (bad.length) die('the re-derivation differs from the record: ' + bad.join(', '));
    if (was.deciders.js !== deciders.js || was.deciders.py !== deciders.py) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
    console.log('C51 REPLAY ' + verdict + ' — re-derived, equal to the record (' + Object.keys(PRED).length + ' rows and controls, both implementations; ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s)');
    return;
  }
  const pins = await checkPins();
  const preCommit = git(['log', '--format=%H %cI', '--diff-filter=A', '--', PRE]).split('\n').pop();
  const rec = {
    gaps: [
      'Not decided: He and Tang\'s Theorem 2.8 with Lemma 3.1 (beta(f_{K,eps}) = 1/max_theta|P(theta)|), read with Lemmas 2.1–2.7; the pairing of the indices n and -n-1 re-derived by hand; nothing formalized.',
      'Not decided: that these parameters are optimal, or that the printed digits are the best this function gives (C1b shows 0.5850788196745 also holds).',
      'Not run: the note\'s Bernstein certificate (scripts/certify_maximum_term.py and audit.py were never fetched); this replay is a second certificate of the same finite statement, not an audit of theirs.',
      'Not blind: arhancanli\'s comment (2026-11-07 10:36 UTC) was read, numbers included, before this replay; the replay is independent in code and method only.',
      'Not checked: Sothanaphan\'s note beyond the two parameters the PR prints; anything about the C42 half of the PR; the README merge conflict.',
    ],
    what: 'teorth/optimizationproblems PR #184, row [R2026b]: C_51 >= 0.5850788196744 for the He–Tang function f_{K,eps}, K = 3.5681854310698435, alpha = 3.9615431126097391 — the finite statement max_theta |P(theta)| <= 1/0.5850788196744 (infinite tail included, whole circle) decided by two implementations sharing no code with each other, with the claimant\'s scripts or with arhancanli\'s replay',
    verdict,
    margin: { beta: r1.agree ? js.rows.R1.marginBeta : null, A: js.rows.R1.marginA, betaPy: py.rows.R1.marginBeta, Apy: py.rows.R1.marginA },
    claim: { row: 'C_51 >= 0.5850788196744 [R2026b]', asA: 'A <= 1/0.5850788196744', K: PARAMS.R2026b[0], alpha: PARAMS.R2026b[1] },
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    git: git(['rev-parse', 'HEAD']),
    node: process.version, python: py.python,
    deciders,
    preregistration: { path: PRE, sha256: sha(fs.readFileSync(path.join(ROOT, PRE))), addedIn: preCommit,
      sha256AsRegistered: sha(cp.execFileSync('git', ['show', preCommit.split(' ')[0] + ':' + PRE], { cwd: ROOT })),
      amendments: 'A (2026-11-07, after the first full run): C6\'s tau_2 mis-stated in the note; the JavaScript gap refusal named; the self-test digits; run time; the cos^2 slip in arhancanli\'s comment' },
    pins: { certificateCommit: CERT_COMMIT, tag: 'v1.0.2', prHead: PR_HEAD, files: Object.fromEntries(Object.entries(PINS).map(([k, p]) => [k, { url: p.url, sha256: p.sha256 }])), checked: pins },
    read: ['PR #184 body, diff and its three comments (ours of 2026-10-06, maximusrufus 2026-11-04, arhancanli 2026-11-07 10:36:28 UTC)', 'the certificate repository\'s README.md, MANIFEST.sha256, notes/maximum_term.md, certificates/maximum_term.json, certificates/maximum_term_verification.json', 'arXiv:2602.12217v1 in full'],
    neverReadOrRun: ['scripts/certify_maximum_term.py', 'scripts/certify_turan.py', 'scripts/audit.py (sha256s known only from the MANIFEST)', 'github.com/arhancanli/quantavane-replays', 'QuanyuTang/ep513-arb-certification', 'Sothanaphan\'s note'],
    arhancanliComment: ARHAN,
    method: {
      reduction: 'max over the circle = max over [0, U] with U >= pi/2: |P(-t)| = |P(t)|, P(pi - t) = -P(t), period 2 pi; |P - P_N| <= tau_N = 2K^{-T_{N+1}}/(1 - K^{-(N+2)}) (T_{n+1} - T_n = n + 1 >= N + 2 for n >= N + 1), exact; CERTIFIED when every cell bound on F_N = |P_N|^2 is <= (a - tau)^2 and the accepted cells cover [0, U] with 2U >= pi_hi; REFUTED by a witness with F_N > (a + tau)^2',
      js: { arithmetic: 'BigInt decimal fixed point 10^-100, outward', N: N_JS, U: '3927/2500', tau: js.tau, pi: 'Strassnitzky', trig: 'Taylor at x/2^12 + 12 squarings; e^{i alpha T_n} directly from alpha T_n', cellBound: 'F(m) + |F\'(m)| r + G2 r^2/2, monotonicity |F\'(m)| > G2 r', G2: js.G2, decision: 'depth-first, gap refusal', enclosure: 'refine every surviving cell each round' },
      py: { arithmetic: 'Python integers, binary fixed point 2^-320, outward', N: py.N, U: py.U, tau: py.tau, pi: 'Euler arctan(1/2)+arctan(1/3)', trig: 'Taylor at the point; e^{i alpha T_n} as products of powers of e^{i alpha}', cellBound: 'mean-value form F(m) + r max|F\'(cell)|, F\' by its interval extension over the cell; monotonicity test', decision: 'depth-first', enclosure: 'best-first' },
      differsFrom: ['the note: Bernstein subdivision of a degree-19 polynomial in x = cos^2 theta', 'He–Tang: a 2,000,000-point mesh and a global Lipschitz constant', 'arhancanli: quadratic Taylor at the midpoint plus a global cubic remainder, 1,050 cells'],
      budgets: { maxDepth: MAX_DEPTH, cells: BUDGET, enclosureTolF: '1e-32' },
    },
    rows: { R1: { what: WORDS.R1, js: head(js.rows.R1), py: head(py.rows.R1), agree: r1.agree }, R2: { what: WORDS.R2, js: head(js.rows.R2), py: head(py.rows.R2), agree: cmp.items.R2.agree } },
    enclosure: {
      js: js.enclosure, py: py.enclosure, intersection: cmp.encl,
      maximum: 'interior: at theta in ' + JSON.stringify(js.enclosure.maximizerIn.map((c) => c.theta)) + ' on [0, pi/2] (and its images -theta, pi +- theta), above |P(0)| by ' + js.enclosure.maxMinusAbsP0.join('..'),
      againstNote: { ourAhiBelowNoteMax: lt(cmp.encl.A[1], NOTE.maxUpper), noteMinusOurAhi: rSci(rSub(rParse(NOTE.maxUpper), rParse(cmp.encl.A[1])), 4, 'floor'), noteBetaLowerBelowOurs: lt(NOTE.betaLower, cmp.encl.beta[0]) },
      againstArhancanli: { AinsideTheirs: lt(ARHAN.A[0], cmp.encl.A[0]) && lt(cmp.encl.A[1], ARHAN.A[1]), betaInsideTheirs: lt(ARHAN.beta[0], cmp.encl.beta[0]) && lt(cmp.encl.beta[1], ARHAN.beta[1]), thetaAgrees: js.enclosure.argmaxTheta.startsWith(ARHAN.theta), gapAgrees: js.enclosure.maxMinusAbsP0[0].startsWith('1.15') || js.enclosure.maxMinusAbsP0[0].startsWith('1.16'),
        cos2AtArgmax: py.enclosure.cos2AtArgmax, theirX: ARHAN.x, xNote: 'their parenthetical x = cos^2 theta ~ 0.6503 does not match theta ~ 0.6455415545, where cos^2 theta = ' + py.enclosure.cos2AtArgmax + '…; immaterial to the bound' },
    },
    controls: Object.fromEntries(Object.entries(cmp.items).filter(([k]) => k[0] === 'C').map(([k, v]) => [k, { ...v, jsDetail: head(js.controls[k]), pyDetail: head(py.controls[k]), claim: js.controls[k].claim, tau: js.controls[k].tau }])),
    controlValues: {
      C2: { js: js.controls.C2.enclosure, py: py.controls.C2.enclosure },
      C3c: { js: js.controls.C3c, py: py.controls.C3c, noteUpper: NOTE.betaOldUpper, arhancanli: ARHAN.betaOld },
      C4b: { js: js.controls.C4b.enclosure, py: py.controls.C4b.enclosure },
      C4c: { js: js.controls.C4c, py: py.controls.C4c },
      C6tau: { js: js.controls.C6.tau, py: py.controls.C6.tau },
    },
    readings: {
      noteTail: 'the note\'s tail T = 2K^{-(N+1)(N+2)/2}/(1 - K^{-(N+2)}) is ours at N = 9: tau_9 = ' + rSci(rDiv(rMul(rI(2), rPow(rDiv(rI(1), rParse(PARAMS.R2026b[0])), 55)), rSub(rI(1), rPow(rDiv(rI(1), rParse(PARAMS.R2026b[0])), 11))), 4, 'ceil') + ', inside their transcript\'s tail_bound [0, 1e-30]',
      lemma31: 'P(theta) = e^{i theta} k(eps e^{2i theta}) = 2 sum_n eps^{T_n} K^{-T_n} cos((2n+1) theta) with eps = e^{i alpha}: the PR\'s and the note\'s formula is the paper\'s, T_n = n(n+1)/2 in both places',
    },
    allAgree, allAsPredicted: allPred,
    selftests: { js: js.selftests, py: py.selftests, allPass: [...Object.values(js.selftests), ...Object.values(py.selftests)].every((x) => x === true || typeof x === 'string') },
    rederive: 'node tools/c51-replay.js --check (offline, ~45 s); node tools/c51-replay.js re-checks the pins over the network and rewrites this record',
    seconds: +((Date.now() - T0) / 1000).toFixed(1),
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('C51 REPLAY ' + verdict + ' — margin beta ' + rec.margin.beta + ', A in [' + cmp.encl.A.join(', ') + ']; ' + (allAgree ? 'both implementations agree' : 'IMPLEMENTATIONS DISAGREE') + '; ' + (allPred ? 'every control as predicted' : 'A CONTROL DID NOT COME OUT AS PREDICTED') + ' → certs/c51-replay.json (' + rec.seconds + ' s)');
}
main().catch((e) => die(e.stack || String(e)));
