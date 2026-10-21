#!/usr/bin/env python3
"""instruments/claimbox/battery.py — the gate of the declared-claim checker (version 1). Standard library + node for the concord.

WHAT IT HOLDS. (1) The ten objects of claims/ come out as expected: nine ADMITTED, with every decision the record's, and
one REFUSED for the reason written on it (record-bar-mismatch: the claimant's README prints an eleven-digit bound the record
did not decide). (2) The finding behind that refusal re-derives: the exact value of the K = 3072 certificate is below the
eleven-digit print. (3) CONCORD on the one predicate: the checker's decide() and instruments/verdict.js's decide() agree on
every one of 600 seeded enclosure/bar/relation cases — two implementations of the inclusion property read once, no code
shared. (4) RED CONTROLS: every kind of malformed object the checker names is planted in a copy of an admitted object and
must be REFUSED with that kind; a forged record (verdict flipped; bar moved) must be caught; the checker must refuse to run
when the kernel audit lacks an operation of the vocabulary. (5) A GREEN control: a synthetic box-domain object with a
printed-digits box ("in") is admitted and decided CERTIFIED.

usage: python3 instruments/claimbox/battery.py        exit 0 iff every check passes and every red control fires
MIT"""
import importlib.util
import json
import os
import random
import re
import shutil
import subprocess
import sys
import tempfile
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
CLAIMS = os.path.join(HERE, 'claims')

spec = importlib.util.spec_from_file_location('claimboxcheck', os.path.join(HERE, 'check.py'))
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)
B.WORDS = B.load_vocab()
C, R, F = B.WORDS

passes = fails = reds = reds_fired = 0


def ok(cond, msg, detail=''):
    global passes, fails
    if cond:
        passes += 1
        print('PASS  ' + msg + ('   [' + detail + ']' if detail else ''))
    else:
        fails += 1
        print('FAIL  ' + msg + ('   [' + detail + ']' if detail else ''))


def red(fired, msg, detail=''):
    global reds, reds_fired
    reds += 1
    if fired:
        reds_fired += 1
    ok(fired, 'RED   ' + msg, detail)


def load(name):
    with open(os.path.join(CLAIMS, name + '.json'), encoding='utf-8') as f:
        return json.load(f)


def clone(o):
    return json.loads(json.dumps(o))


# ---- 1 · the ten objects ------------------------------------------------------------------------------------------
EXPECT = {
    'optq-1a-atris': (B.ADMITTED, None, [C]), 'optq-1a-agentdiscover': (B.ADMITTED, None, [C]),
    'optq-1b-atris': (B.ADMITTED, None, [C]), 'optq-1b-codexprolong': (B.ADMITTED, None, [C]),
    'optq-1c-rozetyp': (B.ADMITTED, None, [C]), 'optq-1c-rozetyp-k3072': (B.REFUSED_WORD, 'record-bar-mismatch', None),
    'optq-1d-cert2026': (B.ADMITTED, None, [R, 'repair:' + C]),
    'optq-86-pinho': (B.ADMITTED, None, [C, C]),
    'optq-82-pinho': (B.ADMITTED, None, [C]), 'optq-82-epi': (B.ADMITTED, None, [C]),
}
files = sorted(f for f in os.listdir(CLAIMS) if f.endswith('.json'))
ok(len(files) == 10 and set(os.path.splitext(f)[0] for f in files) == set(EXPECT), 'ten objects in claims/, the ten named', str(len(files)))
pins = set()
for f in files:
    name = os.path.splitext(f)[0]
    res = B.check(os.path.join(CLAIMS, f))
    word, kind, decided = EXPECT[name]
    if word == B.ADMITTED:
        ok(res['word'] == B.ADMITTED and res['decided'] == decided, name + ' ADMITTED, decisions ' + ' · '.join(decided),
           res['word'] + (' ' + str(res['kind']) + ': ' + res['msg'] if res['word'] != B.ADMITTED else ' ' + ' · '.join(res['decided'])))
        o = load(name)
        pins.add(o['domain']['pin']['sha256'])
        pins.add(o['source']['sha256'])
    else:
        ok(res['word'] == B.REFUSED_WORD and res['kind'] == kind, name + ' REFUSED ' + kind + ' (the finding it carries)', str(res['kind']) + ': ' + res['msg'][:90])
