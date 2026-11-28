#!/usr/bin/env python3
"""qwen-stage3-record.py: the record of Stage 3 of the audit of "Language Models Can Rewrite Their Own Weights"
(arXiv 2611.21885 v2). It reads a pod's pulled /results (instruments/qwen-self-rewriting/stage3/pull.py), grades every
answer with the two graders that share no code (instruments/qwen-self-rewriting/stage3/grade3.py and grade3.js),
computes every row of notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md exactly, and writes
certs/qwen-self-rewriting-stage3.json. Python standard library only (plus `node` for the second grader and the second
p-value computation).

Exactness: accuracies and differences are rationals over 490; p-values are exact rationals (here as binomial tails,
in stats3.js by enumerating the sign vectors; the two must be equal); the Clopper-Pearson bounds are found by bisection
on exact integer binomial tails (grid 1e-6, rounded outward); the paired interval is delta +- 1.96 SE with SE^2 an exact
rational and its square root rounded outward. The Math-Verify reading decides nothing.
usage: python3 tools/qwen-stage3-record.py RUN_DIR [--out certs/qwen-self-rewriting-stage3.json] [--pod POD_ID]
MIT"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
import zlib
from decimal import ROUND_CEILING, ROUND_FLOOR, Decimal, getcontext
from fractions import Fraction
from math import comb

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S3 = os.path.join(ROOT, "instruments", "qwen-self-rewriting", "stage3")
sys.path.insert(0, S3)
import grade3  # noqa: E402

PREREG = "notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md"
PINS = "corpus/qwen-self-rewriting/stage3/PINS.json"
DRAW = "corpus/qwen-self-rewriting/stage3/draw-490.jsonl"
ALPHA = Fraction(1, 20)
PAPER = {"A_acc": Fraction(572, 1000), "B_acc": Fraction(638, 1000), "delta": Fraction(66, 1000),
         "A_cut": Fraction(336, 1000), "B_cut": Fraction(261, 1000)}
getcontext().prec = 50


def sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def jload(p, default=None):
    try:
        return json.load(open(p, encoding="utf-8"))
    except (OSError, ValueError):
        return default


def dec(q, places=4, up=None):
    """a rational as a decimal string; up=True rounds toward +inf, up=False toward -inf, None to nearest"""
    d = Decimal(q.numerator) / Decimal(q.denominator)
    e = Decimal(1).scaleb(-places)
    mode = ROUND_CEILING if up else ROUND_FLOOR if up is False else None
    return str(d.quantize(e, rounding=mode) if mode else d.quantize(e))


def sqrt_bounds(q, places=6):
    """lower and upper decimal bounds of sqrt(q), q a non-negative rational"""
    d = (Decimal(q.numerator) / Decimal(q.denominator)).sqrt()
    e = Decimal(1).scaleb(-places)
    lo, hi = d.quantize(e, rounding=ROUND_FLOOR), d.quantize(e, rounding=ROUND_CEILING)
    # verify on the rationals: lo^2 <= q <= hi^2
    assert Fraction(str(lo)) ** 2 <= q <= Fraction(str(hi)) ** 2
    return Fraction(str(lo)), Fraction(str(hi))


def binom_ge(k, n_up):
    """P(Bin(k, 1/2) >= n_up) as an exact rational: the paper's sign-flip test with one answer per problem"""
    return Fraction(sum(comb(k, j) for j in range(n_up, k + 1)), 2 ** k)


def cp_bounds(x, n, grid=10 ** 6):
    """the exact Clopper-Pearson 95% bounds of a binomial proportion, outward on a 1e-6 grid"""
    a2 = Fraction(1, 40)

    def upper_tail(k):   # P(X >= x) at p = k / grid, compared exactly
        return sum(comb(n, j) * k ** j * (grid - k) ** (n - j) for j in range(x, n + 1))

    def lower_tail(k):   # P(X <= x)
        return sum(comb(n, j) * k ** j * (grid - k) ** (n - j) for j in range(0, x + 1))
    G = grid ** n
    if x == 0:
        lo = 0
    else:
        a, b = 0, grid      # largest k with P(X >= x; k) <= a2: the lower bound lies at or above it
        while b - a > 1:
            m = (a + b) // 2
            if upper_tail(m) * a2.denominator <= a2.numerator * G:
                a = m
            else:
                b = m
        lo = a
    if x == n:
        hi = grid
    else:
        a, b = 0, grid      # smallest k with P(X <= x; k) <= a2
        while b - a > 1:
            m = (a + b) // 2
            if lower_tail(m) * a2.denominator <= a2.numerator * G:
                b = m
            else:
                a = m
        hi = b
    return Fraction(lo, grid), Fraction(hi, grid)


