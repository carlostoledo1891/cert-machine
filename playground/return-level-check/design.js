/* design.js — THE design-height decision of the return-level check: the claim "the T-year wave is at most H", for a
   height H the reader chooses, decided against each certified family's enclosure of that level.
   playground/return-level-check/ · cert-machine · 2026-10-29 (D14, the first handle; WARRANT's R26)

   H moves in whole centimetres, so every decision is an exact comparison of c / 100 with an enclosure's end, which is a
   double and so an exact dyadic rational: c / 100 >= hi is decided in BigInt, never by 100 * hi in floating point
   (the double nearest 0.1 is 0.1000000000000000055…, so 0.10 m is below it, yet 100 * 0.1 is exactly 10 in floating
   point and Math.ceil of it says HOLDS at 0.10 m; a red control in battery.js).

     HOLDS          H is at or above the enclosure's upper end: the level is at most H
     DOES NOT HOLD  H is below the enclosure's lower end: the level is above H
     UNDECIDED      H is inside the enclosure (the words the return-level atlas gives a claim, once)

   The FLIP VALUES are where the word changes, in whole centimetres: HOLDS from `holdsFrom` up, DOES NOT HOLD up to
   `failsTo`. They are decided marks: a drag of H never moves them, and the page draws them solid on H's own ruler.
   Loaded as a plain script (window.HS_DESIGN) or required by Node. No colour, no request.                      MIT */
(function (root) {
  'use strict';
  const VERDICTS = { H: 'HOLDS', N: 'DOES NOT HOLD', U: 'UNDECIDED' };

  /* a finite double as an exact fraction n / d, d a power of two */
  function exact(x) {
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('design: an enclosure end is not a finite number');
    const v = new DataView(new ArrayBuffer(8));
    v.setFloat64(0, x);
    const hi = v.getUint32(0), lo = v.getUint32(4), neg = hi >>> 31, e = (hi >>> 20) & 0x7ff;
    let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo), p;
    if (e === 0) p = -1074; else { m |= 1n << 52n; p = e - 1075; }
    if (neg) m = -m;
    return p >= 0 ? { n: m << BigInt(p), d: 1n } : { n: m, d: 1n << BigInt(-p) };
  }

  /* the least whole centimetre c with c / 100 >= x, exactly (BigInt division truncates toward zero: a floor for a
     positive quotient, already the ceiling for a negative one) */
  function ceilCm(x) {
    const { n, d } = exact(x), N = 100n * n;
    let c = N / d;
    if (c * d < N) c += 1n;
    return Number(c);
  }

  /* an enclosure [lo, hi] of the level, in metres, or null */
  const ok = (q) => Array.isArray(q) && q.length === 2 && q.every((x) => typeof x === 'number' && Number.isFinite(x)) && q[0] <= q[1];

  function flips(q) {
    if (!ok(q)) return null;
    return { holdsFrom: ceilCm(q[1]), failsTo: ceilCm(q[0]) - 1 };
  }

  /* the claim "the level is at most cm / 100 m", decided */
  function verdict(cm, q) {
    if (!Number.isInteger(cm)) throw new Error('design: H moves in whole centimetres');
    const f = flips(q);
    if (!f) return null;
    return cm >= f.holdsFrom ? VERDICTS.H : cm <= f.failsTo ? VERDICTS.N : VERDICTS.U;
  }

  const cmText = (cm) => (cm < 0 ? '−' : '') + Math.floor(Math.abs(cm) / 100) + '.' + String(Math.abs(cm) % 100).padStart(2, '0');

  const API = { VERDICTS, exact, ceilCm, flips, verdict, cmText };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.HS_DESIGN = API;
})(typeof self !== 'undefined' ? self : this);
