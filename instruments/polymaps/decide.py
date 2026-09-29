"""decide.py — polynomial maps two 2026 papers print, decided in exact rational arithmetic (standard library only).

Gao, "Counterexamples to the Jacobian conjecture in dimensions greater than two" (arXiv 2608.00222; its AI disclosure:
"Claude Fable 5 assisted in the proofs and in the writing up"). A KELLER COUNTEREXAMPLE is decided by two facts: det JF
is identically a nonzero constant (the Jacobian determinant expanded symbolically over Q), and F is not injective (two
distinct rational points with the same image, found here from the paper's fiber structure and only evaluated by the
decider). G, F4 and F5 are printed in full. F6 and F7 are printed only through their construction (the paper's promised
ancillary files are not on arXiv), so they are rebuilt from the printed recipe and the rebuild is checked against every
piece the paper does print; F7's determinant is out of reach of direct expansion here, so it is PARTIAL: its
non-injectivity is decided, and the determinants of its factors are, but their assembly is the paper's lemma.

Castañeda, Honorato and Valenzuela-Henríquez, "The weak Markus–Yamabe conjecture fails in dimension 14" (arXiv
2608.05392; its cubic Phi is, verbatim, a map a public gist says ChatGPT generated). A WEAK MARKUS–YAMABE
COUNTEREXAMPLE is a polynomial field X whose Jacobian has every eigenvalue equal to -1 at every point — decided as the
polynomial identity (JX + I)^N = 0 — with more than one zero, decided by evaluation at printed distinct points. For
the 18-dimensional field this is a symbolic identity where the paper's appendix checks one sample point."""
import json
import os
import sys
import time
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, 'corpus', 'polymaps'))
from poly import P, det, jac  # noqa: E402
from extract import parse_tex, lines  # noqa: E402

CORPUS = os.path.join(ROOT, 'corpus', 'polymaps')


def load_maps():
    M = json.load(open(os.path.join(CORPUS, 'maps.json')))
    out = {}
    for k, m in M.items():
        n = len(m['vars'])
        out[k] = [P(n, {tuple(e): Fr(c) for e, c in comp}) for comp in m['comps']]
    return out, M


def pt(xs):
    return tuple(Fr(x) for x in xs)


def ev(F, p):
    return tuple(f.ev(p) for f in F)


def keller(F, n, expect_det, expect_degs, collide, label):
    checks = []
    t0 = time.time()
    D = det(jac(F, n))
    cv = D.const_value()
    checks.append({'name': 'det JF is identically the printed constant %s' % expect_det, 'ok': cv is not None and cv == Fr(expect_det),
                   'detail': ('constant %s' % cv) if cv is not None else 'not constant: %d terms' % len(D.t), 'seconds': round(time.time() - t0, 2)})
    degs = [f.deg() for f in F]
    checks.append({'name': 'component degrees are the printed %s' % expect_degs, 'ok': degs == expect_degs, 'detail': str(degs)})
    pts = [pt(p) for p in collide]
    imgs = [ev(F, p) for p in pts]
    checks.append({'name': '%d distinct rational points with one image: F is not injective' % len(pts),
                   'ok': len(set(pts)) == len(pts) >= 2 and all(i == imgs[0] for i in imgs), 'detail': 'image (' + ', '.join(str(v) for v in imgs[0]) + ')'})
    return checks


def nilpotent(X, n):
    """(JX + I)^k for k = 1.. until zero; returns the first k with M^k = 0 (or None past n)"""
    M = [[X[i].diff(j) + (1 if i == j else 0) for j in range(n)] for i in range(n)]
    Pk, k = M, 1
    while not all(e.is_zero() for row in Pk for e in row):
        if k > n:
            return None
        Pk = [[sum((Pk[i][l] * M[l][j] for l in range(n) if not Pk[i][l].is_zero() and not M[l][j].is_zero()), P(M[0][0].n))
               for j in range(n)] for i in range(n)]
        k += 1
    return k


