# Weight-Space Programming — Stage 3 pre-registration (the unedited baseline), 2026-11-02

Written BEFORE any GPU run. The run is the operator's word (RunPod, ~US$15–30); nothing below has been executed.

## The question
How much of the post's MATH-500 7.9 → 48.1 does a no-edit configuration of Qwen3.5-0.8B recover? The post's
baseline is measured under settings (temperature 0.6, top_p 0.95, top_k 20, presence_penalty 1.5, 32,768 tokens,
thinking on) under which the model's own card warns of thinking loops; 93.0% of its MATH-500 answers hit the limit.

## The three conditions (all: the UNEDITED Qwen/Qwen3.5-0.8B @ 2fc06364, vLLM, bfloat16, chat template, the user
message = problem + "Please reason step by step, and put your final answer within \boxed{}.", 4 samples per
problem, seed 0, the 500 MATH-500 problems @ 6e4ed1a2)
  C1  the post's settings exactly (control; expected ≈ 7.9%, cut share ≈ 93%).
  C2  the card's thinking-mode text settings: temperature 1.0, top_p 0.95, top_k 20, min_p 0, presence_penalty 1.5,
      max_tokens 81,920, thinking on.
  C3  the card's non-thinking text settings: temperature 1.0, top_p 1.0, top_k 20, min_p 0, presence_penalty 2.0,
      max_tokens 32,768, thinking off.
  (If budget allows, C4: the EDITED checkpoint @ d1671a17 under C2 — the same lift applied to both sides.)

## The grader
instruments/wsp/grade.py (sha256 recorded at run time), the last closed \boxed{} read here; math-verify is NOT used.
Accuracy is reported (a) on the decided subset, (b) with REFUSED counted as wrong (a floor), and (c) the cut share.

## The stop rule
One run per condition, 2,000 generations each; no re-runs, no cherry-picking; a condition that fails to complete is
reported as incomplete with what finished. Hard budget: US$40 total; the pod is deleted when the three conditions have
finished or the budget is hit, whichever first. List pods before creating one; state the hourly price; record the
pod id, GPU, image, vLLM/transformers versions and the exact sampling dict per condition in certs/wsp-baseline.json.

## What a result means
If C2 or C3 reaches a MATH-500 accuracy within 10 points of 48.1 (first-sample or 4-sample mean), the "6×" is mostly
the baseline's settings and the report says so. If both stay below ~20%, the edit's gain stands against the card's
settings too and the report says that. Either way the number goes on the page beside the post's table, dated.

## Amendment 1 — 2026-11-03 12:40 UTC (C1 running; no C2/C3 token generated yet)
Bands and stop rules fixed before any no-edit card-settings result exists (the operator's brief of 11-03; the adversarial
review notes/wsp-adversarial-review-2026-11-03.md §3). tools/wsp-baseline.py implements them as written.
- Stop rule A: C1 (the post's settings, unedited) within 7.9 ± 3 points (all-samples floor), else "no verdict on the
  multiplier: the setup does not reproduce the claimants'".
- Stop rule B: the edited control is the card's independent re-run (51.0 on 2,000 released flags, re-graded in
  certs/wsp-regrade.json), within 48.1 ± 4; C4 is the like-for-like lift under the card's settings, not a control.
- Outcome bands on the best no-edit card-settings arm (C2 or C3; the larger of the first-sample and the all-samples
  floor, REFUSED counted wrong): < 15% HOLDS; 15–40% OVERSTATED; ≥ 40% MOSTLY A SETTINGS EFFECT. A best arm within 2
  points of an edge is reported "at the edge". The critic's "47% in non-thinking mode": REFUTED as stated unless C3 is
  within 5 points of 47; his own run is REFUSED until its settings are shared.
- The multiplier is re-stated as 48.1 over the best no-edit arm. No arm is re-run. (The 10-point / 20-point rule of the
  original text is superseded by these bands; it is kept in the record beside them for the reader.)
