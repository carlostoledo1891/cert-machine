"""Independent exact decider: macdonald-schur-convexity.

Claim (case.tex, Theorem thm:macdonald): McSwiggen-Sahi Theorem 2.1 says that for
q,t in (0,1), a>0 and x in the lattice L_n^{q,t,a}, lambda -> Omega_lambda(x;q,t)
= P_lambda(x;q,t)/P_lambda(t^delta;q,t) is Schur-convex (lambda >= mu in dominance
implies Omega_lambda >= Omega_mu).  The witness: n=2, q=t=r in (0,1), a=1, lattice
index (1,0) giving x=(1,1), lambda=(2,0) >= mu=(1,1); Omega_(2,0)(1,1) = 3/(1+r+r^2)
< 1/r = Omega_(1,1)(1,1).

Independence: the Macdonald polynomials are NOT quoted and NOT taken from the Hall
inner product (the authors' route).  They are derived here as the triangular
eigenfunctions of Macdonald's q-difference operator
    D = sum_i prod_{j != i} (t x_i - x_j)/(x_i - x_j) T_{q,x_i}
in two variables, by exact polynomial algebra over Z[q,t] (division by x1-x2 is
exact synthetic division with a zero-remainder check).  Every identity is checked
as an identity of rational functions in the symbols, by cross-multiplication of
polynomials with Fraction coefficients.  No float anywhere.

Standard library only.
"""
import json
import os
import re
import sys
from fractions import Fraction

CASE = 'macdonald-schur-convexity'


# ---------------------------------------------------------------- polynomials
class Poly:
    """Multivariate polynomial over Q: {monomial: Fraction}, monomial = sorted
    tuple of (var, exp>0)."""
    __slots__ = ('t',)

    def __init__(self, terms=None):
        self.t = {}
        if terms:
            for m, c in terms.items():
                c = Fraction(c)
                if c != 0:
                    self.t[m] = c

    @staticmethod
    def const(c):
        return Poly({(): Fraction(c)})

    @staticmethod
    def var(name):
        return Poly({((name, 1),): Fraction(1)})

    def copy(self):
        p = Poly()
        p.t = dict(self.t)
        return p

    def __add__(self, o):
        o = _P(o)
        r = dict(self.t)
        for m, c in o.t.items():
            v = r.get(m, 0) + c
            if v == 0:
                r.pop(m, None)
            else:
                r[m] = v
        p = Poly()
        p.t = r
        return p

    __radd__ = __add__

    def __neg__(self):
        p = Poly()
        p.t = {m: -c for m, c in self.t.items()}
        return p

    def __sub__(self, o):
        return self + (-_P(o))

    def __rsub__(self, o):
        return _P(o) - self

    @staticmethod
    def _mono_mul(a, b):
        d = dict(a)
        for v, e in b:
            d[v] = d.get(v, 0) + e
        return tuple(sorted(d.items()))

    def __mul__(self, o):
        o = _P(o)
        r = {}
        for m1, c1 in self.t.items():
            for m2, c2 in o.t.items():
                m = Poly._mono_mul(m1, m2)
                v = r.get(m, 0) + c1 * c2
                if v == 0:
                    r.pop(m, None)
                else:
                    r[m] = v
        p = Poly()
        p.t = r
        return p

    __rmul__ = __mul__

    def __pow__(self, k):
        assert isinstance(k, int) and k >= 0
        r = Poly.const(1)
        b = self
        while k:
            if k & 1:
                r = r * b
            b = b * b
            k >>= 1
        return r

    def is_zero(self):
        return not self.t

    def __eq__(self, o):
        return (self - _P(o)).is_zero()

    def __hash__(self):
        return hash(tuple(sorted(self.t.items())))

    def deg_in(self, v):
        return max((dict(m).get(v, 0) for m in self.t), default=0)

    def coeff_in(self, v, e):
        """Coefficient of v^e, as a polynomial in the other variables."""
        r = {}
        for m, c in self.t.items():
            d = dict(m)
            if d.get(v, 0) == e:
                d.pop(v, None)
                r[tuple(sorted(d.items()))] = c
        return Poly(r)

    def subs(self, env):
        """env: var -> Poly/Fraction/int.  Substitute (composition)."""
        out = Poly()
        for m, c in self.t.items():
            term = Poly.const(c)
            rest = []
            for v, e in m:
                if v in env:
                    term = term * (_P(env[v]) ** e)
                else:
                    rest.append((v, e))
            if rest:
                term = term * Poly({tuple(rest): 1})
            out = out + term
        return out

    def value(self):
        """Value of a constant polynomial."""
        assert all(m == () for m in self.t), 'not constant: %r' % self
        return self.t.get((), Fraction(0))

    def __repr__(self):
        if not self.t:
            return '0'
        parts = []
        for m, c in sorted(self.t.items()):
            mono = '*'.join(v if e == 1 else '%s^%d' % (v, e) for v, e in m)
            parts.append(('%s' % c) + ('*' + mono if mono else ''))
        return ' + '.join(parts)


