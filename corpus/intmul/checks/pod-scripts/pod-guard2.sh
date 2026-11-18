#!/bin/bash
# pod-guard2.sh — as root (2026-11-18 04:12 UTC). nanoda's memory on the community closure grows late in its run (the
# bridge theorem's nanoda: 3.4 GB for an hour, 48 GB at 104 minutes). This guard keeps the registered step's second
# attempt and the community fresh replay alive: it samples the container's ANONYMOUS memory every 15 s, logs one line
# a minute, and above 104 GiB stops the optional checks (everything started from /home/tester/x), above 112 GiB the
# bridge theorem's nanoda. Every action is a line in /results/extra/guard2.txt.
O=/results/extra/guard2.txt; i=0
anon() { awk '$1=="anon"{print $2}' /sys/fs/cgroup/memory.stat; }
rss() { ps -eo rss,args | awk -v p="$1" '$0 ~ p && !/awk/ {s+=$1} END{printf "%.1f", s/1048576}'; }
while true; do
  a=$(anon); g=$(( a / 1073741824 ))
  if [ $(( i % 4 )) = 0 ]; then echo "$(date -u +%H:%M:%S) anon ${g} GiB | registered nanoda $(rss 'nanoda_bin nanoda.json') | bridge nanoda $(rss 'bridge-nanoda.json') | fresh $(rss 'leanchecker --fresh') | optional $(rss '/home/tester/x/')" >> $O; fi
  if [ "$g" -ge 104 ] && pgrep -f "/home/tester/x/(cmp|l4l|con-leche|bin)" > /dev/null; then
    echo "$(date -u +%H:%M:%S) anon ${g} GiB: the optional checks are stopped" >> $O
    touch /results/extra2/_stopped-by-guard2; pkill -KILL -f "pod-extra2-run.sh"; pkill -KILL -f "/home/tester/x/(cmp|l4l|con-leche|bin)"; pkill -KILL -u tester -x lean4export; sleep 20
  elif [ "$g" -ge 112 ] && pgrep -f "bridge-nanoda.json" > /dev/null; then
    echo "$(date -u +%H:%M:%S) anon ${g} GiB: the bridge theorem's nanoda is stopped" >> $O; pkill -KILL -f "bridge-nanoda.json"; sleep 20
  fi
  i=$(( i + 1 )); sleep 15
done
