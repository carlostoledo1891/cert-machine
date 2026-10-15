#!/usr/bin/env python3
"""Official harness of the `lambda_upper` board: score a RECORD PACKAGE (objectives/lambda_upper/README.md).

    record_score.py --candidate DIR --out OUT_JSON [--timeout 1500] [--torus-budget 240] [--bank runtime/dbn21a/bank]

The candidate is a self-contained record package (the v1 assembly_1875 pattern): RECORD.json (machine-readable header),
the writeup, and ONE standalone verify script that discharges every hypothesis of Thm 1.2 of arXiv:1904.12438 (citing banked
verified facts, re-deriving the rest live) and exits 0 iff all of its checks pass.

What this harness certifies MECHANICALLY (exact rationals, no floats in any gate):
  criterion  0 < t0, 0 < y0^2, y0^2 + 2 t0 <= 1, and lambda_upper >= t0 + y0^2/2
  rh         X/2 <= rh_height <= 3000175332800 (Platt-Trudgian 2021, arXiv:2004.09765 - the only accepted RH input) and
             conditional == false: the board is UNCONDITIONAL only
  script     the verify script runs from a fresh writable copy of the package WITHOUT RECORD.json / MANIFEST.json (it must
             derive what it prints), with no network, confined to the package by lib/confine.py (no outside file reads
             except the interpreter's libraries and /opt/mosaic/dbn_v1, no subprocess except confined children of the
             same interpreter, e.g. a second-line .py; no binaries); it exits 0, prints exactly one
             RESULT line "RESULT: ALL PASS", no failure marker (FAIL_MARK: [FAIL] / [FAILED] / [ERROR] anywhere, or a line
             starting FAIL / FAILED / FAILURE / ERROR, any case), no Traceback on stderr, and exactly one of each
             RECORD_LAMBDA_UPPER / RECORD_T0 / RECORD_Y0SQ / RECORD_X line whose exact values equal RECORD.json
  lint       every leg names its hypothesis, what it cites and what it consumes; coverage states all three axes (t, N, y)
  frozen     optional FROZEN.sha256 (sha256sum format) of frozen heavy-leg outputs: every listed file is inside the package
             and matches its hash in the submitted package (the script re-checks what it consumes)

RECORD.json `route` selects the bound structure; absent means "polymath_barrier" (everything above). The second route,
"collision_exclusion", is the no-multiple-real-zero argument: if H_t has no multiple real zero for every t in [t_lo, t_hi] and
Lambda <= anchor_upper <= t_hi is proved, then Lambda < t_lo. Its gates replace only the criterion and the RECORD_ lines:
  criterion  0 < t_lo < anchor_upper <= t_hi <= 1/2, lambda_upper >= t_lo
  anchor     anchor_source names a banked anchor fact (BANKED_ANCHORS) and anchor_upper >= its proven bound (so >= the
             verified board best): an anchor below what is banked is refused
  rh         unchanged, with X = the largest real abscissa the argument needs real zeros of H_0 on (the separator at t = 0)
  script     unchanged, with RECORD_LAMBDA_UPPER / RECORD_T_LO / RECORD_T_HI / RECORD_ANCHOR / RECORD_X equal to RECORD.json
  coverage   the script prints machine-readable boxes, one per line (exact rationals; x_hi may be "inf"; <= MAX_COVER lines)
                 COVER module=interior|exterior|tail t=[a,b] x=[c,d]
             and their union, as closed boxes, must cover [t_lo, t_hi] x [0, inf) exactly (every open t-slab AND every
             t-breakpoint, i.e. joints on both axes); interior boxes stay at x <= X (the separator consumes RH only to X/2)
  lint       unchanged (legs; coverage t, N, y)
  torus      optional RECORD.json "torus_certs": [INDEX.json paths] (TORUS_CERT/1, lib/torus_cert.py, the exterior_torus leg).
             Each INDEX is listed in FROZEN.sha256, pins this harness's lib/torus_cert.py sha256 and its block files' sha256;
             the harness re-runs the reference checker on the SUBMITTED package: hashes, headers, exact tiling of T^k, every
             claim >= margin_floor, and a re-evaluation of the leaves (all of them when the INDEX's leaf count fits
             TORUS_BUDGET_S, else every claim < 2 margin_floor first and then hash-seeded random leaves). Every block the
             harness did not re-evaluate completely must carry an attestation that BINDS (check_attestation) to a verified
             memory of the live bank (runtime/dbn21a/bank/verified_memory.jsonl, read here, never from the package):
             "<session>#claim<i>", a pod-lane claim (verifier mode check+llm, check mode pod, exit 0, no --budget in its
             check_cmd) whose recorded pod outputs, re-hashed against the bank line, hold the checker's --json report (ok,
             this checker's sha256, full = 1, leaves = rechecked, the block complete with the same leaf count) and an INDEX
             with this checker's sha256, the same k, margin_floor, t, N and block-file sha256. Anything missing or different
             fails closed. Every printed COVER module=exterior_torus box must lie inside one rectangle the checker certified.
             The leg stands in for the L9 / L10 exterior cells where used; the tail module beyond its wall is unchanged.

What it does NOT certify: that the cited legs exist, are banked verified facts, and cover exactly what the package consumes
(the quantifier audit). That is the verifier seat's review (target.yaml verifier.llm_review) and the doctrine's two-line rule.

Score = float(lambda_upper) (minimize). A package that fails a gate gets a receipt with the gate metric 0 (the objective's
constraints reject it) and score 1.0; an unreadable RECORD.json is ok=false.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from fractions import Fraction
from pathlib import Path

RH_MAX = 3000175332800  # PT2021 (arXiv:2004.09765): RH verified to height T = 3,000,175,332,800
REQUIRED = ("lambda_upper", "t0", "y0_sq", "X", "rh_height", "rh_source", "verify_script", "writeup", "legs", "coverage", "conditional")
REQUIRED_CE = ("lambda_upper", "t_lo", "t_hi", "anchor_upper", "anchor_source", "X", "rh_height", "rh_source", "verify_script",
               "writeup", "legs", "coverage", "conditional")
ROUTES = ("polymath_barrier", "collision_exclusion")
RECORD_LINE = re.compile(r"^RECORD_(LAMBDA_UPPER|T0|Y0SQ|X|T_LO|T_HI|ANCHOR)\s*=\s*(\S+)\s*$", re.MULTILINE)
RATIONAL = re.compile(r"^\s*-?\d+(\s*/\s*\d+)?\s*$|^\s*-?\d+\.\d+\s*$")
FAIL_MARK = re.compile(r"\[\s*(fail(ed|ure)?|error)\s*\]|^\s*(fail(ed|ure)?|error)\b", re.IGNORECASE)
HIDDEN = ("RECORD.json", "MANIFEST.json")
CONFINE = Path(__file__).resolve().parent / "confine.py"
VIOLATION = "CONFINE-VIOLATION"
# Banked facts a collision_exclusion package may use as its anchor, with the Lambda bound each one PROVES. The minimum is the
# verified board best; add a row only when a new record is banked as a verified fact (V1 id or mosaic2 memory line).
BANKED_ANCHORS = {"V1-H-213": Fraction(3, 16)}
BOARD_BEST = min(BANKED_ANCHORS.values())
ANCHOR_ID = re.compile(r"\bV1-[A-Z]-\d+\b|\bmemory line \d+\b", re.IGNORECASE)
COVER_LINE = re.compile(r"^COVER\s+module=(\S+)\s+t=\[([^,\]]+),([^\]]+)\]\s+x=\[([^,\]]+),([^\]]+)\]\s*$", re.MULTILINE)
COVER_MODULES = ("interior", "exterior", "exterior_torus", "tail")
MAX_COVER = 2000
INF = float("inf")
FROZEN = "FROZEN.sha256"
TORUS = Path(__file__).resolve().parent / "torus_cert.py"
TORUS_BUDGET_S = 240           # re-evaluation seconds inside the 1800 s score timeout (the script keeps its 1500 s cap)
TORUS_WORKERS = 2              # the host's per-run core budget (doctrine L9)
BANK = Path(__file__).resolve().parents[3] / "runtime" / "dbn21a" / "bank"
ATTESTATION = re.compile(r"^([a-z0-9_]+)-s(\d+)#claim(\d+)$")
ATTEST_KINDS = ("fact", "measurement_request", "analysis", "spec")
ATTEST_JSON_MAX = 64 << 20
FROZEN_LINE = re.compile(r"^([0-9a-fA-F]{64}) [ *](\S.*?)\s*$")


def exact(v, name: str) -> Fraction:
    """An exact rational from a JSON value: an int, or a string 'p/q' / terminating decimal. Binary floats are refused."""
    if isinstance(v, bool):
        raise ValueError(f"{name}: boolean is not a number")
    if isinstance(v, int):
        return Fraction(v)
    if isinstance(v, float):
        raise ValueError(f"{name}: write exact values as strings ('p/q' or a terminating decimal), not JSON floats")
    if isinstance(v, str) and RATIONAL.match(v):
        try:
            return Fraction(v.replace(" ", ""))
        except ZeroDivisionError:
            raise ValueError(f"{name}: zero denominator: {v!r}") from None
    raise ValueError(f"{name}: not an exact rational: {v!r}")


def x_covered(intervals: list) -> str | None:
    """None if the closed intervals cover [0, inf), else the first gap."""
    if not intervals:
        return "no box"
    reach: Fraction | float = Fraction(0)
    for lo, hi in sorted(intervals, key=lambda iv: iv[0]):
        if lo > reach:
            return f"x-gap ({reach}, {lo})"
        reach = max(reach, hi)
        if reach == INF:
            return None
    return f"x-gap ({reach}, inf)"


def coverage_gaps(boxes: list, t_lo: Fraction, t_hi: Fraction) -> list:
    """Exact check that the closed boxes (t_a, t_b, x_c, x_d) cover [t_lo, t_hi] x [0, inf): every open slab between
    consecutive t-breakpoints and every breakpoint itself (the joints) must be covered in x."""
    cuts = sorted({t_lo, t_hi} | {v for b in boxes for v in b[:2] if t_lo < v < t_hi})
    gaps = []
    for i, t in enumerate(cuts):
        g = x_covered([(c, d) for a, b, c, d in boxes if a <= t <= b])
        if g:
            gaps.append(f"t = {t}: {g}")
        if i + 1 < len(cuts):
            u = cuts[i + 1]
            g = x_covered([(c, d) for a, b, c, d in boxes if a <= t and b >= u])
            if g:
                gaps.append(f"t in ({t}, {u}): {g}")
        if len(gaps) >= 5:
            break
    return gaps


def check_frozen(cand: Path) -> tuple:
    """Optional FROZEN.sha256 (sha256sum format, '<64 hex>  <path inside the package>', '#' comments): the harness itself
    checks every listed frozen output against the SUBMITTED package before the script runs. Returns (errors, n_files)."""
    man = cand / FROZEN
    if not man.exists():
        return [], 0
    errs, n = [], 0
    for i, ln in enumerate(man.read_text(encoding="utf-8").splitlines(), 1):
        if not ln.strip() or ln.lstrip().startswith("#"):
            continue
        mt = FROZEN_LINE.match(ln)
        if not mt:
            errs.append(f"{FROZEN} line {i}: not '<sha256>  <path>'")
            continue
        try:
            p = inside(cand, mt.group(2))
        except ValueError as e:
            errs.append(f"{FROZEN} line {i}: {e}")
            continue
        if hashlib.sha256(p.read_bytes()).hexdigest() != mt.group(1).lower():
            errs.append(f"{FROZEN} line {i}: sha256 mismatch for {mt.group(2)}")
        n += 1
    if not n and not errs:
        errs.append(f"{FROZEN}: lists no files")
    return errs[:6], n


def frozen_paths(cand: Path) -> set:
    paths = set()
    man = cand / FROZEN
    if man.exists():
        for ln in man.read_text(encoding="utf-8").splitlines():
            mt = FROZEN_LINE.match(ln)
            if mt:
                try:
                    paths.add(inside(cand, mt.group(2)))
                except ValueError:
                    pass
    return paths


def load_bank(bank: Path) -> list | None:
    """The verified memories of the live bank (one JSON object per line), or None when it is not readable."""
    try:
        with (bank / "verified_memory.jsonl").open(encoding="utf-8") as fh:
            lines = fh.read().splitlines()
    except OSError:
        return None
    out = []
    for ln in lines:
        try:
            e = json.loads(ln)
        except ValueError:
            continue
        if isinstance(e, dict):
            out.append(e)
    return out


def _sha_file(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as fh:
        for b in iter(lambda: fh.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def _json_file(p: Path):
    try:
        if p.stat().st_size > ATTEST_JSON_MAX:
            return None
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError, UnicodeDecodeError):
        return None


def _frac(v) -> Fraction | None:
    try:
        return Fraction(str(v))
    except (ValueError, ZeroDivisionError):
        return None


def _index_has(idx, unit: dict, scope: dict, checker: str) -> bool:
    """idx is a TORUS_CERT/1 INDEX by this checker, with the unit's k, margin_floor, t, N and leaf-file sha256."""
    if not isinstance(idx, dict) or idx.get("format") != "TORUS_CERT/1" or idx.get("checker_sha256") != checker:
        return False
    try:
        if int(idx.get("k")) != scope["k"] or _frac(idx.get("margin_floor")) != scope["floor"]:
            return False
    except (TypeError, ValueError):
        return False
    for b in idx.get("blocks") or []:
        if not isinstance(b, dict) or str(b.get("id")) != unit["id"]:
            continue
        try:
            if (_frac(b["t"][0]), _frac(b["t"][1])) != scope["t"] or (int(b["N"][0]), int(b["N"][1])) != scope["N"]:
                continue
        except (KeyError, TypeError, ValueError, IndexError):
            continue
        for e in (b.get("shards") if unit.get("shard") else [b]) or []:
            if isinstance(e, dict) and str(e.get("sha256", "")).lower() == unit["sha256"] and (
                    not unit.get("shard") or (str(e.get("id")) == unit["shard"] and str(e.get("region")) == unit["region"])):
                return True
    return False


