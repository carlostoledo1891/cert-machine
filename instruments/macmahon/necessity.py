#!/usr/bin/env python3
"""necessity.py — MacMahon's 30 cubes, the NECESSITY side, route A (clean room): an exhaustive search for the
least total m* at which some inventory of cubes builds a 2x2x2 model of every one of the 30 varieties, and for
ALL universal inventories of that total. Python 3.9 standard library + one C99 file (necessity.c, the engine),
compiled with `cc -O2` into a temporary folder that is deleted afterwards.

usage: python3 instruments/macmahon/necessity.py <variant>      variant = base | reflections | shared | useless | required
       python3 instruments/macmahon/necessity.py selftest       the self-tests (a JSON summary; a minute or two)
       options: --max-total=N (default 12); --engine=py (the slow pure-Python engine instead of C);
                --unpruned (the pruning rule switched off: EVERY inventory of every total is visited and
                judged — C(43,12) = 15,338,678,264 sequences for base, about seven minutes; the check that
                the pruning discards nothing)
stdout: ONE JSON object and nothing else:
          "variant"    the variant
          "m_star"     the least total 0..12 with a universal inventory; null when there is none up to 12
          "universal"  ALL universal inventories of total m_star, sorted; each a sorted list of [i, j, count],
                       count > 0, (i, j) the Lean pair of the variety
          "levels"     for each total searched, "0" .. "<m_star>", the number of universal inventories found
          "nodes"      the partial inventories examined (non-decreasing sequences, the empty one included),
                       summed over the totals searched
          "seconds"    wall time; the only field that differs from run to run

THE MODEL, built here from first principles (nothing is taken from any other program):
  faces      +x, -x, +y, -y, +z, -z, index 2*axis + (1 if negative); a colouring is six distinct colours 1..6.
  rotations  the signed permutations of the three axes (48), those of determinant +1 being the 24 proper ones.
  varieties  the classes of the 720 colourings under the 24 proper rotations: 30 of them, each named by its
             least colouring, taken in increasing order (index 0..29). This order is the search order.
  slots      the eight sign patterns (sx, sy, sz); a slot exposes the three faces pointing outward.
  fits       a cube of variety v fits slot k of target t when some allowed placement of it shows t's colours
             on the three exposed faces of k.
  builds     an inventory builds t when the eight slots of t can be filled by eight DISTINCT physical cubes of
             the stock, each fitting its slot. universal = builds all 30 targets.
The table faceColours of corpus/macmahon/Challenge.lean is read only to NAME a variety by its Lean pair (i, j);
on the way it is checked that its 30 off-diagonal rows are 30 different varieties.

THE VARIANTS
  base         as above.
  reflections  a cube may be placed under any of the 48 signed permutations (the fit table is larger).
  shared       the eight slots need not receive distinct cubes (one cube may fill several slots).
  useless      the variety with Lean pair (0, 1) fits no slot of any target (its column of the fit table is 0);
               it is still one of the 30 targets and may still be held.
  required     only inventories holding at least one cube of the variety with Lean pair (0, 1) are counted
               (a filter on the leaves of the base search; nothing is pruned because of it).

WHY THE SEARCH IS EXHAUSTIVE (the engine is necessity.c; engine_py below is the same search, written apart)
  1. Enumeration. An inventory of total T is, in exactly one way, a non-decreasing sequence of T variety
     indices. The search walks the tree of all non-decreasing sequences, a node's children being every variety
     >= its last one. With no pruning its leaves at depth T are all inventories of total T, each exactly once.
  2. Totals are searched in the order 0, 1, 2, ..., each one completely, and the search stops after the first
     total with a universal inventory. So every total below m* was searched whole and found empty.
  3. The leaf test is the definition: for each of the 30 targets an explicit maximum bipartite matching of
     physical cubes to slots (augmenting paths) must fill all eight slots. No Hall-type count is used anywhere.
  4. The ONE pruning rule, the joker top-up. At a node with d cubes chosen, the last of variety m, every
     completion adds exactly R = T - d cubes of varieties >= m. Stand R jokers in for them, a joker being
     allowed in each slot that at least one variety >= m fits. If the chosen cubes plus the R jokers cannot
     fill the eight slots of some target t (explicit matching again), the subtree is abandoned. This can never
     discard a universal inventory: if a completion builds t, swap each of its later cubes for a joker — the
     joker is allowed wherever that cube sat — and the same assignment fills t from the joker stock. So when
     the joker stock fails, no completion builds t. This is monotonicity and nothing else: a piece replaced by
     one allowed in at least the same slots never breaks a build. (For base, useless, required and reflections
     the joker test is in fact EQUIVALENT to "some completion builds t"; for shared it is only necessary.)
  5. Nothing else is pruned: no symmetry, no count, no theorem of Challenge.lean, nothing about any answer.
     The order in which targets are tried at a node changes the time, never which nodes are visited.
  6. Every inventory the engine reports is judged again here by a routine that shares nothing with the
     engine's matching (verify_reported: the family of all slot sets the stock can fill, built piece by piece),
     so a reported inventory is universal by two routines. (This guards against a false report; that nothing
     is MISSED rests on points 1-5. Point 4 can be taken out of the argument altogether: --unpruned runs the
     same walk with the rule switched off, every inventory of every total visited and judged by the matching.)

Deterministic: single-threaded, no randomness (the self-test uses a fixed linear congruential sequence), no
dependence on time except the "seconds" field.
MIT · cert-machine"""
import itertools
import json
import os
import re
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
LEAN = os.path.join(ROOT, "corpus", "macmahon", "Challenge.lean")
CSRC = os.path.join(HERE, "necessity.c")
VARIANTS = ("base", "reflections", "shared", "useless", "required")
MAX_TOTAL = 12

