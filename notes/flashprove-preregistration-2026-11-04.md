# FlashProve — pre-registration of the outside check, 2026-11-04

Written and pushed BEFORE any run. Operator's word, 2026-11-04:
- phases 0–4 and a report;
- one GPU run for route 3, cap US$5;
- one CPU pod for the Lean work, cap US$25;
- the report first; any post on anthropics/FlashProve decided after the operator reads it.

Nothing below has been executed.

## The claim, pinned
The claim is github.com/anthropics/FlashProve at 9e2bdd8f (FlashProve 0.16.0-rc.26, 2026-10-30, Apache-2.0, "a research
artifact: not maintained") and its technical report.
- corpus/flashprove/PINS.json holds 80 files by sha256 plus the git tree, written by tools/flashprove-pins.py.
- What the README claims:
  - a provider commits to weights;
  - for each reply a GPU proof shows the reply is the committed model's output;
  - anyone checks it on a CPU in seconds with `cp_verify`;
  - soundness is proved in Lean 4.29.1: "caught, except with probability about q/2^124 + 2^-101 after q hash queries".
- The six theorems: VerifiableInference.{sound, soundAndBinding, completeOnCanServe, zeroKnowledgeOnCanServe,
  refusedHandsOutNoProof, repliesFit} in AtFullSide/Face/TheSixLines.lean.
- The theorem beneath `sound` is VerifierAndGoals.AtTheName.sound_of_verify_at, in
  Johnson/Goal/Skeleton/SoundOfVerifyAt.lean.

## What this check is, and what it is not
It is a second party running the claimant's verifier and Lean library from the public bytes, and a reading of what is
stated against what is checked. No code is shared with the claimant's check script (lean/scripts/check.py is read,
never run as the authority).

It is not a review of the cryptography. The theorems are checked to compile and to rest on the standard axioms; their
mathematics is the kernel's, not ours. Nothing here touches the 400B prover on real Maverick weights (route 4, out of
scope), and nothing here is a security assessment.

Verdict words:
- CERTIFIED: the step ran and gave the stated result.
- REFUTED: it ran and gave a different result. Reported only with the bytes that show it.
- REFUSED: it could not be run within the budget or the platform. Never counted as a failure of the claim.

## Phase 1 — route 1 and route 2 on a hosted runner (free; .github/workflows/flashprove-route1.yml)
Ubuntu 24.04 with its g++ 13. The claim is cloned at the pin, and every pinned byte is re-hashed against PINS.json first.
- R1.1 `verifier/build.sh`. Expected: exit 0, a line `THE VERIFIER IS BUILT:`. Any `build.sh: note:` line is quoted.
- R1.2 `cp_verify` on examples/accepted-proof, with the stored ID. Expected: last line `YES`, exit 0.
- R1.3 `cp_verify` on examples/full-size, with its ID. Expected: last line `YES`, exit 0, `bits=128`.
  We record the `proof of work:` and `result-v1` lines.
- R1.4 The tamper controls on the small example. Each must be REJECTED (exit 1, `NO: …`) or reported as no verdict
  (exit 5/14/2–4/15). An exit 0 on any of them would be a finding, reported to the claimant per SECURITY.md before
  anything public.
  - (a) one byte of example.proof flipped, at a position fixed in the workflow: the middle byte;
  - (b) the commitment ID with its last hex digit changed;
  - (c) example.y with its token changed by +1;
  - (d) one byte of example.req flipped (its last byte);
  - (e) the proof truncated by one byte;
  - (f) the full-size ID passed with the small example.
- R2 `blocks/first_look.sh`. Expected: exit 0 and a third-from-last line starting `AS EXPECTED: the honest copy was
  accepted`.
- R3 `run_suite.py cpu`, its exit code and summary. 0 is a pass, 77 means missing tools, 3 means a false acceptance.
  It runs with a 5 h job limit. A timeout is REFUSED (resources), not a failure.

## Phase 2 — the Lean library on one RunPod CPU pod (tools/runpod-flashprove.sh; cap US$25)
- The pod: cpu3m, 32 vCPU / 256 GB, US$1.76/h (list-cpu-types, 2026-11-04), plain ubuntu:24.04. It holds no
  credential and serves its facts on port 8000.
