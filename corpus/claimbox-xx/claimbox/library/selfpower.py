"""claimbox/library/selfpower.py — the real root of x^x = N (2026-10-31, the operator's experiment on the picture "x^x = 64").

xroot is the one real number with xroot^xroot = N, for the integer N the pinned file prints (N > 1). On (0, 1], x^x <= 1 < N; on
[1, ∞) x^x is continuous and strictly increasing from 1 to ∞, so the root exists, is unique there and exceeds 1. No negative real
x is a root: x^x is real for x < 0 only at rationals of odd denominator, where |x^x| = |x|^x lies in (1, e^(1/e)] for -1 < x < 0
and in (0, 1] for x <= -1, below N. A bound on xroot is exact integer arithmetic: for a bar a = p/q > 1,
    xroot > a  ⟺  a^a < N  ⟺  (p/q)^p < N^q  ⟺  p^p < N^q · q^p,      and xroot < a  ⟺  p^p > N^q · q^p,
so the receiver decides the claim from the object, two integers compared exactly; nothing transcendental is evaluated. The
closed form, xroot = ln N / W(ln N) with W Lambert's function, is a description: no claim here rests on it.
MIT"""

SELFPOWER = {'xroot': {
    'what': 'the real root of x^x = N, N the integer the pinned file prints',
    'reduction': 'xroot is the unique real root of x^x = N for an integer N >= 2 (x^x < 1 on (0, 1) and = 1 at 1; x^x strictly increasing on '
                 '[1/e, ∞), its derivative x^x·(ln x + 1); no negative real root: for x < 0, x^x is taken as real only at rationals of odd '
                 'denominator in lowest terms and undefined elsewhere, and there |x^x| <= e^(1/e) ≈ 1.4447 < 2 <= N); for a bar a = p/q > 1 in '
                 'lowest terms with q >= 1: xroot > a iff a^a < N iff (p/q)^p < N^q (both sides positive, raised to the q-th power) iff '
                 'p^p < N^q·q^p (multiplied by q^p > 0), and xroot < a iff p^p > N^q·q^p; the non-strict forms alike (reviewed by cert-machine-cb, 2026-10-31)',
}}

# the relation on xroot, written as the relation of p^p − N^q·q^p to 0 (xroot > a iff that difference is negative)
FLIP = {'gt': 'lt', 'ge': 'le', 'lt': 'gt', 'le': 'ge'}
SYM = {'gt': '>', 'ge': '≥', 'lt': '<', 'le': '≤'}


def predicate(N, p, q, rel):
    """the exact predicate deciding `xroot REL p/q`: p^p − N^q·q^p against 0"""
    g = ['Subtract', ['Power', str(p), str(p)], ['Multiply', ['Power', str(N), str(q)], ['Power', str(q), str(p)]]]
    return {'g': g, 'rel': FLIP[rel], 'c': '0',
            'note': f'xroot {SYM[rel]} {p}/{q} iff {p}^{p} {SYM[FLIP[rel]]} {N}^{q}·{q}^{p}, two integers compared exactly'}
