"""v_p(content) per prime for a family member, to see where the arithmetic cost sits."""
import sys, math
from flint import fmpq, fmpz
import hankel2, scan2
def vp(z, p):
    z = abs(int(z)); v = 0
    while z and z % p == 0:
        z //= p; v += 1
    return v
def profile(kind, k, typ, a, b, r, m):
    K, N = a * m, b * m
    den, num = scan2.nodes(typ, K, N, r)
    num = [x for x in num if x[1] > 0]
    res, P, D = hankel2.run(k, kind, den, num)
    c = D.coeffs()
    from hankel import content
    cc = content(D)
    primes = [p for p in range(2, 4 * K + 2) if all(p % q for q in range(2, int(p ** .5) + 1))]
    out = {}
    for p in primes:
        out[p] = vp(cc.p, p) - vp(cc.q, p)
    return res, out
if __name__ == "__main__":
    kind, k, typ, a, b, r, m = sys.argv[1], int(sys.argv[2]), sys.argv[3], *map(int, sys.argv[4:8])
    res, out = profile(kind, k, typ, a, b, r, m)
    print(res)
    K = a * m
    tot = 0
    for p, v in out.items():
        if v:
            tot += v * math.log(p)
    print('sum v_p log p =', tot, ' K=', K)
    print(' '.join('%d:%d' % (p, v) for p, v in out.items() if v))
