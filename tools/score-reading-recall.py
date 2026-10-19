#!/usr/bin/env python3
"""score-reading-recall.py — how often the statement readings of the openai/math audit catch a defect, measured by planting
known ones (the referee's S5, 2026-10-19).

THE DESIGN (corpus/openai-math/recall-2026-10-19/, key/selection.md in prose). From the families the audit read as MATCHES
with one challenge of at most 70 lines, no definition holes and not support (30 at the pin), 24 were drawn with a seed
and 12 of those drawn again to carry a plant: one line of the challenge statement changed so that it states less than
the headline (NARROWER — UNDECLARED) or something else (DIFFERENT), with the scope note silent on it; the other 12 are the
release's bytes. The 24 went into packets P01..P24 in a seeded order (headline, scope note, challenge), with the brief
of the pre-registered lane S. Fresh readers (AI agents, as the audit's were) read every packet under the brief, told to
open nothing outside the packets; every tool call they made is kept (calls/, by tools/recall-calls.py) and audited here. As in the audit, every family a
first reader did not read as MATCHES or NARROWER — DECLARED was read again by a second reader who saw the first reading's
evidence and decided independently, and where the two disagree the less severe word is recorded.

WHAT IS COUNTED, per pipeline (a first reader and its second reader) and per first reader alone:
  flagged       a planted packet whose word is not MATCHES (the defect was seen as a defect);
  at the plant  flagged, and the reading's evidence cites the planted line (challenge.lean:L or a range holding L), or
                its gap quotes a token the plant introduced — read mechanically, listed per packet;
  exact word    the key's word (for the one plant whose declared-ness is arguable, NARROWER — DECLARED is counted as
                flagged, not as exact);
  false alarms  a control whose word is not MATCHES — listed with the reading's gap, because a control so read is a
                disagreement with the audit's own first reading, which may be the audit's error rather than the reader's.
Recall is flagged/12 with an exact Clopper–Pearson 95% interval (binomial tails in exact rationals, bisected to 1e-9,
rounded outward to three decimals). Twelve plants measure a rate coarsely; the interval says how coarsely.

usage: python3 tools/score-reading-recall.py            -> certs/reading-recall.json
       python3 tools/score-reading-recall.py --check    re-derive and compare; every packet file against the key
MIT"""
import hashlib
import json
import os
import re
import sys
import time
from fractions import Fraction as Fr

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
DIR = os.path.join(ROOT, 'corpus', 'openai-math', 'recall-2026-10-19')
OUT = os.path.join(ROOT, 'certs', 'reading-recall.json')
CHECK = '--check' in sys.argv
SEV = {'MATCHES': 0, 'NARROWER — DECLARED': 1, 'NARROWER — UNLINKED': 2, 'NARROWER — UNDECLARED': 3, 'DIFFERENT': 4}


def die(m):
    sys.stderr.write('READING RECALL REFUSED: ' + m + '\n')
    sys.exit(1)


def J(*p):
    with open(os.path.join(DIR, *p), encoding='utf-8') as f:
        return json.load(f)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def norm(w):
    w = (w or '').replace('--', '—').replace('–', '—').strip().upper()
    w = re.sub(r'\s*—\s*', ' — ', w)
    if w.startswith('SUPPORT'):
        return 'SUPPORT'
    if w not in SEV:
        die('a reading has the word %r, which is not one of the brief\'s' % w)
    return w


KEY = J('key', 'key.json')
P = KEY['packets']
if sorted(P) != ['P%02d' % i for i in range(1, 25)]:
    die('the key does not hold P01..P24')
for pid, k in P.items():
    for f, h in k['files'].items():
        if sha(os.path.join(DIR, 'packets', pid, f)) != h:
            die('%s/%s is not the bytes the readers read' % (pid, f))
if sum(1 for k in P.values() if k['mutated']) != 12:
    die('the key does not hold 12 plants')


def by_packet(reading):
    out = {}
    for r in reading['families']:
        pid = r['packet']
        if pid in out:
            die('%s read twice in one reading' % pid)
        out[pid] = r
    return out