ok(len(pins) >= 12, 'the nine admitted objects pin at least twelve distinct files', str(len(pins)))
ok(any('relation' in n for n in B.check(os.path.join(CLAIMS, 'optq-82-pinho.json'))['notes']), 'the < vs <= discrepancy on C_82 is noted, not refused')

# ---- 2 · the finding re-derived -------------------------------------------------------------------------------------
with open(os.path.join(ROOT, 'certs', 'autocorr-replay.json'), encoding='utf-8') as fh:
    row = next(r for r in json.load(fh)['rows'] if r['id'] == '1c-rozetyp-k3072')
v = Fraction(row['js']['value'])
ok(v < Fraction('0.41030211724') and v >= Fraction('0.41030211723') and v >= Fraction('0.4103021'),
   'FINDING: the K = 3072 exact value is below the README\'s 0.41030211724 and above 0.41030211723 and the record\'s 0.4103021',
   'value - print = ' + ('%.3e' % float(v - Fraction('0.41030211724'))))

# ---- 3 · concord on the one predicate: check.py decide() against instruments/verdict.js decide() ------------------
rng = random.Random(20261020)
cases = []
for _ in range(600):
    lo = rng.uniform(-2, 2)
    width = rng.choice([0.0, 0.0, 1e-16, 1e-12, 1e-6, 0.1, 1.0])
    hi = lo + width
    bar = rng.choice([lo, hi, lo - 1e-9, hi + 1e-9, rng.uniform(-2, 2), lo + width / 2])
    cases.append({'lo': lo, 'hi': hi, 'bar': bar, 'rel': rng.choice(['lt', 'le', 'gt', 'ge'])})
js = ("const V=require(process.argv[1]);const cs=JSON.parse(require('fs').readFileSync(0,'utf8'));"
      "console.log(JSON.stringify(cs.map(c=>V.decide([c.lo,c.hi],c.bar,c.rel))))")
try:
    out = subprocess.run(['node', '-e', js, os.path.join(ROOT, 'instruments', 'verdict.js')], input=json.dumps(cases), capture_output=True, text=True, timeout=60)
    theirs = [d['verdict'] for d in json.loads(out.stdout)] if out.returncode == 0 else None
except (OSError, ValueError, subprocess.TimeoutExpired):
    theirs = None
if theirs is None:
    ok(False, 'concord: verdict.js could not be run', (out.stderr if 'out' in dir() else '')[:120])
else:
    mine = [B.decide(('enclosure', (Fraction(c['lo']), Fraction(c['hi']))), c['rel'], Fraction(c['bar'])) for c in cases]
    disagree = [i for i in range(len(cases)) if mine[i] != theirs[i]]
    ok(not disagree, 'concord: the Python decide() and verdict.js decide() agree on 600 seeded cases', str(len(disagree)) + ' disagreements' + ('' if not disagree else ' e.g. ' + json.dumps(cases[disagree[0]]) + ' ' + mine[disagree[0]] + ' vs ' + theirs[disagree[0]]))
    ok(len(set(mine)) == 3, 'concord: the cases exercise all three words', ' · '.join(sorted(set(mine))))

