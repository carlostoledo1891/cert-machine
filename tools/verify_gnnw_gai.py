"""verify_gnnw_gai.py — the "preliminary, unverified" iteration of Gupta, Ndiaye, Norin and Wei, decided.

Standard library only (decimal, fractions), one file, no dependencies: run it on the certificate,
    python3 verify_gnnw_gai.py gnnw-certificate.json
and it re-decides every interval (about ten seconds). Written from arXiv 2407.19026v2 (29 August 2026).

THE CLAIM (GNNW v2, the remark after Theorem 1, p. 20): "We asked ChatGPT 5.6 Sol to perform an additional
iteration of optimization in Theorem 14. A preliminary, unverified iteration suggests that Theorem 1 holds with
    G_AI(l) = e^-l (-0.3864 l + 0.8347 l^2 - 2.0156 l^3 + 2.7171 l^4 - 1.7541 l^5 + 0.4522 l^6).
If verified it would improve the upper bound on the diagonal Ramsey numbers to R(k,k) <= (3.78233...)^(k+o(k))."

WHAT IS CHECKED is GNNW's Theorem 14 (proved in the paper) for
    F(l) = h(l) + q(l) e^-l,  h(l) = (1+l) ln(1+l) - l ln l,  q the sextic above,
    M(l) = l m(l), m continuous and piecewise linear through the certificate's rationals (its "m" block),
    X(l) = (1 - e^-F'(l))^(1/(1-M(l))) (1 - M(l)),
    Y(l) = Y_f(X(l)), Lemma 15's function for f = F_0.03 = h + (-l/4 + 3l^2/100 + 2l^3/25) e^-l,
which Theorem 1 of the same paper proves is an upper bound (R(k,l) <= e^{F_0.03(l/k)k + o(k)}); Lemma 15 then places
(x, Y_f(x)) in R for every x in (0, 1). Theorem 14 needs, for every l in (0, 1]: F' > 0, M and X and Y in (0, 1),
(X, Y) in R, and the strict inequality
    slack(l) := F(l) + (1/2)(ln X(l) + l ln M(l) + l ln Y(l)) > 0.
Then R(k, l) <= e^{F(l/k)k + o(k)} for k >= l, and at l = k the base is e^{F(1)} = 4 e^{G_AI(1)} = 3.78233...
The functions M and Y are this program's choice (the remark names neither); Theorem 14 asks only that some exist.

A CHAIN ({"steps": [...]}, certs/gnnw-chain-certificate.json) applies the theorem again and again: step 1 in the region of
F_0.03; step k in the region of the bound F_{k-1} = h + q_{k-1} e^-l that step k-1 establishes, after Lemma 15's
hypotheses for that bound (strictly concave, increasing, 2f'(1) - f(1) > 0) are decided here on intervals.

HOW (Decimal intervals, every operation in a named context; ln and exp correctly rounded and widened one ulp):
  * on [L0, 1], split at the nodes of m (so M is smooth on each piece) and bisected adaptively, the mean-value form
        slack([a, b]) is inside slack(mid) + slack'([a, b]) [-(b-a)/2, (b-a)/2],
    with slack' written out: F'' , M', (ln X)' = F'' u/((1-u)(1-M)) + ln(1-u) M'/(1-M)^2 - M'/(1-M) (u = e^-F'),
    and (ln Y)' = -kappa (ln X)', kappa = 1/t, 1 or t on Lemma 15's three branches (GNNW, Appendix A);
  * on (0, L0], the same slack divided by l with the ln l terms cancelled by hand (they cancel exactly: -l ln l in F,
    (1/2) l ln l in l ln M, (1/2) l ln l in l ln Y through t = l tau), so S = slack/l is evaluated on intervals that
    contain 0, with ln(1+z)/z and ln(1-z)/z bounded by their alternating-series brackets.
The float solves that locate each branch parameter t are proposers; each t is then bracketed by interval evaluation.
"""
import json
import math
import os
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN
from fractions import Fraction as Fr

PREC = 40
_E = dict(Emax=10 ** 6, Emin=-10 ** 6)
DN = Context(prec=PREC, rounding=ROUND_FLOOR, **_E)
UP = Context(prec=PREC, rounding=ROUND_CEILING, **_E)
NE = Context(prec=PREC, rounding=ROUND_HALF_EVEN, **_E)

