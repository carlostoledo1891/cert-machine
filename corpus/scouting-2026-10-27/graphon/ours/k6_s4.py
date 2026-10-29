#!/usr/bin/env python3
"""Exact monochromatic-K6 density of the Z_2^nb weight-class step graphon (schema z2^10-weight-class-step-graphon-v1).
Standard library only; written from constants/89c.md and construction.json; no code shared with the claimant.

Object: 2^nb blocks of equal measure, indexed by x in Z_2^nb; red value W(x,y) = n[|x xor y|]/D, n[0] inside a block.
Definition (89c.md): value = t(K6, W) + t(K6, 1-W), t(K6, W) = (1/N^6) sum over ordered 6-tuples of prod_{a<b} W(x_a,x_b).

Exact reductions (each an identity, no symmetry *assumed*):
 (1) translation: (x_a) -> (x_a xor x_0) is a bijection preserving every x_a xor x_b, so the sum over all 6-tuples is
     N times the sum over 6-tuples with x_0 = 0.
 (2) rows: (x_1..x_4) is an nb x 4 binary matrix; its 10 pair distances (|x_a| = |x_a xor 0| and |x_a xor x_b|) count
     rows whose bits differ at the two positions, so they depend only on the row multiset c = (c_t)_{t in 0..15},
     and exactly nb!/prod c_t! matrices share a multiset.
 (3) x_5 inside a multiset: a 5th column assigns a bit to each of the nb rows; grouping rows by type, choosing
     k_t of the c_t rows of type t to carry bit 1 (binomial(c_t, k_t) ways) determines the five remaining distances:
     |x_5| = sum_t k_t,  |x_a xor x_5| = sum_t [bit_a(t)=0] k_t + [bit_a(t)=1] (c_t - k_t).
 (4) S_4 on (x_1..x_4): permuting the four columns permutes the 4-bit row types; it is a bijection on count vectors
     that preserves the whole summand (it relabels x_1..x_4, and the summand is symmetric in them).  So the sum over
     all count vectors equals the sum over orbit representatives (the lexicographically smallest image) of orbit size
     times the summand, orbit size = 24 / #{pi : pi(c) = c}.  The program checks that the orbit sizes sum to the
     number of count vectors, C(nb+15, 15).

value = (N_red + N_blue) / (N^5 D^15), N = 2^nb, with N_blue computed from D - n.

Checks (--selftest): nb = 3, 4 against a naive brute force over all (2^nb)^5 5-tuples; Franek's 0/1 parameters at
nb = 10 against the published 51162598917/2^50 (Combinatorica 2002); n = D/2 against 2^-14.
"""
import sys, time, itertools
from fractions import Fraction
from decimal import Decimal, getcontext
from math import factorial, comb
from multiprocessing import Pool

T4 = list(range(16))                      # row types of (x_1..x_4): bit a-1 of t is the bit of x_a
PAIRS10 = [(a, b) for a in range(5) for b in range(a + 1, 5)]   # pairs among vertices 0..4 (vertex 0 = x_0 = 0)


def bit(t, a):
    return 0 if a == 0 else (t >> (a - 1)) & 1


def perms_on_types():
    """the 24 permutations of the 4 bit positions, as maps on the 16 row types."""
    out = []
    for pi in itertools.permutations(range(4)):
        img = []
        for t in T4:
            s = 0
            for a in range(4):
                if (t >> a) & 1:
                    s |= 1 << pi[a]
            img.append(s)
        out.append(tuple(img))
    return out


PERMS = perms_on_types()


def count_vectors(nb):
    """all 16-tuples of nonnegative ints summing to nb (stars and bars)."""
    for cuts in itertools.combinations(range(nb + 15), 15):
        prev = -1; c = []
        for x in cuts:
            c.append(x - prev - 1); prev = x
        c.append(nb + 15 - prev - 1)
        yield tuple(c)


def canonical_reps(nb):
    """orbit representatives under S_4 with their orbit sizes."""
    reps = []
    total = 0
    for c in count_vectors(nb):
        best = c; stab = 0
        for img in PERMS:
            d = tuple(c[img[t]] for t in T4)    # d[t] = c[img[t]]: the permuted count vector
            if d < best:
                best = None; break
            if d == c:
                stab += 1
        if best is None:
            continue
        osz = 24 // stab
        reps.append((c, osz))
        total += osz
    assert total == comb(nb + 15, 15), (total, comb(nb + 15, 15))
    return reps


def summand(args):
    """sum over the orbit chunk of orbit_size * mult(c) * W10 * (inner sum over x_5), for red and blue."""
    chunk, n, D, nb = args
    nbl = [D - v for v in n]
    fnb = factorial(nb)
    NR = NB = 0
    # per type: which of x_1..x_4 have bit 1
    ones = [[a for a in range(1, 5) if bit(t, a)] for t in T4]
    for c, osz in chunk:
        # the ten distances among (0, x_1..x_4)
        d10 = []
        for (a, b) in PAIRS10:
            d10.append(sum(c[t] for t in T4 if bit(t, a) != bit(t, b)))
        wr = 1
        for d in d10:
            wr *= n[d]
            if not wr: break
        wb = 1
        for d in d10:
            wb *= nbl[d]
            if not wb: break
        if not wr and not wb:
            continue
        mult = fnb
        for ct in c:
            mult //= factorial(ct)
        base = [sum(c[t] for t in T4 if bit(t, a)) for a in range(1, 5)]   # |x_a|
        # inner sum over k: DFS over the 16 types with incremental (binomial product, K, d_1..d_4)
        # d_a = base_a + sum_t k_t * (+1 if bit_a(t) = 0 else -1)
        sr = sb = 0
        types = [t for t in T4 if c[t]]
        sign = [[1 if not bit(t, a) else -1 for a in range(1, 5)] for t in T4]
        # iterative enumeration via itertools.product; per leaf accumulate
        ranges = [range(c[t] + 1) for t in types]
        binom = [[comb(c[t], k) for k in range(c[t] + 1)] for t in types]
        sg = [sign[t] for t in types]
        for ks in itertools.product(*ranges):
            K = 0; d1 = base[0]; d2 = base[1]; d3 = base[2]; d4 = base[3]; bp = 1
            for idx, k in enumerate(ks):
                if k:
                    K += k; s = sg[idx]
                    d1 += k * s[0]; d2 += k * s[1]; d3 += k * s[2]; d4 += k * s[3]
                    bp *= binom[idx][k]
            if wr:
                pr = n[K] * n[d1] * n[d2] * n[d3] * n[d4]
                if pr: sr += bp * pr
            if wb:
                pb = nbl[K] * nbl[d1] * nbl[d2] * nbl[d3] * nbl[d4]
                if pb: sb += bp * pb
        NR += osz * mult * wr * sr
        NB += osz * mult * wb * sb
    return NR, NB


