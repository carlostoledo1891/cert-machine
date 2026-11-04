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
An update to my comment above. I wrote there that the step between the machine models is formalized by neither lab. For Anthropic's statement, that step is now in Lean:

MainResults.ETHIsFalse → ¬ETH, where ETH is cslib-community/complexitylib's: deterministic cslib multitape Turing machines, 3-SAT on the binary encCNF of every formula (any labels, repeated literals and clauses), time c · 2^(δn) · (L+1)^e + c. Anthropic's file is used byte for byte. The proof adds a polynomial-time conversion to encClauses 3, and a TM2 simulation whose cost does not depend on the program; the program is chosen after δ.

With Daniel Hawkley's ¬PositiveRateETH → ETHIsFalse (comment above), both labs' statements reach the same standard machine. Two things stay read, not decided: the Lean versions differ between the steps (4.33.1, 4.34.1, 4.36.0-rc2), and a formal ETH being the textbook ETH is a reading of a definition. Siyuan Zhuang's proofs and complexitylib's reach multitape machines natively. As far as I found, this is the first link from a lab's own statement.

It was checked from pinned bytes: Lean's kernel, nanoda (23,430 declarations), leanchecker --fresh, and three planted wrong variants refused. Separately, ¬ETH on the word RAM at logarithmic word size, from complexitylib's proof. Statements by hand, proofs by Claude, checker by the same author: separate roles, not a second party.

Records: https://carlostoledo.co/eth/#standard · source: https://github.com/carlostoledo1891/claimbox/tree/main/lean/eth-bridge
