#!/bin/bash
# guard-locate.sh — as root (2026-11-18 15:15 UTC): the sampler inside pod-locate-run.sh reads the memory of the `time`
# wrapper, not of con-leche (its pgrep takes the first match), so memory.txt holds zeros and its stop would never fire.
# This reads the con-leche process itself every 10 s into memory2.txt and stops it (kill -9) at 100 GiB.
O=/results/locate
while P=$(pgrep -x con-leche | head -1); [ -n "$P" ]; do
  R=$(awk "/VmRSS/{print \$2}" /proc/$P/status 2>/dev/null); R=${R:-0}
  echo "$(date -u +%T) $(awk -v r=$R "BEGIN{printf \"%.1f\", r/1048576}") GiB" >> $O/memory2.txt
  if [ "$R" -gt $((100*1024*1024)) ]; then echo "$(date -u +%FT%TZ) stopped (kill -9) at $(awk -v r=$R "BEGIN{printf \"%.1f\", r/1048576}") GiB of resident memory, by guard-locate.sh; not a rejection" > $O/run.stopped; kill -9 $P; fi
  sleep 10
done
