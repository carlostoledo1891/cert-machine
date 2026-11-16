"""Generic exact pipeline: prep.build -> kernel (mod p, parallel) -> CRT.  Returns (I, J) exact
for integer datum dat and integer-coefficient terms (same units as dat)."""
import os, subprocess
from fractions import Fraction as Fr
from math import gcd
from prep import build


def _isprime(n):
    if n < 2:
        return False
    for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        if n % p == 0:
            return n == p
    d, s = n - 1, 0
    while d % 2 == 0:
        d //= 2; s += 1
    for a in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        x = pow(a, d, n)
        if x in (1, n - 1):
            continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1:
                break
        else:
            return False
    return True


def exact_IJ(terms, dat, workdir, nproc=4, spare=4, log=lambda s: None):
    os.makedirs(workdir, exist_ok=True)
    meta = build(terms, dat, f'{workdir}/input.txt', log=log)
    I0, J0 = meta['I0'], meta['J0']
    lcm = lambda a, b: a * b // gcd(a, b)
    DI = lcm(I0.denominator, meta['fac_tail'] * meta['fac_om'])
    DJ = J0.denominator
    for s in (meta['s_Z0'] * meta['fac_tail'] * meta['fac_om'], meta['s_ZD'] * meta['fac_tail'] * meta['fac_om'], meta['s_Pi'] * meta['fac_rect']):
        DJ = lcm(DJ, s)
    Ly = int(dat['L'])
    bI, bJ = 2 * DI * I0, 2 * DJ * Ly * I0
    need = max(x.numerator.bit_length() - x.denominator.bit_length() + 2 for x in (bI, bJ)) + 2
    primes, bits, n = [], 0, 2**31 - 1
    while bits < need + 30 * spare:
        if _isprime(n):
            primes.append(n); bits += 30
        n -= 2
    out = f'{workdir}/res.txt'
    if os.path.exists(out):
        os.remove(out)
    chunks = [primes[i::nproc] for i in range(nproc)]
    procs = [subprocess.Popen(['./kernel', f'{workdir}/input.txt', f'{workdir}/res_{i}.txt'] + [str(p) for p in ch],
                              stderr=subprocess.DEVNULL) for i, ch in enumerate(chunks) if ch]
    for p in procs:
        assert p.wait() == 0
    res = {}
    for i in range(nproc):
        fn = f'{workdir}/res_{i}.txt'
        if os.path.exists(fn):
            for line in open(fn):
                v = list(map(int, line.split()))
                res[v[0]] = v[1:]
            os.remove(fn)
    assert len(res) == len(primes)
    mq = lambda x, p: x.numerator % p * pow(x.denominator % p, -1, p) % p
    XI, XJ = {}, {}
    for p in primes:
        r0, r1, r2, r3 = res[p]
        Ip = (mq(I0, p) - r0) % p
        Jp = (mq(J0, p) - r1 * pow(meta['s_Z0'] % p, -1, p) + r2 * pow(meta['s_ZD'] % p, -1, p) + r3 * pow(meta['s_Pi'] % p, -1, p)) % p
        XI[p] = DI % p * Ip % p
        XJ[p] = DJ % p * Jp % p

    def crt(X, ps):
        M, x = 1, 0
        for p in ps:
            t = (X[p] - x) * pow(M % p, -1, p) % p
            x += M * t; M *= p
        return x - M if x > M // 2 else x
    k = len(primes) - spare
    xi, xj = crt(XI, primes), crt(XJ, primes)
    stable = (crt(XI, primes[:k]) == xi) and (crt(XJ, primes[:k]) == xj)
    I, J = Fr(xi, DI), Fr(xj, DJ)
    ok = stable and (0 <= I <= I0) and (0 <= J <= Ly * I)
    return I, J, dict(stable=stable, bounds_ok=ok, nprimes=len(primes), parts_exact=dict(I0=I0, J0=J0))
