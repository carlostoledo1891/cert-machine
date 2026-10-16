#!/usr/bin/env python3
"""run-optq-ledger.py — the record of the optimization-constants PR-queue audit, certs/optq-ledger.json, re-derived
from the pinned inputs every run: every pin re-hashed, the two step functions decided exactly (instruments/optq/
stepfun.py), the two-law entropy certificate decided (instruments/optq/twolaw.js), the two #226 constructions decided
exactly (exact226.py), the two #226 interval bounds enclosed (bgw16a.py, rbm70a.py — added 2026-10-16), the #217 row read
from certs/openai-math-kernel.json, the #210 package inventoried from its pinned files, and the verdict composed by the
grammar (CERTIFIED / REFUTED / REFUSED, with the scope beside it).

    python3 -I tools/run-optq-ledger.py          (~3 min: the two Kronecker products dominate; 16a adds ~7 s)
"""
import hashlib, json, os, re, subprocess, sys, time
from fractions import Fraction as F

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'optq'))
import stepfun, exact226, bgw16a, rbm70a

SRC = os.path.join(ROOT, 'corpus', 'optconst-queue', 'sources')
J = lambda rel: json.load(open(os.path.join(ROOT, rel)))
sha = lambda rel: hashlib.sha256(open(os.path.join(ROOT, rel), 'rb').read()).hexdigest()
die = lambda m: sys.exit('OPTQ LEDGER REFUSED: ' + m)

pins = J('corpus/optconst-queue/PINS.json')
for rel, h in pins['pins'].items():
    if sha('corpus/optconst-queue/sources/' + rel) != h: die(rel + ' moved from its pin')
t0 = time.time(); rows = []

# ---- #225: the two step functions ---------------------------------------------------------------------------------------
for kind, rel, claimed, const, desc in (('1a', 'atrislabs/1a-sidon-autocorrelation/construction.json', '1.5027435', 'C_1a', 'the autocorrelation constant (registry 1a: the largest C with max (f*f) >= C (∫_{-1/4}^{1/4} f)^2 for every f >= 0)'),
                                        ('1b', 'atrislabs/1b-erdos-minimum-overlap/construction.json', '0.38085856', 'C_1b', 'Erdős\'s minimum overlap constant (registry 1b: the largest C with sup_x ∫ f g(x + ·) >= C for f + g = 1 on an interval of length 2, ∫f = 1)')):
    vals = stepfun.read_values(J('corpus/optconst-queue/sources/' + rel))
    r = stepfun.decide(kind, vals, claimed)
    rows.append({'id': 'optq-225-' + kind, 'pr': 225, 'constant': const, 'claim': '%s <= %s (an upper bound exhibited by an explicit %s-step function with exact rational heights; Atris records @ 1fa857a0)' % (const, claimed, format(r['n'], ',')),
                 'definition': desc, 'verdict': r['verdict'], 'value': r['value'], 'valueDecimal': r['valueDecimal'], 'slack': r.get('slack'), 'n': r['n'], 'lag': r.get('argmaxLag', r.get('lagInBins')),
                 'how': 'the %s heights as integers over one denominator; the %s computed as ONE exact integer product by Kronecker substitution and the maximum taken over every grid shift (piecewise linearity puts the supremum on the grid); value %s, claimed %s' % (format(r['n'], ','), 'autoconvolution' if kind == '1a' else 'correlation with 1 - h', r['valueDecimal'], claimed),
                 'registryBefore': {'1a': '1.502862 (upper)', '1b': '0.380868 (upper)'}[kind], 'claimantPrinted': {'1a': '1.502743486709583379743219592079', '1b': '0.380858550316428560109786189091'}[kind]})
    if r['verdict'] != 'CERTIFIED': die('#225 ' + kind + ' did not certify')

