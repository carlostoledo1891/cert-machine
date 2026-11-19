#!/usr/bin/env python3
"""lamp.py -- decider adapter: a hidden Markov jump network read through a binary lamp at Poisson times.

Written by the control room from the definitions alone (no code of any track), 2026-11-19, for the run on the least
dissipation of a time-symmetric blinking light. Format: lamp-network-1.

THE DEFINITIONS
  States 0..N-1, rates k_ij > 0 on the listed directed edges; the generator L has L_ij = k_ij and L_ii = -sum_j k_ij.
  Every state is even under time reversal. The lamp f(i) is +1 or -1. The lamp is read at the times of an
  independent Poisson clock of rate r, so the kernel between two readings is K = r (r I - L)^(-1).
  pi is the stationary law (pi L = 0, sum pi = 1); the network must be irreducible.
      C1 = sum_i pi_i f_i (K f)_i          readings one apart
      C2 = sum_i pi_i f_i (K^2 f)_i        readings two apart
      sigma = sum over unordered pairs {i, j} of (pi_i k_ij - pi_j k_ji) ln(pi_i k_ij / (pi_j k_ji)), in k_B per
              second; an edge listed without its reverse is refused (its sigma is infinite).

A FILE is JSON:
  {"format": "lamp-network-1",
   "r": "2", "target": {"C1": "3/10", "C2": "2/25"},
   "N": 4, "lamp": [1, 1, -1, -1],
   "rates": [[0, 1, "3"], [1, 0, "1"], ...],         each rate a positive rational: "3", "7/2" or "0.125"
   "free": [[0, 1], [1, 2]],                         OPTIONAL: two listed edges whose rates are the unknowns
   "box": [["2.99", "3.01"], ["0.99", "1.01"]],      with "free": a box for each, rational endpoints, lo < hi
   "claim": {"sigma_at_most": "2.2"}}                OPTIONAL: the stated upper bound on sigma (k_B per second)

  Without "free" the rates are exact: C1 and C2 are computed in rational arithmetic and must equal the target
  exactly. With "free" (the listed rates of the two free edges are ignored), the Krawczyk test on
  F = (C1 - C1*, C2 - C2*) over the box, in interval arithmetic with outward rounding (mpmath iv, 256 bits), must
  prove that exactly one choice of the two free rates in the box reproduces the target exactly. In both cases sigma
  is enclosed (over the whole box when there is one) with interval logarithms.

VERDICTS (one JSON line, last)
  CERTIFIED  the network reproduces the target exactly and, when a claim is made, sigma <= sigma_at_most.
  REFUTED    a stated fact is false: exact rates that miss the target, or a sigma enclosure entirely above the claim.
  REFUSED    unreadable; not irreducible; an edge without its reverse; Krawczyk not conclusive on this box;
             a sigma enclosure that straddles the claim.
  The summary gives sigma's enclosure and g = sigma / r."""
import json, sys
from fractions import Fraction as Q

try:
    from mpmath import iv
except Exception:                                    # pragma: no cover
    print(json.dumps({'verdict': 'REFUSED', 'summary': 'mpmath is not installed: no interval arithmetic'})); sys.exit(0)
iv.prec = 256
N_MAX = 400


class Refuse(Exception):
    pass


def rat(x, what):
    try:
        v = Q(str(x))
    except Exception:
        raise Refuse('%s is not a rational number: %r' % (what, x))
    return v


def I(q):                                            # an exact rational as a (thin) rigorous interval
    q = Q(q)
    return iv.mpf(q.numerator) / iv.mpf(q.denominator)


def contains_zero(x): return x.a <= 0 <= x.b


def mag(x): return max(abs(float(x.a)), abs(float(x.b)))


# ---------------------------------------------------------------------------------------------- linear algebra
def solve(A, b, zero, one):
    """Gaussian elimination with partial pivoting; works for Fractions (exact) and for iv intervals (rigorous)."""
    n = len(A); M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: (mag(M[r][c]) if not isinstance(M[r][c], Q) else abs(M[r][c])))
        piv = M[p][c]
        if (isinstance(piv, Q) and piv == 0) or (not isinstance(piv, Q) and contains_zero(piv)):
            raise Refuse('a linear system is singular (or not resolved by interval elimination) at column %d' % c)
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            if (isinstance(M[r][c], Q) and M[r][c] == 0): continue
            fac = M[r][c] / M[c][c]
            for k in range(c, n + 1): M[r][k] = M[r][k] - fac * M[c][k]
    x = [zero] * n
    for c in range(n - 1, -1, -1):
        s = M[c][n]
        for k in range(c + 1, n): s = s - M[c][k] * x[k]
        x[c] = s / M[c][c]
    return x


def generator(N, rates, zero):
    L = [[zero] * N for _ in range(N)]
    for (i, j), k in rates.items():
        L[i][j] = L[i][j] + k; L[i][i] = L[i][i] - k
    return L


