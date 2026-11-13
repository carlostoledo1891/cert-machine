import Mathlib
import Printed
import Printed1

/-!
# Planted1.lean — planted WRONG variants of `KN1Printed.Conjecture1` (controls), and its neighbours

Definitions only (each a `Prop`); nothing is proved here. The statements a later stage must prove about them are
listed in `OBLIGATIONS1.md`.

Each planted variant differs from `Conjecture1` in ONE named place. A bridge that proves "their statement ↔ one
of these" has not shown that their statement is Conjecture 1. For each: what was changed, and what I believe
about it —

* PROVABLY FALSE, with a counterexample worked out in exact rationals (Planted 1–11);
* TRUE-BUT-DIFFERENT: a statement that is true, hence not an open conjecture (Planted 12–15);
* UNKNOWN (Planted 16–17).

For reference, `Conjecture1` is

    ∀ V [Finite V] G p A o b m,
      (∃ a ∈ A, P(a ↔ b) = m) → (∀ a ∈ A, m ≤ P(a ↔ b)) → P(o ↔ b) ≥ P(o ↔ A) · m.

Notation in the counterexamples. "Two vertices, no edge" is the graph `⊥` on `Bool` (vertices `false`, `true`);
"one vertex" is `⊥` on `Unit`. On a graph with no edge, P(x ↔ y) is 1 if x = y and 0 otherwise, and P(x ↔ A) is
1 if x ∈ A and 0 otherwise; the sealed `Check.lean` and `PlantedCheck.lean` already prove what is needed for this
(`prob_connEvent_bot`, `prob_connEvent_of_eq`, `prob_connSetEvent_of_mem`).

Every fraction below was computed by hand and then recomputed by exact enumeration of the edge configurations.

Lean note. Planted 5, 10, 14 (`Finset`, `∑`, `∏`), Planted 11 (`min`), Planted 12 (`⨅ a ∈ A` in `ℝ`),
Planted 15 (an event written in place), Neighbour 5 (an edge named inside the statement), Neighbour 11 (`∉`) and
Neighbour 12 (a set written in place) use forms that the sealed files do not use in a statement: UNVERIFIED
(never elaborated; there is no Lean on the machine where this was written). Each definition stands alone, so one
that fails to elaborate does not take the others with it.
-/

namespace KN1Planted

open KN3Printed

/-! ## Planted variants believed PROVABLY FALSE -/

/-- PLANTED 1 — `max` in place of `min`: m is the GREATEST element of {P(a ↔ b) : a ∈ A}.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = both vertices.
The set of values is {P(false ↔ true), P(true ↔ true)} = {0, 1}, its greatest element is m = 1.
Left side P(o ↔ b) = 0. Right side P(o ↔ A) · m = 1 · 1 = 1 (o ∈ A). 0 ≥ 1 fails.
(With the minimum, m = 0 and the inequality 0 ≥ 0 holds.)

A second counterexample, with no vertex of {o, b} in A: four vertices o, a₁, a₂, b; edges {o, a₁}, {a₁, b},
{o, a₂}, each open with probability 1/2; A = {a₁, a₂}. P(o ↔ b) = 1/4, P(o ↔ A) = 3/4, P(a₁ ↔ b) = 1/2,
P(a₂ ↔ b) = 1/8. With the maximum: 3/4 · 1/2 = 3/8 > 1/4. (With the minimum: 3/4 · 1/8 = 3/32 ≤ 1/4.) -/
def Planted1_maxInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, prob G p (connEvent G a b) ≤ m) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- PLANTED 2 — "for all a ∈ A" where the minimum needs "for some a ∈ A": the inequality with P(a ↔ b) asserted
for EVERY point a of A.

Belief: PROVABLY FALSE (it says the same as Planted 1). The paper itself: "in any graph G, any A and any a ∈ A
we have (42). This is clearly false" (proof of Theorem 13, page 37). Counterexample: two vertices, no edge;
o = `false`, b = `true`, A = both vertices; a = `true`: P(o ↔ b) = 0, P(o ↔ A) · P(a ↔ b) = 1 · 1 = 1.
0 ≥ 1 fails. -/
def Planted2_forAllAInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    ∀ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

