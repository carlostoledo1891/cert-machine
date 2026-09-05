# PQC geometry — a charter, written before any code

Lattice-based post-quantum cryptography rests on the hardness of finding short
vectors, and its published security levels come out of sphere-packing arguments:
Gaussian heuristics, lattice point counts, kissing numbers. That is the same
mathematics this bench already did exactly in dimension 11 over ℤ[√2].

## The one standing rule

**Audit only. Never design a primitive.**

Geometry-flavoured novel schemes are the classic trap: they get broken, usually
within months, and the attempt costs credibility permanently. The asymmetry runs
the right way — auditing published estimates is wide open and low-risk, proposing
primitives is crowded and high-risk. Nothing in this folder proposes a
cryptosystem, a parameter set, or a "hardened" variant of anything. If a future
session finds itself designing, it has left the charter.

Second rule, inherited: this bench **does not sell certification and carries no
gates**. The output is a decided number and the reasoning that decided it.

## What is actually wrong, and where the instrument fits

Concrete security claims — "this parameter set gives 2^143 core-SVP hardness" —
are produced by floating-point simulators and asymptotic heuristics, published as
bare numbers, rarely with error bounds. Nobody re-decides them exactly.

The smallest real object of that shape, and the one to start on:

**The SVP Challenge hall of fame.** 926 published records. Each carries a
dimension, a seed, a Euclidean norm, and — the interesting column — the ratio of
that norm to the Gaussian heuristic, printed to six figures as a float. No record
in the table exceeds **1.04985**, so 1.05·GH is the acceptance wall, and records
are pushed right up against it: four sit within 0.05% of the boundary, the
closest at 1.4 parts in 10⁴.

A number that decides admission, computed in floating point, published without an
error bound, with the population clustered against the threshold. That is the
shape this bench exists for.

## Why it is exactly decidable

Challenge lattices are Goldstein–Mayer, whose basis is

    [ q  0 … 0 ]
    [ x₁ 1 … 0 ]      so  det L = q,  an exact integer read off the basis file.
    [ …          ]

The Gaussian heuristic is `GH = (det · Γ(n/2+1) / π^{n/2})^{1/n}`, and the
acceptance test `‖v‖ ≤ f · GH` clears of all roots when raised to the right
power. Everything in it is an exact integer except π:

- **n even, n = 2m:**  `(‖v‖²)^m · π^m  ≤  f^n · q · m!`
- **n odd, n = 2m+1:** `(‖v‖²)^n · π^{2m} · 4^{2m+2} · ((m+1)!)²  ≤  f^{2n} · q² · ((2m+2)!)²`

Both sides are exact rationals; the √π in the odd case cancels against π^{n/2}.
So the whole predicate is decided by a **certified rational enclosure of π**, and
nothing else. No floating point anywhere, and the decision is a proof.

## What is available, and what is not

- **Available**: the hall of fame table (dimension, seed, published norm, published
  ratio) and the challenge basis generator, which returns the exact basis — and
  therefore `q` — for any (dimension, seed). Both public, both read-only.
- **Not available**: the winning vectors themselves. The `vec` links are dead
  anchors. So `‖v‖²` is not known exactly; only the norm rounded to an integer.
  That is survivable: a rounded norm N bounds `‖v‖ ≤ N + ½`, and deciding the
  predicate at that upper bound is *sound* — if the worst norm consistent with
  the published figure still clears the wall, the record is certified admissible
  whatever the vector was. Records that fail at N + ½ but pass at N are not
  refuted; they are undecidable from published data, and saying so is the result.

## Sequence

1. Certified π as a rational enclosure, to arbitrary precision, with rigorous
   truncation bounds. (`pi.js`)
2. The acceptance predicate above, exact. (`gh.js`)
3. One record decided exactly, end to end — dimension 119, seed 0, the row
   closest to the wall.
4. Then the whole table, wherever a basis can be obtained.

Only after that is there any question of touching core-SVP cost models, which are
a much larger object with far more stated assumptions.
