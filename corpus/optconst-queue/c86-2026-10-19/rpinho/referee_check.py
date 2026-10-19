#!/usr/bin/env python3
"""Independent checker for the C86 certificate (Schur-Siegel-Smyth trace problem).

Written independently of the code that produced the certificate. Uses exact rationals (fractions,
flint.fmpq), sympy for exact algebra (irreducibility, real-root counts, rational root isolation),
and flint.arb ball arithmetic for every transcendental quantity.

Statement checked (see README.md for why these conditions imply the bound):
  Let mu = sum_i d_i 1_[e_i, e_{i+1}] dx (piecewise-constant density), m = mu(R), and b_Q >= 0.
  (E1) d_i >= 0, e_i increasing, supp mu subset of [eps, inf) with eps > 0.
  (E2) every Q in A is in Z[x], irreducible, all roots real; Q's pairwise non-associate.
  (E3) sum_Q b_Q deg Q < m                    (condition at infinity after normalising by m).
  (E4) int log|Q| dmu >= 0 for each Q in A    (arb, closed form).
  (E5) f(x) := U_mu(x) - sum_Q b_Q log|Q(x)| >= 0 for every x in supp mu (closure of cells with d_i>0),
       proved on the whole set by adaptive bisection with rigorous lower bounds (arb).
  (E6) exact trace/mass equals the claimed bound and is <= 1.8117251.
Usage: python -I referee_check.py CERT.json [workers]
"""
import json, sys, time
from fractions import Fraction as Fr
from multiprocessing import Pool

import flint
from flint import arb, fmpq
import sympy as sp

PREC = 128
flint.ctx.prec = PREC
X_ = sp.Symbol('x')


def q2f(fr):
    return fmpq(fr.numerator, fr.denominator)


def G_arb(u):
    """G(u) = u log|u| - u, G(0) = 0. u: arb ball. Refuses balls that straddle 0 non-exactly."""
    if u.is_zero():
        return arb(0)
    if u.contains(0):
        raise ValueError("G evaluated on a ball containing 0")
    return u * abs(u).log() - u


# ---------------------------------------------------------------- load + exact checks
def load(path):
    c = json.load(open(path))
    E = [Fr(x) for x in c['edges']]
    D = [Fr(x) for x in c['densities']]
    Bq = [Fr(x) for x in c['b']]
    A = [[int(a) for a in q] for q in c['A']]
    return c, E, D, Bq, A


def exact_checks(c, E, D, Bq, A, report):
    assert len(E) == len(D) + 1
    assert all(E[i] < E[i + 1] for i in range(len(D))), "edges not increasing"
    assert all(d >= 0 for d in D), "negative density"
    assert all(b >= 0 for b in Bq), "negative b_Q"
    nz = [i for i, d in enumerate(D) if d > 0]
    report['support_min'] = str(E[nz[0]])
    report['support_max'] = str(E[nz[-1] + 1])
    assert E[nz[0]] > 0, "support touches 0: total positivity of the approximating integers not guaranteed"
    m = sum(D[i] * (E[i + 1] - E[i]) for i in nz)
    T = sum(D[i] * (E[i + 1] ** 2 - E[i] ** 2) / 2 for i in nz)
    bound = T / m
    report['mass'] = str(m)
    report['trace'] = str(T)
    report['bound_exact'] = str(bound)
    report['bound_decimal'] = float(bound)
    report['bound_matches_claim'] = (bound == Fr(c['bound']))
    report['bound_le_1.8117251'] = bound <= Fr('1.8117251')
    sbd = sum(b * (len(q) - 1) for b, q in zip(Bq, A))
    report['sum_b_deg_over_mass'] = float(sbd / m)
    assert sbd < m, "condition at infinity fails"
    # algebra of A
    polys = []
    for q in A:
        P = sp.Poly(list(reversed(q)), X_, domain='ZZ')
        cont, facs = P.factor_list()
        irreducible = (abs(cont) == 1 and len(facs) == 1 and facs[0][1] == 1)
        nreal = P.count_roots()  # exact Sturm count, with multiplicity
        polys.append(P)
        report.setdefault('A_checks', []).append(
            dict(Q=str(P.as_expr()), irreducible=irreducible, deg=P.degree(), real_roots=nreal,
                 lc=int(P.LC())))
        assert irreducible, f"{q} reducible"
        assert nreal == P.degree(), f"{q} has non-real roots"
    for i in range(len(polys)):
        for j in range(i):
            assert sp.gcd(polys[i], polys[j]).degree() == 0, "A has associated/overlapping members"
    return nz, m, T, polys


