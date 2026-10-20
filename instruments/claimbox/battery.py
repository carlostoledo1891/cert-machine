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

# ---- 3b · the yield measurement (version 2) re-derives ---------------------------------------------------------------
yr = subprocess.run([sys.executable, os.path.join(HERE, 'yield.py'), '--check'], capture_output=True, text=True, timeout=120)
ok(yr.returncode == 0, 'yield: certs/claimclaimbox-yield.json re-derives from the register and the table', (yr.stdout or yr.stderr).strip()[:110])
with open(os.path.join(ROOT, 'certs', 'claimbox-yield.json'), encoding='utf-8') as fh:
    Y = json.load(fh)
ok(Y['register']['rows'] == 132 and Y['yieldAsIs']['yes'] * 2 >= Y['yieldAsIs']['of'], 'yield: the kill switch is not tripped (at least half admitted as is)', str(Y['yieldAsIs']))
ok(Y['counts']['recordOnDisk'] == Y['register']['rows'], 'yield: every deciding record is on disk', str(Y['counts']['recordOnDisk']))
with open(os.path.join(HERE, 'yield-table.json'), encoding='utf-8') as fh:
    T = json.load(fh)
forged = clone(T); forged['rows'].pop(next(iter(forged['rows'])))
fp_t = os.path.join(tempfile.gettempdir(), 'claimbox-yield-table-forged.json')
with open(fp_t, 'w') as fh:
    json.dump(forged, fh)
saved = B_TABLE = None
yr2 = subprocess.run([sys.executable, '-c', "import importlib.util,sys;sp=importlib.util.spec_from_file_location('y',sys.argv[1]);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);m.TABLE=sys.argv[2];m.derive()", os.path.join(HERE, 'yield.py'), fp_t], capture_output=True, text=True, timeout=120)
red(yr2.returncode != 0 and 'disagree on the rows' in yr2.stderr, 'yield: a table missing one register row -> refused', yr2.stderr.strip()[:90])
os.remove(fp_t)

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

print('\n' + str(passes) + ' pass, ' + str(fails) + ' fail; ' + str(reds_fired) + '/' + str(reds) + ' red controls fired — instruments/claimbox')
sys.exit(0 if fails == 0 and reds_fired == reds else 1)
