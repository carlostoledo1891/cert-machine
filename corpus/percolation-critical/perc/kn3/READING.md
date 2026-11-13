# Kozma–Nitzan Conjecture 3 — the reading behind `Printed.lean`

Clean room: written from the paper alone, without ever seeing any formalization of this conjecture.
Date of the reading: 2026-11-12.

## 1. The source

- Gady Kozma, Shahaf Nitzan, *A reduction of the θ(p_c) = 0 problem to a conjectured inequality*, arXiv:2401.12397.
- **Versions.** The abstract page lists exactly one: **v1, Mon 22 Jan 2024 23:01:24 UTC, 59 KB**, "38 pages,
  4 figures". There is no v2, so there is no wording to compare between versions.
- **Journal version.** The arXiv record has no journal reference and no DOI other than the arXiv one
  (10.48550/arXiv.2401.12397). One Crossref title query (saved as `source/crossref.json`) returned no record of
  this paper. I found no published version; I did not search further than that.
- Files relied on, in `source/` (hashes in `source/SHA256SUMS`): `2401.12397v1.eprint` (the arXiv source bundle,
  gzip tar), unpacked in `source/v1-tex/` (`the_set_inequality.tex` is the paper), `2401.12397v1.pdf`,
  `v1.txt` (`pdftotext -layout` of the PDF, used for page numbers), `abs.html` (version history).
- Numbering. In the TeX, conjectures and questions share one counter and theorems have their own. The PDF
  prints: Conjecture 1 (label `conj:postFKG`, p. 3), Conjecture 2 (`conj:preFKG`, p. 3), **Conjecture 3
  (`conj:epsdel`, p. 15)**, Conjecture 4 (`conj:mcp`), Question 5, Conjecture 6 (`conj:gluing`), Questions 7–9.
  The reduction theorem that uses Conjecture 3 is printed as **Theorem 6** (p. 15).

## 2. The conjecture, verbatim

arXiv:2401.12397v1, §4 "θ(p_c)", page 15. TeX source, `the_set_inequality.tex` line 956:

```
\begin{conj}\label{conj:epsdel} For every $\eps>0$ there exists $\delta>0$ such that for any graph $G$, any $A\subset G$, and any $0,b\in G$ which satisfy $\PP(0\lr A)> 1-\delta$ and  $\PP(a\lr b)>1-\delta$ for all $a\in A$, we have $\PP(0\lr b)>1-\eps$.
\end{conj}
```

As printed:

> **Conjecture 3.** For every ε > 0 there exists δ > 0 such that for any graph G, any A ⊂ G, and any 0, b ∈ G
> which satisfy P(0 ↔ A) > 1 − δ and P(a ↔ b) > 1 − δ for all a ∈ A, we have P(0 ↔ b) > 1 − ε.

(`\eps` is `\varepsilon`, `\PP` is `\mathbb{P}`, `\lr` is `\leftrightarrow`.)

The sentences around it, verbatim (same page):

> In this section we show that conjecture 1 implies that θ(p_c) = 0 in all dimensions. Since even the wise cannot
> see all ends, we will base our proof on a weaker version of conjecture 1, as follows.

> Conjecture 3 clearly follows from conjecture 1 (by taking δ = 1 − √(1 − ε)).

> **Theorem 6.** If conjecture 3 holds then P(|C(0)| = ∞) = 0 at the critical probability for ℤ^d for any d ≥ 2.

## 3. The definitions it rests on, verbatim

**Conjecture 1** (§1, page 3) — where "graph" is spelled out:

> **Conjecture 1.** Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two
> vertices and let A ⊂ G be a set of vertices. Then
> P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}. (1)

**§2.1 Notation** (page 4), first two paragraphs and the start of the third:

> Throughout, we will not distinguish between a graph and its set of vertices. Thus if G is a graph, the notation
> v ∈ G stands for 'v is a vertex of G' and A ⊆ G stands for 'A is a subset of vertices'. The set of edges of G
> will be denoted by E(G). The notation v ∼ w will mean that v and w are neighbours in the graph (or
> {v, w} ∈ E(G)).

