"""L-BFGS-B over the 11 weight-class red probabilities f_0..f_10 of the Z_2^10 step graphon (K6 multiplicity)."""
import subprocess, sys, numpy as np
from scipy.optimize import minimize
calls = [0]
def fg(f):
    out = subprocess.run(['./c6', 'float'] + [repr(float(x)) for x in f], capture_output=True, text=True).stdout.split()
    v = np.array([float(x) for x in out]); calls[0] += 1
    print(f"call {calls[0]}: c6*2^14={v[0]*16384:.12f} f={np.round(f,6).tolist()}", flush=True)
    return v[0] * 16384, v[1:] * 16384
x0 = np.array([1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], dtype=float)
r = minimize(fg, x0, jac=True, method='L-BFGS-B', bounds=[(0, 1)] * 11, options=dict(maxiter=200, ftol=1e-15, gtol=1e-12))
print("RESULT", r.fun, r.x.tolist(), r.message)
