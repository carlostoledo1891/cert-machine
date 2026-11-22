#!/usr/bin/env python3
"""stage1.py: the Python decider of Stage 1 of the audit of "Language Models Can Rewrite Their Own Weights"
(arXiv 2611.21885 v2), public files only. Rules: notes/qwen-self-rewriting-preregistration-2026-11-22.md.

Python standard library only (http.client, hashlib, fractions, collections). It shares no code with
tools/qwen-stage1.js, the JavaScript decider that re-derives every value below. It reads the public checkpoint
Qwen/Qwen3.5-27B at one pinned commit by anonymous HTTPS range requests, one at a time; it never reads `main`.
Every number is a dyadic rational computed on integers from bit patterns; there is no floating-point accumulation.

usage (entry point tools/qwen-stage1.py):
  offline    K6, K7 and the unit tests; no network
  i1         I1: the API listing and bytes 0-7 of each shard; the stage stops if it fails
  i2         I2: the LFS sha256 of each shard at each listed commit (COMPUTED)
  plan       config, index and the 11 headers; the header rows; the list of ranges
  run        shard 11 hashed whole, then one range per tensor; the weight, edit and arithmetic rows
  controls   K1-K5
options: --claims F --pins F --runs DIR --root DIR
MIT"""
import hashlib
import http.client
import io
import json
import math
import os
import re
import struct
import subprocess
import sys
import tarfile
import time
import urllib.parse
from collections import Counter
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
ME, OTHER = "py", "js"
DT_BYTES = {"BF16": 2, "F16": 2, "F32": 4, "F64": 8, "I8": 1, "U8": 1, "BOOL": 1, "I16": 2, "U16": 2, "I32": 4, "U32": 4, "I64": 8, "U64": 8}
FMT = {"BF16": (8, 7), "F16": (5, 10), "F32": (8, 23), "F64": (11, 52)}  # exponent bits, fraction bits
PACK = {2: "H", 4: "I", 8: "Q"}
READINGS = ["abs_over_lower", "abs_over_mean2", "signed_over_lower", "signed_over_mean2"]


class Stop(Exception):
    """the stage stops; the message says why"""


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=True)
        f.write("\n")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------- exact numbers
def qs(x):
    x = Fraction(x)
    return "%d/%d" % (x.numerator, x.denominator)


def pow10(e):
    return Fraction(10) ** e


def sci(x, digits=12):
    """[lower, upper]: two decimals with `digits` significant digits that enclose the rational x (equal iff exact)"""
    x = Fraction(x)
    if x == 0:
        return ["0", "0"]
    neg = x < 0
    a = -x if neg else x
    e = len(str(a.numerator)) - len(str(a.denominator))
    while pow10(e) > a:
        e -= 1
    while pow10(e + 1) <= a:
        e += 1
    s = a / pow10(e - digits + 1)
    lo = s.numerator // s.denominator
    hi = lo if s.denominator == 1 else lo + 1

    def f(m, ee):
        if m == 10 ** digits:
            m //= 10
            ee += 1
        t = str(m)
        return t[0] + "." + t[1:] + "e" + str(ee)
    return ["-" + f(hi, e), "-" + f(lo, e)] if neg else [f(lo, e), f(hi, e)]