def _P(x):
    if isinstance(x, Poly):
        return x
    return Poly.const(Fraction(x))


class RF:
    """Rational function num/den (no reduction; equality by cross-multiplication)."""
    __slots__ = ('n', 'd')

    def __init__(self, n, d=None):
        self.n = _P(n)
        self.d = _P(1) if d is None else _P(d)
        if self.d.is_zero():
            raise ZeroDivisionError('zero denominator')

    def __add__(self, o):
        o = _R(o)
        return RF(self.n * o.d + o.n * self.d, self.d * o.d)

    __radd__ = __add__

    def __neg__(self):
        return RF(-self.n, self.d)

    def __sub__(self, o):
        return self + (-_R(o))

    def __rsub__(self, o):
        return _R(o) - self

    def __mul__(self, o):
        o = _R(o)
        return RF(self.n * o.n, self.d * o.d)

    __rmul__ = __mul__

    def __truediv__(self, o):
        o = _R(o)
        if o.n.is_zero():
            raise ZeroDivisionError('division by the zero rational function')
        return RF(self.n * o.d, self.d * o.n)

    def __rtruediv__(self, o):
        return _R(o) / self

    def __pow__(self, k):
        if k >= 0:
            return RF(self.n ** k, self.d ** k)
        return RF(self.d ** (-k), self.n ** (-k))

    def equals(self, o):
        o = _R(o)
        return (self.n * o.d - o.n * self.d).is_zero()

    def subs(self, env):
        return RF(self.n.subs(env), self.d.subs(env))

    def at(self, env):
        """Exact value at a rational point (all variables bound)."""
        dn = self.d.subs(env).value()
        if dn == 0:
            raise ZeroDivisionError('pole')
        return self.n.subs(env).value() / dn


def _R(x):
    return x if isinstance(x, RF) else RF(_P(x))


# ------------------------------------------------------ tiny expression parser
_TOK = re.compile(r'\s*(?:(\d+)|([A-Za-z](?:_\d+)?)|(.))')


def _tokens(s):
    out = []
    pos = 0
    s = s.strip()
    while pos < len(s):
        m = _TOK.match(s, pos)
        if not m:
            raise ValueError('cannot tokenize %r at %d' % (s, pos))
        if m.group(1):
            out.append(('num', int(m.group(1))))
        elif m.group(2):
            out.append(('id', m.group(2)))
        elif m.group(3):
            if not m.group(3).isspace():
                out.append(('op', m.group(3)))
        pos = m.end()
    return out


