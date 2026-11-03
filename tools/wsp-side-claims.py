#!/usr/bin/env python3
"""wsp-side-claims.py — the side claims of the Weight-Space Programming review (M2–M5 of
notes/wsp-adversarial-review-2026-11-03.md §1) decided from the authors' released logs alone.

Inputs (all pinned; every file read is sha256-pinned in the record under `pins`):
  corpus/wsp/.cache/logs   = github.com/RikiyaT/lm_understand-logs @ 4d09ba6d6a7e891dd8063974dfe81b3d78e3494f
  corpus/wsp/.cache/math500/test.jsonl = HuggingFaceH4/MATH-500 (500 problems; for the M2 text and unique_id check)
Nothing of the claimants' is run: network files are parsed with zipfile + struct (npy v1.0 headers), JSON is read,
Astra's own notebook lines are quoted and their presence in the files is asserted.

Verdict words: CERTIFIED (the released bytes say exactly this), REFUTED (the released bytes say otherwise),
REFUSED (not decidable from what is released; the reason names the missing bytes). A compound claim gets one word per
part. Nothing here is a finding about the critic as a person; a claim with no released source is a limit, not a fault.

usage: python3 -I tools/wsp-side-claims.py            → certs/wsp-side-claims.json
       python3 -I tools/wsp-side-claims.py --check    re-derives and compares with the record; exit 1 on a difference
MIT"""
import hashlib
import json
import os
import re
import struct
import sys
import time
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "corpus", "wsp", ".cache")
LOGS = os.path.join(CACHE, "logs")
MATH500 = os.path.join(CACHE, "math500", "test.jsonl")
RECORD = os.path.join(ROOT, "certs", "wsp-side-claims.json")
LOGS_COMMIT = "4d09ba6d6a7e891dd8063974dfe81b3d78e3494f"

PINS = {}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def pin(rel):
    """Pin a file under the logs (or 'math500/test.jsonl') and return its absolute path."""
    path = MATH500 if rel == "math500/test.jsonl" else os.path.join(LOGS, rel)
    if rel not in PINS:
        PINS[rel] = sha256(path)
    return path


def read(rel):
    with open(pin(rel), encoding="utf-8") as f:
        return f.read()


def jread(rel):
    return json.loads(read(rel))


def must_contain(rel, needle):
    """A quoted line is only a fact if the bytes hold it."""
    if needle not in read(rel):
        raise SystemExit("quote not found in %s: %r" % (rel, needle))
    return needle


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


# ----------------------------------------------------------------------------------------------- npy / npz (stdlib)
def npz_arrays(rel):
    """Every .npy member of an npz as (name, shape, list of floats). Little-endian f4/f8, C order; else refuse."""
    out = {}
    with zipfile.ZipFile(pin(rel)) as z:
        for info in z.infolist():
            b = z.read(info)
            if b[:6] != b"\x93NUMPY":
                raise SystemExit("not an npy member: " + info.filename)
            major = b[6]
            if major == 1:
                hlen = struct.unpack("<H", b[8:10])[0]
                hstart = 10
            else:
                hlen = struct.unpack("<I", b[8:12])[0]
                hstart = 12
            header = b[hstart:hstart + hlen].decode("latin1")
            descr = re.search(r"'descr':\s*'([^']+)'", header).group(1)
            fortran = re.search(r"'fortran_order':\s*(\w+)", header).group(1) == "True"
            shape = tuple(int(x) for x in re.search(r"'shape':\s*\(([^)]*)\)", header).group(1).replace(" ", "").split(",") if x)
            if fortran or descr not in ("<f4", "<f8"):
                raise SystemExit("REFUSED: unsupported npy layout %s %s in %s" % (descr, fortran, info.filename))
            n = 1
            for s in shape:
                n *= s
            data = b[hstart + hlen:]
            fmt = "<%d%s" % (n, "f" if descr == "<f4" else "d")
            vals = list(struct.unpack(fmt, data[:struct.calcsize(fmt)]))
            out[info.filename[:-4]] = (shape, vals)
    return out


