#!/usr/bin/env python3
"""draw.py: the fixed draw of Stage 3's 490 problems from the pool the paper names (agentica-org/DeepScaleR-Preview-
Dataset), on the desk, before any pod exists. Rules: notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md.

The rule (it uses no random generator; the salt below is the seed):
  pool       deepscaler.json at revision b6ae8c60f5c1f2b594e2140b91c49c9ad0949e29, sha256 4e9e7b18...8ba4 (refused
             otherwise); row i (0-based, file order) is problem "dsr-%05d" % i. The pool has no identifiers of its own.
  exclusions E1 the answer is empty; E2 the gold answer's canonical class is not one of q, sqrt, pi, deg, c under BOTH
             graders (grade3.py and grade3.js must agree on the class, or the row is excluded too); E3 the problem's
             normalised text (lower case, whitespace collapsed) occurs more than once in the pool: every copy is
             excluded; E4 the normalised text equals a MATH-500 problem's (HuggingFaceH4/MATH-500 @ 6e4ed1a2,
             test.jsonl sha256 35dc4108...6132, the WSP lane's pinned copy).
             NOT excluded, because it cannot be identified: the paper's held-out items 500-999. Their order comes from
             an unpublished split, and their identifiers from an unpublished hash.
  order      key(i) = sha256("qwen-self-rewriting-stage3|2026-11-26|" + id + "|" + sha256(problem)); the 490 eligible
             rows with the smallest keys, written in pool order.
  seed       per problem, shared by every arm: int(sha256("qwen-self-rewriting-stage3-seed|" + id)[:8], 16) & 0x7fffffff.

usage: python3 draw.py POOL.json MATH500.jsonl OUTDIR     (writes OUTDIR/draw-490.jsonl and OUTDIR/draw.json)
       python3 draw.py --check OUTDIR POOL.json MATH500.jsonl (redraws and compares byte for byte; K5)
MIT"""
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import grade3  # noqa: E402

POOL_SHA = "4e9e7b18248d982b4498a54a6bdb37b1bb653cf5f77bc309fa67a6c2533c8ba4"
POOL_REV = "b6ae8c60f5c1f2b594e2140b91c49c9ad0949e29"
MATH500_SHA = "35dc41080a3680858b27fa7e0533d2d547825316fc5dafe5d316f4ccc5a06132"
SALT = "qwen-self-rewriting-stage3|2026-11-26|"
SEED_SALT = "qwen-self-rewriting-stage3-seed|"
N = 490


def sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def sha_text(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def norm(s):
    return re.sub(r"\s+", " ", s.lower()).strip()


def js_classes(golds):
    """the gold classes under grade3.js, one node process for all"""
    lines = "".join(json.dumps({"key": i, "gold": g}) + "\n" for i, g in enumerate(golds))
    r = subprocess.run(["node", os.path.join(HERE, "grade3.js"), "--batch"], input=lines, capture_output=True,
                       text=True, check=True)
    out = [json.loads(l) for l in r.stdout.splitlines() if l.strip()]
    if len(out) != len(golds):
        raise SystemExit("grade3.js returned %d classes for %d golds" % (len(out), len(golds)))
    return [o["gold_class"] for o in out]


def draw(pool_path, math500_path):
    if sha_file(pool_path) != POOL_SHA:
        raise SystemExit("REFUSED: the pool's sha256 is not the pinned one")
    if sha_file(math500_path) != MATH500_SHA:
        raise SystemExit("REFUSED: MATH-500's sha256 is not the pinned one")
    pool = json.load(open(pool_path, encoding="utf-8"))
    m500 = {norm(json.loads(l)["problem"]) for l in open(math500_path, encoding="utf-8") if l.strip()}
    counts = Counter(norm(r["problem"]) for r in pool)
    golds = [str(r.get("answer") or "") for r in pool]
    jsc = js_classes(golds)
    why = Counter()
    eligible = []
    for i, r in enumerate(pool):
        gold = golds[i]
        pyc = grade3.gold_class(gold)
        nt = norm(r["problem"])
        if gold.strip() == "":
            why["E1 empty answer"] += 1
        elif pyc != jsc[i]:
            why["E2 the graders disagree on the gold's class"] += 1
        elif pyc not in grade3.ELIGIBLE_GOLD:
            why["E2 gold class %s" % pyc] += 1
        elif counts[nt] > 1:
            why["E3 repeated in the pool"] += 1
        elif nt in m500:
            why["E4 a MATH-500 problem"] += 1
        else:
            pid = "dsr-%05d" % i
            psha = sha_text(r["problem"])
            eligible.append((sha_text(SALT + pid + "|" + psha), i, pid, psha, pyc))
    eligible.sort()
    chosen = sorted(eligible[:N], key=lambda t: t[1])
    rows = []
    for key, i, pid, psha, cls in chosen:
        seed = int(hashlib.sha256((SEED_SALT + pid).encode()).hexdigest()[:8], 16) & 0x7FFFFFFF
        rows.append({"id": pid, "index": i, "problem": pool[i]["problem"], "answer": golds[i], "gold_class": cls,
                     "problem_sha256": psha, "seed": seed, "key": key})
    body = "".join(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n" for r in rows)
    seeds = [r["seed"] for r in rows]
    meta = {
        "what": "Stage 3's fixed draw of 490 problems from the paper's pool (rule: instruments/qwen-self-rewriting/stage3/draw.py)",
        "pool": {"repo": "agentica-org/DeepScaleR-Preview-Dataset", "revision": POOL_REV, "file": "deepscaler.json",
                 "bytes": os.path.getsize(pool_path), "sha256": POOL_SHA, "rows": len(pool), "licence": "MIT"},
        "math500": {"repo": "HuggingFaceH4/MATH-500", "revision": "6e4ed1a2a79af7d8630a6b768ec859cb5af4d3be",
                    "file": "test.jsonl", "sha256": MATH500_SHA},
        "salt": SALT, "seed_salt": SEED_SALT, "n": N,
        "excluded": dict(sorted(why.items())), "eligible": len(eligible),
        "gold_classes_drawn": dict(Counter(r["gold_class"] for r in rows)),
        "distinct_seeds": len(set(seeds)),
        "not_excluded_because_unidentifiable": "the paper's held-out items 500-999 (split order and identifier hash unpublished)",
        "expected_chance_overlap_with_the_papers_490": round(N * 490 / len(pool), 1),
        "file": "draw-490.jsonl", "file_sha256": sha_text(body), "file_bytes": len(body.encode("utf-8")),
        "ids_sha256": sha_text("\n".join(r["id"] for r in rows) + "\n"),
        "script_sha256": sha_file(os.path.abspath(__file__)),
    }
    return body, meta


def main():
    a = sys.argv[1:]
    if a and a[0] == "--check":
        out, pool, m5 = a[1:4]
        body, meta = draw(pool, m5)
        old = open(os.path.join(out, "draw-490.jsonl"), encoding="utf-8").read()
        rec = json.load(open(os.path.join(out, "draw.json")))
        ok = old == body and rec["file_sha256"] == meta["file_sha256"] == sha_text(old)
        print(json.dumps({"redraw_equal": ok, "file_sha256": meta["file_sha256"]}))
        sys.exit(0 if ok else 1)
    if len(a) != 3:
        sys.exit(__doc__)
    pool, m5, out = a
    body, meta = draw(pool, m5)
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "draw-490.jsonl"), "w", encoding="utf-8") as f:
        f.write(body)
    with open(os.path.join(out, "draw.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(json.dumps({k: meta[k] for k in ("eligible", "excluded", "gold_classes_drawn", "file_sha256", "ids_sha256")}, indent=1))


if __name__ == "__main__":
    main()