def parse_rf(s, allowed):
    """Parse an arithmetic expression into an RF over variables in `allowed`.
    Grammar: + - * / ^ (integer exponents), parentheses, implicit multiplication
    ('qt' = q*t, '2(1+q)', '(a)(b)')."""
    toks = _tokens(s)
    i = [0]

    def peek():
        return toks[i[0]] if i[0] < len(toks) else ('end', None)

    def take():
        tk = peek()
        i[0] += 1
        return tk

    def expr():
        v = term()
        while peek() in (('op', '+'), ('op', '-')):
            op = take()[1]
            w = term()
            v = v + w if op == '+' else v - w
        return v

    def starts_factor(tk):
        return tk[0] in ('num', 'id') or tk == ('op', '(')

    def term():
        v = unary()
        while True:
            tk = peek()
            if tk == ('op', '*'):
                take()
                v = v * unary()
            elif tk == ('op', '/'):
                take()
                v = v / unary()
            elif starts_factor(tk):
                v = v * power()
            else:
                return v

    def unary():
        if peek() == ('op', '-'):
            take()
            return -unary()
        if peek() == ('op', '+'):
            take()
            return unary()
        return power()

    def int_exponent():
        neg = False
        if peek() == ('op', '('):
            take()
            e = int_exponent()
            if take() != ('op', ')'):
                raise ValueError('bad exponent')
            return e
        if peek() == ('op', '-'):
            take()
            neg = True
        tk = take()
        if tk[0] != 'num':
            raise ValueError('non-integer exponent in %r' % s)
        return -tk[1] if neg else tk[1]

    def power():
        v = atom()
        if peek() == ('op', '^'):
            take()
            v = v ** int_exponent()
        return v

    def atom():
        tk = take()
        if tk[0] == 'num':
            return RF(Poly.const(tk[1]))
        if tk[0] == 'id':
            if tk[1] not in allowed:
                raise ValueError('unexpected symbol %r in %r' % (tk[1], s))
            return RF(Poly.var(tk[1]))
        if tk == ('op', '('):
            v = expr()
            if take() != ('op', ')'):
                raise ValueError('unbalanced parentheses in %r' % s)
            return v
        raise ValueError('unexpected token %r in %r' % (tk, s))

    v = expr()
    if peek()[0] != 'end':
        raise ValueError('trailing input in %r: %r' % (s, toks[i[0]:]))
    return v


# --------------------------------------------- univariate Sturm, exact
def _uni(p, v):
    """Poly in one variable -> coefficient list (low to high) of Fractions."""
    for m in p.t:
        assert all(x == v for x, _ in m), 'not univariate in %s: %r' % (v, p)
    deg = p.deg_in(v)
    return [p.coeff_in(v, e).value() if not p.coeff_in(v, e).is_zero() else Fraction(0)
            for e in range(deg + 1)]


def _trim(a):
    a = list(a)
    while a and a[-1] == 0:
        a.pop()
    return a


def _ev(a, x):
    s = Fraction(0)
    for c in reversed(a):
        s = s * x + c
    return s


def _divmod(a, b):
    a, b = _trim(a), _trim(b)
    q = [Fraction(0)] * max(len(a) - len(b) + 1, 1)
    r = list(a)
    while len(_trim(r)) >= len(b) and _trim(r):
        r = _trim(r)
        k = len(r) - len(b)
        f = r[-1] / b[-1]
        q[k] = f
        for j in range(len(b)):
            r[k + j] -= f * b[j]
        r = _trim(r)
    return _trim(q), _trim(r)


def _deriv(a):
    return _trim([a[i] * i for i in range(1, len(a))])


def _sturm_count(a, lo, hi):
    """Number of distinct real roots in (lo, hi); lo, hi must not be roots."""
    seq = [_trim(a), _deriv(a)]
    while seq[-1]:
        _, r = _divmod(seq[-2], seq[-1])
        seq.append([-c for c in r] if r else [])
    seq = [s for s in seq if s]

    def var(x):
        signs = [v for v in (_ev(s, x) for s in seq) if v != 0]
        return sum(1 for u, w in zip(signs, signs[1:]) if (u > 0) != (w > 0))
    return var(lo) - var(hi)


def positive_on_open_unit(p, v):
    """Decide exactly that the univariate polynomial p is > 0 on (0,1)."""
    a = _uni(p, v)
    if not _trim(a):
        return False, 'zero polynomial'
    orig = list(a)
    # p = (r-0)^j (r-1)^k p' and (r-e) has no root in (0,1): p has a root in (0,1)
    # iff p' does; the sign on (0,1) is then the sign of p itself at 1/2.
    for e in (Fraction(0), Fraction(1)):          # divide out endpoint roots
        while _ev(a, e) == 0 and len(_trim(a)) > 1:
            qq, rr = _divmod(a, [-e, Fraction(1)])
            assert not rr
            a = qq
    roots = _sturm_count(a, Fraction(0), Fraction(1))
    mid = _ev(orig, Fraction(1, 2))
    return roots == 0 and mid > 0, '%d roots in (0,1) after removing endpoint roots, value %s at 1/2' % (roots, mid)


