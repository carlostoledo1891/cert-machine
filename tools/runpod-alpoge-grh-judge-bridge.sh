#!/usr/bin/env bash
# runpod-alpoge-grh-judge-bridge.sh — amendment A19 (2026-11-22): the UNCONDITIONAL bridge (BRu) on the larger machine.
# The bridge's gate on the build pod reads that pod's own S1, which was stopped at its memory limit (A17), and the
# bridge's two Comparator runs need the same memory as S1. On the operator's word the bridge runs here, and only if S1
# passed here with every one of its conditions. From `gate()` to the last step this file is the build pod's bridge
# script (tools/runpod-alpoge-grh-p3-bridge.sh) line for line; what differs is above that: the unprivileged user
# (`verifier`), the log (`_bridge.log`) and the start condition.
# usage: AUDIT_SHA=<commit> bash judge-bridge.sh        (start it detached; it waits for "judge done" by itself)
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}"
R=/results U=verifier H=/home/verifier W=/home/tester/release/lean T=/opt/judges
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_bridge.log; }
# start only after the judge script has ended, and only if S1 passed here: exit 0, both acceptance lines, the sandbox,
# the compiled challenge unchanged before S1, the copy's lists equal and `lake build --no-build` exit 0
until grep -qE "judge done|JUDGE-HALT" $R/_judge.log 2>/dev/null; do sleep 120; done
S1OK=0; [ "$(cat $R/S1.exit 2>/dev/null)" = 0 ] && grep -q "Your solution is okay!" $R/S1.out && grep -q "Lean default kernel accepts the solution" $R/S1.out && grep -q '^sandbox' $R/S1.mode && grep -q "challenge build unchanged before S1" $R/_judge.log && grep -q "copy lists equal" $R/_judge.log && [ "$(cat $R/NOBUILD.exit 2>/dev/null)" = 0 ] && S1OK=1
[ $S1OK = 1 ] || { log "bridge not started: S1 did not pass on this machine (amendment A19)"; exit 1; }
log "bridge (judge) start (audit $AUDIT_SHA)"
gate() { [ "$(cat $R/$1.exit)" = 0 ] || { log "STOPPED (bridge): $1 exit $(cat $R/$1.exit)"; exit 1; }; }
manifest() { (cd $W/.lake/build/lib/lean && find . -type f \( -name '*.olean*' -o -name '*.ilean' \) -not -path './CertMachine/*' -not -path './Zeta23/*' -not -name 'ChallengeDeps.*' -not -name 'Solution.*' -not -path './Solution/*' -not -path './ChallengeDeps/*' -print0 | xargs -0 -P 16 -n 500 sha256sum | sort -k2); }
manifest > $R/BR-release-manifest.before.txt; log "release artifacts before the bridge: $(wc -l < $R/BR-release-manifest.before.txt)"
step() {
  local n=$1 to=$2; shift 2
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" \
    COMPARATOR_LEAN4EXPORT=$T/lean4export/.lake/build/bin/lean4export COMPARATOR_LANDRUN=$T/landrun-use \
    COMPARATOR_NANODA=$T/nanoda_lib/target/release/nanoda_bin \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$W" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
# the August release's sources, fetched by root, checked file by file against the list taken on the port pod
mkdir -p /opt/bridge && cd /opt/bridge && rm -rf formal-math
for t in 1 2 3 4 5; do GIT_TERMINAL_PROMPT=0 git clone -q https://github.com/anthropics/formal-math.git && break; sleep $((t*20)); done
git -C formal-math checkout -q 16a5ce41304fcdaea4e0be7c132e1c361dc26da5 && git -C formal-math rev-parse HEAD > $R/BR-formal-math.commit
curl -fsSL --retry 5 "$RAW/corpus/alpoge-grh/runs-bridge/podB-lyq17afbn6smbz/zeta23-sources.before.sha256" -o /opt/bridge/zeta23.sha256
(cd formal-math/zeta23 && sha256sum -c --quiet /opt/bridge/zeta23.sha256) > $R/BR-sources-check.txt 2>&1 && log "zeta23 sources: all match the port pod's list" || { log "STOPPED (bridge): zeta23 sources differ from the port pod's list (BR-sources-check.txt)"; exit 1; }
mkdir -p $W/zeta23src && cp -r formal-math/zeta23/Zeta23 formal-math/zeta23/Zeta23.lean formal-math/zeta23/ChallengeDeps.lean formal-math/zeta23/Solution.lean formal-math/zeta23/Solution $W/zeta23src/ 2>/dev/null
[ -d formal-math/zeta23/ChallengeDeps ] && cp -r formal-math/zeta23/ChallengeDeps $W/zeta23src/
for f in BridgeConditional Bridge BridgeChallenge BridgeChallengeBC1 MasulloReading; do curl -fsSL --retry 5 "$RAW/instruments/alpoge-grh/bridge/CertMachine/$f.lean" -o $W/src/CertMachine/$f.lean; done
sha256sum $W/src/CertMachine/Bridge*.lean $W/src/CertMachine/MasulloReading.lean > $R/BR-files.sha256
cp $W/lakefile.toml $R/lakefile.before-bridge.toml
printf '\n# written by cert-machine (tools/runpod-alpoge-grh-judge-bridge.sh, amendments A1 and A19): the August release, its own folder\n[[lean_lib]]\nname = "Zeta23"\nsrcDir = "zeta23src"\nglobs = ["Zeta23.+"]\n\n[[lean_lib]]\nname = "ChallengeDeps"\nsrcDir = "zeta23src"\nroots = ["ChallengeDeps"]\n\n[[lean_lib]]\nname = "Solution"\nsrcDir = "zeta23src"\nroots = ["Solution"]\n' >> $W/lakefile.toml
cp $W/lakefile.toml $R/lakefile.with-bridge.toml
chown -R $U:$U $W/zeta23src $W/src/CertMachine
step BRB 21600 lake build Zeta23 ChallengeDeps Solution CertMachine.BridgeConditional CertMachine.MasulloReading CertMachine.BridgeChallenge CertMachine.BridgeChallengeBC1 CertMachine.Bridge
gate BRB
manifest > $R/BR-release-manifest.after-build.txt
cmp -s $R/BR-release-manifest.before.txt $R/BR-release-manifest.after-build.txt && log "BRB: no release artifact changed" || { log "STOPPED (bridge): release artifacts changed during the bridge build"; exit 1; }
cat > $W/scratch/AxBridge.lean <<'EOF'
import CertMachine.Bridge
#print axioms CertMachine.Bridge.five_sixths_distinct_on_critical_line
#print axioms CertMachine.Bridge.five_sixths_distinct_on_critical_line_cumulative
#print axioms CertMachine.Bridge.montgomery_taylor_distinct_on_critical_line
#print axioms CertMachine.Bridge.montgomery_taylor_distinct_on_critical_line_cumulative
#print axioms CertMachine.Bridge.dirichlet_five_sixths_distinct_on_critical_line
#print axioms CertMachine.Bridge.dirichlet_montgomery_taylor_distinct_on_critical_line
EOF
chown $U:$U $W/scratch/AxBridge.lean
step BRA 7200 lake env lean scratch/AxBridge.lean
gate BRA
[ "$(grep -c "depends on axioms: \[propext, Classical.choice, Quot.sound\]" $R/BRA.out)" = 6 ] || { log "STOPPED (bridge): not all six bridge theorems on the three standard axioms"; exit 1; }
TH='["CertMachine.Bridge.five_sixths_distinct_on_critical_line", "CertMachine.Bridge.five_sixths_distinct_on_critical_line_cumulative", "CertMachine.Bridge.montgomery_taylor_distinct_on_critical_line", "CertMachine.Bridge.montgomery_taylor_distinct_on_critical_line_cumulative", "CertMachine.Bridge.dirichlet_five_sixths_distinct_on_critical_line", "CertMachine.Bridge.dirichlet_montgomery_taylor_distinct_on_critical_line"]'
printf '{"challenge_module": "CertMachine.BridgeChallenge", "solution_module": "CertMachine.Bridge", "theorem_names": %s, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": false}\n' "$TH" > $W/scratch/br.json
printf '{"challenge_module": "CertMachine.BridgeChallengeBC1", "solution_module": "CertMachine.Bridge", "theorem_names": ["CertMachine.Bridge.five_sixths_distinct_on_critical_line"], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": false}\n' > $W/scratch/bc1.json
chown $U:$U $W/scratch/br.json $W/scratch/bc1.json; cp $W/scratch/br.json $W/scratch/bc1.json $R/
step BC1 21600 lake env $T/comparator/.lake/build/bin/comparator scratch/bc1.json
[ "$(cat $R/BC1.exit)" != 0 ] && grep -qE "theorem statement do not match: 'CertMachine.Bridge.five_sixths_distinct_on_critical_line'" $R/BC1.out $R/BC1.err && log "BC1 rejected with its diagnostic" || { log "STOPPED (bridge): BC1 was not rejected with its diagnostic"; exit 1; }
step BRJ 172800 lake env $T/comparator/.lake/build/bin/comparator scratch/br.json
manifest > $R/BR-release-manifest.after.txt
cmp -s $R/BR-release-manifest.before.txt $R/BR-release-manifest.after.txt && log "bridge: no release artifact changed" || { log "STOPPED (bridge): release artifacts changed by the end of the bridge"; exit 1; }
log "bridge (judge) done"
