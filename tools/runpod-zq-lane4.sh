#!/usr/bin/env bash
# runpod-zq-lane4.sh — Track A lane 4 on the claim "ℤ is Diophantine in ℚ" (Elliot Glazer with AI agents,
# 2026-11-05): the kernel replay of the 48 accepted Lean modules of github.com/elliotglazer/diophantine-z-q at
# 97cec7fd (lean/, integration 31), on a RunPod CPU pod, run over SSH (never as the pod's start command).
#
# THE THEOREM IS UNDECIDED HERE. The main Lean target (lean/Frozen/BoundedIntegerPolynomial.lean) is `sorry`; this
# lane checks the helper library and the target's statement, and decides nothing about the theorem.
#
# Pre-registered in notes/zq-preregistration-2026-11-06.md (lane 4, amendments A and B). Everything happens under
# /root/zq-lane4 (another agent works elsewhere on the same pod): the clone at the pin (sparse, lean/ only), the
# sha256 of every file under lean/ (the desk compares them with SOURCE_MANIFEST.json), `lake exe cache get`,
# `lake build ZInQ`, each of the 48 sources re-elaborated with -Ddebug.skipKernelTC=false, our axiom audit
# (tools/zq-lean-audit.lean), the frozen target alone and in a copy with one added lean_lib, leanchecker,
# leanchecker-paranoid, leanchecker --fresh, a full-environment leanexport replayed by nanoda, lean4lean (one try),
# and the planted variants P1-P4 (tools/zq-lean-plants.txt) in a copy. Every step writes <step>.log, .exit, .time
# (GNU time -v: wall, peak RSS), .start, .end and .code (the sha256 of our files) into /root/zq-lane4/out, the only
# directory the desk copies back. No verdict here: tools/record-zq-lean-replay.js decides on the desk.
#
# The claimant's repository has no licence: its files are built and read here and never leave the pod.
#
# usage (on the pod, our files in /root/zq-lane4/ours): nohup bash /root/zq-lane4/ours/runpod-zq-lane4.sh STAGE... &
#   stages: clone rehash cache build modules audit frozen checkers export nanoda fresh lean4lean planted
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
W=/root/zq-lane4; OUT=$W/out; OURS=$W/ours; WORK=$W/work
CLONE=$W/src/diophantine-z-q; D=$CLONE/lean
PIN=97cec7fdd757d9a8e4f468151a47a6d3610fb2f2
URL=https://github.com/elliotglazer/diophantine-z-q.git
TC=leanprover/lean4:v4.35.0
BIN=/root/.elan/toolchains/leanprover--lean4---v4.35.0/bin
ALLOWED='["propext", "Quot.sound", "Classical.choice"]'
JOBS="${JOBS:-6}"; NANODA_THREADS="${NANODA_THREADS:-8}"
export PATH=/root/.elan/bin:$PATH GIT_TERMINAL_PROMPT=0
mkdir -p "$OUT" "$WORK" "$OUT/modules"
status() { echo "$(date -u +%FT%TZ) $*" >> "$OUT/_status.txt"; }
code() { (cd "$OURS" && sha256sum runpod-zq-lane4.sh zq-lean-audit.lean zq-lean-hyperop.lean zq-lean-plants.txt); }
# step NAME TIMEOUT DIR CMD... : the command's stdout+stderr in NAME.log, GNU time in NAME.time
step() {
  local s=$1 to=$2 dir=$3; shift 3
  status "start $s"; date +%s > "$OUT/$s.start"; code > "$OUT/$s.code"
  ( cd "$dir" && /usr/bin/time -v -o "$OUT/$s.time" timeout "$to" "$@" > "$OUT/$s.log" 2>&1 < /dev/null ); echo $? > "$OUT/$s.exit"
  date +%s > "$OUT/$s.end"; status "end $s exit $(cat "$OUT/$s.exit")"
}
ok() { test -f "$OUT/$1.exit" && test "$(cat "$OUT/$1.exit")" = 0; }
need() { for s in "$@"; do ok "$s" || { status "skip: $s did not exit 0"; return 1; }; done; }
nanoda_cfg() {  # nanoda_cfg EXPORT CONFIG
  printf '{"export_file_path": "%s", "use_stdin": false, "permitted_axioms": %s, "unpermitted_axiom_hard_error": false, "nat_extension": true, "string_extension": true, "num_threads": %s, "print_success_message": true}\n' "$1" "$ALLOWED" "$NANODA_THREADS" > "$2"
}
# a COPY of the claimant's lean/ folder (their bytes; .lake/packages shared by symlink, the project build copied)
mkcopy() {  # mkcopy DIR [build]
  rm -rf "$1"; mkdir -p "$1/.lake"
  (cd "$D" && tar --exclude=./.lake -cf - .) | (cd "$1" && tar -xf -)
  ln -s "$D/.lake/packages" "$1/.lake/packages"
  if [ "${2:-}" = build ]; then cp -a "$D/.lake/build" "$1/.lake/build"; fi
}

