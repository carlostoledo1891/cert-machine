#!/usr/bin/env python3
"""instruments/ledger/replay.py — sampled exact replay of a search ledger, on two simulators (2026-10-30). Standard library + node.

WHAT A LEDGER IS (SCHEMA.md beside this file). The progress record of a watcher: a small Turing machine run from the blank
tape, written as hash-chained checkpoints (the funnel's chained lines, machine/funnel/funnel.js chainLine), and one claim in
the funnel's two legal shapes — a HIT (the machine halts at step T: existential, a witness) or a RECORD (the box named: no
halt in steps 1..N). A stretch is the run between two consecutive checkpoints.

WHAT THIS DECIDES. Every line is read and the chain is re-hashed (a broken link is REFUTED, the line is the witness); the
start must be the blank configuration; then the stretches are replayed EXACTLY — all of them (--full), or a seeded sample of
k (--seed S --k k: the sample is drawn from sha256(seed:chainHead:j), so the runner cannot know it before the auditor names
the seed, and it is recorded). A replayed stretch that does not end at the next checkpoint is REFUTED with its witness
(the stretch, the claimed and the replayed configuration). The claim is CERTIFIED only when every stretch was replayed
and every one agrees (the replay is then the exhaustion certificate, in the funnel's words); a clean sample of k < K leaves
the claim REFUSED — a sample is not a proof — and states what it would have caught: a runner whose fraction f of
stretches is wrong escapes k distinct draws with probability C(K - fK, k)/C(K, k) <= (1 - f)^k.

TWO SIMULATORS. This file and replay.js implement the same specification with no shared code (Python ints and sets here,
JavaScript numbers and Sets there). The decision printed is the two programs' JOINT word: each decides the ledger alone,
and the two decisions — sample, every stretch's word, witness, rule, claim text — must be identical, or the ledger is
REFUSED (the simulators disagree). The verdict words are read from instruments/verdict.js; the RECORD downgrade from the
funnel (machine/funnel/funnel.js).

usage: python3 instruments/ledger/replay.py <ledger.jsonl> (--full | --seed S --k K)       the joint decision; exit 1 unless CERTIFIED
       python3 instruments/ledger/replay.py --alone <ledger.jsonl> (--full | --seed S --k K)  this simulator's decision only, as JSON
       python3 instruments/ledger/replay.py --record <out.json> --seed S --k K <ledger.jsonl>...   each ledger decided full and sampled, jointly, written as a record
       python3 instruments/ledger/replay.py --write <machine.tm> --id ID (--hit | --box N) --stride S   an honest runner's ledger on stdout (fixtures)
MIT"""
import hashlib
import json
import os
import re
import subprocess
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
VERDICT_JS = os.path.join(ROOT, 'instruments', 'verdict.js')
FUNNEL_JS = os.path.join(ROOT, 'machine', 'funnel', 'funnel.js')
SAFE = (1 << 53) - 1


def die(m):
    sys.stderr.write('LEDGER REPLAY REFUSED TO RUN: ' + m + '\n')
    sys.exit(2)


def words():
    with open(VERDICT_JS, encoding='utf-8') as f:
        src = f.read()
    w = re.findall(r"^const (?:CERTIFIED|REFUTED|REFUSED) = '([A-Z]+)';", src, re.M)
    if sorted(w) != ['CERTIFIED', 'REFUSED', 'REFUTED']:
        die('verdict.js does not declare the three words where this program reads them')
    return dict(zip(('C', 'R', 'F'), (x for x in ('CERTIFIED', 'REFUTED', 'REFUSED') if x in w)))


def downgrade():
    with open(FUNNEL_JS, encoding='utf-8') as f:
        m = re.search(r"^const DOWNGRADE = '([^']+)';", f.read(), re.M)
    if not m:
        die('machine/funnel/funnel.js does not declare DOWNGRADE where this program reads it')
    return m.group(1)


W = words()
DOWNGRADE = downgrade()


def sha(b):
    return hashlib.sha256(b if isinstance(b, bytes) else b.encode('utf-8')).hexdigest()


def compact(v):
    return json.dumps(v, separators=(',', ':'), ensure_ascii=False)


