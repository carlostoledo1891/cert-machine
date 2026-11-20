#!/usr/bin/env bash
# pod B, after P0: the judges, then the bridge files compiled in the ported zeta23 workspace, axioms, and zeta23's own Comparator
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=tester H=/home/tester Z=/home/tester/formal-math/zeta23
export DEBIAN_FRONTEND=noninteractive
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
apt-get install -y -qq golang-go pkg-config libssl-dev < /dev/null > /dev/null 2>&1
cat > /tmp/tools.sh <<'B'
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/lib/go/bin:$PATH GIT_TERMINAL_PROMPT=0
mkdir -p $HOME/tools && cd $HOME/tools
rec() { echo "$1 $(git -C $2 rev-parse HEAD) $(git -C $2 describe --tags --always 2>/dev/null)"; }
for r in lean4export comparator; do
  for t in 1 2 3 4 5; do [ -d $r/.git ] && break; rm -rf $r; git clone -q https://github.com/leanprover/$r.git && break; sleep $((t*20)); done
  git -C $r checkout -q v4.33.0 && rec $r $r
  (cd $r && echo 'leanprover/lean4:v4.33.1' > lean-toolchain && lake build 2>&1 | tail -1)
done
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1; export PATH=$HOME/.cargo/bin:$PATH
for t in 1 2 3; do [ -d nanoda_lib/.git ] && break; git clone -q https://github.com/ammkrn/nanoda_lib.git && break; sleep 20; done; rec nanoda nanoda_lib
(cd nanoda_lib && cargo build --release 2>&1 | tail -1)
for t in 1 2 3; do [ -d landrun/.git ] && break; git clone -q https://github.com/Zouuup/landrun.git && break; sleep 20; done; rec landrun landrun
(cd landrun && go build -o landrun ./cmd/landrun 2>&1 | tail -1)
B
chmod 644 /tmp/tools.sh
runuser -u $U -- env -i HOME=$H PATH=/usr/local/bin:/usr/bin:/bin bash /tmp/tools.sh > $R/tools.txt 2>&1; log "tools exit $?"
# the bridge files into the ported workspace (the only change to it: one library)
mkdir -p $Z/CertMachine && cp /root/bridge/*.lean $Z/CertMachine/ && chown -R $U:$U $Z/CertMachine
grep -q 'name = "CertMachine"' $Z/lakefile.toml || printf '\n# cert-machine (amendments A1, A2): the bridge files\n[[lean_lib]]\nname = "CertMachine"\nglobs = ["CertMachine.+"]\n' >> $Z/lakefile.toml
sha256sum $Z/CertMachine/*.lean > $R/bridge-files.sha256
sha256sum $(cd $Z && find . -name '*.lean' -not -path './.lake/*' -not -path './CertMachine/*' | sort | sed "s#^#$Z/#") | sed "s#$Z/##" > $R/zeta23-sources.after.sha256
cmp -s <(sed 's#  \./#  #' $R/zeta23-sources.before.sha256 | sort -k2) <(sort -k2 $R/zeta23-sources.after.sha256) && log "zeta23 sources unchanged by the port" || log "zeta23 sources: see the two sha256 lists"
cat > $Z/CertMachine/Axioms.lean <<'A'
import CertMachine.BridgeConditional
import CertMachine.MasulloReading
#print axioms CertMachine.Bridge.N0star_eq_Ndist
#print axioms CertMachine.Bridge.five_sixths_on_line_of_RH
#print axioms CertMachine.Bridge.montgomery_taylor_on_line_of_RH
#print axioms CertMachine.Bridge.dirichlet_five_sixths_on_line_of_L
#print axioms CertMachine.Bridge.dirichlet_montgomery_taylor_on_line_of_L
#print axioms CertMachine.Masullo.readingQ_zeros_on_line
#print axioms CertMachine.Masullo.readingQ_zeta
#print axioms CertMachine.Masullo.readingQ_simple
A
chown $U:$U $Z/CertMachine/Axioms.lean
run() { local n=$1; shift; log "$n running"; runuser -u $U -- env -i HOME=$H PATH=$H/.elan/bin:$H/.cargo/bin:/usr/local/bin:/usr/bin:/bin COMPARATOR_LEAN4EXPORT=$H/tools/lean4export/.lake/build/bin/lean4export COMPARATOR_LANDRUN=$H/tools/landrun/landrun COMPARATOR_NANODA=$H/tools/nanoda_lib/target/release/nanoda_bin bash -c "cd $Z && /usr/bin/time -v $*" > $R/$n.out 2> $R/$n.err; echo $? > $R/$n.exit; log "$n exit $(cat $R/$n.exit)"; }
run BB lake build CertMachine.BridgeConditional CertMachine.MasulloReading CertMachine.BridgeChallenge CertMachine.BridgeChallengeBC1
run BAX lake env lean CertMachine/Axioms.lean
run P0J lake env $H/tools/comparator/.lake/build/bin/comparator comparator.json
log "pod B done"
