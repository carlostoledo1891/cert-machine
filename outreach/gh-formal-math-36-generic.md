# Comment on anthropics/formal-math#36 — v2 POSTED 2026-10-29 on the operator's word: https://github.com/anthropics/formal-math/issues/36#issuecomment-6507840689

v1 was approved ('post') but the post was blocked by the session's permission classifier (external system write). v2
adds the version-seam paragraph (certs/eth-seam.json, run 40947568989), which bears on the join this thread is about.
The operator posts v2 themselves, or approves it and allows the `gh issue comment` command.

The operator chose this destination on 10-29: "anthropics/formal-math #36 (Recommended)". It is the thread where TSavo's
join and our earlier reply (issuecomment-6484418376) already are. It is a public technical offer, not a collaboration
proposal.

Send only on the operator's word for this text:
`gh issue comment 36 -R anthropics/formal-math -F <paste block>`. Then record it in SEND-QUEUE, GITHUB-OUTREACH and
corpus/outreach.json.

Do not reply to frintroper's posts in the thread: the account is blocked, and we never engage it.

Checked against certs/eth-bridge.json (run 40947192141):
- 51 theorems, each with kernels lean-build, lean-comparator and nanoda;
- only the three standard axioms;
- the two #ETH theorems are PROVED;
- Anthropic's #ETH is limited to the formulas MainTheorem speaks of (notProved, item 3).

---- PASTE ----
A follow-up for anyone building on this. The model-generic ETH I mentioned now states #ETH as well, and both are proved from each lab's own statement.

`ETHBridge/Generic.lean` takes four parameters: the machine, the k-SAT instances, the input word, and what "halts within t steps with answer b" means. It defines two things once:
- `ETH`: Impagliazzo–Paturi's s_k > 0 for every k ≥ 3, with s_k an infimum over δ.
- `SharpETH`: the same for machines that write the number of satisfying assignments.

Instantiated with each lab's model, it proves:
- OpenAI: `exact_count_and_sat` → ¬ETH and ¬#ETH, for `PrimitiveMachine` on `encodeCNF`.
- Anthropic: `ETHIsFalse` → ¬ETH, for FinTM2 on `encClauses`. Here `s_eq` shows the generic s_k is literally `MainResults.s`.
- Anthropic: `MainTheorem` → ¬#ETH, on the formulas `MainTheorem` speaks of (at least two clauses, at least four variables, every variable occurring).

That is 51 theorems, using only propext, Classical.choice and Quot.sound. Each one is accepted three times: by Lean's kernel at build, by Lean's kernel again inside Comparator on a fresh runner, and by nanoda (https://github.com/carlostoledo1891/cert-machine/actions/runs/40947192141).

Two things stay prose for both labs: the simulation between machine models, and the polynomial-time rewriting of a textbook 3-CNF into each input word.

One finding about the join itself. It reads OpenAI's statement on Anthropic's Lean 4.33.1 and Mathlib 0df444a3, while OpenAI's proof was built on 4.34.1 and d13f23b7. I exported both statements as kernel terms, together with every definition they reach:
- The statement is the same kernel term up to a binder name, and all 74 of OpenAI's own definitions match.
- ℝ's +, ×, ≤, <, 0, 1, inverse and natural power are different terms in the two Mathlibs. This comes mostly from the Monoid hierarchy refactor and from files that moved.
- So no single kernel has yet checked that the two statements are one proposition.

It is almost certainly the same mathematics. A join built on a single Mathlib, or OpenAI's proof replayed on 0df444a3, would close the gap. Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-seam.json (run https://github.com/carlostoledo1891/cert-machine/actions/runs/40947568989).

If a fixed target helps the next claim (one ETH that any lab's model instantiates, so nobody arrives with a private one), the file is MIT and yours to lift, and I'm happy to adapt its parameters to your bridge:
https://github.com/carlostoledo1891/cert-machine/blob/main/corpus/eth-refutation/bridge/openai/ETHBridge/Generic.lean

Disclosure: written with Claude (Anthropic). One of the two claims is Anthropic's, and I have no affiliation with either lab.
---- END PASTE ----