/-- PLANTED 3 — the inequality reversed: `≤` in place of the printed `≥`.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = b = `false`, A = {`true`}.
m = P(true ↔ false) = 0 (the only value). Left side P(o ↔ b) = P(false ↔ false) = 1.
Right side P(o ↔ A) · m = 0 · 0 = 0. 1 ≤ 0 fails. -/
def Planted3_inequalityReversed : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≤ prob G p (connSetEvent G o A) * m

/-- PLANTED 4 — a strict inequality: `>` in place of the printed `≥`.

Belief: PROVABLY FALSE. Counterexample: one vertex; o = b = that vertex, A = {that vertex}. m = P(o ↔ o) = 1.
Left side 1. Right side P(o ↔ A) · m = 1 · 1 = 1. 1 > 1 fails. -/
def Planted4_strictInequality : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) > prob G p (connSetEvent G o A) * m

/-- PLANTED 5 — the SUM over A in place of the minimum: P(0 ↔ A) · Σ_{a ∈ A} P(a ↔ b). (A is a `Finset` here so
that the sum can be written.)

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = both vertices.
Σ = P(false ↔ true) + P(true ↔ true) = 0 + 1 = 1. Left side P(o ↔ b) = 0. Right side 1 · 1 = 1. 0 ≥ 1 fails.

UNVERIFIED: `Finset`, its coercion to `Set`, and `∑ a ∈ A, …` are not used in the sealed files. -/
def Planted5_sumInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Finset V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o (A : Set V)) * (∑ a ∈ A, prob G p (connEvent G a b))

/-- PLANTED 6 — the hypothesis "A is nonempty" dropped from the "for some a ∈ A" form
(`KN1Printed.Conjecture1_existsForm`): the minimum is asserted to EXIST for every A.

Belief: PROVABLY FALSE. Counterexample: one vertex, A = ∅: there is no a ∈ A at all. -/
def Planted6_existsWithoutNonempty : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

/-- PLANTED 7 — the factor P(0 ↔ A) dropped: P(0 ↔ b) ≥ min{P(a ↔ b) : a ∈ A}.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = {`true`}.
m = P(true ↔ true) = 1. Left side P(o ↔ b) = 0. 0 ≥ 1 fails. -/
def Planted7_factorDropped : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ m

/-- PLANTED 8 — the wrong event under the minimum: min{P(0 ↔ a) : a ∈ A} in place of min{P(a ↔ b) : a ∈ A}.

Belief: PROVABLY FALSE. Counterexample: two vertices, no edge; o = `false`, b = `true`, A = {`false`}.
m = P(o ↔ o) = 1. Left side P(o ↔ b) = 0. Right side P(o ↔ A) · m = 1 · 1 = 1. 0 ≥ 1 fails. -/
def Planted8_minOverWrongEvent : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G o a) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G o a)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- PLANTED 9 — a constant factor 2 on the right-hand side.

Belief: PROVABLY FALSE. Counterexample: one vertex; o = b = that vertex, A = {that vertex}; m = 1.
Left side 1. Right side 2 · (1 · 1) = 2. 1 ≥ 2 fails. -/
def Planted9_constantTwo : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ 2 * (prob G p (connSetEvent G o A) * m)

/-- PLANTED 10 — P(0 ↔ A) replaced by the SUM Σ_{a ∈ A} P(0 ↔ a) (the union bound, used as if it were an
equality). (A is a `Finset` here so that the sum can be written.)

Belief: PROVABLY FALSE. On graphs with no edge this variant agrees with the conjecture, so the counterexample
needs an edge: two vertices joined by one edge that is open with probability 1; o = b = `false`,
A = both vertices. Σ = P(false ↔ false) + P(false ↔ true) = 1 + 1 = 2; m = min{1, 1} = 1.
Left side P(o ↔ b) = 1. Right side 2 · 1 = 2. 1 ≥ 2 fails.
(The same with edge probability 3/4: Σ = 1 + 3/4 = 7/4, m = min{1, 3/4} = 3/4, right side 21/16 > 1.)

