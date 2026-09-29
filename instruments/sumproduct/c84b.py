"""c84b.py — the registry's asterisked upper bound for the real sum–product exponent, C84b <= 1.999281, decided.

Standard library only (decimal, fractions). Written from I. Althoefer's note "Improved constant for [BSSZ2026]" (28 May
2026; the registry: "a ChatGPT 5.5 long-thinking optimization of the explicit constant of [BSSZ2026, §5] giving
c >= 0.000719. Unverified.").

WHAT THE NOTE PROVES. Its Theorem: max(|A+A|, |AA|) <= |A|^(2 - 0.0007) for arbitrarily large A, "the optimized value
suggested by the same calculation is about 0.000719, but 0.0007 is the safer quoted constant". Its chain, given
BSSZ2026 §5, its lattice-doubling lemma and the regulator bound R_K <= (1+o(1))^d f(s)^d for every s > 1, with
    f(s) = zeta(s) Gamma(s/2) C2^(s/2) / (2 pi^(s/2)),  C2 = 857.57,  eps = sqrt5 - 2,
    M2 = R^2 C2 / eps^2,  M1 = 4 (1 + eps) M2,
is: the product factor 5R/Y, the additive factor M1 e^Y/(X Y^2) + M2/(X^2 Y^2), and log|A|/d < L = log(5Y+1) + log(2 eps X + 1);
then c = -log(max factor)/L works.

DECIDED HERE (Decimal intervals, every operation in a named rounding context; ln and exp correctly rounded and widened
one ulp; pi by Machin with alternating-series brackets; zeta by Euler–Maclaurin and log Gamma by Stirling, each with
the first omitted term as the remainder bound, valid because the relevant derivatives keep one sign):
  1. f(1.371966384) <= 103, so R = 103 is available;
  2. at Y = 1415, X = floor(e^1423): 515/Y < 0.364, the additive factor < 0.364, L < 1432, and -log(0.364) > 0.0007 * 1432:
     the note's c >= 0.0007 holds, i.e. C84b <= 1.9993 (given the cited results);
  3. inf over s > 1 of f(s) >= R_lo, by a sweep of s with monotone endpoint bounds (zeta and Gamma(s/2) decrease on
     (1, 2.9], the power increases; outside, f is far above);
  4. for EVERY s, X, Y the chain gives c <= max_Y ln(Y/(5 R_lo)) / D(Y), D(Y) = ln(5Y+1) + ln(2 eps M1(R_lo)) + Y - 2 ln Y
     (for the additive factor to be below 1, X must exceed M1 e^Y / Y^2), decided by a sweep of Y — and that maximum is
     below 0.000719: the "suggested" constant, which the registry quotes, is out of reach of the calculation printed."""
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN
from fractions import Fraction as Fr

