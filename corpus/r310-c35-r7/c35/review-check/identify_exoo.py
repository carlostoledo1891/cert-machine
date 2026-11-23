"""Claim 2, identification: Exoo's matrix (sha256 45581492...a3fe) is not stored at home. Claude's control.py, run on
those bytes, wrote claude-r1/out/swap1_classes.g6 (241 canonical classes, "Exoo itself among them: True") and
claude-r1/out/control_out.txt (Exoo's per-row degree, valid re-attachments, maximal ones). Which of the 241 classes
match (a) the degree multiset and (b) the whole per-vertex (deg, valid, maxvalid) multiset of control_out?
Also reports which match Chen's published fingerprint (e 167, |Aut| 1, 4,511 independent 9-sets; known39.md)."""
import sys, os, subprocess
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
sw, co = sys.argv[1], sys.argv[2]
ref = {}
for l in open(co):
    t = l.split()
    if len(t) == 8 and t[0].isdigit(): ref[int(t[0])] = (int(t[1]), int(t[3]), int(t[4]))
refdeg = Counter(v[0] for v in ref.values()); refprof = Counter(ref.values())
lines = [l.strip() for l in open(sw) if l.strip()]
p = subprocess.run([os.path.join(HERE, 'profile'), '-v'], input='\n'.join(lines) + '\n', capture_output=True, text=True, check=True)
blocks = []; cur = None
for l in p.stdout.splitlines():
    t = l.split()
    if t[0] == 'G': cur = {'e': int(t[5]), 'nine': int(t[-1]), 'tri': int(t[7]), 'alpha': int(t[9]), 'V': []}; blocks.append(cur)
    else: cur['V'].append((int(t[3]), int(t[5]), int(t[7])))
assert len(blocks) == len(lines) == 241
degm = [i for i, b in enumerate(blocks) if Counter(v[0] for v in b['V']) == refdeg]
profm = [i for i, b in enumerate(blocks) if Counter(b['V']) == refprof]
chen = [i for i, b in enumerate(blocks) if b['e'] == 167 and b['nine'] == 4511]
print('classes', len(blocks), '; all triangle-free with alpha 9:', all(b['tri'] == 0 and b['alpha'] == 9 for b in blocks))
print('reference degree multiset', sorted(refdeg.items()), 'edges', sum(d * c for d, c in refdeg.items()) // 2)
print('classes with that degree multiset:', len(degm))
print('classes with the whole (deg, valid, maxvalid) multiset of control_out:', len(profm), [i + 1 for i in profm])
print("classes with Chen's e 167 and 4,511 nine-sets:", [i + 1 for i in chen])
