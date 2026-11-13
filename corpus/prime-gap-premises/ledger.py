#!/usr/bin/env python3
"""ledger.py — Phase 2, step 1: the premise ledger of three conditional prime-gap proofs (PREREGISTRATION.md, sealed
6f1e6d11…). One JSON line per premise in ledger.jsonl. Statuses are read from evidence files and refused when the
evidence does not say what the status needs: the 186 record (cert-machine certs/prime-gaps-186.json), this phase's two
deciders (out/), and claimbox's blind readings (readings/summary.json, copied in from claimbox's local branch)."""
import json, hashlib, os, sys
H = os.path.dirname(os.path.abspath(__file__))
CM = os.path.dirname(os.path.dirname(H))
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
die = lambda m: sys.exit('LEDGER REFUSED: ' + m)

R186 = json.load(open(os.path.join(CM, 'certs/prime-gaps-186.json')))
V = R186['verdicts']
if V['axiom1'] != 'CERTIFIED on the instances' or V['axiom2'] != 'CERTIFIED on the instances' or V['certificate'] != 'REPRODUCED':
    die('the 186 record no longer says what the ledger enters')
ev186 = {'path': 'certs/prime-gaps-186.json', 'sha256': sha(os.path.join(CM, 'certs/prime-gaps-186.json'))}

def summary(path):
    for line in open(os.path.join(H, path)):
        d = json.loads(line)
        if 'summary' in d:
            return d['summary']
    die(path + ' has no summary line (the run is not finished)')
A, B = summary('out/decider-a.jsonl'), summary('out/decider-b.jsonl')
cmp_ = json.load(open(os.path.join(H, 'out/compare.json')))
kl4_ok = (A['primes'] == B['primes'] == 303 and A['instances'] == B['instances'] and A['holds'] == A['instances'] == B['holds']
          and A['fails'] == B['fails'] == 0 and cmp_['disjoint'] == 0 and cmp_['brute_outside'] == 0
          and A['fails3'] > 0 and B['fails3'] > 0 and A['fails2'] > 0 and B['fails2'] > 0)
kl4_status = 'DECIDED ON INSTANCES below 2000' if kl4_ok else 'NOT DECIDED'
evKl4 = [{'path': 'notes/lean-intake-phase2-2026-11-12/out/' + f, 'sha256': sha(os.path.join(H, 'out', f))}
         for f in ('decider-a.jsonl', 'decider-b.jsonl', 'compare.json')]

READ = {}
rp = os.path.join(H, 'readings', 'summary.json')
if os.path.exists(rp):
    for r in json.load(open(rp))['premises']:
        READ[r['name']] = r

P182 = ('romyar1/prime-gaps-lean', 'b77bf175', 'no licence: quoted, never copied')
P186 = ('openai/PrimeGaps186', '61340d0b', 'Apache-2.0')
P212 = ('AxiomMath/BGP212', '6641780b', 'Apache-2.0')
rows = []
def row(id_, proof, src, file, name, shape, statement, status, evidence, note=''):
    rows.append({'id': id_, 'proof': proof, 'repository': src[0], 'commit': src[1], 'licence': src[2], 'file': file, 'lean': name,
                 'shape': shape, 'statement': statement[:300], 'status': status, 'evidence': evidence, 'note': note})

K3 = '∀ p [Fact p.Prime] (c : ZMod p), c ≠ 0 → ‖normalizedKloosterman3 p c‖ ≤ 3'
K2 = '∀ p [Fact p.Prime] (A B : ZMod p), A ≠ 0 → B ≠ 0 → ‖∑ t ≠ 0, −1, K2(A/t) K2(B/(t+1))‖ ≤ 8 p √p'
row('186-1', '186', P186, 'PrimeGaps186.lean', 'PrimeGap186.kloosterman3_bound', 'finite-field bound', K3,
    'DECIDED ON INSTANCES below 2000', [ev186], 'two deciders, the 186 audit (2026-11-10/11)')