def sci_sqrt(X, digits=12):
    """[lower, upper] decimals enclosing sqrt(X), X a rational >= 0"""
    X = Fraction(X)
    if X == 0:
        return ["0", "0"]
    k = digits + 3
    while True:
        y = X * pow10(2 * k)
        r = math.isqrt(y.numerator // y.denominator)
        if r >= 10 ** (digits + 2):
            break
        k += 5
    exact = Fraction(r * r) == y
    return [sci(Fraction(r) / pow10(k), digits)[0], sci(Fraction(r if exact else r + 1) / pow10(k), digits)[1]]


def parse_dec(s):
    """a printed decimal -> (value, unit of its last printed digit)"""
    t = s.strip().lstrip("+")
    nd = len(t.split(".")[1]) if "." in t else 0
    return Fraction(t), Fraction(1, 10 ** nd)


def band(x, printed):
    d, u = parse_dec(printed)
    diff = abs(Fraction(x) - d)
    return "MATCH" if diff <= u / 2 else ("NEAR" if diff <= u else "FAR")


def band_sqrt(X, printed):
    """the band of sqrt(X) against a printed number, decided on the squares"""
    d, u = parse_dec(printed)
    X = Fraction(X)

    def inside(w):
        lo, hi = d - w, d + w
        return (lo <= 0 or X >= lo * lo) and hi >= 0 and X <= hi * hi
    return "MATCH" if inside(u / 2) else ("NEAR" if inside(u) else "FAR")


def decode(bits, fmt):
    """a bit pattern as an exact rational; None for infinity or NaN"""
    ew, fw = FMT[fmt]
    e = (bits >> fw) & ((1 << ew) - 1)
    f = bits & ((1 << fw) - 1)
    bias = (1 << (ew - 1)) - 1
    if e == (1 << ew) - 1:
        return None
    v = Fraction(f, 1 << (bias - 1 + fw)) if e == 0 else Fraction((1 << fw) | f, 1 << fw) * Fraction(2) ** (e - bias)
    return -v if bits >> (ew + fw) else v


def encode(x, fmt):
    """round a rational to the format, to nearest, ties to even; overflow gives the infinity pattern"""
    ew, fw = FMT[fmt]
    bias = (1 << (ew - 1)) - 1
    x = Fraction(x)
    sign = (1 if x < 0 else 0) << (ew + fw)
    a = abs(x)
    if a == 0:
        return 0
    e = a.numerator.bit_length() - a.denominator.bit_length()
    if Fraction(2) ** e > a:
        e -= 1
    e = max(e, 1 - bias)
    n = round(a / Fraction(2) ** (e - fw))  # Fraction rounds half to even
    if n == 1 << (fw + 1):
        e += 1
        n = 1 << fw
    if e > bias:
        return sign | (((1 << ew) - 1) << fw)
    if n < 1 << fw:
        return sign | n
    return sign | ((e + bias) << fw) | (n - (1 << fw))


def nearest_ok(t, bits, fmt):
    """an independent test that `bits` is t rounded to nearest, ties to even: no neighbour is closer, and on a tie the
    last fraction bit is 0. It does not call encode."""
    ew, fw = FMT[fmt]
    top = ((1 << ew) - 1) << fw
    mag = bits & ((1 << (ew + fw)) - 1)
    if mag >= top:
        return False
    neg = bits >> (ew + fw)
    v = decode(bits, fmt)
    t = Fraction(t)
    if neg and v == 0 and t > 0:
        return False
    d = abs(v - t)
    limit = Fraction(2) ** ((1 << (ew - 1)))  # the value the infinity pattern stands for when rounding
    for m2 in (mag - 1, mag + 1):
        if m2 < 0:
            w = -decode(1, fmt) if not neg else decode(1, fmt)  # across zero: the smallest value of the other sign
        elif m2 >= top:
            w = -limit if neg else limit
        else:
            w = decode(m2, fmt)
            w = -w if neg else w
        d2 = abs(w - t)
        if d2 < d or (d2 == d and (mag & 1)):
            return False
    return True


def units(p):
    """|value| of a bf16 pattern in units of 2^-133 (an integer); the pattern must be finite"""
    e = (p >> 7) & 0xFF
    f = p & 0x7F
    return f if e == 0 else (0x80 | f) << (e - 1)


U133 = 1 << 133


# ---------------------------------------------------------------- bf16 tensors by census
def census(buf):
    """the count of each 16-bit pattern (65,536 integers)"""
    if sys.byteorder != "little":
        raise Stop("this decider needs a little-endian host")
    c = Counter(memoryview(buf).cast("H"))
    counts = [0] * 65536
    for k, v in c.items():
        counts[k] = v
    return counts


def census_sha(counts):
    return sha256("".join("%04x:%d\n" % (p, c) for p, c in enumerate(counts) if c).encode("ascii"))


def magnitudes(counts):
    return [counts[p] + counts[p | 0x8000] for p in range(0x8000)]


def order_stat(mag, k):
    acc = 0
    for p in range(0x8000):
        acc += mag[p]
        if acc > k:
            return p
    raise Stop("order statistic out of range")


def matrix_stats(counts):
    mag = magnitudes(counts)
    n = sum(mag)
    nonfinite = sum(mag[0x7F80:])
    out = {"n": n, "nonfinite": nonfinite}
    if nonfinite or n == 0:
        return out, mag
    max_abs = max(p for p in range(0x7F80) if mag[p])
    pos = [p for p in range(0x7F80) if counts[p]]
    max_signed = max(pos) if pos else min(p for p in range(0x8000, 0xFF80) if counts[p])
    lo, hi = order_stat(mag, (n - 1) // 2), order_stat(mag, n // 2)
    num_abs = Fraction(units(max_abs))
    num_signed = Fraction(units(max_signed & 0x7FFF)) * (-1 if max_signed & 0x8000 else 1)
    den_lower = Fraction(units(lo))
    den_mean2 = Fraction(units(lo) + units(hi), 2)
    ratio = {"abs_over_lower": num_abs / den_lower if den_lower > 0 else Fraction(0),
             "abs_over_mean2": num_abs / den_mean2 if den_mean2 > 0 else Fraction(0),
             "signed_over_lower": num_signed / den_lower if den_lower > 0 else Fraction(0),
             "signed_over_mean2": num_signed / den_mean2 if den_mean2 > 0 else Fraction(0)}
    out.update({"max_abs_bits": "%04x" % max_abs, "max_signed_bits": "%04x" % max_signed, "median_lower_bits": "%04x" % lo,
                "median_upper_bits": "%04x" % hi, "median_lower_is_zero": den_lower == 0,
                "ratio": {k: qs(v) for k, v in ratio.items()}, "ratio_abs_over_lower_dec": sci(ratio["abs_over_lower"], 9)})
    return out, mag


def sums(counts):
    """n, the sum and the sum of squares of a bf16 tensor, in units of 2^-133 and 2^-266"""
    n = s = q = 0
    for p in range(0x8000):
        a, b = counts[p], counts[p | 0x8000]
        if a or b:
            u = units(p)
            n += a + b
            s += (a - b) * u
            q += (a + b) * u * u
    return n, s, q


# ---------------------------------------------------------------- the paper's text (K7)
def norm_text(s):
    s = s.replace("\\texttt", "").replace("\\sigma", "σ").replace("\\_", "_").replace("\\%", "%")
    s = s.replace("$", "").replace("{", "").replace("}", "").replace("~", " ")
    s = s.replace("--", "-").replace("–", "-").replace("−", "-")
    return " ".join(s.split())


def tex_files(ctx):
    p = ctx.pins["paper"]["tex"]
    raw = open(os.path.join(ctx.root, p["path"]), "rb").read()
    if len(raw) != p["bytes"] or sha256(raw) != p["sha256"]:
        raise Stop("the TeX archive does not match its pin")
    out = {}
    with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as tf:
        for m in tf.getmembers():
            if m.isfile() and m.name.endswith(".tex"):
                out[m.name.lstrip("./")] = tf.extractfile(m).read().decode("utf-8")
    return out


def check_quotes(ctx, alter=None):
    """every quoted sentence searched in the pinned TeX. alter = (row, index, from, to) plants a misquote."""
    files = tex_files(ctx)
    res = {"quotes": 0, "found": 0, "at_stated_lines": 0, "missing": [], "found_off_the_stated_lines": []}
    seen = set()
    for row in ctx.claims["rows"]:
        for i, q in enumerate(row.get("quotes", [])):
            text = q["text"]
            if alter and alter[0] == row["id"] and alter[1] == i:
                if alter[2] not in text:
                    raise Stop("the planted misquote does not apply")
                text = text.replace(alter[2], alter[3])
            key = (text, q["file"], tuple(q["lines"]))
            if key in seen:
                continue
            seen.add(key)
            res["quotes"] += 1
            src = files.get(q["file"])
            needle = norm_text(text)
            where = {"row": row["id"], "text": text, "file": q["file"], "lines": q["lines"]}
            if src is None or needle not in norm_text(src):
                res["missing"].append(where)
                continue
            res["found"] += 1
            lines = src.split("\n")
            if needle in norm_text("\n".join(lines[q["lines"][0] - 1:q["lines"][1]])):
                res["at_stated_lines"] += 1
            else:
                res["found_off_the_stated_lines"].append(where)
    res["all_found"] = not res["missing"]
    return res


def require_quotes(ctx, alter=None):
    r = check_quotes(ctx, alter)
    if not r["all_found"]:
        raise Stop("K7: a quoted sentence is not in the pinned TeX: " + json.dumps(r["missing"]))
    return r


# ---------------------------------------------------------------- the network
class Net:
    def __init__(self, ctx, logname="ranges.jsonl"):
        self.ctx = ctx
        self.log = os.path.join(ctx.out, logname)
        os.makedirs(ctx.out, exist_ok=True)
        self.allow_http = bool(ctx.pins.get("fixture"))
        self.ua = ctx.pins["requests"]["user_agent"]
        self.retries = int(ctx.pins["requests"]["retries_per_range"])
        self.pause = float(ctx.pins["requests"].get("pause_seconds", 5))
        self.seq = 0
        self.total = 0
        self.hub = urllib.parse.urlsplit(ctx.base).netloc

    def _write(self, rec):
        with open(self.log, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, sort_keys=True) + "\n")

    def _once(self, url, first, last, sink, method):
        hops = []
        cur = url
        for _ in range(6):
            u = urllib.parse.urlsplit(cur)
            if u.scheme == "https":
                conn = http.client.HTTPSConnection(u.netloc, timeout=90)
            elif u.scheme == "http" and self.allow_http:
                conn = http.client.HTTPConnection(u.netloc, timeout=90)
            else:
                raise Stop("scheme refused: " + cur.split("?")[0])
            try:
                hdr = {"User-Agent": self.ua, "Accept": "*/*", "Accept-Encoding": "identity"}
                if first is not None:
                    hdr["Range"] = "bytes=%d-%d" % (first, last)
                conn.request(method, u.path + ("?" + u.query if u.query else ""), headers=hdr)
                r = conn.getresponse()
                h = {k.lower(): v for k, v in r.getheaders()}
                hops.append({"host": u.netloc, "status": r.status, "commit": h.get("x-repo-commit"), "linked_etag": h.get("x-linked-etag"),
                             "linked_size": h.get("x-linked-size"), "etag": h.get("etag"), "content_range": h.get("content-range")})
                if method == "HEAD":  # like the hub's own client: follow a redirect only while it stays on the same host
                    loc = h.get("location")
                    if r.status in (301, 302, 303, 307, 308) and loc and urllib.parse.urlsplit(urllib.parse.urljoin(cur, loc)).netloc == u.netloc:
                        cur = urllib.parse.urljoin(cur, loc)
                        continue
                    return hops, b"", 0, None
                if r.status in (301, 302, 303, 307, 308):
                    r.read()
                    if not h.get("location"):
                        raise IOError("a redirect without a location")
                    cur = urllib.parse.urljoin(cur, h["location"])
                    continue
                if first is not None:
                    if r.status != 206:
                        raise HttpStatus(r.status)
                    m = re.fullmatch(r"bytes (\d+)-(\d+)/(\d+|\*)", h.get("content-range", ""))
                    if not m or int(m.group(1)) != first or int(m.group(2)) != last:
                        raise IOError("content-range %r for bytes %d-%d" % (h.get("content-range"), first, last))
                    want = last - first + 1
                else:
                    if r.status != 200:
                        raise HttpStatus(r.status)
                    want = int(h["content-length"]) if "content-length" in h else None
                hs = hashlib.sha256()
                got = 0
                if sink is not None:
                    while True:
                        chunk = r.read(1 << 22)
                        if not chunk:
                            break
                        hs.update(chunk)
                        sink(got, chunk)
                        got += len(chunk)
                    body = None
                elif want is not None:
                    body = bytearray(want)
                    mv = memoryview(body)
                    while got < want:
                        k = r.readinto(mv[got:got + (1 << 22)])
                        if not k:
                            break
                        got += k
                    hs.update(body)
                else:
                    body = r.read()
                    got = len(body)
                    hs.update(body)
                if want is not None and got != want:
                    raise IOError("short read: %d of %d bytes" % (got, want))
                return hops, body, got, hs.hexdigest()
            finally:
                conn.close()
        raise IOError("too many redirects")

    def get(self, url, first=None, last=None, kind="", name="", sink_factory=None, method="GET", shard=None, soft=False):
        """one request with at most `retries` retries; logs it; checks the commit and LFS hash the server reports"""
        if "/main/" in url or url.endswith("/main"):
            raise Stop("a URL names main")
        attempt = 0
        while True:
            attempt += 1
            t0 = time.time()
            sink = sink_factory() if sink_factory else None
            try:
                hops, body, got, digest = self._once(url, first, last, sink, method)
                break
            except Stop:
                raise
            except Exception as e:  # noqa: a failed range is retried, then the stage stops
                err = "%s: %s" % (type(e).__name__, e)
                self._write({"kind": kind, "name": name, "url": url, "first": first, "last": last, "attempt": attempt, "error": err, "time_utc": now()})
                transient = not isinstance(e, HttpStatus) or e.status in (408, 429, 500, 502, 503, 504)
                if soft and not transient:
                    return None, {"error": err}, None
                if attempt > self.retries or not transient:
                    raise Stop("request failed (%s %s %s): %s" % (kind, name, url, err))
                time.sleep(self.pause * attempt)
        rep = {}  # what the hub itself reports: the last response from the hub's host that carries each header
        for h in hops:
            if h["host"] == self.hub:
                rep.update({k: h[k] for k in ("commit", "linked_etag", "linked_size", "etag") if h[k]})
        etag = rep.get("linked_etag")
        self.seq += 1
        self.total += got
        rec = {"n": self.seq, "kind": kind, "name": name, "method": method, "url": url, "first": first if first is not None else (0 if got else None),
               "last": last if last is not None else (got - 1 if got else None), "length": got, "sha256": digest, "time_utc": now(),
               "seconds": round(time.time() - t0, 3), "status": hops[-1]["status"], "hosts": [h["host"] for h in hops],
               "commit": rep.get("commit"), "lfs_sha256": etag.replace("W/", "").strip('"') if etag else None,
               "linked_size": int(rep["linked_size"]) if rep.get("linked_size") else None, "etag": rep.get("etag"), "attempts": attempt}
        self._write(rec)
        if method == "GET" and rec["commit"] is not None and rec["commit"] != self.ctx.commit and "/resolve/" + self.ctx.commit + "/" in url:
            raise Stop("the server reports commit %s for %s" % (rec["commit"], url))
        if shard is not None:
            if rec["lfs_sha256"] is not None and rec["lfs_sha256"] != shard["lfs_sha256"]:
                raise Stop("the server reports LFS sha256 %s for %s" % (rec["lfs_sha256"], shard["file"]))
            if rec["linked_size"] is not None and rec["linked_size"] != shard["bytes"]:
                raise Stop("the server reports size %s for %s" % (rec["linked_size"], shard["file"]))
        return body, rec, sink


class HttpStatus(Exception):
    def __init__(self, status):
        Exception.__init__(self, "HTTP status %d" % status)
        self.status = status


class Ctx:
    def __init__(self, argv):
        opt = {"claims": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "claims.json"),
               "pins": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "PINS.json"),
               "runs": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "runs", "stage1"), "root": ROOT}
        self.cmd = argv[0] if argv else "help"
        rest = argv[1:]
        while rest:
            k = rest.pop(0)
            if not k.startswith("--") or k[2:] not in opt or not rest:
                raise Stop("unknown option " + k)
            opt[k[2:]] = rest.pop(0)
        self.root = opt["root"]
        self.claims = load(opt["claims"])
        self.pins = load(opt["pins"])
        self.claims_sha = sha256(open(opt["claims"], "rb").read())
        self.pins_sha = sha256(open(opt["pins"], "rb").read())
        self.out = os.path.join(opt["runs"], ME)
        self.other = os.path.join(opt["runs"], OTHER)
        m = self.pins["model"]
        self.commit = m["commit"]
        if not re.fullmatch(r"[0-9a-f]{40}", self.commit):
            raise Stop("the pinned commit is not a full hash")
        self.base = m["base_url"].rstrip("/")
        if not (self.base == "https://huggingface.co" or self.pins.get("fixture")):
            raise Stop("base URL refused")
        self.repo = m["repo"]
        self.shards = m["shards"]
        self.row = {r["id"]: r for r in self.claims["rows"]}
        self.names = self.claims["names"]

    def resolve(self, file, commit=None):
        return "%s/%s/resolve/%s/%s" % (self.base, self.repo, commit or self.commit, file)

    def api(self, commit):
        if not re.fullmatch(r"[0-9a-f]{40}", commit):
            raise Stop("not a full commit hash")
        return "%s/api/models/%s/revision/%s?blobs=true" % (self.base, self.repo, commit)

    def meta(self):
        return {"decider": "instruments/qwen-self-rewriting/stage1.py", "python": sys.version.split()[0], "claims_sha256": self.claims_sha,
                "pins_sha256": self.pins_sha, "code_sha256": sha256(open(os.path.abspath(__file__), "rb").read()), "written_utc": now()}


def battery_guard():
    try:
        t = subprocess.run(["pmset", "-g", "batt"], capture_output=True, text=True, timeout=10).stdout
    except Exception:  # noqa: no pmset, no guard
        return
    m = re.search(r"(\d+)%", t)
    if "Battery Power" in t and m and int(m.group(1)) <= 25:
        raise Stop("on battery at %s%%: stopped" % m.group(1))


# ---------------------------------------------------------------- I1, I2
def listing(net, ctx, commit, kind):
    """the API listing of one commit: {available, sha, files: {name: {size, sha256}}}"""
    body, rec, _ = net.get(ctx.api(commit), kind=kind, name=commit, soft=True)
    if body is None:
        return {"available": False, "why": rec["error"]}
    try:
        j = json.loads(bytes(body).decode("utf-8"))
        files = {}
        for s in j["siblings"]:
            lfs = s.get("lfs") or {}
            files[s["rfilename"]] = {"size": lfs.get("size", s.get("size")), "sha256": lfs.get("sha256"), "git_blob": s.get("blobId")}
        return {"available": True, "sha": j.get("sha"), "files": files, "body_sha256": rec["sha256"]}
    except Exception as e:  # noqa: an unreadable listing is reported as not available
        return {"available": False, "why": "unreadable: %s" % type(e).__name__, "body_sha256": rec["sha256"]}


