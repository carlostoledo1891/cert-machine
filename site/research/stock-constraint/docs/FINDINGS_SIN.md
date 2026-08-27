# sin-mfg.html — first validation pass (2026-07-20)

`test-sin.js`, the battery this artifact never had. It went **red on 6 checks
covering 3 distinct defects**, all three are now **fixed and pinned**, and the
suite is **ALL PASS** with every fix proven to go red when reverted.

## Process finding (found before any number was checked)

The artifact's header claimed:

> kernel ported verbatim from the validated headless battery
> test-sinmfg.js (ALL PASS)

**CORRECTED 2026-07-20.** An earlier version of this document stated that
`test-sinmfg.js` "does not exist anywhere on disk." **That was wrong**, and the
correction matters more than the original claim.

The battery does exist — it was produced in the prior session's sandbox at
`/mnt/user-data/outputs/` and later recovered into `artifacts-outdated/`. It was
never *transferred*, which is a sync gap, not a fabrication. I inferred absence
from a filesystem search of one machine and stated it as a global fact; that is
the same reasoning-instead-of-checking error this project keeps paying for.

What survives the correction, and is worse than the original claim:

1. When the header comment was written, the battery was unreachable from the
   artifact's own repository, so the certification it advertised was
   **unverifiable by anyone holding the artifact** — the same species as
   FINDINGS.md Result 5, where `smoke.js` validated a stale file for a session.
2. `test-sinmfg.js` **carries its own embedded copy of the kernel** — it contains
   no `fs` call and never opens `sin-mfg.html`. It therefore runs green while
   validating a kernel that has since diverged substantially from the artifact
   (reordered `clearSlice`, pooled mixed dispatch, `fmtE`, `S.cert`). Running it
   as evidence about the current artifact would be actively misleading.

That is why it is retired in this sprint rather than restored, with its three
genuinely unique assertions harvested into `test-sin.js` first.

Consequence for design: `test-wardrop.js`, the house template, holds its own
copy of the kernel because it was the *development* battery, written before
porting into the HTML. That route is closed here — there is nothing to port
from, so **the HTML is the code of record**. `test-sin.js` therefore extracts
the kernel from `sin-mfg.html` at run time and cannot drift from the artifact
under test. `SIN_HTML=<path>` points it at a mutant.

---

## Defect 1 — the scarcity branch preempted withholding — FIXED

Hydro is price-taking with a stock constraint, so its KKT condition against the
water value `w` is

```
h_t = HBAR   if p_t > w
      0      if p_t < w
      [0,HBAR] if p_t = w
```

The band caps the price at `PMAX`, so whenever `w > PMAX` we have
`p_t <= PMAX < w` on **every** hour and `h ≡ 0` is forced. `clearSlice` tested

```js
if(N(PMIN)<=0)          { curtailment }
else if(N(PMAX)>=HBAR)  { SCARCITY: p=PMAX, h=HBAR }   // fired first
else if(w>PMAX)         { withhold: h=0 }              // unreachable
```

so on any hour where net demand at the cap exceeded hydro capacity, `h` was
pinned to `HBAR` **regardless of the water value**, in direct contradiction of
the KKT condition. `tot(w)` then saturated at a positive constant, the stock
constraint became unenforceable, and `dispatch`'s bisection walked to its
bracket ceiling `PMAX+5` and returned it — undetected, because `dispatch`
handled only two exceptional regimes (spill, mixed-at-cap).

**Measured before the fix**, at `sol=0.6 pk=0.8 phi=0 EHYD=2.0 floor=0.02
cap=1.5` — every one a legal slider position:

- seven evening hours pinned at HBAR → Σh·dt = **2.10** against a budget of **2.00**
- `tot(w) = 2.100` at w = 1.5, 2, 3, 6.5, 20 and **10⁶** — flat, forever
- displayed water value **w = 6.500000** = `PMAX + 5`, the bracket ceiling,
  printed to six decimals and not a water value at all

**Fix:** the withholding test now precedes the scarcity test. Because the
ordering is load-bearing, it is commented as such at the site.

**After:** A9 `3.00e-1 → 0.00e+0` · A10 `1.00e-1 → 1.78e-15` · A12 6 violations
→ 0 · A16 no saturation.

Note `w > PMAX` can no longer be an *equilibrium* — `h = 0` there makes
`tot(w) = 0 < EHYD`, so the bisection always lands at `w ≤ PMAX`. That is the
branch doing its job, not the branch being dead: it is what makes `tot(w)`
decrease to zero and the bisection well-posed. It is therefore probed directly
(A7b) rather than by classifying final dispatches.

## Defect 1b — the same bug, duplicated inline — FIXED

