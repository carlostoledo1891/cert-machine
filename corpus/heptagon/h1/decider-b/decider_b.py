#!/usr/bin/env python3
"""
DECIDER B (clean room) for stage H1 and H4(i) of the heptagon pre-registration.

System: Python 3 standard library only -- fractions.Fraction and a sparse multivariate
polynomial class written here. No sympy, no third-party checker, nothing read from any
other decider. Everything decided is a polynomial identity in a quotient ring whose
relations have pairwise coprime leading monomials (y_j^2, c^2), so the normal form is
canonical and "normal form == 0" is a decision, not a test.

Source of every statement: Palvolgyi, "A cyclic non-Ramsey heptagon", arXiv:2609.23327v1,
pinned TeX  spherical_non_ramsey.tex  (sha256 681c953f...), line numbers given per item.
"""
import json, os, sys, time
MUTANT = os.environ.get("MUTANT", "")   # self-check: "weight" | "offcircle" | "generic-weight" (outputs go to mutants/)
from fractions import Fraction as Fr
from itertools import combinations

# ----------------------------------------------------------------------------------------
# Sparse multivariate polynomials over Q.  A monomial is a sorted tuple of (var, exp).
# ----------------------------------------------------------------------------------------
RELS = {}   # var -> Poly replacement for var^2  (set per section)


def _mono_mul(m1, m2):
    d = dict(m1)
    for v, e in m2:
        d[v] = d.get(v, 0) + e
    return tuple(sorted(d.items()))


class Poly:
    __slots__ = ("t",)

    def __init__(self, t=None):
        self.t = {} if t is None else {m: c for m, c in t.items() if c != 0}

    @staticmethod
    def const(c):
        c = Fr(c)
        return Poly({(): c}) if c != 0 else Poly()

    @staticmethod
    def var(v):
        return Poly({((v, 1),): Fr(1)})

    def copy(self):
        return Poly(dict(self.t))

    def __add__(self, o):
        o = _P(o)
        d = dict(self.t)
        for m, c in o.t.items():
            d[m] = d.get(m, 0) + c
        return Poly(d)

    __radd__ = __add__

    def __neg__(self):
        return Poly({m: -c for m, c in self.t.items()})

    def __sub__(self, o):
        return self + (-_P(o))

    def __rsub__(self, o):
        return _P(o) + (-self)

    def __mul__(self, o):
        o = _P(o)
        d = {}
        for m1, c1 in self.t.items():
            for m2, c2 in o.t.items():
                m = _mono_mul(m1, m2)
                d[m] = d.get(m, 0) + c1 * c2
        return Poly(d).nf()

    __rmul__ = __mul__

    def __pow__(self, n):
        r = Poly.const(1)
        for _ in range(n):
            r = r * self
        return r

    def nf(self):
        """Normal form modulo RELS: every var in RELS reduced to exponent <= 1."""
        if not RELS:
            return self
        changed = True
        cur = self
        while changed:
            changed = False
            d = {}
            for m, c in cur.t.items():
                hit = None
                for v, e in m:
                    if v in RELS and e >= 2:
                        hit = (v, e)
                        break
                if hit is None:
                    d[m] = d.get(m, 0) + c
                    continue
                changed = True
                v, e = hit
                q, rem = divmod(e, 2)
                rest = tuple((vv, ee) for vv, ee in m if vv != v)
                if rem:
                    rest = _mono_mul(rest, ((v, 1),))
                # multiply out  c * rest * RELS[v]^q   (RELS[v] contains no RELS variable)
                rep = Poly.const(1)
                for _ in range(q):
                    rep = Poly({_mono_mul(mm, m2): cc * c2 for mm, cc in rep.t.items() for m2, c2 in RELS[v].t.items()})
                for mm, cc in rep.t.items():
                    k = _mono_mul(rest, mm)
                    d[k] = d.get(k, 0) + c * cc
            cur = Poly(d)
        return cur

    def is_zero(self):
        return len(self.nf().t) == 0

    def __eq__(self, o):
        return (self - _P(o)).is_zero()

    def vars(self):
        s = set()
        for m in self.t:
            for v, _ in m:
                s.add(v)
        return s

    def degree_in(self, v):
        d = -1
        for m in self.t:
            for vv, e in m:
                if vv == v:
                    d = max(d, e)
        return max(d, 0) if self.t else -1

    def coeffs_in(self, v):
        """dict exp -> Poly (coefficient polys free of v)."""
        out = {}
        for m, c in self.t.items():
            e = 0
            rest = []
            for vv, ee in m:
                if vv == v:
                    e = ee
                else:
                    rest.append((vv, ee))
            out.setdefault(e, Poly())
            out[e] = out[e] + Poly({tuple(rest): c})
        return out

    def subs(self, v, p):
        """substitute polynomial p for variable v."""
        out = Poly()
        for e, co in self.coeffs_in(v).items():
            out = out + co * (p ** e)
        return out

    def deriv(self, v):
        """formal partial derivative d/dv (used only for p'(T), rational functions of T over Q)."""
        d = {}
        for m, c in self.t.items():
            for vv, ee in m:
                if vv == v:
                    rest = [(a, b) for a, b in m if a != v]
                    if ee > 1:
                        rest.append((v, ee - 1))
                    k = tuple(sorted(rest))
                    d[k] = d.get(k, 0) + c * ee
        return Poly(d)

    def __str__(self):
        if not self.t:
            return "0"
        parts = []
        for m, c in sorted(self.t.items(), key=lambda kv: (-sum(e for _, e in kv[0]), kv[0])):
            mon = "*".join(f"{v}^{e}" if e > 1 else v for v, e in m)
            if mon == "":
                parts.append(str(c))
            elif c == 1:
                parts.append(mon)
            elif c == -1:
                parts.append("-" + mon)
            else:
                parts.append(f"{c}*{mon}")
        s = " + ".join(parts)
        return s.replace("+ -", "- ")

    __repr__ = __str__


def _P(x):
    return x if isinstance(x, Poly) else Poly.const(x)


V = Poly.var
C = Poly.const


