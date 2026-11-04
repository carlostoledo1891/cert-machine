# AI agents as the claimant, an exact decider as the judge — a method note (DRAFT, 2026-11-04)

Status: draft for the papers plan (memory papers-plan-elsevier). Not published, not sent. Operator's word, 2026-11-04:
"A method note (later)".

## The shape

Each role has its own owner, and one rule:

- **Claimant.** claimbox and the AI agents it directs (Claude) write the proofs. Their output is a proposal, never a verdict.
- **Statement.** It is written by hand and pinned in cert-machine before any proof is decided. Here, corpus/eth-refutation/c1/statement.lean (sha256 780a69de…) and c2/statement.lean (c84eae82…).
- **Judge.** cert-machine decides from pinned bytes with tools it wrote. That means the statement check, its own axioms file, two kernels (Lean's, and nanoda through lean4export), `leanchecker --fresh`, and planted wrong variants that must be refused.
- **Words.** There are three: CERTIFIED, REFUTED, REFUSED. A control that does not fire refuses the record.

The agent is allowed to be wrong as often as it likes. The design never asks whether the agent is trustworthy; it asks
whether the judge can be fooled. The planted variants measure that on every run.

## The case: the ETH machine-model gap, closed in one day

The two labs' October proofs that ETH is false each sat on a machine of their own making. The gap every reader named was
the step from those machines to a textbook one. On 2026-11-04:

| step | what | proof by | decided |
|---|---|---|---|
| D1 | complexitylib's native ¬ETH on cslib's multitape TM | complexitylib's agents | CERTIFIED (certs/eth-cslib-d1.json) |
| C1 | ¬ETH on the word RAM at logarithmic word size | a Claude agent in claimbox | CERTIFIED (certs/eth-c1.json; nanoda 49,735 declarations) |
| C2 | Anthropic's ETHIsFalse ⇒ cslib ¬ETH | a Claude agent in claimbox | CERTIFIED (certs/eth-c2.json; nanoda 23,430 declarations) |

What the agent had to invent, rather than look up:
- C1: a space bound on simulated addresses, where the library bounds them by time.
- C2: a uniform degree-one certificate for one TM2 step. The library's per-program polynomial is circular when the program is chosen after δ.

Compute for the three decisions: three 4-vCPU pods, about US$1.1 in total.

## Why this, and not brute force

"Brute force" here means more compute in the claimant's loop: more samples, bigger searches, more agent turns, with a
weak or tolerant checker at the end. Its failure mode is known (memory exactness-in-the-loop, the bisection erratum): a
tolerant selector admits near-misses, and the count of "successes" grows faster than the count of true ones. The shape
above moves the expense to the judge's side, which stays exact and cheap. The agent may search as widely as it likes; one
pinned statement and two kernels decide the result.

## What it is not

- **Not a second party.** claimbox and cert-machine have one operator; the separation is of roles.
- **Not a check of meaning.** That a statement means what its words say is a reading, here of a definition of ETH. The method shrinks the reading to a standard machine; it cannot remove it.
- **Not free of trust.** The trust base is Lean's kernel, nanoda, lean4export and our axioms file, each named in the records.

## For the paper

This could be a §8 "claim more" case for the method paper: the claimant/judge split, the planted-variant measurement,
and the ETH day as the worked example. The numbers come from the three records above.
