# cert-model — saved for future development (2026-10-27)

The operator's concept note, verbatim, as pasted on 2026-10-27, followed by the session's assessment and the two
measurements that gate any build. Nothing here is built. Related: corpus/targets.json row `cert-model-2026-10`.

---

# cert-model — a specialist LLM trained against cert-machine

> A model trained against a grader it cannot hack, on problems where the grader's verdict is a proof, scored by the records it moves.

**Status:** concept (Oct 2026)
**Owner:** Carlos Toledo
**Depends on:** cert-machine (engine), claimbox (claim grammar), the Prime Intellect environments

---

## 1. Thesis

The model is not the product. The engine is. The model is the thing that learns to make claims the engine can decide.

- **Reward source:** exact interval certification, not a learned grader and not an LLM judge.
- **Output contract:** every claim leaves the model as a claimbox object (quote, digest, predicate, falsifier) and is decided PROVADO / REFUTADO / RECUSADO before anyone sees it.
- **Claim to the world:** a small model whose every output carries a certificate, which no frontier lab can currently say about any model.

What this is **not**: a general assistant, a prover for arbitrary mathematics, or a hallucination fix for open prose. Its reach is exactly the engine's deciding reach.

---

## 2. Architecture

```
          propose                 decide
  model  ───────►  claimbox  ───────────►  cert-machine
    ▲              (parse or                 (PROVADO /
    │               refuse by rule)           REFUTADO /
    │                                         RECUSADO)
    └──────────────── reward ◄────────────────────┘
```

| Layer | Role | Already exists? |
|---|---|---|
| Base weights | open 7–32B reasoning model (Qwen-class math/code) | yes (external) |
| claimbox | model-free closed-grammar reader; refuses malformed claims with a named rule | yes |
| cert-machine | receiver; exact decision over declared intervals; refusals counted by kind | yes |
| Environments | one RL env per family, single-turn, no answer key | 3 of N (break-the-grader, lattice-claims, blind-spot) |
| Scoreboard | records the engine can certify (Erdős constructions, λ(k), K(n), sum-distinct sets) | yes, informal |

No pretraining. The value is entirely in the reward channel.

---

## 3. Build plan

