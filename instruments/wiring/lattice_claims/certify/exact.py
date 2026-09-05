"""Exact decisions about lattice claims. Integers and Fractions only.

Every predicate here is total and decidable. Nothing returns a float, and any
float arriving at the boundary is refused at ingest rather than silently
coerced -- a float has already lost the information the decision needs.

THE ACCEPTANCE PREDICATE
------------------------
The Gaussian heuristic for a lattice of dimension n and determinant q is

    GH = ( q * Gamma(n/2 + 1) / pi**(n/2) ) ** (1/n)

and the claim under test is  ||v|| <= f * GH.  Raised to the n-th power every
root disappears, and for odd n the sqrt(pi) inside Gamma(m + 3/2) cancels
against pi**(n/2).  What is left is exact integers and one power of pi:

    n = 2m      (||v||^2)^m * pi^m  <=  f^n * q * m!
    n = 2m+1    (||v||^2)^n * pi^(2m) * 4^(2m+2) * ((m+1)!)^2
                                    <=  f^(2n) * q^2 * ((2m+2)!)^2

so a certified bracket on pi decides the whole thing.  ||v||^2 is carried as a
RATIONAL, not an integer, because a claim is sometimes made about a norm that
was reported rounded, and the honest answer then is an interval that may
straddle the threshold.
"""

from fractions import Fraction
from math import factorial

__all__ = [
    "pi_bracket", "norm_sq", "in_lattice", "decide", "ratio_bracket",
    "ADMISSIBLE", "REFUSED", "UNDECIDED", "IngestError",
]

ADMISSIBLE = "ADMISSIBLE"
REFUSED = "REFUSED"
UNDECIDED = "UNDECIDED"


class IngestError(ValueError):
    """A float reached a place where only exact values are accepted."""


def _int(x, what):
    if isinstance(x, bool) or not isinstance(x, int):
        raise IngestError(f"{what} must be an exact integer, got {type(x).__name__}")
    return x


def _arctan_inv(x: int, S: int):
    """S * arctan(1/x) as an integer bracket.

    The series alternates with strictly decreasing terms, so the tail is
    smaller than the first omitted term. Each term is an integer division and
    so costs at most one unit. Both are accumulated, never assumed.
    """
    x2 = x * x
    total, pw, k, terms = 0, x, 0, 0
    while True:
        den = (2 * k + 1) * pw
        if den > S:
            break
        t = S // den
        total += t if k % 2 == 0 else -t
        terms += 1
        k += 1
        pw *= x2
    tail = S // ((2 * k + 1) * pw) + 1
    slack = terms + tail + 1
    return total - slack, total + slack


def pi_bracket(digits: int = 60):
    """(lo, hi, S) with lo/S <= pi <= hi/S, proved by Machin's formula."""
    guard = 12
    S = 10 ** (digits + guard)
    a_lo, a_hi = _arctan_inv(5, S)
    b_lo, b_hi = _arctan_inv(239, S)
    lo = 16 * a_lo - 4 * b_hi
    hi = 16 * a_hi - 4 * b_lo
    drop = 10 ** guard
    return lo // drop - 1, hi // drop + 1, 10 ** digits


def norm_sq(v) -> int:
    """Squared Euclidean norm, exactly. Refuses anything that is not an int."""
    return sum(_int(c, "vector entry") ** 2 for c in v)


def in_lattice(q: int, xs, v) -> bool:
    """Membership in a Goldstein-Mayer lattice, as an exact divisibility test.

    The basis is  row 0 = [q, 0, ..., 0],  row i = [xs[i-1], e_i],  so a vector
    v lies in the lattice exactly when v[0] - sum_i v[i] * xs[i-1] is divisible
    by q.  No matrix is needed and no rounding is possible.
    """
    q = _int(q, "modulus")
    if q <= 0:
        raise IngestError("modulus must be positive")
    if len(v) != len(xs) + 1:
        raise IngestError(f"vector has length {len(v)}, expected {len(xs) + 1}")
    acc = _int(v[0], "vector entry")
    for xi, vi in zip(xs, v[1:]):
        acc -= _int(vi, "vector entry") * _int(xi, "basis entry")
    return acc % q == 0


def _sides(n: int, q: int, ns: Fraction, fn: int, fd: int, pn: int, pd: int):
    a, b = ns.numerator, ns.denominator
    if n % 2 == 0:
        m = n // 2
        lhs = a ** m * pn ** m * fd ** n
        rhs = fn ** n * q * factorial(m) * b ** m * pd ** m
    else:
        m = (n - 1) // 2
        lhs = (a ** n * pn ** (2 * m) * 4 ** (2 * m + 2)
               * factorial(m + 1) ** 2 * fd ** (2 * n))
        rhs = (fn ** (2 * n) * q ** 2 * factorial(2 * m + 2) ** 2
               * b ** n * pd ** (2 * m))
    return lhs, rhs


def decide(n: int, q: int, norm_squared, factor=Fraction(21, 20), digits: int = 60):
    """Is ||v|| <= factor * GH?  ADMISSIBLE, REFUSED, or UNDECIDED.

    UNDECIDED is returned only when the pi bracket is too loose to separate the
    two sides, which is a statement about the precision asked for and is fixed
    by raising `digits`.  It is never used to mean "the input was vague" --
    that case is the caller's to model, by passing an interval of norms.
    """
    n = _int(n, "dimension")
    q = _int(q, "determinant")
    if isinstance(norm_squared, float) or isinstance(factor, float):
        raise IngestError("norms and factors must be exact (int or Fraction)")
    ns = Fraction(norm_squared)
    f = Fraction(factor)
    lo, hi, S = pi_bracket(digits)
    # the largest pi makes the left side largest, so it decides admissibility
    l_hi, r_hi = _sides(n, q, ns, f.numerator, f.denominator, hi, S)
    if l_hi <= r_hi:
        return ADMISSIBLE
    l_lo, r_lo = _sides(n, q, ns, f.numerator, f.denominator, lo, S)
    if l_lo > r_lo:
        return REFUSED
    return UNDECIDED


def ratio_bracket(n: int, q: int, norm_squared, digits: int = 60, steps: int = 40):
    """A certified bracket on ||v|| / GH, by bisecting the factor with `decide`.

    The bracket inherits the proof and needs no n-th root anywhere.
    """
    lo, hi, den = 0, 4, 1
    for _ in range(steps):
        lo, hi, den = lo * 2, hi * 2, den * 2
        mid = (lo + hi) // 2
        v = decide(n, q, norm_squared, Fraction(mid, den), digits)
        if v == UNDECIDED:
            break
        if v == ADMISSIBLE:
            hi = mid
        else:
            lo = mid
    return Fraction(lo, den), Fraction(hi, den)
