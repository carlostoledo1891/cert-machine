#!/usr/bin/env bash
# push.sh — commit and push a part of Janela's record from the daily Action, guarded.
# apps/janela/audit · cert-machine · MIT
#
#   bash apps/janela/audit/push.sh "<commit message>" <path> [<path> ...]
#
# Stages the paths; nothing staged is a quiet success. Otherwise guard.js must pass
# (the ledger, the feed and the observations only grow), then commit, then pull --rebase
# and push, five tries. A rebase that does not apply is aborted and the step fails.
set -euo pipefail
msg="$1"; shift
git config user.name "janela-feed"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -- "$@"
if git diff --cached --quiet; then echo "push: nothing new under $*"; exit 0; fi
node apps/janela/audit/guard.js
git commit -q -m "$msg"
for i in 1 2 3 4 5; do
  if git pull --rebase --quiet; then
    git push --quiet && { echo "push: $(git rev-parse --short HEAD) — $msg"; exit 0; }
  else
    git rebase --abort 2>/dev/null || true
  fi
  sleep $((i * 15))
done
echo "push: FAILED after five tries" >&2
exit 1
