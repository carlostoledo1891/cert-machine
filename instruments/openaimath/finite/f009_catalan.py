"""F-009 — "Catalan's constant is irrational" (openai/math family 005).

THE CLAIM (main.tex abstract; introduction.tex:16-18, Theorem thm:main): G = sum_{j>=0} (-1)^j/(2j+1)^2 is irrational.
The proof is a contradiction (conclusion.tex:3-16) between two bounds on L_N = log|Delta_N|/n^2 - (1/2) log 2,
n = 48N (introduction.tex:172-182):
  UPPER  certificate.tex:7-16, Prop prop:real-upper: limsup L_N <= -2.290939875 < -2.2909, for the determinants of
         foundations.tex:78-82, with no hypothesis on G; the two cases kappa = 2, 1 give -2.290939875, -2.296789875.
  LOWER  odd-primes.tex:516-525, Prop prop:finite-lower: if G is rational, along any sequence with Delta_N != 0,
         liminf L_N >= -8609/4608 - (1/2 + 505/4608) log 2 > -2.29084.
  NONZERO nonvanishing.tex:7-14 and 38-42: if G is rational, Delta_p != 0 for every large prime p, given that the three
         fixed 48 x 48 rational matrices B0, B0 + B1, B0 - B1 built from the 49 x 48 base matrix B are invertible.
The census row names three finite components; each is decided here, then the final comparison, from this file's
own numbers.

DECIDED HERE, exactly (int and Fraction only; every transcendental enclosed by rationals proved below):

(1) THE REAL-PLACE CERTIFICATE (certificate.tex). For kappa = 2, 1 and the published trial sequences p, v (the
    coefficient tables, x 10^-8, the exponential tails with r_z = (a - ib)/2 for a nonreal base, lambda_1 =
    2.47405979, lambda_2 = 0), the right side of energy.tex Eq. (eq:energy-dual),
        RHS_kappa = (-1 + alpha + gamma) log 2 + kappa ||p||_*^2 + ||v||_*^2 / 2 + sup X_kappa + sup Y_kappa,
    with alpha, beta, gamma, eta = 11/48, 7/48, 4/48, 2/48 (real-place.tex:5-13), W, D from energy.tex:10-16 and the
    closed log forms certificate.tex:88-116 (derived independently: sum_k z^k T_k(x)/k = -(1/2) Log(1-2xz+z^2)
    with the principal Log, sum_k z^k x^k / k = -Log(1-xz), sum_k (zz')^k/k = -Log(1-zz')).
    HOW the suprema are bounded — not with the paper's brackets: the derivative numerator A = Q X' (Q the paper's
    common denominator, nonvanishing on the open domain — checked by a Sturm count) is built here as a polynomial
    over Q; a Sturm sequence counts its distinct real roots on (-1,0), (0,1); this file isolates them itself
    (Sturm bisection, then sign bisection to width 2^-36); on each isolating interval [a,b],
    sup X <= X(a) + max|X'| (b - a), with X(a) enclosed and |X'| enclosed termwise in interval arithmetic; the
    finite endpoint x = -1 of X's domain is evaluated; X, Y tend to -infinity at 0 and 1 (the log|x|, log(1-x)
    terms with positive weights 19/48, 1/12, 7/48, 1/12; every other term is bounded there). So the global suprema
    are certified without any number from the paper. The derivative terms are tied to the value function by a
    mean-value containment test (X(a+h) - X(a) inside h * enclosure(X' on [a,a+h]), tight to 2%) at 24 points. Then, as separate checks against the paper's printed
    certificate: the degrees d_0 and the Descartes variation counts of Eq. (eq:certificate-descartes-transform)
    on the printed division points; every printed root bracket (m, m+2)/10^10 has a sign change of A, and the
    count per interval equals the Sturm count (so the brackets are exactly the critical points); all 50 printed
    candidate values (each must be a valid upper bound AND equal the true value rounded up at 12 places); the two
    printed norm bounds; the stronger and the coarse cutoffs; the printed derivative bounds |X'| < 12852,
    |Y'| < 102001 on every bracket; .693146 < log 2 < .693149; and the exact arithmetic of the two final lines.
(2) THE FIXED MATRICES (nonvanishing.tex:17-42, 278-390). The 49 x 48 base matrix B(r,k) is built twice: (i) from
    the definitions — P_r, D_r from the explicit Chebyshev coefficient formulas (foundations.tex:36-43), m_i, k-/+
    from the closed forms Eq. (eq:moment-values), (eq:explicit-boundary-arrays), M^0 from the diagonal-reduction
    closed form (eq:diagonal-reduction), Z^0 from (eq:rational-z); (ii) by the paper's recipe (recurrences, the
    E/I polynomial recursion, four consecutive differences). Every entry agrees. The rows are also checked
    against their purpose: t P_r / f - D_r has t-order exactly 59 + r with leading coefficient 2^(4-r), so the
    zeta(2) contact holds below L = 59. Then det B0, det(B0 + B1), det(B0 - B1) are computed EXACTLY over Q (integer
    Bareiss after positive row scaling) and are nonzero; separately, the paper's elimination rule is run mod 101
    and its 144 pivots and its row swaps are compared with tab:modular-pivots (a nonzero pivot sequence mod 101,
    with every denominator 65-smooth, is a second proof of nonvanishing over Q: det(B mod 101) != 0 forces the
    integer det of the row-scaled matrix to be nonzero).
(3) THE FINITE-PLACE CONSTANT (odd-primes.tex:529-671, foundations.tex:271-277). The loss function d(x) is rebuilt
    as an exact piecewise-linear function from the paper's counting formulas — d0 for x <= 65/2
    (odd-primes.tex:308-326) and R, S, min(2n, n+R, 2R+S) for x > 65/2 (Lemma lem:odd-local-elimination) — and
    compared piece by piece with the printed tables (d0 pieces, R/S table, the loss table with endpoint values and
    integrals) and the area 8609/2; the 2-adic constant delta/2 + delta^2/8 = 505/4608 with delta = 10/48 and the
    quadratic minimization behind it; the printed log 2 < 693149/10^6 inequality; the printed rational
    -10556055541/4608000000 > -2.29084.
(4) THE FINAL COMPARISON, from this file's own enclosures: max(RHS_2, RHS_1) < -8609/4608 - (2809/4608) log 2,
    strictly, with log 2 enclosed here (RHS uses its lower end, the lower constant its upper end); and the
    paper's own chain -2.290939875 < -2.29084.

TRANSCENDENTALS. log y for y in [1, 3/2]: 2 atanh(q), q = (y-1)/(y+1) <= 1/5, positive series, the tail bounded by
q^(2J+1)/((2J+1)(1-q^2)); log 2 = log(4/3) + log(3/2); general x by powers of 2. Cross-checked against
log 2 = sum 1/(k 2^k). arctan on [0,1]: arctan t = arctan(1/2) + arctan((2t-1)/(2+t)) (the sum stays in
(-pi/2, pi/2)), alternating series on |s| <= 1/2 with remainder <= |s|^(2J+1)/(2J+1); pi = 16 arctan(1/5) -
4 arctan(1/239) (Machin), cross-checked against 4(arctan(1/2) + arctan(1/3)). Principal Arg by octant reduction.
Every series runs in 192-bit fixed point with directed rounding (floor for lower, ceiling for upper, monotone
argument rounding outward). These are not the paper's procedure (it uses 18-term atanh in [1,2] and
arctan(1/2) + arctan(1/3) rotations).

NOT DECIDED HERE — the analytic framework that turns these finite facts into irrationality:
  * that RHS_kappa bounds limsup L_N: Prop prop:energy-reduction (Haagerup/Chebyshev energy expansion, damping,
    diagonal corrections, the limit order), the interpolation Lemma lem:real-uniform-interpolation and
    Prop prop:first-sheet-bound, the Hadamard estimate, Andreief and Cauchy (real-place.tex, energy.tex);
  * that d(x) and 505/4608 bound the p-adic valuations: the digit reductions, the central layer, the local
    elimination, the 2-adic smoothing (odd-primes.tex:21-507, foundations.tex:264-434), the prime number theorem
    weighting, and the small-prime o(n^2) estimate;
  * that nonvanishing of the three fixed matrices gives Delta_p != 0: the palindromic bases, Frobenius, the block
    factorization (nonvanishing.tex:45-276, 391-413);
  * the moment evaluations M = M^0 + 4G c + (3/2) zeta(2) c', Z = Z^0 + [i=j] zeta(2), K-_0 = 4G, K+_1 = pi^2/4.
A CERTIFIED here certifies these finite components and the final strict inequality between the two constants; it is
not a check of the proof of the theorem.

THE AUTHORS' CHECKER (read only after this file ran; nothing from the clone is executed here): the release ships no
script for this paper but a Lean 4 tree, lean/OAI/NumberTheory/Catalan (981 files), whose top theorem
OAI.InternalCatalan.catalan_irrational (Results/Conclusions.lean:11) is the comparator challenge's statement
(ComparatorChallenges/Catalan.json: propext, Quot.sound, Classical.choice only); by grep the tree has no sorry, no
axiom and no native_decide, and checks its finite certificates with decide +kernel (e.g. the mod-101 row relations
and the 48 Gaussian steps per sigma under FiniteMatrices/, the Descartes and log steps under SecondBarrier/). Its
final step compares the rounded constants -2.2909 < -2.29084 (Arithmetic/FinitePlaceNumerics.lean:28-30). Whether
that tree compiles is NOT decided here.

RESULT (2026-10-09, release fd4aeeb2): every printed number of the three components reproduces exactly — the 50
candidate values and both norm bounds are the true values rounded up at 12 places, all 43 brackets and 11 variation
counts, all 144 pivots and both swaps. This file's own right sides are -2.2911025073 (kappa = 2) and -2.2974954410
(kappa = 1) against the lower constant -2.2908095552: margin 2.93e-4 (the paper's rounded chain keeps 9.99e-5).
The three exact determinants have 1994/1770, 2008/1769, 2013/1767 numerator/denominator digits. About 13 s; the
forges about 90 s.
"""
import os
import re
import sys
from fractions import Fraction as Fr
from math import comb, gcd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

SEC = 'preprints/Catalans-constant-is-irrational-September-24-2026/build/sections/'
CERT, NONV, ODD = SEC + 'certificate.tex', SEC + 'nonvanishing.tex', SEC + 'odd-primes.tex'
REALP, ENERGY, FOUND = SEC + 'real-place.tex', SEC + 'energy.tex', SEC + 'foundations.tex'
INTRO, CONCL = SEC + 'introduction.tex', SEC + 'conclusion.tex'
E8 = Fr(1, 10 ** 8)
TEN10 = 10 ** 10


# ---------------------------------------------------------------- rigorous rational enclosures (intervals of Fractions)

PREC = 192
SCALE = 1 << PREC
SCALE2 = SCALE * SCALE