def cmd_i1(ctx):
    require_quotes(ctx)
    net = Net(ctx)
    api = listing(net, ctx, ctx.commit, "api-listing")
    rows, bad = [], []
    if api["available"] and api["sha"] != ctx.commit:
        bad.append("the API listing reports commit %s" % api["sha"])
    for sh in ctx.shards:
        body, rec, _ = net.get(ctx.resolve(sh["file"]), 0, 7, kind="len8", name=sh["file"])
        n = int.from_bytes(bytes(body), "little")
        r = {"file": sh["file"], "len8_hex": bytes(body).hex(), "header_bytes": n, "pinned": {"bytes": sh["bytes"], "lfs_sha256": sh["lfs_sha256"]},
             "resolve": {"commit": rec["commit"], "lfs_sha256": rec["lfs_sha256"], "size": rec["linked_size"]}, "api": None}
        if rec["commit"] is not None and rec["commit"] != ctx.commit:
            bad.append("%s: resolve reports commit %s" % (sh["file"], rec["commit"]))
        if rec["lfs_sha256"] is not None and rec["lfs_sha256"] != sh["lfs_sha256"]:
            bad.append("%s: resolve reports LFS sha256 %s" % (sh["file"], rec["lfs_sha256"]))
        if rec["linked_size"] is not None and rec["linked_size"] != sh["bytes"]:
            bad.append("%s: resolve reports size %s" % (sh["file"], rec["linked_size"]))
        got_resolve = rec["lfs_sha256"] is not None and rec["linked_size"] is not None
        got_api = False
        if api["available"]:
            a = api["files"].get(sh["file"])
            r["api"] = a
            if a is None:
                bad.append("%s: absent from the API listing" % sh["file"])
            else:
                if a["sha256"] is not None and a["sha256"] != sh["lfs_sha256"]:
                    bad.append("%s: the API listing reports LFS sha256 %s" % (sh["file"], a["sha256"]))
                if a["size"] is not None and a["size"] != sh["bytes"]:
                    bad.append("%s: the API listing reports size %s" % (sh["file"], a["size"]))
                got_api = a["sha256"] is not None and a["size"] is not None
        r["reported_by"] = [k for k, v in (("resolve", got_resolve), ("api", got_api)) if v]
        if not r["reported_by"]:
            bad.append("%s: no source reports both its size and its LFS sha256" % sh["file"])
        if not (0 < n < sh["bytes"] - 8):
            bad.append("%s: header length %d" % (sh["file"], n))
        rows.append(r)
    out = {"meta": ctx.meta(), "row": "I1", "passed": not bad, "failures": bad, "commit": ctx.commit,
           "rule": "I1 passes iff, for each shard, at least one of the two sources (the resolve response at the pinned commit; the API listing of that commit) reports its size and its LFS sha256, and no source reports a commit, a size or a hash other than the pinned one",
           "api_listing": {k: api.get(k) for k in ("available", "sha", "body_sha256", "why")}, "shards": rows, "bytes_read": net.total}
    dump(os.path.join(ctx.out, "i1.json"), out)
    print("I1 %s (%d shards; %d bytes read)" % ("PASSED" if not bad else "FAILED: " + "; ".join(bad), len(rows), net.total))
    if bad:
        raise Stop("I1 failed")


def cmd_i2(ctx):
    net = Net(ctx)
    names = [s["file"] for s in ctx.shards]
    pin = {s["file"]: s["lfs_sha256"] for s in ctx.shards}
    per, other_weights = [], {}
    for c in ctx.pins["model"]["commits"]["ids"]:
        li = listing(net, ctx, c, "api-listing-i2")
        row = {"commit": c, "source": "api", "lfs_sha256": {}}
        if li["available"] and all(v["sha256"] is None for k, v in li["files"].items() if k in names) and any(k in names for k in li["files"]):
            li = {"available": False}
        if li["available"]:
            for k in names:
                row["lfs_sha256"][k] = li["files"][k]["sha256"] if k in li["files"] else None
            for k, v in li["files"].items():
                if k.endswith(".safetensors") and k not in names:
                    other_weights.setdefault(k, {})[c] = v["sha256"]
        else:
            row["source"] = "resolve-head"
            for k in names:
                _, rec, _ = net.get(ctx.resolve(k, c), kind="head-i2", name=c[:12] + ":" + k, method="HEAD")
                row["lfs_sha256"][k] = rec["lfs_sha256"] if rec["status"] in (200, 301, 302, 303, 307, 308) else None
        per.append(row)
    distinct = {k: sorted({r["lfs_sha256"][k] for r in per if r["lfs_sha256"][k]}) for k in names}
    values = {"commits": len(per), "per_commit": per, "distinct_per_shard": distinct,
              "commits_with_all_11_shards": sum(1 for r in per if all(r["lfs_sha256"][k] for k in names)),
              "commits_with_no_shard": [r["commit"] for r in per if not any(r["lfs_sha256"][k] for k in names)],
              "commits_with_some_shards": [r["commit"] for r in per if any(r["lfs_sha256"][k] for k in names) and not all(r["lfs_sha256"][k] for k in names)],
              "every_listed_hash_equals_the_pin": all(v in ([], [pin[k]]) for k, v in distinct.items()),
              "other_safetensors_files": other_weights}
    dump(os.path.join(ctx.out, "i2.json"), {"meta": ctx.meta(), "row": "I2", "verdict": "COMPUTED", "values": values, "bytes_read": net.total})
    print("I2 COMPUTED: %d commits; every listed hash equals the pin: %s; %d bytes read" % (len(per), values["every_listed_hash_equals_the_pin"], net.total))


# ---------------------------------------------------------------- headers
def numel(shape):
    n = 1
    for s in shape:
        n *= s
    return n


def tensors_of(headers, header_bytes):
    """every tensor of the 11 headers, with its absolute byte range in its shard"""
    out = []
    for file in sorted(headers):
        H = headers[file]
        for name, d in H.items():
            if name == "__metadata__":
                continue
            a, b = d["data_offsets"]
            start = 8 + header_bytes[file]
            out.append({"name": name, "file": file, "dtype": d["dtype"], "shape": list(d["shape"]), "entries": numel(d["shape"]), "length": b - a,
                        "first": start + a, "last": start + b - 1})
    return out


def length_failures(T):
    return sorted(t["name"] for t in T if DT_BYTES.get(t["dtype"], 0) * t["entries"] != t["length"])


def layer_of(name, prefix):
    if not name.startswith(prefix):
        return None
    i, _, tail = name[len(prefix):].partition(".")
    return (int(i), tail) if i.isdigit() else None


def row_s3(T):
    by = {}
    for t in T:
        d = by.setdefault(t["dtype"], {"tensors": 0, "entries": 0})
        d["tensors"] += 1
        d["entries"] += t["entries"]
    non = sorted(({"name": t["name"], "dtype": t["dtype"], "shape": t["shape"], "entries": t["entries"]} for t in T if t["dtype"] != "BF16"), key=lambda x: x["name"])
    return {"verdict": "CERTIFIED" if not non else "REFUTED", "values": {"tensors": len(T), "by_dtype": by, "not_bf16": non, "not_bf16_count": len(non),
                                                                           "not_bf16_entries": sum(x["entries"] for x in non)}}


def row_e1(T, linear_layers, names, expected):
    pre = names["layer_prefix"]
    per, tensors = [], []
    for i in linear_layers:
        found = sorted(t["name"] for t in T if t["name"].startswith("%s%d." % (pre, i)) and names["linear_marker"] in t["name"] and names["bias_word"] in t["name"])
        per.append({"layer": i, "bias_tensors": found})
        want = "%s%d.%s" % (pre, i, names["time_step_bias_suffix"])
        if want in found:
            tensors.append(want)
    none = [p["layer"] for p in per if not p["bias_tensors"]]
    many = [p["layer"] for p in per if len(p["bias_tensors"]) > 1]
    one_named = all(p["bias_tensors"] == ["%s%d.%s" % (pre, p["layer"], names["time_step_bias_suffix"])] for p in per)
    if none:
        v = "REFUTED"
    elif many:
        v = "REFUSED"
    else:
        v = "CERTIFIED" if one_named and len(per) == expected else "REFUSED"
    return {"verdict": v, "values": {"linear_attention_layers": len(per), "per_layer": per, "tensors": tensors, "count": len(tensors),
                                      "layers_with_none": none, "layers_with_more_than_one": many}}


def header_rows(cfg, T, ctx):
    names, P = ctx.names, {k: v.get("params", {}) for k, v in ctx.row.items()}
    pre = names["layer_prefix"]
    byname = {t["name"]: t for t in T}
    rows = {}
    tc = cfg.get("text_config", {})
    lt = tc.get("layer_types") or []
    cfg_linear = [i for i, x in enumerate(lt) if x == "linear_attention"]
    cfg_full = [i for i, x in enumerate(lt) if x == "full_attention"]
    lay = {}
    for t in T:
        lo = layer_of(t["name"], pre)
        if lo:
            lay.setdefault(lo[0], []).append(t)
    hdr_layers = sorted(lay)
    hdr_linear = sorted(i for i, ts in lay.items() if any(names["linear_marker"] in t["name"] for t in ts))
    hdr_full = sorted(i for i, ts in lay.items() if any(names["full_marker"] in t["name"] for t in ts))
    # S1
    p = P["S1"]
    w0, w1 = p["window"]
    in_window = [i for i in hdr_linear if w0 <= i <= w1 and i in cfg_linear]
    checks = [["config.json: num_hidden_layers is %d" % p["layers"], tc.get("num_hidden_layers") == p["layers"]],
              ["config.json: layer_types has %d entries" % p["layers"], len(lt) == p["layers"]],
              ["headers: the layers are 0 to %d and no other" % (p["layers"] - 1), hdr_layers == list(range(p["layers"]))],
              ["config.json: %d linear-attention layers" % p["linear_layers"], len(cfg_linear) == p["linear_layers"]],
              ["headers: the layers with tensors under .linear_attn. are config's linear-attention layers", hdr_linear == cfg_linear],
              ["layer 62 is a linear-attention layer in both", all(i in cfg_linear and i in hdr_linear for i in p["must_be_linear"])],
              ["at least %d linear-attention layers lie in %d-%d" % (p["window_min"], w0, w1), len(in_window) >= p["window_min"]]]
    rows["S1"] = {"verdict": "CERTIFIED" if all(c[1] for c in checks) else "REFUTED",
                  "values": {"config": {"num_hidden_layers": tc.get("num_hidden_layers"), "layer_types_entries": len(lt), "linear_attention": cfg_linear, "full_attention": cfg_full},
                             "headers": {"layers": len(hdr_layers), "with_linear_attn": hdr_linear, "with_self_attn": hdr_full,
                                         "self_attn_layers_equal_config_full_attention": hdr_full == cfg_full},
                             "linear_attention_in_window": in_window, "checks": [{"text": c[0], "holds": c[1]} for c in checks],
                             "failed": [c[0] for c in checks if not c[1]]}}
    # S2
    p = P["S2"]
    t = byname.get(names["layer30_matrix"])
    if t is None:
        rows["S2"] = {"verdict": "REFUTED", "values": {"tensor": names["layer30_matrix"], "present": False}}
    else:
        two = len(t["shape"]) == 2
        ok = two and t["shape"][0] >= p["rows_needed"] and p["rows"] * t["shape"][1] == p["weights"]
        rows["S2"] = {"verdict": "CERTIFIED" if ok else "REFUTED",
                      "values": {"tensor": t["name"], "present": True, "shard": t["file"], "shape": t["shape"], "dtype": t["dtype"], "entries": t["entries"],
                                 "two_axes": two, "rows_times_columns": p["rows"] * t["shape"][1] if two else None, "rows_needed": p["rows_needed"]}}
    # S3
    rows["S3"] = row_s3(T)
    # S4
    p = P["S4"]
    chosen = []
    for i in p["mlp_layers"]:
        n = "%s%d.%s" % (pre, i, names["output_matrix_suffixes"]["mlp"])
        if n in byname:
            chosen.append(n)
    hidden = tc.get("hidden_size")
    cands, too_many = [], False
    for i in range(p["linear_window"][0], p["linear_window"][1] + 1):
        if i not in hdr_linear:
            continue
        c = sorted(t["name"] for t in lay[i] if names["linear_marker"] in t["name"] and len(t["shape"]) == 2 and t["shape"][0] == hidden)
        cands.append({"layer": i, "candidates": c})
        too_many = too_many or len(c) > 1
        n = "%s%d.%s" % (pre, i, names["output_matrix_suffixes"]["linear"])
        if n in byname:
            chosen.append(n)
    N = sum(byname[n]["entries"] for n in chosen)
    v = "REFUSED" if too_many else ("CERTIFIED" if len(chosen) == p["expected"] else "REFUTED")
    rows["S4"] = {"verdict": v, "values": {"count": len(chosen), "entries": N, "tensors": [{"name": n, "shape": byname[n]["shape"], "entries": byname[n]["entries"]} for n in chosen],
                                            "candidates_rule": "a tensor under .linear_attn. with two axes whose first axis is config's hidden_size (%s)" % hidden,
                                            "linear_layers_in_window": cands}}
    # S5
    groups = {g: {"tensors": 0, "entries": 0} for g in P["S5"]["groups"] + ["other"]}
    for t in T:
        g = next((g for g in P["S5"]["groups"] if t["name"].startswith(g)), "other")
        groups[g]["tensors"] += 1
        groups[g]["entries"] += t["entries"]
    rows["S5"] = {"verdict": "COMPUTED", "values": {"tensors": len(T), "entries": sum(t["entries"] for t in T), "by_group": groups,
                                                     "bytes_of_tensor_data": sum(t["length"] for t in T)}}
    # E1, E2
    rows["E1"] = row_e1(T, hdr_linear, names, P["E1"]["expected"])
    e2 = [{"name": n, "shard": byname[n]["file"], "first_byte": byname[n]["first"], "last_byte": byname[n]["last"], "dtype": byname[n]["dtype"],
           "shape": byname[n]["shape"], "entries": byname[n]["entries"]} for n in rows["E1"]["values"]["tensors"]]
    rows["E2"] = {"verdict": "COMPUTED", "values": {"tensors": e2, "count": len(e2), "entries": sum(x["entries"] for x in e2),
                                                     "dtypes": sorted({x["dtype"] for x in e2})}}
    # the output matrices
    outm = []
    for i in hdr_layers:
        for kind in ("mlp", "linear", "full"):
            n = "%s%d.%s" % (pre, i, names["output_matrix_suffixes"][kind])
            if n in byname:
                outm.append({"name": n, "layer": i, "kind": kind})
    return rows, outm


