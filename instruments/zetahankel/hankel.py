"""hankel.py — exact Hankel determinants of the Fauzan/Prevost moment functional.

For an integer k >= 2 the functional mu_{k,X} on rational functions with simple poles
at -j^2 is (Calegari's normalisation of Fauzan, 2026-09-17/24):
    mu(t^e)          = (-1)^e B_{2e+2} (2e+k)! / ((k-1)! (2e+2)!)
    mu(1/(t+j^2))    = j^{k-1} (X - H_j^{(k)}) - 1/(k-1) + 1/(2j)
At X = zeta(k) it is integration against a positive weight, so the Hankel matrix
    G(X) = [ mu_X( W(t) t^{i+l} ) ]_{0<=i,l<h},   W = D_N^r / D_K
is a positive Gram matrix there and Delta(X) = det G(X) is positive at zeta(k).

We compute Delta(X) EXACTLY in Q[X], strip its content (the best possible
normalisation to a primitive integer polynomial P), and evaluate P(zeta(k)) in
ball arithmetic. If log P_n(zeta(k)) -> -infinity like -c n^2 along a family,
the family proves zeta(k) irrational once the arithmetic is established; the
exact content is the TRUE arithmetic, not a provable upper bound on it.
"""
import sys, math, time, json, argparse
from functools import lru_cache
from flint import fmpq, fmpz, fmpq_poly, fmpq_mat, fmpz_mat, arb, ctx

def harmonic(j, k):
    s = fmpq(0)
    out = [fmpq(0)]
    for v in range(1, j + 1):
        s += fmpq(1, v ** k)
        out.append(s)
    return out

@lru_cache(maxsize=None)
def fact(n):
    return math.factorial(n)

def mu_mono(e, k):
    """mu_k(t^e) for the polynomial part."""
    B = fmpq.bernoulli(2 * e + 2)
    v = B * fmpq(fact(2 * e + k), fact(k - 1) * fact(2 * e + 2))
    return -v if e % 2 else v

def D(m, r=1):
    p = fmpq_poly([1])
    for j in range(1, m + 1):
        p *= fmpq_poly([j * j, 1])
    return p ** r if r != 1 else p

def build(k, K, N, r, h=None, extra=None):
    """Return (A, B) with G(X) = A + X*B, both h x h fmpq_mat.
    W(t) = D_N(t)^(r-1) / prod_{N<j<=K}(t+j^2)  (= D_N^r / D_K).
    extra: optional fmpq_poly multiplying the numerator (family exploration)."""
    if h is None:
        h = K - N
    num0 = D(N) ** (r - 1) if r > 1 else fmpq_poly([1])
    if extra is not None:
        num0 = num0 * extra
    tail = fmpq_poly([1])
    nodes = list(range(N + 1, K + 1))
    for j in nodes:
        tail *= fmpq_poly([j * j, 1])
    dtail = tail.derivative()
    Hk = harmonic(K, k)
    # residue base at each node: num0(-j^2)/tail'(-j^2)
    base = {j: num0(fmpq(-j * j)) / dtail(fmpq(-j * j)) for j in nodes}
    constX = {j: fmpq(j ** (k - 1)) for j in nodes}
    const0 = {j: -fmpq(j ** (k - 1)) * Hk[j] - fmpq(1, k - 1) + fmpq(1, 2 * j) for j in nodes}
    M = 2 * h - 1
    a = []
    b = []
    mono_cache = {}
    def mu_poly(q):
        s = fmpq(0)
        for e, c in enumerate(q.coeffs()):
            if c != 0:
                if e not in mono_cache:
                    mono_cache[e] = mu_mono(e, k)
                s += c * mono_cache[e]
        return s
    t = fmpq_poly([0, 1])
    num = num0
    for m in range(M):
        q, rem = divmod(num, tail)
        am = mu_poly(q) if q.degree() >= 0 else fmpq(0)
        bm = fmpq(0)
        for j in nodes:
            c = base[j] * fmpq(-j * j) ** m
            am += c * const0[j]
            bm += c * constX[j]
        a.append(am)
        b.append(bm)
        num = num * t
    A = fmpq_mat(h, h, [a[i + l] for i in range(h) for l in range(h)])
    B = fmpq_mat(h, h, [b[i + l] for i in range(h) for l in range(h)])
    return A, B

