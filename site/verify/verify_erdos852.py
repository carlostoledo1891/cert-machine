#!/usr/bin/env python3
"""verify_erdos852.py — independent verification of the detached Erdős #852
constant certificates, using NOTHING but the Python standard library.

Two constants, two entirely different checks, neither sharing a line of code
with the engine that produced the certificate:

  C*  The published value 0.0752403861777... is REFUTED in EXACT INTEGER
      arithmetic: the partial product N/D over the odd primes <= 400000 is a
      strict lower bound of prod_{p>=3}(1 + 1/(p-1)^3), and one integer
      inequality shows (N/D - 1)/2 already exceeds the upper edge of the
      claim's window under BOTH truncation and rounding readings. No tail
      bound, no rounding, no floats. The engine's tighter enclosure is then
      cross-checked to sit INSIDE this script's exact lower/upper window
      (upper via the elementary tail chain sum 1/m^3 <= 1/(2(L-1)^2),
      prod(1+a) <= e^S <= 1+S+S^2), all by integer cross-multiplication.

  c0  The certificate states a 40-decimal window (lo, lo + 1e-40) claimed to
      straddle the root of I0(c) = 1 with ~5e-41 margins. This script
      re-evaluates I0 at both ends with the decimal module at 130 digits
      (exp/ln are documented correctly rounded; pi via Machin with the
      alternating-series remainder; Li2 via its series with a geometric
      remainder — every truncation error is ~1e-120, dwarfed by the margins)
      and requires I0(lo) < 1 < I0(hi) with margin > 1e-50, refusing a
      smaller margin rather than deciding inside its own noise. The strict
      inequality e^{2c} > 1 + 2c is checked at both ends (I0' > 0, so the
      window contains THE root). The published-decimal verdicts
      (VERIFIED_ROUNDED for c0, REFUTED for C*) are re-derived from the
      window by exact rational comparison.

RED CONTROLS (all must fire before exit 0): a forged pi must break the
I0(hi) > 1 check; a true-digits claim must NOT be refuted while a claim
above the exact upper window must be refuted through the upper path; a
forged pin hash must be caught. The script prints the sha256 of the
certificate file it verified, so two transcripts naming the same hash
provably checked the same bytes.

usage: python3 verify_erdos852.py certs/erdos852-certificate.json [--sources DIR]
exit 0 iff every check passes AND every red control fires."""

import sys
import json
import hashlib
import os
from decimal import Decimal, getcontext

PASS_FAIL = {True: 'PASS', False: 'FAIL'}
failures = 0


def check(ok, msg):
    global failures
    print('%s  %s' % (PASS_FAIL[bool(ok)], msg))
    if not ok:
        failures += 1


# ---------------------------------------------------------------- C* side

def odd_primes(limit):
    sieve = bytearray([1]) * (limit + 1)
    for i in range(2, int(limit ** 0.5) + 1):
        if sieve[i]:
            sieve[i * i::i] = bytearray(len(sieve[i * i::i]))
    return [p for p in range(3, limit + 1, 2) if sieve[p]]


def partial_product(limit):
    """exact N, D with N/D = prod_{3 <= p <= limit} (1 + 1/(p-1)^3), by balanced tree"""
    pairs = [((p - 1) ** 3 + 1, (p - 1) ** 3) for p in odd_primes(limit)]

    def tree(lo, hi):
        if hi - lo == 1:
            return pairs[lo]
        mid = (lo + hi) // 2
        a, b = tree(lo, mid), tree(mid, hi)
        return (a[0] * b[0], a[1] * b[1])

    return tree(0, len(pairs)) + (len(pairs),)


def parse_decimal(s):
    """'0.0752...' -> (num, den) exact"""
    ip, fp = s.split('.')
    return int(ip + fp), 10 ** len(fp)


def refuted_below(N, D, claim_num, claim_den):
    """is the exact lower bound (N/D - 1)/2 above the claim window's upper edge
    (num+1)/den?  (that edge covers both truncation and rounding readings)"""
    return (N - D) * claim_den > 2 * (claim_num + 1) * D


def refuted_above(uN, uD, claim_num, claim_den):
    """is the exact upper bound uN/uD below the claim window's lower edge
    (2num-1)/(2den)?"""
    return 2 * uN * claim_den < (2 * claim_num - 1) * uD


# ---------------------------------------------------------------- c0 side

def machin_pi():
    """pi = 16 atan(1/5) - 4 atan(1/239); alternating series, remainder below
    the first omitted term: < 16*(1/5)^181/181 + 4*(1/239)^71/71 < 1e-124"""
    def atan_inv(x, terms):
        u = 1 / Decimal(x)
        u2 = u * u
        s = Decimal(0)
        p = u
        for k in range(terms):
            t = p / (2 * k + 1)
            s = s + t if k % 2 == 0 else s - t
            p *= u2
        return s
    return 16 * atan_inv(5, 90) - 4 * atan_inv(239, 35)


def li2_small(z, terms=130):
    """Li2(z) = sum z^k/k^2 for |z| < 1; remainder < |z|^(K+1)/((K+1)^2 (1-|z|)).
    Used at |z| ~ 0.076: remainder < 1e-135."""
    s = Decimal(0)
    p = z
    for k in range(1, terms + 1):
        s += p / (k * k)
        p *= z
    return s


def I0(c, pi):
    """I0(c) = c + c log((e^{2c}-1)/(2c)) - pi^2/12 - log(x)^2/4 - Li2(-1/x)/2,
    x = e^{2c} - 1 (the dilog routed through the inversion identity)."""
    x = (2 * c).exp() - 1
    lx = x.ln()
    return c + c * (lx - (2 * c).ln()) - pi * pi / 12 - lx * lx / 4 - li2_small(-1 / x) / 2


