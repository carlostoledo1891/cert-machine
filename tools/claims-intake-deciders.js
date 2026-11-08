/* claims-intake-deciders.js — the JavaScript deciders of the first four claims through the public form
   (cert-machine #3–#6). Pre-registered in notes/claims-intake-preregistration-2026-11-08.md (bcdc469f) before this
   file existed. Read by tools/record-claims-intake.js, which runs these, runs the Python checkers in
   corpus/claims-intake/{circles,autocorr2,pnt}/check.py (sharing no code with this file), compares, and writes
   the record.

   Exact throughout: every number is the rational its decimal literal denotes (instruments/easota/lib.js parseDecimal,
   BigInt fractions from instruments/interval/rational.js for the circles, BigInt integers over one common
   denominator for the step functions). Floats never decide. Printed upper ends are rounded up, lower ends down.

   circles(C, t)        26 circles in [0,1]^2 under tolerance t (t = 0: strict): containment, (r_i+r_j-t)^2 <= d^2,
                        the exact sum, the worst overlap in squared and distance form, the uniform repair
   autocorr2(a)         Q = ||f*f||_2^2 / (||f*f||_1 ||f*f||_inf) of a non-negative step function, exactly
   pnt(f)               the EinsteinArena PNT object: the exact normalisation, F(n) = sum f(k) floor(n/k) on every
                        integer of the sampled range, the mirror family L-1-m, the score enclosed
   MIT */
'use strict';
const path = require('path');
const L = require(path.join(__dirname, '..', 'instruments', 'easota', 'lib.js'));
const Q = L.Q;

/* ---------------- BigInt helpers ---------------- */
const P10 = (k) => 10n ** BigInt(k);
const fdiv = (a, b) => { if (b <= 0n) throw new Error('fdiv: b <= 0'); const q = a / b; return (a % b !== 0n && a < 0n) ? q - 1n : q; };
const cdiv = (a, b) => -fdiv(-a, b);
const fmt = (s, k) => { const neg = s < 0n; const t = (neg ? -s : s).toString().padStart(k + 1, '0'); return (neg ? '-' : '') + (k ? t.slice(0, t.length - k) + '.' + t.slice(t.length - k) : t); };
/* a rational n/d (d > 0) at k decimals, rounded down / up / exactly when it is a finite decimal */
const down = (n, d, k) => fmt(fdiv(n * P10(k), d), k);
const up = (n, d, k) => fmt(cdiv(n * P10(k), d), k);
const qDown = (r, k) => down(r.n, r.d, k), qUp = (r, k) => up(r.n, r.d, k);
function qExact(r) { for (let k = 0; k <= 400; k++) if ((r.n * P10(k)) % r.d === 0n) { const s = fmt(r.n * P10(k) / r.d, k); return k ? s.replace(/0+$/, '').replace(/\.$/, '') : s; } return null; }
function isqrt(x) { if (x < 0n) throw new Error('isqrt of a negative'); if (x < 2n) return x; let r = 1n << BigInt(Math.ceil(x.toString(2).length / 2)); for (;;) { const y = (r + x / r) >> 1n; if (y >= r) break; r = y; } while (r * r > x) r--; while ((r + 1n) * (r + 1n) <= x) r++; return r; }
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
/* a decimal literal as an integer over 10^k (refuses if it is not one) */
function scaled(lit, k) { const r = L.parseDecimal(lit); const num = r.n * P10(k); if (num % r.d !== 0n) throw new Error('literal ' + lit + ' has more than ' + k + ' decimals'); return num / r.d; }
function decimalsOf(lit) { const r = L.parseDecimal(lit); for (let k = 0; k < 400; k++) if ((r.n * P10(k)) % r.d === 0n) return k; throw new Error('not a decimal: ' + lit); }

