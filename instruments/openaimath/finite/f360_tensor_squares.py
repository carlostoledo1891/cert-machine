"""F-360 — "Universal Tensor Squares for Symmetric Groups" (openai/math family 205).

THE CLAIM. Theorem thm:main (build/sections/introduction.tex:14-22): for every positive integer n not in {2, 4, 9}
there is a partition lambda of n with g(lambda, lambda, nu) > 0 for every nu of n. Its finite part is
Proposition prop:finite-check (build/sections/finite.tex:12-17): "For every integer 1 <= n <= 64 other than 2,4,9,
there is a self-conjugate partition lambda of n such that g(lambda,lambda,nu) > 0 for every nu of n." The proof
(finite.tex:199-226) is a C++ run whose record "contains exit statuses rather than the selected partitions"
(finite.tex:223-225; RESULTS.json "witness_format": "no selected partition or full coefficient vector is printed").
The Corollary cor:unipotent-squares (introduction.tex:36-44) cites "its finite-range witnesses" — which the release
does not contain. THE PUBLISHED FINITE OBJECT IS THEREFORE NOT CHECKABLE AS PUBLISHED (NEEDS DATA): 61 exit statuses.

WHAT IS DECIDED HERE — a finite component, the existence statement of Proposition prop:finite-check itself, by
producing the witnesses the release omits and certifying each one:
  (1) WITNESSES. For each eligible n <= n_max, a self-conjugate lambda_n is recorded in WITNESSES below (found by
      search() in this file: self-conjugate partitions of n ordered by 2-weight, then by hook product; the first
      that passes is kept) and decide() re-derives, for that lambda_n, the whole vector g(lambda_n, lambda_n, nu)
      over all nu of n, as residues modulo the prime p1 = 1073741789 (a second prime p2 = 1073741783 for any
      coordinate that vanishes mod p1). Both primes are proved prime here by trial division. Kronecker
      coefficients are nonnegative integers, so a nonzero residue proves g >= 1; a coordinate zero modulo both
      primes is a failure of that witness (no lower bound is claimed from it).
      The vector is computed by the character inner product g(l,l,nu) = sum_rho chi^l(rho)^2 chi^nu(rho) / z_rho,
      organized as a Horner scheme over the parts of rho (largest first, with their multiplicities): with
      T(s,k,v) = sum_{rho |- s, rho_1 <= k} chi_v(rho)^2 p_rho / z_rho in the Schur basis,
          T(s,k,v) = sum_m R_k^m T(s - mk, k-1, (R_k^T)^m v) / (k^m m!),   T(s,1,v) = (f.v)^2 f / s!,
      where R_k adds a border strip of size k with sign (-1)^(leg length) (Murnaghan-Nakayama) and f is the
      vector of degrees. Strips are moves of a bead in a beta-set (bit masks); written here from the LaTeX only.
  (2) AN INDEPENDENT EXACT ROUTE for n <= exact_max (default 16): the full character table of S_n by
      Murnaghan-Nakayama on Young diagrams (rim hooks found from hook lengths on the diagram — no beta sets),
      checked by column orthogonality (n <= 12), and exact integer Kronecker coefficients
      g = (1/n!) sum_rho |C_rho| chi chi chi (divisibility by n! checked). Every self-conjugate lambda of every
      n <= exact_max: the Horner residue vector equals the exact vector reduced mod p1.
      For n <= 12 the complete list of covering lambda (over ALL partitions, not only self-conjugate ones) is
      compared with the authors' recorded "covering_shapes" (character-independent-1-12.log); for n = 2, 4, 9
      no partition covers (the exclusions are genuine there).
  (3) PRINTED NUMBERS: |P_64| = 1741630 and sum_{s<=64} |P_s| = 12308139 (finite.tex:186-187); the two moduli
      1000000007 and 1000000009 are prime (finite.tex:36-37); the record has one status-0 line for exactly the
      61 eligible degrees (character-61-degrees.log, RESULTS.json eligible_degrees); g(l,l,(1^n)) = 1 and
      g(l,l,(n)) = 1 on every certified vector (finite.tex:163-166), and every certified vector satisfies the
      degree identity sum_nu g(l,l,nu) f^nu = (f^l)^2 modulo p1 (a check of the whole vector, not only of its zeros).

WHAT IS NOT DECIDED HERE.
  - Every n > 64: the large-degree construction (sections candidate, band, balance, capacity: the candidate L of
    Lemma lem:candidate, the band and balance support tests, the cyclic Saxl input of [SaxlCyclic] and
    Proposition prop:capacity-exhaustion). The finite capacity enumerations of Appendix app:capacity-code are not
    re-run here; they belong to that argument.
  - Corollary cor:unipotent-squares (Letellier's theorem) — but its "finite-range witnesses" are supplied here
    for n <= n_max.
  - With n_max < 64, the degrees n_max < n <= 64 (cost below); there the release's evidence is exit statuses only.

READ AFTER THIS DECIDER RAN (verification/code/*, never executed). smallcode_submitted.cpp returns status 0 at
the first self-conjugate candidate (ordered by a floating-point hook score) whose vector is nonzero modulo
1000000007 or 1000000009 at every coordinate; it prints nothing, and it returns 0 without any computation for
n = 2, 4, 9. smallcode_verify.py "runs" records only those exit statuses. Its "compare" mode is an independent
exact character computation (skew diagrams) checked against the C++ dump modulo both primes, but only for
n <= 12. So for 13 <= n <= 64 the release's evidence is the exit status of the authors' own program, with no
witness and no second computation.

COST (this machine, Python 3.9, one core, shared): the default run (n <= 45) takes about 1 minute. All 61 degrees
(--n-max 64; run: CERTIFIED, 3506 s wall, 50 min CPU; n = 64 alone 720 s) need a peak of about 3.5 GB:
building the 12.3 million partitions of s <= 64 and the degree vectors costs about 190 s; per degree the cost is dominated by the strip maps R_k : P_t -> P_{t+k}
first touched (cached across degrees); search times were n = 50: 41 s, 55: 27 s, 58: 267 s, 60: 410 s,
62: 346 s, 64: 534 s (2919 s for all 61). The authors' C++ took 116 s at n = 64 and about 530 s in all.
"""
import json
import os
import re
import sys
import time
from array import array
from math import factorial

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

