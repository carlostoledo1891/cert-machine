#!/usr/bin/env python3
"""instruments/optq/ivdec.py — rigorous enclosures in the standard library's decimal module, for the two #226 interval
bounds (bgw16a.py, rbm70a.py). Nothing here is shared with any claimant.

- π as an interval: Machin's formula in integer arithmetic; each atan(1/x) series is alternating with decreasing terms,
  so the omitted tail is below the first omitted term (< 1 unit at the working scale) and every floor is off by < 1 unit.
- directed-rounding contexts (ROUND_FLOOR / ROUND_CEILING) for +, −, ×, ÷ on positive operands — the decimal module
  rounds every result in the direction the context names;
- ln and exp: the decimal module's Decimal.ln() and Decimal.exp() are documented as CORRECTLY ROUNDED (ROUND_HALF_EVEN), so
  the true value lies within one unit in the last place of the result — the enclosure is [next_minus, next_plus].
"""
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN

EMAX, EMIN = 10 ** 9, -10 ** 9  # far wider than any quantity here (κ_300000 ≈ 10^-636000)


def contexts(prec):
    k = dict(prec=prec, Emax=EMAX, Emin=EMIN)
    return Context(rounding=ROUND_FLOOR, **k), Context(rounding=ROUND_CEILING, **k), Context(rounding=ROUND_HALF_EVEN, **k)


def _atan_inv_scaled(x, S):
    """integer (lo, hi) with lo <= S·atan(1/x) <= hi."""
    lo = hi = 0; k = 0; p = x
    while True:
        t = S // (p * (2 * k + 1))
        if t == 0: break
        if k % 2 == 0: lo += t; hi += t + 1
        else: lo -= t + 1; hi -= t
        k += 1; p *= x * x
    return lo - 1, hi + 1  # the omitted alternating tail is below one unit


def pi_iv(digits):
    """(lo, hi) Decimals enclosing π, exact at `digits` + 10 places (no rounding in the conversion)."""
    e = digits + 10; S = 10 ** e
    a5, a239 = _atan_inv_scaled(5, S), _atan_inv_scaled(239, S)
    lo, hi = 16 * a5[0] - 4 * a239[1], 16 * a5[1] - 4 * a239[0]
    big = Context(prec=e + 20, Emax=EMAX, Emin=EMIN)
    return big.scaleb(Decimal(lo), -e), big.scaleb(Decimal(hi), -e)


def ln_iv(x_lo, x_hi, even):
    """enclosure of ln over [x_lo, x_hi], 0 < x_lo <= x_hi: ln is increasing; each endpoint ±1 ulp."""
    return even.ln(x_lo).next_minus(even), even.ln(x_hi).next_plus(even)


def exp_iv(x_lo, x_hi, even):
    return even.exp(x_lo).next_minus(even), even.exp(x_hi).next_plus(even)


def sqrt_iv(x_lo, x_hi, even):
    """Decimal.sqrt() is correctly rounded as well."""
    return even.sqrt(x_lo).next_minus(even), even.sqrt(x_hi).next_plus(even)


def frac_iv(num, den, down, up):
    """(lo, hi) Decimals enclosing the rational num/den > 0."""
    return down.divide(Decimal(num), Decimal(den)), up.divide(Decimal(num), Decimal(den))


def verdict(lo, hi, claimed, direction='>='):
    """the grammar: a lower-bound claim 'C >= claimed' is CERTIFIED when the whole enclosure of the exhibited value lies at or
    above claimed, REFUTED when it lies wholly below, REFUSED when the enclosure straddles it."""
    if direction != '>=': raise ValueError('only lower bounds are decided here')
    if lo >= claimed: return 'CERTIFIED'
    if hi < claimed: return 'REFUTED'
    return 'REFUSED'