# ---- #221: the two-law entropy certificate ------------------------------------------------------------------------------
out = subprocess.run(['node', os.path.join(ROOT, 'instruments', 'optq', 'twolaw.js'), os.path.join(SRC, 'zenodo-23289305', 'certificate.json'), '1.674894211307116'], capture_output=True, text=True)
try: tw = json.loads(out.stdout.strip().splitlines()[-1])
except Exception: die('twolaw.js gave no JSON: ' + out.stderr[-400:])
rows.append({'id': 'optq-221-3c', 'pr': 221, 'constant': 'C_3c', 'claim': 'C_3c >= 1.674894211307116 from two laws on 51 and 47 points of Z^2 (weights multiples of 10^-50) mixed in counts 39041372760532870645 : 60958627239467129355 of 10^20 base-55 digits (Jaswal, Zenodo 23289305)',
             'definition': 'the entropy formulation of registry 3c: C_3c >= H(X-Y) / max(H(X), H(Y), H(X+Y), H(X+2Y)) for any finitely supported law; for independent digits the entropies add when the digit map is injective, which max |L| = 27 <= (55-1)/2 guarantees',
             'verdict': tw['verdict'], 'rho': tw['rho'], 'precisionBits': tw['P'], 'maxAbsForm': tw['maxAbsForm'], 'injective': tw['injective'], 'laws': tw['laws'],
             'how': 'per-law pushforwards exact; entropies as directed-rounding intervals at %s bits (instruments/sumdiff + bigfloat, no code of the claimant\'s); the mixture by rational weights; ρ enclosed in [%s, %s] against 1.674894211307116' % (tw['P'], tw['rho'][0][0], tw['rho'][0][1]),
             'registryBefore': '1.6747338950414058* (upper 1.75)', 'claimantPrinted': '1.674894211307116228764343737060957...'})
if tw['verdict'] != 'CERTIFIED': die('#221 did not certify')

# ---- #226 -------------------------------------------------------------------------------------------------------------------
e = {'20a': exact226.decide_20a(), '20c': exact226.decide_20c()}
rows.append({'id': 'optq-226-20a', 'pr': 226, 'constant': 'C_20a', 'claim': 'C_20a >= 8: X = E - 1 (E standard exponential) is isotropic log-concave with Var(X^2) = 8, and products of independent copies give Var(|X|^2) = 8n (Patankar)',
             'definition': 'registry 20a: the smallest C with Var(|X|^2) <= C n for every isotropic log-concave X in every dimension', 'verdict': e['20a']['verdict'], 'values': e['20a'],
             'how': 'E[E^k] = k! exactly; E[(E-1)^4] = 9, E[(E-1)^2] = 1, mean 0: Var(X^2) = 8; independence adds variances. Log-concavity of e^{-t} on [0, ∞) is the definition (log-linear)', 'registryBefore': '2 (lower)'})
rows.append({'id': 'optq-226-20c', 'pr': 226, 'constant': 'C_20c', 'claim': 'C_20c >= sqrt(3): mu uniform on [-sqrt3, sqrt3] is isotropic log-concave and A = (-inf, 0] has mu(A) = 1/2, mu+(A) = 1/(2 sqrt3) (Patankar)',
             'definition': 'registry 20c: the KLS constant, sup over n of the worst inverse Cheeger constant mu+(A)/min(mu(A), 1 - mu(A)) over isotropic log-concave mu and Borel A', 'verdict': e['20c']['verdict'], 'values': e['20c'],
             'how': 'in Q(sqrt3) through squares: variance 3/3 = 1, (mu+(A)/min(mu(A), 1-mu(A)))^2 = 1/3, so the inverse Cheeger constant of this A is sqrt3 and psi >= sqrt3', 'registryBefore': 'sqrt(pi/2) ≈ 1.2533 (lower)'})
rows.append({'id': 'optq-226-23b', 'pr': 226, 'constant': 'C_23b', 'claim': 'C_23b <= 1/2: for odd n every off-diagonal entry of G = A^T A is odd, Σ(λ_k − n) = 0 and Σ(λ_k − n)^2 >= n(n−1); Bhatia--Davis gives (λ_max − n)(n − λ_min) >= n − 1, whence κ(A)^2 >= 1 + 2 sqrt(n−1)/n and κ(n) >= 1 + (2 − sqrt2)/sqrt n for odd n >= 3 (Patankar)',
             'definition': 'registry 23b: with κ(n) the least condition number of an n × n ±1 matrix and κ(n) = 1 + f(n)/n^α, the exponent constant', 'verdict': 'CERTIFIED',
             'scope': 'BY READING, not computed: each step is a standard inequality applied correctly — the parity of a sum of n terms ±1 for odd n; trace of G − nI zero since diagonal entries equal n; the Frobenius norm bound from n(n−1) odd entries of absolute value >= 1; Bhatia--Davis (the variance of numbers in [λ_min, λ_max] with mean n is at most (λ_max − n)(n − λ_min)); the last two lines are algebra. A reading, held as such',
             'how': 'the five sentences of the PR text read against the definition; no number is computed', 'registryBefore': '1 (upper)'})
