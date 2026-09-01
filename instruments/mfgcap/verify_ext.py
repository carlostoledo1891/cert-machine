#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""verify_ext.py — the LIVING, PARAMETERIZED extension of the frozen congestion-MFG
verifier (reports/verify_congest.py) to arbitrary instances and to potentials with
second- and third-harmonic data terms:

    V(x) = A1 cos 2pi x + A2 cos 4pi x + A3 cos 6pi x

WHY TWO FILES EXIST (the one-module rule, honored the only way it can be here).
reports/verify_congest.py is NOT an editable module: it is re-EXTRACTED at every
build from the byte-preserved published page (legacy/research/mfg-congest/
mfg-congest.html) by tools/build-report-mfg-congest.js — editing it is both futile
(the build overwrites it) and forbidden (it is the referee artifact of a sent page).
So this file IMPORTS the frozen module and reuses its arithmetic core verbatim —
outward-rounded intervals, nu-weighted convolution and norm, the Jacobian rows
dRow/dRowOdd (data terms never appear in derivatives), the radii polynomial,
positivity certification, the float witnesses — and reimplements ONLY what the
frozen file hard-wires to its embedded N=14 instance: make_seqs (global N),
buildPhi (single-harmonic data term), and validate (global N/sigma/A/gamma).
The anti-divergence mechanism is the battery: on the frozen file's own embedded
instance, validate_g must reproduce the frozen validate() BIT-FOR-BIT (same
Y0/Z1/Z2/r floats), and buildPhi_ext with A2=A3=0 must equal the frozen buildPhi
elementwise as exact interval tuples. A reimplementation that drifts fails red.

WHAT IS NEW, precisely: three guarded lines in buildPhi_ext (the A2/A3 data
constants at modes k=2 and k=3 of the HJB residual — V's cosine coefficient A_k
enters H_k as A_k/2 under the f0 + sum 2 f_k cos convention), a stdlib
Gauss-Jordan builder for the approximate inverses A (even and odd blocks) so
that candidate records which store only coefficients can be certified, and a
Y0-only fast path for the mutation falsifiers. The approximate inverse is only
ever a CANDIDATE for a contraction: every bound is recomputed rigorously from
it, so its provenance (embedded certificate data in the frozen file, Gaussian
elimination here) cannot affect soundness — a bad A fails Z1 < 1, it cannot
fake a proof.

