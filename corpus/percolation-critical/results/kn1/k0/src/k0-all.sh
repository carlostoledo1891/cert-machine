#!/bin/bash
# k0-all.sh — run ON THE POD: K0 of PREREG-KN1.md, everything from the sealed bytes.
#   SRC     /root/kn1/k0src   this folder (the K0 sources: KN1/K0/*.lean, split.py, lakefile-additions.toml, this script)
#   SEALED  /root/sealed      Printed.lean Printed1.lean Planted1.lean (sealed bytes)
#   SEALED3 /root/sealed-kn3  Check.lean Planted.lean PlantedCheck.lean (the sibling's sealed fragments)
#   WORK    /root/kn1/percolation   the working copy of the lab's built tree (only lakefile.toml gets entries appended)
#   OUT     /root/kn1/k0      logs, exit codes, the per-definition table, the axioms output
# Usage: k0-all.sh [setup|libs|split|proofs|axioms|grep|all]   (default all)
set -uo pipefail
export PATH=$HOME/.elan/bin:$PATH
SRC="${SRC:-/root/kn1/k0src}"; SEALED="${SEALED:-/root/sealed}"; SEALED3="${SEALED3:-/root/sealed-kn3}"
WORK="${WORK:-/root/kn1/percolation}"; OUT="${OUT:-/root/kn1/k0}"; SPLIT="$OUT/split"
STAGE="${1:-all}"
mkdir -p "$OUT/logs" "$SPLIT"
want() { [ "$STAGE" = all ] || [ "$STAGE" = "$1" ]; }
build() { # build LABEL TARGET... : lake build with log, exit code, seconds
  local label=$1; shift; local t0=$(date +%s)
  ( cd "$WORK" && lake build "$@" ) > "$OUT/logs/$label.log" 2>&1; local rc=$?
  echo $rc > "$OUT/logs/$label.exit"; echo $(( $(date +%s) - t0 )) > "$OUT/logs/$label.seconds"
  echo "build $label ($*): exit $rc, $(cat "$OUT/logs/$label.seconds") s"
}

if want setup; then
  # 1. the sealed bytes are the sealed bytes
  cat > "$OUT/sealed.expected" <<EOF