UNVERIFIED: `Finset`, its coercion to `Set` (in `a ∈ A` below, membership in the `Finset`), `∑ a ∈ A, …`. -/
def Planted10_sumInPlaceOfSetEvent : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Finset V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ (∑ a ∈ A, prob G p (connEvent G o a)) * m

/-- PLANTED 11 — the product of the two factors replaced by the smaller of the two:
P(0 ↔ b) ≥ min(P(0 ↔ A), min{P(a ↔ b) : a ∈ A}).

Belief: PROVABLY FALSE. With all probabilities 0 or 1 this variant agrees with the conjecture, so the
counterexample needs a fractional probability: three vertices o, a, b; edges {o, a} and {a, b}, each open with
probability 1/2 (no edge {o, b}, or one with probability 0); A = {a}. P(o ↔ A) = P(o ↔ a) = 1/2;
m = P(a ↔ b) = 1/2. Left side P(o ↔ b) = 1/2 · 1/2 = 1/4. Right side min(1/2, 1/2) = 1/2. 1/4 ≥ 1/2 fails.
(The conjecture's own right side is 1/2 · 1/2 = 1/4: equality.)

UNVERIFIED: `min` of two real numbers is not used in the sealed `Printed.lean` / `Planted.lean` (it is used in
a proof in `PlantedCheck.lean`). -/
def Planted11_minOfTheTwoFactors : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ min (prob G p (connSetEvent G o A)) m

/-! ## Planted variants believed TRUE (hence different from an open conjecture) -/

/-- PLANTED 12 — the minimum written as the REAL-valued infimum with membership as a second index:
`⨅ a ∈ A, P(a ↔ b)` in `ℝ`. This is the form a formalizer is most likely to type.

Belief: PROVABLY TRUE, and trivially so — not the conjecture. In `ℝ` (not a complete lattice) Mathlib gives the
infimum over an empty index the value 0. So `⨅ a ∈ A, f a` is the infimum over ALL vertices a of the function
that is f a for a ∈ A and 0 for a ∉ A. Since every f a = P(a ↔ b) ≥ 0 and there are finitely many vertices,
call that infimum I; then I ≥ 0 and I ≤ (the value at a = 0). If 0 ∉ A the value at 0 is 0, so I = 0 and the
statement reads P(0 ↔ b) ≥ 0. If 0 ∈ A the value at 0 is P(0 ↔ b), so P(0 ↔ A) · I ≤ 1 · I ≤ P(0 ↔ b).
In both cases the statement holds, for every graph, with no percolation argument at all.
(The correct real-valued infimum is over the subtype: `KN1Printed.Conjecture1_iInf`.)

UNVERIFIED: `⨅ a ∈ A, …` in `ℝ` is not used in the sealed files. -/
def Planted12_realIInfOverMembership : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o A) * (⨅ a ∈ A, prob G p (connEvent G a b))

/-- PLANTED 13 — P(0 ↔ A) replaced by P(0 ↔ a) for the same a: "for some a ∈ A, P(0 ↔ b) ≥ P(0 ↔ a) P(a ↔ b)".

Belief: TRUE-BUT-DIFFERENT. It is the Harris–FKG inequality and holds for EVERY vertex a
(`Neighbour1_HarrisFKG`): {0 ↔ a} and {a ↔ b} are increasing events and their intersection is inside {0 ↔ b}.
It is weaker than the conjecture because P(0 ↔ a) ≤ P(0 ↔ A) for a ∈ A; the whole content of Conjecture 1 is the
replacement of the point a by the set A in the first factor. -/
def Planted13_pointInPlaceOfSet : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V), A.Nonempty →
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connEvent G o a) * prob G p (connEvent G a b)

/-- PLANTED 14 — the PRODUCT over A in place of the minimum: P(0 ↔ A) · Π_{a ∈ A} P(a ↔ b). (A is a `Finset`
here so that the product can be written.)

