#!/usr/bin/env python3
"""tensorlb battery — green controls plus red controls that MUST fire.

A gate that cannot fail is not a gate. Every red below corrupts a pinned
certificate and requires the instrument to refuse it.
"""
import hashlib, json, os, re, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'corpus', 'sources')
VER = os.path.join(ROOT, 'instruments', 'tensorlb', 'verify.py')
sys.path.insert(0, os.path.dirname(VER))
import verify as V

N222 = os.path.join(SRC, 'wang_cert_matrix_q02_n222.pb.txt')
N333 = os.path.join(SRC, 'wang_cert_matrix_q02_n333.pb.txt')
checks = []; reds = []
def ok(c, m): checks.append((bool(c), m))
def red(c, m): reds.append((bool(c), m))

def run(path):
    r = subprocess.run([sys.executable, VER, path], capture_output=True, text=True)
    return r.returncode, r.stdout

# --- provenance: the bytes we audit are the bytes Wang published ---
pins = json.load(open(os.path.join(SRC, 'PINS.json')))
for f, upstream_oid in (('wang_cert_matrix_q02_n222.pb.txt', None),
                        ('wang_cert_matrix_q02_n333.pb.txt',
                         '25595a883ce877eecd802139ff4e07646e154b2797ad6fe7f9ec737ab0c6135d')):
    h = hashlib.sha256(open(os.path.join(SRC, f), 'rb').read()).hexdigest()
    ok(pins.get(f) == h, f'{f} matches its pin')
    if upstream_oid:
        ok(h == upstream_oid, 'n333 sha256 == the git-lfs oid Wang published upstream')

# --- green: the control certificate, where rank 7 is known optimal (Winograd 1971) ---
rc, out = run(N222)
ok(rc == 0, 'n222 control certificate passes')
ok('10 ok, 0 BAD' in out, 'all 10 upper-bound witnesses re-verify against rebuilt sub-tensors')
m = re.search(r'CONFIRMED[^:]*:\s*(\d+)', out)
ok(m and int(m.group(1)) >= 3, 'at least 3 n222 bounds proved two-sided (rules not trusted)')
ok(re.search(r'REFUTED[^:]*:\s*0', out) is not None, 'n222: no node refuted')

# the sanity trap: the full <2,2,2> tensor must not admit rank <= 6
n, na, nodes = V.parse(N222)
T, dim = V.sub_tensor(nodes[-1]['mk'], n, na)
ok(dim == na and nodes[-1]['lb'] == 7, 'n222 root node is the unconstrained tensor with lb 7')

# --- green: the real target ---
rc3, out3 = run(N333)
ok(rc3 == 0, 'n333 certificate (R_F2(<3,3,3>) >= 20) passes the audit')
ok(re.search(r'REFUTED[^:]*:\s*0', out3) is not None, 'n333: no node refuted')
m3 = re.search(r'CONFIRMED[^:]*:\s*(\d+)', out3)
ok(m3 and int(m3.group(1)) >= 4, 'at least 4 n333 bounds proved two-sided')
ok(re.search(r'nodes:\s*496', out3) is not None, 'n333 certificate has its published 496 nodes')

# --- red controls ---
base = open(N222).read()
def red_run(txt, label):
    fd, p = tempfile.mkstemp(suffix='.pb.txt'); os.write(fd, txt.encode()); os.close(fd)
    rc, _ = run(p); os.unlink(p)
    red(rc != 0, label)

red_run(re.sub(r'(index: 1\n(?:.*\n)*?  rank_lower_bound: )2', r'\g<1>3', base, count=1),
        'a claimed lower bound inflated past the true rank is REFUSED')
red_run(base.replace('rank=2. (a3)*(b2)*(c1) + (a3)*(b3)*(c3)',
                     'rank=2. (a3)*(b2)*(c1) + (a3)*(b3)*(c2)', 1),
        'one altered witness coefficient is REFUSED')
red_run(base.replace('rank=4. (a1)*(b0)*(c1) + (a1)*(b1)*(c3) + (a1)*(b2)*(c0) + (a1)*(b3)*(c2)',
                     'rank=4. (a1)*(b0)*(c1) + (a1)*(b1)*(c3) + (a1)*(b2)*(c0)', 1),
        'a deleted witness term with an unchanged rank label is REFUSED')

for c, m in checks: print(('PASS  ' if c else 'FAIL  ') + m)
for c, m in reds:   print(('RED ok  ' if c else 'RED DEAD  ') + m)
nf = sum(1 for c, _ in checks if not c) + sum(1 for c, _ in reds if not c)
print(f"\n{'battery green' if nf==0 else 'BATTERY RED'}: {len(checks)}/{len(checks)} checks, {len(reds)}/{len(reds)} red controls fired")
sys.exit(1 if nf else 0)
