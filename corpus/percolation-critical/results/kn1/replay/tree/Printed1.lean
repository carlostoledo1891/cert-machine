import Mathlib
import Printed

/-!
# Kozma–Nitzan, Conjecture 1 ("the post-FKG conjecture"), written by hand from the printed text

Source: Gady Kozma and Shahaf Nitzan, *A reduction of the θ(p_c) = 0 problem to a conjectured inequality*,
arXiv:2401.12397v1 (22 Jan 2024; the only arXiv version), §1 "Introduction", page 3 of the PDF:

> **Conjecture 1.** Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two
> vertices and let A ⊂ G be a set of vertices. Then
> P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}. (1)

Everything below is written from that paper alone, with Mathlib only, on top of the definitions of the sealed
file `Printed.lean` (namespace `KN3Printed`: `Config`, `coin`, `percolationMeasure`, `Joined`, `connEvent`,
`connSetEvent`, `prob`), which are reused and not redefined. Clean room: written without ever seeing any other
formalization of this conjecture. See `READING1.md` for the phrase-by-phrase table (choices B1–B18) and
`OBLIGATIONS1.md` for the relations between the definitions below that a later stage must prove.

This file contains definitions only: each is a `Prop`, none is proved here.

The primary reading is `Conjecture1`: the number written "min{P(a ↔ b) : a ∈ A}" is the least element of that
set of numbers (a value that is attained at a point of A and is below every other value), and the inequality is
asserted for it. All the other definitions in this file are readings of the same sentence that I judge
defensible; for each one the docstring says whether I believe it equivalent to the primary, and by what
argument.

Lean note. Nothing in this file was ever elaborated (there is no Lean on the machine where it was written).
`Conjecture1`, `Conjecture1_existsForm`, `Conjecture1_minimiser`, `Conjecture1_lowerBound`,
`Conjecture1_distinct` and `Conjecture1_properSubset` use only syntax and names that already occur in the
statements of the sealed files; `Conjecture1_emptyMinIs` and `Conjecture1_onFin` add small steps (`A = ∅`, a
disjunction, a parameter, `Fin n`). `Conjecture1_isLeast` (`IsLeast`), `Conjecture1_sInf` (`sInf`),
`Conjecture1_iInf` (`⨅ a : A, …`) and `Conjecture1_ennreal` (`⨅ a ∈ A, …` in `ℝ≥0∞`) use Mathlib forms that
the sealed files do not use: they are marked UNVERIFIED and placed last. Each definition stands alone, so one
that fails to elaborate does not take the others with it.
-/

namespace KN1Printed

open KN3Printed

/-! ## The primary reading -/

/-- **Conjecture 1** of arXiv:2401.12397v1 (§1, page 3), as printed:

"Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two vertices and let A ⊂ G
be a set of vertices. Then P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}."

* "a finite graph": a simple graph `G` on a finite vertex type `V` (`[Finite V]`).
* "with arbitrary probabilities on its edges": any `p : E(G) → [0,1]` ("a function p : E(G) → [0, 1]", §2.1,
  page 4), the endpoints 0 and 1 included; `P` is the percolation measure of `p`.
* "0, b ∈ G two vertices": any `o b : V`, not assumed distinct, not assumed outside A.
* "A ⊂ G a set of vertices": any `A : Set V` (the paper's ⊂ is not strict), the whole vertex set and the empty
  set included.
* "min{P(a ↔ b) : a ∈ A}": the number `m` that is the least element of the set {P(a ↔ b) : a ∈ A} — it is a
  member of the set (`∃ a ∈ A, P(a ↔ b) = m`) and it is below every member (`∀ a ∈ A, m ≤ P(a ↔ b)`).
  For a nonempty A (finite, since G is) there is exactly one such `m`. For A = ∅ there is none, and the
  statement says nothing about that case; `READING1.md` (B8) shows that every convention for the minimum of the
  empty set gives a statement equivalent to this one, because P(0 ↔ ∅) = 0.
* "≥": not strict, in the direction printed; the product is the product of real numbers. -/
def Conjecture1 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-! ## Other defensible readings of the same sentence -/

/-- Reading "for some a ∈ A": the paper's own working form of the conjecture. §5.6, item 3 (page 36): "Our
assumption is that the conjecture holds for G₀ (for some a ∈ A). At G₁, though, the conjecture holds trivially,
for all a ∈ A"; and the proof of Lemma 13 (page 34) concludes "conjecture 1 for G" from the inequality
P(v ↔ b) ≥ P(v ↔ A) P(a ↔ b) for one a ∈ A that is the minimiser in another graph.

This definition is, word for word, `KN3Planted.Neighbour1_Conjecture1` of the sealed `Planted.lean` (which, being
a fragment and not a module, cannot be imported here).

Belief: EQUIVALENT to `Conjecture1`. (→) A is nonempty and finite, so the set {P(a ↔ b) : a ∈ A} has a least
element m = P(a₀ ↔ b), and `Conjecture1` for that m gives the witness a₀. (←) if m is the least element then A
is nonempty; the witness a has m ≤ P(a ↔ b), and P(0 ↔ A) ≥ 0, so P(0 ↔ A) · m ≤ P(0 ↔ A) · P(a ↔ b) ≤
P(0 ↔ b). The hypothesis `A.Nonempty` is not printed; it is needed in this form, because for A = ∅ there is no
witness (without it the statement is false: `KN1Planted.Planted6_existsWithoutNonempty`). -/
def Conjecture1_existsForm : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V), A.Nonempty →
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

