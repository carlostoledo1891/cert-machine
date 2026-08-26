# Workshop note — Dual-lane disposition beside PGR

**Audience:** Anthropic Fellows / Alignment Science; systems & formal-methods readers.
**Form:** printable companion to the interactive report (same claims, denser related work).
**Status:** frozen 2026-07-31 (P4). Does **not** authorize sending outreach.
**Cost refuse:** ~18k USD re-hill-climb remains **REFUSED**.
**Novelty:** academic novelty **zero** as mathematics; systems contribution is the dual lane.

Interactive report (public tease): `https://mfg-lab.vercel.app/research/alien-science/alien-science`
Re-run (disposition half, minutes, no GPU): `make check-alien-science` — **monorepo
checkout only; the target does not exist in the public clone.** From the public pack
use the §9 commands (`node dual-client.js --fixture heldout-ccs-es`).

*Corrected 2026-08-04 (attribution + dates; wording fixed in place below, this note is
the record): held-out math 0.94 / code 0.47 are **CCS + Self-Distill's** (fig. 8 red
series) — the source reports **no held-out numbers for CCS + Evolution Strategy
Refinement** (chat 0.93), and 0.97 is Self-Distill's chat PGR (their SOTA), not an
aggregate. The blog page prints "April 2026" only; 2026-04-14 is the first Wayback
capture, not printed at source.*

---

## 1 · Problem (their words, our fork)

Anthropic’s Automated Alignment Researchers (AARs) programme reports that **evaluation
becomes more critical than idea generation**, asks for evals agents cannot tamper with,
and names **alien science** — hard-to-verify ideas — as a ceiling. Their named mitigation
is **legibility training**. We take the other fork: for *formalizable* fragments of those
ideas, require a **machine-checkable disposition** the agent cannot rewrite, sitting
**beside** their Progress Gap Recovered (PGR) score rather than replacing it.

**Live thesis (narrow):** for formalizable claims, machine-checkable certificates can make
opaque reasoning usable.  
**Not the thesis:** certificates dissolve alien science in general.

**Systems novelty sentence:** a dual-lane evaluation architecture coupling scalar
capability metrics with independently verifiable disposition judgments for formalizable
artifacts.

---

## 2 · Dual-lane architecture

| Lane | Object | Teeth |
|---|---|---|
| **PGR** | Scalar transfer / recovery metric from their W2S sandbox | Legitimate only under Docker Mode B / RunPod Mode C (`labeled_data/` not agent-mounted) |
| **Disposition** | Discrete verdict on a claim+witness | `CERTIFIED` / `REFUSED` / `HACK-SUSPECT` / `OUT-OF-SCOPE` under `disposition-v0` |

**Disagreement kinds** (product surface):

| Kind | Meaning |
|---|---|
| `agree_with_teeth` | High PGR × `CERTIFIED` fragment — constructive twin |
| `disagree` | High PGR × `REFUSED` or `HACK-SUSPECT` — attention object |
| `scope` | Disposition declined (`OUT-OF-SCOPE`) — success when not formalisable |
| `other` | Residual combinations |