- Deleted at the finish, or when spend reaches US$25 (about 14 h), whichever comes first.
- Steps run in this order. Each records its exit, wall seconds and peak memory.
  - L1 Prepare: elan, the pinned toolchain (v4.29.1), `lake exe cache get` (Mathlib's cache only), and the clone's bytes
    against PINS.json.
  - L2 `lake build` (default targets Library + AtFullSide), with the parallel bound from the claimant's own rule of
    thumb (one process plus one per 12 GiB beyond 50 of available memory). Expected: exit 0. A module that fails to
    compile is a finding. A build that cannot finish in budget is REFUSED.
  - L3 `#print axioms` for the six theorems, for sound_of_verify_at and for sound_stored / soundAndBinding_stored, from OUR
    Lean file. Expected: each rests on propext, Classical.choice and Quot.sound only, and no `sorryAx`.
  - L4 The Lean verifier (tools/lean-verify/lean_verify.sh) on examples/full-size, beside cp_verify built on the same pod.
    Expected: ACCEPT and YES. We also run both on tamper control (a) at full size: expected REJECT and NO.
  - L5 The second kernel: nanoda (ammkrn/nanoda_lib at a fixed commit, 1 GiB stack, permitting the three standard axioms),
    on an export of sound_of_verify_at made by the PUBLIC lean4export at the tag for v4.29. The claimant's CHECKING.md
    says this route is "untried". Expected: either accepted, or no verdict (lean4export cannot export it, or nanoda's
    2^31-entry table is outgrown, as the claimant reports for four other theorems). A no verdict is REFUSED, not a
    finding. A rejection is a finding.
- Not run: the whole-library leanchecker replay. On the claimant's figures it is 2 h 24 min on 84 cores, and on 32
  vCPU it does not fit the cap. The report says so.

## Phase 3 — the statement reading (two readers, blind to each other)
Two independent readers read THEOREM.md, LIMITS.md, the paper's abstract, §1 and §4, and the README. Each fills the same
table: claim as written; where it is stated in Lean; what the Lean statement covers; what it does not cover; whether the
claimant's own ledger already says so (GAPS/LIMITS entry). The two tables are merged only after both are written.
A gap counts only if both readers find it or the merge confirms it against the text.

## Phase 4 — exact checks of our own
- E1 The soundness bound as printed, "q/2^124 + 2^-101", against the Lean definition of finalSoundnessError. Read from
  the Lean text and computed in exact rationals at q = 1, 2^48, 2^64 and 2^80. We report the q at which the bound reaches
  2^-40 and 2^-1, never a "security level" (the claimant's L11).
- E2 Every numeric constant the six theorems' statements name is checked exactly: the field modulus or moduli, the
  2^-40 completeness error, the 2^-154 zero-knowledge bound at 2^64 queries and 688,127 replies, and 62 + 688,127 × 64
  ≤ 44,040,191. Primality is decided by a deterministic test with a certificate (Pratt or ECPP) where the modulus is
  prime.
- E3 A differential test of cp_verify against the Lean verifier. L4 runs it on the one full-size proof. Our own
  byte-level parse of the proof header (from docs/format/FORMAT.md, written without the claimant's parser) checks that
  the fields both verifiers read are the fields the format says.

## Phase 5 — route 3 on one GPU (tools/runpod-flashprove-gpu.sh; cap US$5)
One H100 80 GB pod with CUDA 13.2 Update 2 (nvcc 13.2.86).
- `examples/quickstart-gpu.sh`: build, commit, prove one 64-token request, verify.
- Expected: exit 0, the line `quickstart-gpu: all steps ended as expected`, every `Compiled by` line ending
  `release 13.2, V13.2.86`.
- Then our fresh proof is checked by the cp_verify of phase 1's runner (built separately), with the ID the commit printed.
- The pod is deleted at the finish or at US$5. If no H100 is in stock at the cap's price, phase 5 is REFUSED.

## Stop rules
- No step is re-run to change its outcome. A rerun is allowed only for a platform failure (a pod lost, a runner killed),
  and is recorded as such.
- Any accepted tampered proof stops the publication path. It goes to the claimant privately first (SECURITY.md).
- The report leads with the gaps (house rule), each dated at the pin, before anything we confirm.

## Output
- certs/flashprove-check.json is the record, from the runner's artifact, the pod's facts and our exact checks.
- /reports/flashprove.html is the report, gaps first.
- Nothing is posted anywhere without the operator's word.
