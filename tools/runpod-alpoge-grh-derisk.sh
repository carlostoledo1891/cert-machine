#!/usr/bin/env bash
# runpod-alpoge-grh-derisk.sh — the judges tried on a tiny project before phase 2 (2026-11-20 22:34 UTC, run as tester on
# the pod; output /results/derisk.txt): Comparator accepts a true theorem with nanoda and Lean's kernel, rejects a planted
# axiom; landrun strict mode fails on this host (Landlock ABI v4) while Comparator's --best-effort mode runs; lean4export
# format 3.1.0; nanoda accepts the export and rejects it with one literal changed (the C5 control, exit 101).
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/bin:/bin
T=$HOME/tools; D=$HOME/derisk; rm -rf $D; mkdir -p $D; cd $D
echo 'leanprover/lean4:v4.33.1' > lean-toolchain
cat > lakefile.toml <<'L'
name = "derisk"
[[lean_lib]]
name = "Ch"
[[lean_lib]]
name = "So"
[[lean_lib]]
name = "Bad"
L
echo 'theorem t : 2 + 2 = 4 := sorry' > Ch.lean
echo 'theorem t : 2 + 2 = 4 := by decide' > So.lean
printf 'axiom a : 2 + 2 = 4\ntheorem t : 2 + 2 = 4 := a\n' > Bad.lean
lake build Ch So Bad 2>&1 | tail -2
echo "== landrun test"; $T/landrun/landrun --rox /usr --rox /bin --rox /lib --rox /lib64 -- /bin/true; echo "landrun exit $?"
mk() { printf '{"challenge_module": "Ch", "solution_module": "%s", "theorem_names": ["t"], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": %s}\n' "$1" "$2" > cfg-$1-$2.json; }
mk So true; mk Bad false
for W in landrun passthrough; do
  if [ $W = landrun ]; then L=$T/landrun/landrun; else L=$T/landrun-pass; printf '#!/usr/bin/env bash\nwhile [ $# -gt 0 ] && [ "$1" != "--" ]; do shift; done; shift; exec "$@"\n' > $L; chmod 755 $L; fi
  for c in cfg-So-true.json cfg-Bad-false.json; do
    echo "== comparator $W $c"
    COMPARATOR_LANDRUN=$L COMPARATOR_LEAN4EXPORT=$T/lean4export/.lake/build/bin/lean4export COMPARATOR_NANODA=$T/nanoda_lib/target/release/nanoda_bin \
      timeout 600 lake env $T/comparator/.lake/build/bin/comparator $c 2>&1 | tail -4; echo "exit ${PIPESTATUS[0]}"
  done
done
echo "== export + nanoda (C5 dry run)"
lake env $T/lean4export/.lake/build/bin/lean4export So -- t > e.ndjson; echo "export exit $? bytes $(wc -c < e.ndjson)"; head -c 200 e.ndjson; echo
cat > n.json <<J
{"export_file_path": "$D/e.ndjson", "num_threads": 2, "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false, "nat_extension": true, "string_extension": true, "print_success_message": true}
J
$T/nanoda_lib/target/release/nanoda_bin n.json 2>&1 | tail -3; echo "nanoda exit ${PIPESTATUS[0]}"
