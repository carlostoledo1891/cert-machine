#!/usr/bin/env bash
# Phase 4 prover: root part of the pod setup (packages, the unprivileged user `prover`, the digest-checked toolchain in
# /pin/lean, go), then hands over to pod-setup.sh run as `prover`. Adapted from bridge/pod-setup.sh and
# tools/runpod-omega-p1.sh (pin mode). Start detached: nohup bash /opt/p4/pod-root.sh > /opt/p4/root.log 2>&1 &
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
export DEBIAN_FRONTEND=noninteractive
U=prover H=/home/prover P=/pin
LEAN_TGZ_SHA=47bf4bbd78f70c2e9670598ab7124d92b6efb7330ff33e5fbb4030f6fd72e4e4
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }
log "root start on $(hostname), $(nproc) vCPU"
apt-get update -qq < /dev/null > /dev/null 2>&1
apt-get install -y -qq git curl jq build-essential pkg-config libssl-dev time python3 zstd ca-certificates < /dev/null > /dev/null 2>&1 || log "apt partly failed"
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
mkdir -p $P/lean
curl -fsSL --retry 5 -o $P/lean-4.34.1-linux.tar.zst https://github.com/leanprover/lean4/releases/download/v4.34.1/lean-4.34.1-linux.tar.zst
[ "$(sha256sum $P/lean-4.34.1-linux.tar.zst | cut -c1-64)" = "$LEAN_TGZ_SHA" ] || { log "STOP: toolchain digest"; exit 1; }
tar --zstd -xf $P/lean-4.34.1-linux.tar.zst -C $P/lean --strip-components=1 && chmod -R a+rX,go-w $P/lean
log "toolchain archive matches GitHub's digest: $($P/lean/bin/lean --version)"
if [ ! -x /usr/local/go/bin/go ]; then
  curl -fsSL --retry 5 -o /tmp/go.tgz https://go.dev/dl/go1.24.13.linux-amd64.tar.gz
  [ "$(sha256sum /tmp/go.tgz | cut -c1-64)" = 1fc94b57134d51669c72173ad5d49fd62afb0f1db9bf3f798fd98ee423f8d730 ] || { log "STOP: go digest"; exit 1; }
  tar -C /usr/local -xzf /tmp/go.tgz
fi
log "go: $(/usr/local/go/bin/go version)"
mkdir -p $H/work $H/tools && chown -R $U:$U $H/work $H/tools
install -o $U -g $U -m 644 /opt/p4/pod-setup.sh $H/work/pod-setup.sh
install -o $U -g $U -m 644 /opt/p4/pod-judges.sh $H/tools/pod-judges.sh
runuser -u $U -- env -i HOME=$H PATH=/pin/lean/bin:/usr/local/bin:/usr/bin:/bin bash $H/work/pod-setup.sh
log "release setup returned $?"
runuser -u $U -- env -i HOME=$H PATH=/pin/lean/bin:/usr/local/go/bin:/usr/local/bin:/usr/bin:/bin bash $H/tools/pod-judges.sh
log "judges returned $?"
date -u > /opt/p4/ROOT.done