def main():
    args = sys.argv[1:]
    cert_path = args[0] if args and not args[0].startswith('--') else 'certs/erdos852-certificate.json'
    sources = None
    if '--sources' in args:
        sources = args[args.index('--sources') + 1]

    with open(cert_path, 'rb') as f:
        raw = f.read()
    print('certificate: %s  sha256 %s' % (cert_path, hashlib.sha256(raw).hexdigest()))
    cert = json.loads(raw)

    # ---- pins ----
    def pin_ok(path, expected):
        with open(path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest() == expected
    first_pin_path = None
    if sources:
        for fn, sha in cert['sourcePins'].items():
            path = os.path.join(sources, fn)
            if not os.path.exists(path):
                print('SKIP  source %s not present' % fn)
                continue
            if first_pin_path is None:
                first_pin_path = path
            ok = pin_ok(path, sha)
            check(ok, 'source %s %s' % (fn, 'sha256 matches pin' if ok else 'DRIFTED'))

    # ---- C*: the refutation, in exact integers ----
    L = cert['cstar']['refutation']['limit']
    N, D, nprimes = partial_product(L)
    cnum, cden = parse_decimal(cert['cstar']['published']['value'])
    check(cert['cstar']['published']['verdict'] == 'REFUTED', 'certificate says the published C* is REFUTED — re-deciding that now')
    check(refuted_below(N, D, cnum, cden),
          'published C* = %s REFUTED: exact partial product over %d primes <= %d is a strict lower bound '
          'already above the claim window (one integer inequality, no tail, no rounding)'
          % (cert['cstar']['published']['value'], nprimes, L))

    # exact upper window: N/D * (1 + S + S^2), S = 1/(2(L-1)^2) = 1/T
    T = 2 * (L - 1) ** 2
    uN = N * (T * T + T + 1)          # upper product numerator over D*T^2
    uD = D * T * T
    # C* window: [(N-D)/(2D), (uN - uD)/(2 uD)] must CONTAIN the engine's enclosure
    elo_n, elo_d = parse_decimal(cert['cstar']['enclosure']['lo'])
    ehi_n, ehi_d = parse_decimal(cert['cstar']['enclosure']['hi'])
    inside = (N - D) * elo_d <= 2 * D * elo_n and 2 * uD * ehi_n <= (uN - uD) * ehi_d
    check(inside, 'the engine\'s 16-digit C* enclosure sits INSIDE this script\'s exact lower/upper window '
                  '(tail: sum 1/m^3 <= 1/(2(L-1)^2); prod(1+a) <= e^S <= 1+S+S^2)')
    check((N - D) * cden > 2 * cnum * D,
          'consistency: the exact lower bound alone already exceeds the published value itself')

    # ---- c0: the 40-decimal window, re-decided at 130 digits ----
    getcontext().prec = 130
    pi = machin_pi()
    lo = Decimal(cert['c0']['bracket40']['lo'])
    hi = Decimal(cert['c0']['bracket40']['hi'])
    check(hi - lo == Decimal(1).scaleb(-40), 'bracket40 is a clean 1e-40 window')
    margin = Decimal('1e-50')
    ilo = I0(lo, pi) - 1
    ihi = I0(hi, pi) - 1
    check(ilo < -margin, 'I0(lo) < 1 with margin %s (needed > 1e-50; truncation errors ~1e-120)' % ('%.3e' % float(-ilo)))
    check(ihi > margin, 'I0(hi) > 1 with margin %s — the root lies strictly inside the 40-decimal window' % ('%.3e' % float(ihi)))
    for c in (lo, hi):
        check((2 * c).exp() > 1 + 2 * c, 'e^{2c} > 1 + 2c at c = %s... — I0 strictly increasing, the window holds THE root' % str(c)[:12])
    check(cert['c0']['certifiedDigits'].startswith(cert['c0']['bracket40']['lo']),
          'the certificate\'s 61-digit expansion is consistent with the verified window')

    # published c0 decimal: VERIFIED_ROUNDED — window comparisons in exact rationals
    pnum, pden = parse_decimal(cert['c0']['published']['value'])
    lnum, lden = parse_decimal(cert['c0']['bracket40']['lo'])
    hnum, hden = lnum + 1, lden
    trunc_refuted = hnum * pden < pnum * hden            # c0 < claim  =>  truncation reading fails
    rounded_ok = (2 * pnum - 1) * 2 * lden <= 2 * pden * 2 * lnum and hnum * 2 * pden <= (2 * pnum + 1) * hden
    check(cert['c0']['published']['verdict'] == 'VERIFIED_ROUNDED' and trunc_refuted and rounded_ok,
          'published c0 = %s re-decided: correct as a ROUNDING to 14 places, wrong as a truncation '
          '(the expansion continues ...9469)' % cert['c0']['published']['value'])

    # ---- RED controls: every one must fire ----
    red_pi = pi + Decimal('1e-30')
    check(I0(hi, red_pi) - 1 < 0,
          'RED control: pi forged by +1e-30 breaks the I0(hi) > 1 check — the c0 audit can fire')
    tnum, tden = parse_decimal('0.0752403861783')
    check(not refuted_below(N, D, tnum, tden),
          'RED control: the TRUE 13-digit truncation of C* is NOT refuted — the refuter is not inverted')
    anum, aden = parse_decimal('0.0752403861801')
    check(refuted_above(uN - uD, 2 * uD, anum, aden),
          'RED control: a claim above the exact upper window is refuted through the upper path — both directions fire')
    if first_pin_path is not None:
        check(not pin_ok(first_pin_path, 'deadbeef'),
              'RED control: a forged pin hash is caught — the hash is compared, not assumed')

    print()
    print('verify_erdos852: %d failures' % failures)
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
