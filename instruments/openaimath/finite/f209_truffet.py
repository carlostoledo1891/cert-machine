"""F-209 — "Randomized quasipolynomial-time mean-payoff games" (openai/math family 104): the Truffet counterexample.

THE CLAIM. A side result in the appendix (09-comparison.tex:1-82; announced at 01-introduction.tex:185-191), not the
paper's main theorem (the randomized quasipolynomial mean-payoff algorithm, which this row does not touch):
  09-comparison.tex:12-19   min x1 subject to max(x1,x2) >= 0, x1 >= max(x2+1,-2). "The point (0,-1) is feasible.
                            ... a feasible point with x1 < 0 would have x2 <= x1-1 < 0, contradicting the first
                            constraint. Thus the true minimum is exactly zero."
  09-comparison.tex:21-40   homogenised rows max(x1,x2) >= h, x1 >= max(x2+1,h-2), objective z >= x1; Truffet's (5b)
                            holds for both ordered pairs of rows (x1 = x2 = 0, h increasing); both variables have lower
                            or upper occurrences (Def. 4.2, eq. 34); search endpoints mu = 0, lambda = -4 contain the
                            witness (0,-1,0) and satisfy (23b): 1 + lambda = -3 < -2 + mu = -2.
  09-comparison.tex:42-64   the occurrence table (x1: lower rows 1,2, upper none; x2: lower row 1, upper row 2);
                            (53a) makes the dominating set exactly {x2}; (53b) leaves the unique pair (1,2); the rule
                            saturates x2 = h. "There is no tie-breaking choice in this step."
  09-comparison.tex:66-76   then row 2 requires x1 >= h+1, the next eligible saturation sets x1 = h+1, the stopping
                            test (39) fails before each substitution, the objective depends on x1 at both stages (no
                            switch); at h = 0 the output value is 1, whereas the minimum is 0. "The first substitution
                            already removes every optimum."
  lean/ComparatorChallenges/TruffetCounterexample.lean:93-128  the formal statement: Truffet's rule as definitions
                            (lower, upper, dominating, eligible, stop, switch, failure, lowerForm, substitute, cleanup,
                            advance, ForcedSingletonStep), three printed states (initial, middle, finalState), and a
                            13-conjunct theorem finite_execution_not_optimal. Only the statement was read (it ends in
                            `sorry`); the proof module was not opened before this decider ran.

WHAT IS DECIDED HERE, exactly (Fractions; bottom = None, ordered below every number, absorbing for +):
  1. The original program's minimum is exactly 0. The feasible set is the union, over a choice of one left-hand
     term per right-hand term of each row, of polyhedra in (x1, x2) (max(L) >= max(R) iff every R-term is dominated
     by some L-term). Each piece is decided by exact Fourier-Motzkin elimination of x2 with provenance, and the
     resulting lower bound on x1 is re-verified a second way as a Farkas certificate (a nonnegative combination of
     the piece's own inequalities equal to x1 >= m), recombined from the original rows; (0,-1) attains 0. The set of
     optima is {x1 = 0, x2 <= -1}, and the program with x2 = h = 0 adjoined has minimum 1: the first saturation
     removes every optimum.
  2. Every conjunct of finite_execution_not_optimal, with the challenge's definitions transcribed literally (the
     transcription is matched against the challenge file's text): the two ForcedSingletonStep's with all nine of
     their conditions each (well-formedness, bounded, not stop, not switch, not failure, the eligible set is exactly
     the named singleton, the substituted cost is not null, and the printed next state equals advance), the final
     stop, feasibility of output (1,0,0) and better (0,-1,0), the two saturation identities, the cost equality and
     0 < 1. crossRowRestriction (for all real alpha there is w with lhs_i(w) < alpha + rhs_r(w)) is quantified over
     the reals, so it is decided by an argument whose hypotheses are checked exactly: when lhs_i has no h term and
     rhs_r has one (coefficient c), w = (0, 0, L - c - alpha + 1) gives lhs_i(w) = L and alpha + rhs_r(w) >=
     L + 1 (L = lhs_i(0,0,0)); the witness is also instantiated exactly at sample alphas.
  3. Every prose claim of the appendix that is a finite fact about the instance (items above): the occurrence table
     cell by cell, D = {x2}, the eligible set, the saturations, the stop test, the switch test, the h=0 value 1,
     the (23b) arithmetic and the witness inside R_{lambda,mu} = [lambda,inf]^2 x [mu,inf].
  4. Independently of the printed middle/final states, the rule is SIMULATED from the initial state (advance while
     the eligible set is a singleton and the stop test fails) and its output value is compared with the exact minimum.

WHAT IS NOT DECIDED. Whether the challenge's definitions (and this transcription of them) faithfully encode
Truffet's arXiv:2603.26423v4 is a reading, not an exact fact; that paper is not in the release. For the record, the
v4 TeX source (arXiv src, sha256 38f5196a54a0bbfe208276db11be9be9c744743065f082f827cd9927ffe935b4, fetched
2026-10-09) was read by hand against it: (24) condExistgeq a+_ij != -inf and a+_ij > a-_ij = `lower`; (32)
condExistleq = `upper`; (53a) eqDomvar D = {x_j : I<= != 0 and I>= != 0} = `dominating`; (53b) eqdefID restricts
I>= to D when D is nonempty = `eligible`; (39) eqchok A+_{.h} >= A-_{.h} = `stop`; (28) f>=_ij = `lowerForm`;
setrowtozero (8) = `cleanup`; (5b) maximalitycondition = `crossRowRestriction` — they agree. Theorem 4.3's theta
selection is not modelled (it is vacuous on a singleton I>=). Nothing here bears on the paper's main theorem.
"""
import os
import sys
import time
from fractions import Fraction as Fr
from itertools import product

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

