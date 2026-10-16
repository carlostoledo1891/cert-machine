#!/usr/bin/env node
/* decide.js — PU Verificado: the unit price of a Brazilian fixed-rate federal bond, decided exactly.
   instruments/pu/ · cert-machine · 2026-10-16

   THE RULE (STN, Metodologia de Cálculo 29/04/2024, Tabela 3; = ANBIMA 2021 §22):
     LTN    PU = 1000 / (1 + taxa)^(du/252)          taxa % a.a. T-6 · exponent T-14 · PU T-6
     NTN-F  PU = Σ_k  C_k / (1 + taxa)^(du_k/252)    coupon 1000·(1.10^½ − 1) A-5 · each flow A-9 · PU T-6
     du = business days from settlement (inclusive) to payment (exclusive) on the ANBIMA national calendar.
   A = round half up at that many decimals, T = truncate.

   THE ARITHMETIC. Every step the rule defines is exact (BigInt rationals and decimal integers). The one
   irrational step, (1 + taxa)^E, is an ENCLOSURE: ln(1 + i) by the atanh series with its remainder bounded,
   times the exact rational E, then exp by halving, a Taylor polynomial with its remainder bounded, and m
   squarings — every operation rounded outward at a fixed point of 10^-48. A truncation or rounding is then a
   DECISION: both ends of the enclosure give the same digits, or the row is REFUSED (the enclosure straddles the
   boundary). Nothing is a float. The Python decider (decide.py) shares no code with this file.

   usage: node instruments/pu/decide.js            run the methodology's worked examples (the calibration)
          require(...).decideLTN / decideNTNF / calendar                                                   */
'use strict';
/* no Node requires at module level: the same bytes run in the browser (playground/pu) */

const P = 48n;                      /* fixed-point digits */
const S = 10n ** P;                 /* the scale */

/* ---- calendar --------------------------------------------------------------------------------------- */
function calendar(holidaysJson) {
  const H = new Set((holidaysJson.holidays || holidaysJson));
  /* cumulative business-day index from 2000-01-01 to 2075-12-31 — du is a difference of two lookups */
  const idx = new Map(); let n = 0;
  const d = new Date(Date.UTC(2000, 0, 1)), end = Date.UTC(2075, 11, 31);
  while (d.getTime() <= end) {
    const iso = d.toISOString().slice(0, 10);
    idx.set(iso, n);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6 && !H.has(iso)) n++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const isBiz = (iso) => { const t = new Date(iso + 'T00:00:00Z').getUTCDay(); return t !== 0 && t !== 6 && !H.has(iso); };
  const next = (iso) => { const t = new Date(iso + 'T00:00:00Z'); do { t.setUTCDate(t.getUTCDate() + 1); } while (!isBiz(t.toISOString().slice(0, 10))); return t.toISOString().slice(0, 10); };
  /* du: business days in [a, b) */
  const du = (a, b) => { if (!idx.has(a) || !idx.has(b)) throw new Error('calendar: date outside 2000–2075: ' + a + ' ' + b); return idx.get(b) - idx.get(a); };
  return { du, isBiz, next, holidays: H };
}

/* ---- fixed-point helpers (values are BigInt numerators over S) --------------------------------------- */
const floorDiv = (a, b) => { const q = a / b; return (a % b !== 0n && ((a < 0n) !== (b < 0n))) ? q - 1n : q; };
const ceilDiv = (a, b) => -floorDiv(-a, b);
/* rational p/q → fixed-point floor and ceil */
const fxLo = (p, q) => floorDiv(p * S, q), fxHi = (p, q) => ceilDiv(p * S, q);

/* ln(1 + p/q) as [lo, hi] at scale S, for 0 ≤ p/q < 1. 2·atanh(z), z = p/(2q + p); K terms; remainder
   R ≤ 2 z^(2K+3) / ((2K+3)(1 − z²)) bounded above with z ≤ zMax. */