/-- Reading "for the minimiser": "the point of A where the minimum of P(a ↔ b) is achieved" (page 12);
"Denote by a … the minimiser of P(a ↔ b) among the points of A" (Conjecture 6, page 34); "a is the minimiser
among the points of A" (Question 7, page 36). The inequality is asserted for every point `a` of A at which
P(a ↔ b) is least.

Belief: EQUIVALENT to `Conjecture1`, by substituting m = P(a ↔ b) (no mathematics involved). -/
def Conjecture1_minimiser : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b a : V),
    a ∈ A →
    (∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)

/-- Reading "min as infimum, said with lower bounds": P(0 ↔ b) ≥ P(0 ↔ A) · m for EVERY lower bound m of
{P(a ↔ b) : a ∈ A} (the infimum is the greatest lower bound, and P(0 ↔ A) ≥ 0, so this is the inequality with
the infimum). No attainment is asked, and negative m are allowed.

For A = ∅ every real m is a lower bound, and the statement reads P(0 ↔ b) ≥ P(0 ↔ ∅) · m = 0 · m = 0: true.

Belief: EQUIVALENT to `Conjecture1`. (→) for A = ∅ as just said; for A nonempty take the least element m₀ of
the finite set: m ≤ m₀ and P(0 ↔ A) ≥ 0 give P(0 ↔ A) · m ≤ P(0 ↔ A) · m₀ ≤ P(0 ↔ b). (←) a least element is
a lower bound. -/
def Conjecture1_lowerBound : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- Reading "the minimum of the empty set is the number c": the family of conventions for A = ∅. The printed
sentence allows A = ∅ ("a set of vertices") and "min ∅" is not defined; this definition gives it the value `c`
and otherwise reads the minimum as `Conjecture1` does. c = 0 is Mathlib's value of a real infimum over the empty
set; c = 1 is the infimum of the empty set inside [0, 1], where probabilities live; any other real is possible.

For A = ∅ it asserts P(0 ↔ b) ≥ P(0 ↔ ∅) · c = 0 · c = 0, which is true whatever c is.

Belief: for EVERY real c, EQUIVALENT to `Conjecture1` (the extra case is true because the event {0 ↔ ∅} is
empty). The convention "min ∅ = +∞" is `Conjecture1_ennreal` below (in `ℝ≥0∞`, where 0 · ∞ = 0). -/
def Conjecture1_emptyMinIs (c : ℝ) : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (((∃ a ∈ A, prob G p (connEvent G a b) = m) ∧ (∀ a ∈ A, m ≤ prob G p (connEvent G a b))) ∨
      (A = ∅ ∧ m = c)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- Reading "two vertices" as two DISTINCT vertices: "let 0, b ∈ G be two vertices".

Belief: EQUIVALENT to `Conjecture1`. The case 0 = b is true outright: P(0 ↔ 0) = 1, and P(0 ↔ A) · m ≤ 1
because both factors are probabilities (m = P(a ↔ b) for some a). -/
def Conjecture1_distinct : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), o ≠ b →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- Reading "A ⊂ G" as a PROPER subset (Lean's `⊂` is strict; the paper's is not: §2.1 defines "A ⊆ G stands for
'A is a subset of vertices'" and then writes "A ⊂ G").

Belief: EQUIVALENT to `Conjecture1`. The case A = everything is true outright: then 0 ∈ A, so P(0 ↔ A) = 1 and
m ≤ P(0 ↔ b). -/
def Conjecture1_properSubset : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ), A ≠ Set.univ →
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- Reading "a finite graph" as a graph on the vertex set {0, …, n − 1}: the same statement with `Fin n` in
place of an arbitrary finite type `V : Type`.