def value(nb, n, D, workers=1, verbose=False):
    t0 = time.time()
    reps = canonical_reps(nb)
    if verbose:
        print(f'    {len(reps)} S_4-orbit representatives of {comb(nb+15,15)} count vectors ({time.time()-t0:.0f}s)', file=sys.stderr, flush=True)
    if workers > 1:
        chunks = [reps[i::workers * 4] for i in range(workers * 4)]
        with Pool(workers) as pool:
            parts = pool.map(summand, [(ch, n, D, nb) for ch in chunks])
    else:
        parts = [summand((reps, n, D, nb))]
    NR = sum(p[0] for p in parts); NB = sum(p[1] for p in parts)
    if verbose:
        print(f'    summation done ({time.time()-t0:.0f}s wall)', file=sys.stderr, flush=True)
    return NR, NB, Fraction(NR + NB, (2 ** nb) ** 5 * D ** 15)


def value_brute(nb, n, D):
    N = 1 << nb
    pc = [bin(z).count('1') for z in range(N)]
    nbl = [D - v for v in n]
    NR = NB = 0
    for xs in itertools.product(range(N), repeat=5):
        pr = pb = 1
        for a in range(5):
            pr *= n[pc[xs[a]]]; pb *= nbl[pc[xs[a]]]
            for b in range(a + 1, 5):
                h = pc[xs[a] ^ xs[b]]
                pr *= n[h]; pb *= nbl[h]
        NR += pr; NB += pb
    return NR, NB, Fraction(NR + NB, N ** 5 * D ** 15)


def selftest(workers):
    import random
    rng = random.Random(89)
    for nb in (3, 4):
        for trial in range(2):
            D = 1 << 20
            n = [rng.choice([0, D, rng.randrange(D + 1)]) for _ in range(nb + 1)]
            b = value_brute(nb, n, D)
            v = value(nb, n, D)
            assert b[0] == v[0] and b[1] == v[1], (nb, n, b, v)
            print(f'  nb={nb} n={n}: brute == S4-orbit sum  ok', flush=True)
    D = 1 << 20
    n = [D if w in (0, 1, 3, 4, 7, 8, 10) else 0 for w in range(11)]
    t0 = time.time()
    NR, NB, v = value(10, n, D, workers, verbose=True)
    print(f'  Franek parameters: value = {v.numerator}/{v.denominator}  (wall {time.time()-t0:.0f}s)')
    print(f'  published 51162598917/2^50 = {Fraction(51162598917, 2**50)}: equal = {v == Fraction(51162598917, 2**50)}', flush=True)
    n = [D // 2] * 11
    NR, NB, v = value(10, n, D, workers)
    print(f'  n = D/2: value = {v} == 2^-14: {v == Fraction(1, 2**14)}')
    print('selftest passed', flush=True)


def main():
    workers = 1
    args = [a for a in sys.argv[1:]]
    if args and args[0].startswith('--workers='):
        workers = int(args[0].split('=')[1]); args = args[1:]
    if args[0] == '--selftest':
        selftest(workers); return
    import json
    d = json.load(open(args[0]))
    assert d['schema'] == 'z2^10-weight-class-step-graphon-v1'
    D = int(d['D']); n = [int(x) for x in d['n']]
    nb = len(n) - 1
    assert nb == 10 and all(0 <= x <= D for x in n)
    claimed_dec = args[1] if len(args) > 1 else None
    claimed_frac = args[2] if len(args) > 2 else None
    perturb = len(args) > 3 and args[3] == '--perturb'
    if perturb:
        n[1] += 1
        print(f'RED CONTROL: n[1] -> {n[1]} (+2^-20 on every block pair at Hamming distance 1)')
    print(f'nb={nb} blocks={2**nb} D={D} n={n}; block measures 2^-{nb} each, sum = {Fraction(2**nb, 2**nb)}')
    t0 = time.process_time(); t0w = time.time()
    NR, NB, val = value(nb, n, D, workers, verbose=True)
    cpu = time.process_time() - t0; wall = time.time() - t0w
    getcontext().prec = 60
    dec = Decimal(val.numerator) / Decimal(val.denominator)
    print(f'N_red (x0=0) = {NR}\nN_blue (x0=0) = {NB}')
    print(f'value = {val.numerator}/{val.denominator}')
    print(f'value = {dec:.40e}')
    print(f'value * 2^14 = {dec * 2**14:.30f}')
    print(f'cpu (main process) {cpu:.1f}s  wall {wall:.1f}s  workers {workers}')
    if claimed_frac:
        print(f'claimed fraction equals ours: {Fraction(claimed_frac) == val}')
    if claimed_dec:
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