161411bd3a703971c05bbbe10554841612bbb97f0f23eaae9988468b1a98def8  $SEALED/Printed.lean
f168a013573ae665753ee73ce2adf5192a03bb5bd14b8d4c00b5e75f7df6aacb  $SEALED/Printed1.lean
2ea564dab87cd7dbdac03370a42aad48e49370cc1657951261cf776e9e6a55b1  $SEALED/Planted1.lean
5e337e967eb3ebd9df22b2e1ea79ae79dd6cc918e62672581cdbe341bbcd1740  $SEALED3/Check.lean
70b4f0bd68319005ce4250fc4a42fec93e885f393e6da2b250ab16c6b0357848  $SEALED3/Planted.lean
849cf56114867c4ceec23a0781a66272eb4e52aa8dbbf2aecb7189a11ea63664  $SEALED3/PlantedCheck.lean
EOF
  sha256sum -c "$OUT/sealed.expected" > "$OUT/sealed.check" 2>&1 || { echo "SEALED BYTES DIFFER"; cat "$OUT/sealed.check"; exit 2; }
  cat "$OUT/sealed.check"
  # 2. assemble: sealed bytes unchanged at the tree's root; the sibling's fragments pasted after two import lines
  cp "$SEALED/Printed.lean" "$SEALED/Printed1.lean" "$SEALED/Planted1.lean" "$WORK/"
  mkdir -p "$WORK/KN1/K0"; find "$WORK/KN1/K0" -maxdepth 1 -type f -name "*.lean" -delete   # no stale module
  { printf 'import Mathlib\nimport Printed\n\n'; cat "$SEALED3/Check.lean" "$SEALED3/Planted.lean" "$SEALED3/PlantedCheck.lean"; } > "$WORK/KN1/K0/Frag.lean"
  for f in "$SRC"/KN1/K0/*.lean; do cp "$f" "$WORK/KN1/K0/"; done
  find "$WORK/KN1" "$WORK"/Printed*.lean "$WORK"/Planted1.lean -name '._*' -print -delete
  grep -q 'name = "KN1Printed"' "$WORK/lakefile.toml" || cat "$SRC/lakefile-additions.toml" >> "$WORK/lakefile.toml"
  # 3. the paste is byte-exact: Frag.lean minus its 31-byte header is Check ++ Planted ++ PlantedCheck, and the
  #    sealed Planted.lean sits in it at the offset after Check.lean
  { cmp <(tail -c +32 "$WORK/KN1/K0/Frag.lean") <(cat "$SEALED3/Check.lean" "$SEALED3/Planted.lean" "$SEALED3/PlantedCheck.lean") \
    && n1=$(stat -c %s "$SEALED3/Check.lean") && n2=$(stat -c %s "$SEALED3/Planted.lean") \
    && cmp <(tail -c +$((32 + n1)) "$WORK/KN1/K0/Frag.lean" | head -c "$n2") "$SEALED3/Planted.lean" \
    && cmp "$WORK/Printed.lean" "$SEALED/Printed.lean" && cmp "$WORK/Printed1.lean" "$SEALED/Printed1.lean" \
    && cmp "$WORK/Planted1.lean" "$SEALED/Planted1.lean" \
    && echo "PASTE BYTE-EXACT: Frag.lean = 31-byte header ++ Check ++ Planted ++ PlantedCheck; Planted.lean (sha256 $(sha256sum < "$SEALED3/Planted.lean" | cut -c1-64)) at offset $((31 + n1)), $n2 bytes; the three statement files in the tree are the sealed bytes"; } \
    > "$OUT/paste.check" 2>&1 || { echo "PASTE NOT BYTE-EXACT"; cat "$OUT/paste.check"; exit 3; }
  cat "$OUT/paste.check"
  ( cd "$WORK" && sha256sum Printed.lean Printed1.lean Planted1.lean KN1/K0/*.lean lakefile.toml ) > "$OUT/tree.sha256"
fi

if want libs; then
  # step 1, whole files: the sealed bytes as modules
  build lib-KN3Printed KN3Printed
  build lib-KN1Printed KN1Printed
  build lib-KN1Planted KN1Planted
fi

if want split; then
  # step 1, one verdict per definition: each definition alone in a module, the sealed bytes of it unchanged
  mkdir -p "$SPLIT"; find "$SPLIT" -maxdepth 1 -type f -delete   # no stale verdict
  python3 "$SRC/split.py" "$SEALED/Printed1.lean" "$SPLIT" Printed1 | tee "$OUT/split.out"
  python3 "$SRC/split.py" "$SEALED/Planted1.lean" "$SPLIT" Planted1 | tee -a "$OUT/split.out"
  ( cd "$WORK" && ls "$SPLIT"/*.lean | xargs -P 16 -I{} bash -c 'f={}; lake env lean "$f" > "${f%.lean}.log" 2>&1; echo $? > "${f%.lean}.exit"' )
  { printf 'file\t#\tdefinition\tsealed lines\tverdict (alone)\texit\tlog bytes\n'
    for P in Printed1 Planted1; do
      while IFS=$'\t' read -r k name l0 l1 sha fn; do
        rc=$(cat "$SPLIT/${fn%.lean}.exit"); nb=$(stat -c %s "$SPLIT/${fn%.lean}.log")
        if [ "$rc" = 0 ] && ! grep -q 'error' "$SPLIT/${fn%.lean}.log"; then v=ELABORATES; else v=FAILS; fi
        printf '%s.lean\t%s\t%s\t%s-%s\t%s\t%s\t%s\n' "$P" "$k" "$name" "$l0" "$l1" "$v" "$rc" "$nb"
      done < "$SPLIT/$P.manifest"
    done; } > "$OUT/definitions.tsv"
  cat "$OUT/definitions.tsv"
  echo "ELABORATES: $(grep -c ELABORATES "$OUT/definitions.tsv")   FAILS: $(grep -c FAILS "$OUT/definitions.tsv")"
fi

if want proofs; then
  for m in Frag Basic Required PlantedFalse Planted12 Readings Weakenings PlantedFalse10 PlantedFalse11; do
    [ -f "$WORK/KN1/K0/$m.lean" ] && build "k0-$m" "KN1.K0.$m"
  done
fi

if want axioms; then
  build k0-Axioms KN1.K0.Axioms
  grep -vE '^(⚠|✔|ℹ|✖|Build completed|trace:)' "$OUT/logs/k0-Axioms.log" > "$OUT/axioms.txt" || true
  python3 - "$OUT/logs/k0-Axioms.log" "$WORK/KN1/K0/Axioms.lean" > "$OUT/axioms-verdict.txt" <<'PY'
import re, sys
t = open(sys.argv[1], encoding="utf-8").read()
want = re.findall(r"^#print axioms (\S+)", open(sys.argv[2], encoding="utf-8").read(), re.M)
ok = {"propext", "Classical.choice", "Quot.sound"}
seen = {}
for m in re.finditer(r"KN1/K0/Axioms\.lean:\d+:\d+:\s+'([^']+)'\s+(depends\s+on\s+axioms:\s+\[([^\]]*)\]|does\s+not\s+depend\s+on\s+any\s+axioms)", t):
    seen[m.group(1)] = set(x.strip() for x in (m.group(3) or "").replace("\n", " ").split(",") if x.strip())
bad = {k: sorted(v - ok) for k, v in seen.items() if not v <= ok}
missing = [w for w in want if w not in seen]
for k, v in bad.items(): print("OUTSIDE", k, v)
for w in missing: print("NOT PRINTED", w)
print("Axioms.lean: %d #print commands, %d printed, %d outside [propext, Classical.choice, Quot.sound], %d using no axiom at all"
      % (len(want), len(seen), len(bad), sum(1 for v in seen.values() if not v)))
PY
  # every theorem of our proof files is printed
  ( cd "$WORK" && for f in KN1/K0/*.lean; do case "$f" in KN1/K0/Frag.lean|KN1/K0/Axioms.lean) continue;; esac; grep -hoE "^theorem [A-Za-z0-9_]+" "$f"; done ) | sed "s/^theorem /KN1K0./" | sort > "$OUT/theorems-ours.txt"
  grep -oE "^#print axioms [A-Za-z0-9_.]+" "$WORK/KN1/K0/Axioms.lean" | sed "s/^#print axioms //" | sort > "$OUT/theorems-printed.txt"
  if cmp -s "$OUT/theorems-ours.txt" "$OUT/theorems-printed.txt"; then echo "every theorem of our proof files is printed: $(wc -l < "$OUT/theorems-ours.txt") of $(wc -l < "$OUT/theorems-ours.txt")"; else echo "THEOREMS NOT PRINTED / EXTRA:"; diff "$OUT/theorems-ours.txt" "$OUT/theorems-printed.txt"; fi >> "$OUT/axioms-verdict.txt"
  cat "$OUT/axioms-verdict.txt"
fi

if want grep; then
  ( cd "$WORK" && for f in KN1/K0/*.lean; do
      case "$f" in KN1/K0/Frag.lean|KN1/K0/Axioms.lean) continue;; esac
      grep -nHE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit" "$f"
    done ) > "$OUT/grep-proof-files.txt" 2>&1
  echo "grep over our proof files (Basic, Required, PlantedFalse, Planted12, …): $(wc -l < "$OUT/grep-proof-files.txt") matching lines"
  ( cd "$WORK" && grep -nHE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit" KN1/K0/Frag.lean KN1/K0/Axioms.lean Printed.lean Printed1.lean Planted1.lean ) > "$OUT/grep-other-files.txt" 2>&1
  echo "grep over the other files (Frag, Axioms, the three statement files): $(wc -l < "$OUT/grep-other-files.txt") matching lines (listed in grep-other-files.txt)"
fi
echo "k0-all.sh $STAGE: done $(date -u +%H:%M:%SZ)"