# ------------------------------------------- Macdonald operator, two variables
X1, X2, Q, T = Poly.var('x1'), Poly.var('x2'), Poly.var('q'), Poly.var('t')


def shift_q(p, v):
    """T_{q,v}: v -> q v."""
    out = {}
    for m, c in p.t.items():
        e = dict(m).get(v, 0)
        mm = Poly._mono_mul(m, (('q', e),)) if e else m
        out[mm] = out.get(mm, 0) + c
    return Poly(out)


def div_x1_minus_x2(p):
    """Exact division by (x1 - x2); raises if the remainder is nonzero."""
    K = p.deg_in('x1')
    a = [p.coeff_in('x1', k) for k in range(K + 1)]
    b = [None] * K
    carry = Poly()
    for k in range(K, 0, -1):
        carry = a[k] + X2 * carry if k < K else a[K]
        b[k - 1] = carry
    rem = a[0] + X2 * b[0] if K > 0 else a[0]
    if not rem.is_zero():
        raise ArithmeticError('not divisible by x1-x2')
    out = Poly()
    for k in range(K):
        out = out + b[k] * (X1 ** k)
    return out


def macdonald_D(f):
    """Macdonald operator D_2^1 on a symmetric polynomial f(x1,x2)."""
    num = (T * X1 - X2) * shift_q(f, 'x1') - (T * X2 - X1) * shift_q(f, 'x2')
    return div_x1_minus_x2(num)


def mono_sym(a, b):
    """Monomial symmetric polynomial m_(a,b) in two variables."""
    if a == b:
        return (X1 * X2) ** a
    return (X1 ** a) * (X2 ** b) + (X1 ** b) * (X2 ** a)


def coef_of_xmono(p, ea, eb):
    return p.coeff_in('x1', ea).coeff_in('x2', eb)


def derive_degree_two():
    """P_(1,1) and P_(2,0) as triangular eigenfunctions of D.  Returns
    (A as RF, alpha, beta, gamma, checks)."""
    checks = []
    m2, m11 = mono_sym(2, 0), mono_sym(1, 1)
    Dm2, Dm11 = macdonald_D(m2), macdonald_D(m11)
    alpha = coef_of_xmono(Dm2, 2, 0)
    beta = coef_of_xmono(Dm2, 1, 1)
    gamma = coef_of_xmono(Dm11, 1, 1)
    ok_shape = (coef_of_xmono(Dm2, 0, 2) == alpha
                and (Dm2 - alpha * m2 - beta * m11).is_zero()
                and (Dm11 - gamma * m11).is_zero())
    checks.append({'name': 'operator preserves the degree-2 symmetric space; D m_11 = gamma m_11',
                   'ok': ok_shape,
                   'detail': 'D m_2 = alpha m_2 + beta m_11, D m_11 = gamma m_11 exactly; '
                             'alpha=%r, beta=%r, gamma=%r' % (alpha, beta, gamma)})
    # the operator's diagonal must be the known eigenvalue sum_i q^{lam_i} t^{n-i}
    ev = (alpha == Q ** 2 * T + 1) and (gamma == Q * T + Q)
    checks.append({'name': 'operator diagonal = q^{l1} t + q^{l2} (implementation sanity)',
                   'ok': ev, 'detail': 'alpha = q^2 t + 1, gamma = q t + q'})
    distinct = not (alpha - gamma).is_zero()
    checks.append({'name': 'eigenvalues of (2,0) and (1,1) distinct as polynomials',
                   'ok': distinct, 'detail': 'alpha - gamma = %r' % (alpha - gamma)})
    # P_(2,0) = m_2 + A m_11 with D P = alpha P  =>  A (alpha - gamma) = beta
    A = RF(beta, alpha - gamma)
    return A, checks