def cmd_plan(ctx):
    require_quotes(ctx)
    i1 = load(os.path.join(ctx.out, "i1.json"))
    if not i1["passed"] or i1["commit"] != ctx.commit:
        raise Stop("I1 has not passed")
    net = Net(ctx)
    whole = {}
    for f in ctx.pins["model"]["files_whole"]:
        body, rec, _ = net.get(ctx.resolve(f["file"]), kind="file", name=f["file"])
        b = bytes(body)
        blob = hashlib.sha1(b"blob %d\0" % len(b) + b).hexdigest()
        whole[f["file"]] = {"bytes": len(b), "sha256": rec["sha256"], "git_blob": blob, "matches_pin": len(b) == f["bytes"] and rec["sha256"] == f["sha256_of_fetched_copy"] and blob == f["git_blob"]}
        if not whole[f["file"]]["matches_pin"]:
            raise Stop("%s at the pinned commit is not the pinned file" % f["file"])
        whole[f["file"]]["_body"] = b
    cfg = json.loads(whole["config.json"]["_body"].decode("utf-8"))
    index = json.loads(whole["model.safetensors.index.json"]["_body"].decode("utf-8"))
    headers, hbytes, hsha = {}, {}, {}
    try:
        for s in i1["shards"]:
            sh = next(x for x in ctx.shards if x["file"] == s["file"])
            n = s["header_bytes"]
            body, rec, _ = net.get(ctx.resolve(sh["file"]), 8, 8 + n - 1, kind="header", name=sh["file"], shard=sh)
            os.makedirs(os.path.join(ctx.out, "headers"), exist_ok=True)
            with open(os.path.join(ctx.out, "headers", sh["file"] + ".header.json"), "wb") as f:
                f.write(body)
            hbytes[sh["file"]], hsha[sh["file"]] = n, rec["sha256"]
            headers[sh["file"]] = json.loads(bytes(body).decode("utf-8"))
        T = tensors_of(headers, hbytes)
    except (ValueError, KeyError, TypeError) as e:
        dump(os.path.join(ctx.out, "plan.json"), {"meta": ctx.meta(), "parsed": False, "why": "%s: %s" % (type(e).__name__, e),
                                                 "rows": {k: {"verdict": "REFUSED", "values": {"why": "a header cannot be parsed"}} for k in ("S1", "S2", "S3", "S4")}})
        raise Stop("a header cannot be parsed")
    rows, outm = header_rows(cfg, T, ctx)
    byname = {t["name"]: t for t in T}
    size = {s["file"]: s["bytes"] for s in ctx.shards}
    wm = index.get("weight_map", {})
    checks = {"length_failures": length_failures(T), "names_twice": sorted(n for n, c in Counter(t["name"] for t in T).items() if c > 1),
              "past_the_end": sorted(t["name"] for t in T if t["last"] >= size[t["file"]]),
              "tensor_bytes_plus_header_fill_each_shard": all(8 + hbytes[f] + sum(t["length"] for t in T if t["file"] == f) == size[f] for f in size),
              "index_names_equal_header_names": sorted(wm) == sorted(byname), "index_shard_differs": sorted(n for n in wm if n in byname and wm[n] != byname[n]["file"])}
    if checks["length_failures"] or checks["names_twice"] or checks["past_the_end"]:
        raise Stop("a header is inconsistent: " + json.dumps(checks))
    need = [dict(byname[m["name"]], layer=m["layer"], kind=m["kind"], role="output-matrix") for m in outm]
    need += [dict(byname[x["name"]], role="time-step-bias") for x in rows["E2"]["values"]["tensors"]]
    bad = [t["name"] for t in need if t["role"] == "output-matrix" and (t["dtype"] != "BF16" or len(t["shape"]) != 2)]
    if bad:
        raise Stop("an output matrix is not a two-axis BF16 tensor: " + ", ".join(bad))
    lines = []
    for s in ctx.shards:
        lines.append((s["file"], 0, 7, "len8", "-"))
        lines.append((s["file"], 8, 8 + hbytes[s["file"]] - 1, "header", "-"))
    for f in ctx.pins["model"]["hashed_whole"]:
        lines.append((f, 0, size[f] - 1, "whole", "-"))
    for t in need:
        lines.append((t["file"], t["first"], t["last"], "tensor", t["name"]))
    lines.sort(key=lambda x: (x[0], x[1], x[2], x[3], x[4]))
    text = "".join("%s\t%d\t%d\t%s\t%s\n" % x for x in lines)
    with open(os.path.join(ctx.out, "ranges.tsv"), "w", encoding="ascii") as f:
        f.write(text)
    for w in whole.values():
        del w["_body"]
    plan = {"meta": ctx.meta(), "parsed": True, "commit": ctx.commit, "files_whole": whole, "header_bytes": hbytes, "header_sha256": hsha, "checks": checks,
            "rows": rows, "tensors": sorted(need, key=lambda t: (t["file"], t["first"])), "ranges": len(lines), "ranges_sha256": sha256(text.encode("ascii")),
            "bytes_planned": sum(x[2] - x[1] + 1 for x in lines), "bytes_read": net.total}
    dump(os.path.join(ctx.out, "plan.json"), plan)
    print("plan: %d tensors in the headers, %d needed, %d ranges, %d bytes planned; ranges sha256 %s" % (len(T), len(need), len(lines), plan["bytes_planned"], plan["ranges_sha256"]))
    for k in ("S1", "S2", "S3", "S4", "E1"):
        print("  %s %s" % (k, rows[k]["verdict"]))