# ----------------------------------------------------------------------------------------
# Rational elements  num/den  with den a univariate polynomial over Q (in r, or in T).
# Equality is decided by cross-multiplication; no gcd is needed for a decision.
# ----------------------------------------------------------------------------------------
class RF:
    __slots__ = ("n", "d")

    def __init__(self, n, d=None):
        self.n = _P(n)
        self.d = C(1) if d is None else _P(d)
        if self.d.is_zero():
            raise ZeroDivisionError

    def __add__(self, o):
        o = _R(o)
        return RF(self.n * o.d + o.n * self.d, self.d * o.d)

    __radd__ = __add__

    def __neg__(self):
        return RF(-self.n, self.d)

    def __sub__(self, o):
        return self + (-_R(o))

    def __rsub__(self, o):
        return _R(o) + (-self)

    def __mul__(self, o):
        o = _R(o)
        return RF(self.n * o.n, self.d * o.d)

    __rmul__ = __mul__

    def __truediv__(self, o):
        o = _R(o)
        if len(o.n.vars() - {"r", "T"}) != 0 or len(o.n.vars()) > 1:
            raise ValueError("division only by univariate polynomials over Q: " + str(o.n))
        return RF(self.n * o.d, self.d * o.n)

    def __pow__(self, k):
        return RF(self.n ** k, self.d ** k)

    def is_zero(self):
        return self.n.is_zero()

    def __eq__(self, o):
        return (self - _R(o)).is_zero()

    def __str__(self):
        return f"({self.n}) / ({self.d})"


def _R(x):
    return x if isinstance(x, RF) else RF(_P(x))


# univariate helpers (polys in ONE variable with Q coefficients)
def _ucoeffs(p, v):
    cs = p.coeffs_in(v)
    deg = max(cs) if cs else -1
    out = [Fr(0)] * (deg + 1)
    for e, co in cs.items():
        assert co.vars() == set(), "not univariate"
        out[e] = co.t.get((), Fr(0))
    return out


def _ufrom(cs, v):
    return Poly({((v, e),) if e else (): c for e, c in enumerate(cs) if c != 0})


def _udivmod(a, b):
    a = list(a)
    while a and a[-1] == 0:
        a.pop()
    b = list(b)
    while b and b[-1] == 0:
        b.pop()
    if len(a) < len(b):
        return [Fr(0)], a
    q = [Fr(0)] * (len(a) - len(b) + 1)
    while len(a) >= len(b) and a:
        k = len(a) - len(b)
        f = a[-1] / b[-1]
        q[k] = f
        for i, bc in enumerate(b):
            a[i + k] -= f * bc
        while a and a[-1] == 0:
            a.pop()
    return q, a


def _ugcd(a, b):
    while b and any(b):
        _, rem = _udivmod(a, b)
        a, b = b, rem
    return a


def reduce_univariate(rf, v):
    """num/den both univariate in v: divide by gcd, make den monic. Returns (num, den) polys."""
    n, d = _ucoeffs(rf.n, v), _ucoeffs(rf.d, v)
    g = _ugcd(n, d)
    n, _ = _udivmod(n, g)
    d, _ = _udivmod(d, g)
    lc = d[-1]
    n = [c / lc for c in n]
    d = [c / lc for c in d]
    return _ufrom(n, v), _ufrom(d, v)


def exact_div_univariate(num, den, v):
    """num: multivariate; den: univariate in v over Q. Exact division as polynomials in v with
    polynomial coefficients. Raises if the remainder is nonzero."""
    dcs = _ucoeffs(den, v)
    while dcs and dcs[-1] == 0:
        dcs.pop()
    cs = num.coeffs_in(v)
    deg = max(cs) if cs else -1
    a = [cs.get(e, Poly()) for e in range(deg + 1)]
    q = {}
    db = len(dcs) - 1
    for k in range(deg - db, -1, -1):
        f = a[k + db] * (1 / dcs[-1])
        q[k] = f
        for i, bc in enumerate(dcs):
            a[k + i] = a[k + i] - f * bc
    for e, rem in enumerate(a):
        if not rem.is_zero():
            raise ArithmeticError(f"non-exact division: remainder coefficient of {v}^{e} = {rem}")
    out = Poly()
    for k, co in q.items():
        out = out + co * (V(v) ** k)
    return out


# ----------------------------------------------------------------------------------------
# Derivation D on the ring, from the rules on generators (Leibniz on monomials).
# ----------------------------------------------------------------------------------------
def make_D(rules):
    """rules: var -> RF value of D(var). D on a Poly via Leibniz; on an RF via the quotient rule."""

    def D_poly(p):
        out = RF(C(0))
        for m, c in p.t.items():
            for v, e in m:
                if v not in rules:
                    raise KeyError(f"D({v}) is not defined")
                rest = [(a, b) for a, b in m if a != v]
                if e > 1:
                    rest.append((v, e - 1))
                out = out + RF(Poly({tuple(sorted(rest)): c * e})) * rules[v]
        return out

    def D(x):
        if isinstance(x, Poly):
            return D_poly(x)
        num = D_poly(x.n) * RF(x.d) - RF(x.n) * D_poly(x.d)   # quotient rule
        return RF(num.n, num.d * x.d * x.d)

    return D


# ----------------------------------------------------------------------------------------
# record keeping
# ----------------------------------------------------------------------------------------
RESULTS = []
LOG = []


def log(s=""):
    print(s)
    LOG.append(s)


def decide(name, lhs, rhs, where, note="", expect_equal=True, extra=None):
    """Decide lhs == rhs exactly. Records lhs/rhs strings and verdict."""
    if isinstance(lhs, (Poly, RF)) or isinstance(rhs, (Poly, RF)):
        L, Rr = _R(lhs), _R(rhs)
        ok = (L == Rr)
        ls, rs = str(lhs), str(rhs)
    else:
        ok = (lhs == rhs)
        ls, rs = str(lhs), str(rhs)
    verdict = "CERTIFIED" if ok == expect_equal else "REFUTED"
    def cap(sv, obj):
        if len(sv) <= 1500:
            return sv
        nt = len(obj.n.t) if isinstance(obj, RF) else (len(obj.t) if isinstance(obj, Poly) else "?")
        return sv[:1500] + f" ... [truncated: {len(sv)} chars, {nt} monomials in the numerator; the run reproduces it]"
    ls, rs = cap(ls, lhs), cap(rs, rhs)
    row = {"name": name, "lhs": ls, "rhs": rs, "verdict": verdict, "paper": where}
    if note:
        row["note"] = note
    if extra:
        row.update(extra)
    RESULTS.append(row)
    log(f"[{verdict}] {name}  ({where})")
    return ok


def sect(title):
    log()
    log("=" * 100)
    log(title)
    log("=" * 100)


def vec(*xs):
    return [_R(x) for x in xs]