# 16a and 70a: REFUSED as not attempted on 2026-10-15; decided 2026-10-16 after the claimant pointed to his derivations
# (pull/226#issuecomment-6207378455). His scripts are pinned as text (sources/vidigoat-39fb848/) and do not run here.
src226 = {'derivations': 'vidigoat/optimization-records @ 39fb848 tao/PROOFS.md, pinned at corpus/optconst-queue/sources/vidigoat-39fb848/ with the two scripts as .py.txt (never run)',
          'pointer': 'teorth/optimizationproblems pull/226#issuecomment-6207378455 (2026-10-16T03:25:05Z)'}
b = bgw16a.decide(4000, F(41, 5), '2.156224')
rows.append({'id': 'optq-226-16a', 'pr': 226, 'constant': 'C_16a', 'claim': 'C_16a >= 2.156224 from a truncated BDZ2013 conditional extremal on [0, 2π]²: u = Σ_{0 < |k|² ≤ 4000²} c_k e^{ik·x}, c_k = 1/(|k|²(|k|² + 41/5)); L ≥ S_0²/(π S_1) − ln δ − ln(1 + ln δ), δ = S_2/S_1 (Patankar)',
             'definition': 'registry 16a: L = max_{δ ≥ 1} [4πΘ(δ) − ln δ − ln(1 + ln δ)], Θ(δ) = sup |u(0)|² over zero-mean u on T² with ‖∇u‖² = 1, ‖Δu‖² = δ; T² = [0, 2π]² as in BDZ2013 (2.4), (3.14), whose 2.15627 is the registry\'s numerical row',
             'verdict': b['verdict'], 'values': b, 'decidedOn': '2026-10-16', 'claimantSource': src226,
             'scope': 'COMPUTED: the three lattice sums as fixed-point enclosures (floor and ceiling of every term at 2^200; %s lattice points in %s norm classes from a sieve, the count checked against Gauss\'s circle formula), π by Machin in integers, ln correctly rounded ±1 ulp; READ: Parseval on the 2π-torus, the normalisation ũ = u/‖∇u‖ (so Θ(δ) ≥ S_0²/(4π² S_1) and δ = S_2/S_1), δ ≥ 1 established from its enclosure' % (format(b['latticePoints'], ','), format(b['distinctNorms'], ',')),
             'how': 'standard library only (instruments/optq/bgw16a.py, no code of the claimant\'s); the right-hand side enclosed in [%s, %s] against 2.156224; δ in [%s, %s]' % (b['enclosure'][0], b['enclosure'][1], b['delta'][0], b['delta'][1]),
             'registryBefore': '(β+π)/π ≈ 1.82283 (lower)', 'claimantPrinted': '2.1562247… (δ ≈ 3.93181)'})
