#!/usr/bin/env python3
"""Lueker's automaton M_h, the upper-bound method for the binary Chvátal–Sankoff constant,
written from the paper alone and in the standard library.

Source: G. S. Lueker, Improved bounds on the average length of longest common subsequences,
J. ACM 56(3), Article 17 (2009); read in the author's extended version dated 2008-12-18
(Wayback capture of 2009-02-05, sha256 c662fc3b…), Section 3.2, Figure 8 (the journal's
Figure 7) and the table of upper bounds (Figure 9 there, Table II in the journal).

The bound (Theorem 2 of the extended version, Theorem 3.3 of the journal, after Dančík and
Paterson): if M covers Σ*, z ∈ (0, 1/2), λ ∈ (0, 1) and v > 0 satisfy A_z v ≤ λ v
component-wise, then γ₂ ≤ 2 log(2z) / log λ.

This is the REFERENCE implementation: clear, slow, exact where it can be. It is the
specification that mh.c is held to (state counts, transition keys, λ). It reads nothing of
anyone's code: not Lueker's Java, not the claimant's C.

A state is (x, y, dx, dy): x and y the last h characters of the top and bottom strings, dx
and dy the last h differences down the last column and along the last row of the lcs table
(Lueker §3.2). Each is a tuple of h bits. The start state is (0^h, 0^h, 1^h, 1^h) (Lemma 6).

An input is a minimal match pair after μ: for a match character c, either (c̄^a c / c) with
0 ≤ a ≤ h−1 or (c / c̄^b c) with 1 ≤ b ≤ h−1 — 2h−1 inputs per character, 4h−2 in all.
Its weight w_{μ,z} is z^{a+2} for a < h−1 and z^{h+1}/(1−z) for a = h−1, which collects every
longer pair that μ truncates onto it (eq. 36 of the paper).

Usage:
  python3 mh.py build H [--orbits]      build M_H, print the state count and a digest
                                        (--orbits: one representative per complement orbit,
                                        the count Lueker's table prints)
  python3 mh.py symcheck H              check δ commutes with complementation on every state
  python3 mh.py table H Z [ITER]        build, power-iterate at z = Z, certify λ exactly
                                        (Fractions) and print the bound; H ≤ 6 is practical
  python3 mh.py dump H FILE             write every state key and its 4h−2 successor keys
                                        (or -1) as text, for comparison with mh.c
"""
import sys, hashlib, math
from fractions import Fraction
from decimal import Decimal, getcontext, ROUND_CEILING, ROUND_FLOOR


def inputs(h):
    """The 4h−2 truncated minimal match pairs, as (top, bottom, a) with a = |l| = the
    number of padding characters (the pair's size is a + 2)."""
    out = []
    for c in (0, 1):
        pad = 1 - c
        for a in range(0, h):                       # (pad^a c / c), a = 0 .. h−1
            out.append(((pad,) * a + (c,), (c,), a))
        for b in range(1, h):                       # (c / pad^b c), b = 1 .. h−1
            out.append(((c,), (pad,) * b + (c,), b))
    assert len(out) == 4 * h - 2
    return out


def weights(h, z):
    """Exact weights, z a Fraction: z^{a+2} for a < h−1, z^{h+1}/(1−z) for a = h−1."""
    return [z ** (a + 2) if a < h - 1 else z ** (h + 1) / (1 - z) for (_, _, a) in inputs(h)]


