"""c42.py — the registry's asterisked upper bound for Turán's pure power-sum constant, C42 <= 0.6906538, decided.

Standard library only; written from the claimant's proof note (S. Griego, github.com/sebastian-griego/turan-c42-certificate
at v1.0.0 = c8ddce14, pinned by sha256; no licence stated, so nothing of it is copied), sharing no code with its verifier.

THE CLAIM. limsup R_n <= C = 3453269/5000000, R_n = min over max|z_i| = 1 of max_{k<=n} |sum_i z_i^k|. The note builds, for
each large n, a point set from the power sums S_k (s = 1 - alpha on the first tau n, eta in the middle, a last block chosen
so that b_n = 0), and proves by an asymptotic argument (§5–§9, prose, no finite threshold) that this works for all large n
PROVIDED four exact facts hold: |1 - alpha| < C, |eta| < C, tau > 1/3, and the LIMITING inequality |Y| < C D with
    I_A(x) = sum_{r>=0} x^(A+r)/(A+r),  K = I_alpha(tau),  D = I_{Re alpha}(tau),  A1 = I_alpha(1-tau) - I_alpha(tau),
    A2 = 2 sum_m c_m L^(alpha+m)/(alpha+m), c_m = log(B/tau) - sum_{q<=m} 1/(q B^q),  L = 1 - 2 tau,  B = 1 - tau,
    Y = 1 - w A1 + (w^2/2) A2 + s K,  w = eta - s.

DECIDED HERE: those four facts, in Decimal intervals at 60 digits (every operation in a named rounding context; ln and exp
correctly rounded and widened one ulp; cos and sin by Taylor series with the Lagrange remainder), each series summed with
the tail bound the note states (checked here: |I_A tail| <= x^(a+N)/((a+N)(1-x)); the A2 tail as the note writes it).
NOT decided: the asymptotic reduction, which is the note's argument — so the verdict on the registry's row is PARTIAL."""
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN
from fractions import Fraction as Fr

PREC = 60
DN = Context(prec=PREC, rounding=ROUND_FLOOR)
UP = Context(prec=PREC, rounding=ROUND_CEILING)
NE = Context(prec=PREC, rounding=ROUND_HALF_EVEN)


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
        return Iv(NE.next_minus(NE.ln(a.lo)), NE.next_plus(NE.ln(a.hi)))

    def widen(a, r):
        """[lo - r, hi + r] for a Decimal r >= 0"""
        return Iv(DN.subtract(a.lo, r), UP.add(a.hi, r))

    def mag(a):
        return max(abs(a.lo), abs(a.hi))


def sincos(y, terms=40):
    """sin and cos on an interval y with |y| <= 4: Taylor polynomials in interval arithmetic plus |y|^(n+1)/(n+1)!"""
    s, c = Iv.q(0), Iv.q(0)
    p = Iv.q(1)
    fact = 1
    for k in range(terms):
        if k:
            p = p * y
            fact *= k
        t = p / fact
        if k % 4 == 0:
            c = c + t
        elif k % 4 == 1:
            s = s + t
        elif k % 4 == 2:
            c = c - t
        else:
            s = s - t
    m = y.mag()
    r = UP.divide(UP.power(m, terms), Decimal(fact * terms))       # |y|^terms / terms!
    return s.widen(r), c.widen(r)


class Cx:
    """a rectangle in C: real and imaginary intervals"""
    __slots__ = ('re', 'im')

    def __init__(self, re, im=None):
        self.re = re if isinstance(re, Iv) else Iv.q(re)
        self.im = (im if isinstance(im, Iv) else Iv.q(im)) if im is not None else Iv.q(0)

    def _c(b):
        return b if isinstance(b, Cx) else Cx(b)

    def __add__(a, b):
        b = Cx._c(b)
        return Cx(a.re + b.re, a.im + b.im)
    __radd__ = __add__

    def __sub__(a, b):
        b = Cx._c(b)
        return Cx(a.re - b.re, a.im - b.im)

    def __rsub__(a, b):
        return Cx._c(b) - a

    def __mul__(a, b):
        b = Cx._c(b)
        return Cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)
    __rmul__ = __mul__

    def __truediv__(a, b):
        b = Cx._c(b)
        d = b.re * b.re + b.im * b.im
        return Cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d)

    def widen(a, r):
        return Cx(a.re.widen(r), a.im.widen(r))


def cpow_real_base(x, A):
    """x^A for a real x in (0, 1) and complex A: e^(Re A ln x) (cos + i sin)(Im A ln x)"""
    lx = Iv.q(x).ln()
    mod = (A.re * lx).exp()
    s, c = sincos(A.im * lx)
    return Cx(mod * c, mod * s)


