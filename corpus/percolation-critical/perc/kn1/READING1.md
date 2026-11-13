# Kozma–Nitzan Conjecture 1 — the reading behind `Printed1.lean`

Clean room: written from the paper alone, without ever seeing any formalization of this conjecture other than
our own sealed neighbour record (`Neighbour1_Conjecture1` in `../kn3/Planted.lean`, which this note judges afresh).
Date of the reading: 2026-11-13. No network was used. Files opened: the paper in `../kn3/source/` (`v1.txt`,
`v1-tex/the_set_inequality.tex`, `SHA256SUMS`) and the five sealed files `../kn3/Printed.lean`, `READING.md`,
`Check.lean`, `Planted.lean`, `PlantedCheck.lean`. Nothing else.

## 1. The source

- Gady Kozma, Shahaf Nitzan, *A reduction of the θ(p_c) = 0 problem to a conjectured inequality*,
  arXiv:2401.12397v1 (22 Jan 2024). Version history, journal status and file hashes: as recorded in the sealed
  `../kn3/READING.md` §1 and `../kn3/source/SHA256SUMS` (same files; I did not re-derive them).
- Page numbers below are those printed in the PDF, read off `v1.txt` (the running head, which prints
  "A PRECOLATION INEQUALITY", carries the page number).

## 2. The conjecture, verbatim

arXiv:2401.12397v1, §1 "Introduction", **page 3**. TeX source, `the_set_inequality.tex` lines 272–276:

```
\begin{conj}\label{conj:postFKG}Let $G$ be a finite graph with arbitrary probabilities on its edges, let $0, b\in G$ be two vertices and let $A\subset G$ be a set of vertices. Then
  \begin{equation}\label{eq:postFKG}
    \PP(0\lr b)\ge \PP(0\lr A)\min\{\PP(a\lr b):a\in A\}.
  \end{equation}
\end{conj}
```

As printed:

> **Conjecture 1.** Let G be a finite graph with arbitrary probabilities on its edges, let 0, b ∈ G be two
> vertices and let A ⊂ G be a set of vertices. Then
>
> P(0 ↔ b) ≥ P(0 ↔ A) min{P(a ↔ b) : a ∈ A}. (1)

(`\PP` is `\mathbb{P}`, `\lr` is `\leftrightarrow`.)

The sentences around it, verbatim (page 3):

> The inequality which we find cleanest is formulated in the following conjecture.∗

> ∗ After distributing initial drafts of this paper we were informed that J. van den Berg and D. Engelenburg
> independently considered the very same inequality. […] They did not prove or disprove the conjecture.

> We were not able to prove or disprove this conjecture. Our belief that it holds is based on some (admittedly
> restricted) numerical evidence and on some simple cases where we were able to prove it.

> **Conjecture 2.** Let G, 0, b and A be as in conjecture 1. Then P(0 ↔ b) ≥ min{P(0 ↔ A, a ↔ b) : a ∈ A}. (2)

> Conjecture 1 follows from conjecture 2 by an application of the FKG inequality. For this reason we sometimes
> call conjecture 1 'the post-FKG conjecture' and conjecture 2 'the pre-FKG conjecture'.

> We will also occasionally prove the following formally stronger version of conjecture 2:
> P(0 ↔ b, 0 ↔ A) ≥ min{P(0 ↔ A, a ↔ b) : a ∈ A}. (3)
> We say that (3) is only 'formally' stronger than (2) because to prove (2) it is enough to prove it in the case
> b ∈ A (the case that b ∉ A follows by considering (2) for A′ = A ∪ {b}), and in this case (3) and (2) are
> equivalent.

The definitions the sentence rests on (§2.1, pages 4–5: graph, E(G), p : E(G) → [0, 1], percolation measure,
v ↔ w, C(A), C(A; B), P) are quoted verbatim in the sealed `../kn3/READING.md` §3 and are encoded by the sealed
`../kn3/Printed.lean`; they are reused here unchanged.

## 3. Every use of Conjecture 1 in the paper

