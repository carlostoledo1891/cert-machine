# THE ATTACK PLAN — cert-machine on the seven attack items, 2026-09-29

Input: a conversation the operator shared (ChatGPT, 2026-09-29) that read the public
repository and site and answered *"how to explore the power of cert-machine, what would
you attack?"* with seven items and one flagship. The operator's instruction: *"build
the plan to evolve cert-machine on the attack items … we MUST evolve and elevate the
capabilities of cert-machine to stay up to date with the novelties and to have more
power"* — then *"present the plan before start building."*

This file turns the seven items into a plan against what is on disk (§1) and against
what the field did in 2026 (a scouting pass the same day, §2). APPROVED by the operator
the same day (§10); built wave by wave, each wave's state kept in the menu at the top
of HANDOFF.md (CLAUDE.md rule).

---

## 0. The read

The conversation is right about direction, and most of its items are already started
here — further than it could see from outside (it did not know about the Navier–Stokes
Lean audit, the generation spec or cert-unit). Two things changed the plan once the
2026 field was read:

1. **The verifier became the benchmark.** Final-answer benchmarks are saturated and
   their keys broken (FrontierMath v2 corrected 42% of its problems; an HLE review found
   46% of sampled questions wrong). The new benchmarks are open problems whose verifier
   *is* the benchmark (FrontierMath Erdős, HorizonMath, the Endless Exam, EinsteinArena)
   — so **verifier soundness is now the attack surface**, and it is this machine's
   exact subject.
2. **Formal proof got cheap; numerics did not.** A frontier model formalised Fermat's
   Last Theorem in Lean in eleven days; Comparator plus an independent kernel is the
   standard judge; Palomar is a registry of Lean-verified mathematics. Palomar takes
   **Lean only — not numerical and not SAT certificates** — and invites overlay review.
   The unverified remainder of 2026 mathematics is numerical: registries of constants
   carry "unverified" stars, AI disproofs arrive as exact objects plus enclosures, and
   records move weekly. That remainder is exactly what this machine decides.

So the plan is: six capabilities that multiply the instruments already built (§3), and
seven campaigns aimed at the 2026 targets the scouting found (§4).

---

## 1. The seven items against the disk

MEASURED on 2026-09-29 against the files.

| # | The item | Already here | Missing |
|---|---|---|---|
| 1 | **Math-AI evaluation** ("Certified MathBench") | matmul eval board: 364 real-model proposals — 115 certified, 147 refuted, 39 malformed (refused), 23 declined, 40 cut off by our output cap — plus 24 planted control rows; three Anthropic models (Haiku 4.5, Sonnet 5, Opus 5). blind-spot under Inspect (180 frontier rollouts). break-the-grader, blind-spot, lattice-claims on the Prime Intellect hub. The grader audit: tolerance graders accept 89.5% of provably wrong submissions. | One family has the model-facing contract (`oracle/certmachine.py`, matmul only). No cross-lab run, no current models. None of the conversation's metrics (certified per dollar and per token, time to certificate, scaling with effort). |
| 2 | **AI-discovered mathematics** | AlphaEvolve rank-48 ⟨4,4,4⟩ certified over Z[i]; AlphaTensor rank-47 decided both ways; the 3×3 addition count 55 held; EinsteinArena's 20 constructions decided; K(11) ≥ 604 congruent; the GPT constant on Erdős #852 refuted; six AI-assisted results re-verified; OpenAI's Navier–Stokes Lean certificate audited end to end. | A SWEEP. Every audit was hand-picked; the field now publishes constructions weekly. |
| 3 | **Answer keys** | GSM8K: 8,792 keys re-decided; three answer-key specimens. | The math sets RL trains on; a shared failure taxonomy. |
| 4 | **Completeness** | Hénon censuses (452 theorems); #852 exhaustive to 5·10¹¹; λ/μ tables; Keller. | Proof logs a stranger checks without our code (SAT/LRAT); a standard search-boundary certificate. |
| 5 | **Published numerical claims** | #852; the Ramanujan Machine (51 rows, one refuted); 21 OEIS impostors; zeta(3); the NS paper's energy clause; the UFSC and Bhaskaran tables; reports/claims.html, reports/refusals.html. | ONE register with ONE schema; the monthly ledger (D6), due end of September 2026. |
| 6 | **Verified reward** | the oracle tool (red controls at import); verifier-loop (27 rounds); the README's "Verified reward, running". Spec 4 (certified RLVR) ruled NO-GO as specified: on dense matmul shaping an empty witness beats the model, so GRPO has no gradient. | ANY training run: "reward hacking excluded by construction" is argued, not measured. |
| 7 | **Composition / research loop** | cert-unit (typed ports, hypothesis provenance, float outputs that cannot wire into a deciding input); hash-chained ledgers; the NS Lean pipeline (compile, `#print axioms`, Comparator, an independent kernel, a non-vacuity witness); λ(6) < λ(5) composed by hand. | A checked composition rule set; Lean-checkable exports; a loop that admits only certified lemmas. |

