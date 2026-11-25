# Elaboration repairs of the blind statements (rows F2; bridge author)

Each repair is logged here (file, line, before, after, why) BEFORE the repaired file is used.
A change of a definition's MEANING is not a repair; it is reported as a finding instead.

- 2026-11-25 04:40 — none needed: BlindA.lean (a9535d53…) and BlindB.lean (c8723bbd…), byte copies of the sealed files, elaborated without change (`lake build Bridge.BlindA Bridge.BlindB`, exit 0).

No repair was made to either blind file. What the bridge adds is not a repair and is listed here only so that
nothing is unaccounted for:
- `src/BridgeChallenges/BlindA.lean`, `BlindB.lean`: the sealed file byte for byte, followed by three appended
  theorem stubs (`square_exponent_holds : SquareExponent`, `dual_exponent_holds : DualExponent`,
  `rectangular_exponent_holds : RectangularExponent`, each `by sorry`), because Comparator compares theorems and the
  sealed files state their propositions as `def … : Prop`. `BlindADiv.lean`, `BlindBDiv.lean`: the same with one stub
  `square_exponent_with_division_holds : SquareExponentWithDivision`.
- `src/BridgeChallenges/F3.lean`: the release's `ComparatorChallenges/MatrixExponent.lean` at 92b516ef byte for byte
  (sha256 a56cd226…0534) followed by the nine F3 statements, each `by sorry`.
- `src/Bridge/BlindA.lean`, `BlindB.lean`: byte copies of the sealed files (the definitions the bridge imports).