def I_series(A, x, N):
    """I_A(x) = sum_{r < N} x^(A+r)/(A+r), widened by the tail bound x^(a+N)/((a+N)(1-x)), a = the lower end of Re A"""
    xa = cpow_real_base(x, A)
    tot = Cx(0, 0)
    xr = Fr(1)
    for r in range(N):
        tot = tot + xa * xr / (A + r)
        xr *= Fr(x)
    a = A.re.lo
    xaN = (Iv.q(x).ln() * (Iv(a) + N)).exp().hi                    # x^(a+N), x < 1, a <= Re A
    tail = UP.divide(xaN, DN.multiply(DN.add(a, Decimal(N)), (1 - Iv.q(x)).lo))
    return tot.widen(tail)


def decide(cert, N=160, NA2=160):
    tau, C = Fr(cert['tau']), Fr(cert['bound'])
    al = (Fr(cert['alpha']['re']), Fr(cert['alpha']['im']))
    eta = (Fr(cert['eta']['re']), Fr(cert['eta']['im']))
    s = (1 - al[0], -al[1])
    w = (eta[0] - s[0], eta[1] - s[1])
    checks = []
    checks.append({'name': 's = 1 - alpha and w = eta - s are the certificate\'s', 'ok': s == (Fr(cert['s']['re']), Fr(cert['s']['im'])) and w == (Fr(cert['w']['re']), Fr(cert['w']['im']))})
    checks.append({'name': '|1 - alpha|^2 < C^2 (exactly)', 'ok': s[0] ** 2 + s[1] ** 2 < C * C, 'detail': str(C * C - s[0] ** 2 - s[1] ** 2)})
    checks.append({'name': '|eta|^2 < C^2 (exactly)', 'ok': eta[0] ** 2 + eta[1] ** 2 < C * C, 'detail': str(C * C - eta[0] ** 2 - eta[1] ** 2)})
    checks.append({'name': 'tau > 1/3 (three middle corrections cannot reach z^n)', 'ok': tau > Fr(1, 3)})
    checks.append({'name': 'C < 0.69368, the previous public bound', 'ok': C < Fr(69368, 100000)})
    A = Cx(Iv.q(al[0]), Iv.q(al[1]))
    ar = Cx(Iv.q(al[0]), Iv.q(0))
    K = I_series(A, tau, N)
    D = I_series(ar, tau, N).re
    A1 = I_series(A, 1 - tau, 3 * N) - K
    L, B = 1 - 2 * tau, 1 - tau
    lnBt = Iv.q(B / tau).ln()
    La = cpow_real_base(L, A)
    tot = Cx(0, 0)
    Lm = Fr(1)
    harm = Fr(0)
    for m in range(NA2):
        if m:
            harm += Fr(1, m) / B ** m
        cm = lnBt - harm
        tot = tot + La * Lm * Cx(cm, Iv.q(0)) / (A + m)
        Lm *= L
    a = al[0]
    Nn = NA2
    t1 = lnBt * Iv.q(L ** Nn / (1 - L))
    t2 = Iv.q((L / B) ** Nn / ((1 - B) * (1 - L / B)))
    tailA2 = (Iv.q(2) * (Iv.q(L).ln() * a).exp() / (Iv.q(a) + Nn) * (t1 + t2)).hi
    A2 = (tot * 2).widen(tailA2)
    W = Cx(Iv.q(w[0]), Iv.q(w[1]))
    S = Cx(Iv.q(s[0]), Iv.q(s[1]))
    Y = Cx(1, 0) - W * A1 + (W * W) * Cx(Fr(1, 2), 0) * A2 + S * K
    Y2 = Y.re * Y.re + Y.im * Y.im
    CD2 = Iv.q(C * C) * D * D
    checks.append({'name': '|Y|^2 < C^2 D^2: the limiting inequality', 'ok': Y2.hi < CD2.lo, 'detail': 'gap %.4e' % float(DN.subtract(CD2.lo, Y2.hi))})
    enc = cert['enclosures']
    def inside(iv, pair):
        lo, hi = Fr(pair[0]), Fr(pair[1])
        return Fr(iv.lo) <= hi and lo <= Fr(iv.hi)
    agree = inside(K.re, enc['K']['re']) and inside(K.im, enc['K']['im']) and inside(A1.re, enc['A1']['re']) and inside(A1.im, enc['A1']['im']) \
        and inside(A2.re, enc['A2']['re']) and inside(A2.im, enc['A2']['im']) and Fr(D.hi) >= Fr(enc['D_lower'])
    checks.append({'name': 'every enclosure the certificate prints (K, A1, A2, D) meets the one computed here', 'ok': agree})
    ok = all(c['ok'] for c in checks)
    ratio_hi = UP.divide((Y2.ln() * Fr(1, 2)).exp().hi, D.lo)
    return {'verdict': 'PARTIAL' if ok else 'REFUTED', 'checks': checks, 'Y': [str(Y.re.lo)[:22], str(Y.im.lo)[:22]], 'D': str(D.lo)[:24],
            'ratioUpper': str(ratio_hi)[:18], 'bound': str(Decimal(C.numerator) / Decimal(C.denominator))}