def looping(text):
    tail = (text or "")[-6000:].encode("utf-8")
    return bool(tail) and len(zlib.compress(tail)) < Fraction(15, 100) * len(tail)


def grade_all(run, draw, arms):
    gold = {r["id"]: r["answer"] for r in draw}
    out, lines = {}, []
    for arm in arms:
        p = os.path.join(run, arm, "responses.jsonl")
        if not os.path.exists(p):
            continue
        rs = {}
        for l in open(p, encoding="utf-8"):
            if l.strip():
                r = json.loads(l)
                if r["id"] in rs:
                    raise SystemExit("a repeated answer for %s in arm %s" % (r["id"], arm))
                rs[r["id"]] = r
        out[arm] = rs
        for pid, r in rs.items():
            lines.append(json.dumps({"key": arm + "|" + pid, "gold": gold[pid], "text": r.get("text") or "", "finish": r.get("finish")}))
    js = {}
    if lines:
        res = subprocess.run(["node", os.path.join(S3, "grade3.js"), "--batch"], input="\n".join(lines) + "\n",
                             capture_output=True, text=True, check=True)
        for l in res.stdout.splitlines():
            if l.strip():
                o = json.loads(l)
                js[o["key"]] = o
    graded = {}
    for arm, rs in out.items():
        g = {}
        for pid, r in rs.items():
            py = grade3.grade_response(gold[pid], r.get("text") or "", r.get("finish"))
            j = js[arm + "|" + pid]
            g[pid] = {"py": py["verdict"], "js": j["verdict"], "py_reason": py["reason"], "pred": py["pred"],
                      "second_py": py["second"]["verdict"], "second_js": j["second"]["verdict"],
                      "finish": r.get("finish"), "tokens": r.get("tokens"), "think_closed": py["think_closed"],
                      "closes": py["closes"], "loop": r.get("finish") == "length" and looping(r.get("text"))}
        graded[arm] = g
    return out, graded


def score(v, reading):
    return 1 if v == "CORRECT" or (reading == "ceiling" and v == "REFUSED") else 0


def arm_facts(g, mv):
    n = len(g)
    f = {"answers": n}
    if not n:
        return f
    for who in ("py", "js"):
        c = sum(1 for x in g.values() if x[who] == "CORRECT")
        rf = sum(1 for x in g.values() if x[who] == "REFUSED")
        lo, hi = cp_bounds(c, n)
        f[who] = {"correct": c, "refused": rf, "wrong": n - c - rf, "accuracy_floor": dec(Fraction(c, n)),
                  "accuracy_ceiling": dec(Fraction(c + rf, n)),
                  "accuracy_decided": dec(Fraction(c, n - rf)) if n - rf else None,
                  "cp95_floor": [dec(lo, 6, False), dec(hi, 6, True)]}
    cut = sum(1 for x in g.values() if x["finish"] == "length")
    lo, hi = cp_bounds(cut, n)
    fin = [x for x in g.values() if x["finish"] != "length"]
    fin_c = sum(1 for x in fin if x["py"] == "CORRECT")
    toks = [x["tokens"] or 0 for x in g.values()]
    f.update({"cut": cut, "cut_share": dec(Fraction(cut, n)), "cut_cp95": [dec(lo, 6, False), dec(hi, 6, True)],
              "thinking_never_closed": sum(1 for x in g.values() if not x["think_closed"]),
              "closed_more_than_once": sum(1 for x in g.values() if x["closes"] > 1),
              "second_reading_changes": sum(1 for x in g.values() if x["second_py"] != x["py"] or x["second_js"] != x["js"]),
              "looping": sum(1 for x in g.values() if x["loop"]),
              "tokens_sum": sum(toks), "mean_tokens": dec(Fraction(sum(toks), n), 1),
              "mean_finished_tokens": dec(Fraction(sum(x["tokens"] or 0 for x in fin), len(fin)), 1) if fin else None,
              "accuracy_among_finished_py": dec(Fraction(fin_c, len(fin))) if fin else None,
              "graders_disagree": sorted(pid for pid, x in g.items() if x["py"] != x["js"])})
    if mv is not None:
        ok = sum(1 for pid in g if mv.get(pid) is True)
        err = sum(1 for pid in g if mv.get(pid) is None)
        f["math_verify"] = {"correct": ok, "errors_or_missing": err, "accuracy": dec(Fraction(ok, n)),
                            "agrees_with_py_on": sum(1 for pid, x in g.items() if (mv.get(pid) is True) == (x["py"] == "CORRECT"))}
    return f