---

## 2. What the field did in 2026 — the scouting pass

A scouting agent read the field on 2026-09-29. [R] = it read the primary page;
[S] = snippet or secondary coverage only. **Every item is re-read from its primary
source before any build, and gets its corpus/targets.json row then** (CLAUDE.md).

**The five novelties that set the plan.**
1. Headline disproofs now arrive from AI as explicit exact objects: the unit-distance
   exponent (May), a Jacobian-conjecture counterexample in dimension 3 (July, credited
   to Claude Fable 5), Pompeiu–Schiffer (August) [R]. Each reduces to identities and
   enclosures.
2. Formal verification got cheap: FLT in Lean (Anthropic, 2026-09-04: ~13M lines, 11
   days, Comparator + nanoda over 1,052,234 declarations) [R]; Palomar, a Lean-only
   registry (Lean FRO + ICARM, 2026-08-18) [R]; LeanCert — intervals and Krawczyk in
   Lean, Apache-2.0 [R].
3. Final-answer benchmarks are dead and keys broken: FrontierMath v2 fixed 42% (135
   corrected, 12 removed; the errors reportedly "simple calculation mistakes…
   off-by-one… flipped signs" [S]); Epoch's HLE review: 22 of 48 sampled questions
   wrong [R]; HLE-Verified: 1,170 of 2,500 revised [R]; Omni-MATH-2: the official judge
   wrong in 96.4% of disagreements [R]. The replacements put the verifier in charge:
   FrontierMath Erdős (68 open problems in Lean, Comparator-judged, 18 statements
   AI-formalised, "errors may exist") [R]; HorizonMath (113 problems, a closed form
   accepted on a 20-digit mpmath match — "not a proof", the authors say) [R]; the
   Endless Exam (14 construction families checked by compact certificates) [R].
4. Public verification debt: Tao–Davis–Ivanisvili's registry of 88 optimisation
   constants says its bounds are "not certified", with 11 starred unverified [R];
   erdosproblems.com's AI-contributions wiki flags 10 AI claims as incorrect or gapped
   [R]; bounds-ledger watches 115 constants for drift without recomputing them [R].
5. Verifier soundness became a training and safety issue: "Where the Verifier Fails"
   (arXiv 2609.01354): 307,000 verdicts from four verifiers, self-agreement 53.8–95.2%,
   and a reference numeric verifier that accepts every off-by-one answer ≥ 10⁴ [R];
   leaky reward suites (2607.11022) [R]; reward hacking that generalises [S].

**Benchmarks to beat, not blockers** (the sin-mfg rule inverted): the Endless Exam
(certificates for constructions), "Where the Verifier Fails" (our grader audit, at
scale), Siddique–Mian's Kochen–Specker certificate (exact-rational case trees, a Lean
checker and a Python replay sharing no code, 115 planted mutations — our own design,
done by others) [R], Zuiddam's Lean proof of ω < 2.371339 [R], Fan Zheng's audit of a
computer-assisted proof (11 defects by exact counterexamples) [R].

**Poor fits, named:** OpenAI's "ten advances" (mostly asymptotic proofs, human-audited
already) [R]; ω < 2.371177 (code "being prepared": NEEDS DATA) [R]; R(5,5) ≤ 46
(no certificate to check, and a very large one to build) [S].

---

## 3. Six capabilities — the "more power"

Each is small, reuses something built, and pays for at least two campaigns.

