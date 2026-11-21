#!/usr/bin/env bash
# runpod-alpoge-grh-move-build.sh — amendment A9: after B1 finishes on the big pod, move the release's compiled files to
# the checking pod and hand over to phase 2 there. Run FROM THE OPERATOR'S MAC.
#   1  the checking pod: stop the phase-2/3 waiters and its own B1 (p1, lake build, the setup cleanup); keep its pre-B1
#      challenge build; remove its partial release artifacts
#   2  copy .lake/build from the big pod (no CertMachine/*), zstd-compressed over ssh with a key that opens only the
#      checking pod; sha256 lists of every copied file on both ends must be equal
#   3  the big pod's B1 logs copied into the checking pod's /results as B1-big.*; B1.exit and "phase 1 done" written; the
#      phase-2 and bridge waiters restarted (phase 2 then runs exactly as pre-registered; B1V decides B1)
# usage: BIG=root@<ip> BP=<port> CHK=root@<ip> CP=<port> AUDIT_SHA=<commit for the bridge> bash tools/runpod-alpoge-grh-move-build.sh
set -euo pipefail
: "${BIG:?}" "${BP:?}" "${CHK:?}" "${CP:?}" "${AUDIT_SHA:?}"
K=~/.ssh/id_ed25519_runpod; O="-o StrictHostKeyChecking=no -o ConnectTimeout=30"
W=/home/tester/release/lean
sb() { ssh -i $K -p $BP $O $BIG "$@"; }
sc() { ssh -i $K -p $CP $O $CHK "$@"; }
sb 'grep -q "phase 1 done" /results/_phase.log' || { echo "the big pod's phase 1 is not done"; exit 1; }
echo "big pod B1: $(sb 'cat /results/B1.exit; grep -c Built /results/B1.progress; grep -c "^error" /results/B1.progress || true')"
# 1
sc 'for s in p2 p3 p1; do P=$(ps -eo pid,ppid,cmd | awk -v s="/root/$s.sh" "\$3==\"bash\" && \$4==s {print \$1}"); [ -n "$P" ] && kill $P && echo "stopped $s $P"; done
pkill -u tester -f "lake build" || true; pkill -u tester -x lean || true; pkill -u tester -f setupclean.sh || true; sleep 5
pgrep -u tester -f "lean " | head -3 || true
cd /home/tester/release/lean/.lake/build && find lib/lean ir -mindepth 1 -maxdepth 1 -not -name CertMachine -exec rm -rf {} +; ls lib/lean ir'
# 2
PUB=$(sb 'test -f /root/.ssh/id_move || ssh-keygen -q -t ed25519 -N "" -f /root/.ssh/id_move; cat /root/.ssh/id_move.pub')
sc "mkdir -p /root/.ssh && grep -qF '$PUB' /root/.ssh/authorized_keys 2>/dev/null || echo '$PUB' >> /root/.ssh/authorized_keys; which zstd"
CH=${CHK#root@}
LIST="cd $W && find .lake/build -type f -not -path '*/CertMachine/*' -print0 | xargs -0 -P 32 -n 500 sha256sum | sort -k2"
sb "$LIST > /results/move-source.sha256; wc -l < /results/move-source.sha256"
sb "cd $W && tar --exclude='*/CertMachine' --exclude='*/CertMachine/*' -cf - .lake/build | zstd -T0 -3 | ssh -i /root/.ssh/id_move -p $CP -o StrictHostKeyChecking=no $CHK 'zstd -d | tar -C $W -xf - && chown -R tester:tester $W/.lake/build'"
sc "$LIST > /results/move-dest.sha256; wc -l < /results/move-dest.sha256"
scp -q -i $K -P $BP $O $BIG:/results/move-source.sha256 /tmp/move-source.sha256
scp -q -i $K -P $CP $O $CHK:/results/move-dest.sha256 /tmp/move-dest.sha256
cmp -s /tmp/move-source.sha256 /tmp/move-dest.sha256 || { echo "MOVE REFUSED: the lists differ"; exit 1; }
echo "MOVE OK: $(wc -l < /tmp/move-dest.sha256) files, identical lists"
scp -q -i $K -P $CP $O /tmp/move-source.sha256 $CHK:/results/move-source.sha256
# 3
sb 'cd /results && tar -cf - B1.progress B1.exit B1.start B1.end B1.err I1.txt _phase.log challenge-build.sha256 challenge-build.after-B1.sha256 setupclean.log 2>/dev/null' | sc 'mkdir -p /results/big && tar -C /results/big -xf -'
sc "cp /results/big/B1.progress /results/B1.progress; cp /results/big/B1.exit /results/B1.exit; cp /results/big/B1.start /results/B1.start; cp /results/big/B1.end /results/B1.end
echo \"\$(date -u +%FT%TZ) B1 ran on the big pod uhsel7c0ri69nn (amendment A9); its .lake/build copied here, lists equal (move-*.sha256)\" >> /results/_phase.log
echo \"\$(date -u +%FT%TZ) phase 1 done\" >> /results/_phase.log
(nohup bash /root/p2.sh > /root/p2.log 2>&1 < /dev/null &); (nohup env AUDIT_SHA=$AUDIT_SHA bash /root/p3.sh > /root/p3.log 2>&1 < /dev/null &); sleep 2; ps -eo pid,ppid,cmd | grep -E '^ *[0-9]+ +1 bash /root/p[23].sh'"
echo "handed over; delete the big pod after checking /results/big on the checking pod"
