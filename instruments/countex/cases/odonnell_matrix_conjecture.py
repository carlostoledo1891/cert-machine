"""Independent exact decider: odonnell-matrix-conjecture.

Claim (case.tex, Theorem thm:odonnell-matrix-conjecture): there is no absolute c with
||R - Diag(R)||_1^2 <= c * sum_i |lambda_i - d_ii| for all unit-trace PSD R.  The
family: m >= 2, n = q = 2^m, H = H_{n-1}, B = 1 + q^2 H, delta = 1/(2B), eta = 1/(2n),
gaps g_1 = delta(1+q^2), g_i = delta q^2/i^2, lambda_n = eta, lambda_i = eta + sum_{k>=i} g_k;
R = G_{n-1} ... G_1 diag(lambda) G_1^T ... G_{n-1}^T with Givens rotations
c_i = q/sqrt(q^2+i^2), s_i = i/sqrt(q^2+i^2) on coordinates (i, i+1).  The theorem
claims ratio > m/32 for every m, hence unbounded.

What is decided here, exactly:
  * each member m = 1..M_RECUR is BUILT: the conjugation is carried out in the
    multiquadratic field Q(u_1, ..., u_{n-1}), u_k = (q^2+k^2)^(-1/2), every entry held as
    sum of coef * prod u_k with u_k^2 = 1/(q^2+k^2) reduced exactly.  For m <= M_DENSE and
    for the certificate's own member (n = 512) the whole dense n x n matrix is built
    (all n^2 entries nonzero); for every m only the diagonal and superdiagonal are also
    carried by a restricted engine, with the invariant that makes this
    exact ("an entry R_ab, a != b, is zero while max(a,b) has not been rotated")
    ASSERTED at every read, and the restricted engine is cross-checked against the
    dense one on every m <= M_DENSE.
  * per member: lambda positive, strictly decreasing, trace 1; each G_i orthogonal
    (c_i^2+s_i^2 = 1 in the field); diagonal as claimed and strictly decreasing;
    eps = sum|lambda_i - d_i| = 2 delta; |R_{i,i+1}|^2 exactly as claimed; c_j^2 > 1/2;
    the pinching bound delta q^2 O^2 and a sharper rigorous rational lower bound on
    (2 sum_{i odd}|R_{i,i+1}|)^2/(2 delta) (integer square roots, rounded down);
    both > m/32 and > (m+3)^2/(32(m+2)).
  * the algebra of the all-m step as polynomial identities in the symbols.

What is argued in prose, not computed: (1) the trace-norm lower bound
||A||_1 >= |tr(A S)| for the symmetric orthogonal S = sum of [[0,+-1],[+-1,0]] blocks
(duality / von Neumann; equivalent to the source's pinching argument); (2) the two dyadic
harmonic bounds O_m > (m+3)/4 and H_{2^m-1} < m+1 for EVERY m (checked exactly for
m <= M_DYADIC).  Unboundedness over all m therefore rests on these two textbook facts.

Standard library only; no float anywhere.
"""
import json
import math
import os
import sys
from fractions import Fraction

CASE = 'odonnell-matrix-conjecture'
M_DENSE = 8      # dense exact build for n = 2^m, m <= M_DENSE
M_RECUR = 11     # restricted exact build for m <= M_RECUR (n up to 2048)
M_DYADIC = 14    # exact check of the dyadic harmonic bounds


