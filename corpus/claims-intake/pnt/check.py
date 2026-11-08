#!/usr/bin/env python3
"""check.py - the standalone check for cert-machine claim #6: EinsteinArena solution 2506, "The Prime Number Theorem".

Re-runs on stock Python (standard library only) without cert-machine:

    python3 -I check.py                 # the claim, both readings, the score, the witnesses
    python3 -I check.py --json          # machine-readable (read by tools/record-claims-intake.js)
    python3 -I check.py --controls --json

Inputs: ../../einstein-arena/best-7.json (the platform's API record of solution 2506, fetched 2026-10-02) and
../inputs/einstein-arena-api-problems-prime-number-theorem_2026-11-08.json (the problem's statement; only its
description field is read); each refused unless its sha256 is the pinned one.

The statement: the server clips f to [-10, 10], sets f(1) so that sum_k f(k)/k = 0, checks
F(x) = sum_k f(k) floor(x/k) <= 1 + 1e-4 at 10^7 random x ~ U(1, 10 max k), and scores S(f) = -sum_k f(k) log(k)/k.
Decided here, exactly (every f(k) the rational its literal denotes; f(1) the exact rational):
  A  F(x) <= 1 for every real x >= 1 (the constraint; F is constant on [n, n+1)): refuted by any integer n with
     F(n) > 1, evaluated directly as sum_k f(k) floor(n/k);
  B  F(n) <= 1 + 1e-4 for every integer 1 <= n < 10 max k (the platform's check, made exhaustive);
  S  enclosed with rigorous logarithms and compared with the printed score (the platform's minImprovement, 1e-6).
Pre-registration: notes/claims-intake-preregistration-2026-11-08.md. MIT. Written by Claude under Carlos Toledo's
direction; shares no code with the JavaScript decider.
"""
import sys, os, json, hashlib
from fractions import Fraction
from math import gcd
from decimal import Decimal, getcontext

if hasattr(sys, 'set_int_max_str_digits'):
    sys.set_int_max_str_digits(0)
HERE = os.path.dirname(os.path.abspath(__file__))
WITNESS = os.path.join(HERE, '..', '..', 'einstein-arena', 'best-7.json')
WITNESS_SHA = '5382b697a7920edd92edc8c4770441925042bde3d3719456e84f248fbb8bd333'
STATEMENT = os.path.join(HERE, '..', 'inputs', 'einstein-arena-api-problems-prime-number-theorem_2026-11-08.json')
STATEMENT_SHA = '5e97cd89a653836230688934cdf92681e546ade47f0e2b2fad18b79ac3d2e20d'
STATED = ['1. Clips all values to $[-10, 10]$', '2. Adjusts $f(1)$ so that $\\sum_k f(k)/k = 0$ (normalization)',
          '3. Draws $10^7$ random samples $x \\sim \\mathrm{Uniform}(1,\\, 10 \\cdot \\max_k k)$ and checks $\\sum_k f(k)\\lfloor x/k \\rfloor \\le 1 + 10^{-4}$',
          '4. Returns $S(f) = -\\sum_k f(k) \\log(k) / k$']
MIN_IMPROVEMENT = Fraction('0.000001')
BITS = 224                                          # logarithms in binary fixed point, 2^-224


def refuse(msg):
    print('REFUSED: ' + msg)
    sys.exit(2)


def pinned(p, sha):
    raw = open(p, 'rb').read()
    got = hashlib.sha256(raw).hexdigest()
    if got != sha:
        refuse('%s hashes to %s, the pin is %s' % (os.path.basename(p), got, sha))
    return raw


