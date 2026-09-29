"""Independent exact decider: rank-two-mixed-norm (two results).

Standard library only.  Every irrational number in this case is x**(a/b) for a
rational x >= 0 and rational a/b > 0; it is enclosed as
      [ r / (q*K) , (r+1) / (q*K) ]   with  r = floor( (p*q**(b-1) * K**b) ** (1/b) ),
x**a = p/q, K = 2**BITS, where the integer b-th root is computed by integer Newton
iteration and then CHECKED (r**b <= N < (r+1)**b).  Every enclosure is a pair of
Fractions; all quantities are nonnegative, so interval sums/products are endpointwise.
Perfect roots are detected and kept exact.  No float and no Decimal is used.

Mixed norm (case.tex): ||X||_{p,q} = ( sum_j ( sum_i |x_ij|^p )^{q/p} )^{1/q}
  (inner sum over rows i, outer over columns j).

Result mixed-norm-general-s: A, B >= 0 integer 3x2, p = q = 3/2:
      ||A^T B||_{p,q}^2 > ||A^T A||_{q,q} * ||B^T B||_{p,p}.
Result yufei-psd: Z = X X^T, X has 21 rows w_g^{5/6} y_g (multiplicities m_g),
      (s,q) = (6/5, 6):  ||Z||_{s,q}^2 > ||Z||_{s,s} * ||Z||_{q,q}.
Both inequalities are decided in the form  U^{e1} > V^{e2} W^{e3}  with U, V, W the
q-th / p-th powers of the norms and integer exponents e (both sides raised to the
lcm of the exponent denominators), so the only roots taken are inside U, V, W.
"""
import json
import os
import re
import copy
from fractions import Fraction as Fr
from math import gcd, isqrt

CASE = 'rank-two-mixed-norm'
BITS = 420
K = 1 << BITS

# The interval printed in case.tex for R_Z (Theorem thm:mixed); compared only.
TEX_RZ_LO = Fr('1.00000061733911154365777590600087863798')
TEX_RZ_HI = Fr('1.00000061733911154365777590600087863800')
TEX_DELTA = Fr('-5.150045302282868288532184137690370433502833719528')  # "..." after it


