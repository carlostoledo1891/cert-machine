# Carlos Toledo

_Research engineer · I review AI-generated mathematics and code, find the errors, and prove them_

carlos@carlostoledo.co · [OPERATOR FILLS phone]
carlostoledo.co · linkedin.com/in/carlos-toledo
github.com/carlostoledo1891/cert-machine

> [OPERATOR FILLS availability]

**I check what AI systems produce — proofs, numerical claims, benchmark answers, grader verdicts — in exact arithmetic
and in Lean, with code that shares nothing with the model that produced it, and publish each verdict as a re-runnable
certificate: certified, refuted with the object that breaks it, or refused with the reason.**

## Reviewing AI-generated mathematics | 2026 · all public

- **OpenAI's math release — 719 machine-generated manuscripts and 416 Lean challenges, audited at a pinned commit** ·
  [report](https://carlostoledo.co/reports/openai-math.html)
  - Every proof re-run under a second, independent kernel (nanoda, written in Rust): 398 of 416 accepted by both
    kernels and none rejected; the other 18 exceeded the runners' memory or time.
  - Every formal statement read against the claim it carries: 34 of 242 formalized families state a different or weaker
    theorem than their headline, with nothing saying so; 5 headlines rest on no machine-checked statement.
- **Two claimed refutations of the Exponential Time Hypothesis (OpenAI, Anthropic)** · [report](https://carlostoledo.co/eth/)
  - Both Lean proofs replayed from their pinned bytes under two independent kernels, then again from an empty
    environment; a Lean bridge proves each lab's statement refutes a textbook ETH, in that lab's own machine model.
  - What no machine can check — that the Lean ETH is the textbook one — is stated as a reading, kept apart from the proofs.
- **Google DeepMind's cryptids benchmark** · [report](https://carlostoledo.co/reports/cryptids.html)
  - 152 claims decided: 143 certified, 1 refuted, 8 refused with their reasons; the findings filed upstream.
- **AI-found combinatorics, re-decided exactly**
  - The Qiushi Engine's kissing-number bounds: 19 of 19 witnessed, every pair of 9.75 × 10¹⁵ decided
    ([report](https://carlostoledo.co/reports/kissing.html)); AlphaEvolve's Ramsey lower-bound graphs: 17 of 18
    certified, 1 refused pending compute ([report](https://carlostoledo.co/reports/ramsey-graphs.html)).
- **Lean certificates read against their statements**: OpenAI's Navier–Stokes blowup — one clause of the paper's theorem
  missing at the announced commit, proved at the next ([report](https://carlostoledo.co/reports/navier-stokes.html)); the
  Qiushi Engine's disproof of Bandeira's Open Problem 0.2(a) — the finite core re-decided, two gaps named
  ([report](https://carlostoledo.co/reports/bandeira.html)).
- **Terence Tao's optimization-constants registry** removed four "verification minimal" asterisks after my exact replays
  and cites them (#216, #230, merged 2026-10-18) · [report](https://carlostoledo.co/reports/optimization-constants.html)

## Finding errors in answers, keys and graders | 2026

- **The graders of math benchmarks, against 4,000 provably wrong answers**: absolute-tolerance rules accept 3,582 of
  them; a certificate grader accepts none and rejects nothing right · [report](https://carlostoledo.co/reports/envs.html)
- **GSM8K's answer key, every arithmetic step re-decided**: 8,792 keys, 4,282 annotated steps; 26 printed steps wrong,
  7 of them leaving the key's answer underived · [report](https://carlostoledo.co/reports/gsm8k-audit.html)
- **HorizonMath's Ramsey certificate, refuted**: 56 of the 201 points it uses lie outside the region its own argument
  needs · [report](https://carlostoledo.co/reports/horizonmath.html)
- **METR's time-horizon estimator, re-derived exactly**: 44 of 44 fits certified; the post-2023 doubling time re-derives
  as 128.74 days against the printed 128.744 · [report](https://carlostoledo.co/reports/time-horizon.html)
- **My own verifier, attacked first**: 572 planted false, true and malformed variants over 119 claims — 0 false
  certifications, 0 false refutations. A check that has never gone red is decoration.

## Applied verification | 2026

- **NIST's elliptic-curve seeds**: 34 of 34 certified by two deciders sharing no code
  ([report](https://carlostoledo.co/reports/curve-seeds.html)).
- **PU Verificado**: every Tesouro Direto price since 2004 (145,439) re-decided from the Treasury's own rule table;
  132,362 reproduced to the centavo, every other one classified with its reason
  ([report](https://carlostoledo.co/reports/pu-verificado.html)).
- **RL environments and rewards**: a pre-registered GRPO study of three reward designs on Qwen3.5-9B (Prime Intellect
  Hosted Training); environments `lattice-claims`, `blind-spot`, `break-the-grader` on the Environments Hub.

## How I work

- **Mathematics:** number theory, combinatorics, real and interval analysis, linear algebra, probability; proofs read line
  by line against their formal statements.
- **Tools:** Lean 4 (statements, builds, axioms; Lean's kernel, nanoda, leanchecker), Python (standard library, pytest,
  Inspect), JavaScript (BigInt exact arithmetic), interval arithmetic, SAT, LaTeX.
- **Writing:** every finding written for the people it concerns — 15 public credits from outside parties so far, among
  them Tao's registry and an independent re-certification of λ(4) by a third party with no shared code.
- Pre-registration before any spend; negative results reported as results; every number read from a record.

## Experience

### cert-machine — Independent research engineer | 2026–present
The audits and studies above; open source, one author.

[OPERATOR FILLS experience]

## Education

[OPERATOR FILLS education]

---
Notes for the sender (not printed in a send; every figure is in a record):
- certs/openai-math-kernel.json, openai-math-statements.json; certs/eth-kernel.json and eth-bridge.json;
  certs/cryptids-audit.json (summary: 143 CERTIFIED, 8 REFUSED, 1 REFUTED); certs/kissing-wave.json;
  certs/ramsey-ledger.json (17 CERTIFIED, 1 REFUSED); certs/bandeira-ledger.json; corpus/optconst-queue/registry-2026-10-18*;
- reports/envs.html's record; certs/gsm8k-ledger.json; certs/horizonmath-ledger.json (points 201, outsideR 56);
  certs/horizon-ledger.json; certs/selfaudit-mutations.json (all: 119 rows, 572 mutants, 0 / 0);
- certs/curveseeds-ledger.json (34 CERTIFIED); certs/pu-ledger.json; corpus/recognition.json (15 rows).
Alignerr (Labelbox's expert network) hires subject experts to review AI-generated solutions and to probe models
adversarially; the math listings ask for theorem proving and research experience at the top tier. The PDF is built with
`node outreach/build-resume-pdf.js outreach/alignerr`, which fills the [OPERATOR FILLS …] marks from the git-ignored
resume.private.md beside this file.
