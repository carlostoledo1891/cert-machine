# REPRODUCE.md — reproducing every headline claim from a fresh clone

This file is the cold-start recipe for a stranger. It was written by following it literally in a
throwaway `git clone` of this repository (file protocol, i.e. exactly the committed state), on
Ubuntu 22.04 with a 16-thread CPU, 16 GB RAM and an RTX 3070 Laptop (8 GB). Every command below was
executed there; the `RESULT` lines it produced are in the appendix and in
`runs/repro/green_run.log`. Cold-following the *previous* committed state turned up six things a
stranger could not do; those are fixed, and the fixes (`.gitattributes`, `data/plateau_atoms_496.json`,
`python/tools/check_clique_g.py`, `python/tools/plateau_isometry_closure.py`, fallback paths in
`materialize_64.py` / `plateau_equivalence.py` / `structure_t4.py`, one pytest skip guard) are part
of the same change as this file.

The authoritative list of what is being claimed is the summary paper `docs/handover/findings.pdf` §1.3. This file says
how to re-check each row, what it costs, and — in §6 — which rows a clone **cannot** re-check
without a long recompute, and why.

---

## 1. Prerequisites

| | |
|---|---|
| OS | Linux (developed on Ubuntu 22.04) or Windows 11. macOS is not tested (and has no CUDA). On Windows read §1.1 below first, then read every command in this file as its PowerShell equivalent. |
| Compiler | g++ ≥ 11 with OpenMP; CMake ≥ 3.25; Ninja |
| CUDA | **Only for the GPU section.** CUDA toolkit 12.8 at `/usr/local/cuda-12.8` on Linux, or 13.4 under `C:/Program Files/NVIDIA GPU Computing Toolkit` on Windows (both paths are pinned in `CMakePresets.json`), plus a driver new enough for it (tested: 580.119.02 and 610.88). `CMAKE_CUDA_ARCHITECTURES` is pinned to `86` — change it in `CMakePresets.json` for a non-Ampere card. |
| Python | `python3` ≥ 3.10 and `virtualenv` (`pip install --user virtualenv`, or `apt install python3-venv`). `scripts/setup_venv.sh` tries `venv`, then `virtualenv`, then `venv --without-pip` + a bootstrapped pip, and needs one of them to work. |
| Disk | ~8 GB free: 3.6 GB for `data/adj.u32`, ~1 GB build tree, ~0.5 GB venv, plus run artefacts. |
| RAM | 16 GB is enough for everything in this file. (The *four-point* SDP of `docs/handover/findings.pdf` §2.6 is priced at 64–128 GB and is deliberately not run — only its orbit scoping is.) |
| VRAM | ≥ 6 GB free for the GPU tests; they skip gracefully (exit 77) below that. |

**A git gotcha that will bite you first.** If your git has `core.autocrlf=true` (the Windows/WSL
default, and it can be set globally on Linux too), a clone checks every file out with CRLF line
endings. Then `scripts/setup_venv.sh` dies with `set: pipefail: invalid option name` and every
committed `sha256` in the reports and certificates is wrong. The committed `.gitattributes` (`* -text`)
prevents this. Verify after cloning:

```bash
file scripts/setup_venv.sh      # must NOT say "with CRLF line terminators"
```

If it does, your clone predates `.gitattributes`; fix with
`git config core.autocrlf false && git rm --cached -r . -q && git reset --hard`.

### 1.1 Windows

Verified on the machine B envelope of `docs/design.md` §1.B: Windows 11 Pro, VS 2022 Community
(MSVC 14.38 + Windows SDK 10.0.22621), CUDA 13.4, CMake 4.4.3, Ninja 1.13.2, RTX 3080 Ti. Three
differences from the Linux recipe; everything else is the same command in Windows spelling.

**1. Put the toolchain on `PATH` first.** The Ninja generator cannot find `cl.exe` by itself, and
the CUDA/CMake installers only edit the machine `PATH`, which an already-open console does not see.
Source the helper once per shell — note the leading dot:

```powershell
. scripts\dev_shell.ps1
# dev_shell: MSVC from C:\Program Files\Microsoft Visual Studio\2022\Community
# dev_shell: nvcc 13.4 at C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.4\bin\nvcc.exe
# dev_shell: GPU NVIDIA GeForce RTX 3080 Ti, 12288 MiB, 8.6
```

**2. Use the `windows-*` presets and the PowerShell scripts.** The `release`/`debug`/`sanitize`
presets pin the Linux CUDA path and carry a `condition` restricting them to Linux hosts, so they
are not offered here. CMake **≥ 3.30** is required on MSVC (for `OpenMP_RUNTIME_MSVC`).

