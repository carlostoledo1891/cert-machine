#!/usr/bin/env python3
"""Write environments/blind_spot/PROVENANCE.json — every lifted byte, pinned.

    python3 environments/blind_spot/provenance.py [--check]

frontier-apps has no git, so a sha256 is the only pin there is. Each row carries
the digest HERE and the digest AT THE SOURCE; when they differ the row says so
and says why, which is the difference between a declared patch and drift.

The pool is NOT pinned as a lift. `pool/` is regenerated on this machine by
`python3 -m blind_spot pool` (MCY's 400 mutations imported, each labelled by a
SAT proof against a hand-written miter, every witness re-run through the
simulator). Its labels are compared with frontier's own pool.json and the
comparison is recorded under `regenerated` — a copied record that cannot be
regenerated is exactly what deferred this port for four days.
"""
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.expanduser("~/Projects/frontier-apps")
SRC_ENV = os.path.join(SRC, "environments", "blind-spot")
SRC_MUT = os.path.join(SRC, "experiments", "certifier-core", "mut")

# (path relative to ROOT, path at the source, why it differs if it does)
PKG = ["design.py", "families.py", "sim.py", "pool.py", "taskset.py",
       "policies.py", "baseline.py", "forgeries.py", "__main__.py", "__init__.py",
       "api.py", "adapters_v0.py"]
EVAL = ["run_models.py", "page_data.py", "baseline.json", "results.json",
        "results-run1.json", "page.json"]
MUT = ["corpus.hex", "mint.hex", "outbox.hex", "aligned.hex", "core_euclid_strict.v",
       "database/design.il", "database/db.sqlite3", "database/mutations.txt"]

# The adapter files are NOT lifts — they were written here, against a live
# `verifiers` install, and are pinned only so the battery notices if they change.
NEW_HERE = ["blind_spot/api.py", "blind_spot/adapters_v0.py",
            "tests/test_framework_free.py", "tests/test_verifiers_binding.py",
            "battery.py", "provenance.py"]

PATCHES = {
    "environments/blind_spot/blind_spot/__init__.py":
        "was empty (0 bytes). Now the package docstring, the stdlib re-exports, the version read "
        "from installed metadata rather than written twice, and the LAZY resolver for "
        "`load_environment` — the Hub's entry point, which the sibling environment once shipped "
        "without exporting at all.",
    "environments/blind_spot/blind_spot/__main__.py":
        "a three-line `cli()` added so the console script declared in pyproject and the "
        "`python -m blind_spot` form share one body.",
    "environments/blind_spot/eval/run_models.py":
        "its private `parse()` replaced by `from blind_spot.api import parse_reply as parse`. The "
        "function moved into the package unchanged so the framework adapter and this runner cannot "
        "read a model's reply by two rules; the battery re-parses and re-grades all 92 gradable "
        "recorded rollouts with the package's copy every build and no row may move.",
    "environments/blind_spot/pyproject.toml":
        "rewritten from a twelve-line stub to the publishable shape: readme, license, authors, the "
        "Hub tags, `dependencies = [\"verifiers>=0.2.0\"]`, urls, the console script, hatchling, and "
        "a requires-python floor of 3.11 — which is the floor of the WHEEL (verifiers needs it), not "
        "of the grader, which is stdlib and runs on 3.9 in this repository's battery.",
    "environments/blind_spot/eval/page.json":
        "REGENERATED on this machine by `PYTHONPATH=. python3 eval/page_data.py`, so the instrument "
        "page reports this machine's run rather than the source lab's. Diffed leaf by leaf against "
        "the lifted copy: 398 leaves differ and EVERY ONE of them is a SAT timing (397 per-mutant "
        "`sat_secs` plus the pool total, 494.2 s there against 355.7 s here). Every label, class, "
        "region, profile, witness, control, baseline row and model result is identical.",
    "environments/blind_spot/blind_spot/pool.py":
        "`ensure_sim()` added, and POOL_JSON now reads design.POOL_RECORD. An installed copy has "
        "the 400 SAT labels (they ship in the wheel) but not the compiled simulator, which is this "
        "machine's binary; `build()` would re-prove all four hundred SAT problems to get it -- six "
        "minutes for a forty-second compile. ensure_sim() elaborates and compiles from the labels "
        "already on disk and is what `api.preflight` calls, so a fresh install pays forty seconds "
        "once. `python -m blind_spot sim` exposes it.",
    "environments/blind_spot/blind_spot/sim.py":
        "`simulate` runs vvp with cwd=pool_dir and passes BASENAMES. It passed an absolute path, "
        "and the testbench holds that plusarg in `reg [1023:0] f` -- 128 characters. In the source "
        "lab the tree sits ~70 characters deep so it always worked; installed into a site-packages "
        "directory 200 characters deep the path was truncated, $readmemh read nothing, the memory "
        "stayed X and EVERY verdict came back 'xxx' with no error raised. Found by installing the "
        "wheel; tests/test_long_path.py holds the fix and was checked to fail against the old call.",
    "environments/blind_spot/blind_spot/design.py":
        "MUT repointed from experiments/certifier-core/mut (not in this repository) to "
        "corpus/blindspot/mut, and the docstring rewritten to say that the seven files are "
        "copied and sha-pinned here rather than read in place.",
}


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def rows():
    out = []
    pairs = ([(f"environments/blind_spot/blind_spot/{f}", os.path.join(SRC_ENV, "blind_spot", f)) for f in PKG]
             + [(f"environments/blind_spot/tests/{f}", os.path.join(SRC_ENV, "tests", f))
                for f in ("test_environment.py", "test_framework_free.py",
                          "test_verifiers_binding.py", "test_long_path.py")]
             + [(f"environments/blind_spot/eval/{f}", os.path.join(SRC_ENV, "eval", f)) for f in EVAL]
             + [(f"environments/blind_spot/{f}", os.path.join(SRC_ENV, f)) for f in ("README.md", "pyproject.toml")]
             + [(f"corpus/blindspot/mut/{f}", os.path.join(SRC_MUT, f)) for f in MUT])
    for rel, src in pairs:
        here = os.path.join(ROOT, rel)
        if not os.path.exists(here):
            raise SystemExit("missing in this repository: " + rel)
        h = sha(here)
        s = sha(src) if os.path.exists(src) else None
        r = {"file": rel, "sha256": h, "sourceSha256": s, "bytes": os.path.getsize(here),
             "patched": bool(s and s != h)}
        if r["patched"]:
            r["patch"] = PATCHES.get(rel, "UNDECLARED — a patch with no reason is drift")
        out.append(r)
    return out


