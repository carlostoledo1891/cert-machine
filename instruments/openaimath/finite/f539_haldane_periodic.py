"""F-539 — "The periodic spin-one Haldane gap" (openai/math family 268).

THE CLAIM (build/introduction.tex:37-53, Theorem thm:main): for H_L = sum_j S_j . S_{j+1} on the even periodic ring,
"the ground state is unique for every even L >= 60, and gamma_L > (4/105) log(80/79) for every even L >= 60,
gamma_L > log(20)/784 for every even L >= 2304. Consequently Delta_1 >= log(20)/784 > 0."

The proof (assembly.tex:8-37) feeds two finite initializations into an analytic purity bootstrap (prop:bootstrap):
 (A) lem:thermal-inputs (initialization.tex:26-54): centres of the shifted twisted partition functions
     Z_n(b,g) = Tr exp[-b(H_n(g) + a n I)], a = 700741/500000 — at b = 21/2 (n = 6,8,10; g = 1,P,C; |error| < 1e-5)
     and b = 49/4 (n = 4..12; g = 1,P; |error| < 30e-6) — proved by integer Poisson-Horner recurrences whose exact
     totals are printed (t_{n,g}, thermal120.tex:182-196; W_{n,g}, thermal72.tex:184-195) and turned into rational
     enclosures (eq:thermal120-rational-enclosure, thermal120.tex:209-214; eq:thermal72-enclosure, thermal72.tex:211-217);
 (B) lem:trial-inputs (trials.tex:211-218): E_0(72) < -72a and E_0(120) < -120a, from one integer MPS triple
     (D = 26, Tables tab:trial-diagonal :84-92 and tab:trial-pairs :94-108, entry rule eq:trial-entry :127-137)
     contracted exactly (eq:trial-integer-results :186-195, the integers c_N);
 (C) the scalar chains of prop:seed60 (initialization.tex:118-264), prop:seed2304 (:268-373) and the parameter
     inequalities of eq:bootstrap-parameters (bootstrap.tex:259-284).

WHAT IS DECIDED HERE, AND HOW (Python integers and Fractions only; nothing from the release is imported or run):
 * (B) the three 26 x 26 integer matrices A_s are built from the paper's tables and entry rule (and must equal the
   released matrix-data.json); T = sum A_s (x) A_s and the bond insertion O are formed, split into the eleven d-e
   blocks (dimensions printed in eq:trial-blocks), and U_N = Tr T^{N-2} O, V_N = Tr T^N are computed EXACTLY for
   N = 72, 120 (binary powering of integer block matrices). Checked: equality with the full integers in
   certificate72/120.json, the printed c_N windows, and 500000 U_N + 700741 V_N < 0 (so U_N/V_N < -a). The
   contraction lemma itself (norm = V_N, energy = N U_N) is re-derived a second way for N = 4, 5, 6 by building
   psi_N amplitude by amplitude and applying the periodic Heisenberg Hamiltonian directly.
 * (A) the paper's own integer algorithms are re-implemented from the LaTeX (words, orbit representatives and
   multiplicities, the integer matrices D = 32R and B = 16W with their seam phases, the floored Horner recurrences
   with c_j = floor(Q p_j), and Z[omega] arithmetic for the cyclic twist) using packed 64-bit lanes in Python big
   integers (the floor of each lane is exact by the bias/shift/mask identity of thermal120.tex:148-167; every lane
   value is bounded a priori by the paper's induction, re-checked here as exact integer inequalities). The totals
   t_{n,g} (all nine) and W_{n,g} (n <= nmax49, default 11) are recomputed and compared EXACTLY with the printed
   integers and block by block with the released sectors.jsonl. The error analysis (Fox-Glynn conditioning tail,
   floor errors, Frobenius comparison) is restated and every constant in it is checked as an exact inequality; the
   rational enclosures are evaluated with exact Fractions, and every printed centre is checked inside them.
 * (C) every scalar comparison printed in prop:seed60, prop:seed2304 and eq:bootstrap-parameters is re-evaluated
   exactly from the printed thermal table (sector inversion, the two pairs of polynomial filters and their
   monotonicity identities, the capped-mass bounds, the R(t) table, the purity bounds, p_0 and q_0, the six
   rounded coupled updates — each table entry recomputed exactly — and G(1/8), 45000/9409, 48/79, 60/97). The two
   final gap constants are enclosed rigorously: log via atanh series with a proved geometric tail.
 * The energy lemma's finite part (lem:energy, model.tex:126-164): the bond h has minimal polynomial
   (h-1)(h+1)(h+2) and the weighted row sums of -h12-h23 in Cartesian coordinates obey the printed table.

WHAT IS NOT DECIDED HERE:
 * W_{12,1} and W_{12,P} (b = 49/4, 3^12 = 531,441 states) are not recomputed by default: the clean-room Python
   recurrence costs about 2 CPU-hours per twist on this laptop (measured live per run; see value['refused']).
   Their enclosures are checked only as arithmetic FROM THE PRINTED W (conditional), so a default run is REFUSED
   on that cost even when every check passes. decide(nmax49=12) runs them (multiprocess) and can CERTIFY.
 * The whole analytic argument: the spatial transfer operator (prop:transfer), the sector decomposition
   (lem:sectors), the purity/squaring lemma, the coupled update and the bootstrap (prop:bootstrap), the polynomial
   filter and capped-mass lemmas (their scalar instances are checked, not the lemmas), the Fox-Glynn conditioning
   estimate and the contraction argument for the Horner error (their constants are checked, not their proofs),
   the energy lemma's similarity/triad argument beyond its finite table, the variational principle, and the
   uniqueness/gap conclusions. A CERTIFIED here says: the finite inputs printed by the paper are exactly right.
"""
import itertools
import json
import math
import os
import struct
import sys
import time
from fractions import Fraction
from operator import mul

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/The-periodic-spin-one-Haldane-gap-September-24-2026'
BLD = DIR + '/build/'
INTRO, MODEL, BOOT, INIT, ASSEM = (BLD + f for f in ('introduction.tex', 'model.tex', 'bootstrap.tex', 'initialization.tex', 'assembly.tex'))
T72, T120, TRI = BLD + 'thermal72.tex', BLD + 'thermal120.tex', BLD + 'trials.tex'
EV = DIR + '/verification/computations/evidence/'
MATDATA, CERT72, CERT120, EXACT4 = (EV + 'trials/' + f for f in ('matrix-data.json', 'certificate72.json', 'certificate120.json', 'exact-checks.json'))
SECTORS = EV + 'source1/thermal-run/sectors.jsonl'
S2SUM = EV + 'source2/runs/summary.json'

A_SHIFT = Fraction(700741, 500000)
F = Fraction


def norm(s):
    return ''.join(s.split())


def lit(tex, s):
    """the literal LaTeX string s occurs in tex (whitespace-insensitive)"""
    return norm(s) in norm(tex)


# ----------------------------------------------------------------------------------------------- exact scalar tools
def exp_bounds(x, K=None):
    """rigorous e^x for rational x: partial sum to K plus tail <= 2 x^(K+1)/(K+1)! when K + 2 >= 2|x| (consecutive
    omitted terms then have ratio <= 1/2); negative x by reciprocals"""
    x = F(x)
    if x < 0:
        lo, hi = exp_bounds(-x, K)
        return 1 / hi, 1 / lo
    if K is None:
        K = max(30, int(2 * x) + 40)
    assert K + 2 >= 2 * x
    s, term = F(0), F(1)
    for j in range(K + 1):
        s += term
        term = term * x / (j + 1)
    return s, s + 2 * term


def atanh_bounds(z, K=60):
    """0 < z < 1 rational: atanh z = sum z^(2k+1)/(2k+1); tail after K terms <= z^(2K+3) / ((2K+3)(1 - z^2))"""
    z = F(z)
    s = sum(z ** (2 * k + 1) / (2 * k + 1) for k in range(K + 1))
    return s, s + z ** (2 * K + 3) / ((2 * K + 3) * (1 - z * z))


def log_bounds(y):
    """log of a rational y > 1 from log 2 = 2 atanh(1/3), log(5/4) = 2 atanh(1/9) and log(y/2^k 5^m) by atanh"""
    y = F(y)
    l2 = tuple(2 * v for v in atanh_bounds(F(1, 3)))
    l54 = tuple(2 * v for v in atanh_bounds(F(1, 9)))
    if y == 20:
        return 4 * l2[0] + l54[0], 4 * l2[1] + l54[1]          # 20 = 2^4 * (5/4)
    if y == 10:
        return 3 * l2[0] + l54[0], 3 * l2[1] + l54[1]          # 10 = 2^3 * (5/4)
    z = (y - 1) / (y + 1)
    a = atanh_bounds(z, 200)
    return 2 * a[0], 2 * a[1]


