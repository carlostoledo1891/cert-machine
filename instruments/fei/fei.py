"""fei.py — the Fourier entropy–influence constant C71 of Tao's optimization-constants registry: its asterisked lower bound
6.521845710923046575 (Numaro, Zenodo 10.5281/zenodo.21497769, CC BY 4.0), decided from the published truth table.

Standard library only; written from the registry's definition and the artifact's stated convention, not from the
claimant's checker (check_c71_n18.py, mpmath intervals — pinned by sha256, not run by this decision).

THE BOUND. For a Boolean f : {-1,+1}^n -> {-1,+1} with Fourier weights w_S = fhat(S)^2, the FEI constant satisfies
H[f] <= C I[f], H = sum_S w_S log2(1/w_S), I = sum_S |S| w_S. The amplification rule (O'Donnell–Tan 2013, Hod 2017 Prop
1.2 — cited, not re-proved) gives, for g BALANCED (fhat(emptyset) = 0) with H[g] > 0,  C_71 >= H[g] / (I[g] - 1).

WHAT IS DECIDED. The truth table (bit x of the published hex set <=> f(x) = -1, bound by the published sha256 of the
comma-joined table); the integer Walsh–Hadamard transform a_S = 2^n fhat(S) (exact); balance a_empty = 0; Parseval
sum a_S^2 = 4^n; I as an exact Fraction; H grouped by |a_S| (w = a^2/4^n, log2(1/w) = 2n - 2 log2 |a|) with log2 of each
distinct |a| enclosed in Decimal intervals (ln correctly rounded in a named context and widened one unit in the last
place, every other operation rounded outward); the ratio's enclosure against the registry's number. Also decided: the
function is logic-monotone (the artifact's second claim), and the record it beat is below the new lower end."""
import hashlib
import json
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN
from fractions import Fraction as Fr

PREC = 60
DN = Context(prec=PREC, rounding=ROUND_FLOOR)
UP = Context(prec=PREC, rounding=ROUND_CEILING)
NE = Context(prec=PREC, rounding=ROUND_HALF_EVEN)


def table(n, true_hex):
    mask = int(true_hex, 16)
    if mask >> (1 << n):
        raise ValueError('REFUSED: the mask has bits beyond 2^n inputs')
    return [-1 if (mask >> x) & 1 else 1 for x in range(1 << n)]


def wht(t):
    a = list(t)
    h = 1
    while h < len(a):
        for i in range(0, len(a), 2 * h):
            for j in range(i, i + h):
                u, v = a[j], a[j + h]
                a[j], a[j + h] = u + v, u - v
        h *= 2
    return a                                     # a_S = sum_x f(x) (-1)^{S.x} = 2^n fhat(S)


def monotone(t, n):
    """logic-monotone (TRUE = -1): turning an input TRUE never turns the output from TRUE to FALSE"""
    for i in range(n):
        b = 1 << i
        for x in range(1 << n):
            if not x & b and t[x] == -1 and t[x | b] == 1:
                return False
    return True


def ln_iv(k):
    """[lo, hi] around ln k for a positive integer k: the correctly rounded value, one ulp outward"""
    v = NE.ln(Decimal(k))
    return NE.next_minus(v), NE.next_plus(v)


def decide(artifact, threshold, record=None):
    n = int(artifact['n'])
    t = table(n, artifact['true_hex'])
    checks = []
    sha = hashlib.sha256(','.join(str(v) for v in t).encode()).hexdigest()
    checks.append({'name': 'the truth table is the one the artifact binds by sha256', 'ok': sha == artifact['sha256_table']})
    a = wht(t)
    N4 = 4 ** n
    checks.append({'name': 'balanced: fhat(emptyset) = 0', 'ok': a[0] == 0})
    checks.append({'name': 'Parseval: sum of the weights is 1', 'ok': sum(v * v for v in a) == N4})
    I = Fr(sum(v * v * bin(S).count('1') for S, v in enumerate(a)), N4)
    checks.append({'name': 'I = %s, the artifact\'s %s' % (I, artifact['I']), 'ok': I == Fr(artifact['I'])})
    counts = {}
    for v in a:
        if v:
            counts[abs(v)] = counts.get(abs(v), 0) + 1
    # H = sum_k cnt_k (k^2/4^n) (2n - 2 log2 k);  log2 k = ln k / ln 2
    l2 = ln_iv(2)
    H_lo = H_hi = Decimal(0)
    for k, cnt in sorted(counts.items()):
        wk = Fr(cnt * k * k, N4)
        w_lo = DN.divide(Decimal(wk.numerator), Decimal(wk.denominator))
        w_hi = UP.divide(Decimal(wk.numerator), Decimal(wk.denominator))
        lk = ln_iv(k)
        log2_lo = DN.divide(lk[0], l2[1]) if k > 1 else Decimal(0)
        log2_hi = UP.divide(lk[1], l2[0]) if k > 1 else Decimal(0)
        term_lo = DN.subtract(Decimal(2 * n), UP.multiply(Decimal(2), log2_hi))       # 2n - 2 log2 k, lower end
        term_hi = UP.subtract(Decimal(2 * n), DN.multiply(Decimal(2), log2_lo))
        if term_lo < 0:
            raise ArithmeticError('a weight above 1')
        H_lo = DN.add(H_lo, DN.multiply(w_lo, term_lo))
        H_hi = UP.add(H_hi, UP.multiply(w_hi, term_hi))
    den = I - 1
    if den <= 0:
        raise ArithmeticError('I <= 1: the amplification rule does not apply')
    r_lo = DN.divide(DN.multiply(H_lo, Decimal(den.denominator)), Decimal(den.numerator))
    r_hi = UP.divide(UP.multiply(H_hi, Decimal(den.denominator)), Decimal(den.numerator))
    checks.append({'name': 'H > 0', 'ok': H_lo > 0})
    thr = Decimal(threshold)
    checks.append({'name': 'H/(I-1) > %s, the registry\'s bound' % threshold, 'ok': r_lo > thr})
    checks.append({'name': 'the artifact\'s certified floor %s... is inside the enclosure' % artifact['ratio_lo_dec'][:24],
                   'ok': Decimal(artifact['ratio_lo_dec']) <= r_hi and r_lo <= Decimal(artifact['ratio_hi_dec'])})
    if record:
        checks.append({'name': 'above the record it replaced (%s...)' % record[:20], 'ok': r_lo > Decimal(record)})
    checks.append({'name': 'logic-monotone (the artifact\'s second claim; the bound then holds among monotone functions too)', 'ok': monotone(t, n)})
    ok = all(c['ok'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'n': n, 'I': str(I), 'distinctWeights': len(counts), 'nonzero': sum(counts.values()),
            'ratio': [str(r_lo)[:44], str(r_hi)[:44]], 'H': [str(H_lo)[:30], str(H_hi)[:30]]}


if __name__ == '__main__':
    import os
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    art = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '..', 'corpus', 'optimization-constants', 'num2026', 'fei_c71_n18_artifact.json')))
    r = decide(art, '6.521845710923046575', art.get('record_dec'))
    print(json.dumps(r, indent=1))
