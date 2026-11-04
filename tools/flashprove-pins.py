#!/usr/bin/env python3
"""flashprove-pins.py — pin the FlashProve claim (github.com/anthropics/FlashProve) at one commit.

  python3 -I tools/flashprove-pins.py CLONE            writes corpus/flashprove/PINS.json
  python3 -I tools/flashprove-pins.py CLONE --check    re-hashes CLONE against it; exit 1 on any difference

CLONE is a clone of the claim at the pinned commit. The files pinned are the ones this lane reads or runs on: the two
stored example proofs (every file), the verifier's sources and build script, the Lean project's toolchain, lakefile
and manifest, the ledgers the claim keeps of itself (THEOREM, GAPS, LIMITS, CHECK-RESULTS, CHECKING, AUDIT), the
lists of named theorems, and the paper. Nothing in CLONE is executed here.
"""
import hashlib, json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'corpus', 'flashprove', 'PINS.json')
REPO = 'https://github.com/anthropics/FlashProve'
COMMIT = '9e2bdd8ff5bf9c62f18263d7dac189b0400b260c'
TREES = ['examples/accepted-proof', 'examples/full-size', 'verifier/src']
FILES = ['VERSION', 'README.md', 'AGENTS.md', 'SUITE.md', 'paper/paper.pdf', 'verifier/build.sh',
         'lean/lean-toolchain', 'lean/lakefile.toml', 'lean/lake-manifest.json',
         'lean/THEOREM.md', 'lean/GAPS.md', 'lean/LIMITS.md', 'lean/CHECK-RESULTS.md', 'lean/CHECKING.md',
         'lean/AUDIT.md', 'lean/scripts/claimed-theorems.tsv', 'lean/scripts/top-theorems.txt',
         'lean/Ladder.lean', 'guide/known-limits.md', 'guide/what-is-proved.md',
         'tools/lean-verify/lean_verify.sh', 'tools/lean-verify/README.md']


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def collect(clone):
    head = subprocess.run(['git', '-C', clone, 'rev-parse', 'HEAD'], capture_output=True, text=True).stdout.strip()
    if head != COMMIT:
        sys.exit('the clone is at %s, not the pin %s' % (head or '?', COMMIT))
    files = {}
    for t in TREES:
        for d, _, names in os.walk(os.path.join(clone, t)):
            for n in names:
                p = os.path.join(d, n)
                files[os.path.relpath(p, clone)] = sha(p)
    for f in FILES:
        p = os.path.join(clone, f)
        if not os.path.isfile(p):
            sys.exit('a pinned file is missing from the clone: ' + f)
        files[f] = sha(p)
    tree = subprocess.run(['git', '-C', clone, 'rev-parse', 'HEAD^{tree}'], capture_output=True, text=True).stdout.strip()
    return {k: files[k] for k in sorted(files)}, tree


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    clone = sys.argv[1]
    files, tree = collect(clone)
    if '--check' in sys.argv:
        pins = json.load(open(OUT))
        bad = [k for k in pins['files'] if files.get(k) != pins['files'][k]] + [k for k in files if k not in pins['files']]
        if tree != pins['tree']:
            bad.append('(the git tree)')
        if bad:
            print('DIFFERS: ' + ', '.join(sorted(set(bad))))
            sys.exit(1)
        print('ok  %d files and the tree equal corpus/flashprove/PINS.json' % len(files))
        return
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = {
        'what': 'The FlashProve claim, pinned: the public repository at its one commit (the initial public release, '
                'FlashProve 0.16.0-rc.26, 2026-10-30), the files this lane reads or runs on. The claimant\'s check '
                'script (lean/scripts/check.py) is READ, never run as the authority; its verifier cp_verify and its '
                'Lean verifier are run as the objects under test.',
        'repo': REPO, 'commit': COMMIT, 'tree': tree, 'pinned': '2026-11-04',
        'leanToolchain': open(os.path.join(clone, 'lean/lean-toolchain')).read().strip(),
        'storedIds': {e: open(os.path.join(clone, 'examples', e, 'ID.txt')).read().strip()
                      for e in ('accepted-proof', 'full-size')},
        'files': files,
    }
    with open(OUT, 'w') as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print('wrote %s: %d files, tree %s' % (os.path.relpath(OUT, ROOT), len(files), tree[:12]))


if __name__ == '__main__':
    main()
