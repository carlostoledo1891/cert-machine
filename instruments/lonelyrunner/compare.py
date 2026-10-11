#!/usr/bin/env python3
"""compare.py — AFTER our gates are decided and recorded: our counts against the author's per-gate record
(corpus/lonely-runner/lrc14-allikvere/gates.json, copied, never read by the decider). Run only on gates whose record
is already committed (the pre-registration's order).

  python3 -I compare.py <our-records-dir>        -> a table on stdout, JSON with --json

Quantities compared, and whether each is canonical (a property of the mathematical set, so any correct enumeration
must agree) or an artefact of how it was enumerated:
  irredundant 14-cover orbits   canonical   ours: minimalCoverOrbitsBySize['14']   theirs: ir_rows
  orbits surviving level 32     canonical   ours: survivingOrbits                   theirs: orbits
  witness-free level-15 lifts   canonical given the representative (both use the least element of the unit orbit)
                                            ours: terminal.witnessFree              theirs: kills_wf
  improper after the gcd test   same        ours: terminal.improperAfterGcd         theirs: kills_improper_gcd
  improper after the shift lemma same       ours: terminal.improperAfterNearGcd     theirs: kills_improper_neargcd
  the claim                     ours: verdict + jEmpty   theirs: status + claim_type
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
G = json.load(open(os.path.join(HERE, '..', '..', 'corpus', 'lonely-runner', 'lrc14-allikvere', 'gates.json')))
theirs = {}
for k, v in G.items():
    mt = re.search(r'evidence_(\d+)_', v.get('src', ''))
    p = int(mt.group(1)) if mt else int(k)
    theirs[p] = v
rows = []
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.json'))):
    o = json.load(open(f))
    if not o.get('neargcd', True) or 'gate' not in o:
        continue
    p = o['gate']; t = theirs.get(p)
    if t is None:
        rows.append({'p': p, 'note': 'not a gate of the paper'}); continue
    T = o['terminal']
    pairs = [
        ('irredundant 14-cover orbits', o['stages12']['minimalCoverOrbitsBySize'].get('14', 0), t.get('ir_rows')),
        ('13-cover orbits (decomposition variant)', o['stages12']['minimalCoverOrbitsBySize'].get('13', 0), t.get('km1_covers') if t.get('variant') == 'decomposition' else None),
        ('rows generated', o['stages12']['rows'], (t.get('ir_rows') or 0) + (t.get('ext_rows') or 0) if t.get('variant') == 'decomposition' else None),
        ('rows with F_2 nonempty', o['stages12']['rowsWithF2'], t.get('l2_surv')),
        ('rows dying at level 4', o['stages12']['diedAt'].get('4'), (t.get('died') or {}).get('died_l4')),
        ('rows dying at level 8', o['stages12']['diedAt'].get('8'), (t.get('died') or {}).get('died_l8')),
        ('orbits surviving level 32', o['survivingOrbits'], t.get('orbits')),
        ('witness-free level-15 lifts', T['witnessFree'], t.get('kills_wf')),
        ('improper after gcd', T['improperAfterGcd'], t.get('kills_improper_gcd')),
        ('improper after the shift lemma', T['improperAfterNearGcd'], t.get('kills_improper_neargcd')),
    ]
    claim_ours = 'J(K,p) empty' if o['jEmpty'] else ('divisibility' if o['verdict'] == 'CLOSED' else 'OPEN')
    claim_theirs = 'J(K,p) empty' if 'empty' in (t.get('claim_type') or '') else ('divisibility' if t.get('status') == 'GATE_CLOSED' else t.get('status'))
    rows.append({'p': p, 'pairs': [{'what': w, 'ours': a, 'theirs': b, 'agree': a == b} for w, a, b in pairs],
                 'claim': {'ours': claim_ours, 'theirs': claim_theirs, 'agree': claim_ours == claim_theirs}})
if '--json' in sys.argv:
    print(json.dumps(rows, indent=1))
else:
    for r in rows:
        if 'pairs' not in r:
            print(r['p'], r['note']); continue
        print('p = %d   claim: ours %s / theirs %s %s' % (r['p'], r['claim']['ours'], r['claim']['theirs'], 'AGREE' if r['claim']['agree'] else 'DIFFER'))
        for x in r['pairs']:
            print('   %-32s ours %-12s theirs %-12s %s' % (x['what'], x['ours'], x['theirs'], 'agree' if x['agree'] else 'DIFFER'))
