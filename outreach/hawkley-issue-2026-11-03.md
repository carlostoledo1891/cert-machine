# Draft — GitHub issue on thinkthoughts/rpi-index (his registry; issues enabled; thinkthoughts/math has issues OFF).
# The operator's word to post. A public flag in case the e-mail of 11-03 (to danhawkley@gmail.com) did not arrive;
# his GitHub profile lists a second address, consensusmechanics@gmail.com.

Title: Independent replay of RPI-ETH-010 and RPI-ETH-008: both CERTIFIED by two kernels — records to attach

Hi Dan — your README separates what third parties report from what the project reproduced, so here is a third party's report, in case my e-mail reply of 3 November did not reach you.

I replayed both edges with no code of yours run; both come out CERTIFIED.

- RPI-ETH-010, `OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse` at thinkthoughts/math d6b79b7d1, on a GitHub runner inside OpenAI's lean/ project at 7ef5c0cc: your 40-file delta pinned and checked blob by blob against GitHub's compare; your MainResults.lean against the hash pinned for Anthropic's eth/MainResults.lean (47f78a95…); your ParityLifts.lean against the three slices of OpenAI's files; `lake update` with every dependency at the pinned manifest; then Comparator on your config with one change (enable_nanoda: true): "Your solution is okay!", Lean's kernel and nanoda both accept, `lake build` exit 0, `#print axioms` (my file) propext, Classical.choice, Quot.sound. Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-hawkley-bridge.json
- RPI-ETH-008, `OAI.Bridges.ETH.not_positiveRateETH` from `original_sat_main`, on a 16-vCPU / 128 GB machine: `lake build OAI.Bridges.ETH.FinalImplication` exit 0 (11,600 jobs, 39 min), both theorems' axioms the three standard ones, a standalone lean4export of the theorem's closure (2.4 GB) accepted by nanoda in 348 s with the negative control (Classical.choice removed) rejected, and `leanchecker --fresh` over the whole module, OpenAI's proof included, exit 0 in 44 min at a 99 GB peak. Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-hawkley-heavy.json

The page, with your row beside TSavo's and the gaps stated first: https://carlostoledo.co/eth/

On the question in your note — the machine-model gap in this direction: with both edges checked, the chain from OpenAI's accepted theorem to Anthropic's ETHIsFalse is kernel-checked end to end inside OpenAI's Lean v4.34.1 and Mathlib d13f23b7. Across the version seam to Anthropic's own environment (v4.33.1, Mathlib 0df444a3) it is read, not decided: for TSavo's direction I exported both closures and compared them term by term (the statement the same kernel term up to a binder name; 308 of 2,689 reachable constants differ, the real numbers' instances), and the same measurement is owed for yours — I can run it and will pre-register it first if you want it. Smaller facts, not holes: nanoda is off in your shipped config (on here, with a 1 GiB stack); your Audit.lean was not built here, independence checked at import level.

If a gap is worded wrongly, say which and I will quote you on the page.

— Carlos Toledo (independent; tools written with Claude; no affiliation with either lab)