def _report_ok(r, unit: dict, checker: str) -> bool:
    """r is this checker's --json report of a passed, complete re-check of the unit's block with the unit's leaf count."""
    if not isinstance(r, dict) or r.get("ok") is not True or r.get("checker_sha256") != checker or r.get("budget") is not None:
        return False
    try:
        if int(r.get("full")) != 1 or int(r.get("leaves")) != int(r.get("rechecked")):
            return False
        return any(isinstance(b, dict) and str(b.get("id")) == unit["id"] and b.get("ok") is True and b.get("complete") is True
                   and int(b.get("leaves")) == int(b.get("rechecked")) == unit["leaves"] for b in r.get("blocks") or [])
    except (TypeError, ValueError):
        return False


def check_attestation(att, unit: dict, scope: dict, checker: str, bank: Path, entries: list | None) -> str | None:
    """None iff `att` binds the unit (a block; a shard of a sharded block: unit["shard"], unit["region"]) to ONE banked
    pod-lane claim that re-checked it in full with this checker: '<seat>-s<n>#claim<i>' names the verified memory whose
    evidence is runtime/<target>/seats/<seat>/verify/<session>/claim_<i>; its pod outputs are re-hashed against the bank line.
    unit = {id, sha256 (leaf file), leaves}; scope = {t: (ta, tb), N: (NA, NB), k, floor}. Fails closed."""
    m = ATTESTATION.fullmatch(str(att or "").strip())
    if not m:
        return f"attestation {str(att)[:60]!r} must name a banked pod-lane claim as '<seat>-s<n>#claim<i>'"
    seat, session = m.group(1), f"{m.group(1)}-s{m.group(2)}"
    cdir = bank.parent / "seats" / seat / "verify" / session / f"claim_{m.group(3)}"
    if entries is None:
        return f"attestation {att}: the live bank {bank} is not readable"
    cdir = cdir.resolve()
    want = (str(cdir), str(cdir / "artifact"))
    hits = [e for e in entries if e.get("seat") == seat and e.get("session") == session and e.get("evidence_path")
            and str(Path(str(e["evidence_path"])).resolve()) in want]
    if len(hits) != 1:
        return f"attestation {att}: {len(hits) or 'no'} banked verified memories for {cdir}"
    e = hits[0]
    v = e.get("verifier") if isinstance(e.get("verifier"), dict) else {}
    c = v.get("check") if isinstance(v.get("check"), dict) else {}
    cmd = c.get("cmd") if isinstance(c.get("cmd"), list) else []
    why = None
    if e.get("kind") not in ATTEST_KINDS:
        why = f"kind {e.get('kind')!r} is not one of {list(ATTEST_KINDS)}"
    elif v.get("mode") != "check+llm":
        why = f"verifier mode {v.get('mode')!r}, need 'check+llm' (a verifier-seat pass)"
    elif c.get("mode") != "pod" or c.get("exit") != 0 or not (c.get("pod") or {}).get("pod_id"):
        why = "not a passed pod-lane check (check mode pod, exit 0, a pod id)"
    elif not cmd or any("--budget" in str(a) for a in cmd):
        why = "its check_cmd is missing or ran with --budget"
    if why:
        return f"attestation {att}: {why}"
    outs = c.get("outputs_sha256") if isinstance(c.get("outputs_sha256"), dict) else {}
    work = (cdir / str(c.get("outputs_dir") or "pod_outputs/work")).resolve()
    if not str(work).startswith(str(cdir.resolve()) + "/"):
        return f"attestation {att}: outputs_dir is outside the claim dir"
    files = []
    for rel, sha in sorted(outs.items()):
        p = (work / str(rel)).resolve()
        if str(rel).startswith("_") or not str(rel).endswith(".json") or not str(p).startswith(str(work) + "/"):
            continue
        if not p.is_file() or _sha_file(p) != str(sha).lower():
            return f"attestation {att}: pod output {rel} is missing or differs from the sha256 the bank recorded"
        files.append((p, True))
    art = cdir / "artifact"
    if art.is_dir():
        files += [(p, False) for p in sorted(art.rglob("*.json"))[:200] if p.is_file() and not p.is_symlink()]
    jsons = [(_json_file(p), out) for p, out in files]
    if not any(out and _report_ok(j, unit, checker) for j, out in jsons):
        return (f"attestation {att}: no pod output is this checker's --json report of a passed full re-check of block "
                f"{unit['id']}{' shard ' + unit['shard'] if unit.get('shard') else ''} (full = 1, leaves = rechecked = "
                f"{unit['leaves']})")
    if not any(_index_has(j, unit, scope, checker) for j, _ in jsons):
        return (f"attestation {att}: no INDEX in the attested run has this checker sha256 and the block's k, margin_floor, "
                f"t, N and leaf-file sha256")
    return None


