"""fei.py — the Fourier entropy–influence constant C71 of Tao's optimization-constants registry: its asterisked lower bound
6.521845710923046575 (Numaro, Zenodo 10.5281/zenodo.21497769, CC BY 4.0), decided from the published truth table.

Standard library only; written from the registry's definition and the artifact's stated convention, not from the
claimant's checker (check_c71_n18.py, mpmath intervals — pinned by sha256, not run by this decision).

THE BOUND. For a Boolean f : {-1,+1}^n -> {-1,+1} with Fourier weights w_S = fhat(S)^2, the FEI constant satisfies
H[f] <= C I[f], H = sum_S w_S log2(1/w_S), I = sum_S |S| w_S. The amplification rule (O'Donnell–Tan 2013, Hod 2017 Prop
1.2 — cited, not re-proved) gives, for g BALANCED (fhat(emptyset) = 0) with H[g] > 0 and I[g] > 1, C_71 >= H[g] / (I[g] - 1).

WHAT IS DECIDED. The truth table (bit x of the published hex set <=> f(x) = -1, no bit at or beyond 2^n, bound by the
published sha256 of the comma-joined table); the integer Walsh–Hadamard transform a_S = 2^n fhat(S) (exact); balance
a_empty = 0; Parseval sum a_S^2 = 4^n; I as an exact Fraction against the artifact's stated I; I > 1; H grouped by |a_S|
(w = a^2/4^n, log2(1/w) = 2n - 2 log2 |a|) with |a| = 2^v m, m odd, and log2 |a| = v + log2 m — EXACT when |a| is a
power of two (log2 1 = 0), otherwise log2 m = ln m / ln 2 with each ln in a Decimal interval (correctly rounded in a
named context and widened one unit in the last place, every other operation rounded outward); H > 0; the ratio's
enclosure against the registry's number. Also decided: the artifact's printed floor against the enclosure, the record
it beat against the new enclosure, and the function logic-monotone (the artifact's second claim).

THE THREE WORDS (instruments/verdict.js; the method paper's composition rule). Every check carries one.
  A failed precondition is REFUSED with its reason: a mask beyond 2^n or an unreadable table, the binding, balance,
  Parseval, the stated I, I <= 1, H <= 0, the artifact's printed floor outside the enclosure. When a precondition of the
  rule fails (the binding, balance, Parseval, I > 1, H > 0) the bound, the floor and the record are NOT DECIDED —
  REFUSED, never refuted — and when the binding fails so is monotonicity.
  The bound against its bar, and the record the same way: CERTIFIED iff r_lo > bar, REFUTED iff r_hi <= bar, REFUSED
  otherwise (the enclosure straddles the bar). Monotonicity false is REFUTED.
  The verdict composes the checks: REFUTED if any is refuted, else REFUSED if any is refused, else CERTIFIED; 'why'
  names the first check, in order, that carries that word. decide() returns rather than raises on any malformed input.

PRINTED ENCLOSURES are rounded outward — the lower end down, the upper end up — to 43 significant digits (the ratio) and
29 (H), so the printed interval contains the value.

CORRECTED 2026-10-19 (found by tools/verify_fei.js's planted claims against this file at sha256 5825dc47…, commit
470fe0b2): the verdict had two words, REFUTED for every failed check — a broken binding, an unbalanced table, a
contradicted I and a bar inside the enclosure alike, and a TRUE bar 10^-75 below the value; log2 of a power of two was
an interval, so an exact boundary could not be refuted and a weight of exactly 1 raised 'a weight above 1' before the
I <= 1 test was reached; the printed enclosure was a truncation (str()[:44], str()[:30]), its upper end below the value;
ln_iv accepted k <= 0."""
import hashlib
import json
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING, ROUND_HALF_EVEN, InvalidOperation
from fractions import Fraction as Fr

PREC = 60
DN = Context(prec=PREC, rounding=ROUND_FLOOR)
UP = Context(prec=PREC, rounding=ROUND_CEILING)
NE = Context(prec=PREC, rounding=ROUND_HALF_EVEN)
PRINT = Context(prec=PREC + 10)              # quantizing for print only; the decision never reads it
RATIO_DIGITS, H_DIGITS = 43, 29

CERTIFIED, REFUTED, REFUSED = 'CERTIFIED', 'REFUTED', 'REFUSED'


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
    if isinstance(k, bool) or not isinstance(k, int) or k <= 0:
        raise ValueError('ln_iv: k must be a positive integer, got %r' % (k,))
    v = NE.ln(Decimal(k))
    return NE.next_minus(v), NE.next_plus(v)


