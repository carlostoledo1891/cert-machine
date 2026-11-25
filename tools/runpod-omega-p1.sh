#!/usr/bin/env bash
# runpod-omega-p1.sh MODE — Phase 1 of cert-machine's decision of OpenAI's "The matrix multiplication exponent is nine
# fourths" (github.com/openai/math @ 92b516ef; corpus/omega-nine-fourths/PREREG.md, rows PIN K0 K1 K1N EXP K2 K3 KR C1 C2
# C3 CEN). Every Lean, cargo and go step runs as the unprivileged user `tester`; results are root-owned in /results; one
# log line per step with its exit, time and peak memory.
#   pin   (row PIN) a sparse clone of the release at 92b516ef; the ten PREREG sha256s checked; every dependency fetched
#         by OUR git at its lake-manifest revision (no lake, nothing of the release executed); the official Lean
#         v4.34.1 archive (GitHub's digest enforced); the import closure of the solution and challenge modules computed
#         from the source headers; target-SHA256SUMS of every file in it (+ the build inputs) written to /results.
#         The operator's Mac hashes it into SEAL-A1.sha256 and stamps it BEFORE `run` starts.
#   run   K0 (lake update, cache, build of the two modules only, axioms, grep), the judges at their pins, K1 (Comparator,
#         the config as released), K1N (nanoda on), EXP, K2 (nanoda d0a02cc5), K3 (con-leche --verified, --compare),
#         C1 (two planted statement changes), C2 (square_exponent re-typed as False), C3 (one definition body changed),
#         CEN (census), KR (leanchecker --fresh) last.
# Inputs in /opt/omega: (run) Census.lean, c2.py. Start detached:  nohup bash p1.sh pin > /results/p1-pin.log 2>&1 &
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
MODE=${1:?pin or run}
R=/results U=tester H=/home/tester V=/opt/omega
M=$H/math W=$H/math/lean P=/pin T=$H/tools D=$H/exports
REPO_SHA=92b516ef8e2abf66c3db7aa31438d3010bc7956f
PREPRINT=preprints/The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026
LEAN_TGZ_SHA=47bf4bbd78f70c2e9670598ab7124d92b6efb7330ff33e5fbb4030f6fd72e4e4   # GitHub's digest, lean-4.34.1-linux.tar.zst
SOL=OAI.LinearAlgebra.SpectralBooks.ExactExponent CHAL=ComparatorChallenges.MatrixExponent
THMS="OAI.LinearAlgebra.SpectralBooks.square_exponent OAI.LinearAlgebra.SpectralBooks.dual_exponent OAI.LinearAlgebra.SpectralBooks.rectangular_exponent"
CMPPIN=d03acab154d269c06e60e4de7e4cc85deebff94b LEXPIN=076e8e57707e813375e8f9da8bf989799ace9680
LRNPIN=811cfff51ceaf3d9843708aa6d22e9b84ccac8b4 ND1PIN=3a2407216ee84a75f9e1aead6803d0578be06ae7
ND2PIN=d0a02cc5defadd683f62f9d078f41688314fa31f CLPIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f
NT=$(nproc)
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R; chmod 755 $R
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log; }
stop() { log "STOP: $*"; exit 1; }
UPATH="$H/.elan/bin:$H/.cargo/bin:/usr/local/go/bin:/usr/local/bin:/usr/bin:/bin"
step() {  # name, timeout seconds, workdir, command... (as tester; outputs written by root into /results)
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" LEAN_ABORT_ON_PANIC=1 ${STEPENV:-} \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s, peak $(grep -m1 'Maximum resident' $R/$n.err | awk '{print $NF}') kB"
}
ex() { cat $R/$1.exit 2>/dev/null; }

if [ "$MODE" = pin ]; then
  log "PIN start on $(hostname), $NT vCPU, cgroup memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes, $(df -h / | awk 'NR==2{print $4}') free"
  apt-get update -qq < /dev/null > /dev/null 2>&1
  apt-get install -y -qq git curl jq build-essential pkg-config libssl-dev time python3 zstd ca-certificates < /dev/null > /dev/null 2>&1 || log "apt partly failed"
  id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
  mkdir -p $P/deps $D && chown $U:$U $P $P/deps $D
  # the release: blobless clone, sparse checkout of lean/ and the preprint's folder, at the pinned commit
  cat > /tmp/clone.sh <<BLOCK
set -uo pipefail
export GIT_TERMINAL_PROMPT=0
for t in 1 2 3 4; do [ -d $M/.git ] && break; git clone -q --filter=blob:none --no-checkout https://github.com/openai/math.git $M && break; rm -rf $M; sleep \$((t*30)); done
cd $M && git sparse-checkout set lean $PREPRINT && git checkout -q $REPO_SHA
echo "repo \$(git rev-parse HEAD) \$(git log -1 --format='%cI %s')"
BLOCK
  chmod 644 /tmp/clone.sh
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash /tmp/clone.sh > $R/pin-clone.txt 2>&1
  log "release: $(tail -1 $R/pin-clone.txt)"
  [ "$(runuser -u $U -- git -C $M rev-parse HEAD 2>/dev/null)" = "$REPO_SHA" ] || stop "the release is not at $REPO_SHA (pin-clone.txt)"
  # the ten PREREG files
  cat > $R/prereg-SHA256SUMS <<EOF
