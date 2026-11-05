#!/usr/bin/env python3
"""battery.py — the Verify Seal battery: planted forgeries that must be REFUTED or REFUSED, never CERTIFIED; the
determinism check that must be CERTIFIED; the date rule; the shell re-derivation against the Python digest.

Everything runs in a temporary directory with a temporary git registry (the public registry is the same shape:
seals/registry.jsonl, one line per digest, the commit's date as the anchor). No network, no ots client needed. The
OpenTimestamps path without a Bitcoin node (the .ots read by `ots --no-bitcoin verify`, the block header read from
public explorers) runs against stand-ins: an `ots` script on PATH that names a block and a merkle root, and two local
explorers serving block 974704's real 80-byte header; the confirmation logic is what is tested, not the network.

usage: python3 instruments/seal/battery.py            -> certs/seal-battery.json
       python3 instruments/seal/battery.py --check    re-runs everything and compares with the record; nothing written
Record format: planted, certified (must be 0), by case; red controls (a check that must fail under a broken opener).
MIT · cert-machine"""
import hashlib
import http.server
import io
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SEAL = os.path.join(HERE, "seal.py")
OUT = os.path.join(ROOT, "certs", "seal-battery.json")
CHECK = "--check" in sys.argv
sys.path.insert(0, HERE)
import seal as S  # noqa: E402

t0 = time.time()
# block 974704 of Bitcoin mainnet (2026-11-05 20:34:20 UTC), the 80 bytes as blockstream.info and mempool.space serve them
BLOCK_974704 = "0000ff3facb76d278d1b2e1af079b2de0ff5da5c0c97485a970601000000000000000000908b707b0ef29be8607aa03a89da6318a2d8a2ba89bcc48834bde3af913c86494ce8ec6aace50117c4dc3f47"


def run(*args, cwd=None, env=None):
    r = subprocess.run([sys.executable, "-I", SEAL] + list(args), capture_output=True, text=True, cwd=cwd, env=env)
    try:
        v = json.loads(r.stdout)                      # `open` prints one JSON document
    except Exception:
        try:
            v = json.loads(r.stdout.strip().splitlines()[-1])   # `seal` prints the digest, a refusal prints one line
        except Exception:
            v = {"verdict": "?", "raw": r.stdout[-300:] + r.stderr[-300:]}
    v["exit"] = r.returncode
    return v


def git(repo, *args):
    env = dict(os.environ, GIT_AUTHOR_NAME="battery", GIT_AUTHOR_EMAIL="b@x", GIT_COMMITTER_NAME="battery", GIT_COMMITTER_EMAIL="b@x")
    r = subprocess.run(["git", "-C", repo] + list(args), capture_output=True, text=True, env=env)
    if r.returncode != 0:
        raise SystemExit("git failed: " + " ".join(args) + "\n" + r.stderr)
    return r.stdout.strip()


def make_idea(root, variant=0):
    """the same contents written in different ways: another order of creation, other mtimes, other modes, a locale"""
    os.makedirs(os.path.join(root, "notes", "deep"))
    files = [("statement.md", "Theorem. Every sufficiently large even integer is the sum of two primes.\n"),
             ("notes/deep/lemma-3.tex", "\\begin{lemma} ... \\end{lemma}\n"),
             ("notes/plan.txt", "attack via the circle method; do not paste into a cloud model\n"),
             ("données.txt", "accents in a name, NFC on every machine\n")]
    order = files if variant == 0 else list(reversed(files))
    for name, body in order:
        p = os.path.join(root, name)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(body)
        os.chmod(p, 0o644 if variant == 0 else 0o755)
        os.utime(p, (0, 0) if variant == 0 else (1700000000, 1700000000))
    return root