PAPER = 'preprints/Randomized-quasipolynomial-time-mean-payoff-games-September-25-2026/build/source/sections/09-comparison.tex'
MAIN = 'preprints/Randomized-quasipolynomial-time-mean-payoff-games-September-25-2026/build/source/main.tex'
LEAN = 'lean/ComparatorChallenges/TruffetCounterexample.lean'
LEANJ = 'lean/ComparatorChallenges/TruffetCounterexample.json'
BOT = None
Hc = 2           # the homogenisation column; variables are columns 0 (x1) and 1 (x2)
VARS = (0, 1)
ROWS = (0, 1)    # 0-based, as the challenge indexes them; the paper's rows 1 and 2


# ---------------------------------------------------------------- WithBot over Q

def wadd(a, b):
    return None if a is None or b is None else a + b


def wmax(*xs):
    v = [x for x in xs if x is not None]
    return max(v) if v else None


def wle(a, b):
    if a is None:
        return True
    return b is not None and a <= b


def wlt(a, b):
    if b is None:
        return False
    return a is None or a < b


def F(*xs):
    return tuple(None if x is None else Fr(x) for x in xs)


NULL = F(None, None, None)


def ev(f, w):
    return wmax(*(wadd(f[k], Fr(w[k])) for k in range(3)))


# ---------------------------------------------------------------- the challenge's definitions, transcribed

def State(rows, cost, remaining):
    return {'rows': tuple(rows), 'cost': cost, 'remaining': frozenset(remaining)}


def wellFormed(s):
    return all(s['cost'][j] is None and all(s['rows'][i][0][j] is None and s['rows'][i][1][j] is None for i in ROWS)
               for j in VARS if j not in s['remaining'])


def feasible(s, w):
    return all(wle(ev(s['rows'][i][1], w), ev(s['rows'][i][0], w)) for i in ROWS)


def lower(s, i, j):
    L, R = s['rows'][i]
    return L[j] is not None and wlt(R[j], L[j])


def upper(s, i, j):
    L, R = s['rows'][i]
    return R[j] is not None and wlt(L[j], R[j])


def dominating(s, j):
    return j in s['remaining'] and any(lower(s, i, j) for i in ROWS) and any(upper(s, i, j) for i in ROWS)


def eligible(s, i, j):
    return j in s['remaining'] and lower(s, i, j) and ((not any(dominating(s, k) for k in VARS)) or dominating(s, j))


def bounded(s):
    return all(any(lower(s, i, j) for i in ROWS) or any(upper(s, i, j) for i in ROWS) for j in s['remaining'])


