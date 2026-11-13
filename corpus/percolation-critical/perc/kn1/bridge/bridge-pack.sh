#!/bin/bash
# bridge-pack.sh — run ON THE POD after the builds, k3.sh and red.sh: the record of K2, K3 and the red controls
# gathered in /root/kn1/bridge-record, SHA256SUMS over every file of it, and /root/kn1/bridge-record.tar.
#   logs/          setup, builds (b1-core: first try; b2-core; walk; walk-attempt1), tools, k3.out, red.out
#   k3/            leanchecker, Comparator (ours and KR4), their logs and verdicts
#   red/           the final red run (KR1–KR3: every red file, its log, its exit code, summary.txt)
#   red-attempt1/  the first red run (before Walk.olean existed; kept)
#   tree/          our files as they sit in the working tree, and its lakefile.toml
#   src/           the bridge sources as uploaded (the desk's perc/kn1/bridge/), with STATEMENT-DIFF, LOG, RESULTS
#   env/           K1's own exit codes, seconds, pins and axioms output (read from /root/third/runs)
# No file of the third party is copied.
set -eu
WORK=/root/kn1/third; REC=/root/kn1/bridge-record
[ -e "$REC" ] && { echo "$REC exists: move it aside first"; exit 1; }
mkdir -p "$REC"/{logs,k3,red,red-attempt1,tree/KN1,src,env}
cp -a /root/kn1/bridge-logs/. "$REC/logs/"
cp -a /root/kn1/k3/. "$REC/k3/"
cp -a /root/kn1/red/. "$REC/red/"
[ -d /root/kn1/attic/red-attempt1 ] && cp -a /root/kn1/attic/red-attempt1/. "$REC/red-attempt1/"
( cd "$WORK" && cp Printed.lean Printed1.lean Planted1.lean lakefile.toml lean-toolchain lake-manifest.json OurChallenge*.lean comparator-kn1.json "$REC/tree/" && cp -a KN1/. "$REC/tree/KN1/" )
cp -a /root/kn1/bridge-src/. "$REC/src/"
cp /root/third/runs/*.exit /root/third/runs/*.seconds /root/third/runs/sha256.txt /root/third/runs/closed-removed.txt /root/third/runs/axioms.log /root/k1third.out "$REC/env/"
( cd "$REC" && find . -type f ! -name SHA256SUMS | LC_ALL=C sort | xargs -d '\n' sha256sum > SHA256SUMS && wc -l SHA256SUMS && du -sh . )
tar cf /root/kn1/bridge-record.tar -C /root/kn1 bridge-record
sha256sum /root/kn1/bridge-record.tar
