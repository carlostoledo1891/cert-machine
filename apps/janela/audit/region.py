"""region.py — the paths of one measured region, from apps/janela/scenario/regions.json (ONE definition).

apps/janela/audit · cert-machine

    JANELA_REGION=sergipe python archive.py pack      (and matchups.py, alpha.py)

Without JANELA_REGION every script keeps its own paths of 2026-10-06 (the eight open-sea
sites); with it, each reads and writes only the region's chain and only the region's sites,
so a region is added without rewriting a byte of the records that came before it.

MIT licensed. Part of cert-machine.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))


def current():
    """the region named by JANELA_REGION, with absolute paths; None when unset."""
    name = os.environ.get('JANELA_REGION')
    if not name:
        return None
    regions = json.load(open(os.path.join(HERE, '..', 'scenario', 'regions.json')))['regions']
    if name not in regions:
        raise SystemExit(f'REFUSED: no region {name!r} in apps/janela/scenario/regions.json')
    r = dict(regions[name], name=name)
    for k in ('cache', 'pack', 'matchups', 'bands', 'alpha'):
        r[k + 'Rel'] = r[k]
        r[k] = os.path.join(ROOT, r[k])
    return r