### Phase 0 — Freeze the contract (weeks 1–2)
- Fix the claimbox grammar version the model trains against.
- Define the reward:
  - `+1` certified
  - `0` refuted
  - `−ε` refused for a malformed claim (model's fault)
  - `0` refused for an out-of-reach claim (engine's limit, not penalised)
- Decide the difficulty term (see §5, trap 1) before training, not after.

### Phase 1 — Environments (weeks 2–6)
Turn each engine family into a single-turn environment with the same shape as the three on the Hub:

- Chowla cosine sets / λ(k)
- Hénon census and orbits (incl. Holmes cubic)
- Newman polynomials
- Sum-distinct sets (Erdős #1 line)
- Kissing / lattice (K(n), SVP records)
- Hot-spots on polygons
- OEIS closed forms (zero-hit family; good negative control)
- keller-audit (Jacobian counterexample verification)

Each env ships with its own red controls and a battery entry, like everything else on the engine.

### Phase 2 — Certificate corpus (weeks 4–8)
The existing certificates are the dataset. For every decision the engine has ever made, emit a training record:

- the claim as written
- the parse (or the refusal rule)
- the verdict and the deciding quantity / counterexample
- the certificate plate

SFT on this first so the model learns the *shape* of a decidable claim before it learns to make new ones.

### Phase 3 — RLVR (weeks 8–16)
- 7B first, on RunPod. A run is a handful of H100-days.
- GRPO-style loop; reward from the engine only.
- Log every proposed claim and every verdict — the training log is itself an auditable artifact.
- Scale to 14–32B only if the 7B moves a record.

### Phase 4 — Scoreboard and release (week 16+)
- Publish the model with its full claim/verdict log and the environments.
- Report: records moved, refusals by kind, certified claims per 1k proposals.
- Zenodo DOI; one report page on carlostoledo.co in the existing report format.

---

## 4. How it grows

The model grows only when the engine grows. Each new decidable family = one new environment = new reward surface.

| Engine grows by… | Model gains… |
|---|---|
| a new family (e.g. Decidível / Contraprova physical-model intervals) | a new domain where its claims are certifiable |
| a new refusal kind | a sharper sense of what not to claim |
| a record the engine can certify | a new scoreboard entry to beat |

This is the honest meaning of "willing to grow": the parameter count is secondary; the deciding reach is the real axis.

---

## 5. Traps

### Trap 1 — Trivial-but-certifiable
A model rewarded for certified claims learns to make easy ones. Mitigations:
- reward term for distance to the current record or declared baseline;
- Forecast Gym style pre-registration: the claim must name the number it intends to beat before the engine runs;
- cap reward on any claim whose certificate is already in the corpus.

### Trap 2 — Narrowness
The model will be sharp on the engine's families and ordinary everywhere else. Do not hide this. The pitch is **specialist, exact, auditable**; "frontier research" refers to the records track, not generality.

### Trap 3 — Grader drift
If the engine changes mid-run, rewards are no longer comparable. Pin the engine release (v2026.10 style tag) per training run and record it in the model card.

### Trap 4 — Claiming more than the certificate
Same rule as the site: zero discoveries claimed on the model's behalf. A moved record is "certified construction, not peer-reviewed" until it isn't.

---

## 6. What it costs

- Compute: single-digit thousands of USD for a 7B RLVR run on RunPod; tens of thousands at 32B.
- People: one (plus UFSC collaboration for the methods write-up).
- Time: ~4 months to a first scoreboard result, assuming Phase 1 reuses the existing env tooling.

---

## 7. Why a lab would care

- A verified reward channel that is provably un-hackable by construction — the scalable-oversight story made concrete.
- Environments and a model that ship together with the grader source, so the result is reproducible by anyone with stdlib Python.
- A worked example of the "anti-hype" posture applied to training, not just auditing.

---

## 8. Open questions

- Which family gives the first non-trivial moved record with the least engine work? (Candidate: sum-distinct sets — the construction space is explicit and the record is yours.)
- Should the model be allowed to call the engine mid-generation (verifier-in-the-loop) or only at the end? Start end-only; it keeps the reward clean.
- Portuguese or English claim grammar? claimbox is language-agnostic by design; keep it that way.

---

## The session's assessment (2026-10-27)

Valuable as a research question and as the reward channel it already is; premature as a model deliverable. The evidence on
disk against Phase 3 paying off at this scale: lattice-claims stage 2 (2026-10-05, Qwen3.5-9B) showed no separation, both
arms collapsing to uniform reward within ~10 steps; the §3 reward (+1/0/−ε/0) is the published calibrated-claiming reward
whose GRPO collapse Che et al. (2608.00301) explain; Clade Code's eras 0–1 found blind rules as good as a 7B mutagen with
exact judging. "Un-hackable by construction" should read "measured": the self-audit's 572 mutants and 0 false
certifications cover the verdict's soundness; the reward is still hackable in distribution (trivial claims, re-claims,
refusal farming, grammar blind spots — the 605 lesson). Zero for refuted and zero for out-of-reach is the collapse; the
difficulty term belongs in the reward from day one. Use the engine's verdict words, not a second vocabulary.

The two gates before any Phase 1 build, pre-registered first in the house way:
1. A frozen 7B proposer vs blind rules on sum-distinct sets through the exact decider, equal budget, CPU, free (the Clade
   Code PM-1 protocol).
2. If the frozen proposer wins: one GRPO pilot on that environment, difficulty term in the reward, one GPU-day on RunPod
   (~US$ 50), the lattice-claims shape (arms, null, unreadable), readings: certified per 1k proposals, distance to the
   record, refusals by kind. A null is publishable; a win funds Phase 3.
Families in order of decider cost: sum-distinct sets, then Chowla cosine / Newman; kissing and Ramsey last (hours per
decision). Pitch to labs what exists: environments + exact grader + the audit trail.


**2026-10-27 (later): the idea has a home.** It is called Herald and lives in its own repository at ~/Projects/herald (created by the Machinidae session on the operator's word; its HANDOFF.md there). It uses cert-machine one way, as pinned hash-checked copies, and sends its claims through claimbox like anyone else's; when its first claims arrive, the pages may mark them as the operator's own.