SPDX-License-Identifier: MIT
Copyright (c) 2026 Carlos Toledo
"""
import importlib.util
import math
import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_FROZEN = os.path.join(_ROOT, 'reports', 'verify_congest.py')

_spec = importlib.util.spec_from_file_location('verify_congest_frozen', _FROZEN)
vc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(vc)

# the arithmetic core, reused verbatim (all N-independent)
iv, add, sub, mul, div, neg = vc.iv, vc.add, vc.sub, vc.mul, vc.div, vc.neg
iabs, mag, mid, width = vc.iabs, vc.mag, vc.mid, vc.width
ZERO, ONE, EVEN, ODD = vc.ZERO, vc.ONE, vc.EVEN, vc.ODD
conv, normNu, sget = vc.conv, vc.normNu, vc.sget
og, eg, ev2, colent = vc.og, vc.eg, vc.ev2, vc.colent
dRow, dRowOdd, oWgtOdd = vc.dRow, vc.dRowOdd, vc.oWgtOdd
radiiPolynomial, certify_pos = vc.radiiPolynomial, vc.certify_pos
reciprocalW_py = vc.reciprocalW_py
ev_series, d1_series, d2_series = vc.ev_series, vc.d1_series, vc.d2_series
nextUp, nextDown = vc.nextUp, vc.nextDown
TWO_PI, INF, EPS = vc.TWO_PI, vc.INF, vc.EPS


# ============================================================================================
# 1.  candidate sequences at arbitrary N  (the frozen make_seqs reads its module-global N)
# ============================================================================================
def make_seqs_g(pfac, a_coef, m_coef, w_coef, N):
    abar = [iv(a_coef[k]) for k in range(N + 1)]
    mbar = [iv(m_coef[k]) for k in range(N + 1)]
    wI = [iv(w_coef[k]) for k in range(N + 1)]
    pbar = [ZERO] * (N + 1)
    for k in range(1, N + 1):
        pbar[k] = iv(TWO_PI * k * a_coef[k])
    pp = conv(pbar, pbar, 2 * N, pfac, pfac)
    pw = conv(pbar, wI, 2 * N, pfac, EVEN)
    ss = conv(mbar, wI, 2 * N, EVEN, EVEN)
    ww = conv(wI, wI, 2 * N, EVEN, EVEN)
    mp = conv(mbar, pbar, 2 * N, EVEN, pfac)
    return {'a': abar, 'p': pbar, 'm': mbar, 'w': wI,
            'pp': pp, 'pw': pw, 's': ss, 'ww': ww, 'mp': mp, 'wp': pw}


# ============================================================================================
# 2.  the residual with A2/A3 data terms.  V's k-th cosine coefficient enters H_k as A_k/2
#     (storage convention f(x) = f_0 + sum 2 f_k cos 2pi k x).  Derivative rows carry no data
#     term, so dRow/dRowOdd are the frozen ones untouched.  The A2/A3 branches are guarded on
#     nonzero so that A2 = A3 = 0 reproduces the frozen buildPhi ARITHMETIC EXACTLY (interval
#     sub by [0,0] still widens by one ulp — a guard is the only way to keep bit equality).
# ============================================================================================
def _amp(P, key):
    if key in P:
        return P[key]
    if key == 'A1':
        return P.get('A', 0.0)
    return 0.0


def buildPhi_ext(s, P, K):
    sigma = P['sigma']
    gamma = P['gamma']
    A1 = _amp(P, 'A1')
    A2 = _amp(P, 'A2')
    A3 = _amp(P, 'A3')
    gI = iv(gamma)
    halfA1 = iv(0.5 * A1)
    halfA2 = iv(0.5 * A2)
    halfA3 = iv(0.5 * A3)
    ppw = conv(s['pp'], s['w'], K, EVEN, EVEN)
    sp = conv(s['s'], s['p'], K, EVEN, ODD)
    mww = conv(s['s'], s['w'], K, EVEN, EVEN)
    H = [None] * (K + 1)
    F = [None] * (K + 1)
    Rc = [None] * (K + 1)
    H[0] = sub(sub(s['a'][0], mul(iv(0.5), ppw[0])), mul(gI, eg(s['m'], 0)))
    F[0] = sub(eg(s['m'], 0), ONE)
    Rc[0] = sub(mww[0], ONE)
    for k in range(1, K + 1):
        lam = TWO_PI * k
        h = mul(iv(1 + sigma * lam * lam), eg(s['a'], k))
        h = sub(h, mul(iv(0.5), ppw[k]))
        if k == 1:
            h = sub(h, halfA1)
        if k == 2 and A2 != 0:
            h = sub(h, halfA2)
        if k == 3 and A3 != 0:
            h = sub(h, halfA3)
        h = sub(h, mul(gI, eg(s['m'], k)))
        H[k] = h
        diag = add(div(ONE, iv(lam)), iv(sigma * lam))
        F[k] = add(mul(diag, eg(s['m'], k)), og(sp, k))
        Rc[k] = mww[k]
    return {'H': H, 'F': F, 'R': Rc}


# ============================================================================================
# 3.  stdlib approximate inverses.  The finite Galerkin Jacobian at x_bar (midpoints of the
#     frozen dRow/dRowOdd interval entries) is inverted by Gauss-Jordan with partial pivoting.
#     Soundness does not depend on this: A is consumed by validate_g exactly as the frozen
#     verifier consumes its embedded A, and every bound is recomputed rigorously from it.
# ============================================================================================
def gauss_inverse(J):
    n = len(J)
    M = [row[:] + [1.0 if i == j else 0.0 for j in range(n)] for i, row in enumerate(J)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        if M[p][c] == 0.0:
            raise ArithmeticError('finite Jacobian is numerically singular at column %d' % c)
        if p != c:
            M[c], M[p] = M[p], M[c]
        piv = M[c][c]
        row = M[c]
        for j in range(c, 2 * n):
            row[j] /= piv
        for r in range(n):
            if r == c:
                continue
            f = M[r][c]
            if f == 0.0:
                continue
            rr = M[r]
            for j in range(c, 2 * n):
                rr[j] -= f * row[j]
    return [M[i][c + n] for i in range(n) for c in range(n)]


def build_inverses(s, P, N):
    """Approximate inverses of the finite even (3N+3) and odd (3N) Jacobian blocks,
       row-major flat, from midpoints of the rigorous dRow/dRowOdd rows at x_bar."""
    rowsH = [dRow('H', k, s, P, N) for k in range(N + 1)]
    rowsF = [dRow('F', k, s, P, N) for k in range(N + 1)]
    rowsR = [dRow('R', k, s, P, N) for k in range(N + 1)]
    n = 3 * N + 3
    cols = [('a0', 0)] + [('p', m) for m in range(1, N + 1)] \
        + [('m', m) for m in range(N + 1)] + [('w', m) for m in range(N + 1)]
    rows = [rowsH[0]] + [rowsH[k] for k in range(1, N + 1)] \
        + [rowsF[k] for k in range(N + 1)] + [rowsR[k] for k in range(N + 1)]
    J = [[mid(colent(rows[i], kind, m)) for (kind, m) in cols] for i in range(n)]
    AN = gauss_inverse(J)

    rowsHo = [dRowOdd('H', k, s, P, N) for k in range(N + 1)]
    rowsFo = [dRowOdd('F', k, s, P, N) for k in range(N + 1)]
    rowsRo = [dRowOdd('R', k, s, P, N) for k in range(N + 1)]
    nOdd = 3 * N
    colsO = [('p', m) for m in range(1, N + 1)] \
        + [('m', m) for m in range(1, N + 1)] + [('w', m) for m in range(1, N + 1)]
    rowsO = [rowsHo[k] for k in range(1, N + 1)] \
        + [rowsFo[k] for k in range(1, N + 1)] + [rowsRo[k] for k in range(1, N + 1)]
    Jo = [[mid(rowsO[i][kind][m]) for (kind, m) in colsO] for i in range(nOdd)]
    AN_ODD = gauss_inverse(Jo)
    return AN, AN_ODD


# ============================================================================================
# 4.  the validation at arbitrary instance — a faithful transcription of the frozen
#     validate() with module globals (N, SIGMA, A_PARAM, GAMMA) replaced by parameters and
#     buildPhi replaced by buildPhi_ext.  Structure, order of operations and every constant
#     kept identical so the battery's bit-equality calibration on the embedded N=14 instance
#     has teeth.
# ============================================================================================
def validate_g(a_coef, m_coef, w_coef, AN, AN_ODD, P, opts=None):
    opts = opts or {}
    N = P['N']
    nu = opts.get('nu', P.get('nu', 1.05))
    sigma = P['sigma']
    gamma = P['gamma']
    KC = max(opts.get('KC', 3 * N), 3 * N)
    KR = KC + 2 * N
    rCap = opts.get('rCap', 1e-2)
    n = 3 * N + 3
    idxA0 = 0

    def idxP(k):
        return k

    def idxM(k):
        return N + 1 + k

    def idxW(k):
        return 2 * N + 2 + k

    def finW(i):
        if i == 0:
            return 1.0
        if i <= N:
            return 2 * nu ** i
        if i <= 2 * N + 1:
            k = i - (N + 1)
            return 1.0 if k == 0 else 2 * nu ** k
        k = i - (2 * N + 2)
        return 1.0 if k == 0 else 2 * nu ** k

    s = make_seqs_g(ODD, a_coef, m_coef, w_coef, N)
    pbar = s['p']
    mbar = s['m']
    wbarI = s['w']
    normP = normNu(pbar, nu, False)
    normM = normNu(mbar, nu, True)
    normW = normNu(wbarI, nu, True)
    normPW = normNu(s['pw'], nu, False)
    normS = normNu(s['s'], nu, True)
    normWW = normNu(s['ww'], nu, True)
    normPP = normNu(s['pp'], nu, True)
    normMP = normNu(s['mp'], nu, False)
    s0 = s['s'][0]
    s0mid = 0.5 * (s0[0] + s0[1])
    if not (s0mid > 0):
        return {'ok': False, 'why': 's_bar_0 = mean sqrt m not positive - off the physical branch'}
    tailRecipInv = iv(1.0 / (2 * s0mid))

    def tailHF(k):
        lam = TWO_PI * k
        d = 1 / lam + sigma * lam
        return iv(1.0 / d)

    # -------- Y0 = || A Phi(x_bar) ||_nu --------
    Phi = buildPhi_ext(s, P, 3 * N)
    rvec = [ZERO] * n
    rvec[idxA0] = Phi['H'][0]
    for k in range(1, N + 1):
        rvec[idxP(k)] = Phi['H'][k]
    for k in range(0, N + 1):
        rvec[idxM(k)] = Phi['F'][k]
        rvec[idxW(k)] = Phi['R'][k]
    acc = ZERO
    for i in range(n):
        a = ZERO
        base = i * n
        for j in range(n):
            a = add(a, mul(iv(AN[base + j]), rvec[j]))
        acc = add(acc, mul(iv(finW(i)), iabs(a)))
    for k in range(N + 1, 3 * N + 1):
        w = iv(2 * nu ** k)
        acc = add(acc, mul(w, iabs(mul(tailHF(k), Phi['H'][k]))))
        acc = add(acc, mul(w, iabs(mul(tailHF(k), Phi['F'][k]))))
        acc = add(acc, mul(w, iabs(mul(tailRecipInv, Phi['R'][k]))))
    Y0 = acc

    # -------- Z1 = || I - A DPhi(x_bar) || (max over weighted columns) --------
    Z1 = ZERO
    worstCol = None
    rowsH = []
    rowsF = []
    rowsR = []
    for k in range(KR + 1):
        rowsH.append(dRow('H', k, s, P, KC))
        rowsF.append(dRow('F', k, s, P, KC))
        rowsR.append(dRow('R', k, s, P, KC))

    def colNorm(kind, m):
        fin = [ZERO] * n
        fin[idxA0] = colent(rowsH[0], kind, m)
        for k in range(1, N + 1):
            fin[idxP(k)] = colent(rowsH[k], kind, m)
        for k in range(0, N + 1):
            fin[idxM(k)] = colent(rowsF[k], kind, m)
            fin[idxW(k)] = colent(rowsR[k], kind, m)
        out = [ZERO] * n
        for i in range(n):
            a = ZERO
            base = i * n
            for j in range(n):
                a = add(a, mul(iv(AN[base + j]), fin[j]))
            out[i] = a
        if kind == 'a0':
            jIdx = idxA0
        elif kind == 'p':
            jIdx = idxP(m) if m <= N else -1
        elif kind == 'm':
            jIdx = idxM(m) if m <= N else -1
        else:
            jIdx = idxW(m) if m <= N else -1
        acc2 = ZERO
        for i in range(n):
            e = ONE if i == jIdx else ZERO
            acc2 = add(acc2, mul(iv(finW(i)), iabs(sub(e, out[i]))))
        for k in range(N + 1, KR + 1):
            w = iv(2 * nu ** k)
            eH = ONE if (kind == 'p' and m == k) else ZERO
            eF = ONE if (kind == 'm' and m == k) else ZERO
            eR = ONE if (kind == 'w' and m == k) else ZERO
            acc2 = add(acc2, mul(w, iabs(sub(eH, mul(tailHF(k), colent(rowsH[k], kind, m))))))
            acc2 = add(acc2, mul(w, iabs(sub(eF, mul(tailHF(k), colent(rowsF[k], kind, m))))))
            acc2 = add(acc2, mul(w, iabs(sub(eR, mul(tailRecipInv, colent(rowsR[k], kind, m))))))
        wj = 1.0 if kind == 'a0' else (1.0 if m == 0 else 2 * nu ** m)
        return div(acc2, iv(wj))

    cand = [('a0', 0)]
    for m in range(1, KC + 1):
        cand.append(('p', m))
    for m in range(0, KC + 1):
        cand.append(('m', m))
        cand.append(('w', m))
    for (kind, m) in cand:
        v = colNorm(kind, m)
        if v[1] > mag(Z1):
            Z1 = v
            worstCol = kind + '_' + str(m)

    # analytic uniform tail bound (columns m > KC)
    lamN1 = TWO_PI * (N + 1)
    denomLoGrow = nextDown(1 / lamN1 + sigma * lamN1)
    denomRecip = nextDown(2 * s0mid)
    g = gamma
    cP = nextUp((mag(normPW) + mag(normS)) / denomLoGrow)
    cMgrow = nextUp((g + mag(normPW)) / denomLoGrow)
    cMrecip = nextUp(mag(normWW) / denomRecip)
    cWgrow = nextUp((0.5 * mag(normPP) + mag(normMP)) / denomLoGrow)
    sOff = nextUp(2 * max(0.0, mag(normS) - s0[0]))
    cWrecip = nextUp(sOff / denomRecip)
    epsId = 8 * EPS + width(s0) / s0mid
    analytic = max(cP + epsId, cMgrow + cMrecip + epsId, cWgrow + cWrecip + epsId)
    if math.isnan(analytic) or math.isinf(analytic):
        raise ArithmeticError('analytic Z1 tail bound is not finite')
    analyticInfo = {'mP': cP + epsId, 'mM': cMgrow + cMrecip + epsId, 'mW': cWgrow + cWrecip + epsId,
                    'epsId': epsId, 'cP': cP, 'cMgrow': cMgrow, 'cMrecip': cMrecip,
                    'cWgrow': cWgrow, 'cWrecip': cWrecip}
    if analytic > mag(Z1):
        Z1 = iv(analytic)
        worstCol = 'tail(analytic)'

    # -------- Z1_odd (full-space uniqueness; see the frozen file's Stage 2.2 notes) --------
    nOdd = 3 * N
    if len(AN_ODD) != nOdd * nOdd:
        return {'ok': False, 'why': 'odd-block approximate inverse absent or wrong size - '
                                    'refusing rather than certifying the even block alone'}

    def oP(k):
        return k - 1

    def oM(k):
        return N + k - 1

    def oW(k):
        return 2 * N + k - 1

    def oWgt(i):
        return oWgtOdd(i, N, nu)

    anormOdd = 0.0
    for j in range(nOdd):
        ss2 = 0.0
        for i in range(nOdd):
            ss2 = nextUp(ss2 + oWgt(i) * abs(AN_ODD[i * nOdd + j]))
        v = nextUp(ss2 / oWgt(j))
        if v > anormOdd:
            anormOdd = v

    rowsHo = []
    rowsFo = []
    rowsRo = []
    for k in range(KR + 1):
        rowsHo.append(dRowOdd('H', k, s, P, KC))
        rowsFo.append(dRowOdd('F', k, s, P, KC))
        rowsRo.append(dRowOdd('R', k, s, P, KC))

    def colNormO(kind, m):
        fin = [ZERO] * nOdd
        for k in range(1, N + 1):
            fin[oP(k)] = rowsHo[k][kind][m]
            fin[oM(k)] = rowsFo[k][kind][m]
            fin[oW(k)] = rowsRo[k][kind][m]
        out = [ZERO] * nOdd
        for i in range(nOdd):
            a = ZERO
            base = i * nOdd
            for j in range(nOdd):
                a = add(a, mul(iv(AN_ODD[base + j]), fin[j]))
            out[i] = a
        if kind == 'p':
            jIdx = oP(m) if m <= N else -1
        elif kind == 'm':
            jIdx = oM(m) if m <= N else -1
        else:
            jIdx = oW(m) if m <= N else -1
        acc2 = ZERO
        for i in range(nOdd):
            e = ONE if i == jIdx else ZERO
            acc2 = add(acc2, mul(iv(oWgt(i)), iabs(sub(e, out[i]))))
        for k in range(N + 1, KR + 1):
            w = iv(2 * nu ** k)
            eH = ONE if (kind == 'p' and m == k) else ZERO
            eF = ONE if (kind == 'm' and m == k) else ZERO
            eR = ONE if (kind == 'w' and m == k) else ZERO
            acc2 = add(acc2, mul(w, iabs(sub(eH, mul(tailHF(k), rowsHo[k][kind][m])))))
            acc2 = add(acc2, mul(w, iabs(sub(eF, mul(tailHF(k), rowsFo[k][kind][m])))))
            acc2 = add(acc2, mul(w, iabs(sub(eR, mul(tailRecipInv, rowsRo[k][kind][m])))))
        return div(acc2, iv(2 * nu ** m))

    Z1odd = ZERO
    worstColOdd = None
    for m in range(1, KC + 1):
        for kind in ('p', 'm', 'w'):
            v = colNormO(kind, m)
            if v[1] > mag(Z1odd):
                Z1odd = v
                worstColOdd = kind + '_' + str(m)
    analyticO = max(analyticInfo['mP'], analyticInfo['mM'], analyticInfo['mW'])
    if math.isnan(analyticO) or math.isinf(analyticO):
        raise ArithmeticError('analytic Z1_odd tail bound is not finite')
    if analyticO > mag(Z1odd):
        Z1odd = iv(analyticO)
        worstColOdd = 'tail(analytic)'

    Z1even = Z1
    worstColEven = worstCol
    if mag(Z1odd) > mag(Z1even):
        Z1 = Z1odd
        worstCol = 'odd:' + str(worstColOdd)
    else:
        Z1 = Z1even
        worstCol = worstColEven

    # -------- Z2: uniform Lipschitz of x -> A DPhi(x) on B_rCap(x_bar) --------
    anorm = 0.0
    for j in range(n):
        ss2 = 0.0
        for i in range(n):
            ss2 = nextUp(ss2 + finW(i) * abs(AN[i * n + j]))
        v = nextUp(ss2 / finW(j))
        if v > anorm:
            anorm = v
    tailGrow = 1 / (1 / lamN1 + sigma * lamN1)
    Aopnorm = max(anorm, anormOdd, tailGrow, 1 / (2 * s0mid))
    D2 = add(add(add(normW, mul(iv(2), normP)),
                 mul(iv(2), add(add(normP, normW), normM))),
             add(mul(iv(2), normM), mul(iv(4), normW)))
    D3 = iv(15)
    factor = add(D2, mul(mul(iv(0.5), D3), iv(rCap)))
    Z2 = mul(iv(Aopnorm), factor)

    # -------- radii polynomial --------
    y0 = mag(Y0)
    z1 = mag(Z1)
    z2 = mag(Z2)
    res = {'N': N, 'nu': nu, 'KC': KC, 'KR': KR, 'sigma': sigma,
           'A1': _amp(P, 'A1'), 'A2': _amp(P, 'A2'), 'A3': _amp(P, 'A3'), 'gamma': gamma,
           'rCap': rCap, 'Y0': y0, 'Z1': z1, 'Z2': z2, 'worstCol': worstCol,
           'Z1even': mag(Z1even), 'Z1odd': mag(Z1odd),
           'worstColEven': worstColEven, 'worstColOdd': worstColOdd,
           'Aopnorm': Aopnorm, 's0': s0mid, 'analytic': analyticInfo}
    rp = radiiPolynomial(Y0, Z1, Z2)
    if not rp['ok']:
        res.update(ok=False, why=rp['why'], disc=rp.get('disc'), rMin=rp.get('rMin'), rMax=rp.get('rMax'))
        return res
    if not (rp['r'] <= rCap):
        res.update(ok=False, why='certified radius exceeds rCap', r=rp['r'],
                   rMin=rp['rMin'], rMax=rp['rMax'], disc=rp['disc'])
        return res

    wPosBallR = opts['wPosR'] if opts.get('wPosR') is not None else rp['r']
    wpos = certify_pos(w_coef, N, wPosBallR, opts.get('wG'))
    if not wpos['positive']:
        res.update(ok=False, why='w-series not certified positive over the ball',
                   r=rp['r'], rMin=rp['rMin'], rMax=rp['rMax'], disc=rp['disc'],
                   minWbar=wpos['minBar'], minW=wpos['minBall'])
        return res
    res.update(ok=True, r=rp['r'], rMin=rp['rMin'], rMax=rp['rMax'], disc=rp['disc'], pAtR=rp['pAtR'],
               closureMargin=(1 - z1) * (1 - z1) / (2 * z2), minWbar=wpos['minBar'], minW=wpos['minBall'])
    return res


# ============================================================================================
# 5.  Y0-only fast path — for the mutation falsifiers, whose job is to show the residual
#     EXPLODES under the mutation.  Refusal is then decided by the radii polynomial with the
#     good run's Z1 and Z2 (stated as such wherever it is used: the mutated Y0 alone already
#     kills the discriminant by six-plus orders of magnitude).
# ============================================================================================
def y0_only(a_coef, m_coef, w_coef, AN, P, nu):
    N = P['N']
    n = 3 * N + 3
    s = make_seqs_g(ODD, a_coef, m_coef, w_coef, N)
    return _y0_from_seqs(s, AN, P, nu)


def _y0_from_seqs(s, AN, P, nu):
    N = P['N']
    sigma = P['sigma']
    n = 3 * N + 3
    s0 = s['s'][0]
    s0mid = 0.5 * (s0[0] + s0[1])
    if not (s0mid > 0):
        return INF
    tailRecipInv = iv(1.0 / (2 * s0mid))

    def tailHF(k):
        lam = TWO_PI * k
        return iv(1.0 / (1 / lam + sigma * lam))

    Phi = buildPhi_ext(s, P, 3 * N)
    rvec = [ZERO] * n
    rvec[0] = Phi['H'][0]
    for k in range(1, N + 1):
        rvec[k] = Phi['H'][k]
    for k in range(0, N + 1):
        rvec[N + 1 + k] = Phi['F'][k]
        rvec[2 * N + 2 + k] = Phi['R'][k]

    def finW(i):
        if i == 0:
            return 1.0
        if i <= N:
            return 2 * nu ** i
        if i <= 2 * N + 1:
            k = i - (N + 1)
            return 1.0 if k == 0 else 2 * nu ** k
        k = i - (2 * N + 2)
        return 1.0 if k == 0 else 2 * nu ** k

    acc = ZERO
    for i in range(n):
        a = ZERO
        base = i * n
        for j in range(n):
            a = add(a, mul(iv(AN[base + j]), rvec[j]))
        acc = add(acc, mul(iv(finW(i)), iabs(a)))
    for k in range(N + 1, 3 * N + 1):
        w = iv(2 * nu ** k)
        acc = add(acc, mul(w, iabs(mul(tailHF(k), Phi['H'][k]))))
        acc = add(acc, mul(w, iabs(mul(tailHF(k), Phi['F'][k]))))
        acc = add(acc, mul(w, iabs(mul(tailRecipInv, Phi['R'][k]))))
    return mag(acc)


# ============================================================================================
# 6.  independent pointwise witness with the extended potential
# ============================================================================================
def eval_pde_ext(a, m, w, P, G):
    N_ = P['N']
    sigma = P['sigma']
    gamma = P['gamma']
    A1 = _amp(P, 'A1')
    A2 = _amp(P, 'A2')
    A3 = _amp(P, 'A3')
    hjbMax = 0.0
    fpResMax = 0.0
    xs = []
    Jv = []
    for i in range(G):
        t = i / G
        u = ev_series(a, t)
        upp = d2_series(a, t)
        up = d1_series(a, t)
        mm = ev_series(m, t)
        mp = d1_series(m, t)
        mpp = d2_series(m, t)
        sm = math.sqrt(mm)
        V = A1 * math.cos(TWO_PI * t) + A2 * math.cos(2 * TWO_PI * t) \
            + A3 * math.cos(3 * TWO_PI * t) + gamma * mm
        hjb = u - sigma * upp + 0.5 * up * up / sm - V
        if abs(hjb) > hjbMax:
            hjbMax = abs(hjb)
        dflux = 0.5 / sm * mp * up + sm * upp
        fp = mm - sigma * mpp - dflux - 1
        if abs(fp) > fpResMax:
            fpResMax = abs(fp)
        xs.append(t)
        Jv.append(sigma * mp + sm * up)
    phiMin = INF
    phiMax = -INF
    for i in range(G):
        t = xs[i]
        Sa = 0.0
        for k in range(1, N_ + 1):
            Sa += 2 * m[k] * math.sin(TWO_PI * k * t) / (TWO_PI * k)
        ph = Jv[i] - Sa
        if ph < phiMin:
            phiMin = ph
        if ph > phiMax:
            phiMax = ph
    reciprocalMaw = 0.0
    for i in range(G):
        t = xs[i]
        prod = math.sqrt(ev_series(m, t)) * ev_series(w, t)
        if abs(prod - 1) > reciprocalMaw:
            reciprocalMaw = abs(prod - 1)
    return {'hjbMax': hjbMax, 'fpResMax': fpResMax, 'fpFluxConstDev': phiMax - phiMin,
            'reciprocalMaw': reciprocalMaw}