Belief: TRUE-BUT-DIFFERENT. By the Harris–FKG inequality for the increasing events {0 ↔ A} and {a ↔ b}, a ∈ A:
P(0 ↔ A and a ↔ b for all a ∈ A) ≥ P(0 ↔ A) · Π P(a ↔ b); and on that event 0 is joined to some a ∈ A, which is
joined to b. (For A = ∅ the right side is 0 · 1 = 0.) It is weaker than the conjecture: a product of numbers in
[0, 1] is at most the smallest of them.

UNVERIFIED: `Finset`, its coercion to `Set`, and `∏ a ∈ A, …` are not used in the sealed files. -/
def Planted14_productInPlaceOfMin : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Finset V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o (A : Set V)) * (∏ a ∈ A, prob G p (connEvent G a b))

/-- PLANTED 15 — "0 ↔ A" read as "0 is connected to EVERY point of A" (the paper's "0 ↔ A" is "to SOME point of
A", by its definitions of C(A) and C(A; B), §2.1, page 4).

Belief: TRUE-BUT-DIFFERENT. If m is the least value, attained at a₀ ∈ A, then
P(0 ↔ every a ∈ A) · m ≤ P(0 ↔ a₀) · P(a₀ ↔ b) ≤ P(0 ↔ b) by the Harris–FKG inequality. -/
def Planted15_connectedToAllOfA : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p {ω : Config G | ∀ a ∈ A, Joined G ω o a} * m

/-! ## Planted variants of UNKNOWN status -/

/-- PLANTED 16 — one common probability q on all edges (the paper's P_p, "the percolation measure with the
constant function p", page 4) in place of "arbitrary probabilities on its edges".

Belief: UNKNOWN (open). It is a special case of `Conjecture1`, hence follows from it. The paper asserts the
converse as a remark with a sketch, even for q = 1/2 (§5.6, item 1, page 36: "It is possible to assume that all
edges have probability 1/2", by replacing every edge by a gadget graph and passing to a limit); that is an
argument that changes the graph, not a reading of the sentence. A statement equivalent to this one is not shown
to be Conjecture 1 without that argument. -/
def Planted16_oneCommonProbability : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (q : Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G (fun _ => q) (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G (fun _ => q) (connEvent G a b)) →
    prob G (fun _ => q) (connEvent G o b) ≥ prob G (fun _ => q) (connSetEvent G o A) * m

/-- PLANTED 17 — a constant factor 1/2 on the right-hand side.

Belief: UNKNOWN. It follows from `Conjecture1` (the right side is nonnegative) and is strictly weaker as a tool:
it does not give the paper's Conjecture 3. I know no proof of it. (With 1/|A| in place of 1/2 it is true: by
the union bound some a ∈ A has P(0 ↔ a) ≥ P(0 ↔ A)/|A|, then Harris–FKG.) -/
def Planted17_constantHalf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ 1 / 2 * (prob G p (connSetEvent G o A) * m)

/-! ## Neighbours (not planted errors: statements near Conjecture 1 that are NOT it as printed) -/

/-- NEIGHBOUR 1 — the Harris–FKG inequality for connections: P(0 ↔ b) ≥ P(0 ↔ a) · P(a ↔ b) for every three
vertices. The paper: "The Fortuin-Kasteleyn-Ginibre inequality (… also known as 'the Harris inequality') states
that for any two increasing functions f and g one has E(fg) ≥ E(f)E(g)" (§2.1, page 5).

Status: TRUE (a classical fact). It is Conjecture 1 for A = {a}. -/
def Neighbour1_HarrisFKG : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (o a b : V),
    prob G p (connEvent G o b) ≥ prob G p (connEvent G o a) * prob G p (connEvent G a b)

/-- NEIGHBOUR 2 — **Conjecture 2** of the same paper (page 3), "the pre-FKG conjecture":
"Let G, 0, b and A be as in conjecture 1. Then P(0 ↔ b) ≥ min{P(0 ↔ A, a ↔ b) : a ∈ A}."

The minimum is read as in `Conjecture1`. Status: UNKNOWN (open; "we believe the following stronger inequality …
might also be true"). The paper: "Conjecture 1 follows from conjecture 2 by an application of the FKG
inequality"; the converse is not claimed. -/
def Neighbour2_Conjecture2_preFKG : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connSetEvent G o A ∩ connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connSetEvent G o A ∩ connEvent G a b)) →
    prob G p (connEvent G o b) ≥ m

/-- NEIGHBOUR 3 — inequality (3) of the paper (page 3), "the following formally stronger version of
conjecture 2": P(0 ↔ b, 0 ↔ A) ≥ min{P(0 ↔ A, a ↔ b) : a ∈ A}.

Status: UNKNOWN in general; the paper proves it for |A| = 2 (Theorem 1) and in some cases with |A| = 3
(Theorems 2 and 3). It implies `Neighbour2_Conjecture2_preFKG` at once (the left side only got smaller). -/
def Neighbour3_inequality3 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connSetEvent G o A ∩ connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connSetEvent G o A ∩ connEvent G a b)) →
    prob G p (connEvent G o b ∩ connSetEvent G o A) ≥ m

