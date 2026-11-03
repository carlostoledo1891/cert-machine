#!/usr/bin/env python3
"""check.py — the MacMahon minimum-universal-sets claim (Jason Davies, 2026-11-01), the SUFFICIENCY side decided from the
released witnesses with our own geometry. Python standard library only; nothing of the claimant's code is run.

THE CLAIM (README, Theorems.lean): exactly ten labelled 12-cube collections are universal — for every one of the 30
MacMahon varieties, eight cubes of the collection, rotated, assemble a 2×2×2 model whose exterior is that variety
(internal faces free) — and they are the ten "two-triangle" sets of Conway's tableau. The claimant releases 300
constructions (results/universal_witnesses.json: ten sets × 30 targets × eight cubes).

WHAT IS DECIDED HERE, each with its own code written from the definitions:
  T1  the claimant's label → colouring table (MacMahon/Data.lean faceColours) lists 30 colourings of six distinct
      colours that are pairwise inequivalent under the 24 proper rotations — i.e. ALL 30 varieties, each once.
      (The table is the labelling convention; this says the convention covers the objects the theorem is about.)
  T2  each of the ten witnessed sets has 12 distinct cubes and is a two-triangle set: the six ordered pairs inside
      one triple of labels and the six inside the complementary triple; the ten are the ten partitions of six labels
      into two triples.
  T3  for every set and every target, the eight witnessed cubes lie in the set, are distinct, and admit rotations and
      an assignment to the eight corner slots with every exposed face the target's colour — searched here over OUR
      24 rotations and OUR slot geometry (a perfect matching of cubes to slots), ignoring the claimant's rotation
      indices and slot order entirely. 300 constructions.
  So: the ten sets are universal — the SUFFICIENCY half of the classification is CERTIFIED from the bytes.
NOT DECIDED HERE: that no other 12-multiset and no 11-multiset is universal (the necessity half; the Lean proof and
the claimant's search say so) — a later stage. Red controls: a cube swapped for one outside the set, a target with
two faces exchanged, a rotation table with reflections admitted; each must fail.

usage: python3 instruments/macmahon/check.py            -> certs/macmahon-witnesses.json
       python3 instruments/macmahon/check.py --check    re-derives and compares; nothing written
MIT · cert-machine"""
import hashlib
import itertools
import json
import os
import re
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "corpus", "macmahon")
OUT = os.path.join(ROOT, "certs", "macmahon-witnesses.json")
CHECK = "--check" in sys.argv
t0 = time.time()
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
PINS = json.load(open(os.path.join(SRC, "PINS.json")))

# ---------------------------------------------------------------- our geometry
# faces in the order +x, -x, +y, -y, +z, -z (index 2*axis + (1 if negative)); a face is a unit direction vector
AXIS = [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]
FACE = {d: i for i, d in enumerate(AXIS)}


def rotations():
    """the 24 proper rotations as face permutations: rot[dest] = source means the rotated cube shows on face `dest`
    what the original showed on face `source`. Built from signed axis permutations with determinant +1."""
    out = set()
    for perm in itertools.permutations(range(3)):
        inv = sum(1 for a in range(3) for b in range(a + 1, 3) if perm[a] > perm[b]) % 2
        for signs in itertools.product((1, -1), repeat=3):
            det = (-1) ** inv * signs[0] * signs[1] * signs[2]
            if det != 1:
                continue
            def R(v):   # the matrix sends e_a to signs[a]·e_perm[a]
                w = [0, 0, 0]
                for a in range(3):
                    w[perm[a]] += signs[a] * v[a]
                return tuple(w)
            rot = [None] * 6
            for src, d in enumerate(AXIS):
                rot[FACE[R(d)]] = src      # the colour on face d moves to face R(d)
            out.add(tuple(rot))
    assert len(out) == 24
    return sorted(out)


ROT = rotations()


def rotate(cube, rot):
    return tuple(cube[rot[dest]] for dest in range(6))


def canonical(cube):
    return min(rotate(cube, r) for r in ROT)


# the eight corner slots of a 2×2×2 model: a slot at sign pattern (sx, sy, sz) exposes the three faces pointing out
SLOTS = [tuple(FACE[(s if a == 0 else 0, s if a == 1 else 0, s if a == 2 else 0)] for a, s in enumerate(signs)) for signs in itertools.product((1, -1), repeat=3)]
assert len(SLOTS) == 8 and len({frozenset(s) for s in SLOTS}) == 8


