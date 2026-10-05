"""vred.py — red tests: forged certificates must be REJECTED by vcheck.py."""
import json, sys, copy, subprocess, os
from fractions import Fraction as Fr
PY = sys.executable
def run(files, focus=None):
    """run vcheck on the files; returns (accepted, the line about `focus` or the last line)."""
    r = subprocess.run([PY, 'vcheck.py'] + files, capture_output=True, text=True)
    lines = (r.stdout + r.stderr).strip().splitlines()
    if focus:
        mine = [l for l in lines if l.startswith(focus + ':')]
        line = mine[0] if mine else lines[-1]      # an assertion before the verdict line
    else: line = lines[-1]
    return r.returncode == 0, line[:160]
def forge(src, dst, f):
    C = json.load(open(src)); f(C); json.dump(C, open(dst, 'w')); return dst
def main(slab, inner, allfiles):
    tests = []
    def raise_B(C):
        C['B'] = str(Fr(C['B']) + Fr(1, 1000)); C['claim'] = str(Fr(C['B']) - Fr(C['eps']) * (1 + len(C['grid']) - 1))
    tests.append(('slab bound raised by 1e-3', forge(slab, 'red-1.json', raise_B), False))
    tests.append(('slab triangle multipliers dropped', forge(slab, 'red-2.json', lambda C: C.update(forms=[f for f in C['forms'] if f[0] != 'tri'])), False))
    tests.append(('slab cut-pair theta all 1', forge(slab, 'red-3.json', lambda C: C.update(theta=['1'] * len(C['theta']))), False))
    tests.append(('slab grid missing a breakpoint', forge(slab, 'red-4.json', lambda C: C.update(grid=[p for p in C['grid'] if p != 68])), False))
    def widen(C): C['hi'] = str(Fr(C['hi']) + Fr(1, 10))
    tests.append(('slab region widened', forge(slab, 'red-5.json', widen), False))
    tests.append(('inner radius doubled', forge(inner, 'red-6.json', lambda C: C.update(rin=str(2 * Fr(C['rin'])))), False))
    def spend(C):
        k = next(iter(C['lam'])); C['lam'][k] = str(Fr(C['lam'][k]) + Fr(1, 10**3))
    tests.append(('inner linear budget overspent', forge(inner, 'red-7.json', spend), False))
    def dropN(C): C['N'] = {}
    tests.append(('inner RLT multipliers dropped', forge(inner, 'red-8.json', dropN), False))
    fails = 0
    for name, fn, expect in tests:
        orig = slab if 'slab' in name else inner
        files = [fn if f == orig else f for f in allfiles]
        ok, last = run(files, focus=fn)
        if ok == expect is False: pass
        assert ('FAILED' in last or 'Error' in last) or ok, last
        verdict = 'REJECTED' if not ok else 'ACCEPTED'
        good = (ok == expect)
        fails += not good
        print(f"{'ok ' if good else 'BAD'}  {name:40s} -> {verdict}   [{last}]")
        os.remove(fn)
    # cover: drop one slab from the full set
    ok, last = run([f for f in allfiles if f != slab])
    print(f"{'ok ' if not ok else 'BAD'}  {'cover with one slab removed':40s} -> {'REJECTED' if not ok else 'ACCEPTED'}   [{last}]")
    fails += ok
    ok, last = run(allfiles)
    print(f"{'ok ' if ok else 'BAD'}  {'the genuine certificate set':40s} -> {'ACCEPTED' if ok else 'REJECTED'}   [{last}]")
    fails += not ok
    print("RED TESTS:", "ALL AS EXPECTED" if fails == 0 else f"{fails} UNEXPECTED")
if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