/* ================= circles in the unit square ================= */
const SQ = 40;                                    /* distance enclosures at 10^-40 */
function circlesFacts(C) {
  const n = C.length;
  const sumR = C.reduce((s, c) => Q.add(s, c[2]), Q.ZERO);
  const nonPositive = []; C.forEach((c, i) => { if (Q.sign(c[2]) <= 0) nonPositive.push(i); });
  const sides = [];
  C.forEach(([x, y, r], i) => {
    sides.push({ i, side: 'left (x - r)', slack: Q.sub(x, r) });
    sides.push({ i, side: 'right (1 - x - r)', slack: Q.sub(Q.sub(Q.ONE, x), r) });
    sides.push({ i, side: 'bottom (y - r)', slack: Q.sub(y, r) });
    sides.push({ i, side: 'top (1 - y - r)', slack: Q.sub(Q.sub(Q.ONE, y), r) });
  });
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const dx = Q.sub(C[i][0], C[j][0]), dy = Q.sub(C[i][1], C[j][1]);
    const d2 = Q.add(Q.mul(dx, dx), Q.mul(dy, dy)), s = Q.add(C[i][2], C[j][2]);
    const slack2 = Q.sub(d2, Q.mul(s, s));
    /* e = s - d enclosed: d in [r0, r1]/10^40 */
    const lowSq = d2.n * P10(2 * SQ) / d2.d, hiSq = cdiv(d2.n * P10(2 * SQ), d2.d);
    const r0 = isqrt(lowSq); let r1 = isqrt(hiSq); if (r1 * r1 < hiSq) r1++;
    const s40 = s.n * P10(SQ); if (s40 % s.d !== 0n) throw new Error('a radius sum with more than 40 decimals');
    const S40 = s40 / s.d;
    pairs.push({ i, j, d2, s, slack2, eLo: S40 - r1, eHi: S40 - r0 });
  }
  return { n, sumR, nonPositive, sides, pairs };
}
function circlesUnder(F, t) {
  const sideBad = F.sides.filter((s) => Q.sign(Q.add(s.slack, t)) < 0);
  const pairBad = F.pairs.filter((p) => { const u = Q.sub(p.s, t); return Q.sign(u) > 0 && Q.cmp(Q.mul(u, u), p.d2) > 0; });
  return { sideViolations: sideBad.length, pairViolations: pairBad.length,
    sideList: sideBad.map((s) => ({ i: s.i, side: s.side })), pairList: pairBad.map((p) => [p.i, p.j]) };
}
/* the facts every reading reports; t is the reading's tolerance, claimLit the printed sum */
function circles(C, t, claimLit) {
  if (C.length !== 26 || C.some((c) => c.length !== 3)) return { verdict: 'REFUSED', why: 'not 26 triples [x, y, r] (' + C.length + ' rows)' };
  const F = circlesFacts(C);
  const U = circlesUnder(F, t), S = circlesUnder(F, Q.ZERO);
  const minSide = F.sides.reduce((m, s) => (m === null || Q.cmp(s.slack, m.slack) < 0 ? s : m), null);
  const minPair2 = F.pairs.reduce((m, p) => (m === null || Q.cmp(p.slack2, m.slack2) < 0 ? p : m), null);
  const worstE = F.pairs.reduce((m, p) => (m === null || p.eLo > m.eLo ? p : m), null);
  const tangencies = F.pairs.filter((p) => Q.sign(p.slack2) === 0).length, touches = F.sides.filter((s) => Q.sign(s.slack) === 0).length;
  const rounding = L.printedIsRounding(F.sumR, claimLit), truncation = L.printedIsTruncation(F.sumR, claimLit);
  const fails = [];
  if (F.nonPositive.length) fails.push('a radius is not positive (circles ' + F.nonPositive.join(', ') + ')');
  if (U.sideViolations) fails.push(U.sideViolations + ' side constraint' + (U.sideViolations === 1 ? '' : 's') + ' fail');
  if (U.pairViolations) fails.push(U.pairViolations + ' pair' + (U.pairViolations === 1 ? '' : 's') + ' overlap');
  if (!rounding) fails.push('the exact sum does not round to ' + claimLit);
  /* the uniform repair: every radius reduced by delta >= max(0, max (s - d)/2, max side excess) */
  let delta40 = 0n;
  for (const p of F.pairs) { const h = cdiv(p.eHi, 2n); if (h > delta40) delta40 = h; }
  for (const s of F.sides) { const v = cdiv(-s.slack.n * P10(SQ), s.slack.d); if (v > delta40) delta40 = v; }
  const strictHolds = !F.nonPositive.length && !S.sideViolations && !S.pairViolations;
  let repair = null;
  if (!strictHolds) {
    const deltaBar = Q.R(cdiv(delta40, P10(SQ - 20)), P10(20));
    const C2 = C.map(([x, y, r]) => [x, y, Q.sub(r, deltaBar)]);
    const F2 = circlesFacts(C2), S2 = circlesUnder(F2, Q.ZERO);
    repair = { deltaUpper: up(delta40, P10(SQ), 30), deltaBar: qExact(deltaBar), repairedSum: qExact(F2.sumR),
      repairedStrictHolds: !F2.nonPositive.length && !S2.sideViolations && !S2.pairViolations, _C: C2 };
  }
  return {
    verdict: fails.length ? 'REFUTED' : 'CERTIFIED', fails,
    tolerance: qExact(t), n: F.n, sumExact: qExact(F.sumR), claim: claimLit, sumRounds: rounding, sumTruncates: truncation,
    sumMinusClaim: qExact(Q.sub(F.sumR, L.parseDecimal(claimLit))),
    underReading: { sideViolations: U.sideViolations, pairViolations: U.pairViolations, sides: U.sideList, pairs: U.pairList },
    strict: { holds: strictHolds, sideViolations: S.sideViolations, pairViolations: S.pairViolations, sides: S.sideList, pairs: S.pairList },
    radiiNonPositive: F.nonPositive,
    tightestSide: { circle: minSide.i, side: minSide.side, slackExact: qExact(minSide.slack) },
    tightestPairSquared: { pair: [minPair2.i, minPair2.j], dSquaredMinusSumSquaredExact: qExact(minPair2.slack2) },
    worstPairDistance: { pair: [worstE.i, worstE.j], sumMinusDistance: [down(worstE.eLo, P10(SQ), 30), up(worstE.eHi, P10(SQ), 30)] },
    tangenciesExact: tangencies, sideTouchesExact: touches, repair,
    _minPair2: [minPair2.i, minPair2.j], _sumR: F.sumR,
  };
}
/* a reading's facts with every radius reduced by exactly delta (the Table 2 caption's 10^-6 remark) */
function circlesShrunk(C, delta) {
  const C2 = C.map(([x, y, r]) => [x, y, Q.sub(r, delta)]);
  const F = circlesFacts(C2), S = circlesUnder(F, Q.ZERO);
  return { strictHolds: !F.nonPositive.length && !S.sideViolations && !S.pairViolations, sumExact: qExact(F.sumR), _sumR: F.sumR, sideViolations: S.sideViolations, pairViolations: S.pairViolations };
}