Q_AI = [Fr(Decimal(s)) for s in ('-0.3864', '0.8347', '-2.0156', '2.7171', '-1.7541', '0.4522')]   # replaced by the certificate's q
P03 = [Fr(-1, 4), Fr(3, 100), Fr(8, 100)]   # GNNW Theorem 1's G: the PROVED bound whose Lemma 15 region the first step uses; never read from a certificate
PR = P03   # the region's q: F_0.03 for the first step of a chain, then each step's own certified q


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

    @staticmethod
    def span(a, b):
        return Iv(Iv.q(a).lo, Iv.q(b).hi)

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

    def hull(a, b):
        return Iv(min(a.lo, b.lo), max(a.hi, b.hi))

    def mag(a):
        return max(abs(a.lo), abs(a.hi))

    def f(a):
        return (float(a.lo), float(a.hi))


def horner(coeffs, x, shift):
    """sum_i c_i x^(i+shift) for an interval x (shift = 0 or 1)"""
    acc = Iv.q(0)
    for c in reversed(coeffs):
        acc = acc * x + c
    return acc * x if shift else acc


def dcoef(c):
    """coefficients of p' when p = sum c_i x^(i+1): p'(x) = sum (i+1) c_i x^i"""
    return [(i + 1) * a for i, a in enumerate(c)]


def ddcoef(c):
    """p'' = sum (i+1) i c_i x^(i-1), as coefficients of x^0.."""
    return [(i + 1) * i * a for i, a in enumerate(c)][1:]


# ---------- the functions of one variable ----------
def Fp_of(c, x):
    """F'(x) = ln(1+x) - ln x + (q'(x) - q(x)) e^-x"""
    return (1 + x).ln() - x.ln() + (horner(dcoef(c), x, 0) - horner(c, x, 1)) * (-x).exp()


def F_of(c, x):
    return (1 + x) * (1 + x).ln() - x * x.ln() + horner(c, x, 1) * (-x).exp()


def Fpp_of(c, x):
    """F''(x) = -1/(x(1+x)) + e^-x (q'' - 2q' + q)"""
    qq = horner(ddcoef(c), x, 0) if len(c) > 1 else Iv.q(0)
    return -(1 / (x * (1 + x))) + (qq - 2 * horner(dcoef(c), x, 0) + horner(c, x, 1)) * (-x).exp()


def beta(t):
    """beta(t) = f(t) - t f'(t) = ln(1+t) - (t p'(t) - (1+t) p(t)) e^-t for f = F_0.03: B(t) = e^-beta(t); increasing"""
    return (1 + t).ln() - (t * horner(dcoef(PR), t, 0) - (1 + t) * horner(PR, t, 1)) * (-t).exp()


def fprime(t):
    return Fp_of(PR, t)


# floats, for proposing only
def _ffp(t):
    p = sum(a * t ** (i + 1) for i, a in enumerate(map(float, PR)))
    dp = sum((i + 1) * a * t ** i for i, a in enumerate(map(float, PR)))
    return math.log((1 + t) / t) + (dp - p) * math.exp(-t)


def _fbeta(t):
    p = sum(a * t ** (i + 1) for i, a in enumerate(map(float, PR)))
    dp = sum((i + 1) * a * t ** i for i, a in enumerate(map(float, PR)))
    return math.log1p(t) - (t * dp - (1 + t) * p) * math.exp(-t)


def _fsolve(fun, target, increasing):
    lo, hi = 1e-300, 2.0
    for _ in range(1100):
        mid = math.sqrt(lo * hi) if hi / lo > 4 else (lo + hi) / 2
        try:
            v = fun(mid)
        except (ValueError, OverflowError):
            v = math.inf
        if (v < target) == increasing:
            lo = mid
        else:
            hi = mid
        if hi - lo <= 1e-16 * hi:
            break
    return (lo + hi) / 2


