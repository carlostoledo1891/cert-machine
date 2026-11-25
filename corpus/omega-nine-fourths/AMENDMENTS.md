# Amendments to corpus/omega-nine-fourths/PREREG.md (each dated and sealed; never edits of PREREG.md)

## A2 — 2026-11-25 ~02:56 UTC: the prompt files, sealed before any agent starts (SEAL-A2.sha256)

prompts/blind-writer.md (writers A and B), prompts/adversarial-reader.md (F4), prompts/proof-reader.md (P1, a Claude
agent and GPT-6.2-astra separately), prompts/provenance-scout.md (U), prompts/kernel-runner.md (Phase 1). A1 (the
closure's target-SHA256SUMS) is written by the Phase 1 runner at the pin step, before K0, and sealed then.
Phase 1 pod: yfz653o1ck7ew9, RunPod cpu3m 32 vCPU / 256 GB, US$1.76/h, created 2026-11-25 02:53:29 UTC (US-CA-2).

## A3 — 2026-11-25 ~02:58 UTC: the two GPT-6.2-astra task files (sealed prompt + a role-and-folders footer)

blind/B/TASK.md (prompts/blind-writer.md + writer B's folders) and proof-readers/astra/TASK.md (prompts/proof-reader.md
+ the pre-fetched inputs, hashed in proof-readers/astra/INPUTS.sha256, because Astra has no network). Each run's
RUN.txt records its TASK.md sha256 at start. Started 02:57–02:58 UTC with the four Claude agents (Phase 1 runner,
writer A, the adversarial reader, proof reader 1) and the provenance scout.
c088065140ef09c1454fe8586da7250864cd62ba8141c760d0a1de117c17ff94  corpus/omega-nine-fourths/blind/B/TASK.md
a9b46484f6d84a8429cc0881fd2571a2e286e774517eb7a57d23d71f844520a6  corpus/omega-nine-fourths/proof-readers/astra/TASK.md
9b50eb44ff2824a5bcd53aefe43931c03c778ceac9ce786a9c4a2cc80db25fc9  corpus/omega-nine-fourths/proof-readers/astra/INPUTS.sha256

## A4 — 2026-11-25 ~03:03 UTC: writer B's blind statement sealed before it is first elaborated

GPT-6.2-astra (session 01a210a3-7b59-7033-b989-5ba7663b5857) ran 02:57:58–03:03:22 UTC, exit 0, and wrote four
propositions in namespace BlindB (SquareExponent, DualExponent, RectangularExponent, SquareExponentWithDivision; its
weights are rows / shared dimension / columns, so its alpha uses omega F 1 t 1). Its NOTES.md ends "I did not see the
claimant's Lean statement". The files are kept unpublished until writer A's statement is sealed too (so neither writer
can read the other's); their hashes are public now:
c8723bbd5023915b32bfd6357e2ca4b3d4c5d5efd1a3aed1afc30a44b6f82007  blind/B/work/BlindB.lean
9ecb5d112131a1568ba33045a168c60066d16b8a6f05910483525cb7df6f199d  blind/B/work/NOTES.md
7886cd08fe80bbb0302b5fa52ac67d5a3b78c4c463d3dee673611054b6167101  blind/B/REPORT.md

## A5 — 2026-11-25 ~03:06 UTC: the page's order (the operator's word)

The operator: "Remove the hostile and gaps first. This is a consequence." PREREG.md's "The page is built only from
records, gaps first" is replaced by: the page is built only from records; it leads with the claim and the
verification (every row and its state); the gaps G1–G7 appear as a consequence, each with the row that measures it,
worded as in PREREG.md. Public texts do not use the word "hostile". Nothing else changes: the rows, the verdict rule,
the ceiling and the sends stand as sealed.

## A5-c — 2026-11-25 03:05 UTC: a correction

A5's heading says "~03:06 UTC"; it was written ahead of the clock, which read 03:04:36 UTC when A5 was sealed.

## A6 — 2026-11-25 03:06 UTC: A5 withdrawn

The operator, after A5: "I mean from the post". His instruction concerned the wording of a draft X post, not the page.
A5 is withdrawn: the page is built as PREREG.md says, gaps first. The neutral wording (no "hostile") is kept on the
page as well. The control room misread the instruction; this line says so.

## A6-c — 2026-11-25 03:05 UTC: a correction

A6's heading says 03:06 UTC; the clock read 03:05:39 UTC when A6 was sealed (21 seconds ahead).

## A7 — 2026-11-25 03:07 UTC: writer A's blind statement sealed; both blind statements published

Writer A (a Claude agent) wrote BlindA.lean and NOTES.md (about 03:00–03:05 UTC; it read only the brief, its own
folder and Mathlib at d13f23b7; no web). Four propositions in namespace BlindA: SquareExponent (division-free),
SquareExponentWithDivision, DualExponent, RectangularExponent; its alphaDual follows the claim's words omega(F;1,1,t)
in its order rows / inner / columns (so the OUTER dimension n^t), and NOTES names the swap for the textbook inner one.
NOTES ends "I did not see the claimant's Lean statement". Hashes:
a9535d53f70b9fd92fceb25925d0533d340c7c85fb7a124e5c6d588c52f94a45  blind/A/BlindA.lean
e22cb9e95e4edf50237d423699445999ab8e22d72d5358873f3b2271c743ad92  blind/A/NOTES.md
With both sealed (B in A4), both files are committed now, before either is first elaborated.

## A7-c — 2026-11-25 03:06 UTC: a correction

A7's heading says 03:07 UTC; the clock read 03:06:25 UTC when A7 was sealed. From here every heading time in this
file is written by the shell from `date -u`, never by hand.

## A8 — 2026-11-25 03:19 UTC: corrections, facts found after the pin, and F2's scope (before any bridge attempt)

Corrections (the control room's errors):
- C-1 PREREG.md G6 says "28 compatibility patches"; lean/patches/ holds 27 patch files and a README. The PIN row found
  0 of the 27 patched packages in the closure of the three theorems.
- C-2 prompts/provenance-scout.md identified the paper's reference [41] as the two 2026-09-24 manuscripts. The scout
  (provenance/SCOUT.md) found [41] is the 2026-10-02 preprint "An Upper Bound of 9/4 for the Matrix Multiplication
  Exponent" (over ℂ); the two 2026-09-24 papers are [44] and [45].
- C-3 G5 as sealed is a true sentence about DeepMind's notebook, but the scout reads it as stale: the upper bound
  ω ≤ 9/4 has seven outside write-ups (none refereed) and four outside Lean developments (three descend from OpenAI's
  October code; one, qit-lmu/omega, is code-independent and uses a rank-based ω). G5 stays listed, with this reading.
Facts found after the pin (READ by the scout, each with its source in provenance/SCOUT.md):
- N1 OpenAI's PR #6 (2026-11-25 00:17:44 UTC), which added this release: "Lean and LaTeX builds were not run for this
  PR." formalization.yaml: review status "unchecked", method "agent".
- N2 lean/docs/379.md (not read before the seal): "Lean also proves that allowing division preserves the square
  exponent. In any circuit for matrix multiplication, the total number of multiplication and division gates is at least
  half the tensor rank over the algebraic closure of F. The paper's lower bound of ⌈n^{9/4}/2⌉ … at each side length
  n ≥ 2 remains unformalized." CEN records whether those theorems exist, under which Comparator config, and whether they
  are on the route.
- N3 The October Comparator challenge for ω_ℂ ≤ 9/4 (MatrixMultiplication.json, complex_omega_le_nine_quarters) is
  removed at 92b516ef; its solution file is unchanged. CEN records whether the three theorems use that subtree.
F2's scope (a flaw in PREREG.md, fixed before any bridge attempt): the writers were asked for a with-division
proposition, which the challenge does not claim. CERTIFIED's F2 condition covers the propositions in the challenge's
scope (each writer's SquareExponent, DualExponent, RectangularExponent). Each writer's SquareExponentWithDivision is
attempted from any theorem of the release (N2 included) and reported proved or not, with the reason, under G2; it does
not decide the verdict.

## A9 — 2026-11-25 03:30 UTC: the bridge author's brief (rows F2, F3), sealed before its agent starts

prompts/bridge-author.md. The bridge author writes proofs before the build exists and compiles them on the Phase 1 pod
once K0 has passed, without touching the runner's folders. ada1c407a6b150fa5678920d23975354ba523b37ae895446c6d1a19869199c58  prompts/bridge-author.md
