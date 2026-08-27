# SIN-MFG v0.3 — The Regulated Market as a Monotone Variational Inequality

## Delta document over v0.2. Status of every result is labeled:
## [SKETCHED] = proof strategy written, gaps identified; [OPEN] = honest gap.
## Nothing here is claimed as a completed theorem.

---

## A. Answer to Q1′ — the variational structure and the band VI  [SKETCHED]

**Proposition A1 (potential structure of Model A).** Under: u(c) concave
with satiation (u′(c)=0 for c ≥ c̄), C_th convex, quadratic storage cost,
linear dynamics for x and R with box constraints — the equilibrium system
of v0.2 §4 is the KKT system of the convex program

  min over (m, w, q, h, κ, d, c-field)  of
  ∫₀ᵀ [ ∫ |w|²/(2m) η dx  −  ∫u(c)dμ dm  +  C_th(q) + ϖ^def d ] dt
  − ∫Ψ dm_T − V_T(R_T)

subject to: ∂_t m − ½σ²∂_xx m + ∂_x w = 0 (zero-flux); balance with
κ, d ≥ 0; dR = (I−h)dt − dU, R ∈ [0,R̄], h ∈ [0,h̄].

*Proof strategy, and its rigor boundary sharpened (2026-07-20).* Benamou–Brenier
change of variables (m, α) → (m, w = mα) makes the kinetic term jointly convex;
all remaining terms are convex; constraints are linear. Fenchel–Rockafellar
duality identifies the balance multiplier with ϖ and the box multipliers with the
regime complementarities. This convexity structure is standard and essentially
rigorous at the level of the **continuum** functional (the variational-MFG
framework of Lasry–Lions / Cardaliaguet); the genuine continuum gap is the
duality argument in function spaces **with the reflecting boundary** — that stays
[OPEN].

**A correction to the previous "discretized statement near-complete" claim.**
The direct-method route "our numerics live there anyway" is more subtle than
v0.2 assumed, and the subtlety is the same one the benchmark's own certificate
check surfaced (FINDINGS_SIN.md Defect 4). The KKT of the discretized
Benamou–Brenier program is **self-adjoint** — the discrete transport and its
adjoint coincide. The kernel this page actually runs uses an **upwind** flux for
the Fokker–Planck transport (chosen for positivity, verified strict) against a
**centered** HJB drift; measured, these are **not** discrete adjoints (relative
defect ≈ 1.0 at every slice, machine-zero only for the diffusion part). Therefore
the discrete system the code solves is a **consistent, positivity-preserving
approximation** of the convex-program KKT — *not literally its KKT*. Claiming the
discrete equilibrium "is" the KKT of the discrete convex program would be false
for this scheme, and the certificate discipline is what caught it.

Honest status, then: the continuum convex structure is rigorous modulo the
reflecting-boundary duality [OPEN]; an *exact* discrete KKT statement requires the
transport to be **adjoint-matched** — FP = HJBᵀ, block-symmetric — which is
exactly the **monotone scheme of Achdou–Capuzzo-Dolcetta**: an upwind HJB whose
linearization's exact transpose *is* the FP operator, positivity-preserving and
adjoint-matched at once (this is *not* "self-adjoint", A = Aᵀ; and it is *not*
centered — centered transport is what breaks positivity and is why the kernel
went upwind). The present kernel's *diffusion* is already adjoint-matched; it
breaks the match only in the transport, by pairing a **centered** HJB gradient
with an **upwind** FP. Swapping the HJB to the upwind/monotone form and taking
its exact transpose recovers the exact discrete KKT with no exotic scheme — a
known road, not a research gap. (The continuum-lab tabs already run this matched
pair, certified by an operator-level transpose check.)

