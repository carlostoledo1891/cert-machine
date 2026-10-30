#!/usr/bin/env python3
"""instruments/ledger/battery.py — the gate of the ledger replay (make test "ledger: sampled replay"). Standard library + node.

WHAT IT HOLDS. (1) The receiver's own machine decider (instruments/claimbox/tm.py, a third implementation) agrees with the
fixtures: BB(4) halts at step 107, BB(5) runs 200,000 steps without halting, and each ledger's last checkpoint is tm.py's
configuration. (2) The recorded decisions (decisions.json: three ledgers, each replayed in full and by the seeded sample
of the record) re-derive identically, both simulators agreeing on every field. (3) The words: a full replay CERTIFIES the
HIT and the RECORD in the funnel's shapes; a clean sample is REFUSED with the funnel's downgrade, never CERTIFIED; the
forged row is REFUTED with its witness. (4) RED CONTROLS: a row edited without re-chaining, a one-transition mutant, a lazy
runner, a halt hidden inside a stretch, a halt inside a RECORD's box, a start that is not blank, a pin, a claim outside the
two shapes, a box not reached, a line not in the chained form, a bad k, reordered lines, and two simulators that disagree.
(5) The detection rate: on the forged ledger (2 of 20 stretches wrong) the seeded sample of 5 catches it at the predicted
rate 1 - C(18,5)/C(20,5), and above the plan's bound 1 - (1 - f)^k.

usage: python3 instruments/ledger/battery.py        exit 0 iff every check passes and every red control fires
MIT"""
import importlib.util
import json
import math
import os
import shutil
import sys
import tempfile
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


L = load('ledgerreplay', os.path.join(HERE, 'replay.py'))
TM = load('claimboxtm', os.path.join(ROOT, 'instruments', 'claimbox', 'tm.py'))
C, R, F = L.W['C'], L.W['R'], L.W['F']
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


LED = os.path.join(HERE, 'ledgers')
BB4, BB5, FORGED = (os.path.join(LED, n + '.jsonl') for n in ('bb4-hit', 'bb5-record', 'bb5-forged-row'))


def records(path):
    recs = [json.loads(x) for x in open(path, encoding='utf-8').read().splitlines()]
    for r in recs:
        r.pop('chain')
    return recs


# ---- 1 · the fixtures against tm.py, the receiver's machine decider -----------------------------------------------------
for path, n, halt in ((BB4, 200, 107), (BB5, 200000, None)):
    recs = records(path)
    rows, _ = TM.parse_table(open(os.path.join(ROOT, recs[0]['machine']['path']), encoding='utf-8').read())
    sim = TM.simulate(rows, recs[-1]['step'] if halt is None else n)
    last = recs[-1]
    ok(sim['halted_at'] == halt and (sim['state'], sim['head'], sorted(sim['ones'])) == (last['state'], last['head'], last['ones']),
       os.path.basename(path) + ': tm.py agrees — ' + ('halts at step ' + str(halt) if halt else 'no halt in 200,000 steps') + ', the last checkpoint is its configuration',
       str(sim['halted_at']) + ' · ' + str(len(sim['ones'])) + ' ones')

# ---- 2 · the recorded decisions re-derive, both simulators agreeing ----------------------------------------------------------
DEC = json.load(open(os.path.join(HERE, 'decisions.json'), encoding='utf-8'))
ok(len(DEC['rows']) == 6 and DEC['seed'] == '2026-10-30' and DEC['k'] == 5, 'decisions.json: three ledgers, full and sampled (seed 2026-10-30, k = 5)', str(len(DEC['rows'])))
for row in DEC['rows']:
    again = L.joint(os.path.join(ROOT, row['ledger']), row['mode'], DEC['seed'], DEC['k'])
    ok(L.stable(again) == L.stable(row), row['ledger'].split('/')[-1] + ' ' + row['mode'] + ': re-derived identically, replay.py and replay.js agreeing (' + row['word'] + ')',
       again['word'] + ' ' + again['simulators'])
by = {(r['ledger'].split('/')[-1], r['mode']): r for r in DEC['rows']}

# ---- 3 · the words, in the funnel's two shapes ------------------------------------------------------------------------------
h = by[('bb4-hit.jsonl', 'full')]
ok(h['word'] == C and h['claimText'] == 'HIT witness={"halt":107} certificate=sha256:' + h['chainHead'], 'a full replay CERTIFIES the HIT (the funnel\'s hitClaim: witness and certificate)', h['claimText'])
r5 = by[('bb5-record.jsonl', 'full')]
ok(r5['word'] == C and r5['claimText'].startswith('RECORD box=[steps 1..200000 of ') and 'exhaustionCertificate=sha256:' in r5['claimText'],
   'a full replay CERTIFIES the RECORD, the replay its exhaustion certificate (the funnel\'s recordClaim)', r5['claimText'][:90])
