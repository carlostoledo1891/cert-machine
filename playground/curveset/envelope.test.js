/* envelope.test.js — node experiments/curveset/envelope.test.js
   Cases with answers known before running, because a numeric routine that
   returns plausible numbers is worse than one that throws. */
'use strict';
const E = require('./envelope.js');
let fail = 0;
const ok = (name, cond, got) => { if (!cond) fail++; console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '   got ' + JSON.stringify(got)}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* An exact straight line, zero measurement error: the answer is a point and it
   is known analytically. */
{
  const xs = [0, 1, 2, 3, 4], ys = xs.map(x => 3 + 2 * x);
  const C = E.prepare(xs, ys, xs.map(() => 0));
  const r = E.readBack(C, 3 + 2 * 1.5, 2, 2);              // exact slope asserted
  ok('exact line, exact slope -> a point', r && near(r.lo, 1.5, 1e-6) && near(r.width, 0, 1e-6), r);
  const band = E.secantBand(C);
  ok('secant band of a line is a single slope', near(band.lo, 2, 1e-12) && near(band.hi, 2, 1e-12), band);
}

/* THE LADDER THEOREM. Monotone only, error small enough not to swallow a rung:
   a reading strictly between two standards is located between exactly those two
   standards, and no closer. */
{
  const xs = [0, 10, 20, 30, 40], ys = [0, 10, 20, 30, 40];
  const C = E.prepare(xs, ys, xs.map(() => 0.5));
  const r = E.readBack(C, 15, 0, Infinity);
  ok('monotone only -> the bracketing standards', r && near(r.lo, 10, 1e-6) && near(r.hi, 20, 1e-6), r);
  ok('  width equals one rung', r && near(r.width, 10, 1e-6), r && r.width);
  /* a reading level with a standard still spans the two neighbouring rungs:
     within error the response could have reached it anywhere between them */
  const r2 = E.readBack(C, 20, 0, Infinity);
  ok('reading on a standard -> spans both neighbours', r2 && near(r2.lo, 10, 1e-6) && near(r2.hi, 30, 1e-6), r2);
}

/* error large enough to swallow a rung must widen the answer by whole rungs */
{
  const xs = [0, 10, 20, 30, 40], ys = [0, 10, 20, 30, 40];
  const tight = E.readBack(E.prepare(xs, ys, xs.map(() => 0.5)), 15, 0, Infinity);
  const loose = E.readBack(E.prepare(xs, ys, xs.map(() => 6)), 15, 0, Infinity);
  ok('bigger error budget never narrows the answer', loose.width >= tight.width - 1e-9, [tight.width, loose.width]);
  ok('  and here it widens by rungs', loose.width > tight.width + 1e-6, [tight.width, loose.width]);
}

/* tightening the slope claim must never widen the set; it is a nested family */
{
  const xs = [0, 1, 2, 3, 4, 5], ys = [0, 1.1, 1.9, 3.2, 3.9, 5.1];
  const C = E.prepare(xs, ys, xs.map(() => 0.1));
  let prev = Infinity, mono = true;
  for (const t of [4, 2, 1, 0.5, 0.2, 0.05]) {
    const b = E.secantBand(C);
    const r = E.readBack(C, 2.5, Math.max(0, b.lo * (1 - t)), b.hi * (1 + t));
    if (r.width > prev + 1e-9) mono = false;
    prev = r.width;
  }
  ok('narrower slope claim never widens the interval', mono, prev);
  const wide = E.readBack(C, 2.5, 0, Infinity);
  ok('a very loose slope claim tends to the monotone answer',
    near(E.readBack(C, 2.5, 0, 1e9).width, wide.width, 1e-3), [E.readBack(C, 2.5, 0, 1e9).width, wide.width]);
}

/* the envelope must actually contain the data it was built from */
{
  const xs = [0, 1, 2, 3, 4], ys = [0.1, 1.0, 2.2, 2.9, 4.1];
  const C = E.prepare(xs, ys, xs.map(() => 0.15));
  let inside = true;
  for (let i = 0; i < xs.length; i++) {
    const u = E.upper(C, xs[i], 0, Infinity), l = E.lower(C, xs[i], 0, Infinity);
    if (!(l <= ys[i] + 1e-12 && ys[i] <= u + 1e-12)) inside = false;
  }
  ok('every standard lies inside its own envelope', inside);
  ok('U >= L everywhere the set is non-empty',
    [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4].every(x => E.upper(C, x, 0, Infinity) >= E.lower(C, x, 0, Infinity) - 1e-12));
}

