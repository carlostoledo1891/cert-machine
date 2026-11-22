#!/usr/bin/env python3
"""fixture.py: a small synthetic checkpoint with the tensor names of Qwen/Qwen3.5-27B (from the fetched index) and tiny
shapes, for a dry run of the two Stage 1 deciders against a local mock of the hub. No network. It also writes an
answer key worked by brute force on exact rationals (sorted lists, no census), independent of both deciders.

usage: python3 -I fixture.py <out_dir> <port> [f32|bf16]     (the dtype of the time-step bias tensors)
MIT"""
import hashlib
import json
import os
import random
import struct
import sys
from fractions import Fraction

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
FETCHED = os.path.join(ROOT, "notes", "qwen-self-rewriting-2026-11-22", "fetched")
PRE = "model.language_model.layers."


def f32bits(x):
    return struct.unpack("<I", struct.pack("<f", x))[0]


def to_bf16(x):
    b = f32bits(x)
    return ((b + 0x7FFF + ((b >> 16) & 1)) >> 16) & 0xFFFF


def bf16_value(p):
    return Fraction(struct.unpack("<f", struct.pack("<I", p << 16))[0])


def f32_value(b):
    return Fraction(struct.unpack("<f", struct.pack("<I", b))[0])


def nearest(target, fmt):
    """round an exact rational by local search over neighbouring patterns (the answer key's own method)"""
    val = bf16_value if fmt == "BF16" else f32_value
    top = 0x7F80 if fmt == "BF16" else 0x7F800000
    sign = (0x8000 if fmt == "BF16" else 0x80000000) if target < 0 else 0
    a = abs(target)
    lo, hi = 0, top - 1
    while lo < hi:  # the largest pattern whose value is <= a
        mid = (lo + hi + 1) // 2
        if val(mid) <= a:
            lo = mid
        else:
            hi = mid - 1
    if lo + 1 >= top:
        return sign | lo
    d0, d1 = a - val(lo), val(lo + 1) - a
    pick = lo if d0 < d1 or (d0 == d1 and lo % 2 == 0) else lo + 1
    return sign | pick if a != 0 else 0


