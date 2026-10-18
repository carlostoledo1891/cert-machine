# Independent verifier: reads an integer-weight certificate and checks the bound for
# C = sup_f  min_{0<=t<=1} ∫ f(x)f(x+t)dx / ||f||_1^2  (Barnard–Steinerberger constant)
# f = sum_i w_i * 1[i/K, (i+1)/K). For equal-width steps the autocorrelation is
# piecewise linear in t with breakpoints at multiples of 1/K, so the min over [0,1]
# is attained at t = k/K, k = 0..K, where ∫ f f(.+k/K) = (1/K) sum_i w_i w_{i+k}.
import json, sys
from fractions import Fraction
c = json.load(open(sys.argv[1])); K = c["K"]; w = c["weights_int"]
assert all(isinstance(x, int) and x >= 0 for x in w)
n = len(w); S = sum(w)
corr = [sum(w[i] * w[i + k] for i in range(n - k)) for k in range(K + 1)]
bound = Fraction(K * min(corr), S * S)
print(f"K={K}, steps={n}, exact bound C >= {bound.numerator}/{bound.denominator}")
print(f"  = {float(bound):.12f}")
