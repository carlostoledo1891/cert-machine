#!/bin/zsh
# battery-guard.sh — keeps a long run alive on a laptop that loses its charger. While any process matching PATTERN runs,
# every 20 s: on battery at or below LIMIT% it SIGSTOPs them all (the runner and its workers); back on AC it SIGCONTs
# them. A stopped run draws almost nothing and loses nothing; a machine that dies loses the whole run, because a runner
# like tools/run-hseva-atlas.js holds every finished unit in memory until it writes the ledger at the end.
# Written 2026-09-28, when the atlas re-run lost its charger twice on a fanless M2 with a 30 W adapter.
# usage: setopt NO_BG_NICE; (nohup tools/battery-guard.sh [pattern] [limit] > guard.log 2>&1 &)
#        pattern defaults to tools/run-hseva-atlas.js, limit to 20
PATTERN=${1:-tools/run-hseva-atlas.js}; LIMIT=${2:-20}; paused=0
while pgrep -f "$PATTERN" > /dev/null; do
  b=$(pmset -g batt); pct=$(echo "$b" | grep -o '[0-9]*%' | head -1 | tr -d '%'); src=$(echo "$b" | head -1)
  if [[ "$src" == *"Battery Power"* && $pct -le $LIMIT && $paused -eq 0 ]]; then
    pkill -STOP -f "$PATTERN"; paused=1; echo "$(date '+%H:%M:%S') PAUSED on battery at ${pct}%"
  elif [[ "$src" == *"AC Power"* && $paused -eq 1 ]]; then
    pkill -CONT -f "$PATTERN"; paused=0; echo "$(date '+%H:%M:%S') RESUMED on AC at ${pct}%"
  fi
  sleep 20
done
echo "$(date '+%H:%M:%S') the run is over; guard exits"
