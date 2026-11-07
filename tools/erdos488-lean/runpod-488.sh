#!/usr/bin/env bash
# runpod-488.sh — P1, P2, P3 and the controls of PREREG-488.md (plumb, private). Run over SSH on a RunPod CPU pod:
#   nohup bash /root/p488/ours/runpod-488.sh STAGE... &
# stages: setup gist fc port p1 check audit checkers fresh controls redteam export nanoda probe
# Every step writes <step>.log/.exit/.time into $OUT (the only directory copied back). Nothing of ours edits the gist or
# formal-conjectures: the port is a COPY of formal-conjectures with one added lean_lib (Plumb) holding the gist's file
# byte for byte, our statement module and our checks.
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/root/p488; OURS=$R/ours; OUT=$R/out; WORK=$R/work
G=$R/gist; F=$R/fc; C=$R/port
GIST_URL=https://gist.github.com/d8e15e5ff1b6c7e99e3d86d7c66f1d08.git; GIST_PIN=034be67a5c958e55505bb357f9e4ef3015788465
GIST_SHA=f2a7dcfde9689e00db7b697c22eb6436c1b02d834555a28a476d9e5e606e9ca0
FC_URL=https://github.com/google-deepmind/formal-conjectures.git; FC_PIN=2055e5a
FC488_SHA=8eedda95f84b4a04e4615065059ac9dc584678b97e5a6b9df1a3c4812d5eecbe
M488='FormalConjectures.ErdosProblems.«488»'
export PATH=/root/.elan/bin:$PATH GIT_TERMINAL_PROMPT=0
mkdir -p "$OUT" "$WORK"
status() { echo "$(date -u +%FT%TZ) $*" >> "$OUT/_status.txt"; }
step() {  # step NAME TIMEOUT DIR CMD...
  local n=$1 t=$2 d=$3; shift 3; status "start $n"
  if [ -x /usr/bin/time ]; then (cd "$d" && /usr/bin/time -v -o "$OUT/$n.time" timeout "$t" "$@" > "$OUT/$n.log" 2>&1 < /dev/null)
  else (cd "$d" && timeout "$t" "$@" > "$OUT/$n.log" 2>&1 < /dev/null); fi; echo $? > "$OUT/$n.exit"
  status "end $n exit $(cat "$OUT/$n.exit")"
}
ok() { test -f "$OUT/$1.exit" && test "$(cat "$OUT/$1.exit")" = 0; }
need() { for s in "$@"; do ok "$s" || { status "skip: $s did not exit 0"; return 1; }; done; }
BIN() { echo /root/.elan/toolchains/leanprover--lean4---v4.33.1/bin; }
audit_file() { local f=$1; shift; awk -v mods="$*" '$0 == "import ZInQ" { n = split(mods, m, " "); for (i = 1; i <= n; i++) print "import " m[i]; next } { print }' "$OURS/zq-lean-audit.lean" > "$f"; }

