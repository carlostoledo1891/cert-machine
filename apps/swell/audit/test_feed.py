"""test_feed.py — the battery of Swell's day files (swell-feed-1). Offline: no network.

apps/swell/audit · cert-machine

    apps/janela/.venv/bin/python apps/swell/audit/test_feed.py [FILE]     default FILE: the newest corpus/swell/feed/*.json.gz

The steps and the wind grid; the schema (feed.check_day, the one definition the writer also runs) on a
hand-made day and on the written day; RED controls that MUST be refused (a missing step, a float where an
exact fraction belongs, a forged wind enclosure, an ocean block changed after its pin, ...); and, where
Janela's own feeds for the same run are on disk (corpus/janela/feed, corpus/janela/feed-noaa), the floripa
values equal to Janela's at every lead the two share — the same sources read by the same code must agree.

MIT licensed. Part of cert-machine.
"""
import copy
import glob
import gzip
import importlib.util
import json
import os
import sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
# loaded under its own name: `feed` is Janela's module (noaa.py imports it by that name)
_spec = importlib.util.spec_from_file_location('swell_feed', os.path.join(HERE, 'feed.py'))
F = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(F)

ok, bad, notes = [], [], []


def test(name, fn, red=False):
    try:
        fn()
        (bad if red else ok).append(name)
    except (ValueError, AssertionError, KeyError, TypeError) as e:
        (ok if red else bad).append(name + ('' if red else f' ({type(e).__name__}: {e})'))


def synth(run='2026100700'):
    """a hand-made day that is swell-feed-1 in every respect (values invented, shapes exact)"""
    r = datetime.strptime(run, '%Y%m%d%H').replace(tzinfo=timezone.utc)
    t = lambda h: (r + timedelta(hours=h)).strftime('%Y-%m-%dT%H')   # noqa: E731
    S = F.STEPS
    oc = {'source': {'product': 'x'}, 'node': [-27.5833, -48.3333], 'times': [t(h) for h in range(F.OCEAN_HOURS + 1)],
          'level': ['0.123'] * (F.OCEAN_HOURS + 1), 'tide': ['-0.045'] * (F.OCEAN_HOURS + 1), 'sst': ['19.25'] * (F.OCEAN_HOURS + 1)}
    return {
        'what': 'a hand-made day', 'licence': 'none', 'v': F.V, 'run': run, 'madeAt': '2026-10-08T00:00:00+00:00', 'steps': list(S),
        'ecmwf': {'floripa': {'node': [-27.5, -48.25], 'steps': [
            {'t': t(h), 'lead': h, 'hs': {'det': '137/100'}, 'mwd': '90', 'tp': '10', 'mwp': '8',
             'wind': {'u': '3', 'v': '-4', 'speedLo': '5', 'speedHi': '5', 'gust': '7'}} for h in S]}},
        'noaa': {'floripa': {'node': [-27.5, -48.25], 'steps': [
            {'t': t(h), 'lead': h, 'hs': {'det': '13/10'}, 'perpw': '9', 'dirpw': '100',
             'wind': {'u': '3', 'v': '4', 'speedLo': '5', 'speedHi': '5'}, 'sea': None,
             'swell': [{'hs': '1', 'per': '12', 'dir': '135'}, None, None]} for h in S]}},
        'gust': {'param': ['10fg'] * len(S), 'window': ['0'] * len(S), 'note': ''},
        'wind': {'nodes': [list(n) for n in F.WIND_NODES], 'steps': [
            {'t': t(h), 'lead': h, 'u': ['1/2'] * 16, 'v': ['-1/4'] * 16, 'gust': ['3'] * 16, 't2m': ['589/2'] * 16, 'tp': ['0'] * 16} for h in S]},
        'ocean': oc,
        'pins': {'ecmwf': [{'stream': s, 'step': h, 'url': 'https://x', 'sha256': '0' * 64} for s in ('wave', 'oper') for h in S],
                 'noaa': [{'step': h, 'url': 'https://x', 'sha256': '1' * 64} for h in S],
                 'ocean': {'sha256': F.ocean_sha(oc)}},
    }


def forged(fn):
    """a copy of the hand-made day with one thing changed, put to the schema"""
    d = synth()
    fn(d)
    return F.check_day(d)


def at(d, prov, lead):
    return next(s for s in d[prov]['floripa']['steps'] if s['lead'] == lead)


# ---------------------------------------------------------------- what needs no file

def t_steps():
    assert F.STEPS == list(range(0, 145, 3)) + [150, 156, 162, 168] and len(F.STEPS) == 53 and 147 not in F.STEPS
test('the steps: every 3 h to 144 h, then 150, 156, 162, 168 (53; no 147 h: ECMWF\'s wave stream has none)', t_steps)


