# SPEC — the ignorance budget, and the next machine generation

Written 2026-08-31, after the #290 summit closed. This is a PLAN, not a
claim. Its first stage is a gate that could kill most of it, and that is
deliberate: five separate premises died today because the gate was run
second instead of first.

---

## 0. What actually exists, stated flatly

**The computation.** Erdős #290's constant, at knowledge horizon l ≤ 310
(every even d ≤ 620 pinned, 250 degrees closed, 0 open):

    unconditional  c        ∈ [0.830416407911, 0.831220912621]
    unconditional  1/(1+c)  ∈ [0.546083759260, 0.546323774021]

Three digits of `c₀ = 1/(1+c)` with no assumption; 110 under one labeled
assumption. Previous horizon gave two.

**The mechanism.** `machine/erdos290/tail.js` — the one place that decides
what an UNDETERMINED degree costs. Charging δ ∈ [0,1] is the status quo;
charging anything narrower is a lemma, and the module makes the lemma a
parameter. `tools/erdos290-lemma-value.js` prices lemmas in output digits and
inverts the question. `machine/erdos290/battery.js` gates it: 6 checks, 3 red
controls.

**What the pricing said** (all conditional on their own lemma):

    nothing assumed                width 8.05e-4    c₀ = 0.546…            —
    δ within ±0.1 of 1−e^(−1/2)    width 1.61e-4    c₀ = 0.5462…          +1
    δ within ±0.0005               width 8.05e-7    c₀ = 0.546229…        +3
    δ = hyperoctahedral value      width 8.7e-41    c₀ = 0.54622931040…  +37

    the 4th digit costs a window of width 0.2 — δ ∈ [0.293, 0.493]

**Two corrections the machine made to its own operator's reasoning.**
Family arguments (closing a residue class) are worth almost exactly their
density — 49.8% of the width for half the degrees — so they never buy a digit
unless the class is nearly everything. And "prove δ ≥ 1/2", which this
project proposed out loud, is FALSE: refuted in milliseconds by the pinned
density at d = 62, because δ → 1 − e^(−1/2) ≈ 0.3935.

