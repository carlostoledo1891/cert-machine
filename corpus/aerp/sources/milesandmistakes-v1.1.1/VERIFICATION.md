# Independent verification record

**Reviewed:** 2026-08-18; prior-art and symmetry correction reviewed 2026-08-20
**Reviewer:** Codex session requested by Greg Jackson

## Reproduced certificate checks

The ten preserved certificates were loaded independently, checked for exact
count, distinctness, and grid bounds, and exhaustively tested over every
five-subset.

| certificate | subsets | exact zero determinants | min abs(det) | max abs(det) |
|---|---:|---:|---:|---:|
| `RECORD_38_points_n14.json` | 501,942 | 0 | 2 | 162,960 |
| `RECORD_40_points_n15.json` | 658,008 | 0 | 2 | 404,016 |
| `RECORD_41_points_n16.json` | 749,398 | 0 | 2 | 447,906 |
| `RECORD_42_points_n17.json` | 850,668 | 0 | 2 | 447,906 |
| `RECORD_44_points_n17.json` | 1,086,008 | 0 | 2 | 776,880 |
| `RECORD_43_points_n18.json` | 962,598 | 0 | 2 | 588,618 |
| `RECORD_45_points_n18.json` | 1,221,759 | 0 | 2 | 894,528 |
| `RECORD_46_points_n19.json` | 1,370,754 | 0 | 2 | 1,049,324 |
| `RECORD_49_points_n19.json` | 1,906,884 | 0 | 2 | 1,808,096 |
| `RECORD_50_points_n20.json` | 2,118,760 | 0 | 2 | 1,937,690 |

## Independently rerun Demonstrandum prior certificates

On 2026-08-20 four earlier files were fetched from Demonstrandum's
commit-pinned public paths. The unmodified downloads were identified by
SHA-256 before verifier-compatible temporary copies were named. They were not
added to this repository. `PRIOR_ART.md` gives the exact paths, hashes,
publication dates, and license/source attribution.

All four passed the same complete practical battery used for the primary
certificates in this repository:

| Demonstrandum file | five-subsets | exact zero determinants | min abs(det) | max abs(det) |
|---|---:|---:|---:|---:|
| `cert_n14_m38.json` | 501,942 | 0 | 2 | 222,576 |
| `cert_n15_m40.json` | 658,008 | 0 | 2 | 295,972 |
| `cert_n16_m42.json` | 850,668 | 0 | 2 | 465,984 |
| `cert_n17_m44.json` | 1,086,008 | 0 | 2 | 529,908 |

For each file, exact-int64 cofactor expansion, exact Python-integer Bareiss
elimination, and the published floating-point reference logic tested every
five-subset and passed. No SymPy result is asserted for the prior-art rerun.

The practical publication battery uses:

1. vectorized exact int64 cofactor expansion;
2. exact Bareiss fraction-free elimination using Python integers;
3. the AlphaEvolve problem notebook's float determinant plus `numpy.isclose`
   reference logic.

On 2026-08-20 all ten listed certificates passed all three routes over every
five-subset. Complete command output is saved in
`verification_all_v1.1.1.log`. Earlier focused output for the 44-, 49-, and
50-point certificates remains in `verification_44_n17.log` and
`verification_49_50.log`.

The 42-point n=17, 43-point n=18, and 46-point n=19 certificates are retained
as discovery artifacts. Their full three-route rerun passed as part of the
bundle-wide review. The primary certificates at n=17 through n=20 are now 44,
45, 49, and 50 points respectively. In particular, the 49-point certificate
supersedes both the preserved 46-point set and the stale 47-point progress note.

## Recovered auxiliary certificates

Before being frozen, both recovered temporary files also passed a separate
modular cofactor certificate modulo 1,000,000,007. Source hashes, modification
times, the surviving search-log line, and the source dependency-drift caveat
are preserved in `auxiliary_search/RECOVERY.md`.

## Independent search reproduction

The n=15 certificate matches the independently produced 40-point set in
`independent_c_search/run7.log`.

For n=17, `independent_c_search/search_n17.c` is a mechanically adapted
version of that exact C ruin-and-recreate search. It uses an exterior-algebra
incremental determinant check and an internal direct-determinant self-test.
Rebuilding the frozen source and running seed 2 reproduced the 44-point
certificate at iteration 904 and 12 seconds. The complete console output is
`independent_c_search/run_n17_seed2.log`.

## SymPy status

The project virtual environment contains SymPy 1.14.0. A full symbolic pass is
supported by `verify_independent.py --sympy`, but the review-time rerun was
terminated by the machine's thermal/process guard before completion. No SymPy
result is asserted. The completed exact cofactor and Bareiss routes are
sufficient to establish the finite lower-bound claims; SymPy remains optional
publication redundancy.

## Symmetry and full Euclidean automorphisms

`analyze_symmetry.py` uses only the Python standard library. It validates
certificate metadata and coordinates, enumerates all 48 cubic-grid
isometries, counts distinct pointwise squared-distance signatures, and verifies
affine span three.

| certificate | cubic stabilizer | distinct signatures | full Euclidean automorphism group |
|---|---:|---:|---|
| `RECORD_38_points_n14.json` | 2 | 19 / 38 | nontrivial |
| `RECORD_40_points_n15.json` | 2 | 20 / 40 | nontrivial |
| `RECORD_41_points_n16.json` | 1 | 41 / 41 | trivial |
| `RECORD_42_points_n17.json` | 2 | 21 / 42 | nontrivial |
| `RECORD_44_points_n17.json` | 2 | 22 / 44 | nontrivial |
| `RECORD_43_points_n18.json` | 1 | 43 / 43 | trivial |
| `RECORD_45_points_n18.json` | 1 | 45 / 45 | trivial |
| `RECORD_46_points_n19.json` | 1 | 46 / 46 | trivial |
| `RECORD_49_points_n19.json` | 1 | 49 / 49 | trivial |
| `RECORD_50_points_n20.json` | 1 | 50 / 50 | trivial |

Pairwise-distinct signatures force every distance-preserving permutation of
the finite set to fix every point. Because the listed sets affinely span three
dimensions, the only ambient Euclidean isometry fixing all points is the
identity. This supplies the full Euclidean conclusion for the six rows marked
trivial; cubic stabilizer order one alone would be insufficient.

## Integrity

The current manifest can be checked with:

    sha256sum -c SHA256SUMS

The manifest includes the bundle-wide v1.1.1 verification log, the symmetry
and comparison checkers, and the prior-art correction record.

## Scope of the verdict

The checks establish that the listed point sets satisfy the stated finite
condition and therefore prove lower bounds. They do not establish optimality
or mathematical/publication priority.