def vadd(a, b):
    return [x + y for x, y in zip(a, b)]


def matvec(A, v):
    return [sum((A[i][j] * v[j] for j in range(len(v))), RF(C(0))) for i in range(len(A))]


def dot(a, b):
    return sum((x * y for x, y in zip(a, b)), RF(C(0)))


def outer(a, b):
    return [[a[i] * b[j] for j in range(len(b))] for i in range(len(a))]


def matstr(M):
    return "[" + ", ".join("[" + ", ".join(str(x) for x in row) + "]" for row in M) + "]"


def mat_is_zero(M):
    return all(x.is_zero() for row in M for x in row)


def mat_is_symmetric(M):
    return all((M[i][j] - M[j][i]).is_zero() for i in range(len(M)) for j in range(len(M)))


# (the invariance block is written as a separate function so that it is reused for generic points)
def invariance_block(tag, lam, P, Dp, D, A, DA, a, w, expected_energy, where, finish):
    """Decide sum lambda ||D(a + A p)||^2 == expected, directly and by the paper's five groups.
    finish(x) maps a per-point-summed RF/Poly quantity to its decided value (identity for the
    heptagon; the interpolation sum for the generic set)."""
    n = len(A)
    # A^T A = I
    AtA = [[sum((A[k][i] * A[k][j] for k in range(n)), RF(C(0))) for j in range(2)] for i in range(2)]
    decide(f"{tag}: A^T A = I", mat_is_zero([[AtA[i][j] - (1 if i == j else 0) for j in range(2)] for i in range(2)]), True, where)
    # D(A) computed by D on entries equals the supplied DA
    DA_calc = [[D(A[i][j].n) if A[i][j].d == C(1) else None for j in range(2)] for i in range(n)]
    decide(f"{tag}: D(A) entrywise", mat_is_zero([[DA_calc[i][j] - DA[i][j] for j in range(2)] for i in range(n)]), True, where)
    # skew: D(A)^T A + A^T D(A) = 0
    S = [[sum((DA[k][i] * A[k][j] + A[k][i] * DA[k][j] for k in range(n)), RF(C(0))) for j in range(2)] for i in range(2)]
    decide(f"{tag}: D(A)^T A + A^T D(A) = 0 (D(A)^T A skew)", mat_is_zero(S), True, ".tex 282-284")

    m = len(P)
    # direct: D applied to the coordinates of p' = a + A p
    total = RF(C(0))
    groups = {k: RF(C(0)) for k in ("T0", "T1", "T2", "T3", "T4")}
    per_point_direct = []
    for i in range(m):
        pprime = vadd(a, matvec(A, P[i]))
        Dpp = [D(x) for x in pprime]          # the derivation applied directly, no product rule assumed
        # the paper's decomposition D(p') = D(t) + D(A) p + A D(p)  (.tex 121-123)
        Dpp_rule = vadd(vadd(w, matvec(DA, P[i])), matvec(A, Dp[i]))
        if i == 0:
            decide(f"{tag}: D(p') = D(t) + D(A)p + A D(p) (product rule, point 0)",
                   all((Dpp[k] - Dpp_rule[k]).is_zero() for k in range(n)), True, ".tex 121-123")
        e = dot(Dpp, Dpp)
        per_point_direct.append(e)
        total = total + lam[i] * e
        DAp, ADp = matvec(DA, P[i]), matvec(A, Dp[i])
        groups["T0"] = groups["T0"] + lam[i] * dot(w, w)
        groups["T1"] = groups["T1"] + lam[i] * 2 * dot(w, vadd(DAp, ADp))
        groups["T2"] = groups["T2"] + lam[i] * dot(DAp, DAp)
        groups["T3"] = groups["T3"] + lam[i] * 2 * dot(DAp, ADp)
        groups["T4"] = groups["T4"] + lam[i] * dot(ADp, ADp)
    total_f = finish(total)
    G = {k: finish(v) for k, v in groups.items()}
    decide(f"{tag}: sum of the five groups = direct sum lambda ||D(p')||^2", sum(G.values(), RF(C(0))) if isinstance(total_f, RF) else sum(G.values(), Poly()), total_f, ".tex 124-136")
    decide(f"{tag}: T0 = ||D(t)||^2 * sum lambda = 0   [killed by the zeroth moment]", G["T0"], 0, ".tex 129, 137-138")
    decide(f"{tag}: T1 = 2<D(t), D(A) sum lambda p + A sum lambda D(p)> = 0   [killed by the first moment and the derivative first moment]", G["T1"], 0, ".tex 130-131, 137-138")
    decide(f"{tag}: T2 = sum lambda ||D(A)p||^2 = 0   [killed by the quadratic moment sum lambda p p^T = 0]", G["T2"], 0, ".tex 132, 138-139")
    decide(f"{tag}: T3 = 2 sum lambda <D(A)p, A D(p)> = 2 tr(D(A)^T A M) = 0   [killed by M symmetric and D(A)^T A skew]", G["T3"], 0, ".tex 133, 138-139; A.1 278-284")
    decide(f"{tag}: T4 = sum lambda ||A D(p)||^2 = sum lambda ||D(p)||^2 (A isometric)", G["T4"], expected_energy, ".tex 134, 139-146")
    decide(f"{tag}: sum lambda ||D(p')||^2 = energy, identically in the free symbols", total_f, expected_energy, ".tex 141-146")
    return total_f


