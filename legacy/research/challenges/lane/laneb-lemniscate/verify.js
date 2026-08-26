/* verify.js — independent re-verification (Lane B) of the extremal-value claim for
   Erdős Problem #1038 (Erdős–Herzog–Piranian 1958, polynomial lemniscates).

   TARGET CLAIM (aimath.robertj1.com, entry id "erdos-1038", snapshot 2026-08-04):
   the July 2026 manuscript "A solution to a problem of Erdős–Herzog–Piranian" by
   Darvas, Peng, Tao (src/Erdos_1038.pdf) claims the exact extremal value

       inf_f |{x in R : |f(x)| < 1}|  =  D  =  1.834430475762661711090753635125...

   over nonconstant monic polynomials f with all roots in [-1,1], where D is DEFINED
   (manuscript Definition A.2) from the unique zero (q*,u*,v*) of the 3-dimensional
   nonlinear system F = (F_R, F_L, K) of Appendix A, eqs (A.1)-(A.8), inside the box
   B_* of eq (A.9):

       Lambda(y) = log((1+y)/(1-y)),   p(q) = log(2/(1-q^2)) / Lambda(q),
       X_q(y)    = (2q^2 - 1 - y^2)/(1 - y^2),   r = X_q(u),  z = X_q(v),
       F_R(q,u)  = Lambda(u) - p(q) log((q+u)/(q-u)),
       F_L(q,v)  = Lambda(v) - p(q) log((q+v)/(v-q)),
       C(q,u,v)  = (r u Lambda(u) - z v Lambda(v) - (r-z) p(q) Lambda(q))
                   / (v Lambda(v) - u Lambda(u)),
       K(q,u,v)  = v (z+C) dvF_L / X'_q(v)  -  u (r+C) duF_R / X'_q(u),
         with duF_R = 2/(1-u^2) - 2 p q/(q^2-u^2),  dvF_L = 2/(1-v^2) + 2 p q/(v^2-q^2),
         X'_q(y) = -4 y (1-q^2)/(1-y^2)^2                    (eqs A.4, A.5, A.6),
       p* = p(q*),  alpha = 2 q*^2 - 1,  r* = X_{q*}(u*),  z* = X_{q*}(v*),
       D  = r* - z*.

   WHAT THIS SCRIPT PROVES (its own arithmetic, nothing of the authors' executed):
     1. Consistency of the manuscript's displayed derivatives (A.4)-(A.6) with
        automatic differentiation of (A.1)-(A.2) and X_q.
     2. The manuscript's certified face inequalities (A.12)-(A.14) on I_* and the
        u/v faces of B_* (re-proved, same statements, our arithmetic).
     3. Existence AND local uniqueness of a zero of F, by the interval Krawczyk
        operator (core/interval/radii.js) over outward-rounded double intervals
        (core/interval/interval.js + core/interval/transcendental.js log). The manuscript
        proves existence by a scalar intermediate-value argument; Krawczyk is a
        genuinely different route to the same Lemma A.1.
     4. B_* is contained in the Krawczyk uniqueness box, so the manuscript's triple
        and ours are the SAME zero.
     5. A high-precision refinement of the zero enclosure to width < 1e-40, in a
        fixed-point BigInt interval layer (quantum 10^-48, floor/ceil directed
        rounding — the same locally-scoped pattern as the Korenblum verifier in
        this series; log via the atanh series after exact power-of-two normalisation,
        with an explicit tail bound; ln 2 = 2 atanh(1/3) the same way).
        The Krawczyk image of a box containing the zero contains the zero, so
        iterating X <- K(X) ∩ X only ever tightens a valid enclosure; the first
        high-precision pass additionally re-checks K(X) ⊂ int X.
     6. The refined triple lies in B_* (and the q-component even in the tighter
        I_* = q0 ± 1e-31 of the manuscript's scalar proof)  =>  Lemma A.1 confirmed.
     7. Every decimal expansion the manuscript prints for the extremal constants —
        D to 30 decimals (p.2), alpha (p.5), and the p.24 block q*, u*, v*, p*,
        alpha, r*, z*, D — agrees digit-for-digit with our certified enclosures.
     8. Four mutation controls are REJECTED (semantic breaks the verifier must
        catch): last-digit tamper of the claimed D; sign flip inside K; box shifted
        by 1e-10; the constant 2 inside p(q) perturbed by 1e-9.

   NOT an execution of the authors' code: their python-flint/Arb scripts under
   src/certificates/ were READ ONLY to cross-check that the system, the box and the
   constants above were extracted correctly (they match the manuscript's Appendix A
   literally); no line of theirs runs here, and no numeric value of theirs enters
   this program except the CLAIMED decimals being checked.

   Single-source doctrine: outward-rounded double intervals, interval log, and the
   Krawczyk operator are IMPORTED from eqcert (the one owner) rather than reimplemented
   here; exact BigInt work uses fixed-point (scaled integers), not fractions, so no
   second rational library exists here either.

   Usage: node verify.js          (exit 0 iff every check passes and every mutation
                                   control is rejected; prints check count + runtime)
*/
'use strict';