/* a competitive assay: signal falls as analyte rises. Same answer, mirrored. */
{
  const xs = [0, 10, 20, 30, 40], ys = [40, 30, 20, 10, 0];
  const C = E.prepare(xs, ys, xs.map(() => 0.5), -1);
  const r = E.readBack(C, 25, 0, Infinity);
  ok('decreasing calibration -> the bracketing standards', r && near(r.lo, 10, 1e-6) && near(r.hi, 20, 1e-6), r);
}

/* Off the ladder the honest answer is "unbounded", not "refused". With bare
   monotonicity a reading above every standard is consistent with any amount
   above the top rung — which is exactly what "over range" means, and it is a
   fact about the ladder rather than a failure of the arithmetic. */
{
  const xs = [0, 10, 20], ys = [0, 10, 20];
  const C = E.prepare(xs, ys, xs.map(() => 0.2));
  const hi = E.readBack(C, 99, 0, Infinity);
  ok('over range -> unbounded above, starting at the top standard',
    hi && hi.openAbove && hi.hi === Infinity && near(hi.lo, 20, 1e-6), hi);
  const lo = E.readBack(C, -99, 0, Infinity);
  ok('under range -> unbounded below, ending at the bottom standard',
    lo && lo.openBelow && lo.lo === -Infinity && near(lo.hi, 0, 1e-6), lo);
  ok('  neither is reported as bounded', hi && lo && !hi.bounded && !lo.bounded);
}

/* asserting a slope closes the open end: a bounded slope cannot climb forever */
{
  const xs = [0, 10, 20], ys = [0, 10, 20];
  const C = E.prepare(xs, ys, xs.map(() => 0.2));
  const r = E.readBack(C, 99, 0.5, 2);
  ok('a slope claim makes an over-range reading finite again', r && r.bounded && r.hi < 1e6, r);
}

/* an impossible slope claim has no admissible curve at all, and must say so */
{
  const xs = [0, 1, 2], ys = [0, 5, 6];
  const C = E.prepare(xs, ys, xs.map(() => 0.01));
  ok('a slope band the standards violate returns null',
    E.readBack(C, 3, 0.9, 1.1) === null, E.readBack(C, 3, 0.9, 1.1));
}

/* ---- the local smoothness claim ---------------------------------------- */
/* t = 0 must be exactly linear interpolation between adjacent standards, which
   is what a lab doing it by hand produces. */
{
  const xs = [0, 10, 20, 30], ys = [0, 10, 30, 60];
  const C = E.prepare(xs, ys, xs.map(() => 0));
  const r = E.readBackLocal(C, 20, 0);            // halfway up the 10->30 rung
  ok('t = 0 is linear interpolation, exactly', r && near(r.lo, 15, 1e-6) && near(r.width, 0, 1e-6), r);
  const r2 = E.readBackLocal(C, 45, 0);           // halfway up the 30->60 rung
  ok('  and on the next rung too', r2 && near(r2.lo, 25, 1e-6), r2);
}
/* loosening t must widen, and never past the monotone answer */
{
  const xs = [0, 10, 20, 30], ys = [0, 10, 30, 60];
  const C = E.prepare(xs, ys, xs.map(() => 0.2));
  const mono = E.readBack(C, 20, 0, Infinity);
  let prev = -1, grows = true;
  for (const t of [0, 0.1, 0.5, 1, 2]) {
    const r = E.readBackLocal(C, 20, t);
    if (r.width < prev - 1e-9) grows = false;
    prev = r.width;
  }
  ok('a looser local claim never narrows the interval', grows, prev);
  ok('  and never exceeds the monotone answer', prev <= mono.width + 1e-6, [prev, mono.width]);
}
/* error budget still dominates when the ladder is coarse */
{
  const xs = [0, 1, 2], ys = [0, 1, 2];
  const tight = E.readBackLocal(E.prepare(xs, ys, xs.map(() => 0.001)), 0.5, 0);
  const loose = E.readBackLocal(E.prepare(xs, ys, xs.map(() => 0.3)), 0.5, 0);
  ok('at t = 0 the error bars alone still open the interval', loose.width > tight.width + 1e-6, [tight.width, loose.width]);
}
/* over and under range behave as before */
{
  const xs = [0, 10, 20], ys = [0, 10, 20];
  const C = E.prepare(xs, ys, xs.map(() => 0.2));
  ok('local claim, over range -> unbounded above', E.readBackLocal(C, 99, 0).bounded === false);
  ok('local claim, under range -> unbounded below', E.readBackLocal(C, -99, 0).bounded === false);
}

console.log(fail ? `\n${fail} FAILED` : '\nall green');
process.exit(fail ? 1 : 0);
