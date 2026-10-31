#!/usr/bin/env python3
"""run-xx-ledger.py — certs/xx-ledger.json: every bracket of the x^x = y study re-decided HERE, by code of our own.

claimbox (the claim-machine, ~/Projects/claimbox) stated the brackets an AI model proposed for the real root of x^x = y
and had cert-machine's receiver (instruments/claimbox/check.py) decide them. This recorder decides them a second time
and shares nothing with claimbox: it reads only the copies LIFT-claimbox.json made into corpus/claimbox-xx (every file
re-hashed against PROVENANCE-claimbox.json first), and it never imports claimbox's library or the receiver.

THE DECISION. N >= 2 is the integer the pinned file prints; x is the real root of x^x = N. For a fraction a = p/q > 1
in lowest terms,
    x > a   iff  p^p < N^q * q^p          x < a   iff  p^p > N^q * q^p
and for a whole number k >= 1,  x >= k iff k^k <= N  and  x <= k iff k^k >= N.  Two integers are computed exactly and
compared; no logarithm, no float. The step from x to the comparison rests on x^x being <= 1 on (0, 1], strictly
increasing on [1, oo) and having no negative real root: that argument is READ (claimbox/library/selfpower.py, copied
beside the records), not decided here, and the ledger says so in `reduction`.

WHAT IS DECIDED. (1) Every bracket of the study (records/xxy-study.json: `bracket` of each row in `decidedYs`), its two
sides, against N read from corpus/xxy/n/<y>.json; at the four whole-number roots (y = k^k) the two bounds x >= k and
x <= k. (2) The planted wrong brackets claimbox wrote (expect REFUTED), each of which must come out REFUTED. (3) The
eight x^x = 64 claims (corpus/xx64), whose two sharpest sides are comparisons of 2.6-million-digit integers.
(4) Mutants, red controls of the decider: each certified fraction moved one unit the wrong way in its numerator
((p+1)/q under "x >", (p-1)/q under "x <") and each whole-number bound made strict (x > k, x < k); every one must flip
to REFUTED. (5) A forged claimbox word must be caught by the agreement gate.

THE SECOND DECISION. claimbox's check records hold the receiver's word per claim; the ledger carries it beside ours,
and ANY disagreement — or a claim stated differently from the study's bracket — refuses the run and writes nothing.

    python3 -I tools/run-xx-ledger.py           decide everything, write certs/xx-ledger.json   (~ 20-40 s)
    python3 -I tools/run-xx-ledger.py --check   re-hash, re-decide everything, refuse unless equal to the ledger
Python 3.9+ standard library; no integer is ever turned into a decimal string (3.11+ caps that at 4,300 digits and
3.9's conversion is quadratic) — digit counts are read by comparison with powers of ten.                         MIT
"""
import hashlib
import json
import math
import os
import re
import sys
import time
from fractions import Fraction

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LIFT = 'corpus/claimbox-xx'
OUT = 'certs/xx-ledger.json'
CHECK = '--check' in sys.argv


def die(m):
    sys.exit('XX LEDGER REFUSED: ' + m)


def rd(rel):
    with open(os.path.join(ROOT, rel), 'rb') as f:
        return f.read()


def J(rel):
    return json.loads(rd(rel).decode('utf-8'))


sha = lambda rel: hashlib.sha256(rd(rel)).hexdigest()
t0 = time.time()

# ---- 1. the copies are the bytes the lift recorded ----------------------------------------------------------------------
prov = J('PROVENANCE-claimbox.json')
if not re.fullmatch(r'[0-9a-f]{40}', prov.get('source_commit') or ''):
    die('PROVENANCE-claimbox.json names no claimbox commit')
mine = [f for f in prov['files'] if f['dst'].startswith(LIFT + '/')]
if len(mine) < 110:
    die('the lift holds %d files under %s; the study needs its records, sources and one N per decided y' % (len(mine), LIFT))
for f in mine:
    if f['patched'] or sha(f['dst']) != f['local_sha256']:
        die(f['dst'] + ' is not the byte copy PROVENANCE-claimbox.json recorded')
pinned = {f['dst'][len(LIFT) + 1:]: f['local_sha256'] for f in mine}

STUDY = J(LIFT + '/records/xxy-study.json')
CHK = J(LIFT + '/records/xxy-check.json')
CHK64 = J(LIFT + '/records/xx64-check.json')

