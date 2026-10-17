#!/usr/bin/env python3
"""decide.py — the NIST curve-seeds claim, decided in integers with the standard library.      cert-machine · 2026-10-16

Written from three specifications and nothing else:
  POSIX drand48 (IEEE Std 1003.1): X(n+1) = (a·X(n) + c) mod 2^48, a = 0x5DEECE66D, c = 0xB; srand48(s) sets the high
      32 bits of X to the low 32 bits of s and the low 16 bits to 0x330E; lrand48() returns the high 31 bits of X.
  ANSI X9.62-1998 A.3.3 (as FIPS 186-2 prints its intermediates): the SHA-1 chain that turns a seed into c (prime case,
      then b²·c ≡ a³ mod p) or into b (binary case, in the normal basis).
  FreeLIP lip.c (Lenstra–Leyland 1997): zrstarts / zrandom / zrandomb — a multiplicative generator modulo 2^107 − 1
      with multiplier 3^121, limbs of NBITS bits (26 in the SINGLE_MUL build).
The claimant's code (two blocks on the post) is pinned as evidence and never run. The claim's parameters (timestamps,
candidate indices, LIP seeds) come from corpus/curveseeds/preregistration.json; the published objects from
corpus/curveseeds/published.json, read from the pinned FIPS 186-2 and OpenSSL bytes.

usage: python3 -I instruments/curveseeds/decide.py            the calibration, then every claim row, as a table
       python3 -I instruments/curveseeds/decide.py --json     the same as JSON (the runner diffs it against decide.js)
       python3 -I instruments/curveseeds/decide.py --red      the red controls (each must fail)
"""
import calendar, hashlib, json, os, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A48, C48, M48 = 0x5DEECE66D, 0xB, 1 << 48

# ---- the LCG -------------------------------------------------------------------------------------------------
def srand48_state(seed32):
    return ((seed32 & 0xFFFFFFFF) << 16) | 0x330E

def lcg_next(x):
    return (A48 * x + C48) % M48

def utc(ts):                                   # "YYYY-MM-DD HH:MM:SS" read as UTC
    return calendar.timegm(time.strptime(ts, '%Y-%m-%d %H:%M:%S'))

def seed_prime(t, n, shift=23):
    """candidate n (1-based) of the prime-curve run: 20 calls, byte = lrand48() >> shift (shift 23 → the top 8 bits)"""
    x, out = srand48_state(t), []
    for i in range(1, 20 * n + 1):
        x = lcg_next(x)
        if i > 20 * (n - 1): out.append(((x >> 17) >> shift) & 0xFF)
    return bytes(out).hex()

