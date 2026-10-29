"""Turn a search result (runs/.../found.json) into a self-contained certificate JSON.
Usage: export_cert.py <found.json> <out.json>"""
import sys, json, itertools, re
sys.path.insert(0, __import__('os').path.dirname(__file__))
from cayley_sat8 import make_group
f = json.load(open(sys.argv[1]))
spec, k, S = f['group'], f['k'], f['S']
mul, _ = make_group(spec); n = len(mul)
# element labels
if spec.startswith('D') or spec.startswith('M'):
    if spec.startswith('D'): m, nn, r = int(spec[1:]), 2, int(spec[1:]) - 1
    else: m, nn, r = map(int, spec[1:].split('_'))
    labels = [[a, b] for b in range(nn) for a in range(m)]
    desc = f'Z_{m} x| Z_{nn}: (a,b)*(c,d) = (a + {r}^b c mod {m}, b+d mod {nn})'
else:
    mods = [int(x) for x in re.findall(r'Z(\d+)', spec)]
    labels = [list(g) for g in itertools.product(*[range(q) for q in mods])]
    desc = ' x '.join(f'Z_{q}' for q in mods) + ' (componentwise addition)'
blue = sorted({(min(x, int(mul[x][s])), max(x, int(mul[x][s]))) for x in range(n) for s in S})
cert = {'claim': f'R(3,{k}) >= {n+1}', 'k': k, 'n': n, 'group': spec, 'group_description': desc,
        'connection_set_indices': sorted(S), 'connection_set_labels': [labels[s] for s in sorted(S)],
        'element_labels': labels, 'blue_edges': [list(p) for p in blue],
        'group_table': [[int(x) for x in row] for row in mul],
        'note': 'Blue graph = Cayley graph Cay(G,S): x ~ x*s. Red = complement. Blue has no K_3, red has no K_k.'}
json.dump(cert, open(sys.argv[2], 'w'))
print(f'wrote {sys.argv[2]}: n={n}, |S|={len(S)}, blue edges={len(blue)}')
