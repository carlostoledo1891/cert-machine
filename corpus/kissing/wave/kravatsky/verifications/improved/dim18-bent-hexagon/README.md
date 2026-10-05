# Dimension 18: a hexagon of bent-coset tiers over the odd Barnes–Wall lattice

**τ(18) ≥ 8 358**, against the published 7 654 (Cohn's table; H. Cohn and A. Li,
*Improved kissing numbers in seventeen through twenty-one dimensions*,
[arXiv:2411.04916](https://arxiv.org/abs/2411.04916)). An improvement of **+704**.

```
python verify18.py          # ~10 s, exact arithmetic in every decision; exits non-zero on failure
```

It reads only `data/` — the 30 octads of RM(1,4) in the coordinate labelling used throughout,
three families of sixteen 6-subsets of the 16 coordinates, and 960 sixteen-bit words — and
rebuilds all 8 358 vectors from them. Every pair is decided exactly: the ℝ¹⁶ parts are
integers, the ℝ² parts live on three circles and the twelve angles 30k°, so every inner
product is a + b√3 with integers a, b, and the comparison with the threshold is done by
squaring. No floating point enters any decision.

## The configuration

Norm-8 units: a point of ℝ¹⁸ is `(v, p)` with `v ∈ ℝ¹⁶`, `p ∈ ℝ²`, `|v|² + |p|² = 8`, and two
points are compatible iff their inner product is at most 4.

| | `|p|²` | angles of `p` | `v` | points |
|---|---|---|---|---|
| equator | 0 | — | odd BW₁₆: `(±2,±2,0¹⁴)` and ±1 on each octad of RM(1,4) with an odd number of minus signs | 480 + 30·128 = 4 320 |
| tiers | 2 | 0°, 60°, …, 300° | ±1 on a 6-set of the family attached to the angle, odd number of minus signs | 6 × 16 × 32 = 3 072 |
| poles | 8 | 0°, 60°, …, 300° | 0 | 6 |
| **tier B** | 8/9 | **30°, 90°, …, 330°** | `(2/3)(−1)^c`, `c` one of 160 words per angle | **6 × 160 = 960** |
| **total** | | | | **8 358** |

The first three rows are Cohn–Li's own layout: decoding their 7 654 from Cohn's coordinates
(`research/dim18/decode.py`) shows exactly this hexagon, with their 256 tier-B words sitting
at 0° and 180° only. The whole gain is in the last row, and it comes from choosing the three
6-set families differently.

## Why the families decide everything

Write `c ∈ F₂¹⁶` for the sign word of a tier-B vector. Against the odd octad vectors `c` must
be even on every octad, i.e. `c ∈ RM(2,4)`; against a tier at angular distance less than 90°
it must be *even on every 6-set of that tier's family* (at 90° or more there is no
constraint at all; that is the whole reason the 30° angles are better than 0°). For
`c ∈ RM(2,4)` the parity `⟨c, 1_X⟩` depends only on the coset of RM(1,4) containing `1_X`,
so a family whose sixteen 6-sets all lie in **one** coset `z + RM(1,4)` costs tier B a single
linear condition `⟨c, z⟩ = 0`. The cosets of RM(1,4) inside RM(2,4) with weight-6 words are
exactly the 28 **bent** cosets (weights 6 and 10, sixteen each); their weight-6 words form a
symmetric 2-(16,6,2) design, pairwise meeting in two cells — a valid tier, and a maximal
one: CP-SAT proves sixteen is the largest family of admissible 6-sets
(`research/dim18/maxfam.py`).

On `RM(2,4)/RM(1,4) ≅ F₂⁶` the pairing `B(q,z) = ⟨q,z⟩` is a nondegenerate symplectic form and
"bent" is the quadric O⁺(6,2) (28 nonsingular points). For bent `q, z`: `B(q,z) = 1` iff
`q + z` is bent, and that is also *exactly* the condition for two tiers 60° apart to be
compatible (their 6-sets must meet in at most three cells). So a hexagon design is a triangle
`z₀, z₁, z₂` of the bent-sum graph. Two cases:

* `z₂ = z₀ + z₁` ("closed"): every one of the twelve possible tier-B angles sees the same
  512-word space, and since a word can be used at only one angle the total is capped at 512
  (CP-SAT: 512, optimal).
* `z₀ + z₁ + z₂ ∉ RM(1,4)` ("open", 280 of the 336 triangles): the six angles 30° + 60°k see
  three *different* 512-word spaces (pairwise meeting in a 256-word one). Each is an affine
  4-space of RM(1,4)-cosets over an elliptic quadric; full cosets pairwise at bent difference
  form a distance-6 code, the bent-difference graph on the sixteen cosets is the complement
  of the Clebsch graph, clique number 5, hence 5 × 32 = 160 per angle. The 160-word sets at
  the six angles are pairwise disjoint (distinct words of RM(2,4) are automatically at
  distance ≥ 4, which is all that angles ≥ 60° apart require).

Cohn–Li's first family is bent coset #12 in our enumeration; their other two are each half of
one bent coset and half of another, which costs an extra dimension each and makes every angle
see the same 256 words — so 256 was a hard ceiling for their base, and the dimension was
recorded as closed for the wrong reason (closed for the *code*, with the *base* fixed).

## Ceiling of the scheme, and what does not carry over

Angles 30° apart must jointly form a distance-6 code inside the 30°-angle's 512-word space
(a hexagon angle's space is a subspace of both neighbours'), and the twelve angles split
into six such disjoint pairs, so tier B ≤ 6·M₆ where M₆ is the largest distance-6 code in
an elliptic 512-word space. M₆ = 160 exactly: that 512-word conflict graph is isomorphic to
the girth-5 Cayley graph whose independence number 160 was certified optimal by CP-SAT for the
cuboctahedron scheme one dimension up (`research/dim19/alpha512.py`, `research/dim18/m6iso.py`),
so the scheme's ceiling is exactly 8 358 and the record is its maximum. Everything else is pinned — poles ≤ τ(2) = 6, sixteen 6-sets per tier is
the maximum, and the only `v`-shapes compatible with the equator and a hexagon of tiers are
norm 6 (the tiers), norm 64/9 (tier B) and 0 (poles): every pair of cells lies in two blocks
of every biplane, so nothing of small support stays at inner product ≤ 1 from an adjacent
tier. In ℝ¹⁶ ⊕ ℝ⁴ and ℝ¹⁶ ⊕ ℝ⁵ the same design is capped by the 2 048 distinct words of
RM(2,4) at 18 680 and 26 888, below the records 19 448 and 29 768. Dimension 17 has no
angles (two slots, 192 each, Cohn–Li's value).

*Update 2026-09-23.* The norm-6 layer also admits the dual-type vectors (3/2 at one cell, 1/2
elsewhere, sign word in RM(2,4)), which an earlier note wrongly excluded; they do not form 512-tiers
of their own, both 512 tiers used here are maximal even in the continuous sense, and the joint
spectral bound on a mixed tier is 559 (`research/dim18/NOTES.md` §9). With the 32-point half-tiers
at the norm-16 positions the same family reproduces the 19 448 and 29 768 records exactly, so
the R^16 ⊕ R^k design is pinned in 17-21 unless a mixed tier beats 512.

## Files

| file | what |
|---|---|
| `verify18.py` | rebuilds the 8 358 points from `data/` and checks every pair exactly; self-test included |
| `data/octads.json` | the 30 octads of RM(1,4) (the equator's supports) |
| `data/families.json` | the three bent-coset families, sixteen 6-sets each, at 0°/180°, 60°/240°, 120°/300° |
| `data/tierB.json` | the 960 tier-B words, 160 per angle, as 16-bit integers |

The search that produced the families and words is in `research/dim18/` (`bent.py`
enumerates the 28 bent cosets, `design2.py`/`runC.py` solve the placement by CP-SAT,
`verify2.py` is a second, independently written exact checker in the basis {1, √2, √6}).

## History of the bound in dimension 18

| year | bound | who |
|---|---|---|
| 1967 | 7 398 | Leech, Λ₁₈ |
| 2024 | 7 654 | Cohn–Li, the odd sign convention and tier B |
| 2026 | **8 358** | this package |