def main(out, port, variant):
    rnd = random.Random(8)
    os.makedirs(out, exist_ok=True)
    index = json.load(open(os.path.join(FETCHED, "hf-qwen35-27b-index.json")))
    cfg = json.load(open(os.path.join(FETCHED, "hf-qwen35-27b-config.json")))
    cfg["text_config"]["hidden_size"] = 16
    cfg["text_config"]["intermediate_size"] = 24
    wm = index["weight_map"]
    bias_dtype = "F32" if variant == "f32" else "BF16"
    specials = [-0.5, 0.0, 1.5, 1e-40, 16777216.0, 3.0e38, -2.25, 0.1]
    shards, values = {}, {}
    for name in sorted(wm):
        dtype, shape = "BF16", [4, 3]
        if name.endswith("mlp.down_proj.weight") and name.startswith(PRE):
            shape = [3080, 24] if name == PRE + "30.mlp.down_proj.weight" else [16, 24]
        elif name.endswith("linear_attn.out_proj.weight") or (name.endswith("self_attn.o_proj.weight") and name.startswith(PRE)):
            shape = [16, 20]
        elif name.endswith("linear_attn.dt_bias") or name.endswith("linear_attn.A_log"):
            dtype, shape = bias_dtype, [6]
        elif name.endswith("conv1d.weight"):
            shape = [20, 1, 4]
        elif name.endswith("norm.weight") or name.endswith(".bias"):
            shape = [5]
        n = 1
        for s in shape:
            n *= s
        if dtype == "F32":
            xs = [rnd.uniform(-3, 3) for _ in range(n)]
            if name.endswith("dt_bias"):
                xs[rnd.randrange(n)] = rnd.choice(specials)
                xs[rnd.randrange(n)] = rnd.choice(specials)
            bits = [f32bits(x) for x in xs]
            if name == PRE + "0.linear_attn.dt_bias":
                bits[0] = 0x80000000  # -0
            raw = struct.pack("<%dI" % n, *bits)
        else:
            bits = [to_bf16(rnd.gauss(0, 0.011)) for _ in range(n)]
            if name.endswith("dt_bias"):
                for _ in range(2):
                    bits[rnd.randrange(n)] = to_bf16(rnd.choice([-0.5, 0.0, 1.5, 255.5, 1e-39, 3.0e38, -2.25]))
            for _ in range(max(1, n // 50)):
                bits[rnd.randrange(n)] = rnd.choice([0x0000, 0x8000, to_bf16(rnd.uniform(-0.6, 0.6))])
            if name == PRE + "7.self_attn.o_proj.weight":  # more than half zeros: the median is 0
                for i in range(0, n, 3):
                    bits[i] = bits[(i + 1) % n] = rnd.choice([0x0000, 0x8000])
            if name == PRE + "11.self_attn.o_proj.weight":  # every value negative
                bits = [(b | 0x8000) if b & 0x7FFF else 0xBC00 for b in bits]
            raw = struct.pack("<%dH" % n, *bits)
        shards.setdefault(wm[name], []).append((name, dtype, shape, raw))
        values[name] = (dtype, shape, bits)
    files = {}
    for file in sorted(shards):
        items = sorted(shards[file], key=lambda t: (-len(t[3]) // max(1, len(t[3])) * {"F32": 4, "BF16": 2}[t[1]], t[0]))
        header, off, blobs = {"__metadata__": {"format": "pt"}}, 0, []
        for name, dtype, shape, raw in items:
            header[name] = {"dtype": dtype, "shape": shape, "data_offsets": [off, off + len(raw)]}
            off += len(raw)
            blobs.append(raw)
        hb = json.dumps(header, separators=(",", ":")).encode("utf-8")
        hb += b" " * ((8 - len(hb) % 8) % 8)
        data = struct.pack("<Q", len(hb)) + hb + b"".join(blobs)
        open(os.path.join(out, file), "wb").write(data)
        files[file] = data
    cfg_b = (json.dumps(cfg, indent=2) + "\n").encode("utf-8")
    idx_b = (json.dumps(index, indent=2) + "\n").encode("utf-8")
    open(os.path.join(out, "config.json"), "wb").write(cfg_b)
    open(os.path.join(out, "model.safetensors.index.json"), "wb").write(idx_b)
    blob = lambda b: hashlib.sha1(b"blob %d\0" % len(b) + b).hexdigest()
    sha = lambda b: hashlib.sha256(b).hexdigest()
    commit = "f" * 39 + "1"
    commits = [commit, "e" * 39 + "2", "d" * 39 + "3"]  # the last one holds no shard
    real = json.load(open(os.path.join(ROOT, "corpus", "qwen-self-rewriting", "PINS.json")))
    pins = {"fixture": True, "what": "a synthetic checkpoint for the dry run; not the model", "rules": real["rules"], "paper": real["paper"],
            "model": {"repo": "Qwen/Qwen3.5-27B", "commit": commit, "base_url": "http://127.0.0.1:%d" % port, "never_read": "main",
                      "files_whole": [{"file": "config.json", "bytes": len(cfg_b), "sha256_of_fetched_copy": sha(cfg_b), "git_blob": blob(cfg_b)},
                                      {"file": "model.safetensors.index.json", "bytes": len(idx_b), "sha256_of_fetched_copy": sha(idx_b), "git_blob": blob(idx_b)}],
                      "shards": [{"file": f, "bytes": len(files[f]), "lfs_sha256": sha(files[f]), "git_blob": blob(b"pointer " + f.encode())} for f in sorted(files)],
                      "shards_total_bytes": sum(len(b) for b in files.values()), "hashed_whole": [sorted(files)[-1]],
                      "commits": {"ids": commits}},
            "requests": {"user_agent": "curl/8.7.1", "anonymous": True, "one_at_a_time": True, "retries_per_range": 5, "pause_seconds": 0.05}}
    json.dump(pins, open(os.path.join(out, "PINS-fixture.json"), "w"), indent=1)
    json.dump({"commit": commit, "commits": commits, "no_shards_at": [commits[2]], "repo": "Qwen/Qwen3.5-27B",
               "small": {"config.json": blob(cfg_b), "model.safetensors.index.json": blob(idx_b)},
               "lfs": {f: {"sha256": sha(files[f]), "size": len(files[f])} for f in files}}, open(os.path.join(out, "hub.json"), "w"), indent=1)
    # ---- the answer key, by brute force
    key = {}
    dt, shape, bits = values[PRE + "30.mlp.down_proj.weight"]
    xs = [bf16_value(b) for b in bits]
    n = len(xs)
    mean = sum(xs) / n
    key["W1_variance_dividing_by_n"] = "%d/%d" % ((sum((x - mean) ** 2 for x in xs) / n).numerator, (sum((x - mean) ** 2 for x in xs) / n).denominator)
    c = shape[1]
    for label, first in (("rows_counted_from_0", 3068), ("rows_counted_from_1", 3067)):
        r = xs[first * c:(first + 8) * c]
        q = sum(x * x for x in r)
        key["W2_sum_of_squares_" + label] = "%d/%d" % (q.numerator, q.denominator)
        m = max(abs(x) for x in r)
        key["W3_largest_abs_" + label] = "%d/%d" % (m.numerator, m.denominator)
    srt = sorted(abs(x) for x in xs)
    med = srt[(n - 1) // 2]
    key["W5_base_median_lower_middle"] = "%d/%d" % (med.numerator, med.denominator)
    best, who = None, None
    for name in sorted(values):
        if not name.startswith(PRE) or name == PRE + "30.mlp.down_proj.weight":
            continue
        if not (name.endswith("mlp.down_proj.weight") or name.endswith("linear_attn.out_proj.weight") or name.endswith("self_attn.o_proj.weight")):
            continue
        a = sorted(abs(bf16_value(b)) for b in values[name][2])
        md = a[(len(a) - 1) // 2]
        ratio = a[-1] / md if md > 0 else Fraction(0)
        if best is None or ratio > best:
            best, who = ratio, name
    key["W4_M_abs_over_lower"] = "%d/%d" % (best.numerator, best.denominator)
    key["W4_attained_by"] = who
    ha, hb2, differ, total = hashlib.sha256(), hashlib.sha256(), 0, 0
    names = sorted((n_ for n_ in values if n_.endswith("linear_attn.dt_bias")), key=lambda s: int(s[len(PRE):].split(".")[0]))
    for name in names:
        dt, shape, bits = values[name]
        val = f32_value if dt == "F32" else bf16_value
        ya = [nearest(val(b) + Fraction(1, 2), dt) for b in bits]
        yb = [nearest(val(b) + Fraction(1, 2), "BF16") for b in bits]
        ha.update(struct.pack("<%d%s" % (len(ya), "I" if dt == "F32" else "H"), *ya))
        hb2.update(struct.pack("<%dH" % len(yb), *yb))
        total += len(bits)
        differ += sum(1 for p, q in zip(ya, yb) if val(p) != bf16_value(q))
    key["E4_edited_sha256_reading_a"] = ha.hexdigest()
    key["E4_edited_sha256_reading_b"] = hb2.hexdigest()
    key["E4_entries_where_a_and_b_differ"] = differ
    key["E2_entries"] = total
    json.dump(key, open(os.path.join(out, "answer-key.json"), "w"), indent=1)
    print("fixture: %d shards, %d bytes, time-step bias in %s" % (len(files), sum(len(b) for b in files.values()), bias_dtype))


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]), sys.argv[3] if len(sys.argv) > 3 else "f32")
