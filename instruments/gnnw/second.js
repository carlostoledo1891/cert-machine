#!/usr/bin/env node
/* second.js — a SECOND, independent decision of the GNNW G_AI iteration (tools/verify_gnnw_gai.py is the first).

   Different language (JavaScript), different arithmetic (instruments/bigfloat: dyadic intervals, directed rounding,
   its own Taylor exp and atanh log), and a different method on [1/N, 1]: no derivative is written down. It uses
   instead four monotonicity facts, each decided by intervals on the piece: F' > 0 (F increases), F'' < 0 and M' > 0
   (so X decreases: every term of (ln X)' is then negative), and Y_f decreasing (Lemma 15), so on [a, b]
       slack(l) >= F(a) + (1/2) [ ln X(b) + b ln M(a) + b ln Y_f(X(a)) ]
   (ln M, ln Y < 0, M and Y increase). Only endpoint values enter. The branch parameter of Y_f is found through
   beta = f - t f' computed as written (not the rearranged smooth form the first verifier uses). On (0, 1/N] the
   slack divided by l with ln l cancelled, its series-bounded pieces summed with explicit remainders.

   Reads certs/gnnw-certificate.json (q and m only; never its "decided" block).
   usage: node instruments/gnnw/second.js [certs/gnnw-certificate.json] */
'use strict';
const fs = require('fs');
const path = require('path');
const B = require('#instruments/bigfloat/bigfloat.js');
const Fn = require('#instruments/bigfloat/functions.js');

const P = 120;
const ROOT = path.resolve(__dirname, '..', '..');
const add = (x, y) => B.add(x, y, P), sub = (x, y) => B.sub(x, y, P), mul = (x, y) => B.mul(x, y, P), div = (x, y) => B.div(x, y, P);
const neg = B.neg, exp = (x) => Fn.exp(x, P), log = (x) => Fn.log(x, P);
const I = (lo, hi) => ({ lo, hi: hi === undefined ? lo : hi });
const hull = (x, y) => I(B.cmp(x.lo, y.lo) <= 0 ? x.lo : y.lo, B.cmp(x.hi, y.hi) >= 0 ? x.hi : y.hi);
const num = (x) => B.toNumber(x.lo);
const pos = (x) => B.isPositive(x), negv = (x) => B.isNegative(x);

/* exact rationals as [n, d] BigInt pairs */
function dec(s) {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(s).trim());
  if (!m) throw new Error('not a decimal: ' + s);
  const f = m[3] || '';
  const n = BigInt(m[2] + f) * (m[1] ? -1n : 1n), d = 10n ** BigInt(f.length);
  return [n, d];
}
const R = ([n, d]) => B.fromRatio(n, d, P);
const rq = (n, d) => B.fromRatio(BigInt(n), BigInt(d), P);
const ONE = B.IONE, TWO = B.fromInt(2), HALF = rq(1, 2);
const ratAdd = ([a, b], [c, d]) => [a * d + c * b, b * d];
const ratMul = ([a, b], [c, d]) => [a * c, b * d];

function horner(cs, x) { let acc = B.IZERO; for (let i = cs.length - 1; i >= 0; i--) acc = add(mul(acc, x), cs[i]); return acc; }
/* q = sum c_i x^(i+1): its value, q', q'' as coefficient lists (intervals of exact rationals) */
function polyParts(raw) {
  const c = raw.map(dec);
  return {
    q: [[0n, 1n]].concat(c).map(R),                                   // coefficients of x^0..x^n
    d1: c.map(([n, d], i) => R([n * BigInt(i + 1), d])),              // q'
    d2: c.slice(1).map(([n, d], i) => R([n * BigInt((i + 2) * (i + 1)), d])),  // q''
    over: c.map(R)                                                     // q/x
  };
}
let PP = null, LNA = null, LNB = null, F1 = null;     // the region f = h + p e^-l: F_0.03 first, then each step's certified q
const Fv = (pp, x) => add(sub(mul(add(ONE, x), log(add(ONE, x))), mul(x, log(x))), mul(horner(pp.q, x), exp(neg(x))));
const Fd = (pp, x) => add(sub(log(add(ONE, x)), log(x)), mul(sub(horner(pp.d1, x), horner(pp.q, x)), exp(neg(x))));
const Fdd = (pp, x) => add(neg(div(ONE, mul(x, add(ONE, x)))),
  mul(add(sub(pp.d2.length ? horner(pp.d2, x) : B.IZERO, mul(TWO, horner(pp.d1, x))), horner(pp.q, x)), exp(neg(x))));