def stop(s):
    return all(wle(s['rows'][i][1][Hc], s['rows'][i][0][Hc]) for i in ROWS)


def switch(s):
    return (all(s['cost'][j] is None for j in s['remaining']) and not stop(s) and len(s['remaining']) > 0
            and not any(lower(s, i, j) for i in ROWS for j in s['remaining'])
            and any(upper(s, i, j) for i in ROWS for j in s['remaining']))


def failure(s):
    return not stop(s) and (len(s['remaining']) == 0 or (not any(lower(s, i, j) for i in ROWS for j in s['remaining'])
                                                         and not any(upper(s, i, j) for i in ROWS for j in s['remaining'])))


def lowerForm(s, i, j):
    L, R = s['rows'][i]
    a = L[j] if L[j] is not None else Fr(0)          # WithBot.unbotD 0
    return tuple(None if k == j else wadd(R[k], -a) for k in range(3))


def substitute(f, j, g):
    return tuple(None if k == j else wmax(f[k], wadd(f[j], g[k])) for k in range(3))


def cleanup(row):
    L, R = row
    return (NULL, NULL) if all(wle(R[k], L[k]) for k in range(3)) else row


def advance(s, i, j):
    g = lowerForm(s, i, j)
    return State([cleanup((substitute(s['rows'][r][0], j, g), substitute(s['rows'][r][1], j, g))) for r in ROWS],
                 substitute(s['cost'], j, g), [k for k in s['remaining'] if k != j])


def forced_singleton_step(s, s2, i, j):
    """the nine conditions of ForcedSingletonStep s s2 i j, each decided"""
    elig = {(r, k) for r in ROWS for k in VARS if eligible(s, r, k)}
    return [('wellFormed s', wellFormed(s)), ('wellFormed s\'', wellFormed(s2)), ('bounded s', bounded(s)),
            ('not stop s', not stop(s)), ('not switch s', not switch(s)), ('not failure s', not failure(s)),
            ('eligible set = {(%d,%d)} exactly (found %s)' % (i, j, sorted(elig)), elig == {(i, j)}),
            ('substituted cost is not null', any(x is not None for x in substitute(s['cost'], j, lowerForm(s, i, j)))),
            ('s\' = advance s %d %d' % (i, j), advance(s, i, j) == s2)]


def cross_row_restriction(s):
    """for all real alpha exists w: lhs_i(w) < alpha + rhs_r(w), i != r; decided by a checked argument"""
    out = []
    for i, r in ((0, 1), (1, 0)):
        Li, Rr = s['rows'][i][0], s['rows'][r][1]
        hyp = Li[Hc] is None and Rr[Hc] is not None
        inst = True
        if hyp:
            L0 = ev(Li, (0, 0, 0))
            for alpha in (Fr(-10 ** 9), Fr(-7, 3), Fr(0), Fr(5, 2), Fr(10 ** 9)):
                t = (L0 if L0 is not None else Fr(0)) - Rr[Hc] - alpha + 1
                w = (0, 0, t)
                inst = inst and wlt(ev(Li, w), wadd(alpha, ev(Rr, w)))
        out.append(((i, r), hyp and inst))
    return out


# ---------------------------------------------------------------- the exact minimum (Fourier-Motzkin with provenance)

def pieces(s, h=Fr(0)):
    """the feasible set at h as a union of polyhedra: lists of (a1, a2, b, tag) meaning a1 x1 + a2 x2 >= b"""
    per_row = []
    for i in ROWS:
        L, R = s['rows'][i]
        rterms = [k for k in range(3) if R[k] is not None]
        lterms = [k for k in range(3) if L[k] is not None]
        if not rterms:
            per_row.append([[]])
            continue
        if not lterms:
            per_row.append([])      # max(empty) >= something finite: infeasible
            continue
        alts = []
        for choice in product(lterms, repeat=len(rterms)):
            ineqs = []
            for kr, kl in zip(rterms, choice):
                # L[kl] + w_kl >= R[kr] + w_kr
                a = [Fr(0), Fr(0), Fr(0)]
                a[kl] += 1
                a[kr] -= 1
                b = R[kr] - L[kl] - a[2] * h
                ineqs.append((a[0], a[1], b, 'row%d: %s >= %s %+d' % (i + 1, 'x1 x2 h'.split()[kl], 'x1 x2 h'.split()[kr], R[kr] - L[kl])))
            alts.append(ineqs)
        per_row.append(alts)
    return [sum(c, []) for c in product(*per_row)]


