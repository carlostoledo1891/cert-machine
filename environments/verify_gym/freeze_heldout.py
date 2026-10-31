#!/usr/bin/env python3
"""freeze_heldout.py: write a held-out set ONCE and append its sha256 to curriculum.json. Refuses if that version
is already listed: a held-out set is frozen at its first write and never edited.

    python3 environments/verify_gym/freeze_heldout.py v0 40      40 tasks per family of the curriculum's families

Rows come from each family's "heldout" stream (indices 0, 1, 2, ...), skipping an instance already drawn, until
`per` distinct instances per family. The file holds the whole row, prompt included, so a later change to the
generator or the prompt template cannot move a frozen task (the battery also requires the template to render
each frozen prompt unchanged)."""
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from verify_gym.families import REGISTRY  # noqa: E402
from verify_gym.task import make_row  # noqa: E402

version, per = sys.argv[1], int(sys.argv[2])
cur_path = os.path.join(HERE, "verify_gym", "curriculum.json")
cur = json.load(open(cur_path))
if any(h["version"] == version for h in cur["heldout"]):
    sys.exit("REFUSED: held-out %s is already frozen" % version)
fams = [f["id"] for f in cur["families"]]
rows = []
for fam in fams:
    seen, i = set(), 0
    while len(seen) < per:
        r = make_row(fam, "heldout", i)
        i += 1
        if r["key"] in seen:
            continue
        seen.add(r["key"])
        rows.append(r)
name = "heldout-%s.json" % version
doc = {"what": "verify-gym held-out set %s: frozen at its first write, never edited, never trained on. Each row is a "
               "whole task (instance, stated bracket, cap, size limit, prompt). The training pool redraws any instance "
               "whose key is here." % version,
       "version": version, "per_family": per, "families": fams, "tasks": rows}
raw = (json.dumps(doc, indent=1, sort_keys=True, ensure_ascii=False) + "\n").encode("utf-8")
open(os.path.join(HERE, "verify_gym", name), "wb").write(raw)
digest = hashlib.sha256(raw).hexdigest()
cur["heldout"].append({"version": version, "file": name, "n": len(rows), "per_family": per, "families": fams,
                       "sha256": digest})
open(cur_path, "w").write(json.dumps(cur, indent=1, ensure_ascii=False) + "\n")
print("froze %s: %d tasks, sha256 %s" % (name, len(rows), digest))
