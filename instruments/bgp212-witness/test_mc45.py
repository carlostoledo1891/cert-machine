# 45-dim Monte Carlo (pointwise Lean definitions, physical scale) vs the exact pipeline,
# on polynomials chosen so that the cap corrections are large, and on the real d21 witness.
import sys, json, time
import numpy as np
from fractions import Fraction as Fr
from mc_check import mc_I, mc_J
from pipeline import exact_IJ
from core import load_witness

rng = np.random.default_rng(2026)
B = [0, 777, 794, 875, 917, 953, 983, 1016, 1042, 1063, 1081]
K = 45
dat = dict(K=K, g=Fr(82), L=Fr(1325), C=lambda m: Fr(B[min(m, 10)]), tau=Fr(1245))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1000000
tests = {
  'm_(5)':           [(0, (5,), 1)],
  'm_(1,1,1,1,1)':   [(0, (1, 1, 1, 1, 1), 1)],
  '(L-s) m_(2,2,1) - 3 m_(3)': [(1, (2, 2, 1), 1), (0, (3,), -3)],
  'm_(4) + 5 m_(1,1,1) - (L-s)^4': [(0, (4,), 1), (0, (1, 1, 1), 5), (4, (), -1)],
}
out = []
for name, terms in tests.items():
    deg = max(a + 2 * sum(l) for a, l, c in terms)
    ty = [(a, lam, c * 1250 ** (deg - a - 2 * sum(lam))) for a, lam, c in terms]
    t0 = time.time()
    Iy, Jy, info = exact_IJ(ty, dat, 'work/mc45s', nproc=4)
    I0, J0 = info['parts_exact']['I0'], info['parts_exact']['J0']
    It = Iy / Fr(1250) ** (2 * deg + K); Jt = Jy / Fr(1250) ** (2 * deg + K + 1)
    Ip, Jp = It / Fr(4) ** K, Jt / Fr(4) ** (K + 1)
    t1 = time.time()
    mi, si = mc_I(terms, K, N, rng)
    mj, sj = mc_J(terms, K, N, rng)
    t2 = time.time()
    line = dict(test=name, N=N, cap_share_I=float((I0 - Iy) / I0), cap_share_J=float((J0 - Jy) / J0),
                I_exact=float(Ip), I_mc=mi, I_se=si, I_z=(mi - float(Ip)) / si,
                J_exact=float(Jp), J_mc=mj, J_se=sj, J_z=(mj - float(Jp)) / sj,
                bounds_ok=info['bounds_ok'], t_exact=t1 - t0, t_mc=t2 - t1)
    print(json.dumps(line), flush=True); out.append(line)
# the real witness: exact I, J from the d21 run
r = json.load(open('work/d21/crt_result.json'))
hdr, terms = load_witness('../../corpus/bgp212-witness/witnesses/axiom212_k45_d21.json')
Iy, Jy = Fr(r['I_y']), Fr(r['J_y'])
Ip = Iy / Fr(1250) ** (42 + K) / Fr(4) ** K; Jp = Jy / Fr(1250) ** (42 + K + 1) / Fr(4) ** (K + 1)
t1 = time.time()
mi, si = mc_I(terms, K, N, rng, batch=100000)
mj, sj = mc_J(terms, K, N, rng, batch=100000)
t2 = time.time()
line = dict(test='d21 witness', N=N, I_exact=float(Ip), I_mc=mi, I_se=si, I_z=(mi - float(Ip)) / si,
            J_exact=float(Jp), J_mc=mj, J_se=sj, J_z=(mj - float(Jp)) / sj,
            ratio_exact=float(45 * Jp / Ip), ratio_mc=45 * mj / mi, t_mc=t2 - t1)
print(json.dumps(line), flush=True); out.append(line)
json.dump(out, open('logs/test_mc45.json', 'w'), indent=1)
