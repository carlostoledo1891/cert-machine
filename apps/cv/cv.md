# Carlos Toledo — CV

_Independent research engineer · exact verification of machine-generated claims · benchmark and grader audits · verifiers that cannot be gamed_

carlos@carlostoledo.co · carlostoledo.co
github.com/carlostoledo1891/cert-machine · linkedin.com/in/carlos-toledo

**I check what AI systems and benchmarks claim — in exact arithmetic, with code that shares nothing with the
claimant — and publish each verdict as a re-runnable certificate: certified, refuted with a witness, or refused with the
reason.**

## Benchmark and release audits | 2026 · all public

- **OpenAI's math release — {{oai_manuscripts}} machine-generated manuscripts and {{oai_challenges}} Lean challenges, audited at a pinned commit** ·
  [report](https://carlostoledo.co/reports/openai-math.html)
  - Every proof re-run under a second, independent kernel (nanoda, written in Rust): {{oai_certified}} of {{oai_challenges}} accepted by both
    kernels and none rejected; the other {{oai_refused}} exceeded the runners' memory or time.
  - Every formal statement read against the claim it carries: {{oai_short}} of {{oai_families}} formalized families state a different or weaker
    theorem than their headline, with nothing saying so; {{oai_gaps}} gaps published, each pinned to file and line; a kernel fix posted upstream.
- **Two claimed refutations of the Exponential Time Hypothesis (OpenAI, Anthropic), replayed** ·
  [report](https://carlostoledo.co/eth/)
  - Both proofs accepted by two kernels; the statements read against the textbook ETH by two independent readers; the
    textbook ETH written once in Lean and each lab's statement proved to refute it in its own machine model.
  - Both chains then carried to the standard multitape machine in one Lean each; two results merged into complexitylib.
- **The graders of mathematical benchmarks, measured against {{envs_n}} provably wrong answers** ·
  [report](https://carlostoledo.co/reports/envs.html)
  - Absolute-tolerance rules accept {{envs_k}} of them; a certificate grader accepts none and rejects nothing right.
- **METR's time-horizon estimator, re-derived exactly** · [report](https://carlostoledo.co/reports/time-horizon.html)
  - {{hz_certified}} of {{hz_fits}} fits certified over METR's public runs; the post-2023 doubling time re-derives to {{hz_dbl23}} days, against the
    printed {{hz_printed23}}.
- **GSM8K's answer key, every arithmetic step re-decided** · [report](https://carlostoledo.co/reports/gsm8k-audit.html)
  - {{gsm_keys}} keys (test and train); {{gsm_steps}} annotated steps, all exact; {{gsm_wrong}} printed steps wrong, {{gsm_underived}} of them leaving the key's
    answer underived.

## Independent certification of machine-generated mathematics | 2026

- **The Qiushi Engine's kissing-number bounds** · [report](https://carlostoledo.co/reports/kissing.html)
  - {{kiss_rows}} of {{kiss_rows}} announced bounds witnessed and every pair of {{kiss_pairs}} decided exactly; the claimant published its point
    sets at the audit's request and credits the check in its README. Also the first independent certification of K(18) ≥ {{k18_claimed}}
    ({{k18_pairs}} pairs, 0 violations).
- **Registries of AI-generated certificates**: Terence Tao's optimization-constants registry removed {{asterisks}} asterisks
  on our exact replays (four merged pull requests) and cites [T2026]
  ([report](https://carlostoledo.co/reports/optimization-constants.html)); its PR queue {{optq_cert}} certified, {{optq_ref}} refused
  ([report](https://carlostoledo.co/reports/optconst-queue.html)); AlphaEvolve's community certificates {{aerp_cert}} certified,
  {{aerp_ref}} refused ([report](https://carlostoledo.co/reports/alphaevolve-community.html)); Written on the Wall II {{wowii_cert}} of {{wowii_cert}}; C₈₉'s author thanked the replays.
- **Erdős problems against DeepMind's statements**: #488, Gessel's GPT-6 Astra refutation certified by two
  kernels and two deciders, all {{e488_planted}} planted fakes caught ([report](https://carlostoledo.co/reports/erdos-488.html)); #174, Pálvölgyi's
  Theorem A.3 proved in Lean as stated, on Palomar ([report](https://carlostoledo.co/reports/heptagon.html)).
- **“ℤ is Diophantine in ℚ” (Glazer, AI-produced)**: the {{zq_vars}}-variable count re-derived; the Version 4 quartic's
  {{zq_v4_steps}} certificate steps replayed; the Lean target proved from eight named hypotheses ([report](https://carlostoledo.co/z-in-q/)).
- **Also**: OpenAI's Navier–Stokes blowup, a clause missing at the announced commit ([report](https://carlostoledo.co/reports/navier-stokes.html)); Bandeira's
  0.2(a), two gaps named ([report](https://carlostoledo.co/reports/bandeira.html)); λ(4), re-certified by a third party ([report](https://carlostoledo.co/reports/lambda4.html)); δ₃ = 117/2192.

## Financial model re-performance | October 2026

- **PU Verificado — every Tesouro Direto price since 2004 re-decided from the Treasury's own rule table** ·
  [report](https://carlostoledo.co/reports/pu-verificado.html)
  - {{pu_total}} prices (2004–2026): {{pu_reproduced}} reproduced to the centavo, {{pu_consistent}} consistent with the printed rate's
    precision, {{pu_off}} off with the exact value and the difference, {{pu_needs}} needing data the publisher kept; two deciders.

## RL environments, verifiers and the visual grammar | 2026

- **Three reward designs, one environment, on Prime Intellect's Hosted Training** — a pre-registered GRPO study:
  an answer key and an exact grader both extinguished abstention within ~10 steps, a ternary grader made the model abstain
  on everything. On the Environments Hub: `lattice-claims`, `blind-spot`, `break-the-grader`.
- **WARRANT, a visual grammar in which every mark says what it rests on** · [the rules](https://carlostoledo.co/grammar/)
  - The stroke says how a number was made, words carry the verdict; the site refuses to build a page that breaks a rule.
- **Writing:** cert-machine: independent exact certification of machine-generated mathematics (method paper, draft, not
  peer-reviewed) · [PDF](https://carlostoledo.co/paper/cert-machine-method.pdf). Outside re-derivations of the verdicts, all
  concordant, are on the record with their authors' names ([report](https://carlostoledo.co/reports/rerun.html)).

## How I work

Verifier first: a check that has never gone red is decorative, so every battery carries planted forgeries. Pre-registration
before any spend, deviations dated, negative results reported; every number read from a record, this page's included.

- **Research:** Python (standard library, Inspect, verifiers, pytest), JavaScript (BigInt exact arithmetic,
  headless-Chrome gates), Lean 4 (statements, builds, axioms, two kernels), SAT, LaTeX; GPU campaigns on RunPod; Hosted Training.
- **Product:** design systems and the visual grammar, Figma, Webflow (CMS, GSAP), API integrations, SEO, accessibility.

## Experience

### cert-machine — Independent research engineer | 2026–present
The audits, the re-performance, the RL work and the grammar above; open source, one author.

[OPERATOR FILLS experience]

## Education

[OPERATOR FILLS education]

---
Notes: every figure token above is read from a record by apps/cv/build.js at build time (the map is in that file); the
experience and education blocks come from outreach/resume/resume.private.md (git-ignored); the build refuses to publish
while a mark or a figure is unfilled. Published at https://carlostoledo.co/cv/ (a redirect to the PDF).
