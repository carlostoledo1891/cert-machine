#!/usr/bin/env python3
"""seal.py — Verify Seal v1: prove you held exact bytes by a date without revealing them.

Python standard library only. Nothing of the sealed content leaves the machine: the bundle's archive and salt stay with
the researcher; what goes out is one salted digest, anchored in public (OpenTimestamps and/or the registry's git commit).

  seal.py seal <path> [--out <dir>]      archive a file or folder deterministically, draw a 32-byte salt, write the bundle
  seal.py stamp <bundle>                 anchor the digest: `ots stamp` if the client is installed, else the exact steps
  seal.py open <bundle> [--by YYYY-MM-DD] [--registry <clone>]   recompute everything and decide: CERTIFIED / REFUTED / REFUSED
  seal.py digest <archive> <salt.hex>    the commitment of an archive and a salt, nothing else

  v2, selective reveal (one file shown, the others stay sealed):
  seal.py seal2 <path> [--out <dir>]     seal a folder file by file: a manifest of salted per-file hashes, sealed as one digest
  seal.py reveal <bundle> <path> [--out <dir>]   the package that shows ONE sealed file: its bytes, its salt, the manifest
  seal.py verify <package> [--by YYYY-MM-DD] [--registry <clone>]   decide a revealed file under its sealed manifest
  seal.py open <bundle>                  also opens a v2 bundle whole (archive.tar + salts.json present): every file re-derived

THE COMMITMENT (verify-seal-v1, fixed; a change is a new version string)
  digest = SHA256( b"verify-seal-v1\\n" || salt_bytes || SHA256(archive_bytes) )
  salt_bytes: exactly 32 bytes, stored as 64 lowercase hex characters in salt.hex with NOTHING else (no newline);
  SHA256(archive_bytes): the 32 raw bytes of the archive's hash, not its hex.
  One line of shell re-derives it without this program (macOS: shasum -a 256; Linux: sha256sum):
    ( printf 'verify-seal-v1\\n'; xxd -r -p salt.hex; shasum -a 256 archive.tar | cut -c1-64 | xxd -r -p ) | shasum -a 256

THE ARCHIVE (deterministic: the same contents give the same bytes on any machine)
  a USTAR/GNU tar of the regular files under the path, names relative to it with '/' separators and NFC-normalised,
  sorted by their UTF-8 bytes; mtime 0, uid/gid 0, uname/gname empty, mode 0644 for every file; no directory entries,
  no symlinks (a symlink refuses the seal), no compression. A single file is archived under its own base name.

THE BUNDLE  <name>.seal/
  archive.tar · salt.hex · seal.json (version, digest, archive_sha256, salt_sha256, file_count, archive_bytes,
  created_at — a LOCAL claim, decided by nobody) · digest.txt (the digest + newline: the file to stamp) ·
  digest.txt.ots (after `stamp`, if ots is installed) · anchors.json (registry anchors the researcher records:
  [{"kind": "git", "commit": "<sha>", "path": "seals/registry.jsonl"}]).

THE VERDICT of `open`
  CERTIFIED  the archive and salt re-derive the recorded digest, and at least one public anchor is CONFIRMED here: the
             digest is in the anchor and the anchor's date is read; with --by D, the earliest confirmed anchor is on or
             before D. Every anchor is listed with its date.
  REFUTED    the digest does not re-derive: the input that differs is named (the archive, the salt, or the recorded
             digest itself).
  REFUSED    something is missing or not decidable here: no archive, no salt, a malformed salt, no anchor, an anchor
             not yet confirmed (an .ots not upgraded, the ots client absent, the registry clone not given), or every
             confirmed anchor later than the claimed date. The reason says what would make it decidable.
  A seal proves possession of exact bytes by a date. It does not say who first had the idea, that the idea is right,
  or anything about credit. Exit status: 0 CERTIFIED, 1 REFUTED, 2 REFUSED.

THE COMMITMENT, v2 (verify-seal-v2, fixed)
  per file i, with its own 32-byte salt s_i (drawn at sealing, kept PRIVATE in salts.json until that file is revealed):
    h_i = SHA256( b"verify-seal-v2-file\n" || s_i || SHA256(bytes_i) )          the file's salted hash
    q_i = SHA256( b"verify-seal-v2-path\n" || s_i || path_i_utf8 )              the file's salted path hash
  the manifest: canonical JSON {"version":"verify-seal-v2","files":[{"index":i,"path_hash":q_i,"sha256":h_i}, ...]}
  (sorted keys, no spaces, one trailing newline; files in the archive's order) — it names NO path and NO salt, so showing it
  reveals only how many files were sealed. digest = SHA256( b"verify-seal-v2\n" || salt_bytes || SHA256(manifest_bytes) ),
  one salt.hex for the manifest, anchored exactly as v1. Revealing file i publishes (path_i, s_i, bytes_i) and the manifest;
  the verifier recomputes h_i and q_i, finds both at index i, re-derives the manifest's digest and reads the anchors:
    CERTIFIED  this file, under a sealed manifest held by <date>; the other files stay unrevealed and undecided
    REFUTED    the revealed bytes, path or salt do not match the manifest at that index, or the manifest does not re-derive
    REFUSED    a part is missing or malformed, or no anchor is confirmed here (as v1)
  A revealed salt s_i exposes nothing about the other files: each has its own salt. The manifest's own line of shell:
    ( printf 'verify-seal-v2\n'; xxd -r -p salt.hex; shasum -a 256 manifest.json | cut -c1-64 | xxd -r -p ) | shasum -a 256
MIT · cert-machine"""
import hashlib
import io
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tarfile
import time
import unicodedata

