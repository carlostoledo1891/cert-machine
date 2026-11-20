#!/usr/bin/env bash
# runpod-alpoge-grh-p2tools.sh — the judges for phase 2 of the Alpöge decision, built at low priority while B1 runs:
# lean4export (tag v4.33.0) and Comparator (standalone, tag v4.33.0, archived 2026-10-14 after its merge into core at v4.35),
# each built with the release's exact toolchain v4.33.1 (an .olean is read only by the Lean that wrote it); nanoda
# (ammkrn/nanoda_lib, the default branch at the commit recorded); landrun (Zouuup/landrun, main, as Comparator's README asks).
# Every commit is recorded in /results/P2tools.txt. Runs as root; Lean and cargo builds run as `tester`.
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=tester H=/home/tester T=$H/tools
export DEBIAN_FRONTEND=noninteractive
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log $R/P2tools.txt; }
apt-get install -y -qq golang-go pkg-config libssl-dev < /dev/null > /dev/null 2>&1 || log "apt golang failed"
mkdir -p $T && chown $U:$U $T
cat > /tmp/tools.sh <<'BLOCK'
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/lib/go/bin:/usr/local/go/bin:$PATH
T=$HOME/tools; cd $T
rec() { echo "$1 $(git -C $2 rev-parse HEAD) $(git -C $2 describe --tags --always 2>/dev/null)"; }
git clone -q https://github.com/leanprover/lean4export.git && git -C lean4export checkout -q v4.33.0 && rec lean4export lean4export
(cd lean4export && echo "toolchain as tagged: $(cat lean-toolchain)" && echo 'leanprover/lean4:v4.33.1' > lean-toolchain && nice -n 10 lake build 2>&1 | tail -3)
git clone -q https://github.com/leanprover/comparator.git && git -C comparator checkout -q v4.33.0 && rec comparator comparator
(cd comparator && echo "toolchain as tagged: $(cat lean-toolchain)" && echo 'leanprover/lean4:v4.33.1' > lean-toolchain && nice -n 10 lake build 2>&1 | tail -3)
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1; export PATH=$HOME/.cargo/bin:$PATH
git clone -q https://github.com/ammkrn/nanoda_lib.git && rec nanoda nanoda_lib
(cd nanoda_lib && nice -n 10 cargo build --release 2>&1 | tail -2; ls -la target/release/ | grep -i nanoda)
git clone -q https://github.com/Zouuup/landrun.git && rec landrun landrun
(cd landrun && nice -n 10 go build -o landrun ./cmd/landrun 2>&1 | tail -2; ls -la landrun)
ls $T/lean4export/.lake/build/bin $T/comparator/.lake/build/bin 2>&1
BLOCK
chmod 644 /tmp/tools.sh
runuser -u $U -- env -i HOME=$H PATH=/usr/local/bin:/usr/bin:/bin bash /tmp/tools.sh >> $R/P2tools.txt 2>&1
log "tools done (exit $?)"
