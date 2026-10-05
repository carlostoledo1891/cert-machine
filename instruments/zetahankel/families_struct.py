"""Structurally different families for zeta(7) (and zeta(5) as the control).
Each family is a function m -> (den_nodes, num_nodes)."""
import sys, json, os
from multiprocessing import Pool
from flint import fmpq
F = {}
def fam(name):
    def deco(f):
        F[name] = f; return f
    return deco
# 1. well-poised-like: numerator also above the poles
@fam('above')
def _(m, r=4, s=1):
    K, N = 8 * m, m
    den = [fmpq(j) for j in range(N + 1, K + 1)]
    num = [(fmpq(i), r) for i in range(1, N + 1)] + [(fmpq(i), s) for i in range(K + 1, K + 1 + N)]
    return den, num
# 2. poles on odd j only, numerator on all small j
@fam('oddpoles')
def _(m, r=4):
    K, N = 16 * m, m
    den = [fmpq(j) for j in range(N + 1, K + 1) if j % 2]
    num = [(fmpq(i), r) for i in range(1, N + 1)]
    return den, num
# 3. staircase multiplicities: heavier near the poles
@fam('stair')
def _(m):
    K, N = 8 * m, 2 * m
    den = [fmpq(j) for j in range(N + 1, K + 1)]
    num = [(fmpq(i), 2 + (4 * i) // N) for i in range(1, N + 1)]
    return den, num
# 4. numerator interleaved inside the pole range (poles on even, zeros on odd)
@fam('interleave')
def _(m, r=2):
    K = 12 * m
    den = [fmpq(j) for j in range(2, K + 1, 2)]
    num = [(fmpq(j), r) for j in range(1, K // 2, 2)]
    return den, num
# 5. Z-grid: half-integer AND integer poles, integer zeros with high multiplicity
@fam('grid_intzeros')
def _(m, r=5):
    K, N = 6 * m, m
    den = [fmpq(u, 2) for u in range(2 * N + 1, 2 * K + 1)]
    num = [(fmpq(i), r) for i in range(1, N + 1)]
    return den, num
# 6. two gaps: poles in (N, K] minus a middle window that holds zeros
@fam('window')
def _(m, r=4):
    K, N = 10 * m, m
    lo, hi = 4 * m, 5 * m
    den = [fmpq(j) for j in range(N + 1, K + 1) if not lo < j <= hi]
    num = [(fmpq(i), r) for i in range(1, N + 1)] + [(fmpq(j), 2) for j in range(lo + 1, hi + 1)]
    return den, num

def job(a):
    name, k, m, out = a
    from hankel2 import run
    den, num = F[name](m)
    try:
        res, P, D = run(k, 'Z', den, num)
    except Exception as e:
        res = dict(error=repr(e), h=len(den))
    res.update(fam=name, m=m)
    with open(os.path.join(out, f"{name}_k{k}.jsonl"), "a") as f:
        f.write(json.dumps(res) + "\n")

if __name__ == "__main__":
    out = sys.argv[1]; hmax = int(sys.argv[2]); os.makedirs(out, exist_ok=True)
    tasks = []
    for name in F:
        for k in (5, 7):
            m = 1
            while len(F[name](m)[0]) <= hmax:
                tasks.append((name, k, m, out)); m += 1
    tasks.sort(key=lambda t: len(F[t[0]](t[2])[0]))
    with Pool(7) as p:
        list(p.imap_unordered(job, tasks))
