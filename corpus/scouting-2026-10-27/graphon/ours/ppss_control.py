#!/usr/bin/env python3
"""Positive control: read PPSS's 192-vertex K5 graph (c5.graph6.txt, Zenodo 10.5281/zenodo.6602512, CC-BY-4.0) with a
graph6 parser written from McKay's format description, build the 0/1 step graphon 'red between distinct blocks iff
edge, blue inside blocks' (R_ii = 0, R_ij = D for edges, 0 otherwise), and evaluate its monochromatic-K5 density with
our evaluator.  Published value (PPSS 2024, Thm 1.2): 2320651 * 2^-24 * 3^-4 = 2320651/1358954496.
Also compares the certificate matrix with the PPSS adjacency: where did the gradient refinement move entries?
usage: ppss_control.py c5.graph6.txt certificate.json
"""
import sys, json, time, collections
from fractions import Fraction
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from k5_exact import density, load


def parse_graph6(line):
    b = [c - 63 for c in line.strip().encode('ascii')]
    assert all(0 <= x <= 63 for x in b)
    if b[0] < 63:
        n, pos = b[0], 1
    elif b[1] < 63:
        n, pos = (b[1] << 12) | (b[2] << 6) | b[3], 4
    else:
        n, pos = 0, 2
        for k in range(6):
            n = (n << 6) | b[pos + k]
        pos += 6
    bits = []
    for x in b[pos:]:
        for s in range(5, -1, -1):
            bits.append((x >> s) & 1)
    need = n * (n - 1) // 2
    assert len(bits) >= need and all(v == 0 for v in bits[need:]), 'padding not zero'
    A = [[0] * n for _ in range(n)]
    t = 0
    for j in range(1, n):
        for i in range(j):
            if bits[t]:
                A[i][j] = A[j][i] = 1
            t += 1
    return n, A


def main():
    lines = [l for l in open(sys.argv[1]).read().splitlines() if l.strip()]
    print(f'{len(lines)} graph(s) in file')
    n, A = parse_graph6(lines[0])
    deg = collections.Counter(sum(r) for r in A)
    print(f'PPSS graph: n={n} degrees={dict(deg)} edges={sum(sum(r) for r in A)//2}')
    D = 1 << 20
    R = [[D * A[i][j] if i != j else 0 for j in range(n)] for i in range(n)]
    t0 = time.process_time()
    NR, NB, val = density(D, R, 'B')
    print(f'PPSS 0/1 step graphon: value = {val.numerator}/{val.denominator}  = {float(val):.16f}   cpu {time.process_time()-t0:.1f}s')
    expect = Fraction(2320651, 2 ** 24 * 3 ** 4)
    print(f'published 2320651/1358954496 = {float(expect):.16f}   equal: {val == expect}')
    # compare with the certificate
    Dc, Rc, w = load(sys.argv[2])
    assert Dc == D and len(Rc) == n
    moved = collections.Counter()
    for i in range(n):
        for j in range(n):
            if i == j:
                moved[('diag', Rc[i][j])] += 1
            else:
                moved[('edge' if A[i][j] else 'nonedge', Rc[i][j])] += 1
    print('certificate entries by PPSS status (status, numerator): count')
    for k, v in sorted(moved.items()):
        print('   ', k, v)
    # is the certificate a function of the PPSS graph only through some relabelling? check vertex orderings agree:
    same = sum(1 for i in range(n) for j in range(n) if i != j and (Rc[i][j] != 0) == bool(A[i][j]))
    print(f'off-diagonal positions where (certificate nonzero) == (PPSS edge): {same} of {n*(n-1)}')


if __name__ == '__main__':
    main()