const t0 = Date.now();
const path = require('path');
/* WHERE eqcert IS, and why this is not `path.join(__dirname, '..', '..', '..')`.
   This verifier ships. It runs from research/challenges/lane/<unit>/ in the published repo — three
   levels below the root — and from site/technical-reports/lane/<unit>/ in the monorepo, which is
   FOUR. It counted `..` three times, which was right in exactly one of the two trees, and on
   2026-08-08 the pages moved to their routes and it became right in the other one instead.
   A depth is a fact about a layout; a MARKER is a fact about the toolkit. Find the root by
   looking for core/interval/interval.js above this file, and the verifier survives any move of
   either tree. Bounded, and it names the failure rather than throwing a module-resolution
   stack trace at a reader who just downloaded a certificate pack. */
const fs = require('fs');
function eqcertSrc(from) {
  let d = from;
  for (let i = 0; i < 8; i++) {
    const cand = path.join(d, 'core', 'interval');
    if (fs.existsSync(path.join(cand, 'interval.js'))) return cand;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  throw new Error('verify.js: eqcert/src was not found above ' + from +
    ' — this verifier needs the interval toolkit it was published beside.');
}
const EQSRC = eqcertSrc(__dirname);
const EQ = EQSRC;
const IV = require(path.join(EQ, 'interval.js'));
const TR = require(path.join(EQ, 'transcendental.js'));
const RD = require(path.join(EQ, 'radii.js'));

/* ---------------- check counter ---------------- */
let nPass = 0, nFail = 0;
function check(name, cond, detail) {
  if (cond) { nPass++; console.log('PASS  ' + name + (detail ? '   [' + detail + ']' : '')); }
  else { nFail++; console.log('FAIL  ' + name + (detail ? '   [' + detail + ']' : '')); }
}

/* ================= the manuscript's data (Appendix A) =================
   Box centres (A.9) — 35 decimals, exactly as printed (and exactly as in the
   authors' contact_existence.py, read-only cross-check):                       */
const Q0 = '0.94985834582347031848349802544031979';
const U0 = '0.89396612207545611611103128550805002';
const V0 = '0.96455509699582140639698562612728156';
/* radii: q gets 1e-31 in the scalar proof (A.11, I_*), u,v get 1e-30; the box
   B_* (A.9) uses 1e-30 for all three. */

/* Claimed decimal expansions to be verified (page, constant, printed digits). */
const CLAIMS = [
  ['D      (p.2, 30 dec)', 'D',     '1.834430475762661711090753635125'],
  ['alpha  (p.5)',         'alpha', '0.804461754260998666'],
  ['q*     (p.24)',        'q',     '0.949858345823470318'],
  ['u*     (p.24)',        'u',     '0.893966122075456116'],
  ['v*     (p.24)',        'v',     '0.964555096995821406'],
  ['p*     (p.24)',        'p',     '0.824521729252520379'],
  ['alpha  (p.24)',        'alpha', '0.804461754260998666'],
  ['r*     (p.24)',        'r',     '0.0263231076477328506'],
  ['z*     (p.24)',        'z',     '-1.808107368114928860'],
  ['D      (p.24)',        'D',     '1.834430475762661711'],
];

/* ================= backend 1: eqcert outward-rounded doubles ================= */
const BD = {
  fromInt: n => IV.iv(n),
  fromDec: s => { const x = Number(s); return [IV.nextDown(x), IV.nextUp(x)]; },
  add: IV.add, sub: IV.sub, mul: IV.mul, div: IV.div, neg: IV.neg,
  log: X => TR.log(X),
};

/* ================= backend 2: fixed-point BigInt intervals =================
   Value x is enclosed by {lo,hi} meaning lo/S <= x <= hi/S with S = 10^48.
   Directed rounding: floor toward -inf on lower ends, ceil toward +inf on upper.
   Fixed-point add/sub are EXACT; mul/div round outward by construction.        */
const FXD = 48n, S = 10n ** FXD;
function fdiv(n, d) {            /* floor(n/d), d != 0, sign-correct */
  if (d < 0n) { n = -n; d = -d; }
  return n >= 0n ? n / d : -((-n + d - 1n) / d);
}
function cdiv(n, d) { return -fdiv(-n, d); }   /* ceil(n/d) */
const hp = (lo, hi) => ({ lo, hi: hi === undefined ? lo : hi });
const H_ZERO = hp(0n), H_ONE = hp(S);
function hAdd(a, b) { return hp(a.lo + b.lo, a.hi + b.hi); }
function hSub(a, b) { return hp(a.lo - b.hi, a.hi - b.lo); }
function hNeg(a) { return hp(-a.hi, -a.lo); }
function hMul(a, b) {
  const p1 = a.lo * b.lo, p2 = a.lo * b.hi, p3 = a.hi * b.lo, p4 = a.hi * b.hi;
  let mn = p1, mx = p1;
  for (const p of [p2, p3, p4]) { if (p < mn) mn = p; if (p > mx) mx = p; }
  return hp(fdiv(mn, S), cdiv(mx, S));
}
function hDiv(a, b) {
  if (b.lo <= 0n && b.hi >= 0n) throw new Error('hp division by interval containing 0');
  const q = [fdiv(a.lo * S, b.lo), fdiv(a.lo * S, b.hi), fdiv(a.hi * S, b.lo), fdiv(a.hi * S, b.hi)];
  const c = [cdiv(a.lo * S, b.lo), cdiv(a.lo * S, b.hi), cdiv(a.hi * S, b.lo), cdiv(a.hi * S, b.hi)];
  return hp(q.reduce((m, x) => x < m ? x : m), c.reduce((m, x) => x > m ? x : m));
}
function hScaleInt(a, n) {       /* exact multiplication by a JS-integer BigInt */
  const p1 = a.lo * n, p2 = a.hi * n;
  return p1 <= p2 ? hp(p1, p2) : hp(p2, p1);
}
function hDivInt(a, n) {         /* outward division by a positive integer */
  return hp(fdiv(a.lo, n), cdiv(a.hi, n));
}
function hFromDec(s) {           /* exact terminating decimal (<= 48 dec) -> thin hp */
  const m = s.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!m) throw new Error('bad decimal ' + s);
  const frac = (m[3] || '');
  if (frac.length > 48) throw new Error('decimal too long for quantum: ' + s);
  let v = BigInt(m[2]) * S + BigInt(frac.padEnd(48, '0'));
  if (m[1] === '-') v = -v;
  return hp(v);
}
function hFromNumber(x) {        /* double -> hp, padded 1 quantum per side
                                    (toFixed(50) is correctly rounded, error 5e-51) */
  if (!Number.isFinite(x)) throw new Error('hpFromNumber: ' + x);
  const s = x.toFixed(50);
  const m = s.match(/^(-?)(\d+)\.(\d+)$/);
  const scaled = (m[1] === '-' ? -1n : 1n) * BigInt(m[2] + m[3]);   /* at 10^-50 */
  return hp(fdiv(scaled, 100n) - 1n, cdiv(scaled, 100n) + 1n);
}
function hIntersect(a, b) {
  const lo = a.lo > b.lo ? a.lo : b.lo, hi = a.hi < b.hi ? a.hi : b.hi;
  if (lo > hi) throw new Error('empty hp intersection');
  return hp(lo, hi);
}
const hWidth = a => a.hi - a.lo;                       /* in quanta of 1e-48 */
const hInside = (a, b) => a.lo > b.lo && a.hi < b.hi;  /* a ⊂ int b */
const hContains = (a, b) => a.lo <= b.lo && a.hi >= b.hi;
const hSignPos = a => a.lo > 0n, hSignNeg = a => a.hi < 0n;
const hExcludesZero = a => a.lo > 0n || a.hi < 0n;
function hToStr(a, dec) {        /* certified decimal rendering "lo .. hi" */
  const f = v => {
    const neg = v < 0n, m = neg ? -v : v;
    const t = m / 10n ** (FXD - BigInt(dec));
    const s = t.toString().padStart(dec + 1, '0');
    return (neg ? '-' : '') + s.slice(0, -dec) + '.' + s.slice(-dec);
  };
  return f(a.lo) + ' .. ' + f(a.hi);
}