**Status update (2026-07-21): the matched pair for THIS model is built and
certified, headless.** `research/stock-constraint/tools/continuum_reference.js` implements the
Achdou pair for the clamped, price-shifted, constant-η storage Hamiltonian —
shared frozen interface velocities α_f = clamp((s_f−ϖ)/η, ±ᾱ), donor-cell FP
flux, generator-form upwind HJB, the symmetric reflecting diffusion folded into
one implicit tridiagonal per slice. `research/stock-constraint/tests/test-transpose-sin.js`
certifies (in `make check`): |M_FP − M_HJBᵀ|/scale = 0 exactly, including at
clamped interfaces (the transpose is algebraic in α±, so the clamp does not
break it); mass conservation as an *adjoint identity* (1ᵀM_FP = 1ᵀ ⇔ M_HJB𝟙 = 𝟙,
2e-16); strict M-matrix ⇒ positivity with no CFL sub-stepping (trajectory run at
CFL 1.2 in single implicit steps, mass drift 2.4e-15); mutation-tested (dropping
the sign-split or the clamp is caught at O(1)). Scope, stated exactly: this is
the **operator-level** certificate. The **system-level** statement — that a
solved equilibrium of the matched scheme is literally the KKT point of the
discrete convex program — is the mfglab continuum-port milestone (§G), not yet
claimed. The shipped note keeps the centered scheme by choice (its numbers are
the validated ones; the matched scheme's numerical diffusion ≈ ½|α|hx is up to
~9× the physical ν at NX=16, so its equilibria differ and would need their own
validation pass); the note's "not literally its KKT" disclosure stands and is
anchored by the battery.

What the benchmark exercises most directly — the
deterministic hydro layer's KKT (the water value as the budget multiplier) — is
separately **proved** (Theorem B1-det). [A1: continuum structure standard;
reflecting-boundary duality OPEN; exact discrete KKT: **CLOSED at the agent
level (2026-07-21)**. The adjoint-matched operator pair is certified at the
operator level (test-transpose-sin.js, defect 0 exactly), and the
fully-implicit within-slice variant (mfglab.continuum.solve_field_implicit)
reaches an equilibrium that is CERTIFIED to be a literal stationary/KKT point
of the discrete control objective: the duality telescoping identity
⟨u⁰,m⁰⟩ = Σ_t Δt⟨src_t, m^{t+1}⟩ + ⟨Ψ, m^{NT}⟩ holds to 5.6e-17, the control
gradient vanishes over all 344 interior interfaces to the finite-difference
floor (3.9e-10 at h=1e-6 — the scheme's true gradient is zero), and the KKT
inequality signs hold at every clamped interface (kkt_point_residual, in the
pytest battery, mutation-tested: the semi-implicit staggered freeze breaks
the identity at O(Δt), measured 5.4e-3 — which is WHY the within-slice
iteration is required). Combined with the hydro layer's LP KKT (Theorem
B1-det, proved) and the certified band complementarities, each block of the
A1/A2 discrete KKT system is now individually certified; the continuum
reflecting-boundary duality remains the open gap (OP-2).]

**Proposition A2 (the band VI — the Brazilian object).** With an
administrative price band ϖ_t ∈ [ϖ_min, ϖ_max] (ANEEL's PLD floor/cap —
exogenous, not welfare-derived), the equilibrium is no longer a minimizer.
It is the solution of the variational inequality

  find z* ∈ K :  ⟨F(z*), z − z*⟩ ≥ 0  ∀z ∈ K,

where z collects (m, w, q, h, κ, d), K is the polyhedron of constraints
including the band, and F is the KKT field of A1. F is **monotone**
(gradient of a convex functional plus the band projection), strictly so in
the aggregate directions.

*Consequences.* Existence and uniqueness of aggregates by classical
monotone-VI theory; the welfare gap of the band, G(band) ≥ 0, computable —
the deadweight cost of the administrative floor/cap becomes a model output
(the kind of number ANEEL debates every December — here as a *formulation* output
on stylized units, not a Brazil figure; calibration is deferred). *Gap:* the
correct rationing rule inside the floor regime (who gets curtailed) must be
specified institutionally, not mathematically — it changes distribution,
not aggregates. [SKETCHED]

**Boundary structure (discovered by the certificate sweep, now part of
A2).** The benchmark's 64-corner parameter sweep exposed two
degenerate-dual cases the three-regime statement omitted, both now
specified and implemented:
- **Floor-spill:** when the hydro energy budget cannot be absorbed even at
  the price floor, the budget equality is infeasible; the physical
  resolution — surplus water spills — makes it an inequality with
  complementarity (spill > 0 only at w pinned to the floor), reported
  explicitly by the dispatch.
- **Cap-mixed:** when the water value's interior level exceeds the cap,
  tot(w) is discontinuous at w = cap (sell vs withhold) and the budget can
  sit inside the jump. At w = cap hydro is exactly indifferent; the
  equilibrium is a MIXED dispatch — fraction theta of the indifferent
  volume runs, chosen to close the budget — the classical resolution of a
  dual kink, and precisely the set-valued boundary behavior the VI
  formulation must carry.
