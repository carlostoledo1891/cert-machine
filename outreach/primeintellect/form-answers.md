# Prime Intellect — the Ashby form, drafted (2026-10-05; the application is a SEND, the operator's)

Role: **Applied Research – Forward-Deployed** (SF, hybrid-remote, visa sponsorship).
https://primeintellect.ai/careers/73f42d73-f967-4082-b599-b8914135a6b3
The form has five fields: name, email, project links / cool things built (optional), what you optimize for
(optional), why Prime Intellect (optional), and the resume (resume.md, rendered to PDF).

## Links to projects / cool things you've built

1. **Three reward designs, one environment, on Hosted Training.** A pre-registered GRPO study on Qwen3.5-9B.
   An answer key and an exact grader both taught the model to stop abstaining; a ternary grader taught it to
   abstain on everything. The per-step metrics show why: the binding constraint was the policy's ability to
   decide, not the reward. On the way I found two platform faults: the hosted 4B trainer delivered no policy
   updates (reported via `prime feedback`), and verifiers 0.3.1's SandboxEnv cannot be built with any
   prime-sandboxes it accepts (repaired and verified on a real sandbox).
   → [WRITE-UP URL, once published]
   · github.com/carlostoledo1891/cert-machine/blob/main/notes/lattice-claims-rl-preregistration-2026-10-04.md
2. **`carlos-toledo/lattice-claims` on the Environments Hub.** Three graders, a due-split rubric and a
   Python-tool mode. → app.primeintellect.ai/dashboard/environments/carlos-toledo/lattice-claims
3. **The September 2026 kissing-number wave, decided exactly.** 215 billion pairs, 0 violations, and the first
   independent certification of K(18) ≥ 8,358. → carlostoledo.co/reports/kissing.html

## What do you optimize for in life?

[OPERATOR WRITES THIS. It has to be his voice. A possible angle, from how the lab works: being right in
public. That means numbers anyone can recheck, refusals stated as verdicts, errors published with their date,
and negative results reported as results.]

## Why are you interested in Prime Intellect?

Because the bottleneck in RL is the verifier, and you are building the open place where verifiers are made,
shared and trained against. I have spent this year making graders that cannot be gamed, deciding AI-generated
mathematics in exact arithmetic with refusal as a verdict. This month I took that onto your stack: environments
on the Hub, a pre-registered experiment on Hosted Training, and two platform faults found, reported and routed
around. The result I care most about came out negative: rewarding the right abstention is not enough if the
policy cannot decide the task. A forward-deployed engineer meets exactly that every day with customers: the
reward looks right and the model learns something else. I would like to do that work with your customers, on
Lab.

---
Before sending: the write-up URL; the resume's two OPERATOR FILLS; the "optimize for" answer; and the
operator's word. Filing the verifiers/prime-sandboxes issue on GitHub is a separate send; the draft text is
in verifiers-issue.md.
