# FAR.AI — Research Engineer, evals and red-teaming pod (packet drafted 2026-10-16, updated 2026-10-19; the send is the operator's)

Written for: the FAR.AI hiring team reading the Research Engineer applications.

Posting: https://jobs.ashbyhq.com/far.ai/52e76732-999b-402f-a908-c4e8b3e7714b. Pinned as read on 2026-10-16 (Ashby
job-board API) in posting-2026-10-16.txt. "Remote (International)" explicit — "can hire remotely in most countries",
outside the US/Singapore via an EOR or as a contractor; $150–250K, adjusted for location; 40 h/week. Essentials:
significant software-engineering or applied-ML experience with public evidence (open source counts), Python,
results-oriented. Preferred: PyTorch/TensorFlow, NLP or RL, OS/distributed systems, publications or OSS, the maths.
"We encourage applications from strong software engineers who are new to ML."

What the Ashby form takes (standard FAR.AI form; read the live form before filling): name, email, phone, location,
resume, LinkedIn, GitHub, website, work-authorization / location questions, and usually one or two free-text fields
(why FAR.AI; relevant work). Pod to name: **Evals and red-teaming**.

## Attach

- `outreach/resume/resume.pdf` (v3, verification accent).
- Links: github.com/carlostoledo1891/cert-machine (the whole lab, MIT, no dependencies) · carlostoledo.co.
- FRESHEST RESULT (2026-10-18): https://carlostoledo.co/reports/optimization-constants.html — Terence Tao's
  optimization-constants registry removed four "verification minimal" asterisks on our exact replays (pull requests
  #216 and #230, merged; the pages cite the replays). An outside record-keeper changing a public record on the
  verdict alone is the strongest validation the work has; lead with it where the form allows a link.
- ALSO FRESH (2026-10-16 night): https://carlostoledo.co/reports/curve-seeds.html — a frontier lab's cryptographic claim (Anthropic, the NIST curve seeds) re-decided from POSIX/X9.62/FIPS/FreeLIP the same evening, 34/34 rows, red controls, readings named. For a pre-deployment-testing pod this is the shape of the work: fast, independent, scoped.
- Writing samples, in this order: https://carlostoledo.co/reports/openai-math.html (a frontier release tested before
  anyone else did: two kernels, every statement read, 14 gaps); https://carlostoledo.co/reports/kissing.html (the
  GPU-scale campaign: 9.75 × 10¹⁵ pairs decided exactly on rented pods, the claimant publishing its points at the
  audit's request); https://carlostoledo.co/reports/envs.html (graders measured against provably wrong answers).

## Free text: relevant work / why FAR.AI (~210 words)

Your evals pod tests frontier models before release on behalf of their developers and governments. The part of that
work I have done this year is the discipline that makes a test's result hold up: pre-registration before any spend,
red controls (forgeries the check must catch) in every battery, re-derivation by a second implementation that shares
no code, and refusal as a reported verdict rather than a silent gap.

Applied, all public: OpenAI's October math release re-run under a second, independent Lean kernel (398 of 416 proofs
accepted by both, none rejected; the 18 that exhausted a 16 GB runner reported as refused, not dropped) with every formal
statement read against its headline — 34 of 242 families state less than they claim. The Qiushi Engine's nineteen
kissing-number bounds: 9.75 × 10¹⁵ pairs decided exactly on RunPod GPUs, the campaign scripts and cost records in the
repository. Three registries of AI-generated certificates audited in a day (AlphaEvolve's community certificates,
70 certified / 2 refused; a PR queue where one submission's checkers decide assembly rather than analysis — refused and
said so), after which Terence Tao's optimization-constants registry removed four "unverified" marks on my replays. On
the RL side, a pre-registered GRPO study whose result was negative and published as such.

I am a strong software engineer newer to ML training than to verification; the posting says to apply anyway, so I am.
Remote from Brazil (UTC−3), contractor or EOR, as your logistics section allows.

## Facts to hold to, and gaps to state plainly if asked

- ML training depth: LoRA GRPO on a hosted trainer (Qwen3.5-9B), not distributed pre-training or large fine-tunes;
  no PyTorch training code of our own in the repository. Say it.
- Adversarial ML / jailbreaking: the adversarial work here is against graders and checkers (break-the-grader,
  blind-spot, the grader audit), not against model safety training. Related, not the same.
- Publications: none at ML venues; the method paper is a manuscript (draft v0.5, not peer-reviewed).
- Numbers above are read from the records named in resume.md's sender notes; re-read before sending (last re-read 2026-10-19).

Status: NOT SENT. The operator reviews, fills the marks, builds the PDF, submits.
