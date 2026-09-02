#!/usr/bin/env node
/* battery.js — the gate on instruments/ivspecial (interval Γ + Bessel J_ν).

   Three layers, in rising order of independence:
   1. The pinned-source falsifiers (frontier-ref/test-ivspecial.js, promoted
      here verbatim in substance): exact closed forms — half-integer Bessel =
      elementary functions — pin the fractional-order path (powIv + gammaIv +
      series) end to end. Plus the NEGATIVE-order closed form J_{-1/2} =
      √(2/πx)·cos x, which the bench never tested.
   2. NEW cross-derivations, two implementations one gate: Γ at half-integers
      against (2n)!/(4ⁿn!)·√π built on instruments/bigfloat (directed dyadic
      rounding, Machin π — nothing shared with Spouge-on-doubles); J at
      integer orders against the EXACT-RATIONAL series (BigInt fractions,
      alternating tail as a fraction); J at half-integer orders against an
      exact-rational sum × bigfloat prefactor √(x/2)·(x/2)^k/√π. All test
      points are DYADIC so both routes evaluate the same real number.
   3. Red controls that must FIRE: a forged Γ and a forged J are refused by
      the cross-gates; a broken bigfloat reference (2ⁿ for 4ⁿ) is refused by
      the same gate run backwards — the reference has teeth, not just the
      subject; the D1 tail bar and D2 domain guard refuse at the door; the
      frontier-ref pin re-hashed (drift on the pinned source refuses). */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const I = require('#instruments/interval/interval.js');
const T = require('#instruments/interval/transcendental.js');
const S = require('#instruments/ivspecial/ivspecial.js');
const B = require('#instruments/bigfloat/bigfloat.js');
const F = require('#instruments/bigfloat/functions.js');
const { iv, add, sub, mul, div } = I;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };
const width = a => a[1] - a[0];
const overlap = (a, b) => !(a[1] < b[0] || a[0] > b[1]);

/* ---------------- 0 · the pin ---------------- */
{
  const pins = {
    'ivspecial.js': 'e4163b62c0b8ca245c6a6f37e7091523516551e8936262b43ef85dd9a634b960',
    'test-ivspecial.js': '348fa511e4af3b9566b08f6ae0b7589704db39aa06436c10a9afb20f11aacada'
  };
  for (const [f, want] of Object.entries(pins)) {
    const got = crypto.createHash('sha256')
      .update(fs.readFileSync(path.join(__dirname, 'frontier-ref', f))).digest('hex');
    ok(got === want, 'pin: frontier-ref/' + f + ' sha256 unchanged');
  }
}

/* ---------------- 1 · the pinned-source falsifiers ---------------- */
/* sqrt */
ok(I.contains(S.sqrtIv(iv(4)), 2), 'sqrt(4) ∋ 2');
ok(I.contains(I.mul(S.sqrtIv(iv(2)), S.sqrtIv(iv(2))), 2), 'sqrt(2)² ∋ 2');

/* atan */
{
  const q1 = S.atanIv(iv(1));
  const pi4 = div(T.PI, iv(4));
  ok(overlap(q1, pi4), 'atan(1) = π/4 (enclosures overlap)');
  ok(width(q1) < 1e-13, 'atan(1) width tiny');
  for (const t of [0.3, 1.7, 12.5, 4000]) {
    ok(I.contains(S.atanIv(iv(t)), Math.atan(t)), 'atan(' + t + ') ∋ float atan');
  }
}

/* angleOf quadrants */
for (const [dx, dy, exp] of [[1, 1, Math.PI / 4], [-1, 1, 3 * Math.PI / 4],
  [-1, -1, 5 * Math.PI / 4], [1, -1, 7 * Math.PI / 4], [0, 1, Math.PI / 2], [0, -1, 3 * Math.PI / 2]]) {
  ok(I.contains(S.angleOf(dx, dy), exp), 'angleOf(' + dx + ',' + dy + ')');
}