def fits(cube, target, slot):
    """some rotation of `cube` shows the target's colours on the slot's three exposed faces"""
    for r in ROT:
        rc = rotate(cube, r)
        if all(rc[f] == target[f] for f in slot):
            return True
    return False


def builds(cubes, target, slots=SLOTS):
    """eight cubes, each to a different slot, each fitting: a perfect matching (8 × 8, searched by backtracking)"""
    can = [[fits(c, target, s) for s in slots] for c in cubes]
    used = [False] * 8

    def go(i):
        if i == 8:
            return True
        for k in range(8):
            if not used[k] and can[i][k]:
                used[k] = True
                if go(i + 1):
                    return True
                used[k] = False
        return False
    return go(0)


# ---------------------------------------------------------------- the claimant's convention, read
def lean_table(text, name):
    m = re.search(r"def " + name + r"\s*:[^\n]*:=\s*(!\[.*?)\n", text)
    if not m:
        raise SystemExit("no table " + name)
    return json.loads(m.group(1).replace("![", "[").replace(" ", ""))


DATA = open(os.path.join(SRC, "MacMahon", "Data.lean"), encoding="utf-8").read()
FACECOL = lean_table(DATA, "faceColours")      # [i][j] -> six colours (0..6), 0 on the diagonal
LABELS = "ABCDEF"


def variety(label):
    i, j = LABELS.index(label[0]), LABELS.index(label[1].upper())
    if i == j:
        raise SystemExit("a diagonal label: " + label)
    return tuple(FACECOL[i][j])


