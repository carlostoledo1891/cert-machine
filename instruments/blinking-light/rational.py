#!/usr/bin/env python3
"""rational.py -- decide a lamp-network-1 file whose rates are ALL rational, in exact arithmetic.

Written for the blinking-light record (notes/blinking-light-preregistration-2026-11-19.md) from the format's
definitions alone (GOAL.md and the format paragraph quoted in the task); it shares no code with the run's checker
(lamp.py / lamp-v2.py) or with any program of either track, none of which its author opened.

Definitions (the format's, verbatim in substance):
  states 0..N-1, rates k_ij > 0 on the listed directed edges; L_ij = k_ij, L_ii = -sum_j k_ij.
  lamp f_i = +1 or -1; readings at the times of an independent Poisson clock of rate r: K = r (r I - L)^-1.
  pi the stationary law (pi L = 0, sum pi = 1); the network must be irreducible.
  C1 = sum_i pi_i f_i (K f)_i,  C2 = sum_i pi_i f_i (K^2 f)_i,
  sigma = sum over unordered pairs {i,j} of (pi_i k_ij - pi_j k_ji) ln(pi_i k_ij / (pi_j k_ji))   (k_B per second);
  an edge listed without its reverse is refused (its sigma is infinite).  g = sigma / r.

Method:
  * every number is a fractions.Fraction; pi, K f and K^2 f come from an exact sparse Gaussian elimination, and each
    solution is then CHECKED by exact substitution (pi L = 0 for every column, sum pi = 1, pi > 0,
    (r I - L) x = r f, (r I - L) y = r x), so a fault in the solver cannot pass silently;
  * C1 and C2 are exact rationals, compared with the target by equality;
  * each logarithm ln(x), x a positive rational, is enclosed by [lo, hi] with rational ends:
        x = 2^k m with m in [3/4, 3/2];  ln x = k ln 2 + 2 atanh(y),  y = (m-1)/(m+1) in [-1/7, 1/5];
        ln 2 = 2 atanh(1/3);
        atanh(y) = sum_{n>=0} y^(2n+1)/(2n+1) for |y| < 1; for 0 <= y every term is >= 0, so a partial sum is a
        lower bound, and the tail after M terms is <= y^(2M+1) / ((2M+1)(1 - y^2)).
    The partial sums are computed in integer fixed point with 2^-W units, every product and quotient rounded DOWN
    for the lower sum and UP for the upper sum (all quantities non-negative), so the enclosure is rigorous with no
    reliance on any library's rounding claim. atanh is odd, which handles y < 0.
  * sigma's enclosure is the exact sum of the enclosures of J_e ln(x_e), J_e = a_e - b_e (sign of J = sign of ln x).

Verdicts: CERTIFIED (C1, C2 exactly the target, and sigma_hi <= claim when a claim is given; with no claim, the file
reproduces the target exactly and sigma is enclosed); REFUTED (C1 or C2 differs from the target -- the exact values
are printed -- or sigma_lo > claim); REFUSED (out of scope, malformed, reducible, an edge without its reverse, or an
enclosure that straddles the claim). Exit 0 on CERTIFIED, 1 otherwise.

Usage:  python3 rational.py FILE [--bits W]
Import: from rational import decide;  decide(net_dict) -> dict
Python 3.9 standard library only.
"""

import json
import sys
from fractions import Fraction

W_DEFAULT = 192          # fixed-point bits for the logarithm enclosures
DEC_PLACES = 18          # decimal places printed for the outward-rounded enclosures


# ----------------------------------------------------------------------------------------------- parsing helpers

class Refuse(Exception):
    """A file this program will not decide (malformed or out of scope)."""


def _rational(x, what):
    if isinstance(x, bool):
        raise Refuse("%s: not a rational (%r)" % (what, x))
    if isinstance(x, int):
        return Fraction(x)
    if isinstance(x, str):
        try:
            v = Fraction(x.strip())
        except (ValueError, ZeroDivisionError):
            raise Refuse("%s: not a rational string (%r)" % (what, x))
        return v
    raise Refuse("%s: must be a string such as \"3\", \"7/2\" or \"0.125\" (got %r)" % (what, type(x).__name__))


def _dec(x, places, up):
    """Outward decimal string for the Fraction x: rounded up (up=True) or down to `places` decimal places."""
    scale = 10 ** places
    n = x * scale
    q = n.numerator // n.denominator          # floor
    if up and q * n.denominator != n.numerator:
        q += 1
    sign = "-" if q < 0 else ""
    q = abs(q)
    s = str(q).rjust(places + 1, "0")
    return "%s%s.%s" % (sign, s[:-places], s[-places:])