/* Γ at exact integers */
for (const [z, exp] of [[1, 1], [2, 1], [3, 2], [4, 6], [7, 720], [11, 3628800], [21, 2432902008176640000]]) {
  ok(I.contains(S.gammaIv(iv(z)), exp), 'Γ(' + z + ') ∋ ' + exp);
}
/* Γ at half-integers vs √π closed forms (interval route) */
{
  const sqPi = S.sqrtIv(T.PI);
  ok(overlap(S.gammaIv(iv(1.5)), div(sqPi, iv(2))), 'Γ(1.5) = √π/2');
  ok(overlap(S.gammaIv(iv(2.5)), mul(iv(0.75), sqPi)), 'Γ(2.5) = 3√π/4');
}
/* functional equation Γ(z+1) = z·Γ(z) at fractional z */
for (const z of [1.31, 5.77, 20.4, 33.2]) {
  ok(overlap(S.gammaIv(iv(z + 1)), mul(iv(z), S.gammaIv(iv(z)))), 'Γ(' + z + '+1) = ' + z + '·Γ(' + z + ')');
}

/* J_{1/2}(x) = √(2/(πx))·sin x — exact fractional-order falsifier */
for (const x of [0.5, 1.7, 4.3]) {
  const j = S.besselJIv(iv(0.5), iv(x));
  const ref = mul(S.sqrtIv(div(iv(2), mul(T.PI, iv(x)))), T.sin(iv(x)));
  ok(overlap(j, ref), 'J_{1/2}(' + x + ') = √(2/πx)·sin x');
}
/* J_{3/2}(x) = √(2/(πx))·(sin x / x − cos x) */
for (const x of [1.1, 3.9]) {
  const j = S.besselJIv(iv(1.5), iv(x));
  const ref = mul(S.sqrtIv(div(iv(2), mul(T.PI, iv(x)))),
    sub(div(T.sin(iv(x)), iv(x)), T.cos(iv(x))));
  ok(overlap(j, ref), 'J_{3/2}(' + x + ')');
}
/* NEGATIVE order (new; the ember chain needs ν−2 ≈ −0.19 at corner C):
   J_{−1/2}(x) = √(2/(πx))·cos x */
for (const x of [0.5, 1.7, 3.25]) {
  const j = S.besselJIv(iv(-0.5), iv(x));
  const ref = mul(S.sqrtIv(div(iv(2), mul(T.PI, iv(x)))), T.cos(iv(x)));
  ok(overlap(j, ref), 'J_{−1/2}(' + x + ') = √(2/πx)·cos x — negative order');
}
/* integer order vs known values */
ok(I.contains(S.besselJIv(iv(0), iv(1)), 0.7651976865579666), 'J_0(1) ∋ literature float');
ok(I.contains(S.besselJIv(iv(1), iv(2)), 0.5767248077568734), 'J_1(2) ∋ literature float');

/* FAT-INTERVAL ORDER (new 2026-09-02): the band program evaluates J over
   an interval of ν (the corner exponent moves with the domain), so the
   enclosure must cover every order in the interval — checked against the
   point-order enclosures at the endpoints and an interior order. */
{
  const fat = S.besselJIv(iv(0.5, 1.5), iv(1.7));
  for (const nu of [0.5, 1.0, 1.5]) {
    ok(overlap(fat, S.besselJIv(iv(nu), iv(1.7))), 'fat-order J_{[0.5,1.5]}(1.7) covers ν=' + nu);
  }
  const fatNeg = S.besselJIv(iv(-0.5, 0.25), iv(1.7));
  ok(overlap(fatNeg, mul(S.sqrtIv(div(iv(2), mul(T.PI, iv(1.7)))), T.cos(iv(1.7)))),
    'fat-order J_{[−0.5,0.25]}(1.7) covers the ν=−1/2 closed form');
  ok(overlap(fatNeg, S.besselJIv(iv(0), iv(1.7))), 'fat-order J_{[−0.5,0.25]}(1.7) covers ν=0');
}

