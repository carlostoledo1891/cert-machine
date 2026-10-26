#!/usr/bin/env python3
"""tools/eleicoes2026/fetch.py — the TSE's open-data files for the 2026 presidential election, downloaded, checked against
the .sha512 the TSE publishes beside each file, and pinned in corpus/eleicoes2026/PINS.json (URL, size, sha512, the
date read). The bytes live in corpus/eleicoes2026/raw/ (git-ignored: 4.8 GB for round 1 alone); the pins are committed,
so anyone can fetch the same bytes and check them.

usage: python3 tools/eleicoes2026/fetch.py bweb 1        round 1 BU na Web, every UF and ZZ (abroad)
       python3 tools/eleicoes2026/fetch.py bweb 2        round 2, once the TSE publishes it (the name is read from the
                                                        open-data catalogue, never guessed)"""
import hashlib
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAW = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'raw')
PINS = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'PINS.json')
API = 'https://dadosabertos.tse.jus.br/api/3/action/package_show?id='


def get(url, path=None):
    req = urllib.request.Request(url, headers={'User-Agent': 'cert-machine (carlostoledo.co)'})
    with urllib.request.urlopen(req, timeout=600) as r:
        if path is None:
            return r.read()
        h, n = hashlib.sha512(), 0
        with open(path + '.part', 'wb') as f:
            while True:
                b = r.read(1 << 20)
                if not b:
                    break
                f.write(b)
                h.update(b)
                n += len(b)
        os.replace(path + '.part', path)
        return h.hexdigest(), n


def catalogue(package, prefix):
    d = json.loads(get(API + package))['result']
    return [r['url'] for r in d['resources'] if r['url'].split('/')[-1].startswith(prefix) and r['url'].endswith('.zip')]


def main():
    kind, rnd = sys.argv[1], sys.argv[2]
    assert kind == 'bweb' and rnd in ('1', '2')
    os.makedirs(RAW, exist_ok=True)
    pins = json.load(open(PINS)) if os.path.exists(PINS) else {'what': __doc__.splitlines()[0], 'files': {}}
    urls = catalogue('resultados-2026-boletim-de-urna', f'bweb_{rnd}t_')
    if not urls:
        sys.exit(f'round {rnd}: no BU file in the TSE open-data catalogue yet')
    for url in sorted(urls):
        name = url.split('/')[-1]
        path = os.path.join(RAW, name)
        want = get(url + '.sha512').decode().split()[0].lower()
        if os.path.exists(path) and pins['files'].get(name, {}).get('sha512') == want:
            continue
        got, size = get(url, path)
        if got != want:
            sys.exit(f'{name}: sha512 {got[:16]}… is not the TSE\'s {want[:16]}…')
        pins['files'][name] = {'url': url, 'bytes': size, 'sha512': got, 'read': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
        print(f'{name}: {size:,} bytes, sha512 matches the TSE\'s', flush=True)
        json.dump(pins, open(PINS, 'w'), indent=1, sort_keys=True)
    print(f'round {rnd}: {len(urls)} files pinned in {os.path.relpath(PINS, ROOT)}')


if __name__ == '__main__':
    main()
