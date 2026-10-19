# Nous Research — Machine Learning Engineer, Evals (packet drafted 2026-10-16, updated 2026-10-19; the send is the operator's)

Written for: the Nous Research hiring team reading the ML Engineer, Evals applications.

Posting: https://jobs.ashbyhq.com/nousresearch/1e647dc1-e69c-4764-8a02-7244b8faee0b. Pinned as read on 2026-10-16
(Ashby job-board API) in posting-2026-10-16.txt. Remote, "Americas (US time zones)" — Florianópolis is UTC−3, one to two
hours ahead of US Eastern, so the whole US-East day overlaps; compensation unlisted. The posting's five responsibilities
map onto work already public here (below); its one hard framework ask (Harbor, Nemo Evaluator) is a gap.

What the Ashby form takes (read the live form): name, email, resume, LinkedIn, GitHub, website, location / work
authorization, and usually a free-text field or two.

## Attach

- `outreach/resume/resume.pdf` (v3, verification accent).
- Links: carlostoledo.co · github.com/carlostoledo1891/cert-machine ·
  app.primeintellect.ai/dashboard/environments/carlos-toledo/lattice-claims (an environment with three graders and QA).
- FRESHEST RESULT (2026-10-18): https://carlostoledo.co/reports/optimization-constants.html — Terence Tao's
  optimization-constants registry removed four "verification minimal" asterisks on our exact replays (pull requests
  #216 and #230, merged; the pages cite the replays). An outside record-keeper changing a public record on the
  verdict alone is the strongest validation the work has; lead with it where the form allows a link.
- ALSO FRESH (2026-10-16 night): https://carlostoledo.co/reports/curve-seeds.html — Anthropic's curve-seeds claim audited the evening it appeared (34/34 checkable rows; what the post claims beyond what it checks, as six readings): failure analysis and reproduction discipline in one page.
- Writing samples: https://carlostoledo.co/reports/envs.html (grader calibration against ground truth that is a proof);
  https://carlostoledo.co/reports/openai-math.html (failure analysis of a release: 14 gaps categorized, ranked,
  each with what would close it); https://carlostoledo.co/reports/time-horizon.html (eval statistics: a published
  estimator with certified error bars).

## Free text: relevant work (~230 words), responsibility by responsibility

**Judge calibration.** I measured four grader families against 4,000 answers that are provably wrong, with the labels
being proofs rather than human votes: absolute-tolerance rules accept 3,582 of them (tolerances pooled), a certificate
grader accepts none and rejects nothing right. The same page re-runs from its record, so anyone can re-run it with a new grader — the
protocol your posting asks for, with exact ground truth in place of sampled human labels where the task allows it.

**Extending a benchmark with graders and QA.** `lattice-claims` on Prime Intellect's Hub: three graders (an answer key,
an exact grader that pays a decided abstention, a ternary grader), a due-split rubric, a calculator-tool mode; its task
generator pinned byte-identical across releases and each release verified by installing it from the registry. A
pre-registered GRPO study on it came out negative and was published as such.

**Failure analysis.** OpenAI's math release audited at a pinned commit: 14 gaps, each categorized (headline not checked ·
check weaker than shown · cannot be re-checked as shipped · documentation), ranked, pinned to file and line, with the
change that would close it. Two kernels agree on 398 of 416 proofs; the 18 others are reported as refused, with the reason.

**Eval statistics.** METR's time-horizon estimator re-derived with a certified enclosure for every fit (44 of 44); the
printed point estimates sit within solver tolerance of the enclosure. Non-determinism, truncations and refusals are
recorded as what they are, never folded into a rate.

**Outside acceptance.** Terence Tao's optimization-constants registry removed four "unverified" marks after my
exact replays of their certificates (two pull requests merged on 2026-10-18), and its pages cite the replays.

**Recurring workflow.** A daily feed (GitHub Actions) that re-decides 145,000 published prices whenever the publisher's
file changes, refuses a restated history and logs it.

## Facts to hold to, and gaps to state plainly if asked

- Frameworks: verifiers (Prime Intellect) and Inspect (UK AISI) hands-on, with specific findings on both (three platform
  faults found and reported on verifiers/Hosted Training); Harbor and Nemo Evaluator NOT used. Say so; offer the
  opinion on the two used.
- Agent benchmarks (GAIA, τ-Bench, SWE-bench): not run here. The evaluation work is mathematics and reasoning.
- RLVR pipeline: one pre-registered GRPO study, LoRA, hosted; no pipeline ownership.
- The 3+ years: software engineering since 2010 (product/Webflow), research-adjacent evaluation work in 2026.
- Numbers above are read from the records named in resume.md's sender notes; re-read before sending (last re-read 2026-10-19).

Status: NOT SENT. The operator reviews, fills the marks, builds the PDF, submits.
