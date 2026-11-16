# brute-force check of monomial-symmetric structure constants in n variables
import itertools, random
from collections import Counter
from core import *

def mono_vecs(lam, n):
    v = list(lam) + [0]*(n-len(lam))
    return set(itertools.permutations(v))

def brute_prod(lam, mu, n):
    A = mono_vecs(lam, n); B = mono_vecs(mu, n)
    cnt = Counter()
    for a in A:
        for b in B:
            cnt[tuple(x+y for x,y in zip(a,b))] += 1
    out = {}
    for vec, c in cnt.items():
        gam = tuple(sorted([x for x in vec if x], reverse=True))
        if gam in out: assert out[gam] == c
        else: out[gam] = c
    return out

random.seed(1)
parts = partitions_upto(5)
bad = 0
for _ in range(60):
    lam = random.choice(parts); mu = random.choice(parts)
    n = max(len(lam)+len(mu), 1)
    n = min(n, 7)
    if len(lam) > n or len(mu) > n: continue
    bp = brute_prod(lam, mu, n)
    mp = {g:c for g,c in mprod(lam, mu).items() if len(g) <= n}
    if bp != mp:
        bad += 1; print("MISMATCH", lam, mu, n, bp, mp)
print("structure-constant brute checks done, mismatches:", bad)
# nmono check
for lam in parts[:30]:
    for n in range(len(lam), 7):
        assert nmono(lam, n) == len(mono_vecs(lam, n))
print("nmono ok")
