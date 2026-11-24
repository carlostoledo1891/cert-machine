#!/usr/bin/env python3
"""COMPUTED | Exact checks of the Appendix D pair equations. Standard library only."""

from collections import Counter
from fractions import Fraction
from itertools import combinations
from time import process_time


def span_mask(vectors):
    """Encode a binary vector space by setting one bit per element, including zero."""
    space = {0}
    for v in vectors:
        space |= {x ^ v for x in space}
    return sum(1 << x for x in space)


def matrix_data(mu):
    # Bit mu*i+j is the (i,j) entry. XOR adds matrices.
    rank, row, col = [], [], []
    mask = (1 << mu) - 1
    for w in range(1 << (mu * mu)):
        rows = [(w >> (mu * i)) & mask for i in range(mu)]
        cols = [sum(((r >> j) & 1) << i for i, r in enumerate(rows))
                for j in range(mu)]
        row.append(span_mask(rows))
        col.append(span_mask(cols))
        cardinality = bin(row[-1]).count("1")
        rank.append(cardinality.bit_length() - 1)
    pairs = [(w, v) for w, v in combinations(range(1, len(rank)), 2)
             if (row[w] & row[v]) == 1 and (col[w] & col[v]) == 1]
    return rank, pairs


def insert_row(pivots, row):
    """Add a sparse row to an exact rational echelon basis with unit pivots."""
    while row:
        j = max(row)
        lead = row[j]
        if j not in pivots:
            pivots[j] = {i: Fraction(x, lead) for i, x in row.items()}
            return
        del row[j]
        for i, x in pivots[j].items():
            if i != j:
                value = row.get(i, 0) - lead * x
                if value:
                    row[i] = value
                else:
                    row.pop(i, None)


def character_block(positive, pairs):
    # positive[w] means chi(w) = +1. Endpoint exchange kills the other columns.
    keep = positive.copy()
    keep[0] = False
    for w, v in pairs:
        if not positive[v]:
            keep[w] = False
        if not positive[w]:
            keep[v] = False

    # D.2 divided by 2: [chi(w)=+1] c[w+v] - c[w] - c[v] = 0.
    pivots = {}
    for w, v in pairs:
        s = w ^ v
        row = {}
        if positive[w] and keep[s]:
            row[s] = 1
        if keep[w]:
            row[w] = -1
        if keep[v]:
            row[v] = -1
        if row:
            insert_row(pivots, row)
    return keep, pivots


def direct_pair_rows(n, pairs):
    """Original rows on unordered endpoints, without a change of basis."""
    def edge(x, y):
        return (min(x, y), max(x, y))

    for a in range(n):
        for w, v in pairs:
            b, c, e = a ^ w, a ^ v, a ^ w ^ v
            yield {edge(c, e): 1, edge(a, b): -1}
            yield {edge(b, e): 1, edge(a, c): -1}
            yield {edge(b, c): 1, edge(a, e): 1,
                   edge(a, b): -2, edge(a, c): -2}


def check_function(n, pairs, d):
    """Evaluate all original equations at all basepoints, using exact integers."""
    for a in range(n):
        assert d(a, a) == 0
        for b in range(a):
            assert d(a, b) == d(b, a)
        for w, v in pairs:
            b, c, e = a ^ w, a ^ v, a ^ w ^ v
            ab, ac = d(a, b), d(a, c)
            assert d(c, e) == ab
            assert d(b, e) == ac
            assert d(b, c) == 2 * ab + 2 * ac - d(a, e)


def solve(mu):
    rank, pairs = matrix_data(mu)
    n = len(rank)
    unknowns = n * (n - 1) // 2
    raw_count = 3 * n * len(pairs)
    pair_counts = Counter(tuple(sorted((rank[w], rank[v]))) for w, v in pairs)
    print(f"\nmu={mu}  matrices={n}  unordered off-diagonal variables={unknowns}")
    print(f"Transversal direction pairs (unordered), by ranks: {dict(sorted(pair_counts.items()))}")
    print(f"Pairs={len(pairs)}  D.1 rows={2*n*len(pairs)}  D.2 rows={n*len(pairs)}"
          f"  raw rows={raw_count}")

    parity = [bin(i).count("1") % 2 for i in range(n)]
    summary = Counter()
    axes = []
    for k in range(n):
        positive = [parity[k & w] == 0 for w in range(n)]
        keep, pivots = character_block(positive, pairs)
        dim = sum(keep) - len(pivots)
        summary[rank[k], sum(positive) - 1, sum(keep), len(pivots), dim] += 1
        if mu == 2 and k and dim:
            # An absent column gives a kernel vector supported on that displacement.
            constrained = {w for r in pivots.values() for w in r}
            axes.extend((s, k) for s in range(1, n) if keep[s] and s not in constrained)

    print("Character blocks (each character reduced individually):")
    print("rank(k)  characters  after_symmetry  after_D.1  D.2_rank  nullity")
    for (r, sym, kept, piv, dim), count in sorted(summary.items()):
        print(f"{r:7d}  {count:10d}  {sym:14d}  {kept:9d}  {piv:8d}  {dim:7d}")
    assert sum(summary.values()) == n
    assert sum(key[1] * count for key, count in summary.items()) == unknowns
    nullity = sum(key[-1] * count for key, count in summary.items())
    print(f"Full rational rank={unknowns-nullity}  nullity={nullity}")
    check_function(n, pairs, lambda x, y: rank[x ^ y])
    print(f"Rank function: PASS on symmetry, zero diagonal, and all {raw_count} raw rows")

    if mu == 2:
        pivots = {}
        row_count = 0
        for row in direct_pair_rows(n, pairs):
            insert_row(pivots, row)
            row_count += 1
        assert row_count == raw_count and unknowns - len(pivots) == nullity
        print(f"Direct unordered-endpoint elimination: rows={row_count}"
              f"  rank={len(pivots)}  nullity={unknowns-len(pivots)}")
        assert sorted(s for s, k in axes) == [s for s in range(n) if rank[s] == mu]
        assert 1 + len(axes) == nullity
        print("Additional basis functions: displacement S, character K (hex, row-major LSB first)")
        for s, k in sorted(axes):
            # If S has rows (a,b),(c,d), the entrywise coefficients of
            # trace(S^{-1} x) have rows (d,c),(b,a), reversing the four bits.
            assert k == int(f"{s:04b}"[::-1], 2)

            def basis(x, y):
                if x ^ y == s:
                    return 1 - 2 * parity[k & x]
                return 0
            check_function(n, pairs, basis)
            print(f"  S={s:x}  K={k:x}  PASS on symmetry, zero diagonal, and all {raw_count} raw rows")


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Run without -O to enable the exact checks.")
    start = process_time()
    print("COMPUTED | Exact rational character-block elimination and direct integer checks")
    for size in (2, 3):
        solve(size)
    print(f"\nCPU seconds: {process_time() - start:.3f}")
