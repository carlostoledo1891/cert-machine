# Prime gaps 186 — the wider tables (A′), the record (2026-11-10)

Rules: PREREG-PG186-A2-C0.md (seal 10), which keeps everything PREREG-PG186.md says first. The bound 186 and its proof
are OpenAI's. **This does not verify the bound 186, does not check the Lean proof, and says nothing about any prime
≥ 2,000.** C0 has its own record (c0/VERDICT.md).

## Gaps first

1. A finite table cannot prove either axiom. Nothing is decided for p ≥ 2,000.
2. The other gaps of VERDICT.md stand: axiom 3 untouched, the Lean proof unbuilt, Mathlib's semantics read and not
   run, the cited theorems read and not re-derived, both deciders under one orchestrator's briefs.
3. Decider B changed its method for axiom 2 between phase A and this run (below). Its own cross-checks passed and its
   lines below 500 are unchanged, but the new path was written and checked by the same session.

## Verdicts

| | question | verdict | numbers |
|---|---|---|---|
| A1′ | axiom 1 on instances, every prime below 2,000 | **CERTIFIED on the instances** | 303 primes, 276,747 instances, all hold in both deciders, 0 undecided |
| A2′ | axiom 2 on instances, every prime below 2,000 | **CERTIFIED on the instances** | 303 primes, 359,158,973 instances (A = B included), all hold in both, 0 undecided |

**Agreement:** 606 of 606 lines with identical counts; every pair of enclosures intersects (596 identical; the ten
others overlap — decider B's 64-bit intervals are two units of 10⁻¹² wide on nine large-prime lines, and decider A's
is two wide at p = 2); every anchor true in both; the same argmax on every line. Both deciders' lines for p < 500 equal
their phase-A lines byte for byte.

- Decider A: `decide.py` `ba27c07a…` (phase A's file plus `--jobs`), 1,089 s on six processes.
- Decider B: `decide.js` `97eff939…`, 929 s on eight threads; replayed here from a clean copy — see "Replay" below.

## What decider B's author changed (its report, checked against its log)

1. The axiom-1 anchor total is accumulated in BigInt: the phase-A bound (p−1)⁵ < 2⁵³ fails below 2,000.
2. Axiom 2 is evaluated by a cyclic convolution with two large BigInt multiplications per A, giving the same two
   endpoint sums as the direct loop. Guards in the run: every K₂(c) must have a definite sign at 64 bits (else the
   direct loop is used; only p = 2 took it); each of the 553,492 large products checked modulo 2⁶¹ − 1; four B's per A
   (1,106,984 instances) recomputed by the direct loop and required equal; Σ_B T(A, B) ∋ 1 − K₂(−A) for every A.
3. The S₃ count vector is built by shifts of the two-term vectors, compared with the direct count at c = 1 and p − 1.

## Controls and the slack

| | planted | result over p < 2,000 |
|---|---|---|
| R1 | axiom 1 without the 1/p | REFUTED at p = 5 |
| R2 | axiom 2 with 8√p | REFUTED at p = 7 |
| R3 | axiom 1 with constant 2 | REFUTED at p = 17 |
| R4 | axiom 2 with constant 4 | REFUTED at p = 83 |
| new | axiom 1 with constant 2.8 | REFUTED at p = 547 |
| new | axiom 2 with constant 5.5 | holds through p = 1999 — NOT refuted on this range |

- max |Kl₃(c; p)| over p < 2,000 ≈ 2.8081, at p = 887, c = 71 (10¹²·q in [7885423285380, 7885423285381]); bound 3.
- max |Σ|/(p√p) over p < 2,000 ≈ 5.2470, at p = 1283, (A, B) = (309, 974) (10¹²·q in [27530661345810,
  27530661345811]); bound 8. For 1,000 < p < 2,000 the per-prime maximum lies between 4.31 and 5.25 (median 4.66).
- max K₂(c)²/p ≈ 3.99934, at p = 1747; Weil's 4.
- Decider B's author notes T(A, B) = T(−B, −A) (t ↦ −1 − t), so maxima come in pairs.
- **The guess, graded:** "the first maximum exceeds 2.8" — yes (first at p = 547); "the second lies between 5 and 6" —
  yes (5.247).

## Deviations

1. `compare.py` gained a bound argument and the two new thresholds after the seal; run with the bound 500 it
   reproduces phase A's `compare.json` byte for byte.
2. Decider B's method change for axiom 2 (above) is its author's, inside the brief's rules (BigInt endpoints, outward
   rounding); the pre-registration asked only for the bound and the re-proved limits.
3. The battery guard never fired; both runs finished on battery (82% → 64%).

## Replay

Decider B's final `decide.js` (`97eff939…`) was copied alone into an empty directory and run again by the orchestrator:
692 s, `results-2000.jsonl` byte-identical to the author's (sha256 `fc632ae9…`).
