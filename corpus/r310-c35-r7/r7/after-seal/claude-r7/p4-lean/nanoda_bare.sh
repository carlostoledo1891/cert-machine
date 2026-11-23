#!/bin/sh
# nanoda_bare.sh — what nanoda_bin prints on the export of the three roots when its configuration names nothing to print
# (no pp_declars, no pp_to_stdout): the remark in P4-LEAN-2.md. usage: sh nanoda_bare.sh WORKDIR   (WORKDIR must not exist)
set -u
here=$(cd "$(dirname "$0")" && pwd)
W=$1
mkdir "$W" || exit 2
B=/Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin
LP=$(cd /Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison && lake env printenv LEAN_PATH)
PATH="$B:$PATH"; export PATH
for m in R7Cnf R7CnfSound; do
  LEAN_PATH="$W:$LP" lean -DwarningAsError=true -R "$here" -o "$W/$m.olean" "$here/$m.lean" > "$W/$m.log" 2>&1 || exit 3
done
LEAN_PATH="$W:$LP" leanexport R7CnfSound -- R7Cnf.T1 R7Cnf.T1_input R7Cnf.T0 > "$W/good.ndjson"
echo "export: $(wc -c < "$W/good.ndjson" | tr -d ' ') bytes, sha256 $(shasum -a 256 "$W/good.ndjson" | cut -c1-64)"
printf '%s\n' '{"export_file_path": "'"$W"'/good.ndjson", "use_stdin": false, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "unpermitted_axiom_hard_error": true, "nat_extension": true, "string_extension": true, "num_threads": 2, "print_success_message": true}' > "$W/bare.json"
echo "configuration: $(sed "s|$W|WORKDIR|" "$W/bare.json")"
nanoda_bin "$W/bare.json" > "$W/bare.log" 2>&1; echo "nanoda_bin exit $?"
sed 's/^/    | /' "$W/bare.log"
