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

THE DOOR. read() refuses, naming the reason, a certificate in no known encoding, a problem other than
3b or 3c, a coordinate or weight that is not an exact integer (a JSON float such as 1.9 or 0.5, or a
boolean — never truncated by int()), a weight or denominator that is not positive, a point listed
twice, weights that do not sum to exactly 1, and a law with one point (every entropy is then 0 and the
ratio 0/0). ratio() refuses again when the maximum entropy is not separated from 0, and entropy()
refuses an atom outside (0, 1], where its lower end p_lo * (-ln_hi) would not hold. A refusal is a
ValueError beginning "REFUSED".

THE PRINTOUT. Each ratio is printed to 42 decimal places with its lower end rounded down and its upper
end rounded up, so the printed interval contains the computed one.

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


def integer(v, what):
    """an exact integer as a certificate prints it: a JSON integer, or a string of decimal digits — never a float, a
    boolean, or anything else int() would round or coerce"""
    if isinstance(v, bool) or not (isinstance(v, int) or (isinstance(v, str) and re.fullmatch(r'-?[0-9]+', v))):
        raise ValueError('REFUSED: %s is not an exact integer: %s' % (what, repr(v)[:40]))
    return int(v)


def law(rows, min_points=2):
    """(x, y, numerator, denominator) rows -> the law {(x, y): weight}, through the door (verify_twolaw.py uses it too,
    with min_points=1: one law of a mixture may have one point)"""
    if not rows:
        raise ValueError('REFUSED: the law has no points')
    mu = {}
    for x, y, n, q in rows:
        x, y = integer(x, 'a coordinate'), integer(y, 'a coordinate')
        n, q = integer(n, 'a weight'), integer(q, 'a weight\'s denominator')
        if q <= 0:
            raise ValueError('REFUSED: a weight\'s denominator is not positive')
        if n <= 0:
            raise ValueError('REFUSED: a weight is not positive')
        if (x, y) in mu:
            raise ValueError('REFUSED: a point is listed twice: %s' % ((x, y),))
        mu[(x, y)] = Fraction(n, q)
    s = sum(mu.values())
    if s != 1:
        raise ValueError('REFUSED: the weights are not a probability law (they sum to %s than 1)' % ('more' if s > 1 else 'less'))
    if len(mu) < min_points:
        raise ValueError('REFUSED: a one-point law: every entropy is 0, so the ratio is 0/0')
    return mu


def read(path):
    """the three encodings on disk, through one door; integers of any length (json keeps Python ints exact)"""
    d = json.load(open(path))
    prob = re.sub(r'^c_?', '', str(d.get('problem', '')).lower())
    if prob not in FORMS:
        raise ValueError('REFUSED: not a 3b or 3c certificate')
    try:
        if 'weights' in d:
            rows = [(w['x'], w['y'], w['num'], w['den']) for w in d['weights']]
        elif 'distribution_x_y_numden' in d:
            rows = [(x, y, n, q) for x, y, (n, q) in d['distribution_x_y_numden']]
        elif 'distribution_x_y_num' in d:
            m = re.fullmatch(r'10\^([0-9]+)', str(d.get('denominator')))
            if not m:
                raise ValueError('REFUSED: the denominator is not of the form 10^k: %s' % repr(d.get('denominator'))[:40])
            rows = [(x, y, n, 10 ** int(m.group(1))) for x, y, n in d['distribution_x_y_num']]
        else:
            raise ValueError('REFUSED: no distribution in a known encoding')
    except (KeyError, TypeError, ValueError) as e:
        if str(e).startswith('REFUSED'):
            raise
        raise ValueError('REFUSED: a point is not a well-formed entry (%s)' % e)
    return prob, law(rows)


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
        if not 0 < q <= 1:                       # the ends below hold only while -ln p >= 0
            raise ValueError('REFUSED: an atom of weight outside (0, 1]')
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
    if not m_lo > 0:
        raise ValueError('REFUSED: the maximum entropy is not separated from 0, so the ratio is not defined')
    return DOWN.divide(t_lo, m_hi), UP.divide(t_hi, m_lo)


def printed(r, places=42):
    """an enclosure as printed: `places` digits after the point, the lower end rounded down and the upper end up"""
    q = Decimal((0, (1,), -places))
    return format(r[0].quantize(q, rounding=ROUND_FLOOR, context=DOWN), 'f'), format(r[1].quantize(q, rounding=ROUND_CEILING, context=UP), 'f')


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
        lo, hi = printed(r)
        print('%-9s  C%s >= %s  (%s; %d points; sha256 %s…)\n           ratio in [%s, %s]' % (v, prob, claim, what, len(mu), h[:12], lo, hi))
    # RED CONTROL: one unit above the certified ratio at the 17th significant digit — the same double as the true bound
    r = cache['l2026/certificate_3c_147pt.json'][2]
    v = decide(r, '1.6747338950414059')
    fired = v == 'REFUTED'
    print('%s  RED control: C3c >= 1.6747338950414059 (false; as a double it equals the true bound) -> %s' % ('fired' if fired else 'DID NOT FIRE', v))
    return 0 if good and fired else 1


if __name__ == '__main__':
    sys.exit(main())
