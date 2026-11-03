#!/usr/bin/env python3
"""battery.py — the Verify Seal battery: planted forgeries that must be REFUTED or REFUSED, never CERTIFIED; the
determinism check that must be CERTIFIED; the date rule; the shell re-derivation against the Python digest.

Everything runs in a temporary directory with a temporary git registry (the public registry is the same shape:
seals/registry.jsonl, one line per digest, the commit's date as the anchor). No network, no ots client needed: the
OpenTimestamps path is exercised only as 'present but unconfirmed' (REFUSED), never faked as confirmed.

usage: python3 instruments/seal/battery.py            -> certs/seal-battery.json
       python3 instruments/seal/battery.py --check    re-runs everything and compares with the record; nothing written
Record format: planted, certified (must be 0), by case; red controls (a check that must fail under a broken opener).
MIT · cert-machine"""
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SEAL = os.path.join(HERE, "seal.py")
OUT = os.path.join(ROOT, "certs", "seal-battery.json")
CHECK = "--check" in sys.argv
sys.path.insert(0, HERE)
import seal as S  # noqa: E402

t0 = time.time()


def run(*args, cwd=None):
    r = subprocess.run([sys.executable, "-I", SEAL] + list(args), capture_output=True, text=True, cwd=cwd)
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

    planted = len(forg)
    certified = sum(1 for f in forg if f["certified"])
    failed = [c["case"] for c in cases if not c["pass"]]
    dead = [r["red"] for r in reds if not r["fired"]]
    rec = {"what": "The Verify Seal battery (instruments/seal/battery.py): the commitment SHA256('verify-seal-v1\\n' || salt || SHA256(archive)) opened under planted forgeries — each must come back REFUTED or REFUSED, never CERTIFIED — plus the determinism check (the same contents written another way re-derive the sealed digest), the date rule (an anchor dated after the claimed date refuses), the unconfirmed-anchor cases, and the one-line shell re-derivation against the Python digest; three red controls on a deliberately broken opener. Run in a temporary directory with a temporary git registry; no network, no ots client.",
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
