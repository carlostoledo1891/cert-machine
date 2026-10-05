"""scan2.py — parallel scan over generalized families (hankel2).
spec = (kind, k, typ, a, b, r): K = a*m, N = b*m
  typ 'int' : poles at -j^2, j = N+1..K ; numerator (t+i^2)^(r-1), i = 1..N
  typ 'half': poles at -(j+1/2)^2, j = N..K-1 ; numerator (t+(i+1/2)^2)^(r-1), i = 0..N-1
  typ 'grid': poles at -(u/2)^2, u = 2N+1..2K ; numerator (t+(u/2)^2)^(r-1), u = 1..2N
usage: python scan2.py OUTDIR HMAX 'kind:k:typ:a:b:r' ...  (or --grid NAME)"""
import sys, os, json
from multiprocessing import Pool
from flint import fmpq

def nodes(typ, K, N, r):
    if typ == 'int':
        return [fmpq(j) for j in range(N + 1, K + 1)], [(fmpq(i), r - 1) for i in range(1, N + 1)]
    if typ == 'half':
        return [fmpq(2 * j + 1, 2) for j in range(N, K)], [(fmpq(2 * i + 1, 2), r - 1) for i in range(N)]
    if typ == 'grid':
        return [fmpq(u, 2) for u in range(2 * N + 1, 2 * K + 1)], [(fmpq(u, 2), r - 1) for u in range(1, 2 * N + 1)]
    raise ValueError(typ)

def hsize(typ, K, N):
    return 2 * (K - N) if typ == 'grid' else K - N

def job(args):
    spec, m, outdir = args
    kind, k, typ, a, b, r = spec
    from hankel2 import run
    K, N = a * m, b * m
    den, num = nodes(typ, K, N, r)
    num = [x for x in num if x[1] > 0]
    try:
        res, P, D = run(k, kind, den, num)
    except Exception as e:
        res = dict(error=repr(e))
    res.update(spec=list(spec), m=m, K=K, N=N)
    fn = os.path.join(outdir, "%s_k%d_%s_a%d_b%d_r%d.jsonl" % spec)
    with open(fn, "a") as f:
        f.write(json.dumps(res) + "\n")

def parse(s):
    kind, k, typ, a, b, r = s.split(':')
    return (kind, int(k), typ, int(a), int(b), int(r))

if __name__ == "__main__":
    outdir = sys.argv[1]; hmax = int(sys.argv[2]); os.makedirs(outdir, exist_ok=True)
    specs = [parse(s) for s in sys.argv[3:]]
    tasks = []
    for sp in specs:
        m = 1
        while hsize(sp[2], sp[3] * m, sp[4] * m) <= hmax:
            tasks.append((sp, m, outdir)); m += 1
    tasks.sort(key=lambda t: hsize(t[0][2], t[0][3] * t[1], t[0][4] * t[1]))
    with Pool(int(os.environ.get("NPROC", "7"))) as p:
        list(p.imap_unordered(job, tasks))
