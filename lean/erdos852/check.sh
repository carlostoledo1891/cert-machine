#!/bin/bash
# check.sh — the Lean bridge's battery: the green build must succeed, and
# three deliberately forged variants must FAIL to compile. A red control
# that cannot fire is decoration; here the "firing" is a kernel rejection.
#
# The forges run at calibration scale (primes <= 10000, the weaker claim
# 75239/10^6 that the small partial product genuinely clears): the failure
# MECHANISM is what is under test, and it is scale-invariant.
#
# usage: bash lean/erdos852/check.sh          (from the repository root)
set -u
cd "$(dirname "$0")"
export PATH="$HOME/.elan/bin:$PATH"
ROOT="$(cd ../.. && pwd)"
pass=0; fail=0
say() { printf '%-52s %s\n' "$1" "$2"; }

# ---- green: the full-scale artifact builds --------------------------------
if lake build >/dev/null 2>&1; then say "green · full refutation builds" PASS; pass=$((pass+1))
else say "green · full refutation builds" FAIL; fail=$((fail+1)); fi

# ---- reds: forged variants must be REJECTED by the kernel -----------------
for forge in composite order claim; do
  python3 "$ROOT/tools/gen-lean-erdos852.py" --limit 10000 --num 75239 --den 1000000 --forge "$forge" >/dev/null
  case $forge in
    composite) mod=Erdos852.RefutationForgeComposite; what="a planted composite must break P_all_prime";;
    order)     mod=Erdos852.RefutationForgeOrder;     what="a broken ascent must break P_ascending";;
    claim)     mod=Erdos852.RefutationForgeClaim;     what="an inflated claim must break the inequality";;
  esac
  if lake build "$mod" >/dev/null 2>&1; then say "RED · $what" "FAIL (forgery compiled!)"; fail=$((fail+1))
  else say "RED · $what" "PASS (kernel rejected it)"; pass=$((pass+1)); fi
  rm -f Erdos852/RefutationForge*.lean Erdos852/ChunkForge*.lean
done

echo "check.sh: $pass pass, $fail fail"
exit $fail