# ---- 2. the decider ------------------------------------------------------------------------------------------------------
REL = {'>': 'gt', '<': 'lt', '≥': 'ge', '≤': 'le'}


def digits(n):
    """the number of decimal digits of n > 0, by comparison with a power of ten (never a decimal string)"""
    k = max(1, int((n.bit_length() - 1) * 0.30102999566398114))   # a lower estimate of floor(log10 n)
    p = 10 ** k
    while p <= n:                                                  # at most a step or two
        p *= 10
        k += 1
    while p // 10 > n:
        p //= 10
        k -= 1
    return k


def decide(N, a, rel, sizes=False):
    """the word on `x REL a` for the root of x^x = N; a is a Fraction. Returns (word, facts)."""
    if not (isinstance(N, int) and N >= 2):
        return 'REFUSED', {'why': 'N is not an integer >= 2'}
    p, q = a.numerator, a.denominator
    if q == 1 and rel in ('ge', 'le', 'gt', 'lt') and p >= 1:
        lhs, rhs = p ** p, N                                      # x REL k  iff  k^k REL N
        c = (lhs > rhs) - (lhs < rhs)
        hold = {'ge': c <= 0, 'le': c >= 0, 'gt': c < 0, 'lt': c > 0}[rel]
        facts = {'compared': '%d^%d vs %d' % (p, p, N), 'sign': c}
    elif a > 1:
        lhs, rhs = p ** p, N ** q * q ** p                        # x > p/q  iff  p^p < N^q·q^p
        c = (lhs > rhs) - (lhs < rhs)
        hold = {'gt': c < 0, 'ge': c <= 0, 'lt': c > 0, 'le': c >= 0}[rel]
        facts = {'compared': '%d^%d vs %d^%d·%d^%d' % (p, p, N, q, q, p), 'sign': c}
    else:
        return 'REFUSED', {'why': 'a fraction at or below 1 is outside the reduction'}
    if sizes:
        facts['digits'] = [digits(lhs), digits(rhs)]
    facts['bits'] = [lhs.bit_length(), rhs.bit_length()]
    return ('CERTIFIED' if hold else 'REFUTED'), facts


STMT = re.compile(r'^xroot\((\w+)\)\s*([<>≤≥])\s*(\d+(?:\.\d+)?(?:/\d+)?)$')


def parse(statement):
    m = STMT.match(statement.strip())
    if not m:
        die('a claim this recorder does not read: ' + statement)
    return m.group(1), REL[m.group(2)], Fraction(m.group(3))


def word_of(c):
    rs = c.get('readings') or []
    if len(rs) != 1:
        die('claim %s has %d readings; one was expected' % (c['id'], len(rs)))
    return rs[0]['word']


frac = lambda a: '%d/%d' % (a.numerator, a.denominator) if a.denominator != 1 else str(a.numerator)
SYM = {'gt': '>', 'lt': '<', 'ge': '≥', 'le': '≤'}

# ---- 3. the study's brackets, against claimbox's statements ----------------------------------------------------------------
rows_by_y = {r['y']: r for r in STUDY['rows']}
decided_ys = STUDY['decidedYs']
claims_by_id = {c['id']: c for c in CHK['claims']}
if len(claims_by_id) != len(CHK['claims']):
    die('two claims share an id in xxy-check.json')
rows, mutants, used = [], [], set()


def n_of(y):
    rel = 'corpus/xxy/n/%d.json' % y
    if rel not in pinned:
        die('no pinned N for y = %d' % y)
    d = J(LIFT + '/' + rel)
    if d.get('N') != y:
        die('the pinned file for y = %d prints N = %r' % (y, d.get('N')))
    return d['N'], rel


def record(cid, y, N, nrel, a, rel, expect, origin, cb_claim=None):
    word, facts = decide(N, a, rel)
    row = {'id': cid, 'y': y, 'N': N, 'nFile': nrel, 'statement': 'x %s %s' % (SYM[rel], frac(a)), 'rel': rel,
           'a': frac(a), 'origin': origin, 'word': word, 'expect': expect, 'compared': facts.get('compared'),
           'sign': facts.get('sign'), 'bits': facts.get('bits')}
    if cb_claim is not None:
        row['claimbox'] = {'word': word_of(cb_claim), 'expect': cb_claim.get('expect'), 'statement': cb_claim['statement']}
    rows.append(row)
    return row


