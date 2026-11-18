#!/bin/bash
# deadman.sh — the pod deletes itself at 21:15 UTC on 2026-11-18 if the desk has not deleted it first (the cap: delete by
# 21:30 UTC). It uses the pod-scoped key RunPod itself puts in the container; nothing was copied onto the pod for this.
export RUNPOD_API_KEY=$(tr "\0" "\n" < /proc/1/environ | sed -n "s/^RUNPOD_API_KEY=//p")
ID=$(tr "\0" "\n" < /proc/1/environ | sed -n "s/^RUNPOD_POD_ID=//p")
T=$(date -u -d "2026-11-18T21:15:00Z" +%s)
while [ "$(date +%s)" -lt "$T" ]; do sleep 30; done
echo "$(date -u +%FT%TZ) deadman: removing pod $ID" >> /results/_deadman.txt
runpodctl remove pod "$ID" >> /results/_deadman.txt 2>&1