def attestation_errors(idx_path: Path, res: dict, checker: str, bank: Path, entries: list | None) -> tuple:
    """For every block of the INDEX the checker did not re-evaluate completely (res["blocks"][..]["complete"] false), its
    attestation (every shard's, for a sharded block) must bind (check_attestation). Returns (errors, units bound)."""
    try:
        idx = json.loads(idx_path.read_text(encoding="utf-8"))
        k, floor = int(idx["k"]), Fraction(str(idx["margin_floor"]))
        blocks = list(idx["blocks"])
    except (OSError, ValueError, KeyError, TypeError, ZeroDivisionError) as e:
        return [f"INDEX unreadable for the attestation gate: {e}"], 0
    done = {str(r.get("id")) for r in res.get("blocks") or [] if isinstance(r, dict) and r.get("complete") is True}
    errs, bound = [], 0
    for b in blocks:
        try:
            bid = str(b["id"])
            scope = {"t": (Fraction(str(b["t"][0])), Fraction(str(b["t"][1]))), "N": (int(b["N"][0]), int(b["N"][1])),
                     "k": k, "floor": floor}
            units = ([{"id": bid, "sha256": str(s["sha256"]).lower(), "leaves": int(s["leaves"]), "shard": str(s["id"]),
                       "region": str(s["region"]), "att": s.get("attestation")} for s in b["shards"]] if "shards" in b else
                     [{"id": bid, "sha256": str(b["sha256"]).lower(), "leaves": int(b["leaves"]), "att": b.get("attestation")}])
        except (KeyError, TypeError, ValueError, IndexError, ZeroDivisionError) as e:
            errs.append(f"block {b.get('id') if isinstance(b, dict) else '?'}: unreadable for the attestation gate ({e})")
            continue
        if bid in done:
            continue
        for u in units:
            why = check_attestation(u.pop("att"), u, scope, checker, bank, entries)
            if why:
                errs.append(f"block {bid}{' shard ' + u['shard'] if u.get('shard') else ''}: {why}")
            else:
                bound += 1
    return errs, bound