def bracket(fun_iv, fun_f, s, increasing):
    """[t1, t2] containing every t with fun(t) in the interval s, decided by intervals; fun monotone on (0, 2)"""
    lo_t = _fsolve(fun_f, float(s.lo) if increasing else float(s.hi), increasing)
    hi_t = _fsolve(fun_f, float(s.hi) if increasing else float(s.lo), increasing)
    t1 = t2 = None
    for rel in (1e-13, 1e-11, 1e-9, 1e-7, 1e-5, 1e-3, 1e-2):
        c = Fr(lo_t * (1 - rel))
        v = fun_iv(Iv.q(c))
        if (increasing and v.hi < s.lo) or (not increasing and v.lo > s.hi):
            t1 = c
            break
    for rel in (1e-13, 1e-11, 1e-9, 1e-7, 1e-5, 1e-3, 1e-2):
        c = Fr(hi_t * (1 + rel))
        v = fun_iv(Iv.q(c))
        if (increasing and v.lo > s.hi) or (not increasing and v.hi < s.lo):
            t2 = c
            break
    if t1 is None or t2 is None:
        raise ArithmeticError('no bracket for the branch parameter near %r..%r' % (lo_t, hi_t))
    return t1, t2


ONE = Iv.q(1)
LN_a = LN_b = F03_1 = None


def set_region(coeffs):
    """the region Y_f comes from: f = h + q e^-l for q = coeffs (a bound already established); a = A(1), b = B(1)"""
    global PR, LN_a, LN_b, F03_1
    PR = list(coeffs)
    LN_a = -fprime(ONE)                           # a = A(1) = e^-f'(1)
    LN_b = -beta(ONE)                             # b = B(1) = e^-beta(1)
    F03_1 = F_of(PR, ONE)


set_region(P03)


def region_ok(coeffs):
    """Lemma 15's hypotheses for f = h + q e^-l on (0, 1]: f'' < 0 (strictly concave), f' > 0, and 2f'(1) - f(1) > 0,
    which with (1+t) f'' < 0 gives A < B; A = e^-f' rises from 0 and B = e^(t f' - f) falls from 1 because q(0) = 0.
    Decided on intervals down to 1e-9; below it -1/(t(1+t)) < -4e8 and ln(1/t) > 20 dominate the polynomial terms,
    whose size on [0, 1] is at most K = sum |c_i| ((i+1)^2 + 1) (checked < 1e6)."""
    K = sum(abs(c) * ((i + 1) ** 2 + 1) for i, c in enumerate(coeffs))
    if K >= 10 ** 6:
        return False, 'coefficients too large for the tail argument'
    stack = [(Fr(1, 10 ** 9), Fr(1))]
    while stack:
        a, b = stack.pop()
        X = Iv.span(a, b)
        if Fpp_of(coeffs, X).hi < 0 and Fp_of(coeffs, X).lo > 0:
            continue
        if b - a < Fr(1, 10 ** 12):
            return False, 'f\'\' < 0 or f\' > 0 not decided near %s' % float(a)
        m = (a + b) / 2
        stack += [(a, m), (m, b)]
    if not (2 * Fp_of(coeffs, ONE) - F_of(coeffs, ONE)).lo > 0:
        return False, '2f\'(1) - f(1) > 0 not decided'
    return True, 'strictly concave and increasing on (0, 1]; A < B'


def lnY_at(lnx):
    """ln Y_f(x) and kappa (d ln Y / d ln x = -kappa) for x = e^lnx, lnx an interval. Y_f is continuous and
    decreasing, so the hull of the enclosures on each branch the interval meets encloses ln Y over it."""
    out = [None, None]

    def put(v, k):
        out[0] = v if out[0] is None else out[0].hull(v)
        out[1] = k if out[1] is None else out[1].hull(k)
    if lnx.hi >= LN_b.lo:                     # x >= b: B(t) = x, beta(t) = -ln x, ln Y = ln A(t) = -f'(t), kappa = 1/t
        s = Iv(lnx.hi.copy_negate(), min(lnx.lo.copy_negate(), (-LN_b).hi))
        t1, t2 = bracket(beta, _fbeta, s, True)
        T = Iv.span(t1, t2)
        put(-fprime(T), 1 / T)
    lo, hi = max(lnx.lo, LN_a.lo), min(lnx.hi, LN_b.hi)
    if lo <= hi:                              # a <= x <= b: ln Y = -f(1) - ln x, kappa = 1
        put(-F03_1 - Iv(lo, hi), Iv.q(1))
    if lnx.lo <= LN_a.hi:                     # x <= a: A(t) = x, f'(t) = -ln x, ln Y = ln B(t) = -beta(t), kappa = t
        s = Iv(max(lnx.hi.copy_negate(), (-LN_a).lo), lnx.lo.copy_negate())
        t1, t2 = bracket(fprime, _ffp, s, False)
        T = Iv.span(t1, t2)
        put(-beta(T), T)
    return out[0], out[1]


