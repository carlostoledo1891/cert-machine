#!/usr/bin/env python3
"""run-countex-ledger.py — the AI counterexample library (github.com/suvrit/count-ex-machina, Apache-2.0; S. Sra,
"GPT, the Counterexample Machine", arXiv 2608.29595) decided case by case. Writes certs/countex-ledger.json;
`--check` re-derives it and refuses on any difference.

THE CASES are mirrored verbatim in corpus/countex (case.json, case.tex, artifacts/ at commit dbf67374) and pinned by
sha256 in corpus/countex/meta.json. THE DECIDERS are instruments/countex/cases/*.py — one per case, standard library
only, written from each case's statement and definitions, reading the PUBLISHED artifact, never the authors'
verify.py (read afterwards, for the observations below). Every decider recomputes what its case needs and compares
every printed number as a separate check; each has a forge() that must not certify.

THE REGISTER VERDICT is the decider's, mapped by the rules in RULES below when a case is only partly decidable: a
result that rests on a cited universal theorem, a claim over all m that a finite computation cannot reach, or a claim
that holds under one of two definitions its own text gives — each named, never averaged.

usage: python3 tools/run-countex-ledger.py [--check]"""
import hashlib
import importlib.util
import json
import os
import re
import sys
import time

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CORPUS = os.path.join(ROOT, 'corpus', 'countex')
CASES = os.path.join(ROOT, 'instruments', 'countex', 'cases')
OUT = os.path.join(ROOT, 'certs', 'countex-ledger.json')
COMMIT = 'dbf673741a54c7dc9d88a6aec0e8148a538f4a3a'


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


# the partly decidable cases: (register verdict, defect kind, what is and is not decided)
RULES = {
    'aim-problems': ('PARTIAL', 'narrower-scope', 'Problems 36, 37 and 38 certified; Problem 35\'s nonexistence over all positive semidefinite A rests on universal theorems the case cites (Marcus 1963, Lieb 1966, via Wanless 2022) — the witness\'s own violations of both are certified, the universal step is not re-derived'),
    'lorentzian-jensen': ('PARTIAL', 'narrower-scope', 'the Lorentzian generalization certified (G strictly Lorentzian, the triangle violation enclosed to 60 digits); the log-volume-distance result needs convex bodies that exist only through a cited realization theorem (Shephard), none exhibited'),
    'odonnell-matrix-conjecture': ('PARTIAL', 'narrower-scope', 'every family member to m = 11 certified (unit trace, PSD, ratio above m/32; built exactly, densely at n = 512); unboundedness over all m, which refuting a universal constant needs, is argued in prose (a trace-norm duality bound and dyadic sums past m = 14)'),
    'variance-only-matrix-discrepancy': ('PARTIAL', 'narrower-scope', 'm = 2..10 certified exactly (discrepancy by exhaustion, ratio squared up to 81/11 at m = 10); unboundedness over all m, which refuting a universal constant needs, is a three-line argument in the case\'s prose, checked by hand and not by code'),
    'dpp-feasible-step': ('PARTIAL', 'depends-on-reading', 'CERTIFIED when "feasible" means the step keeps the iterate positive definite (the case\'s context paragraph): a = 5 does, and the likelihood falls. The case\'s statement block reads "feasibility is the bound a ≤ 1/(1 − γ) of Prop. A.1", and for this L0 that bound is about 1.90, which a = 5 exceeds; under that reading the witness refutes nothing, and the steps tried inside the bound (a = 1, 3/2, 9/5, 1899/1000) all ascend'),
}

# what the authors' own checkers do, read AFTER each decider was written; quoted lines were checked against the files
COMMON = ('Every case\'s verify.py builds its witness from values in its own source and WRITES artifacts/ from them; none of the fourteen reads '
          'the published certificate. The library\'s CI then regenerates the artifacts and requires `git diff --exit-code`, so the committed '
          'files equal what the code writes — but a reader holding only a certificate cannot check it with verify.py. The deciders here read the '
          'published artifacts.')
OBSERVED = {
    'aim-problems': 'verify_pot.py types in the Kostka matrix and the f^λ values and reads coefficients only at partition exponents, without checking symmetry; nothing is computed for Problem 35 (verify_pencil.py is exact and thorough).',
    'dpp-feasible-step': 'exact; never checks the Prop. A.1 bound the statement names.',
    'lorentzian-jensen': 'the arithmetic is exact with a stated series remainder; that G is Lorentzian, and the Shephard inequalities, appear only in prose.',
    'macdonald-schur-convexity': 'rests on SymPy\'s simplify (a heuristic, not a decision procedure); positivity for every r is asserted in a comment; the determinant-shift block checks expressions typed in by hand.',
    'odonnell-matrix-conjecture': 'never builds R: the diagonal is assigned (`diagonal = list(eigenvalues); diagonal[0] -= delta; diagonal[-1] += delta`), the induction is written in rather than run, and the dyadic bounds are not checked.',
    'osi-sketch-and-solve': 'the residual formula and OPT = 1 are typed in (`residual_squared = x_tilde * x_tilde + F(1)`).',
    'qrcp-orthonormal-greedy': 'exact; relies on the prose step Q(I,:) = H^(-1/2) and does not check P_II^(-1) = H.',
    'quantum-coupon-collector': 'exact; writes "proved_positive_definite_for_n": [1, 2, 3, 4, 5] into the certificate without a check.',
    'rank-two-mixed-norm': 'the general result rests on SymPy\'s `deficit.is_negative is True`, which settles the sign of such a number by evaluating it (sound here, the deficit is about −5.15); the B = A result is an mpmath point value, `assert ratio > mp.mpf("1.0000006")`, the interval certificate living in a Sage script verify.py does not run.',
    'sdd-nystrom-diminishing-returns': 'exact; positive semidefiniteness is checked on the complement block only.',
    'theta-derivative-log-concavity': 'no tail bound ("m>=20 is astronomically negligible; see Sage certificate for rigorous tail"), a point comparison; the rigorous part is a Sage script verify.py does not run.',
    'variance-only-matrix-discrepancy': 'exact, for m in (2, 3, 4) with three U each; "unbounded in m" appears only as a string in the certificate.',
}