def check_torus(cand: Path, rec: dict, work: Path, py: str, *, budget: int = TORUS_BUDGET_S, bank: Path = BANK) -> tuple:
    """The exterior_torus leg: re-run lib/torus_cert.py on every INDEX in RECORD.json torus_certs (the SUBMITTED package).
    Returns (errors, certified rectangles (t_a, t_b, x_c, x_d), metrics)."""
    m = {"torus_certs": 0, "torus_leaves": 0, "torus_rechecked": 0, "torus_full": 1, "torus_min_margin_micro": "n/a",
         "torus_seconds": 0.0, "torus_attested": 0}
    certs = rec.get("torus_certs")
    if certs is None:
        return [], [], m
    if not isinstance(certs, list) or not certs or not all(isinstance(c, str) for c in certs):
        return ["torus_certs: need a non-empty list of INDEX.json paths inside the package"], [], m
    if rec.get("route") != "collision_exclusion":
        return ["torus_certs: the exterior_torus leg belongs to route collision_exclusion"], [], m
    errs, rects, listed, mins, t = [], [], frozen_paths(cand), [], time.time()
    checker, entries = hashlib.sha256(TORUS.read_bytes()).hexdigest(), False
    env = {k: v for k, v in os.environ.items() if not k.startswith("PYTHON")}
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    for i, rel in enumerate(certs):
        try:
            idx = inside(cand, rel)
        except ValueError as e:
            errs.append(f"torus_certs[{i}]: {e}")
            continue
        if idx not in listed:
            errs.append(f"torus_certs[{i}]: {rel} is not listed in {FROZEN}")
            continue
        out = work / f"torus_{i}.json"
        left = max(min(30, budget), budget - (time.time() - t))
        r = None
        try:
            r = subprocess.run([py, str(TORUS), "check", str(idx), "--budget", str(int(left)), "--workers", str(TORUS_WORKERS),
                                "--json", str(out)], capture_output=True, text=True, timeout=left + 300, env=env, cwd=work)
            res = json.loads(out.read_text(encoding="utf-8"))
        except (subprocess.TimeoutExpired, OSError, ValueError) as e:
            errs.append(f"torus_certs[{i}]: checker did not finish ({type(e).__name__}); stderr {(r.stderr[-200:] if r else '')!r}")
            continue
        m["torus_certs"] += 1
        m["torus_leaves"] += int(res.get("leaves", 0))
        m["torus_rechecked"] += int(res.get("rechecked", 0))
        m["torus_full"] = min(m["torus_full"], int(res.get("full", 0)))
        if res.get("min_margin_micro") is not None:
            mins.append(int(res["min_margin_micro"]))
        if not res.get("ok"):
            errs += [f"torus_certs[{i}]: {e}" for e in (res.get("errors") or ["rejected"])[:4]]
            continue
        if res.get("checker_sha256") != checker:
            errs.append(f"torus_certs[{i}]: the checker report is not from this harness's lib/torus_cert.py")
            continue
        if entries is False and not all(isinstance(r, dict) and r.get("complete") is True for r in res.get("blocks") or []):
            entries = load_bank(bank)
        aerrs, bound = attestation_errors(idx, res, checker, bank, entries if entries is not False else None)
        m["torus_attested"] += bound
        if aerrs:
            errs += [f"torus_certs[{i}]: {e}" for e in aerrs[:4]]
            continue
        rects += [tuple(Fraction(v) for v in rc) for rc in res.get("rects", [])]
    m["torus_min_margin_micro"] = min(mins) if mins else "n/a"
    m["torus_seconds"] = round(time.time() - t, 1)
    return errs, rects, m