# ------------------------------------------------------------------------------------------------ the geometry
# A face is (axis, sign); its index is 2*axis + (0 for +, 1 for -).
def face_index(axis, sign):
    return 2 * axis + (0 if sign > 0 else 1)


def signed_permutations():
    """All 48 signed axis permutations, each as (determinant, face map), the face map g sending the face with
    index f to the face with index g[f]. The matrix sends the unit vector e_a to signs[a] * e_perm[a]."""
    out = []
    for perm in itertools.permutations(range(3)):
        inversions = sum(1 for a in range(3) for b in range(a + 1, 3) if perm[a] > perm[b])
        for signs in itertools.product((1, -1), repeat=3):
            det = (-1) ** inversions * signs[0] * signs[1] * signs[2]
            g = [None] * 6
            for axis in range(3):
                for sign in (1, -1):
                    g[face_index(axis, sign)] = face_index(perm[axis], sign * signs[axis])
            out.append((det, tuple(g)))
    return out


def place(colouring, g):
    """the colouring after the cube is moved by g: the colour on face f arrives on face g[f]"""
    out = [None] * 6
    for f in range(6):
        out[g[f]] = colouring[f]
    return tuple(out)


ALL48 = sorted({g for _, g in signed_permutations()})
PROPER = sorted({g for det, g in signed_permutations() if det == 1})
assert len(ALL48) == 48 and len(PROPER) == 24 and set(PROPER) < set(ALL48)
assert all(sorted(g) == list(range(6)) for g in ALL48)
# every map keeps opposite faces opposite
assert all((g[2 * a] ^ 1) == g[2 * a + 1] for g in ALL48 for a in range(3))


def canonical(colouring):
    return min(place(colouring, g) for g in PROPER)


COLOURINGS = list(itertools.permutations(range(1, 7)))
assert len(COLOURINGS) == 720
VARIETY = sorted({canonical(c) for c in COLOURINGS})      # VARIETY[v] = the least colouring of variety v
NV = len(VARIETY)
assert NV == 30
INDEX = {c: v for v, c in enumerate(VARIETY)}
# each class has exactly 24 colourings (no proper rotation but the identity fixes a colouring)
assert all(len({place(c, g) for g in PROPER}) == 24 for c in VARIETY)

# the eight corner slots: sign pattern (sx, sy, sz) -> the three outward faces
SLOTS = [tuple(face_index(axis, s) for axis, s in enumerate(signs)) for signs in itertools.product((1, -1), repeat=3)]
assert len(SLOTS) == 8 and len(set(SLOTS)) == 8


def fits(v, t, k, group):
    """does a cube of variety v, under some placement of `group`, show target t's colours on slot k's faces?"""
    target = VARIETY[t]
    for g in group:
        shown = place(VARIETY[v], g)
        if all(shown[f] == target[f] for f in SLOTS[k]):
            return True
    return False


def fit_table(group):
    """fit[t][v] = 8-bit set of the slots k of target t that variety v fits"""
    return [[sum(1 << k for k in range(8) if fits(v, t, k, group)) for v in range(NV)] for t in range(NV)]


