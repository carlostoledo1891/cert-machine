#!/bin/bash
# k0-fresh.sh LABEL — run ON THE POD: move the previous K0 run and the build outputs of OUR modules aside (moved, not
# deleted: /root/kn1/attic/LABEL), so that the next `k0-all.sh all` compiles every one of our modules again from the
# sealed bytes. The lab's build outputs (Percolation.*, Solution.*) and Mathlib's are not touched.
set -eu
LABEL="${1:?usage: k0-fresh.sh LABEL}"
A=/root/kn1/attic/$LABEL; L=/root/kn1/percolation/.lake/build/lib/lean
[ -e "$A" ] && { echo "$A exists"; exit 1; }
mkdir -p "$A/build"
[ -d /root/kn1/k0 ] && mv /root/kn1/k0 "$A/k0"
[ -f /root/kn1/k0-all.out ] && mv /root/kn1/k0-all.out "$A/"
for f in "$L"/KN1 "$L"/Printed.* "$L"/Printed1.* "$L"/Planted1.*; do [ -e "$f" ] && mv "$f" "$A/build/"; done
echo "moved aside to $A: $(ls "$A/build" | wc -l) build entries"