/* recurrence J_{ν−1} + J_{ν+1} = (2ν/x)·J_ν at fractional ν, including a
   NEGATIVE-order instance (ν−1 = −0.2942) */
for (const [nu, x] of [[1.7058, 3.3], [2.4169, 4.6], [3.4116, 2.2], [0.7058, 1.9]]) {
  const lhs = add(S.besselJIv(iv(nu - 1), iv(x)), S.besselJIv(iv(nu + 1), iv(x)));
  const rhs = mul(div(mul(iv(2), iv(nu)), iv(x)), S.besselJIv(iv(nu), iv(x)));
  const d = sub(lhs, rhs);
  ok(d[0] <= 0 && d[1] >= 0, 'recurrence ν=' + nu + ' x=' + x + ' ∋ 0');
}

/* derivative: J'_ν = J_{ν−1} − (ν/x)·J_ν at fractional ν */
for (const [nu, x] of [[1.7058, 3.3], [2.235, 1.9]]) {
  const jd = S.besselJdIv(iv(nu), iv(x));
  const ref = sub(S.besselJIv(iv(nu - 1), iv(x)), mul(div(iv(nu), iv(x)), S.besselJIv(iv(nu), iv(x))));
  ok(overlap(jd, ref), "J'_{" + nu + '}(' + x + ') identity');
}
/* derivative closed form: J'_{1/2}(x) = √(2/(πx))·(cos x − sin x/(2x)) */
for (const x of [1.7, 3.9]) {
  const jd = S.besselJdIv(iv(0.5), iv(x));
  const ref = mul(S.sqrtIv(div(iv(2), mul(T.PI, iv(x)))),
    sub(T.cos(iv(x)), div(T.sin(iv(x)), mul(iv(2), iv(x)))));
  ok(overlap(jd, ref), "J'_{1/2}(" + x + ') closed form');
}
/* derivative vs central difference (float sanity, not a certificate) */
{
  const nu = 2.4169, x = 3.1, h = 1e-6;
  const mid = a => (a[0] + a[1]) / 2;
  const num = (mid(S.besselJIv(iv(nu), iv(x + h))) - mid(S.besselJIv(iv(nu), iv(x - h)))) / (2 * h);
  ok(Math.abs(num - mid(S.besselJdIv(iv(nu), iv(x)))) < 1e-8, "J' vs central difference");
}

/* ---------------- 2 · cross-derivations (bigfloat + exact rationals) ------
   Every test point is DYADIC so ivspecial (doubles) and the reference
   (exact/bigfloat) evaluate the same real number. */
const P = 192;

/* exact BigInt fractions, denominator kept positive */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
function frac(n, d) {
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}
const fAdd = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const fMul = (a, b) => frac(a.n * b.n, a.d * b.d);
const factorial = (n) => { let r = 1n; for (let i = 2n; i <= n; i++) r *= i; return r; };

/* a double interval and a rational bracket [lo, hi] (fracs) intersect? exact */
function overlapRat(dIv, lo, hi) {
  const a = B.fromDoubleExact(dIv[0]), b = B.fromDoubleExact(dIv[1]);
  if (B.cmpRat(b, lo.n, lo.d) < 0) return false;
  if (B.cmpRat(a, hi.n, hi.d) > 0) return false;
  return true;
}
/* a double interval and a bigfloat interval intersect? (bigfloat outward-cast) */
function overlapBig(dIv, X) {
  return !(B.toNumberUp(X.hi) < dIv[0] || B.toNumberDown(X.lo) > dIv[1]);
}

