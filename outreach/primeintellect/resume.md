# Carlos Toledo — resume (DRAFT 2026-10-05, for Prime Intellect, Applied Research – Forward-Deployed; sending it is the operator's)

carlos@carlostoledo.co · carlostoledo.co · github.com/carlostoledo1891/cert-machine · Brazil (UTC−3)
[OPERATOR FILLS: phone · one line on relocation/visa: the posting is SF hybrid-remote with visa sponsorship]

**I build environments and verifiers whose rewards cannot be gamed, and I run them on your stack.** I publish
on the Environments Hub as `carlos-toledo`, and I train and diagnose with Hosted Training, verifiers and Prime
Sandboxes.

## On Prime Intellect's stack (October 2026, all public)

- **A pre-registered RL experiment on Hosted Training: three reward designs on one environment, and what each
  one taught.**
  - Setup: lattice-claims on Qwen3.5-9B, LoRA GRPO. The task asks the model to decide a claim, or to abstain
    when a quantity is missing.
  - Arms: (A) an answer key; (B) an exact grader that pays a decided abstention; (C) a ternary +1/0/−1 grader.
  - Results: A and B both extinguished abstention within ~10 steps. C made the model abstain on everything.
  - Mechanism, from the logged per-step metrics: once guessing is universal, the exact grader's incomplete-task
    groups score uniformly and carry no gradient; under the ternary grader, answering a 50/50 task is worth
    ~0.
  - Conclusion: the binding constraint was the policy's ability to decide, not the reward. Gates were set
    before any spend, and every deviation is dated in the note.
  - notes/lattice-claims-rl-preregistration-2026-10-04.md
- **Two platform faults found and handled.**
  - The hosted Qwen3.5-4B trainer delivered no policy updates. Three launches stalled at "Waiting for new
    policy"; I reported it via `prime feedback` with run IDs and logs, and routed around it with model gates
    on the 2B and 9B.
  - verifiers 0.3.1's legacy `SandboxEnv` cannot be built with any prime-sandboxes release it accepts:
    0.2.39–0.2.42 refuse a string start command unless `vm=False`, and 0.3.0+ accept only `StartCommand`.
    lattice-claims 0.4.1 carries a scoped repair (`vm=False` or a shell-split `StartCommand`), verified on a
    real sandbox. A pin to `<0.3` silently kept the hosted env-server from starting, which a two-control probe
    isolated.
- **Environments Hub.** `carlos-toledo/lattice-claims` v0.5.1:
  - three graders and a due-split rubric;
  - a calculator-tool mode (`tools="calc"`), with the sandbox mode kept;
  - its task generator pinned byte-identical to 0.1.0 through every release;
  - each release verified by installing from the registry.

  Also `blind-spot` (RTL mutation kills checked by simulating the netlist; SAT-proved equivalence) and
  `break-the-grader` (adversarial submissions minted from exact certificates).
- **A hosted-sandbox blocker isolated by controls.** On Hosted Training, every run of the sandbox-tool
  environment sat without loading, while the same package without the tool trained in under 90 s. Shipped an
  in-process calculator tool instead; it loads and trains.

## Verification work (the same discipline, outside RL)

- **The September 2026 kissing-number wave, decided exactly.** 11 published configurations, 215,015,141,413
  pairs, 0 violations. This includes the first independent certification of K(18) ≥ 8,358, a +704 jump on the
  published record that nobody had checked, and the K(25)–K(31) race between three groups.
- **100 pre-registered machine-generated claims** (AlphaTensor, AlphaEvolve, EinsteinArena, the Station),
  chosen by rule before any was decided.
  - Wave 1 decided 46: 45 CERTIFIED, 1 REPAIRED.
  - The open 605 and 842 rungs are proved infeasible, with the platform's penalty reproduced to every printed
    digit.
  - The Station's 3-D map with constant Jacobian determinant −6 is certified non-injective.
- **METR's time-horizon estimator re-derived exactly.** 44 of 44 fits certified; the doubling time 128.74 days
  against the printed 128.744.
- **A benchmark's checker refuted:** HorizonMath's Ramsey certificate. Also an exact audit of GSM8K's answer
  key.

## Forward-deployed, in practice

- Two decision tools built and submitted to Petrobras's open-innovation registry (Conexões Radar), deciding engineering and 4D-seismic
  questions over declared uncertainty envelopes with three-valued verdicts:
  - Contraprova: water-injection flowline limits;
  - Decidível: 4D seismic detectability.
- An ongoing applied collaboration with a university ocean-engineering group: certified return levels over
  a public hindcast.

## How I work

Verifier first: a check that has never gone red is decorative. Every instrument carries planted forgeries,
and every number on a page is read from a record. Pre-registration before spend; deviations dated; negative
results reported as results.

Stack: Python (verifiers, Inspect, pytest), Hosted Training, `prime` CLI, Prime Sandboxes, JavaScript
(BigInt exact arithmetic, headless-Chrome gates), SAT, LaTeX.

## Education and prior employment

[OPERATOR FILLS — nothing here is derivable from the repository and nothing was invented]

---
Notes for the sender: every figure above is in a record. The sources:
- notes/lattice-claims-rl-preregistration-2026-10-04.md and instruments/wiring/train/{pilot,stage2}/;
- instruments/wiring/PROVENANCE.json (v020–v041);
- certs/kissing-wave.json, certs/claims-ledger.json and certs/mc100-*.json;
- certs/horizon-ledger.json.

The Petrobras pages are already public; the university group stays unnamed until it agrees.