> For a graph G and a function p : E(G) → [0, 1] we will consider the measure on subsets ω of E(G) such that for
> every edge e the probability that e ∈ ω is p(e), and these events are independent. We call such measures
> *percolation measures*. Edges which satisfy e ∈ ω are called *open*. Otherwise the edges are *closed*. For two
> vertices v and w we denote by v ↔_ω w the event that v and w are connected in ω, namely, that there exist
> v = x₁ ∼ x₂ ∼ ⋯ ∼ x_k = w such that {x_i, x_{i+1}} ∈ ω for all i ∈ {1, …, k − 1}. For a vertex v we denote by
> C_ω(v) the *cluster* of v in ω, namely {w : v ↔_ω w}. For a set of vertices A we denote
> C(A) = ⋃_{a∈A} C(a). We denote by v ↔_ω ∞ the event |C_ω(v)| = ∞. When ω is random and given by a percolation
> measure we will usually omit it from the notation. Thus P(v ↔ w) is the probability that v ↔_ω w for ω given by
> some percolation measure, which is assumed to be clear from the context (sometimes we will denote it by P_G for
> clarity, where G is the graph). For a number p ∈ [0, 1] the notation P_p will be used for the percolation
> measure with the constant function p.

> When v, w ∈ A ⊂ G we denote by v ↔^A w the event that there exist x_i as above with x_i ∈ A for all i. The set
> {w : v ↔^A w} will be called *the cluster of v in A*. For A ⊂ B we denote by
> C(A; B) = {x ∈ B : ∃ y ∈ A s.t. x ↔^B y} the cluster of A in B.

And (pages 4–5):

> (we will not distinguish between {0,1}^{E(G)} and the set of subsets of E(G), considering each element
> ω ∈ {0,1}^{E(G)} as the subset {e : ω(e) = 1})

The paper does **not** display a definition of "v ↔ A" for a vertex v and a set A. It is used from Conjecture 1
on. The definitions of C(A) and C(A; B) above fix the meaning: v ↔ A iff v ↔ a for some a ∈ A.

## 4. Phrase in the paper → Lean in `Printed.lean`

