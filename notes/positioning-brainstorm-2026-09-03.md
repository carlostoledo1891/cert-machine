# cert-machine: positioning (operator input, received 2026-09-03)

Reference note — why the machine is different, who the neighbours are, how long
the field stays open, and how to talk about it. Written to be applied to the
site, the repo, the grant application, and any conversation with a lab.

Transcribed verbatim from the note handed to the session; only mojibake from the
source encoding (em-dashes, λ, §) was repaired. Nothing was added or removed.
The decisions this note demands are in `notes/positioning-decisions-2026-09-03.md`.

---

## 1. The one sentence

> **Independent certification of AI-generated mathematical claims — exact
> arithmetic, no shared code, refusal as a verdict.**

Hold this for a year. Three repositionings in a month (conjecture engine →
verification layers → verification infrastructure) is a symptom of the field
having no name. The churn costs more than any single phrasing gains: nobody
can recommend you to a third party if the description changes between the
recommendation and the click.

Drop "the conjecture engine" from the title. It names a generator. The empty
field is the judge.

---

## 2. Why the machine is different

No single ingredient is new. The **composite** is what has no neighbour.

**a. Exact arithmetic as the only admissible evidence.**
Floats may prune, never decide. A rounding error can cost time and can never
cost truth. The validated-numerics tradition (Tucker, Galias, CAPD, Arb, the
radii-polynomial school) works this way — but on classical problems, never
pointed at AI output.

**b. REFUSED is a real verdict.**
Almost every verifier in existence returns pass/fail. A third verdict —
*this instrument cannot decide, and here is why* — is what separates an
auditor from a scorer. It is also the single most credibility-generating
behaviour available, because it is the one thing a motivated party would
never build.

**c. Independence by construction.**
Never runs the authors' code. Auditor shares no code with prover. Certificates
detach and re-run on stock Python with no engine present. A lab can build an
exact verifier; it cannot build an independent one, because it is the author
of the claim.

**d. Forgeries in every run, and the run aborts if one passes.**
This converts "the grader is sound" from an assertion into a measured number.
Every genuine bug the project has found was caught this way — none by reading
code.

**e. Pointed at AI claims specifically, with corrections published where the
claim lives.**
The #852 correction is in the problem's own thread, not only on the site. That
is the difference between an audit and a blog post.

**f. The same instrument is an eval grader.**
The gap between "graded correct" and "is correct" — the gap a policy learns to
exploit — does not exist when the grade *is* the proof. There is no answer key
to leak and no rubric to game.

---

## 3. The similars, and why none occupies the square

| Neighbour | What it is | Why it isn't you |
|---|---|---|
| **Formal provers / autoformalizers** (Lean, AlphaProof, Harmonic, Logical Intelligence, Math Inc) | Highest trust base; kernel-checked | Expensive, statement-bound, and inherits the gap between the formalized statement and the intended one. Owns theorems, not constants and constructions. |
| **Lab-side verifiers** (per-problem checkers on open-problem platforms, evolutionary-search evaluators, benchmark answer keys) | Fast, task-specific | Float-tolerance, and never independent of the claim's author. "Residual violation driven down" is the tell. |
| **Human panels** | Highest judgment | Doesn't scale, and typically verifies an *edited* version rewritten into human language, not the artifact as submitted. |
| **Validated numerics in academia** | Your direct lineage | Not looking at AI output, and publishes into journals rather than into the claim's own thread. |
| **Benchmark maintainers** | Own the answer keys | Are the *subject* of your audit, not a competitor to it. |

Your square: **exact, independent, re-runnable, refusal-bearing, aimed at AI
claims, one rung below Lean.** Nobody is standing there.

---

## 4. Is the field crowded?

**Not now.** Generation is crowded — big labs, big compute, headline results.
Formalization is getting crowded and well funded. Independent exact audit of
AI numerical claims is close to empty.

