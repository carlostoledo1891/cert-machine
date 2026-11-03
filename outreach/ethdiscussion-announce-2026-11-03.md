# Draft — a comment on ethdiscussion.blog/2026/11/01/announce-your-results/ (Mohan Paturi's "announce your results"
# post; the format he asks for: full name, affiliation, coauthors, the result in a few sentences, a link). The SEND is
# the operator's word; he also asks that the document link be e-mailed to rpaturi@ucsd.edu for the ETH_Repository —
# that e-mail is the operator's to send or not (the channel rule).

Carlos Toledo, independent (cert-machine, carlostoledo.co; São Paulo). No coauthors; the tools and the Lean proofs below
were written with Claude, and one of the two claims examined is Anthropic's. I have no affiliation with either lab.

Three verification results about the two formalized refutations, not new algorithms:

1. Both Lean developments (openai/math family 378 at 7ef5c0cc, Lean v4.34.1; anthropics/formal-math eth at 16a5ce41,
   Lean v4.33.1) replayed independently with Comparator under Lean's kernel and under nanoda, each against its own
   statement, with leanchecker --fresh over the whole closure: both check, standard axioms only.

2. The textbook ETH (Impagliazzo–Paturi: s_k > 0 for every k ≥ 3, s_k an infimum) written once in Lean over an abstract
   machine model, instantiated with each lab's own machine model and input encoding, and each lab's statement proved
   to refute it in its own model; the same for #ETH, since both statements count. 51 theorems, each checked by two
   kernels. The step between the two machine models is not formalized by either lab; it is the one thing still read.

3. Two third-party bridges across that step, replayed with the same two kernels and certified: TSavo's
   Bridge.ethIsFalse_of_claim (OpenAI's challenge statement as a proposition ⇒ Anthropic's ETHIsFalse, inside
   Anthropic's project) and Daniel Hawkley's RPI-378.3d (¬ PositiveRateETH ⇒ MainResults.ETHIsFalse, inside OpenAI's
   project) together with his link from OpenAI's accepted theorem to ¬ PositiveRateETH (built on the whole family-378
   proof; nanoda on the exported closure, leanchecker --fresh 44 min). With Hawkley's two halves the chain from OpenAI's
   accepted theorem to Anthropic's ETHIsFalse is kernel-checked end to end inside OpenAI's Lean and Mathlib. What
   remains read, not decided, is the version seam: for TSavo's direction I exported both closures and compared them
   term by term — the statement is the same kernel term up to a binder name, but the two Mathlibs build ℝ differently
   (308 of 2,689 constants differ), so no single kernel has checked that the two ETHIsFalse are one proposition.

Every record is public and re-runnable with no code of the claimants: https://carlostoledo.co/eth/ (the records are
JSON files under github.com/carlostoledo1891/cert-machine/tree/main/certs: eth-kernel, eth-bridge, eth-seam,
eth-tsavo-bridge, eth-hawkley-bridge, eth-hawkley-heavy). Nothing here says ETH is false: a kernel cannot say what a
statement means, and the readings of what the two statements mean are kept apart from the kernels' verdicts.
