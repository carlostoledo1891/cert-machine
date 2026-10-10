"""F-467 — "Routing densities and representation contraction for Thorp sweeps" (openai/math family 238).

THE CLAIM. The headline (build/main.tex:45, abstract; build/sections/00-introduction.tex:30-45, Theorem fac:main): "For
N=2^d cards, we prove that an absolute number of coordinate sweeps of the Thorp shuffle brings the full permutation law
to total-variation distance tending to zero from uniform." Section 4 (build/sections/04-certificate.tex) is, in the
paper's words (line 2), "an independent route" after "The factorial proof is complete"; its finite certificate is five
rational inequalities (lines 261-294) on

    h_j = max{ E(1/L) : L in Z>=1, P(L=l) <= l/2^(j-1) }                                  (lines 134-136)
    H(rho) = max{ (1/2) sum_j h_j x_j : 0 <= x_j <= 1, sum_j 2^-j x_j <= rho }             (lines 138-141)

namely  H(1/8) < .791402,  H(13/50) < 1.098069,  H(1) < 1.958069  (lines 275-278), and the "full bracket"
H(rho) + (-rho - (1-rho) ln(1-rho))/(rho ln 2)  below .904054 at rho = 7/25 and below .515374 at rho = 1 (line 287),
with the supporting facts: the closed form (net:hj) h_j = q/M + (1 - q(q+1)/(2M))/(q+1) = q/(2M) + 1/(q+1) for
M = 2^(j-1), q(q+1) <= 2M < (q+1)(q+2); h_j <= sqrt(2/M); increasing allocation ratios 2^(j-1) h_j; the tail
(1/2) sum_{j>20} h_j <= (1+sqrt2)/1024 < 169/(70*1024); the series enclosures of -ln(1-x) and ln 2 (lines 281-286);
the slopes 7/3 and 3/2 of H on [1/8,1/4] and [1/4,7/25]; the entropy-correction slope bound < 25/24 using ln 2 > 2/3
(lines 289-293); and the implied "useful bounds" .80, 1.11, 1.97, .96, .54 (lines 279, 287).

WHAT IS DECIDED HERE, exactly (Fraction only; no float in any decision):
  1. h_j recomputed from its DEFINITION (the linear program in the law of L, solved greedily — mass on the shortest
     lengths first, which is optimal because 1/l decreases) and compared with the printed closed form, j = 1..24; the
     closed form's simplification, j = 1..200; the bracketing q(q+1) <= 2M < (q+1)(q+2) for each.
  2. h_j <= sqrt(2/M) as h_j^2 <= 2/M, j = 1..200; and the paper's general proof — the two endpoint values of
     (q + x/(q+1))^2 - 4x are -4q and -4(q+1) — as polynomial identities in q (checked at three points; degree 2).
  3. the allocation ratios 2^(j-1) h_j strictly increase, j = 1..200 (the paper's general argument — the LP value is
     increasing in M — is theory; restated in the detail).
  4. the tail: (1/2) sum_{j>20} 2^(1-j/2) = (1+sqrt2)/1024 by summing even and odd j separately; sqrt2 < 99/70 by
     (99/70)^2 > 2, hence < 169/(70*1024); and, independently, the exact sum over j = 21..200 plus a geometric tail.
  5. the three H bounds by the paper's recipe (reserve 2^-20 of budget for the levels j > 20, fill levels 20, 19, ...
     greedily, add 169/71680) — an upper bound for H by the exchange argument, valid because the ratios increase —
     and, separately, a two-sided enclosure of the true H(rho) from 200 exact levels plus the geometric tail.
  6. the two bracket bounds twice: (a) with the paper's printed series (-ln(1-x) to 80 terms plus x^81/(81(1-x)); ln 2
     by the 40-term atanh(1/3) series plus its remainder bound), the negative numerator divided by the UPPER bound of
     ln 2; (b) with different series (-ln(1-rho) = 2 atanh(rho/(2-rho)); ln 2 = sum 1/(k 2^k)) and the true-H
     enclosure. At rho = 1 the correction is its continuous value -1/ln 2.
  7. the slopes 4 h_3 = 7/3 and 2 h_2 = 3/2 (also as exact differences of the greedy H), the slope bound
     1/(2(1-7/25) ln 2) < 25/24 with ln 2 > 2/3 rigorous, and 25/24 < 3/2 < 7/3 (so the bracket increases on both
     intervals); the useful bounds .80, 1.11, 1.97, .96, .54.
  A FACT RECORDED (value['facts']): the script the text cites, support/network_bounds.py (line 294), is not in the
  release — the preprint directory holds paper.pdf, README.md and build/ only, and no file named network_bounds* exists
  anywhere in the clone at the pin. These inequalities were therefore checked against no published checker.

WHAT IS NOT DECIDED: everything that is not these finite inequalities — the probabilistic and asymptotic arguments
(Propositions net:hightail and net:densetruncation, the reciprocal-cycle-length bound E(1/L_i) <= h_j itself, the
Chernoff / Hoeffding tails, Stirling, Theorem net:main) and the main factorial proof (Section 3), which the headline
actually rests on. The paper itself says the script "does not test the probabilistic or asymptotic arguments" (line
294). This is a component check of the independent route, not a proof of the headline.
"""
import os
import sys
import time
from fractions import Fraction
from math import isqrt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import CLONE, Sources, check  # noqa: E402