/* hp natural log: normalise by an exact power of two so the mantissa midpoint
   lies in [1,2), then log m = 2 atanh((m-1)/(m+1)) by series with the explicit
   tail |atanh y - S_N(y)| <= |y|^(2N+1) / ((2N+1)(1-y^2));  |y| <= ~0.35 here,
   so N = 64 leaves a tail below 10^-58. ln 2 enters as 2 atanh(1/3).          */
const LOG_N = 64;
function atanhSeries(y) {        /* y an hp interval, |y| < 1/2 required */
  const yA = (y.lo < 0n ? -y.lo : y.lo) > (y.hi < 0n ? -y.hi : y.hi)
    ? (y.lo < 0n ? -y.lo : y.lo) : (y.hi < 0n ? -y.hi : y.hi);
  if (yA * 2n >= S) throw new Error('atanh series: |y| >= 1/2');
  const y2 = hMul(y, y);
  let term = y, sum = y;
  for (let j = 1; j < LOG_N; j++) {
    term = hMul(term, y2);
    sum = hAdd(sum, hDivInt(term, BigInt(2 * j + 1)));
  }
  /* tail bound, computed with outward interval ops on the magnitude point */
  const ya = hp(yA);
  let pw = ya;
  const ya2 = hMul(ya, ya);
  for (let j = 0; j < LOG_N; j++) pw = hMul(pw, ya2);       /* yA^(2N+1) */
  const tail = hDiv(pw, hScaleInt(hSub(H_ONE, ya2), BigInt(2 * LOG_N + 1)));
  return hAdd(sum, hp(-(tail.hi + 1n), tail.hi + 1n));
}
const H_LN2 = (() => {
  const third = hp(fdiv(S, 3n), cdiv(S, 3n));
  return hScaleInt(atanhSeries(third), 2n);
})();
function hLog(a) {
  if (a.lo <= 0n) throw new Error('hp log: need positive interval');
  let lo = a.lo, hi = a.hi, k = 0n;
  let mid = (lo + hi) / 2n;
  while (mid >= 2n * S) { lo = fdiv(lo, 2n); hi = cdiv(hi, 2n); mid = (lo + hi) / 2n; k++; }
  while (mid < S) { lo *= 2n; hi *= 2n; mid = (lo + hi) / 2n; k--; }
  const m = hp(lo, hi);
  const y = hDiv(hSub(m, H_ONE), hAdd(m, H_ONE));
  const lg = hScaleInt(atanhSeries(y), 2n);
  return k === 0n ? lg : hAdd(lg, hScaleInt(H_LN2, k));
}
const BH = {
  fromInt: n => hp(BigInt(n) * S),
  fromDec: hFromDec,
  add: hAdd, sub: hSub, mul: hMul, div: hDiv, neg: hNeg,
  log: hLog,
};