def part_heptagon_full():
    global RELS
    sect("PART 1  The heptagon (Theorem 1, .tex 48-148): r a symbol; y_j formal with y_j^2 = j(2r-j); c^2+s^2=1")
    r = V("r")
    RELS = {
        "y1": 1 * (2 * r - 1),
        "y3": 3 * (2 * r - 3),
        "y4": 4 * (2 * r - 4) if MUTANT != "offcircle" else 4 * (2 * r - 5),   # MUTANT: the j=4 pair moved off the circle
        "c": C(1) - V("s") ** 2,
    }
    pts = [("O", 0, vec(C(0), C(0)), Fr(2))]
    W = {1: Fr(-2), 3: Fr(2), 4: Fr(-1)}
    if MUTANT == "weight":
        W[3] = Fr(1)        # MUTANT: weight 1 instead of 2 on the j=3 pair
    for j in (1, 3, 4):
        for sgn in (1, -1):
            pts.append((f"({j},{'+' if sgn > 0 else '-'}y{j})", j, vec(C(j), sgn * V(f"y{j}")), W[j]))
    log("points and weights (paper lines 49-53, 93-94):" + (f"   MUTANT={MUTANT}" if MUTANT else ""))
    for lab, j, p, w in pts:
        log(f"   lambda={str(w):>3}  p={lab}")
    for lab, j, p, w in pts:
        decide(f"on-circle {lab}: (x-r)^2+y^2-r^2 = 0", (p[0] - r) ** 2 + p[1] ** 2 - r ** 2, 0, ".tex 54")
    A_, B_ = [0, 3, 3], [1, 1, 4]
    decide("multisets {0,3,3},{1,1,4}: equal cardinality", len(A_), len(B_), ".tex 94-96")
    decide("multisets {0,3,3},{1,1,4}: equal sums", sum(A_), sum(B_), ".tex 94-96")
    decide("multisets {0,3,3},{1,1,4}: equal sums of squares", sum(a * a for a in A_), sum(b * b for b in B_), ".tex 94-96")

    Dy = {j: RF(V(f"y{j}"), 2 * r - j) for j in (1, 3, 4)}
    rules = {"r": RF(C(1)), "y1": Dy[1], "y3": Dy[3], "y4": Dy[4]}
    D = make_D(rules)
    decide("D(1) = 0, hence D(j) = 0 for every integer j", D(C(1)), 0, ".tex 79-80")
    for j in (1, 3, 4):
        y = V(f"y{j}")
        decide(f"D(y{j}) = {j}/y{j}   (decided as y{j}*D(y{j}) = {j})", RF(y) * Dy[j], C(j), ".tex 85-91",
               "derived from 2yD(y)=D(y^2)=D(j(2r-j))=2j, i.e. D(y)=j/y=j*y/y^2=y/(2r-j); stored as y/(2r-j)")
        decide(f"Leibniz consistency: D(y{j}^2) = D({j}(2r-{j})) = {2 * j}", D(y * y), C(2 * j), ".tex 85-91")

    Dp = []
    for lab, j, p, w in pts:
        dp = [D(p[0]), D(p[1])]
        Dp.append(dp)
        if j:
            decide(f"D({lab}) = (0, {j}/y): first coordinate 0", dp[0], 0, ".tex 90")
            decide(f"D({lab}) = (0, {j}/y): y * second coordinate = {j}", dp[1] * p[1], C(j), ".tex 90")
    lam = [w for _, _, _, w in pts]
    P = [p for _, _, p, _ in pts]

    decide("(1) sum lambda = 0", sum(lam), 0, ".tex 99 (eq (2), first)")
    m1 = [sum((lam[i] * P[i][k] for i in range(7)), RF(C(0))) for k in range(2)]
    decide("(2) sum lambda p, x-coordinate = 0", m1[0], 0, ".tex 100 (eq (2), second)")
    decide("(2) sum lambda p, y-coordinate = 0", m1[1], 0, ".tex 100 (eq (2), second)")
    M2 = [[sum((lam[i] * P[i][a] * P[i][b] for i in range(7)), RF(C(0))) for b in range(2)] for a in range(2)]
    log("   sum lambda p p^T = " + matstr(M2))
    decide("(3) sum lambda p p^T = 0 (the full 2x2 matrix)", mat_is_zero(M2), True, ".tex 101 (eq (2), third)",
           "Lemma A.1 (.tex 264-269) requires this matrix to be ZERO (its third condition); the matrix is also trivially symmetric",
           extra={"matrix": matstr(M2), "is_zero": mat_is_zero(M2), "is_symmetric": mat_is_symmetric(M2)})
    m1D = [sum((lam[i] * Dp[i][k] for i in range(7)), RF(C(0))) for k in range(2)]
    decide("(4) sum lambda D(p), x-coordinate = 0", m1D[0], 0, ".tex 102 (eq (2), fourth)")
    decide("(4) sum lambda D(p), y-coordinate = 0", m1D[1], 0, ".tex 102 (eq (2), fourth)")
    M = [[sum((lam[i] * Dp[i][a] * P[i][b] for i in range(7)), RF(C(0))) for b in range(2)] for a in range(2)]
    log("   M = sum lambda D(p) p^T = " + matstr(M))
    decide("(4) M = sum lambda D(p) p^T = 0 (the full 2x2 matrix, as the main text states)", mat_is_zero(M), True,
           ".tex 103 (eq (2), fifth)", "Lemma A.1 (.tex 270) needs only M symmetric; the heptagon satisfies the stronger M = 0",
           extra={"matrix": matstr(M), "is_zero": mat_is_zero(M), "is_symmetric": mat_is_symmetric(M)})
    decide("(4) M symmetric (Lemma A.1's condition)", mat_is_symmetric(M), True, ".tex 270")

    E = sum((lam[i] * dot(Dp[i], Dp[i]) for i in range(7)), RF(C(0)))
    Rpoly = (2 * r - 1) * (2 * r - 3) * (2 * r - 4)
    num, den = reduce_univariate(E, "r")
    log(f"   energy, reduced (monic denominator): ({num}) / ({den})")
    middle = RF(C(-4), 2 * r - 1) + RF(C(12), 2 * r - 3) + RF(C(-8), 2 * r - 4)
    decide("(5) energy = -4/(2r-1) + 12/(2r-3) - 8/(2r-4)", E, middle, ".tex 109-110 (eq (3))")
    decide("(5) energy = -24/R with R = (2r-1)(2r-3)(2r-4)", E, RF(C(-24), Rpoly), ".tex 107-111 (eq (3))",
           extra={"reduced_numerator": str(num), "reduced_denominator_monic": str(den), "R_expanded": str(Rpoly),
                  "as_integer_fraction": f"-24 / ({Rpoly})"})
    decide("(5) reduced form equals -3 / (R/8)", (num == C(-3)) and (den == Rpoly * Fr(1, 8)), True, ".tex 107-111",
           "gcd-reduced over Q with monic denominator: -3/(r^3 - 4 r^2 + 19/4 r - 3/2)")

    rho = V("rho")
    rules2 = {"r": RF(rho), "y1": RF(rho * V("y1"), 2 * r - 1), "y3": RF(rho * V("y3"), 2 * r - 3), "y4": RF(rho * V("y4"), 2 * r - 4)}
    D2 = make_D(rules2)
    E2 = RF(C(0))
    for i in range(7):
        d2 = [D2(P[i][0]), D2(P[i][1])]
        E2 = E2 + lam[i] * dot(d2, d2)
    decide("(extra) with D(r) = rho the energy is rho^2 * (-24/R) (the common-colouring subsection's D(r) = sqrt(R) gives -24 unscaled)",
           E2, RF(-24 * rho * rho, Rpoly), ".tex 1291-1299")

    # (6) invariance
    s, c, om = V("s"), V("c"), V("om")
    rules_full = dict(rules)
    rules_full.update({"c": RF(-om * s), "s": RF(om * c), "a1": RF(V("w1")), "a2": RF(V("w2"))})
    Dfull = make_D(rules_full)
    decide("(6) c^2 + s^2 = 1 in the ring", c * c + s * s, 1, "relation c^2 -> 1 - s^2")
    decide("(6) c*D(c) + s*D(s) = 0 under D(c) = -om*s, D(s) = om*c", RF(c) * rules_full["c"] + RF(s) * rules_full["s"], 0,
           "D(c^2+s^2) = D(1) = 0", "with c^2+s^2=1 the solutions (u,v) of c*u+s*v=0 are exactly om*(-s,c), om = c*v - s*u free: no generality lost")
    a = vec(V("a1"), V("a2"))
    w = vec(V("w1"), V("w2"))
    rot = [[RF(c), RF(-s)], [RF(s), RF(c)]]
    Drot = [[RF(-om * s), RF(-om * c)], [RF(om * c), RF(-om * s)]]
    refl = [[RF(c), RF(s)], [RF(s), RF(-c)]]
    Drefl = [[RF(-om * s), RF(om * c)], [RF(om * c), RF(om * s)]]
    tilt = [[RF(c), RF(C(0))], [RF(C(0)), RF(C(1))], [RF(s), RF(C(0))]]
    Dtilt = [[RF(-om * s), RF(C(0))], [RF(C(0)), RF(C(0))], [RF(om * c), RF(C(0))]]
    # D(A) = om * A J for the rotation (.tex 366)
    J = [[RF(C(0)), RF(C(-1))], [RF(C(1)), RF(C(0))]]
    AJ = [[sum((rot[i][k] * J[k][j] for k in range(2)), RF(C(0))) for j in range(2)] for i in range(2)]
    decide("(6) rotation: D(A) = om * A J", mat_is_zero([[Drot[i][j] - RF(om) * AJ[i][j] for j in range(2)] for i in range(2)]), True, ".tex 365-366")
    ident = lambda x: x
    expected = RF(C(-24), Rpoly)
    invariance_block("(6) heptagon, rotation+translation", lam, P, Dp, Dfull, rot, Drot, a, w, expected, ".tex 119-147", ident)
    invariance_block("(6) heptagon, reflection+translation", lam, P, Dp, Dfull, refl, Drefl, a, w, expected, ".tex 119-147", ident)
    invariance_block("(6) heptagon, tilt into R^3 (x,y)->(cx,y,sx) + translation (extra)", lam, P, Dp, Dfull, tilt, Dtilt,
                     vec(V("a1"), V("a2"), C(0)), vec(V("w1"), V("w2"), C(0)), expected, ".tex 337-342", ident)
    # F = R ||D(q)||^2 : sum lambda F(p') = -24
    log("   F(q) = R ||D(q)||^2 (.tex 114-118): sum lambda F(p') = R * (-24/R) = -24")
    decide("(6) sum lambda F(p') = R * sum lambda ||D(p')||^2 = -24 (rotation copy)", RF(Rpoly) * expected, C(-24), ".tex 141-147")
    RELS = {}