const f = (t) => Fv(PP, t), fd = (t) => Fd(PP, t);
const beta = (t) => sub(f(t), mul(t, fd(t)));           // beta(t) = f(t) - t f'(t) exactly as written
const F03 = ['-0.25', '0.03', '0.08'];
let FLC = null;                                          // the region's coefficients as doubles, for the float twins
function setRegion(raw) {
  PP = polyParts(raw);
  FLC = raw.map(Number);
  LNA = neg(fd(ONE)); LNB = neg(beta(ONE)); F1 = f(ONE);
}
/* Lemma 15's hypotheses for the region: f'' < 0 and f' > 0 on [1e-9, 1] by intervals (below, -1/(t(1+t)) and ln(1/t)
   dominate a polynomial part whose size is at most K = sum |c_i|((i+1)^2 + 1) < 1e6), and 2f'(1) - f(1) > 0 */
function regionOk(raw) {
  const pp = polyParts(raw);
  const K = raw.map(Number).reduce((a, c, i) => a + Math.abs(c) * ((i + 1) ** 2 + 1), 0);
  if (K >= 1e6) return false;
  const todo = [[1n, 1000000000n, 1000000000n]];          // [k/den, hi/den]
  const stack = [[rq(1, 1000000000), ONE]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const X = I(a.lo, b.hi);
    if (negv(Fdd(pp, X)) && pos(Fd(pp, X))) continue;
    if (B.toNumber(b.hi) - B.toNumber(a.lo) < 1e-12) return false;
    const m = mul(add(a, b), HALF);
    stack.push([a, I(m.hi)], [I(m.lo), b]);
  }
  return pos(sub(mul(TWO, Fd(pp, ONE)), Fv(pp, ONE)));
}

