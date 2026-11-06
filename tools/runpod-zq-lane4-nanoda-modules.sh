#!/usr/bin/env bash
# runpod-zq-lane4-nanoda-modules.sh — Track A lane 4 on the claim "ℤ is Diophantine in ℚ" (Glazer et al., 2026-11-05),
# amendment D of notes/zq-preregistration-2026-11-06.md: nanoda v0.4.31 panicked ("memory overflow" in num-bigint's
# pow) on the full export of the recorded pass, so this script localizes it, module by module. Informational.
#
# THE THEOREM IS UNDECIDED HERE; this decides nothing about it.
#
# For each of the 48 modules: `leanexport <module> -- <its non-private, non-partial declaration names>` (nanoda's
# parser refuses partial definitions; the only ones are 9 compiler-generated ._unsafe_rec; the names from our audit,
# /root/zq-lane4/final/out/audit.jsonl), then nanoda v0.4.31 (built by tools/runpod-zq-lane4.sh stage nanoda-build)
# with the recorded pass's config. Writes nanoda-modules/<module>.{export.exit,export.sha256,exit,time,log,code} into
# /root/zq-lane4/final/out. Run over SSH: nohup bash /root/zq-lane4/ours/runpod-zq-lane4-nanoda-modules.sh &
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/root/zq-lane4; W=$R/final; OUT=$W/out; WORK=$W/work/nanoda-modules; D=$W/src/diophantine-z-q/lean
BIN=/root/.elan/toolchains/leanprover--lean4---v4.35.0/bin; NANODA2=$W/bin/nanoda_bin-0.4.31
JOBS="${JOBS:-4}"; THREADS="${THREADS:-4}"
export PATH=/root/.elan/bin:$PATH OUT WORK D BIN NANODA2 THREADS
rm -rf "$OUT/nanoda-modules" "$WORK"; mkdir -p "$OUT/nanoda-modules" "$WORK"
echo "$(date -u +%FT%TZ) start nanoda-modules" >> "$OUT/_status.txt"
(cd "$R/ours" && sha256sum runpod-zq-lane4-nanoda-modules.sh) > "$OUT/nanoda-modules.code"
python3 -I -c '
import json, os, sys
by = {}
for l in open(sys.argv[1], encoding="utf-8"):
    d = json.loads(l)
    if d.get("type") == "decl" and d["module"].startswith("ZInQ.") and not d["name"].startswith("_private") \
            and not {"partial", "unsafe"} & set(d["flags"]):
        by.setdefault(d["module"], []).append(d["name"])
for m in sorted(by):
    open(os.path.join(sys.argv[2], m + ".names"), "w", encoding="utf-8").write("\n".join(by[m]) + "\n")
    print(m)' "$OUT/audit.jsonl" "$WORK" > "$OUT/nanoda-modules/list.txt"
one() {
  m=$1; o=$OUT/nanoda-modules/$m; e=$WORK/$m.export
  (cd "$D" && xargs -d '\n' -a "$WORK/$m.names" lake env "$BIN/leanexport" "$m" -- > "$e" 2> "$o.export.log" < /dev/null); echo $? > "$o.export.exit"
  sha256sum "$e" | cut -d' ' -f1 > "$o.export.sha256"; wc -l < "$WORK/$m.names" > "$o.names"
  printf '{"export_file_path": "%s", "use_stdin": false, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "unpermitted_axiom_hard_error": false, "nat_extension": true, "string_extension": true, "num_threads": %s, "print_success_message": true, "stack_size_bytes": 1073741824}\n' "$e" "$THREADS" > "$WORK/$m.json"
  /usr/bin/time -v -o "$o.time" timeout 3600 "$NANODA2" "$WORK/$m.json" > "$o.log" 2>&1 < /dev/null; echo $? > "$o.exit"
  rm -f "$e"
}
export -f one
xargs -P "$JOBS" -I{} bash -c 'one {}' < "$OUT/nanoda-modules/list.txt"
echo "$(date -u +%FT%TZ) end nanoda-modules ($(wc -l < "$OUT/nanoda-modules/list.txt") modules)" >> "$OUT/_status.txt"