# ========================================================================================
# PART 2 -- Lemma A.1's expansion with abstract symbols (no points, no relations)
# ========================================================================================
def part_abstract():
    global RELS
    sect("PART 2  Lemma A.1's expansion decided with abstract symbols (lambda_i, p_i, q_i=D(p_i), w=D(t), A, B=D(A) all free)")
    RELS = {}
    m = 7
    lam = [RF(V(f"l{i}")) for i in range(m)]
    P = [vec(V(f"p{i}x"), V(f"p{i}y")) for i in range(m)]
    Q = [vec(V(f"q{i}x"), V(f"q{i}y")) for i in range(m)]
    w = vec(V("w1"), V("w2"))
    A = [[RF(V(f"A{i}{j}")) for j in range(2)] for i in range(2)]
    B = [[RF(V(f"B{i}{j}")) for j in range(2)] for i in range(2)]
    tot = RF(C(0))
    g = [RF(C(0))] * 5
    for i in range(m):
        Dp = vadd(vadd(w, matvec(B, P[i])), matvec(A, Q[i]))
        tot = tot + lam[i] * dot(Dp, Dp)
        Bp, Aq = matvec(B, P[i]), matvec(A, Q[i])
        g = [g[0] + lam[i] * dot(w, w), g[1] + lam[i] * 2 * dot(w, vadd(Bp, Aq)), g[2] + lam[i] * dot(Bp, Bp),
             g[3] + lam[i] * 2 * dot(Bp, Aq), g[4] + lam[i] * dot(Aq, Aq)]
    decide("A.1 expansion: sum lambda ||w + B p + A q||^2 = the five groups (abstract symbols)", tot, sum(g, RF(C(0))), ".tex 124-136, 275-277")
    # trace forms
    S0 = sum(lam, RF(C(0)))
    S1 = [sum((lam[i] * P[i][k] for i in range(m)), RF(C(0))) for k in range(2)]
    S1D = [sum((lam[i] * Q[i][k] for i in range(m)), RF(C(0))) for k in range(2)]
    S2 = [[sum((lam[i] * P[i][a] * P[i][b] for i in range(m)), RF(C(0))) for b in range(2)] for a in range(2)]
    Mm = [[sum((lam[i] * Q[i][a] * P[i][b] for i in range(m)), RF(C(0))) for b in range(2)] for a in range(2)]
    decide("A.1: T0 = ||w||^2 * (sum lambda)", g[0], dot(w, w) * S0, ".tex 129")
    decide("A.1: T1 = 2<w, B (sum lambda p) + A (sum lambda q)>", g[1], 2 * dot(w, vadd(matvec(B, S1), matvec(A, S1D))), ".tex 130-131")
    BtB = [[sum((B[k][i] * B[k][j] for k in range(2)), RF(C(0))) for j in range(2)] for i in range(2)]
    tr = lambda X, Y: sum((X[i][k] * Y[k][i] for i in range(2) for k in range(2)), RF(C(0)))
    decide("A.1: T2 = tr(B^T B * sum lambda p p^T)", g[2], tr(BtB, S2), ".tex 132")
    BtA = [[sum((B[k][i] * A[k][j] for k in range(2)), RF(C(0))) for j in range(2)] for i in range(2)]
    decide("A.1: T3 = 2 tr(B^T A M), M = sum lambda q p^T", g[3], 2 * tr(BtA, Mm), ".tex 279-280")
    # skew x symmetric has zero trace
    sg, k11, k12, k22 = RF(V("sg")), RF(V("k11")), RF(V("k12")), RF(V("k22"))
    Sk = [[RF(C(0)), sg], [-sg, RF(C(0))]]
    K = [[k11, k12], [k12, k22]]
    decide("A.1: tr(S K) = 0 for S skew, K symmetric (2x2 symbols)", tr(Sk, K), 0, ".tex 282-284")
    # A^T A = I  =>  ||A q||^2 = ||q||^2  and B^T A skew when B^T A + A^T B = 0 (i.e. D(A^T A)=0)
    #   decided with the parametrised orthogonal matrices in Part 1/3; here the algebraic statement:
    RELS = {"c": C(1) - V("s") ** 2}
    c, s = V("c"), V("s")
    for name, Ao in (("rotation", [[RF(c), RF(-s)], [RF(s), RF(c)]]), ("reflection", [[RF(c), RF(s)], [RF(s), RF(-c)]])):
        q = vec(V("qx"), V("qy"))
        Aq = matvec(Ao, q)
        decide(f"A.1: ||A q||^2 = ||q||^2 for the {name} (c^2+s^2=1)", dot(Aq, Aq), dot(q, q), ".tex 139-144")
    RELS = {}


