// The physics answer key — decider 1. Integers only (BigInt); no float takes part in
// a decision. The rules are corpus/physics-key/RULES.md; this file implements them and
// is the ONE module the Node record script, the battery and the browser tab share.
//
//   decideRun(entry, bytes, shaHex) -> the object R of RULES.md section 6
//   decideRun(entry, bytes, shaHex, trace) also fills trace[law] with every step's
//   deviation as a plain number, for DRAWING only: each is the exactly decided
//   deviation rounded once at the end, and no verdict reads it.
//
// `bytes` is the uncompressed trajectory (Uint8Array) or null when it could not be
// read; `shaHex` is its sha256, computed by the caller (Node's crypto or Web Crypto).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PhysicsKey = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── dyadic numbers: m · 2^e, m a BigInt, e an integer ─────────────────────────────
  const dy = (m, e) => ({ m, e });
  const D0 = dy(0n, 0), D1 = dy(1n, 0), DHALF = dy(1n, -1);
  function dAdd(a, b) {
    if (a.e === b.e) return dy(a.m + b.m, a.e);
    if (a.e > b.e) return dy((a.m << BigInt(a.e - b.e)) + b.m, b.e);
    return dy(a.m + (b.m << BigInt(b.e - a.e)), a.e);
  }
  const dNeg = (a) => dy(-a.m, a.e);
  const dSub = (a, b) => dAdd(a, dNeg(b));
  const dMul = (a, b) => dy(a.m * b.m, a.e + b.e);
  const dSq = (a) => dMul(a, a);
  const dSign = (a) => (a.m > 0n ? 1 : a.m < 0n ? -1 : 0);

  // a binary64 from its bit pattern; null when it is not a number
  function dyFromBits(b) {
    const neg = (b >> 63n) === 1n;
    const ex = Number((b >> 52n) & 0x7ffn);
    const frac = b & 0xfffffffffffffn;
    if (ex === 0x7ff) return null;
    let m, e;
    if (ex === 0) { m = frac; e = -1074; } else { m = frac | (1n << 52n); e = ex - 1075; }
    return dy(neg ? -m : m, e);
  }
  const dyFromHex = (hex) => dyFromBits(BigInt('0x' + hex));

  // ── rationals: n / d, d > 0 ────────────────────────────────────────────────────────
  const q = (n, d) => (d < 0n ? { n: -n, d: -d } : { n, d });
  const Q0 = q(0n, 1n);
  // the quotient of two dyadics (the divisor not zero)
  function qOf(a, b) {
    if (!b) return a.e >= 0 ? q(a.m << BigInt(a.e), 1n) : q(a.m, 1n << BigInt(-a.e));
    const s = a.e - b.e;
    return s >= 0 ? q(a.m << BigInt(s), b.m) : q(a.m, b.m << BigInt(-s));
  }
  const qAdd = (a, b) => q(a.n * b.d + b.n * a.d, a.d * b.d);
  const qSub = (a, b) => q(a.n * b.d - b.n * a.d, a.d * b.d);
  const qMul = (a, b) => q(a.n * b.n, a.d * b.d);
  const qNeg = (a) => q(-a.n, a.d);
  const qAbs = (a) => (a.n < 0n ? q(-a.n, a.d) : a);
  const qCmp = (a, b) => { const x = a.n * b.d - b.n * a.d; return x > 0n ? 1 : x < 0n ? -1 : 0; };
  const qSign = (a) => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0);
  const pow10 = (k) => 10n ** BigInt(k);
  // the nearest plain number, for drawing only
  function qNum(v) {
    if (v.n === 0n) return 0;
    const neg = v.n < 0n, n = neg ? -v.n : v.n, d = v.d;
    const s = (d.toString(16).length - n.toString(16).length) * 4 + 64;
    const quo = s >= 0 ? (n << BigInt(s)) / d : n / (d << BigInt(-s));
    const x = Number(quo) * Math.pow(2, -s);
    return neg ? -x : x;
  }

  // ── the 12-digit outward print of RULES.md section 6 ──────────────────────────────
  function dec12(v) {
    if (v.n === 0n) return { lo: '0', hi: '0' };
    const neg = v.n < 0n, a = neg ? -v.n : v.n, d = v.d;
    let e = a.toString().length - d.toString().length;
    const ge = (k) => (k >= 0 ? a >= d * pow10(k) : a * pow10(-k) >= d);   // a/d ≥ 10^k
    while (!ge(e)) e--;
    while (ge(e + 1)) e++;
    const s = 11 - e;
    const X = s >= 0 ? a * pow10(s) : a, Y = s >= 0 ? d : d * pow10(-s);
    const fl = X / Y, exact = X % Y === 0n;
    const fmt = (digits, ex) => { const t = digits.toString(); return t[0] + '.' + t.slice(1) + 'e' + ex; };
    const down = fmt(fl, e);
    let up;
    if (exact) up = down;
    else if (fl + 1n === pow10(12)) up = fmt(pow10(11), e + 1);
    else up = fmt(fl + 1n, e);
    return neg ? { lo: '-' + up, hi: '-' + down } : { lo: down, hi: up };
  }

  // ── the cosine of RULES.md section 7: Taylor sum and Lagrange remainder ───────────
  // returns [lo, hi] rationals with hi − lo ≤ 2·10^-p
  function cosEnclosure(x, p) {
    const x2 = qOf(dSq(x));                 // x² as n/d
    const bound = pow10(p);
    // the term x^{2n}/(2n)! is tn/D and the partial sum is S/D: each new term's
    // denominator is a multiple of the last, so one denominator serves both
    let tn = 1n, S = 1n, D = 1n;
    for (let n = 0; ; n++) {
      const f = x2.d * BigInt((2 * n + 1) * (2 * n + 2));
      const nn = tn * x2.n, nd = D * f;     // the next term, x^{2n+2}/(2n+2)!
      // the remainder after the terms up to n is at most that next term
      if (nn * bound <= nd) return [q(S * f - nn, nd), q(S * f + nn, nd)];
      tn = nn; D = nd;
      S = S * f + ((n + 1) % 2 === 1 ? -tn : tn);
      if (n > 4000) throw new Error('cosine: no convergence');
    }
  }
  const LEVELS = [40, 80, 160];

  // ── reading a run ─────────────────────────────────────────────────────────────────
  const LADDER = {
    abs: ['1e-2', '1e-3', '1e-6', '1e-9', '1e-12', '0'],
    rel: ['1e-2', '1e-4', '1e-6', '1e-9', '1e-12', '0'],
  };
  const LAWS = {
    fall: { 'F-POS': 'abs', 'F-VEL': 'abs' },
    pendulum: { 'P-ENERGY': 'rel' },
    top: { 'T-ENERGY': 'rel', 'T-LMAG': 'rel', 'T-LVEC': 'rel', 'T-MONO': 'rel' },
  };
  const PARAMS = { fall: ['G'], pendulum: ['M', 'L', 'IYY', 'G'], top: ['I1', 'I2', 'I3'] };
  const tolOf = (key, squared) => {
    if (key === '0') return Q0;
    const k = Number(key.slice(3));
    return q(1n, pow10(squared ? 2 * k : k));
  };

  function refusedRun(scene, status) {
    const laws = {};
    for (const law of Object.keys(LAWS[scene] || {})) {
      const tolerances = {};
      for (const t of LADDER[LAWS[scene][law]]) tolerances[t] = { verdict: 'REFUSED', firstStep: null };
      laws[law] = { tolerances, max: null, last: null };
    }
    return { status, nonFiniteStep: null, laws };
  }

  // One law's scan state. A deviation is { v: rational } when exact, or
  // { enc: (level) => [lo, hi], key: string } when it needs the cosine.
  function Scan(law, ladder, squared, trace) {
    this.law = law;
    this.oneSided = law === 'T-MONO';      // amendment 1: a rise only, never a fall
    this.trace = trace || null;
    this.tol = ladder.map((key) => ({ key, eps: tolOf(key, squared), first: null, undecided: false }));
    this.max = null;          // { step, dev }
    this.maxTies = [];        // other steps not separated from the max
    this.last = null;
  }
  const absEnc = ([lo, hi]) => {
    if (qSign(lo) >= 0) return [lo, hi];
    if (qSign(hi) <= 0) return [qNeg(hi), qNeg(lo)];
    const a = qNeg(lo); return [Q0, qCmp(a, hi) > 0 ? a : hi];
  };
  // is |dev| ≤ eps ?  -> true, false, or null (undecided at the cap)
  // (one-sided: is dev ≤ eps ? — only ever asked of an exact deviation)
  function within(dev, eps, oneSided) {
    if (dev.v) return qCmp(oneSided ? dev.v : qAbs(dev.v), eps) <= 0;
    if (eps.n === 0n) return false;                       // section 7: never exactly 0
    for (const p of LEVELS) {
      const [lo, hi] = absEnc(dev.enc(p));
      if (qCmp(hi, eps) <= 0) return true;
      if (qCmp(lo, eps) > 0) return false;
    }
    return null;
  }
  // compare |a| with |b| -> 1, 0, -1, or null (undecided)
  function cmpAbs(a, b) {
    if (a.v && b.v) return qCmp(qAbs(a.v), qAbs(b.v));
    if (a.key !== undefined && a.key === b.key) return 0;  // equal states (section 7)
    for (const p of LEVELS) {
      const A = a.v ? [qAbs(a.v), qAbs(a.v)] : absEnc(a.enc(p));
      const B = b.v ? [qAbs(b.v), qAbs(b.v)] : absEnc(b.enc(p));
      if (qCmp(A[0], B[1]) > 0) return 1;
      if (qCmp(A[1], B[0]) < 0) return -1;
    }
    return null;
  }
  Scan.prototype.step = function (k, dev) {
    if (this.trace) this.trace[k] = qNum(dev.v ? dev.v : dev.enc(LEVELS[0])[0]);
    for (const t of this.tol) {
      if (t.first !== null) continue;
      const w = within(dev, t.eps, this.oneSided);
      if (w === false) t.first = k; else if (w === null) t.undecided = true;
    }
    // what `max` ranks: the absolute deviation, or for a one-sided law the rise alone
    const mag = this.oneSided ? { v: qSign(dev.v) > 0 ? dev.v : Q0 } : dev;
    if (this.max === null) { this.max = { step: k, dev: mag }; this.maxTies = []; }
    else {
      const c = cmpAbs(mag, this.max.dev);
      if (c === 1) {
        // a new largest step; ties it could not be separated from remain ties
        const ties = this.maxTies.filter((o) => cmpAbs(mag, o.dev) === null);
        this.max = { step: k, dev: mag }; this.maxTies = ties;
      } else if (c === null) this.maxTies.push({ step: k, dev: mag });
    }
    this.last = dev;
  };
  function printDev(dev, absolute) {
    if (dev.v) return dec12(absolute ? qAbs(dev.v) : dev.v);
    for (const p of LEVELS) {
      const e = dev.enc(p), [lo, hi] = absolute ? absEnc(e) : e;
      const a = dec12(lo), b = dec12(hi);
      if (a.lo === b.lo && a.hi === b.hi) return { lo: a.lo, hi: b.hi };
    }
    return 'REFUSED';
  }
  Scan.prototype.result = function (nonFinite) {
    const tolerances = {};
    for (const t of this.tol) {
      const verdict = t.first !== null ? 'REFUTED' : (nonFinite || t.undecided) ? 'REFUSED' : 'CERTIFIED';
      tolerances[t.key] = { verdict, firstStep: t.first };
    }
    let max = null, last = null;
    if (this.max !== null) {
      if (this.maxTies.length) max = 'REFUSED';
      else {
        const pr = printDev(this.max.dev, true);
        max = pr === 'REFUSED' ? 'REFUSED' : { step: this.max.step, lo: pr.lo, hi: pr.hi };
      }
    }
    if (!nonFinite && this.last !== null) last = printDev(this.last, false);
    return { tolerances, max, last };
  };

  // ── the laws of RULES.md section 5 ────────────────────────────────────────────────
  function decideRun(entry, bytes, shaHex, trace) {
    const scene = entry.scene;
    if (!LAWS[scene]) return { status: 'malformed', nonFiniteStep: null, laws: {} };
    // amendment 2: the only layouts are the one of section 4 (no field) and "world"
    if (entry.layout !== undefined && entry.layout !== 'world') return refusedRun(scene, 'malformed');
    const world = entry.layout === 'world';
    const width = 1 + entry.nq + entry.nv, rows = entry.steps + 1;
    if (!bytes || bytes.length !== 8 * rows * width || shaHex !== entry.sha256) return refusedRun(scene, 'malformed');
    const P = {};
    for (const name of PARAMS[scene]) {
      const v = entry.params && typeof entry.params[name] === 'string' ? dyFromHex(entry.params[name]) : null;
      if (v === null) return refusedRun(scene, 'malformed');
      P[name] = v;
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const readRow = (k) => {
      const r = new Array(width);
      for (let j = 0; j < width; j++) {
        const v = dyFromBits(view.getBigUint64(8 * (k * width + j), true));
        if (v === null) return null;
        r[j] = v;
      }
      return r;
    };
    const scans = {};
    for (const law of Object.keys(LAWS[scene])) {
      if (trace) trace[law] = new Float64Array(rows).fill(NaN);
      scans[law] = new Scan(law, LADDER[LAWS[scene][law]], law === 'T-LVEC', trace ? trace[law] : null);
    }

    let devs;   // (row, k) -> { law: deviation } ; set from row 0
    const r0 = readRow(0);
    if (r0 !== null) {
      if (scene === 'fall') {
        const t0 = r0[0], z0 = r0[3], v0 = r0[10], G = P.G;
        devs = (r) => {
          const t = dSub(r[0], t0);
          return {
            'F-POS': { v: qOf(dAdd(dSub(r[3], z0), dMul(DHALF, dMul(G, dSq(t))))) },
            'F-VEL': { v: qOf(dAdd(dSub(r[10], v0), dMul(G, t))) },
          };
        };
      } else if (scene === 'pendulum') {
        const J = dAdd(P.IYY, dMul(P.M, dSq(P.L)));
        const twoMGL = dMul(dy(2n, 0), dMul(P.M, dMul(P.G, P.L)));
        if (dSign(twoMGL) === 0) return refusedRun(scene, 'malformed');
        const c = qOf(J, twoMGL);
        const th0 = r0[1], w0sq = dSq(r0[2]);
        const absEq = (a, b) => dSign(dSub(a, b)) === 0 || dSign(dAdd(a, b)) === 0;
        const cos0 = {};
        devs = (r) => {
          const kin = qMul(c, qOf(dSub(dSq(r[2]), w0sq)));
          if (absEq(r[1], th0)) return { 'P-ENERGY': { v: kin } };
          const th = r[1];
          const memo = {};
          const enc = (p) => {
            if (!memo[p]) {
              if (!cos0[p]) cos0[p] = cosEnclosure(th0, p);
              const ck = cosEnclosure(th, p), c0 = cos0[p];
              // D = kin − cos θ_k + cos θ_0
              memo[p] = [qAdd(qSub(kin, ck[1]), c0[0]), qAdd(qSub(kin, ck[0]), c0[1])];
            }
            return memo[p];
          };
          const a = th.m < 0n ? dNeg(th) : th;           // |θ| and θ'² name the state
          return { 'P-ENERGY': { enc, key: a.m + '/' + a.e + '/' + qOf(dSq(r[2])).n + '/' + qOf(dSq(r[2])).d } };
        };
      } else {
        /* Everything is kept as a dyadic numerator over a dyadic denominator, so the two layouts share one
           set of formulas. With n = |q|² and M = n·R(q) (dyadic): in the section 4 layout the body-frame angular
           velocity is u = ω and s = 1; in the world layout (amendment 2) it is u/s with u = Mᵀ·w and s = n.
             2T = Σ I·u² / s²      Λ = Σ (I·u)² / s²      ℓ = M·(I·u) / (n·s)                                 */
        const I = [P.I1, P.I2, P.I3];
        const dot = (a, b) => dAdd(dAdd(dMul(a[0], b[0]), dMul(a[1], b[1])), dMul(a[2], b[2]));
        const two = dy(2n, 0), one = dy(1n, 0);
        const state = (r) => {
          const w = world ? r[7] : r[4], x = world ? r[4] : r[5], y = world ? r[5] : r[6], z = world ? r[6] : r[7];
          const ww = dSq(w), xx = dSq(x), yy = dSq(y), zz = dSq(z);
          const n = dAdd(dAdd(ww, xx), dAdd(yy, zz));
          const M = [
            [dSub(dAdd(ww, xx), dAdd(yy, zz)), dMul(two, dSub(dMul(x, y), dMul(w, z))), dMul(two, dAdd(dMul(x, z), dMul(w, y)))],
            [dMul(two, dAdd(dMul(x, y), dMul(w, z))), dSub(dAdd(ww, yy), dAdd(xx, zz)), dMul(two, dSub(dMul(y, z), dMul(w, x)))],
            [dMul(two, dSub(dMul(x, z), dMul(w, y))), dMul(two, dAdd(dMul(y, z), dMul(w, x))), dSub(dAdd(ww, zz), dAdd(xx, yy))],
          ];
          const om = [r[11], r[12], r[13]];
          const u = world ? [0, 1, 2].map((j) => dot([M[0][j], M[1][j], M[2][j]], om)) : om;
          const s = world ? n : one, ss = dSq(s);
          const p = [dMul(I[0], u[0]), dMul(I[1], u[1]), dMul(I[2], u[2])];
          return { n, Ea: dot(u, p), La: dot(p, p), ss, la: M.map((row) => dot(row, p)), lb: dMul(n, s) };
        };
        const S0 = state(r0);
        const zeroQuat0 = dSign(S0.n) === 0;
        if (!(world && zeroQuat0) && (dSign(S0.Ea) === 0 || dSign(S0.La) === 0)) return refusedRun(scene, 'malformed');
        let prev = S0;                                     // the state one step back
        if (zeroQuat0) devs = null;
        else devs = (r, k) => {
          const S = state(r);
          if (dSign(S.n) === 0) return null;               // an all-zero quaternion
          // (T_k − T_{k−1})/T_0 = (Ea_k·ss_p − Ea_p·ss_k)·ss_0 / (ss_k·ss_p·Ea_0)
          const rise = k === 0 ? Q0 : qOf(dMul(dSub(dMul(S.Ea, prev.ss), dMul(prev.Ea, S.ss)), S0.ss), dMul(dMul(S.ss, prev.ss), S0.Ea));
          prev = S;
          // ℓ_k − ℓ_0 = (la_k·lb_0 − la_0·lb_k) / (lb_k·lb_0), and 1/Λ_0 = ss_0/La_0
          const diff = [0, 1, 2].map((i) => dSub(dMul(S.la[i], S0.lb), dMul(S0.la[i], S.lb)));
          return {
            'T-ENERGY': { v: qOf(dSub(dMul(S.Ea, S0.ss), dMul(S0.Ea, S.ss)), dMul(S0.Ea, S.ss)) },
            'T-MONO': { v: rise },
            'T-LMAG': { v: qOf(dSub(dMul(S.La, S0.ss), dMul(S0.La, S.ss)), dMul(S0.La, S.ss)) },
            'T-LVEC': { v: qOf(dMul(dot(diff, diff), S0.ss), dMul(dSq(dMul(S.lb, S0.lb)), S0.La)) },
          };
        };
      }
    }

    let nonFiniteStep = null;
    for (let k = 0; k < rows; k++) {
      const r = k === 0 ? r0 : readRow(k);
      const d = r === null || !devs ? null : devs(r, k);
      if (d === null) { nonFiniteStep = k; break; }
      for (const law of Object.keys(scans)) scans[law].step(k, d[law]);
    }
    const laws = {};
    for (const law of Object.keys(scans)) laws[law] = scans[law].result(nonFiniteStep !== null);
    return { status: nonFiniteStep === null ? 'ok' : 'nonfinite', nonFiniteStep, laws };
  }

  return { decideRun, dec12, cosEnclosure, dyFromHex, qOf, qNum, LAWS, LADDER, PARAMS };
});
