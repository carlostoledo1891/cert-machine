[BlindB.lean](/Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths/blind/B/work/BlindB.lean) contains four propositions in namespace `BlindB`. The weights are ordered as rows, shared dimension, and columns, so `alpha F` uses `omega F 1 t 1`. The default model is division-free. Lean was not run, as requested.

```lean
def SquareExponent : Prop :=
  ∀ (F : Type) [Field F], omega F 1 1 1 = (9 / 4 : ℝ)

def DualExponent : Prop :=
  ∀ (F : Type) [Field F], alpha F = (1 / 2 : ℝ)

def RectangularExponent : Prop :=
  ∀ (F : Type) [Field F] (a b c : ℝ), 0 < a → 0 < b → 0 < c →
    let x := max a (max b c)
    let z := min a (min b c)
    let y := a + b + c - x - z
    omega F a b c = x + y + (max 0 ((x + y) * z - x * y)) ^ (2 : ℕ) / (4 * x * y * z)

def SquareExponentWithDivision : Prop :=
  ∀ (F : Type) [Field F], omega F 1 1 1 .withDivision = (9 / 4 : ℝ)
```

I did not see the claimant's Lean statement