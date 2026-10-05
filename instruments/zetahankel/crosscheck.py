#!/usr/bin/env python3
"""crosscheck.py — a second route to the Hankel polynomial, sharing no code with the lifted engine.

cert-machine's own file, not a port. Python standard library only (fractions, math): no FLINT, no
arb, no import of hankel.py / hankel2.py. It is written from the DEFINITIONS in the engine's
docstrings, not from its code, and every algorithmic step is a different one:

  moments       mu(t^e) = (-1)^e B_{2e+2} c_e (2e+k)! / ((k-1)! (2e+2)!),  c_e = 1 (weight Z) or
                2^{2e+2} - 1 (weight E); the Bernoulli numbers come from their own recurrence here
                (sum_{j<=n} C(n+1, j) B_j = 0), not from FLINT
  node values   Z, a = j integer:      a^{k-1} zeta(k, a) - 1/(2a) - 1/(k-1),  zeta(k, j) = X - sum_{v<j} v^-k
                E, a = j + 1/2:        a^{k-1} (eta(k, a) - a^{-k}/2),
                                       eta(k, j + 1/2) = 2^k (-1)^j (X - sum_{u<j} (-1)^u (2u+1)^-k)
  the matrix    G(X)_{il} = mu_X( W(t) t^{i+l} ),  W = prod_b (t + b^2)^{mult_b} / prod_a (t + a^2),
                split by schoolbook long division into a polynomial part and one residue per pole,
                the residue at t = -a^2 taken as num(-a^2)(-a^2)^m / prod_{a' != a} (a'^2 - a^2)
  Delta(X)      det(A + xB) at x = 0..h by Fraction Gaussian elimination, then Lagrange interpolation
                (the engine uses det(B) * charpoly(-B^{-1}A) through a multimodular integer charpoly)
  P             Delta divided by its content (gcd of numerators / lcm of denominators), sign kept
  P(zeta(3))    a RATIONAL enclosure of zeta(3) from Apery's alternating series
                zeta(3) = (5/2) sum_{n>=1} (-1)^{n-1} / (n^3 C(2n, n)) (consecutive partial sums bracket
                it), P evaluated exactly at one end and the mean-value bound added for the width; the
                engine uses arb's zeta. Only zeta(3) gets this: zeta(5), zeta(7) and Catalan's G have no
                comparably cheap rational enclosure in the standard library, so for them the cross-check
                is the exact polynomial only.

The polynomial's fingerprint is sha256 of its integer coefficients, constant term first, as decimal
strings joined by ','; rerun.py fingerprints the engine's P the same way, so equal fingerprints mean
the two routes produced the same integer polynomial, coefficient by coefficient.

usage: python3 crosscheck.py            (prints one JSON line per instance; ~1 s)"""
import sys, json, math, hashlib, time
from fractions import Fraction as Fr

# the instances (weight, k, node type, a, b, r, m) — K = a m, N = b m, h = K - N, as in scan2.py's spec
INSTANCES = [
    ('Z', 3, 'int', 4, 1, 4, 1), ('Z', 3, 'int', 4, 1, 4, 2), ('Z', 3, 'int', 4, 1, 4, 3),
    ('Z', 5, 'int', 8, 1, 4, 1), ('Z', 7, 'int', 8, 1, 4, 1), ('E', 2, 'half', 8, 1, 1, 1),
]

def bernoulli_list(n):
    B = [Fr(1)]
    for i in range(1, n + 1):
        B.append(-sum(math.comb(i + 1, j) * B[j] for j in range(i)) / (i + 1))
    return B

def nodes(typ, K, N, r):
    """poles a (a^2 = -t at the pole) and numerator zeros b with multiplicity r - 1"""
    if typ == 'int':
        return [Fr(j) for j in range(N + 1, K + 1)], [Fr(i) for i in range(1, N + 1)]
    if typ == 'half':
        return [Fr(2 * j + 1, 2) for j in range(N, K)], [Fr(2 * i + 1, 2) for i in range(N)]
    raise ValueError(typ)

def node_affine(a, k, weight):
    """(alpha, beta) with mu(1/(t + a^2)) = alpha X + beta, from the docstring definitions"""
    if weight == 'Z' and a.denominator == 1:
        j = a.numerator
        tail = sum((Fr(1, v ** k) for v in range(1, j)), Fr(0))
        return a ** (k - 1), -a ** (k - 1) * tail - 1 / (2 * a) - Fr(1, k - 1)
    if weight == 'E' and a.denominator == 2:
        j = (a.numerator - 1) // 2
        s = sum((Fr((-1) ** u, (2 * u + 1) ** k) for u in range(j)), Fr(0))
        sg = (-1) ** j
        return a ** (k - 1) * 2 ** k * sg, a ** (k - 1) * (-(2 ** k) * sg * s - a ** (-k) / 2)
    raise ValueError('instance type not covered by the cross-check')

def pmul(p, q):
    out = [Fr(0)] * (len(p) + len(q) - 1)
    for i, x in enumerate(p):
        if x:
            for j, y in enumerate(q):
                out[i + j] += x * y
    return out

def peval(p, x):
    v = Fr(0)
    for c in reversed(p):
        v = v * x + c
    return v

def pdivmod(num, den):
    """schoolbook division, coefficient lists constant term first; den monic"""
    num = num[:]
    q = [Fr(0)] * max(1, len(num) - len(den) + 1)
    for i in range(len(num) - len(den), -1, -1):
        c = num[i + len(den) - 1]
        q[i] = c
        if c:
            for j, d in enumerate(den):
                num[i + j] -= c * d
    return q

