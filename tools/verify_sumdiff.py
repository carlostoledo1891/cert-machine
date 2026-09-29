#!/usr/bin/env python3
"""verify_sumdiff.py — independent verification of entropy lower bounds for the sum-difference
constants C3b and C3c, using NOTHING but the Python standard library (fractions, decimal).

A certificate is a law mu on Z^2: finitely many points with positive rational weights summing to
exactly 1. With H_L the Shannon entropy (natural log) of the pushforward of mu under the linear form L,

    C3b >= H(X-Y) / max(H(X), H(Y), H(X+Y))
    C3c >= H(X-Y) / max(H(X), H(Y), H(X+Y), H(X+2Y))

so one law certifies a lower bound. This script re-derives the bound from the certificate's integers:
the pushforwards in exact Fractions; each p in an interval [p_lo, p_hi] of Decimals rounded outward;
ln by decimal's ln, which the standard CORRECTLY ROUNDS, widened by one unit in the last place each
way so the true logarithm is inside; every product, sum and quotient rounded outward (ROUND_FLOOR for
a lower end, ROUND_CEILING for an upper one). A claim "C >= c" is CERTIFIED when the lower end of the
ratio exceeds c, REFUTED when the upper end is below it, and UNDECIDED otherwise.

It shares no code with instruments/sumdiff (JavaScript, BigInt and dyadic intervals) nor with the
claimants' checkers (mpmath). It re-checks itself: a RED CONTROL claims a bound one unit above the
certified ratio at the 17th significant digit, which a comparison in doubles cannot see, and requires
REFUTED.

usage: python3 verify_sumdiff.py [corpus/optimization-constants]
exit 0 iff every stated claim is CERTIFIED and the red control is REFUTED."""

import hashlib
import json
import os
import re
import sys
from collections import defaultdict
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, setcontext

# every operation below names its context; main() makes the default one unusable, so none can round silently
# (done in main, not at import: a module that imports these functions keeps its own default context)
from fractions import Fraction

PREC = 120
DOWN = Context(prec=PREC, rounding=ROUND_FLOOR)
UP = Context(prec=PREC, rounding=ROUND_CEILING)
LN = Context(prec=PREC)            # ln is correctly rounded (half-even) in this context
FORMS = {'3b': [(1, 0), (0, 1), (1, 1)], '3c': [(1, 0), (0, 1), (1, 1), (1, 2)]}


def read(path):
    """the three encodings on disk; integers of any length (json keeps Python ints exact)"""
    d = json.load(open(path))
    prob = re.sub(r'^c_?', '', str(d['problem']).lower())
    if prob not in FORMS:
        raise ValueError('REFUSED: not a 3b or 3c certificate')
    if 'weights' in d:
        mu = {(w['x'], w['y']): Fraction(int(w['num']), int(w['den'])) for w in d['weights']}
    elif 'distribution_x_y_numden' in d:
        mu = {(x, y): Fraction(int(n), int(q)) for x, y, (n, q) in d['distribution_x_y_numden']}
    else:
        den = 10 ** int(re.fullmatch(r'10\^(\d+)', d['denominator']).group(1))
        mu = {(x, y): Fraction(int(n), den) for x, y, n in d['distribution_x_y_num']}
    if any(w <= 0 for w in mu.values()) or sum(mu.values()) != 1:
        raise ValueError('REFUSED: the weights are not a probability law')
    return prob, mu


def outward(q):
    """a Fraction as [lo, hi] Decimals"""
    return DOWN.divide(Decimal(q.numerator), Decimal(q.denominator)), UP.divide(Decimal(q.numerator), Decimal(q.denominator))


def ln_out(x_lo, x_hi):
    """[lo, hi] enclosing ln on [x_lo, x_hi]: correctly rounded ln at each end, one ulp outward"""
    return LN.next_minus(LN.ln(x_lo)), LN.next_plus(LN.ln(x_hi))


def entropy(mu, form):
    a, b = form
    g = defaultdict(Fraction)
    for (x, y), w in mu.items():
        g[a * x + b * y] += w
    lo, hi = Decimal(0), Decimal(0)
    for q in g.values():
        p_lo, p_hi = outward(q)
        l_lo, l_hi = ln_out(p_lo, p_hi)          # both negative: -p ln p = p * (-ln p) >= 0
        # copy_negate is exact; unary minus would round to the DEFAULT context's 28 digits
        lo = DOWN.add(lo, DOWN.multiply(p_lo, l_hi.copy_negate()))
        hi = UP.add(hi, UP.multiply(p_hi, l_lo.copy_negate()))
    return lo, hi


def ratio(prob, mu):
    t_lo, t_hi = entropy(mu, (1, -1))
    hs = [entropy(mu, f) for f in FORMS[prob]]
    m_lo, m_hi = max(h[0] for h in hs), max(h[1] for h in hs)
    return DOWN.divide(t_lo, m_hi), UP.divide(t_hi, m_lo)


def decide(r, claim):
    c = Decimal(claim)
    if r[0] > c:
        return 'CERTIFIED'
    if r[1] < c:
        return 'REFUTED'
    return 'UNDECIDED'


CLAIMS = [
    ('mi2026/c3b_pr92/certificate_3b_13pt.json', '1.77898884', 'the registry\'s C3b >= 1.77898884*'),
    ('mi2026/c3c_pr93/certificate_3c_v3_95pt.json', '1.674733895020824993378207577602265184970', 'the superseded 95-point C3c bound'),
    ('l2026/certificate_3c_147pt.json', '1.6747338950414058', 'the registry\'s C3c >= 1.6747338950414058*'),
    ('l2026/certificate_3c_147pt.json', '1.674733895041405870063135756722213999136383713818148696811828', 'the 147-point certificate\'s 60-digit bound'),
]


def main():
    setcontext(Context(prec=1, traps=[]))
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'corpus', 'optimization-constants')
    good = True
    cache = {}
    for f, claim, what in CLAIMS:
        path = os.path.join(root, f)
        h = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        if f not in cache:
            prob, mu = read(path)
            cache[f] = (prob, mu, ratio(prob, mu))
        prob, mu, r = cache[f]
        v = decide(r, claim)
        good &= v == 'CERTIFIED'
        print('%-9s  C%s >= %s  (%s; %d points; sha256 %s…)\n           ratio in [%s, %s]' % (v, prob, claim, what, len(mu), h[:12], str(r[0])[:44], str(r[1])[:44]))
    # RED CONTROL: one unit above the certified ratio at the 17th significant digit — the same double as the true bound
    r = cache['l2026/certificate_3c_147pt.json'][2]
    v = decide(r, '1.6747338950414059')
    fired = v == 'REFUTED'
    print('%s  RED control: C3c >= 1.6747338950414059 (false; as a double it equals the true bound) -> %s' % ('fired' if fired else 'DID NOT FIRE', v))
    return 0 if good and fired else 1


if __name__ == '__main__':
    sys.exit(main())
