"""Assemble results.json from the run artefacts."""
import json, pickle, os, re, hashlib
from fractions import Fraction as Fr
from mpmath import mp, mpf

mp.dps = 120
W = '../../corpus/bgp212-witness/witnesses'


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def dec(x, n=80):
    return mp.nstr(mpf(x.numerator) / x.denominator, n)


def agree_digits(a, b):
    a = a.replace('.', ''); b = b.replace('.', '')
    k = 0
    while k < min(len(a), len(b)) and a[k] == b[k]:
        k += 1
    return k


out = {}
his21 = Fr(open(f'{W}/axiom212_k45_d21_exact_ratio.txt').read().strip())
for tag, wf in (('d21', 'axiom212_k45_d21.json'), ('d20', 'axiom212_k45_d20.json')):
    r = json.load(open(f'work/{tag}/crt_result.json'))
    meta = pickle.load(open(f'work/{tag}/meta.pkl', 'rb'))
    Iy, Jy = Fr(r['I_y']), Fr(r['J_y'])
    deg = meta['deg']; K = meta['K']
    It = Iy / Fr(1250) ** (2 * deg + K)          # I(F~)
    Jt = Jy / Fr(1250) ** (2 * deg + K + 1)      # J(F~)
    Ip, Jp = It / Fr(4) ** K, Jt / Fr(4) ** (K + 1)  # physical scale (Lean)
    rt = 45 * Jt / It
    rp = 45 * Jp / Ip
    assert rp == 45 * Jy / (5000 * Iy)
    d = dict(witness=wf, witness_sha256=sha(f'{W}/{wf}'), degree=deg, K=K,
             I_Ftilde=str(It), J_Ftilde=str(Jt),
             I_F_physical=str(Ip), J_F_physical=str(Jp),
             I_F_physical_decimal=dec(Ip, 40), J_F_physical_decimal=dec(Jp, 40),
             ratio_45J_over_I_dilated=str(rt), ratio_45J_over_I_dilated_decimal=dec(rt, 80),
             ratio_45J_over_I_physical=str(rp), ratio_45J_over_I_physical_decimal=dec(rp, 80),
             ratio_physical_num_digits=len(str(rp.numerator)), ratio_physical_den_digits=len(str(rp.denominator)),
             margin_45J_minus_I_physical=str(45 * Jp - Ip), margin_positive=(45 * Jp - Ip) > 0, I_positive=Ip > 0,
             crt=dict(primes=r['n_primes'], primes_needed=r['prefix_primes'], bits_needed=r['bits_needed'],
                      stable_with_spare_primes=r['crt_stable_with_spare_primes'], magnitude_bounds_ok=r['magnitude_bounds_ok']),
             cap_correction_share=dict(I=float((meta['I0'] - Iy) / meta['I0']), J=float((meta['J0'] - Jy) / meta['J0'])))
    if tag == 'd21':
        d['his_exact_fraction_file'] = 'axiom212_k45_d21_exact_ratio.txt'
        d['his_fraction_sha256'] = sha(f'{W}/axiom212_k45_d21_exact_ratio.txt')
        d['his_fraction_equals_our_dilated_ratio_45J~/I~'] = (his21 == rt)
        d['his_fraction_over_4_equals_our_physical_ratio'] = (his21 / 4 == rp)
        d['his_fraction_decimal'] = dec(his21, 60)
    else:
        his_ball = '1.00060034425677288922891949831393627888'
        his_ball_t = '4.00240137702709155691567799325574511554'
        d['his_ball_physical_printed'] = his_ball
        d['digits_agreeing_with_his_printed_physical'] = agree_digits(dec(rp, 80), his_ball)
        d['his_printed_digits_physical'] = len(his_ball.replace('.', ''))
        d['his_ball_dilated_printed'] = his_ball_t
        d['digits_agreeing_with_his_printed_dilated'] = agree_digits(dec(rt, 80), his_ball_t)
        d['his_printed_digits_dilated'] = len(his_ball_t.replace('.', ''))
        enc = json.load(open(f'{W}/{wf}'))['ratio_enclosure']
        d['his_ratio_enclosure_in_file'] = enc
        m = re.match(r'\[([0-9.]+) \+/- ([0-9.e-]+)\]', enc)
        mid, rad = Fr(m.group(1)), Fr(m.group(2))
        d['our_dilated_ratio_inside_his_enclosure'] = abs(rt - mid) <= rad
    out[tag] = d
json.dump(out, open('results_core.json', 'w'), indent=1)
print(json.dumps({t: {k: v for k, v in d.items() if 'decimal' in k or 'equal' in k or 'digits' in k or 'inside' in k or 'positive' in k or k == 'cap_correction_share'} for t, d in out.items()}, indent=1))
