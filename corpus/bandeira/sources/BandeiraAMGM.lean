/-!
# Bandeira 0.2(a) versus Recht--Ré at m=n: Lean reduction core

This file is the first *compilable* Lean artifact for the current session.
It deliberately avoids Mathlib because the shared Lean command available in
this step did not expose a `Mathlib` import path.  Instead it formalizes the
logical core of the reduction in a small kernel-only layer:

* `Bandeira02a E` is the inequality
  `symmetrized permutation term <= mean-power term`.
* `RRnn E` is Recht--Ré at `m=n`, written as
  `distinct-word term <= all-word term`.
* Once the two mathematical identities are supplied
  (`rrWord = bandeiraMeanPow` and `rrDistinct = bandeiraSymm`), the two
  inequalities are definitionally equivalent as Lean theorems.

The identities themselves are the next targets:
(1) distributivity/all-word expansion;
(2) reindexing injective words by permutations;
(3) the PSD spectral-norm power identity `‖S^n‖ = ‖S‖^n`.
-/

namespace Qiushi
namespace BandeiraAMGM

/-- The four scalar quantities that appear after all matrix sums, products and
spectral norms have been formed for a fixed PSD tuple.

`α` is the ordered scalar type of norm values.  In the final Mathlib version it
should be `ℝ` or `NNReal`; here it is abstract so this file compiles with the
kernel and records the exact logical shape of the reduction. -/
structure ReductionExpressions (α : Type u) where
  /-- Bandeira left side: norm of the averaged permutation/symmetric product. -/
  bandeiraSymm : α
  /-- Bandeira right side: norm of the average matrix raised to the `n`-th power. -/
  bandeiraMeanPow : α
  /-- Recht--Ré with-replacement/all-word side at `m=n`. -/
  rrWord : α
  /-- Recht--Ré without-replacement/distinct-word side at `m=n`. -/
  rrDistinct : α

variable {α : Type u} [LE α]

/-- Bandeira Open Problem 0.2(a) for one fixed tuple, after evaluating the two
norm expressions. -/
def Bandeira02a (E : ReductionExpressions α) : Prop :=
  E.bandeiraSymm ≤ E.bandeiraMeanPow

/-- Recht--Ré at `m=n` for one fixed tuple, after evaluating the two norm
expressions.  We write `≤` rather than `≥`: distinct-word side is bounded by the
with-replacement/all-word side. -/
def RRnn (E : ReductionExpressions α) : Prop :=
  E.rrDistinct ≤ E.rrWord

/-- The two identities needed to identify `(RR)_{n,n}` with Bandeira 0.2(a). -/
structure ReductionIdentities (E : ReductionExpressions α) : Prop where
  /-- All words telescope to the matrix-power/mean-power term, using PSD power norm. -/
  word_eq_mean_power : E.rrWord = E.bandeiraMeanPow
  /-- Distinct words are exactly permutations. -/
  distinct_eq_symmetric : E.rrDistinct = E.bandeiraSymm

/-- Core Lean theorem: once the two expression identities are proved, the
Recht--Ré inequality at `m=n` and Bandeira 0.2(a) are the same proposition. -/
theorem rrnn_iff_bandeira02a (E : ReductionExpressions α)
    (h : ReductionIdentities E) :
    RRnn E ↔ Bandeira02a E := by
  constructor
  · intro hRR
    unfold RRnn at hRR
    unfold Bandeira02a
    rw [← h.distinct_eq_symmetric, ← h.word_eq_mean_power]
    exact hRR
  · intro hB
    unfold Bandeira02a at hB
    unfold RRnn
    rw [h.distinct_eq_symmetric, h.word_eq_mean_power]
    exact hB

/-- Contrapositive direction used in the disproof: if Recht--Ré fails for the
same evaluated expressions, then Bandeira 0.2(a) fails for that tuple. -/
theorem not_bandeira02a_of_not_rrnn (E : ReductionExpressions α)
    (h : ReductionIdentities E) :
    ¬ RRnn E → ¬ Bandeira02a E := by
  intro hNotRR hB
  exact hNotRR ((rrnn_iff_bandeira02a E h).2 hB)

/-- Conversely, a Bandeira violation is also an `(RR)_{n,n}` violation. -/
theorem not_rrnn_of_not_bandeira02a (E : ReductionExpressions α)
    (h : ReductionIdentities E) :
    ¬ Bandeira02a E → ¬ RRnn E := by
  intro hNotB hRR
  exact hNotB ((rrnn_iff_bandeira02a E h).1 hRR)

/-- Existential transfer: an external or later-formalized Recht--Ré counterexample
immediately gives a Bandeira 0.2(a) counterexample, provided the reduction
identities are established for that evaluated tuple. -/
theorem exists_not_bandeira02a_of_exists_not_rrnn
    {ι : Type v} (Expr : ι → ReductionExpressions α)
    (hId : ∀ i, ReductionIdentities (Expr i)) :
    (∃ i, ¬ RRnn (Expr i)) → (∃ i, ¬ Bandeira02a (Expr i)) := by
  intro h
  cases h with
  | intro i hi =>
      exact ⟨i, not_bandeira02a_of_not_rrnn (Expr i) (hId i) hi⟩

end BandeiraAMGM
end Qiushi
