# FlashProve statement reading: the merge (Phase 3), 2026-11-04, claim at 9e2bdd8f

Two readers each wrote a table without seeing the other's. Reader A's is in flashprove-reading-A.md (22 rows) and
reader B's in flashprove-reading-B.md (22 rows). This file was written only after both were finished.

Rule (pre-registered): a gap counts only if both readers find it, or if the merge confirms it against the text.

**What both readers found.** The claimant's own ledger already states every gap below: THEOREM.md, lean/LIMITS.md,
lean/GAPS.md, docs/limits*.md and the paper. The gaps lie between the README's short sentences and that ledger. None
lies between the ledger and the Lean.

## Gaps found by both readers (counted)

| # | Gap | A | B | The claimant's ledger |
|---|-----|---|---|---|
| G1 | **Nothing is proved about the programs a user runs.** Soundness is a theorem about the Lean `verify` under a random oracle. It is not about `cp_verify`, and the hash is not BLAKE2b. README.md:15-16 tells users to check with `cp_verify`, next to the bound. | gap 2 | gap 1 | LIMITS L1, L4, L8; GAPS 45, 51; THEOREM.md:199-201 |
| G2 | **"The committed model" means the weights an extractor reads.** No theorem ties them to the provider's model or to `cp_commit`. No theorem ties a commitment ID to one set of public files, so one ID could pass with two file sets and two sets of weights. | gap 3 | gap 2 | LIMITS L2, L28; GAPS 64, 69, 77; THEOREM.md item 4 |
| G3 | **The bound "q/2^124 + 2^-101" holds under conditions the README sentence does not give.** It holds only at exact match, which `verify` does not test, while serving uses the clipped-gap policy. It holds only for files fixed before the hash is drawn, and it is the probability that one proof is both accepted and wrong. N proofs at once cost N times; proofs checked one after another have no bound. | gap 1 | gap 5 | LIMITS L4, L5; GAPS 5, 6, 44, 70; THEOREM.md:86, :300-303 |
| G4 | **No real deployment is shown to satisfy the theorems.** Completeness and zero knowledge hold for the Lean prover, on requests in `CanServe`. They are known to have content at one Lean value, `storedSetup`, whose scale file comes from synthetic weights. No proof on real weights has gone to the Lean verifier, and there is no theorem about the GPU prover. | gap 4 | gap 4 | THEOREM.md:41-44; GAPS 14, 52, 57; LIMITS L27, L69 |
| G5 | **Weight hiding is proved only of the Lean prover, and it counts something else.** The zero-knowledge count of 688,127 is single-request replies on one copy of the table. The programs stop a copy at 688,127 batches of up to 64 requests, and no theorem ties the two counts. The proof assumes fresh randomness, while the programs derive masks from a seed. The paper calls hiding by the programs "our judgement, not a proof". | gap 5 | gap 3 | LIMITS L83, L84, L93; GAPS 15, 15(3); paper abstract |

## Points one reader found, settled against the text

- **The small example is out of every theorem's scope (B; CONFIRMED by the merge).** THEOREM.md:303 says "The small
  example's files are out of scope: `verify` rejects them." The README's route 1 has an agent run `cp_verify` on that
  example and report YES, without the caveat. This bears on our own check: route 1's YES is a fact about the C++
  program, not an instance of any theorem.
- **"in seconds" (B; NOT A GAP).** The paper measures 21.14 ± 0.03 s with one thread (paper p. 5; docs/figures.tsv row
  verify-time). That is seconds. The README names no thread count, and the figure is stated where a reader looks for it.
- **"below 2^-154" against "≤ 2^-154" (A; WORDING ONLY).** The six lines state ≤. The strict bound follows from another
  theorem's value, 2^-157 + 688,127·2^-174, as reader A shows. The ledger does not remark on it, and it changes nothing.
- **Lemma 4.9 is "[machine-checked]" but "joined on paper" (A; DISCLOSED).** The lemma's own text says how its two Lean
  theorems are joined. Listed as read, not as a gap.
- **The pre-registration's "Lean 4.29.1" (B; OUR ERROR).** README.md:26 says "Lean 4". The version comes from
  lean-toolchain and THEOREM.md:382-383. Corrected here; the pre-registration stays as written.

## What this reading does not do

It does not review the cryptography. It checks no proof; the kernels did that. It does not touch route 4 (the 400B
prover on real weights).
