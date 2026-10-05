import sys, json, glob, os
rows = []
for fn in glob.glob(os.path.join(sys.argv[1], "*.jsonl")):
    L = sorted([json.loads(l) for l in open(fn)], key=lambda d: d['m'])
    L = [d for d in L if 'error' not in d]
    if not L: continue
    # normalise by h^2 (the matrix size), comparable across families
    vals = [d['logP_at_X'] / d['h'] ** 2 for d in L]
    rows.append((vals[-1], os.path.basename(fn)[:-6], vals, L[-1]['h']))
rows.sort()
for last, name, vals, h in rows:
    print(name.ljust(26), 'h=%3d' % h, ' '.join('%6.2f' % v for v in vals[-6:]))
