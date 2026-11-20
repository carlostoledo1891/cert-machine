#!/usr/bin/env bash
# setupclean.sh — keeps the release build inside the pod's 320 GB. Lake writes, for each module, a <module>.setup.json
# (here ~6 MB each: the module's whole import list) as the input of that module's compile. Once the module is built
# (its .c.hash written), the file is not read again: removed or emptied, Lake still treats the module as up to date
# (tested on /home/tester/derisk, 2026-11-20 22:47 UTC). This loop removes the setup files of finished modules only, and
# logs every pass. (From 22:42 to 22:47 UTC an earlier loop emptied the first 5,963 generated .c files instead —
# 56 MB, native-code output no check reads; it was stopped when the setup files turned out to be the space.)
IR=/home/tester/release/lean/.lake/build/ir
while true; do
  n=0; b=0
  while IFS= read -r -d '' f; do
    base=${f%.setup.json}
    [ -f "$base.c.hash" ] || continue
    s=$(stat -c %s "$f"); rm -f "$f" && { n=$((n+1)); b=$((b+s)); }
  done < <(find $IR -name '*.setup.json' -print0 2>/dev/null)
  echo "$(date -u +%FT%TZ) removed $n setup files $b bytes; disk $(df -h / | awk 'NR==2{print $3" used "$4" free"}')" >> /results/setupclean.log
  grep -q "phase 1 done" /results/_phase.log 2>/dev/null && [ $n = 0 ] && break
  sleep 120
done
