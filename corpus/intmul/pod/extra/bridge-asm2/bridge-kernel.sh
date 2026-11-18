#!/bin/bash
# bridge-kernel.sh — as tester: the composed theorem exported from the freshly built assembly (asm2) and replayed by nanoda.
O=/results/extra; cd /home/tester/asm2
W=$(ls -d /home/tester/work/aaf10926*/canonical); T=/home/tester/work/aaf109266438/tools
TB=/home/tester/.elan/toolchains/leanprover--lean4---v4.34.1/bin
LP=$(ls -d $W/.lake/packages/*/.lake/build/lib/lean | paste -sd:):$W/.lake/build/lib/lean:/home/tester/asm2/out
date -u +%FT%TZ > $O/bridge.start
for f in SubNLogN/Challenge.lean IntMulBridge/Bounds.lean IntMulBridge/Encodings.lean IntMulBridge/Finite.lean IntMulBridge/Main.lean; do sha256sum $f; done > $O/bridge-sources.sha256
cp Main.log $O/bridge-main-build.log; cat Encodings.log > $O/bridge-encodings-build.log
(cd $T/lean4export && git log --oneline -1) > $O/bridge-lean4export-commit.txt 2>&1
env HOME=/home/tester PATH=$TB:/usr/local/bin:/usr/bin:/bin LEAN_PATH=$LP nice -n 5 /usr/bin/time -v $T/lean4export/.lake/build/bin/lean4export IntMulBridge.Main -- IntMulBridge.community_proves_challenge > /home/tester/asm2/bridge.export 2> $O/bridge-export.err
echo "export exit $? bytes $(wc -c < /home/tester/asm2/bridge.export) sha256 $(sha256sum /home/tester/asm2/bridge.export | cut -c1-64)" > $O/bridge-export.log
python3 - <<'PY'
import json
json.dump({"export_file_path": "/home/tester/asm2/bridge.export", "use_stdin": False, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "unpermitted_axiom_hard_error": True, "nat_extension": True, "string_extension": True, "num_threads": 8, "print_success_message": True, "stack_size_bytes": 1073741824}, open("/results/extra/bridge-nanoda.json", "w"))
PY
nice -n 5 /usr/bin/time -v timeout 14400 $T/nanoda_lib/target/release/nanoda_bin $O/bridge-nanoda.json > $O/bridge-nanoda.log 2> $O/bridge-nanoda.err; echo "exit $?" >> $O/bridge-nanoda.log
date -u +%FT%TZ > $O/bridge.done
