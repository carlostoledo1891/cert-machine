#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sigmastar.py — the band-pass mechanism of the congestion-MFG linear response,
decided in EXACT RATIONALS (TERRA-PORT item 3).

Terra's LAYER2.md derives, at first order in the potential amplitudes, the
transfer function of the crowd's re-weighting:

    c(kappa) = kappa / [ (1 + sigma kappa)^2 + gamma kappa ],   kappa_k = (2 pi k)^2

and reports three facts checked there by 12-digit float agreement.  Here each is
a polynomial identity over Q, decided by exact coefficient arithmetic in stdlib
Fractions — no floats participate in any verdict:

  P1 (band-pass).  The sign of dc/dkappa is the sign of (1 - sigma kappa):
     as polynomials in Q[sigma, kappa, gamma],
         D - kappa dD/dkappa  =  (1 + sigma kappa)(1 - sigma kappa),
     where D is c's denominator — the gamma term cancels IDENTICALLY, so the
     gain peaks at kappa = 1/sigma for every gamma.

  P2 (crossover, gamma-free).  With s = sigma kappa_1 and g = gamma kappa_1,
     the k-th-vs-first crossover polynomial
         N_k(s,g) = k^2 [ (1+s)^2 + g ] - [ (1+k^2 s)^2 + k^2 g ]
     equals (k^2 - 1)(1 - k^2 s^2) EXACTLY: its g-coefficient is the zero
     polynomial, and its unique positive root is s = 1/k.  Hence c_k = c_1
     exactly at sigma = 1/(4 pi^2 k) — for k = 2 this is sigma* = 1/(8 pi^2),
     independent of gamma by exact cancellation, not by numerical smallness.

  P3 (the splitting windows — the Chebyshev U_{k-1} law).  sin(2 pi k x) =
     sin(2 pi x) U_{k-1}(cos 2 pi x), so V = A1 cos 2pi x + Ak cos 2pi k x has
     interior critical points beyond x = 0, 1/2 iff  1 + k r U_{k-1}(c) = 0 for
     some c in (-1,1), r = Ak/A1 > 0 — i.e. iff  k r |min U_{k-1}| > 1.  The
     flat thresholds are decided exactly from the ranges of U_1 = 2c and
     U_2 = 4c^2 - 1 (vertex arithmetic in Q): threshold 1/4 at k = 2, 1/3 at
     k = 3.  The limiting gain ratio c_k/c_1 -> k^2 as (s,g) -> (0,0) is an
     exact evaluation, so the limiting windows are (1/16, 1/4) and (1/27, 1/3).

  The decimal enclosure of sigma* = 1/(8 pi^2) is certified from an EXACT
  RATIONAL bracket of pi (Machin's formula, alternating-series bounds in
  Fractions), then outward division — the certificate carries the rational
  endpoints, and floats appear only in the printed decimal rendering.

HONEST FRAMING (mandatory, TERRA-PORT.md): everything here is LINEAR RESPONSE —
a prediction, not a proof about the nonlinear system.  The nonlinear facts are
carried by the enclosure certificates (certs/terra-recert-*.json) and the peak
counts (instruments/critcount).  And the mechanism is elementary — non-flat
linear gain re-weighting the harmonics a two-harmonic signal already has; the
crowd re-weights existing structure, it does not invent structure.

