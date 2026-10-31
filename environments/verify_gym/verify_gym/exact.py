"""The one exact decider. Standard library only; no float anywhere in a decision.

Every reward verify-gym pays is decided here, and only here: the CLI, both
framework adapters, the forgery gate, the reference policies' scorecard and the
tests all import this module. A rule defined twice diverges, so it is defined
once. A second decider, written separately in JavaScript BigInt
(environments/verify_gym/check.js), re-decides every held-out answer and every
planted forgery, and any disagreement refuses the scorecard.

THE THREE REDUCTIONS. x is the constant a task names; a = p/q is a rational in
lowest terms, q >= 1. Each side of an answer is one claim, `x > a` or `x < a`,
and each comes out CERTIFIED, REFUTED, or REFUSED (outside the reduction, never
guessed at).

  xx     x is the real root of x^x = N, N an integer >= 2. x^x is <= 1 on (0, 1],
         strictly increasing on [1, oo), and has no negative real root, so x > 1
         and, for a >= 1,
             x > a  iff  p^p < N^q * q^p        x < a  iff  p^p > N^q * q^p
         (raise a^a < N to the q-th power; equality would make x = a). A bar below
         1 is REFUSED: the claim may be true, but this reduction does not decide it.
  kroot  x = n^(1/k), n >= 2 and k >= 2 integers. For a > 0,
             x > a  iff  p^k < n * q^k          x < a  iff  p^k > n * q^k
         A bar at or below 0 is REFUSED.
  poly   x is the one real root of an integer polynomial P in a stated isolating
         interval (l, h). The isolation is itself decided: P(l) * P(h) < 0, and the
         Moebius-transformed polynomial (1+t)^d * P((l + h t)/(1 + t)) has exactly
         one sign variation, so by Descartes' rule P has exactly one root in (l, h).
         Then, for a in (l, h),
             x > a  iff  sign P(a) = sign P(l)  and P(a) != 0
             x < a  iff  sign P(a) = sign P(h)  and P(a) != 0
         sign P(p/q) = sign of sum c_i p^i q^(d-i), an integer. For a <= l, x > a
         holds and x < a does not; for a >= h the reverse. An instance whose
         isolation does not verify is REFUSED wholesale.

THE REWARD, on certified progress. An answer is two endpoints lo < hi. If both
sides are CERTIFIED,
    d = max(0, floor(-log10(hi - lo)))            the certified decimals
    progress = min(cap, max(0, d - d0))           d0: the decimals of the bracket the task states
    reward = progress / cap                        in [0, 1]
and reward = 0 otherwise: a REFUTED side, a REFUSED side, an unreadable answer,
lo >= hi, or an endpoint over the size limit. The floor of -log10 is computed by
integer comparison (hi - lo = u/v; d is the largest k with u * 10^k <= v). Copying
the stated bracket scores exactly 0, because its own decimals are d0.

THE SIZE LIMIT, so no answer can stall the grader. An endpoint is at most 80
characters of digits before it is read (checked on the text, before int()); then,
in lowest terms, |numerator| and denominator must each be below the family's
limit (xx 10^5; kroot and poly 10^30). An answer over either is MALFORMED and the
arithmetic never runs. The worst xx decision is then two powers of six-digit
integers (about 0.2 s on Python 3.9); every kroot and poly decision is microseconds.
"""
from __future__ import annotations

import re
from fractions import Fraction

CERTIFIED, REFUTED, REFUSED = "CERTIFIED", "REFUTED", "REFUSED"
MALFORMED = "MALFORMED"

RAW_DIGITS = 80                     # the most digits an endpoint's text may carry, checked before int()
_DEC = re.compile(r"^(-?)(\d{1,%d})(?:\.(\d{1,%d}))?$" % (RAW_DIGITS, RAW_DIGITS))
_FRAC = re.compile(r"^(-?)(\d{1,%d})/(\d{1,%d})$" % (RAW_DIGITS, RAW_DIGITS))


