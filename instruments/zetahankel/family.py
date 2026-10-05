import sys, json, time
from hankel import run
# usage: family.py k Kmul Nmul r nmax [hmul]
k, Km, Nm, r, nmax = map(int, sys.argv[1:6])
hm = int(sys.argv[6]) if len(sys.argv) > 6 else None
for n in range(1, nmax + 1):
    res, P, D = run(k, Km * n, Nm * n, r, hm * n if hm else None, verbose=False)
    res['n'] = n
    res['logP_over_n2'] = res['logP_at_zeta'] / n**2
    res['lc_over_n2'] = res['log_content'] / n**2
    res['ld_over_n2'] = res['log_delta_at_zeta'] / n**2
    print(json.dumps(res), flush=True)
