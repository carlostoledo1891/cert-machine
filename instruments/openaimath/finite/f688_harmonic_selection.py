"""F-688 — "A counterexample to integer-degree harmonic dimension comparison" (openai/math family 361).

THE CLAIM (sections/introduction.tex:23-37, Theorem thm:main): there are an even n >= 8, an integer k >= 2 and a
complete smooth metric g on R^n with Ric_g >= 0 and h_k(R^n, g) > h_k(R^n, g_E). The paper's proof is analytic
(Lemma lem:spectral-surplus picks k "sufficiently large"); sections/finite-selection.tex:1-94 adds a SUPPLEMENTARY
exact instance: m = 15, s = 8, k = 50000, q_* = 101/100, c = 147/1000, alpha_*^2 = 99853/100000, and prints
(lines 77-85)
    selected dimension   = 46785605044474340387088811257657817010714687366486217934111
    h_50000(R^16)        = 46779709349146362239266126538609505511855492134986686636251
    strict surplus       =  5895695327978147822684719048311498859195231499531297860
"These parameters and selections satisfy all the finite-data hypotheses at the end of Section sec:counting ...
therefore gives the metric of Theorem thm:main with n=16 and k=50000" (lines 90-94).

WHAT IS DECIDED HERE, exactly (int and Fraction only; no float enters a decision):
  A. The parameter checks of lines 12-35. alpha_*^2 = 1 - c(q_*-1) and c > 2/(m-1) (eq:dwell-parameters);
     the printed margin 1 - 2(q_*-1)/(m-1) - alpha_*^2 = 29/700000 > 0; the derivative of
     F(q) = q^(1/m)(1 - 2(q-1)/(m-1)) is q^(1/m-1) times a linear polynomial in q, compared coefficient by coefficient
     with the paper's (m+1)(1-2q)/(m(m-1)), so F decreases on q >= 1 and the strict link margin eq:link-margin holds
     on [1, q_*] at a_*^2 = q_*^(1/15) alpha_*^2 (the horizontal term is the min there); 101*99853^15 < 100*100000^15,
     so a_* < 1; -log a_* = (1/2)[log(100000/99853) - (1/15) log(101/100)] enclosed between rational partial sums of
     the alternating series of log(1+t) (0 < t < 1: even partial sums below, odd above), giving
     0 < -log a_* <= -(1/2) log alpha_*^2 < (1 - alpha_*^2)/(2 alpha_*^2) = 147/199706 < 1/1000; the cutoff integral
     int_4^oo (1+t)^(-5/4) dt = 4*5^(-1/4) > 2 as (4*5^(-1/4))^4 = 256/5 > 16; hence mu = -log a_* / I_chi < 1/2000
     and b = -mu chi (1+t)^(-5/4) >= -mu > -1/4, and eq:cutoff-smallness holds (for ANY cutoff with 0 <= chi <= 1,
     chi = 1 on [4, oo), which is how chi is defined).
  B. The eigenvalue data. With a_*^2 = q_*^(1/m) alpha_*^2 the factor a^-2 q^(1/m) of eq:angular-operator is
     alpha_*^-2 (the irrational q_*^(1/15) cancels), so on Hopf charge b the eigenvalue is
     alpha_*^-2 [l(l+14) - (1 - 1/q_*)(2b-l)^2]; this is checked to equal the printed num/den
     (num = 100000(101 l(l+14) - (2b-l)^2), den = 101*99853) as a polynomial identity in (l, b) over Q.
  C. The count. N_l = C(m+l,m) - C(m+l-2,m) = (l+s-1)/(s-1) C(l+2s-3,2s-3) for every degree used; the two lines of
     eq:hopf-multiplicity agree, and sum_b h_{l,b} = N_l, for every degree searched individually and every degree
     l <= 200; sum_{l=0}^k N_l = C(m+k,k) + C(m+k-1,k-1) = eq:euclidean-comparator at n = 16 = the printed h_k.
     The selection, re-implemented from the text of lines 39-75 alone:
       - degree l (2 <= l) is taken in full when 100000 l(l+14) < 99853 k(k+14): then every eigenvalue is
         <= alpha_*^-2 l(l+14) < k(k+14) = B_k, so every exponent d (d(d+14) = lambda, d >= 0) is < k;
       - otherwise b runs 0..floor(l/2) (eigenvalues strictly increasing in b, checked), multiplicity
         h_{l,b} + h_{l,l-b} (h_{l,l/2} once), S = isqrt(floor(Q^2(h^2 den + 4 num)/den)) + 1 with Q = 10^8, h = 14;
         S^2 den > Q^2(h^2 den + 4 num) is VERIFIED for every S used (so d < (S - hQ)/(2Q) strictly), and the
         largest initial group with sum (S_i - hQ) < 2Qk * size is taken, partial blocks allowed. Upper bounds are
         checked nondecreasing in b, so the prefix sums are concave and the greedy cut is the largest qualifying group;
       - the search ends at the first degree whose smallest eigenvalue is >= k(k+14) exactly (its smallest exponent
         is >= k; the smallest eigenvalue increases with l, so no later degree can contribute).
     Every counted group is an initial segment of the true eigenvalue order whose upper-bounded exponent sum is
     < k * size, so its true mean is < k: eq:selection holds for the printed M_l. The sum is compared with the
     printed selected dimension, h_k and the surplus, exactly.

WHAT IS NOT DECIDED (it rests on theory, not on the finite object):
  - Lemma lem:berger-metrics (Ricci eigenvalues of the Berger links, eq:link-margin, the angular operator
    eq:angular-operator) and Lemma lem:hopf-distribution (that -D_J^2 acts by (2b-l)^2 on bidegree (b, l-b) with the
    printed dimensions): used as stated; only their arithmetic consequences are checked.
  - Propositions prop:metric and prop:transmission and Section sec:conclusion (the metric, its smoothness,
    completeness, Ric >= 0, and that the selected spectral data really yield harmonic functions of growth <= k).
  - The analytic Lemma lem:spectral-surplus (existence of k for some m) — the paper says its finite instance is
    supplementary and the existence argument does not depend on it.
  - The facts log y < y - 1 (y > 1) and the alternating-series bracket for log(1+t) are standard calculus, used once.

OBSERVED AFTER THIS DECIDER RAN (2026-10-09; not part of the decision):
  - verification/counting-check.py runs the same selection (multiplicities by a ratio recurrence from C(l+7,7),
    isqrt + 1 with the strictness asserted, partial cut, break). It asserts count <= N_l, the group bound and
    selected > comparator; it does not check sum_b h_{l,b} = N_l, the two lines of eq:hopf-multiplicity against each
    other, the eigenvalue formula against eq:angular-operator, the parameter inequalities of lines 18-35, or that the
    bounds are monotone in b (its break assumes it). Its recorded output agrees with this decider on every number
    (degrees 49964..50212, 16 whole / 233 cut, the three integers).
  - The Lean comparator statement ComparatorChallenges/HarmonicGrowth.lean (MainClaim) is EXISTENTIAL in (n, k); it
    does not fix 16 and 50000. The Lean solution (OAI/Geometry/HarmonicGrowth/Main.lean:477) instantiates
    n = 16, k = 50000, the same pair as this section, but certifies a DIFFERENT, smaller selection: whole paired Hopf
    blocks (no middle block, no partial block) whose mean EIGENVALUE is < k(k+14) (then Jensen on the concave
    d(lambda)). Its individual-degree total 522287585849246462444796810909440354012831076347230611120 (Counting.lean)
    was re-derived exactly here (scratch); its selected total 46785500365511533583213825029528343172711751960679091073783
    is below the paper's printed 46785605044474340387088811257657817010714687366486217934111 and still above h_k.
"""
import math
import os
import re
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, mul, scale, sub, var  # noqa: E402

