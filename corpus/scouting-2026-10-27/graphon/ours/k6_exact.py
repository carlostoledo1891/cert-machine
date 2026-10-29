#!/usr/bin/env python3
"""Exact monochromatic-K6 density of the Z_2^nb weight-class step graphon (schema z2^10-weight-class-step-graphon-v1):
2^nb blocks of equal measure indexed by x in Z_2^nb, red value W(x,y) = n[|x xor y|] / D (n[0] inside a block).
Standard library only; written from constants/89c.md and construction.json, no code shared with the claimant.

Definition (89c.md): C_89c = min over 2-edge-coloured graphons of t(K6, W) + t(K6, 1-W), with
    t(K6, W) = (1/N^6) sum over ORDERED 6-tuples (x_0..x_5) of blocks of prod_{a<b} W(x_a, x_b),   N = 2^nb.

Reduction 1 (translation, an exact bijection): for any t, (x_a) -> (x_a xor t) preserves every pair weight because
(x_a xor t) xor (x_b xor t) = x_a xor x_b.  Taking t = x_0 shows the sum over all 6-tuples equals N times the sum
over 6-tuples with x_0 = 0.  So  t(K6, W) = (1/N^5) sum_{x_1..x_5} prod_{a=1..5} w(x_a) prod_{1<=a<b<=5} w(x_a xor x_b),
with w(z) = n[|z|]/D.

Reduction 2 (grouping by rows, an exact identity): (x_1..x_5) is an nb x 5 binary matrix; every pair distance
|x_a xor x_b| (and |x_a| = |x_a xor x_0| with x_0 = 0) is the number of rows whose bits at positions a and b differ,
so it depends only on the multiset of rows.  Summing row by row (a DP over the nb coordinates whose state is the
15-vector of partial distances) sums over all 2^(5 nb) matrices exactly; the counts are exact integers.

Value = (N_red + N_blue) / (N^5 * D^15) with N_red = sum_{x_1..x_5} prod_{15 pairs} n[d_ab], N_blue the same with D-n.

Checks: --selftest compares the DP with a naive brute force and with an independent multiset enumeration at nb=3,4;
Franek's 0/1 parameters at nb=10 must give 51162598917/2^50 (Combinatorica 2002); n = D/2 must give 2^-14.
"""
import sys, time, itertools
from fractions import Fraction
from decimal import Decimal, getcontext
from math import factorial

PAIRS = [(a, b) for a in range(6) for b in range(a + 1, 6)]     # 15 pairs on vertices 0..5, vertex 0 is x_0 = 0
NP = len(PAIRS)
SHIFT = 4                                                        # 4 bits per distance digit (distances <= nb <= 15)


def bit(t, a):
    """bit of vertex a in column type t (5 bits for x_1..x_5); vertex 0 is always 0."""
    return 0 if a == 0 else (t >> (a - 1)) & 1


def deltas():
    """for each of the 32 column types, the packed increment of the 15 pair distances."""
    out = []
    for t in range(32):
        d = 0
        for p, (a, b) in enumerate(PAIRS):
            if bit(t, a) != bit(t, b):
                d |= 1 << (SHIFT * p)
        out.append(d)
    return out


def unpack(state):
    return [(state >> (SHIFT * p)) & ((1 << SHIFT) - 1) for p in range(NP)]


def dp_counts(nb, verbose=False):
    """dict: packed distance vector -> number of nb x 5 binary matrices (ordered rows) realising it."""
    dl = deltas()
    cur = {0: 1}
    for level in range(nb):
        nxt = {}
        get = nxt.get
        for s, c in cur.items():
            for d in dl:
                k = s + d
                nxt[k] = get(k, 0) + c
        cur = nxt
        if verbose:
            print(f'    dp level {level+1}/{nb}: {len(cur)} states', file=sys.stderr, flush=True)
    return cur


def N_from_counts(counts, n, D):
    """N_red, N_blue over 5-tuples with x_0 = 0, from the state counts and the weight table n[0..nb]."""
    nb_ = [D - v for v in n]
    NR = NB = 0
    for s, c in counts.items():
        ds = unpack(s)
        pr = 1
        for d in ds:
            pr *= n[d]
            if not pr: break
        if pr: NR += c * pr
        pb = 1
        for d in ds:
            pb *= nb_[d]
            if not pb: break
        if pb: NB += c * pb
    return NR, NB


def value_dp(nb, n, D, verbose=False):
    counts = dp_counts(nb, verbose)
    assert sum(counts.values()) == 32 ** nb, 'DP lost matrices'
    NR, NB = N_from_counts(counts, n, D)
    return NR, NB, Fraction(NR + NB, (2 ** nb) ** 5 * D ** 15), len(counts)


# ---------------------------------------------------------------- independent checks (small nb)
def value_brute(nb, n, D):
    N = 1 << nb
    pc = [bin(z).count('1') for z in range(N)]
    nb_ = [D - v for v in n]
    NR = NB = 0
    for xs in itertools.product(range(N), repeat=5):
        pr = pb = 1
        for a in range(5):
            pr *= n[pc[xs[a]]]; pb *= nb_[pc[xs[a]]]
            for b in range(a + 1, 5):
                h = pc[xs[a] ^ xs[b]]
                pr *= n[h]; pb *= nb_[h]
        NR += pr; NB += pb
    return NR, NB, Fraction(NR + NB, N ** 5 * D ** 15)


