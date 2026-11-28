#!/usr/bin/env python3
"""apply_edit.py: builds the edited checkpoint of Stage 3's arm B ON THE POD from the downloaded base shards and Stage 1's
specification of session 8's edit (+0.5 on the 48 linear-attention dt_bias tensors). Rules:
notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md, row P2. Python standard library only.

Steps (any failure stops arm B; nothing is written over the base directory):
  1. the specification's sha256 is the pinned one (Stage 1's, 2e2c3f76...c7c0);
  2. per tensor: the base bytes at [first_byte, last_byte] of shard 11 hash to the specification's sha256_base;
  3. y = x + 1/2 rounded once to bf16, to nearest, ties to even, computed here from the bit patterns (bf16 -> double is
     exact; the sum of a bf16 value and 1/2 is exact in a double for these magnitudes; the double is rounded to bf16 by
     integer arithmetic on its significand);
  4. per tensor the edited bytes hash to the specification's edited["a"] sha256, and the 48 in order to
     edited_sha256_all_tensors; only then is anything written;
  5. OUT gets a hard link (or a symlink) to every base file except shard 11, which is a fresh copy patched at the 48
     ranges; both shard-11 files are then streamed whole: every byte outside the ranges must be equal, every byte inside
     must be the edited one; the edited shard's sha256 is recorded.
usage: python3 apply_edit.py --spec SPEC.json --spec-sha SHA --base DIR --out DIR --record OUT.json
       python3 apply_edit.py --selftest --spec SPEC.json --base DIR   (controls K1 a flipped base byte, K2 +0.25: each
                                                                          must be refused; nothing is written)
MIT"""
import argparse
import hashlib
import json
import os
import shutil
import struct
import sys
import time

SHARD = "model.safetensors-00011-of-00011.safetensors"


def sha(b):
    return hashlib.sha256(b).hexdigest()


def sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 22), b""):
            h.update(b)
    return h.hexdigest()


def bf16_to_double(u):
    return struct.unpack("<f", struct.pack("<I", u << 16))[0]


def double_to_bf16(s):
    """round a finite double to bf16, to nearest, ties to even (normal results and zero only; else ValueError)"""
    bits = struct.unpack("<Q", struct.pack("<d", s))[0]
    sign, exp, mant = bits >> 63, (bits >> 52) & 0x7FF, bits & ((1 << 52) - 1)
    if exp == 0 and mant == 0:
        return sign << 15
    if exp == 0 or exp == 0x7FF:
        raise ValueError("subnormal or non-finite double")
    eb = exp - 1023 + 127
    full = (1 << 52) | mant
    q, r, half = full >> 45, full & ((1 << 45) - 1), 1 << 44
    if r > half or (r == half and (q & 1)):
        q += 1
    if q == 1 << 8:
        q >>= 1
        eb += 1
    if not 1 <= eb <= 254:
        raise ValueError("out of the normal bf16 range")
    return (sign << 15) | (eb << 7) | (q & 0x7F)


def edit_bytes(raw, constant):
    n = len(raw) // 2
    xs = struct.unpack("<%dH" % n, raw)
    ys = [double_to_bf16(bf16_to_double(x) + constant) for x in xs]
    return struct.pack("<%dH" % n, *ys)


def read_range(path, first, last):
    with open(path, "rb") as f:
        f.seek(first)
        b = f.read(last - first + 1)
    if len(b) != last - first + 1:
        raise SystemExit("REFUSED: short read")
    return b


def build(spec, base_shard, constant=0.5, flip=False):
    """the edited bytes per tensor, every hash checked; returns (patches, facts) or raises SystemExit"""
    patches, cat, facts = [], hashlib.sha256(), []
    for i, t in enumerate(spec["tensors"]):
        if t["shard"] != SHARD or t["dtype"] != "BF16" or t["last_byte"] - t["first_byte"] + 1 != 2 * t["entries"]:
            raise SystemExit("REFUSED: %s is not a BF16 tensor of %s with a matching range" % (t["name"], SHARD))
        raw = read_range(base_shard, t["first_byte"], t["last_byte"])
        if flip and i == 0:
            raw = bytes([raw[0] ^ 1]) + raw[1:]
        if sha(raw) != t["sha256_base"]:
            raise SystemExit("REFUSED: the base bytes of %s do not hash to the specification" % t["name"])
        y = edit_bytes(raw, constant)
        if sha(y) != t["edited"]["a"]["sha256"]:
            raise SystemExit("REFUSED: the edited bytes of %s do not hash to the specification" % t["name"])
        cat.update(y)
        same = sum(1 for k in range(0, len(raw), 2) if raw[k:k + 2] == y[k:k + 2])
        patches.append((t["first_byte"], y))
        facts.append({"name": t["name"], "first_byte": t["first_byte"], "last_byte": t["last_byte"],
                      "sha256_base": sha(raw), "sha256_edited": sha(y), "entries_unchanged": same})
    if cat.hexdigest() != spec["edited_sha256_all_tensors"]["a"]:
        raise SystemExit("REFUSED: the 48 edited tensors together do not hash to the specification")
    return patches, facts, cat.hexdigest()