a56cd2267e261903bb62e18eaa4f4663c81dfea83510f20eb19617a42e640534  lean/ComparatorChallenges/MatrixExponent.lean
a0e2433ae4939e469e866c683499ea8b6e370ffd892a145c24120d2933a6c962  lean/OAI/LinearAlgebra/SpectralBooks/ExactExponent.lean
bf7bd1e681b75f1664d93eaaeefa583024b0133f436f59c4a179d84b1b6a3699  lean/ComparatorChallenges/MatrixExponent.json
ee45fe3b2f1ecf8fbdb0513b00fc6ed9195a612db9327cd76fc9b792de63190f  lean/lakefile.lean
b0848e3682e0e50761a717d4ea92a40321db8d695a22d3790b3e8b8b13814168  lean/lake-manifest.json
d5edba4e4b8faad9c1baeadb265716d20d03be4d1a2647dc5e35b0c0325bea7b  lean/lean-toolchain
b56e17872e392e8985abaf669102ba2805719e682ee732a490d81b65ea01bc69  lean/formalization.yaml
ddde9ab7755596c6f0210c148985f9761f2c291582e4d0a045987ad1766e5a01  $PREPRINT/paper.pdf
c83864717e5f42acbbef76c7a17a4a8a9ead8df9d07f7701e4a70eb97e127834  $PREPRINT/README.md
31d88810902fccb13f04d0e60e992cc5e2726d36379d4c4806391b96156ec01d  lean/docs/107.md
EOF
  (cd $M && sha256sum -c $R/prereg-SHA256SUMS > $R/pin-check.txt 2>&1) && log "PIN-OK: the ten PREREG files match" || stop "a PREREG file differs from its pin (pin-check.txt)"
  # the official toolchain archive, digest enforced (its src/lean holds the core modules' sources)
  mkdir -p $P/lean && curl -fsSL --retry 5 -o $P/lean-4.34.1-linux.tar.zst https://github.com/leanprover/lean4/releases/download/v4.34.1/lean-4.34.1-linux.tar.zst
  [ "$(sha256sum $P/lean-4.34.1-linux.tar.zst | cut -c1-64)" = "$LEAN_TGZ_SHA" ] || stop "the toolchain archive does not match GitHub's digest"
  tar --zstd -xf $P/lean-4.34.1-linux.tar.zst -C $P/lean --strip-components=1 && chmod -R a+rX,go-w $P/lean
  log "toolchain archive matches GitHub's digest; $(ls $P/lean/src/lean 2>/dev/null | tr '\n' ' ')"
  # every dependency at its manifest revision, fetched by our git (depth 1, no lake)
  python3 -I -c 'import json,sys; [print(p["name"], p["url"], p["rev"], p.get("subDir") or "") for p in json.load(open(sys.argv[1]))["packages"]]' $W/lake-manifest.json > $R/pin-manifest.txt
  cat > /tmp/deps.sh <<'BLOCK'
set -uo pipefail
export GIT_TERMINAL_PROMPT=0
fetch() { local name=$1 url=$2 rev=$3 d=/pin/deps/$1
  for t in 1 2 3 4 5; do
    rm -rf $d; mkdir -p $d && git -C $d init -q && git -C $d fetch -q --depth 1 "$url" "$rev" && git -C $d checkout -q FETCH_HEAD && break
    sleep $((t*20)); done
  echo "$name $(git -C $d rev-parse HEAD 2>/dev/null || echo FAILED) $url"; }
