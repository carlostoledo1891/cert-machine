# Prior-art correction and independent comparison

**Correction date:** 2026-08-20

The initial releases of this repository correctly verified every included
coordinate certificate, but incompletely described the prior public record for
`n=14` through `n=17`. This file records the correction without altering the
historical certificates or discovery timeline.

## Material missed by the original search

The Demonstrandum artifact bundle cited by this project for `C(13) >= 36`
also contains these files:

- `mining/construct-search/cert_n14_m38.json`;
- `mining/construct-search/cert_n15_m40.json`;
- `mining/construct-search/cert_n16_m42.json`;
- `mining/construct-search/cert_n17_m44.json`.

Their full repository path begins
`problems/p1-records/no-5-on-a-sphere-grid/`. They are documented as new bounds
in `mining/CONSTRUCTION.md`, but are outside the bundle's main `certificates/`
directory and are not enumerated in its top-level `RESULTS.md`. This explains
the miss but does not change the priority conclusion.

The files were already present in Demonstrandum's initial public commit,
`94db9ed50d48a57aae5ccb72e6a95a2b8f8f39d3`, dated 2026-06-13 01:23:03 UTC,
and in the first Zenodo version published shortly afterward:

- initial commit: <https://github.com/demonstrandum-research/artifacts/commit/94db9ed50d48a57aae5ccb72e6a95a2b8f8f39d3>;
- construction record: <https://github.com/demonstrandum-research/artifacts/blob/94db9ed50d48a57aae5ccb72e6a95a2b8f8f39d3/problems/p1-records/no-5-on-a-sphere-grid/mining/CONSTRUCTION.md>;
- Zenodo version DOI: <https://doi.org/10.5281/zenodo.20673865>;
- Zenodo all-versions DOI: <https://doi.org/10.5281/zenodo.20673864>.

This predates this repository's August 2026 discoveries and releases.

The 16.2 MiB `demonstrandum-artifacts-v1.zip` was downloaded directly from
Zenodo record 20673865 during this correction audit. All four paths were
present among its 1,177 members, and their member-level SHA-256 hashes exactly
matched the commit-pinned GitHub files listed below. The priority conclusion
therefore does not rely on the mutable current branch.

## Independent verification of the prior certificates

On 2026-08-20 the four files were fetched from the commit-pinned paths and
given verifier-compatible temporary filenames. They were not added to this
Apache-2.0 repository; they remain attributed to the Demonstrandum artifact
and its CC-BY-4.0 Zenodo deposit.

The unmodified downloaded files had these SHA-256 hashes:

| Demonstrandum file | SHA-256 |
|---|---|
| `cert_n14_m38.json` | `4054b47b0d505de2705a5ddfc60b3dfe9c797e1bd019eda15253d16bedf57aac` |
| `cert_n15_m40.json` | `0b0cd9b8ccddf7c816a10d99aaa5187956bdced8731c3eb5db3e20b184049837` |
| `cert_n16_m42.json` | `c98b3c7a95106b82a3a31e9807616df01841406c51c04eef71bb60dfe1ca6ed1` |
| `cert_n17_m44.json` | `ff5d9fb51a0c446650a67d18b23f366318241893b9e4aa93f17de754d35311e9` |

Each passed this repository's complete practical publication battery: grid
bounds and distinctness, vectorized exact-int64 cofactor expansion, exact
Python-integer Bareiss elimination, and the published floating-point reference
logic.

| `n` | points | five-subsets | zero determinants | min abs(det) | max abs(det) |
|---:|---:|---:|---:|---:|---:|
| 14 | 38 | 501,942 | 0 | 2 | 222,576 |
| 15 | 40 | 658,008 | 0 | 2 | 295,972 |
| 16 | 42 | 850,668 | 0 | 2 | 465,984 |
| 17 | 44 | 1,086,008 | 0 | 2 | 529,908 |

