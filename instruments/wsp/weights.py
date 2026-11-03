#!/usr/bin/env python3
"""weights.py — the Weight-Space Programming edit (Takehi, Teoh, Zhang, Khattab, MIT CSAIL, 2026-11-02) decided from
the bytes of the two checkpoints, Python standard library only (struct, mmap, hashlib, fractions): no numpy, no
safetensors, no torch, and no code shared with the claimants' make_edit_diff.py / apply_edit.py / st_numpy.py (read as
text, never run) or with tools/wsp-weights.js (the JavaScript decider that re-derives every fact below).

What is decided, each sub-claim with its own verdict (CERTIFIED / REFUTED with a witness / REFUSED with a reason):
  W1  the two checkpoints hold the same tensors (names, shapes, dtypes);
  W2  exactly two tensors differ in bytes — layers 15 and 19 mlp.down_proj (the post: "only these two tensors differ");
  W3  the number of bfloat16 entries whose bits differ (the post: "131,072 weights"; the authors' own edit manifest:
      130,188, "an entry the edit touched but that rounds back to the same bfloat16 value is not counted");
  W4  the fraction of the parameter count (the post: "0.016%"), computed against the full release's count (the
      checkpoint is image-text-to-text), the language model's count, that count without the tied embedding, and the
      round number in the model's name (0.8B), as exact rationals;
  W5  the structure: the changed entries lie in exactly 64 columns per tensor, the columns the run's own manifest names
      (frozen_weights_manifest.json selected_neurons);
  W6  one direction: a witness (u, α) with  bf16(f32(W[:, c]) − u·α_c) == W'[:, c]  on every changed column c, in
      binary32 arithmetic then round-to-nearest-even to bfloat16, checked entry by entry; the witness is proposed by
      tools/wsp-witness.py (numpy, an SVD — a PROPOSER, no authority) and only checked here;
  W7  the per-tensor sha256 of the raw bfloat16 bytes printed on the model card (edited) and in the edit manifest (base).

Every float is a dyadic rational: a bfloat16 or binary32 bit pattern converts to a Fraction exactly, so "equal",
"differs" and the counts are exact decisions, not tolerances.

usage: python3 instruments/wsp/weights.py <base.safetensors> <edited.safetensors> <claims.json> [witness.json] [--control NAME]
       prints one JSON document (the facts and verdicts) to stdout; --control applies a red control in memory:
         flip-third   one bit flipped in a third tensor (W2 must then find three tensors)
         double-delta the delta on layer 15 doubled (W6's witness must then fail)
MIT"""
import hashlib
import json
import mmap
import struct
import sys
from array import array
from fractions import Fraction

DTYPE_BYTES = {"BF16": 2, "F16": 2, "F32": 4, "F64": 8, "I64": 8, "I32": 4, "I16": 2, "I8": 1, "U8": 1, "BOOL": 1}


def parse(path):
    """safetensors: 8 bytes little-endian header length, the JSON header, then the data. Returns (header, data_start)."""
    f = open(path, "rb")
    n = struct.unpack("<Q", f.read(8))[0]
    header = json.loads(f.read(n))
    header.pop("__metadata__", None)
    mm = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
    return header, 8 + n, mm


def tensor_bytes(header, start, mm, name):
    a, b = header[name]["data_offsets"]
    return mm[start + a:start + b]


def numel(shape):
    n = 1
    for s in shape:
        n *= s
    return n


def bf16_to_fraction(bits):
    """a bfloat16 bit pattern (uint16) as an exact rational; NaN/Inf raise."""
    s = -1 if bits & 0x8000 else 1
    e = (bits >> 7) & 0xFF
    m = bits & 0x7F
    if e == 0xFF:
        raise ValueError("non-finite bfloat16")
    if e == 0:
        return Fraction(s * m, 1 << (126 + 7))
    return Fraction(s * (m | 0x80), 1 << 7) * Fraction(2) ** (e - 127)


def f32_bits(x):
    return struct.unpack("<I", struct.pack("<f", x))[0]


def f32_from_bits(b):
    return struct.unpack("<f", struct.pack("<I", b))[0]


def bf16_from_f32_bits(b):
    """round-to-nearest-even of a binary32 bit pattern to bfloat16 (the torch/numpy cast for finite values)."""
    if (b & 0x7F800000) == 0x7F800000:  # inf or nan: truncate, keep nan quiet
        return (b >> 16) | (0x40 if (b & 0x7FFFFF) else 0)
    return ((b + 0x7FFF + ((b >> 16) & 1)) >> 16) & 0xFFFF