# ------------------------------------------------------------------------------------------------------------- M2
def claim_m2():
    run = "exp8_math/runs/p50c"
    state = jread(run + "/state.json")
    # the practice sets Astra could draw from
    practice_ids = {}
    practice_text = {}
    for name in ("gsm8k_train", "math_train", "aime"):
        for line in read("exp8_math/practice/%s.jsonl" % name).split("\n"):
            if not line.strip():
                continue
            d = json.loads(line)
            practice_ids[d["id"]] = name
            practice_text[d["id"]] = norm(d["problem"])
    # MATH-500 (the benchmark), by exact normalised text and by unique_id
    m500 = [json.loads(l) for l in read("math500/test.jsonl").split("\n") if l.strip()]
    m500_text = {norm(d["problem"]): d["unique_id"] for d in m500}
    m500_ids = {d["unique_id"] for d in m500}
    practice_in_m500 = sorted(pid for pid, t in practice_text.items() if t in m500_text)

    # every forward-pass request the run made, in order
    nums = sorted(int(re.match(r"fwd_(\d+)\.", f).group(1)) for f in os.listdir(os.path.join(LOGS, run, "requests")) if f.endswith(".json.claimed"))
    passes = []
    all_problem_ids = []
    failed_problem_ids = []
    tf_texts = []
    for k in nums:
        req = jread("%s/requests/fwd_%d.json.claimed" % (run, k))
        done = jread("%s/requests/fwd_%d.done.json" % (run, k))
        row = {"k": k, "type": req.get("type"), "model": req.get("model"), "ok": bool(done.get("ok"))}
        if req.get("type") == "generate":
            probs = req.get("problems") or []
            (all_problem_ids if done.get("ok") else failed_problem_ids).extend(probs)
            row["problems"] = len(probs)
            row["n"] = req.get("n", 1)
            row["max_tokens"] = req.get("max_tokens")
            row["sources"] = sorted({practice_ids.get(p, "UNKNOWN:" + p) for p in probs})
            if done.get("ok"):
                if req.get("model") == "both":
                    row["original_acc"] = done["original"]["accuracy"]
                    row["edited_acc"] = done["edited"]["accuracy"]
                    row["paired_diff"] = done["paired"]["accuracy_difference"]
                    row["paired_se"] = done["paired"]["standard_error"]
                    row["generations"] = done["original"]["generations"] + done["edited"]["generations"]
                else:
                    row["accuracy"] = done.get("accuracy")
                    row["generations"] = done.get("generations")
            else:
                row["error"] = str(done.get("error", ""))[:80]
        else:
            texts = req.get("texts") or []
            chats = req.get("chats") or []
            for t in texts:
                tf_texts.append(t if isinstance(t, str) else json.dumps(t))
            for c in chats:
                tf_texts.append(json.dumps(c))
            row["texts"] = len(texts) + len(chats)
        passes.append(row)

    ids_set = sorted(set(all_problem_ids))
    unknown = sorted(p for p in ids_set if p not in practice_ids)
    failed_set = sorted(set(failed_problem_ids))
    unknown_failed = sorted(p for p in failed_set if p not in practice_ids)
    failed_not_in_counted = sorted(p for p in failed_set if p not in set(ids_set))
    by_source = {}
    for p in ids_set:
        by_source[practice_ids.get(p, "UNKNOWN")] = by_source.get(practice_ids.get(p, "UNKNOWN"), 0) + 1
    # benchmark items in any request: by id prefix, by MATH-500 text in a teacher-forced text, by practice text
    test_like_ids = sorted(p for p in ids_set if "test" in p or p in m500_ids)
    m500_in_tf = sorted({uid for t in tf_texts for text, uid in m500_text.items() if text in norm(t)})
    used_practice_in_m500 = sorted(p for p in ids_set if practice_text.get(p) in m500_text)
    counted = [r for r in passes if r["ok"]]
    gens_counted = sum(r.get("generations", 0) for r in counted if r["type"] == "generate")
    # the dose trials, pass by pass, in Astra's own words (each quote asserted present in the notebook files)
    H = run + "/work_notes/experiment_history.md"
    N = run + "/work_notes/notes.md"
    F = run + "/work_notes/final_report.md"
    dose_rows = [
        (5, "L19 MLP neuron 11 output ablated (no direction yet)", H, "Pass4 gen_5 paired32: ablate L19 neuron11, +6.25pp +/-4.35pp SE (3->5 correct)"),
        (7, "L19 only, full direction, alpha 1", H, "Pass5 gen_7 paired32: L19 MLP repetition-direction removal alpha1, +6.25pp +/-4.35pp SE (4->6 correct)"),
        (8, "L15+L19, full direction, alpha 1 (same 32 problems; 8/9 and 10/11 are repeats)", H, "Recovered passes 6-9: gen8/9 gave 7/32 vs 4/32; gen10/11 gave 9/32 vs 4/32"),
        (13, "L15+L19, full direction, alpha 1 (128 new problems)", H, "Pass10/gen13 independent validation (64G+64M): alpha1 L15+L19, original 11/128=8.59%, edited42/128=32.81%, gain24.22pp SE3.96pp"),
        (14, "alpha 1, dose set 64 x 4", H, "Pass11/gen14 dose set64x4: alpha1 L15+L19, original27/256=10.55%, edited59/256=23.05%, gain12.50pp SE2.61pp"),
        (16, "alpha 2, the same dose set", H, "Pass12/gen16 alpha2 on dose64x4: original29/256, edited92/256; gain24.61pp SE3.96pp"),
        (27, "alpha 2, independent 128 x 2", H, "Independent fullalpha2 gen27:21/256->110/256,+34.77pp SE3.53."),
        (29, "alpha 3, 128 x 2", H, "Fullalpha3 exploratory gen29:21/256->123/256,+39.84pp SE3.82."),
        (35, "norm-matched random control", H, "Norm-matched orthogonal RANDOM control: gen35 14/128->16/128,+1.56pp SE3.52;"),
        (41, "top-64 columns, alpha 4, 16k cap", H, "Top64alpha4 gen41 at16k:13/128->47/128,+26.56pp SE4.45;"),
        (42, "full direction, alpha 4, 16k cap", H, "fullalpha4 gen42 at16k:14/128->48/128,+26.56pp SE4.59."),
        (45, "top-64 columns, alpha 6, 32k cap (exploratory)", H, "Top64alpha6 gen45 exploratory FULL32k:7/64->35/64,+43.75pp SE6.63."),
        (50, "top-64 alpha 6 FROZEN; validation_3 (gen 50 + 52)", H, "First validation_3: gen50+52,9/128->74/128,+50.78pp SE4.44,65rescues0losses."),
        (53, "frozen; validation_4 (gen 53-56)", H, "validation_4:gen53,54,55,56,19/256->142/256,+48.05pp SE3.18,124rescues1loss."),
    ]
    dose = []
    for k, what, src, quote in dose_rows:
        must_contain(src, quote)
        row = next(r for r in passes if r["k"] == k)
        dose.append({"pass": k, "edit": what, "scored": {kk: row.get(kk) for kk in ("problems", "n", "max_tokens", "original_acc", "edited_acc", "paired_diff", "paired_se") if row.get(kk) is not None}, "quote": quote, "source": src})
    alphas_tried = [1, 2, 3, 4, 6]
    # the turn where 6 was chosen, and the formula
    turn105 = run + "/turns/t105/answer.md"
    chosen = must_contain(turn105, "I’ll test strength 6 on the same 64-neuron subsets, which increases the targeted intervention while leaving the other MLP columns untouched.")
    must_contain(turn105, "set_subset_edit(6)")
    seen_before = must_contain(run + "/turns/t105/prompt.txt", "Forward pass 28 of 50 done (generate); results in /work/gen_42_original.jsonl and /work/gen_42_edited.jsonl.")
    formula = must_contain(F, "Formula: W = W0 - 6*outer(u, mask64*(u@W0)).")
    formula2 = must_contain(H, "Formula at each layer: W = W0 - 6 * outer(u, mask64 * (u @ W0)).")
    frozen = jread(run + "/work_notes/frozen_eval_progress.json")
    held_out = must_contain(F, "All1152 unique problems were independent of edit selection.")
    practice_rule = must_contain("exp8_math/practice/README.txt", "Practice problems (none of them is in the evaluation).")
    decon = must_contain("exp8_math/code/practice35.py", "Decontamination against the evaluation sets of this profile (MATH-500, GSM8K test) and the other four: a problem is\ndropped if a 13-word window or its normalized text occurs in any evaluation problem (practice.grams / norm).")
    never_saw = must_contain("exp8_math/README.md", "It never saw the benchmarks.")
    # how many answers were scored before the dose was frozen (passes 1-45) vs after
    gens_before_freeze = sum(r.get("generations", 0) for r in counted if r["type"] == "generate" and r["k"] <= 45)
    gens_confirmation = sum(r.get("generations", 0) for r in counted if r["type"] == "generate" and r["k"] >= 50)
    facts = {
        "run": {"turns": state["turn"], "python_runs": state["runs"], "passes_used": state["passes"], "requests": state["requests"], "budget": state["budget"]},
        "requests": {"total": len(passes), "counted": len(counted), "failed_not_counted": len(passes) - len(counted),
                     "generate": sum(1 for r in passes if r["type"] == "generate"), "teacher_forced": sum(1 for r in passes if r["type"] == "teacher_forced")},
        "passes": passes,
        "problem_ids_in_counted_generate_requests": {"unique": len(ids_set), "by_practice_file": by_source, "not_in_practice_files": unknown,
                                                     "test_like_or_math500_id": test_like_ids},
        "problem_ids_only_in_failed_requests": {"unique_in_failed_requests": len(failed_set), "not_also_in_a_counted_request": failed_not_in_counted,
                                                "not_in_practice_files": unknown_failed,
                                                "note": "a failed request scored nothing; fwd_12 was refused by the harness for the typo gsm8k_train3513 (readable/passes.md: 'unknown practice ids')"},
        "generations_scored": {"counted_total": gens_counted, "before_the_dose_was_frozen_passes_1_45": gens_before_freeze, "frozen_confirmation_passes_50_69": gens_confirmation},
        "math500_check": {"problems": len(m500), "practice_problems_with_a_math500_text": practice_in_m500,
                          "used_practice_problems_with_a_math500_text": used_practice_in_m500,
                          "math500_texts_inside_a_teacher_forced_request": m500_in_tf, "teacher_forced_texts_checked": len(tf_texts)},
        "gsm8k_test_check": {"by_id": "no request names a gsm8k_test id (all ids are gsm8k_train_* / math_train_*)",
                             "by_text": "NOT CHECKED HERE: no pinned copy of GSM8K test on disk; the claimants' decontamination rule is quoted below"},
        "practice_rule_quoted": {"practice/README.txt": practice_rule, "code/practice35.py": decon, "README.md": never_saw},
        "doses": {"strengths_tried": alphas_tried, "trials": dose,
                  "turn_where_6_was_chosen": {"turn": "t105", "after_seeing": seen_before, "astra_wrote": chosen},
                  "frozen_confirmation_runs": frozen["confirmed_runs"], "held_out_quote": held_out},
        "formula": {"work_notes/final_report.md": formula, "work_notes/experiment_history.md": formula2},
    }
    files = ["%s/state.json" % run] + ["%s/requests/fwd_%d.json.claimed" % (run, k) for k in nums] + ["%s/requests/fwd_%d.done.json" % (run, k) for k in nums] + \
            [H, N, F, run + "/work_notes/frozen_eval_progress.json", turn105, run + "/turns/t105/prompt.txt",
             "exp8_math/practice/gsm8k_train.jsonl", "exp8_math/practice/math_train.jsonl", "exp8_math/practice/aime.jsonl",
             "exp8_math/practice/README.txt", "exp8_math/code/practice35.py", "exp8_math/README.md", "math500/test.jsonl"]
    test_clean = not unknown and not test_like_ids and not used_practice_in_m500 and not m500_in_tf and not practice_in_m500 and \
        all(p in practice_ids or p == "gsm8k_train3513" for p in failed_set)
    verdict = "REFUTED" if test_clean else "REFUSED"
    reason = ("'thousands of answers': yes — %d generated answers were scored in counted passes before the dose was frozen at alpha 6 (turn t105, after pass 42), "
              "%d more in the frozen confirmation; 'test answers': no — every one of the %d problem ids in the %d generate requests is a practice id "
              "(gsm8k_train %d, math_train %d), none is a MATH-500 problem by text or unique_id, no teacher-forced text contains a MATH-500 problem, "
              "and the practice file names the benchmarks it was decontaminated against. Limit: GSM8K test is not on disk here, so its text check rests on the claimants' released rule, not ours."
              % (gens_before_freeze, gens_confirmation, len(ids_set), sum(1 for r in counted if r["type"] == "generate"), by_source.get("gsm8k_train", 0), by_source.get("math_train", 0)))
    return {"claim": "M2 — the dose was picked over thousands of test answers (strengths tried: 1, 2, 3, 4, 6)", "files": files, "facts": facts, "verdict": verdict, "reason": reason}


