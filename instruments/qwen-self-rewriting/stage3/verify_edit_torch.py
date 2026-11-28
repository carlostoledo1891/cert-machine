#!/usr/bin/env python3
"""verify_edit_torch.py: the second reader of arm B's edited checkpoint, on the pod, through the library the engine
loads with (safetensors + torch), sharing no code with apply_edit.py. Row P2 of
notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md.

It opens shard 11 of the base and of the edited directory and checks, tensor by tensor:
  - the two files hold the same tensor names, dtypes and shapes;
  - exactly the 48 tensors named in the specification differ, and no other tensor differs in any entry;
  - for each of the 48: edited == (base.float() + 0.5).to(bfloat16) in every entry (float32 holds the sum exactly);
  - the realised differences edited - base: how many entries equal 1/2 exactly (Stage 1's E3 counted 2,177 of 2,304);
and that every other file of the two directories has identical bytes (sha256).
usage: python3 verify_edit_torch.py BASE_DIR EDITED_DIR SPEC.json OUT.json      (exit 0 iff every check passes)
MIT"""
import hashlib
import json
import os
import sys

import torch
from safetensors import safe_open

SHARD = "model.safetensors-00011-of-00011.safetensors"


def fsha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 22), b""):
            h.update(b)
    return h.hexdigest()


def main():
    base, edited, spec_path, out = sys.argv[1:5]
    spec = json.load(open(spec_path))
    targets = {t["name"] for t in spec["tensors"]}
    fb = safe_open(os.path.join(base, SHARD), framework="pt")
    fe = safe_open(os.path.join(edited, SHARD), framework="pt")
    nb, ne = set(fb.keys()), set(fe.keys())
    differ, bad, half, entries, meta_bad = [], [], 0, 0, []
    for name in sorted(nb | ne):
        if name not in nb or name not in ne:
            meta_bad.append(name)
            continue
        x, y = fb.get_tensor(name), fe.get_tensor(name)
        if x.dtype != y.dtype or tuple(x.shape) != tuple(y.shape):
            meta_bad.append(name)
            continue
        if not torch.equal(x.view(torch.int16) if x.dtype == torch.bfloat16 else x, y.view(torch.int16) if y.dtype == torch.bfloat16 else y):
            differ.append(name)
        if name in targets:
            want = (x.float() + 0.5).to(torch.bfloat16)
            if not torch.equal(want.view(torch.int16), y.view(torch.int16)):
                bad.append(name)
            d = y.float() - x.float()
            half += int((d == 0.5).sum())
            entries += d.numel()
    files = {}
    for f in sorted(set(os.listdir(base)) | set(os.listdir(edited))):
        if f == SHARD or f.endswith(".part"):
            continue
        pb, pe = os.path.join(base, f), os.path.join(edited, f)
        if os.path.isfile(pb) and os.path.isfile(pe):
            files[f] = "the same file (link)" if os.path.samefile(pb, pe) else fsha(pb) == fsha(pe)
        else:
            files[f] = False
    ok = (not meta_bad and sorted(differ) == sorted(targets) and not bad and all(v is not False for v in files.values()))
    rec = {"tensors_in_shard": len(nb), "names_dtypes_shapes_equal": not meta_bad, "mismatched_meta": meta_bad,
           "tensors_that_differ": len(differ), "differ_exactly_the_48": sorted(differ) == sorted(targets),
           "targets_not_bf16_of_x_plus_half": bad, "entries_of_the_48": entries, "entries_where_y_minus_x_is_one_half": half,
           "other_files_identical": files, "torch": torch.__version__, "passed": ok}
    json.dump(rec, open(out, "w"), indent=1)
    print("EDIT-SECOND-READER", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
