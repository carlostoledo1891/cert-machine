"""Side check: decode cert-machine-r1/cm4.kissat.out (control C1, cm_encode.py m=4 SAT model) to a 39-vertex graph,
check it, and compare its isomorphism class with the Exoo candidate. Variable order as in cm_encode.py."""
import sys, os, itertools, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from g6util import to_g6, circulant
m = 4
true = set()
for l in open(sys.argv[1]):
    if l.startswith('v '):
        true |= {int(t) for t in l.split()[1:] if int(t) > 0}
var = {}; k = 0
for i, j in itertools.combinations(range(m), 2): k += 1; var[('oo', i, j)] = k
for i in range(m):
    for u in range(35): k += 1; var[('oc', i, u)] = k
C = circulant(); n = 35 + m
A = [[False] * n for _ in range(n)]
for u in range(35):
    for v in range(35): A[u][v] = C[u][v]
for (t, a, b), x in var.items():
    if x in true:
        if t == 'oo': A[35 + a][35 + b] = A[35 + b][35 + a] = True
        else: A[35 + a][b] = A[b][35 + a] = True
g = to_g6(A)
nb = [sum(1 << j for j in range(n) if A[i][j]) for i in range(n)]
tri = sum(1 for a, b, c in itertools.combinations(range(n), 3) if A[a][b] and A[b][c] and A[a][c])
best = [0]
def rec(cand, sz):
    best[0] = max(best[0], sz)
    while cand:
        b = cand & -cand; v = b.bit_length() - 1; cand ^= b
        rec(cand & ~nb[v], sz + 1)
rec((1 << n) - 1, 0)
outE = [(a, b) for a, b in itertools.combinations(range(35, 39), 2) if A[a][b]]
p = subprocess.run(['/opt/homebrew/bin/labelg', '-q'], input=g + '\n' + open(sys.argv[2]).read().strip() + '\n',
                   capture_output=True, text=True, check=True).stdout.split()
print('C1 graph: n', n, 'edges', sum(map(sum, A)) // 2, 'triangles', tri, 'alpha', best[0], 'outside edges', outE,
      '; isomorphic to the Exoo candidate:', p[0] == p[1])
