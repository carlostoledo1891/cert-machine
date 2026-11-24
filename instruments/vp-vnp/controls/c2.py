# Control C2 (cert-machine, VP ≠ VNP lane, corpus/vp-vnp/PREREG.md): the release's export with the theorem
# Solution.mainTheorem re-typed as False (its proof unchanged). nanoda and con-leche must REJECT the result.
# usage: python3 -I c2.py < export.ndjson > export-c2.ndjson                                                    MIT
import json, sys
sol, main, false_name, false_expr, done = None, None, None, None, False
for line in sys.stdin:
    if not done:
        o = json.loads(line)
        if 'in' in o and 'str' in o:
            s = o['str']
            if s['pre'] == 0 and s['str'] == 'False': false_name = o['in']
            if s['pre'] == 0 and s['str'] == 'Solution': sol = o['in']
            if sol is not None and s['pre'] == sol and s['str'] == 'mainTheorem': main = o['in']
        elif 'ie' in o and 'const' in o and false_name is not None and o['const']['name'] == false_name and o['const']['us'] == []:
            false_expr = o['ie']
        elif 'thm' in o and main is not None and o['thm']['name'] == main:
            if false_expr is None: sys.stderr.write('C2: no expression for False before Solution.mainTheorem\n'); sys.exit(3)
            o['thm']['type'] = false_expr; line = json.dumps(o, separators=(',', ':')) + '\n'; done = True
            sys.stderr.write('C2: Solution.mainTheorem re-typed as False (expr %d)\n' % false_expr)
    sys.stdout.write(line)
if not done: sys.stderr.write('C2: Solution.mainTheorem not found\n'); sys.exit(4)
