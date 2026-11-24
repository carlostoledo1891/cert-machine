#!/usr/bin/env python3
"""
Exact check of Proposition B.2 (crossing identity) for small parameters.
Uses sympy for polynomial determinants and exact integer arithmetic.
"""
import itertools
from sympy import symbols, Poly, Matrix, ZZ, QQ, eye, zeros, Integer
from sympy import binomial

X = symbols('X')
y = X**2

def energy_of(S):
    return sum(2*i + 1 for i in S)

def all_symbols(size, energy):
    """All (I, J) with |I|=|J|=size and energy(I)+energy(J)==energy.
    I, J finite subsets of N={0,1,2,...}, represented as sorted tuples."""
    if size == 0:
        return [((), ())] if energy == 0 else []
    # max element that can appear: energy >= 2*size*(something), but bound by energy
    # each element contributes at least 1, but 2i+1, so i <= (energy-1)/2
    max_el = (energy - 1) // 2
    candidates = []
    for comb in itertools.combinations(range(max_el + 1), size):
        e = energy_of(comb)
        if e <= energy:
            candidates.append((comb, e))
    result = []
    for (I, eI), (J, eJ) in itertools.product(candidates, repeat=2):
        if eI + eJ == energy:
            result.append((I, J))
    return result

def P(E):
    """Number of symbols of energy at most E (any size)."""
    if E < 0:
        return 0
    count = 0
    # size can be from 0 up to roughly sqrt(E)
    max_size = E  # crude
    for sz in range(0, E + 1):
        max_el = (E - 1) // 2 if E >= 1 else 0
        if sz > max_el + 1:
            break
        sets = []
        for comb in itertools.combinations(range(max_el + 1), sz):
            e = energy_of(comb)
            if e <= E:
                sets.append((comb, e))
        for (I, eI), (J, eJ) in itertools.product(sets, repeat=2):
            if eI + eJ <= E:
                count += 1
    return count

# Precompute B and C coefficients as polynomials in y
# B(r, n) = coeff of t^n in (1+t)^r / (1 + y*t)^{r+1}
# C(r, n) = coeff of t^n in (1 + y*t)^r / (1+t)^{r+1}

def series_coeffs(num_base, den_base, r, max_n, var=y):
    """Compute coefficients of t^0 .. t^{max_n} in num_base^r / den_base^{r+1}
    where num_base, den_base are linear in t: a + b*t.
    Use recurrence or binomial expansion.
    """
    # For B: (1+t)^r / (1 + y t)^{r+1}
    # = (1+t)^r * sum_{k=0}^infty binom(k+r, r) (-1)^k (y t)^k
    # but better to use sympy series or exact binomial for small
    from sympy import series, Poly
    t = symbols('t')
    if num_base == 'B':
        f = (1 + t)**r / (1 + var * t)**(r + 1)
    else:  # C
        f = (1 + var * t)**r / (1 + t)**(r + 1)
    s = series(f, t, 0, max_n + 1).removeO()
    coeffs = []
    p = Poly(s, t)
    for n in range(max_n + 1):
        coeffs.append(p.coeff_monomial(t**n))
    return coeffs

# Cache
_B_cache = {}
_C_cache = {}

def get_B(r, n):
    key = (r, n)
    if key not in _B_cache:
        # compute up to n
        if r not in [k[0] for k in _B_cache]:
            cs = series_coeffs('B', None, r, max(n, 20))
            for i, c in enumerate(cs):
                _B_cache[(r, i)] = c
        else:
            # extend if needed
            pass
    return _B_cache.get((r, n), Integer(0))

def get_C(r, n):
    key = (r, n)
    if key not in _C_cache:
        cs = series_coeffs('C', None, r, max(n, 20))
        for i, c in enumerate(cs):
            _C_cache[(r, i)] = c
    return _C_cache.get((r, n), Integer(0))