### K1 · Proposal families — one contract for "a family a model can propose into"
*Pays for A1, A2, A6.* Generalise `oracle/certmachine.py` (matmul only) into a contract
any instrument implements, in the spirit of `families/` (no registration):

```
spec(seed, rung)        -> a task: a statement a model can read, and the exact target
schema                  -> the strict JSON a proposal must fit (the tool definition)
certify(task, proposal) -> CERTIFIED | REFUTED(mechanism) | REFUSED(reason)   — the only authority
forge(certificate, k)   -> k near-misses that MUST be refuted (red controls from the certificate itself)
canon(proposal)         -> canonical bytes: dedup, and "diversity of certified discoveries"
ladder                  -> rungs with measured difficulty, and the dumb baseline's score on each
```

First twelve families, all on instruments that exist: matmul/tensor rank (Q, F2, Z[i]);
polynomial multiplication (cyclic, truncated, negacyclic over F2); circle and hexagon
packings; kissing configurations; trig-polynomial minima; certified constants to N
digits; periodic orbits of a map; Lyapunov/SOS certificates; polynomial maps with
constant Jacobian and a collision (keller); extreme-value MLE fits (hseva); #852-type
records; Ramsey witnesses (new, small: a graph and two exact clique checks).
**Proof it works:** each family's forgeries all refute at import, or the family is not
admitted.

### K2 · The generation controller — cert-machine as the evaluator of an evolver
*Pays for A2, A7.* SPEC-GENERATION.md steps 1–4 (width() on the interval stack; the
append-only proposal ledger, commit-before-certify; `propose(ctx)` on one family; the
single-proposer loop), then 5–7. ADDED: open evolvers (OpenEvolve, ShinkaEvolve, and
what the watch finds) as PROPOSERS — the machine is their evaluator: verdict for
soundness, enclosure width for gradient, no model rating anything. The 2026 record says
why: ThetaEvolve found AlphaEvolve's third-autocorrelation code computing |max conv|
where the definition needs max|conv|, and circle-packing tolerances of 0 / 1e-6 / 1e-7
across AlphaEvolve / OpenEvolve / ShinkaEvolve [R]; "simple baselines are competitive"
(2602.16805) [R] — so the forced dumb baseline stays in every run.
**Stop condition, kept from the spec:** if after step 4 the proposer has not beaten
`enumerate` on the same budget, publish the null and stop.

### K3 · The formal bridge — audit Lean artifacts, and feed the Lean world numerics
*Pays for A2, A5, A7.* Two halves.
(a) **FORMAL-ARTIFACT AUDIT as one tool.** The NS audit built every piece by hand: pin
by commit; compile; `#print axioms`; Comparator (statement equality, axiom walk, Lean
kernel and nanoda); statement fidelity against the prose, hypothesis by hypothesis,
with the direction rule; a non-vacuity witness; and the finding that mattered — the
headline clause was not in the statement. Make it `tools/audit-lean.js` + a ledger row
per main theorem: compiles · axioms · kernels agree · statement matches (named source)
· non-vacuous · clauses claimed in prose and absent from the statement. A kernel checks
the proof; **nobody checks that the theorem is the one announced** — Palomar uses an
LLM for that step [R].
(b) **CERTIFICATES A KERNEL CAN CHECK, via LeanCert, not a new library.** For families
whose certificate is a finite exact computation, emit a Lean file stating the claim and
proving it by `decide`/`norm_num` or LeanCert's interval/Krawczyk certificates
(kernel-only mode, not `native_decide`), against a pinned Mathlib. That makes this
machine the NUMERIC AND SAT OVERLAY Palomar invites and does not have.
**Proof it works:** (a) re-derives the NS row and flags a planted statement mismatch;
(b) Strassen-7 compiles, a 1e-9 forgery fails to.

### K4 · Composition — certificates that cite certificates
*Pays for A7.* Promote cert-unit from a sandbox to the ledger: a composed certificate
names its premises by sha256, the rule that joins them (a short checked set:
conjunction; monotone transport of an inequality; infimum/supremum by witness + bound;
enclosure arithmetic; exhaustive partition + per-cell verdicts ⇒ universal statement),
and the premises' hypothesis stamps must agree or the composition is REFUSED. Checked
by re-checking the rule and the hashes, never by trusting that premises were once
checked. **Proof it works:** λ(6) < λ(5) as a composed certificate; a planted
hypothesis mismatch refused.