for STAGE in "$@"; do case "$STAGE" in

clone)
  rm -rf "$W/src"; mkdir -p "$W/src"
  step clone 1800 "$W/src" bash -c "git clone -q --filter=blob:none --no-checkout $URL $CLONE && git -C $CLONE config core.autocrlf false && git -C $CLONE sparse-checkout set lean && git -C $CLONE checkout -q $PIN && test \"\$(git -C $CLONE rev-parse HEAD)\" = $PIN && git -C $CLONE log -1 --format='%H %cI %an <%ae>' && git -C $CLONE status --porcelain | wc -l"
  ;;

rehash)
  need clone || continue
  # the sha256 of every file under lean/ (not .lake) and the root imports; the desk decides
  step rehash 600 "$CLONE" python3 -I -c '
import hashlib, json, os, re
out = {"files": {}, "rootImports": []}
for d, dirs, names in os.walk("lean"):
    dirs[:] = sorted(x for x in dirs if x != ".lake")
    for n in sorted(names):
        p = os.path.join(d, n)
        out["files"][p] = hashlib.sha256(open(p, "rb").read()).hexdigest()
for line in open("lean/ZInQ.lean", encoding="utf-8"):
    m = re.match(r"\s*(?:public\s+)?import\s+(\S+)", line)
    if m: out["rootImports"].append(m.group(1))
print(json.dumps(out, indent=1, sort_keys=True))'
  cp "$OUT/rehash.log" "$OUT/rehash.json"
  ;;

cache)
  need clone || continue
  { echo "toolchain file: $(cat "$D/lean-toolchain")"; echo "lean: $(cd "$D" && lean --version)"; echo "lake: $(cd "$D" && lake --version)"
    echo "kernel: $(uname -srm)"; echo "nproc: $(nproc)"; echo "cgroup memory.max: $(cat /sys/fs/cgroup/memory.max 2>/dev/null)"
    (cd "$BIN" && sha256sum lean lake leanchecker leanchecker-paranoid leanexport nanoda_bin lean4lean); "$BIN/nanoda_bin" --help 2>&1 | head -1; } > "$OUT/env.txt" 2>&1
  step cache 3600 "$D" bash -c 'for t in 1 2 3; do lake exe cache get && exit 0; echo "attempt $t failed"; sleep 30; done; exit 1'
  # every dependency checkout: its revision and whether its tracked sources are clean
  (cd "$D/.lake/packages" && for p in *; do echo "$p $(git -C "$p" rev-parse HEAD) $(git -C "$p" status --porcelain --untracked-files=no | wc -l)"; done) > "$OUT/deps.txt" 2>&1
  ;;

build)
  need cache || continue
  step build 7200 "$D" lake build ZInQ
  (cd "$D/.lake/build/lib/lean" && find ZInQ ZInQ.olean -name '*.olean' | sort | xargs sha256sum) > "$OUT/build-oleans.sha256" 2>&1
  ;;