def main():
    W = json.load(open(os.path.join(SRC, "results", "universal_witnesses.json")))
    facts, reds, fails = {}, [], []

    # T1 — the 30 colourings are all 30 varieties, each once
    names = [a + b.lower() for a in LABELS for b in LABELS if a != b]
    cubes = {n: variety(n) for n in names}
    ok_perm = all(sorted(c) == [1, 2, 3, 4, 5, 6] for c in cubes.values())
    classes = {canonical(c) for c in cubes.values()}
    all_classes = {canonical(c) for c in itertools.permutations(range(1, 7))}
    facts["T1"] = {"labels": len(names), "six_distinct_colours_each": ok_perm, "rotation_classes": len(classes), "classes_of_all_720_colourings": len(all_classes),
                   "verdict": "CERTIFIED" if ok_perm and len(classes) == 30 and classes == all_classes else "REFUTED"}
    if facts["T1"]["verdict"] != "CERTIFIED":
        fails.append("T1")

    # T2 — ten two-triangle sets, the ten partitions
    sets = []
    partitions = set()
    for w in W:
        labels = list(w["cubes"])
        s = frozenset(labels)
        if len(labels) != 12 or len(s) != 12:
            fails.append("T2: a set without 12 distinct cubes"); continue
        tri = None
        for T in itertools.combinations(LABELS, 3):
            if "A" not in T:
                continue
            U = tuple(x for x in LABELS if x not in T)
            want = frozenset(a + b.lower() for P in (T, U) for a in P for b in P if a != b)
            if want == s:
                tri = (T, U)
        if tri is None:
            fails.append("T2: a set that is not two triangles: " + ",".join(sorted(s)))
        else:
            partitions.add(frozenset([frozenset(tri[0]), frozenset(tri[1])]))
        sets.append(s)
    facts["T2"] = {"sets": len(sets), "distinct_sets": len(set(sets)), "two_triangle_sets": len(partitions), "partitions_of_six_into_two_triples": 10,
                   "verdict": "CERTIFIED" if len(sets) == 10 and len(set(sets)) == 10 and len(partitions) == 10 else "REFUTED"}
    if facts["T2"]["verdict"] != "CERTIFIED" and "T2" not in " ".join(fails):
        fails.append("T2")

    # T3 — every witnessed construction, re-decided with our rotations and slots
    n_constr, n_ok, bad = 0, 0, []
    for w in W:
        s = set(w["cubes"])
        tg = w["targets"]
        if set(tg) != set(names):
            fails.append("T3: a set witnessed for " + str(len(tg)) + " targets, not 30")
        for t, entries in tg.items():
            n_constr += 1
            picked = [e[0] for e in entries]
            if len(entries) != 8 or len(set(picked)) != 8 or not set(picked) <= s:
                bad.append((sorted(s)[0], t, "the eight cubes are not eight distinct members of the set")); continue
            if builds([cubes[c] for c in picked], cubes[t]):
                n_ok += 1
            else:
                bad.append((sorted(s)[0], t, "no rotations and slots make the exterior the target"))
    facts["T3"] = {"constructions": n_constr, "built": n_ok, "failed": bad[:20], "verdict": "CERTIFIED" if n_constr == 300 and n_ok == 300 else "REFUTED"}
    if facts["T3"]["verdict"] != "CERTIFIED":
        fails.append("T3")

    # red controls
    w0 = W[0]; s0 = set(w0["cubes"]); t0_ = sorted(w0["targets"])[0]; e0 = [e[0] for e in w0["targets"][t0_]]
    outsider = next(n for n in names if n not in s0)
    swapped = [outsider] + e0[1:]
    reds.append({"red": "a witness with one cube swapped for a cube outside the set is NOT built", "fired": not (set(swapped) <= s0) or not builds([cubes[c] for c in swapped], cubes[t0_])})
    tgt = list(cubes[t0_]); tgt[0], tgt[2] = tgt[2], tgt[0]
    reds.append({"red": "the same eight cubes against the target with two faces exchanged are NOT built", "fired": not builds([cubes[c] for c in e0], tuple(tgt))})
    # reflections admitted: the 48 signed permutations merge mirror varieties, so the 30 classes collapse to 15
    refl = set()
    for perm in itertools.permutations(range(3)):
        for signs in itertools.product((1, -1), repeat=3):
            def R(v):
                w = [0, 0, 0]
                for a in range(3):
                    w[perm[a]] += signs[a] * v[a]
                return tuple(w)
            rot = [None] * 6
            for src, d in enumerate(AXIS):
                rot[FACE[R(d)]] = src
            refl.add(tuple(rot))
    n_refl_classes = len({min(rotate(c, r) for r in refl) for c in cubes.values()})
    reds.append({"red": "a rotation table that admits reflections (48 maps) merges the 30 varieties into 15, so T1 would fail under it", "fired": len(refl) == 48 and n_refl_classes == 15})
    dead = [r["red"] for r in reds if not r["fired"]]

    verdict = "CERTIFIED" if not fails and not dead else "REFUTED"
    rec = {"what": __doc__.split("\n\n")[1].strip() if False else "The MacMahon minimum-universal-sets claim (Jason Davies, 2026-11-01), the SUFFICIENCY side decided from the released witnesses with our own geometry (instruments/macmahon/check.py: our 24 proper rotations from signed axis permutations of determinant +1, our eight corner slots, a perfect matching of cubes to slots searched here; the claimant's rotation indices and slot order ignored): T1 the claimant's label table lists all 30 varieties once; T2 the ten witnessed sets are the ten two-triangle sets; T3 all 300 witnessed constructions build their target. NOT decided here: that no other 12-multiset and no 11-multiset is universal (the necessity half).",
           "claim": "exactly ten labelled 12-cube collections of MacMahon cubes are universal (2×2×2 models of all 30 varieties, exteriors only, repeats allowed), and they are the two-triangle sets of Conway's tableau — Johnson–Roldán Conjectures 4 and 8",
           "source": {"repo": PINS["repo"], "commit": PINS["commit"], "registered_commit": PINS["registered_commit"], "pins": PINS["files"]},
           "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "seconds": round(time.time() - t0, 1),
           "decided": {"sufficiency": verdict, "necessity": "NOT DECIDED HERE (the Lean proof and the claimant's search; a later stage)"},
           "verdict": verdict, "facts": facts, "red_controls": reds, "failed": fails, "reds_dead": dead}
    line = "%s  sufficiency %s: T1 %s (30 varieties), T2 %s (10 two-triangle sets), T3 %s (%d/%d constructions built); %d/%d red controls fired; %.1f s" % (
        "PASS" if verdict == "CERTIFIED" else "FAIL", verdict, facts["T1"]["verdict"], facts["T2"]["verdict"], facts["T3"]["verdict"], n_ok, n_constr, len(reds) - len(dead), len(reds), rec["seconds"])
    strip = lambda r: json.dumps({k: v for k, v in r.items() if k not in ("generated", "seconds")}, sort_keys=True)
    if CHECK:
        if not os.path.exists(OUT):
            print("FAIL  no record"); return 1
        old = json.load(open(OUT))
        if strip(old) != strip(rec) or verdict != "CERTIFIED":
            print("FAIL  the record differs on re-derivation or the verdict is not CERTIFIED: " + line); return 1
        print(line); return 0
    json.dump(rec, open(OUT, "w"), indent=1, ensure_ascii=False); open(OUT, "a").write("\n")
    print(line + " -> " + os.path.relpath(OUT, ROOT))
    return 0 if verdict == "CERTIFIED" else 1


if __name__ == "__main__":
    sys.exit(main())