### K5 · Search-boundary certificates
*Pays for A2, A4.* (a) SAT proof logs: CNF emitted from our own finite claims, an
off-the-shelf solver, the UNSAT proof in LRAT checked by an independently verified
checker (cake_lpr), and optionally imported into Lean the way LRAT-Catcher does [R];
a planted satisfiable variant must come back SAT. (b) Partition certificates for
continuous domains — the census pattern generalised, the tiling checked by
`instruments/covering`. First use: the independence-number side of the 2026 Ramsey
witnesses (a lower bound R(s,t) > n needs a graph with no K_s AND no independent
t-set; the second half is the part that needs a certificate, not a search log).

### K6 · The certified-reward training harness
*Pays for A6 — the largest gap between what the README claims and what is measured.*
A small open model (1.5–4B, current in 2026) trained with GRPO on one RunPod GPU, the
same tasks under two rewards: a TOLERANCE verifier of the kind that accepts provably
wrong answers (89.5% here; every off-by-one ≥ 10⁴ in 2609.01354), and the CERTIFIED
verifier. Spec 4's lesson shapes it: no dense shaping (no gradient); a SPARSE binary
reward on families where the base pass rate is 5–60%, measured before any GPU hour.
Measured: the HACK RATE (rewarded outputs the certificate refutes) over training under
each reward; held-out certified-output rate on untrained families. Hypothesis, worth a
page either way: *a policy trained against a tolerance verifier learns to live in the
band it cannot see; one trained against a certificate cannot.*

