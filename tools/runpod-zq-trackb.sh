#!/usr/bin/env bash
# runpod-zq-trackb.sh — the Track B decision on the claim "ℤ is Diophantine in ℚ" (Elliot Glazer with AI agents,
# 2026-11-05): claimbox's conditional theorem at 125509a1 (lean/zinq) built and checked on a RunPod CPU pod, run over
# SSH (never as the pod's start command).
#
# THE THEOREM IS UNDECIDED HERE. This decides that Glazer's frozen statement follows in Lean from eight named
# hypotheses (and nine, and that G holds); it does not decide that any hypothesis is true or says what the manuscript's
# premise says.
#
# Pre-registered in notes/zq-trackb-preregistration-2026-11-06.md (B1-B7). Everything happens under
# /root/zq-trackb/$ZQ_RUN: the clone of the git bundle at the pinned commit, the re-hash, `lake exe cache get` from the
# committed manifest (no `lake update`), `lake build CondZQ Frozen`, each source re-elaborated with
# -Ddebug.skipKernelTC=false, our axiom audit (tools/zq-lean-audit.lean), claimbox's own Checks (informational), a COPY
# with our lean_lib CertMachineZQ (tools/zq-trackb-statement.lean) and our planted modules (tools/zq-trackb-plants.txt),
# our checks (tools/zq-trackb-check.lean), leanchecker / -paranoid / --fresh, a name-restricted export given to nanoda,
# con-ron and con-leche (bundled and master). Every step writes <step>.log, .exit, .time (GNU time -v), .start, .end and
# .code (the sha256 of our files) into $ZQ_RUN/out, the only directory the desk copies back. No verdict here:
# tools/record-zq-trackb.js decides on the desk.
#
# Glazer's repository has no licence: its files are built and read here and never leave the pod (only small text facts:
# exit codes, logs, timings, sha256s, our checks' JSON lines naming declarations).
#
# usage (on the pod, our files in /root/zq-trackb/ours, the bundle at /root/zq-trackb/zinq.bundle):
#   ZQ_RUN=final nohup bash /root/zq-trackb/ours/runpod-zq-trackb.sh STAGE... &
#   stages: setup fetch rehash cache build modules audit theirs copy statement check plants checkers fresh export
#           nanoda-build nanoda con-bundled con-ron-master con-leche-master plants-export
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/root/zq-trackb; OURS=$R/ours; BUNDLE=$R/zinq.bundle
W=$R/${ZQ_RUN:?set ZQ_RUN, e.g. final}; OUT=$W/out; WORK=$W/work
SRC=$W/src/claimbox; D=$SRC/lean/zinq; C=$W/copy
PIN=125509a1fbb307ed4b80faef216b701a9165ccf2
TREE=bf5111756795bbdb47935e2981f5d62414821a8a
TC=leanprover/lean4:v4.35.0
BIN=/root/.elan/toolchains/leanprover--lean4---v4.35.0/bin
NANODA_URL=https://github.com/ammkrn/nanoda_lib.git
NANODA_PIN=8de7e0c4ed3052745a7f8725164efd9e76d84c56
CONRON_PIN=97eead2d5b496f1017da5d11fe08bb1cb328eb7d
CONLECHE_PIN=dc8ca857d6de080cb29906c8ab10b10f837c369d
NANODA2=$W/bin/nanoda_bin-0.4.31
ALLOWED='["propext", "Quot.sound", "Classical.choice"]'
OURTHMS="CertMachineZQ.trackB_eight CertMachineZQ.trackB_nine CertMachineZQ.trackB_G CertMachineZQ.trackB_G_infinite"
BUILTINS="Quot Quot.mk Quot.lift Quot.ind propext Quot.sound Classical.choice Nat.add Nat.sub Nat.mul Nat.pow Nat.gcd Nat.div Nat.mod Nat.beq Nat.ble Nat.land Nat.lor Nat.xor Nat.shiftLeft Nat.shiftRight String.ofList Char.ofNat List eagerReduce Nat String String.mk Char optParam autoParam semiOutParam outParam"
PLANT_TARGETS="CondZQ.Planted.planted_conclusion_changed:9,CondZQ.Planted.planted_sorry:9,CondZQ.Planted.planted_axiom:9,CertMachineZQPlant.q1_extra_hypothesis:8,CertMachineZQPlant.q2_circular:8,CertMachineZQPlant.q3_unchecked:8"
JOBS="${JOBS:-8}"; NANODA_THREADS="${NANODA_THREADS:-8}"
export PATH=/root/.elan/bin:$PATH GIT_TERMINAL_PROMPT=0 RUSTUP_HOME=$W/rust/rustup CARGO_HOME=$W/rust/cargo
mkdir -p "$OUT" "$WORK" "$OUT/modules" "$W/bin"
status() { echo "$(date -u +%FT%TZ) $*" >> "$OUT/_status.txt"; }
code() { (cd "$OURS" && sha256sum runpod-zq-trackb.sh zq-lean-audit.lean zq-trackb-statement.lean zq-trackb-check.lean zq-trackb-plants.txt); }
# step NAME TIMEOUT DIR CMD... : the command's stdout+stderr in NAME.log, GNU time in NAME.time
step() {
  local s=$1 to=$2 dir=$3; shift 3
  status "start $s"; date +%s > "$OUT/$s.start"; code > "$OUT/$s.code"
  ( cd "$dir" && /usr/bin/time -v -o "$OUT/$s.time" timeout "$to" "$@" > "$OUT/$s.log" 2>&1 < /dev/null ); echo $? > "$OUT/$s.exit"
  date +%s > "$OUT/$s.end"; status "end $s exit $(cat "$OUT/$s.exit")"
}
ok() { test -f "$OUT/$1.exit" && test "$(cat "$OUT/$1.exit")" = 0; }
need() { for s in "$@"; do ok "$s" || { status "skip: $s did not exit 0"; return 1; }; done; }
nanoda_cfg() {  # nanoda_cfg EXPORT CONFIG [STACK_BYTES]: the bundled 0.4.19 gets no stack key, v0.4.31 gets 1 GiB
  local stack=""; if [ -n "${3:-}" ]; then stack=", \"stack_size_bytes\": $3"; fi
  printf '{"export_file_path": "%s", "use_stdin": false, "permitted_axioms": %s, "unpermitted_axiom_hard_error": false, "nat_extension": true, "string_extension": true, "num_threads": %s, "print_success_message": true%s}\n' "$1" "$ALLOWED" "$NANODA_THREADS" "$stack" > "$2"
}
nanoda_both() {  # nanoda_both NAME EXPORT : the bundled binary as NAME-bundled, v0.4.31 as NAME
  nanoda_cfg "$2" "$WORK/$1-bundled.json"; cp "$WORK/$1-bundled.json" "$OUT/$1-bundled.json"
  step "$1-bundled" 7200 "$WORK" "$BIN/nanoda_bin" "$WORK/$1-bundled.json"
  if [ -x "$NANODA2" ]; then
    nanoda_cfg "$2" "$WORK/$1.json" 1073741824; cp "$WORK/$1.json" "$OUT/$1.json"
    step "$1" 7200 "$WORK" "$NANODA2" "$WORK/$1.json"
  else status "skip $1: no $NANODA2"; fi
}
plant() {  # plant ID : the section of zq-trackb-plants.txt from its marker to the next
  awk -v p="-- ZQ-PLANT $1 " 'index($0, "-- ZQ-PLANT ") == 1 { on = (index($0, p) == 1); next } on' "$OURS/zq-trackb-plants.txt"
}
# our audit with its one `import ZInQ` line replaced by the given modules
audit_file() { local f=$1; shift; awk -v mods="$*" '$0 == "import ZInQ" { n = split(mods, m, " "); for (i = 1; i <= n; i++) print "import " m[i]; next } { print }' "$OURS/zq-lean-audit.lean" > "$f"; }
exportinfo() {  # exportinfo FILE : sha256, size, line count and kinds
  sha256sum "$1"; stat -c '%s bytes' "$1"
  python3 -I -c '
import json, sys, collections
c = collections.Counter(); n = 0
with open(sys.argv[1], "rb") as f:
    head = json.loads(f.readline())
    for line in f:
        n += 1
        c[line[2:line.index(b"\x22", 2)].decode()] += 1
print(json.dumps({"meta": head, "lines": n, "linesByFirstKey": c}, sort_keys=True))' "$1"
}

