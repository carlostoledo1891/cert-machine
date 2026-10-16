#!/usr/bin/env bash
# pu-push.sh — commit and push PU Verificado's daily feed from the Action, with an allowlist.
# tools/ · cert-machine · MIT
#
#   bash tools/pu-push.sh "<commit message>"
#
# Stages ONLY the paths a feed day may change — the pinned CSV, PINS.json, the feed log, the ledger,
# the report page and its synced copies — and refuses the push if anything else is modified in the
# tree, so a feed run can never carry an unrelated edit onto main. Then commit, pull --rebase, push,
# five tries (the Janela pattern, apps/janela/audit/push.sh).
set -euo pipefail
msg="$1"
git config user.name "pu-feed"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
ALLOW=(corpus/pu/sources/precotaxatesourodireto.csv corpus/pu/PINS.json corpus/pu/feed-log.json certs/pu-ledger.json reports/pu-verificado.html site/reports/pu-verificado.html site/reports/index.html site/certs/pu-ledger.json)
changed=$(git status --porcelain --untracked-files=no | awk '{print $2}')
for f in $changed; do
  ok=0; for a in "${ALLOW[@]}"; do [ "$f" = "$a" ] && ok=1; done
  if [ $ok = 0 ]; then echo "pu-push: REFUSED — $f changed and is not a feed path" >&2; git status --short >&2; exit 1; fi
done
git add -- "${ALLOW[@]}" 2>/dev/null || true
if git diff --cached --quiet; then echo "pu-push: nothing to commit"; exit 0; fi
git commit -q -m "$msg"
for i in 1 2 3 4 5; do
  if git pull --rebase --quiet; then
    git push --quiet && { echo "pu-push: $(git rev-parse --short HEAD) — $msg"; exit 0; }
  else
    git rebase --abort 2>/dev/null || true
  fi
  sleep $((i * 15))
done
echo "pu-push: FAILED after five tries" >&2
exit 1