# ========================================================================================
# PART 3 -- Theorem A.3 (generic seven points), .tex 390-444
# ========================================================================================
def vandermonde(names):
    v = C(1)
    for j, k in combinations(range(len(names)), 2):
        v = v * (V(names[k]) - V(names[j]))
    return v


def hcomplete(names, k):
    """complete homogeneous symmetric polynomial h_k."""
    if k == 0:
        return C(1)
    out = Poly()
    # iterate multisets of size k over names
    def rec(start, left, mono):
        nonlocal out
        if left == 0:
            out = out + mono
            return
        for i in range(start, len(names)):
            rec(i, left - 1, mono * V(names[i]))
    rec(0, k, C(1))
    return out


def part_generic():
    global RELS
    sect("PART 3  Theorem A.3 (.tex 390-444): p(t) = ((1-t^2)/(1+t^2), 2t/(1+t^2)), t_1..t_7 symbols")
    RELS = {}
    names = [f"t{i}" for i in range(1, 8)]
    T = V("T")
    # ---- (a) the interpolation identities (A.2), .tex 407-411, as polynomial identities via the Vandermonde
    Vd = vandermonde(names)
    Hp = []
    cof = []
    for i in range(7):
        hp = C(1)
        for j in range(7):
            if j != i:
                hp = hp * (V(names[i]) - V(names[j]))
        Hp.append(hp)
        others = [names[j] for j in range(7) if j != i]
        cf = vandermonde(others) * ((-1) ** (6 - i))
        cof.append(cf)
        decide(f"(A.3a) Vandermonde cofactor: H'(t{i + 1}) * cof_{i + 1} = V  (so cof_i = V / H'(t_i))", hp * cf, Vd, ".tex 404-411",
               note="H'(t_i) = prod_{j != i} (t_i - t_j); V = prod_{j<k} (t_k - t_j)")
    e = {}
    for k in range(0, 9):
        lhs = Poly()
        for i in range(7):
            lhs = lhs + (V(names[i]) ** k) * cof[i]
        if k < 6:
            rhs = Poly()
            target = "0"
        else:
            rhs = hcomplete(names, k - 6) * Vd
            target = "1" if k == 6 else f"h_{k - 6}(t)"
        e[k] = Poly() if k < 6 else hcomplete(names, k - 6)
        decide(f"(A.3a) interpolation: sum_i t_i^{k} / H'(t_i) = {target}  (decided as sum_i t_i^{k} cof_i = {target} * V)", lhs, rhs,
               ".tex 407-411 (A.2)" if k <= 6 else "classical extension (k>6, h_{k-6}); used only to bound degrees")
    paper_k = "0<=k<=5 -> 0 ; k=6 -> 1"
    log(f"   e_k := sum_i t_i^k/H'(t_i): {paper_k}; k=7 -> h_1, k=8 -> h_2 (for the degree audit)")

    def interp_sum(N, what):
        """sum_i N(t_i)/H'(t_i) for a polynomial N in T (coefficients free of T) = sum_k N_k e_k."""
        cs = N.coeffs_in("T")
        deg = max(cs) if cs else -1
        if deg > 8:
            raise ValueError("degree too high for the tabulated e_k")
        out = Poly()
        for k, co in cs.items():
            out = out + co * e[k]
        log(f"      {what}: per-point numerator degree in t_i = {deg}; leading coefficient = {cs.get(deg, Poly())}")
        return out

    # ---- the data: g, H, points, derivation, weights
    g = (T - V("t1")) * (T - V("t2")) * (T - V("t3"))         # .tex 405
    xT = RF(1 - T * T, 1 + T * T)
    yT = RF(2 * T, 1 + T * T)
    decide("(A.3) p(t) lies on the unit circle: x^2 + y^2 = 1", xT * xT + yT * yT, 1, ".tex 391-394")
    # derivation on T: D(T) = g(T) (.tex 412-415: D(t_i) = g(t_i) for all seven i, the first three being 0 = g(t_i))
    Dg = make_D({"T": RF(g), "t1": RF(C(0)), "t2": RF(C(0)), "t3": RF(C(0))})
    for i in (1, 2, 3):
        decide(f"(A.3) g(t{i}) = 0, so D(t{i}) = 0 = g(t{i}) is consistent with D vanishing on K", g.subs("T", V(f"t{i}")), 0, ".tex 412-415")
    DxT, DyT = Dg(xT), Dg(yT)
    b = RF(2 * g, 1 + T * T)                                    # .tex 419
    Jp = [-yT, xT]
    decide("(A.3) D(p(t)) = b J p(t), x-coordinate, with b = 2 g(t)/(1+t^2)", DxT, b * Jp[0], ".tex 416-420",
           note="D(f(t)) = f'(t) D(t) for f rational over Q: the chain rule of a derivation (D(T)=g(T) is the only input)")
    decide("(A.3) D(p(t)) = b J p(t), y-coordinate", DyT, b * Jp[1], ".tex 416-420")
    decide("(A.3) ||J p||^2 = 1 hence ||D(p)||^2 = b^2", dot(Jp, Jp), 1, ".tex 304-307")

    # weights lambda_i = (1+t_i^2)^2 / H'(t_i)  (.tex 421).  Per point i, lambda_i * Phi(t_i) = N(t_i)/H'(t_i) with
    # N(T) = (1+T^2)^2 Phi(T); when N is a polynomial in T the sum is sum_k N_k e_k.
    lamnum = (1 + T * T) ** 2 if MUTANT != "generic-weight" else (1 + T * T) ** 3   # MUTANT: wrong weight exponent

    def weighted_sum(phi, what):
        """sum_i lambda_i phi(t_i) where phi is an RF in T: decided exactly via interpolation."""
        x = RF(lamnum) * phi
        x = RF(x.n.nf(), x.d)
        N = exact_div_univariate(x.n, x.d, "T")          # raises if not a polynomial in T
        return interp_sum(N, what)

    # ---- (b) ordinary moments, .tex 421-425
    decide("(A.3b) sum lambda_i = 0", weighted_sum(RF(C(1)), "sum lambda"), 0, ".tex 421-425")
    decide("(A.3b) sum lambda_i x_i = 0", weighted_sum(xT, "sum lambda x"), 0, ".tex 421-425")
    decide("(A.3b) sum lambda_i y_i = 0", weighted_sum(yT, "sum lambda y"), 0, ".tex 421-425")
    S2 = [[weighted_sum(pa * pb, f"sum lambda p_{a}p_{bb}") for bb, pb in enumerate((xT, yT))] for a, pa in enumerate((xT, yT))]
    decide("(A.3b) sum lambda_i p_i p_i^T = 0 (full 2x2 matrix)", all(x.is_zero() for row in S2 for x in row), True, ".tex 421-425",
           extra={"matrix": matstr(S2)})
    # ---- (c) the derivative conditions, .tex 425-430
    decide("(A.3c) sum lambda_i b_i = 0        (= 2 sum g(t_i)(1+t_i^2)/H'(t_i))", weighted_sum(b, "sum lambda b"), 0, ".tex 425-430")
    decide("(A.3c) sum lambda_i b_i x_i = 0    (= 2 sum g(t_i)(1-t_i^2)/H'(t_i))", weighted_sum(b * xT, "sum lambda b x"), 0, ".tex 425-430")
    decide("(A.3c) sum lambda_i b_i y_i = 0    (= 2 sum g(t_i) 2t_i/H'(t_i))", weighted_sum(b * yT, "sum lambda b y"), 0, ".tex 425-430")
    # Lemma A.1's own conditions, decided from the point data rather than through the circle reduction:
    S1D = [weighted_sum(DxT, "sum lambda D(p)_x"), weighted_sum(DyT, "sum lambda D(p)_y")]
    decide("(A.3c) Lemma A.1: sum lambda_i D(p_i) = 0 (both coordinates)", all(x.is_zero() for x in S1D), True, ".tex 268")
    # M = sum lambda D(p) p^T : its entries are NOT of the polynomial form -- decide only M - M^T (which is), and
    # witness M != 0 by exact evaluation at a rational point.
    Dp_ = [DxT, DyT]
    pp_ = [xT, yT]
    Msym = weighted_sum(Dp_[1] * pp_[0] - Dp_[0] * pp_[1], "M21 - M12")
    decide("(A.3c) Lemma A.1: M = sum lambda_i D(p_i) p_i^T is symmetric  (M21 - M12 = sum lambda_i b_i = 0)", Msym, 0, ".tex 270, 313-314")
    # exact rational witness that M itself is not zero (so the main text's eq (2) form M = 0 does NOT hold for A.3)
    tv = [Fr(0), Fr(1), Fr(2), Fr(3), Fr(5), Fr(7), Fr(11)]
    def ev(rf, t):
        n = rf.n
        d = rf.d
        for i, nm in enumerate(names):
            n = n.subs(nm, C(tv[i]))
            d = d.subs(nm, C(tv[i]))
        n = n.subs("T", C(t)); d = d.subs("T", C(t))
        return n.t.get((), Fr(0)) / d.t.get((), Fr(0))
    Mval = [[Fr(0)] * 2 for _ in range(2)]
    for i in range(7):
        t = tv[i]
        Hpi = Fr(1)
        for j in range(7):
            if j != i:
                Hpi *= (tv[i] - tv[j])
        lam_i = (1 + t * t) ** 2 / Hpi
        for a in range(2):
            for bb in range(2):
                Mval[a][bb] += lam_i * ev(Dp_[a], t) * ev(pp_[bb], t)
    decide("(A.3c) witness: M evaluated at t = (0,1,2,3,5,7,11) is symmetric but NOT the zero matrix",
           (Mval[0][1] == Mval[1][0]) and any(x != 0 for row in Mval for x in row), True, "Lemma A.1 vs eq (2)",
           note="so Theorem A.3 needs Lemma A.1's symmetric form, not the main text's M = 0",
           extra={"M_at_witness": [[str(x) for x in row] for row in Mval]})
    # ---- (d) energy, .tex 430-435
    Eg = weighted_sum(b * b, "E = sum lambda b^2")
    decide("(A.3d) E = sum lambda_i b_i^2 = 4 sum g(t_i)^2/H'(t_i) = 4  (g monic cubic => g^2 monic of degree 6)", Eg, 4, ".tex 430-435")
    Eg2 = weighted_sum(DxT * DxT + DyT * DyT, "E = sum lambda ||D(p)||^2")
    decide("(A.3d) E = sum lambda_i ||D(p_i)||^2 = 4 (directly from D(p))", Eg2, 4, ".tex 271, 430-435")
    decide("(A.3d) E != 0 (Lemma A.1's last hypothesis)", Eg2.is_zero(), False, ".tex 271")

    # ---- (e) the invariance for the generic set, directly: rotation / reflection + translation, D free on c,s,t
    RELS = {"c": C(1) - V("s") ** 2}
    s, c, om = V("s"), V("c"), V("om")
    Dall = make_D({"T": RF(g), "t1": RF(C(0)), "t2": RF(C(0)), "t3": RF(C(0)),
                   "c": RF(-om * s), "s": RF(om * c), "a1": RF(V("w1")), "a2": RF(V("w2"))})
    a = vec(V("a1"), V("a2"))
    w = vec(V("w1"), V("w2"))
    rot = [[RF(c), RF(-s)], [RF(s), RF(c)]]
    Drot = [[RF(-om * s), RF(-om * c)], [RF(om * c), RF(-om * s)]]
    refl = [[RF(c), RF(s)], [RF(s), RF(-c)]]
    Drefl = [[RF(-om * s), RF(om * c)], [RF(om * c), RF(om * s)]]
    # one generic point p(T); the weighted sum over i is the interpolation functional applied to the per-point expression
    Pg = [pp_]
    Dpg = [[Dall(xT), Dall(yT)]]
    lam1 = [Fr(1)]

    def finish(x):
        # x is the per-point expression (one symbolic point T, weight 1); the actual sum is sum_i lambda_i x(t_i)
        return weighted_sum(x, "invariance term")

    invariance_block("(A.3e) generic, rotation+translation", lam1, Pg, Dpg, Dall, rot, Drot, a, w, C(4), ".tex 274-286", finish)
    invariance_block("(A.3e) generic, reflection+translation", lam1, Pg, Dpg, Dall, refl, Drefl, a, w, C(4), ".tex 274-286", finish)
    RELS = {}