for STAGE in "$@"; do case "$STAGE" in

setup)
  # outside `step`: GNU time is installed here
  status "start setup"
  { export DEBIAN_FRONTEND=noninteractive; apt-get update -qq && apt-get install -y -qq git curl zstd python3 time build-essential pkg-config libssl-dev > /dev/null
    test -x /root/.elan/bin/elan || curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
    /root/.elan/bin/elan toolchain install $TC && ls "$BIN"; } > "$OUT/setup.log" 2>&1; echo $? > "$OUT/setup.exit"
  status "end setup exit $(cat "$OUT/setup.exit")"
  ;;

fetch)
  rm -rf "$W/src"; mkdir -p "$W/src"
  step fetch 1800 "$W/src" bash -c "set -e; sha256sum $BUNDLE; git clone -q --no-checkout $BUNDLE $SRC; git -C $SRC config core.autocrlf false
    git -C $SRC checkout -q $PIN; test \"\$(git -C $SRC rev-parse HEAD)\" = $PIN; test \"\$(git -C $SRC rev-parse HEAD:lean/zinq)\" = $TREE
    git -C $SRC log -1 --format='%H %cI %an <%ae>'; git -C $SRC rev-parse HEAD:lean/zinq; git -C $SRC status --porcelain | wc -l"
  ;;

