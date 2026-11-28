#!/usr/bin/env python3
"""pull.py: the desk's copy of a Stage 3 pod's /results (served read-only on port 8000 through RunPod's proxy).
It reads /_index.json (path, bytes, sha256 of every file, rewritten by the pod every 60 s), fetches every file whose
local copy differs, and keeps a file only if its bytes hash to the index (a file that grew since the index was written
is fetched again next round). Python standard library only.
usage: python3 pull.py POD_ID OUTDIR [--every SECONDS]      (--every: repeat until the pod's phase is "complete" or
                                                              the pod stops answering)
MIT"""
import hashlib
import json
import os
import sys
import time
import urllib.request


def get(base, rel, timeout=600):
    # RunPod's proxy answers Python's default User-Agent with 403 (seen 2026-11-28, amendment S3-A2); a plain one passes
    req = urllib.request.Request(base + rel, headers={"User-Agent": "cert-machine-pull/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def once(pod, out):
    base = "https://%s-8000.proxy.runpod.net/" % pod
    idx = json.loads(get(base, "_index.json", 60))
    got, kept, stale = 0, 0, 0
    for f in idx["files"]:
        dst = os.path.join(out, f["path"])
        if os.path.exists(dst) and hashlib.sha256(open(dst, "rb").read()).hexdigest() == f["sha256"]:
            kept += 1
            continue
        b = get(base, urllib.request.quote(f["path"]))
        if hashlib.sha256(b).hexdigest() != f["sha256"]:
            stale += 1
            continue
        os.makedirs(os.path.dirname(dst) or ".", exist_ok=True)
        with open(dst + ".tmp", "wb") as fo:
            fo.write(b)
        os.replace(dst + ".tmp", dst)
        got += 1
    st = json.loads(get(base, "_status.json", 60))
    with open(os.path.join(out, "_status.json"), "w") as fo:
        json.dump(st, fo, indent=1)
    with open(os.path.join(out, "_index.json"), "w") as fo:
        json.dump(idx, fo, indent=1)
    print(time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "index", idx["utc"], "fetched", got, "unchanged", kept,
          "stale", stale, "phase:", st.get("phase"), flush=True)
    return st.get("phase"), stale


def main():
    a = sys.argv[1:]
    if len(a) < 2 or not a[0].isalnum():
        sys.exit(__doc__)
    pod, out = a[0], a[1]
    every = int(a[a.index("--every") + 1]) if "--every" in a else 0
    os.makedirs(out, exist_ok=True)
    while True:
        try:
            phase, stale = once(pod, out)
        except Exception as e:  # noqa: BLE001
            print("pull failed:", str(e)[:200], flush=True)
            phase, stale = None, 1
            if not every:
                sys.exit(1)
        if not every or (phase == "complete" and stale == 0):
            break
        time.sleep(every)


if __name__ == "__main__":
    main()