def log2_iv(k):
    """[lo, hi] around log2 k for a positive integer k = 2^v m, m odd: exactly [v, v] when m = 1, else
    v + ln m / ln 2 with every operation rounded outward"""
    if isinstance(k, bool) or not isinstance(k, int) or k <= 0:
        raise ValueError('log2_iv: k must be a positive integer, got %r' % (k,))
    v = (k & -k).bit_length() - 1
    m = k >> v
    if m == 1:
        return Decimal(v), Decimal(v)
    lm, l2 = ln_iv(m), ln_iv(2)
    return DN.add(Decimal(v), DN.divide(lm[0], l2[1])), UP.add(Decimal(v), UP.divide(lm[1], l2[0]))


def outward(x, digits, up):
    """x at `digits` significant digits, rounded toward +infinity (up) or -infinity, in fixed point"""
    if not x:
        x = Decimal(0)                           # an exact zero under ROUND_FLOOR comes out -0 (4 - 4); print it as 0
    e = (x.adjusted() if x else 0) - (digits - 1)
    return format(x.quantize(Decimal(1).scaleb(e), rounding=ROUND_CEILING if up else ROUND_FLOOR, context=PRINT), 'f')


def compose(words):
    """a conjunction of checks: REFUTED if any is refuted, else REFUSED if any is refused, else CERTIFIED"""
    return REFUTED if REFUTED in words else REFUSED if REFUSED in words else CERTIFIED


def gt(lo, hi, bar):
    """'value > bar' for a value known to lie in [lo, hi]: the 'gt' line of instruments/verdict.js"""
    return CERTIFIED if lo > bar else REFUTED if hi <= bar else REFUSED


def _check(name, verdict, why=None):
    c = {'name': name, 'ok': verdict == CERTIFIED, 'verdict': verdict}
    if why:
        c['why'] = why
    return c


def _result(checks, n=None, I=None, distinct=None, nonzero=None, ratio=None, H=None):
    verdict = compose([c['verdict'] for c in checks])
    why = None
    if verdict != CERTIFIED:
        c = next(c for c in checks if c['verdict'] == verdict)
        why = c['name'] + (': ' + c['why'] if c.get('why') else '')
    return {'verdict': verdict, 'why': why, 'checks': checks, 'n': n, 'I': I, 'distinctWeights': distinct, 'nonzero': nonzero,
            'ratio': ratio, 'H': H}