# ------------------------------------------------------------------------------------------ exact sparse solver

def sparse_solve(rows, rhs):
    """Solve A x = b exactly. rows: list of n dicts {col: Fraction}; rhs: list of n Fractions.
    Gaussian elimination, pivot = sparsest active row holding a non-zero in the current column.
    Returns the list x, or raises Refuse if A is singular. The caller verifies A x = b by substitution."""
    n = len(rows)
    R = [dict(r) for r in rows]
    b = list(rhs)
    colrows = {}
    for i, r in enumerate(R):
        for j in r:
            colrows.setdefault(j, set()).add(i)
    active = set(range(n))
    order = []
    for k in range(n):
        cands = [i for i in colrows.get(k, ()) if i in active]
        if not cands:
            raise Refuse("singular linear system at column %d" % k)
        p = min(cands, key=lambda i: (len(R[i]), i))
        piv = R[p][k]
        prow = R[p]
        for i in cands:
            if i == p:
                continue
            fac = R[i][k] / piv
            ri = R[i]
            for j, v in prow.items():
                nv = ri.get(j, 0) - fac * v
                if nv == 0:
                    if j in ri:
                        del ri[j]
                        colrows[j].discard(i)
                else:
                    if j not in ri:
                        colrows.setdefault(j, set()).add(i)
                    ri[j] = nv
            b[i] -= fac * b[p]
        active.discard(p)
        order.append((p, k))
    x = [Fraction(0)] * n
    for p, k in reversed(order):
        s = b[p]
        for j, v in R[p].items():
            if j != k:
                s -= v * x[j]
        x[k] = s / R[p][k]
    return x


# ----------------------------------------------------------------------------------- rigorous logarithm enclosure