row('186-2', '186', P186, 'PrimeGaps186.lean', 'PrimeGap186.kloosterman2_correlation_bound', 'finite-field bound', K2,
    'DECIDED ON INSTANCES below 2000', [ev186], 'two deciders, the 186 audit')
row('186-3', '186', P186, 'PrimeGaps186.lean', 'PrimeGap186.physical_integral_bounds', 'real-inequality bundle',
    '104 outer + 45 inner + 3 cap bounds, rationals / 10^18', 'REPRODUCED', [ev186],
    'the certificate replayed and its 152 numbers recomputed with no shared code; the step from the enclosures to the integrals is on paper')
note182 = ('the 182 vendors PrimeGaps186.lean byte for byte (sha256 fd7d9296…, the same at openai/PrimeGaps186 61340d0b); '
           'PublicPrimeLocalBounds182 (formal/PrimeSourcePublic182.lean, under `open PrimeGap186 PrimeGap182`) states the 186 two as a '
           'conjunction — that its names resolve to the vendored 186 definitions is a READING (no #print run)')
row('182-1', '182', P182, 'formal/PrimeSourcePublic182.lean', 'PublicPrimeLocalBounds182 (first conjunct)', 'finite-field bound', K3,
    'DECIDED ON INSTANCES below 2000', [ev186], note182)
row('182-2', '182', P182, 'formal/PrimeSourcePublic182.lean', 'PublicPrimeLocalBounds182 (second conjunct)', 'finite-field bound', K2,
    'DECIDED ON INSTANCES below 2000', [ev186], note182)
row('182-3', '182', P182, 'formal/IncidenceRankFour.lean', 'AllIncidenceRankFourBounds / IncidenceRankFourBound', 'finite-field bound',
    '∀ c : ZMod p, c ≠ 0 → ‖∑ u v w : (ZMod p)ˣ, stdAddChar (u + v + w + c / (u v w))‖ ≤ 4 p √p', kl4_status, evKl4,
    'NEW in this phase: %d instances, largest |K4|/(p√p) = %.4f at (p, c) = %s' % (A['instances'], A['max_ratio'], tuple(A['at'])))
# step 5 (amendment A1): the claimant's numerical package replayed on our stack — read from the imported run, refused otherwise
S5 = os.path.join(H, 'step5', 'import2')
v5 = json.load(open(os.path.join(S5, 'evidence', 'verification.json')))
c5 = json.load(open(os.path.join(S5, 'runs', 'compare182.json')))
red5 = [open(os.path.join(S5, 'runs', n + '.exit')).read().strip() for n in ('compare', 'red-tighten', 'red-drop')]
s5_ok = (v5['status'] == 'PASS_COMPLETE_EXTERNAL_NUMERICAL_RECOMPUTATION' and v5['target_inequalities'] == 262 and v5['all_262_recomputed'] is True
         and v5['historical_production_outputs_read'] is False and v5['mathematical_payloads_match_reference'] is True
         and c5['verdict'] == 'PASS' and c5['passed'] == 262 and c5['lean_bounds'] == 262 and c5['fresh_rows'] == 262 and not c5['failures']
         and red5 == ['0', '1', '1']
         and open(os.path.join(S5, 'runs', 'compare182.sha256')).read()[:64] == open(os.path.join(S5, 'runs', 'compare182.at-run.sha256')).read()[:64])
ev5 = [{'path': 'notes/lean-intake-phase2-2026-11-12/step5/import2/' + f, 'sha256': sha(os.path.join(S5, f))}
       for f in ('evidence/verification.json', 'evidence/coverage.json', 'runs/compare182.json')]
