"""The family registry: append-only.

A family is a constant-shaped question with an exact side decider (verify_gym.exact.side), a deterministic
generator, a stated starting bracket, a size limit and a cap. Families are listed in curriculum.json in the order
they were added; an entry, once added, never changes (its spec is pinned by sha256 in PROVENANCE.json and the
battery refuses a change), so a new family APPENDS and moves no existing task.

Every task is addressed as (family, split, index), and each family draws from its own stream:
    rng = sha256("verify-gym|<family>|<split>|<index>|<draw>")
so a task's identity depends on nothing but its own family, split and index. Adding a family, a tier to a NEW
family version, or a training stage changes no task that existed before.

THE HOOK FOR THE REGISTER. A claim the register decides (a certs/*.json ledger) feeds the gym when its quantity
has an exact side decider. Adding it is: (1) a side function in exact.py AND an independent one in check.js
(the battery refuses a family with one decider), (2) a class here, (3) a curriculum.json entry naming the ledger
it came from and that ledger's sha256, (4) its own held-out file, hashed, appended to curriculum.json's
`heldout` list. heldout-v0.json is never edited.
"""
from __future__ import annotations

import hashlib
import math
from decimal import Decimal, localcontext
from fractions import Fraction

from . import exact

SALT = "verify-gym"


class Stream:
    """A deterministic draw: sha256 counter mode. Identical on every Python, forever."""

    def __init__(self, family, split, index, retry=0):
        self.base = "%s|%s|%s|%d" % (SALT, family, split, index) + ("|r%d" % retry if retry else "")
        self.n = 0

    def below(self, m):
        h = hashlib.sha256(("%s|%d" % (self.base, self.n)).encode()).digest()
        self.n += 1
        return int.from_bytes(h, "big") % m

    def between(self, lo, hi):                    # inclusive
        return lo + self.below(hi - lo + 1)

    def choice(self, seq):
        return seq[self.below(len(seq))]

    def tier(self, tiers):
        """tiers: [(name, weight), ...]"""
        total = sum(w for _, w in tiers)
        r = self.below(total)
        for name, w in tiers:
            if r < w:
                return name
            r -= w
        raise AssertionError