# ---------- M ----------
def load_m(block):
    N = block['N']
    vals = [Fr(Decimal(v)) for v in [block['m0']] + block['values']]
    if len(vals) != N + 1 or any(v <= 0 for v in vals):
        raise ValueError('REFUSED: m needs N + 1 positive node values')
    return N, vals


class Mfun:
    def __init__(self, N, vals):
        self.N, self.v = N, vals

    def piece(self, j):
        """m on [j/N, (j+1)/N] is v_j + s (x - j/N), s = N (v_{j+1} - v_j)"""
        return self.v[j], self.N * (self.v[j + 1] - self.v[j]), Fr(j, self.N)

    def m(self, j, x):
        v, s, x0 = self.piece(j)
        return v + s * (x - x0)


# ---------- slack and its derivative on [L0, 1] ----------
def parts(x, Mx, Mp):
    """F, F', ln X, (ln X)' pieces at an interval x with M = Mx, M' = Mp"""
    Fp = Fp_of(Q_AI, x)
    u = (-Fp).exp()
    one_m = 1 - Mx
    lnE1 = (1 - u).ln()
    lnX = lnE1 / one_m + one_m.ln()
    return Fp, u, one_m, lnE1, lnX


def slack_point(x, mfun, j):
    X = Iv.q(x)
    mx = Iv.q(mfun.m(j, x))
    Mx = X * mx
    Fp, u, one_m, lnE1, lnX = parts(X, Mx, None)
    lnY, _ = lnY_at(lnX)
    return F_of(Q_AI, X) + (lnX + X * Mx.ln() + X * lnY) * Fr(1, 2), lnX, Fp, Mx


def dslack(a, b, mfun, j):
    X = Iv.span(a, b)
    v, s, x0 = mfun.piece(j)
    mx = Iv.q(v) + Iv.q(s) * (X - x0)
    Mx = X * mx
    Mp = mx + X * s
    Fp, u, one_m, lnE1, lnX = parts(X, Mx, Mp)
    Fpp = Fpp_of(Q_AI, X)
    dlnX = Fpp * u / ((1 - u) * one_m) + lnE1 * Mp / (one_m * one_m) - Mp / one_m
    lnY, kap = lnY_at(lnX)
    dlnY = -(kap * dlnX)
    return Fp + (dlnX + Mx.ln() + X * Mp / Mx + lnY + X * dlnY) * Fr(1, 2), Fp, Mx, lnX


# ---------- S = slack / l on (0, L0], ln l cancelled ----------
TINY = Decimal('1e-15')


def l1(z):
    """ln(1+z)/z over an interval z >= 0. It decreases in z, so the ends come from the ends; each end is an interval
    ln over its point when z is not tiny, and the bracket 1 - z/2 <= ln(1+z)/z <= 1 below 1e-15 (1 at z = 0)."""
    def at(v, want_lo):
        if v == 0:
            return Decimal(1)
        if v < TINY:
            return DN.subtract(Decimal(1), UP.divide(v, Decimal(2))) if want_lo else Decimal(1)
        r = (1 + Iv(v)).ln() / Iv(v)
        return r.lo if want_lo else r.hi
    return Iv(at(z.hi, True), at(z.lo, False))


def g1(z):
    """ln(1-z)/z over an interval 0 <= z < 1. It decreases in z; ends as in l1, with the bracket
    -1 - z/(2(1-z)) <= ln(1-z)/z <= -1 - z/2 below 1e-15 (-1 at z = 0)."""
    def at(v, want_lo):
        if v == 0:
            return Decimal(-1)
        if v < TINY:
            w = Iv(v)
            return (-1 - w / (2 * (1 - w))).lo if want_lo else (-1 - w / 2).hi
        r = (1 - Iv(v)).ln() / Iv(v)
        return r.lo if want_lo else r.hi
    return Iv(at(z.hi, True), at(z.lo, False))


