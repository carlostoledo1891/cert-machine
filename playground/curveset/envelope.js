/* envelope.js — the set of calibration curves a set of standards allows.
 *
 * A calibration is run forwards (known standards in, response out) and used
 * backwards (response in, unknown out). Everyone reports the backwards number
 * by fitting a curve and inverting it, and the fit is an assumption. This
 * computes what the DATA allows instead, under assumptions stated one at a
 * time.
 *
 * THE SET.  f is admissible when it passes within the stated measurement error
 * of every standard and its slope lies in [m, M]:
 *
 *     |f(x_i) - y_i| <= e_i     and     m <= f' <= M,  m >= 0.
 *
 * m = 0, M = infinity is bare monotonicity — more analyte, more signal — which
 * nobody disputes about a calibration and nobody uses either.
 *
 * THE ENVELOPE IS CLOSED FORM.  No optimiser, no sampling. For any x, every
 * standard bounds f(x) from both sides through the slope limits:
 *
 *     U(x) = min_i [ hi_i + (x >= x_i ?  M(x - x_i) : -m(x_i - x)) ]
 *     L(x) = max_i [ lo_i + (x >= x_i ?  m(x - x_i) : -M(x_i - x)) ]
 *
 * and every f between L and U with the right slope is admissible, so these are
 * attained. Both are nondecreasing, being min/max of nondecreasing functions,
 * which is what makes the backwards read a bisection rather than a search.
 *
 * READING BACKWARDS.  A response y* is consistent with exactly those x where
 * L(x) <= y* <= U(x). That set is an interval because L and U are nondecreasing,
 * and its ends are found exactly:
 *
 *     x_lo = inf{ x : U(x) >= y* },   x_hi = sup{ x : L(x) <= y* }.
 *
 * With m = 0 and M = infinity the answer collapses to something worth saying
 * out loud: the two standards that bracket the reading, and nothing finer.
 */
'use strict';

/* one calibration, with its stated error budget. `sense` is +1 when more
   analyte means more signal and -1 for a competitive assay, which is handled by
   working in -y and never by a special case further down. */
function prepare(xs, ys, errs, sense = 1) {
  const n = xs.length;
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => xs[a] - xs[b]);
  return {
    n, sense,
    x: idx.map(i => xs[i]),
    y: idx.map(i => sense * ys[i]),
    e: idx.map(i => Math.abs(errs[i])),
  };
}

/* the slope band the standards themselves exhibit, as a starting point for a
   claim about smoothness. Returned in the working (sense-corrected) frame. */
function secantBand(C) {
  const s = [];
  for (let i = 1; i < C.n; i++) s.push((C.y[i] - C.y[i - 1]) / (C.x[i] - C.x[i - 1]));
  return { lo: Math.min(...s), hi: Math.max(...s), all: s };
}

/* U and L. `M = Infinity` and `m = 0` give bare monotonicity. */
function upper(C, x, m, M) {
  let u = Infinity;
  for (let i = 0; i < C.n; i++) {
    const hi = C.y[i] + C.e[i], d = x - C.x[i];
    let v;
    if (d >= 0) v = (M === Infinity) ? (d === 0 ? hi : Infinity) : hi + M * d;
    else v = hi + m * d;                       // d < 0, m >= 0: this lowers the bound
    if (v < u) u = v;
  }
  return u;
}
function lower(C, x, m, M) {
  let l = -Infinity;
  for (let i = 0; i < C.n; i++) {
    const lo = C.y[i] - C.e[i], d = x - C.x[i];
    let v;
    if (d >= 0) v = lo + m * d;
    else v = (M === Infinity) ? (d === 0 ? lo : -Infinity) : lo + M * d;
    if (v > l) l = v;
  }
  return l;
}

/* the backwards read, by bisection on two nondecreasing functions.
   The interval can be genuinely unbounded, and saying so is the right answer
   rather than an error: with bare monotonicity a reading above every standard
   is consistent with any amount of analyte above the top of the ladder. That is
   what a laboratory means by "over range", and it is a property of the ladder,
   not a failure of the arithmetic. */
