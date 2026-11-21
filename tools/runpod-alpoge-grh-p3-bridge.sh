#!/usr/bin/env bash
# runpod-alpoge-grh-p3-bridge.sh — the UNCONDITIONAL bridge (amendment A1, BRu) on the build pod, started after phase 2's
# S1 (it needs Alpöge's compiled Main, the root-owned toolchain and judges of phase 2). Into the release's workspace:
# the August release's sources (anthropics/formal-math @ 16a5ce41, zeta23/) under their own source folder, as three
# libraries (Zeta23, ChallengeDeps, Solution) — adding a library does not rebuild built modules (tested 2026-11-21 on
# /home/tester/derisk) — and cert-machine's bridge files under src/CertMachine. Then: build, #print axioms of the six
# bridge theorems, Comparator against CertMachine.BridgeChallenge (no definition_names), control BC1 (6/7) must be rejected.
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}"
R=/results U=tester H=/home/tester W=/home/tester/release/lean T=/opt/judges
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
# amendment A5: start only after phase 2 has exported (the remaining phase-2 steps read the export file, or only read the
# workspace through lake env), and only if S1 was accepted
until grep -qE "EXP exit|phase 2 not started|STOPPED" $R/_phase.log 2>/dev/null; do sleep 120; done
grep -qE "phase 2 not started|STOPPED" $R/_phase.log && { log "bridge not started: phase 2 did not reach the export"; exit 1; }
[ "$(cat $R/S1.exit 2>/dev/null)" = 0 ] || { log "bridge not started: S1 did not pass (exit $(cat $R/S1.exit 2>/dev/null))"; exit 1; }
log "bridge (p3) start"
gate() { [ "$(cat $R/$1.exit)" = 0 ] || { log "STOPPED (bridge): $1 exit $(cat $R/$1.exit)"; exit 1; }; }
manifest() { find $W/.lake/build/lib/lean -type f \( -name '*.olean*' -o -name '*.ilean' \) -not -path '*/CertMachine/*' -not -path '*/Zeta23/*' -not -name 'ChallengeDeps.*' -not -name 'Solution.*' -not -path '*/Solution/*' -not -path '*/ChallengeDeps/*' -printf '%P %s %T@\n' | sort; }
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
printf '\n# written by cert-machine (tools/runpod-alpoge-grh-p3-bridge.sh, amendment A1): the August release, its own folder\n[[lean_lib]]\nname = "Zeta23"\nsrcDir = "zeta23src"\nglobs = ["Zeta23.+"]\n\n[[lean_lib]]\nname = "ChallengeDeps"\nsrcDir = "zeta23src"\nroots = ["ChallengeDeps"]\n\n[[lean_lib]]\nname = "Solution"\nsrcDir = "zeta23src"\nroots = ["Solution"]\n' >> $W/lakefile.toml
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
grep -qE "theorem statement do not match: 'CertMachine.Bridge.five_sixths_distinct_on_critical_line'" $R/BC1.out $R/BC1.err && log "BC1 rejected with its diagnostic" || log "WARNING (bridge): BC1 was not rejected with the expected diagnostic"
step BRJ 172800 lake env $T/comparator/.lake/build/bin/comparator scratch/br.json
manifest > $R/BR-release-manifest.after.txt
cmp -s $R/BR-release-manifest.before.txt $R/BR-release-manifest.after.txt && log "bridge: no release artifact changed" || log "WARNING (bridge): release artifacts changed by the end of the bridge"
log "bridge (p3) done"