# Precompute for small r
for r in range(0, 30):
    series_coeffs('B', None, r, 30)
    series_coeffs('C', None, r, 30)
for r in range(0, 30):
    csB = series_coeffs('B', None, r, 30)
    csC = series_coeffs('C', None, r, 30)
    for n, c in enumerate(csB):
        _B_cache[(r, n)] = c
    for n, c in enumerate(csC):
        _C_cache[(r, n)] = c

def build_M(sa, sb, sc, sd):
    """Build the matrix M for four symbols.
    sa = (Ia, Ja), etc.
    Rows: Ia, Id, Ic, Ib
    Cols: Ja, Jd, Jc, Jb
    """
    Ia, Ja = sa
    Ib, Jb = sb
    Ic, Jc = sc
    Id, Jd = sd
    rows = list(Ia) + list(Id) + list(Ic) + list(Ib)
    cols = list(Ja) + list(Jd) + list(Jc) + list(Jb)
    n = len(rows)
    assert n == len(cols)
    M = zeros(n)
    # party offsets
    off_a = 0
    off_d = len(Ia)
    off_c = off_d + len(Id)
    off_b = off_c + len(Ic)
    # row parties and their elements
    row_parts = [('a', list(Ia)), ('d', list(Id)), ('c', list(Ic)), ('b', list(Ib))]
    col_parts = [('a', list(Ja)), ('d', list(Jd)), ('c', list(Jc)), ('b', list(Jb))]
    r_idx = 0
    for rp, r_els in row_parts:
        for i in r_els:
            c_idx = 0
            for cp, c_els in col_parts:
                for j in c_els:
                    # entry for row party rp, col party cp, elements i (row), j (col)
                    entry = entry_of(rp, cp, i, j)
                    M[r_idx, c_idx] = entry
                    c_idx += 1
            r_idx += 1
    return M

def entry_of(rp, cp, i, j):
    """Entry of M for row party rp, col party cp, row element i, col element j.
    From the table in the paper.
    """
    # Table:
    #     a          d              c                  b
    # a   0     C(i,j)      [i=j] X^{2i+1}    (y-1) X^{2i+1} B(i,j)
    # d  -C(j,i)   0        X^{2j+1} B(j,i)   -[i=j] X^{2i+1}
    # c  -[i=j]X^{2i+1}  -X^{2i+1} B(i,j)   0     -(y-1) C(i,j)
    # b  -(y-1)X^{2j+1} B(j,i)  [i=j] X^{2i+1}  (y-1) C(j,i)   0
    if rp == 'a' and cp == 'a':
        return Integer(0)
    if rp == 'a' and cp == 'd':
        return get_C(i, j)
    if rp == 'a' and cp == 'c':
        return (Integer(1) if i == j else Integer(0)) * X**(2*i + 1)
    if rp == 'a' and cp == 'b':
        return (y - 1) * X**(2*i + 1) * get_B(i, j)
    if rp == 'd' and cp == 'a':
        return -get_C(j, i)
    if rp == 'd' and cp == 'd':
        return Integer(0)
    if rp == 'd' and cp == 'c':
        return X**(2*j + 1) * get_B(j, i)
    if rp == 'd' and cp == 'b':
        return -(Integer(1) if i == j else Integer(0)) * X**(2*i + 1)
    if rp == 'c' and cp == 'a':
        return -(Integer(1) if i == j else Integer(0)) * X**(2*i + 1)
    if rp == 'c' and cp == 'd':
        return -X**(2*i + 1) * get_B(i, j)
    if rp == 'c' and cp == 'c':
        return Integer(0)
    if rp == 'c' and cp == 'b':
        return -(y - 1) * get_C(i, j)
    if rp == 'b' and cp == 'a':
        return -(y - 1) * X**(2*j + 1) * get_B(j, i)
    if rp == 'b' and cp == 'd':
        return (Integer(1) if i == j else Integer(0)) * X**(2*i + 1)
    if rp == 'b' and cp == 'c':
        return (y - 1) * get_C(j, i)
    if rp == 'b' and cp == 'b':
        return Integer(0)
    raise ValueError(f"bad parties {rp},{cp}")