DIR = 'preprints/Routing-densities-and-representation-contraction-for-Thorp-sweeps-September-26-2026'
CERT = DIR + '/build/sections/04-certificate.tex'
MAIN = DIR + '/build/main.tex'
INTRO = DIR + '/build/sections/00-introduction.tex'
F = Fraction

# the printed bounds, as decimals (terminating, hence rational), read from 04-certificate.tex:276-287
PRINTED = {'H(1/8)': '.791402', 'H(13/50)': '1.098069', 'H(1)': '1.958069', 'bracket(7/25)': '.904054', 'bracket(1)': '.515374'}
TAIL_CAP = F(169, 70 * 1024)       # the printed rational cap of (1/2) sum_{j>20} h_j (line 271)
LEVELS = 200                       # exact levels used for the independent enclosures


# ------------------------------------------------------------------ h_j and H
def q_of(M):
    """the integer q with q(q+1) <= 2M < (q+1)(q+2)"""
    q = (isqrt(8 * M + 1) - 1) // 2
    return q


def h_closed(j, qshift=0):
    """the printed closed form (net:hj), M = 2^(j-1)"""
    M = 2 ** (j - 1)
    q = q_of(M) + qshift
    return F(q, M) + (1 - F(q * (q + 1), 2 * M)) / (q + 1)


def h_lp(j):
    """h_j from its definition: maximise sum_l p_l / l with sum_l p_l = 1 and 0 <= p_l <= l/M. Greedy on the smallest
    l is optimal (1/l decreases; any mass on a longer l with room on a shorter one can be moved and gains)."""
    M = 2 ** (j - 1)
    left, l, val = F(1), 1, F(0)
    while left > 0:
        p = min(F(l, M), left)
        val += p / l
        left -= p
        l += 1
    return val


def greedy_H(budget, h, top):
    """max (1/2) sum_{j<=top} h_j x_j subject to sum_{j<=top} 2^-j x_j <= budget, 0 <= x_j <= 1: fill the highest
    level first (the allocation ratios increase with j, so this is the fractional-knapsack optimum)"""
    val = F(0)
    for j in range(top, 0, -1):
        if budget <= 0:
            break
        w = F(1, 2 ** j)
        x = min(F(1), budget / w)
        val += F(1, 2) * h[j] * x
        budget -= x * w
    return val


def H_paper(rho, h, tail_cap=TAIL_CAP):
    """the paper's recipe (lines 274-275): subtract the last budget 2^-20, allocate levels 1..20 greedily, add the cap"""
    return greedy_H(rho - F(1, 2 ** 20), h, 20) + tail_cap


