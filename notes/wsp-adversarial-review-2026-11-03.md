# Weight-Space Programming — the adversarial review (2026-11-03, written while Stage 3 runs)

The operator's brief of 11-03 ("seeking the measured version") is taken as written: two loud versions, no measured one;
cert-machine's job is the reference both sides cite. This note expands it with what the pinned artifacts allow and turns
the critic's thread on OUR work too. Nothing here is a verdict; verdicts live in certs/.

## 0. Status of the inputs (what is on disk, pinned)

- corpus/wsp/.cache/logs = RikiyaT/lm_understand-logs @ 4d09ba6d (360 MB): exp1_which_game, exp2_diffusion,
  exp3_language, exp4_fix_car, exp5_write_from_scratch, exp6_go_from_scratch, exp7_sycophancy, exp8_math, harness.
  So M2–M5 of the brief are DESK reads of already-pinned bytes, free; only M1 needs the GPU (running: pod x9gnpx07fzx4up).
- The critic's thread is NOT pinned: its URL is not in the brief. Until it is snapshotted (tools/pin-snapshot pattern)
  the critic's numbers are quoted from the brief, dated, and marked "unpinned".

## 1. The critic's claims, each against what can decide it

| # | claim (critic unless noted) | rests on | decidable here | where |
|---|---|---|---|---|
| M1a | "up to 6×" (claimants) | the 7.9 baseline in a looping regime | yes — C1/C2/C3 | certs/wsp-baseline.json |
| M1b | no-edit non-thinking scores 47% | an unpublished run; grader, samples, prompt, max_tokens unknown | yes for OUR arm C3; his number itself REFUSED until his setup is shared | same |
| M2 | the dose was picked over thousands of test answers | the run history (p50c turns: 158 turns, requests/, readable/) | yes: which problems scored trials 1–6; whether any MATH-500 / GSM8K-test item was ever in a forward-pass request | tools/wsp-side-claims.py |
| M3 | Frogger answered, Freeway credited | exp1_which_game/eval + runs | yes: Astra's literal answer per network vs the ground truth and the scorer's rule | same |
| M4a | car policy weights set to the hundreds (up to 876) | exp4_fix_car/networks (checkpoint bytes before/after) | yes: per-tensor max |value| before and after, the edited entries | same |
| M4b | "100%" on one level / one run replayed | exp4_fix_car/eval config | yes: levels, seeds, episodes | same |
| M5a | 20× over PPO; PPO weak; Astra lost in two other games | exp6_go_from_scratch / the game evals, as released | partly: PPO scores per run as released; "weak" is a judgement; the critic's 25-line script is HIS claim, not re-run | same |
| M5b | sycophancy "failed from weights alone" | exp7_sycophancy (code, dataset, eval, runs, models.sha256) | yes: what the released eval says, per run | same |
| — | "LLMs read and rewrite weights like code" (claimants) | framing | no | — |
| — | "bullshit", "LARPER" | tone | no | — |

