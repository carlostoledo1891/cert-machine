#!/bin/bash
# cert-machine, 2026-11-05: nomeata's request on leanprover/con-leche#16 ("Could you try latest master?"). The same export as
# the comparator made on the OpenAI chain (sha256 d9cae367…, 2,452,607,904 bytes), re-made here from claimbox bdf357ef on
# Lean v4.36.0-rc2; then con-leche built from its master (its own toolchain, lake) and run on it, --verified (the default)
# and --trusted; con-ron master likewise if it builds. Facts in /results (port 8000). Run as root; work as `tester`.
# The second run (2026-11-05 ~22:15 UTC): on 8 vCPU / 64 GB, con-leche master at --jobs=16 was killed by the cgroup at
# 62 GB RSS after 236 s (exit 137, nothing printed). JOBS (default "16") is the list of --jobs values each con-leche mode
# tries in order, the next one only after an exit 137 (killed: memory), every attempt kept as its own step;
# SKIP_CONRON=1 skips E6/E7 when con-ron master was already measured.
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${CLAIMBOX_SHA:?}"
REPO=https://github.com/carlostoledo1891/claimbox.git
TOOLCHAIN=leanprover/lean4:v4.36.0-rc2
EXPORT_SHA=d9cae367b15b195b381b88005c4af866b7a6e36e7388794d1136cb0ad03782f2
R=/results U=tester H=/home/tester
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar xz-utils zstd build-essential procps util-linux < /dev/null > /dev/null
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
mkdir -p $R && chown $U:$U $R
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 & echo $! > /tmp/http.pid)
status() { flock /tmp/status.lock python3 - "$@" <<'EOF'
import json, sys, os, time
p = '/results/_status.json'
s = json.load(open(p)) if os.path.exists(p) else {}
s[sys.argv[1]] = sys.argv[2]; s['_updated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(s, open(p + '.tmp', 'w'), indent=1); os.replace(p + '.tmp', p)
EOF
chmod 644 /results/_status.json; }
status _claimbox "$CLAIMBOX_SHA"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _machine "$(nproc) vCPU; cgroup memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null)"
step() {
  local n=$1 to=$2 dir=$3; shift 3
  status _phase "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$H/.elan/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  status "$n" "exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
CB=$H/claimbox W=$CB/lean/eth-bridge
cat > /tmp/E1.sh <<BLOCK
set -euo pipefail
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
export PATH=\$HOME/.elan/bin:\$PATH
for t in 1 2 3 4 5; do rm -rf $CB; git clone -q $REPO $CB && break; sleep \$((t * 60)); done
git -C $CB checkout -q $CLAIMBOX_SHA && test "\$(git -C $CB rev-parse HEAD)" = $CLAIMBOX_SHA
cd $W && test "\$(cat lean-toolchain)" = $TOOLCHAIN && elan toolchain install $TOOLCHAIN
for t in 1 2 3 4 5; do lake exe cache get && break; sleep \$((t * 60)); done
lean --version
BLOCK
chmod 644 /tmp/E1.sh; step E1 7200 / bash /tmp/E1.sh
[ "$(cat $R/E1.exit)" = 0 ] || { status _phase "STOPPED: E1 failed"; sleep infinity; }
step E2 28800 $W lake build EthBridge.OpenAIChain
[ "$(cat $R/E2.exit)" = 0 ] || { status _phase "STOPPED: E2 failed"; sleep infinity; }
DECLS="Quot Quot.mk Quot.lift Quot.ind EthBridge.OpenAIChain.not_eth propext Quot.sound Classical.choice Nat.add Nat.sub Nat.mul Nat.pow Nat.gcd Nat.div Nat.mod Nat.beq Nat.ble Nat.land Nat.lor Nat.xor Nat.shiftLeft Nat.shiftRight String.ofList Char.ofNat List eagerReduce Nat String String.mk Char optParam autoParam semiOutParam outParam"
X=$H/export-comparator.ndjson
step E3 7200 $W bash -c "lake env leanexport EthBridge.OpenAIChain -- $DECLS > $X && ls -l $X && sha256sum $X"
[ "$(cat $R/E3.exit)" = 0 ] || { status _phase "STOPPED: E3 failed"; sleep infinity; }
GOT=$(grep -o -E '^[0-9a-f]{64}' $R/E3.out | head -1); status export_sha "$GOT"
[ "$GOT" = "$EXPORT_SHA" ] && status export_equal "yes: the same bytes the comparator judged on 2026-11-05" || status export_equal "NO: $GOT vs $EXPORT_SHA (the run still measures con-leche master, on this export)"
# con-leche from master: its own toolchain (lean-toolchain in the repo), lake
cat > /tmp/E4.sh <<'BLOCK'
set -euo pipefail
export PATH=$HOME/.elan/bin:$PATH
mkdir -p $HOME/src && cd $HOME/src && rm -rf con-leche && git clone -q https://github.com/leanprover/con-leche.git && cd con-leche
echo "con-leche master $(git rev-parse HEAD) $(git log -1 --format=%cI)"; cat lean-toolchain
elan toolchain install "$(cat lean-toolchain)"
lake build 2>&1 | tail -5
ls -l .lake/build/bin/ 2>/dev/null || true
BLOCK
chmod 644 /tmp/E4.sh; step E4 7200 / bash /tmp/E4.sh
CL=$(ls $H/src/con-leche/.lake/build/bin/* 2>/dev/null | head -1)
if [ "$(cat $R/E4.exit)" = 0 ] && [ -n "$CL" ]; then
  status conleche_bin "$CL"
  for mode in verified trusted; do
    flag=""; [ $mode = trusted ] && flag=--trusted
    for j in ${JOBS:-16}; do
      n=E5.con-leche-master$([ $mode = trusted ] && echo -trusted)-j$j
      step $n 14400 /tmp env LEAN_ABORT_ON_PANIC=1 CON_LECHE_VERBOSE=1 $CL $flag --jobs=$j $X
      [ "$(cat $R/$n.exit)" = 137 ] || break
    done
  done
else
  status _note "con-leche master did not build (E4 exit $(cat $R/E4.exit)); see E4.err"
fi
# con-ron from master, the same way, if it builds
[ "${SKIP_CONRON:-0}" = 1 ] && { status _phase complete; status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"; sleep infinity; }
cat > /tmp/E6.sh <<'BLOCK'
set -euo pipefail
export PATH=$HOME/.elan/bin:$PATH
cd $HOME/src && rm -rf con-ron && git clone -q https://github.com/leanprover/con-ron.git && cd con-ron
echo "con-ron master $(git rev-parse HEAD) $(git log -1 --format=%cI)"; cat lean-toolchain 2>/dev/null || true; ls
if [ -f Cargo.toml ]; then curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal > /dev/null; export PATH=$HOME/.cargo/bin:$PATH; cargo build --release -q; ls -l target/release/ | head; fi
if [ -f lakefile.toml ] || [ -f lakefile.lean ]; then elan toolchain install "$(cat lean-toolchain)"; lake build 2>&1 | tail -3; ls -l .lake/build/bin/ 2>/dev/null || true; fi
BLOCK
chmod 644 /tmp/E6.sh; step E6 7200 / bash /tmp/E6.sh
CR=$(ls $H/src/con-ron/target/release/con-ron $H/src/con-ron/.lake/build/bin/* 2>/dev/null | head -1)
if [ "$(cat $R/E6.exit)" = 0 ] && [ -n "$CR" ]; then
  status conron_bin "$CR"
  step E7.con-ron-master 14400 /tmp env LEAN_ABORT_ON_PANIC=1 CON_LECHE_VERBOSE=1 $CR --jobs=16 $X
fi
status _phase complete; status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
