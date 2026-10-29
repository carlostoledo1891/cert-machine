"""Enumerate group specs (for cayley_sat8.make_group) of a given order, from the families
abelian (invariant factors), metacyclic Z_m x|_r Z_n, metacyclic x cyclic, generalized dihedral Dih(Z_a x Z_b).
Not every group of the order is covered; duplicates (isomorphic specs) are possible."""
import sys
from math import gcd
def divisors(n): return [d for d in range(1, n + 1) if n % d == 0]
def abelian(n):
    out = []
    def rec(rem, parts):
        # invariant factors d1 | d2 | ... ; build from the largest
        if rem == 1:
            out.append(parts[::-1]); return
        for d in divisors(rem):
            if d > 1 and (not parts or parts[-1] % d == 0):
                rec(rem // d, parts + [d])
    for d in divisors(n):
        if d > 1 or n == 1:
            rec(n // d, [d])
    res = sorted({tuple(sorted(p)) for p in out if all(b % a == 0 for a, b in zip(sorted(p), sorted(p)[1:]))})
    return ['x'.join(f'Z{q}' for q in p) for p in res]
def metacyclic(n):
    out = []
    for m in divisors(n):
        k = n // m
        if m < 3 or k < 2: continue
        seen = set()
        for r in range(2, m):
            if gcd(r, m) != 1 or pow(r, k, m) != 1: continue
            orb = frozenset(pow(r, j, m) for j in range(1, k) if gcd(j, k) == 1)
            if orb in seen: continue
            seen.add(orb); out.append(f'M{m}_{k}_{r}')
    return out
def groups(n):
    g = abelian(n) + metacyclic(n)
    for c in divisors(n):
        if 1 < c < n:
            g += [f'{s}xZ{c}' for s in metacyclic(n // c)]
    if n % 2 == 0:
        h = n // 2
        for a in divisors(h):
            b = h // a
            if a >= 2 and b >= 2 and b % a == 0: g.append(f'G{a}_{b}')
    return list(dict.fromkeys(g))
if __name__ == '__main__':
    for n in map(int, sys.argv[1:]):
        print(n, ' '.join(groups(n)))
