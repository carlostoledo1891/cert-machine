#!/usr/bin/env python3
"""Control room's own reading of the R(7) production ledger (PRIVATE).

usage: python3 -I tally_prod.py PROD.tsv XCHECK_1000.txt OWN_TSV [OWN_TSV ...]

It does not use prod.py. It checks, row by row, what PROD-PREREG.md says a certified record is, that the 977,008
configuration indices are each present exactly once, and that the control room's own decider agrees with the ledger
on the 1,000 registered cross-check configurations.
"""
import collections, hashlib, json, random, re, sys

N = 977008
prod, xfile, own_files = sys.argv[1], sys.argv[2], sys.argv[3:]
HEX = re.compile(r'^[0-9a-f]{64}$')
head = None
seen = bytearray(N)
dup = bad = 0
bad_examples = []
levels = collections.Counter()
trails = collections.Counter()
outcomes = collections.Counter()
cpu = collections.Counter()
ledger_x = {}
xs = [int(l) for l in open(xfile).read().split()]
xset = set(xs)
h = hashlib.sha256()
with open(prod, 'rb') as f:
    for raw in f:
        h.update(raw)
        r = raw.decode().rstrip('\n').split('\t')
        if head is None:
            head = r
            continue
        d = dict(zip(head, r))
        i = int(d['idx'])
        if not (0 <= i < N):
            bad += 1; bad_examples.append(('index out of range', i)); continue
        if seen[i]:
            dup += 1
        seen[i] = 1
        outcomes[d['outcome']] += 1
        levels[d['level']] += 1
        trails[d['trail']] += 1
        ok = (len(r) == len(head) and d['K'] == '9' and d['outcome'] == 'CERTIFIED-UNSAT' and d['level'] in ('3', '4', '7')
              and d['trail'].split(',')[-1] == d['level'] + ':UNSAT'
              and all(t.endswith(':SAT') for t in d['trail'].split(',')[:-1])
              and HEX.match(d['cnf_sha256']) and HEX.match(d['proof_sha256'])
              and d['lrat_check_line'] == 'c VERIFIED' and d['cake_lpr_line'] == 's VERIFIED UNSAT' and d['graph'] == '-')
        if not ok:
            bad += 1
            if len(bad_examples) < 5: bad_examples.append(r[:9])
        for k in ('cpu_gen', 'cpu_solve', 'cpu_lrat', 'cpu_cake'):
            cpu[k] += float(d[k])
        if i in xset:
            ledger_x[i] = (d['outcome'], d['level'])
missing = N - sum(seen)

# the registered sample, regenerated
reg = sorted(random.Random(20261122).sample(range(N), 1000))
own = {}
for p in own_files:
    for line in open(p):
        t = line.rstrip('\n').split('\t')
        if len(t) < 3 or not t[0].isdigit(): continue
        kv = dict(x.split('=', 1) for x in t[3:] if '=' in x)
        own[int(t[0])] = (t[1], kv.get('verdict'), kv.get('lratcheck'))
agree = sum(1 for i in xs if own.get(i, (None,) * 3)[1:] == ('UNSAT', 'VERIFIED') and own[i][0] == '9'
            and ledger_x.get(i, (None, None))[0] == 'CERTIFIED-UNSAT')
out = {
    'ledger_sha256': h.hexdigest(), 'header': head, 'rows': sum(outcomes.values()), 'distinct_indices': sum(seen),
    'missing': missing, 'duplicates': dup, 'rows_failing_a_rule': bad, 'failing_examples': bad_examples,
    'outcomes': dict(outcomes), 'by_level': dict(levels), 'trails': dict(trails),
    'cpu_seconds': {k: round(v) for k, v in cpu.items()}, 'cpu_seconds_total': round(sum(cpu.values())),
    'xcheck': {'file_equals_registered_sample': xs == reg, 'configurations': len(xs), 'own_decided': len([i for i in xs if i in own]),
               'in_ledger': len(ledger_x), 'agree_unsat_and_verified': agree,
               'ledger_levels_on_sample': dict(collections.Counter(v[1] for v in ledger_x.values()))},
}
out['ALL_CERTIFIED'] = (out['rows'] == N and out['distinct_indices'] == N and missing == 0 and dup == 0 and bad == 0
                        and outcomes == {'CERTIFIED-UNSAT': N})
out['XCHECK_AGREES'] = (xs == reg and agree == 1000 and len(ledger_x) == 1000)
print(json.dumps(out, indent=1))
