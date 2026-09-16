#!/usr/bin/env python
"""
gadget.py — certified search for a better BASE GADGET.

A base gadget is a rational b×b matrix T with all column sums equal to h (so T preserves V_b),
c = |det T|, such that with Λ_1 = T(Z^b ∩ V_b) and v_1 = T e_0:
  (CUBE)  Λ_1 ∩ (−1,1)^b = {0}
  (STRIP) z ∈ Z^b ∩ V_b, t ∈ R, T(z + t e_0) ∈ (−1,1)^b  ⇒  |t| < 1
Bloom's gadget is T = I + P/2 (P the cyclic shift), h = 3/2, c = 1 + 2^{-b}.
Bloom's iteration then gives, in dimension d = b^s,  Δ_s = c^{(b^s−1)/(b−1)} / h^s.
Both conditions are decided EXACTLY by a bounded search (all boxes derived, no sampling).
"""
import sys, itertools, math, time
from fractions import Fraction as Fr

def cyc(b, coeffs):
    """T = Σ_j coeffs[j] P^j, (P z)_i = z_{i+1}: (Tz)_i = Σ_j coeffs[j] z_{i+j}."""
    T = [[Fr(0)] * b for _ in range(b)]
    for i in range(b):
        for j, c in enumerate(coeffs):
            T[i][(i + j) % b] += Fr(c)
    return T

def colsums(T): return [sum(T[i][j] for i in range(len(T))) for j in range(len(T))]

def det(M):
    n = len(M); A = [r[:] for r in M]; d = Fr(1)
    for c in range(n):
        p = next((r for r in range(c, n) if A[r][c] != 0), None)
        if p is None: return Fr(0)
        if p != c: A[c], A[p] = A[p], A[c]; d = -d
        d *= A[c][c]; inv = 1 / A[c][c]
        for r in range(c + 1, n):
            if A[r][c]: f = A[r][c] * inv; A[r] = [x - f * y for x, y in zip(A[r], A[c])]
    return d

def inverse(M):
    n = len(M); A = [M[i][:] + [Fr(int(i == j)) for j in range(n)] for i in range(n)]
    for c in range(n):
        p = next(r for r in range(c, n) if A[r][c] != 0); A[c], A[p] = A[p], A[c]
        inv = 1 / A[c][c]; A[c] = [x * inv for x in A[c]]
        for r in range(n):
            if r != c and A[r][c]: f = A[r][c]; A[r] = [x - f * y for x, y in zip(A[r], A[c])]
    return [r[n:] for r in A]

def search_box(T, extra, limit=1):
    """Enumerate z ∈ Z^b, Σz = 0, with |(Tz)_i| < 1 + extra_i for all i (extra_i ≥ 0 rational), by DFS
    with exact interval pruning; the box |z_j| ≤ ‖T^{-1}‖_∞ (1 + max extra) is a proven bound.
    Yields z (as a tuple) for each solution (the zero vector excluded)."""
    b = len(T); Tinv = inverse(T)
    bound = max(sum(abs(x) for x in row) for row in Tinv) * (1 + max(extra))
    zb = int(bound)
    rows = T
    suffix = [[Fr(0)] * (b + 1) for _ in range(b)]
    for i in range(b):
        acc = Fr(0)
        for l in range(b - 1, -1, -1):
            acc += abs(rows[i][l]) * zb; suffix[i][l] = acc
    partial = [Fr(0)] * b; z = [0] * b; out = []
    def rec(j, ssum):
        if j == b:
            if ssum == 0 and any(z) and all(abs(partial[i]) < 1 + extra[i] for i in range(b)):
                out.append(tuple(z))
            return
        # remaining coordinates can change the sum by at most (b-1-j)*zb
        for val in range(-zb, zb + 1):
            if abs(ssum + val) > (b - 1 - j) * zb: continue
            z[j] = val; ok = True
            for i in range(b):
                partial[i] += rows[i][j] * val
                if abs(partial[i]) - suffix[i][j + 1] >= 1 + extra[i]: ok = False
            if ok: rec(j + 1, ssum + val)
            for i in range(b): partial[i] -= rows[i][j] * val
        z[j] = 0
    rec(0, 0)
    return out