DIR = 'preprints/A-counterexample-to-integer-degree-harmonic-dimension-comparison-September-25-2026/build/'
SEL = DIR + 'sections/finite-selection.tex'
CNT = DIR + 'sections/counting.tex'
LNK = DIR + 'sections/links.tex'
INTRO = DIR + 'sections/introduction.tex'
GEO = DIR + 'sections/geometry.tex'


def C(n, r):
    return math.comb(n, r) if 0 <= r <= n else 0


def frac(tex_frac):
    m = re.fullmatch(r'\\frac\{(\d+)\}\{(\d+)\}', tex_frac)
    return Fraction(int(m.group(1)), int(m.group(2)))


def parse(src):
    """the published parameters and integers, read from the bytes of finite-selection.tex"""
    t = src.text(SEL)
    flat = re.sub(r'\s+', ' ', t)
    p = {}
    m = re.search(r'm=(\d+),\\qquad s=(\d+),\\qquad k=(\d+),\\qquad q_\*=(\\frac\{\d+\}\{\d+\})', flat)
    p['m'], p['s'], p['k'], p['q'] = int(m.group(1)), int(m.group(2)), int(m.group(3)), frac(m.group(4))
    m = re.search(r'c=(\\frac\{\d+\}\{\d+\}),\\qquad \\alpha_\*\^2=(\\frac\{\d+\}\{\d+\})', flat)
    p['c'], p['alpha2'] = frac(m.group(1)), frac(m.group(2))
    m = re.search(r'1-\\frac\{2\(q_\*-1\)\}\{m-1\}-\\alpha_\*\^2=(\\frac\{\d+\}\{\d+\})>0', flat)
    p['margin'] = frac(m.group(1))
    m = re.search(r'\\\(101\\cdot99853\^\{15\}<100\\cdot100000\^\{15\}\\\)', flat)
    p['pow_ineq_printed'] = bool(m)
    m = re.search(r'Q=10\^(\d+)', flat)
    p['Q'] = 10 ** int(m.group(1))
    m = re.search(r'\\mathrm\{num\}=(\d+)\\bigl\((\d+)l\(l\+(\d+)\)-\(2b-l\)\^2\\bigr\), \\qquad \\mathrm\{den\}=(\d+)\\cdot(\d+)', flat)
    p['num_scale'], p['num_q'], p['num_h'], p['den_a'], p['den_b'] = (int(m.group(i)) for i in range(1, 6))
    ints = re.findall(r'&=(\d+),?\\\\|&=(\d+)\.', flat)
    ints = [int(a or b) for a, b in ints]
    p['selected'], p['h_k'], p['surplus'] = ints
    p['formula_S'] = 'S=\\operatorname{isqrt}\\!\\left(' in flat and 'd<\\frac{S-hQ}{2Q}' in flat
    p['full_test'] = '\\(l(l+14)<\\alpha_*^2k(k+14)\\)' in flat
    return p