# ========================================================================================
# PART 4 -- the twelve-colouring arithmetic (.tex 1168-1191)
# ========================================================================================
def part_colouring():
    sect("PART 4  The twelve-colouring  floor(F/4) mod 12  (.tex 1168-1191): finite arithmetic")
    lam = [Fr(2), Fr(-2), Fr(-2), Fr(2), Fr(2), Fr(-1), Fr(-1)]
    Lpos = sum(x for x in lam if x > 0)
    Lneg = sum(x for x in lam if x < 0)
    decide("(12) positive weights total 6", Lpos, 6, ".tex 1176")
    decide("(12) negative weights total -6", Lneg, -6, ".tex 1176")
    decide("(12) sum lambda = 0 (so the common class c drops out)", sum(lam), 0, ".tex 1177-1181")
    # F(p')/4 = 12 k_p + c + theta_p, 0 <= theta_p < 1.  sum lambda F(p')/4 = -24/4 = -6.
    # => -6 = 12 K + sum lambda theta,  K = sum lambda k_p integer,  sum lambda theta in the OPEN interval (Lneg, Lpos).
    # sum lambda theta > Lneg strictly because every negative-weight theta < 1; < Lpos strictly likewise.
    lo, hi = Fr(-6) - Lpos, Fr(-6) - Lneg      # 12K in (lo, hi) open
    ks = [K for K in range(-5, 6) if lo < 12 * K < hi]
    decide("(12) sum lambda theta lies in the open interval (-6, 6), so 12K = -6 - sum lambda theta in (-12, 0)", (str(lo), str(hi)), ("-12", "0"), ".tex 1177-1184")
    decide("(12) no integer K with -12 < 12K < 0  =>  a monochromatic copy is impossible", ks, [], ".tex 1177-1184",
           note="the open-ness needs theta_p < 1 strictly on every point of nonzero weight; all seven weights are nonzero")
    # the general recipe (.tex 1184-1188) specialised: L = 6, E = -24: floor(L F/E) mod 2L = floor(-F/4) mod 12 -- the sign differs from
    # the specific colouring floor(F/4) mod 12; both are valid by the same argument (replace F by -F, E by 24).
    for sign, Ev in ((1, Fr(-24)), (-1, Fr(24))):
        tot = Ev / 4
        lo2, hi2 = tot - Lpos, tot - Lneg
        ks2 = [K for K in range(-5, 6) if lo2 < 12 * K < hi2]
        decide(f"(12) colouring floor({'F' if sign > 0 else '-F'}/4) mod 12: 12K in ({lo2}, {hi2}) has no integer solution", ks2, [], ".tex 1172-1188",
               note="the paper's general recipe floor(L F/E) mod 2L with L=6, E=-24 is floor(-F/4) mod 12; the displayed colouring uses floor(F/4) mod 12; both work")
    decide("(12) 2L = 12 colours with L = 6", 2 * Lpos, 12, ".tex 1184-1188")
    # the pigeonhole alternative stated in the brief: seven values with sum lambda F = -24 cannot share a class -- that is the statement decided above.