def main():
    rs = rows()
    undeclared = [r["file"] for r in rs if r.get("patch", "").startswith("UNDECLARED")]
    rec = {
        "what": "blind-spot, the chip-task environment, ported whole: the package (design, families, "
                "simulator, pool builder, taskset, policies, baseline, planted controls, CLI), its seven "
                "tests, the two eval scripts and the four eval records, and the eight files of the design "
                "under mutation that the package reads.",
        "liftedFrom": SRC_ENV + "  +  " + SRC_MUT,
        "liftedOn": "2026-09-09",
        "history": "Deferred on 2026-09-05 for four reasons: 12 MB, a 75-minute formal run inside a "
                   "battery, records that copy but cannot be regenerated, and an identity control found "
                   "vacuous the day before. Three of the four are answered here — only the eight files "
                   "the package actually reads were lifted (2.8 MB, not 12); the SAT labelling runs ONCE "
                   "on the port and its output is a pinned record while the simulation is re-run on every "
                   "build; and the vacuous control was fixed in frontier's own session 17 (the identity "
                   "is found by `-mode none`, which is MCY's mutation 1, never by id 0) and is planted "
                   "here as a standing red control so it cannot go quiet again.",
        "why": "The environment reads MCY's own mutation database and the elaborated design it mutated. "
               "In frontier those were read in place, so a task could not drift from the published "
               "coverage measurement. Here they are copies, so the battery re-hashes all eight every run "
               "and refuses if a byte moved: the same guarantee, caught rather than impossible.",
        "rule": "Copied byte-for-byte and pinned by sha256; frontier-apps has no git, so the hash is the "
                "only pin. The source tree is read-only and nothing was written to it. Nothing here is a "
                "lift from sin-mfg. Model calls (eval/run_models.py) are never made by a battery; the "
                "eval records are what was run there.",
        "files": rs,
    }
    if "--check" in sys.argv:
        old = json.load(open(os.path.join(HERE, "PROVENANCE.json")))
        moved = [(a["file"], a["sha256"], b["sha256"])
                 for a, b in zip(old["files"], rs) if a["sha256"] != b["sha256"]]
        print(("DRIFT " + str(moved)) if moved else f"{len(rs)} files, all sha256 unchanged")
        return 1 if moved else 0
    if undeclared:
        raise SystemExit("undeclared patch(es): " + ", ".join(undeclared))
    out = os.path.join(HERE, "PROVENANCE.json")
    prev = json.load(open(out)) if os.path.exists(out) else {}
    if prev.get("regenerated"):
        rec["regenerated"] = prev["regenerated"]
    if prev.get("acceptance"):
        rec["acceptance"] = prev["acceptance"]
    json.dump(rec, open(out, "w"), indent=1, ensure_ascii=False)
    print(f"PROVENANCE.json: {len(rs)} files, {sum(1 for r in rs if r['patched'])} declared patch(es)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