def registry_with(digest, date_env=None):
    """a temporary git registry holding one line with the digest; returns (clone path, commit sha)"""
    repo = tempfile.mkdtemp(prefix="seal-registry-")
    git(repo, "init", "-q")
    os.makedirs(os.path.join(repo, "seals"))
    with open(os.path.join(repo, "seals", "registry.jsonl"), "a") as fh:
        fh.write(json.dumps({"digest": digest, "version": "verify-seal-v1", "posted": "battery"}) + "\n")
    git(repo, "add", "-A")
    env_date = {"GIT_COMMITTER_DATE": date_env, "GIT_AUTHOR_DATE": date_env} if date_env else {}
    env = dict(os.environ, GIT_AUTHOR_NAME="battery", GIT_AUTHOR_EMAIL="b@x", GIT_COMMITTER_NAME="battery", GIT_COMMITTER_EMAIL="b@x", **env_date)
    r = subprocess.run(["git", "-C", repo, "commit", "-q", "-m", "seal"], capture_output=True, text=True, env=env)
    if r.returncode != 0:
        raise SystemExit("git commit failed: " + r.stderr)
    return repo, git(repo, "rev-parse", "HEAD")


def anchors(bundle, commit):
    with open(os.path.join(bundle, "anchors.json"), "w") as fh:
        json.dump([{"kind": "git", "commit": commit, "path": "seals/registry.jsonl"}], fh)


def copy_bundle(src):
    d = tempfile.mkdtemp(prefix="seal-case-")
    dst = os.path.join(d, "b.seal")
    shutil.copytree(src, dst)
    return dst


