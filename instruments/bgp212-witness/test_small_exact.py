import sys, time, random, json
from fractions import Fraction as Fr
from decomp import compute_IJ
from polytope_check import exact_I, exact_J

def mkC(caps):
    caps = [Fr(c) for c in caps]
    return lambda m: Fr(0) if m == 0 else caps[min(m, len(caps)) - 1]

datums = {
 'toy':  dict(g=Fr(3), L=Fr(10), caps=[6, 8], tau=Fr(8)),
 'toy2': dict(g=Fr(2), L=Fr(9), caps=[4, 5, 7], tau=Fr(15, 2)),
 'real': dict(g=Fr(82), L=Fr(1325), caps=[777,794,875,917,953,983,1016,1042,1063,1081], tau=Fr(1245)),
}
random.seed(int(sys.argv[2]) if len(sys.argv) > 2 else 0)
K = int(sys.argv[1]) if len(sys.argv) > 1 else 2
results = []
for name, d in datums.items():
    dat = dict(K=K, g=d['g'], L=d['L'], C=mkC(d['caps']), tau=d['tau'])
    for trial in range(2):
        # random low-degree polynomial: terms (a, lam, c)
        lams = [(), (1,), (2,), (1, 1)]
        terms = []
        for lam in lams:
            for a in range(0, 3 - sum(lam)):
                if random.random() < 0.8:
                    terms.append((a, lam, random.randint(-5, 5)))
        t0 = time.time()
        I, J, parts = compute_IJ(terms, dat)
        t1 = time.time()
        Ie = exact_I(terms, dat)
        Je = exact_J(terms, dat)
        t2 = time.time()
        okI, okJ = (I == Ie), (J == Je)
        print(f"K={K} {name} trial{trial}: I match={okI} J match={okJ}  I={float(I):.6e} J={float(J):.6e}  (decomp {t1-t0:.1f}s, polytope {t2-t1:.1f}s)", flush=True)
        if not okI: print("   I decomp", I, " exact", Ie, " rel", float((I-Ie)/Ie) if Ie else None)
        if not okJ: print("   J decomp", J, " exact", Je, " rel", float((J-Je)/Je) if Je else None, {k: float(v) for k,v in parts.items()})
        results.append(dict(K=K, datum=name, trial=trial, terms=terms, I_match=okI, J_match=okJ, I=str(I), J=str(J)))
json.dump(results, open(f'logs/test_small_exact_K{K}.json', 'w'), indent=1)
