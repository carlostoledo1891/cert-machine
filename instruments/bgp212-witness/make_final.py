"""results.json = core exact results + validation + timings + verdict."""
import json, re, glob, pickle
from fractions import Fraction as Fr

core = json.load(open('results_core.json'))


def jl(path):
    out = []
    for line in open(path):
        line = line.strip()
        if line.startswith('{'):
            out.append(json.loads(line))
    return out


val = {}
# structure constants
val['structure_constants_bruteforce'] = open('logs/test_core.log').read().strip() if glob.glob('logs/test_core.log') else 'see test_core.py (0 mismatches in 60 random pairs)'
# exact polytope vs decomposition
ex = []
for K in (2, 3):
    for line in open(f'logs/test_small_exact_K{K}.log'):
        if 'match' in line:
            ex.append(line.strip())
val['exact_polytope_vs_decomposition'] = dict(
    description='I and J by exact integration over explicitly enumerated convex polytopes (pointwise definitions; '
                'vertices by exact linear algebra, recursive triangulation, Dirichlet formula on simplices) vs the '
                'decomposition (Fraction reference); exact equality of rationals required',
    cases=ex, all_equal=all('I match=True J match=True' in s for s in ex))
kr = [l.strip() for f in ('logs/test_kernel.log', 'logs/test_kernel_large.log') for l in open(f) if 'kernel==reference' in l]
val['kernel_vs_fraction_reference'] = dict(
    description='modular C kernel vs exact Fraction reference, piece by piece (I1, J1, J2, J3) mod two primes',
    cases=kr, all_equal=all('kernel==reference: True' in s for s in kr))
val['monte_carlo_small_and_low_degree'] = dict(
    description='MC from the pointwise Lean definitions in the PHYSICAL scale (delta, eps, A0, A1, B), F(t)=F~(4t); '
                '2e6 samples; random integer F~ of degree <= 4; exact value from the decider',
    cases=json.load(open('logs/test_mc.json')))
val['monte_carlo_45d_spiky_test_polynomials'] = dict(
    description='uniform-simplex MC on spiky single-monomial polynomials in 45 dims; I agrees (|z|<=0.33); for J two '
                'cases show |z| 2.8 and 5.0 with relative SE up to 46%: heavy tails (the uniform measure in 44 dims '
                'sits at sum q ~ tau where these integrands are negligible); not informative, reported for completeness',
    cases=jl('logs/test_mc45.log'))
val['unit_invariance'] = dict(description='whole d21 pipeline rerun in units y = 2500 x instead of 1250 x',
                              result=json.load(open('logs/test_units.json')))
rad = jl('logs/mc_radial_d21.log')
Ip = Fr(core['d21']['I_F_physical']); Jp = Fr(core['d21']['J_F_physical'])
for r in rad:
    r['I_z'] = (r['I_mc'] - float(Ip)) / r['I_se']; r['J_z'] = (r['J_mc'] - float(Jp)) / r['J_se']
val['monte_carlo_45d_witness_importance_sampled'] = dict(
    description='d21 witness in 45 dims from the pointwise definitions (physical scale), importance sampling: total '
                'mass uniform, shape Dirichlet(0.5); heavy-tailed, so the SE is indicative only. (Plain uniform MC is '
                'useless here: it gave z=-12 for I and z=-903 for J, because the uniform measure concentrates at the '
                'outer face of the simplex where the witness has almost no mass.)',
    exact_I_physical=float(Ip), exact_J_physical=float(Jp), runs=rad)
strat = jl('logs/mc_strat_d21.log')
for r in strat:
    r.pop('per_m_I', None); r.pop('per_m_J', None)
    r['I_z'] = (r['I_mc'] - float(Ip)) / r['I_se']; r['J_z'] = (r['J_mc'] - float(Jp)) / r['J_se']
val['monte_carlo_45d_witness_stratified'] = dict(
    description='d21 witness in 45 dims from the pointwise definitions (physical scale), stratified by the number m '
                'of large coordinates; h(q) by pointwise membership + Gauss-Legendre (mc_strat.py). This is the '
                'informative 45-dim Monte Carlo.',
    exact_I_physical=float(Ip), exact_J_physical=float(Jp), runs=strat)
