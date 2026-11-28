#!/usr/bin/env bash
# run.sh — the pod runner of Stage 3 of the audit of "Language Models Can Rewrite Their Own Weights" (arXiv 2611.21885
# v2): ONE GPU pod (H200 SXM, 141 GB), image vllm/vllm-openai:v0.33.0, under a hard cap of US$20 for the pod's whole life.
# Rules: notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md. It generates and records; it grades nothing
# (the desk grades: tools/qwen-stage3-record.py). The pod holds no credential of ours and pushes nothing anywhere: the
# desk pulls /results (served read-only on port 8000) with instruments/qwen-self-rewriting/stage3/pull.py.
#
# start command (entrypoint /bin/bash -c; the image has python3, no curl is assumed):
#   python3 -c "import urllib.request as u;u.urlretrieve('https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<AUDIT_SHA>/instruments/qwen-self-rewriting/stage3/run.sh','/run.sh')" && bash /run.sh
# env (all required but the last three):
#   AUDIT_SHA        the commit of this repository holding the Stage 3 files (they must be pushed before the pod)
#   PRICE_PER_HOUR   the hourly price read from the RunPod catalog at the create (e.g. 5.29); no default
#   POD_START_EPOCH  `date +%s` read on the desk just BEFORE the create call (env is fixed at the create, so the
#                    real start is unknown then; an earlier time only makes the deadline earlier)
#   ARMS             default "A B C" (the order is the pre-registration's; a later arm needs A complete)
#   CAP_USD          default 20: the hard cap in US$ for the pod's whole life (raised by the operator on 28 Nov)
#   PAIR_AB          default 1: at the probe, A continues only if A and then B both fit (A alone decides no claim)
#   SELF_DELETE      default 1: if the pod is still alive RESERVE_S after the deadline, it asks RunPod to delete
#                    itself with the pod's own key (kept in this shell only, never exported to a child)
#
# The arms (one answer per problem, the 490 problems of corpus/qwen-self-rewriting/stage3/draw-490.jsonl, each with
# its own seed, the same seed in every arm; thinking on; one vLLM engine configuration for all three):
#   A  the base, the paper's settings: T 0.6, top-p 0.95, top-k 20, min-p 0, presence 0, repetition 1.0, 16,384 tokens
#   B  the edited checkpoint (/w/edited, P2 passed), the same settings
#   C  the base, the model card's thinking-mode settings: T 1.0, top-p 0.95, top-k 20, min-p 0, presence 1.5,
#      repetition 1.0, 32,768 tokens (the card's 81,920 for competition maths, capped by the money)
# The stop rule (project.py): every arm stops at DEADLINE = POD_START + 20 / PRICE h - 900 s; the probe 600 s into A
# decides whether A continues; B and C start only if their projection ends before DEADLINE. An arm that does not start or
# does not finish leaves arm/not-run.json or an incomplete meta.json, and its rows are REFUSED on resources.
set -uo pipefail
_KEY="${RUNPOD_API_KEY:-}"; _POD="${RUNPOD_POD_ID:-}"
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}" "${PRICE_PER_HOUR:?}" "${POD_START_EPOCH:?}"
ARMS="${ARMS:-A B C}"; export CAP_USD="${CAP_USD:-20}"; PAIR_AB="${PAIR_AB:-1}"; SELF_DELETE="${SELF_DELETE:-1}"
export AUDIT_SHA PYTHONUNBUFFERED=1 HF_HUB_DISABLE_TELEMETRY=1 VLLM_NO_USAGE_STATS=1 DO_NOT_TRACK=1
CODE_URL="${CODE_URL:-https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA}"; export CODE_URL
R=/results; W=/w; C=$W/code; STATE=$R/_state.json; STOP=$W/STOP; PORT=8001; SRV=http://127.0.0.1:$PORT
mkdir -p $R $W $C
PHASE="starting"; DONE=""
log() { echo "$(date -u +%FT%TZ) $*" >> $R/_phase.log; }
status() { PHASE="$1"; python3 -c "
import json,sys,time
json.dump({'phase':sys.argv[1],'done':sys.argv[2],'audit':sys.argv[3],'arms':sys.argv[4],'price':float(sys.argv[5]),
 'pod_start':int(sys.argv[6]),'updated':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())},open('$R/_status.json.tmp','w'))
" "$1" "$DONE" "$AUDIT_SHA" "$ARMS" "$PRICE_PER_HOUR" "$POD_START_EPOCH" && mv $R/_status.json.tmp $R/_status.json; log "phase: $1"; }
status starting
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)

