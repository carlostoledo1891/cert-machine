#!/bin/bash
# Step 5, second pod (the first was deleted at 12% of the desk's battery, its run cut off in `cap`): the same setup, the
# same Linux variant of the rejection test (made by the same two edits, its diff kept), the same cp wrapper, then run182.sh.
# Run: nohup bash /root/s/chain182.sh > /root/s/chain.out 2>&1 < /dev/null &
cd /root/s && bash setup182.sh > setup.log 2>&1
st() { echo "$(date -u +%FT%TZ) $*" >> /root/s/runs/_status.txt; }
[ "$(cat runs/flint-build.exit)" = 0 ] && [ "$(cat runs/python-flint-build.exit)" = 0 ] && [ -d pkg/prime-gaps-external-182 ] || { st "CHAIN STOPPED: setup incomplete"; exit 2; }
grep -q 2960729efa8996538731820ce6cadc202831c8e98b2c0bdb14cfd19f33726f3b runs/archive.sha256 || { st "CHAIN STOPPED: the archive is not the pinned one"; exit 2; }
P=pkg/prime-gaps-external-182
sed "s#r=subprocess.run(\[sys.executable,#r=subprocess.run([(\"/root/s/venv-stock/bin/python\" if name==\"obsolete_fft_runtime\" else sys.executable),#" $P/test_rejection.py > test_rejection_linux.py
sed -i "s#^from verify import#import sys; sys.path.insert(0, \"/root/s/pkg/prime-gaps-external-182\")\nfrom verify import#" test_rejection_linux.py
diff $P/test_rejection.py test_rejection_linux.py > runs/test_rejection_linux.diff
[ -f /usr/bin/cp.gnu ] || mv /usr/bin/cp /usr/bin/cp.gnu
printf '#!/bin/sh\n# step 5 deviation (4): the package calls /bin/cp -cR (macOS clone flag); GNU cp has no -c. Same copy, no clone.\nif [ "$1" = "-cR" ]; then shift; exec /usr/bin/cp.gnu -R "$@"; fi\nexec /usr/bin/cp.gnu "$@"\n' > /usr/bin/cp; chmod +x /usr/bin/cp; cp /usr/bin/cp runs/cp-wrapper.sh
sha256sum compare182.py > runs/compare182.sha256; st "compare182.py $(cut -c1-64 runs/compare182.sha256) on the pod, before verify.py"
bash run182.sh > run.out 2>&1
st "chain done"