/-- NEIGHBOUR 4 — **Question 7** of the paper (page 36): "Let a ∈ A satisfy P(a ↔ b) ≤ P(a' ↔ b) ∀a' ∈ A, i.e.
a is the minimiser among the points of A. Is it true that in this case
P(0 ↔ b, 0 ↔ A) ≥ P(0 ↔ A, a ↔ b)? (41)"

Status: a QUESTION in the paper ("Numerical evidence points towards an answer of 'yes' … but we are rather
hesitant"). It implies `Conjecture1` by the FKG inequality. -/
def Neighbour4_Question7 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b a : V),
    a ∈ A →
    (∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b)) →
    prob G p (connEvent G o b ∩ connSetEvent G o A) ≥ prob G p (connSetEvent G o A ∩ connEvent G a b)

/-- NEIGHBOUR 5 — **Conjecture 6** of the paper (§5.3, page 34), the gluing conjecture: "Let G be a graph, let
A ⊂ G and 0, b ∈ G. Denote by a … the minimiser of P(a ↔ b) among the points of A. Let {v, w} be an arbitrary
edge and assume P_G(x ↔ b) ≥ P_G(x ↔ A) P_G(a ↔ b) ∀x ∈ {v, w}. (39) Then
P_{G ⏚ {v,w}}(v ↔ b) ≥ P_{G ⏚ {v,w}}(v ↔ A) P_{G ⏚ {v,w}}(a ↔ b). (40)"

"G ⏚ e is the graph G with the probability that e is open set to 1" (page 34): here `p'` agrees with `p` off
the edge {v, w} and is 1 on it. The vertex 0 of the printed statement is not used by it. My reading choices for
THIS statement (finite graph; every minimiser a, taken in G; the edge is an edge of G) are not examined in
`READING1.md`: it is recorded as a neighbour, not adjudicated.

Status: UNKNOWN (a conjecture of the paper). The paper: "Conjecture 6 implies the post-FKG conjecture,
conjecture 1" (Lemma 13, a proof sketch).