No SymPy result is asserted for this comparison; the same three completed
routes used by this project's practical publication battery all passed.

## Relationship to this repository's certificates

| `n` | this repository | Demonstrandum | direct overlap | equivalent under 48 grid isometries? | corrected status |
|---:|---:|---:|---:|---|---|
| 14 | 38 | 38 | 2 points | no | independent construction of an existing bound |
| 15 | 40 | 40 | 2 points | no | independent construction of an existing bound |
| 16 | 41 | 42 | 0 points | no | valid asymmetric near-record; public bound is at least 42 |
| 17 | 44 | 44 | 0 points | no | independent construction of an existing bound |

Canonical comparison enumerated all coordinate permutations and independent
coordinate reflections. “No” means the complete point sets are not related by
any of the 48 isometries of the cubic grid. The comparison is reproducible with
`compare_certificates.py` after downloading the cited prior files.

Under that script's documented compact-JSON serialization, the canonical
SHA-256 hashes are:

| `n` | this repository | Demonstrandum |
|---:|---|---|
| 14 | `08f9f2be5e17938046fb7dea1f33aac4600933a4d803f660f34484a1c1ef3283` | `e11214e8d66ab83437fde0128757ae179d0bf222b68a3e6632325d94871dd200` |
| 15 | `7e12a2243de8d92a3ca461d5ae285d8e2ccccc5fa80a4950c717836e428f7eef` | `545aed5089d4e54d733a1419b2f8cd636a4d3f58f31ce79d093d315746f0868b` |
| 17 | `9b939b9e5bbd2b835c7318cd88c162efc28aa21e60892911840deacb8d3e7224` | `810571b99175fbc11b6da7aad9bfe8e43bcd960b19d08fc2ab669b6a78d14a5c` |

## Expanded missed-material audit

The correction prompted a broader review on 2026-08-20 rather than a search
only for the four reported filenames:

- the frozen Demonstrandum archive's complete 673-file
  `no-5-on-a-sphere-grid` subtree was enumerated, and every JSON object was
  scanned structurally for point-coordinate lists regardless of its filename
  or directory;
- the largest point lists located there for n=18, n=19, and n=20 contained
  36, 40, and 42 points respectively, below this repository's 45-, 49-, and
  50-point certificates;
- all comments in the relevant DeepMind issue, the other related issues, all
  pull requests, and all 12 repository forks visible on the audit date were
  reviewed for further results;
- current GitHub code and repository search, Zenodo, Numaro, arXiv, Hugging
  Face, OSF, OEIS, and general web search were checked for the problem and for
  the exact n=18 through n=20 claims.

No additional public certificate or stronger numerical claim for n=18 through
n=20 was found. This is a documented search result, not proof that no earlier
public or unpublished work exists; the priority qualification below therefore
remains essential.

## Corrected scope

- This repository's `n=14`, `n=15`, and `n=17` certificates remain valid,
  independently found, non-isometric witnesses for already-public numerical
  bounds.
- `RECORD_41_points_n16.json` remains a valid asymmetric construction, but it
  is one point below Demonstrandum's earlier centrosymmetric 42-point set.
- The best public lower-bound sequence through `n=17` must use 42 at `n=16`.
  These are lower bounds, not known exact values of `C(n)`.
- The correction does not alter the coordinate validity of any certificate in
  this repository.
- No earlier `n=18`, `n=19`, or `n=20` value was found in this material. The
  45-, 49-, and 50-point bounds remain described only as apparently new based
  on the documented searches, never as guaranteed-priority or optimal values.

The correction was prompted by an independent review from GitHub user
`Ganador1` in DeepMind repository issue 6. That review also independently
verified this project's principal `n=16`, `n=18`, `n=19`, and `n=20`
certificates. The public discussion is preserved at:
<https://github.com/google-deepmind/alphaevolve_repository_of_problems/issues/6#issuecomment-5345021795>.