/* ================= forward-mode AD jets over either backend ================= */
function jets(B) {
  const zero = B.fromInt(0), one = B.fromInt(1);
  const c = v => ({ v: B.fromInt(v), d: [zero, zero, zero] });
  const cd = s => ({ v: B.fromDec(s), d: [zero, zero, zero] });
  const vr = (x, i) => ({ v: x, d: [0, 1, 2].map(j => j === i ? one : zero) });
  const add = (a, b) => ({ v: B.add(a.v, b.v), d: a.d.map((x, i) => B.add(x, b.d[i])) });
  const sub = (a, b) => ({ v: B.sub(a.v, b.v), d: a.d.map((x, i) => B.sub(x, b.d[i])) });
  const mul = (a, b) => ({
    v: B.mul(a.v, b.v),
    d: a.d.map((x, i) => B.add(B.mul(x, b.v), B.mul(a.v, b.d[i]))),
  });
  const div = (a, b) => {
    const v = B.div(a.v, b.v);
    return { v, d: a.d.map((x, i) => B.div(B.sub(x, B.mul(v, b.d[i])), b.v)) };
  };
  const neg = a => ({ v: B.neg(a.v), d: a.d.map(B.neg) });
  const log = a => ({ v: B.log(a.v), d: a.d.map(x => B.div(x, a.v)) });
  return { c, cd, vr, add, sub, mul, div, neg, log };
}