def parse_cover(out: str, X: Fraction) -> tuple:
    boxes, errs, torus = [], [], []
    for mod, a, b, c, d in COVER_LINE.findall(out)[: MAX_COVER + 1]:
        try:
            ta, tb, xc = exact(a.strip(), "COVER t"), exact(b.strip(), "COVER t"), exact(c.strip(), "COVER x")
            xd = INF if d.strip().lower() == "inf" else exact(d.strip(), "COVER x")
        except ValueError as e:
            errs.append(str(e))
            continue
        if mod not in COVER_MODULES:
            errs.append(f"COVER module {mod!r}: known modules are {list(COVER_MODULES)}")
        elif not (ta <= tb and xc <= xd):
            errs.append(f"COVER box t=[{ta},{tb}] x=[{xc},{xd}] is empty")
        elif mod == "interior" and xd > X:
            errs.append(f"COVER interior box reaches x = {xd} > X = {X} (the separator consumes RH only to X/2)")
        else:
            boxes.append((ta, tb, xc, xd))
            if mod == "exterior_torus":
                torus.append((ta, tb, xc, xd))
    if len(COVER_LINE.findall(out)) > MAX_COVER:
        errs.append(f"more than {MAX_COVER} COVER lines: aggregate boxes per module and t-slab")
    return boxes, errs, torus