def S_tail(a, b, mfun):
    """slack/l over l in [a, b], 0 <= a < b <= 1/N, on the B-branch of Y_f (checked)"""
    X = Iv.span(a, b)
    v, s, x0 = mfun.piece(0)
    mx = Iv.q(v) + Iv.q(s) * X
    Mx = X * mx
    Q = horner(Q_AI, X, 0)                                        # q(l)/l
    dq_minus_q = horner(dcoef(Q_AI), X, 0) - horner(Q_AI, X, 1)
    u_over_l = (-(dq_minus_q * (-X).exp())).exp() / (1 + X)       # e^-F' / l
    u = X * u_over_l
    lnX_over_l = g1(u) * u_over_l / (1 - Mx) + g1(Mx) * mx          # ln(1-u)/((1-M) l) + ln(1-M)/l
    lnX = X * lnX_over_l
    if lnX.lo <= LN_b.hi:
        raise ArithmeticError('the tail left the B-branch')
    if not beta(Iv.q(Fr(1, 2))).lo > (-lnX).hi:
        raise ArithmeticError('the branch parameter may exceed 1/2 on the tail')
    # tau = t / l from beta(t) = -ln X, beta(t)/t = ln(1+t)/t - e^-t (p'(t) - (1+t) p(t)/t)
    # an a-priori upper end for t: the first g in 1.5 s, 3 s, ... (s = the upper end of -ln X) with beta(g) > s; beta increases
    sup = float((-lnX).hi)
    g = None
    for mult in (1.5, 3, 6, 12, 24):
        cand = Fr(min(sup * mult, 0.5))
        if beta(Iv.q(cand)).lo > (-lnX).hi:
            g = cand
            break
    if g is None:
        raise ArithmeticError('no a-priori bound for the branch parameter on the tail')
    T = Iv(Decimal(0), Iv.q(g).hi)
    tau = None
    for _ in range(4):
        bt = l1(T) - (-T).exp() * (horner(dcoef(PR), T, 0) - (1 + T) * horner(PR, T, 0))
        tau = (-lnX_over_l) / bt
        T2 = X * tau
        T = Iv(max(T2.lo, Decimal(0)), min(T2.hi, T.hi))
    lnY_rest = tau.ln() - (1 + T).ln() - (horner(dcoef(PR), T, 0) - horner(PR, T, 1)) * (-T).exp()
    S = (1 + X) * l1(X) + Q * (-X).exp() + lnX_over_l * Fr(1, 2) + mx.ln() * Fr(1, 2) + lnY_rest * Fr(1, 2)
    # F' = ln(1+l) - ln l + (q' - q) e^-l >= -ln b + (q' - q) e^-l on (0, b]
    Fp_lo = (-(Iv(X.hi).ln()) + dq_minus_q * (-X).exp()).lo
    return S, u, Mx, lnX, Fp_lo


def certify(cert, log=None):
    """cert: {'q': [...], 'm': {...}} — one iteration in the region of F_0.03 — or {'steps': [{'q', 'm'}, ...]}, a chain in
    which step k's region is the bound step k-1 established (its Lemma 15 hypotheses decided here first)."""
    if 'steps' in cert:
        region, results = P03, []
        for k, st in enumerate(cert['steps']):
            okr, why = region_ok(region)
            if not okr:
                raise ArithmeticError('step %d: the region fails Lemma 15\'s hypotheses: %s' % (k + 1, why))
            set_region(region)
            r = certify_step(st, log)
            r['regionOk'] = why
            results.append(r)
            region = [Fr(Decimal(x)) for x in st['q']]
        set_region(P03)
        last = results[-1]
        return {'claim': 'a chain of %d iterations of GNNW Theorem 14, each in the region of the bound before it (the first in F_0.03\'s); so R(k,k) <= e^{F(1)(k+o(k))} for the last' % len(results),
                'verdict': 'CERTIFIED', 'c': last['c'], 'steps': results}
    set_region(P03)
    return certify_step(cert, log)