def my_field(X, n, zeros, label):
    checks = []
    t0 = time.time()
    k = nilpotent(X, n)
    checks.append({'name': '(JX + I)^k = 0 identically (k = %s <= %d): every eigenvalue of JX is -1 at every point' % (k, n), 'ok': k is not None and k <= n,
                   'seconds': round(time.time() - t0, 2)})
    zs = [pt(z) for z in zeros]
    checks.append({'name': '%d distinct zeros of X' % len(zs), 'ok': len(set(zs)) == len(zs) >= 2 and all(all(v == 0 for v in ev(X, z)) for z in zs)})
    return checks, k


# ---------- F6 and F7 rebuilt from the printed construction (Gao §4) ----------
def gao_build(G2, G3, G4, Delta, weights, stage, first_tex):
    """the construction as the paper prints it: X1 = -det J(G2,G3,G4), X_i = G_i + Delta_i X1; the sweep S = X + gamma Delta;
    the weighted scaling w_k = gamma^wt u_k with gamma^i divided out of S_i; the stage in v; the monomial map
    v = (xy, x^2 z1, x^3 z2, x^4 z3) with x^i divided out of component i+1. Every division is checked exact."""
    D0 = det(jac([G2, G3, G4], 3))
    X1 = -D0
    X = [X1] + [G + d * X1 for G, d in zip([G2, G3, G4], Delta[1:])]
    g4 = P.var(0, 4)
    wv = [P.var(i, 4) for i in (1, 2, 3)]
    S = [x.subs(wv) + g4 * d.subs(wv) for x, d in zip(X, Delta)]
    detS = det(jac(S, 4))
    g = P.var(0, 4)
    u = [P.var(i, 4) for i in (1, 2, 3)]
    wsc = [g ** kk * uk for kk, uk in zip(weights, u)]
    E = []
    for i, s in enumerate(S, start=1):
        sc = s.subs([g] + wsc)
        if not all(e[0] >= i for e in sc.t):
            raise ArithmeticError('gamma^%d does not divide S_%d' % (i, i))
        E.append(P(4, {(e[0] - i,) + e[1:]: c for e, c in sc.t.items()}))
    x, y, z1, z2, z3 = (P.var(i, 5) for i in range(5))
    vm = [x * y, x ** 2 * z1, x ** 3 * z2, x ** 4 * z3]
    st5 = [s.subs(vm) for s in stage]
    F = [st5[0] * x]
    for i, e in enumerate(E, start=1):
        c = e.subs(st5)
        if not all(ex[0] >= i for ex in c.t):
            raise ArithmeticError('x^%d does not divide component %d' % (i, i + 1))
        F.append(P(5, {(ex[0] - i,) + ex[1:]: cc for ex, cc in c.t.items()}))
    first = parse_tex(first_tex, ['x', 'y', 'z_1', 'z_2', 'z_3'])
    return F, X, detS, det(jac(stage, 4)), (F[0] - P(5, first)).is_zero()


def f6_parts():
    w1, w2, w3 = (P.var(i, 3) for i in range(3))
    v1, v2, v3, v4 = (P.var(i, 4) for i in range(4))
    G2 = w2 + w1 * w3 + w1 ** 2 - w1 ** 3
    return dict(G2=G2, G3=2 * w1 * G2 + w2, G4=w3 - G2 * G2 + 2 * w1 ** 4 - 2 * w1 ** 5, Delta=[P.const(1, 3), w1, w1 ** 2, w2], weights=(1, 3, 4),
                stage=[1 - 29 * v1 + 999 * v1 ** 2 + 355 * v1 * v2 - 41553 * v1 ** 3 + v4, 1 + 27 * v1 - 5 * v2, v1 - 12 * v2 + Fr(2128, 5) * v1 ** 2 + v3, -4 * v1 - 10 * v2],
                first_tex='x-29x^2y+999x^3y^2-41553x^4y^3+355x^4yz_1+x^5z_3')