def check_case(n1, e1, n2, e2, verbose=True):
    Sigma1 = all_symbols(n1, e1)
    Sigma2 = all_symbols(n2, e2)
    if not Sigma1 or not Sigma2:
        return None  # empty
    Theta = 2 * (e1 + e2)
    # Collect all Psi as dict of (sa,sb,sc,sd) -> Poly in X
    # We'll compute sum_N Psi_N = Psi at X=1, and the coefficients
    # First determine the expected matching after renaming, but per paper:
    # Psi at X=1 is epsilon * [Jc==Ia, Ic==Ja, Jb==Id, Ib==Jd]
    # We compute the actual values at X=1 and find consistent epsilon.
    results = {}
    matching_values = []
    nonmatching_values = []
    for sa, sc in itertools.product(Sigma1, repeat=2):
        for sb, sd in itertools.product(Sigma2, repeat=2):
            M = build_M(sa, sb, sc, sd)
            # det as polynomial
            det = M.det()
            # evaluate at X=1
            val1 = det.subs(X, 1)
            Ia, Ja = sa
            Ib, Jb = sb
            Ic, Jc = sc
            Id, Jd = sd
            is_match = (tuple(Jc) == tuple(Ia) and tuple(Ic) == tuple(Ja)
                        and tuple(Jb) == tuple(Id) and tuple(Ib) == tuple(Jd))
            if is_match:
                matching_values.append(val1)
            else:
                nonmatching_values.append(val1)
            # store coefficients of det, degree up to Theta
            p = Poly(det, X)
            coeffs = [p.coeff_monomial(X**k) for k in range(Theta + 1)]
            results[(sa, sb, sc, sd)] = (coeffs, val1, is_match)
    # Determine epsilon: should be constant on matching, 0 on nonmatching
    match_set = set(matching_values)
    non_set = set(nonmatching_values)
    ok_a_raw = (non_set == {0} or non_set == set()) and len(match_set) == 1
    epsilon = list(match_set)[0] if match_set else None
    # Now the tensors Psi_N : coefficient of X^N, then multiply by epsilon to normalize?
    # Paper: Psi_N defined as epsilon times the coeff of X^N, so that sum Psi_N = the identity
    # after renaming. For the check of (a), we report whether sum coeffs * epsilon gives the indicator.
    # For ranks, the rank is unaffected by the global sign epsilon.
    # Build the tensors for each N
    # Index the symbols
    s1_list = list(Sigma1)
    s2_list = list(Sigma2)
    s1_idx = {s: i for i, s in enumerate(s1_list)}
    s2_idx = {s: i for i, s in enumerate(s2_list)}
    N1 = len(s1_list)
    N2 = len(s2_list)
    # For each N, matrix for flattening {a,d}|{b,c}: rows (sa,sd), cols (sb,sc)
    # and {a,b}|{c,d}: rows (sa,sb), cols (sc,sd)
    rank_reports = []
    all_ok_b = True
    all_ok_c = True
    for N in range(Theta + 1):
        # tensor entries: coeff of X^N (raw, before *epsilon)
        # Flatten ad|bc
        mat_ad_bc = zeros(N1 * N2, N2 * N1)  # (sa,sd) x (sb,sc) wait N1 for a/c, N2 for b/d
        # rows: (ia, id) where ia index in Sigma1, id index in Sigma2
        # cols: (ib, ic) ib in Sigma2, ic in Sigma1
        for (sa, sb, sc, sd), (coeffs, _, _) in results.items():
            ia = s1_idx[sa]
            ib = s2_idx[sb]
            ic = s1_idx[sc]
            id_ = s2_idx[sd]
            entry = coeffs[N] if N < len(coeffs) else 0
            row = ia * N2 + id_
            col = ib * N1 + ic
            mat_ad_bc[row, col] = entry
        # Flatten ab|cd
        mat_ab_cd = zeros(N1 * N2, N1 * N2)
        # rows (sa,sb), cols (sc,sd)
        for (sa, sb, sc, sd), (coeffs, _, _) in results.items():
            ia = s1_idx[sa]
            ib = s2_idx[sb]
            ic = s1_idx[sc]
            id_ = s2_idx[sd]
            entry = coeffs[N] if N < len(coeffs) else 0
            row = ia * N2 + ib
            col = ic * N2 + id_
            mat_ab_cd[row, col] = entry
        # ranks over QQ
        rank_ad = mat_ad_bc.rank()
        rank_ab = mat_ab_cd.rank()
        bound_b = (N + 1) * P(N)
        Np = Theta - N
        bound_c = (Np + 1) * P(Np)
        ok_b = rank_ad <= bound_b
        ok_c = rank_ab <= bound_c
        all_ok_b &= ok_b
        all_ok_c &= ok_c
        rank_reports.append((N, rank_ad, bound_b, ok_b, rank_ab, bound_c, ok_c))
    # For (a): after multiplying by epsilon (the value at matching), the sum should be the indicator
    # of the renamed matching. We check that Psi at X=1 is epsilon on the paper's matching condition
    # and 0 elsewhere, and epsilon is a unit (sign, \pm1).
    return {
        'n1': n1, 'e1': e1, 'n2': n2, 'e2': e2,
        '|Sigma1|': N1, '|Sigma2|': N2, 'Theta': Theta,
        'ok_a_raw': ok_a_raw,
        'epsilon': epsilon,
        'epsilon_is_sign': epsilon in (-1, 1) if epsilon is not None else False,
        'all_ok_b': all_ok_b,
        'all_ok_c': all_ok_c,
        'ranks': rank_reports,
        'num_4tuples': len(results),
    }