# ---- 4 · red controls -------------------------------------------------------------------------------------------------
tmp = tempfile.mkdtemp(prefix='claimbox-battery-')
try:
    base = load('optq-1d-cert2026')
    assert B.check_obj(base)['word'] == B.ADMITTED

    def expect(kind, mutate, label):
        o = clone(base)
        mutate(o)
        res = B.check_obj(o)
        red(res['word'] == B.REFUSED_WORD and res['kind'] == kind, label + ' -> ' + kind, (res['kind'] or res['word']) + ': ' + res['msg'][:80])

    expect('json-number', lambda o: o['predicate'][0].__setitem__('c', 1.463071582607559), 'a JSON number as the bar')
    expect('decimal-literal', lambda o: o['predicate'][0].__setitem__('c', '1.463071582607559'), 'a decimal string as the bar')
    expect('rational', lambda o: o['predicate'][0].__setitem__('c', '1463071582607559/0'), 'a zero denominator')
    expect('pin-mismatch', lambda o: o['domain']['pin'].__setitem__('sha256', o['domain']['pin']['sha256'][:-1] + ('0' if o['domain']['pin']['sha256'][-1] != '0' else '1')), 'the construction pin one hex digit off')
    expect('pin-unresolved', lambda o: o['domain']['pin'].__setitem__('path', 'corpus/optconst-queue/next-2026-10-18/pr-224/nothing.json'), 'a pin to a file that is not there')
    expect('pin-mismatch', lambda o: o['source'].__setitem__('sha256', '0' * 64), 'the source pin forged')
    expect('quote-not-verbatim', lambda o: o['source'].__setitem__('quote', o['source']['quote'] + ' (sic)'), 'a quote not in the pinned page')
    expect('printed-not-in-quote', lambda o: (o['predicate'][0].__setitem__('printed', '1.463071582607558'), o['predicate'][0].__setitem__('c', '1463071582607558/1000000000000000')), 'a printed bar the page does not print')
    expect('printed-mismatch', lambda o: o['predicate'][0].__setitem__('c', '1463071582607558/1000000000000000'), 'c one unit off the printed digits')
    expect('vocabulary', lambda o: o['predicate'][0].__setitem__('g', ['Sqrt', 'f']), 'a head outside the vocabulary (Sqrt)')
    expect('arity', lambda o: o['predicate'][0].__setitem__('g', ['Add', 'f']), 'Add with one argument')
    expect('symbol', lambda o: o['predicate'][0].__setitem__('g', ['Add', 'f', 'y']), 'an undeclared symbol')
    expect('json-number', lambda o: o['predicate'][0].__setitem__('g', ['Multiply', 'f', 2]), 'a JSON number inside an expression')
    expect('named', lambda o: o['predicate'][0]['g'].__setitem__('where', 'instruments/optq/does-not-exist.py'), 'a named function with no definition on disk')
    expect('reading', lambda o: o.__setitem__('reading', 'probable'), 'a fourth reading')
    expect('falsifier', lambda o: o.__setitem__('falsifier', []), 'no falsifier')
    expect('reference', lambda o: o.__setitem__('reference', ''), 'no reference')
    expect('schema', lambda o: o.__setitem__('verdict', 'CERTIFIED'), 'a verdict typed on the object')
    expect('schema', lambda o: o.pop('hypotheses'), 'hypotheses missing')
    expect('record-verdict-word', lambda o: o['record'].__setitem__('verdict', 'PROVED'), 'a verdict word outside the three')
    expect('record-verdict-word', lambda o: o['record'].__setitem__('verdict', 'CERTIFIED'), 'the object declaring a verdict the record does not hold')
    expect('record-row-missing', lambda o: o['record'].__setitem__('row', '1d-nobody'), 'a record row that does not exist')
    expect('record-missing', lambda o: o['record'].__setitem__('path', 'certs/nothing.json'), 'a record that does not exist')
    expect('record-value', lambda o: o['record'].__setitem__('value', 'js.decimal'), 'a record value that is a decimal string')
    expect('record-pin-mismatch', lambda o: o['domain']['pin'].update({'path': 'corpus/optconst-queue/next-2026-10-18/rozetyp/certificate.json', 'sha256': '62ac49ddbbfc9aa1053406363d9df9c912022ab85b72a447cf73c94bb9c1fd0e'}), 'an object pinning other bytes than the record decided')
    expect('repair', lambda o: o['repair'].__setitem__('c', '14630715826075593/10000000000000000'), 'a repair whose c is not its printed digits')
    expect('repair', lambda o: o['repair'].__setitem__('verdict', 'REFUTED'), 'a repair whose verdict the value does not give')

    # a forged record: the deciding record copied with its verdict flipped, and with its bar moved
    with open(os.path.join(ROOT, 'certs', 'autocorr-replay.json'), encoding='utf-8') as fh:
        rec = json.load(fh)
    flipped = clone(rec)
    for r in flipped['rows']:
        if r['id'] == '1d-cert2026':
            r['verdict'] = 'CERTIFIED'
    fp = os.path.join(tmp, 'flipped.json')
    with open(fp, 'w') as fh:
        json.dump(flipped, fh)
    o = clone(base)
    o['record']['path'] = os.path.relpath(fp, ROOT)
    o['record']['verdict'] = 'CERTIFIED'
    res = B.check_obj(o)
    red(res['kind'] == 'record-decision-mismatch', 'a forged record (verdict flipped to CERTIFIED) -> record-decision-mismatch: the value re-decided says REFUTED', str(res['kind']) + ': ' + res['msg'][:80])
    moved = clone(rec)
    for r in moved['rows']:
        if r['id'] == '1d-cert2026':
            r['claim'] = 'C_1d <= 1.463071582607558'
    mp = os.path.join(tmp, 'moved.json')
    with open(mp, 'w') as fh:
        json.dump(moved, fh)
    o = clone(base)
    o['record']['path'] = os.path.relpath(mp, ROOT)
    res = B.check_obj(o)
    red(res['kind'] == 'record-bar-mismatch', 'a forged record (bar moved) -> record-bar-mismatch', str(res['kind']) + ': ' + res['msg'][:80])

    # the vocabulary is read: an audit missing one operation stops the checker
    with open(B.ARB, encoding='utf-8') as fh:
        arb = json.load(fh)
    del arb['byOp']['tanh']
    ap = os.path.join(tmp, 'arb-missing-tanh.json')
    with open(ap, 'w') as fh:
        json.dump(arb, fh)
    stopped = False
    try:
        B.load_vocab(ap, B.VERDICT_JS)
    except SystemExit:
        stopped = True
    red(stopped, 'the kernel audit without tanh -> the checker refuses to run')
    stopped = False
    try:
        B.load_vocab(B.ARB, os.path.join(tmp, 'no-verdict.js'))
    except SystemExit:
        stopped = True
    red(stopped, 'verdict.js missing -> the checker refuses to run')

    # ---- 5 · a green control on the box path, and its reds -----------------------------------------------------------
    sp = os.path.join(tmp, 'page.md')
    with open(sp, 'w', encoding='utf-8') as fh:
        fh.write('The 1d page prints the exact value as 1.4630715826075593 (seventeen digits).\n')
    import hashlib
    ssha = hashlib.sha256(open(sp, 'rb').read()).hexdigest()
    rp = os.path.join(tmp, 'digits-record.json')
    with open(rp, 'w') as fh:
        json.dump({'rows': [{'id': 'digits', 'claim': 'the printed 1.4630715826075593 is the rounding of the exact value', 'verdict': 'CERTIFIED',
                             'value': '2039224160683882663565441886346340189798400/1393796574908163689489385839036226787118881'}]}, fh)
    green = {
        'id': 'synthetic-digits', 'text': 'the printed 1.4630715826075593 is the exact value rounded: the value lies in the box the digits allow',
        'source': {'what': 'a synthetic page (this battery)', 'path': os.path.relpath(sp, ROOT), 'sha256': ssha, 'quote': 'exact value as 1.4630715826075593'},
        'reading': 'epistemic',
        'domain': {'kind': 'box', 'sides': [{'name': 'x', 'lo': '1', 'hi': '2', 'source': 'the page\'s bounds 1 <= C_1d <= 1.4688 (synthetic)'}]},
        'predicate': [{'g': 'x', 'rel': 'in', 'printed': '1.4630715826075593', 'c': ['146307158260755925/100000000000000000', '146307158260755935/100000000000000000']}],
        'reference': 'the box is the half-unit-in-the-last-digit box of the printed seventeen digits', 'hypotheses': [],
        'falsifier': ['the exact value of the record lies outside the box'],
        'record': {'path': os.path.relpath(rp, ROOT), 'row': 'digits', 'value': 'value', 'verdict': 'CERTIFIED'}}
    res = B.check_obj(green)
    ok(res['word'] == B.ADMITTED and res['decided'] == [C], 'GREEN: a box-domain object with a printed-digits box ("in") is admitted and decided CERTIFIED', (res['kind'] or '') + ' ' + res['msg'])

    def gexpect(kind, mutate, label):
        o = clone(green)
        mutate(o)
        res = B.check_obj(o)
        red(res['word'] == B.REFUSED_WORD and res['kind'] == kind, label + ' -> ' + kind, (res['kind'] or res['word']) + ': ' + res['msg'][:80])

    gexpect('box-order', lambda o: o['domain']['sides'][0].update({'lo': '2', 'hi': '1'}), 'a box side with lo > hi')
    gexpect('unbounded', lambda o: o['domain']['sides'][0].__setitem__('hi', 'inf'), 'a box side to infinity (version 1)')
    gexpect('printed-mismatch', lambda o: o['predicate'][0].__setitem__('c', ['146307158260755920/100000000000000000', '146307158260755935/100000000000000000']), 'a digits box that is not the half-unit box')
    gexpect('decimal-literal', lambda o: o['domain']['sides'][0].__setitem__('lo', '1.0'), 'a decimal as a box end')
    gexpect('schema', lambda o: o['domain']['sides'][0].__setitem__('source', ''), 'a box side with no source')
    gexpect('box-order', lambda o: o['predicate'][0].__setitem__('c', ['2', '1']), 'an "in" box reversed')
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ---- 6 · version 3: decisions from the bytes alone, the second checker held to the first, Z3 ------------------------
import hashlib
PRIM = os.path.join(HERE, 'primitive')
REC = os.path.join(ROOT, 'certs', 'claimbox-decisions.json')
with open(REC, encoding='utf-8') as fh:
    DEC = json.load(fh)