while read -r name url rev sub; do fetch "$name" "$url" "$rev" & while [ "$(jobs -r | wc -l)" -ge 8 ]; do sleep 1; done; done < /results/pin-manifest.txt
wait
BLOCK
  chmod 644 /tmp/deps.sh
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash /tmp/deps.sh > $R/pin-deps.txt 2>&1
  bad=$(python3 -I -c '
import sys
want = {l.split()[0]: l.split()[2] for l in open(sys.argv[1]) if l.strip()}
got = {l.split()[0]: l.split()[1] for l in open(sys.argv[2]) if l.strip()}
print(" ".join(sorted(k for k in want if got.get(k) != want[k])))' $R/pin-manifest.txt $R/pin-deps.txt)
  [ -z "$bad" ] || stop "a dependency is not at its manifest revision: $bad"
  log "deps: all $(wc -l < $R/pin-manifest.txt) packages at their manifest revisions"
  # the import closure, from the headers, and its sha256 list
  cat > /tmp/closure.py <<'PY'
import hashlib, json, os, re, sys
W, P, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
roots = sys.argv[4:]
manifest = [l.split() for l in open('/results/pin-manifest.txt') if l.strip()]
pkgs = [('OAI-release', W, 'math/lean')]          # (package, dir on disk, prefix in the sum list)
for f in manifest:
    sub = f[3] if len(f) > 3 else ''
    pkgs.append((f[0], os.path.join(P, 'deps', f[0], sub), 'pkg/' + f[0] + ('/' + sub if sub else '')))
pkgs.append(('lean4-core', os.path.join(P, 'lean', 'src', 'lean'), 'toolchain/src/lean'))
pkgs.append(('lean4-lake', os.path.join(P, 'lean', 'src', 'lean', 'lake'), 'toolchain/src/lean/lake'))
def strip(src):
    out, i, depth, n = [], 0, 0, len(src)
    while i < n:
        if src.startswith('/-', i): depth += 1; i += 2; continue
        if depth and src.startswith('-/', i): depth -= 1; i += 2; continue
        if depth: i += 1; continue
        if src.startswith('--', i):
            j = src.find('\n', i); i = n if j < 0 else j; continue
        out.append(src[i]); i += 1
    return ''.join(out)
KW = {'public', 'private', 'meta'}
def header(path):
    toks = strip(open(path, encoding='utf-8').read()).split()
    i, imps, flags = 0, [], []
    if i < len(toks) and toks[i] == 'module': i += 1; flags.append('module')
    if i < len(toks) and toks[i] == 'prelude': i += 1; flags.append('prelude')
    while i < len(toks):
        j = i
        while j < len(toks) and toks[j] in KW: j += 1
        if j >= len(toks) or toks[j] != 'import': break
        j += 1
        if j < len(toks) and toks[j] in ('all', 'runtime'): j += 1
        imps.append((toks[j], ' '.join(toks[i:j]))); i = j + 1
    return imps, flags
def resolve(mod):
    rel = os.path.join(*[c.strip('«»') for c in mod.split('.')]) + '.lean'
    hits = [(p, d, x) for (p, d, x) in pkgs if os.path.isfile(os.path.join(d, rel))]
    return rel, hits
seen, order, edges, unresolved, ambiguous, info = set(), [], [], [], [], {}
stack = list(roots)
while stack:
    m = stack.pop()
    if m in seen: continue
    seen.add(m)
    rel, hits = resolve(m)
    if not hits: unresolved.append(m); continue
    if len(hits) > 1: ambiguous.append([m] + [h[0] for h in hits])
    pkg, d, pre = hits[0]
    path = os.path.join(d, rel)
    imps, flags = header(path)
    data = open(path, 'rb').read()
    info[m] = {'package': pkg, 'file': pre + '/' + rel, 'sha256': hashlib.sha256(data).hexdigest(),
               'lines': data.count(b'\n'), 'bytes': len(data), 'imports': [a for a, _ in imps], 'flags': flags,
               'importForms': sorted(set(k for _, k in imps))}
    order.append(m)
    for a, _ in imps:
        edges.append([m, a])
        if a not in seen: stack.append(a)
by = {}
for m in order:
    b = by.setdefault(info[m]['package'], {'modules': 0, 'lines': 0, 'bytes': 0}); b['modules'] += 1; b['lines'] += info[m]['lines']; b['bytes'] += info[m]['bytes']
json.dump({'roots': roots, 'modules': len(order), 'unresolved': unresolved, 'ambiguous': ambiguous, 'byPackage': by,
           'edges': len(edges), 'info': info}, open(OUT + '/closure.json', 'w'), indent=1, sort_keys=True)
with open(OUT + '/closure-modules.txt', 'w') as f:
    for m in sorted(order): f.write('%s %s %s\n' % (m, info[m]['package'], info[m]['file']))
with open(OUT + '/closure-SHA256SUMS', 'w') as f:
    for m in sorted(order, key=lambda m: info[m]['file']): f.write('%s  %s\n' % (info[m]['sha256'], info[m]['file']))
print('modules %d (unresolved %d, ambiguous %d); by package: %s' % (len(order), len(unresolved), len(ambiguous),
      ', '.join('%s %d files %d lines' % (k, v['modules'], v['lines']) for k, v in sorted(by.items(), key=lambda kv: -kv[1]['modules']))))
if unresolved: print('UNRESOLVED: ' + ' '.join(sorted(unresolved)))
if ambiguous: print('AMBIGUOUS: ' + json.dumps(ambiguous))
PY
  python3 -I /tmp/closure.py $W $P $R $SOL $CHAL > $R/pin-closure.txt 2>&1 || stop "the closure script failed (pin-closure.txt)"
  mkdir -p $R/chal-only && python3 -I /tmp/closure.py $W $P $R/chal-only $CHAL > $R/chal-only/pin-closure.txt 2>&1 || true
  log "closure: $(head -1 $R/pin-closure.txt)"
  grep -q '^UNRESOLVED' $R/pin-closure.txt && log "PIN WARNING: $(grep '^UNRESOLVED' $R/pin-closure.txt | cut -c1-400)"
  # the build inputs: the release's lakefile, manifest, toolchain file, every compatibility patch, the comparator configs
  # of this claim, the ten PREREG files; and the toolchain archive's digest
  {
    (cd $M && find lean/patches -type f | sort | xargs -r sha256sum | sed 's#  #  math/#')
    (cd $M && sha256sum lean/lakefile.lean lean/lake-manifest.json lean/lean-toolchain lean/ComparatorChallenges/MatrixExponent.json lean/formalization.yaml lean/docs/107.md $PREPRINT/paper.pdf $PREPRINT/README.md | sed 's#  #  math/#')
    echo "$LEAN_TGZ_SHA  toolchain/lean-4.34.1-linux.tar.zst"
  } > $R/inputs-SHA256SUMS
  cat $R/closure-SHA256SUMS $R/inputs-SHA256SUMS | sort -k2 -u > $R/target-SHA256SUMS
  log "target-SHA256SUMS: $(wc -l < $R/target-SHA256SUMS) files ($(wc -l < $R/closure-SHA256SUMS) closure, $(wc -l < $R/inputs-SHA256SUMS) inputs), sha256 $(sha256sum $R/target-SHA256SUMS | cut -c1-64)"
  # which patches touch which closure files (by the patch text; K0 measures what lake update actually changed)
  (cd $M && for p in $(find lean/patches -type f | sort); do grep -E '^\+\+\+ ' $p | sed -E 's#^\+\+\+ (b/)?##; s#\t.*##' | sed "s#^#$p #"; done) > $R/patch-targets.txt
  python3 -I - $R <<'PY' > $R/patch-closure.txt
import json, sys
R = sys.argv[1]
c = json.load(open(R + '/closure.json'))
files = {i['file'] for i in c['info'].values()}
inpk = sorted({i['package'] for i in c['info'].values()})
pat, hit = {}, []
for l in open(R + '/patch-targets.txt'):
    p, t = l.split(' ', 1); t = t.strip()
    pkg = p.split('/')[-1][:-len('-lean4341.patch')] if p.endswith('-lean4341.patch') else None
    pat.setdefault(p, (pkg, []))[1].append(t)
    names = [n for n in ['pkg/' + (pkg or ''), 'pkg/«' + (pkg or '') + '»'] ]
    for n in names:
        if n + '/' + t in files: hit.append((p, n + '/' + t))
for p, f in hit: print('IN-CLOSURE %s %s' % (p, f))
patched = sorted({v[0] or '?' for v in pat.values()})
print('patched packages: ' + ' '.join(patched))
print('closure packages: ' + ' '.join(inpk))
print('patch files: %d; patched paths: %d; patched packages in the closure: %d; patched paths that are closure files: %d' % (
    len(pat), sum(len(v[1]) for v in pat.values()), len(set(patched) & set(inpk)), len(hit)))
PY
  log "patches vs closure (by path): $(tail -1 $R/patch-closure.txt)"
  date -u +%Y-%m-%dT%H:%M:%SZ > $R/PIN.done
  log "PIN done; waiting for the seal (SEAL-A1) before run"
  exit 0
fi

# ---------------------------------------------------------------------------------------------------------- run
# `run` = every stage below in order; `stage NAME...` runs the named stages only (a re-run after a script fix).
LP=$P/lean                                    # the digest-checked toolchain (prefix); elan's copy is compared to it
LEX=$T/comparator/.lake/packages/lean4export/.lake/build/bin/lean4export
CMP=$T/comparator/.lake/build/bin/comparator LRN=$T/landrun/landrun
ND1=$T/nanoda-3a24/target/release/nanoda_bin ND2=$T/nanoda-d0a0/target/release/nanoda_bin
CL=$T/con-leche/.lake/build/bin/con-leche A=$H/audit
CMPENV() { echo "PATH=$LP/bin:$H/cmpbin:$UPATH COMPARATOR_LANDRUN=$(cat $R/landrun.use 2>/dev/null || echo $LRN) COMPARATOR_LEAN4EXPORT=$LEX COMPARATOR_NANODA=$ND1 RUST_MIN_STACK=1073741824"; }
progress() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> $R/PROGRESS.txt; }