def text_of(r):
    parts = [r.get('gap') or '', r.get('suspicious') or ''] + list(r.get('evidence') or []) + list(r.get('flags') or [])
    for c in r.get('clauses') or []:
        parts += [str(c.get('note') or ''), str(c.get('coveredBy') or '')]
    return '\n'.join(parts)


def cites_line(r, L):
    for m in re.finditer(r'challenge\.lean:(\d+)(?:\s*[-–]\s*(\d+))?', text_of(r)):
        a = int(m.group(1)); b = int(m.group(2) or a)
        if a <= L <= b:
            return True
    return False


def plant_tokens(k):
    """the tokens the plant introduced: in the mutated line and not in the original one"""
    tok = lambda s: set(re.findall(r'[A-Za-z_][A-Za-z_.0-9]*|\d+|[≤≥<>=|]+', s))
    return sorted(tok(k['mutatedLine']) - tok(k['originalLine']))


def at_plant(r, k):
    if cites_line(r, k['line']):
        return True
    g = (r.get('gap') or '') + '\n' + '\n'.join(r.get('evidence') or [])
    return any(t in g for t in plant_tokens(k) if len(t) > 1 or t in '≤≥')


def less_severe(a, b):
    if a == 'SUPPORT' or b == 'SUPPORT':
        return a if a == b else min(a, b, key=lambda w: SEV.get(w, -1))
    return a if SEV[a] <= SEV[b] else b


def clopper_pearson(x, n):
    def cdf(k, p):     # P[X <= k], X ~ Bin(n, p), exact
        from math import comb
        return sum(comb(n, i) * p ** i * (1 - p) ** (n - i) for i in range(k + 1))
    def bisect(f, lo, hi):
        lo, hi = Fr(lo), Fr(hi)
        while hi - lo > Fr(1, 10 ** 9):
            mid = (lo + hi) / 2
            mid = Fr(round(mid * 2 ** 40), 2 ** 40)
            if f(mid):
                hi = mid
            else:
                lo = mid
        return lo, hi
    a = Fr(1, 40)    # 2.5% each tail
    lower = Fr(0) if x == 0 else bisect(lambda p: 1 - cdf(x - 1, p) >= a, 0, 1)[0]
    upper = Fr(1) if x == n else bisect(lambda p: cdf(x, p) <= a, 0, 1)[1]
    from math import floor, ceil
    return [floor(lower * 1000) / 1000, ceil(upper * 1000) / 1000]


