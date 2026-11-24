import Statement

/-!
# Remark N.6 of the paper, as Lean statements (cert-machine, phase 3 of the VP ≠ VNP audit)

The paper's Remark N.6 is the one numbered statement of the release with no Lean theorem:

  "Since the determinant has circuits of polynomial size [Ber84], Theorem N.5 has the following consequence. Over
   fields of characteristic different from two there is c > 0 such that, for all large m, the polynomial PERM_m is
   not approximated, in the sense of Definition N.1, by determinants of affine matrices of size m^(c (log m)^(1/3))."

This file states it, using Mathlib and the release's `Statement.lean` only. It holds definitions and three
propositions, no proofs. It was written by the control room (a Claude model) with the release's statement file open,
and sealed before any proof of it was attempted.

* `DetHasSmallCircuits`  the premise the remark cites: the determinant has division-free circuits of polynomial size,
                         in the release's own circuit model, over every commutative ring.
* `RemarkN6`             the remark, with the constants in the order of the release's `MainTheoremApprox`: one
                         absolute `c`, and an `m₀` for each characteristic.
* `PermCharTwo`          the control: over a field of characteristic 2 the main bound for the permanent is false
                         (there the permanent is the determinant), so the hypothesis `p ≠ 2` cannot be dropped.
-/

open MvPolynomial

universe u

namespace CertMachine.N6

/-- The determinant of the generic `n × n` matrix, whose entry `(i, j)` is the variable `X (i, j)`. -/
noncomputable def det (R : Type u) [CommRing R] (n : ℕ) : MvPolynomial (Fin n × Fin n) R :=
  Matrix.det (Matrix.of fun i j : Fin n => (X (i, j) : MvPolynomial (Fin n × Fin n) R))

/-- **The determinant has circuits of polynomial size**: one exponent `a` serves every commutative ring and every
`n`. The circuits are the release's (`Statement.Computes`): variables, constants, sums and products of two earlier
gates, every gate counted; there is no division gate. -/
def DetHasSmallCircuits : Prop :=
  ∃ a : ℕ, ∀ (R : Type u) [CommRing R] (n : ℕ), Statement.Computes (det R n) (n ^ a + a)

/-- `f` is approximated by the determinant of an affine matrix of size `n`: some `n × n` matrix over the Laurent
series in `ε`, each entry a polynomial of total degree at most 1 in the variables of `f`, has a determinant of the
form `f + ε * g`, where the coefficients of `g` are power series in `ε`. The last condition is the one of
`Statement.Approximates`, word for word, with the determinant in the place of the circuit's output. -/
def ApproxByDet {F : Type u} {V : Type} [Field F] (f : MvPolynomial V F) (n : ℕ) : Prop :=
  ∃ M : Matrix (Fin n) (Fin n) (MvPolynomial V (LaurentSeries F)),
    (∀ i j, (M i j).totalDegree ≤ 1) ∧
    ∀ (d : V →₀ ℕ) (i : ℤ), i ≤ 0 →
      (MvPolynomial.coeff d M.det).coeff i = if i = 0 then MvPolynomial.coeff d f else 0

/-- **Remark N.6.** There is an absolute constant `c > 0`, and for each characteristic `p ≠ 2` an `m₀`, such that
over every field of characteristic `p` and for every `m ≥ m₀`, an affine matrix whose determinant approximates
`perm m` has size more than `m ^ (c * (log₂ m) ^ (1/3))`. -/
def RemarkN6 : Prop :=
  ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, p ≠ 2 → ∃ m₀ : ℕ, ∀ (F : Type u) [Field F] [CharP F p], ∀ m ≥ m₀, ∀ n : ℕ,
    ApproxByDet (Statement.perm F m) n → Statement.Beyond c m n

/-- **The control.** Over every field of characteristic 2, no constant `c > 0` and no `m₀` make the main bound
true for the permanent. -/
def PermCharTwo : Prop :=
  ∀ (F : Type u) [Field F] [CharP F 2], ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ,
    Statement.Computes (Statement.perm F m) s → Statement.Beyond c m s

end CertMachine.N6