/* float twins, to propose brackets only */
const fl = { p: (t) => FLC.reduce((a, c, i) => a + c * t ** (i + 1), 0), dp: (t) => FLC.reduce((a, c, i) => a + (i + 1) * c * t ** i, 0) };
fl.f = (t) => (1 + t) * Math.log1p(t) - t * Math.log(t) + fl.p(t) * Math.exp(-t);
fl.fd = (t) => Math.log((1 + t) / t) + (fl.dp(t) - fl.p(t)) * Math.exp(-t);
fl.beta = (t) => fl.f(t) - t * fl.fd(t);
function fsolve(fun, target, inc) {
  let lo = 1e-12, hi = 1.5;
  for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if ((fun(m) < target) === inc) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const rat = (x) => { const e = Math.floor(Math.log2(x)) - 60; return [BigInt(Math.round(x * 2 ** -e)), e]; };
const fromDouble = (x) => { const [m, e] = rat(x); return I({ m, e }); };

/* [t1, t2] bracketing every t in (0, 1] with fun(t) in s (fun monotone there), decided by intervals */
function bracket(fun, ffun, s, inc) {
  const a = fsolve(ffun, inc ? num(s) : B.toNumber(s.hi), inc), b = fsolve(ffun, inc ? B.toNumber(s.hi) : num(s), inc);
  let t1 = null, t2 = null;
  for (const r of [1e-12, 1e-10, 1e-8, 1e-6, 1e-4, 1e-2]) {
    const c = fromDouble(a * (1 - r)), v = fun(c);
    if (inc ? B.cmp(v.hi, s.lo) < 0 : B.cmp(v.lo, s.hi) > 0) { t1 = c; break; }
  }
  for (const r of [1e-12, 1e-10, 1e-8, 1e-6, 1e-4, 1e-2]) {
    const c = fromDouble(b * (1 + r)), v = fun(c);
    if (inc ? B.cmp(v.lo, s.hi) > 0 : B.cmp(v.hi, s.lo) < 0) { t2 = c; break; }
  }
  if (!t1 || !t2) throw new Error('no bracket near ' + a + '..' + b);
  return I(t1.lo, t2.hi);
}

/* ln Y_f(x) for ln x in the interval lx: the hull over the branches lx meets */
function lnYf(lx) {
  let out = null;
  const put = (v) => { out = out ? hull(out, v) : v; };
  if (B.cmp(lx.hi, LNB.lo) >= 0) {                          // x >= b: beta(t) = -ln x, ln Y = -f'(t)
    const s = I(neg(lx).lo, B.cmp(neg(lx).hi, neg(LNB).hi) < 0 ? neg(lx).hi : neg(LNB).hi);
    put(neg(fd(bracket(beta, fl.beta, s, true))));
  }
  const lo = B.cmp(lx.lo, LNA.lo) > 0 ? lx.lo : LNA.lo, hi = B.cmp(lx.hi, LNB.hi) < 0 ? lx.hi : LNB.hi;
  if (B.cmp(lo, hi) <= 0) put(sub(neg(F1), I(lo, hi)));   // a <= x <= b
  if (B.cmp(lx.lo, LNA.hi) <= 0) {                          // x <= a: f'(t) = -ln x, ln Y = f(t) - t f'(t) ... = -beta(t)
    const s = I(B.cmp(neg(lx).lo, neg(LNA).lo) > 0 ? neg(lx).lo : neg(LNA).lo, neg(lx).hi);
    const T = bracket(fd, fl.fd, s, false);
    put(neg(beta(T)));
  }
  return out;
}

function step(C) {
  const Q = polyParts(C.q);
  const N = C.m.N, V = [C.m.m0].concat(C.m.values).map(dec);
  if (V.length !== N + 1) throw new Error('m needs N + 1 values');
  /* m on piece j: v_j + s_j (x - j/N), s_j = N (v_{j+1} - v_j) */
  const slope = (j) => ratMul([BigInt(N), 1n], ratAdd(V[j + 1], [-V[j][0], V[j][1]]));
  const mOn = (j, x) => add(R(V[j]), mul(R(slope(j)), sub(x, rq(j, N))));
  const cache = new Map();
  function point(j, k, den) {                               // quantities at l = k/den on piece j
    const key = j + ':' + k + '/' + den;
    if (cache.has(key)) return cache.get(key);
    const x = rq(k, den), M = mul(x, mOn(j, x));
    const u = exp(neg(Fd(Q, x))), oneM = sub(ONE, M);
    const lX = add(div(log(sub(ONE, u)), oneM), log(oneM));
    const r = { x, F: Fv(Q, x), lM: log(M), lX, lY: lnYf(lX), M };
    cache.set(key, r);
    return r;
  }
  let main = 0, minLB = Infinity, worst = null;
  for (let j = 1; j < N; j++) {
    /* interval [a, b] = [k/den, (k+1)/den], den = N 2^depth */
    const stack = [[j, 1]];                                  // (k, den) meaning [k/den, (k+1)/den]; start with the piece itself
    const todo = [[BigInt(j), BigInt(N)]];
    while (todo.length) {
      const [k, den] = todo.pop();
      const a = point(j, k, den), b = point(j, k + 1n, den);
      const X = I(a.x.lo, b.x.hi);
      const mX = mOn(j, X), Mx = mul(X, mX), Mp = add(mX, mul(X, R(slope(j))));
      const good = pos(Fd(Q, X)) && negv(Fdd(Q, X)) && pos(Mp) && B.cmp(Mx.hi, ONE.lo) < 0 && pos(Mx) && negv(b.lX) && negv(a.lY);
      const LB = add(a.F, mul(HALF, add(add(b.lX, mul(b.x, a.lM)), mul(b.x, a.lY))));
      if (good && pos(LB)) { main++; const v = num(LB); if (v < minLB) { minLB = v; worst = [Number(k) / Number(den), Number(k + 1n) / Number(den)]; } continue; }
      if (den > BigInt(N) * (1n << 30n)) throw new Error('REFUSED at [' + (Number(k) / Number(den)) + ', ' + (Number(k + 1n) / Number(den)) + ']: LB ' + num(LB) + (good ? '' : ' (a monotonicity fact failed)'));
      todo.push([2n * k, 2n * den], [2n * k + 1n, 2n * den]);
    }
  }
  /* the tail (0, 1/N]: S = slack/l with ln l cancelled; ln(1+z)/z and ln(1-z)/z as series with explicit remainders */
  const L1 = (Z) => {                                       // ln(1+z)/z = 1 - z/2 + z^2/3 - z^3/4 + ..., z in [0, 1/2]: alternating, decreasing terms
    let s = B.IZERO, pw = ONE;
    for (let k = 0; k < 8; k++) { s = add(s, mul(pw, rq(k % 2 ? -1 : 1, k + 1))); pw = mul(pw, Z); }
    return add(s, mul(I(B.ZERO, pw.hi), rq(1, 9)));        // the first omitted term, 0 <= z^8/9: the true value lies between
  };
  const G1 = (Z) => {                                       // ln(1-z)/z = -(1 + z/2 + z^2/3 + ...), 0 <= z <= 1/2: remainder <= z^K/((K+1)(1-z))
    let s = B.IZERO, pw = ONE;
    for (let k = 0; k < 8; k++) { s = add(s, div(pw, B.fromInt(k + 1))); pw = mul(pw, Z); }
    const rem = div(pw, mul(B.fromInt(9), sub(ONE, Z)));
    return neg(add(s, I(B.ZERO, rem.hi)));
  };
  const nonneg = (Z) => I(B.cmp(Z.lo, B.ZERO) < 0 ? B.ZERO : Z.lo, Z.hi);
  let tail = 0, minS = Infinity;
  const todo = [[0n, 1n, BigInt(N)]];                        // [k/den, (k+1)/den] with a leading factor: intervals k/den .. (k+1)/den of (0, 1/N]
  while (todo.length) {
    const [k, , den] = todo.pop();
    const X = I(rq(k, den).lo, rq(k + 1n, den).hi);
    const mX = mOn(0, X), Mx = mul(X, mX);
    const dq = sub(horner(Q.d1, X), horner(Q.q, X));
    const uOverL = div(exp(neg(mul(dq, exp(neg(X))))), add(ONE, X));
    const u = mul(X, uOverL);
    const lXl = add(div(mul(G1(nonneg(u)), uOverL), sub(ONE, Mx)), mul(G1(nonneg(Mx)), mX));   // ln X / l
    const lX = mul(X, lXl);
    let ok = B.cmp(lX.lo, LNB.hi) > 0;                      // on the B-branch throughout
    let S = null;
    if (ok) {
      let T = null, tau = null;
      const sup = B.toNumber(neg(lX).hi);
      for (const mult of [1.5, 3, 6, 12, 24]) {             // an a-priori upper end g for t: beta(g) > -ln X, beta increasing
        const g = fromDouble(Math.min(sup * mult, 0.5));
        if (B.cmp(beta(g).lo, neg(lX).hi) > 0) { T = I(B.ZERO, g.hi); break; }
      }
      ok = T !== null;
      for (let it = 0; it < 5 && ok; it++) {
        const bt = add(L1(T), mul(exp(neg(T)), sub(add(horner(PP.over, T), horner(PP.q, T)), horner(PP.d1, T))));   // beta(t)/t
        tau = div(neg(lXl), bt);
        const T2 = mul(X, tau);
        T = I(B.cmp(T2.lo, B.ZERO) > 0 ? T2.lo : B.ZERO, B.cmp(T2.hi, T.hi) < 0 ? T2.hi : T.hi);
      }
      if (ok) {
        const lYrest = sub(sub(log(tau), log(add(ONE, T))), mul(sub(horner(PP.d1, T), horner(PP.q, T)), exp(neg(T))));
        S = add(add(add(mul(add(ONE, X), L1(X)), mul(horner(Q.over, X), exp(neg(X)))), mul(HALF, lXl)), mul(HALF, add(log(mX), lYrest)));
        const FpLo = add(neg(log(I(X.hi))), mul(dq, exp(neg(X))));
        ok = pos(S) && pos(FpLo) && B.cmp(Mx.hi, ONE.lo) < 0 && B.cmp(u.hi, ONE.lo) < 0;
      }
    }
    if (ok) { tail++; minS = Math.min(minS, num(S)); continue; }
    if (den > BigInt(N) * (1n << 44n)) throw new Error('REFUSED on the tail at ' + (Number(k) / Number(den)));
    todo.push([2n * k, 0, 2n * den], [2n * k + 1n, 0, 2n * den]);
  }
  const c = exp(Fv(Q, ONE));
  return { verdict: 'CERTIFIED', tail, main, minTailS: minS, minMainLB: minLB, worst, c: [B.toDecimal(c.lo, 25, 'down'), B.toDecimal(c.hi, 25, 'up')] };
}

function main(certPath) {
  const C = JSON.parse(fs.readFileSync(certPath, 'utf8'));
  const steps = C.steps || [{ q: C.q, m: C.m }];
  let region = F03;
  const out = [];
  for (let k = 0; k < steps.length; k++) {
    if (!regionOk(region)) throw new Error('step ' + (k + 1) + ': the region fails Lemma 15\'s hypotheses');
    setRegion(region);
    out.push(step(steps[k]));
    region = steps[k].q;
  }
  const last = out[out.length - 1];
  return { verdict: 'CERTIFIED', steps: out.map((r) => ({ tail: r.tail, main: r.main, minTailS: r.minTailS, minMainLB: r.minMainLB, c: r.c })), c: last.c };
}

module.exports = { main };
if (require.main === module) {
  const t0 = Date.now();
  try {
    const r = main(process.argv[2] || path.join(ROOT, 'certs', 'gnnw-certificate.json'));
    r.seconds = (Date.now() - t0) / 1000;
    console.log(JSON.stringify(r, null, 1));
  } catch (e) {
    console.log(JSON.stringify({ verdict: 'REFUSED', why: e.message, seconds: (Date.now() - t0) / 1000 }));
    process.exit(1);
  }
}