def delta_poly(A, B):
    """Delta(X) = det(A + X B) = det(B) * charpoly(-B^{-1} A)(X)."""
    detB = B.det()
    Mx = -(B.solve(A))
    # fmpq_mat.charpoly is pathologically slow here: clear denominators and use
    # the multimodular integer charpoly.  det(XI - M/d) = d^-h * cpz(dX).
    h = Mx.nrows()
    d = fmpz(1)
    for x in Mx.entries():
        d = d.lcm(x.q)
    Mz = fmpz_mat(h, h, [int((x * d).p) for x in Mx.entries()])
    cz = Mz.charpoly().coeffs()
    cp = fmpq_poly([fmpq(int(c) * int(d) ** i, int(d) ** h) for i, c in enumerate(cz)])
    return cp * detB

def content(p):
    """content c>0 with p/c primitive in Z[X]."""
    cs = [c for c in p.coeffs() if c != 0]
    g = fmpz(0)
    l = fmpz(1)
    for c in cs:
        g = g.gcd(c.p)
        l = l.lcm(c.q)
    return fmpq(g, l)

def log_fmpq(x):
    x = abs(x)
    return log_fmpz(x.p) - log_fmpz(x.q)

def log_fmpz(z):
    z = abs(int(z))
    b = z.bit_length()
    if b < 1000:
        return math.log(z)
    sh = b - 900
    return math.log(z >> sh) + sh * math.log(2)

def eval_log_P(P, k, maxbits=None):
    """log P(zeta(k)) with P in Z[X] (as fmpq_poly with integer coeffs), ball arithmetic."""
    coeffs = [int(c.p) for c in P.coeffs()]
    hb = max(abs(c).bit_length() for c in coeffs)
    prec = hb + 256
    while True:
        old = ctx.prec
        ctx.prec = prec
        try:
            z = arb(k).zeta()
            v = arb(0)
            for c in reversed(coeffs):
                v = v * z + c
            if v < 0:
                raise RuntimeError("P(zeta(k)) < 0: positivity violated")
            ok = v > 0
            if ok and v.rad() < v.mid() * arb(2) ** -30:
                return float(v.log().mid()), prec
        finally:
            ctx.prec = old
        prec *= 2
        if maxbits and prec > maxbits:
            raise RuntimeError("precision exceeded")

def run(k, K, N, r, h=None, extra=None, verbose=True):
    t0 = time.time()
    A, B = build(k, K, N, r, h, extra)
    t1 = time.time()
    Dl = delta_poly(A, B)
    t2 = time.time()
    c = content(Dl)
    P = Dl / c
    # content c > 0, so P(zeta) has the sign of Delta(zeta), which is > 0 (Gram).
    lc = log_fmpq(c)
    lv, prec = eval_log_P(P, k)
    hP = max(log_fmpz(x.p) for x in P.coeffs() if x != 0)
    t3 = time.time()
    res = dict(k=k, K=K, N=N, r=r, h=(h or K - N), deg=P.degree(),
               log_content=lc, logP_at_zeta=lv, log_height=hP,
               log_delta_at_zeta=lv + lc, prec=prec,
               t_build=round(t1 - t0, 2), t_det=round(t2 - t1, 2), t_eval=round(t3 - t2, 2))
    if verbose:
        print(json.dumps(res), flush=True)
    return res, P, Dl

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--k", type=int, default=5)
    ap.add_argument("--K", type=int)
    ap.add_argument("--N", type=int)
    ap.add_argument("--r", type=int, default=6)
    ap.add_argument("--h", type=int, default=None)
    a = ap.parse_args()
    run(a.k, a.K, a.N, a.r, a.h)