def selftest(spec, base_shard):
    out = {}
    for name, kw in (("K1_flipped_base_byte", {"flip": True}), ("K2_constant_one_quarter", {"constant": 0.25})):
        try:
            build(spec, base_shard, **kw)
            out[name] = {"caught": False}
        except SystemExit as e:
            out[name] = {"caught": True, "refusal": str(e)}
    ok = {"caught": True}
    try:
        build(spec, base_shard)
    except SystemExit as e:
        ok = {"caught": False, "refusal": str(e)}
    out["clean_build_passes"] = not ok.get("refusal")
    out["all_caught"] = all(v["caught"] for k, v in out.items() if k.startswith("K")) and out["clean_build_passes"]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True)
    ap.add_argument("--spec-sha")
    ap.add_argument("--base", required=True)
    ap.add_argument("--out")
    ap.add_argument("--record")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    raw_spec = open(a.spec, "rb").read()
    spec = json.loads(raw_spec)
    base_shard = os.path.join(a.base, SHARD)
    if a.selftest:
        r = selftest(spec, base_shard)
        print(json.dumps(r, indent=1))
        sys.exit(0 if r["all_caught"] else 1)
    if not (a.spec_sha and a.out and a.record):
        sys.exit("--spec-sha, --out and --record are required")
    if sha(raw_spec) != a.spec_sha:
        raise SystemExit("REFUSED: the specification's sha256 is not the pinned one")
    t0 = time.time()
    patches, facts, cat = build(spec, base_shard)
    os.makedirs(a.out, exist_ok=True)
    links = {}
    for f in sorted(os.listdir(a.base)):
        src, dst = os.path.join(a.base, f), os.path.join(a.out, f)
        if f == SHARD or not os.path.isfile(src) or os.path.exists(dst):
            continue
        try:
            os.link(src, dst)
            links[f] = "hard link"
        except OSError:
            os.symlink(os.path.abspath(src), dst)
            links[f] = "symlink"
    tmp = os.path.join(a.out, SHARD + ".part")
    shutil.copyfile(base_shard, tmp)
    with open(tmp, "r+b") as f:
        for first, y in patches:
            f.seek(first)
            f.write(y)
        f.flush()
        os.fsync(f.fileno())
    # stream both files whole: equal outside the ranges, the edited bytes inside
    ranges = sorted((first, first + len(y), y) for first, y in patches)
    outside_diff, inside_bad, pos, j = 0, 0, 0, 0
    h = hashlib.sha256()
    with open(base_shard, "rb") as fb, open(tmp, "rb") as fe:
        while True:
            b, e = fb.read(1 << 22), fe.read(1 << 22)
            if not b and not e:
                break
            if len(b) != len(e):
                raise SystemExit("REFUSED: the two shard-11 files differ in length")
            h.update(e)
            end = pos + len(b)
            k = pos
            while k < end:
                while j < len(ranges) and ranges[j][1] <= k:
                    j += 1
                if j < len(ranges) and ranges[j][0] <= k:
                    stop = min(end, ranges[j][1])
                    want = ranges[j][2][k - ranges[j][0]:stop - ranges[j][0]]
                    inside_bad += want != e[k - pos:stop - pos]
                else:
                    stop = min(end, ranges[j][0]) if j < len(ranges) else end
                    outside_diff += b[k - pos:stop - pos] != e[k - pos:stop - pos]
                k = stop
            pos = end
    if outside_diff or inside_bad:
        raise SystemExit("REFUSED: the patched shard differs outside the 48 ranges (%d) or inside (%d)" % (outside_diff, inside_bad))
    os.rename(tmp, os.path.join(a.out, SHARD))
    rec = {"what": "arm B's edited checkpoint, built on the pod (apply_edit.py)", "spec_sha256": sha(raw_spec),
           "tensors": len(facts), "entries": sum(t["entries"] for t in spec["tensors"]),
           "entries_unchanged_by_rounding": sum(t["entries_unchanged"] for t in facts),
           "edited_sha256_all_tensors": cat, "equals_stage1_spec": cat == spec["edited_sha256_all_tensors"]["a"],
           "edited_shard": {"file": SHARD, "bytes": pos, "sha256": h.hexdigest()},
           "base_shard_sha256": sha_file(base_shard), "outside_ranges_equal": True, "links": links,
           "per_tensor": facts, "seconds": round(time.time() - t0, 1),
           "utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    with open(a.record, "w") as f:
        json.dump(rec, f, indent=1)
    print("EDIT-OK", cat, h.hexdigest())


if __name__ == "__main__":
    main()
