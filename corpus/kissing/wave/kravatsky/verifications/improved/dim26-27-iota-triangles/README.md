# Dimensions 26 and 27: the coset triangle on every triangle of directions

**τ(26) ≥ 199 806** and **τ(27) ≥ 201 566**, against the published 198 550 and 200 044
(Cohn's table; Ma et al. 2025) and this repository's earlier 200 540 in dimension 27 (now in
[`../../superseded/dim27-triple-partition/`](../../superseded/dim27-triple-partition/)).
Improvements of **+1 256** and **+1 465** over the table.

```
python verify26.py          # ~1 min, exact arithmetic in every decision; exits non-zero on failure
python verify27.py          # ~2 min, the same for dimension 27
```

Both read only `data/` and rebuild the 196 560 Leech minimal vectors from the Golay code
(`lib/golay.py`, `lib/leech.py`), so nothing depends on the code that produced the
configurations. The checks themselves are in `lib/layered.py`.

## The configurations

Work in norm-4 units: Leech minimal vectors have squared length 4, two points are compatible
iff their inner product is at most 2, and write a point of ℝ^(24+k) as `(x, y)` with `y` in
ℝᵏ. On the axis sit the τ(k) points `(0, a)` with `|a| = 2`: a hexagon for `k = 2`, a
cuboctahedron for `k = 3`. A cap point `(x, y)` then has `|y| ≤ 1/cos θ` for the axis's
covering radius `θ`, so the hexagon forces `|x|² ≥ 8/3` with equality forcing `y` onto the six
edge midpoints; a head at `|x|² = 8/3` carries a *triangle* of directions; and two cap points
there are compatible iff `⟨x, x'⟩ ≤ 2 − (4/3) cos ∠(y, y')`, that is `2/3` on the same
direction, `4/3` on directions 60° apart, and no condition at 120° or 180°.

So the whole layer is a few *sides* — two for the hexagon, four for the cuboctahedron, one per
triangle of directions — each a set of heads at cosine ≤ 1/4 on the sphere `|x|² = 8/3`,
cross-constrained at cosine ≤ 1/2, and

| | dimension 26 | dimension 27 |
|---|---|---|
| equator `(z, 0)`, `z` a minimal vector that is not an owner | 194 778 | 194 160 |
| caps, three per head | 3 × 1458 | 3 × 2258 |
| caps, two per second-layer head | 2 × 324 | 2 × 310 |
| axis | 6 | 12 |
| **total** | **199 806** | **201 566** |

Every head is `y/3` with `y = 3u + v` an integer vector: `u` a minimal vector (the *owner*,
which the head removes from the equator) and `v` a Leech vector of norm 6 (a *lean*) with
`⟨u, v⟩ = −3`; or a *free head* `y = ±2v`, which removes nothing. A head removes exactly its
owner (`y = 2u + w` with `w = u + v` minimal and `⟨u, w⟩ = 1`, so `⟨y, z⟩ ≥ 7` forces
`z = u`), and two heads on one owner have `⟨y, y'⟩ ≥ 16`, above every threshold — so removals
are never shared and the count is `196 560 + τ(k) + 2·(class heads) + 3·(free heads)`:
`1458 + 0` heads in dimension 26 (its free heads are given up for the second layer, below) and `2090 + 168` in dimension 27, the three item types having been optimised together rather than in sequence (B. Lindow); choosing them one after another gives `2133 + 129`.

**The triangle.** Three norm-6 vectors with `v₁ + v₂ + v₃ = 0`, pairwise at `−3`, carry
1656 class heads over three disjoint blocks `Σ(vᵢ) = {u : ⟨u, vᵢ⟩ = −3}` of 552; on one side
its exact optimum is 762 heads, against 552 for a single lean (Cohn's construction).

**The involution.** In dimension 26 the *same* triangle serves both sides: `ι(u) = −vᵢ − u`
is a fixed-point-free involution of each block, and
`⟨3u + vᵢ, 3ι(u') + vᵢ⟩ = 15 − 9⟨u, u'⟩`, which is at most the cross threshold 12 exactly
when `⟨u, u'⟩ ≥ 1`. So a side `S` and its image `ι(S)` fit on the two triangles of the hexagon
whenever the owners of `S` are pairwise at inner product 1 or 2 inside each block — a
two-distance set — and such an optimal `S` exists (762 heads, split 243 / 243 / 276). The
shipped configuration was found by a maximum-independent-set solve in which each head chooses
its side; it keeps 2 × 762 class heads, 33 of them (on one side) over the negatives `−vᵢ` of
the triangle's leans, the other triangle of the same hexagon, and six free heads.

**Dimension 27.** The twelve cuboctahedral directions are four zero-sum triangles, every two
with a pair at 60°, so all four sides are cross-constrained at 4/3. The axis is the
cuboctahedron rotated by 45° about a coordinate axis: its largest cosine against a direction is
`(2 + √2)/4`, and the head–axis inner product is at most `(2 + √2)/√3 = 1.9712 < 2`. Two
triangles of leans with cross Gram matrix the circulant of `(3, 0, −3)` carry 2210 class heads
over the four sides (625 + 459 on one triangle, 665 + 461 on the other) and six free heads.

**The free heads are the whole margin, and their cost is shared.** A free head `y = ±2v`
sits on the same sphere, removes nothing, and is therefore worth `+3` where a class head is
worth `3 − 1 = +2`. The earlier configuration carried only the six free heads that the
triangle's own leans supply, because a free head conflicts with class heads already placed and
each such class head has to go. What makes the trade pay is that the conflicts *concentrate*:
across the whole norm-6 shell only about 72 class heads ever appear as blockers, and hundreds
of candidate free heads are blocked by the same one, so a single deletion is paid once and
unlocks many. Choosing the free heads and the class heads to drop is then one problem —

    maximise  3·|new free heads| − Σ cost(dropped head),   cost 2 for a class head, 3 for a free one,

over sets of free heads that are pairwise admissible (`⟨S, S′⟩ ≤ 8` on one side, `≤ 24`
across) — and it is the joint solve, not the per-head one, that matters: 489 of the dimension-26
candidates are blocked by the *same* head, so pricing them one at a time makes every one of
them look unaffordable. Solving them together gave 96 free heads for 66 class heads and the
six old free ones in dimension 26 (`3·96 − 3·6 − 2·66 = +138`) and 129 for 77 in dimension 27
(`3·129 − 3·6 − 2·77 = +215`).

**Dimension 27 carries a second cap layer, and dimension 26 cannot.** A cap with `|y| = 1`
has `|x|² = 3`; it satisfies the axis condition `⟨y, a⟩ ≤ 2` whatever direction it points,
because `|y||a| = 2`, and it carries the antipodal pair `±y` and no more, since three
directions would need pairwise cosine `≤ −1`. Nothing in `{x : ⟨x, z⟩ ≤ 2}` has norm above
`8/3`, so such a head always deletes; the scaled owner `x = (√3/2)u` deletes *exactly* `u`,
because `⟨x, z⟩ > 2` needs `⟨u, z⟩ > 4/√3 = 2.31`, i.e. `⟨u, z⟩ = 4`, i.e. `z = u`. Two cap
points for one deletion: **+1 each**.

Its direction has to clear the twelve first-layer directions, and that is the whole
difference between the two dimensions. In dimension 26 those are the six edge midpoints of a
hexagon, the widest gap is 30°, and measured against the shipped layer **not one** of the
196 560 minimal vectors qualifies. In dimension 27 they are the cuboctahedron's twelve
vertices, whose covering radius is 45°, attained exactly at the six square-face centres
`±e₁, ±e₂, ±e₃` — three antipodal lines. That single extra quantum takes the admissible
owners from 0 to **3110**, and 303 of them fit (104 + 99 + 100). Everything reduces to two
integer comparisons,

    ⟨Y, u⟩ ≤ 32   because  (√3/48)·32 + 2/√6 = (2+√2)/√3 = 1.9712 < 2
    ⟨u, u′⟩ ≤ 8   on one line, because  (3/32)·8 + 1 = 7/4 < 2

with everything else automatic: against the equator `(√3/2)·2 < 2`; across lines
`(3/32)·16 = 3/2 < 2`; on one line with opposite signs `(3/32)·16 − 1 < 2`; against the axis
`⟨y, a⟩ ≤ |y||a| = 2`. The next tier of candidates (10 647 at `⟨Y, u⟩ = 40`) is out of reach:
each has about 25 first-layer blockers and a dropped class head costs 2 against a
second-layer head's 1.

## What the verifiers check

`lib/layered.py` takes the heads as integer vectors `y` (Cohn units, norm 192) with the index
of their triangle, and the directions and axis points as `sympy` vectors. It rebuilds the
minimal vectors; requires every head to remove at most one of them and the owners to be
distinct; computes the maximum cosine between every two triangles of directions exactly and
turns it into the integer threshold `144 − 96c` (48 or 96) that every head–head pair must
satisfy; decides the head–axis and axis–axis inequalities in `ℚ(√2, √3)`; and recomputes the
count from what it verified. No floating-point number decides anything. Both programmes were
tested for falsifiability: a head moved to another triangle, a head duplicated on two
triangles, and a head displaced by a minimal vector are each rejected.

## Files

    verify26.py  verify27.py        the verifiers; each prints ALL CHECKS PASS and the bound
    verify26.log verify27.log       their output
    lib/golay.py  lib/leech.py      the Leech minimal vectors from the Golay code
    lib/layered.py                  the exact checks, shared by both
    data/heads26_Y.npy  data/heads26_side.npy    the 1554 heads (int64, Cohn units) and their triangle (0 or 1)
    data/heads27_Y.npy  data/heads27_side.npy    the 2259 first-layer heads and their triangle (0 to 3)

## Provenance

Joint work in progress with H. Cohn and B. Lindow (dimensions 25–31). The template — a Leech
equator, caps on triangles of directions, an axis polytope — and the idea of lifting the block
`Σ(v)` above a norm-6 direction are Cohn's; the 24-cell of leans is Lindow's; the exact
reduction to sides, the involution, the side-as-a-variable search and the rotated axis are new
here. **The dimension-27 configuration shipped in `data/` is B. Lindow's**, contributed
2026-09-21 and adopted here on 2026-09-27: 2090 class heads, 168 free heads and a 310-head
second layer, found by letting all three item types move together in one exact 0-1 programme
with weights 2, 3 and 1 instead of in sequence. It raised 201 557 to 201 566. The artefact as
sent, with its own verifier and a second, independently written one, is kept at
[`contributed/dim27-joint-optimised-two-layer`](../../../contributed/dim27-joint-optimised-two-layer/);
`verify27.py` here is unmodified and verifies it. The full account is section 8 of the note *Kissing configurations in dimensions 25, 26
and 27* (internal to the collaboration), whose `factcheck.py` and `formulas.py` re-derive every
figure and formula in it. What the analysis forbids: a side is a code at cosine ≤ 1/4 in ℝ²⁴,
so at most 1228 heads, and its free heads at most 280, which caps this template at 202 038
and 207 516; and the class heads of the 24-cell stop at 762 per side in every solve run.
