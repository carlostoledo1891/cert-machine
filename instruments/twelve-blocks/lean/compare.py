"""Fidelity check 1: the Lean #eval output against the Python reference.

    python3 compare.py            (reads eval-m1-8.txt, written by check.sh)

Compares, for m = 1..8, all 22 linear and 231 quadratic values (8 x 253 numbers).
Also checks the extra `twice` column: even, and twice // 2 == linear.
Exit code 0 only if everything agrees exactly.
"""
import ast
import re
import sys
import reference

rows = {}
for line in open("eval-m1-8.txt"):
    mo = re.match(r"EVAL m=(\d+) twice=(\[.*?\]) linear=(\[.*?\]) quadratic=(\[.*?\])\s*$", line)
    if mo:
        rows[int(mo.group(1))] = tuple(ast.literal_eval(mo.group(i)) for i in (2, 3, 4))

compared = mismatches = 0
ok = True
for m in range(1, 9):
    if m not in rows:
        print(f"m={m}: MISSING from eval-m1-8.txt")
        ok = False
        continue
    tw, lin, quad = rows[m]
    rlin, rquad = reference.signature(m)
    if len(lin) != 22 or len(quad) != 231 or len(rlin) != 22 or len(rquad) != 231 or len(tw) != 22:
        print(f"m={m}: LENGTH MISMATCH lean ({len(lin)}, {len(quad)}) reference ({len(rlin)}, {len(rquad)})")
        ok = False
        continue
    bad = [("linear", i, a, b) for i, (a, b) in enumerate(zip(lin, rlin)) if a != b]
    bad += [("quadratic", i, a, b) for i, (a, b) in enumerate(zip(quad, rquad)) if a != b]
    compared += 253
    mismatches += len(bad)
    tw_ok = all(t % 2 == 0 and t // 2 == l for t, l in zip(tw, lin))
    print(f"m={m}: linear 22/22 compared, quadratic 231/231 compared, mismatches {len(bad)}, "
          f"twice even and twice//2 == linear: {tw_ok}")
    for b in bad[:10]:
        print("   ", b)
    ok = ok and not bad and tw_ok

print(f"numbers compared: {compared} (expected {8 * 253}); mismatches: {mismatches}")
print("RESULT:", "AGREE" if ok and compared == 8 * 253 else "DISAGREE")
sys.exit(0 if ok and compared == 8 * 253 else 1)