Rules (the brief's, kept): a claim is decided only against pinned inputs we can re-fetch; a claim with no released
source is REFUSED, stated as a limit, never as a finding against its author.

## 2. The adversary's reading of OUR verification (what a hostile reviewer would say, and the answer)

1. **One grader.** instruments/wsp/grade.py is a single implementation. A bug would move both sides equally, but a bug in
   `extract_boxed` would move the "boxed share" readings, which carry the termination story. Answer: the 0-disagreement
   comparison with math-verify on 980 decided answers and 440 identical extractions bound the damage; a JS second grader
   is owed before the baseline number is quoted publicly (HANDOFF item).
2. **Sampling noise.** 2,000 generations per arm: the standard error of an accuracy near 10% is ≈0.7 points (treating
   samples as independent; problems are not, so ≈1.5 points is the honest figure near 30%). A band edge crossed by less
   than 2 points is "at the edge", and the record says so (the amended reading below carries that flag).
3. **vLLM is not bitwise reproducible across batch compositions** even with a seed; C1 is therefore a REPRODUCTION of
   7.9 within noise, not a replay. The stop rule (C1 within 7.9 ± 3) is the test.
4. **The text-only export vs the multimodal release.** The post evaluated a text-only export; the card's re-run and we
   run the full release (language-model tensors hash-identical). The vision tower is never prompted. C1 is the test.
5. **Qwen's own card gives the settings the critic cites** — temperature 1.0 / top_p 1.0 / presence 2.0 for non-thinking
   text. If the critic used something else (no "step by step" line, no empty think block in the template, 8k tokens, a
   lenient grader, greedy decoding), his 47% is a different experiment. Only his setup decides that; ask for it.
6. **C2 may loop again at 81,920 tokens.** If so, "both no-edit arms low" would be partly the loop pathology, not the
   model's ability; the non-thinking arm C3 is then the fair denominator and the report must say which arm it leans on.
7. **The edited model under the card's settings (C4)** is the like-for-like lift; without it a critic can say the edit
   was only ever compared in the looping regime. The brief's arm 4 (edited under the POST's settings) already exists as
   the card's independent re-run: 51.0% on 2,000 released flags, re-graded here (certs/wsp-regrade.json). It is kept as
   that control; a fifth arm would be a second copy of it.
8. **"Termination" could hide "solving".** Accuracy given a box fell from 35/35 to 241/303; the record states both. The
   baseline arms record the same two numbers, so the reader can see whether the no-edit model that finishes also solves.
9. **Selection (G6).** 48.1 is one run of several; our own numbers are one run per arm, pre-registered, never re-run.
   Variance across runs is unknown on both sides; the report says so.
10. **The authors' good faith.** They released the checkpoint, the diff, the logs and the texts behind 500 of 2,000
    flags per run; that is why any of this is checkable, and the report says so first, before any slip.

## 3. The amended pre-registration (bands and stop rules), dated

Added to notes/wsp-stage3-preregistration-2026-11-02.md at 12:40 UTC on 11-03, while C1 (the control) was running and
before any no-edit card-settings token (C2, C3) existed. The reading in tools/wsp-baseline.py implements it as written.

- Stop rule A: C1 (the post's settings, unedited) must land within 7.9 ± 3 points (all-samples floor); otherwise the
  setup does not reproduce the claimants' and the record says "no verdict on the multiplier".
- Stop rule B (the edited control): the card's re-run (51.0, 2,000 flags re-graded here) stands within 48.1 ± 4; C4, if
  it runs, is the like-for-like lift under the card's settings, not a control.
- Outcome bands on the BEST no-edit card-settings arm (C2 or C3; the larger of first-sample and all-sample floor):
  below 15% → HOLDS (the edit adds most of the gain; the critic's 47% REFUTED as stated);
  15 to 40% → OVERSTATED (a real gain over a fair baseline, smaller than 6×; the critic's 47% REFUTED as stated, direction right);
  40% or above → MOSTLY A SETTINGS EFFECT (the critic's number close to CERTIFIED if C3 is within 5 points of 47).
- Noise flag: a best arm within 2 points of a band edge is reported "at the edge".
- The multiplier itself is re-stated as 48.1 over the best no-edit arm, pointed.

## 4. Order of work (this session)

1. [running] M1 on the pod (C1 → C3 → C2 → C4), import as each finishes.
2. [now] M2–M5 from the pinned logs by a desk agent: tools/wsp-side-claims.py → certs/wsp-side-claims.json (facts +
   verdicts per claim, REFUSED where not released), with corpus/wsp/side-claims.md as the readable finding.
3. [after M1] the report restructured as the brief says: termination and the baseline first, then the dose and where it
   was tuned (M2), then selection with the Gemma control beside §3, counting slips last; W6's cell says "a search limit".
4. [after the record] the authors get the record first (a GitHub issue on RikiyaT/lm_understand-logs, the channel rule),
   with a response window; the critic gets the record and a request for his setup; X last. Every number links its record.

Open: the critic's thread URL (to pin it); the window length for the authors (proposal: 24 h).