function lnOnePlus(p, q) {
  if (p < 0n) throw new Error('ln: negative rate');
  if (p === 0n) return [0n, 0n];
  const zp = p, zq = 2n * q + p;                     /* z = zp/zq */
  const K = 60;
  let lo = 0n, hi = 0n;
  let num = zp, den = zq;                            /* z^(2k+1) as a rational, kept reduced-ish by scaling */
  const z2p = zp * zp, z2q = zq * zq;
  for (let k = 0; k <= K; k++) {
    const m = BigInt(2 * k + 1);
    lo += fxLo(2n * num, den * m); hi += fxHi(2n * num, den * m);
    num *= z2p; den *= z2q;
    /* keep the fraction from growing without bound: divide both by a common power of 10 when huge (lossless for
       the ratio only if exact; so instead reduce by gcd every few terms) */
    if (k % 6 === 5) { const g = gcd(num, den); num /= g; den /= g; }
  }
  /* remainder: z^(2K+3) ≤ (num/den) at this point (we advanced past the last used term exactly once more) */
  const rem = ceilDiv(2n * num * S, den * BigInt(2 * K + 3)) ;      /* / (1 − z²) ≤ 1/(1 − 1/4) for z ≤ 1/2 */
  hi += rem * 4n / 3n + 1n;
  return [lo, hi];
}
function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; }

/* exp of an interval [ylo, yhi] (scale S), y ≥ 0: halve m times until y/2^m < 1/64, Taylor N terms, square back */
function expInterval(ylo, yhi) {
  if (ylo < 0n) throw new Error('exp: negative exponent not needed here');
  let m = 0n;
  const limit = S / 64n;
  let a = ylo, b = yhi;
  while (b > limit) { a = floorDiv(a, 2n); b = ceilDiv(b, 2n); m++; }
  const N = 16;
  const taylor = (y, up) => {                        /* Σ y^k/k!, k = 0..N, rounded in direction `up` */
    let sum = S, term = S;
    for (let k = 1n; k <= BigInt(N); k++) { term = up ? ceilDiv(term * y, S * k) : floorDiv(term * y, S * k); sum += term; }
    return sum;
  };
  let lo = taylor(a, false);
  /* remainder for y < 1/64: y^(N+1)/(N+1)! · 1/(1 − y) < 2 · (1/64)^(N+1)/(N+1)! — far below 10^-48 at N = 16;
     add one unit anyway */
  let hi = taylor(b, true) + 2n;
  for (let i = 0n; i < m; i++) { lo = floorDiv(lo * lo, S); hi = ceilDiv(hi * hi, S); }
  return [lo, hi];
}

/* (1 + taxaPct/100)^(trunc14(du/252)) as an enclosure at scale S. taxaPct is a decimal string "14,36" or "14.3600". */
const factorCache = new Map();
function factor(taxaPct, du) {
  const key = taxaPct + '|' + du;
  if (factorCache.has(key)) return factorCache.get(key);
  const [p, q] = ratePercentToRational(taxaPct);     /* i = p/q */
  /* exponent E = trunc14(du/252) = floor(du·10^14/252) / 10^14 */
  const En = (BigInt(du) * 10n ** 14n) / 252n, Ed = 10n ** 14n;
  const [l1, l2] = lnOnePlus(p, q);
  const ylo = floorDiv(l1 * En, Ed), yhi = ceilDiv(l2 * En, Ed);
  const f = expInterval(ylo, yhi);
  factorCache.set(key, f);
  return f;
}
/* "14,36" → i = 1436/10000 (fraction of one); the rule's T-6 on the percent is applied (truncate past 6 decimals) */
function ratePercentToRational(s) {
  const t = String(s).trim().replace(',', '.');
  const m = /^(\d+)(?:\.(\d+))?$/.exec(t);
  if (!m) throw new Error('rate: not a decimal: ' + s);
  let frac = (m[2] || '').slice(0, 6);               /* T-6 on the percent */
  const digits = BigInt(m[1] + frac.padEnd(6, '0'));  /* percent × 10^6 */
  return [digits, 100n * 10n ** 6n];                 /* i = percent/100 */
}

