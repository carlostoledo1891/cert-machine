import sys, json, glob, os
rows = []
for fn in sorted(glob.glob(os.path.join(sys.argv[1], "*.jsonl"))):
    L = [json.loads(l) for l in open(fn)]
    L = [d for d in L if 'error' not in d]
    if not L: continue
    L.sort(key=lambda d: d['m'])
    d = L[-1]; m = d['m']
    lp = {e['m']: e['logP_at_zeta'] for e in L}
    c2 = None
    if m >= 3 and all(x in lp for x in (m, m-1, m-2)):
        c2 = (lp[m] - 2*lp[m-1] + lp[m-2]) / 2
    # least-squares fit logP = c m^2 + d m log m + e m over m>=3
    import math
    pts = [(e['m'], e['logP_at_zeta']) for e in L if e['m'] >= 3]
    fit = None
    if len(pts) >= 4:
        import numpy as np
        X = np.array([[mm*mm, mm*math.log(mm), mm] for mm, _ in pts]); y = np.array([v for _, v in pts])
        fit = np.linalg.lstsq(X, y, rcond=None)[0][0]
    rows.append((d['k'], d['a'], d['b'], d['r'], m, d['h'], d['logP_at_zeta']/m**2, d['log_content']/m**2, d['log_delta_at_zeta']/m**2, c2, fit))
rows.sort()
print("k  a  b  r  m   h   logP/m2  cont/m2  delta/m2  c2(2nd diff)  c(fit)")
for r in rows:
    print("%d %2d %2d %2d %2d %3d %8.2f %8.2f %8.2f %10s %10s" % (r[:6] + r[6:9] + (('%.2f' % r[9]) if r[9] is not None else '-', ('%.2f' % r[10]) if r[10] is not None else '-')))
