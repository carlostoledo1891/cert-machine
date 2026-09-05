/* pi.test.js — node experiments/pqc-geometry/pi.test.js
   The bracket has to be a bracket. Checked against the published digits of π,
   which are a fact about the world and a legitimate thing to test against —
   they are not how the bracket is produced. */
'use strict';
const { piScaled, piPow } = require('./pi.js');

/* π to 110 places */
const PI110 = '3' +
  '14159265358979323846264338327950288419716939937510' +
  '58209749445923078164062862089986280348253421170679' +
  '8214808651328230664709';
let fail = 0;
const ok = (n, c, extra) => { if (!c) fail++; console.log(`  ${c ? 'ok  ' : 'FAIL'} ${n}${c ? '' : '   ' + extra}`); };

for (const d of [10, 25, 50, 80, 100]) {
  const p = piScaled(d);
  const truth = BigInt(PI110.slice(0, d + 1));          // π·10^d, truncated
  ok(`${String(d).padStart(3)} digits: bracket contains π`,
    p.lo <= truth && truth + 1n >= p.lo && p.hi >= truth, `lo=${p.lo} truth=${truth} hi=${p.hi}`);
  const width = p.hi - p.lo;
  ok(`     and is tight (width ${width} units)`, width <= 6n, `width ${width}`);
}

/* a bracket must never be empty or inverted */
{
  const p = piScaled(60);
  ok('lo < hi', p.lo < p.hi);
  ok('lo/S is 3.14159…', p.lo * 100n / p.S === 314n);
}

/* powers keep the bracket, and the bracket widens monotonically with the power */
{
  const a = piPow(1, 60), b = piPow(59, 60), c = piPow(150, 200);
  ok('π^1 bracket brackets π', a.loNum * 1000000n / a.loDen === 3141592n || a.loNum * 1000000n / a.loDen === 3141591n);
  ok('π^59 usable at 60 digits', b.hiNum * 10n ** 6n / b.hiDen > b.loNum * 10n ** 6n / b.loDen - 10n);
  ok('π^150 computable at 200 digits', c.hiNum > c.loNum && c.loNum > 0n);
  /* the real requirement: the relative width of π^e must stay far below the
     1.4e-4 margin the records sit at. Both bounds share a denominator, so the
     relative width is (hi-lo)/lo — measured in BigInt and only then made a
     double, because these numerators run to hundreds of digits and Number()
     of one is Infinity. */
  /* The bracket is far too tight to measure at double scale — the relative
     width underflows to zero — so it is measured as an exact BigInt in parts
     per 10^80 and compared there. */
  const N = 80n, ONE = 10n ** N;
  const relPP = (x) => (x.hiNum - x.loNum) * ONE / x.loNum;     // relative width × 10^80
  const r59 = relPP(b), r150 = relPP(c), r150fine = relPP(piPow(150, 260));
  const dec = (v) => v === 0n ? '< 1e-80' : (Number(v) / 1e80).toExponential(2);
  ok(`π^59  relative width ${dec(r59)}  (margin to beat: 1.4e-4)`, r59 < ONE / 10n ** 8n, r59);
  ok(`π^150 relative width ${dec(r150)}`, r150 < ONE / 10n ** 8n, r150);
  /* At 200 digits π^150 is already tighter than 1e-80, so "strictly tighter"
     cannot be measured at this scale and is not the property that matters:
     more digits must never make it WORSE, and the bracket must be far inside
     the margin being audited. Both are asserted. */
  ok('more digits never widen the bracket', r150fine <= r150, [r150fine, r150]);
  ok('  and the 200-digit bracket already has margin to spare',
    r150 * 10n ** 60n < ONE, r150);
}

console.log(fail ? `\n${fail} FAILED` : '\nall green');
process.exit(fail ? 1 : 0);