/* decide a truncation at d decimals from an enclosure [lo, hi] at scale S: returns {ok, value (integer at 10^-d), marginLo, marginHi} */
function truncDecision(lo, hi, d) {
  const unit = 10n ** (P - BigInt(d));
  const a = floorDiv(lo, unit), b = floorDiv(hi, unit);
  if (a !== b) return { ok: false, lo: a, hi: b };
  return { ok: true, value: a, margin: [lo - a * unit, (a + 1n) * unit - hi] };   /* distances to the two boundaries, scale S */
}
/* round half up at d decimals, decided from an enclosure */
function roundDecision(lo, hi, d) {
  const unit = 10n ** (P - BigInt(d));
  const a = floorDiv(lo + unit / 2n, unit), b = floorDiv(hi + unit / 2n, unit);
  if (a !== b) return { ok: false, lo: a, hi: b };
  return { ok: true, value: a, margin: [lo + unit / 2n - a * unit, (a + 1n) * unit - (hi + unit / 2n)] };
}

/* ---- LTN ------------------------------------------------------------------------------------------- */
/* returns {verdictStep, pu6 (BigInt micro-reais) or null, enclosure [lo, hi] as strings at 1e-12, du, margin} */
function decideLTN(taxaPct, settleIso, maturityIso, cal) {
  const du = cal.du(settleIso, maturityIso);
  const [flo, fhi] = factor(taxaPct, du);
  const puLo = floorDiv(1000n * S * S, fhi), puHi = ceilDiv(1000n * S * S, flo);
  const t = truncDecision(puLo, puHi, 6);
  return { kind: 'LTN', du, enclosure: [fx(puLo, 12), fx(puHi, 12)], decided: t.ok, pu6: t.ok ? t.value : null,
    straddle: t.ok ? null : [t.lo.toString(), t.hi.toString()], margin: t.ok ? fxMargin(t.margin) : null };
}

/* ---- NTN-F ----------------------------------------------------------------------------------------- */
/* coupon dates: 1 Jan and 1 Jul back from maturity (which is 1 Jan or 1 Jul) while > settlement */
function couponDates(settleIso, maturityIso) {
  const out = []; let y = Number(maturityIso.slice(0, 4)), mth = Number(maturityIso.slice(5, 7));
  for (;;) {
    const iso = `${y}-${String(mth).padStart(2, '0')}-01`;
    if (iso <= settleIso) break;
    out.push(iso);
    mth -= 6; if (mth <= 0) { mth += 12; y -= 1; }
  }
  return out.reverse();
}
let COUPON5 = null;   /* 1000·(1.1^½ − 1) A-5, decided once: an integer at 10^-5 */
function coupon() {
  if (COUPON5) return COUPON5;
  /* sqrt(1.1) at scale S: isqrt(1.1 · S²) brackets */
  const r = isqrt(11n * S * S / 10n);
  const lo = r, hi = r + 1n;                          /* r² ≤ 1.1·S² < (r+1)² */
  const cLo = 1000n * (lo - S), cHi = 1000n * (hi - S);
  const d = roundDecision(cLo, cHi, 5);
  if (!d.ok) throw new Error('coupon: the A-5 rounding of 1000·(1.1^½ − 1) is not decided');
  COUPON5 = d.value;                                   /* expected 4880885 */
  return COUPON5;
}
function isqrt(n) { if (n < 2n) return n; let x = BigInt(Math.floor(Math.sqrt(Number(n)))); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) { while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; } x = y; } }

