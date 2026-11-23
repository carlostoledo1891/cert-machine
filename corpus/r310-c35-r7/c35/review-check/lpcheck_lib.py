"""Shared helpers for claim 4: run lpfam, verify a returned triple from the definitions."""
import json, os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
O = json.load(open(os.path.join(HERE, 'orbits.json')))
N = O['n']; NB = O['nb']; ORB = O['orbits']; SIZES = O['sizes']
ALL8 = sorted(m for o in ORB for m in o)

def run(problems):
    """problems: list of (forbidden_mask, family). Returns list of ('FEAS', A, B, C, nodes) / ('INFEAS', nodes)."""
    inp = [str(N) + ' ' + ' '.join(map(str, NB))]
    for forb, fam in problems:
        inp.append(f'{forb} {len(fam)} ' + ' '.join(map(str, fam)))
    p = subprocess.run([os.path.join(HERE, 'lpfam')], input='\n'.join(inp) + '\n', capture_output=True, text=True, check=True)
    out = []
    for l in p.stdout.split('\n'):
        if not l: continue
        t = l.split()
        out.append((t[0],) + tuple(int(x) for x in t[1:]))
    assert len(out) == len(problems)
    return out

def independent(S):
    return all(not (NB[v] & S) for v in range(N) if S >> v & 1)

def check_triple(A, B, C, fam, forb=0):
    """True iff (A,B,C) is a forbidden triple for fam: available, independent, disjoint, AuB and BuC meet every member."""
    return (not ((A | B | C) & forb) and independent(A) and independent(B) and independent(C)
            and not (A & B) and not (A & C) and not (B & C)
            and all(E & (A | B) and E & (B | C) for E in fam))

def mask(vs):
    return sum(1 << v for v in vs)
def verts(m):
    return [v for v in range(N) if m >> v & 1]
