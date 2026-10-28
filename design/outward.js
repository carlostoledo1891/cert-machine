/* outward.js — a number printed from an enclosure moves OUTWARD: a lower end down, an upper end up.
   design/ · cert-machine · 2026-10-28

   WHY (WARRANT rule 8, and the lesson of design/WARRANT.md's "round a printed bound outward, never truncate it").
   A decimal string cut with .slice(0, k), or a double printed with toPrecision / toExponential / toFixed, rounds
   toward zero or to nearest — so a printed UPPER end can land below the value it bounds, and a printed enclosure can
   fail to contain its own value. The site pass of 2026-10-28 found it on the registry-facing reports: the tl;dr of
   /reports/optconst-queue.html printed ρ ∈ [1.67489421130711622876, 1.67489421130711622876] (both ends cut, ρ above
   the printed upper end), the stat strip printed C₁a ≤ 1.50274348 (the value is 1.5027434867…), and §9 printed
   Pinho's B with its upper end rounded down. The instruments already had three private copies of this rule
   (build-report-ember.js, run-mc100-einstein.js, run-hseva-ledger.js); this is the one the reports share.

   Exact: a double is expanded to its exact decimal (m · 2^e) before it is rounded, and a decimal string is rounded
   as written, in BigInt. Nothing here goes through a float. */
'use strict';

/* the exact decimal expansion of a finite double, or a plain decimal string as written */
function exact(x) {
  if (typeof x === 'string') {
    const t = x.trim();
    if (!/^-?\d+(\.\d+)?$/.test(t)) throw new Error('outward: not a plain decimal: ' + x);
    return t;
  }
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('outward: not a finite number: ' + x);
  if (x === 0) return '0';
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, x);
  const hi = dv.getUint32(0), lo = dv.getUint32(4), neg = hi >>> 31, ex = (hi >>> 20) & 0x7ff;
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo), e;
  if (ex === 0) e = -1074; else { m |= 1n << 52n; e = ex - 1075; }
  let s;
  if (e >= 0) s = (m << BigInt(e)).toString();
  else {
    const k = -e, d = (m * 5n ** BigInt(k)).toString().padStart(k + 1, '0');
    s = (d.slice(0, d.length - k) + '.' + d.slice(d.length - k)).replace(/0+$/, '').replace(/\.$/, '');
  }
  return (neg ? '-' : '') + s;
}

/* rounded at dp decimals: up = toward +∞, otherwise toward −∞ */
function fixed(x, dp, up) {
  if (!(Number.isInteger(dp) && dp >= 0)) throw new Error('outward: decimals must be a whole number ≥ 0');
  const t = exact(x), neg = t[0] === '-', body = neg ? t.slice(1) : t;
  const [ip, fp = ''] = body.split('.');
  let digits = BigInt(ip + fp.slice(0, dp).padEnd(dp, '0'));
  if (/[1-9]/.test(fp.slice(dp)) && up !== neg) digits += 1n;   /* the magnitude grows on the outward side only */
  let s = digits.toString().padStart(dp + 1, '0');
  if (dp) s = s.slice(0, s.length - dp) + '.' + s.slice(s.length - dp);
  return (neg && /[1-9]/.test(s) ? '-' : '') + s;
}
const down = (x, dp) => fixed(x, dp, false);
const up = (x, dp) => fixed(x, dp, true);
/* an enclosure, printed outward at dp decimals */
const enc = ([lo, hi], dp) => '[' + down(lo, dp) + ', ' + up(hi, dp) + ']';

/* the decimal exponent of a nonzero plain decimal string */
function expOf(t) {
  const body = t.replace(/^-/, ''), [ip, fp = ''] = body.split('.'), i = ip.replace(/^0+/, '');
  if (i) return i.length - 1;
  const z = fp.match(/^0*/)[0].length;
  if (z === fp.length) throw new Error('outward: zero has no exponent');
  return -(z + 1);
}
/* k significant digits, fixed notation (a directed toPrecision) */
function sig(x, k, upward) {
  const dp = k - 1 - expOf(exact(x));
  if (dp < 0) throw new Error('outward: ' + k + ' significant digits of ' + x + ' need no decimals; use fixed()');
  return fixed(x, dp, upward);
}
/* d decimals of the mantissa, as "m × 10ⁿ" (a directed toExponential) */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
function sci(x, d, upward) {
  const r = sig(x, d + 1, upward), e = expOf(r), neg = r[0] === '-';
  const digits = r.replace(/^-/, '').replace('.', '').replace(/^0+/, '').padEnd(d + 1, '0').slice(0, d + 1);
  return (neg ? '−' : '') + digits[0] + (d ? '.' + digits.slice(1) : '') + ' × 10' + String(e).split('').map((c) => SUP[c]).join('');
}

/* red controls, run at every require: a check that cannot fail is decoration */
if (up('1.502743486709583379743219592078', 8) !== '1.50274349' || down('1.502743486709583379743219592078', 8) !== '1.50274348'
  || enc(['1.674894211307116228764343737060', '1.674894211307116228764343737061'], 20) !== '[1.67489421130711622876, 1.67489421130711622877]'
  || up(0.2534446875145076, 13) !== '0.2534446875146' || down(0.25344468724870595, 13) !== '0.2534446872487'
  || sig(0.2534446875145076, 13, true) !== '0.2534446875146' || sci(0.00009999999540211134, 3, false) !== '9.999 × 10⁻⁵'
  || sci(4.996003610813206e-16, 1, true) !== '5.0 × 10⁻¹⁶' || up('-0.5', 0) !== '0' || down('-0.5', 0) !== '-1' || up('2', 3) !== '2.000')
  throw new Error('design/outward.js: a red control did not fire as it must');

module.exports = { exact, fixed, down, up, enc, sig, sci, expOf };