def stats(N, L, f, r, zero, one, want_parts=False):
    """pi, Kf, K^2 f, C1, C2 for a generator L (Fractions or intervals)."""
    A = [[L[j][i] for j in range(N)] for i in range(N - 1)] + [[one] * N]       # pi L = 0, sum pi = 1
    pi = solve(A, [zero] * (N - 1) + [one], zero, one)
    Mt = [[(r if i == j else zero) - L[i][j] for j in range(N)] for i in range(N)]  # r I - L
    u = solve(Mt, f, zero, one); Kf = [r * x for x in u]
    w = solve(Mt, Kf, zero, one); K2f = [r * x for x in w]
    C1 = sum((pi[i] * f[i] * Kf[i] for i in range(N)), zero)
    C2 = sum((pi[i] * f[i] * K2f[i] for i in range(N)), zero)
    if want_parts: return pi, Kf, K2f, C1, C2, A, Mt, u, w
    return pi, C1, C2


def sigma(N, rates, pi, zero):
    s = zero
    for (i, j), kij in rates.items():
        if i < j:
            kji = rates[(j, i)]
            a, b = pi[i] * kij, pi[j] * kji
            if isinstance(a, Q): a, b = I(a), I(b)
            if a.a <= 0 or b.a <= 0: raise Refuse('a stationary flux is not enclosed away from zero')
            s = s + (a - b) * (iv.log(a) - iv.log(b))
    return s


def endpoint(x, k):
    """An interval's lower (k = 0) or upper (k = 1) end, as an exact rational."""
    from mpmath.libmp import to_rational
    p, q = to_rational(x._mpi_[k]); return Q(p, q)


def out(q, up, digits=12):
    """q printed with `digits` significant digits, rounded outward: down for a lower end, up for an upper end."""
    import decimal
    ctx = decimal.Context(prec=digits, rounding=decimal.ROUND_CEILING if up else decimal.ROUND_FLOOR)
    return str(ctx.divide(decimal.Decimal(q.numerator), decimal.Decimal(q.denominator)))