Fixing `clearSlice` exposed a second instance the sweep had been masking. The
mixed cap-indifference branch in `dispatch` **duplicates the case analysis
inline** and had the same preemption: it pinned scarcity hours to `HBAR` and
scaled only the remainder. But at `w = PMAX` every hour clearing at the cap has
`p = w`, so hydro is indifferent on **all** of them. When the pinned hours alone
exceeded the budget, `θ` clamped to 0 and the stock constraint overshot by up to
`1e-1` (A11: 66 corners).

**Fix:** pool every indifferent hour and scale uniformly. Which allocation is
chosen among the optimal set is a declared modelling choice — all are optimal
for hydro — but closing the budget is not a choice. A11 worst is now `8.9e-16`.

*Lesson: a case analysis copy-pasted into a second site will carry its bugs
there too, and only a sweep that reaches the second site will show it.*

## Defect 5 — the same bug, at a THIRD site: the welfare counterfactual — FIXED (2026-07-29)

Defect 1 was `clearSlice`. Defect 1b was the copy of it inlined in `dispatch`.
**There was a third copy**, and it survived nine months and two prior fixes of
the same bug because it lives in a function nothing classified as a dispatcher:
`touCounterfactual`, the welfare counterfactual the page compares the
equilibrium against.

Its hydro was a **pure residual dispatcher** — no water value, no KKT, no
withholding branch:

```js
const hOf = w => need.map(n => Math.min(Math.max(n - Math.min(w/GAM, QBAR), 0), HBAR));
```

Because `min(w/GAM, QBAR) ≤ QBAR` for every `w`, this is bounded below by
`Σ max(need − QBAR, 0)` **no matter how large `w` grows**. A budget smaller than
that bound is unreachable, so the bisection — the same `lo=1e-4, hi=PMAX+5`
bisection Defect 1 already broke once — walks to its ceiling and returns it. The
missing branch is exactly Defect 1's: the band caps the marginal cost of serving
an hour at `PMAX` (a unit not served costs `PMAX` and nothing more), so `w > PMAX`
forces `h ≡ 0` and hydro withholds.

**Measured before the fix**, at base parameters over the same 50-point tariff
grid the artifact itself grid-searches:

- **50 of 50** grid points violated the stock constraint
- **w = 8.0000 = PMAX + 5** on all 50 — the bracket ceiling, again, printed as a
  water value
- worst `Σh·dt = 4.9305` against `E_hydro = 3.2`, error **1.7504**
- on every point `Σh·dt` equalled the unreachable floor exactly, which is the
  signature: the bisection was not solving anything

**Consequence for the number on the page.** Every violation handed the
counterfactual *more* hydro than the model allows, so the direction was
conservative — but the comparison was between a constrained equilibrium and an
unconstrained alternative, which is not a comparison. **The best-TOU welfare gap
moves from 5.23 % to 20.39 %.** The old figure is retracted, not merely updated.

**Fix:** the counterfactual gets the same trichotomy as `clearSlice`, including
the withholding branch and the two degenerate-dual regimes `dispatch` already
had (spill at the floor; mixed-at-cap with `θ` pooling the indifferent hours).
At base parameters all 50 tariffs land in the mixed regime, `w = PMAX` exactly,
`θ ∈ [0.6464, 0.8179]`, worst budget error **2.22e-15**.

**Why the tie-break is not a modelling escape hatch here.** In `dispatch` the
allocation among indifferent hours is a declared choice (all are optimal *for
hydro*). In the counterfactual the number being reported is *welfare*, so the
choice would have to be shown not to move it — and it does not, for a structural
reason: on a pooled hour thermal is at `QBAR` and `d = need − QBAR − h`, so `J`
is affine in `Σh` with slope `−PMAX` across the whole optimal face. Measured
against two extreme points of that face, rebuilt independently of the kernel:
uniform-θ, greedy-earliest and greedy-latest agree to **7.1e-15**, and the best
budget-preserving single-hour reallocation gains **3.6e-15** (A14c, A14d).

**Why no check caught it.** `A14` asserted only that the gap is **non-negative**.
A sign is not a constraint, and the violation made the counterfactual *stronger*,
so the sign it tested stayed right while the comparison underneath it was
meaningless. The new checks assert the constraint itself: `A14b` (budget closes
at every tariff, plus per-slice bounds), `A14c` (tie-break welfare-neutral),
`A14d` (dispatch is cost-minimising, not merely feasible), `A14e` (all three
water-value regimes reachable and each closes), `B14` (the displayed percentage
tracks an independent recomputation).