| Phrase in the paper | Lean |
|---|---|
| "graph G" (edges are sets {v, w}; "v ∼ w … (or {v, w} ∈ E(G))") | `(V : Type) (G : SimpleGraph V)` — Mathlib's simple graph: a symmetric, irreflexive adjacency on `V` |
| "finite graph" (Conjecture 1; not printed in Conjecture 3) | `[Finite V]` |
| "E(G)" | `G.edgeSet : Set (Sym2 V)` — the unordered pairs of neighbours |
| "a function p : E(G) → [0, 1]" / "arbitrary probabilities on its edges" | `p : G.edgeSet → Set.Icc (0 : ℝ) 1` |
| "subsets ω of E(G)" = "ω ∈ {0,1}^{E(G)}" | `Config G := G.edgeSet → Bool`; `ω e = true` is "e ∈ ω" (open) |
| "for every edge e the probability that e ∈ ω is p(e)" | `coin q := ENNReal.ofReal q • dirac true + ENNReal.ofReal (1 − q) • dirac false` with `q = p e` |
| "and these events are independent" — the percolation measure | `percolationMeasure G p := Measure.infinitePi fun e => coin (p e)` (the product measure; equal to `Measure.pi` when E(G) is finite — `percolationMeasure_eq_pi` in `Check.lean`) |
| "there exist v = x₁ ∼ x₂ ∼ ⋯ ∼ x_k = w such that {x_i, x_{i+1}} ∈ ω for all i" | `Joined G ω v w := ∃ n (x : Fin (n+1) → V), x 0 = v ∧ x (Fin.last n) = w ∧ ∀ i : Fin n, ∃ h : s(x i.castSucc, x i.succ) ∈ G.edgeSet, ω ⟨_, h⟩ = true` (the paper's k is n + 1) |
| the event "v ↔ w" | `connEvent G v w := {ω \| Joined G ω v w}` |
| the event "0 ↔ A" | `connSetEvent G o A := {ω \| ∃ a ∈ A, Joined G ω o a}` |
| "P(…)" — "the probability … for ω given by some percolation measure" | `prob G p S := (percolationMeasure G p S).toReal : ℝ` |
| "For every ε > 0" | `∀ ε : ℝ, 0 < ε →` |
| "there exists δ > 0 such that" | `∃ δ : ℝ, 0 < δ ∧` |
| "for any graph G" | `∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)` |
| "any A ⊂ G" | `(A : Set V)` |
| "and any 0, b ∈ G" | `(o b : V)` |
| "which satisfy P(0 ↔ A) > 1 − δ" | `prob G p (connSetEvent G o A) > 1 - δ →` |
| "and P(a ↔ b) > 1 − δ for all a ∈ A" | `(∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →` |
| "we have P(0 ↔ b) > 1 − ε" | `prob G p (connEvent G o b) > 1 - ε` |

The statement in full:

```lean
def Conjecture3 : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧
    ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
      (A : Set V) (o b : V),
      prob G p (connSetEvent G o A) > 1 - δ →
      (∀ a ∈ A, prob G p (connEvent G a b) > 1 - δ) →
      prob G p (connEvent G o b) > 1 - ε
```

## 5. Ambiguities, the choice made, and why

**A1. Is G finite?** Conjecture 3 prints "any graph G"; Conjecture 1 prints "a finite graph with arbitrary
probabilities on its edges". §2.1 also calls ℤ^d a graph and defines percolation measures "for a graph G" with no
finiteness.
*Choice:* finite (`Conjecture3`). *Why:* Conjecture 3 is introduced as "a weaker version of conjecture 1" and
"clearly follows from conjecture 1", which is about finite graphs; after Conjecture 1 the paper drops the word
everywhere (Conjecture 2: "as in conjecture 1"; Conjecture 4: "For any graph G"; Conjecture 6: "Let G be a
graph"; §5.6: "for any finite graph G with any probabilities"); and every graph to which the paper applies
Conjecture 3 is finite (a box of ℤ^d with a cube or explored clusters identified to points, and its contraction
K_ξ: proofs of Lemmas 10–12 and of Theorem 6, pages 17–31).
*The other reading:* `Conjecture3_readingB` — the same statement over **countable** graphs (`[Countable V]`).
Countable and not arbitrary because on an uncountable graph the connection events need not be measurable for the
product σ-algebra, and the paper's only infinite graphs are ℤ^d and its subgraphs. `Check.lean` proves
`Conjecture3_readingB → Conjecture3`. The converse holds by exhaustion by finite subgraphs; it is not proved here.

**A2. Which measure is "P"?** "some percolation measure, which is assumed to be clear from the context". Nothing
in Conjecture 3 names it.
*Choice:* every percolation measure on G, i.e. every `p : E(G) → [0,1]`, universally quantified together with G,
after δ. *Why:* that is Conjecture 1's "arbitrary probabilities on its edges"; the paper elsewhere says
"auxiliary graph (with probabilities)" (p. 13), so the probabilities are part of "the graph"; and the proof needs
it — Conjecture 3 is applied to K_ξ (p. 20–22), obtained by "removing every edge in E(S) ∖ ξ, and shortening
every edge in ξ", which as a simple graph has edge probabilities that are no longer one constant.
*Not encoded as a reading:* a single constant p (the paper's P_p). It is recorded as `Neighbour2_constantProbability`
in `Planted.lean` so that a comparison can tell it apart; `Conjecture3` implies it (`neighbour2_of_conjecture3`).
*Uniformity:* δ depends on ε only — not on G, p, A, 0, b. This is the printed order, and the proof uses it: in
Lemma 10 (p. 17) δ is fixed "in the very beginning" as (1/12)·ε·δ_conjecture 3, before any graph G is given, and
the same δ_conjecture 3 then serves every contracted graph K_ξ (p. 21–22).

**A3. "A ⊂ G".** The paper defines "A ⊆ G" as "A is a subset of vertices" and then writes "A ⊂ G" almost
everywhere (also "B ⊂ D ⊂ ℤ^d", "A, B ⊂ G"). *Choice:* any set of vertices, `A : Set V`, the whole vertex set and
the empty set included. Lean's `⊂` is strict; the paper's is not. The strict reading is recorded as
`Neighbour3_properSubset` (implied by `Conjecture3`; equivalent to it by adding an isolated vertex, not proved).

**A4. Empty A.** Not excluded in print. With A = ∅, {0 ↔ A} is empty, so "P(0 ↔ A) > 1 − δ" fails as soon as
δ ≤ 1. *Choice:* A unrestricted. It makes no difference: `conjecture3_iff_neighbour4` (`PlantedCheck.lean`)
proves `Conjecture3 ↔` the same statement with `A.Nonempty`.

**A5. "0 ↔ A" has no displayed definition.** *Choice:* ∃ a ∈ A, 0 ↔ a (see §3). In particular the event is
certain when 0 ∈ A.

**A6. The vertices 0 and b.** "any 0, b ∈ G": 0 is a name for a vertex, not a zero element. Not assumed distinct,
not assumed outside A. *Choice:* `(o b : V)` with no side condition.

**A7. Paths of length zero.** The paper's chain v = x₁ ∼ ⋯ ∼ x_k = w with k = 1 has no edge, so v ↔ v always.
*Choice:* `Joined` allows n = 0. (`joined_iff_reflTransGen` in `Check.lean`: it is the reflexive transitive
closure of "joined by an open edge of G".)

**A8. Range of ε.** "For every ε > 0": all positive reals, including ε ≥ 1 where the conclusion is trivial
(`conclusion_of_one_lt`). *Choice:* as printed, `∀ ε : ℝ, 0 < ε`.

**A9. Loops and parallel edges.** The paper's edges are two-element sets {v, w}, so no loops and no parallel
edges: `SimpleGraph`. Its proofs contract edges and identify vertex sets to points, which makes parallel edges;
with arbitrary edge probabilities these merge into one edge (probability 1 − ∏(1 − p_i)), so the simple-graph
statement serves. A multigraph statement would be a different (equivalent, with a proof) statement; not encoded.

None of A2–A9 is, in my judgement, a second defensible reading of the sentence; A1 is, and has its own def.

## 6. What the paper says about the conjecture's status and scope

- **Status: open.** Of Conjecture 1 (p. 3): "We were not able to prove or disprove this conjecture. Our belief
  that it holds is based on some (admittedly restricted) numerical evidence and on some simple cases where we were
  able to prove it." Footnote (p. 3): "J. van den Berg and D. Engelenburg independently considered the very same
  inequality … They did not prove or disprove the conjecture." Conjecture 3 is weaker: it "clearly follows from
  conjecture 1 (by taking δ = 1 − √(1 − ε))". The paper proves no case of Conjecture 3 as such; the proved cases
  (§3: |A| = 2, some |A| = 3, 0 "close" to A) are cases of Conjectures 1 and 2.
- **Scope: all (finite) graphs with arbitrary edge probabilities, not subgraphs of ℤ^d.** p. 3: "we will suggest
  (several possible) inequalities which we believe hold for *all* graphs, and not just in the Euclidean setting of
  the one-step renormalisation scheme." There is no p in Conjecture 3: the edge probabilities are arbitrary in
  [0, 1], endpoints included (probability 1 is how the paper models a contracted edge: "G ⏚ e is the graph G with
  the probability that e is open set to 1", the definition before Conjecture 6, p. 34).
- **Undirected.** §5.7 (p. 37): the inequality "does not work for directed percolation".
- **Bond percolation.** Site percolation appears only as a tool in the proof of Theorem 6.
- **What it is for.** Theorem 6 (p. 15): Conjecture 3 implies θ(p_c) = 0 on ℤ^d for every d ≥ 2 (d = 2 known;
  the proof is for d ≥ 3). Conjecture 3 enters once, in the proof of Lemma 10 (p. 17 and 21–22), with
  ε_conj = ε/2, applied to the contracted graphs K_ξ, "identif[ying] the set T to a point and us[ing] that point
  as the b of conjecture 3".
- §5.6 "Simple reductions" (p. 36–37) are stated for "the problem" (Conjecture 1): one may assume all edge
  probabilities are ½, all degrees are 3, 0 ≁ b, and A of the form {a : P(a ↔ b) > p}. They are remarks, not
  part of any conjecture's statement.

## 7. Places where a "verbatim" formalization could come out differently

Named without reference to any existing formalization (I have seen none).

1. **Finite or not** (A1): the word "finite" is in Conjecture 1 and absent from Conjecture 3.
2. **Per-edge probabilities or one p** (A2); and whether p ranges over [0, 1], (0, 1), or is fixed (e.g. ½, after
   the paper's reduction).
3. **Where p is quantified**: it must be inside "for any graph" (after ∃ δ). A δ allowed to depend on p, or on
   the graph, is a different and much weaker statement (`Planted1_deltaAfterGraph` is provably true).
4. **Graph model**: simple graph, multigraph, a relation, a set of edges on a fixed vertex type, graphs on
   `Fin n`, or subgraphs of one ambient graph. The vertex type's universe (`Type` here; any finite graph is
   isomorphic to one on `Fin n`, so for the finite reading the universe is immaterial, but it is a visible
   difference of statement).
5. **The sample space**: {0,1}^{E(G)} (here), subsets of E(G), or `Sym2 V → Bool` / `V → V → Bool` including
   non-edges; and the measure: `Measure.pi`, `Measure.infinitePi`, a `PMF`, or an explicit finite sum of weights.
6. **Probabilities as ℝ or ℝ≥0∞**: here `(μ S).toReal`, compared with `1 - δ` in ℝ. In ℝ≥0∞, `1 - δ` truncates at
   0 for δ > 1, which changes hypotheses for large δ (harmless for the truth of the statement, but not the same
   term).
7. **Strict vs non-strict inequalities**: three ">" as printed. Replacing some by "≥" gives statements equivalent
   to the conjecture (by halving δ or ε) but not identical.
8. **"A ⊂ G"**: strict subset or not (A3); `Set` or `Finset`; empty allowed or not (A4).
9. **"0 ↔ A"**: ∃ a ∈ A (here) — versus, wrongly, ∀ a ∈ A.
10. **"for all a ∈ A"** in the second hypothesis: ∀, not ∃ (`Planted5_existsInsteadOfForall` is provably false).
11. **Connectivity**: reflexive (here, as printed with k = 1) or requiring at least one edge; paths required to
    use edges of G that are open (here) — a formalization on a larger sample space must intersect with E(G).
12. **Side conditions not in print**: 0 ≠ b, 0 ∉ A, b ∉ A, G connected, ε < 1, δ < 1. None is printed; none is
    assumed here.
13. **Which conjecture**: Conjecture 1 (the product inequality with the minimum) and Conjecture 2 are different,
    stronger statements; a formalization of "the Kozma–Nitzan conjecture" may be one of those
    (`Neighbour1_Conjecture1` records Conjecture 1).

## 8. The files

- `Printed.lean` — `import Mathlib`, namespace `KN3Printed`: `Config`, `coin` (+ its probability-measure
  instance), `percolationMeasure`, `Joined`, `connEvent`, `connSetEvent`, `prob`, `Conjecture3`,
  `Conjecture3_readingB`. No `sorry`, `axiom`, `opaque`, `native_decide`.
- `Check.lean` — fragment appended to `Printed.lean`: `#check`s, sanity lemmas, `#print axioms`.
- `Planted.lean` — fragment appended to `Printed.lean`: six planted wrong variants and four neighbours.
- `PlantedCheck.lean` — fragment: Planted 2 proved true; Planted 3, 4, 5 proved false; `Conjecture3 ↔ Neighbour4`.
- `combine.sh` — writes `tmp/PrintedCheck.lean`, `tmp/PrintedPlanted.lean`, `tmp/All.lean` by concatenation.
- Compile (pinned Lean v4.32.0, Mathlib 81a5d257), each exit 0, no errors, no warnings:
  `cd ~/Projects/plumb-scout/perc/stmt-432 && lake env lean /Users/carlostoledo/Projects/plumb/perc/kn3/<file>`
  for `Printed.lean`, `tmp/PrintedCheck.lean`, `tmp/PrintedPlanted.lean`, `tmp/All.lean`; outputs in `tmp/*.out`.
