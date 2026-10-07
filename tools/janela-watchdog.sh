#!/usr/bin/env bash
# janela-watchdog.sh — the SECOND trigger of Janela's daily run, from the desk, for the day GitHub's
# schedule drops it. tools/ · cert-machine · MIT
#
#   bash tools/janela-watchdog.sh            check once: dispatch janela-feed.yml if it is past 09:05 UTC,
#                                            main carries no "Janela feed <today>:" commit yet, and no run of
#                                            the workflow is queued or running; else do nothing
#   bash tools/janela-watchdog.sh install    a launchd agent that checks at minute 7 of every hour
#   bash tools/janela-watchdog.sh uninstall  remove it
#
# WHY (2026-10-07): the workflow's cron (09:40, 11:40, then 14:23 UTC) fired not once on its first day,
# with no GitHub incident open. The operator's other repositories show why: their weekly crons run 8–9 HOURS
# late (aether-os '0 10 * * 1' ran 18:57 UTC; mfg-monorepo '17 6 * * 1' ran 14:41) — GitHub documents
# that scheduled runs may be delayed or dropped under load. The day was dispatched by hand at 12:17 UTC and
# the 06 and 12 UTC targets of both providers were lost (a row needs its target an hour ahead). So the
# scheduler is a late fallback here, and this watchdog is the punctual trigger: hourly from 09:05 UTC (ECMWF's
# 168 h ensemble lands ~08:55), until the day's feed is on main — a failed run is retried the next hour.
#
# It uses the gh login already on this machine (no new token, no new service). launchd runs a missed
# calendar job when the Mac wakes, so a sleeping desk still checks as soon as it opens. It only ever
# dispatches the repository's own workflow, never twice at once, and stops for the day when the feed is on main.
set -euo pipefail
REPO=carlostoledo1891/cert-machine
LABEL=co.carlostoledo.janela-watchdog
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/janela-watchdog.log"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
# a desk that just woke may not have its network yet: three tries, 20 s apart, before an hour is given up
retry() { local k; for k in 1 2 3; do "$@" && return 0; [ "$k" -lt 3 ] && sleep 20; done; return 1; }

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
    [ "$(date -u +%H%M)" -lt 905 ] && exit 0
    today=$(date -u +%F)
    # the day is done when the feed's commit is on main
    done=$(retry gh api "repos/$REPO/commits?sha=main&since=${today}T00:00:00Z&per_page=100" \
             --jq "[.[] | select(.commit.message | startswith(\"Janela feed ${today}:\"))] | length")
    [ "$done" -gt 0 ] && exit 0
    # nothing before today's ECMWF 00 UTC wave ensemble is complete (the workflow's gate asks the same)
    ymd=$(date -u +%Y%m%d)
    code=$(curl -s -4 --retry 3 --retry-delay 20 --retry-all-errors -o /dev/null -w '%{http_code}' "https://storage.googleapis.com/ecmwf-open-data/${ymd}/00z/ifs/0p25/waef/${ymd}000000-168h-waef-ef.index" || true)
    [ "$code" = "200" ] || exit 0
    # never a second run while one is queued or running
    busy=$(retry gh run list -R "$REPO" --workflow=janela-feed.yml --limit 10 --json status \
             --jq '[.[] | select(.status != "completed")] | length')
    [ "$busy" -gt 0 ] && exit 0
    retry gh workflow run janela-feed.yml -R "$REPO" --ref main
    echo "$(date -u +%FT%TZ) janela watchdog: no Janela feed on main for ${today} — dispatched janela-feed"
    ;;
  *) echo "usage: $0 [check|install|uninstall]" >&2; exit 2 ;;
esac
