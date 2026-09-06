# REFUSAL_FRONTIER.md — the map A⋆(σ, a) for the discounted congestion CAP

**Status: MEASURED at a = 1/2. The a axis is UNEVALUATED (see §8).**
Session 2026-07-28. All numbers below are outputs of commands quoted in §1; nothing here is
remembered, interpolated, or carried over from a previous attempt (the earlier attempt died on a
session limit and produced no evidence — this file starts clean).

> **The distinction this file exists to hold.** "The METHOD refuses here" is **not** "no solution
> exists here". Every refusal below is a statement about the *admissibility of the certificate*
> — `Z1 ≥ 1`, discriminant ≤ 0, `s̄₀ ≤ 0`, a non-finite intermediate — and about nothing else.
> Gomes–Mitake (NoDEA 2015) prove existence for `0 ≤ α < 1` by a continuation argument; that
> theorem is untouched everywhere on this map, including in the whole refused region.

---

## 1 · What was run

Compute ran in a scratchpad, on **byte-identical copies** of the repo working-tree kernels
(`shasum -a 256`, printed by every script on every run):

```
416955a131775a045a43f8fc995c1e52da376f2e3c35781f0cd257f1d04628d4  kernel/candidate-congest.js
3fb85f009487ec7ded83a27b1b76f186f0b4dcfa6cdd270a15fad3a9a72d4130  kernel/validate-congest.js
903c59f83b3665010772619a58c6c51d4f22dd22ef5940a979f2c829da53fd79  kernel/model.js
909f0ed32053d414b393f99407b4a12eaa723fc993b1b97c911783175c541e2c  eqcert/interval.js
327a289daaa62515b2bea45d25218fa98e65cb4f53071dd26c05b25107b2b62b  eqcert/sequence.js
34aba8496a28940cf74a247ebe64d22f3998b3a94d65a9b9f68a9efa147ff8ad  eqcert/radii.js
node v24.14.1
```

Scripts: `killcontrol.js` · `sweep-sigma.js` · `refine-N.js` · `arec.js` · `controls.js`
(all under the session scratchpad `research/frontier/out/`, with their `.log` and `.json`).

Instance held fixed throughout: **discounted Gomes–Mitake, `a = 1/2`, `V(x,m) = A cos 2πx + γm`,
`γ = 0.5`, `ν = 1.05`, `rCap = 1e-2`.** `A` is the swept amplitude; `σ` the viscosity.
A point counts as **CERTIFIED** only if `validate()` returns `ok` **and** `certifyPositivity`
certifies `min m > 0` over the whole ball. Anything else is a **REFUSAL with a named mode**.

## 2 · Kill-control (mandatory gate; ran BEFORE any sweep)

`node killcontrol.js` — **green, all four teeth.**

| tooth | demand | measured |
|---|---|---|
| K1 | validation SUCCEEDS at the published point and reproduces its numbers | `CERTIFIED`; r = 7.7544e-15 (published 7.75e-15, rel dev 5.6e-4), Z1 = 0.5267562 (published 0.5268, dev −4.4e-5), min m = 0.97369863, min w = 0.98706155 |
| K2 | an absurd input REFUSES **by name**, never crashes | 3/3: `m₀ = −1` → `SBAR0_NONPOSITIVE`; all-zero candidate → `SBAR0_NONPOSITIVE`; candidate ×1e6 → `Z1_GE_1` |
| K3 | a candidate perturbed by 1e-2 is REFUSED (falsifier-X2 method, `a₀ += 1e-2`) | Y0 3.49e-15 → 1.00e-2 (×2.9e12), REFUSED `DISCRIMINANT_LE_0`; independent pointwise HJB witness 1.00e-2 = 1.3e12 × r |
| K4 | a non-finite intermediate REFUSES, with the reason | throws `analytic Z1 tail bound is not finite`, and the poisoned term is the **binding** column (`worstCol = tail(analytic)`) at that instance |

A second kill-control (`arec.js` §KA) guards the one derived quantity that carries §6's
conclusion — see there.

### 2.1 · One published number is not supported *as a floor* (reported, not repaired)