def fx(q, d, up):
    """a Fraction at d decimals, rounded down (up=False) or up"""
    v = q.numerator * 10 ** d
    v = -((-v) // q.denominator) if up else v // q.denominator
    s = str(abs(v)).rjust(d + 1, '0')
    return ('-' if v < 0 else '') + s[:-d] + '.' + s[-d:]


def encl(q, d=30):
    return [fx(q, d, False), fx(q, d, True)]


def lcm_of(ks):
    L = 1
    for k in ks:
        L = L * k // gcd(L, k)
    return L


class Obj:
    """the object after the platform's steps 1 and 2, as integers over one denominator"""
    def __init__(self, items, f1=None):
        self.clipped = []
        keys, vals = [], []
        for k, v in items:
            q = Fraction(v)
            if q > 10 or q < -10:
                self.clipped.append(k)
                q = Fraction(10) if q > 10 else Fraction(-10)
            keys.append(k)
            vals.append(q)
        self.keys = keys
        den = 1
        for q in vals + ([f1] if f1 is not None else []):
            den = den * q.denominator // gcd(den, q.denominator)
        self.D = den
        self.a = [int(q * den) for q in vals]
        self.Lam = lcm_of([k for k in keys if k != 1])
        if f1 is None:                                   # step 2: f(1) = -sum_{k>=2} f(k)/k, = P/(Lam D)
            self.P = -sum(ak * (self.Lam // k) for k, ak in zip(keys, self.a) if k != 1)
        else:
            self.P = int(f1 * den) * self.Lam
        self.LD = self.Lam * self.D
        self.f1 = Fraction(self.P, self.LD)

    def direct(self, x):
        """F(x) * Lam * D for an integer x >= 0, evaluated as sum_k f(k) floor(x/k) (f(1) included)"""
        return x * self.P + self.Lam * sum(ak * (x // k) for k, ak in zip(self.keys, self.a) if k != 1)


def scan(o, N, count_not_one=False):
    g = [0] * N
    for k, ak in zip(o.keys, o.a):
        if k == 1 or k >= N or ak == 0:
            continue
        for m in range(k, N, k):
            g[m] += ak
    V = 0                                                # V(n) = F(n) Lam D, V(0) = 0
    thr1, thr2 = o.LD, 10001 * o.LD                      # F > 1 ;  10^4 F > 10^4 + 1
    over1 = over2 = not_one = 0
    first1, first2 = [], []
    maxV, maxN, minV, minN = None, None, 0, 0
    P, Lam = o.P, o.Lam
    for n in range(1, N):
        V += P
        if g[n]:
            V += Lam * g[n]
        if V > thr1:
            over1 += 1
            if len(first1) < 20:
                first1.append(n)
            if 10000 * V > thr2:
                over2 += 1
                if len(first2) < 20:
                    first2.append(n)
        if count_not_one and V != thr1:
            not_one += 1
        if maxV is None or V > maxV:
            maxV, maxN = V, n
        if V < minV:
            minV, minN = V, n
    return {'over1': over1, 'over2': over2, 'first1': first1, 'first2': first2, 'notOne': not_one,
            'maxN': maxN, 'maxV': maxV, 'minN': minN, 'minV': minV}


# ---------------- logarithms, enclosed ----------------
def atanh_inv(m, S):
    """atanh(1/m) * S enclosed, m >= 2"""
    lo, j, pw, terms = 0, 0, m, 0
    while True:
        lo += S // (pw * (2 * j + 1))
        terms += 1
        pw *= m * m
        j += 1
        tail = -(-(S * m * m) // ((2 * j + 1) * pw * (m * m - 1)))
        if tail <= 1:
            return lo, lo + terms + tail


def ln2_encl(S):
    a = atanh_inv(26, S)
    b = atanh_inv(4801, S)
    c = atanh_inv(8749, S)
    return 18 * a[0] - 2 * b[1] + 8 * c[0], 18 * a[1] - 2 * b[0] + 8 * c[1]


def ln_encl(k, S, ln2):
    """ln k * S enclosed: k = 2^e y, y in [1, 2), ln y = -ln(1 - t) = sum t^j / j, t = (k - 2^e)/k"""
    e = k.bit_length() - 1
    p, q = k - (1 << e), k
    lo, terms = 0, 0
    if p:
        num, den, j = p, q, 1
        while True:
            lo += (S * num) // (den * j)
            terms += 1
            num *= p
            den *= q
            j += 1
            tail = -(-(S * num * q) // (den * j * (q - p)))
            if tail <= 1:
                break
    hi = lo + terms + (tail if p else 0)
    return e * ln2[0] + lo, e * ln2[1] + hi


def score(o):
    S = 1 << BITS
    l2 = ln2_encl(S)
    lo = hi = 0
    for k, ak in zip(o.keys, o.a):
        if k == 1 or ak == 0:
            continue
        l, h = ln_encl(k, S, l2)
        w, den = -ak, k * o.D
        if w >= 0:
            lo += (w * l) // den
            hi += -((-w * h) // den)
        else:
            lo += (w * h) // den
            hi += -((-w * l) // den)
    return Fraction(lo, S), Fraction(hi, S), l2


def agreement(lo, hi, printed, tol):
    P = Fraction(printed)
    far = max(abs(P - lo), abs(P - hi))
    side = 'below' if P < lo else ('above' if P > hi else 'inside')
    return {'agrees': far <= tol, 'distanceUp': fx(far, 24, True), 'printedSide': side, 'tolerance': '0.000001'}


def mobius(N):
    mu = [1] * (N + 1)
    is_p = [True] * (N + 1)
    for p in range(2, N + 1):
        if is_p[p]:
            for m in range(p, N + 1, p):
                if m > p:
                    is_p[m] = False
                mu[m] = -mu[m]
            for m in range(p * p, N + 1, p * p):
                mu[m] = 0
    return mu


def main():
    args = sys.argv[1:]
    rec = json.loads(pinned(WITNESS, WITNESS_SHA).decode('utf-8'), parse_float=str, parse_int=str)
    st = json.loads(pinned(STATEMENT, STATEMENT_SHA).decode('utf-8'))
    desc = st['description']
    for line in STATED:
        if line not in desc:
            refuse('the pinned statement no longer reads: ' + line)
    if rec['id'] != '2506' or rec['agentName'] != 'CodexProLong':
        refuse('the witness is not solution 2506 by CodexProLong')
    printed = rec['score']
    items = [(int(k), v) for k, v in rec['data']['partial_function'].items()]
    if any(k < 1 for k, _ in items):
        refuse('a key that is not a positive integer')
    o = Obj(items)
    maxk = max(k for k, _ in items)
    N = 10 * maxk
    sc = scan(o, N)
    # the witnesses, each evaluated directly as sum_k f(k) floor(x/k), no identity used
    w1 = o.direct(1)
    wmax = o.direct(sc['maxN'])
    if wmax != sc['maxV']:
        refuse('the scan and the direct evaluation disagree at n = %d' % sc['maxN'])
    xm = o.Lam - 1 - sc['minN']
    wmir = o.direct(xm)
    phi = -(o.P + o.Lam * sum(ak for k, ak in zip(o.keys, o.a) if k != 1))      # Phi Lam D, Phi = -sum_k f(k)
    lo, hi, _ = score(o)
    ag = agreement(lo, hi, printed, MIN_IMPROVEMENT)
    A_refuted = w1 > o.LD or sc['over1'] > 0 or wmir > o.LD
    res = {
        'keys': len(items), 'maxKey': maxk, 'clipped': o.clipped, 'range': [1, N - 1], 'lcmDigits': len(str(o.Lam)),
        'f1': encl(o.f1), 'f1AboveOne': o.f1 > 1,
        'readingA': {'verdict': 'REFUTED' if A_refuted else 'REFUSED',
                     'witness1': {'x': 1, 'F': encl(Fraction(w1, o.LD)), 'aboveOne': w1 > o.LD},
                     'inRangeAboveOne': sc['over1'], 'firstInRange': sc['first1'],
                     'mirror': {'x': 'lcm(keys) - 1 - %d' % sc['minN'], 'xDigits': len(str(xm)), 'F': encl(Fraction(wmir, o.LD)),
                                'aboveOne': wmir > o.LD, 'equalsPhiMinusF': wmir == phi - sc['minV']}},
        'readingB': {'holds': sc['over2'] == 0, 'aboveTolerance': sc['over2'], 'firstAboveTolerance': sc['first2']},
        'max': {'n': sc['maxN'], 'F': encl(Fraction(sc['maxV'], o.LD)), 'belowTolBy': encl(Fraction(10001, 10000) - Fraction(sc['maxV'], o.LD))},
        'min': {'n': sc['minN'], 'F': encl(Fraction(sc['minV'], o.LD))},
        'phi': encl(Fraction(phi, o.LD)),
        'score': {'enclosure': [fx(lo, 40, False), fx(hi, 40, True)], 'printed': printed, 'agreement': ag},
    }
    res['verdict'] = 'REFUTED' if (A_refuted or not ag['agrees']) else 'REFUSED'
    out = {'issue': 6, 'solution': 2506, 'python': sys.version.split()[0], 'result': res}
    if '--controls' in args:
        C = {}
        bad = Fraction(printed) + Fraction('2e-6')
        C['K1'] = {'what': 'the printed score + 2e-6', 'verdict': 'CERTIFIED' if agreement(lo, hi, str(bad), MIN_IMPROVEMENT)['agrees'] else 'REFUTED'}
        o2 = Obj(items)                                  # every f(k), k >= 2, times 1001/1000, then step 2 again
        o2.a = [ak * 1001 for ak in o2.a]
        o2.D *= 1000
        o2.P *= 1001
        o2.LD = o2.Lam * o2.D
        o2.f1 = Fraction(o2.P, o2.LD)
        s2 = scan(o2, N)
        C['K2'] = {'what': 'f scaled by 1.001', 'readingBHolds': s2['over2'] == 0, 'aboveTolerance': s2['over2'], 'first': s2['first2'][:5]}
        mu = mobius(2000)
        om = Obj([(k, str(mu[k])) for k in range(2, 2001)], f1=Fraction(1))
        sm = scan(om, 2001, count_not_one=True)
        C['K3'] = {'what': 'f = mu on 1..2000, f(1) = 1, no normalization: F(n) = 1 for every n <= 2000', 'holds': sm['notOne'] == 0}
        S = 1 << BITS
        l2 = ln2_encl(S)
        getcontext().prec = 80
        pub = {2: '0.69314718055994530941723212145817656807550013436025',
               3: '1.09861228866810969139524523692252570464749055782274',
               10: '2.30258509299404568401799145468436420760110148862877'}
        okpub = True
        for k, s in pub.items():
            a, b = ln_encl(k, S, l2)
            p = Fraction(s)
            okpub = okpub and (Fraction(a, S) <= p + Fraction(1, 10 ** 50)) and (p <= Fraction(b, S))
        a6, b6 = ln_encl(6, S, l2)
        a2, b2 = ln_encl(2, S, l2)
        a3, b3 = ln_encl(3, S, l2)
        meets = max(a6, a2 + a3) <= min(b6, b2 + b3)
        okdec = True
        for k in o.keys:
            a, b = ln_encl(k, S, l2)
            d = Fraction(Decimal(k).ln())
            ulp = Fraction(1, 10 ** 75)
            okdec = okdec and Fraction(a, S) <= d + ulp and d - ulp <= Fraction(b, S)
        C['K4'] = {'publishedDigits': okpub, 'ln6MeetsLn2PlusLn3': meets, 'everyKeyAgainstDecimalLn': okdec}
        items5 = [(k, '11' if k == 2 else v) for k, v in items]
        o5 = Obj(items5)
        C['K5'] = {'what': 'f(2) := 11', 'clipped': o5.clipped, 'valueUsed': str(Fraction(o5.a[o5.keys.index(2)], o5.D))}
        out['controls'] = C
    if '--json' in args:
        print(json.dumps(out, indent=1))
        return
    A = res['readingA']
    print('claim #6, EinsteinArena solution 2506: %s' % res['verdict'])
    print('  f(1) after the platform\'s step 2, exactly enclosed: [%s, %s]' % tuple(res['f1']))
    print('  reading A (F(x) <= 1 for every x >= 1): %s' % A['verdict'])
    print('    x = 1: F(1) = f(1) in [%s, %s], above 1: %s' % (A['witness1']['F'][0], A['witness1']['F'][1], A['witness1']['aboveOne']))
    print('    integers 1..%d with F(n) > 1: %d' % (N - 1, A['inRangeAboveOne']))
    print('    x = %s (%d digits): F in [%s, %s]' % (A['mirror']['x'], A['mirror']['xDigits'], A['mirror']['F'][0], A['mirror']['F'][1]))
    print('  reading B (F(n) <= 1 + 1e-4 on the sampled range, every integer): %s (%d above)' % ('holds' if res['readingB']['holds'] else 'FAILS', res['readingB']['aboveTolerance']))
    print('    max of F on the range: n = %d, F in [%s, %s]' % (res['max']['n'], res['max']['F'][0], res['max']['F'][1]))
    print('  score S = -sum f(k) ln(k)/k in [%s, %s]; printed %s %s it; agrees within 1e-6: %s' % (res['score']['enclosure'][0], res['score']['enclosure'][1], printed, ag['printedSide'], ag['agrees']))
    if 'controls' in out:
        for k, v in out['controls'].items():
            print('  control %s: %s' % (k, json.dumps(v)))


if __name__ == '__main__':
    main()