# ------------------------------------------------------------------------------------------------------------- M3
def claim_m3():
    scores = jread("exp1_which_game/eval/scores.json")
    key = jread("exp1_which_game/eval/answer_key.json")
    rule = must_contain("exp1_which_game/README.md", "The answer's `Game:` line is mapped to a game by keywords (Frogger, the classic road-crossing game,\n  counts as Freeway). The answer key is read only by the scorer.")
    folder = {"a9f535cc": "breakout", "dfc6cb65": "pong", "bdf99279": "pacman", "0bbcc3ea": "freeway"}
    rows = []
    for s in sorted(scores, key=lambda r: r["id"]):
        ans = read("exp1_which_game/runs/%s/answer.md" % folder[s["id"]])
        m = re.search(r"Game:?\**\s*\n?\s*\**(.+?)\**\s*$", ans, re.M) or re.search(r"## Game:?\s*\n\s*\**(.+?)\**\s*$", ans, re.M)
        rows.append({"network": s["id"], "run": folder[s["id"]], "truth": key[s["id"]]["game"], "astra_game_line": (m.group(1) if m else "").strip("* "),
                     "scorer_answer_line": s["answer_line"], "scorer_guess": s["guess"], "scored_correct": s["correct"], "confidence": s["confidence"]})
    fr = next(r for r in rows if r["network"] == "0bbcc3ea")
    frogger = fr["astra_game_line"].lower().startswith("frogger") and fr["truth"] == "freeway" and fr["scored_correct"] and fr["scorer_guess"] == "freeway"
    files = ["exp1_which_game/eval/scores.json", "exp1_which_game/eval/answer_key.json", "exp1_which_game/README.md"] + ["exp1_which_game/runs/%s/answer.md" % g for g in sorted(folder.values())]
    return {"claim": "M3 — Frogger answered, Freeway credited (exp1_which_game)", "files": files,
            "facts": {"rows": rows, "scoring_rule_quoted": rule, "correct_count": sum(1 for r in rows if r["scored_correct"]), "of": len(rows)},
            "verdict": "CERTIFIED" if frogger else "REFUTED",
            "reason": "network 0bbcc3ea (truth freeway): Astra's Game line is '%s'; eval/scores.json maps it to guess 'freeway' and marks correct; the README states the keyword rule ('Frogger ... counts as Freeway') and the 4/4 counts it. The other three networks were answered by name (Breakout, Pong, Pac-Man)." % fr["astra_game_line"]}


