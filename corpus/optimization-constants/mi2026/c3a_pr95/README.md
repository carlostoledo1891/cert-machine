# C_3a — Gyarmati–Hennecart–Ruzsa sum–difference constant: certified lower bound 1.1835129324...

Mosaic Intelligence — certified extremal-combinatorics record.

## Result

A capped base-33 digit-family construction with an exact-count certificate
certifies

    C_3a >= 1.1835129324218615106564747894020784326947   (40-digit floor)

improving the published record 1.1740744 ([G2026]) by +0.0094385..., and safely
below the proven upper bound 4/3 ([GHR2007]).

Construction: digit alphabet A = {0,3,4,6,7,8,9,10,11,12,13,14,15,16}, base
B = 33, depth d = 420, cap T = 1392. U is the set of integers whose 420-digit
base-33 expansion uses digits from A with digit sum <= T. The GHR-lemma bound is
1 + log(|U-U|/|U+U|)/log(2 max(U)+1); the three certificate integers
(|U+U|, |U-U|, max(U)) are computed by exact integer dynamic programming (no
floats anywhere).

## Files

- `gh3a_b33_d420_T1392_counts.json` — the headline certificate: the three exact
  integers plus the floor-truncated value strings and parameters.
- `crt_verify_d420.json` — independent CRT-lattice recount verdict for d=420
  (different arithmetic; PASS).
- `spot_check_3a.py` — 60-second verifier: proves the bound FOLLOWS from the
  certificate integers (interval log enclosure + exact-rational floor-digit
  re-derivation + the log-free integer inequality D^11 > S^11 (2 maxU+1)^2).
- `independent_check_3a.py` — from-scratch recount of the integers themselves
  (stdlib only). `selftest` runs in seconds; a full recount is ~1h single-core
  at d=120 and multi-day at d=420 (it does not affect the spot check).

## Verify

60-second tier (proves counts => bound):

    pip install mpmath
    python3 spot_check_3a.py gh3a_b33_d420_T1392_counts.json

Recount self-test (seconds):

    python3 independent_check_3a.py selftest

The spot check ends with `OK: bound follows from the certificate integers.`

## Provenance

Supplement to the merged contribution
https://github.com/teorth/optimizationproblems/pull/95 (constants/3a.md, tag
[MI2026]). Construction family due to [G2026], optimized within and beyond its
published parameters. Fully AI-derived; all results independently re-run before
release.

## License

Code (`spot_check_3a.py`, `independent_check_3a.py`): MIT. Data/text (the JSON
artifacts, this README): CC-BY-4.0.