sys.setrecursionlimit(20000)

DIR = 'preprints/Universal-Tensor-Squares-for-Symmetric-Groups-September-24-2026/'
FINITE = DIR + 'build/sections/finite.tex'
INTRO = DIR + 'build/sections/introduction.tex'
LOG61 = DIR + 'verification/computation/character-61-degrees.log'
LOGIND = DIR + 'verification/computation/character-independent-1-12.log'
RESULTS = DIR + 'verification/computation/RESULTS.json'
README = DIR + 'verification/computation/README.md'

P1 = 1073741789
P2 = 1073741783
EXCLUDED = (2, 4, 9)
DEFAULT_NMAX = 45

# witnesses found by search() in this file (first passing self-conjugate partition in its order: the first
# candidate passed at every one of the 61 degrees); each is re-certified by decide() for n <= n_max. From a run of
# `python3 f360_tensor_squares.py --search 64` (2919 s of search after a 190 s set-up, peak RSS about 3.5 GB).
# At the triangular degrees 1, 3, 6, 10, 15, 21, 28, 36, 45, 55 the witness is the staircase.
WITNESSES = {
    1: (1,), 3: (2, 1), 5: (3, 1, 1), 6: (3, 2, 1), 7: (4, 1, 1, 1), 8: (4, 2, 1, 1), 10: (4, 3, 2, 1),
    11: (4, 3, 3, 1), 12: (5, 3, 2, 1, 1), 13: (5, 3, 3, 1, 1), 14: (6, 3, 2, 1, 1, 1), 15: (5, 4, 3, 2, 1),
    16: (6, 4, 2, 2, 1, 1), 17: (6, 4, 3, 2, 1, 1), 18: (6, 5, 2, 2, 2, 1), 19: (7, 4, 3, 2, 1, 1, 1),
    20: (7, 5, 2, 2, 2, 1, 1), 21: (6, 5, 4, 3, 2, 1), 22: (6, 5, 4, 4, 2, 1), 23: (7, 6, 3, 2, 2, 2, 1),
    24: (7, 5, 4, 4, 2, 1, 1), 25: (8, 5, 4, 3, 2, 1, 1, 1), 26: (8, 5, 4, 4, 2, 1, 1, 1),
    27: (7, 6, 5, 3, 3, 2, 1), 28: (7, 6, 5, 4, 3, 2, 1), 29: (8, 7, 4, 3, 2, 2, 2, 1),
    30: (8, 7, 4, 4, 2, 2, 2, 1), 31: (9, 6, 5, 3, 3, 2, 1, 1, 1), 32: (9, 6, 5, 4, 3, 2, 1, 1, 1),
    33: (10, 7, 4, 3, 2, 2, 2, 1, 1, 1), 34: (8, 7, 6, 4, 3, 3, 2, 1), 35: (9, 8, 5, 3, 3, 2, 2, 2, 1),
    36: (8, 7, 6, 5, 4, 3, 2, 1), 37: (10, 7, 6, 3, 3, 3, 2, 1, 1, 1), 38: (9, 7, 6, 5, 4, 3, 2, 1, 1),
    39: (11, 8, 5, 3, 3, 2, 2, 2, 1, 1, 1), 40: (10, 7, 6, 5, 4, 3, 2, 1, 1, 1),
    41: (10, 7, 6, 5, 5, 3, 2, 1, 1, 1), 42: (10, 8, 6, 5, 4, 3, 2, 2, 1, 1), 43: (9, 8, 7, 5, 5, 3, 3, 2, 1),
    44: (10, 9, 6, 5, 4, 3, 2, 2, 2, 1), 45: (9, 8, 7, 6, 5, 4, 3, 2, 1), 46: (11, 9, 6, 5, 4, 3, 2, 2, 2, 1, 1),
    47: (10, 8, 7, 6, 5, 4, 3, 2, 1, 1), 48: (12, 9, 6, 5, 4, 3, 2, 2, 2, 1, 1, 1),
    49: (11, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1), 50: (12, 9, 7, 5, 4, 3, 3, 2, 2, 1, 1, 1),
    51: (11, 9, 7, 6, 5, 4, 3, 2, 2, 1, 1), 52: (12, 9, 8, 5, 4, 3, 3, 3, 2, 1, 1, 1),
    53: (11, 10, 7, 6, 5, 4, 3, 2, 2, 2, 1), 54: (12, 9, 8, 6, 4, 4, 3, 3, 2, 1, 1, 1),
    55: (10, 9, 8, 7, 6, 5, 4, 3, 2, 1), 56: (12, 9, 8, 7, 4, 4, 4, 3, 2, 1, 1, 1),
    57: (13, 10, 7, 6, 5, 4, 3, 2, 2, 2, 1, 1, 1), 58: (12, 10, 8, 7, 4, 4, 4, 3, 2, 2, 1, 1),
    59: (12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1), 60: (12, 9, 8, 7, 6, 6, 4, 3, 2, 1, 1, 1),
    61: (13, 10, 9, 6, 5, 4, 3, 3, 3, 2, 1, 1, 1), 62: (12, 10, 8, 7, 6, 6, 4, 3, 2, 2, 1, 1),
    63: (12, 11, 8, 7, 6, 5, 4, 3, 2, 2, 2, 1), 64: (12, 11, 8, 7, 6, 6, 4, 3, 2, 2, 2, 1),
}


