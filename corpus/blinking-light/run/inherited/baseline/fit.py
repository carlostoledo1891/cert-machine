"""fit.py -- the control room's helper (not a decider): turn a float network into a lamp-network-1 file.
All rates but two are rounded to rationals; the two free rates are re-solved by Newton in 300-bit floats so that
C1, C2 hit the target; the box is +-1e-30 around them. The decider then proves (or refuses) the exact zero."""
import json, sys
from fractions import Fraction as Q
from mpmath import mp, matrix, lu_solve, mpf
mp.prec = 300

def stats(N, rates, f, r):
    L = matrix(N, N)
    for (i, j), k in rates.items(): L[i, j] += k; L[i, i] -= k
    A = matrix(N, N)
    for i in range(N - 1):
        for j in range(N): A[i, j] = L[j, i]
    for j in range(N): A[N - 1, j] = 1
    b = matrix(N, 1); b[N - 1] = 1
    pi = lu_solve(A, b)
    Mt = matrix(N, N)
    for i in range(N):
        for j in range(N): Mt[i, j] = (r if i == j else 0) - L[i, j]
    Kf = lu_solve(Mt, matrix(f)) * r; K2f = lu_solve(Mt, Kf) * r
    return sum(pi[i] * f[i] * Kf[i] for i in range(N)), sum(pi[i] * f[i] * K2f[i] for i in range(N))

def fit(N, lamp, rates_float, free, r=2, C1=Q(3, 10), C2=Q(2, 25), den=10**6):
    rates = {e: Q(v).limit_denominator(den) for e, v in rates_float.items()}
    x = [mpf(float(rates[e])) for e in free]
    for it in range(60):
        R = {e: mpf(rates[e].numerator) / rates[e].denominator for e in rates}
        for e, v in zip(free, x): R[e] = v
        F = stats(N, R, lamp, r); F = [F[0] - mpf(C1.numerator) / C1.denominator, F[1] - mpf(C2.numerator) / C2.denominator]
        if max(abs(F[0]), abs(F[1])) < mpf(10) ** -80: break
        h = mpf(10) ** -40; J = matrix(2, 2)
        for k in range(2):
            R2 = dict(R); R2[free[k]] = x[k] + h; G = stats(N, R2, lamp, r)
            J[0, k] = (G[0] - F[0] - mpf(C1.numerator) / C1.denominator) / h; J[1, k] = (G[1] - F[1] - mpf(C2.numerator) / C2.denominator) / h
        dx = lu_solve(J, matrix(F)); x = [x[0] - dx[0], x[1] - dx[1]]
    out = {"format": "lamp-network-1", "r": str(r), "target": {"C1": str(C1), "C2": str(C2)}, "N": N, "lamp": lamp,
           "rates": [[i, j, str(rates[(i, j)])] for (i, j) in sorted(rates)], "free": [list(e) for e in free],
           "box": [[mp.nstr(v - mpf(10) ** -30, 60), mp.nstr(v + mpf(10) ** -30, 60)] for v in x]}
    return out, max(abs(F[0]), abs(F[1]))

if __name__ == '__main__':
    import math
    res = json.load(open(sys.argv[1]))
    cand = [r for r in res if r[5] and r[0] == int(sys.argv[2]) and r[2] == sys.argv[3]]
    N, k, topo, variant, seed, best = min(cand, key=lambda r: r[5][0])
    edges = [(i, (i + 1) % N) for i in range(N)] + [((i + 1) % N, i) for i in range(N)] if topo == 'ring' else [(i, j) for i in range(N) for j in range(N) if i != j]
    lamp = [1] * k + [-1] * (N - k)
    rf = {e: math.exp(t) for e, t in zip(edges, best[1])}
    out, res_ = fit(N, lamp, rf, [edges[0], edges[N]])
    out['claim'] = {'sigma_at_most': sys.argv[4]}
    json.dump(out, open(sys.argv[5], 'w'), indent=1)
    print('float sigma', best[0], 'residual', mp.nstr(res_, 5))
