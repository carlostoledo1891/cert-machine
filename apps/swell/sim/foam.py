"""foam.py — how each beach usually breaks, as the satellites saw it: a MEASURED trait, not a forecast.

apps/swell/sim · cert-machine

frontier's Swell fitted per-beach "factors" from Sentinel-2 foam and reported a held-out gain (rank rho 0.56 -> 0.89);
the port's review found a no-forecast baseline — each beach's own average foam — beating it (rho 0.927). The honest
use of the same 232 passes is that baseline itself, said as what it is: in N clear passes, how much of this beach's
surf zone was white. It describes the beach (a wide, gently sloping sand beach foams more for the same sea), never the
day, and nothing is decided from it.

Input: frontier-apps experiments/swell/learn/s2/<scene>.json (one per Sentinel-2 L2A pass over tile 22JGQ, 2019-2026;
each beach's surf zone 0.4-6 m deep within 700 m: foam = share of clear pixels whose NIR is 0.06 above the scene's deep
water; clear = share not cloud, shadow or no-data). frontier's own scene rules, unchanged: passes from 2022-01-01, deep
water reflectance <= 0.035 (no glint or haze), and per beach clear >= 0.7 and its deep reference <= 0.04.

usage: python3 apps/swell/sim/foam.py [FRONTIER_LEARN_DIR]     (writes apps/swell/data/foam.json; stdlib only)
MIT licensed. Part of cert-machine.
"""
import glob, hashlib, json, os, statistics, sys

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
SRC = os.path.expanduser(sys.argv[1]) if len(sys.argv) > 1 else os.path.expanduser('~/Projects/frontier-apps/experiments/swell/learn')
KINDS = {b['name']: b['kind'] for b in json.load(open(os.path.join(APP, 'scenario', 'beaches.json')))['beaches']}


def main():
    files = sorted(glob.glob(os.path.join(SRC, 's2', '*.json')))
    man = hashlib.sha256()
    per, scenes, dates = {}, set(), []
    for f in files:
        raw = open(f, 'rb').read()
        man.update(os.path.basename(f).encode() + b' ' + hashlib.sha256(raw).hexdigest().encode() + b'\n')
        sc = json.loads(raw)
        if sc['datetime'] < '2022-01-01' or sc.get('deep_ref') is None or sc['deep_ref'] > 0.035:
            continue
        for name, v in sc['beaches'].items():
            if name not in KINDS or 'foam' not in v or v.get('clear', 0) < 0.7 or (v.get('deep') is not None and v['deep'] > 0.04):
                continue
            per.setdefault(name, []).append(v['foam'])
            scenes.add(sc['id']); dates.append(sc['datetime'][:10])
    ocean = sorted([n for n in per if KINDS[n] == 'ocean'], key=lambda n: -statistics.median(per[n]))
    out = {}
    for name, v in per.items():
        out[name] = {'n': len(v), 'median': round(statistics.median(v), 3), 'mean': round(statistics.mean(v), 3),
                     'q25': round(statistics.quantiles(v, n=4)[0], 3), 'q75': round(statistics.quantiles(v, n=4)[2], 3)}
        if name in ocean:
            out[name]['rankOcean'] = ocean.index(name) + 1
    doc = {
        'what': ('How much of each beach\'s surf zone was white foam in clear Sentinel-2 passes: a MEASURED trait of the beach '
                 '(its shape and exposure together), not a forecast and never decided. sim/foam.py, frontier\'s scene rules.'),
        'licence': 'Contains modified Copernicus Sentinel data 2022-2026 (free and open; ESA/Copernicus), read from the Element84 earth-search COGs on AWS Open Data.',
        'rule': 'passes from 2022-01-01; deep-water NIR <= 0.035; per beach clear >= 0.7 and deep reference <= 0.04',
        'scenes': len(scenes), 'from': min(dates), 'to': max(dates), 'oceanBeaches': len(ocean),
        'source': {'dir': 'frontier-apps experiments/swell/learn/s2 (2026-10-06)', 'files': len(files), 'manifestSha256': man.hexdigest()},
        'beaches': dict(sorted(out.items())),
    }
    p = os.path.join(APP, 'data', 'foam.json')
    with open(p, 'w') as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write('\n')
    print(f'wrote {os.path.relpath(p)}: {len(out)} beaches, {len(scenes)} scenes {min(dates)}..{max(dates)}; most foam: ' +
          ', '.join(f'{n} {out[n]["median"]:.2f}' for n in ocean[:3]))


if __name__ == '__main__':
    main()
