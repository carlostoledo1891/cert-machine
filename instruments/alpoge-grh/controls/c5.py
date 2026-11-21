import json, sys
names, false_name, false_expr, rh_name, done = {}, None, None, None, False
for line in sys.stdin:
    if not done:
        o = json.loads(line)
        if 'in' in o and 'str' in o and o['str']['pre'] == 0:
            if o['str']['str'] == 'False': false_name = o['in']
            if o['str']['str'] == 'riemannHypothesis': rh_name = o['in']
        elif 'ie' in o and 'const' in o and false_name is not None and o['const']['name'] == false_name and o['const']['us'] == []:
            false_expr = o['ie']
        elif 'thm' in o and rh_name is not None and o['thm']['name'] == rh_name:
            if false_expr is None: sys.stderr.write('C5: no expression for False before riemannHypothesis\n'); sys.exit(3)
            o['thm']['type'] = false_expr; line = json.dumps(o, separators=(',', ':')) + '\n'; done = True
            sys.stderr.write('C5: riemannHypothesis re-typed as False (expr %d)\n' % false_expr)
    sys.stdout.write(line)
if not done: sys.stderr.write('C5: riemannHypothesis not found\n'); sys.exit(4)