def stable(v):
    """the funnel's stableStringify: keys sorted, compact"""
    return json.dumps(v, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


class Refused(Exception):
    pass


class Refuted(Exception):
    def __init__(self, witness):
        Exception.__init__(self, witness.get('why', ''))
        self.witness = witness


# ---- the machine ---------------------------------------------------------------------------------------------------------
def parse_machine(text):
    """a (Q, 2) table: one row per state, two cells 'wDq' or '---', '#' comments; returns a list of (cell0, cell1)"""
    rows = []
    for raw in text.split('\n'):
        line = raw.split('#', 1)[0].strip()
        if not line:
            continue
        cells = line.split()
        if len(cells) != 2:
            raise Refused('the machine has a row of ' + str(len(cells)) + ' cells')
        row = []
        for c in cells:
            if c == '---':
                row.append(None)
                continue
            m = re.fullmatch(r'([01])([LR])(\d+)', c)
            if not m:
                raise Refused('the machine has an unreadable cell ' + c)
            row.append((int(m.group(1)), -1 if m.group(2) == 'L' else 1, int(m.group(3))))
        rows.append(tuple(row))
    if not rows:
        raise Refused('the machine has no rows')
    for r in rows:
        for c in r:
            if c is not None and c[2] >= len(rows):
                raise Refused('the machine targets a state it does not have')
    return rows


def run(rows, state, head, ones, t0, t1):
    """from the configuration at step t0, steps t0+1..t1; step t reads the cell under the head, '---' halts at t (the halting
    step counts and writes nothing). Returns (halted, step reached, state, head, ones)."""
    ones = set(ones)
    for t in range(t0 + 1, t1 + 1):
        c = rows[state][1 if head in ones else 0]
        if c is None:
            return True, t, state, head, ones
        if c[0]:
            ones.add(head)
        else:
            ones.discard(head)
        head += c[1]
        state = c[2]
    return False, t1, state, head, ones


def summary(halted, step, state, head, ones):
    o = sorted(ones)
    return {'step': step, 'halted': halted, 'state': state, 'head': head, 'ones': len(o),
            'digest': sha(compact([1 if halted else 0, state, head, o]))[:16]}


# ---- reading the ledger ----------------------------------------------------------------------------------------------------
def is_int(v):
    return isinstance(v, int) and not isinstance(v, bool) and -SAFE <= v <= SAFE


def read(path):
    with open(path, 'rb') as f:
        raw = f.read()
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        raise Refused('the ledger is not UTF-8')
    lines = text.split('\n')
    if lines and lines[-1] == '':
        lines.pop()
    if len(lines) < 3:
        raise Refused('a ledger has a header and at least two checkpoints')
    objs = []
    for n, line in enumerate(lines):
        try:
            o = json.loads(line)
        except ValueError:
            raise Refused('line ' + str(n) + ' is not JSON')
        if not isinstance(o, dict):
            raise Refused('line ' + str(n) + ' is not a JSON object')
        objs.append(o)
    return raw, lines, objs


def validate(lines, objs):
    h = objs[0]
    if list(h) != ['kind', 'format', 'id', 'machine', 'claim', 'chain'] or h['kind'] != 'ledger' or h['format'] != 1 or isinstance(h['format'], bool):
        raise Refused('line 0 is not a format-1 ledger header {kind, format, id, machine, claim, chain}')
    if not isinstance(h['id'], str) or not h['id']:
        raise Refused('the header has no id')
    mc = h['machine']
    if not isinstance(mc, dict) or sorted(mc) != ['path', 'sha256'] or not isinstance(mc['path'], str) or not isinstance(mc['sha256'], str):
        raise Refused('the header\'s machine is not {path, sha256}')
    cl = h['claim']
    if isinstance(cl, dict) and list(cl) == ['shape', 'halt'] and cl['shape'] == 'HIT' and is_int(cl['halt']) and cl['halt'] >= 1:
        pass
    elif isinstance(cl, dict) and list(cl) == ['shape', 'box'] and cl['shape'] == 'RECORD' and isinstance(cl['box'], list) and len(cl['box']) == 2 \
            and all(is_int(x) for x in cl['box']) and cl['box'][0] == 1 and cl['box'][1] >= 1:
        pass
    else:
        raise Refused('a claim from a search is a HIT {shape, halt} or a RECORD {shape, box: [1, N]}; this one is neither')
    cps = objs[1:]
    for i, c in enumerate(cps):
        if list(c) != ['kind', 'i', 'step', 'halted', 'state', 'head', 'ones', 'chain'] or c['kind'] != 'checkpoint':
            raise Refused('line ' + str(i + 1) + ' is not a checkpoint {kind, i, step, halted, state, head, ones, chain}')
        if not (is_int(c['i']) and c['i'] == i):
            raise Refused('line ' + str(i + 1) + ': checkpoints are numbered 0, 1, 2, … in order')
        if not (is_int(c['step']) and is_int(c['state']) and is_int(c['head']) and isinstance(c['halted'], bool)):
            raise Refused('line ' + str(i + 1) + ': step, state and head are integers and halted a boolean')
        if not isinstance(c['ones'], list) or not all(is_int(x) for x in c['ones']) or any(c['ones'][j] >= c['ones'][j + 1] for j in range(len(c['ones']) - 1)):
            raise Refused('line ' + str(i + 1) + ': ones is the strictly increasing list of the cells holding 1')
        if i and c['step'] <= cps[i - 1]['step']:
            raise Refused('line ' + str(i + 1) + ': the steps do not increase')
        if c['halted'] and i != len(cps) - 1:
            raise Refused('line ' + str(i + 1) + ': only the last checkpoint may be a halt')
    for n, (line, o) in enumerate(zip(lines, objs)):
        body = {k: v for k, v in o.items() if k != 'chain'}
        if not isinstance(o.get('chain'), str) or line != compact(body)[:-1] + ',"chain":"' + o['chain'] + '"}':
            raise Refused('line ' + str(n) + ' is not in the chained-line form (the funnel\'s chainLine)')
    last = cps[-1]
    if cl['shape'] == 'HIT' and not (last['halted'] and last['step'] == cl['halt']):
        raise Refused('the HIT claims a halt at step ' + str(cl['halt']) + '; the last checkpoint is not that halt')
    if cl['shape'] == 'RECORD' and not (not last['halted'] and last['step'] == cl['box'][1]):
        raise Refused('the RECORD names steps 1..' + str(cl['box'][1]) + '; the last checkpoint does not close that box')
    return h, cps


def chain_check(lines, objs, ident):
    prev = sha('GENESIS:' + ident)
    for n, o in enumerate(objs):
        body = {k: v for k, v in o.items() if k != 'chain'}
        want = sha(prev + '\n' + compact(body))
        if o['chain'] != want:
            raise Refuted({'why': 'the chain breaks', 'line': n, 'claimed': o['chain'], 'recomputed': want})
        prev = want
    return prev


def draw(seed, head, k, K):
    """k distinct stretch indices from sha256(seed:head:j), j = 0, 1, …; returned sorted"""
    chosen, j = [], 0
    while len(chosen) < k:
        r = int(sha(str(seed) + ':' + head + ':' + str(j))[:13], 16) % K
        if r not in chosen:
            chosen.append(r)
        j += 1
    return sorted(chosen)


def detects(k, K):
    out = {'oneStretch': str(Fraction(k, K))}
    for f in ('1/100', '1/10'):
        out['f=' + f] = str(1 - (1 - Fraction(f)) ** k)
    return out


def decide(path, mode, seed=None, k=None):
    """this simulator's decision, alone: a dict the JavaScript program must reproduce exactly"""
    rel = os.path.relpath(os.path.abspath(path), ROOT)
    out = {'ledger': rel, 'sha256': None, 'id': None, 'chainHead': None, 'machine': None, 'claim': None, 'K': None, 'mode': mode,
           'seed': str(seed) if mode == 'sample' else None, 'k': None, 'sample': None, 'stretches': [], 'word': W['F'], 'rule': None,
           'witness': None, 'detects': None, 'claimText': None}
    try:
        raw, lines, objs = read(path)
        out['sha256'] = sha(raw)
        h, cps = validate(lines, objs)
        out['id'], out['machine'], out['claim'] = h['id'], h['machine'], h['claim']
        K = len(cps) - 1
        out['K'] = K
        mp = os.path.join(ROOT, h['machine']['path'])
        if not os.path.isfile(mp):
            raise Refused('the machine ' + h['machine']['path'] + ' is not on disk')
        with open(mp, 'rb') as f:
            mb = f.read()
        if sha(mb) != h['machine']['sha256']:
            raise Refused('the machine ' + h['machine']['path'] + ' does not hash to the header\'s sha256')
        rows = parse_machine(mb.decode('utf-8'))
        for c in cps:
            if not 0 <= c['state'] < len(rows):
                raise Refused('line ' + str(c['i'] + 1) + ': a state the machine does not have')
        out['chainHead'] = chain_check(lines, objs, h['id'])
        c0 = cps[0]
        if (c0['step'], c0['halted'], c0['state'], c0['head'], c0['ones']) != (0, False, 0, 0, []):
            raise Refuted({'why': 'the run does not start from the blank configuration at step 0', 'line': 1})
        if mode == 'full':
            sample = list(range(K))
            out['k'] = K
        else:
            if not (is_int(k) and 1 <= k <= K):
                raise Refused('k must be an integer in 1..' + str(K))
            sample = draw(seed, out['chainHead'], k, K)
            out['k'] = k
        out['sample'] = sample
        witness = None
        for j in sample:
            a, b = cps[j], cps[j + 1]
            halted, t, q, hd, ones = run(rows, a['state'], a['head'], a['ones'], a['step'], b['step'])
            got = summary(halted, t, q, hd, ones)
            want = summary(b['halted'], b['step'], b['state'], b['head'], b['ones'])
            same = got == want
            out['stretches'].append({'j': j, 'from': a['step'], 'to': b['step'], 'word': W['C'] if same else W['R']})
            if not same and witness is None:
                witness = {'why': 'the replayed stretch does not end at the next checkpoint', 'stretch': j, 'line': j + 2, 'claimed': want, 'replayed': got}
        if witness:
            raise Refuted(witness)
        cl = h['claim']
        box = 'steps 1..' + str(cl['halt'] if cl['shape'] == 'HIT' else cl['box'][1]) + ' of ' + h['machine']['path'] + '@' + h['machine']['sha256'][:12] + ' from the blank tape'
        if mode == 'full':
            out['word'] = W['C']
            if cl['shape'] == 'HIT':
                out['claimText'] = 'HIT witness=' + stable({'halt': cl['halt']}) + ' certificate=sha256:' + out['chainHead']
            else:
                cert = {'kind': 'full-replay', 'ledger': out['sha256'], 'chainHead': out['chainHead'], 'stretches': K,
                        'simulators': ['instruments/ledger/replay.py', 'instruments/ledger/replay.js']}
                out['claimText'] = 'RECORD box=[' + box + '] exhaustionCertificate=sha256:' + sha(stable(cert))
        else:
            out['word'] = W['F']
            out['rule'] = 'a sample is not a proof: ' + str(k) + ' of ' + str(K) + ' stretches replayed exactly, none differs'
            out['detects'] = detects(k, K)
            if cl['shape'] == 'RECORD':
                out['claimText'] = 'RECORD box=[' + box + '] ' + DOWNGRADE
    except Refused as e:
        out['word'], out['rule'] = W['F'], str(e)
    except Refuted as e:
        out['word'], out['witness'] = W['R'], e.witness
    return out


def decide_js(path, mode, seed=None, k=None):
    args = ['node', os.path.join(HERE, 'replay.js'), '--json', path] + (['--full'] if mode == 'full' else ['--seed', str(seed), '--k', str(k)])
    r = subprocess.run(args, capture_output=True, text=True, timeout=3600)
    try:
        return json.loads(r.stdout)
    except ValueError:
        return None


def joint(path, mode, seed=None, k=None):
    """the two simulators, each alone; the joint word is theirs only when the two decisions are identical"""
    py = decide(path, mode, seed, k)
    js = decide_js(path, mode, seed, k)
    if js is not None and stable(js) == stable(py):
        out = dict(py)
        out['simulators'] = 'agree'
        return out
    out = dict(py)
    out.update({'word': W['F'], 'rule': 'the two simulators disagree (replay.py and replay.js); no decision', 'witness': None, 'claimText': None,
                'simulators': 'disagree', 'js': js})
    return out


# ---- the honest runner (fixtures and the battery) ------------------------------------------------------------------------------
def write_ledger(machine_rel, ident, claim, stride, rows=None):
    """the ledger an honest runner writes: checkpoints every `stride` steps and at the end. rows: the machine actually run
    (default the named one; the battery passes a mutant to plant a runner that ran something else)"""
    with open(os.path.join(ROOT, machine_rel), 'rb') as f:
        mb = f.read()
    named = parse_machine(mb.decode('utf-8'))
    rows = rows or named
    end = claim['halt'] if claim['shape'] == 'HIT' else claim['box'][1]
    recs = [{'kind': 'ledger', 'format': 1, 'id': ident, 'machine': {'path': machine_rel, 'sha256': sha(mb)}, 'claim': claim}]
    state, head, ones, t, i = 0, 0, set(), 0, 0
    recs.append({'kind': 'checkpoint', 'i': 0, 'step': 0, 'halted': False, 'state': 0, 'head': 0, 'ones': []})
    while t < end:
        nxt = min(t + stride, end)
        halted, t2, state, head, ones = run(rows, state, head, ones, t, nxt)
        i += 1
        recs.append({'kind': 'checkpoint', 'i': i, 'step': t2, 'halted': halted, 'state': state, 'head': head, 'ones': sorted(ones)})
        t = t2
        if halted:
            break
    return chain_lines(recs, ident)


def chain_lines(recs, ident):
    """the funnel's chainLine over records without their chain"""
    prev = sha('GENESIS:' + ident)
    out = []
    for r in recs:
        body = {k: v for k, v in r.items() if k != 'chain'}
        content = compact(body)
        prev = sha(prev + '\n' + content)
        out.append(content[:-1] + ',"chain":"' + prev + '"}')
    return '\n'.join(out) + '\n'


def main(argv):
    def opt(name):
        return argv[argv.index(name) + 1] if name in argv and argv.index(name) + 1 < len(argv) else None
    if '--write' in argv:
        m, ident, stride = opt('--write'), opt('--id'), int(opt('--stride'))
        claim = {'shape': 'HIT', 'halt': int(opt('--hit'))} if '--hit' in argv else {'shape': 'RECORD', 'box': [1, int(opt('--box'))]}
        sys.stdout.write(write_ledger(m, ident, claim, stride))
        return 0
    seed, k = opt('--seed'), opt('--k')
    k = int(k) if k is not None else None
    if '--record' in argv:
        out = opt('--record')
        skip = {out, seed, str(k)}
        paths = [a for a in argv if a.endswith('.jsonl') and a not in skip]
        rows = []
        for p in paths:
            for mode in ('full', 'sample'):
                d = joint(p, mode, seed, k)
                rows.append(d)
                print(d['word'].ljust(10) + mode.ljust(7) + d['ledger'] + ('  ' + d['rule'] if d['rule'] else '') + ('  witness stretch ' + str(d['witness'].get('stretch', d['witness'].get('line'))) if d['witness'] else ''))
        rec = {'what': 'Search ledgers replayed exactly by instruments/ledger: each ledger decided twice — every stretch replayed (full) and a seeded sample of k stretches — each time by replay.py and replay.js alone, the joint word recorded only when the two decisions are identical. The battery re-derives every row.',
               'seed': seed, 'k': k, 'rows': rows}
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(rec, f, indent=1, ensure_ascii=False)
            f.write('\n')
        print(os.path.relpath(out, ROOT) + ' written: ' + str(len(rows)) + ' decisions')
        return 0
    paths = [a for a in argv if a.endswith('.jsonl')]
    if len(paths) != 1 or not ('--full' in argv or (seed is not None and k is not None)):
        print(__doc__)
        return 2
    mode = 'full' if '--full' in argv else 'sample'
    if '--alone' in argv:
        print(json.dumps(decide(paths[0], mode, seed, k), ensure_ascii=False))
        return 0
    d = joint(paths[0], mode, seed, k)
    print(d['word'] + '  ' + d['ledger'] + '  ' + mode + (' k=' + str(d['k']) + ' of K=' + str(d['K']) if d['k'] else '') + '  simulators ' + d['simulators'])
    if d['rule']:
        print('  rule: ' + d['rule'])
    if d['witness']:
        print('  witness: ' + json.dumps(d['witness'], ensure_ascii=False))
    if d['detects']:
        print('  a sample of this size catches: one wrong stretch with probability ' + d['detects']['oneStretch'] + '; a runner wrong on 1/10 of its stretches with probability >= ' + d['detects']['f=1/10'])
    if d['claimText']:
        print('  ' + d['claimText'])
    return 0 if d['word'] == W['C'] else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
