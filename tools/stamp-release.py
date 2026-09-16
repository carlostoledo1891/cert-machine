#!/usr/bin/env python3
"""stamp-release.py — after Zenodo mints a version's DOI, write it down in the four places that must
agree and rebuild what quotes it. The deposit record (corpus/zenodo.json) and CITATION.cff are gated
against each other by tools/check-wiring.js; a DOI that lands in one and not the other is the drift
that file was created to catch (2026-09-04).

usage: python3 tools/stamp-release.py v2026.09.3 10.5281/zenodo.NNNNNNNN 2026-09-16 "note"
Then: node tools/check-wiring.js; commit; push."""
import json, sys, os, re, subprocess
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ver, doi, date = sys.argv[1], sys.argv[2], sys.argv[3]
note = sys.argv[4] if len(sys.argv) > 4 else 'Minted by the GitHub integration on the tagged release; verified from the public record.'
assert re.fullmatch(r'10\.5281/zenodo\.\d+', doi), doi
# 1. the deposit record
p = os.path.join(ROOT, 'corpus', 'zenodo.json'); Z = json.load(open(p))
if not any(v['version'] == ver for v in Z['versions']):
    for v in Z['versions']:
        if v['version'] == Z['latest']:
            v['note'] = f"SUPERSEDED by {ver} on {date} — cite the concept DOI or {ver}. " + v['note'].replace('Current. ', '')
    Z['versions'].append({'version': ver, 'doi': doi, 'date': date, 'note': 'Current. ' + note})
Z['latest'] = ver
json.dump(Z, open(p, 'w'), indent=1, ensure_ascii=False); open(p, 'a').write('\n')
# 2. CITATION.cff
p = os.path.join(ROOT, 'CITATION.cff'); s = open(p).read()
s = re.sub(r'^date-released: .*$', f'date-released: {date}', s, flags=re.M)
s = re.sub(r'^version: .*$', f'version: {ver}', s, flags=re.M)
s = re.sub(r'^doi: ".*"$', f'doi: "{doi}"', s, flags=re.M)
open(p, 'w').write(s)
print(f'stamped {ver} = {doi} ({date}) into corpus/zenodo.json and CITATION.cff')
r = subprocess.run(['node', os.path.join(ROOT, 'tools', 'check-wiring.js')], capture_output=True, text=True)
print((r.stdout.strip().splitlines() or [''])[-1])
sys.exit(r.returncode)
