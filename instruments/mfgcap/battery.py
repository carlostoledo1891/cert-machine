#!/usr/bin/env python3
"""mfgcap battery — the terra re-certification instrument, green + red.

The instrument's anti-divergence contract (verify_ext.py imports the FROZEN
published verifier and reimplements only the instance-bound parts) is enforced
here as a BIT-FOR-BIT calibration: on the frozen file's own embedded N=14
instance, validate_g must reproduce validate() to the last float, and
buildPhi_ext with A2 = A3 = 0 must equal the frozen buildPhi as exact interval
tuples.  The only NEW lines (the A2/A3 data terms) get their own red controls:
zeroed and wrong-mode mutations must each explode the residual.  A verifier
that cannot refuse is a fake certificate.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import verify_ext as X  # noqa: E402

vc = X.vc
checks = []
reds = []
ok = lambda c, m: checks.append((bool(c), m))
red = lambda c, m: reds.append((bool(c), m))

# ---------------------------------------------------------------- calibration ----
# 1. bit-for-bit: validate_g == frozen validate on the embedded N=14 instance
P14 = {'sigma': vc.SIGMA, 'A': vc.A_PARAM, 'gamma': vc.GAMMA, 'N': vc.N}
rf = vc.validate(vc.CAND_A, vc.CAND_M, vc.CAND_W, vc.AMAT, {'nu': 1.05})
rg = X.validate_g(vc.CAND_A, vc.CAND_M, vc.CAND_W, vc.AMAT, vc.AMAT_ODD, P14, {'nu': 1.05})
for k in ('Y0', 'Z1', 'Z1even', 'Z1odd', 'Z2', 'r', 'disc', 'minW', 'worstCol'):
    ok(rf.get(k) == rg.get(k), 'validate_g bit-equals frozen validate: %s' % k)

# 2. buildPhi_ext with no A2/A3 == frozen buildPhi, exact interval tuples
s14 = X.make_seqs_g(X.ODD, vc.CAND_A, vc.CAND_M, vc.CAND_W, vc.N)
s14f = vc.make_seqs(vc.ODD, vc.CAND_A, vc.CAND_M, vc.CAND_W)
ok(all(s14[k] == s14f[k] for k in s14), 'make_seqs_g bit-equals frozen make_seqs')
p_ext = X.buildPhi_ext(s14, P14, 3 * vc.N)
p_frz = vc.buildPhi(s14f, P14, 3 * vc.N)
ok(all(p_ext[t] == p_frz[t] for t in ('H', 'F', 'R')),
   'buildPhi_ext(A2=A3=0) bit-equals frozen buildPhi')

# 3. the stdlib Gauss-Jordan approximate inverse certifies the embedded instance
AN14, ANO14 = X.build_inverses(s14, P14, vc.N)
rgj = X.validate_g(vc.CAND_A, vc.CAND_M, vc.CAND_W, AN14, ANO14, P14, {'nu': 1.05})
ok(rgj['ok'] and rgj['r'] == rf['r'],
   'Gauss-Jordan A certifies the embedded instance at the same radius')

# ---------------------------------------------------------------- the records ----
# 4. record walk: both terra re-certifications exist, VERIFIED, honest
for tag, peaks in (('t1', 2), ('t6', 3)):
    p = os.path.join(ROOT, 'certs', 'terra-recert-%s.json' % tag)
    ok(os.path.exists(p), 'certs/terra-recert-%s.json exists' % tag)
    if not os.path.exists(p):
        continue
    c = json.load(open(p))
    ok(c['verdict'] == 'VERIFIED', '%s verdict is VERIFIED' % tag)
    ok(c['bounds']['Z1'] < 1, '%s Z1 < 1' % tag)
    ok(0 < c['bounds']['r'] < 1e-12, '%s certified radius < 1e-12' % tag)
    ok(c['positivity']['minM'] > 0, '%s density positive over the ball' % tag)
    ok(c['bounds']['minW'] > 0, '%s branch selector positive over the ball' % tag)
    ok(all(c['falsifiers'].values()) and len(c['falsifiers']) == 9,
       '%s all nine falsifiers fired red' % tag)
    ok(c['terraCrossCheck']['agree'], '%s cross-implementation agreement with the terra record' % tag)
    ok('invent' not in c['statement'], '%s statement carries no "invents structure" overclaim' % tag)
    ok('RE-WEIGHTS' in c['statement'] if tag == 't1' else True,
       '%s statement states the honest re-weighting mechanism' % tag)
    ok(c['instance']['exactBinary64Hex']['A2' if tag == 't1' else 'A3'] ==
       float(c['instance']['A2' if tag == 't1' else 'A3']).hex(),
       '%s exact-binary64 coefficient statement is self-consistent' % tag)

# 5. T1 Y0 at N=96 with the A2 term reproduces the recorded residual scale
rec = json.load(open(os.path.join(HERE, 'records', 'terra-t1-enclosure.json')))
inst = rec['instance']
N96 = inst['N']
P96 = {'sigma': inst['sigma'], 'gamma': inst['gamma'], 'N': N96,
       'A1': inst['A1'], 'A2': inst['A2'], 'A3': 0.0}
a96 = rec['uCoef'][:N96 + 1]
m96 = rec['mCoef'][:N96 + 1]
w96 = X.reciprocalW_py(m96, N96)
s96 = X.make_seqs_g(X.ODD, a96, m96, w96, N96)
AN96, _ANO96 = X.build_inverses(s96, P96, N96)
y0_good = X._y0_from_seqs(s96, AN96, P96, inst['nu'])
ok(y0_good < 1e-13, 'T1 N=96 residual Y0 with the A2 term is candidate-small (%.2e)' % y0_good)
ok(abs(y0_good - rec['radii']['Y0']) / rec['radii']['Y0'] < 1e-3,
   'T1 Y0 agrees with the terra record to 0.1%')

# 6. sigma* — the exact-rational decisions re-run, and the cert walked
import sigmastar as S  # noqa: E402
sc = S.run()
ok(sc['verdict'] == 'VERIFIED', 'sigmastar: all rational identities decide VERIFIED')
ok(sc['P1_bandpass']['gammaFree'], 'sigmastar: band-pass derivative is gamma-free as a polynomial')
ok(all(r['gammaFree'] and r['rootIsOneOverK'] for r in sc['P2_crossover']),
   'sigmastar: crossover gamma-free with root 1/k for k = 2..12')
ok(sc['P3_windows'][0]['window'] == ['1/16', '1/4'] and
   sc['P3_windows'][1]['window'] == ['1/27', '1/3'],
   'sigmastar: splitting windows are the exact rationals (1/16,1/4) and (1/27,1/3)')
from fractions import Fraction as _F
_slo = _F(sc['sigmaStar']['bracketRational'][0])
_shi = _F(sc['sigmaStar']['bracketRational'][1])
ok(_F(12665147955292221, 10 ** 18) < _slo and _shi < _F(12665147955292223, 10 ** 18)
   and (_shi - _slo) < _F(1, 10 ** 25),
   'sigmastar: 1/(8 pi^2) bracket is tight and sits between the adjacent 18-digit decimals')
scp = os.path.join(ROOT, 'certs', 'terra-sigmastar.json')
ok(os.path.exists(scp) and json.load(open(scp))['verdict'] == 'VERIFIED',
   'certs/terra-sigmastar.json exists and is VERIFIED')
ok('invent' not in sc['statement'].replace('does not invent structure', ''),
   'sigmastar statement carries the honest framing, not the overclaim')

# 7. the bracket table — seven rows under one theorem, honest counting
btp = os.path.join(ROOT, 'certs', 'terra-bracket-table.json')
ok(os.path.exists(btp), 'certs/terra-bracket-table.json exists')
if os.path.exists(btp):
    bt = json.load(open(btp))
    ok(bt['verdict'] == 'VERIFIED', 'bracket table VERIFIED')
    want = {'T1': 2, 'T2': 1, 'T3': 1, 'T4': 2, 'T6': 3, 'T7': 1, 'T8': 2}
    if any(r['tag'] == 'T5' for r in bt['table']):
        want['T5'] = 2
    got = {r['tag']: r['peaks'] for r in bt['table']}
    ok(got == want, 'bracket table counts are exactly %s' % want)
    ok(all(r['wells'] == 1 for r in bt['table']), 'every bracket row has exactly one well')
    ok(bt['thresholdPin']['linearResponsePrediction']['insideCertifiedPin'],
       'exact-rational r_c prediction lands inside the certified [0.13, 0.14] pin')
    ok('eight' not in bt['statement'] and 'one phenomenon theorem' in bt['statement'],
       'bracket table statement counts honestly (2 theorems + a table)')

# ---------------------------------------------------------------- red controls ----
# R0a: a forged crossover polynomial (sign flipped on one term) must NOT be gamma-free
_one = S.pmono(1, 0, 0)
_s = S.pmono(1, 1, 0)
_g = S.pmono(1, 0, 1)
_k2 = 4
_onep = S.padd(_one, _s)
_onepk = S.padd(_one, S.pmul(S.pmono(_k2, 0, 0), _s))
_bad = S.padd(S.pmul(S.pmono(_k2, 0, 0), S.padd(S.pmul(_onep, _onep), _g)),
              S.pneg(S.padd(S.pmul(_onepk, _onepk), S.pneg(S.pmul(S.pmono(_k2, 0, 0), _g)))))
red(any(e[1] != 0 for e in _bad), 'sign-forged crossover polynomial is caught as gamma-DEPENDENT')

# R0b: a corrupted Machin bracket (15 arctan instead of 16) must miss pi
_a5lo, _a5hi = S.arctan_bounds(5, 30)
_a239lo, _a239hi = S.arctan_bounds(239, 30)
_bad_hi = 15 * _a5hi - 4 * _a239lo
red(_bad_hi < _F(31, 10), 'corrupted Machin coefficient produces a bracket that excludes pi')
# R1: the A2 data term ZEROED — the only new lines, attacked directly
P_no = dict(P96)
P_no['A2'] = 0.0
y0_no = X._y0_from_seqs(s96, AN96, P_no, inst['nu'])
red(y0_no > 1e6 * y0_good, 'zeroed A2 term explodes Y0 (%.2e -> %.2e)' % (y0_good, y0_no))

# R2: the data term at the WRONG mode (A2 moved to k=3)
P_wrong = dict(P96)
P_wrong['A2'], P_wrong['A3'] = 0.0, P96['A2']
y0_wr = X._y0_from_seqs(s96, AN96, P_wrong, inst['nu'])
red(y0_wr > 1e6 * y0_good, 'A2 applied at k=3 instead of k=2 explodes Y0')

# R3: half the amplitude (a magnitude forgery, not just an omission)
P_half = dict(P96)
P_half['A2'] = 0.5 * P96['A2']
y0_half = X._y0_from_seqs(s96, AN96, P_half, inst['nu'])
red(y0_half > 1e6 * y0_good, 'halved A2 explodes Y0')

# R4: a singular finite Jacobian must raise, not return garbage
try:
    X.gauss_inverse([[1.0, 2.0], [2.0, 4.0]])
    red(False, 'gauss_inverse refuses a singular matrix')
except ArithmeticError:
    red(True, 'gauss_inverse refuses a singular matrix')

# R5: parity forgery at N=14 (frozen falsifier X5 logic through the extended Phi)
pB = X.buildPhi_ext(X.make_seqs_g(X.EVEN, vc.CAND_A, vc.CAND_M, vc.CAND_W, vc.N), P14, 3 * vc.N)
nb = max(max(X.mag(v) for v in pB[t]) for t in ('H', 'F', 'R'))
ng = max(max(X.mag(v) for v in p_ext[t]) for t in ('H', 'F', 'R'))
red(nb > 1e10 * ng, 'parity forgery blows up the extended Phi')

# ---------------------------------------------------------------- report ----
failed = [(c, m) for c, m in checks if not c] + [(c, m) for c, m in reds if not c]
for c, m in checks:
    print(('  ok    ' if c else '  FAIL  ') + m)
for c, m in reds:
    print(('  RED ok  ' if c else '  RED FAIL  ') + m)
print('mfgcap battery: %d checks, %d red controls, %d failures'
      % (len(checks), len(reds), len(failed)))
sys.exit(1 if failed else 0)
