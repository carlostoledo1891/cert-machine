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
#
# THE BUILD'S OWN STAMP (2026-10-17). tools/build-site.js writes "@ git <hash>" into the hub pages (the landing, Method,
# apps, oracle, papers), and in the Action HEAD is never the commit those pages were built at — so the first real feed
# day would have refused on five pages it did not change. A file outside the allowlist whose every changed line is the
# same line with a different hex hash (7–40 digits) is restored, and said so; any other change still refuses.
# PU_PUSH_DRY=1 stops before the commit (the local test).
set -euo pipefail
msg="$1"
if [ -z "${PU_PUSH_DRY:-}" ]; then
  git config user.name "pu-feed"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
fi
ALLOW=(corpus/pu/sources/precotaxatesourodireto.csv corpus/pu/PINS.json corpus/pu/feed-log.json certs/pu-ledger.json reports/pu-verificado.html site/reports/pu-verificado.html site/reports/index.html site/certs/pu-ledger.json)
stamp_only() {   # every removed line equals an added line once the hex hashes are masked
  local d minus plus
  d=$(git diff -U0 -- "$1" | grep -E '^[-+]' | grep -vE '^(\+\+\+|---) ' || true)
  minus=$(printf '%s\n' "$d" | grep '^-' | cut -c2- | sed -E 's/[0-9a-f]{7,40}/#/g' | sort || true)
  plus=$(printf '%s\n' "$d" | grep '^+' | cut -c2- | sed -E 's/[0-9a-f]{7,40}/#/g' | sort || true)
  [ -n "$minus" ] && [ "$minus" = "$plus" ]
}
changed=$(git status --porcelain --untracked-files=no | awk '{print $2}')
for f in $changed; do
  ok=0; for a in "${ALLOW[@]}"; do [ "$f" = "$a" ] && ok=1; done
  if [ $ok = 0 ] && stamp_only "$f"; then git checkout -- "$f"; echo "pu-push: restored $f (only the build's git stamp moved)"; continue; fi
  if [ $ok = 0 ]; then echo "pu-push: REFUSED — $f changed and is not a feed path" >&2; git status --short >&2; exit 1; fi
done
if [ -n "${PU_PUSH_DRY:-}" ]; then echo "pu-push: DRY — would stage:"; git status --short -- "${ALLOW[@]}"; exit 0; fi
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
