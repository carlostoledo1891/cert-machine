"""Independent rigorous decider: theta-derivative-log-concavity.

Standard library only.  Statement (case.tex, Csordas Problem 4.13 / Coffey-Csordas Conj. 2.5):
    Phi(t) = sum_{n>=1} pi n^2 (2 pi n^2 e^{4t} - 3) exp(5t - pi n^2 e^{4t}),
    J_n(t) = (Phi^{(n)}(t))^2 - Phi^{(n-1)}(t) Phi^{(n+1)}(t) > 0  for all n in N, t in R.
Counterexample: J_9(1/50) < 0.

Derivation used here (re-derived, not taken from the certificate):
    with u = pi m^2 e^{4t}, du/dt = 4u, the m-th term is pi m^2 e^{5t} e^{-u} P_0(u), P_0 = 2u - 3,
    and d/dt[e^{5t-u} P_k(u)] = e^{5t-u} [ (5 - 4u) P_k(u) + 4u P_k'(u) ] =: e^{5t-u} P_{k+1}(u).
    Termwise differentiation is legitimate: the differentiated series converge uniformly on
    compact t-sets (the bound below is uniform in a neighbourhood).
    So Phi^{(k)}(t) = pi e^{5t} sum_m m^2 e^{-u_m} P_k(u_m),  u_m = a m^2,  a = pi e^{4t}.

Tail bound (proved): let D = deg P_k = k+1 and C = sum_j |coef_j(P_k)|.  If u_{M+1} >= 1 then
for m >= M+1, |P_k(u_m)| <= C u_m^D, so |term_m| <= pi e^{5t} C f(m), f(m) = a^D m^{2D+2} e^{-a m^2}.
f(m+1)/f(m) = (1+1/m)^{2D+2} e^{-a(2m+1)} is decreasing in m, hence <= rho :=
(1+1/(M+1))^{2D+2} e^{-a(2M+3)} for all m >= M+1; if rho < 1 then
sum_{m>=M+1} |term_m| <= pi e^{5t} C f(M+1) / (1 - rho).

Arithmetic: decimal.Decimal intervals; every operation is performed in one of two named contexts,
DN (ROUND_FLOOR) for lower ends and UP (ROUND_CEILING) for upper ends, both at PREC digits;
exp is taken in NE (ROUND_HALF_EVEN, where the decimal module's exp is correctly rounded) and
widened by one unit in the last place each way with NE.next_minus / NE.next_plus;
negation uses copy_negate (exact), absolute value copy_abs (exact); the default context is never
used for arithmetic.  pi comes from Machin's formula, pi = 16 atan(1/5) - 4 atan(1/239), each
arctangent bracketed exactly (Fractions) by two consecutive partial sums of its alternating series
with decreasing terms, then rounded outward into DN/UP.
"""
import json
import os
import copy
from fractions import Fraction as Fr
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN

CASE = 'theta-derivative-log-concavity'
N_ORDER = 9            # J_9: uses Phi^(8), Phi^(9), Phi^(10)
PREC = 110
_E = dict(Emax=10 ** 8, Emin=-10 ** 8)
DN = Context(prec=PREC, rounding=ROUND_FLOOR, **_E)
UP = Context(prec=PREC, rounding=ROUND_CEILING, **_E)
NE = Context(prec=PREC, rounding=ROUND_HALF_EVEN, **_E)


