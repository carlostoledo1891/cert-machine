# P4 — the seam, first layer (2026-11-12, the Mac)

`Seam.lean` prints, at Mathlib 81a5d257 (v4.32.0) and d13f23b7 (v4.34.1), the definitions our Textbook.lean names
directly: `Measure.infinitePi` (and `infinitePiNat`), `bernoulliMeasure`, `unitInterval`, `Set.Infinite`, `Set.Finite`,
`Sym2`, `Sym2.Rel`, `Sym2.lift`, `Relation.ReflTransGen`, `Real.instSupSet` / `Real.sSup_def`, `ENNReal.toReal`,
`MeasurableSpace.pi`, `Bool.instMeasurableSpace`, `Finset.sum`.

RESULT: the printed definitions are IDENTICAL except one attribute name on three instances — `@[implicit_reducible]` at
v4.32.0, `@[instance_reducible]` at v4.34.1 (`Real.instSupSet`, `MeasurableSpace.pi`, `Bool.instMeasurableSpace`): a
renamed reducibility attribute, not a change of value (diff.txt). One line of the script asked for a constant that does not
exist (`MeasureTheory.Measure.toReal`; our θ uses `ENNReal.toReal`, printed). Not compared: the constants below the first
layer (`piContent`, `AddContent.measure`, `Kernel.traj`, `Quot.lift`'s proofs …) — a deeper, transitive comparison is the
open part of P4, and this is a reading of printed text, not a kernel check.

## The transitive layer (Deep.lean, same day)

Every constant reachable from `TextbookPercolation.Statement` through types and definition values (proofs not followed),
hashed (type; value for definitions) at both pins: 2,563 constants at v4.32.0, 2,550 at v4.34.1; 2,488 in common, of
which **2,032 identical**; 372 with a different type hash and 199 definitions with a different value hash; 75 only at
v4.32.0 and 62 only at v4.34.1. The differences are Mathlib's own refactors between the two releases: the algebraic class
hierarchy (`AddMonoid`, `AddCommGroup`, … fields reorganised), the construction of ℝ (its auxiliary definitions moved from
`Mathlib.Data.Real.Basic` to `Mathlib.Basic.Real.Basic`, Cauchy sequences), the `Measure` scalar-action instances renamed.
So "the same bytes elaborate in both" does NOT mean "the same constants": the two bridges prove statements that are
equal as text and as surface definitions, and are carried by different underlying constants. That one statement means the
same thing in both Leans is a READING, as for ETH's version seam — measured here, never claimed as decided.