def sqrt2_bounds():
    lo, hi = F(1414213562, 10 ** 9), F(1414213563, 10 ** 9)
    assert lo * lo < 2 < hi * hi
    return lo, hi


def H_true_enclosure(rho, h, N=LEVELS):
    """two-sided enclosure of H(rho) for rho >= 2^-N (N even). Lower: a feasible point — levels above N full, levels
    1..N greedy with the rest of the budget — dropping the (positive) value of the levels above N. Upper: by the
    exchange argument (increasing ratios) an optimum fills every level above N, whose value is at most
    (1/2) sum_{j>N} 2^(1-j/2) = (1+sqrt2) 2^-(N/2) (even j = 2m, m > N/2: 2^(1-N/2); odd j = 2m+1, m >= N/2:
    sqrt2 2^(1-N/2); halved)."""
    assert N % 2 == 0 and rho >= F(1, 2 ** N)
    core = greedy_H(rho - F(1, 2 ** N), h, N)
    _, s2hi = sqrt2_bounds()
    return core, core + (1 + s2hi) / F(2 ** (N // 2))


# ------------------------------------------------------------------ logarithms
def ln2_paper():
    """ln 2 = 2 sum_{j=0}^{39} (1/3)^(2j+1)/(2j+1) + R, 0 < R <= 2 (1/3)^81 / (81 (1 - 1/9)) (lines 284-285)"""
    s = 2 * sum(F(1, 3) ** (2 * j + 1) / (2 * j + 1) for j in range(40))
    return s, s + 2 * F(1, 3) ** 81 / (81 * (1 - F(1, 9)))


def neglog1m_paper_upper(x):
    """-ln(1-x) <= sum_{i=1}^{80} x^i/i + x^81/(81(1-x)) (line 282)"""
    return sum(x ** i / i for i in range(1, 81)) + x ** 81 / (81 * (1 - x))


def ln2_independent():
    """ln 2 = sum_{k>=1} 1/(k 2^k); the tail after K terms is below 2/((K+1) 2^(K+1)) (geometric, ratio <= 1/2)"""
    K = 120
    s = sum(F(1, k * 2 ** k) for k in range(1, K + 1))
    return s, s + F(2, (K + 1) * 2 ** (K + 1))


def neglog1m_independent(x):
    """-ln(1-x) = 2 atanh(y), y = x/(2-x); 2 sum_{i<K} y^(2i+1)/(2i+1) + tail <= 2 y^(2K+1)/((2K+1)(1-y^2))"""
    y = x / (2 - x)
    K = 60
    s = 2 * sum(y ** (2 * i + 1) / (2 * i + 1) for i in range(K))
    return s, s + 2 * y ** (2 * K + 1) / ((2 * K + 1) * (1 - y * y))


def entropy_upper(rho, neglog_hi, ln2_hi):
    """upper bound of (-rho - (1-rho) ln(1-rho)) / (rho ln 2) given an upper bound of -ln(1-rho) and of ln 2: the
    numerator is bounded above by -rho + (1-rho) neglog_hi; when that is negative, the larger denominator bounds above"""
    if rho == 1:
        return -1 / ln2_hi, F(-1)
    num = -rho + (1 - rho) * neglog_hi
    return num / (rho * ln2_hi), num


# ------------------------------------------------------------------ the decision
def decide(src=None, printed=None, tail_cap=TAIL_CAP, qshift=0):
    t0 = time.time()
    src = src or Sources()
    printed = dict(PRINTED, **(printed or {}))
    checks = []
    tex = src.text(CERT)
    main = src.text(MAIN)
    intro = src.text(INTRO)
    flat = ' '.join(tex.split())
    check(checks, 'the headline as printed (abstract; Theorem fac:main)',
          'an absolute number of coordinate sweeps of the Thorp shuffle brings the full permutation law to total-variation distance tending to zero' in main
          and '\\label{fac:main}' in intro)
    check(checks, 'the five printed inequalities and the cap, read from 04-certificate.tex:270-287',
          all(s in flat for s in ('H(1/8)<.791402', 'H(13/50)<1.098069', 'H(1)<1.958069', 'below $.904054$ at $\\rho=7/25$',
                                  'below $.515374$ at $\\rho=1$', '<\\frac{169}{70\\cdot1024}', 'h_j=q/(2M)+1/(q+1)')))
    P = {k: F(v) for k, v in printed.items()}

    # 1. h_j from the definition vs the printed closed form
    h = {}
    ok_def, ok_br, ok_simpl = True, True, True
    for j in range(1, LEVELS + 1):
        M = 2 ** (j - 1)
        q = q_of(M)
        ok_br &= q * (q + 1) <= 2 * M < (q + 1) * (q + 2)
        hc = h_closed(j, qshift)
        ok_simpl &= hc == F(q + qshift, 2 * M) + F(1, q + qshift + 1)
        hl = h_lp(j) if j <= 24 else None          # the LP walk has ~sqrt(2M) steps; beyond 24 the closed form is used
        if hl is not None:
            ok_def &= hl == hc
        h[j] = hc if qshift else (hl if hl is not None else hc)
    check(checks, '1. h_j from its definition (the LP over laws of L, greedy) equals the printed closed form (net:hj), j = 1..24',
          ok_def, 'h_1..h_4 = %s' % [str(h[j]) for j in range(1, 5)])
    check(checks, '1. q(q+1) <= 2M < (q+1)(q+2) for the q used, and the simplification q/(2M) + 1/(q+1), j = 1..%d' % LEVELS, ok_br and ok_simpl)

    # 2. h_j <= sqrt(2/M)
    ok = all(h[j] ** 2 <= F(2, 2 ** (j - 1)) for j in range(1, LEVELS + 1))
    ids = all((q + q * (q + 1) // (q + 1)) ** 2 - 4 * q * (q + 1) == -4 * q and (q + (q + 1) * (q + 2) // (q + 1)) ** 2 - 4 * (q + 1) * (q + 2) == -4 * (q + 1)
              for q in (0, 1, 2, 3))
    check(checks, '2. h_j <= sqrt(2/M) (as h_j^2 <= 2/M), j = 1..%d; the endpoint values -4q and -4(q+1) of (q + x/(q+1))^2 - 4x are '
                  'identities (degree 2 in q, checked at four points)' % LEVELS, ok and ids)

    # 3. increasing allocation ratios
    ratios = [2 ** (j - 1) * h[j] for j in range(1, LEVELS + 1)]
    check(checks, '3. the allocation ratios 2^(j-1) h_j strictly increase, j = 1..%d (general j: the LP value increases with M — theory)' % LEVELS,
          all(ratios[i] < ratios[i + 1] for i in range(len(ratios) - 1)), 'ratios 1..5: %s' % [str(r) for r in ratios[:5]])

    # 4. the tail cap
    even = sum(F(2, 2 ** m) for m in range(11, 60)) + F(2, 2 ** 59)      # sum_{m>=11} 2^(1-m), closed by its geometric tail
    odd = sum(F(1, 2 ** m) for m in range(10, 60)) + F(1, 2 ** 59)       # sum_{m>=10} 2^-m; odd j = 2m+1 gives sqrt2 2^-m
    ok_geom = even == F(1, 512) and odd == F(1, 512)
    ok_cap = F(99, 70) ** 2 > 2 and (1 + F(99, 70)) / 1024 <= tail_cap
    s2lo, s2hi = sqrt2_bounds()
    tail_exact_hi = F(1, 2) * sum(h[j] for j in range(21, LEVELS + 1)) + (1 + s2hi) / F(2 ** (LEVELS // 2))
    check(checks, '4. (1/2) sum_{j>20} 2^(1-j/2) = (1+sqrt2)/1024 (even j: 2^-9; odd j: sqrt2 2^-9); (99/70)^2 > 2 so it is < 169/(70*1024)',
          ok_geom and ok_cap, 'cap %s = %.10f' % (tail_cap, float(tail_cap)))
    check(checks, '4. independently: (1/2) sum_{j>20} h_j <= exact levels 21..%d + geometric tail < the printed cap' % LEVELS,
          tail_exact_hi < tail_cap, '(1/2) sum_{j>20} h_j <= %.10e vs cap %.10e' % (float(tail_exact_hi), float(tail_cap)))

    # 5. the three H bounds
    vals = {}
    for name, rho in (('H(1/8)', F(1, 8)), ('H(13/50)', F(13, 50)), ('H(1)', F(1))):
        b = H_paper(rho, h, tail_cap)
        lo, hi = H_true_enclosure(rho, h)
        vals[name] = (b, lo, hi)
        check(checks, '5. %s < %s by the paper\'s recipe (levels 1..20 greedy with budget rho - 2^-20, plus the cap)' % (name, printed[name]),
              b < P[name], 'recipe bound %.9f; margin %.3e' % (float(b), float(P[name] - b)))
        check(checks, '5. %s < %s by the independent enclosure (%d exact levels + geometric tail)' % (name, printed[name], LEVELS),
              hi < P[name] and lo <= hi <= b, 'H in [%.12f, %.12f]' % (float(lo), float(hi)))

    # 6. the two brackets
    l2lo_p, l2hi_p = ln2_paper()
    l2lo_i, l2hi_i = ln2_independent()
    ok_ln2 = l2lo_p < l2hi_i and l2lo_i < l2hi_p           # the two enclosures of ln 2 overlap (both valid)
    check(checks, '6. the two ln 2 enclosures (paper\'s 40-term atanh(1/3) series with remainder; sum 1/(k 2^k) with geometric tail) overlap',
          ok_ln2, 'paper [%.15f, %.15f]' % (float(l2lo_p), float(l2hi_p)))
    r = F(7, 25)
    nl_p = neglog1m_paper_upper(r)
    nl_lo_i, nl_hi_i = neglog1m_independent(r)
    check(checks, '6. -ln(1 - 7/25): the paper\'s 80-term upper bound lies above the independent atanh enclosure\'s lower end',
          nl_p >= nl_lo_i, '-ln(18/25) in [%.15f, %.15f]' % (float(nl_lo_i), float(nl_hi_i)))
    for name, rho in (('bracket(7/25)', r), ('bracket(1)', F(1))):
        Hb = H_paper(rho, h, tail_cap)
        e_p, num_p = entropy_upper(rho, nl_p if rho != 1 else None, l2hi_p)
        br_p = Hb + e_p
        check(checks, '6a. %s < %s with the paper\'s series (numerator %s 0, divided by the upper ln 2)' % (name, printed[name], '<'),
              num_p < 0 and br_p < P[name], 'bound %.10f; margin %.3e' % (float(br_p), float(P[name] - br_p)))
        _, Hhi = H_true_enclosure(rho, h)
        e_i, num_i = entropy_upper(rho, nl_hi_i if rho != 1 else None, l2hi_i)
        br_i = Hhi + e_i
        check(checks, '6b. %s < %s independently (true-H enclosure, atanh -ln(1-rho), ln 2 = sum 1/(k 2^k))' % (name, printed[name]),
              num_i < 0 and br_i < P[name], 'bound %.10f; margin %.3e' % (float(br_i), float(P[name] - br_i)))
        vals[name] = (br_p, br_i)

    # 7. slopes, derivative bound, useful bounds
    g = lambda rho: greedy_H(rho - F(1, 2 ** 20), h, 20)  # noqa: E731
    s1 = (g(F(1, 4)) - g(F(1, 8))) / F(1, 8)
    s2 = (g(F(7, 25)) - g(F(1, 4))) / (F(7, 25) - F(1, 4))
    check(checks, '7. the slopes of H: 4 h_3 = 7/3 on [1/8,1/4] and 2 h_2 = 3/2 on [1/4,7/25] (also as exact differences of the greedy H)',
          4 * h[3] == F(7, 3) and 2 * h[2] == F(3, 2) and s1 == F(7, 3) and s2 == F(3, 2), 'difference slopes %s, %s' % (s1, s2))
    dbound = 1 / (2 * (1 - r) * F(2, 3))
    check(checks, '7. ln 2 > 2/3 (rigorous) and 1/(2(1-7/25)(2/3)) = 25/24, so |d/drho entropy correction| < 25/24 < 3/2 < 7/3',
          min(l2lo_p, l2lo_i) > F(2, 3) and dbound == F(25, 24) and F(25, 24) < F(3, 2) < F(7, 3))
    useful = (vals['H(1/8)'][0] < F('.80') and vals['H(13/50)'][0] < F('1.11') and vals['H(1)'][0] < F('1.97')
              and P['H(1/8)'] < F('.80') and P['H(13/50)'] < F('1.11') and P['H(1)'] < F('1.97')
              and P['bracket(7/25)'] < F('.96') and P['bracket(1)'] < F('.54'))
    check(checks, '7. the useful bounds .80, 1.11, 1.97 (line 279) and margins .96, .54 (line 287) follow', useful)

    # the cited checker is not in the release (a fact, not a check of the mathematics)
    root = os.path.join(CLONE, DIR)
    listing = sorted(os.path.relpath(os.path.join(dp, f), root) for dp, _, fs in os.walk(root) for f in fs)
    anywhere = [os.path.join(dp, f) for dp, _, fs in os.walk(os.path.join(CLONE, 'preprints')) for f in fs if f.startswith('network_bounds')]
    facts = {'cited_checker': 'support/network_bounds.py (04-certificate.tex:294)',
             'cited_checker_in_release': os.path.exists(os.path.join(root, 'support', 'network_bounds.py')) or bool(anywhere),
             'release_files': listing}

    ok = all(c['pass'] for c in checks)
    value = {'H_recipe_bounds': {k: '%.10f' % float(v[0]) for k, v in vals.items() if k.startswith('H(')},
             'H_true_enclosures': {k: ['%.12f' % float(v[1]), '%.12f' % float(v[2])] for k, v in vals.items() if k.startswith('H(')},
             'brackets_paper_series': {k: '%.10f' % float(v[0]) for k, v in vals.items() if k.startswith('bracket')},
             'brackets_independent': {k: '%.10f' % float(v[1]) for k, v in vals.items() if k.startswith('bracket')},
             'facts': facts, 'seconds': round(time.time() - t0, 2)}
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: the five rational inequalities of Section 4 (H(1/8), H(13/50), H(1) and the two '
                       'entropy brackets at 7/25 and 1) with every supporting finite fact the text states (closed form of h_j '
                       'from its definition, h_j <= sqrt(2/M), increasing ratios, the 169/70 tail cap, slopes 7/3 and 3/2, the '
                       '25/24 slope bound) — not the probabilistic/asymptotic arguments, and not the headline, which rests on '
                       'the factorial proof of Section 3; this section is the paper\'s independent second route'}


def forge():
    """each must NOT certify"""
    out = []
    out.append(('printed H(1/8) < .791402 -> .791401', decide(printed={'H(1/8)': '.791401'})['verdict']))
    out.append(('printed bracket at rho = 1 below .515374 -> .515373', decide(printed={'bracket(1)': '.515373'})['verdict']))
    out.append(('the tail cap 169/(70*1024) -> 168/(70*1024) (i.e. sqrt2 < 1.4)', decide(tail_cap=F(168, 70 * 1024))['verdict']))
    out.append(('the closed form with q -> q+1 in (net:hj)', decide(qshift=1)['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    v = dict(res['value'])
    v['facts'] = dict(v['facts'], release_files='%d files: %s' % (len(v['facts']['release_files']), ', '.join(v['facts']['release_files'])))
    print(json.dumps({'verdict': res['verdict'], 'decides': res['decides'], 'value': v}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('%.2fs' % (time.time() - t))
    print(forge())
