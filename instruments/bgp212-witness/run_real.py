"""
Stage 1 for a real witness: exact precomputation + kernel input + CRT plan.
usage: python3 run_real.py WITNESS.json TAG
writes work/<TAG>/input.txt, work/<TAG>/meta.pkl, work/<TAG>/primes.txt
"""
import sys, os, pickle, time, json
from fractions import Fraction as Fr
from math import gcd
from core import load_witness
from prep import build

wpath, tag = sys.argv[1], sys.argv[2]
wd = f'work/{tag}'
os.makedirs(wd, exist_ok=True)
logf = open(f'logs/prep_{tag}.log', 'a')
def log(s):
    line = time.strftime('%H:%M:%S ') + s
    print(line, flush=True); logf.write(line + '\n'); logf.flush()

hdr, terms = load_witness(wpath)
log(f"witness {wpath}: K={hdr['K']} degree={hdr['degree']} terms={len(terms)}")
# datum read from the Lean file (physical scale), dilated x = 4t, then y = 1250 x (integer units)
delta, eps = Fr(41, 2500), Fr(1, 125)
A0, A1 = Fr(-1, 125), Fr(257, 1000)
B = [Fr(0), Fr(777, 5000), Fr(794, 5000), Fr(875, 5000), Fr(917, 5000), Fr(953, 5000), Fr(983, 5000),
     Fr(1016, 5000), Fr(1042, 5000), Fr(1063, 5000), Fr(1081, 5000)]
S = 4 * 1250  # physical t -> y
g = delta * S; L = (A1 + eps) * S; tau = (A1 - eps) * S
caps = [b * S for b in B]
assert all(v.denominator == 1 for v in [g, L, tau] + caps)
assert A0 + eps == 0
# cross-check against the witness header (README coordinates x = 4t)
assert Fr(hdr['L']) * 1250 == L and Fr(hdr['tau']) * 1250 == tau and Fr(hdr['g']) * 1250 == g
assert [Fr(c) * 1250 for c in hdr['caps_C']] == caps[1:]
Cf = lambda m: caps[min(m, 10)]
K = hdr['K']
dat = dict(K=K, g=g, L=L, C=Cf, tau=tau)
log(f"datum (y units = 5000 t): g={g} L={L} tau={tau} caps={[int(c) for c in caps]}")
deg = hdr['degree']
yterms = []
for a, lam, c in terms:
    dd = a + 2 * sum(lam)
    assert dd <= deg
    yterms.append((a, lam, c * 1250 ** (deg - dd)))  # P_y(y) = 1250^deg * F~(y/1250)
t0 = time.time()
meta = build(yterms, dat, f'{wd}/input.txt', log=log)
meta['deg'] = deg
meta['K'] = K
log(f"build done in {time.time()-t0:.1f}s; maxA={meta['maxA']} maxZe={meta['maxZe']} maxPi={meta['maxPi']} nparts={meta['nparts']} ngam={meta['ngam']} npairs={meta['npairs']}")
I0, J0 = meta['I0'], meta['J0']
def lcm(a, b): return a * b // gcd(a, b)
DI = lcm(I0.denominator, meta['fac_tail'] * meta['fac_om'])
DJ = J0.denominator
for s in (meta['s_Z0'] * meta['fac_tail'] * meta['fac_om'], meta['s_ZD'] * meta['fac_tail'] * meta['fac_om'], meta['s_Pi'] * meta['fac_rect']):
    DJ = lcm(DJ, s)
# rigorous magnitude bounds: 0 <= I <= I0 ; 0 <= J <= L * I <= L * I0
BI = DI * I0
BJ = DJ * L * I0
need_bits = max((2 * BI).numerator.bit_length() - (2*BI).denominator.bit_length() + 2,
                (2 * BJ).numerator.bit_length() - (2*BJ).denominator.bit_length() + 2)
meta.update(DI=DI, DJ=DJ, L_y=L, need_bits=need_bits)
# primes just below 2^31
def isprime(n):
    if n < 2: return False
    for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        if n % p == 0: return n == p
    d, s = n - 1, 0
    while d % 2 == 0: d //= 2; s += 1
    for a in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        x = pow(a, d, n)
        if x in (1, n - 1): continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1: break
        else: return False
    return True
primes = []
n = 2**31 - 1
bits = 0
while bits < need_bits + 30 * 12:   # 12 spare primes for a stability check
    if isprime(n):
        primes.append(n); bits += (n.bit_length() - 1)
    n -= 2
meta['primes'] = primes
pickle.dump(meta, open(f'{wd}/meta.pkl', 'wb'))
open(f'{wd}/primes.txt', 'w').write("\n".join(map(str, primes)) + "\n")
log(f"CRT plan: need {need_bits} bits; {len(primes)} primes (incl. ~12 spare); I0~{float(I0):.4e} J0~{float(J0):.4e}")