def certify_step(cert, log=None):
    global Q_AI
    Q_AI = [Fr(Decimal(x)) for x in cert['q']]
    N, vals = load_m(cert['m'])
    L0 = Fr(1, N)
    mf = Mfun(N, vals)
    stats = {'tailIntervals': 0, 'mainIntervals': 0, 'minTailS': None, 'minMainLower': None, 'minFp': None,
             'maxM': None, 'minX': None, 'maxX': None, 'worst': None}

    def note(k, v, better):
        if stats[k] is None or better(v, stats[k]):
            stats[k] = v
    # the tail: S = slack/l > 0 on (0, L0]
    stack = [(Fr(0), L0)]
    while stack:
        a, b = stack.pop()
        S, u, Mx, lnX, Fp_lo = S_tail(a, b, mf)
        if S.lo > 0 and Mx.hi < 1 and Mx.lo >= 0 and u.hi < 1 and Fp_lo > 0:
            stats['tailIntervals'] += 1
            note('minTailS', float(S.lo), lambda x, y: x < y)
            continue
        if b - a < Fr(1, 10 ** 12):
            raise ArithmeticError('tail refused at [%s, %s]: S in %r' % (a, b, S.f()))
        m = (a + b) / 2
        stack += [(a, m), (m, b)]
    # the main part: slack > 0 on [L0, 1], piece by piece
    for j in range(1, N):
        stack = [(Fr(j, N), Fr(j + 1, N))]
        while stack:
            a, b = stack.pop()
            m = (a + b) / 2
            sm, lnXm, Fpm, Mm = slack_point(m, mf, j)
            ds, Fp, Mx, lnX = dslack(a, b, mf, j)
            lower = DN.subtract(sm.lo, UP.multiply(ds.mag(), Iv.q((b - a) / 2).hi))
            if lower > 0 and Fp.lo > 0 and Mx.hi < 1 and Mx.lo > 0 and lnX.hi < 0:
                stats['mainIntervals'] += 1
                note('minMainLower', float(lower), lambda x, y: x < y)
                if stats['minMainLower'] == float(lower):
                    stats['worst'] = [float(a), float(b)]
                note('minFp', float(Fp.lo), lambda x, y: x < y)
                note('maxM', float(Mx.hi), lambda x, y: x > y)
                continue
            if b - a < Fr(1, 10 ** 9):
                raise ArithmeticError('refused at [%s, %s]: slack(mid) %r, slack\' %r' % (float(a), float(b), sm.f(), ds.f()))
            stack += [(a, m), (m, b)]
        if log:
            log(j, stats)
    c = (F_of(Q_AI, ONE)).exp()
    return {'claim': 'GNNW Theorem 14 holds for F = h + q e^-l with the certificate\'s q and M and Y = Y_f(X), f = F_0.03, on all of (0, 1]; so R(k,k) <= e^{F(1)(k+o(k))}',
            'verdict': 'CERTIFIED', 'c': [str(c.lo)[:32], str(c.hi)[:32]], 'stats': stats}


if __name__ == '__main__':
    import sys
    import time
    if len(sys.argv) < 2:
        sys.exit('usage: python3 verify_gnnw_gai.py gnnw-certificate.json | gnnw-chain-certificate.json')
    cert = json.load(open(sys.argv[1]))
    t0 = time.time()
    try:
        r = certify(cert)
    except (ArithmeticError, ValueError) as e:
        print('REFUSED: ' + str(e))
        sys.exit(1)
    for k, st in enumerate(r.get('steps', [r])):
        print('CERTIFIED%s: Theorem 14 of Gupta-Ndiaye-Norin-Wei holds on all of (0, 1] for F = h + q e^-l with this M and Y = Y_f(X), f = %s' % (
            ' step %d' % (k + 1) if 'steps' in r else '', 'F_0.03' if k == 0 else 'the bound of step %d' % k))
        print('  %d tail intervals, %d main intervals, smallest certified lower bound %.3e; base in [%s, %s]' % (
            st['stats']['tailIntervals'], st['stats']['mainIntervals'], st['stats']['minMainLower'], st['c'][0][:14], st['c'][1][:14]))
    print('  %.1f s' % (time.time() - t0))
    print('  so R(k,k) <= c^(k+o(k)) with c = e^F(1) in [%s, %s]' % (r['c'][0], r['c'][1]))