def floor_str(fr: Fraction, k: int) -> str:
    n = (fr * 10**k).numerator // (fr * 10**k).denominator
    s = str(abs(n)).rjust(k + 1, "0")
    return ("-" if n < 0 else "") + s[:-k] + "." + s[-k:]


def pick_python() -> str:
    for py in ("/usr/bin/python3", sys.executable):
        try:
            r = subprocess.run([py, "-c", "import mpmath, sympy"], capture_output=True, timeout=60)
            if r.returncode == 0:
                return py
        except (OSError, subprocess.TimeoutExpired):
            continue
    return "/usr/bin/python3"


def inside(root: Path, rel: str) -> Path:
    p = (root / rel).resolve()
    if not str(p).startswith(str(root.resolve()) + "/") or not p.is_file():
        raise ValueError(f"{rel!r} is not a file inside the package")
    return p


def score(cand: Path, work: Path, timeout: int, *, torus_budget: int = TORUS_BUDGET_S, bank: Path = BANK) -> dict:
    rec = json.loads((cand / "RECORD.json").read_text(encoding="utf-8"))
    if not isinstance(rec, dict):
        raise ValueError("RECORD.json must be an object")
    route = rec.get("route", "polymath_barrier")
    if route not in ROUTES:
        raise ValueError(f"RECORD.json route {route!r}: known routes are {list(ROUTES)}")
    missing = [k for k in (REQUIRED if route == "polymath_barrier" else REQUIRED_CE) if k not in rec]
    if missing:
        raise ValueError(f"RECORD.json missing keys: {missing}")
    lam = exact(rec["lambda_upper"], "lambda_upper")
    X, rh = exact(rec["X"], "X"), exact(rec["rh_height"], "rh_height")
    notes = []
    if route == "polymath_barrier":
        t0, y0sq = exact(rec["t0"], "t0"), exact(rec["y0_sq"], "y0_sq")
        functional = t0 + y0sq / 2
        crit = t0 > 0 and y0sq > 0 and y0sq + 2 * t0 <= 1 and lam >= functional
        want = {"LAMBDA_UPPER": lam, "T0": t0, "Y0SQ": y0sq, "X": X}
        if not crit:
            notes.append(f"criterion gate: need 0 < t0, 0 < y0^2, y0^2 + 2 t0 <= 1, lambda_upper >= t0 + y0^2/2 "
                         f"(= {functional.numerator}/{functional.denominator})")
    else:
        t0, t_hi, anchor = exact(rec["t_lo"], "t_lo"), exact(rec["t_hi"], "t_hi"), exact(rec["anchor_upper"], "anchor_upper")
        y0sq = Fraction(0)
        functional = t0
        crit = 0 < t0 < anchor <= t_hi <= Fraction(1, 2) and lam >= t0
        want = {"LAMBDA_UPPER": lam, "T_LO": t0, "T_HI": t_hi, "ANCHOR": anchor, "X": X}
        if not crit:
            notes.append("criterion gate (collision_exclusion): need 0 < t_lo < anchor_upper <= t_hi <= 1/2, lambda_upper >= t_lo")
        named = {i.upper() for i in ANCHOR_ID.findall(str(rec.get("anchor_source") or ""))} & set(BANKED_ANCHORS)
        proven = min((BANKED_ANCHORS[i] for i in named), default=None)
        anchor_ok = proven is not None and anchor >= proven >= BOARD_BEST
        if not anchor_ok:
            notes.append(f"anchor gate: anchor_source must name a banked anchor fact {sorted(BANKED_ANCHORS)} and anchor_upper "
                         f"must be >= its proven bound (the verified board best is {BOARD_BEST}); got named={sorted(named)}, "
                         f"anchor_upper={anchor}")
    m: dict = {
        "route": route,
        "lambda_upper_exact": f"{lam.numerator}/{lam.denominator}",
        "lambda_upper_floor10": floor_str(lam, 10),
        "t0_exact": f"{t0.numerator}/{t0.denominator}",
        "y0_sq_exact": f"{y0sq.numerator}/{y0sq.denominator}",
        "X_exact": str(X),
        "rh_height": str(rh),
        "functional_exact": f"{functional.numerator}/{functional.denominator}",
        "legs": len(rec["legs"]) if isinstance(rec["legs"], list) else 0,
        "conditional": 1 if rec["conditional"] is not False else 0,
    }
    if route == "collision_exclusion":
        m["t_hi_exact"] = f"{t_hi.numerator}/{t_hi.denominator}"
        m["anchor_exact"] = f"{anchor.numerator}/{anchor.denominator}"
    src = str(rec.get("rh_source") or "")
    rh_ok = X > 0 and X / 2 <= rh <= RH_MAX and ("2004.09765" in src or "PT2021" in src.upper().replace(" ", "")) and rec["conditional"] is False
    if not rh_ok:
        notes.append(f"rh gate: need X/2 <= rh_height <= {RH_MAX}, rh_source citing PT2021 / arXiv:2004.09765, conditional false")
    m["rh_margin"] = str(RH_MAX - X / 2) if X > 0 else "n/a"
    lint = []
    legs = rec["legs"] if isinstance(rec["legs"], list) else []
    if not legs:
        lint.append("legs: empty")
    for i, leg in enumerate(legs):
        if not isinstance(leg, dict) or not all(str(leg.get(k) or "").strip() for k in ("hypothesis", "cites", "consumes")):
            lint.append(f"legs[{i}]: needs non-empty hypothesis, cites, consumes")
    cov = rec["coverage"] if isinstance(rec["coverage"], dict) else {}
    for axis in ("t", "N", "y"):
        if not str(cov.get(axis) or "").strip():
            lint.append(f"coverage.{axis}: missing (coverage inventories state all three axes)")
    m["lint_ok"] = 0 if lint else 1
    notes += lint
    frozen_errs, m["frozen_files"] = check_frozen(cand)
    m["frozen_ok"] = 0 if frozen_errs else 1
    notes += frozen_errs
    script = inside(cand, str(rec["verify_script"]))
    inside(cand, str(rec["writeup"]))
    pkg = work / "pkg"
    shutil.rmtree(pkg, ignore_errors=True)
    shutil.copytree(cand, pkg, ignore=shutil.ignore_patterns("__pycache__", "*.pyc", *HIDDEN))
    for p in pkg.rglob("*"):
        try:
            p.chmod(0o755 if p.is_dir() else 0o644)
        except OSError:
            pass
    py = pick_python()
    site = work / "confine_site"
    shutil.rmtree(site, ignore_errors=True)
    site.mkdir()
    shutil.copyfile(CONFINE, site / "sitecustomize.py")
    env = {k: v for k, v in os.environ.items() if not k.startswith("PYTHON")}
    env.update({"PYTHONDONTWRITEBYTECODE": "1", "PYTHONPATH": str(site), "MOSAIC2_CONFINE_PKG": str(pkg),
                "MOSAIC2_CONFINE_SITE": str(site), "MOSAIC2_CONFINE_LIB": str(CONFINE.parent)})
    run_script = pkg / script.relative_to(cand.resolve())
    t = time.time()
    try:
        r = subprocess.run([py, str(CONFINE), str(pkg), str(run_script)], cwd=run_script.parent, capture_output=True, text=True,
                           timeout=timeout, env=env)
        rc, out, err = r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired as e:
        rc, out, err = -9, (e.stdout or b"").decode("utf-8", "replace") if isinstance(e.stdout, bytes) else (e.stdout or ""), f"timeout after {timeout}s"
    m["script_seconds"] = round(time.time() - t, 1)
    (work / "verify_stdout.txt").write_text(out, encoding="utf-8")
    (work / "verify_stderr.txt").write_text(err or "", encoding="utf-8")
    fails = [ln for ln in out.splitlines() if FAIL_MARK.search(ln)]
    results = [ln.strip() for ln in out.splitlines() if ln.strip().upper().startswith("RESULT")]
    all_pass = results == ["RESULT: ALL PASS"]
    violations = [ln.strip() for ln in (err or "").splitlines() if VIOLATION in ln]
    traceback = "Traceback (most recent call last)" in (err or "")
    m["confine_violations"] = len(violations)
    m["script_ok"] = 1 if (rc == 0 and all_pass and not fails and not violations and not traceback) else 0
    if not m["script_ok"]:
        notes.append(f"script gate: exit {rc}, RESULT lines {results[:3]!r} (need exactly ['RESULT: ALL PASS']), "
                     f"{len(fails)} failure-marker line(s) {[ln[:80] for ln in fails[:2]]!r}, {len(violations)} confinement "
                     f"violation(s) {violations[:2]!r}, traceback {'yes' if traceback else 'no'}; stderr: {(err or '')[-300:]}")
    nc = re.search(r"^TOTAL CHECKS RUN:\s*(\d+)", out, re.MULTILINE)
    m["checks_run"] = int(nc.group(1)) if nc else 0
    found: dict = {}
    for key, val in RECORD_LINE.findall(out):
        found.setdefault(key, []).append(val)
    line_ok = True
    for key, v in want.items():
        vals = found.get(key, [])
        try:
            if len(vals) != 1 or exact(vals[0], key) != v:
                line_ok = False
                notes.append(f"record line RECORD_{key}: printed {vals!r}, RECORD.json says {v}")
        except ValueError as e:
            line_ok = False
            notes.append(f"record line RECORD_{key}: {e}")
    m["record_lines_ok"] = 1 if line_ok else 0
    cover_ok = True
    torus_errs, rects, tm = check_torus(cand, rec, work, py, budget=torus_budget, bank=bank)
    m.update(tm)
    if route == "collision_exclusion":
        boxes, errs, tboxes = parse_cover(out, X)
        gaps = coverage_gaps(boxes, t0, t_hi) if boxes else ["no COVER lines"]
        for ta, tb, xc, xd in tboxes:
            if not any(a <= ta and tb <= b and c <= xc and xd <= d for a, b, c, d in rects):
                torus_errs.append(f"COVER exterior_torus t=[{ta},{tb}] x=[{xc},{xd}] lies in no rectangle a torus_certs "
                                  f"certificate certified")
                break
        cover_ok = not errs and not gaps
        m["cover_boxes"] = len(boxes)
        m["cover_torus_boxes"] = len(tboxes)
        m["anchor_ok"] = 1 if anchor_ok else 0
        if not cover_ok:
            notes.append("coverage gate: " + "; ".join((errs + gaps)[:6]))
        crit = crit and anchor_ok
    m["torus_ok"] = 0 if torus_errs else 1
    if torus_errs:
        notes.append("torus gate: " + "; ".join(torus_errs[:4]))
    m["coverage_ok"] = 1 if cover_ok else 0
    m["criterion_ok"] = 1 if crit else 0
    m["rh_ok"] = 1 if rh_ok else 0
    m["python"] = py
    m["notes"] = " | ".join(notes)[:1500]
    gates = crit and rh_ok and m["script_ok"] and line_ok and cover_ok and not lint and not frozen_errs and not torus_errs
    return {"ok": True, "score": float(lam) if gates else 1.0, "metrics": m, "error": None, "artifacts": ["verify_stdout.txt"]}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidate", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--timeout", type=int, default=1500)
    ap.add_argument("--torus-budget", type=int, default=TORUS_BUDGET_S, help="torus re-evaluation seconds (tests)")
    ap.add_argument("--bank", type=Path, default=BANK, help="the live bank dir the torus attestations bind to (tests)")
    a = ap.parse_args()
    work = a.out.parent
    try:
        receipt = score(a.candidate, work, a.timeout, torus_budget=a.torus_budget, bank=a.bank.resolve())
    except (OSError, ValueError, KeyError, TypeError, ArithmeticError) as e:
        receipt = {"ok": False, "score": None, "metrics": {}, "error": f"{type(e).__name__}: {e}"}
    a.out.write_text(json.dumps(receipt, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({k: receipt[k] for k in ("ok", "score", "error")}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