def log1p_enclosure(t, terms=8):
    """0 < t < 1: partial sums of t - t^2/2 + t^3/3 - ... alternate around log(1+t) (terms strictly decreasing)"""
    s, lo, hi = Fraction(0), None, None
    for i in range(1, terms + 1):
        s += (-1) ** (i + 1) * t ** i / i
        if i % 2:
            hi = s
        else:
            lo = s
    return lo, hi


def hopf_line1(l, b, s):
    return C(s + b - 1, s - 1) * C(s + l - b - 1, s - 1) - C(s + b - 2, s - 1) * C(s + l - b - 2, s - 1)


def hopf_line2(l, b, s):
    t = (l + s - 1) * C(b + s - 2, s - 2) * C(l - b + s - 2, s - 2)
    q, r = divmod(t, s - 1)
    assert r == 0
    return q


def N(l, m):
    return C(m + l, m) - C(m + l - 2, m)


def select(p, sqrt_plus_one=True, full_check_lines=True):
    """the selection of finite-selection.tex lines 39-75, recomputed; returns (total, stats, failures)"""
    m, s, k, Q = p['m'], p['s'], p['k'], p['Q']
    h = m - 1
    den = p['den_a'] * p['den_b']
    A2n, A2d = p['alpha2'].numerator, p['alpha2'].denominator
    Bk = k * (k + h)
    fails = []
    nfail = [0]

    def fail(msg):
        nfail[0] += 1
        if len(fails) < 5:
            fails.append(msg)
    total = 0
    stats = {'partial_cuts': 0, 'full_in_search': 0, 'S_checked': 0, 'line12_checked': 0}
    # degrees taken in full
    l = 2
    while A2d * l * (l + h) < A2n * Bk:
        total += N(l, m)
        l += 1
    L_full = l - 1
    stats['L_full'] = L_full
    stats['first_individual'] = l
    L_sel = L_full
    while True:
        # smallest eigenvalue (b = 0) against B_k, exactly: num_0/den >= Bk  <=>  smallest exponent >= k
        num0 = p['num_scale'] * (p['num_q'] * l * (l + p['num_h']) - l * l)
        if num0 >= Bk * den:
            stats['stop_degree'] = l
            break
        Nl = N(l, m)
        D = 0                 # 2Qk*M - sum (S_i - hQ): positive iff the group mean bound is < k
        M = 0
        cut = False
        mult_sum = 0
        prev_num, prev_S = None, None
        for b in range(0, l // 2 + 1):
            m2 = hopf_line2(l, b, s)
            mu = m2 if 2 * b == l else 2 * m2          # h_{l,b} + h_{l,l-b}, the middle term once (line 2 is symmetric in b <-> l-b)
            if full_check_lines:
                l1 = hopf_line1(l, b, s) + (0 if 2 * b == l else hopf_line1(l, l - b, s))
                if l1 != mu:
                    fail('line 1 != line 2 at l=%d b=%d' % (l, b))
                stats['line12_checked'] += 1
            mult_sum += mu
            if cut:
                continue
            num = p['num_scale'] * (p['num_q'] * l * (l + p['num_h']) - (2 * b - l) ** 2)
            X = Q * Q * (h * h * den + 4 * num)
            S = math.isqrt(X // den) + (1 if sqrt_plus_one else 0)
            stats['S_checked'] += 1
            if not S * S * den > X:
                fail('S^2 den <= Q^2(h^2 den + 4 num) at l=%d b=%d' % (l, b))
            if prev_num is not None and not num > prev_num:
                fail('eigenvalues not increasing at l=%d b=%d' % (l, b))
            if prev_S is not None and not S >= prev_S:
                fail('upper bounds not nondecreasing at l=%d b=%d' % (l, b))
            prev_num, prev_S = num, S
            delta = 2 * Q * k - (S - h * Q)       # change of D per element of this block
            if delta >= 0:
                D += mu * delta
                M += mu
            else:
                t = max(0, (D - 1) // (-delta)) if D > 0 else 0
                if t >= mu:
                    D += mu * delta
                    M += mu
                else:
                    D += t * delta
                    M += t
                    cut = True
                    if t:
                        stats['partial_cuts'] += 1
        if mult_sum != Nl:
            fail('sum_b h_{l,b} != N_l at l=%d' % l)
        if M and not D > 0:
            fail('group at l=%d has upper-bounded mean >= k' % l)
        if M == Nl:
            stats['full_in_search'] += 1
        if M:
            L_sel = l
        total += M
        l += 1
    stats['L'] = L_sel
    stats['individual_degrees'] = stats['stop_degree'] - stats['first_individual']
    stats['failures'] = nfail[0]
    return total, stats, fails


def decide(src=None, override=None, sqrt_plus_one=True):
    src = src or Sources()
    checks = []
    p = parse(src)
    if override:
        p.update(override)
    cnt = re.sub(r'\s+', ' ', src.text(CNT))
    lnk = re.sub(r'\s+', ' ', src.text(LNK))
    intro = re.sub(r'\s+', ' ', src.text(INTRO))
    geo = re.sub(r'\s+', ' ', src.text(GEO))
    check(checks, 'the paper prints eq:hopf-multiplicity, N_l, eq:angular-operator, eq:link-margin and eq:euclidean-comparator as used here',
          all(x in cnt for x in ('h_{l,b} &=\\binom{s+b-1}{s-1}\\binom{s+l-b-1}{s-1} -\\binom{s+b-2}{s-1}\\binom{s+l-b-2}{s-1}',
                                 '&=\\frac{l+s-1}{s-1} \\binom{b+s-2}{s-2}\\binom{l-b+s-2}{s-2}'))
          and all(x in lnk for x in ('=\\binom{m+l}{m}-\\binom{m+l-2}{m}', 'B_l=l(l+m-1)', '=a^{-2}q^{1/m} \\left[B_l\\Id+(q^{-1}-1)(-D_J^2|_{V_l})\\right]',
                                     'a^2<q^{1/m} \\min\\left\\{1-\\frac{2(q-1)}{m-1},\\,q\\right\\}'))
          and '=\\binom{n+k-1}{k}+\\binom{n+k-2}{k-1}\\qquad(k\\geq1)' in intro
          and 'b(t)=-\\mu\\chi(t)(1+t)^{-5/4},' in geo and 'a(t)=\\exp\\left(\\int_2^t b(u)\\,du\\right)' in geo
          and p['formula_S'] and p['full_test'] and p['pow_ineq_printed'],
          'counting.tex:24-29, links.tex:40-44,71-83, introduction.tex:13-17, geometry.tex:118-122, finite-selection.tex:22-24,44-53,70-71')
    m, s, k, q, c, a2 = p['m'], p['s'], p['k'], p['q'], p['c'], p['alpha2']
    n = m + 1
    check(checks, 'A. m = 2s - 1 odd with s >= 4; n = m + 1 = 16 even >= 8; k >= 2', m == 2 * s - 1 and s >= 4 and n % 2 == 0 and n >= 8 and k >= 2,
          'm=%d s=%d n=%d k=%d' % (m, s, n, k))
    eps = q - 1
    check(checks, 'A. alpha_*^2 = 1 - c(q_* - 1) (eq:dwell-parameters) and c > 2/(m-1)', a2 == 1 - c * eps and c > Fraction(2, m - 1),
          'c - 2/(m-1) = %s' % (c - Fraction(2, m - 1)))
    margin = 1 - 2 * eps / (m - 1) - a2
    check(checks, 'A. the printed endpoint margin 1 - 2(q_*-1)/(m-1) - alpha_*^2 = %s > 0' % p['margin'], margin == p['margin'] and margin > 0, str(margin))
    # F'(q) / q^(1/m - 1) = (1/m)(1 - 2(q-1)/(m-1)) - 2q/(m-1): a linear polynomial in q; compare with (m+1)(1-2q)/(m(m-1))
    lhs = (Fraction(1, m) * (1 + Fraction(2, m - 1)), Fraction(1, m) * Fraction(-2, m - 1) - Fraction(2, m - 1))   # (const, coeff of q)
    rhs = (Fraction(m + 1, m * (m - 1)), Fraction(-2 * (m + 1), m * (m - 1)))
    check(checks, "A. F'(q) = (m+1)/(m(m-1)) q^(1/m-1)(1-2q) (coefficients compared), negative for q >= 1: F decreases on [1, q_*]", lhs == rhs and rhs[1] < 0 and rhs[0] + rhs[1] < 0,
          'so a_*^2 = q_*^(1/m) alpha_*^2 < F(q_*) <= F(q) on [1, q_*] by the margin; the min in eq:link-margin is the horizontal term since 1 - 2(q-1)/(m-1) <= 1 <= q')
    check(checks, 'A. 101 * 99853^15 < 100 * 100000^15, i.e. q_*(alpha_*^2)^15 < 1, so a_*^30 < 1 and a_* < 1',
          q.numerator * a2.numerator ** 15 * 1 < q.denominator * a2.denominator ** 15 and q * a2 ** 15 < 1 and (q.numerator, a2.numerator) == (101, 99853))
    t1 = 1 / a2 - 1                      # log(1/alpha^2) = log(1 + t1)
    t2 = q - 1                           # log q_* = log(1 + t2)
    lo1, hi1 = log1p_enclosure(t1)
    lo2, hi2 = log1p_enclosure(t2)
    nla_lo = (lo1 - hi2 / m) / 2         # -log a_* = (1/2)[log(1/alpha^2) - (1/m) log q_*]
    nla_hi = (hi1 - lo2 / m) / 2
    bound = (1 - a2) / (2 * a2)
    check(checks, 'A. 0 < -log a_* <= -(1/2) log alpha_*^2 < (1 - alpha_*^2)/(2 alpha_*^2) = %s < 1/1000 (rational series enclosures)' % bound,
          0 < t1 < 1 and 0 < t2 < 1 and nla_lo > 0 and lo2 > 0 and hi1 / 2 < bound and bound < Fraction(1, 1000) and nla_hi < Fraction(1, 1000),
          '-log a_* in [%.9e, %.9e]; width %.1e' % (float(nla_lo), float(nla_hi), float(nla_hi - nla_lo)))
    check(checks, 'A. int_4^oo (1+t)^(-5/4) dt = 4*5^(-1/4) > 2: (4*5^(-1/4))^4 = 256/5 > 2^4', Fraction(4 ** 4, 5) > 2 ** 4)
    mu_hi = Fraction(1, 1000) / 2
    check(checks, 'A. mu = -log a_* / I_chi < (1/1000)/2 = 1/2000, so b >= -mu > -1/4 and eq:cutoff-smallness holds (sup chi (1+t)^(-5/4) <= 1)',
          nla_hi / 2 < mu_hi == Fraction(1, 2000) and -mu_hi > Fraction(-1, 4) and mu_hi * 1 <= Fraction(1, 4))
    # B. eigenvalue data as a polynomial identity in (l, b)
    L_, B_ = var(0, 2), var(1, 2)
    hh = m - 1
    lam_paper = scale(add(scale(mul(L_, add(L_, const(hh, 2))), 1), scale(mul(sub(scale(B_, 2), L_), sub(scale(B_, 2), L_)), -(1 - 1 / q))), 1 / a2)
    den = p['den_a'] * p['den_b']
    lam_printed = scale(sub(scale(mul(L_, add(L_, const(p['num_h'], 2))), p['num_q']), mul(sub(scale(B_, 2), L_), sub(scale(B_, 2), L_))),
                        Fraction(p['num_scale'], den))
    check(checks, 'B. num/den = alpha_*^-2 [l(l+m-1) - (1 - 1/q_*)(2b-l)^2] as polynomials in (l, b) over Q (eq:angular-operator at a_*^2 = q_*^(1/m) alpha_*^2)',
          sub(lam_paper, lam_printed) == {} and 1 - 1 / q == Fraction(1, 101), 'num = %d(%d l(l+%d) - (2b-l)^2), den = %d' % (p['num_scale'], p['num_q'], p['num_h'], den))
    # C. the comparator
    t0 = time.time()
    hk_sum = sum(N(l, m) for l in range(0, k + 1))
    hk_closed = C(m + k, k) + C(m + k - 1, k - 1)
    hk_intro = C(n + k - 1, k) + C(n + k - 2, k - 1)
    check(checks, 'C. sum_{l=0}^k N_l = C(m+k,k) + C(m+k-1,k-1) = C(n+k-1,k) + C(n+k-2,k-1) = the printed h_k(R^16)',
          hk_sum == hk_closed == hk_intro == p['h_k'], 'h_k = %d (%d digits); direct sum %.1fs' % (hk_sum, len(str(hk_sum)), time.time() - t0))
    ok_small = all(hopf_line1(l, b, s) == hopf_line2(l, b, s) for l in range(0, 201) for b in range(0, l + 1)) and \
        all(sum(hopf_line2(l, b, s) for b in range(0, l + 1)) == N(l, m) for l in range(0, 201))
    check(checks, 'C. eq:hopf-multiplicity: line 1 = line 2 and sum_b h_{l,b} = N_l for every l <= 200 and every b', ok_small)
    t0 = time.time()
    total, stats, fails = select(p, sqrt_plus_one=sqrt_plus_one)
    tsel = time.time() - t0
    L = stats['L']
    ok_N = all(N(l, m) * (s - 1) == (l + s - 1) * C(l + 2 * s - 3, 2 * s - 3) for l in range(0, stats['stop_degree'] + 1))
    check(checks, 'C. N_l = C(m+l,m) - C(m+l-2,m) = (l+s-1)/(s-1) C(l+2s-3,2s-3) for every l <= %d' % stats['stop_degree'], ok_N)
    check(checks, 'C. full degrees: 100000 l(l+14) < 99853 k(k+14) exactly for 2 <= l <= %d and fails at %d (all their exponents are < k)' % (stats['L_full'], stats['L_full'] + 1),
          a2.denominator * stats['L_full'] * (stats['L_full'] + hh) < a2.numerator * k * (k + hh) <= a2.denominator * (stats['L_full'] + 1) * (stats['L_full'] + 1 + hh))
    check(checks, 'C. individual degrees %d..%d: every S verified (S^2 den > Q^2(h^2 den + 4 num)), eigenvalues increasing and bounds nondecreasing in b, '
          'line 1 = line 2 and sum_b = N_l in every degree, every group mean bound < k' % (stats['first_individual'], stats['stop_degree'] - 1),
          not fails, '%d bounds S, %d (l,b) multiplicities in both lines; %d degrees cut inside a repeated eigenvalue, %d taken whole; %s'
          % (stats['S_checked'], stats['line12_checked'], stats['partial_cuts'], stats['full_in_search'], ('%d failures, first: ' % stats['failures']) + '; '.join(fails[:3]) if fails else 'no failures'))
    check(checks, 'C. the search stops at degree %d, whose smallest eigenvalue is >= k(k+14) exactly (smallest exponent >= k); the last selected degree is L = %d' % (stats['stop_degree'], L),
          L >= 2 and stats['stop_degree'] > L)
    check(checks, 'C. the selected dimension sum_{l=2}^L M_l equals the printed integer', total == p['selected'], '%d vs printed %d' % (total, p['selected']))
    check(checks, 'C. the printed surplus = selected - h_k, and it is > 0 (eq:selection: sum M_l > sum_{l=0}^k N_l)',
          p['surplus'] == p['selected'] - p['h_k'] and total - hk_sum > 0, 'recomputed surplus %d' % (total - hk_sum))
    ok = all(c_['pass'] for c_ in checks)
    # the first check reads the definitions off the paper; if it fails the object is not what this decider decides
    verdict = 'CERTIFIED' if ok else ('REFUSED' if not checks[0]['pass'] else 'REFUTED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the supplementary exact spectral selection at n = 16, k = 50000 (finite-selection.tex) — every parameter '
                       'inequality, the eigenvalue data, the multiplicities, every square-root bound and the three printed integers; '
                       'not the analytic construction of the metric nor the lemmas the eigenvalues and multiplicities come from',
            'value': {'n': n, 'k': k, 'selected': str(total), 'h_k': str(hk_sum), 'surplus': str(total - hk_sum),
                      'ratio_selected_over_h_k': '%.12f' % (total / hk_sum), 'L_full': stats['L_full'], 'first_individual': stats['first_individual'],
                      'L': L, 'stop_degree': stats['stop_degree'], 'partial_cuts': stats['partial_cuts'], 'selection_seconds': round(tsel, 1)}}


def forge():
    """each must NOT certify"""
    out = []
    src = Sources()
    p = parse(src)
    r = decide(override={'selected': p['selected'] + 1, 'surplus': p['surplus'] + 1})
    out.append(('selected dimension and surplus both printed one larger', r['verdict']))
    r = decide(override={'alpha2': Fraction(99854, 100000)})
    out.append(('alpha_*^2 = 99854/100000, printed data kept (the dwell relation, the 29/700000 margin and the eigenvalue identity break; the count itself does not move)', r['verdict']))
    r = decide(sqrt_plus_one=False)
    out.append(('S = isqrt(...) without the +1 (not a strict upper bound for sqrt)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], '|', c_['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