def seed_binary(t, n, halve=True, signed=False):
    """candidate n of the binary-curve run: srand48(t // 2), 5 calls, each a 32-bit word of lrand48() (or mrand48 if signed)"""
    x, out = srand48_state(t // 2 if halve else t), ''
    for i in range(1, 5 * n + 1):
        x = lcg_next(x)
        if i > 5 * (n - 1): out += '%08x' % ((x >> 16) & 0xFFFFFFFF if signed else x >> 17)
    return out

# ---- X9.62 A.3.3: seed → c (prime) or b (binary) -------------------------------------------------------------
def sha1_int(b):
    return int.from_bytes(hashlib.sha1(b).digest(), 'big')

def x962_chain(seed_hex, t, step=+1, clear_top=False):
    """(rightmost v bits of SHA-1(seed)) ‖ SHA-1(seed+1) ‖ … ‖ SHA-1(seed+s), s = ⌊(t−1)/160⌋, v = t − 160 s, as an integer.
    clear_top: the prime case of X9.62 A.3.3.1 sets the leftmost bit of the first block to 0 (FIPS 186-2's printed c
    shows it: P-192's c begins 3099d2bb where SHA-1(seed) ends b099d2bb); the binary case A.3.3.2 does not."""
    seed = bytes.fromhex(seed_hex); g = 8 * len(seed); S = int.from_bytes(seed, 'big')
    s, v = (t - 1) // 160, t - 160 * ((t - 1) // 160)
    w = sha1_int(seed) % (1 << v)
    if clear_top: w &= (1 << (v - 1)) - 1
    for i in range(1, s + 1):
        w = (w << 160) | sha1_int(((S + step * i) % (1 << g)).to_bytes(g // 8, 'big'))
    return w

def derive_prime(seed_hex, p, b_pub, c_pub=None):
    c = x962_chain(seed_hex, p.bit_length(), clear_top=True)
    return {'c': '%x' % c, 'cMatchesPublished': (c == c_pub) if c_pub is not None else None,
            'congruence': (b_pub * b_pub * c + 27) % p == 0, 'cNonzero': c % p != 0, 'fourCplus27Nonzero': (4 * c + 27) % p != 0}

def derive_binary(seed_hex, m, b_normal_pub):
    b = x962_chain(seed_hex, m)
    return {'bNormal': '%x' % b, 'bMatchesPublished': b == b_normal_pub}

# ---- FreeLIP's generator → base points ------------------------------------------------------------------------
LIP_M = (1 << 107) - 1
LIP_A = pow(3, 121, LIP_M)

class Lip:
    def __init__(self, seed): self.state = seed            # zrstarts(seed): zseed = seed; zprroot = 3^121 mod (2^107 − 1)
    def zrandom(self, b):                                   # lip.c: redraw while zseed >= zranp − (zranp mod b); return zseed mod b
        bound = LIP_M - (LIP_M % b)
        while True:
            self.state = self.state * LIP_A % LIP_M
            if self.state < bound: break
        return self.state % b
    def zrandomb(self, bnd, nbits):                         # limbs of bnd plus one, the first drawn most significant; then mod bnd
        radix = 1 << nbits
        limbs = -(-bnd.bit_length() // nbits) + 1
        x = 0
        for _ in range(limbs): x = x * radix + self.zrandom(radix)
        return x % bnd

def base_point_x(lip_seed, p, b, nbits=26, skip=7, max_tries=10000):
    g = Lip(lip_seed)
    for _ in range(skip): g.zrandom(1 << nbits)
    for tries in range(1, max_tries + 1):
        x = g.zrandomb(p, nbits)
        if pow((x * x * x - 3 * x + b) % p, (p - 1) // 2, p) == 1: return x, tries
    return None, max_tries

# ---- the claims -----------------------------------------------------------------------------------------------
def load():
    pre = json.load(open(os.path.join(ROOT, 'corpus', 'curveseeds', 'preregistration.json')))
    pub = json.load(open(os.path.join(ROOT, 'corpus', 'curveseeds', 'published.json')))
    return pre, pub

def published_prime(pub, name):
    """p, b, Gx, Gy, seed, c (FIPS prints c for the NIST curves; the X9.62 curves come from OpenSSL without c)"""
    if name in pub['fips186_2']['prime']:
        f = pub['fips186_2']['prime'][name]
        return {'p': int(f['p']), 'b': int(f['b'], 16), 'Gx': int(f['Gx'], 16), 'Gy': int(f['Gy'], 16), 'seed': f['seed'], 'c': int(f['c'], 16), 'from': 'FIPS 186-2'}
    o = pub['openssl'][name]
    return {'p': int(o['p'], 16), 'b': int(o['b'], 16), 'Gx': int(o['x'], 16), 'Gy': int(o['y'], 16), 'seed': o['seed'], 'c': None, 'from': 'OpenSSL ec_curve.c (X9.62)'}

def decide_all():
    pre, pub = load()
    T = pre['claim']['table']
    out = {'calibration': {}, 'S': {}, 'D': {}, 'G': {}}
    # calibration (pre-registered): FIPS's printed c for P-256 from its printed seed; the srand48 low bits; B-233's normal-basis b
    f256 = pub['fips186_2']['prime']['P-256']
    out['calibration']['P-256 c from FIPS seed'] = x962_chain(f256['seed'], int(f256['p']).bit_length(), clear_top=True) == int(f256['c'], 16)
    out['calibration']['srand48 low 16 bits are 330E'] = srand48_state(871696354) & 0xFFFF == 0x330E
    f233 = pub['fips186_2']['binary']['B-233']
    out['calibration']['B-233 normal-basis b from FIPS s'] = x962_chain(f233['normalBasis']['s'], f233['m']) == int(f233['normalBasis']['b'], 16)
    # S + D, prime curves
    for name, (when, n) in T['prime'].items():
        P = published_prime(pub, name); t = utc(when)
        got = seed_prime(t, n)
        out['S'][name] = {'kind': 'prime', 'timestamp': when, 'unix': t, 'candidate': n, 'produced': got, 'published': P['seed'], 'publishedFrom': P['from'],
                          'verdict': 'CERTIFIED' if got == P['seed'] else 'REFUTED'}
        d = derive_prime(P['seed'], P['p'], P['b'], P['c'])
        ok = d['congruence'] and d['cNonzero'] and d['fourCplus27Nonzero'] and (d['cMatchesPublished'] in (True, None))
        d.update({'kind': 'prime', 'bits': P['p'].bit_length(), 'cPublished': ('%x' % P['c']) if P['c'] is not None else None, 'verdict': 'CERTIFIED' if ok else 'REFUTED'})
        out['D'][name] = d
    # S + D, binary curves
    for name, (when, n) in T['binary'].items():
        f = pub['fips186_2']['binary'][name]; t = utc(when)
        got = seed_binary(t, n)
        out['S'][name] = {'kind': 'binary', 'timestamp': when, 'unix': t, 'srand48Argument': t // 2, 'candidate': n, 'produced': got, 'published': f['normalBasis']['s'],
                          'publishedFrom': 'FIPS 186-2 (normal basis)', 'verdict': 'CERTIFIED' if got == f['normalBasis']['s'] else 'REFUTED'}
        d = derive_binary(f['normalBasis']['s'], f['m'], int(f['normalBasis']['b'], 16))
        d.update({'kind': 'binary', 'm': f['m'], 'fieldPolynomial': f['fieldPolynomial'], 'verdict': 'CERTIFIED' if d['bMatchesPublished'] else 'REFUTED'})
        out['D'][name] = d
    # G, the six base points
    for name, lip_seed in T['basePoints'].items():
        P = published_prime(pub, name)
        x, tries = base_point_x(lip_seed, P['p'], P['b'])
        rhs = (P['Gx'] ** 3 - 3 * P['Gx'] + P['b']) % P['p']
        gy_ok = (P['Gy'] * P['Gy']) % P['p'] == rhs
        out['G'][name] = {'lipSeed': lip_seed, 'nbits': 26, 'skipped': 7, 'tries': tries, 'producedX': ('%x' % x) if x is not None else None, 'publishedGx': '%x' % P['Gx'],
                          'GySquaresToCurve': gy_ok, 'GyIsTheOddRoot': bool(P['Gy'] & 1), 'GyIsTheSmallerRoot': P['Gy'] < P['p'] - P['Gy'],
                          'verdict': 'CERTIFIED' if x == P['Gx'] and gy_ok else 'REFUTED'}
    return out

def reds():
    pre, pub = load(); T = pre['claim']['table']
    t256, n256 = utc(T['prime']['P-256'][0]), T['prime']['P-256'][1]
    s256 = pub['fips186_2']['prime']['P-256']['seed']; p256 = int(pub['fips186_2']['prime']['P-256']['p']); b256 = int(pub['fips186_2']['prime']['P-256']['b'], 16); c256 = int(pub['fips186_2']['prime']['P-256']['c'], 16)
    t233, n233 = utc(T['binary']['B-233'][0]), T['binary']['B-233'][1]; f233 = pub['fips186_2']['binary']['B-233']
    P192 = published_prime(pub, 'P-192')
    flipped = bytearray(bytes.fromhex(s256)); flipped[7] ^= 0x40; flipped = flipped.hex()
    return {
        'timestamp + 1 s': seed_prime(t256 + 1, n256) == s256,
        'candidate + 1': seed_prime(t256, n256 + 1) == s256,
        'lrand48 >> 22 instead of >> 23': seed_prime(t256, n256, shift=22) == s256,
        'binary: clock not halved': seed_binary(t233, n233, halve=False) == f233['normalBasis']['s'],
        'binary: mrand48 instead of lrand48': seed_binary(t233, n233, signed=True) == f233['normalBasis']['s'],
        'one seed byte flipped: c': x962_chain(flipped, 256, clear_top=True) == c256,
        'one seed byte flipped: congruence': (b256 * b256 * x962_chain(flipped, 256, clear_top=True) + 27) % p256 == 0,
        'SHA-1(seed − i) chain': x962_chain(s256, 256, step=-1, clear_top=True) == c256,
        'prime chain without the leftmost bit cleared': x962_chain(s256, 256) == c256,
        'LIP seed 20001': base_point_x(20001, P192['p'], P192['b'])[0] == P192['Gx'],
        'NBITS 30': base_point_x(20000, P192['p'], P192['b'], nbits=30)[0] == P192['Gx'],
        'no outputs skipped': base_point_x(20000, P192['p'], P192['b'], skip=0)[0] == P192['Gx'],
    }

if __name__ == '__main__':
    if '--red' in sys.argv:
        r = reds(); bad = [k for k, v in r.items() if v]
        for k, v in r.items(): print(('  RED ok    ' if not v else '  RED FAILED ') + k)
        sys.exit(1 if bad else 0)
    res = decide_all()
    if '--json' in sys.argv:
        print(json.dumps(res, indent=1)); sys.exit(0)
    for k, v in res['calibration'].items(): print('  calibration', 'ok  ' if v else 'FAIL', k)
    if not all(res['calibration'].values()): print('CALIBRATION FAILED'); sys.exit(1)
    for sec in ('S', 'D', 'G'):
        for name, r in res[sec].items(): print('  %s  %-11s %s' % (sec, name, r['verdict']), {k: r[k] for k in r if k in ('timestamp', 'candidate', 'tries', 'cMatchesPublished', 'congruence', 'bMatchesPublished')})
