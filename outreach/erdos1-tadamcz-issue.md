# Erdős #1 — the issue for github.com/tadamcz/erdos1 (the same day as the forum comment)

Status: DRAFT, NOT SENT. Operator-gated. `gh` is authenticated (carlostoledo1891) and can post it on
request; the gates in `erdos1-forum-comment.md` apply here too (the 2197-dimensional set must be
verified on this machine; main must be pushed so the links resolve). One repository, ruled 2026-09-15.

Title: **Effective version: explicit sum-distinct sets below Bohman's constant from this construction**

---

Your README notes that the argument as formalized is ineffective. It can be made effective with one change to the transfer: keep `chainMatrix` and `transferWeights` but replace the Smith normal form by a Hermite (upper-triangular) basis of the same column lattice; deleting the first row of `top(t·H) − chainShift` still leaves a unimodular minor, so the column lattice is saturated and the primitive normal is the same prefix recurrence. The one quantity the proof leaves existential, the buffer `K` in `integer_kernel_no_small_relation` (your `exists_perturbation_buffer`), is then an operator norm one can compute exactly, `K = D·‖E H⁻¹‖∞`; it comes out at about `2d` for the odd-cycle gadget. With `t = ⌈(2^k + K)/D⌉` the weights are `2^k`-relation-free and `exists_binary_block_set` gives the set.

Results (all checked by an independent verifier in exact arithmetic, twice — once on the machine that built them and once from the certificate files alone; certificates, code and the verifier at https://github.com/carlostoledo1891/cert-machine under `certs/erdos1/` and `instruments/erdos1/`; the page with every number's provenance at https://carlostoledo.co/reports/erdos1.html): explicit dissociated sets with `N/2^n = 0.217967` at `n = 1,701` (d = 81), `0.172386` at `n = 12,348` (d = 441) and `N/2^n = 0.145269` at `n = 79,092` (d = 2197), against Bohman's `0.22002`. Also: the odd-cycle gadget `I + P/2` in `oddCycleGadget` generalises to `I + αP` for every `0 < α < 1` (cube property proved for all tilts; strip property decided by a finite structured search per `(α, b)`), which is what puts a set below Bohman in dimension 81 where `α = 1/2` needs 729; and the base weights give explicit lower bounds in Siegel's lemma (`C_2197 ≥ 3.44`).

Happy to answer questions here; the two new lemmas are in `paper/erdos1-explicit.md` §2b of the repository, and the paper is `paper/erdos1-explicit.pdf`. A Lean wrapper for one certificate looks feasible — every step is a finite exact computation and `chainMatrix_saturated`, `exists_binary_block_set` and `composeMatrix_admissible` already exist here — but I have not written one.

---

Names checked against the pinned resolution file `corpus/sources/erdos1/tadamcz-erdos1-Erdos1_219usd_38h.lean`
(repository HEAD 0e395153): `chainMatrix`, `transferWeights`, `oddCycleGadget`, `integer_kernel_no_small_relation`,
`exists_perturbation_buffer`, `exists_binary_block_set`, `composeMatrix_admissible`, `chainMatrix_saturated`.
Re-grep them there before sending; a renamed lemma makes the issue wrong on its first line.
