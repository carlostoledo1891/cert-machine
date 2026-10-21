#!/usr/bin/env python3
"""witness_entropy.py — the self-audit's WITNESS for the entropy family: Python standard library, exact Fractions and
directed-rounding Decimal, no code from the deciders under test (instruments/sumdiff/sumdiff.js, a JavaScript program;
instruments/fei/fei.py). For the sum–difference certificates it uses tools/verify_sumdiff.py — the standard-library
verifier that shares nothing with the JavaScript decider — for the door and the entropies; for the truth table it
encloses the ratio H/(I − 1) on its own: the table from the hex, the Walsh–Hadamard transform in integers, the influence
exact, the entropy H = Σ w_S log2(1/w_S) grouped by |a_S| with log2 through ln in a 60-digit context widened one unit in
the last place at every step. A bar is VIOLATED (the claim C ≥ bar is false) when the ratio's upper end lies below it.

usage: python3 -I witness_entropy.py items.json      items: [{"id", "kind": "sumdiff"|"fei", "claim", "cert"|"art"}, …]
prints a JSON list: {"id", "malformed", "reason"?, "violated", "violation": {…} | null, "exact": [lo, hi]}"""
import json
import os
import sys
import tempfile
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING
from fractions import Fraction

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import verify_sumdiff as V  # noqa: E402  (standard library; no code shared with the JavaScript decider)

DN = Context(prec=60, rounding=ROUND_FLOOR)
UP = Context(prec=60, rounding=ROUND_CEILING)


def sumdiff(it):
    tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False)
    json.dump(it['cert'], tmp)
    tmp.close()
    try:
        prob, mu = V.read(tmp.name)
    except ValueError as e:
        return {'malformed': True, 'reason': str(e)[:160]}
    finally:
        os.unlink(tmp.name)
    lo, hi = V.ratio(prob, mu)
    bar = Decimal(it['claim'])
    violated = hi < bar
    return {'malformed': False, 'violated': bool(violated), 'violation': {'kind': 'the ratio lies below the bar', 'ratioHi': str(hi)[:50], 'bar': it['claim']} if violated else None, 'exact': [str(lo)[:50], str(hi)[:50]]}


def wht(t):
    a = list(t)
    h = 1
    n = len(a)
    while h < n:
        for i in range(0, n, 2 * h):
            for j in range(i, i + h):
                x, y = a[j], a[j + h]
                a[j], a[j + h] = x + y, x - y
        h *= 2
    return a


def ln_iv(k):
    c = Context(prec=60)
    v = c.ln(Decimal(k))
    return DN.next_minus(v), UP.next_plus(v)


def fei(it):
    art = it['art']
    try:
        n = int(art['n'])
        hx = str(art['true_hex'])
        full = int(hx, 16)
        if full < 0 or full >> (1 << n):
            return {'malformed': True, 'reason': 'a bit at or beyond 2^%d' % n}
    except (KeyError, TypeError, ValueError) as e:
        return {'malformed': True, 'reason': 'unreadable: %s' % e}
    N = 1 << n
    t = [-1 if (full >> x) & 1 else 1 for x in range(N)]
    a = wht(t)
    N4 = 4 ** n
    if a[0] != 0:
        return {'malformed': False, 'violated': True, 'violation': {'kind': 'not balanced: fhat(empty) = %s' % Fraction(a[0], N)}, 'exact': None}
    I = Fraction(sum(v * v * bin(S).count('1') for S, v in enumerate(a)), N4)
    if I <= 1:
        return {'malformed': False, 'violated': True, 'violation': {'kind': 'I <= 1: the amplification rule does not apply'}, 'exact': None}
    counts = {}
    for v in a:
        if v:
            counts[abs(v)] = counts.get(abs(v), 0) + 1
    ln2_lo, ln2_hi = ln_iv(2)
    H_lo = H_hi = Decimal(0)
    for k, cnt in counts.items():
        w = Fraction(cnt * k * k, N4)
        w_lo = DN.divide(Decimal(w.numerator), Decimal(w.denominator))
        w_hi = UP.divide(Decimal(w.numerator), Decimal(w.denominator))
        # log2(1/w_k) = 2n - 2 log2 k, log2 k = ln k / ln 2 (exact when k is a power of two: ln k = v ln 2 — handled by the
        # same enclosure, which is tight enough at 60 digits for a bar of 42)
        if k == 1:
            l_lo = l_hi = Decimal(0)
        else:
            lk_lo, lk_hi = ln_iv(k)
            l_lo, l_hi = DN.divide(lk_lo, ln2_hi), UP.divide(lk_hi, ln2_lo)
        term_lo = DN.subtract(Decimal(2 * n), UP.multiply(Decimal(2), l_hi))
        term_hi = UP.subtract(Decimal(2 * n), DN.multiply(Decimal(2), l_lo))
        if term_lo < 0:
            term_lo = Decimal(0)
        H_lo = DN.add(H_lo, DN.multiply(w_lo, term_lo))
        H_hi = UP.add(H_hi, UP.multiply(w_hi, term_hi))
    den = I - 1
    r_lo = DN.divide(DN.multiply(H_lo, Decimal(den.denominator)), Decimal(den.numerator))
    r_hi = UP.divide(UP.multiply(H_hi, Decimal(den.denominator)), Decimal(den.numerator))
    bar = Decimal(it['claim'])
    violated = r_hi <= bar
    return {'malformed': False, 'violated': bool(violated), 'violation': {'kind': 'the ratio lies at or below the bar', 'ratioHi': str(r_hi)[:50], 'bar': it['claim']} if violated else None, 'exact': [str(r_lo)[:50], str(r_hi)[:50]]}


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            r = sumdiff(it) if it['kind'] == 'sumdiff' else fei(it)
        except Exception as e:  # noqa: BLE001 — a malformed item is reported, never guessed at
            r = {'malformed': True, 'reason': 'unreadable: %s' % str(e)[:160]}
        r['id'] = it.get('id')
        if r.get('malformed'):
            r.setdefault('violated', None)
            r.setdefault('violation', None)
        out.append(r)
    print(json.dumps(out))


if __name__ == '__main__':
    main()
