# STAGED — Erdős #1038 infimum: the two posts (nothing sent; operator's word required)

## Venue findings (2026-09-03)

1. **erdosproblems.com/forum/thread/1038** — "1038 Discussion Thread", **141
   comments**, 3 proof claims. THE venue. The operator already has an account
   (`carlos_toledo` appears in the thread's Likes). Active: TerenceTao,
   Nat Sothanaphan (natso26), Hua Xu, mendozalab, catsflowers5544, jspier,
   J_Koizumi_144, JakeMallen, naprienko, BorisAlexeev.
2. **github.com/teorth/erdosproblems issue #179** — `"Beat the AI" on #1038`,
   open, and the ONLY 1038 issue on the repo. Our supremum-side comment is
   already the single comment there
   (issues/179#issuecomment-5492843637). The machine can post here with `gh`.
3. Not venues: the `/proof-claims` page (we are not claiming a proof), and
   issue #392 (that is our own #510 lambda(4) issue, live and separate).

## State of play in the thread, as of this scout

- Official problem page still records `1.519 ≤ inf ≤ 1.835`.
- Hua Xu: five-atom finite certificate, **Lean/Mathlib package**, M = 1.806304
  then 1.807100.
- **mendozalab** reached **M = 1.814605** (4 lanes / 5 atoms, K = 560 blocks,
  per-block LP weights, interval-checked, "done with Claude orchestrating the LP
  search and the Rust kernel"); catsflowers5544 was at 1.814600 and reported an
  obstruction near block 192. Nat Sothanaphan then critiqued that post's prose —
  see the tone constraint below. NOTE: this thread already contains AI-assisted
  certified work; what drew fire was the writing, not the method.
- Method credited upthread to **jspier's finite-atom approach** on the standard
  reduction in Tao's / natso26's notes.
- **Problem 4.1 had a typo**, corrected in-thread by J_Koizumi_144: the
  forbidden region should read `[-1.808+ε, 0.026] ∪ [1-ε, 1]`.

## TONE CONSTRAINT — this is not optional

Nat Sothanaphan, in-thread, on mendozalab's AI-assisted 1.814605 post: *"I want to draw
attention to the 'purple prose' here (overly flowery writing that distracts
from the content due to its style), which sometimes happens in AI writing. For
example, what is a 'leg'? What does it mean for interval arithmetic to be
'fail-closed'?"*

Both drafts below are therefore flat, define every term used, quote every
constant, credit predecessors by name, and volunteer their own weak points. No
adjectives, no framing language, no "killer" register. In this room the
credibility comes from the numbers and from what we admit we did not do.

---

# A. FORUM POST — erdosproblems.com/forum/thread/1038 (operator posts)

Certified bounds on the infimum: a lower bound of 1.828 that needs no tail, and
an upper bound of 1.8344304971959906.

Conventions as in Tao's notes: U_μ(x) = ∫ log(1/|x−t|) dμ(t), and the quantity
of interest is the measure of {x : U_μ(x) > 0} for μ a probability measure on
[−1,1]. Every number below comes from an outward-rounded interval-arithmetic
certificate over IEEE-754 doubles: each arithmetic operation is replaced by an
interval enclosing the true value, so a certified inequality holds for the real
quantity and not only for the computed one. Nothing rests on sampling. Each
claim detaches into a JSON certificate plus a checker that re-runs it.

**1. inf ≥ 1.828, with no tail estimate and no assumed minimizer.**

The route is jspier's finite-atom approach on the standard reduction (μ
normalized with supp μ ⊆ {−1} ∪ [0,1] and (−√2, 0) ⊆ E := {U_μ > 0}), the same
base as Hua Xu's Lean package. Beyond that the only analytic input is
∫U_ν dμ = ∫U_μ dν, which gives the selector: if ν = δ_{a₀} + Σᵢ wᵢδ_{pᵢ} with
wᵢ ≥ 0 satisfies U_ν > 0 on supp μ, and U_μ(a₀) ≤ 0, then some pᵢ lies in E.

Let a₀ be the infimum of the component of E containing (−√2, 0); then
U_μ(a₀) ≤ 0 and a₀ ∈ [−2, −√2]. If a₀ ≤ −cap the component already has length
at least cap. Otherwise put R = cap − |a₀|. For every b ∈ [0,R] the certificate
exhibits ν_b = δ_{a₀} + w₀δ_b + Σⱼ wⱼδ_{sⱼ−b} with U_{ν_b} > 0 on
{−1} ∪ [0,1] ⊇ supp μ. The maps b ↦ b and b ↦ sⱼ − b are unit-speed and
injective with pairwise disjoint images, all disjoint from (a₀,0), so the
selector gives |E ∩ [0,∞)| ≥ R and hence |E| ≥ |a₀| + R = cap. Both cases give
the bound for every normalized μ — there is no tail block, no minimizer, and no
argument by contradiction.

Certified at cap = 1.828 over the full range a₀ ∈ [−1.828, −√2]: 86 a₀-boxes,
1350 b-boxes, worst certified margin 4.12e-7, 265 seconds single-core. A finer
box schedule certifies the same bound at higher cost (332 / 40000 / 5421 s,
worst margin 7.48e-7); the bound is the same, only the tiling differs. Caps
1.816, 1.82 and 1.825 are also on disk. A second implementation, written
separately and sharing no code with the certifier, re-derives the tiling,
geometry and weight structure from the certificate file alone and searches for
counterexamples in floating point; the smallest value it found is 1.41e-5.

The step that made this affordable: in the shifted coordinate y = x + b the
teeth do not move, and the remaining part −log(y−b−a₀) − w₀log(y−2b) has
positive derivative in b for x ≥ b. Each two-parameter box therefore collapses
to two thin one-dimensional convex problems, with no loss from bounding a box
by its worst corner. Without that step the near poles cost roughly 10·h per box
half-width and the box count is an order of magnitude worse.

For context, and please correct me if I have the state of the thread wrong: the
best finite-atom bound recorded in this thread is 1.814605, and Hua Xu's
Lean/Mathlib package stands at 1.807100. Mine is an
interval certificate, not a Lean formalization, so it is a weaker kind of object
than Hua Xu's even though the number is larger. **The forcing certificate is
structured to be a formalization target** — finitely many boxes, one frozen
rational weight vector per box, and a positivity check per box — and I would be
glad to help anyone who wants to push it through Lean.

**2. inf ≤ 1.8344304971959906.**

For μ = A·δ₋₁ + f(y)dy on [a,1] with a = 0.804462 and A = 0.8245218 exact, and
f(y) = [1 − A√(2(1+a))/(1+y)] / (π√((y−a)(1−y))) ≥ 0, the set {U_μ < 0} is
(x_L, x_R) minus the point −1, with

    x_L ∈ [−1.8081074413361424, −1.808107441336006]
    x_R ∈ [ 0.02632305585964334,  0.026323055859847976]

The on-support level is certified nonnegative (c ≥ 9.3e-8). The set structure
follows from three one-line facts: U′ < 0 left of −1, U″ < 0 on (−1,a), and
U′ > 0 right of 1.

Weak point, stated rather than buried: two classical identities are quoted here
and not certified — the arcsine potential identity and the balayage of a point
mass onto an interval (Saff–Totik). Both are bridged numerically to between
1e-9 and 1e-16 against direct quadrature, but a fully certified route would need
certified log-quadrature. The lower bound in item 1 has no such dependency.

**3. natso26's three posted duals are now verified rigorously.**

For ε = 0.002, 0.001 and 0.0005 (278, 183 and 184 atoms), all weights are
positive and U_λ ≥ 0 on all of [−1,1], with certified off-atom minima 1.24e-5,
2.65e-6 and 3.96e-6; at the atoms U is +∞. Method: U is convex on each open gap
between consecutive support points and tends to +∞ at the atoms, so a tangent
line at an interior point bounds U from below on the whole gap. Adaptive tangent
envelopes, no quadrature and no grid. This removes the sampling-only caveat on
those constructions.

**4. The ε-family, and the §4 model problem.**

For the explicit λ^(ε) — the §4 ansatz made concrete, masses from the residue
closed forms, support {p₀+ε} ∪ {q₀} ∪ [a, 1−ε] ∪ {1} with
p₀ = −1.8081072518940688, q₀ = 0.02632310211711336, a = 0.804462 — the
certificate gives U_λ ≥ 0 on all of [−1,1] for **every ε ∈ (0, 0.1]**: 624,275
interval chunks covering [1e-12, 0.1], each with its own rational parameter,
plus a separate lemma for (0, 1e-12] using the substitution t = ζ₁ − 1, under
which the pole at 1 that is singular as ε → 0 cancels algebraically rather than
numerically. Consequently the two-interval scenario
{U_μ > 0} ⊆ [p₀+ε, q₀] ∪ [a, 1−ε] is excluded for the whole range.

I believe that is the content of Problem 4.1 in Tao's notes, but that problem
had a typo which was corrected upthread by J_Koizumi_144, so I am stating the
inequality I actually certified rather than asserting the problem is closed. If
the intended forbidden region differs from the one above, say so and I will
re-run against the corrected statement.

**5. One phenomenon worth flagging for anyone building small-ε duals.**

As ε → 0, U_{λ^(ε)}(−1) tends to a constant δ = −(primal level defect)·(density
mass)/A. With rounded minimizer constants the level defect is nonzero and its
sign decides everything. One natural choice of constants gives δ = −9.2e-9, and
the family then provably fails for ε below roughly 4.3e-8. Choosing the primal
constants with the level defect on the other side gives δ = +5.3e-8 and uniform
positivity. I did not predict this: the certifier returned a decisively negative
window and the mechanism was worked out afterwards to explain it. Everything
posted in this thread sits at ε ≥ 5e-4, far above the wall, so nobody would have
met it — but anyone extending to small ε from midpoint decimals will.

**Where this stops.** The lane family above is close to exhausted: its
floating-point feasibility boundary is ≈ 1.8285, and the certified margin at
1.828 is already 4.12e-7, so finer boxes will not buy the next thousandth. The
*method* is not exhausted: at a₀ = x_L the b-range reaches x_R, so its ceiling
is |x_L| + x_R = 1.83443…, exactly the upper bound in item 2. The remaining
≈ 0.006 is the price of demanding U_ν > 0 on all of [0,1] rather than on
supp μ* = {−1} ∪ [0.8045, 1]. Closing it looks like a support-localization
statement for near-minimizers rather than more computation, and I would be glad
to be shown a better lane family.

**On the three proof claims.** I have not audited the analytic core of any of
them and I take no position on them. Separately, and earlier, I did re-verify
the computational appendix of the Darvas–Peng–Tao manuscript: existence and
local uniqueness of the extremal triple by an interval Krawczyk operator, plus
all thirty printed decimals of D. That is a statement about Appendix A only and
says nothing about the rest of that argument. The bracket above assumes none of
the three claims; it contains their common value, which is corroboration and not
confirmation.

Certificates, instrument and write-up:

- the infimum program: https://carlostoledo.co/reports/erdos1038-inf.html
- write-up (PDF): https://carlostoledo.co/paper/erdos1038-inf.pdf
- the consolidated record: https://carlostoledo.co/certs/erdos1038-inf.json
- the forcing certificate (450 KB):
  https://carlostoledo.co/certs/erdos1038-forcing-1.828.json
- the appendix re-verification of the DPT manuscript:
  https://carlostoledo.co/reports/claim-lemniscate.html
- the supremum side of this problem, separately certified (per-degree theorems
  on the 2√2 conjecture, odd degrees 3/5/7 strictly below):
  https://carlostoledo.co/reports/erdos1038-sup.html

Machine-assisted throughout: the constructions were proposed with AI assistance
and every quantitative claim is decided by an interval-arithmetic certificate
with adversarial controls that must fire. Not peer reviewed. The certificates
are built to be attacked directly — refutations are welcome and I will publish
any that land.

---

# B. GITHUB — teorth/erdosproblems issue #179 (machine can post)

**Command on approval:**

```
gh issue comment 179 --repo teorth/erdosproblems --body-file outreach/gh179-body.md
```

**Body:**

Following up on the supremum side above with the other end of the same problem.

**inf ≥ 1.828**, certified, with no tail estimate and no assumed minimizer. The
route is the finite-atom selector (jspier's approach on the standard reduction,
the same base as Hua Xu's Lean package): if ν = δ_{a₀} + Σ wᵢδ_{pᵢ} has U_ν > 0
on supp μ and U_μ(a₀) ≤ 0, then ∫U_ν dμ = ∫U_μ dν forces some pᵢ into
E = {U_μ > 0}. Sweeping a comb of unit-speed atoms with pairwise disjoint images
gives |E| ≥ cap for every normalized μ. Certified over the full range
a₀ ∈ [−1.828, −√2]: 86 a₀-boxes, 1350 b-boxes, worst certified margin 4.12e-7,
265 s single-core, plus an independently written checker that re-derives the
tiling from the certificate and hunts counterexamples in doubles.

**inf ≤ 1.8344304971959906**, certified, from an explicit measure
A·δ₋₁ + f(y)dy on [0.804462, 1] with x_L ∈ [−1.8081074413361424,
−1.808107441336006] and x_R ∈ [0.02632305585964334, 0.026323055859847976].

Two by-products that may matter more here than the bound. The three λ^(ε) dual
measures posted on the forum thread are now certified rather than sampled
(tangent envelopes on each gap between support points; off-atom minima 1.24e-5,
2.65e-6, 3.96e-6). And the explicit ε-family is certified positive with
U_λ ≥ 0 on [−1,1] for **every ε ∈ (0, 0.1]** — 624,275 interval chunks on
[1e-12, 0.1] plus a lemma for (0, 1e-12] via t = ζ₁ − 1 — which excludes the
two-interval scenario across the whole range. I believe that is the §4 model
problem (Problem 4.1) of Tao's notes; since that statement had a typo corrected
in the forum thread, I state the inequality I certified rather than claiming the
problem closed.

The forcing certificate is finitely many boxes with one frozen rational weight
vector each, so it is a plausible Lean formalization target; happy to help if
anyone wants to take it.

Nothing here assumes or adjudicates any of the three claimed proofs of this
problem listed on the forum. The bracket contains their common value D, which is
corroboration and not confirmation; separately I re-verified the computational
appendix of the Darvas–Peng–Tao manuscript (Appendix A only — all thirty
decimals of D and uniqueness of the extremal triple) and did not audit its
analytic core.

Machine-derived, not peer-reviewed, and built to be attacked:
https://carlostoledo.co/reports/erdos1038-inf.html ·
[write-up](https://carlostoledo.co/paper/erdos1038-inf.pdf) ·
[record](https://carlostoledo.co/certs/erdos1038-inf.json) ·
[supremum side](https://carlostoledo.co/reports/erdos1038-sup.html)

---

## Operator decisions before either goes out

1. **The forcing-certificate link.** The 1.828 file is 450 KB and served; no
   size problem (the bench's 12 MB version was its finer 332-box schedule — ours
   is the 86-box one).
2. **AI-disclosure wording.** Both drafts carry an explicit line. The forum's
   norm is actively contested (tdarv asked what the norms even are), so this is
   the paragraph most worth your edit.
3. **Order.** Suggest forum first (that is where the mathematics lives and where
   corrections will come from), GitHub #179 a day later pointing at it.