def bf16_bits_to_f32(bits):
    return f32_from_bits(bits << 16)


def f32(x):
    """round a Python float (binary64) to binary32, round-to-nearest-even."""
    return struct.unpack("<f", struct.pack("<f", x))[0]


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def main(argv):
    base_path, edited_path, claims_path = argv[0], argv[1], argv[2]
    witness_path = None
    control = None
    rest = argv[3:]
    while rest:
        a = rest.pop(0)
        if a == "--control":
            control = rest.pop(0)
        else:
            witness_path = a
    claims = json.load(open(claims_path))
    H0, S0, M0 = parse(base_path)
    H1, S1, M1 = parse(edited_path)
    out = {"decider": "instruments/wsp/weights.py", "control": control, "facts": {}, "verdicts": {}}
    F, V = out["facts"], out["verdicts"]

    # ---- W1: the same tensors
    names0, names1 = set(H0), set(H1)
    only0, only1 = sorted(names0 - names1), sorted(names1 - names0)
    common = sorted(names0 & names1)
    shape_diff = [n for n in common if H0[n]["shape"] != H1[n]["shape"]]
    dtype_diff = [n for n in common if H0[n]["dtype"] != H1[n]["dtype"]]
    F["tensors"] = {"base": len(H0), "edited": len(H1), "only_base": only0, "only_edited": only1,
                    "shape_differs": shape_diff, "dtype_differs": dtype_diff,
                    "dtypes_base": sorted({H0[n]["dtype"] for n in H0}), "dtypes_edited": sorted({H1[n]["dtype"] for n in H1}),
                    "bytes_base": M0.size(), "bytes_edited": M1.size(), "header_bytes": [S0 - 8, S1 - 8]}
    V["W1"] = ("CERTIFIED" if not (only0 or only1 or shape_diff or dtype_diff) else "REFUTED")

    # ---- W2: which tensors differ in bytes (and, where dtypes differ, in value)
    differ_bytes = []
    differ_value = []
    control_bytes = {}
    for n in common:
        if H0[n]["shape"] != H1[n]["shape"]:
            differ_bytes.append(n)
            differ_value.append(n)
            continue
        b0 = tensor_bytes(H0, S0, M0, n)
        b1 = tensor_bytes(H1, S1, M1, n)
        if control == "flip-third" and n == "model.language_model.layers.3.mlp.up_proj.weight":
            b1 = bytearray(b1)
            b1[100] ^= 0x01
            b1 = bytes(b1)
            control_bytes[n] = b1
        if H0[n]["dtype"] == H1[n]["dtype"]:
            if b0 != b1:
                differ_bytes.append(n)
                differ_value.append(n)
        else:
            differ_bytes.append(n)
            # exact value comparison across dtypes: every bf16/f32 value is a dyadic rational
            v0 = values(H0[n]["dtype"], b0)
            v1 = values(H1[n]["dtype"], b1)
            if v0 != v1:
                differ_value.append(n)
    F["differ_in_bytes"] = differ_bytes
    F["differ_in_value"] = differ_value
    claimed = claims["edited_tensors"]
    V["W2"] = "CERTIFIED" if differ_value == sorted(claimed) and differ_bytes == sorted(claimed) else "REFUTED"
    if differ_value == sorted(claimed) and differ_bytes != sorted(claimed):
        V["W2"] = "REFUTED-in-bytes, CERTIFIED-in-value"

    # ---- W3 / W5: the changed entries, their columns and rows, per edited tensor
    per = {}
    total_changed = 0
    for n in claimed:
        if n not in common or H0[n]["dtype"] != "BF16" or H1[n]["dtype"] != "BF16":
            per[n] = {"error": "missing or not bfloat16 in both"}
            continue
        rows, cols = H0[n]["shape"]
        a0 = array("H")
        a0.frombytes(tensor_bytes(H0, S0, M0, n))
        a1 = array("H")
        a1.frombytes(control_bytes.get(n) or tensor_bytes(H1, S1, M1, n))
        if sys.byteorder != "little":
            a0.byteswap()
            a1.byteswap()
        if control == "double-delta" and n.endswith("layers.15.mlp.down_proj.weight"):
            a1 = double_delta(a0, a1)
        changed = [i for i in range(rows * cols) if a0[i] != a1[i]]
        colset = sorted({i % cols for i in changed})
        rowset = sorted({i // cols for i in changed})
        touched_cols = colset
        per[n] = {"shape": [rows, cols], "changed_entries": len(changed), "changed_columns": len(colset),
                  "changed_rows": len(rowset), "columns": colset, "entries_in_those_columns": len(colset) * rows,
                  "sha256_base": sha256(a0.tobytes() if sys.byteorder == "little" else tensor_bytes(H0, S0, M0, n)),
                  "sha256_edited": sha256(a1.tobytes()), "_a0": a0, "_a1": a1, "_changed": changed}
        total_changed += len(changed)
    F["per_tensor"] = {n: {k: v for k, v in d.items() if not k.startswith("_")} for n, d in per.items()}
    F["changed_entries_total"] = total_changed
    F["entries_in_changed_columns_total"] = sum(d.get("entries_in_those_columns", 0) for d in per.values())
    c3 = claims["changed_entries"]
    V["W3"] = {"printed_131072_as_entries_whose_bits_differ": "CERTIFIED" if total_changed == c3["post"] else "REFUTED",
               "printed_131072_as_entries_in_the_64_columns": "CERTIFIED" if F["entries_in_changed_columns_total"] == c3["post"] else "REFUTED",
               "manifest_130188": "CERTIFIED" if total_changed == c3["manifest"] else "REFUTED"}
    sel = claims["selected_columns"]
    V["W5"] = "CERTIFIED" if all(per[n].get("columns") == sorted(sel[n]) and per[n].get("changed_columns") == 64 for n in claimed) else "REFUTED"

    # ---- W4: the parameter count
    count_all = sum(numel(H0[n]["shape"]) for n in H0)
    count_lm = sum(numel(H0[n]["shape"]) for n in H0 if n.startswith("model.language_model."))
    count_vis = sum(numel(H0[n]["shape"]) for n in H0 if n.startswith("model.visual."))
    count_other = count_all - count_lm - count_vis
    embed = numel(H0["model.language_model.embed_tokens.weight"]["shape"])
    F["parameters"] = {"all": count_all, "language_model": count_lm, "visual": count_vis, "other": count_other,
                       "embed_tokens": embed, "language_model_minus_embed": count_lm - embed}
    fr = {}
    for label, N in [("all", count_all), ("language_model", count_lm), ("language_model_minus_embed", count_lm - embed),
                     ("nominal_0.8B", 800000000)]:  # the name's round number, not a count
        for what, k in [("131072", 131072), ("changed", total_changed)]:
            q = Fraction(k, N)
            pct = q * 100
            fr[f"{what}/{label}"] = {"fraction": f"{q.numerator}/{q.denominator}", "percent": float(pct),
                                     "percent_rounded_3dp": str(round_half_even(pct, 3))}
    F["fraction"] = fr
    printed = claims["printed_percent"]  # "0.016"
    ok = {k: v["percent_rounded_3dp"] == printed for k, v in fr.items()}
    F["fraction_rounds_to_printed"] = ok
    V["W4"] = {k: ("CERTIFIED" if v else "REFUTED") for k, v in ok.items()}

    # ---- W7: the printed sha256s
    sh = {}
    for n in claimed:
        d = per[n]
        sh[n] = {"base_matches_manifest": d.get("sha256_base") == claims["sha256"][n]["base"],
                 "edited_matches_card": d.get("sha256_edited") == claims["sha256"][n]["edited"]}
    F["sha256_printed"] = sh
    V["W7"] = "CERTIFIED" if all(x["base_matches_manifest"] and x["edited_matches_card"] for x in sh.values()) else "REFUTED"

    # ---- W6: the one-direction witness
    if witness_path:
        W = json.load(open(witness_path))
        w6 = {}
        for n in claimed:
            d = per[n]
            if "_a0" not in d or n not in W:
                w6[n] = {"verdict": "REFUSED", "reason": "no witness for this tensor"}
                continue
            rows, cols = d["shape"]
            u = [f32_from_bits(b) for b in W[n]["u_f32_bits"]]
            alpha = {int(c): f32_from_bits(b) for c, b in zip(W[n]["columns"], W[n]["alpha_f32_bits"])}
            a0, a1 = d["_a0"], d["_a1"]
            mism = []
            checked = 0
            for c in W[n]["columns"]:
                c = int(c)
                ac = alpha[c]
                for r in range(rows):
                    i = r * cols + c
                    w = bf16_bits_to_f32(a0[i])
                    prod = f32(u[r] * ac)          # binary32 product (the double product of two binary32 is exact)
                    v = f32(w - prod)               # binary32 subtraction
                    bb = bf16_from_f32_bits(f32_bits(v))
                    checked += 1
                    if bb != a1[i]:
                        mism.append(i)
            # how far the mismatched entries are, in bfloat16 steps (monotone integer keys, value order)
            key = lambda b: b if b < 0x8000 else 0x8000 - b
            steps = []
            max_abs = 0.0
            max_target = 0.0
            for i in mism:
                r, c = i // cols, i % cols
                v = f32(bf16_bits_to_f32(a0[i]) - f32(u[r] * alpha[c]))
                steps.append(abs(key(bf16_from_f32_bits(f32_bits(v))) - key(a1[i])))
                max_abs = max(max_abs, abs(v - bf16_bits_to_f32(a1[i])))
                max_target = max(max_target, abs(bf16_bits_to_f32(a1[i])))
            max_steps = max(steps) if steps else 0
            # entries outside the witness's columns must be unchanged
            wcols = {int(c) for c in W[n]["columns"]}
            outside = [i for i in d["_changed"] if (i % cols) not in wcols]
            w6[n] = {"columns_in_witness": len(wcols), "entries_checked": checked, "mismatches": len(mism), "mismatch_max_bf16_steps": max_steps,
                     "mismatch_max_abs_difference": max_abs, "mismatch_max_abs_edited_value": max_target,
                     "mismatch_indices_first": mism[:16], "changed_outside_witness_columns": len(outside),
                     "verdict": "CERTIFIED" if not mism and not outside else "REFUSED",
                     "reason": None if not mism and not outside else
                     f"the proposed witness reproduces all but {len(mism)} of {checked} entries ({len(outside)} changed entries lie outside its columns); a rank-1 form is not refuted by a failed search"}
        F["witness"] = w6
        V["W6"] = "CERTIFIED" if all(x["verdict"] == "CERTIFIED" for x in w6.values()) else "REFUSED"
    else:
        V["W6"] = "REFUSED"
        F["witness"] = {"reason": "no witness file given"}

    json.dump(out, sys.stdout, indent=1)
    sys.stdout.write("\n")


def values(dtype, b):
    """exact rationals of a bf16 or f32 tensor (used only where dtypes differ between the two files)."""
    if dtype == "BF16":
        a = array("H")
        a.frombytes(b)
        if sys.byteorder != "little":
            a.byteswap()
        return [bf16_to_fraction(x) for x in a]
    if dtype == "F32":
        a = array("I")
        a.frombytes(b)
        if sys.byteorder != "little":
            a.byteswap()
        return [f32_to_fraction(x) for x in a]
    raise ValueError("dtype " + dtype)


def f32_to_fraction(bits):
    s = -1 if bits & 0x80000000 else 1
    e = (bits >> 23) & 0xFF
    m = bits & 0x7FFFFF
    if e == 0xFF:
        raise ValueError("non-finite binary32")
    if e == 0:
        return Fraction(s * m, 1 << (126 + 23))
    return Fraction(s * (m | 0x800000), 1 << 23) * Fraction(2) ** (e - 127)


def round_half_even(q, dp):
    """q a Fraction; the decimal with dp places, ties to even, as a string."""
    scaled = q * (10 ** dp)
    n = scaled.numerator // scaled.denominator
    rem = scaled - n
    if rem > Fraction(1, 2) or (rem == Fraction(1, 2) and n % 2 == 1):
        n += 1
    s = str(n).rjust(dp + 1, "0")
    return s[:-dp] + "." + s[-dp:]


def double_delta(a0, a1):
    """red control: W' := bf16(f32(W) + 2·(f32(W') − f32(W))) on layer 15."""
    out = array("H", a1)
    for i in range(len(a0)):
        if a0[i] != a1[i]:
            w, e = bf16_bits_to_f32(a0[i]), bf16_bits_to_f32(a1[i])
            out[i] = bf16_from_f32_bits(f32_bits(f32(w + f32(2.0 * f32(e - w)))))
    return out


if __name__ == "__main__":
    main(sys.argv[1:])