def root_balls(P):
    """Rigorous real root balls from sympy exact isolating intervals refined to 1e-35."""
    out = []
    for (a, b), mult in P.intervals(eps=sp.Rational(1, 10 ** 35)):
        assert mult == 1
        a, b = Fr(int(a.p), int(a.q)), Fr(int(b.p), int(b.q))
        if a == b:
            out.append((arb(q2f(a)), a))  # exact rational root
        else:
            out.append((arb(q2f(a)).union(arb(q2f(b))), None))
    return out


# ---------------------------------------------------------------- (E4) arithmetic constraints
def check_E4(E, D, nz, m, polys, report):
    res = []
    for P in polys:
        roots = root_balls(P)
        tot = arb(q2f(m)) * arb(abs(int(P.LC()))).log()
        for i in nz:
            di = arb(q2f(D[i]))
            for rb, rex in roots:
                if rex is not None:
                    u1, u0 = arb(q2f(E[i + 1] - rex)), arb(q2f(E[i] - rex))
                else:
                    u1, u0 = arb(q2f(E[i + 1])) - rb, arb(q2f(E[i])) - rb
                tot += di * (G_arb(u1) - G_arb(u0))
        res.append((str(P.as_expr()), tot.lower(), tot.upper(), bool(tot > 0)))
    report['E4'] = [dict(Q=r[0], lower=float(r[1]), upper=float(r[2]), positive=r[3]) for r in res]
    return all(r[3] for r in res)


# ---------------------------------------------------------------- (E5) potential inequality
_S = {}


def _init(E, D, Bq, polys_coeffs):
    flint.ctx.prec = PREC
    Dp = [Fr(0)] + D + [Fr(0)]
    jumps = [(E[j], Dp[j + 1] - Dp[j]) for j in range(len(E)) if Dp[j + 1] != Dp[j]]
    _S['ej'] = [e for e, _ in jumps]
    _S['ej_a'] = [arb(q2f(e)) for e, _ in jumps]
    _S['cj_a'] = [arb(q2f(cc)) for _, cc in jumps]
    _S['cj'] = [cc for _, cc in jumps]
    rts = []  # (b_arb, root_ball, root_lower_frac, root_upper_frac)
    const = arb(0)
    for b, q in zip(Bq, polys_coeffs):
        P = sp.Poly(list(reversed(q)), X_, domain='ZZ')
        bA = arb(q2f(b))
        const += bA * arb(abs(int(P.LC()))).log()
        for (a, bb), mult in P.intervals(eps=sp.Rational(1, 10 ** 35)):
            a, bb = Fr(int(a.p), int(a.q)), Fr(int(bb.p), int(bb.q))
            rts.append((bA, arb(q2f(a)).union(arb(q2f(bb))), a, bb))
    _S['rts'] = rts
    _S['const'] = const


def lower_bound(s, t):
    """Rigorous lower bound for f on [s, t] (s<t rationals, [s,t] inside one grid cell)."""
    w = t - s
    mid = (s + t) / 2
    M = arb(q2f(mid))
    X = arb(q2f(s)).union(arb(q2f(t)))
    half = arb(q2f(w / 2))
    f_m = -_S['const']          # value of regular part at midpoint
    fp = arb(0)                 # derivative of regular part over X
    near = arb(0)               # rigorous lower bounds of singular (near) terms
    for e, ea, ca, cc in zip(_S['ej'], _S['ej_a'], _S['cj_a'], _S['cj']):
        if (e - t) < w and (s - e) < w:            # edge within distance w of [s,t]: near
            u1, u2 = s - e, t - e                  # |u| <= 2w << 1 so G is decreasing on [u1,u2]
            g_lo = G_arb(arb(q2f(u2))) if u2 != 0 else arb(0)
            g_hi = G_arb(arb(q2f(u1))) if u1 != 0 else arb(0)
            near += (ca * g_lo).lower() if cc > 0 else (ca * g_hi).lower()
            continue
        f_m += ca * G_arb(M - ea)
        fp += ca * abs(X - ea).log()
    for bA, rb, ra, rbb in _S['rts']:
        if (ra - t) < w and (s - rbb) < w:          # root near: -b log|x-r| >= -b log(max|x-r|)
            far = max(abs(t - ra), abs(rbb - s), abs(t - rbb), abs(ra - s))
            near += (-bA * arb(q2f(far)).log()).lower()
            continue
        f_m -= bA * abs(M - rb).log()
        fp -= bA / (X - rb)
    lb = f_m.lower() - (abs(fp) * half).upper()
    return arb(lb) + arb(near)


