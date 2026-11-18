#!/bin/bash
# pod-extra.sh — run as tester on the pod, low priority: the structural comparisons, the encoding checks, and the
# second kernel shown a planted defect. Facts in /results/extra.
cd /home/tester/extra; O=/results/extra; mkdir -p $O/struct $O/enc
TA=/home/tester/.elan/toolchains/leanprover--lean4---v4.33.1/bin; TB=/home/tester/.elan/toolchains/leanprover--lean4---v4.34.1/bin
WA=/home/tester/work/4738aeff839d/canonical/lean; WB=$(ls -d /home/tester/work/aaf10926*/canonical)
LA=$(ls -d $WA/.lake/packages/*/.lake/build/lib/lean | paste -sd:):$WA/.lake/build/lib/lean
LB=$(ls -d $WB/.lake/packages/*/.lake/build/lib/lean | paste -sd:):$WB/.lake/build/lib/lean
run() { # id toolchain-bin leanpath file out
  env HOME=/home/tester LEAN_PATH=$3 nice -n 10 timeout 900 $2/lean $4 > $5 2>&1; echo "exit $?" >> $5; }
for f in struct/intmul-gcmu/*.lean; do run a $TA $LA $f $O/struct/gcmu-$(basename $f .lean).log; done
for f in struct/intmul-community/*.lean; do run b $TB $LB $f $O/struct/community-$(basename $f .lean).log; done
run a $TA $LA enc/intmul-gcmu.lean $O/enc/gcmu.log
run b $TB $LB enc/intmul-community.lean $O/enc/community.log
# the second kernel on a planted defect: the theorem of Intake.Red.R2 (proved by an added axiom), exported and checked
cd $WA
T=/home/tester/work/4738aeff839d/tools
cp /home/tester/work/4738aeff839d/nanoda.json $O/gcmu-nanoda.json
env HOME=/home/tester PATH=/home/tester/.elan/bin:/usr/local/bin:/usr/bin:/bin nice -n 10 lake env $T/lean4export/.lake/build/bin/lean4export Intake.Red.R2 -- SubNLogN.Assembly.intMul_challenge > /home/tester/extra/red-R2.export 2> $O/red-R2-export.err; echo "export exit $? bytes $(wc -c < /home/tester/extra/red-R2.export) sha256 $(sha256sum /home/tester/extra/red-R2.export | cut -c1-64)" > $O/red-R2-export.log
for hard in false true; do
  python3 - "$hard" <<'PY'
import json, sys
json.dump({"export_file_path": "/home/tester/extra/red-R2.export", "use_stdin": False, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "unpermitted_axiom_hard_error": sys.argv[1] == "true", "nat_extension": True, "string_extension": True, "num_threads": 4, "print_success_message": True, "stack_size_bytes": 1073741824}, open("/home/tester/extra/red-R2-nanoda-" + sys.argv[1] + ".json", "w"))
PY
  nice -n 10 timeout 3600 $T/nanoda_lib/target/release/nanoda_bin /home/tester/extra/red-R2-nanoda-$hard.json > $O/red-R2-nanoda-$hard.log 2>&1; echo "exit $?" >> $O/red-R2-nanoda-$hard.log
done
(cd $T/lean4export && git log --oneline -1) > $O/gcmu-lean4export-commit.txt 2>&1
date -u +%FT%TZ > $O/extra.done
