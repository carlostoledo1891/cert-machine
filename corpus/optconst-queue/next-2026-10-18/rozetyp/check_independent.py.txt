# Independent second check of a certificate, written separately from verify.py.
# verify.py relies on the autocorrelation being linear between multiples of 1/K, so it
# only evaluates t = k/K. This script does not assume that: it integrates the overlap of
# the step blocks directly, in exact rational arithmetic, at the claimed minimiser and at
# random off-grid shifts t in [0, 1], and checks that nothing falls below the claimed bound.
#
#   python3 check_independent.py certificates/cert_3072.json [num_random_shifts]
import json, random, sys
from fractions import Fraction as F

c = json.load(open(sys.argv[1])); K = c["K"]; w = c["weights_int"]; n = len(w)
samples = int(sys.argv[2]) if len(sys.argv) > 2 else 40
assert all(isinstance(x, int) and x >= 0 for x in w)
h = F(1, K); L1sq = (sum(w) * h) ** 2
nz = [i for i in range(n) if w[i]]

def ratio(t):
    """∫ f(x) f(x+t) dx / ||f||_1^2 by summing exact overlaps of blocks i and j-shifted-by-t."""
    tot = F(0)
    for i in nz:
        lo, hi = i * h, (i + 1) * h
        j0 = int((lo + t) / h)
        for j in (j0 - 1, j0, j0 + 1):
            if 0 <= j < n and w[j]:
                ov = min(hi, (j + 1) * h - t) - max(lo, j * h - t)
                if ov > 0:
                    tot += w[i] * w[j] * ov
    return tot / L1sq

claimed = F(c["score_num"], c["score_den"])
corr = [sum(w[i] * w[i + k] for i in range(n - k)) for k in range(K + 1)]
kmin = min(range(K + 1), key=corr.__getitem__)
at_min = ratio(F(kmin, K))
print(f"K={K}, blocks={n}, support=[0,{F(n, K)}), claimed bound {float(claimed):.12f}")
print(f"direct integral at t={kmin}/{K}: {float(at_min):.12f}  equal to claim: {at_min == claimed}")
assert at_min == claimed

random.seed(1)
lowest = None
for _ in range(samples):
    t = F(random.randrange(10**9), 10**9)
    v = ratio(t)
    assert v >= claimed, f"off-grid shift t={float(t)} gives {float(v)} < claimed bound"
    lowest = v if lowest is None else min(lowest, v)
print(f"{samples} random off-grid shifts: all >= claimed bound (lowest {float(lowest):.12f})")
for d in (F(1, 10 * K), F(1, 1000 * K)):
    for t in (F(kmin, K) - d, F(kmin, K) + d):
        if 0 <= t <= 1:
            assert ratio(t) >= claimed
print("shifts just either side of the minimiser: >= claimed bound")
print("OK")