**Why the digits are worth anything.** van Doorn (arXiv:2411.03073, "On the
non-monotonicity of the denominator of generalized harmonic sums") proves
`b(a) > a + 0.54·log(a)` for the Erdős–Graham question on harmonic-sum
denominators. `c₀` IS that constant. Our unconditional bracket proves
c₀ > 0.546083, which is the difference between writing 0.54 and writing
0.546 in the statement of a published theorem. THIS CONNECTION IS INFERRED
FROM THE ABSTRACT AND THE OUTREACH PACK AND HAS NOT BEEN CHECKED AGAINST HIS
DERIVATION. Stage 0 checks it. If it does not hold, the digits are worth
much less and this document should shrink accordingly.

---

## 1. Is any of it novel? UNDECIDED — and that is the honest answer

Two searches were run before writing this and both came back inconclusive.
Inconclusive means the gate is not cleared; it does not mean we are first.
Every component of the mechanism is standard on its own:

- interval arithmetic with an honest [0,1] for unknown terms — routine in
  rigorous computation of constants
- sensitivity analysis — routine
- value-of-information — a named, old idea in decision theory
- refuting a hypothesis against existing data — the definition of a test

What is *unusual*, and what Stage 0 must rule on, is the composition:
pricing candidate LEMMAS in units of certified output digits, inverting to
the weakest sufficient lemma, and auto-refuting proposed lemmas against
already-computed data. Plausibly folklore among people who compute constants
rigorously. **Do not describe it as new anywhere until Stage 0 says so.**

---

## 2. The plan, staged so each stage pays even if the next never happens

### STAGE 0 — the gate (hours, kills or sharpens everything below)

1. **Read van Doorn's derivation**, not his abstract. Does a better lower
   bound on c₀ actually improve the constant in his theorem, and is 0.546
   directly usable? This decides whether digits are valuable or ornamental.
2. **Is the pricing idea published?** Search rigorous-numerics and
   computer-assisted-proof literature for error-budget / value-of-information
   tooling. Ask the question in the negative: what would this be called if it
   existed?
3. **Is the 4k(k+1) corollary known?** It follows in a few lines from the
   Altmann–Awtrey–Cryan–Shannon–Touchette 2020 composition law. Someone may
   have written it down.
4. **What is known unconditionally about Gal(f_d) and δ(f_d) for large d?**
   This decides whether the width-0.2 lemma is open, hard, or already done.
   If f_d's irreducibility is itself open, a two-sided window is harder than
   it looks and the plan's centre of gravity moves.

EARNS: a correct picture, and it is the cheapest stage by an order of
magnitude. Output: a findings note, and edits to this file.

### STAGE 1 — generalise the mechanism out of #290 (1 session)

Today's module is #290-shaped. The pattern is not:

> a quantity is an aggregate of indexed contributions; each is either PINNED
> (exact) or UNKNOWN (charged an interval); the total is an enclosure whose
> width is exactly the sum of what ignorance costs.

Extract `machine/ignorance.js`: given weights, pinned values, and a
constraint on the unknown, return the enclosure, the width decomposition,
the lemma pricing, and the data-refutation check. #290 becomes its first
consumer and must reproduce byte-identically — the same self-checking
extraction that worked today.

EARNS: one module, one battery, reusable; #290 unchanged and still gated.

### STAGE 2 — find the second consumer, and be willing to find none

Candidates already in this repository, in order of fit:

- **SkyAudit's NEEDS DATA.** The app doctrine already says "publish the exact
  threshold that would flip a verdict — at X kWh you turn green." That IS
  this mechanism, built independently on the product side and never connected
  to the math side. Wiring them together is the highest-value link in the
  repository and it is a PRODUCT feature, not a paper.
- **The MFG regime maps** — decided cells, refused cells, a map with holes.
- **The Mercer λ/μ boxes** — a box gives an upper bound and no lower bound;
  what would it take to close one?

If none of them fits without forcing, say so and stop at one consumer. A
mechanism with one honest user is better than three strained ones.

EARNS: either a real generalisation or a documented negative.

### STAGE 3 — the mathematics: attack the width-0.2 lemma

Only if Stage 0 says it is open. The target, precisely:

> for every large even d, δ(f_d) lies within 0.1 of 1 − e^(−1/2)

Sub-targets that would each be worth pricing on their own:
- f_d has no rational root for even d (removes the δ = 1 degenerate case)
- f_d is irreducible for large even d
- Gal(f_d) is transitive / primitive / contains a large alternating section

Each is a lemma the machine can price BEFORE it is attempted, and refute for
free if it contradicts the 283 densities on file.

EARNS: a fourth unconditional digit if it lands; a priced map of what did not
work if it does not.

### STAGE 4 — the next machine generation: a proposer for LEMMAS

This is where the generation front and #290 meet, and it is the first target
where the generation loop's economics are actually good:

- the search space is small and structured (bounds, not objects)
- **refutation is free** — a proposed bound is checked against 283 pinned
  densities in milliseconds
- the fitness is a certified enclosure width, i.e. a real number with a
  gradient, which is exactly what SPEC-GENERATION.md §3 asks for and what
  the polynomial front could not provide
- and the honest baseline already exists: a systematic sweep over windows

A model proposer earns its invoice here only if it proposes lemmas that are
(i) not refuted by the data, (ii) worth digits, and (iii) plausibly provable.
(iii) is the part no machine in this repository can judge, and that limit
must be stated wherever this runs.

EARNS: the first generation front whose grader is free and whose gradient is
real. Or a clean null, which the polynomial front already showed we publish.

---

## 3. Risks, named

- **The digits may be ornamental.** If Stage 0 finds that van Doorn's theorem
  cannot use a sharper c₀, most of the motivation evaporates. Check first.
- **The pricing may be folklore.** Likely, in fact. It would still be useful
  machinery; it would not be a paper.
- **Stage 3 may be a wall.** Bounding a Galois-theoretic density uniformly is
  not obviously easier than the full theorem.
- **Stage 4 can produce plausible-and-unprovable lemmas at volume.** The
  machine can refute and price; it cannot tell you a lemma is provable. A
  front that emits 500 priced, unrefuted, unprovable conjectures is noise.
  Cap it, and require a human verdict on provability before anything ships.

---

## 4. What must not happen

No page, note or message describes the pricing mechanism as new until Stage 0
rules. No conditional number is stated beside the unconditional bracket
without the label. And the unconditional claim — c₀ = 0.546… — is the only
one this project may state as fact.