def J_series(A, t, r, N):
    """J_A(t, r) = int_0^L z^(A-1)/(1-z) log((1-t-z)(1-r-z)/(t r)) dz, L = 1 - t - r > 0, as sum_k c_k L^(A+k)/(A+k) with
    c_0 = log(b d/(t r)), c_k = c_0 - sum_{q<=k} (b^-q + d^-q)/q (b = 1 - t, d = 1 - r), widened by the tail bound
    L^a/(a+N) (c_0 L^N/(1-L) + (L/b)^N/(t (1-L/b)) + (L/d)^N/(r (1-L/d))), which |c_k| <= c_0 + b^-k/t + d^-k/r gives."""
    t, r = Fr(t), Fr(r)
    L = 1 - t - r
    if L <= 0:
        return Cx(0, 0)
    b, d = 1 - t, 1 - r
    c0 = Iv.q(b * d / (t * r)).ln()
    LA = cpow_real_base(L, A)
    tot = Cx(0, 0)
    harm = Fr(0)
    Lk = Fr(1)
    for k in range(N):
        if k:
            harm += (1 / b ** k + 1 / d ** k) / k
        tot = tot + LA * Lk * Cx(c0 - harm, Iv.q(0)) / (A + k)
        Lk *= L
    a = A.re.lo
    La = (Iv.q(L).ln() * Iv(a)).exp().hi
    bound = UP.multiply(UP.divide(La, DN.add(a, Decimal(N))),
                        (c0 * Iv.q(L ** N / (1 - L)) + Iv.q((L / b) ** N / (t * (1 - L / b))) + Iv.q((L / d) ** N / (r * (1 - L / d)))).hi)
    return tot.widen(bound)


def decide_profile(C, alpha, cuts, etas, N=300):
    """a step profile (Röhrig's generalisation of Griego's): S = s = 1 - alpha below cuts[0], eta_j on (cuts[j], cuts[j+1]);
    Y = 1 + s K - sum_j delta_j (I(1 - t_j) - K) + (1/2) sum_{i,j} delta_i delta_j J(t_i, t_j), delta_0 = eta_0 - s,
    delta_j = eta_j - eta_{j-1}. The limiting inequality is |Y| < C D, with |s| < C and every |eta_j| < C."""
    C = Fr(C)
    al = (Fr(alpha[0]), Fr(alpha[1]))
    cuts = [Fr(c) for c in cuts]
    etas = [(Fr(e[0]), Fr(e[1])) for e in etas]
    s = (1 - al[0], -al[1])
    checks = []
    checks.append({'name': 'the cuts rise from 1/3 <= t_0 to 1 - t_0, one eta per block', 'ok': len(cuts) == len(etas) + 1 and Fr(1, 3) <= cuts[0] < Fr(1, 2)
                   and cuts[-1] == 1 - cuts[0] and all(x < y for x, y in zip(cuts, cuts[1:]))})
    margins = [C * C - z[0] ** 2 - z[1] ** 2 for z in [s] + etas]
    checks.append({'name': '|s| < C and |eta_j| < C for every block (exactly)', 'ok': min(margins) > 0, 'detail': 'smallest margin ' + str(min(margins))})
    A = Cx(Iv.q(al[0]), Iv.q(al[1]))
    K = I_series(A, cuts[0], N)
    D = I_series(Cx(Iv.q(al[0]), Iv.q(0)), cuts[0], N).re
    S = Cx(Iv.q(s[0]), Iv.q(s[1]))
    Y = Cx(1, 0) + S * K
    prev = S
    deltas = []
    for t, e in zip(cuts, etas):
        E = Cx(Iv.q(e[0]), Iv.q(e[1]))
        dj = E - prev
        deltas.append((t, dj))
        Y = Y - dj * (I_series(A, 1 - t, N) - K)
        prev = E
    for i, (ti, di) in enumerate(deltas):
        for j, (tj, dj) in enumerate(deltas):
            if j > i:
                continue
            coef = Fr(1, 2) if i == j else Fr(1)
            Y = Y + Cx(coef, 0) * di * dj * J_series(A, ti, tj, N)
    Y2 = Y.re * Y.re + Y.im * Y.im
    CD2 = Iv.q(C * C) * D * D
    checks.append({'name': '|Y|^2 < C^2 D^2: the limiting inequality', 'ok': Y2.hi < CD2.lo, 'detail': 'gap %.4e' % float(DN.subtract(CD2.lo, Y2.hi))})
    ratio_hi = UP.divide((Y2.ln() * Fr(1, 2)).exp().hi, D.lo)
    ok = all(c['ok'] for c in checks)
    return {'verdict': 'PARTIAL' if ok else 'REFUTED', 'checks': checks, 'D': str(D.lo)[:24], 'ratioUpper': str(ratio_hi)[:18], 'bound': str(Decimal(C.numerator) / Decimal(C.denominator)),
            'Y': [str(Y.re.lo)[:22], str(Y.im.lo)[:22]]}


if __name__ == '__main__':
    import json
    import sys
    r = decide(json.load(open(sys.argv[1])))
    print(json.dumps(r, indent=1))