s_prep() {
  [ -s $R/PIN.done ] || stop "PIN has not finished"
  [ -s $V/SEAL-A1.sha256 ] || stop "no SEAL-A1.sha256 uploaded: run starts only after the seal"
  [ "$(head -1 $V/SEAL-A1.sha256 | cut -c1-64)" = "$(sha256sum $R/target-SHA256SUMS | cut -c1-64)" ] || stop "target-SHA256SUMS differs from SEAL-A1"
  cp $V/SEAL-A1.sha256 $R/; log "SEAL-A1 matches target-SHA256SUMS ($(head -1 $V/SEAL-A1.sha256 | cut -c1-16)…); run starts"
  apt-get install -y -qq golang-go < /dev/null > /dev/null 2>&1 || true
  if [ ! -x /usr/local/go/bin/go ]; then
    curl -fsSL --retry 5 -o /tmp/go.tgz https://go.dev/dl/go1.24.13.linux-amd64.tar.gz
    [ "$(sha256sum /tmp/go.tgz | cut -c1-64)" = 1fc94b57134d51669c72173ad5d49fd62afb0f1db9bf3f798fd98ee423f8d730 ] || stop "go archive digest"
    tar -C /usr/local -xzf /tmp/go.tgz
  fi
  mkdir -p $A $T $H/cmpbin && chown $U:$U $A $T $H/cmpbin
  cat > /tmp/setup.sh <<BLOCK
set -uo pipefail
export PATH=$UPATH
[ -x $H/.elan/bin/elan ] || curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null 2>&1
[ -x $H/.cargo/bin/cargo ] || curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1
cd $W && elan toolchain install "\$(cat lean-toolchain)" > /dev/null 2>&1; elan --version; lean --version; lean --print-prefix; cargo --version; go version
BLOCK
  chmod 644 /tmp/setup.sh
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash /tmp/setup.sh > $R/setup.txt 2>&1
  EP=$(runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash -c "cd $W && lean --print-prefix")
  ( cd $EP && find bin lib include -type f | sort | xargs sha256sum ) > $R/toolchain-elan.sha256 2>/dev/null
  ( cd $LP && find bin lib include -type f | sort | xargs sha256sum ) > $R/toolchain-official.sha256 2>/dev/null
  cmp -s $R/toolchain-elan.sha256 $R/toolchain-official.sha256 && log "toolchain: elan's $EP is byte-identical to the digest-checked archive ($(wc -l < $R/toolchain-official.sha256) files)" || log "TOOLCHAIN WARNING: elan's toolchain differs from the official archive (toolchain-*.sha256)"
}