modules)
  need build || continue
  # the pre-registered flag, literally: each of the 48 sources re-elaborated with -Ddebug.skipKernelTC=false
  (cd "$D" && python3 -I -c 'import json; [print(f["path"]) for f in json.load(open("SOURCE_MANIFEST.json"))["files"]]') > "$OUT/modules/list.txt"
  status "start modules"; date +%s > "$OUT/modules.start"; code > "$OUT/modules.code"
  (cd "$D" && xargs -P "$JOBS" -I{} bash -c 'f={}; m=${f//\//_}; /usr/bin/time -v -o '"$OUT"'/modules/$m.time timeout 3600 lake env lean -Ddebug.skipKernelTC=false "$f" > '"$OUT"'/modules/$m.log 2>&1 < /dev/null; echo $? > '"$OUT"'/modules/$m.exit' < "$OUT/modules/list.txt")
  date +%s > "$OUT/modules.end"
  n=$(wc -l < "$OUT/modules/list.txt"); bad=$(cat "$OUT"/modules/*.exit | grep -cvx 0); echo "$n modules, $bad non-zero" > "$OUT/modules.log"
  if [ "$n" = 48 ] && [ "$bad" = 0 ]; then echo 0 > "$OUT/modules.exit"; else echo 1 > "$OUT/modules.exit"; fi
  status "end modules exit $(cat "$OUT/modules.exit")"
  ;;

audit)
  need build || continue
  cp "$OURS/zq-lean-audit.lean" "$WORK/zq-lean-audit.lean"
  step audit 7200 "$D" env ZQ_AUDIT_OUT="$OUT/audit.jsonl" lake env lean "$WORK/zq-lean-audit.lean"
  ;;

frozen)
  need cache || continue
  # F1: their frozen file alone, in the pristine clone
  sha256sum "$D/Frozen/BoundedIntegerPolynomial.lean" > "$OUT/frozen.sha256"
  step frozen-alone 3600 "$D" lake env lean Frozen/BoundedIntegerPolynomial.lean
  # F2: a copy whose lakefile gains one lean_lib (their file byte-identical), built, then audited with our hyperop body
  C=$W/copy-frozen; mkcopy "$C"
  printf '\n[[lean_lib]]\nname = "Frozen"\nroots = ["Frozen.BoundedIntegerPolynomial"]\n' >> "$C/lakefile.toml"
  (cd "$C" && sha256sum Frozen/BoundedIntegerPolynomial.lean lakefile.toml; diff "$D/lakefile.toml" lakefile.toml) > "$OUT/frozen-copy.txt" 2>&1
  step frozen-build 3600 "$C" lake build Frozen
  { echo "import Frozen.BoundedIntegerPolynomial"; echo "import Mathlib.Data.Nat.Hyperoperation"; echo "import Lean"
    grep -v '^import ' "$OURS/zq-lean-hyperop.lean"; grep -v '^import ' "$OURS/zq-lean-audit.lean"; } > "$WORK/zq-frozen-check.lean"
  sha256sum "$WORK/zq-frozen-check.lean" >> "$OUT/frozen-copy.txt"
  need frozen-build && step frozen-audit 3600 "$C" env ZQ_AUDIT_OUT="$OUT/frozen-audit.jsonl" ZQ_AUDIT_ROOT=Frozen ZQ_AUDIT_TYPECONSTS=1 lake env lean "$WORK/zq-frozen-check.lean"
  ;;

checkers)
  need build || continue
  step leanchecker 7200 "$D" lake env "$BIN/leanchecker" --verbose ZInQ
  step leanchecker-paranoid 7200 "$D" lake env "$BIN/leanchecker-paranoid" --verbose ZInQ
  ;;

fresh)
  need build || continue
  step fresh 43200 "$D" lake env "$BIN/leanchecker" --fresh --verbose ZInQ
  ;;

export)
  need build || continue
  step export 7200 "$D" bash -c "lake env $BIN/leanexport ZInQ > $WORK/zinq.export"
  { sha256sum "$WORK/zinq.export"; stat -c '%s bytes' "$WORK/zinq.export"
    python3 -I -c '
import json, sys, collections
c = collections.Counter(); n = 0
with open(sys.argv[1], "rb") as f:
    head = json.loads(f.readline())
    for line in f:
        n += 1
        c[line[2:line.index(b"\x22", 2)].decode()] += 1
print(json.dumps({"meta": head, "lines": n, "linesByFirstKey": c}, sort_keys=True))' "$WORK/zinq.export"; } > "$OUT/export.txt" 2>&1
  ;;

nanoda)
  need export || continue
  nanoda_cfg "$WORK/zinq.export" "$WORK/nanoda.json"; cp "$WORK/nanoda.json" "$OUT/nanoda.json"
  step nanoda 21600 "$WORK" "$BIN/nanoda_bin" "$WORK/nanoda.json"
  ;;

lean4lean)
  need build || continue
  step lean4lean 900 "$D" lake env "$BIN/lean4lean" ZInQ
  ;;

planted)
  need build || continue
  C=$W/copy-planted; mkcopy "$C" build
  # the leaf: the last module of the root's import list that no other ZInQ module imports
  python3 -I -c '
import os, re, sys
os.chdir(sys.argv[1])
imp = lambda p: [m.group(1) for l in open(p, encoding="utf-8") for m in [re.match(r"\s*(?:public\s+)?(?:meta\s+)?import\s+(\S+)", l)] if m]
root = [m for m in imp("ZInQ.lean") if m.startswith("ZInQ.")]
used = {m for f in os.listdir("ZInQ") if f.endswith(".lean") for m in imp(os.path.join("ZInQ", f))}
print([m for m in root if m not in used][-1])' "$C" > "$OUT/planted-leaf.txt"
  LEAF=$(cat "$OUT/planted-leaf.txt"); LF="$C/${LEAF//.//}.lean"; ORIG="$D/${LEAF//.//}.lean"
  sha256sum "$ORIG" > "$OUT/planted-leaf.sha256"
  for P in P1 P2 P3 P4; do
    cp "$ORIG" "$LF"; cmp -s "$ORIG" "$LF" || { status "planted: could not restore $LEAF"; break; }
    # restore the root too (P4's fallback may have changed it)
    cp "$D/ZInQ.lean" "$C/ZInQ.lean"; rm -f "$C/ZInQ/ZqPlantedP4.lean"
    awk -v p="-- ZQ-PLANT $P " 'index($0, "-- ZQ-PLANT ") == 1 { on = (index($0, p) == 1); next } on' "$OURS/zq-lean-plants.txt" > "$WORK/plant-$P.lean"
    { printf '\n'; cat "$WORK/plant-$P.lean"; } >> "$LF"
    case $P in P1) T=zq_planted_sorry ;; P2) T=zq_planted_uses_axiom ;; P3) T=zq_planted_native ;; P4) T=zq_planted_unchecked ;; esac
    MOD=$LEAF
    step "planted-$P-build" 3600 "$C" lake build ZInQ
    if [ "$P" = P4 ] && ! ok "planted-$P-build"; then
      # the fallback pre-registered in amendment A item 8: a new module of the copy, imported by the root
      cp "$ORIG" "$LF"; MOD=ZInQ.ZqPlantedP4
      { printf 'module\npublic import Lean\n'; cat "$WORK/plant-$P.lean"; } > "$C/ZInQ/ZqPlantedP4.lean"
      printf 'public import ZInQ.ZqPlantedP4\n' >> "$C/ZInQ.lean"
      echo "P4 moved to $MOD" > "$OUT/planted-P4.fallback"
      for e in log exit time start end code; do mv "$OUT/planted-P4-build.$e" "$OUT/planted-P4-build-first.$e"; done
      step "planted-$P-build" 3600 "$C" lake build ZInQ
    fi
    (cd "$C" && sha256sum "${MOD//.//}.lean") > "$OUT/planted-$P.sha256"
    if ok "planted-$P-build"; then
      step "planted-$P-audit" 7200 "$C" env ZQ_AUDIT_OUT="$OUT/planted-$P-audit.jsonl" lake env lean "$WORK/zq-lean-audit.lean"
      step "planted-$P-leanchecker" 3600 "$C" lake env "$BIN/leanchecker" --verbose "$MOD"
      step "planted-$P-export" 3600 "$C" bash -c "lake env $BIN/leanexport $MOD -- $T > $WORK/planted-$P.export"
      nanoda_cfg "$WORK/planted-$P.export" "$WORK/planted-$P-nanoda.json"
      step "planted-$P-nanoda" 3600 "$WORK" "$BIN/nanoda_bin" "$WORK/planted-$P-nanoda.json"
    fi
  done
  cp "$ORIG" "$LF"; cp "$D/ZInQ.lean" "$C/ZInQ.lean"; rm -f "$C/ZInQ/ZqPlantedP4.lean"
  ;;

*) status "unknown stage $STAGE" ;;
esac; done
status "driver done: $*"