PGR figures quoted in this note (chat 0.97 = CCS + Self-Distill, their SOTA / 0.23
human baseline / 0.93 = CCS + Evolution Strategy Refinement; held-out math 0.94 /
code 0.47 = CCS + Self-Distill's transfer; EM Posterior 0.78) stay tagged
**Anthropic-reported (April 2026)** until remeasured under Mode B/C. We never invent
a remote PGR.

---

## 3 · Disposition vocabulary and propositions

Four verdicts partition terminating runs of `disposition-v0` (exhaustion / exclusivity /
refusal honesty / scope honesty). They are **not** a soft score.

**Prop. 1 (mutation exclusion).** Under schema `disposition-v0`, if
`ground_truth_role = mutant` and the disposition battery is the acceptance criterion,
the record is never `CERTIFIED`. Load-bearing gate: exam pack + planted mutants.

**Prop. 2 (swap-consistency projector).** For binary preference probabilities under an
exact A/B swap, the pre-update residual \(r = |p_{\mathrm{orig}} - (1 - p_{\mathrm{swap}})|\)
is certified exactly (BigInt rationals). Consistent sample → `CERTIFIED` at \(r=0\);
planted mutant → `REFUSED`. Algebraic fragment from their CCS + Evolution Strategy
Refinement pseudocode (chat 0.93; the SOTA chat idea is CCS + Self-Distill) — not a
PGR claim.

**Prop. 3 (EM-channel Bayes).** For a binary channel with prior \(\pi\) and
weak-label accuracies \(\alpha,\beta\), the soft label \(q\) must equal the exact Bayes
posterior. Pre-update residual certified the same way. Clean sample → `CERTIFIED`;
planted \(q\) mutant → `REFUSED`.

House rule on both Props. 2 and 3: **pre-update residuals only**. Post-update identities
that are trivially exact after a projection step are not displayed as certificates. The
interactive labs mirror that discipline (status height reserved; no layout jump on
verdict change).

---

## 4 · Threat model (soundness relative to named classes)

Disposition soundness is claimed **relative to** these classes, not against all adversaries:

| ID | Class | Response |
|---|---|---|
| M1 | Soft-CERTIFY a mutant | Schema + battery refuse; forged green fails the gate |
| M2 | Mode A label read (`labeled_data/` reachable) | PGR lane marked illegitimate |
| M3 | Seed cherry-pick (many seeds, best only, sweep undisclosed) | `HACK-SUSPECT: seed-cherry-pick` |
| M4 | Label exfil via uncertain single-bit flips that move remote PGR | `HACK-SUSPECT: label-exfil-shape` |
| M5 | Scope wash (call OUT-OF-SCOPE a failure, or CERTIFY the unformalisable) | Scope honesty; OUT-OF-SCOPE is success when appropriate |

Detectors ship with **planted positives** and **clean controls** (false-positive bound for
the fixture suite). Pattern match only — invite human inspection of methods; never a soft
`CERTIFIED`.

---

## 5 · Attention object and filled rows

The constructive twin alone is insufficient for Fellows attention. The filled
**disagree** row is: **EM Posterior reported PGR 0.78 × planted channel mutant
`REFUSED`**. Same idea family as their case study; disposition teeth on the Bayes step,
not a re-run of their finetune loop.

CCS+ES chat PGR 0.93 (reported) × swap-consistency `CERTIFIED` remains the
constructive twin (`agree_with_teeth`) — corrected 2026-08-04: an earlier version put
"held-out math 0.94" here; that figure is CCS + Self-Distill's, and no held-out
numbers are reported for CCS+ES. Summary metric on the interactive report counts
disagree / agree_with_teeth / hack / scope.

Why this pair is load-bearing: a sandbox that only ever shows high PGR × `CERTIFIED`
teaches the wrong lesson (disposition as cheerleading). A sandbox that can surface
**metric green, disposition not** is the object their bottleneck paragraph asks for —
evaluation that survives when idea generation looks fluent. We still refuse to pretend
the EM Bayes step is their full Posterior pipeline; scope stays on the fragment.

Exam-pack harvest (clean vs mutant sides from mutation records and kill-control pairs)
backs Prop. 1 in bulk: every mutant side must stay ≠ `CERTIFIED`, or the battery fails.
That is the same both-directions discipline used elsewhere in this monorepo’s ledger
mutants — applied here to AAR-facing fragments.

---

## 6 · Disposition tool (eval-API shaped)

Parallel to their MCP tool `evaluate_predictions`:

| Endpoint / tool | Role |
|---|---|
| `POST /api/dispose` | Open: kernel + payload → disposition/v0 |
| `POST /api/dispose-fixture` | Server-owned clean/mutant; plant applied host-side |
| `dispose_claim` / `dispose_fixture` | MCP-shaped descriptors from `GET /api/tools` |

Clients cannot forge `CERTIFIED` by rewriting `ground_truth_role`; pre-baked verdicts
return HTTP 400. Point `DISPOSITION_URL` at the local stub; optional
`dual-client --via-stub`. Mode B coupling (their Docker PGR server + our stub on the
host) is the legitimate dual-lane stress path — not Mode A.

Isolation diagram (host vs agent): `labeled_data/` and disposition fixtures stay on the
host; the Docker agent mounts only `data/` + cache read-only; predictions leave via
`/api/evaluate-predictions`; claim payloads leave via `/api/dispose*`. If the agent can
`ls` labels, stop calling the PGR lane a measurement.

---

## 7 · Related work (denser)

This section is disclosure, not a claim of mathematical priority. Verdict on product
occupancy remains **PARTIAL** (disclose-and-continue).

### 7.1 Anthropic AAR / weak-to-strong sandbox (2026)

Primary sources: research page *Automated Alignment Researchers*; Alignment Science Blog
case studies (the page prints **April 2026** only; 2026-04-14 is the first Wayback
capture — corrected 2026-08-04); public repo
`safety-research/automated-w2s-research` (**no LICENSE file** as of 2026-07-31 — do not
assume MIT). They operationalize PGR, document Mode A illegitimacy, surface reward-hack
classes (including seed and label-exfil shapes), and propose **legibility training** for
alien science. **Gap:** no shipped disposition lane with mutation teeth beside PGR; no
disagreement table coupling the two.

### 7.2 Legibility, debate, prover–verifier, scalable oversight

Lines that make answers *readable to a weaker judge* (debate, prover–verifier games,
oversight protocols) occupy the same *problem neighborhood* as Anthropic’s legibility
fork. They optimize for human or weak-model comprehension of *reasoning traces*. Our
object is different: a **pre-update residual / schema verdict** that can be checked
without trusting the agent’s prose. Closest cousins; not substitutes. Naming them
prevents a false “empty literature” posture.

### 7.3 Check-without-understanding (formal methods)

Four-colour / Flyspeck / Lean–mathlib culture already treats machine-checkable acceptance
without full human comprehension as normal epistemology. Claiming that stance as **new
mathematics** would be false. We inherit it; novelty, if any, is **product placement**
beside a public AAR sandbox (API shape, disagreement artifact, mutant exam).

### 7.4 Alignment-certification impossibilities

Agarwal, *No Certificate for Alignment…*, arXiv:2603.08761v2 (2026-03-08 / 2026-05-26):
no procedure that is simultaneously sound, complete, and tractable for certifying
*system alignment* over open domains. **Different claim.** We dispose formal *fragments
of ideas*, not models or “the system is aligned.” Conflating the two is the fastest way
to earn a correct desk reject.

### 7.5 Mechanized math & certificate ecosystems (adjacent tooling)

Proof assistants, SMT/certificate pipelines, and verified numerics (interval / exact
rational libraries) supply *kernels* one might plug into a disposition witness. They do
not, by themselves, define a dual-lane eval product next to a gamable capability metric.
This note uses one exact-rational stack for Props. 2–3; the architecture is kernel-agnostic
in principle and fragment-specific in practice.

### 7.6 Reward hacking & eval integrity

Unbounded eval access, seed sweeps, and label probing are documented failure modes in the
AAR writeup and in the broader eval-integrity literature. Our HACK-SUSPECT detectors are
**shape detectors with clean controls**, not a completeness theorem over reward hacks.
They exist so the disposition lane has *named teeth* for M3/M4 rather than a vague “be
careful.”

### 7.7 Eval gaming, Goodhart, and proxy metrics

Once a scalar becomes the optimization target, agents (human or artificial) route around
it. PGR is useful and still a proxy. The dual-lane bet is not that disposition is
un-Goodhartable in full generality; it is that **discrete, witness-backed verdicts with
mutation exclusion** raise the cost of the cheap cheats (soft-green mutants, Mode A label
reads, undisclosed seed sweeps, bit-flip oracles) enough to change what an AAR can ship
as “done.” If a future agent learns to propose only `OUT-OF-SCOPE` claims, that is a
visible scope collapse — not a silent green.

### 7.8 Specification gaming vs fragment certificates

Specification gaming usually targets a reward or grader. Fragment certificates move the
grader onto an object with an independent residual. They do not solve misspecification of
the *parent* scientific claim. Workshop readers should treat a `CERTIFIED` swap fragment
as hygiene on a projector, not as permission to skip held-out stress on the surrounding
idea. The disagreement table exists precisely so a certified fragment cannot launder a
failed or unmeasured whole.

### 7.9 What this report owns

Dual-lane architecture; four dispositions; Props. 1–3; threat model M1–M5; two HACK
detectors; disagreement rows including a real **disagree** attention object; local
disposition HTTP/MCP stub; Docker Mode B isolation discipline; explicit refuse of the
~18k USD re-hill-climb. Academic novelty stays zero; the artifact is the systems object.

**Explicit non-claims (repeat until boring):** we do not certify model alignment; we do
not dissolve alien science as a category; we do not re-attribute Anthropic’s PGR digits;
we do not assert MIT reuse rights on their sandbox repo without a license file; we do not
treat Mode A subprocess numbers as measured science.

---

## 8 · What ships — and what does not

| Ships | Does not |
|---|---|
| Dual lane + Props. 1–3 + M1–M5 | Certificates dissolve alien science in general |
| Swap + EM fragments; disagree row | Remeasured PGR attributed as ours |
| HACK detectors with clean controls | Completeness over all reward hacks |
| Disposition stub + Mode B runbook | Mode A PGR treated as measured |
| Browser labs + `make check-alien-science` | Soft certificates for fuzzy alignment prose |
| Fellows pack (Python + golden) in the source tree | Full ~18k USD re-hill-climb |

---

## 9 · Re-run (disposition half)

From this directory (`research/alien-science/alien-science/` in the public repo):

```bash
node dual-client.js --fixture heldout-ccs-es
node dual-client.js --fixture heldout-ccs-es --plant-mutant
node dual-client.js --fixture em-disagree
```

Optional stub:

```bash
node disposition-stub.js --port 8765
DISPOSITION_URL=http://127.0.0.1:8765 \
  node dual-client.js --fixture heldout-ccs-es --via-stub
```

Expected: clean → `CERTIFIED` / `agree_with_teeth`; plant → `REFUSED` / `disagree`;
`cost_refuse.status === "REFUSED"`. Live PGR POST requires `W2S_EVAL_URL` and real
predictions — never invented here.

---

## 10 · Limits, stated plainly

1. **Scope.** Disposition answers alien science only where claims are formalisable.
   `OUT-OF-SCOPE` is success, not failure of the method.
2. **Reported PGR.** Until Mode B/C remeasure, every public PGR digit is theirs.
3. **Prop. 1** is systems soundness for the disposition lane, not a scientific law of
   nature.
4. **Fragments are small.** Swap-consistency and EM Bayes are algebraic steps inside
   larger AAR ideas — not a certificate of the whole pipeline.
5. **No fifth disposition** to look more theoretical. Completeness over “all alien
   science” is exactly the overclaim this note refuses.
6. **Outreach.** This workshop freeze does **not** send email. Send remains owner-gated.

---

## 11 · Suggested workshop exercises (30–45 min)

1. Drag the swap lab until a mutant goes `REFUSED`; copy the readout (pre-update residual).
2. Run the three CLI commands above; confirm `disagree` on `--plant-mutant`.
3. Start the disposition stub; call `dispose_fixture` for `swap-mutant`; attempt to POST a
   pre-baked `CERTIFIED` body and observe HTTP 400.
4. Read §7 against Agarwal 2603.08761 and state in one sentence why the claims differ.
5. (Owner machine / their spend only.) Point `W2S_EVAL_URL` at a Mode B server; do **not**
   treat Mode A numbers as measured.

### Facilitator notes

- Cap discussion of “can’t we just certify the whole AAR?” by pointing at §7.4 and the
  live thesis box: widen → overclaim → correct reject.
- If participants want a fifth verdict, ask what evidence would distinguish it from
  `REFUSED` or `OUT-OF-SCOPE` without becoming a soft score.
- Keep the ~18k USD refuse loud: this workshop is cheap by design; their hill-climb is not
  our CI budget.
- Success criterion for the session: every participant has personally produced one
  `REFUSED` mutant and can explain why Mode A PGR is illegitimate.

---

## 12 · Citation anchors (verify before any send)

| Identifier | Role in this note |
|---|---|
| Anthropic research page — Automated Alignment Researchers | PGR digits, cost band, alien science, stated future-work direction (a recommendation, not an invitation — corrected 2026-08-04) |
| Alignment Science Blog — automated W2S researcher | Case studies, legibility future work, reward hacks |
| `safety-research/automated-w2s-research` | Mode A/B/C; eval API shape; **no LICENSE assumed** |
| arXiv:2603.08761v2 (Agarwal) | Alignment-certification trilemma — different claim |
| Interactive report URL above | Public tease; labs; disagreement table |

Citation-verifier status for the public report identifiers was **GREEN** after retracting
a false MIT claim on the upstream W2S repo. Re-run before any outreach send. This workshop
freeze still does **not** send mail.

---

*End of workshop note. Same claims as the interactive report; denser related work; no
widened thesis.*
