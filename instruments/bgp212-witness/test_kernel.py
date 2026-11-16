# compare the C modular kernel with the Fraction reference (decomp.py) piece by piece
import sys, random, subprocess, os, time
from fractions import Fraction as Fr
from decomp import compute_IJ
from prep import build

def mkC(caps):
    caps = [Fr(c) for c in caps]
    return lambda m: Fr(0) if m == 0 else caps[min(m, len(caps)) - 1]

def modp(x, p):
    x = Fr(x); return x.numerator % p * pow(x.denominator % p, -1, p) % p

datums = {
 'toy':  dict(g=3, L=10, caps=[6, 8], tau=8),
 'toy2': dict(g=2, L=9, caps=[4, 5, 7], tau=8),
 'real': dict(g=82, L=1325, caps=[777,794,875,917,953,983,1016,1042,1063,1081], tau=1245),
}
K = int(sys.argv[1]); seed = int(sys.argv[2]); maxdeg = int(sys.argv[3]) if len(sys.argv) > 3 else 4
random.seed(seed)
primes = [2147483647, 2147483629]
allok = True
for name, d in datums.items():
    dat = dict(K=K, g=Fr(d['g']), L=Fr(d['L']), C=mkC(d['caps']), tau=Fr(d['tau']))
    from core import partitions_upto
    lams = [l for l in partitions_upto(maxdeg // 2) if len(l) <= K]
    terms = []
    for lam in lams:
        for a in range(0, maxdeg + 1 - 2 * sum(lam)):
            if random.random() < 0.7:
                terms.append((a, lam, random.randint(-9, 9)))
    t0 = time.time()
    I, J, parts = compute_IJ(terms, dat)
    t1 = time.time()
    path = f'logs/kin_{name}_K{K}.txt'
    meta = build(terms, dat, path, log=lambda s: None)
    out = f'logs/kout_{name}_K{K}.txt'
    if os.path.exists(out): os.remove(out)
    subprocess.run(['./kernel', path, out] + [str(p) for p in primes], check=True, capture_output=True)
    t2 = time.time()
    ok = True
    for line in open(out):
        p, r0, r1, r2, r3 = map(int, line.split())
        exp = [modp(parts['I1'], p), modp(parts['J1'] * meta['s_Z0'], p), modp(parts['J3'] * meta['s_ZD'], p), modp(parts['J2'] * meta['s_Pi'], p)]
        got = [r0, r1, r2, r3]
        if exp != got:
            ok = False; print("  MISMATCH p", p, "exp", exp, "got", got)
        assert meta['I0'] == parts['I0'] and meta['J0'] == parts['J0']
    allok &= ok
    print(f"K={K} {name} deg<={maxdeg} terms={len(terms)}: kernel==reference: {ok}  (ref {t1-t0:.1f}s, kernel {t2-t1:.1f}s)  nonzero pieces:",
          {k: (v != 0) for k, v in parts.items()}, flush=True)
print("ALL OK" if allok else "SOME MISMATCH")
