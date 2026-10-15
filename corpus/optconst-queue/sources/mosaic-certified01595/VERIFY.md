# Verifying Λ < 319/2000

Run the commands below from this directory on a fresh Ubuntu 24.04 x86_64 machine or container, as root. Nothing needs
the network once the packages are installed.

## Environment

The official evaluation used Python 3.12.3, python-flint 0.9.0, sympy 1.12 and mpmath 1.2.1 (sympy and mpmath are
Ubuntu 24.04's own packages).

```sh
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq --no-install-recommends python3 python3-pip python3-sympy python3-mpmath
python3 -m pip install --quiet --break-system-packages python-flint==0.9.0
```

## Reproduce

```sh
W=$(mktemp -d) && sha256sum -c --quiet MANIFEST.sha256 && echo "MANIFEST.sha256: all $(wc -l < MANIFEST.sha256) files OK" && python3 verify/record_score.py --candidate assembly_ce_319_2000 --out "$W/score.json" --timeout 1500 && python3 -c 'import json, sys; m = json.load(open(sys.argv[1]))["metrics"]; print({k: m[k] for k in ("lambda_upper_exact", "criterion_ok", "anchor_ok", "rh_ok", "script_ok", "record_lines_ok", "lint_ok", "frozen_ok", "coverage_ok", "torus_ok", "conditional", "confine_violations", "checks_run", "cover_boxes")})' "$W/score.json" && cmp "$W/verify_stdout.txt" assembly_ce_319_2000/clean_copy1.log && echo "verify stdout: byte-identical to the banked clean_copy1.log"
```

Expected output:

```text
MANIFEST.sha256: all 101 files OK
{"ok": true, "score": 0.1595, "error": null}
{'lambda_upper_exact': '319/2000', 'criterion_ok': 1, 'anchor_ok': 1, 'rh_ok': 1, 'script_ok': 1, 'record_lines_ok': 1, 'lint_ok': 1, 'frozen_ok': 1, 'coverage_ok': 1, 'torus_ok': 1, 'conditional': 0, 'confine_violations': 0, 'checks_run': 168846, 'cover_boxes': 2}
verify stdout: byte-identical to the banked clean_copy1.log
```

The scorer reports `"score": 0.1595` only when every gate passes; any failed gate gives 1.0. The verify script's output,
`$W/verify_stdout.txt` (2,421 bytes, sha256 `263cfb4ee002937f91190b5f9f7216244c500879e1fc61c4a494030d3d36ef86`), prints
exactly two `COVER` lines and the five `RECORD_*` lines, ending with `RECORD_LAMBDA_UPPER = 319/2000` … `RECORD_X =
6000000185827`, `TOTAL CHECKS RUN: 168846` and `RESULT: ALL PASS`. On macOS, check the manifest with
`shasum -a 256 -c MANIFEST.sha256`.

**Runtime.** Measured before publication on a fresh 6-vCPU cloud machine (ubuntu:24.04): the scorer takes about 3 s and
the package install about 11 s.

## What the scorer does

`record_score.py` is the swarm's official scorer, unmodified. It first checks the 82 hashes in `FROZEN.sha256`. It then
copies the package to `$W/pkg` without `RECORD.json` and `MANIFEST.json`, so the verify script must derive everything it
prints, and runs `verify.py` there under `verify/confine.py`: a PEP 578 audit hook that refuses file access outside the
package and the interpreter's libraries, network sockets, and any subprocess other than the same interpreter (it guards
against outside reads, it is not a security sandbox; its only other allowed reads are a few fixed device and `/proc/self`
paths and the original campaign's archive directory, which this package never reads). Finally it checks, in exact rational
arithmetic, that the printed `RECORD_*` lines equal `RECORD.json` and that the two printed `COVER` boxes cover t in
[319/2000, 3/16] and x in [0, ∞) exactly.

`record_score.py` runs the verify script with `/usr/bin/python3` whenever that interpreter can import sympy and mpmath,
and otherwise with the interpreter running `record_score.py`; the receipt's `metrics.python` names it. `RECORD.json` has
no `torus_certs`, so the torus gate passes vacuously and its checker is not needed.

## Optional checks

The package's content address equals its candidate id:

```sh
python3 -c 'import hashlib, json, pathlib; r = pathlib.Path("assembly_ce_319_2000"); f = {str(p.relative_to(r)): hashlib.sha256(p.read_bytes()).hexdigest() for p in r.rglob("*") if p.is_file() and str(p.relative_to(r)) != "MANIFEST.json"}; m = json.loads((r / "MANIFEST.json").read_text()); print(m["candidate_id"], hashlib.sha256(json.dumps(f, sort_keys=True).encode()).hexdigest()[:12], f == m["files"])'
```

Expected: `7a28f197eb13 7a28f197eb13 True`.

The generated outputs come from source alone. This scores a copy holding only the 85 source inputs (`FROZEN.sha256`,
`SOURCES.sha256` and the files they list) plus `RECORD.json`, then compares the 7 regenerated products with the hashes
recorded in `CLEAN_COPIES.json`:

```sh
W=$(mktemp -d) && python3 -c 'import pathlib, shutil, sys; s = pathlib.Path("assembly_ce_319_2000"); d = pathlib.Path(sys.argv[1]) / "pkg"; n = {"FROZEN.sha256", "SOURCES.sha256"} | {l.split(None, 1)[1].strip() for m in ("FROZEN.sha256", "SOURCES.sha256") for l in (s / m).read_text().splitlines() if l.strip() and not l.startswith("#")}; [((d / f).parent.mkdir(parents=True, exist_ok=True), shutil.copyfile(s / f, d / f)) for f in sorted(n) + ["RECORD.json"]]; print(len(n), "source inputs + RECORD.json")' "$W" && mkdir -p "$W/out" && python3 verify/record_score.py --candidate "$W/pkg" --out "$W/out/score.json" --timeout 1500 && python3 -c 'import hashlib, json, pathlib, sys; w = json.loads(pathlib.Path("assembly_ce_319_2000/CLEAN_COPIES.json").read_text())["copies"][0]["products"]; o = pathlib.Path(sys.argv[1]); print(sum((o / f).is_file() and hashlib.sha256((o / f).read_bytes()).hexdigest() == h for f, h in w.items()), "of", len(w), "products match CLEAN_COPIES.json")' "$W/out/pkg" && cmp "$W/out/verify_stdout.txt" assembly_ce_319_2000/clean_copy1.log && echo "source-only verify stdout: byte-identical"
```

Expected: `85 source inputs + RECORD.json`, `{"ok": true, "score": 0.1595, "error": null}`,
`7 of 7 products match CLEAN_COPIES.json` and `source-only verify stdout: byte-identical`.