def t_grid():
    lats = sorted({n[0] for n in F.WIND_NODES})
    lons = sorted({n[1] for n in F.WIND_NODES})
    assert lats == [-28.0, -27.75, -27.5, -27.25] and lons == [-48.75, -48.5, -48.25, -48.0] and len(F.WIND_NODES) == 16
    for la in (-27.93, -27.30):            # the island box: every corner within half a cell (0.125 deg) of a node
        for lo in (-48.76, -48.06):
            assert min(abs(la - x) for x in lats) <= 0.125 and min(abs(lo - x) for x in lons) <= 0.125
test('the wind grid: 16 nodes, lat -28.0..-27.25 x lon -48.75..-48.0, every corner of the island box within half a cell', t_grid)


def t_frac():
    for s in ('376505419/268435456', '0', '-7/20', '-29', '82231/32768'):
        assert F.is_fraction(s), s
test('exact fraction strings are recognised (n, -n, n/d in lowest terms)', t_frac)
test('RED "1.37" (a decimal, not an exact fraction) is refused', lambda: [F.is_fraction('1.37') or (_ for _ in ()).throw(ValueError('no'))], red=True)
test('RED "2/4" (not in lowest terms) is refused', lambda: [F.is_fraction('2/4') or (_ for _ in ()).throw(ValueError('no'))], red=True)

test('a hand-made day passes the schema', lambda: F.check_day(synth()))


def null_ocean(d):
    d['ocean'] = None
    d['pins']['ocean'] = None
test('a day with "ocean": null passes (the ocean block is display-only)', lambda: forged(null_ocean))
test('RED a feed missing an ECMWF step (+30 h) is refused', lambda: forged(lambda d: d['ecmwf']['floripa']['steps'].pop(10)), red=True)
test('RED a feed missing a NOAA step (+168 h) is refused', lambda: forged(lambda d: d['noaa']['floripa']['steps'].pop()), red=True)
test('RED a feed missing a wind step is refused', lambda: forged(lambda d: d['wind']['steps'].pop(0)), red=True)
test('RED a steps list with 147 h added is refused', lambda: forged(lambda d: d['steps'].insert(49, 147)), red=True)
test('RED Hs as a decimal string "1.37" instead of an exact fraction is refused', lambda: forged(lambda d: at(d, 'ecmwf', 24)['hs'].update(det='1.37')), red=True)
test('RED Hs as a JSON float 1.37 is refused', lambda: forged(lambda d: at(d, 'noaa', 24)['hs'].update(det=1.37)), red=True)
test('RED a wind node value as a float string is refused', lambda: forged(lambda d: d['wind']['steps'][5]['u'].__setitem__(3, '0.5')), red=True)
test('RED a speed enclosure that does not hold (speedHi 4 for |(3, -4)| = 5) is refused', lambda: forged(lambda d: at(d, 'ecmwf', 6)['wind'].update(speedHi='4')), red=True)
test('RED a step at the wrong hour (+12 h stamped 13 UTC) is refused', lambda: forged(lambda d: at(d, 'ecmwf', 12).update(t='2026-10-07T13')), red=True)
test('RED an ensemble key in hs (the Swell feed is deterministic) is refused', lambda: forged(lambda d: at(d, 'ecmwf', 0)['hs'].update(lo='1')), red=True)
test('RED an ocean value changed after its pin is refused', lambda: forged(lambda d: d['ocean']['level'].__setitem__(7, '0.124')), red=True)
test('RED an sst with 3 decimals (more than the record keeps) is refused', lambda: forged(lambda d: d['ocean']['sst'].__setitem__(0, '19.250')), red=True)
test('RED the ocean key absent (null is allowed, absence is not) is refused', lambda: forged(lambda d: d.pop('ocean')), red=True)
test('RED a NOAA pin missing is refused', lambda: forged(lambda d: d['pins']['noaa'].pop(3)), red=True)
test('RED a pin that is not a sha256 is refused', lambda: forged(lambda d: d['pins']['ecmwf'][0].update(sha256='abc')), red=True)


# ---------------------------------------------------------------- the written day, and Janela's own feeds of its run

ECMWF_KEYS = (('hs', 'det'), ('mwd',), ('tp',), ('wind', 'u'), ('wind', 'v'), ('wind', 'speedLo'), ('wind', 'speedHi'))
NOAA_KEYS = (('hs', 'det'), ('perpw',), ('dirpw',), ('wind',), ('sea',), ('swell',))


def get(s, path):
    for k in path:
        s = s[k]
    return s


