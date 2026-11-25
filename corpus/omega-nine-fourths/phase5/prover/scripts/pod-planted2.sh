#!/usr/bin/env bash
# con-leche on the second planted twin, then zstd of the solution export for the clean-room replay.
set -uo pipefail
export HOME=/home/prover
T=/home/prover/tools; W=/home/prover/work; L=$W/math/lean; X=$W/exports
LEX=$T/comparator/.lake/packages/lean4export/.lake/build/bin/lean4export; CL=$T/con-leche/.lake/build/bin/con-leche
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> $X/conleche.log; }
cd $L
N="Rect.borderRankRect_holds Rect.asymptoticRankRect_holds Rect.alphaBounds_holds Rect.dualExponentDiv_holds"
PATH=/pin/lean/bin:/usr/bin:/bin lake env $LEX RectChallenges.RectPlanted2 -- $N > $X/chalPlanted2.ndjson 2> $X/chalPlanted2.export.err; log "export chalPlanted2 (RectChallenges.RectPlanted2) exit $? $(sha256sum $X/chalPlanted2.ndjson | cut -c1-16)"
nice -n 10 $CL --verified --jobs=8 --compare -- $X/chalPlanted2.ndjson $X/sol.ndjson > $X/KC-planted2.out 2>&1; log "con-leche --verified --compare planted2 exit $?; justified lines: $(grep -c "justified by the solution" $X/KC-planted2.out)"
(cd $X && sha256sum chalPlanted2.ndjson) >> $X/conleche.log
cd $X && nice -n 10 zstd -q -19 --long=27 -T16 -f sol.ndjson -o sol.ndjson.zst; log "zstd exit $? $(sha256sum sol.ndjson.zst)"
sha256sum sol.ndjson > sol.ndjson.sha256; sha256sum sol.ndjson.zst > sol.ndjson.zst.sha256; sha256sum chal.ndjson chalPlanted.ndjson chalPlanted2.ndjson > challenges.sha256
date -u > $X/DONE2
