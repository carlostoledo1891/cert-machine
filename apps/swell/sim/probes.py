"""probes.py — every beach placed on the island model, with the probes the breaking height is read at.

apps/swell/sim · cert-machine

WHAT IT DOES. The island model (sim/island.py; the 64 cases were solved in frontier-apps on 2026-10-06 and are
pinned by sha256 in data/PINS.json, see `sources` there) gives, for a unit swell from each of 16 directions at each
of 4 periods, K = Hs here / Hs offshore on a 30 m grid of the whole island. This script reads, for every beach of
scenario/beaches.json:
  · the anchor: the nearest sea cell to the beach's OpenStreetMap centre (or its hand-placed point);
  · seaward: which way the beach faces (the mean gradient of distance-to-land over the sea within 500 m);
  · the PROBES: the nearest sea cell at each target depth, 1, 2, 3, 4.5, 6.5 m (within 35% of the depth and
    500 m, else 50% and 900 m — frontier's rule) and 8.5 m (within 20% and 1,500 m, else 30% and 2,500 m) and
    11 m (20% and 2,000 m, else 30% and 3,000 m), and K at each probe for every case;
  · ang: the direction the waves travel toward at the deepest probe of at most 6.5 m (for the longshore current),
    null where the case's central ray family never reached the cell;
  · fetch: metres of water up-wind for a wind from i * 22.5 deg (-1: open sea), for the bays' own chop;
  · edges: km from the anchor to the box's north, south and west edges where those edges cross the sea (the
    model's side edges carry an unrefracted plane wave; beaches too near them are refused by model/surf.js).

WHY THE DEEPER PROBES (the port's fix). frontier's probes stopped at 6.5 m and its breaking height was
max over probes of min(K H, 0.55 h): 14 of 21 ocean beaches had no probe deeper than 4.5 m and could never read
more than 0.55 x 4.5 = 2.5 m, whatever the sea did. With probes to 11 m the breaking point is found by marching
in from the deepest probe (model/surf.js). Measured 2026-10-08: every one of the 21 ocean beaches now has a probe
at 8.8 m or deeper (16 at 8.8-8.9 m, five at 9.2-13.1 m), so the cap rises from 2.3-3.6 m to 4.9-7.2 m.

usage: python apps/swell/sim/probes.py FRONTIER_ISLAND_DIR      (writes apps/swell/data/beaches.json)
       FRONTIER_ISLAND_DIR = ~/Projects/frontier-apps/experiments/swell/island (read only)
needs numpy and scipy. Deterministic: same inputs, same bytes.  MIT licensed. Part of cert-machine.
"""
import hashlib, json, math, os, sys
import numpy as np
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
SRC = os.path.expanduser(sys.argv[1]) if len(sys.argv) > 1 else os.path.expanduser('~/Projects/frontier-apps/experiments/swell/island')
GRID = json.load(open(os.path.join(APP, 'data', 'island', 'index.json')))['grid']
NX, NY, DX, MX, MY = GRID['nx'], GRID['ny'], GRID['dx'], GRID['mx'], GRID['my']
LON0, LAT0, LON1, LAT1 = GRID['lon'][0], GRID['lat'][0], GRID['lon'][1], GRID['lat'][1]

DIRS = [i * 22.5 for i in range(16)]
PERIODS = [6, 9, 12, 15]
# (target depth m, tolerance, radius m, fallback tolerance, fallback radius m): frontier's five, then two deeper
# ones searched farther out but held to a tighter depth tolerance, so the probes stay ordered by depth
TARGETS = [(1.0, .35, 500, .5, 900), (2.0, .35, 500, .5, 900), (3.0, .35, 500, .5, 900), (4.5, .35, 500, .5, 900),
           (6.5, .35, 500, .5, 900), (8.5, .2, 1500, .3, 2500), (11.0, .2, 2000, .3, 3000)]
ANG_MAX_H = 6.5


def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()


def cell(lon, lat): return (lat - LAT0) * MY / DX - 0.5, (lon - LON0) * MX / DX - 0.5
def lonlat(r, c): return LON0 + (c + 0.5) * DX / MX, LAT0 + (r + 0.5) * DX / MY
def key(d, T): return f'{d:g}/{T}'


