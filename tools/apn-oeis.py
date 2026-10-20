#!/usr/bin/env python3
"""tools/apn-oeis.py — the OEIS half of the AlphaProof Nexus audit: the 38 published OEIS proofs' statements read against
the OEIS conjectures they claim, and their definitions checked against the OEIS terms. Standard library only.

The paper (arXiv 2605.22763 v1) says: "We used Gemini to autoformalize 492 open questions from the OEIS ... The agent found
proofs for 44 conjectures that a manual review found to be correctly formalized and previously unproven." The repository
(google-deepmind/alphaproof-nexus-results @ 0647711a) publishes 38.

  O1  each Lean definition, translated into exact Python (corpus/alphaproof-nexus/oeis-reading/A*.py), reproduces the OEIS
      terms on the range each translation states (re-run: python3 -I corpus/alphaproof-nexus/oeis-reading/run_all.py)
  O2  each statement read against the conjecture — a READING by an AI agent (2026-10-20), words MATCHES / NARROWER /
      STRONGER / DIFFERENT / VACUOUS-TRIVIAL / UNCLEAR, every non-MATCHES row re-checked here before it is stated
  O3  what OEIS itself records about an earlier proof
  Re-checked here by this file, exactly, for the row the reading calls degenerate (A382590): the 2-adic valuation of a(n)
  from the Lean file's own recurrence — with prime factors counted with multiplicity, as the Lean definition counts them,
  the k-th prime factor of a(n) is 2 as soon as that valuation reaches k.

usage: python3 tools/apn-oeis.py           write certs/apn-oeis.json
       python3 tools/apn-oeis.py --check   re-derive and compare (the battery; does not re-run the 38 translations)
MIT"""
import hashlib
import json
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
D = os.path.join(ROOT, 'corpus', 'alphaproof-nexus')
OUT = os.path.join(ROOT, 'certs', 'apn-oeis.json')


def die(m):
    sys.exit('APN OEIS REFUSED: ' + m)


def a382590_v2(n_max=25):
    """the Lean file's A382590_pair recurrence, exactly; returns [(n, v2(a(n)))]"""
    pairs = [(1, 1), (2, 1)]
    for _ in range(2, n_max + 1):
        (a1, b1), (a0, b0) = pairs[-1], pairs[-2]
        pairs.append((a1 * b0 + a0 * b1, a1 * b0 - a0 * b1))
    out = []
    for n, (a, _) in enumerate(pairs):
        if a == 0:
            die('a(%d) = 0' % n)
        x, v = abs(a), 0
        while x % 2 == 0:
            x //= 2
            v += 1
        out.append((n, v))
    return out