exact_roots = []
for y in decided_ys:
    r = rows_by_y.get(y)
    if r is None:
        die('decidedYs names y = %d, which the study does not hold' % y)
    N, nrel = n_of(y)
    if r['exact']:
        k = r['k']
        if k ** k != y:
            die('the study calls y = %d exact with k = %d' % (y, k))
        exact_roots.append(y)
        sides = [('y%d_ge' % y, Fraction(k), 'ge'), ('y%d_le' % y, Fraction(k), 'le')]
    else:
        lo, hi = sorted(Fraction(*b) for b in r['bracket'])
        if lo == hi:
            die('the bracket for y = %d is a point' % y)
        sides = [('y%d_gt' % y, lo, 'gt'), ('y%d_lt' % y, hi, 'lt')]
    for cid, a, rel in sides:
        c = claims_by_id.get(cid)
        if c is None:
            die('claimbox stated no claim %s' % cid)
        var, crel, ca = parse(c['statement'])
        if (var, crel, ca) != ('n%d' % y, rel, a):
            die('claimbox states %s as "%s"; the study\'s bracket is x %s %s' % (cid, c['statement'], SYM[rel], frac(a)))
        used.add(cid)
        record(cid, y, N, nrel, a, rel, 'CERTIFIED', 'the study\'s bracket (proposed)', c)
        # the mutant: one unit the wrong way, or the bound made strict
        if rel in ('ge', 'le'):
            mrel = {'ge': 'gt', 'le': 'lt'}[rel]
            ma, how = a, 'the bound made strict'
        else:
            ma = Fraction(a.numerator + (1 if rel == 'gt' else -1), a.denominator)
            mrel, how = rel, 'the numerator moved one unit the wrong way'
        mw, mf = decide(N, ma, mrel)
        mutants.append({'of': cid, 'y': y, 'statement': 'x %s %s' % (SYM[mrel], frac(ma)), 'how': how, 'word': mw, 'sign': mf.get('sign')})

# the planted wrong brackets
planted = [c for c in CHK['claims'] if c['id'] not in used]
for c in planted:
    var, rel, a = parse(c['statement'])
    y = int(var[1:])
    N, nrel = n_of(y)
    if c.get('expect') != 'REFUTED':
        die('claim %s is neither a study bracket nor a planted refutation' % c['id'])
    record(c['id'], y, N, nrel, a, rel, 'REFUTED', 'planted wrong bracket', c)

# ---- 4. the x^x = 64 claims ---------------------------------------------------------------------------------------------
p64 = J(LIFT + '/corpus/xx64/problem.json')
N64 = p64['N']
if N64 != 64:
    die('the pinned x^x = 64 problem prints N = %r' % N64)
sixty_four = []
for c in CHK64['claims']:
    var, rel, a = parse(c['statement'])
    if var != 'n':
        die('an x^x = 64 claim over ' + var)
    t = time.time()
    word, facts = decide(N64, a, rel, sizes=True)
    exp = c.get('expect')
    row = {'id': c['id'], 'y': 64, 'N': N64, 'nFile': 'corpus/xx64/problem.json', 'statement': 'x %s %s' % (SYM[rel], frac(a)),
           'rel': rel, 'a': frac(a), 'origin': 'planted wrong bound' if exp == 'REFUTED' else 'proposed',
           'word': word, 'expect': exp, 'compared': facts['compared'], 'sign': facts['sign'], 'bits': facts['bits'],
           'digits': facts['digits'], 'claimbox': {'word': word_of(c), 'expect': exp, 'statement': c['statement']}}
    sixty_four.append(row)
    if exp == 'CERTIFIED':
        ma = Fraction(a.numerator + (1 if rel == 'gt' else -1), a.denominator)
        mw, mf = decide(N64, ma, rel)
        mutants.append({'of': '64/' + c['id'], 'y': 64, 'statement': 'x %s %s' % (SYM[rel], frac(ma)),
                        'how': 'the numerator moved one unit the wrong way', 'word': mw, 'sign': mf.get('sign')})

# ---- 5. the gates: expectation, agreement, red controls ------------------------------------------------------------------
def disagreements(xs):
    """every claim whose word here differs from its expectation or from claimbox's record"""
    out = []
    for r in xs:
        if r['word'] != r['expect']:
            out.append('%s (y = %d): decided %s, expected %s' % (r['id'], r['y'], r['word'], r['expect']))
        if r['claimbox']['word'] != r['word']:
            out.append('%s (y = %d): decided %s here, claimbox\'s record says %s' % (r['id'], r['y'], r['word'], r['claimbox']['word']))
    return out


