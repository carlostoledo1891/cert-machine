#!/usr/bin/env python3
"""run-bandeira-ledger.py — the record of the Bandeira 0.2(a) audit, certs/bandeira-ledger.json, re-derived from the
pinned inputs every run: every pin re-hashed, both certificates decided again under every convention by
instruments/bandeira/verify.py (exact rationals), the float screen's measurements carried as measurements, the Lean lane
read from corpus/bandeira/lean-build.json when it exists, and the verdict composed by the grammar
(instruments/verdict.js's words: CERTIFIED / REFUTED / REFUSED, with the scope beside it).

    python3 -I tools/run-bandeira-ledger.py
"""
import hashlib, json, os, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'bandeira'))
import verify as V

J = lambda rel: json.load(open(os.path.join(ROOT, rel)))
sha = lambda rel: hashlib.sha256(open(os.path.join(ROOT, rel), 'rb').read()).hexdigest()


def die(m):
    sys.exit('BANDEIRA LEDGER REFUSED: ' + m)


pins = J('corpus/bandeira/PINS.json')
for f, h in pins['pins'].items():
    rel = os.path.normpath(os.path.join('corpus/bandeira/sources', f))
    if sha(rel) != h:
        die('%s moved from its pin' % rel)
theirs = J('corpus/bandeira/certificate-v2.json')
ours = J('corpus/bandeira/certificate-cm.json')
screen = J('corpus/bandeira/sdp-screen.json')
lean = J('corpus/bandeira/lean-build.json') if os.path.exists(os.path.join(ROOT, 'corpus/bandeira/lean-build.json')) else None

t0 = time.time()
C = {}
for who, cert in (('claimant', theirs), ('ours', ours)):
    C[who] = {conv: V.decide(cert, conv) for conv in ('leftT', 'rightT', 'none')}
ok_ours = C['ours']['leftT']['verdict'] == 'CERTIFIED'
ok_theirs_none = C['claimant']['none']['verdict'] == 'CERTIFIED'
if not ok_ours:
    die('our own certificate for the sum-of-squares SDP no longer holds')
if not ok_theirs_none:
    die("the claimant's certificate no longer holds under its own convention")
theirs_sos = any(C['claimant'][c]['verdict'] == 'CERTIFIED' for c in ('leftT', 'rightT'))