def paired(gx, gy, ids, who, reading):
    """y minus x per problem; the exact one-sided p both ways; the paired interval"""
    d = [score(gy[i][who], reading) - score(gx[i][who], reading) for i in ids]
    m = len(d)
    up, down = d.count(1), d.count(-1)
    k = up + down
    delta = Fraction(up - down, m)
    var = sum((Fraction(x) - delta) ** 2 for x in d) / (m - 1)
    se2 = var / m
    se_lo, se_hi = sqrt_bounds(se2)
    z = Fraction(196, 100)
    return {"m": m, "up": up, "down": down, "delta": dec(delta), "delta_exact": "%d/%d" % (delta.numerator, delta.denominator),
            "p_greater": binom_ge(k, up), "p_less": binom_ge(k, down), "se": [dec(se_lo, 6, False), dec(se_hi, 6, True)],
            "ci95": [delta - z * se_hi, delta + z * se_hi], "d": d}


def show(pr):
    o = {k: v for k, v in pr.items() if k not in ("d", "p_greater", "p_less", "ci95")}
    o["p_greater"] = "%d/%d" % (pr["p_greater"].numerator, pr["p_greater"].denominator)
    o["p_greater_dec"] = "%.6g" % float(pr["p_greater"])
    o["p_less"] = "%d/%d" % (pr["p_less"].numerator, pr["p_less"].denominator)
    o["p_less_dec"] = "%.6g" % float(pr["p_less"])
    o["ci95"] = [dec(pr["ci95"][0], 4, False), dec(pr["ci95"][1], 4, True)]
    return o


