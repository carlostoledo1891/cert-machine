#!/bin/bash
# phase-b.sh: the registered order of Stage 1, one step per call, one process at a time. Each step's output is kept
# under corpus/qwen-self-rewriting/runs/stage1/logs/. Nothing here runs before the control room's "go".
# order: i1, i2, plan, run-py, run-js, controls-py, controls-js, record
# usage: bash instruments/qwen-self-rewriting/phase-b.sh battery|i1|i2|plan|run-py|run-js|controls-py|controls-js|record
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PYTHON="${PYTHON:-/usr/bin/python3}"
RUNS="$ROOT/corpus/qwen-self-rewriting/runs/stage1"
LOGS="$RUNS/logs"; mkdir -p "$LOGS"
PY="$PYTHON -I $ROOT/tools/qwen-stage1.py"; JS="node $ROOT/tools/qwen-stage1.js"
battery() {
  pmset -g batt
  if pmset -g batt | grep -q "Battery Power"; then
    pct=$(pmset -g batt | grep -o '[0-9]*%' | head -1 | tr -d '%')
    if [ "${pct:-100}" -le 25 ]; then echo "STOP: on battery at ${pct}%"; exit 1; fi
  fi
}
step() {
  name="$1"; shift
  echo "== $name $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOGS/$name.log"
  caffeinate -i "$@" 2>&1 | tee -a "$LOGS/$name.log"
  code=${PIPESTATUS[0]}
  echo "== $name exit $code $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOGS/$name.log"
  return $code
}
case "${1:-}" in
  battery) battery ;;
  i1) battery; step i1-py $PY i1 || exit 1; step i1-js $JS i1 || exit 1 ;;
  i2) step i2-py $PY i2 || exit 1; step i2-js $JS i2 || exit 1 ;;
  plan) step plan-py $PY plan || exit 1; step plan-js $JS plan || exit 1
        if cmp "$RUNS/py/ranges.tsv" "$RUNS/js/ranges.tsv"; then echo "the two range lists are equal: $(shasum -a 256 "$RUNS/py/ranges.tsv" | cut -c1-64)" | tee -a "$LOGS/plan-js.log"
        else echo "STOP: the two range lists differ" | tee -a "$LOGS/plan-js.log"; exit 1; fi ;;
  run-py) battery; step run-py $PY run ;;
  run-js) battery; step run-js $JS run ;;
  controls-py) battery; step controls-py $PY controls ;;
  controls-js) battery; step controls-js $JS controls ;;
  record) step record $PY record --deviations "$RUNS/deviations.json" ;;
  *) echo "usage: phase-b.sh battery|i1|i2|plan|run-py|run-js|controls-py|controls-js|record"; exit 2 ;;
esac
