# Erdős #1 — the issue for github.com/tadamcz/erdos1 (the same day as the forum comment)

Status: POSTED 2026-09-16 11:40 -03 as https://github.com/tadamcz/erdos1/issues/2, through gh under the
operator's account (carlostoledo1891) on the operator's word ("Can you post this one in my name?"). The
body below is what was posted, formatted for GitHub Markdown (headings, a results table, a list, a
disclosure); the earlier one-paragraph draft is history. One repository, ruled 2026-09-15.

Title: **Effective version: explicit sum-distinct sets below Bohman's constant from this construction**

---

Your README notes that the argument as formalized is ineffective. It can be made effective with one change to the transfer, and the resulting sets exist on disk with certificates. Summary below; details, certificates and an independent verifier are linked at the end.

### The change

Keep `chainMatrix` and `transferWeights`, but replace the Smith normal form by a Hermite (upper-triangular) basis `H` of the same column lattice. Deleting the first row of `top(t·H) − chainShift` still leaves a unimodular minor, so the column lattice is saturated and the primitive normal is the same prefix recurrence.

The one quantity the proof leaves existential, the buffer `K` in `integer_kernel_no_small_relation` (your `exists_perturbation_buffer`), is then an operator norm one can compute exactly:

```
K = D · ‖E H⁻¹‖∞        (E the fixed chain perturbation, D the denominator of the lattice)
```

For the odd-cycle gadget it comes out between `d` and `2.4d` in every lattice computed. With `t = ⌈(2^k + K)/D⌉` the weights are `2^k`-relation-free, and `exists_binary_block_set` gives the set.

### Results

Every certificate was checked by an independent verifier in exact arithmetic, twice: once on the machine that built it and once from the certificate file alone. Explicit dissociated sets `A = { a_i · 2^j }` with:

| dimension d | tilt α | n = \|A\| | N / 2ⁿ |
|---|---|---|---|
| 81 | 3/5 | 1,701 | 0.217967 |
| 169 | 2/3 | 4,732 | 0.193433 |
| 441 | 3/4 | 12,348 | 0.172386 |
| 961 | 4/5 | 28,830 | 0.159783 |
| 2197 | 1/2 | 79,092 | 0.151520 |
| 2197 | 11/20 | 79,092 | **0.145269** |

against Bohman's `0.22002`. Two further points:

- The odd-cycle gadget `I + P/2` in `oddCycleGadget` generalises to `I + αP` for every `0 < α < 1`: the cube property is proved for all tilts (a three-line maximum argument), and the strip property is decided exactly per `(α, b)` by a finite structured search. The tilt is what puts a set below Bohman in dimension 81, where `α = 1/2` needs 729.
- The base weights give explicit lower bounds for the constant in Siegel's lemma, in the normalisation of Bloom's exposition: `C_2197 ≥ 3.44`.

Not done: the effective rate `f(n) ≤ n^(−c/log log n)`. It needs a proof that `K` is polynomial in `d`; that is measured in every instance (the dimension times a slowly growing function of the level) and not shown.

### Where things are

- Page, with every number's provenance: https://carlostoledo.co/reports/erdos1.html
- Paper (v0.2): https://carlostoledo.co/paper/erdos1-explicit.pdf
- Certificates, verifier and code: https://github.com/carlostoledo1891/cert-machine under `certs/erdos1/` and `instruments/erdos1/`; the two new lemmas are in `paper/erdos1-explicit.md` §2b.

A Lean wrapper for one certificate looks feasible, since every step is a finite exact computation and `chainMatrix_saturated`, `exists_binary_block_set` and `composeMatrix_admissible` already exist here, but I have not written one. Happy to answer questions.

*Disclosure: this work was produced with substantial AI assistance (the effective step, the code, the certificates and this text were produced by me working with Claude, Anthropic). Every claim is decided by the independent verifier in exact arithmetic, and I have read and checked the mathematics myself. Not peer reviewed.*

---

Names checked against the pinned resolution file `corpus/sources/erdos1/tadamcz-erdos1-Erdos1_219usd_38h.lean`
(repository HEAD 0e395153): `chainMatrix`, `transferWeights`, `oddCycleGadget`, `integer_kernel_no_small_relation`,
`exists_perturbation_buffer`, `exists_binary_block_set`, `composeMatrix_admissible`, `chainMatrix_saturated`.
Re-grep them there before sending; a renamed lemma makes the issue wrong on its first line.