s5 = by[('bb5-record.jsonl', 'sample')]
ok(s5['word'] == F and s5['claimText'].endswith('] ' + L.DOWNGRADE) and s5['detects']['oneStretch'] == '1/4',
   'a clean sample of 5 of 20 is REFUSED — a sample is not a proof — with the funnel\'s downgrade "' + L.DOWNGRADE + '" and its detection bounds', s5['rule'])
ok(not any(r['mode'] == 'sample' and r['word'] == C for r in DEC['rows']), 'no sampled decision in the record is CERTIFIED')
fr = by[('bb5-forged-row.jsonl', 'full')]
w = fr['witness'] or {}
ok(fr['word'] == R and w.get('stretch') == 6 and w.get('line') == 8 and w['claimed']['ones'] == w['replayed']['ones'] + 1,
   'FALSIFIER: the forged row (one cell added at checkpoint 7, the chain re-hashed) is REFUTED by the full replay, witness stretch 6 → step 70,000: 446 cells claimed, 445 replayed',
   json.dumps(w)[:140])
fs_ = by[('bb5-forged-row.jsonl', 'sample')]
ok(fs_['word'] in (R, F) and fs_['word'] != C, 'the forged row under the record\'s sample is ' + fs_['word'] + ' (its 5 stretches ' + str(fs_['sample']) + '; never CERTIFIED)', str(fs_['rule'] or fs_['witness'])[:100])

# ---- 4 · red controls --------------------------------------------------------------------------------------------------------
tmp = tempfile.mkdtemp(prefix='ledger-battery-')
try:
    def put(name, text):
        p = os.path.join(tmp, name + '.jsonl')
        open(p, 'w', encoding='utf-8').write(text)
        return p

    def rechain(recs, ident=None):
        return L.chain_lines(recs, ident or recs[0]['id'])

    def expect(word, path, label, mode='full', k=None, check=None):
        d = L.joint(path, mode, 'red', k)
        fired = d['word'] == word and d['simulators'] == 'agree' and (check is None or check(d))
        red(fired, label + ' -> ' + word, d['word'] + ' ' + d['simulators'] + ' ' + str(d['rule'] or (d['witness'] or {}).get('why'))[:90])
        return d

    # a row edited without re-chaining: the chain catches it whatever the sample
    lines = open(BB4, encoding='utf-8').read().splitlines()
    o = json.loads(lines[6])
    o['head'] += 1
    lines[6] = json.dumps(o, separators=(',', ':'))
    expect(R, put('edited', '\n'.join(lines) + '\n'), 'a checkpoint edited without re-chaining (sample of 1)', 'sample', 1,
           lambda d: d['witness']['why'] == 'the chain breaks' and d['witness']['line'] == 6)
    # a one-transition mutant: the runner ran another machine than the one it names
    mrows = L.parse_machine(open(os.path.join(ROOT, 'instruments/ledger/machines/bb4.tm'), encoding='utf-8').read())
    mrows[3] = (mrows[3][0], (1, 1, 0))
    halted, t, _, _, _ = L.run(mrows, 0, 0, [], 0, 1000)
    claim = {'shape': 'HIT', 'halt': t} if halted else {'shape': 'RECORD', 'box': [1, 1000]}
    expect(R, put('mutant', L.write_ledger('instruments/ledger/machines/bb4.tm', 'bb4-mutant', claim, 10, rows=mrows)), 'a one-transition mutant run under the named machine (D on 1: 0R0 → 1R0)',
           check=lambda d: d['witness']['why'].startswith('the replayed stretch'))
    # a lazy runner: one stretch skipped, its end copied from its start
    recs = records(BB5)
    recs[0]['id'] = 'lazy'
    for key in ('state', 'head', 'ones'):
        recs[13][key] = recs[12][key]
    expect(R, put('lazy', rechain(recs)), 'a lazy runner (stretch 11 skipped: checkpoint 12 copies checkpoint 11)', check=lambda d: d['witness']['stretch'] in (11, 12))
    # a halt hidden inside a stretch: the HIT moved one step past the true halt
    recs = records(BB4)
    recs[0]['claim'] = {'shape': 'HIT', 'halt': 108}
    recs[-1]['step'] = 108
    expect(R, put('late-halt', rechain(recs)), 'a HIT claimed at 108 where the machine halts at 107', check=lambda d: d['witness']['replayed']['step'] == 107 and d['witness']['replayed']['halted'])
    # a RECORD over a box the machine halts in
    recs = records(BB4)
    recs[0]['claim'] = {'shape': 'RECORD', 'box': [1, 110]}
    recs[-1].update({'step': 110, 'halted': False})
    expect(R, put('record-halts', rechain(recs)), 'a RECORD "no halt in 1..110" on a machine that halts at 107')
    # a start that is not the blank tape
    recs = records(BB4)
    recs[1]['ones'] = [5]
    expect(R, put('start', rechain(recs)), 'a first checkpoint that is not the blank configuration', check=lambda d: 'blank' in d['witness']['why'])
    # the machine pin
    recs = records(BB4)
    recs[0]['machine']['sha256'] = '0' * 64
    expect(F, put('pin', rechain(recs)), 'a machine that does not hash to the header\'s pin')
    # claims outside the funnel's two shapes
    recs = records(BB4)
    recs[0]['claim'] = {'shape': 'BEST', 'halt': 107}
    expect(F, put('shape', rechain(recs)), 'a claim that is neither HIT nor RECORD')
    recs = records(BB5)
    recs[0]['claim'] = {'shape': 'RECORD', 'box': [1, 200000], 'text': 'the longest run known'}
    expect(F, put('superlative', rechain(recs)), 'a RECORD carrying a free-text superlative')
    recs = records(BB5)
    recs[0]['claim'] = {'shape': 'RECORD', 'box': [1, 300000]}
    expect(F, put('coverage', rechain(recs)), 'a RECORD whose box the ledger does not reach')
    # the chained-line form, k, order
    lines = open(BB4, encoding='utf-8').read().splitlines()
    lines[2] = json.dumps(json.loads(lines[2]))
    expect(F, put('form', '\n'.join(lines) + '\n'), 'a line not in the funnel\'s chained-line form (spaces)')
    expect(F, BB4, 'k = 12 on a ledger of 11 stretches', 'sample', 12)
    lines = open(BB4, encoding='utf-8').read().splitlines()
    lines[3], lines[4] = lines[4], lines[3]
    expect(F, put('order', '\n'.join(lines) + '\n'), 'two checkpoints swapped')
    # two simulators that disagree: replay.py's simulator made wrong in-process; the joint word must be REFUSED
    real = L.run

    def wrong(rows, state, head, ones, t0, t1):
        hlt, t, q, hd, on = real(rows, state, head, ones, t0, t1)
        return hlt, t, q, hd + (1 if t0 >= 50 else 0), on
    L.run = wrong
    try:
        d = L.joint(BB4, 'full')
    finally:
        L.run = real
    red(d['word'] == F and d['simulators'] == 'disagree' and d['js'] and d['js']['word'] == C,
        'the two simulators disagreeing (replay.py\'s head moved once) -> REFUSED, no decision; replay.js alone said CERTIFIED', d['word'] + ' ' + d['simulators'])