# ---------------------------------------------------------------------------------------------- the decision
def decide(d):
    if d.get('format') != 'lamp-network-1': raise Refuse('format must be "lamp-network-1"')
    r = rat(d.get('r'), 'r')
    tC1, tC2 = rat(d['target']['C1'], 'target C1'), rat(d['target']['C2'], 'target C2')
    N = d.get('N')
    if not isinstance(N, int) or not 2 <= N <= N_MAX: raise Refuse('N must be an integer from 2 to %d' % N_MAX)
    f = d.get('lamp')
    if not isinstance(f, list) or len(f) != N or any(x not in (1, -1) for x in f) or len(set(f)) != 2:
        raise Refuse('lamp must list +1 or -1 for each of the N states, both values present')
    if r <= 0: raise Refuse('r must be positive')
    rates = {}
    for e in d.get('rates', []):
        i, j, k = e
        if not (isinstance(i, int) and isinstance(j, int) and 0 <= i < N and 0 <= j < N and i != j): raise Refuse('bad edge %r' % (e,))
        if (i, j) in rates: raise Refuse('edge %d->%d listed twice' % (i, j))
        k = rat(k, 'rate %d->%d' % (i, j))
        if k <= 0: raise Refuse('rate %d->%d must be positive' % (i, j))
        rates[(i, j)] = k
    for (i, j) in rates:
        if (j, i) not in rates: raise Refuse('edge %d->%d has no reverse: its entropy production is infinite' % (i, j))
    seen, todo = {0}, [0]                                                              # irreducible (strongly connected; edges come in pairs)
    while todo:
        i = todo.pop()
        for (a, b) in rates:
            if a == i and b not in seen: seen.add(b); todo.append(b)
    if len(seen) != N: raise Refuse('the network is not irreducible: %d of %d states reachable from state 0' % (len(seen), N))
    claim = d.get('claim', {}).get('sigma_at_most')
    claim = None if claim is None else rat(claim, 'sigma_at_most')
    fq = [Q(x) for x in f]

    free = d.get('free')
    if not free:
        L = generator(N, rates, Q(0))
        pi, C1, C2 = stats(N, L, fq, r, Q(0), Q(1))
        if any(p <= 0 for p in pi): raise Refuse('a stationary probability is not positive')
        if (C1, C2) != (tC1, tC2):
            return 'REFUTED', 'the exact rates give C1 = %s and C2 = %s, not the target %s and %s' % (C1, C2, tC1, tC2), None
        s = sigma(N, rates, pi, iv.mpf(0))
        how = 'exact rates: C1 = %s and C2 = %s exactly' % (C1, C2)
    else:
        if len(free) != 2: raise Refuse('"free" names exactly two edges')
        fe = [tuple(x) for x in free]
        if any(e not in rates for e in fe) or fe[0] == fe[1]: raise Refuse('each free edge must be a listed edge, and the two must differ')
        box = [(rat(lo, 'box'), rat(hi, 'box')) for lo, hi in d.get('box', [])]
        if len(box) != 2 or any(not (0 < lo < hi) for lo, hi in box): raise Refuse('box: two intervals [lo, hi] with 0 < lo < hi')
        B = [iv.mpf([I(lo).a, I(hi).b]) for lo, hi in box]
        mid = [(lo + hi) / 2 for lo, hi in box]
        zero, one = iv.mpf(0), iv.mpf(1)
        fi = [iv.mpf(x) for x in f]

        def interval_rates(vals):
            out = {e: I(k) for e, k in rates.items()}
            for e, v in zip(fe, vals): out[e] = v
            return out

        # F at the midpoint (thin intervals)
        Rm = interval_rates([I(x) for x in mid])
        _, C1m, C2m = stats(N, generator(N, Rm, zero), fi, I(r), zero, one)
        Fm = [C1m - I(tC1), C2m - I(tC2)]
        # the Jacobian enclosed over the whole box
        RB = interval_rates(B)
        LB = generator(N, RB, zero)
        pi, Kf, K2f, C1, C2, A, Mt, u, w = stats(N, LB, fi, I(r), zero, one, want_parts=True)
        J = []
        rI = I(r)
        for (a, b) in fe:
            def dLx(x):                                                                 # (dL x)_i = [i == a] (x_b - x_a)
                y = [zero] * N; y[a] = x[b] - x[a]; return y
            def dLTpi():                                                                # ((dL)^T pi)_j
                y = [zero] * N; y[b] = y[b] + pi[a]; y[a] = y[a] - pi[a]; return y
            t = dLTpi()
            dpi = solve(A, [-t[i] for i in range(N - 1)] + [zero], zero, one)
            dKf = [rI * x for x in solve(Mt, dLx(u), zero, one)]
            dK2f = [rI * (x + y) for x, y in zip(solve(Mt, dLx(w), zero, one), solve(Mt, dKf, zero, one))]
            dC1 = sum((dpi[i] * fi[i] * Kf[i] + pi[i] * fi[i] * dKf[i] for i in range(N)), zero)
            dC2 = sum((dpi[i] * fi[i] * K2f[i] + pi[i] * fi[i] * dK2f[i] for i in range(N)), zero)
            J.append((dC1, dC2))
        Jm = [[J[0][0], J[1][0]], [J[0][1], J[1][1]]]                                   # rows: C1, C2; columns: free edges
        a11, a12, a21, a22 = (float(Jm[0][0].mid), float(Jm[0][1].mid), float(Jm[1][0].mid), float(Jm[1][1].mid))
        det = a11 * a22 - a12 * a21
        if det == 0: raise Refuse('the Jacobian is singular at the box centre: these two rates cannot move C1 and C2 independently')
        Y = [[Q(a22 / det), Q(-a12 / det)], [Q(-a21 / det), Q(a11 / det)]]
        Yi = [[I(y) for y in row] for row in Y]
        Kr = []
        for i in range(2):
            v = I(mid[i]) - (Yi[i][0] * Fm[0] + Yi[i][1] * Fm[1])
            for j in range(2):
                c = (one if i == j else zero) - (Yi[i][0] * Jm[0][j] + Yi[i][1] * Jm[1][j])
                v = v + c * (B[j] - I(mid[j]))
            Kr.append(v)
        if not all(Kr[i].a > B[i].a and Kr[i].b < B[i].b for i in range(2)):
            raise Refuse('Krawczyk is not conclusive on this box (it does not map into its interior): no zero is proved; '
                         'a smaller box around a better approximation usually succeeds')
        if any(p.a <= 0 for p in pi): raise Refuse('a stationary probability is not enclosed away from zero')
        s = sigma(N, RB, pi, zero)
        how = ('two free rates (%d->%d, %d->%d): exactly one choice in the box reproduces C1 = %s and C2 = %s exactly '
               '(Krawczyk, 256-bit intervals)' % (fe[0][0], fe[0][1], fe[1][0], fe[1][1], tC1, tC2))
    lo, hi = s.a, s.b
    qlo, qhi = endpoint(s, 0), endpoint(s, 1)
    enc = 'sigma in [%s, %s] k_B/s, so g = sigma/r in [%s, %s]' % (out(qlo, False), out(qhi, True), out(qlo / r, False), out(qhi / r, True))
    sig = [out(qlo, False, 30), out(qhi, True, 30)]
    if claim is None:
        return 'CERTIFIED', '%d states, %s; %s' % (N, how, enc), sig
    cI = I(claim)
    if hi <= cI.a: return 'CERTIFIED', '%d states, %s; %s <= %s as claimed' % (N, how, enc, claim), sig
    if lo > cI.b: return 'REFUTED', '%d states, %s; but %s, above the claimed %s' % (N, how, enc, claim), sig
    raise Refuse('%s; the enclosure straddles the claimed %s' % (enc, claim))


def main():
    try:
        d = json.load(open(sys.argv[1]))
        word, summary, sig = decide(d)
        out = {'verdict': word, 'summary': summary}
        if sig: out['sigma'] = sig
    except Refuse as e:
        out = {'verdict': 'REFUSED', 'summary': str(e)}
    except Exception as e:
        out = {'verdict': 'REFUSED', 'summary': 'unreadable: %s: %s' % (type(e).__name__, e)}
    print(json.dumps(out))


if __name__ == '__main__':
    main()
