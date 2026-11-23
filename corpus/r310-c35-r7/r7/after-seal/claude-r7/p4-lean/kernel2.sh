#!/bin/sh
# kernel2.sh — R7Cnf.T1, R7Cnf.T1_input and R7Cnf.T0 through two more kernels (nanoda, con-leche), beside leanchecker,
# and a control every kernel must refuse: the SAME compiled proofs read against a mutated R7Cnf.lean (k = 9 - m - max).
# usage: sh kernel2.sh WORKDIR        WORKDIR must not exist. Nothing is written in this folder; the sources are only read.
set -u
here=$(cd "$(dirname "$0")" && pwd)
W=$1
mkdir "$W" || exit 2
B=/Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin
proj=/Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison
LP=$(cd "$proj" && lake env printenv LEAN_PATH)
PATH="$B:$PATH"; export PATH
ROOTS="R7Cnf.T1 R7Cnf.T1_input R7Cnf.T0"

cat > "$W/tools.py" <<'PY'
import collections, hashlib, json, sys
def read(path):
    names = {0: ""}; kinds = collections.Counter(); out = {"axiom": [], "opaque": [], "thm": set()}
    h = hashlib.sha256()
    for line in open(path, "rb"):
        h.update(line)
        r = json.loads(line)
        if "in" in r:
            if "str" in r:
                p = names[r["str"]["pre"]]; names[r["in"]] = (p + "." if p else "") + r["str"]["str"]
            elif "num" in r:
                p = names[r["num"]["pre"]]; names[r["in"]] = (p + "." if p else "") + str(r["num"]["i"])
            kinds["name"] += 1
            continue
        k = next(x for x in r if x not in ("ie", "il"))
        kinds[k] += 1
        if k in ("axiom", "opaque"):
            out[k].append(names[r[k]["name"]])
        elif k == "thm" and isinstance(r[k].get("value"), int):
            out["thm"].add(names[r[k]["name"]])
    return h.hexdigest(), kinds, out
if sys.argv[1] == "export":
    digest, kinds, out = read(sys.argv[2]); roots = sys.argv[3:]
    print("  sha256", digest)
    print("  records:", ", ".join(f"{kinds[k]} {k}" for k in ("thm", "def", "inductive", "axiom", "opaque", "quot")))
    print("  axioms declared:", ", ".join(sorted(out["axiom"])))
    print("  opaque declarations:", ", ".join(sorted(out["opaque"])))
    print("  roots with a theorem body:", ", ".join(r for r in roots if r in out["thm"]), "| missing:", [r for r in roots if r not in out["thm"]])
elif sys.argv[1] == "config":
    json.dump({"export_file_path": sys.argv[2], "use_stdin": False, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"],
               "unpermitted_axiom_hard_error": True, "nat_extension": True, "string_extension": True, "num_threads": 2,
               "print_success_message": True, "pp_declars": sys.argv[4:], "pp_to_stdout": True,
               "pp_options": {"proofs": False, "width": 130}}, open(sys.argv[3], "w"), indent=1)
PY

kernels() {   # $1 = label, $2 = export file, $3... = the roots, which nanoda is asked to print back (statements only)
  l=$1; f=$2; shift 2
  python3 "$W/tools.py" config "$f" "$W/$l.nanoda.json" "$@"
  nanoda_bin "$W/$l.nanoda.json" > "$W/$l.nanoda.log" 2>&1; e=$?
  echo "  nanoda_bin: exit $e | $(grep -m1 'Checked\|panicked' "$W/$l.nanoda.log" | cut -c1-110) $(grep -m1 'assertion' "$W/$l.nanoda.log")"
  con-leche --verified --jobs=2 "$f" > "$W/$l.conleche.log" 2>&1; e=$?
  echo "  con-leche --verified: exit $e | $(grep -m1 'accepted\|invalid' "$W/$l.conleche.log" | cut -c1-150)"
}