rehash)
  need fetch || continue
  # the sha256 of every file under lean/zinq (not .lake), and the same for a copy with one byte appended to Main.lean (Q4)
  rm -rf "$WORK/q4"; mkdir -p "$WORK/q4"; (cd "$D" && tar --exclude=./.lake -cf - .) | (cd "$WORK/q4" && tar -xf -)
  printf 'x' >> "$WORK/q4/CondZQ/Main.lean"
  step rehash 600 "$D" python3 -I -c '
import hashlib, json, os, sys
def tree(root):
    out = {}
    for d, dirs, names in os.walk(root):
        dirs[:] = sorted(x for x in dirs if x != ".lake")
        for n in sorted(names):
            p = os.path.join(d, n)
            out[os.path.relpath(p, root)] = hashlib.sha256(open(p, "rb").read()).hexdigest()
    return out
a, b = tree("."), tree(sys.argv[1])
print(json.dumps({"files": a, "q4": {"flagged": sorted(k for k in set(a) | set(b) if a.get(k) != b.get(k))}}, indent=1, sort_keys=True))' "$WORK/q4"
  cp "$OUT/rehash.log" "$OUT/rehash.json"
  ;;

cache)
  need fetch || continue
  { echo "toolchain file: $(cat "$D/lean-toolchain")"; echo "lean: $(cd "$D" && lean --version)"; echo "lake: $(cd "$D" && lake --version)"
    echo "kernel: $(uname -srm)"; echo "nproc: $(nproc)"; echo "cgroup memory.max: $(cat /sys/fs/cgroup/memory.max 2>/dev/null)"
    (cd "$BIN" && ls && sha256sum lean lake leanchecker leanchecker-paranoid leanexport nanoda_bin con-ron con-leche 2>&1); } > "$OUT/env.txt" 2>&1
  cp "$D/lake-manifest.json" "$OUT/lake-manifest.json"; cp "$D/lakefile.toml" "$OUT/lakefile.toml"
  step cache 3600 "$D" bash -c 'for t in 1 2 3; do lake exe cache get && exit 0; echo "attempt $t failed"; sleep 30; done; exit 1'
  (cd "$D/.lake/packages" && for p in *; do echo "$p $(git -C "$p" rev-parse HEAD) $(git -C "$p" status --porcelain --untracked-files=no | wc -l)"; done) > "$OUT/deps.txt" 2>&1
  sha256sum "$D/.lake/packages/z_in_q/lean/Frozen/BoundedIntegerPolynomial.lean" > "$OUT/frozen.sha256" 2>&1
  ;;

build)
  need cache || continue
  step build 7200 "$D" lake build CondZQ Frozen
  (cd "$D/.lake/build/lib/lean" && find CondZQ CondZQ.olean -name '*.olean' | sort | xargs sha256sum) > "$OUT/build-oleans.sha256" 2>&1
  ;;