def f_point(x):
    """Rigorous ball for f at a rational point x (used to certify COUNTEREXAMPLES)."""
    X = arb(q2f(x))
    v = -_S['const']
    for e, ca in zip(_S['ej'], _S['cj_a']):
        if x != e:
            v += ca * G_arb(arb(q2f(x - e)))
    for bA, rb, ra, rbb in _S['rts']:
        if ra <= x <= rbb:
            return arb('inf')
        v -= bA * abs(X - rb).log()
    return v


def check_cell(args):
    a, b, init_split, maxdepth = args
    budget = 200000
    stack = [(a + (b - a) * k / init_split, a + (b - a) * (k + 1) / init_split, 0) for k in range(init_split)]
    n_ok, minlb, worst_depth = 0, None, 0
    fails = []
    while stack:
        s, t, dep = stack.pop()
        budget -= 1
        if budget < 0:
            fails.append(('budget exhausted', float(s), float(t)))
            break
        lb = lower_bound(s, t)
        if lb > 0:
            n_ok += 1
            v = float(lb.lower())
            minlb = v if minlb is None else min(minlb, v)
            worst_depth = max(worst_depth, dep)
        elif dep >= maxdepth:
            fails.append((float(s), float(t), float(lb.lower())))
        elif f_point((s + t) / 2) < 0:
            v = f_point((s + t) / 2)
            fails.append(('COUNTEREXAMPLE f(x)<0 at x', str((s + t) / 2), float(v.upper())))
            break
        else:
            mm = (s + t) / 2
            stack += [(s, mm, dep + 1), (mm, t, dep + 1)]
    return (float(a), float(b), n_ok, minlb, worst_depth, fails)


def main():
    if not __debug__:
        sys.exit("refusing to run under python -O: the exact checks (E1-E3) are asserts")
    path = sys.argv[1]
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else 4
    t0 = time.time()
    report = {'certificate': path}
    c, E, D, Bq, A = load(path)
    nz, m, T, polys = exact_checks(c, E, D, Bq, A, report)
    print('exact checks ok', json.dumps({k: report[k] for k in report if k != 'A_checks'}, indent=1))
    for row in report['A_checks']:
        print('  ', row)
    ok4 = check_E4(E, D, nz, m, polys, report)
    for row in report['E4']:
        print('  E4', row)
    print('E4 ok' if ok4 else 'E4 FAILED')
    tasks = [(E[i], E[i + 1], 8, 40) for i in nz]
    with Pool(workers, initializer=_init, initargs=(E, D, Bq, A)) as pool:
        out = pool.map(check_cell, tasks, chunksize=4)
    fails = [f for o in out for f in o[5]]
    n_sub = sum(o[2] for o in out)
    minlb = min(o[3] for o in out if o[3] is not None)
    report['E5'] = dict(cells=len(tasks), subintervals_proved=n_sub, min_certified_lower_bound=minlb,
                        max_depth=max(o[4] for o in out), failures=fails[:20], n_failures=len(fails))
    print('E5', report['E5'])
    report['ALL_OK'] = bool(ok4 and not fails and report['bound_matches_claim'] and report['bound_le_1.8117251'])
    report['seconds'] = time.time() - t0
    print('ALL_OK', report['ALL_OK'], 'time', report['seconds'])
    json.dump(report, open(path.split('/')[-1].replace('.json', '') + '.referee_report.json', 'w'), indent=1,
              default=str)
    sys.exit(0 if report['ALL_OK'] else 1)


if __name__ == '__main__':
    main()
