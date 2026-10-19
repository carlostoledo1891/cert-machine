# Carlos Toledo — resume (v3, the verification accent; drafted 2026-10-16, updated 2026-10-19; every send is the operator's)

_Independent research engineer · exact verification of machine-generated claims · benchmark and grader audits · verifiers that cannot be gamed_

carlos@carlostoledo.co · [OPERATOR FILLS phone]
carlostoledo.co · linkedin.com/in/carlos-toledo
github.com/carlostoledo1891/cert-machine

> [OPERATOR FILLS availability]

**I check what AI systems and benchmarks claim — in exact arithmetic, with code that shares nothing with the
claimant — and publish each verdict as a re-runnable certificate: certified, refuted with a witness, or refused with the
reason.**

## Benchmark and release audits | 2026 · all public

- **OpenAI's math release — 719 machine-generated manuscripts and 416 Lean challenges, audited at a pinned commit** ·
  [report](https://carlostoledo.co/reports/openai-math.html)
  - Every proof re-run under a second, independent kernel (nanoda, written in Rust): 398 of 416 accepted by both
    kernels and none rejected; the other 18 exceeded the runners' memory or time.
  - Every formal statement read against the claim it carries: 34 of 242 formalized families state a different or weaker
    theorem than their headline, with nothing saying so; 5 headlines rest on no machine-checked statement.
  - 44 published finite witnesses re-decided in standard-library Python written from the papers, none refuted. 14 gaps
    published, each pinned to file and line; a kernel fix posted upstream (ammkrn/nanoda_lib#44).
- **The graders of mathematical benchmarks, measured against 4,000 provably wrong answers** ·
  [report](https://carlostoledo.co/reports/envs.html)
  - Absolute-tolerance rules accept 3,582 of them; a certificate grader accepts none and rejects nothing right.
- **METR's time-horizon estimator, re-derived exactly** · [report](https://carlostoledo.co/reports/time-horizon.html)
  - 44 of 44 fits certified over METR's public runs; the post-2023 doubling time re-derives as 128.74 days against the
    printed 128.744.
- **GSM8K's answer key, every arithmetic step re-decided** · [report](https://carlostoledo.co/reports/gsm8k-audit.html)
  - 8,792 keys (test and train); 4,282 annotated steps, all exact; 26 printed steps wrong, 7 of them leaving the key's
    answer underived. Also [HorizonMath](https://carlostoledo.co/reports/horizonmath.html)'s Ramsey certificate, refuted.

## Independent certification of machine-generated mathematics | 2026

- **The Qiushi Engine's kissing-number bounds** · [report](https://carlostoledo.co/reports/kissing.html)
  - 19 of 19 announced bounds witnessed and every pair of 9.75 × 10¹⁵ decided exactly; the claimant published its point
    sets at the audit's request. Also the first independent certification of K(18) ≥ 8,358 (215 billion pairs, 0 violations).
- **Registries of AI-generated certificates**: Terence Tao's optimization-constants registry removed four "verification
  minimal" asterisks after our exact replays and cites them (#216, #230, merged 2026-10-18;
  [report](https://carlostoledo.co/reports/optimization-constants.html)); its PR queue 9 certified, 1 refused
  ([report](https://carlostoledo.co/reports/optconst-queue.html)); AlphaEvolve's community certificates 70 certified,
  2 refused ([report](https://carlostoledo.co/reports/alphaevolve-community.html)); Written on the Wall II 5 of 5.
- **Two Lean certificates read against their statements**: OpenAI's Navier–Stokes blowup — one clause of the paper's
  theorem missing at the announced commit, proved at the next ([report](https://carlostoledo.co/reports/navier-stokes.html)); the Qiushi Engine's
  disproof of Bandeira's Open Problem 0.2(a) — the finite core re-decided with a certificate of our own, two gaps at the
  claimant's declared boundary named ([report](https://carlostoledo.co/reports/bandeira.html)).
- **Theorems that calibrate the instruments**: λ(4) for Chowla's cosine problem (Erdős #510), re-certified by a third
  party with no shared code, same verdict ([report](https://carlostoledo.co/reports/lambda4.html)); δ₃ = 117/2192;
  bounds on Erdős #290 and #1038 (Zenodo doi:10.5281/zenodo.23171167).

## Financial model re-performance | October 2026

- **PU Verificado — every Tesouro Direto price since 2004 re-decided from the Treasury's own rule table** ·
  [report](https://carlostoledo.co/reports/pu-verificado.html)
  - 145,439 prices (2004–2026): 132,362 reproduced to the centavo (91.0%), 12,779 consistent with the printed rate's
    precision, 237 off with the exact value and the difference, 61 needing data the publisher kept; none refused.
  - Two deciders sharing no code (BigInt fixed point; Python decimal with directed rounding), both reproducing the
    methodology's worked examples before any row was decided; 17 checks and 12 red controls in the battery.
  - Conventions measured, never assumed: settlement on B3's trading calendar, pinned from 61 of the exchange's own
    documents; centavos truncated, not rounded; 17,911 prices that reproduce only under the holiday calendar in force on
    the quotation day. A daily feed re-decides the file and refuses a restated history.

## RL environments and verifiers | 2026

- **Three reward designs, one environment, on Prime Intellect's Hosted Training** — a
  [pre-registered](https://github.com/carlostoledo1891/cert-machine/blob/main/notes/lattice-claims-rl-preregistration-2026-10-04.md)
  GRPO study on Qwen3.5-9B: an answer key and an exact grader both extinguished abstention within ~10 steps, a ternary
  grader made the model abstain on everything. On the Environments Hub: `lattice-claims`, `blind-spot`, `break-the-grader`.
- **Writing:** *cert-machine: independent exact certification of machine-generated mathematics — the method and three
  benchmark exercises* (manuscript, draft v0.5, 52 pp, not peer-reviewed) · [PDF](https://carlostoledo.co/paper/cert-machine-method.pdf).

## How I work

Verifier first: a check that has never gone red is decorative, so every battery carries planted forgeries. Pre-registration
before any spend, deviations dated, negative results reported as results; every number read from a record.

- **Research:** Python (standard library, Inspect, verifiers, pytest), JavaScript (BigInt exact arithmetic,
  headless-Chrome gates), Lean 4 (statements, builds, axioms), SAT, LaTeX; GPU campaigns on RunPod; Hosted Training.
- **Product:** Figma, design systems, Webflow (CMS, GSAP, custom code), API integrations, SEO, accessibility.

## Experience

### cert-machine — Independent research engineer | 2026–present
The audits, the re-performance and the RL work above; open source, one author.

[OPERATOR FILLS experience]

## Education

[OPERATOR FILLS education]

---
Notes for the sender: every figure above is in a record. The sources:
- certs/openai-math-kernel.json, openai-math-statements.json, openai-math-finite.json, corpus/openai-math/findings.json;
- certs/horizon-ledger.json; certs/gsm8k-ledger.json; reports/envs.html's record (the graders);
- corpus/optconst-queue/registry-2026-10-18{,b}/record.json (the merges), certs/stepfun-replay.json (#232),
  certs/autocorr-replay.json (C₁d), certs/erdos1/buffer-structure.json (the 48 cases);
- certs/kissing-wave.json and kissing-ledger.json (the Qiushi rows); certs/aerp-ledger.json, optq-ledger.json,
  wowii-ledger.json; certs/bandeira-ledger.json; certs/lambda4-audit.json; certs/delta3-ledger.json;
  certs/claims-ledger.json and certs/mc100-*.json;
- certs/pu-ledger.json (the counts are written into this file by the ledger run that produced them; a «mark» left
  unfilled means the ledger was not re-read);
- notes/lattice-claims-rl-preregistration-2026-10-04.md and instruments/wiring/PROVENANCE.json.

The Petrobras pages are public; the university group stays unnamed until it agrees. The number 131 is the register's
count of published claims decided since August 2026 as the landing page states it; re-read it before sending.

The personal lines (phone, availability, prior employment, education) live in resume.private.md beside this file,
which is git-ignored; `node outreach/build-resume-pdf.js outreach/resume` substitutes them for the [OPERATOR FILLS name]
marks and writes resume.pdf here, and any mark left unfilled prints on a yellow highlight.