dec_by = {r['id']: r for r in DEC['rows']}
FULL = os.environ.get('CLAIMBOX_FULL') == '1'
notrun = []
prim_files = sorted(f for f in os.listdir(PRIM) if f.endswith('.json'))
ok(len(prim_files) == 4 and set(os.path.splitext(f)[0] for f in prim_files) == set(dec_by), 'four primitive objects, each with a row in certs/claimbox-decisions.json', str(len(prim_files)))


def js_check(path):
    """the JavaScript checker's result for a file, as JSON; None if node fails"""
    js = "const C=require(process.argv[1]);C.setWords(C.loadVocab());console.log(JSON.stringify(C.check(process.argv[2])))"
    r = subprocess.run(['node', '-e', js, os.path.join(HERE, 'check.js'), path], capture_output=True, text=True, timeout=1800)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else None


def shape(res):
    return (res['word'], res['kind'], res['decided'], [fo and {k: fo.get(k) for k in ('word', 'witness', 'violations', 'value')} for fo in res['fromObject']])


for f in prim_files:
    name = os.path.splitext(f)[0]
    path = os.path.join(PRIM, f)
    r = dec_by[name]
    ok(hashlib.sha256(open(path, 'rb').read()).hexdigest() == r['sha256'], name + ': the object on disk is the one the record decided')
    if r['seconds'] <= 5 or FULL:
        res = B.check(path)
        ok(shape(res) == shape(r), name + ': re-decided from the bytes by check.py, identical to the record', res['word'] + ' ' + ' · '.join(fo['word'] for fo in res['fromObject'] if fo))
        jr = js_check(path)
        ok(jr is not None and shape(jr) == shape(r), name + ': check.js (no shared code) gives the same word, decisions, witness, count and value', 'js ' + (str(jr['word']) + ' ' + ' · '.join(fo['word'] for fo in jr['fromObject'] if fo) if jr else 'failed'))
    else:
        notrun.append(name + ' (' + str(r['seconds']) + ' s on record; CLAIMBOX_FULL=1 re-runs it in both languages)')

