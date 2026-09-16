#!/usr/bin/env python3
"""pin.py — (re)write instruments/erdos1/PROVENANCE.json: the sha256 pin of every file lifted from
frontier-apps/experiments/erdos1 on 2026-09-15, with the patches declared so a declared edit can never be
mistaken for drift. The source tree is read-only and has no git; the hash is the only pin.

usage: python3 instruments/erdos1/pin.py          refresh local hashes (a PATCHED file may change; an
                                                  unpatched one must still hash to its source, else refused)"""
import hashlib, json, os, sys, gzip
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
P = os.path.join(HERE, 'PROVENANCE.json')
sha = lambda b: hashlib.sha256(b).hexdigest()
PATCHES = {
  'instruments/erdos1/build.py': 'the Hermite cache is read and written gzipped in instruments/erdos1/cache/ beside the instrument instead of the working directory (cache_path/load_cache/save_cache), and --out names the certificate file so it can be written into certs/erdos1/. The mathematics is untouched.',
  'instruments/erdos1/hnf_pari.py': 'cache path as build.py; the modulus handed to PARI mathnfmod is |det A| = D^r Δ_s from the closed form (lattice.delta_formula) instead of a FLINT determinant that costs an hour at r = 3374 — it is only a modulus: the diagonal product of the returned H is asserted equal to it, and verify.py V1c recomputes det A with FLINT. ERDOS1_DET=flint restores the bench behaviour.',
  'instruments/erdos1/report.py': 'the summary RESULTS-*.md is named after the certificate FILE (cert-X.json[.gz] → RESULTS-X.md), so a second certificate for the same lattice (cert-b9-s2-a3_5-k21.json) cannot overwrite the first one\'s summary, which it did once on 2026-09-15; the int→str limit call is guarded for older python3.',
  'instruments/erdos1/siegel.py': 'takes the certificate directory as its argument (default certs/erdos1/) and writes siegel.json beside the certificates instead of in the working directory; the int→str limit call is guarded so the script runs under any python3 (it needs no FLINT).',
  'instruments/erdos1/certnumbers.py': 'rewritten: reads certs/erdos1-ledger.json (tools/run-erdos1-ledger.js applies the verified-instance rule ONCE) instead of re-reading the certificates and re-applying the rule itself; writes paper/tex/erdos1-numbers.tex; adds the tilt, lattice and Siegel table macros.',
  'paper/erdos1-explicit.md': 'THEOREM.md as ported: the status paragraph carries the sets built here (k = 21 at d = 81; the s = 2 tilts at d = 441 and 961; d = 3375), Bohman\'s Proc. AMS citation corrected to the EJC 1998 paper that holds 0.22002, and the file names point at certs/erdos1/.',
  'paper/tex/erdos1-explicit.tex': 'rewritten in the house preamble (certmachine.sty, the shared author block and disclosure); the tilt α enters in §2 so the theorem can state its instance; "sixty years" corrected to twenty-eight; the stale "no s = 2 instance beats Bohman" removed; the new instances and tables; numbers from paper/tex/erdos1-numbers.tex.',
  'outreach/erdos1-sharing-plan.md': 'SHARE.md as ported: paths point at this repository, the numbers are the ledger\'s, and the texts moved to their own files (erdos1-forum-comment.md, erdos1-tadamcz-issue.md, erdos1-mastodon.md).',
}
if os.path.exists(P):
    prov = json.load(open(P)); rows = prov['files']
else:
    rows = json.load(open(os.path.join(HERE, '.lift-rows.json')))
bad = []
for r in rows:
    p = os.path.join(ROOT, r['file']); raw = open(p, 'rb').read()
    r['patched'] = r['file'] in PATCHES
    if r['patched']: r['patch'] = PATCHES[r['file']]
    elif r.get('gzipped'):
        if sha(gzip.decompress(raw)) != r['sourceSha256']: bad.append(r['file'])
    elif sha(raw) != r['sourceSha256']: bad.append(r['file'])
    r['sha256'] = sha(raw)
if bad: print('REFUSED: unpatched lifted files no longer hash to their source: ' + ', '.join(bad)); sys.exit(1)
json.dump({
  'what': 'Erdős problem #1 made effective — the instrument (lattice, build, verify, gadget, siegel …), the Hermite caches, the eight bench certificates with their summaries and the bench\'s own verifier logs, the seven pinned sources, the theorem note, the paper source and the sharing plan, ported whole from frontier-apps/experiments/erdos1 on 2026-09-15.',
  'liftedFrom': '/Users/carlostoledo/Projects/frontier-apps/experiments/erdos1',
  'liftedOn': '2026-09-15',
  'rule': 'Copied byte-for-byte and pinned by sha256 (a gzipped copy pins both the .gz and, through sourceSha256, its content); frontier-apps has no git, so the hash is the only pin, and the source tree is read-only from this side. Records copied; everything with proof force was RE-RUN here: certs/erdos1/verify-*.log are this machine\'s verifier logs, the bench\'s are kept as certs/erdos1/logs/frontier-verify-*.log and enter nothing. Patches are declared here so they can never be read as drift.',
  'notPorted': 'cert-b3-s2, cert-b3-s3, cert-b5-s2, cert-b5-s2-a3_5 and their caches (smoke tests above Bohman); page-*.log; deposit.zip and public/ (the bench-side sharing bundle, rebuilt from here when the operator sends); build-page.js and the bench template (the page is tools/build-report-erdos1.js in this design system); paper/numbers.tex and the PDF (regenerated).',
  'files': rows}, open(P, 'w'), indent=1)
print('wrote PROVENANCE.json:', len(rows), 'files,', sum(r['patched'] for r in rows), 'patched')
