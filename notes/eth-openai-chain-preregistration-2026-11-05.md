# ETH: the OpenAI chain in one environment — pre-registration, 2026-11-05

Written before any build, after the scout below. The operator's word (2026-11-05): start now; a soft cap of US$25 in
rented compute; one report page for both chains; route B parked; Hawkley told after, with the record. Roles as in
notes/eth-model-gap-preregistration-2026-11-04.md: claimbox and its AI agents author the port and the corollary (the
claimant); cert-machine decides from pinned bytes. The same operator owns both, so the decision separates roles; it is
not a second party.

## Where the gap stands (2026-11-05)
- Anthropic's side is closed in one Lean (certs/eth-chain.json): its eth/ proof ported to complexitylib's Lean
  v4.36.0-rc2 proves MainResults.ethIsFalse against the vendored MainResults.lean, and C2 gives cslib's ¬ETH.
- OpenAI's side still crosses one version seam. OpenAI's exact_count_and_sat (openai/math 7ef5c0cc, Lean v4.34.1,
  Mathlib d13f23b7) ⇒ Hawkley's ¬PositiveRateETH ⇒ MainResults.ETHIsFalse is decided inside OpenAI's Lean
  (certs/eth-hawkley-heavy.json, certs/eth-hawkley-bridge.json); that copy of ETHIsFalse is only READ as the one C2
  starts from, across v4.34.1 → v4.36.0-rc2.