# ---------------------------------------------------------------- partitions

def partitions(s, maxpart=None):
    """partitions of s with parts <= maxpart, in reverse lexicographic order, as tuples"""
    if maxpart is None or maxpart > s:
        maxpart = s
    if s == 0:
        return [()]
    out = []
    stack = [(s, maxpart, ())]
    while stack:
        rem, mp, acc = stack.pop()
        if rem == 0:
            out.append(acc)
            continue
        for f in range(1, min(rem, mp) + 1):
            stack.append((rem - f, f, acc + (f,)))
    out.sort(reverse=True)
    return out


def conjugate(p):
    return tuple(sum(1 for x in p if x > j) for j in range(p[0])) if p else ()


def hook_product(p):
    c = conjugate(p)
    h = 1
    for i, r in enumerate(p):
        for j in range(r):
            h *= (r - j - 1) + (c[j] - i - 1) + 1
    return h


def two_weight(p):
    """number of dominoes removable from p (its 2-weight), from the abacus of a beta-set"""
    N = len(p) + 2
    beta = [(p[j] if j < len(p) else 0) + (N - 1 - j) for j in range(N)]
    w = 0
    for r in (0, 1):
        pos = sorted(x // 2 for x in beta if x % 2 == r)
        w += sum(q - i for i, q in enumerate(pos))
    return w


def partition_counts(n):
    """p(s) for s <= n by adding parts of sizes 1..n (the recurrence finite.tex:183-185 names)"""
    c = [1] + [0] * n
    for part in range(1, n + 1):
        for s in range(part, n + 1):
            c[s] += c[s - part]
    return c


def is_prime_trial(p):
    if p < 2:
        return False
    d = 2
    while d * d <= p:
        if p % d == 0:
            return False
        d += 1
    return True


# ---------------------------------------------------------------- route (2): exact character table on diagrams

def rim_hooks(nu, k):
    """[(nu minus the rim hook, leg length)] for every rim hook of size k of nu, found from the hook lengths"""
    out = []
    if not nu:
        return out
    c = conjugate(nu)
    for i, r in enumerate(nu):
        for j in range(r):
            arm = r - j - 1
            leg = c[j] - i - 1
            if arm + leg + 1 == k:
                new = list(nu)
                for t in range(i, i + leg):
                    new[t] = nu[t + 1] - 1
                new[i + leg] = j
                while new and new[-1] == 0:
                    new.pop()
                out.append((tuple(new), leg))
    return out


class CharTable:
    def __init__(self):
        self.memo = {}

    def chi(self, nu, rho):
        if not rho:
            return 1 if not nu else 0
        key = (nu, rho)
        v = self.memo.get(key)
        if v is None:
            v = 0
            for sub, leg in rim_hooks(nu, rho[0]):
                v += (-1) ** leg * self.chi(sub, rho[1:])
            self.memo[key] = v
        return v


def z_rho(rho):
    z = 1
    for part in set(rho):
        m = rho.count(part)
        z *= part ** m * factorial(m)
    return z


def exact_squares(n, ct):
    """{lambda: {nu: g(lambda, lambda, nu)}} for all lambda of n, exact; with orthogonality and divisibility checks"""
    parts = partitions(n)
    X = {nu: [ct.chi(nu, rho) for rho in parts] for nu in parts}
    cls = [factorial(n) // z_rho(rho) for rho in parts]
    ok_orth = True
    if n <= 12:
        for a in range(len(parts)):
            for b in range(a, len(parts)):
                s = sum(X[nu][a] * X[nu][b] for nu in parts)
                if s != (z_rho(parts[a]) if a == b else 0):
                    ok_orth = False
    nf = factorial(n)
    out = {}
    ok_div = True
    for lam in parts:
        w = [cls[r] * X[lam][r] ** 2 for r in range(len(parts))]
        g = {}
        for nu in parts:
            t = sum(w[r] * X[nu][r] for r in range(len(parts)))
            if t % nf:
                ok_div = False
            g[nu] = t // nf
        out[lam] = g
    return out, ok_orth, ok_div


# ---------------------------------------------------------------- route (1): Horner scheme on beta-set bit masks

class Space:
    """all partitions of s <= n as beta-set bit masks with n beads (positions 0..2n-1); strip maps cached"""

    def __init__(self, n):
        self.n = n
        self.masks = []
        self.index = []
        for s in range(n + 1):
            ms = [self.mask(p) for p in partitions(s)]
            self.masks.append(ms)
            self.index.append({m: i for i, m in enumerate(ms)})
        self.up = {}
        self.map_entries = 0
        self.dims = {}

    def mask(self, p):
        n = self.n
        m = 0
        for j in range(n):
            m |= 1 << (n + (p[j] if j < len(p) else 0) - (j + 1))
        return m

    def up_map(self, t, k):
        """R_k : P_t -> P_{t+k}: moving a bead from x to x+k (x+k empty) adds a k-strip; its sign is (-1)^(beads
        strictly between), i.e. (-1)^(leg length). Stored as (src, dst) pairs split by sign."""
        r = self.up.get((t, k))
        if r is not None:
            return r
        idx = self.index[t + k]
        ps, pd, ns, nd = array('i'), array('i'), array('i'), array('i')
        top = (1 << (2 * self.n)) - 1
        for i, b in enumerate(self.masks[t]):
            cand = b & ~(b >> k) & (top >> k)
            while cand:
                low = cand & -cand
                x = low.bit_length() - 1
                cand ^= low
                j = idx[b ^ low ^ (1 << (x + k))]
                if bin(b & ((1 << (x + k)) - (1 << (x + 1)))).count('1') & 1:
                    ns.append(i)
                    nd.append(j)
                else:
                    ps.append(i)
                    pd.append(j)
        r = (ps, pd, ns, nd)
        self.up[(t, k)] = r
        self.map_entries += len(ps) + len(ns)
        return r

    def apply_up(self, x, t, k):
        ps, pd, ns, nd = self.up_map(t, k)
        y = [0] * len(self.masks[t + k])
        for a, b in zip(ps, pd):
            y[b] += x[a]
        for a, b in zip(ns, nd):
            y[b] -= x[a]
        return y

    def down(self, v, k, P):
        """R_k^T on a sparse {mask: residue}: remove a k-strip (bead from x to x-k, x-k empty)"""
        out = {}
        low_k = ~((1 << k) - 1)
        for b, c in v.items():
            cand = b & ~(b << k) & low_k
            while cand:
                low = cand & -cand
                x = low.bit_length() - 1
                cand ^= low
                nb = b ^ low ^ (1 << (x - k))
                if bin(b & ((1 << x) - (1 << (x - k + 1)))).count('1') & 1:
                    out[nb] = out.get(nb, 0) - c
                else:
                    out[nb] = out.get(nb, 0) + c
        return {m: c % P for m, c in out.items() if c % P}

    def dims_mod(self, P, n):
        d = self.dims.get(P)
        if d is None or len(d) <= n:
            d = [[1]]
            for s in range(1, self.n + 1):
                d.append([v % P for v in self.apply_up(d[-1], s - 1, 1)])
            self.dims[P] = d
        return d


def kron_square_residues(sp, n, lam, P):
    """the vector (g(lam, lam, nu) mod P) over nu in sp.masks[n] order"""
    inv = [0] + [pow(i, P - 2, P) for i in range(1, 2 * n + 2)]
    dims = sp.dims_mod(P, n)
    invfact = [1]
    for s in range(1, n + 1):
        invfact.append(invfact[-1] * inv[s] % P)
    empty = sp.masks[0][0]

    def T(s, k, v):
        if s == 0:
            c = v.get(empty, 0)
            return [c * c % P]
        if k > s:
            k = s
        nv = None
        while k > 1:
            nv = sp.down(v, k, P)
            if nv:
                break
            k -= 1
        if k == 1:
            d = dims[s]
            idx = sp.index[s]
            dv = sum(c * d[idx[b]] for b, c in v.items()) % P
            f = dv * dv % P * invfact[s] % P
            return [f * x % P for x in d]
        vs = [v, nv]
        while len(vs) * k <= s:
            nxt = sp.down(vs[-1], k, P)
            if not nxt:
                break
            vs.append(nxt)
        M = len(vs) - 1
        Y = T(s - M * k, k - 1, vs[M])
        for m in range(M - 1, -1, -1):
            X = T(s - m * k, k - 1, vs[m])
            RY = sp.apply_up(Y, s - (m + 1) * k, k)
            c = inv[k] * inv[m + 1] % P
            Y = [(a + c * r) % P for a, r in zip(X, RY)]
        return Y

    return T(n, n, {sp.mask(lam): 1})


def certify_witness(sp, n, lam):
    """(ok, detail): every coordinate nonzero mod P1, or mod P2 where P1 gives zero"""
    if sum(lam) != n or conjugate(lam) != lam:
        return False, 'not a self-conjugate partition of %d' % n
    g1 = kron_square_residues(sp, n, lam, P1)
    zeros = [i for i, x in enumerate(g1) if x == 0]
    rescued = 0
    if zeros:
        g2 = kron_square_residues(sp, n, lam, P2)
        still = [i for i in zeros if g2[i] == 0]
        rescued = len(zeros) - len(still)
        if still:
            return False, '%d target(s) zero mod both primes (first index %d)' % (len(still), still[0])
    one = sp.index[n][sp.mask((1,) * n)]
    triv = sp.index[n][sp.mask((n,))]
    if g1[one] != 1 or g1[triv] != 1:
        return False, 'g(l,l,(1^n)) or g(l,l,(n)) is not 1'
    # the whole vector against the degree of S^l (x) S^l: sum_nu g(l,l,nu) f^nu = (f^l)^2  (mod p1)
    f = sp.dims_mod(P1, n)[n]
    fl = f[sp.index[n][sp.mask(lam)]]
    if sum(g * d for g, d in zip(g1, f)) % P1 != fl * fl % P1:
        return False, 'sum_nu g f^nu differs from (f^l)^2 mod p1'
    return True, '%d targets, all nonzero mod p1%s' % (len(g1), '' if not rescued else ' (%d rescued mod p2)' % rescued)


def search(sp, n, limit=None):
    """the first self-conjugate partition of n, in (2-weight, hook product) order, that certifies"""
    cands = [p for p in partitions(n) if conjugate(p) == p]
    cands.sort(key=lambda p: (two_weight(p), hook_product(p), p))
    tried = []
    for lam in cands[:limit]:
        ok, _ = certify_witness(sp, n, lam)
        tried.append(lam)
        if ok:
            return lam, tried
    return None, tried


# ---------------------------------------------------------------- the decision

def read_release(src):
    fin = src.text(FINITE)
    intro = src.text(INTRO)
    log61 = src.text(LOG61)
    logind = src.text(LOGIND)
    res = json.loads(src.text(RESULTS))
    return fin, intro, log61, logind, res


def decide(src=None, n_max=DEFAULT_NMAX, witnesses=None, exact_max=16, eligible=None, do_search=False):
    src = src or Sources()
    checks = []
    fin, intro, log61, logind, res = read_release(src)
    flat = ' '.join(fin.split())
    check(checks, 'the proposition as printed (finite.tex:12-17)',
          'For every integer $1\\leq n\\leq64$ other than $2,4,9$, there is a self-conjugate partition $\\lambda\\vdash n$' in flat
          and 'g(\\lambda,\\lambda,\\nu)>0\\qquad\\text{for every }\\nu\\vdash n' in flat)
    check(checks, 'the release records exit statuses, not witnesses (finite.tex:223-225, RESULTS.json witness_format)',
          'The record contains exit statuses rather than the selected partitions' in flat
          and 'no selected partition' in res['authoritative_certificates']['character']['witness_format'],
          'NEEDS DATA for the published certificate: no lambda_n is recorded for any n')
    elig_paper = res['authoritative_certificates']['character']['eligible_degrees']
    elig_true = [n for n in range(1, 65) if n not in EXCLUDED]
    check(checks, 'RESULTS.json eligible_degrees = {1..64} minus {2,4,9}', elig_paper == elig_true)
    pins = {a['path']: a['sha256'] for a in res['result_artifacts']}
    readme = src.text(README)
    stale = pins.get('README.md') != src.read[README]
    check(checks, 'RESULTS.json pins the sha256 of the two character logs read here',
          pins.get('character-61-degrees.log') == src.read[LOG61] and pins.get('character-independent-1-12.log') == src.read[LOGIND],
          ('its README.md pin does not match the shipped README, which says so itself ("identifies the pre-sanitization documentation")'
           if stale and 'pre-sanitization' in readme else ('README.md pin matches' if not stale else 'README.md pin stale, unexplained')))
    runs = [int(m) for m in re.findall(r'^n=(\d+) status=0 ', log61, re.M)]
    check(checks, 'character-61-degrees.log: one status-0 line for each eligible degree, no other',
          sorted(runs) == elig_true and len(runs) == 61, '%d lines' % len(runs))
    pc = partition_counts(64)
    check(checks, '|P_64| = 1741630 and sum_{s<=64} |P_s| = 12308139 (finite.tex:186-187)', pc[64] == 1741630 and sum(pc) == 12308139,
          '%d, %d' % (pc[64], sum(pc)))
    check(checks, '1000000007 and 1000000009 are prime (finite.tex:36-37), by trial division here',
          is_prime_trial(1000000007) and is_prime_trial(1000000009))
    check(checks, 'the moduli used here, %d and %d, are prime (trial division)' % (P1, P2), is_prime_trial(P1) and is_prime_trial(P2))

    # route (2): exact tables
    t0 = time.time()
    ct = CharTable()
    rec_cover = {int(a): json.loads(b) for a, b in re.findall(r'PASS n=(\d+) partitions=\d+ .*?covering_shapes=(\[.*\])', logind)}
    exact = {}
    cover_ok = True
    cover_detail = []
    orth_all = div_all = True
    for n in range(1, exact_max + 1):
        sq, ok_orth, ok_div = exact_squares(n, ct)
        orth_all &= ok_orth
        div_all &= ok_div
        exact[n] = sq
        cov = [lam for lam in partitions(n) if all(v > 0 for v in sq[lam].values())]
        if n <= 12:
            if sorted(map(tuple, rec_cover.get(n, [None]))) != sorted(cov):
                cover_ok = False
                cover_detail.append('n=%d: here %s, recorded %s' % (n, cov, rec_cover.get(n)))
        if n in EXCLUDED and cov:
            cover_ok = False
            cover_detail.append('n=%d has a covering square %s' % (n, cov[0]))
        if n not in EXCLUDED and not cov:
            cover_ok = False
            cover_detail.append('n=%d: no covering square in the exact table' % n)
    check(checks, '(2) exact character tables n <= %d: column orthogonality (n <= 12) and n! | sum |C| chi chi chi' % exact_max, orth_all and div_all)
    check(checks, '(2) covering lambda over ALL partitions, n <= 12, equal the recorded covering_shapes; none at n = 2, 4, 9',
          cover_ok and len(rec_cover) == 12, '; '.join(cover_detail) or 'n=2,4,9: none; e.g. n=8: %s' % rec_cover.get(8))
    t_exact = time.time() - t0

    # route (1): Horner residues
    sp = Space(max(n_max, exact_max))
    mism = []
    for n in range(1, exact_max + 1):
        for lam in partitions(n):
            if conjugate(lam) != lam:
                continue
            r = kron_square_residues(sp, n, lam, P1)
            ex = [exact[n][lam][nu] % P1 for nu in partitions(n)]
            if r != ex:
                mism.append((n, lam))
    check(checks, '(1)=(2) Horner residues equal the exact vectors mod p1 for every self-conjugate lambda, n <= %d' % exact_max, not mism, str(mism[:3]))

    wit = dict(WITNESSES if witnesses is None else witnesses)
    elig = elig_true if eligible is None else eligible
    timing = {}
    found = {}
    bad = []
    for n in elig:
        if n > n_max:
            continue
        t1 = time.time()
        lam = wit.get(n)
        if lam is None and do_search:
            lam, _ = search(sp, n)
        if lam is None:
            bad.append((n, 'no witness'))
            continue
        ok, det = certify_witness(sp, n, tuple(lam))
        timing[n] = round(time.time() - t1, 2)
        if ok:
            found[n] = tuple(lam)
        else:
            bad.append((n, tuple(lam), det))
    decided = [n for n in elig if n <= n_max]
    check(checks, '(1) a certified self-conjugate witness for every eligible n <= %d (%d degrees)' % (n_max, len(decided)),
          not bad and sorted(found) == decided, str(bad[:3]) if bad else 'witnesses: %s' % json.dumps({k: list(v) for k, v in sorted(found.items())}))

    ok = all(c['pass'] for c in checks)
    data_fail = not all(c['pass'] for c in checks if c['check'].startswith(('the proposition', 'RESULTS.json', 'character-61')))
    verdict = 'CERTIFIED' if ok else ('REFUSED' if data_fail else 'REFUTED')
    rest = [n for n in elig_true if n > n_max]
    decides = ('a finite component: Proposition prop:finite-check for every eligible n <= %d (%d of the 61 degrees), '
               'with witnesses supplied and certified here (the release records none: NEEDS DATA for its own '
               'certificate)' % (n_max, len(decided)))
    if rest:
        decides += '; n = %d..64 NOT decided in this run (cost; the release has exit statuses only there)' % rest[0]
    decides += '; the large-degree theory (n > 64) is not decided'
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'decides': decides,
            'value': {'witnesses': {k: list(v) for k, v in sorted(found.items())}, 'timing': timing,
                      'exact_seconds': round(t_exact, 1), 'strip_map_entries': sp.map_entries,
                      'published_witnesses': 'NEEDS DATA: none recorded (exit statuses only)', 'undecided_degrees': rest}}


def forge():
    """each must NOT certify (run on n <= 16, where the exact table also decides)"""
    out = []
    base = dict(WITNESSES)
    # 1. a self-conjugate partition whose square misses a target, in place of the witness at n = 16
    ct = CharTable()
    sq, _, _ = exact_squares(16, ct)
    noncov = next(lam for lam in partitions(16) if conjugate(lam) == lam and not all(v > 0 for v in sq[lam].values()))
    w = dict(base)
    w[16] = noncov
    r = decide(n_max=16, witnesses=w)
    out.append(('witness at n=16 replaced by the self-conjugate %s (exact table: some g = 0)' % (noncov,), r['verdict']))
    # 2. the excluded degree 9 declared eligible, with each of its two self-conjugate partitions
    for lam9 in ((3, 3, 3), (5, 1, 1, 1, 1)):
        w = dict(base)
        w[9] = lam9
        r = decide(n_max=16, witnesses=w, eligible=sorted(set(range(1, 65)) - {2, 4}))
        out.append(('degree 9 declared eligible with witness %s' % (lam9,), r['verdict']))
    # 3. a witness that is not self-conjugate (its transpose differs): g(l,l,(1^n)) = 0
    w = dict(base)
    w[12] = (5, 3, 2, 2)
    r = decide(n_max=16, witnesses=w)
    out.append(('witness at n=12 replaced by the non-self-conjugate (5,3,2,2)', r['verdict']))
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--search':
        nmax = int(args[1])
        sp = Space(nmax)
        found = {}
        for n in range(1, nmax + 1):
            if n in EXCLUDED:
                continue
            t = time.time()
            lam, tried = search(sp, n)
            found[n] = lam
            print(json.dumps({'n': n, 'witness': lam, 'tried': len(tried), 'seconds': round(time.time() - t, 1),
                              'map_entries': sp.map_entries}), flush=True)
        print('WITNESSES =', {k: v for k, v in found.items()})
        sys.exit(0)
    nmax = int(args[args.index('--n-max') + 1]) if '--n-max' in args else DEFAULT_NMAX
    t = time.time()
    res = decide(n_max=nmax, do_search='--search-missing' in args)
    print(json.dumps({k: res[k] for k in ('verdict', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'][:400])
    print('timing per degree (s):', res['value']['timing'])
    print('%.1fs' % (time.time() - t))
    if '--no-forge' not in args:
        t1 = time.time()
        for desc, v in forge():
            print('FORGE', v, '-', desc)
        print('forges %.1fs' % (time.time() - t1))
