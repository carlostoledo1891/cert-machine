#!/usr/bin/env python3
"""tie.py — the Lean file's values against the definition of M.

For m = 1..8, B_m is recounted from its bits with one site flipped (22 sites) and with two sites flipped (231
pairs), by the judge's counter. The cost of flipping p must be linear(p); the cost of flipping p and q, minus the
two single costs, must be quad(p, q). The Lean values are the #eval lines kept in eval-m1-8.txt.
Prints one line; exit 0 only if all 8 x 253 numbers agree."""
import ast, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.dirname(HERE))
import judge                                                 # noqa: E402

rows = {}
for line in open(os.path.join(HERE, 'eval-m1-8.txt')):
    mo = re.match(r"EVAL m=(\d+) twice=(\[.*?\]) linear=(\[.*?\]) quadratic=(\[.*?\])\s*$", line)
    if mo: rows[int(mo.group(1))] = (ast.literal_eval(mo.group(3)), ast.literal_eval(mo.group(4)))


def run():
    bad = compared = 0
    for m in range(1, 9):
        _, single, pair = judge.d5_coeffs(m)
        lin, quad = rows[m]
        k = 0
        for i in range(22):
            compared += 1; bad += single[i] != lin[i]
            for j in range(i + 1, 22):
                compared += 1; bad += pair[k] - single[i] - single[j] != quad[k]; k += 1
    return compared, bad


if __name__ == '__main__':
    compared, bad = run()
    print('%s: %d numbers compared (the Lean values against whole-colouring recounts, m = 1..8), %d differ' % ('PASS' if not bad and compared == 2024 else 'FAIL', compared, bad))
    sys.exit(1 if bad or compared != 2024 else 0)