def _fl(x):
    return (x.numerator << PREC) // x.denominator


def _ce(x):
    return -(((-x.numerator) << PREC) // x.denominator)


def _powers(Q, terms):
    """lower and upper integer bounds of 2^PREC u^(2j+1), j = 0..terms, for u = Q / 2^PREC >= 0"""
    lo, hi = [Q], [Q]
    Q2 = Q * Q
    for _ in range(terms):
        lo.append(lo[-1] * Q2 // SCALE2)
        hi.append(-((-hi[-1] * Q2) // SCALE2))
    return lo, hi


def _log_small(y):
    """log y for 1 <= y <= 3/2: 2 atanh(q), q = (y-1)/(y+1) in [0, 1/5]; positive series, geometric tail"""
    assert 1 <= y <= Fr(3, 2)
    q = (y - 1) / (y + 1)
    J = 60
    Qlo, Qhi = _fl(q), _ce(q)
    plo, _ = _powers(Qlo, J)
    lo = sum(plo[j] // (2 * j + 1) for j in range(J))
    _, phi = _powers(Qhi, J)
    hi = sum(-((-phi[j]) // (2 * j + 1)) for j in range(J))
    hi += -((-phi[J] * SCALE2) // ((2 * J + 1) * (SCALE2 - Qhi * Qhi)))
    return (Fr(2 * lo, SCALE), Fr(2 * hi, SCALE))


def _atan_small(s):
    """arctan s for |s| <= 1/2, alternating series, remainder <= |s|^(2J+1)/(2J+1)"""
    assert abs(s) <= Fr(1, 2)
    if s < 0:
        lo, hi = _atan_small(-s)
        return (-hi, -lo)
    J = 100
    a, b = _powers(_fl(s), J)
    lo = sum((a[j] // (2 * j + 1)) if j % 2 == 0 else (((-b[j]) // (2 * j + 1))) for j in range(J)) + ((-b[J]) // (2 * J + 1))
    a, b = _powers(_ce(s), J)
    hi = sum((-((-b[j]) // (2 * j + 1))) if j % 2 == 0 else (-(a[j] // (2 * j + 1))) for j in range(J)) - ((-b[J]) // (2 * J + 1))
    return (Fr(lo, SCALE), Fr(hi, SCALE))


def iadd(*xs):
    return (sum(x[0] for x in xs), sum(x[1] for x in xs))


def ineg(x):
    return (-x[1], -x[0])


def isub(x, y):
    return (x[0] - y[1], x[1] - y[0])


def iscale(c, x):
    return (c * x[0], c * x[1]) if c >= 0 else (c * x[1], c * x[0])


def imul(x, y):
    ps = (x[0] * y[0], x[0] * y[1], x[1] * y[0], x[1] * y[1])
    return (min(ps), max(ps))


def idiv(x, y):
    assert y[0] > 0 or y[1] < 0, 'division by an interval containing 0'
    return imul(x, (1 / y[1], 1 / y[0]))


def ipt(c):
    c = Fr(c)
    return (c, c)


LOG2 = iadd(_log_small(Fr(4, 3)), _log_small(Fr(3, 2)))


def log_iv(x):
    """log of a positive rational"""
    x = Fr(x)
    if x <= 0:
        raise ValueError('log of a nonpositive number')
    m = x.numerator.bit_length() - x.denominator.bit_length()
    y = x / Fr(2) ** m
    while y >= 2:
        y /= 2
        m += 1
    while y < 1:
        y *= 2
        m -= 1
    L = _log_small(y) if y <= Fr(3, 2) else isub(LOG2, _log_small(2 / y))
    return iadd(iscale(Fr(m), LOG2), L)


ATAN_HALF = _atan_small(Fr(1, 2))


def _atan01(t):
    """arctan t, 0 <= t <= 1: arctan(1/2) + arctan((2t-1)/(2+t))"""
    assert 0 <= t <= 1
    return iadd(ATAN_HALF, _atan_small((2 * t - 1) / (2 + t)))


PI = isub(iscale(Fr(16), _atan_small(Fr(1, 5))), iscale(Fr(4), _atan_small(Fr(1, 239))))
HALF_PI = iscale(Fr(1, 2), PI)


def arg_iv(a, b):
    """principal argument in (-pi, pi] of a + ib (rational, not both zero)"""
    a, b = Fr(a), Fr(b)
    if b == 0:
        if a > 0:
            return ipt(0)
        if a < 0:
            return PI
        raise ValueError('arg of 0')
    if b < 0:
        return ineg(arg_iv(a, -b))
    if a >= b:
        return _atan01(b / a)
    if a > -b:
        t = a / b
        at = _atan01(t) if t >= 0 else ineg(_atan01(-t))
        return isub(HALF_PI, at)
    return isub(PI, _atan01(b / -a))


def re_c_log(c, w):
    """Re(c Log w) for Gaussian rationals c, w (principal Log): Re c log|w| - Im c Arg w"""
    out = iscale(c[0] / 2, log_iv(w[0] * w[0] + w[1] * w[1]))
    if c[1] != 0:
        out = isub(out, iscale(c[1], arg_iv(w[0], w[1])))
    elif w[1] == 0 and w[0] < 0:
        raise ValueError('real weight on a negative real log argument')
    return out


def transcendental_selftests():
    k = 200
    s = sum(Fr(1, j * 2 ** j) for j in range(1, k + 1))
    alt = (s, s + Fr(1, (k + 1) * 2 ** k))
    pi2 = iscale(Fr(4), iadd(_atan01(Fr(1, 2)), _atan01(Fr(1, 3))))
    l3 = log_iv(3)
    l6 = log_iv(6)
    a = arg_iv(-1, Fr(1, 10 ** 6))
    ok = (max(LOG2[0], alt[0]) <= min(LOG2[1], alt[1]) and max(PI[0], pi2[0]) <= min(PI[1], pi2[1])
          and isub(l6, iadd(l3, LOG2))[0] <= 0 <= isub(l6, iadd(l3, LOG2))[1]
          and a[0] < PI[0] and PI[1] - a[0] < Fr(2, 10 ** 6)
          and LOG2[1] - LOG2[0] < Fr(1, 10 ** 50) and PI[1] - PI[0] < Fr(1, 10 ** 50))
    return ok, 'log 2 in [%.20f, +%.1e]; pi in [%.20f, +%.1e]; both cross-checked by a second series' % (
        float(LOG2[0]), float(LOG2[1] - LOG2[0]), float(PI[0]), float(PI[1] - PI[0]))


# ---------------------------------------------------------------- univariate polynomials over Q (lists, index = degree)

def ptrim(a):
    a = list(a)
    while a and a[-1] == 0:
        a.pop()
    return a


def padd(a, b):
    n = max(len(a), len(b))
    return ptrim([(a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0) for i in range(n)])


def pscale(c, a):
    return ptrim([c * x for x in a])


def pmul(a, b):
    if not a or not b:
        return []
    out = [0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                out[i + j] += x * y
    return ptrim(out)


def pdivmod(a, b):
    a = [Fr(x) for x in ptrim(a)]
    b = ptrim(b)
    if len(a) < len(b):
        return [], a
    q = [Fr(0)] * (len(a) - len(b) + 1)
    lb = Fr(b[-1])
    for i in range(len(a) - len(b), -1, -1):
        c = a[i + len(b) - 1] / lb
        q[i] = c
        if c:
            for j, y in enumerate(b):
                a[i + j] -= c * y
    return ptrim(q), ptrim(a[:len(b) - 1])


def pexact_div(a, b):
    q, r = pdivmod(a, b)
    assert not r, 'inexact polynomial division'
    return q


def pderiv(a):
    return ptrim([i * a[i] for i in range(1, len(a))])


def peval(a, x):
    v = Fr(0)
    for c in reversed(a):
        v = v * x + c
    return v


def ppow(a, k):
    out = [Fr(1)]
    for _ in range(k):
        out = pmul(out, a)
    return out


def ieval(a, I):
    """outward enclosure of a polynomial on an interval"""
    lo, hi = I
    acc = (Fr(0), Fr(0))
    for j, c in enumerate(a):
        if not c:
            continue
        if j == 0:
            pj = (Fr(1), Fr(1))
        elif lo >= 0:
            pj = (lo ** j, hi ** j)
        elif hi <= 0:
            pj = (lo ** j, hi ** j) if j % 2 else (hi ** j, lo ** j)
        else:
            pj = (lo ** j, hi ** j) if j % 2 else (Fr(0), max(lo ** j, hi ** j))
        acc = iadd(acc, iscale(Fr(c), pj))
    return acc


def cmul(a, b):
    return (a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0])


def conj(a):
    return (a[0], -a[1])


def cabs2(a):
    return a[0] * a[0] + a[1] * a[1]


def cpow(z, k):
    out = (Fr(1), Fr(0))
    for _ in range(k):
        out = cmul(out, z)
    return out


# ---------------------------------------------------------------- Sturm sequences and root isolation

def _prim(a):
    """positive rescaling to coprime integer coefficients (signs untouched)"""
    a = [Fr(x) for x in ptrim(a)]
    den = 1
    for x in a:
        den = den * x.denominator // gcd(den, x.denominator)
    ints = [int(x * den) for x in a]
    g = 0
    for x in ints:
        g = gcd(g, abs(x))
    return [x // g for x in ints] if g else ints


def _sign_at(a, x):
    """sign of an integer polynomial at a rational x"""
    u, v = x.numerator, x.denominator
    d = len(a) - 1
    s = 0
    for j, c in enumerate(a):
        if c:
            s += c * u ** j * v ** (d - j)
    return (s > 0) - (s < 0)


def sturm(A):
    seq = [_prim(A), _prim(pderiv(A))]
    while len(seq[-1]) > 1:
        _, r = pdivmod(seq[-2], seq[-1])
        if not r:
            break
        seq.append(_prim(pscale(-1, r)))
    return seq


def _V(seq, x):
    signs = [s for s in (_sign_at(p, x) for p in seq) if s]
    return sum(1 for i in range(len(signs) - 1) if signs[i] != signs[i + 1])


def sturm_count(seq, a, b):
    """distinct real roots in (a, b], a not a root"""
    return _V(seq, a) - _V(seq, b)


def isolate(seq, a, b, width=Fr(1, 2 ** 36)):
    """isolating intervals [lo, hi] of width <= width for every distinct root of seq[0] in (a, b); A(a), A(b) != 0"""
    A = seq[0]
    out, stack = [], [(Fr(a), Fr(b))]
    while stack:
        lo, hi = stack.pop()
        n = sturm_count(seq, lo, hi)
        if n == 0:
            continue
        slo, shi = _sign_at(A, lo), _sign_at(A, hi)
        if n == 1 and slo * shi < 0:
            while hi - lo > width:
                mid = (lo + hi) / 2
                sm = _sign_at(A, mid)
                if sm == 0:
                    lo, hi = mid - width / 4, mid + width / 4
                    break
                if sm == slo:
                    lo = mid
                else:
                    hi = mid
            out.append((lo, hi))
            continue
        if n == 1 and hi - lo <= width:
            out.append((lo, hi))
            continue
        mid = (lo + hi) / 2
        k = 1
        while _sign_at(A, mid) == 0:
            mid = (lo + hi) / 2 + (hi - lo) / (7 * 2 ** k)
            k += 1
        stack += [(lo, mid), (mid, hi)]
    return sorted(out)


def descartes_variations(A, b, c):
    """sign variations of (1+t)^d0 A((b+ct)/(1+t)) — certificate.tex Eq. (eq:certificate-descartes-transform)"""
    d0 = len(A) - 1
    acc = []
    bc = [Fr(b), Fr(c)]
    one_t = [Fr(1), Fr(1)]
    pw_bc = [[Fr(1)]]
    for _ in range(d0):
        pw_bc.append(pmul(pw_bc[-1], bc))
    pw_1t = [[Fr(1)]]
    for _ in range(d0):
        pw_1t.append(pmul(pw_1t[-1], one_t))
    for j, Aj in enumerate(A):
        if Aj:
            acc = padd(acc, pscale(Aj, pmul(pw_bc[j], pw_1t[d0 - j])))
    signs = [(x > 0) - (x < 0) for x in acc if x]
    return sum(1 for i in range(len(signs) - 1) if signs[i] != signs[i + 1])


# ---------------------------------------------------------------- parsing the published certificate

def _num(s):
    s = s.strip().strip('$').strip()
    if s.endswith('.') and s.count('.') == 2:
        s = s[:-1]
    return Fr(s)


def _complex(s):
    s = s.strip().strip('$')
    if not s.endswith('i'):
        return (Fr(s), Fr(0))
    body = s[:-1]
    k = max(body.rfind('+'), body.rfind('-'))
    if k <= 0:
        return (Fr(0), Fr(body))
    return (Fr(body[:k]), Fr(body[k:]))


def _table_rows(lines):
    rows = []
    for ln in lines:
        ln = ln.strip()
        if not ln or ln.startswith('\\') or '&' not in ln:
            continue
        rows.append([c.strip() for c in ln.rstrip('\\').rstrip().rstrip('\\').split('&')])
    return rows


def parse_certificate(tex):
    L = tex.split('\n')
    seg = lambda a, b: L[a - 1:b]  # noqa: E731
    data = {}
    # trial sequences, certificate.tex:27-50
    seqs = {}
    cur = None
    for row in _table_rows(seg(27, 50)):
        if row[0] in ('$\\kappa$',):
            continue
        if row[0]:
            cur = (int(row[0]), row[1].strip('$'))
            seqs[cur] = []
        seqs[cur] += [int(x) for x in row[2:] if x]
    data['seqs'] = seqs
    m = re.search(r'For \$\\kappa=2\$ take \$d=(\d+)\$ and \$\\lambda_2=([\d.]+)\$\.\s+For \$\\kappa=1\$ take\s+\$d=(\d+)\$ and \$\\lambda_1=([\d.]+)\$', tex)
    data['d'] = {2: int(m.group(1)), 1: int(m.group(3))}
    data['lam'] = {2: Fr(m.group(2)), 1: Fr(m.group(4))}
    # exponential tails, certificate.tex:59-82 (kappa = 2 only)
    tails = {'p': [], 'v': []}
    cur = None
    for row in _table_rows(seg(59, 82)):
        if row[0] == '$u$':
            continue
        if row[0]:
            cur = row[0].strip('$')
        z = _complex(row[1])
        a = int(row[2])
        b = None if row[3].strip() in ('---', '') else int(row[3])
        tails[cur].append((z, a, b))
    data['tails'] = tails
    # Descartes table, certificate.tex:173-184
    desc = []
    for row in _table_rows(seg(173, 184)):
        if row[0] == '$\\kappa$':
            continue
        desc.append((int(row[0]), row[1].strip('$'), int(row[2]), [Fr(x) for x in row[3].strip('$').split(',')],
                     [int(x) for x in row[4].strip('$').split(',')]))
    data['descartes'] = desc
    # root brackets, certificate.tex:208-233
    br = {}
    cur = None
    for row in _table_rows(seg(208, 233)):
        if row[0] == '$\\kappa$':
            continue
        if row[0]:
            cur = (int(row[0]), row[1].strip('$'))
            br[cur] = []
        br[cur] += [int(x) for x in row[2:] if x]
    data['brackets'] = br
    # candidate values, certificate.tex:338-387
    vals = []
    for ln in seg(338, 387):
        mm = re.match(r'\s*(\d)&\$([XY])\$&(-?\d+)&([BP])&(-?\d+\.\d+)\\\\', ln)
        if mm:
            vals.append((int(mm.group(1)), mm.group(2), int(mm.group(3)), mm.group(4), Fr(mm.group(5))))
    data['values'] = vals
    mm = re.search(r'\\\[\s*(\.\d+)\\quad\(\\kappa=2\),\\qquad\s*(\.\d+)\\quad\(\\kappa=1\)\.', tex)
    data['norm_printed'] = {2: Fr(mm.group(1)), 1: Fr(mm.group(2))}
    strong = {}
    for row in _table_rows(seg(399, 406)):
        if row[0] in ('2', '1'):
            strong[int(row[0])] = [Fr(x.strip('$')) for x in row[1:4]]
    data['strong'] = strong
    coarse = {}
    for ln in seg(411, 415):
        mm = re.match(r'\s*([12])&([-\d.]+)&([-\d.]+)&([-\d.]+?)\.?(\\\\)?\s*$', ln)
        if mm:
            coarse[int(mm.group(1))] = [Fr(mm.group(k)) for k in (2, 3, 4)]
    data['coarse'] = coarse
    mm = re.search(r'\$(\.\d+)<\\log2<(\.\d+)\$', tex)
    data['log2_printed'] = (Fr(mm.group(1)), Fr(mm.group(2)))
    mm = re.search(r'\|X_\\kappa\'\|<(\d+)<(\d+)\$', tex)
    data['dX_bound'], data['d_bound'] = int(mm.group(1)), int(mm.group(2))
    mm = re.search(r'\|Y_\\kappa\'\|<(\d+)<120000\$', tex)
    data['dY_bound'] = int(mm.group(1))
    mm = re.search(r'120000\\cdot\\frac2\{10\^\{10\}\}=(\.\d+)\.', tex)
    data['mvt'] = Fr(mm.group(1))
    mm = re.search(r'-1\+\\alpha\+\\gamma=(-\d+)/(\d+)\$', tex)
    data['c_log2'] = Fr(int(mm.group(1)), int(mm.group(2)))
    finals = re.findall(r'-\\frac\{11\}\{16\}\((\.\d+)\)\+(\.\d+)-(\d?\.\d+)-(\d\.\d+)\+(\.\d+)\s*&=(-\d\.\d+)', tex)
    data['finals'] = [tuple(Fr(x) for x in f) for f in finals]
    mm = re.search(r'\\le -(\d\.\d+)<-(\d\.\d+)\.', tex)
    data['upper_printed'] = (-Fr(mm.group(1)), -Fr(mm.group(2)))
    mm = re.search(r'are \$-(\d\.\d+)\$ and \$-(\d\.\d+)\$', tex)
    data['upper_cases'] = {2: -Fr(mm.group(1)), 1: -Fr(mm.group(2))}
    mm = re.search(r'right endpoint\s+\$(\d+)/10\^\{10\}\$, whose distance from \$1\$ is exactly \$(\.\d+)\$', tex)
    data['nearest_one'] = (int(mm.group(1)), Fr(mm.group(2)))
    mm = re.search(r'distance greater than \$(\.\d+)\$ from both', tex)
    data['min_dist'] = Fr(mm.group(1))
    mm = re.search(r'base\s+moduli are at most \$(\.\d+)\$ and \$(\.\d+)\$', tex)
    data['moduli'] = (Fr(mm.group(1)), Fr(mm.group(2)))
    mm = re.search(r'There are\s+(\w+) \$p\$ tail terms and (\w+) \$v\$ tail terms', tex)
    words = {'ten': 10, 'thirteen': 13}
    data['tail_counts'] = (words.get(mm.group(1)), words.get(mm.group(2)))
    return data


def parse_params(real_tex):
    mm = re.search(r'\\alpha=\\frac an=\\frac\{(\d+)\}\{(\d+)\},\\quad\s*\\beta=\\frac bn=\\frac(\d)\{(\d+)\},\\quad\s*'
                   r'\\gamma=\\frac gn=\\frac qn=\\frac(\d)\{(\d+)\},\\quad\s*\\eta=\\frac hn=\\frac(\d)\{(\d+)\}', real_tex)
    g = [int(x) for x in mm.groups()]
    return Fr(g[0], g[1]), Fr(g[2], g[3]), Fr(g[4], g[5]), Fr(g[6], g[7])


# ---------------------------------------------------------------- component (1): the barrier functions

def build_sequence(data, kappa, which):
    """(finite part l_1..l_d as Fractions, full tail list [(z, r_z)] with conjugates)"""
    l = [x * E8 for x in data['seqs'][(kappa, which)]]
    tail = []
    if kappa == 2:
        for z, a, b in data['tails'][which]:
            if b is None:
                assert z[1] == 0
                tail.append((z, (a * E8, Fr(0))))
            else:
                assert z[1] != 0
                r = (a * E8 / 2, -b * E8 / 2)
                tail.append((z, r))
                tail.append((conj(z), conj(r)))
    return l, tail


def cheb_T_vals(d, x):
    out = [Fr(1), Fr(x)]
    while len(out) <= d:
        out.append(2 * x * out[-1] - out[-2])
    return out


def cheb_U_polys(d):
    """U_0..U_d as coefficient lists (recurrence)"""
    out = [[Fr(1)], [Fr(0), Fr(2)]]
    while len(out) <= d:
        out.append(padd(pmul([Fr(0), Fr(2)], out[-1]), pscale(-1, out[-2])))
    return out


def norm_sq(l, tail):
    """||u||_*^2 = sum_k u_k^2/k: exact finite part, then -sum_{z,z'} r_z r_z' Log(1 - z z')"""
    exact = Fr(0)
    for k in range(1, len(l) + 1):
        cross = sum(cmul(r, cpow(z, k))[0] for z, r in tail) if tail else Fr(0)
        exact += (l[k - 1] ** 2 + 2 * l[k - 1] * cross) / k
    acc = ipt(exact)
    for z, r in tail:
        for z2, r2 in tail:
            zz = cmul(z, z2)
            acc = isub(acc, re_c_log(cmul(r, r2), (1 - zz[0], -zz[1])))
    return acc


def T_val(l, tail, x):
    """T(u,x) = sum l_k T_k(x)/k - (1/2) sum r_z Log(1 - 2xz + z^2)"""
    Tk = cheb_T_vals(len(l), x)
    acc = ipt(sum(l[k - 1] * Tk[k] / k for k in range(1, len(l) + 1)))
    for z, r in tail:
        z2 = cmul(z, z)
        w = (1 - 2 * x * z[0] + z2[0], -2 * x * z[1] + z2[1])
        acc = isub(acc, iscale(Fr(1, 2), re_c_log(r, w)))
    return acc


def S_val(l, tail, x):
    """S(u,x) = sum l_k x^k/k - sum r_z Log(1 - xz)"""
    acc = ipt(sum(l[k - 1] * x ** k / k for k in range(1, len(l) + 1)))
    for z, r in tail:
        acc = isub(acc, re_c_log(r, (1 - x * z[0], -x * z[1])))
    return acc


class Barrier:
    """X_kappa or Y_kappa with its derivative terms, its numerator A = Q f' and its value enclosure"""

    def __init__(self, data, params, kappa, kind):
        al, be, ga, et = params
        self.kappa, self.kind = kappa, kind
        self.lam = data['lam'][kappa]
        self.p = build_sequence(data, kappa, 'p')
        self.v = build_sequence(data, kappa, 'v')
        self.params = params
        terms = []     # (num, den) real polynomials; f' = sum num/den
        qf = []        # the factors of the paper's Q
        U = cheb_U_polys(max(len(self.p[0]), len(self.v[0])))
        if kind == 'X':
            l_p, t_p = self.p
            l_v, t_v = self.v
            c1 = kappa + 2 * al + 2 * et + 2 * ga
            terms += [([al + 2 * ga], [0, 1]), ([-2 * et], [1, -1]), ([0, -c1], [1, 0, 1])]
            if self.lam:
                terms.append(([0, -4 * self.lam], [1, 0, 2, 0, 1]))
            poly = []
            for k in range(1, len(l_p) + 1):
                poly = padd(poly, pscale(-2 * kappa * l_p[k - 1], U[k - 1]))
            for k in range(1, len(l_v) + 1):
                poly = padd(poly, pscale(-l_v[k - 1], [0] * (k - 1) + [1]))
            terms.append((poly, [1]))
            terms += self._tail_terms(t_p, 'T', -2 * kappa)
            terms += self._tail_terms(t_v, 'S', -1)
            qf = [[0, 1], [1, -1]] + [[1, 0, 1]] * (3 - kappa) + self._tail_factors(t_p, 'T') + self._tail_factors(t_v, 'S')
        else:
            l_v, t_v = self.v
            terms += [([be], [0, 1]), ([-ga], [1, -1])]
            poly = []
            for k in range(1, len(l_v) + 1):
                poly = padd(poly, pscale(2 * l_v[k - 1], U[k - 1]))
            terms.append((poly, [1]))
            terms += self._tail_terms(t_v, 'T', 2)
            qf = [[0, 1], [1, -1]] + self._tail_factors(t_v, 'T')
        self.terms = [([Fr(x) for x in n], [Fr(x) for x in d]) for n, d in terms]
        Q = [Fr(1)]
        for f in qf:
            Q = pmul(Q, [Fr(x) for x in f])
        self.Q = Q
        A = []
        for n, d in self.terms:
            A = padd(A, pmul(n, pexact_div(Q, d)))
        self.A = A
        self.Qcore = pexact_div(Q, [0, 1, -1])   # Q / (x(1-x))

    @staticmethod
    def _tail_terms(tail, typ, scale):
        """for each z: Re(c z conj(w)) / |w|^2 (nonreal z) or c z / w (real z); w = 1-2xz+z^2 (T) or 1-xz (S)"""
        out = []
        for z, r in tail:
            c = cmul(r, z)
            c = (scale * c[0], scale * c[1])
            if typ == 'T':
                z2 = cmul(z, z)
                w = [(1 + z2[0], z2[1]), (-2 * z[0], -2 * z[1])]
            else:
                w = [(Fr(1), Fr(0)), (-z[0], -z[1])]
            if z[1] == 0:
                out.append(([c[0]], [w[0][0], w[1][0]]))
            else:
                cw = [conj(w[0]), conj(w[1])]
                num = [cmul(c, cw[0])[0], cmul(c, cw[1])[0]]
                den = [cabs2(w[0]), 2 * cmul(w[0], conj(w[1]))[0], cabs2(w[1])]
                out.append((num, den))
        return out

    @staticmethod
    def _tail_factors(tail, typ):
        out = []
        seen = set()
        for z, _ in tail:
            if z[1] != 0 and (z[0], -z[1]) in seen:
                continue
            seen.add(z)
            if typ == 'T':
                z2 = cmul(z, z)
                w = [(1 + z2[0], z2[1]), (-2 * z[0], -2 * z[1])]
            else:
                w = [(Fr(1), Fr(0)), (-z[0], -z[1])]
            if z[1] == 0:
                out.append([w[0][0], w[1][0]])
            else:
                out.append([cabs2(w[0]), 2 * cmul(w[0], conj(w[1]))[0], cabs2(w[1])])
        return out

    def deriv_iv(self, I):
        acc = ipt(0)
        for n, d in self.terms:
            acc = iadd(acc, idiv(ieval(n, I), ieval(d, I)))
        return acc

    def value(self, x):
        x = Fr(x)
        al, be, ga, et = self.params
        if self.kind == 'X':
            kappa, lam = self.kappa, self.lam
            out = iadd(iscale(al + 2 * ga, log_iv(abs(x))), iscale(2 * et, log_iv(1 - x)),
                       iscale(-(Fr(kappa, 2) + al + et + ga), log_iv(1 + x * x)),
                       ipt(lam * (2 * ga - 2 * x * x / (1 + x * x))),
                       iscale(Fr(-2 * kappa), T_val(*self.p, x)), ineg(S_val(*self.v, x)))
        else:
            out = iadd(iscale(be, log_iv(x)), iscale(ga, log_iv(1 - x)), iscale(Fr(2), T_val(*self.v, x)))
        return out

    def pieces(self):
        return [(Fr(-1), Fr(0)), (Fr(0), Fr(1))] if self.kind == 'X' else [(Fr(0), Fr(1))]


def ceil12(x):
    return Fr(-((-x.numerator * 10 ** 12) // x.denominator), 10 ** 12)


def component_real(data, params, checks, mutate_ok=True):
    out = {}
    al, be, ga, et = params
    # the object as printed
    s = data['seqs']
    check(checks, '1. trial tables: kappa=2 has d=10 coefficients for p and v, kappa=1 has d=8, lambda_2 = 0, lambda_1 >= 0',
          len(s[(2, 'p')]) == len(s[(2, 'v')]) == data['d'][2] == 10 and len(s[(1, 'p')]) == len(s[(1, 'v')]) == data['d'][1] == 8
          and data['lam'][2] == 0 and data['lam'][1] >= 0, 'lambda_1 = %s' % data['lam'][1])
    tp = build_sequence(data, 2, 'p')[1]
    tv = build_sequence(data, 2, 'v')[1]
    check(checks, '1. tail counts with conjugates: p %d, v %d (printed: %s, %s)' % (len(tp), len(tv), *data['tail_counts']),
          (len(tp), len(tv)) == data['tail_counts'])
    mp = max(cabs2(z) for z, _ in tp)
    mv = max(cabs2(z) for z, _ in tv)
    check(checks, '1. base moduli at most .94 (p) and .984 (v), so every tail decays geometrically',
          mp <= data['moduli'][0] ** 2 and mv <= data['moduli'][1] ** 2 and max(mp, mv) < 1, 'max |z|^2 = %s, %s' % (mp, mv))
    allc = [abs(x) * E8 for k in s for x in s[k]] + [cabs2(r) for t in (tp, tv) for _, r in t]
    check(checks, '1. all |l_k| and |r_z| are less than 1', all(c < 1 for c in allc))
    check(checks, '1. -1 + alpha + gamma = -11/16 (real-place.tex:7-10)', -1 + al + ga == data['c_log2'] == Fr(-11, 16))

    out['norm'] = {}
    for kappa in (2, 1):
        lp, tpk = build_sequence(data, kappa, 'p')
        lv, tvk = build_sequence(data, kappa, 'v')
        nm = iadd(iscale(Fr(kappa), norm_sq(lp, tpk)), iscale(Fr(1, 2), norm_sq(lv, tvk)))
        out['norm'][kappa] = nm
        pr = data['norm_printed'][kappa]
        check(checks, '1. printed bound for kappa||p||^2 + ||v||^2/2 (kappa=%d): %s' % (kappa, pr),
              nm[1] <= pr and ceil12(nm[0]) <= pr <= ceil12(nm[1] + Fr(217, 10 ** 18)),
              'enclosure [%.15f, %.15f]' % (float(nm[0]), float(nm[1])))

    printed_vals = {}
    for kap, fn, m, typ, v in data['values']:
        printed_vals.setdefault((kap, fn), []).append((m, typ, v))
    desc = {(k, f): (d0, pts, var) for k, f, d0, pts, var in data['descartes']}
    out['sup'] = {}
    for kappa in (2, 1):
        for kind in ('X', 'Y'):
            tag = '%s_%d' % (kind, kappa)
            B = Barrier(data, params, kappa, kind)
            A = B.A
            check(checks, '1. %s: Q has no root in the open domain (Sturm count of Q/(x(1-x)) on [-1,1] is 0)' % tag,
                  peval(B.Qcore, Fr(-1)) != 0 and sturm_count(sturm(B.Qcore), Fr(-1), Fr(1)) == 0)
            # the derivative terms against the value function: X(b) - X(a) must lie in (b - a) * enclosure(X' on [a,b]),
            # and that enclosure must be tight (width < |X(b) - X(a)|/50), so a wrong term cannot hide in a wide interval
            probes = ([Fr(-9, 10), Fr(-1, 2), Fr(-1, 7), Fr(1, 9), Fr(2, 5), Fr(3, 4), Fr(19, 20)] if kind == 'X'
                      else [Fr(1, 20), Fr(1, 5), Fr(1, 2), Fr(4, 5), Fr(99, 100)])
            mvt_bad = []
            for a in probes:
                bb = a + Fr(1, 10 ** 8)
                diff = isub(B.value(bb), B.value(a))
                dI = iscale(bb - a, B.deriv_iv((a, bb)))
                if not (dI[0] <= diff[1] and diff[0] <= dI[1]) or dI[1] - dI[0] > max(abs(diff[0]) / 50, Fr(1, 10 ** 13)):
                    mvt_bad.append(str(a))
            check(checks, '1. %s: the derivative terms agree with the value function (mean-value containment on [a, a+10^-8] at %d points)' % (tag, len(probes)),
                  not mvt_bad, 'failed at %s' % mvt_bad if mvt_bad else '')
            d0, pts, var = desc[(kappa, kind)]
            check(checks, '1. %s: degree of the numerator A = Q f\' is %d (printed %d)' % (tag, len(A) - 1, d0), len(A) - 1 == d0)
            got = [descartes_variations(A, pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
            check(checks, '1. %s: Descartes variation counts on the printed division points %s' % (tag, [str(x) for x in pts]),
                  got == var, 'recomputed %s, printed %s' % (got, var))
            seq = sturm(A)
            ends = sorted(set([x for pc in B.pieces() for x in pc]))
            check(checks, '1. %s: A is nonzero at the domain ends %s' % (tag, [str(x) for x in ends]), all(peval(A, x) != 0 for x in ends))
            roots = []
            per_piece = []
            for a, b in B.pieces():
                n = sturm_count(seq, a, b)
                iso = isolate(seq, a, b)
                per_piece.append(n)
                roots += iso
                check(checks, '1. %s: Sturm counts %d distinct critical points in (%s, %s); %d isolated here' % (tag, n, a, b, len(iso)),
                      n == len(iso) and all(a < lo and hi < b for lo, hi in iso))
            # the paper's brackets
            br = [(Fr(m, TEN10), Fr(m + 2, TEN10)) for m in data['brackets'][(kappa, kind)]]
            disjoint = all(br[i][1] < br[i + 1][0] for i in range(len(br) - 1))
            sgn = [peval(A, lo) * peval(A, hi) < 0 for lo, hi in br]
            bad = [data['brackets'][(kappa, kind)][i] for i, okk in enumerate(sgn) if not okk]
            in_piece = [sum(1 for lo, hi in br if a < lo and hi < b) for a, b in B.pieces()]
            check(checks, '1. %s: all %d printed brackets are disjoint, each has N_A(m) N_A(m+2) < 0' % (tag, len(br)),
                  disjoint and not bad, 'no sign change at m = %s' % bad if bad else '')
            check(checks, '1. %s: brackets per interval %s = Sturm counts %s, total = the printed variation total %d: every critical point lies in exactly one printed bracket' % (tag, in_piece, per_piece, sum(var)),
                  in_piece == per_piece and sum(in_piece) == len(br) == sum(var) and all(any(r[0] < hi and lo < r[1] for lo, hi in br) for r in roots))
            # the global supremum from this file's own isolation
            best, where = None, None
            for lo, hi in roots:
                v = B.value(lo)
                d = B.deriv_iv((lo, hi))
                ub = v[1] + max(abs(d[0]), abs(d[1])) * (hi - lo)
                if best is None or ub > best:
                    best, where = ub, lo
            fin = [Fr(-1)] if kind == 'X' else []
            for x in fin:
                ub = B.value(x)[1]
                if ub > best:
                    best, where = ub, x
            out['sup'][(kappa, kind)] = best
            # the printed candidate values
            for m, typ, pv in printed_vals[(kappa, kind)]:
                x = Fr(m, TEN10)
                v = B.value(x)
                okv = v[1] <= pv and ceil12(v[0]) <= pv <= ceil12(v[1] + Fr(217, 10 ** 18))
                check(checks, '1. %s(%s) %s printed upper bound %s' % (tag, m, typ, pv), okv, 'enclosure [%.15f, %.15f]' % (float(v[0]), float(v[1])))
            maxB = max(pv for _, _, pv in printed_vals[(kappa, kind)])
            # derivative bounds on the printed brackets
            dmax = Fr(0)
            for lo, hi in br:
                d = B.deriv_iv((lo, hi))
                dmax = max(dmax, abs(d[0]), abs(d[1]))
            lim = data['dX_bound'] if kind == 'X' else data['dY_bound']
            check(checks, '1. %s: printed derivative bound |f\'| < %d on every printed bracket' % (tag, lim), dmax < lim,
                  'max enclosure of |f\'| on the brackets: %.6f' % float(dmax))
            mvt_ok = best <= maxB + data['mvt']
            check(checks, '1. %s: sup over the domain (this file: %.12f, at x = %.10f) <= max printed value + .000024 = %s' % (tag, float(best), float(where), maxB + data['mvt']),
                  mvt_ok)
            idx = {'X': 1, 'Y': 2}[kind]
            check(checks, '1. %s: stronger cutoff %s exceeds every printed-point value (true values, enclosed)' % (tag, data['strong'][kappa][idx]),
                  all(B.value(Fr(m, TEN10))[1] < data['strong'][kappa][idx] for m, _, _ in printed_vals[(kappa, kind)]))
            check(checks, '1. %s: sup <= coarse cutoff %s + .000024 (the value used in the final line)' % (tag, data['coarse'][kappa][idx]),
                  best <= data['coarse'][kappa][idx] + data['mvt'])
        check(checks, '1. kappa=%d: norm term below the stronger cutoff %s and the coarse cutoff %s' % (kappa, data['strong'][kappa][0], data['coarse'][kappa][0]),
              out['norm'][kappa][1] < data['strong'][kappa][0] <= data['coarse'][kappa][0])
    # the bracket geometry printed in the derivative argument
    allbr = [m for k in data['brackets'] for m in data['brackets'][k]]
    dist = min(min(abs(Fr(m, TEN10)), abs(1 - Fr(m, TEN10)), abs(Fr(m + 2, TEN10)), abs(1 - Fr(m + 2, TEN10))) for m in allbr)
    near = max(m for k in data['brackets'] for m in data['brackets'][k] if k[1] == 'Y')
    check(checks, '1. every bracket point is more than .0007 from 0 and 1; the bracket nearest 1 ends at %d/10^10, distance %s' % (near + 2, data['nearest_one'][1]),
          dist > data['min_dist'] and near + 2 == data['nearest_one'][0] and 1 - Fr(near + 2, TEN10) == data['nearest_one'][1], 'min distance %s' % dist)
    check(checks, '1. 120000 * 2/10^10 = .000024 (the mean-value allowance)', Fr(data['d_bound'] * 2, TEN10) == data['mvt'])
    lo2, hi2 = data['log2_printed']
    check(checks, '1. .693146 < log 2 < .693149', lo2 < LOG2[0] and LOG2[1] < hi2)
    # the paper's two final lines, exact
    for kappa, f in zip((2, 1), data['finals']):
        l2, nm, xx, yy, add, res = f
        val = data['c_log2'] * l2 + nm - xx - yy + add
        check(checks, '1. kappa=%d final line: -11/16(%s) + %s - %s - %s + %s = %s exactly' % (kappa, l2, nm, xx, yy, add, res),
              val == res and l2 == lo2 and nm == data['coarse'][kappa][0] and -xx == data['coarse'][kappa][1]
              and -yy == data['coarse'][kappa][2] and add == 2 * data['mvt'] and res == data['upper_cases'][kappa], str(val))
    check(checks, '1. Prop prop:real-upper: the larger case constant is the printed bound %s < %s' % data['upper_printed'],
          max(data['upper_cases'].values()) == data['upper_printed'][0] < data['upper_printed'][1])
    # this file's own right sides
    out['rhs'] = {}
    for kappa in (2, 1):
        rhs = (-1 + al + ga) * LOG2[0] + out['norm'][kappa][1] + out['sup'][(kappa, 'X')] + out['sup'][(kappa, 'Y')]
        out['rhs'][kappa] = rhs
        check(checks, '1. kappa=%d: this file\'s right side of eq:energy-dual, %.12f, is <= the printed case bound %s' % (kappa, float(rhs), data['upper_cases'][kappa]),
              rhs <= data['upper_cases'][kappa])
    return out


# ---------------------------------------------------------------- component (2): the base matrix and the three determinants

def c_l(l):
    return Fr(comb(2 * l, l), 4 ** l)


def arrays_closed(imax, jmax):
    """m_i, k-_d, k+_d, M^0 from the closed forms (foundations.tex Eqs. moment-values, explicit-boundary-arrays,
    diagonal-reduction)"""
    m = {-1: Fr(0)}
    for i in range(0, imax + jmax + 2):
        m[i] = Fr(2) / ((i + 1) * c_l(i // 2)) if i % 2 == 0 else Fr(0)

    def Hs(z):
        return c_l(z // 2) if z % 2 == 0 else 1 / (z * c_l((z - 1) // 2))

    km = {}
    for u in range(0, imax + 1):
        if u % 2 == 0:
            km[u] = Hs(u) * sum((Fr(2) / (z * z * Hs(z) ** 2) for z in range(2, u + 1, 2)), Fr(0))
        else:
            km[u] = Hs(u) * sum((Fr(2, z) for z in range(1, u + 1, 2)), Fr(0))
    kp = {0: Fr(0)}
    for u in range(0, jmax):
        kp[u + 1] = Hs(u) * sum((Fr(2) / (z * z * Hs(z)) for z in range(1, u + 1) if z % 2 == u % 2), Fr(0))

    def M0(i, j):
        if i >= j:
            return km[i - j] - sum((m[i - j + k - 1] / k for k in range(1, j + 1)), Fr(0))
        return kp[j - i] - sum((m[k - (j - i) - 1] / k for k in range(j - i + 1, j + 1)), Fr(0))

    return m, km, kp, M0


def arrays_recipe(imax, jmax):
    """the recipe of nonvanishing.tex:283-299"""
    m = [Fr(0)] * (imax + 1)
    m[0] = Fr(2)
    for i in range(2, imax + 1, 2):
        m[i] = i * m[i - 2] / (i + 1)
    km = [Fr(0), Fr(2)] + [None] * (imax - 1)
    for d in range(2, imax + 1):
        km[d] = ((d - 1) * km[d - 2] + m[d - 2] + m[d - 1]) / d
    kp = [Fr(0), Fr(0)] + [None] * (jmax - 1)
    for d in range(2, jmax + 1):
        kp[d] = ((d - 2) * kp[d - 2] + Fr(2, d - 1)) / (d - 1)
    Y = [[None] * (jmax + 1) for _ in range(imax + 1)]
    for i in range(imax + 1):
        Y[i][0] = km[i]
    for j in range(jmax + 1):
        Y[0][j] = kp[j]
    for i in range(1, imax + 1):
        for j in range(1, jmax + 1):
            Y[i][j] = Y[i - 1][j - 1] - m[i - 1] / j
    return m, km, kp, Y


def Z0(i, j, H1, H2):
    if i == j:
        return -H2[i]
    return (H1[i] - H1[j]) / (i - j)


def cheb_explicit(d):
    """T_d and U_{d-1} coefficient lists from the explicit sums"""
    T = [Fr(0)] * (d + 1)
    if d == 0:
        T[0] = Fr(1)
    else:
        for k in range(d // 2 + 1):
            T[d - 2 * k] = Fr((-1) ** k * d * comb(d - k, k) * 2 ** (d - 2 * k), 2 * (d - k))
    U = [Fr(0)] * max(d, 1)
    e = d - 1
    if e >= 0:
        for k in range(e // 2 + 1):
            U[e - 2 * k] = Fr((-1) ** k * comb(e - k, k) * 2 ** (e - 2 * k))
    else:
        U = []
    return T, U


def rows_closed(r, g, h, C):
    d = abs(r - g)
    T, U = cheb_explicit(d)
    one_t = [Fr(1)]
    for _ in range(h):
        one_t = pmul(one_t, [Fr(1), Fr(-1)])
    P = [Fr(0)] * (C)
    for e, c in enumerate(T):
        if c:
            P[C - 1 - e] += c
    D = [Fr(0)] * (C)
    sg = (r > g) - (r < g)
    for e, c in enumerate(U):
        if c:
            D[C - 1 - e] += sg * c
    return pmul(one_t, ptrim(P)), pmul(one_t, ptrim(D))


def rows_recipe(r, g, h, C, top=44):
    """E_0 = t^62, E_1 = t^61, I_0 = 0, I_1 = t^62, S_m = 2 S_{m-1}/t - S_{m-2} (nonvanishing.tex:311-327)"""
    def shift_down(a):
        assert not a or a[0] == 0
        return a[1:]
    E = [[Fr(0)] * (C - 1) + [Fr(1)], [Fr(0)] * (C - 2) + [Fr(1)]]
    I = [[], [Fr(0)] * (C - 1) + [Fr(1)]]
    for mm in range(2, top + 1):
        E.append(padd(pscale(2, shift_down(E[-1])), pscale(-1, E[-2])))
        I.append(padd(pscale(2, shift_down(I[-1])), pscale(-1, I[-2])))
    u = abs(r - g)
    one_t = ppow([Fr(1), Fr(-1)], h)
    sg = (r > g) - (r < g)
    return pmul(one_t, E[u]), pscale(sg, pmul(one_t, I[u]))


def series_order(P, D, maxdeg):
    """t-order and leading coefficient of t P / f - D, 1/f = sum c_l t^(2l)"""
    inv_f = [Fr(0)] * (maxdeg + 1)
    for l in range(maxdeg // 2 + 1):
        inv_f[2 * l] = c_l(l)
    tP = [Fr(0)] + list(P)
    S = [Fr(0)] * (maxdeg + 1)
    for i, a in enumerate(tP):
        if a:
            for k in range(0, maxdeg + 1 - i):
                if inv_f[k]:
                    S[i + k] += a * inv_f[k]
    for i, a in enumerate(D):
        if i <= maxdeg:
            S[i] -= a
    for i, a in enumerate(S):
        if a:
            return i, a
    return None, None


def bareiss_det(M):
    M = [row[:] for row in M]
    n = len(M)
    sign, prev = 1, 1
    for k in range(n - 1):
        if M[k][k] == 0:
            sw = next((i for i in range(k + 1, n) if M[i][k] != 0), None)
            if sw is None:
                return 0
            M[k], M[sw] = M[sw], M[k]
            sign = -sign
        for i in range(k + 1, n):
            for j in range(k + 1, n):
                M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) // prev
        prev = M[k][k]
    return sign * M[n - 1][n - 1]


def det_Q(B):
    scaled, scale = [], Fr(1)
    for row in B:
        den = 1
        for x in row:
            den = den * x.denominator // gcd(den, x.denominator)
        scaled.append([int(x * den) for x in row])
        scale *= den
    return Fr(bareiss_det(scaled)) / scale


def mod_pivots(B, p):
    rows = [[x.numerator * pow(x.denominator, -1, p) % p for x in row] for row in B]
    n = len(rows)
    piv, swaps = [], []
    for i in range(n):
        if rows[i][i] == 0:
            j = next((j for j in range(i + 1, n) if rows[j][i]), None)
            if j is None:
                return piv + [0], swaps
            rows[i], rows[j] = rows[j], rows[i]
            swaps.append((i, j))
        d = rows[i][i]
        piv.append(d)
        inv = pow(d, p - 2, p)
        for j in range(i + 1, n):
            f = rows[j][i] * inv % p
            if f:
                rows[j] = [(x - f * y) % p for x, y in zip(rows[j], rows[i])]
    return piv, swaps


def smooth(n, bound):
    for q in range(2, bound + 1):
        while n % q == 0:
            n //= q
    return n == 1


def parse_nonvanishing(tex):
    mm = re.search(r'n_0=(\d+),\\quad b_0=(\d+),\\quad q_0=g_0=(\d+),\\quad h_0=(\d+),\\quad\s*L_0=(\d+),\\quad C_0=(\d+),\\quad H_0=(\d+)', tex)
    par = dict(zip(('n', 'b', 'g', 'h', 'L', 'C', 'H'), (int(x) for x in mm.groups())))
    piv = {}
    L = tex.split('\n')
    cur = None
    for ln in L[368:378]:
        mm = re.match(r'\s*(\$-?\d\$)?\s*&\s*\$([\d,]+)\$', ln)
        if mm:
            if mm.group(1):
                cur = int(mm.group(1).strip('$'))
                piv[cur] = []
            piv[cur].append([int(x) for x in mm.group(2).split(',')])
    mm = re.search(r'For \$\\sigma=1\$ the only swaps,\s*using indices starting at zero, are \$\((\d+),(\d+)\)\$ and \$\((\d+),(\d+)\)\$', tex)
    swaps1 = [(int(mm.group(1)), int(mm.group(2))), (int(mm.group(3)), int(mm.group(4)))]
    noswap = re.search(r'There are no swaps for \$\\sigma=0,-1\$', tex) is not None
    mm = re.search(r'modulo \$(\d+)\$ without any numerical approximation', tex)
    return par, piv, swaps1, noswap, int(mm.group(1))


def _truncate_aux(par, rows):
    """forge hook only: drop the auxiliary row's lowest terms (deg 18 of P_48, deg 19 of D_48)"""
    if not par.get('truncate_aux'):
        return rows
    P, D = (list(x) for x in rows[-1])
    P[18], D[19] = Fr(0), Fr(0)
    return rows[:-1] + [(ptrim(P), ptrim(D))]


def build_B(par, route):
    n, b, g, h, C, H = par['n'], par['b'], par['g'], par['h'], par['C'], par['H']
    imax, jlo, jhi = H - 1, b, b + n + g - 1   # degrees 0..64, raw columns 7..58
    H1 = [Fr(0)]
    H2 = [Fr(0)]
    for u in range(1, max(imax, jhi) + 1):
        H1.append(H1[-1] + Fr(1, u))
        H2.append(H2[-1] + Fr(1, u * u))
    if route == 'closed':
        _, _, _, M0 = arrays_closed(imax, jhi)
        M0t = [[M0(i, j) for j in range(jhi + 1)] for i in range(imax + 1)]
        Z0t = [[Z0(i, j, H1, H2) for j in range(jhi + 1)] for i in range(imax + 1)]
        rows = _truncate_aux(par, [rows_closed(r, g, h, C) for r in range(n + 1)])
        B = []
        for P, D in rows:
            F = {col: sum((P[i] * M0t[i][col] for i in range(len(P)) if P[i]), Fr(0)) - Fr(3, 2) * sum((D[i] * Z0t[i][col] for i in range(len(D)) if D[i]), Fr(0))
                 for col in range(jlo, jhi + 1)}
            B.append([sum(((-1) ** jj * comb(g, jj) * F[b + k + jj] for jj in range(g + 1)), Fr(0)) for k in range(n)])
        return B, rows
    _, _, _, Y = arrays_recipe(imax, jhi)
    J = [[Fr(3, 2) * Z0(i, j, H1, H2) for j in range(jhi + 1)] for i in range(imax + 1)]
    rows = _truncate_aux(par, [rows_recipe(r, g, h, C) for r in range(n + 1)])
    B = []
    for y, z in rows:
        v = [sum((y[i] * Y[i][j] for i in range(len(y)) if y[i]), Fr(0)) - sum((z[i] * J[i][j] for i in range(len(z)) if z[i]), Fr(0))
             for j in range(jlo, jhi + 1)]
        for _ in range(g):
            v = [v[i] - v[i + 1] for i in range(len(v) - 1)]
        B.append(v)
    return B, rows


def component_matrices(src_text, checks, mutate=None):
    par, piv, swaps1, noswap, modulus = parse_nonvanishing(src_text)
    if mutate:
        par, piv, swaps1 = mutate(par, piv, swaps1)
    out = {}
    n, g, h, C, H, L = par['n'], par['g'], par['h'], par['C'], par['H'], par['L']
    check(checks, '2. N = 1 parameters: n0=48, b0=7, g0=4, h0=2, L0=59, C0=63, H0=65 (foundations.tex:12-15 at N=1)',
          (par['n'], par['b'], par['g'], par['h'], par['L'], par['C'], par['H']) == (48, 7, 4, 2, 59, 63, 65))
    Bc, rows_c = build_B(par, 'closed')
    Br, rows_r = build_B(par, 'recipe')
    check(checks, '2. the 49 row polynomials (P_r, D_r): explicit Chebyshev sums = the recipe recursion', rows_c == [(ptrim(a), ptrim(b)) for a, b in rows_r])
    sup_ok = all((not P or min(i for i, c in enumerate(P) if c) >= (18 if r == n else 19)) and len(P) - 1 <= H - 1 and
                 (not D or min(i for i, c in enumerate(D) if c) >= (19 if r == n else 20)) for r, (P, D) in enumerate(rows_c))
    P48, D48 = rows_c[n]
    check(checks, '2. supports: P_r in [19, 64], D_r in [20, 64] for r < 48; the auxiliary row has min deg P_48 = 18, D_48 = 19 (eq:nonvanishing-auxiliary-degrees)',
          sup_ok and min(i for i, c in enumerate(P48) if c) == 18 and min(i for i, c in enumerate(D48) if c) == 19)
    bad = []
    for r, (P, D) in enumerate(rows_c):
        o, lead = series_order(P, D, 59 + n + 2)
        if o != C - g + r or lead != Fr(2) ** (g - r):
            bad.append((r, o, lead))
    check(checks, '2. contact: t P_r / f - D_r has t-order exactly 59 + r, leading coefficient 2^(4-r), for r = 0..48 (eq:contact; O(t^107) for the auxiliary row)',
          not bad, str(bad[:3]))
    _, km_c, kp_c, M0c = arrays_closed(64, 58)
    _, km_r, kp_r, Y = arrays_recipe(64, 58)
    check(checks, '2. boundary arrays k-_d (d <= 64), k+_d (d <= 58): explicit H* sums = the recurrences',
          all(km_c[d] == km_r[d] for d in range(65)) and all(kp_c[d] == kp_r[d] for d in range(59)))
    check(checks, '2. M^0(i, j), 0 <= i <= 64, 0 <= j <= 58: diagonal-reduction closed form = the Y recipe',
          all(M0c(i, j) == Y[i][j] for i in range(65) for j in range(59)))
    H1 = [Fr(0), Fr(1), Fr(3, 2)]
    H2 = [Fr(0), Fr(1), Fr(5, 4)]
    small = [M0c(0, 0), M0c(1, 0), kp_c[1], M0c(0, 1), M0c(1, 1), kp_c[2], Z0(0, 0, H1, H2), Z0(1, 0, H1, H2), Z0(0, 1, H1, H2), Z0(1, 1, H1, H2)]
    check(checks, '2. the small reduced values printed at odd-primes.tex:279-289 (M^0(u,0), M^0(u,1), Z^0)', small == [0, 2, 0, 0, -2, 2, 0, 1, 1, -1])
    check(checks, '2. the base matrix B (49 x 48): every entry equal by the two routes', Bc == Br)
    dens = all(smooth(x.denominator, 65) for row in Bc for x in row)
    check(checks, '2. every entry of B has a 65-smooth denominator (so it reduces mod 101)', dens)
    B0 = [Bc[r] for r in range(n)]
    B1 = [Bc[r + 1] for r in range(n)]
    out['det'] = {}
    for sigma in (0, 1, -1):
        M = [[x + sigma * y for x, y in zip(B0[r], B1[r])] for r in range(n)]
        d = det_Q(M)
        out['det'][sigma] = d
        name = {0: 'B0', 1: 'B0 + B1', -1: 'B0 - B1'}[sigma]
        check(checks, '2. det(%s) != 0, exactly over Q' % name, d != 0,
              'numerator %d digits, denominator %d digits' % (len(str(abs(d.numerator))), len(str(d.denominator))))
        pv, sw = mod_pivots(M, modulus)
        printed = [x for line in piv.get(sigma, []) for x in line]
        lines_ok = [pv[16 * i:16 * (i + 1)] == piv.get(sigma, [[]] * 3)[i] for i in range(3)] if len(piv.get(sigma, [])) == 3 else [False] * 3
        for i in range(3):
            check(checks, '2. sigma=%d pivots mod %d, printed line %d (entries %d-%d)' % (sigma, modulus, i + 1, 16 * i + 1, 16 * i + 16), lines_ok[i],
                  'recomputed %s' % pv[16 * i:16 * (i + 1)] if not lines_ok[i] else '')
        want_sw = swaps1 if sigma == 1 else ([] if noswap else None)
        check(checks, '2. sigma=%d: row swaps of the elimination rule %s (printed %s)' % (sigma, sw, want_sw), sw == want_sw)
        check(checks, '2. sigma=%d: all 48 pivots nonzero mod %d, and det mod %d = (sign) prod(pivots) agrees with the exact det' % (sigma, modulus, modulus),
              len(pv) == n and all(pv) and len(printed) == n and
              (d.numerator * pow(d.denominator, -1, modulus) - (-1) ** len(sw) * _prod_mod(pv, modulus)) % modulus == 0)
    return out


def _prod_mod(xs, p):
    o = 1
    for x in xs:
        o = o * x % p
    return o


# ---------------------------------------------------------------- component (3): the finite-place constant

class PL:
    """continuous piecewise-linear function, exact knots"""

    def __init__(self, pts):
        self.pts = sorted(pts)

    def __call__(self, x):
        for (x0, y0), (x1, y1) in zip(self.pts, self.pts[1:]):
            if x0 <= x <= x1:
                return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
        raise ValueError('outside the domain')

    def knots(self):
        return [x for x, _ in self.pts]


def lin(a, b, lo, hi):
    return PL([(lo, a + b * lo), (hi, a + b * hi)])


def comb_pl(f, g, op):
    xs = sorted(set(f.knots()) | set(g.knots()))
    if op in (min, max):
        extra = []
        for x0, x1 in zip(xs, xs[1:]):
            h0, h1 = f(x0) - g(x0), f(x1) - g(x1)
            if h0 * h1 < 0:
                extra.append(x0 + h0 * (x1 - x0) / (h0 - h1))
        xs = sorted(set(xs) | set(extra))
    return PL([(x, op(f(x), g(x))) for x in xs])


def plus(f, g):
    return comb_pl(f, g, lambda a, b: a + b)


def minus(f, g):
    return comb_pl(f, g, lambda a, b: a - b)


def pos(f):
    lo, hi = f.knots()[0], f.knots()[-1]
    return comb_pl(f, lin(0, 0, lo, hi), max)


def integral(f):
    return sum((x1 - x0) * (y0 + y1) / 2 for (x0, y0), (x1, y1) in zip(f.pts, f.pts[1:]))


def loss_function():
    """d(x) from the counting formulas, x = p/N, all quantities divided by N"""
    b, H, L, A, q, n = 7, 65, 59, 19, 4, 48
    lo1, hi1 = Fr(0), Fr(H, 2)
    X = lambda a, s: lin(Fr(a), Fr(s), lo1, hi1)  # noqa: E731
    d0 = pos(minus(comb_pl(comb_pl(X(0, 1), X(L, -1), min), X(A, 0), min), comb_pl(X(b, 0), X(H, -2), max)))
    d_low = minus(X(2 * n, 0), pos(minus(d0, X(q, 0))))
    lo2, hi2 = Fr(H, 2), Fr(H)
    Y = lambda a, s: lin(Fr(a), Fr(s), lo2, hi2)  # noqa: E731
    K, J = Y(L, -1), Y(H, -1)
    R = plus(plus(pos(K), pos(minus(K, Y(A, 0)))), pos(minus(J, comb_pl(Y(b, 0), K, max))))
    S = plus(pos(minus(comb_pl(Y(A, 0), K, min), Y(b, 0))), pos(minus(comb_pl(Y(b, 0), J, min), comb_pl(Y(0, 0), K, max))))
    d_high = comb_pl(comb_pl(Y(2 * n, 0), plus(Y(n, 0), R), min), plus(plus(R, R), S), min)
    return d0, d_low, R, S, d_high


def _linexpr(s):
    s = s.replace(' ', '')
    a, bb = Fr(0), Fr(0)
    for t in re.findall(r'[+-]?[^+-]+', s):
        if t.endswith('x'):
            c = t[:-1]
            bb += Fr(c + '1') if c in ('', '+', '-') else Fr(c)
        else:
            a += Fr(t)
    return a, bb


def _frac(s):
    s = s.strip()
    if '/' in s:
        a, b = s.split('/')
        return Fr(int(a), int(b))
    return Fr(s)


def agrees_on(f, a, b, expr):
    """f equals the linear expr on [a,b] (both continuous PL; compare at every knot in [a,b] and the ends)"""
    ca, cb = expr
    pts = [a, b] + [x for x in f.knots() if a < x < b]
    return all(f(x) == ca + cb * x for x in pts)


def component_finite(tex, found_tex, checks, mutate=None):
    out = {}
    L = tex.split('\n')
    loss_rows = []
    for ln in L[555:569]:
        mm = re.match(r'\s*\{\[([\d/]+),([\d/]+)\]\}&([^&]+)&([\d]+),([\d]+)&([\d/]+)', ln)
        if mm:
            loss_rows.append((_frac(mm.group(1)), _frac(mm.group(2)), _linexpr(mm.group(3)), Fr(mm.group(4)), Fr(mm.group(5)), _frac(mm.group(6))))
    rs_rows = []
    for ln in L[541:550]:
        mm = re.match(r'\s*\{\[([\d/]+),([\d/]+)\]\}&([^&]+)&([^\\]+)\\\\', ln)
        if mm:
            rs_rows.append((_frac(mm.group(1)), _frac(mm.group(2)), _linexpr(mm.group(3)), _linexpr(mm.group(4))))
    mm = re.search(r'\\int_0\^\{65\}d\(x\)\\,dx=\\frac\{(\d+)\}\{(\d+)\}', tex)
    area_printed = Fr(int(mm.group(1)), int(mm.group(2)))
    mm = re.search(r'\\ge -\\frac\{(\d+)\}\{(\d+)\}\s*-\\left\(\\frac12\+\\frac\{(\d+)\}\{(\d+)\}\\right\)\\log2\s*>-(\d\.\d+)\.', tex)
    c0 = Fr(int(mm.group(1)), int(mm.group(2)))
    c2 = Fr(int(mm.group(3)), int(mm.group(4)))
    lower_printed = -Fr(mm.group(5))
    mm = re.search(r'2\\sum_\{j=0\}\^\{(\d+)\}\\frac\{3\^\{-\(2j\+1\)\}\}\{2j\+1\}\s*\+\\frac\{2\\,3\^\{-(\d+)\}\}\{(\d+)\(1-3\^\{-2\}\)\}\s*<\\frac\{(\d+)\}\{10\^(\d)\}', tex)
    J5, e13, d13, l2num, l2exp = (int(x) for x in mm.groups())
    mm = re.search(r'-\\frac\{(\d+)\}\{(\d+)\}-\\frac\{(\d+)\}\{(\d+)\}\\frac\{(\d+)\}\{10\^(\d)\}\s*=-\\frac\{(\d+)\}\{(\d+)\}>-(\d\.\d+),', tex)
    fin = [int(x) for x in mm.groups()[:8]]
    fin_cut = -Fr(mm.group(9))
    mm = re.search(r'With \$\\delta=\(q\+g\+h\)/n=(\d+)/(\d+)\$, one has', found_tex)
    delta_printed = Fr(int(mm.group(1)), int(mm.group(2)))
    mm = re.search(r'=-\\frac\{(\d+)\}\{(\d+)\}n\^2-O_G', found_tex)
    two_adic_printed = Fr(int(mm.group(1)), int(mm.group(2)))
    data = dict(loss_rows=loss_rows, rs_rows=rs_rows, area=area_printed, c0=c0, c2=c2, lower=lower_printed,
                J5=J5, e13=e13, d13=d13, l2=Fr(l2num, 10 ** l2exp), fin=fin, fin_cut=fin_cut, delta=delta_printed, two=two_adic_printed)
    if mutate:
        mutate(data)
    d0, d_low, R, S, d_high = loss_function()
    check(checks, '3. d0/N = 0 on [0,23], 2x-46 on [23,29], 12 on [29,65/2] (odd-primes.tex:529-536)',
          agrees_on(d0, Fr(0), Fr(23), (0, 0)) and agrees_on(d0, Fr(23), Fr(29), (-46, 2)) and agrees_on(d0, Fr(29), Fr(65, 2), (12, 0)))
    for a, b, rx, sx in data['rs_rows']:
        check(checks, '3. R/N, S/N on [%s,%s] = (%s + %s x, %s + %s x) (odd-primes.tex:542-549)' % (a, b, rx[0], rx[1], sx[0], sx[1]),
              agrees_on(R, a, b, rx) and agrees_on(S, a, b, sx))
    check(checks, '3. d is continuous at 65/2 (both counting regimes give %s)' % d_low(Fr(65, 2)), d_low(Fr(65, 2)) == d_high(Fr(65, 2)))
    full_ok = True
    for a, b, ex, va, vb, area in data['loss_rows']:
        f = d_low if b <= Fr(65, 2) else d_high
        seg = PL([(x, f(x)) for x in sorted(set([a, b] + [x for x in f.knots() if a < x < b]))])
        okr = agrees_on(f, a, b, ex) and f(a) == va and f(b) == vb and integral(seg) == area
        full_ok = full_ok and okr
        check(checks, '3. loss table row [%s,%s]: d = %s + %s x, endpoint values %s,%s, integral %s' % (a, b, ex[0], ex[1], va, vb, area), okr,
              'recomputed integral %s' % integral(seg))
    tot = integral(d_low) + integral(d_high)
    out['area'] = tot
    check(checks, '3. the rows tile [0,65] and the area is int_0^65 d = %s (printed %s)' % (tot, data['area']),
          tot == data['area'] and data['loss_rows'][0][0] == 0 and data['loss_rows'][-1][1] == 65 and
          all(data['loss_rows'][i][1] == data['loss_rows'][i + 1][0] for i in range(len(data['loss_rows']) - 1)) and d_high(Fr(65)) == 0)
    check(checks, '3. odd-prime constant: (8609/2) / 2304 = 8609/4608 (n^2 = 2304 N^2)', tot / 2304 == data['c0'])
    delta = Fr(4 + 4 + 2, 48)
    two = delta / 2 + delta ** 2 / 8
    # the quadratic minimization behind it (N = 1): min over m + l <= n of -(H-b)m + 3/2 m^2 + 1/2 l^2 + C(n-m-l)
    n_, Hb, C_ = 48, 65 - 7, 63
    ms = Fr(2 + delta) * n_ / 4
    gmin = Fr(n_ * n_, 2) - (2 + delta) * n_ * ms + 2 * ms * ms
    check(checks, '3. 2-adic constant: delta = (q+g+h)/n = 10/48, delta/2 + delta^2/8 = %s = the quadratic minimum / n^2 (at m = %s n, l = n - m)' % (two, ms / n_),
          delta == data['delta'] and two == data['two'] and gmin == -two * n_ * n_ and Hb == n_ * (1 + delta) and 0 <= ms <= n_ and C_ >= n_)
    check(checks, '3. the log 2 coefficient: 1/2 + 505/4608 = 2809/4608', Fr(1, 2) + data['c2'] == Fr(2809, 4608) and data['c2'] == two)
    l2up = 2 * sum(Fr(1, 3 ** (2 * j + 1) * (2 * j + 1)) for j in range(data['J5'] + 1)) + Fr(2, 3 ** data['e13'] * data['d13']) / (1 - Fr(1, 9))
    check(checks, '3. the printed rational bound 2 sum_{j<=5} 3^-(2j+1)/(2j+1) + 2 3^-13/(13(1-3^-2)) < 693149/10^6',
          data['J5'] == 5 and data['e13'] == 13 and data['d13'] == 13 and l2up < data['l2'], '%s' % (data['l2'] - l2up))
    check(checks, '3. log 2 < 693149/10^6 (this file\'s enclosure)', LOG2[1] < data['l2'])
    a, b_, c, d, e, f10, g, h = data['fin']
    val = -Fr(a, b_) - Fr(c, d) * Fr(e, 10 ** f10)
    check(checks, '3. -8609/4608 - (2809/4608)(693149/10^6) = -10556055541/4608000000 > -2.29084',
          (a, b_, c, d) == (8609, 4608, 2809, 4608) and val == -Fr(g, h) and val > data['fin_cut'] == data['lower'], str(val))
    out['lower'] = -(tot / 2304) - (Fr(1, 2) + two) * LOG2[1]   # this file's area and 2-adic constant, not the printed ones
    return out


# ---------------------------------------------------------------- the decision

def decide(src=None, mutate_cert=None, mutate_nonv=None, mutate_odd=None):
    src = src or Sources()
    checks = []
    tex = src.text(CERT)
    real_tex = src.text(REALP)
    energy_tex = src.text(ENERGY)
    found_tex = src.text(FOUND)
    nonv_tex = src.text(NONV)
    odd_tex = src.text(ODD)
    intro_tex = src.text(INTRO)
    concl_tex = src.text(CONCL)
    src.text('preprints/Catalans-constant-is-irrational-September-24-2026/build/main.tex')
    check(checks, '0. the paper states the theorem and the two constants (introduction.tex:16-18, 177-182; conclusion.tex:9-15)',
          'Catalan\'s constant is irrational.' in intro_tex and '$\\limsup\\mathcal L_N\\le-2.290939875<-2.2909$' in intro_tex
          and '>-2.29084' in concl_tex and '$-2.29084>-2.2909$' in concl_tex)
    check(checks, '0. the energy dual and the barrier fields as used (energy.tex:10-16, 37-47)',
          'W_\\kappa(x)&=(\\alpha+2\\gamma)\\log|x|+2\\eta\\log(1-x)' in energy_tex and 'D(x)&=2\\gamma-\\frac{2x^2}{1+x^2}.' in energy_tex
          and '(-1+\\alpha+\\gamma)\\log2' in energy_tex)
    ok, detail = transcendental_selftests()
    check(checks, '0. the rational enclosures of log and arctan pass their cross-checks', ok, detail)
    try:
        data = parse_certificate(tex)
        params = parse_params(real_tex)
    except Exception as exc:  # pragma: no cover
        return {'verdict': 'REFUSED', 'checks': checks, 'sources': src.read, 'decides': 'nothing: the certificate did not parse (%r)' % exc, 'value': {}}
    if mutate_cert:
        mutate_cert(data)
    check(checks, '0. parameters alpha, beta, gamma, eta = 11/48, 7/48, 4/48, 2/48', params == (Fr(11, 48), Fr(7, 48), Fr(4, 48), Fr(2, 48)))
    r1 = component_real(data, params, checks)
    r2 = component_matrices(nonv_tex, checks, mutate_nonv)
    r3 = component_finite(odd_tex, found_tex, checks, mutate_odd)
    upper = max(r1['rhs'].values())
    lower = r3['lower']
    check(checks, '4. FINAL: this file\'s upper constant max(RHS_2, RHS_1) = %.12f < lower constant -8609/4608 - (2809/4608) log 2 = %.12f (margin %.3e)'
          % (float(upper), float(lower), float(lower - upper)), upper < lower)
    check(checks, '4. the paper\'s chain: printed upper -2.290939875 < printed lower -2.29084',
          data['upper_printed'][0] < -Fr('2.29084') and data['upper_printed'][0] <= data['upper_printed'][1])
    ok = all(c['pass'] for c in checks)
    value = {
        'rhs_kappa2': '%.15f' % float(r1['rhs'][2]), 'rhs_kappa1': '%.15f' % float(r1['rhs'][1]),
        'lower_constant': '%.15f' % float(lower), 'margin': '%.6e' % float(lower - upper),
        'paper_margin': '%.6e' % float(-Fr('2.29084') - data['upper_printed'][0]),
        'sup': {'%s_%d' % (k[1], k[0]): '%.15f' % float(v) for k, v in r1['sup'].items()},
        'norm_upper': {'kappa=%d' % k: '%.15f' % float(v[1]) for k, v in r1['norm'].items()},
        'log2_enclosure_width': '%.1e' % float(LOG2[1] - LOG2[0]),
        'det_digits': {('B0', 'B0+B1', 'B0-B1')[(0, 1, -1).index(s)]: [len(str(abs(d.numerator))), len(str(d.denominator))] for s, d in r2['det'].items()},
        'loss_area': str(r3['area']),
    }
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': ('a finite component: the three finite components of the proof and their comparison, not the headline. (1) the real-place certificate — for the published trial '
                        'sequences, the right side of eq:energy-dual is <= -2.290939875 (kappa=2) and -2.296789875 (kappa=1), '
                        'with every stationary point of the two barrier functions isolated and every printed bracket, '
                        'variation count and candidate value recomputed; (2) the three fixed 48x48 matrices B0, B0+B1, '
                        'B0-B1 are invertible (exact determinants over Q, the mod-101 pivot table, the base matrix built '
                        'two ways); (3) the finite-place constant -8609/4608 - (2809/4608) log 2 > -2.29084 (the loss '
                        'function and its area 8609/2 from the counting formulas, 505/4608); (4) the strict comparison '
                        'upper < lower. The analytic framework that makes these imply irrationality is not decided.'),
            'value': value}


def forge():
    """each must NOT certify"""
    out = []

    def bump_p(d):
        d['seqs'][(2, 'p')][0] += 1
    r = decide(mutate_cert=bump_p)
    out.append(('one kappa=2 trial coefficient changed by 10^-8 (p_1 45559127 -> 45559128): printed values no longer reproduce', r['verdict']))

    def move_bracket(d):
        d['brackets'][(2, 'X')][0] += 2
    r = decide(mutate_cert=move_bracket)
    out.append(('one root bracket moved by 2/10^10 (kappa=2, X, -9601109148 -> -9601109146)', r['verdict']))

    def big_p(d):
        d['seqs'][(2, 'p')][0] += 100000
    r = decide(mutate_cert=big_p)
    fc = [c for c in r['checks'] if c['check'].startswith('4. FINAL')][0]
    out.append(('kappa=2 trial coefficient p_1 raised by 10^-3: this file\'s own bound %s the lower constant (%s)'
                % ('stays below' if fc['pass'] else 'is ABOVE', r['value']['rhs_kappa2']), r['verdict']))

    def pivot(par, piv, sw):
        piv[0][0][0] = (piv[0][0][0] + 1) % 101
        return par, piv, sw
    r = decide(mutate_nonv=pivot)
    out.append(('one printed modular pivot changed (sigma=0, first pivot 60 -> 61)', r['verdict']))

    def aux(par, piv, sw):
        par = dict(par, truncate_aux=True)
        return par, piv, sw
    r = decide(mutate_nonv=aux)
    dets = [c for c in r['checks'] if c['check'].startswith('2. det(')]
    out.append(('the auxiliary row 48 truncated (its degree-18 / degree-19 terms dropped, the slip nonvanishing.tex:168-174 warns of); '
                'the three determinants %s nonzero' % ('stay' if all(c['pass'] for c in dets) else 'are NOT all'), r['verdict']))

    def log2cut(d):
        d['l2'] = Fr(693147, 10 ** 6)
    r = decide(mutate_odd=log2cut)
    out.append(('the log 2 cutoff of the lower constant 693149/10^6 -> 693147/10^6', r['verdict']))

    def area(d):
        d['loss_rows'][4] = d['loss_rows'][4][:5] + (Fr(803, 2) - 1,)
        d['area'] = d['area'] - 1
    r = decide(mutate_odd=area)
    out.append(('loss table: the [69/2,40] integral and the area each lowered by 1 (8609/2 -> 8607/2)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    import time
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    for f in forge():
        print('FORGE', f)
    print('forges %.1fs' % (time.time() - t))
