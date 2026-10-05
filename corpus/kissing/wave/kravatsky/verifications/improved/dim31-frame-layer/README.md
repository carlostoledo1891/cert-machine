# Dimension 31: the norm-8 frame layer at height √2

**τ(31) ≥ 238 662**, against the published **238 350** (Ma et al. 2025, arXiv:2511.13391, the
PackingStar configuration; the value in Cohn's table) and against this project's own previous
**238 354**, which used a height-√3 layer on two deep-hole lines and is now in
`verifications/superseded/dim31-sqrt3-layer/`.

Run `python verify.py 31` — exact, about seven minutes.  The Leech shell is rebuilt from
`lib/golay.py`; nothing is read from outside this directory.  `python ceilings.py 31` is
the companion report on what in the configuration is finished and what is not.

## The configuration

A point of ℝ³¹ is `(x, y)` with `|x|² + |y|² = 4` in norm-4 units, and two points are compatible
iff `⟨P,Q⟩ ≤ 2`.

| | count |
|---|---|
| equator `(u, 0)`, `u` a Leech minimal vector that is not an owner | 175 904 |
| cap `(√(2/3) u, (2/√3) z)`, `u` an owner, `z` a direction of its zero-sum triangle | 61 968 |
| axis `(0, 2a)` | 118 |
| **layer `(v/2, √2 w)`, `v` one of the 48 vectors of a Leech frame, `w` one of the 14 directions of a cross-polytope** | **672** |
| | **238 662** |

The identity is `K(31) = 196560 + 4L + |axis| + 96k` with `k = 7` and `L` the number of owner
LINES, so every owner line is worth 4 points and the whole thing turns on `L`.

## Why this was not claimed before

The norm-8 frame layer of [`../dim28-norm8-frame-layer/`](../dim28-norm8-frame-layer/) and
[`../dim29-30-frame-layer/`](../dim29-30-frame-layer/) pays `96k` points in every dimension
24 + k and costs only the class problem: every owner must be **type B** for the frame, i.e. of shape `(±2⁸, 0¹⁶)` in the
coordinates where the frame is `8eᵢ`.  Dimension 31 needs **42** pairwise disjoint 248-line
type-B classes — `T = ⌊τ(7)/3⌋ = 42`, one per zero-sum triangle of the E₇ root system — and the
layer only pays if they carry more than

        4L + 118 + 672 > 238354 − 196560 = 41 794 ,   i.e.  L ≥ 10 252

of the `42 × 248 = 10 416` lines that 42 full classes would give: 98.4 per cent.  This project's
own earlier coordinate descent over the sign words reached 10 183 (97.8 %) and the layer was left
unclaimed in dimension 31.  This package carries **10 328**.

## What closed it

Two measurements, and a lever neither of them was looking for.

**The problem was never an existence question.**  Two uniform monomial images of the record
248-line class are disjoint with probability **0.4319 ± 0.0030** (re-measured independently on
2026-09-17 over 40 000 images: 0.4305 ± 0.0025), so a family of 42 pairwise disjoint classes is
a clique in a graph of that density on the ~10¹² images, and the random-graph clique number is
`2 ln(10¹²)/ln(1/0.4319) ≈ 66`.  Forty-two was always far below the threshold.

**A group does not help.**  If a group `H` acts on the 48 576 type-B lines and the class meets
every `H`-orbit at most once, the `|H|` images are disjoint for free.  But no monomial element
acts on the lines with order ≥ 42 (for `π` of order 21 or 23 the only invariant Golay words are
`0` and `Ω`, and `Ω` acts trivially on lines), and `C_{M₂₄}(7A) = C₇ × S₃`, the order-42
subgroup that does exist, has orbits `1 × 3 + 169 × 21 + 1072 × 42`, so only 92.7 per cent of
the lines are in a free orbit and a 248-line class avoids the short ones with probability
`0.927²⁴⁸ = 7 × 10⁻⁹`.  Measured: 0 of 53 248 images.

**But a sampled clique search has a greedy limit, and it is a function of the density.**  A
search that can only draw candidates reaches `n·p^k = 1`, i.e. `k = 1 + 12 ln10 / ln(1/p)`, so
**42 needs `p ≥ 10^(−12/41) = 0.5097`** and `p = 0.4319` gives 34.  Conditioning on the number
`s` of support octads two images share gives `1.000 / 0.627 / 0.453 / 0.319 / 0.249 / 0.212` for
`s = 0…5` — monotone, and `exp(−0.35 s)` to about 15 per cent.  A random pair has `s = 2.55`;
`p` is the AVERAGE of `p(s)` over that distribution, which is the 0.4319 above and not the
`p(2.55) ≈ 0.41` the fit would give.  That is the whole story, because `s` is not a constant:

        Σ_{i<j} |S_i ∩ S_j|  =  Σ_O C(n_O, 2) ,      Σ_O n_O = 42 × 44 = 1848

over the 759 octads, so the flattest coverage gives 1419 and `s = 1.65`, which at the measured `p(s)`
is `p ≈ 0.53` and a reach of 44.  (1419 ignores that a class's 44 octads must lie in its trio's
84-octad arena; water-filling against the arenas this family actually uses gives **1437**, which
is the real floor for it.)  The 10 296-line family reached by scanning 10¹¹ images sits at **1898**, with 34
octads unused and seven carrying six supports; its own `p` is 0.4984, just below the threshold,
and no amount of further scanning was going to move it.

So `packgpu/deep31.py` scores every candidate not only by what it costs now but by what it
costs the classes still to come — `−Σ_heavy log(free8[O]/240) − Σ_light log(free4[O]/15120)`
plus a convex penalty in the octad loads, where `free8` counts the 8-slots still free at that
octad out of the 240 cosets of the 30 extended Hamming codes.  That score needs only where the
44 support octads go, which is three gathers against a precomputed action of the sampling pool
on the 759 octads: about 800 operations against the 52 000 of an exact Walsh evaluation of all
4096 sign words, so a move screens half a million candidates and pays the exact cost for the
best thousand.  On a T4 that is **9 × 10⁶ candidates a second against 37 000**.

A balanced build alone — 42 greedy insertions, 84 seconds — reaches 10 287 lines at
`Σ_O C(n_O,2) = 1606` and `p = 0.55`, past the threshold and already above the 10 183 the
earlier descent reached; the search then runs for the first time in the regime where 42 is
reachable, and carries **10 328**.

| | 10 296-line family | this package |
|---|---|---|
| `Σ_O C(n_O,2)`, floor 1437 for these trios | 1898 | **1670** |
| octad coverage | 34 unused, 7 at six | 8 unused, 12 at five |
| `p` | 0.4984 | **0.5467** |
| greedy reach `1 + 12 ln10 / ln(1/p)` | 40.7 | **46.8** |
| owner lines | 10 296 | **10 328** |

## The geometry, exactly

All of it is stored as integer quadruples `(a,b,c,d)` meaning `(a + b√2 + c√3 + d√6)/24`.

* **directions** — the 126 E₇ roots, normalised, partitioned into 42 zero-sum triangles by an
  exact cover (CP-SAT, OPTIMAL, over the 672 triangles);
* **frame** — `e₀ … e₄` and `(e₅ ± e₆)/√2`, the rotation that makes every E₇ root have largest
  coordinate `1/√2 = 0.70711` against the cap-layer threshold `√(3/2) − 1/2 = 0.72474`;
* **axis** — E₇ rotated by 45°, 45° and 90° in the coordinate planes (0,3), (2,4), (5,6), kept
  where it is flat enough for the layer: **118 of 126**, against the 110 that the published axis
  carried over would have kept.  A maximum 60-degree code is a rotated copy of the root system
  and the rotation is free; see `research/collab2531/BRAINSTORM_2831.md` section 7.

## What is at a ceiling, and on what evidence

`python ceilings.py 31` (seconds, log in `ceilings31.log`) prints this and checks it.

| factor | value | status |
|---|---|---|
| layer | 672 = 96k | **proved**: 48 pairwise non-positive vectors of ℝ²⁴ are a frame, and one head carries a whole cross-polytope, so `96k` is every head line on every direction |
| direction weight | 84 = ⌊2 τ(7)/3⌋ | **proved given τ(7)**, see below |
| axis | 118 | **exhaustive**: no unit vector at all can be added |
| equator | 196 560 − 2L | forced |
| class | 248 lines | **open** — the only lever, at +168 a line |
| packing | 10 328 of 10 416 | **open** — 88 repeats, up to +352, of which **2 are certified unavoidable** for this support set; the sign side and the re-slot neighbourhood are closed (below) |

**The direction weight.**  Two owner classes sharing a direction would meet at `⟨u,u'⟩ ≤ 1`
everywhere and so would be one class; inside a group the directions are pairwise at `≤ −1/2`, so
`|Σz|² ≥ 0` caps a group at three; across groups they are at `≤ 1/2`.  The groups' union is
therefore a 60-degree code in ℝᵏ, `3t + 2q ≤ τ(k)`, and maximising the weight `w = 2t + q` over
that gives `w ≤ ⌊2τ(k)/3⌋` — here `⌊2 × 126/3⌋ = 84`, attained.  **The scope matters**: τ(7) = 126
is the best *known* kissing number, not a proved one.  Against the best proved upper bound
τ(7) ≤ 134 the unconditional ceiling is 89, five higher, so a better 7-dimensional kissing
number would be worth up to `2 × 5 × 248 = 2 480` points here.  Dimension 28 is the only member
of this family whose weight ceiling is unconditional, because τ(4) = 24 is a theorem.

**The axis.**  A 119th axis point is a *unit* `a ∈ ℝ⁷` with `⟨a,aᵢ⟩ ≤ 1/2`, `⟨a,z⟩ ≤ √3/2` and
`|⟨a,w⟩| ≤ 1/√2`.  Every right-hand side is positive, so those 258 half-spaces cut out a
polytope `P` with the origin in its interior, and `|a|` is convex — so `max_P |a|` is attained at
a **vertex**.  All 1 120 vertices of `P` were enumerated and the largest has `|a| = 0.866`, so
`P` contains no unit vector at all: the axis is maximal over the continuum, not over a sample.
The control is that dropping any one of the 118 recovers a unit vector — and always exactly one,
the point removed, so no one-for-one swap opens it either.  The scope is this axis code against
this frame and these directions; a different rotation is a different polytope.

**The packing.**  The 88 missing lines are 79 pairs — 70 losing one line and 9 losing two —
spread over 82 distinct octads, with 40 of the 42 classes carrying some of it, so no one class
is the culprit.  Three things are now known about them, and none of the three closes the gap.

*The sign side is finished.*  The overlap of two images depends on their sign words only through
`c_i ⊕ c_j`, so the packing is the 𝔽₂ problem `min Σ_{i<j} F_ij[c_i ⊕ c_j]` on 861 exact tables.
Every one of the 861 reaches 0 somewhere, so no pair is individually obstructed — but simulated
annealing, six restarts with two schedules each, reaches only 232–246 from random labellings and
cannot leave 88 from this one.

*The re-slot neighbourhood is finished exhaustively.*  One trio admits exactly **2016** supports
and its stabiliser has order 64 512, so each support is realised by `64512 × 8 / 2016 = 256`
images — and those 256 differ in which 4-slot is taken inside each light coset, which no sign
word can reach, because a sign word *translates* a slot.  Replacing every class by each of its
256 same-support images, each scored over all 4096 sign words, is 44 million placements and
**zero improvements** ([`research/collab2531/dim31/reslot31.py`](../../../../research/collab2531/dim31/reslot31.py)).
So this family is optimal over a whole neighbourhood, not merely at the point a search stopped.

*And the collisions are completely named.*  Every slot lies in a coset of one of the 30 extended
Hamming codes of its octad; a sign word moves the coset and never the code, which the
permutation fixes; and the code is a function of the class's **trio** — indeed it *is* one of the
15 trios through that octad (`kappa31.py` in the same directory: 318 780 cells, no exception).
So two classes meeting at an octad collide with probability 1/8 when their trios induce the same
trio there and exactly 1/2 when they do not, and the 120 code pairs that meet in dimension 0 —
where no sign word could ever separate them — never occur, so no two classes are ever
unseparable.  What that does *not* buy is the 88 lines: 42 mutually agreeing trios do not exist
(the agreement graph on the 3795 trios is exactly 56-regular, with greedy cliques of 5), and on every
aggregate the search screens on — octad coverage, the bit budget, the pair probability, the code
agreement — five fresh builds match this family and still lose twice as many lines.  The gap is
search depth.  `KNOWLEDGE.md` §149.

*And two of the 88 are certified unavoidable.*  At an octad the 15 codes carry exactly 35
distinct hyperplanes `U+V`, each shared by three of the 105 pairs — 15 points with 35 such
triples is a **PG(3,2)** — and each of the 35 is the parity of a 4-subset, so a line of that
geometry *is* one of the `C(8,4)/2 = 35` splits of the octad into two 4-sets.  Two heavy classes
with different codes are disjoint at `O` exactly when `φ_{UV}(x+y) = 1`, so for one split the
heavy classes it links must be **2-colourable**; an odd cycle cannot be, and a triangle — three
heavy classes whose codes are a line — makes the three conditions sum to `0 = 1`.  Such a
collision costs `|U ∩ V| = 2` lines, whatever the sign words and whatever the images.  This
family has exactly one, a triangle at **octad 458 over classes 20, 22 and 28** — and octad 458 is
one of the octads that loses two lines.  So **2 of the 88 cannot exist and 86 are search**
([`research/collab2531/dim31/pg32.py`](../../../../research/collab2531/dim31/pg32.py)).

*Two things that do not help, measured.*  The template asks only for 42 pairwise disjoint sets
of compatible type-B lines, not for monomial images — but a shortened class cannot take a
different line back: a 248-line class is recovered from **any 216** of its lines (drop `k` at
random for `k` up to 32 and the closure returns exactly the `k` dropped, nothing else), so every
short class here is a subset of a unique full one, and 0 free lines are addable to any of the 42.
And optimising the octad coverage exactly — a trio admits exactly 2016 supports, so the universe
is `3795 × 2016 = 7 650 720` and the best support against the other 41 is one matrix product —
reaches `Σ_O C(n_O,2) = 1547` against this family's 1670, and realises **10 249**, seventy-nine
lines *worse*.  Driving the aggregate to its optimum makes the answer worse.

## History

| year | τ(31) | who |
|---|---|---|
| 2025 | 238 350 | Ma et al., arXiv:2511.13391 (PackingStar), the value in Cohn's table |
| 2026-09-14 | 238 354 | this project: a height-√3 layer on two deep-hole lines of the cap E₇, `+4` — now superseded |
| 2026-09-17 | 238 534 | the norm-8 frame layer, 42 disjoint type-B classes carrying 10 296 owner lines found by a uniform scan of 10¹¹ monomial images, axis 118 of 126 |
| 2026-09-17 | **238 662** | this package: the same layer with the packing screened on the octad coverage instead, 10 328 owner lines |
