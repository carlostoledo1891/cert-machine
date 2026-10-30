# Carlos Toledo

_Verification engineer · I prove or refute what AI systems claim, and build the products that make the proof legible_

carlos@carlostoledo.co · [OPERATOR FILLS phone]
carlostoledo.co · linkedin.com/in/carlos-toledo
github.com/carlostoledo1891/cert-machine

> [OPERATOR FILLS availability]

**I built and run cert-machine, an independent verification system for machine-generated mathematics and code: every
claim is decided in exact arithmetic or in Lean, by code that shares nothing with the claimant, and published as a
certificate anyone can re-run — certified, refuted with the object that breaks it, or refused with the reason.**

## Verification at scale | 2026 · all public

- **OpenAI's math release — 719 machine-generated manuscripts and 416 Lean challenges** ·
  [report](https://carlostoledo.co/reports/openai-math.html)
  - Every proof replayed under a second, independent kernel (nanoda, Rust): 398 of 416 accepted by both, none rejected.
  - Every formal statement read against its claim: 34 of 242 formalized families state a weaker or different theorem
    than their headline, with nothing saying so — proofs that check, of the wrong statement.
- **Two claimed refutations of the Exponential Time Hypothesis (OpenAI, Anthropic)** · [report](https://carlostoledo.co/eth/)
  - Both Lean proofs replayed from pinned bytes under Lean's kernel and nanoda, then from an empty environment.
  - A model-generic ETH written in Lean, with a bridge proving each lab's statement refutes it in that lab's own machine
    model; the version seam between the two Mathlibs measured as kernel terms.
- **AI-found mathematics, re-decided exactly**: Google DeepMind's cryptids benchmark (143 of 152 claims certified,
  1 refuted, 8 refused); the Qiushi Engine's kissing-number bounds (19 of 19, every pair of 9.75 × 10¹⁵ decided);
  AlphaEvolve's Ramsey graphs (17 of 18); Terence Tao's constants registry removed four asterisks after the replays.
- **Graders and benchmarks broken on purpose**: tolerance graders accept 3,582 of 4,000 provably wrong answers; a
  certificate grader accepts none. GSM8K's key: 26 printed steps wrong. NIST's curve seeds: 34 of 34 certified by two
  deciders sharing no code.
- **The verifier attacked first**: 572 planted false, true and malformed variants over 119 claims — 0 false
  certifications, 0 false refutations.

## Product, field work and developer experience | 2026

- **Verification people use**: PU Verificado re-decides every Tesouro Direto price since 2004 (145,439; 132,362 to the
  centavo, every other one classified with its reason); Janela decides an offshore unit's operating window exactly from
  forecast bands, built with an industrial partner; Swell, the same engine for surfers.
- **A visual grammar for verified results** ([/grammar/](https://carlostoledo.co/grammar/)): every mark's stroke says
  what it rests on — decided, computed, chosen or refused — and the build enforces it: legends derived from the marks,
  every printed number re-read from its record, every figure naming its record and the check that would refuse it.
- **claimbox**: the translator from a claim's text and the claimant's bytes to a decidable object, with two independent
  checkers; open source.
- **Writing**: a method paper (draft) and ninety public reports; public findings answered and credited by outside
  parties (15 credits so far).

## How I work

- **Formal and exact:** Lean 4 (statements, bridges, Comparator, Lean's kernel, nanoda, leanchecker), exact rational and
  interval arithmetic, SAT; Python, JavaScript/Node, LaTeX; cloud runs on GitHub Actions and RunPod.
- **Product:** design systems, Figma, front-end, data apps; shipping product since 2010, before verification.
- Pre-registration before any spend; negative results reported as results; every number read from a record. A check
  that has never gone red is decoration, so every battery carries planted forgeries.

## Experience

### cert-machine — Founder, independent verification engineer | 2026–present
The work above; open source, one author.

[OPERATOR FILLS experience]

## Education

[OPERATOR FILLS education]

---
Notes for the sender (not printed): every figure is in a record — certs/openai-math-kernel.json, openai-math-statements.json;
certs/eth-kernel.json, eth-bridge.json, eth-seam.json; certs/cryptids-audit.json; certs/kissing-wave.json;
certs/ramsey-ledger.json; reports/envs.html's record; certs/gsm8k-ledger.json; certs/curveseeds-ledger.json;
certs/selfaudit-mutations.json; certs/pu-ledger.json; corpus/recognition.json. &Truth's general application (Palo Alto,
full-time): "Tell us about your interest in &Truth, your qualifications, and what you would contribute" — the answer is
application.md beside this file. Build: `node outreach/build-resume-pdf.js outreach/andtruth`.
