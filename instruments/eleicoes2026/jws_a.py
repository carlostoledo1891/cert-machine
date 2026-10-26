#!/usr/bin/env python3
"""instruments/eleicoes2026/jws_a.py — verifier A of the TSE's signed results (compact JWS, EdDSA over Ed25519): RFC 8032
verification written from the RFC in integers, standard library only (hashlib.sha512), no code shared with verifier B
(jws_b.js, Node's crypto). For each pinned …-u.jws it decides: the signature verifies under the TSE's key; the signed
payload parses to the same JSON as the …-u.json the site serves.

usage: python3 instruments/eleicoes2026/jws_a.py"""
import base64
import hashlib
import json
import os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SIGNED = os.environ.get('ELEICOES_SIGNED') or os.path.join(ROOT, 'corpus', 'eleicoes2026', 'signed')   # the env: the red control's tampered copy
# the verifying key embedded in the TSE's results app (resultados.tse.jus.br/oficial/app/main.*.js), JWK kid below
KID = 'sNbt9Q_fLS65zE1_ZLNV-XRRwPY'
X = 'kWlpNHjuws1csyQZwzn3Fhzbi3RD435RbpThtSr4hMc'

P = 2 ** 255 - 19
L = 2 ** 252 + 27742317777372353535851937790883648493
D = -121665 * pow(121666, P - 2, P) % P
I = pow(2, (P - 1) // 4, P)


def b64(s):
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))


def recover_x(y, sign):
    xx = (y * y - 1) * pow(D * y * y + 1, P - 2, P)
    x = pow(xx, (P + 3) // 8, P)
    if (x * x - xx) % P:
        x = x * I % P
    if (x * x - xx) % P:
        return None
    if x % 2 != sign:
        x = P - x
    return x


def decode_point(b):
    y = int.from_bytes(b, 'little')
    sign = y >> 255
    y &= (1 << 255) - 1
    if y >= P:
        return None
    x = recover_x(y, sign)
    if x is None or (x == 0 and sign):
        return None
    return (x, y, 1, x * y % P)


def add(p, q):
    a = (p[1] - p[0]) * (q[1] - q[0]) % P
    b = (p[1] + p[0]) * (q[1] + q[0]) % P
    c = 2 * p[3] * q[3] * D % P
    d = 2 * p[2] * q[2] % P
    e, f, g, h = b - a, d - c, d + c, b + a
    return (e * f % P, g * h % P, f * g % P, e * h % P)


def mul(s, p):
    q = (0, 1, 1, 0)
    while s:
        if s & 1:
            q = add(q, p)
        p = add(p, p)
        s >>= 1
    return q


def eq(p, q):
    return (p[0] * q[2] - q[0] * p[2]) % P == 0 and (p[1] * q[2] - q[1] * p[2]) % P == 0


BY = 4 * pow(5, P - 2, P) % P
B = (recover_x(BY, 0), BY, 1, recover_x(BY, 0) * BY % P)


def verify(pub, msg, sig):
    if len(sig) != 64:
        return False
    a, r = decode_point(pub), decode_point(sig[:32])
    s = int.from_bytes(sig[32:], 'little')
    if a is None or r is None or s >= L:
        return False
    k = int.from_bytes(hashlib.sha512(sig[:32] + pub + msg).digest(), 'little') % L
    return eq(mul(s, B), add(r, mul(k, a)))


def main():
    pub = b64(X)
    out = {}
    for name in sorted(n for n in os.listdir(SIGNED) if n.endswith('.jws')):
        h, p, s = open(os.path.join(SIGNED, name)).read().strip().split('.')
        head = json.loads(b64(h))
        ok = head.get('alg') == 'EdDSA' and head.get('kid') == KID and verify(pub, (h + '.' + p).encode('ascii'), b64(s))
        same = json.loads(b64(p)) == json.load(open(os.path.join(SIGNED, name[:-4] + '.json')))
        out[name] = {'signature': ok, 'payload_is_served_json': same}
    print(json.dumps(out, indent=1, sort_keys=True))


if __name__ == '__main__':
    main()
