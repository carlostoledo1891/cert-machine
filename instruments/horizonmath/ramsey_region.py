"""ramsey_region.py — HorizonMath's diagonal-Ramsey certificate (arXiv 2603.15617v2, Appendix A.3), decided.

Standard library only. It shares no code with HorizonMath's validator (validators/ramsey_asymptotic.py, mpmath) and
was written from the two papers, not from that file.

THE CLAIM. GPT-5.4 Pro's certificate — F(l) = h(l) + p(l) e^-l with p = GNNW's cubic plus -0.0778 l^5, and
piecewise-constant M and Y on 200 intervals of (0.001, 1] — is said to satisfy the three conditions of Gupta,
Ndiaye, Norin and Wei's Theorem 14 (arXiv 2407.19026v2; Theorem 13 in v1), which would give
R(k,k) <= 3.6960839...^(k+o(k)).

THE DEFINITION. Condition 2 asks (X(l), Y(l)) in R, where (GNNW (12)) R0 is the set of (x, y) with
R(k, m) <= x^-k y^-m for ALL k, m with k + m large, and R its closure. Because R(k, m) = R(m, k), R is symmetric.
A bound e^{f(m/k) k} valid for m <= k places (x, y) in R when BOTH hold for every s in (0, 1]:
        -ln x - s ln y >= f(s)      (the pairs with m <= k)
        -ln y - s ln x >= f(s)      (the pairs with m > k, read through R(k, m) = R(m, k))
GNNW's Lemma 15 proves both before it places a point in R.

THE PROBLEM'S RULE. HorizonMath's statement defines its inner region by the FIRST line alone and accepts a pair
"if either (x, y) in R0 or (y, x) in R0" — one of the two lines, where membership needs both. With U increasing,
the first line holds for every y whenever x <= e^-U(1) = 0.26292...: the rule accepts a whole strip that R does
not contain.

WHAT IS DECIDED HERE, in Decimal intervals (every operation in a named context: DN rounds down, UP rounds up, NE
is where ln and exp are correctly rounded, and each such result is widened one unit in the last place):

  1. OUTSIDE R. Erdos 1947 by the first moment: for k, m >= 3 and 0 < p < 1, a random coloring of K_N with
     N = floor(min(p^-(k-1)/2, (1-p)^-(m-1)/2)) has fewer than 1/6 + 1/6 expected monochromatic cliques, so
     R(k, m) > N. Taking k = ceil(e m) and m -> infinity, (x, y) in R forces
        e (-ln x) + (-ln y) >= min( (e/2)(-ln p), (1/2)(-ln(1-p)) )    for every e > 0 and 0 < p < 1,
     and the same with x and y exchanged. One rational (e, p) at which the right side's lower end exceeds the
     left side's upper end decides (x, y) NOT in R. (If (x, y) is in R, (x - d, y - d) is in R0 for every d > 0,
     so the bound holds with x - d, y - d for all large m; let d -> 0.)
  2. NOT PLACED BY THE BOUND THE PROBLEM NAMES. One rational s in (0, 1] at which U(s) exceeds the needed
     line's upper end — the pair is not in R by the problem's own U; it may or may not be in R by another bound.
  3. THE PROBLEM'S RULE ACCEPTS: x <= e^-U(1), decided directly (U is increasing on (0, 1]: U' >= ln 2 - 1/4).

The float search that proposes (e, p) and s is a proposer only; the interval check is the authority.
"""
import json
import math
import os
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN
from fractions import Fraction as Fr

PREC = 60
_E = dict(Emax=10 ** 6, Emin=-10 ** 6)
DN = Context(prec=PREC, rounding=ROUND_FLOOR, **_E)
UP = Context(prec=PREC, rounding=ROUND_CEILING, **_E)
NE = Context(prec=PREC, rounding=ROUND_HALF_EVEN, **_E)
U_CUBIC = (Fr(-1, 4), Fr(33, 1000), Fr(8, 100))      # the problem's R0: G(u) = (-0.25u + 0.033u^2 + 0.08u^3) e^-u


