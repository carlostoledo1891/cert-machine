#!/usr/bin/env python3
"""floatcheck_erdos852.py — the self-audit's CONVENTIONAL CHECK (M5) for the erdos852 family: double precision, no
exact arithmetic, a tolerance τ. C* is computed as the naive float product over the odd primes up to 4,000,000 —
the mechanism that produced the published value (1 + 1/(p-1)^3 rounds to 1.0 once (p-1)^3 >= 2^53, so the product
self-truncates) — and a claimed decimal is ACCEPTED at τ when |float value − float(claim)| <= τ. Python standard
library only; shares nothing with the deciders. It measures a tolerance, not a named grader.

usage: python3 -I floatcheck_erdos852.py items.json   items: [{"id", "digits"}, …]
prints a JSON list: {"id", "floatValue", "difference", "accept": {"1e-6": bool, "1e-9": bool, "1e-12": bool}} — or {"id", "error"}"""
import json
import sys

TAUS = [('1e-6', 1e-6), ('1e-9', 1e-9), ('1e-12', 1e-12)]
L = 4000000


def odd_primes(limit):
    sieve = bytearray([1]) * (limit + 1)
    sieve[0] = sieve[1] = 0
    for i in range(2, int(limit ** 0.5) + 1):
        if sieve[i]:
            sieve[i * i::i] = bytearray(len(sieve[i * i::i]))
    return [p for p in range(3, limit + 1) if sieve[p]]


def main():
    items = json.load(open(sys.argv[1]))
    prod = 1.0
    for p in odd_primes(L):
        prod *= 1.0 + 1.0 / float((p - 1) ** 3)
    value = (prod - 1.0) / 2.0
    out = []
    for it in items:
        try:
            v = float(it['digits'])
            d = abs(value - v)
            out.append({'id': it['id'], 'floatValue': repr(value), 'difference': d, 'accept': {name: bool(d <= tau) for name, tau in TAUS}})
        except Exception as e:
            out.append({'id': it.get('id'), 'error': str(e)[:200], 'accept': {name: False for name, _ in TAUS}})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