VERSION = "verify-seal-v1"
PREFIX = b"verify-seal-v1\n"
VERSION2 = "verify-seal-v2"
PREFIX2 = b"verify-seal-v2\n"
FILE_PREFIX2 = b"verify-seal-v2-file\n"
PATH_PREFIX2 = b"verify-seal-v2-path\n"
REDERIVE2 = "( printf 'verify-seal-v2\\n'; xxd -r -p salt.hex; shasum -a 256 manifest.json | cut -c1-64 | xxd -r -p ) | shasum -a 256"
HEX64 = re.compile(r"[0-9a-f]{64}")   # used with fullmatch: `$` would let a trailing newline through (the battery caught it)
REDERIVE = "( printf 'verify-seal-v1\\n'; xxd -r -p salt.hex; shasum -a 256 archive.tar | cut -c1-64 | xxd -r -p ) | shasum -a 256"
REGISTRY_URL = "https://github.com/carlostoledo1891/cert-machine"
REGISTRY_PATH = "seals/registry.jsonl"


class Refused(Exception):
    pass


# ---------------------------------------------------------------- the archive
def _entries(root):
    """(archive name, absolute path) for every regular file under root, sorted by the name's UTF-8 bytes."""
    root = os.path.abspath(root)
    if os.path.islink(root):
        raise Refused("a symbolic link cannot be sealed (its target is not the bytes you hold): " + root)
    if os.path.isfile(root):
        return [(unicodedata.normalize("NFC", os.path.basename(root)), root)]
    if not os.path.isdir(root):
        raise Refused("no such file or folder: " + root)
    out = []
    for d, dirs, files in os.walk(root):
        dirs.sort()
        for f in files:
            p = os.path.join(d, f)
            if os.path.islink(p):
                raise Refused("a symbolic link inside the folder cannot be sealed: " + os.path.relpath(p, root))
            if not os.path.isfile(p):
                continue
            rel = os.path.relpath(p, root).replace(os.sep, "/")
            out.append((unicodedata.normalize("NFC", rel), p))
    out.sort(key=lambda e: e[0].encode("utf-8"))
    if not out:
        raise Refused("the folder holds no regular file; nothing to seal")
    names = [e[0] for e in out]
    if len(set(names)) != len(names):
        raise Refused("two files normalise to the same name (NFC): " + ", ".join(sorted({n for n in names if names.count(n) > 1})))
    return out


def archive_bytes(root):
    """the deterministic tar of root, as bytes"""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w", format=tarfile.GNU_FORMAT, encoding="utf-8") as tf:
        for name, p in _entries(root):
            ti = tarfile.TarInfo(name)
            ti.size = os.path.getsize(p)
            ti.mtime = 0
            ti.mode = 0o644
            ti.type = tarfile.REGTYPE
            ti.uid = ti.gid = 0
            ti.uname = ti.gname = ""
            with open(p, "rb") as fh:
                tf.addfile(ti, fh)
    return buf.getvalue()


# ---------------------------------------------------------------- the commitment
def sha256(b):
    return hashlib.sha256(b).digest()


def parse_salt(text):
    """salt.hex must be exactly 64 lowercase hex characters and nothing else"""
    if not isinstance(text, str):
        text = text.decode("utf-8", "replace")
    if not HEX64.fullmatch(text):
        what = "empty" if text == "" else ("%d character(s)" % len(text)) + (", ends in a newline" if text.endswith("\n") else "") + ("" if re.fullmatch(r"[0-9a-fA-F\s]*", text) else ", not all hex")
        raise Refused("salt.hex is not exactly 64 lowercase hex characters (" + what + ")")
    return bytes.fromhex(text)


def digest(archive, salt):
    return hashlib.sha256(PREFIX + salt + sha256(archive)).hexdigest()


