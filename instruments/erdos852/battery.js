#!/usr/bin/env node
/* battery.js — the erdos852 instrument's gate.

   Calibration with a known answer: the SAME Euler-product engine that
   computes C* must reproduce Euler's prod_{p>=3}(1 + 1/(p^2-1)) = pi^2/8,
   and the mutation red (tail bound zeroed) must watch that containment
   FAIL — a tail that cannot be missed is not being checked. The I0
   machinery is guarded by the derivative identity and an independent
   numerical-integration check of the dilog inversion formula (both float:
   transcription guards, not verdicts — the rigor lives in the interval
   path). The refutation path is proved live: this battery re-runs the
   naive IEEE-754 double product and watches it reproduce the PUBLISHED
   C* digits while sitting provably below the certified enclosure — the
   bug that wrote the constant, caught in the act, every run. */
'use strict';

const B = require('#instruments/bigfloat/bigfloat.js');
const F = require('#instruments/bigfloat/functions.js');
const E = require('#instruments/erdos852/constants.js');
const PIN = require('#instruments/pin.js');
const FAM = require('#families/erdos852-constants.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- calibration: the product engine vs Euler's pi^2/8 ---- */
{
  const cal = E.calibrationProduct({ limit: 100000, P: 128 });
  const pi2_8 = B.div(B.sqr(F.pi(128), 128), B.fromInt(8), 128);
  ok(!B.disjoint(cal.enclosure, pi2_8),
    'CALIBRATION: prod_{p>=3}(1+1/(p^2-1)) over ' + cal.primes + ' primes + certified tail CONTAINS pi^2/8 (Euler)');
  const mut = E.calibrationProduct({ limit: 100000, P: 128, tailZero: true });
  ok(B.disjoint(mut.enclosure, pi2_8),
    'RED (mutation): the same product with the tail bound zeroed EXCLUDES pi^2/8 — the tail check can fire, so it is real');
}

/* ---- transcription guards on I0 (float; the rigor is in the interval path) ---- */
{
  /* derivative identity I0'(c) = log((e^{2c}-1)/(2c)), consumed by the
     uniqueness argument: centered difference vs the closed form */
  const i0 = (c) => B.toNumber(E.I0(B.I(B.bf(BigInt(Math.round(c * 2 ** 40)), -40)), 128).lo);
  const h = 2 ** -14, c = 563 / 512;            /* both exactly dyadic — no grid error */
  const num = (i0(c + h) - i0(c - h)) / (2 * h);
  const closed = Math.log((Math.exp(2 * c) - 1) / (2 * c));
  ok(Math.abs(num - closed) < 1e-7,
    'derivative identity: numeric I0\'(563/512) = ' + num.toFixed(9) + ' matches log((e^{2c}-1)/2c) = ' + closed.toFixed(9));
  /* dilog inversion checked against direct numerical integration of
     Li2(z) = -int_0^z log(1-t)/t dt at z = 1 - e^2 — an independent route
     that never touches the inversion formula */
  const zEnd = 1 - Math.exp(2);
  const N = 200000; let s = 0;
  for (let i = 0; i < N; i++) {
    const t = zEnd * (i + 0.5) / N;
    s += -Math.log(1 - t) / t;
  }
  const li2int = s * (zEnd / N);
  const x = Math.exp(2) - 1;
  let li2small = 0; for (let k = 60; k >= 1; k--) li2small += Math.pow(-1 / x, k) / (k * k);
  const li2inv = -Math.PI * Math.PI / 6 - Math.log(x) ** 2 / 2 - li2small;
  ok(Math.abs(li2int - li2inv) < 1e-8,
    'dilog inversion vs direct quadrature at z = 1-e^2: ' + li2inv.toFixed(10) + ' vs ' + li2int.toFixed(10));
}

/* ---- the root: certified bracket, monotonicity, digit decisions ---- */
{
  const r = E.rootC0({ P: 192, targetBits: 80 });
  const enc = B.I(r.lo, r.hi);
  ok(r.iters === 80 && /width target/.test(r.note),
    'c0 bisection reaches its width target (80 certified sign decisions, none refused)');
  const one = B.fromInt(1);
  ok(B.isNegative(B.sub(E.I0(B.I(r.lo), 192), one, 192)) && B.isPositive(B.sub(E.I0(B.I(r.hi), 192), one, 192)),
    'the returned bracket re-certifies: I0(lo) < 1 < I0(hi) as strict interval inequalities');
  ok(E.certifyIncreasing(r.lo, r.hi, 192),
    'e^{2c} > 1 + 2c certified on the bracket — I0 strictly increasing there, the root unique on (0,inf)');
  ok(!E.certifyIncreasing(B.bf(-1n, -2), B.bf(1n, -2), 192),
    'RED: the monotonicity certificate correctly FAILS on an interval containing c = 0 (where equality holds) — it can fire');
  const d15 = E.decideClaimedDigits(enc, '1.32322827686395');
  ok(d15.verdict === 'VERIFIED_ROUNDED',
    'the thread\'s c0 = 1.32322827686395... is a correct ROUNDING (its "..." is a half-ulp slip: truth continues ...9469)');
  ok(E.decideClaimedDigits(enc, '1.32322827686').verdict === 'VERIFIED',
    'the 11-decimal truncation 1.32322827686 is VERIFIED outright');
  ok(E.decideClaimedDigits(enc, '1.32322827686500').verdict === 'REFUTED',
    'RED: a forged c0 off by 5e-13 is REFUTED exactly — the audit can fire');
}

/* ---- C* at battery scale: refutation of the published digits + mechanism ---- */
{
  const cs = E.cstar({ limit: 2000000, P: 192 });
  ok(E.decideClaimedDigits(cs.enclosure, '0.0752403861777').verdict === 'REFUTED',
    'the PUBLISHED C* = 0.0752403861777... is REFUTED (truncation and rounding) already at limit 2e6');
  ok(E.decideClaimedDigits(cs.enclosure, '0.0752403861783').verdict === 'VERIFIED',
    'the certified digits 0.0752403861783 are VERIFIED at the same limit');
  /* the mechanism, live: the naive double product reproduces the published
     value digit for digit, and sits provably below the certified enclosure */
  let naive = 1, dropped = 0;
  const primes = E.oddPrimes(2000000);
  for (const p of primes) { const f = 1 + 1 / ((p - 1) ** 3); if (f === 1) dropped++; naive *= f; }
  const naiveC = (naive - 1) / 2;
  ok(Math.abs(naiveC - 0.0752403861777418) < 1e-15,
    'MECHANISM: the naive IEEE-754 product reproduces the published digits exactly (' + naiveC + ')');
  ok(dropped / primes.length > 0.8,
    'MECHANISM: ' + dropped + ' of ' + primes.length + ' factors round to exactly 1.0 and vanish from the naive product');
  ok(naiveC < B.toNumber(cs.enclosure.lo) - 1e-14,
    'MECHANISM: the naive value sits provably BELOW the certified enclosure — the published constant is the float artifact');
}

/* ---- pins: sources held by hash; a forged table must refuse ---- */
{
  ok(PIN.verify('erdos852_thread.html').ok && PIN.verify('erdos852_page.html').ok,
    'both #852 sources (problem page + discussion thread) re-hash against their pins');
  const forged = PIN.verify('erdos852_thread.html', { pins: { 'erdos852_thread.html': 'deadbeef' } });
  ok(!forged.ok && /mismatch/.test(forged.why),
    'RED: a forged pin table is REFUSED — the certificate is over bytes, not memory');
}

/* ---- the family end-to-end: 3 HITs + the discovery-class REJECT ---- */
{
  const verdicts = {};
  for (let i = 0; ; i++) {
    const o = FAM.enumerate(i); if (!o) break;
    verdicts[o.id] = FAM.certify(o);
  }
  ok(verdicts['erdos852-c0-enclosure'].verdict === 'HIT'
    && /1\.32322827686394946902896939329746346135865351/.test(verdicts['erdos852-c0-enclosure'].text),
    'family: c0 enclosure is a HIT carrying 40+ certified digits');
  ok(verdicts['erdos852-c0-digits'].verdict === 'HIT' && /ROUNDING/.test(verdicts['erdos852-c0-digits'].text),
    'family: the published c0 digits survive their audit, as a rounding, and the certificate says so');
  ok(verdicts['erdos852-cstar-enclosure'].verdict === 'HIT'
    && /0\.075240386178309/.test(verdicts['erdos852-cstar-enclosure'].text),
    'family: C* enclosure is a HIT with the corrected digits');
  ok(verdicts['erdos852-cstar-digits'].verdict === 'REJECT' && /REFUTATION/.test(verdicts['erdos852-cstar-digits'].text),
    'family: the published C* digits are REJECTED — a discovery-class refutation of a live thread constant');
}

console.log('');
console.log('erdos852 battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
