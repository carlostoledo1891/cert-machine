#!/usr/bin/env python3
"""Create a Zenodo deposition, upload every file of a folder to its bucket, set the metadata, optionally publish.

usage: python3 -I tools/zenodo-deposit.py <folder> <metadata.json> [--publish]   (used 2026-11-05 for doi:10.5281/zenodo.23991348)
The token is read from ~/.config/cert-machine/zenodo.env (ZENODO_TOKEN=...) and never printed.
State (the deposition id) is kept in <folder>/../zenodo-deposit-state.json so a rerun resumes instead of creating twice."""
import json
import os
import sys
import urllib.request

API = "https://zenodo.org/api"
folder, meta_path = sys.argv[1], sys.argv[2]
PUBLISH = "--publish" in sys.argv
tok = None
for line in open(os.path.expanduser("~/.config/cert-machine/zenodo.env")):
    if line.startswith("ZENODO_TOKEN="):
        tok = line.split("=", 1)[1].strip().strip("'\"")
assert tok, "no ZENODO_TOKEN"
H = {"Authorization": "Bearer " + tok}
state_path = os.path.join(os.path.dirname(os.path.abspath(folder)), "zenodo-deposit-state.json")
state = json.load(open(state_path)) if os.path.exists(state_path) else {}


def call(method, url, body=None, headers=None, raw=None, length=None):
    h = dict(H, **(headers or {}))
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    if body is not None:
        h["Content-Type"] = "application/json"
    if length is not None:
        h["Content-Length"] = str(length)
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=3600) as r:
            t = r.read()
            return r.status, (json.loads(t) if t else {})
    except urllib.error.HTTPError as e:
        return e.code, {"error": e.read().decode(errors="replace")[:1500]}


if not state.get("id"):
    st, d = call("POST", API + "/deposit/depositions", body={})
    if st != 201:
        sys.exit("create refused: HTTP %d %s" % (st, d))
    state = {"id": d["id"], "bucket": d["links"]["bucket"], "html": d["links"]["html"]}
    json.dump(state, open(state_path, "w"), indent=1)
    print("created deposition", state["id"])
else:
    print("resuming deposition", state["id"])

st, d = call("GET", API + "/deposit/depositions/%d" % state["id"])
have = {f["filename"]: f for f in d.get("files", [])}
for name in sorted(os.listdir(folder)):
    p = os.path.join(folder, name)
    if not os.path.isfile(p) or name.startswith("."):
        continue
    size = os.path.getsize(p)
    if name in have and int(have[name].get("filesize", -1)) == size:
        print("already uploaded:", name)
        continue
    with open(p, "rb") as fh:
        st, r = call("PUT", state["bucket"] + "/" + name, raw=fh, length=size, headers={"Content-Type": "application/octet-stream"})
    if st not in (200, 201):
        sys.exit("upload of %s refused: HTTP %d %s" % (name, st, r))
    print("uploaded %s (%d bytes, md5 %s)" % (name, size, r.get("checksum")))

meta = json.load(open(meta_path))
st, r = call("PUT", API + "/deposit/depositions/%d" % state["id"], body={"metadata": meta})
if st != 200:
    sys.exit("metadata refused: HTTP %d %s" % (st, r))
print("metadata set; reserved DOI:", (r.get("metadata", {}).get("prereserve_doi") or {}).get("doi"))
if PUBLISH:
    st, r = call("POST", API + "/deposit/depositions/%d/actions/publish" % state["id"])
    if st != 202:
        sys.exit("publish refused: HTTP %d %s" % (st, r))
    state.update(doi=r.get("doi"), record=r.get("links", {}).get("record_html") or r.get("links", {}).get("html"), published=True)
    json.dump(state, open(state_path, "w"), indent=1)
    print("PUBLISHED doi:", r.get("doi"), state["record"])