def compare(day, jday, prov, keys):
    """every Janela floripa step equals Swell's at the same lead, key by key; returns (leads, gusts Janela lacks)"""
    jrun = day['run'][:4] + '-' + day['run'][4:6] + '-' + day['run'][6:8] + 'T' + day['run'][8:]
    assert jday['run'] == jrun, f'Janela run {jday["run"]} is not {jrun}'
    j, s = jday['sites']['floripa'], day[prov]['floripa']
    assert j['node'] == s['node'], f'{prov} node: Janela {j["node"]}, Swell {s["node"]}'
    by = {x['lead']: x for x in s['steps']}
    leads, nogust = [], []
    for js in j['steps']:
        assert js['lead'] in by, f'{prov}: Swell has no +{js["lead"]} h'
        sw = by[js['lead']]
        assert sw['t'] == js['t'], f'{prov} +{js["lead"]} h: t {sw["t"]} vs {js["t"]}'
        for path in keys:
            a, b = get(js, path), get(sw, path)
            assert a == b, f'{prov} +{js["lead"]} h {".".join(path)}: Janela {a!r}, Swell {b!r}'
        if prov == 'ecmwf':
            if js['wind']['gust'] is None:
                nogust.append(js['lead'])
            else:
                assert js['wind']['gust'] == sw['wind']['gust'], f'ecmwf +{js["lead"]} h gust: Janela {js["wind"]["gust"]}, Swell {sw["wind"]["gust"]}'
        leads.append(js['lead'])
    return leads, nogust


path = sys.argv[1] if len(sys.argv) > 1 else (sorted(glob.glob(os.path.join(ROOT, 'corpus', 'swell', 'feed', '*.json.gz'))) or [None])[-1]
if path is None:
    notes.append('skip: no written day in corpus/swell/feed (run feed.py first)')
else:
    day = json.loads(gzip.open(path).read())
    rel = os.path.relpath(path, ROOT)
    test(f'the written day {rel} passes the schema', lambda: F.check_day(day))
    if day.get('ocean') is None:
        notes.append(f'note: {rel} has "ocean": null')
    jf = os.path.join(ROOT, 'corpus', 'janela', 'feed', day['run'][:8] + '.json.gz')
    jn = os.path.join(ROOT, 'corpus', 'janela', 'feed-noaa', day['run'][:8] + '.json.gz')
    if os.path.exists(jf):
        jday = json.loads(gzip.open(jf).read())

        def t_ecmwf():
            leads, nogust = compare(day, jday, 'ecmwf', ECMWF_KEYS)
            assert {0, 6, 12, 24, 48} <= set(leads) and len(leads) == 29, leads
            g = dict(zip(F.STEPS, day['gust']['param']))
            assert all(g[x] == '10fg3' for x in nogust), f'Janela lacks gusts at {nogust}, not all 10fg3 steps'
            notes.append(f'ECMWF: equal to Janela at {len(leads)} leads (0..168 by 6); Janela has no gust at {nogust[0]}..{nogust[-1]} h '
                         f'({len(nogust)} steps, the 10fg3 steps), Swell has' if nogust else f'ECMWF: equal to Janela at {len(leads)} leads')
        test(f'ECMWF floripa equals Janela\'s {os.path.relpath(jf, ROOT)}: node, hs, mwd, tp, wind, gust at every shared lead (0, 6, 12, 24, 48, ...)', t_ecmwf)

        def red_ecmwf():
            d2 = copy.deepcopy(day)
            st = at(d2, 'ecmwf', 24)
            st['hs']['det'] = F.JF.fr(F.Fraction(st['hs']['det']) + F.Fraction(1, 100))
            compare(d2, jday, 'ecmwf', ECMWF_KEYS)
        test('RED Swell\'s ECMWF Hs at +24 h forged by 1 cm is caught by the comparison', red_ecmwf, red=True)
    else:
        notes.append(f'skip: {os.path.relpath(jf, ROOT)} not on disk (no ECMWF comparison)')
    if os.path.exists(jn):
        nday = json.loads(gzip.open(jn).read())

        def t_noaa():
            leads, _ = compare(day, nday, 'noaa', NOAA_KEYS)
            assert {0, 6, 12, 24, 48} <= set(leads) and len(leads) == 29, leads
            notes.append(f'NOAA: equal to Janela at {len(leads)} leads (0..168 by 6), node {day["noaa"]["floripa"]["node"]} '
                         '(Swell picks it from GFS-Wave HTSGW at +0 h, Janela from the GEFS-Wave control: the same node)')
        test(f'NOAA floripa equals Janela\'s {os.path.relpath(jn, ROOT)}: node, hs, perpw, dirpw, wind, sea, swells at every shared lead', t_noaa)

        def red_noaa():
            d2 = copy.deepcopy(day)
            at(d2, 'noaa', 48)['swell'][0] = None
            compare(d2, nday, 'noaa', NOAA_KEYS)
        test('RED Swell\'s NOAA first swell at +48 h dropped is caught by the comparison', red_noaa, red=True)
    else:
        notes.append(f'skip: {os.path.relpath(jn, ROOT)} not on disk (no NOAA comparison)')

for n in ok:
    print('  ok  ', n)
for n in bad:
    print('  FAIL', n)
for n in notes:
    print('  ' + n)
reds = sum(1 for n in ok if n.startswith('RED'))
print(f'swell feed battery: {len(ok) - reds} passed, {reds} reds fired' + (f', {len(bad)} FAILED' if bad else ''))
sys.exit(1 if bad else 0)