# ---------------------------------------------------------------- the edit (E2, E3, E4)
def words(buf, dtype):
    w = DT_BYTES[dtype]
    return list(struct.unpack("<%d%s" % (len(buf) // w, PACK[w]), bytes(buf)))


def pack(bits, dtype):
    return struct.pack("<%d%s" % (len(bits), PACK[DT_BYTES[dtype]]), *bits)


def edit_tensor(buf, dtype, c):
    """the edit y = x + c of one tensor under each reading. Returns per reading: dtype, bits, values, and the checks."""
    xb = words(buf, dtype)
    x = [decode(b, dtype) for b in xb]
    if any(v is None for v in x):
        return {"base_nonfinite": sum(1 for v in x if v is None)}
    R = {}
    R["a"] = {"dtype": dtype, "bits": [encode(v + c, dtype) for v in x], "target": [(v + c, dtype) for v in x]}
    R["b"] = {"dtype": "BF16", "bits": [encode(v + c, "BF16") for v in x], "target": [(v + c, "BF16") for v in x]}
    mid = [encode(v + c, "F32") for v in x]
    midv = [decode(b, "F32") for b in mid]
    R["c"] = {"dtype": "BF16", "bits": [encode(v, "BF16") if v is not None else 0x7F80 for v in midv], "mid": mid,
              "target": [(v, "BF16") for v in midv], "mid_target": [(v + c, "F32") for v in x]}
    if dtype != "BF16":
        first = [encode(v, "BF16") for v in x]
        fv = [decode(b, "BF16") for b in first]
        R["d"] = {"dtype": "BF16", "bits": [encode(v + c, "BF16") if v is not None else 0x7F80 for v in fv], "mid": first,
                  "target": [(v + c if v is not None else None, "BF16") for v in fv], "mid_target": [(v, "BF16") for v in x]}
    for r in R.values():
        r["values"] = [decode(b, r["dtype"]) for b in r["bits"]]
        r["bytes"] = pack(r["bits"], r["dtype"])
    return {"x": x, "readings": R, "base_nonfinite": 0}


def rounding_failures(E, c_check):
    """recompute every y against x + c_check with the independent test; the number of entries that fail, per reading"""
    out = {}
    x = E["x"]
    for k, r in E["readings"].items():
        bad = 0
        for i in range(len(x)):
            if k in ("a", "b"):
                ok = nearest_ok(x[i] + c_check, r["bits"][i], r["dtype"])
            elif k == "c":
                ok = nearest_ok(x[i] + c_check, r["mid"][i], "F32") and decode(r["mid"][i], "F32") is not None and nearest_ok(decode(r["mid"][i], "F32"), r["bits"][i], "BF16")
            else:
                ok = nearest_ok(x[i], r["mid"][i], "BF16") and decode(r["mid"][i], "BF16") is not None and nearest_ok(decode(r["mid"][i], "BF16") + c_check, r["bits"][i], "BF16")
            bad += 0 if ok else 1
        out[k] = bad
    return out


def edit_rows(ctx, plan, base, const):
    """E2 (with hashes), E3, E4 and the specification object, from the base bytes of the time-step bias tensors"""
    c = Fraction(const)
    e1 = plan["rows"]["E1"]
    tens = plan["rows"]["E2"]["values"]["tensors"]
    keys = ["a", "b", "c", "d"]
    spec_t, e2_t = [], []
    tot = {"entries": 0, "base_nonfinite": 0, "not_representable_stored": 0, "not_representable_bf16": 0, "base_not_in_bf16": 0, "entries_where_readings_differ": 0}
    pair = {}
    nonfinite_y = {k: 0 for k in keys}
    fails = {k: 0 for k in keys}
    diffs = {k: Counter() for k in keys}
    cat = {k: hashlib.sha256() for k in keys}
    used = set()
    xmin = xmax = None
    for t in tens:
        buf = base[t["name"]]
        E = edit_tensor(buf, t["dtype"], c) if t["dtype"] in FMT else {"base_nonfinite": None, "unsupported": True}
        e2_t.append(dict(t, sha256=sha256(buf)))
        tot["entries"] += t["entries"]
        if "readings" not in E:
            tot["base_nonfinite"] += E["base_nonfinite"] or 0
            spec_t.append({"name": t["name"], "shard": t["shard"], "first_byte": t["first_byte"], "last_byte": t["last_byte"], "dtype": t["dtype"], "shape": t["shape"],
                           "entries": t["entries"], "sha256_base": sha256(buf), "edited": None})
            continue
        x, R = E["x"], E["readings"]
        applicable = [k for k in keys if k in R]
        used.update(applicable)
        xmin = min(x) if xmin is None else min(xmin, min(x))
        xmax = max(x) if xmax is None else max(xmax, max(x))
        for i, v in enumerate(x):
            if decode(encode(v + c, t["dtype"]), t["dtype"]) != v + c:
                tot["not_representable_stored"] += 1
            if decode(encode(v + c, "BF16"), "BF16") != v + c:
                tot["not_representable_bf16"] += 1
            if t["dtype"] != "BF16" and decode(encode(v, "BF16"), "BF16") != v:
                tot["base_not_in_bf16"] += 1
            ys = [R[k]["values"][i] for k in applicable]
            if any(y != ys[0] for y in ys):
                tot["entries_where_readings_differ"] += 1
            for a in range(len(applicable)):
                for b in range(a + 1, len(applicable)):
                    if ys[a] != ys[b]:
                        pair[applicable[a] + applicable[b]] = pair.get(applicable[a] + applicable[b], 0) + 1
            for k in applicable:
                y = R[k]["values"][i]
                if y is None:
                    nonfinite_y[k] += 1
                else:
                    diffs[k][y - v] += 1
        for k, n in rounding_failures(E, c).items():
            fails[k] += n
        for k in applicable:
            cat[k].update(R[k]["bytes"])
        spec_t.append({"name": t["name"], "shard": t["shard"], "first_byte": t["first_byte"], "last_byte": t["last_byte"], "dtype": t["dtype"], "shape": t["shape"],
                       "entries": t["entries"], "sha256_base": sha256(buf),
                       "edited": {k: {"dtype": R[k]["dtype"], "bytes": len(R[k]["bytes"]), "sha256": sha256(R[k]["bytes"])} for k in applicable}})
    applicable = [k for k in keys if k in used]
    realised = {}
    for k in applicable:
        ds = sorted(diffs[k])
        realised[k] = {"distinct": len(ds), "min": qs(ds[0]) if ds else None, "max": qs(ds[-1]) if ds else None, "entries_equal_to_the_constant": diffs[k].get(c, 0),
                       "list_sha256": sha256("".join(qs(d) + "\n" for d in ds).encode("ascii")),
                       "list": [{"difference": qs(d), "entries": diffs[k][d]} for d in ds] if len(ds) <= 16 else None}
    stored = sorted({t["dtype"] for t in tens})
    rows = {}
    rows["E2"] = {"verdict": "COMPUTED", "values": {"tensors": e2_t, "count": len(e2_t), "entries": tot["entries"], "dtypes": stored}}
    rows["E3"] = {"verdict": "COMPUTED", "values": {
        "constant": qs(c), "stored_dtypes": stored,
        "constant_representable": {d: (decode(encode(c, d), d) == c if d in FMT else None) for d in sorted(set(stored + ["BF16"]))},
        "entries": tot["entries"], "base_nonfinite": tot["base_nonfinite"],
        "entries_where_x_plus_constant_is_not_representable_in_the_stored_dtype": tot["not_representable_stored"],
        "entries_where_x_plus_constant_is_not_representable_in_bf16": tot["not_representable_bf16"],
        "base_entries_bf16_cannot_hold": tot["base_not_in_bf16"] if stored != ["BF16"] else None,
        "base_min": qs(xmin) if xmin is not None else None, "base_max": qs(xmax) if xmax is not None else None,
        "base_min_dec": sci(xmin, 9) if xmin is not None else None, "base_max_dec": sci(xmax, 9) if xmax is not None else None,
        "realised_y_minus_x": realised}}
    ok_all = bool(applicable) and all(s["edited"] is not None for s in spec_t)
    finite = ok_all and tot["base_nonfinite"] == 0 and all(nonfinite_y[k] == 0 for k in applicable)
    checked = ok_all and all(fails[k] == 0 for k in applicable)
    if e1["verdict"] == "REFUTED":
        verdict = "REFUTED"
    elif e1["verdict"] == "CERTIFIED" and finite and checked and tot["entries_where_readings_differ"] == 0:
        verdict = "CERTIFIED"
    else:
        verdict = "REFUSED"
    rows["E4"] = {"verdict": verdict, "values": {
        "E1": e1["verdict"], "constant": qs(c), "readings": applicable, "every_y_finite": finite, "nonfinite_y": {k: nonfinite_y[k] for k in applicable},
        "rounding_check_failures": {k: fails[k] for k in applicable}, "entries": tot["entries"],
        "entries_where_readings_differ": tot["entries_where_readings_differ"], "entries_where_two_readings_differ": {k: pair[k] for k in sorted(pair)},
        "edited_sha256_all_tensors": {k: cat[k].hexdigest() for k in applicable},
        "note": "CERTIFIED here also needs both deciders to write identical bytes; the recorder checks it"}}
    spec = None
    if e1["verdict"] == "CERTIFIED":
        spec = {"what": "Our rebuild of session 8's edit from its description in the paper (time-step bias +0.5 in all 48 linear-attention layers). It is ours. It is not the authors' file.",
                "model": {"repo": ctx.repo, "commit": ctx.commit}, "constant": qs(c),
                "readings": {"a": "y = x + c as an exact sum, rounded once to nearest, ties to even, in the tensor's stored dtype",
                             "b": "the same sum rounded once to bf16", "c": "the sum rounded to binary32, then to bf16",
                             "d": "x rounded to bf16 first, then the sum rounded once to bf16 (only if the stored dtype is not BF16)"},
                "tensors": spec_t, "entries": tot["entries"], "entries_where_readings_differ": tot["entries_where_readings_differ"],
                "edited_sha256_all_tensors": {k: cat[k].hexdigest() for k in applicable}}
    return rows, spec


def write_spec(path, spec):
    """the specification is written only when E1 is CERTIFIED (spec is None otherwise)"""
    if spec is None:
        return None
    text = json.dumps(spec, indent=1, ensure_ascii=True) + "\n"
    with open(path, "w", encoding="ascii") as f:
        f.write(text)
    return sha256(text.encode("ascii"))


# ---------------------------------------------------------------- the arithmetic rows (A1-A6)
def pct(x):
    return Fraction(x) * 100


def binom_tail(n, a):
    """P[X >= a] for X ~ Binomial(n, 1/2), exact"""
    return Fraction(sum(math.comb(n, k) for k in range(a, n + 1)), 1 << n)


def ints_in(lo, hi):
    """the integers k with lo <= k <= hi (rational ends)"""
    a = -((-lo.numerator) // lo.denominator)
    b = hi.numerator // hi.denominator
    return list(range(a, b + 1))


def arithmetic_rows(ctx, s4_entries, var_n):
    P = {k: v.get("params", {}) for k, v in ctx.row.items()}
    rows = {}
    # A1
    p = P["A1"]
    A = p["answers"]

    def counts_for(printed, strict):
        d, u = parse_dec(printed)
        ks = ints_in((d - u / 2) * A / 100, (d + u / 2) * A / 100)
        return [k for k in ks if not strict or abs(pct(Fraction(k, A)) - d) < u / 2]
    pairs = []
    for x in p["pairs"]:
        diff = x["only_edit"] - x["only_base"]
        ch = pct(Fraction(diff, A))
        pairs.append({"label": x["label"], "only_edit": x["only_edit"], "only_base": x["only_base"], "difference": diff, "change_points": qs(ch), "change_points_dec": sci(ch, 9),
                      "printed_change": x["printed_change"], "band": band(ch, x["printed_change"])})

    def bases(strict):
        out = []
        for B in counts_for(p["base_printed"], strict):
            if all((B + x["only_edit"] - x["only_base"]) in counts_for(x["printed_accuracy"], strict) for x in p["pairs"]):
                d, u = parse_dec(p["session1"]["printed_change"])
                c1 = [k for k in counts_for(p["session1"]["printed_accuracy"], strict)
                      if (abs(pct(Fraction(k - B, A)) - d) < u / 2 if strict else abs(pct(Fraction(k - B, A)) - d) <= u / 2)]
                if c1:
                    out.append({"B": B, "base_percent": qs(pct(Fraction(B, A))), "base_percent_dec": sci(pct(Fraction(B, A)), 9),
                                "edited": [{"label": x["label"], "correct": B + x["only_edit"] - x["only_base"],
                                            "percent": qs(pct(Fraction(B + x["only_edit"] - x["only_base"], A))), "printed": x["printed_accuracy"],
                                            "exact_tie": abs(pct(Fraction(B + x["only_edit"] - x["only_base"], A)) - parse_dec(x["printed_accuracy"])[0]) == parse_dec(x["printed_accuracy"])[1] / 2}
                                           for x in p["pairs"]],
                                "session1_correct_counts": c1})
        return out
    rows["A1"] = {"verdict": "COMPUTED", "values": {"answers": A, "pairs": pairs, "base_counts_ties_allowed": bases(False), "base_counts_ties_excluded": bases(True),
                                                     "rule": "B is kept when each printed accuracy and change is within half a unit of the last printed digit of the value B gives; a value exactly half a unit away is a tie"}}
    # A2
    p = P["A2"]
    z = Fraction(p["z"])
    iv = []
    for x in p["intervals"]:
        lo, hi, ch = Fraction(x["lo"]), Fraction(x["hi"]), parse_dec(x["printed_change"])[0]
        mid, half = (lo + hi) / 2, (hi - lo) / 2
        iv.append({"label": x["label"], "lo": x["lo"], "hi": x["hi"], "midpoint": qs(mid), "half_width": qs(half), "half_width_over_z": qs(half / z),
                   "half_width_over_z_dec": sci(half / z, 9), "printed_change": x["printed_change"], "midpoint_minus_printed_change": qs(mid - ch)})
    rows["A2"] = {"verdict": "COMPUTED", "values": {"z": p["z"], "intervals": iv}}
    # A3
    p = P["A3"]
    tests = []
    for x in p["sign_tests"]:
        cands = [x["a"]] if "a" in x else None
        if cands is None:
            d, u = parse_dec(x["derive"]["printed_accuracy"])
            cands = ints_in((d - u / 2) * x["derive"]["problems"] / 100, (d + u / 2) * x["derive"]["problems"] / 100)
        for a in cands:
            n = a + x["b"]
            pv = binom_tail(n, a)
            t = {"label": x["label"], "a": a, "b": x["b"], "n": n, "p": qs(pv), "p_dec": sci(pv, 9), "count_derived": "derive" in x}
            if "bound_exp" in x:
                t["printed_bound"] = "10^%d" % x["bound_exp"]
                t["p_below_printed_bound"] = pv < pow10(x["bound_exp"])
                t["p_below_a_tenth_of_it"] = pv < pow10(x["bound_exp"] - 1)
            if "printed_p" in x:
                t["printed_p"] = x["printed_p"]
                t["band"] = band(pv, x["printed_p"])
            tests.append(t)
    N = p["flips"]
    rows["A3"] = {"verdict": "COMPUTED", "values": {"sign_tests": tests, "flips": N,
                                                     "smallest_p_from_flips": {"as_count_over_flips": {"zero_count": "0/1", "one_count": qs(Fraction(1, N))},
                                                                               "as_count_plus_one_over_flips_plus_one": {"zero_count": qs(Fraction(1, N + 1)), "zero_count_dec": sci(Fraction(1, N + 1), 9)}},
                                                     "permutation_p_not_computable": "the per-problem differences are not printed"}}
    # A4
    out = []
    for x in P["A4"]["pairs"]:
        (c0, cu), (t0, tu) = parse_dec(x["correct"]), parse_dec(x["cut"])
        lo, hi, pt = (c0 - cu / 2) / (100 - (t0 - tu / 2)), (c0 + cu / 2) / (100 - (t0 + tu / 2)), c0 / (100 - t0)
        out.append({"label": x["label"], "correct": x["correct"], "out_of_tokens": x["cut"], "low": qs(lo), "high": qs(hi), "from_printed_values": qs(pt),
                    "low_dec": sci(lo, 9)[0], "high_dec": sci(hi, 9)[1], "from_printed_values_dec": sci(pt, 9)})
    rows["A4"] = {"verdict": "COMPUTED", "values": {"pairs": out, "assumes": "no answer that ran out of tokens counts as correct"}}
    # A5
    p = P["A5"]
    nb, per = len(p["benchmarks"]), p["per_benchmark_problems"]
    cols = {}
    for k in ("base", "damaged", "repaired"):
        tot = sum(Fraction(b[k]) for b in p["benchmarks"])
        mean = tot / nb
        cols[k] = {"sum": qs(tot), "mean": qs(mean), "mean_dec": sci(mean, 9), "printed": p["pooled_printed"][k], "band": band(mean, p["pooled_printed"][k]),
                   "problems_solved": qs(tot * per / 100)}
    ident = [{"name": b["name"], "damaged_plus_right_minus_wrong": qs(Fraction(b["damaged"]) * per / 100 + b["right"] - b["wrong"]),
              "repaired": qs(Fraction(b["repaired"]) * per / 100),
              "holds": Fraction(b["damaged"]) * per / 100 + b["right"] - b["wrong"] == Fraction(b["repaired"]) * per / 100} for b in p["benchmarks"]]
    right, wrong = sum(b["right"] for b in p["benchmarks"]), sum(b["wrong"] for b in p["benchmarks"])
    solved = {k: sum(Fraction(b[k]) for b in p["benchmarks"]) * per / 100 for k in ("base", "damaged", "repaired")}
    quot = []
    for x in p["quotients"]:
        v = Fraction(x["num"]) / Fraction(x["den"])
        v = v * 100 if x["percent"] else v
        quot.append({"label": x["label"], "value": qs(v), "value_dec": sci(v, 9), "printed": x["printed"], "in_percent": x["percent"], "band": band(v, x["printed"])})
    nm = p["named_matrix"]
    base_solved = Fraction(nm["base_printed"]) * nm["problems"] / 100
    ds = p["distance"]
    a, b, cs = Fraction(ds["repaired_norm"]), Fraction(ds["published_norm"]), Fraction(ds["cosine"])
    d2 = a * a + b * b - 2 * cs * a * b
    rows["A5"] = {"verdict": "COMPUTED", "values": {
        "columns": cols, "changed": {"right_sum": right, "wrong_sum": wrong, "printed_right": p["pooled_printed"]["right"], "printed_wrong": p["pooled_printed"]["wrong"],
                                     "sums_equal_printed": right == p["pooled_printed"]["right"] and wrong == p["pooled_printed"]["wrong"]},
        "per_benchmark": ident, "pooled_identity_holds": solved["damaged"] + right - wrong == solved["repaired"],
        "quotients": quot,
        "quotients_from_counts": {"repaired_over_base_percent": qs(solved["repaired"] / solved["base"] * 100), "repaired_over_base_percent_dec": sci(solved["repaired"] / solved["base"] * 100, 9),
                                  "repaired_over_damaged": qs(solved["repaired"] / solved["damaged"]), "repaired_over_damaged_dec": sci(solved["repaired"] / solved["damaged"], 9)},
        "named_matrix": {"base_solved": qs(base_solved), "base_minus_lost_plus_gained": qs(base_solved - nm["named_fails_base_solves"] + nm["named_solves_base_fails"]),
                         "printed_solved": nm["solved_named"], "holds": base_solved - nm["named_fails_base_solves"] + nm["named_solves_base_fails"] == nm["solved_named"]},
        "distance": {"from_the_three_printed_numbers_squared": qs(d2), "from_the_three_printed_numbers_dec": sci_sqrt(d2, 9), "printed": ds["printed_distance"],
                     "band": band_sqrt(d2, ds["printed_distance"]), "formula": "sqrt(a^2 + b^2 - 2 cos a b) with a = 39.7, b = 3.85, cos = 0.002"}}}
    # A6
    p = P["A6"]
    v = {"changed": p["changed"], "entries_of_the_20_matrices": s4_entries}
    if s4_entries:
        share = pct(Fraction(p["changed"], s4_entries))
        v.update({"percent": qs(share), "percent_dec": sci(share, 9), "printed_percent": p["printed_percent"], "band": band(share, p["printed_percent"])})
    k2 = Fraction(p["strength"]) ** 2
    ps = Fraction(p["printed_sigma"])
    v["with_the_printed_sigma"] = {"expected_norm_squared": qs(k2 * ps * ps * p["overwritten"]), "expected_norm_dec": sci_sqrt(k2 * ps * ps * p["overwritten"], 9),
                                   "standard_deviation_dec": sci_sqrt(k2 * ps * ps / 2, 9)}
    if var_n is not None:
        v["with_the_exact_sigma"] = {"expected_norm_squared": qs(k2 * var_n * p["overwritten"]), "expected_norm_dec": sci_sqrt(k2 * var_n * p["overwritten"], 9),
                                     "standard_deviation_squared": qs(k2 * var_n / 2), "standard_deviation_dec": sci_sqrt(k2 * var_n / 2, 9)}
    v["printed_norm"] = p["printed_norm"]
    v["formulas"] = "expected norm 200 sigma sqrt(139,264); standard deviation 200 sigma / sqrt(2)"
    rows["A6"] = {"verdict": "COMPUTED", "values": v}
    return rows


# ---------------------------------------------------------------- the run
class Intervals:
    """sha256 of chosen byte intervals of a stream"""

    def __init__(self, items):
        self.items = sorted(items)
        self.h = {k: hashlib.sha256() for _, _, k in self.items}
        self.i = 0

    def __call__(self, pos, chunk):
        end = pos + len(chunk)
        while self.i < len(self.items) and self.items[self.i][1] < pos:
            self.i += 1
        j = self.i
        while j < len(self.items) and self.items[j][0] < end:
            a, b, k = self.items[j]
            lo, hi = max(a, pos), min(b + 1, end)
            if lo < hi:
                self.h[k].update(chunk[lo - pos:hi - pos])
            j += 1


def rows_of(buf, shape, first_row, last_row):
    c = shape[1]
    return memoryview(buf)[first_row * c * 2:(last_row + 1) * c * 2]


def weight_rows(ctx, mats, l30):
    """W1-W5 from the per-matrix records and the layer-30 matrix's census and rows"""
    P = {k: v.get("params", {}) for k, v in ctx.row.items()}
    rows = {}
    name30 = ctx.names["layer30_matrix"]
    # W1
    var_n = None
    if l30 is None or l30["stats"]["nonfinite"]:
        for k in ("W1", "W2", "W3"):
            rows[k] = {"verdict": "REFUSED", "values": {"why": "the layer-30 matrix was not read, or holds a value that is not finite"}}
    else:
        n, s, q = l30["sums"]
        var_n = Fraction(n * q - s * s, (n * n) << 266)
        var_n1 = Fraction(n * q - s * s, (n * (n - 1)) << 266)
        b0, b1 = band_sqrt(var_n, P["W1"]["printed"]), band_sqrt(var_n1, P["W1"]["printed"])
        v = "REFUSED" if b0 != b1 else {"MATCH": "CERTIFIED", "FAR": "REFUTED", "NEAR": "REFUSED"}[b0]
        rows["W1"] = {"verdict": v, "values": {"tensor": name30, "shape": l30["shape"], "entries": n, "sha256": l30["sha256"], "census_sha256": l30["census_sha256"],
                                               "sum": qs(Fraction(s, U133)), "sum_of_squares": qs(Fraction(q, U133 * U133)), "mean_dec": sci(Fraction(s, U133 * n), 9),
                                               "variance_dividing_by_n": qs(var_n), "variance_dividing_by_n_minus_1": qs(var_n1),
                                               "sd_dividing_by_n_dec": sci_sqrt(var_n), "sd_dividing_by_n_minus_1_dec": sci_sqrt(var_n1),
                                               "printed": P["W1"]["printed"], "band_dividing_by_n": b0, "band_dividing_by_n_minus_1": b1}}
        # W2, W3
        r2, r3 = {}, {}
        for key, off in ((("rows_counted_from_0", 0), ("rows_counted_from_1", -1)) if l30["rows"] is not None else ()):
            f, la = P["W2"]["first_row"] + off, P["W2"]["last_row"] + off
            R = l30["rows"][key]
            r2[key] = {"first_row_from_0": f, "last_row_from_0": la, "entries": R["n"], "sha256_of_the_rows": R["sha256"], "sum_of_squares": qs(Fraction(R["q"], U133 * U133)),
                       "norm_dec": sci_sqrt(Fraction(R["q"], U133 * U133)), "band": band_sqrt(Fraction(R["q"], U133 * U133), P["W2"]["printed"])}
            r3[key] = {"first_row_from_0": f, "last_row_from_0": la, "largest_abs_bits": "%04x" % R["max_abs"], "largest_abs": qs(Fraction(units(R["max_abs"]), U133)),
                       "largest_abs_dec": sci(Fraction(units(R["max_abs"]), U133)), "band": band(Fraction(units(R["max_abs"]), U133), P["W3"]["printed"])}
        for k, r, pr in (("W2", r2, P["W2"]["printed"]), ("W3", r3, P["W3"]["printed"])):
            if l30["rows"] is None:
                rows[k] = {"verdict": "REFUSED", "values": {"why": "the matrix has fewer rows than the row range needs"}}
                continue
            bs = [r[x]["band"] for x in ("rows_counted_from_0", "rows_counted_from_1")]
            v = "CERTIFIED" if bs[0] == "MATCH" else ("REFUTED" if all(b == "FAR" for b in bs) else "REFUSED")
            rows[k] = {"verdict": v, "values": {"tensor": name30, "printed": pr, "readings": r}}
    # W4
    others = [m for m in mats if m["name"] != name30]
    v4 = {"printed": P["W4"]["printed"], "matrices": len(others), "by_kind": {k: sum(1 for m in others if m["kind"] == k) for k in ("mlp", "linear", "full")},
          "nonfinite_matrices": [m["name"] for m in others if m["nonfinite"]], "per_matrix": others}
    if len(others) != P["W4"]["others"] or v4["nonfinite_matrices"]:
        rows["W4"] = {"verdict": "REFUSED", "values": dict(v4, why="the other output matrices are not 127 finite matrices")}
    else:
        rd = {}
        for k in READINGS:
            best = max(Fraction(m["ratio"][k]) for m in others)
            sub = [m for m in others if m["kind"] in ("mlp", "linear")]
            best_sub = max(Fraction(m["ratio"][k]) for m in sub)
            rd[k] = {"M": qs(best), "M_dec": sci(best), "attained_by": [m["name"] for m in others if Fraction(m["ratio"][k]) == best], "band": band(best, P["W4"]["printed"]),
                     "M_over_the_matrices_E3_names": qs(best_sub), "M_over_the_matrices_E3_names_dec": sci(best_sub), "matrices_E3_names": len(sub),
                     "attained_by_among_them": [m["name"] for m in sub if Fraction(m["ratio"][k]) == best_sub], "band_among_them": band(best_sub, P["W4"]["printed"])}
        bs = [rd[k]["band"] for k in READINGS]
        v = "CERTIFIED" if bs[0] == "MATCH" else ("REFUTED" if all(b == "FAR" for b in bs) else "REFUSED")
        v4["readings"] = rd
        v4["matrices_with_median_zero"] = [m["name"] for m in others if m["median_lower_is_zero"]]
        rows["W4"] = {"verdict": v, "values": v4}
    # W5
    if l30 is None or l30["stats"]["nonfinite"]:
        rows["W5"] = {"verdict": "COMPUTED", "values": {"why": "the layer-30 matrix was not read, or holds a value that is not finite"}}
    else:
        st, mag, n = l30["stats"], l30["mag"], l30["sums"][0]
        m = P["W5"]["entries_changed_max"]
        klo, khi = (n - 1) // 2, n // 2
        val = lambda p: Fraction(units(p), U133)

        def at(k):
            return val(order_stat(mag, k)) if 0 <= k <= n - 1 else (Fraction(0) if k < 0 else None)
        lo_l, hi_l = at(klo - m), at(klo + m)
        lo_m = (at(klo - m) + at(khi - m)) / 2
        hi_m = (at(klo + m) + at(khi + m)) / 2 if at(klo + m) is not None and at(khi + m) is not None else None
        implied = []
        for x in P["W5"]["pairs"]:
            (a, au), (b, bu) = parse_dec(x["num"]), parse_dec(x["den"])
            lo, hi = (a - au / 2) / (b + bu / 2), (a + au / 2) / (b - bu / 2)
            implied.append({"label": x["label"], "low": qs(lo), "high": qs(hi), "low_dec": sci(lo, 9)[0], "high_dec": sci(hi, 9)[1],
                            "meets_the_range_lower_middle": hi >= lo_l and (hi_l is None or lo <= hi_l),
                            "meets_the_range_mean_of_two": hi >= lo_m and (hi_m is None or lo <= hi_m)})
        rows["W5"] = {"verdict": "COMPUTED", "values": {
            "tensor": name30, "entries": n, "base": {"largest_abs": qs(val(int(st["max_abs_bits"], 16))), "largest_abs_dec": sci(val(int(st["max_abs_bits"], 16)), 9),
                                                    "median_lower_middle": qs(val(int(st["median_lower_bits"], 16))), "median_lower_middle_dec": sci(val(int(st["median_lower_bits"], 16)), 9),
                                                    "median_mean_of_two": qs((val(int(st["median_lower_bits"], 16)) + val(int(st["median_upper_bits"], 16))) / 2),
                                                    "ratio": st["ratio"], "ratio_abs_over_lower_dec": st["ratio_abs_over_lower_dec"]},
            "entries_that_may_differ": m,
            "median_range_lower_middle": {"low": qs(lo_l), "high": qs(hi_l) if hi_l is not None else None, "low_dec": sci(lo_l, 9), "high_dec": sci(hi_l, 9) if hi_l is not None else None},
            "median_range_mean_of_two": {"low": qs(lo_m), "high": qs(hi_m) if hi_m is not None else None, "low_dec": sci(lo_m, 9), "high_dec": sci(hi_m, 9) if hi_m is not None else None},
            "implied_by_the_printed_numbers": implied,
            "note": "1397, 10.1 and 0.108 belong to copies that are not public; a null upper end means the copy's median is not bounded above"}}
    return rows, var_n


def process_matrix(t, buf, ctx):
    """one output matrix: its record for W4, and for the layer-30 matrix what W1-W5 need"""
    counts = census(buf)
    st, mag = matrix_stats(counts)
    rec = {"name": t["name"], "layer": t["layer"], "kind": t["kind"], "shape": t["shape"], "entries": st["n"], "sha256": sha256(buf), "census_sha256": census_sha(counts),
           "nonfinite": st["nonfinite"]}
    rec.update({k: v for k, v in st.items() if k not in ("n", "nonfinite")})
    l30 = None
    if t["name"] == ctx.names["layer30_matrix"]:
        p = ctx.row["W2"]["params"]
        rr = {}
        for key, off in (("rows_counted_from_0", 0), ("rows_counted_from_1", -1)):
            if t["shape"][0] <= p["last_row"]:
                rr = None
                break
            sl = rows_of(buf, t["shape"], p["first_row"] + off, p["last_row"] + off)
            cs = census(sl)
            n, _, q = sums(cs)
            mg = magnitudes(cs)
            rr[key] = {"n": n, "q": q, "sha256": sha256(sl), "max_abs": max(pp for pp in range(0x8000) if mg[pp]), "nonfinite": sum(mg[0x7F80:])}
        l30 = {"shape": t["shape"], "sha256": rec["sha256"], "census_sha256": rec["census_sha256"], "stats": st, "mag": mag, "sums": sums(counts), "rows": rr}
        if rr is not None and any(r["nonfinite"] for r in rr.values()):
            l30["stats"] = dict(st, nonfinite=1)
    return rec, l30


def cmd_run(ctx):
    require_quotes(ctx)
    plan = load(os.path.join(ctx.out, "plan.json"))
    if not plan.get("parsed") or plan["commit"] != ctx.commit:
        raise Stop("no plan")
    mine = open(os.path.join(ctx.out, "ranges.tsv"), "rb").read()
    theirs_path = os.path.join(ctx.other, "ranges.tsv")
    if not os.path.exists(theirs_path) or open(theirs_path, "rb").read() != mine:
        raise Stop("the two deciders' range lists are not equal; no tensor is read")
    battery_guard()
    net = Net(ctx)
    t_start = time.time()
    shard = {s["file"]: s for s in ctx.shards}
    T = plan["tensors"]
    # shard 11, whole
    stream_sha = {}
    whole = {}
    for f in ctx.pins["model"]["hashed_whole"]:
        items = [(0, 8 + plan["header_bytes"][f] - 1, "__len8_and_header__")] + [(t["first"], t["last"], t["name"]) for t in T if t["file"] == f]
        _, rec, sink = net.get(ctx.resolve(f), kind="whole", name=f, sink_factory=lambda: Intervals(items), shard=shard[f])
        whole[f] = {"bytes": rec["length"], "sha256": rec["sha256"], "equals_lfs_sha256": rec["sha256"] == shard[f]["lfs_sha256"] and rec["length"] == shard[f]["bytes"]}
        if not whole[f]["equals_lfs_sha256"]:
            raise Stop("%s hashed whole is not the pinned file" % f)
        stream_sha.update({k: h.hexdigest() for k, h in sink.h.items()})
        print("whole %s sha256 equals the LFS value; %d bytes in %.0f s" % (f, rec["length"], rec["seconds"]), flush=True)
    # one range per tensor
    mats, base, l30, same_as_stream = [], {}, None, []
    for i, t in enumerate(T):
        if i % 16 == 0:
            battery_guard()
        body, rec, _ = net.get(ctx.resolve(t["file"]), t["first"], t["last"], kind="tensor", name=t["name"], shard=shard[t["file"]])
        if t["name"] in stream_sha:
            same_as_stream.append({"name": t["name"], "equal": stream_sha[t["name"]] == rec["sha256"]})
            if stream_sha[t["name"]] != rec["sha256"]:
                raise Stop("%s: the range and the whole stream differ" % t["name"])
        if t["role"] == "output-matrix":
            m, l = process_matrix(t, body, ctx)
            mats.append(m)
            l30 = l or l30
        else:
            base[t["name"]] = bytes(body)
        del body
        print("%3d/%d %s %d bytes %.1f s" % (i + 1, len(T), t["name"], rec["length"], rec["seconds"]), flush=True)
    mats.sort(key=lambda m: (m["layer"], ("mlp", "linear", "full").index(m["kind"])))
    rows = {k: plan["rows"][k] for k in ("S1", "S2", "S3", "S4", "S5", "E1")}
    wrows, var_n = weight_rows(ctx, mats, l30)
    rows.update(wrows)
    erows, spec = edit_rows(ctx, plan, base, ctx.row["E4"]["params"]["constant"])
    rows.update(erows)
    spec_sha = write_spec(os.path.join(ctx.out, "session8-edit-spec.json"), spec)
    rows["E4"]["values"]["specification_sha256"] = spec_sha
    rows.update(arithmetic_rows(ctx, plan["rows"]["S4"]["values"]["entries"], var_n))
    hdr = stream_sha.get("__len8_and_header__")
    out = {"meta": ctx.meta(), "commit": ctx.commit, "rows": rows,
           "integrity": {"hashed_whole": whole, "ranges_equal_to_the_whole_stream": same_as_stream,
                         "len8_and_header_sha256_in_the_stream": hdr},
           "bytes_read": net.total, "requests": net.seq, "seconds": round(time.time() - t_start, 1)}
    dump(os.path.join(ctx.out, "results.json"), out)
    print("run: %d bytes in %d requests, %.0f s" % (net.total, net.seq, time.time() - t_start))
    for k in sorted(rows):
        print("  %s %s" % (k, rows[k]["verdict"]))


# ---------------------------------------------------------------- the controls
def k6():
    cases, bad = 0, []
    for printed in ("0.0111", "3.85", "0.071", "162.3"):
        d, u = parse_dec(printed)
        eps = u / 1000000
        for x, want in ((d + u / 2, "MATCH"), (d - u / 2, "MATCH"), (d, "MATCH"), (d + u / 2 + eps, "NEAR"), (d - u / 2 - eps, "NEAR"), (d + u, "NEAR"), (d - u, "NEAR"),
                        (d + u + eps, "FAR"), (d - u - eps, "FAR"), (d + 3 * u, "FAR"), (d - 3 * u, "FAR")):
            cases += 2
            if band(x, printed) != want:
                bad.append("band(%s, %s)" % (qs(x), printed))
            if band_sqrt(x * x, printed) != want:
                bad.append("band_sqrt(%s^2, %s)" % (qs(x), printed))
    # the hand-worked matrix: 2 rows x 3 columns, 0.5 -0.25 1.0 / 0.0 2.0 -1.5
    buf = struct.pack("<6H", 0x3F00, 0xBE80, 0x3F80, 0x0000, 0x4000, 0xBFC0)
    counts = census(buf)
    n, s, q = sums(counts)
    st, mag = matrix_stats(counts)
    n2, _, q2 = sums(census(rows_of(buf, [2, 3], 1, 1)))
    got = {"entries": n, "sum": qs(Fraction(s, U133)), "sum_of_squares": qs(Fraction(q, U133 * U133)), "variance_dividing_by_n": qs(Fraction(n * q - s * s, (n * n) << 266)),
           "variance_dividing_by_n_minus_1": qs(Fraction(n * q - s * s, (n * (n - 1)) << 266)), "largest_abs_bits": st["max_abs_bits"], "largest_signed_bits": st["max_signed_bits"],
           "median_lower_bits": st["median_lower_bits"], "median_upper_bits": st["median_upper_bits"], "ratio_abs_over_lower": st["ratio"]["abs_over_lower"],
           "ratio_abs_over_mean2": st["ratio"]["abs_over_mean2"], "second_row_sum_of_squares": qs(Fraction(q2, U133 * U133)), "second_row_entries": n2,
           "second_row_norm_band_against_2.5": band_sqrt(Fraction(q2, U133 * U133), "2.5")}
    hand = {"entries": 6, "sum": "7/4", "sum_of_squares": "121/16", "variance_dividing_by_n": "677/576", "variance_dividing_by_n_minus_1": "677/480", "largest_abs_bits": "4000",
            "largest_signed_bits": "4000", "median_lower_bits": "3f00", "median_upper_bits": "3f80", "ratio_abs_over_lower": "4/1", "ratio_abs_over_mean2": "8/3",
            "second_row_sum_of_squares": "25/4", "second_row_entries": 3, "second_row_norm_band_against_2.5": "MATCH"}
    return {"edge_cases": cases, "edge_failures": bad, "hand_worked_matrix": {"computed": got, "by_hand": hand, "equal": got == hand}, "caught": not bad and got == hand}


def k7(ctx):
    base = check_quotes(ctx)
    pl = next(c for c in ctx.claims["controls"] if c["id"] == "K7")["planted"]
    alt = check_quotes(ctx, (pl["row"], pl["quote"], pl["from"], pl["to"]))
    try:
        require_quotes(ctx, (pl["row"], pl["quote"], pl["from"], pl["to"]))
        stops = False
    except Stop:
        stops = True
    return {"planted_stops_the_stage": stops, "quotes_searched": base["quotes"], "found": base["found"], "at_the_stated_lines": base["at_stated_lines"], "missing": base["missing"],
            "found_off_the_stated_lines": base["found_off_the_stated_lines"], "planted": pl, "planted_missing": alt["missing"],
            "caught": base["all_found"] and len(alt["missing"]) == 1 and not alt["all_found"] and stops}


def unit_tests():
    import random
    rnd = random.Random(20261122)
    t = {}
    known = {0x3F80: Fraction(1), 0xBFC0: Fraction(-3, 2), 0x0001: Fraction(1, 1 << 133), 0x0080: Fraction(1, 1 << 126), 0x7F7F: Fraction(255, 128) * (1 << 127), 0x3F00: Fraction(1, 2)}
    t["bf16_known_values"] = {"cases": len(known) + 2, "failures": sum(1 for b, v in known.items() if decode(b, "BF16") != v) + (decode(0x7F80, "BF16") is not None) + (decode(0xFFC1, "BF16") is not None)}
    bad = sum(1 for p in range(0x10000) if (p & 0x7FFF) < 0x7F80 and p != 0x8000 and encode(decode(p, "BF16"), "BF16") != p)
    bad += sum(1 for p in range(0x7F80) if Fraction(units(p), U133) != decode(p, "BF16"))
    t["bf16_every_finite_pattern_round_trips"] = {"cases": 2 * 0x7F80 - 1 + 0x7F80, "failures": bad}
    bad = n = 0
    for _ in range(20000):
        x = rnd.uniform(-4, 4) * 2.0 ** rnd.randint(-160, 130)
        n += 1
        try:
            hw = struct.unpack("<I", struct.pack("<f", x))[0]
        except OverflowError:
            hw = 0x7F800000 | (0x80000000 if x < 0 else 0)
        bad += encode(Fraction(x), "F32") != hw
    t["binary32_rounding_against_the_hardware"] = {"cases": n, "failures": bad}
    bad = n = 0
    for _ in range(20000):
        b = rnd.getrandbits(32)
        if (b & 0x7F800000) == 0x7F800000:
            continue
        trick = ((b + 0x7FFF + ((b >> 16) & 1)) >> 16) & 0xFFFF
        if decode(b, "F32") == 0:
            trick &= 0x7FFF
        got = encode(decode(b, "F32"), "BF16")
        n += 1
        bad += got != trick and not (got == 0 and trick == 0x8000)
    t["bf16_rounding_against_the_bit_formula"] = {"cases": n, "failures": bad}
    bad = n = 0
    for _ in range(5000):
        p = rnd.randrange(0, 0x7F7F)
        mid = (decode(p, "BF16") + decode(p + 1, "BF16")) / 2
        n += 2
        bad += encode(mid, "BF16") != (p if p % 2 == 0 else p + 1)
        bad += encode(-mid, "BF16") != (0x8000 | (p if p % 2 == 0 else p + 1))
    t["bf16_ties_go_to_even"] = {"cases": n, "failures": bad}
    bad = n = 0
    for fmt in ("BF16", "F32", "F16", "F64"):
        ew, fw = FMT[fmt]
        for _ in range(4000):
            b = rnd.getrandbits(ew + fw + 1)
            v = decode(b, fmt)
            if v is None:
                continue
            for c in (Fraction(1, 2), Fraction(1, 4), Fraction(-1, 2)):
                for out in ("BF16", "F32"):
                    y = encode(v + c, out)
                    if decode(y, out) is None:
                        continue
                    n += 1
                    bad += not nearest_ok(v + c, y, out)
                    wrong = y ^ 1
                    n += 1
                    bad += nearest_ok(v + c, wrong, out) and decode(wrong, out) != decode(y, out)
    t["rounding_of_exact_sums_against_the_nearest_test"] = {"cases": n, "failures": bad}
    exp = [(sci(Fraction(1, 3), 5), ["3.3333e-1", "3.3334e-1"]), (sci(Fraction(1, 8), 5), ["1.2500e-1", "1.2500e-1"]), (sci(Fraction(-2, 3), 4), ["-6.667e-1", "-6.666e-1"]),
           (sci(Fraction(999999, 1000), 3), ["9.99e2", "1.00e3"]), (sci_sqrt(Fraction(2), 6), ["1.41421e0", "1.41422e0"]), (sci_sqrt(Fraction(9, 4), 6), ["1.50000e0", "1.50000e0"]),
           (sci(Fraction(162300001, 1000000), 6), ["1.62300e2", "1.62301e2"]), (qs(binom_tail(4, 3)), "5/16"), (qs(binom_tail(66, 66)), "1/%d" % (1 << 66))]
    t["decimal_enclosures_and_the_sign_test"] = {"cases": len(exp), "failures": sum(1 for a, b in exp if a != b)}
    t["all_pass"] = all(v["failures"] == 0 for v in t.values() if isinstance(v, dict))
    return t


def cmd_offline(ctx):
    out = {"meta": ctx.meta(), "K6": k6(), "K7": k7(ctx), "unit_tests": unit_tests()}
    dump(os.path.join(ctx.out, "offline.json"), out)
    print("K6 %s: %d edge cases, %d failures; the hand-worked matrix equal: %s" % ("caught" if out["K6"]["caught"] else "NOT CAUGHT", out["K6"]["edge_cases"], len(out["K6"]["edge_failures"]), out["K6"]["hand_worked_matrix"]["equal"]))
    k = out["K7"]
    print("K7 %s: %d quotes searched, %d found, %d at the stated lines; the planted misquote missing: %s" % ("caught" if k["caught"] else "NOT CAUGHT", k["quotes_searched"], k["found"], k["at_the_stated_lines"], len(k["planted_missing"]) == 1))
    for name, v in out["unit_tests"].items():
        if isinstance(v, dict):
            print("unit %s: %d cases, %d failures" % (name, v["cases"], v["failures"]))
    if not (out["K6"]["caught"] and k["caught"] and out["unit_tests"]["all_pass"]):
        raise Stop("an offline control failed")


def cmd_controls(ctx):
    plan = load(os.path.join(ctx.out, "plan.json"))
    res = load(os.path.join(ctx.out, "results.json"))
    planted = {c["id"]: c["planted"] for c in ctx.claims["controls"]}
    net = Net(ctx, "ranges-controls.jsonl")
    shard = {s["file"]: s for s in ctx.shards}
    T = {t["name"]: t for t in plan["tensors"]}
    out = {"meta": ctx.meta()}
    name30 = ctx.names["layer30_matrix"]
    # K1
    t = T[name30]
    p = ctx.row["W2"]["params"]
    c = t["shape"][1]
    a, b = t["first"] + p["first_row"] * c * 2, t["first"] + (p["last_row"] + 1) * c * 2 - 1
    late = planted["K1"]["late_bytes"]
    _, r0, _ = net.get(ctx.resolve(t["file"]), a, b, kind="control-K1-on-time", name=name30, shard=shard[t["file"]])
    _, r1, _ = net.get(ctx.resolve(t["file"]), a + late, b + late, kind="control-K1-late", name=name30, shard=shard[t["file"]])
    recorded = res["rows"]["W2"]["values"]["readings"]["rows_counted_from_0"]["sha256_of_the_rows"]
    out["K1"] = {"first_byte": a, "last_byte": b, "late_bytes": late, "recorded_sha256": recorded, "on_time_sha256": r0["sha256"], "late_sha256": r1["sha256"],
                 "on_time_equals_recorded": r0["sha256"] == recorded, "late_differs_from_recorded": r1["sha256"] != recorded,
                 "caught": r0["sha256"] == recorded and r1["sha256"] != recorded}
    # K2
    headers = {}
    for s in ctx.shards:
        headers[s["file"]] = json.loads(open(os.path.join(ctx.out, "headers", s["file"] + ".header.json"), "rb").read().decode("utf-8"))
    allT = tensors_of(headers, plan["header_bytes"])
    gone = "%s%d.%s" % (ctx.names["layer_prefix"], planted["K2"]["delete_layer"], ctx.names["time_step_bias_suffix"])
    linear = res["rows"]["S1"]["values"]["headers"]["with_linear_attn"]
    e1 = row_e1([x for x in allT if x["name"] != gone], linear, ctx.names, ctx.row["E1"]["params"]["expected"])
    tmp = os.path.join(ctx.out, "K2-must-not-exist.json")
    if os.path.exists(tmp):
        os.remove(tmp)
    fake_plan = {"rows": {"E1": e1, "E2": {"values": {"tensors": [x for x in plan["rows"]["E2"]["values"]["tensors"] if x["name"] != gone]}}}}
    # K3 reads the base bytes again; K2 uses them to show that no specification is built
    base = {}
    for x in plan["rows"]["E2"]["values"]["tensors"]:
        body, rec, _ = net.get(ctx.resolve(x["shard"]), x["first_byte"], x["last_byte"], kind="control-K3", name=x["name"], shard=shard[x["shard"]])
        base[x["name"]] = bytes(body)
    _, spec2 = edit_rows(ctx, fake_plan, base, ctx.row["E4"]["params"]["constant"])
    wrote = write_spec(tmp, spec2)
    out["K2"] = {"deleted": gone, "E1": e1["verdict"], "count": e1["values"]["count"], "layers_with_none": e1["values"]["layers_with_none"],
                 "specification_written": wrote is not None or os.path.exists(tmp),
                 "caught": e1["verdict"] == "REFUTED" and e1["values"]["count"] == len(plan["rows"]["E2"]["values"]["tensors"]) - 1 and wrote is None and not os.path.exists(tmp)}
    # K3
    e2 = {x["name"]: x["sha256"] for x in res["rows"]["E2"]["values"]["tensors"]}
    same_base = all(sha256(base[n]) == e2[n] for n in e2) and len(e2) == len(base)
    cw, cr = Fraction(planted["K3"]["constant"]), Fraction(ctx.row["E4"]["params"]["constant"])
    rej = {}
    for x in plan["rows"]["E2"]["values"]["tensors"]:
        if x["dtype"] not in FMT:
            continue
        E = edit_tensor(base[x["name"]], x["dtype"], cw)
        if "readings" in E:
            for k, n in rounding_failures(E, cr).items():
                rej[k] = rej.get(k, 0) + n
    _, spec3 = edit_rows(ctx, plan, base, planted["K3"]["constant"])
    wrong_sha = sha256((json.dumps(spec3, indent=1, ensure_ascii=True) + "\n").encode("ascii")) if spec3 else None
    real_sha = res["rows"]["E4"]["values"]["specification_sha256"]
    _, spec_again = edit_rows(ctx, plan, base, ctx.row["E4"]["params"]["constant"])
    again_sha = sha256((json.dumps(spec_again, indent=1, ensure_ascii=True) + "\n").encode("ascii")) if spec_again else None
    out["K3"] = {"constant": planted["K3"]["constant"], "base_bytes_equal_the_recorded": same_base, "entries_rejected_by_the_check": rej,
                 "specification_sha256_with_the_wrong_constant": wrong_sha, "specification_sha256": real_sha, "rebuilt_with_the_right_constant_equals_recorded": again_sha == real_sha,
                 "caught": bool(rej) and all(v > 0 for v in rej.values()) and wrong_sha is not None and wrong_sha != real_sha and again_sha == real_sha and same_base}
    # K4
    target = planted["K4"]["tensor"]
    f = next(x["file"] for x in allT if x["name"] == target)
    alt = json.loads(json.dumps(headers))
    alt[f][target]["dtype"] = planted["K4"]["dtype_to"]
    altT = tensors_of(alt, plan["header_bytes"])
    s3 = row_s3(altT)
    listed = target in [x["name"] for x in s3["values"]["not_bf16"]]
    lf = length_failures(altT)
    out["K4"] = {"tensor": target, "header_of": f, "dtype_to": planted["K4"]["dtype_to"], "S3": s3["verdict"], "S3_lists_the_tensor": listed, "length_check_failures": lf,
                 "length_check_failures_without_the_change": length_failures(allT),
                 "caught": listed and s3["verdict"] == "REFUTED" and lf == [target] and not length_failures(allT)}
    # K5
    battery_guard()
    body, rec, _ = net.get(ctx.resolve(t["file"]), t["first"], t["last"], kind="control-K5", name=name30, shard=shard[t["file"]])
    w1 = res["rows"]["W1"]["values"]
    cs0 = census_sha(census(body))
    same = rec["sha256"] == w1["sha256"] and cs0 == w1["census_sha256"]
    body[planted["K5"]["byte"]] ^= 1 << planted["K5"]["bit"]
    sha1, cs1 = sha256(body), census_sha(census(body))
    out["K5"] = {"tensor": name30, "byte": planted["K5"]["byte"], "bit": planted["K5"]["bit"], "reread_equals_recorded": same, "sha256": w1["sha256"], "sha256_after_the_flip": sha1,
                 "census_sha256": w1["census_sha256"], "census_sha256_after_the_flip": cs1, "caught": same and sha1 != w1["sha256"] and cs1 != w1["census_sha256"]}
    del body
    out["bytes_read"] = net.total
    dump(os.path.join(ctx.out, "controls.json"), out)
    for k in ("K1", "K2", "K3", "K4", "K5"):
        print("%s %s" % (k, "caught" if out[k]["caught"] else "NOT CAUGHT"))


def main(argv):
    try:
        ctx = Ctx(argv)
        cmds = {"offline": cmd_offline, "i1": cmd_i1, "i2": cmd_i2, "plan": cmd_plan, "run": cmd_run, "controls": cmd_controls}
        if ctx.cmd not in cmds:
            print(__doc__)
            return 2
        cmds[ctx.cmd](ctx)
        return 0
    except Stop as e:
        print("STOP: %s" % e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