- A third, measure-zero degeneracy (slice-price plateaus where demand
  satiates, thermal caps, and the fleet clamps simultaneously): prices
  set-valued on a null set, aggregates unique — the same species as the
  Wardrop tab's split non-uniqueness.
Regime count is therefore five; Prop. A2's uniqueness claim is for
aggregates across all five. Found by certificates, not foresight.

**Remark (honest deflation, preempted).** A1 says Model A is a potential
game — "just" convex optimization in disguise. Three answers: (i) the band
VI (A2) is not; (ii) the common-noise version is a *conditional* VI per
path of B — a stochastic VI, where the variational structure is a tool,
not a triviality; (iii) Model B (strategic hydro) breaks potentiality
outright. The potential core is a feature: it is why certificates and
uniqueness are provable at all.

## B. Answer to Q2 — the adjoint-martingale principle

The deterministic case — the one the benchmark runs and certifies to machine
zero — is now **proved** (Theorem B1-det). The stochastic case remains a sketch,
with the gap stated precisely (Proposition B1-stoch).

**Theorem B1-det (deterministic water value — interior and bounded reservoir).**
Fix an equilibrium price path ϖ ∈ L^∞([0,T]). The price-taking hydro allocates a
fixed energy budget E to maximize revenue:

  max_h  ∫₀ᵀ ϖ_t h_t dt   s.t.   Ṙ_t = I_t − h_t,  R_0 fixed,
                                  0 ≤ R_t ≤ R̄,  0 ≤ h_t ≤ h̄,  ∫₀ᵀ h_t dt = E.

*(a) Interior-reservoir case (0 < R_t < R̄ throughout).* There is a **constant**
w — the water value — such that at a.e. t,

  ϖ_t > w ⇒ h_t = h̄;   ϖ_t < w ⇒ h_t = 0;   0 < h_t < h̄ ⇒ ϖ_t = w,

and w is the unique root of the budget map H(w) := ∫₀ᵀ h_t(w) dt = E. In
particular **ϖ_t = w on every hydro-marginal (interior-release) hour.**

*Proof.* The feasible set is convex and the objective linear, so the KKT
conditions are necessary and sufficient. With the stock constraints slack by
assumption, attach a single scalar multiplier w to the budget ∫h = E and
pointwise multipliers μ_t ≥ 0 to h_t ≥ 0 and ν_t ≥ 0 to h̄ − h_t ≥ 0.
Stationarity in h_t reads ϖ_t − w + μ_t − ν_t = 0 with complementary slackness
μ_t h_t = 0, ν_t(h̄ − h_t) = 0. Reading the three cases off these identities:
0 < h_t < h̄ forces μ_t = ν_t = 0, hence ϖ_t = w; h_t = 0 gives μ_t = w − ϖ_t ≥ 0,
hence ϖ_t ≤ w; h_t = h̄ gives ν_t = ϖ_t − w ≥ 0, hence ϖ_t ≥ w. The budget map
H(w) = ∫ h̄·1{ϖ_t > w} dt (with any value in [0,h̄] on the measure-zero tie set
{ϖ_t = w}) is nonincreasing, so H(w) = E pins w; the tie set is where the
mixed/plateau degeneracies of A2 live. ∎

This is *exactly* the **hydro dispatch** rule (`clearSlice`'s withhold / marginal
/ full branches) and the dispatch's bisection on w. Note the identification is
with the hydro dispatch trichotomy h = 0 / 0 < h < h̄ / h = h̄, **not** with the
demand-side "three regimes" of A2 (curtailment / interior / scarcity): those are
the administrative-band saturations (κ > 0 at the floor, d > 0 at the cap), set by
the balance and the band, a separate mechanism the water-value KKT does not
govern. The benchmark verifies each line of the hydro KKT to machine zero:
`test-sin.js` A8 (ϖ_t = w on hydro-marginal hours, max |ϖ−w| = 0 over 2692
marginal hours across 324 corners), A9 (the complementarity ϖ<w⇒h=0, ϖ>w⇒h=h̄,
worst 0), A12 (the budget map is monotone in w so the root is well-posed). The
theorem is not decoration — it is the statement those certificates check.