| Linux | Windows |
|---|---|
| `scripts/setup_venv.sh` | `powershell -ExecutionPolicy Bypass -File scripts\setup_venv.ps1` |
| `.venv/bin/python` | `.venv\Scripts\python.exe` |
| `cmake --preset release` | `cmake --preset windows-release` |
| `cmake --build build/release -j "$(nproc)"` | `cmake --build build/windows-release` |
| `ctest --preset release` | `ctest --preset windows-release` |
| `build/release/tools/gen_leech data/` | `build\windows-release\tools\gen_leech.exe data\` |
| `PYTHONPATH=python .venv/bin/python X` | `$env:PYTHONPATH='python'; .venv\Scripts\python.exe X` |

**3. One optional dependency is skipped.** `pynauty` has no Windows wheel and its sdist builds
nauty with `make`. It lives in `python/requirements-optional.txt`, which nothing installs by default; it is imported
lazily by one function in `python/tools/channel_opt.py` and by no verifier, bound or test.

Measured here: 16 tools + 19 tests build in ~3 min; `ctest --preset windows-release` is 19/19 in
389 s (machine A: 586 s); `gen_leech` and `build_adj` reproduce `sha256_i8=aea59406…` and
`adj.u32 sha256=83dd4d9b…` exactly — the committed digests are platform-independent.
`pytest python/tests` is 294 passed / 1 skipped in 148 s, the same counts as machine A.

The build is **not** `-Werror` on MSVC (`KISS_WERROR` defaults to `OFF` there): `/W4` flags a
different and larger set than `-Wall -Wextra`, mostly narrowing conversions inside the STL. Pass
`-DKISS_WERROR=ON` to make them fatal.

---

## 2. CPU-only, ~25 min idle (~38 min measured here, under load)

This is the whole certificate chain: the K(27) record, the 837 upper bound, the two-point collapse
to 9360/11, ω(G) = 24, the clique cuts, the 64-set family, the A4/A4b structure and the Turyn-slice
model. No GPU is touched.

Run everything from the repo root.

```bash
# 0.  clone and check line endings                                        [~5 s]
git clone <repo> kissing && cd kissing
file scripts/setup_venv.sh                     # must not say CRLF

# 1.  python environment                                                 [~30 s]
scripts/setup_venv.sh
# RESULT ok=1 venv=<repo>/.venv

# 2.  C++/CUDA build                                                [~45 s – 6 min]
cmake --preset release
cmake --build build/release -j "$(nproc)"
# 93 targets, no warnings (the build is -Werror)

# 3.  regenerate the two binary fixtures                             [~1 s + ~15 s]
build/release/tools/gen_leech data/
# RESULT ok=1 n=196560 ... sha256_i8=aea59406d9129ec635ab03c6221e7ac7c308bf860205c57f1d931aa8ddb1c111
build/release/tools/build_adj data/
# RESULT ok=1 rows=196560 deg=4600 bytes=3616704000 sha256=83dd4d9b...
(cd data && sha256sum -c adj.sha256 && sha256sum -c checksums.sha256)
# adj.u32: OK   (NOTE the subshell: adj.sha256 names the file relatively,
#                so `sha256sum -c data/adj.sha256` from the root FAILS to open it)

# 4.  K(27) >= 200540                                              [~3 s + ~60 s]
.venv/bin/python docs/note/data/verify.py
# RESULT ok=1 dim=27 sets=4 weight=8 count=200540
.venv/bin/python python/verify_dimN.py data/families/dim27_improved --strict
# RESULT ok=1 dim=27 d=3 sets=4 count=200540 count_exact=200540 count_float=200540 ...

# 5.  |S| <= 837, three-point SDP certificate                            [~11 s]
PYTHONPATH=python .venv/bin/python -c \
  "from bounds.sdp3_scheme import verify_certificate as v; print(v('data/scheme/sdp3_certificate.json'))"
# {... 'bound_floor': 837, 'D': 148, 'vars': 43, 'matches_stored': True}

# 6.  clique cuts are inert                                              [~12 s]
PYTHONPATH=python .venv/bin/python -c \
  "from bounds.sdp3_cliques import verify_cuts_certificate as v; print(v('data/scheme/sdp3_cliques_certificate.json'))"
# {... 'bound_floor': 837, 'cuts': 225, 'matches_stored': True}

# 7.  every two-point method = 9360/11                              [~6 + 3 + 1 s]
PYTHONPATH=python .venv/bin/python python/bounds/lp_scheme.py
# RESULT bound_exact=9360/11 bound_floor=850 ...
PYTHONPATH=python .venv/bin/python python/bounds/theta_prime.py
# RESULT hoffman=9360/11 theta_sym=9360/11 theta_prime=9360/11 lp=9360/11 all_equal=1
PYTHONPATH=python .venv/bin/python python/bounds/lp_delsarte.py
# RESULT bound_restricted=850 bound_all_leech=196560 bound_nonpos=48

# 8.  omega(G) = 24 and the maximal-clique census                       [~0.3 s]
.venv/bin/python python/tools/check_clique_g.py
# RESULT ok=1 omega=24 clique_gram=16(I+J) rank=24
#        maximal_sizes=8,12,15,17,23,24 census_total=5028032232 census_complete=1