**Refusal is wired to the display.** `touCounterfactual` now returns a receipt
rather than a scalar, and the `roG` readout prints
`refused · counterfactual hydro budget off by <err> (not like-for-like)` instead
of a percentage whenever any counterfactual on the grid fails to close. Verified
in both directions by re-rendering the page under the battery's Proxy DOM: clean
gives `+55.4% naive · +20.4% vs BEST two-level TOU (50-point grid)`; with the
withholding branch removed it gives the refusal string at `1.75e+0`.

**Mutation-tested, four mutants, clean control green:** M1 restore the residual
dispatcher → A14b, A14c, A14e, B14 red (and **A14 stays green**, which is the
whole finding); M2 pin `θ = 1` → A14b, A14c, A14e, B14 red; M3 pool at `HBAR`
instead of `min(HBAR, need−QBAR)` → A14c, A14d red while A14b stays green,
correctly, since that mutant closes the budget and breaks only optimality;
M4 delete the spill branch → A14e red; M5 hardcode `roG` to its correct
base-parameter string → B14 red.

*Lesson, and it is the third telling: this project has now paid for the same
missing KKT branch at three sites. The first two were found by sweeping a
dispatcher. The third was found by asking a different question — not "is the
number right?" but "**is the thing it is compared against subject to the same
constraints?**" A counterfactual is a model too, and nothing was auditing it as
one.*

*Second lesson, cheaper to state: `dispatch` and `touCounterfactual` now contain
the same branch guard verbatim — this was discovered while building M4, whose
anchor string matched twice. Two carriers of one case analysis is exactly the
condition Defect 1b describes. Giving the trichotomy one owner is Stage 3 work
(PLAN.md §5.1) and is recorded here as the third instance of its motivation.*

## Defect 2 — the verdict outranked its own certificates — FIXED

`finish()` and `__sin.solveSync` gated the word "converged" on `S.res < 1e-10`
— the **Picard residual alone** — and never consulted the structural
certificates. At the Defect 1 corner the page displayed, simultaneously:

```
STATUS: converged — 34 iterations
  hydro budget         = 1.00e-1     <- should be machine zero
  complementarity in w = 3.00e-1     <- should be machine zero
  w dual feasibility   = VIOLATED    <- the only self-flagging readout
  T3 Hotelling         = 0 hours · max |ϖ−w| < 1e-14   <- vacuously satisfied
```

**Fix:** `certificates()` now stashes every structural residual in `S.cert`
with an explicit violations list, and both verdict paths gate on
`picardOK && certOK`. A fixed point whose dispatch violates its certificates
reports **"NOT AN EQUILIBRIUM — the price path is a fixed point but the
dispatch violates …"**, naming them. A converged iteration is necessary, not
sufficient, and the page now says so.

## Defect 3 — the display floor made three certificates unfalsifiable — FIXED

`fmtG` rendered anything under 1e-14 as the constant string `'< 1e-14'`.
Measured over 48 corners, mass drift never exceeds **5.55e-15** — under the
floor on **48 of 48**, and the same for `roClear` and `roBand`. Those three
readouts were **constants across the entire reachable slider box**, so a
hardcoded string was byte-identical to the real computation.

**Fix:** `fmtG = fmtE`. Certificates print their real digits.

---

## Receipt: the battery run against the PRE-FIX artifact (2026-07-20)

Before `artifacts-outdated/` was purged, the pre-fix `sin-mfg.html` was still on
disk — the only on-disk mutant for all three defect fixes. Running the current
battery against it:

```
SIN_HTML=artifacts-outdated/sin-mfg.html node test-sin.js   →   10 FAILURES
```

| defect | checks that fire |
|---|---|
| 1 · scarcity preempts withholding | A7b, A9 (3.00e-1), A10 (1.00e-1), A12 (6 corners), A16 (saturation at PMAX+5) |
| 2 · verdict outranks certificates | B11a (`picardOK=undefined certOK=undefined violations=ABSENT`), B11 ("converged" beside three violated certificates) |
| 3 · display floor unfalsifiable | B6, B7 (`0/4 agree · 1 distinct value`), B12 |

**The honest subtlety: A11 does NOT fire here.** Defect 1b — the mixed
cap-indifference branch pinning scarcity hours before scaling — was *invisible*
in the pre-fix artifact, because the old mixed branch was consistent with the old
`clearSlice`. It only became reachable once Defect 1 was corrected, which changed
which corners route through the mixed branch. So this receipt covers three of the
four fixes; Defect 1b's own receipt is the `r2` mutant below.

That is worth stating plainly: **fixing one defect exposed another that no test
could have caught beforehand.** A sweep can only find what the code lets it reach.

## Mutation testing — and two escapes it caught in the battery itself

House practice: a green suite proves nothing until it can go red. Every fix was
reverted and re-run.

