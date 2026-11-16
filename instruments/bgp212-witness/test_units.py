# invariance: the same d21 witness computed in a different integer unit (y' = 2500 x instead of 1250 x)
import json, time
from fractions import Fraction as Fr
from pipeline import exact_IJ
from core import load_witness
hdr, terms = load_witness('../../corpus/bgp212-witness/witnesses/axiom212_k45_d21.json')
U = 2500
B = [0, 777, 794, 875, 917, 953, 983, 1016, 1042, 1063, 1081]
dat = dict(K=45, g=Fr(41, 625) * U, L=Fr(53, 50) * U, C=lambda m: Fr(4 * B[min(m, 10)], 5000) * U, tau=Fr(249, 250) * U)
ty = [(a, lam, c * U ** (21 - a - 2 * sum(lam))) for a, lam, c in terms]
t0 = time.time()
I, J, info = exact_IJ(ty, dat, 'work/d21_u2500', nproc=4)
rt = 45 * J / (U * I)
his = Fr(open('../../corpus/bgp212-witness/witnesses/axiom212_k45_d21_exact_ratio.txt').read().strip())
r = json.load(open('work/d21/crt_result.json'))
I1, J1 = Fr(r['I_y']), Fr(r['J_y'])
res = dict(unit=U, seconds=time.time() - t0, info_stable=info['stable'], bounds_ok=info['bounds_ok'],
           ratio_equal_to_unit1250_run=(rt == 45 * J1 / (1250 * I1)), ratio_equal_his=(rt == his),
           I_scaling_consistent=(I == I1 * Fr(2) ** (42 + 45)), J_scaling_consistent=(J == J1 * Fr(2) ** (42 + 45 + 1)))
print(json.dumps(res))
json.dump(res, open('logs/test_units.json', 'w'), indent=1)