# ------------------------------------------------------------------------------------------- the Lean names
def lean_names():
    """variety index -> Lean pair (i, j), from the table faceColours of Challenge.lean; checks the table"""
    text = open(LEAN, encoding="utf-8").read()
    m = re.search(r"def faceColours\s*:[^\n]*:=\s*(!\[[^\n]*)\n", text)
    if not m:
        raise SystemExit("faceColours not found in " + LEAN)
    table = json.loads(m.group(1).replace("!", "").replace(" ", ""))
    assert len(table) == 6 and all(len(row) == 6 and all(len(c) == 6 for c in row) for row in table)
    name = {}
    for i in range(6):
        assert table[i][i] == [0] * 6
        for j in range(6):
            if i == j:
                continue
            c = tuple(table[i][j])
            assert sorted(c) == [1, 2, 3, 4, 5, 6], "row (%d, %d) is not six distinct colours" % (i, j)
            v = INDEX[canonical(c)]
            assert v not in name, "rows %r and (%d, %d) are the same variety" % (name.get(v), i, j)
            name[v] = (i, j)
    assert len(name) == 30
    assert tuple(table[0][1]) == (1, 5, 2, 4, 6, 3)
    return [name[v] for v in range(NV)], table


# ------------------------------------------------------------------------------- "builds", by brute force
def builds_bruteforce(masks, shared, jokers=0, joker_mask=0):
    """Can the eight slots be filled? masks[i] = slots that physical piece i is allowed in; `jokers` further
    pieces are allowed in joker_mask. Distinct pieces for distinct slots unless `shared`. Plain backtracking
    over the slots, trying every piece: the definition, with no matching theory."""
    n = len(masks)
    used = [False] * n

    def go(k, jokers_left):
        if k == 8:
            return True
        bit = 1 << k
        for i in range(n):
            if masks[i] & bit and (shared or not used[i]):
                used[i] = True
                if go(k + 1, jokers_left):
                    return True
                used[i] = False
        if joker_mask & bit and jokers_left > 0:
            return go(k + 1, jokers_left if shared else jokers_left - 1)
        return False
    return go(0, jokers)


def verify_universal(seq, fit, shared, targets=None):
    """one inventory (a sequence of variety indices) judged from the fit table by brute force"""
    return all(builds_bruteforce([fit[t][v] for v in seq], shared) for t in (range(NV) if targets is None else targets))


# bit S of NOT_HOLDING[s] is set for every set S of slots (S = 0..255 as a bit set) that does not hold slot s
NOT_HOLDING = [sum(1 << S for S in range(256) if not S >> s & 1) for s in range(8)]


def fillable_sets(reach, mask):
    """reach: the family of slot sets that the pieces so far can fill exactly, each piece taking one slot or
    none (a 256-bit integer, bit S for the slot set S). Returns the family after one more piece allowed in
    the slots of `mask`: every old set, and every old set plus one slot of `mask` it did not hold."""
    out = reach
    for s in range(8):
        if mask >> s & 1:
            out |= (reach & NOT_HOLDING[s]) << (1 << s)
    return out


def verify_reported(found, fit, shared):
    """Every inventory the engine reported, judged again by a third routine that shares nothing with the
    engine's matching: for each target the family of ALL slot sets the stock can fill is computed piece by
    piece (fillable_sets), and the full set of eight slots must be in it. The families are kept on a stack along
    the sequence, so that inventories sharing a prefix (the engine reports in lexicographic order) share work."""
    start = [0 if shared else 1] * NV          # shared: the slots covered so far; else the family {empty set}
    stack, prev = [], ()
    for seq in found:
        d = 0
        while d < len(prev) and d < len(seq) and prev[d] == seq[d]:
            d += 1
        del stack[d:]
        for v in seq[d:]:
            base = stack[-1] if stack else start
            if shared:
                stack.append([base[t] | fit[t][v] for t in range(NV)])
            else:
                stack.append([fillable_sets(base[t], fit[t][v]) for t in range(NV)])
        final = stack[-1] if stack else start
        if not all((x == 255) if shared else (x >> 255 & 1) for x in final):
            return False
        prev = seq
    return True


