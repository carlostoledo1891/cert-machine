#!/bin/bash
# pod-guard3.sh — as root (2026-11-18 04:20 UTC), replaces pod-guard2.sh after it stopped the bridge theorem's nanoda at
# 103.5 GB (exit 137, 109 minutes in, unfinished). Same sampler. Above 100 GiB of anonymous memory in the container the
# optional checks are stopped; above 114 GiB the registered step's second nanoda attempt is stopped, so that the
# kernel's own killer never chooses for us and the community fresh replay survives. Lines in /results/extra/guard3.txt.
O=/results/extra/guard3.txt; i=0
anon() { awk '$1=="anon"{print $2}' /sys/fs/cgroup/memory.stat; }
rss() { ps -eo rss,args | awk -v p="$1" '$0 ~ p && !/awk/ {s+=$1} END{printf "%.1f", s/1048576}'; }
while true; do
  a=$(anon); g=$(( a / 1073741824 ))
  if [ $(( i % 4 )) = 0 ]; then echo "$(date -u +%H:%M:%S) anon ${g} GiB | registered nanoda $(rss 'nanoda_bin nanoda.json') | fresh $(rss 'leanchecker --fresh') | optional $(rss '/home/tester/x/')" >> $O; fi
  if [ "$g" -ge 100 ] && pgrep -f "/home/tester/x/(cmp|l4l|con-leche|bin|nanoda-gcmu)" > /dev/null; then
    echo "$(date -u +%H:%M:%S) anon ${g} GiB: the optional checks are stopped (optional $(rss '/home/tester/x/') GB)" >> $O
    touch /results/extra2/_stopped-by-guard3; pkill -KILL -f "pod-extra2-run"; pkill -KILL -f "/home/tester/x/(cmp|l4l|con-leche|bin|nanoda-gcmu)"; pkill -KILL -u tester -x lean4export; sleep 20
  elif [ "$g" -ge 114 ] && pgrep -f "nanoda_bin nanoda.json" > /dev/null; then
    echo "$(date -u +%H:%M:%S) anon ${g} GiB: the registered step's second nanoda attempt is stopped at $(rss 'nanoda_bin nanoda.json') GB" >> $O; pkill -KILL -x nanoda_bin; sleep 20
  fi
  i=$(( i + 1 )); sleep 15
done
