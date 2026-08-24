/* test-transcendental-enclosure.js — the D3 battery for sin/cos.
 *
 * WHY IT EXISTS, and it is the whole point of the file. test-transcendental.js has 93 checks and
 * was green while sin and cos were UNSOUND, because T10/T11 test `sin(iv(x))` for SCALAR x — a
 * degenerate box [x,x]. On a degenerate box the midpoint IS the interval, so the old
 * `sinPoint(midpoint)` shortcut was trivially correct and nothing ever exercised a real one.
 *
 * That is a test suite that accepts correct behaviour and cannot reject wrong behaviour: D1 green,
 * D3 never asked — the exact failure research/evidence-first-bench measures in other people's
 * benchmarks, sitting in this repo's own trunk, in a file published MIT and described in
 * tools/build-public.js as "sound exp/log/sin/cos/tanh".
 *
 * TWO BUGS THIS FILE PINS, both found 2026-08-08:
 *   1. NARROW BOXES. width <= 1e-6 returned sinPoint((a+b)/2) — an enclosure of sin at one point.
 *      sin([1, 1+1e-9]) came back STRICTLY INSIDE the true range, missing both endpoints.
 *   2. CRITICAL POINTS. The wide branch hulled the endpoints and only widened to [-1,1] when the
 *      width exceeded pi/2. An extremum needs no such width to sit inside: sin([1,2]) returned
 *      [0.8415, 0.9093] when the true maximum is 1 at pi/2. This one was NOT in the original
 *      report and was found by testing the wide branch after fixing the narrow one.
 *
 * METHOD. A returned interval must contain the true range over the WHOLE box, so the reference is
 * dense sampling rather than a single point. Sampling can only ever UNDER-state the true range, so
 * it cannot produce a false alarm — a box that fails here is genuinely unsound.
 *
 * RED CONTROLS (C10, both directions). The old implementations are kept inline and this file
 * asserts they FAIL. A battery that passes on the fixed code proves nothing on its own; one that
 * also fails on the broken code has teeth. If a future refactor makes the red controls pass, this
 * battery has stopped measuring and says so.
 *
 * Run: node core/interval/tests/test-transcendental-enclosure.js     Exit 0 = all pass.
 */
'use strict';

const T = require('../transcendental.js');

let pass = 0, fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('PASS  ' + label + (detail ? '   [' + detail + ']' : '')); }
  else { fail++; console.log('FAIL  ' + label + (detail ? '   [' + detail + ']' : '')); }
}

/* Dense sample of the true range. Under-states, never over-states, so it cannot false-alarm. */
function trueRange(f, a, b, N) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= N; i++) {
    const v = f(a + (b - a) * (i / N));
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return [lo, hi];
}

function encloses(box, lo, hi, slack) {
  return box[0] <= lo + slack && box[1] >= hi - slack;
}

/* ---- E1/E2: the two frozen regressions, named by the bug they pin ------------------------ */

console.log('== eqcert transcendental ENCLOSURE (sin/cos over non-degenerate boxes) ==\n');
console.log('E1 narrow boxes — the midpoint shortcut');

for (const [a, w] of [[0, 1e-6], [0, 1e-7], [0.5, 1e-9], [1, 1e-9], [2, 1e-8], [-3, 1e-7]]) {
  for (const [name, fn, ref] of [['sin', T.sin, Math.sin], ['cos', T.cos, Math.cos]]) {
    const r = fn([a, a + w]);
    const [lo, hi] = trueRange(ref, a, a + w, 20000);
    check(`${name}([${a}, ${a}+${w}]) encloses its true range`,
      encloses(r, lo, hi, 0),
      `got [${r[0]}, ${r[1]}] true [${lo}, ${hi}]`);
  }
}

console.log('\nE2 boxes straddling an extremum — the missing critical-point check');

/* Each of these contains a point where |sin| or |cos| reaches 1, without being wide. */
for (const [a, b] of [[1, 2], [1.5, 1.6], [1.5707, 1.5709], [-2, -1], [3, 3.3], [6.2, 6.4],
                      [0, 0.1], [-0.05, 0.05]]) {
  for (const [name, fn, ref] of [['sin', T.sin, Math.sin], ['cos', T.cos, Math.cos]]) {
    const r = fn([a, b]);
    const [lo, hi] = trueRange(ref, a, b, 400000);
    check(`${name}([${a}, ${b}]) encloses its true range`,
      encloses(r, lo, hi, 0),
      `got [${r[0].toFixed(9)}, ${r[1].toFixed(9)}] true [${lo.toFixed(9)}, ${hi.toFixed(9)}]`);
  }
}

