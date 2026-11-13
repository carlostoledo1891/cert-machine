#!/usr/bin/env python3
"""split.py SEALED.lean OUTDIR PREFIX — one small module per `def` of a sealed statement file.

Each module is: `import Mathlib` / `import Printed` (never `Printed1`: no definition of Planted1.lean uses a name
of Printed1.lean, and a definition must get its own verdict even if another file fails), the file's own
`namespace` and `open` lines, then the definition's bytes UNCHANGED (docstring + def), then `end`.
Lossless check: the pieces cut from the file, concatenated in order, are the file. Writes OUTDIR/PREFIX_NN_Name.lean
and OUTDIR/PREFIX.manifest (index, name, first line, last line, sha256 of the definition's bytes).
"""
import hashlib, os, re, sys

src, outdir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(src, encoding="utf-8").read()
lines = text.splitlines(keepends=True)
ns = next(l.split()[1] for l in lines if l.startswith("namespace "))
opens = [l for l in lines if l.startswith("open ")]
def_idx = [i for i, l in enumerate(lines) if re.match(r"def \w+", l)]
starts = []
for i in def_idx:
    j = i
    while not lines[j].startswith("/--"):
        j -= 1
    starts.append(j)
assert starts == sorted(set(starts)) and len(starts) == len(def_idx)
ends = []
for k, i in enumerate(def_idx):
    limit = starts[k + 1] if k + 1 < len(starts) else len(lines)
    e = i + 1
    while e < limit and not lines[e].startswith(("/-!", "/--", "end ")):
        e += 1
    while lines[e - 1].strip() == "":
        e -= 1
    ends.append(e)
pieces, pos = [], 0
for s, e in zip(starts, ends):
    pieces.append("".join(lines[pos:s])); pieces.append("".join(lines[s:e])); pos = e
pieces.append("".join(lines[pos:]))
assert "".join(pieces) == text, "split is not lossless"
os.makedirs(outdir, exist_ok=True)
man = []
for k, (s, e) in enumerate(zip(starts, ends), 1):
    name = re.match(r"def (\w+)", lines[def_idx[k - 1]]).group(1)
    body = "".join(lines[s:e])
    assert body.count("\ndef ") + body.startswith("def ") == 1
    mod = "import Mathlib\nimport Printed\n\nnamespace %s\n\n%s\n%s\nend %s\n" % (ns, "".join(opens), body, ns)
    fn = "%s_%02d_%s.lean" % (prefix, k, name)
    open(os.path.join(outdir, fn), "w", encoding="utf-8").write(mod)
    man.append("%02d\t%s\t%d\t%d\t%s\t%s" % (k, name, s + 1, e, hashlib.sha256(body.encode()).hexdigest(), fn))
open(os.path.join(outdir, prefix + ".manifest"), "w").write("\n".join(man) + "\n")
print("%s: %d definitions, namespace %s, lossless" % (src, len(man), ns))
