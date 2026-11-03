#!/usr/bin/env python3
"""seal-registry.py — append ONE digest to seals/registry.jsonl, or check the registry (stdlib only).
  python3 tools/seal-registry.py add <digest> --issue <n>     refuses anything but 64 lowercase hex; one line, then commit
  python3 tools/seal-registry.py --check                      every line is a digest line and no digest repeats
The maintainer commits the one line; that commit's date is the public anchor read by instruments/seal/seal.py."""
import json, os, re, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REG = os.path.join(ROOT, "seals", "registry.jsonl")
HEX = re.compile(r"[0-9a-f]{64}")

def lines():
    return [ln for ln in open(REG, encoding="utf-8").read().split("\n") if ln.strip()] if os.path.exists(REG) else []

def check():
    seen = set()
    for i, ln in enumerate(lines(), 1):
        try:
            row = json.loads(ln)
        except Exception:
            print("FAIL  line %d is not JSON" % i); return 1
        if set(row) != {"digest", "posted", "issue"} or not HEX.fullmatch(str(row["digest"])) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(row["posted"])) or not isinstance(row["issue"], int):
            print("FAIL  line %d is not a digest line" % i); return 1
        if row["digest"] in seen:
            print("FAIL  line %d repeats a digest" % i); return 1
        seen.add(row["digest"])
    print("PASS  seal registry: %d digest(s), every line a digest line" % len(seen)); return 0

if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["--check"]:
        sys.exit(check())
    if len(a) >= 2 and a[0] == "add":
        d = a[1]
        if not HEX.fullmatch(d):
            print(json.dumps({"verdict": "REFUSED", "reason": "not exactly 64 lowercase hex characters"})); sys.exit(2)
        if any(json.loads(ln)["digest"] == d for ln in lines()):
            print(json.dumps({"verdict": "REFUSED", "reason": "already registered"})); sys.exit(2)
        issue = int(a[a.index("--issue") + 1]) if "--issue" in a else 0
        with open(REG, "a", encoding="utf-8") as fh:
            fh.write(json.dumps({"digest": d, "posted": time.strftime("%Y-%m-%d", time.gmtime()), "issue": issue}) + "\n")
        print("appended; now: git add seals/registry.jsonl && git commit -m 'seal registry: one digest (issue %d)'" % issue); sys.exit(0)
    print(__doc__); sys.exit(2)
