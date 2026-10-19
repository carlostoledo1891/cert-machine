# Seeded draw for the lane-S recall experiment. Deterministic: python3 -I draw.py
import json, random, sys
CM = '/Users/carlostoledo/Projects/cert-machine'
SEED = 20261019
s = json.load(open(CM + '/certs/openai-math-statements.json'))
r = json.load(open(CM + '/corpus/openai-math/release.json'))
ch = {c['name']: c for c in r['challenges']}
eligible = []
for row in s['rows']:
    if row['word'] != 'MATCHES' or len(row['challenges']) != 1:
        continue
    c = ch[row['challenges'][0]]
    if c['statementLines'] <= 70 and not c['definitionNames'] and not c['holeBodies'] \
            and not c['support'] and not c['supportByName']:
        eligible.append((row['family'], c['name'], c['statementLines']))
eligible.sort()
rng = random.Random(SEED)
fams = [e[0] for e in eligible]
chosen = sorted(rng.sample(fams, 24))
mutated = sorted(rng.sample(chosen, 12))
order = list(chosen)
rng.shuffle(order)
out = {
    'seed': SEED, 'python': sys.version.split()[0],
    'eligible': [{'family': f, 'challenge': n, 'statementLines': l} for f, n, l in eligible],
    'chosen': chosen, 'mutated': mutated,
    'packetOrder': {'P%02d' % (i + 1): f for i, f in enumerate(order)},
}
print(json.dumps(out, indent=1))
