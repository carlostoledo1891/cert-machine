#!/usr/bin/env python3
"""flashprove-exact.py — phase 4 (E1, E2) of the FlashProve check (notes/flashprove-preregistration-2026-11-04.md): the
numbers the six theorems' statements name, recomputed here in exact integers and rationals from their Lean definitions
at the pin (9e2bdd8f), written into corpus/flashprove/exact.json. Stdlib only; no code of the claimant's runs.

  E1  finalSoundnessError q = soundnessErrorInQueries q 1 (Johnson/Face/FinalStatement.lean:225), where
      soundnessErrorInQueries t n = 16·(t+n+2^23)/2^128 + (t+n+2^23+2)^2/2^256 (Ladder/Bits.lean:96), against the printed
      "q/2^124 + 2^-101"; finalBindingError q = max(soundnessErrorInQueries q 2^23, bindingErrorInQueries q)
      (Ladder/PackageBits.lean:99), bindingErrorInQueries t = 16·(t+2^23)/2^128 + (t+2^48+2^23+2)^2/2^256, against
      "q/2^124 + 2^-100". Values at q = 1, 2^48, 2^64, 2^80, and the least q at which each reaches 2^-40 and 2^-1.
  E2  p = 2^64 - 2^32 + 1 prime by a Pratt certificate built and checked here; 7 not a cube mod p, so x^3 - 7 is
      irreducible over F_p (a cubic without a root) and EGold = F_p[x]/(x^3 - 7) is a field; p^3 < 2^192 (the bound
      Code/Field.lean says it does not prove); 62 + 688,127·64 <= 44,040,191; the constants 2^-40 (completeness) and
      2^-154 (zero knowledge) as defined.

usage: python3 -I tools/flashprove-exact.py [--check]   (--check refuses when the stored file differs) """
import json, os, sys
from fractions import Fraction as F

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'corpus', 'flashprove', 'exact.json')
A = 2 ** 23              # verifierQueryAllowance
HB = 2 ** 48             # honestBudget

def sound(t, n): return F(16 * (t + n + A), 2 ** 128) + F((t + n + A + 2) ** 2, 2 ** 256)
def binding(t): return F(16 * (t + A), 2 ** 128) + F((t + HB + A + 2) ** 2, 2 ** 256)
def final_sound(q): return sound(q, 1)
def final_binding(q): return max(sound(q, A), binding(q))

def least_q(f, bar):
    """the least q >= 0 with f(q) >= bar; f is increasing in q"""
    if f(0) >= bar: return 0
    hi = 1
    while f(hi) < bar: hi *= 2
    lo = hi // 2
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if f(mid) >= bar: hi = mid
        else: lo = mid
    return hi

def log2_floor(x):  # floor(log2 x) for a positive Fraction
    n, d = x.numerator, x.denominator
    k = n.bit_length() - d.bit_length()
    if (n << max(0, -k)) < (d << max(0, k)): k -= 1
    return k

def factor(n):
    out, d = {}, 2
    while d * d <= n:
        while n % d == 0: out[d] = out.get(d, 0) + 1; n //= d
        d += 1 if d == 2 else 2
    if n > 1: out[n] = out.get(n, 0) + 1
    return out