def compare(name, gx, gy, ids, js_check):
    ways = {}
    for who in ("py", "js"):
        for reading in ("floor", "ceiling"):
            pr = paired(gx, gy, ids, who, reading)
            key = name + "|" + who + "|" + reading
            ways[who + "_" + reading] = pr
            js_check[key] = pr["d"]
    return ways


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("run")
    ap.add_argument("--out", default=os.path.join(ROOT, "certs", "qwen-self-rewriting-stage3.json"))
    ap.add_argument("--pod")
    a = ap.parse_args()
    t0 = time.time()
    run = a.run
    pins = json.load(open(os.path.join(ROOT, PINS)))
    if sha_file(os.path.join(ROOT, DRAW)) != pins["draw"]["sha256"]:
        raise SystemExit("the draw file differs from its pin")
    draw = [json.loads(l) for l in open(os.path.join(ROOT, DRAW), encoding="utf-8") if l.strip()]
    ids = [r["id"] for r in draw]
    arms = ["A", "B", "C"]

    # --- the seal: every pulled file against the pod's own list
    seal = {"present": os.path.exists(os.path.join(run, "_SEAL.sha256"))}
    if seal["present"]:
        bad, n = [], 0
        for l in open(os.path.join(run, "_SEAL.sha256")):
            if not l.strip():
                continue
            h, p = l.split(None, 1)
            p = p.strip()[2:] if p.strip().startswith("./") else p.strip()
            n += 1
            q = os.path.join(run, p)
            if not os.path.exists(q) or sha_file(q) != h:
                bad.append(p)
        seal.update({"files": n, "missing_or_different": bad, "passed": not bad})

    # --- integrity rows
    st = os.path.join(run, "setup")
    p1 = jload(os.path.join(st, "p1.json"), {})
    edit = jload(os.path.join(st, "edit.json"), {})
    edit2 = jload(os.path.join(st, "edit-second-reader.json"), {})
    selft = jload(os.path.join(st, "edit-selftest.json"), {})
    metas = {arm: jload(os.path.join(run, arm, "meta.json")) for arm in arms}
    notrun = {arm: jload(os.path.join(run, arm, "not-run.json")) for arm in arms}
    serve_args = open(os.path.join(run, "_serve_args.txt")).read().splitlines() if os.path.exists(os.path.join(run, "_serve_args.txt")) else []
    norm_args = sorted({" ".join(w for w in l.split() if not w.startswith("/w/")) for l in serve_args})
    prompts = {arm: (metas[arm] or {}).get("prompts_sha256") for arm in arms if metas[arm]}
    seeds = {arm: (metas[arm] or {}).get("seeds_sha256") for arm in arms if metas[arm]}
    fps = {arm: jload(os.path.join(run, arm, "fingerprint.json")) for arm in arms}

    def fp_key(f):
        return json.dumps((f or {}).get("logprobs"), sort_keys=True) if f else None
    k6 = {"A_vs_B_differ": (fp_key(fps["A"]) != fp_key(fps["B"])) if fps["A"] and fps["B"] else None,
          "A_vs_C_equal": (fp_key(fps["A"]) == fp_key(fps["C"])) if fps["A"] and fps["C"] else None}
    selftests = {"py": grade3.selftest()["failures"] == [],
                 "js": subprocess.run(["node", os.path.join(S3, "grade3.js"), "--selftest"], capture_output=True).returncode == 0}
    integrity = {
        "P1": {"passed": bool(p1.get("passed")), "values": p1},
        "P2": {"passed": bool(edit.get("equals_stage1_spec")) and bool(edit2.get("passed")) and bool(selft.get("all_caught")),
               "values": {"edit": {k: v for k, v in edit.items() if k != "per_tensor"}, "second_reader": edit2, "controls": selft}},
        "P3": {"passed": len(set(prompts.values())) <= 1 and len(set(seeds.values())) <= 1,
               "values": {"draw_sha256": pins["draw"]["sha256"], "prompts_sha256": prompts, "seeds_sha256": seeds,
                          "prompts_equal_to_hand_built": {arm: (metas[arm] or {}).get("prompts_equal_to_the_hand_built_form") for arm in prompts}}},
        "P4": {"passed": len(norm_args) <= 1 and bool(serve_args), "values": {"serve_args": serve_args}},
        "K6": {"caught": k6["A_vs_B_differ"], "values": k6},
        "G0": {"passed": all(selftests.values()), "values": selftests},
        "SEAL": seal,
    }

    responses, graded = grade_all(run, draw, arms)
    mv = {}
    for arm in arms:
        p = os.path.join(run, arm, "mv.jsonl")
        if os.path.exists(p):
            mv[arm] = {json.loads(l)["id"]: json.loads(l).get("mv") for l in open(p, encoding="utf-8") if l.strip()}
    complete = {arm: bool(metas[arm] and metas[arm].get("complete") and len(graded.get(arm, {})) == len(ids)) for arm in arms}
    facts = {arm: arm_facts(graded.get(arm, {}), mv.get(arm)) for arm in arms}
    gate = all(integrity[k]["passed"] for k in ("P1", "P3", "G0")) and (integrity["SEAL"].get("passed", True))
    g_ok = {arm: complete[arm] and not facts[arm].get("graders_disagree") for arm in arms}

    js_check, comps = {}, {}
    for name, x, y in (("B_minus_A", "A", "B"), ("C_minus_A", "A", "C"), ("B_minus_C", "C", "B")):
        if complete[x] and complete[y]:
            comps[name] = compare(name, graded[x], graded[y], ids, js_check)
    # the second p-value computation: every exact p must be equal
    js_p = {}
    if js_check:
        r = subprocess.run(["node", os.path.join(S3, "stats3.js")], input=json.dumps(js_check), capture_output=True, text=True, check=True)
        js_p = json.loads(r.stdout)
    p_agree = True
    for name, ways in comps.items():
        for w, pr in ways.items():
            j = js_p[name + "|" + w.replace("_", "|", 1)]
            p_agree &= Fraction(int(j["greater_or_equal"][0]), int(j["greater_or_equal"][1])) == pr["p_greater"]
            p_agree &= Fraction(int(j["less_or_equal"][0]), int(j["less_or_equal"][1])) == pr["p_less"]
    integrity["G2"] = {"passed": p_agree, "values": "the exact p-values of tools/qwen-stage3-record.py (binomial tails) and stats3.js (sign-vector enumeration) are equal"}

    def refused_resources(*need):
        miss = [x for x in need if not complete[x]]
        return {"verdict": "REFUSED", "why": "on resources: arm %s %s" % (", ".join(miss), "did not run or did not finish"),
                "not_run": {x: notrun[x] for x in miss}} if miss else None

    def direction(name, claim_up_text, claim_down_text):
        ways = comps[name]
        up = all(pr["p_greater"] < ALPHA and pr["up"] > pr["down"] for pr in ways.values())
        down = all(pr["p_less"] < ALPHA and pr["down"] > pr["up"] for pr in ways.values())
        v = "CERTIFIED" if up else "REFUTED" if down else "REFUSED"
        why = claim_up_text if up else claim_down_text if down else "not decided at 490 x 1: the four readings (two graders x REFUSED as wrong or right) do not all reach p < 0.05 in one direction"
        return {"verdict": v, "why": why, "ways": {w: show(pr) for w, pr in ways.items()}}

    rows = {}
    # A1: the anchor
    r = refused_resources("A")
    if r:
        rows["A1"] = r
    else:
        fa = facts["A"]
        lo, hi = [Fraction(x) for x in fa["py"]["cp95_floor"]]
        clo, chi = [Fraction(x) for x in fa["cut_cp95"]]
        rows["A1"] = {"verdict": "COMPUTED", "accuracy_floor_py": fa["py"]["accuracy_floor"], "cp95": fa["py"]["cp95_floor"],
                      "reading_accuracy": "lands on the paper's 57.2" if lo <= PAPER["A_acc"] <= hi else "does not land on the paper's 57.2",
                      "cut_share": fa["cut_share"], "cut_cp95": fa["cut_cp95"],
                      "reading_cut": "lands on the paper's 33.6" if clo <= PAPER["A_cut"] <= chi else "does not land on the paper's 33.6"}
    # B1, B2, B3
    r = refused_resources("A", "B")
    if r or not integrity["P2"]["passed"] or integrity["K6"]["caught"] is False:
        rows["B1"] = r or {"verdict": "REFUSED", "why": "P2 or K6 failed: arm B's weights are not shown to be the rebuilt edit"}
        rows["B2"] = rows["B3"] = dict(rows["B1"])
    else:
        rows["B1"] = direction("B_minus_A", "the rebuilt edit makes the model more accurate than the base on our 490 problems at the paper's settings",
                               "the rebuilt edit makes the model LESS accurate than the base at the paper's settings")
        pr = comps["B_minus_A"]["py_floor"]
        lo, hi = pr["ci95"]
        rows["B2"] = {"verdict": "COMPUTED", "delta_points": dec(Fraction(pr["up"] - pr["down"], pr["m"]) * 100, 2),
                      "ci95_points": [dec(lo * 100, 2, False), dec(hi * 100, 2, True)],
                      "reading": "consistent with the paper's +6.6" if lo <= PAPER["delta"] <= hi else
                      ("smaller than the paper's +6.6" if hi < PAPER["delta"] else "larger than the paper's +6.6")}
        dcut = [(1 if graded["B"][i]["finish"] == "length" else 0) - (1 if graded["A"][i]["finish"] == "length" else 0) for i in ids]
        upc, dnc = dcut.count(1), dcut.count(-1)
        rows["B3"] = {"verdict": "COMPUTED", "cut_share": {"A": facts["A"]["cut_share"], "B": facts["B"]["cut_share"]},
                      "cut_more_in_B": upc, "cut_more_in_A": dnc, "p_B_cuts_fewer": "%.6g" % float(binom_ge(upc + dnc, dnc)),
                      "accuracy_among_finished_py": {"A": facts["A"]["accuracy_among_finished_py"], "B": facts["B"]["accuracy_among_finished_py"]},
                      "mean_tokens": {"A": facts["A"]["mean_tokens"], "B": facts["B"]["mean_tokens"]}}
    # C1, C2, C3
    r = refused_resources("A", "C")
    if r:
        rows["C1"] = rows["C3"] = r
    else:
        rows["C1"] = direction("C_minus_A", "the card's settings alone (no edit, 32,768 tokens) make the base more accurate than the paper's settings",
                               "the card's settings make the base LESS accurate than the paper's settings")
    r = refused_resources("A", "B", "C")
    if r or "B_minus_C" not in comps:
        rows["C2"] = r or rows.get("B1")
        rows["C3"] = r or rows.get("B1")
    else:
        rows["C2"] = direction("B_minus_C", "the edit at the paper's settings beats the no-edit card arm: the card's settings do not recover the gain",
                               "the no-edit card arm beats the edit at the paper's settings")
        ba, ca = comps["B_minus_A"]["py_floor"], comps["C_minus_A"]["py_floor"]
        if rows["B1"]["verdict"] == "CERTIFIED" and ba["up"] > ba["down"]:
            rr = Fraction(ca["up"] - ca["down"], 1) / Fraction(ba["up"] - ba["down"], 1)
            band = ("the gain stands against the card's settings" if rr < Fraction(1, 4) else
                    "partly a settings effect" if rr < Fraction(3, 4) else "mostly a settings effect")
            edge = any(abs(rr - e) <= Fraction(5, 100) for e in (Fraction(1, 4), Fraction(3, 4)))
            rows["C3"] = {"verdict": "COMPUTED", "recovered_share": dec(rr, 3), "band": band + (" (at the edge)" if edge else "")}
        else:
            rows["C3"] = {"verdict": "COMPUTED", "recovered_share": None, "band": "not read: B1 is not CERTIFIED"}
    # M1: the paper's grader, a reading
    rows["M1"] = {"verdict": "COMPUTED", "math_verify": {arm: facts[arm].get("math_verify") for arm in arms}}
    rows["L1"] = {"verdict": "COMPUTED", "lengths_and_looping": {arm: {k: facts[arm].get(k) for k in
                  ("mean_tokens", "mean_finished_tokens", "cut_share", "looping", "thinking_never_closed")} for arm in arms}}
    if not gate:
        for k in ("A1", "B1", "B2", "B3", "C1", "C2", "C3"):
            rows[k] = {"verdict": "REFUSED", "why": "an integrity row failed (P1, P3, G0 or the seal)", "was": rows.get(k)}
    for arm in arms:   # a grader disagreement inside an arm: every row that reads it is decided on both graders already
        facts[arm]["graders_agree_on_every_answer"] = g_ok[arm] if complete[arm] else None

    state = jload(os.path.join(run, "_state.json"), {})
    cost = None
    if state.get("price") and state.get("pod_start"):
        cost = {"price_per_hour": state["price"], "pod_start": state["pod_start"], "deadline": state.get("deadline"),
                "note": "the billed total is read from RunPod after the deletion and added by hand; this record does not know the deletion time"}
    rec = {
        "what": "Stage 3 of the audit of \"Language Models Can Rewrite Their Own Weights\" (arXiv 2611.21885 v2): three arms on one "
                "GPU pod under a US$20 cap; 490 problems of our own fixed draw from DeepScaleR, one answer each; two graders that share no code",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "seconds": round(time.time() - t0, 1),
        "rules": {"file": PREREG, "sha256": sha_file(os.path.join(ROOT, PREREG)) if os.path.exists(os.path.join(ROOT, PREREG)) else None},
        "pins": {"file": PINS, "sha256": sha_file(os.path.join(ROOT, PINS))},
        "draw": pins["draw"], "pod": a.pod, "run_dir": os.path.relpath(run, ROOT),
        "verdict_words": ["CERTIFIED", "REFUTED", "REFUSED", "COMPUTED"],
        "graders": {f: sha_file(os.path.join(ROOT, f)) for f in pins["graders"]["python"] + pins["graders"]["javascript"]},
        "build": open(os.path.join(st, "build.txt")).read() if os.path.exists(os.path.join(st, "build.txt")) else None,
        "download": jload(os.path.join(st, "download.json")),
        "probe": jload(os.path.join(run, "_probe.json")), "decisions": {arm: jload(os.path.join(run, "_decide-%s.json" % arm)) for arm in ("B", "C")},
        "state": state, "cost": cost,
        "arms": {arm: {"complete": complete[arm], "not_run": notrun[arm],
                       "meta": {k: v for k, v in (metas[arm] or {}).items() if k != "prompt_example"} if metas[arm] else None,
                       "facts": facts[arm]} for arm in arms},
        "integrity": integrity, "rows": rows,
        "per_problem": {arm: {pid: {k: x[k] for k in ("py", "js", "finish", "tokens", "pred")} for pid, x in graded[arm].items()} for arm in graded},
    }
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(rec, f, indent=1, ensure_ascii=False, default=str)
        f.write("\n")
    print(os.path.relpath(a.out, ROOT), {k: v.get("verdict") for k, v in rows.items()})


if __name__ == "__main__":
    main()
