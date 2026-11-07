# Pre-registration — Erdős #488, the 360° certification (plumb, private), 2026-11-06

Written and committed BEFORE any code of ours runs on the claim (the gist) and before any search code is written. The
operator's words (2026-11-06): "Certify an AI lab's open claim"; "Yes, write it now"; "Search for a small one first";
"Seal it". Seal 0 (the plan through TARGET-488) is anchored; this note is sealed as seal 1 when committed.

## What every artifact says first

"The refutation of Erdős #488 is the discovery of Declan Gessel with GPT-6 Astra in Codex (formal-conjectures PR #5297,
gist d8e15e5f at 034be67a). This decides whether their Lean proof refutes DeepMind's statement AS IT STANDS, on every kernel
we can run, re-derives its arithmetic independently, and adds an explicit counterexample only if one is found. Who found
the counterexample first is a reading, not a decision."

## Pins

- formal-conjectures `2055e5a` (2026-11-06): `FormalConjectures/ErdosProblems/488.lean`, toolchain `leanprover/lean4:v4.33.1`,
  Mathlib `b7eb3304`; the file's history (09-18 modulized; 10-14 `question` tag added, prop-valued `answer(...)` removed).
- The gist `d8e15e5ff1b6c7e99e3d86d7c66f1d08` at `034be67a5c958e55505bb357f9e4ef3015788465`: `Erdos488.lean` (561 lines),
  `lakefile.toml` (Mathlib `db584cd6`), `lean-toolchain` (`v4.33.0`). sha256 of each file recorded before the first run.
- Both read from read-only clones in ~/Projects/plumb-scout; nothing of the gist is modified. A port, if needed, is a
  separate file whose every changed line is listed against the original.

## Questions, verdict rules, controls

**P1 · Statement.** A module of ours imports DeepMind's `FormalConjectures.ErdosProblems.«488»` at the pin and the gist's
proof (ported if needed), and states `theorem p1 : ¬ (type_of% @Erdos488.erdos_488) := Erdos488ExactAdapter.refutation`.
It must elaborate and kernel-check. Separately, the adapter's restated `proposition` and DeepMind's statement are compared
syntactically (after unfolding the abbrev). CERTIFIED: both. REFUTED: the restated proposition differs from DeepMind's, or
`p1` does not check. REFUSED: a tool or build stop, named.
Controls, each of which must be refused: the statement as it read before 10-14 (`answer(sorry) ↔ …`); the constant 2 changed
to 3; `m > n` changed to `m ≥ n`.

**P2 · Port.** The gist compiles on v4.33.0 with its own Mathlib, unchanged. On v4.33.1 with DeepMind's Mathlib it compiles
either unchanged or with a minimal diff (API renames only), every changed line recorded. A change to proof content beyond
renames is reported and stops P1 for review.

**P3 · Kernels.** `lake build`; each source re-elaborated with `-Ddebug.skipKernelTC=false`; our axiom audit (two
traversals: only `propext`, `Quot.sound`, `Classical.choice`; no `native_decide`, `ofReduceBool`, `implemented_by`);
`leanchecker`, `-paranoid`, `--fresh`; then nanoda v0.4.31, con-leche and con-ron (bundled and master), and lean4lean.
CERTIFIED when Lean's three checkers accept and the audit is clean. Each second kernel is recorded as accept, reject or
tool stop; a tool stop is a named gap, never a pass. Expected trouble: `endpoint_gap : 2^4096 * (8*4096+1)^53 < 3^4096` and
the other `decide` facts on big literals.

**P4 · Exact arithmetic, independent.** Two clean-room deciders (JavaScript BigInt and Python ints, written apart, sharing
no code, neither reading the gist's proofs) re-derive every closed arithmetic fact the proof's `decide` and `norm_num`
steps rest on: `endpoint_gap`; `oddPrimes.card = 53`; Q and φ(Q); `Q_large`; `constant_ratio : 3Q < 16·φ`. CERTIFIED if
both agree with every fact; REFUTED (named) if a fact is false.

**P5 · An explicit counterexample (the step past the claim).** The operator's route: search for a SMALL one first, on the
Mac. Target: a finite A ⊂ ℕ with 0, 1 ∉ A, and n, m with max A ≤ n < m, where 2·m·|B∩[1,n]| ≤ n·|B∩[1,m]|. Families
first (smooth bands like theirs at small scale; primes and prime powers up to x; multiplicatively structured sets), then
heuristic search, with exact counts (a sieve) for m ≤ 10^8. A hit is decided by both P4 deciders, then proved in Lean against
DeepMind's declaration by `decide`/`norm_num`, kernel only. No hit within the search recorded in the run log is a
NEGATIVE RESULT with its bounds: no verdict word, no claim. **Prior, stated now:** their construction needs a scale near
2^1000, and Erdős's question survived decades, so a small counterexample is unlikely; we expect a negative result.
Computing their own k (certified counts of odd 251-smooth numbers up to 2^(8k), k ≈ 130) is a later route, not this one.

**P6 · Provenance.** The erdosproblems.com entry and forum, the Jig run linked in the PR, and any earlier counterexample,
read and dated. A reading only, no verdict word; it answers the maintainer's question of 09-21 as far as sources allow.

**P7 · Red team.** Planted variants of the gist, run through P1 and P3, each of which must be refused: `endpoint_gap` with
4095 for 4096; a `sorry` inserted; an added axiom; `native_decide` in place of one `decide`; the adapter pointed at the
pre-10-14 statement.

## Compute and money

Lean work on a RunPod CPU pod (the runpod image; 8 vCPU / 64 GB at about US$0.44/h; a few hours, about US$2–5). The search
runs on the Mac. Total inside the US$500 cap; every pod is deleted and confirmed 404.

## What stays private

Everything until the operator says "reveal". Then: the records, a review on #5297 and/or our own PR (credit to Gessel /
GPT-6 Astra first), the page, the thread. The same day.