modules)
  need build || continue
  # the ten sources re-elaborated alone with the kernel flag written out
  (cd "$D" && { echo CondZQ.lean; ls CondZQ/*.lean | sort; }) > "$OUT/modules/list.txt"
  status "start modules"; date +%s > "$OUT/modules.start"; code > "$OUT/modules.code"
  (cd "$D" && xargs -P "$JOBS" -I{} bash -c 'f={}; m=${f//\//_}; /usr/bin/time -v -o '"$OUT"'/modules/$m.time timeout 3600 lake env lean -Ddebug.skipKernelTC=false "$f" > '"$OUT"'/modules/$m.log 2>&1 < /dev/null; echo $? > '"$OUT"'/modules/$m.exit' < "$OUT/modules/list.txt")
  date +%s > "$OUT/modules.end"
  n=$(wc -l < "$OUT/modules/list.txt"); bad=$(cat "$OUT"/modules/*.exit | grep -cvx 0); echo "$n modules, $bad non-zero" > "$OUT/modules.log"
  if [ "$n" = 10 ] && [ "$bad" = 0 ]; then echo 0 > "$OUT/modules.exit"; else echo 1 > "$OUT/modules.exit"; fi
  status "end modules exit $(cat "$OUT/modules.exit")"
  ;;

audit)
  need build || continue
  audit_file "$WORK/audit-condzq.lean" CondZQ
  step audit 7200 "$D" env ZQ_AUDIT_OUT="$OUT/audit.jsonl" ZQ_AUDIT_ROOT=CondZQ lake env lean "$WORK/audit-condzq.lean"
  ;;

theirs)
  need build || continue
  # informational: claimbox's own statement check and #print_axioms_all, and the conclusion span claimed byte-identical
  step theirs 3600 "$D" lake build Checks
  step span 600 "$D" python3 -I -c '
import hashlib, json, sys
out = {}
for p in ["CondZQ/Main.lean", "CondZQ/Discharged.lean", ".lake/packages/z_in_q/lean/Frozen/BoundedIntegerPolynomial.lean"]:
    b = open(p, "rb").read(); i = b.find(b"  \xe2\x88\x83 P : MvPolynomial"); j = b.find(b":= by", i) if i >= 0 else -1
    if j < 0: j = b.find(b":=", i) if i >= 0 else -1
    s = b[i:j] if i >= 0 and j >= 0 else b""
    out[p] = {"start": i, "bytes": len(s), "sha256": hashlib.sha256(s).hexdigest()}
print(json.dumps(out, indent=1, sort_keys=True))'
  ;;

copy)
  need build || continue
  # a COPY of claimbox's lean/zinq (its bytes; .lake/packages shared by symlink, the build copied), plus two lean_libs
  rm -rf "$C"; mkdir -p "$C/.lake" "$C/CertMachineZQPlant"
  (cd "$D" && tar --exclude=./.lake -cf - .) | (cd "$C" && tar -xf -)
  ln -s "$D/.lake/packages" "$C/.lake/packages"; cp -a "$D/.lake/build" "$C/.lake/build"
  cp "$OURS/zq-trackb-statement.lean" "$C/CertMachineZQ.lean"
  for Q in Q1 Q2 Q3; do plant $Q > "$C/CertMachineZQPlant/$Q.lean"; done
  printf '\n[[lean_lib]]\nname = "CertMachineZQ"\nroots = ["CertMachineZQ"]\n\n[[lean_lib]]\nname = "CertMachineZQPlant"\nglobs = ["CertMachineZQPlant.+"]\n' >> "$C/lakefile.toml"
  (cd "$C" && sha256sum CertMachineZQ.lean CertMachineZQPlant/*.lean lakefile.toml; diff "$D/lakefile.toml" lakefile.toml) > "$OUT/copy.txt" 2>&1
  status "copy made"
  ;;

statement)
  test -f "$C/CertMachineZQ.lean" || { status "skip statement: no copy"; continue; }
  step statement-build 3600 "$C" lake build CertMachineZQ
  need statement-build || continue
  audit_file "$WORK/audit-ours.lean" CertMachineZQ
  step statement-audit 3600 "$C" env ZQ_AUDIT_OUT="$OUT/statement-audit.jsonl" ZQ_AUDIT_ROOT=CertMachineZQ ZQ_AUDIT_TYPECONSTS=1 lake env lean "$WORK/audit-ours.lean"
  ;;

check)
  need statement-build || continue
  cp "$OURS/zq-trackb-check.lean" "$WORK/zq-trackb-check.lean"
  step check 3600 "$C" env ZQ_TRACKB_OUT="$OUT/check.jsonl" lake env lean "$WORK/zq-trackb-check.lean"
  ;;

plants)
  test -f "$C/CertMachineZQ.lean" || { status "skip plants: no copy"; continue; }
  step plants-build 3600 "$C" lake build Planted CertMachineZQPlant
  need plants-build || continue
  { echo "import Planted.Conclusion"; echo "import Planted.Sorry"; echo "import Planted.Axiom"
    for Q in Q1 Q2 Q3; do echo "import CertMachineZQPlant.$Q"; done; echo "import Lean"
    grep -v '^import ' "$OURS/zq-trackb-check.lean"; } > "$WORK/zq-trackb-check-plants.lean"
  sha256sum "$WORK/zq-trackb-check-plants.lean" > "$OUT/plants-check.sha256"
  step plants-check 3600 "$C" env ZQ_TRACKB_OUT="$OUT/plants-check.jsonl" ZQ_TRACKB_TARGETS="$PLANT_TARGETS" lake env lean "$WORK/zq-trackb-check-plants.lean"
  audit_file "$WORK/audit-planted.lean" Planted.Conclusion Planted.Sorry Planted.Axiom
  step plants-audit-claimbox 3600 "$C" env ZQ_AUDIT_OUT="$OUT/plants-audit-claimbox.jsonl" ZQ_AUDIT_ROOT=Planted lake env lean "$WORK/audit-planted.lean"
  audit_file "$WORK/audit-ourplants.lean" CertMachineZQPlant.Q1 CertMachineZQPlant.Q2 CertMachineZQPlant.Q3
  step plants-audit-ours 3600 "$C" env ZQ_AUDIT_OUT="$OUT/plants-audit-ours.jsonl" ZQ_AUDIT_ROOT=CertMachineZQPlant lake env lean "$WORK/audit-ourplants.lean"
  for M in Planted.Conclusion Planted.Sorry Planted.Axiom CertMachineZQPlant.Q1 CertMachineZQPlant.Q2 CertMachineZQPlant.Q3; do
    step "plants-leanchecker-$M" 3600 "$C" lake env "$BIN/leanchecker" --verbose "$M"
  done
  ;;

checkers)
  need build statement-build || continue
  step leanchecker-condzq 7200 "$D" lake env "$BIN/leanchecker" --verbose CondZQ
  step leanchecker-paranoid-condzq 7200 "$D" lake env "$BIN/leanchecker-paranoid" --verbose CondZQ
  step leanchecker-ours 7200 "$C" lake env "$BIN/leanchecker" --verbose CertMachineZQ
  step leanchecker-paranoid-ours 7200 "$C" lake env "$BIN/leanchecker-paranoid" --verbose CertMachineZQ
  ;;

fresh)
  need statement-build || continue
  step fresh 43200 "$C" lake env "$BIN/leanchecker" --fresh --verbose CertMachineZQ
  ;;

export)
  need statement-build || continue
  step export 7200 "$C" bash -c "lake env $BIN/leanexport CertMachineZQ -- $OURTHMS $BUILTINS > $WORK/trackb.export"
  if ! ok export; then
    # the built-in list names a constant this toolchain lacks: our theorems alone (their closure carries what they use)
    step export-plain 7200 "$C" bash -c "lake env $BIN/leanexport CertMachineZQ -- $OURTHMS > $WORK/trackb.export"
  fi
  exportinfo "$WORK/trackb.export" > "$OUT/export.txt" 2>&1
  ;;

nanoda-build)
  # nanoda_lib at its pin, unmodified (Track A lane 4's build); Rust stable from rustup, all under $W/rust
  step nanoda-build 3600 "$W" bash -c "set -e
    curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal --no-modify-path
    $CARGO_HOME/bin/rustc --version; $CARGO_HOME/bin/cargo --version
    rm -rf $W/tools-src/nanoda_lib; mkdir -p $W/tools-src
    git clone -q $NANODA_URL $W/tools-src/nanoda_lib; cd $W/tools-src/nanoda_lib; git checkout -q $NANODA_PIN
    test \"\$(git rev-parse HEAD)\" = $NANODA_PIN; test -z \"\$(git status --porcelain)\"; grep -m1 '^version' Cargo.toml
    $CARGO_HOME/bin/cargo build --release --locked -q
    cp target/release/nanoda_bin $NANODA2; sha256sum $NANODA2"
  ;;

nanoda)
  test -s "$WORK/trackb.export" || { status "skip nanoda: no export"; continue; }
  nanoda_both nanoda "$WORK/trackb.export"
  ;;

con-bundled)
  test -s "$WORK/trackb.export" || { status "skip con-bundled: no export"; continue; }
  if [ -x "$BIN/con-ron" ]; then step con-ron-bundled 7200 "$WORK" "$BIN/con-ron" --jobs=16 "$WORK/trackb.export"; else status "skip: no bundled con-ron"; fi
  if [ -x "$BIN/con-leche" ]; then step con-leche-bundled 7200 "$WORK" "$BIN/con-leche" --jobs=8 "$WORK/trackb.export"; else status "skip: no bundled con-leche"; fi
  ;;

con-ron-master)
  test -s "$WORK/trackb.export" || { status "skip con-ron-master: no export"; continue; }
  mkdir -p "$W/tools-src"
  step con-ron-master-build 3600 "$W/tools-src" bash -c "set -e
    test -x $CARGO_HOME/bin/cargo || curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal --no-modify-path
    rm -rf con-ron; git clone -q https://github.com/leanprover/con-ron.git; cd con-ron; git checkout -q $CONRON_PIN
    test \"\$(git rev-parse HEAD)\" = $CONRON_PIN; $CARGO_HOME/bin/cargo build --release -q; sha256sum target/release/con-ron"
  ok con-ron-master-build && step con-ron-master 7200 "$WORK" "$W/tools-src/con-ron/target/release/con-ron" --jobs=16 "$WORK/trackb.export"
  ;;

con-leche-master)
  # needs more than a 64 GB pod at --jobs=8 on this export (amendment B); run it on a larger one
  test -s "$WORK/trackb.export" || { status "skip con-leche-master: no export"; continue; }
  mkdir -p "$W/tools-src"
  step con-leche-master-build 3600 "$W/tools-src" bash -c "set -e
    rm -rf con-leche; git clone -q https://github.com/leanprover/con-leche.git; cd con-leche; git checkout -q $CONLECHE_PIN
    test \"\$(git rev-parse HEAD)\" = $CONLECHE_PIN; cat lean-toolchain; elan toolchain install \"\$(cat lean-toolchain)\"
    lake build 2>&1 | tail -3; ls .lake/build/bin/; sha256sum .lake/build/bin/*"
  CL=$(ls "$W"/tools-src/con-leche/.lake/build/bin/* 2>/dev/null | head -1)
  if ok con-leche-master-build && [ -n "$CL" ]; then step con-leche-master 7200 "$WORK" "$CL" --jobs=8 "$WORK/trackb.export"; fi
  ;;

plants-export)
  need plants-build || continue
  for P in "Planted.Sorry CondZQ.Planted.planted_sorry C2" "Planted.Axiom CondZQ.Planted.planted_axiom C3" "CertMachineZQPlant.Q3 CertMachineZQPlant.q3_unchecked Q3"; do
    set -- $P
    step "plants-export-$3" 3600 "$C" bash -c "lake env $BIN/leanexport $1 -- $2 > $WORK/plant-$3.export"
    exportinfo "$WORK/plant-$3.export" > "$OUT/plants-export-$3.txt" 2>&1
    nanoda_both "plants-nanoda-$3" "$WORK/plant-$3.export"
  done
  ;;

*) status "unknown stage $STAGE" ;;
esac; done
status "driver done: $*"