def decide_from(cert):
    checks = []
    fail = []
    unread = []

    def add(name, ok, detail, needed=True):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok and needed:
            fail.append(name)

    def unreadable(name, err, needed=True):
        checks.append({'name': name, 'ok': False, 'detail': 'could not read: %r' % (err,)})
        if needed:
            unread.append(name)

    A, opchecks = derive_degree_two()
    for c in opchecks:
        add(c['name'], c['ok'], c['detail'])

    r = RF(Poly.var('r'))
    tq = RF(T)
    # ------------- the certificate's coefficient A (compare, never trust)
    try:
        s = cert['macdonald_coefficient']
        mA = re.match(r'\s*A\s*=\s*([^,]+)', s)
        A_cert = parse_rf(mA.group(1), {'q', 't'})
        add('certificate coefficient A equals the operator-derived A',
            A_cert.equals(A), 'certificate: %s; derived: (%r)/(%r)' % (mA.group(1).strip(), A.n, A.d))
    except Exception as e:  # noqa: BLE001
        unreadable('certificate coefficient A parses', e)

    # ------------- Schur specialisation: at q=t, P_(2,0) = s_(2) = x1^2+x1x2+x2^2
    A_qt = A.subs({'q': T})
    s2 = RF(div_x1_minus_x2(X1 ** 3 - X2 ** 3))          # bialternant (x1^3-x2^3)/(x1-x2)
    s11 = RF(div_x1_minus_x2(X1 ** 2 * X2 - X1 * X2 ** 2))  # bialternant for (1,1)
    P20_qt = RF(mono_sym(2, 0)) + A_qt * RF(mono_sym(1, 1))
    add('at q=t the operator eigenfunctions are the Schur polynomials (bialternants)',
        P20_qt.equals(s2) and s11.equals(RF(mono_sym(1, 1))),
        'A(q=t) = 1: P_(2,0) = (x1^3-x2^3)/(x1-x2), P_(1,1) = (x1^2 x2 - x1 x2^2)/(x1-x2) = x1 x2')

    # ------------- general P, Omega at x=(1,1), principal specialisation t^delta=(t,1)
    def P20(x1, x2):
        return x1 * x1 + x2 * x2 + A * x1 * x2

    def P11(x1, x2):
        return x1 * x2

    one = RF(Poly.const(1))
    Om20 = P20(one, one) / P20(tq, one)
    Om11 = P11(one, one) / P11(tq, one)
    gap = Om11 - Om20

    # ------------- the witness: n=2, q=t=r, a=1, index (1,0) -> x=(1,1)
    n = 2
    nu = (1, 0)
    lam, mu = (2, 0), (1, 1)
    # lattice point: x_i = a q^{-nu_i} t^{n-i}; with q=t=r the exponent of r is -nu_i+(n-i)
    xs_exp = [-nu[i] + (n - 1 - i) for i in range(n)]
    add('x=(1,1) is a lattice point of L_2^{r,r,1} (index nu=(1,0), a=1)',
        nu[0] >= nu[1] and xs_exp == [0, 0],
        'x_i = r^{-nu_i} r^{n-i}: exponents %r (both 0), nu integer and nonincreasing' % xs_exp)
    dom = (sum(lam) == sum(mu) and all(sum(lam[:k + 1]) >= sum(mu[:k + 1]) for k in range(n))
           and all(lam[k] >= lam[k + 1] for k in range(n - 1))
           and all(mu[k] >= mu[k + 1] for k in range(n - 1)))
    add('lambda=(2,0) dominates mu=(1,1) (same size, partial sums)', dom,
        'partial sums (2,2) >= (1,2)')

    Om20_r, Om11_r = Om20.subs({'q': Poly.var('r'), 't': Poly.var('r')}), \
        Om11.subs({'q': Poly.var('r'), 't': Poly.var('r')})
    add('Omega_(2,0)(1,1;r,r) = 3/(1+r+r^2) and Omega_(1,1)(1,1;r,r) = 1/r (derived)',
        Om20_r.equals(RF(3) / (1 + r + r * r)) and Om11_r.equals(one / r),
        'from the operator-derived P at q=t=r')
    gap_r = Om11_r - Om20_r
    fact = RF((1 - Poly.var('r')) ** 2) / (r * (1 + r + r * r))
    add('gap identity: Omega_(1,1) - Omega_(2,0) = (1-r)^2 / (r(1+r+r^2)) at q=t=r',
        gap_r.equals(fact),
        'rational-function identity in r (cross-multiplied polynomials equal)')
    # sign on (0,1), decided exactly: numerator and denominator of the gap have no
    # root in the open interval (Sturm count after dividing out endpoint roots) and
    # are positive at r=1/2.
    pos_num, dn = positive_on_open_unit(gap_r.n, 'r')
    pos_den, dd = positive_on_open_unit(gap_r.d, 'r')
    add('gap strictly positive for every r in (0,1) (exact Sturm root count, numerator and denominator)',
        pos_num and pos_den, 'numerator: %s; denominator: %s' % (dn, dd))

    # ------------- the certificate's reversal / identity strings
    try:
        mrev = re.match(r'\s*(.+?)\s*<\s*(.+?)\s+for all\s+0\s*<\s*r\s*<\s*1\s*$', cert['reversal'])
        L, Rr = parse_rf(mrev.group(1), {'r'}), parse_rf(mrev.group(2), {'r'})
        add('certificate reversal sides equal the derived Omegas',
            L.equals(Om20_r) and Rr.equals(Om11_r), cert['reversal'])
    except Exception as e:  # noqa: BLE001
        unreadable('certificate reversal parses', e)
    try:
        lhs, rhs = cert['identity'].split('=')
        Li, Ri = parse_rf(lhs, {'r'}), parse_rf(rhs, {'r'})
        num_gap = (1 + r + r * r) - 3 * r   # numerator of 1/r - 3/(1+r+r^2) over r(1+r+r^2)
        add('certificate identity holds and is the gap numerator',
            Li.equals(Ri) and Li.equals(num_gap), cert['identity'])
    except Exception as e:  # noqa: BLE001
        unreadable('certificate identity parses', e)

    # ------------- sample r values: exact strict reversal at each
    for sr in cert.get('sample_r', []):
        try:
            rv = Fraction(sr)
        except Exception as e:  # noqa: BLE001
            unreadable('sample r=%s' % sr, e)
            continue
        if not 0 < rv < 1:
            add('sample r=%s lies in (0,1), where the claim is made' % sr, False,
                'q=t=r must lie in (0,1); at r=1 both sides equal 1 and nothing is reversed')
            continue
        try:
            a20 = Om20_r.at({'r': rv})
            a11 = Om11_r.at({'r': rv})
            add('sample r=%s: 0<r<1 and Omega_(2,0)=%s < Omega_(1,1)=%s' % (sr, a20, a11),
                a20 < a11, 'exact rationals')
        except Exception as e:  # noqa: BLE001
            unreadable('sample r=%s' % sr, e)

    # ------------- general (q,t) gap (appendix) -- compared against the derivation
    try:
        mg = re.match(r'\s*Omega_\((\d+),(\d+)\)\(1\^2\)\s*-\s*Omega_\((\d+),(\d+)\)\(1\^2\)\s*=\s*(.+)$',
                      cert['general_gap'])
        la = (int(mg.group(1)), int(mg.group(2)))
        lb = (int(mg.group(3)), int(mg.group(4)))
        G = parse_rf(mg.group(5), {'q', 't'})
        add('general gap: Omega_(1,1)(1,1) - Omega_(2,0)(1,1) equals the certificate formula '
            'as a rational function of (q,t)',
            la == (1, 1) and lb == (2, 0) and G.equals(gap), cert['general_gap'])
        add('general gap: 1+t^2+At = (1+t)(1-qt^2)/(1-qt) (the factorisation that shows the sign)',
            (1 + tq * tq + A * tq).equals(RF((1 + T) * (1 - Q * T * T), 1 - Q * T)),
            'each of (1-t)^2, 1-qt, t, 1+t, 1-qt^2 is >0 on (0,1)^2', needed=False)
    except Exception as e:  # noqa: BLE001
        unreadable('general gap parses', e)

    # ------------- lattice membership of 1^n for t = q^k, symbolically in (k,n,i)
    try:
        ml = re.search(r'mu_i\s*=\s*(.+)$', cert['lattice_membership'])
        muexp = parse_rf(ml.group(1), {'k', 'n', 'i'})
        k_, n_, i_ = RF(Poly.var('k')), RF(Poly.var('n')), RF(Poly.var('i'))
        # x_i = a q^{-mu_i} t^{n-i} = q^{-mu_i + k(n-i)} with a=1, t=q^k
        e_q = -muexp + k_ * (n_ - i_)
        step = muexp - muexp.subs({'i': Poly.var('i') + 1})
        add('1^n in L_n^{q,q^k,1}: q-exponent -mu_i + k(n-i) is identically 0, '
            'and mu_i - mu_{i+1} = k > 0',
            e_q.equals(RF(0)) and step.equals(k_), cert['lattice_membership'])
    except Exception as e:  # noqa: BLE001
        unreadable('lattice membership parses', e)

    for smp in cert.get('lattice_samples', []):
        try:
            ms = re.match(r'\s*q\s*=\s*([\d/]+)\s*,\s*t\s*=\s*q\^(\d+)\s*=\s*([\d/]+)\s*$', smp)
            qv, kv, tv = Fraction(ms.group(1)), int(ms.group(2)), Fraction(ms.group(3))
            g = gap.at({'q': qv, 't': tv})
            a20 = Om20.at({'q': qv, 't': tv})
            a11 = Om11.at({'q': qv, 't': tv})
            add('lattice sample %s: t=q^k, q,t in (0,1), Omega_(2,0)=%s < Omega_(1,1)=%s' % (smp, a20, a11),
                tv == qv ** kv and kv >= 1 and 0 < qv < 1 and 0 < tv < 1 and g > 0 and a20 < a11,
                'gap %s' % g)
        except Exception as e:  # noqa: BLE001
            unreadable('lattice sample %r' % smp, e)

    # ------------- determinant shift instance N=2, lambda=(1,1), c=1
    y1, y2 = RF(Poly.var('y1')), RF(Poly.var('y2'))
    Om11_y = P11(y1, y2) / P11(tq, one)
    shift_ok = Om11_y.equals((y1 * y2 / tq) * one)      # Omega_(0,0) = 1
    naive_false = not Om11_y.equals(y1 * y2)
    add('determinant shift at N=2, lambda=(1,1): Omega = y1 y2 / t; the naive shift y1 y2 is false',
        shift_ok and naive_false, cert.get('determinant_shift', ''), needed=False)

    # ------------- scope: the 1^n normalisation
    try:
        ms = re.match(r'\s*W_\(2,0\)\(x\)\s*-\s*W_\(1,1\)\(x\)\s*=\s*(.+?)\s*>=\s*0', cert['scope'])
        Wrhs = parse_rf(ms.group(1), {'x_1', 'x_2', 'A'})
        a_ = RF(Poly.var('A'))
        x1_, x2_ = RF(Poly.var('x_1')), RF(Poly.var('x_2'))
        W20 = (x1_ * x1_ + x2_ * x2_ + a_ * x1_ * x2_) / (2 + a_)   # P_(2,0)(1,1) = 2 + A
        W11 = x1_ * x2_                                            # P_(1,1)(1,1) = 1
        add('scope: W_(2,0) - W_(1,1) = (x1-x2)^2/(2+A) (identity in x1, x2, A); 2+A>0 on (0,1)^2',
            (W20 - W11).equals(Wrhs), cert['scope'], needed=False)
    except Exception as e:  # noqa: BLE001
        unreadable('scope parses', e, needed=False)

    claim = ('McSwiggen-Sahi Theorem 2.1 (Schur-convexity of lambda -> Omega_lambda on the lattice) '
             'fails: with n=2, q=t=r in (0,1), a=1 and the lattice point x=(1,1), lambda=(2,0) '
             'dominates mu=(1,1) yet Omega_(2,0)(x)=3/(1+r+r^2) < 1/r=Omega_(1,1)(x).')
    if fail:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks,
                'why': 'failed: ' + '; '.join(fail)}
    if unread:
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks,
                'why': 'certificate entries could not be read: ' + '; '.join(unread)}
    return {'verdict': 'CERTIFIED', 'claim': claim, 'checks': checks, 'why': ''}


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
    """Move one sample point onto the edge r=1 of the parameter interval: there
    3/(1+r+r^2) = 1 = 1/r, so the strict reversal is an equality, and r=1 is
    outside (0,1).  Must not be CERTIFIED."""
    c = json.loads(json.dumps(cert))
    c['sample_r'] = list(c['sample_r'])
    c['sample_r'][-1] = '1'
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
    if res['why']:
        print('why:', res['why'])
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
        cert = json.load(f)
    fres = decide_cert(forge(cert))
    print('forge ->', fres['verdict'], '|', fres['why'])
    assert fres['verdict'] != 'CERTIFIED'
