#!/usr/bin/env python3
"""tools/eleicoes2026/logs_r2.py — every urn's log of round 2 (25 Oct 2026), read from the TSE's results site
(arquivo-urna), reduced to what the extension question needs, section by section:

  ready     the local time the urn logged "Urna pronta para receber votos" (the scheduled 8:00 Brasília, in local time)
  votes     how many "O voto do eleitor foi computado" events the log holds for 25/10/2026
  late      how many of them came after the legal close: ready-hour + 9 h (17:00 Brasília in the urn's own clock)
  close     the local time of "Procedimento de encerramento confirmado"
  sha256    of the log.jez as fetched (the file the TSE serves for that section)

One line per section, appended to corpus/eleicoes2026/derived/r2-logs-<UF>.tsv; a section already in the file is not
fetched again, so the crawl resumes. The log is read in memory and not kept (about 160 KB a section, ~80 GB in all).

usage: python3 tools/eleicoes2026/logs_r2.py AC [AL …] [--workers 32]"""
import concurrent.futures as cf
import hashlib
import io
import json
import os
import sys
import time
import urllib.request
import zipfile

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUT = os.path.join(ROOT, 'corpus', 'eleicoes2026', 'derived')
SITE = 'https://resultados.tse.jus.br/oficial/ele2026/arquivo-urna/3221'
DAY = '25/10/2026'


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'cert-machine (carlostoledo.co)'})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(2 ** i)


def logs_in(b, depth=0):
    """every logd.dat in a log.jez: the urn's own, and, when an urn was replaced, the earlier urn's log nested inside
    as another .jez (read too, so votes cast before the replacement are counted)"""
    out = []
    with zipfile.ZipFile(io.BytesIO(b)) as z:
        for n in z.namelist():
            if n.endswith('logd.dat'):
                out.append(z.read(n).decode('latin-1'))
            elif n.endswith('.jez') and depth < 2:
                out += logs_in(z.read(n), depth + 1)
    return out


def section(uf, mun, zona, sec):
    stem = f'p003221-{uf}-m{mun}-z{zona}-s{sec}'
    aux = json.loads(get(f'{SITE}/dados/{uf}/{mun}/{zona}/{sec}/{stem}-aux.json'))
    rows = []
    for h in aux.get('hashes', []):
        logs = [a['nm'] for a in h['arq'] if a['tp'] == 'log']
        if not logs:
            continue
        b = get(f'{SITE}/dados/{uf}/{mun}/{zona}/{sec}/{h["hash"]}/{logs[0]}')
        sha = hashlib.sha256(b).hexdigest()
        text = '\n'.join(logs_in(b))
        ready, close, times = None, None, []
        for line in text.split('\n'):
            if not line.startswith(DAY):
                continue
            f = line.split('\t')
            if len(f) < 5:
                continue
            t, msg = f[0][11:19], f[4]
            if msg == 'O voto do eleitor foi computado':
                times.append(t)
            elif msg == 'Urna pronta para receber votos' and ready is None:
                ready = t
            elif msg == 'Procedimento de encerramento confirmado':
                close = t
        late = None
        if ready:
            limit = f'{int(ready[:2]) + 9:02d}:00:00'
            late = sum(1 for t in times if t >= limit)
        rows.append([uf, mun, zona, sec, h['hash'][:16], h.get('st', ''), ready or '', close or '', str(len(times)),
                     '' if late is None else str(late), sha])
    if not rows:
        rows.append([uf, mun, zona, sec, '', aux.get('st', ''), '', '', '', '', ''])
    return rows


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    workers = int(sys.argv[sys.argv.index('--workers') + 1]) if '--workers' in sys.argv else 32
    if '--workers' in sys.argv:
        args.remove(str(workers))
    for UF in args:
        uf = UF.lower()
        cs = json.loads(get(f'{SITE}/config/{uf}/{uf}-p003221-cs.json'))
        todo = [(uf, m['cd'], z['cd'], s['ns']) for a in cs['abr'] for m in a['mu'] for z in m['zon'] for s in z['sec']]
        path = os.path.join(OUT, f'r2-logs-{UF.upper()}.tsv')
        done = set()
        if os.path.exists(path):
            done = {tuple(l.split('\t')[:4]) for l in open(path)}
        todo = [t for t in todo if t not in done]
        t0, n = time.time(), 0
        with open(path, 'a') as f, cf.ThreadPoolExecutor(workers) as ex:
            futs = {ex.submit(section, *t): t for t in todo}
            for fu in cf.as_completed(futs):
                try:
                    for r in fu.result():
                        f.write('\t'.join(r) + '\n')
                except Exception as e:
                    print(f'{futs[fu]}: {e}', file=sys.stderr)
                n += 1
                if n % 2000 == 0:
                    f.flush()
                    print(f'{UF}: {n:,}/{len(todo):,} sections, {n / (time.time() - t0):.0f}/s', file=sys.stderr, flush=True)
        print(f'{UF}: {len(todo):,} sections read in {time.time() - t0:.0f} s -> {os.path.relpath(path, ROOT)}', flush=True)


if __name__ == '__main__':
    main()