function readBack(C, yStar, m, M) {
  const y = C.sense * yStar;
  const loMax = Math.max(...C.y.map((v, i) => v - C.e[i]));   // L(+inf) when m = 0
  const hiMin = Math.min(...C.y.map((v, i) => v + C.e[i]));   // U(-inf) when m = 0
  const openAbove = (m === 0) && (y >= loMax);
  const openBelow = (m === 0) && (y <= hiMin);

  /* a bracket wide enough that U and L have crossed y on both sides */
  const span = (C.x[C.n - 1] - C.x[0]) || 1;
  let a = C.x[0] - span, b = C.x[C.n - 1] + span;
  for (let k = 0; k < 60 && !openBelow && upper(C, a, m, M) >= y; k++) a -= span * (k + 1);
  for (let k = 0; k < 60 && !openAbove && lower(C, b, m, M) <= y; k++) b += span * (k + 1);

  const first = (f, want) => {                 // f nondecreasing: first x with f(x) >= want
    let p = a, q = b;
    if (f(p) >= want) return p;
    if (f(q) < want) return null;
    for (let k = 0; k < 200; k++) { const c = (p + q) / 2; if (f(c) >= want) q = c; else p = c; }
    return (p + q) / 2;
  };
  const xLo = openBelow ? -Infinity : first(x => upper(C, x, m, M), y);
  const xHi = openAbove ? Infinity : first(x => lower(C, x, m, M), y + Number.MIN_VALUE);
  if (xLo === null || xHi === null) return null;               // no admissible curve reaches y*
  if (xHi < xLo - 1e-9 * span) return null;
  return {
    lo: xLo, hi: xHi, width: xHi - xLo,
    openAbove, openBelow, bounded: isFinite(xLo) && isFinite(xHi),
  };
}

/* ---- a LOCAL smoothness claim -------------------------------------------
 * A single slope band over the whole calibration is the wrong assertion for a
 * curve that genuinely bends: on a sandwich assay the secants between adjacent
 * standards already span sixteen-fold, so "the slope lies between the smallest
 * and largest secant" constrains nothing, and tightening it changes nothing.
 *
 * The assertion people actually make is local — between two ADJACENT standards
 * the response does not wander far from the straight line joining them:
 *
 *     for x in [x_i, x_{i+1}]:   f' in [ s_i (1-t), s_i (1+t) ],  s_i the secant
 *
 * At t = 0 this is linear interpolation between neighbouring standards, which is
 * what a great many laboratories do by hand. So the dial runs from "nothing but
 * monotone" to "join the dots", with the parametric fit past the end of it.
 *
 * The bound below is an OUTER one: each endpoint is taken with its own error bar
 * independently, so a curve is admitted that might not satisfy both neighbouring
 * intervals at once. It can therefore be slightly wider than the true envelope,
 * never narrower — the interval reported is conservative, which is the direction
 * an argument like this has to err in.
 */
function localBounds(C, x, t) {
  const n = C.n;
  if (x <= C.x[0]) return { u: C.y[0] + C.e[0], l: -Infinity };
  if (x >= C.x[n - 1]) return { u: Infinity, l: C.y[n - 1] - C.e[n - 1] };
  let i = 0;
  while (i < n - 2 && C.x[i + 1] < x) i++;
  const dx = C.x[i + 1] - C.x[i], sec = (C.y[i + 1] - C.y[i]) / dx;
  const sLo = Math.max(0, sec * (1 - t)), sHi = sec * (1 + t);
  const a = x - C.x[i], b = C.x[i + 1] - x;
  return {
    u: Math.min(C.y[i] + C.e[i] + sHi * a, C.y[i + 1] + C.e[i + 1] - sLo * b),
    l: Math.max(C.y[i] - C.e[i] + sLo * a, C.y[i + 1] - C.e[i + 1] - sHi * b),
  };
}

function readBackLocal(C, yStar, t) {
  const y = C.sense * yStar;
  const n = C.n;
  if (y >= C.y[n - 1] - C.e[n - 1]) return { lo: C.x[n - 1], hi: Infinity, width: Infinity, openAbove: true, bounded: false };
  if (y <= C.y[0] + C.e[0]) return { lo: -Infinity, hi: C.x[0], width: Infinity, openBelow: true, bounded: false };
  const U = x => localBounds(C, x, t).u, L = x => localBounds(C, x, t).l;
  const first = (f, want) => {
    let p = C.x[0], q = C.x[n - 1];
    if (f(p) >= want) return p;
    if (f(q) < want) return q;
    for (let k = 0; k < 200; k++) { const c = (p + q) / 2; if (f(c) >= want) q = c; else p = c; }
    return (p + q) / 2;
  };
  const lo = first(U, y), hi = first(L, y + Number.MIN_VALUE);
  if (hi < lo) return null;
  return { lo, hi, width: hi - lo, bounded: true };
}

/* a band for drawing: U and L sampled across the range */
function band(C, m, M, N = 320, opts = {}) {
  const span = C.x[C.n - 1] - C.x[0];
  const a = opts.min !== undefined ? opts.min : C.x[0] - 0.02 * span;
  const b = opts.max !== undefined ? opts.max : C.x[C.n - 1] + 0.02 * span;
  const xs = [], u = [], l = [];
  for (let k = 0; k < N; k++) {
    const x = a + (b - a) * k / (N - 1);
    xs.push(x);
    u.push(C.sense * upper(C, x, m, M));
    l.push(C.sense * lower(C, x, m, M));
  }
  return { x: xs, u, l };
}

module.exports = { prepare, secantBand, upper, lower, readBack, band, localBounds, readBackLocal };
