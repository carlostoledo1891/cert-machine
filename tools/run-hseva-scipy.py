#!/usr/bin/env python3
"""run-hseva-scipy.py — what scipy prints, recorded as a claimant's output for the
ledger to decide. Writes certs/hseva-scipy.json.

For each of the benchmark's buoys and each block the ledger fits (the block maxima
taken from tools/run-hseva-ledger.js --unit series:X, so there is ONE block rule),
four of the paper's families are fitted by scipy.stats `fit` twice: with the
location fixed at zero (floc=0, the families as the paper writes them) and as
the default call leaves it (location free: a three- or four-parameter model).
Recorded per fit: the parameters as scipy returns them (repr, every digit), the
100- and 1000-year levels scipy's ppf gives, and the seconds. Nothing is judged
here; tools/run-hseva-ledger.js decides every number against the certificate.

usage (instruments/hseva/.venv — `make hseva-venv`): python3 tools/run-hseva-scipy.py
"""
import json, os, platform, subprocess, sys, time, warnings
import numpy as np
import scipy
from scipy import stats

warnings.filterwarnings('ignore')
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FAMS = {'lognormal': stats.lognorm, 'weibull': stats.weibull_min, 'expweibull': stats.exponweib, 'gengamma': stats.gengamma}
T = [100, 1000]
out = {'what': 'scipy.stats fit, recorded as printed — the claimant whose numbers certs/hseva-ledger.json decides. floc0: location fixed at zero; default: the call without floc (location free).',
       'scipy': scipy.__version__, 'numpy': np.__version__, 'python': platform.python_version(), 'generated': time.strftime('%Y-%m-%d'),
       'parameterization': {'lognormal': 'lognorm(s, loc, scale): σ = s, μ = ln scale', 'weibull': 'weibull_min(c, loc, scale): k = c, λ = scale',
                            'expweibull': 'exponweib(a, c, loc, scale): α = a, k = c, λ = scale', 'gengamma': 'gengamma(a, c, loc, scale): α = a, c = c, λ = scale'},
       'buoys': {}}
for b in 'ABC':
    ser = json.loads(subprocess.run(['node', os.path.join(ROOT, 'tools', 'run-hseva-ledger.js'), '--unit', 'series:' + b], cwd=ROOT, capture_output=True, check=True).stdout)
    out['buoys'][b] = {}
    for blk, S in ser.items():
        x = np.array(S['x']); h = S['hours']
        rec = {'n': len(x)}
        for f, D in FAMS.items():
            r = {}
            for mode in ('floc0', 'default'):
                t0 = time.time()
                try:
                    par = D.fit(x, floc=0) if mode == 'floc0' else D.fit(x)
                    d = D(*par)
                    lv = {}
                    for T_ in T:
                        p = 1 - h / (T_ * 8766.0)
                        lv[str(T_)] = repr(float(d.ppf(p))) if p > 0 else None
                    r[mode] = {'params': [repr(float(v)) for v in par], 'level': lv, 'seconds': round(time.time() - t0, 2)}
                except Exception as e:
                    r[mode] = {'error': str(e)}
            rec[f] = r
        out['buoys'][b][blk] = rec
        print(b, blk, 'n', len(x), 'done', flush=True)
json.dump(out, open(os.path.join(ROOT, 'certs', 'hseva-scipy.json'), 'w'), indent=1)
print('certs/hseva-scipy.json written')
