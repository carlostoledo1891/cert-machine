#!/usr/bin/env python3
"""mock_hub.py: a local stand-in for the hub, for the dry run only. It serves the fixture the way the deciders expect
the real hub to answer: an API listing per commit, /resolve/ redirecting large files to another host name with the
X-Repo-Commit, X-Linked-Etag and X-Linked-Size headers, small files through a relative redirect, and byte ranges with
206 and Content-Range. It can cut a response short, to exercise the retries. It records the request headers it saw.

usage: python3 -I mock_hub.py <fixture_dir> <port> [--cut-every N] [--no-lfs-in-api]
MIT"""
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DIR, PORT = sys.argv[1], int(sys.argv[2])
CUT = int(sys.argv[sys.argv.index("--cut-every") + 1]) if "--cut-every" in sys.argv else 0
NO_LFS = "--no-lfs-in-api" in sys.argv
HUB = json.load(open(os.path.join(DIR, "hub.json")))
STATE = {"ranged": 0}


class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def _send(self, status, headers, body=b"", cut=False):
        self.send_response(status)
        for k, v in headers.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body[:len(body) // 2] if cut else body)
        self.close_connection = True

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        with open(os.path.join(DIR, "requests.log"), "a") as f:
            f.write(json.dumps({"method": self.command, "path": self.path.split("?")[0], "headers": sorted(k.lower() for k in self.headers.keys()),
                                "user_agent": self.headers.get("User-Agent"), "host": self.headers.get("Host")}) + "\n")
        path, _, query = self.path.partition("?")
        repo = HUB["repo"]
        m = re.fullmatch(r"/api/models/%s/revision/([0-9a-f]{40})" % re.escape(repo), path)
        if m:
            c = m.group(1)
            if c not in HUB["commits"] or "blobs=true" not in query:
                return self._send(404, {}, b"{}")
            sib = [{"rfilename": k, "blobId": v, "size": os.path.getsize(os.path.join(DIR, k))} for k, v in HUB["small"].items()]
            if c not in HUB["no_shards_at"]:
                for k, v in sorted(HUB["lfs"].items()):
                    s = {"rfilename": k, "blobId": "0" * 40, "size": v["size"]}
                    if not NO_LFS:
                        s["lfs"] = {"sha256": v["sha256"], "size": v["size"], "pointerSize": 135}
                    sib.append(s)
            return self._send(200, {"Content-Type": "application/json"}, json.dumps({"sha": c, "siblings": sib}).encode())
        m = re.fullmatch(r"/%s/resolve/([^/]+)/(.+)" % re.escape(repo), path)
        if m:
            c, f = m.group(1), m.group(2)
            if c not in HUB["commits"] or (f in HUB["lfs"] and c in HUB["no_shards_at"]) or (f not in HUB["lfs"] and f not in HUB["small"]):
                return self._send(404, {}, b"not found")
            if f in HUB["lfs"]:
                v = HUB["lfs"][f]
                return self._send(302, {"Location": "http://localhost:%d/blob/%s?sig=dry-run" % (PORT, f), "X-Repo-Commit": c, "X-Linked-Etag": '"%s"' % v["sha256"],
                                        "X-Linked-Size": str(v["size"]), "ETag": '"%s"' % v["sha256"], "Accept-Ranges": "bytes"})
            return self._send(307, {"Location": "/api/resolve-cache/models/%s/%s/%s" % (repo, c, f), "X-Repo-Commit": c, "ETag": '"%s"' % HUB["small"][f]})
        m = re.fullmatch(r"/api/resolve-cache/models/%s/([0-9a-f]{40})/(.+)" % re.escape(repo), path)
        if m and m.group(2) in HUB["small"]:
            return self._send(200, {"X-Repo-Commit": m.group(1)}, open(os.path.join(DIR, m.group(2)), "rb").read())
        m = re.fullmatch(r"/blob/(.+)", path)
        if m and m.group(1) in HUB["lfs"]:
            data = open(os.path.join(DIR, m.group(1)), "rb").read()
            rng = self.headers.get("Range")
            if not rng:
                return self._send(200, {"Accept-Ranges": "bytes"}, data)
            a, b = (int(x) for x in re.fullmatch(r"bytes=(\d+)-(\d+)", rng).groups())
            if a > b or b >= len(data):
                return self._send(416, {"Content-Range": "bytes */%d" % len(data)})
            STATE["ranged"] += 1
            cut = bool(CUT) and STATE["ranged"] % CUT == 0 and b - a > 64
            return self._send(206, {"Content-Range": "bytes %d-%d/%d" % (a, b, len(data))}, data[a:b + 1], cut=cut)
        return self._send(404, {}, b"not found")


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