# ------------------------------------------------------------------------------------- the engine, in Python
def engine_py(fit, nt, tmax, shared, required, prune):
    """The search of necessity.c written apart and differently: no incremental matching, every node judged from
    scratch by builds_bruteforce. Same tree, same pruning rule, so the same node counts. Slow; for cross-checks
    and small totals. Returns (m_star or None, universal sequences, {total: found}, {total: nodes})."""
    jok = [[0] * (NV + 1) for _ in range(nt)]
    for t in range(nt):
        for v in range(NV - 1, -1, -1):
            jok[t][v] = jok[t][v + 1] | fit[t][v]
    levels, nodes_at, found = {}, {}, []

    for total in range(tmax + 1):
        seq, count = [], [0]

        def node_ok(d):
            count[0] += 1
            m = seq[-1] if seq else 0
            if prune:
                return all(builds_bruteforce([fit[t][v] for v in seq], shared, total - d, jok[t][m]) for t in range(nt))
            return d < total or verify_universal(seq, fit, shared, range(nt))

        def search(d, vmin):
            if d == total:
                if required < 0 or required in seq:
                    found.append(tuple(seq))
                return
            for v in range(vmin, NV):
                seq.append(v)
                if node_ok(d + 1):
                    search(d + 1, v)
                seq.pop()

        if node_ok(0):
            search(0, 0)
        levels[total], nodes_at[total] = len(found), count[0]
        if found:
            return total, found, levels, nodes_at
    return None, [], levels, nodes_at


# ------------------------------------------------------------------------------------------ the engine, in C
def engine_c(fit, nt, tmax, shared, required, prune, binary):
    text = "%d %d %d %d %d %d\n" % (NV, nt, tmax, 1 if shared else 0, required, 1 if prune else 0)
    text += "".join(" ".join(str(x) for x in fit[t]) + "\n" for t in range(nt))
    out = subprocess.run([binary], input=text.encode(), stdout=subprocess.PIPE, check=True).stdout.decode()
    levels, nodes_at, found, m_star, seen_m, total_nodes = {}, {}, [], None, False, None
    for line in out.splitlines():
        p = line.split()
        if p[0] == "L":
            levels[int(p[1])], nodes_at[int(p[1])] = int(p[2]), int(p[3])
        elif p[0] == "U":
            found.append(tuple(int(x) for x in p[1:]))
        elif p[0] == "M":
            seen_m, m_star = True, (None if int(p[1]) < 0 else int(p[1]))
        elif p[0] == "N":
            total_nodes = int(p[1])
        else:
            raise SystemExit("engine: unreadable line " + line)
    if not seen_m or total_nodes != sum(nodes_at.values()):
        raise SystemExit("engine: incomplete output")
    return m_star, found, levels, nodes_at


def compile_engine(folder):
    binary = os.path.join(folder, "necessity")
    subprocess.run(["cc", "-O2", "-std=c99", "-o", binary, CSRC], check=True, stdout=subprocess.DEVNULL)
    return binary


# -------------------------------------------------------------------------------------------- one variant
def problem(variant, names):
    """the fit table, the shared flag and the required variety (or -1) of a variant"""
    lean01 = names.index((0, 1))
    assert VARIETY[lean01] == canonical((1, 5, 2, 4, 6, 3))
    fit = fit_table(ALL48 if variant == "reflections" else PROPER)
    # a cube of a variety fits every slot of its own variety
    assert all(fit[t][t] == 255 for t in range(NV))
    if variant == "useless":
        for t in range(NV):
            fit[t][lean01] = 0
    return fit, variant == "shared", (lean01 if variant == "required" else -1)


def run_variant(variant, engine="c", tmax=MAX_TOTAL, prune=True):
    t0 = time.time()
    names, _ = lean_names()
    fit, shared, required = problem(variant, names)
    if engine == "py":
        m_star, found, levels, nodes_at = engine_py(fit, NV, tmax, shared, required, prune)
    else:
        with tempfile.TemporaryDirectory() as folder:
            m_star, found, levels, nodes_at = engine_c(fit, NV, tmax, shared, required, prune, compile_engine(folder))
    # what the engine returns is checked before it is printed
    assert sorted(levels) == list(range((tmax if m_star is None else m_star) + 1))
    assert all(levels[t] == 0 for t in levels if t != m_star)
    assert len(found) == (0 if m_star is None else levels[m_star]) and len(set(found)) == len(found)
    assert verify_reported(found, fit, shared), "the engine reported an inventory that the second judge rejects"
    universal = []
    for seq in found:
        assert len(seq) == m_star and list(seq) == sorted(seq)
        assert required < 0 or required in seq
        universal.append(sorted([names[v][0], names[v][1], seq.count(v)] for v in set(seq)))
    universal.sort()
    return {"variant": variant, "m_star": m_star, "universal": universal,
            "levels": {str(t): levels[t] for t in sorted(levels)},
            "nodes": sum(nodes_at.values()), "seconds": round(time.time() - t0, 3)}