def score(first, second):
    F = by_packet(first)
    S = by_packet(second) if second else {}
    if sorted(F) != sorted(P):
        die('reader %s did not read all 24 packets' % first.get('reader'))
    rows = []
    for pid in sorted(P):
        k = P[pid]
        w1 = norm(F[pid]['word'])
        needs2 = w1 not in ('MATCHES', 'NARROWER — DECLARED', 'SUPPORT')
        if needs2 and second is not None and pid not in S:
            die('%s needed a second reading under the protocol and has none' % pid)
        if not needs2 and pid in S:
            die('%s was read a second time though the protocol did not ask for it' % pid)
        w2 = norm(S[pid]['word']) if pid in S else None
        final = less_severe(w1, w2) if w2 else w1
        row = dict(packet=pid, family=k['family'], mutated=k['mutated'], first=w1, second=w2, recorded=final)
        if k['mutated']:
            row.update(kind=k['kind'], difficulty=k['difficulty'], expected=k['expectedWord'],
                       firstFlagged=w1 != 'MATCHES', firstAtPlant=w1 != 'MATCHES' and at_plant(F[pid], k),
                       flagged=final != 'MATCHES', atPlant=final != 'MATCHES' and at_plant(S.get(pid, F[pid]), k),
                       exact=final == k['expectedWord'])
        else:
            row.update(falseAlarm=final != 'MATCHES', gap=(S.get(pid) or F[pid]).get('gap') if final != 'MATCHES' else None)
        rows.append(row)
    M = [r for r in rows if r['mutated']]; C = [r for r in rows if not r['mutated']]
    cnt = lambda key, rs: sum(1 for r in rs if r[key])
    out = dict(reader=first['reader'], rows=rows,
               firstReader=dict(flagged=cnt('firstFlagged', M), atPlant=cnt('firstAtPlant', M),
                                falseAlarms=sum(1 for r in C if r['first'] != 'MATCHES'), recall95=clopper_pearson(cnt('firstFlagged', M), len(M))),
               pipeline=dict(flagged=cnt('flagged', M), atPlant=cnt('atPlant', M), exact=cnt('exact', M), falseAlarms=cnt('falseAlarm', C),
                             recall95=clopper_pearson(cnt('flagged', M), len(M)),
                             falseAlarm95=clopper_pearson(cnt('falseAlarm', C), len(C)),
                             missed=[r['packet'] + ' (' + r['family'] + ', ' + r['kind'] + ', ' + r['difficulty'] + ')' for r in M if not r['flagged']]),
               byKind={kd: '%d/%d' % (sum(1 for r in M if r['kind'] == kd and r['flagged']), sum(1 for r in M if r['kind'] == kd)) for kd in sorted({r['kind'] for r in M})},
               byDifficulty={d: '%d/%d' % (sum(1 for r in M if r['difficulty'] == d and r['flagged']), sum(1 for r in M if r['difficulty'] == d)) for d in ('easy', 'subtle')})
    return out


T0 = time.time()
R = J('readings.json')       # {"pipelines": [{"first": "first-A.json", "second": "second-A.json"}, ...]}
pipes = []
for p in R['pipelines']:
    first = J('readings', p['first'])
    second = J('readings', p['second']) if p.get('second') else {'reader': None, 'families': []}
    pipes.append(score(first, second))
SCR = R['scratch']        # the directory the readers worked in, as their tool calls name it


