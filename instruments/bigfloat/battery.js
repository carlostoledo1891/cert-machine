#!/usr/bin/env node
/* battery.js — the bigfloat layer's gate.

   The layer is arithmetic other instruments will trust, so it is checked the
   way interval.js is checked: every operation against exact BigInt rationals
   on random operands (containment is the property, not closeness), the
   transcendental series against literature digits AND against each other on
   distinct code paths, and red controls where a deliberate forgery must be
   caught — a shifted enclosure must be refutable, an inverted interval must
   refuse, a truncation that claims exactness must fail containment. */
'use strict';

const B = require('#instruments/bigfloat/bigfloat.js');
const F = require('#instruments/bigfloat/functions.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* deterministic PRNG — a battery must not flake */
let seed = 0x2545F491;
const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
const rndInt = (n) => Math.floor(rnd() * n) + 1;

/* ---- arithmetic vs exact rationals: containment on random operands ---- */
{
  const P = 64;
  let good = 0, trials = 400;
  for (let t = 0; t < trials; t++) {
    const an = BigInt(rndInt(1e6) - 5e5), ad = BigInt(rndInt(1e6));
    const bn = BigInt(rndInt(1e6) - 5e5), bd = BigInt(rndInt(1e6));
    const A = B.fromRatio(an, ad, P), Bi = B.fromRatio(bn, bd, P);
    /* exact results as rationals {n, d} */
    const ex = {
      add: [an * bd + bn * ad, ad * bd],
      sub: [an * bd - bn * ad, ad * bd],
      mul: [an * bn, ad * bd]
    };
    const got = { add: B.add(A, Bi, P), sub: B.sub(A, Bi, P), mul: B.mul(A, Bi, P) };
    if (bn !== 0n) { ex.div = [an * bd * (bn < 0n ? -1n : 1n), ad * bn * (bn < 0n ? -1n : 1n)]; got.div = B.div(A, Bi, P); }
    let allIn = true;
    for (const k of Object.keys(got)) {
      const [n, d] = ex[k];
      if (!(B.cmpRat(got[k].lo, n, d) <= 0 && B.cmpRat(got[k].hi, n, d) >= 0)) allIn = false;
    }
    if (allIn) good++;
  }
  ok(good === trials, 'containment: +,-,x,/ enclose the exact rational on ' + trials + ' random operand pairs');
}

/* ---- directed rounding actually rounds in its direction ---- */
{
  const x = { m: 0b10110110101n, e: 0 };       /* 1461 */
  const d = B.roundDown(x, 4), u = B.roundUp(x, 4);
  ok(B.cmp(d, x) < 0 && B.cmp(x, u) < 0 && B.bitLen(d.m) <= 4 && B.bitLen(u.m) <= 5,
    'roundDown < exact < roundUp on a value that does not fit (1461 at 4 bits: [' +
    B.toNumber(d) + ', ' + B.toNumber(u) + '])');
  const negd = B.roundDown({ m: -1461n, e: 0 }, 4), negu = B.roundUp({ m: -1461n, e: 0 }, 4);
  ok(B.toNumber(negd) < -1461 && B.toNumber(negu) > -1461,
    'directed rounding is toward -inf/+inf, not toward zero, on negatives');
}

/* ---- literature calibration: pi, ln 2, e to 50 places ---- */
{
  const P = 256;
  const dec = (iv, claim) => {
    const m = /^(\d+)\.(\d+)$/.exec(claim);
    const k = m[2].length, num = BigInt(m[1] + m[2]), den = 10n ** BigInt(k);
    return B.cmpRat(iv.lo, num, den) >= 0 && B.cmpRat(iv.hi, num + 1n, den) <= 0;
  };
  ok(dec(F.pi(P), '3.14159265358979323846264338327950288419716939937510'),
    'pi (Machin, alternating tails) certifies its first 50 literature digits');
  ok(dec(F.ln2(P), '0.69314718055994530941723212145817656807550013436025'),
    'ln 2 (atanh series, geometric tail) certifies its first 50 literature digits');
  ok(dec(F.exp(B.fromInt(1), P), '2.71828182845904523536028747135266249775724709369995'),
    'e (Taylor, ratio tail) certifies its first 50 literature digits');
}

/* ---- cross-path consistency: distinct code paths, one number ---- */
{
  const P = 192;
  const a = F.ln2(P), b = F.log(B.fromInt(2), P);   /* series vs reduce+atanh */
  ok(!B.disjoint(a, b), 'ln 2 by series and log(2) by argument reduction intersect — one number, two code paths');
  /* exp(log(x)) contains x for random rationals in (1/8, 64) */
  let good = 0;
  for (let t = 0; t < 25; t++) {
    const n = BigInt(rndInt(512)), d = BigInt(rndInt(8));
    const X = B.fromRatio(n, d, P);
    const r = F.exp(F.log(X, P), P);
    if (B.cmpRat(r.lo, n, d) <= 0 && B.cmpRat(r.hi, n, d) >= 0) good++;
  }
  ok(good === 25, 'exp(log(n/d)) contains n/d on 25 random rationals');
  /* Landen anchor: Li2(1/2) = pi^2/12 - ln^2(2)/2 */
  const li = F.li2Small(B.fromRatio(1n, 2n, P), P);
  const rhs = B.sub(B.div(B.sqr(F.pi(P), P), B.fromInt(12), P),
                    B.div(B.sqr(F.ln2(P), P), B.fromInt(2), P), P);
  ok(!B.disjoint(li, rhs), 'Li2(1/2) by series intersects pi^2/12 - ln^2(2)/2 — the dilog identity holds');
}

/* ---- RED controls: forgeries must be caught ---- */
{
  const P = 256;
  /* an enclosure of pi shifted by 2^-130 must be refutable against the digits */
  const shift = { m: 1n, e: -130 };
  const pf = F.pi(P);
  const forged = B.I(B.addExact(pf.lo, shift), B.addExact(pf.hi, shift));
  const claim = '3.14159265358979323846264338327950288419716939937510';
  const m = /^(\d+)\.(\d+)$/.exec(claim);
  const num = BigInt(m[1] + m[2]), den = 10n ** BigInt(m[2].length);
  const refuted = B.cmpRat(forged.lo, num + 1n, den) > 0 || B.cmpRat(forged.hi, num, den) < 0;
  ok(refuted, 'RED: pi shifted by 2^-130 is REFUTED against the 50-digit window — the audit fires at depths no float sees');
  /* an inverted interval must refuse, not compute */
  let threw = false;
  try { B.checkI(B.I(B.bf(2n, 0), B.bf(1n, 0))); } catch (e) { threw = /inverted/.test(e.message); }
  ok(threw, 'RED: an inverted interval is REFUSED');
  /* division by an interval containing zero must refuse */
  threw = false;
  try { B.div(B.fromInt(1), B.I(B.bf(-1n, 0), B.bf(1n, 0)), P); } catch (e) { threw = /containing 0/.test(e.message); }
  ok(threw, 'RED: division by an interval containing 0 is REFUSED');
  /* domain guards refuse rather than extrapolate */
  threw = false;
  try { F.log(B.fromInt(0), P); } catch (e) { threw = /positive/.test(e.message); }
  ok(threw, 'RED: log of a non-positive interval is REFUSED');
  threw = false;
  try { F.li2Small(B.fromRatio(3n, 4n, P), P); } catch (e) { threw = /domain/.test(e.message); }
  ok(threw, 'RED: Li2 outside |z| <= 5/8 is REFUSED — the small-disk series is not extrapolated');
}

console.log('');
console.log('bigfloat battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