**It will fill.** The demand is loud, and the trust question is being asked out
loud in the same papers you would cite.

**Estimate: 12–24 months** before either autoformalization eats the middle band
from above, or leaderboards bolt exact checkers onto their verifiers from below.

**The slice that stays open longest is cross-lab independence.** That is a
structural moat, not a technical one — it cannot be built by anyone who is also
generating the claims. Everything in the positioning should lean on it.

---

## 5. How to communicate it — nine moves

1. **Name the category and keep the name.** One sentence, one year (§1).

2. **Lead with refutations, not theorems.** Theorems earn respect; catches earn
   attention. The order that works: the catch → what the catch implies about
   the ecosystem → the instrument that found it.

3. **Reframe your own theorems as calibration, not product.** The site now
   leads with "two theorems and two audits," which is a *prover's* credential.
   The fix is one sentence, not a rewrite:
   > *Only a machine that can prove a theorem should be trusted to refuse one.*
   Same content, different verb. λ(4), the trapezoid, the MFG pair become the
   proof that the instruments are strong enough for their refusals to count.

4. **Fix the refusal counter.** `REFUSED · HONEST: 1` next to "REFUSED is a
   real verdict here and it gets used" is the single largest credibility hole
   on the site — a claimed behaviour with one instance reads as a slogan.
   Either fold in the refusals that already exist elsewhere (SkyAudit's
   NEEDS DATA verdicts, the six-theorem audit's *partial*), or split the
   counter into decisions vs. intake refusals and publish the refusal rate on
   submitted claims. **A verifier's refusal rate is a headline number.**

5. **Publish in the record, not only on the site.** Problem threads,
   leaderboard forums, repo issues, PRs against public constants
   repositories. External acceptance is the only credential an unnamed field
   has. Show up as a re-runnable artifact in the other party's format, one
   result at a time — never as a pitch.

6. **Build intake.** The oracle is currently a library to download. Make it a
   queue: submit a claim, receive CERTIFIED / REFUTED / REFUSED with a
   certificate, publicly logged. This is what converts "a person who audits
   things" into "the place claims go."

7. **Cadence over spectacle.** A monthly public ledger — *Claims decided,
   September 2026* — beats one brilliant post. The reference point in an empty
   field is whoever shows up every month.

8. **Three audiences, three framings, never on the same page.**
   - Mathematicians: a short arXiv note with the certificate attached.
   - Eval / RL people: *a grader where the grade is the proof.*
   - Everyone else: the bug story.

9. **Make adoption cheaper than building in-house.** One curl, no
   dependencies, certificate detaches. That is the moat — not the theorems.

---

## 6. What not to change

These are the assets, not the friction:

- The **limits** section. Stating the trust base (big-integer arithmetic,
  IEEE-754 rounding, named external theorems consumed rather than proved) and
  placing yourself one rung below Lean is why the rest is believable.
- The **Chowla disclaimer** — a certificate file that says the measured trend
  is *evidence against the direction you might want*. That is the most
  credible paragraph in the project. It should be more visible, not less.
- **Forgery batteries** and **detached stdlib verifiers**.
- **Honest counting** ("two theorems plus a table, never eight").

In this field the credibility asset is the willingness to publish the sentence
that weakens your own claim. Protect it above everything.

---

## 7. Sequence

| When | Move |
|---|---|
| Now | Rename, add the calibration framing, fix the refusal counter |
| 2 weeks | Intake queue live; first monthly ledger post |
| 1 month | One live headline claim decided in public, whichever way it falls |
| 2 months | The grader benchmark: re-decide public answer keys, publish error rate per source — nobody benchmarks the graders |
| Ongoing | λ(5)/λ(6) as an arXiv note under your own name, linked from calibration — not on the front page competing with the position |

---

*The position in one line, if only one line survives: **generation is crowded;
judgment is empty; and the one property the labs cannot build for themselves is
independence.***
