#!/usr/bin/env bash
# The ORCHESTRATOR'S replay of K0 of PREREG-KN1.md (not the author's run), on the pod: a fresh copy of the pristine
# K0 environment (/root/k1, the lab's built tree), the K0 sources as brought home to the desk (checked against
# /root/k0src-desk.sha), the sealed bytes in /root/sealed and /root/sealed-kn3, then the author's k0-all.sh from zero.
set -uo pipefail
rm -rf /root/replay0; mkdir -p /root/replay0/src /root/replay0/out
tar -xf /root/k0src-desk.tar -C /root/replay0/src 2>/dev/null
cd /root/replay0/src && find . -name "._*" -delete
sha256sum -c /root/k0src-desk.sha > /root/replay0/inputs.check 2>&1; echo "inputs: $(grep -c ': OK$' /root/replay0/inputs.check) OK, $(grep -vc ': OK$' /root/replay0/inputs.check) not OK"
cp -a /root/k1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/percolation /root/replay0/percolation
SRC=/root/replay0/src WORK=/root/replay0/percolation OUT=/root/replay0/out bash /root/replay0/src/k0-all.sh all
( cd /root/replay0 && find out inputs.check -type f | sort | xargs sha256sum > /root/replay0/SHA256SUMS )
echo "REPLAY0-DONE $(date -u +%H:%M:%SZ)"
