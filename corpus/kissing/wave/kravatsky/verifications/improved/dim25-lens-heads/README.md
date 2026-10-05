# Dimension 25: heads in the lens of a minimal vector

**τ(25) ≥ 197 579**, against the published 197 056 (Cohn's table; Ma et al. 2025) and this
repository's earlier 197 058 (now in [`../../superseded/dim25-cap-level/`](../../superseded/dim25-cap-level/)).
An improvement of **+523** over the table.

```
python verify.py            # ~4 min, exact arithmetic in every decision; exits non-zero on failure
python fullcheck.py         # ~2 min, an independent floating-point net over all 197 579 points
```

Both read only `data/` and rebuild the 196 560 Leech minimal vectors from the Golay code
(`lib/golay.py`, `lib/leech.py`), so nothing depends on the code that produced the
configuration.

## The configuration

Work in norm-4 units: Leech minimal vectors have squared length 4, and two points are
compatible iff their inner product is at most 2. Put the Leech shell on the equator of ℝ²⁵
and remove a set `D` of 1016 of its points, the *owners*. Above each owner `u` sits a
*head* `x` with `|x|² = 3` at height +1, and its mirror image at height −1, so that

| family | points | count |
|---|---|---|
| equator | `(z, 0)`, `z` a minimal vector not in `D` | 195 544 |
| extra equator point | `p = −(2/√6) v`, **not** a lattice vector | 1 |
| caps | `(x, ±1)`, `x` a head, `|x|² = 3` | 2 × 1016 |
| poles | `(0, ±2)` | 2 |
| **total** | | **197 579** |

A head `x` conflicts with an equator point `z` iff `⟨x, z⟩ > 2`, and the analysis in the
accompanying note proves that a head at `|x|² = 3` removing exactly one owner `p` has
`⟨x, p⟩ ≥ (18+√30)/7`, while two compatible heads sharing a removal both have
`⟨x, p⟩ ≤ 10/3 < (18+√30)/7`. Hence no removal is ever shared and the count is exactly
`196 560 + H + 2 + |E|` with `H` the number of heads and `|E|` the extra points.

**Class heads.** 972 of the heads are `x = u + t₋ v` with `u` an owner, `v` a Leech vector
of norm 6 (a *lean*) with `⟨u, v⟩ = −3`, and `t₋ = (3−√3)/6`, so `x = t₊ u + t₋ w` with
`w = u + v` minimal and `⟨u, w⟩ = 1`. Heads over one lean are pairwise compatible
(`⟨x, x'⟩ = ⟨u, u'⟩ − 1 ≤ 1`), so the conflict graph is multipartite with parts of at most
552. The record uses four leans with blocks 552 / 286 / 133 / 1 and Gram matrix

```
[[ 6 -4 -3  0]
 [-4  6  0 -1]
 [-3  0  6  2]
 [ 0 -1  2  6]]
```

**Interior heads.** The remaining 44 heads are exact rationals found by a linear programme
over the admissible region of an owner; they are invisible to any enumeration of the class
family. They are chosen jointly, as an independent set of the whole admissible pool, not one
at a time: solving `max |x|` over each owner's region **against the class core only**, and
then taking a maximum independent set of the resulting 1188-head pool under `⟨x,x'⟩ ≤ 1`.
Adding them greedily in a fixed order gives 35 heads over the core, which is what the
earlier 1006-head version of this package shipped; an independent-set solve of the same
pool gives 45, one of which turns out to have exact class form over a fourth lean and is
therefore stored and verified as a class head. Hence 972 + 44 on disk and
`H = 971 + 45 = 1016`.

**The extra equator point.** The first block is a whole `Σ(v) = {z : ⟨z, v⟩ = −3}` of 552
owners, and `p = −(2/√6) v` has `⟨p, z⟩ > 2` exactly for `z ∈ Σ(v)` (because `⟨v, z⟩` is an
integer in `[−3, 3]` and `2 < √6 < 3`), so it can be adjoined to the equator once that block
is gone. Against a class head over the same lean, `⟨p, x⟩ = √2`.

## Why this shape, and what caps it

Stripped of its ornaments the construction is one sentence. Pick a Leech vector `v` of norm 6
— a *lean* — take its 552 top-level minimal vectors `Σ(v) = {z : ⟨z, v⟩ = −3}`, and push
each of them toward `v` by `t₋ = (3−√3)/6`. That is a **block**, and the configuration has
exactly `196 560 + H + 3` points for whatever number of heads `H` the blocks and the
supplement together carry, the `3` being the extra equator point and the two poles. Three
facts bound the whole family.

**A block is tight, and 552 is optimal for it.** Inside one block
`⟨x, x'⟩ = ⟨u, u'⟩ − 1 ∈ {1, 0, −2}`, so the extremal pairs sit *exactly* on the
compatibility bound `⟨x, x'⟩ = 1`, with no slack anywhere — which is why a continuous
relaxation started from the scaled owners never finds a block: the configuration is measure
zero. Nor can a block be enlarged. It projects to a spherical code at cosine 1/5 in ℝ²³, and
`A(23, 1/5) ≤ 552`, attained by the block itself, so 552 is the exact maximum over one lean.
That is a theorem, not a search result.

**The class-head core caps at 971.** The only freedom left is the lean set, which turns a
packing of 10⁵ heads into a search over small Gram matrices. Run over the whole norm-6 shell
— all 16 773 120 vectors — the maximum of a union of blocks is **971 heads**, attained by
three leans whose pairwise inner products are (−4, 0, −3); further leans bought nothing. That
is a search result, but a well-covered one: random 4-lean sets reach only 904 and greedy
growth from random leans 805, so the good lean sets are constructed rather than sampled
(`⟨v, v'⟩ = −4` exactly when `v + v'` is minimal), and four independent order-11-invariant
systems return the same 971. The four leans shipped here hold 971 in their first three
blocks, 552 + 286 + 133; the fourth contributes exactly one head.

**The supplement is one independent-set problem, on a pool that is complete.** Every minimal
vector passing the necessary screen `max_h ⟨u, h⟩ ≤ 1.9352351` — 77 350 owners — was solved
for `max |x|` over its admissible region against the 971-head core alone. That enumeration
was run to the end rather than truncated: exactly **1188** of those owners admit a head and
the other 76 162 provably admit none, and two heads over one owner always conflict, so the
pool is 1188 heads over 1188 distinct owners. Everything beyond the core is therefore an
independent set of a single 1188-vertex conflict graph under `⟨x, x'⟩ ≤ 1`, of density
0.1538. The 45 shipped here are the best found on that graph; CP-SAT bounds its independence
number by **89**.

**Hence a ceiling of 197 623 for the construction.** Putting the three together,

```
points = 196 560 + 971 + (supplement) + 3,    supplement ≤ 89
```

so no configuration of this shape — blocks over any lean set, plus heads over the core —
exceeds **197 623** points. The 197 579 shipped here is within **44** of that, and the gap is
the ordinary distance between what an independent-set solver finds on a graph of this size
and density and what it can prove. The number bounds *this construction*, not the dimension:
a gain in dimension 25 beyond 197 623 needs a head outside the block-plus-supplement family.

The searches behind each of these numbers are in `KNOWLEDGE.md` §157, and the closures that
fix the head family are §155–156.

## What the verifier checks

`verify.py` rebuilds the minimal vectors; checks that the 1016 owners are distinct minimal
vectors and `|x|² = 3`; classifies a head as a class head when `(x − u)/t₋` is an integral
vector of norm 6 with `⟨u, v⟩ = −3`, and requires it to be **stored** at its exact value;
then verifies every pair. For the 972 class heads every inner product with an integer vector
is `A + t₋ B` with `A, B` integers, and `A + t₋ B ≤ 2` is `6A + 3B − 12 ≤ B√3`, decided by
comparing squares — all 972 × 196 560 head–equator tests and all head–head tests run with no
floating point. The 44 rational heads use `Fraction` arithmetic after a floating-point screen
six orders of magnitude wider than the arithmetic error. The extra point is checked the same
way. `fullcheck.py` shares no code with it: it assembles all 197 579 points of ℝ²⁵ and checks
every block of pairs, then 2 × 10⁷ random pairs from the whole.

## Files

```
verify.py            the claim, exact in every decision; prints ALL CHECKS PASS
verify.log           its output
fullcheck.py         an independent end-to-end net: builds all 197 579 points in R^25 and
                     checks pairs blockwise, sharing no code with verify.py
fullcheck.log        its output
data/heads_X.npy     1016 x 24 float64: the heads in norm-4 units
data/heads_U.npy     1016 x 24 int64:   the owner of each head, a Leech minimal vector in
                     Cohn units (norm 32)
data/heads_exact.pkl the exact arithmetic, as a pickle because Fraction does not survive
                     .npy: 'rat' is the 44 interior heads as exact rationals and is the only
                     key verify.py reads; 'cls' (the 972 class heads) and 'U' are the producer's
                     record of the same configuration
data/extra_P.npy     1 x 24: the non-lattice equator point p = -(2/sqrt6) v
lib/golay.py         the Golay code in the coordinates of Cohn's file
lib/leech.py         the 196560 minimal vectors from it
```

## Provenance

This is joint work in progress with H. Cohn and B. Lindow (dimensions 25–31). The template
with poles is from this repository's `dim25-cap-level` (superseded); the idea of lifting the
block `Σ(v)` above a norm-6 direction is Cohn's; the no-sharing theorem, the depth bound, the
lean, interior and plateau analyses, and the extra equator point are new here. The full
account is the note *Kissing configurations in dimensions 25, 26 and 27* (internal to
the collaboration), whose `factcheck.py` and `formulas.py` re-derive every figure and formula
in it. What the same analysis forbids — a ceiling of 203 552 for any configuration with a
Leech equator, and the measured reach of the Leech shell above 60° — is `KNOWLEDGE.md` §125.
