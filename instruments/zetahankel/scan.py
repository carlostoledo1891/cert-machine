"""scan.py — run many (k, a, b, r) families in parallel: K = a*m, N = b*m, h = K - N.
usage: scan.py OUTDIR HMAX k:a:b:r [k:a:b:r ...]"""
import sys, os, json, time
from multiprocessing import Pool

def job(args):
    k, a, b, r, m, outdir = args
    from hankel import run
    try:
        res, P, D = run(k, a * m, b * m, r, None, verbose=False)
        res.update(m=m, a=a, b=b)
    except Exception as e:
        res = dict(k=k, a=a, b=b, r=r, m=m, error=repr(e))
    fn = os.path.join(outdir, f"k{k}_a{a}_b{b}_r{r}.jsonl")
    with open(fn, "a") as f:
        f.write(json.dumps(res) + "\n")
    return res

if __name__ == "__main__":
    outdir = sys.argv[1]; hmax = int(sys.argv[2])
    os.makedirs(outdir, exist_ok=True)
    fams = [tuple(map(int, s.split(":"))) for s in sys.argv[3:]]
    tasks = []
    for (k, a, b, r) in fams:
        m = 1
        while (a - b) * m <= hmax:
            tasks.append((k, a, b, r, m, outdir)); m += 1
    tasks.sort(key=lambda t: (t[1] - t[2]) * t[4])   # small first
    with Pool(int(os.environ.get("NPROC", "7"))) as p:
        for _ in p.imap_unordered(job, tasks):
            pass
