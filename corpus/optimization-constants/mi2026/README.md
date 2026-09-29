# Sum-difference lower-bound certificates for C_3a, C_3b, and C_3c

Self-contained, independently checkable certificate artifacts for three
sum-difference lower-bound records contributed by Mosaic Intelligence to
Terence Tao's `teorth/optimizationproblems` repository and merged on
2026-06-21.

| problem | constant | certified lower bound | merged PR | folder |
|---|---|---:|---|---|
| 3a | `C_3a` Gyarmati-Hennecart-Ruzsa sum-difference | `1.1835129324218615...` | [#95](https://github.com/teorth/optimizationproblems/pull/95) | `c3a_pr95/` |
| 3b | `C_3b = SD({0,1,infinity};-1)` | `1.77898884` | [#92](https://github.com/teorth/optimizationproblems/pull/92) | `c3b_pr92/` |
| 3c | `C_3c = SD({0,1,2,infinity};-1)` | `1.6747338950208249` | [#93](https://github.com/teorth/optimizationproblems/pull/93) | `c3c_pr93/` |

The corresponding published upper-bound context includes the Katz-Tao
sum-difference paper deposit, concept DOI `10.5281/zenodo.20646385`. This bundle
is intended as a sibling certificate record for the MI2026 lower-bound artifacts,
not as a new version of that paper.

## Verify

    pip install mpmath
    python3 c3a_pr95/spot_check_3a.py c3a_pr95/gh3a_b33_d420_T1392_counts.json
    python3 c3a_pr95/independent_check_3a.py selftest
    python3 c3b_pr92/check_3b.py
    python3 c3c_pr93/check_3c.py
    shasum -a 256 -c MANIFEST.sha256

The full d=420 3a recount is intentionally not part of the quick gate; it is a
multi-day recount. The spot check proves that the certified integers imply the
quoted lower bound.

## Authorship and license

Creator: Mosaic Intelligence. Contact and updates: Mosaic Intelligence —
https://x.com/111111 · https://github.com/463464q435q43.

All three results are fully AI-derived: constructed and certified by Mosaic
Intelligence's automated search-and-verification system, with numerical results
independently re-run before release.

License: certificate data and writeups CC-BY-4.0; verifier code MIT.