Belief: EQUIVALENT to `Conjecture1`. `Conjecture1 → Conjecture1_onFin` is a special case. The converse holds
because every finite type is in bijection with some `Fin n` and every ingredient (graph, probabilities, events,
measure) is carried along the bijection; that is a proof (routine, long), not a reading. The same argument
shows that the universe of the vertex type does not matter. -/
def Conjecture1_onFin : Prop :=
  ∀ (n : ℕ) (G : SimpleGraph (Fin n)) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set (Fin n)) (o b : Fin n) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-! ## The same readings written with Mathlib's order vocabulary (UNVERIFIED syntax and names) -/

/-- `Conjecture1` with its two hypotheses on `m` packed into Mathlib's `IsLeast`: "m is the least element of the
set {P(a ↔ b) : a ∈ A}" (the set is the image of A under a ↦ P(a ↔ b)).

Belief: EQUIVALENT to `Conjecture1` by unfolding `IsLeast` and `lowerBounds` (no mathematics involved).

UNVERIFIED: the name `IsLeast` (Mathlib, `IsLeast s a ↔ a ∈ s ∧ a ∈ lowerBounds s`) is not used in the sealed
files. -/
def Conjecture1_isLeast : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    IsLeast {x : ℝ | ∃ a ∈ A, prob G p (connEvent G a b) = x} m →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m

/-- Reading "min as the infimum of the set of values", as a term: `sInf` of the set {P(a ↔ b) : a ∈ A} of real
numbers.

For A nonempty the set is finite and nonempty, and its `sInf` is its least element. For A = ∅ the set is empty
and Mathlib's `sInf (∅ : Set ℝ)` is 0 (a convention of Mathlib, not of the paper); the statement then reads
P(0 ↔ b) ≥ P(0 ↔ ∅) · 0 = 0: true.

Belief: EQUIVALENT to `Conjecture1`.

UNVERIFIED: `sInf` on `Set ℝ` is not used in the sealed files. -/
def Conjecture1_sInf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o A) * sInf {x : ℝ | ∃ a ∈ A, prob G p (connEvent G a b) = x}

/-- Reading "min as an indexed infimum over the points of A": `⨅ a : A, P(a ↔ b)`, the index being the SUBTYPE
of the points of A.

For A nonempty (finite) this infimum is the minimum. For A = ∅ the index type is empty and Mathlib's real `⨅`
over an empty index is 0; the statement then reads P(0 ↔ b) ≥ P(0 ↔ ∅) · 0 = 0: true.

Belief: EQUIVALENT to `Conjecture1`.

Warning: this is NOT the same as the real-valued `⨅ a ∈ A, P(a ↔ b)` (membership as a second index). In `ℝ` that
expression takes the value 0 at every a ∉ A, so it is 0 whenever A is not the whole vertex set; the statement
written with it is trivially true and is recorded as `KN1Planted.Planted12_realIInfOverMembership`.

UNVERIFIED: `⨅ a : A, …` with `A : Set V` used as a type, and the coercion `(a : V)`, are not used in the
sealed files. -/
def Conjecture1_iInf : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    prob G p (connEvent G o b) ≥
      prob G p (connSetEvent G o A) * (⨅ a : A, prob G p (connEvent G (a : V) b))

/-- Reading "probabilities in [0, ∞], min ∅ = +∞": the inequality between the measures themselves, as extended
nonnegative reals, with the infimum of the complete lattice `ℝ≥0∞`. There `⨅ a ∈ A, …` is the true infimum over
the points of A; for A = ∅ it is `⊤` (= +∞), and the statement reads P(0 ↔ b) ≥ 0 · ∞ = 0 (Mathlib: 0 · ⊤ = 0):
true.

Belief: EQUIVALENT to `Conjecture1`: all three measures are at most 1, so nothing is lost in passing to real
numbers, and for A nonempty (finite) the infimum is attained.

UNVERIFIED: `⨅ a ∈ A, …` and the comparison in `ℝ≥0∞` are not used in the sealed files. -/
def Conjecture1_ennreal : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V),
    percolationMeasure G p (connEvent G o b) ≥
      percolationMeasure G p (connSetEvent G o A) * (⨅ a ∈ A, percolationMeasure G p (connEvent G a b))

end KN1Printed
