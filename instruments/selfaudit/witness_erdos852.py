#!/usr/bin/env python3
"""witness_erdos852.py — the self-audit's WITNESS for the erdos852 family: Python standard library, no code from this
repository (nothing shared with instruments/erdos852 or tools/verify_erdos852.py). It encloses

    C* = (1/2) (prod_{p >= 3 prime} (1 + 1/(p-1)^3) - 1)

on its own: the partial product over the odd primes up to L = 4,000,000 in decimal arithmetic at 40 digits with the
rounding directed down for the lower end and up for the upper end (each factor 1 + 1/(p-1)^3 rounded the same way),
the tail multiplier bounded by 1 <= T <= 1 + S + S^2 with S = sum_{p > L} 1/(p-1)^3 <= 1/(2(L-1)^2) (valid for S <= 1/2).
A claimed decimal v with k places is FALSE when the enclosure is disjoint from the union of its two windows
[v - 10^-k/2, v + 10^-k) — exactly compared in Fractions; a string that is not "int.frac" is malformed.

usage: python3 -I witness_erdos852.py items.json     items: [{"id", "digits"}, …]
prints a JSON list: {"id", "malformed", "reason"?, "violated", "violation": {…} | null}"""
import json
import re
import sys
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING
from fractions import Fraction

L = 4000000
PREC = 40


def odd_primes(limit):
    sieve = bytearray([1]) * (limit + 1)
    sieve[0] = sieve[1] = 0
    for i in range(2, int(limit ** 0.5) + 1):
        if sieve[i]:
            sieve[i * i::i] = bytearray(len(sieve[i * i::i]))
    return [p for p in range(3, limit + 1) if sieve[p]]


def enclose():
    down = Context(prec=PREC, rounding=ROUND_FLOOR)
    up = Context(prec=PREC, rounding=ROUND_CEILING)
    lo = Decimal(1)
    hi = Decimal(1)
    for p in odd_primes(L):
        q3 = (p - 1) ** 3
        lo = down.multiply(lo, down.add(Decimal(1), down.divide(Decimal(1), Decimal(q3))))
        hi = up.multiply(hi, up.add(Decimal(1), up.divide(Decimal(1), Decimal(q3))))
    S = Fraction(1, 2 * (L - 1) ** 2)
    tail = 1 + S + S * S
    lo_f = (Fraction(lo) - 1) / 2
    hi_f = (Fraction(hi) * tail - 1) / 2
    return lo_f, hi_f


def main():
    items = json.load(open(sys.argv[1]))
    lo, hi = enclose()
    out = []
    for it in items:
        s = it.get('digits')
        m = re.match(r'^(\d+)\.(\d+)$', s) if isinstance(s, str) else None
        if not m:
            out.append({'id': it.get('id'), 'malformed': True, 'reason': 'not a decimal string "int.frac": %r' % (s,), 'violated': None, 'violation': None})
            continue
        k = len(m.group(2))
        num = int(m.group(1) + m.group(2))
        den = 10 ** k
        win_lo = Fraction(2 * num - 1, 2 * den)
        win_hi = Fraction(num + 1, den)
        disjoint = hi < win_lo or lo > win_hi
        out.append({'id': it['id'], 'malformed': False, 'violated': bool(disjoint),
                    'violation': {'claim': s, 'window': [str(win_lo), str(win_hi)], 'enclosure': [str(Decimal(lo.numerator) / Decimal(lo.denominator)), str(Decimal(hi.numerator) / Decimal(hi.denominator))], 'side': 'the enclosure lies entirely above the window' if lo > win_hi else 'the enclosure lies entirely below the window'} if disjoint else None})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