# --- setup (P1 the base at its pins, MV, P2 the edit); setup.sh is fetched at the same commit
python3 -c "import urllib.request as u,sys; u.urlretrieve(sys.argv[1], sys.argv[2])" "$CODE_URL/instruments/qwen-self-rewriting/stage3/setup.sh" $W/setup.sh || { status "FAILED: fetch setup.sh"; sleep infinity; }
status "setup"
bash $W/setup.sh > $R/_setup.out 2>&1
tail -1 $R/_setup.out | grep -q "SETUP-OK" || { status "FAILED: setup (see _setup.out); no arm runs"; sleep infinity; }
cmp -s /run.sh $C/run.sh 2>/dev/null && log "this runner equals run.sh at $AUDIT_SHA" || log "NOTE: this runner differs from run.sh at $AUDIT_SHA"

python3 $C/state.py init --state $STATE --price "$PRICE_PER_HOUR" --start "$POD_START_EPOCH" --pair "$PAIR_AB" > /dev/null
DEADLINE=$(python3 -c "import json; print(int(json.load(open('$STATE'))['deadline']))")
log "deadline $(date -u -d @$DEADLINE +%FT%TZ) (price $PRICE_PER_HOUR/h, start $POD_START_EPOCH, cap US\$${CAP_USD:-20}, reserve 900 s)"

# --- the watchdog: the index for pulls every 60 s; at DEADLINE everything stops; RESERVE_S later, the pod deletes itself
SERVER_PID=""
watchdog() {
  while true; do
    python3 $C/state.py index --root $R 2>/dev/null
    now=$(date +%s)
    if [ $now -ge $DEADLINE ] && [ ! -e $W/CAPPED ]; then
      touch $STOP $W/CAPPED; log "DEADLINE reached: stop file written, the server is stopped"
      pkill -TERM -f "[v]llm serve" 2>/dev/null; sleep 20; pkill -KILL -f "[v]llm serve" 2>/dev/null
      python3 $C/state.py index --root $R 2>/dev/null
    fi
    if [ "$SELF_DELETE" = 1 ] && [ $now -ge $((DEADLINE + 900 - 60)) ]; then
      log "the pod is still alive at the reserve's end: asking RunPod to delete it"
      python3 $C/state.py index --root $R 2>/dev/null
      if [ -n "$_KEY" ] && [ -n "$_POD" ]; then
        python3 -c "
import urllib.request,sys
r=urllib.request.Request('https://rest.runpod.io/v1/pods/'+sys.argv[1],method='DELETE',headers={'Authorization':'Bearer '+sys.argv[2]})
print(urllib.request.urlopen(r,timeout=30).status)" "$_POD" "$_KEY" >> $R/_phase.log 2>&1 || log "self-delete refused or failed"
      else log "no pod key or id in the environment: the desk must delete the pod"; fi
      sleep 600
    fi
    sleep 60
  done
}
watchdog &

# --- the engine: one configuration for every arm, only the weights' directory changes
EXTRA_FILE=$W/serve_extra
serve() {   # $1 model dir, $2 log
  local dir=$1 lg=$2 t0=$(date +%s)
  local base_args=(--served-model-name qwen --host 127.0.0.1 --port $PORT --dtype bfloat16 --max-model-len 34816
                   --gpu-memory-utilization 0.92 --max-num-seqs 256 --seed 0 --generation-config vllm)
  local tries=("mm0" "plain"); [ -s $EXTRA_FILE ] && tries=("$(cat $EXTRA_FILE)")
  for t in "${tries[@]}"; do
    local extra=(); [ "$t" = "mm0" ] && extra=(--limit-mm-per-prompt '{"image":0,"video":0}')
    log "serve $dir ($t)"
    setsid vllm serve "$dir" "${base_args[@]}" "${extra[@]}" > "$lg" 2>&1 < /dev/null &
    SERVER_PID=$!
    while [ $(( $(date +%s) - t0 )) -lt 2400 ] && kill -0 $SERVER_PID 2>/dev/null && [ ! -e $STOP ]; do
      if python3 -c "import urllib.request as u; u.urlopen('$SRV/health', timeout=5)" 2>/dev/null; then
        echo "$t" > $EXTRA_FILE; echo "vllm serve $dir ${base_args[*]} ${extra[*]}" >> $R/_serve_args.txt
        SERVE_S=$(( $(date +%s) - t0 )); log "server up in $SERVE_S s ($t)"; return 0
      fi
      sleep 10
    done
    stop_server
    [ -e $STOP ] && return 1
    log "server did not come up with ($t)"; [ "$t" = "mm0" ] && log "DEVIATION candidate: retrying without --limit-mm-per-prompt"
  done
  return 1
}
stop_server() {
  [ -n "$SERVER_PID" ] && kill -TERM -- -$SERVER_PID 2>/dev/null; pkill -TERM -f "[v]llm serve" 2>/dev/null
  for i in $(seq 1 30); do pgrep -f "[v]llm serve" > /dev/null || break; sleep 4; done
  pkill -KILL -f "[v]llm serve" 2>/dev/null
  for i in $(seq 1 30); do
    used=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits | head -1)
    [ "${used:-99999}" -lt 2000 ] && break; sleep 4
  done
  SERVER_PID=""
}

