/-!
# Planted.lean — planted WRONG variants of `KN3Printed.Conjecture3` (red controls), and four neighbours

A FRAGMENT: it has no `import` line and is compiled appended to `Printed.lean`
(`combine.sh` writes `tmp/PrintedPlanted.lean = Printed.lean ++ Planted.lean`). It uses only the definitions of
`Printed.lean`.

Each planted variant differs from `Conjecture3` in ONE named place. A bridge that proves "their statement ↔ one of
these" has not shown that their statement is Conjecture 3. For each: what was changed, and what I believe about it
(PROVABLY FALSE / PROVABLY TRUE, hence different from an open conjecture / UNKNOWN). Where the belief is proved in
Lean, the proof is in `PlantedCheck.lean` and is named here.

For reference, `Conjecture3` is

    ∀ ε > 0, ∃ δ > 0, ∀ V [Finite V] G p A o b,
      P(o ↔ A) > 1 − δ → (∀ a ∈ A, P(a ↔ b) > 1 − δ) → P(o ↔ b) > 1 − ε.
-/

namespace KN3Planted

open KN3Printed

/-! ## Planted wrong variants -/

/-- PLANTED 1 — quantifiers swapped: `∃ δ` moved after the graph, the probabilities, A, 0 and b, so δ may depend
on all of them (the paper: "there exists δ > 0 such that for any graph G …").

Belief: PROVABLY TRUE, and trivially so — not the conjecture. Fix G, p, A, o, b. If P(o ↔ A) < 1 take
δ = 1 − P(o ↔ A): the first hypothesis fails. If some P(a ↔ b) < 1 take δ = 1 − P(a ↔ b): the second fails.
Otherwise P(o ↔ A) = 1 and every P(a ↔ b) = 1 with A finite, so almost surely o is joined to some a ∈ A and every
a ∈ A is joined to b, hence P(o ↔ b) = 1 > 1 − ε. Not proved in Lean here. -/
def Planted1_deltaAfterGraph : Prop :=
  ∀ ε : ℝ, 0 < ε →
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      ∃ δ : ℝ, 0 < δ ∧
        (prob G p (connSetEvent G o A) > 1 - δ →
        (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
        prob G p (connEvent G o b) > 1 - ε)

/-- PLANTED 2 — a hypothesis dropped: `0 < δ` removed (the paper: "there exists δ > 0").

Belief: PROVABLY TRUE, vacuously (δ = −1 makes "P(o ↔ A) > 2" impossible).
Proved: `KN3Planted.planted2_true` in `PlantedCheck.lean`. -/
def Planted2_deltaNotPositive : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ,
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

/-- PLANTED 3 — an inequality reversed: the conclusion reads `P(o ↔ b) < 1 − ε` (the paper: "> 1 − ε").

Belief: PROVABLY FALSE (one vertex, o = b, A = {o}: every probability is 1, and 1 < 1 − ε fails).
Proved: `KN3Planted.planted3_false` in `PlantedCheck.lean`. -/
def Planted3_conclusionReversed : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) < 1 - ε

/-- PLANTED 4 — a hypothesis dropped: "P(a ↔ b) > 1 − δ for all a ∈ A" removed.

Belief: PROVABLY FALSE (two vertices, no edge, A = {o}, b the other vertex: P(o ↔ A) = 1 and P(o ↔ b) = 0; take
ε = 1). Proved: `KN3Planted.planted4_false` in `PlantedCheck.lean`. -/
def Planted4_hypothesisDropped : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      prob G p (connEvent G o b) > 1 - ε

/-- PLANTED 5 — a quantifier changed inside the hypothesis: "for all a ∈ A" became "for some a ∈ A".

Belief: PROVABLY FALSE (two vertices, no edge, A = both vertices: P(o ↔ A) = 1 because o ∈ A, and a = b gives
P(a ↔ b) = 1, yet P(o ↔ b) = 0; take ε = 1). Proved: `KN3Planted.planted5_false` in `PlantedCheck.lean`. -/
def Planted5_existsInsteadOfForall : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∃ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

/-- PLANTED 6 — a constant changed: "there exists δ" replaced by δ = ε itself.

Belief: PROVABLY FALSE. The path o — a — b with both edges open with probability 3/5 and A = {a}:
P(o ↔ A) = P(a ↔ b) = 3/5 > 1 − 1/2, while P(o ↔ b) = 9/25 < 1 − 1/2; take ε = 1/2.
(Conjecture 1 would only give δ = 1 − √(1 − ε) < ε.) Not proved in Lean here. -/
def Planted6_deltaIsEpsilon : Prop :=
  ∀ ε : ℝ, 0 < ε →
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - ε →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - ε) →
      prob G p (connEvent G o b) > 1 - ε

/-! ## Neighbours (not planted errors: statements near Conjecture 3 that are NOT it as printed) -/

/-- NEIGHBOUR 1 — **Conjecture 1** of the same paper (page 3), "the post-FKG conjecture":
"Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two vertices and let A ⊂ G be
a set of vertices. Then P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}."

The minimum over a finite nonempty A is attained, and P(0 ↔ A) ≥ 0, so the inequality says: some a ∈ A has
P(0 ↔ b) ≥ P(0 ↔ A) · P(a ↔ b). For A = ∅ the minimum is not defined and P(0 ↔ A) = 0; that case is left out.

Status: UNKNOWN (open; the paper: "We were not able to prove or disprove this conjecture"). It implies
Conjecture 3 ("clearly follows … by taking δ = 1 − √(1 − ε)", page 15); the converse is not claimed anywhere in
the paper. A statement equivalent to this one is Conjecture 1, not Conjecture 3. -/
def Neighbour1_Conjecture1 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V), A.Nonempty →
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

/-- NEIGHBOUR 2 — every edge has the SAME probability q (the paper's P_p, "the percolation measure with the
constant function p", page 4), δ still depending on ε only.

Status: UNKNOWN. It follows from `Conjecture3` (a special case of p). I do not claim the converse: on simple
graphs a constant probability cannot represent the merged parallel edges that the paper's own use of Conjecture 3
produces (the contracted graph K_ξ, proof of Lemma 10, Step V, pages 20–22), so this is weaker as a tool. -/
def Neighbour2_constantProbability : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (q : Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G (fun _ => q) (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G (fun _ => q) (connEvent G a b) > 1 - δ) →
      prob G (fun _ => q) (connEvent G o b) > 1 - ε

/-- NEIGHBOUR 3 — "A ⊂ G" read as a PROPER subset (Lean's `⊂` is strict; the paper's is not: it defines the
notation as "A ⊆ G" and then writes "A ⊂ G" throughout).

Status: equivalent to `Conjecture3` by a one-line mathematical argument (add an isolated vertex to G: no
probability changes and A becomes proper), but not the same statement; the equivalence is not proved here. -/
def Neighbour3_properSubset : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V), A ≠ Set.univ →
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

/-- NEIGHBOUR 4 — A assumed NONEMPTY (the paper does not say so; with A = ∅ the event {0 ↔ A} is empty).

Status: EQUIVALENT to `Conjecture3`, proved: `KN3Planted.conjecture3_iff_neighbour4` in `PlantedCheck.lean`
(shrink δ to at most 1; then A = ∅ contradicts "P(0 ↔ A) > 1 − δ"). So this choice does not matter. -/
def Neighbour4_nonemptyA : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V), A.Nonempty →
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε

end KN3Planted