# the register's own number for the 605, read from its row, against the record's count (no re-run)
with open(os.path.join(ROOT, 'certs', 'mc100-einstein-arena.json'), encoding='utf-8') as fh:
    row605 = next(x for x in json.load(fh)['rows'] if x['id'] == 'ea-best-kissing-number-d11-605')
m605 = re.search(r'([\d,]+) of ([\d,]+) pairs', row605['scope'])
fo605 = [x for x in dec_by['prim-ea-605-kissing']['fromObject'] if x][0]
ok(m605 is not None and int(m605.group(1).replace(',', '')) == fo605['violations'] and row605['decision']['violations'] == fo605['violations'],
   'the 605 object\'s violating-pair count equals the register row\'s under the same reading of the bytes (decimal digits)', str(fo605['violations']) + ' vs ' + (m605.group(1) if m605 else '?'))
ok(fo605['word'] == R and fo605['witness']['at'] == {'i': 0, 'j': 48}, 'the 605 object is REFUTED with its witness pair recorded', json.dumps(fo605['witness']['at']))

# the ten named objects: the JavaScript checker held to the Python one
for f in files:
    path = os.path.join(CLAIMS, f)
    pr, jr = B.check(path), js_check(path)
    ok(jr is not None and (pr['word'], pr['kind'], pr['decided']) == (jr['word'], jr['kind'], jr['decided']), os.path.splitext(f)[0] + ': check.js agrees with check.py', (jr['word'] + ' ' + str(jr['kind']) if jr else 'js failed'))