*(b) Bounded-reservoir case.* On any maximal interval where 0 < R_t < R̄, the
Hamiltonian sees R only through the (inactive) box constraints, so the
state-constrained Pontryagin costate p_t has zero drift and is **constant = w**
there; at a time τ where R hits 0 or R̄, p may jump by the boundary
measure-multiplier increment. Hence w is **piecewise constant, jumping only at
stock-constraint events**, and (a) applies on each interval. This is the standard
maximum principle with pure state constraints (Hartl–Sethi–Vickson survey). It is
*not* written out here, and it carries hypotheses that must be verified rather
than assumed: a first-order state-constraint qualification / boundary
controllability, and normality (non-degeneracy) of the multiplier — usually fine
for this control-affine R∈[0,R̄], but they can fail (abnormal multipliers,
higher-order boundary arcs). Not exercised by the current benchmark, which runs
the interior case by construction (a single constant w).

**Discrete time: (b) is a theorem (2026-07-21).** On the hourly grid the
benchmark actually runs, the problem

  max Σ_t ϖ_t h_t  s.t.  R_t = R_{t−1} + I_t − h_t,  0 ≤ R_t ≤ R̄,
                         0 ≤ h_t ≤ h̄,  R_T = R_end (⇔ the budget)

is a **finite LP**, where KKT is necessary and sufficient with **no
constraint qualification** — every PMP caveat above dissolves. *Proof.* Let
w_t be the multiplier of the t-th balance, μ_t, ν_t ≥ 0 the release-box
multipliers, α_t, β_t ≥ 0 the stock-bound multipliers. Stationarity in h_t
reads ϖ_t − w_t + μ_t − ν_t = 0 with complementary slackness — the Hotelling
trichotomy against w_t. Stationarity in R_t (t < T) reads w_{t+1} = w_t − α_t
+ β_t with α_t R_t = 0, β_t(R̄ − R_t) = 0. Hence **w is piecewise constant,
jumping only at stock-binding events — up across a full-reservoir event, down
across an empty event** — and on each maximal interior interval the argument
of (a) applies verbatim with the interval budget. Strong duality closes it:
Σϖ_t h_t = w_1R_0 − w_TR_end + Σw_tI_t + ΣR̄(Δw)⁺ + Σh̄(ϖ−w)⁺. ∎
Certified live: `research/stock-constraint/tools/water_value_lp.js` (active-set solve in the
Wardrop-polish pattern) + `research/stock-constraint/tests/test-water-value.js` in `make
check` — the certificate IS the proof instance-by-instance (primal
feasibility, trichotomy, jump signs, complementary slackness, zero duality
gap; 200-instance random sweep certified with worst gap 6.1e-16, 170/200
exercising the barriers; independent revenue-dominance witness over 500
exact-endpoint feasible dispatches).
[(b) continuous time: STANDARD — state-constrained PMP, CQ/normality to
verify, not written out. (b) discrete time — the statement the benchmark
exercises: **PROVED**, finite LP duality, certified.]

**Proposition B1-stoch (stochastic water-value martingale).** With common noise
B and reflecting reservoir dynamics, the costate w_t of R along the equilibrium
satisfies

  dw_t = Z_t dB_t + dL⁰_t − dL̄_t,

with L⁰, L̄ nondecreasing and flat off {R = 0}, {R = R̄, h = h̄}: w is a
**martingale between constraint events**, and ϖ_t = w_t on hydro-marginal windows
so the price inherits the property there.

*Proof strategy and the one remaining gap.* The drift of w is −∂_R H, and the
Hamiltonian sees R only through the box constraints — the mean-field coupling
enters H solely via the price ϖ, which the price-taking hydro takes as given and
which does not depend on R. So off the constraints the drift vanishes and w is a
local martingale; the constraint local times supply dL⁰, dL̄. This is the exact
stochastic lift of Theorem B1-det(b), and the reason it should survive the
coupling is now explicit (∂_R ϖ = 0). **Gap:** well-posedness of the reflected
FBSDE for (R, w) under the mean-field fixed point — existence/uniqueness of the
adjoint through the coupling — is not established here; it is the deferred
stochastic-version task.