# 9.  four-point scoping (orbit dimensions only, no SDP)                 [~22 s]
PYTHONPATH=python .venv/bin/python -m bounds.sdp4_scoping
# RESULT ok=1 dimT=148,1893,2972,4107,2972,1893,148 max_block=4107

# 10. the record set, and swap-optimality to k = 12                 [~0.3 s + 64 s]
.venv/bin/python python/verify_S.py data/S496.txt
# RESULT ok=1 size=496 antipodal=1 max_offdiag=8 ...
build/release/tools/swapsearch data/S496.txt --kmax 12 --time-limit 600
# RESULT ok=1 size=496 improving=0 kmax_exhaustive=12 plateau_moves=4 free=0 min_tight=4

# 11. the 64 certified plateau sets                              [~35 s + ~95 s]
.venv/bin/python python/tools/materialize_64.py --out /tmp/S496_family_regen
diff -r /tmp/S496_family_regen data/S496_family && echo "regenerated byte-identically"
.venv/bin/python python/tools/check_64.py data/S496_family
# RESULT ok=1 files=64 pass=64 fail=0 free_total=0 min_tight=4 distinct_hists=5

# 12. A4 structure of the record (Turyn frame, 15 channels, 496 = 4*124)  [~58 s]
.venv/bin/python python/tools/structure_496.py
# RESULT section=A4 ok=1
# (self-heals: regenerates runs/orbits/stab496/ via stabilizer_496.py if absent,
#  and writes runs/a4/channel_table.json, which step 13 reads)

# 13. A4b — the plateau moves are channel rewirings                       [~13 s]
.venv/bin/python python/tools/structure_t4.py
# RESULT section=A4b ok=1

# 14. Turyn-slice model + the proved sub-facts                    [~10 + 1 + 2 s]
.venv/bin/python python/tools/channel_opt.py build
# RESULT section=build orbits=3240 edges=456480 ref=496 ok=1
.venv/bin/python python/tools/channel_opt.py structure
# RESULT section=structure factorisation=verified ok=1
.venv/bin/python python/tools/channel_opt.py monadkill
# RESULT section=monadkill u=[14,26,36,44,50,54,56,56] statuses=8x OPTIMAL
.venv/bin/python python/tools/channel_opt.py combine
# RESULT section=combine status=OPTIMAL profile_incumbent=720 certified_bound=720.0 ingredients=4
# ORDER MATTERS: `combine` picks up the block-kill ingredient only if
# runs/a2/monadkill.json already exists (and `monadkill` needs `structure`,
# which needs `build`).  Run `combine` on its own in a fresh clone and you get
# 768 with 3 ingredients, not 720.

# 15. the K(25..31) families                              [~60 s each, ~8 min total]
for d in data/families/dim2[6-9] data/families/dim3[01]; do
  .venv/bin/python python/verify_dimN.py "$d" --strict
done
```

**The Turyn-slice claim `496 <= opt <= 720` is fully covered by this section.** The lower end is
step 10's `verify_S.py` plus step 12's `S has 124 independent orbits`, both exact; the upper end is
step 14's `combine`. See §6 for what the 720 rests on.

## 3. Test suites

```bash
ctest --preset release                                     # 586 s here; 19 tests
PYTHONPATH=python .venv/bin/python -m pytest python/tests -q   # 302 s here; 295 tests
```

* `ctest`: 8 tests carry the `gpu` label and exit 77 → **Skipped** when there is no CUDA device,
  no `data/adj.u32`, or **less than 5.5 GB of free VRAM**. That last one is the trap: with
  `ctest -j4` two GPU tests run at once on an 8 GB card and one of them skips itself. Run `ctest`
  **serially** (the default) if you want all 19 to execute. Measured here — serial: 19/19 pass, 0
  skipped; `-j4`: 17 pass and `test_ls_search`/`test_gpu_mis` self-skip on VRAM (both pass when run
  on their own). Without a CUDA device the 8 `gpu`-labelled tests should skip the same way and
  `ctest` still exits 0; that case was not exercised here (the box has a GPU).
* `pytest`: 294 pass, 1 skipped. The skip is `test_kkw_family_is_disjoint_and_independent`, which
  needs `data/external/Kissing-Numbers/` — a verbatim upstream clone that is gitignored. Re-create
  it from the commit hashes in `data/external/SOURCES.md` (committed) and the test runs.

## 4. GPU required

```bash
# G1. the GPU stack itself (3 min soak; also the cheapest reproduction of the
#     "each Co0 seed's plateau has exactly 64 distinct 496s" fact)
build/release/tests/test_gpu_mis
# RESULT ok=1 run=test_soak best=496 ... records=0 verify_fail=0 distinct=64

