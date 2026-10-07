#!/usr/bin/env bash
# janela-watchdog.sh — the SECOND trigger of Janela's daily run, from the desk, for the day GitHub's
# schedule drops it. tools/ · cert-machine · MIT
#
#   bash tools/janela-watchdog.sh            check once: dispatch janela-feed.yml if no run of it has
#                                            started today (UTC) and it is past 10:05 UTC; else do nothing
#   bash tools/janela-watchdog.sh install    a launchd agent that checks at minute 7 of every hour
#   bash tools/janela-watchdog.sh uninstall  remove it
#
# WHY (2026-10-07): the workflow's cron (09:40 and 11:40 UTC) fired neither time on its first scheduled
# day, with no GitHub incident open, while schedules in the operator's other repositories ran; the day was
# dispatched by hand at 12:17 UTC and the 06 and 12 UTC targets of both providers were lost (a row needs its
# target an hour ahead). GitHub documents that scheduled runs may be delayed or dropped under load, so the
# workflow now carries five cron slots (every step is safe to repeat) and this watchdog asks from outside.
#
# It uses the gh login already on this machine (no new token, no new service). launchd runs a missed
# calendar job when the Mac wakes, so a sleeping desk still checks as soon as it opens. It only ever
# dispatches the repository's own workflow, once a day at most: a run started today ends it.
set -euo pipefail
REPO=carlostoledo1891/cert-machine
LABEL=co.carlostoledo.janela-watchdog
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/janela-watchdog.log"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

case "${1:-check}" in
  install)
    mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$(cd "$(dirname "$0")" && pwd)/janela-watchdog.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Minute</key><integer>7</integer></dict>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict></plist>
EOF
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    echo "janela watchdog: installed ($PLIST), checks at minute 7 of every hour; log $LOG"
    ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "janela watchdog: removed"
    ;;
  check)
    [ "$(date -u +%H%M)" -lt 1005 ] && exit 0
    today=$(date -u +%F)
    n=$(gh run list -R "$REPO" --workflow=janela-feed.yml --limit 20 --json createdAt \
          --jq "[.[] | select(.createdAt >= \"${today}T00:00:00Z\")] | length")
    [ "$n" -gt 0 ] && exit 0
    gh workflow run janela-feed.yml -R "$REPO" --ref main
    echo "$(date -u +%FT%TZ) janela watchdog: no run of janela-feed today — dispatched one"
    ;;
  *) echo "usage: $0 [check|install|uninstall]" >&2; exit 2 ;;
esac
