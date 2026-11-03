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