def main():
    t0 = time.time()
    log(f"DECIDER B  --  python {sys.version.split()[0]}  --  standard library only (fractions.Fraction, own polynomial ring)")
    log(f"paper: spherical_non_ramsey.tex, sha256 681c953f883506f573a2c59435d0ddbfed061be7852ee2a3a96004d27852d0f1")
    part_heptagon_full()
    part_abstract()
    part_generic()
    part_colouring()
    n_ok = sum(1 for r in RESULTS if r["verdict"] == "CERTIFIED")
    n_bad = sum(1 for r in RESULTS if r["verdict"] == "REFUTED")
    log()
    log(f"TOTAL identities decided: {len(RESULTS)}   CERTIFIED: {n_ok}   REFUTED: {n_bad}   time {time.time() - t0:.1f}s")
    out = {
        "decider": "B",
        "system": "Python 3 standard library: fractions.Fraction + own sparse multivariate polynomial ring with relations y_j^2=j(2r-j), c^2=1-s^2 (normal form; coprime leading monomials => canonical); rational elements num/den with den univariate; equality by cross-multiplication; univariate gcd only for the reported reduced form",
        "paper": {"file": "spherical_non_ramsey.tex", "sha256": "681c953f883506f573a2c59435d0ddbfed061be7852ee2a3a96004d27852d0f1", "arxiv": "2609.23327v1"},
        "date": "2026-11-07",
        "summary": {"decided": len(RESULTS), "certified": n_ok, "refuted": n_bad},
        "identities": RESULTS,
    }
    here = os.path.dirname(os.path.abspath(__file__))
    if MUTANT:
        out["MUTANT"] = MUTANT
        os.makedirs(os.path.join(here, "mutants"), exist_ok=True)
        jpath, lpath = os.path.join(here, "mutants", f"result-b-{MUTANT}.json"), os.path.join(here, "mutants", f"run-{MUTANT}.log")
    else:
        jpath, lpath = os.path.join(here, "result-b.json"), os.path.join(here, "run.log")
    with open(jpath, "w") as f:
        json.dump(out, f, indent=1)
    with open(lpath, "w") as f:
        f.write("\n".join(LOG) + "\n")


if __name__ == "__main__":
    main()