/* ============ the system F = (F_R, F_L, K), eqs (A.1)-(A.8), as jets ============
   mut.kPlus flips the '-' in K to '+' (mutation control M2);
   mut.pTwo replaces the constant 2 inside p(q) (mutation control M4).          */
function evalSystem(B, xq, xu, xv, mut) {
  mut = mut || {};
  const J = jets(B);
  const one = J.c(1), two = J.c(2), four = J.c(4);
  const pTwo = mut.pTwo ? J.cd(mut.pTwo) : two;
  const q = J.vr(xq, 0), u = J.vr(xu, 1), v = J.vr(xv, 2);
  const Lam = y => J.log(J.div(J.add(one, y), J.sub(one, y)));
  const q2 = J.mul(q, q), u2 = J.mul(u, u), v2 = J.mul(v, v);
  const Lq = Lam(q), Lu = Lam(u), Lv = Lam(v);
  const p = J.div(J.log(J.div(pTwo, J.sub(one, q2))), Lq);
  const Xof = (y2v) => J.div(J.sub(J.sub(J.mul(two, q2), one), y2v), J.sub(one, y2v));
  const r = Xof(u2), z = Xof(v2);
  const Xp = (y, y2v) => {
    const om = J.sub(one, y2v);
    return J.div(J.neg(J.mul(J.mul(four, y), J.sub(one, q2))), J.mul(om, om));
  };
  const XpU = Xp(u, u2), XpV = Xp(v, v2);
  const F1 = J.sub(Lu, J.mul(p, J.log(J.div(J.add(q, u), J.sub(q, u)))));
  const F2 = J.sub(Lv, J.mul(p, J.log(J.div(J.add(q, v), J.sub(v, q)))));
  const C = J.div(
    J.sub(J.sub(J.mul(J.mul(r, u), Lu), J.mul(J.mul(z, v), Lv)),
          J.mul(J.mul(J.sub(r, z), p), Lq)),
    J.sub(J.mul(v, Lv), J.mul(u, Lu)));
  const dFRu = J.sub(J.div(two, J.sub(one, u2)), J.div(J.mul(J.mul(two, p), q), J.sub(q2, u2)));
  const dFLv = J.add(J.div(two, J.sub(one, v2)), J.div(J.mul(J.mul(two, p), q), J.sub(v2, q2)));
  const termL = J.div(J.mul(J.mul(v, J.add(z, C)), dFLv), XpV);
  const termR = J.div(J.mul(J.mul(u, J.add(r, C)), dFRu), XpU);
  const F3 = mut.kPlus ? J.add(termL, termR) : J.sub(termL, termR);
  return { F: [F1, F2, F3], aux: { p, r, z, C, dFRu, dFLv, XpU, XpV, F1, F2 } };
}

/* first-order mean-value form over an hp box: F(box) ⊂ F(mid) + J(box)·(box-mid).
   Needed where naive evaluation is too loose: the faces (A.13)-(A.14) sit ~5e-30
   from zero while naive dependency inflation (p(q) alone evaluates ~14x wider
   than its true derivative) exceeds that. The MV form is rigorous and
   first-order tight; nothing about the STATEMENT being checked changes.       */
function meanValueF(bq, bu, bv, mut) {
  const mq = hp((bq.lo + bq.hi) / 2n), mu = hp((bu.lo + bu.hi) / 2n), mv = hp((bv.lo + bv.hi) / 2n);
  const Fm = evalSystem(BH, mq, mu, mv, mut).F.map(j => j.v);
  const Jb = evalSystem(BH, bq, bu, bv, mut).F.map(j => j.d);
  const dx = [hSub(bq, mq), hSub(bu, mu), hSub(bv, mv)];
  return Fm.map((f, i) => dx.reduce((acc, d, j) => hAdd(acc, hMul(Jb[i][j], d)), f));
}

/* derived constants (Definition A.2) from a triple of plain hp intervals */
function constantsHp(q, u, v) {
  const one = H_ONE, two = BH.fromInt(2);
  const Lam = y => hLog(hDiv(hAdd(one, y), hSub(one, y)));
  const q2 = hMul(q, q);
  const p = hDiv(hLog(hDiv(two, hSub(one, q2))), Lam(q));
  const alpha = hSub(hScaleInt(q2, 2n), one);
  const X = y => { const y2 = hMul(y, y); return hDiv(hSub(hSub(hScaleInt(q2, 2n), one), y2), hSub(one, y2)); };
  const r = X(u), z = X(v);
  const D = hSub(r, z);
  return { q, u, v, p, alpha, r, z, D };
}

