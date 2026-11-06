#!/usr/bin/env bash
# runpod-zq-nanoda-bisect.sh — for ammkrn/nanoda_lib#82 ("memory overflow" in num-bigint's pow on ZInQ.ExplicitCutoffBounds,
# a module of github.com/elliotglazer/diophantine-z-q at 97cec7fd that Lean's own kernel accepts): which of the module's
# declarations makes nanoda v0.4.31 evaluate the power. Informational, for the maintainer's question; decides nothing.
#
# Each named declaration is exported ALONE (`leanexport ZInQ.ExplicitCutoffBounds -- <name>`, its closure included) and
# replayed by nanoda with the config of the issue; Lean's leanchecker replays the same module for comparison. Every step
# writes <step>.log/.exit/.time into $OUT. The claimant's repository has no licence: its files never leave the pod.
#
# usage (on the pod): nohup bash /root/bisect/runpod-zq-nanoda-bisect.sh setup clone cache build nanoda-build bisect &
set -uo pipefail
R=/root/bisect; OUT=$R/out; WORK=$R/work; CLONE=$R/src/diophantine-z-q; D=$CLONE/lean
PIN=97cec7fdd757d9a8e4f468151a47a6d3610fb2f2; URL=https://github.com/elliotglazer/diophantine-z-q.git
BIN=/root/.elan/toolchains/leanprover--lean4---v4.35.0/bin
NANODA_PIN=8de7e0c4ed3052745a7f8725164efd9e76d84c56; NANODA=$R/bin/nanoda_bin-0.4.31
M=ZInQ.ExplicitCutoffBounds
NAMES="ZInQ.ExplicitCutoffBounds.d ZInQ.ExplicitCutoffBounds.factorialBase ZInQ.ExplicitCutoffBounds.g0 ZInQ.ExplicitCutoffBounds.t ZInQ.ExplicitCutoffBounds.t_lt_triplePower"
export PATH=/root/.elan/bin:$PATH GIT_TERMINAL_PROMPT=0 RUSTUP_HOME=$R/rust/rustup CARGO_HOME=$R/rust/cargo
mkdir -p "$OUT" "$WORK" "$R/bin" "$R/src"
status() { echo "$(date -u +%FT%TZ) $*" >> "$OUT/_status.txt"; }
step() {  # step NAME TIMEOUT DIR CMD...
  local n=$1 t=$2 d=$3; shift 3; status "start $n"
  if [ -x /usr/bin/time ]; then (cd "$d" && /usr/bin/time -v -o "$OUT/$n.time" timeout "$t" "$@" > "$OUT/$n.log" 2>&1 < /dev/null)
  else (cd "$d" && timeout "$t" "$@" > "$OUT/$n.log" 2>&1 < /dev/null); fi; echo $? > "$OUT/$n.exit"   # setup installs time
  status "end $n exit $(cat "$OUT/$n.exit")"
}
cfg() {  # cfg EXPORT CONFIG
  printf '{"export_file_path": "%s", "use_stdin": false, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "unpermitted_axiom_hard_error": false, "nat_extension": true, "string_extension": true, "num_threads": 8, "print_success_message": true, "stack_size_bytes": 1073741824}\n' "$1" > "$2"
}
for S in "$@"; do case "$S" in
setup)
  step setup 1800 / bash -c 'export DEBIAN_FRONTEND=noninteractive; apt-get update -qq && apt-get install -y -qq git curl zstd python3 time build-essential pkg-config libssl-dev > /dev/null
    test -x /root/.elan/bin/elan || curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
    /root/.elan/bin/elan toolchain install leanprover/lean4:v4.35.0 && ls '"$BIN"'' ;;
clone)
  step clone 1800 "$R/src" bash -c "rm -rf $CLONE && git clone -q --filter=blob:none --no-checkout $URL $CLONE && git -C $CLONE sparse-checkout set lean && git -C $CLONE checkout -q $PIN && test \"\$(git -C $CLONE rev-parse HEAD)\" = $PIN" ;;
cache) step cache 3600 "$D" lake exe cache get ;;
build) step build 3600 "$D" lake build "$M" ;;
nanoda-build)
  step nanoda-build 3600 "$R" bash -c "set -e
    curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal --no-modify-path
    rm -rf $R/nanoda_lib && git clone -q https://github.com/ammkrn/nanoda_lib.git $R/nanoda_lib && cd $R/nanoda_lib && git checkout -q $NANODA_PIN
    test \"\$(git rev-parse HEAD)\" = $NANODA_PIN; $CARGO_HOME/bin/cargo build --release --locked -q; cp target/release/nanoda_bin $NANODA; sha256sum $NANODA" ;;
bisect)
  # Lean's own checker on the module, for comparison
  step leanchecker 3600 "$D" lake env "$BIN/leanchecker" "$M"
  # all five names together (the issue's export), then each alone
  step export-all 1800 "$D" bash -c "lake env $BIN/leanexport $M -- $NAMES > $WORK/all.export"
  cfg "$WORK/all.export" "$WORK/all.json"; step nanoda-all 3600 "$R" "$NANODA" "$WORK/all.json"
  for N in $NAMES; do s=${N##*.}
    step "export-$s" 1800 "$D" bash -c "lake env $BIN/leanexport $M -- $N > $WORK/$s.export"
    sha256sum "$WORK/$s.export" | cut -d' ' -f1 > "$OUT/export-$s.sha256"; wc -c < "$WORK/$s.export" > "$OUT/export-$s.bytes"
    cfg "$WORK/$s.export" "$WORK/$s.json"; step "nanoda-$s" 3600 "$R" "$NANODA" "$WORK/$s.json"
  done ;;
*) status "unknown stage $S" ;;
esac; done
status "done: $*"
