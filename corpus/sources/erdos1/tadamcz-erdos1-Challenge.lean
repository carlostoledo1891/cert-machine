import Mathlib

/-!
# Erdős problem #1: disproof

*Reference:* [erdosproblems.com/1](https://www.erdosproblems.com/1)

A finite set `A ⊆ {1, …, N}` is *sum-distinct* (or *dissociated*) if the map `S ↦ ∑_{a ∈ S} a` on
subsets `S ⊆ A` is injective. Erdős asked whether a sum-distinct set of size `n` in `{1, …, N}`
forces `N ≫ 2^n`, that is, whether there is an absolute constant `C > 0` with `N > C · 2^n`. He
called this "perhaps my first serious problem" and dated it to 1931 [Er98]; erdosproblems.com
lists a $500 prize. Taking `A = {1, 2, 4, …, 2^{n-1}}` shows `N ≤ 2^{n-1}` is possible, and the
best previous construction is Bohman's `N ≤ 0.22002 · 2^n` [Bo98]. The best lower bound is `N ≫
2^n / √n`, first proved by Erdős and Moser [Er56].

The conjecture is **false**: for every `ε > 0` there are arbitrarily large `n` and sum-distinct
sets `A ⊆ {1, …, N}` with `|A| = n` and `N ≤ ε · 2^n`. Formally, the theorem proved is the
negation of the Formal Conjectures statement `Erdos1.erdos_1`. As noted in the FrontierMath Erdős
paper, the argument as formalized is ineffective: it gives no bound on how large `n` must be in
terms of `ε`.

This file is the small statement surface a reader should audit: the theorem
`Erdos1.erdos_1.disproof` below is the compared declaration, and the conjecture is refuted (its
negation is proved) in `Solution.lean` and the module it imports. Only the theorem's `sorry` is
filled in there.

The definitions and the statement inside this file are copied verbatim from
`FormalConjectures/ErdosProblems/1.lean` in [Formal Conjectures](https://github.com/google-deepmind/formal-conjectures) (Google DeepMind,
Apache-2.0) at commit `488aade228ec37880b8fec178c173c07d279bb53`, which is the statement the AI system was
given in the FrontierMath Erdős benchmark (isolated statement file
`apn/data/erdos/Isolated/Erdos1.erdos_1.lean` in [LeanOpenProblems](https://github.com/epoch-research/LeanOpenProblems) at commit
`77882c437ca1dfefab3b27fa00f1d29788100311`).
-/
open Filter

namespace Erdos1

/--
A finite set of naturals $A$ is said to be a sum-distinct set for $N \in \mathbb{N}$ if
$A\subseteq\{1, ..., N\}$ and the sums $\sum_{a\in S}a$ are distinct for all $S\subseteq A$
-/
abbrev IsSumDistinctSet (A : Finset ℕ) (N : ℕ) : Prop :=
    A ⊆ Finset.Icc 1 N ∧ (fun (⟨S, _⟩ : A.powerset) => S.sum id).Injective

/--
**Disproof of Erdős problem #1.** The bracketed statement is the conjecture `erdos_1` exactly as
formalized in Formal Conjectures: there is an absolute constant $C > 0$ such that whenever
$A \subseteq \{1, \ldots, N\}$ (with $N \neq 0$) has distinct subset sums, $C \cdot 2^{|A|} < N$.
This theorem says no such constant exists: for every $\varepsilon > 0$ there are sum-distinct sets
$A \subseteq \{1, \ldots, N\}$ with $N \leq \varepsilon\, 2^{|A|}$.
-/
theorem erdos_1.disproof : ¬ (∃ C > (0 : ℝ), ∀ (N : ℕ) (A : Finset ℕ) (_ : IsSumDistinctSet A N),
    N ≠ 0 → C * 2 ^ A.card < N) := by
  sorry

end Erdos1