def check_gadget(T):
    b = len(T); cs = colsums(T)
    if any(c != cs[0] for c in cs): return dict(ok=False, why="column sums not constant")
    h = cs[0]; c = abs(det(T))
    if h <= 0 or c == 0: return dict(ok=False, why="height ≤ 0 or singular")
    # CUBE: no nonzero z ∈ Z^b ∩ V_b with Tz ∈ (−1,1)^b
    cube = search_box(T, [Fr(0)] * b)
    if cube: return dict(ok=False, why=f"cube violated by z={cube[0]}", h=h, c=c)
    # STRIP: T(z + t e0) ∈ (−1,1)^b with |t| ≥ 1.  Σ of a cube point is in (−b,b) and equals h t, so |t| < b/h.
    v = [T[i][0] for i in range(b)]; tmax = Fr(b, 1) / h
    extra = [abs(v[i]) * tmax for i in range(b)]
    for z in search_box(T, extra) + [tuple([0] * b)]:
        Tz = [sum(T[i][j] * z[j] for j in range(b)) for i in range(b)]
        lo, hi = -tmax, tmax
        for i in range(b):
            if v[i] > 0: lo = max(lo, (-1 - Tz[i]) / v[i]); hi = min(hi, (1 - Tz[i]) / v[i])
            elif v[i] < 0: lo = max(lo, (1 - Tz[i]) / v[i]); hi = min(hi, (-1 - Tz[i]) / v[i])
            elif abs(Tz[i]) >= 1: lo, hi = 1, 0
        if lo < hi and (hi > 1 or lo < -1):
            return dict(ok=False, why=f"strip violated by z={z}, t∈({float(lo):.3f},{float(hi):.3f})", h=h, c=c)
    return dict(ok=True, h=h, c=c)