# ---- reading an endpoint ---------------------------------------------------------------------------------
def read_rational(text):
    """An endpoint's text -> (Fraction, None) or (None, why). Exact: a finite decimal IS a rational.

    Accepted: an integer, a finite decimal, or p/q with q > 0. Refused: exponents, signs other than a
    leading '-', spaces inside, more than RAW_DIGITS digits in any part, anything else. The length is
    checked on the text, so an endpoint of a million digits is refused without being converted."""
    if not isinstance(text, str):
        return None, "an endpoint is not a string of digits"
    s = text.strip()
    if len(s) > 2 * RAW_DIGITS + 2:
        return None, "an endpoint is longer than %d characters" % (2 * RAW_DIGITS + 2)
    m = _FRAC.match(s)
    if m:
        p, q = int(m.group(2)), int(m.group(3))
        if q == 0:
            return None, "a zero denominator"
        return Fraction(-p if m.group(1) else p, q), None
    m = _DEC.match(s)
    if m:
        whole, frac = m.group(2), m.group(3) or ""
        v = Fraction(int(whole + frac), 10 ** len(frac))
        return (-v if m.group(1) else v), None
    return None, "not an integer, a finite decimal or p/q: %r" % s[:40]


def within(a, limit):
    """|numerator| and denominator of a (lowest terms) both below `limit`."""
    return abs(a.numerator) < limit and a.denominator < limit


# ---- the sides --------------------------------------------------------------------------------------------
def _cmp(u, v):
    return (u > v) - (u < v)


def side_xx(N, a, rel):
    """x > a ('gt') or x < a ('lt') for the root of x^x = N."""
    if not (isinstance(N, int) and N >= 2):
        return REFUSED, "N is not an integer >= 2"
    if a < 1:
        return REFUSED, "a bar below 1 is outside the reduction (x^x is not monotone on (0, 1))"
    p, q = a.numerator, a.denominator
    c = _cmp(p ** p, N ** q * q ** p)            # sign of a^a - N, raised to the q-th power
    hold = c < 0 if rel == "gt" else c > 0
    return (CERTIFIED if hold else REFUTED), "p^p %s N^q*q^p" % ("<" if c < 0 else ">" if c > 0 else "=")


def side_kroot(n, k, a, rel):
    """x > a or x < a for x = n^(1/k)."""
    if not (isinstance(n, int) and isinstance(k, int) and n >= 2 and k >= 2):
        return REFUSED, "n or k is not an integer >= 2"
    if a <= 0:
        return REFUSED, "a bar at or below 0 is outside the reduction"
    p, q = a.numerator, a.denominator
    c = _cmp(p ** k, n * q ** k)
    hold = c < 0 if rel == "gt" else c > 0
    return (CERTIFIED if hold else REFUTED), "p^k %s n*q^k" % ("<" if c < 0 else ">" if c > 0 else "=")


def poly_sign(coeffs, a):
    """sign P(a), P given by integer coefficients from the leading one down; exact."""
    p, q = a.numerator, a.denominator
    d = len(coeffs) - 1
    s = 0
    for i, c in enumerate(coeffs):               # c is the coefficient of x^(d - i)
        s += c * p ** (d - i) * q ** i
    return _cmp(s, 0)


def _poly_mul(u, v):
    out = [0] * (len(u) + len(v) - 1)
    for i, x in enumerate(u):
        if x:
            for j, y in enumerate(v):
                out[i + j] += x * y
    return out


def _poly_pow(u, n):
    out = [1]
    for _ in range(n):
        out = _poly_mul(out, u)
    return out


def variations(coeffs, l, h):
    """Sign variations of (1+t)^d * P((l + h t)/(1 + t)), coefficients in t (Descartes' bound on (l, h))."""
    a, b = l.numerator, l.denominator
    c, e = h.numerator, h.denominator
    d = len(coeffs) - 1
    # x = (a e + c b t) / (b e (1 + t)); multiply P by (b e (1 + t))^d
    num = [a * e, c * b]                          # a e + c b t, ascending in t
    den = [b * e, b * e]                          # b e (1 + t)
    total = [0] * (d + 1)
    for i, coef in enumerate(coeffs):
        k = d - i                                 # coef * x^k
        if coef == 0:
            continue
        term = _poly_mul(_poly_pow(num, k), _poly_pow(den, d - k))
        for j, v in enumerate(term):
            total[j] += coef * v
    signs = [(_cmp(v, 0)) for v in total if v != 0]
    return sum(1 for s, t in zip(signs, signs[1:]) if s != t)


_ISO = {}