/* ================= the second autocorrelation inequality ================= */
function autocorr2(lits) {
  const n = lits.length;
  const k = Math.max(...lits.map(decimalsOf));
  const a = lits.map((x) => scaled(x, k));
  const negatives = []; a.forEach((v, i) => { if (v < 0n) negatives.push(i); });
  const sumA = a.reduce((s, v) => s + v, 0n);
  const domain = negatives.length === 0 && sumA > 0n;
  /* c_k = sum_{i+j=k} a_i a_j, schoolbook, both orders counted once each */
  const c = new Array(2 * n - 1).fill(0n);
  for (let i = 0; i < n; i++) { const ai = a[i]; if (ai === 0n) continue; c[2 * i] += ai * ai; const t = 2n * ai; for (let j = i + 1; j < n; j++) if (a[j] !== 0n) c[i + j] += t * a[j]; }
  let maxC = c[0], argmax = 0; for (let m = 1; m < c.length; m++) if (c[m] > maxC) { maxC = c[m]; argmax = m; }
  let S2 = 0n; for (let m = 0; m <= 2 * n - 1; m++) { const p = m >= 1 ? c[m - 1] : 0n, q = m <= 2 * n - 2 ? c[m] : 0n; S2 += p * p + p * q + q * q; }
  const num = S2, den = 3n * sumA * sumA * maxC;
  const g = gcd(num, den);
  return { n, decimals: k, negatives, domain, sumPositive: sumA > 0n, argmax, Qnum: num / g, Qden: den / g, Q30: [down(num, den, 30), up(num, den, 30)] };
}
function autocorr2Verdict(A, thresholdLit) {
  if (!A.domain) return { verdict: 'REFUTED', why: A.negatives.length ? A.negatives.length + ' negative value(s): not a non-negative function' : 'the integral is not positive' };
  const t = L.parseDecimal(thresholdLit);
  const ge = A.Qnum * t.d >= t.n * A.Qden;
  return { verdict: ge ? 'CERTIFIED' : 'REFUTED', why: ge ? 'Q >= ' + thresholdLit + ' exactly' : 'Q < ' + thresholdLit + ' exactly',
    margin: [down(A.Qnum * t.d - t.n * A.Qden, A.Qden * t.d, 30), up(A.Qnum * t.d - t.n * A.Qden, A.Qden * t.d, 30)] };
}