def main():
    work = tempfile.mkdtemp(prefix="seal-battery-")
    idea = make_idea(os.path.join(work, "idea"))
    bundle = os.path.join(work, "idea.seal")
    r = subprocess.run([sys.executable, "-I", SEAL, "seal", idea, "--out", bundle], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    digest = r.stdout.strip()
    meta = json.load(open(os.path.join(bundle, "seal.json")))
    assert meta["digest"] == digest
    repo, commit = registry_with(digest, "2026-11-03T12:00:00+0000")
    anchors(bundle, commit)
    cases = []

    def case(name, verdict, want, note=""):
        cases.append({"case": name, "verdict": verdict["verdict"], "reason": verdict.get("reason", ""), "want": want,
                      "pass": (verdict["verdict"] in want) if isinstance(want, tuple) else (verdict["verdict"] == want), "note": note})

    # the honest seal, anchored: CERTIFIED, the anchor's date read
    v = run("open", bundle, "--registry", repo)
    case("the honest seal with a registry anchor", v, "CERTIFIED", "held_by " + str(v.get("held_by")))
    assert v.get("held_by") == "2026-11-03", v
    # the date rule
    case("claimed --by a date on the anchor's day", run("open", bundle, "--by", "2026-11-03", "--registry", repo), "CERTIFIED")
    case("claimed --by a date AFTER the anchor (a later claim is weaker, still decidable)", run("open", bundle, "--by", "2026-12-01", "--registry", repo), "CERTIFIED")
    case("an anchor dated after the claimed date (--by 2026-11-01, anchor 2026-11-03)", run("open", bundle, "--by", "2026-11-01", "--registry", repo), ("REFUSED", "REFUTED"))
    # no anchor / unconfirmed anchors
    nb = copy_bundle(bundle); os.remove(os.path.join(nb, "anchors.json"))
    case("no anchor at all", run("open", nb), ("REFUSED",))
    case("a registry anchor without the clone", run("open", bundle), ("REFUSED",))
    ob = copy_bundle(bundle); os.remove(os.path.join(ob, "anchors.json")); open(os.path.join(ob, "digest.txt.ots"), "wb").write(b"\x00OpenTimestamps")
    case("an .ots present but not confirmable here", run("open", ob), ("REFUSED",))
    wrong_repo, wrong_commit = registry_with("0" * 64, "2026-11-02T12:00:00+0000")
    wb = copy_bundle(bundle); anchors(wb, wrong_commit)
    case("a registry commit that does not hold this digest", run("open", wb, "--registry", wrong_repo), ("REFUSED",))

    # ---- planted forgeries: each must be REFUTED or REFUSED, never CERTIFIED
    forg = []

    def forged(name, b, want=("REFUTED", "REFUSED")):
        v = run("open", b, "--registry", repo)
        forg.append({"forgery": name, "verdict": v["verdict"], "reason": v.get("reason", ""), "certified": v["verdict"] == "CERTIFIED"})
        case("forgery: " + name, v, want)

    b = copy_bundle(bundle)
    p = os.path.join(b, "archive.tar"); data = bytearray(open(p, "rb").read()); i = data.index(b"Theorem"); data[i] ^= 0x01; open(p, "wb").write(data)
    forged("one byte flipped in the archive", b, ("REFUTED",))
    b = copy_bundle(bundle); open(os.path.join(b, "salt.hex"), "w").write("f" * 64)
    forged("wrong salt (64 hex, another value)", b, ("REFUTED",))
    b = copy_bundle(bundle); open(os.path.join(b, "salt.hex"), "w").write(open(os.path.join(bundle, "salt.hex")).read()[:60])
    forged("truncated salt (60 hex)", b, ("REFUSED",))
    b = copy_bundle(bundle); open(os.path.join(b, "salt.hex"), "w").write(open(os.path.join(bundle, "salt.hex")).read() + "\n")
    forged("salt with a trailing newline", b, ("REFUSED",))
    b = copy_bundle(bundle); os.remove(os.path.join(b, "salt.hex"))
    forged("salt missing", b, ("REFUSED",))
    b = copy_bundle(bundle); os.remove(os.path.join(b, "archive.tar"))
    forged("archive missing", b, ("REFUSED",))
    for what, mutate in [("a file added inside the folder", lambda d: open(os.path.join(d, "notes", "extra.txt"), "w").write("x\n")),
                         ("a file removed inside the folder", lambda d: os.remove(os.path.join(d, "notes", "plan.txt"))),
                         ("a file renamed inside the folder", lambda d: os.rename(os.path.join(d, "notes", "plan.txt"), os.path.join(d, "notes", "plan2.txt")))]:
        d2 = make_idea(os.path.join(tempfile.mkdtemp(prefix="seal-mut-"), "idea")); mutate(d2)
        b = copy_bundle(bundle); open(os.path.join(b, "archive.tar"), "wb").write(S.archive_bytes(d2))
        forged(what + " (re-archived under the sealed salt)", b, ("REFUTED",))
    b = copy_bundle(bundle); m = json.load(open(os.path.join(b, "seal.json"))); m["digest"] = "0" * 64; json.dump(m, open(os.path.join(b, "seal.json"), "w"))
    forged("seal.json's digest edited", b, ("REFUTED", "REFUSED"))
    b = copy_bundle(bundle); m = json.load(open(os.path.join(b, "seal.json"))); m["version"] = "verify-seal-v0"; json.dump(m, open(os.path.join(b, "seal.json"), "w"))
    forged("seal.json's version edited", b, ("REFUSED",))
    b = copy_bundle(bundle); os.remove(os.path.join(b, "seal.json"))
    forged("seal.json missing", b, ("REFUSED",))

    # ---- OpenTimestamps without a Bitcoin node: the header read from explorers. Stand-ins: a fake `ots` naming block
    #      974704 and the merkle root in $SEAL_BATTERY_ROOT; local explorers serving that block's real header (good, good2),
    #      a header whose merkle field was replaced (liar: its hash no longer matches the block it is served as), and
    #      another self-consistent header for the same height (other: the nonce changed).
    HDR = bytes.fromhex(BLOCK_974704)
    HASH, ROOT_, _t = S.header_fields(BLOCK_974704)
    FORGED_ROOT = "ab" * 32
    liar = HDR[:36] + bytes.fromhex(FORGED_ROOT)[::-1] + HDR[68:]
    other = HDR[:76] + bytes([HDR[76] ^ 0x01]) + HDR[77:]
    OTHER_HASH = S.header_fields(other.hex())[0]
    routes = {}
    for name, h, hdr in (("good", HASH, HDR), ("good2", HASH, HDR), ("liar", HASH, liar), ("other", OTHER_HASH, other)):
        routes["/%s/block-height/974704" % name] = h
        routes["/%s/block/%s/header" % (name, h)] = hdr.hex()

    class Explorer(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            body = routes.get(self.path)
            self.send_response(200 if body else 404); self.end_headers()
            self.wfile.write((body or "not found").encode())

        def log_message(self, *a):
            pass
    srv = http.server.HTTPServer(("127.0.0.1", 0), Explorer)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d/" % srv.server_port
    fake = tempfile.mkdtemp(prefix="seal-ots-")
    open(os.path.join(fake, "ots"), "w").write('#!/bin/sh\ncase " $* " in\n  *" --no-bitcoin "*) echo "Not checking Bitcoin attestation; Bitcoin disabled"; '
                                             'echo "To verify manually, check that Bitcoin block 974704 has merkleroot $SEAL_BATTERY_ROOT";;\n'
                                             '  *) echo "Could not connect to Bitcoin node" >&2; exit 1;;\nesac\n')
    os.chmod(os.path.join(fake, "ots"), 0o755)
    tb = copy_bundle(bundle); os.remove(os.path.join(tb, "anchors.json")); open(os.path.join(tb, "digest.txt.ots"), "wb").write(b"\x00stand-in")

    def ots_env(explorers, root=ROOT_):
        return dict(os.environ, PATH=fake + os.pathsep + os.environ.get("PATH", ""), SEAL_BATTERY_ROOT=root,
                    SEAL_ESPLORA=",".join(base + e for e in explorers) if isinstance(explorers, list) else explorers)

    v = run("open", tb, env=ots_env(["good", "good2"]))
    case("an .ots complete, no Bitcoin node: block 974704's header read from two explorers, its merkle root the one the .ots reaches", v, "CERTIFIED", "held_by " + str(v.get("held_by")))
    assert v.get("held_by") == "2026-11-05", v
    case("the date rule on that anchor (--by 2026-11-04, block time 2026-11-05)", run("open", tb, "--by", "2026-11-04", env=ots_env(["good", "good2"])), ("REFUSED",))
    case("no node and SEAL_ESPLORA empty: the block is not read", run("open", tb, env=ots_env("")), ("REFUSED",))
    case("an explorer that does not answer", run("open", tb, env=ots_env(["good"]) | {"SEAL_ESPLORA": base + "good,http://127.0.0.1:9/x"}), ("REFUSED",))

    def forged_ots(name, explorers, root=ROOT_):
        v = run("open", tb, env=ots_env(explorers, root))
        forg.append({"forgery": name, "verdict": v["verdict"], "reason": v.get("reason", ""), "certified": v["verdict"] == "CERTIFIED"})
        case("forgery: " + name, v, ("REFUSED",))
    forged_ots("an .ots reaching another merkle root than block 974704's", ["good", "good2"], FORGED_ROOT)
    forged_ots("an explorer serving a header with the forged merkle root in it (its hash no longer the block's)", ["liar"], FORGED_ROOT)
    forged_ots("two explorers serving different headers for the same height", ["good", "other"])

    # ---- determinism: the same contents written another way, archived again, must give the SAME archive bytes
    idea2 = make_idea(os.path.join(tempfile.mkdtemp(prefix="seal-det-"), "idea"), variant=1)
    env = dict(os.environ, LC_ALL="C", LANG="C", TZ="Asia/Tokyo")
    r2 = subprocess.run([sys.executable, "-I", "-c", "import sys; sys.path.insert(0, %r); import seal, hashlib; print(hashlib.sha256(seal.archive_bytes(%r)).hexdigest())" % (HERE, idea2)], capture_output=True, text=True, env=env)
    same = r2.stdout.strip() == meta["archive_sha256"]
    db = copy_bundle(bundle); open(os.path.join(db, "archive.tar"), "wb").write(S.archive_bytes(idea2))
    v = run("open", db, "--registry", repo)
    case("determinism: the same contents written in another order, other mtimes and modes, under LC_ALL=C and another TZ, re-archived: the sealed digest re-derives", v, "CERTIFIED", "archive sha256 equal: " + str(same))
    assert same, (r2.stdout, r2.stderr)
    # the shell re-derivation equals the Python digest
    sh = shutil.which("xxd") and shutil.which("shasum")
    if sh:
        r3 = subprocess.run(["bash", "-c", S.REDERIVE], cwd=bundle, capture_output=True, text=True)
        shell_digest = r3.stdout.split()[0] if r3.returncode == 0 else ""
        case("the one-line shell re-derivation equals the Python digest", {"verdict": "CERTIFIED" if shell_digest == digest else "REFUTED", "reason": shell_digest}, "CERTIFIED")
    else:
        case("the one-line shell re-derivation (xxd/shasum absent here)", {"verdict": "REFUSED", "reason": "xxd or shasum not on PATH"}, "REFUSED")
    # a symlink refuses the seal
    sl = os.path.join(tempfile.mkdtemp(prefix="seal-sym-"), "idea"); os.makedirs(sl); os.symlink("/etc/hosts", os.path.join(sl, "link"))
    case("a folder with a symbolic link refuses to seal", run("seal", sl, "--out", os.path.join(sl, "..", "x.seal")), "REFUSED")

    # ---- red controls: the battery must notice a broken opener. A copy of seal.py whose decision always says CERTIFIED
    #      must turn every forgery green, and the battery's own rule must then fail.
    reds = []
    broken = os.path.join(tempfile.mkdtemp(prefix="seal-red-"), "seal.py")
    src = open(SEAL).read()
    src2 = src.replace('out.update(verdict="REFUTED", reason="the digest does not re-derive; what differs is " + which)', 'out.update(verdict="CERTIFIED", reason="broken")')
    assert src2 != src
    open(broken, "w").write(src2)
    bflip = copy_bundle(bundle); p = os.path.join(bflip, "archive.tar"); data = bytearray(open(p, "rb").read()); data[-600] ^= 0x01; open(p, "wb").write(data)
    r4 = subprocess.run([sys.executable, "-I", broken, "open", bflip, "--registry", repo], capture_output=True, text=True)
    vb = json.loads(r4.stdout)
    reds.append({"red": "an opener that certifies a mismatched digest IS caught (a flipped byte comes back CERTIFIED under it)", "fired": vb["verdict"] == "CERTIFIED"})
    src3 = src.replace('if earliest > by:', 'if False:')
    assert src3 != src
    open(broken, "w").write(src3)
    r5 = subprocess.run([sys.executable, "-I", broken, "open", bundle, "--by", "2026-11-01", "--registry", repo], capture_output=True, text=True)
    vb = json.loads(r5.stdout)
    reds.append({"red": "an opener that ignores the claimed date IS caught (a date before the anchor comes back CERTIFIED under it)", "fired": vb["verdict"] == "CERTIFIED"})
    src4 = src.replace('if not HEX64.fullmatch(text):', 'if False:')
    assert src4 != src
    open(broken, "w").write(src4)
    bnl = copy_bundle(bundle); open(os.path.join(bnl, "salt.hex"), "w").write(open(os.path.join(bundle, "salt.hex")).read() + "\n")
    r6 = subprocess.run([sys.executable, "-I", broken, "open", bnl, "--registry", repo], capture_output=True, text=True)
    vb = json.loads(r6.stdout)
    reds.append({"red": "an opener that tolerates a newline after the salt IS caught (bytes.fromhex strips it; the strict rule is what refuses)", "fired": vb["verdict"] == "CERTIFIED"})

    src7 = src.replace("if mr != root:", "if False:")
    assert src7 != src
    open(broken, "w").write(src7)
    r13 = subprocess.run([sys.executable, "-I", broken, "open", tb], capture_output=True, text=True, env=ots_env(["good", "good2"], FORGED_ROOT))
    reds.append({"red": "an opener that skips the merkle-root comparison IS caught (an .ots for other bytes comes back CERTIFIED under it)", "fired": json.loads(r13.stdout)["verdict"] == "CERTIFIED"})
    src8 = src.replace("if got[0] != bh:", "if False:")
    assert src8 != src
    open(broken, "w").write(src8)
    r14 = subprocess.run([sys.executable, "-I", broken, "open", tb], capture_output=True, text=True, env=ots_env(["liar"], FORGED_ROOT))
    reds.append({"red": "an opener that skips the header's own hash IS caught (an explorer's edited header comes back CERTIFIED under it)", "fired": json.loads(r14.stdout)["verdict"] == "CERTIFIED"})

    # ---- v2: the per-file salted manifest, one file revealed under it (verify-seal-v2)
    bundle2 = os.path.join(work, "idea.seal2")
    r7 = subprocess.run([sys.executable, "-I", SEAL, "seal2", idea, "--out", bundle2], capture_output=True, text=True)
    assert r7.returncode == 0, r7.stderr
    digest2 = r7.stdout.strip()
    repo2, commit2 = registry_with(digest2, "2026-11-05T12:00:00+0000")
    anchors(bundle2, commit2)
    # the shell re-derivation of the manifest's digest
    if sh:
        r8 = subprocess.run(["bash", "-c", S.REDERIVE2], cwd=bundle2, capture_output=True, text=True)
        case("v2: the one-line shell re-derivation equals the manifest's Python digest", {"verdict": "CERTIFIED" if (r8.stdout.split() or [""])[0] == digest2 else "REFUTED", "reason": r8.stdout[:80]}, "CERTIFIED")
    # the whole bundle opened: every file re-derives
    v = run("open", bundle2, "--registry", repo2)
    case("v2: the whole bundle opened (archive + salts): every file re-derives, the manifest's seal re-derives", v, "CERTIFIED", "held_by " + str(v.get("held_by")))
    assert v.get("held_by") == "2026-11-05", v
    # one file revealed, the others sealed
    pkg = os.path.join(work, "reveal-statement")
    r9 = subprocess.run([sys.executable, "-I", SEAL, "reveal", bundle2, "statement.md", "--out", pkg], capture_output=True, text=True)
    assert r9.returncode == 0, r9.stderr
    assert sorted(os.listdir(os.path.join(pkg, "files"))) == ["statement.md"], "the package must carry the one file only"
    man_txt = open(os.path.join(pkg, "manifest.json")).read()
    assert "plan.txt" not in man_txt and "statement" not in man_txt and "lemma" not in man_txt, "the manifest must name no path"
    v = run("verify", pkg, "--registry", repo2)
    case("v2: one file revealed under the sealed manifest (the package holds that file, its salt, the manifest; no other path, no other salt)", v, "CERTIFIED", "held_by " + str(v.get("held_by")))
    case("v2: the revealed file with --by on the anchor's day", run("verify", pkg, "--by", "2026-11-05", "--registry", repo2), "CERTIFIED")
    case("v2: the revealed file with --by before the anchor", run("verify", pkg, "--by", "2026-11-01", "--registry", repo2), ("REFUSED",))
    case("v2: the revealed file with no registry clone", run("verify", pkg), ("REFUSED",))
    pkg_nested = os.path.join(work, "reveal-lemma")
    r10 = subprocess.run([sys.executable, "-I", SEAL, "reveal", bundle2, "notes/deep/lemma-3.tex", "--out", pkg_nested], capture_output=True, text=True)
    assert r10.returncode == 0, r10.stderr
    case("v2: a nested file revealed (notes/deep/lemma-3.tex)", run("verify", pkg_nested, "--registry", repo2), "CERTIFIED")

    def forged2(name, p, want=("REFUTED", "REFUSED")):
        v = run("verify", p, "--registry", repo2)
        forg.append({"forgery": "v2: " + name, "verdict": v["verdict"], "reason": v.get("reason", ""), "certified": v["verdict"] == "CERTIFIED"})
        case("v2 forgery: " + name, v, want)

    def copy_pkg(src):
        d = tempfile.mkdtemp(prefix="seal2-case-")
        dst = os.path.join(d, "r")
        shutil.copytree(src, dst)
        return dst

    q = copy_pkg(pkg); fp = os.path.join(q, "files", "statement.md"); data = bytearray(open(fp, "rb").read()); data[0] ^= 0x01; open(fp, "wb").write(data)
    forged2("the revealed file's bytes differ by one bit", q, ("REFUTED",))
    q = copy_pkg(pkg); rj = json.load(open(os.path.join(q, "reveal.json"))); rj["path"] = "statement-final.md"; os.rename(os.path.join(q, "files", "statement.md"), os.path.join(q, "files", "statement-final.md")); json.dump(rj, open(os.path.join(q, "reveal.json"), "w"))
    forged2("the right bytes revealed under another name", q, ("REFUTED",))
    q = copy_pkg(pkg); rj = json.load(open(os.path.join(q, "reveal.json"))); rj["index"] = 0; json.dump(rj, open(os.path.join(q, "reveal.json"), "w"))
    forged2("the revealed file claimed at another index of the manifest", q, ("REFUTED",))
    q = copy_pkg(pkg); rj = json.load(open(os.path.join(q, "reveal.json"))); rj["index"] = 99; json.dump(rj, open(os.path.join(q, "reveal.json"), "w"))
    forged2("a revealed file absent from the manifest (index beyond it)", q, ("REFUTED",))
    q = copy_pkg(pkg); rj = json.load(open(os.path.join(q, "reveal.json"))); rj["salt"] = "f" * 64; json.dump(rj, open(os.path.join(q, "reveal.json"), "w"))
    forged2("another salt for the revealed file", q, ("REFUTED",))
    q = copy_pkg(pkg); m = json.load(open(os.path.join(q, "manifest.json"))); m["files"][1]["sha256"] = "0" * 64
    open(os.path.join(q, "manifest.json"), "wb").write(S.manifest_bytes(m["files"]))
    forged2("the manifest edited (a sha256 changed, canonical form kept): its seal no longer re-derives", q, ("REFUTED",))
    q = copy_pkg(pkg); open(os.path.join(q, "manifest.json"), "w").write(json.dumps(json.load(open(os.path.join(pkg, "manifest.json"))), indent=1))
    forged2("the manifest re-serialised with spaces (not canonical)", q, ("REFUSED",))
    q = copy_pkg(pkg); os.remove(os.path.join(q, "manifest.json"))
    forged2("the manifest missing from the package", q, ("REFUSED",))
    q = copy_pkg(pkg); open(os.path.join(q, "salt.hex"), "w").write("e" * 64)
    forged2("another manifest salt", q, ("REFUTED",))
    q = copy_pkg(pkg); m = json.load(open(os.path.join(q, "seal.json"))); m["version"] = "verify-seal-v1"; json.dump(m, open(os.path.join(q, "seal.json"), "w"))
    forged2("the package's seal.json claims v1", q, ("REFUSED",))
    # the whole-bundle forgeries
    b2 = tempfile.mkdtemp(prefix="seal2-b-"); dst = os.path.join(b2, "b.seal2"); shutil.copytree(bundle2, dst)
    ap = os.path.join(dst, "archive.tar"); data = bytearray(open(ap, "rb").read()); i2 = data.index(b"circle"); data[i2] ^= 0x01; open(ap, "wb").write(data)
    v = run("open", dst, "--registry", repo2)
    forg.append({"forgery": "v2: one byte flipped in the whole bundle's archive (the manifest intact)", "verdict": v["verdict"], "reason": v.get("reason", ""), "certified": v["verdict"] == "CERTIFIED"})
    case("v2 forgery: one byte flipped in the whole bundle's archive", v, ("REFUTED",))
    b3 = tempfile.mkdtemp(prefix="seal2-b-"); dst3 = os.path.join(b3, "b.seal2"); shutil.copytree(bundle2, dst3); sj = json.load(open(os.path.join(dst3, "salts.json"))); sj["files"][0]["salt"] = "a" * 64; json.dump(sj, open(os.path.join(dst3, "salts.json"), "w"))
    v = run("open", dst3, "--registry", repo2)
    forg.append({"forgery": "v2: one per-file salt replaced in salts.json", "verdict": v["verdict"], "reason": v.get("reason", ""), "certified": v["verdict"] == "CERTIFIED"})
    case("v2 forgery: one per-file salt replaced", v, ("REFUTED",))
    # v2 red control: a verifier that skips the path check must be caught (the right bytes under another name come back CERTIFIED under it)
    src5 = src.replace('if files[i]["path_hash"] != q:', 'if False:')
    assert src5 != src
    open(broken, "w").write(src5)
    q = copy_pkg(pkg); rj = json.load(open(os.path.join(q, "reveal.json"))); rj["path"] = "statement-final.md"; os.rename(os.path.join(q, "files", "statement.md"), os.path.join(q, "files", "statement-final.md")); json.dump(rj, open(os.path.join(q, "reveal.json"), "w"))
    r11 = subprocess.run([sys.executable, "-I", broken, "verify", q, "--registry", repo2], capture_output=True, text=True)
    vb = json.loads(r11.stdout)
    reds.append({"red": "v2: a verifier that skips the salted path check IS caught (the right bytes under another name come back CERTIFIED under it)", "fired": vb["verdict"] == "CERTIFIED"})
    src6 = src.replace('if files[i]["sha256"] != h:', 'if False:')
    assert src6 != src
    open(broken, "w").write(src6)
    q = copy_pkg(pkg); fp = os.path.join(q, "files", "statement.md"); data = bytearray(open(fp, "rb").read()); data[0] ^= 0x01; open(fp, "wb").write(data)
    r12 = subprocess.run([sys.executable, "-I", broken, "verify", q, "--registry", repo2], capture_output=True, text=True)
    vb = json.loads(r12.stdout)
    reds.append({"red": "v2: a verifier that skips the salted file hash IS caught (flipped bytes come back CERTIFIED under it)", "fired": vb["verdict"] == "CERTIFIED"})

    planted = len(forg)
    certified = sum(1 for f in forg if f["certified"])
    failed = [c["case"] for c in cases if not c["pass"]]
    dead = [r["red"] for r in reds if not r["fired"]]
    rec = {"what": "The Verify Seal battery (instruments/seal/battery.py): the commitment SHA256('verify-seal-v1\\n' || salt || SHA256(archive)) opened under planted forgeries, and since 2026-11-05 the v2 per-file salted manifest (one file revealed under a sealed manifest, the whole bundle opened) under its own forgeries and two red controls — each must come back REFUTED or REFUSED, never CERTIFIED — plus the determinism check (the same contents written another way re-derive the sealed digest), the date rule (an anchor dated after the claimed date refuses), the unconfirmed-anchor cases, and the one-line shell re-derivation against the Python digest; three red controls on a deliberately broken opener; and since 2026-11-05 evening the OpenTimestamps reading without a Bitcoin node (ots --no-bitcoin verify, the block header read from explorers) against stand-ins — a fake ots and local explorers serving block 974704's real header — with three forgeries and two red controls of its own. Run in a temporary directory with a temporary git registry; no network, no real ots client.",
           "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "seconds": round(time.time() - t0, 1),
           "seal_py_sha256": hashlib.sha256(open(SEAL, "rb").read()).hexdigest(), "python": sys.version.split()[0],
           "verdict": "PASS" if not failed and not dead and certified == 0 else "FAIL",
           "planted": planted, "certified": certified, "forgeries": forg, "cases": cases, "red_controls": reds, "failed": failed, "reds_dead": dead}
    for c in cases:
        print("%s  %s -> %s%s" % ("ok  " if c["pass"] else "FAIL", c["case"], c["verdict"], ("  " + c["note"]) if c["note"] else ""))
    for r in reds:
        print("%s  RED %s" % ("ok  " if r["fired"] else "DEAD", r["red"]))
    line = "%d planted forgeries, %d certified; %d cases, %d failed; %d/%d red controls fired; %.1f s" % (planted, certified, len(cases), len(failed), len(reds) - len(dead), len(reds), rec["seconds"])
    # what --check compares: the verdict words and the tool's sha, never the reasons (they carry temporary paths)
    strip = lambda r: {"verdict": r["verdict"], "planted": r["planted"], "certified": r["certified"], "seal_py_sha256": r["seal_py_sha256"],
                       "cases": [(c["case"], c["verdict"], c["pass"]) for c in r["cases"]],
                       "forgeries": [(f["forgery"], f["verdict"], f["certified"]) for f in r["forgeries"]],
                       "red_controls": [(x["red"], x["fired"]) for x in r["red_controls"]], "failed": r["failed"], "reds_dead": r["reds_dead"]}
    if CHECK:
        if not os.path.exists(OUT):
            print("FAIL  no record at " + OUT); return 1
        old = json.load(open(OUT))
        if rec["verdict"] != "PASS":
            print("FAIL  " + line); return 1
        if json.dumps(strip(old), sort_keys=True) != json.dumps(strip(rec), sort_keys=True):
            print("FAIL  the record differs on re-run (a case, a verdict word or the tool's sha moved): " + line); return 1
        print("PASS  seal battery --check: " + line); return 0
    json.dump(rec, open(OUT, "w"), indent=1); open(OUT, "a").write("\n")
    print(("PASS  " if rec["verdict"] == "PASS" else "FAIL  ") + line + " -> " + os.path.relpath(OUT, ROOT))
    return 0 if rec["verdict"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