def hankel_AB(weight, k, typ, a, b, r, m):
    K, N = a * m, b * m
    poles, zeros = nodes(typ, K, N, r)
    h = len(poles)
    num = [Fr(1)]
    if r > 1:
        for z in zeros:
            for _ in range(r - 1):
                num = pmul(num, [z * z, Fr(1)])
    den = [Fr(1)]
    for p in poles:
        den = pmul(den, [p * p, Fr(1)])
    B = bernoulli_list(2 * (2 * h - 1 + len(num)) + 2)
    def mom(e):
        c = Fr(1) if weight == 'Z' else Fr(2 ** (2 * e + 2) - 1)
        v = B[2 * e + 2] * c * Fr(math.factorial(2 * e + k), math.factorial(k - 1) * math.factorial(2 * e + 2))
        return -v if e % 2 else v
    aff = {p: node_affine(p, k, weight) for p in poles}
    dprime = {p: math.prod((q * q - p * p for q in poles if q != p), start=Fr(1)) for p in poles}
    zero_at = {p: peval(num, -p * p) for p in poles}
    av, bv = [], []
    numm = num[:]
    for mm in range(2 * h - 1):
        q = pdivmod(numm, den) if len(numm) >= len(den) else [Fr(0)]
        A = sum((c * mom(e) for e, c in enumerate(q) if c), Fr(0))
        Bx = Fr(0)
        for p in poles:
            res = zero_at[p] * (-p * p) ** mm / dprime[p]
            A += res * aff[p][1]
            Bx += res * aff[p][0]
        av.append(A); bv.append(Bx)
        numm = [Fr(0)] + numm
    return h, av, bv

def det(M):
    M = [row[:] for row in M]
    n = len(M); d = Fr(1)
    for c in range(n):
        piv = next((i for i in range(c, n) if M[i][c] != 0), None)
        if piv is None:
            return Fr(0)
        if piv != c:
            M[c], M[piv] = M[piv], M[c]; d = -d
        d *= M[c][c]
        for i in range(c + 1, n):
            f = M[i][c] / M[c][c]
            if f:
                for j in range(c, n):
                    M[i][j] -= f * M[c][j]
    return d

def delta_poly(h, av, bv):
    xs = list(range(h + 1))
    ys = [det([[av[i + l] + x * bv[i + l] for l in range(h)] for i in range(h)]) for x in xs]
    P = [Fr(0)] * (h + 1)
    for i, xi in enumerate(xs):
        L = [Fr(1)]; den = Fr(1)
        for j, xj in enumerate(xs):
            if j != i:
                L = pmul(L, [Fr(-xj), Fr(1)]); den *= (xi - xj)
        for e, c in enumerate(L):
            P[e] += c * ys[i] / den
    while len(P) > 1 and P[-1] == 0:
        P.pop()
    return P

def primitive(D):
    nz = [c for c in D if c]
    g = 0; l = 1
    for c in nz:
        g = math.gcd(g, c.numerator); l = l * c.denominator // math.gcd(l, c.denominator)
    cont = Fr(g, l)
    P = [c / cont for c in D]
    assert all(c.denominator == 1 for c in P)
    return [int(c) for c in P], cont

def fingerprint(coeffs):
    return hashlib.sha256(','.join(str(int(c)) for c in coeffs).encode()).hexdigest()

def zeta3_enclosure(nterms):
    s = Fr(0); prev = None
    for n in range(1, nterms + 1):
        prev = s
        s += Fr((-1) ** (n - 1), n ** 3 * math.comb(2 * n, n))
    lo, hi = sorted((prev * Fr(5, 2), s * Fr(5, 2)))
    return lo, hi

def logq(x):
    """log of a positive Fraction (double precision; the endpoints themselves are exact)"""
    return math.log(x.numerator) - math.log(x.denominator)

def enclose_P_at_zeta3(P):
    hb = max(abs(c).bit_length() for c in P)
    n = 40
    while True:
        lo, hi = zeta3_enclosure(n)
        w = hi - lo
        slope = sum(abs(i * c) * hi ** (i - 1) for i, c in enumerate(P) if i)
        v = peval(P, lo)
        err = w * slope
        if v - err > 0 and err < v / 2 ** 60:
            return v - err, v + err, n
        if v + err < 0 and err < -v / 2 ** 60:
            raise RuntimeError('P(zeta(3)) < 0: positivity violated')
        n = 2 * n + hb

def compute(inst):
    """the cross-check's own objects: P (list of ints), content (Fraction), and for zeta(3) the exact enclosure"""
    weight, k, typ, a, b, r, m = inst
    h, av, bv = hankel_AB(weight, k, typ, a, b, r, m)
    P, cont = primitive(delta_poly(h, av, bv))
    out = dict(h=h, P=P, content=cont)
    if weight == 'Z' and k == 3:
        vlo, vhi, nt = enclose_P_at_zeta3(P)
        out.update(vlo=vlo, vhi=vhi, terms=nt, logP_lo=logq(vlo), logP_hi=logq(vhi))
    return out

def run(inst):
    t0 = time.time()
    x = compute(inst)
    out = dict(spec=list(inst[:6]), m=inst[6], h=x['h'], deg=len(x['P']) - 1, P_sha256=fingerprint(x['P']),
               content=str(x['content'].numerator) + '/' + str(x['content'].denominator),
               log_content=logq(abs(x['content'])))
    if 'vlo' in x:
        out.update(logP_lo=x['logP_lo'], logP_hi=x['logP_hi'], apery_terms=x['terms'])
    out['secs'] = round(time.time() - t0, 3)
    return out

if __name__ == '__main__':
    for inst in INSTANCES:
        print(json.dumps(run(inst)), flush=True)