row('182-4', '182', P182, 'formal/PrimeGaps182Analytic.lean', 'PhysicalSourceBounds182', 'real-inequality bundle',
    'cap (5) + outerRoot, outerFace (∀ j : Fin 60) + innerMass (∀ j : Fin 137): 262 inequalities between integrals and rationals',
    'REPRODUCED' if s5_ok else 'NOT DECIDED', ev5 if s5_ok else [],
    ('the claimant\'s numerical package REPLAYED on our stack (Linux, FLINT v3.6.0 + 7ad753d5 built from source, no package byte changed; six '
     'environment-side deviations, step5/DEVIATIONS.md): its acceptance PASS on 14 stages, and OUR comparison of the %d fresh values with the Lean '
     'literals at b77bf175: %d of %d, all %d equal to the literal and to the published value, both red controls fired. A replay of the claimant\'s '
     'programs, not an independent decision; that each integral is on the right side of its bound is argued in the package\'s comments, in no '
     'program and not in Lean. A clean-room recomputation is not started') % (c5['fresh_rows'], c5['passed'], c5['lean_bounds'], c5['equal_to_lean_literal'])
    if s5_ok else 'the replay of step 5 does not say what REPRODUCED needs: see step5/import2')
row('182-5', '182', P182, 'formal/PrimeGaps182Analytic.lean', 'LocalFourierHypothesis C D p₀', 'free constants',
    '∀ p, p₀ < p → ∀ α m m′ n n′ : ZMod p, … Finite/CurveExceptionalFourierBound p C D …',
    'NOT DECIDED', [], 'no finite test can refute it: a larger p₀ or C escapes any instance')
for name, cited in (('TypeIIPolymath', '[2] Lemma 3, [1] Thm 2.8(iv)'), ('TypeIbPolymath', '[2] Lemma 4, [1] 2.8(ii)'),
                    ('TypeIBakerIrving', '[2] Lemma 5'), ('TypeIStadlmann', '[2] Lemma 6'), ('TypeIIIPolymath', '[2] Lemma 7, [1] 2.8(v)'),
                    ('Gap212HarmanReduction', '[2] Prop. 2, Def. 9'), ('BilinearBombieriVinogradov', '[1] Thm 2.9')):
    r = READ.get(name)
    status = ('READ: ' + r['reading']) if r else 'NOT DECIDED'
    row('212-' + name, '212', P212, 'Gap212Challenge/Basic.lean', name, 'quoted asymptotic theorem', 'cited: ' + cited, status,
        [{'path': 'notes/lean-intake-phase2-2026-11-12/readings/summary.json', 'sha256': sha(rp)},
         {'path': 'claimbox@' + open(os.path.join(H, 'readings', 'CLAIMBOX-COMMIT')).read().strip()[:8] + ':readings/bgp212-2026-11-12/' + name + '.reading.md'}] if r else [],
        ('; '.join(k + ': ' + v['reading'] + ' — ' + v['clause'] + ' (' + v['stronger_or_weaker'] + ')'
                   for k, v in (r.get('per_source') or {', '.join(r['cited']) if isinstance(r['cited'], list) else r['cited']: r}).items())
         + ' [claimbox phase2-readings-2026-11-12, a reading, not a decision]') if r else 'step 3 (the blind reading) not yet returned')
row('212-Gap212Certificate', '212', P212, 'Gap212Challenge/Basic.lean', 'Gap212Certificate', 'real-inequality bundle',
    'Certificate gap212Params 44 0 0: ∃ F, symmetric, L², 0 < I(F) < k·J(F)', 'NOT DECIDED', [],
    'existential: needs a witness F. SCOUTED 2026-11-12 (amendment A1, step 6): no witness is published — not in '
    'AxiomMath/BGP212 at 6641780b (its README and Gap212/Sieve/Certificate.lean say the certificate is assumed), not in '
    'PrimeGapsLib at the pinned 1faa7b14, whose PrimeGapsCert/ holds the witnesses for 246 (k = 50) and 600 (k = 105) only; '
    'the datum (k = 45, ten cap rungs) is not Stadlmann\'s (k = 49). A question to the authors is drafted, not sent')
if len(rows) != 16:
    die('the ledger has %d rows, not 16' % len(rows))
with open(os.path.join(H, 'ledger.jsonl'), 'w') as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + '\n')
c = {}
for r in rows:
    c[r['status']] = c.get(r['status'], 0) + 1
print(json.dumps({'premises': len(rows), 'by_status': c}, ensure_ascii=False))