everything = rows + sixty_four
bad = disagreements(everything)
if bad:
    die('; '.join(bad[:5]) + (' (and %d more)' % (len(bad) - 5) if len(bad) > 5 else ''))
for m in mutants:
    if m['word'] != 'REFUTED':
        die('the mutant of %s (%s) did not flip: %s' % (m['of'], m['statement'], m['word']))
# red control: one claimbox word forged in a copy must be caught by the same gate
forged = [dict(r, claimbox=dict(r['claimbox'])) for r in everything]
forged[len(forged) // 2]['claimbox']['word'] = 'REFUTED' if forged[len(forged) // 2]['word'] == 'CERTIFIED' else 'CERTIFIED'
if len(disagreements(forged)) != 1:
    die('the forged-word red control did not fire')
# the decider on a refused input: a fraction at or below 1
if decide(5, Fraction(1, 2), 'gt')[0] != 'REFUSED' or decide(1, Fraction(3, 2), 'gt')[0] != 'REFUSED':
    die('the decider decided outside the reduction')


# ---- 6. what the brackets pin: decimals both ends share, the enclosure printed outward ---------------------------------
def floor_dec(a, d):
    return (a.numerator * 10 ** d) // a.denominator


def shared_decimals(lo, hi, cap=40):
    d = 0
    while d < cap and floor_dec(lo, d + 1) == floor_dec(hi, d + 1):
        d += 1
    return d


def dec_str(a, d, up):
    """a positive fraction to d decimals, toward −∞ (up False) or +∞ (up True), as a plain decimal string"""
    n = floor_dec(a, d)
    if up and Fraction(n, 10 ** d) != a:
        n += 1
    s = str(n).rjust(d + 1, '0')
    return s[:-d] + '.' + s[-d:] if d else s


brackets = []
for y in decided_ys:
    r = rows_by_y[y]
    if r['exact']:
        k = r['k']
        brackets.append({'y': y, 'exact': True, 'k': k, 'lo': str(k), 'hi': str(k), 'width': '0', 'sharedDecimals': None,
                         'loDec': str(k), 'hiDec': str(k)})
        continue
    lo, hi = sorted(Fraction(*b) for b in r['bracket'])
    w = hi - lo
    brackets.append({'y': y, 'exact': False, 'lo': frac(lo), 'hi': frac(hi), 'width': frac(w),
                     'widthLog10': round(math.log10(w.numerator) - math.log10(w.denominator), 6),
                     'sharedDecimals': shared_decimals(lo, hi), 'loDec': dec_str(lo, 30, False), 'hiDec': dec_str(hi, 30, True)})

lo64 = Fraction(next(r for r in sixty_four if r['id'] == 'cf_above_10')['a'])
hi64 = Fraction(next(r for r in sixty_four if r['id'] == 'cf_below_9')['a'])
s64 = shared_decimals(lo64, hi64)
bracket64 = {'lo': frac(lo64), 'hi': frac(hi64), 'sharedDecimals': s64, 'loDec': dec_str(lo64, 30, False),
             'hiDec': dec_str(hi64, 30, True), 'loShared': dec_str(lo64, s64, False), 'hiShared': dec_str(hi64, s64, True)}

# ---- 7. the study's largest partial quotients, carried as strings -----------------------------------------------------
# COMPUTED numbers, not decisions: the study's champions (stats.largest) hold convergents past 2^53, which JSON readers in
# JavaScript round (927575580554664451 reads as 927575580554664400), so the page prints them from here, as decimal
# strings. Each is checked against the study's own continued fraction: a_n is the quotient at position n, and the
# fraction is the convergent p_(n-1)/q_(n-1) built from cf[0..n-1].
champions = []
for z in STUDY['stats']['largest']:
    cf = rows_by_y[z['y']]['cf']
    if cf[z['n']] != z['a']:
        die('the study\'s champion for y = %d is not the quotient at position %d of its continued fraction' % (z['y'], z['n']))
    p0, q0, p1, q1 = 1, 0, cf[0], 1
    for a in cf[1:z['n']]:
        p0, q0, p1, q1 = p1, q1, a * p1 + p0, a * q1 + q0
    if [p1, q1] != z['fraction']:
        die('the study\'s convergent for y = %d is not p_(n-1)/q_(n-1) of its continued fraction' % z['y'])
    champions.append({'y': z['y'], 'n': z['n'], 'a': z['a'], 'p': str(p1), 'q': str(q1)})

count = lambda xs, w: sum(1 for x in xs if x['word'] == w)
ledger = {
    'what': 'x^x = y, every bracket decided here (tools/run-xx-ledger.py): the study claimbox stated from an AI model\'s '
            'proposals (claude-opus-5-5), read from the copies LIFT-claimbox.json made into corpus/claimbox-xx, each side one exact '
            'integer comparison by code that shares nothing with claimbox or the receiver; claimbox\'s word beside ours, which must agree',
    'claimboxCommit': prov['source_commit'],
    'pins': {k: pinned[k] for k in ('records/xxy-study.json', 'records/xxy-check.json', 'records/xx64-check.json',
                                    'claimbox/library/selfpower.py', 'corpus/xx64/problem.json')},
    'reduction': {'statement': 'x > p/q iff p^p < N^q·q^p and x < p/q iff p^p > N^q·q^p, for p/q > 1, q >= 1, N >= 2; x >= k iff k^k <= N, x <= k iff k^k >= N',
                  'rests on': 'x^x <= 1 on (0, 1], x^x strictly increasing on [1, oo), no negative real root (claimbox/library/selfpower.py)',
                  'standing': 'read, not decided'},
    'counts': {
        'roots': len(decided_ys), 'exactRoots': len(exact_roots),
        'claims': len(rows), 'CERTIFIED': count(rows, 'CERTIFIED'), 'REFUTED': count(rows, 'REFUTED'),
        'planted': len(planted), 'agreeWithClaimbox': sum(1 for r in rows if r['claimbox']['word'] == r['word']),
        'xx64Claims': len(sixty_four), 'xx64Certified': count(sixty_four, 'CERTIFIED'), 'xx64Refuted': count(sixty_four, 'REFUTED'),
        'xx64AgreeWithClaimbox': sum(1 for r in sixty_four if r['claimbox']['word'] == r['word']),
        'mutants': len(mutants), 'mutantsFlipped': count(mutants, 'REFUTED'),
        'redControls': len(planted) + count(sixty_four, 'REFUTED') + len(mutants) + 2,
        'redControlsFired': len(planted) + count(sixty_four, 'REFUTED') + count(mutants, 'REFUTED') + 2,
    },
    'exactRoots': exact_roots,
    'bracket64': bracket64,
    'claims': rows,
    'xx64': sixty_four,
    'mutants': mutants,
    'brackets': brackets,
    'champions': {'standing': 'computed: the study\'s numbers, transcribed as strings and checked against its own continued fractions; nothing decided',
                  'rows': champions},
    'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'seconds': None,
}
ledger['seconds'] = round(time.time() - t0, 1)
VOLATILE = ('generated', 'seconds')

if CHECK:
    if not os.path.exists(os.path.join(ROOT, OUT)):
        die(OUT + ' does not exist; run without --check first')
    old = J(OUT)
    a = {k: v for k, v in old.items() if k not in VOLATILE}
    b = {k: v for k, v in json.loads(json.dumps(ledger, ensure_ascii=False)).items() if k not in VOLATILE}
    if a != b:
        diff = [k for k in sorted(set(a) | set(b)) if a.get(k) != b.get(k)]
        die('the ledger does not re-derive: ' + ', '.join(diff) + ' differ')
    c = ledger['counts']
    print('xx ledger: re-derived identically — %d claims (%d CERTIFIED, %d REFUTED), x^x = 64 %d of %d, %d mutants flipped, '
          'claimbox agrees on all %d, %.1f s' % (c['claims'], c['CERTIFIED'], c['REFUTED'], c['xx64Certified'] + c['xx64Refuted'],
                                                 c['xx64Claims'], c['mutantsFlipped'], c['claims'] + c['xx64Claims'], ledger['seconds']))
    sys.exit(0)

with open(os.path.join(ROOT, OUT), 'w', encoding='utf-8') as f:
    f.write(json.dumps(ledger, indent=1, ensure_ascii=False) + '\n')
c = ledger['counts']
print('%s written: %d roots, %d claims — %d CERTIFIED, %d REFUTED (the %d planted); x^x = 64: %d CERTIFIED, %d REFUTED; '
      '%d of %d mutants flipped; claimbox agrees on every claim; %.1f s' % (
          OUT, c['roots'], c['claims'], c['CERTIFIED'], c['REFUTED'], c['planted'], c['xx64Certified'], c['xx64Refuted'],
          c['mutantsFlipped'], c['mutants'], ledger['seconds']))