# ---------------------------------------------------------------- seal
def cmd_seal(path, out=None):
    arch = archive_bytes(path)
    n = len(_entries(path))
    salt = secrets.token_bytes(32)
    d = digest(arch, salt)
    bundle = out or (os.path.basename(os.path.abspath(path).rstrip(os.sep)) + ".seal")
    if os.path.exists(bundle):
        raise Refused("the bundle exists; choose --out or remove it: " + bundle)
    os.makedirs(bundle)
    with open(os.path.join(bundle, "archive.tar"), "wb") as fh:
        fh.write(arch)
    with open(os.path.join(bundle, "salt.hex"), "w") as fh:
        fh.write(salt.hex())
    with open(os.path.join(bundle, "digest.txt"), "w") as fh:
        fh.write(d + "\n")
    meta = {"version": VERSION, "digest": d, "archive_sha256": sha256(arch).hex(), "salt_sha256": sha256(salt).hex(),
            "file_count": n, "archive_bytes": len(arch),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "created_at_is": "a local claim, decided by nobody; the date a seal proves is its anchors'",
            "commitment": "SHA256('verify-seal-v1\\n' || salt_bytes || SHA256(archive_bytes))", "rederive": REDERIVE}
    with open(os.path.join(bundle, "seal.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
        fh.write("\n")
    print(d)
    print("sealed %d file(s), %d archive bytes -> %s/ (archive.tar, salt.hex, seal.json, digest.txt)" % (n, len(arch), bundle), file=sys.stderr)
    print("next: python3 seal.py stamp %s   (keep the bundle private; only the digest leaves the machine)" % bundle, file=sys.stderr)
    return d


# ---------------------------------------------------------------- stamp
def cmd_stamp(target):
    bundle = target[:-len("/seal.json")] if target.endswith("seal.json") else target
    bundle = os.path.dirname(target) if os.path.isfile(target) else target
    dt = os.path.join(bundle, "digest.txt")
    if not os.path.isfile(dt):
        raise Refused("no digest.txt in " + bundle + " (seal first)")
    d = open(dt).read().strip()
    ots = shutil.which("ots")
    if ots:
        r = subprocess.run([ots, "stamp", dt], capture_output=True, text=True)
        print((r.stdout + r.stderr).strip())
        if r.returncode == 0 and os.path.isfile(dt + ".ots"):
            print("stamped: %s.ots — in an hour or two run `ots upgrade %s.ots`, then `open` confirms the Bitcoin date" % (dt, dt))
        else:
            print("ots stamp did not write %s.ots (exit %d); the manual steps below still apply" % (dt, r.returncode))
    else:
        print("the ots client is not installed. Anchor 1, OpenTimestamps (a Bitcoin-attested date, free):")
        print("  1. pip install opentimestamps-client")
        print("  2. ots stamp %s            -> writes %s.ots (a pending attestation)" % (dt, dt))
        print("  3. after an hour or two: ots upgrade %s.ots   -> the Bitcoin block attestation" % dt)
        print("  4. ots verify %s.ots       -> 'Bitcoin block N attests existence as of <date>'" % dt)
    print("Anchor 2, the public registry (a git commit's date, independent of Bitcoin): post this line, nothing else —")
    print("  " + VERSION + " " + d)
    print("  at " + REGISTRY_URL + "/issues/new?template=seal.yml ; when the maintainer commits it to " + REGISTRY_PATH)
    print("  record the commit in anchors.json: [{\"kind\": \"git\", \"commit\": \"<sha>\", \"path\": \"" + REGISTRY_PATH + "\"}]")


# ---------------------------------------------------------------- open
def _git(clone, *args):
    r = subprocess.run(["git", "-C", clone] + list(args), capture_output=True, text=True)
    if r.returncode != 0:
        raise Refused("git " + " ".join(args) + ": " + (r.stderr.strip() or "exit %d" % r.returncode))
    return r.stdout


def anchors_of(bundle, d, registry=None):
    """every anchor the bundle names, each confirmed here or not, with its date when confirmed"""
    out = []
    ots_file = os.path.join(bundle, "digest.txt.ots")
    if os.path.isfile(ots_file):
        a = {"kind": "opentimestamps", "file": "digest.txt.ots", "confirmed": False, "date": None}
        ots = shutil.which("ots")
        if not ots:
            a["why"] = "the ots client is not installed here (pip install opentimestamps-client), so the attestation is not read"
        else:
            r = subprocess.run([ots, "verify", ots_file], capture_output=True, text=True)
            txt = (r.stdout + r.stderr)
            m = re.search(r"Bitcoin block (\d+) attests (?:data )?existence as of (\d{4}-\d{2}-\d{2})", txt)
            if m:
                a.update(confirmed=True, date=m.group(2), block=int(m.group(1)))
            else:
                a["why"] = "ots verify did not report a Bitcoin block (pending? run `ots upgrade`; a Bitcoin node or `--no-bitcoin` may be needed): " + txt.strip()[-200:]
        out.append(a)
    aj = os.path.join(bundle, "anchors.json")
    if os.path.isfile(aj):
        try:
            lst = json.load(open(aj))
        except Exception as e:
            raise Refused("anchors.json does not parse: " + str(e))
        for x in lst if isinstance(lst, list) else []:
            if x.get("kind") != "git":
                out.append({"kind": str(x.get("kind")), "confirmed": False, "date": None, "why": "an anchor kind this version does not read"})
                continue
            a = {"kind": "git", "commit": x.get("commit"), "path": x.get("path", REGISTRY_PATH), "confirmed": False, "date": None}
            if not registry:
                a["why"] = "no --registry <clone> given, so the commit is not read (git clone " + REGISTRY_URL + ")"
            elif not re.fullmatch(r"[0-9a-f]{7,40}", str(a["commit"] or "")):
                a["why"] = "the anchor names no commit sha"
            else:
                try:
                    content = _git(registry, "show", a["commit"] + ":" + a["path"])
                    lines = [ln.strip() for ln in content.splitlines()]
                    hit = [ln for ln in lines if d in ln]
                    if not hit:
                        a["why"] = "the digest is not in " + a["path"] + " at that commit"
                    else:
                        a["date"] = _git(registry, "show", "-s", "--format=%cI", a["commit"]).strip()[:10]
                        a["confirmed"] = True
                        a["line"] = hit[0]
                except Refused as e:
                    a["why"] = str(e)
            out.append(a)
    return out


def cmd_open(bundle, by=None, registry=None):
    try:
        v = _open(bundle, by, registry)
    except Refused as e:
        v = {"verdict": "REFUSED", "reason": str(e)}
    print(json.dumps(v, indent=1))
    return {"CERTIFIED": 0, "REFUTED": 1, "REFUSED": 2}[v["verdict"]]


def _open(bundle, by, registry):
    if not os.path.isdir(bundle):
        raise Refused("no bundle directory at " + bundle)
    sj = os.path.join(bundle, "seal.json")
    if not os.path.isfile(sj):
        raise Refused("seal.json is missing; the bundle cannot be opened without the recorded digest")
    try:
        meta = json.load(open(sj))
    except Exception as e:
        raise Refused("seal.json does not parse: " + str(e))
    if meta.get("version") == VERSION2:
        return _open_v2(bundle, meta, by, registry)
    if meta.get("version") != VERSION:
        raise Refused("seal.json version %r is not %s or %s; this opener reads only those" % (meta.get("version"), VERSION, VERSION2))
    rec = str(meta.get("digest", ""))
    if not HEX64.fullmatch(rec):
        raise Refused("seal.json carries no 64-hex digest")
    ap = os.path.join(bundle, "archive.tar")
    if not os.path.isfile(ap):
        raise Refused("archive.tar is missing: without the bytes there is nothing to re-derive (the researcher holds it)")
    sp = os.path.join(bundle, "salt.hex")
    if not os.path.isfile(sp):
        raise Refused("salt.hex is missing: without the salt the digest cannot be re-derived (a lost salt is an unopenable seal)")
    salt = parse_salt(open(sp, "rb").read())
    arch = open(ap, "rb").read()
    a_sha = sha256(arch).hex()
    s_sha = sha256(salt).hex()
    d = digest(arch, salt)
    out = {"digest": d, "recorded_digest": rec, "archive_sha256": a_sha, "archive_bytes": len(arch),
           "claimed_at": meta.get("created_at"), "claimed_at_is": "a local claim, decided by nobody"}
    if d != rec:
        if meta.get("archive_sha256") and a_sha != meta["archive_sha256"]:
            which = "the archive: its sha256 is not the one sealed (a byte, a file or a name inside it differs)"
        elif meta.get("salt_sha256") and s_sha != meta["salt_sha256"]:
            which = "the salt: salt.hex is not the salt drawn at sealing"
        elif meta.get("archive_sha256") and meta.get("salt_sha256"):
            which = "the recorded digest itself: archive and salt are the sealed ones, so seal.json's digest was edited"
        else:
            which = "the archive or the salt (seal.json records no component hashes to tell which)"
        out.update(verdict="REFUTED", reason="the digest does not re-derive; what differs is " + which)
        return out
    anchors = anchors_of(bundle, d, registry)
    out["anchors"] = anchors
    confirmed = [a for a in anchors if a["confirmed"]]
    if not anchors:
        out.update(verdict="REFUSED", reason="the digest re-derives, but no public anchor is in the bundle: the date is only a local claim. Decidable once `stamp` anchors it (digest.txt.ots and/or a registry commit in anchors.json)")
        return out
    if not confirmed:
        out.update(verdict="REFUSED", reason="the digest re-derives, but no anchor is confirmed here: " + "; ".join(a.get("why", "?") for a in anchors))
        return out
    earliest = min(a["date"] for a in confirmed)
    out["held_by"] = earliest
    if by:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", by):
            raise Refused("--by takes YYYY-MM-DD")
        if earliest > by:
            out.update(verdict="REFUSED", reason="the digest re-derives and the earliest confirmed anchor is dated %s, after the claimed %s: possession by %s is not decidable from the anchors (an earlier anchor would decide it)" % (earliest, by, by))
            return out
    out.update(verdict="CERTIFIED", reason="the archive and salt re-derive the recorded digest; %d anchor(s) confirmed; the bytes were held by %s%s" % (len(confirmed), earliest, (" (on or before the claimed %s)" % by) if by else ""))
    return out


# ---------------------------------------------------------------- v2: the manifest, the reveal, the verifier
def file_hash(salt_i, data):
    """h_i: the salted hash of one file's bytes"""
    return hashlib.sha256(FILE_PREFIX2 + salt_i + sha256(data)).hexdigest()


def path_hash(salt_i, path):
    """q_i: the salted hash of one file's archive name (NFC, '/' separators)"""
    return hashlib.sha256(PATH_PREFIX2 + salt_i + unicodedata.normalize("NFC", path).encode("utf-8")).hexdigest()


def manifest_bytes(files):
    """the canonical bytes of a manifest: sorted keys, no spaces, one trailing newline"""
    return (json.dumps({"version": VERSION2, "files": [{"index": f["index"], "path_hash": f["path_hash"], "sha256": f["sha256"]} for f in files]},
                       sort_keys=True, separators=(",", ":"), ensure_ascii=True) + "\n").encode("utf-8")


def digest2(manifest, salt):
    return hashlib.sha256(PREFIX2 + salt + sha256(manifest)).hexdigest()


def _read_manifest(path):
    if not os.path.isfile(path):
        raise Refused("manifest.json is missing")
    raw = open(path, "rb").read()
    try:
        m = json.loads(raw.decode("utf-8"))
    except Exception as e:
        raise Refused("manifest.json does not parse: " + str(e))
    if not isinstance(m, dict) or m.get("version") != VERSION2 or not isinstance(m.get("files"), list):
        raise Refused("manifest.json is not a %s manifest" % VERSION2)
    files = m["files"]
    for i, f in enumerate(files):
        if not isinstance(f, dict) or f.get("index") != i or not HEX64.fullmatch(str(f.get("path_hash", ""))) or not HEX64.fullmatch(str(f.get("sha256", ""))):
            raise Refused("manifest.json entry %d is malformed (index, path_hash and sha256 must be present, in order)" % i)
    if manifest_bytes(files) != raw:
        raise Refused("manifest.json is not in canonical form (sorted keys, no spaces, one trailing newline): re-derive it with manifest_bytes")
    return files, raw


def cmd_seal2(path, out=None):
    entries = _entries(path)
    bundle = out or (os.path.basename(os.path.abspath(path).rstrip(os.sep)) + ".seal2")
    if os.path.exists(bundle):
        raise Refused("the bundle exists; choose --out or remove it: " + bundle)
    files, salts = [], []
    for i, (name, p) in enumerate(entries):
        s_i = secrets.token_bytes(32)
        data = open(p, "rb").read()
        files.append({"index": i, "path_hash": path_hash(s_i, name), "sha256": file_hash(s_i, data)})
        salts.append({"index": i, "path": name, "salt": s_i.hex(), "bytes": len(data)})
    man = manifest_bytes(files)
    salt = secrets.token_bytes(32)
    d = digest2(man, salt)
    arch = archive_bytes(path)
    os.makedirs(bundle)
    with open(os.path.join(bundle, "manifest.json"), "wb") as fh:
        fh.write(man)
    with open(os.path.join(bundle, "salts.json"), "w") as fh:
        json.dump({"version": VERSION2, "private": "the per-file salts: keep with the bundle, never publish; revealing file i publishes salt i only", "files": salts}, fh, indent=1)
        fh.write("\n")
    with open(os.path.join(bundle, "archive.tar"), "wb") as fh:
        fh.write(arch)
    with open(os.path.join(bundle, "salt.hex"), "w") as fh:
        fh.write(salt.hex())
    with open(os.path.join(bundle, "digest.txt"), "w") as fh:
        fh.write(d + "\n")
    meta = {"version": VERSION2, "digest": d, "manifest_sha256": sha256(man).hex(), "salt_sha256": sha256(salt).hex(),
            "file_count": len(files), "manifest_bytes": len(man), "archive_sha256": sha256(arch).hex(), "archive_bytes": len(arch),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "created_at_is": "a local claim, decided by nobody; the date a seal proves is its anchors'",
            "commitment": "SHA256('verify-seal-v2\\n' || salt_bytes || SHA256(manifest_bytes)); per file h_i = SHA256('verify-seal-v2-file\\n' || s_i || SHA256(bytes_i)), q_i = SHA256('verify-seal-v2-path\\n' || s_i || path_i)",
            "rederive": REDERIVE2}
    with open(os.path.join(bundle, "seal.json"), "w") as fh:
        json.dump(meta, fh, indent=1)
        fh.write("\n")
    print(d)
    print("sealed %d file(s) file by file -> %s/ (manifest.json, salts.json [private], archive.tar [private], salt.hex, seal.json, digest.txt)" % (len(files), bundle), file=sys.stderr)
    print("next: python3 seal.py stamp %s ; to show one file later: python3 seal.py reveal %s <path>" % (bundle, bundle), file=sys.stderr)
    return d


def _bundle_v2(bundle):
    sj = os.path.join(bundle, "seal.json")
    if not os.path.isdir(bundle):
        raise Refused("no bundle directory at " + bundle)
    if not os.path.isfile(sj):
        raise Refused("seal.json is missing; the bundle cannot be opened without the recorded digest")
    try:
        meta = json.load(open(sj))
    except Exception as e:
        raise Refused("seal.json does not parse: " + str(e))
    return meta


def cmd_reveal(bundle, path, out=None):
    meta = _bundle_v2(bundle)
    if meta.get("version") != VERSION2:
        raise Refused("reveal needs a %s bundle (seal2); this one is %r" % (VERSION2, meta.get("version")))
    files, man = _read_manifest(os.path.join(bundle, "manifest.json"))
    sp = os.path.join(bundle, "salts.json")
    if not os.path.isfile(sp):
        raise Refused("salts.json is missing: without the per-file salts nothing can be revealed (a lost salt is an unopenable seal)")
    salts = json.load(open(sp)).get("files", [])
    name = unicodedata.normalize("NFC", path.replace(os.sep, "/"))
    hit = [x for x in salts if x.get("path") == name]
    if not hit:
        raise Refused("no sealed file is named %r (the names are the archive's: relative, '/' separators)" % name)
    x = hit[0]
    i = x["index"]
    buf = io.BytesIO(open(os.path.join(bundle, "archive.tar"), "rb").read())
    with tarfile.open(fileobj=buf, mode="r") as tf:
        try:
            data = tf.extractfile(tf.getmember(name)).read()
        except KeyError:
            raise Refused("the archive holds no entry %r" % name)
    pkg = out or (os.path.basename(bundle.rstrip(os.sep)).replace(".seal2", "") + ".reveal-" + str(i))
    if os.path.exists(pkg):
        raise Refused("the package exists; choose --out or remove it: " + pkg)
    os.makedirs(os.path.join(pkg, "files", os.path.dirname(name)) if os.path.dirname(name) else os.path.join(pkg, "files"))
    with open(os.path.join(pkg, "files", name), "wb") as fh:
        fh.write(data)
    with open(os.path.join(pkg, "manifest.json"), "wb") as fh:
        fh.write(man)
    with open(os.path.join(pkg, "reveal.json"), "w") as fh:
        json.dump({"version": VERSION2, "index": i, "path": name, "salt": x["salt"], "bytes": len(data), "revealed": "this file only; the manifest names no other path and no other salt"}, fh, indent=1)
        fh.write("\n")
    for f in ("seal.json", "salt.hex", "digest.txt", "digest.txt.ots", "anchors.json"):
        src = os.path.join(bundle, f)
        if os.path.isfile(src):
            shutil.copyfile(src, os.path.join(pkg, f))
    print(json.dumps({"package": pkg, "index": i, "path": name, "bytes": len(data), "contains": "the file, its salt, the manifest, the manifest's seal and anchors — nothing of the other files"}, indent=1))
    return pkg


def _manifest_seal(d_dir, meta):
    """the manifest's own seal: re-derive the digest from manifest.json and salt.hex; the anchors read as v1"""
    files, man = _read_manifest(os.path.join(d_dir, "manifest.json"))
    sp = os.path.join(d_dir, "salt.hex")
    if not os.path.isfile(sp):
        raise Refused("salt.hex (the manifest's salt) is missing")
    salt = parse_salt(open(sp, "rb").read())
    rec = str(meta.get("digest", ""))
    if not HEX64.fullmatch(rec):
        raise Refused("seal.json carries no 64-hex digest")
    d = digest2(man, salt)
    return files, man, salt, d, rec


def cmd_verify(pkg, by=None, registry=None):
    try:
        v = _verify(pkg, by, registry)
    except Refused as e:
        v = {"verdict": "REFUSED", "reason": str(e)}
    print(json.dumps(v, indent=1))
    return {"CERTIFIED": 0, "REFUTED": 1, "REFUSED": 2}[v["verdict"]]


def _verify(pkg, by, registry):
    meta = _bundle_v2(pkg)
    if meta.get("version") != VERSION2:
        raise Refused("seal.json version %r is not %s; this verifier reads only %s" % (meta.get("version"), VERSION2, VERSION2))
    rj = os.path.join(pkg, "reveal.json")
    if not os.path.isfile(rj):
        raise Refused("reveal.json is missing: which file is revealed, its salt and its name")
    try:
        r = json.load(open(rj))
    except Exception as e:
        raise Refused("reveal.json does not parse: " + str(e))
    if r.get("version") != VERSION2 or not isinstance(r.get("index"), int) or not isinstance(r.get("path"), str):
        raise Refused("reveal.json is malformed (version, index, path, salt)")
    s_i = parse_salt(str(r.get("salt", "")))
    name = unicodedata.normalize("NFC", r["path"])
    fp = os.path.join(pkg, "files", name)
    if not os.path.isfile(fp):
        raise Refused("the revealed file is missing from the package: files/" + name)
    data = open(fp, "rb").read()
    files, man, salt, d, rec = _manifest_seal(pkg, meta)
    out = {"index": r["index"], "path": name, "bytes": len(data), "digest": d, "recorded_digest": rec, "manifest_files": len(files),
           "claimed_at": meta.get("created_at"), "claimed_at_is": "a local claim, decided by nobody"}
    if d != rec:
        which = "the manifest: its sha256 is not the one sealed" if meta.get("manifest_sha256") and sha256(man).hex() != meta["manifest_sha256"] else \
                "the salt: salt.hex is not the manifest's salt" if meta.get("salt_sha256") and sha256(salt).hex() != meta["salt_sha256"] else \
                "the recorded digest itself"
        out.update(verdict="REFUTED", reason="the manifest's digest does not re-derive; what differs is " + which + " — nothing under it is decided")
        return out
    i = r["index"]
    if not (0 <= i < len(files)):
        out.update(verdict="REFUTED", reason="reveal.json names index %d, but the sealed manifest holds %d file(s): no such sealed file" % (i, len(files)))
        return out
    h, q = file_hash(s_i, data), path_hash(s_i, name)
    if files[i]["sha256"] != h and files[i]["path_hash"] != q:
        out.update(verdict="REFUTED", reason="neither the revealed bytes nor the revealed name re-derive the manifest's entry %d under this salt: not the file that was sealed there" % i)
        return out
    if files[i]["sha256"] != h:
        out.update(verdict="REFUTED", reason="the revealed bytes do not re-derive the manifest's sha256 at index %d (the name does): the bytes differ from the sealed ones" % i)
        return out
    if files[i]["path_hash"] != q:
        out.update(verdict="REFUTED", reason="the revealed name does not re-derive the manifest's path_hash at index %d (the bytes do): the file was sealed under another name" % i)
        return out
    out["file_sha256"] = h
    out["path_hash"] = q
    anchors = anchors_of(pkg, d, registry)
    out["anchors"] = anchors
    confirmed = [a for a in anchors if a["confirmed"]]
    if not anchors:
        out.update(verdict="REFUSED", reason="the file and the manifest re-derive, but no public anchor is in the package: the date is only a local claim")
        return out
    if not confirmed:
        out.update(verdict="REFUSED", reason="the file and the manifest re-derive, but no anchor is confirmed here: " + "; ".join(a.get("why", "?") for a in anchors))
        return out
    earliest = min(a["date"] for a in confirmed)
    out["held_by"] = earliest
    if by:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", by):
            raise Refused("--by takes YYYY-MM-DD")
        if earliest > by:
            out.update(verdict="REFUSED", reason="the file re-derives under the sealed manifest and the earliest confirmed anchor is dated %s, after the claimed %s: possession by %s is not decidable from the anchors" % (earliest, by, by))
            return out
    out.update(verdict="CERTIFIED", reason="this file re-derives its salted hash and its salted name at index %d of a manifest whose seal re-derives; %d anchor(s) confirmed; the file was held by %s%s. The other %d file(s) stay unrevealed and undecided." % (i, len(confirmed), earliest, (" (on or before the claimed " + by + ")") if by else "", len(files) - 1))
    return out


def _open_v2(bundle, meta, by, registry):
    """a v2 bundle opened whole: every file in archive.tar re-derives its manifest entry under salts.json, and the manifest's seal re-derives"""
    files, man, salt, d, rec = _manifest_seal(bundle, meta)
    out = {"digest": d, "recorded_digest": rec, "manifest_files": len(files), "claimed_at": meta.get("created_at"), "claimed_at_is": "a local claim, decided by nobody"}
    if d != rec:
        out.update(verdict="REFUTED", reason="the manifest's digest does not re-derive (the manifest, the salt or the recorded digest differs)")
        return out
    sp = os.path.join(bundle, "salts.json")
    ap = os.path.join(bundle, "archive.tar")
    if not os.path.isfile(sp):
        raise Refused("salts.json is missing: without the per-file salts the files cannot be re-derived (reveal packages carry one salt each)")
    if not os.path.isfile(ap):
        raise Refused("archive.tar is missing: without the bytes there is nothing to re-derive")
    salts = json.load(open(sp)).get("files", [])
    if len(salts) != len(files):
        out.update(verdict="REFUTED", reason="salts.json holds %d salt(s) for a manifest of %d file(s)" % (len(salts), len(files)))
        return out
    buf = io.BytesIO(open(ap, "rb").read())
    bad = []
    with tarfile.open(fileobj=buf, mode="r") as tf:
        members = {m.name: m for m in tf.getmembers()}
        for x in salts:
            i, name = x.get("index"), x.get("path")
            try:
                s_i = parse_salt(str(x.get("salt", "")))
            except Refused:
                bad.append("index %s: a malformed salt" % i); continue
            if name not in members:
                bad.append("index %s: %r is not in the archive" % (i, name)); continue
            data = tf.extractfile(members[name]).read()
            if not (isinstance(i, int) and 0 <= i < len(files)):
                bad.append("index %s: not in the manifest" % i); continue
            if files[i]["sha256"] != file_hash(s_i, data) or files[i]["path_hash"] != path_hash(s_i, name):
                bad.append("index %d (%s): the bytes or the name do not re-derive the manifest's entry" % (i, name))
        extra = sorted(set(members) - {x.get("path") for x in salts})
    if extra:
        bad.append("archive entries with no salt: " + ", ".join(extra[:5]))
    if bad:
        out.update(verdict="REFUTED", reason="the manifest's seal re-derives but %d file(s) do not: " % len(bad) + "; ".join(bad[:6]))
        return out
    anchors = anchors_of(bundle, d, registry)
    out["anchors"] = anchors
    confirmed = [a for a in anchors if a["confirmed"]]
    if not anchors:
        out.update(verdict="REFUSED", reason="every file re-derives, but no public anchor is in the bundle: the date is only a local claim")
        return out
    if not confirmed:
        out.update(verdict="REFUSED", reason="every file re-derives, but no anchor is confirmed here: " + "; ".join(a.get("why", "?") for a in anchors))
        return out
    earliest = min(a["date"] for a in confirmed)
    out["held_by"] = earliest
    if by:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", by):
            raise Refused("--by takes YYYY-MM-DD")
        if earliest > by:
            out.update(verdict="REFUSED", reason="every file re-derives and the earliest confirmed anchor is dated %s, after the claimed %s" % (earliest, by))
            return out
    out.update(verdict="CERTIFIED", reason="all %d file(s) re-derive their salted hashes and names under a manifest whose seal re-derives; %d anchor(s) confirmed; the bytes were held by %s" % (len(files), len(confirmed), earliest))
    return out


# ---------------------------------------------------------------- main
def main(argv):
    if len(argv) < 2 or argv[1] in ("-h", "--help"):
        print(__doc__)
        return 2
    cmd, args = argv[1], argv[2:]
    try:
        if cmd == "seal":
            if not args:
                raise Refused("seal <path> [--out <dir>]")
            out = args[args.index("--out") + 1] if "--out" in args else None
            cmd_seal(args[0], out)
            return 0
        if cmd == "stamp":
            if not args:
                raise Refused("stamp <bundle>")
            cmd_stamp(args[0])
            return 0
        if cmd == "open":
            if not args:
                raise Refused("open <bundle> [--by YYYY-MM-DD] [--registry <clone>]")
            by = args[args.index("--by") + 1] if "--by" in args else None
            reg = args[args.index("--registry") + 1] if "--registry" in args else None
            return cmd_open(args[0], by, reg)
        if cmd == "digest":
            if len(args) != 2:
                raise Refused("digest <archive> <salt.hex>")
            print(digest(open(args[0], "rb").read(), parse_salt(open(args[1], "rb").read())))
            return 0
        if cmd == "seal2":
            if not args:
                raise Refused("seal2 <path> [--out <dir>]")
            out = args[args.index("--out") + 1] if "--out" in args else None
            cmd_seal2(args[0], out)
            return 0
        if cmd == "reveal":
            if len(args) < 2:
                raise Refused("reveal <bundle> <path> [--out <dir>]")
            out = args[args.index("--out") + 1] if "--out" in args else None
            cmd_reveal(args[0], args[1], out)
            return 0
        if cmd == "verify":
            if not args:
                raise Refused("verify <package> [--by YYYY-MM-DD] [--registry <clone>]")
            by = args[args.index("--by") + 1] if "--by" in args else None
            reg = args[args.index("--registry") + 1] if "--registry" in args else None
            return cmd_verify(args[0], by, reg)
        raise Refused("unknown command " + cmd)
    except Refused as e:
        print(json.dumps({"verdict": "REFUSED", "reason": str(e)}))
        return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
