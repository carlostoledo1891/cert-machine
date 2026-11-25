# Elaboration repairs of the sealed PerN.lean (rows G3a–G3d; Phase 4 prover)

Each repair is logged here (file, line, before, after, why) BEFORE the repaired file is used.
A change of a definition's MEANING is not a repair; it is reported as a finding instead.

- 2026-11-25 09:54 — none needed: PerNProof/PerN.lean (71a4378d…, a byte copy of the sealed file) elaborated unchanged
  at Lean v4.34.1 / Mathlib d13f23b7 in the prover's own build of the release (`lake build PerNProof.PerN`, exit 0, no
  warning); the challenge copy PerNChallenges/PerN.lean (sealed file byte for byte + four appended theorem stubs, each
  `by sorry`) and its planted twin built too (exit 0; the only warnings are the four stubs' `sorry`).

No repair was made to the sealed file. What the prover adds is not a repair and is listed here only so that nothing is
unaccounted for:
- `src/PerNChallenges/PerN.lean`: the sealed file byte for byte (its first 13,624 bytes hash to 71a4378d…), followed by
  four theorem stubs in namespace PerN (`gatesPerNAll_holds : GatesPerNAll`, `gatesPerN_holds : GatesPerN`,
  `asymptoticRank_holds : AsymptoticRank`, `borderRankLower_holds : BorderRankLower`), because Comparator compares
  theorems and the sealed file states its propositions as `def … : Prop`.
- `src/PerNChallenges/PerNPlanted.lean`: the same with ONE constant changed, line 238, in AsymptoticRank's infimum
  clause `(9 : ℝ) / 4` → `(10 : ℝ) / 4` (a false statement: it would say the asymptotic rank is n^(5/2)).
- `src/PerNProof/PerN.lean`: a byte copy of the sealed file (the definitions the proofs import).