/* ================= the EinsteinArena PNT object ================= */
const FX = 60;                                     /* F enclosures at 10^-60 */
/* f: Map key(BigInt) -> integer numerator over 10^k (k decimals). normalize: f(1) := -sum_{k>=2} f(k)/k */
function pntRange(keys, A, k, N, opts = {}) {
  const D = P10(k);
  let Lcm = 1n; for (const key of keys) Lcm = Lcm / gcd(Lcm, key) * key;
  /* f(1) = P/(Lcm·D) */
  let P;
  if (opts.f1 !== undefined) { P = opts.f1 * Lcm; }                    /* an explicit f(1) numerator over D (a control) */
  else { P = 0n; for (let i = 0; i < keys.length; i++) if (keys[i] !== 1n) P -= A[i] * (Lcm / keys[i]); }
  const LD = Lcm * D;
  const f1lo = fdiv(P * P10(FX), LD), f1hi = cdiv(P * P10(FX), LD);
  /* g[m] = sum_{k | m, k >= 2} a_k, G(n) = sum_{m <= n} g[m] = sum_{k>=2} a_k floor(n/k) */
  const g = new Array(N).fill(0n);
  for (let i = 0; i < keys.length; i++) { const key = Number(keys[i]); if (key === 1 || key >= N) continue; const ai = A[i]; for (let m = key; m < N; m += key) g[m] += ai; }
  const sc = P10(FX) / D;
  const T1 = P10(FX), T2 = P10(FX) + P10(FX - 4);
  const exactV = (n, G) => BigInt(n) * P + Lcm * G;                   /* F(n)·Lcm·D */
  const thr1 = LD, thr2 = LD + LD / 10000n;                           /* LD divisible by 10^4: D = 10^k, k >= 4 */
  if (k < 4) throw new Error('fewer than 4 decimals: the 1e-4 threshold would not be an integer over D');
  let G = 0n, over1 = 0, over2 = 0, first1 = [], first2 = [], exactCalls = 0, notOne = 0;
  let best = null, worst = null;                                       /* by enclosure; ties resolved exactly below */
  for (let n = 1; n < N; n++) {
    G += g[n];
    const Glo = G * sc, nn = BigInt(n);
    const lo = nn * f1lo + Glo, hi = nn * f1hi + Glo;
    let a1, a2;
    if (hi <= T1) a1 = false; else if (lo > T1) a1 = true; else { exactCalls++; a1 = exactV(n, G) > thr1; }
    if (hi <= T2) a2 = false; else if (lo > T2) a2 = true; else { exactCalls++; a2 = exactV(n, G) > thr2; }
    if (opts.countNotOne && (hi < T1 || lo > T1 || exactV(n, G) !== thr1)) notOne++;
    if (a1) { over1++; if (first1.length < 20) first1.push(n); }
    if (a2) { over2++; if (first2.length < 20) first2.push(n); }
    if (best === null || lo > best.lo) best = { n, lo, hi, G };
    if (worst === null || hi < worst.hi) worst = { n, lo, hi, G };
  }
  /* the exact max and min: every n whose enclosure reaches the best one's far end, decided exactly (second pass) */
  G = 0n;
  let maxV = null, maxN = null, minV = 0n, minN = 0;                 /* F(0) = 0 is in the mirror family (m = 0) */
  for (let n = 1; n < N; n++) {
    G += g[n];
    const Glo = G * sc, nn = BigInt(n);
    const lo = nn * f1lo + Glo, hi = nn * f1hi + Glo;
    if (hi >= best.lo) { const v = exactV(n, G); if (maxV === null || v > maxV) { maxV = v; maxN = n; } }
    if (lo <= worst.hi || lo <= 0n) { const v = exactV(n, G); if (v < minV) { minV = v; minN = n; } }
  }
  /* the mirror: F(L-1-m) = Phi - F(m), Phi = -sum_{k>=1} f(k) = -(P + Lcm·sum_{k>=2} a_k)/(Lcm·D) */
  let sumA = 0n; for (let i = 0; i < keys.length; i++) if (keys[i] !== 1n) sumA += A[i];
  const PhiV = -(P + Lcm * sumA);                                       /* Phi·Lcm·D */
  const mirrorMaxV = PhiV - minV;
  return { N, lcmDigits: Lcm.toString().length, f1: [down(P, LD, 30), up(P, LD, 30)], f1AboveOne: P > LD,
    over1, over2, first1, first2, exactCalls, notOne,
    max: { n: maxN, F: [down(maxV, LD, 30), up(maxV, LD, 30)], aboveOne: maxV > thr1, aboveTol: maxV > thr2 },
    min: { n: minN, F: [down(minV, LD, 30), up(minV, LD, 30)] },
    phi: [down(PhiV, LD, 30), up(PhiV, LD, 30)],
    mirror: { m: minN, F: [down(mirrorMaxV, LD, 30), up(mirrorMaxV, LD, 30)], aboveOne: mirrorMaxV > thr1 },
    _LD: LD, _P: P, _Lcm: Lcm, _maxV: maxV, _minV: minV, _mirrorV: mirrorMaxV };
}
/* F(x)·Lcm·D at one integer x >= 0, evaluated directly as sum_k f(k) floor(x/k) with the exact f(1) (no identity) */
function pntDirect(keys, A, R, x) {
  let s = x * R._P;
  for (let i = 0; i < keys.length; i++) if (keys[i] !== 1n) s += R._Lcm * A[i] * (x / keys[i]);
  return s;
}
/* the platform's step 1 on the literals: clip to [-10, 10], exactly; returns integers over 10^kd */
function pntObject(pf) {
  const keys = [], lits = [];
  for (const [k, v] of pf) { if (!/^[1-9][0-9]*$/.test(k)) throw new Error('a key that is not a positive integer: ' + k); keys.push(BigInt(k)); lits.push(v); }
  const kd = Math.max(4, ...lits.map(decimalsOf));
  const ten = 10n * P10(kd), clipped = [];
  const A = lits.map((v, i) => { const a = scaled(v, kd); if (a > ten) { clipped.push(Number(keys[i])); return ten; } if (a < -ten) { clipped.push(Number(keys[i])); return -ten; } return a; });
  return { keys, A, kd, clipped };
}
/* ln k enclosed at 10^-LN: k = 2^e·y, y in [1,2), ln y = 2 atanh(z), z = (y-1)/(y+1) = (k - 2^e)/(k + 2^e) <= 1/3 */
const LN = 50;
function atanhQ(p, q, S) {                                             /* atanh(p/q)·S enclosed, 0 <= p/q <= 1/3 */
  let lo = 0n, terms = 0;
  const p2 = p * p, q2 = q * q;
  let num = p, den = q;                                                /* (p/q)^(2j+1) */
  for (let j = 0; ; j++) {
    const t = (num * S) / (den * BigInt(2 * j + 1));                   /* floor of a non-negative term */
    lo += t; terms++;
    num *= p2; den *= q2;
    /* tail after this term: sum_{i>j} z^(2i+1)/(2i+1) <= z^(2j+3)/((2j+3)(1-z^2)) */
    if (num === 0n) return [lo, lo];
    const tailNum = num * S * q2, tailDen = den * BigInt(2 * j + 3) * (q2 - p2);
    const tail = cdiv(tailNum, tailDen);
    if (tail <= 1n) return [lo, lo + BigInt(terms) + tail];
  }
}
function lnEnclosures(keys) {
  const S = P10(LN + 6);                                               /* 6 guard digits, then outward to LN */
  const l2 = atanhQ(1n, 3n, S); const ln2 = [2n * l2[0], 2n * l2[1]];
  const out = new Map();
  for (const k of keys) {
    let e = 0n; while ((1n << (e + 1n)) <= k) e++;
    const pw = 1n << e;
    const z = atanhQ(k - pw, k + pw, S);
    const lo = e * ln2[0] + 2n * z[0], hi = e * ln2[1] + 2n * z[1];
    out.set(k, [fdiv(lo, P10(6)), cdiv(hi, P10(6))]);                 /* ln k in [lo, hi]/10^LN */
  }
  return { ln2: [fdiv(ln2[0], P10(6)), cdiv(ln2[1], P10(6))], ln: out };
}
/* S = -sum_{k>=2} f(k) ln(k)/k, f(k) = a_k/10^kd */
function pntScore(keys, A, kd) {
  const { ln } = lnEnclosures(keys.filter((k) => k !== 1n));
  let lo = 0n, hi = 0n; const D = P10(kd);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]; if (k === 1n) continue;
    const w = -A[i], den = k * D;                                      /* the term is (w/den)·ln k */
    const [l, h] = ln.get(k);
    if (w >= 0n) { lo += fdiv(w * l, den); hi += cdiv(w * h, den); } else { lo += fdiv(w * h, den); hi += cdiv(w * l, den); }
  }
  return { lo, hi, scale: LN };                                        /* S in [lo, hi]/10^LN */
}
function scoreAgreement(sc, printedLit, tolLit) {
  const S = L.parseDecimal(printedLit), tol = L.parseDecimal(tolLit);
  const D = P10(sc.scale);
  /* distances as rationals over D·S.d: |S - lo|, |S - hi| */
  const Sn = S.n * D, Sd = S.d;                                        /* S = Sn/(Sd·D) */
  const dLo = Sn - sc.lo * Sd, dHi = Sn - sc.hi * Sd;                  /* (S - lo)·Sd·D, (S - hi)·Sd·D */
  const far = [dLo < 0n ? -dLo : dLo, dHi < 0n ? -dHi : dHi].reduce((a, b) => (a > b ? a : b));
  const agrees = far * tol.d <= tol.n * Sd * D;
  const side = dLo < 0n ? 'below' : dHi > 0n ? 'above' : 'inside';
  return { agrees, distanceUp: up(far, Sd * D, 24), printedSide: side, tolerance: qExact(tol) };
}

module.exports = { circles, circlesShrunk, circlesFacts, autocorr2, autocorr2Verdict, pntRange, pntDirect, pntObject, pntScore, scoreAgreement, lnEnclosures,
  helpers: { P10, fdiv, cdiv, fmt, down, up, qDown, qUp, qExact, isqrt, gcd, scaled, decimalsOf }, Q, L };