def _ceil_div(a, b):
    return -((-a) // b)


def _atanh_nonneg(y, W):
    """0 <= y < 1/2 (Fraction). Returns (lo, hi), Fractions, lo <= atanh(y) <= hi."""
    if y == 0:
        return Fraction(0), Fraction(0)
    one = 1 << W
    yn, yd = y.numerator, y.denominator
    p_lo = (yn << W) // yd                  # floor(y 2^W)   <= y 2^W
    p_hi = _ceil_div(yn << W, yd)           # ceil(y 2^W)    >= y 2^W
    y2 = y * y
    s_lo = (y2.numerator << W) // y2.denominator
    s_hi = _ceil_div(y2.numerator << W, y2.denominator)
    sum_lo = 0
    sum_hi = 0
    n = 0
    # invariant: p_lo / 2^W <= y^(2n+1) <= p_hi / 2^W
    while True:
        k = 2 * n + 1
        sum_lo += p_lo // k
        sum_hi += _ceil_div(p_hi, k)
        p_lo = (p_lo * s_lo) >> W
        p_hi = _ceil_div(p_hi * s_hi, one)
        n += 1
        if p_hi <= 1:
            break
    k = 2 * n + 1
    # tail sum_{m>=n} y^(2m+1)/(2m+1) <= y^(2n+1) / ((2n+1)(1 - y^2)) <= (p_hi/2^W) / ((2n+1)(1 - y^2))
    tail = Fraction(p_hi, k * one) / (1 - y2)
    return Fraction(sum_lo, one), Fraction(sum_hi, one) + tail


def _atanh(y, W):
    if y >= 0:
        return _atanh_nonneg(y, W)
    lo, hi = _atanh_nonneg(-y, W)
    return -hi, -lo


_LN2_CACHE = {}


def _ln2(W):
    if W not in _LN2_CACHE:
        lo, hi = _atanh_nonneg(Fraction(1, 3), W)
        _LN2_CACHE[W] = (2 * lo, 2 * hi)
    return _LN2_CACHE[W]


def ln_enclosure(x, W=W_DEFAULT):
    """x > 0 a Fraction. Returns (lo, hi), Fractions, with lo <= ln x <= hi."""
    if x <= 0:
        raise ValueError("ln of a non-positive number")
    if x == 1:
        return Fraction(0), Fraction(0)
    k = x.numerator.bit_length() - x.denominator.bit_length()
    m = x / (Fraction(2) ** k) if k >= 0 else x * (2 ** (-k))
    while m > Fraction(3, 2):
        m /= 2
        k += 1
    while m < Fraction(3, 4):
        m *= 2
        k -= 1
    y = (m - 1) / (m + 1)                     # |y| <= 1/5
    a_lo, a_hi = _atanh(y, W)
    l2_lo, l2_hi = _ln2(W)
    if k >= 0:
        return k * l2_lo + 2 * a_lo, k * l2_hi + 2 * a_hi
    return k * l2_hi + 2 * a_lo, k * l2_lo + 2 * a_hi


# ------------------------------------------------------------------------------------------------------- decide

def decide(net, W=W_DEFAULT):
    out = {"verdict": None, "N": None, "C1": None, "C2": None, "sigma_lo": None, "sigma_hi": None,
           "g_lo": None, "g_hi": None, "claim": None, "reason": None}
    try:
        return _decide(net, W, out)
    except Refuse as e:
        out["verdict"] = "REFUSED"
        out["reason"] = str(e)
        return out


def _decide(net, W, out):
    if not isinstance(net, dict):
        raise Refuse("the file is not a JSON object")
    if net.get("format") != "lamp-network-1":
        raise Refuse("format is %r, not 'lamp-network-1'" % (net.get("format"),))
    if "free" in net or "box" in net:
        raise Refuse("out of scope: the file names free edges (\"free\"/\"box\"); this program decides only "
                     "networks whose rates are all rational")
    r = _rational(net.get("r"), "r")
    if r <= 0:
        raise Refuse("r must be positive")
    tgt = net.get("target")
    if not isinstance(tgt, dict) or "C1" not in tgt or "C2" not in tgt:
        raise Refuse("target must give C1 and C2")
    t1 = _rational(tgt["C1"], "target C1")
    t2 = _rational(tgt["C2"], "target C2")
    N = net.get("N")
    if not isinstance(N, int) or isinstance(N, bool) or N < 1:
        raise Refuse("N must be a positive integer")
    out["N"] = N
    lamp = net.get("lamp")
    if not isinstance(lamp, list) or len(lamp) != N or any(
            isinstance(x, bool) or not isinstance(x, int) or x not in (1, -1) for x in lamp):
        raise Refuse("lamp must be a list of N entries, each 1 or -1")
    f = [Fraction(x) for x in lamp]
    claim = None
    if "claim" in net and net["claim"] is not None:
        c = net["claim"]
        if not isinstance(c, dict) or set(c.keys()) != {"sigma_at_most"}:
            raise Refuse("claim must be {\"sigma_at_most\": rational}")
        claim = _rational(c["sigma_at_most"], "claim sigma_at_most")
        out["claim"] = {"sigma_at_most": c["sigma_at_most"]}
    rates = net.get("rates")
    if not isinstance(rates, list) or not rates:
        raise Refuse("rates must be a non-empty list")
    k = {}
    for e in rates:
        if not isinstance(e, list) or len(e) != 3:
            raise Refuse("each rate must be [i, j, rate]")
        i, j, v = e
        if not all(isinstance(z, int) and not isinstance(z, bool) for z in (i, j)):
            raise Refuse("edge ends must be integers: %r" % (e,))
        if not (0 <= i < N and 0 <= j < N):
            raise Refuse("edge %r out of range 0..N-1" % (e[:2],))
        if i == j:
            raise Refuse("self-loop on state %d" % i)
        if (i, j) in k:
            raise Refuse("edge %d->%d listed twice" % (i, j))
        val = _rational(v, "rate %d->%d" % (i, j))
        if val <= 0:
            raise Refuse("rate %d->%d is not positive" % (i, j))
        k[(i, j)] = val
    for (i, j) in k:
        if (j, i) not in k:
            raise Refuse("edge %d->%d listed without its reverse: its sigma is infinite" % (i, j))
    # irreducibility: every state reachable from 0 forwards and backwards
    fwd = {i: [] for i in range(N)}
    bwd = {i: [] for i in range(N)}
    for (i, j) in k:
        fwd[i].append(j)
        bwd[j].append(i)
    for adj, name in ((fwd, "forward"), (bwd, "backward")):
        seen = {0}
        stack = [0]
        while stack:
            u = stack.pop()
            for w in adj[u]:
                if w not in seen:
                    seen.add(w)
                    stack.append(w)
        if len(seen) != N:
            raise Refuse("not irreducible: %d of %d states reachable %s from state 0" % (len(seen), N, name))
    out_rate = [Fraction(0)] * N
    for (i, j), v in k.items():
        out_rate[i] += v

    # stationary law: column equations of pi L = 0 for j = 0..N-2, plus sum pi = 1 (replacing column N-1)
    rows = [dict() for _ in range(N)]
    for j in range(N - 1):
        rows[j][j] = -out_rate[j]
    for (i, j), v in k.items():
        if j != N - 1:
            rows[j][i] = v
    rows[N - 1] = {i: Fraction(1) for i in range(N)}
    rhs = [Fraction(0)] * (N - 1) + [Fraction(1)]
    pi = sparse_solve(rows, rhs)
    # verify by substitution: every column of pi L, the normalisation, positivity
    col = [-pi[j] * out_rate[j] for j in range(N)]
    for (i, j), v in k.items():
        col[j] += pi[i] * v
    if any(c != 0 for c in col) or sum(pi) != 1:
        raise Refuse("internal: the stationary law failed its exact substitution check")
    if any(x <= 0 for x in pi):
        raise Refuse("internal: a stationary mass is not positive")

    # K f and K^2 f:  (r I - L) x = r f,  (r I - L) y = r x
    M = [dict() for _ in range(N)]
    for i in range(N):
        M[i][i] = r + out_rate[i]
    for (i, j), v in k.items():
        M[i][j] = -v

    def apply_M(z):
        res = [(r + out_rate[i]) * z[i] for i in range(N)]
        for (i, j), v in k.items():
            res[i] -= v * z[j]
        return res

    x = sparse_solve(M, [r * fi for fi in f])
    if apply_M(x) != [r * fi for fi in f]:
        raise Refuse("internal: K f failed its exact substitution check")
    y = sparse_solve(M, [r * xi for xi in x])
    if apply_M(y) != [r * xi for xi in x]:
        raise Refuse("internal: K^2 f failed its exact substitution check")
    C1 = sum(pi[i] * f[i] * x[i] for i in range(N))
    C2 = sum(pi[i] * f[i] * y[i] for i in range(N))
    out["C1"] = str(C1)
    out["C2"] = str(C2)

    # sigma enclosure
    s_lo = Fraction(0)
    s_hi = Fraction(0)
    for (i, j) in k:
        if i < j:
            a = pi[i] * k[(i, j)]
            b = pi[j] * k[(j, i)]
            J = a - b
            if J == 0:
                continue
            lo, hi = ln_enclosure(a / b, W)
            if J > 0:
                s_lo += J * lo
                s_hi += J * hi
            else:
                s_lo += J * hi
                s_hi += J * lo
    out["sigma_lo"] = _dec(s_lo, DEC_PLACES, up=False)
    out["sigma_hi"] = _dec(s_hi, DEC_PLACES, up=True)
    out["g_lo"] = _dec(s_lo / r, DEC_PLACES, up=False)
    out["g_hi"] = _dec(s_hi / r, DEC_PLACES, up=True)
    out["sigma_width"] = float(s_hi - s_lo)
    out["target"] = {"C1": str(t1), "C2": str(t2)}
    out["r"] = str(r)

    if C1 != t1 or C2 != t2:
        out["verdict"] = "REFUTED"
        parts = []
        if C1 != t1:
            parts.append("C1 = %s (about %.15g), not %s; C1 - target = %s (about %.6g)"
                         % (C1, float(C1), t1, C1 - t1, float(C1 - t1)))
        if C2 != t2:
            parts.append("C2 = %s (about %.15g), not %s; C2 - target = %s (about %.6g)"
                         % (C2, float(C2), t2, C2 - t2, float(C2 - t2)))
        out["reason"] = "the network does not reproduce the target exactly: " + "; ".join(parts)
        return out
    if claim is None:
        out["verdict"] = "CERTIFIED"
        out["reason"] = "C1 and C2 equal the target exactly; no claim given; sigma enclosed"
        return out
    if s_hi <= claim:
        out["verdict"] = "CERTIFIED"
        out["reason"] = "C1 and C2 equal the target exactly and sigma <= %s (upper end of the enclosure)" % claim
    elif s_lo > claim:
        out["verdict"] = "REFUTED"
        out["reason"] = "sigma > %s: the lower end of the enclosure exceeds the claim" % claim
    else:
        out["verdict"] = "REFUSED"
        out["reason"] = "the sigma enclosure straddles the claim; raise --bits"
    return out


def main(argv):
    W = W_DEFAULT
    args = list(argv[1:])
    if "--bits" in args:
        i = args.index("--bits")
        W = int(args[i + 1])
        del args[i:i + 2]
    if len(args) != 1:
        sys.stderr.write("usage: python3 rational.py FILE [--bits W]\n")
        return 2
    try:
        with open(args[0]) as fh:
            net = json.load(fh)
    except (OSError, ValueError) as e:
        res = {"verdict": "REFUSED", "reason": "cannot read the file as JSON: %s" % e}
        print(json.dumps(res, indent=1))
        return 1
    res = decide(net, W)
    res["file"] = args[0]
    print(json.dumps(res, indent=1))
    return 0 if res["verdict"] == "CERTIFIED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