| mutant | result |
|---|---|
| r1 — revert the `clearSlice` branch order | **CAUGHT** — A7b, A9, A10, A12, A16, B11 fire |
| r2 — revert the mixed-dispatch pooling | **CAUGHT** — A11 fires at 2.00e+0 |
| n2 — T3 broken (`p = wc*1.000001`) | **CAUGHT** — A4, A8, plus B9/B11a: the page says NOT AN EQUILIBRIUM |
| n4 — reflecting BC broken (real mass leak) | **CAUGHT** — A2 at 2.96e-1, and the verdict correctly refuses to call it converged |
| n1/n5 — fake certificate (`roMass`/`roClear` hardcoded) | **CAUGHT — but only after two failed attempts, below** |
| m3 — flux divergence scaled by 1.000001 | invalid mutant: the divergence telescopes to zero, so mass is still conserved. Not an escape. |

### The fake-certificate mutant escaped the battery twice

This is the finding worth keeping. The battery written to catch fake
certificates was itself fooled by one, twice, in two different ways:

1. **First version** let `fmtG`'s `'< 1e-14'` string stand for any sub-floor
   value. A mutant hardcoding `roMass` to that literal **passed**.
2. **Second version** compared real digits — but only **at base parameters**. A
   mutant hardcoding `roMass` to `'3.33e-15'`, the correct base value,
   **passed again**.

An earlier draft of this document asserted that fixing the display would make
the mutant catchable. **That claim was false and is retracted** — it was
written from reasoning rather than from running the mutant, which is precisely
the failure mode this project keeps paying for. Running it showed escape #2.

**Resolution:** every displayed certificate is now tracked across four corners
and must *both* agree with an independent recomputation at each *and* take more
than one distinct value. A readout that never varies is reported as
unfalsifiable rather than quietly passing. `n1` now fails with
`1/4 agree · 1 distinct value(s) — CONSTANT`.

*Generalised lesson, and it is the same one as smoke.js's M1 mass check: a
single sample cannot separate a computation from a constant that agrees there.
Cross-checks must sample where implementations diverge, and must assert that
the displayed value actually moves.*

---

## Harvest and retirement of the two prior batteries (2026-07-20)

`artifacts-outdated/test-sinmfg.js` (14/14 ALL PASS in its own sandbox) and
`smoke-note.js` (17 checks) were retired. Both were unsafe to keep:

- `test-sinmfg.js` **embeds its own copy of the kernel** — no `fs` call, never
  opens `sin-mfg.html`. It runs green while validating a kernel that has since
  diverged (reordered `clearSlice`, pooled mixed dispatch, `fmtE`, `S.cert`).

> **Follow-on CLOSED (2026-07-20):** `test-wardrop.js` had the identical defect —
> it embeds its own Wardrop/HRF kernel and never reads `research/mfg-lab/mfg-lab.html`.
> `research/mfg-lab/tests/test-wardrop-diff.js` now extracts the SHIPPED MWD kernel from
> the artifact and drives S1/S2/S3 through both it and the battery kernel:
> totals agree to `0.00e+0` (bit-for-bit, as expected — Tab 07 is untouched), and
> the shipped kernel is validated directly against paper Table I with no copy in
> the loop. Proven red: a 1% perturbation of the shipped S1 cost is caught
> (Δtotals 1.09e-1, KKT cert 5.5e-4) — while it still passes "Table I within
> rounding (dev 1.46 ≤ 2)", which is exactly why the loose paper-comparison alone
> was never enough. Same concept, next target: HTML↔Python (item 3).
- `smoke-note.js` hardcodes `/home/claude/sinmfg/s.js` and **cannot run at all**.

Their genuinely unique assertions were harvested into `test-sin.js` first, each
proven able to go red:

| harvested | mutant that proves it | result |
|---|---|---|
| A17/A18 T4 fleet reduces curtailment (+ no `P.phi` state leak) | — | see A21 below |
| A19 exploitability non-negative | negate the eps accumulation | **RED** `eps = -1.902e-1` |
| A20 comparative statics, curtailment monotone in solar | make `St` ignore `P.sol` | **RED** flat `0.70` ×7 |
| B13 displayed `roCurt` tracks recomputation | hardcode the readout | **RED** `1/4 agree` |
| A21 fleet arbitrage direction | flip the fleet's sign in `makeN` | **RED** midday `-0.0717` |

**NOT harvested, deliberately:** `test-sinmfg.js:368` (`eps < floor`) — the
fabricated-floor construction `FINDINGS.md` destroyed; A15 exists to indict it,
and reimporting it as a gate would restore a retracted defect. Also `dpAudit2`,
which is line-for-line the artifact's own `dpAudit` — a duplicate, not the
independent cross-check its name suggests.

