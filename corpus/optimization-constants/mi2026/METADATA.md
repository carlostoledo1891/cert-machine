# Zenodo metadata draft: sum-difference lower-bound certificates

Status: local staging only. No API write or Zenodo draft has been created from
this file.

## Recommended record

- Title: `Certified sum-difference lower-bound certificates for C_3a, C_3b, and C_3c`
- Creator: `Mosaic Intelligence`
- Resource type: dataset, with certificate data and verifier code
- License: `CC-BY-4.0` for the deposit; verifier code MIT as stated in README files
- Keywords: additive combinatorics; sum-difference constants; Kakeya; arithmetic
  Kakeya; entropy method; exact counting; interval arithmetic; certified
  computation; machine-verified mathematics; AI-generated mathematics

## Description

This record is a self-contained certificate archive for three Mosaic
Intelligence lower-bound contributions merged into
`teorth/optimizationproblems` on 2026-06-21: `C_3a >=
1.1835129324218615...`, `C_3b >= 1.77898884`, and `C_3c >=
1.6747338950208249`. It is a sibling certificate record to the Katz-Tao
sum-difference paper record `10.5281/zenodo.20646385`, which contains the
paper and upper-bound ladder/wall material but not these MI2026 lower-bound
certificate artifacts. The archive contains exact-count or exact-rational
certificate data plus pure-Python verifier scripts using exact arithmetic and,
where needed, interval arithmetic. The full `C_3a` recount is intentionally a
long-running independent audit; the shipped quick checker verifies that the
certified integers imply the quoted lower bound.

Contact and updates: Mosaic Intelligence — https://x.com/111111 ·
https://github.com/463464q435q43

## Related identifiers

| relation | identifier |
|---|---|
| `isSupplementTo` | `https://github.com/teorth/optimizationproblems/pull/92` |
| `isSupplementTo` | `https://github.com/teorth/optimizationproblems/pull/93` |
| `isSupplementTo` | `https://github.com/teorth/optimizationproblems/pull/95` |
| `isSupplementTo` | `https://doi.org/10.5281/zenodo.20646385` |

Do not include PR #94 or PR #101 in this record.