class Iv:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi=None):
        self.lo, self.hi = lo, (lo if hi is None else hi)
        if not self.lo <= self.hi:
            raise ArithmeticError('empty interval')

    @staticmethod
    def q(x):
        x = Fr(x)
        n, d = Decimal(x.numerator), Decimal(x.denominator)
        return Iv(DN.divide(n, d), UP.divide(n, d))

    def __add__(a, b):
        b = b if isinstance(b, Iv) else Iv.q(b)
        return Iv(DN.add(a.lo, b.lo), UP.add(a.hi, b.hi))

    def __sub__(a, b):
        b = b if isinstance(b, Iv) else Iv.q(b)
        return Iv(DN.subtract(a.lo, b.hi), UP.subtract(a.hi, b.lo))

    def __neg__(a):
        return Iv(a.hi.copy_negate(), a.lo.copy_negate())

    def __mul__(a, b):
        b = b if isinstance(b, Iv) else Iv.q(b)
        ends = [(x, y) for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        return Iv(min(DN.multiply(x, y) for x, y in ends), max(UP.multiply(x, y) for x, y in ends))

    def __truediv__(a, b):
        b = b if isinstance(b, Iv) else Iv.q(b)
        if b.lo <= 0 <= b.hi:
            raise ZeroDivisionError('divisor straddles 0')
        ends = [(x, y) for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        return Iv(min(DN.divide(x, y) for x, y in ends), max(UP.divide(x, y) for x, y in ends))

    def exp(a):
        return Iv(NE.next_minus(NE.exp(a.lo)), NE.next_plus(NE.exp(a.hi)))

    def ln(a):
        if a.lo <= 0:
            raise ValueError('ln of a non-positive interval')
        return Iv(NE.next_minus(NE.ln(a.lo)), NE.next_plus(NE.ln(a.hi)))


def poly(coeffs, x):
    """p(x) = sum_i a_i x^(i+1) and p'(x), exactly, for Fractions"""
    p = sum(a * x ** (i + 1) for i, a in enumerate(coeffs))
    dp = sum((i + 1) * a * x ** i for i, a in enumerate(coeffs))
    return p, dp


def neg_ln_X(lam, M, coeffs):
    """-ln X(l) = -[ ln(1 - e^-F'(l)) / (1 - M) + ln(1 - M) ],  F'(l) = ln((1+l)/l) + (p'(l) - p(l)) e^-l"""
    p, dp = poly(coeffs, lam)
    fp = Iv.q((1 + lam) / lam).ln() + Iv.q(dp - p) * (-Iv.q(lam)).exp()
    one_m = Iv.q(1 - M)
    return -((Iv.q(1) - (-fp).exp()).ln() / one_m + one_m.ln())


def F_at(lam, coeffs):
    p, _ = poly(coeffs, lam)
    L = Iv.q(lam)
    return Iv.q(1 + lam) * Iv.q(1 + lam).ln() - L * L.ln() + Iv.q(p) * (-L).exp()


def U_at(s):
    g = sum(a * s ** (i + 1) for i, a in enumerate(U_CUBIC))
    S = Iv.q(s)
    return Iv.q(1 + s) * Iv.q(1 + s).ln() - S * S.ln() + Iv.q(g) * (-S).exp()


def erdos_rate(e, p):
    """lower end of min((e/2)(-ln p), (1/2)(-ln(1-p))): the growth rate per m of Erdos's lower bound on R(ceil(e m), m)"""
    a = -(Iv.q(p).ln()) * Iv.q(Fr(e) / 2)
    b = -(Iv.q(1 - Fr(p)).ln()) * Iv.q(Fr(1, 2))
    return min(a.lo, b.lo)


# ---------- float proposers (never an authority) ----------
def _L(e):
    lo, hi = 1e-300, 1 - 1e-16
    for _ in range(200):
        m = (lo + hi) / 2
        if e / 2 * -math.log(m) > 0.5 * -math.log1p(-m):
            lo = m
        else:
            hi = m
    return lo, 0.5 * -math.log1p(-lo)


_GRID = [i / 4000 for i in range(1, 8001)]
_LGRID = [_L(e) for e in _GRID]


def propose_outside(a, b):
    """(e, p, orientation) maximising the float gap; orientation 'k=em' tests e*a + b, 'm=ek' tests a + e*b"""
    best = None
    for e, (p, L) in zip(_GRID, _LGRID):
        for orient, rate in (('k=em', e * a + b), ('m=ek', a + e * b)):
            g = L - rate
            if best is None or g > best[0]:
                best = (g, e, p, orient)
    return best


def _Uf(s):
    return (1 + s) * math.log(1 + s) - s * math.log(s) + (-0.25 * s + 0.033 * s * s + 0.08 * s ** 3) * math.exp(-s)


def propose_not_placed(a, b):
    best = None
    for i in range(1, 2001):
        s = i / 2000
        for orient, line in (('-ln x - s ln y', a + s * b), ('-ln y - s ln x', b + s * a)):
            g = _Uf(s) - line
            if best is None or g > best[0]:
                best = (g, s, orient)
    return best


# ---------- the decisions ----------
def decide_outside(nlx, y):
    """(x, y) NOT in R, by one rational (e, p): returns the witness or None. nlx is -ln x as an interval."""
    nly = -(Iv.q(y).ln())
    g, e, p, orient = propose_outside(float(nlx.hi), float(nly.hi))
    if g <= 0:
        return None
    for digits in (6, 9, 12):
        E = Fr(round(e * 10 ** 4), 10 ** 4)
        P = Fr(round(p * 10 ** digits), 10 ** digits)
        if not (0 < P < 1 and E > 0):
            continue
        lower = erdos_rate(E, P)
        rate = (Iv.q(E) * nlx + nly) if orient == 'k=em' else (nlx + Iv.q(E) * nly)
        if lower > rate.hi:
            return {'e': str(E), 'p': str(P), 'regime': 'k = ceil(e m)' if orient == 'k=em' else 'm = ceil(e k)',
                    'erdosRateLo': float(DN.plus(lower)), 'pairRateHi': float(rate.hi), 'gap': float(DN.subtract(lower, rate.hi))}
    return None


def decide_not_placed(nlx, y):
    """one rational s in (0, 1] at which U(s) exceeds the needed line: the problem's own bound does not place (x, y)"""
    nly = -(Iv.q(y).ln())
    g, s, orient = propose_not_placed(float(nlx.hi), float(nly.hi))
    if g <= 0:
        return None
    S = Fr(round(s * 2000), 2000)
    line = (nlx + Iv.q(S) * nly) if orient == '-ln x - s ln y' else (nly + Iv.q(S) * nlx)
    u = U_at(S)
    if u.lo > line.hi:
        return {'s': str(S), 'line': orient + ' >= U(s)', 'U_lo': float(u.lo), 'line_hi': float(line.hi)}
    return None


def load(corpus):
    c = json.load(open(os.path.join(corpus, 'ramsey-a3-certificate.json')))
    coeffs = [Fr(Decimal(x)) for x in c['polynomial_coeffs']]
    bps = [Fr(Decimal(x)) for x in c['M']['breakpoints']]
    if c['Y']['breakpoints'] != c['M']['breakpoints']:
        raise ValueError('M and Y are not on one partition')
    Mv = [Fr(Decimal(x)) for x in c['M']['values']]
    Yv = [Fr(Decimal(x)) for x in c['Y']['values']]
    return coeffs, bps, Mv, Yv


def points(bps, Mv, Yv, split=Fr(1, 1000)):
    """the midpoint of every interval of (split, 1] on which M and Y are constant, and l = 1 itself"""
    edges = [split] + [b for b in bps if b > split] + [Fr(1)]
    first = sum(1 for b in bps if b <= split)
    out = []
    for i in range(len(edges) - 1):
        out.append(((edges[i] + edges[i + 1]) / 2, Mv[first + i], Yv[first + i]))
    out.append((Fr(1), Mv[-1], Yv[-1]))
    return out


def decide(corpus):
    coeffs, bps, Mv, Yv = load(corpus)
    checks, rows = [], []

    def chk(name, ok, detail=''):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
        return ok

    F1 = F_at(Fr(1), coeffs)
    c_lo, c_hi = F1.exp().lo, F1.exp().hi
    chk('c = e^F(1) is the printed 3.6960839126...', Decimal('3.69608391255') < c_lo and c_hi < Decimal('3.69608391265'),
        '[%s, %s]' % (NE.to_eng_string(NE.plus(c_lo))[:16], NE.to_eng_string(NE.plus(c_hi))[:16]))
    eU1 = (-U_at(Fr(1))).exp()
    out_n = notplaced_n = 0
    for lam, M, Y in points(bps, Mv, Yv):
        nlx = neg_ln_X(lam, M, coeffs)
        w_out = decide_outside(nlx, Y)
        w_np = None if w_out else decide_not_placed(nlx, Y)
        out_n += bool(w_out)
        notplaced_n += bool(w_np)
        rows.append({'lambda': float(lam), 'M': str(Decimal(M.numerator) / Decimal(M.denominator)) if M.denominator < 10 ** 30 else float(M),
                     'X': [float((-nlx).exp().lo), float((-nlx).exp().hi)], 'Y': float(Y),
                     'outsideR': w_out, 'notPlacedByU': w_np})
    last = rows[-1]
    X1 = (-neg_ln_X(Fr(1), Mv[-1], coeffs)).exp()
    chk('the problem\'s rule accepts (X(1), Y(1)): X(1) <= e^-U(1), so -ln X(1) - s ln Y(1) >= U(s) on all of (0, 1]', X1.hi < eU1.lo,
        'X(1) <= %.8f < %.8f <= e^-U(1)' % (float(X1.hi), float(eU1.lo)))
    chk('(X(1), Y(1)) is NOT in R: the Erdos bound excludes the pair the diagonal constant is read at', last['outsideR'] is not None,
        json.dumps(last['outsideR']))
    n = len(rows)
    verdict = 'REFUTED' if last['outsideR'] else 'REFUSED'
    return {
        'claim': 'the certificate satisfies GNNW Theorem 14, so R(k,k) <= 3.6960839...^(k+o(k))',
        'verdict': verdict,
        'checks': checks,
        'points': n,
        'outsideR': out_n,
        'notPlacedByU': notplaced_n,
        'notRefutedHere': n - out_n - notplaced_n,
        'eMinusU1': [float(eU1.lo), float(eU1.hi)],
        'cEnclosure': [str(DN.plus(c_lo))[:22], str(UP.plus(c_hi))[:22]],
        'rows': rows,
    }


if __name__ == '__main__':
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    r = decide(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '..', 'corpus', 'horizonmath'))
    print(json.dumps({k: v for k, v in r.items() if k != 'rows'}, indent=1))