### A17 is weak, and the mutation testing is what showed it

Flipping the fleet's sign entirely — `fleet = -P.phi*clamp(...)` — **does not
trip A17**. `kF < k0` stays true, because the equilibrium re-solves around the
perverse fleet. A17 only ever asserted that *some* fleet beats *no* fleet, which
is weaker than it looks. The sign flip was caught, but by **A14** (welfare beaten
by a two-level tariff), not by the check nominally about the fleet.

The falsifiable content is the **arbitrage direction** — charge into the solar
surplus, discharge into the evening peak — which is what the note actually
claims. A21 now asserts it: true artifact midday(10-14) **+0.2745** / evening
**−0.9647**; sign-flipped mutant midday **−0.0717**. That separates them.

*Lesson, and it is the third time this session: a check can pass its own
mutation while a neighbouring check does the real work. Attribute detection to
the check that fired, not the one you expected to.*

## Measured, not remembered

- Picard converges on **324/324** corners of the six-slider box, in **32–45**
  iterations at tol 1e-10. Any prose stating a convergence range must quote
  this and be re-measured if the kernel changes.
- Branch coverage (the `clearSlice` "complete case analysis" claim):
  curtail 1026 · scarcity 641 · hydroMarginal 2692 · hydroOff 1692 ·
  hydroCapped 1725 — all reachable-in-equilibrium branches exercised, plus a
  direct probe (A7b) for withholding.
- Regimes: 256 normal · 2 spill · 66 mixed-at-cap.
- Equilibrium welfare beats the best two-level TOU tariff on a 50-point grid by
  **20.39 %** (measured 2026-07-29), consistent with the convex-program claim.
  **The 5.23 % this line carried until 2026-07-29 was not like-for-like** and
  must not be requoted: the counterfactual violated the model's own stock
  constraint on 50 of 50 grid points. See Defect 5. The counterfactual's own
  regimes over those 50 tariffs, at base parameters: 50 mixed-at-cap
  (θ ∈ [0.6464, 0.8179]), 0 spill; walking E_hydro reaches all three
  (mixed ≤ ~4.9, interior at 5.0, spill ≥ ~5.8).

## Defect 4 — the "exact discrete transpose" claim was overstated (2026-07-20)

The note's strongest structural claim — the FP is "the exact discrete transpose"
of the HJB drift (eq caption line 104, method prose line 180) — was untested.
Built both operators as matrices at the equilibrium and measured (test-sin.js
A22/A23, scratch across all 24 slices):

| operator | claim | measured |
|---|---|---|
| diffusion | exact discrete transpose (self-adjoint) | **TRUE** — `|D−Dᵀ|/scale = 3.5e-18` |
| transport | exact discrete transpose | **FALSE** — `|T_FP−A_HJBᵀ|/scale = 1.000` at every slice |

The FP transport is **upwind** (chosen for positivity — A3 verifies strict
positivity); the linearized HJB drift is **centered**. They are not adjoints at
all. What the note actually depends on — **mass conservation** — comes from the
**conservative flux form** (the transport matrix has machine-zero column sums,
`1ᵀT_FP = 0`, A23), not from an adjoint identity. The code is correct; the prose
overclaimed. Corrected both locations to state exactly this, plus an honest
disclosure that sin-mfg's scheme is NOT the matched HJB⇄FP transpose of the
continuum-lab tabs.

**A second overclaim, found in the same file while fixing the first.** The
disclosures carried "meaningful down to its stated O(h+Δt) **consistency
floor**" and "the exploitability **floor** is a heuristic O(h+Δt) scale" — the
exact retracted construction FINDINGS.md destroyed for mfg-lab, and the
`consistency floor` language smoke.js bans there. It survived because **no gate
had ever checked sin-mfg.html** for it — the failure-catalog "a fixed claim
survives in copies you did not grep for", one project over. The `roEps` display
also read `eps < floor X.XXX`, but A15 measures `|eps|/floor` up to ~2, so the
`<` was false. Corrected the prose and the display; added prose guards A24–A26.

Proven red: re-adding "exact discrete transpose" → A24; re-adding "consistency
floor" → A25; breaking the diffusion BC symmetry → A22 (via a source-form
anchor, since `diffuse` is an unexported closure — the reconstructed-matrix
check alone could not see it, the landmine pattern again); breaking the
conservative flux form → A23.

## T3 — deterministic case PROVED (2026-07-20)

