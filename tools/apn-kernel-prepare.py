#!/usr/bin/env python3
"""tools/apn-kernel-prepare.py — writes one Comparator check of the AlphaProof Nexus audit into a checkout of the results
repository (run inside .github/workflows/apn-kernel.yml).

  Challenge.lean   OURS: formal-conjectures' statement file at the pinned commit (corpus/alphaproof-nexus/fc-pin/<n>.lean),
                   byte for byte except the theorem under test renamed to target_theorem_0, the name the agent's file uses
                   (for erdos_741.variants.upper, the corrected #741(i), nothing is renamed)
  Solution.lean    THEIRS: the results repository's file at its pin (or formal-conjectures' file at 9d492049 for the
                   corrected #741(i)), byte for byte; its digest must equal the pinned copy's
  lakefile.toml    two lean_lib targets appended, Challenge and Solution
  audit-config.json  theorem_names = [<namespace>.<name>], the three standard axioms, nanoda on

usage: apn-kernel-prepare.py <corpus/alphaproof-nexus> <item> <checkout>
MIT"""
import hashlib
import json
import os
import re
import sys

corpus, item, root = sys.argv[1:4]
pins = json.load(open(os.path.join(corpus, 'PINS.json')))
sha = lambda b: hashlib.sha256(b).hexdigest()
# RED CONTROLS, which Comparator must reject: erdos_846.red.statement (OUR challenge weakened, ε > 0 to ε ≥ 0, so the
# solution no longer proves the challenge's statement) and erdos_846.red.sorry (THEIR solution with the main theorem's
# proof replaced by sorry, so it rests on sorryAx, which is not permitted)
red = None
if '.red.' in item:
    item, red = item.split('.red.')
    if (item, red) not in (('erdos_846', 'statement'), ('erdos_846', 'sorry')):
        sys.exit('unknown red control')
n = re.match(r'erdos_([0-9]+)', item).group(1)
challenge_src = open(os.path.join(corpus, 'fc-pin', n + '.lean'), encoding='utf-8').read()
if item == 'erdos_741.variants.upper':
    rel = 'fc-9d492049/741.lean'
    solution = open(os.path.join(corpus, rel), 'rb').read()
    name = item
    challenge = challenge_src
else:
    rel = 'apn/ErdosProblems/%s.lean' % item
    solution = open(os.path.join(corpus, rel), 'rb').read()
    theirs = open(os.path.join(root, 'APNOutputs', 'ErdosProblems', item + '.lean'), 'rb').read()
    if sha(theirs) != sha(solution):
        sys.exit('the repository file at the pin is not the pinned copy: ' + item)
    occurrences = len(re.findall(r'\btheorem\s+' + re.escape(item) + r'(?=[\s:({\[])', challenge_src))
    if occurrences != 1:
        sys.exit('the formal-conjectures file declares %s %d times' % (item, occurrences))
    challenge = re.sub(r'\btheorem\s+' + re.escape(item) + r'(?=[\s:({\[])', 'theorem target_theorem_0', challenge_src)
    name = 'target_theorem_0'
if sha(solution) != pins['files'][rel]['sha256']:
    sys.exit('the solution bytes are not the pinned bytes: ' + rel)
if red == 'statement':
    assert challenge.count('(ε > 0), A.Infinite') == 1
    challenge = challenge.replace('(ε > 0), A.Infinite', '(ε ≥ 0), A.Infinite')
if red == 'sorry':
    text = solution.decode('utf-8')
    head, tail = text.rsplit('theorem target_theorem_0', 1)
    i = tail.index(':= by') + len(':= by')
    solution = (head + 'theorem target_theorem_0' + tail[:i] + '\n  sorry\n').encode('utf-8')
# the namespace that encloses the theorem in the challenge; the solution must open the same one
upto = challenge[:challenge.index('theorem ' + name)]
ns = [m.group(1) for m in re.finditer(r'^namespace\s+(\S+)', upto, re.M)]
ends = [m.group(1) for m in re.finditer(r'^end\s+(\S+)', upto, re.M)]
open_ns = [x for x in ns if x not in ends]
if len(open_ns) != 1:
    sys.exit('cannot tell the enclosing namespace: %s' % open_ns)
full = open_ns[0] + '.' + name
if not re.search(r'^namespace\s+' + re.escape(open_ns[0]) + r'\s*$', solution.decode('utf-8'), re.M):
    print('NOTE: the solution does not open namespace %s; Comparator will look for %s and may not find it' % (open_ns[0], full))
open(os.path.join(root, 'Challenge.lean'), 'w', encoding='utf-8').write(challenge)
open(os.path.join(root, 'Solution.lean'), 'wb').write(solution)
with open(os.path.join(root, 'lakefile.toml'), 'a') as f:
    f.write('\n[[lean_lib]]\nname = "Challenge"\n\n[[lean_lib]]\nname = "Solution"\n')
json.dump({'challenge_module': 'Challenge', 'solution_module': 'Solution', 'theorem_names': [full],
           'permitted_axioms': ['propext', 'Quot.sound', 'Classical.choice'], 'enable_nanoda': True},
          open(os.path.join(root, 'audit-config.json'), 'w'), indent=1)
print('prepared %s: theorem %s; challenge = fc-pin/%s.lean%s; solution = %s (sha256 %s…)'
      % (item, full, n, '' if name == item else ' with the theorem renamed', rel, sha(solution)[:12]))