/* Γ(n+1/2) = (2n)!/(4ⁿ·n!)·√π on bigfloat — independent of Spouge */
function gammaHalfBig(n) {
  const num = factorial(2n * BigInt(n));
  const den = (4n ** BigInt(n)) * factorial(BigInt(n));
  const sqrtPi = F.sqrt(F.pi(P), P);
  return B.mul(B.fromRatio(num, den, P), sqrtPi, P);
}
{
  let allTight = true;
  for (const n of [0, 1, 2, 3, 17, 35]) {
    const g = S.gammaIv(iv(n + 0.5));
    const ref = gammaHalfBig(n);
    ok(overlapBig(g, ref), 'Γ(' + (n + 0.5) + ') meets (2n)!/(4ⁿn!)·√π on bigfloat');
    if (!(width(g) / g[0] < 1e-5)) allTight = false;
  }
  ok(allTight, 'Γ half-integer enclosures tighter than 1e-5 relative (so the 1e-4 red below outruns the width)');
}

/* J_n(x) for integer n, dyadic x = p/q: exact-rational series
   Σ (−1)^m (x/2)^{2m+n} / (m!(m+n)!), alternating tail t_{M+1} */
function besselIntRat(n, p, q, M) {
  const half = frac(p, 2n * q); // x/2
  let pow = { n: 1n, d: 1n };
  for (let i = 0; i < n; i++) pow = fMul(pow, half);
  const half2 = fMul(half, half);
  let s = { n: 0n, d: 1n };
  for (let m = 0; m <= M; m++) {
    const t = fMul(pow, frac((m % 2 === 0 ? 1n : -1n), factorial(BigInt(m)) * factorial(BigInt(m + n))));
    s = fAdd(s, t);
    pow = fMul(pow, half2);
  }
  const tail = fMul(pow, frac(1n, factorial(BigInt(M + 1)) * factorial(BigInt(M + 1 + n))));
  const tAbs = { n: tail.n < 0n ? -tail.n : tail.n, d: tail.d };
  return [fAdd(s, { n: -tAbs.n, d: tAbs.d }), fAdd(s, tAbs)];
}
for (const [n, p, q, label] of [[0, 2n, 1n, 'J_0(2)'], [1, 2n, 1n, 'J_1(2)'],
  [2, 7n, 2n, 'J_2(7/2)'], [0, 27n, 16n, 'J_0(27/16)']]) {
  const [lo, hi] = besselIntRat(n, p, q, 30);
  const j = S.besselJIv(iv(n), iv(Number(p) / Number(q)));
  ok(overlapRat(j, lo, hi), label + ' meets the exact-rational series bracket');
}

/* J_{k+1/2}(x), k ≥ −1, dyadic x = p/q ≤ 5: exact-rational sum
   S = Σ (−1)^m (x/2)^{2m} 4^{m+k+1}(m+k+1)!/(m!(2m+2k+2)!)  (Γ folded into
   factorials via Γ(n+1/2) = (2n)!√π/(4ⁿn!)) times bigfloat prefactor
   √(x/2)·(x/2)^k/√π. Alternating tail t_{M+1} (ratio ≪ 1 for x ≤ 5, M=30). */
