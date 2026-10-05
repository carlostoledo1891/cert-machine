import sys, json, glob, os
for fn in sorted(glob.glob(os.path.join(sys.argv[1], "*.jsonl"))):
    L = sorted([json.loads(l) for l in open(fn) if 'error' not in l], key=lambda d: d['m'])
    if not L: continue
    print(os.path.basename(fn)[:-6].ljust(16), ' '.join('%7.1f' % (d['logP_at_zeta']/d['m']**2) for d in L))
