#!/usr/bin/env python3
"""record.py: the recorder of Stage 1 of the audit of "Language Models Can Rewrite Their Own Weights". It decides
nothing. It reads what the two deciders wrote (instruments/qwen-self-rewriting/stage1.py and tools/qwen-stage1.js),
compares them on every row, every range and every hash, applies the registered rule that a control not caught voids
the rows that depend on it, and writes the certificate. A disagreement is reported; it is never reconciled here.

usage: python3 -I tools/qwen-stage1.py record [--claims F --pins F --runs DIR --cert F --spec F --deviations F]
MIT"""
import hashlib
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
VERDICT_ROWS = ["S1", "S2", "S3", "S4", "W1", "W2", "W3", "W4", "E1", "E4"]


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def canon(x):
    return json.dumps(x, sort_keys=True, separators=(",", ":"))


def first_difference(a, b, where=""):
    """the path of the first place where two JSON values differ"""
    if type(a) != type(b):
        return where or "(top)"
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                return "%s.%s" % (where, k)
            d = first_difference(a[k], b[k], "%s.%s" % (where, k))
            if d:
                return d
        return None
    if isinstance(a, list):
        if len(a) != len(b):
            return "%s (length %d against %d)" % (where, len(a), len(b))
        for i, (x, y) in enumerate(zip(a, b)):
            d = first_difference(x, y, "%s[%d]" % (where, i))
            if d:
                return d
        return None
    return None if a == b else (where or "(top)")


def log_of(path):
    """the successful requests of a decider's log, keyed by what was read"""
    out, errors, total = {}, 0, 0
    if not os.path.exists(path):
        return out, errors, total
    for line in open(path, encoding="utf-8"):
        r = json.loads(line)
        if "error" in r:
            errors += 1
            continue
        total += r["length"]
        key = "%s|%s|%s|%s|%s" % (r["kind"], r["url"].split("/resolve/")[-1].split("/api/")[-1], r["first"], r["last"], r["method"])
        out[key] = r
    return out, errors, total


def decided_by(rid, v):
    """one sentence: the values that decided a row"""
    try:
        if rid == "S1":
            return "config.json and the 11 headers: %d layers, linear-attention layers %s; checks that fail: %s" % (v["headers"]["layers"], len(v["headers"]["with_linear_attn"]), v["failed"] or "none")
        if rid == "S2":
            return "shape %s; 8 x columns = %s" % (v.get("shape"), v.get("rows_times_columns"))
        if rid == "S3":
            return "%d tensors; not BF16: %d tensors, %d entries; by dtype %s" % (v["tensors"], v["not_bf16_count"], v["not_bf16_entries"], canon(v["by_dtype"]))
        if rid == "S4":
            return "%d tensors in the set, %d entries" % (v["count"], v["entries"])
        if rid == "W1":
            return "sd dividing by n in [%s, %s], band %s against %s; dividing by n - 1 in [%s, %s], band %s" % (
                v["sd_dividing_by_n_dec"][0], v["sd_dividing_by_n_dec"][1], v["band_dividing_by_n"], v["printed"], v["sd_dividing_by_n_minus_1_dec"][0], v["sd_dividing_by_n_minus_1_dec"][1], v["band_dividing_by_n_minus_1"])
        if rid == "W2":
            r = v["readings"]
            return "norm of rows 3068-3075 counted from 0 in [%s, %s], band %s against %s; counted from 1 in [%s, %s], band %s" % (
                r["rows_counted_from_0"]["norm_dec"][0], r["rows_counted_from_0"]["norm_dec"][1], r["rows_counted_from_0"]["band"], v["printed"],
                r["rows_counted_from_1"]["norm_dec"][0], r["rows_counted_from_1"]["norm_dec"][1], r["rows_counted_from_1"]["band"])
        if rid == "W3":
            r = v["readings"]
            return "largest |w| counted from 0: %s (%s), band %s against %s; counted from 1: %s, band %s" % (
                r["rows_counted_from_0"]["largest_abs_dec"][0], r["rows_counted_from_0"]["largest_abs"], r["rows_counted_from_0"]["band"], v["printed"],
                r["rows_counted_from_1"]["largest_abs_dec"][0], r["rows_counted_from_1"]["band"])
        if rid == "W4":
            if "readings" not in v:
                return v.get("why", "")
            return "; ".join("%s: M in [%s, %s] at %s, band %s" % (k, r["M_dec"][0], r["M_dec"][1], ", ".join(r["attained_by"]), r["band"]) for k, r in v["readings"].items()) + " (against %s)" % v["printed"]
        if rid == "E1":
            return "%d linear-attention layers; %d tensors named dt_bias; layers with none %s; with more than one %s" % (v["linear_attention_layers"], v["count"], v["layers_with_none"], v["layers_with_more_than_one"])
        if rid == "E4":
            return "E1 %s; %d entries; every y finite: %s; entries where the readings differ: %d (by pair %s); rounding check failures %s" % (
                v["E1"], v["entries"], v["every_y_finite"], v["entries_where_readings_differ"], canon(v["entries_where_two_readings_differ"]), canon(v["rounding_check_failures"]))
    except (KeyError, TypeError, IndexError):
        return v.get("why", "") if isinstance(v, dict) else ""
    return ""