s_k0() {
  cp $W/lake-manifest.json $R/K0-manifest.before.json
  step K0U 7200 $W bash -c 'for t in 1 2 3 4 5 6; do lake update && exit 0; echo "lake update attempt $t failed" >&2; sleep $((t*60)); done; exit 1'
  cp $W/lake-manifest.json $R/K0-manifest.after.json
  cmp -s $R/K0-manifest.before.json $R/K0-manifest.after.json && log "K0U: lake-manifest.json unchanged by lake update" || log "K0U: lake-manifest.json CHANGED by lake update (K0-manifest.*.json)"
  grep -hE "compatibility patch|applied|patch" $R/K0U.out $R/K0U.err > $R/K0-patches-applied.txt 2>/dev/null
  log "K0U patch lines: $(wc -l < $R/K0-patches-applied.txt) ($(grep -c 'applied compatibility patch' $R/K0-patches-applied.txt) 'applied', $(grep -c 'verified after' $R/K0-patches-applied.txt) 'verified')"
  # every package at its manifest revision; which packages have local changes; the closure re-hashed in the live tree
  ( cd $W/.lake/packages && for d in */; do d=${d%/}; echo "$d $(runuser -u $U -- git -C $d rev-parse HEAD 2>/dev/null) changed-files=$(runuser -u $U -- git -C $d status --porcelain 2>/dev/null | wc -l)"; done ) > $R/K0-packages.txt
  python3 -I - $W $LP $R <<'PY' > $R/K0-closure-rehash.txt
import hashlib, os, sys
W, LP, R = sys.argv[1:4]
bad, n, missing = [], 0, []
for l in open(R + '/target-SHA256SUMS'):
    h, p = l.rstrip('\n').split('  ', 1)
    if p.startswith('math/lean/'): f = os.path.join(W, p[len('math/lean/'):])
    elif p.startswith('pkg/'):
        name, rest = p[4:].split('/', 1)
        f = os.path.join(W, '.lake', 'packages', name.strip('«»'), rest)
        if not os.path.exists(f): f = os.path.join(W, '.lake', 'packages', name, rest)
    elif p.startswith('toolchain/src/'): f = os.path.join(LP, p[len('toolchain/'):])
    else: continue
    n += 1
    if not os.path.exists(f): missing.append(p); continue
    if hashlib.sha256(open(f, 'rb').read()).hexdigest() != h: bad.append(p)
for p in bad: print('DIFFERS ' + p)
for p in missing: print('MISSING ' + p)
print('re-hashed %d files of target-SHA256SUMS in the live tree after lake update: %d differ, %d missing' % (n, len(bad), len(missing)))
PY
  log "K0 closure after lake update: $(tail -1 $R/K0-closure-rehash.txt)"
  step K0M 3600 $W bash -c 'for t in 1 2 3 4 5; do lake exe cache get && exit 0; sleep $((t*30)); done; exit 1'
  # the judges build meanwhile (nice), in their own folder; waited for before K1
  ( s_judges ) > /dev/null 2>&1 &
  echo $! > $R/judges.pid
  step K0B 21600 $W lake build $SOL $CHAL
  grep -c "declaration uses" $R/K0B.out > $R/K0-sorry-count.txt; grep -n "declaration uses" $R/K0B.out > $R/K0-sorry.txt
  log "K0B: built $(grep -cE '\[[0-9]+/[0-9]+\] Built' $R/K0B.out) modules, replayed $(grep -cE '\[[0-9]+/[0-9]+\] Replayed' $R/K0B.out), last line: $(tail -1 $R/K0B.out | cut -c1-160); sorry warnings: $(cat $R/K0-sorry-count.txt) ($(grep -vc 'ComparatorChallenges/MatrixExponent.lean' $R/K0-sorry.txt) outside the challenge)"
  { echo "import $SOL"; for t in $THMS; do echo "#print axioms $t"; done; } > $A/Axioms.lean; chown $U:$U $A/Axioms.lean; cp $A/Axioms.lean $R/K0A-Axioms.lean
  step K0A 3600 $W lake env lean $A/Axioms.lean
  log "K0A axioms: $(tr '\n' ' ' < $R/K0A.out | grep -oE "depends on axioms: \[[^]]*\]" | sort | uniq -c | tr '\n' ' ')"
  # grep every closure file (the sealed list), in the tree that was built
  python3 -I - $W $LP $R <<'PY'
import os, re, sys, collections
W, LP, R = sys.argv[1:4]
pats = [('native_decide', r'native_decide'), ('implemented_by', r'implemented_by'), ('extern', r'@\[\s*extern|\bextern\b'),
        ('axiom-declaration', r'^\s*(@\[[^\]]*\]\s*)?((private|protected|noncomputable|unsafe|partial|public)\s+)*axiom\s'),
        ('opaque', r'\bopaque\b'), ('unsafe', r'\bunsafe\b'), ('csimp', r'csimp')]
out, cnt = open(R + '/K0-grep.txt', 'w'), collections.Counter()
for l in open(R + '/target-SHA256SUMS'):
    h, p = l.rstrip('\n').split('  ', 1)
    if not p.endswith('.lean'): continue
    if p.startswith('math/lean/'): f, pkg = os.path.join(W, p[len('math/lean/'):]), 'OAI-release'
    elif p.startswith('pkg/'):
        name, rest = p[4:].split('/', 1); pkg = name
        f = os.path.join(W, '.lake', 'packages', name.strip('«»'), rest)
    elif p.startswith('toolchain/src/'): f, pkg = os.path.join(LP, p[len('toolchain/'):]), 'lean4-core'
    else: continue
    for i, line in enumerate(open(f, encoding='utf-8', errors='replace'), 1):
        for k, rx in pats:
            if re.search(rx, line):
                cnt[(pkg, k)] += 1; out.write('%s\t%s:%d\t%s\n' % (k, p, i, line.strip()[:200]))