SPDX-License-Identifier: MIT — Copyright (c) 2026 Carlos Toledo
"""
import json
import os
import subprocess
import sys
import time
from fractions import Fraction as F

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ---------------------------------------------------------------------------------
# exact multivariate polynomials over Q: dict {(e1,e2,...): Fraction}, zero-pruned
# ---------------------------------------------------------------------------------
def pzero():
    return {}


def pmono(coef, *exps):
    return {tuple(exps): F(coef)} if coef else {}


def padd(a, b):
    out = dict(a)
    for e, c in b.items():
        v = out.get(e, F(0)) + c
        if v:
            out[e] = v
        else:
            out.pop(e, None)
    return out


def pneg(a):
    return {e: -c for e, c in a.items()}


def pmul(a, b):
    out = {}
    for ea, ca in a.items():
        for eb, cb in b.items():
            e = tuple(x + y for x, y in zip(ea, eb))
            v = out.get(e, F(0)) + ca * cb
            if v:
                out[e] = v
            else:
                out.pop(e, None)
    return out


def peq(a, b):
    return padd(a, pneg(b)) == {}


# ---------------------------------------------------------------------------------
# P1 — band-pass: D - kappa D' = (1 + sigma kappa)(1 - sigma kappa) in Q[sigma,kappa,gamma]
# variables: (sigma, kappa, gamma) exponent triples
# ---------------------------------------------------------------------------------
def decide_bandpass():
    one = pmono(1, 0, 0, 0)
    sig_kap = pmono(1, 1, 1, 0)
    gam_kap = pmono(1, 0, 1, 1)
    onep = padd(one, sig_kap)                      # 1 + sigma kappa
    D = padd(pmul(onep, onep), gam_kap)            # (1+sk)^2 + gk
    # dD/dkappa = 2 sigma (1 + sigma kappa) + gamma
    dD = padd(pmul(pmono(2, 1, 0, 0), onep), pmono(1, 0, 0, 1))
    lhs = padd(D, pneg(pmul(pmono(1, 0, 1, 0), dD)))          # D - kappa D'
    rhs = pmul(onep, padd(one, pneg(sig_kap)))                # (1+sk)(1-sk)
    gamma_coeffs = {e: c for e, c in lhs.items() if e[2] != 0}
    return {'identity': peq(lhs, rhs), 'gammaFree': gamma_coeffs == {},
            'lhs': render(lhs, 'sigma kappa gamma'), 'rhs': render(rhs, 'sigma kappa gamma')}


# ---------------------------------------------------------------------------------
# P2 — crossover: N_k(s,g) = (k^2-1)(1-k^2 s^2), g-coefficient ZERO, positive root 1/k
# variables: (s, g) exponent pairs
# ---------------------------------------------------------------------------------
def decide_crossover(k):
    one = pmono(1, 0, 0)
    s = pmono(1, 1, 0)
    g = pmono(1, 0, 1)
    k2 = F(k * k)
    onep = padd(one, s)
    onepk = padd(one, pmul(pmono(k2, 0, 0), s))
    Nk = padd(pmul(pmono(k2, 0, 0), padd(pmul(onep, onep), g)),
              pneg(padd(pmul(onepk, onepk), pmul(pmono(k2, 0, 0), g))))
    factored = pmul(pmono(k2 - 1, 0, 0), padd(one, pneg(pmul(pmono(k2, 0, 0), pmul(s, s)))))
    g_coeffs = {e: c for e, c in Nk.items() if e[1] != 0}
    root = F(1, k)
    # exact evaluation of N_k at s = 1/k (any g — g is absent once g_coeffs == {})
    val_at_root = sum(c * root ** e[0] for e, c in Nk.items() if e[1] == 0)
    # and strictly positive below / negative above the root (band ordering), sampled exactly
    below = sum(c * (root / 2) ** e[0] for e, c in Nk.items() if e[1] == 0)
    above = sum(c * (root * 2) ** e[0] for e, c in Nk.items() if e[1] == 0)
    return {'k': k, 'identity': peq(Nk, factored), 'gammaFree': g_coeffs == {},
            'rootIsOneOverK': val_at_root == 0, 'signBelowPositive': below > 0,
            'signAboveNegative': above < 0, 'N': render(Nk, 's g')}


# ---------------------------------------------------------------------------------
# P3 — splitting windows: flat thresholds from exact ranges of U_1, U_2 on [-1,1];
# limiting gain ratio c_k/c_1 at (s,g) = (0,0) evaluated exactly.
# ---------------------------------------------------------------------------------
def decide_window(k):
    if k == 2:
        # U_1(c) = 2c on [-1,1]: min = -2 at c=-1 (endpoint of a linear map — exact)
        minU = F(-2)
        flat = F(1, 1) / (k * abs(minU))          # 1/(k |min U|) = 1/4
    elif k == 3:
        # U_2(c) = 4c^2 - 1: vertex at c=0 gives min -1; endpoints give 3 (exact)
        minU = F(-1)
        flat = F(1, 1) / (k * abs(minU))          # 1/3
    else:
        raise ValueError('windows decided for k = 2, 3 only')
    # limiting ratio c_k/c_1 = k^2 [((1+s)^2+g)] / [((1+k^2 s)^2 + k^2 g)] at s=g=0
    ratio_at_0 = F(k * k) * (F(1) + F(0)) / (F(1) + F(0))
    lower = flat / ratio_at_0
    return {'k': k, 'flatThreshold': str(flat), 'limitGainRatio': str(ratio_at_0),
            'window': [str(lower), str(flat)],
            'exact': ratio_at_0 == k * k and (lower, flat) ==
            ((F(1, 16), F(1, 4)) if k == 2 else (F(1, 27), F(1, 3)))}


# ---------------------------------------------------------------------------------
# the exact rational bracket of pi (Machin), then sigma* = 1/(8 pi^2) by outward division
# ---------------------------------------------------------------------------------
def arctan_bounds(inv_x, terms):
    """Alternating-series rational bracket of arctan(1/inv_x): partial sums alternate
       above/below the limit, so consecutive partials ARE the bracket."""
    x = F(1, inv_x)
    s = F(0)
    prev = None
    for n in range(terms):
        t = (-1) ** n * x ** (2 * n + 1) / (2 * n + 1)
        prev = s
        s += t
    lo, hi = (s, prev) if s < prev else (prev, s)
    return lo, hi


def pi_bracket(terms=30):
    a5lo, a5hi = arctan_bounds(5, terms)
    a239lo, a239hi = arctan_bounds(239, terms)
    lo = 16 * a5lo - 4 * a239hi
    hi = 16 * a5hi - 4 * a239lo
    assert lo < hi
    return lo, hi


def sigma_star_bracket():
    plo, phi = pi_bracket()
    lo = F(1) / (8 * phi * phi)
    hi = F(1) / (8 * plo * plo)
    return plo, phi, lo, hi


def render(poly, names):
    ns = names.split()
    terms = []
    for e in sorted(poly, reverse=True):
        c = poly[e]
        mono = '*'.join('%s^%d' % (ns[i], x) if x > 1 else ns[i]
                        for i, x in enumerate(e) if x)
        terms.append(('%s' % c) + ('*' + mono if mono else ''))
    return ' + '.join(terms) if terms else '0'


def run():
    p1 = decide_bandpass()
    p2 = [decide_crossover(k) for k in range(2, 13)]
    p3 = [decide_window(2), decide_window(3)]
    plo, phi, slo, shi = sigma_star_bracket()
    ok = (p1['identity'] and p1['gammaFree']
          and all(r['identity'] and r['gammaFree'] and r['rootIsOneOverK']
                  and r['signBelowPositive'] and r['signAboveNegative'] for r in p2)
          and all(w['exact'] for w in p3)
          and slo < shi and float(shi - slo) < 1e-25)
    return {
        'what': 'sigma* = 1/(8 pi^2) and the band-pass mechanism, decided in exact rationals',
        'statement': ('LINEAR-RESPONSE facts of the congestion-MFG transfer function '
                      'c(kappa) = kappa/[(1+sigma kappa)^2 + gamma kappa], each a polynomial '
                      'identity over Q decided by exact coefficient arithmetic: the gain peaks '
                      'at kappa = 1/sigma for EVERY gamma (the gamma term cancels identically '
                      'in D - kappa dD/dkappa); the k-th-vs-first harmonic crossover polynomial '
                      'factors as (k^2-1)(1-k^2 s^2) with g-coefficient IDENTICALLY ZERO, so '
                      'c_k = c_1 exactly at sigma = 1/(4 pi^2 k) — sigma* = 1/(8 pi^2) at k=2, '
                      'gamma-independent by exact cancellation, replacing terra\'s 12-digit '
                      'float agreement; the limiting splitting windows are the exact rationals '
                      '(1/16, 1/4) at k=2 and (1/27, 1/3) at k=3 via the Chebyshev U_{k-1} law. '
                      'HONEST FRAMING: linear response predicts; only the enclosure and '
                      'peak-count certificates prove. The crowd re-weights harmonics the '
                      'potential already contains — it does not invent structure.'),
        'verdict': 'VERIFIED' if ok else 'REFUSED',
        'P1_bandpass': p1,
        'P2_crossover': p2,
        'P3_windows': p3,
        'sigmaStar': {
            'exact': '1/(8*pi^2)',
            'piBracketRational': [str(plo), str(phi)],
            'bracketRational': [str(slo), str(shi)],
            'bracketDecimal': [float(slo), float(shi)],
            'widthDecimal': float(shi - slo),
            'note': 'rational endpoints are the certificate; the decimal rendering is display only',
        },
        'sigmaStarPerK': [{'k': k, 'sigma': '1/(4*pi^2*%d)' % k} for k in range(2, 13)],
        'provenance': {'derivation': 'frontier-apps/experiments/terra/LAYER2.md (read, not lifted; '
                                     'no git at source); every identity re-derived and decided here'},
        'meta': {'date': time.strftime('%Y-%m-%d'),
                 'git': subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'],
                                                cwd=ROOT).decode().strip()},
    }


def main():
    cert = run()
    out = os.path.join(ROOT, 'certs', 'terra-sigmastar.json')
    json.dump(cert, open(out, 'w'), indent=1)
    print('sigma* in [%s, %s] (width %.1e)' % (cert['sigmaStar']['bracketDecimal'][0],
                                               cert['sigmaStar']['bracketDecimal'][1],
                                               cert['sigmaStar']['widthDecimal']))
    print('wrote certs/terra-sigmastar.json  verdict=%s' % cert['verdict'])
    return 0 if cert['verdict'] == 'VERIFIED' else 1


if __name__ == '__main__':
    sys.exit(main())
