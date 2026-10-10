"""F-338 — "Cycle--clique Ramsey numbers" (openai/math family 189).

THE CLAIM. The headline (01-introduction.tex, Theorem thm:main, lines 10-16) is R(C_m, K_n) = (m-1)(n-1) + 1 for all
m >= n >= 3, (m, n) != (3, 3). Its last step is finite (09-finite-patterns.tex, Proposition finite:verified, lines
11-27): for 5 <= k <= 17 and max{3, floor(k/2)} <= t <= min{8, k} there is no graph with no C_{k+1}, clique number
t, alpha <= k and |N[I]| >= k|I| + 1 for every nonempty independent I; "more precisely, every optimal path system on
a maximum clique ... gives a contradiction". The abstract (main.tex:37-40): "These arguments reduce the remaining
cases to $3{,}099$ finite parameter-pattern instances, which are excluded by two exact implementations of proved
inference rules. Complete programs and deduction traces accompany the paper." The 3,099 (09-finite-patterns.tex:121-122;
01-introduction.tex:99), the per-(k,t) counts (Table finite:counts, lines 158-181) and the outcome split 0 / 3049 / 50
(09-finite-results.tex, Table finite:results, lines 11-37) are printed. The traces are published in
verification/data/certificates.jsonl, format in 10-implementation.tex lines 90-104.

WHAT IS DECIDED HERE — a finite component: the published deduction traces, checked against the paper's STATEMENTS of
its inference rules, re-implemented from the LaTeX only (no code of the release read before this ran):
  (a) THE DOMAIN. The 42 pairs (k, t) of (finite:domain) and, for each, every pattern of Lemma finite:coverage
      (nondecreasing lists of reversal-normalized tuples of positive integers, sum of (len+1) = t, sum of entries
      <= B = k - t), enumerated here; the count is derived a second way from the paper's generating function
      (finite:chain-count, finite:count-series), whose chain-type numbers a(r, m) are themselves checked against a
      direct count of compositions up to reversal. Compared with Table finite:counts, with summary.json, and with
      the certificate file: every instance present exactly once, nothing extra, every recorded pattern in the
      canonical form.
  (b) EVERY TRACE STEP. Per record: the labels of Lemma finite:labels (S = {0..t+L-1}, the old edges E(P), the
      endpoint choices T(x), the required-edge graph J); the initial flags recomputed as the union of the
      intervals (finite:extension-interval) of Lemma finite:extension-rule over every allowed (z, w, E) — every
      recorded bit must be so justified, and equality is checked; for an output-2 record, the required-path
      constraints of Lemma finite:required-path-rule (every simple path of J, by a (visited set, endpoint) search)
      added; then every recorded round entry (pair, d, witness) re-justified as a trial of Lemma
      finite:strengthening built on the matrix at the START of its round (d = 0: J + ij on S; d = 1: a fresh vertex
      with edges iz, zj, its pairs starting empty; the old entries inherited; the required-path rule on the trial
      graph), its witness checked as a packing contradiction on the trial data, and the entry checked to be new
      (d not already in M_ij; d = 0 not on an edge of J); the round's entries added together afterwards.
  (c) EVERY FINAL CONTRADICTION. A packing witness [(base, radius, weight)] is valid when the bases are distinct
      vertices of X, each radius is -1 (singleton, weight <= 1) or 0..2 with b_0 > 0, each weight is at most the
      bound u_r of Lemma finite:ball-bounds recomputed from the matrix (b_0, T_r, b_r, u_r, the exception
      condition), every pair satisfies (finite:compatibility), and the total exceeds k (Lemma finite:packing). An
      output-1 record's witness is checked on the initial matrix alone (no required-path constraints), an output-2
      record's on the matrix after Step 2 and all its rounds. For every output-2 record an exact search over all
      compatible families (one option per base or none; branch and bound) confirms the initial matrix has NO
      packing contradiction, so the 3049 / 50 split of Table finite:results is recomputed, not copied; the same
      search must find a packing on every output-1 initial matrix (a search that misses one is not trusted).
      Every entry of a recorded witness is checked; a recorded weight below the recomputed bound would still be
      sound and is counted apart (all 3099 + 2259 witnesses record exactly the bound).
Integers, bitmasks and finite sets only; no float enters a decision.

WHAT IS NOT DECIDED HERE.
  - The soundness of the inference rules. Lemmas finite:extension-rule, finite:required-path-rule,
    finite:inheritance, finite:ball-bounds, finite:packing, finite:strengthening and path:separation /
    path:interval / size:test (06-paths.tex, 05-size.tex) are proved in prose; this checker decides that each
    rule is APPLIED as stated, not that the statement is true. Their soundness is the paper's.
  - The reduction of Theorem thm:main to Proposition finite:verified (sections 2-8: the minimal counterexample, the
    expansion property, the clique bound t >= floor(k/2), k = 3, 4 and t >= 9), and Lemma finite:coverage's claim
    that every optimal path system is represented by one of the enumerated patterns (the enumeration itself is
    re-derived here; that it captures every real system is the paper's argument).
  - Whether the traces are the COMPLETE output of the paper's procedure (that each round collected every
    successful trial). Completeness is not needed for soundness and is not checked.

READ AFTER THIS DECIDER RAN (verification/code/*.py, never executed). The authors' compact program regenerates only
the per-k counts; their second program GENERATES the traces and asserts each witness against the option weights it
just computed itself; verify.py reruns both, compares stdout with expected-output.txt and the regenerated trace file's
sha256 with the supplied one. None of them reads the supplied traces and re-justifies their steps (the paper says
the traces are "not offered as proof objects for an additional independent minimal validator",
10-implementation.tex:106-110); this checker is that validator. Both of their programs are by the same author.
"""
import json
import os
import re
import sys
import time
from collections import Counter
from math import comb

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