# G2. the full census claim of `docs/handover/findings.pdf` §1.3 (distinct = 4160 = 65*64,
#     nothing >= 497 in 242 M iterations) — the original logs are gitignored;
#     re-running is two 30-minute production runs. See docs/runbook_gpu_mis.md.
```

Nothing in the certificate chain of §2 needs a GPU. The GPU claims are all *search evidence*
(negative results), which is why they are quarantined here.

## 5. Long-running (hours)

| Claim (briefing row) | Command | Cost |
|---|---|---|
| T3.4b: the 64 are pairwise Co₀-inequivalent | `.venv/bin/python python/tools/plateau_equivalence.py --out runs/plateau_equiv --jobs 12 --stab 15,16,48` | ~45 min |
| T3.4b: …and fall into 8 isometry classes of 8 | then `.venv/bin/python python/tools/plateau_isometry_closure.py --jobs 12` | ~4 min idle (measured here: 785 s at `--jobs 4` under load). Needs the full run's `results.json`. Verified: `RESULT ok=1 iso_classes=8 tests=73` |
| T3.4b, stranger's short path | `.venv/bin/python python/tools/plateau_equivalence.py --quick --no-orbits --jobs 12` | ~13 min idle (measured here: 22 min at `--jobs 6` under load) — re-verifies the six atoms, the 11 sampled sets, the generators and all five positive controls, but does **not** enumerate the 64×64 pair classification. Verified: `RESULT ok=1 sets=11 equivalent_to_S=1 classes=11 iso_classes=10 aut_gram=64 stab=8` |
| Turyn slice: the g(k) profile-cap ledger | `channel_opt.py profilecaps --time 1200` | ~1–2 h CP-SAT. **Optional** — it does not change the 720 (see §6). Measured here at `--time 600`: `g = 15, 22, 27, 36, 40, …` with dual bounds `15, 30, 45, 60, 62, …`, reproducing the ledger of `docs/reports/A2.md` §214 |
| A2′ "≥ 8 perfect channels" | `channel_opt.py perfect --time 3600` | up to 1 h |
| Subgroup sweep (best non-Turyn cap 402) | `python/tools/m24_subgroups.py --out runs/orbits/subgroups` then `build/release/tools/orbit_mis --suite runs/orbits/table --subgroups-dir runs/orbits/subgroups --ls-seconds 10 --bb-seconds 30 --seed 1` | ~1 h (95 groups); exact command lines in `docs/reports/T3.4.md` §167 |
| ω(G) census from scratch | `build/release/tools/clique_g` | ~9 min |
| K(27) note certificate, all C(200540,2) pairs | `.venv/bin/python docs/note/data/verify.py --full` | minutes |

## 6. Trust levels, and what a clone cannot re-check

### Re-verifies exactly, from committed files, in seconds-to-minutes

These are the *exact-rational certificate* and *exact computation* rows of `docs/handover/findings.pdf`. A
stranger re-derives them end to end; nothing from a solver is trusted, and the numbers are
bit-identical to the ones in the reports:

K(27) ≥ 200540 · |S| ≤ 837 · clique cuts inert at 837 · all two-point methods = 9360/11 ·
ω(G) = 24 · the four-point orbit dimensions · swap-optimality to k = 12 · the 64 plateau sets
(byte-identical regeneration, then independent certification) · A4 · A4b · the Turyn-slice model
and its monad kill function · the K(25..31) families.

### Re-verifies, but only after a long recompute

* **T3.4b (the 64 are pairwise inequivalent, 8 isometry classes).** 45 + 4 min, deterministic and
  exact. The `--quick --no-orbits` pass (13 min) re-verifies the machinery and the positive
  controls but not the classification itself.
* **GPU census (row 10) and the subgroup sweep (row 11).** Both are *search evidence* whose logs
  live under the gitignored `runs/`. Regenerating is 1 hour of GPU / 1 hour of CPU respectively.
  Note that these are negative results: re-running gives you the same *kind* of evidence, not the
  same bits.

### Known gaps — things a clone genuinely cannot reproduce as stated

1. **`combine` is order-dependent, and the 720 is a CP-SAT verdict.** Run bare in a fresh clone,
   `channel_opt.py combine` returns **768** with 3 ingredients; it reaches 720 only once
   `runs/a2/monadkill.json` exists, because the block-kill cut is file-gated. `monadkill` is
   `OPTIMAL` in ~1 s, so §2 step 14 gets there reliably — but the ordering is a real trap and the
   briefing's one-line command hides it. The `profilecaps.json` g(k) cuts are *not* needed:
   `combine` discards any g(k) whose bound is not strictly below 15k, and at every budget tried
   here the dual bounds are exactly 15k (30, 45, 60) — they contribute nothing, which is precisely
   A2′'s "the witness-vs-LP gaps are invisible to every relaxation". The 720 therefore reproduces
   from committed files in ~12 s, but it remains *solver-trusted*: it is CP-SAT's OPTIMAL verdict
   on the profile ILP, with no independent certificate.
2. **The SAT fleet has produced nothing to check.** `docs/handover/findings.pdf`'s own footnote says so: no
   verdict, no DRAT proof, nothing in the repo carries a *DRAT-checked* label. The nine kissat
   instances live under `runs/a2/` and are not committed. Nothing here is affected — the footnote
   is already accurate — but a stranger should not go looking for a proof file.
3. **`data/external/`** (PackingStar and the Kallal–Kan–Wang 59-set family, 446 MB) is a gitignored
   upstream clone. `data/external/SOURCES.md` (committed) has the URLs, commit hashes and
   sha256s; the one pytest that needs it now skips instead of failing.
4. **GPU run dumps.** `structure_t4.py --census` (the 4160-census certification, briefing row 13's
   optional section) reads `runs/gpu_mis/*/sets/S_*.txt`. Without them, `structure_t4.py`'s default
   sections U0–U3, U5 all run and assert; only U4 is unavailable.
5. **`runs/a2/perfect.json`** (the "≥ 8 perfect channels, = 8 OPEN" row) is regenerable by
   `channel_opt.py perfect` but the underlying k = 9 instances time out UNKNOWN — as the briefing
   already states plainly. A clone reproduces the "≥ 8"; nobody has the "= 8".

### Timing note: real vs idle

The reference box was **not idle**: seven `kissat` processes were pinned at 99% on 7 of its 16
threads throughout, and the builds and runs below were `nice`d. Wall-clock times in this file are
those inflated numbers. On an idle machine expect roughly 1.5–2× faster for the CPU-parallel steps
(`pytest`, `ctest`, `verify_dimN`, `check_64`) and about the same for the single-threaded ones. The
one number that is *not* representative is the C++ build: `ccache` was warm, so `cmake --build`
took 45 s. A cold build is 4–6 minutes.

---

## 7. Appendix — green run log

`runs/repro/green_run.log` — 2026-08-31, 14:56:41 → 15:52:31 UTC, **56 minutes**, exit 0, no step
failed. It was produced by re-cloning the repo (`git clone file://…`, commit `b73230c`) and
overlaying the nine fix files listed at the top of the log, because those fixes were not yet
committed when the run was made; once they are committed the overlay step disappears and a plain
clone suffices. Load average at start: 20.8 (the kissat fleet). Every line below is verbatim.

```
##### 1. python environment #####
setup_venv: created …/repro-clone3/.venv with 'python3 -m virtualenv'
python 3.10.12 numpy 2.2.6 scipy 1.15.3 sympy 1.14.0 pytest 9.1.1
RESULT ok=1 venv=…/repro-clone3/.venv

##### 3. fixtures + checksums #####
RESULT ok=1 n=196560 shape_octad=97152 shape_31=98304 shape_44=1104 roundtrip=1
       sha256_i8=aea59406d9129ec635ab03c6221e7ac7c308bf860205c57f1d931aa8ddb1c111 dir=data/
RESULT ok=1 rows=196560 deg=4600 bytes=3616704000
       sha256=83dd4d9bc42c9373a9e15fc71ace1b4a52807d1707cf5917a9b8340a66bc14e1 total_s=49.8
adj.u32: OK        leech_min.i8: OK   neg.u32: OK   leech_packed.u32: OK   leech_min.txt: OK

##### 4. K(27) >= 200540 #####
RESULT ok=1 dim=27 sets=4 weight=8 count=200540
RESULT ok=1 dim=27 d=3 sets=4 count=200540 count_exact=200540 count_float=200540
       max_offdiag=2.000000000000 extra=12 K=12 s=182.5

##### 5. |S| <= 837 #####
{'bound': Fraction(1002749…, 1197262…), 'bound_floor': 837, 'D': 148, 'vars': 43,
 'forbidden_dots': [16], 'matches_stored': True}

##### 6. clique cuts inert #####
{'bound': Fraction(2005497…, 2394524…), 'bound_floor': 837, 'cuts': 225,
 'forbidden_dots': [16], 'matches_stored': True}

##### 7. two-point methods #####
RESULT bound_exact=9360/11 bound_floor=850 highs=850.909091 antipodal=9360/11
       antipodal_floor=850 forbid_16_8=48 none=196560 only_pm32=2
RESULT hoffman=9360/11 theta_sym=9360/11 theta_prime=9360/11 lp=9360/11
       hoffman_cert_ok=1 all_equal=1
RESULT bound_restricted=850 bound_all_leech=196560 bound_nonpos=48 grid_classical=skipped

##### 8. omega(G) = 24 #####
RESULT ok=1 omega=24 clique_gram=16(I+J) rank=24
       maximal_sizes=8,12,15,17,23,24 census_total=5028032232 census_complete=1

##### 9. four-point scoping #####
RESULT ok=1 dimT=148,1893,2972,4107,2972,1893,148 ordered=14133 admissible=6183
       vars_lo=258 max_block=4107 clique4=1

##### 10. the record set + swap-optimality #####
RESULT ok=1 size=496 antipodal=1 max_offdiag=8 gram=-32:248,-8:37504,0:47504,8:37504
RESULT ok=1 size=496 improving=0 new_size=496 kmax=12 kmax_exhaustive=12 plateau_moves=4
       plateau_connected=4 free=0 min_tight=4 unions=900672 antipodal=1 total_s=373.83

##### 11. the 64 certified plateau sets #####
RESULT ok=1 sets=64 free_total=0 min_tight_all=4 t123_total=0 fp_classes=5 sizes=16/16/16/8/8
regenerated byte-identically
RESULT ok=1 files=64 pass=64 fail=0 free_total=0 min_tight=4 distinct_hists=5

##### 12. A4 structure #####          RESULT section=A4  ok=1 seconds=123.7
##### 13. A4b channel rewirings #####  RESULT section=A4b ok=1 seconds=17.8

##### 14. Turyn-slice model #####
RESULT section=build     orbits=3240 edges=456480 ref=496 ok=1 seconds=9.4
RESULT section=structure factorisation=verified line_dot_hist={0: 22680, 32: 20160} ok=1
RESULT section=monadkill u=[14, 26, 36, 44, 50, 54, 56, 56] statuses=8 x OPTIMAL seconds=1.1
RESULT section=combine   status=OPTIMAL profile_incumbent=720 certified_bound=720.0
       ingredients=4 seconds=0.6

##### 15. the K(25..31) families #####
RESULT ok=1 dim=26 d=2 sets=2  count=198550 count_exact=198550 count_float=198550
RESULT ok=1 dim=27 d=3 sets=5  count=200044 count_exact=200044 count_float=200044
RESULT ok=1 dim=28 d=4 sets=8  count=204520 count_exact=204520 count_float=204520
RESULT ok=1 dim=29 d=5 sets=14 count=209496 count_exact=209496 count_float=209496
RESULT ok=1 dim=30 d=6 sets=24 count=220440 count_exact=220440 count_float=220440
RESULT ok=1 dim=31 d=7 sets=42 count=238350 count_exact=238350 count_float=238350

##### 16. ctest, serial #####
100% tests passed, 0 tests failed out of 19        Total Test time (real) = 586.10 sec

##### 17. pytest #####
294 passed, 1 skipped, 1 warning in 301.93s

##### 18. GPU: gpu_mis soak #####
RESULT ok=1 run=test_custody best=496 launches=3 iterations=3840 records=0 verify_fail=0
       found=1 distinct=24 bad_seeds=0 elapsed_s=12.0
RESULT ok=1 run=test_soak best=496 launches=491 iterations=12569600 records=0 verify_fail=0
       found=0 distinct=64 bad_seeds=0 elapsed_s=180.2
RESULT ok=1 failures=0 soak_minutes=3.00

##### green run finished 2026-08-31T15:52:31Z  FAILED=0 #####
```

Run separately (§5, not part of the 56-minute sequence), in the same clone, both green:

```
plateau_equivalence.py --quick --no-orbits --jobs 6      (22 min under load)
  RESULT ok=1 sets=11 equivalent_to_S=1 classes=11 iso_classes=10 aut_gram=64 stab=8

plateau_isometry_closure.py --jobs 4                     (785 s under load)
  observed classes: 18; cross-class tests with equal 1-WL invariant: 73
  ISOMETRY classes among the 64: 8; sizes [8, 8, 8, 8, 8, 8, 8, 8]
  RESULT ok=1 iso_classes=8 tests=73 seconds=785.4

channel_opt.py profilecaps --time 600                    (partial, interrupted)
  g(1) OPTIMAL best=15 bound=15.0     g(2) FEASIBLE best=22 bound=30.0
  g(3) FEASIBLE best=27 bound=45.0    g(4) FEASIBLE best=36 bound=60.0
  g(5) FEASIBLE best=40 bound=62.0    — reproduces the ledger of docs/reports/A2.md §214
```

---

## 6. Phase 2 additions (1 September 2026)

Four further headline claims, all CPU-only and independent of the build above. Timings are
from a clean tree with an emptied environment (`env -i`, six variables), Python 3.10.12.

```
export PYTHONPATH=$PWD/python

# 7.  |S| <= 837 re-checked from scratch, and the +-16 variant             [~10 s each]
.venv/bin/python tools/bounds/recheck_sdp3_certificate.py data/scheme/sdp3_certificate.json
# RESULT task1-verifierB file=sdp3_certificate.json forbidden_dots=[16] bound_floor=837 ok=1
.venv/bin/python tools/bounds/recheck_sdp3_certificate.py data/scheme/sdp3_certificate_pm16.json
# RESULT task1-verifierB file=sdp3_certificate_pm16.json forbidden_dots=[-16, 16] bound_floor=837 ok=1
#   Imports nothing from python/bounds and nothing from any solver; rebuilds the S_3 orbit
#   partition, the objective, Cy, both G families and both PSD blocks from orbitals.json.

# 8.  418 lines: the doubling lemma, on regenerated data                     [~60 s]
.venv/bin/python tools/bounds/verify_line_vector_reduction.py
# RESULT task1-verifierA ok=1 conclusion='a line set of size L doubles to a 2L-vector
#        60-degree-free set, so L <= floor(alpha_vec/2)'

# 9.  the second shell: |A(v) n A(w)| = 33, the higher bounds, the flavours
.venv/bin/python tools/leech/norm6_shell.py                    [9 s, peak 1.2 GiB, 384 MiB cache]
# RESULT norm6-shell total=16773120 expected=16773120 -> True
# RESULT norm6-shell ok=1
.venv/bin/python tools/leech/second_shell_intersections.py               [74 s, peak 1.2 GiB]
# RESULT thm mean = 33; variance = 0 -> |A(v) n A(w)| = 33 for EVERY pair: True
# RESULT second-shell-intersections ok=1
#   Run norm6_shell.py FIRST: the other two read its cache. Location is overridable with
#   LEECH_NORM48_CACHE. The build streams each shape into a memmap, so peak RSS is ~1.2 GiB.

# 10. the 24-cell, and R = the 15 channels                            [~4 s / ~7 min]
.venv/bin/python tools/leech/d4_triangle_partitions.py
# RESULT answer ok=1 answer=YES perfect_partitions=40 max_weight=16 prop5_bound=16
.venv/bin/python tools/structure/r_subspace_vs_channels.py
# RESULT task2a ok=1 verdict='R (Kravatskiy) == T (our 15 channels)'
.venv/bin/python tools/structure/arena_is_our_sublattice.py
# RESULT task6-A2-arena ok=1
#   r_subspace_vs_channels.py writes its JSON to $KISS_OUT (default: runs/).

# 11. the largest regular simplex of edge sqrt(6), and coset classes    [~5 min / ~10 min]
.venv/bin/python tools/leech/norm6_simplex.py
# RESULT dim28-upper-bound ... MAXIMUM = 24, ATTAINED: True
.venv/bin/python tools/coset/coset_sweep.py
# RESULT EXACT Delsarte bound on ANY forced coset class: 13405743/14959 (= 896.16)
#   The criterion <x-c, y-c> = rho - |x-y|^2/2 is centre-independent, so a class on a sphere
#   of radius^2 rho is forced exactly when rho <= 8/3; the sweep is then over centres.

# 12. the complete stars corroborating |A(v) n A(w)| = 33          [20 s, peak 1.3 GiB]
.venv/bin/python tools/leech/second_shell_stars.py
# RESULT pairs COMPLETE over 8 full stars = 2060800 ordered pairs: {33: 2060800}
```

See [`docs/reports/07-lines-vs-vectors.md`](docs/reports/07-lines-vs-vectors.md),
[`docs/reports/08-the-second-shell.md`](docs/reports/08-the-second-shell.md),
[`docs/reports/09-coset-classes.md`](docs/reports/09-coset-classes.md) and
[`docs/reports/KRAVATSKIY-OVERLAP.md`](docs/reports/KRAVATSKIY-OVERLAP.md) for what each
establishes.

---

## 8. Independent verification of Kravatskiy's configurations in dimensions 25–27 (September 2026)

A. Kravatskiy's public repository claims K(25) ≥ 197569, K(26) ≥ 199632 and K(27) ≥ 201010 and
ships its own verifiers. The four programmes in `tools/kravatskiy/` re-check those three
configurations from his coordinate data with code written here, sharing nothing with his: they
regenerate the 196,560 Leech minimal vectors from this repository's Golay code, recover every
head's owner by search instead of reading it from the data, and decide every inequality in exact
arithmetic (integers, and exact comparisons in ℚ(√2, √3) for the axis). Checked: every head
pair, every head against the whole equator, the equator itself, heads against the axis, the axis
against itself, distinctness of every point, and full ambient rank. CPU only; about 1.2 GiB of RAM.

```
git submodule update --init external/kravatskiy
AK=$(.venv/bin/python tools/kravatskiy/pinned.py 52fa09d)/verifications/improved
export PYTHONPATH=$PWD/python

# 13. his three configurations                                        [~20 s, ~80 s, ~80 s]
.venv/bin/python tools/kravatskiy/verify25_independent.py   $AK/dim25-lens-heads
# ALL CHECKS PASS      K(25) >= 197569   (independent, exact)
.venv/bin/python tools/kravatskiy/verify2627_independent.py $AK/dim26-27-iota-triangles 26
# ALL CHECKS PASS      K(26) >= 199632   (independent, exact)
.venv/bin/python tools/kravatskiy/verify2627_independent.py $AK/dim26-27-iota-triangles 27
# ALL CHECKS PASS      K(27) >= 201010   (independent, exact)

# 14. the verifiers reject eleven deliberately corrupted artefacts            [~12 min]
.venv/bin/python tools/kravatskiy/falsify.py $AK/dim25-lens-heads $AK/dim26-27-iota-triangles
# ALL FALSIFICATION TESTS PASS
```

### The two-layer configurations (his commit `c349d56`)

In September 2026 Kravatskiy added a second cap layer in dimensions 26 and 27: heads `(sqrt3/2)u`
at `|x|^2 = 3` on three lines through the holes of the first layer's directions, each deleting
exactly its owner. `verify2627_layers_independent.py` checks such a configuration, again from the
geometric description alone: it derives the bar `<Y,u> <= floor(32 sqrt3 - 32 c)` from the actual
lines and directions rather than quoting it, delegates the first layer to the verifier above, and
adds the second layer, the cross conditions and the combined count. `falsify_layers.py` feeds both
dimensions fourteen corrupted artefacts -- an owner too close to a first-layer head, two heads at
`<u,u'> = 16` on one line, an owner shared with the first layer, a duplicated owner, an owner of
norm 32 that is not a lattice vector, a line index out of range, a first-layer head moved to
another triangle -- and requires every one to be rejected.

```
AK2=$(.venv/bin/python tools/kravatskiy/pinned.py c349d56)/verifications/improved/dim26-27-iota-triangles

# 15. his two-layer configurations                                          [~80 s each]
.venv/bin/python tools/kravatskiy/verify2627_layers_independent.py $AK2 26 199806
# ALL CHECKS PASS      K(26) >= 199806   (independent, exact, two layers)
.venv/bin/python tools/kravatskiy/verify2627_layers_independent.py $AK2 27 201509
# ALL CHECKS PASS      K(27) >= 201509   (independent, exact, two layers)

# 16. the fourteen corrupted two-layer artefacts are all rejected                 [~4 min]
.venv/bin/python tools/kravatskiy/falsify_layers.py $AK2
# ALL LAYER FALSIFICATION TESTS PASS
```

`verify2627_independent.py` takes an optional third argument, the total to expect, for checking
other configurations stored in the same artefact format. `tools/kravatskiy/exact_cmp.py` holds the
exact surd comparisons. `tools/kravatskiy/interval_cert.py` is a general tool: it turns a Delsarte
dual solved on a grid into one certified on a whole interval by exact real-root counting (Sturm
sequences), so that a bound from `python/bounds/lp_delsarte.py` does not rest on the grid.

### His dimensions 28-31: the line-class construction with a norm-8 frame layer

In dimensions 28 to 31 the construction is a different shape: the unit is an owner *line*, not a
head. Writing L for the number of owner lines and k = n - 24,

    K(24+k) = 196560 - 2L + 2 sum_g |g| lines(g) + |axis| + 96k

where each owner line contributes its two vectors' caps and deletes both, and the frame layer
contributes 96k points while deleting nothing. A group is a set of cap directions pairwise at 120
degrees -- a zero-sum triple, so a line is worth 6 - 2 = 4, or (in dimension 29, twice) a pair, so
a line there is worth 4 - 2 = 2.

`verify2831_independent.py` checks such a configuration from the geometry: the Leech shell comes
from this repository's Golay code, every owner is looked up in it, and the R^k side -- where the
data lives in Q(sqrt2, sqrt3, sqrt6) -- is decided exactly in the ring of integer quadruples
(a + b sqrt2 + c sqrt3 + d sqrt6)/24, with no floating point anywhere. It checks the geometry it is
given (unit directions, the 120-degree groups, the axis a 60-degree code, the frame a Leech frame),
that every owner is type B for the frame, every cap pair, cap against axis and against the layer,
the layer against the equator, itself and the axis, distinctness, ambient rank, and the count.
His dimension-28 package ships no geometry file, so `geom28.py` builds it -- the 24 normalised D4
roots in 8 zero-sum triples, the 16 half-vectors of the dual 24-cell, the four coordinate
directions -- and the verifier calls it automatically.

```
AK2=$(.venv/bin/python tools/kravatskiy/pinned.py bfc2854)/verifications/improved

# 17. his four line-class claims                                       [~1 to 6 min each]
.venv/bin/python tools/kravatskiy/verify2831_independent.py $AK2/dim28-norm8-frame-layer   28 204896
.venv/bin/python tools/kravatskiy/verify2831_independent.py $AK2/dim29-30-frame-layer      29 209968
.venv/bin/python tools/kravatskiy/verify2831_independent.py $AK2/dim29-30-frame-layer      30 221012
.venv/bin/python tools/kravatskiy/verify2831_independent.py $AK2/dim31-frame-layer         31 238662
# each ends with  ALL CHECKS PASS      K(n) >= ...   (independent, exact)

# 18. eight corrupted line-class artefacts, all rejected                          [~3 min]
.venv/bin/python tools/kravatskiy/falsify2831.py $AK2/dim31-frame-layer 31 238662
# ALL 28-31 FALSIFICATION TESTS PASS
```

**The submodule, and pinned commits.** Kravatskiy's repository is the git submodule
`external/kravatskiy`. A plain `git pull` in this repository does **not** advance a submodule; to move
it to his current head run `scripts/update_kravatskiy.sh` (Windows: `scripts\update_kravatskiy.ps1`),
which is `git submodule update --remote external/kravatskiy` followed by a report of the old and new
commit and of any changed rows of his `RESULTS.md`. The verifications above do not depend on where the
submodule's head is: `tools/kravatskiy/pinned.py <commit>` makes a detached checkout of the requested
commit under `external/.pins/` (gitignored) from the submodule's own object store, and the claims are
checked there -- `52fa09d` for the three configurations above. The environment variable `KISS_ALEXEY`,
if set, overrides the location.