def fm(P, extra=(), keep=0):
    """exact Fourier-Motzkin: eliminate the other variable from {a1 x1 + a2 x2 >= b} and return the bounds on
    x_keep as (status, lo, hi, certificate-for-lo); status 'infeasible' or 'ok'. The certificate is the vector of
    nonnegative multipliers (over the inequalities) whose combination is exactly x_keep >= lo."""
    elim = 1 - keep
    rows = [((a1, a2)[keep], (a1, a2)[elim], b, {n: Fr(1)}) for n, (a1, a2, b, _) in enumerate(list(P) + list(extra))]
    pos = [r for r in rows if r[1] > 0]
    neg = [r for r in rows if r[1] < 0]
    derived = [r for r in rows if r[1] == 0]
    for p in pos:
        for q in neg:
            lp, lq = -q[1], p[1]
            prov = {}
            for d, lam in ((p[3], lp), (q[3], lq)):
                for n, v in d.items():
                    prov[n] = prov.get(n, 0) + lam * v
            derived.append((lp * p[0] + lq * q[0], Fr(0), lp * p[2] + lq * q[2], prov))
    lo, hi, best = None, None, None
    for a, _, b, prov in derived:
        if a == 0:
            if b > 0:
                return 'infeasible', None, None, prov
        elif a > 0:
            if lo is None or b / a > lo:
                lo, best = b / a, {n: c / a for n, c in prov.items()}
        elif hi is None or b / a < hi:
            hi = b / a
    if lo is not None and hi is not None and lo > hi:
        return 'infeasible', lo, hi, None
    return 'ok', lo, hi, best


def fm_min_x1(P, extra=()):
    st, lo, hi, cert = fm(P, extra, 0)
    if st == 'infeasible':
        return 'infeasible', None, None
    if lo is None:
        return 'unbounded', None, None
    return 'min', lo, cert


def farkas_ok(P, extra, cert, m):
    """second way: the multipliers are nonnegative and recombine the piece's own inequalities into exactly x1 >= m"""
    allr = list(P) + list(extra)
    if any(c < 0 for c in cert.values()):
        return False
    a1 = sum(c * allr[n][0] for n, c in cert.items())
    a2 = sum(c * allr[n][1] for n, c in cert.items())
    b = sum(c * allr[n][2] for n, c in cert.items())
    return a1 == 1 and a2 == 0 and b == m


def exact_min(s, extra=()):
    """min of x1 at h = 0 over the union of pieces, every piece decided two ways"""
    out = []
    for P in pieces(s):
        st, m, cert = fm_min_x1(P, extra)
        ok2 = st != 'min' or farkas_ok(P, extra, cert, m)
        out.append((st, m, ok2, [t for *_, t in P]))
    mins = [m for st, m, _, _ in out if st == 'min']
    if any(st == 'unbounded' for st, *_ in out):
        return None, out
    return (min(mins) if mins else 'infeasible'), out


def simulate(s, cap=5):
    """run the rule from s while the eligible set is a singleton and the stop test fails"""
    trace = [s]
    for _ in range(cap):
        if stop(s) or not s['remaining']:
            break
        elig = sorted((r, k) for r in ROWS for k in VARS if eligible(s, r, k))
        if len(elig) != 1:
            return trace, 'not forced: %s' % elig
        s = advance(s, *elig[0])
        trace.append(s)
    return trace, 'ok'


# ---------------------------------------------------------------- the published objects