UNVERIFIED: naming the edge `⟨s(v, w), h⟩` inside the statement, and `e ≠ …` on `G.edgeSet`. -/
def Neighbour5_Conjecture6_gluing : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p p' : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b a v w : V) (h : s(v, w) ∈ G.edgeSet),
    a ∈ A →
    (∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b)) →
    (∀ e : G.edgeSet, e ≠ (⟨s(v, w), h⟩ : G.edgeSet) → p' e = p e) →
    (p' ⟨s(v, w), h⟩ : ℝ) = 1 →
    prob G p (connEvent G v b) ≥ prob G p (connSetEvent G v A) * prob G p (connEvent G a b) →
    prob G p (connEvent G w b) ≥ prob G p (connSetEvent G w A) * prob G p (connEvent G a b) →
    prob G p' (connEvent G v b) ≥ prob G p' (connSetEvent G v A) * prob G p' (connEvent G a b)

/-- NEIGHBOUR 6 — **Conjecture 3** of the same paper (§4, page 15), as sealed in `Printed.lean`: "a weaker
version of conjecture 1"; "Conjecture 3 clearly follows from conjecture 1 (by taking δ = 1 − √(1 − ε))".

Status: per the paper, open and implied by Conjecture 1; the converse is not claimed anywhere in the paper.
A statement equivalent to this one is Conjecture 3, not Conjecture 1. -/
def Neighbour6_Conjecture3 : Prop :=
  KN3Printed.Conjecture3

/-- NEIGHBOUR 7 — the same inequality on COUNTABLE graphs, the minimum read as an infimum (every lower bound),
as in `KN1Printed.Conjecture1_lowerBound`. The printed sentence says "finite graph", so this is not a reading of
it.

Status: implies `Conjecture1` at once. I believe the converse (exhaust the graph by finite subgraphs: first let
the subgraph grow with a finite part of A fixed, then let that part grow), but that is a proof, not a
reading. -/
def Neighbour7_countableGraph : Prop :=
  ∀ (V : Type) [Countable V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- NEIGHBOUR 8 — every edge probability STRICTLY between 0 and 1 (the paper's are in the closed interval:
"p : E(G) → [0, 1]", and it uses both 0 and 1 — "we set their weight to ε, and otherwise to 0", page 13;
"edges with weight 1", page 32).

Status: a special case of `Conjecture1`. I believe the converse (on a fixed finite graph every probability in
the statement is a polynomial in the edge probabilities, hence continuous, and `≥` passes to the limit), but
that is a proof, not a reading. -/
def Neighbour8_probabilitiesStrictlyInside : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ e : G.edgeSet, 0 < (p e : ℝ) ∧ (p e : ℝ) < 1) →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- NEIGHBOUR 9 — every edge has probability 1/2: the paper's first "simple reduction" (§5.6, item 1, page 36),
"It is possible to assume that all edges have probability 1/2 … This allows to reformulate the problem as a
counting problem."

Status: a special case of `Conjecture1`; the paper sketches the converse (gadget graphs and a limit). -/
def Neighbour9_allEdgesHalf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ e : G.edgeSet, (p e : ℝ) = 1 / 2) →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- NEIGHBOUR 10 — side conditions that are not printed: 0 ≠ b, 0 ∉ A, b ∉ A.

Status: a special case of `Conjecture1`. The cases 0 = b and 0 ∈ A are true outright. The case b ∈ A is NOT
trivial (the paper treats it as the essential case of the pre-FKG form: "to prove (2) it is enough to prove it
in the case b ∈ A", page 3); I believe it reduces to b ∉ A by hanging a new vertex on b by an edge of
probability 1 and using the new vertex as b, but that is a proof, not a reading. -/
def Neighbour10_sideConditions : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), o ≠ b → o ∉ A → b ∉ A →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- NEIGHBOUR 11 — 0 and b not neighbours: the paper's third "simple reduction" (§5.6, item 3, page 36), "It is
possible to assume that 0 ≁ b".

Status: a special case of `Conjecture1`; the paper sketches the converse (concavity in the probability of the
edge {0, b}). -/
def Neighbour11_notAdjacent : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), s(o, b) ∉ G.edgeSet →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- NEIGHBOUR 12 — A a level set of a ↦ P(a ↔ b): the paper's fourth "simple reduction" (§5.6, item 4, page 37),
"It is possible to restrict to sets A of the sort {a ∈ G : P(a ↔ b) > p} for some p ∈ [0, 1]" (the level is
called `t` here; the paper gives no argument).

Status: a special case of `Conjecture1`; the converse is asserted by the paper without proof. -/
def Neighbour12_levelSets : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (o b : V) (t m : ℝ), 0 ≤ t → t ≤ 1 →
    (∃ a ∈ {x : V | prob G p (connEvent G x b) > t}, prob G p (connEvent G a b) = m) →
    (∀ a ∈ {x : V | prob G p (connEvent G x b) > t}, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o {x : V | prob G p (connEvent G x b) > t}) * m

end KN1Planted
