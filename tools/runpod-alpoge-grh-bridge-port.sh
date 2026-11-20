#!/usr/bin/env bash
# phase P0 of amendment A1 on pod B: formal-math/zeta23 at 16a5ce41, rebuilt on v4.33.1 + Mathlib 0df444a3
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=tester H=/home/tester
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R; log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
log "start; $(nproc) vCPU"
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time zstd build-essential procps < /dev/null > /dev/null
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U; chown $U:$U $R
cat > /tmp/port.sh <<'B'
set -uo pipefail
export GIT_TERMINAL_PROMPT=0
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH=$HOME/.elan/bin:$PATH
cd $HOME; for t in 1 2 3 4 5; do git clone -q https://github.com/anthropics/formal-math.git && break; sleep $((t*20)); done
git -C formal-math checkout -q 16a5ce41304fcdaea4e0be7c132e1c361dc26da5 && git -C formal-math rev-parse HEAD
cd formal-math/zeta23
sha256sum $(find . -name '*.lean' | sort) > /results/zeta23-sources.before.sha256
echo "toolchain as released: $(cat lean-toolchain)"; echo 'leanprover/lean4:v4.33.1' > lean-toolchain
sed -i 's/51e6992efd06126df61a496bebf8f49482a4e129/0df444a360eaa60ab8c11dca51a86af692955474/' lakefile.toml
grep -n 'rev =' lakefile.toml
lake update mathlib 2>&1 | tail -3
python3 -c "import json; [print(p['name'], p.get('rev')) for p in json.load(open('lake-manifest.json'))['packages']]"
for t in 1 2 3; do lake exe cache get 2>&1 | tail -2 && break; sleep 30; done
B
chmod 644 /tmp/port.sh; runuser -u $U -- env -i HOME=$H PATH=/usr/local/bin:/usr/bin:/bin bash /tmp/port.sh > $R/P0-setup.out 2>&1; log "setup exit $?"
cd $H/formal-math/zeta23
runuser -u $U -- env -i HOME=$H PATH=$H/.elan/bin:/usr/local/bin:/usr/bin:/bin bash -c 'cd '$H'/formal-math/zeta23 && /usr/bin/time -v lake build Zeta23 ChallengeDeps Challenge Solution' > $R/P0-build.out 2> $R/P0-build.err; echo $? > $R/P0-build.exit
log "build exit $(cat $R/P0-build.exit)"