/* certified digit comparison: does the enclosure pin the printed digits?
   Returns {determined, match, mode, certified} — match means the claimed string
   equals the TRUNCATION of the certified value at that many decimals (the
   manuscript prints "digits..."), or its half-up ROUNDING (reported as such).  */
function digitsCheck(enc, claimed) {
  const m = claimed.match(/^(-?)(\d+)\.(\d+)$/);
  if (!m) throw new Error('bad claim ' + claimed);
  const dec = m[3].length, neg = m[1] === '-';
  const M = neg ? hp(-enc.hi, -enc.lo) : enc;         /* magnitude interval */
  if (M.lo <= 0n) return { determined: false, match: false };
  if (neg ? !(enc.hi < 0n) : !(enc.lo > 0n)) return { determined: false, match: false };
  const unit = 10n ** (FXD - BigInt(dec));
  const claimedInt = BigInt(m[2] + m[3]);
  const tLo = M.lo / unit, tHi = M.hi / unit;         /* truncation of magnitude */
  const half = 5n * 10n ** (FXD - BigInt(dec) - 1n);
  const rLo = (M.lo + half) / unit, rHi = (M.hi + half) / unit;
  const out = { determined: tLo === tHi, roundDetermined: rLo === rHi, certified: hToStr(M, Math.min(dec + 4, 44)) };
  if (out.determined && tLo === claimedInt) return Object.assign(out, { match: true, mode: 'truncation' });
  if (out.roundDetermined && rLo === claimedInt) return Object.assign(out, { match: true, mode: 'rounded' });
  return Object.assign(out, { match: false });
}

/* =========================== the run =========================== */
console.log('Lane B — Erdős #1038 extremal value: independent interval re-verification');
console.log('');

/* ---- (1) AD vs the manuscript's displayed derivatives (A.4)-(A.6), doubles ---- */
{
  const q = BD.fromDec(Q0), u = BD.fromDec(U0), v = BD.fromDec(V0);
  const { F, aux } = evalSystem(BD, q, u, v);
  const ovl = (a, b) => a[0] <= b[1] && b[0] <= a[1];
  check('(A.4)  AD d/du F_R overlaps the printed closed form', ovl(F[0].d[1], aux.dFRu.v),
    'AD ' + F[0].d[1][0].toPrecision(8) + ', closed ' + aux.dFRu.v[0].toPrecision(8));
  check('(A.5)  AD d/dv F_L overlaps the printed closed form', ovl(F[1].d[2], aux.dFLv.v),
    'AD ' + F[1].d[2][0].toPrecision(8) + ', closed ' + aux.dFLv.v[0].toPrecision(8));
  /* (A.6): AD of X_q(u) w.r.t. u against the printed X'_q — read off r's jet */
  check('(A.6)  AD d/du X_q(u) overlaps the printed closed form', ovl(aux.r.d[1], aux.XpU.v),
    'AD ' + aux.r.d[1][0].toPrecision(8) + ', closed ' + aux.XpU.v[0].toPrecision(8));
}

/* ---- (2) face inequalities (A.12)-(A.14), hp arithmetic over I_* faces ---- */
{
  const E31 = hp(-(10n ** (FXD - 31n)), 10n ** (FXD - 31n));   /* ±1e-31 */
  const E30 = hp(-(10n ** (FXD - 30n)), 10n ** (FXD - 30n));   /* ±1e-30 */
  const qI = hAdd(hFromDec(Q0), E31);                          /* I_* (A.11) */
  const uC = hFromDec(U0), vC = hFromDec(V0);
  const uLo = hAdd(uC, hp(E30.lo)), uHi = hAdd(uC, hp(E30.hi));
  const vLo = hAdd(vC, hp(E30.lo)), vHi = hAdd(vC, hp(E30.hi));
  const at = (u, v) => evalSystem(BH, qI, u, v);
  const pIv = at(uC, vC).aux.p.v;
  check('(A.12) 0 < p(q) < q < 1 uniformly on I_*',
    hSignPos(pIv) && pIv.hi < qI.lo && qI.hi < S, 'p in ' + hToStr(pIv, 21));
  const FRlo = meanValueF(qI, uLo, vC)[0], FRhi = meanValueF(qI, uHi, vC)[0];
  check('(A.13) F_R(q, u0-1e-30) > 0 > F_R(q, u0+1e-30) on I_* (mean-value form)',
    hSignPos(FRlo) && hSignNeg(FRhi),
    'F_R faces ' + hToStr(FRlo, 32) + ' | ' + hToStr(FRhi, 32));
  const FLlo = meanValueF(qI, uC, vLo)[1], FLhi = meanValueF(qI, uC, vHi)[1];
  check('(A.14) F_L(q, v0-1e-30) < 0 < F_L(q, v0+1e-30) on I_* (mean-value form)',
    hSignNeg(FLlo) && hSignPos(FLhi),
    'F_L faces ' + hToStr(FLlo, 32) + ' | ' + hToStr(FLhi, 32));
}