out.close()
with open(R + '/K0-grep-summary.txt', 'w') as s:
    for (pkg, k), v in sorted(cnt.items()): s.write('%s %s %d\n' % (pkg, k, v))
    s.write('OAI-release total: %d\n' % sum(v for (pkg, k), v in cnt.items() if pkg == 'OAI-release'))
PY
  log "K0 grep: $(wc -l < $R/K0-grep.txt) lines over the closure; OAI files: $(grep 'OAI-release' $R/K0-grep-summary.txt | tr '\n' ';')"
  # KR starts now, beside the rest (it replays every declaration of the closure from scratch; the longest row)
  ( STEPENV="PATH=$LP/bin:$UPATH" step KR 172800 $W lake env $LP/bin/leanchecker --fresh $SOL; log "KR finished (exit $(ex KR))" ) &
  echo $! > $R/KR.pid
}

s_judges() {
  cat > /tmp/judges.sh <<BLOCK
set -uo pipefail
export PATH=$UPATH GIT_TERMINAL_PROMPT=0
cd $T
rec() { echo "\$1 \$(git -C \$2 rev-parse HEAD) \$(git -C \$2 describe --tags --always 2>/dev/null)"; }
clone() { for t in 1 2 3; do [ -d \$2/.git ] && return 0; git clone -q \$1 \$2 && return 0; rm -rf \$2; sleep 20; done; return 1; }
clone https://github.com/leanprover/comparator.git comparator && git -C comparator checkout -q $CMPPIN && rec comparator comparator
(cd comparator && echo "comparator toolchain as tagged: \$(cat lean-toolchain); manifest packages: \$(python3 -I -c 'import json;print([p["name"] for p in json.load(open("lake-manifest.json"))["packages"]])')" && echo 'leanprover/lean4:v4.34.1' > lean-toolchain && sed -i 's/"rev": "[0-9a-f]\{40\}"/"rev": "$LEXPIN"/' lake-manifest.json && nice -n 10 lake build lean4export comparator 2>&1 | tail -2)
echo "lean4export \$(git -C comparator/.lake/packages/lean4export rev-parse HEAD)"
clone https://github.com/Zouuup/landrun.git landrun && git -C landrun checkout -q $LRNPIN && rec landrun landrun
(cd landrun && nice -n 10 go build -o landrun ./cmd/landrun 2>&1 | tail -2)
clone https://github.com/ammkrn/nanoda_lib.git nanoda-3a24 && git -C nanoda-3a24 checkout -q $ND1PIN && rec nanoda-3a24 nanoda-3a24
(cd nanoda-3a24 && nice -n 10 cargo build --release 2>&1 | tail -1)
clone https://github.com/ammkrn/nanoda_lib.git nanoda-d0a0 && git -C nanoda-d0a0 checkout -q $ND2PIN && rec nanoda-d0a0 nanoda-d0a0
(cd nanoda-d0a0 && nice -n 10 cargo build --release 2>&1 | tail -1)
clone https://github.com/leanprover/con-leche.git con-leche && git -C con-leche checkout -q $CLPIN && rec con-leche con-leche
(cd con-leche && echo "con-leche toolchain \$(cat lean-toolchain)" && elan toolchain install "\$(cat lean-toolchain)" > /dev/null 2>&1; nice -n 10 lake build 2>&1 | tail -2)
for d in nanoda-3a24 nanoda-d0a0 con-leche comparator landrun; do echo "\$d local changes: \$(git -C \$d status --porcelain | grep -v '^??' | wc -l) (\$(git -C \$d diff --name-only | tr '\n' ' '))"; done
BLOCK
  chmod 644 /tmp/judges.sh
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash /tmp/judges.sh > $R/judges.txt 2>&1
  sha256sum $CMP $LEX $LRN $ND1 $ND2 $CL > $R/judges.sha256 2>&1
  date -u +%Y-%m-%dT%H:%M:%SZ > $R/judges.done
}

