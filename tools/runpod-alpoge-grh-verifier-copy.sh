#!/usr/bin/env bash
# runpod-alpoge-grh-verifier-copy.sh — run FROM THE OPERATOR'S MAC, after B1, between `verifier.sh setup` and
# `verifier.sh check` (amendments A4, A5). It copies ONLY the release's compiled artifacts from the build pod to the clean
# verifier: .lake/build of the release workspace, EXCLUDING cert-machine's own modules (CertMachine/*, the bridge's
# Zeta23/ChallengeDeps/Solution) — the verifier keeps the challenge it built itself — and excluding .lake/build/bin.
# Both ends hash every copied file (sha256, sorted lists); the lists must be equal, or the copy is refused.
# usage: A=root@<build ip> AP=<port> V=root@<verifier ip> VP=<port> bash tools/runpod-alpoge-grh-verifier-copy.sh
# STREAMS=<n> (default 1) sends the same files over n parallel tar streams: one stream between two data centres carried
# 14 MB/s on 2026-11-22, eight carried 94 MB/s. The acceptance test does not change: both ends' sha256 lists equal.
set -euo pipefail
: "${A:?}" "${AP:?}" "${V:?}" "${VP:?}"
K=~/.ssh/id_ed25519_runpod
O="-o StrictHostKeyChecking=no -o ConnectTimeout=30"
W=/home/tester/release/lean
EXCL="--exclude=*/CertMachine --exclude=*/CertMachine/* --exclude=*/Zeta23 --exclude=*/Zeta23/* --exclude=*/ChallengeDeps* --exclude=*/Solution* --exclude=.lake/build/bin"
# a key on the build pod that opens the verifier only (root-owned; the release's user cannot read /root)
PUB=$(ssh -i $K -p $AP $O $A 'test -f /root/.ssh/id_v || ssh-keygen -q -t ed25519 -N "" -f /root/.ssh/id_v; cat /root/.ssh/id_v.pub')
ssh -i $K -p $VP $O $V "mkdir -p /root/.ssh && grep -qF '$PUB' /root/.ssh/authorized_keys 2>/dev/null || echo '$PUB' >> /root/.ssh/authorized_keys"
VH=${V#root@}
# the source list, then the copy, then the destination list
FILTER="-type f -not -path '*/CertMachine/*' -not -path '*/Zeta23/*' -not -name 'ChallengeDeps*' -not -name 'Solution*' -not -path '*/Solution/*' -not -path '*/ChallengeDeps/*' -not -path '.lake/build/bin/*'"   # the copied set, defined once
HASHCMD="cd $W && find .lake/build $FILTER -print0 | xargs -0 -P 16 -n 200 sha256sum | sort -k2"
STREAMS=${STREAMS:-1}
ssh -i $K -p $AP $O $A "$HASHCMD > /results/copy-source.sha256; wc -l < /results/copy-source.sha256"
if [ "$STREAMS" = 1 ]; then
  ssh -i $K -p $AP $O $A "cd $W && tar $EXCL -cf - .lake/build | ssh -i /root/.ssh/id_v -p $VP -o StrictHostKeyChecking=no $V 'tar -C $W -xf - && chown -R verifier:verifier $W/.lake/build'"
else
  # the files of the list above, largest first, dealt round-robin to $STREAMS lists; one tar stream per list
  R=$(ssh -i $K -p $AP $O $A "bash -s" <<REMOTE
set -uo pipefail
cd $W && rm -f /tmp/copy.part.*
find .lake/build $FILTER -printf '%s\t%p\n' | sort -t "\$(printf '\t')" -k1,1nr | awk -F '\t' -v n=$STREAMS '{print \$2 > ("/tmp/copy.part." (NR % n))}'
for f in /tmp/copy.part.*; do
  ( tar -cf - --verbatim-files-from -T \$f | ssh -i /root/.ssh/id_v -p $VP -o StrictHostKeyChecking=no -o BatchMode=yes -o ServerAliveInterval=30 $V 'tar -C $W -xf -'; echo "\${PIPESTATUS[0]} \${PIPESTATUS[1]}" > \$f.exit ) < /dev/null &
  sleep 0.4
done
wait
cat /tmp/copy.part.*.exit | sort -u | tr '\n' ';'
REMOTE
)
  [ "$R" = "0 0;" ] || { echo "COPY REFUSED: a stream failed (exit pairs: $R)"; exit 1; }
  ssh -i $K -p $VP $O $V "chown -R verifier:verifier $W/.lake/build"
fi
ssh -i $K -p $VP $O $V "$HASHCMD > /results/copy-dest.sha256; wc -l < /results/copy-dest.sha256"
scp -q -i $K -P $AP $O $A:/results/copy-source.sha256 /tmp/copy-source.sha256
scp -q -i $K -P $VP $O $V:/results/copy-dest.sha256 /tmp/copy-dest.sha256
scp -q -i $K -P $VP $O /tmp/copy-source.sha256 $V:/results/copy-source.sha256
if cmp -s /tmp/copy-source.sha256 /tmp/copy-dest.sha256; then echo "COPY OK: $(wc -l < /tmp/copy-dest.sha256) files, identical lists"; else echo "COPY REFUSED: the lists differ"; exit 1; fi