class Iv:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi=None):
        self.lo = lo
        self.hi = lo if hi is None else hi
        assert self.lo <= self.hi, (self.lo, self.hi)

    @staticmethod
    def of_int(n):
        d = Decimal(int(n))                   # exact (any size)
        return Iv(DN.plus(d), UP.plus(d))     # outward-rounded to PREC digits

    @staticmethod
    def of_frac(x):
        x = Fr(x)
        n, d = Decimal(x.numerator), Decimal(x.denominator)
        return Iv(DN.divide(n, d), UP.divide(n, d))

    def __add__(a, b):
        return Iv(DN.add(a.lo, b.lo), UP.add(a.hi, b.hi))

    def __sub__(a, b):
        return Iv(DN.subtract(a.lo, b.hi), UP.subtract(a.hi, b.lo))

    def __mul__(a, b):
        ps = [(x, y) for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        return Iv(min(DN.multiply(x, y) for x, y in ps), max(UP.multiply(x, y) for x, y in ps))

    def div(a, b):
        assert b.lo > 0 or b.hi < 0
        ps = [(x, y) for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        return Iv(min(DN.divide(x, y) for x, y in ps), max(UP.divide(x, y) for x, y in ps))

    def neg(a):
        return Iv(a.hi.copy_negate(), a.lo.copy_negate())

    def exp(a):
        lo = NE.next_minus(NE.exp(a.lo))       # |NE.exp(x) - e^x| <= 1/2 ulp  (correctly rounded)
        hi = NE.next_plus(NE.exp(a.hi))
        return Iv(lo, hi)

    def ipow(a, k):
        r = Iv(Decimal(1))
        for _ in range(k):
            r = r * a
        return r

    def __repr__(self):
        return '[%s, %s]' % (self.lo, self.hi)


def atan_inv_bracket(x, digits):
    """Exact rational bracket (lo, hi) of atan(1/x), integer x >= 2, width < 10^-digits.
    atan(1/x) = sum_k (-1)^k b_k with b_k = 1/((2k+1) x^(2k+1)) strictly decreasing to 0, so the
    value lies between any two consecutive partial sums S_k, S_{k+1}."""
    eps = Fr(1, 10 ** digits)
    s = Fr(0)
    k = 0
    while True:
        b = Fr(1, (2 * k + 1) * x ** (2 * k + 1))
        s = s + b if k % 2 == 0 else s - b
        nb = Fr(1, (2 * k + 3) * x ** (2 * k + 3))
        if nb < eps:
            s2 = s - nb if k % 2 == 0 else s + nb      # S_{k+1}
            return min(s, s2), max(s, s2)
        k += 1


def pi_interval():
    a5 = atan_inv_bracket(5, PREC + 15)
    a239 = atan_inv_bracket(239, PREC + 15)
    lo = 16 * a5[0] - 4 * a239[1]
    hi = 16 * a5[1] - 4 * a239[0]
    return Iv(DN.divide(Decimal(lo.numerator), Decimal(lo.denominator)),
              UP.divide(Decimal(hi.numerator), Decimal(hi.denominator))), (lo, hi)


def P_coeffs(k):
    """Integer coefficients (low -> high) of P_k: P_0 = 2u - 3, P_{j+1} = 4u P_j' + (5 - 4u) P_j."""
    c = [-3, 2]
    for _ in range(k):
        new = [0] * (len(c) + 1)
        for j, cj in enumerate(c):
            new[j] += 4 * j * cj + 5 * cj
            new[j + 1] += -4 * cj
        c = new
    return c


def horner(c, u):
    acc = Iv.of_int(c[-1])
    for cj in reversed(c[:-1]):
        acc = acc * u + Iv.of_int(cj)
    return acc


def phi_derivative(k, t, M=None):
    """Enclosure of Phi^{(k)}(t) for rational t; returns (interval, tail_bound, M)."""
    t = Fr(t)
    pi, _ = pi_interval()
    e4t = Iv.of_frac(4 * t).exp()
    e5t = Iv.of_frac(5 * t).exp()
    a = pi * e4t
    c = P_coeffs(k)
    D = len(c) - 1
    C = sum(abs(x) for x in c)
    if M is None:
        M = 6
        while True:           # choose M so the tail is far below the working precision
            tb = tail_bound(pi, e5t, a, C, D, M)
            if tb is not None and tb < Decimal('1E-%d' % (PREC + 20)):
                break
            M += 2
            if M > 4000:
                return None, None, M
    tb = tail_bound(pi, e5t, a, C, D, M)
    if tb is None:
        return None, None, M
    s = Iv(Decimal(0))
    for m in range(1, M + 1):
        u = a * Iv.of_int(m * m)
        s = s + Iv.of_int(m * m) * u.neg().exp() * horner(c, u)
    val = pi * e5t * s
    tbd = Iv(tb.copy_negate(), tb)
    return val + tbd, tb, M


def tail_bound(pi, e5t, a, C, D, M):
    """Upper bound of sum_{m>=M+1} |term_m| (see module docstring), or None if the hypotheses fail."""
    m1 = M + 1
    if DN.multiply(a.lo, Decimal(m1 * m1)) < 1:          # need u_{M+1} >= 1
        return None
    # rho = (1 + 1/(M+1))^{2D+2} * exp(-a (2M+3)), upper bound
    base = Iv.of_frac(Fr(M + 2, M + 1)).ipow(2 * D + 2)
    ex = Iv(DN.multiply(a.lo, Decimal(2 * M + 3)), UP.multiply(a.hi, Decimal(2 * M + 3)))
    rho = base * ex.neg().exp()
    if not rho.hi < 1:
        return None
    one_minus = DN.subtract(Decimal(1), rho.hi)
    # f(M+1) = a^D (M+1)^{2D+2} e^{-a (M+1)^2}, upper bound
    aD = a.ipow(D)
    ex2 = Iv(DN.multiply(a.lo, Decimal(m1 * m1)), UP.multiply(a.hi, Decimal(m1 * m1)))
    f = aD * Iv.of_int(m1 ** (2 * D + 2)) * ex2.neg().exp()
    tot = pi * e5t * Iv.of_int(C) * f
    return UP.divide(tot.hi, one_minus)


def dec_str(x, sig=22, rounding=ROUND_HALF_EVEN):
    """Display only (never used in a decision)."""
    return Context(prec=sig, rounding=rounding, **_E).plus(x).to_eng_string()


def dec_lo(x, sig=30):
    return dec_str(x, sig, ROUND_FLOOR)


def dec_hi(x, sig=30):
    return dec_str(x, sig, ROUND_CEILING)


def printed_agrees(s, iv):
    """printed decimal within the enclosure widened by one unit of its last printed digit."""
    s = s.strip()
    frac = s.split('.')[1] if '.' in s else ''
    ulp = Decimal('1E-%d' % len(frac))
    v = Decimal(s)                                       # exact parse
    return DN.subtract(iv.lo, ulp) <= v <= UP.add(iv.hi, ulp), len(frac)


def _load(root):
    if isinstance(root, dict):
        return root
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
        return json.load(f)


def decide(root):
    cert = _load(root)
    checks = []

    def ck(name, ok, detail=''):
        checks.append({'name': name, 'ok': bool(ok), 'detail': str(detail)})
        return bool(ok)

    n = N_ORDER
    claim = ('At n = 9 and t = 1/50 the Turan expression J_9(t) = (Phi^(9)(t))^2 - Phi^(8)(t) Phi^(10)(t) of '
             'the Jacobi theta kernel Phi is negative, so Phi^(8) is not log-concave on R and the '
             'Coffey-Csordas conjecture (Csordas Problem 4.13) is false.')
    try:
        t = Fr(cert['t'])
    except Exception as e:
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks, 'why': 'witness t unreadable: %r' % e}
    ck('witness: n = 9 is a natural number, t = %s is real' % t, True)

    # sanity of pi (Machin bracket) against the classical 3.14159265358979 digits (both directions)
    pi, (plo, phi_) = pi_interval()
    ck('pi enclosed by Machin brackets', Fr(314159265358979, 10 ** 14) < plo and phi_ < Fr(314159265358980, 10 ** 14),
       'width %s' % dec_hi(UP.subtract(pi.hi, pi.lo), 3))
    # the recurrence reproduces P_1 by hand: P_1 = 4u*2 + (5-4u)(2u-3) = -8u^2 + 30u - 15
    ck('P_1 = -8u^2 + 30u - 15 (hand check of the recurrence)', P_coeffs(1) == [-15, 30, -8])

    ph = {}
    for k in (n - 1, n, n + 1):
        val, tb, M = phi_derivative(k, t)
        if val is None:
            ck('Phi^(%d)(t) tail bound available' % k, False, 'hypotheses of the tail bound fail up to M=%d' % M)
            return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks,
                    'why': 'no proved tail bound at this t (u_{M+1} < 1 or rho >= 1 for all tried M)'}
        ph[k] = val
        ck('Phi^(%d)(%s) enclosed (M = %d terms, proved tail <= %s)' % (k, t, M, dec_hi(tb, 3)), True,
           '[%s, %s]' % (dec_lo(val.lo), dec_hi(val.hi)))
    J = ph[n] * ph[n] - ph[n - 1] * ph[n + 1]
    width = UP.subtract(J.hi, J.lo)
    ck('J_9(t) enclosed', True, '[%s, %s], width %s' % (dec_lo(J.lo), dec_hi(J.hi), dec_hi(width, 3)))
    neg = ck('J_9(t) < 0 (upper end of the enclosure is negative)', J.hi < 0)

    for key, k in (('Phi8', 8), ('Phi9', 9), ('Phi10', 10)):
        if key in cert:
            ok, nd = printed_agrees(cert[key], ph[k])
            ck('printed %s agrees to its %d fractional digits' % (key, nd), ok, cert[key][:40] + '...')
    if 'J9' in cert:
        ok, nd = printed_agrees(cert['J9'], J)
        ck('printed J9 agrees to its %d fractional digits' % nd, ok, cert['J9'][:40] + '...')
    if 'threshold' in cert:
        ck('J_9 < printed threshold', J.hi < Decimal(cert['threshold']), cert['threshold'])

    if neg:
        return {'verdict': 'CERTIFIED', 'claim': claim, 'checks': checks, 'why': ''}
    if J.lo > 0:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks,
                'why': 'J_9(t) > 0 at the witness t = %s: the enclosure is strictly positive' % t}
    return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks,
            'why': 'the enclosure of J_9(t) contains 0 at %d digits' % PREC}


def forge(cert):
    """Move the witness point from t = 1/50 to t = 1/5 (printed values left as they were)."""
    c = copy.deepcopy(cert)
    c['t'] = '1/5'
    return c


if __name__ == '__main__':
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        here, '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    r = decide(root)
    print(CASE, '->', r['verdict'])
    print('claim:', r['claim'])
    for c in r['checks']:
        print('  [%s] %s  %s' % ('ok' if c['ok'] else 'NO', c['name'], c['detail']))
    if r['why']:
        print('why:', r['why'])
    f = decide(forge(_load(root)))
    print('forge ->', f['verdict'], '|', f['why'])
    assert f['verdict'] != 'CERTIFIED'