for S in "$@"; do case "$S" in
setup)
  step setup 1800 / bash -c 'export DEBIAN_FRONTEND=noninteractive; apt-get update -qq && apt-get install -y -qq git curl zstd python3 time build-essential > /dev/null
    test -x /root/.elan/bin/elan || curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
    /root/.elan/bin/elan toolchain install leanprover/lean4:v4.33.0 && /root/.elan/bin/elan toolchain install leanprover/lean4:v4.33.1
    ls /root/.elan/toolchains/*/bin' ;;
gist)  # P2, first half: their file in their own environment, unchanged
  step gist-clone 900 "$R" bash -c "rm -rf $G && git clone -q $GIST_URL $G && git -C $G checkout -q $GIST_PIN && test \"\$(sha256sum $G/Erdos488.lean | cut -d' ' -f1)\" = $GIST_SHA"
  need gist-clone || continue
  step gist-update 1800 "$G" lake update
  step gist-cache 3600 "$G" lake exe cache get
  step gist-lean 7200 "$G" lake env lean Erdos488.lean ;;
fc)
  step fc-clone 1800 "$R" bash -c "rm -rf $F && git clone -q --filter=blob:none $FC_URL $F && git -C $F checkout -q $FC_PIN && test \"\$(sha256sum $F/FormalConjectures/ErdosProblems/488.lean | cut -d' ' -f1)\" = $FC488_SHA"
  need fc-clone || continue
  step fc-cache 3600 "$F" lake exe cache get
  step fc-build488 7200 "$F" lake build "$M488" ;;
port)  # P2, second half: the gist's file unchanged inside a copy of formal-conjectures (its toolchain and Mathlib)
  need fc-build488 gist-clone || continue
  rm -rf "$C"; cp -a "$F" "$C"; mkdir -p "$C/Plumb"
  cp "$G/Erdos488.lean" "$C/Plumb/Erdos488.lean"
  cp "$OURS"/P1.lean "$OURS"/Check.lean "$C/Plumb/"
  for f in "$OURS"/Ctl*.lean "$OURS"/Red*.lean; do [ -f "$f" ] && cp "$f" "$C/Plumb/"; done
  # P7: planted variants of the gist, generated here from the pinned file (the original stays byte for byte)
  sed 's/4096/1000/g' "$G/Erdos488.lean" > "$C/Plumb/Red1.lean"                                   # a false arithmetic claim
  sed 's/^lemma constant_ratio : 3 \* Q < 16 \* phiOdd := by decide$/lemma constant_ratio : 3 * Q < 16 * phiOdd := by sorry/' "$G/Erdos488.lean" > "$C/Plumb/Red2.lean"
  sed 's/^lemma constant_ratio : 3 \* Q < 16 \* phiOdd := by decide$/axiom plumbRedAxiom : 3 * Q < 16 * phiOdd\nlemma constant_ratio : 3 * Q < 16 * phiOdd := plumbRedAxiom/' "$G/Erdos488.lean" > "$C/Plumb/Red3.lean"
  perl -0pe 's/(theorem endpoint_gap : 2 \^ 4096 \* \(8 \* 4096 \+ 1\) \^ 53 < 3 \^ 4096 := by\n  )decide/$1native_decide/' "$G/Erdos488.lean" > "$C/Plumb/Red4.lean"
  for k in 2 3 4; do cmp -s "$G/Erdos488.lean" "$C/Plumb/Red$k.lean" && status "WARNING: Red$k equals the original (the substitution did not apply)"; done
  printf '\n[[lean_lib]]\nname = "Plumb"\n' >> "$C/lakefile.toml"
  (cd "$C/Plumb" && sha256sum *.lean) > "$OUT/port-files.sha256"
  step port-build 7200 "$C" lake build Plumb.Erdos488 ;;
p1)
  need port-build || continue
  step p1-build 3600 "$C" lake build Plumb.P1 ;;
check)
  need p1-build || continue
  step check 3600 "$C" env P488_OUT="$OUT/check.jsonl" lake env lean Plumb/Check.lean ;;
audit)
  need p1-build || continue
  audit_file "$WORK/audit.lean" Plumb.Erdos488 Plumb.P1
  step audit 3600 "$C" env ZQ_AUDIT_OUT="$OUT/audit.jsonl" ZQ_AUDIT_ROOT=Plumb ZQ_AUDIT_TYPECONSTS=1 lake env lean "$WORK/audit.lean" ;;
checkers)
  need p1-build || continue
  B=$(BIN); ls "$B" > "$OUT/toolchain-bin.txt"
  for T in leanchecker leanchecker-paranoid; do
    if [ -x "$B/$T" ]; then step "$T" 7200 "$C" lake env "$B/$T" --verbose Plumb.P1; else status "absent: $T in v4.33.1"; fi
  done ;;
fresh)
  need p1-build || continue
  B=$(BIN); [ -x "$B/leanchecker" ] && step fresh 43200 "$C" lake env "$B/leanchecker" --fresh --verbose Plumb.P1 ;;
controls)  # P1 controls: each module must FAIL to build (a statement that is not DeepMind's)
  need port-build || continue
  for f in "$C"/Plumb/Ctl*.lean; do m=$(basename "$f" .lean); step "ctl-$m" 3600 "$C" lake build "Plumb.$m"; done ;;
redteam)  # P7: planted variants of the gist; each must fail to build or be flagged by the audit
  need port-build || continue
  for f in "$C"/Plumb/Red*.lean; do m=$(basename "$f" .lean); step "red-$m" 3600 "$C" lake build "Plumb.$m"
    if ok "red-$m"; then audit_file "$WORK/audit-$m.lean" "Plumb.$m"
      step "red-audit-$m" 3600 "$C" env ZQ_AUDIT_OUT="$OUT/red-audit-$m.jsonl" ZQ_AUDIT_ROOT="Plumb.$m" lake env lean "$WORK/audit-$m.lean"; fi
  done ;;
lean4export)  # the exporter, built for v4.33.1 (the toolchain does not bundle it)
  step lean4export-build 3600 "$R" bash -c "rm -rf $R/lean4export && git clone -q https://github.com/leanprover/lean4export $R/lean4export && cd $R/lean4export && (git checkout -q v4.33.1 2>/dev/null || git checkout -q \$(git tag --list 'v4.33*' | tail -1) 2>/dev/null || true) && git log --oneline -1 && echo leanprover/lean4:v4.33.1 > lean-toolchain && lake build && ls .lake/build/bin" ;;
export)
  need p1-build lean4export-build || continue
  step export 7200 "$C" bash -c "lake env $R/lean4export/.lake/build/bin/lean4export Plumb.P1 -- Plumb.p1 > $WORK/p1.export"
  sha256sum "$WORK/p1.export" > "$OUT/export.sha256"; stat -c '%s bytes' "$WORK/p1.export" >> "$OUT/export.sha256"; head -c 300 "$WORK/p1.export" > "$OUT/export.head" ;;
nanoda)
  need export || continue
  step nanoda-build 3600 "$R" bash -c "set -e; export RUSTUP_HOME=$R/rust/rustup CARGO_HOME=$R/rust/cargo
    curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal --no-modify-path
    rm -rf $R/nanoda_lib && git clone -q https://github.com/ammkrn/nanoda_lib.git $R/nanoda_lib && cd $R/nanoda_lib && git checkout -q 8de7e0c4ed3052745a7f8725164efd9e76d84c56
    \$CARGO_HOME/bin/cargo build --release --locked -q && cp target/release/nanoda_bin $R/nanoda_bin && sha256sum $R/nanoda_bin"
  printf '{"export_file_path": "%s", "use_stdin": false, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "unpermitted_axiom_hard_error": false, "nat_extension": true, "string_extension": true, "num_threads": 8, "print_success_message": true, "stack_size_bytes": 1073741824}\n' "$WORK/p1.export" > "$WORK/nanoda.json"
  step nanoda 7200 "$R" "$R/nanoda_bin" "$WORK/nanoda.json" ;;
probe)  # what the v4.33.1 toolchain bundles
  ls "$(BIN)" > "$OUT/toolchain-bin.txt" 2>&1; status "probe done" ;;
*) status "unknown stage $S" ;;
esac; done
status "done: $*"