def strings(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for v in x.values():
            yield from strings(v)
    elif isinstance(x, list):
        for v in x:
            yield from strings(v)


def audit(label):
    """every absolute path a reader's calls name lies under the packets, its output directory or a second-reading
    directory; no call climbs with '..' or names the home directory"""
    C = J('calls', label + '.json')
    return dict(reader=label, calls=len(C['calls']), tools=sorted({c['tool'] for c in C['calls']}), outside=outside_of(C['calls']))


def outside_of(calls):
    allowed = [SCR + '/packets', SCR + '/out', SCR + '/second-']
    outside = []
    for c in calls:
        for t in strings(c['input']):
            # an absolute path is one that names a top-level directory of the machine (HTML closing tags, "a/2" and
            # relative globs are not paths); every one must lie under the allowed directories
            for m in re.finditer(r'(?<![\w.)\]}/<])(/(?:Users|private|tmp|var|etc|opt|usr|System|Library|Volumes|home|bin|sbin|dev|Applications)(?:/[^\s\'"`;|&<>()]*)?)', t):
                q = m.group(1).rstrip(',:')
                if not any(q.startswith(a) for a in allowed):
                    outside.append(q)
            for w in ('Projects/', 'openai-math', '.claude/', 'recall/key', 'calls/'):
                if w in t:
                    outside.append('names %r in: %s' % (w, t[:120]))
            if re.search(r'(^|[\s/\'"=])\.\.(/|\s|$)', t) or '~/' in t or '$HOME' in t:
                outside.append('a relative climb or the home directory in: ' + t[:120])
    return sorted(set(outside))


AUD = [audit(os.path.splitext(f)[0]) for f in sorted(os.listdir(os.path.join(DIR, 'calls')))]
if any(a['outside'] for a in AUD):
    die('a reader named a path outside its packets: ' + json.dumps([a for a in AUD if a['outside']], ensure_ascii=False))
union = sum(1 for pid, k in P.items() if k['mutated'] and any(next(r for r in q['rows'] if r['packet'] == pid)['flagged'] for q in pipes))
rec = dict(what='How often the openai/math statement readings catch a defect: 12 planted defects and 12 unaltered controls, read blind by fresh AI readers under the pre-registered brief of lane S, with the protocol\'s second reading; written by tools/score-reading-recall.py from corpus/openai-math/recall-2026-10-19.',
           release=KEY['release'], seed=KEY['seed'], eligible=len(KEY['eligible']), packets=24, plants=12, controls=12,
           kinds=KEY['kinds'], pipelines=pipes, flaggedByEither=union, audit=AUD,
           limits=['the eligible statements are the audit\'s easiest class: one challenge of at most 70 lines, no definition hole, read MATCHES; the audit\'s long statements (eight over 1,000 lines) and its multi-challenge families are not measured',
                   'the brief added one sentence the audit\'s did not have (check every constant, exponent, bound, domain and hypothesis against the headline), and the readers were asked to be careful: they read alert, and were not told that defects were planted',
                   'the plants are one-line edits made by an AI agent, and two left a clue the edit did not touch (156: the name HasTenSmallCover over Fin 9; 328: a docstring that still says nonexpansive)',
                   'the builder, the four readers and the audit\'s own readers are AI agents of one model family, so their misses may be correlated; a specialist reader would measure something else',
                   'the abstracts the audit\'s readers read are not in the packets',
                   'twelve plants measure a rate coarsely: 12 of 12 bounds the recall below by 0.735 at 95%, no more'],
           decider=sha(os.path.abspath(__file__)))
if CHECK:
    # red controls: the audit must catch a reader that opens the release, climbs out of its packets or reads the key,
    # and the score must fall when a plant is read as MATCHES
    reds = [('the release clone opened', [{'tool': 'Bash', 'input': {'command': 'cat /Users/carlostoledo/Projects/openai-math/lean/ComparatorChallenges/Catalan.lean'}}]),
            ('a climb out of the packets', [{'tool': 'Bash', 'input': {'command': 'cd .. && ls'}}]),
            ('the key read by its absolute path', [{'tool': 'Read', 'input': {'file_path': SCR + '/key/key.json'}}]),
            ('the recorded words read', [{'tool': 'Bash', 'input': {'command': 'grep MATCHES ~/Projects/cert-machine/certs/openai-math-statements.json'}}])]
    for name, calls in reds:
        if not outside_of(calls):
            die('red control did not fire: ' + name)
    first = J('readings', R['pipelines'][0]['first']); first['families'] = [dict(f, word='MATCHES') if f['packet'] == 'P18' else f for f in first['families']]
    if score(first, {'reader': None, 'families': [f for f in J('readings', R['pipelines'][0]['second'])['families'] if f['packet'] != 'P18']})['pipeline']['flagged'] != 11:
        die('red control did not fire: a plant read as MATCHES still counted')
    was = json.load(open(OUT, encoding='utf-8'))
    was.pop('generated', None)
    if was != json.loads(json.dumps(rec)):
        die('the record does not re-derive from the readings and the key')
    print('reading-recall: re-derived, %d red controls fired — %s (%.1fs)' % (len(reds) + 1, '; '.join('%s: %d/12 flagged, %d false alarms' % (q['reader'], q['pipeline']['flagged'], q['pipeline']['falseAlarms']) for q in pipes), time.time() - T0))
else:
    rec['generated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(rec, f, indent=1, ensure_ascii=False)
        f.write('\n')
    for q in pipes:
        print('reader %s: first alone %d/12 flagged (%d at the plant), %d false alarms; pipeline %d/12 flagged, %d at the plant, %d exact, %d false alarms; recall 95%% %s; missed %s'
              % (q['reader'], q['firstReader']['flagged'], q['firstReader']['atPlant'], q['firstReader']['falseAlarms'], q['pipeline']['flagged'],
                 q['pipeline']['atPlant'], q['pipeline']['exact'], q['pipeline']['falseAlarms'], q['pipeline']['recall95'], q['pipeline']['missed']))
    print('flagged by either pipeline: %d/12' % union)
