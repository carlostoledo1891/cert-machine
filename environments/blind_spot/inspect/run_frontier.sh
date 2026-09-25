#!/bin/sh
# The frontier campaign on blind-spot under Inspect: three rung variants × a budget
# ladder × three models, every log into inspect/logs/ where the ledger reads it.
#   sh environments/blind_spot/inspect/run_frontier.sh
# Spends money. Never called by a battery. Auth: the OAuth profile as
# ANTHROPIC_AUTH_TOKEN (Inspect sends it as a Bearer with the oauth beta).
set -u
cd "$(dirname "$0")/../../.." || exit 1
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-$(ant auth print-credentials --access-token)}"
I=environments/blind_spot/.venv/bin/inspect
T=environments/blind_spot/inspect/task.py
LOGS=environments/blind_spot/inspect/logs
COMMON="--log-format json --log-dir $LOGS --display plain --max-tokens 12000 --max-connections 4 --max-retries 3 --no-fail-on-error"
run() { # model effort-or-none tag
  m=$1; e=$2; tag=$3
  if [ "$e" = "none" ]; then EF=""; else EF="--effort $e"; fi
  echo "== $m effort=$e"
  $I eval "$T@blind_spot_located" "$T@blind_spot_profile" "$T@blind_spot_blind" --model "$m" $EF $COMMON --tags "frontier,$tag" 2>&1 | grep -E "^==|reward|mean|tokens|Error|error|Log:" | head -40
}
run anthropic/claude-sonnet-5 low sonnet-low
run anthropic/claude-sonnet-5 medium sonnet-medium
run anthropic/claude-sonnet-5 high sonnet-high
run anthropic/claude-opus-5 low opus-low
run anthropic/claude-haiku-4-5-20251001 none haiku
echo "CAMPAIGN DONE"