### The register — a data layer
One schema over every published-claim audit, filled from existing ledgers, never
re-typed: claim · source pin · claimed precision · decided enclosure or exact value ·
verdict (HOLDS · REFUTED · REPAIRED · REFUSED · NEEDS DATA) · mechanism (one closed
vocabulary, reconciled with HLE-Verified's 19 categories) · the correction, certified ·
the certificate. The conversation's "graveyard", without the word — most rows HOLD and
the page says so first. The monthly ledger (D6) is its dated diff.

---

## 4. Campaigns, on the 2026 targets

Each ships the house way: targets row before the build, ledger, battery with red
controls, gated page, stop condition, the denominator published. Sends (issues, pull
requests, emails) are separate and per-item.

**A1 · Verifier soundness — "who checks the checker" (item 1, the flagship, re-aimed).**
Not a twelfth benchmark: an exact audit of the verifiers the new benchmarks stand on,
plus our own bench as the reference.
- *HorizonMath* (113 problems, CC BY, code public): enclose every credited "discovery"
  and every reference value to hundreds of digits — REFUTED where a 20-digit match
  hides a difference, otherwise the conjecture stands and is said to be one; measure
  what the 20-digit validator would accept that is provably wrong (the break-the-grader
  method).
- *The Endless Exam* (14 families, generators and verifiers released): run its verifiers
  against our forgeries — do they refute what they must?
- *EinsteinArena*: the tolerance margins, as done for its table in September, kept
  current.
- *Our Certified MathBench v0*: the twelve K1 families × rungs × the current models of
  every lab the budget reaches, at 2–3 effort settings. Per model: certified per 1,000
  output tokens, dollars per certificate, refusal rate (ours) apart from decline rate
  (theirs), false-proposal rate, time to certificate, distinct certified objects, and
  their slope against effort. The question: *does more reasoning buy more certified
  structure, or more sophisticated refuted structure?*
Buyers: frontier-lab eval and RL teams; benchmark maintainers (Epoch, MathArena).
Benchmarks to beat: the Endless Exam; 2609.01354.

**A2 · The AI-discovery sweep (item 2).** Decided as they land, one ledger:
- *Polynomial maps* — Gao's five maps in dimensions 3–5, the degree-14 Hessian
  counterexample (det = 128), weak Markus–Yamabe in dimension 14, Sra's 15+
  counterexamples [R]: exact identities and rational collision witnesses, on the
  existing keller instrument. Only the dimension-3 map is formally checked so far [S].
- *Kissing numbers, dimensions 25–55* — Qiushi (MIT/CC BY, exact-integer verifier) and
  Takhanov–Yun (float coordinates with error bounds) disagree on K(25) (197,580 vs
  197,058) ten days apart [R]: decide both configurations exactly, extending the K(11)
  ledger.
- *Ramsey lower bounds* — AlphaEvolve's nine, R(3,17) ≥ 93, R(4,15) ≥ 160, R(4,20) ≥ 252
  [R]: the witness graphs, with K5's independence certificates.
- *Shannon capacity of C7* — four records in eight weeks (3.258020 → 3.2588326), one in
  Lean, one with a Python verifier [R]: exact independence checks and the recursion.
- *ω < 2.371177* — NEEDS DATA until the repository ships; then an exact re-evaluation
  with directed logarithms, Zuiddam's Lean proof as the benchmark.
K3(a) runs on every AI-produced Lean artifact the watch finds.

**A3 · Answer keys at the scale RL uses them (item 3).** No exact audit of the RL
training sets exists [R: gap]: DAPO-Math-17k, DeepMath-103K, OpenMathReasoning,
Big-Math. The decidable subset only, counted (exact numbers or expressions checkable by
substitution); the rest UNREAD, never guessed (the GSM8K discipline). Per set: error
rate with denominator, each error typed in the closed vocabulary. Buyer: anyone training
RLVR on them — "genuinely wrong labels cost 8–10 points" (2603.16140) [R].

**A4 · One boundary a stranger can check (item 4).** First: the 2026 Ramsey witnesses'
independence side (K5a) — small, public, and currently backed by search logs or one
branch-and-bound file. Stretch: Erdős #647, where a Lean kernel check excludes
solutions to 10⁹ and older searches to ~9.17·10¹⁸ have no certificate [R] — a certified
extension is an existential-free universal claim, so it goes through K5 or not at all.

**A5 · The register, its monthly diff, and the starred constants (item 5).**
Build the register from the existing ledgers; publish September 2026 as the first
monthly instance. Then the targets with the highest visibility per hour in the whole
scan — the **11 starred constants of the Tao–Davis–Ivanisvili registry** [R]: C3a/C3b/C3c
(entropy certificates in exact rationals and outward-rounded logs, margins down to
2·10⁻¹¹; C3c's record uses weights with denominators of 10³²⁰), C84a/C84b (the
unit-distance chain, each row a finite parameter certificate and an exponent to
enclose, stated "given Sawin's theorem"), and the rest as the registry's own data
allows. Each is CERTIFIED or REFUTED; a pull request that removes a star is a SEND.

**A6 · Train on the certificate (item 6).** K6, pre-registered in the repository before
the first GPU hour: families, base pass rates, step budget, both rewards, metrics, and
what counts as a null. The tolerance verifier's exploitable band is measured before
training, so the experiment is not blind.

**A7 · The certified-lemma loop (item 7).** K2 + K4 in one domain where certificates
compose — the trig-polynomial minima program (λ(n), μ(n) are infima over finite sets;
witnesses are objects, bounds are enclosures; λ(6) < λ(5) already composes). Only
certified lemmas enter the store; the next round searches with them. Measured as
certified lemmas per dollar that a scan could not have produced. Exported through K3(b)
so the store can be offered to Palomar as a numeric overlay.

---

## 5. Sequence

Standing commitments first: the UFSC meeting (2026-09-30) and its Phase B; the METR
line. The program runs beside them in four waves, each ending with something live.

| wave | weeks | capabilities | campaigns | ends with |
|---|---|---|---|---|
| 0 | this week | the register | A5: register + September's ledger | the first monthly instance; targets rows for every §2 item used |
| 1 | 1–3 | K1 · K3(a) | A5 starred constants (C3a/b/c first) · A1 HorizonMath + MathBench v0 · A2 polynomial maps · K3(a) on FrontierMath Erdős's 18 AI-formalised statements | the first starred constants decided; the HorizonMath audit; the bench's first cross-lab table; the Lean audit tool's first external run |
| 2 | 3–6 | K2 · K5(a) · K6 | A2 kissing 25–55 + Ramsey · A3 first RL set · A4 Ramsey boundary · A6 | the controller's first object or its null; the hack-rate curve; one RL set's error rate |
| 3 | 6–10 | K3(b) · K4 | A7 · A2 Shannon capacity · A4 stretch | a composed certificate; Lean exports via LeanCert; the lemma loop's first round |

Wave 1 is chosen for audience yield and visibility per hour: verifier soundness and the
starred constants sit exactly where the frontier-lab and mathematics audiences are
looking in September 2026, and both run on instruments already built.

---

## 6. Budget — the only part that costs money

| item | estimate | note |
|---|---|---|
| A1 MathBench campaigns | $150–600 per full campaign | 12 families × ~40 tasks × ~6 model/effort cells × ~10k tokens; priced per model before the run, printed on the page |
| A6 GPU | $100–300 | one 80 GB RunPod GPU for 30–100 h; the hourly price stated before any pod is created |
| everything else | ~$0 | local compute; proposer tokens in A2/A7 metered by the campaign runner |

---

## 7. What this plan does not attack

The conversation's list stands (the Riemann hypothesis, P vs NP, general theorem
proving), corrected and extended:
- **Famous problems: audit the artifact, never race the problem.** An AI-produced Lean
  proof of Navier–Stokes blowup arrived here in September and was audited (the
  certificate holds; the paper's energy clause is not in it). That is the move for
  every headline claim: K3(a).
- **No race with the provers** (DeepSeek-, Goedel-, Seed-, Kimina-style, AxiomProver,
  Aristotle, Gauss): they are proposers to this machine; K3 audits what they emit.
- **Asymptotic proofs** (most of OpenAI's "ten advances"): not reducible to finite exact
  facts; out of the grammar.
- **No LLM judge or reward model in any verdict.** A family that needs one is not a
  family.

---

## 8. The novelty watch — standing, read-only

A weekly read that writes corpus/targets.json rows and nothing else: Tao's
optimization-problems registry (new rows, star changes), erdosproblems.com and its AI
wiki, Epoch's benchmark reviews and FrontierMath Erdős, Palomar, EinsteinArena, the
AlphaEvolve result repositories, HorizonMath / Endless Exam releases, bounds-ledger,
arXiv math.CO / math.NT / math.MG / cs.AI for "AlphaEvolve", "LLM-guided",
"counterexample", "record". Memory, not a gate. A scheduled routine can run it; that is
the operator's call.

---

## 9. Honest risks

- **Velocity.** Records now move weekly (K(25) twice in ten days; C7 four times in
  eight weeks). A decided row can be superseded before its page ships: pages say
  "decided as of <commit>", and the watch re-queues superseded rows.
- **The scouting read is not the source.** Several §2 items are [S]; every target is
  re-read from its primary source, and its bytes pinned, before a build starts.
- **Families' red controls rot.** Every K1 family needs its own forgeries.
- **Scale.** Labs search deeper; this machine wins on target selection and cheap exact
  decisions (the #852 record came from a plain scan).
- **A6 may show no hacking at 1.5–4B** and a few thousand steps; pre-registration makes
  the null publishable.
- **K3(b) can outgrow its value.** Export only what `decide`/`norm_num`/LeanCert replay in
  minutes; never build an interval library in Lean — LeanCert is that library.
- **Keep the machine lean.** K1 replaces the oracle's single-family code; K4 promotes
  cert-unit rather than adding a second graph model; dead code dies in the wave that
  makes it dead.

---

## 10. Decisions for the operator

**RULED 2026-09-29** (the operator: "1. Yes 2. Cap in US$100 3. Yes 4. Yes"):
1. The program and its order: APPROVED.
2. Budget: **US$100 in total** for everything that costs money (A1's model calls and
   A6's GPU together), read as one ceiling, not per item; spent in the order the waves
   reach it, each spend priced on the page before it happens. Which labs: whatever the
   keys on this machine reach inside that ceiling.
3. A6's pre-registration is published in the repository before the first GPU hour: YES.
4. The novelty watch runs as a weekly scheduled routine: YES.

What was asked:

1. **The program and its order** — wave 0 this week beside UFSC; wave 1 next.
2. **Budget** — A1 (which labs' models; a ceiling per campaign) and A6 (a GPU ceiling on
   RunPod).
3. **A6's pre-registration** published in the repository before the first GPU hour.
4. **The novelty watch** — a scheduled routine, or read by hand at each session start.
5. **Sends** stay per item (a pull request removing a registry star, an issue to a
   benchmark, a note to an author) — nothing goes out without the word.
