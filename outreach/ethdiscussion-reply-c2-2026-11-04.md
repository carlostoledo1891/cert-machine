# DRAFT — a reply under our own comment-24 on ethdiscussion.blog/2026/11/01/announce-your-results/

Status: DRAFT, not sent. The send is the operator's word; it is posted by hand (the blog's form) as a REPLY to
#comment-24, not as a new top-level comment. No e-mail to the organizers: the channel rule (never start an e-mail).

Why a reply: comment-24 (11-03) said that "the step between the two machine models is not formalized by either lab; it
is the one thing still read". C2 formalizes the step from Anthropic's statement to a standard machine, so this reply
corrects our own earlier sentence. Hawkley's comment-22 says that "equivalence with textbook ETH remains a separate
question", and C2 addresses the machine-and-encoding part of that question. The reply credits him and stays within that
part.

Prior and parallel work to name, not to claim over:
- Siyuan Zhuang (comment-17): two new proofs, "formalized in Lean 4 down to a primitive multitape machine".
- cslib-community/complexitylib: a native re-proof on cslib's multitape machine.
Both are re-proofs. C2 is a bridge from a lab's own statement. That difference is the only claim of novelty, and it is
stated as "as far as I found".

Checked against certs/eth-c2.json (CERTIFIED), certs/eth-c1.json (CERTIFIED), certs/eth-cslib-d1.json (CERTIFIED).

---- PASTE (reply to #comment-24) ----
An update to my comment above. There I said that neither lab formalizes the step from its own machine model to a standard one. For Anthropic's statement, that step is now proved in Lean:

If Anthropic's ETHIsFalse holds, then for every δ > 0 a deterministic multitape Turing machine (cslib's, as used by cslib-community/complexitylib) decides 3-SAT on the plain binary encoding of every formula in time c · 2^(δn) · (L+1)^e + c. Here n is the number of variables and L the input length. Variable names may be arbitrary, and literals and clauses may repeat. Anthropic's MainResults.lean is used byte for byte. The proof converts the input to Anthropic's encoding in polynomial time and simulates the machine Anthropic's statement provides (Mathlib's FinTM2) on the multitape machine.

With Daniel Hawkley's chain from OpenAI's theorem to ETHIsFalse (comment above), both labs' statements now reach the same standard machine.

What it does not settle: the steps run on three Lean versions (4.33.1, 4.34.1, 4.36.0-rc2), and I have read, not proved, that the copied statements mean the same in each. That a formal ETH is the textbook ETH remains a reading of a definition. Siyuan Zhuang's proofs (on OpenAI's machine model) and complexitylib's (on cslib's) are native re-proofs. As far as I found, this is the first link from a lab's own statement to a standard machine.

Checked from pinned files with Lean's kernel and nanoda (23,430 declarations) plus leanchecker --fresh; three deliberately wrong variants were refused. Separately: ETH also fails on the word RAM with O(log L)-bit words, from complexitylib's proof. I wrote the statements, Claude wrote the proofs, and my own checker, also built with Claude, decided them. The roles are separate, but this is not an independent second party.

Figure and records: https://carlostoledo.co/eth/#standard
Lean source: https://github.com/carlostoledo1891/claimbox/tree/main/lean/eth-bridge
