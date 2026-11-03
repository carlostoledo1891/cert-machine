# Weight-Space Programming (MIT CSAIL, 2026-11-02) — the verification plan

The operator, 2026-11-02: "Can we beat this build or verify it?" → "We can pause the other tasks as go deep on this one.
Handoff to start on the next session."

## The claim, as published

- X: https://x.com/rikiyatakehi/status/2117313742891327994 (Rikiya Takehi, 2026-11-02 17:51 UTC; ~3.0M views,
  32.7k likes, 21k bookmarks at 20:30 UTC): "We asked GPT-6 Astra to edit Qwen3.5-0.8B weights to improve math. It
  directly changed only 0.016% of weights … improving math up to 6x and even instruction following 3x, without gradients
  or training."
- Post: https://rikiyat.github.io/blog/weight-space-programming/ — Takehi, Teoh, Zhang, Khattab (MIT CSAIL). Experiment 8:
  Qwen3.5-0.8B, thinking on, temperature 0.6, top_p 0.95, top_k 20, presence_penalty 1.5, max 32,768 tokens; samples
  per problem 4 (MATH-500), 2 (GSM8K, IFEval). Base → edited (50 forward passes): MATH-500 7.9 → 48.1, GSM8K 13.8 →
  67.1, IFEval 21.0 → 62.3, hit-the-limit 93.0 → 33.1. The edit: one direction subtracted from 64 output columns of
  `down_proj` in layers 15 and 19 (131,072 weights, "0.016%").
- Weights: https://huggingface.co/RikiyaT/Qwen3.5-0.8B-weight-space-programming — two tensors differ from
  `Qwen/Qwen3.5-0.8B` @ 2fc06364715b967f1860aea9cf38778875588b17, sha256 of the raw bf16 bytes printed in its README
  (layer 15 `82e2d733…`, layer 19 `8ef3c61b…`); `eval/` holds samples_edited_math500.jsonl (2,000 generations, 7.8 MB),
  scores_edited_math500.json (51.0% on akhaliq's re-run: vLLM 0.33.0, math-verify 0.9.0 on the last \boxed{}), and a
  25-problem base smoke test (5.0%, 95% at the limit).
- Logs: https://github.com/RikiyaT/lm_understand-logs (pushed 2026-10-29) — exp8_math/{code (evaluate.py, mathqa.py,
  apply_edit.py, make_edit_diff.py …), eval (unedited, p10c, p25c, p50c; RESULTS_excerpt.md), runs/p50c/edit (the
  bit-exact diff), base_model}.

## What the first reading found (2026-11-02, from their own files and Qwen's card — READINGS, not yet decided)

1. The baseline is in a looping regime. Qwen's card (huggingface.co/Qwen/Qwen3.5-0.8B README L856) warns that the 0.8B
   "is more prone to entering thinking loops" under the recommended parameters and advises tuning them. The card's own
   table, Qwen3.5-0.8B column: IFEval 44.0 thinking / 52.1 non-thinking (post's base: 21.0); MMLU-Pro 42.3 / 29.7
   (post's base 40.3: close); GPQA 11.9 thinking (post's base 22.7). The card's thinking-mode text sampling is
   temperature 1.0 with max_tokens 81,920; the post used 0.6 and 32,768. The multipliers ("6x", "3x") are measured
   against that baseline; the edited IFEval 62.3 is above the card's own base numbers, so the edit does something real.
2. One run, selected. RESULTS_excerpt.md: 10 passes 12.3 / 25.7, 25 passes 14.1 / 25.1, 50 passes 48.1 / 67.1 (prompt
   v3); prompt-v4 runs and v2/v3 runs that submitted no edit; v5 runs pending (…). No variance across runs reported.
3. The grader is not named in the post; the HF card names math-verify 0.9.0 on the last \boxed{}.

## The stages

**Stage 1 — the weights, decided (CPU, free).** Download both checkpoints at pinned revisions (base @ 2fc06364; the
edited repo at its current commit — record it), every file sha256-pinned under corpus/wsp/. Decide exactly, in two
implementations that share no code (Python with the standard library reading safetensors headers + raw bf16; JavaScript
reading the same bytes): (a) the set of tensors whose bytes differ — claim: exactly the two named; (b) the number of
entries that differ — claim: 131,072; (c) the fraction of the model's parameter count — claim: 0.016% (state the count:
the checkpoint is image-text-to-text; count with and without the vision tower and say which the claim needs);
(d) the structure — claim: one direction subtracted from 64 columns: decide which columns move, and whether the delta in
exact bf16 arithmetic is (to bf16 rounding) a rank-1 outer product; (e) their printed tensor sha256s against our bytes.
Red controls: a flipped bit in a third tensor must be found; a doubled delta must change the structure verdict.
Verdicts CERTIFIED / REFUTED with witness / REFUSED with reason, per sub-claim.