| Where | What is said | What it shows about the reading |
|---|---|---|
| p. 3, after the statement | "the cases of conjecture 1 which we were able to prove, namely, the case \|A\| = 2, some particular cases in which \|A\| = 3, and graphs where 0 is 'very close' to A" | cases are indexed by \|A\| ≥ 2; A = ∅ is never considered |
| p. 3 | Conjecture 2: "Let G, 0, b and A be as in conjecture 1" | the same data; for Conjecture 2 an empty A cannot be given any value convention without making it false or trivial (B8) — the authors' A is nonempty |
| p. 3 | "Conjecture 1 follows from conjecture 2 by an application of the FKG inequality" | P(0 ↔ A, a ↔ b) ≥ P(0 ↔ A) P(a ↔ b) for each a; the minimum is taken over the same a ∈ A on both sides |
| p. 3 | "to prove (2) it is enough to prove it in the case b ∈ A" | b may lie in A (B6) |
| p. 7, §3 | "particular cases in which we can show that conjectures 1 and 2 hold" | — |
| p. 12, §3.2 | "if we denote by a₀ the point of A where the minimum of P(a ↔ b) is achieved" | the minimum is an attained minimum; A nonempty |
| p. 15, §4 | "In this section we show that conjecture 1 implies that θ(p_c) = 0 in all dimensions. […] we will base our proof on a weaker version of conjecture 1" and "Conjecture 3 clearly follows from conjecture 1 (by taking δ = 1 − √(1 − ε))" | the ONLY use of Conjecture 1 as a hypothesis towards θ(p_c) = 0 is through Conjecture 3. The derivation needs only: P(0 ↔ b) ≥ P(0 ↔ A) · min > (1 − δ)² = 1 − ε (for ε ≤ 1). It works under every reading below |
| p. 31, §5 | "remarks relating to conjecture 1" | — |
| p. 34, Lemma 13 | "Conjecture 6 implies the post-FKG conjecture, conjecture 1"; proof: "Assume conjecture 1 has been shown for all graphs with less than n edges. […] Let H_p be the auxiliary graph which one gets from G by changing the probability of the edge {v, w} to be open to be p […] Let a ∈ A be the one minimising P_{H₀}(a ↔ b) […] f(p) := P_{H_p}(v ↔ b) − P_{H_p}(v ↔ A) P_{H_p}(a ↔ b) […] conjecture 1 holds for H₀, i.e. f(0) ≥ 0 […] This shows conjecture 1 for G" | (i) "the conjecture holds" = the inequality with the minimiser a; (ii) the conclusion "conjecture 1 for G" is drawn from the inequality for an a that minimises in H₀, not in G — so the authors treat "some a ∈ A satisfies P(0 ↔ b) ≥ P(0 ↔ A) P(a ↔ b)" as the conjecture; (iii) probability 0 on an edge is allowed and counts as "less edges"; (iv) the vertex called 0 is arbitrary (here it is v) |
| p. 34–35, Theorem 12 | E is "the set of edges for which P_{G⏚e}(0 ↔ b) ≥ P_{G⏚e}(0 ↔ A) min_{a∈A} P_{G⏚e}(a ↔ b)"; "if graph does not satisfy conjecture 1 …" | the same inequality written with min_{a∈A}; probability 1 on an edge is allowed (G ⏚ e) |
| p. 36, Question 7 | "does the minimiser of the post-FKG version of the conjecture also satisfy the pre-FKG version" | "the minimiser": the point a of A with least P(a ↔ b) |
| p. 36–37, §5.6 | "three simple reductions that can be performed on the problem" (four are listed): all edges ½ ("for any finite graph G with any probabilities"); all degrees 3; 0 ≁ b ("Our assumption is that the conjecture holds for G₀ (for some a ∈ A). At G₁, though, the conjecture holds trivially, for all a ∈ A"; "concave (in the post-FKG version)"); A = {a ∈ G : P(a ↔ b) > p} | "finite graph … with any probabilities" again; "the conjecture holds … for some a ∈ A" is the paper's own phrase; a level set {a : P(a ↔ b) > p} always contains b when p < 1 |
| p. 37, §5.7 | "The most obvious wrong generalisation of conjecture 1 is that it does not work for directed percolation": P(0 → b) = 7/16 while P(0 → A) P(a → b) = 3/4 · 5/8 | undirected; the right side is a product with one a (the two a's are symmetric there). I recomputed: 7/16, 3/4, 5/8, and 15/32 > 14/32 |
| p. 37, Theorem 13 | "in any graph G, any A and any a ∈ A we have (42). This is clearly false" ((42) is P_G(v ↔ b) ≥ P_G(v ↔ A) P_G(a ↔ b)) | the inequality for ALL a ∈ A is false, by the paper's own word (`Planted2`) |

No use needs more than the printed sentence gives. One use (p. 15) is, read literally, about more graphs than
the printed sentence covers: Conjecture 3 says "any graph G" without "finite". The sealed Conjecture 3 file
reads it as finite (its A1), and then the derivation from Conjecture 1 is as the paper says.

## 4. Phrase by phrase

| Phrase | What it could mean | Chosen | Changes the mathematical content? |
|---|---|---|---|
| "Let G be a finite graph" | finite vertex set (then finitely many edges); or finitely many edges only; simple graph, or loops / parallel edges allowed; vertex type in `Type` or any universe; vertices `Fin n` | `(V : Type) [Finite V] (G : SimpleGraph V)` — B1, B2, B14 | No (B2: multigraph ⟺ simple by merging parallel edges; B14: transport along a bijection). Dropping "finite" is not a reading (B1) |
| "with arbitrary probabilities on its edges" | a function p : E(G) → [0, 1], universally quantified; or (0, 1); or one common p | `(p : G.edgeSet → Set.Icc (0 : ℝ) 1)`, all of them — B3 | [0, 1] vs (0, 1): No (continuity). One common p: YES as a statement (`Planted16`); the paper claims a reduction (§5.6) |
| "let 0, b ∈ G be two vertices" | any two; or two distinct; inside or outside A | `(o b : V)`, no side condition — B5, B6 | No (0 = b and 0 ∈ A are trivially true cases; b ∈ A reduces by a pendant vertex, a proof) |
| "let A ⊂ G be a set of vertices" | any subset; a proper subset; a nonempty subset | `(A : Set V)`, anything — B7, B8 | No |
| "P(…)" | the percolation measure of p, the same in all three places | sealed `prob G p` — B4, B15 | — |
| "0 ↔ b", "a ↔ b" | connected by a path of open edges (length 0 allowed) | sealed `connEvent` — B16 | — |
| "0 ↔ A" | 0 is connected to SOME a ∈ A; or to ALL a ∈ A | some: sealed `connSetEvent` — B9 | YES: "all" gives a true statement (`Planted15`) |
| "min{P(a ↔ b) : a ∈ A}" | the least element of the set of values; the infimum; the value at "the minimiser"; and something for A = ∅ | the least element `m` (attained, and a lower bound) — B10, B11, B8 | No (finite A: all the same; A = ∅: all conventions agree) |
| "≥" | as printed; strict | `≥` — B12 | YES (strict is false: `Planted4`; reversed is false: `Planted3`) |
| "P(0 ↔ A) min{…}" | product of two real numbers | `*` in ℝ — B13 | No (ℝ≥0∞ version equivalent) |
| "Let … Then …" | for all G, p, 0, b, A | one block of `∀` — B18 | — |

## 5. The choices B1–B18

Marked **[content]** when the alternative is a mathematically different statement; **[same]** when the
alternative is provably equivalent (argument given in words); **[fixed]** when the paper leaves no alternative.

**B1. "finite graph" = finite vertex set. [same / not a reading]** The paper identifies a graph with its vertex
set ("we will not distinguish between a graph and its set of vertices", p. 4), so a finite graph has finitely
many vertices, hence finitely many edges. *Chosen:* `[Finite V]`. An infinite or countable graph is NOT a reading
of this sentence: the word "finite" is printed (and printed again in §5.6: "for any finite graph G with any
probabilities"), and on an infinite A the printed "min" need not exist. The countable statement with an infimum
is recorded as `Neighbour7_countableGraph`; I believe it equivalent by exhaustion (a proof). "Finitely many
edges on an infinite vertex set" is not what "finite graph" means in a paper that identifies G with its
vertices; not encoded.

**B2. Simple graph; no loops, no parallel edges. [same]** The paper's edges are two-element sets: "v ∼ w will
mean that v and w are neighbours in the graph (or {v, w} ∈ E(G))" (p. 4). *Chosen:* Mathlib's `SimpleGraph`.
Does the paper's own use need multigraphs? Its constructions glue vertices: "G ⏚ e the graph one gets by gluing
the two vertices of the edge e" (p. 9), T^{(jk)} "obtained from T by gluing the two points a_j and a_k" (p. 10),
K_ξ whose "new vertices are equivalence classes" (p. 20–21), "We identified the set T to a point" (p. 22). A
quotient has parallel edges and loops. But the paper itself gives the simple-graph form: "Equivalently, G ⏚ e is
the graph G with the probability that e is open set to 1" (p. 34). With per-edge probabilities in the CLOSED
interval nothing is lost: (i) a loop never changes who is connected to whom; (ii) k parallel edges with
probabilities p₁, …, p_k between the same two vertices are, for every connection event, one edge with
probability 1 − ∏(1 − p_i) ∈ [0, 1] (the map "open iff some parallel edge is open" carries one product measure
to the other and preserves connectivity); (iii) gluing two vertices is an edge of probability 1 between them
(added if absent); deleting an edge is probability 0. So the multigraph statement and the simple-graph statement
are equivalent, and every graph the paper feeds to its conjectures is represented. A multigraph statement is not
encoded (the sealed definitions are for simple graphs).

**B3. "arbitrary probabilities on its edges" = every p : E(G) → [0, 1], endpoints included. [same for the
endpoints; content for "one p"]** §2.1: "a function p : E(G) → [0, 1]". The paper uses 0 ("we set their weight
to ε, and otherwise to 0", p. 13; H₀ in Lemma 13, p. 34) and 1 (G ⏚ e, p. 34; "edges with weight 1", p. 32;
"all internal edges have probability 1", p. 36). *Chosen:* `p : G.edgeSet → Set.Icc (0 : ℝ) 1`, universally
quantified. Restricting to the open interval (`Neighbour8`) gives an equivalent statement: on a fixed finite
graph the three probabilities are polynomials in the p(e), a minimum of finitely many continuous functions is
continuous, and `≥` survives limits. One common probability on all edges (`Planted16`; ½ on all edges,
`Neighbour9`) is a different statement — formally weaker; the paper says the problem reduces to it (§5.6 item 1,
a sketch that replaces edges by gadgets).

**B4. The sample space and the measure. [fixed]** The sealed `Config`, `coin`, `percolationMeasure`: the product
over the edges of G of the two-point laws. Reused.

**B5. "two vertices": not assumed distinct. [same]** *Chosen:* `(o b : V)`. If 0 = b the left side is 1 and the
right side is a product of two probabilities, so the inequality holds; hence "two distinct vertices"
(`Conjecture1_distinct`) is equivalent.

**B6. 0 and b may lie in A. [same]** Nothing printed excludes it, and the paper uses b ∈ A (p. 3: "the case
b ∈ A"; p. 10: "simply take a₁ = b"; p. 33: "the case |A| = 3 and b ∈ A"). *Chosen:* no side condition. If
0 ∈ A: P(0 ↔ A) = 1 and the minimum is at most P(0 ↔ b): true outright. If b ∈ A the inequality is not trivial;
excluding it (`Neighbour10_sideConditions`) still gives an equivalent statement, by attaching a new vertex b′ to
b with an edge of probability 1 and using b′ (then P(· ↔ b′) = P(· ↔ b) and b′ ∉ A) — an argument that changes
the graph, so it is recorded as a neighbour, not as a reading.

**B7. "A ⊂ G": any set of vertices, not necessarily proper. [same]** The paper defines "A ⊆ G stands for 'A is a
subset of vertices'" (p. 4) and writes ⊂ throughout. *Chosen:* `(A : Set V)`. The proper-subset reading
(`Conjecture1_properSubset`) is equivalent: A = everything contains 0, the trivial case of B6.

**B8. A = ∅. [same]** "a set of vertices" does not exclude the empty set, and "min ∅" is not defined. The event
{0 ↔ ∅} is empty (the sealed `connSetEvent`: "empty when A is empty"), so P(0 ↔ ∅) = 0. Every convention I can
defend:

| Convention for A = ∅ | What inequality (1) then says | Encoded as |
|---|---|---|
| the case is excluded (A nonempty is understood) | nothing | `Conjecture1_existsForm` (`A.Nonempty →`) |
| no minimum exists, so nothing is asserted about it | nothing (vacuous) | `Conjecture1` (primary), `Conjecture1_minimiser`, `Conjecture1_isLeast` |
| min ∅ = 0 (Mathlib's value of a real infimum over nothing) | P(0 ↔ b) ≥ 0 · 0 = 0: true | `Conjecture1_sInf`, `Conjecture1_iInf`, `Conjecture1_emptyMinIs 0` |
| min ∅ = 1 (the infimum of ∅ inside [0, 1], where probabilities live) | P(0 ↔ b) ≥ 0 · 1 = 0: true | `Conjecture1_emptyMinIs 1` |
| min ∅ = any real c | P(0 ↔ b) ≥ 0 · c = 0: true | `Conjecture1_emptyMinIs c` |
| every lower bound of ∅ (every real m) | P(0 ↔ b) ≥ 0 · m = 0: true | `Conjecture1_lowerBound` |
| min ∅ = +∞ (the infimum of ∅ in [0, ∞]), with 0 · ∞ = 0 | P(0 ↔ b) ≥ 0: true | `Conjecture1_ennreal` |
| min ∅ = +∞ with 0 · ∞ left undefined | nothing | (as the first two rows) |
| "the minimum exists" asserted for every A | FALSE at A = ∅ | `Planted6_existsWithoutNonempty` |

Because the factor P(0 ↔ A) is 0 when A = ∅, every convention that gives the minimum a value makes the empty
case true, and the others say nothing: the choice does not change the content. The only way to change it is to
assert a witness a ∈ A without assuming one exists, which makes the statement false for a reason that has
nothing to do with percolation. *Chosen:* the vacuous form. (For Conjecture 2 the factor is absent and the
conventions do NOT agree — min ∅ = 1 or +∞ would make it false, 0 trivially true at ∅ — which is why I read the
authors' A as nonempty and their "min" as an attained minimum.)

**B9. "0 ↔ A" = 0 is connected to at least one point of A. [content]** No displayed definition; fixed by
"C(A) = ⋃_{a∈A} C(a)" and "C(A; B) = {x ∈ B : ∃y ∈ A s.t. x ↔ y}" (p. 4), as in the sealed file (its A5), and by
the numbers of §5.7 (P(0 → A) = 3/4 is "to a₁ or a₂"). The reading "to all of A" gives a true statement
(`Planted15`).

**B10. "min" = the least element of a finite nonempty set of numbers. [same]** For finite nonempty A: least
element = infimum = value at any minimiser. The paper writes it three ways — min{P(a ↔ b) : a ∈ A} (p. 3),
min_{a∈A} P(a ↔ b) (p. 12, 34–35), "the minimiser of P(a ↔ b) among the points of A" (p. 34, 36) — and uses them
interchangeably.

**B11. How the minimum enters the Lean statement. [same]** *Chosen:* a real number `m` with the two defining
properties of a least element, the inequality asserted for it. The alternatives — "for some a ∈ A"
(`Conjecture1_existsForm`), "for every minimiser a" (`Conjecture1_minimiser`), "for every lower bound"
(`Conjecture1_lowerBound`), `IsLeast`, `sInf`, `⨅` over the subtype — are all equivalent; the arguments are
in the docstrings and use only: a finite nonempty set of reals has a least element, and P(0 ↔ A) ≥ 0.

**B12. "≥" as printed. [content]** Not strict (equality holds e.g. when 0 = b ∈ A = {b}, and on a path
0 — a — b with A = {a}). `Planted3`, `Planted4`.

**B13. Probabilities are real numbers and the product is the real product. [same]** The sealed `prob` is
`(μ S).toReal`. The same inequality between the measures in `ℝ≥0∞` (`Conjecture1_ennreal`) is equivalent, all
values being at most 1.

**B14. The universe of the vertex type. [same]** *Chosen:* `V : Type`, as in the sealed file. Every finite
graph is isomorphic to a graph on some `Fin n : Type`, and the statement is invariant under isomorphism, so a
statement over `Type u`, or over `Fin n` only (`Conjecture1_onFin`), is equivalent — by a transport argument
that is routine but is a proof.

**B15. Which measure is "P". [fixed]** The percolation measure of the "arbitrary probabilities", the same one in
P(0 ↔ b), P(0 ↔ A) and every P(a ↔ b).

**B16. Paths of length zero. [fixed]** v ↔ v always (the sealed `Joined`, its A7). So P(0 ↔ A) = 1 when 0 ∈ A
and P(b ↔ b) = 1.

**B17. Undirected bond percolation. [fixed]** §5.7 (p. 37): it "does not work for directed percolation".

**B18. Quantifiers. [fixed]** "Let G …, let 0, b …, let A … Then": universal over the graph, the probabilities,
0, b and A, in one block; nothing is chosen before anything else. The minimum depends on (G, p, A, b) and not
on 0.

## 6. The primary reading, and whether `Neighbour1_Conjecture1` stands

```lean
def Conjecture1 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V) (m : ℝ),
    (∃ a ∈ A, prob G p (connEvent G a b) = m) →
    (∀ a ∈ A, m ≤ prob G p (connEvent G a b)) →
    prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * m
```

"For every finite graph with probabilities, all vertices 0, b and every set A: if m is the minimum of
{P(a ↔ b) : a ∈ A}, then P(0 ↔ b) ≥ P(0 ↔ A) · m."

The earlier author's neighbour record is

```lean
def Neighbour1_Conjecture1 : Prop :=
  ∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (o b : V), A.Nonempty →
    ∃ a ∈ A, prob G p (connEvent G o b) ≥ prob G p (connSetEvent G o A) * prob G p (connEvent G a b)
```

**Judgement.** `Neighbour1_Conjecture1` is a correct statement of Conjecture 1: it is equivalent to the primary
by a ten-line argument, and it is the form the paper itself works with (§5.6 "for some a ∈ A"; Lemma 13). It
does not stand as the PRIMARY reading, for three reasons, all about form and none about truth:

1. The printed right-hand side is a product with a minimum; `Neighbour1` replaces it by an existential over a.
   Passing from one to the other uses two facts (the minimum over a finite nonempty A is attained; P(0 ↔ A) ≥ 0)
   — small, but mathematics, and a comparison should start from a form with no step built in.
2. `Neighbour1` adds the hypothesis `A.Nonempty`, which is not printed. In the primary no hypothesis is added:
   the empty case drops out because the empty set has no least element.
3. In `Neighbour1` the witness a may depend on 0; the printed minimum does not.

It is kept, word for word, as `KN1Printed.Conjecture1_existsForm`; `OBLIGATIONS1.md` asks for
`Conjecture1 ↔ Conjecture1_existsForm` and for `Conjecture1_existsForm ↔ KN3Planted.Neighbour1_Conjecture1`
(the same term). So the earlier author's reading and mine are the same mathematics; they differ in which form is
called "as printed".

## 7. The definitions

`Printed1.lean` (namespace `KN1Printed`), all believed equivalent to the primary:

| Definition | The reading | Why equivalent |
|---|---|---|
| `Conjecture1` | PRIMARY: m the least element | — |
| `Conjecture1_existsForm` | "for some a ∈ A", A nonempty (= the sealed `Neighbour1_Conjecture1`) | least element exists; P(0 ↔ A) ≥ 0 |
| `Conjecture1_minimiser` | for every minimiser a | m := P(a ↔ b) |
| `Conjecture1_lowerBound` | for every lower bound m (infimum) | least element exists; P(0 ↔ A) ≥ 0; P(0 ↔ ∅) = 0 |
| `Conjecture1_emptyMinIs c` | min ∅ := c, any real c | P(0 ↔ ∅) = 0 |
| `Conjecture1_distinct` | 0 ≠ b | 0 = b trivial |
| `Conjecture1_properSubset` | A ≠ everything | then 0 ∈ A: trivial |
| `Conjecture1_onFin` | vertices `Fin n` | transport along a bijection (a proof) |
| `Conjecture1_isLeast` | `IsLeast` | unfolding |
| `Conjecture1_sInf` | `sInf` of the set of values | finite nonempty: sInf is the least element; `sInf ∅ = 0` |
| `Conjecture1_iInf` | `⨅ a : A, …` over the subtype | the same |
| `Conjecture1_ennreal` | in `ℝ≥0∞`, `⨅ a ∈ A` | values ≤ 1; `⨅` over ∅ is ⊤ and 0 · ⊤ = 0 |

`Planted1.lean` (namespace `KN1Planted`):

| Definition | The one change | Belief | Counterexample / reason |
|---|---|---|---|
| `Planted1_maxInPlaceOfMin` | max for min | FALSE | 2 vertices, no edge, o ≠ b, A = both: 0 ≥ 1 · 1 |
| `Planted2_forAllAInPlaceOfMin` | ∀ a ∈ A | FALSE | the same; the paper: "clearly false" (p. 37) |
| `Planted3_inequalityReversed` | ≤ | FALSE | 2 vertices, no edge, o = b, A = {other}: 1 ≤ 0 · 0 |
| `Planted4_strictInequality` | > | FALSE | 1 vertex, A = {o}: 1 > 1 · 1 |
| `Planted5_sumInPlaceOfMin` | Σ_{a∈A} P(a ↔ b) for the min | FALSE | 2 vertices, no edge, o ≠ b, A = both: 0 ≥ 1 · (0 + 1) |
| `Planted6_existsWithoutNonempty` | ∃ a ∈ A with no `A.Nonempty` | FALSE | A = ∅ |
| `Planted7_factorDropped` | P(0 ↔ A) dropped | FALSE | 2 vertices, no edge, o ≠ b, A = {b}: 0 ≥ 1 |
| `Planted8_minOverWrongEvent` | min of P(0 ↔ a) | FALSE | 2 vertices, no edge, o ≠ b, A = {o}: 0 ≥ 1 · 1 |
| `Planted9_constantTwo` | factor 2 | FALSE | 1 vertex: 1 ≥ 2 |
| `Planted10_sumInPlaceOfSetEvent` | Σ_{a∈A} P(0 ↔ a) for P(0 ↔ A) | FALSE | 2 vertices, one edge with probability 1, o = b, A = both: 1 ≥ 2 · 1 (with 3/4: 1 ≥ 7/4 · 3/4 = 21/16) |
| `Planted11_minOfTheTwoFactors` | min(x, y) for x · y | FALSE | path o — a — b, both edges 1/2, A = {a}: 1/4 ≥ 1/2 |
| `Planted12_realIInfOverMembership` | `⨅ a ∈ A` in ℝ | TRUE (trivial) | the real `⨅` over a ∉ A is 0 |
| `Planted13_pointInPlaceOfSet` | P(0 ↔ a) for P(0 ↔ A) | TRUE | Harris–FKG; weaker |
| `Planted14_productInPlaceOfMin` | Π over A for the min | TRUE | Harris–FKG; weaker |
| `Planted15_connectedToAllOfA` | 0 ↔ every a ∈ A | TRUE | Harris–FKG; weaker |
| `Planted16_oneCommonProbability` | one p on all edges | UNKNOWN | special case; reduction claimed in §5.6 |
| `Planted17_constantHalf` | factor 1/2 | UNKNOWN | weaker; no proof known to me |

Neighbours encoded: `Neighbour1_HarrisFKG` (true), `Neighbour2_Conjecture2_preFKG`, `Neighbour3_inequality3`,
`Neighbour4_Question7`, `Neighbour5_Conjecture6_gluing`, `Neighbour6_Conjecture3` (the sealed one),
`Neighbour7_countableGraph`, `Neighbour8_probabilitiesStrictlyInside`, `Neighbour9_allEdgesHalf`,
`Neighbour10_sideConditions`, `Neighbour11_notAdjacent`, `Neighbour12_levelSets`.

Neighbours quoted and NOT encoded (they need objects the sealed file does not define):

- **Conjecture 4** (p. 32): "For any graph G, any monotone cluster property f, any A ⊂ G and any 0 ∈ G,
  E(f(0) · 1{0 ↔ A}) ≥ min_{a∈A} E(f(a) · 1{0 ↔ A})." "Conjecture 2 follows from conjecture 4 by using the
  function f(g) = 1{g ↔ b}."
- **Question 5** (p. 32): "Is it true that for any graph G, any A ⊂ G and any 0 ∈ G there are nonnegative
  coefficients (c_a : a ∈ A) with Σ c_a = 1 such that (38) holds for all b ∈ G?" where (38) is
  P(0 ↔ b) ≥ Σ_{a∈A} c_a P(0 ↔ A, a ↔ b). "If true, this will, of course, imply conjecture 2."
- **Question 8** (p. 36): "Let a be the point minimising P(a ↔ b, 0 ↮ A) among the points of A. Is it true that
  in this case the pre-FKG conjecture (41) holds?"
- **Question 9** (p. 36): "Let H be the graph given from G by removing all edges going out of 0. Let a be the
  point minimising P_H(a ↔ b) among the points of A. Is it true that in this case (41) holds?"
- **The definition of a good quadruple** (p. 12): P(0 ↔ b) ≥ min_{a∈A} P(a ↔ b) −
  Σ_{W∩A=∅} P(C(0) = W) min_{a∈A} P_{G∖W}(a ↔ b); "A good graph satisfies the pre-FKG conjecture (2)".
- **Theorem 12** (p. 34–35): P_G(0 ↔ b) ≥ P_G(0 ↔ A) min_{a∈A} P_G(a ↔ b) − (Σ_{e∈E} p_e/(1 − p_e))^{−1/2}, E the
  set of edges e for which Conjecture 1 holds in G ⏚ e. A proved, quantitative weakening.
- **The directed version** (p. 37): false, by the paper's four-vertex example.
- **Reduction 2 of §5.6** (p. 36): all vertices of degree 3.

## 8. Lean: what is unverified

There is no Lean on the machine where this was written; nothing here was elaborated.

- Seen working in the sealed files and reused as is: the binder block
  `∀ (V : Type) [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (A : Set V) (o b : V)`,
  `prob`, `connEvent`, `connSetEvent`, `Joined`, `Config`, `∃ a ∈ A`, `∀ a ∈ A`, `A.Nonempty`, `A ≠ Set.univ`,
  `fun _ => q`, `∩` of two events, `(p e : ℝ)`, `s(x, y) ∈ G.edgeSet`, `⟨s(x, y), h⟩`, set-builder
  `{ω : Config G | …}`, `[Countable V]`.
- NOT seen there, written from memory of Mathlib (each marked UNVERIFIED in its docstring):
  `IsLeast` (`Conjecture1_isLeast`); `sInf` of a `Set ℝ` (`Conjecture1_sInf`); `⨅ a : A, …` with a `Set` as the
  index type and `(a : V)` (`Conjecture1_iInf`); `⨅ a ∈ A, …` and `≥`, `*` in `ℝ≥0∞` between values of
  `percolationMeasure G p` (`Conjecture1_ennreal`); `⨅ a ∈ A, …` in ℝ (`Planted12`); `(A : Finset V)`, its
  coercion `(A : Set V)`, `∑ a ∈ A, …`, `∏ a ∈ A, …` (`Planted5`, `Planted10`, `Planted14`); `min x y` in a
  statement (`Planted11`); an event written in place as the argument of `prob` (`Planted15`); `e ≠ (⟨s(v, w), h⟩ :
  G.edgeSet)` and `(p' ⟨s(v, w), h⟩ : ℝ) = 1` (`Neighbour5`); `s(o, b) ∉ G.edgeSet` (`Neighbour11`); a
  set-builder used as the set A (`Neighbour12`).
- Small steps beyond the sealed text that I expect to be safe but have not seen in exactly this form: `A = ∅`
  for a set of vertices and a disjunction of hypotheses (`Conjecture1_emptyMinIs`; the sealed files write `= ∅`
  for events); `(n : ℕ)` with `SimpleGraph (Fin n)` (`Conjecture1_onFin`); a definition with a parameter
  (`Conjecture1_emptyMinIs (c : ℝ)`); `1 / 2 * (…)` and `2 * (…)` with real numerals (`Planted17`, `Planted9`);
  `(p e : ℝ) = 1 / 2` and `0 < (p e : ℝ) ∧ (p e : ℝ) < 1` (`Neighbour9`, `Neighbour8`); a definition that is
  another definition's name (`Neighbour6_Conjecture3`).
- `import Printed`: the sealed `Printed.lean` must be built as a module named `Printed` for these two files to
  elaborate. The sealed `Planted.lean` is a fragment (no import line) and cannot be imported; that is why
  `Conjecture1_existsForm` repeats `Neighbour1_Conjecture1` instead of naming it.
- The claim behind `Planted12` rests on Mathlib's conventions `sInf (∅ : Set ℝ) = 0` and "real `⨅` over an empty
  index is 0". If a later Mathlib changed them the belief about `Planted12` changes (and so would the empty
  case of `Conjecture1_sInf` / `Conjecture1_iInf`, harmlessly: the factor P(0 ↔ ∅) is 0 whatever the value).

## 9. What surprised me

- Nothing in the paper needs more than the printed sentence. The paper never applies Conjecture 1 directly in
  the proof of Theorem 6; it goes through Conjecture 3 only.
- The paper's own working notion of "the conjecture holds" is the inequality for ONE a ∈ A (Lemma 13, §5.6
  item 3), i.e. the sealed `Neighbour1_Conjecture1` form; and it declares the "all a ∈ A" form "clearly false".
- Conjecture 2 says "A as in conjecture 1": for Conjecture 2 an empty A is not harmless (B8). For Conjecture 1
  it is.
- Small things in print, none affecting the statement: the running head "A PRECOLATION INEQUALITY"; "two
  additional version of conjecture 1"; §5.6 announces "three simple reductions" and lists four; Conjecture 6
  introduces a vertex 0 that its hypothesis and conclusion do not use, and reads "Denote by a be the minimiser";
  "δ = 1 − √(1 − ε)" (p. 15) needs ε ≤ 1 (for ε > 1 Conjecture 3 is trivial); Conjecture 3 drops the word
  "finite" that Conjecture 1 prints; "conjecutre 2" (p. 32), "Miscellenia", "Montone".
- The TeX source carries commented-out passages (e.g. an "antenna" induction that speaks of "Conjecture 1" and
  "Our Conjecture"). They are not in the printed paper; I did not use them.
- I recomputed the directed example of §5.7: P(0 → b) = 7/16, P(0 → A) = 3/4, P(a → b) = 5/8; as printed.

## 10. The files

- `Printed1.lean` — `import Mathlib`, `import Printed`; namespace `KN1Printed`; twelve definitions, each a `Prop`.
- `Planted1.lean` — `import Mathlib`, `import Printed`, `import Printed1`; namespace `KN1Planted`; seventeen
  planted variants and twelve neighbours, each a `Prop`.
- `OBLIGATIONS1.md` — what a later stage must prove about them.
- `READING1.md` — this note.