INITIAL = State([(F(0, 0, None), F(None, None, 0)), (F(0, None, None), F(None, 1, -2))], F(0, None, None), VARS)
MIDDLE = State([(NULL, NULL), (F(0, None, None), F(None, None, 1))], F(0, None, None), [0])
FINAL = State([(NULL, NULL), (NULL, NULL)], F(None, None, 1), [])
OUTPUT = (Fr(1), Fr(0), Fr(0))
BETTER = (Fr(0), Fr(-1), Fr(0))
LEAN_TEXT = ['rows := ![⟨![(0 : Coeff), 0, ⊥], ![⊥, ⊥, (0 : Coeff)]⟩,',
             '⟨![(0 : Coeff), ⊥, ⊥], ![⊥, (1 : Coeff), ((-2 : ℝ) : Coeff)]⟩]',
             'cost := ![(0 : Coeff), ⊥, ⊥]',
             'rows := ![⟨nullForm, nullForm⟩,\n    ⟨![(0 : Coeff), ⊥, ⊥], ![⊥, ⊥, (1 : Coeff)]⟩]',
             'remaining := fun j => j = 0',
             'rows := fun _ => ⟨nullForm, nullForm⟩\n  cost := ![⊥, ⊥, (1 : Coeff)]\n  remaining := fun _ => False',
             'def output : Fin 3 → ℝ := ![1, 0, 0]', 'def better : Fin 3 → ℝ := ![0, -1, 0]',
             'max (f 0 + (w 0 : Coeff)) (max (f 1 + (w 1 : Coeff)) (f 2 + (w 2 : Coeff)))',
             '(s.rows i).lhs (column j) ≠ ⊥ ∧\n    (s.rows i).rhs (column j) < (s.rows i).lhs (column j)',
             '(s.rows i).rhs (column j) ≠ ⊥ ∧\n    (s.rows i).lhs (column j) < (s.rows i).rhs (column j)',
             's.remaining j ∧ (∃ i, lower s i j) ∧ ∃ i, upper s i j',
             's.remaining j ∧ lower s i j ∧ ((∃ k, dominating s k) → dominating s j)',
             'def stop (s : State) : Prop := ∀ i, (s.rows i).rhs 2 ≤ (s.rows i).lhs 2',
             '(s.rows i).rhs k + ((-WithBot.unbotD 0 ((s.rows i).lhs (column j)) : ℝ) : Coeff)',
             'if k = column j then ⊥ else max (f k) (f (column j) + g k)',
             'exact if ∀ k, r.rhs k ≤ r.lhs k then ⟨nullForm, nullForm⟩ else r',
             'eval (s.rows i).lhs w < (α : Coeff) + eval (s.rows r).rhs w',
             'ForcedSingletonStep initial middle 0 1 ∧', 'ForcedSingletonStep middle finalState 1 0 ∧',
             'eval initial.cost better < eval finalState.cost output := by\n  sorry']