def main():
    dep = np.load(os.path.join(SRC, 'depth.npz'))
    H = dep['h'].astype(np.float64); LAND = dep['land']; SEA = ~LAND; Hn = np.nan_to_num(H)
    assert H.shape == (NY, NX), (H.shape, NY, NX)
    osm = json.load(open(os.path.join(SRC, 'osm-pois.json')))['elements']
    centre = {}
    for e in osm:
        t = e.get('tags', {})
        if t.get('natural') == 'beach' and t.get('name'):
            c = e.get('center') or {'lat': e.get('lat'), 'lon': e.get('lon')}
            if c.get('lat') is not None: centre.setdefault(t['name'], (c['lon'], c['lat']))
    dist_land = ndimage.distance_transform_edt(SEA) * DX
    gy, gx = np.gradient(dist_land)
    _, (nsr, nsc) = ndimage.distance_transform_edt(LAND, return_indices=True)
    cases, pins = {}, {}
    for T in PERIODS:
        for d in DIRS:
            f = os.path.join(SRC, 'cases', f'K-{d:05.1f}-{T:02d}.npz')
            z = np.load(f)
            cases[(d, T)] = (z['K'], z['phi'], z['ang'])
            pins[os.path.basename(f)] = sha256(f)
    pins['depth.npz'] = sha256(os.path.join(SRC, 'depth.npz'))
    pins['osm-pois.json'] = sha256(os.path.join(SRC, 'osm-pois.json'))

    # the side edges that cross the sea, and where: for each edge, the sea cells on it
    edge_sea = {'N': SEA[NY - 1, :], 'S': SEA[0, :], 'W': SEA[:, 0]}

    scen = json.load(open(os.path.join(APP, 'scenario', 'beaches.json')))['beaches']
    out = []
    for B in scen:
        name, kind = B['name'], B['kind']
        lon, lat = (centre.get(B['osm']) if B.get('osm') else None) or tuple(B.get('point') or (None, None))
        if lon is None: raise SystemExit(f'no position for {name}')
        r0, c0 = cell(lon, lat); ri, ci = int(round(r0)), int(round(c0))
        if 0 <= ri < NY and 0 <= ci < NX and LAND[ri, ci]:
            ri, ci = int(nsr[ri, ci]), int(nsc[ri, ci]); r0, c0 = float(ri), float(ci)
        alon, alat = lonlat(ri, ci)
        rec = dict(name=name, kind=kind, region=B['region'], lon=round(lon, 5), lat=round(lat, 5),
                   anchor=[round(alon, 5), round(alat, 5)])
        # distance to the side edges that cross the sea, km (null: that edge is land all along, or far)
        edges = {}
        for k, m in edge_sea.items():
            if not m.any(): edges[k] = None; continue
            if k == 'N': idx = np.nonzero(m)[0]; dd = np.hypot((NY - 1 - ri), (idx - ci)) * DX
            elif k == 'S': idx = np.nonzero(m)[0]; dd = np.hypot(ri, (idx - ci)) * DX
            else: idx = np.nonzero(m)[0]; dd = np.hypot((idx - ri), ci) * DX
            edges[k] = round(float(dd.min()) / 1000, 2)
        rec['edges'] = edges
        if kind != 'lagoon':
            # frontier's window (+-600 m: pack.py's R, which also bounds its 900 m fallback) for its five targets, so
            # those probes are frontier's own cell for cell (tie-breaking by flattened order depends on the window);
            # a +-3,000 m window for the two deeper ones
            def window(R):
                sub = (slice(max(0, ri - R), min(NY, ri + R + 1)), slice(max(0, ci - R), min(NX, ci + R + 1)))
                rr, cc = np.mgrid[sub]
                return sub, rr, cc, np.hypot(rr - r0, cc - c0) * DX
            WIN = {600: window(int(600 / DX)), 3000: window(int(3000 / DX))}
            sub, rr, cc, dd = WIN[600]
            m = SEA[sub] & (dd < 500)
            if m.any():
                vx, vy = gx[sub][m].mean(), gy[sub][m].mean()
                rec['seaward'] = round((math.degrees(math.atan2(vx, vy)) + 360) % 360, 1)
            probes = []
            for target, tol, near, tol2, far in TARGETS:
                sub, rr, cc, dd = WIN[600 if target <= 6.5 else 3000]
                sea = SEA[sub]; hh = Hn[sub]
                cand = sea & (np.abs(hh - target) < tol * target) & (dd < near)
                if not cand.any(): cand = sea & (np.abs(hh - target) < tol2 * target) & (dd < far)
                if not cand.any(): continue
                k = int(np.argmin(np.where(cand, dd, 1e9))); pr, pc = int(rr.ravel()[k]), int(cc.ravel()[k])
                if any(p['rc'] == [pr, pc] for p in probes): continue
                plon, plat = lonlat(pr, pc)
                probes.append(dict(h=round(float(Hn[pr, pc]), 2), rc=[pr, pc], lon=round(plon, 5), lat=round(plat, 5),
                                   m=int(round(float(np.hypot(pr - r0, pc - c0)) * DX))))
            probes.sort(key=lambda p: p['h'])
            rec['probes'] = probes
            if not probes: print('  no surf-zone probes for', name)
            angp = max([i for i, p in enumerate(probes) if p['h'] <= ANG_MAX_H], default=None)
            rec['angProbe'] = angp
            rec['K'], rec['ang'] = {}, {}
            for (d, T), (K, phi, ang) in cases.items():
                rec['K'][key(d, T)] = [round(float(K[p['rc'][0], p['rc'][1]]), 3) for p in probes]
                if angp is not None:
                    p = probes[angp]; r, c = p['rc']
                    rec['ang'][key(d, T)] = None if not np.isfinite(phi[r, c]) else round(float(np.degrees(float(ang[r, c]))) % 360, 1)
            fetch = []
            src = probes[1] if len(probes) > 1 else (probes[0] if probes else None)
            for i in range(16):
                if not src: fetch.append(0); continue
                th = math.radians(i * 22.5); ux, uy = math.sin(th), math.cos(th)
                r, c, dist, val = float(src['rc'][0]), float(src['rc'][1]), 0.0, -1
                while dist < 60000:
                    r += uy; c += ux; dist += DX
                    ir, ic = int(round(r)), int(round(c))
                    if ir < 0 or ir >= NY or ic < 0 or ic >= NX: val = -1; break
                    if LAND[ir, ic]: val = int(dist); break
                fetch.append(val)
            rec['fetch'] = fetch
            for p in probes: del p['rc']
        out.append(rec)
        print(f"  {name:24s} {kind:6s} seaward {rec.get('seaward', '-')!s:>6} probes {[p['h'] for p in rec.get('probes', [])]} "
              f"edges {edges}")
    doc = dict(
        what=('The island model per beach (sim/probes.py). K[dir/T][probe] = Hs at the probe / Hs offshore for a swell from '
              'dir (deg) of period T (s), linear (breaking is applied by model/surf.js when the forecast is known); probes '
              'sorted by depth h (m), m = metres from the anchor; ang[dir/T] = the direction the waves travel TOWARD at '
              'probe angProbe (deg), null where the central ray family never reached it; fetch[i] = metres of water up-wind '
              'for a wind from i*22.5 deg (-1 = open sea); edges = km to the box side edges that cross the sea.'),
        licence='Depths and K derive from DHN nautical chart 1902 (Marinha do Brasil): non-commercial, NOT FOR NAVIGATION — see data/LICENSE-DHN.md.',
        dirs=DIRS, periods=PERIODS, grid=GRID, sources=dict(dir='frontier-apps experiments/swell/island (2026-10-06)', sha256=pins),
        beaches=out)
    p = os.path.join(APP, 'data', 'beaches.json')
    with open(p, 'w') as f: json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', p, os.path.getsize(p) // 1000, 'kB')


if __name__ == '__main__':
    main()