def delta(h, q, p):
    """Figure 8 of the extended version (Figure 7 in the journal), line for line.
    Returns the successor state, or None for the rejecting state ∅."""
    x, y, dx, dy = q
    top, bot, _ = p
    a = x + top                                      # a_1 .. a_n, 1-indexed in the paper
    b = y + bot
    n, m = len(a), len(b)
    lcs = {}
    lcs[(h, h)] = h
    for i in range(h, 0, -1):                        # decodeVertDiffs((h,h), dx)
        lcs[(i - 1, h)] = lcs[(i, h)] - dx[i - 1]
    for j in range(h, 0, -1):                        # decodeHorzDiffs((h,h), dy)
        lcs[(h, j - 1)] = lcs[(h, j)] - dy[j - 1]
    for i in range(0, n + 1):                        # lines 7–13: fill the new entries
        for j in range(0, m + 1):
            if i > h or j > h:
                if i == 0:
                    lcs[(i, j)] = lcs[(i, j - 1)]
                elif j == 0:
                    lcs[(i, j)] = lcs[(i - 1, j)]
                elif a[i - 1] == b[j - 1]:
                    lcs[(i, j)] = lcs[(i - 1, j - 1)] + 1
                else:
                    lcs[(i, j)] = max(lcs[(i, j - 1)], lcs[(i - 1, j)])
    i, j = n, m                                      # lines 14–22: the canonicity test
    while i >= h and j >= h:
        if lcs[(i, j)] == lcs[(i - 1, j)]:
            i -= 1
        elif lcs[(i, j)] == lcs[(i, j - 1)]:
            j -= 1
        else:
            i -= 1
            j -= 1
        if i == h and j == h:
            ndx = tuple(lcs[(n - h + k + 1, m)] - lcs[(n - h + k, m)] for k in range(h))
            ndy = tuple(lcs[(n, m - h + k + 1)] - lcs[(n, m - h + k)] for k in range(h))
            for bit in ndx + ndy:
                if bit not in (0, 1):
                    raise ValueError(f"difference {bit} outside {{0,1}} at state {q} input {p}")
            return (a[n - h:], b[m - h:], ndx, ndy)
    return None


def pack(h, q):
    """The state as one integer of 4h bits: x, then y, then dx, then dy, each read with its
    first (oldest) entry most significant. mh.c packs the same way."""
    x, y, dx, dy = q
    k = 0
    for part in (x, y, dx, dy):
        for bit in part:
            k = (k << 1) | bit
    return k


def complement(q):
    """The state with both strings complemented; the differences stay (Lueker §3.2: the
    generating functions agree on q and its complement, so one orbit representative serves).
    Lueker's table and the claimant count orbits; the full state space is twice as large."""
    x, y, dx, dy = q
    return (tuple(1 - b for b in x), tuple(1 - b for b in y), dx, dy)


def canon(h, q):
    """The orbit representative: the member with the smaller packed key."""
    c = complement(q)
    return q if pack(h, q) <= pack(h, c) else c


def build(h, orbits=False):
    """Breadth-first from the start state. Returns (states, succ): states in discovery order,
    succ[i] the list of successor indices (−1 for ∅) in the order of inputs(h).
    With orbits=True every state is replaced by its orbit representative."""
    ins = inputs(h)
    q0 = ((0,) * h, (0,) * h, (1,) * h, (1,) * h)
    index = {q0: 0}
    states = [q0]
    succ = []
    head = 0
    while head < len(states):
        q = states[head]
        row = []
        for p in ins:
            r = delta(h, q, p)
            if r is None:
                row.append(-1)
            else:
                if orbits:
                    r = canon(h, r)
                k = index.get(r)
                if k is None:
                    k = len(states)
                    index[r] = k
                    states.append(r)
                row.append(k)
        succ.append(row)
        head += 1
    return states, succ


def digest(h, states, succ):
    """sha256 over the sorted (key, successor keys) rows — independent of discovery order."""
    rows = sorted((pack(h, q), tuple(pack(h, states[k]) if k >= 0 else -1 for k in row))
                  for q, row in zip(states, succ))
    hsh = hashlib.sha256()
    for key, row in rows:
        hsh.update(f"{key}:{','.join(map(str, row))}\n".encode())
    return hsh.hexdigest()


def power_iterate(succ, w, iters):
    """Plain power iteration on A_z in doubles, normalised each pass; w the weights as floats.
    Any positive vector is a valid witness; this only makes it a good one."""
    n = len(succ)
    v = [1.0] * n
    for _ in range(iters):
        nv = [0.0] * n
        for s in range(n):
            acc = 0.0
            for p, t in enumerate(succ[s]):
                if t >= 0:
                    acc += w[p] * v[t]
            nv[s] = acc
        mx = max(nv)
        v = [u / mx for u in nv]
        if min(v) <= 0.0:
            raise ValueError("a component of v fell to zero")
    return v


