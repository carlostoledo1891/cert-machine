# Draft — GitHub issue on RikiyaT/lm_understand-logs (the operator's word to post; the channel rule: GitHub, not e-mail)

Title: Independent re-run of the MATH-500 baseline under Qwen's recommended settings: the untouched model scores 44–52%

Hi — thank you for releasing the checkpoint, the bit-exact diff, the logs and the graded outputs; this is only possible because you did.

I decided the edit from the bytes (two implementations sharing no code) and re-graded every released MATH-500 answer with an exact three-valued grader: the edit is exactly as released (two tensors, sha256 as your card prints), and my grading agrees with math-verify on every decided first-sample answer. Two small things: 130,188 bf16 entries differ (131,072 are addressed; 884 round back), and the formula in your experiment_history is W = W₀ − 6·outer(u, mask·(uᵀW₀)), so the loop component is reversed and amplified, not subtracted — the post's text says "subtracted".

Then the baseline, pre-registered before the run (notes/wsp-stage3-preregistration-2026-11-02.md), vLLM 0.33.0, your prompt and chat template, 4 samples × 500, seed 0:

| arm | setting | first sample (floor / decided) | all 2,000 (floor / decided) | answered | hit the limit |
|---|---|---|---|---|---|
| C1 | your settings (temp 0.6, thinking, 32,768) | 7.8% / 7.8% | 7.2% / 7.2% | 8% | 93.1% |
| C3 | Qwen card, non-thinking text (temp 1.0, top_p 1.0, presence 2.0, 32,768) | 45.6% / 51.7% | 44.0% / 49.8% | 98.5% | 0.3% |

("floor" counts an answer my grader refuses as wrong; "decided" is CORRECT over CORRECT + WRONG.) C2 (the card's thinking settings, 81,920 tokens) and C4 (your edited checkpoint under C2) are running and will be added to the same record.

So under the model card's own recommended settings the unedited model lands where the edited one lands under yours. The edit is real and it does what your logs say — it stops the loop — but the "6×" is measured against a looping regime the card itself warns about. I'd read the result as "the edit recovers what the recommended settings give", and I'd be glad to be shown a setting where that is not so.

From your logs I also checked the claims going around: the dose (6) was chosen over 3,680 practice answers (GSM8K/MATH train), never a MATH-500 problem by id or text; the Frogger/Freeway keyword rule is as your README states; the car policy's edited weights reach 876 and the 100% is 1,280 episodes on one level; the sycophancy round failed from the weights alone in your own words. Record: certs/wsp-side-claims.json.

Everything is pinned (sha256 of every input), every verdict is in the records, and the grader is 300 lines of standard-library Python you can read: https://carlostoledo.co/reports/weight-space-programming.html — records at https://github.com/carlostoledo1891/cert-machine/tree/main/certs (wsp-weights.json, wsp-regrade.json, wsp-baseline.json, wsp-side-claims.json).

I'll hold the public summary for 24 h from this issue so you can point out anything I misread. — Carlos