def iroot(n, k):
    """floor(n^(1/k)) for n >= 0, exact (Newton on integers)."""
    if n < 2:
        return n
    x = 1 << ((n.bit_length() + k - 1) // k)
    while True:
        y = ((k - 1) * x + n // x ** (k - 1)) // k
        if y >= x:
            break
        x = y
    while x ** k > n:
        x -= 1
    while (x + 1) ** k <= n:
        x += 1
    return x


def frac_text(a):
    return str(a.numerator) if a.denominator == 1 else "%d/%d" % (a.numerator, a.denominator)


# ------------------------------------------------------------------------------------------------------------
class XX:
    id = "xx"
    version = 1
    cap = 8
    limit = 10 ** 5
    tiers = [("y<100", 3), ("y<10^4", 4), ("y<10^6", 3)]
    ranges = {"y<100": (2, 99), "y<10^4": (100, 9999), "y<10^6": (10000, 999999)}

    @staticmethod
    def generate(s):
        tier = s.tier(XX.tiers)
        lo, hi = XX.ranges[tier]
        while True:
            N = s.between(lo, hi)
            if not any(k ** k == N for k in range(1, 9)):      # x^x = k^k has the root k; excluded
                return {"N": N}, tier

    @staticmethod
    def key(inst):
        return "xx:N=%d" % inst["N"]

    @staticmethod
    def start(inst):
        N, m = inst["N"], 1
        while (m + 1) ** (m + 1) <= N:
            m += 1
        return Fraction(m), Fraction(m + 1)

    @staticmethod
    def statement(inst):
        return "x is the real root of x^x = %d." % inst["N"]

    @staticmethod
    def rule(inst):
        return ("For a = p/q in lowest terms with a >= 1: x > a exactly when p^p < %d^q * q^p, and x < a exactly "
                "when p^p > %d^q * q^p. A bar below 1 is outside this rule and scores 0." % (inst["N"], inst["N"]))

    @staticmethod
    def float_estimate(inst):
        L = math.log(inst["N"])
        x = max(1.5, L / math.log(max(L, 1.5)))
        for _ in range(60):
            x -= (x * math.log(x) - L) / (math.log(x) + 1)
        return x

    @staticmethod
    def hp_estimate(inst, digits):
        with localcontext() as ctx:
            ctx.prec = digits + 20
            L = Decimal(inst["N"]).ln()
            x = Decimal(repr(XX.float_estimate(inst)))
            for _ in range(12):
                x -= (x * x.ln() - L) / (x.ln() + 1)
            return Fraction(x)


class KRoot:
    id = "kroot"
    version = 1
    cap = 20
    limit = 10 ** 30
    tiers = [("k<=3,n<10^3", 3), ("k<=5,n<10^6", 4), ("k<=7,n<10^12", 3)]
    ranges = {"k<=3,n<10^3": (3, 2, 999), "k<=5,n<10^6": (5, 1000, 10 ** 6 - 1), "k<=7,n<10^12": (7, 10 ** 6, 10 ** 12 - 1)}

    @staticmethod
    def generate(s):
        tier = s.tier(KRoot.tiers)
        kmax, lo, hi = KRoot.ranges[tier]
        while True:
            k = s.between(2, kmax)
            n = s.between(lo, hi)
            if iroot(n, k) ** k != n:                 # not a perfect k-th power: the root is irrational
                return {"n": n, "k": k}, tier

    @staticmethod
    def key(inst):
        return "kroot:n=%d,k=%d" % (inst["n"], inst["k"])

    @staticmethod
    def start(inst):
        m = iroot(inst["n"], inst["k"])
        return Fraction(m), Fraction(m + 1)

    @staticmethod
    def statement(inst):
        return "x is the real %s root of %d, x = %d^(1/%d)." % (_ordinal(inst["k"]), inst["n"], inst["n"], inst["k"])

    @staticmethod
    def rule(inst):
        return ("For a = p/q in lowest terms with a > 0: x > a exactly when p^%d < %d * q^%d, and x < a exactly when "
                "p^%d > %d * q^%d. A bar at or below 0 scores 0." % (inst["k"], inst["n"], inst["k"], inst["k"], inst["n"], inst["k"]))

    @staticmethod
    def float_estimate(inst):
        return inst["n"] ** (1.0 / inst["k"])

    @staticmethod
    def hp_estimate(inst, digits):
        n, k = inst["n"], inst["k"]
        return Fraction(iroot(n * 10 ** (k * digits), k), 10 ** digits)


class Poly:
    id = "poly"
    version = 1
    cap = 20
    limit = 10 ** 30
    tiers = [("deg 3-4", 4), ("deg 5-6", 3), ("cluster", 3)]

    @staticmethod
    def generate(s):
        tier = s.tier(Poly.tiers)
        while True:
            if tier == "cluster":
                # (b x - a)^2 (x + c) - e: two real roots within about 2 sqrt(e / (a/b + c)) / b of a/b
                b = s.between(8, 40)
                a = s.between(1, 3 * b)
                if math.gcd(a, b) != 1:
                    continue
                c, e = s.between(1, 5), s.between(1, 3)
                sq = [b * b, -2 * a * b, a * a]                       # (b x - a)^2, leading first
                coeffs = [sq[0], sq[0] * c + sq[1], sq[1] * c + sq[2], sq[2] * c - e]
                want_near = Fraction(a, b)
            else:
                d = s.between(3, 4) if tier == "deg 3-4" else s.between(5, 6)
                M = 9 if tier == "deg 3-4" else 20
                coeffs = [s.between(1, M)] + [s.between(-M, M) for _ in range(d)]
                want_near = None
            if coeffs[-1] == 0 or _has_rational_root(coeffs):
                continue
            iso = _isolate(coeffs)
            if not iso:
                continue
            if want_near is not None:
                near = sorted(iso, key=lambda lh: abs((lh[0] + lh[1]) / 2 - want_near))[:2]
                l, h = near[s.below(len(near))]
            else:
                l, h = iso[s.below(len(iso))]
            if exact.isolation_ok(coeffs, l, h):
                return {"coeffs": coeffs, "lo0": frac_text(l), "hi0": frac_text(h)}, tier

    @staticmethod
    def key(inst):
        return "poly:%s|%s|%s" % (",".join(map(str, inst["coeffs"])), inst["lo0"], inst["hi0"])

    @staticmethod
    def start(inst):
        return Fraction(inst["lo0"]), Fraction(inst["hi0"])

    @staticmethod
    def statement(inst):
        return "x is the only real root of P(x) = %s in the interval (%s, %s)." % (
            poly_text(inst["coeffs"]), inst["lo0"], inst["hi0"])

    @staticmethod
    def rule(inst):
        return ("P(%s) and P(%s) have opposite signs and P has exactly one root between them (Descartes' rule on the "
                "Moebius transform, checked exactly). For a rational a strictly inside: x > a exactly when P(a) has the "
                "sign of P(%s), and x < a exactly when it has the sign of P(%s); P(a) is computed exactly."
                % (inst["lo0"], inst["hi0"], inst["lo0"], inst["hi0"]))

    @staticmethod
    def float_estimate(inst):
        c = inst["coeffs"]
        f = lambda x: _horner_float(c, x)
        l, h = float(Fraction(inst["lo0"])), float(Fraction(inst["hi0"]))
        sl = f(l) > 0
        for _ in range(200):
            m = (l + h) / 2
            if m == l or m == h:
                break
            if (f(m) > 0) == sl:
                l = m
            else:
                h = m
        return (l + h) / 2

    @staticmethod
    def hp_estimate(inst, digits):
        c = inst["coeffs"]
        l, h = Fraction(inst["lo0"]), Fraction(inst["hi0"])
        sl = exact.poly_sign(c, l)
        target = Fraction(1, 10 ** (digits + 2))
        while h - l > target:
            m = (l + h) / 2
            s = exact.poly_sign(c, m)
            if s == 0:
                return m
            if s == sl:
                l = m
            else:
                h = m
        return (l + h) / 2


def _horner_float(coeffs, x):
    v = 0.0
    for c in coeffs:
        v = v * x + c
    return v


def _divisors(n):
    n = abs(n)
    out = []
    for d in range(1, math.isqrt(n) + 1):
        if n % d == 0:
            out += [d, n // d]
    return set(out)


def _has_rational_root(coeffs):
    """Rational root theorem; the coefficients are small, so the candidates are few."""
    for p in _divisors(coeffs[-1]):
        for q in _divisors(coeffs[0]):
            for a in (Fraction(p, q), Fraction(-p, q)):
                if exact.poly_sign(coeffs, a) == 0:
                    return True
    return False


def _isolate(coeffs, depth=48):
    """Isolating intervals with dyadic endpoints for every real root, by Descartes bisection. None if it does not
    resolve (a multiple root, or roots closer than the depth allows)."""
    B = 1 + max(abs(Fraction(c, coeffs[0])) for c in coeffs[1:])      # Cauchy's bound
    B = Fraction(math.ceil(B))
    out, todo = [], [(-B, B, 0)]
    while todo:
        l, h, k = todo.pop()
        if exact.poly_sign(coeffs, l) == 0 or exact.poly_sign(coeffs, h) == 0:
            return None                                                 # a dyadic root; excluded upstream anyway
        v = exact.variations(coeffs, l, h)
        if v == 0:
            continue
        if v == 1:
            out.append((l, h))
            continue
        if k >= depth:
            return None
        m = (l + h) / 2
        todo += [(l, m, k + 1), (m, h, k + 1)]
    return sorted(out)


def poly_text(coeffs):
    d = len(coeffs) - 1
    parts = []
    for i, c in enumerate(coeffs):
        e = d - i
        if c == 0:
            continue
        mag = abs(c)
        body = ("" if mag == 1 and e > 0 else str(mag)) + ("x^%d" % e if e > 1 else "x" if e == 1 else "")
        sign = "-" if c < 0 else "+"
        parts.append((sign, body))
    s = ("-" if parts[0][0] == "-" else "") + parts[0][1]
    for sign, body in parts[1:]:
        s += " %s %s" % (sign, body)
    return s


def _ordinal(k):
    return {2: "square", 3: "cube"}.get(k, "%d-th" % k)


REGISTRY = {f.id: f for f in (XX, KRoot, Poly)}     # in the order added; append only
