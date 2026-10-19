"""fei-second-harness.py — the Python side of tools/verify_fei.js. It runs instruments/fei/fei.py (imported as a module,
never edited) on the fixtures the JavaScript side sends, and, with --arb under a Python that has python-flint, builds the
Arb reference from fei.py's OWN spectrum. It decides nothing itself: it calls fei.decide() and reports what came back,
fei.py's own word included. The reading of that word in the repository's three words (instruments/verdict.js) is done
once, in verify_fei.js. It is NOT named verify_*.py on purpose: tools/build-site.js publishes every tools/verify_*.py at
/verify/ as a detached verifier, and this one imports instruments/fei/fei.py, which is not served.

  python3 -I tools/fei-second-harness.py [job.json]
      job     {"fixtures": [{"id", "artifact", "threshold", "record"}], "spectrumOf": <artifact>}   (a file, or stdin
              when no file is named; verify_fei.js writes a file — the n = 18 job is 66 KB, past the 64 KB socket
              buffer, and the stdin hand-off deadlocked once, 2026-10-19)
      stdout  {"python", "digits" (fei.PREC), "results": [{"id", "raw", "raised", "result", "seconds"}],
               "spectrum": {"sha256", "a0", "histogram", "seconds"}}       (by fei.table and fei.wht)

  instruments/zetahankel/.venv/bin/python -I tools/fei-second-harness.py --arb [job.json]
      job     {"artifact", "prec"}
      stdout  H and H/(I-1) as Arb balls at prec bits, each endpoint exact as [mantissa, exponent] (value = m * 2^e),
              computed from fei.wht's spectrum of the artifact's table and Fraction I — no code of verify_fei.js

MIT"""
import hashlib
import json
import os
import sys
import time
from fractions import Fraction as Fr

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'fei'))
import fei  # noqa: E402


def spectrum_of(art):
    t0 = time.time()
    a = fei.wht(fei.table(int(art['n']), art['true_hex']))
    hist = {}
    for v in a:
        if v:
            hist[abs(v)] = hist.get(abs(v), 0) + 1
    return a, {'sha256': hashlib.sha256(','.join(str(v) for v in a).encode()).hexdigest(), 'a0': a[0],
               'histogram': {str(k): hist[k] for k in sorted(hist)}, 'seconds': round(time.time() - t0, 2)}


def run(job):
    out = []
    for fx in job['fixtures']:
        t0 = time.time()
        row = {'id': fx['id'], 'raw': None, 'raised': None, 'result': None}
        try:
            r = fei.decide(fx['artifact'], fx['threshold'], fx.get('record'))
            row['raw'] = r['verdict']
            row['result'] = r
        except (ValueError, ArithmeticError, KeyError) as e:
            row['raised'] = type(e).__name__ + ': ' + str(e)
        row['seconds'] = round(time.time() - t0, 2)
        out.append(row)
    res = {'python': sys.version.split()[0], 'digits': fei.PREC, 'results': out}
    if job.get('spectrumOf'):
        res['spectrum'] = spectrum_of(job['spectrumOf'])[1]
    return res


def arb_lane(job):
    from flint import arb, ctx, fmpq
    ctx.prec = int(job['prec'])
    art = job['artifact']
    n = int(art['n'])
    a, spec = spectrum_of(art)
    N4 = 4 ** n
    I = Fr(sum(v * v * bin(S).count('1') for S, v in enumerate(a)), N4)
    l2 = arb(2).log()
    H = arb(0)
    for k, c in spec['histogram'].items():
        k = int(k)
        H += arb(fmpq(c * k * k, N4)) * (2 * n - 2 * (arb(k).log() / l2))
    den = I - 1
    R = H * arb(fmpq(den.denominator, den.numerator))

    def ends(x):
        lo, hi = x.lower().man_exp(), x.upper().man_exp()
        return [[str(lo[0]), int(lo[1])], [str(hi[0]), int(hi[1])]]
    return {'python': sys.version.split()[0], 'flint': __import__('flint').__version__, 'prec': ctx.prec, 'I': str(I),
            'spectrum': spec, 'H': ends(H), 'ratio': ends(R), 'ratioText': R.str(80, radius=True)}


if __name__ == '__main__':
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    job = json.load(open(files[0])) if files else json.load(sys.stdin)   # a job file: a 66 KB stdin crossed the 64 KB socket buffer and spawnSync deadlocked once (2026-10-19)
    print(json.dumps(arb_lane(job) if '--arb' in sys.argv else run(job)))