The deterministic interior-reservoir case — the one the benchmark actually runs
— is now a theorem, written into `SIN_MFG_Model_Spec_v0.3.md` (Theorem B1-det).
It is the classic Hotelling argument: the water value w is the constant KKT
multiplier of the daily energy budget, so on interior-release hours ϖ = w by
complementary slackness, ϖ ≤ w when h = 0, ϖ ≥ w when h = h̄, and w is the unique
root of the (monotone) budget map. That KKT system **is** the model's
`clearSlice` + water-value bisection, so `test-sin.js` A8 (ϖ = w on 2692 marginal
hours, max |ϖ−w| = 0), A9 (the complementarity, worst 0) and A12 (budget monotone
in w) are the numerical verification of the theorem, to machine zero. The note
and abstract were updated to mark T3 `[PROVED]` in this case.

Defect 1 was, in hindsight, a numerical counterexample to the theorem's
hypotheses (the scarcity branch violated the complementarity the proof requires);
fixing it is what made the numerics match the proof.

**Still sketched:** the STOCHASTIC form (w a martingale between constraint
events) — the deterministic lift is proved, but reflected-FBSDE well-posedness
through the mean-field coupling is open (Prop B1-stoch).

## A1 — status sharpened, not proved (2026-07-20)

`SIN_MFG_Model_Spec_v0.3` A1 (equilibrium = KKT of a convex program) was
`[SKETCHED — discrete case near-complete]`. Sharpening it revealed the "near-
complete discrete" claim was **misleading, for the Defect 4 reason**: the KKT of
the discretized Benamou–Brenier program is self-adjoint, but this page's kernel
uses an upwind (non-self-adjoint) transport, so the discrete system it solves is
a *consistent approximation* of the convex-program KKT, **not literally its KKT**.
Reframed honestly: the continuum convex structure is standard (Lasry–Lions /
Cardaliaguet), the reflecting-boundary duality is `[OPEN]`, and an *exact* discrete
KKT needs a variational (self-adjoint) scheme — deferred. The note's A1 status
line was updated to match. A naive discrete "proof" would have been false; the
certificate discipline (Defect 4) is what showed it.

## eps floor — REMOVED (2026-07-20)

The `dpAudit` eps floor was displayed as "eps < floor X" / "O(h+Δt) scale X".
Measured, `|eps|/floor` spans several orders across the slider box, so it bounds
nothing — the construction FINDINGS.md destroyed for mfg-lab. It is now **removed
from the display entirely** (roEps reports the exploitability value alone, to be
read beside the Picard residual that limits it), matching the lab's resolution.
A15 was repurposed from indicting the floor to a Layer-B guard that the eps
readout carries the value and NOT a floor/bound; proven red by re-adding a floor.

## T3 looked at on REAL data — exploratory, consistent (2026-07-20)

> This section was written before adversarial review and originally claimed the
> result "CONFIRMED". Review downgraded it (see the "Still open" bullet on the
> PLD run for the four reasons — administered price, persistence null, selected
> windows, low-power martingale). The numbers below are correct; the framing is
> now DESCRIPTIVE CONSISTENCY, not a hypothesis test.

Ran the T3 test on **five years of CCEE hourly PLD, submarket SUDESTE (SE),
2021–2025** (`pld_horario_YYYY.csv`, Dados Abertos). Reproducible via the
committed `research/stock-constraint/tests/pld_multiyear.py` (imports the validated primitives —
same windows, flatness statistic, permutation null). CCEE's portal blocks this
execution environment's IP; Carlos downloaded the files. Loading required a
CCEE-format branch (the timestamp is split across `MES_REFERENCIA`+`DIA`+`HORA`,
not one column) and surfaced/fixed a silent ISO date-scramble bug on the way.

| year | floor (piso) | %floor | %interior | windows | flatness shrinkage | jumps (S2) |
|---|---|---|---|---|---|---|
| 2021 | 49.77 | 2.9% | **97.1%** | 519 | **×75.3** | 64.8% |
| 2022 | 55.70 | 79.1% | 20.9% | 123 | ×9.5 | 42.4% |
| 2023 | 69.04 | **98.3%** | 1.7% | 15 | ×5.4 | 55.3% |
| 2024 | 61.07 | 63.7% | 36.3% | 220 | ×31.9 | 61.3% |
| 2025 | 58.60 | 23.4% | 76.6% | 549 | ×6.9 | 39.5% |

**The qualitative signature is present, but read it as consistency, not
confirmation.** The note predicts that *within hydro-marginal (interior) windows
the price is flat, jumping only at constraint events*. Across all five years the
flat-with-jumps signature is descriptively present: within-window dispersion is
5–75× below the shuffle null (which, note, measures persistence), ≈40–65% of the
within-window variation sits in a handful of jumps, and window levels show no
day-to-day drift (|t| < 0.3 every year — a non-rejection, low power). Pooled over
1426 interior windows the median within-window relative range is **6.1%**.

