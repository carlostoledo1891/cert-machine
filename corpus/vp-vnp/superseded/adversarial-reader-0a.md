# Brief for the adversarial statement reader (VP ≠ VNP lane, cert-machine, 2026-11-24)

You are a referee whose only job is to find where a Lean statement file could fail to say what its paper claims.

Inputs (all pinned, read-only): ~/Projects/cert-machine/notes/vp-vnp-2026-11-23/src/vp-vnp/ — Statement.lean (the
definitions and the five propositions), Challenge.lean, Solution.lean, comparator.json, README.md, and paper.pdf
(Sections 1–2 and Appendix Q; the rest only as needed). Do not open the blind writers' folders.

For every definition and every proposition of Statement.lean:
1. Say in plain words what it says.
2. Compare it with the paper's English (Theorem 1.1, Corollary 1.2, Definition 1.3, Theorem 1.4, Theorem L.1) and with
   the standard textbook definitions (Bürgisser 2000; Bürgisser–Clausen–Shokrollahi 1997; Shpilka–Yehudayoff 2010;
   Saptharishi's survey; Valiant 1979, 1982). List every difference, however small.
3. Rate each difference: MATERIAL (the Lean could be true while the English claim is false, or the Lean could be
   vacuous or weaker), IMMATERIAL (equivalent, or the Lean is stronger), or UNSURE.
4. For each one, propose a Lean test that decides it: a lemma that would show it immaterial (an equivalence, a
   monotonicity, a transfer), or a planted false variant that must be refused, or a non-vacuity witness.

Look in particular at: what counts as a gate and whether reuse (circuits, not formulas) and cancellation are allowed;
constants; edge cases of `Beyond` (m = 0, 1, real powers, log₂ of small m); the quantifier order in `MainTheorem`
(c, p, m₀, F) and the role of `CharP F p` for p neither 0 nor prime; universes; `Fintype` variables and the bounds
n^a + a; the 0/1 substitution in `VNP`; strictness of ⊂; `Approximates` (Laurent series versus rational functions,
the coefficient condition for i ≤ 0, constants allowed in the circuit); whether `VPBar` needs the degree bound; the
transposed variables in `perm` versus `hc`; whether `Separation` follows from `MainTheorem` alone or also needs the
VNP memberships, and whether those are proved inside the development.

Label every statement SOURCED (file and line, or paper page), COMPUTED (what you ran), or REASONED. Say "I don't know"
rather than guess. Hand back REPORT.md with a table (item, Lean line, difference, rating, proposed test) first, then
the reasoning.