`PAPER.md` §4's table entry `certified min m = 0.9737` reproduces fine **as a displayed value**
(4 d.p. ⇒ half-ulp bound 5e-5; measured deviation 1.4e-6). But the **abstract** states it as a
floor — *"min m ≥ 0.9737"* — and the computed floor is **0.97369863**, i.e. **1.37e-6 BELOW
0.9737**. A lower bound was rounded to nearest instead of down. The safe 4-d.p. floor is
**0.9736**. `min w ≥ 0.987` has no such problem (computed 0.98706155). Same species as the
catalogued "a number looks like a fact because it is written down", one rounding-direction in.

## 3 · The map at N = 14 — the σ ladder actually evaluated

`node sweep-sigma.js`. A-grid **evaluated at every σ** (16 points, no interpolation):
`0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1.2, 2, 3, 4, 6, 8, 12, 16, 24, 32`.
Every ladder was **monotone** (`C…CR…R`; no certified point above a refused one anywhere).
The first `C→R` transition was then bisected to ≤0.1 % relative width, each trial warm-started
from the candidate at the lower end so a cold-start Newton failure could never be mistaken for
the certificate refusing.

| σ | evaluated pattern | **A⋆ bracket (evaluated)** | mode at first refusal | min m at last CERTIFIED | min w at last CERTIFIED |
|---|---|---|---|---|---|
| 0.1 | `CCCCRRRRRRRRRRRR` | **[0.48320, 0.48359]** | `Z1_GE_1` (Z1 = 1.0001) | 0.5880 | 0.8360 |
| 0.2 | `CCCCCCRRRRRRRRRR` | **[1.14453, 1.14531]** | `Z1_GE_1` (Z1 = 1.0003) | 0.5711 | 0.8294 |
| 0.3 | `CCCCCCCCRRRRRRRR` | **[2.17578, 2.17773]** | `Z1_GE_1` (Z1 = 1.0001) | 0.5660 | 0.8275 |
| 0.5 | `CCCCCCCCCCRRRRRR` | **[5.36719, 5.37109]** | `Z1_GE_1` (Z1 = 1.0003) | 0.5622 | 0.8261 |
| 0.8 | `CCCCCCCCCCCCCRRR` | **[12.96094, 12.96875]** | `Z1_GE_1` (Z1 = 1.0001) | 0.5608 | 0.8256 |
| 1.2 | `CCCCCCCCCCCCCCCR` | **[28.29688, 28.31250]** | `Z1_GE_1` (Z1 = 1.0001) | 0.5607 | 0.8255 |

`σ ∈ {0.1, 0.2, 0.3, 0.5, 0.8, 1.2}` are the only σ evaluated. Outside that interval:
**unevaluated.** A⋆ grows steeply with σ (local log–log slope rises 1.24 → 1.93 across the
ladder; it is *not* a clean power law over the range measured and no exponent is claimed).

