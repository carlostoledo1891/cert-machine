/* fmt.js — how the physics answer key prints a decided number. ONE module: the builder, the report and the tab all
   use it, so a number is shortened the same way everywhere. playground/physics-key/ · cert-machine · 2026-11-17

   The record holds each number as a pair of 12-digit decimal strings, lo ≤ value ≤ hi, rounded outward
   (corpus/physics-key/RULES.md, section 6). A page shows fewer digits, so it must round again, and always AWAY from
   zero: a printed size is then never smaller than the true one. */
(function (root) {
  'use strict';
  /* a non-negative record string ("1.87470636007e-2", or "0") rounded UP to n significant digits */
  function up(s, n) {
    if (s === '0') return null;
    var parts = s.split('e'), digits = parts[0].replace('.', ''), e = +parts[1];
    var h = parseInt(digits.slice(0, n), 10);
    if (/[1-9]/.test(digits.slice(n))) h += 1;
    if (h === Math.pow(10, n)) { h = Math.pow(10, n - 1); e += 1; }
    var t = String(h);
    return { m: t[0] + (n > 1 ? '.' + t.slice(1) : ''), e: e };
  }
  /* "d.dd" times 10^k as a plain decimal string, for small k */
  function shift(m, k) {
    var digits = m.replace('.', ''), pos = 1 + k;
    if (pos <= 0) return '0.' + new Array(1 - pos).join('0') + digits;
    if (pos >= digits.length) return digits + new Array(pos - digits.length + 1).join('0');
    return digits.slice(0, pos) + '.' + digits.slice(pos);
  }
  var sci = function (v) { return v.m + '&times;10<sup>' + (v.e < 0 ? '&minus;' + (-v.e) : v.e) + '</sup>'; };
  /* a size, rounded up to three digits, in the unit a reader expects.
     kind: 'rel' (a fraction of the starting value: per cent when it is not tiny), 'm' (metres), 'mps' (metres per
     second), 'sq' (a squared fraction: powers of ten only) */
  function size(s, kind) {
    var v = up(s, 3);
    if (v === null) return '0';
    if (kind === 'rel') return v.e >= -5 ? shift(v.m, v.e + 2) + '%' : sci(v);
    if (kind === 'm' || kind === 'mps') {
      var per = kind === 'mps' ? '/s' : '';
      if (v.e >= -3) return shift(v.m, v.e + 3) + ' mm' + per;
      if (v.e >= -6) return shift(v.m, v.e + 6) + ' &micro;m' + per;
      return sci(v) + ' m' + per;
    }
    return sci(v);
  }
  /* a signed pair (lo, hi) as sign and size, away from zero */
  function signed(lo, hi, kind) {
    if (lo === '0' && hi === '0') return '0';
    return hi[0] === '-' ? '&minus;' + size(lo.slice(1), kind) : '+' + size(hi, kind);
  }
  var sign = function (lo, hi) { return lo === '0' && hi === '0' ? 0 : hi[0] === '-' ? -1 : 1; };

  var KIND = { 'F-POS': 'm', 'F-VEL': 'mps', 'P-ENERGY': 'rel', 'T-ENERGY': 'rel', 'T-LMAG': 'rel', 'T-LVEC': 'sq', 'T-MONO': 'rel' };
  var LAW = {
    'F-POS': 'Position follows the parabola',
    'F-VEL': 'Speed grows by g each second',
    'P-ENERGY': 'Energy stays what it was',
    'T-ENERGY': 'Kinetic energy stays what it was',
    'T-LMAG': 'Angular momentum keeps its size',
    'T-LVEC': 'Angular momentum stays the same vector',
    'T-MONO': 'Kinetic energy never rises'
  };
  /* the tolerances, in words */
  var TOL = {
    m: { '1e-2': '1 cm', '1e-3': '1 mm', '1e-6': '1 &micro;m', '1e-9': '1 nm', '1e-12': '1 pm', '0': 'exactly' },
    mps: { '1e-2': '1 cm/s', '1e-3': '1 mm/s', '1e-6': '1 &micro;m/s', '1e-9': '1 nm/s', '1e-12': '1 pm/s', '0': 'exactly' },
    rel: { '1e-2': '1%', '1e-4': '0.01%', '1e-6': '1 in 10<sup>6</sup>', '1e-9': '1 in 10<sup>9</sup>', '1e-12': '1 in 10<sup>12</sup>', '0': 'exactly' }
  };
  TOL.sq = TOL.rel;
  var ORDER = function (keys) { return keys.slice().sort(function (a, b) { return (a === '0' ? 99 : +a.slice(3)) - (b === '0' ? 99 : +b.slice(3)); }); };
  /* the tightest tolerance of a law's ladder that the run holds, or null */
  function tightest(law) {
    var keys = ORDER(Object.keys(law.tolerances)), best = null;
    for (var i = 0; i < keys.length; i++) { if (law.tolerances[keys[i]].verdict === 'CERTIFIED') best = keys[i]; else break; }
    return best;
  }
  var F = { up: up, shift: shift, size: size, signed: signed, sign: sign, KIND: KIND, LAW: LAW, TOL: TOL, ORDER: ORDER, tightest: tightest };
  if (typeof module !== 'undefined' && module.exports) module.exports = F; else root.PKF = F;
})(this);
