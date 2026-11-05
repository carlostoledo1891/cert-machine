# The two complexitylib PR branches, re-checked before sending (2026-11-05, the operator's word)

Local run on the operator's Mac (tools: Lean v4.36.0-rc2's bundled leanexport and nanoda_bin, leanchecker --fresh),
script scratchpad complexitylib-pr/recheck.sh, on cslib-community/complexitylib main b28df563 plus:

- wordram-space-bounded-sim @ f2f244cb (C1, renamed and generalized to k-SAT; Authors: Samuel Schlesinger, Carlos Toledo)
- tm2-degree-uniform @ fd0985df (the uniform one-step TM2 certificate, in the plain ComputableInDegree calculus)

Every step exited 0: build; #print axioms (propext, Classical.choice, Quot.sound only) for the seven headline theorems;
nanoda accepting each export (7,696 / 8,221 / 48,959 / 49,716 declarations on the first branch; 9,974 / 12,149 / 2,141
on the second); leanchecker --fresh on each new module. The branches are local; nothing is pushed until the PRs open.