def decide(src=None, initial=INITIAL, middle=MIDDLE, final=FINAL, output=OUTPUT, better=BETTER, claimed_min=Fr(0)):
    src = src or Sources()
    checks = []
    tex = src.text(PAPER)
    flat = ' '.join(tex.split())
    main = src.text(MAIN)
    lean = src.text(LEAN)
    src.text(LEANJ)
    check(checks, 'the appendix prints the instance (09-comparison.tex:12-19) and is an appendix of the paper',
          '\\min x_1\\quad\\text{subject to}\\quad \\max(x_1,x_2)\\ge0,\\qquad x_1\\ge\\max(x_2+1,-2).' in flat
          and '\\appendix\n\\input{sections/09-comparison}' in main, 'side result; NOT the paper\'s main theorem')
    missing = [t for t in LEAN_TEXT if t not in lean]
    check(checks, 'the transcription matches the challenge statement text (%d fragments)' % len(LEAN_TEXT), not missing, '; '.join(missing))
    check(checks, 'the challenge statement is a statement (one sorry, theorem finite_execution_not_optimal)',
          lean.count('sorry') == 1 and 'theorem finite_execution_not_optimal' in lean)

    # ---- 1. the original program, exactly (h = 0)
    m, parts = exact_min(initial)
    check(checks, 'every piece of the feasible set decided two ways (Fourier-Motzkin; Farkas recombination)',
          all(ok2 for _, _, ok2, _ in parts), '; '.join('%s %s %s' % (st, mm, tags) for st, mm, _, tags in parts))
    check(checks, '(0,-1) is feasible (09-comparison.tex:17)', feasible(initial, (0, -1, 0)))
    check(checks, 'the true minimum is exactly %s (no feasible x1 < 0; 09-comparison.tex:17-19)' % claimed_min,
          m == claimed_min and feasible(initial, (claimed_min, -1, 0)), 'exact min %s' % m)
    m_x2, _ = exact_min(initial, extra=[(Fr(0), Fr(1), Fr(0), 'x2>=h'), (Fr(0), Fr(-1), Fr(0), 'x2<=h')])
    check(checks, 'the first saturation removes every optimum: with x2 = h = 0 adjoined the minimum is %s > %s' % (m_x2, m),
          isinstance(m_x2, Fr) and isinstance(m, Fr) and m_x2 > m)
    # the optimal set: the pieces intersected with x1 <= m, projected on x2 by eliminating x1
    proj = []
    for P in pieces(initial):
        st, lo2, hi2, _ = fm(P, [(Fr(-1), Fr(0), -m if isinstance(m, Fr) else Fr(0), 'x1<=min')], keep=1)
        proj.append((st, lo2, hi2))
    feas = [(lo2, hi2) for st, lo2, hi2 in proj if st == 'ok']
    check(checks, 'the optimal set is {x1 = 0, x2 <= -1}: of the pieces cut by x1 <= 0 one is infeasible, the other projects to x2 in (-inf, -1]',
          len(feas) == 1 and feas[0] == (None, Fr(-1)) and feasible(initial, (0, -1, 0)), str(proj))

    # ---- 2. the challenge's thirteen conjuncts
    cr = cross_row_restriction(initial)
    check(checks, 'crossRowRestriction initial (Truffet (5b), both ordered pairs; checked argument + instances)', all(ok for _, ok in cr), str(cr))
    for (s, s2, i, j, name) in ((initial, middle, 0, 1, 'initial middle 0 1'), (middle, final, 1, 0, 'middle finalState 1 0')):
        for what, ok in forced_singleton_step(s, s2, i, j):
            check(checks, 'ForcedSingletonStep %s: %s' % (name, what), ok)
    check(checks, 'no variable remains in finalState', not final['remaining'])
    check(checks, 'stop finalState', stop(final))
    check(checks, 'feasible initial output = %s' % (tuple(str(x) for x in output),), feasible(initial, output))
    check(checks, 'feasible initial better = %s' % (tuple(str(x) for x in better),), feasible(initial, better))
    check(checks, 'output 2 = 0 and better 2 = 0 (h normalised to 0)', output[2] == 0 and better[2] == 0)
    check(checks, 'output 1 = eval (lowerForm initial 0 1) output (x2 = h)', ev(lowerForm(initial, 0, 1), output) == output[1])
    check(checks, 'output 0 = eval (lowerForm middle 1 0) output (x1 = h + 1)', ev(lowerForm(middle, 1, 0), output) == output[0])
    check(checks, 'eval initial.cost output = eval finalState.cost output', ev(initial['cost'], output) == ev(final['cost'], output))
    check(checks, 'eval initial.cost better < eval finalState.cost output', wlt(ev(initial['cost'], better), ev(final['cost'], output)),
          '%s < %s' % (ev(initial['cost'], better), ev(final['cost'], output)))

    # ---- 3. the appendix's prose, cell by cell
    table = {(0, 'lower'): {0, 1}, (0, 'upper'): set(), (1, 'lower'): {0}, (1, 'upper'): {1}}
    for (j, kind), rows in table.items():
        found = {i for i in ROWS if (lower if kind == 'lower' else upper)(initial, i, j)}
        check(checks, 'occurrence table: x%d %s-bound rows = %s' % (j + 1, kind, sorted(r + 1 for r in rows) or 'none'), found == rows,
              'found %s' % sorted(r + 1 for r in found))
    check(checks, '(53a) the dominating set is exactly {x2}', {j for j in VARS if dominating(initial, j)} == {1})
    check(checks, '(53b) the eligible pairs are exactly {(row 1, x2)}: no tie-breaking',
          {(i, j) for i in ROWS for j in VARS if eligible(initial, i, j)} == {(0, 1)})
    check(checks, 'the saturation is x2 = h', lowerForm(initial, 0, 1) == F(None, None, 0))
    check(checks, 'after it, row 2 reads x1 >= h + 1 and row 1 is trivially satisfied (setrowtozero)',
          advance(initial, 0, 1)['rows'] == ((NULL, NULL), (F(0, None, None), F(None, None, 1))))
    check(checks, 'the next saturation is x1 = h + 1, forced', lowerForm(middle, 1, 0) == F(None, None, 1)
          and {(i, j) for i in ROWS for j in VARS if eligible(middle, i, j)} == {(1, 0)})
    check(checks, 'the stop test (39) fails before both substitutions and holds after', not stop(initial) and not stop(middle) and stop(final))
    check(checks, 'the objective depends on x1 at both stages, so the switch rule does not apply',
          initial['cost'][0] is not None and middle['cost'][0] is not None and not switch(initial) and not switch(middle))
    check(checks, 'both variables have lower or upper occurrences (Def. 4.2, eq. 34)', bounded(initial))
    check(checks, 'each left side lacks an h term; the other row\'s right side has one',
          all(initial['rows'][i][0][Hc] is None for i in ROWS) and all(initial['rows'][i][1][Hc] is not None for i in ROWS))
    lam, mu = Fr(-4), Fr(0)
    check(checks, '(23b) for max(x2+1, h-2): 1 + lambda = -3 < -2 + mu = -2', 1 + lam == -3 and -2 + mu == -2 and 1 + lam < -2 + mu)
    check(checks, 'the witness (0,-1,0) lies in R = [lambda,inf]^2 x [mu,inf] with lambda = -4, mu = 0',
          all(lam <= x for x in (0, -1)) and mu <= 0)
    check(checks, 'normalised to h = 0 the rule\'s objective value is 1', ev(final['cost'], (0, 0, 0)) == 1)

    # ---- 4. the rule simulated from the initial state alone
    trace, how = simulate(initial)
    out_val = ev(trace[-1]['cost'], (0, 0, 0)) if how == 'ok' else None
    check(checks, 'simulated from the initial state: %d forced steps, output value %s, exact minimum %s; output > minimum' % (len(trace) - 1, out_val, m),
          how == 'ok' and stop(trace[-1]) and out_val is not None and isinstance(m, Fr) and out_val > m, how)
    check(checks, 'the simulation reproduces the printed middle and final states', len(trace) == 3 and trace[1] == middle and trace[2] == final)

    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component (the appendix side result, not the main theorem): on the printed two-variable '
                       'instance the true minimum is exactly 0, while the substitution rule as formalised in the challenge '
                       'is forced through x2 = h, x1 = h + 1 to value 1; all 13 conjuncts of finite_execution_not_optimal. '
                       'Faithfulness of the formalisation to Truffet v4 is a reading, not decided.',
            'value': {'true_min': str(m), 'min_with_x2_eq_h': str(m_x2), 'rule_output_value': str(out_val)}}


