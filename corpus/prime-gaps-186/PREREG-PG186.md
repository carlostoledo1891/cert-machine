# Pre-registration — prime gaps 186, phase A (plumb, private), 2026-11-10

Written and committed BEFORE any decider of ours exists. Sealed as seal 8 when committed. Phase A only; phases B and C
get their own pre-registrations.

## What every artifact says first

"The bound liminf (p_{n+1} − p_n) ≤ 186 and its proof are OpenAI's (GPT-6 Astra; `openai/PrimeGaps186` at `61340d0b`).
The Lean proof is conditional on three declared axioms. Phase A decides, on finitely many instances and in exact
arithmetic, whether two of those axioms hold AS WRITTEN IN LEAN, whether they say what the cited theorems say, and
whether the printed numbers agree across the release. It does not verify the bound 186, does not check the Lean proof,
and says nothing about any instance it did not decide."

## Pins

PINS-PG186.txt: the repository's tree at `61340d0b` (git blob ids of all 13 files, sha256 of the nine read), the paper
and the two cited sources (sha256, URL), Mathlib `bbcd1968ee6950abe88b85dba6995da346c4b2a8` and the sha256 of
`Mathlib/Analysis/SpecialFunctions/Complex/CircleAddChar.lean` at that revision. Copies live in
~/Projects/plumb-scout/pg186 (not committed; Katz's book is a scan under copyright). Nothing of the release is modified
or executed in phase A.

## The Lean text decided (Challenge.lean, lines 24–56)

- `normalizedKloosterman3 p c = (p : ℂ)⁻¹ * ∑ u v w : ZMod p, if u * v * w = c then ZMod.stdAddChar (u + v + w) else 0`
- `unnormalizedKloosterman2 p c = ∑ u : (ZMod p)ˣ, ZMod.stdAddChar ((u : ZMod p) + c / (u : ZMod p))`
- Axiom 1: `∀ p [Fact p.Prime] (c : ZMod p), c ≠ 0 → ‖normalizedKloosterman3 p c‖ ≤ 3`
- Axiom 2: `∀ p [Fact p.Prime] (A B : ZMod p), A ≠ 0 → B ≠ 0 → ‖∑ t : ZMod p, if t ≠ 0 ∧ t ≠ -1 then
  unnormalizedKloosterman2 p (A / t) * unnormalizedKloosterman2 p (B / (t + 1)) else 0‖ ≤ 8 * p * √p`

Semantics taken from Mathlib at the pin, by reading (no Lean runs here): `ZMod.stdAddChar_apply` and
`ZMod.toCircle_apply` give `stdAddChar j = exp (2πi · j.val / N)`; `ZMod p` is a field for prime p with `x / y = x * y⁻¹`
and `0⁻¹ = 0`; `‖·‖` on ℂ is the absolute value. **Named gap:** this reading is not anchored by a Lean evaluation;
phase B proves small instances in Lean.

## Questions, verdict rules, controls

Verdict words: CERTIFIED, REFUTED, REFUSED. CERTIFIED here always means "on the instances decided", never "the axiom".

**A1 · Axiom 1 on instances.** Every prime p < 500 (95 primes), every c in 1..p−1 (21,441 instances). Each instance decided exactly: q(c) = |Σ_{uvw=c} ψ(u+v+w)|² / p² against 9.
CERTIFIED: both deciders decide every instance "holds", and agree (below). REFUTED: both decide the same instance
"fails" — the axiom is then false as written, the three theorems follow from a false premise, and the instance is the
finding. REFUSED: the deciders disagree, an instance stays undecided, or a decider does not finish (the verdict then
covers only the primes both finished, named).

**A2 · Axiom 2 on instances.** Every prime p < 500, every (A, B) in (1..p−1)², A = B included (6,992,009 instances). Each instance decided
exactly: q(A, B) = (Σ_t K2(A/t)·K2(B/(t+1)))² / p³ against 64, after establishing that the sum is real. Same three rules.

**Two deciders, no code shared.** Decider A (Python, by the orchestrator): integer arithmetic on cosines scaled to
fixed point with an A PRIORI error bound proved in the file; escalates precision on any instance within the bound.
Decider B (JavaScript BigInt, by a separate agent session that sees only the Lean text above, the Mathlib lemma
statements and the output format — not this file's rules, not decider A, not the paper): interval arithmetic with
outward-rounded endpoints. Each prints one JSON line per (axiom, prime):
`axiom, p, instances, holds, fails, undecided, max_lo, max_hi, argmax, fail_witness, anchor` — `max_lo`/`max_hi` are
integers enclosing 10¹² · max q (floor, ceil). **Agreement:** identical instances/holds/fails/undecided on every line,
intersecting enclosures, anchors true in both. Development runs at single primes are allowed and are not results; the
registered run is one fresh run of each final file over all primes, the file's sha256 recorded with its output.

**Anchors (known identities that must hold exactly; a failure REFUSES the decider, not the axiom).**
Axiom 1 line: Σ_{c≠0} |Kl3(c; p)|² = p − 1 − 1/p − 1/p² (the paper's orthogonality identity, p. 33), decided in exact
cyclotomic integers. Axiom 2 line: every K2(c) has an exactly symmetric exponent count (so it is real), and
Σ_{c≠0} K2(c) = 1 exactly; and max_c K2(c)²/p ≤ 4 (Weil) reported as an enclosure.

**Red controls — planted wrong axioms, decided from the same runs. Predictions written now; a miss is a dated amendment.**
- R1 (axiom 1, the 1/p normalization dropped: raw sum ≤ 3). Predicted REFUTED at p = 5 — certain from the anchor:
  the mean of |Kl3|² over c ≠ 0 is (p − 1 − 1/p − 1/p²)/(p − 1), 0.94 at p = 5, so some raw sum exceeds 4.8.
- R2 (axiom 2 with 8√p for 8p√p, one normalization dropped). Predicted REFUTED at some p ≤ 13 — heuristic (the mean
  square of the sum is about p³), not a proof.
- R3 (axiom 1 with constant 2). "The deciders decide": the least prime where max |Kl3| > 2 is recorded, or none.
- R4 (axiom 2 with constant 4). "The deciders decide": the least prime where max |Σ|/(p√p) > 4 is recorded, or none.
- The slack: max |Kl3| and max |Σ|/(p√p) per prime, as enclosures. Guess, to be graded: the first climbs toward 3 and
  passes 2.5 before p = 500; the second stays between 3 and 6.

**A3 · The axioms against blind readings of the cited theorems.** A separate agent session is given ONLY the two
source files (FKM, p. 1; Katz, the page of Theorem 4.1.1) and a fixed form — the sum (index set, character, exponent),
the normalization, the scope (which primes, which parameters, which points excluded), the inequality and its constant,
and for Katz the one-line deduction of a bound on the absolute value for n = 3, trivial multiplicative characters,
b₁ = b₂ = b₃ = 1, over the prime field. It does not see the Lean text, the release or the paper. Its reading is
committed as returned. Then, mechanically: (i) the reading's elementary sum and the Lean one have IDENTICAL exponent
count vectors for every parameter and every prime < 500 (exact integers, a third script written from the reading);
(ii) the reading's index set and normalization give the Lean inequality exactly; (iii) the Lean axiom's scope is
contained in the reading's scope. MATCH: all three. DIFFERS: any one fails, named — in particular a Lean instance the
cited theorem does not cover is "unsupported by the citation" and rests on the tables alone. REFUSED: the reading
cannot be made exact (the scan), named. This reader is a model session, not claimbox's reader: moving the reading
into claimbox's language is claimbox's work, later.

**A4 · The tuple.** Lean's `admissibleTuple` literal against the paper's (1.3): equal as sets; 40 distinct elements;
least 0, greatest 186; admissible (for every prime p ≤ 40 some residue class is missed; for p > 40 forty elements
cannot cover p classes). Decided by both deciders. CERTIFIED / REFUTED / REFUSED as above. Control: the same tuple
with 2 replaced by 1 must be REFUTED (both classes modulo 2 covered) — certain.
Not decided: whether 186 is the least diameter of an admissible 40-tuple (Sutherland's tables; a reading for the page).

**A5 · The printed numbers.** Static, exact, nothing run: (i) `trialCoefficientInteger` (11 × 7) in Challenge.lean
against `COEFFICIENT_INTEGER_MATRIX` in the certificate; (ii) the six bound lists (17 + 35 + 7 + 10 + 11 + 17 = 97
rows) against Tables 2.1–2.6 of the numerics note, every column; (iii) the three cap constants 23685317816,
23685317890, 90248755123 against the note; (iv) 2·52 + 45 + 3 = 152 against the README's count. MATCH / DIFFERS (the
cells named) / REFUSED (a table the PDF text does not yield reliably, named). MATCH means the axiom's numbers are the
note's numbers — never that the bounds hold.

## Gaps, stated before any result

Nothing beyond p < 500; Deligne, Katz and FKM read, not re-derived; axiom 3's truth untouched; the Lean proof
untouched; Mathlib's semantics read, not run; both deciders written under one orchestrator's briefs.

## Compute and money

The Mac, US$0. Budget two hours of wall time per decider; a decider past it stops and the rule for REFUSED applies.

## What stays private

Everything, until the operator says "reveal": the target's name appears in no public tree, handoff, page or message.
Only seal digests are public.

## Amendment A — the results and the deviations (2026-11-10, after the runs)

Phase A is recorded in results/pg186/VERDICT.md: A1 and A2 CERTIFIED on the instances (21,441 and 6,992,009, both
deciders, 0 undecided), A3 MATCH for both readings, A4 CERTIFIED, A5 MATCH; R1 and R2 met as predicted (p = 5, p = 7),
R3 refuted at p = 17, R4 at p = 83. Four deviations are listed there in full; the one that narrows a rule: A3's
literal comparison for Katz covers p ≤ 47, not every prime below 500. Nothing above this line was edited after the seal.
