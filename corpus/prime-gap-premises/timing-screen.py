# timing screen (before the pre-registration): exact count vectors of the rank-four sum by multiplicative convolution
import numpy as np, time, sys
def prim_root(p):
    fac = [q for q in range(2, p) if (p - 1) % q == 0 and all(q % r for r in range(2, int(q**.5) + 1))]
    for g in range(2, p):
        if all(pow(g, (p - 1) // q, p) != 1 for q in fac): return g
def counts(p):
    g = prim_root(p); n = p - 1
    pw = np.array([pow(g, i, p) for i in range(n)], dtype=np.int64)      # g^i
    inv = np.array([pow(int(x), p - 2, p) for x in pw])                   # (g^i)^-1 = g^-i
    # M2[i][k] = #{w unit : w + g^i / w = k}
    M2 = np.zeros((n, p), dtype=np.int64)
    for i in range(n):
        a = pw[i]; w = pw; k = (w + a * inv % p) % p
        np.add.at(M2[i], k, 1)
    def conv(M):   # out[i][k] = sum_m M[i - m][k - g^m]  (sum over the unit u = g^m of psi(u) * K(c/u))
        out = np.zeros_like(M)
        for m in range(n):
            out += np.roll(np.roll(M, m, axis=0), int(pw[m]), axis=1)
        return out
    M3 = conv(M2); N4 = conv(M3)
    return N4
for p in map(int, sys.argv[1:]):
    t = time.time(); N4 = counts(p); dt = time.time() - t
    j = np.arange(p); z = np.exp(2j * np.pi * j / p)
    K = N4 @ z
    print(p, 'seconds %.2f' % dt, 'sum check', int(N4[0].sum()) == (p - 1)**3, 'max |K4|/p^1.5 = %.4f' % (np.abs(K).max() / p**1.5), 'max |Im| %.2e' % np.abs(K.imag).max())