**Discrete time on scenario trees: the martingale statement is a theorem
(2026-07-21).** On a finite scenario tree (node n, probability p_n,
conditional child probabilities q_c), with releases h_n ∈ [0,h̄], spill
s_n ≥ 0 (without spill, full-reservoir states with large inflows are
infeasible — the model's own certificate found this), stock
R'_n = R^in_n + I_n − h_n − s_n ∈ [0,R̄], and linear salvage φR' at the
leaves, the hydro problem is the finite LP
max Σ p_n ϖ_n h_n + Σ_leaves p_l φ R'_l. *Proof of the martingale.* With
p_n w_n the multiplier of node n's balance: stationarity in h_n gives the
trichotomy of ϖ_n against w_n; stationarity in s_n gives w_n ≥ 0 with
s_n > 0 ⇒ w_n = 0 (marginal water at a spilling node is worthless — Prop.
A2's floor-spill regime reappearing as a dual complementarity); stationarity
in R'_n, which appears in node n's balance and in each child's, gives
p_n w_n = Σ_c p_c w_c + α̃_n − β̃_n with α̃ ⟂ R'_n ≥ 0, β̃ ⟂ R'_n ≤ R̄; dividing
by p_n:

  **w_n = E[w_child | n]  at every node with interior post-release stock** —

the water value is a martingale between stock-binding events, stepping down
across full-reservoir events and up across empty ones, the exact
discrete-time content of dw = Z dB + dL⁰ − dL̄. ∎ Certified live:
`research/stock-constraint/tools/water_value_tree.js` (exact piecewise-linear-concave DP for
the primal; duals by superdifferential selection of the value functions,
distributed top-down) + `research/stock-constraint/tests/test-water-value.js` in `make check`
(zero duality gap ⇒ optimality with no CQ; 120-tree random sweep all
certified, worst gap 1.3e-14, worst off-binding martingale residual 3.9e-13;
binding, spill and pure-martingale trees all exercised; mutants prove the
gates go red). *Lineage, stated plainly:* water values and their martingale
behavior are classical in hydro scheduling (SDDP/Pereira–Pinto lineage) and
commodity-storage economics; what is claimed here is the precise tree-LP
statement, its one-paragraph duality proof, the machine-precision
certificate, and the composition with this model (the same w is the price on
hydro-marginal windows, and the PLD empirical layer tests exactly this
discrete statement on hourly data).

[B1-stoch status, split: deterministic lift PROVED (B1-det); **discrete-time
scenario-tree martingale PROVED** (LP duality, certified); continuum
reflected-FBSDE well-posedness through the mean-field coupling OPEN — that
is the remaining gap, stated as OP-1 in OPEN_PROBLEMS.md.]

*Prior art, stated plainly:* marginal-storage-value martingales are
classical in commodity-storage economics (Hotelling-under-uncertainty
lineage) and hydro-scheduling practice. The claims made here are the
composition: (i) the statement inside an MFG equilibrium with mean-field
feedback; (ii) its use as a pathwise machine-precision certificate;
(iii) its use as an empirical test on hourly PLD (drift of estimated w on
detected hydro-marginal windows ≈ 0; deviations flag constraint events or
model misspecification).

**Organizing principle B2 (the certificate heuristic — a framing, not a theorem).** GGR's
Lemma 3.1 (Π a martingale, the engine of the ϖ+Π+cQ invariant verified at
~5e−15 in the lab) and B1 are instances of one mechanism: *an adjoint
process whose drift vanishes because the Hamiltonian does not see the
paired state directly.* We therefore organize all model certificates under
one principle:

  **most certificates are a constraint residual or an adjoint martingale.**

[NARROWED 2026-07-21, adversarial review] This was written with "every", and
the certificate panel falsifies the universal: the exploitability ε is an
independent optimality gap from a separately coded DP best response, and is
neither. Four classes are actually in play — constraint residuals,
complementarity/feasibility checks, adjoint identities and martingales, and
independent optimality gaps. Whether they are one calculus or distinct
certificate geometries is [OPEN], and the honest guess is distinct.

Residuals: mass of m, clearing per slice, Kirchhoff (network layer), band
complementarity. Adjoint martingales: Π (GGR), w (B1). Conjecture C:
price-formation MFGs with linear state dynamics admit a systematic family
of adjoint invariants (the "certificate calculus"); two instances are in
hand; the general recipe is [OPEN] and is offered as a shared research
question — the one place v0.3 still asks instead of answers, deliberately.

## C. Answer to Q3 — uniqueness across regimes  [SKETCHED]

Within the VI frame of A2, regime boundaries need no special treatment:
strict monotonicity of F in the aggregate directions gives **global
uniqueness of aggregates** — prices, total flows, the regime path —
directly from monotone-VI theory; complementarity switching is native to
the formulation. Viscosity/smooth-fit analysis is demoted to what it is:
a *regularity* study of the free boundaries (when regimes switch, and how
smoothly), valuable, separate, optional. [SKETCHED for the discretized
system; continuum regularity OPEN]

**Predicted degeneracy (already observed once).** Where strict
monotonicity fails across exchangeable agents, aggregates remain unique
while decompositions do not — precisely the Scenario-1 phenomenon of the
Wardrop tab (split moves O(1–10), totals fixed at 1e−13). The model
predicts its recurrence for identical storage cohorts; the certificate
suite must therefore test aggregate uniqueness, never decomposition
uniqueness. The lab has, in effect, already run this theorem's
demonstration on a different instance.

## D. The algorithm — HRF on the national market  [design; validation pending]

The discretized deterministic benchmark is a finite-dimensional monotone
VI on a polyhedron: nonnegative variables (m ≥ 0, κ, d ≥ 0), box variables
(h, R), linear equality constraints (discrete FP in flux form; balance;
reservoir). This is the object class of Bakaryan–Aoun–de Lima Ribeiro–Hovakimyan–
Gomes (arXiv:2504.16028). Consequently:

- **Solver:** Hessian–Riemannian flow with entropic metric on the
  nonnegative variables (positivity by geometry; the linear constraints
  conserved identically along the flow — the Kirchhoff property, now
  playing the role of discrete mass + balance conservation), time-stepped
  under the lab's merit rule (VI gap non-increasing), finished by the
  active-set Newton polish. The entire Tab 07 machinery, promoted from a
  15-edge network to the national market.
- **Fallback/cross-check:** the potential structure (A1) admits direct
  convex solvers; agreement between the convex solution and the HRF
  solution to machine precision is itself a certificate (two independent
  routes to one equilibrium).
- **Honest unknowns:** scaling of the metric solves at 1e4–1e5 variables
  (the K D Kᵀ systems are large but sparse and structured); step-count
  behavior of the merit-ruled flow at this scale; both to be measured in
  the headless benchmark, not asserted. And the lab's own duel result
  stands as a warning label: a tuned projected/proximal method may win raw
  step counts — if it does on this problem too, we publish that, and the
  HRF case rests where it survived measurement before: exact constraint
  preservation and the geometric guarantee.

## E. Revised claim set for the paper

1. The regulated-market VI formulation (A1+A2) — the administrative price
   band as a first-class mathematical object; Brazil's institutional
   design, formalized.
2. The certificate principle (B2) with two proven-instance targets (Π, w)
   and the PLD martingale test — theory, numerics, and data in one
   statement.
3. Aggregate uniqueness across regimes via monotonicity (C), with the
   decomposition-degeneracy honestly characterized.
4. HRF *proposed* as the national-market solver (D) — a 15-edge Wardrop tab
   exists and is certified; the national-scale implementation and its
   validation are the next milestone (§G1), not a completed result.
5. Calibration + counterfactuals (G(τ), G(band), fleet comparative
   statics) — unchanged from v0.2 §6 T2/T4.

Lineage note for the economics reader: T3's flat-when-interior /
spike-at-constraint pattern is the hydro-MFG incarnation of rational
commodity-storage price theory (Scheinkman–Schechtman; Deaton–Laroque) —
cited as ancestry, claimed only in its mean-field, banded, certified form.

## F. What is genuinely still open (kept visible on purpose)

Continuum-limit duality with reflection (A1); adjoint rigor through the
mean-field coupling (B1); the general certificate calculus (Conjecture C);
free-boundary regularity; stochastic-VI formulation under common noise
beyond the regime-wise FBSDE ansatz; HRF scaling; convergence of the
damped Picard iteration (observed, unproven — end-state certificates, not
the path, are the trust object); the periodic-day (cycle) equilibrium
replacing the terminal-condition benchmark. These are the paper's
"future work" section and the natural collaboration surface.

The two deepest items — the stochastic-T3 reflected FBSDE and the
reflecting-boundary duality — are stated at collaborator precision
(statement, hypotheses, known results, exact gap, candidate routes) in
`OPEN_PROBLEMS.md` (2026-07-21).

## G. Next steps to v1.0

1. **Headless deterministic benchmark** (the decisive step): discretize
   A1/A2 small (coarse x-grid × 24h), solve by convex route AND by HRF,
   assert cross-agreement, clearing residuals, B1's piecewise-constant w,
   regime detection. Battery-first, lab convention. This converts v0.3
   from propositions to receipts.
2. **PLD test of B1**: estimate hydro-marginal windows from public data;
   test the martingale property. Cheapest possible external validation —
   and its result is interesting whichever way it comes out.
3. Only then the write-up for the group: the running benchmark, the proved
   deterministic T3, the honest open problems, and Conjecture C offered as a
   shared question.