# ------------------------------------------------------------------------------------------- the self-tests
def selftest():
    t0 = time.time()
    res = {}
    names, table = lean_names()
    res["rotations_proper"], res["placements_with_reflections"], res["varieties"] = len(PROPER), len(ALL48), NV
    # the 48 placements merge the 30 varieties in mirror pairs: 15 classes
    res["classes_under_48"] = len({min(place(c, g) for g in ALL48) for c in VARIETY})
    # the proper rotations are closed under composition, and so are the 48
    comp = lambda g, h: tuple(g[h[f]] for f in range(6))
    res["proper_closed"] = all(comp(g, h) in set(PROPER) for g in PROPER for h in PROPER)
    res["all48_closed"] = all(comp(g, h) in set(ALL48) for g in ALL48 for h in ALL48)
    # the fit relation does not depend on the representative colourings chosen for cube and target
    fit = fit_table(PROPER)
    fit48 = fit_table(ALL48)
    ok = True
    for v in range(NV):
        for t in range(NV):
            for gi in (3, 11, 17):
                cube, target = place(VARIETY[v], PROPER[gi]), place(VARIETY[t], PROPER[23 - gi])
                # the slots of the moved target are the images of the original's: the NUMBER fitted must not change
                n = sum(1 for k in range(8) if any(all(place(cube, g)[f] == target[f] for f in SLOTS[k]) for g in PROPER))
                ok = ok and n == bin(fit[t][v]).count("1")
    res["fit_independent_of_representative"] = ok
    res["fit_pairs_base"] = sum(bin(fit[t][v]).count("1") for t in range(NV) for v in range(NV))
    res["fit_pairs_reflections"] = sum(bin(fit48[t][v]).count("1") for t in range(NV) for v in range(NV))
    res["base_fit_subset_of_reflections_fit"] = all(fit[t][v] & ~fit48[t][v] == 0 for t in range(NV) for v in range(NV))

    # matching against brute force on pseudo-random stocks (fixed linear congruential sequence)
    state = [20261113]

    def rnd(n):
        state[0] = (state[0] * 6364136223846793005 + 1442695040888963407) % (1 << 64)
        return (state[0] >> 33) % n

    def builds_matching(masks, jokers, joker_mask):       # augmenting paths, as in necessity.c
        lm = list(masks) + [joker_mask] * jokers
        own = [-1] * 8

        def aug(u, seen):
            for s in range(8):
                if lm[u] >> s & 1 and not seen[s]:
                    seen[s] = True
                    if own[s] < 0 or aug(own[s], seen):
                        own[s] = u
                        return True
            return False
        for u in range(len(lm)):
            aug(u, [False] * 8)
        return all(o >= 0 for o in own)

    trials = agree = yes = 0
    for _ in range(40000):
        n, jk = rnd(13), rnd(4)
        t = rnd(NV)
        if rnd(2):
            masks = [fit[t][rnd(NV)] for _ in range(n)]         # real cubes against a real target
            jm = fit[t][rnd(NV)] | fit[t][rnd(NV)] | fit[t][rnd(NV)]
        else:
            masks = [rnd(256) & rnd(256) for _ in range(n)]     # arbitrary allowed-slot sets
            jm = rnd(256)
        a, b = builds_matching(masks, jk, jm), builds_bruteforce(masks, False, jk, jm)
        reach = 1
        for mask in masks + [jm] * jk:
            reach = fillable_sets(reach, mask)
        c = bool(reach >> 255 & 1)
        trials, agree, yes = trials + 1, agree + (a == b == c), yes + (1 if b else 0)
    res["matching_vs_bruteforce_vs_fillable_sets"] = {"trials": trials, "all_three_agree": agree, "built": yes}

    lean01 = names.index((0, 1))
    with tempfile.TemporaryDirectory() as folder:
        binary = compile_engine(folder)
        cases = []

        def rows(f, targets):
            return [f[t] for t in targets]

        def compare(label, a, b, nodes_too):
            same = a[0] == b[0] and sorted(a[1]) == sorted(b[1]) and a[2] == b[2]
            case = {"case": label, "same_answer": same, "m_star": a[0], "found": len(a[1]),
                    "nodes_a": sum(a[3].values()), "nodes_b": sum(b[3].values())}
            if nodes_too:
                case["same_nodes_per_total"] = a[3] == b[3]
            cases.append(case)
            return case

        # (1) the C engine against the Python engine (written apart, every node judged from scratch by brute
        #     force), pruning on, the full problems: the answers AND the node counts of every total must agree
        for variant, tmax in (("base", 10), ("useless", 10), ("required", 10), ("reflections", 7), ("shared", 12)):
            f, sh, rq = problem(variant, names)
            compare("C vs Python, pruned, %s, all 30 targets, totals 0..%d" % (variant, tmax),
                    engine_c(f, NV, tmax, sh, rq, True, binary), engine_py(f, NV, tmax, sh, rq, True), True)
        # (2) pruned against UNPRUNED (every inventory of every total visited and judged), the full problems
        #     (to total 9 here; `<variant> --unpruned` does the same to total 12, in minutes)
        for variant, tmax in (("base", 9), ("useless", 9), ("required", 9), ("reflections", 8), ("shared", 12)):
            f, sh, rq = problem(variant, names)
            b = engine_c(f, NV, tmax, sh, rq, False, binary)
            case = compare("pruned vs unpruned, %s, all 30 targets, totals 0..%d" % (variant, tmax),
                           engine_c(f, NV, tmax, sh, rq, True, binary), b, False)
            # the unpruned walk visits every non-decreasing sequence of length <= total, and nothing else
            case["unpruned_nodes_are_all_sequences"] = b[3] == {T: sum(_multisets(NV, d) for d in range(T + 1)) for T in b[3]}
        # (3) pruned against unpruned on REDUCED problems, where only a few targets must be built, so that
        #     answers exist at totals 8 and 9 in their thousands and the pruning is exercised on them; some
        #     of these also against the Python engine
        reduced = (("base", (0, 1), 8, True), ("base", (lean01, 29), 8, True), ("base", (0, 7, 19), 9, False),
                   ("base", (3, 12, 21, 28), 9, False),
                   ("useless", (lean01, 0), 8, True), ("useless", (lean01, 5, 17), 9, False),
                   ("required", (lean01,), 8, False), ("required", (lean01, 0), 9, False),
                   ("reflections", tuple(range(0, 30, 2)), 8, False),
                   ("shared", (0, 1, 2, 3, 4), 8, True), ("shared", tuple(range(20)), 8, True))
        for variant, targets, tmax, with_python in reduced:
            f, sh, rq = problem(variant, names)
            f = rows(f, targets)
            a = engine_c(f, len(targets), tmax, sh, rq, True, binary)
            label = "%s, targets %s only, totals 0..%d" % (variant, list(targets), tmax)
            compare("pruned vs unpruned, " + label, a, engine_c(f, len(targets), tmax, sh, rq, False, binary), False)
            if with_python:
                compare("C vs Python, pruned, " + label, a, engine_py(f, len(targets), tmax, sh, rq, True), True)
        res["engine_cases"] = cases
    res["all_passed"] = (res["rotations_proper"] == 24 and res["placements_with_reflections"] == 48 and NV == 30
                         and res["classes_under_48"] == 15 and res["proper_closed"] and res["all48_closed"]
                         and res["fit_independent_of_representative"] and res["base_fit_subset_of_reflections_fit"]
                         and trials == agree
                         and all(c["same_answer"] and c.get("same_nodes_per_total", True)
                                 and c.get("unpruned_nodes_are_all_sequences", True) for c in cases))
    res["seconds"] = round(time.time() - t0, 1)
    return res


def _multisets(n, k):
    """the number of multisets of size k from n kinds: C(n + k - 1, k)"""
    out = 1
    for i in range(1, k + 1):
        out = out * (n + i - 1) // i
    return out


def main(argv):
    engine, tmax, prune, words = "c", MAX_TOTAL, True, []
    for a in argv:
        if a.startswith("--engine="):
            engine = a.split("=", 1)[1]
        elif a == "--unpruned":
            prune = False
        elif a.startswith("--max-total="):
            tmax = int(a.split("=", 1)[1])
        else:
            words.append(a)
    if len(words) != 1 or words[0] not in VARIANTS + ("selftest",) or engine not in ("c", "py") or not 0 <= tmax <= MAX_TOTAL:
        sys.stderr.write("usage: necessity.py base|reflections|shared|useless|required|selftest [--max-total=N] [--engine=py] [--unpruned]\n")
        return 2
    if words[0] == "selftest":
        res = selftest()
        print(json.dumps(res, indent=1))
        return 0 if res["all_passed"] else 1
    print(json.dumps(run_variant(words[0], engine, tmax, prune)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
