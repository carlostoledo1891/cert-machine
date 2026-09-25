# The Lever form answers — both METR roles (DRAFT 2026-09-25; the application is a SEND)

The Lever forms have no cover-letter field. They ask two free-text questions, a resume upload,
and four dropdowns. What follows are the answers, per role, every figure a ledger field
(certs/horizon-ledger.json, certs/gsm8k-ledger.json, certs/blind-spot-inspect-ledger.json).
The cover notes in this directory stay as the long form for a conversation; these are what
goes in the boxes.

## The dropdowns (both roles)

- Authorized to work in the United States: **[OPERATOR FILLS]** (the Eval Execution posting
  says a cap-exempt H-1B is likely; Task Dev says contractor arrangements can be discussed)
- Where are you currently based: **Brazil (UTC−3)**
- Happy to relocate to / already in the Bay Area, in-person in Berkeley: **[OPERATOR FILLS]**
  — the honest options are "Yes" with a start date, or "Other" with the contractor line for Task Dev
- How did you hear about this role: METR's Website
- Earliest start: **[OPERATOR FILLS]**
- Accelerated timeline: leave blank unless another offer is live
- Sharing with similar organizations: **[OPERATOR FILLS]** (the roles scan names Epoch, Apollo,
  AISI — sharing costs nothing)
- LinkedIn: [OPERATOR FILLS] · GitHub: github.com/carlostoledo1891 · Website: carlostoledo.co

---

## Task Development Engineer

**What's the best evidence that you'd potentially be great in this position?**

Three public artifacts, each built this month, each graded by an exact verifier with no answer
key, no judge model and no tolerance:

1. A task your posting could have described. blind-spot hands a model a mutated RTL netlist
   (yosys mutants of a comparator, SAT-labelled: 348 killable with a verified witness, 51 proved
   equivalent) and asks for input pairs that kill the mutant, or a proof of equivalence. A kill is
   verified by simulating the netlist; equivalence against the SAT proof. Three rungs — the defect
   named, only its testbench profile, nothing — make a ladder that separates Opus, Sonnet and
   Haiku, and a budget ladder crosses it: Sonnet 5 solves 8/12 → 10/12 → 12/12 of the located rung
   as its effort goes low → medium → high; 180 frontier rollouts through Inspect, every one re-scored
   offline with zero disagreements; Opus 5 declines the profile rung on a content policy, recorded
   as what it is. It ships as an Inspect task whose scorer is the verifiers rubric's own function, with a
   battery proving both frameworks grade every one of the 400 pooled mutants identically (892
   submissions, 0 disagreements). Your posting's "familiarity with Inspect" is a shipped task,
   not a checkbox. carlostoledo.co/instruments/blind-spot · the Inspect port is in the repository.

2. QA that finds misspecification mechanically. I re-decided GSM8K's answer key: every
   calculator annotation and prose step of the 8,792 keys evaluated exactly. The arithmetic is
   clean where humans looked and slips where no model disagreed — two test keys print a step that
   does not hold, both in items GSM8K-Platinum never inspected because every model got them
   right — and Platinum's ten relabellings all have arithmetic that holds: readings, not sums.
   Three seconds a run once built. carlostoledo.co/reports/gsm8k-audit.html

3. Your own methodology, certified. I re-implemented the Time Horizon 1.1 estimator in
   standard-library Python and proved each fit has exactly one optimum in a box below 10⁻¹⁰:
   all 44 fits on your public runs and site files certify; your printed coefficients are the
   rounding of the box for 22 of 23 models; the post-2023 doubling time re-derives as 128.74 days
   against your printed 128.744. carlostoledo.co/reports/time-horizon.html

Behind them: a machine with 92 gated batteries and red controls that must fire on every build,
because a check that has never gone red is decorative. Attention to detail is not a trait I
would claim; it is what the gates enforce, and the handoff records the one false start this
month that a gate refused before it shipped.

**Why METR?**

Because the thing I have been building toward is the number METR publishes. My thesis is that
an evaluation is only as good as its grader, and that the graders worth having are verifiers —
a proof, a simulation, an exact decision — not judges. METR's time horizon is the one capability
measurement with real consequences for policy, and it rests on tasks, baselines and a fit. I have
now checked the fit to the last bit on your data; I would like to build the tasks. Specifically:
tasks that stay hard because their grader cannot be gamed, baselines that are timed and pinned,
and a time-horizon number on tasks with no judge in the loop, which does not yet exist anywhere.
The posting's contractor line matters to me: I am in Brazil, and I would rather start on any
terms and let the take-home decide.

---

## Member of Technical Staff, Evaluation Execution

**What's the best evidence that you'd potentially be great in this position?**

Running, re-running, and writing the number so three audiences cannot disagree about it:

1. Running models on tasks, with the framework's own score checked. This month I ran three
   verifier-graded environments against Opus 5, Sonnet 5 and Haiku 4.5 through two frameworks
   (verifiers and Inspect). Every rollout is re-scored offline and the framework's reward is
   required to equal the package's — 0 disagreements — and the defect that would have printed a
   clean 0.000 with no error (scoring handed message objects, not dicts) is caught by a binding
   test that skips rather than passes when the framework is absent. Cost, refusals and
   truncations are recorded as what they are, never folded into a rate.

2. The number as a certificate. Your Time Horizon 1.1 estimator, re-implemented in standard-
   library Python with the optimum proved unique: 44 of 44 fits certify with boxes below 10⁻¹⁰;
   your printed coefficients are the rounding of the box for 22 of 23 models; your p50 estimates
   sit within a solver's tolerance of the enclosure and never inside it; the post-2023 doubling
   time re-derives as 128.74 days against 128.744. carlostoledo.co/reports/time-horizon.html

3. The same result written for a system card, a regulator and a post — section 5 of that page —
   from the same ledger fields, so the paragraphs cannot drift. Every chart on my site is
   generated from the record it cites and driven through headless Chrome by a layout ruler and a
   render ratchet, so a figure cannot get thinner between builds without refusing the build.

Speed, honestly reported: the GSM8K audit (8,792 keys, every step) went from scouting to a
gated page in one session, and its false start — a survey that mixed two populations and minted
a finding — was refused by the page's own gate and is recorded in the handoff.

**Why METR?**

Because METR is where a capability number has to survive three readers at once — the lab, the
regulator, the public — and I have spent this year making numbers that survive that: computed
once as a certificate, written three times. Your posting asks for someone who runs the models,
builds the software that makes the next run faster, and writes the conclusion. I want to do
that on the measurement that matters most, and I want the fit under it to be provable rather
than trusted, which I have now shown is a two-minute computation on your own data. I am in
Brazil; the posting's H-1B line is why I am applying rather than only reading.

---
Notes for the sender: the Task Dev form (fetched 2026-09-25) asks both questions; the Eval
Execution form, as fetched the same day, showed only the resume, the dropdowns and the
accelerated-timeline box — no "best evidence" or "why METR" field. Keep the Eval Execution
answers ready in case the live form differs; if it does not, append the cover note as page two
of the resume PDF so the reader still meets it. The three links resolve. If a box has a character
limit, cut the third item of "best evidence" first — the resume carries it.
