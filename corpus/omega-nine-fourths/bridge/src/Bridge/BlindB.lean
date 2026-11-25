import Mathlib

/-! # Matrix multiplication by arithmetic circuits over a field -/

namespace BlindB

noncomputable section

open scoped BigOperators

/-- The entries of an `m × k` left matrix and a `k × p` right matrix, tagged by operand. -/
abbrev Input (m k p : ℕ) := (Fin m × Fin k) ⊕ (Fin k × Fin p)

/-- The polynomial ring over `F` in independent indeterminates for all the input entries. -/
abbrev EntryPoly (F : Type) [Field F] (m k p : ℕ) := MvPolynomial (Input m k p) F

/-- The dot product giving entry `(i,j)` of the product of the two indeterminate matrices. -/
def productEntry (F : Type) [Field F] {m k p : ℕ} (i : Fin m) (j : Fin p) :
    EntryPoly F m k p :=
  ∑ h : Fin k,
    (MvPolynomial.X (Sum.inl (i, h)) : EntryPoly F m k p) *
      (MvPolynomial.X (Sum.inr (h, j)) : EntryPoly F m k p)

/-- The four binary scalar operations available when division is allowed. -/
inductive Op where
  /-- Add the operands. -/
  | add
  /-- Subtract the second operand from the first. -/
  | sub
  /-- Multiply the operands. -/
  | mul
  /-- Divide the first operand by the second. -/
  | div

/-- The equation relating a gate's operands and result. For division in a field,
the denominator must be nonzero and its product with the result must equal the numerator. -/
def Op.Holds {R : Type} [CommRing R] (op : Op) (x y result : R) : Prop :=
  match op with
  | .add => result = x + y
  | .sub => result = x - y
  | .mul => result = x * y
  | .div => y ≠ 0 ∧ result * y = x

/-- A wire can read a field constant, an input variable, or a gate with index below `bound`. -/
inductive Wire (F V : Type) (bound : ℕ) where
  /-- A constant from the ground field. -/
  | scalar (a : F)
  /-- A variable indexed by an input label. -/
  | input (v : V)
  /-- The value of an earlier gate, reusable on any number of wires. -/
  | gate (i : Fin bound)

/-- A finite arithmetic DAG in topological order, with one output wire per product entry. -/
structure Circuit (F : Type) (m k p : ℕ) where
  /-- The number of arithmetic gates, also the total scalar operation cost. -/
  cost : ℕ
  /-- The operation at each gate. -/
  op : Fin cost → Op
  /-- The first operand of each gate, with gate references restricted to its predecessors. -/
  left : (i : Fin cost) → Wire F (Input m k p) i.val
  /-- The second operand of each gate, with the same restriction on gate references. -/
  right : (i : Fin cost) → Wire F (Input m k p) i.val
  /-- The designated source for each output entry, with access to every gate. -/
  output : Fin m → Fin p → Wire F (Input m k p) cost

/-- Read a wire using the indicated interpretation of input polynomials and table of gate values. -/
def Wire.value {F V : Type} [Field F] {bound : ℕ} {R : Type} [CommRing R]
    (w : Wire F V bound) (ι : MvPolynomial V F →+* R) (g : ℕ → R) : R :=
  match w with
  | .scalar a => ι (MvPolynomial.C a)
  | .input v => ι (MvPolynomial.X v)
  | .gate i => g i.val

/-- All gate equations hold simultaneously and every output equals its product entry in `R`,
with coefficients, indeterminates and target entries all interpreted by the same ring map. -/
def Circuit.ComputesOver {F : Type} [Field F] {m k p : ℕ} (D : Circuit F m k p)
    {R : Type} [CommRing R] (ι : EntryPoly F m k p →+* R) : Prop :=
  ∃ g : ℕ → R,
    (∀ i : Fin D.cost,
      (D.op i).Holds ((D.left i).value ι g) ((D.right i).value ι g) (g i.val)) ∧
    ∀ (i : Fin m) (j : Fin p),
      (D.output i j).value ι g = ι (productEntry F (k := k) i j)

/-- The choice of permitted scalar operations and corresponding formal identity test. -/
inductive Model where
  /-- Addition, subtraction and multiplication, interpreted in the polynomial ring. -/
  | divisionFree
  /-- Addition, subtraction, multiplication and division, interpreted in the fraction field. -/
  | withDivision

/-- A correct circuit uses the permitted gates and computes the formal matrix product in
the polynomial ring (division-free) or its field of rational functions (with division). -/
def Circuit.Correct {F : Type} [Field F] {m k p : ℕ} (D : Circuit F m k p)
    (model : Model) : Prop :=
  match model with
  | .divisionFree =>
      (∀ i : Fin D.cost, D.op i ≠ Op.div) ∧
        D.ComputesOver (RingHom.id (EntryPoly F m k p))
  | .withDivision =>
      D.ComputesOver (algebraMap (EntryPoly F m k p) (FractionRing (EntryPoly F m k p)))

/-- The integer side length for weight `w` and size parameter `n`, obtained by rounding down. -/
def side (n : ℕ) (w : ℝ) : ℕ := Nat.floor ((n : ℝ) ^ w)

/-- For every sufficiently large size there is a correct circuit with at most `K * n^s`
gates for one fixed positive `K`. The weights govern rows, shared dimension and columns. -/
def AdmitsExponent (F : Type) [Field F] (model : Model) (a b c s : ℝ) : Prop :=
  ∃ K : ℝ, 0 < K ∧ ∃ N : ℕ, 1 ≤ N ∧ ∀ n : ℕ, N ≤ n →
    ∃ D : Circuit F (side n a) (side n b) (side n c),
      D.Correct model ∧ (D.cost : ℝ) ≤ K * (n : ℝ) ^ s

/-- The infimum of achievable real cost exponents for the indicated weights and gate model.
The default is division-free. -/
def omega (F : Type) [Field F] (a b c : ℝ) (model : Model := .divisionFree) : ℝ :=
  sInf {s : ℝ | AdmitsExponent F model a b c s}

/-- The supremum of weights in the closed unit interval giving exponent two when the shared
dimension has that weight and both outside dimensions have weight one. -/
def alpha (F : Type) [Field F] : ℝ :=
  sSup {t : ℝ | t ∈ Set.Icc (0 : ℝ) 1 ∧ omega F 1 t 1 = 2}

/-- Over every field the division-free exponent of square matrix multiplication is nine fourths. -/
def SquareExponent : Prop :=
  ∀ (F : Type) [Field F], omega F 1 1 1 = (9 / 4 : ℝ)

/-- Over every field the division-free dual exponent of matrix multiplication is one half. -/
def DualExponent : Prop :=
  ∀ (F : Type) [Field F], alpha F = (1 / 2 : ℝ)

/-- Over every field the division-free rectangular exponent obeys the stated formula in the
largest, middle and smallest of the three positive weights. -/
def RectangularExponent : Prop :=
  ∀ (F : Type) [Field F] (a b c : ℝ), 0 < a → 0 < b → 0 < c →
    let x := max a (max b c)
    let z := min a (min b c)
    let y := a + b + c - x - z
    omega F a b c = x + y + (max 0 ((x + y) * z - x * y)) ^ (2 : ℕ) / (4 * x * y * z)

/-- Over every field the square exponent with division and rational-function identities is
nine fourths. -/
def SquareExponentWithDivision : Prop :=
  ∀ (F : Type) [Field F], omega F 1 1 1 .withDivision = (9 / 4 : ℝ)

end

end BlindB
