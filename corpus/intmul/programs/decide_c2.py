#!/usr/bin/env python3
"""decide_c.py — the C/GMP multiplier of the companion paper on operands WE choose, decided by Python integers.
The operands are written by this script (a seeded generator of the standard library, and fixed patterns), the
release's code multiplies them through harness.c, and the product is compared with Python's a*b. One JSON line per
case. usage: decide_c.py <harness> <workdir> <out.jsonl> <sizes,comma> <algos,comma> [cases,comma]"""
import sys, os, json, time, random, hashlib, subprocess
harness, work, out, sizes, algos = sys.argv[1], sys.argv[2], sys.argv[3], [int(x) for x in sys.argv[4].split(',')], [int(x) for x in sys.argv[5].split(',')]
want = sys.argv[6].split(',') if len(sys.argv) > 6 else ['random', 'ones', 'pow2', 'alt', 'unbalanced', 'zero', 'one']
SEED = 20261117
os.makedirs(work, exist_ok=True)
def cases(n):
    r = random.Random(SEED * 1000003 + n)
    top = 1 << (n - 1)
    alt_a = int('a' * ((n + 3) // 4), 16) & ((1 << n) - 1) | top
    alt_b = int('5' * ((n + 3) // 4), 16) & ((1 << n) - 1) | top
    c = {'random': (r.getrandbits(n) | top, r.getrandbits(n) | top),
         'ones': ((1 << n) - 1, (1 << n) - 1),
         'pow2': (top, top),
         'alt': (alt_a, alt_b),
         'unbalanced': (r.getrandbits(n) | top, 3),
         'zero': (r.getrandbits(n) | top, 0),
         'one': (r.getrandbits(n) | top, 1)}
    return [(k, c[k]) for k in want]
with open(out, 'a') as o:
    for n in sizes:
        for name, (a, b) in cases(n):
            for algo in algos:
                fa, fb, fo = (os.path.join(work, x) for x in ('a.hex', 'b.hex', 'out.hex'))
                open(fa, 'w').write('%x' % a); open(fb, 'w').write('%x' % b)
                if os.path.exists(fo): os.remove(fo)
                t0 = time.time()
                try:
                    p = subprocess.run([harness, str(algo), fa, fb, fo, str(n)], capture_output=True, text=True, timeout=7200)
                    code, said = p.returncode, (p.stdout.strip().split('\n') or [''])[-1][:200]
                except subprocess.TimeoutExpired:
                    code, said = 'timeout', ''
                secs = round(time.time() - t0, 2)
                row = {'bits': n, 'case': name, 'algo': 'sinc' if algo else 'gauss', 'exit': code, 'release_says': said, 'seconds': secs}
                if code == 0 and os.path.exists(fo):
                    t1 = time.time(); want_p = a * b; row['python_mul_seconds'] = round(time.time() - t1, 2)
                    txt = open(fo).read().strip()
                    got = int(txt, 16) if txt else None      # an empty file is no product, never zero
                    row['ours'] = 'NO PRODUCT' if got is None else 'EXACT' if got == want_p else 'MISMATCH'
                    row['product_sha256'] = hashlib.sha256(('%x' % want_p).encode()).hexdigest()
                else:
                    row['ours'] = 'NO PRODUCT'
                o.write(json.dumps(row) + '\n'); o.flush(); print(json.dumps(row), flush=True)