## The scout (measured today, from a sparse clone of thinkthoughts/math at d6b79b7d)
- The chain closure (OAI.Bridges.ETH.FinalImplication + OAI.Bridges.AnthropicETH.Main, which import OpenAI's
  SqrtLogSpace.Final and the ParityLifts) is 3,210 files, 569,603 lines: 3,091 under OAI.Algorithms.SubexponentialSAT
  (the whole closure of OpenAI's family-378 solution Main), 92 under OAI.Combinatorics.ParityLifts, 27 of Hawkley's own
  under OAI.Bridges. External imports: 50 Mathlib modules and Lean core; MainResults (Hawkley's vendored copy).
  corpus/eth-refutation/openai-chain/scout-closure.txt lists the modules; scout-pins.json their sha256 at d6b79b7d.
- Pin check: all 3,183 OpenAI files in the closure are byte-equal (same git blob) to openai/math at 7ef5c0cc, the
  commit cert-machine certified on 10-28 (scout-blobcheck.json; the ParityLifts checked through the contents API, the
  rest through the recursive tree). The 27 Bridges files are Hawkley's, Apache-2.0 (the fork's LICENSE), pinned in
  corpus/eth-refutation/hawkley/pins.json.
- Census of the closure: no `native_decide`, no `sorry`, no `axiom` declaration, no `unsafe`/`implemented_by`/
  `@[extern]` (the two "axiom" and the "extern" hits are words in docstrings and identifiers); `set_option quotPrecheck
  false` in two files; `decide` 23,889 occurrences in 1,721 files — kernel-reduction proofs are the port's main risk on
  a newer Lean. OpenAI's challenge file lean/ComparatorChallenges/SubexponentialSAT.lean: sha256 4183b2057cff350d66848215ff7167196dfc20e1891b598fdddea59077a76685.
- The jump: Lean v4.34.1 → v4.36.0-rc2; Mathlib d13f23b7 → 69552756 is 1,019 upstream commits. Anthropic's port, for
  scale: 809 files, 47 repaired (6 %), 4.33.1 → 4.36.0-rc2, about 3.5 h of one agent. Expected here: 100–250 files
  repaired, one to two agent sessions.
- Compute precedent: OpenAI's closure built in 39 min on 16 vCPU (11,600 jobs); leanchecker --fresh took 44 min at
  99 GB peak RAM; nanoda 6 min on a 2.4 GB export. So the decision pod needs ≥128 GB (cpu3m 16 vCPU, US$0.88/h).

## What is attempted — route A, the port
Carry the chain closure into claimbox lean/eth-bridge on complexitylib 7c66eb71 (Lean v4.36.0-rc2), as AnthropicEth was:
- `OpenAIEth/` at the upstream paths, one lean_lib per upstream library (OAI.Algorithms.SubexponentialSAT,
  OAI.Combinatorics.ParityLifts, OAI.Bridges.ETH, OAI.Bridges.AnthropicETH), with upstream's leanOptions, globs
  restricted to the copied modules; every file keeps its copyright header; OpenAI's LICENSE and Hawkley's beside them.
- `OpenAIEth/PORT.md`: every modified file with both sha256s and every changed line; the kinds of change named; the
  statements and definitions whose text changed, each by a forced Mathlib rename and nothing else, checked
  mechanically; no `sorry`, no new `axiom`, no `native_decide`, no `implemented_by`/`extern`/`unsafe`.
- Untouched: OpenAI's challenge file (byte-equal to the pin above), Hawkley's two theorem statements (byte-pinned in
  certs/eth-hawkley-bridge.json and eth-hawkley-heavy.json), and the vendored EthBridge/Anthropic/MainResults.lean.
  Hawkley's `import MainResults` becomes `import EthBridge.Anthropic.MainResults` (R0), so his bridge proves the
  SAME MainResults.ETHIsFalse that C2 consumes; his second copy under Vendor/ is not copied.
- `EthBridge/OpenAIChain.lean`, trusted block byte-equal to corpus/eth-refutation/openai-chain/statement.lean:
  `theorem not_eth : ¬ ComplexityAbstracts.SubexponentialSATAbstract.ETH :=
    EthBridge.Anthropic.not_eth_of_ethIsFalse
      (OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse OAI.Bridges.ETH.not_positiveRateETH)`
- Three planted variants in Planted/ (claimbox commitment 7): the statement closed by `sorry`; the same through a new
  axiom; the trusted statement with its negation dropped, closed by `sorry`. cert-machine must refuse each.
- Route B (a direct bridge from OpenAI's statement to cslib's ¬ETH, without Hawkley's links) is PARKED (the operator,
  2026-11-05): A closes the seam; Hawkley's links are already certified.

## The decision (cert-machine, on a pod, tools/runpod-eth-openai-chain.sh from runpod-eth-chain.sh)
1. Statement: the trusted block of EthBridge/OpenAIChain.lean byte-equal to the pin; EthBridge/Anthropic/MainResults.lean
   sha256 47f78a95…24944 (Anthropic's); OpenAI's challenge file sha256 as above; every unmodified ported file byte-equal
   to scout-pins.json and every modified one listed in PORT.md with both sha256s (a file in neither state refuses).
2. Axioms from OUR file: not_eth, OAI.Bridges.ETH.not_positiveRateETH, OAI.Bridges.AnthropicETH.not_positiveRateETH_
   implies_ethIsFalse, OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat and original_sat_main,
   EthBridge.Anthropic.not_eth_of_ethIsFalse: exactly propext, Classical.choice, Quot.sound, or the finding is printed.
3. nanoda on a lean4export of not_eth; the sorry and axiom planted variants as negative controls that must fail.
4. leanchecker --fresh on EthBridge.OpenAIChain.
5. lake comparator --paranoid (six checkers): Challenge.OpenAIChain (written from the pin) vs EthBridge.OpenAIChain
   accepted; vs Planted.OpenAIChainStatement rejected. Attempted in addition: OpenAI's own challenge
   ComparatorChallenges/SubexponentialSAT vs the ported solution in the new Lean; if its challenge metadata needs an
   edit to run there, the edit is declared in the record and the step is reported as it ran.
6. The planted statement variant refused on the statement check before any kernel runs.
Expected: CERTIFIED with a reading (the proof that checks is a modified copy of OpenAI's and Hawkley's, every change
listed; the textbook reading of ETH stays a reading; same operator on both sides; the judge without its sandbox on
RunPod, said in the record).

## What cannot be closed, said in advance
That complexitylib's ETH is the textbook ETH stays a reading of a definition. The result closes the version seam on
OpenAI's side the way Anthropic's was closed: by rebuilding the proof in the statement's Lean, not by comparing kernels.

## Stop rules and budget
- A statement or definition that cannot be kept except by a change beyond a forced rename stops the port; the file and
  the change are reported, and the result is REFUSED with that file named, not a port with a changed statement.
- A proof the agent cannot repair is reported as the exact declarations left (a partial port is a REFUSED record with
  the list), never closed by `sorry`, an axiom or a weakened statement.
- No result is re-run to change it; a platform failure is re-run and recorded as such.
- Budget: the port builds locally on the operator's Mac (no cost); the decision runs on CPU pods, reported as they
  bill; a soft cap of US$25 before asking (the operator, 2026-11-05). Pods are deleted the same session, 404 confirmed.
- Nothing is posted without the operator's word. The outcome goes to /eth/ §5b, the census, one report page for both
  chains (/reports/eth-chain.html, a 301 from eth-anthropic-chain.html) and the note v0.2; Hawkley is told on
  rpi-index #1 after the record, with the PORT ledger linked.
