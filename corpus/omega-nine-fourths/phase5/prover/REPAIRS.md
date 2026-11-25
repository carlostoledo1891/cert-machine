# Elaboration repairs of the sealed Rect.lean (rows G3e, G3f, G2a, G2b; Phase 5 prover)

Each repair is logged here (file, line, before, after, why) BEFORE the repaired file is used.
A change of a definition's MEANING is not a repair; it is reported as a finding instead.

- 2026-11-25 14:07 — none needed: the sealed file (byte copy src/RectProof/Rect.lean, sha256 95340267…, equal to A16)
  elaborated unchanged at Lean v4.34.1 / Mathlib d13f23b7 in the prover's own build of the release on pod yyfaihduhd3ixs
  (`lake env lean`, no error, no warning; the only output is lake's notes on the patched packages outside the closure).

No repair was made to the sealed file. What the prover adds is not a repair and is listed here only so that nothing is
unaccounted for:
- `src/RectChallenges/Rect.lean`: the sealed file byte for byte (its first 17,068 bytes hash to 95340267…), followed by
  four theorem stubs in namespace Rect (`borderRankRect_holds : BorderRankRect`, `asymptoticRankRect_holds :
  AsymptoticRankRect`, `alphaBounds_holds : AlphaBounds`, `dualExponentDiv_holds : DualExponentDiv`), each `by sorry`,
  because Comparator compares theorems and the sealed file states its propositions as `def … : Prop`.
- `src/RectChallenges/RectPlanted.lean`: the same with ONE constant changed, line 109, in the body of `rectBound`:
  `((3 : ℝ) / 4)` → `((4 : ℝ) / 5)`. This makes `AsymptoticRankRect` (and `BorderRankRect`) false: at a = b = c = 2 the
  planted bound is 8^(4/5) ≈ 5.28, above the asymptotic rank 2^(9/4) ≈ 4.76 of T_2 (Phase 4, G3c).
- `src/RectProof/Rect.lean`: a byte copy of the sealed file (the definitions the proofs import).
