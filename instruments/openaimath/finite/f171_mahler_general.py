"""F-171 — "The Mahler Conjecture for General Convex Bodies" (openai/math family 087).

THE CLAIM (build/abstract.tex lines 1-5): for every convex body K in R^n, n >= 1, with Santalo point s(K),
|K| |(K - s(K))°| >= (n+1)^(n+1)/(n!)^2, with equality exactly for simplices.

WHERE THE FINITE CHECKS ENTER. The proof (sections 01-06, 09) reduces the inequality to Laplace transforms of a cone
and its dual, Moreau projections of a Gaussian, an entropy/Jensen bound, Hermite and covariance estimates, a layer
defect and a matrix divided-difference argument. Every dimension-free scalar fact it uses is collected in ONE
interface, Proposition prop:scalar-input (build/sections/01-cones.tex lines 138-179): three bullets (pointwise
profile bounds and the three covariance inequalities; the two pointwise layer inequalities (3); the strict segment
inequality (4)). Appendix 07 (build/sections/07-scalar.tex) proves the first two bullets and Appendix 08
(build/sections/08-segments.tex) the third, each by finite rational certificates plus analytic interpolation and
tail arguments. THIS DECIDER CHECKS THE FINITE CERTIFICATES OF THOSE TWO APPENDICES, AND NOTHING ELSE.

WHAT IS DECIDED HERE, AND HOW (standard library; exact rationals; transcendentals enclosed by an outward-rounded
fixed-point interval kernel at 2^-340 with proved series remainders: exp by halving + Taylor (remainder 3|z|^61/61!),
log by 2 atanh((m-1)/(m+1)) with geometric tail, pi by Machin with the alternating-series bound, sin/cos by Taylor
with the Lagrange bound, the Mills ratio Y by the erf Taylor series for x <= 5/2 (tail <= twice the first omitted
term) and by the Laplace continued fraction 0 < T_N < N/x, T_m = m/(x + T_{m+1}) for x > 5/2 — both enclosures
written here; they agree where they overlap. NO float enters a decision.)
  F1  Lemma lem:scalar-certificates (07 lines 138-178): the 17 profiles d .. n_q enclosed at all 152 nodes
      t_i = i/40 (widths ~1e-87); every value hull, every |Delta^2| bound (reflection at i = -1 by parity), every
      |Delta| bound, the four simultaneous bounds (U_*, the three covariance expressions), the restricted ranges
      on 56..144 and 45..144, and both finite integral sums (inside the printed [.1250504493, .1250504494] and
      [.3344848649, .3344848650]).
  F2  Lemma lem:scalar-layer (07 lines 902-1012): the nine-row q / S_q / V_2 / rho table rebuilt from the node
      enclosures plus the stated errors and tail bounds; the 81 rectangle pairs x 4 vertices; the auxiliary
      inequalities. And the chord-error chain of 07 lines 470-591 (every displayed inequality, exact).
  F3  The stable formulas (07 lines 97-109) proved as identities in the differential field Q(x, phi, p, f, j)
      with phi' = -x phi, p' = phi, f' = -phi(1-p)/p, j' = phi p/(1-p): d, K, g', g'' = x g' - K, R_v, V_2, D_1, D_2,
      G_3, G_4 — exact symbolic algebra (so the node values above are values of the paper's DEFINED profiles).
      The conversions to t-derivatives (F-dot = a_t F', F-ddot = a_t^2 F'' + x F', n_F = a_t^2 F''), the q-derivative
      formulas, S_q = 2q + tanh(t)(1 + a_t^-2) q-dot - a_t^-2 q-ddot and rho were re-derived by hand (chain rule; x/a_t =
      tanh t), not by machine.
  F4  The arithmetic steps of Lemma lem:scalar-strip (07 lines 279-375).
  F5  The constants of Lemma lem:scalar-interpolation: 4387/8192, the .000007336661 remainder, the Cauchy constant.
  F6  Lemma lem:segment-auxiliary (08 lines 431-742): the four eps_j identities, all 32 threshold sums and the 64
      concavity endpoint comparisons, the starred primitive samples and the nine-row sample table, D(0) against its
      closed form, the monotonicity line.
  F7  The middle-width certificates (08 lines 980-1075): T_(4), T_(5) built exactly from their definitions (degrees
      32 and 30), their Bernstein coefficients on [.16, .54], the four printed group lower bounds each (all eight
      reproduce as floors), and the P_u / F_* tail constants.
  F8  The cubic R/h^2 table (08 lines 905-971): each of 7 x 5 rounded entries against its formula, the seven cubic
      maxima from the rounded entries.
  F9  The larger-width table (08 lines 1077-1117), three rows x seven entries and the budget comparisons.
  F10 The tail lemma vectors on x >= 64 and its consequences (07 lines 596-885); the short-width bound .55510;
      the three tail cases of 08 lines 259-394; the final h >= pi/w budgets (08 lines 1119-1181).

WHAT IS NOT DECIDED (theory — read, not machine-checked):
  - All of sections 01-06 and 09: the cone/polar reduction, Moreau projections and the bias existence, the
    entropy/Jensen step, the Hermite/inverse-generator covariance estimates, the layer defect, the divided-difference
    and equality arguments, and the functional consequences. The finite checks feed ONE interface,
    Proposition prop:scalar-input; whether that proposition suffices for the theorem is not examined here.
  - Inside the appendices, the analysis that turns finite data into statements on the real line: analyticity and
    complex bounds on the strip |Im t| <= .45 (only its arithmetic is checked), the interpolation-remainder theory
    and Cauchy estimates, the chord-product identity and the convexity arguments, the representation formulas and
    the "majorant vector" calculus of the tail lemma (only the vector arithmetic is checked), the segment reduction
    identities (A_h, B_h, f_0^*, p_a, p_d, V_u >= f_0^* + V_q), Lemma lem:segment-chord, the concentration /
    layer-cake arguments, the q-variance lower bound, the angular quadratic-form diagonalization, the monotonicity of
    p and f on [.54, pi/w], the series tails of P_u and F_* beyond the first omitted term, and the case coverage of
    all (m, h).
  - The paper's own enclosure RULES are not replayed: the nodes are enclosed by the rules above, independently; what
    is decided is that the true node values satisfy every printed bound.
"""
import math
import os
import re
import sys
import time
from fractions import Fraction as Fr
from math import comb, factorial, isqrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

BASE = 'preprints/The-Mahler-Conjecture-for-General-Convex-Bodies-September-22-2026/build/'
ABSTRACT = BASE + 'abstract.tex'
CONES = BASE + 'sections/01-cones.tex'
SCALAR = BASE + 'sections/07-scalar.tex'
SEGMENTS = BASE + 'sections/08-segments.tex'

# ---------------------------------------------------------------------------------------------------------------
# an outward-rounded interval kernel: endpoints are integers over 2^PREC (fixed point); every operation rounds the
# lower endpoint down and the upper endpoint up, so the true value of every expression lies in its interval.
# ---------------------------------------------------------------------------------------------------------------

PREC = 340
SC = 1 << PREC


