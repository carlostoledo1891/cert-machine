#!/bin/bash
# pod-go.sh LABEL TARGET... — from the Mac: upload the sources, re-assemble, build, show the result.
here="$(cd "$(dirname "$0")" && pwd)"; pod="$(dirname "$here")/pod"
label="$1"; shift
"$pod/pscp" "$here"/*.lean "$here"/pod-setup.sh "$here"/pod-build.sh pod:/root/kn3/src/ || exit 9
"$pod/pssh" "cd /root/kn3 && src/pod-setup.sh /root/kn3/src > logs/setup.out 2>&1 && (nohup src/pod-build.sh $label $* > /dev/null 2>&1 < /dev/null &); for i in \$(seq 1 50); do [ -f logs/$label.exit ] && break; sleep 2; done; echo exit=\$(cat logs/$label.exit 2>/dev/null) seconds=\$(cat logs/$label.seconds 2>/dev/null); grep -v 'depends on axioms\|KN3/Frag.lean\|^trace: \|^✔\|^ℹ' logs/$label.log | cut -c1-${COLS:-500} | head -${LINES_MAX:-90}"