function besselHalfBig(k, p, q, M) {
  if (Number(p) / Number(q) > 5) throw new Error('besselHalfBig: x <= 5 required for the tail');
  const half2 = fMul(frac(p, 2n * q), frac(p, 2n * q));
  let s = { n: 0n, d: 1n }, pow = { n: 1n, d: 1n };
  const term = (m) => frac(
    (m % 2 === 0 ? 1n : -1n) * (4n ** BigInt(m + k + 1)) * factorial(BigInt(m + k + 1)),
    factorial(BigInt(m)) * factorial(BigInt(2 * m + 2 * k + 2)));
  for (let m = 0; m <= M; m++) { s = fAdd(s, fMul(pow, term(m))); pow = fMul(pow, half2); }
  const tl = fMul(pow, term(M + 1));
  const tAbs = { n: tl.n < 0n ? -tl.n : tl.n, d: tl.d };
  const lo = fAdd(s, { n: -tAbs.n, d: tAbs.d }), hi = fAdd(s, tAbs);
  const SIv = B.I(B.fromRatio(lo.n, lo.d, P).lo, B.fromRatio(hi.n, hi.d, P).hi);
  /* prefactor √(x/2)·(x/2)^k/√π in bigfloat */
  const sqrtXh = F.sqrt(B.fromRatio(p, 2n * q, P), P);
  const powK = k >= 0 ? B.fromRatio(p ** BigInt(k), (2n * q) ** BigInt(k), P)
                      : B.fromRatio((2n * q) ** BigInt(-k), p ** BigInt(-k), P);
  const sqrtPi = F.sqrt(F.pi(P), P);
  const pref = B.div(B.mul(sqrtXh, powK, P), sqrtPi, P);
  return B.mul(pref, SIv, P);
}
for (const [k, p, q, label] of [[-1, 27n, 16n, 'J_{−1/2}(27/16)'], [0, 27n, 16n, 'J_{1/2}(27/16)'],
  [0, 69n, 16n, 'J_{1/2}(69/16)'], [1, 63n, 16n, 'J_{3/2}(63/16)'], [2, 5n, 2n, 'J_{5/2}(5/2)']]) {
  const ref = besselHalfBig(k, p, q, 30);
  const j = S.besselJIv(iv(k + 0.5), iv(Number(p) / Number(q)));
  ok(overlapBig(j, ref), label + ' meets exact-rational sum × bigfloat prefactor');
}

/* ---------------- 3 · red controls (each must FIRE) ---------------- */
{
  /* R1: a Γ forged by 1e-4 relative is REFUSED by the bigfloat gate */
  const forged = mul(S.gammaIv(iv(2.5)), iv(1 + 1e-4));
  ok(!overlapBig(forged, gammaHalfBig(2)), 'RED: Γ(2.5)·(1+1e-4) is DISJOINT from the bigfloat closed form');

  /* R2: a J shifted by 1e-8 is REFUSED by the exact-rational bracket */
  const j = S.besselJIv(iv(0), iv(2));
  const shifted = [j[0] + 1e-8, j[1] + 1e-8];
  const [lo, hi] = besselIntRat(0, 2n, 1n, 30);
  ok(!overlapRat(shifted, lo, hi), 'RED: J_0(2)+1e-8 is DISJOINT from the exact-rational series');

  /* R3: the reference itself has teeth — 2ⁿ in place of 4ⁿ is refused */
  const broken = B.mul(B.fromRatio(factorial(4n), (2n ** 2n) * factorial(2n), P), F.sqrt(F.pi(P), P), P);
  ok(!overlapBig(S.gammaIv(iv(2.5)), broken), 'RED: a broken reference (2ⁿ for 4ⁿ) is DISJOINT — the gate grades both sides');

  /* R4 (D1): besselJdIv refuses when the tail ratio exceeds the proved bar */
  let threw = false;
  try { S.besselJdIv(iv(1.5), iv(82)); } catch (e) { threw = /0\.9/.test(e.message); }
  ok(threw, 'RED: besselJdIv tail ratio above 0.9 is REFUSED, not extrapolated (D1)');

  /* R5 (D2): besselJIv refuses orders below the honest Γ domain */
  threw = false;
  try { S.besselJIv(iv(-0.7), iv(1)); } catch (e) { threw = /-0\.6/.test(e.message); }
  ok(threw, 'RED: besselJIv at ν = −0.7 is REFUSED at the door (D2: gammaIv domain)');

  /* R6: a fat order whose LOW end dips below the door is refused too —
     a wide interval must not smuggle in an order the domain excludes */
  threw = false;
  try { S.besselJIv(iv(-0.7, 0.5), iv(1)); } catch (e) { threw = /-0\.6/.test(e.message); }
  ok(threw, 'RED: fat order [−0.7, 0.5] is REFUSED at the door — width does not bypass the domain');
}

console.log('');
console.log('ivspecial battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
