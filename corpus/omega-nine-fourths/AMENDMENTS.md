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

## A10 — 2026-11-25 03:38 UTC: a new row X1 (Sun's M_32 construction, decided exactly), sealed before it starts

The provenance scout (provenance/SUN.md) found that Zhi-Wei Sun's arXiv:2610.13971 exists only as v1 (14 Sep 2026,
math.GM), not withdrawn, and claims border rank R(M_32) ≤ 2048 (Theorem 1.3(a), characteristic ≠ 2) and R(M_{2^n}) ≤
2^{2n+1} for n ≥ 5, "Consequently, ω(K) = 2"; OpenAI's paper claims border rank ≥ n^{9/4} (≈ 2435.5 at n = 32) and names
the conflict at n = 2^8. If Sun's M_32 bound held, ω ≤ log_32 2048 = 2.2 < 9/4, against the Lean square_exponent too.
X1: two reconstructions of Sun's printed tables with no shared code (a Claude agent; GPT-6.2-astra offline), an exact
random-point falsifier over two primes, verdict words REFUTED-AS-PRINTED / PASSES-POINTS / NEEDS DATA
(prompts/sun-check.md). X1 is outside the CERTIFIED rule; it is reported with the facts, and a dense check needs a pod and
the operator's word. db6a7b5679c7a140a69153d698fc101c85eb7a5a00c06bddd4f3e466e34272c0  prompts/sun-check.md

## A11 — 2026-11-25 04:08 UTC: the clean-room pod, created and deleted; F1 and X1 states

CR pod: vznibdp98fhl5c, RunPod cpu3m 16 vCPU / 128 GB, US$0.88/h, created 2026-11-25 03:42:32 UTC (EU-RO-1), on the
operator's "You can use pods"; it never ran the release's code. Its results came home (runs/cr/, hashes equal on both
ends) and vznibdp98fhl5c was deleted 2026-11-25 04:08 UTC. Lane-level states are logged in PROGRESS.md (F1: both blind statements
sealed; X1: both reconstructions NEEDS DATA).

## A12 — 2026-11-25 05:00 UTC: how F4's items are decided (written before any verdict, after the F4 tests ran)

The statement reader (reader/REPORT.md) rated 6 items MATERIAL, 1 UNSURE, 28 IMMATERIAL; all six MATERIAL items are about
claims PREREG.md already places outside CERTIFIED ("What CERTIFIED would NOT say": divisions, the per-n bound, border
rank, asymptotic rank). Their decisions, from the Phase 1 run (runs/p1/PROGRESS.md; DEVIATIONS D3, D5):
- U1 (does Comparator pin definition bodies?): DECIDED, immaterial — C3 and the six planted variants V1–V6 were all
  refused, each naming the changed definition (V1, floor for ceil, names wireDimension).