def main(argv):
    opt = {"claims": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "claims.json"), "pins": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "PINS.json"),
           "runs": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "runs", "stage1"), "cert": os.path.join(ROOT, "certs", "qwen-self-rewriting-stage1.json"),
           "spec": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "session8-edit-spec.json"), "deviations": None, "code": os.path.join(ROOT, "corpus", "qwen-self-rewriting", "STAGE1-CODE.sha256")}
    rest = list(argv)
    while rest:
        k = rest.pop(0)
        if not k.startswith("--") or k[2:] not in opt or not rest:
            print("unknown option " + k, file=sys.stderr)
            return 2
        opt[k[2:]] = rest.pop(0)
    claims, pins = load(opt["claims"]), load(opt["pins"])
    D = {}
    for d in ("py", "js"):
        D[d] = {}
        for name in ("offline", "i1", "i2", "plan", "results", "controls"):
            p = os.path.join(opt["runs"], d, name + ".json")
            D[d][name] = load(p) if os.path.exists(p) else None
    notes, incomplete = [], []
    for d in ("py", "js"):
        for name in ("offline", "i1", "i2", "plan", "results", "controls"):
            if D[d][name] is None:
                incomplete.append("%s/%s.json is absent" % (d, name))

    def both(name):
        return D["py"][name] is not None and D["js"][name] is not None
    # ---- the range lists and the range hashes
    rt = {d: (open(os.path.join(opt["runs"], d, "ranges.tsv"), "rb").read() if os.path.exists(os.path.join(opt["runs"], d, "ranges.tsv")) else None) for d in ("py", "js")}
    lists_equal = rt["py"] is not None and rt["py"] == rt["js"]
    logs = {d: log_of(os.path.join(opt["runs"], d, "ranges.jsonl")) for d in ("py", "js")}
    clogs = {d: log_of(os.path.join(opt["runs"], d, "ranges-controls.jsonl")) for d in ("py", "js")}
    range_diff = []
    for L in (logs, clogs):
        for key in sorted(set(L["py"][0]) | set(L["js"][0])):
            a, b = L["py"][0].get(key), L["js"][0].get(key)
            if a is None or b is None:
                range_diff.append({"range": key, "why": "read by one decider only"})
            elif a["sha256"] != b["sha256"] or a["length"] != b["length"]:
                range_diff.append({"range": key, "why": "sha256 or length differs"})
    unreported = sum(1 for L in (logs, clogs) for d in ("py", "js") for r in L[d][0].values()
                     if (r["kind"] in ("len8", "header", "tensor", "whole") or r["kind"].startswith("control-")) and (r["commit"] is None or r["lfs_sha256"] is None))
    hosts = sorted({h for L in (logs, clogs) for d in ("py", "js") for r in L[d][0].values() for h in r["hosts"]})
    # ---- the rows
    disagreements = []
    rows_py = dict((D["py"]["results"] or {}).get("rows", {}))
    rows_js = dict((D["js"]["results"] or {}).get("rows", {}))
    for name in ("plan",):
        if both(name):
            for k in ("rows", "header_sha256", "header_bytes", "checks", "ranges_sha256", "files_whole"):
                d = first_difference(D["py"][name].get(k), D["js"][name].get(k))
                if d:
                    disagreements.append({"where": "plan.%s" % k, "first_difference": d})
    if both("i2"):
        d = first_difference(D["py"]["i2"]["values"], D["js"]["i2"]["values"])
        if d:
            disagreements.append({"where": "I2", "first_difference": d})
    if both("i1"):
        d = first_difference([[s["file"], s["header_bytes"], s["len8_hex"], s["resolve"], s["api"]] for s in D["py"]["i1"]["shards"]],
                             [[s["file"], s["header_bytes"], s["len8_hex"], s["resolve"], s["api"]] for s in D["js"]["i1"]["shards"]])
        if d:
            disagreements.append({"where": "I1", "first_difference": d})
    spec = {d: (open(os.path.join(opt["runs"], d, "session8-edit-spec.json"), "rb").read() if os.path.exists(os.path.join(opt["runs"], d, "session8-edit-spec.json")) else None) for d in ("py", "js")}
    spec_identical = spec["py"] is not None and spec["py"] == spec["js"]
    # ---- the controls
    controls = {}
    for c in claims["controls"]:
        k = c["id"]
        src = "offline" if k in ("K6", "K7") else "controls"
        a = (D["py"][src] or {}).get(k)
        b = (D["js"][src] or {}).get(k)
        caught = bool(a and b and a.get("caught") and b.get("caught"))
        extra = {}
        if k == "K1" and a and b:
            extra = {"on_time_hashes_equal_across_deciders": a["on_time_sha256"] == b["on_time_sha256"],
                     "python_late_differs_from_javascript_on_time": a["late_sha256"] != b["on_time_sha256"],
                     "javascript_late_differs_from_python_on_time": b["late_sha256"] != a["on_time_sha256"]}
            caught = caught and all(extra.values())
        if k == "K3" and a and b:
            extra = {"wrong_specification_hashes_equal_across_deciders": a["specification_sha256_with_the_wrong_constant"] == b["specification_sha256_with_the_wrong_constant"]}
            caught = caught and all(extra.values())
        if k == "K5" and a and b:
            extra = {"hashes_after_the_flip_equal_across_deciders": a["sha256_after_the_flip"] == b["sha256_after_the_flip"] and a["census_sha256_after_the_flip"] == b["census_sha256_after_the_flip"]}
            caught = caught and all(extra.values())
        strip = lambda x: {kk: vv for kk, vv in x.items() if kk != "meta"} if x else None
        controls[k] = {"text": c["text"], "caught": caught, "ran": bool(a and b), "voids_if_not_caught": c["voids_if_not_caught"], "across_deciders": extra, "py": strip(a), "js": strip(b)}
    unit = {d: (D[d]["offline"] or {}).get("unit_tests") for d in ("py", "js")}
    # ---- the certificate rows, in the order of the rules
    out_rows = []
    i1 = {"id": "I1", "kind": "integrity", "verdict": None, "passed": bool(both("i1") and D["py"]["i1"]["passed"] and D["js"]["i1"]["passed"])}
    if both("i1"):
        i1["values"] = {"rule": D["py"]["i1"]["rule"], "api_listing": D["py"]["i1"]["api_listing"], "shards": D["py"]["i1"]["shards"], "failures": D["py"]["i1"]["failures"] + D["js"]["i1"]["failures"]}
    out_rows.append(i1)
    out_rows.append({"id": "I2", "kind": "computed", "verdict": "COMPUTED" if both("i2") else None, "values": (D["py"]["i2"] or {}).get("values")})
    if not both("i2"):
        incomplete.append("I2 did not finish")
    for r in claims["rows"]:
        rid = r["id"]
        if rid in ("I1", "I2"):
            continue
        a, b = rows_py.get(rid), rows_js.get(rid)
        row = {"id": rid, "kind": r["kind"]}
        if a is None or b is None:
            row.update({"verdict": None, "incomplete": "no result from %s" % ("either decider" if a is None and b is None else ("the Python decider" if a is None else "the JavaScript decider"))})
            incomplete.append("%s did not finish" % rid)
            out_rows.append(row)
            continue
        d = first_difference(a, b)
        if d:
            disagreements.append({"where": rid, "first_difference": d})
            row.update({"verdict": None, "incomplete": "the two deciders disagree at %s" % d, "py": a, "js": b})
            out_rows.append(row)
            continue
        row["verdict"] = a["verdict"]
        if rid == "E4" and a["verdict"] == "CERTIFIED" and not spec_identical:
            row["verdict"] = "REFUSED"
            row["note"] = "the two deciders did not write identical bytes"
        if rid in VERDICT_ROWS:
            row["decided_by"] = decided_by(rid, a["values"])
            lost = [k for k, c in controls.items() if not c["caught"] and rid in c["voids_if_not_caught"]]
            if lost:
                row["verdict_before_the_controls"] = row["verdict"]
                row["verdict"] = "REFUSED"
                row["voided_by"] = lost
        row["values"] = a["values"]
        out_rows.append(row)
    agree = not disagreements and both("results")
    spec_sha = None
    if spec_identical:
        os.makedirs(os.path.dirname(opt["spec"]), exist_ok=True)
        with open(opt["spec"], "wb") as f:
            f.write(spec["py"])
        spec_sha = sha256(spec["py"])
    deviations = load(opt["deviations"]) if opt["deviations"] and os.path.exists(opt["deviations"]) else []
    rel = lambda p: os.path.relpath(p, ROOT) if os.path.abspath(p).startswith(ROOT) else p
    cert = {
        "what": "Stage 1 of the audit of \"Language Models Can Rewrite Their Own Weights\" (arXiv 2611.21885 v2): what the public files of Qwen/Qwen3.5-27B decide at one pinned commit, by two deciders that share no code. It decides no accuracy number and nothing about the authors' files.",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "rules": claims["rules"], "claims": {"file": rel(opt["claims"]), "sha256": sha256(open(opt["claims"], "rb").read())},
        "pins": {"file": rel(opt["pins"]), "sha256": sha256(open(opt["pins"], "rb").read())},
        "code_hashes": {"file": rel(opt["code"]), "sha256": sha256(open(opt["code"], "rb").read()) if os.path.exists(opt["code"]) else None},
        "model": {"repo": pins["model"]["repo"], "commit": pins["model"]["commit"]},
        "verdict_words": claims["verdict_words"], "not_established": claims["not_established"],
        "deciders": {"python": (D["py"]["results"] or {}).get("meta"), "javascript": (D["js"]["results"] or {}).get("meta"), "agree_on_every_row": agree, "disagreements": disagreements,
                     "range_lists_equal": lists_equal, "ranges_in_the_list": rt["py"].count(b"\n") if rt["py"] else None, "ranges_sha256": sha256(rt["py"]) if rt["py"] else None,
                     "range_hashes_equal": not range_diff and bool(logs["py"][0]), "range_differences": range_diff,
                     "ranges_where_the_server_reported_no_commit_or_no_lfs_hash": unreported, "hosts": hosts,
                     "specification_bytes_identical": spec_identical},
        "integrity": {"hashed_whole": (D["py"]["results"] or {}).get("integrity"), "hashed_whole_javascript_equal": both("results") and D["py"]["results"]["integrity"] == D["js"]["results"]["integrity"]},
        "rows": out_rows,
        "specification": {"file": rel(opt["spec"]) if spec_sha else None, "sha256": spec_sha},
        "controls": controls, "unit_tests": unit,
        "cost": {d: {"bytes_read": logs[d][2] + clogs[d][2], "requests": len(logs[d][0]) + len(clogs[d][0]), "failed_attempts_retried": logs[d][1] + clogs[d][1],
                     "seconds_of_the_run": (D[d]["results"] or {}).get("seconds")} for d in ("py", "js")},
        "incomplete": incomplete, "deviations": deviations, "notes": notes,
    }
    os.makedirs(os.path.dirname(opt["cert"]), exist_ok=True)
    with open(opt["cert"], "w", encoding="utf-8") as f:
        json.dump(cert, f, indent=1, ensure_ascii=True)
        f.write("\n")
    print("deciders agree on every row: %s; range lists equal: %s; range hashes equal: %s; specification bytes identical: %s" % (agree, lists_equal, cert["deciders"]["range_hashes_equal"], spec_identical))
    for d in disagreements:
        print("  DISAGREEMENT %s at %s" % (d["where"], d["first_difference"]))
    for r in out_rows:
        print("  %-3s %s%s" % (r["id"], r["verdict"] if r["verdict"] else ("PASSED" if r.get("passed") else ("FAILED" if r["id"] == "I1" else "INCOMPLETE")), " (voided by %s)" % ",".join(r["voided_by"]) if r.get("voided_by") else ""))
    for k, c in controls.items():
        print("  %s %s" % (k, "caught" if c["caught"] else ("NOT CAUGHT" if c["ran"] else "not run")))
    print("cert %s" % rel(opt["cert"]))
    return 0 if agree and not incomplete else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
