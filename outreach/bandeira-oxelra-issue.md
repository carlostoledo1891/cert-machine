# New issue on Oxelra-AI/Bandeira-0.2a-open-source — POSTED 2026-10-15 ~05:00 UTC on the operator's "after push live send create the github issue. All approved."

https://github.com/Oxelra-AI/Bandeira-0.2a-open-source/issues/1 (issue #1; the paste block below, verbatim). Pre-send checks all passed at posting: page live with the five rows, repository at c4137344 with no issue, the Lean "still building" sentence kept.

Opens a new issue (the repository has issues enabled and none open; pinned commit c4137344). Every number is a field of
certs/bandeira-ledger.json — re-run `python3 -I tools/run-bandeira-ledger.py` and re-read the page before posting. Post
ONLY on the operator's word:
`gh issue create -R Oxelra-AI/Bandeira-0.2a-open-source -t "<title>" -F <paste block>`, then SEND-QUEUE + GITHUB-OUTREACH.

Pre-send checks:
- [ ] reports/bandeira.html LIVE at https://carlostoledo.co/reports/bandeira.html with the five rows as below
- [ ] the Lean lane: either lean-build.json recorded and the paragraph below updated, or the "still building" sentence kept
- [ ] the repository re-read: no new commit since c4137344, no issue opened meanwhile

Title: Independent exact re-check of the disproof: the SOS SDP is infeasible at λ = 120 (our own certificate); two notes on what your certificate and your Lean decide

---- PASTE BELOW THIS LINE ----

We re-checked the finite core of the disproof independently — the semidefinite program built from Lai–Lim's definition in exact rational arithmetic, with no code from this repository in the trust path — and the conclusion stands: Lai–Lim's degree-2 sum-of-squares SDP at (m, n) = (5, 5) is infeasible at λ = 120, so λ₂ > 5! and Bandeira's inequality (a) fails for n = 5 (with the Positivstellensatz step cited, as your paper cites it). The record, the certificate and the verifier are at https://carlostoledo.co/reports/bandeira.html and in github.com/carlostoledo1891/cert-machine (`instruments/bandeira/`, `corpus/bandeira/`).

Two things came out of the re-check that you may want to know about, both sitting exactly at the boundary your paper declares external (the identification of C_i and b with Lai–Lim's SDP).

**1. Your certificate certifies the SDP without the basis transposes.** Lai–Lim write the Gram side as tr(β X_i βᵀ Y_i) with β the column of basis monomials; a noncommutative square is fᵀ X_i f = Σ u_a u_b β_aᵀ X_i β_b, so the first basis monomial is reversed (X₁X₂ ↦ X₂X₁), which the notation carries silently. `lailim_sdp.py` forms `beta_j * X_i * beta_k` with no reversal (`beta_Xi_beta_T_polys`). We decided your certificate (y₀ = −146/2061, the 3,906 multipliers read inertly from `certified_block_farkas_v2_den10000.npz`) under three conventions:

| convention | m₀₀ | scalar 120·y₀ + bᵀy | six blocks positive definite | verdict |
|---|---|---|---|---|
| no transpose (your builder) | −1060/20438937 | 1417280/1417281 | yes — smallest pivots equal to your `certified_block_farkas_v2_den10000_verified.txt` | holds |
| left transpose (fᵀ X_i f) | same | same | no | fails |
| right transpose | same | same | no | fails |

The scalar and m₀₀ do not depend on the convention (the distinct 5-words and the empty word are reversal-invariant); the blocks do. In floating point the two programs have the same optimum on every case of Lai–Lim's Table 1 and at (5,5) — 144.6488 under both — so this looks like a statement about which program the published certificate belongs to, not about the theorem; whether the two programs are equivalent in general we did not decide. To close it from our side we found a certificate for the sum-of-squares form directly: y₀ = −1, denominators ≤ 10,000, m₀₀ = −19/8568, scalar = 1, all six blocks positive definite by exact LDLᵀ (`corpus/bandeira/certificate-cm.json`; the float search that proposed it is `certify.py`, the only authority is `verify.py`, with a second implementation in BigInt JavaScript agreeing on every pivot). You are welcome to it.

**2. What the Lean proves.** Reading `Formalization/` at c4137344: the files prove (−M) ⪰ 0 for your matrices (`negM_full_posSemidef`, from the six LDL block assemblies), the abstract scalar Farkas contradiction, and the two `IsEmpty` theorems (`no_lailim_feasible_from_certificate_semantics`, `no_native_farkas_feasible`). Those two are over structures whose fields assume the standard-form pairing (`pairM = y0 * c0 + lin`), the cone inequality or `(-M).PosSemidef`, `c0 ≤ 120` and the scalar inequality; `negM_full_posSemidef` is not supplied to either, nothing imports `AllBlocksFarkasChain`, and no SDP is defined in Lean — the docstring in `SDPFarkasSemantics.lean` says the adapter remains to be filled "from the actual generated theorem families rather than by assumptions". So Lean checks the certificate's arithmetic (which we also re-derived, exactly) and not the infeasibility of a Lean-stated program. That matches your "Formalization boundary" section; the abstract's "machine-checked verification of the entire certificate" and the overview's "SDP infeasibility semantic bridge" read as more. (Smaller: `Tests/UnformalizedDependencies.lean` still lists the spectral-norm power identity as unformalized while `Core/SpectralNormPSD.lean` proves it.) We are building the default target at your pins and will add the kernel's axiom list for the four main theorems to the page when it finishes.

Two questions, if you have a moment: is the no-transpose Gram form the one you intend (your Lean rows are generated from the same C_i, so a fix would touch both), and would you like the sum-of-squares certificate above added to your repository under your own verifier? Either way, the disproof holds under the sum-of-squares form by the certificate above, and we have said so on the page.

Carlos Toledo — https://carlostoledo.co · carlos@carlostoledo.co