s_judges_wait() {
  [ -s $R/judges.done ] || { while kill -0 $(cat $R/judges.pid 2>/dev/null) 2>/dev/null; do sleep 10; done; }
  [ -s $R/judges.done ] || s_judges
  ok=1
  for p in "comparator $CMPPIN" "lean4export $LEXPIN" "landrun $LRNPIN" "nanoda-3a24 $ND1PIN" "nanoda-d0a0 $ND2PIN" "con-leche $CLPIN"; do grep -q "^$p" $R/judges.txt || ok=0; done
  for b in $CMP $LEX $LRN $ND1 $ND2 $CL; do [ -x $b ] || ok=0; done
  [ $ok = 1 ] && log "JUDGES-OK: $(awk '{print $1": "substr($2,1,8)}' $R/judges.txt | grep -E '^(comparator|lean4export|landrun|nanoda|con-leche)' | tr '\n' ' ')" || stop "a judge did not build at its pin (judges.txt)"
  ln -sf $LEX $H/cmpbin/lean4export; ln -sf $ND1 $H/cmpbin/nanoda_bin; ln -sf $LRN $H/cmpbin/landrun
  runuser -u $U -- $CL --help > $R/con-leche-help.txt 2>&1; runuser -u $U -- $LEX --help > $R/lean4export-help.txt 2>&1
  grep -rhoE 'COMPARATOR_[A-Z_]+' $T/comparator/Comparator* $T/comparator/*.lean 2>/dev/null | sort -u > $R/comparator-env-vars.txt
}

s_k1() {
  # landrun: does it sandbox on this container? (the same probe as the Alpöge lane)
  if runuser -u $U -- $LRN --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/true > $R/landrun-test.txt 2>&1; then
    echo $LRN > $R/landrun.use; echo "sandbox (landrun $LRNPIN)" > $R/K1.mode
  else
    echo "landrun cannot sandbox here (landrun-test.txt)" > $R/K1.mode; stop "landrun cannot sandbox on this container: K1 as specified cannot run (a pass-through would be a deviation)"
  fi
  log "K1 mode: $(cat $R/K1.mode); Comparator reads $(tr '\n' ' ' < $R/comparator-env-vars.txt)"
  cp $W/ComparatorChallenges/MatrixExponent.json $R/K1-config.json
  STEPENV="$(CMPENV)" step K1 43200 $W lake env $CMP ComparatorChallenges/MatrixExponent.json
  grep -q 'Your solution is okay!' $R/K1.out $R/K1.err && [ "$(ex K1)" = 0 ] && { log "K1-OK (the config as released, Lean's kernel)"; progress "K1 accepted (Comparator d03acab1, config as released, nanoda off), exit 0"; } || { log "K1-NOT-OK (exit $(ex K1))"; progress "K1 NOT accepted (exit $(ex K1))"; }
  python3 -I -c 'import json,sys; c=json.load(open(sys.argv[1])); c["enable_nanoda"]=True; json.dump(c, open(sys.argv[2],"w"), indent=2)' $W/ComparatorChallenges/MatrixExponent.json $A/k1n.json; chown $U:$U $A/k1n.json; cp $A/k1n.json $R/K1N-config.json
  STEPENV="$(CMPENV)" step K1N 43200 $W lake env $CMP $A/k1n.json
  grep -q 'Your solution is okay!' $R/K1N.out $R/K1N.err && [ "$(ex K1N)" = 0 ] && { log "K1N-OK (nanoda 3a240721 on)"; progress "K1N accepted (nanoda 3a240721 inside Comparator), exit 0"; } || { log "K1N-NOT-OK (exit $(ex K1N))"; progress "K1N NOT accepted (exit $(ex K1N))"; }
}

mkchal() {  # name sed-expression — a control challenge: the pinned file with exactly one line changed
  local f=$W/ComparatorChallenges/MatrixExponent$1.lean
  sed "$2" $W/ComparatorChallenges/MatrixExponent.lean > /tmp/ch.lean; install -o $U -g $U -m 644 /tmp/ch.lean $f
  diff $W/ComparatorChallenges/MatrixExponent.lean $f > $R/$1.diff; sha256sum $f > $R/$1-file.sha256
  [ "$(grep -c '^[<>]' $R/$1.diff)" = 2 ] || stop "control $1 changes other than one line ($1.diff)"
}

s_exp() {
  mkchal C1a 's|theorem square_exponent (F : Type\*) \[Field F\] : formalOmega F 1 1 1 = (9 : ℝ) / 4 := by|theorem square_exponent (F : Type*) [Field F] : formalOmega F 1 1 1 = (2.24 : ℝ) := by|'
  mkchal C1b 's|theorem dual_exponent (F : Type\*) \[Field F\] : formalAlpha F = (1 : ℝ) / 2 := by|theorem dual_exponent (F : Type*) [Field F] : formalAlpha F = (0.49 : ℝ) := by|'
  mkchal C3 's#^  | \.mul _ _ => 1$#  | .mul _ _ => 2#'
  step CB 7200 $W lake build ComparatorChallenges.MatrixExponentC1a ComparatorChallenges.MatrixExponentC1b ComparatorChallenges.MatrixExponentC3
  mkdir -p $D && chown $U:$U $D
  step EXP 21600 $W bash -c "lake env $LEX $SOL -- $THMS > $D/export.ndjson"
  step EXPC 7200 $W bash -c "lake env $LEX $CHAL -- $THMS > $D/challenge.ndjson"
  for c in C1a C1b C3; do step EXP$c 7200 $W bash -c "lake env $LEX ComparatorChallenges.MatrixExponent$c -- $THMS > $D/challenge-$c.ndjson"; done
  chown -R root:root $D; chmod 755 $D; chmod 644 $D/*.ndjson
  ( cd $D && sha256sum *.ndjson && ls -la ) > $R/exports.sha256
  log "exports: $(grep ndjson $R/exports.sha256 | head -6 | awk '{print $2": "substr($1,1,16)}' | tr '\n' ' ')"
  head -c 600 $D/export.ndjson > $R/export-head.txt
}

s_k2k3() {
  cat > $D/nanoda.json <<EOF
{"export_file_path": "$D/export.ndjson", "use_stdin": false, "num_threads": $NT,
 "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,
 "nat_extension": true, "string_extension": true, "print_success_message": true}
EOF
  chmod 644 $D/nanoda.json; cp $D/nanoda.json $R/K2-nanoda.json
  step K2 43200 $D $ND2 $D/nanoda.json
  progress "K2 nanoda d0a02cc5 on the export: exit $(ex K2); $(grep -hE 'Checked [0-9]+ declarations' $R/K2.out $R/K2.err | head -1)"
  VF=--verified
  step K3 43200 $D $CL $VF --jobs=$NT $D/export.ndjson
  step K3C 14400 $D $CL $VF --jobs=$NT --compare -- $D/challenge.ndjson $D/export.ndjson
  progress "K3 con-leche 5ea446d5 ${VF:-(default mode)} on the export: exit $(ex K3); --compare: exit $(ex K3C), $(cat $R/K3C.out $R/K3C.err | grep -c 'justified by the solution') 'justified' lines"
}

s_controls() {
  # C1: two planted statement changes; Comparator (as released, Lean's kernel) and con-leche --compare must refuse
  for c in C1a C1b C3; do
    python3 -I -c 'import json,sys; c=json.load(open(sys.argv[1])); c["challenge_module"]="ComparatorChallenges.MatrixExponent"+sys.argv[3]; json.dump(c, open(sys.argv[2],"w"), indent=2)' $W/ComparatorChallenges/MatrixExponent.json $A/$c.json $c
    chown $U:$U $A/$c.json; cp $A/$c.json $R/$c-config.json
    STEPENV="$(CMPENV)" step ${c}CMP 14400 $W lake env $CMP $A/$c.json
    step ${c}CL 14400 $D $CL --verified --jobs=$NT --compare -- $D/challenge-$c.ndjson $D/export.ndjson
  done
  # C2: square_exponent re-typed as False; nanoda d0a02cc5 and con-leche must refuse
  python3 -I $V/c2.py OAI.LinearAlgebra.SpectralBooks.square_exponent < $D/export.ndjson > $D/export-c2.ndjson 2> $R/C2-make.txt; echo "exit $?" >> $R/C2-make.txt; chmod 644 $D/export-c2.ndjson
  sha256sum $D/export-c2.ndjson >> $R/exports.sha256
  sed "s#\"export_file_path\": \"[^\"]*\"#\"export_file_path\": \"$D/export-c2.ndjson\"#" $D/nanoda.json > $D/nanoda-c2.json; chmod 644 $D/nanoda-c2.json; cp $D/nanoda-c2.json $R/C2-nanoda.json
  step C2ND 43200 $D $ND2 $D/nanoda-c2.json
  VF=--verified
  step C2CL 43200 $D $CL $VF --jobs=$NT $D/export-c2.ndjson
  okm() { grep -q 'Your solution is okay!' $R/$1.out $R/$1.err; }
  for c in C1a C1b C3; do log "$c: Comparator exit $(ex ${c}CMP)$(okm ${c}CMP && echo ' ACCEPTED (!)'), con-leche --compare exit $(ex ${c}CL)"; done
  log "C2: $(head -1 $R/C2-make.txt); nanoda exit $(ex C2ND), con-leche exit $(ex C2CL)"
}

s_cen() {
  install -o $U -g $U -m 644 $V/Census.lean $A/Census.lean; sha256sum $A/Census.lean > $R/CEN-file.sha256
  step CEN 14400 $W lake env lean $A/Census.lean
  # G2/G3, by source: names anywhere in OAI (the whole library, read only, nothing built)
  ( cd $W && grep -rnE 'border[_ ]?[Rr]ank|[Bb]orderRank|asymptotic[_ ]?[Rr]ank|[Aa]symptoticRank|geometric[_ ]?[Bb]order' --include='*.lean' OAI | grep -E '^[^:]+:[0-9]+:\s*(theorem|lemma|def|noncomputable def|abbrev|structure)' ) > $R/CEN-G3-names.txt
  ( cd $W && grep -rnE '\|\s*(div|inv|division|reciprocal)\b|Gate\.(div|inv)|DivisionGate|withDivision|division[_ ]?gate' --include='*.lean' OAI ) > $R/CEN-G2-division.txt
  ( cd $W && grep -rnE '\(9 : ℝ\) / 4|9 / 4|n \^ \(9|\^ \(\(9 : ℝ\) / 4\)|⌈.*9.*4.*⌉|Nat\.ceil.*9' --include='*.lean' OAI | grep -E '^[^:]+:[0-9]+:\s*(theorem|lemma)|:\s' ) > $R/CEN-G3-perN.txt
  log "CEN: exit $(ex CEN); G3 names: $(wc -l < $R/CEN-G3-names.txt) lines; G2 division: $(wc -l < $R/CEN-G2-division.txt); G3 per-n (9/4 literals): $(wc -l < $R/CEN-G3-perN.txt)"
}

s_kr_wait() {
  while kill -0 $(cat $R/KR.pid 2>/dev/null) 2>/dev/null; do sleep 30; done
  log "KR exit $(ex KR) after $(( $(cat $R/KR.end) - $(cat $R/KR.start) )) s"
  progress "KR leanchecker --fresh $SOL: exit $(ex KR)"
}

if [ "$MODE" = run ]; then
  s_prep; s_k0
  progress "K0: lake update $(ex K0U), cache $(ex K0M), build $(ex K0B), axioms $(ex K0A)"
  s_judges_wait; s_k1; s_exp; s_k2k3; s_controls; s_cen
  log "SUMMARY K0U=$(ex K0U) K0M=$(ex K0M) K0B=$(ex K0B) K0A=$(ex K0A) K1=$(ex K1) K1N=$(ex K1N) EXP=$(ex EXP) K2=$(ex K2) K3=$(ex K3) K3C=$(ex K3C) C1aCMP=$(ex C1aCMP) C1aCL=$(ex C1aCL) C1bCMP=$(ex C1bCMP) C1bCL=$(ex C1bCL) C2ND=$(ex C2ND) C2CL=$(ex C2CL) C3CMP=$(ex C3CMP) C3CL=$(ex C3CL) CEN=$(ex CEN)"
  s_kr_wait
  log "P1 DONE"
fi
if [ "$MODE" = stage ]; then shift; for s in "$@"; do log "stage $s (re-run)"; s_$s; done; fi