def value_multiset(nb, n, D):
    """sum over multisets of nb rows (count vectors c_t over 32 types) of multinomial * product of 15 weights."""
    nb_ = [D - v for v in n]
    sep = [[1 if bit(t, a) != bit(t, b) else 0 for t in range(32)] for (a, b) in PAIRS]
    NR = NB = 0
    fnb = factorial(nb)
    for cuts in itertools.combinations(range(nb + 31), 31):      # stars and bars: 32 counts summing to nb
        prev = -1; c = []
        for x in cuts:
            c.append(x - prev - 1); prev = x
        c.append(nb + 31 - prev - 1)
        mult = fnb
        for ct in c:
            mult //= factorial(ct)
        pr = pb = 1
        for p in range(NP):
            d = sum(c[t] for t in range(32) if sep[p][t])
            pr *= n[d]; pb *= nb_[d]
        NR += mult * pr; NB += mult * pb
    return NR, NB, Fraction(NR + NB, (2 ** nb) ** 5 * D ** 15)


def selftest():
    import random
    rng = random.Random(89)
    for nb in (3, 4):
        for trial in range(2):
            D = 1 << 20
            n = [rng.choice([0, D, rng.randrange(D + 1)]) for _ in range(nb + 1)]
            b = value_brute(nb, n, D)
            m = value_multiset(nb, n, D)
            d = value_dp(nb, n, D)
            assert b[0] == m[0] == d[0] and b[1] == m[1] == d[1], (nb, n, b, m, d)
            print(f'  nb={nb} n={n}: brute == multiset == dp  ok  ({d[3]} dp states)')
    # Franek 2002 at nb=10: red iff |x xor y| in {0,1,3,4,7,8,10}  (0 = inside the block)
    D = 1 << 20
    n = [D if w in (0, 1, 3, 4, 7, 8, 10) else 0 for w in range(11)]
    t0 = time.process_time()
    NR, NB, v, ns = value_dp(10, n, D, verbose=True)
    print(f'  Franek parameters: value = {v.numerator}/{v.denominator}  ({ns} states, cpu {time.process_time()-t0:.0f}s)')
    print(f'  published 51162598917/2^50: equal = {v == Fraction(51162598917, 2**50)}')
    n = [D // 2] * 11
    NR, NB, v, ns = value_dp(10, n, D)
    print(f'  n = D/2: value = {v} == 2^-14: {v == Fraction(1, 2**14)}')
    print('selftest passed')


def main():
    if sys.argv[1] == '--selftest':
        selftest(); return
    import json
    d = json.load(open(sys.argv[1]))
    assert d['schema'] == 'z2^10-weight-class-step-graphon-v1'
    D = int(d['D']); n = [int(x) for x in d['n']]
    nb = len(n) - 1
    assert nb == 10 and all(0 <= x <= D for x in n)
    claimed_dec = sys.argv[2] if len(sys.argv) > 2 else None
    claimed_frac = sys.argv[3] if len(sys.argv) > 3 else None
    print(f'nb={nb} blocks={2**nb} D={D} n={n}; block measures 2^-{nb} each, sum = {Fraction(2**nb, 2**nb)}')
    t0 = time.process_time()
    NR, NB, val, ns = value_dp(nb, n, D, verbose=True)
    cpu = time.process_time() - t0
    getcontext().prec = 60
    dec = Decimal(val.numerator) / Decimal(val.denominator)
    print(f'N_red (x0=0) = {NR}\nN_blue (x0=0) = {NB}')
    print(f'value = {val.numerator}/{val.denominator}')
    print(f'value = {dec:.40e}')
    print(f'value * 2^14 = {dec * 2**14:.30f}')
    print(f'dp states at the last level: {ns}; cpu {cpu:.1f}s')
    if claimed_frac:
        print(f'claimed fraction equals ours: {Fraction(claimed_frac) == val}')
    if claimed_dec:
        # claimed as multiple of 2^-14
        cb = Fraction(Decimal(claimed_dec)) / 2 ** 14
        print(f'claimed bound {claimed_dec}*2^-14: value <= bound ? {val <= cb}  (bound - value = {Decimal(cb.numerator)/Decimal(cb.denominator) - dec:.3e})')
        import math
        k = len(claimed_dec.split('.')[1]); q = Fraction(10) ** k
        v14 = val * 2 ** 14
        up = Fraction(math.ceil(v14 * q), q); near = Fraction(round(v14 * q), q); trunc = Fraction(math.floor(v14 * q), q)
        cb14 = Fraction(Decimal(claimed_dec))
        how = [name for name, x in (('rounded UP', up), ('rounded to NEAREST', near), ('TRUNCATED', trunc)) if x == cb14]
        print(f'claimed decimal (x2^14) at {k} places is: {", ".join(how) if how else "NONE of up/nearest/truncated"}')


if __name__ == '__main__':
    main()