def pratt(p):
    """a Pratt certificate: (p, g, [certificates of the prime factors of p-1]); 2 is its own"""
    if p == 2: return {'p': 2}
    qs = sorted(factor(p - 1))
    g = next(g for g in range(2, p) if pow(g, p - 1, p) == 1 and all(pow(g, (p - 1) // q, p) != 1 for q in qs))
    return {'p': p, 'g': g, 'factors': {str(q): e for q, e in factor(p - 1).items()}, 'sub': [pratt(q) for q in qs]}

def check_pratt(c):
    """re-checks a certificate from its own fields: p-1 is the product of the listed powers, each listed prime has a
    checked certificate, g^(p-1) = 1 and g^((p-1)/q) != 1 for each listed q"""
    p = c['p']
    if p == 2: return True
    prod = 1
    for q, e in c['factors'].items(): prod *= int(q) ** e
    if prod != p - 1: return False
    if sorted(int(q) for q in c['factors']) != sorted(s['p'] for s in c['sub']): return False
    if not all(check_pratt(s) for s in c['sub']): return False
    g = c['g']
    return pow(g, p - 1, p) == 1 and all(pow(g, (p - 1) // int(q), p) != 1 for q in c['factors'])

def frac(x): return {'num': str(x.numerator), 'den': str(x.denominator), 'log2Floor': log2_floor(x)}

def build():
    p = 2 ** 64 - 2 ** 32 + 1
    cert = pratt(p)
    assert check_pratt(cert)
    # a planted wrong certificate must be refused: the generator moved to a non-generator (7^((p-1)/q) checks kept)
    bad = json.loads(json.dumps(cert)); bad['g'] = 1
    bad2 = json.loads(json.dumps(cert)); bad2['factors']['3'] = 2
    seven = pow(7, (p - 1) // 3, p)
    E1 = {}
    for name, f, printed in [('finalSoundnessError', final_sound, (F(1, 2 ** 124), F(1, 2 ** 101))),
                             ('finalBindingError', final_binding, (F(1, 2 ** 124), F(1, 2 ** 100)))]:
        rows = {}
        for lab, q in [('1', 1), ('2^48', 2 ** 48), ('2^64', 2 ** 64), ('2^80', 2 ** 80)]:
            v = f(q); pr = printed[0] * q + printed[1]
            rows[lab] = {'exact': frac(v), 'printed': frac(pr), 'exactOverPrinted': float(v / pr), 'exactAbovePrinted': v > pr}
        E1[name] = {'atQ': rows, 'leastQReaching': {'2^-40': str(least_q(f, F(1, 2 ** 40))), '2^-1': str(least_q(f, F(1, 2)))},
                    'atZero': frac(f(0))}
    return {
        'what': 'Phase 4 (E1, E2) of the FlashProve check: the numbers the theorems name, recomputed exactly from their Lean definitions at 9e2bdd8f.',
        'claim': {'repo': 'https://github.com/anthropics/FlashProve', 'commit': '9e2bdd8ff5bf9c62f18263d7dac189b0400b260c'},
        'definitions': {
            'soundnessErrorInQueries': 'Ladder/Bits.lean:96 — 16·(t+n+2^23)/2^128 + (t+n+2^23+2)^2/2^256',
            'finalSoundnessError': 'Johnson/Face/FinalStatement.lean:225 — soundnessErrorInQueries q 1',
            'bindingErrorInQueries': 'Ladder/Bits.lean:110 — 16·(t+2^23)/2^128 + (t+2^48+2^23+2)^2/2^256',
            'finalBindingError': 'Johnson/Face/FinalStatement.lean:228 → Ladder/PackageBits.lean:99 — max(soundnessErrorInQueries q 2^23, bindingErrorInQueries q)',
            'pGold': 'Code/Field.lean:400 — 2^64 - 2^32 + 1; EGold = FGold[x]/(x^3 - 7) (Code/Field.lean:6)',
            'finalCompletenessError': 'Johnson/Face/FinalStatement.lean:219 → Ladder.lean:239 — (2^-1)^40',
            'finalZeroKnowledgeError': 'AtFullSide/Face/ZeroKnowledgeNumber.lean:29 — (2^-1)^154, at finalVerifierQueries = 2^64 and finalReplyCount = 688127',
        },
        'E1': E1,
        'E2': {
            'p': str(p), 'pMinusOne': {str(q): e for q, e in factor(p - 1).items()},
            'pratt': cert, 'prattChecked': check_pratt(cert),
            'plantedCertificatesRefused': {'generator 1': not check_pratt(bad), 'a factor power changed': not check_pratt(bad2)},
            'sevenToTheThird': str(seven), 'sevenNotACube': seven != 1 and (p - 1) % 3 == 0,
            'xCubedMinusSevenIrreducible': seven != 1 and (p - 1) % 3 == 0,
            'irreducibleBecause': '3 | p-1 and 7^((p-1)/3) != 1 mod p, so 7 is not a cube in F_p; a cubic with no root over a field is irreducible',
            'pCubedBelow2to192': p ** 3 < 2 ** 192,
            'columns': {'lhs': 62 + 688127 * 64, 'rhs': 44040191, 'holds': 62 + 688127 * 64 <= 44040191, 'slack': 44040191 - (62 + 688127 * 64)},
            'completeness': frac(F(1, 2 ** 40)), 'zeroKnowledge': frac(F(1, 2 ** 154)),
        },
    }

if __name__ == '__main__':
    rec = build()
    txt = json.dumps(rec, indent=1, ensure_ascii=False) + '\n'
    if '--check' in sys.argv:
        ok = os.path.exists(OUT) and open(OUT, encoding='utf-8').read() == txt
        print('flashprove-exact: ' + ('PASS — the stored numbers re-derive' if ok else 'FAIL — corpus/flashprove/exact.json differs from a fresh derivation'))
        sys.exit(0 if ok else 1)
    open(OUT, 'w', encoding='utf-8').write(txt)
    s, b = rec['E1']['finalSoundnessError'], rec['E1']['finalBindingError']
    print('soundness: at 0 2^%d; reaches 2^-40 at q=%s, 2^-1 at q=%s; above printed at 2^64: %s'
          % (s['atZero']['log2Floor'], s['leastQReaching']['2^-40'], s['leastQReaching']['2^-1'], s['atQ']['2^64']['exactAbovePrinted']))
    print('binding:   at 0 2^%d; reaches 2^-40 at q=%s, 2^-1 at q=%s' % (b['atZero']['log2Floor'], b['leastQReaching']['2^-40'], b['leastQReaching']['2^-1']))
    e = rec['E2']
    print('p prime (Pratt, checked):', e['prattChecked'], '| planted certs refused:', e['plantedCertificatesRefused'], '| x^3-7 irreducible:', e['xCubedMinusSevenIrreducible'], '| p^3<2^192:', e['pCubedBelow2to192'], '| columns:', e['columns'])
