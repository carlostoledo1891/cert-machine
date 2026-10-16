#!/usr/bin/env python3
"""decide.py — PU Verificado, the second implementation: the same rule, no shared code with decide.js.

Standard library only. Exact steps in fractions.Fraction; the irrational step (1 + taxa)^E as an enclosure built
from the decimal module at 60 digits — ln and exp there are correctly rounded (libmpdec), so each result widened
by one unit in the last place in each direction encloses the true value — with every other operation performed
in a ROUND_FLOOR context for the lower end and a ROUND_CEILING context for the upper end. A truncation or a
rounding is then decided from the two ends, or refused when they disagree.

usage: python3 -I instruments/pu/decide.py                 the methodology's worked examples (calibration)
       python3 -I instruments/pu/decide.py --batch < cases.json   [{kind, taxa, settle, maturity}] → [{pu6}]
"""
import sys, json, datetime as dt
from fractions import Fraction
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_DOWN, ROUND_HALF_UP, localcontext
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREC = 60
LO = Context(prec=PREC, rounding=ROUND_FLOOR)
HI = Context(prec=PREC, rounding=ROUND_CEILING)


# ---- calendar -------------------------------------------------------------------------------------------
class Calendar:
    def __init__(self, holidays):
        self.h = set(holidays)

    def is_biz(self, d):
        return d.weekday() < 5 and d.isoformat() not in self.h

    def next_biz(self, d):
        d = d + dt.timedelta(days=1)
        while not self.is_biz(d):
            d += dt.timedelta(days=1)
        return d

    def du(self, a, b):
        """business days in [a, b) — a difference of two cumulative counts (2000-01-01 .. 2075-12-31)"""
        if b < a:
            raise ValueError('du: payment before settlement')
        if not hasattr(self, '_cum'):
            cum, n, d, end = {}, 0, dt.date(2000, 1, 1), dt.date(2075, 12, 31)
            while d <= end:
                cum[d] = n
                if self.is_biz(d):
                    n += 1
                d += dt.timedelta(days=1)
            self._cum = cum
        return self._cum[b] - self._cum[a]


def iso(s):
    return dt.date.fromisoformat(s)


# ---- the enclosure of (1 + i)^E ------------------------------------------------------------------------
def ulp(x):
    """one unit in the last place of a 60-digit Decimal, as a positive Decimal"""
    return Decimal(1).scaleb(x.adjusted() - PREC + 1)


def factor_enclosure(i: Fraction, E: Fraction):
    """[lo, hi] Decimals with lo <= (1+i)^E <= hi"""
    one_plus_lo = LO.add(Decimal(1), LO.divide(Decimal(i.numerator), Decimal(i.denominator)))
    one_plus_hi = HI.add(Decimal(1), HI.divide(Decimal(i.numerator), Decimal(i.denominator)))
    ln_lo = LO.ln(one_plus_lo)
    ln_lo = LO.subtract(ln_lo, ulp(ln_lo))
    ln_hi = HI.ln(one_plus_hi)
    ln_hi = HI.add(ln_hi, ulp(ln_hi))
    e_lo = LO.divide(Decimal(E.numerator), Decimal(E.denominator))
    e_hi = HI.divide(Decimal(E.numerator), Decimal(E.denominator))
    y_lo = LO.multiply(ln_lo, e_lo)
    y_hi = HI.multiply(ln_hi, e_hi)
    f_lo = LO.exp(y_lo)
    f_lo = LO.subtract(f_lo, ulp(f_lo))
    f_hi = HI.exp(y_hi)
    f_hi = HI.add(f_hi, ulp(f_hi))
    return f_lo, f_hi


def rate_fraction(taxa_pct: str) -> Fraction:
    t = taxa_pct.strip().replace(',', '.')
    whole, _, frac = t.partition('.')
    frac = frac[:6]                                   # T-6 on the percent
    pct = Fraction(int(whole + frac.ljust(6, '0')), 10 ** 6)
    return pct / 100