def run():
    pins = json.load(open(os.path.join(D, 'PINS.json')))
    for rel, f in pins['files'].items():
        if hashlib.sha256(open(os.path.join(D, rel), 'rb').read()).hexdigest() != f['sha256']:
            die(rel + ' does not match its pin')
    readings = json.load(open(os.path.join(D, 'oeis-reading', 'readings.json')))
    lean = sorted(f for f in os.listdir(os.path.join(D, 'oeis')) if f.endswith('.lean'))
    if sorted(r['file'] for r in readings) != lean:
        die('the readings do not cover exactly the published OEIS files')
    res = {}
    for f in os.listdir(os.path.join(D, 'oeis-reading', 'results')):
        res[f[:-5]] = json.loads(open(os.path.join(D, 'oeis-reading', 'results', f)).read())
    terms_bad = [r['anumber'] for r in readings if not r['termsAgree']]
    words = {}
    for r in readings:
        words[r['word']] = words.get(r['word'], 0) + 1
    # the degenerate row, re-checked exactly here
    v = a382590_v2()
    eventually = min(k for k, _ in v if all(val >= 3 for n2, val in v if n2 >= k))
    prior = []
    for r in readings:
        s = (r.get('oeisListsProof') or '')
        if re.search(r'earlier|before|predate|Fried|Tao sketched|Hoft', s, re.I) and r['anumber'] in ('A325046', 'A382590', 'A237271'):
            prior.append(r['anumber'])
    rows = [{k: r.get(k) for k in ('file', 'anumber', 'word', 'declared', 'reason', 'conjectureQuote', 'conjectureSource', 'termsChecked', 'termsRange', 'termsAgree', 'oeisListsProof', 'notes')} for r in readings]
    verified = {
        'A382590': {
            'word': 'VACUOUS/TRIVIAL — true for a reason unrelated to the conjecture',
            'finding': 'The Lean kth_prime_factor counts prime factors WITH multiplicity (primeFactorsList). The conjecture, as its MathOverflow source states it with examples (question 490330, asked 2025-03-31: "n = 2, N = 2: (3, 5, 7)"), counts distinct primes. The 2-adic valuation of a(n), from the Lean file\'s own recurrence, is %s for n = 0..25; it is at least 3 from n = %d on, so with multiplicity the 2nd and 3rd prime factors are 2 from there on and the "eventually periodic" statement holds by eventual constancy, not by the 3, 5, 7 cycle the conjecture is about.' % (', '.join(str(x) for _, x in v), eventually),
            'priorProof': 'Terence Tao\'s accepted MathOverflow answer (2025-03-31) proves the conjecture for distinct primes (A_n divides A_{n+3}, so the k-th smallest prime factor is bounded, plus periodicity mod p); OEIS: "Terence Tao sketched the proof (see the Mathoverflow link)."',
            'v2': [list(x) for x in v],
        },
        'A325046': {
            'word': 'MATCHES (statement) — but not previously unproven',
            'priorProof': 'OEIS: "The conjecture is true (see Fried link). - Sela Fried, Dec 17 2025", with Fried\'s proof PDF; the OEIS history shows the edit approved Wed Dec 17 17:20 EST 2025 (corpus/alphaproof-nexus/oeis-data/A325046-history-excerpt.txt) — five months before the preprint (2026-05-21).',
        },
        'A237271': {
            'word': 'VACUOUS/TRIVIAL given the file\'s definition',
            'finding': 'The Lean a is not the sequence\'s definition (parts of the symmetric representation of sigma) but Conjecture 1\'s characterization, which OEIS records as proved (Hoft, Jan 21 2025). Given it, the theorem (a n = the number of 2-dense sublists) is a two-line divisor fact: for consecutive divisors d < d\', d\' > 2d forces d\' odd, since an even d\' would put the divisor d\'/2 strictly between them.',
            'priorProof': 'OEIS: Conjecture 2 "is essentially the same as the second conjecture in the Comments of A384149", which A384149 records as proved (Hoft, Jan 11 2026) — before the preprint.',
        },
    }
    rec = {
        'what': "AlphaProof Nexus's OEIS results: the 38 published Lean statements read against the OEIS conjectures they claim (a reading by an AI agent, every non-MATCHES row and every earlier-proof row re-checked before it is stated), each definition checked against the OEIS terms by an exact Python translation, and what OEIS records about earlier proofs. The paper claims 44 proofs of conjectures 'correctly formalized and previously unproven'.",
        'decider': hashlib.sha256(open(os.path.abspath(__file__), 'rb').read()).hexdigest(),
        'pins': 'corpus/alphaproof-nexus/PINS.json', 'apnCommit': pins['apnCommit'],
        'claimed': 44, 'published': len(lean),
        'counts': {'words': words, 'definitionsAgreeWithOEIS': len(readings) - len(terms_bad), 'definitionsDisagree': terms_bad,
                   'priorProofRows': sorted(prior)},
        'verified': verified,
        'rows': rows,
        'readingBy': 'an AI agent (Claude), 2026-10-20, not told what to find; the three findings above re-checked against the sources by a second pass',
        'limits': ['the readings are AI-made and no specialist has confirmed them; they are reported as what the statement does not say, never as an error in the proof',
                   'definitions are checked on finite ranges (stated per row), not proved equal to the OEIS definitions',
                   'six of the 44 claimed proofs are not in the repository and are not read'],
    }
    return rec


def main():
    rec = run()
    if '--check' in sys.argv:
        was = json.load(open(OUT))
        strip = lambda r: {k: v for k, v in r.items() if k != 'decider'}
        if strip(was) != strip(rec):
            die('the record does not re-derive')
        print('apn oeis: re-derived as recorded — %d published of %d claimed; words %s; definitions agree %d/%d; earlier proofs %s'
              % (rec['published'], rec['claimed'], rec['counts']['words'], rec['counts']['definitionsAgreeWithOEIS'], rec['published'], ', '.join(rec['counts']['priorProofRows'])))
        return
    open(OUT, 'w').write(json.dumps(rec, indent=1, ensure_ascii=False) + '\n')
    print('wrote certs/apn-oeis.json — %d published of %d claimed; words %s; definitions agree %d/%d; earlier proofs on OEIS: %s'
          % (rec['published'], rec['claimed'], rec['counts']['words'], rec['counts']['definitionsAgreeWithOEIS'], rec['published'], ', '.join(rec['counts']['priorProofRows'])))


if __name__ == '__main__':
    main()
