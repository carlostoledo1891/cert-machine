"""
Stage 3: Chinese remaindering of the kernel residues into exact rationals I_y, J_y.
usage: python3 crt.py TAG [his_exact_ratio.txt]
"""
import sys, pickle, json, glob, time
from fractions import Fraction as Fr
from mpmath import mp, mpf

tag = sys.argv[1]
wd = f'work/{tag}'
meta = pickle.load(open(f'{wd}/meta.pkl', 'rb'))
res = {}
for fn in glob.glob(f'{wd}/res_*.txt'):
    for line in open(fn):
        p, r0, r1, r2, r3 = map(int, line.split())
        if p in res:
            assert res[p] == (r0, r1, r2, r3), "two runs of the same prime disagree"
        res[p] = (r0, r1, r2, r3)
primes = [p for p in meta['primes'] if p in res]
assert len(primes) == len(meta['primes']), f"missing primes: {len(meta['primes']) - len(primes)}"
I0, J0, DI, DJ = meta['I0'], meta['J0'], meta['DI'], meta['DJ']

def modq(x, p):
    return x.numerator % p * pow(x.denominator % p, -1, p) % p

XI, XJ = {}, {}
for p in primes:
    r0, r1, r2, r3 = res[p]
    Ip = (modq(I0, p) - r0) % p
    Jp = (modq(J0, p) - r1 * pow(meta['s_Z0'] % p, -1, p) + r2 * pow(meta['s_ZD'] % p, -1, p)
          + r3 * pow(meta['s_Pi'] % p, -1, p)) % p
    XI[p] = DI % p * Ip % p
    XJ[p] = DJ % p * Jp % p

def crt(X, ps):
    M = 1; x = 0
    for p in ps:
        # x = x mod M, combine with X[p] mod p
        t = (X[p] - x) * pow(M % p, -1, p) % p
        x += M * t; M *= p
    if x > M // 2:
        x -= M
    return x, M

need = meta['need_bits']
# smallest prefix with enough bits
acc = 0; k = 0
while acc < need:
    acc += primes[k].bit_length() - 1; k += 1
xi1, M1 = crt(XI, primes[:k]); xj1, _ = crt(XJ, primes[:k])
xi2, M2 = crt(XI, primes); xj2, _ = crt(XJ, primes)
stable = (xi1 == xi2) and (xj1 == xj2)
I = Fr(xi2, DI); J = Fr(xj2, DJ)
Ly = meta['L_y']
bounds_ok = (0 < I <= I0) and (0 <= J <= Ly * I)
ratio_tilde = 45 * J / (1250 * I)       # 45 J(F~)/I(F~)  (dilated x = 4t)
ratio_phys = 45 * J / (5000 * I)        # 45 J(F)/I(F)    (physical scale of the Lean file)
mp.dps = 80
out = dict(tag=tag, n_primes=len(primes), prefix_primes=k, bits_needed=need, crt_stable_with_spare_primes=stable,
           magnitude_bounds_ok=bounds_ok,
           I_y=str(I), J_y=str(J),
           ratio_phys=str(ratio_phys), ratio_phys_decimal=mp.nstr(mpf(ratio_phys.numerator) / ratio_phys.denominator, 60),
           ratio_tilde_decimal=mp.nstr(mpf(ratio_tilde.numerator) / ratio_tilde.denominator, 60),
           ratio_phys_gt_1=ratio_phys > 1, I_pos=I > 0)
if len(sys.argv) > 2:
    s = open(sys.argv[2]).read().strip()
    his = Fr(s)
    # his file holds the DILATED value 45 J(F~)/I(F~) (x = 4t); the physical value is that divided by 4
    out['his_ratio_equals_our_dilated'] = (his == ratio_tilde)
    out['his_ratio_over_4_equals_our_physical'] = (his / 4 == ratio_phys)
    out['his_ratio_decimal'] = mp.nstr(mpf(his.numerator) / his.denominator, 60)
    out['his_num_digits'] = len(str(his.numerator)); out['his_den_digits'] = len(str(his.denominator))
out['our_num_digits'] = len(str(ratio_phys.numerator)); out['our_den_digits'] = len(str(ratio_phys.denominator))
json.dump(out, open(f'{wd}/crt_result.json', 'w'), indent=1)
for k_, v in out.items():
    if k_ in ('I_y', 'J_y', 'ratio_phys'):
        print(k_, '=', v[:80] + ('...' if len(v) > 80 else ''), f'({len(v)} chars)')
    else:
        print(k_, '=', v)
