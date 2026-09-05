"""The float grader, shipped on purpose.

This is what a competent person writes in an afternoon, and the environment
needs it because the gap between it and `exact` is the canary. Two versions,
because they fail for different reasons and only one of them is interesting:

    naive_float   converts the determinant to a float first. On a challenge
                  lattice past dimension ~102 that is `inf` and every
                  comparison after it is meaningless. Loud, and easy to catch.

    careful_float never touches float(q); it works in the log domain from the
                  digit string. This one is RIGHT on every real record we have
                  checked -- 37 of 37 -- because the tightest margin in the
                  published table is 1.4e-4 against a double's 1e-16.

Shipping both is the honest position. Precision is not the vulnerability in
this domain; specification is. A grader can be bit-exact and still wrong
because it compared against a quantity the claim was not about.
"""

import math

__all__ = ["naive_float", "careful_float"]


def naive_float(n: int, q: int, norm: float, factor: float = 1.05) -> str:
    """Overflows for any determinant beyond ~1e308, i.e. most of the range."""
    if norm <= 0:
        return "REFUSED"                     # the claim is about a nonzero vector
    qf = float(q)
    lg = math.lgamma(n / 2 + 1)
    gh = math.exp((math.log(qf) + lg - (n / 2) * math.log(math.pi)) / n)
    return "ADMISSIBLE" if norm <= factor * gh else "REFUSED"


def careful_float(n: int, q: int, norm: float, factor: float = 1.05) -> str:
    """Log-domain, never converts q. Agrees with the exact decision in practice."""
    if norm <= 0:
        return "REFUSED"
    s = str(q)
    log10q = (len(s) - 1) + math.log10(float(s[:17]) / 10 ** (min(17, len(s)) - 1))
    lgam10 = math.lgamma(n / 2 + 1) / math.log(10)
    log10gh = (log10q + lgam10 - (n / 2) * math.log10(math.pi)) / n
    return "ADMISSIBLE" if math.log10(norm) <= math.log10(factor) + log10gh else "REFUSED"