function decideNTNF(taxaPct, settleIso, maturityIso, cal) {
  const dates = couponDates(settleIso, maturityIso);
  const c5 = coupon();                                 /* at 10^-5 */
  const flows = []; let sum9 = 0n; let refused = null;
  for (let k = 0; k < dates.length; k++) {
    const du = cal.du(settleIso, dates[k]);
    const cash5 = c5 + (k === dates.length - 1 ? 1000n * 10n ** 5n : 0n);
    const [flo, fhi] = factor(taxaPct, du);
    /* PV = cash / factor; cash at 10^-5 → value·S = cash5·S·S / (10^5·f) */
    const pvLo = floorDiv(cash5 * S * S, fhi * 10n ** 5n), pvHi = ceilDiv(cash5 * S * S, flo * 10n ** 5n);
    const r = roundDecision(pvLo, pvHi, 9);
    if (!r.ok) { refused = { k, date: dates[k], du, straddle: [r.lo.toString(), r.hi.toString()] }; break; }
    sum9 += r.value;
    flows.push({ date: dates[k], du, cash: dec(cash5, 5), pv: dec(r.value, 9) });
  }
  if (refused) return { kind: 'NTN-F', decided: false, flows, refused };
  /* PU T-6 from the exact sum at 10^-9: truncate = floor division by 10^3 */
  const pu6 = sum9 / 1000n;
  return { kind: 'NTN-F', decided: true, pu6, flows, sum9: dec(sum9, 9), couponDates: dates.length };
}

/* ---- formatting ------------------------------------------------------------------------------------ */
function dec(intVal, d) { const neg = intVal < 0n; let s = (neg ? -intVal : intVal).toString().padStart(d + 1, '0'); return (neg ? '-' : '') + s.slice(0, -d) + '.' + s.slice(-d); }
function fx(v, d) { return dec(v / 10n ** (P - BigInt(d)), d); }
function fxMargin(m) { return [fx(m[0], 15), fx(m[1], 15)]; }
/* printed 2-decimal readings of a T-6 PU (micro-reais): TRUNC-2 and ROUND-2, as centavos */
const trunc2 = (pu6) => pu6 / 10000n;
const round2 = (pu6) => (pu6 + 5000n) / 10000n;

const PU_API = { calendar, decideLTN, decideNTNF, factor, lnOnePlus, expInterval, truncDecision, roundDecision, coupon, couponDates, dec, trunc2, round2, ratePercentToRational, P, S };
if (typeof module !== 'undefined' && module.exports) module.exports = PU_API;
else if (typeof globalThis !== 'undefined') globalThis.PU = PU_API;

/* ---- the calibration: the methodology's own worked examples ---------------------------------------- */
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs'), path = require('path');
  const ROOT = path.resolve(__dirname, '..', '..');
  const cal = calendar(JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'holidays.json'), 'utf8')));
  const ltn = decideLTN('14,3600', '2008-05-21', '2010-07-01', cal);
  console.log('LTN  du', ltn.du, 'PU T-6', ltn.decided ? dec(ltn.pu6, 6) : 'REFUSED', 'expected 532 · 753.315323', 'enclosure', ltn.enclosure.join(' .. '));
  const f = decideNTNF('13,6600', '2008-05-21', '2014-01-01', cal);
  console.log('NTN-F flows', f.flows.length, 'PU T-6', f.decided ? dec(f.pu6, 6) : 'REFUSED', 'expected 12 · 903.075616');
  for (const x of f.flows) console.log('  ', x.date, 'du', x.du, 'PV', x.pv);
  console.log('coupon A-5', dec(coupon(), 5), 'expected 48.80885');
  const okL = ltn.du === 532 && ltn.decided && dec(ltn.pu6, 6) === '753.315323';
  const okF = f.decided && dec(f.pu6, 6) === '903.075616' && f.flows.length === 12 && f.flows[0].du === 28 && f.flows[11].du === 1415;
  console.log(okL && okF ? 'CALIBRATION OK' : 'CALIBRATION FAILED');
  process.exit(okL && okF ? 0 : 1);
}
