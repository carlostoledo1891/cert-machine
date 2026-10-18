#!/usr/bin/env python3
"""verify_twolaw.py — the two-law entropy certificate for C3c (Jaswal, doi:10.5281/zenodo.23289305), re-decided with
NOTHING but the Python standard library: the second implementation beside instruments/optq/twolaw.js (JavaScript,
BigInt and dyadic intervals), sharing no code with it or with the claimant's checkers (python-flint, PARI/GP).

THE CONSTRUCTION, as the certificate states it: n = a + b independent digits (x_i, y_i), a of them with law A and b with
law B, and (X, Y) = sum_i base^i (x_i, y_i). For a linear form L, L(X, Y) = sum_i base^i L(x_i, y_i). When every value of
L on both supports lies in [-(base-1)/2, (base-1)/2], that is a balanced base-`base` expansion, which is unique, so the
digits are a function of L(X, Y) and H(L(X, Y)) = a H_A(L) + b H_B(L) exactly. Then

    C3c >= H(X-Y) / max(H(X), H(Y), H(X+Y), H(X+2Y))

with each H enclosed from the integer weights: pushforwards in exact Fractions, -p ln p outward at 120 digits — the
entropy routine of tools/verify_sumdiff.py, imported, not copied — and the counts multiplied in exactly before the
quotient is rounded outward. A claim is CERTIFIED when the lower end of the ratio exceeds it.

RED CONTROLS, which must fire: the smallest 30-digit claim above the ratio's upper end must be REFUTED; the same digits in base 53, where (53-1)/2 = 26 < 27, must be REFUSED for want of injectivity; a weight moved by
one unit in its last place must be REFUSED (the law no longer sums to 1).

usage: python3 tools/verify_twolaw.py [certificate.json]
exit 0 iff the stated claim is CERTIFIED and every red control fires."""

import hashlib
import json
import os
import sys
from decimal import Context, Decimal, setcontext
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_sumdiff as V  # noqa: E402  the standard-library entropy enclosure (DOWN/UP contexts, 120 digits)

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CERT = os.path.join(ROOT, 'corpus', 'optconst-queue', 'sources', 'zenodo-23289305', 'certificate.json')
PINS = os.path.join(ROOT, 'corpus', 'optconst-queue', 'PINS.json')
NUM = (1, -1)
DEN = [(1, 0), (0, 1), (1, 1), (1, 2)]          # X, Y, X+Y, X+2Y — registry 3c


def laws(cert):
    out = []
    for law in cert['laws']:
        mu = {}
        for (x, y), (n, d) in zip(law['points'], law['weights']):
            mu[(x, y)] = mu.get((x, y), Fraction(0)) + Fraction(int(n), int(d))
        if len(mu) != len(law['points']):
            raise ValueError('REFUSED: a point is listed twice')
        if any(w <= 0 for w in mu.values()) or sum(mu.values()) != 1:
            raise ValueError('REFUSED: a law is not a probability law')
        out.append(mu)
    return out


def decide(cert):
    base, counts, mus = int(cert['base']), [int(c) for c in cert['counts']], laws(cert)
    if len(counts) != len(mus) or any(c <= 0 for c in counts):
        raise ValueError('REFUSED: one positive count per law is needed')
    half = (base - 1) // 2
    widest = max(abs(a * x + b * y) for mu in mus for (x, y) in mu for (a, b) in [NUM] + DEN)
    if widest > half:
        raise ValueError('REFUSED: a form reaches %d on a support, past (base-1)/2 = %d — the digit map need not be injective' % (widest, half))

    def total(form):            # a·H_A(L) + b·H_B(L), every product and sum outward
        lo, hi = Decimal(0), Decimal(0)
        for c, mu in zip(counts, mus):
            h_lo, h_hi = V.entropy(mu, form)
            lo = V.DOWN.add(lo, V.DOWN.multiply(Decimal(c), h_lo))
            hi = V.UP.add(hi, V.UP.multiply(Decimal(c), h_hi))
        return lo, hi
    t = total(NUM)
    hs = [total(f) for f in DEN]
    m_lo, m_hi = max(h[0] for h in hs), max(h[1] for h in hs)
    return {'ratio': (V.DOWN.divide(t[0], m_hi), V.UP.divide(t[1], m_lo)), 'widest': widest, 'half': half,
            'points': [len(mu) for mu in mus], 'counts': counts}


def main():
    setcontext(Context(prec=1, traps=[]))       # as verify_sumdiff: no operation may round in the default context
    path = sys.argv[1] if len(sys.argv) > 1 else CERT
    raw = open(path, 'rb').read()
    h = hashlib.sha256(raw).hexdigest()
    if path == CERT:
        pinned = json.load(open(PINS))['pins']['zenodo-23289305/certificate.json']
        if h != pinned:
            print('REFUSED  the certificate is not the pinned file (%s… ≠ %s…)' % (h[:12], pinned[:12]))
            return 1
    cert = json.loads(raw)
    num, den = (int(v) for v in cert['claimed_lower_bound'])
    claim = V.DOWN.divide(Decimal(num), Decimal(den))
    if Fraction(num, den) != Fraction(str(claim)):
        print('REFUSED  the claim %d/%d is not a terminating decimal at 120 digits' % (num, den))
        return 1
    r = decide(cert)
    v = V.decide(r['ratio'], str(claim))
    print('%-9s  C3c >= %s  (two laws on %s points, counts %s, base %d; max |form| %d <= %d; sha256 %s…)\n'
          '           ratio in [%s, %s]' % (v, claim, ' and '.join(map(str, r['points'])), ' : '.join(map(str, r['counts'])),
                                            int(cert['base']), r['widest'], r['half'], h[:12], str(r['ratio'][0])[:44], str(r['ratio'][1])[:44]))
    reds = []
    c30 = Context(prec=30, rounding='ROUND_FLOOR')
    above = c30.next_plus(c30.plus(r['ratio'][1]))       # the smallest 30-digit number above the ratio's upper end
    reds.append(('the smallest 30-digit claim above the ratio (%s) is REFUTED' % above, V.decide(r['ratio'], str(above)) == 'REFUTED'))
    try:
        decide(dict(cert, base=53)); reds.append(('base 53 (half 26 < 27) is REFUSED for injectivity', False))
    except ValueError as e:
        reds.append(('base 53 (half 26 < 27) is REFUSED for injectivity', 'injective' in str(e)))
    bent = json.loads(raw)
    n0, d0 = bent['laws'][0]['weights'][0]
    bent['laws'][0]['weights'][0] = [int(n0) + 1, int(d0)]
    try:
        decide(bent); reds.append(('a weight one unit off is REFUSED (the law no longer sums to 1)', False))
    except ValueError as e:
        reds.append(('a weight one unit off is REFUSED (the law no longer sums to 1)', 'probability law' in str(e)))
    for what, fired in reds:
        print('%s  RED control: %s' % ('fired' if fired else 'DID NOT FIRE', what))
    return 0 if v == 'CERTIFIED' and all(f for _, f in reds) else 1


if __name__ == '__main__':
    sys.exit(main())
