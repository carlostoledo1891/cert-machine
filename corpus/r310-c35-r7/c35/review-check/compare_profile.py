"""Compare the candidate's per-vertex (deg, valid, maxvalid) multiset with claude-r1/out/control_out.txt,
which Claude's control.py computed from Exoo's pinned matrix (sha256 45581492...a3fe) in Exoo's labelling."""
import sys
from collections import Counter
cand = [l.split() for l in open(sys.argv[1]) if l.startswith('V ')]
cand = {int(t[1]): (int(t[3]), int(t[5]), int(t[7])) for t in cand}
ref = {}
for l in open(sys.argv[2]):
    t = l.split()
    if len(t) == 8 and t[0].isdigit():
        ref[int(t[0])] = (int(t[1]), int(t[3]), int(t[4]))   # deg, validS, maximalValidS
print('candidate vertices', len(cand), 'reference rows', len(ref))
print('degree multiset candidate', sorted(Counter(v[0] for v in cand.values()).items()),
      'reference', sorted(Counter(v[0] for v in ref.values()).items()))
same = Counter(cand.values()) == Counter(ref.values())
print('(deg, valid, maxvalid) multisets equal:', same)
cls = Counter(ref.values())
for x in (22, 35, 37, 38):
    p = ref[x]
    print(f'Exoo row {x}: profile {p}; rows of Exoo with this profile: {cls[p]};',
          'candidate vertices with it:', [v for v, q in cand.items() if q == p])