settings() { case "$1" in
  A|B) echo '{"max_tokens":16384,"temperature":0.6,"top_p":0.95,"top_k":20,"min_p":0.0,"presence_penalty":0.0,"repetition_penalty":1.0}' ;;
  C)   echo '{"max_tokens":32768,"temperature":1.0,"top_p":0.95,"top_k":20,"min_p":0.0,"presence_penalty":1.5,"repetition_penalty":1.0}' ;;
  esac; }
weights() { case "$1" in A|C) echo /w/base ;; B) echo /w/edited ;; esac; }
not_run() { mkdir -p $R/$1; python3 -c "
import json,sys,time; json.dump({'arm':sys.argv[1],'not_run':True,'why':sys.argv[2],'utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())},open(sys.argv[3],'w'),indent=1)
" "$1" "$2" "$R/$1/not-run.json"; log "arm $1 NOT RUN: $2"; }

A_OK=0
for arm in $ARMS; do
  if [ -e $STOP ]; then not_run $arm "the stage was stopped (deadline or probe) before this arm"; continue; fi
  if [ "$arm" != A ]; then
    [ $A_OK = 1 ] || { not_run $arm "arm A is not complete"; continue; }
    dec=$(python3 $C/project.py decide --arm $arm --state $STATE); echo "$dec" > $R/_decide-$arm.json; log "decide $arm: $dec"
    echo "$dec" | python3 -c "import json,sys; sys.exit(0 if json.load(sys.stdin)['start'] else 1)" || { not_run $arm "the projection does not end before the deadline: $dec"; continue; }
  fi
  status "arm $arm: starting the server"
  mkdir -p $R/$arm
  T0=$(date +%s)
  serve "$(weights $arm)" $R/$arm/_server.log || { not_run $arm "the server did not start"; stop_server; [ $arm = A ] && break; continue; }
  python3 $C/client.py --fingerprint --server $SRV --out $R/$arm/fingerprint.json >> $R/$arm/_client.log 2>&1
  status "arm $arm: generating"
  python3 $C/client.py --server $SRV --model-dir "$(weights $arm)" --draw $C/draw-490.jsonl --arm $arm \
    --sampling "$(settings $arm)" --out $R/$arm --deadline $DEADLINE --stop-file $STOP >> $R/$arm/_client.log 2>&1 &
  CPID=$!
  if [ $arm = A ]; then
    for i in $(seq 1 200); do [ -s $R/A/meta.json ] && break; sleep 3; done
    while kill -0 $CPID 2>/dev/null; do
      t_start=$(python3 -c "import json; print(int(json.load(open('$R/A/meta.json'))['t_start']))" 2>/dev/null || echo 0)
      [ $t_start -gt 0 ] && [ $(( $(date +%s) - t_start )) -ge 630 ] && break
      sleep 10
    done
    if kill -0 $CPID 2>/dev/null; then
      python3 $C/state.py probe --state $STATE --arm-dir $R/A > /dev/null
      pr=$(python3 $C/project.py probe --state $STATE); echo "$pr" > $R/_probe.json; log "probe: $pr"
      echo "$pr" | python3 -c "import json,sys; sys.exit(0 if json.load(sys.stdin)['continue'] else 1)" || { touch $STOP; log "the probe stops the stage"; }
    fi
  fi
  wait $CPID; rc=$?
  stop_server
  python3 $C/state.py done --state $STATE --arm $arm --arm-dir $R/$arm --restart "${SERVE_S:-600}" > /dev/null
  if [ $rc = 0 ]; then DONE="$DONE $arm"; [ $arm = A ] && A_OK=1; status "arm $arm: finished"
  else log "arm $arm incomplete (client exit $rc)"; status "arm $arm: incomplete"; fi
  ( [ -d $W/mvlib ] && PYTHONNOUSERSITE=1 python3 $C/mv_grade.py $W/mvlib $C/draw-490.jsonl $R/$arm/responses.jsonl $R/$arm/mv.jsonl > $R/$arm/_mv.log 2>&1 ) &
done
wait_mv=0; while pgrep -f "[m]v_grade.py" > /dev/null && [ $wait_mv -lt 90 ] && [ $(date +%s) -lt $DEADLINE ]; do sleep 10; wait_mv=$((wait_mv + 1)); done
python3 $C/state.py index --root $R
(cd $R && find . -type f ! -name '_SEAL.sha256' ! -name '_index.json*' ! -name '_status.json*' -print0 | sort -z | xargs -0 sha256sum > _SEAL.sha256)
status "complete"
log "complete: done${DONE:- none}; the desk pulls, then deletes the pod"
sleep infinity