finally:
    shutil.rmtree(tmp, ignore_errors=True)

# ---- 5 · the detection rate: skipped or forged stretches caught at the predicted rate -------------------------------------------
full = L.decide(FORGED, 'full')
# a full decision replays every stretch before it words the witness, so its REFUTED stretches are the complete bad set
bad = {s['j'] for s in full['stretches'] if s['word'] == R} if full['word'] == R else set()
ok(bad == {6, 7}, 'the forged checkpoint spoils the two stretches beside it (6 ends at it, 7 starts from it)', str(sorted(bad)))
K, k, m, S = 20, 5, len(bad), 400
caught = sum(1 for s in range(S) if set(L.draw('rate-' + str(s), full['chainHead'], k, K)) & bad)
p = 1 - Fraction(math.comb(K - m, k), math.comb(K, k))
bound = 1 - (1 - Fraction(m, K)) ** k
rate = caught / S
sig = math.sqrt(float(p) * (1 - float(p)) / S)
ok(abs(rate - float(p)) < 4 * sig and p >= bound, 'detection: ' + str(caught) + ' of ' + str(S) + ' seeded samples of 5 catch the forgery (' + ('%.3f' % rate) + '), predicted 1 - C(18,5)/C(20,5) = '
   + ('%.3f' % float(p)) + ' (within 4σ), above the plan\'s bound 1 - (1 - 1/10)^5 = ' + ('%.3f' % float(bound)), str(p))

print('\n' + str(passes) + ' pass, ' + str(fails) + ' fail; ' + str(reds_fired) + '/' + str(reds) + ' red controls fired — instruments/ledger')
sys.exit(0 if fails == 0 and reds_fired == reds else 1)
