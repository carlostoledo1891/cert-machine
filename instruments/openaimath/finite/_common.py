"""_common.py — what every lane-F decider of the openai/math audit shares, and nothing that decides.

The release is read from a clone at the pinned commit (MATH_CLONE, default ~/Projects/openai-math). A decider names
every release file it reads through source(); each file's sha256 is recorded in the decider's result, so a row says
exactly which bytes it decided. Exact arithmetic only: integers and fractions.Fraction (and finite-field residues
where a decider says so). Standard library only — no code from the release is imported or run.
"""
import hashlib
import os
import subprocess
from fractions import Fraction

PIN = 'fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb'
CLONE = os.environ.get('MATH_CLONE', os.path.join(os.path.expanduser('~'), 'Projects', 'openai-math'))


def check_clone():
    head = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=CLONE, capture_output=True, text=True).stdout.strip()
    if head != PIN:
        raise SystemExit('openai/math clone at %s is at %s, not the pin %s' % (CLONE, head, PIN))
    if subprocess.run(['git', 'status', '--porcelain'], cwd=CLONE, capture_output=True, text=True).stdout.strip():
        raise SystemExit('the openai/math clone has local modifications')


class Sources:
    """records each release file a decider reads, with its sha256"""

    def __init__(self):
        self.read = {}

    def text(self, rel):
        p = os.path.join(CLONE, rel)
        b = open(p, 'rb').read()
        self.read[rel] = hashlib.sha256(b).hexdigest()
        return b.decode('utf-8')

    def lines(self, rel, a, b):
        """lines a..b inclusive, 1-based, as the paper's line numbers are cited"""
        return self.text(rel).split('\n')[a - 1:b]


def det(m):
    """exact determinant by Gaussian elimination over Fraction"""
    a = [[Fraction(x) for x in row] for row in m]
    n = len(a)
    d = Fraction(1)
    for c in range(n):
        p = next((r for r in range(c, n) if a[r][c] != 0), None)
        if p is None:
            return Fraction(0)
        if p != c:
            a[c], a[p] = a[p], a[c]
            d = -d
        d *= a[c][c]
        inv = 1 / a[c][c]
        for r in range(c + 1, n):
            f = a[r][c] * inv
            if f:
                row_c = a[c]
                a[r] = [x - f * y for x, y in zip(a[r], row_c)]
    return d


def inverse(m):
    n = len(m)
    a = [[Fraction(x) for x in row] + [Fraction(int(i == j)) for j in range(n)] for i, row in enumerate(m)]
    for c in range(n):
        p = next(r for r in range(c, n) if a[r][c] != 0)
        a[c], a[p] = a[p], a[c]
        piv = a[c][c]
        a[c] = [x / piv for x in a[c]]
        for r in range(n):
            if r != c and a[r][c]:
                f = a[r][c]
                a[r] = [x - f * y for x, y in zip(a[r], a[c])]
    return [row[n:] for row in a]


def check(checks, name, ok, detail=''):
    checks.append({'check': name, 'pass': bool(ok), 'detail': detail})
    return bool(ok)