echo "== tools"
lean --version
echo "nanoda_bin: $(nanoda_bin --help 2>&1 | head -1); sha256 $(shasum -a 256 "$B/nanoda_bin" | cut -c1-64)"
echo "con-leche: sha256 $(shasum -a 256 "$B/con-leche" | cut -c1-64)"
echo "leanexport: sha256 $(shasum -a 256 "$B/leanexport" | cut -c1-64)"
echo "leanchecker: sha256 $(shasum -a 256 "$B/leanchecker" | cut -c1-64)"

echo "== the modules, compiled here from this folder's sources (-DwarningAsError=true)"
mkdir "$W/good"
for m in R7Cnf R7CnfSound; do
  LEAN_PATH="$W/good:$LP" lean -DwarningAsError=true -R "$here" -o "$W/good/$m.olean" "$here/$m.lean" > "$W/good/$m.log" 2>&1
  echo "  $m: exit $?, $(wc -l < "$W/good/$m.log" | tr -d ' ') output line(s), source sha256 $(shasum -a 256 "$here/$m.lean" | cut -c1-64), olean sha256 $(shasum -a 256 "$W/good/$m.olean" | cut -c1-64)"
done

echo "== export of $ROOTS (module R7CnfSound)"
LEAN_PATH="$W/good:$LP" leanexport R7CnfSound -- $ROOTS > "$W/good.ndjson" 2> "$W/good.export.err"
echo "  leanexport exit $?, $(wc -c < "$W/good.ndjson" | tr -d ' ') bytes; $(head -1 "$W/good.ndjson")"
python3 "$W/tools.py" export "$W/good.ndjson" $ROOTS

echo "== the three kernels on the proofs as built"
kernels good "$W/good.ndjson" $ROOTS
echo "  nanoda's printing of the three statements and of the axioms: WORKDIR/good.nanoda.log, $(wc -l < "$W/good.nanoda.log" | tr -d ' ') lines, sha256 $(shasum -a 256 "$W/good.nanoda.log" | cut -c1-64)"
LEAN_PATH="$W/good:$LP" leanchecker R7Cnf R7CnfSound > "$W/good.leanchecker.log" 2>&1
echo "  leanchecker R7Cnf R7CnfSound: exit $?"

echo "== control: the same R7CnfSound.olean beside a mutated R7Cnf (10 - I.length - maxMiss -> 9 - I.length - maxMiss)"
mkdir -p "$W/mut/src"
python3 - "$here/R7Cnf.lean" "$W/mut/src/R7Cnf.lean" <<'PY'
import sys
s = open(sys.argv[1]).read(); a = "10 - I.length - maxMiss"
assert s.count(a) == 1, "the mutation site must occur exactly once"
open(sys.argv[2], "w").write(s.replace(a, "9 - I.length - maxMiss"))
PY
lean -DwarningAsError=true -R "$W/mut/src" -o "$W/mut/R7Cnf.olean" "$W/mut/src/R7Cnf.lean" > "$W/mut/R7Cnf.log" 2>&1
echo "  mutated R7Cnf: compiles, exit $?; differing lines $(diff "$here/R7Cnf.lean" "$W/mut/src/R7Cnf.lean" | grep -c '^>'); olean sha256 $(shasum -a 256 "$W/mut/R7Cnf.olean" | cut -c1-64)"
cp "$W/good/R7CnfSound.olean" "$W/mut/R7CnfSound.olean"
for r in $ROOTS; do
  echo " root $r"
  LEAN_PATH="$W/mut:$LP" leanexport R7CnfSound -- "$r" > "$W/mut.$r.ndjson" 2> "$W/mut.$r.export.err"
  echo "  leanexport exit $?, $(wc -c < "$W/mut.$r.ndjson" | tr -d ' ') bytes, sha256 $(shasum -a 256 "$W/mut.$r.ndjson" | cut -c1-64)"
  kernels "mut.$r" "$W/mut.$r.ndjson" "$r"
done
LEAN_PATH="$W/mut:$LP" leanchecker R7CnfSound > "$W/mut.leanchecker.log" 2>&1
echo " leanchecker R7CnfSound beside the mutated R7Cnf: exit $? | $(grep -m2 'while replaying\|(kernel)' "$W/mut.leanchecker.log" | tr '\n' ' ' | cut -c1-150)"