Further up each ladder the mode degrades in a fixed order — `Z1_GE_1`, then
`SBAR0_NONPOSITIVE` (the candidate's mean √m goes non-positive), then `CANDIDATE_NONFINITE`
(Newton diverges). Only the **first** transition is the certificate's boundary; the later two
are the candidate solver failing, and are reported separately for exactly that reason.

## 4 · The predicted mechanism does NOT fire — publish the measurement that hurts

`PAPER.md` §4 states the boundary map PROSPECTIVELY as *"the critical amplitude A⋆(σ,a) beyond
which **m_min → 0** and the proof refuses"*, by analogy with `mfg-cap`'s concentration study.

**Measured, across the whole evaluated map — 204 points evaluated (6 σ-ladders × 16 A at N=14,
plus 12 refinement ladders × 9 A), of which 86 were refusals:**

```
refusal modes observed, with counts:
  {"Z1_GE_1":66, "SBAR0_NONPOSITIVE":6, "CANDIDATE_NONFINITE":12, "DISCRIMINANT_LE_0":2}
  M_POSITIVITY_FAIL count = 0 ;  W_BRANCH_NOT_POSITIVE count = 0
smallest certified min m anywhere on the evaluated map = 0.539441
```

The density-vacuum gate **never fired once**, and neither did the w-branch gate. At the boundary
the density is `min m ≈ 0.54–0.59` and the reciprocal `min w ≈ 0.82–0.84` — both O(1), both
nowhere near vacuum. The proof stops because **the approximate inverse stops being one**
(`Z1 → 1`), not because the density approaches zero.

That the last-certified `min m` sits in the narrow band **0.5394–0.5880** at every σ and every N
evaluated is a striking regularity, but it is an *observation on 18 boundary points*, with no
derivation behind it, and it is recorded here as such — not as a law.

**Consequence for the paper: §4's prospective sentence is refuted at a = 1/2 and must be
rewritten before it ships.** The vacuum regime may still be where a *differently constructed*
approximate inverse would refuse; it is not where this one does.

## 5 · Does A⋆ move with N? — YES. The fixed-N map is resolution-dependent.

`node refine-N.js`, three boundary points, `N ∈ {14, 20, 28, 40}`, **G held fixed at 1024** so
that N-dependence is not confounded with the candidate grid.

| σ | N=14 | N=20 | N=28 | N=40 | movement 14→40 |
|---|---|---|---|---|---|
| 0.1 | 0.483400 | 0.505871 | 0.521354 | 0.533251 | **+10.31 %** |
| 0.5 | 5.367003 | 5.507522 | 5.603998 | 5.679501 | **+5.82 %** |
| 1.2 | 28.291944 | 28.999519 | 29.497033 | 29.872932 | **+5.59 %** |

(each entry is the lower end of a bracket of ≤0.05 % relative width; every bracket monotone.)

**A⋆ at fixed N is NOT a resolution-independent object.** It rises monotonically with N and is
still rising at N = 40. **The N = 14 map in §3 under-reports the boundary by 5–10 %, and a
published "A⋆(σ) at N = 14" would be a resolution artefact at that level.** Said plainly: the
§3 table is a *lower bound on the frontier of this method*, not the frontier.

**Controls.** `node controls.js`:
* **G is not the driver.** At σ = 0.5, N = 20, the A⋆ bracket is **identical** — `[5.506448,
  5.508600]` — for G = 256, 1024 and 4096.
* Refusal remains monotone in A at every N (all 12 patterns `C…CR…R`).

## 6 · But the boundary is not *only* an artefact: an N-free ceiling exists

Reading the analytic Z1 tail split at the last certified point explains both facts at once.
`validate-congest.js` bounds the tail columns by `max(mP, mM, mW)` with
`mM = cMgrow + cMrecip + epsId`, where

* `cP, cMgrow, cWgrow` carry the **growing-tail** denominator `σ·2π(N+1) + 1/(2π(N+1))`, which
  **grows with N** — measured 9.4 → 25.8 (σ=0.1) and 47.1 → 128.8 (σ=0.5) over N = 14 → 40, so
  these terms die like 1/N (σ=0.5: `cMgrow` 5.36e-2 → 2.08e-2);
* **`cMrecip = ‖w*w‖_ν / (2 s̄₀)` carries the CONSTANT reciprocal-tail denominator** — the
  reciprocal block's linear part has no derivative, so its tail inverse is the scalar `1/(2s̄₀)`.
  Measured denominator: 1.9770 → 1.9721 across N = 14 → 40, i.e. **N-free.**

Since `Z1 = max(explicit columns, analytic tail) ≥ mM ≥ cMrecip`, the implication

> **`cMrecip(σ,A) ≥ 1` ⇒ `Z1 ≥ 1` ⇒ refusal, at EVERY N**

is read directly off the code path, not conjectured. Define `A_rec(σ)` as the A where
`cMrecip = 1`. `node arec.js`:

| σ | **A_rec (N-free ceiling)** | A⋆/A_rec at N=14 | N=20 | N=28 | N=40 |
|---|---|---|---|---|---|
| 0.1 | **[0.56975, 0.56982]** | 0.8483 | 0.8878 | 0.9149 | 0.9358 |
| 0.5 | **[5.94849, 5.94922]** | 0.9021 | 0.9258 | 0.9420 | 0.9547 |
| 1.2 | **[31.24951, 31.25391]** | 0.9052 | 0.9279 | 0.9438 | 0.9558 |

`A_rec` came out **bit-identical across N = 14, 20, 28, 40** at all three σ (the bisection
resolves it to 2e-4 relative and the four values do not differ at that resolution).

**Kill-control for this quantity (`arec.js` §KA), run before it was used.** `w = m^{-1/2}` ⇒
`w*w = 1/m` exactly, so `‖w*w‖_ν` was recomputed by sampling `1/m` pointwise on an 8192-point
grid and projecting — a route touching neither `S.conv` nor `reciprocalW`.
KA1 agreement: rel dev **5.77e-15** against a **derived** bound `truncation 3.44e-16 +
roundoff G·ε 1.82e-12 = 1.82e-12`. (The first version of that bound was truncation-only and went
RED at 3.44e-15; it was **wrong**, not tight — it omitted the roundoff term. The tolerance was
re-*derived*, not raised.) KA2 `s̄₀` vs pointwise `mean √m`: rel dev **0**. KA3 the wiring is
real (`validate.js`'s own `cMrecip` matches to 1e-14). **KA4, the kill-control's kill-control:**
with the reciprocal built wrong (dropped `1/m^{a+1}` damping) the same check goes red at rel dev
**5.0e-1 = 2.7e11 × the bound** — so the bound cannot be concealing a defect of this class.

**`A_rec` depends on ν, by construction, and by as much as it depends on N.** At σ = 0.5, N = 20:

| ν | 1.00 | 1.02 | 1.05 | 1.10 |
|---|---|---|---|---|
| A_rec | [6.13623, 6.13867] | [6.05811, 6.06055] | **[5.94824, 5.95068]** | [5.77002, 5.77246] |

a 6.0 % swing across that ν range — the same order as the whole N = 14 → 40 movement. The
ceiling is a property of **(this approximate-inverse construction, this ν)**, not of the PDE.

(The ν = 1.05 entry `[5.94824, 5.95068]` and the σ = 0.5 entry `[5.94849, 5.94922]` in the table
above are the **same** quantity bisected to different widths — 5e-4 here, 2e-4 there — and the
brackets are consistent. They are quoted separately rather than merged because each is what its
own script actually evaluated.)

## 7 · Verdict on the decisive question

**Both halves must be stated, and neither may be dropped.**

1. **A⋆ measured at a fixed N is a RESOLUTION ARTEFACT at the 5–10 % level.** It moves
   monotonically upward with N and has not converged by N = 40. The §3 map must be published, if
   at all, as *"the boundary of the N = 14 certificate"*, never as *"the boundary"*.
2. **The refusal is nevertheless METHOD-INTRINSIC in mechanism and in location.** The binding
   term `cMrecip` is N-free; `A_rec(σ)` is an N-independent ceiling no refinement can cross; and
   A⋆(N) approaches it monotonically from below (ratio 0.848 → 0.936 at σ=0.1, 0.902 → 0.955 at
   σ=0.5 and σ=1.2). The measured local decay of the gap is `1 − A⋆/A_rec ∼ N^(−0.79…−0.67)`
   (slopes from consecutive pairs; the exponent is **drifting** across the four N, so it is a
   local slope and not an order — the catalogued "never quote an empirical slope from one
   parameter set as an order" applies). **Whether A⋆(N) → A_rec is NOT established: N > 40 is
   unevaluated.**
3. **The refusal is intrinsic to the METHOD AS CONSTRUCTED, not to the mathematics.** It is set
   by the choice to close the half-integer power with `m·w² = 1` and to invert the reciprocal
   block's tail by the scalar `1/(2s̄₀)`. A different closure or a non-scalar reciprocal tail
   would move `A_rec`. Nothing here bounds where solutions exist.

**What this means for the paper.** The honest contribution is *not* "the map A⋆(σ,a)". It is:
(a) the refusal is **named and mechanised** — `Z1 → 1` through one identified coefficient, not
"the density goes to vacuum", which is refuted; (b) that coefficient yields an **N-free ceiling**
computable from the candidate alone, i.e. a cheap a-priori predictor of where this method will
refuse *before* any interval arithmetic is run; (c) the fixed-N boundary is a lower bound on it.
That is a smaller and better claim than the one §4 promises.

## 8 · What was NOT evaluated — no interpolation, no extrapolation

* **The `a` axis is UNEVALUATED. There is no A⋆(σ,a) map in this file — only A⋆(σ) at a = 1/2.**
  `kernel/validate-congest.js` hardcodes `a = 1/2`: nothing reads `P.a`; the reciprocal closure is
  the literal `mww = conv(s, w)` (line 107, i.e. `m·w² − 1`), its derivative the literal
  `mul(iv(2), ev2(eg, s.s, k, m))` (line 179), and the reciprocal tail inverse the literal
  `1/(2·s̄₀)` (lines 234, 319, 379). A general `a = 1/q` needs `m·w^q = 1`, a new `dRow('R')`,
  a new tail inverse `1/(q·(m*w^{q−1})₀)`, new analytic tail components, and a **new Z2 for a
  degree-(q+1) term** (the current Z2 hard-codes a degree-3 expansion, `D3 = 15`). None of that
  can be shipped without its own mutation-tested battery, and an unvalidated bound is worse than
  no result. **`a = 0` is likewise not runnable here**: `candidate-congest.js` has the `cong:false`
  quadratic control, but `validate-congest.js`'s `buildPhi` assembles the `√m` drift
  unconditionally, so the a = 1/2 validator cannot certify an a = 0 solution.
* **N > 40** — so the limit of A⋆(N) is open (§7.2).
* **σ outside [0.1, 1.2]**, and between the six evaluated σ in §3 / three in §5.
* **γ ≠ 0.5.** γ > 0 is load-bearing for the even-subspace restriction; its effect on the
  boundary is not measured.
* **rCap ≠ 1e-2**, and A above the first refusal is only known at the 16 evaluated grid points.
* The refused region was **not** probed for whether a solution exists there. It is not our claim
  either way, and it must never be reported as one.

---

## Addendum — 2026-08-21: re-derived, and one path in §1 has gone stale

Nothing above is edited. This section records two measurements made today, when the §6 result was
taken to the shipping page.

**§1's script location is stale, and the scripts are fine.** §1 says the five scripts ran "under the
session scratchpad `research/frontier/out/`". That directory no longer exists — the scripts were
re-homed to `docs/refusal-frontier/` beside this file (commit 6f00b79). §1 is left as written; it is
a true record of where they were on 2026-07-28. Anyone re-running them should look here.

**The kernel hashes in §1 have drifted, and the result did not.** All three kernels this file
pins now hash differently on disk: `candidate-congest.js` 416955a1… → 6cce378d…,
`validate-congest.js` 3fb85f00… → bd047de8…, `model.js` 903c59f8… → 72b08029…. A pinned hash that
no longer matches is normally where a measurement stops being quotable, so `arec.js` was re-run
today against the kernels as they stand rather than trusting either the file or the drift:

* `A_rec` reproduced **bit-identically** at all three σ — [0.56975, 0.56982], [5.94849, 5.94922],
  [31.24951, 31.25391] — and remains bit-identical across N = 14, 20, 28, 40, exactly as recorded.
* All twelve `A⋆/A_rec` ratios reproduced to the printed four decimals (0.8483 → 0.9358 at σ=0.1,
  0.9021 → 0.9547 at σ=0.5, 0.9052 → 0.9558 at σ=1.2).
* The kill-controls fired as recorded: KA2 rel dev **0**, KA3 wiring agreement to twelve figures,
  and **KA4 red at 5.000e-1 against an honest 5.77e-15** — the kill-control's kill-control still has
  its teeth on today's bytes.

So the drift is verdict-preserving on this quantity. That is a statement about `A_rec` and about
nothing else: the §3 sweep and the §5 refinement were **not** re-run, so their numbers still rest on
bytes that have moved, and anything quoted from them should say so or be re-derived first. The
distinction matters more than the reassurance — *this* result was checked, the others were not, and
a re-run that covers one section is not a clean bill for the file.

**What went to the page.** `site/technical-reports/mfg-congest.html` gained one section carrying the
mechanism (Z1 → 1 through `cMrecip`, and the refuted density-vacuum reading), `A_rec` as the N-free
ceiling with the table above, the fixed-N boundary as a **lower bound** on it, §7's both-halves
honesty about the 5–10% resolution artefact, and §8's non-evaluation list. The three sentences on that page using the literal phrase
**"future work"** were left standing, because §8 says the `a` axis is unevaluated and they are therefore
true — one now points at the measured σ-slice instead of reading as though nothing had been done.
**That count came from matching one phrase, and a phrase is narrower than the claim.** Two paraphrases
were missed on the first pass and are recorded here because a completeness claim produced by a narrow
pattern is exactly the defect this tree keeps paying for: "Still to build:", which asserted the very
mechanism §4 refutes and which §4 says "must be rewritten before it ships", and "stays open", which had
gone stale by one section. A hostile read caught both; both are now corrected on the page.

**The re-run's output is retained** beside the originals as `arec-2026-08-21.log`, so this addendum's
claim is checkable rather than asserted — the earlier draft of it recorded a re-derivation whose
artifact had been written to a working directory outside the repo and lost.