def load(case):
    f = os.path.join(CASES, case.replace('-', '_') + '.py')
    spec = importlib.util.spec_from_file_location('cx_' + case.replace('-', '_'), f)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m, f


def build():
    meta = json.load(open(os.path.join(CORPUS, 'meta.json')))
    for rel, h in meta['files'].items():
        if sha(os.path.join(CORPUS, rel)) != h:
            sys.exit('countex-ledger: ' + rel + ' is not the pinned bytes')
    rows, code = [], {}
    for case in sorted(os.listdir(os.path.join(CORPUS, 'counterexamples'))):
        root = os.path.join(CORPUS, 'counterexamples', case)
        cj = json.load(open(os.path.join(root, 'case.json')))
        tex = open(os.path.join(root, 'case.tex')).read()
        found = re.findall(r'\\foundby\{([^}]*)\}\{([^}]*)\}', tex)
        m, f = load(case)
        code['instruments/countex/cases/' + os.path.basename(f)] = sha(f)
        t0 = time.time()
        r = m.decide(root)
        secs = time.time() - t0
        checks = r.get('checks', [])
        res = r.get('results')
        if isinstance(res, dict):
            res = {k: (v.get('verdict') if isinstance(v, dict) else v) for k, v in res.items()}
        elif isinstance(res, list):
            res = {(x.get('id') if isinstance(x, dict) else str(i)): (x.get('verdict') if isinstance(x, dict) else x) for i, x in enumerate(res)}
        reg, kind, scope = RULES.get(case, (r['verdict'], 'none', 'every fact the counterexample needs, re-derived from the published artifact'))
        if case not in RULES and r['verdict'] != 'CERTIFIED':
            sys.exit('countex-ledger: ' + case + ' came back ' + r['verdict'] + ' with no rule to read it by')
        rows.append({'id': case, 'title': cj['title'], 'claimedStatus': cj['status'], 'foundBy': [{'by': b, 'when': w} for b, w in found],
                     'classes': [x.get('class') for x in cj['results']], 'claim': r.get('claim'), 'deciderVerdict': r['verdict'], 'results': res,
                     'checks': len(checks), 'checksFailed': [c['name'] for c in checks if not c.get('ok')][:8],
                     'verdict': reg, 'kind': kind, 'scope': scope, 'theirChecker': OBSERVED.get(case, 'exact.'), 'seconds': round(secs, 1)})
    by = {}
    for x in rows:
        by[x['verdict']] = by.get(x['verdict'], 0) + 1
    return {
        'what': 'The AI counterexample library of S. Sra (github.com/suvrit/count-ex-machina @ ' + COMMIT[:8] + ', Apache-2.0; arXiv 2608.29595), decided case by case by standard-library deciders written from each case\'s statement and reading its published artifact, never the authors\' checker. CERTIFIED: every fact the counterexample needs re-derived; PARTIAL: a certified part beside a part that rests on a cited theorem, an all-m argument, or one of two readings the case\'s own text gives — each named in scope.',
        'generated': time.strftime('%Y-%m-%d'),
        'source': {'repo': 'suvrit/count-ex-machina', 'commit': COMMIT, 'license': 'Apache-2.0', 'paper': 'arXiv:2608.29595', 'corpus': 'corpus/countex', 'metaSha256': sha(os.path.join(CORPUS, 'meta.json'))},
        'code': code, 'theirCheckers': COMMON, 'byVerdict': by, 'rows': rows,
    }


def strip(x):
    y = json.loads(json.dumps(x))
    y['generated'] = None
    for r in y['rows']:
        r['seconds'] = None
    return y


if __name__ == '__main__':
    L = build()
    if '--check' in sys.argv:
        if strip(json.load(open(OUT))) != strip(L):
            sys.exit('countex-ledger: the ledger is not what the corpus and the deciders give now')
        print('countex-ledger: re-derived, identical (%d cases)' % len(L['rows']))
    else:
        json.dump(L, open(OUT, 'w'), indent=1, ensure_ascii=False)
        open(OUT, 'a').write('\n')
        print('countex-ledger: %d cases · %s' % (len(L['rows']), ', '.join('%d %s' % (v, k) for k, v in sorted(L['byVerdict'].items()))))