if b['verdict'] != 'CERTIFIED': die('#226 16a did not certify')
c = rbm70a.decide(300000, F(13, 1000), '1.201927')
rows.append({'id': 'optq-226-70a', 'pr': 226, 'constant': 'C_70a', 'claim': 'C_70a >= 1.201927 from the cube of side a and the ball of radius r in n = 300,000 with a/r = 13/1000: for every |det u| = 1, |u(B_1) + rB| ≥ Σ_j C(n, j) a^j κ_{n−j} r^{n−j} (Steiner, zonotope faces, Szász, AM–GM), so C_70 ≥ (Σ_j …)^{1/n}/(a + κ_n^{1/n} r) (Patankar)',
             'definition': 'registry 70a: the infimum of C such that every pair of centrally symmetric convex bodies in every dimension n has a linear u with |det u| = 1 and |u(B_1) + B_2|^{1/n} ≤ C(|B_1|^{1/n} + |B_2|^{1/n}); a pair for which no u does better than c is a lower bound',
             'verdict': c['verdict'], 'values': c, 'decidedOn': '2026-10-16', 'claimantSource': src226,
             'scope': 'COMPUTED: the Steiner sum at n = 300,000 by outward-rounded decimal recurrences (κ_m = κ_{m−2}·2π/m, C(n, j+1) = C(n, j)(n−j)/(j+1), t^j), π by Machin, the n-th roots through correctly rounded ln and exp; READ: the four-step chain — Steiner\'s formula, V_j of a zonotope as the sum of its j-face parallelotope volumes, Szász\'s inequality on the Gram matrix, AM–GM — each applied as stated; n = 2 agrees with the closed form √(t² + 4t + π)/(t + √π)',
             'how': 'standard library only (instruments/optq/rbm70a.py, no code of the claimant\'s); the bound enclosed in [%s, %s] against 1.201927' % (c['enclosure'][0], c['enclosure'][1]),
             'registryBefore': '1 (lower)', 'claimantPrinted': '1.201927'})
if c['verdict'] != 'CERTIFIED': die('#226 70a did not certify')

# ---- #217 -------------------------------------------------------------------------------------------------------------------
K = J('certs/openai-math-kernel.json')
krow = None
for r in (K.get('rows') or K.get('challenges') or []):
    if 'Borsuk' in json.dumps(r): krow = r; break
rows.append({'id': 'optq-217-28a', 'pr': 217, 'constant': 'C_28a', 'claim': 'C_28a <= 9: Borsuk\'s covering assertion fails in dimension 9 — OpenAI\'s BorsukNine (rank-one projectors onto lines of R^4 under the Frobenius metric; Lean OAI.BorsukNine.main_theorem), recorded by kleinwaks',
             'definition': 'registry 28a: the smallest dimension in which Borsuk\'s conjecture fails; a counterexample in dimension d gives C_28a <= d',
             'verdict': 'CERTIFIED' if krow and str(krow.get('word', '')).startswith('CERTIFIED') else 'REFUSED',
             'scope': 'by this repository\'s own earlier record: certs/openai-math-kernel.json (the openai/math audit, lane K, 2026-10-10: the Lean project rebuilt here and checked by two kernels, the statement read MATCHES against the paper\'s claim with no definition holes); the PR text re-read today against that row',
             'kernelRow': {k: krow.get(k) for k in ('challenge', 'word', 'why', 'definitionHoles', 'statementLines') if krow and k in krow} if krow else None,
             'how': 'nothing new computed: the certificate is the Lean development already decided; the PR\'s wording ("counterexample to Borsuk\'s covering assertion", dimension 9) agrees with the theorem as read then', 'registryBefore': '4 <= C_28a <= 63'})
if rows[-1]['verdict'] != 'CERTIFIED': die('#217: the BorsukNine row of the kernel record is not CERTIFIED or not found')

# ---- #210: the package inventoried -------------------------------------------------------------------------------------------
P = os.path.join(SRC, 'mosaic-certified01595')
files = [os.path.relpath(os.path.join(dp, f), P) for dp, dn, fn in os.walk(P) for f in fn]
frozen = [f for f in files if '/frozen/' in f]
scripts = [f for f in files if f.endswith('.py.txt')]
imports = {}
for s in scripts:
    txt = open(os.path.join(P, s), encoding='utf-8', errors='replace').read()
    imports[s] = sorted(set(re.findall(r'^(?:from|import)\s+([\w\.]+)', txt, re.M)))
    imports[s + ':defs'] = len(re.findall(r'^def ', txt, re.M))
