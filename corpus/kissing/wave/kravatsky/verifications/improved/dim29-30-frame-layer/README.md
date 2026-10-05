# Dimensions 29 and 30: a full frame of norm-8 heads at height √2

**τ(29) ≥ 209 968** and **τ(30) ≥ 221 012**, against the published **209 496** and **220 440**
(Ma et al. 2025, arXiv:2511.13391, the PackingStar configurations; the values in Cohn's table).
Gains of **+472** and **+572**.

```
python verify.py 29        # ~9 min, exact in every decision; exits non-zero on failure
python verify.py 30        # ~9 min
python verify.py 29 --fast # skips the 98280-line signature and the all-pairs sweep (~5 s)
```

Each verification reads only `data/` and `lib/golay.py`. The Leech shell is rebuilt from the
Golay code and its inner-product signature `46575 / 47104 / 4600 / 0 / 0` is checked before
anything is trusted, so nothing depends on the code that produced the configuration. The owner
classes are stored as **vectors**, not indices, so no construction order is assumed. Every
geometric decision is exact: integer inner products on the ℝ²⁴ side, and integer quadruples
`(a + b√2 + c√3 + d√6)/24` with sympy deciding the sign on the ℝᵏ side.

## The configuration

Norm-4 units: a point of ℝ²⁴⁺ᵏ is `(x, y)` with `|x|² + |y|² = 4`, and two points are compatible
iff their inner product is at most 2.

| | k = 5 (dim 29) | k = 6 (dim 30) |
|---|---|---|
| equator `(u, 0)`, `u` minimal and not an owner | 189 616 | 184 656 |
| cap `(√(2/3) u, (2/√3) z)`, `u` an owner, `z` a direction of its group | 19 840 | 35 712 |
| axis `(0, 2a)` | 32 | 68 |
| **layer `(v/2, √2 w)`, `v` one of the 48 vectors of a Leech frame, `w` one of the 2k directions of a cross-polytope** | **480** | **576** |
| | **209 968** | **221 012** |

## The mechanism

Dimension 28 (`../dim28-norm8-frame-layer/`) found that the head's **norm** is a free parameter
and that a norm-8 head at height √2 carries a whole frame: 48 head vectors × 8 directions = 384
points in ℝ²⁸. Three of the layer's four constraints are free in *any* dimension:

* it **deletes no equator point** — a norm-8 lattice vector meets a minimal one at `⟨v,u⟩ ≤ 4`,
  so `⟨v/2, u⟩ ≤ 2` exactly;
* one head carries every direction with `⟨w,w'⟩ ≤ 0`, so a whole **cross-polytope**, `2k` of them;
* two heads share a direction as soon as `⟨v,v'⟩ ≤ 0`, so all 48 vectors of a frame carry all
  `2k` directions — **96k layer points**, 480 in dimension 29 and 576 in dimension 30.

The fourth constraint is the whole content. Against a cap it reads

    ⟨u,v⟩/√6 + (2√2/√3)·⟨z,w⟩ ≤ 2,

so if every owner is **type B** for the frame — `|⟨u,v_i⟩| = 2` for all 24 heads, never 3 or 4 —
the threshold on the directions is `⟨z,w⟩ ≤ √(3/2) − 1/2 = 0.724744871…`. The `τ(k)` cap
directions are a root system, and D₄, D₅, E₆ and E₇ each have an orthonormal frame in which
**every root has maximum coordinate `1/√2 = 0.707106781…`** — for E₇ one has to rotate the pair
`(e₆, e₇)` by 45°, because the two roots `±√2 e₇` are otherwise aligned with a frame vector. The
margin is one inequality, the same one dimension 28 turns on:

    1/√2 ≤ √(3/2) − 1/2   ⟺   1 + 1/√2 ≤ √3   ⟺   √2 < 3/2.

So the layer costs nothing geometrically. It costs **the class problem**: all `T = ⌊τ(k)/3⌋`
owner classes must be type B for one common frame, where dimension 28 needed 8, dimension 29
needs 14 and dimension 30 needs 24.

## Why that turned out to be cheap

**Choose the coordinates so that the frame is `8e₁ … 8e₂₄`.** In those coordinates the type-B
lines are exactly the `759 × 64 = 48 576` octad vectors `(±2⁸, 0¹⁶)` of the standard Golay code —
and the whole monomial group `2¹²:M₂₄`, of order 1.0·10¹², permutes them. **Every monomial image
of a type-B class is therefore again a type-B class**, and no filtering is needed at all. The
dimension-28 search worked in a sextet frame, where only 2.2·10⁻³ of monomials gave a clean image;
in frame coordinates that filter disappears and what is left is a pure packing problem.

It is also a packing problem with cheap moves. A type-B line is an **octad plus a position in
F₂⁶**, and a Golay sign word acts on it by translating the position inside its octad — so all
4096 sign images of a class under one permutation are a single gather, and the sign word of a
class is an *exactly solvable* coordinate: hold the other classes fixed and take the sign word
that collides least. Coordinate descent over the sign words, with a batch of fresh permutations
whenever a class is visited, reaches 14 disjoint 248-line classes in seconds.

Finally, **any subset of a class is again a class**, so a family with a few repeated lines is not
wasted: dropping the repeats gives the honest count. In dimension 30 the family is EXACT: 24 pairwise
disjoint classes of the full 248 lines, `24 × 248 = 5 952` owner lines, found by freezing a core
of 12 disjoint classes, building a pool of images disjoint from the whole core, and solving
max-clique on that pool (`research/collab2531/BRAINSTORM_2831.md`).

## The identity

With `T` classes carrying a zero-sum triangle and `T'` carrying only an antipodal pair,

    K(24+k)  =  196560  +  4·(lines in triangle classes)  +  2·(lines in pair classes)
                        +  |axis|  +  96k.

An owner leaves the equator and comes back as three caps, so a triangle class is worth `+2` per
owner vector and `+4` per owner line. Dimension 29 has 12 triangles and 2 antipodal pairs
(τ(5) = 40 is not a multiple of 3, and the 40 directions of a maximum 60° code in ℝ⁵ sum to zero,
so 13 disjoint zero-sum triangles cannot be carved out of one).

## The axis

The layer constrains the axis by `|⟨a,w⟩| ≤ 1/√2`, on top of the classical cap bound
`⟨a,z⟩ ≤ √3/2`. Carried into the frame coordinates, the *published* 40-point axis of dimension 29
keeps **32** of its points and the published 72-point axis of dimension 30 keeps only **48**. The
profile of `maxᵢ|⟨a,wᵢ⟩|` over the published axis says why:

| | 1/2 | 1/√6 | 1/√2 | √(2/3) | 1 |
|---|---|---|---|---|---|
| dimension 29, 40 points | 16 | | 16 | | **8** |
| dimension 30, 72 points | | 32 | 16 | **24** | |

with the bolded entries the ones that die. In dimension 29 they sit at exactly `1` — they *are*
frame directions — so no rotation of the frame recovers them. In dimension 30 they need only a
15% reduction, and **a rotation of the axis finds it**: a maximum 60° code in ℝ⁶ is a rotated
copy of E₆ and the rotation is free, so turning it by 45°, 45° and 90° in the coordinate planes
(0,1), (2,3), (3,5) — which keeps every coordinate inside the `(a + b√2 + c√3 + d√6)/24` field the
package already stores — keeps **68 of 72**.

**Both axes are now maximal, exhaustively.** A further axis point is a *unit* `a ∈ ℝᵏ` with
`⟨a,aᵢ⟩ ≤ 1/2`, `⟨a,z⟩ ≤ √3/2` and `|⟨a,w⟩| ≤ 1/√2`. Every right-hand side is positive, so those
half-spaces cut out a polytope `P` with the origin in its interior; `|a|` is convex, so
`max_P |a|` is attained at a **vertex** of `P`. Enumerating all of them (114 vertices at k = 5,
202 at k = 6) gives `0.7929` and `0.8165` — `P` contains no unit vector at all, so nothing can be
added, over the continuum and not over a sample. The control is that dropping any one axis point
recovers a unit vector, and always exactly one: the point removed. So no one-for-one swap opens
either axis. `python ceilings.py 29` or `30` runs this; the scope is these axis codes against
this frame and these directions, and a different code is a different polytope.

## Files

| | |
|---|---|
| `verify.py` | the verification, `python verify.py 29` or `30` |
| `data/owners29.npy`, `data/owners30.npy` | the owner lines as integer Leech vectors of norm 32, in the coordinates where the frame is `8eᵢ` |
| `data/bounds29.npy`, `data/bounds30.npy` | where each class starts and ends in that array |
| `data/geom29.json`, `data/geom30.json` | cap directions, their partition into groups, the layer frame and the axis — all as integer quadruples `(a + b√2 + c√3 + d√6)/24` |
| `lib/golay.py` | the extended binary Golay code, via the cyclic QR construction |
| `ceilings.py` | the companion report: which factors are at a ceiling, and on what evidence, `python ceilings.py 29` or `30` |
| `verify29.log`, `verify30.log`, `ceilings29.log`, `ceilings30.log` | recorded runs |

The construction scripts live in `research/collab2531/frame/`; the working note is FINDINGS
section 59.

## What would improve this

Two things. The first is the class problem. The owner term is `4 × (lines)` and the ceiling on a
single class is 248 lines realised, 425 by the Delsarte bound on the Leech line scheme — one extra class line is
worth `+52` in dimension 29 (direction weight 26) and `+96` in dimension 30 (weight 48). The layer, the axis and the directions
are all at their own ceilings: 96k is every frame vector on every cross-polytope direction, the
axis is maximal by the vertex enumeration above, and the direction weight `w = ⌊2τ(k)/3⌋` — 26
here and 48 in dimension 30 — is a theorem, since two classes sharing a direction would be one
class, a group of directions pairwise at `≤ −1/2` has at most three members, and the groups'
union is therefore a 60° code in ℝᵏ. **That last ceiling is conditional on τ(k)**: 40 and 72 are
the best *known* kissing numbers in ℝ⁵ and ℝ⁶, not proved ones, and against the proved bounds
τ(5) ≤ 44 and τ(6) ≤ 77 the unconditional ceilings are 29 and 51 — three higher each, worth 1 488
points apiece. Dimension 28 is the only member of the family where τ(k) is settled. Nor can a *second* layer sit on this one. Because
the frame layer's direction runs over the whole cross-polytope, any layer `(x, h w′)` above it
needs `√2·h/√k ≤ 2 − max⟨v,x⟩/2`, which the height-√3 layer of `../../superseded/dim31-sqrt3-layer/` fails
outright at k = 4 and 5 and clears with nothing to spare at k = 6 — where it then fails against
the caps, since it would need a direction at `⟨z,w′⟩ ≤ (2 − 2/√6)/2 = 0.5918` and E₆'s covering
cosine is `√6/4 = 0.6124`. Only E₇ clears both, at `1/√3 = 0.5774`, and dimension 31 is the one
place with no frame layer to sit on (`research/collab2531/frame/secondlayer.py`). The packing,
which in dimension 30 was 5 941 of 5 952 lines and worth +44, is now closed: the family is exact.

**Dimension 31 reaches too, and is in its own package.** The same layer is 672 points there and
the geometry fits exactly as it does here; the price is 42 pairwise disjoint classes holding at
least 10 252 of the 10 416 lines 42 full classes would give. That was the open search when this
package was written — the descent stalled at 10 183 — and it was won on 2026-09-17 at 10 328
lines, by screening candidates on the octad coverage instead of scanning uniformly. See
[`../dim31-frame-layer/`](../dim31-frame-layer/).

## History

| year | dim 29 | dim 30 | who |
|---|---|---|---|
| 2025 | 209 496 | 220 440 | Ma et al., arXiv:2511.13391 (PackingStar), the values in Cohn's table |
| 2026-09-15 | 209 594 | 220 494 | this project: a layer at height √(5/2) in the D₅ deep holes (dim 29) and at height √2 in the E₆* directions (dim 30) — both now superseded, in `verifications/superseded/` |
| 2026-09-15 | **209 968** | 220 948 | this package, with 5 941 of 5 952 owner lines |
| 2026-09-17 | **209 968** | 220 992 | this package, with the packing closed at 24 × 248 = 5 952 |
| 2026-09-17 | **209 968** | **221 012** | and with the axis raised from 48 to 68 of 72 |
