#!/usr/bin/env python3
"""tools/eleicoes2026/fetch_signed.py — the TSE's signed presidential results for both rounds: for Brazil, each UF and
abroad (ZZ), the results JSON the TSE's results site reads (…-u.json) and its signed twin (…-u.jws: a compact JWS,
EdDSA/Ed25519, whose payload is the JSON). Saved to corpus/eleicoes2026/signed/ (small, committed) and pinned by
sha256 in corpus/eleicoes2026/SIGNED-PINS.json. The verifying key is the one the TSE's own results app embeds.

usage: python3 tools/eleicoes2026/fetch_signed.py"""
import hashlib
import json
import os
import time
import urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'signed')
PINS = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'SIGNED-PINS.json')
BASE = 'https://resultados.tse.jus.br/oficial/ele2026/{e}/dados/{a}/{a}-c0001-e{e6}-u.{x}'
UFS = ['br', 'zz', 'ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi',
       'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to']
ELECTIONS = {'6257': 'round 1', '6258': 'round 2'}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'cert-machine (carlostoledo.co)'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    os.makedirs(OUT, exist_ok=True)
    pins = {'what': __doc__.splitlines()[0], 'read': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'files': {}}
    for e in ELECTIONS:
        for a in UFS:
            for x in ('json', 'jws'):
                url = BASE.format(e=e, a=a, e6=e.zfill(6), x=x)
                b = get(url)
                name = f'{e}-{a}.{x}'
                open(os.path.join(OUT, name), 'wb').write(b)
                pins['files'][name] = {'url': url, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}
    json.dump(pins, open(PINS, 'w'), indent=1, sort_keys=True)
    print(f'{len(pins["files"])} signed-result files pinned in {os.path.relpath(PINS, ROOT)}')


if __name__ == '__main__':
    main()
