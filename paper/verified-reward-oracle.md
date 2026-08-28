# A Verified Reward Oracle for AI Mathematical Search

**STATUS: DRAFT — not submitted, not peer-reviewed.** Every number below is
quoted from append-only ledgers and gate-checked pages in the public
repository as of 2026-08-27; the live board (reports/matmul-eval.html)
recomputes them at every build and is authoritative over this text.

**Author:** Carlos Toledo · carlostoledo.co · github.com/carlostoledo1891/cert-machine

## Abstract

AI systems now emit mathematical claims at scale, and the binding
constraint on using them — for discovery, for evaluation, for training —
is verification that cannot be gamed. We describe a working reward oracle
for one decidable slice: rank-R decompositions of matrix-multiplication
tensors over exact rings. The oracle returns CERTIFIED (every tensor
equation verified in exact rational arithmetic), REFUTED (the first
violated equation with its exact discrepancy — the grader's own
mechanism, never coaching), or REFUSED (a malformed claim is declined,
never guessed at). The design discipline is the contribution: screens may
prune but never admit; every certifier is calibrated against a known
answer with red controls that must fire, re-run at import and at every
page build; feedback to a proposing model is template-locked to the
grader's arithmetic, so the channel can neither coach nor be sweet-talked.
Across five model campaigns (202 graded proposals) and three follow-up
campaign families, no false certification has ever occurred, and every
well-formed frontier-model proposal that survived the float screen was
exactly right — failures are malformed or honestly declined, not subtly
wrong. Because the ground truth is a proof, the eval has no answer key to
contaminate; we exhibit an answer-key failure taxonomy from audits of
published AI-generated mathematics (a constant published to thirteen
digits that IS the IEEE-754 float artifact, refuted at digit twelve; a
sign slip in a published result table) that reruns and digit cross-checks
provably cannot catch, and which exact certification catches by
construction.

## 1. The problem

Frontier systems propose mathematics faster than humans grade it, and
graded-by-rubric evaluations inherit two failure modes at once: answer
keys that are wrong, and answer keys that leak. Both are structural, not
incidental — we document published specimens of each (§6). For search
(AlphaEvolve-class systems), for evaluation, and for reinforcement
learning, what is needed is a reward channel with no gap between
graded-correct and is-correct.

## 2. The invariant

The machine's one rule: **a screen may prune, never admit.** Fast float
computation may discard candidates; only exact arithmetic may certify one.
Three verdicts, all load-bearing:

- CERTIFIED — the claim holds for every case in its stated scope, decided
  in exact rational arithmetic (BigInt / stdlib fractions; no float
  participates in any decision).
- REFUTED — with a falsifying mechanism re-proved exactly: the first
  violated equation and its discrepancy as a rational number.
- REFUSED — the honest third state. A claim the instrument cannot decide
  is declined with the reason. Refusal is what makes the other two
  verdicts trustworthy.

## 3. The red-control discipline

Every certifier ships with a battery: calibrations against known answers
(Strassen 1969 must certify; the paper's worked examples must reproduce)
and red controls that must fire (a coefficient perturbed by exactly 1e-9 —
invisible to any float screen — must be REFUTED; a forged pin must be
caught; a malformed claim must be REFUSED). The packaged oracle runs a red
subset at import and refuses to exist if any fails. In the wider
repository, ten real bugs were caught by this discipline — by an
impossible number, a calibration, a control, or a byte pin — and zero by
reading code (reports/methods-note.html).

## 4. The instrument

A claim is `{task: {kind: "matmul", n, m, p, rank}, ring: "Q"|"F2",
witness: {u, v, w}}`. The decision is the full tensor identity — all
(nm)(mp)(np) equations — over the stated ring; entries are integers or
exact rationals, and floats are refused at the door. The convention is
fixed and stated in every prompt and in the tool description. The REFUTED
mechanism is deterministic (fixed iteration order), which makes it usable
as closed-loop feedback that provably contains nothing but the grader's
own arithmetic. Characteristic matters and the oracle prices it: the same
sign-flipped Strassen witness is REFUTED over Q and CERTIFIED over F2 —
the mechanism behind AlphaTensor's rank-47 speedup requiring
characteristic 2, reproduced as a battery row.

## 5. Results (quoted from the ledgers; the board recomputes them)

Five campaigns over the initial prompt ladder, 202 graded proposals:
Claude Opus (v2 prompt) 17/24 certified; Claude Sonnet 28/40 (v2) and
25/34 (v1); Claude Haiku 0/80 across both prompts — a measured capability
cliff. THE FINDING: zero REFUTED rows among real-model proposals — every
well-formed proposal surviving the float screen was exactly right;
frontier failures are malformed or resource-bounded, never subtly wrong.
Follow-up campaigns hardened the ladder against recall: an impossible-rank
honesty probe (rank-6 ⟨2,2,2⟩; declining is correct — Opus declined 6/10,
Haiku attempted the impossible in every parsed reply, and an over-refusal
control shows the same models do not decline achievable rungs), a
disguised tensor under a pinned monomial transform (the prompt never names
matrix multiplication; Opus certified 6/6 — the disguise converts free
recall into thousands of tokens of real derivation), and an open
discovery rung (rank-22 ⟨3,3,3⟩) that renders in bold, never as a score.
In closed loop, feedback is template-locked to the grader's mechanism and
the build refuses a ledger whose feedback deviates: 27 rounds across 6
trajectories show a below-bar model is not rescued by feedback and an
at-bar model needs none — the channel is honest in both directions. Zero
false certifications have occurred across every campaign, control, and
battery run to date.

## 6. The failure taxonomy nothing else catches

Two audited specimens motivate the design. (i) A model-published constant
for an Erdős-problem bound, printed to thirteen digits, is refuted at its
twelfth significant digit — and shown to BE the naive IEEE-754 float
product, digit for digit: the answer key was the artifact
(reports/erdos852.html; the certified correction is now public in the
problem's discussion thread). (ii) A published result table's row fails
as printed by a sign slip while the underlying computation was correct
(reports/rm-audit.html; 50 of 51 printed rows survive an unconditional
audit). Reruns reproduce such artifacts; digit cross-checks confirm them;
only exact certification against the defining object catches them.

## 7. Scope, honestly

The oracle decides finitely many exact-arithmetic facts and refuses
everything else. It does not grade proofs, asymptotics, or mathematics at
large. The extension path is demonstrated rather than promised: one
refutation in this repository is exported to Lean 4 and machine-checked
end to end (33,859 primes kernel-certified; three forged variants rejected
by the kernel), showing certificates can graduate into proof-assistant
objects when the stakes warrant.

## 8. Availability

Everything is public and rerunnable: the zero-dependency library with red
controls at import (oracle/certmachine.py; `python3 oracle/battery.py`),
the ready-made tool definition for training loops
(oracle/tool-definition.json), the live board with an in-browser
exact-arithmetic paste box (carlostoledo.co/reports/matmul-eval.html), the
append-only ledgers (certs/matmul-eval-ledger.jsonl,
certs/matmul-loop-ledger.jsonl), and the open submission path (proposals
graded deterministically; the board never trusts a submitted verdict).