PREC = 50
_E = dict(Emax=10 ** 6, Emin=-10 ** 6)
DN = Context(prec=PREC, rounding=ROUND_FLOOR, **_E)
UP = Context(prec=PREC, rounding=ROUND_CEILING, **_E)
NE = Context(prec=PREC, rounding=ROUND_HALF_EVEN, **_E)


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

    def _c(b):
        return b if isinstance(b, Iv) else Iv.q(b)

    def __add__(a, b):
        b = Iv._c(b)
        return Iv(DN.add(a.lo, b.lo), UP.add(a.hi, b.hi))
    __radd__ = __add__

    def __sub__(a, b):
        b = Iv._c(b)
        return Iv(DN.subtract(a.lo, b.hi), UP.subtract(a.hi, b.lo))

    def __rsub__(a, b):
        return Iv._c(b) - a

    def __neg__(a):
        return Iv(a.hi.copy_negate(), a.lo.copy_negate())

    def __mul__(a, b):
        b = Iv._c(b)
        e = [(x, y) for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        return Iv(min(DN.multiply(x, y) for x, y in e), max(UP.multiply(x, y) for x, y in e))
    __rmul__ = __mul__

    def __truediv__(a, b):
        b = Iv._c(b)
        if b.lo <= 0 <= b.hi:
            raise ZeroDivisionError('divisor straddles 0')
        e = [(x, y) for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        return Iv(min(DN.divide(x, y) for x, y in e), max(UP.divide(x, y) for x, y in e))

    def __rtruediv__(a, b):
        return Iv._c(b) / a

    def exp(a):
        return Iv(NE.next_minus(NE.exp(a.lo)), NE.next_plus(NE.exp(a.hi)))

    def ln(a):
        if a.lo <= 0:
            raise ValueError('ln of a non-positive interval')
        return Iv(NE.next_minus(NE.ln(a.lo)), NE.next_plus(NE.ln(a.hi)))

    def sqrt(a):
        return (a.ln() * Fr(1, 2)).exp()


def atan_inv(n, terms=60):
    """arctan(1/n) bracketed by two consecutive partial sums of its alternating series (decreasing terms)"""
    s, prev = Fr(0), None
    for k in range(terms):
        prev = s
        s += Fr((-1) ** k, (2 * k + 1) * n ** (2 * k + 1))
    return (min(s, prev), max(s, prev))


def pi_iv():
    a = atan_inv(5)
    b = atan_inv(239)
    lo, hi = 16 * a[0] - 4 * b[1], 16 * a[1] - 4 * b[0]
    return Iv(Iv.q(lo).lo, Iv.q(hi).hi)


PI = pi_iv()
BERN = [Fr(1, 6), Fr(-1, 30), Fr(1, 42), Fr(-1, 30), Fr(5, 66), Fr(-691, 2730), Fr(7, 6), Fr(-3617, 510)]   # B_2 .. B_16


def zeta(s, N=30, m=6):
    """Euler–Maclaurin at a rational s > 1: the remainder lies between 0 and the first omitted term"""
    S = Fr(s)
    tot = Iv.q(0)
    lnN = Iv.q(N).ln()
    for n in range(1, N):
        tot = tot + (-(Iv.q(S) * Iv.q(n).ln())).exp()
    Npow = (-(Iv.q(S) * lnN)).exp()                           # N^-s
    tot = tot + Npow * Iv.q(N) / Iv.q(S - 1) + Npow * Fr(1, 2)
    rising = Fr(1)                                             # s (s+1) ... (s+2k-2)
    fact = Fr(1)
    k_terms = []
    for k in range(1, m + 2):
        if k == 1:
            rising = S
        else:
            rising *= (S + 2 * k - 3) * (S + 2 * k - 2)
        fact = Fr(1)
        for j in range(1, 2 * k + 1):
            fact *= j
        coef = BERN[k - 1] / fact * rising
        term = Iv.q(coef) * Npow / Iv.q(Fr(N) ** (2 * k - 1))
        k_terms.append(term)
    for t in k_terms[:-1]:
        tot = tot + t
    last = k_terms[-1]
    return Iv(min(tot.lo, (tot + last).lo), max(tot.hi, (tot + last).hi))


def lngamma(x, N=24, m=7):
    """log Gamma at a rational x > 0: shift by N, Stirling at z = x + N with the first omitted term as the bound"""
    X = Fr(x)
    z = X + N
    Z = Iv.q(z)
    lnz = Z.ln()
    tot = (Z - Fr(1, 2)) * lnz - Z + (Iv.q(2) * PI).ln() * Fr(1, 2)
    terms = []
    for k in range(1, m + 2):
        terms.append(Iv.q(BERN[k - 1] / (2 * k * (2 * k - 1)) / z ** (2 * k - 1)))
    for t in terms[:-1]:
        tot = tot + t
    last = terms[-1]
    tot = Iv(min(tot.lo, (tot + last).lo), max(tot.hi, (tot + last).hi))
    for k in range(N):
        tot = tot - Iv.q(X + k).ln()
    return tot


C2 = Fr(85757, 100)
EPS = Iv.q(5).sqrt() - 2                                      # (phi - 1)/(phi + 1) = sqrt5 - 2


def f_at(s):
    """zeta(s) Gamma(s/2) C2^(s/2) / (2 pi^(s/2)) at a rational s"""
    S = Fr(s)
    lnpow = (Iv.q(C2).ln() - PI.ln()) * (S / 2)
    return zeta(S) * lngamma(S / 2).exp() * lnpow.exp() * Fr(1, 2)


def M1_of(R):
    R = R if isinstance(R, Iv) else Iv.q(R)
    M2 = R * R * Fr(C2) / (EPS * EPS)
    return M2 * (EPS + 1) * 4, M2


def decide():
    checks = []
    s0 = Fr(1371966384, 10 ** 9)
    f0 = f_at(s0)
    checks.append({'name': 'f(1.371966384) <= 103 (the note: about 101.956)', 'ok': f0.hi <= 103, 'detail': '[%s, %s]' % (str(f0.lo)[:14], str(f0.hi)[:14])})
    # 2. the chain at the note's choice
    Y = 1415
    M1, M2 = M1_of(103)
    lnX_lo = Iv.q(1423).exp() - 1                             # X = floor(e^1423) >= e^1423 - 1
    X_lo = lnX_lo
    add = M1 * Iv.q(Y).exp() / (X_lo * (Y * Y)) + M2 / (X_lo * X_lo * (Y * Y))
    prod = Fr(515, Y)
    L = Iv.q(5 * Y + 1).ln() + (EPS * 2 * Iv.q(1423).exp() + 1).ln()   # X <= e^1423
    q = Fr(364, 1000)
    checks.append({'name': '515/Y = 515/1415 < 0.364', 'ok': prod < q})
    checks.append({'name': 'M1 e^Y/(X Y^2) + M2/(X^2 Y^2) < 0.136 (and so < 0.364)', 'ok': add.hi < Decimal('0.136'), 'detail': str(add.hi)[:12]})
    checks.append({'name': 'log|A|/d < L < 1432', 'ok': L.hi < 1432, 'detail': str(L.hi)[:12]})
    nl = -(Iv.q(q).ln())
    checks.append({'name': '-log(0.364) > 0.0007 * 1432 = 1.0024: c = 0.0007 holds', 'ok': nl.lo > Decimal('1.0024'), 'detail': str(nl.lo)[:10]})
    c_note = -(Iv.q(max(prod, Fr(0))).ln()) / L
    # 3. inf_s f(s) >= R_lo by a sweep of (1.01, 2.9] with monotone endpoint bounds, and the outside by domination
    R_lo = Decimal('101.9')
    sweep_ok = True
    grid = sorted(set([Fr(101, 100) + Fr(k, 1000) for k in range(0, 1891)]                       # 1.010 .. 2.900 by 0.001
                      + [Fr(12, 10) + Fr(k, 10000) for k in range(0, 4001)]))                     # 1.2 .. 1.6 by 0.0001, near the minimum
    lnratio = Iv.q(C2).ln() - PI.ln()
    worst = None
    for a, b in zip(grid, grid[1:]):
        # zeta decreasing, Gamma(s/2) decreasing for s/2 < 1.46, (C2/pi)^(s/2) increasing
        lb = DN.divide(DN.multiply(DN.multiply(zeta(b).lo, lngamma(b / 2).exp().lo), (lnratio * (a / 2)).exp().lo), Decimal(2))
        if worst is None or lb < worst[0]:
            worst = (lb, float(a))
        if lb < R_lo:
            sweep_ok = False
            break
    # (1, 1.01]: zeta(s) >= 1/(s-1) >= 100, Gamma(s/2) >= Gamma-minimum 0.8856 > 0.88, (C2/pi)^(s/2) >= (C2/pi)^(1/2) > 16
    near1 = 100 * Decimal('0.88') * (lnratio * Fr(1, 2)).exp().lo / 2
    # s >= 2.9: zeta >= 1, Gamma >= 0.88, (C2/pi)^(s/2) >= (C2/pi)^1.45
    far = Decimal('0.88') * (lnratio * Fr(145, 100)).exp().lo / 2
    checks.append({'name': 'inf over s > 1 of f(s) >= %s (a sweep of [1.01, 2.9] by 0.001, of [1.2, 1.6] by 0.0001; below, zeta > 100; above, the power dominates)' % R_lo,
                   'ok': sweep_ok and near1 > R_lo and far > R_lo, 'detail': 'smallest endpoint bound %s at s = %.3f' % (str(worst[0])[:10], worst[1])})
    # 4. the ceiling on c for every s, X, Y
    M1lo, _ = M1_of(Iv.q(Fr(str(R_lo))))
    K = (EPS * 2 * M1lo).ln()
    g_max = None
    Yg = [Fr(5 * 1019, 10)]                                    # from 5 R_lo upward
    y = Yg[0]
    while y < 20000:
        y = y + (Fr(1, 2) if y < 3000 else Fr(10))
        Yg.append(y)
    for a, b in zip(Yg, Yg[1:]):
        num = (Iv.q(b) / (Iv.q(Fr(str(R_lo))) * 5)).ln()
        D = (Iv.q(5 * a + 1)).ln() + K + Iv.q(a) - (Iv.q(a).ln()) * 2
        if D.lo <= 0:
            continue
        ub = UP.divide(num.hi, D.lo) if num.hi > 0 else Decimal(0)
        if g_max is None or ub > g_max[0]:
            g_max = (ub, float(a))
    tail = Decimal(0)                                          # Y >= 20000: ln(Y/(5R))/(Y - ln Y) < 7e-4 needs checking
    yT = Iv.q(20000)
    tail = UP.divide((yT / (Iv.q(Fr(str(R_lo))) * 5)).ln().hi, (yT - yT.ln() * 2).lo)   # decreasing beyond; a crude bound
    ceiling = max(g_max[0], tail)
    checks.append({'name': 'for every s > 1, X and Y, the chain gives c <= %s < 0.000719' % str(ceiling)[:9], 'ok': ceiling < Decimal('0.000719'),
                   'detail': 'the maximum near Y = %.1f' % g_max[1]})
    ok_note = all(c['ok'] for c in checks[:5])
    return {'checks': checks, 'noteHolds': ok_note, 'ceiling': str(ceiling)[:12], 'cAtNoteChoice': [str(c_note.lo)[:12], str(c_note.hi)[:12]],
            'suggestedOutOfReach': checks[-1]['ok'] and checks[-2]['ok'],
            'verdict': 'REPAIRED' if ok_note and checks[-1]['ok'] and checks[-2]['ok'] else 'REFUSED'}


if __name__ == '__main__':
    import json
    import time
    t0 = time.time()
    r = decide()
    r['seconds'] = round(time.time() - t0, 1)
    print(json.dumps(r, indent=1))