alltxt = ''.join(open(os.path.join(P, f), encoding='utf-8', errors='replace').read() for f in files if f.endswith(('.txt', '.md', '.json')))
banks = sorted(set(re.findall(r'\bbank\s?(\d{3})\b', alltxt)))
mentions = {w: len(re.findall(w, alltxt)) for w in ('zeta', 'Dirichlet', 'H_t', 'Polymath', 'PT2021', 'bank')}
gates = sorted(set(re.findall(r'"?(\w+_ok)"?', open(os.path.join(P, 'verify', 'record_score.py.txt'), encoding='utf-8', errors='replace').read())))
vm = open(os.path.join(P, 'VERIFY.md'), encoding='utf-8', errors='replace').read()
checks = re.search(r'TOTAL CHECKS RUN: ([\d,]+)', vm)
rows.append({'id': 'optq-210-lambda', 'pr': 210, 'constant': 'Λ (de Bruijn--Newman, registry 21a)', 'claim': 'Λ <= 319/2000 = 0.1595 by a "certified record package" (Mosaic Intelligence, 2026-10-03; the registry records 0.2 (PT2021) with Mosaic\'s own 0.1875* row; the route: collision exclusion with an interior zero-free check at X = 6000000185827 and an exterior polydisc floor for a 690,988-term Dirichlet polynomial, carried by a "circular heat" lemma and a "real projection" lemma)',
             'definition': 'registry 21a: the de Bruijn--Newman constant; Λ <= c is a theorem about the zeros of H_t for t >= c',
             'verdict': 'REFUSED', 'scope': 'the evidence is not in the submission',
             'inventory': {'files': len(files), 'frozenFiles': len(frozen), 'scripts': scripts, 'imports': imports, 'bankCitations': banks, 'mentions': mentions, 'scorerGates': gates, 'totalChecksRunPrinted': checks.group(1) if checks else None},
             'how': 'the package read file by file (nothing run): the scorer (verify/record_score.py, %d defs) and the two math checkers (math/verify.py with python-flint arb, math/second_line.py with mpmath.iv) evaluate auxiliary inequalities on FROZEN coefficient tables (walls, clocks, norms, debits, Taylor leaves) and compare rationals, hashes and box covers; no function of the three evaluates ζ, H_t or the Dirichlet polynomial itself — the torus floor, the separator at X and the Polymath15 error constants enter as %d frozen outputs whose derivations cite a private "bank" (%s) that is not in the bundle. The anchor Λ <= 3/16 is the claimant\'s own earlier row, merged unreviewed. What an outside computation could decide first: the torus-floor inequality of bank767 (|F_1| − Σ_{r>1} |F_r| > 1/10 on T^4) by an interval cover; the separator at x = X for t in [0, 3/16] including y = 0; the error constants p, q from Polymath15 Theorem 1.3 — each a campaign of its own' % (imports.get('verify/record_score.py.txt:defs', 0), len(frozen), ', '.join(banks) or 'none found'),
             'registryBefore': '0.2 (PT2021); 0.1875* (Mosaic, merged 2026-07-17)'})

rec = {'what': 'the open pull-request queue of teorth/optimizationproblems on 2026-10-15 — #210, #217, #221, #225, #226 — decided where a finite exact object exists, read where the claim is a short proof, refused where the evidence is not in the submission; #226\'s 16a and 70a, refused as not attempted on 10-15, decided on 2026-10-16',
       'preregistration': 'corpus/optconst-queue/preregistration.json', 'pins': 'corpus/optconst-queue/PINS.json', 'registryCommit': '2c1968cd', 'rows': rows,
       'counts': {v: sum(1 for r in rows if r['verdict'] == v) for v in ('CERTIFIED', 'REFUTED', 'REFUSED')},
       'decider': {f: sha('instruments/optq/' + f) for f in ('stepfun.py', 'twolaw.js', 'exact226.py', 'ivdec.py', 'bgw16a.py', 'rbm70a.py')}, 'python': sys.version.split()[0],
       'seconds': round(time.time() - t0, 1), 'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
out = os.path.join(ROOT, 'certs', 'optq-ledger.json')
json.dump(rec, open(out, 'w'), indent=1, default=str); open(out, 'a').write('\n')
print('wrote certs/optq-ledger.json — %d rows: %s (%.0f s)' % (len(rows), ', '.join('%s %d' % kv for kv in rec['counts'].items()), rec['seconds']))