# Z3 as a third decider on the 1d export: sat under the printed bar, unsat under the repaired one
z3 = shutil.which('z3')
tmp6 = tempfile.mkdtemp(prefix='claimbox-z3-')
try:
    if z3:
        o1d = json.load(open(os.path.join(PRIM, 'prim-1d-cert2026.json'), encoding='utf-8'))
        smt = B.to_smt(o1d)
        p1 = os.path.join(tmp6, '1d.smt2')
        open(p1, 'w').write(smt)
        z = subprocess.run([z3, '-T:300', '-smt2', p1], capture_output=True, text=True, timeout=400).stdout.strip().split('\n')[-1]
        ok(z == 'sat', 'Z3 on the 1d export, printed bar: sat (some instance violates: REFUTED), as the checkers and the record say', z)
        o2 = clone(o1d)
        o2['id'] = 'prim-1d-repaired'
        o2['predicate'][0]['printed'] = '1.4630715826075594'
        o2['predicate'][0]['c'] = '14630715826075594/10000000000000000'
        o2['source'] = {'what': 'the record (the SMT variant only)', 'path': 'certs/autocorr-replay.json', 'sha256': hashlib.sha256(open(os.path.join(ROOT, 'certs', 'autocorr-replay.json'), 'rb').read()).hexdigest(), 'quote': '1.4630715826075594'}
        o2.pop('record'); o2.pop('repair')
        p2 = os.path.join(tmp6, '1d-repaired.smt2')
        open(p2, 'w').write(B.to_smt(o2))
        z2 = subprocess.run([z3, '-T:300', '-smt2', p2], capture_output=True, text=True, timeout=400).stdout.strip().split('\n')[-1]
        ok(z2 == 'unsat', 'Z3 on the 1d export, repaired bar: unsat (every instance holds: CERTIFIED)', z2)
        ok('(define-fun q' in smt and smt.count('(ite ') < 2000, 'the export names its quantifier terms (a linear chain, not 2^599)', str(len(smt)) + ' bytes')
    else:
        notrun.append('Z3 (not on PATH; the 1d export is not decided by a third party here)')

    # ---- red controls for the version-3 kinds, on the 1d primitive object ------------------------------------------
    base3 = json.load(open(os.path.join(PRIM, 'prim-1d-cert2026.json'), encoding='utf-8'))
    assert B.check_obj(base3)['word'] == B.ADMITTED

    def pexpect(kind, mutate, label):
        o = clone(base3)
        mutate(o)
        res = B.check_obj(o)
        red(res['word'] == B.REFUSED_WORD and res['kind'] == kind, label + ' -> ' + kind, (res['kind'] or res['word']) + ': ' + res['msg'][:80])

    pexpect('data', lambda o: o['domain'].__setitem__('count', 301), 'a declared count the decoded bytes contradict')
    pexpect('data', lambda o: o['domain']['data'].__setitem__('elements', 'integers'), 'doubles declared as integers')
    pexpect('data', lambda o: o['domain']['data'].__setitem__('select', 'cells'), 'a select that is not the array')
    pexpect('index', lambda o: o['predicate'][0].__setitem__('g', ['Index', 'f', 'n']), 'an index out of range')
    pexpect('empty-range', lambda o: o['predicate'][0].__setitem__('g', ['MaxOver', 'm', '1', '0', 'm']), 'a maximum over an empty range')
    pexpect('division-by-zero', lambda o: o['predicate'][0].__setitem__('g', ['Divide', '1', ['Subtract', 'n', 'n']]), 'a division by zero in the evaluation')
    pexpect('schema', lambda o: (o['predicate'][0].pop('printed'), o['predicate'][0].__setitem__('c', '3/2')), 'a bar with no printed digits that is not the zero')
    pexpect('index', lambda o: o['predicate'][0].__setitem__('g', ['Index', 'f', '0', '0']), 'Index deeper than the data')
    pexpect('arity', lambda o: o['predicate'][0].__setitem__('g', ['Sum', 'k', '0', '1']), 'Sum without its body')
    pexpect('symbol', lambda o: o['predicate'][0].__setitem__('g', ['Sum', 'k', '0', '1', ['Index', 'f', 'm']]), 'a quantifier body naming an unbound symbol')
    # a forged record value: the record copied with js.value moved by one
    with open(os.path.join(ROOT, 'certs', 'autocorr-replay.json'), encoding='utf-8') as fh:
        rec = json.load(fh)
    forged = clone(rec)
    for r in forged['rows']:
        if r['id'] == '1d-cert2026':
            r['js']['value'] = '2039224160683882663565441886346340189798401/1393796574908163689489385839036226787118881'
    fp = os.path.join(tmp6, 'forged-value.json')
    json.dump(forged, open(fp, 'w'))
    o = clone(base3)
    o['record']['path'] = os.path.relpath(fp, ROOT)
    res = B.check_obj(o)
    red(res['kind'] == 'record-value-mismatch', 'a record whose exact value is not the one the bytes give -> record-value-mismatch', str(res['kind']) + ': ' + res['msg'][:80])
    # ---- the resolution box (2026-10-21): the circle-packing object, its green and its reds --------------------------
    base4 = json.load(open(os.path.join(PRIM, 'prim-ea-542-circle-packing.json'), encoding='utf-8'))
    r4 = B.check_obj(base4)
    fo4 = r4['fromObject']
    ok(r4['word'] == B.ADMITTED and fo4[0]['word'] == C and all(x['word'] == C for x in fo4[1:5]) and fo4[5]['word'] == R and fo4[5]['violations'] == 3 and fo4[5]['witness']['at'] == {'i': 1, 'j': 13}
       and any('declared resolution' in n for n in r4['notes']),
       'GREEN: circle packing (solution 542) with the platform\'s resolution box — Σ r_i CERTIFIED inside printed ± 1e-10, containment CERTIFIED, non-overlap REFUTED with 3 pairs (the finding, recorded as found)',
       (r4['kind'] or r4['word']) + ' ' + ' · '.join(x['word'] for x in fo4 if x))
    hw_box = Fraction(base4['predicate'][0]['c'][1]) - Fraction(base4['predicate'][0]['printed'])
    ok(hw_box == Fraction(1, 10 ** 10) and Fraction(fo4[0]['value']) < Fraction(base4['predicate'][0]['printed']) and Fraction(base4['predicate'][0]['printed']) - Fraction(fo4[0]['value']) > Fraction(5, 10 ** 17),
       'the exact Σ r_i lies below the print by more than half a unit of its 17th digit: the half-unit rule would have refuted a true claim', '%.2e' % float(Fraction(base4['predicate'][0]['printed']) - Fraction(fo4[0]['value'])))
    half_unit = clone(base4)
    del half_unit['predicate'][0]['box']
    rh = B.check_obj(half_unit)
    red(rh['word'] == B.REFUSED_WORD and rh['kind'] == 'printed-mismatch', 'the same object without its box block -> printed-mismatch (the half-unit rule stands)', str(rh['kind']) + ': ' + rh['msg'][:80])

    def bexpect(kind, mutate, label):
        o = clone(base4)
        mutate(o)
        res = B.check_obj(o)
        red(res['word'] == B.REFUSED_WORD and res['kind'] == kind, label + ' -> ' + kind, (res['kind'] or res['word']) + ': ' + res['msg'][:80])

    bexpect('schema', lambda o: o['predicate'][0]['box'].pop('source'), 'a resolution box with no source')
    bexpect('printed-mismatch', lambda o: o['predicate'][0].__setitem__('c', ['6589957712044019/2500000000000000', '6589957712644019/2500000000000000']), 'a box wider than the quoted resolution')
    bexpect('quote-not-verbatim', lambda o: o['predicate'][0]['box']['source'].__setitem__('quote', o['predicate'][0]['box']['source']['quote'].replace('1e-10', '1e-9')), 'a resolution quote the pinned source does not print')
    bexpect('json-number', lambda o: o['predicate'][0]['box'].__setitem__('halfWidth', 1e-10), 'a halfWidth given as a JSON number')
    bexpect('resolution', lambda o: (o['predicate'][0]['box'].__setitem__('halfWidth', '1/1000000000'), o['predicate'][0].__setitem__('c', ['6589957712044019/2500000000000000', '6589957712544019/2500000000000000'])), 'a halfWidth that is not the quoted resolution')
    bexpect('resolution', lambda o: o['predicate'][0]['box'].__setitem__('rule', '1e-12-relative'), 'a rule stated where the quote prints a nonzero resolution')
    bexpect('resolution', lambda o: o['predicate'][0]['box'].__setitem__('key', 'scoring'), 'a key the quote prints no number under')
    bexpect('pin-mismatch', lambda o: o['predicate'][0]['box']['source'].__setitem__('sha256', '0' * 64), 'the resolution source pin forged')
    bexpect('schema', lambda o: o['predicate'][1].__setitem__('box', o['predicate'][0]['box']), 'a box on a predicate that is not "in"')
    j4 = js_check(os.path.join(PRIM, 'prim-ea-542-circle-packing.json'))
    ok(j4 is not None and shape(j4) == shape(r4) and any('declared resolution' in n for n in j4['notes']), 'check.js reads the resolution box the same way (word, decisions, witness, count, value, note)', 'js ' + (j4['word'] if j4 else 'failed'))

    # the other reading of the same bytes: a decision, not a refusal — the two counts of the 605 case, in FULL mode only
    if FULL:
        o6 = json.load(open(os.path.join(PRIM, 'prim-ea-605-kissing.json'), encoding='utf-8'))
        o6['domain']['data']['elements'] = 'doubles'
        r6 = B.check_obj(o6)
        fo = [x for x in r6['fromObject'] if x][0]
        ok(r6['word'] == B.ADMITTED and fo['violations'] == 9480, 'the 605 bytes read as doubles give 9,480 violating pairs (decimals: 9,510) — two readings, two exact counts', str(fo['violations']))
    else:
        notrun.append('the 605 doubles-reading count (CLAIMBOX_FULL=1)')
finally:
    shutil.rmtree(tmp6, ignore_errors=True)

print('\n' + str(passes) + ' pass, ' + str(fails) + ' fail; ' + str(reds_fired) + '/' + str(reds) + ' red controls fired — instruments/claimbox' + ('\nNOT RUN (not counted as passing): ' + '; '.join(notrun) if notrun else ''))
sys.exit(0 if fails == 0 and reds_fired == reds else 1)