def delta(c, h, b, s): return c ** ((b ** s - 1) // (b - 1)) / h ** s

if __name__ == "__main__":
    BOHMAN_F = Fr(44004, 100000)
    results = []
    alphas = [Fr(1, 2), Fr(3, 5), Fr(2, 3), Fr(3, 4), Fr(4, 5), Fr(5, 6), Fr(9, 10)]
    for b in [3, 5, 7, 9, 11]:
        for a in alphas:
            T = cyc(b, [1, a]); t0 = time.time(); R = check_gadget(T)
            tag = f"I+{a}P b={b}"
            print(f"{tag:18s} h={float(R.get('h',0)):.4f} c={float(R.get('c',0)):.6f} {'ADMISSIBLE' if R['ok'] else 'no: '+R['why']}  ({time.time()-t0:.1f}s)", flush=True)
            if R['ok']: results.append((tag, b, R['h'], R['c']))
        # two-parameter families
        for a, be in [(Fr(1,2), Fr(1,4)), (Fr(1,2), Fr(1,2)), (Fr(2,3), Fr(1,3)), (Fr(1,2), Fr(-1,4)), (Fr(3,4), Fr(1,4))]:
            for name, coeffs in [("I+aP+bP²", [1, a, be]), ("I+aP+bP⁻¹", [1, a] + [0] * (b - 3) + [be] if b >= 3 else None)]:
                if coeffs is None: continue
                T = cyc(b, coeffs); t0 = time.time(); R = check_gadget(T)
                tag = f"{name} a={a} b={be} b={b}"
                print(f"{tag:30s} h={float(R.get('h',0)):.4f} c={float(R.get('c',0)):.6f} {'ADMISSIBLE' if R['ok'] else 'no: '+R['why']}  ({time.time()-t0:.1f}s)", flush=True)
                if R['ok']: results.append((tag, b, R['h'], R['c']))
    print("\n=== admissible gadgets: Δ_s and whether they beat Bohman (f < 0.44004)")
    for tag, b, h, c in results:
        line = f"{tag:30s} h={float(h):.4f} c={float(c):.6f}: "
        for s in [2, 3, 4]:
            D = delta(c, h, b, s); line += f" s={s} d={b**s} Δ={float(D):.4f}{'*' if D < BOHMAN_F else ' '}"
        print(line)

# ---------------------------------------------------------------- structured exact STRIP check for T = I + αP
def max_magnitude(alpha):
    """largest integer m with m(1−α) < 1  (proof: at a maximal integer coordinate the cube inequality gives (1−α)m < 1)."""
    m = 0
    while (m + 1) * (1 - alpha) < 1: m += 1
    return m

def strip_tilt(alpha, b, limit=1):
    """Exact STRIP check for T = I + αP, b odd, 0<α<1, using the structure lemma:
    if x_0 ∈ R, x_1..x_{b−1} ∈ Z satisfy |x_i + α x_{i+1}| < 1 (cyclic) and not all integer coordinates vanish,
    then m = max|x_i| < 1/(1−α) and the max is attained at x_{b−1}.  Backward DFS over x_{b−2}..x_1 with |x_j| ≤ m,
    then the x_0 interval from the two mixed constraints; violation iff some x_0 there gives |Σ x| ≥ 1."""
    alpha = Fr(alpha); M = max_magnitude(alpha); viol = []; chains = 0
    for m in range(1, M + 1):
        for sigma in (1, -1):
            xb1 = sigma * m
            x = [0] * b; x[b - 1] = xb1
            def rec(j, ssum):
                nonlocal chains
                if len(viol) >= limit: return
                if j == 0:
                    chains += 1
                    lo1, hi1 = (-1 - Fr(x[b - 1])) / alpha, (1 - Fr(x[b - 1])) / alpha
                    lo2, hi2 = -1 - alpha * x[1], 1 - alpha * x[1]
                    lo, hi = max(lo1, lo2), min(hi1, hi2)
                    if lo < hi and (hi + ssum > 1 or lo + ssum < -1):
                        viol.append((tuple(x[1:]), (lo, hi), ssum))
                    return
                nxt = x[j + 1]
                # |x_j + α nxt| < 1  and |x_j| ≤ m
                lo = -1 - alpha * nxt; hi = 1 - alpha * nxt
                a0 = max(-m, math.floor(lo) + 1 if lo.denominator == 1 else math.floor(lo) + 1)
                # integers strictly inside (lo, hi)
                cand = [v for v in range(max(-m, math.floor(lo)), min(m, math.ceil(hi)) + 1) if lo < v < hi]
                for v in cand:
                    x[j] = v; rec(j - 1, ssum + v)
                x[j] = 0
            rec(b - 2, xb1)
    return dict(ok=not viol, M=M, chains=chains, viol=viol)

def cube_tilt_proof_note():
    return ("CUBE for T=I+αP (0<α<1, b odd): if z∈Z^b, Σz=0, |z_i+αz_{i+1}|<1 ∀i and z≠0, let m=max|z_i|≥1 at index i; "
            "then |z_{i+1}|>(m−1)/α≥m−1 so |z_{i+1}|=m with opposite sign; around the odd cycle this gives z_i=−z_i. Contradiction.")

if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "strip":
    # cross-validate strip_tilt against the brute-force checker at small b, then run the candidates
    for b in [3, 5, 7, 9]:
        for a in [Fr(1,2), Fr(3,5), Fr(2,3), Fr(3,4), Fr(4,5), Fr(9,10)]:
            R1 = check_gadget(cyc(b, [1, a])); R2 = strip_tilt(a, b)
            print(f"b={b} α={a}: brute={'ok' if R1['ok'] else 'VIOL'}  structured={'ok' if R2['ok'] else 'VIOL'}  (M={R2['M']}, chains={R2['chains']})", flush=True)
    print("--- candidates")
    for a, b in [(Fr(29,50), 9), (Fr(3,5), 9), (Fr(13,20), 11), (Fr(2,3), 13), (Fr(11,20), 13), (Fr(13,20), 21), (Fr(3,4), 21), (Fr(4,5), 31), (Fr(3,4), 45), (Fr(13,20), 31), (Fr(4,5), 53)]:
        t0 = time.time(); R = strip_tilt(a, b)
        print(f"α={a} b={b}: {'STRIP OK' if R['ok'] else 'STRIP VIOLATED '+str(R['viol'][0])}  M={R['M']} chains={R['chains']}  ({time.time()-t0:.1f}s)", flush=True)
