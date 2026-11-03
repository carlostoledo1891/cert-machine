# Draft — GitHub issue on TSavo/eth-bridge (the operator's word to post; the channel rule: GitHub first)

Title: Independent replay of Bridge.ethIsFalse_of_claim: CERTIFIED by two kernels, with the version seam measured

Hi — I replayed your bridge (34f9ca20) with no code of yours run: both clones at their pins and every byte against sha256 pins taken beforehand; the statement checks (your OpenAIStatement.lean rebuilt byte for byte into OpenAI's pinned challenge, Anthropic's MainResults.lean at its pin, BridgeChallenge.lean exactly Claim → ETHIsFalse); then Comparator on your own comparator_bridge.json with Lean's kernel and nanoda, `lake build Bridge`, and `#print axioms` from my own file, on a GitHub-hosted runner.

Result: CERTIFIED — Comparator "Your solution is okay!", Lean's kernel and nanoda both accept, only propext, Classical.choice and Quot.sound. Record: https://github.com/carlostoledo1891/cert-machine/blob/main/certs/eth-tsavo-bridge.json; the page: https://carlostoledo.co/eth/ (your row is there with the gaps).

Two things worth your attention, stated as gaps first in the record:

1. Your README's lakefile does not let Comparator resolve the challenge module `BridgeChallenge` (the `[[lean_lib]] Bridge` block with globs `Bridge.+` names Bridge and its submodules, not BridgeChallenge), so Comparator stops at "Building BridgeChallenge". The run that certified the bridge declares ONE amendment — a `[[lean_lib]] BridgeChallenge` with srcDir "bridge" appended to the lakefile, no Lean byte changed — and is recorded as such. If your CI run of 27 October resolved it another way, the README could show how.

2. The version seam: your Claim is OpenAI's challenge text re-elaborated on Lean v4.33.1 with Anthropic's Mathlib 0df444a3, while OpenAI proved exact_count_and_sat on v4.34.1 with Mathlib d13f23b7. I exported both closures as kernel terms and compared them (certs/eth-seam.json): the statement is the same kernel term up to one binder's name and all of OpenAI's own definitions are identical, but of the 2,689 constants reachable from the statement 308 differ between the two Mathlibs (the real numbers' instances: +, ×, ≤, <, 0, 1, inverse, the natural power), so no single kernel has checked that the two statements are one proposition. Almost certainly the same mathematics; recorded as read, not decided.

Daniel Hawkley has since built the bridge the other way round, inside OpenAI's project (thinkthoughts/math, RPI-378.3d); I replayed that one too (certs/eth-hawkley-bridge.json, certs/eth-hawkley-heavy.json). The two joins together are the picture on the page. Thanks for writing yours — it is what made the seam measurable.

— Carlos (independent; tools written with Claude, no affiliation with either lab)
