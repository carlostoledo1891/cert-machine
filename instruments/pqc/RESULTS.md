# First result — one record decided exactly

`node experiments/pqc-geometry/pi.test.js`
`node experiments/pqc-geometry/decide-record.js`

## The target

The SVP Challenge hall of fame publishes 926 records. Each carries a dimension, a
seed, a Euclidean norm, and the ratio ‖v‖/GH printed to six figures as a float
with no error bound. **No record in the table exceeds 1.04985**, so 1.05·GH is
the acceptance wall, and the population is pressed against it:

| dim | norm | seed | published ratio | distance to the wall |
|---|---|---|---|---|
| 119 | 2904 | 0 | 1.04985 | 1.4 × 10⁻⁴ |
| 135 | 3076 | 0 | 1.04968 | 3.0 × 10⁻⁴ |
| 104 | 2712 | 0 | 1.04967 | 3.1 × 10⁻⁴ |
| 89 | 2532 | 1512 | 1.04958 | 4.0 × 10⁻⁴ |

Dimension 119, seed 0 is the closest row in the table. It was decided first.

## The decision

Basis fetched from the public challenge generator; the lattice is
Goldstein–Mayer, so **det L = q is the [0][0] entry — a 359-digit integer, read,
not computed**. π bracketed to 40 places by Machin with rigorous truncation
bounds. Everything else is exact rational arithmetic in BigInt.

```
as printed          ‖v‖ = N     ADMISSIBLE   ‖v‖/GH ∈ [1.0498513, 1.0498513]
worst case rounding ‖v‖ = N+½   REFUSED      ‖v‖/GH ∈ [1.0500320, 1.0500320]
best case rounding  ‖v‖ = N−½   ADMISSIBLE   ‖v‖/GH ∈ [1.0496705, 1.0496705]

largest admissible integer ‖v‖² at f = 1.05   8435604
the record needs                              8433216   (= 2904²)
headroom                                      2388 integer squared-norms
next norm up, 2905                            REFUSED
```

**The published number holds up.** The exact ratio is 1.049851339…, and
`1.04985` is correct to every digit it prints. The record is admissible with
2,388 integer squared-norms of headroom, and one unit more of norm would refuse
it.

That is a negative result and it is worth having: at the tightest row in the
table, the field's floating-point arithmetic is not wrong. The instrument now
exists to say so about any of the other 925.

## What this does and does not certify

It certifies: **if** the vector's norm is 2904, then it clears 1.05·GH for this
lattice, proved in exact arithmetic.

It does not certify that a vector of that norm exists in that lattice. The `vec`
links in the hall of fame are dead anchors and the winning vectors are not
published, so the witness itself cannot be checked. The audit therefore decides
the *arithmetic of the claim*, not the claim. Recovering the vectors would close
that gap and is the obvious next ask.

The rounding line above is the reason this matters: had the true norm been half a
unit higher than printed, the same record would be **refused**. A published
integer norm is not enough information to decide a record that sits this close to
the wall — for this row it happens to survive, and that is luck rather than
margin.

## The audit at scale

`node experiments/pqc-geometry/hof.js && node experiments/pqc-geometry/fetch-bases.js && node experiments/pqc-geometry/audit.js`

**14 determinants**, fetched one request per (dimension, seed) at three-second
intervals — the rows nearest the wall plus a spread of dimensions to see whether
the published arithmetic drifts with n. Each basis had `det = q` **proved entry
by entry** by `basis.js` before the bulk was discarded: row 0 is `[q, 0…0]`, the
rest are the identity in columns 1…n−1, so expansion along the first row gives
det = q and nothing is taken on trust. 926 requests to enumerate the table would
have been rude and would not have answered the question any better.

**37 records decided, dimensions 40 to 210, slowest 36 ms.**

```
37 decided
37 published ratios consistent with a true norm that rounds to the printed one
 0 inconsistent
 1 whose admissibility depends on the true norm not exceeding the printed one
```

**The published arithmetic holds up everywhere it was checked.** That is the
result, and it is a negative one.

### The mistake that nearly became the finding

The first pass compared the published ratio against the exact ratio computed at
‖v‖ = N, the printed integer, and reported **32 of 37 disagreeing in a digit they
print**. That would have been a striking claim and it was entirely wrong.

The discrepancies all sat at about 1×10⁻⁴, and ½/N for these norms is 1.7×10⁻⁴ —
the same scale, which is what gave it away. Whoever computed the published ratio
used the *true* norm and then rounded it to a whole number for display; the exact
ratio at the rounded norm is a different quantity, and the gap between them is
the rounding, not an error. Both signs of discrepancy appeared, which is the
other tell.

The right test is **consistency, not equality**: does the published ratio lie in
the window spanned by every true norm that would display as N, namely
`[ratio(N−½), ratio(N+½)]`? All 37 do. Nothing about the field's arithmetic was
wrong; the naive comparison was.

### The one thing that is genuinely open

Dimension 119, seed 0, norm 2904 — the closest row in the table — is
**ADMISSIBLE at N and REFUSED at N+½**. Its window straddles the wall. Whether
that record clears 1.05·GH cannot be decided from what is published, because a
norm printed as a whole number is not enough information at 1.5×10⁻⁴ from the
threshold. It is the only such row in the table, and it needs the vector.

## The page

`node tools/build-pqc.js` → `site/pqc/`. Full-viewport instrument, two views.

**The reduction.** Cohen's integral LLL on the real dimension-40 challenge basis:
20,154 steps, 10,219 swaps, 0.2 s, animated over 141 snapshots. Floating-point
Gram–Schmidt does not survive first contact with these lattices — a 121-digit
modulus beside unit entries is 121 orders of dynamic range against a double's
sixteen digits, and the orthogonalisation collapses on step one. That is a
property of the lattice, not a bug, so everything here is integers: the profile
drawn on screen is `‖b*ᵢ‖² = d[i+1]/d[i]`, a ratio of exact Gram determinants.
The lattice is verified unchanged at the end, `det² = q²`.

