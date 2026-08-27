# OPEN_PROBLEMS.md — the genuinely open mathematics, stated precisely

Companion to `SIN_MFG_Model_Spec_v0.3.md` §F ("what is genuinely still open,
kept visible on purpose"). That section lists the open items; this file states
the two deepest ones at the precision a collaborator needs to engage — precise
statement, hypotheses, what is known, the exact gap, candidate routes. These
are the collaboration surface, offered as questions. House discipline applies:
every claim labeled [PROVED] / [STANDARD] / [SKETCHED] / [OPEN]; nothing here
is presented as nearly-done; "question for them, not a hidden gap."

Conjecture C (the certificate calculus, spec §B2) is deliberately NOT
elaborated here: it is kept informal by design — the note poses it as a
discussion question and that is its only public form.

---

## OP-1 · Stochastic T3: well-posedness of the reflected FBSDE for (R, w) through the mean-field coupling

**Status.** [OPEN] in the continuum; sharpened 2026-07-21. The deterministic
lift is [PROVED] (Theorem B1-det, spec §B, including the bounded-reservoir
case in discrete time by LP duality), and the **discrete-time content of the
stochastic statement is now [PROVED]**: on any finite scenario tree the water
value satisfies w_n = E[w_child | n] at every interior-stock node, stepping
only at binding events, with w = 0 at spilling nodes — one page of LP duality
(linear constraints, so strong duality is automatic and no constraint
qualification has to be assumed: a property of finite LPs, not a strength of
the argument), machine-certified
(`research/stock-constraint/tests/test-water-value.js`: zero duality gap, off-binding
martingale residual ≤ 4e-13 across a 120-tree random sweep). What remains
open is exactly the continuum limit — and the tree theorem sharpens the
target: any continuum well-posedness result must reproduce the tree
statement under discretization, so the reflected-FBSDE solution, if it
exists, is the limit of these certified finite objects.

**Setting.** Filtered space carrying the common noise B. A price-taking hydro
operator holds reservoir R with reflecting dynamics

  dR_t = (I_t − h_t) dt − dU_t,   R_t ∈ [0, R̄],   h_t ∈ [0, h̄],

(I the inflow, U the reflection/spill processes at the barriers), allocating a
stochastic energy budget against the equilibrium price ϖ. The price is formed
by the mean-field clearing map of spec §A (the band VI of Prop. A2): ϖ_t is a
functional of the conditional law of the population state given B — exogenous
to the individual price-taker, endogenous to the equilibrium.

**Claimed structure (B1-stoch, [SKETCHED]).** Along the equilibrium, the
costate w_t of R satisfies

  dw_t = Z_t dB_t + dL⁰_t − dL̄_t,

with L⁰, L̄ nondecreasing and flat off {R = 0}, {R = R̄, h = h̄}: w is a
martingale between constraint events, and ϖ_t = w_t on hydro-marginal windows,
so the price inherits the property there. The mechanism is explicit: the
Hamiltonian sees R only through the box constraints, and the coupling enters
only via ϖ, which the price-taker takes as given and which does not depend on
the individual R — so ∂_R ϖ = 0 and the drift −∂_R H vanishes off the
constraints. (The deterministic case of this argument is complete: B1-det.)

**The open problem, precisely.** Prove existence and uniqueness of an adapted
solution (R, w, Z, L⁰, L̄) of the doubly-reflected forward–backward system
ABOVE, jointly with the mean-field fixed point — i.e., with ϖ the equilibrium
price of the full system (band VI + population FP/HJB + clearing), not a
frozen input. Uniqueness is expected for aggregates only (the decomposition
degeneracy of spec §C is predicted to recur).

**Why it is not covered by the standard toolkits.**
- Reflected-BSDE theory (Gegout-Petit–Pardoux lineage; El Karoui et al. for
  doubly-reflected) handles reflection in the BACKWARD component against given
  obstacles; here the reflection is in the FORWARD state, the backward
  component jumps only via the forward constraint local times, and the
  obstacle events {R=0}, {R=R̄} are themselves part of the solution.
- MFG-FBSDE well-posedness (Carmona–Delarue monotonicity conditions) must be
  checked against the band-VI structure: F is monotone (Prop. A2) but only
  strictly in aggregate directions, and the band projection makes the
  coefficients non-smooth exactly at the regimes where the local times act.

**Candidate routes (for discussion, not claims).**
1. Penalize both barriers (soft walls), solve the smooth mean-field FBSDE,
   pass to the limit under the A2 monotonicity — the delicate step is keeping
   the mean-field fixed point through the penalization limit.
2. Master-equation formulation with reflecting boundary in the measure
   argument's support. The v0.2 question to the group stands: which is the
   right architecture here, master equation or reflected FBSDE?
3. Regime-wise reduction with pasting (the P1 ansatz of spec v0.1/v0.2):
   prove well-posedness regime-by-regime with the regime boundaries as free
   pasting interfaces — closest to the numerics, weakest as a general theorem.

**Checkable consequences already in place.** The pathwise certificate (drift
of w between constraint events ≈ 0 at machine precision) is computable in the
benchmark today, and the empirical layer exists (the PLD martingale test,
`pld_martingale_test.py` — exploratory, administered-price caveat per
FINDINGS_SIN). A proof would convert both from consistency checks into
certified instances.

---

## OP-2 · A1's reflecting-boundary continuum duality

**Status.** [OPEN]. The interior convex structure is [STANDARD]
(Lasry–Lions / Cardaliaguet variational-MFG); the discrete side is now
operator-level certified (see below); the continuum duality WITH the
reflecting boundary is the gap.

**Setting.** The A1 convex program (spec §A) over Benamou–Brenier variables
(m, w = mα) on [0, x̄] × [0, T]:

  min  ∫₀ᵀ [ ∫ |w|²/(2m) η dx − ∫u(c)dμ dm + C_th(q) + ϖ^def d ] dt
       − ∫Ψ dm_T − V_T(R_T)
  s.t. ∂_t m − ½σ²∂_xx m + ∂_x w = 0  with ZERO-FLUX boundary
       (−½σ²∂_x m + w = 0 at x ∈ {0, x̄}),  balance, band, boxes.

**The open problem, precisely.** Establish strong duality (no gap) and
existence of the dual multiplier u for this program in appropriate function
spaces, identifying the optimality system with the equilibrium HJB/FP/clearing
system — WITH the reflecting (Neumann/zero-flux) boundary. The specific
obstructions:
- the dual constraint pairs u against the zero-flux condition, so traces of u
  and its normal derivative at x ∈ {0, x̄} must make sense in the chosen
  spaces (m possibly measure-valued, w ∈ L²(dm), u a priori only BV/L²);
- a constraint qualification (interior-point/Slater in the conic sense) must
  hold at the reflecting boundary, where the natural candidate feasible
  points sit ON the boundary of the cone (m ≥ 0 with mass pushed to the
  walls by the drift);
- the band VI of A2 sits on top: the duality must survive the passage from
  minimization to the monotone VI (the multiplier structure of the band).

**What is known.**
- [STANDARD] Interior/torus/whole-space: the variational-MFG duality program
  (Lasry–Lions; Cardaliaguet's weak solutions; Cardaliaguet–Graber-type
  first-order arguments) gives exactly this identification without the
  reflecting wall.
- [PROVED, operator level, 2026-07-21] The DISCRETE side is now adjoint-
  matched and certified for this model's Hamiltonian: FP = HJBᵀ exactly,
  including at clamped controls and at the reflecting boundary rows, with
  conservation holding as an adjoint identity
  (`research/stock-constraint/tools/continuum_reference.js`, battery
  `research/stock-constraint/tests/test-transpose-sin.js`). The discrete program's duality is
  therefore EXACT at every grid resolution — only the limit is missing.

**Candidate routes (for discussion, not claims).**
1. Γ-convergence / discrete-to-continuum: pass the exact discrete KKT of the
   adjoint-matched scheme to the limit as (h, Δt) → 0. The discrete duality
   holds with NO gap at every resolution, so the continuum duality would
   follow from compactness + Γ-liminf inequalities — the reflecting BC is
   built into the discrete operators from the start. This route did not exist
   before the matched pair was built; it is the natural joint project.
2. Direct method in function spaces: adapt the weak-solution duality proofs
   to the Neumann problem (trace theory for the flux pairing; Slater point
   from the strictly-interior stationary density of the σ > 0 problem).
3. Penalized soft walls: replace reflection by a steep confining potential,
   use the interior theory, and pass to the wall limit — the risk is the
   commutation of the wall limit with the duality (and with σ → 0 if taken).

---

## The rest of the §F list (pointers, one line each)

- **Free-boundary regularity** of the regime switches — [SKETCHED for the
  discretized system; continuum regularity OPEN] (spec §C).
- **Convergence of the damped Picard iteration** — observed, unproven;
  end-state certificates, not the path, are the trust object (spec §F).
- **Stochastic-VI formulation under common noise** beyond the regime-wise
  FBSDE ansatz — [OPEN] (spec §F); subsumes OP-1's architecture question.
- **HRF at national scale** — engineering + measurement, not theory
  (spec §D; honest unknowns listed there).
- **Conjecture C** — kept informal by design (spec §B2; the note's
  discussion question is its only public form).

---

*Framing note (house rule).* These problems are offered as questions to the
people whose toolkits they belong to — OP-1 sits in the reflected-FBSDE /
master-equation area, OP-2 in the variational-MFG duality area. Neither is a
blocker for the note, the benchmark, or the empirical layer; both are where
the model's mathematics genuinely ends today.
