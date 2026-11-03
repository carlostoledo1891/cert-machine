# Anthropic Residency — the application (US posting job-boards.greenhouse.io/anthropic/jobs/5438311008; closes 22 Nov 2026
# 11:59 PM PT; offers January 2027). Paste-ready; [YOU] marks a fact only Carlos has. Every number from a record.

## Logistics (the short fields)

- In-person 25% of the time: **Yes** (for a three- or six-month placement; a six-week placement is remote-only by their rule).
- Earliest start: **[YOU — e.g. "February 2027, or earlier for a remote six-week placement"]**
- Deadlines or timeline considerations: "None that bind. I am also an applicant to the a16z speedrun (SR008, Feb–Apr 2027); if both offer, this residency comes first."
- Open to relocation: **Yes**
- Address from which you plan to work: **relocating** (for 3/6 months); for six weeks remote: Florianópolis, Brazil.
- Residency lengths: **Three months, Six months** (and Six weeks if you want the remote option on the table — note it is remote-only and unsponsored).
- Mentor areas (select all that apply): **Scalable oversight; Adversarial robustness and AI control; ML systems and reinforcement learning.**
- Visa sponsorship required: **Yes** (both questions: Yes). Carlos holds a US visitor visa through 2029; a work visa needs sponsorship, which the posting offers for placements ≥ 3 months.
- Interviewed at Anthropic before: **[YOU]**
- AI policy: Yes. Arbitration: read and agree.
- Resume: outreach/resume/resume.pdf (v4.1, built 2026-11-03). LinkedIn: linkedin.com/in/carlos-toledo. Website: carlostoledo.co/verify.
- References (2–3, name · current role · how you worked together; not contacted at this stage): **[YOU — suggestions: Pedro (UFSC, co-author of the method paper); the Finsweet lead; a registry maintainer or a claimant who credited the work, only with their consent]**

## Why Anthropic? (200–400 words; 318)

Because Anthropic is the lab whose own work I have been checking, and it held up. In October I replayed your formal-math team's refutation of the Exponential Time Hypothesis from its pinned bytes under two kernels, read its statement against the textbook claim, wrote the bridge from one to the other in Lean, and published what the kernels say and what they do not. Anthropic re-ran my replay; your registry merged my pull requests. That is the relationship I want with a lab: not a critic outside the wall, but a verifier whose results the lab can use.

The problem I care about is the one your scalable-oversight and control teams name: as models produce more than any human can read, the question becomes what can be checked rather than trusted. My answer so far has been narrow and exact. I built an open system that re-decides machine-generated claims in exact arithmetic or under a proof kernel, with code that shares nothing with the claimant, and returns one of three words: certified, refuted with the object that breaks it, or refused with the reason. 131 published AI claims are decided that way with public records; Terence Tao's registry cites the replays; independent people have re-run them with no disagreement. On the training side I measured that a tolerance grader rewards 89.55% of 4,000 provably wrong answers, and built RL environments whose reward is a certificate instead.

What I cannot do alone is the next step: oversight that scales past the finite, exactly decidable layer, and reward signals a policy cannot game at the scale a frontier lab trains at. That needs the models, the compute and the people who think about this every day. I have ten years shipping products, three months of empirical work at this pace with Claude as my engineering team, and a habit of attacking my own verifier before trusting it (572 planted forgeries, none certified). I would like to bring that to a team where the question is how to keep a much stronger system honest, and to learn how that question looks from inside.

## What research would you most like to work on, and why? (≈ 300 words)

Oversight by certificate, pushed as far as it goes, and an honest map of where it stops.

Concretely, three threads, any one of which fits a three-month placement:

1. **Reward signals a policy cannot game.** Today's measurement: a tolerance grader admits 89.55% of 4,000 provably wrong answers, and tightening it by twelve orders of magnitude does not close the hole; a certificate grader admits none. The open question is what a policy learns from each. I have the environment (Verify Gym, pre-registered, a frozen held-out set, two deciders) and the stopping rule; I lack the training runs at scale and the comparison with a model-judged reward. The deliverable is a measured answer to "does an ungameable reward teach something a gameable one does not", with the failure modes of the certificate grader itself (over-abstention, which I already observed on a 9B model).

2. **Statement fidelity as an oversight problem.** A proof checker verifies the statement it is handed; nobody checks that statement against the claim. In OpenAI's math release 34 of 242 formalized families prove less than their headline with nothing saying so; both labs' ETH refutations are refutations in a machine model, with the textbook steps in prose. I want to turn "does this formal statement mean what the claim says" from a reading into something a model can be held to: claimbox, my open translator from claim text to checkable objects, is the start, and a red-team of planted statement drifts is the test.

3. **The verifier attacked before it is trusted, applied to a lab's own graders.** The self-audit method (pre-registered mutants, a witness for every false one, the verifier fixed on the record) applied to reward models and judges, with the false-accept rate per kind of forgery as the metric.

Why these: they are the three places where I have found that "checked" and "trusted" come apart in practice, and each has a public record behind it that a mentor can inspect before deciding whether the work is worth a desk.

## Links (each with involvement and context)

- https://carlostoledo.co/eth/ — Both labs' ETH refutations replayed under two kernels, the textbook ETH written once in Lean and refuted in each lab's model (51 bridge theorems), the third-party bridges replayed. Sole author.
- https://carlostoledo.co/reports/openai-math.html — OpenAI's math release audited at a pinned commit: 416 Lean challenges under a second kernel, 34 of 242 statements read as narrower than their headline. Sole author.
- https://carlostoledo.co/reports/weight-space-programming.html — MIT's weight-edit claim decided from the bytes and re-run under the model's own settings within a day of the post; the authors told the same afternoon. Sole author.
- https://carlostoledo.co/reports/envs.html — 4,000 provably wrong answers against tolerance graders; the certificate grader. Sole author.
- https://app.primeintellect.ai/dashboard/environments/carlos-toledo/verify-gym — the RL environment with a certificate reward; pre-registered scorecard of seven open models. Sole author.
- https://carlostoledo.co/reports/selfaudit.html — the verifier attacked before it is trusted: 572 planted forgeries, 0 certified, 77 defects found and fixed on the record. Sole author.
- https://github.com/carlostoledo1891/cert-machine — the whole system, open, one author, built with Claude.
- https://carlostoledo.co/verify/ — Verify, the product built on it.

## Additional information (the cover note, ≈ 150 words)

Three things the form does not ask. First, I am not an ML researcher by training: I am a product designer and engineer who, since August 2026, has built an exact-verification system alone with Claude and used it on frontier-lab claims in public; the gaps in my background are distributed training, which I have not done, and ML-venue publications, which I have none of. Second, every result I cite is a public, re-runnable record, including the null ones; I report what did not work. Third, I work from Brazil today and hold a US visitor visa through 2029; a three- or six-month placement with sponsorship is my preference, and a six-week remote placement is fine if that is the fit. The method paper (draft, with academic co-authors) and the self-audit are the two documents I would want a mentor to read first.
