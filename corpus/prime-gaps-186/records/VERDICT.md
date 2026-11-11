# Prime gaps 186 — phase A, the record (2026-11-10)

The bound liminf (p_{n+1} − p_n) ≤ 186 and its proof are OpenAI's (GPT-6 Astra; `openai/PrimeGaps186` at `61340d0b`).
The Lean proof is conditional on three declared axioms. Phase A decided, on finitely many instances and in exact
arithmetic, whether two of those axioms hold as written in Lean, whether they say what the cited theorems say, and
whether the printed numbers agree across the release. **It does not verify the bound 186, does not check the Lean
proof, and says nothing about any instance it did not decide.**

Rules: PREREG-PG186.md, sealed as seal 8 (registry `24bba0b4`) before any decider existed.

## Gaps first

1. Nothing is decided for any prime ≥ 500. A finite table cannot prove either axiom.
2. Axiom 3 (the 152 integral bounds) is untouched except for transcription. The certificate was parsed, never run.
3. The Lean proof (10.3 MB) was not built or checked. Phase B.
4. The deciders' reading of Mathlib (`stdAddChar j = exp(2πi·j.val/N)`, division in `ZMod p`) is from source text; no
   Lean evaluation anchors it. Two sessions read it the same way; phase B should prove p = 2, 3 instances in Lean.
5. Deligne, Katz and Fouvry–Kowalski–Michel were read, not re-derived. Katz's theorem prints no inequality: the bound
   3p is a deduction from "rank 3, pure of weight 2" with the standard meaning of purity (the reader's fork 1).
6. Both deciders were written under one orchestrator's briefs, and decider B's brief named the two anchor identities.

## Verdicts

| | question | verdict | numbers |
|---|---|---|---|
| A1 | axiom 1 (`kloosterman3_bound`) on instances | **CERTIFIED on the instances** | 95 primes below 500, 21,441 instances, all hold in both deciders, 0 undecided |
| A2 | axiom 2 (`kloosterman2_correlation_bound`) on instances | **CERTIFIED on the instances** | 95 primes, 6,992,009 instances (A = B included), all hold in both, 0 undecided |
| A3 | each axiom against a blind reading of its cited theorem | **MATCH, both** | FKM: 21,536 exponent-count vectors identical, index set and arguments identical, scope contained. Katz: 313 vectors identical (literal for p ≤ 47), scope contained |
| A4 | the 40-tuple | **CERTIFIED** | Lean literal = the paper's (1.3); 40 distinct, 0..186, admissible (primes ≤ 37 checked, both deciders) |
| A5 | the printed numbers | **MATCH** | 77 coefficients (Lean = certificate); 298 table cells in six tables (Lean = numerics note), the six totals; the three cap constants; 104 + 45 + 3 = 152 (README) |

**Agreement of the two deciders:** 190 of 190 lines with identical counts; every pair of enclosures intersects (189
identical; the one that differs is axiom 1 at p = 2, where the value is exactly 1/4: decider B prints it exactly,
decider A one unit of 10⁻¹² either side); every anchor true in both; the same argmax on every line.
Decider A: Python, a priori error bounds, 61.7 s, `decide.py` `14a4fa80…`. Decider B: JavaScript BigInt intervals,
written by a separate session from the Lean text alone, 32.1 s, `decide.js` `1b13bb6e…`; replayed here from a clean
copy, output byte-identical.

## Red controls (planted wrong axioms)

| | planted | predicted | result |
|---|---|---|---|
| R1 | axiom 1 without the 1/p | REFUTED at p = 5 | REFUTED at p = 5 — met |
| R2 | axiom 2 with 8√p | REFUTED at some p ≤ 13 | REFUTED at p = 7 — met |
| R3 | axiom 1 with constant 2 | the deciders decide | REFUTED at p = 17 (first prime where max \|Kl₃\| > 2) |
| R4 | axiom 2 with constant 4 | the deciders decide | REFUTED at p = 83 (first prime where max \|Σ\|/(p√p) > 4) |
| — | the tuple with 2 replaced by 1 | REFUTED | REFUTED: every class occupied modulo 2 and modulo 3 |
| — | a planted digit in a copy of Challenge.lean (tool check, not pre-registered) | — | reported by the static check |

## The slack (new numbers; square roots for display only, the decisions are on the squares)

- max |Kl₃(c; p)| over p < 500 is ≈ 2.7314, at p = 433, c = 111 (10¹²·q in [7460465965746, 7460465965747]) — bound 3.
- max |Σ|/(p√p) over p < 500 is ≈ 4.9789, at p = 433, (A, B) = (83, 350) (10¹²·q in [24789316669381, 24789316669382])
  — bound 8.
- max K₂(c)²/p ≈ 3.98932 at p = 463 — Weil's 4.
- The guess written in the pre-registration: the first "passes 2.5 before p = 500" — yes; the second "stays between 3
  and 6" — true of the overall maximum, false per prime (below 3 for every p < 23).

## Deviations from the pre-registration, all of them

1. A3 for Katz: the pre-registration said identical count vectors "for every prime < 500". The Lean sum was taken
   literally (all of `ZMod p`, the `if`) only for p ≤ 47 (313 vectors); beyond that the two sums coincide by one step
   (u·v·w = c ≠ 0 forces u, v, w ≠ 0), so a separate computation would compare a program with itself. FKM was
   compared at every prime below 500.
2. Decider A's enclosure of the maximum for axiom 2 is taken over the instances that can attain it (those whose
   first-tier interval reaches the largest first-tier lower end), not over all instances. It still encloses the maximum.
3. Development runs: decider A at p = 2, 3, 5, 7 (against a throwaway float transcription) and one timing run at
   p = 499; decider B's own self-test (196 checks, floats in the self-test only). Allowed by the rules; not results.
4. Extras not pre-registered: the six table totals; the planted-digit tool check; the clean-copy replay of decider B.

## The readings' forks worth keeping

- FKM, page 2: read literally, the correlation sum C(K; γ) includes z = 0 and equals S + 1/p. Proposition 2 and the
  Lean axiom are both about S (poles 0 and −1 excluded), so nothing changes here; it matters to anyone who states the
  bound for C.
- FKM is a 2013 note on an author's page, not a journal article; Katz 4.1.1 is credited "cf. Deligne".
- p = 2 and p = 3 are degenerate for axiom 2 (empty sum; one term). The trivial bound covers p ≤ 7 for axiom 2 and
  p ≤ 3 for axiom 1.

## Stage prediction graded (TARGET-PG186.md)

A: both axioms hold on every instance (≥ 98%) — yes; both readings match (90%) — yes; the tuple (99%) — yes; the
printed numbers match (90%) — yes.

## Files

`a/` decider A's run; `b/` decider B's run; `compare.json` the agreement rule and controls; `readings-compare.json`
A3; `static.json` A4 (as printed) and A5; `../../pg186/` the two deciders, the briefs, the readings as returned.
