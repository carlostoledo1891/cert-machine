#!/bin/sh
# build-strict.sh — the three modules compiled with every warning an error, into WORKDIR, and the two proof modules' .olean
# files compared with the copies kept in build-strict/.
# usage: sh build-strict.sh WORKDIR        WORKDIR must not exist. Nothing is written in this folder.
set -u
here=$(cd "$(dirname "$0")" && pwd)
W=$1
mkdir "$W" || exit 2
B=/Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin
proj=/Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison
LP=$(cd "$proj" && lake env printenv LEAN_PATH)
"$B/lean" --version
for m in R7Cnf R7CnfSound R7CnfMain; do
  LEAN_PATH="$W:$LP" "$B/lean" -DwarningAsError=true -R "$here" -o "$W/$m.olean" "$here/$m.lean" > "$W/$m.log" 2>&1
  echo "$m: exit $?, $(wc -l < "$W/$m.log" | tr -d ' ') output line(s); source sha256 $(shasum -a 256 "$here/$m.lean" | cut -c1-64); olean sha256 $(shasum -a 256 "$W/$m.olean" | cut -c1-64)"
  sed 's/^/    | /' "$W/$m.log"
done
for m in R7Cnf R7CnfSound; do
  if cmp -s "$W/$m.olean" "$here/build-strict/$m.olean"; then echo "$m.olean: equal to build-strict/$m.olean"; else echo "$m.olean: DIFFERENT from build-strict/$m.olean"; fi
done
