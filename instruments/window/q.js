/* q.js — exact rationals for the window instrument (BigInt, always reduced).
   instruments/window · cert-machine

   A value is [num, den] with den > 0. Parse accepts "1.25", "-3", "5/4",
   a BigInt/integer, or [num, den]. No float ever enters a comparison; a
   float handed to `parse` is REFUSED (convert it at the source, where its
   exact meaning is known, e.g. a GRIB packed integer).

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
function norm(n, d) {
  if (d === 0n) throw new Error('REFUSED: zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return [n / g, d / g];
}
function parse(v) {
  if (Array.isArray(v)) return norm(BigInt(v[0]), BigInt(v[1]));
  if (typeof v === 'bigint') return [v, 1n];
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) throw new Error('REFUSED: a float reached an exact comparison (' + v + ')');
    return [BigInt(v), 1n];
  }
  const s = String(v).trim();
  let m = /^(-?\d+)\/(\d+)$/.exec(s);
  if (m) return norm(BigInt(m[1]), BigInt(m[2]));
  m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) throw new Error('REFUSED: not an exact number: ' + s);
  const f = m[3] || '';
  return norm(BigInt(m[1] + m[2] + f), 10n ** BigInt(f.length));
}
const add = (a, b) => norm(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const sub = (a, b) => norm(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const mul = (a, b) => norm(a[0] * b[0], a[1] * b[1]);
const div = (a, b) => norm(a[0] * b[1], a[1] * b[0]);
const cmp = (a, b) => { const d = a[0] * b[1] - b[0] * a[1]; return d < 0n ? -1 : d > 0n ? 1 : 0; };
const max = (a, b) => (cmp(a, b) >= 0 ? a : b);
const min = (a, b) => (cmp(a, b) <= 0 ? a : b);
const str = (a) => (a[1] === 1n ? String(a[0]) : a[0] + '/' + a[1]);

/* decimal display, rounded half away from zero; `dir` 'up'|'down' rounds outward instead */
function dec(a, places, dir) {
  let [n, d] = a; const neg = n < 0n; if (neg) n = -n;
  const p = 10n ** BigInt(places);
  let r;
  if (dir === 'up' || dir === 'down') {
    const away = (dir === 'up') !== neg;           /* outward in the signed sense */
    r = away ? (n * p + d - 1n) / d : (n * p) / d;
  } else r = (n * p * 2n + d) / (2n * d);
  const s = r.toString().padStart(places + 1, '0');
  return (neg && r !== 0n ? '-' : '') + (places ? s.slice(0, -places) + '.' + s.slice(-places) : s);
}

/* sqrt as an enclosure: [lo, hi] rationals with lo^2 <= a <= hi^2 and hi - lo <= 1e-6 (integer
   square roots; exact when a is a perfect square of a 1e-6 grid point). For a speed from u^2 + v^2. */
function isqrt(n) {                                /* floor(sqrt(n)), Newton from above: exact for any size */
  if (n < 2n) return n;
  let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2));
  for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; }
}
function sqrtEnc(a) {
  const [p, q] = a; const S = 10n ** 6n;
  if (p < 0n) throw new Error('REFUSED: sqrt of a negative number');
  const N = p * q * S * S, r = isqrt(N);
  const lo = norm(r, q * S);
  return [lo, r * r === N ? lo : norm(r + 1n, q * S)];
}

/* units: exact conversions only */
const KN = norm(1852n, 3600n);                    /* 1 knot in m/s, exactly (international nautical mile) */
const toKnots = (ms) => div(ms, KN);
const toMs = (kn) => mul(kn, KN);

module.exports = { parse, add, sub, mul, div, cmp, max, min, str, dec, norm, sqrtEnc, KN, toKnots, toMs };