**The surprise, and the honest part — "publish the measurement that hurts".**
The *test's* naive seasonal refinement — "wet flatter than dry" — is NOT
supported: pooled seasonal contrast is DRY-flatter, Δ = −0.44pp, z = −1.19 (not
significant); in the one year where it is individually significant (2025) it is
also dry-flatter (z = −2.01), the OPPOSITE direction. The reason is structural
and illuminating: the flatness tracks the **hydro-marginal REGIME, not the
calendar**. The flattest year was **2021 — the water crisis** — when scarcity
made hydro marginal almost year-round (97% interior, ×75). In abundant years
(2023: 98% floored, 2024/2025 wet season ~99.5% floored) the wet season sits at
the **floor** (curtailment), so there are few genuine hydro-marginal windows
there and the calendar proxy is confounded. So the flatness STRENGTH itself
rises and falls with how often hydro is actually marginal — exactly what T3
says, once you condition on the regime rather than the month.

This is the best kind of real-data outcome: the model's *sharpest* claim held,
and the data taught a refinement (regime, not season). The note's falsifiable
paragraph and the outreach draft were updated to state exactly this; the test's
"wet flatter" framing (docstring + `stratified()` header) was corrected to the
regime reading. The per-year binary "reading:" verdict is a crude threshold and
is not the evidence — the effect sizes above are.

## Still open

- **B10 unexercised:** no corner in the box stalls, so the "stalled honestly"
  path has no test. Reachable only by breaking the solver deliberately.
- **The PLD run is DONE (2021–2025, above) but is EXPLORATORY, not a clean test.**
  Adversarial review (2026-07-20) established why it cannot cleanly confirm or
  reject, and the note/outreach were downgraded accordingly:
  (i) PLD horário is an **administered price** — the capped/floored CMO from the
  official DESSEM dispatch model, not a market-cleared price. In hydro-marginal
  hours the CMO *is* the official water value (custo de oportunidade da água),
  which that model constructs to move slowly — so "flat on hydro-marginal
  windows" partly reflects the price's own construction, not an independent market
  fact. (ii) The permutation null shuffles hours, so its "shrinkage" measures
  temporal **persistence**, not water-value pinning specifically; a
  persistence-matched surrogate is the right null and was not made
  publication-grade here. (iii) Interior windows are **selected** to be non-extreme
  and **split at jumps**, so "flat with jumps" is partly circular. (iv) The
  window-level martingale is a low-power **non-rejection** (as few as 15 windows in
  2023). What survives all four honestly is a **descriptive consistency**: real
  hydro-marginal windows are flat and the price level steps between them, matching
  the model's qualitative structure — reported as such, not as a hypothesis test.
- **Stochastic T3** (reflected-FBSDE) and the **A1 reflecting-boundary duality**
  remain the genuine open mathematics. *(Sharpened 2026-07-21: the DISCRETE-TIME
  content of stochastic T3 is now proved — see below; what remains open is the
  continuum limit.)*

## The water-value LPs — two label upgrades by LP duality (2026-07-21)

Both halves of B1's remaining caveats were closed in discrete time, where the
problems are finite LPs and KKT needs no constraint qualification. Proofs in
Spec v0.3 §B; solvers + certificates: `research/stock-constraint/tools/water_value_lp.js`,
`research/stock-constraint/tools/water_value_tree.js`, battery
`research/stock-constraint/tests/test-water-value.js` (in `make check`). The solvers follow the Wardrop flow→polish doctrine: the solve
is a guess, the certificate (primal feasibility + trichotomy + jump/wedge
signs + complementary slackness + ZERO duality gap) is the proof, instance by
instance.

- **B1-det(b) discrete time: PROVED.** w piecewise constant, jumping up only
  across full-reservoir events, down only across empty events; segment-wise
  the (a)-theorem. Certified: 200/200 random instances, worst gap 6.1e-16,
  170 exercising the barriers; revenue dominance over 500 exact-endpoint
  feasible dispatches; mutants caught.
