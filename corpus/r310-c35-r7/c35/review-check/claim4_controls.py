"""Claim 4, controls: the full family (Lemma P itself) and C35 - 0 (positive control), plus the record's C3 triple."""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lpcheck_lib import *
t = time.time()
print('independent 8-sets:', len(ALL8))
r = run([(0, ALL8)])[0]
print('full family (Lemma P):', r, f'{time.time()-t:.1f}s')
fam0 = [E for E in ALL8 if not E & 1]
r0 = run([(1, fam0)])[0]
print('C35 - 0: family size', len(fam0), 'result', r0[0], 'nodes', r0[-1])
if r0[0] == 'FEAS':
    A, B, C = r0[1:4]
    print('  triple A', verts(A), 'B', verts(B), 'C', verts(C), '; verified on C35-0:', check_triple(A, B, C, fam0, 1),
          '; on full C35:', check_triple(A, B, C, ALL8))
rec = json.load(open(os.path.join(HERE, '..', '..', 'cert-machine-r1', 'd2', 'c3-config.json')))
print('record c3-config.json keys:', list(rec)[:8])
A, B, C = mask(rec['A']), mask(rec['B']), mask(rec['C'])
print('record C3 triple A', rec['A'], 'B', rec['B'], 'C', rec['C'])
print('  passes on C35 - 0:', check_triple(A, B, C, fam0, 1), '; on full C35:', check_triple(A, B, C, ALL8),
      '; 8-sets of C35 missed by AuB:', [verts(E) for E in ALL8 if not E & (A | B)][:3])