# ------------------------------------------------ the multiquadratic field
class MQ:
    """Element of Q(u_1..u_{n-1}) as {bitmask: Fraction}; bit k = factor u_k.
    Only sums of such monomials; u_k^2 = inv2[k] = 1/(q^2+k^2)."""
    __slots__ = ('t',)

    def __init__(self, t=None):
        self.t = {m: c for m, c in (t or {}).items() if c != 0}

    @staticmethod
    def rat(x):
        return MQ({0: Fraction(x)})

    def add(self, o):
        r = dict(self.t)
        for m, c in o.t.items():
            v = r.get(m, 0) + c
            if v == 0:
                r.pop(m, None)
            else:
                r[m] = v
        e = MQ()
        e.t = r
        return e

    def neg(self):
        e = MQ()
        e.t = {m: -c for m, c in self.t.items()}
        return e

    def mul_gen(self, k, scal, inv2):
        """Multiply by scal * u_k (scal rational)."""
        bit = 1 << k
        r = {}
        for m, c in self.t.items():
            if m & bit:
                r[m ^ bit] = r.get(m ^ bit, 0) + c * scal * inv2[k]
            else:
                r[m | bit] = r.get(m | bit, 0) + c * scal
        e = MQ()
        e.t = {m: c for m, c in r.items() if c != 0}
        return e

    def is_zero(self):
        return not self.t

    def rational(self):
        """The value if it is a rational (mask 0 only), else None."""
        if not self.t:
            return Fraction(0)
        if set(self.t) == {0}:
            return self.t[0]
        return None

    def square_if_monomial(self, inv2):
        """Exact square of a single-monomial element (a rational), else None."""
        if len(self.t) != 1:
            return None if self.t else Fraction(0)
        (m, c), = self.t.items()
        s = c * c
        k = 0
        while m:
            if m & 1:
                s *= inv2[k]
            m >>= 1
            k += 1
        return s