def _ce(n, d):
    return -((-n) // d)


class Iv:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi):
        assert lo <= hi, (lo, hi)
        self.lo, self.hi = lo, hi

    @staticmethod
    def q(x):
        x = Fr(x)
        return Iv((x.numerator * SC) // x.denominator, _ce(x.numerator * SC, x.denominator))

    @staticmethod
    def hull(a, b):
        return Iv(min(a.lo, b.lo), max(a.hi, b.hi))

    def __add__(a, b):
        b = cv(b)
        return Iv(a.lo + b.lo, a.hi + b.hi)
    __radd__ = __add__

    def __neg__(a):
        return Iv(-a.hi, -a.lo)

    def __sub__(a, b):
        b = cv(b)
        return Iv(a.lo - b.hi, a.hi - b.lo)

    def __rsub__(a, b):
        return cv(b) - a

    def __mul__(a, b):
        b = cv(b)
        ps = (a.lo * b.lo, a.lo * b.hi, a.hi * b.lo, a.hi * b.hi)
        return Iv(min(ps) >> PREC, -((-max(ps)) >> PREC))
    __rmul__ = __mul__

    def __truediv__(a, b):
        b = cv(b)
        assert b.lo > 0 or b.hi < 0, 'division by an interval containing 0'
        los = [(x * SC) // y for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        his = [_ce(x * SC, y) for x in (a.lo, a.hi) for y in (b.lo, b.hi)]
        return Iv(min(los), max(his))

    def __rtruediv__(a, b):
        return cv(b) / a

    def sq(a):
        if a.lo >= 0:
            return a * a
        if a.hi <= 0:
            return (-a) * (-a)
        m = max(-a.lo, a.hi)
        return Iv(0, -((-(m * m)) >> PREC))

    def __pow__(a, n):
        assert isinstance(n, int) and n >= 0
        if n % 2 == 0 and n > 0:
            return a.sq() ** (n // 2)
        r = Iv(SC, SC)
        for _ in range(n):
            r = r * a
        return r

    def sqrt(a):
        assert a.lo >= 0, 'square root of a possibly negative interval'
        lo = isqrt(a.lo * SC)
        n = a.hi * SC
        hi = isqrt(n)
        if hi * hi < n:
            hi += 1
        return Iv(lo, hi)

    def pos(a):
        return Iv(max(a.lo, 0), max(a.hi, 0))

    def abs(a):
        if a.lo >= 0:
            return a
        if a.hi <= 0:
            return -a
        return Iv(0, max(-a.lo, a.hi))

    def meet(a, b):
        b = cv(b)
        lo, hi = max(a.lo, b.lo), min(a.hi, b.hi)
        assert lo <= hi, 'empty intersection'
        return Iv(lo, hi)

    @property
    def L(a):
        return Fr(a.lo, SC)

    @property
    def H(a):
        return Fr(a.hi, SC)

    def width(a):
        return Fr(a.hi - a.lo, SC)

    def __repr__(a):
        return '[%.12g, %.12g]' % (a.lo / SC, a.hi / SC)


def cv(x):
    return x if isinstance(x, Iv) else Iv.q(x)


def imin(*xs):
    return Iv(min(x.lo for x in xs), min(x.hi for x in xs))


def err(e):
    """the interval [-e, e]"""
    e = Fr(e)
    return Iv(-_ce(e.numerator * SC, e.denominator), _ce(e.numerator * SC, e.denominator))


# elementary functions with proved remainders --------------------------------------------------------------------

def exp_iv(x):
    """e^x for an interval x: halve until |z| <= 1/16, Taylor to order 60 with remainder <= 3|z|^61/61!, square back"""
    m = max(abs(x.lo), abs(x.hi))
    k = 0
    while m > (SC >> 4):
        m >>= 1
        k += 1
    z = Iv(x.lo, x.hi) if k == 0 else x / (1 << k)
    s, t = Iv(SC, SC), Iv(SC, SC)
    for n in range(1, 61):
        t = t * z / n
        s = s + t
    zz = max(abs(z.lo), abs(z.hi)) + 1
    s = s + err(3 * Fr(zz, SC) ** 61 / factorial(61))
    for _ in range(k):
        s = s.sq()
    return s


_cache = {}


def ln2():
    """log 2 = 2 atanh(1/3); terms y^(2m+1)/(2m+1), remainder <= 2 y^(2M+3) / ((2M+3)(1-y^2))"""
    if 'ln2' not in _cache:
        _cache['ln2'] = _atanh2(Fr(1, 3))
    return _cache['ln2']


def _atanh2(y):
    """2 atanh(y) for a rational 0 <= y <= 1/3"""
    y = Fr(y)
    yi, y2 = Iv.q(y), Iv.q(y * y)
    s, t = Iv(0, 0), yi
    M = 130
    for m in range(M + 1):
        s = s + t / (2 * m + 1)
        t = t * y2
    rem = 2 * y ** (2 * M + 3) / ((2 * M + 3) * (1 - y * y))
    return 2 * s + Iv(0, _ce(rem.numerator * SC, rem.denominator))


def log_q(r):
    """log of a positive rational: r = 2^e m, m in [1, 2), log m = 2 atanh((m-1)/(m+1))"""
    r = Fr(r)
    assert r > 0
    e = r.numerator.bit_length() - r.denominator.bit_length()
    m = r / Fr(2) ** e
    while m >= 2:
        m /= 2
        e += 1
    while m < 1:
        m *= 2
        e -= 1
    return e * ln2() + _atanh2((m - 1) / (m + 1))


def log_iv(x):
    assert x.lo > 0
    return Iv(log_q(x.L).lo, log_q(x.H).hi)


def pi_iv():
    """pi = 16 atan(1/5) - 4 atan(1/239); alternating series with decreasing terms, remainder below the next term"""
    if 'pi' not in _cache:
        def atan_inv(n, M):
            s = Fr(0)
            for k in range(M):
                s += Fr((-1) ** k, (2 * k + 1) * n ** (2 * k + 1))
            nxt = Fr(1, (2 * M + 1) * n ** (2 * M + 1))
            return s, nxt
        a, ea = atan_inv(5, 160)
        b, eb = atan_inv(239, 60)
        v = 16 * a - 4 * b
        e = 16 * ea + 4 * eb
        _cache['pi'] = Iv(Iv.q(v - e).lo, Iv.q(v + e).hi)
    return _cache['pi']


def sincos_q(z):
    """(sin z, cos z) for a rational |z| <= 8: Taylor to order 120, remainder <= |z|^121/121!"""
    z = Fr(z)
    zi = Iv.q(z)
    s, c = Iv(0, 0), Iv(0, 0)
    t = Iv(SC, SC)
    for n in range(0, 121):
        if n % 4 == 0:
            c = c + t
        elif n % 4 == 1:
            s = s + t
        elif n % 4 == 2:
            c = c - t
        else:
            s = s - t
        t = t * zi / (n + 1)
    e = err(abs(z) ** 121 / factorial(121))
    return s + e, c + e


def sinhcosh_q(z):
    E = exp_iv(Iv.q(z))
    Ei = 1 / E
    return (E - Ei) / 2, (E + Ei) / 2


# ---------------------------------------------------------------------------------------------------------------
# the parameters (07-scalar.tex lines 12-19; every finite decimal is an exact rational)
# ---------------------------------------------------------------------------------------------------------------

D_ = Fr
b_, c_, r_, s_, w_ = D_('.602'), D_('.365'), D_('.22'), D_('3.6'), D_('4.6')
eta, kap, aR, lam = D_('.022'), D_('1.16'), D_('7.5'), D_('.65')
tm, tp, tc, tr, ms = D_('-.022'), D_('.064'), D_('.021'), D_('.043'), D_('.352')


def kk():
    if 'k' not in _cache:
        _cache['k'] = Iv.q(b_ - c_).sqrt()
    return _cache['k']


def sqrt2pi():
    if 's2p' not in _cache:
        _cache['s2p'] = (2 * pi_iv()).sqrt()
        _cache['ls2p'] = log_iv(2 * pi_iv()) / 2
    return _cache['s2p']


def log_sqrt2pi():
    sqrt2pi()
    return _cache['ls2p']


# ---------------------------------------------------------------------------------------------------------------
# the Gaussian profiles at a point x >= 0 (an interval of tiny width).  Y = int_0^oo e^{-xy-y^2/2} dy is the Mills
# ratio (1-p)/phi.  For x <= 5/2: u = 1 - p = 1/2 - (1/sqrt(2 pi)) sum_m (-1)^m x^(2m+1) / (2^m m! (2m+1)), whose
# terms after M = 140 decrease by a factor <= 1/2, so the tail is at most twice the first omitted term; Y = u/phi.
# For x > 5/2: the Laplace continued fraction T_m = m / (x + T_{m+1}), 0 < T_N < N/x, Y = 1/(x + T_1) (I_m =
# int y^m e^{-xy-y^2/2} dy satisfies m I_{m-1} = x I_m + I_{m+1}); u = Y phi.
# ---------------------------------------------------------------------------------------------------------------

def gauss(x, cf_from=Fr(5, 2), N=1500):
    phi = exp_iv(-(x.sq()) / 2) / sqrt2pi()
    if x.H <= cf_from:
        M = 140
        assert x.H ** 2 <= M + 2
        s, term = Iv(0, 0), x
        for m in range(M + 1):
            s = s + (term / (2 * m + 1) if m % 2 == 0 else -(term / (2 * m + 1)))
            term = term * x.sq() / (2 * (m + 1))
        X = x.H
        tail = 2 * X ** (2 * M + 3) / (2 ** (M + 1) * factorial(M + 1))
        u = Fr(1, 2) - (s + err(tail)) / sqrt2pi()
        Y = u / phi
    else:
        T = Iv(0, _ce(N * SC * SC, x.lo))
        for m in range(N - 1, 0, -1):
            T = m / (x + T)
        Y = 1 / (x + T)
        u = Y * phi
    u = u.meet(Iv(0, SC // 2))
    return phi, Y, u


def h_of(u):
    """h(u) = (-log(1-u) - u)/u^2 = sum_m u^m/(m+2), u <= 1/2: tail after M terms <= 2 u^(M+1)/(M+3)"""
    M = 420
    s, t = Iv(0, 0), Iv(SC, SC)
    for m in range(M + 1):
        s = s + t / (m + 2)
        t = t * u
    U = u.H
    return s + Iv(0, _ce((2 * U ** (M + 1) / (M + 3)).numerator * SC, (2 * U ** (M + 1) / (M + 3)).denominator))


def profiles_at(x, a, th):
    """every profile of 07-scalar.tex lines 97-126 at physical point x, with a = a_t and th = tanh t"""
    phi, Y, u = gauss(x)
    p = 1 - u
    h = h_of(u)
    j = x.sq() / 2 + log_sqrt2pi() - log_iv(Y) - p
    B = 1 - x * Y
    omb = 1 - p * B
    d = B.sq() * j + omb.sq() * h
    K = d + Y.sq() * (j + p.sq() * h) - 1
    g1 = Y * (B * j - omb * p * h)
    g2 = x * g1 - K
    Rv = phi / p - B / Y
    V2 = 2 - (phi / p) * (x + phi / p) - B / Y.sq()
    D1 = x * (2 * d - 1) - Rv - 2 * g1
    D2 = 2 * d + 2 * x * D1 - 2 * g2 - V2
    G3 = x * g2 + 3 * g1 - D1
    G4 = x * G3 + 4 * g2 - D2
    C = -d + Fr(13, 2) * g2
    a2 = a.sq()
    out = {'x': x, 'a': a, 'tanh': th, 'phi': phi, 'Y': Y, 'u': u, 'p': p, 'j': j, 'h': h, 'B': B, 'g1': g1, 'g2': g2,
           'd': d, 'K': K, 'C': C, 'Rv': Rv, 'V2': V2}
    for F, (P_, Q_) in (('d', (D1, D2)), ('K', (D1 - 2 * g1, D2 - 2 * g2)), ('C', (-D1 + Fr(13, 2) * G3, -D2 + Fr(13, 2) * G4))):
        out[F + '_t'] = a * P_
        out[F + '_tt'] = a2 * Q_ + x * P_
        out['n_' + F] = a2 * Q_
    rad = b_ - r_ ** 2 - d
    assert rad.lo > 0, 'radicand of q not positive at a node'
    ell = rad.sqrt()
    q = kk() - ell
    q_t = out['d_t'] / (2 * ell)
    q_tt = (out['d_tt'] / 2 + q_t.sq()) / ell
    n_q = (out['n_d'] / 2 + q_t.sq()) / ell
    ia2 = 1 / a2
    Sq = 2 * q + th * (1 + ia2) * q_t - q_tt * ia2
    rho = r_ * ((2 + w_ ** 2 * ia2).sq() + (1 + ia2).sq() * w_ ** 2 * th.sq()).sqrt()
    out.update({'ell': ell, 'q': q, 'q_t': q_t, 'q_tt': q_tt, 'n_q': n_q, 'Sq': Sq, 'rho': rho})
    return out


def node(i):
    t = Fr(i, 40)
    if i == 0:
        x, a, th = Iv(0, 0), Iv.q(s_), Iv(0, 0)
    else:
        sh, ch = sinhcosh_q(t)
        x, a, th = s_ * sh, s_ * ch, sh / ch
    pr = profiles_at(x, a, th)
    pr['t'] = t
    return pr


# ---------------------------------------------------------------------------------------------------------------
# F1. Lemma lem:scalar-certificates (07-scalar.tex lines 138-178): 152 nodes t_i = i/40
# ---------------------------------------------------------------------------------------------------------------

ROWS = [  # (latex name in the table, profile key, parity for the reflection at i = -1)
    ('d', 'd', 1), ('\\dot d', 'd_t', -1), ('\\ddot d', 'd_tt', 1),
    ('\\mathsf K', 'K', 1), ('\\dot{\\mathsf K}', 'K_t', -1), ('\\ddot{\\mathsf K}', 'K_tt', 1), ('n_{\\mathsf K}', 'n_K', 1),
    ('\\mathsf C', 'C', 1), ('\\dot{\\mathsf C}', 'C_t', -1), ('\\ddot{\\mathsf C}', 'C_tt', 1), ('n_{\\mathsf C}', 'n_C', 1),
    ('R_v', 'Rv', -1), ('V_2', 'V2', 1), ('q', 'q', 1), ('\\dot q', 'q_t', -1), ('\\ddot q', 'q_tt', 1), ('n_q', 'n_q', 1)]


def dec(sn):
    return Fr(sn)


def parse_cert_table(tex):
    i = tex.index('\\begin{lemma}[Finite certificates]')
    j = tex.index('\\end{array}', i)
    body = tex[i:j]
    out = []
    for line in body.split('\n'):
        line = line.strip().rstrip('\\').strip()
        parts = line.split('&')
        if len(parts) != 4 or parts[0].strip() in ('', '\\text{value}'):
            continue
        name, val, d2, d1 = (p.strip() for p in parts)
        if val.startswith('['):
            lo, hi = val.strip('[]').split(',')
            vb = (dec(lo), dec(hi))
        else:
            assert val.startswith('\\pm'), val
            m = dec(val[3:])
            vb = (-m, m)
        out.append((name, vb, None if d2 == '-' else dec(d2), None if d1 == '-' else dec(d1)))
    return out


_nodes = {}


def nodes():
    if not _nodes:
        for i in range(152):
            _nodes[i] = node(i)
    return _nodes


def within(iv, lo, hi):
    return iv.L >= lo and iv.H <= hi


def scalar_certificates(checks, tex, rows_printed=None):
    N = nodes()
    printed = rows_printed or parse_cert_table(tex)
    names = [r[0] for r in printed]
    check(checks, 'F1. the certificate table lists the seventeen rows d .. n_q in order', names == [r[0] for r in ROWS], str(names))
    for (name, key, par), (_, vb, d2, d1) in zip(ROWS, printed):
        vals = [N[i][key] for i in range(152)]
        hull = Iv(min(v.lo for v in vals), max(v.hi for v in vals))
        check(checks, 'F1. %s: every node value (i = 0..151) lies in [%s, %s]' % (key, vb[0], vb[1]), within(hull, *vb),
              'node hull [%.8f, %.8f]' % (float(hull.L), float(hull.H)))
        if d2 is not None:
            ext = [vals[1] * par] + vals
            worst = max((ext[i + 2] - 2 * ext[i + 1] + ext[i]).abs().H for i in range(151))
            check(checks, 'F1. %s: |F_{i+1} - 2F_i + F_{i-1}| <= %s for i = 0..150 (F_{-1} by %s reflection)' % (key, d2, 'even' if par > 0 else 'odd'),
                  worst <= d2, 'max %.8f' % float(worst))
        if d1 is not None:
            worst = max((vals[i + 1] - vals[i]).abs().H for i in range(151))
            check(checks, 'F1. %s: |F_{i+1} - F_i| <= %s for i = 0..150' % (key, d1), worst <= d1, 'max %.8f' % float(worst))
    check(checks, 'F1. b - r^2 - d_i >= .0536 at every node (d_i <= .5), before any q evaluation',
          all((b_ - r_ ** 2 - N[i]['d']).L >= Fr('.0536') for i in range(152)))
    # the simultaneous table (lines 162-169)
    cU = 12 * Fr('.80') / ms ** 2

    def Ustar(n):
        return Fr('1.507') * (-n['n_K']).pos() + cU * (Fr('1.25') * (n['K_t'] + tc * n['C_t']).sq() + 5 * tr ** 2 * n['C_t'].sq())
    U = max(Ustar(N[i]).H for i in range(152))
    c1 = min((lam * tm ** 2 + N[i]['C'] * tm + N[i]['K']).L for i in range(152))
    c2 = max((lam * tp ** 2 + N[i]['C'] * tp + N[i]['K']).H for i in range(152))
    c3 = min((2 * Fr('-.37') * N[i]['C'] - Fr('.37') ** 2 - 4 * lam * N[i]['K']).L for i in range(152))
    flat = ' '.join(tex.split())
    check(checks, 'F1. simultaneous table printed as 0{:}151 & .537 & .00090 & -.00074 & .132',
          '0{:}151&.537&.00090&-.00074&.132' in flat.replace(' ', ''))
    check(checks, 'F1. sup_i U_* <= .537', U <= Fr('.537'), '%.8f' % float(U))
    check(checks, 'F1. inf_i (lambda t_-^2 + C t_- + K) >= .00090', c1 >= Fr('.00090'), '%.8f' % float(c1))
    check(checks, 'F1. sup_i (lambda t_+^2 + C t_+ + K) <= -.00074', c2 <= Fr('-.00074'), '%.8f' % float(c2))
    check(checks, 'F1. inf_i (2(-.37) C - .37^2 - 4 lambda K) >= .132', c3 >= Fr('.132'), '%.8f' % float(c3))
    R = range(56, 145)
    tests = [('0 <= K <= .019', all(within(N[i]['K'], 0, Fr('.019')) for i in R)),
             ('|K_t| <= .0207', all(N[i]['K_t'].abs().H <= Fr('.0207') for i in R)),
             ('n_K >= .00315', all(N[i]['n_K'].L >= Fr('.00315') for i in R)),
             ('-.5 <= C <= -.49512', all(within(N[i]['C'], Fr('-.5'), Fr('-.49512')) for i in R)),
             ('|C_t| <= .0071', all(N[i]['C_t'].abs().H <= Fr('.0071') for i in R)),
             ('q >= .2353', all(N[i]['q'].L >= Fr('.2353') for i in R))]
    for name, ok in tests:
        check(checks, 'F1. for 56 <= i <= 144: %s' % name, ok)
    check(checks, 'F1. for 45 <= i <= 144: q >= .2204', all(N[i]['q'].L >= Fr('.2204') for i in range(45, 145)),
          'min %.6f' % float(min(N[i]['q'].L for i in range(45, 145))))
    sums = {}
    for i in (56, 144):
        acc = Iv(0, 0)
        for jj in range(1, i + 1):
            acc = acc + (N[jj]['a'] - N[jj - 1]['a']) * (N[jj]['K'].pos() - N[jj - 1]['K'].pos())
        sums[i] = N[i]['x'] * (N[i]['K'].pos() + Fr('.238') / 12800) - 40 * acc
    check(checks, 'F1. the finite integral sum at i = 56 is <= .126 and lies in the printed [.1250504493, .1250504494]',
          sums[56].H <= Fr('.126') and within(sums[56], Fr('.1250504493'), Fr('.1250504494')), '%.12f' % float(sums[56].L))
    check(checks, 'F1. the finite integral sum at i = 144 is <= .335 and lies in the printed [.3344848649, .3344848650]',
          sums[144].H <= Fr('.335') and within(sums[144], Fr('.3344848649'), Fr('.3344848650')), '%.12f' % float(sums[144].L))
    return sums


# ---------------------------------------------------------------------------------------------------------------
# F2a. Lemma lem:scalar-layer (07-scalar.tex lines 902-1012): the nine-row enclosure table and the 81 rectangles
# ---------------------------------------------------------------------------------------------------------------

def parse_layer_table(tex):
    i = tex.index('q_{\\min}&q_{\\max}')
    j = tex.index('\\end{array}', i)
    rows = []
    for line in tex[i:j].split('\n')[1:]:
        m = re.match(r'\s*(\d+)\{(?::|\+)\}(\d*)&([\d&]+)\s*(?:\\\\)?\s*$', line)
        if m:
            vals = [int(v) for v in m.group(3).split('&')]
            rows.append((int(m.group(1)), int(m.group(2)) if m.group(2) else None, vals))
    i = tex.index('in the order of the rows of')
    k = tex.rindex('\\[', 0, i)
    mins = [int(v) for v in re.findall(r'\d+', tex[k:i])]
    return rows, mins


def layer_table(checks, tex, rows=None, mins=None):
    N = nodes()
    prow, pmins = parse_layer_table(tex)
    rows = rows or prow
    mins = mins or pmins
    eq, eS, eV = Fr('.000042'), Fr('.003'), Fr('.00101')
    check(checks, 'F2. the V_2 chord error R(.00186) = .536(.00186) + .00001 <= .00101', Fr('.536') * Fr('.00186') + Fr('.00001') <= eV)
    tail = {'q': (Fr('.255'), Fr('.2556')), 'Sq': (Fr('.509'), Fr('.512')), 'V2': (Fr('.999'), Fr('1.001'))}
    k = kk()
    ok_all = True
    bad = []
    for (i0, i1, vals) in rows:
        hi_idx = 144 if i1 is None else i1
        rng = range(i0, hi_idx + 1)
        for col, key, e in ((0, 'q', eq), (2, 'Sq', eS), (4, 'V2', eV)):
            lo = min(N[i][key].L for i in rng) - e
            hi = max(N[i][key].H for i in rng) + e
            if i1 is None:
                lo, hi = min(lo, tail[key][0]), max(hi, tail[key][1])
            if not (Fr(vals[col], 1000) <= lo and Fr(vals[col + 1], 1000) >= hi):
                ok_all = False
                bad.append((i0, key, float(lo), float(hi), vals[col], vals[col + 1]))
        rho_end = (r_ * Iv.q(4 + w_ ** 2).sqrt()) if i1 is None else N[i1]['rho']
        if not Fr(vals[6], 1000) >= rho_end.H:
            ok_all = False
            bad.append((i0, 'rho', float(rho_end.H), vals[6]))
    check(checks, 'F2. the nine-row table of q, S_q, V_2 (sample extremes on each row of |t| through index 144, enlarged by '
          '.000042, .003, .00101; the last row joined with the tail bounds) and rho_max (rho at the row end; r sqrt(4+w^2) for 68+) '
          'bounds every printed entry', ok_all and len(rows) == 9, str(bad[:4]))
    check(checks, 'F2. rho increases in t: 1 - 6/s^2 - 2(w^2+1)/s^4 > .27', 1 - 6 / s_ ** 2 - 2 * (w_ ** 2 + 1) / s_ ** 4 > Fr('.27'))
    T = [(Fr(v[0], 1000), Fr(v[1], 1000), Fr(v[2], 1000), Fr(v[3], 1000), Fr(v[4], 1000), Fr(v[5], 1000), Fr(v[6], 1000)) for _, _, v in rows]
    check(checks, 'F2. the table gives q < k and S_q < 2k (monotonicity of the scalar part of H)',
          max(t[1] for t in T) < k.L and max(t[3] for t in T) < 2 * k.L)
    hs, e0, al = Fr('.5'), Fr('.256'), Fr('2.26')
    bm = (1 + tp) * (b_ - 3 * eta) / (3 * (3 * (b_ + eta) - 4 * c_))
    const = -2 * (b_ + eta + (b_ + eta - kap) * tm) - 2 * e0 * (2 * tr) ** 2 - tr * hs / 2
    coef = tr / (2 * hs) + 1 / al
    got = []
    for iz in range(9):
        best = None
        for ix in range(9):
            qm, qp, _, Sxp, Vm, Vp, _ = T[ix]
            _, _, Szm, Szp, _, _, rz = T[iz]
            Hm = 4 * c_ + 4 * k * qm + 2 * (k - qm) * Szm - 2 * r_ * rz
            Hp = 4 * c_ + 4 * k * qp + 2 * (k - qp) * Szp + 2 * r_ * rz
            for H in (Hm, Hp):
                for V in (Vm, Vp):
                    y = H + V - 2 * kap
                    val = H + tc * y - coef * y.sq() + const - 2 * bm * Szp * Sxp
                    best = val if best is None else imin(best, val)
        got.append(best)
    floors = [math.floor(g.L * 1000) for g in got]
    check(checks, 'F2. the 81 rectangle pairs x 4 vertices: the printed lower bounds %s (min over rows of x of the vertex minimum '
          'of D, times 1000, in the order of the rows of z) hold, and every minimum is positive' % mins,
          len(mins) == 9 and all(Fr(m) <= g.L * 1000 for m, g in zip(mins, got)) and all(g.L > 0 for g in got),
          'recomputed minima x 1000: %s (floors %s; printed %s)' % (', '.join('%.3f' % float(g.L * 1000) for g in got), floors, mins))
    check(checks, 'F2. 4c + 4k(.113) - .113^2 - 1.104^2 > .25', (4 * c_ + 4 * k * Fr('.113') - Fr('.113') ** 2 - Fr('1.104') ** 2).L > Fr('.25'))
    a1 = b_ + eta + kap * tm + Fr('.125')
    l2 = ln2()
    check(checks, 'F2. b + eta + kappa t_- + .125 > 0, 1.053 kappa^2 / [8(...)] < .256, .256 + (log 2 + .25)(2.26)/4 < .80',
          a1 > 0 and Fr('1.053') * kap ** 2 / (8 * a1) < Fr('.256') and (Fr('.256') + (l2 + Fr('.25')) * Fr('2.26') / 4).H < Fr('.80'))
    return got


# ---------------------------------------------------------------------------------------------------------------
# F6. Lemma lem:segment-auxiliary (08-segments.tex lines 431-742): threshold sums, starred primitives, the sample
#     table and the monotonicity line, from the same 145 node enclosures (i = 0..144)
# ---------------------------------------------------------------------------------------------------------------

def R_(M):
    return Fr('.536') * Fr(M) + Fr('.00001')


ALPHA_BETA = {'D': (Fr('.07052'), Fr('.0754')), 'E': (Fr('.281'), Fr('.254')), 'N': (Fr('.24'), Fr('.277')), 'C': (Fr('.728'), Fr('.812'))}
EPS = {'D': Fr('.00040'), 'E': Fr('.00120'), 'N': Fr('.00217'), 'C': Fr('.00741')}


def parse_threshold_table(seg):
    i = seg.index('Row entries give')
    j = seg.index('\\end{array}', i)
    rows = re.findall(r'([DENC])&([\d&]+)', seg[i:j])
    v = {}
    I = {}
    for name, vals in rows:
        nums = [int(x) for x in vals.split('&')]
        if name not in v:
            v[name] = nums
        else:
            I[name] = nums
    m = re.search(r'endpoints\s*\\\[\s*([\d,\s]+)\.\s*\\\]', seg[seg.index('Here is a small table'):])
    ends = [int(x) for x in m.group(1).split(',')]
    return v, I, ends


def segment_auxiliary(checks, seg, table=None):
    N = nodes()
    v, I, ends = table or parse_threshold_table(seg)
    check(checks, 'F6. the four chord errors eps_j: R(.000673) + .021 R(.00222) = .00039592632 < .00040, R(.00222) = .00119992 < '
          '.00120, R(.00402) = .00216472 < .00217, R(.0138) = .0074068 < .00741',
          R_('.000673') + Fr('.021') * R_('.00222') == Fr('.00039592632') < EPS['D'] and R_('.00222') == Fr('.00119992') < EPS['E']
          and R_('.00402') == Fr('.00216472') < EPS['N'] and R_('.0138') == Fr('.0074068') < EPS['C'])
    A = {'D': [N[i]['K_t'] + tc * N[i]['C_t'] for i in range(145)], 'E': [-N[i]['C_t'] for i in range(145)],
         'N': [-N[i]['n_K'] for i in range(145)], 'C': [N[i]['n_C'] for i in range(145)]}
    H = [Fr(e, 1000) for e in ends]
    bad = []
    for jn in 'DENC':
        al, be = ALPHA_BETA[jn]
        for kidx in range(8):
            vv = Fr(v[jn][kidx], 1000)
            tot = Iv(0, 0)
            for i in range(145):
                di = 1 if i in (0, 144) else 2
                tot = tot + Fr(di, 80) * (A[jn][i] + EPS[jn] - vv).pos()
            Ib = Fr(I[jn][kidx], 10 ** 5)
            if tot.H > Ib:
                bad.append(('sum', jn, kidx, float(tot.H), I[jn][kidx]))
            for Hx in (H[kidx], H[kidx + 1]):
                if Ib > 2 * Hx * (al - be * Hx - vv):
                    bad.append(('budget', jn, kidx, float(Hx)))
    check(checks, 'F6. the threshold table: all 32 sums sum_i (delta_i/80)(A_j(t_i) + eps_j - v)_+ are below the printed 10^-5 I_j(v), '
          'and at both ends of each of the eight H-intervals I_j(v) <= 2H(alpha_j - beta_j H - v)', not bad and len(ends) == 9, str(bad[:4]))
    # starred primitive samples
    a = [N[i]['a'] for i in range(145)]
    x = [N[i]['x'] for i in range(145)]

    def starred(F):
        out = [F[0]]
        acc = Iv(0, 0)
        for i in range(1, 145):
            acc = acc + (a[i] - a[i - 1]) * (F[i] - F[i - 1])
            out.append(F[i] - 40 * acc / x[i])
        return out
    K = [N[i]['K'] for i in range(145)]
    C = [N[i]['C'] for i in range(145)]
    q = [N[i]['q'] for i in range(145)]
    q2 = [qi.sq() for qi in q]
    D = [K[i] + tc * C[i] for i in range(145)]
    PK, Pq, Pq2 = starred(K), starred(q), starred(q2)
    dK = Fr('.80') * Fr('1.25') / ms ** 2
    dC = Fr('.80') * 5 * tr ** 2 / ms ** 2
    qM = Fr('.2559')
    th = [N[i]['tanh'] for i in range(145)]
    B0 = [PK[i] - (K[i] + K[0]) / 2 + dK * (D[i] - D[0]).sq() + dC * (C[i] - C[0]).sq() for i in range(145)]
    B1 = [-(K[i] - K[0]) / 2 + dK * (D[i] - D[0]).pos() * (D[i] + D[0] + Fr('.0214')).pos() for i in range(145)]
    Z1 = [th[i] * (Fr('.0178') - PK[i]) for i in range(145)]
    Dd = A['D']
    c_star = ln2() - Fr(1, 2)
    D0f = (1 - Fr(13, 2) * tc) * ((2 + pi_iv()) * c_star - 1) - 2 * tc * c_star
    check(checks, 'F6. D(0) agrees with (1 - 6.5 t_c)((2 + pi) c_* - 1) - 2 t_c c_*, c_* = log 2 - 1/2, and D(0) < -.0140',
          D[0].H < Fr('-.0140') and (D[0] - D0f).abs().H < Fr(1, 10 ** 60), '%.10f' % float(D[0].L))
    rows = [
        ('0:144  D - D(0) in [-10^-8, .0314]', all(within(D[i] - D[0], Fr(-1, 10 ** 8), Fr('.0314')) for i in range(145))),
        ('0:144  P <= .01767', max(p_.H for p_ in PK) <= Fr('.01767'), max(p_.H for p_ in PK)),
        ('0:144  B_0 <= .01773', max(b.H for b in B0) <= Fr('.01773'), max(b.H for b in B0)),
        ('0:144  B_0 - .0146 t_i^2 <= .00001', max((B0[i] - Fr('.0146') * Fr(i, 40) ** 2).H for i in range(145)) <= Fr('.00001'),
         max((B0[i] - Fr('.0146') * Fr(i, 40) ** 2).H for i in range(145))),
        ('0:144  D_t >= -.0213', min(d.L for d in Dd) >= Fr('-.0213'), min(d.L for d in Dd)),
        ('0:56   B_1 + (P - .0049)_+ / 2 <= .000001', max((B1[i] + (PK[i] - Fr('.0049')).pos() / 2).H for i in range(57)) <= Fr('.000001'),
         max((B1[i] + (PK[i] - Fr('.0049')).pos() / 2).H for i in range(57))),
        ('0:56   Z_1 in [0, .00742]', all(within(Z1[i], 0, Fr('.00742')) for i in range(57)), max(z.H for z in Z1[:57])),
        ('0:56   B_1 + 78 Z_1^2 <= .000001', max((B1[i] + 78 * Z1[i].sq()).H for i in range(57)) <= Fr('.000001'),
         max((B1[i] + 78 * Z1[i].sq()).H for i in range(57))),
        ('0:56   P_{q^2} - (q + q_M) P_q + (q^2 + q_M^2)/2 <= .01587',
         max((Pq2[i] - (q[i] + qM) * Pq[i] + (q2[i] + qM ** 2) / 2).H for i in range(57)) <= Fr('.01587'),
         max((Pq2[i] - (q[i] + qM) * Pq[i] + (q2[i] + qM ** 2) / 2).H for i in range(57))),
    ]
    for r in rows:
        check(checks, 'F6. sample table: ' + r[0], r[1], '' if len(r) < 3 else 'extreme %.9f' % float(r[2]))

    mono_C = min((-C[i + 1] + C[i]).L for i in range(144))
    mono_q = min((q[i + 1] - q[i]).L for i in range(144))

    def clipped_ok(F, c):
        cl = Fr(c)
        for i in range(144):
            lo_next = min(F[i + 1].L, cl)
            hi_cur = min(F[i].H, cl)
            if lo_next - hi_cur < 0:
                return False
        return True
    check(checks, 'F6. monotonicity line (0:144): -C and q increase by at least .000005 and .000012 between successive nodes; '
          'min(D, -.01065) and min(P, .0049) are nondecreasing (clipping applied to the endpoints)',
          mono_C >= Fr('.000005') and mono_q >= Fr('.000012') and clipped_ok(D, '-.01065') and clipped_ok(PK, '.0049'),
          'least increments %.7f, %.7f' % (float(mono_C), float(mono_q)))
    return {'PK': PK, 'B0': B0}


# ---------------------------------------------------------------------------------------------------------------
# F2b. from the certificates to Lemma lem:scalar-ranges on [0, 3.6] (07-scalar.tex lines 470-591): the chord-error
#      chain, every displayed inequality, recomputed in exact rational arithmetic (square roots enclosed)
# ---------------------------------------------------------------------------------------------------------------

def chord_chain(checks):
    dl = Fr(1, 40)
    out = []

    def c(name, ok, det=''):
        out.append((name, ok, det))
    dmax = Fr('.5') + R_('.000260')
    c('d <= .5 + R(.000260) <= .50015 and b - r^2 - .50015 >= .05345', dmax <= Fr('.50015') and b_ - r_ ** 2 - Fr('.50015') >= Fr('.05345'))
    l_ = Fr('2.164')
    dd1 = Fr('.1338') + R_('.00092')
    dd2 = Fr('.415') + R_('.00421')
    c('l = 1/(2 ell) <= 2.164 (ell^2 >= .05345)', 1 / (4 * l_ ** 2) <= Fr('.05345'))
    c('|l_t| <= 2 l^3 (.1338 + R(.00092)) <= 2.8', 2 * l_ ** 3 * dd1 <= Fr('2.8'))
    c('|l_tt| <= 2 l^3 (.415 + R(.00421)) + 12 l^5 (.1338 + R(.00092))^2 <= 19.2', 2 * l_ ** 3 * dd2 + 12 * l_ ** 5 * dd1 ** 2 <= Fr('19.2'))
    e = Fr('19.2') / 12800
    c('chord error of q_t: 2.164 R(.00092) + .1338 e + (2.8 delta)(.01037)/4 < .0016',
      l_ * R_('.00092') + Fr('.1338') * e + Fr('2.8') * dl * Fr('.01037') / 4 < Fr('.0016'))
    c('chord error of q_t^2: (2(.1908) + .0016)(.0016) + .0127^2/4 < .000654',
      (2 * Fr('.1908') + Fr('.0016')) * Fr('.0016') + Fr('.0127') ** 2 / 4 < Fr('.000654'))
    v = (l_ * R_('.00421') + Fr('.415') * e + Fr('2.8') * dl * Fr('.03670') / 4
         + 2 * (l_ * Fr('.000654') + Fr('.1908') ** 2 * e + Fr('2.8') * dl * (2 * Fr('.1908') * Fr('.0127')) / 4))
    c('chord error of q_tt < .0095', v < Fr('.0095'), '%.6f' % float(v))
    c('chord error of q: (.508 + .0095) delta^2 / 8 < .000042', (Fr('.508') + Fr('.0095')) * dl ** 2 / 8 < Fr('.000042'))
    c('chord error of n_q: .0095 + .0016 + .1908/12800 + delta(.0127)/4 < .012',
      Fr('.0095') + Fr('.0016') + Fr('.1908') / 12800 + dl * Fr('.0127') / 4 < Fr('.012'))
    v = (2 * Fr('.000042') + (1 + 1 / s_ ** 2) * Fr('.0016') + Fr('.1908') * 2 / 12800 + Fr('1.08') * dl * Fr('.0127') / 4
         + (Fr('.0095') + Fr('.508') * 2 / 12800 + dl * Fr('.047') / 4) / s_ ** 2)
    c('chord error of S_q < .003', v < Fr('.003'), '%.6f' % float(v))
    epc = R_('.00222')
    Es = R_('.000673') + tc * epc
    v = Fr('1.507') * R_('.00402') + 12 * Fr('.80') / ms ** 2 * (Fr('1.25') * Es * (2 * (Fr('.06542') + tc * Fr('.2456')) + Es)
                                                                + 5 * tr ** 2 * epc * (2 * Fr('.2456') + epc))
    c('U_* between nodes: the addition to .537 is < .010, and .547 < .54 r^2 w^2', v < Fr('.010') and Fr('.547') < Fr('.54') * r_ ** 2 * w_ ** 2,
      '%.6f' % float(v))
    eK, eC = Fr('.238') / 12800, Fr('.79') / 12800
    c('.238/12800 < .000019 and .79/12800 < .000062', eK < Fr('.000019') and eC < Fr('.000062'))
    e1 = -tm * Fr('.000062') + Fr('.000019')
    e2 = tp * Fr('.000062') + Fr('.000019')
    e3 = Fr('.74') * Fr('.000062') + 4 * lam * Fr('.000019')
    c('chord errors of the three sampled inequalities < .000024, .000024, .0001 and the table margins suffice',
      e1 < Fr('.000024') and e2 < Fr('.000024') and e3 < Fr('.0001') and Fr('.00090') > Fr('.000024') and Fr('-.00074') + Fr('.000024') < 0
      and Fr('.132') - Fr('.0001') > ms ** 2)
    sh45 = sinhcosh_q(Fr(45, 40))[0]
    c('n_K >= .00315 > R(.00402) on t >= 1.4, and s sinh(45/40) < 5', Fr('.00315') > R_('.00402') and (s_ * sh45).H < 5)
    # the finite-region entries of Lemma scalar-ranges, from node bounds plus chord errors
    rng = [
        ('K >= -.007, K <= .0275', Fr('-.00692') - eK >= Fr('-.007') and Fr('.02737') + eK <= Fr('.0275')),
        ('|K_t| <= .066, |K_tt| <= .238', Fr('.06542') + R_('.000673') <= Fr('.066') and Fr('.2355') + R_('.00373') <= Fr('.238')),
        ('C in [-.501, -.341]', Fr('-.5') - eC >= Fr('-.501') and Fr('-.3413') + eC <= Fr('-.341')),
        ('|C_t| <= .247, |C_tt| <= .79, |n_C| <= .79', Fr('.2456') + R_('.00222') <= Fr('.247') and Fr('.780') + R_('.0129') <= Fr('.79')
         and Fr('.780') + R_('.0138') <= Fr('.79')),
        ('q in [.0775, .2559], |q_t| <= .193, |q_tt|, |n_q| <= .53', Fr('.0777') - Fr('.000042') >= Fr('.0775')
         and Fr('.25525') + Fr('.000042') <= Fr('.2559') and Fr('.1908') + Fr('.0016') <= Fr('.193') and Fr('.508') + Fr('.0095') <= Fr('.53')
         and Fr('.508') + Fr('.012') <= Fr('.53')),
        ('|v\' - x| <= .319', Fr('.318') + R_('.00167') <= Fr('.319')),
        ('on |t| >= 1.4: K in [-.0001, .0191], |K_t| <= .0211, |C_t| <= .0084, C <= -.495, q >= .235',
         -eK >= Fr('-.0001') and Fr('.019') + eK <= Fr('.0191') and Fr('.0207') + R_('.000673') <= Fr('.0211')
         and Fr('.0071') + R_('.00222') <= Fr('.0084') and Fr('-.49512') + eC <= Fr('-.495') and Fr('.2353') - Fr('.000042') >= Fr('.235')),
        ('for |x| >= 5: q >= .2203', Fr('.2204') - Fr('.000042') >= Fr('.2203')),
    ]
    for name, ok in rng:
        c('Lemma scalar-ranges on the finite region: ' + name, ok)
    for name, ok, det in out:
        check(checks, 'F2. ' + name, ok, det)


# ---------------------------------------------------------------------------------------------------------------
# F10a. Lemma lem:scalar-tail (07-scalar.tex lines 596-885): the derivative vectors on x >= 64 (binomial
#       convolutions through order 4) and the consequences drawn from them
# ---------------------------------------------------------------------------------------------------------------

def conv(A, B):
    return [sum(comb(j, i) * A[i] * B[j - i] for i in range(j + 1)) for j in range(5)]


def vadd(*vs):
    return [sum(v[j] for v in vs) for j in range(5)]


def vsc(c, A):
    return [Fr(c) * a for a in A]


def tail_lemma(checks, scalar_tex):
    x0 = Fr(1, 4096)
    P = [Fr(2) ** j for j in range(5)]
    I_ = [Fr(int(j == 0)) for j in range(5)]
    J_ = [Fr(int(j == 1)) for j in range(5)]
    N = vadd(I_, vsc(Fr('3.1') * x0, P))
    M = vadd(I_, vsc(Fr('1.02') * x0, P))
    H0 = vadd(vsc(Fr('4.59'), I_), J_, vsc(Fr('1.05') * x0, P))
    res = []
    res.append(('3 + 7(30) xi_0 + 6(630) xi_0^2 + 22680 xi_0^3 < 3.1', 3 + 7 * 30 * x0 + 6 * 630 * x0 ** 2 + 22680 * x0 ** 3 < Fr('3.1')))
    res.append(('PN <= 1.02 P', all(a <= Fr('1.02') * b for a, b in zip(conv(P, N), P))))
    z = Fr('1.02') * x0
    res.append(('1.02 sum_k k^3 (1.02 xi_0)^(k-1) = 1.02 (1 + 4z + z^2)/(1 - z)^4 <= 1.04', Fr('1.02') * (1 + 4 * z + z * z) / (1 - z) ** 4 <= Fr('1.04')))
    lhs = vadd(vsc(Fr('1.55'), conv(P, vadd(N, I_))), vsc(Fr('6.2'), P), vsc(Fr('.5'), conv(P, conv(N, N))), vsc(2 * Fr(1, 10 ** 6) * x0, conv(P, N)))
    res.append(('1.55 P(N + I) + 6.2 P + .5 P N^2 + 2(10^-6) xi_0 P N <= 10 P', all(a <= 10 * b for a, b in zip(lhs, P))))
    lhs = vadd(vsc(Fr('1.02'), conv(P, vadd(M, I_))), conv(P, conv(N, N)))
    res.append(('1.02 P(M + I) + P N^2 <= 3.2 P', all(a <= Fr('3.2') * b for a, b in zip(lhs, P))))
    Kv = vsc(x0, vadd(vsc(Fr(1, 10 ** 6), P), conv(P, vadd(vsc(Fr('11.05'), P), vsc(Fr('3.2'), conv(P, H0))))))
    Ed = vadd(vsc(Fr(1, 2), P), vsc(x0, vadd(vsc(Fr(1, 10 ** 6), P), vsc(10, conv(P, P)), conv(conv(P, P), conv(conv(N, N), H0)))))
    Eg = conv(P, vadd(vsc(Fr(1, 2), N), vsc(Fr('.25') * x0, conv(P, conv(N, N))), vsc(Fr('.5'), conv(conv(M, M), H0))))
    shifted = [Eg[j + 1] + Eg[j + 2] if j + 2 <= 4 else None for j in range(3)]
    Cv = [Ed[j] + Fr(13, 2) * x0 * sum(comb(j, i) * P[i] * shifted[j - i] for i in range(j + 1)) for j in range(3)]
    for name, vec, tab in (('K - xi(L - 3/2)', Kv, ('.0064', '.027', '.11')), ('d - 1/2', Ed, ('.51', '1.02', '2.1')),
                           ('C + 1/2', Cv, ('.55', '1.16', '2.61'))):
        res.append(('the tail table row %s: (%s, %s, %s) bounds the vector (%.5f, %.5f, %.5f)' % ((name,) + tab + tuple(float(v) for v in vec[:3])),
                    all(vec[j] <= Fr(tab[j]) for j in range(3))))
    L64 = log_q(64) + log_sqrt2pi() - Fr(1, 2)
    res.append(('4.5 < L(64) = log 64 + log sqrt(2 pi) - 1/2 < 4.59', L64.L > Fr('4.5') and L64.H < Fr('4.59'), '%.6f' % float(L64.L)))
    res.append(('(D^2 - D)K >= xi(6(4.5 - 1.5) - 5 - .11 - .027) > 0', 6 * (Fr('4.5') - Fr('1.5')) - 5 - Fr('.11') - Fr('.027') > 0))
    ax = Iv.q(1 + s_ ** 2 * x0).sqrt()
    res.append(('a_t/x = sqrt(1 + s^2/x^2) <= 1.002 on x >= 64', ax.H <= Fr('1.002')))
    Kmax = x0 * (Fr('4.59') - Fr('1.5') + Fr('.0064'))
    Kt = Fr('1.002') * x0 * (2 * Fr('4.59') - 4 + Fr('.027'))
    nK = Fr('1.002') ** 2 * x0 * (6 * (Fr('4.59') - Fr('1.5')) - 5 + Fr('.11') + Fr('.027'))
    res.append(('0 <= K <= xi_0(4.59 - 1.5 + .0064) <= .0008, |K_t| <= 1.002 xi_0(2(4.59) - 4 + .027) < .002, |K_tt| <= |n_K| + |DK| < .02',
                Kmax <= Fr('.0008') and Kt < Fr('.002') and nK + Kt / Fr('1.002') < Fr('.02')))
    res.append(('|C + .5| <= .55 xi_0 <= .0002, |C_t| <= 1.002(1.16) xi_0 < .001, |n_C|, |C_tt| < .002',
                Fr('.55') * x0 <= Fr('.0002') and Fr('1.002') * Fr('1.16') * x0 < Fr('.001')
                and Fr('1.002') ** 2 * (Fr('2.61') + Fr('1.16')) * x0 + Fr('1.16') * x0 < Fr('.002')))
    res.append(('ell^2 >= .0536 - .51 xi_0 > .231^2', Fr('.0536') - Fr('.51') * x0 > Fr('.231') ** 2))
    k = kk()
    qlo = k - Iv.q(Fr('.0536') + Fr('.51') * x0).sqrt()
    qhi = k - Iv.q(Fr('.0536') - Fr('.51') * x0).sqrt()
    qt = Fr('1.002') * Fr('1.02') * x0 / (2 * Fr('.231'))
    nq = (Fr('1.002') ** 2 * (Fr('2.1') + Fr('1.02')) * x0 / 2 + qt ** 2) / Fr('.231')
    res.append(('q in [.255, .2556], |q_t| < .00055, |n_q| < .0017', qlo.L >= Fr('.255') and qhi.H <= Fr('.2556') and qt < Fr('.00055') and nq < Fr('.0017'),
                'q in [%.6f, %.6f], q_t %.6f, n_q %.6f' % (float(qlo.L), float(qhi.H), float(qt), float(nq))))
    Sq_lo = 2 * Fr('.255') - Fr('.00055') - Fr('.0017') * x0
    Sq_hi = 2 * Fr('.2556') + Fr('.00055') + Fr('.0017') * x0
    res.append(('S_q = 2q + tanh(t) q_t - a^-2 n_q in [.509, .512]', Sq_lo >= Fr('.509') and Sq_hi <= Fr('.512')))
    g64 = 20 * log_q(64) - 2048 + 200 * log_q(10)
    res.append(('x^20 e^{-x^2/2} < 10^-200 at x = 64 (20 log 64 - 2048 + 200 log 10 < 0)', g64.H < 0))
    V2lo = 2 - Fr('.0001') - 1 / (1 - x0) ** 2
    V2hi = 2 - (1 - 3 * x0)
    res.append(('V_2 = 2 - (phi/p)(x + phi/p) - n/m^2 in [.999, 1.001] (Gaussian term < .0001, n in [1-3 xi, 1], m in [1 - xi, 1])',
                V2lo >= Fr('.999') and V2hi <= Fr('1.001')))
    res.append(('|R_v| <= .319 on the tail: |n/(xm)| <= 1/(64(1 - xi_0)) plus the Gaussian term', 1 / (64 * (1 - x0)) + Fr('.0001') <= Fr('.319')))
    Kt_, Ct_ = (Fr(0), Fr('.0008')), (Fr('-.501'), Fr('-.499'))
    res.append(('tail covariance bounds: lambda t_-^2 + t_- C + K >= .010, lambda t_+^2 + t_+ C + K <= -.027, .74(.499) - .37^2 - 2.6(.0008) > m_*^2',
                lam * tm ** 2 + tm * Ct_[0] + Kt_[0] >= Fr('.010') and lam * tp ** 2 + tp * Ct_[0] + Kt_[1] <= Fr('-.027')
                and Fr('.74') * Fr('.499') - Fr('.37') ** 2 - Fr('2.6') * Fr('.0008') > ms ** 2))
    U = 12 * Fr('.80') / ms ** 2 * (Fr('1.25') * (Fr('.002') + tc * Fr('.001')) ** 2 + 5 * tr ** 2 * Fr('.001') ** 2)
    res.append(('U_* < .001 on the tail', U < Fr('.001')))
    l64 = log_q(64)
    res.append(('log sqrt(2 pi) - 2 + .0064 < 0, (log 64 + 1)/64 < .086, .335 + .086 < .422',
                (log_sqrt2pi() - 2 + Fr('.0064')).H < 0 and ((l64 + 1) / 64).H < Fr('.086') and Fr('.335') + Fr('.086') < Fr('.422')))
    for name, ok, *det in res:
        check(checks, 'F10. tail lemma: ' + name, ok, det[0] if det else '')


# ---------------------------------------------------------------------------------------------------------------
# F5. Lemma lem:scalar-interpolation (07-scalar.tex lines 378-468) and F4. the arithmetic of Lemma lem:scalar-strip
# ---------------------------------------------------------------------------------------------------------------

def interpolation_constants(checks):
    s = sum(Fr(2) ** (2 * l - 4) / factorial(2 * l - 2) * math.prod((j + Fr(1, 2)) ** 2 for j in range(l - 1)) for l in range(2, 9))
    check(checks, 'F5. sum_{l=2}^8 2^(2l-4)/(2l-2)! prod_{j<=l-2} (j+1/2)^2 = 4387/8192 < .536', s == Fr(4387, 8192) and s < Fr('.536'), str(s))
    a = 4 * 10 ** 5 * math.prod(((j + Fr(1, 2)) / (40 * Fr('.36'))) ** 2 for j in range(8))
    check(checks, 'F5. 4(10^5) prod_{j=0}^7 ((j+1/2)/(40(.36)))^2 < .000007336661 < .00001', a < Fr('.000007336661'), '%.12f' % float(a))
    check(checks, 'F5. Cauchy constants: 1300/.09 + 2(1300)/.09^2 < 4(10^5)', Fr(1300) / Fr('.09') + 2 * Fr(1300) / Fr('.09') ** 2 < 4 * 10 ** 5)


def strip_arithmetic(checks):
    out = []
    s45, c45 = sincos_q(Fr('.45'))
    out.append(('sin(.45) < .435 and tan(.45) < .5', s45.H < Fr('.435') and (s45 / c45).H < Fr('.5')))
    out.append(('Y(0) = sqrt(pi/2) <= 1.254', (pi_iv() / 2).sqrt().H <= Fr('1.254')))
    out.append(('e^{1.25} u(0) = e^{1.25}/2 <= 1.75', (exp_iv(Iv.q(Fr('1.25'))) / 2).H <= Fr('1.75')))
    out.append(('A <= .9: A |y| <= .9 sqrt(2.5 + .25(.81)) < pi/2', (Fr('.9') * Iv.q(Fr('2.5') + Fr('.25') * Fr('.81')).sqrt()).H < (pi_iv() / 2).L))
    u9 = Fr(1, 2) - (Fr('.9') - Fr('.9') ** 3 / 6) / sqrt2pi()
    out.append(('A >= .9: u(.9) e^{1.25 + .125(.81)} < .80, with u(.9) <= 1/2 - (.9 - .9^3/6)/sqrt(2 pi)',
                (u9 * exp_iv(Iv.q(Fr('1.25') + Fr('.125') * Fr('.81')))).H < Fr('.80')))
    out.append(('Re Y >= sqrt(pi/2) e^{-2}/4 > .02', ((pi_iv() / 2).sqrt() * exp_iv(Iv.q(-2)) / 4).L > Fr('.02')))
    out.append(('A >= 2: |y|/A <= sqrt(7/8) < .936, and e^{-1-1/8} > .324', Fr(7, 8) < Fr('.936') ** 2 and exp_iv(Iv.q(Fr(-9, 8))).L > Fr('.324')))
    out.append(('|d| < 48 from |Bj| <= 12, |1 - pB| <= 3.75, |h| <= 2.5: 12 + 3.75^2 (2.5) < 48', 12 + Fr('3.75') ** 2 * Fr('2.5') < 48))
    out.append(('|K| < 99: 48 + 19 + 1.254^2 (2.75)^2 (2.5) + 1 < 99', 48 + 19 + Fr('1.254') ** 2 * Fr('2.75') ** 2 * Fr('2.5') + 1 < 99))
    out.append(('|C| <= 48 + 6.5(76 + 99) < 1300 and |V_2| <= 2 + 20 + 49 + 10000 < 11000', 48 + Fr('6.5') * 175 < 1300 and 2 + 20 + 49 + 10000 < 11000))
    am = Iv.q(Fr(4, 3)).sqrt()
    out.append(('A e^{-.375 A^2} <= 1 (its maximum, at A^2 = 4/3, is e^{-1/2} sqrt(4/3))', (am * exp_iv(Iv.q(Fr(-1, 2)))).H <= 1))
    for name, ok in out:
        check(checks, 'F4. analytic strip arithmetic: ' + name, ok)


# ---------------------------------------------------------------------------------------------------------------
# F3. the stable formulas (07-scalar.tex lines 97-109) as identities in the differential field generated over
#     Q(x) by phi, p, f, j with phi' = -x phi, p' = phi, f' = -phi(1-p)/p, j' = phi p/(1-p) (f = -(1-p) - log p,
#     j = -p - log(1-p)).  An element is N / (phi^a p^b (1-p)^c), N a polynomial in (x, phi, p, f, j).
# ---------------------------------------------------------------------------------------------------------------

from _poly import add as padd, mul as pmul, scale as pscale, const as pconst, var as pvar, diff as pdiff  # noqa: E402

NV5 = 5
VX, VPHI, VP, VF, VJ = (pvar(i, NV5) for i in range(5))
ONE5 = pconst(1, NV5)
U5 = padd(ONE5, VP, -1)                       # 1 - p


def ppow(a, k):
    r = ONE5
    for _ in range(k):
        r = pmul(r, a)
    return r


class RF:
    """N / (phi^a p^b (1-p)^c)"""
    __slots__ = ('N', 'a', 'b', 'c')

    def __init__(self, N, a=0, b=0, c=0):
        self.N, self.a, self.b, self.c = N, a, b, c

    def lift(self, a, b, c):
        N = pmul(pmul(pmul(self.N, ppow(VPHI, a - self.a)), ppow(VP, b - self.b)), ppow(U5, c - self.c))
        return N

    def __add__(s, o):
        o = rf(o)
        a, b, c = max(s.a, o.a), max(s.b, o.b), max(s.c, o.c)
        return RF(padd(s.lift(a, b, c), o.lift(a, b, c)), a, b, c)
    __radd__ = __add__

    def __neg__(s):
        return RF(pscale(s.N, -1), s.a, s.b, s.c)

    def __sub__(s, o):
        return s + (-rf(o))

    def __rsub__(s, o):
        return rf(o) - s

    def __mul__(s, o):
        o = rf(o)
        return RF(pmul(s.N, o.N), s.a + o.a, s.b + o.b, s.c + o.c)
    __rmul__ = __mul__

    def is_zero(s):
        return not s.N

    def D(s):
        """the derivation: D(N) / den + N D(1/den), D(1/den) = (a x - b phi/p + c phi/(1-p)) / den"""
        N = s.N
        core = padd(padd(pdiff(N, 0), pscale(pmul(pmul(VX, VPHI), pdiff(N, 1)), -1)), pmul(VPHI, pdiff(N, 2)))
        num = pmul(core, pmul(VP, U5))
        num = padd(num, pscale(pmul(pmul(VPHI, pmul(U5, U5)), pdiff(N, 3)), -1))
        num = padd(num, pmul(pmul(VPHI, pmul(VP, VP)), pdiff(N, 4)))
        extra = padd(padd(pscale(pmul(pmul(VX, VP), U5), s.a), pscale(pmul(VPHI, U5), -s.b)), pscale(pmul(VPHI, VP), s.c))
        num = padd(num, pmul(N, extra))
        return RF(num, s.a, s.b + 1, s.c + 1)


def rf(x):
    if isinstance(x, RF):
        return x
    return RF(pconst(Fr(x), NV5))


def stable_identities(checks):
    x, phi, p, f, j = RF(VX), RF(VPHI), RF(VP), RF(VF), RF(VJ)
    X = RF(VP, a=1)                       # p/phi
    Y = RF(U5, a=1)                       # (1-p)/phi
    u = RF(U5)
    h = RF(VF, c=2)                       # f/(1-p)^2 = h(u) by the definition of h
    B = 1 - x * Y
    omb = 1 - p * B
    d = (1 + x * X) * (1 + x * X) * f + B * B * j
    g = Fr(1, 2) * (1 - X * X * f - Y * Y * j)
    K = d - 2 * g
    g1, g2 = g.D(), g.D().D()
    G3, G4 = g2.D(), g2.D().D()
    vprime = X.D() * RF(pconst(1, NV5), b=1) * RF(VPHI) + Y.D() * RF(VPHI, c=1)     # X'/X + Y'/Y, 1/X = phi/p
    Rv = vprime - x
    V2 = vprime.D()
    D1, D2 = d.D(), d.D().D()
    ids = [
        ("X' = 1 + xX and Y' = xY - 1", (X.D() - (1 + x * X)).is_zero() and (Y.D() - (x * Y - 1)).is_zero()),
        ("f' = -phi Y / X and j' = phi X / Y (from f = -(1-p) - log p, j = -p - log(1-p))",
         (f.D() + phi * Y * RF(VPHI, b=1)).is_zero() and (j.D() - phi * X * RF(VPHI, c=1)).is_zero()),
        ('d = (1+xX)^2 f + B^2 j = B^2 j + (1 - pB)^2 h', (d - (B * B * j + omb * omb * h)).is_zero()),
        ('K = d - 2g = d + Y^2 (j + p^2 h) - 1', (K - (d + Y * Y * (j + p * p * h) - 1)).is_zero()),
        ("g' = Y (Bj - (1 - pB) p h)", (g1 - Y * (B * j - omb * p * h)).is_zero()),
        ("g'' = x g' - K", (g2 - (x * g1 - K)).is_zero()),
        ("R_v = v' - x = phi/p - B/Y", (Rv - (phi * RF(ONE5, b=1) - B * RF(VPHI, c=1))).is_zero()),
        ("V_2 = v'' = 2 - (phi/p)(x + phi/p) - B/Y^2",
         (V2 - (2 - phi * RF(ONE5, b=1) * (x + phi * RF(ONE5, b=1)) - B * RF(pmul(VPHI, VPHI), c=2))).is_zero()),
        ("D_1 = d' = x(2d - 1) - R_v - 2g'", (D1 - (x * (2 * d - 1) - Rv - 2 * g1)).is_zero()),
        ("D_2 = d'' = 2d + 2x D_1 - 2g'' - V_2", (D2 - (2 * d + 2 * x * D1 - 2 * g2 - V2)).is_zero()),
        ("G_3 = g''' = x g'' + 3g' - D_1", (G3 - (x * g2 + 3 * g1 - D1)).is_zero()),
        ("G_4 = g'''' = x G_3 + 4g'' - D_2", (G4 - (x * G3 + 4 * g2 - D2)).is_zero()),
    ]
    for name, ok in ids:
        check(checks, 'F3. identity: ' + name, ok)


# ---------------------------------------------------------------------------------------------------------------
# F7. the middle-width polynomial certificates T_(4), T_(5) on [.16, .54] (08-segments.tex lines 980-1075)
# ---------------------------------------------------------------------------------------------------------------

def U_(coeffs):
    out = [Fr(c) for c in coeffs]
    while len(out) > 1 and out[-1] == 0:
        out.pop()
    return out


def Uadd(*ps):
    n = max(len(p) for p in ps)
    return U_([sum((p[i] if i < len(p) else 0) for p in ps) for i in range(n)])


def Usc(c, p):
    return U_([Fr(c) * a for a in p])


def Umul(*ps):
    r = [Fr(1)]
    for p in ps:
        out = [Fr(0)] * (len(r) + len(p) - 1)
        for i, a in enumerate(r):
            if a:
                for j, b in enumerate(p):
                    out[i + j] += a * b
        r = U_(out)
    return r


def Uh(k, c=1):
    return U_([0] * k + [Fr(c)])


def Lj(j, Hpoly):
    al, be = ALPHA_BETA[j]
    return Uadd([2 * al / 3], Usc(-be / 2, Hpoly))


def middle_polys():
    w2 = w_ ** 2
    G0 = r_ ** 2 * w2
    chi = tp
    s = [Fr(1, factorial(2 * i + 1)) for i in range(20)]
    a = [Fr(1, factorial(2 * i)) for i in range(20)]
    d = [Fr((-4 * w2) ** i) / factorial(2 * i + 1) for i in range(20)]
    e = [2 * Fr((-4 * w2) ** i) / factorial(2 * i + 2) for i in range(20)]
    ad = [sum(a[k] * d[i - k] for k in range(i + 1)) for i in range(20)]
    se = [sum(s[k] * e[i - k] for k in range(i + 1)) for i in range(20)]
    Pu = Uadd([Fr('.00025')], Usc(2 * G0 / (1 + w2), Uadd(*[Uh(2 * i - 2, s[i] - ad[i]) for i in range(1, 8)],
                                                          *[Uh(2 * i, se[i]) for i in range(0, 8)])))
    Fs = Usc(G0 / (1 + w2), Uadd(*[Uh(2 * i - 2, Fr(2 * 4 ** i) * (1 - (-w2) ** i) / factorial(2 * i + 2)) for i in range(1, 7)]))
    Su = U_([1, 0, Fr(1, 6), 0, Fr('.0084')])
    Hu = U_([1, 0, Fr(1, 2), 0, Fr('.0421')])
    gu = Usc(Fr('.75'), Umul(Su, Uadd([1], Hu)))
    hh = Uh(1)
    Ba = Usc(Fr('.193') ** 2, U_([Fr(4, 3), 0, Fr('.05')]))
    Bd = Uh(3, Fr('.078'))
    LC_half = Lj('C', Usc(Fr(1, 2), hh))
    LC = Lj('C', hh)
    LN = Lj('N', hh)
    ds = Uadd([ALPHA_BETA['D'][0]], Usc(-ALPHA_BETA['D'][1], hh))
    bs = Uadd([ALPHA_BETA['E'][0]], Usc(-ALPHA_BETA['E'][1], hh))
    dK = Fr('.80') * Fr('1.25') / ms ** 2
    dC = Fr('.80') * 5 * tr ** 2 / ms ** 2
    q4l = 1 / (4 * lam)
    Su2 = Umul(Su, Su)
    h2, h4 = Uh(2), Uh(4)
    inner4 = Uadd(Pu, Umul(Su, Uadd(Usc(Fr(1, 3), Umul(gu, LC_half)), Ba)))
    T4 = Uadd(Usc(1 + chi, Umul(h2, Fs)),
              Usc(-1, Umul(Su2, Uadd(Uh(2, Fr('.0584')), [Fr('.00025')], Usc(chi, Umul(h2, Ba)), Usc(q4l, Umul(Uadd([Fr('.08')], Bd), Uadd([Fr('.08')], Bd)))))),
              Usc(-chi, Umul(h2, Pu, Su)),
              Usc(-q4l, Umul(h4, inner4, inner4)))
    inner5 = Uadd(Pu, Umul(Su, Usc(Fr(1, 3), Umul(gu, LC))))
    br5 = Uadd(Usc(Fr(1, 3), Uadd(Umul(gu, LN), Usc(12 * dK, Umul(ds, ds)), Usc(12 * dC, Umul(bs, bs)))), Usc(q4l, Umul(bs, bs)), Uh(2, Fr('.027')))
    T5 = Uadd(Usc(1 + chi, Fs), Usc(-1, Umul(Su2, br5)), Usc(-q4l, Umul(h2, inner5, inner5)), Usc(-chi, Umul(Pu, Su)))
    return {'T4': T4, 'T5': T5, 'Pu': Pu, 'Fs': Fs, 'G0': G0}


def bernstein(T, lo=Fr('.16'), wd=Fr('.38')):
    """Bernstein coefficients of T(lo + wd u) on [0, 1], exactly as the paper's double sum"""
    dgr = len(T) - 1
    c = [sum(T[j] * comb(j, i) * lo ** (j - i) for j in range(i, dgr + 1)) * wd ** i for i in range(dgr + 1)]
    return [sum(Fr(comb(r, i), comb(dgr, i)) * c[i] for i in range(r + 1)) for r in range(dgr + 1)]


def parse_bernstein_table(seg):
    i = seg.index('Lower bounds for coefficients multiplied by')
    j = seg.index('\\end{array}', i)
    out = {}
    for name, vals in re.findall(r'T_\{\((\d)\)\}&([\d&]+)', seg[i:j]):
        out['T' + name] = [int(v) for v in vals.split('&')]
    m = re.search(r'The degrees are (\d+),(\d+)', seg)
    return out, (int(m.group(1)), int(m.group(2)))


def middle_certificates(checks, seg, polys=None, printed=None):
    mp = polys or middle_polys()
    pt, degs = printed or parse_bernstein_table(seg)
    w2 = w_ ** 2
    for name, dg in (('T4', degs[0]), ('T5', degs[1])):
        T = mp[name]
        bc = bernstein(T)
        groups = [range(0, 8), range(8, 16), range(16, 24), range(24, len(bc))]
        mins = [min(bc[r] for r in g) for g in groups]
        check(checks, 'F7. %s has degree %d, and its Bernstein coefficients on [.16, .54], grouped 0:7, 8:15, 16:23, 24:%d, are all positive '
              'with minima x 10^5 at least the printed %s' % ('T_(%s)' % name[1], dg, dg, pt[name]),
              len(T) - 1 == dg and all(m > 0 for m in mins) and all(Fr(p_) <= m * 10 ** 5 for p_, m in zip(pt[name], mins)),
              'degree %d; minima x 10^5: %s' % (len(T) - 1, ', '.join('%.3f' % float(m * 10 ** 5) for m in mins)))
    G0 = mp['G0']
    h = Fr('.54')
    t8 = 2 * G0 / (1 + w2) * ((1 + Fr('9.26') ** 17 / (2 * w_)) / factorial(17) * h ** 14
                              + (1 + (1 + 2 * w_) ** 19) / (2 * w2 * factorial(19)) * h ** 16)
    t9 = 2 * G0 / (1 + w2) * ((1 + Fr('9.26') ** 19 / (2 * w_)) / factorial(19) * h ** 16
                              + (1 + (1 + 2 * w_) ** 21) / (2 * w2 * factorial(21)) * h ** 18)
    check(checks, 'F7. the omitted tail of P_u: 1 + 4w^2 < 9.26^2, the i = 8 terms at h = .54 sum to < .000153, the i = 9 ratio is < .10, '
          'and .000153/(1 - .10) < .00025', 1 + 4 * w2 < Fr('9.26') ** 2 and t8 < Fr('.000153') and t9 < Fr('.10') * t8
          and Fr('.000153') / (1 - Fr('.10')) < Fr('.00025'), 'i=8: %.7f' % float(t8))
    check(checks, 'F7. the F_* tail ratio 8 w^2 h^2/(18 . 17) < 1 at h = .54', 8 * w2 * h ** 2 / (18 * 17) < 1)
    LN54 = 2 * ALPHA_BETA['N'][0] / 3 - ALPHA_BETA['N'][1] * h / 2
    LC54 = 2 * ALPHA_BETA['C'][0] / 3 - ALPHA_BETA['C'][1] * h / 2
    check(checks, 'F7. on [.16, .54]: L_N(h) >= L_N(.54) = .08521 > 0 and L_C(h) >= L_C(.54) > .26609', LN54 == Fr('.08521') and LC54 > Fr('.26609'))
    check(checks, 'F7. S_u, H_u remainder constants: 875/104271 < .0084 and 3125/74271 < .0421, with first terms 1/120, 1/24 and ratio .54^2/42',
          Fr(1, 120) / (1 - h ** 2 / 42) <= Fr(875, 104271) < Fr('.0084') and Fr(3125, 74271) < Fr('.0421')
          and Fr(1, 24) / (1 - h ** 2 / 30) <= Fr(3125, 74271))


def Su_(h):
    return 1 + h ** 2 / 6 + Fr('.0084') * h ** 4


def gu_(h):
    return Fr('.75') * Su_(h) * (2 + h ** 2 / 2 + Fr('.0421') * h ** 4)


def LC_(H):
    return 2 * ALPHA_BETA['C'][0] / 3 - ALPHA_BETA['C'][1] * H / 2


# ---------------------------------------------------------------------------------------------------------------
# F8. the cubic bound R/h^2 <= .027 on seven width intervals (08-segments.tex lines 905-971)
# ---------------------------------------------------------------------------------------------------------------

def parse_r_table(seg):
    i = seg.index('h^2a_s&Q&A&B&N_0')
    j = seg.index('\\end{array}', i)
    rows = [[int(v) for v in r] for r in re.findall(r'(\d+)&(\d+)&(\d+)&(\d+)&(\d+)&(\d+)', seg[i:j])]
    m = re.search(r'successive endpoints \\\(([\d.,\s]+)\\\) is the maximum', seg)
    ends = [Fr(v.strip()) for v in m.group(1).split(',')]
    return rows, ends


def r_certificate(checks, seg, printed=None):
    rows, ends = printed or parse_r_table(seg)
    w2 = w_ ** 2
    G0 = r_ ** 2 * w2
    chi = tp
    alE, beE = ALPHA_BETA['E']
    bad = []
    info = []
    for (L, H), row in zip(zip(ends[:-1], ends[1:]), rows):
        ang = 2 * r_ ** 2 * (1 - (1 - Iv.q(1 + w2 * (1 / L + L / 3) ** 2).sqrt()) / (2 * (1 + w2)))
        A0 = gu_(H) * H ** 2 * LC_(H) / 3 + imin(Iv.q(G0 * H ** 2 * (Fr(4, 3) + Fr('.05') * H ** 2)), ang)
        Q = chi + (2 * A0 + Fr('.05') * H ** 2) / (4 * lam)
        A = Q + H ** 4 / (25 * lam)
        B = H * (alE - beE * H) / (5 * lam)
        N0 = Fr('.855') * L * (1 - L + L ** 2 / 3 - Fr('.023') * L ** 4) / (3 * Fr('.193'))
        pr = [Fr(v, 10 ** 5) for v in row]
        dirs_ok = pr[0] >= A0.H and pr[1] >= Q.H and pr[2] >= A.H and pr[3] >= B and pr[4] <= N0
        tight = (pr[0] - Fr(1, 10 ** 5) < A0.L and pr[1] - Fr(1, 10 ** 5) < Q.L and pr[2] - Fr(1, 10 ** 5) < A.L
                 and pr[3] - Fr(1, 10 ** 5) < B and pr[4] + Fr(1, 10 ** 5) > N0)
        Qr, Ar, Br, Nr = pr[1], pr[2], pr[3], pr[4]
        Zs = (Ar + Iv.q(Ar ** 2 + 3 * Nr * Br).sqrt()) / (3 * Nr)
        mx = Qr / 25 + (Ar * Zs.sq() + 2 * Br * Zs) / 3
        if not (dirs_ok and mx.H < pr[5] and pr[5] < Fr('.027')):
            bad.append((float(L), float(A0.H), float(Q.H), float(A.H), float(B), float(N0), float(mx.H)))
        info.append('%.5f' % float(mx.H))
        if not tight:
            info.append('(row %s not the nearest 10^-5)' % L)
    check(checks, 'F8. the seven rows of (h^2 a_s, Q, A, B, N_0): each printed entry bounds its defining formula in the stated '
          'direction (A_0 with the angular square root enclosed), and the cubic Q/25 + A Z^2 + B Z - N_0 Z^3 formed from the '
          'rounded entries has maximum strictly below the printed last column, every one below .027',
          not bad and len(rows) == 7 and len(ends) == 8, 'maxima %s; %s' % (', '.join(info), bad[:2]))
    check(checks, 'F8. the fourth-row B = .4(.281 - .254(.4))/(5(.65)) = .02208 exactly', Fr('.4') * (alE - beE * Fr('.4')) / (5 * lam) == Fr('.02208'))
    check(checks, 'F8. h^2 a_s <= .16025 gives 1 - (.16025 + .0163)/1.3 > .86419 > .855, and .193^2 + .54^2/25 = .048913 < .05',
          1 - (Fr('.16025') + Fr('.0163')) / Fr('1.3') > Fr('.86419') and Fr('.193') ** 2 + Fr('.54') ** 2 / 25 == Fr('.048913'))
    check(checks, "F8. (h b_s)' = .281 - .508 h >= .00668 through .54", Fr('.281') - Fr('.508') * Fr('.54') >= Fr('.00668'))


# ---------------------------------------------------------------------------------------------------------------
# F9. the larger widths h in [.54, pi/w] (08-segments.tex lines 1077-1117) and F10b. h >= pi/w (lines 1119-1181)
# ---------------------------------------------------------------------------------------------------------------

def angular(h):
    """p_a = 2r^2(1 - A_h cos(wh)) and f_0^* = r^2/(1+w^2) (w^2 - sin^2(wh)/sinh^2 h) at a rational h"""
    w2 = w_ ** 2
    sn, cs = sincos_q(w_ * h)
    sh, ch = sinhcosh_q(h)
    Ah = (cs + w_ * (ch / sh) * sn) / (1 + w2)
    p = 2 * r_ ** 2 * (1 - Ah * cs)
    f = r_ ** 2 / (1 + w2) * (w2 - sn.sq() / sh.sq())
    return p, f


def parse_large_table(seg):
    i = seg.index(' p& f&U_P&R_P&R_O& P&O')
    j = seg.index('\\end{array}', i)
    rows = [[int(v) for v in r] for r in re.findall(r'(\d+)&(\d+)&(\d+)&(\d+)&(\d+)&(\d+)&(\d+)', seg[i:j])]
    m = re.search(r'For the intervals with endpoints \\\(([\d.,\s]+)\\\), write', seg)
    ends = [Fr(v.strip()) for v in m.group(1).split(',')]
    return rows, ends


def large_widths(checks, seg, printed=None):
    rows, ends = printed or parse_large_table(seg)
    w2 = w_ ** 2
    chi, bM = tp, Fr('.0163')
    piw = pi_iv() / w_
    check(checks, 'F9. w(.54) > 3 pi/4 (so wh in (3pi/4, pi] on [.54, pi/w]) and the last endpoint .684 > pi/w > .68',
          (w_ * Fr('.54')) > (3 * pi_iv() / 4).H and Fr('.684') > piw.H and piw.L > Fr('.68'))
    bad = []
    for (L, H), row in zip(zip(ends[:-1], ends[1:]), rows):
        p, f = angular(L)
        shL2 = sinhcosh_q(2 * L)[0]
        UP = Fr('.01815') + 1 / (312 * shL2.sq())
        shH, chH = sinhcosh_q(H)
        gH = Fr('.75') * (shH / H) * (1 + chH)
        RPh = min(Fr('.0802'), (H ** 2 * gH * LC_(Fr('.54')) / 3).H)        # an exact upper bound for R_P
        ROh = min(Fr('.0802'), (H ** 2 * gH * LC_(H / 2) / 3).H)
        pr = [Fr(v, 10 ** 5) for v in row]
        pu, fd, UPr, RPr, ROr = pr[:5]

        def budget(Rj):
            return (1 + chi) * fd - chi * (pu + bM) - ((Rj + pu + bM) ** 2 + (Fr('.08') + bM) ** 2) / (4 * lam)
        ok = (pu >= p.H and fd <= f.L and UPr >= UP.H and RPr >= RPh and ROr >= ROh and pr[5] <= budget(RPr) and pr[6] <= budget(ROr)
              and pr[5] > UPr and pr[6] > Fr('.01815'))
        if not ok:
            bad.append((float(L), float(p.H), float(f.L), float(UP.H), float(RPh), float(ROh), float(budget(RPr)), float(budget(ROr))))
    check(checks, 'F9. the three rows (L = .54, .58, .63): p(L) rounded up, f(L) rounded down, U_P = .01815 + 1/(312 sinh^2 2L), R_P, R_O '
          'bound their formulas; the budgets (1+chi)f - chi(p + b_M) - [(R_j + p + b_M)^2 + (.08 + b_M)^2]/(4 lambda) from the printed '
          'entries reach the printed P, O; and P > U_P, O > .01815 in every row', not bad and len(rows) == 3, str(bad[:2]))
    # h >= pi/w
    out = []
    coth68 = 1 / Fr('.68') + Fr('.68') / 3
    sh68, ch68 = sinhcosh_q(Fr('.68'))
    out.append(('coth(.68) <= 1/.68 + .68/3', (ch68 / sh68).H <= coth68))
    pmin = 2 * r_ ** 2 * (1 - (1 + Iv.q(1 + w2 * coth68 ** 2).sqrt()) / (2 * (1 + w2)))
    out.append(('p > .077 for h >= pi/w (angular range with coth h <= coth(.68))', pmin.L > Fr('.077')))
    dh = r_ ** 2 * (Iv.q(1 + w2).sqrt() - 1) / (1 + w2)
    out.append(('|d_h| <= r^2 (sqrt(1 + w^2) - 1)/(1 + w^2) < .00810 when d_h < 0; p <= 2r^2 = .0968', dh.H < Fr('.00810') and 2 * r_ ** 2 == Fr('.0968')))
    out.append(('pi <= wh <= 4.14 < 3pi/2 on [pi/w, .9]', w_ * Fr('.9') == Fr('4.14') and Fr('4.14') < (3 * pi_iv() / 2).L))
    sh78 = sinhcosh_q(Fr('.78'))[0]
    sh9, ch9 = sinhcosh_q(Fr('.9'))
    sh136 = sinhcosh_q(Fr('1.36'))[0]
    sh18 = sinhcosh_q(Fr('1.8'))[0]
    out.append(('sinh(.78) > .85, sinh(.9) > 1.024, coth(.9) < 1.3965, sinh(1.36) > 1.819, sinh(1.8) > 2.94',
                sh78.L > Fr('.85') and sh9.L > Fr('1.024') and (ch9 / sh9).H < Fr('1.3965') and sh136.L > Fr('1.819') and sh18.L > Fr('2.94')))
    f1 = r_ ** 2 / (1 + w2) * (w2 - (w_ * (Fr('.78') - Fr('.68'))) ** 2 / sh68.sq())
    f2 = r_ ** 2 / (1 + w2) * (w2 - 1 / Fr('.85') ** 2)
    out.append(('f >= .0431 on [pi/w, .9] (|sin wh| <= w(h - pi/w) <= .46 with sinh h >= sinh .68 up to .78; |sin| <= 1, sinh >= .85 after)',
                f1.L >= Fr('.0431') and f2 >= Fr('.0431')))

    def budget(f, p, cd):
        return (1 + chi) * f - chi * (p + bM) - ((Fr('.0802') + p + bM) ** 2 + (cd + bM) ** 2) / (4 * lam)
    out.append(('on [pi/w, .9]: budget >= .02005 > .01912 >= .01815 + 1/(312(1.819)^2) (2h >= 2pi/w > 1.36)',
                budget(Fr('.0431'), Fr('.0968'), Fr('.08810')) >= Fr('.02005') and Fr('.01815') + 1 / (312 * Fr('1.819') ** 2) <= Fr('.01912')
                and (2 * piw).L > Fr('1.36') and Fr('.02005') > Fr('.01912')))
    f9 = r_ ** 2 / (1 + w2) * (w2 - 1 / Fr('1.024') ** 2)
    p9 = 2 * r_ ** 2 * (1 - (1 - Iv.q(1 + w2 * Fr('1.3965') ** 2).sqrt()) / (2 * (1 + w2)))
    out.append(('h >= .9: f >= .04413, p <= .10882, cost <= .01815 + 1/(312(2.94)^2) <= .01853',
                f9 >= Fr('.04413') and p9.H <= Fr('.10882') and Fr('.01815') + 1 / (312 * Fr('2.94') ** 2) <= Fr('.01853')))
    out.append(('h >= .9 budgets: d_h < 0 (p <= .0968, |c_d - p_d| <= .08810) >= .02115 > .01853; d_h >= 0 (p <= .10882, .08) >= .01916 > .01853',
                budget(Fr('.04413'), Fr('.0968'), Fr('.08810')) >= Fr('.02115') and budget(Fr('.04413'), Fr('.10882'), Fr('.08')) >= Fr('.01916')
                and Fr('.02115') > Fr('.01853') and Fr('.01916') > Fr('.01853')))
    for name, ok in out:
        check(checks, 'F10. h >= pi/w: ' + name, ok)


# ---------------------------------------------------------------------------------------------------------------
# F10c. short widths (08-segments.tex lines 175-257) and the tail cases (lines 259-394)
# ---------------------------------------------------------------------------------------------------------------

def short_and_tails(checks):
    w2 = w_ ** 2
    G = r_ ** 2 * w2
    chi = tp
    out = []
    sh, ch = sinhcosh_q(Fr('.16'))
    S16 = sh / Fr('.16')
    out.append(('h <= .16: W <= (3/2) S <= 1.507 and int W <= S(1 + cosh h)/2 <= 1.012', (Fr(3, 2) * S16).H <= Fr('1.507') and (S16 * (1 + ch) / 2).H <= Fr('1.012')))
    hh = Fr('.54')
    out.append(('mean of beta^2: (1/3 + h^2/10 + (7/5) h^4/168) <= (1/3 + .05 h^2)(1 + h^2/6) for h <= .54, with cosh(.54) <= (1 - .54^2/2)^-1 < 7/5',
                all(Fr(1, 3) + h2 / 10 + Fr(7, 5) * h2 ** 2 / 168 <= (Fr(1, 3) + Fr('.05') * h2) * (1 + h2 / 6) for h2 in [hh ** 2 * Fr(k, 50) for k in range(51)])
                and Fr(1, 3) / 10 - Fr(1, 18) - Fr('.05') < 0 and Fr(7, 5 * 168) - Fr('.05') / 6 <= 0
                and sinhcosh_q(hh)[1].H <= 1 / (1 - hh ** 2 / 2) < Fr(7, 5)))
    H = Fr('.16')
    P = 4 + Fr('.15') * H ** 2
    Q = Fr('.193') ** 2 * P / G
    v = ((1 + chi) * (1 - 2 * w2 ** 2 * H ** 2 / (15 * (1 + w2))) / (1 + H ** 2 / 3) - chi * (P + Q)
         - 1 / (4 * lam) * (G * H ** 2 / 3 * (P + Q + Fr('.79') * Fr('1.012') / G) ** 2
                            + 3 / G * (Fr('.247') + Fr(2, 3) * (G + Fr('.193') * Fr('.53') * Fr('1.012')) * H ** 2) ** 2))
    out.append(('short widths: the displayed rational lower bound is > .55510 > .55 > .54', v > Fr('.55510'), '%.6f' % float(v)))
    # tail cases
    sh11, ch11 = sinhcosh_q(Fr('1.1'))
    sh14, ch14 = sinhcosh_q(Fr('1.4'))
    out.append(('sinh(1.1) > 1.335, coth(1.1) < 1.25, sinh(1.4) > 1.904, coth(1.4) < 1.13',
                sh11.L > Fr('1.335') and (ch11 / sh11).H < Fr('1.25') and sh14.L > Fr('1.904') and (ch14 / sh14).H < Fr('1.13')))

    def angbounds(sh_lo, coth_hi):
        f = r_ ** 2 / (1 + w2) * (w2 - 1 / sh_lo ** 2)
        root = Iv.q(1 + w2 * coth_hi ** 2).sqrt()
        pa_lo = 2 * r_ ** 2 * (1 - (1 + root) / (2 * (1 + w2)))
        pa_hi = 2 * r_ ** 2 * (1 - (1 - root) / (2 * (1 + w2)))
        pd = 2 * r_ ** 2 * (coth_hi + Iv.q(coth_hi ** 2 + w2).sqrt()) / (2 * (1 + w2))
        return f, pa_lo, pa_hi, pd
    f, pl, ph, pd = angbounds(Fr('1.335'), Fr('1.25'))
    out.append(('central/distant (h >= 1.1): f_0^* >= .0449, .0818 <= p_a <= .1074, |p_d| <= .0132',
                f >= Fr('.0449') and pl.L >= Fr('.0818') and ph.H <= Fr('.1074') and pd.H <= Fr('.0132')))
    f, pl, ph, pd = angbounds(Fr('1.904'), Fr('1.13'))
    out.append(('opposite tails (h >= 1.4): f_0^* >= .0456, .0830 <= p_a <= .1062, |p_d| <= .0129',
                f >= Fr('.0456') and pl.L >= Fr('.0830') and ph.H <= Fr('.1062') and pd.H <= Fr('.0129')))
    x36 = s_ * sinhcosh_q(Fr('3.6'))[0]
    x14 = s_ * sh14
    out.append(('x_+ > 65.8 and |x_-| < 6.86; mean K <= max{(.422 + .126)/65.8, .422/(65.8 - 6.86)} < .0084',
                x36.L > Fr('65.8') and x14.H < Fr('6.86') and max((Fr('.422') + Fr('.126')) / Fr('65.8'), Fr('.422') / (Fr('65.8') - Fr('6.86'))) < Fr('.0084')))
    pr = Fr(10) / (Fr('65.8') - Fr('6.86'))
    out.append(('b_+ <= (10/58.94)(.1781)^2 + (1 - 10/58.94)(.0353)^2 < .0068, with .1781 = .2556 - .0775, .0353 = .2556 - .2203; b_- <= .1784^2 < .032',
                pr * Fr('.1781') ** 2 + (1 - pr) * Fr('.0353') ** 2 < Fr('.0068') and Fr('.2556') - Fr('.0775') == Fr('.1781')
                and Fr('.2556') - Fr('.2203') == Fr('.0353') and Fr('.2559') - Fr('.0775') == Fr('.1784') and Fr('.1784') ** 2 < Fr('.032')))
    Cm, CM = Fr('-.501'), Fr('-.341')
    Ct = (Fr('-.5002'), Fr('-.4998'))
    out.append(('C ranges: central/distant c_a in [-.081, .160], |c_d| <= .080; opposite tails c_a in [-.006, .160], |c_d| <= .003',
                Cm - (Ct[1] + CM) / 2 >= Fr('-.081') and CM - (Ct[0] + Cm) / 2 <= Fr('.160') and (CM - Ct[0]) / 2 <= Fr('.080')
                and Cm - Fr('-.495') >= Fr('-.006') and CM - Cm <= Fr('.160') and (Fr('-.495') - Cm) / 2 <= Fr('.003')))
    dK = Fr('.80') / ms ** 2

    def ekg(Im, Ip, o, kbar):
        best = None
        for zm in Im:
            for zp in Ip:
                val = -(zp + zm) / 2 + dK * (Fr('1.25') * (abs(zp - zm) + tc * o) ** 2 + 5 * tr ** 2 * o ** 2)
                best = val if best is None else max(best, val)
        return kbar + best
    e1 = ekg((Fr('-.007'), Fr('.0275')), (Fr(0), Fr('.0008')), Fr('.160'), Fr('.0084'))
    e2 = ekg((Fr('-.0001'), Fr('.0191')), (Fr('-.0001'), Fr('.0191')), Fr('.006'), Fr('.0275'))
    out.append(('the e_K + Gamma table: vertex maxima give <= .0144 (central/distant) and <= .0277 (opposite tails)',
                e1 <= Fr('.0144') and e2 <= Fr('.0277'), '%.6f, %.6f' % (float(e1), float(e2))))
    b1 = (1 + chi) * Fr('.0449') - (Fr('.2078') ** 2 + Fr('.1092') ** 2) / (4 * lam) - chi * (Fr('.1074') + Fr('.0194'))
    b2 = (1 + chi) * Fr('.0456') - (Fr('.1442') ** 2 + Fr('.0319') ** 2) / (4 * lam) - chi * (Fr('.1062') + Fr('.032'))
    out.append(('the tail budgets: 1.064(.0449) - (.2078^2 + .1092^2)/2.6 - .064(.1074 + .0194) > .018 > .0144 and '
                '1.064(.0456) - (.1442^2 + .0319^2)/2.6 - .064(.1062 + .032) > .031 > .0277, with the cost components as stated',
                b1 > Fr('.018') > Fr('.0144') and b2 > Fr('.031') > Fr('.0277') and (Fr('.0068') + Fr('.032')) / 2 == Fr('.0194')
                and Fr('.081') + Fr('.1074') + Fr('.0194') == Fr('.2078') and Fr('.080') + Fr('.0132') + Fr('.016') == Fr('.1092')
                and Fr('.006') + Fr('.1062') + Fr('.032') == Fr('.1442') and Fr('.003') + Fr('.0129') + Fr('.016') == Fr('.0319')
                and Fr('.160') - Fr('.0818') < Fr('.2078') and Fr('.160') - Fr('.0830') < Fr('.1442') and Fr('.032') / 2 == Fr('.016')))
    # positive tail
    sh3, ch3 = sinhcosh_q(Fr('.3'))
    sh4 = sinhcosh_q(Fr('.4'))[0]
    G3 = 4 + Fr('.15') * Fr('.09') + Fr('.6')
    fr3 = (1 - 2 * w2 ** 2 * Fr('.09') / (15 * (1 + w2))) / (1 + Fr('.09') / 3)
    f16 = angular(Fr('.16'))[1]
    out.append(('positive tail, h in [.16, .4]: f/h^2 > .18 (short-width bound at h = .4) and Gamma/f <= .10; h >= .4: f >= .0332 (sinh .4 > .410)',
                G / 3 * (1 - 2 * w2 ** 2 * Fr('.16') / (15 * (1 + w2))) / (1 + Fr('.16') / 3) > Fr('.18')
                and dK * 4 * (Fr('1.25') * (Fr('.0211') + tc * Fr('.0084')) ** 2 + 5 * tr ** 2 * Fr('.0084') ** 2) / Fr('.18') <= Fr('.10')
                and sh4.L > Fr('.410') and r_ ** 2 / (1 + w2) * (w2 - 1 / Fr('.410') ** 2) >= Fr('.0332')
                and dK * (Fr('1.25') * (Fr('.0192') + tc * Fr('.006')) ** 2 + 5 * tr ** 2 * Fr('.006') ** 2) / Fr('.0332') <= Fr('.10')))
    pd3 = 2 * r_ ** 2 * (Fr('3.434') + Iv.q(Fr('3.434') ** 2 + w2).sqrt()) / (2 * (1 + w2))
    pa3 = 2 * r_ ** 2 * (1 - (1 - Iv.q(1 + w2 * Fr('3.434') ** 2).sqrt()) / (2 * (1 + w2)))
    out.append(('positive tail: p_a + |p_d| <= (4 + .15h^2 + 2h)u_0 <= .150 and <= 6.65 f up to h = .3; coth(.3) < 3.434 gives <= .150 '
                'after; f >= .02256 (sinh .3 > .304), .150 < 6.65(.02256); f(.16) >= .008',
                (G3 * G * Fr('.09') / 3) <= Fr('.150') and G3 / fr3 <= Fr('6.65') and (ch3 / sh3).H < Fr('3.434') and (pa3 + pd3).H <= Fr('.150')
                and sh3.L > Fr('.304') and r_ ** 2 / (1 + w2) * (w2 - 1 / Fr('.304') ** 2) >= Fr('.02256') and Fr('.150') < Fr('6.65') * Fr('.02256')
                and f16.L >= Fr('.008')))
    lhs = (Fr('.10') + 1 / (4 * lam) * (Iv.q(Fr('.150') * Fr('6.65')).sqrt() + Fr('.00645') / Iv.q(Fr('.008')).sqrt()).sq()
           + chi * (Fr('6.65') + Fr('.00045') / Fr('.008')))
    out.append(('positive tail: .10 + (sqrt(.150(6.65)) + .00645/sqrt(.008))^2/(4 lambda) + t_+(6.65 + .00045/.008) < 1 + t_+, with '
                '|C - C_pm| <= .006, b_pm <= (.2559 - .235)^2 <= .00045', lhs.H < 1 + chi and (Fr('.2559') - Fr('.235')) ** 2 <= Fr('.00045'),
                '%.5f' % float(lhs.H)))
    out.append(('middle widths: 2r^2/T_0^2 > .33, c_a <= .79 g_u(.54)/(1.5 . 3) h^2 < .33 h^2, .53 g_u(.54)/(1.5 . 3) < 1/5, 2(.193)/5 <= .078',
                2 * r_ ** 2 / Fr('.54') ** 2 > Fr('.33') and Fr('.79') * gu_(Fr('.54')) / Fr('4.5') < Fr('.33')
                and Fr('.53') * gu_(Fr('.54')) / Fr('4.5') < Fr(1, 5) and 2 * Fr('.193') / 5 <= Fr('.078')))
    for name, ok, *det in out:
        check(checks, 'F10. ' + name, ok, det[0] if det else '')


# ---------------------------------------------------------------------------------------------------------------
# the decision
# ---------------------------------------------------------------------------------------------------------------

def decide(src=None, edits=None):
    src = src or Sources()
    edits = edits or {}
    t0 = time.time()
    checks = []
    abstract = ' '.join(src.text(ABSTRACT).split())
    cones = src.text(CONES)
    scalar = src.text(SCALAR)
    seg = src.text(SEGMENTS)
    check(checks, 'the headline as stated (abstract.tex)', '$|K|\\,|(K-s(K))^\\circ|\\ge (n+1)^{n+1}/(n!)^2$, with equality exactly for simplices.' in abstract)
    check(checks, 'the finite appendices feed one interface, Proposition prop:scalar-input (01-cones.tex line 138), proved in Appendices 07 and 08',
          '\\begin{proposition}[Scalar inequalities]\\label{prop:scalar-input}' in cones and 'Their proofs appear in Appendices~\\ref{sec:07-scalar} and~\\ref{sec:08-segments}' in cones)
    flat = ' '.join(scalar.split())
    check(checks, 'the parameters as printed: b = .602, c = .365, r = .22, s = 3.6, w = 4.6, eta = .022, kappa = 1.16, a_R = 7.5, lambda = .65; '
          't_- = -.022, t_+ = .064, t_c = .021, t_r = .043, m_* = .352',
          'b=.602,\\quad c=.365,\\quad k=\\sqrt{b-c},\\quad r=.22,\\quad s=3.6,\\quad w=4.6,' in flat
          and '\\eta=.022,\\quad \\kappa=1.16,\\quad a_R=7.5,\\quad \\lambda=.65.' in flat
          and 't_-= -.022,\\ t_+=.064,\\ t_c=.021,\\ t_r=.043,\\ m_*=.352' in flat and tc + tr == tp and tc - tr == tm)
    stable_identities(checks)
    cert_rows = parse_cert_table(scalar)
    if 'cert' in edits:
        cert_rows = edits['cert'](cert_rows)
    scalar_certificates(checks, scalar, cert_rows)
    rows, mins = parse_layer_table(scalar)
    if 'layer' in edits:
        rows, mins = edits['layer'](rows, mins)
    layer_table(checks, scalar, rows, mins)
    chord_chain(checks)
    strip_arithmetic(checks)
    interpolation_constants(checks)
    segment_auxiliary(checks, seg)
    bt = parse_bernstein_table(seg)
    if 'bernstein' in edits:
        bt = edits['bernstein'](bt)
    middle_certificates(checks, seg, printed=bt)
    r_certificate(checks, seg)
    large_widths(checks, seg)
    tail_lemma(checks, scalar)
    short_and_tails(checks)
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the finite certificates of Appendices 07-08 (the 152-node profile enclosures and every '
                       'printed node bound and finite sum; the stable-formula identities; the layer rectangles; the chord-error, tail-'
                       'vector, interpolation and strip arithmetic; the segment threshold sums and sample tables; the two Bernstein '
                       'certificates; the cubic and larger-width tables; the tail and short-width budgets) that support '
                       'Proposition prop:scalar-input. Not the analytic interpolation/tail/segment-reduction arguments, and not '
                       'sections 01-06 and 09, where the convex-geometric proof of the Mahler inequality lives',
            'value': {'checks': len(checks), 'nodes': 152, 'node_precision_bits': PREC, 'seconds': round(time.time() - t0, 1)}}


def forge():
    """each must NOT certify (the node enclosures are cached across runs)"""
    out = []

    def k_tighter(rows):
        rows = list(rows)
        i = [r[0] for r in rows].index('\\mathsf K')
        name, vb, d2, d1 = rows[i]
        rows[i] = (name, vb, Fr('.000147'), d1)
        return rows
    out.append(('the |Delta^2 K| bound printed one unit lower (.000148 -> .000147; the true maximum is .00014705)',
                decide(edits={'cert': k_tighter})['verdict']))

    def b_higher(bt):
        tab, degs = bt
        tab = dict(tab)
        tab['T4'] = [174] + tab['T4'][1:]
        return tab, degs
    out.append(('the first Bernstein group bound of T_(4) printed one unit higher (173 -> 174; the true minimum is 173.69e-5)',
                decide(edits={'bernstein': b_higher})['verdict']))

    def q_higher(rows, mins):
        rows = [list(r) for r in rows]
        rows[0] = (rows[0][0], rows[0][1], [78] + rows[0][2][1:])
        return rows, mins
    out.append(('the layer table q_min of row 0:4 printed one unit higher (77 -> 78; q(0) - .000042 = .077754)',
                decide(edits={'layer': q_higher})['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    print(forge())
