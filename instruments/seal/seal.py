#!/usr/bin/env python3
"""seal.py — Verify Seal v1: prove you held exact bytes by a date without revealing them.

Python standard library only. Nothing of the sealed content leaves the machine: the bundle's archive and salt stay with
the researcher; what goes out is one salted digest, anchored in public (OpenTimestamps and/or the registry's git commit).

  seal.py seal <path> [--out <dir>]      archive a file or folder deterministically, draw a 32-byte salt, write the bundle
  seal.py stamp <bundle>                 anchor the digest: `ots stamp` if the client is installed, else the exact steps
  seal.py open <bundle> [--by YYYY-MM-DD] [--registry <clone>]   recompute everything and decide: CERTIFIED / REFUTED / REFUSED
  seal.py digest <archive> <salt.hex>    the commitment of an archive and a salt, nothing else

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
    if meta.get("version") != VERSION:
        raise Refused("seal.json version %r is not %s; this opener reads only %s" % (meta.get("version"), VERSION, VERSION))
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
        raise Refused("unknown command " + cmd)
    except Refused as e:
        print(json.dumps({"verdict": "REFUSED", "reason": str(e)}))
        return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