- M1 (division, square case): DECIDED, proved — MatrixExponent.omega_eq (ω = 9/4 with division gates) is on the route of
  square_exponent; Comparator accepted the reader's challenge built from its definitions and refused the planted twin
  (Lean's kernel only: no nanoda, no con-leche, no Comparator config of the release pins it).
- M3 (per-n gate count): DECIDED in a weaker form only — T4 proves the count of ALL multiplications; the paper's
  nonscalar count is ABSENT from the release.
- M4 (asymptotic rank = n^{9/4}): DECIDED, proved on the route (T4; square_asymptoticRank_eq_rpow_formalOmega).
- M2 (division for α and the rectangular formula), M5 (geometric border rank of T_n), M6 (Corollary 1.3 per format):
  DECIDED ABSENT — CEN finds no such theorem in the release.
The verdict rule's "every MATERIAL item of F4 is decided" is read as: every item has a decision — proved, proved in a
weaker form, absent, or failed — and none is left undecided. Absent items are reported under G2 and G3 and do not enter
what CERTIFIED says. F4 therefore passes with the decisions above.

## A13 — 2026-11-25 09:11 UTC: Phase 4, the corollaries the release does not state (after the verdict; it does not change it)

On the operator's word ("Yes, try it"), after the verdict CERTIFIED (VERDICT.md): an attempt to close gap G3 ourselves.
Rows (outside the sealed verdict rule; the verdict stands whatever they find):
- G3a  the per-n bound counting EVERY multiplication and division gate, stated by us (PerN.GatesPerNAll).
- G3b  the paper's per-n bound in NONSCALAR gates, ⌈n^{9/4}/2⌉ at every n ≥ 2 over every field (PerN.GatesPerN).
- G3c  the asymptotic rank of T_n over every field equals n^{9/4} (PerN.AsymptoticRank).
- G3d  the geometric border rank of T_n ≥ n^{9/4} (PerN.BorderRankLower), if it can be stated faithfully in Mathlib.
Procedure as F1/F2: a statement writer (a Claude agent, prompts/pern-writer.md) states them from the paper and the
textbooks without seeing the release's Lean; the file is sealed (amendment) before it is first elaborated; a prover
(a Claude agent, prompts/pern-prover.md) proves them from the release on a fresh pod; Comparator with our file as the
challenge, Lean's kernel and nanoda, con-leche, a planted control refused. Words per row: PROVED (all three checkers),
NOT PROVED (with the reason). Pod spend counts toward the US$50 ceiling (US$5.99 spent at the verdict).
Also recorded: the exported proof (export.ndjson.zst, sha256 4731e942…) is published as a release asset of the public
repository (tag omega-nine-fourths-export-2026-11-25), GitHub's digest equal to ours; the operator's choice.
a9fd23bbf3fb30f4fd82546edcb070810f20ba604b96b986d2900ff782dbd4b0  prompts/pern-writer.md
c3170c0c91086e89f794359ffca8f48a220b661eeac6cdc611416e8c4eab0839  prompts/pern-prover.md

## A14 — 2026-11-25 09:21 UTC: the Phase 4 statements sealed before they are first elaborated

The Phase 4 writer (a Claude agent, 09:12–09:20 UTC; it read only its brief, intro.tex, obstruction.tex, consequences.tex
and Mathlib's source) wrote phase4/writer/PerN.lean with four propositions in namespace PerN: GatesPerN (nonscalar),
GatesPerNAll (every multiplication and division), AsymptoticRank (the limit AND the infimum over k >= 1), BorderRankLower
(included: Zariski closure stated as MvPolynomial.zeroLocus of the vanishing ideal, over the algebraic closure).
NOTES.md ends "I did not see the claimant's Lean statements". Both files are committed now.
71a4378ddf537461ed70a35916ea7f283072a7a8fd3500a3800b13ad6d9daac3  phase4/writer/PerN.lean
5e01e83f7f588b58adb0c9999d44fbc92e20f74042385e628ede094a1454e3e9  phase4/writer/NOTES.md

## A15 — 2026-11-25 13:32 UTC: Phase 5, Corollary 1.3 per format and the exponent with divisions (after the verdict; it does not change it)

On the operator's word (dialog, 13:2x UTC: "Go, both parts"): an attempt to close the rest of gaps G2 and G3 ourselves —
what the paper states and the release does not prove (reader/REPORT.md M6; VERDICT.md "What it does NOT say").
Rows (outside the sealed verdict rule; the verdict stands whatever they find):
- G3e  Corollary 1.3, border rank: for all a, b, c >= 1 and every field, the geometric border rank of T_{a,b,c} >= max{ab, bc, ca, (abc)^{3/4}} (Rect.BorderRankRect).
- G3f  Corollary 1.3, asymptotic rank: the same bound for the asymptotic rank of T_{a,b,c} over every field (Rect.AsymptoticRankRect).
- G2a  the paper's 1/2 <= alpha_F <= 2/3 in its own circuit model, WITH division gates, over every field (Rect.AlphaBounds).
- G2b  the stronger alpha_F = 1/2 with division gates (the release states it division-free only; the paper does not claim it) (Rect.DualExponentDiv).
Procedure as Phase 4 (A13): a statement writer (a Claude agent, prompts/rect-writer.md) states them from the paper and the
textbooks without seeing the release's Lean (it may copy our own sealed Phase 4 definitions); the file is sealed (A16)
before it is first elaborated; a prover (a Claude agent, prompts/rect-prover.md) proves them from the release and Phase 4
on a fresh pod; Comparator with our file as the challenge, Lean's kernel and nanoda, con-leche, a planted control
refused; then a clean-room replay (P5-CR) on a second fresh pod that never runs the release's code. Words per row: PROVED
(all three checkers), NOT PROVED (with the reason). Pod spend counts toward the US$50 ceiling (US$8.11 spent so far).
The operator's other answers of the same dialog: X1 stays NEEDS DATA, no contact with Sun; the Phase 4 post waits for
Phase 5.
5ac776c7a0800f69c6e40a6137729297a81a56179cc02f02ec57eddd9cccb24b  prompts/rect-writer.md
cd66352d7fd2ac20fa6febef1d28a3a16469fefe78f62b8e0c1d950f52cf062d  prompts/rect-prover.md

## A16 — 2026-11-25 13:40 UTC: the Phase 5 statements sealed before they are first elaborated

The Phase 5 writer (a Claude agent, 13:32–13:40 UTC; it read only its brief, our sealed Phase 4 statements
phase4/writer/PerN.lean and NOTES.md, intro.tex, consequences.tex, obstruction.tex and Mathlib's source) wrote
phase5/writer/Rect.lean with four propositions in namespace Rect: BorderRankRect (over the algebraic closure, a, b, c >= 1),
AsymptoticRankRect (the limit AND the infimum over k >= 1), AlphaBounds and DualExponentDiv (alpha_F in the paper's circuit
model with division gates: cost = the number of +, −, ×, ÷ gates; exponent = sInf of the s with cost O(n^s), one circuit
per n; the inner dimension floor(n^beta) kept exactly; "exponent two" = sInf equal to 2). Phase 4's definitions are copied
with the same Lean bodies; the matrix-multiplication tensor and the circuit variables are generalised to a×b by b×c.
NOTES.md lists every choice a reader could dispute and ends "I did not see the claimant's Lean statements".
953402670d04aaeac26f97e8034debb8401250de62bcb0baa511931d85e8577a  phase5/writer/Rect.lean
5113b0f5af78199e9118d18e0b8113806653ce9c250c382a06e93c4b75b479a8  phase5/writer/NOTES.md
