"""leech.py — the 196,560 minimal vectors of the Leech lattice, built here from a Golay basis.

Written from Conway & Sloane (SPLAG ch. 4 §11), not from any claimant's code. In coordinates scaled
by sqrt8 (the "Cohn units" every 2026 claimant uses), the Leech lattice is the set of integer
vectors x with: all x_i of one parity m; sum x_i = 4m (mod 8); and for each residue r mod 4 the
positions with x_i = r (mod 4) form a codeword of the extended binary Golay code C. Its minimal
vectors have norm 32 and three shapes:

    (+-4, +-4, 0^22)                   any two positions, any signs             24*23/2 * 4  =   1 104
    (+-2^8, 0^16)                      an octad, an EVEN number of minus signs     759 * 128  =  97 152
    (-+3, +-1^23)                      x_j = -1 on a codeword c, +1 off it; at one position i
                                       x_i = 3 if i in c else -3                 4 096 * 24  =  98 304

The Golay code itself is the F2-span of the twelve basis words read from a pinned data file. Both
are checked before use: the code must have the weight distribution 1, 759, 2576, 759, 1 and the
shell must have, against every one of a sample of its vectors, the inner-product distribution
32:1, 16:4600, 8:47104, 0:93150, -8:47104, -16:4600, -32:1 (the full pairwise decision is the
K(24) calibration in the run, not here).
"""
import numpy as np

SIGNATURE = {32: 1, 16: 4600, 8: 47104, 0: 93150, -8: 47104, -16: 4600, -32: 1}


def golay_from_rows(rows):
    """rows: twelve strings of 24 characters '0'/'1' -> (4096, 24) uint8 codewords"""
    if len(rows) != 12 or any(len(r) != 24 or set(r) - set('01') for r in rows):
        raise ValueError('a Golay basis is twelve words of 24 bits')
    B = np.array([[int(ch) for ch in r] for r in rows], dtype=np.uint8)
    words = np.zeros((4096, 24), dtype=np.uint8)
    for m in range(4096):
        w = np.zeros(24, dtype=np.uint8)
        for k in range(12):
            if m >> k & 1:
                w ^= B[k]
        words[m] = w
    wt = words.sum(1)
    dist = {int(k): int((wt == k).sum()) for k in np.unique(wt)}
    if dist != {0: 1, 8: 759, 12: 2576, 16: 759, 24: 1}:
        raise ValueError('not the extended Golay code: weight distribution %s' % dist)
    if len({w.tobytes() for w in words}) != 4096:
        raise ValueError('basis is not independent')
    return words


def shell(words):
    """the 196560 minimal vectors, int8, norm 32"""
    out = []
    for i in range(24):
        for j in range(i + 1, 24):
            for si in (4, -4):
                for sj in (4, -4):
                    v = np.zeros(24, dtype=np.int8); v[i] = si; v[j] = sj
                    out.append(v)
    A = [np.array(out, dtype=np.int8)]
    octads = words[words.sum(1) == 8]
    signs = []
    for m in range(256):
        if bin(m).count('1') % 2 == 0:
            signs.append([(-1 if m >> t & 1 else 1) for t in range(8)])
    signs = np.array(signs, dtype=np.int8)          # 128 x 8
    for o in octads:
        pos = np.nonzero(o)[0]
        V = np.zeros((128, 24), dtype=np.int8)
        V[:, pos] = 2 * signs
        A.append(V)
    W = words.astype(np.int8)
    for i in range(24):
        V = np.where(W == 1, -1, 1).astype(np.int8)
        V[:, i] = np.where(W[:, i] == 1, 3, -3)
        A.append(V)
    X = np.concatenate(A)
    if X.shape != (196560, 24):
        raise AssertionError('shell has %s vectors' % (X.shape,))
    if not np.all((X.astype(np.int32) ** 2).sum(1) == 32):
        raise AssertionError('a shell vector is not of norm 32')
    if len({r.tobytes() for r in X}) != 196560:
        raise AssertionError('shell vectors are not distinct')
    return X


def signature_sample(X, rows):
    """inner-product distribution of the given rows against the whole shell"""
    G = X[rows].astype(np.float32) @ X.astype(np.float32).T   # |entries| <= 32, exact
    out = []
    for g in G.astype(np.int64):
        vals, cnt = np.unique(g, return_counts=True)
        out.append({int(v): int(c) for v, c in zip(vals, cnt)})
    return out


def is_leech(x, words_set):
    """Conway-Sloane membership for one integer vector (Cohn units)"""
    x = [int(t) for t in x]
    par = x[0] & 1
    if any((t & 1) != par for t in x):
        return False
    if sum(x) % 8 != (4 * par) % 8:
        return False
    for r in range(4):
        w = bytes(1 if (t % 4) == r else 0 for t in x)
        if any(w) and w not in words_set and bytes(1 - b for b in w) not in words_set:
            # positions at residue r must form a codeword; the complement test is redundant (C is
            # closed under complement) and kept as a guard
            return False
    return True


def index(X):
    """row bytes -> index, for exact membership lookups"""
    return {r.tobytes(): k for k, r in enumerate(X)}