/* ---- E3: randomised sweep, the part that found bug 2 ------------------------------------- */

console.log('\nE3 randomised sweep — widths 1e-9 .. 1e1, centres across several periods');
{
  let bad = 0, n = 0;
  let seed = 20260808;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 3000; i++) {
    const a = (rnd() - 0.5) * 40;
    const b = a + Math.pow(10, -9 + rnd() * 10);
    for (const [fn, ref] of [[T.sin, Math.sin], [T.cos, Math.cos]]) {
      n++;
      const r = fn([a, b]);
      const [lo, hi] = trueRange(ref, a, b, 4000);
      if (!encloses(r, lo, hi, 1e-12)) bad++;
    }
  }
  check('every randomised box is enclosed', bad === 0, `${n} boxes, ${bad} unsound`);
}

/* ---- E4: tightness did not collapse ------------------------------------------------------ */

console.log('\nE4 tightness — soundness must not be bought by returning [-1,1] everywhere');
{
  /* A monotone box far from any extremum must stay narrow. A battery that only checked
     containment would pass trivially on a function that always returned [-1,1]. */
  const r = T.sin([0.1, 0.2]);
  check('sin([0.1,0.2]) stays narrow (monotone box)', (r[1] - r[0]) < 0.2,
    `width ${(r[1] - r[0]).toExponential(3)}`);
  const r2 = T.sin([0.5, 0.5 + 1e-9]);
  check('sin([0.5,0.5+1e-9]) stays narrow', (r2[1] - r2[0]) < 1e-6,
    `width ${(r2[1] - r2[0]).toExponential(3)}`);
  const r3 = T.sin([1, 2]);
  check('sin([1,2]) DOES reach 1 (extremum inside)', r3[1] >= 1,
    `[${r3[0].toFixed(6)}, ${r3[1].toFixed(6)}]`);
}

/* ---- E5: RED CONTROLS — the old code must fail this battery ------------------------------ */

console.log('\nE5 RED CONTROLS — the pre-fix implementations must FAIL these same checks');
{
  /* Bug 1, verbatim in shape: enclose the midpoint and call it the box. */
  const oldNarrow = (X) => T.sin([(X[0] + X[1]) / 2, (X[0] + X[1]) / 2]);
  const [lo1, hi1] = trueRange(Math.sin, 1, 1 + 1e-9, 20000);
  const r1 = oldNarrow([1, 1 + 1e-9]);
  check('RED: midpoint-only sin([1,1+1e-9]) is caught as unsound',
    !encloses(r1, lo1, hi1, 0),
    `[${r1[0]}, ${r1[1]}] misses true [${lo1}, ${hi1}]`);

  /* Bug 2, verbatim in shape: hull the endpoints, widen only past pi/2. */
  const oldWide = (X) => {
    const a = T.sin([X[0], X[0]]), b = T.sin([X[1], X[1]]);
    let lo = Math.min(a[0], b[0]), hi = Math.max(a[1], b[1]);
    if (X[1] - X[0] > T.HALF_PI[0]) { lo = -1; hi = 1; }
    return [lo, hi];
  };
  const [lo2, hi2] = trueRange(Math.sin, 1, 2, 400000);
  const r2 = oldWide([1, 2]);
  check('RED: endpoint-hull sin([1,2]) is caught as unsound',
    !encloses(r2, lo2, hi2, 0),
    `[${r2[0].toFixed(6)}, ${r2[1].toFixed(6)}] misses true max ${hi2.toFixed(6)}`);

  /* And the control must not be vacuous: the SAME probe must accept the fixed code. */
  const good = T.sin([1, 2]);
  check('RED control is not vacuous — the fixed sin passes the probe that kills the old one',
    encloses(good, lo2, hi2, 0), `[${good[0].toFixed(6)}, ${good[1].toFixed(6)}]`);
}

console.log(`\n== transcendental enclosure: ${pass} passed, ${fail} failed ==`);
process.exit(fail ? 1 : 0);
