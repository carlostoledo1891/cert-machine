#!/usr/bin/env python3
"""measure.py — Anand's own family, computed exactly: K = 40n, N = 3n, W = D_N^8 / D_K, h = 37n, k = 7.

Through instruments/zetahankel/hankel.py (our engine, pinned there; its functional at k = 7 is exactly
Anand's (5)-(6): mu(t^e) = (-1)^e B_{2e+2}(2e+3)...(2e+7)/720 and mu(1/(t+j^2)) = j^6(X - H_j^(7)) + 1/(2j)
- 1/6) this computes Delta_K(X) = det G_K(X) EXACTLY in Q[X] and its primitive part P_K = Delta_K/cont,
the smallest integer polynomial any normalisation of this determinant can give (the paper's B.3:
Q_{K,M} = a P_K with a a positive integer). Then, for n = 1, 2, 3:

  * log P_K(zeta(7)) as an arb ball (rad < 2^-60 of the value), and log P/K^2, log P/h^2 — the TRUE
    margin of the family at that n (measured; the paper's claim is a limit in n);
  * Lemma 2.3: the leading coefficient of Delta_K equals (-1)^{h(h-1)/2} prod_{j=N+1}^K j^6 D_N(-j^2)^7;
  * Proposition 4.6: v_p(cont Delta_K) >= gamma_p^out of (59) at every prime with K/3 < p <= K that
    satisfies (52), and v_p >= 0 for p > K — a finite statement, checked exactly;
  * Proposition 6.3 (stated for EVERY K in 40Z): log F_K(zeta(7)) <= U K^2 + 24 K log K + 220 K, U = 44/25,
    F_K = S_K Delta_K with S_K of (8) — checked in arb;
  * for p in (K, 2h]: the measured v_p(cont Delta_K), beside the gamma that Table 5's last row would need.

Writes certs/zeta7-anand/measure.json. About 70 s (n = 3 is 60 of them).
usage: instruments/zetahankel/.venv/bin/python instruments/zeta7audit/measure.py [--max-n 3]"""
import sys, os, json, time, math, hashlib, platform, argparse
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ZH = os.path.join(ROOT, 'instruments', 'zetahankel')
VENV = os.path.join(ZH, '.venv', 'bin', 'python')
try:
    import flint  # noqa
except ImportError:
    if os.path.exists(VENV) and os.path.realpath(sys.executable) != os.path.realpath(VENV):
        os.execv(VENV, [VENV] + sys.argv)
    sys.exit('zeta7audit: python-flint is not importable; run `make zetahankel-venv`')
sys.path.insert(0, ZH)
sys.path.insert(0, HERE)
from flint import arb, ctx, fmpq, fmpz
sys.set_int_max_str_digits(0)
import hankel
import formulas as F

OUT = os.path.join(ROOT, 'certs', 'zeta7-anand', 'measure.json')
sha_file = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()


def down(x): return math.nextafter(x, -math.inf)
def up(x): return math.nextafter(x, math.inf)


def fingerprint(P):
    return hashlib.sha256(','.join(str(int(c.p)) for c in P.coeffs()).encode()).hexdigest()


def primes_upto(n):
    s = bytearray([1]) * (n + 1); s[0:2] = b'\x00\x00'
    for i in range(2, int(n ** 0.5) + 1):
        if s[i]:
            s[i * i::i] = bytearray(len(s[i * i::i]))
    return [i for i in range(n + 1) if s[i]]


def vp_int(z, p):
    z = abs(int(z)); v = 0
    while z and z % p == 0:
        z //= p; v += 1
    return v


def vp_q(c, p):
    return vp_int(c.p, p) - vp_int(c.q, p)


def ball_logP(P):
    coeffs = [int(c.p) for c in P.coeffs()]
    prec = max(abs(c).bit_length() for c in coeffs) + 256
    while True:
        old = ctx.prec; ctx.prec = prec
        try:
            z = arb(7).zeta(); v = arb(0)
            for c in reversed(coeffs):
                v = v * z + c
            if v > 0 and v.rad() < v.mid() * arb(2) ** -60:
                return v.log(), prec
            if v < 0:
                raise RuntimeError('P(zeta(7)) < 0: positivity violated')
        finally:
            ctx.prec = old
        prec *= 2


