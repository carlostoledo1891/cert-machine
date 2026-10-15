# Λ < 319/2000 for the de Bruijn–Newman constant: certificate bundle

**Claim.** The de Bruijn–Newman constant satisfies Λ < 319/2000 = 0.1595, unconditionally. The only finite-height input on
the Riemann hypothesis is Platt–Trudgian 2021 ([arXiv:2004.09765](https://arxiv.org/abs/2004.09765): RH up to height
3000175332800), used at height X/2 with X = 6000000185827, an exact margin of 350479773/2.

**Route.** If Λ > 0, then H_Λ has a multiple real zero (the positive-stall theorem: every zero with
|Re z| ≥ 4π·e^(512000/319) + 1 is real and simple, uniformly for t in [319/4000, 1/2]). The package shows that H_t has no
multiple real zero for any t in the closed band [319/2000, 3/16] and any real x, with two modules whose union is checked in
exact arithmetic:

| module | x-range | argument |
| --- | --- | --- |
| interior | [0, X] | PT2021 makes every zero of H_0 with \|Re z\| ≤ X real; a certified separator at x = ±X (every t in [0, 3/16], \|y\| ≤ 1, padded to 2) and Hermite propagation keep them real, and simple for t > 0 |
| exterior | [X, ∞) | a complete strong weighted Gram source at t = 4/25, N = 690988 (all 3524 closed leaves), universal closed-polydisc recovery and an all-index backward continuation give a raw floor > 1/250000 for every t in the band, every x ≥ X and every index N ≥ 690988 (42 finite closed index leaves through 2299999 plus one analytic infinite branch, no terminal cutoff); a real-projection theorem turns this into \|u_x\| > 1/400000 at every real zero |

With the anchor Λ ≤ 3/16 ([MI2026b], [doi:10.5281/zenodo.21175533](https://doi.org/10.5281/zenodo.21175533), merged as
teorth/optimizationproblems PR #126) this gives Λ < 319/2000. The full argument is `assembly_ce_319_2000/ASSEMBLY.md`, with
the complete proof in `assembly_ce_319_2000/math/ASSEMBLY.md`, `math/SECOND_PROOF.md` and `math/QUANTIFIER_AUDIT.md`; the
machine-readable header is `assembly_ce_319_2000/RECORD.json`.

**Verify.** [VERIFY.md](VERIFY.md) has one command: about 3 s on a 6-vCPU machine, with Python 3.12,
python-flint 0.9.0, sympy 1.12 and mpmath 1.2.1. Expected: `lambda_upper_exact 319/2000`, every gate 1, 168846 checks,
`RESULT: ALL PASS`, and verify-script output byte-identical to the banked run.

**Contents.**

- `assembly_ce_319_2000/`: the record package exactly as banked (candidate `7a28f197eb13`: 98 files plus the bank's
  `MANIFEST.json`).
- `verify/`: the official scorer `record_score.py` and its sandbox `confine.py`, unmodified.
- `MANIFEST.sha256`: the sha256 of every file in those two directories.

**What is re-derived and what is cited.** `verify.py` runs the banked composition mathematics fresh from source
(`math/verify.py`: Arb at 256 bits, sympy and exact rationals, with its independent second line `math/second_line.py` in
mpmath interval arithmetic) and requires its output to equal the accepted output byte for byte. It re-derives the two-box
coverage and the index transitions in exact rationals, and binds the four captured external audits that discharge the
composition's release obligations to their targets and pinned inputs. Heavy computations accepted earlier in the campaign
are not re-run: `FROZEN.sha256` pins their outputs and written proofs, which are cited by bank line and hash. The anchor is
cited, not re-verified here. A passing run is a mechanical check, not a referee's verdict; the analytic arguments are
offered for review.

**Provenance.** Found and certified by Mosaic Intelligence's verifier-gated agent swarm, run with GPT-6 Astra Pro agents.
Banked 2026-10-02 15:28:19 UTC as candidate `7a28f197eb13` (parent `9c524a202dfd`, the 4/25 record package). The swarm's
official and verify harness runs both returned 319/2000 with every gate 1, and its audit review passed. Before publication
an independent check re-scored the package on fresh machines, including from a source-only copy, and re-ran the banked
checks of 13 of the bank lines it relies on; everything matched. Not refereed.

**AI disclosure.** This is a fully AI-derived result: the construction, the proofs and the checkers were produced and
checked by Mosaic Intelligence's automated system, and this text was AI-prepared.

**Acknowledgment.** The collision-exclusion approach of the open pull request [teorth/optimizationproblems#180](https://github.com/teorth/optimizationproblems/pull/180) inspired part of this route; the certificate does not depend on it, and no file, theorem, constant or code from it is used.
