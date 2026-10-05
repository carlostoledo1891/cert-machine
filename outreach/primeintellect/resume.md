# Carlos Toledo — resume (DRAFT 2026-10-05, for Prime Intellect, Applied Research – Forward-Deployed; sending it is the operator's)

_Independent research engineer · verifiers, RL environments, exact certification_

carlos@carlostoledo.co · [OPERATOR FILLS phone]
carlostoledo.co · linkedin.com/in/carlos-toledo
github.com/carlostoledo1891/cert-machine

> [OPERATOR FILLS availability: location · remote or visits · relocation and visa; the posting is SF hybrid-remote with visa sponsorship]

**I build environments and verifiers whose rewards cannot be gamed, and I run them on your stack.** I publish
on the Environments Hub as `carlos-toledo`, and I train and diagnose with Hosted Training, verifiers and Prime
Sandboxes.

## On Prime Intellect's stack | October 2026 · all public

- **Three reward designs, one environment: a pre-registered RL experiment on Hosted Training**
  - Setup: lattice-claims on Qwen3.5-9B, LoRA GRPO. The task asks the model to decide a claim, or to abstain
    when a quantity is missing.
  - Arms: (A) an answer key; (B) an exact grader that pays a decided abstention; (C) a ternary +1/0/−1 grader.
  - Results: A and B both extinguished abstention within ~10 steps. C made the model abstain on everything.
  - Mechanism, from the logged per-step metrics: once guessing is universal, the exact grader's incomplete-task
    groups score uniformly and carry no gradient; under the ternary grader, answering a 50/50 task is worth ~0.
  - Conclusion: the binding constraint was the policy's ability to decide, not the reward. Gates were set
    before any spend, and every deviation is dated in the
    [pre-registration note](https://github.com/carlostoledo1891/cert-machine/blob/main/notes/lattice-claims-rl-preregistration-2026-10-04.md).
- **Three platform faults, found and handled**
  - The hosted Qwen3.5-4B trainer delivered no policy updates. Three launches stalled at "Waiting for new
    policy"; I reported it via `prime feedback` with run IDs and logs, and routed around it with model gates
    on the 2B and 9B.
  - verifiers 0.3.1's legacy `SandboxEnv` cannot be built with any prime-sandboxes release it accepts:
    0.2.39–0.2.42 refuse a string start command unless `vm=False`, and 0.3.0+ accept only `StartCommand`.
    lattice-claims 0.4.1 carries a scoped repair, verified on a real sandbox. A pin to `<0.3` silently kept
    the hosted env-server from starting, which a two-control probe isolated.
  - On Hosted Training every run of the sandbox-tool environment sat without loading, while the same package
    without the tool trained in under 90 s. I shipped an in-process calculator tool instead; it loads and
    trains.
- **On the Environments Hub: [`carlos-toledo/lattice-claims`](https://app.primeintellect.ai/dashboard/environments/carlos-toledo/lattice-claims) v0.5.1**
  - Three graders and a due-split rubric; a calculator-tool mode (`tools="calc"`) beside the sandbox mode.
  - Its task generator is pinned byte-identical to 0.1.0 through every release, and each release is verified
    by installing it from the registry.
  - Also on the Hub: `blind-spot` (RTL mutation kills checked by simulating the netlist; SAT-proved
    equivalence) and `break-the-grader` (adversarial submissions minted from exact certificates).

## Verification work | 2026 · the same discipline, outside RL

- **The September 2026 kissing-number wave, decided exactly** · [report](https://carlostoledo.co/reports/kissing.html)
  - 11 published configurations, 215,015,141,413 pairs, 0 violations.
  - The first independent certification of K(18) ≥ 8,358, a +704 jump on the published record that nobody
    had checked; and the K(25)–K(31) race between three groups.
- **100 machine-generated claims, pre-registered by rule before any was decided**
  - Sources: AlphaTensor, AlphaEvolve, EinsteinArena, the Station. Wave 1 decided 46: 45 CERTIFIED,
    1 REPAIRED.
  - The open 605 and 842 rungs are proved infeasible, with the platform's penalty reproduced to every printed
    digit. The Station's 3-D map with constant Jacobian determinant −6 is certified non-injective.
- **METR's time-horizon estimator, re-derived exactly** · [report](https://carlostoledo.co/reports/time-horizon.html)
  - 44 of 44 fits certified; the doubling time 128.74 days against the printed 128.744.
- **A benchmark's checker refuted, and an answer key audited**
  - [HorizonMath](https://carlostoledo.co/reports/horizonmath.html)'s Ramsey certificate refuted; an exact
    audit of [GSM8K](https://carlostoledo.co/reports/gsm8k-audit.html)'s answer key.

## Forward-deployed, in practice | 2026

- **Two decision tools, submitted to Petrobras's open-innovation registry (Conexões Radar)**
  - They decide engineering and 4D-seismic questions over declared uncertainty envelopes, with three-valued
    verdicts: [Contraprova](https://carlostoledo.co/contraprova/) (water-injection flowline limits) and
    [Decidível](https://carlostoledo.co/decidivel/) (4D seismic detectability).
- **An applied collaboration with a university ocean-engineering group**
  - Certified return levels over a public hindcast.

## How I work

Verifier first: a check that has never gone red is decorative. Every instrument carries planted forgeries,
and every number on a page is read from a record. Pre-registration before spend; deviations dated; negative
results reported as results.

- **Research:** Python (verifiers, Inspect, pytest), Hosted Training, `prime` CLI, Prime Sandboxes,
  JavaScript (BigInt exact arithmetic, headless-Chrome gates), SAT, LaTeX.
- **Product:** Figma and design systems, Webflow (CMS, GSAP, custom JS/CSS), API integrations (Stripe,
  Memberstack), SEO, accessibility, n8n.

## Experience

### cert-machine — Independent research engineer | 2026–present
Exact certification of machine-generated mathematics, and the RL and verification work above. Open source.

[OPERATOR FILLS experience]

## Education

[OPERATOR FILLS education]

---
Notes for the sender: every figure above is in a record. The sources:
- notes/lattice-claims-rl-preregistration-2026-10-04.md and instruments/wiring/train/{pilot,stage2}/;
- instruments/wiring/PROVENANCE.json (v020–v051);
- certs/kissing-wave.json, certs/claims-ledger.json and certs/mc100-*.json;
- certs/horizon-ledger.json.

The Petrobras pages are already public; the university group stays unnamed until it agrees.

The personal lines (phone, availability, prior employment, education) live in resume.private.md beside this
file, which is git-ignored; build-pdf.js substitutes them for the [OPERATOR FILLS name] marks, and any mark
left unfilled prints on a yellow highlight.