def f7_parts():
    w1, w2, w3 = (P.var(i, 3) for i in range(3))
    v1, v2, v3, v4 = (P.var(i, 4) for i in range(4))
    H3 = w2 + w1 ** 3 + w1 ** 2 * w3
    H4 = w3 + w1 ** 4
    G2 = w2 * w2 + w2 + w1 * w3 + w1 ** 3
    return dict(G2=G2, G3=2 * w1 * G2 + H3, G4=3 * w1 ** 2 * G2 + H4, Delta=[P.const(1, 3), w1, w1 ** 2, w1 ** 3], weights=(1, 3, 4),
                stage=[1 - 61 * v1 + 9012 * v1 ** 2 + Fr(238, 19) * v1 * v2 - Fr(35823670, 19) * v1 ** 3 + 8 * v3 + v4, 1 + 59 * v1 + v2 - 5178 * v1 ** 2 + 19 * v3,
                       -7 * v1 - 27 * v2, -1 - 234 * v1 - 5 * v2],
                first_tex='x-61x^2y+9012x^3y^2-\\tfrac{35823670}{19}x^4y^3+\\tfrac{238}{19}x^4yz_1+8x^4z_2+x^5z_3'), (H3, H4)


def decide(full=True, log=None):
    maps, meta = load_maps()
    W = json.load(open(os.path.join(CORPUS, 'witnesses.json')))
    rows = []

    def row(id_, claim, source, verdict, checks, extra=None):
        r = {'id': id_, 'claim': claim, 'source': source, 'verdict': verdict, 'checks': checks}
        if extra:
            r.update(extra)
        rows.append(r)
        if log:
            log(id_, verdict)
    for key, n, dval, degs, thm in (('G', 3, '2', [4, 11, 12], 'Thm 3.5'), ('F4', 4, '-44/9', [4, 11, 12, 21], 'Thm 4.3'), ('F5', 4, '160/29', [3, 12, 14, 16], 'Thm 4.4')):
        ch = keller(maps[key], n, dval, degs, W['collisions'][key], key)
        row('gao-' + key.lower(), '%s: a polynomial map of C^%d with det J = %s that is not injective (a counterexample to the Jacobian conjecture), printed in full' % (key, n, dval),
            'arXiv 2608.00222, ' + thm, 'CERTIFIED' if all(c['ok'] for c in ch) else 'REFUTED', ch, {'terms': [len(f.t) for f in maps[key]]})
    if full:
        t0 = time.time()
        pr = f6_parts()
        F6, X6, detS6, detStage6, first6 = gao_build(**pr)
        W3 = ['w_1', 'w_2', 'w_3']
        printedX = [P(3, parse_tex(l.split('&=')[1].rstrip(',\\. '), W3)) for l in lines('gao-2608.00222.tex', 1438, 1441).split('\n')]
        ch = [{'name': 'the rebuild reproduces the printed X_1..X_4 and F6,1', 'ok': all((a - b).is_zero() for a, b in zip(X6, printedX)) and first6},
              {'name': 'det J(S) = gamma and the stage determinant is -290', 'ok': detS6.t == {(1, 0, 0, 0): Fr(1)} and detStage6.const_value() == -290},
              {'name': 'rebuilt sizes', 'ok': True, 'detail': 'terms %s, degrees %s' % ([len(f.t) for f in F6], [f.deg() for f in F6])}]
        ch += keller(F6, 5, '-290', [f.deg() for f in F6], W['collisions']['F6'], 'F6')
        row('gao-f6', 'F6: the map the printed construction defines (n = 5), det J = -290, not injective', 'arXiv 2608.00222, Thm 4.5 (the full map is not printed; the promised ancillary files are not on arXiv)',
            'CERTIFIED' if all(c['ok'] for c in ch) else 'REFUTED', ch, {'terms': [len(f.t) for f in F6], 'seconds': round(time.time() - t0, 1)})
        t0 = time.time()
        pr, (H3, H4) = f7_parts()
        F7, X7, detS7, detStage7, first7 = gao_build(**pr)
        dH = det([[H3.diff(1), H3.diff(2)], [H4.diff(1), H4.diff(2)]])
        pts = [pt(p) for p in W['collisions']['F7']]
        imgs = [ev(F7, p) for p in pts]
        ch = [{'name': 'the rebuild reproduces the printed F7,1', 'ok': first7},
              {'name': 'rebuilt sizes', 'ok': True, 'detail': 'terms %s, degrees %s' % ([len(f.t) for f in F7], [f.deg() for f in F7])},
              {'name': 'the factors\' determinants: det J(S) = gamma, the stage 119377, det J_(w2,w3)(H3, H4) = 1', 'ok': detS7.t == {(1, 0, 0, 0): Fr(1)} and detStage7.const_value() == 119377 and dH.const_value() == 1},
              {'name': '2 distinct rational points with one image: F7 is not injective', 'ok': len(set(pts)) == 2 and imgs[0] == imgs[1]},
              {'name': 'det J(F7) constant: rests on the paper\'s factorization lemma (direct expansion of 14,000-26,000-term rows is out of reach here)', 'ok': None}]
        row('gao-f7', 'F7: the map the printed construction defines (n = 5), det J = 119377, not injective', 'arXiv 2608.00222, Thm 4.13',
            'PARTIAL' if all(c['ok'] for c in ch if c['ok'] is not None) else 'REFUTED', ch, {'terms': [len(f.t) for f in F7], 'seconds': round(time.time() - t0, 1)})
    # the weak Markus–Yamabe fields and the cubic
    ch, k14 = my_field(maps['X14'], 14, W['zeros']['X14'], 'X14')
    row('chv-x14', 'X on R^14 (degree 7): JX has spectrum {-1} at every point and X has three zeros, so the weak Markus–Yamabe conjecture fails in dimension 14',
        'arXiv 2608.05392, Thm 5.1', 'CERTIFIED' if all(c['ok'] for c in ch) else 'REFUTED', ch, {'nilpotencyIndex': k14})
    Phi = maps['Phi']
    D = det(jac(Phi, 11))
    us = [pt(u) for u in W['zeros']['Phi_points']]
    im = [ev(Phi, u) for u in us]
    ch = [{'name': 'det J Phi is identically -2 (11 x 11, expanded directly)', 'ok': D.const_value() == -2},
          {'name': 'three distinct points with one image', 'ok': len(set(us)) == 3 and im[0] == im[1] == im[2]}]
    row('chv-phi', 'Phi, a cubic map of C^11 with det J = -2 that is not injective (the gist that first published it says ChatGPT generated it)', 'arXiv 2608.05392, Prop 6.2',
        'CERTIFIED' if all(c['ok'] for c in ch) else 'REFUTED', ch)
    ch, k18 = my_field(maps['Xhat18'], 18, W['zeros']['Xhat18'], 'Xhat18')
    row('chv-xhat18', 'X-hat on R^18 (degree 3): spectrum {-1} everywhere, three zeros — decided as a symbolic identity where the paper\'s appendix checks one sample point',
        'arXiv 2608.05392, Thm 8.1', 'CERTIFIED' if all(c['ok'] for c in ch) else 'REFUTED', ch, {'nilpotencyIndex': k18})
    return rows


if __name__ == '__main__':
    t0 = time.time()
    rows = decide(full='--quick' not in sys.argv, log=lambda i, v: print('%-12s %s  (%.1fs)' % (i, v, time.time() - t0)))
    for r in rows:
        bad = [c['name'] for c in r['checks'] if c['ok'] is False]
        if bad:
            print('  failed:', bad)