def certify_exact(succ, w_exact, v):
    """λ = max_s (A_z v)_s / v_s in exact rational arithmetic, v taken as exact doubles
    (the witness in (41)); also the minimum ratio, a lower bound on the spectral radius."""
    hi, lo = Fraction(0), None
    for s, row in enumerate(succ):
        acc = Fraction(0)
        vs = Fraction(v[s])
        for p, t in enumerate(row):
            if t >= 0:
                acc += w_exact[p] * Fraction(v[t])
        r = acc / vs
        if r > hi:
            hi = r
        if lo is None or r < lo:
            lo = r
    return hi, lo


def bound_from(z, lam, digits=40):
    """2 ln(2z) / ln λ as an outward decimal interval [lo, hi]; z, λ exact Fractions."""
    getcontext().prec = digits + 20
    P = getcontext().prec

    def D(fr):
        return Decimal(fr.numerator) / Decimal(fr.denominator)

    def ulp(d):
        return Decimal(1).scaleb(d.adjusted() - P + 1)

    a, b = D(2 * z).ln(), D(lam).ln()                 # both negative; ln correctly rounded
    a_lo, a_hi = a - 2 * ulp(a), a + 2 * ulp(a)
    b_lo, b_hi = b - 2 * ulp(b), b + 2 * ulp(b)
    getcontext().rounding = ROUND_CEILING
    hi = 2 * (-a_lo) / (-b_hi)
    getcontext().rounding = ROUND_FLOOR
    lo = 2 * (-a_hi) / (-b_lo)
    return lo, hi


def symcheck(h, states):
    """δ commutes with complementation: δ(q̄, p̄) = complement(δ(q, p)), p̄ the input with the
    match character complemented (same a, same weight). Checked on every state given."""
    ins = inputs(h)
    bar = {}
    for i, (top, bot, a) in enumerate(ins):
        tb = (tuple(1 - c for c in top), tuple(1 - c for c in bot), a)
        bar[i] = ins.index(tb)
    bad = 0
    for q in states:
        for i, p in enumerate(ins):
            r = delta(h, q, p)
            rc = delta(h, complement(q), ins[bar[i]])
            if (r is None) != (rc is None) or (r is not None and complement(r) != rc):
                bad += 1
    return bad


def main(argv):
    cmd = argv[1]
    h = int(argv[2])
    orbits = "--orbits" in argv
    argv = [a for a in argv if a != "--orbits"]
    if cmd == "build":
        states, succ = build(h, orbits)
        print(f"h={h} states={len(states)} orbits={orbits} inputs={4*h-2} digest={digest(h, states, succ)}")
    elif cmd == "symcheck":
        states, succ = build(h)
        print(f"h={h} states={len(states)} symmetry violations={symcheck(h, states)}")
    elif cmd == "dump":
        states, succ = build(h, orbits)
        with open(argv[3], "w") as f:
            for q, row in sorted(zip(states, succ), key=lambda t: pack(h, t[0])):
                f.write(f"{pack(h, q)} " + " ".join(str(pack(h, states[k]) if k >= 0 else -1) for k in row) + "\n")
        print(f"h={h} states={len(states)} written {argv[3]}")
    elif cmd == "table":
        z = Fraction(float(argv[3]))                   # the exact double nearest the decimal
        iters = int(argv[4]) if len(argv) > 4 else 200
        states, succ = build(h, orbits)
        w_exact = weights(h, z)
        v = power_iterate(succ, [float(w) for w in w_exact], iters)
        lam_hi, lam_lo = certify_exact(succ, w_exact, v)
        lo, hi = bound_from(z, lam_hi)
        print(f"h={h} states={len(states)} z={float(z)} iters={iters}")
        print(f"  lambda_cert (exact max ratio) = {float(lam_hi):.15f}   min ratio = {float(lam_lo):.15f}")
        print(f"  bound 2 ln(2z)/ln(lambda_cert) in [{lo:.12f}, {hi:.12f}]")
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main(sys.argv)
