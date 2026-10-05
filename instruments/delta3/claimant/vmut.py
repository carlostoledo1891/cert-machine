"""vmut.py — mutation rows for the VERIFIER: each row edits one line of vcheck.py in a scratch copy and
runs it on the genuine certificate set; a mutation must make it reject (else the checker is blind)."""
import subprocess, sys, os, shutil
PY = sys.executable
FILES = sys.argv[1:]
src = open('vcheck.py').read()
ROWS = [
    ('phi* blocks altered (28,6 -> 29,5)', 'BLOCKS = [28, 6, 28,', 'BLOCKS = [29, 5, 28,'),
    ('h sign flipped', "        hl, hr = -sl * g, -sr * g", "        hl, hr = sl * g, sr * g"),
    ('cut bound s s=-1 made optimistic (0)', "else max(-ain, -ww)", "else Fr(0)"),
    ('cut pair s s=-1 bound dropped in the identity', "        else: put(0, 0, -th * ain); put(i + 1, j + 1, -(1 - th) * ww)", "        else: pass"),
    ('bathtub curvature doubled', "    return w, a, w * w / 2 / dens", "    return w, a, w * w / dens"),
    ('bathtub slope from max h', "    a = w * min(s[0] for s in segs)", "    a = w * max(s[1] for s in segs)"),
    ('region R mirrored (b <= a/2)', "lambda p: p[1] - p[0] / 2, lambda", "lambda p: p[0] / 2 - p[1] + 0 * p[1], lambda"),
    ('PD test accepts zero pivots', "        if A[k][k] <= 0: return False, k", "        if A[k][k] < 0: return False, k"),
    ('eps ignored in the claim', "    claim = B - eps * (1 + n)\n    assert claim == Fr(C['claim'])", "    claim = B\n"),
    ('triangle sign rule relaxed', "and sg[0] * sg[1] * sg[2] == 1", "and True"),
]
import json
from fractions import Fraction as Fr
os.makedirs('mut', exist_ok=True)
# planted forgeries: each must be REJECTED by the genuine verifier; a mutation that lets one through is DETECTED
slab = next(f for f in FILES if f.startswith('slab-'))
C = json.load(open(slab)); n = len(C['grid']) - 1
C1 = dict(C); C1['eps'] = str(Fr(C['B']) / n); C1['claim'] = str(Fr(C['B']) - Fr(C1['eps']) * (1 + n))
json.dump(C1, open('mut/forge-eps.json', 'w'))
C2 = dict(C); C2['forms'] = C['forms'] + [['tri', [0, 1, 2, [1, 1, -1]], '1/1000000000000000']]
json.dump(C2, open('mut/forge-tri.json', 'w'))
C3 = dict(C); C3['eps'] = '0'; C3['claim'] = C['B']
json.dump(C3, open('mut/forge-noeps.json', 'w'))
PLANTED = ['forge-eps.json', 'forge-tri.json', 'forge-noeps.json']
def planted_accepted(cwd):
    acc = []
    for pf in PLANTED:
        files = [pf if f == slab else f for f in FILES]
        r = subprocess.run([PY, 'vcheck.py'] + files, cwd=cwd, capture_output=True, text=True)
        if r.returncode == 0: acc.append(pf)
    return acc
bad = 0
for name, old, new in ROWS:
    assert old in src, name
    open('mut/vcheck.py', 'w').write(src.replace(old, new, 1))
    for f in FILES: shutil.copy(f, 'mut/' + f) if not os.path.exists('mut/' + f) else None
    r = subprocess.run([PY, 'vcheck.py'] + FILES, cwd='mut', capture_output=True, text=True)
    out = (r.stdout + r.stderr).strip().splitlines()
    rejected = r.returncode != 0
    leaked = [] if rejected else planted_accepted('mut')
    det = rejected or bool(leaked)
    bad += not det
    how = 'genuine set rejected' if rejected else (f'planted forgery accepted: {leaked}' if leaked else 'no difference')
    print(f"{'DETECTED  ' if det else 'NOT SEEN  '} {name:45s} [{how}; {out[-1][:70] if out else ''}]", flush=True)
open('mut/vcheck.py', 'w').write(src)
leak = planted_accepted('mut')
print("planted forgeries accepted by the GENUINE verifier:", leak or 'none')
print("MUTATIONS:", "ALL DETECTED" if bad == 0 else f"{bad} NOT DETECTED")