The grammar the page exists for: **solid is the profile the reduction reached,
dashed is the profile the geometric series assumption says it should reach**
(δ₀ = 1.0219, an empirical claim about random lattices, asserted everywhere and
proved nowhere). The two differ by 0.15 decades RMS and differ worst at the ends.

And the honest ending: LLL finds ‖v‖ ≈ 2555.5, exact ratio **1.542609 →
REFUSED** at the 1.05 wall, against a published record of 1273 at that dimension.
LLL alone does not get into the hall of fame, and the page says so.

**The wall.** All 926 records as a scatter against dimension, the 1.05 threshold
solid, and each decided record drawn as its full consistency window. Every window
contains its published figure. One window crosses the wall.

## Next



1. Decide the remaining three near-wall rows, then the whole table wherever a
   basis can be fetched. One basis request per (dimension, seed).
2. Ask whether any published ratio disagrees with its exact value in a digit it
   prints. That is the finding worth having, and it is now one loop away.
3. Only then look at core-SVP cost models, which are a far larger object with
   many more stated assumptions — and still strictly on the auditing side of the
   charter.

## The environment

`environments/lattice-claims/` — built from this audit, not alongside it.

The specification changed on contact with measurement. The brief proposed
exact-versus-float as the axis; two numbers from our own data said otherwise:

```
naive float grader   (float(q))    blind on 11 of 14 real lattices, q overflows past dim ~102
careful float grader (log domain)  37 of 37 agree with exact
```

Precision is not the vulnerability here — the tightest margin in the published
table is 1.4e-4 against a double's 1e-16. **Specification is**, which is what our
own 32-of-37 false alarm demonstrated with a bit-exact grader. So the dial became
*how much of the reference is stated*, and a submission must declare what it
decided against: a right verdict from the wrong reference does not score as right.

Three rungs — `declared`, `printed` (norm as a whole number, `STRADDLES` is a
correct answer), `underspecified` (`NEEDS_DATA` naming the field). This merges
what the brief had as two separate environments, because the dial is the finding.

**The generator's trick**: short vectors cannot be found, but a lattice can be
built around one. A GM lattice contains `v` exactly when
`v[0] − Σ v[i]·xs[i−1] ≡ 0 (mod q)` — one congruence, so choose `v` small, choose
all but one `xs` at random, solve for the last. The norm is solved for rather
than sampled, since `v[0]` is free, which places an instance a few parts in 10⁵
from the wall on demand. Verified: straddle cases mint reliably at n = 24–90.

**9 forgeries planted, 9 caught, 0 accepted. 9 tests pass.** `zero_vector` earned
its place by catching a hole in *our* exact predicate — `decide` accepts the zero
vector, because 0 ≤ anything, and the claim is about a nonzero one. A forgery
found that, not a model.

Canary, reported honestly: a **cliff, not a gradient**. 0/12 disagreement below
dimension 102 for both float graders; 12/12 for the naive one above it, purely
from overflow.

### The environment, run

135 calls, dims 8–16, 15 tasks per rung, ~$1.87.

| model | `declared` | `printed` | `underspecified` | overall | `well_formed` |
|---|---|---|---|---|---|
| Opus 5 | 14/15 | **14/15** | 9/15 | **37/45** | 28/30 |
| Sonnet 5 | 13/15 | 4/15 | 4/15 | 21/45 | 21/30 |
| Haiku 4.5 | 7/15 | 3/15 | 8/15 | 18/45 | 13/30 |

The `printed` rung separates the models threefold — on straddling instances
specifically, Opus 4/4, Sonnet 1/4, Haiku 0/4. And **the dominant error is the
same for all three and is the one the environment exists to train against**:
answering confidently when a quantity is absent (4×, 7×, 5× "said ADMISSIBLE
when it was NEEDS_DATA").

**The first run measured the grader, not the models** — Opus 24/45 and
`well_formed` 0/30 across the board, because models wrote `squared_norm` and
`acceptance_factor` while the grader demanded `norm_squared` and `factor`, and
the prompt never stated the schema. 22 correct `NEEDS_DATA` answers were scored
zero for naming `q` rather than the internal path `lattice.q`. A zero that
uniform is a bug, not a result. Third time this session that the wrong-reference
error appeared; the environment is named for it and still caught me.

### The graph as the submission

`lattice_claims/wiring.py` — the model emits a wiring, not a verdict. Building
the graph is the grading, because the float firebreak and the dangling-port rule
are already conditions on a wire.

| model | attempted | wired legally | used the exact predicate | right verdict |
|---|---|---|---|---|
| Opus 5 | 0/15 | — | — | — |
| Sonnet 5 | 15/15 | 15/15 | 15/15 | 9/15 |
| Haiku 4.5 | 15/15 | 15/15 | 15/15 | 9/15 |

**Composing the verifier is easy; deciding is not.** Every graph was legal, and
neither model ever routed the tolerance grader to the sink. Then **both routed
`certified` on all fifteen** — their 9/15 is exactly the ADMISSIBLE base rate.
The `refused` port was available the whole time and neither drew that wire once.

**Opus declined all fifteen**: `stop_reason: refusal`, category `cyber`. The
prompt was not reworded to get around it — the refusals are recorded as refusals,
and the consequence is that this taskset cannot evaluate Opus as written.

And the harness lied first, again: the initial run scored 1/15 and 0/15 because
the catalogue printed deciding ports as `q*`, so models wired to a port named
`q*`. Third time a uniform near-zero measured the harness rather than the models.