def decide(artifact, threshold, record=None):
    try:
        n = int(artifact['n'])
        if not 1 <= n <= 24:
            raise ValueError('n = %d is outside 1..24' % n)
        t = table(n, artifact['true_hex'])
    except (KeyError, TypeError, ValueError) as e:
        why = str(e).replace('REFUSED: ', '') or type(e).__name__
        return _result([_check('the truth table reads: hexadecimal, no input at or beyond 2^n', REFUSED, why)])
    checks = []
    sha = hashlib.sha256(','.join(str(v) for v in t).encode()).hexdigest()
    bound = sha == artifact.get('sha256_table')
    checks.append(_check('the truth table is the one the artifact binds by sha256', CERTIFIED if bound else REFUSED,
                         None if bound else 'the table hashes to %s..., the artifact names %s' % (sha[:16], str(artifact.get('sha256_table'))[:16] + '...')))
    a = wht(t)
    N4 = 4 ** n
    checks.append(_check('balanced: fhat(emptyset) = 0', CERTIFIED if a[0] == 0 else REFUSED,
                         None if a[0] == 0 else 'fhat(emptyset) = %s; the amplification rule needs a balanced g' % Fr(a[0], 1 << n)))
    sq = sum(v * v for v in a)
    checks.append(_check('Parseval: sum of the weights is 1', CERTIFIED if sq == N4 else REFUSED, None if sq == N4 else 'sum a_S^2 = %d, not 4^n' % sq))
    I = Fr(sum(v * v * bin(S).count('1') for S, v in enumerate(a)), N4)
    try:
        stated = Fr(artifact['I'])
    except (KeyError, TypeError, ValueError, ZeroDivisionError):
        stated = None
    checks.append(_check('I = %s, the artifact\'s %s' % (I, artifact.get('I')), CERTIFIED if stated == I else REFUSED,
                         None if stated == I else 'the artifact\'s own table gives I = %s' % I))
    checks.append(_check('I > 1: the amplification rule applies', CERTIFIED if I > 1 else REFUSED, None if I > 1 else 'I = %s; the rule needs I > 1' % I))
    counts = {}
    for v in a:
        if v:
            counts[abs(v)] = counts.get(abs(v), 0) + 1
    # H = sum_k cnt_k (k^2/4^n) (2n - 2 log2 k)
    H_lo = H_hi = Decimal(0)
    for k, cnt in sorted(counts.items()):
        if k > 1 << n:
            raise ArithmeticError('|a_S| = %d exceeds 2^n = %d: a weight above 1, which no +-1 table has' % (k, 1 << n))
        wk = Fr(cnt * k * k, N4)
        w_lo = DN.divide(Decimal(wk.numerator), Decimal(wk.denominator))
        w_hi = UP.divide(Decimal(wk.numerator), Decimal(wk.denominator))
        lg = log2_iv(k)
        term_lo = DN.subtract(Decimal(2 * n), UP.multiply(Decimal(2), lg[1]))       # 2n - 2 log2 k, lower end
        term_hi = UP.subtract(Decimal(2 * n), DN.multiply(Decimal(2), lg[0]))
        if term_lo < 0:
            term_lo = Decimal(0)                 # 2n - 2 log2 k >= 0 exactly, since k <= 2^n: a sound lower end
        H_lo = DN.add(H_lo, DN.multiply(w_lo, term_lo))
        H_hi = UP.add(H_hi, UP.multiply(w_hi, term_hi))
    checks.append(_check('H > 0', CERTIFIED if H_lo > 0 else REFUSED, None if H_lo > 0 else
                         ('H = 0 exactly' if H_hi == 0 else 'H > 0 is not established') + '; the rule needs H > 0'))
    r_lo = r_hi = None
    den = I - 1
    if den > 0:
        r_lo = DN.divide(DN.multiply(H_lo, Decimal(den.denominator)), Decimal(den.numerator))
        r_hi = UP.divide(UP.multiply(H_hi, Decimal(den.denominator)), Decimal(den.numerator))
    gate = next((c for c in checks if c['verdict'] != CERTIFIED and not c['name'].startswith('I = ')), None)
    not_decided = 'not decided: "%s" failed' % gate['name'] if gate else None
    try:
        thr = Decimal(threshold)
    except (InvalidOperation, TypeError, ValueError):
        thr = None
    name = 'H/(I-1) > %s, the registry\'s bound' % threshold
    if gate:
        checks.append(_check(name, REFUSED, not_decided))
    elif thr is None:
        checks.append(_check(name, REFUSED, 'the bar is not a decimal number'))
    else:
        w = gt(r_lo, r_hi, thr)
        checks.append(_check(name, w, None if w == CERTIFIED else 'the ratio is at most the bar: r_hi <= %s' % threshold if w == REFUTED
                             else 'the enclosure straddles the bar: nothing is proved either way'))
    name = 'the artifact\'s certified floor %s... is inside the enclosure' % str(artifact.get('ratio_lo_dec'))[:24]
    if gate:
        checks.append(_check(name, REFUSED, not_decided))
    else:
        try:
            ok = Decimal(artifact['ratio_lo_dec']) <= r_hi and r_lo <= Decimal(artifact['ratio_hi_dec'])
            checks.append(_check(name, CERTIFIED if ok else REFUSED, None if ok else 'the artifact\'s printed [floor, ceiling] does not meet the enclosure'))
        except (KeyError, TypeError, InvalidOperation):
            checks.append(_check(name, REFUSED, 'the artifact prints no readable floor and ceiling'))
    if record:
        name = 'above the record it replaced (%s...)' % record[:20]
        if gate:
            checks.append(_check(name, REFUSED, not_decided))
        else:
            w = gt(r_lo, r_hi, Decimal(record))
            checks.append(_check(name, w, None if w == CERTIFIED else 'the ratio is at most the record' if w == REFUTED else 'the enclosure straddles the record'))
    name = 'logic-monotone (the artifact\'s second claim; the bound then holds among monotone functions too)'
    if not bound:
        checks.append(_check(name, REFUSED, 'not decided: the table is not the one the artifact binds'))
    else:
        m = monotone(t, n)
        checks.append(_check(name, CERTIFIED if m else REFUTED, None if m else 'an input turned TRUE turns the output from TRUE to FALSE'))
    ratio = [outward(r_lo, RATIO_DIGITS, False), outward(r_hi, RATIO_DIGITS, True)] if r_lo is not None else None
    return _result(checks, n, str(I), len(counts), sum(counts.values()), ratio, [outward(H_lo, H_DIGITS, False), outward(H_hi, H_DIGITS, True)])


if __name__ == '__main__':
    import os
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    art = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', '..', 'corpus', 'optimization-constants', 'num2026', 'fei_c71_n18_artifact.json')))
    r = decide(art, '6.521845710923046575', art.get('record_dec'))
    print(json.dumps(r, indent=1))
