# Carlos Toledo — resume (v4, the oversight accent; 2026-11-02; v3 of 2026-10-19 is in git; every send is the operator's)

_Independent research engineer · independent verification of AI-generated claims · graders that cannot be gamed · founder of Verify_

carlos@carlostoledo.co · [OPERATOR FILLS phone]
carlostoledo.co · linkedin.com/in/carlos-toledo
github.com/carlostoledo1891/cert-machine

> [OPERATOR FILLS availability]

**I check what AI systems, labs and benchmarks claim — in exact arithmetic, with code that shares nothing with the
claimant — and publish each verdict as a re-runnable certificate: certified, refuted with a witness, or refused with the
reason. 131 published machine-generated claims decided since August 2026; the work has been re-run by outsiders, cited
by registries and written about in the press.**

## Audits of frontier-lab releases | 2026 · all public

- **Two claimed refutations of the Exponential Time Hypothesis, OpenAI's and Anthropic's** ·
  [report](https://carlostoledo.co/eth/)
  - Both Lean proofs replayed from their pinned bytes under two kernels (Lean's, inside the FRO's Comparator, and nanoda):
    both accepted against their own statements on the three standard axioms, a day after release.
  - Neither statement is the textbook ETH, so I wrote it once in Lean and proved each lab's statement refutes it in that
    lab's own machine model: 51 bridge theorems, each through Lean's kernel twice and nanoda. The verdict on "ETH is
    false" stays “not decided”: two textbook steps between machine models remain prose, in both labs' work and mine.
  - Led Reg Saddler's column The Build (29 Oct): "A Researcher in Brazil Replayed OpenAI's and Anthropic's
    Complexity Proofs."
- **OpenAI's math release — 719 machine-generated manuscripts and 416 Lean challenges, audited at a pinned commit** ·
  [report](https://carlostoledo.co/reports/openai-math.html)
  - Every proof re-run under a second, independent kernel: 398 of 416 accepted by both and none rejected; 18 exceeded
    the runners' memory or time. A kernel fix posted upstream (ammkrn/nanoda_lib#44).
  - Every formal statement read against the claim it carries: 34 of 242 formalized families state a different or weaker
    theorem than their headline, with nothing saying so. Cited by whataifound.org, which corrected its "no outside
    checks" entry on these reports.
- **Also audited:** [AlphaEvolve's 18 Ramsey graphs](https://carlostoledo.co/reports/ramsey-graphs.html) (17 certified,
  1 refused while its search runs); [AlphaProof Nexus](https://carlostoledo.co/reports/alphaproof-nexus.html) (two
  kernels; 3 "new" OEIS proofs already on record); [NIST's ECDSA curve seeds](https://carlostoledo.co/reports/curve-seeds.html) (34 of 34).

## Graders, reward hacking and RL environments | 2026

- **Tolerance graders measured against 4,000 provably wrong answers** · [report](https://carlostoledo.co/reports/envs.html)
  - Absolute-tolerance rules accept 3,582 of them (89.55%); a certificate grader accepts none and rejects nothing right.
    A policy trained against a tolerance grader is rewarded for exactly those answers.
- **Verify Gym, on Prime Intellect's Environments Hub** (`carlos-toledo/verify-gym`, pre-registered)
  - 7 open-weights models scored by two exact deciders with no disagreement: every one below a plain exact-bisection
    baseline (0.340).
  - As a best-of-8 filter, the verifier lets through 0 false answers on every model, against 35–76 of 120 for the first
    answer and 26–62 for majority vote; 2,953 certified answers kept as a dataset.
- **Three reward designs, one environment, on Prime Intellect's Hosted Training** — a
  [pre-registered](https://github.com/carlostoledo1891/cert-machine/blob/main/notes/lattice-claims-rl-preregistration-2026-10-04.md)
  GRPO study on Qwen3.5-9B: an answer key and an exact grader both extinguished abstention within ~10 steps; a ternary
  grader made the model abstain on everything.
- **Benchmark keys:** [GSM8K](https://carlostoledo.co/reports/gsm8k-audit.html)'s 8,792 keys re-decided (26 printed
  steps wrong); [METR's time horizon](https://carlostoledo.co/reports/time-horizon.html), 44 of 44 fits certified.

## A verifier attacked before it is trusted | 2026

- **The self-audit** · [report](https://carlostoledo.co/reports/selfaudit.html) — 572 pre-registered mutants of 119
  published claims, each false one witnessed by a script sharing no code with the decider: 0 false certifications and 0
  false refutations, after the campaign found 77 defects in the verifier itself (fixed, kept on the record). A
  floating-point check at 10⁻⁶ accepted 82 of 295 of the same false values.
- **Re-run from outside:** three people re-derived seven of the verdicts, five with their own code — no disagreement.
- **Cited where it was checked:** Terence Tao's optimization-constants registry removed ten "verification minimal"
  asterisks on our replays in four merged pull requests (#216, #230, #232, #243) and cites them as [T2026]; one row
  corrected on our check. The Qiushi Engine's authors credit the independent verification of all 19 of their
  kissing-number dimensions in their README (9.75 × 10¹⁵ pairs decided exactly).
- **Writing:** the [method paper](https://carlostoledo.co/paper/cert-machine-method.pdf) (draft v0.10, 46 pp, not
  peer-reviewed); Zenodo doi:10.5281/zenodo.22225860.

## How I work

Verifier first: a check that has never gone red is decorative, so every battery carries planted forgeries.
Pre-registration before any spend, deviations dated, negative results reported as results; every number read from a
record. My tools are built with Claude; every verdict is decided by exact arithmetic or a proof kernel, never by a model.

- **Research:** Python (standard library, Inspect, verifiers, pytest), JavaScript (BigInt exact arithmetic,
  headless-Chrome gates), Lean 4 (statements, bridges, Comparator, nanoda), SAT, C, LaTeX; GPU and CPU campaigns on
  RunPod; Prime Intellect Hosted Training and Environments Hub.
- **Product:** Figma, design systems, Webflow (CMS, GSAP, custom code), API integrations, SEO, accessibility.

## Experience

### cert-machine and Verify — Independent research engineer, founder | 2026–present
The audits, the graders and the RL work above, and [PU Verificado](https://carlostoledo.co/reports/pu-verificado.html)
(145,679 Brazilian Treasury prices re-decided from the rule table, 91.0% to the centavo); open source, one author.
[Verify](https://carlostoledo.co/verify/) is the product built on it: graders that cannot be gamed and independent audits.

[OPERATOR FILLS experience]

## Education

[OPERATOR FILLS education]

---
Notes for the sender: every figure above is in a record. The sources:
- certs/eth-kernel.json (two claims, two kernels), certs/eth-bridge.json (51 theorems, run 40947192141), the column:
  corpus/recognition.json the-build-eth-column (pinned snapshot);
- certs/openai-math-kernel.json (398/416), openai-math-statements.json (34/242), corpus/recognition.json
  whataifound-openai-math;
- certs/ramsey-ledger.json (17 CERTIFIED, 1 REFUSED); reports/alphaproof-nexus.html; reports/curve-seeds.html (34/34);
- reports/envs.html's record (3,582/4,000); certs/verify-gym-scorecard.json (7 rows, bisect 0.340417);
  certs/verify-gym-filter.json (verify 0 false; first 35–76, majority 26–62; dataset 2,953 rows);
  notes/lattice-claims-rl-preregistration-2026-10-04.md;
- certs/gsm8k-ledger.json; certs/horizon-ledger.json;
- certs/selfaudit-*.json (572 mutants, 77 defects, 82 of 295 at 10⁻⁶); corpus/external-reruns.json (7 rows, 3 people);
- corpus/recognition.json (registry rows: 3 + 1 + 4 + 2 asterisks, C₈₄b; the Qiushi README); certs/kissing-wave.json;
- certs/claims-ledger.json and the landing (131 decided); site/paper/cert-machine-method.pdf (v0.10, 46 pages);
- certs/pu-ledger.json (145,679 rows, 132,538 reproduced).

The university group stays unnamed until it agrees. Re-read 131 and the registry count against the landing before
sending.

The personal lines (phone, availability, prior employment, education) live in resume.private.md beside this file,
which is git-ignored; `node outreach/build-resume-pdf.js outreach/resume` substitutes them for the [OPERATOR FILLS name]
marks and writes resume.pdf here, and any mark left unfilled prints on a yellow highlight.