def measure(n):
    K, N, h = 40 * n, 3 * n, 37 * n
    t0 = time.time()
    A, B = hankel.build(7, K, N, 8, h)
    Dl = hankel.delta_poly(A, B)
    cont = hankel.content(Dl)
    P = Dl / cont
    assert all(c.q == 1 for c in P.coeffs())
    secs_det = time.time() - t0
    old = ctx.prec; ctx.prec = 256
    try:
        lP, prec = ball_logP(P)
        ctx.prec = 256
        lc = arb(fmpz(cont.p)).log() - arb(fmpz(cont.q)).log()
        lDelta = lP + lc
        # S_K = (K!)^{2h} 4^{h-1} / ((N!)^{16h} prod_{i<h} ((2i)!)^2)        (8)
        lS = 2 * h * arb(K + 1).lgamma() + (h - 1) * arb(4).log() - 16 * h * arb(N + 1).lgamma() \
            - 2 * sum((arb(2 * i + 1).lgamma() for i in range(1, h)), arb(0))
        lF = lS + lDelta
        U = arb(fmpq(44, 25))
        rhs63 = U * K * K + 24 * K * arb(K).log() + 220 * K
        prop63 = bool(lF < rhs63)
        b = lambda x: [down(float(x.lower())), up(float(x.upper()))]
        # Lemma 2.3: the leading coefficient
        lead = fmpq(1)
        sgn = -1 if (h * (h - 1) // 2) % 2 else 1
        for j in range(N + 1, K + 1):
            DN = 1
            for mm in range(1, N + 1):
                DN *= (mm * mm - j * j)
            lead *= fmpq(j ** 6 * DN ** 7)
        lemma23 = Dl.coeffs()[-1] == sgn * lead and Dl.degree() == h
        vps = []
        for p in primes_upto(2 * h):
            if 3 * p <= K:
                continue
            vp = vp_q(cont, p)
            row = dict(p=p, vp_content=vp)
            if p <= K:
                hyp52 = p >= 11 and p * p > 2 * K and 7 * N <= 2 * p - 2
                g = F.anand_gamma_out(K, N, h, p)
                row.update(hyp52=hyp52, gamma_out=g, prop46=(vp >= g) if hyp52 else None)
            else:
                y = fmpq(p, K)
                row.update(gamma_out=0, prop46=vp >= 0,
                           table5_would_need=float((fmpq(69, 5) + y) * K))
            vps.append(row)
        res = dict(n=n, K=K, N=N, h=h, k=7, r=8, deg=P.degree(),
                   P_sha256=fingerprint(P),
                   content_sha256=hashlib.sha256((str(cont.p) + '/' + str(cont.q)).encode()).hexdigest(),
                   logP=b(lP), logP_per_K2=[down(b(lP)[0] / K ** 2), up(b(lP)[1] / K ** 2)],
                   logP_per_h2=[down(b(lP)[0] / h ** 2), up(b(lP)[1] / h ** 2)],
                   log_content=b(lc), logDelta=b(lDelta), logS=b(lS), logF=b(lF), prop63_rhs=b(rhs63),
                   prop63_holds=prop63, delta_positive=bool(lDelta.mid() > -10 ** 9),
                   lemma23_leading_coefficient=bool(lemma23), eval_prec=prec,
                   vp=vps, secs=round(time.time() - t0, 1), secs_det=round(secs_det, 1))
    finally:
        ctx.prec = old
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max-n', type=int, default=3)
    a = ap.parse_args()
    rows = []
    for n in range(1, a.max_n + 1):
        r = measure(n)
        print(f"n={n} K={r['K']} h={r['h']}: log P/K^2 in [{r['logP_per_K2'][0]:.6f}, {r['logP_per_K2'][1]:.6f}], "
              f"Lemma 2.3 {r['lemma23_leading_coefficient']}, Prop 6.3 {r['prop63_holds']}, "
              f"Prop 4.6 {all(v['prop46'] is not False for v in r['vp'])}, {r['secs']} s", flush=True)
        rows.append(r)
    rec = dict(
        what="Anand's own family measured exactly: K = 40n, N = 3n, W = D_N^8/D_K, h = 37n, k = 7 — the exact "
             "primitive polynomial P_K = Delta_K/cont(Delta_K) and log P_K(zeta(7)) as an arb ball, with the paper's "
             "finite statements checked at these K (Lemma 2.3, Proposition 4.6 under (52), Proposition 6.3).",
        generatedBy='instruments/zeta7audit/measure.py', generatedOn=time.strftime('%Y-%m-%d'),
        env=dict(python=platform.python_version(), flint=flint.__version__, machine=platform.machine(), system=platform.system()),
        engine=dict(file='instruments/zetahankel/hankel.py', sha256=sha_file(os.path.join(ZH, 'hankel.py'))),
        scope='Per n: exact (Delta_K, P_K and the content are exact rationals) and ball-certified (log P_K(zeta(7))). '
              'The paper\'s Theorem 1.2 is a statement for all sufficiently large n; these three n are a MEASUREMENT of '
              'the family, not a decision of that limit.',
        rows=rows)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(rec, open(OUT, 'w'), indent=1, ensure_ascii=False)
    print('wrote', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    main()