def isolation_ok(coeffs, l, h):
    """The stated isolating interval verifies: l < h, P(l) P(h) < 0, exactly one sign variation."""
    key = (tuple(coeffs), l, h)
    if key not in _ISO:
        ok = (len(coeffs) >= 2 and coeffs[0] != 0 and all(isinstance(c, int) for c in coeffs) and l < h
              and poly_sign(coeffs, l) * poly_sign(coeffs, h) < 0 and variations(coeffs, l, h) == 1)
        if len(_ISO) > 4096:
            _ISO.clear()
        _ISO[key] = ok
    return _ISO[key]


def side_poly(coeffs, l, h, a, rel):
    """x > a or x < a for the one root of P in (l, h)."""
    if not isolation_ok(coeffs, l, h):
        return REFUSED, "the stated isolating interval does not verify"
    if a <= l:
        return (CERTIFIED if rel == "gt" else REFUTED), "a is at or below the isolating interval"
    if a >= h:
        return (REFUTED if rel == "gt" else CERTIFIED), "a is at or above the isolating interval"
    s = poly_sign(coeffs, a)
    if s == 0:
        return REFUTED, "P(a) = 0: a is the root, and neither strict side holds"
    below = s == poly_sign(coeffs, l)             # a is on l's side of the root
    hold = below if rel == "gt" else not below
    return (CERTIFIED if hold else REFUTED), "sign P(a) = sign P(%s)" % ("l" if below else "h")


def side(family, inst, rel, a):
    """The word on `x REL a` for an instance of a family. The dispatch is by family id, nothing else."""
    if rel not in ("gt", "lt"):
        return REFUSED, "unknown relation"
    if family == "xx":
        return side_xx(inst["N"], a, rel)
    if family == "kroot":
        return side_kroot(inst["n"], inst["k"], a, rel)
    if family == "poly":
        return side_poly(inst["coeffs"], Fraction(inst["lo0"]), Fraction(inst["hi0"]), a, rel)
    return REFUSED, "no decider for family %r" % family


# ---- the reward -------------------------------------------------------------------------------------------
def decimals(w):
    """max(0, floor(-log10 w)) for a rational w > 0, by integer comparison."""
    u, v = w.numerator, w.denominator
    if u > v:
        return 0
    k = max(0, len(str(v)) - len(str(u)) - 1)      # a lower estimate (both are small: the size limit holds)
    while u * 10 ** (k + 1) <= v:
        k += 1
    return k


def grade_endpoints(family, inst, lo_text, hi_text, limit, cap, d0):
    """The whole decision on one answer, from its two endpoint texts. Returns a dict:
    verdict (CERTIFIED / REFUTED / REFUSED / MALFORMED), sides, decimals, progress, reward, note."""
    out = {"verdict": MALFORMED, "sides": [None, None], "decimals": 0, "progress": 0, "reward": 0.0, "note": ""}
    lo, why = read_rational(lo_text)
    if lo is None:
        out["note"] = "lo: " + why
        return out
    hi, why = read_rational(hi_text)
    if hi is None:
        out["note"] = "hi: " + why
        return out
    if not lo < hi:
        out["note"] = "lo >= hi"
        return out
    if not (within(lo, limit) and within(hi, limit)):
        out["note"] = "an endpoint is over the size limit (numerator and denominator below %s)" % _pow10(limit)
        return out
    wl, nl = side(family, inst, "gt", lo)
    wh, nh = side(family, inst, "lt", hi)
    out["sides"] = [wl, wh]
    if REFUTED in (wl, wh):
        out["verdict"] = REFUTED
        out["note"] = ("x > lo: " + nl) if wl == REFUTED else ("x < hi: " + nh)
        return out
    if REFUSED in (wl, wh):
        out["verdict"] = REFUSED
        out["note"] = nl if wl == REFUSED else nh
        return out
    d = decimals(hi - lo)
    progress = min(cap, max(0, d - d0))
    out.update(verdict=CERTIFIED, decimals=d, progress=progress, reward=progress / cap,
               note="both sides certified; %d certified decimals, %d beyond the stated bracket" % (d, d - d0))
    return out


def _pow10(limit):
    k = len(str(limit)) - 1
    return "10^%d" % k if 10 ** k == limit else str(limit)