rows = [
    {'id': 'bandeira-02a-sos-infeasible-120', 'claim': "Lai--Lim's sum-of-squares SDP (Conjecture 1C, m = n = 5, Helton's form beta_a^T X_i beta_b) is infeasible at lambda = 120, hence lambda_2 > 120 = 5!",
     'verdict': 'CERTIFIED', 'how': 'our own exact rational Farkas certificate (corpus/bandeira/certificate-cm.json; y0 = -1, denominators <= %d, found by a float search and decided in exact rationals): m00 = %s < 0, the six 31 x 31 blocks positive definite by exact LDL^T, 120 y0 + b^T y = %s > 0' % (ours['denominatorBound'], C['ours']['leftT']['m00'], C['ours']['leftT']['scalar']),
     'witness': {'certificate': 'corpus/bandeira/certificate-cm.json', 'minPivots': [b['minPivot'] for b in C['ours']['leftT']['blocks']], 'convention': 'leftT'},
     'sharesCode': 'none with the claimant: the SDP built from the definition in Lai--Lim (2020) as read here; the certificate found here'},
    {'id': 'bandeira-02a-claimant-certificate', 'claim': "the claimant's certificate (y0 = -146/2061, y with denominators <= 10^4) is a Farkas certificate of infeasibility at lambda = 120",
     'verdict': 'CERTIFIED', 'scope': "for the SDP whose Gram form carries no transpose (beta_a X_i beta_b, the convention the claimant's export states and its Lean files encode); it is NOT a certificate for the sum-of-squares form under either transpose convention (the blocks lose positive definiteness)",
     'how': "decided here under the claimant's convention: m00 = %s < 0, six blocks positive definite with the smallest pivots equal to the claimant's published ones, scalar %s > 0; under leftT and rightT the same y fails the cone condition" % (C['claimant']['none']['m00'], C['claimant']['none']['scalar']),
     'witness': {'certificate': 'corpus/bandeira/certificate-v2.json', 'minPivots': [b['minPivot'] for b in C['claimant']['none']['blocks']], 'convention': 'none',
                 'underSOSForm': {c: {'verdict': C['claimant'][c]['verdict'], 'blocksPD': [b['positiveDefinite'] for b in C['claimant'][c]['blocks']]} for c in ('leftT', 'rightT')}},
     'finding': "the claimant's paper identifies its SDP with Lai--Lim's by reproducing 'beta X_i beta^T' literally, without the transposes that make tr(beta X_i beta^T Y) a noncommutative sum of squares f^T X_i f; its certificate and its Lean files decide that SDP. In floating point the two SDPs have the same optimum on every case of Lai--Lim's Table 1 and at (5,5) (corpus/bandeira/sdp-screen.json), and the sum-of-squares SDP is infeasible at 120 by the certificate above, so the conclusion stands; whether the two SDPs are equivalent in general is not decided here, and the claimant's text does not argue it. This sits exactly at the boundary the paper declares external ('the identification of the concrete standard-form coefficient matrices C_i and right-hand-side vector b with Lai--Lim's monomial-matching SDP ... is not itself a Lean theorem')."},
    {'id': 'bandeira-02a-equivalence', 'claim': "Bandeira's Open Problem 0.2(a) for n matrices is the same inequality as Recht--Re's (RR_{n,n}) in spectral norm (the paper's Theorem 4.4)",
     'verdict': 'CERTIFIED', 'scope': 'by reading: Bandeira (2015) writes (a) as ||(1/n!) sum_sigma prod A_sigma(j)|| <= ||(1/n^n) sum_k prod A_k_j||; the right side is ||(A_1+...+A_n)^n|| / n^n by the distributive law, which is (RR_{n,n})\'s with-replacement side with Lai--Lim\'s normalisation, and the left side is its distinct-index side; the paper\'s Lemma 4.1 (||S^k|| = ||S||^k for S PSD) is only needed for the form ||mean||^n. The Lean files state this reduction over an abstract ordered type (BandeiraAMGM.lean) and the identities concretely (ConcreteIdentities.lean); the Lean lane says whether they build.',
     'how': 'the two statements read side by side from the pinned sources (corpus/bandeira/sources/bandeira-open-problem-0.2_MIT18_S096F15.pdf, paper-main.tex, lai-lim-2020-pmlr-v119.pdf)'},
    {'id': 'bandeira-02a-headline', 'claim': "Bandeira's Open Problem 0.2(a) is false for n = 5",
     'verdict': 'CERTIFIED', 'scope': 'the finite core — the sum-of-squares SDP infeasible at lambda = 120 — is decided here by our own exact certificate; the step from that infeasibility to a PSD tuple violating the inequality is the noncommutative Positivstellensatz for bounded linear matrix-inequality domains (Helton--Klep--McCullough 2012, as Lai--Lim\'s Theorem 3 states it), a published theorem CITED and not re-derived, which the claimant\'s paper also declares external; the reduction from the inequality to the Loewner form and the equivalence with Bandeira\'s statement are read above. A claim whose analytic step rests on a cited theorem is certified with that step named, as the register does for Mathlib\'s theorems.',
     'how': 'composition of the rows above; the kinds of evidence are not merged'},
]
rec = {
    'what': "the Qiushi Engine's disproof of Bandeira's Open Problem 0.2(a) at n = 5 (Oxelra-AI/Bandeira-0.2a-open-source, 2026-06), audited: the finite core re-decided with our own certificate, the claimant's certificate decided and its convention named, the chain read against the sources",
    'preregistration': 'corpus/bandeira/preregistration.json', 'pins': 'corpus/bandeira/PINS.json', 'repositoryCommit': pins['repositoryCommit'],
    'rows': rows,
    'decisions': {who: {conv: {k: v for k, v in r.items() if k not in ('blocks',)} | {'blocks': [{'block': b['block'], 'constraint': b['constraint'], 'positiveDefinite': b['positiveDefinite'], 'minPivot': b['minPivot'][:80] + ('...' if len(b['minPivot']) > 80 else '')} for b in r['blocks']]}
                        for conv, r in C[who].items()} for who in C},
    'floatScreen': {'file': 'corpus/bandeira/sdp-screen.json', 'lambda2At55': {r['convention']: r['lambda2'] for r in screen['case55']}, 'laiLim': screen['laiLim55'], 'isAVerdict': False},
    'lean': lean or {'status': 'PENDING', 'what': 'the default Lake target of the repository built at its pins; the axioms of the main theorems asked of the kernel; recorded in corpus/bandeira/lean-build.json when done'},
    'decider': {'verify.py': sha('instruments/bandeira/verify.py'), 'certify.py': sha('instruments/bandeira/certify.py'), 'battery.py': sha('instruments/bandeira/battery.py'), 'python': sys.version.split()[0]},
    'seconds': round(time.time() - t0, 1), 'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
}
out = os.path.join(ROOT, 'certs', 'bandeira-ledger.json')
json.dump(rec, open(out, 'w'), indent=1); open(out, 'a').write('\n')
print('wrote certs/bandeira-ledger.json — %d rows: %s (%.0f s)' % (len(rows), ', '.join(r['id'] + ' ' + r['verdict'] for r in rows), rec['seconds']))
