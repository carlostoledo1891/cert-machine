#!/usr/bin/env python3
"""Red control: perturb ONE block-pair weight of the certificate by +1/2^20 (kept symmetric) and show the exact value
moves.  Also recomputes the baseline so the two numbers come from the same code path.
usage: red_control.py certificate.json [i j]
"""
import sys, time
from fractions import Fraction
from decimal import Decimal, getcontext
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from k5_exact import density, load

getcontext().prec = 50
D, R, w = load(sys.argv[1])
m = len(R)
if len(sys.argv) > 3:
    i, j = int(sys.argv[2]), int(sys.argv[3])
else:
    # first off-diagonal entry strictly between 0 and D (a 'moved' entry), so +1 stays inside [0, D]
    i, j = next((a, b) for a in range(m) for b in range(m) if a != b and 0 < R[a][b] < D)
print(f'perturbing R[{i}][{j}] = R[{j}][{i}] = {R[i][j]} -> {R[i][j] + 1}  (i.e. +2^-20 on one block pair)')
t0 = time.process_time()
_, _, base = density(D, R, 'A')
R2 = [row[:] for row in R]
R2[i][j] += 1; R2[j][i] += 1
_, _, pert = density(D, R2, 'A')
print(f'baseline  = {base.numerator}/{base.denominator}')
print(f'baseline  = {Decimal(base.numerator)/Decimal(base.denominator):.30f}')
print(f'perturbed = {pert.numerator}/{pert.denominator}')
print(f'perturbed = {Decimal(pert.numerator)/Decimal(pert.denominator):.30f}')
d = pert - base
print(f'difference = {d.numerator}/{d.denominator} = {Decimal(d.numerator)/Decimal(d.denominator):.6e}   moved: {d != 0}')
print(f'cpu {time.process_time()-t0:.1f}s')