def forge():
    out = []
    # 1. the +1 in row 2 removed: x1 >= max(x2, h-2). The rule then ends at value 0, which is the minimum.
    ini = State([(F(0, 0, None), F(None, None, 0)), (F(0, None, None), F(None, 0, -2))], F(0, None, None), VARS)
    trace, how = simulate(ini)
    r = decide(initial=ini, middle=trace[1], final=trace[-1], output=(Fr(0), Fr(0), Fr(0)), better=BETTER)
    out.append(('row 2 offset +1 -> +0 (rule output %s, minimum %s)' % (r['value']['rule_output_value'], r['value']['true_min']), r['verdict']))
    # 2. the printed middle state with x1 >= h + 2
    mid = State([(NULL, NULL), (F(0, None, None), F(None, None, 2))], F(0, None, None), [0])
    out.append(('printed middle state x1 >= h + 2', decide(middle=mid)['verdict']))
    # 3. the "better" point moved to (0, 0, 0) (infeasible: 0 >= 0 + 1 fails)
    out.append(('better point (0,0,0)', decide(better=(Fr(0), Fr(0), Fr(0)))['verdict']))
    # 4. a wrong printed minimum (-1)
    out.append(('claimed true minimum -1', decide(claimed_min=Fr(-1))['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%d checks, %.2fs' % (len(res['checks']), time.time() - t))
    print(json.dumps(res['sources'], indent=1))
    for f in forge():
        print('FORGE', f)