# ------------------------------------------------------------------------------------------------------------- M4
def claim_m4a():
    before = npz_arrays("exp4_fix_car/networks/ppo_final_seed0.npz")
    after = npz_arrays("exp4_fix_car/networks/edited_actor.npz")
    name_map = {"embed.W": "params/Dense_0/kernel", "embed.b": "params/Dense_0/bias", "actor_head.W": "params/GeneralActorCriticRNN_0/Dense_0/kernel", "actor_head.b": "params/GeneralActorCriticRNN_0/Dense_0/bias"}
    for i in range(5):
        name_map["actor%d.W" % i] = "params/GeneralActorCriticRNN_0/DenseAndActivation_%d/Dense_0/kernel" % i
        name_map["actor%d.b" % i] = "params/GeneralActorCriticRNN_0/DenseAndActivation_%d/Dense_0/bias" % i
    import math
    tensors = {}
    total_changed_vs_full = 0
    total_changed_vs_shown = 0
    total = 0
    hundreds = []
    for name in sorted(after):
        shape_a, va = after[name]
        shape_b, vb = before[name_map[name]]
        if shape_a != shape_b:
            raise SystemExit("shape mismatch " + name)
        mx_b = max(abs(x) for x in vb)
        # the network as shown to Astra: integers times one scale, 3 significant digits of the largest entry
        scale = 10.0 ** (math.floor(math.log10(mx_b)) - 2) if mx_b > 0 else 1.0
        shown = [round(x / scale) * scale for x in vb]
        ch_full = sum(1 for x, y in zip(va, vb) if abs(x - y) > 1e-6)
        ch_shown = sum(1 for x, y in zip(va, shown) if abs(x - y) > 1e-9)
        mx_a = max(abs(x) for x in va)
        big = sorted(((abs(x), i) for i, x in enumerate(va) if abs(x) >= 100), reverse=True)[:8]
        for v, i in big:
            idx = (i // shape_a[1], i % shape_a[1]) if len(shape_a) == 2 else (i,)
            hundreds.append({"tensor": name, "index": list(idx), "value": va[i]})
        tensors[name] = {"shape": list(shape_a), "max_abs_before": round(mx_b, 6), "max_abs_after": round(mx_a, 6),
                         "changed_vs_full_precision": ch_full, "changed_vs_network_as_shown": ch_shown, "scale_shown": scale}
        total_changed_vs_full += ch_full
        total_changed_vs_shown += ch_shown
        total += len(va)
    res = jread("exp4_fix_car/eval/oneshot_result.json")
    edit_line = must_contain("exp4_fix_car/runs/oneshot_repair/reply/answer.md", "actor0.b[122:128] = [-200, -248, -304, -876, -760, -76]")
    overall_max_after = max(t["max_abs_after"] for t in tensors.values())
    overall_max_before = max(t["max_abs_before"] for t in tensors.values())
    facts = {"tensors": tensors, "entries": total, "changed_vs_full_precision": total_changed_vs_full, "changed_vs_network_as_shown": total_changed_vs_shown,
             "claimants_count": {"changed": res["changes"]["changed"], "entries": res["changes"]["entries"], "frac_changed": res["changes"]["frac_changed"]},
             "shown_rounding_reproduces_claimants_count": total_changed_vs_shown == res["changes"]["changed"],
             "max_abs_before_any_tensor": overall_max_before, "max_abs_after_any_tensor": overall_max_after,
             "entries_at_or_above_100_after": hundreds, "edit_statement_quoted": edit_line,
             "format": "npz, npy v1.0 headers, little-endian float32 (before) / float64 (after), C order; parsed with zipfile + struct"}
    ok = overall_max_after >= 876 and abs(overall_max_after - 876) < 1e-6
    files = ["exp4_fix_car/networks/ppo_final_seed0.npz", "exp4_fix_car/networks/edited_actor.npz", "exp4_fix_car/eval/oneshot_result.json", "exp4_fix_car/runs/oneshot_repair/reply/answer.md"]
    return {"claim": "M4a — car policy weights set to the hundreds (up to 876)", "files": files, "facts": facts,
            "verdict": "CERTIFIED" if ok else "REFUTED",
            "reason": "max |value| over all actor tensors: %.3f before, %.0f after (actor0.b[125] = -876, from the quoted edit statement); %d entries at or above 100 after the edit, 0 before; %d of %d entries differ from the network as shown (the claimants' 6,073%s)." % (
                overall_max_before, overall_max_after, len(hundreds), total_changed_vs_shown, total, " reproduced" if facts["shown_rounding_reproduces_claimants_count"] else " not reproduced by our rounding rule")}


def claim_m4b():
    res = jread("exp4_fix_car/eval/oneshot_result.json")
    ppo = jread("exp4_fix_car/eval/ppo_training_result.json")
    base = jread("exp4_fix_car/eval/base_result.json")
    readme = must_contain("exp4_fix_car/README.md", "scores the result on 256 \"search\" episodes (the episode stream the base network's result in the prompt comes\n  from) and on 1,024 separate test episodes, with actions sampled from the policy. The post reports the 1,024 test\n  episodes.")
    facts = {"levels": [ppo["level"]], "train_levels_list_override": [o for o in ppo["overrides"] if "train_levels_list" in o],
             "protocol": ppo["protocol"], "training_seed": ppo["seed"],
             "edited": {"search": {"episodes": 256, "success": res["search"]["success"], "argmax_success": res["search"]["argmax_success"], "mean_length": res["search"]["length"]},
                        "test": {"episodes": res["test"]["episodes"], "success": res["test"]["success"], "stream": res["test"]["stream"], "mode": res["test"]["mode"], "env_steps": res["test"]["env_steps"], "mean_length": res["test"]["length"]}},
             "base": {"success": base["success"], "timeout": base["timeout"], "argmax_outcome": base["argmax_outcome"]},
             "readme_quoted": readme,
             "episode_seeds": "not released as a list; the record gives two episode streams ('search' 256, 'test' 1024) with sampled actions and their env_steps totals; whether the level's initial state varies between episodes is not stated"}
    one_level = len(facts["levels"]) == 1
    many_runs = res["test"]["episodes"] == 1024 and res["test"]["mode"] == "sample"
    return {"claim": "M4b — '100%' on one level / one run replayed", "files": ["exp4_fix_car/eval/oneshot_result.json", "exp4_fix_car/eval/ppo_training_result.json", "exp4_fix_car/eval/base_result.json", "exp4_fix_car/README.md"],
            "facts": facts, "verdict": ("CERTIFIED" if one_level else "REFUTED") + " (one level) · " + ("REFUTED" if many_runs else "CERTIFIED") + " (one run replayed)",
            "reason": "one level: the training and evaluation name a single Kinetix level, l/h2_car_ramp; one replayed run: no — the 100%% is 1,024 test episodes with sampled actions (success 1.0, mean length 73 steps, %d env steps) plus 256 search episodes (success 1.0) and the most-likely-action episode; a list of episode seeds is not released, so how many distinct initial states those episodes cover is REFUSED." % res["test"]["env_steps"]}


# ------------------------------------------------------------------------------------------------------------- M5
def claim_m5a():
    mina = jread("exp5_write_from_scratch/eval/minatar_eval.json")
    tab = {}
    for g in ("breakout", "seaquest", "asterix"):
        rows = {k: v["mean"] for k, v in mina[g].items()}
        best100 = max((v, k) for k, v in rows.items() if k.startswith("ppo100"))
        best500 = max((v, k) for k, v in rows.items() if k.startswith("ppo500"))
        tab[g] = {"astra_hand": rows["hand"], "ppo100_best": {"seed": best100[1], "mean": best100[0]}, "ppo500_best": {"seed": best500[1], "mean": best500[0]},
                  "all_ppo": rows, "ratio_vs_ppo500_best": round(rows["hand"] / best500[0], 2), "ratio_vs_ppo100_best": round(rows["hand"] / best100[0], 2),
                  "astra_beats_ppo500_best": rows["hand"] > best500[0], "astra_beats_ppo100_best": rows["hand"] > best100[0],
                  "episodes": mina[g]["hand"].get("episodes"), "se_hand": mina[g]["hand"].get("se")}
    exp5_readme = must_contain("exp5_write_from_scratch/README.md", "The post shows the best seed of each.")
    go = {}
    for b in (0, 10, 25, 50):
        e = jread("exp6_go_from_scratch/eval/budget_%d/eval_submission.json" % b)
        go["budget_%d" % b] = {"vs_hidden_ppo_s0": e["ppo_s0"]["score"], "vs_hidden_ppo_s2": e["ppo_s2"]["score"], "games_each": e["ppo_s0"]["games"]}
    h2h = jread("exp6_go_from_scratch/eval/ppo_same_size/ppo_big_eval/h2h_lr_scan.json")
    go["head_to_head_vs_same_size_ppo_lr3e-5"] = {k: v["score"] for k, v in h2h.items() if "lr3e-5" in k}
    lrscan = jread("exp6_go_from_scratch/eval/ppo_same_size/ppo_big_eval/eval_lr_scan.json")
    go["same_size_ppo_through_the_hidden_eval"] = {k: {"ppo_s0": v["ppo_s0"], "ppo_s2": v["ppo_s2"], "strong_500": v["strong_500"]} for k, v in lrscan.items() if k != "best_on_strong"}
    go["lr_chosen_on"] = lrscan["best_on_strong"]
    car = jread("exp4_fix_car/eval/ppo_training_result.json")
    carrow = {"ppo_train_env_steps": car["train_env_steps"], "ppo_last_search_success": car["last_search"]["success"], "ppo_test_success": car["test"]["success"], "evals_all_zero": all(e["success"] == 0.0 for e in car["evals"])}
    br = tab["breakout"]
    twenty = br["ratio_vs_ppo500_best"] >= 20
    lost_two = sum(1 for g in ("seaquest", "asterix") if not tab[g]["astra_beats_ppo500_best"]) == 2
    facts = {"exp5_minatar": tab, "exp5_readme_quoted": exp5_readme, "exp6_go": go, "exp4_car_ppo": carrow,
             "reading": "'20x over PPO' = exp5 Breakout 517.411 / 25.344 (best 500M-step seed) = 20.4x; 'lost in two other games' = exp5 Seaquest 53.110 < 88.884 and Asterix 53.178 < 55.204 against the best 500M-step PPO seed; against the best 100M-step seed Astra's network scores higher in all three."}
    v = ("CERTIFIED" if twenty else "REFUTED") + " (20x over PPO) · " + ("CERTIFIED" if lost_two else "REFUTED") + " (lost in two other games) · REFUSED (PPO weak: a judgement, no released criterion)"
    return {"claim": "M5a — 20x over PPO; PPO weak; Astra lost in two other games", "files": ["exp5_write_from_scratch/eval/minatar_eval.json", "exp5_write_from_scratch/README.md"] + ["exp6_go_from_scratch/eval/budget_%d/eval_submission.json" % b for b in (0, 10, 25, 50)] + ["exp6_go_from_scratch/eval/ppo_same_size/ppo_big_eval/h2h_lr_scan.json", "exp6_go_from_scratch/eval/ppo_same_size/ppo_big_eval/eval_lr_scan.json", "exp4_fix_car/eval/ppo_training_result.json"],
            "facts": facts, "verdict": v,
            "reason": "exp5 (1,000-episode means): Breakout 517.4 vs PPO 25.3 (500M) / 15.8 (100M); Seaquest 53.1 vs 88.9 / 5.6; Asterix 53.2 vs 55.2 / 25.8 — the 20x and the two losses are both in the released table, the two losses against the 500M-step PPO only. exp6 Go: budget-0 network loses all three head-to-heads with the same-size PPO (42.6 / 26.3 / 36.3 %%), budget-50 wins them (74.2 / 70.0 / 78.5 %%). exp4: the PPO car network has 0 successes at every evaluation. 'Weak' has no released criterion; the PPO settings are released for a reader to judge. Nothing was re-run."}


def claim_m5b():
    readme = "exp7_sycophancy/README.md"
    q1 = must_contain(readme, "In four attempts with the weights alone, Astra could not tell. With a tool that shows only the attention patterns of\nboth models on texts Astra writes itself, it picked the sycophant in all three pairs.")
    q2 = must_contain(readme, "In attempts 1-3, every answer was P = 0.5 with \"A\" as a forced tie-break, so the 1 / 3 \"correct\" in each\n`score.json` is chance. We stopped attempt 4 after 29-30 runs per pair, with only pair 2 finished, so it has no\n`score.json`.")
    q3 = must_contain(readme, "## The models (not included: 17 GB)")
    rule = must_contain("exp7_sycophancy/runs/weights_only_1/prompt.txt", "FORBIDDEN: running the language model (or any part of it) on any input. That means no forward pass of any input;")
    rounds = {}
    for r in ("weights_only_1", "weights_only_2", "weights_only_3", "attention_tool"):
        sc = jread("exp7_sycophancy/eval/%s/score.json" % r)
        rounds[r] = [{"pair": s["pair"], "sycophant": s["sycophant"], "astra": s["answer"], "p_correct": s["p_correct"], "correct": s["correct"], "runs": s["runs"]} for s in sc]
        rounds[r + "_correct"] = "%d / %d" % (sum(1 for s in sc if s["correct"]), len(sc))
    p2 = jread("exp7_sycophancy/runs/weights_only_4/pair2/prediction.json")
    rounds["weights_only_4"] = {"pair2_prediction": {k: p2[k] for k in p2 if k in ("sycophantic", "p_sycophantic_is_A", "p_A", "probability", "answer", "confidence")} or {k: p2[k] for k in list(p2)[:4]},
                                "pairs_1_and_3": "stopped; last early_answer_<n>.md only (README: 'A, 0.5 (stopped)' and 'B, 0.30 (stopped; leaning wrong)'); no score.json"}
    hashes = [l for l in read("exp7_sycophancy/models.sha256").splitlines() if l and not l.startswith("#")]
    released = {"code": sorted(os.listdir(os.path.join(LOGS, "exp7_sycophancy/code"))), "dataset": sorted(os.listdir(os.path.join(LOGS, "exp7_sycophancy/dataset"))) + ["splits/" + f for f in sorted(os.listdir(os.path.join(LOGS, "exp7_sycophancy/dataset/splits")))],
                "eval": sorted(os.listdir(os.path.join(LOGS, "exp7_sycophancy/eval"))), "runs": sorted(os.listdir(os.path.join(LOGS, "exp7_sycophancy/runs"))),
                "training_logs": sorted(os.path.relpath(os.path.join(dp, f), os.path.join(LOGS, "exp7_sycophancy/training")) for dp, _, fs in os.walk(os.path.join(LOGS, "exp7_sycophancy/training")) for f in fs),
                "models.sha256": {"hash_lines": len(hashes), "models_released": False, "note": q3}}
    beh = {}
    for p in (100, 101, 102):
        for m in ("honest", "sycophant", "base"):
            b = jread("exp7_sycophancy/eval/model_behaviour/pair%d_%s.json" % (p, m))
            beh["pair%d_%s" % (p, m)] = {k: b[k] for k in ("wrong_follow_known_heldout", "plain_acc_heldout") if k in b}
    facts = {"released": released, "forbidden_in_weights_only_rounds": rule, "rounds": rounds, "model_behaviour": beh, "readme_quoted": [q1, q2],
             "reported_as": "the authors' README reports the weights-only rounds as a failure ('could not tell'; attempts 1-3 at chance by their own words) and the attention-tool round as the success (3 / 3)"}
    weights_only_failed = all(s["p_correct"] == 0.5 for r in ("weights_only_1", "weights_only_2", "weights_only_3") for s in rounds[r])
    return {"claim": "M5b — sycophancy 'failed from weights alone'", "files": [readme, "exp7_sycophancy/runs/weights_only_1/prompt.txt", "exp7_sycophancy/models.sha256"] + ["exp7_sycophancy/eval/%s/score.json" % r for r in ("weights_only_1", "weights_only_2", "weights_only_3", "attention_tool")] + ["exp7_sycophancy/runs/weights_only_4/pair2/prediction.json"] + ["exp7_sycophancy/eval/model_behaviour/pair%d_%s.json" % (p, m) for p in (100, 101, 102) for m in ("honest", "sycophant", "base")],
            "facts": facts, "verdict": "CERTIFIED" if weights_only_failed else "REFUTED",
            "reason": "the released score.json of attempts 1-3 has every answer 'A' at P(correct) = 0.5 (1/3 'correct' per attempt = chance, the README's own words); attempt 4 was stopped with one pair finished; the README says 'In four attempts with the weights alone, Astra could not tell' and reports the attention-tool round (3/3) as the result. Code, dataset, splits, eval scripts, runs and 18 sha256 lines are released; the 17 GB of models are not."}


# ----------------------------------------------------------------------------------------------------------- record
def derive():
    t0 = time.time()
    claims = {"M2": claim_m2(), "M3": claim_m3(), "M4a": claim_m4a(), "M4b": claim_m4b(), "M5a": claim_m5a(), "M5b": claim_m5b()}
    head = open(os.path.join(LOGS, ".git", "HEAD")).read().strip()
    commit = head
    if head.startswith("ref: "):
        commit = open(os.path.join(LOGS, ".git", head[5:])).read().strip()
    if commit != LOGS_COMMIT:
        raise SystemExit("logs checkout is at %s, not %s" % (commit, LOGS_COMMIT))
    rec = {"what": "the side claims of the Weight-Space Programming review (M2 the dose and its problem sets, M3 Frogger/Freeway, M4 the car network's weights and its evaluation, M5 PPO and the sycophancy round) decided from the authors' released logs alone — JSON read, npz parsed with the standard library, Astra's notebook quoted with every quote asserted present; nothing of the claimants' run",
           "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "seconds": round(time.time() - t0, 1),
           "sources": {"logs": {"repo": "github.com/RikiyaT/lm_understand-logs", "commit": commit}, "math500": {"repo": "HuggingFaceH4/MATH-500", "file": "test.jsonl"}},
           "verdicts": {k: v["verdict"] for k, v in claims.items()},
           "pins": dict(sorted(PINS.items())), "claims": claims}
    return rec


def main():
    check = "--check" in sys.argv
    rec = derive()
    if check:
        if not os.path.exists(RECORD):
            print("FAIL  wsp-side-claims --check: no record at " + RECORD)
            sys.exit(1)
        old = json.load(open(RECORD))
        drop = ("generated", "seconds")
        a = {k: v for k, v in old.items() if k not in drop}
        b = {k: v for k, v in rec.items() if k not in drop}
        if a != b:
            bad = [k for k in sorted(set(a) | set(b)) if a.get(k) != b.get(k)]
            print("FAIL  wsp-side-claims --check: differs in " + ", ".join(bad))
            sys.exit(1)
        print("PASS  wsp-side-claims --check (%s pins, %d claims, %.1f s)" % (len(rec["pins"]), len(rec["claims"]), rec["seconds"]))
        return
    os.makedirs(os.path.dirname(RECORD), exist_ok=True)
    with open(RECORD, "w") as f:
        json.dump(rec, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print("wrote %s (%d bytes, %d pins)" % (os.path.relpath(RECORD, ROOT), os.path.getsize(RECORD), len(rec["pins"])))
    for k, v in rec["verdicts"].items():
        print("  %-4s %s" % (k, v))


if __name__ == "__main__":
    main()