PRE = 'preprints/Cycle-clique-Ramsey-numbers-September-25-2026/'
INTRO = PRE + 'build/sections/01-introduction.tex'
PATTERNS = PRE + 'build/sections/09-finite-patterns.tex'
RULES = PRE + 'build/sections/09-finite-rules.tex'
PACKING = PRE + 'build/sections/09-finite-packing.tex'
RESULTS = PRE + 'build/sections/09-finite-results.tex'
IMPL = PRE + 'build/sections/10-implementation.tex'
CERTS = PRE + 'verification/data/certificates.jsonl'
EXPECTED = PRE + 'verification/data/expected-output.txt'
SUMMARY = PRE + 'verification/data/summary.json'


# ---------------------------------------------------------------- (a) the domain, from the paper's definitions

def domain():
    """(finite:domain): 5 <= k <= 17, max{3, floor(k/2)} <= t <= min{8, k}"""
    return [(k, t) for k in range(5, 18) for t in range(max(3, k // 2), min(8, k) + 1)]


def compositions(m, maxlen):
    """tuples of positive integers summing to m with at most maxlen entries"""
    if m == 0:
        yield ()
        return
    if maxlen == 0:
        return
    for first in range(1, m + 1):
        for rest in compositions(m - first, maxlen - 1):
            yield (first,) + rest


def chain_types(t, B):
    """reversal-normalized tuples p (p <= reversed p, lexicographically) with len(p) <= t - 1 and sum(p) <= B"""
    out = []
    for m in range(B + 1):
        for p in compositions(m, t - 1):
            if p <= p[::-1]:
                out.append(p)
    return sorted(out)


def patterns(t, B):
    """every nondecreasing list of chain types with sum(len + 1) = t and sum of amounts <= B (Lemma finite:coverage)"""
    types = chain_types(t, B)
    out = []
    acc = []

    def rec(start, verts, budget):
        if verts == 0:
            out.append(tuple(acc))
            return
        for i in range(start, len(types)):
            p = types[i]
            if len(p) + 1 <= verts and sum(p) <= budget:
                acc.append(p)
                rec(i, verts - len(p) - 1, budget - sum(p))
                acc.pop()

    rec(0, t, B)
    return out


def canonical(pattern):
    return tuple(sorted(min(tuple(p), tuple(p)[::-1]) for p in pattern))


def a_formula(r, m):
    """(finite:chain-count): chain types with r >= 1 edges and amount m >= r; returns (value, numerator was even)"""
    if r % 2 == 0:
        s = r // 2
        b = comb(m // 2 - 1, s - 1) if m % 2 == 0 else 0
    else:
        s = (r - 1) // 2
        b = comb((m - 1) // 2, s)
    num = comb(m - 1, r - 1) + b
    return num // 2, num % 2 == 0


def a_direct(r, m):
    return sum(1 for p in compositions(m, r) if len(p) == r and p <= p[::-1])


def gf_count(t, B):
    """(finite:count-series): sum_{L <= B} [x^t y^L] 1/(1-x) prod_{r >= 1, m >= r} (1 - x^{r+1} y^m)^{-a(r,m)}"""
    poly = {(i, 0): 1 for i in range(t + 1)}
    for r in range(1, t):
        for m in range(r, B + 1):
            a = a_formula(r, m)[0]
            if a == 0:
                continue
            series = {}
            n = 0
            while n * (r + 1) <= t and n * m <= B:
                series[(n * (r + 1), n * m)] = comb(n + a - 1, n)
                n += 1
            new = {}
            for (i, j), c in poly.items():
                for (di, dj), cc in series.items():
                    if i + di <= t and j + dj <= B:
                        new[(i + di, j + dj)] = new.get((i + di, j + dj), 0) + c * cc
            poly = new
    return sum(poly.get((t, L), 0) for L in range(B + 1))


# ---------------------------------------------------------------- (b) labels, required edges, the rules

class Instance:
    """Lemma finite:labels: components in the recorded order and orientation, labelled consecutively from 0"""

    def __init__(self, k, t, pattern):
        self.k, self.t = k, t
        nxt = 0
        Q, E = [], []
        for p in pattern:
            a = nxt
            Q.append(a)
            nxt += 1
            for q in p:
                b = a + q + 1
                E.append((a, b))
                Q.append(b)
                a = b
                nxt = b + 1
        n = nxt
        self.n, self.Q, self.E = n, Q, E
        self.L = sum(b - a - 1 for a, b in E)
        self.e = len(E)
        self.T = [None] * n
        for x in Q:
            self.T[x] = (x,)
        for a, b in E:
            for x in range(a + 1, b):
                if self.T[x] is not None:
                    raise ValueError('label %d covered twice' % x)
                self.T[x] = (a, b)
        if any(T is None for T in self.T):
            raise ValueError('a label is not covered')
        adj = [0] * n
        for x in Q:
            for y in Q:
                if x != y:
                    adj[x] |= 1 << y
        for a, b in E:
            for x in range(a, b):
                adj[x] |= 1 << (x + 1)
                adj[x + 1] |= 1 << x
        self.adj = adj


def extension_matrix(inst, choice=None):
    """Lemma finite:extension-rule: for x < y in S, the union over z in T(x), w in T(y), z < w, and every subset E of
    the old edges whose paths do not contain x or y in their interiors, with deg_E(z), deg_E(w) <= 1 and z, w in
    different components of E, of the positive d with L + [e' >= e] - q <= d <= k + 1 - v' - q.
    `choice` = (x, y, z, w, Emask) returns that single choice's interval instead (for the paper's worked example)."""
    k, n, E, L, e = inst.k, inst.n, inst.E, inst.L, inst.e
    m = len(E)
    subsets = []
    for mask in range(1 << m):
        deg = [0] * n
        comp = list(range(n))

        def find(v):
            while comp[v] != v:
                comp[v] = comp[comp[v]]
                v = comp[v]
            return v
        amount = 0
        vmask = 0
        size = 0
        for i in range(m):
            if mask >> i & 1:
                a, b = E[i]
                deg[a] += 1
                deg[b] += 1
                ra, rb = find(a), find(b)
                if ra == rb:
                    raise ValueError('old edges contain a cycle')
                comp[ra] = rb
                amount += b - a - 1
                vmask |= (1 << a) | (1 << b)
                size += 1
        roots = [find(v) for v in range(n)]
        subsets.append((size, amount, vmask, deg, roots))

    def interval(x, y, z, w, mask):
        size, amount, vmask, deg, roots = subsets[mask]
        if deg[z] > 1 or deg[w] > 1 or roots[z] == roots[w]:
            return None
        e1 = size + 1
        v1 = bin(vmask | (1 << z) | (1 << w)).count('1')
        q = amount + abs(x - z) + abs(y - w)
        lo = max(1, L + (1 if e1 >= e else 0) - q)
        hi = k + 1 - v1 - q
        return (lo, hi)

    if choice is not None:
        return interval(*choice)
    M = [[0] * n for _ in range(n)]
    for x in range(n):
        for y in range(x + 1, n):
            allowed = 0
            for i, (a, b) in enumerate(E):
                if not (a < x < b) and not (a < y < b):
                    allowed |= 1 << i
            bits = 0
            for z in inst.T[x]:
                for w in inst.T[y]:
                    if z >= w:
                        continue
                    sm = allowed
                    while True:
                        iv = interval(x, y, z, w, sm)
                        if iv is not None and iv[0] <= iv[1]:
                            bits |= ((1 << (iv[1] + 1)) - 1) ^ ((1 << iv[0]) - 1)
                        if sm == 0:
                            break
                        sm = (sm - 1) & allowed
            M[x][y] = M[y][x] = bits
    return M


def required_paths(adj, n, k):
    """Lemma finite:required-path-rule: k - l for every simple x-y path of length 1 <= l <= k in the required graph.
    States (visited set, endpoint) per start; two paths with the same state have the same continuations."""
    R = [[0] * n for _ in range(n)]
    for s in range(n):
        frontier = {((1 << s), s)}
        for ln in range(1, k + 1):
            nxt = set()
            for U, x in frontier:
                nb = adj[x] & ~U
                while nb:
                    low = nb & -nb
                    nb ^= low
                    nxt.add((U | low, low.bit_length() - 1))
            if not nxt:
                break
            bit = 1 << (k - ln)
            row = R[s]
            for _, y in nxt:
                row[y] |= bit
            frontier = nxt
    return R


def ball_weights(k, t, nX, row):
    """Lemma finite:ball-bounds at one base: {radius: certified independence bound}; radius -1 is the singleton"""
    out = {-1: 1}
    b0 = k + 1 - nX + sum(1 for f in row if f & 1)
    if b0 <= 0:
        return out
    u_prev = 1 + (1 if b0 >= t else 0)
    out[0] = u_prev
    b_prev = b0
    for r in (1, 2):
        need = (1 << (r + 1)) - 2                       # parameters 1..r
        Tr = sum(1 for f in row if f & need == need)
        br = max(b_prev, k * u_prev + 1 - nX + Tr)
        uh = max(u_prev, 1 + (1 if br > t else 0) + (1 if br > max(k, 2 * t) else 0))
        ur = 2 if (uh == 1 and b_prev == br == t and k + 1 - nX + Tr >= t) else uh
        out[r] = ur
        b_prev, u_prev = br, ur
    return out


def compatible(M, i, r, j, s):
    """(finite:compatibility)"""
    if r == -1 and s == -1:
        return bool(M[i][j] & 1)
    need = (1 << (r + s + 3)) - 2                       # parameters 1..r+s+2
    return M[i][j] & need == need


def packing_witness(k, t, nX, M, wit):
    """(c): is the recorded family a packing contradiction on (X, M)? returns (valid, every weight equals the bound, why)"""
    if wit.get('kind') != 'packing':
        return False, False, 'witness kind %r' % wit.get('kind')
    opts = wit['options']
    bases = [o[0] for o in opts]
    if len(set(bases)) != len(bases):
        return False, False, 'repeated base'
    exact = True
    total = 0
    for base, r, w in opts:
        if not (0 <= base < nX) or r not in (-1, 0, 1, 2) or not isinstance(w, int) or w < 1:
            return False, False, 'malformed option %r' % ([base, r, w],)
        bound = ball_weights(k, t, nX, M[base]).get(r)
        if bound is None:
            return False, False, 'radius %d at base %d unavailable (b_0 <= 0)' % (r, base)
        if w > bound:
            return False, False, 'weight %d at (%d, %d) exceeds the certified %d' % (w, base, r, bound)
        exact &= w == bound
        total += w
    for x in range(len(opts)):
        for y in range(x + 1, len(opts)):
            i, r = opts[x][0], opts[x][1]
            j, s = opts[y][0], opts[y][1]
            if not compatible(M, i, r, j, s):
                return False, False, 'options (%d,%d), (%d,%d) not compatible' % (i, r, j, s)
    if total != wit.get('weight'):
        return False, False, 'recorded total %r, options sum to %d' % (wit.get('weight'), total)
    if total <= k:
        return False, False, 'total weight %d <= k' % total
    return True, exact, ''


def packing_exists(k, t, nX, M):
    """exact search: is there a compatible family of options (distinct bases) of total weight > k?"""
    opts = []
    for i in range(nX):
        ws = ball_weights(k, t, nX, M[i])
        opts.append(sorted(ws.items(), key=lambda kv: -kv[1]))
    order = sorted(range(nX), key=lambda i: -opts[i][0][1])
    suffix = [0] * (nX + 1)
    for p in range(nX - 1, -1, -1):
        suffix[p] = suffix[p + 1] + opts[order[p]][0][1]
    chosen = []

    def rec(p, weight):
        if weight > k:
            return True
        if p == nX or weight + suffix[p] <= k:
            return False
        i = order[p]
        for r, w in opts[i]:
            if all(compatible(M, i, r, j, s) for j, s in chosen):
                chosen.append((i, r))
                if rec(p + 1, weight + w):
                    return True
                chosen.pop()
        return rec(p + 1, weight)

    return rec(0, 0)


def trial(inst, M, i, j, d):
    """Lemma finite:strengthening: the trial set, required graph and matrix for an outside i-j path with parameter d"""
    k, n = inst.k, inst.n
    if d == 0:
        nX = n
        adj = list(inst.adj)
        adj[i] |= 1 << j
        adj[j] |= 1 << i
        Mt = [list(row) for row in M]
    else:
        nX = n + 1
        adj = list(inst.adj) + [(1 << i) | (1 << j)]
        adj[i] |= 1 << n
        adj[j] |= 1 << n
        Mt = [list(row) + [0] for row in M] + [[0] * nX]
    R = required_paths(adj, nX, k)
    for x in range(nX):
        for y in range(nX):
            Mt[x][y] |= R[x][y]
    return nX, adj, Mt


# ---------------------------------------------------------------- one record

def check_record(rec):
    """returns a dict of findings; 'ok' is True only when every step of the trace is justified"""
    k, t = rec['k'], rec['t']
    out = {'ok': False, 'why': '', 'initial_equal': False, 'weights_exact': True, 'rounds_checked': 0}
    inst = Instance(k, t, [tuple(p) for p in rec['pattern']])
    n = inst.n
    if n != t + inst.L or len(inst.Q) != t or inst.L > k - t:
        out['why'] = 'labels: |S| = %d, |Q| = %d, L = %d' % (n, len(inst.Q), inst.L)
        return out
    M0 = extension_matrix(inst)
    recorded = {}
    for x, y, f in rec['initial']:
        if not (0 <= x < y < n) or (x, y) in recorded or not isinstance(f, int) or f < 0:
            out['why'] = 'initial entry %r malformed or repeated' % ([x, y, f],)
            return out
        recorded[(x, y)] = f
    Mi = [[0] * n for _ in range(n)]
    for (x, y), f in recorded.items():
        if f & ~M0[x][y]:
            out['why'] = 'initial flag bits %s on (%d,%d) not justified by the extension rule' % (bin(f & ~M0[x][y]), x, y)
            return out
        Mi[x][y] = Mi[y][x] = f
    out['initial_equal'] = all(recorded.get((x, y), 0) == M0[x][y] for x in range(n) for y in range(x + 1, n))
    cls = rec['classification']
    if cls == 1:
        if rec['rounds']:
            out['why'] = 'output 1 with rounds'
            return out
        ok, exact, why = packing_witness(k, t, n, Mi, rec['final'])
        out['weights_exact'] &= exact
        if not ok:
            out['why'] = 'final (initial matrix): ' + why
            return out
        out['ok'] = True
        out['Mi'] = Mi
        return out
    if cls != 2:
        out['why'] = 'classification %r' % cls
        return out
    R = required_paths(inst.adj, n, k)
    M = [[Mi[x][y] | R[x][y] for y in range(n)] for x in range(n)]
    for rnd in rec['rounds']:
        seen = set()
        adds = []
        for entry in rnd:
            i, j = entry['pair']
            d = entry['d']
            if not (0 <= i < j < n) or d not in (0, 1) or (i, j, d) in seen:
                out['why'] = 'round entry %r malformed or repeated' % (entry['pair'] + [d],)
                return out
            seen.add((i, j, d))
            if M[i][j] >> d & 1:
                out['why'] = 'round entry (%d,%d) d=%d already in M' % (i, j, d)
                return out
            if d == 0 and inst.adj[i] >> j & 1:
                out['why'] = 'round entry (%d,%d) d=0 on a required edge' % (i, j)
                return out
            nX, adj, Mt = trial(inst, M, i, j, d)
            ok, exact, why = packing_witness(k, t, nX, Mt, entry['witness'])
            out['weights_exact'] &= exact
            if not ok:
                out['why'] = 'round entry (%d,%d) d=%d: %s' % (i, j, d, why)
                return out
            adds.append((i, j, d))
            out['rounds_checked'] += 1
        for i, j, d in adds:
            M[i][j] |= 1 << d
            M[j][i] |= 1 << d
    ok, exact, why = packing_witness(k, t, n, M, rec['final'])
    out['weights_exact'] &= exact
    if not ok:
        out['why'] = 'final: ' + why
        return out
    out['ok'] = True
    out['Mi'] = Mi
    return out


def load_records(src):
    return [json.loads(line) for line in src.text(CERTS).split('\n') if line.strip()]


# ---------------------------------------------------------------- the decider

def decide(src=None, records=None, sample=None):
    """sample = a set of record indices whose traces are checked (the domain is always checked in full);
    a sampled run is never CERTIFIED"""
    src = src or Sources()
    checks = []
    pat_tex = src.text(PATTERNS)
    rules_tex = src.text(RULES)
    pack_tex = src.text(PACKING)
    res_tex = src.text(RESULTS)
    impl_tex = src.text(IMPL)
    intro_tex = src.text(INTRO)
    expected = src.text(EXPECTED)
    summary = json.loads(src.text(SUMMARY))
    if records is None:
        records = load_records(src)
    check(checks, 'the theorem and the finite proposition as printed',
          'R(C_m,K_n)=(m-1)(n-1)+1' in intro_tex.replace(' ', '').replace('\n', '')
          and '5\\le k\\le17' in pat_tex and '\\max\\{3,\\lfloor k/2\\rfloor\\}\\le t\\le\\min\\{8,k\\}' in pat_tex,
          '01-introduction.tex:10-16, 09-finite-patterns.tex:11-27')
    check(checks, 'the rule statements read are the ones cited',
          all(s in rules_tex for s in ('label{finite:extension-rule}', 'label{finite:required-path-rule}',
                                       'L+\\mathbf 1_{\\{e\'\\ge e\\}}-q', 'k+1-v\'-q', 'k-\\ell\\in M_{xy}'))
          and all(s in pack_tex for s in ('label{finite:ball-bounds}', 'label{finite:packing}', 'label{finite:strengthening}',
                                          'b_0=k+1-n_X+|\\{j\\in X:0\\in M_{ij}\\}|', '\\{1,\\ldots,r+s+2\\}\\subseteq M_{ij}')),
          '09-finite-rules.tex, 09-finite-packing.tex')

    # ---- (a) the domain
    pairs = domain()
    m = re.search(r'exactly \$(\d+)\$ parameter pairs', pat_tex)
    check(checks, '(a) 42 parameter pairs in (finite:domain), as printed (09-finite-patterns.tex:121)',
          len(pairs) == 42 and m and int(m.group(1)) == len(pairs), '%d pairs; printed %s' % (len(pairs), m and m.group(1)))
    enum = {}
    for k, t in pairs:
        ps = patterns(t, k - t)
        if len(set(ps)) != len(ps) or any(canonical(p) != p for p in ps):
            enum = None
            break
        enum[(k, t)] = ps
    check(checks, '(a) the enumeration emits canonical, pairwise distinct patterns', enum is not None)
    enum = enum or {}
    total = sum(len(v) for v in enum.values())
    m = re.search(r'contain \$(\d+)\$ instances', pat_tex)
    check(checks, '(a) 3099 instances, as printed (09-finite-patterns.tex:122)', m and int(m.group(1)) == total,
          '%d enumerated; printed %s' % (total, m and m.group(1)))
    ok_a = all(a_formula(r, mm)[1] and a_formula(r, mm)[0] == a_direct(r, mm) for r in range(1, 8) for mm in range(r, 10))
    check(checks, '(a) a(r, m) of (finite:chain-count) equals the direct count of compositions up to reversal (r <= 7, m <= 9)', ok_a)
    gf_ok = all(gf_count(t, k - t) == len(enum.get((k, t), [])) for k, t in pairs)
    check(checks, '(a) the generating function (finite:count-series) gives the same count for every pair', gf_ok)
    rows = re.findall(r'^(\d+) & \$([\d,]+)\$ & \$([\d+=]+)\$', pat_tex, re.M)
    tab = {}
    for kk, ts, cell in rows:
        ts = [int(x) for x in ts.split(',')]
        parts, tot = cell.split('=') if '=' in cell else (cell, cell)
        parts = [int(x) for x in parts.split('+')]
        if len(ts) != len(parts) or sum(parts) != int(tot):
            tab = None
            break
        for tt, c in zip(ts, parts):
            tab[(int(kk), tt)] = c
    check(checks, '(a) Table finite:counts (09-finite-patterns.tex:163-175) equals the enumeration, pair by pair',
          tab is not None and tab == {kt: len(v) for kt, v in enum.items()}, '%d table cells' % len(tab or {}))
    cov = {(c['k'], c['t']): c for c in summary['coverage']}
    cov_ok = set(cov) == set(enum) and all(
        cov[kt]['patterns'] == len(v)
        and {int(a): b for a, b in cov[kt]['by_amount'].items()} == dict(Counter(sum(map(sum, p)) for p in v))
        for kt, v in enum.items())
    check(checks, '(a) summary.json coverage (patterns and per-amount counts) equals the enumeration', cov_ok)
    check(checks, '(a) summary.json total_patterns = 3099, unresolved = 0',
          summary['total_patterns'] == total and summary['unresolved'] == 0)
    check(checks, '(a) certificates.jsonl sha256 equals the one summary.json records',
          src.read.get(CERTS) == summary['certificates_sha256'],
          src.read.get(CERTS, 'not read'))
    keys = Counter()
    exact_form = 0
    for r in records:
        pat = tuple(tuple(p) for p in r['pattern'])
        keys[(r['k'], r['t'], canonical(pat))] += 1
        exact_form += canonical(pat) == pat
    want = {(k, t, p) for (k, t), v in enum.items() for p in v}
    check(checks, '(a) the certificate file has one record per line, %d lines' % total, len(records) == total, str(len(records)))
    check(checks, '(a) every enumerated instance is in the file exactly once, and nothing else is',
          set(keys) == want and all(c == 1 for c in keys.values()),
          'missing %d, extra %d, repeated %d' % (len(want - set(keys)), len(set(keys) - want), sum(1 for c in keys.values() if c > 1)))
    check(checks, '(a) every recorded pattern is in the canonical form (normalized components, nondecreasing)',
          exact_form == len(records), '%d of %d' % (exact_form, len(records)))

    # ---- (b), (c) the traces
    idx = range(len(records)) if sample is None else sorted(i for i in sample if 0 <= i < len(records))
    bad = []
    init_eq = 0
    weights_exact = 0
    rounds_checked = 0
    search_fail = []                 # output-2 records whose initial matrix already closes
    search_blind = []                # output-1 records where the search misses the recorded packing
    cls_count = {}
    t0 = time.time()
    for i in idx:
        r = records[i]
        try:
            f = check_record(r)
        except (ValueError, KeyError, TypeError, IndexError) as exc:
            f = {'ok': False, 'why': 'malformed: %r' % (exc,), 'initial_equal': False, 'weights_exact': False,
                 'rounds_checked': 0}
        if not f['ok']:
            bad.append((i, r['k'], r['t'], r['pattern'], f['why']))
            continue
        init_eq += f['initial_equal']
        weights_exact += f['weights_exact']
        rounds_checked += f['rounds_checked']
        found = packing_exists(r['k'], r['t'], len(f['Mi']), f['Mi'])
        if r['classification'] == 2 and found:
            search_fail.append(i)
        if r['classification'] == 1 and not found:
            search_blind.append(i)
        c = cls_count.setdefault(r['k'], [0, 0, 0])
        c[r['classification']] += 1
    elapsed = time.time() - t0
    n_rec = len(idx)
    n_rounds_total = sum(len(rnd) for i in idx for rnd in records[i]['rounds'])
    check(checks, '(b) every recorded initial flag is justified by Lemma finite:extension-rule, and every trace step and final '
          'contradiction checks (%d records)' % n_rec, not bad,
          '%d failing; first: %s' % (len(bad), bad[:3]) if bad else '')
    check(checks, '(b) the recorded initial flags EQUAL the recomputed union of extension intervals',
          init_eq == n_rec - len(bad), '%d of %d' % (init_eq, n_rec))
    check(checks, '(b) every round entry re-justified by a trial of Lemma finite:strengthening on its round-start matrix',
          rounds_checked == n_rounds_total and not bad, '%d of %d round entries' % (rounds_checked, n_rounds_total))
    check(checks, '(c) for every output-2 record, an exact search finds NO packing contradiction on the initial matrix '
          '(so output 1 is not the right class)', not search_fail, 'failing records %s' % search_fail[:5])
    check(checks, '(c) the same search finds a packing on every output-1 initial matrix (it is not blind)',
          not search_blind, 'missed in records %s' % search_blind[:5])
    finals_packing = all(records[i]['final']['kind'] == 'packing' for i in idx)
    check(checks, '(c) all final witnesses are packing contradictions, as printed (10-implementation.tex:104)', finals_packing)

    # printed outcome tables
    exp = {}
    for line in expected.strip().split('\n'):
        a = [int(x) for x in line.split()]
        exp[a[0]] = a[1:]
    tab_res = {}
    for kk, o0, o1, o2 in re.findall(r'^(\d+)&(\d+)&(\d+)&(\d+)\\\\', res_tex, re.M):
        tab_res[int(kk)] = [int(o0), int(o1), int(o2)]
    mt = re.search(r'Total&(\d+)&(\d+)&(\d+)', res_tex)
    rec_cls = {}
    for r in records:
        rec_cls.setdefault(r['k'], [0, 0, 0])[r['classification']] += 1
    if sample is None:
        check(checks, '(c) per-k outputs 0/1/2 recomputed equal Table finite:results (09-finite-results.tex:17-31)',
              cls_count == tab_res and len(tab_res) == 13, json.dumps(cls_count))
    else:
        check(checks, '(c) per-k outputs 0/1/2 as recorded equal Table finite:results (sample run: recorded, not recomputed)',
              rec_cls == tab_res and len(tab_res) == 13)
    check(checks, '(c) totals 0 / 3049 / 50 as printed (09-finite-results.tex:31)',
          mt and [int(x) for x in mt.groups()] == [sum(v[c] for v in tab_res.values()) for c in range(3)] == [0, 3049, 50])
    check(checks, '(c) expected-output.txt and summary.json counts equal Table finite:results',
          exp == tab_res and {int(a): b for a, b in summary['counts'].items()} == tab_res)
    m = re.search(r'one record for each\s+of the \$(\d+)\$', impl_tex)
    check(checks, '(c) "one record for each of the 3099 parameter-pattern instances" (10-implementation.tex:92-93)',
          m and int(m.group(1)) == len(records) == total)

    # the paper's worked example (09-finite-rules.tex:119-127)
    ex = Instance(5, 3, [(), (2,)])
    iv = extension_matrix(ex, choice=(0, 2, 0, 4, 0))
    check(checks, 'the worked example: k=5, t=3, P=((),(2)): Q={0,1,4}; x=0,y=2,z=0,w=4,E=empty forbids d=1,2',
          ex.Q == [0, 1, 4] and ex.E == [(1, 4)] and iv == (1, 2), 'Q=%s interval=%s' % (ex.Q, iv))

    full = sample is None
    if not all(c['pass'] for c in checks):
        verdict = 'REFUTED'                 # a published trace, count or instance set fails what the paper states
    else:
        verdict = 'CERTIFIED' if full else 'REFUSED'    # a sampled run is not a decision
    return {'verdict': verdict,
            'value': {'pairs': len(pairs), 'instances': total, 'records_checked': n_rec, 'round_entries_checked': rounds_checked,
                      'initial_flags_equal': init_eq, 'witness_weights_equal_bound': weights_exact,
                      'outputs_by_k': cls_count, 'failing': bad[:10], 'trace_seconds': round(elapsed, 1),
                      'sample': None if full else n_rec},
            'checks': checks, 'sources': src.read,
            'decides': ('a finite component: the %d published deduction traces of Proposition finite:verified exclude all '
                        '3099 (pattern, k, t) instances by the paper\'s stated rules, applied correctly (the rules\' '
                        'soundness and the reduction of R(C_m,K_n) to these instances are the paper\'s, not decided here)'
                        % len(records)) + ('' if full else ' -- SAMPLE RUN, not a decision')}


# ---------------------------------------------------------------- forges

def forge():
    """each must NOT certify; each is checked on the forged record(s) only, with the domain in full"""
    src = Sources()
    base = load_records(src)
    out = []

    def run(desc, records, idx):
        r = decide(src=src, records=records, sample=set(idx))
        bad = any(not c['pass'] for c in r['checks'])
        out.append((desc, r['verdict'] if bad else 'CERTIFIED (forge undetected!)'))

    recs = list(base)
    # 1. an unjustified initial flag: forbid the edge between two clique vertices of the first record
    i = 0
    r = json.loads(json.dumps(base[i]))
    r['initial'] = [[x, y, f | 1] if (x, y) == (0, 1) else [x, y, f] for x, y, f in r['initial']]
    recs1 = list(recs)
    recs1[i] = r
    run('record 0: parameter 0 (no edge) added to the clique pair (0,1) of the initial flags', recs1, [i])
    # 2. a final witness with one weight raised past its certified bound
    r = json.loads(json.dumps(base[1]))
    o = r['final']['options'][0]
    o[2] += 1
    r['final']['weight'] += 1
    recs2 = list(recs)
    recs2[1] = r
    run('record 1: final witness weight of option %r raised by one (total adjusted)' % (base[1]['final']['options'][0],), recs2, [1])
    # 3. drop the last round of a record with several rounds: its final witness must then lose a needed prohibition
    j = next(n for n, x in enumerate(base) if len(x['rounds']) >= 2)
    r = json.loads(json.dumps(base[j]))
    r['rounds'] = r['rounds'][:-1]
    recs3 = list(recs)
    recs3[j] = r
    run('record %d (k=%d,t=%d,pattern=%s): last round of prohibitions removed' % (j, base[j]['k'], base[j]['t'], base[j]['pattern']), recs3, [j])
    # 4. a round entry whose d is moved to a parameter its witness does not justify
    r = json.loads(json.dumps(base[j]))
    ent = r['rounds'][0][0]
    ent['d'] = 1 - ent['d']
    recs4 = list(recs)
    recs4[j] = r
    run('record %d: the first round entry\'s parameter d flipped' % j, recs4, [j])
    # 5. the domain: one record deleted
    recs5 = recs[:-1]
    run('the last record (k=17) deleted from the file', recs5, [])
    # 6. the domain: a duplicate replaces a record
    recs6 = list(recs)
    recs6[5] = recs[4]
    run('record 5 replaced by a copy of record 4', recs6, [4, 5])
    return out


if __name__ == '__main__':
    t_start = time.time()
    if '--sample' in sys.argv:
        a = sys.argv.index('--sample')
        step = int(sys.argv[a + 1]) if len(sys.argv) > a + 1 and sys.argv[a + 1].isdigit() else 50
        res = decide(sample=set(range(0, 3099, step)))
    else:
        res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t_start))
    if '--no-forge' not in sys.argv:
        t1 = time.time()
        for desc, v in forge():
            print('FORGE', v, '-', desc)
        print('forges %.1fs' % (time.time() - t1))
