"""Claim 4, second decider: CNF of "a forbidden triple exists for family F" written from Lemma P's statement.
Vars a_v = v+1, b_v = 36+v, c_v = 71+v. Clauses: at most one of a_v,b_v,c_v; each class independent (both ends of a core
edge never in the same class); A u B meets each E in F; B u C meets each E in F; forbidden vertices in no class.
usage: claim4_cnf.py write NAME  |  claim4_cnf.py model NAME SOLVER_OUTPUT"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lpcheck_lib import *
R = json.load(open(os.path.join(HERE, 'claim4-orbits-result.json')))
def fam_of(name):
    if name == 'p385': return 0, [m for i in R['exact385_infeasible'][0] for m in ORB[i]]
    if name == 'full': return 0, ALL8
    if name == 'c35m0': return 1, [E for E in ALL8 if not E & 1]
    if name == 'p385minus22':  # drop one set of orbit 22 (lpfam said FEAS)
        U = R['exact385_infeasible'][0]; return 0, [m for i in U for m in ORB[i] if m != ORB[22][0]]
    if name == 'p385minus8':   # drop one set of orbit 8 (lpfam said INFEAS)
        U = R['exact385_infeasible'][0]; return 0, [m for i in U for m in ORB[i] if m != ORB[8][0]]
    raise SystemExit('unknown family')
a = lambda v: v + 1; b = lambda v: 36 + v; c = lambda v: 71 + v
def write(name):
    forb, F = fam_of(name); cls = []
    for v in range(N):
        cls += [[-a(v), -b(v)], [-a(v), -c(v)], [-b(v), -c(v)]]
        if forb >> v & 1: cls += [[-a(v)], [-b(v)], [-c(v)]]
        for u in range(v + 1, N):
            if NB[v] >> u & 1:
                cls += [[-a(u), -a(v)], [-b(u), -b(v)], [-c(u), -c(v)]]
    for E in F:
        vs = verts(E)
        cls.append([a(v) for v in vs] + [b(v) for v in vs])
        cls.append([b(v) for v in vs] + [c(v) for v in vs])
    with open(os.path.join(HERE, 'cnf', name + '.cnf'), 'w') as f:
        f.write(f'c lemma-P family {name}, {len(F)} sets\np cnf 105 {len(cls)}\n')
        for cl in cls: f.write(' '.join(map(str, cl)) + ' 0\n')
    print(name, 'sets', len(F), 'clauses', len(cls))
def model(name, path):
    forb, F = fam_of(name); true = set()
    for l in open(path):
        if l.startswith('v '): true |= {int(t) for t in l.split()[1:] if int(t) > 0}
    A = mask([v for v in range(N) if a(v) in true]); B = mask([v for v in range(N) if b(v) in true])
    C = mask([v for v in range(N) if c(v) in true])
    print(name, 'model triple verified from the definitions:', check_triple(A, B, C, F, forb))
if sys.argv[1] == 'write': write(sys.argv[2])
else: model(sys.argv[2], sys.argv[3])