if __name__ == '__main__':
    print("P(E) for E=0..12:")
    for E in range(13):
        print(f"  P({E}) = {P(E)}")
    print()
    cases = []
    for n1 in [1, 2]:
        for n2 in [1, 2]:
            for e1 in range(0, 7):
                for e2 in range(0, 7):
                    cases.append((n1, e1, n2, e2))
    print(f"Checking {len(cases)} potential cases...")
    computed = 0
    for n1, e1, n2, e2 in cases:
        res = check_case(n1, e1, n2, e2)
        if res is None:
            continue
        computed += 1
        print(f"\n=== (n1={n1}, e1={e1}, n2={n2}, e2={e2}) ===")
        print(f"|Sigma1|={res['|Sigma1|']}, |Sigma2|={res['|Sigma2|']}, Theta={res['Theta']}, 4-tuples={res['num_4tuples']}")
        print(f"(a) raw matching consistent: {res['ok_a_raw']}, epsilon={res['epsilon']}, is_sign={res['epsilon_is_sign']}")
        print(f"(b) all rank_ad <= bound: {res['all_ok_b']}")
        print(f"(c) all rank_ab <= bound: {res['all_ok_c']}")
        # print a few rank details if any fail, or summary
        fails_b = [r for r in res['ranks'] if not r[3]]
        fails_c = [r for r in res['ranks'] if not r[6]]
        if fails_b:
            print(f"  FAIL (b) at N: {fails_b[:5]}")
        if fails_c:
            print(f"  FAIL (c) at N: {fails_c[:5]}")
        # also print max ranks vs bounds for info
        max_r_ad = max(r[1] for r in res['ranks'])
        max_r_ab = max(r[4] for r in res['ranks'])
        print(f"  max rank_ad={max_r_ad}, max rank_ab={max_r_ab}")
    print(f"\nTotal nonempty cases computed: {computed}")
