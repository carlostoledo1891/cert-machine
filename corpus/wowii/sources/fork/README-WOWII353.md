# Complete Lean disproof of WOWII 353

Mathematical manuscript: Jonas J. Gebendorfer, *An infinite family of counterexamples to Written on the Wall II Conjecture 353*, 13 October 2026.
OpenAI Codex assisted with formalization and verification under the author's direction, 14 October 2026.

[Intake #7304](https://github.com/google-deepmind/formal-conjectures/issues/7304) contains the complete written manuscript and the public reproducibility archive.

## Exact scope

The certificate disproves the full proposed lower bound for finite simple trees of order greater than two:

gamma_t(T) >= c(T[D2]) + k_M/2,

where D2 is the degree-two vertex set, M is the maximum-degree set, c counts connected components, and k_M is the largest component's vertex order. Arithmetic is over the rationals; this is equivalent to the printed real-valued comparison because all invariants are integers.

The Lean proof uses the manuscript's explicitly labeled 25-vertex tree. It proves:
- the graph is a tree, using actual root reachability and its 24-edge count;
- the displayed ten-element set totally dominates every vertex, including selected ones;
- the degree-two induced graph is edgeless and has exactly nine connected components;
- one component of the induced maximum-degree graph contains three distinct vertices, so its largest component has order at least three;
- consequently gamma_t <= 10 < 9 + k_M/2, refuting the universal assertion.

Only these inequalities are needed for the disproof. The Lean certificate does not assert exact optimality ten, exact largest-component order three, uniqueness or the infinite-family formulas; those are separate written results and independently checked finite facts in the intake. No minimum-order counterexample claim is made.

The parent-vector edge representation was separately compared against the manuscript's base edges and limb construction. They define exactly the same 24 edges.

## Kernel and statement audit

The complete proof and the separate audit both compiled successfully without warnings. All eight audited declarations use only:

```
[propext, Classical.choice, Quot.sound]
```

There is no sorryAx, custom axiom or native-evaluation dependency. Finite checks use ordinary Lean decide, checked by the kernel. Connectivity, the quotient-component cardinality bridge, the three-vertex component injection and the universal negation are proved explicitly.

The audit independently defines largestComponentOrder and writes the exact proposed repository statement, with False on the answer side. It imports the external proof, not any upstream placeholder statement.

## Reproduction

Inherited pins: Lean 4.33.1 and Mathlib 0df444a360eaa60ab8c11dca51a86af692955474.

```sh
lake exe cache get
lake build FormalConjecturesForMathlib.Combinatorics.SimpleGraph.Domination
mkdir -p .lake/build/lib/lean/Proofs
lake env lean -o .lake/build/lib/lean/Proofs/WOWII353Proof.olean Proofs/WOWII353Proof.lean
lake env lean Proofs/WOWII353Audit.lean
```

In this execution environment, the previously disclosed narrow readlink adapter substitutes /proc/self/exe only when reading /proc/<own-pid>/exe fails. Lean's official executable, sources, elaborator and kernel are unchanged. The official Lean Linux archive SHA256 was verified as 890afd185370f85666025b883914ab4f4b339136f8c96167b69cfb62aecaf235. Supported normal installations do not need this adapter.

## File integrity and status

- WOWII353Proof.lean SHA256: 1bf3c64570e23ea1c7aa6d47b98f37a874af195ba10703e5f15b8e30a1a65029
- WOWII353Audit.lean SHA256: b372b6910f7f7151d302edd7f34cf29121f025bbb7759b65e6b85bbd6b92fff8

This is an author-workflow kernel certificate. It does not constitute independent peer review, maintainer acceptance or evidence of worldwide priority. It upgrades evidence for the same mathematical target and does not add another solved conjecture to the count.

