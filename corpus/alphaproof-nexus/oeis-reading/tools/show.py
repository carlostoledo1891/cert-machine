import json, sys, os
D = sys.argv[1]
for a in sys.argv[2:]:
    j = json.load(open(os.path.join(D, a + '.json')))
    if isinstance(j, list): j = j[0]
    print('#' * 20, a, '|', j.get('name'))
    print('offset', j.get('offset'), '| keyword', j.get('keyword'), '| author', j.get('author'), '| created', j.get('created'), '| time', j.get('time'))
    print('data', j.get('data'))
    for fld in ['comment', 'formula', 'link', 'program', 'extensions']:
        v = j.get(fld) or []
        if fld == 'program':
            continue
        if fld == 'link':
            v = [x for x in v if any(w in x.lower() for w in ['proof', 'prove', 'alphaproof', 'deepmind', 'nexus', 'lean', 'ai '])]
        for line in v:
            print(f'  [{fld}]', line)