def dec(x, k=12):
    """a printed decimal of a Fraction (display only)"""
    x = F(x)
    sgn = '-' if x < 0 else ''
    x = abs(x)
    q = x.numerator * 10 ** k // x.denominator
    return '%s%d.%0*d' % (sgn, q // 10 ** k, k, q % 10 ** k)


def ceil7(x):
    return F(-((-x.numerator * 10 ** 7) // x.denominator), 10 ** 7)


def f_sq(u):
    return u * u / (2 * (1 - u) ** 2)


def capped(m, h, r):
    """C(m,h,r) = q h^r + (m - q h)^r, q = floor(m/h)  (eq:capped-function)"""
    q = m.numerator * h.denominator // (m.denominator * h.numerator)
    return q * h ** r + (m - q * h) ** r


def poly_eval(coeffs, x):
    """coeffs[j] is the coefficient of x^j"""
    s = F(0)
    for c in reversed(coeffs):
        s = s * x + c
    return s


def poly_mul(p, q):
    r = [0] * (len(p) + len(q) - 1)
    for i, a in enumerate(p):
        for j, b in enumerate(q):
            r[i + j] += a * b
    return r


# ----------------------------------------------------------------------------------------------- printed values
def printed(src):
    """every number the decider compares against, read from the LaTeX"""
    import re
    P = {}
    ini = src.text(INIT)
    lines = ini.split('\n')[31:53]                      # initialization.tex:32-53, the two thermal arrays
    c21, c49 = {}, {}
    for ln in lines:
        m = re.match(r'^\s*(\d+)&(\d+)&(\d+)(?:&(\d+))?\s*(?:\\\\)?\s*$', ln)
        if m:
            n = int(m.group(1))
            if m.group(4) is not None:
                c21[n] = {'1': int(m.group(2)), 'P': int(m.group(3)), 'C': int(m.group(4))}
            else:
                c49[n] = {'1': int(m.group(2)), 'P': int(m.group(3))}
    P['c21'], P['c49'] = c21, c49
    t72 = src.text(T72)
    P['W'] = {int(n): {'1': int(a), 'P': int(b)} for n, a, b in re.findall(r'^(\d+)&(\d+)&(\d+)(?:\\\\)?\s*$', t72, re.M)}
    t120 = src.text(T120)
    tt = {}
    for n, g, v in re.findall(r'^(\d+)&\$(1|P|C)\$&(\d+)\\\\', t120, re.M):
        tt.setdefault(int(n), {})[g] = int(v)
    P['t'] = tt
    tri = src.text(TRI)
    m = re.search(r'\$D_\\alpha\$((?:&\$?-?\d+\$?){8})', tri)
    P['diag'] = [int(x) for x in re.findall(r'-?\d+', m.group(1))] if m else None
    sec = tri[tri.find('\\label{tab:trial-diagonal}'):tri.find('\\label{tab:trial-pairs}')]
    P['pairs'] = {(int(a), int(b)): int(v) for a, b, v in re.findall(r'\$\((\d),(\d)\)\$&\$?(-?\d+)\$?', sec)}
    m = re.search(r'\(\\ell_1,\\ldots,\\ell_8\)=\(([\d,]+)\)', tri)
    P['ell'] = [int(x) for x in m.group(1).split(',')] if m else None
    P['cN'] = {int(n): int(c) for n, c in re.findall(r'^\s*(72|120)&(\d+)', tri, re.M)}
    m = re.search(r'\\text\{dimension\}((?:&\d+){11})', tri)
    P['blockdims'] = [int(x) for x in m.group(1).strip('&').split('&')] if m else None
    upd = {}
    for j, a, b, c, d in re.findall(r'^\s*(\d)&(\d+)/(\d+)&(\d+)/(\d+)\\?\\?\s*$', ini, re.M):
        upd[int(j)] = (F(int(a), int(b)), F(int(c), int(d)))
    P['updates'] = upd
    return P


# ----------------------------------------------------------------------------------------------- (B) the trial MPS
def trial_matrices(ell, diag, pairs):
    """the paper's entry rule (eq:trial-support, eq:trial-entry) for A_s, s = -1, 0, 1"""
    labels = [(al, d) for al in range(1, 9) for d in range(-ell[al - 1], ell[al - 1] + 1, 2)]
    D = len(labels)
    A = {}
    for s in (-1, 0, 1):
        M = [[0] * D for _ in range(D)]
        for i, (al, d) in enumerate(labels):
            l = ell[al - 1]
            r = (d + l) // 2
            for j, (be, e) in enumerate(labels):
                k = ell[be - 1]
                if e != d + 2 * s or abs(k - l) > 2 or (k == l and al != be):
                    continue
                if k == l:
                    p, f = diag[al - 1], {-1: 2 * (l - r + 1), 0: d, 1: -(r + 1)}[s]
                elif k == l + 2:
                    p, f = pairs[(al, be)], {-1: 2 * (l + 1 - r) * (l + 2 - r), 0: 2 * (r + 1) * (l - r + 1), 1: (r + 1) * (r + 2)}[s]
                else:
                    p, f = -pairs[(be, al)], {-1: 2, 0: -2, 1: 1}[s]
                M[i][j] = p * f
        A[s] = M
    return labels, A


def mm(X, Y):
    Yt = list(zip(*Y))
    return [[sum(map(mul, r, c)) for c in Yt] for r in X]


def mpow(M, e):
    R, base = None, M
    while e:
        if e & 1:
            R = base if R is None else mm(R, base)
        e >>= 1
        if e:
            base = mm(base, base)
    return R


def transfer_terms(A):
    B = {(s, t): mm(A[s], A[t]) for s in (-1, 0, 1) for t in (-1, 0, 1)}
    Tt = [(1, A[s], A[s]) for s in (-1, 0, 1)]
    Ot = [(s * t, B[(s, t)], B[(s, t)]) for s in (-1, 0, 1) for t in (-1, 0, 1) if s * t]
    for s in (-1, 0):
        for t in (0, 1):
            Ot.append((1, B[(s, t)], B[(s + 1, t - 1)]))
            Ot.append((1, B[(s + 1, t - 1)], B[(s, t)]))
    return Tt, Ot


def kron_block(idx, terms):
    return [[sum(c * X[p[0]][q[0]] * Y[p[1]][q[1]] for c, X, Y in terms) for q in idx] for p in idx]


def trial_blocks(labels):
    dl = [d for _, d in labels]
    blocks = {}
    for i in range(len(labels)):
        for j in range(len(labels)):
            blocks.setdefault(dl[i] - dl[j], []).append((i, j))
    return blocks


def trial_contract(A, labels, Ns=(72, 120)):
    """U_N = Tr T^(N-2) O and V_N = Tr T^N, exactly, block by block; also checks that T and O preserve d - e"""
    Tt, Ot = transfer_terms(A)
    blocks = trial_blocks(labels)
    D = len(labels)
    # exhaustiveness: no entry of T or O joins two different d-e blocks (checked on the full 676 x 676 support)
    dl = [d for _, d in labels]
    leak = 0
    for s in (-1, 0, 1):
        for i in range(D):
            for j in range(D):
                if A[s][i][j] and dl[j] - dl[i] != 2 * s:
                    leak += 1
    out = {N: [0, 0] for N in Ns}
    per = {N: {} for N in Ns}
    for delta in sorted(blocks):
        idx = blocks[delta]
        T = kron_block(idx, Tt)
        O = kron_block(idx, Ot)
        T2 = mm(T, T)
        for N in Ns:
            Pm = mpow(T, N - 2)
            k = len(idx)
            u = sum(Pm[i][j] * O[j][i] for i in range(k) for j in range(k))
            v = sum(Pm[i][j] * T2[j][i] for i in range(k) for j in range(k))
            out[N][0] += u
            out[N][1] += v
            per[N][delta] = (u, v)
    return {N: tuple(v) for N, v in out.items()}, {d: len(v) for d, v in blocks.items()}, leak, per


def trial_direct(A, N):
    """second derivation for small N: psi_N(s) = Tr(A_s0 ... A_sN-1) amplitude by amplitude, then <psi,psi> and
    <psi, H_N psi> with H_N = sum over the N periodic bonds of S^z S^z + (S^+ S^- + S^- S^+)/2 (entries 1)"""
    D = len(A[0])

    def prods(k):
        out = {(): None}
        for _ in range(k):
            nxt = {}
            for wd, M in out.items():
                for s in (-1, 0, 1):
                    nxt[wd + (s,)] = A[s] if M is None else mm(M, A[s])
            out = nxt
        return out
    pre, suf = prods(N - N // 2), prods(N // 2)
    amp = {}
    for wp, Mp in pre.items():
        for ws, Ms in suf.items():
            amp[wp + ws] = sum(Mp[i][j] * Ms[j][i] for i in range(D) for j in range(D))
    norm2 = sum(v * v for v in amp.values())
    energy = 0
    for word, v in amp.items():
        if not v:
            continue
        for i in range(N):
            j = (i + 1) % N
            a, b = word[i], word[j]
            hv = a * b * v                                          # diagonal
            for d in (1, -1):                                       # (a,b) -> (a+d, b-d)
                if -1 <= a + d <= 1 and -1 <= b - d <= 1:
                    w2 = list(word)
                    w2[i], w2[j] = a + d, b - d
                    hv += amp[tuple(w2)]                            # <word|h|w2> = 1, h symmetric
            energy += v * hv
    return norm2, energy


# ----------------------------------------------------------------------------------------------- (A) thermal engine
# scheme '72': b = 49/4, J = 280, Q = 2^55, D = 32R (thermal72.tex:19-31, :73-82); twists '1' (theta=0) and 'P' (pi).
# scheme '120': b = 21/2, J = 256, Q = 2^56, B = 16W (thermal120.tex:17-38, :94-111); twists '1', 'P', 'C' (2pi/3).
SCHEMES = {'72': {'b': F(49, 4), 'J': 280, 'Q': 2 ** 55, 'mean': 98, 'shift': 5},
           '120': {'b': F(21, 2), 'J': 256, 'Q': 2 ** 56, 'mean': 84, 'shift': 4}}
LANE = 64


def poisson_coeffs(scheme):
    S = SCHEMES[scheme]
    J, mean, Q = S['J'], S['mean'], S['Q']
    fJ = math.factorial(J)
    v = [mean ** j * (fJ // math.factorial(j)) for j in range(J + 1)]       # = mean^j J!/j!, proportional to p_j
    tot = sum(v)
    return [Q * vj // tot for vj in v]                                       # floor(Q p_j)


def words_by_weight(n):
    out = {}
    for t in itertools.product((-1, 0, 1), repeat=n):                         # lexicographic order
        out.setdefault(sum(t), []).append(t)
    return out


def block_structure(words, n):
    """S(x) = sum_i x_{i-1} x_i (cyclic), plain hops (bonds (i-1,i), i = 1..n-1) and seam hops (bond (n-1,0)) with
    delta = y_0 - x_0, for the step x -> y changing letters i-1, i by (+d, -d)"""
    idx = {x: k for k, x in enumerate(words)}
    S, plain, seam_p, seam_m = [], [], [], []
    for x in words:
        S.append(sum(x[i - 1] * x[i] for i in range(n)))
        pl, sp, sm = [], [], []
        for i in range(n):
            a, b = x[i - 1], x[i]
            for d in (1, -1):
                if -1 <= a + d <= 1 and -1 <= b - d <= 1:
                    y = list(x)
                    y[i - 1], y[i] = a + d, b - d
                    k = idx[tuple(y)]
                    if i == 0:                                       # seam: x_{n-1} -> +d, x_0 -> -d
                        (sp if (-d) == 1 else sm).append(k)          # delta = y_0 - x_0 = -d
                    else:
                        pl.append(k)
        plain.append(tuple(pl))
        seam_p.append(tuple(sp))
        seam_m.append(tuple(sm))
    return idx, S, plain, seam_p, seam_m


def orbit_reps(words, n, negate):
    """lexicographically least word of each orbit under rotations and reversal (and digit negation if asked),
    with the orbit size"""
    seen, reps = set(), []
    for x in words:
        if x in seen:
            continue
        orb = set()
        for q in range(n):
            r = x[q:] + x[:q]
            for z in (r, r[::-1]):
                orb.add(z)
                if negate:
                    orb.add(tuple(-c for c in z))
        seen |= orb
        reps.append((min(orb), len(orb)))
    return reps


def block_jobs(scheme, n, twist, lane_batch=512):
    """the work list for one (scheme, n, twist): one job per nonnegative weight block and lane batch"""
    jobs = []
    W = words_by_weight(n)
    for w in range(0, n + 1):
        reps = orbit_reps(W[w], n, negate=(scheme == '72' and w == 0))
        for a in range(0, len(reps), lane_batch):
            jobs.append((scheme, n, twist, w, a, min(a + lane_batch, len(reps)), len(W[w]) * min(lane_batch, len(reps) - a)))
    return jobs


def run_job(job, steps=None):
    """the floored Horner recurrence on a batch of representative columns, packed one lane per column.
    Returns (scheme, n, twist, w, a, sum over lanes of multiplicity * squared column norm, lanes, rows, seconds)."""
    scheme, n, twist, w, a, b = job[:6]
    t0 = time.time()
    S_ = SCHEMES[scheme]
    words = words_by_weight(n)[w]
    idx, S, plain, seam_p, seam_m = block_structure(words, n)
    reps = orbit_reps(words, n, negate=(scheme == '72' and w == 0))[a:b]
    L = len(reps)
    d = len(words)
    sh = S_['shift']
    ONES = sum(1 << (LANE * t) for t in range(L))
    BIAS = ONES << (LANE - 1)
    MASK = ((1 << (LANE - sh)) - 1) * ONES
    OFF = ONES << (LANE - 1 - sh)
    E = [0] * d
    mult = []
    for t, (r, size) in enumerate(reps):
        E[idx[r]] |= 1 << (LANE * t)
        mult.append(size * (2 if w > 0 else 1))
    coeffs = poisson_coeffs(scheme)
    top = max(j for j, c in enumerate(coeffs) if c)
    if scheme == '72':
        dg = [32 - 3 * n - 2 * s for s in S]                  # D_ww = 32 - 3n - 2 sum w_{i-1} w_i
        cp, cs = -2, (-2 if twist == '1' else 2)              # hop -2, twisted seam +2
    else:
        dg = [16 - (3 * n) // 2 - s for s in S]               # B_xx = 16 - 3n/2 - sum x_{j-1} x_j (n even)
        cp, cs = -1, (-1 if twist == '1' else 1)              # hop -1, seam -e^{i theta delta}: theta = pi gives +1
    rows = range(d)
    seam = [sp + sm for sp, sm in zip(seam_p, seam_m)]
    # run-time lane window: every lane of every stage must lie in [-2^wexp, 2^wexp); with the row sums below this keeps
    # every lane of B X (or D X) inside (-2^63, 2^63), which is what makes the packed floor exact at the next stage
    wexp = 56 if scheme == '72' else 57
    if scheme == '72':
        rowsum = max(abs(dg[x]) + 2 * (len(plain[x]) + len(seam[x])) for x in rows)
    elif twist != 'C':
        rowsum = max(abs(dg[x]) + len(plain[x]) + len(seam[x]) for x in rows)
    else:
        rowsum = max(abs(dg[x]) + len(plain[x]) + 2 * len(seam[x]) for x in rows)
    WIN = (1 << wexp) * ONES
    HIGHM = ((1 << LANE) - (1 << (wexp + 1))) * ONES
    bad = 0
    js = list(range(top, -1, -1))
    if steps is not None:                     # cost measurement: full-width pseudo-random lanes, time the loop only
        js = js[:steps]
        import random
        rnd = random.Random(1)
        M54, H53 = ((1 << 54) - 1) * ONES, (1 << 53) * ONES
        X0 = [(rnd.getrandbits(LANE * L) & M54) - H53 for _ in range(d)]
        t0 = time.time()
    if twist != 'C':
        X = [0] * d if steps is None else X0
        for j in js:
            cj = coeffs[j]
            g = X.__getitem__
            Y = [0] * d
            for x in rows:
                y = dg[x] * X[x] + cp * sum(map(g, plain[x])) + cs * sum(map(g, seam[x]))
                v = (((y + BIAS) >> sh) & MASK) - OFF
                if E[x]:
                    v += cj * E[x]
                c_ = v + WIN
                if c_ < 0 or c_ & HIGHM:
                    bad += 1
                Y[x] = v
            X = Y
        comps = [X]
    else:
        # Z[omega] coordinates u + v omega; seam entry -omega^delta: delta = +1: (u,v) -> (v, v - u); delta = -1: (u - v, u)
        Xu, Xv = [0] * d, [0] * d
        for j in js:
            cj = coeffs[j]
            gu, gv = Xu.__getitem__, Xv.__getitem__
            Yu, Yv = [0] * d, [0] * d
            for x in rows:
                pu, pv = sum(map(gu, plain[x])), sum(map(gv, plain[x]))
                spu, spv = sum(map(gu, seam_p[x])), sum(map(gv, seam_p[x]))
                smu, smv = sum(map(gu, seam_m[x])), sum(map(gv, seam_m[x]))
                yu = dg[x] * Xu[x] - pu + spv + (smu - smv)
                yv = dg[x] * Xv[x] - pv + (spv - spu) + smu
                u = (((yu + BIAS) >> sh) & MASK) - OFF
                if E[x]:
                    u += cj * E[x]
                v = (((yv + BIAS) >> sh) & MASK) - OFF
                c_, c2 = u + WIN, v + WIN
                if c_ < 0 or c2 < 0 or c_ & HIGHM or c2 & HIGHM:
                    bad += 1
                Yu[x] = u
                Yv[x] = v
            Xu, Xv = Yu, Yv
        comps = [Xu, Xv]
    if steps is not None:
        return time.time() - t0
    # unpack every lane exactly (final coordinates satisfy |x| < 2Q < 2^63) and sum squared norms
    half = 1 << (LANE - 1)
    fmt = '<%dQ' % L
    acc = [0] * L
    lane_max = 0
    for x in rows:
        vals = [[v - half for v in struct.unpack(fmt, (c[x] + BIAS).to_bytes(8 * L, 'little'))] for c in comps]
        if len(vals) == 1:
            for t, v in enumerate(vals[0]):
                acc[t] += v * v
                if abs(v) > lane_max:
                    lane_max = abs(v)
        else:
            for t, (u, v) in enumerate(zip(vals[0], vals[1])):
                acc[t] += u * u - u * v + v * v                    # |u + v omega|^2
                lane_max = max(lane_max, abs(u), abs(v))
    total = sum(m * s for m, s in zip(mult, acc))
    return (scheme, n, twist, w, a, total, L, d, lane_max, time.time() - t0, bad, rowsum)


def run_all(cases, workers=3, lane_batch=512, log=None):
    """cases: list of (scheme, n, twist). Returns {(scheme,n,twist): {'total', 'blocks': {w: W_w}, 'cpu_s', 'lane_max'}}"""
    jobs = []
    for sc, n, tw in cases:
        jobs += block_jobs(sc, n, tw, lane_batch)
    jobs.sort(key=lambda j: -j[6])
    res = {c: {'total': 0, 'blocks': {}, 'cpu_s': 0.0, 'lane_max': 0, 'bad': 0, 'rowsum': 0} for c in cases}
    if workers and workers > 1 and len(jobs) > 1:
        import multiprocessing as mp
        with mp.get_context('spawn').Pool(workers) as pool:
            outs = pool.imap_unordered(run_job, jobs)
            for o in outs:
                _collect(res, o, log)
    else:
        for j in jobs:
            _collect(res, run_job(j), log)
    return res


def _collect(res, o, log):
    sc, n, tw, w, a, total, L, d, lmax, sec, bad, rowsum = o
    r = res[(sc, n, tw)]
    r['bad'] += bad
    r['rowsum'] = max(r['rowsum'], rowsum)
    r['total'] += total
    r['blocks'][w] = r['blocks'].get(w, 0) + total
    r['cpu_s'] += sec
    r['lane_max'] = max(r['lane_max'], lmax)
    if log:
        log('  thermal %s n=%d %s weight %d lanes %d..%d (%d rows): %.1fs' % (sc, n, tw, w, a, a + L, d, sec))


def measure_cost(scheme, n, twist, lane_batch=512, steps=2):
    """time `steps` full-width Horner steps of the largest job of (scheme, n, twist) and extrapolate linearly in
    rows x lanes x steps over all its jobs (the unpacking and block construction are not included)"""
    jobs = block_jobs(scheme, n, twist, lane_batch)
    big = max(jobs, key=lambda j: j[6])
    sec = run_job(big, steps=steps)
    top = max(j for j, c in enumerate(poisson_coeffs(scheme)) if c)
    per = sec / steps / big[6]
    total = per * sum(j[6] for j in jobs) * (top + 1)
    return {'case': '%s n=%d twist %s' % (scheme, n, twist), 'largest_job_rows_x_lanes': big[6], 'seconds_for_%d_steps' % steps: round(sec, 2),
            'steps': top + 1, 'estimated_cpu_seconds_per_twist': round(total), 'estimated_cpu_hours_both_twists': round(2 * total / 3600, 2),
            'memory_per_job_MB': round(2 * big[6] * 8 / 2 ** 20)}


def symmetry_checks(checks, nmax=8):
    """the representative reduction rests on three symmetries of H_n(g) (thermal72.tex:144-155, thermal120.tex:40-51).
    Entries are kept as {(x,y): (coefficient, k)} meaning coefficient * e^{i theta k}; with theta = 2 pi/m the phase
    is k mod m (m = 1, 2, 3 for theta = 0, pi, 2pi/3). Checked exactly for n = 4..nmax:
    the phased shift V|x> = e^{-i theta x_{n-1}}|s(x)> commutes with H (H_{s(x),s(y)} = e^{i theta (y_{n-1}-x_{n-1})} H_{x,y}),
    and reversal and negation each map H to its complex conjugate."""
    ok = True
    for n in range(4, nmax + 1):
        for m in (1, 2, 3):
            Hm = {}
            for x in itertools.product((-1, 0, 1), repeat=n):
                Hm[(x, x)] = (sum(x[i - 1] * x[i] for i in range(n)), 0)
                for i in range(n):
                    a, b = x[i - 1], x[i]
                    for d in (1, -1):
                        if -1 <= a + d <= 1 and -1 <= b - d <= 1:
                            y = list(x)
                            y[i - 1], y[i] = a + d, b - d
                            y = tuple(y)
                            # H_{y,x}: row y, column x; seam (i = 0) phase e^{i theta (x_0 - y_0)}
                            Hm[(y, x)] = (1, ((x[0] - y[0]) % m) if i == 0 else 0)
            for (x, y), (c, k) in Hm.items():
                sx, sy = (x[-1],) + x[:-1], (y[-1],) + y[:-1]
                c2, k2 = Hm.get((sx, sy), (0, 0))
                if c2 != c or (k2 - k - (y[-1] - x[-1])) % m:
                    ok = False
                rx, ry = x[::-1], y[::-1]
                c3, k3 = Hm.get((rx, ry), (0, 0))
                if c3 != c or (k3 + k) % m:
                    ok = False
                nx, ny = tuple(-v for v in x), tuple(-v for v in y)
                c4, k4 = Hm.get((nx, ny), (0, 0))
                if c4 != c or (k4 + k) % m:
                    ok = False
    check(checks, 'the symmetries behind the representative reduction, exactly for n = 4..%d and theta = 0, pi, 2pi/3: the phased shift commutes with '
          'H_n(g); reversal and negation map H_n(g) to its complex conjugate (so exact exponential columns have equal norms on orbits)' % nmax, ok)


# ----------------------------------------------------------------------------------------------- energy lemma, finite part
def energy_lemma_checks(checks):
    # weight basis: h = Sz Sz + (S+S- + S-S+)/2, entries: diagonal st, off-diagonal 1 between (s,t) and (s+1,t-1)
    basis = [(s, t) for s in (-1, 0, 1) for t in (-1, 0, 1)]
    h = [[0] * 9 for _ in range(9)]
    for i, (s, t) in enumerate(basis):
        h[i][i] = s * t
        for d in (1, -1):
            if -1 <= s + d <= 1 and -1 <= t - d <= 1:
                h[i][basis.index((s + d, t - d))] = 1
    I9 = [[int(i == j) for j in range(9)] for i in range(9)]

    def add(Am, Bm, c=1):
        return [[x + c * y for x, y in zip(r1, r2)] for r1, r2 in zip(Am, Bm)]
    prod = mm(mm(add(h, I9, -1), add(h, I9, 1)), add(h, I9, 2))
    check(checks, 'lem:energy input: the bond h has minimal polynomial dividing (h-1)(h+1)(h+2), so spec h = {-2,-1,1} and h <= I',
          all(v == 0 for r in prod for v in r) and all(h[i][j] == h[j][i] for i in range(9) for j in range(9)))
    # Cartesian: -h = sum_a G_a (x) G_a, (G_a)_{ij} = eps_{a i j}; T = -h12 - h23 on three sites
    eps = {}
    for p, sg in (((0, 1, 2), 1), ((1, 2, 0), 1), ((2, 0, 1), 1), ((0, 2, 1), -1), ((2, 1, 0), -1), ((1, 0, 2), -1)):
        eps[p] = sg
    G = [[[eps.get((a, i, j), 0) for j in range(3)] for i in range(3)] for a in range(3)]
    mh = [[sum(G[a][i1][j1] * G[a][i2][j2] for a in range(3)) for j1 in range(3) for j2 in range(3)] for i1 in range(3) for i2 in range(3)]
    words = list(itertools.product(range(3), repeat=3))
    T = [[0] * 27 for _ in range(27)]
    for r, (x0, x1, x2) in enumerate(words):
        for c, (y0, y1, y2) in enumerate(words):
            v = 0
            if x2 == y2:
                v += mh[3 * x0 + x1][3 * y0 + y1]
            if x0 == y0:
                v += mh[3 * x1 + x2][3 * y1 + y2]
            T[r][c] = v

    def q(wd):
        a, b, c = wd
        if a == b == c:
            return 4
        if a == b or b == c:
            return 3
        return 2                                             # aba and abc
    ok = all(sum(abs(T[r][c]) * q(words[c]) for c in range(27)) <= 3 * q(words[r]) for r in range(27))
    sums = sorted(set((q(words[r]), sum(abs(T[r][c]) * q(words[c]) for c in range(27))) for r in range(27)))
    check(checks, 'lem:energy table: -h = sum G_a (x) G_a in Cartesian coordinates, T = -h12 - h23 has no diagonal, and every weighted '
          'absolute row sum is <= 3q (so h12 + h23 >= -3I)', ok and all(T[r][r] == 0 for r in range(27)) and sums == [(2, 4), (2, 6), (3, 9), (4, 12)],
          'pattern (q, row sum): %s as printed (aaa 4/12, aab 3/9, aba 2/6, abc 2/4)' % sums)


# ----------------------------------------------------------------------------------------------- (C) scalar chains
def seed60(checks, c21, ini):
    e = F(1, 10 ** 5)
    cen = {n: {g: F(v, 10 ** 6) for g, v in row.items()} for n, row in c21.items()}
    I = {n: (r['1'] + 3 * r['P'] + 8 * r['C']) / 12 for n, r in cen.items()}
    O = {n: (r['1'] + 3 * r['P'] - 4 * r['C']) / 12 for n, r in cen.items()}
    N = {n: (r['1'] - r['P']) / 4 for n, r in cen.items()}
    mI, mO, mN = F(1042655, 10 ** 6), F(40041, 10 ** 6), F(401625, 10 ** 6)
    check(checks, 'seed60: m_I, m_O, m_N exceed the sector centres + 1e-5 by exactly 19/(12e6), 7/(12e6), 3/(4e6) (initialization.tex:134-140)',
          mI - I[10] - e == F(19, 12 * 10 ** 6) and mO - O[10] - e == F(7, 12 * 10 ** 6) and mN - N[10] - e == F(3, 4 * 10 ** 6)
          and lit(ini, 'm_I=\\frac{1042655}{10^6}') and lit(ini, 'm_O=\\frac{40041}{10^6}') and lit(ini, 'm_N=\\frac{401625}{10^6}'))
    U, V = F(100245, 100000), F(88643, 100000)

    def filt(c0, c1, M):
        B = c0 * c0 * M[6] + 2 * c0 * c1 * M[8] + c1 * c1 * M[10] + e * (abs(c0) + abs(c1)) ** 2
        return B, (lambda x: x ** 6 * (c0 + c1 * x * x) ** 2)
    BI, FI = filt(-2, 10, I)
    BN, FN = filt(-25, 100, N)
    check(checks, 'seed60 filters: F_I(U) - B_I > 0.0301, F_N(V) - B_N > 0.3463, and both filters increase beyond (c1 > 0, c0 + c1 x^2 > 0)',
          FI(U) - BI > F(301, 10 ** 4) and FN(V) - BN > F(3463, 10 ** 4) and -2 + 10 * U * U > 0 and -25 + 100 * V * V > 0,
          'margins %s, %s' % (dec(FI(U) - BI, 6), dec(FN(V) - BN, 6)))
    check(checks, 'seed60: U^10 < m_I < 2U^10 and V^10 < m_N < 2V^10', U ** 10 < mI < 2 * U ** 10 and V ** 10 < mN < 2 * V ** 10)

    def ABC(k):
        r = k // 10
        return U ** k + (mI - U ** 10) ** r, mO ** r, V ** k + (mN - V ** 10) ** r
    A30, B30, C30 = ABC(30)
    A120, B120, C120 = ABC(120)
    m, p, q = A30 + 2 * B30 + 3 * C30, A30 + 2 * B30, A120 + 2 * B120 + 3 * C120
    D, E, tau, tau0, Rq = F(1450, 1000), F(1202, 1000), F(1225, 1000), F(1264, 1000), F(684, 10000)
    check(checks, 'seed60 eq:seed60-scalars: m^5 < D^2 (margin > 0.001068), p^5 < E^2 (> 0.000433), q >= 1, (q-1)^5 < R_q^2 (> 0.0000472), '
          '(D+11E)/12 <= tau, (D+3E)/4 <= tau0',
          D * D - m ** 5 > F(1068, 10 ** 6) and E * E - p ** 5 > F(433, 10 ** 6) and q >= 1 and Rq * Rq - (q - 1) ** 5 > F(472, 10 ** 7)
          and (D + 11 * E) / 12 <= tau and (D + 3 * E) / 4 <= tau0,
          'margins %s, %s, %s' % (dec(D * D - m ** 5, 7), dec(E * E - p ** 5, 7), dec(Rq * Rq - (q - 1) ** 5, 8)))
    t88 = F(88, 100)
    check(checks, 'seed60: D (0.88)^3 < 1, 2 (0.88) > D and D > tau0', D * t88 ** 3 < 1 and 2 * t88 > D and D > tau0)

    def R(t):
        verts = [(F(0), F(0)), (tau - t, F(0)), (tau - t, tau0 - tau), (F(0), tau0 - t)]
        return max(x * x + y * y / 2 + (D - t - x - y) ** 2 / 3 for x, y in verts)
    Rt = {t: R(F(t)) for t in ('0.88', '0.99', '0.998')}
    check(checks, 'seed60 R(t) table: R(0.88) = 0.1359, R(0.99) = 0.0721, R(0.998) = 0.068404 exactly',
          Rt['0.88'] == F('0.1359') and Rt['0.99'] == F('0.0721') and Rt['0.998'] == F('0.068404') and lit(ini, 'R(t)&0.1359&0.0721&0.068404'))
    check(checks, 'seed60: 1 - 0.99^4 - R(0.88)^2 = 0.02093518 and 1 - 0.998^4 - R(0.99)^2 = 0.002777621984 exactly',
          1 - F('0.99') ** 4 - Rt['0.88'] ** 2 == F('0.02093518') and 1 - F('0.998') ** 4 - Rt['0.99'] ** 2 == F('0.002777621984'))
    S60 = (1 + Rt['0.998'] / F('0.998') ** 2) ** -2
    T120 = (1 + Rq) ** -2
    check(checks, 'seed60: S(60,105/4) >= (1 + R(0.998)/0.998^2)^-2 > 0.8756 > 7/8 and T(120,105/4) >= (1+R_q)^-2 > 0.8760 > 7/8',
          S60 > F('0.8756') > F(7, 8) and T120 > F('0.8760') > F(7, 8), 'S >= %s, T >= %s' % (dec(S60, 6), dec(T120, 6)))
    return {'m': m, 'p': p, 'q': q, 'S60_lower': S60, 'T120_lower': T120}


def seed2304(checks, c49, ini, upd):
    e = F(30, 10 ** 6)
    cen = {n: {g: F(v, 10 ** 6) for g, v in row.items()} for n, row in c49.items()}
    Jm = {n: (r['1'] + 3 * r['P']) / 4 for n, r in cen.items()}
    Nm = {n: (r['1'] - r['P']) / 4 for n, r in cen.items()}
    Qp = [7, 17, -280, -185, 1000]
    FJc = [0] * 4 + poly_mul(Qp, Qp)                       # x^4 Q(x)^2, degrees 4..12
    QN = [12, 0, -394, 0, 1000]
    FNc = [0] * 4 + poly_mul(QN, QN)
    BJ = sum(F(c) * Jm[j] for j, c in enumerate(FJc) if c) + e * sum(abs(c) for c in FJc)
    BN = sum(F(c) * Nm[j] for j, c in enumerate(FNc) if c) + e * sum(abs(c) for c in FNc)
    check(checks, 'seed2304: the filter bounds are exactly B_J = 318604.54848175 and B_N = 48169.880699 (initialization.tex:291)',
          BJ == F('318604.54848175') and BN == F('48169.880699') and lit(ini, 'B_J=318604.54848175,\\qquad B_N=48169.880699.'),
          'B_J = %s, B_N = %s' % (dec(BJ, 8), dec(BN, 6)))
    vJ, vN = F(100139, 100000), F(872, 1000)
    check(checks, 'seed2304: F_J(v_J) - B_J > 180, F_J(-v_J) - B_J > 496888, F_N(+-v_N) - B_N > 654',
          poly_eval(FJc, vJ) - BJ > 180 and poly_eval(FJc, -vJ) - BJ > 496888 and poly_eval(FNc, vN) - BN > 654 and poly_eval(FNc, -vN) - BN > 654,
          'margins %s, %s, %s' % (dec(poly_eval(FJc, vJ) - BJ, 3), dec(poly_eval(FJc, -vJ) - BJ, 3), dec(poly_eval(FNc, vN) - BN, 3)))
    # Q(1+y) and Q(-1-y) expansions: compare polynomial coefficients exactly (Taylor shift)
    def shift(p, c):
        out = [0] * len(p)
        for k, a in enumerate(p):
            for i in range(k + 1):
                out[i] += a * math.comb(k, i) * c ** (k - i)
        return out
    qp = shift(Qp, 1)
    qm = shift([a * (-1) ** k for k, a in enumerate(Qp)], 1)    # Q(-x) shifted: Q(-(1+y))
    check(checks, 'seed2304: Q(1+y) = 559+2902y+5165y^2+3815y^3+1000y^4 and Q(-1-y) = 895+3978y+6275y^2+4185y^3+1000y^4 (all coefficients > 0)',
          qp == [559, 2902, 5165, 3815, 1000] and qm == [895, 3978, 6275, 4185, 1000], '%s, %s' % (qp, qm))
    check(checks, 'seed2304: 12 - 394 v_N^2 + 1000 v_N^4 > 0 and 1000 v_N^2 - 197 > 0 (F_N increases beyond v_N)',
          12 - 394 * vN ** 2 + 1000 * vN ** 4 > 0 and 1000 * vN ** 2 - 197 > 0)
    mJ, mN = Jm[12] + e, Nm[12] + e
    check(checks, 'seed2304: m_J = J_12 centre + 30e-6 = 1.0657205 and m_N = N_12 centre + 30e-6 = 0.2783155 (exactly)',
          mJ == F('1.0657205') and mN == F('0.2783155') and lit(ini, 'm_J=1.0657205,\\qquad m_N=0.2783155.'))
    ell = F(999, 1000)
    h = vN ** 12

    def Bk(k):
        return 3 * capped(mN, h, k // 12)

    def RA(k):
        return Bk(k) + (mJ - ell ** 12) ** (k // 12)
    z72 = capped(mJ, ell ** 12, 6) + Bk(72)
    check(checks, 'seed2304: m_J > ell^12 and C(m_J, ell^12, 6) + B(72) < 1 with margin > 0.0693', mJ > ell ** 12 and 1 - z72 > F('0.0693'),
          'margin %s' % dec(1 - z72, 6))
    p0 = 1 - (1 + RA(36) / ell ** 36) ** -2
    q0 = 1 - (vJ ** 72 + RA(72)) ** -2
    check(checks, 'seed2304: p_0 < 0.047916 and q_0 < 0.181521 (exact rational p_0, q_0)', p0 < F('0.047916') and q0 < F('0.181521'),
          'p0 = %s, q0 = %s' % (dec(p0, 7), dec(q0, 7)))
    p, q = p0, q0
    rows = {}
    ok_dom = True
    for j in range(1, 7):
        a1 = 1 - (1 - p) ** 2 * (1 - q)
        p = ceil7(f_sq(a1))
        a2 = 1 - (1 - q) ** 2 * (1 - p)
        q = ceil7(f_sq(a2))
        ok_dom = ok_dom and 0 <= a1 < 1 and 0 <= a2 < 1 and 0 <= p < 1 and 0 <= q < 1
        rows[j] = (p, q)
    check(checks, 'seed2304: the six rounded coupled updates reproduce the printed (p_j, q_j) table exactly, all in [0,1)',
          rows == upd and ok_dom, ' '.join('%d:(%s,%s)' % (j, rows[j][0], rows[j][1]) for j in rows))
    check(checks, 'seed2304: 1 - S(2304,784) <= 84513/10^7 < 1/100 and 1 - T(4608,784) <= 27493/(5 10^6) < 1/100 (and 36 * 64 = 2304, 49/4 * 64 = 784)',
          rows[6] == (F(84513, 10 ** 7), F(27493, 5 * 10 ** 6)) and max(rows[6]) < F(1, 100) and 36 * 64 == 2304 and F(49, 4) * 64 == 784)
    check(checks, 'cor:boundary-inputs: 1 - S(72, 49/2) <= 151249/2500000 is the first update row', rows[1][0] == F(151249, 2500000))
    return {'p0': p0, 'q0': q0, 'mJ': mJ, 'mN': mN, 'rows': rows}


def bootstrap_params(checks, boot):
    def G(u):
        s = 1 - u
        return (1 / s + 1 / s ** 2 + 1 / s ** 3) ** 2 / 2
    # the identity f(1-(1-u)^3) = G(u) u^2: both sides times 2(1-u)^6 are polynomials of degree <= 6 in u; equal at 8 points
    pts = [F(k, 17) for k in range(1, 9)]
    ident = all(f_sq(1 - (1 - u) ** 3) == G(u) * u * u for u in pts)
    row1 = G(F(1, 8)) == F(913952, 117649) < F(79, 10) and F(3) / (F(79, 10) * (1 - 3 * F(1, 8))) == F(48, 79) < 1
    u = F(1, 100)
    row2 = G(u) <= F(9) / (2 * (1 - 3 * u) ** 2) == F(45000, 9409) < 5 and F(3) / (5 * (1 - 3 * u)) == F(60, 97) < 1
    check(checks, 'eq:bootstrap-factorization f(1-(1-u)^3) = G(u)u^2 (polynomial identity, checked at 8 points)', ident)
    check(checks, 'bootstrap row 1: G(1/8) = 913952/117649 < 79/10, 3/(C(1-3u0)) = 48/79 < 1, 0 < 1/8 < 1/6, r = 79/80 < 1',
          row1 and F(1, 8) < F(1, 6) and F(79, 10) * F(1, 8) == F(79, 80) and lit(boot, 'G(1/8)=\\frac{913952}{117649}<\\frac{79}{10}'))
    check(checks, 'bootstrap row 2: G(1/100) <= 9/(2(1-3u)^2) = 45000/9409 < 5, 3/(C(1-3u0)) = 60/97 < 1, r = 5/100 = 1/20',
          row2 and 5 * u == F(1, 20) and lit(boot, '\\le\\frac{45000}{9409}<5'))


# ----------------------------------------------------------------------------------------------- thermal enclosures
def enclosure72(n, W, center):
    """eq:thermal72-enclosure, with the paper's s_n, t_n, E_n, cal-E_n"""
    Q = 2 ** 55
    x = SCHEMES['72']['b'] * n * (F(3, 2) - A_SHIFT)
    s = sum(x ** j / math.factorial(j) for j in range(101))
    t = x ** 100 / math.factorial(100)
    dn = math.isqrt(3 ** n) + 1
    En = 281 * (dn + 1) + 1
    cE = dn * En
    r = math.isqrt(W)
    L = s * max(0, r - cE) ** 2 / Q ** 2
    U = (s + t) * (r + 1 + cE) ** 2 / Q ** 2
    C = F(center, 10 ** 6)
    lo_m, hi_m = L - (C - F(30, 10 ** 6)), (C + F(30, 10 ** 6)) - U
    return L, U, lo_m, hi_m, x


def enclosure120(n, t, center):
    Q = 2 ** 56
    x = SCHEMES['120']['b'] * n * (F(3, 2) - A_SHIFT)
    L = sum(x ** j / math.factorial(j) for j in range(101))
    Uu = L + 2 * x ** 101 / math.factorial(101)
    c = F(center, 10 ** 6)
    lo, hi = L * t / Q ** 2, Uu * t / Q ** 2
    return lo, hi, lo - (c - F(2, 10 ** 6)), (c + F(2, 10 ** 6)) - hi, x


def thermal_constants(checks, t72, t120):
    """every constant of the two error analyses, as exact integer/rational inequalities"""
    e_lo, e_hi = exp_bounds(1, 30)
    c72 = poisson_coeffs('72')
    c120 = poisson_coeffs('120')
    top72 = max(j for j, c in enumerate(c72) if c)
    top120 = max(j for j, c in enumerate(c120) if c)
    check(checks, 'thermal72: c_j = floor(Q p_j) vanishes exactly for j > 191; thermal120: q_j vanishes exactly for j > 172',
          top72 == 191 and top120 == 172 and lit(t72, 'vanish for \\(j>191\\)') and lit(t120, 'above $q_{172}$'), 'last nonzero: %d, %d' % (top72, top120))
    Q = 2 ** 55
    # Fox-Glynn tail at mean 98, J = 280: 2 e^-98 sum_{j>=281} 98^j/j! <= 2^-280 e^98 < 2^-84 < 1/Q (e < 4)
    ok72 = e_hi < 4 and F(4) ** 98 / F(2) ** 280 == F(1, 2 ** 84) and F(1, 2 ** 84) < F(1, Q)
    ok72 = ok72 and all(math.isqrt(3 ** n) + 1 <= 730 and Q + 281 * (math.isqrt(3 ** n) + 2) < 2 * Q and abs(32 - 3 * n) + 2 * n + 4 * n <= 76
                        and (math.isqrt(3 ** n) + 1) ** 2 > 3 ** n for n in range(4, 13))
    ok72 = ok72 and 76 * 2 * Q == 5476377146882523136 < 2 ** 63 - 1 and 76 * 2 * Q // 32 + Q == 207165582859042816 < 2 ** 63 - 1
    ok72 = ok72 and all(SCHEMES['72']['b'] * n * (F(3, 2) - A_SHIFT) < 15 for n in range(4, 13)) and F(15, 101) / (1 - F(15, 101)) == F(15, 86)
    check(checks, 'thermal72 error constants: tail 2^-280 e^98 < 2^-84 < 1/Q (e < 4), d_n <= 730 and d_n > sqrt(3^n), Q + 281(d_n+1) < 2Q, '
          'row sums <= 76, 76*2Q = 5476377146882523136 < 2^63 - 1, 76*2Q/32 + Q = 207165582859042816, 0 <= x_n < 15, tail ratio 15/86',
          ok72 and lit(t72, '76\\cdot2Q=5476377146882523136<2^{63}-1') and lit(t72, '+Q=207165582859042816<2^{63}-1'))
    Q2 = 2 ** 56
    ok120 = e_hi < 3 and 3 ** 84 < 2 ** 140 and all(257 * (2 * math.isqrt(3 ** n) + 1) <= 125159 and math.isqrt(3 ** n) ** 2 <= 3 ** n for n in (6, 8, 10))
    ok120 = ok120 and math.isqrt(3 ** 10) == 243 and 3 ** 10 == 243 ** 2
    ok120 = ok120 and 32 * (Q2 + 125159) == 2305843009217699040 < 2 ** 63 and 2 * (Q2 + 125159) < 2 ** 63
    bound = F(3 ** 6 * 243) * (F(125159, Q2) + F(1, 2 ** 116))
    xs = [SCHEMES['120']['b'] * n * (F(3, 2) - A_SHIFT) for n in (6, 8, 10)]
    ok120 = ok120 and bound < F(4, 10 ** 7) and all(0 < x < 12 and x / 2 < 6 for x in xs) and F(12, 102) < F(1, 2)
    ok120 = ok120 and F(2, 10 ** 6) + (8 + F(4, 10 ** 7)) * F(4, 10 ** 7) < F(1, 10 ** 5)
    check(checks, 'thermal120 error constants: e^84/2^257 < 27^28/2^257 < 2^-117 (e < 3, 3^84 < 2^140), 257(2 sqrt(3^n)+1) <= 125159, '
          '32(Q+125159) = 2305843009217699040 < 2^63, 3^6 243 (125159/2^56 + 2^-116) < 4e-7, x_n < 12, 2e-6 + (8+4e-7)4e-7 < 1e-5',
          ok120 and lit(t120, '32(Q+125159)=2305843009217699040<2^{63}'), '3^6 243(...) = %s' % dec(bound, 12))


# ----------------------------------------------------------------------------------------------- decide
_CACHE = {}


def decide(src=None, nmax49=11, workers=3, override=None, parts=('model', 'trial', 'thermal', 'scalars'), log=None, measure=True):
    """override: dict replacing printed values (forges). parts: which components to run (forges run one)."""
    t_start = time.time()
    src = src or Sources()
    checks = []
    value = {}
    refused = []
    texts = {k: src.text(k) for k in (INTRO, MODEL, BOOT, INIT, ASSEM, T72, T120, TRI)}
    P = printed(src)
    for k, v in (override or {}).items():
        P[k] = v
    intro = texts[INTRO]
    check(checks, 'the theorem as stated: unique ground state for even L >= 60, gamma_L > (4/105) log(80/79) (L >= 60), > log(20)/784 (L >= 2304)',
          lit(intro, '\\gamma_L&>\\frac4{105}\\log\\frac{80}{79}') and lit(intro, '\\gamma_L&>\\frac{\\log20}{784}') and lit(intro, 'L\\ge2304')
          and lit(texts[MODEL], 'a=\\frac{700741}{500000}'), 'introduction.tex:37-53; a = 700741/500000 (model.tex:86)')
    check(checks, 'the printed tables were read: 9 + 3 x 3 thermal centres, 18 W totals, 9 t totals, 8 D_alpha, 15 P_ab, 2 c_N, 11 block dims, 6 update rows',
          len(P['c21']) == 3 and len(P['c49']) == 9 and len(P['W']) == 9 and sum(len(v) for v in P['t'].values()) == 9 and P['diag'] and len(P['diag']) == 8
          and len(P['pairs']) == 15 and len(P['cN']) == 2 and P['blockdims'] and len(P['blockdims']) == 11 and len(P['updates']) == 6)

    if 'model' in parts:
        energy_lemma_checks(checks)
        symmetry_checks(checks)

    # ------------------------------------------------------------------ (B) trial MPS
    if 'trial' in parts:
        t0 = time.time()
        labels, A = trial_matrices(P['ell'], P['diag'], P['pairs'])
        md = json.loads(src.text(MATDATA))
        check(checks, 'the 26 x 26 matrices A_s built from Tables tab:trial-diagonal / tab:trial-pairs and eq:trial-entry equal matrix-data.json entry for entry',
              len(labels) == 26 and all(md['matrices'][str(s)] == A[s] for s in (-1, 0, 1))
              and [(l[0], l[2]) for l in md['labels']] == [(P['ell'][a - 1], d) for a, d in labels])
        key = ('trial', json.dumps([P['ell'], P['diag'], sorted(P['pairs'].items())]))
        if key not in _CACHE:
            _CACHE[key] = trial_contract(A, labels)
        UV, dims, leak, perblock = _CACHE[key]
        check(checks, 'eq:trial-blocks: the d-e blocks have dimensions 1,8,32,80,136,162,136,80,32,8,1 (sum 676) and no A_s entry leaves its block',
              [dims[d] for d in sorted(dims)] == P['blockdims'] and sum(dims.values()) == 676 and leak == 0)
        c72 = json.loads(src.text(CERT72))
        c120 = json.loads(src.text(CERT120))
        U72, V72 = UV[72]
        U120, V120 = UV[120]
        check(checks, 'N = 72: U_72, V_72 recomputed equal certificate72.json (one_bond_energy_numerator, norm) and its positive margin',
              int(c72['norm']) == V72 and int(c72['one_bond_energy_numerator']) == U72 and int(c72['positive_integer_margin']) == -700741 * V72 - 500000 * U72)
        blk = {b['delta']: (int(b['U']), int(b['V'])) for b in c120['blocks']}
        check(checks, 'N = 120: U_120, V_120 recomputed equal certificate120.json (U, V, margin, and all eleven per-block U and V)',
              int(c120['U']) == U120 and int(c120['V']) == V120 and int(c120['positive_margin_minus700741V_minus500000U']) == -700741 * V120 - 500000 * U120
              and blk == perblock[120])
        for N, (U, V) in UV.items():
            cN = P['cN'].get(N)
            check(checks, 'eq:trial-integer-results N = %d: V_N > 0 and -c_N V_N <= 10^12 U_N < (-c_N + 1) V_N with c_N = %s' % (N, cN),
                  V > 0 and cN is not None and -cN * V <= 10 ** 12 * U < (-cN + 1) * V, 'floor(1e12 U/V) = %d' % ((10 ** 12 * U) // V))
            check(checks, 'lem:trial-inputs N = %d: 500000 U_N + 700741 V_N < 0, i.e. E_0(%d) <= N U_N/V_N < -%d a' % (N, N, N),
                  V > 0 and 500000 * U + 700741 * V < 0 and cN is not None and F(-cN + 1, 10 ** 12) < -A_SHIFT,
                  'U/V + a = %s' % dec(F(U, V) + A_SHIFT, 12))
            value['U%d/V%d' % (N, N)] = dec(F(U, V), 15)
        # the contraction lemma, a second way
        ex = json.loads(src.text(EXACT4))
        okd = True
        det = []
        for N in (4, 5, 6):
            nrm, en = trial_direct(A, N)
            UN, VN = trial_contract(A, labels, Ns=(N,))[0][N]
            okd = okd and nrm == VN and en == N * UN
            det.append('N=%d: norm %s energy %s' % (N, 'ok' if nrm == VN else 'DIFF', 'ok' if en == N * UN else 'DIFF'))
            if N == 4:
                okd = okd and nrm == int(ex['norm_direct']) and en == int(ex['energy_direct'])
        check(checks, 'lem:trial-contraction re-derived for N = 4,5,6 by explicit amplitudes and the explicit Hamiltonian: ||psi||^2 = V_N, <psi,H psi> = N U_N '
              '(N = 4 also equals exact-checks.json)', okd, '; '.join(det))
        value['trial_seconds'] = round(time.time() - t0, 1)

    # ------------------------------------------------------------------ (A) thermal
    if 'thermal' in parts:
        t0 = time.time()
        thermal_constants(checks, texts[T72], texts[T120])
        cases = [('120', n, g) for n in (6, 8, 10) for g in ('1', 'P', 'C')] + [('72', n, g) for n in range(4, nmax49 + 1) for g in ('1', 'P')]
        todo = [c for c in cases if c not in _CACHE]
        if todo:
            res = run_all(todo, workers=workers, log=log)
            for c in todo:
                _CACHE[c] = res[c]
        sect = [json.loads(l) for l in src.text(SECTORS).split('\n') if l.strip()]
        sect_by = {}
        for r in sect:
            sect_by.setdefault((r['n'], '1' if r['tw'] == 0 else 'P'), {})[r['magnetization']] = int(r['W'])
        # b = 21/2
        okt, det = True, []
        for n in (6, 8, 10):
            for g in ('1', 'P', 'C'):
                got = _CACHE[('120', n, g)]['total']
                ok = got == P['t'].get(n, {}).get(g)
                okt = okt and ok
                if not ok:
                    det.append('t_{%d,%s} differs' % (n, g))
        check(checks, 'thermal120 totals t_{n,g} recomputed by the integer recurrence equal all nine printed integers (thermal120.tex:186-194)',
              okt, '; '.join(det) or 'all nine equal')
        s2 = json.loads(src.text(S2SUM))
        check(checks, 'source2 summary.json totals equal the printed t_{n,g} (data file vs paper)',
              all(int(c['total']) == P['t'][c['n']]['1PC'[c['twist']]] for c in s2['cases']) and len(s2['cases']) == 9)
        enc120, okE, det = {}, True, []
        for n in (6, 8, 10):
            for g in ('1', 'P', 'C'):
                lo, hi, mlo, mhi, x = enclosure120(n, P['t'][n][g], P['c21'][n][g])
                enc120[(n, g)] = (lo, hi)
                if not (mlo > 0 and mhi > 0):
                    okE = False
                    det.append('n=%d g=%s fails (margins %s, %s)' % (n, g, dec(mlo, 9), dec(mhi, 9)))
        check(checks, 'eq:thermal120-rational-enclosure: c - 2e-6 < L_n t/Q^2 < U_n t/Q^2 < c + 2e-6 for all nine (exact), hence |Z_n(21/2,g) - c| < 1e-5',
              okE, '; '.join(det) or 'min margin %s' % dec(min(min(enclosure120(n, P['t'][n][g], P['c21'][n][g])[2:4]) for n in (6, 8, 10) for g in '1PC'), 9))
        # b = 49/4
        okW, det, missing = True, [], []
        blocks_ok = True
        for n in range(4, 13):
            for g in ('1', 'P'):
                if ('72', n, g) not in _CACHE:
                    missing.append((n, g))
                    continue
                got = _CACHE[('72', n, g)]
                if got['total'] != P['W'][n][g]:
                    okW = False
                    det.append('W_{%d,%s} differs' % (n, g))
                sb = sect_by.get((n, g), {})
                if {w: v for w, v in got['blocks'].items()} != sb:
                    blocks_ok = False
                if got['lane_max'] >= 2 * 2 ** 55:
                    okW = False
                    det.append('lane bound exceeded at n=%d %s' % (n, g))
        done = [n for n in range(4, 13) if n not in [m for m, _ in missing]]
        check(checks, 'thermal72 totals W_{n,g} recomputed by the integer recurrence equal the printed integers for n = %d..%d, g = 1, P (thermal72.tex:186-194)'
              % (min(done), max(done)), okW and done == list(range(4, max(done) + 1)), '; '.join(det) or '%d of 18 recomputed and equal' % (2 * len(done)))
        check(checks, 'thermal72: every recomputed weight-block contribution equals the released sectors.jsonl entry', blocks_ok)
        runs = [v for k, v in _CACHE.items() if isinstance(k, tuple) and len(k) == 3 and k[0] in ('72', '120')]
        w72 = all(v['bad'] == 0 and v['rowsum'] * 2 ** 56 < 2 ** 63 for k, v in _CACHE.items() if isinstance(k, tuple) and len(k) == 3 and k[0] == '72')
        w120 = all(v['bad'] == 0 and v['rowsum'] * 2 ** 57 < 2 ** 63 for k, v in _CACHE.items() if isinstance(k, tuple) and len(k) == 3 and k[0] == '120')
        check(checks, 'the packed floors are exact: EVERY lane of EVERY stage was checked at run time to lie in [-2^56, 2^56) (b = 49/4; row sums <= 76) '
              'or [-2^57, 2^57) (b = 21/2; row sums < 64), so every lane of DX or BX lies in (-2^63, 2^63) at the next floor',
              w72 and w120 and len(runs) > 0, 'max row sums %s; out-of-window rows %d' % (sorted(set(v['rowsum'] for v in runs)), sum(v['bad'] for v in runs)))
        okE, det, enc49 = True, [], {}
        for n in range(4, 13):
            for g in ('1', 'P'):
                L, U, mlo, mhi, x = enclosure72(n, P['W'][n][g], P['c49'][n][g])
                enc49[(n, g)] = (L, U)
                if not (mlo > F(13, 10 ** 6) and mhi > F(13, 10 ** 6)):
                    okE = False
                    det.append('n=%d g=%s margins %s, %s' % (n, g, dec(mlo, 9), dec(mhi, 9)))
        check(checks, 'eq:thermal72-enclosure: L_{n,g} > (C-30)/1e6 and U_{n,g} < (C+30)/1e6 with margins > 13/1e6, all eighteen (exact)',
              okE, '; '.join(det) or 'min margin %s' % dec(min(min(enclosure72(n, P['W'][n][g], P['c49'][n][g])[2:4]) for n in range(4, 13) for g in '1P'), 9))
        if missing:
            meas = {}
            if measure:
                for n, g in missing:
                    if g == '1':
                        meas['n=%d' % n] = measure_cost('72', n, '1')
            refused.append({'part': 'W_{n,g} recomputation at b = 49/4 for %s (their enclosures above are arithmetic from the PRINTED W only)'
                            % ', '.join('n=%d g=%s' % m for m in missing),
                            'reason': 'cost: the clean-room Python recurrence on 3^n states', 'measured': meas})
        value['thermal_seconds'] = round(time.time() - t0, 1)
        value['thermal_cpu_seconds'] = {('%s n=%d %s' % c): round(_CACHE[c]['cpu_s'], 1) for c in cases if c in _CACHE}
        value['enclosures_b49_4'] = {'n=%d %s' % k: '[%s, %s]' % (dec(v[0], 8), dec(v[1], 8)) for k, v in enc49.items()}
        value['enclosures_b21_2'] = {'n=%d %s' % k: '[%s, %s]' % (dec(v[0], 8), dec(v[1], 8)) for k, v in enc120.items()}

    # ------------------------------------------------------------------ (C) scalars
    if 'scalars' in parts:
        s60 = seed60(checks, P['c21'], texts[INIT])
        s2304 = seed2304(checks, P['c49'], texts[INIT], P['updates'])
        bootstrap_params(checks, texts[BOOT])
        l20 = log_bounds(20)
        l8079 = log_bounds(F(80, 79))
        g1 = (F(4, 105) * l8079[0], F(4, 105) * l8079[1])
        g2 = (l20[0] / 784, l20[1] / 784)
        check(checks, 'the two gap constants enclosed (log by atanh series, proved tail): (4/105) log(80/79) and log(20)/784 are positive',
              g1[0] > 0 and g2[0] > 0 and g1[1] - g1[0] < F(1, 10 ** 30) and g2[1] - g2[0] < F(1, 10 ** 30),
              '(4/105) log(80/79) in [%s, %s]; log(20)/784 in [%s, %s]' % (dec(g1[0], 15), dec(g1[1], 15), dec(g2[0], 15), dec(g2[1], 15)))
        value['gap_L>=60'] = dec(g1[0], 15)
        value['gap_L>=2304'] = dec(g2[0], 15)
        value['seed2304_p0_q0'] = (dec(s2304['p0'], 9), dec(s2304['q0'], 9))
        value['seed60_S_T_lower'] = (dec(s60['S60_lower'], 6), dec(s60['T120_lower'], 6))

    ok = all(c['pass'] for c in checks)
    full = set(parts) >= {'model', 'trial', 'thermal', 'scalars'} and not refused
    verdict = 'REFUTED' if not ok else ('CERTIFIED' if full else 'REFUSED')
    if refused:
        value['refused'] = refused
    value['runtime_s'] = round(time.time() - t_start, 1)
    decides = ('a finite component: the finite inputs of the two initializations — the trial MPS contractions at N = 72, 120 (exact '
               'U_N, V_N), the thermal recurrences (all nine t_{n,g} at b = 21/2 and W_{n,g} at b = 49/4 for n <= %d recomputed '
               'exactly, all 27 rational enclosures), and every scalar comparison of prop:seed60, prop:seed2304 and the bootstrap '
               'parameters. NOT the gap theorem: the transfer operator, sector decomposition, purity bootstrap, filter/capped-mass '
               'lemmas, Fox-Glynn and Horner error arguments and the variational principle are analytic and outside this check'
               % max([n for n in range(4, 13) if ('72', n, '1') in _CACHE] or [0]))
    if refused:
        decides += '. REFUSED part: ' + '; '.join(r['part'] for r in refused)
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'decides': decides, 'value': value}


def _failing(r):
    return '; '.join(c['check'][:90] for c in r['checks'] if not c['pass']) or 'nothing failed'


def forge():
    """each must NOT certify; every forge reruns only the component it touches (the heavy results are cached)"""
    out = []
    P = printed(Sources())
    W = {n: dict(v) for n, v in P['W'].items()}
    W[8]['P'] += 1
    r = decide(override={'W': W}, parts=('thermal',), nmax49=8, measure=False)
    out.append(('printed W_{8,P} + 1 -> fails: ' + _failing(r), r['verdict']))
    c49 = {n: dict(v) for n, v in P['c49'].items()}
    c49[12]['P'] += 31
    r = decide(override={'c49': c49}, parts=('thermal', 'scalars'), nmax49=8, measure=False)
    out.append(('b=49/4 centre C_{12,P} 787405 -> 787436 (moved by 31e-6) -> fails: ' + _failing(r), r['verdict']))
    t = {n: dict(v) for n, v in P['t'].items()}
    t[10]['C'] -= 10 ** 9
    r = decide(override={'t': t}, parts=('thermal',), nmax49=8, measure=False)
    out.append(('printed t_{10,C} - 10^9 -> fails: ' + _failing(r), r['verdict']))
    diag = list(P['diag'])
    diag[0] = -290
    r = decide(override={'diag': diag}, parts=('trial',), measure=False)
    out.append(('trial table D_1 = -289 -> -290 -> fails: ' + _failing(r), r['verdict']))
    upd = dict(P['updates'])
    upd[3] = (upd[3][0] - F(1, 10 ** 7), upd[3][1])
    r = decide(override={'updates': upd}, parts=('scalars',), measure=False)
    out.append(('update row p_3 lowered by 1e-7 -> fails: ' + _failing(r), r['verdict']))
    return out


if __name__ == '__main__':
    nmax = int(sys.argv[1]) if len(sys.argv) > 1 else 11
    t = time.time()

    def log(s):
        print(s, flush=True)
    res = decide(nmax49=nmax, log=log)
    print(json.dumps({k: res[k] for k in ('verdict', 'decides')}, indent=1))
    print(json.dumps(res['value'], indent=1, default=str))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('decide %.1fs' % (time.time() - t))
    t = time.time()
    for d, v in forge():
        print('FORGE', v, '-', d)
    print('forges %.1fs' % (time.time() - t))