**Stage 2 — the 2,000 answers re-graded (CPU, free).** Pin samples_edited_math500.jsonl and the base smoke test (and
the logs' eval/unedited + p50c parts if the samples are there). Gold answers from MATH-500 (pin the dataset revision).
Our own extraction of the last \boxed{} and an exact grader for answers that parse to rationals (integers, fractions,
decimals, simple radicals via exact forms if feasible); everything else REFUSED with the reason, never guessed.
Compare per generation with their `correct` flag: count agreements, their false accepts and false rejects on the
decidable subset, each disagreement listed with its text. Re-state 51.0% / 48.1% on the decidable subset. This is the
grader-audit lane (the 3,582 / 4,000 tolerance result).

**Stage 3 — the baseline that matters (GPU, ~US$15–30; THE OPERATOR'S WORD before any pod).** The UNEDITED model on
MATH-500 (4 samples, same grader as stage 2): (i) the post's settings (control: should reproduce ~7.9%); (ii) Qwen's
card thinking-mode text settings (temperature 1.0, max 81,920); (iii) non-thinking mode, card settings
(temperature 1.0, top_p 1.0, presence_penalty 2.0). Pre-register the three conditions, the grader and the stop rule in
notes/ BEFORE the pod starts. RunPod: list pods first; state the hourly price; delete at the end; the run's facts in a
record. Question answered: how much of 7.9 → 48.1 does a no-edit configuration recover?

**Stage 4 — "beat it" (optional, after stage 3, 1–2 days + GPU).** A no-frontier-LLM rank-1 ablation: the loop
direction from the difference of mean activations (looping vs terminating traces) at layers 15/19, subtracted the same
way; scored like stage 3. Only if stage 3 leaves a real gap for the edit.

## Output

A report /reports/weight-space-programming.html (gaps first, dated at the pin — audit-reports-lead-with-gaps), records
certs/wsp-weights.json, certs/wsp-regrade.json (and certs/wsp-baseline.json after stage 3), a corpus/targets.json row
(wsp-2026-11, written at scouting), and drafts for the thread reply and one X post (one post + image + link) — every
send the operator's word. Tone: the edit is real and interesting; the claim we check is the size of the multiplier and
the exactness of the published numbers.

## Context, 2026-11-02 evening (read, not decided)

Chandan Singh's "Weight-Space Programming from scratch on simple tasks" (csinva.io/weight-space-programming-autoresearch/
analyze/toy_examples/report.html, 2026-11-02) is a different experiment — an agent writing closed-form transformers for
toy tasks — and states its own caveats: one fixed evaluation seed for every run, and language-task results that leaked
the evaluation set (SNLI "not valid", SST-2 inflated). A second public voice on the same genre of claim saying "one run,
one seed, check the grader". Its algorithmic programs (e.g. parity up to 10 bits, 174 parameters) are decidable over
their whole input space in exact arithmetic — a possible target of its own, scouted as a targets row, not pursued here.

## Status, 2026-11-02 ~23:30 UTC

Stages 1–2 DONE: certs/wsp-weights.json (two deciders, 2 red controls), certs/wsp-regrade.json (instruments/wsp/grade.py);
the page /reports/weight-space-programming.html; the drafts notes/x/reply-wsp-2026-11-02.txt and notes/x/drops/d12-wsp-post.txt.
Stage 3 pre-registered (notes/wsp-stage3-preregistration-2026-11-02.md), NOT run: the operator's word.