# ---------------------------------------------------------------- integer roots
def iroot(n, k):
    """floor(n ** (1/k)) for integers n >= 0, k >= 1, verified."""
    if n < 0 or k < 1:
        raise ValueError
    if n < 2 or k == 1:
        return n
    x = 1 << -(-n.bit_length() // k)          # 2**ceil(bits/k) >= root
    while True:
        y = ((k - 1) * x + n // x ** (k - 1)) // k
        if y >= x:
            break
        x = y
    while x ** k > n:
        x -= 1
    while (x + 1) ** k <= n:
        x += 1
    assert x ** k <= n < (x + 1) ** k
    return x


def rpow(x, e):
    """Enclosure (lo, hi) of x**e for rational x >= 0, rational e > 0."""
    x, e = Fr(x), Fr(e)
    assert x >= 0 and e > 0
    if x == 0:
        return Fr(0), Fr(0)
    a, b = e.numerator, e.denominator
    y = x ** a
    p, q = y.numerator, y.denominator
    N = p * q ** (b - 1)
    r0 = iroot(N, b)
    if r0 ** b == N:                           # exact root
        v = Fr(r0, q)
        return v, v
    Nk = N * K ** b
    r = iroot(Nk, b)
    return Fr(r, q * K), Fr(r + 1, q * K)


def ipow(iv, e):
    """Enclosure of t**e for t in iv = (lo, hi), lo >= 0, e > 0 (monotone)."""
    lo, hi = iv
    return rpow(lo, e)[0], rpow(hi, e)[1]


def iadd(a, b):
    return a[0] + b[0], a[1] + b[1]


def imul(a, b):
    assert a[0] >= 0 and b[0] >= 0
    return a[0] * b[0], a[1] * b[1]


def iscale(c, a):
    c = Fr(c)
    assert c >= 0
    return c * a[0], c * a[1]


def snap(a):
    """Outward-round an enclosure to the grid 2**-BITS (keeps fractions small)."""
    lo = Fr((a[0].numerator * K) // a[0].denominator, K)
    hi = Fr(-((-a[1].numerator * K) // a[1].denominator), K)
    return lo, hi


def lcm(a, b):
    return a * b // gcd(a, b)


def decide_power_inequality(U, aU, V, aV, W, aW):
    """Decide U^aU > V^aV * W^aW (U, V, W > 0 enclosures, a's positive rationals).
    Returns (state, ratio_enclosure_of (U^aU / (V^aV W^aW)) ** (1/Dn) ... ) where state is
    'gt' (certified >), 'le' (certified <=), or 'open'."""
    Dn = 1
    for a in (aU, aV, aW):
        Dn = lcm(Dn, Fr(a).denominator)
    eU, eV, eW = int(aU * Dn), int(aV * Dn), int(aW * Dn)
    lhs_lo, lhs_hi = U[0] ** eU, U[1] ** eU
    rhs_lo, rhs_hi = V[0] ** eV * W[0] ** eW, V[1] ** eV * W[1] ** eW
    if lhs_lo > rhs_hi:
        state = 'gt'
    elif lhs_hi <= rhs_lo:
        state = 'le'
    else:
        state = 'open'
    ratio = (lhs_lo / rhs_hi, lhs_hi / rhs_lo)  # enclosure of (LHS/RHS)^{Dn}
    return state, ratio, Dn, (eU, eV, eW)


def mixed_q_power(Mx, p, q):
    """Enclosure of ||Mx||_{p,q}^q = sum_j (sum_i |m_ij|^p)^{q/p} for a rational matrix."""
    rows, cols = len(Mx), len(Mx[0])
    tot = (Fr(0), Fr(0))
    for j in range(cols):
        inner = (Fr(0), Fr(0))
        for i in range(rows):
            inner = iadd(inner, rpow(abs(Fr(Mx[i][j])), p))
        tot = iadd(tot, snap(ipow(snap(inner), Fr(q) / Fr(p))))
    return snap(tot)


def fr_to_str(x, digits):
    """Decimal string of a nonnegative Fraction truncated (floor) to `digits` places."""
    s = (x.numerator * 10 ** digits) // x.denominator
    return '%d.%0*d' % (s // 10 ** digits, digits, s % 10 ** digits)


def printed_agrees(printed, enc):
    """The printed decimal lies within enc widened by one unit of its last printed digit."""
    s = printed.strip()
    frac = s.split('.')[1] if '.' in s else ''
    ulp = Fr(1, 10 ** len(frac))
    v = Fr(s)
    return enc[0] - ulp <= v <= enc[1] + ulp, len(frac)


# ---------------------------------------------------------------- symbolic deficit (p = q = 3/2)
def squarefree_split(n):
    """n = a^2 * b with b squarefree (trial division; n is small here)."""
    a, b, d = 1, 1, 2
    m = n
    while d * d <= m:
        while m % (d * d) == 0:
            a *= d
            m //= d * d
        if m % d == 0:
            b *= d
            m //= d
        d += 1
    return a, b * m


def sym_three_halves(Mx, coeff, acc):
    """acc[b] += coeff * (sum of |m|^{3/2}) written as sum c_b sqrt(b), b squarefree."""
    for row in Mx:
        for v in row:
            v = abs(int(v))
            if v == 0:
                continue
            a, b = squarefree_split(v)
            acc[b] = acc.get(b, 0) + coeff * v * a


def parse_sqrt_sum(s):
    acc = {}
    s = s.replace(' ', '')
    for term in re.findall(r'[+-]?[^+-]+', s):
        sign = -1 if term.startswith('-') else 1
        term = term.lstrip('+-')
        m = re.fullmatch(r'(?:(\d+)\*)?sqrt\((\d+)\)', term)
        if m:
            c = int(m.group(1) or 1)
            a, b = squarefree_split(int(m.group(2)))
            acc[b] = acc.get(b, 0) + sign * c * a
        elif re.fullmatch(r'\d+', term):
            acc[1] = acc.get(1, 0) + sign * int(term)
        else:
            raise ValueError('cannot parse term %r' % term)
    return {b: c for b, c in acc.items() if c}


# ---------------------------------------------------------------- the two results
def matT(A):
    return [list(r) for r in zip(*A)]


def matmul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]


def result_general(g, ck):
    need = []
    A = [[Fr(x) for x in r] for r in g['A']]
    B = [[Fr(x) for x in r] for r in g['B']]
    p, q = (Fr(x) for x in g['s_q'])
    need.append(ck('[general] 1 <= p <= q', 1 <= p <= q, 'p=%s q=%s' % (p, q)))
    need.append(ck('[general] A, B entrywise nonnegative, same number of rows',
                   all(x >= 0 for r in A + B for x in r) and len(A) == len(B)))
    AtA, BtB, AtB = matmul(matT(A), A), matmul(matT(B), B), matmul(matT(A), B)
    for nm, mine in (('AtA', AtA), ('BtB', BtB), ('AtB', AtB)):
        ck('[general] printed %s agrees with exact product' % nm,
           [[Fr(x) for x in r] for r in g.get(nm, [])] == mine, str([[str(x) for x in r] for r in mine]))
    U = mixed_q_power(AtB, p, q)          # ||A^T B||_{p,q}^q
    V = mixed_q_power(AtA, q, q)          # ||A^T A||_{q,q}^q
    W = mixed_q_power(BtB, p, p)          # ||B^T B||_{p,p}^p
    state, ratio, Dn, es = decide_power_inequality(U, 2 / q, V, 1 / q, W, 1 / p)
    ck('[general] ||A^T B||_{p,q}^2 > ||A^T A||_{q,q} ||B^T B||_{p,p}  (decided as '
       'U^%d > V^%d W^%d on enclosures of width <= 2^-%d)' % (es + (BITS - 8,)),
       state == 'gt', 'state=%s' % state)
    R = (rpow(ratio[0], Fr(1, 2 * Dn))[0], rpow(ratio[1], Fr(1, 2 * Dn))[1])
    ck('[general] ratio R = ||A^T B|| / sqrt(||A^T A|| ||B^T B||) enclosed',
       True, '[%s, %s]' % (fr_to_str(R[0], 50), fr_to_str(R[1] + Fr(1, 10 ** 50), 50)))
    if 'ratio' in g:
        ok, nd = printed_agrees(g['ratio'], R)
        ck('[general] printed ratio agrees to its %d printed digits' % nd, ok, g['ratio'])
    if p == q:
        delta = (V[0] + W[0] - 2 * U[1], V[1] + W[1] - 2 * U[0])  # sum|.|^p form (p = q)
        ck('[general] deficit Delta = S(AtA)+S(BtB)-2S(AtB) enclosed (S = sum |entry|^p)', True,
           '[%s, %s]' % (fr_to_str(-delta[1], 45), fr_to_str(-delta[0], 45)) + ' (negated: -Delta)')
        if 'deficit_decimal' in g:
            ok, nd = printed_agrees(g['deficit_decimal'].lstrip('-'), (-delta[1], -delta[0]))
            ck('[general] printed deficit_decimal agrees to its %d printed digits' % nd,
               ok and g['deficit_decimal'].startswith('-'), g['deficit_decimal'])
        ok_tex = -delta[1] - Fr(1, 10 ** 48) <= -TEX_DELTA <= -delta[0] + Fr(1, 10 ** 48)
        ck('[general] Delta printed in case.tex agrees (48 digits shown)', ok_tex, '-5.1500453022828682885...')
        if p == Fr(3, 2) and all(x.denominator == 1 for m in (AtA, BtB, AtB) for r in m for x in r) \
                and 'deficit_exact' in g:
            acc = {}
            sym_three_halves(AtA, 1, acc)
            sym_three_halves(BtB, 1, acc)
            sym_three_halves(AtB, -2, acc)
            acc = {b: c for b, c in acc.items() if c}
            try:
                pr = parse_sqrt_sum(g['deficit_exact'])
                ok = pr == acc
            except ValueError as e:
                ok, pr = False, str(e)
            ck('[general] printed deficit_exact equals the exact sqrt-form of Delta', ok,
               ' + '.join('%d*sqrt(%d)' % (c, b) for b, c in sorted(acc.items())))
            ck('[general] printed deficit_is_negative agrees', g.get('deficit_is_negative') == (delta[1] < 0))
        ck('[general] note: Delta < 0 is the case.tex route (then AM-GM); the decision above is direct',
           True, 'Delta < 0 certified: %s' % (delta[1] < 0))
    return all(need), state


def parse_dir(s):
    s = s.strip().strip('()')
    return tuple(Fr(x) for x in s.split(','))


def result_psd(c, ck):
    need = []
    w = [Fr(x) for x in c['weights']]
    mult = [int(x) for x in c['multiplicities']]
    ys = [parse_dir(d) for d in c['directions']]
    e = Fr(c['weight_exponent'])
    s, q = (Fr(x) for x in c['s_q'])
    ng = len(w)
    need.append(ck('[B=A] consistent group data', len(mult) == ng == len(ys) and all(m >= 1 for m in mult)
                   and all(len(y) == len(ys[0]) for y in ys), 'groups=%d' % ng))
    nrows = sum(mult)
    need.append(ck('[B=A] 1 <= s <= q', 1 <= s <= q, 's=%s q=%s' % (s, q)))
    ck('[B=A] Z has 21 rows as stated', nrows == 21, 'rows=%d' % nrows)
    need.append(ck('[B=A] X entrywise nonnegative (w_g > 0, y_g >= 0), so Z = X X^T is completely positive',
                   all(x > 0 for x in w) and all(t >= 0 for y in ys for t in y) and e > 0))
    # rank: X has 2 columns; rank 2 iff two rows are independent (positive scalings do not matter)
    dim = len(ys[0])
    indep = any(ys[a][0] * ys[b][1] - ys[a][1] * ys[b][0] != 0 for a in range(ng) for b in range(ng)) \
        if dim == 2 else False
    ck('[B=A] rank Z = 2 (X is 21x2 with two independent directions)', dim == 2 and indep)
    # explicit 21x21 index structure
    grp = [g for g in range(ng) for _ in range(mult[g])]
    cgh = [[sum(a * b for a, b in zip(ys[g], ys[h])) for h in range(ng)] for g in range(ng)]
    # |z_ij|^s = (w_g w_h)^{e s} c_gh^s ; |z_ij|^q = (w_g w_h)^{e q} c_gh^q ; all z >= 0
    zs = {}
    zq = {}
    for g in range(ng):
        for h in range(ng):
            if cgh[g][h] == 0:
                zs[g, h] = zq[g, h] = (Fr(0), Fr(0))
                continue
            zs[g, h] = imul(rpow(w[g] * w[h], e * s), rpow(cgh[g][h], s))
            zq[g, h] = imul(rpow(w[g] * w[h], e * q), rpow(cgh[g][h], q))
    Ssum = (Fr(0), Fr(0))
    Qsum = (Fr(0), Fr(0))
    Nsum = (Fr(0), Fr(0))
    for j in range(nrows):                      # column j
        inner = (Fr(0), Fr(0))
        for i in range(nrows):                  # row i
            inner = iadd(inner, zs[grp[i], grp[j]])
            Ssum = iadd(Ssum, zs[grp[i], grp[j]])
            Qsum = iadd(Qsum, zq[grp[i], grp[j]])
        Nsum = iadd(Nsum, snap(ipow(snap(inner), q / s)))
    ck('[B=A] ||Z||_{q,q}^q = sum z_ij^6 is an exact rational (no root taken)', Qsum[0] == Qsum[1],
       'Q = %s...' % fr_to_str(Qsum[0], 3))
    Ssum, Qsum, Nsum = snap(Ssum), snap(Qsum), snap(Nsum)
    state, ratio, Dn, es = decide_power_inequality(Nsum, 2 / q, Qsum, 1 / q, Ssum, 1 / s)
    ck('[B=A] ||Z||_{s,q}^2 > ||Z||_{s,s} ||Z||_{q,q}  (decided as N^%d > Q^%d S^%d, N = '
       '||Z||_{s,q}^q, Q = ||Z||_{q,q}^q, S = ||Z||_{s,s}^s)' % es, state == 'gt', 'state=%s' % state)
    R = (rpow(ratio[0], Fr(1, 2 * Dn))[0], rpow(ratio[1], Fr(1, 2 * Dn))[1])
    ck('[B=A] R_Z enclosed', True, '[%s, %s]' % (fr_to_str(R[0], 60), fr_to_str(R[1] + Fr(1, 10 ** 60), 60)))
    if 'ratio' in c:
        ok, nd = printed_agrees(c['ratio'], R)
        ck('[B=A] printed ratio agrees to its %d printed digits' % nd, ok, c['ratio'])
    ck('[B=A] case.tex interval [..798, ..800] contains R_Z', TEX_RZ_LO <= R[0] and R[1] <= TEX_RZ_HI)
    if 'threshold' in c:
        ck('[B=A] R_Z > printed threshold', R[0] > Fr(c['threshold']), c['threshold'])
    return all(need), state


def _load(root):
    if isinstance(root, dict):
        return root
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
        return json.load(f)


def decide(root):
    cert = _load(root)
    checks = []

    def ck(name, ok, detail=''):
        checks.append({'name': name, 'ok': bool(ok), 'detail': str(detail)})
        return bool(ok)

    claim = ('Two refutations of the Sah-Sawhney-Stoner-Zhao mixed-norm question: nonnegative integer '
             '3x2 matrices A, B with ||A^T B||_{3/2,3/2}^2 > ||A^T A||_{3/2,3/2} ||B^T B||_{3/2,3/2}, and a '
             '21x21 rank-two completely positive Z = X X^T with ||Z||_{6/5,6}^2 > ||Z||_{6/5,6/5} ||Z||_{6,6}.')
    verdicts = {}
    try:
        ok1, st1 = result_general(cert['mixed_norm_general_s'], ck)
    except (KeyError, ValueError, AssertionError, ZeroDivisionError) as ex:
        ok1, st1 = False, 'unreadable: %r' % ex
        ck('[general] witness readable', False, st1)
    try:
        ok2, st2 = result_psd(cert, ck)
    except (KeyError, ValueError, AssertionError, ZeroDivisionError) as ex:
        ok2, st2 = False, 'unreadable: %r' % ex
        ck('[B=A] witness readable', False, st2)
    for nm, hyp, st in (('mixed-norm-general-s', ok1, st1), ('yufei-psd', ok2, st2)):
        if hyp and st == 'gt':
            verdicts[nm] = 'CERTIFIED'
        elif (not hyp and not str(st).startswith('unreadable')) or st == 'le':
            verdicts[nm] = 'REFUTED'      # a hypothesis is false, or the inequality is decided the other way
        else:
            verdicts[nm] = 'REFUSED'      # straddles at this precision, or unreadable witness
    if all(v == 'CERTIFIED' for v in verdicts.values()):
        v, why = 'CERTIFIED', ''
    elif any(v == 'REFUTED' for v in verdicts.values()):
        v = 'REFUTED'
        why = 'per result: %s; failed: %s' % (verdicts, '; '.join(
            c['name'] for c in checks if not c['ok'] and 'printed' not in c['name'] and 'case.tex' not in c['name']))
    else:
        v = 'REFUSED'
        why = 'per result: %s; an enclosure straddles the decision at 2^-%d or the witness is unreadable' % (
            verdicts, BITS)
    return {'verdict': v, 'claim': claim, 'checks': checks, 'why': why, 'results': verdicts}


def forge(cert):
    """Move 3 of the 18 rows of group 2 into group 1 (multiplicities 1,18 -> 4,15).  Still a
    rank-two completely positive Gram matrix of order 21; the inequality no longer fails."""
    c = copy.deepcopy(cert)
    c['multiplicities'] = [4, 15, 1, 1]
    return c


def forge_general(cert):
    """Second forge, for the A != B witness: B[0][1] = 5 -> 4."""
    c = copy.deepcopy(cert)
    c['mixed_norm_general_s']['B'][0][1] = 4
    return c


if __name__ == '__main__':
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        here, '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    r = decide(root)
    print(CASE, '->', r['verdict'], r['results'])
    print('claim:', r['claim'])
    for c in r['checks']:
        print('  [%s] %s  %s' % ('ok' if c['ok'] else 'NO', c['name'], c['detail']))
    if r['why']:
        print('why:', r['why'])
    for fn in (forge, forge_general):
        f = decide(fn(_load(root)))
        print('%s ->' % fn.__name__, f['verdict'], f['results'])
        assert f['verdict'] != 'CERTIFIED'
