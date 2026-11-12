# Two blind readings of BGP212's seven analytic hypotheses (2026-11-12)

The seven analytic hypotheses of AxiomMath/BGP212 (`Gap212Challenge/Basic.lean` at 6641780bb6bab050fd400a348ba759d233e34fad,
sha256 0658163b…242fb), each read against the statement it cites: [1] Polymath, "New equidistribution estimates of Zhang
type", arXiv 1402.0811v3; [2] J. Stadlmann, arXiv 2608.31126v1. Two readers (Claude agents, run by Carlos Toledo), each
reading the papers FIRST and committing that reading before opening the Lean; reader B did not see reader A's work.

- `reader-a/`, `reader-b/`: per hypothesis `<Name>.source.md` (the cited statement, quoted, and what it asserts) and
  `<Name>.reading.md` (the Lean, quoted, and READING: MATCH / MISMATCH / CANNOT READ with the differing clause);
  `summary.json`; `sources.json` (the e-prints pinned by sha256; the papers themselves are not copied here).
- `PROVENANCE.json`: every file's sha256 and the claimbox commits they come from.

Both readers: all seven MISMATCH. Six bound the discrepancy over all n (`sumError`, [1] (1.1)) where [2] sums over
n ∈ [x, 2x] (`sumErrorDyadic` is defined and unused); `BilinearBombieriVinogradov` adds `x^ξ ≤ M`. These are readings,
not decisions or proofs.
