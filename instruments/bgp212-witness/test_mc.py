# Monte Carlo (pointwise Lean definitions, physical scale) vs the exact decider values
import sys, json, time, random
import numpy as np
from fractions import Fraction as Fr
from mc_check import mc_I, mc_J
from decomp import compute_IJ
from pipeline import exact_IJ

rng = np.random.default_rng(12345)
random.seed(7)
res = []
B = [0, 777, 794, 875, 917, 953, 983, 1016, 1042, 1063, 1081]
def rand_terms(maxdeg, K):
    lams = [(), (1,), (2,), (1, 1)]
    t = []
    for lam in lams:
        if len(lam) > K: continue
        for a in range(0, maxdeg + 1 - 2 * sum(lam)):
            t.append((a, lam, random.randint(-9, 9)))
    return t
N = int(sys.argv[1]) if len(sys.argv) > 1 else 2000000
for K in [2, 3, 4, 5, 45]:
    terms = rand_terms(4, K)
    t0 = time.time()
    if K <= 5:
        # exact, dilated coordinates x = 4t (Fractions)
        dat = dict(K=K, g=Fr(41, 625), L=Fr(53, 50), C=lambda m: Fr(4 * B[min(m, 10)], 5000), tau=Fr(249, 250))
        It, Jt, _ = compute_IJ(terms, dat)
    else:
        # exact through the modular kernel, y = 1250 x units, P_y = 1250^4 F~(y/1250)
        dat = dict(K=K, g=Fr(82), L=Fr(1325), C=lambda m: Fr(B[min(m, 10)] // 4 if False else 4 * B[min(m, 10)] * 1250 // 5000), tau=Fr(1245))
        ty = [(a, lam, c * 1250 ** (4 - a - 2 * sum(lam))) for a, lam, c in terms]
        Iy, Jy, info = exact_IJ(ty, dat, 'work/mc45', nproc=4)
        assert info['bounds_ok']
        It = Iy / Fr(1250) ** (8 + K); Jt = Jy / Fr(1250) ** (8 + K + 1)
    Iphys = It / Fr(4) ** K; Jphys = Jt / Fr(4) ** (K + 1)
    t1 = time.time()
    mi, si = mc_I(terms, K, N, rng)
    mj, sj = mc_J(terms, K, N, rng)
    t2 = time.time()
    zI = (mi - float(Iphys)) / si; zJ = (mj - float(Jphys)) / sj
    line = dict(K=K, N=N, I_exact=float(Iphys), I_mc=mi, I_se=si, I_z=zI, I_relse=si / abs(mi),
                J_exact=float(Jphys), J_mc=mj, J_se=sj, J_z=zJ, J_relse=sj / abs(mj), t_exact=t1 - t0, t_mc=t2 - t1)
    print(json.dumps(line), flush=True)
    res.append(line)
json.dump(res, open('logs/test_mc.json', 'w'), indent=1)