def exponent(du: int) -> Fraction:
    return Fraction((du * 10 ** 14) // 252, 10 ** 14)   # T-14


def decide_trunc(lo: Decimal, hi: Decimal, d: int):
    q = Decimal(1).scaleb(-d)
    a = lo.quantize(q, rounding=ROUND_DOWN)
    b = hi.quantize(q, rounding=ROUND_DOWN)
    return (a if a == b else None)


def decide_round(lo: Decimal, hi: Decimal, d: int):
    q = Decimal(1).scaleb(-d)
    a = lo.quantize(q, rounding=ROUND_HALF_UP)
    b = hi.quantize(q, rounding=ROUND_HALF_UP)
    return (a if a == b else None)


# ---- LTN ------------------------------------------------------------------------------------------------
def decide_ltn(taxa: str, settle: str, maturity: str, cal: Calendar):
    du = cal.du(iso(settle), iso(maturity))
    f_lo, f_hi = factor_enclosure(rate_fraction(taxa), exponent(du))
    pu_lo = LO.divide(Decimal(1000), f_hi)
    pu_hi = HI.divide(Decimal(1000), f_lo)
    pu6 = decide_trunc(pu_lo, pu_hi, 6)
    return {'du': du, 'pu6': None if pu6 is None else format(pu6, 'f')}


# ---- NTN-F ----------------------------------------------------------------------------------------------
def coupon5():
    with localcontext(Context(prec=PREC, rounding=ROUND_FLOOR)) as c:
        s_lo = c.sqrt(Decimal('1.1'))
        s_lo = c.subtract(s_lo, ulp(s_lo))
    with localcontext(Context(prec=PREC, rounding=ROUND_CEILING)) as c:
        s_hi = c.sqrt(Decimal('1.1'))
        s_hi = c.add(s_hi, ulp(s_hi))
    c_lo = LO.multiply(Decimal(1000), LO.subtract(s_lo, Decimal(1)))
    c_hi = HI.multiply(Decimal(1000), HI.subtract(s_hi, Decimal(1)))
    c = decide_round(c_lo, c_hi, 5)
    if c is None:
        raise RuntimeError('coupon A-5 not decided')
    return c


def coupon_dates(settle: dt.date, maturity: dt.date):
    out = []
    y, m = maturity.year, maturity.month
    while True:
        d = dt.date(y, m, 1)
        if d <= settle:
            break
        out.append(d)
        m -= 6
        if m <= 0:
            m += 12
            y -= 1
    return list(reversed(out))


def decide_ntnf(taxa: str, settle: str, maturity: str, cal: Calendar):
    s, mty = iso(settle), iso(maturity)
    dates = coupon_dates(s, mty)
    c = coupon5()
    i = rate_fraction(taxa)
    total = Decimal(0)
    flows = []
    for k, d in enumerate(dates):
        du = cal.du(s, d)
        cash = c + (Decimal(1000) if k == len(dates) - 1 else Decimal(0))
        f_lo, f_hi = factor_enclosure(i, exponent(du))
        pv_lo = LO.divide(cash, f_hi)
        pv_hi = HI.divide(cash, f_lo)
        pv = decide_round(pv_lo, pv_hi, 9)
        if pv is None:
            return {'pu6': None, 'refused_at': d.isoformat(), 'flows': flows}
        total += pv                                  # exact: both are 9-decimal Decimals, prec 60 suffices
        flows.append({'date': d.isoformat(), 'du': du, 'pv': format(pv, 'f')})
    pu6 = total.quantize(Decimal('0.000001'), rounding=ROUND_DOWN)
    return {'pu6': format(pu6, 'f'), 'flows': flows}


def load_calendar():
    h = json.loads((ROOT / 'corpus' / 'pu' / 'holidays.json').read_text(encoding='utf-8'))
    return Calendar(h['holidays'])


def main():
    cal = load_calendar()
    if '--batch' in sys.argv:
        cases = json.load(sys.stdin)
        out = []
        for c in cases:
            r = decide_ltn(c['taxa'], c['settle'], c['maturity'], cal) if c['kind'] == 'LTN' else decide_ntnf(c['taxa'], c['settle'], c['maturity'], cal)
            out.append({'pu6': r['pu6']})
        json.dump(out, sys.stdout)
        return
    a = decide_ltn('14,3600', '2008-05-21', '2010-07-01', cal)
    b = decide_ntnf('13,6600', '2008-05-21', '2014-01-01', cal)
    print('LTN  du', a['du'], 'PU', a['pu6'], 'expected 532 · 753.315323')
    print('NTN-F PU', b['pu6'], 'flows', len(b['flows']), 'expected 903.075616 · 12')
    for f in b['flows']:
        print('  ', f['date'], 'du', f['du'], 'PV', f['pv'])
    ok = a['du'] == 532 and a['pu6'] == '753.315323' and b['pu6'] == '903.075616' and len(b['flows']) == 12 and b['flows'][0]['du'] == 28
    print('CALIBRATION OK' if ok else 'CALIBRATION FAILED')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