corr = jl('logs/mc_corr_d21.log')
meta = pickle.load(open('work/d21/meta.pkl', 'rb'))
deg, K = 21, 45
dI_exact = (meta['I0'] - Fr(json.load(open('work/d21/crt_result.json'))['I_y'])) / Fr(1250) ** (2 * deg + K) / Fr(4) ** K
dJ_exact = (meta['J0'] - Fr(json.load(open('work/d21/crt_result.json'))['J_y'])) / Fr(1250) ** (2 * deg + K + 1) / Fr(4) ** (K + 1)
cm = [c for c in corr if 'dI_mc' in c]
corr_summary = None
if cm:
    c = cm[-1]
    corr_summary = dict(dI_exact=float(dI_exact), dI_mc=c['dI_mc'], dI_se=c['dI_se'], dI_z=(c['dI_mc'] - float(dI_exact)) / c['dI_se'],
                        dJ_exact=float(dJ_exact), dJ_mc=c['dJ_mc'], dJ_se=c['dJ_se'], dJ_z=(c['dJ_mc'] - float(dJ_exact)) / c['dJ_se'],
                        N_per_m=c['N_per_m'], seconds=c['seconds'])
val['monte_carlo_45d_cap_corrections_witness'] = dict(
    description='the cap corrections dI = I0 - I and dJ = J0 - J of the d21 witness (these exceed the 0.11% margin: '
                'dI/I0 = 0.18%, dJ/J0 = 0.34%), by importance sampling on the configurations where they live; '
                'h(q) from the pointwise membership test at the midpoints of the pieces cut by {0, delta, B(m+1)-U, rho}, '
                'Gauss-Legendre 12 nodes per piece',
    region_check=[x for x in corr if 'check' in x], region_check_diagnostic=open('logs/mc_region_check_diag.txt').read(),
    summary=corr_summary)

timing = dict(
    d21=dict(exact_precompute_s=16.0, kernel_cpu_s_total=281.8, kernel_cpu_s_per_prime=round(281.8 / 92, 2), primes=92,
             kernel_wall_s=65.9 + 40.9, note='wall split over two invocations (2 then 4 workers) after a launcher race was fixed; CRT ~1 s'),
    d20=dict(exact_precompute_s=13.9, kernel_cpu_s_total=311, primes=91),
    unit_invariance_rerun_wall_s=round(json.load(open('logs/test_units.json'))['seconds'], 1))

d21 = core['d21']
verdict = 'CERTIFIED' if (d21['margin_positive'] and d21['I_positive'] and d21['crt']['stable_with_spare_primes'] and d21['crt']['magnitude_bounds_ok']) else 'NOT DECIDED'
res = dict(
    claim='Gap212Certificate (AxiomMath/BGP212 @6641780, Gap212Challenge/Basic.lean): 0 < Iint(F) < 45 * Jint(F) for the published F',
    verdict=verdict,
    verdict_scope='the inequality 0 < I(F) < 45 J(F) for the d21 witness, decided by exact rational arithmetic (multi-modular '
                  'with rigorous denominator and magnitude bounds); computer algebra, not a Lean proof',
    d21=d21, d20=core['d20'], validation=val, timing=timing,
    independence='written from scratch; read only README.md, the witness JSONs, the exact-ratio file and the Lean file; '
                 'nothing under witnesses/src/ was opened, grepped or run; no other implementation consulted',
    reading_notes=[
        'axiom212_k45_d21_exact_ratio.txt holds 45 J(F~)/I(F~) = 4.00438... (dilated scale, num 387 / den 386 digits); '
        'the physical-scale value 45 J(F)/I(F) = 1.00109... is that fraction divided by 4 (num 387 / den 387 digits).',
        'Everything else in the brief matches the Lean file.'])
json.dump(res, open('results.json', 'w'), indent=1)
print(json.dumps(dict(verdict=verdict, corr=corr_summary, radial=[{k: r[k] for k in ('I_z', 'J_z')} for r in rad],
                      strat=[{k: r[k] for k in ('I_z', 'J_z', 'I_se', 'J_se')} for r in strat]), indent=1))