- **B1-stoch discrete time (scenario trees): PROVED.** w_n = E[w_child|n] at
  every interior-stock node — the martingale between constraint events —
  with w = 0 at spilling nodes (A2's floor-spill as a dual complementarity).
  Certified: 120/120 random trees, worst gap 1.3e-14, worst off-binding
  martingale residual 3.9e-13; binding, spill and pure-martingale trees all
  exercised. The PLD empirical layer tests exactly this discrete statement.

Failure catalog additions (paid for during the build; each was caught by the
certificates going red, which is the system working):

- **A stochastic reservoir model without spill is infeasible** at
  full-reservoir states with large inflows. The first tree demo went red
  (gap 1.2e-2) because the LP literally had no feasible point in a corner
  the sweep visited. Physics completed the model: spill ≥ 0, and its dual
  complementarity (spill > 0 ⇒ w = 0) is the floor-spill regime of A2.
- **A global argmax + clamp is NOT a windowed max** when the function's
  domain is extended beyond the feasible set: the −ϖR' term made a spurious
  global peak in the negative extension region and the forward pass released
  where storing was optimal (gap 7e-4, a real suboptimality). Decisions must
  maximize over the feasible window directly; extensions exist only for
  derivative extraction.
- **Truncating a value function's domain at the state bound artificially
  widens its superdifferential at the edge** (one-sided ∞), admitting
  invalid duals — parents at full/empty reservoirs pass edge entries, and
  the dual distribution overshot (44/120 red). LP value functions are
  defined past the physical bound (the node spills/releases the excess);
  extend the domain so realized entries are interior and the two-sided
  derivatives are true.
- **Per-node local dual choosers do not reconcile globally** under
  degeneracy. The valid construction: w_n ∈ ∂V_n(entry) (exact PL value
  functions), selected TOP-DOWN with the parent's wedge rule fixing the
  continuation target and water-filling distributing it over the children's
  superdifferential intervals. LP parametric duality guarantees a consistent
  selection exists; the certificates verify the one chosen.

## The literal discrete KKT — closed at the agent level (2026-07-21, later session)

The A1 status's last deferred clause is done. Three measured facts
(`mfglab.continuum`, certified in `mfg-lab/python/tests/test_continuum.py`):

- **The lab's time-staggering breaks the discrete duality at O(Δt).** With the
  semi-implicit convention (HJB freezing controls from u^{t+1}, FP from u^t —
  the mfg-lab convention inherited by `solve_field_upwind`), the telescoping
  identity ⟨u⁰,m⁰⟩ = ΣΔt⟨src,m⟩+⟨Ψ,m^NT⟩ fails at 5.4e-3 and the control
  stationarity at ~1e-3. Not a bug — a property of the staggering, now
  measured and mutation-pinned.
- **The fully-implicit within-slice iteration restores exactness.**
  `solve_field_implicit` iterates α = α(u^t) to self-consistency inside each
  backward slice (converges in a few inner iterations) and uses the SAME α in
  the FP step. At its solved market equilibrium: telescoping 5.6e-17; central-
  difference gradient of the discrete objective ≤ 3.9e-10 over all 344
  interior interfaces (the FD truncation floor at h=1e-6, not the scheme);
  0 sign violations at the 16 clamped interfaces; all equilibrium
  certificates intact (mass 3.0e-15, clearing 2.2e-16, T3 flatness exactly 0
  on 10 marginal hours).
- **Scope, stated exactly:** what is certified is that the agent-block
  equilibrium is a literal stationary/KKT point of the discrete control
  objective at the equilibrium price. The full A1/A2 program's KKT system is
  now covered block-by-block (agent: this; hydro: Theorem B1-det's LP KKT;
  band: the clearing complementarity certificates); the continuum
  reflecting-boundary duality stays OPEN (OP-2).

## The regime-conditioned PLD test (2026-07-21) — A2's regime map vs real data

`research/stock-constraint/tests/pld_regime_test.py`: NE hourly PLD 2025 (CCEE, on disk) against
the ONS COFF hourly index (NE constrained-off energy, GWh; months 01/05/06/09
of 2025). Findings:

- **The binary test is DEGENERATE and the degeneracy is informative**: the NE
  cuts something in essentially EVERY hour of these months (base rate 1.000)
  — "any curtailment" carries no regime information. First formulation went
  red; kept in the script as the finding it is.
- **Magnitude-conditioned, the model's direction appears where its mechanism
  governs**: P(price at floor | hourly cut > x) is flat ≈ 0.50 for x ≤ 2 GW
  and rises to 0.62 (x > 4 GW) and 0.71 (x > 6 GW); mean cut at floor is
  1.58× off-floor while MEDIANS are equal (1.89 vs 1.84). Reading: the
  base-load of small cuts is the network/local class (CNF/REL) the model
  excludes and declares excluded; the LARGE, systemic cuts are the ones that
  co-occur with the floor regime — which is exactly A2's claim, restricted
  to the class the model claims. Directionally supportive, honestly partial.
- Caveats stand: administered price; 4 months; conditional rates, not a fit.
  Next sharpening: split the COFF index by reason class (CNF/ENE vs REL) and
  re-run the conditional — the model predicts the class split IS the
  explanation; also extend the index to all 12 months.
