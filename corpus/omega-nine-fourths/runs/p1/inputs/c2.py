# Control C2 (cert-machine, ω = 9/4 lane, corpus/omega-nine-fourths/PREREG.md): a lean4export NDJSON export with ONE
# theorem re-typed as False (its proof unchanged). nanoda and con-leche must REJECT the result.
# The VP ≠ VNP lane's c2.py (instruments/vp-vnp/controls/c2.py), with the theorem's dotted name as an argument.
# usage: python3 -I c2.py OAI.LinearAlgebra.SpectralBooks.square_exponent < export.ndjson > export-c2.ndjson     MIT
import json, sys
parts = sys.argv[1].split('.')
chain = [None] * len(parts)          # the name index of each prefix of the dotted name
false_name, false_expr, done = None, None, False
for line in sys.stdin:
    if not done:
        o = json.loads(line)
        if 'in' in o and 'str' in o:
            s = o['str']
            if s['pre'] == 0 and s['str'] == 'False': false_name = o['in']
            for k in range(len(parts)):
                pre = 0 if k == 0 else chain[k - 1]
                if chain[k] is None and pre is not None and s['pre'] == pre and s['str'] == parts[k]: chain[k] = o['in']
        elif 'ie' in o and 'const' in o and false_name is not None and o['const']['name'] == false_name and o['const']['us'] == []:
            false_expr = o['ie']
        elif 'thm' in o and chain[-1] is not None and o['thm']['name'] == chain[-1]:
            if false_expr is None: sys.stderr.write('C2: no expression for False before %s\n' % sys.argv[1]); sys.exit(3)
            o['thm']['type'] = false_expr; line = json.dumps(o, separators=(',', ':')) + '\n'; done = True
            sys.stderr.write('C2: %s re-typed as False (expr %d)\n' % (sys.argv[1], false_expr))
    sys.stdout.write(line)
if not done: sys.stderr.write('C2: %s not found\n' % sys.argv[1]); sys.exit(4)
