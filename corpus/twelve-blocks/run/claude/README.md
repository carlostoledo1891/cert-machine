# claude track: what is in this folder

Every script is standard-library Python 3 and is run from this folder with `python3 -B <name>`.
Scripts that read the staged certificates expect `../inherited/cert-machine/`; `core_alln.py` carries its own data.

| file | what it does | time |
|---|---|---|
| `lib.py` | M by bit masks and by the definition; flip costs by recounting triples through flipped sites | |
| `h3_cleanroom.py` | H3: the 253 coefficients at m = 1..8 with no formula; controls (28,34) = -3 etc. | 40 s |
| `h3_affine.py` | H3 for all m: every positive part and bracket symbolic in k (m = 2k + r), exact cutoff, zero slopes | 10 s |
| `h3_plants.py` | the brief's planted errors against my replay (two are missed by weak tests, as the brief predicts) | 2 s |
| `NOTES-window.md`, `window_check.py` | WINDOW replayed from my own derivation: closed forms against triples, 22-charge lattice problem, all points with 4D <= 0 | 1 min |
| `ties_odd_unit_scale.json` | the 51 odd-scale masks as site lists at m = 1 | |
| `d3model.py`, `d3check.py` | Python replay of the five delta-three certificates (first version, slow exact elimination) | 4 min |
| `global_check.py` | lattice side of GLOBAL: identity (2), R(B_m) = 0, bound (3) as a falsifier, bound (4), cutoffs | 2 min |
| `prune_build.py`, `prune_test.py` | the parity-aware marginal bound: maxima 257 / 263 (SHARP uses them) | 1 min |
| `prune_948.py` | the same with E >= mu^2/948: maxima 237 / 244, cutoffs even m >= 118, odd m >= 123 | 1 s |
| `NOTES-alln.md`, `core_alln.py` | ALLN: V(n) within a bounded error of 117n^2/2192 - n/2 at every n; proof and self-contained core | 11 s |
| `alln_body.py` | the core without its embedded data (the readable part) | |
| `alln_falsifiers.py` | 13 planted errors against the ALLN core; all caught | 15 s |
| `alln_anchors.json` | nine rounded colourings with their counts (ap3: CERTIFIED) | |
| `rounded_check.py` | ROUNDED replayed by direct counts, n = 1..3288 | 1 min |
| `t1_test.py`, `inner_probe.py`, `inner_P.pkl` | early probes (exact comparison D against n^2 E; eigenvalues of the inner residual, uses numpy) | |
| `ref_gpt_h3_core.py` | a byte copy of gpt/h3_core.py, imported once to compare its coefficients with mine | |
| `web/` | public files of cert-machine fetched before the control room staged them (same sha256 as inherited/) and OEIS A121385 | |