/* ---- (3) Krawczyk existence + uniqueness, eqcert doubles ---- */
let XD;             /* the certified uniqueness box (double endpoints) */
let APRE;           /* the float preconditioner matrix, reused by the hp refinement */
{
  const x0 = [Number(Q0), Number(U0), Number(V0)];
  const Fd = X => evalSystem(BD, X[0], X[1], X[2]).F.map(j => j.v);
  const DFd = X => { const F = evalSystem(BD, X[0], X[1], X[2]).F; return F.map(j => j.d); };
  /* approximate midpoint Jacobian -> approximate inverse (plain floats: only a
     preconditioner, rigor lives in the interval operator) */
  const J0 = DFd(x0.map(v => IV.iv(v))).map(row => row.map(e => (e[0] + e[1]) / 2));
  const [a, b, c2] = J0[0], [d, e, f] = J0[1], [g, h, i] = J0[2];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c2 * (d * h - e * g);
  const A = [
    [(e * i - f * h) / det, (c2 * h - b * i) / det, (b * f - c2 * e) / det],
    [(f * g - d * i) / det, (a * i - c2 * g) / det, (c2 * d - a * f) / det],
    [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
  ];
  const res = RD.krawczyk(Fd, DFd, x0, A, {});
  check('Krawczyk (eqcert) proves existence + uniqueness of the triple',
    !!res.ok, res.ok ? 'rounds ' + res.rounds + ', maxRad ' + res.maxRad.toExponential(2) : res.why);
  if (!res.ok) { console.log('FATAL: no certificate'); process.exit(1); }
  XD = res.box;
  APRE = A;
}

/* ---- (4) B_* ⊂ Krawczyk box: the manuscript's zero IS our zero ---- */
let X;              /* running hp enclosure of the triple */
{
  const E30 = 10n ** (FXD - 30n);
  const box = XD.map(bi => hp(hFromNumber(bi[0]).lo, hFromNumber(bi[1]).hi));
  const bstar = [hFromDec(Q0), hFromDec(U0), hFromDec(V0)]
    .map(cI => hp(cI.lo - E30, cI.hi + E30));
  check('B_* (A.9) is contained in the Krawczyk uniqueness box',
    bstar.every((b, i) => hContains(box[i], b)));
  X = box;
}

/* ---- (5) high-precision refinement: X <- K(X) ∩ X ---- */
{
  const Ah = APRE.map(row => row.map(hFromNumber));
  let firstInterior = null;
  for (let round = 0; round < 5; round++) {
    const m = X.map(xi => hp((xi.lo + xi.hi) / 2n));
    const Fm = evalSystem(BH, m[0], m[1], m[2]).F.map(j => j.v);
    const Jx = evalSystem(BH, X[0], X[1], X[2]).F.map(j => j.d);
    const K = [];
    for (let i = 0; i < 3; i++) {
      let acc = m[i];
      for (let k = 0; k < 3; k++) acc = hSub(acc, hMul(Ah[i][k], Fm[k]));
      for (let j = 0; j < 3; j++) {
        let s = H_ZERO;
        for (let k = 0; k < 3; k++) s = hAdd(s, hMul(Ah[i][k], Jx[k][j]));
        const mij = i === j ? hSub(H_ONE, s) : hNeg(s);
        acc = hAdd(acc, hMul(mij, hSub(X[j], m[j])));
      }
      K.push(acc);
    }
    if (round === 0) firstInterior = K.every((k, i) => hInside(k, X[i]));
    X = K.map((k, i) => hIntersect(k, X[i]));
  }
  check('high-precision Krawczyk image lands in the interior (existence re-proved)', !!firstInterior);
  const wq = hWidth(X[0]), wu = hWidth(X[1]), wv = hWidth(X[2]);
  const w40 = 10n ** (FXD - 40n);
  check('refined enclosure width < 1e-40 in each coordinate',
    wq < w40 && wu < w40 && wv < w40,
    'widths(quanta 1e-48): ' + wq + ', ' + wu + ', ' + wv);
}

/* ---- (6) the refined triple lies in the manuscript's boxes: Lemma A.1 ---- */
{
  const E31 = 10n ** (FXD - 31n), E30 = 10n ** (FXD - 30n);
  const qc = hFromDec(Q0), uc = hFromDec(U0), vc = hFromDec(V0);
  check('q* inside I_* = q0 ± 1e-31 (A.11) — stronger than the B_* face',
    hContains(hp(qc.lo - E31, qc.hi + E31), X[0]));
  check('(q*,u*,v*) inside B_* = centres ± 1e-30 (A.9)  =>  Lemma A.1 confirmed',
    hContains(hp(qc.lo - E30, qc.hi + E30), X[0]) &&
    hContains(hp(uc.lo - E30, uc.hi + E30), X[1]) &&
    hContains(hp(vc.lo - E30, vc.hi + E30), X[2]));
}

/* ---- (7) the claimed decimal expansions, digit for digit ---- */
const CONST = constantsHp(X[0], X[1], X[2]);
{
  console.log('');
  console.log('certified enclosures (40 decimals shown):');
  for (const k of ['q', 'u', 'v', 'p', 'alpha', 'r', 'z', 'D'])
    console.log('  ' + k.padEnd(5) + ' = ' + hToStr(CONST[k], 40));
  console.log('');
  for (const [label, key, claimed] of CLAIMS) {
    const res = digitsCheck(CONST[key], claimed);
    check('claimed digits  ' + label, res.match, res.match ? res.mode : 'certified ' + res.certified);
  }
}

/* ---- (8) mutation controls: each MUST be rejected ---- */
console.log('');
{
  /* M1: last printed digit of the 30-decimal D bumped by one */
  const r1 = digitsCheck(CONST.D, '1.834430475762661711090753635126');
  check('M1 rejected: D last digit tampered (…125 -> …126) fails the digit check', !r1.match);

  /* M2: sign flip inside K (the '-' of (A.7) turned into '+'):
     the certified triple no longer solves the mutated third equation */
  const F3m = evalSystem(BH, X[0], X[1], X[2], { kPlus: true }).F[2].v;
  check('M2 rejected: K with flipped sign has NO zero at the certified triple',
    hExcludesZero(F3m), 'F3_mut = ' + hToStr(F3m, 12));

  /* M3: the whole box B_* shifted by +1e-10 in q: F_R excludes zero there */
  const E30 = hp(-(10n ** (FXD - 30n)), 10n ** (FXD - 30n));
  const shift = hp(10n ** (FXD - 10n));
  const qS = hAdd(hAdd(hFromDec(Q0), E30), shift);
  const F1s = evalSystem(BH, qS, hAdd(hFromDec(U0), E30), hAdd(hFromDec(V0), E30)).F[0].v;
  check('M3 rejected: box shifted by 1e-10 in q contains no zero of F_R',
    hExcludesZero(F1s), 'F_R over shifted box = ' + hToStr(F1s, 14));

  /* M4: the defining constant 2 inside p(q) perturbed to 2.000000001 */
  const F1m = evalSystem(BH, X[0], X[1], X[2], { pTwo: '2.000000001' }).F[0].v;
  check('M4 rejected: p(q) constant 2 -> 2.000000001 breaks F_R at the triple',
    hExcludesZero(F1m), 'F_R_mut = ' + hToStr(F1m, 14));
}

/* =========================== verdict =========================== */
console.log('');
const dt = ((Date.now() - t0) / 1000).toFixed(1);
console.log('checks: ' + nPass + ' passed, ' + nFail + ' failed;  4 mutation controls rejected;  ' + dt + ' s');
if (nFail > 0) { console.log('VERDICT: NOT CONFIRMED'); process.exit(1); }
console.log('VERDICT: CONFIRMED (the computational fragment: the extremal triple exists,');
console.log('is unique in the certified box, lies in B_*, and every printed decimal of');
console.log('the extremal constants — including all 30 claimed decimals of D — is correct)');