def harmonic(N):
    """H_N exactly (common-denominator integer sum)."""
    if N <= 0:
        return Fraction(0)
    L = 1
    for i in range(1, N + 1):
        L = L * i // math.gcd(L, i)
    return Fraction(sum(L // i for i in range(1, N + 1)), L)


def odd_harmonic(N):
    """sum of 1/i over odd i <= N."""
    if N <= 0:
        return Fraction(0)
    L = 1
    for i in range(1, N + 1, 2):
        L = L * i // math.gcd(L, i)
    return Fraction(sum(L // i for i in range(1, N + 1, 2)), L)


def family_data(n, q):
    H = harmonic(n - 1)
    B = 1 + q * q * H
    delta = Fraction(1) / (2 * B)
    eta = Fraction(1, 2 * n)
    g = {1: delta * (1 + q * q)}
    for i in range(2, n):
        g[i] = delta * Fraction(q * q, i * i)
    lam = [None] * (n + 1)           # 1-based
    lam[n] = eta
    for i in range(n - 1, 0, -1):
        lam[i] = lam[i + 1] + g[i]
    inv2 = [None] + [Fraction(1, q * q + k * k) for k in range(1, n)]
    return {'H': H, 'B': B, 'delta': delta, 'eta': eta, 'g': g, 'lam': lam, 'inv2': inv2}


def rotate_dense(R, i, q, inv2):
    """R <- G_i R G_i^T, G_i = [[c,-s],[s,c]] on 1-based coordinates (i, i+1);
    c = q u_i, s = i u_i."""
    n = len(R)
    a, b = i - 1, i

    def c_(x):
        return x.mul_gen(i, Fraction(q), inv2)

    def s_(x):
        return x.mul_gen(i, Fraction(i), inv2)
    # rows
    ra, rb = R[a], R[b]
    R[a] = [c_(ra[j]).add(s_(rb[j]).neg()) for j in range(n)]
    R[b] = [s_(ra[j]).add(c_(rb[j])) for j in range(n)]
    # columns
    for row in R:
        xa, xb = row[a], row[b]
        row[a] = c_(xa).add(s_(xb).neg())
        row[b] = s_(xa).add(c_(xb))


def build_dense(n, q, fd):
    inv2 = fd['inv2']
    R = [[MQ.rat(fd['lam'][r + 1]) if r == c else MQ() for c in range(n)] for r in range(n)]
    for i in range(1, n):
        rotate_dense(R, i, q, inv2)
    return R


def build_restricted(n, q, fd):
    """Carry only diag[1..n] and sup[1..n-1] (sup[i] = R_{i,i+1}); every entry read
    outside that set is justified by the invariant and asserted zero by bookkeeping."""
    inv2 = fd['inv2']
    diag = [None] + [MQ.rat(fd['lam'][k]) for k in range(1, n + 1)]
    sup = [None] + [MQ() for _ in range(1, n)]
    touched = set()                   # coordinates rotated so far
    for i in range(1, n):
        # entries read by G_i that are not carried: R_{i,i+1} (in sup, check zero)
        # and R_{i-1,i+1}; both involve coordinate i+1, which must be untouched.
        assert (i + 1) not in touched, 'invariant broken'
        assert sup[i].is_zero(), 'R_{i,i+1} must be zero before G_i'

        def c_(x):
            return x.mul_gen(i, Fraction(q), inv2)

        def s_(x):
            return x.mul_gen(i, Fraction(i), inv2)
        A_, D_ = diag[i], diag[i + 1]
        # [[c,-s],[s,c]] [[A,0],[0,D]] [[c,s],[-s,c]]
        newA = c_(c_(A_)).add(s_(s_(D_)))
        newD = s_(s_(A_)).add(c_(c_(D_)))
        newB = c_(s_(A_)).add(s_(c_(D_)).neg())
        diag[i], diag[i + 1], sup[i] = newA, newD, newB
        if i >= 2:
            # R_{i-1,i} <- c R_{i-1,i} - s R_{i-1,i+1}, and R_{i-1,i+1} = 0 (i+1 untouched)
            sup[i - 1] = c_(sup[i - 1])
        # R_{i+1,i+2} stays 0 (i+2 untouched); nothing else carried changes
        touched.update((i, i + 1))
    return diag, sup


def isqrt_floor_frac(a, bits=200):
    """Rational lower bound on sqrt(a) for a rational a >= 0 (rounded down)."""
    if a <= 0:
        return Fraction(0)
    S = 1 << bits
    N, D = a.numerator, a.denominator
    return Fraction(math.isqrt(N * D * S * S), D * S)


def decide_member(n, q, full=False, check=None):
    """Decide one member exactly.  Returns (ok, facts dict, list of failed names)."""
    fails = []
    facts = {}

    def need(name, ok, detail=''):
        if check is not None:
            check(name, ok, detail)
        if not ok:
            fails.append(name)

    m = n.bit_length() - 1
    need('n = 2^m with m >= 1 and q = n (family member)', n == 1 << m and m >= 1 and q == n,
         'n=%d, q=%d, m=%d' % (n, q, m))
    fd = family_data(n, q)
    lam, delta = fd['lam'], fd['delta']
    need('lambda strictly decreasing and positive', all(lam[i] > lam[i + 1] for i in range(1, n)) and lam[n] > 0)
    need('trace = sum lambda = 1 exactly', sum(lam[1:]) == 1)
    need('each G_i orthogonal: c_i^2 + s_i^2 = (q^2+i^2) u_i^2 = 1',
         all((q * q + i * i) * fd['inv2'][i] == 1 for i in range(1, n)))
    diag, sup = build_restricted(n, q, fd)
    d = [None] + [x.rational() for x in diag[1:]]
    need('diagonal entries are rational', all(x is not None for x in d[1:]))
    pred = [None] + [lam[1] - delta] + [lam[i] for i in range(2, n)] + [lam[n] + delta]
    need('diagonal = (lambda_1 - delta, lambda_2..lambda_{n-1}, lambda_n + delta)', d == pred)
    strict = all(d[i] > d[i + 1] for i in range(1, n))
    need('diagonal strictly decreasing (the "Moreover" clause)', strict,
         'min edge gap %s' % min(d[i] - d[i + 1] for i in range(1, n)))
    eps = sum(abs(lam[i] - d[i]) for i in range(1, n + 1))
    need('eps = sum |lambda_i - d_i| = 2 delta', eps == 2 * delta)
    sq = [None] + [sup[i].square_if_monomial(fd['inv2']) for i in range(1, n)]
    need('every superdiagonal entry is a single field monomial (exact modulus)', all(x is not None for x in sq[1:]))
    pred_sq = [None]
    for i in range(1, n):
        ri2 = Fraction(q * q, i * i)
        if i <= n - 2:
            pred_sq.append(delta * delta * ri2 * q * q * fd['inv2'][i + 1])
        else:
            pred_sq.append(delta * delta * ri2)
    need('|R_{i,i+1}|^2 = (delta r_i c_{i+1})^2, and (delta r_{n-1})^2 at the last edge', sq == pred_sq)
    cj_half = all(2 * q * q * fd['inv2'][j] > 1 for j in range(1, n))
    need('c_j^2 > 1/2 for 1 <= j <= n-1', cj_half)
    O = odd_harmonic(n - 1)
    H = fd['H']
    pin = delta * q * q * O * O
    # rigorous sharper bound with the actual c's: ratio >= (2 sum_{i odd} |R_{i,i+1}|)^2 / (2 delta)
    L = 2 * sum(isqrt_floor_frac(sq[i]) for i in range(1, n, 2))
    sharp = L * L / (2 * delta)
    need('pinching bound delta q^2 O^2 = q^2 O^2 / (2(1+q^2 H))', pin == q * q * O * O / (2 * (1 + q * q * H)))
    need('rigorous lower bound (actual c, sqrt rounded down) >= delta q^2 O^2', sharp >= pin)
    if m >= 2:
        need('O > (m+3)/4 and H_{n-1} < m+1 (dyadic bounds, this m)', O > Fraction(m + 3, 4) and H < m + 1)
    need('ratio > (m+3)^2/(32(m+2)) > m/32', pin > Fraction((m + 3) ** 2, 32 * (m + 2)) and
         Fraction((m + 3) ** 2, 32 * (m + 2)) > Fraction(m, 32))
    facts.update({'m': m, 'H': H, 'B': fd['B'], 'delta': delta, 'O': O, 'pin': pin, 'sharp': sharp,
                  'eps': eps, 'lam': lam, 'd': d, 'sq': sq})
    if full:
        R = build_dense(n, q, fd)
        sym = all(R[a][b].t == R[b][a].t for a in range(n) for b in range(a))
        need('dense build: R symmetric', sym)
        dd = [None] + [R[k][k].rational() for k in range(n)]
        need('dense build: diagonal agrees with the restricted build', dd == d)
        sq_dense = [None] + [R[k - 1][k].square_if_monomial(fd['inv2']) for k in range(1, n)]
        need('dense build: superdiagonal agrees with the restricted build', sq_dense == sq)
        need('dense build: trace 1', sum(dd[1:]) == 1)
        nnz = sum(1 for a in range(n) for b in range(n) if not R[a][b].is_zero())
        facts['nnz'] = nnz
    return (not fails), facts, fails


# ---------------------------------------------- symbolic identities (all m)
def _pmul(a, b):
    r = {}
    for ea, ca in a.items():
        for eb, cb in b.items():
            e = tuple(x + y for x, y in zip(ea, eb))
            r[e] = r.get(e, 0) + ca * cb
    return {e: c for e, c in r.items() if c != 0}


def _padd(a, b, s=1):
    r = dict(a)
    for e, c in b.items():
        r[e] = r.get(e, 0) + s * c
    return {e: c for e, c in r.items() if c != 0}


def symbolic_checks():
    """Identities in the symbols, as polynomial identities (after clearing denominators)."""
    out = []
    # variables (q, i): s_i^2 (1 + r_i^2) = 1  <=>  i^2 (i^2 + q^2) = (q^2 + i^2) i^2
    q2 = {(2, 0): 1}
    i2 = {(0, 2): 1}
    lhs = _pmul(i2, _padd(i2, q2))
    rhs = _pmul(_padd(q2, i2), i2)
    out.append(('s_i^2 (1 + r_i^2) = 1 (each rotation moves exactly delta)', _padd(lhs, rhs, -1) == {}))
    # c_i s_i (1 + r_i^2) = r_i  <=>  q i (i^2+q^2) * i = q (q^2+i^2) i^2  (times i(q^2+i^2) i)
    qi = {(1, 1): 1}
    lhs = _pmul(_pmul(qi, _padd(i2, q2)), {(0, 1): 1})
    rhs = _pmul(_pmul({(1, 0): 1}, _padd(q2, i2)), i2)
    out.append(('c_i s_i delta (1 + r_i^2) = delta r_i (new off-diagonal entry)', _padd(lhs, rhs, -1) == {}))
    # variable C: (m+3)^2 - 32 C * (m+2) at m = 32C+1 equals 160 C + 16
    m_ = {(1,): 32, (0,): 1}
    m3 = _padd(m_, {(0,): 3})
    m2 = _padd(m_, {(0,): 2})
    gap = _padd(_pmul(m3, m3), _pmul({(1,): 32}, m2), -1)
    out.append(('(m+3)^2 - 32C(m+2) = 160C + 16 at m = 32C+1', gap == {(1,): 160, (0,): 16}))
    # variable m: (m+3)^2 - m(m+2) = 4m + 9 > 0 for m >= 0
    mm = {(1,): 1}
    d = _padd(_pmul(_padd(mm, {(0,): 3}), _padd(mm, {(0,): 3})), _pmul(mm, _padd(mm, {(0,): 2})), -1)
    out.append(('(m+3)^2/(32(m+2)) - m/32 has numerator 4m+9 > 0', d == {(1,): 4, (0,): 9}))
    # variables (q, H): q^2 (H+1) - (1 + q^2 H) = q^2 - 1 > 0 for q >= 2
    e = _padd(_pmul({(2, 0): 1}, {(0, 1): 1, (0, 0): 1}), {(0, 0): 1, (2, 1): 1}, -1)
    out.append(('q^2 O^2/(2(1+q^2 H)) > O^2/(2(H+1)) since q^2(H+1) - (1+q^2 H) = q^2 - 1', e == {(2, 0): 1, (0, 0): -1}))
    return out


def decide_from(cert):
    checks = []
    fail = []

    def add(name, ok, detail='', needed=True):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok and needed:
            fail.append(name)

    fa = cert['finite_exact_audit']
    n, q = int(fa['n']), int(fa['q'])
    # --- the certificate's finite member, every fact re-derived
    ok, F, fl = decide_member(n, q, full=True, check=lambda nm, o, dt: add('[n=%d] %s' % (n, nm), o, dt))
    # --- compare the printed numbers with the recomputation
    for key, mine in (('B', F['B']), ('H_n_minus_1', F['H']), ('delta', F['delta']),
                      ('odd_harmonic_sum', F['O']), ('pinching_ratio_lower_bound', F['pin']),
                      ('spectral_diagonal_distance', F['eps'])):
        add('[n=%d] printed %s agrees with recomputation' % (n, key), Fraction(fa[key]) == mine,
            'printed %s...' % str(fa[key])[:40])
    add('[n=%d] printed comparison "pinching_ratio_lower_bound > 1" holds' % n,
        fa.get('comparison', '').replace(' ', '') == 'pinching_ratio_lower_bound>1' and F['pin'] > 1,
        'delta q^2 O^2 = %s... ; sharper rigorous bound %s...' % (
            _dec(F['pin']), _dec(F['sharp'])))

    # --- other members: dense for small m, restricted up to M_RECUR
    grow = []
    for m in range(1, M_RECUR + 1):
        nn = 1 << m
        okm, Fm, flm = decide_member(nn, nn, full=(m <= M_DENSE))
        add('member m=%d (n=%d)%s: all facts decided' % (m, nn, ' dense+restricted' if m <= M_DENSE else ''),
            okm, 'ratio lower bounds: pinning %s..., rigorous %s...; m/32 = %s%s' % (
                _dec(Fm['pin']), _dec(Fm['sharp']), Fraction(m, 32),
                '' if okm else ' FAILED: ' + '; '.join(flm)))
        grow.append(Fm['sharp'])
    add('rigorous ratio lower bound strictly increasing in m = 2..%d (observation)' % M_RECUR,
        all(a < b for a, b in zip(grow[1:], grow[2:])), 'm=1 (n=2) is outside the theorem (m >= 2)',
        needed=False)

    # --- dyadic bounds, exactly, for m <= M_DYADIC
    dy = all(odd_harmonic((1 << m) - 1) > Fraction(m + 3, 4) and harmonic((1 << m) - 1) < m + 1
             for m in range(2, M_DYADIC + 1))
    add('dyadic bounds O_m > (m+3)/4 and H_{2^m-1} < m+1 hold exactly for m = 2..%d' % M_DYADIC, dy,
        'for all m: argued in prose (each dyadic block of odd integers contributes > 1/4; '
        'each dyadic block of H contributes <= 1) -- NOT decided beyond m = %d' % M_DYADIC)

    for nm, ok_ in symbolic_checks():
        add('symbolic: ' + nm, ok_, 'polynomial identity after clearing denominators')

    # --- the family strings
    fam = cert.get('family', {})
    add('family strings match the proof (m = 32C+1, gap 160C+16, bound (m+3)^2/(32(m+2)))',
        fam.get('choice_of_m') == '32*C+1' and fam.get('cross_multiplied_gap') == '160*C+16'
        and fam.get('ratio_lower_bound') == '(m+3)^2/(32*(m+2))', json.dumps(fam))

    claim = ('Each member R_m of the Givens family (m = 1..%d, including the certificate\'s n = 512) is an '
             'exact real symmetric unit-trace PSD matrix with strictly decreasing spectrum and diagonal and '
             '||R-Diag R||_1^2 / sum|lambda_i-d_i| > m/32 (> 1.96 at n = 512); the proof extends this to '
             'every m, so no absolute constant c exists.' % M_RECUR)
    scope = ('DECIDED exactly: the certificate member n=512 and every member m=1..%d built in the '
             'multiquadratic field (the whole dense matrix for m<=%d and for n=512), each with ratio above m/32; the algebra of the '
             'all-m step as polynomial identities.  ARGUED IN PROSE: the trace-norm duality lower bound '
             '||A||_1 >= 2 sum_{i odd}|A_{i,i+1}|, and the dyadic harmonic bounds for m > %d.  The '
             'unboundedness over all m rests on those two textbook facts.' % (M_RECUR, M_DENSE, M_DYADIC))
    parts = {
        'finite members m=1..%d (n=2..%d), incl. the certificate n=512' % (M_RECUR, 1 << M_RECUR):
            'REFUTED' if fail else 'CERTIFIED',
        'all-m algebra (identities in q, i, m, C, H)': 'CERTIFIED (polynomial identities)',
        'all m, hence no absolute c': 'REFUSED as exact arithmetic: rests on the dyadic bounds for m > %d and '
                                      'trace-norm duality, argued in prose (both elementary)' % M_DYADIC,
    }
    if fail:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks, 'scope': scope, 'parts': parts,
                'why': 'failed: ' + '; '.join(fail)}
    return {'verdict': 'CERTIFIED', 'claim': claim, 'checks': checks, 'scope': scope, 'parts': parts,
            'why': ''}


def _dec(x, digits=12):
    """Display only: floor of x to `digits` decimals, from exact integer arithmetic."""
    s = x.numerator * 10 ** digits // x.denominator
    return '%d.%0*d' % (s // 10 ** digits, digits, s % 10 ** digits)


def decide_cert(cert):
    """decide_from, with any failure to read or evaluate the certificate reported as
    REFUSED (never as CERTIFIED)."""
    try:
        return decide_from(cert)
    except Exception as e:  # noqa: BLE001
        return {'verdict': 'REFUSED', 'claim': '', 'checks': [],
                'why': 'certificate could not be read or decided exactly: %s: %s' % (type(e).__name__, e)}


def decide(root):
    try:
        with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
            cert = json.load(f)
    except Exception as e:  # noqa: BLE001
        return {'verdict': 'REFUSED', 'claim': '', 'checks': [], 'why': 'no readable certificate: %s' % e}
    return decide_cert(cert)


def forge(cert):
    """Move q from n to n-1 = 511 (the smallest integer change) and reprint every
    derived number consistently, so that only the mathematics can fail: at q = n-1
    the last diagonal gap g_{n-1} - delta is exactly 0 and c_{n-1}^2 = 1/2.
    Must not be CERTIFIED."""
    c = json.loads(json.dumps(cert))
    fa = c['finite_exact_audit']
    n = int(fa['n'])
    q = n - 1
    fd = family_data(n, q)
    O = odd_harmonic(n - 1)
    fa['q'] = q
    fa['B'] = str(fd['B'])
    fa['H_n_minus_1'] = str(fd['H'])
    fa['delta'] = str(fd['delta'])
    fa['odd_harmonic_sum'] = str(O)
    fa['pinching_ratio_lower_bound'] = str(fd['delta'] * q * q * O * O)
    fa['spectral_diagonal_distance'] = str(2 * fd['delta'])
    return c


def _default_root():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)


if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else _default_root()
    res = decide(root)
    print(CASE, '->', res['verdict'])
    print('claim:', res['claim'])
    for c in res['checks']:
        print('  [%s] %s -- %s' % ('ok' if c['ok'] else 'FAIL', c['name'], c['detail']))
    print('scope:', res.get('scope', ''))
    for k_, v_ in res.get('parts', {}).items():
        print('part:', k_, '->', v_)
    if res['why']:
        print('why:', res['why'])
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
        cert = json.load(f)
    fres = decide_cert(forge(cert))
    print('forge ->', fres['verdict'], '|', fres['why'])
    assert fres['verdict'] != 'CERTIFIED'
