#!/usr/bin/env python3
"""Incremental build of openai/NavierStokesAndEuler @ f9e8bc5b, driving the pinned `lean` directly.

Why not `lake build`: the v4.34.0-rc2 `lake` binary aborts at start on this macOS (darwin 27,
`pointer being freed was not allocated` in pthread TSD cleanup, exit 133 even for --version);
the same toolchain's `lean` runs clean. Lake's own compile line (read from the pin's .trace
files) is `lean <file> -o <olean> -i <ilean> -c <c> --setup <json> --json`, with no lean options
for the NavierStokes library; this driver runs `lean --root=. <file> -o <olean> -i <ilean>` with
LEAN_PATH set to the same package lib dirs (`lake env` semantics). Modules whose transitive
imports did not change keep the oleans built at the pin on this machine (copy-on-write clone).

Rebuild set: every .lean that changed in 8937a8f4..f9e8bc5b plus everything that imports one,
transitively. Ordered so the ComparatorSolution / R3.Theorem closure finishes first.
"""
import os, re, subprocess, sys, time, collections, heapq

ROOT = os.path.expanduser('~/Projects/navier-stokes-lean/NavierStokesAndEuler-f9e8bc5b')
LOG = os.path.expanduser('~/Projects/navier-stokes-lean/build-f9e8bc5b.log')
LEAN = os.path.expanduser('~/.elan/toolchains/leanprover--lean4---v4.34.0-rc2/bin/lean')
PIN, HEAD = '8937a8f4cbc7abaab5e9e97d1cc7f5d2319d9538', 'f9e8bc5b38b6e212696e8a30e3e91517af887bbd'
JOBS = int(os.environ.get('JOBS', '4'))
os.chdir(ROOT)
sh = lambda *a: subprocess.run(a, capture_output=True, text=True, check=True).stdout
assert sh('git', 'rev-parse', 'HEAD').strip() == HEAD, 'copy not at HEAD'
assert not sh('git', 'status', '--porcelain', '--untracked-files=no').strip(), 'copy modified'

lp = [os.path.join(ROOT, '.lake/build/lib/lean')] + [os.path.join(ROOT, '.lake/packages', p, '.lake/build/lib/lean') for p in sorted(os.listdir('.lake/packages'))]
env = dict(os.environ, LEAN_PATH=':'.join(lp), LEAN_NUM_THREADS=os.environ.get('LEAN_NUM_THREADS', '4'))

mods = {}
for f in sh('git', 'ls-files', '*.lean').split():
    mods[f[:-5].replace('/', '.')] = re.findall(r'^import\s+(\S+)', open(f, encoding='utf8').read(), re.M)
dirty = {l.split('\t')[1][:-5].replace('/', '.') for l in sh('git', 'diff', '--name-status', PIN, HEAD).splitlines() if l.endswith('.lean')}
rev = collections.defaultdict(set)
for m, imps in mods.items():
    for i in imps:
        if i in mods: rev[i].add(m)
reb, st = set(dirty), list(dirty)
while st:
    for y in rev[st.pop()]:
        if y not in reb: reb.add(y); st.append(y)
def closure(r):
    s, st = {r}, [r]
    while st:
        for i in mods.get(st.pop(), []):
            if i in mods and i not in s: s.add(i); st.append(i)
    return s
first = (closure('NavierStokes.ComparatorSolution') | closure('NavierStokes.R3.Theorem')) & reb
deps = {m: {i for i in mods[m] if i in reb} for m in reb}
users = collections.defaultdict(set)
for m, ds in deps.items():
    for d in ds: users[d].add(m)
n = len(reb)
out = open(LOG, 'a', buffering=1)
def say(s): out.write(s + '\n')
say(time.strftime('%a %b %e %H:%M:%S %Z %Y'))
say('toolchain: ' + subprocess.run([LEAN, '--version'], capture_output=True, text=True).stdout.strip())
say('LEAN_NUM_THREADS=' + env['LEAN_NUM_THREADS'] + ' JOBS=' + str(JOBS))
say('driver: lean directly (lake v4.34.0-rc2 aborts at start on this OS); rebuild set %d modules (%d changed .lean, %d in the ComparatorSolution/R3.Theorem closure)' % (n, len(dirty), len(first)))
pending = {m: len(deps[m]) for m in reb}
ready = [(0 if m in first else 1, m) for m in reb if pending[m] == 0]
heapq.heapify(ready)
running, done, failed, k = {}, set(), [], 0
t0 = time.time()
while ready or running:
    while ready and len(running) < JOBS and not failed:
        _, m = heapq.heappop(ready)
        src = m.replace('.', '/') + '.lean'
        o = os.path.join(ROOT, '.lake/build/lib/lean', m.replace('.', '/'))
        os.makedirs(os.path.dirname(o), exist_ok=True)
        lf = open(os.path.join(os.path.dirname(LOG), 'build-f9e8bc5b-msgs', m + '.txt'), 'w') if os.path.isdir(os.path.join(os.path.dirname(LOG), 'build-f9e8bc5b-msgs')) else subprocess.DEVNULL
        p = subprocess.Popen([LEAN, '--root=.', src, '-o', o + '.olean', '-i', o + '.ilean'], env=env, stdout=lf, stderr=subprocess.STDOUT)
        running[p] = (m, time.time(), lf)
    if not running: break
    time.sleep(0.5)
    for p in list(running):
        rc = p.poll()
        if rc is None: continue
        m, ts, lf = running.pop(p)
        if lf is not subprocess.DEVNULL: lf.close()
        dt = time.time() - ts
        k += 1
        if rc != 0:
            failed.append(m); say('✖ [%d/%d] FAILED %s rc=%d (%.1fs)' % (k, n, m, rc, dt)); continue
        say('✔ [%d/%d] Built %s (%.1fs)' % (k, n, m, dt))
        done.add(m)
        if m in first and not (first - done): say('CLOSURE DONE (ComparatorSolution + R3.Theorem) at %.0fs' % (time.time() - t0))
        for u in users[m]:
            pending[u] -= 1
            if pending[u] == 0: heapq.heappush(ready, (0 if u in first else 1, u))
say('real %dm%.3fs' % ((time.time() - t0) // 60, (time.time() - t0) % 60))
say(time.strftime('%a %b %e %H:%M:%S %Z %Y'))
say('EXIT %d' % (1 if failed or len(done) != n else 0))
