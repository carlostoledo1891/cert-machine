import Mathlib

/-!
# Blind statement A: the exponent of matrix multiplication

Blind writer A (a Claude agent), written from Bürgisser–Clausen–Shokrollahi,
*Algebraic Complexity Theory* (1997), Chapter 4 (straight-line programs) and Chapter 15
(the exponent of matrix multiplication), from memory, without running Lean and without
seeing the claimant's Lean statement.

Model. A straight-line program over a field `F` with inputs indexed by `σ` is a list of
instructions. Instruction number `t` may read only the results of instructions `0, …, t-1`.
The instructions are: read an input variable (free), load a constant of `F`, multiply an
earlier result by a constant of `F`, and `+`, `-`, `*`, `/` of two earlier results; every
instruction other than an input read costs 1 (BCS's total cost).

Correctness is a formal identity: the program is run on the indeterminates, in the
polynomial ring `MvPolynomial σ F` (division-free programs), or in the field of rational
functions `FractionRing (MvPolynomial σ F)` (programs with division, where every divisor
must be a nonzero rational function), and every entry of the matrix product must occur
among the computed results. Nothing is evaluated at points of `F`, so finite fields need
no special treatment.

The propositions at the end are stated, not proved:
`SquareExponent`, `SquareExponentWithDivision`, `DualExponent`, `RectangularExponent`.
-/

namespace BlindA

noncomputable section

/-- An instruction of a straight-line program over the field `F` whose input variables are
indexed by `σ` (BCS Ch. 4, the operation set `Ω = {λᶜ} ∪ {λ*} ∪ {+, −, *, /}`, with input
reads made explicit). Natural-number arguments are positions of earlier results. -/
inductive Op (F : Type) (σ : Type) : Type where
  /-- Read the input variable `s`. It costs nothing (in BCS the inputs are the free initial
  part of the result sequence). -/
  | input (s : σ)
  /-- Load the constant `c ∈ F` (BCS's `λᶜ`). -/
  | const (c : F)
  /-- Multiply result number `i` by the constant `c ∈ F` (BCS's `λ*`). -/
  | smul (c : F) (i : ℕ)
  /-- The sum of results `i` and `j`. -/
  | add (i j : ℕ)
  /-- The difference of results `i` and `j` (result `i` minus result `j`). -/
  | sub (i j : ℕ)
  /-- The product of results `i` and `j`. -/
  | mul (i j : ℕ)
  /-- The quotient of result `i` by result `j`. -/
  | div (i j : ℕ)

/-- The positions of earlier results that an instruction reads. -/
def Op.args {F σ : Type} : Op F σ → List ℕ
  | .input _ => []
  | .const _ => []
  | .smul _ i => [i]
  | .add i j => [i, j]
  | .sub i j => [i, j]
  | .mul i j => [i, j]
  | .div i j => [i, j]

/-- The cost of one instruction: BCS's total cost, 1 for every operation of `Ω`
(constants, scalar multiplications, `+`, `−`, `*`, `/`); reading an input costs 0. -/
def Op.cost {F σ : Type} : Op F σ → ℕ
  | .input _ => 0
  | _ => 1

/-- The total cost of a program: the sum of the costs of its instructions. -/
def cost {F σ : Type} (prog : List (Op F σ)) : ℕ :=
  (prog.map Op.cost).sum

/-- A program is well formed when instruction number `t` reads only results of instructions
numbered below `t` (BCS: every instruction refers to earlier entries of the result sequence). -/
def WellFormed {F σ : Type} (prog : List (Op F σ)) : Prop :=
  ∀ (t : ℕ) (h : t < prog.length), ∀ i ∈ Op.args (prog[t]'h), i < t

/-- A program is division-free when none of its instructions is a division. -/
def DivisionFree {F σ : Type} (prog : List (Op F σ)) : Prop :=
  ∀ o ∈ prog, ∀ i j : ℕ, o ≠ Op.div i j

/-- The value of one instruction in a commutative ring `R`, given the list `v` of results
computed so far, the values `x` of the input variables, the embedding `cst` of the constants
and a division function `dv` (only used by `Op.div`). -/
def Op.value {F σ R : Type} [CommRing R] (x : σ → R) (cst : F → R) (dv : R → R → R)
    (v : List R) : Op F σ → R
  | .input s => x s
  | .const c => cst c
  | .smul c i => cst c * v.getD i 0
  | .add i j => v.getD i 0 + v.getD j 0
  | .sub i j => v.getD i 0 - v.getD j 0
  | .mul i j => v.getD i 0 * v.getD j 0
  | .div i j => dv (v.getD i 0) (v.getD j 0)

/-- The result sequence of a program: the list of the values of its instructions, in order
(entry `t` is the value of instruction `t`). -/
def runProg {F σ R : Type} [CommRing R] (x : σ → R) (cst : F → R) (dv : R → R → R)
    (prog : List (Op F σ)) : List R :=
  prog.foldl (fun v o => v ++ [Op.value x cst dv v o]) []

/-- The result sequence of a program run on the indeterminates, in the polynomial ring
`F[σ]` (division is never used by a division-free program; it is sent to `0` here). -/
def runPoly (F : Type) [Field F] {σ : Type} (prog : List (Op F σ)) : List (MvPolynomial σ F) :=
  runProg (R := MvPolynomial σ F) (fun s => MvPolynomial.X s) (fun c => MvPolynomial.C c)
    (fun _ _ => 0) prog

/-- The field of rational functions over `F` in the variables `σ`: the fraction field of
the polynomial ring `F[σ]`. -/
abbrev RatFn (F : Type) [Field F] (σ : Type) : Type :=
  FractionRing (MvPolynomial σ F)

/-- The embedding of the polynomial ring `F[σ]` into its field of rational functions. -/
def toRatFn (F : Type) [Field F] (σ : Type) : MvPolynomial σ F →+* RatFn F σ :=
  algebraMap (MvPolynomial σ F) (RatFn F σ)

/-- The result sequence of a program run on the indeterminates, in the field of rational
functions `F(σ)`, with field division. -/
def runRat (F : Type) [Field F] {σ : Type} (prog : List (Op F σ)) : List (RatFn F σ) :=
  runProg (R := RatFn F σ) (fun s => toRatFn F σ (MvPolynomial.X s))
    (fun c => toRatFn F σ (MvPolynomial.C c)) (fun u w => u / w) prog

/-- A program with division is executable on the indeterminates when every divisor it uses
is a nonzero rational function (BCS: every divisor is a unit of the algebra computed in). -/
def Executable (F : Type) [Field F] {σ : Type} (prog : List (Op F σ)) : Prop :=
  ∀ (t : ℕ) (h : t < prog.length) (i j : ℕ),
    prog[t]'h = Op.div i j → (runRat F prog).getD j 0 ≠ 0

/-- The input variables of the product of an `m × n` matrix by an `n × p` matrix:
`Sum.inl (i, j)` is the entry `x_{ij}` of the first matrix, `Sum.inr (j, k)` the entry
`y_{jk}` of the second. This is BCS's format `⟨m, n, p⟩`. -/
abbrev MatVar (m n p : ℕ) : Type :=
  (Fin m × Fin n) ⊕ (Fin n × Fin p)

/-- The indeterminate `x_{ij}`, the `(i, j)` entry of the first (`m × n`) matrix. -/
def xVar (F : Type) [Field F] (m n p : ℕ) (i : Fin m) (j : Fin n) :
    MvPolynomial (MatVar m n p) F :=
  MvPolynomial.X (Sum.inl (i, j))

/-- The indeterminate `y_{jk}`, the `(j, k)` entry of the second (`n × p`) matrix. -/
def yVar (F : Type) [Field F] (m n p : ℕ) (j : Fin n) (k : Fin p) :
    MvPolynomial (MatVar m n p) F :=
  MvPolynomial.X (Sum.inr (j, k))

/-- The `(i, k)` entry of the product, as a formal polynomial: `∑_j x_{ij} y_{jk}`. -/
def prodEntry (F : Type) [Field F] (m n p : ℕ) (i : Fin m) (k : Fin p) :
    MvPolynomial (MatVar m n p) F :=
  ∑ j : Fin n, xVar F m n p i j * yVar F m n p j k

/-- A division-free program over `F` multiplies an `m × n` matrix by an `n × p` matrix when it
is well formed, uses no division, and every entry of the product occurs among its results as
a formal polynomial identity in `F[x, y]` (BCS: the program computes the set of entries). -/
def IsMatMulProgram (F : Type) [Field F] (m n p : ℕ) (prog : List (Op F (MatVar m n p))) :
    Prop :=
  WellFormed prog ∧ DivisionFree prog ∧
    ∀ (i : Fin m) (k : Fin p), prodEntry F m n p i k ∈ runPoly F prog

/-- A program over `F`, divisions allowed, multiplies an `m × n` matrix by an `n × p` matrix
when it is well formed, executable (no division by the zero rational function), and every
entry of the product occurs among its results as an identity of rational functions in
`F(x, y)`. -/
def IsMatMulProgramDiv (F : Type) [Field F] (m n p : ℕ) (prog : List (Op F (MatVar m n p))) :
    Prop :=
  WellFormed prog ∧ Executable F prog ∧
    ∀ (i : Fin m) (k : Fin p), toRatFn F (MatVar m n p) (prodEntry F m n p i k) ∈ runRat F prog

/-- The exponent of square matrix multiplication over `F`, division-free: the infimum of the
real `s` such that, for some constant `C` (depending on `F` and `s`), for every `n ≥ 1` two
`n × n` matrices are multiplied by a division-free program of cost at most `C · n^s`
(BCS Ch. 15, `ω(k) = inf {τ | L^tot(⟨h, h, h⟩) = O(h^τ)}`, with division-free programs). -/
def omegaSquare (F : Type) [Field F] : ℝ :=
  sInf {s : ℝ | ∃ C : ℝ, ∀ n : ℕ, 1 ≤ n →
    ∃ prog : List (Op F (MatVar n n n)),
      IsMatMulProgram F n n n prog ∧ (cost prog : ℝ) ≤ C * (n : ℝ) ^ s}

/-- The exponent of square matrix multiplication over `F` with division allowed: as
`omegaSquare`, but the programs may divide (outputs equal as rational functions). -/
def omegaSquareDiv (F : Type) [Field F] : ℝ :=
  sInf {s : ℝ | ∃ C : ℝ, ∀ n : ℕ, 1 ≤ n →
    ∃ prog : List (Op F (MatVar n n n)),
      IsMatMulProgramDiv F n n n prog ∧ (cost prog : ℝ) ≤ C * (n : ℝ) ^ s}

/-- The textbook rounding of the side `n^a` to an integer: `⌊n^a⌋`. -/
def roundDim (n : ℕ) (a : ℝ) : ℕ :=
  ⌊(n : ℝ) ^ a⌋₊

/-- The rectangular exponent `ω(F; a, b, c)`, division-free: the infimum of the real `s` such
that, for some constant `C`, for every `n ≥ 1` a `⌊n^a⌋ × ⌊n^b⌋` matrix is multiplied by a
`⌊n^b⌋ × ⌊n^c⌋` matrix by a division-free program of cost at most `C · n^s`. So `a` weights the
rows of the first matrix, `b` the inner dimension, `c` the columns of the second matrix
(BCS's format `⟨n^a, n^b, n^c⟩`). -/
def omegaRect (F : Type) [Field F] (a b c : ℝ) : ℝ :=
  sInf {s : ℝ | ∃ C : ℝ, ∀ n : ℕ, 1 ≤ n →
    ∃ prog : List (Op F (MatVar (roundDim n a) (roundDim n b) (roundDim n c))),
      IsMatMulProgram F (roundDim n a) (roundDim n b) (roundDim n c) prog ∧
        (cost prog : ℝ) ≤ C * (n : ℝ) ^ s}

/-- The dual exponent `α(F)`: the supremum of the `t ∈ [0, 1]` with `ω(F; 1, 1, t) = 2`, where
`ω(F; 1, 1, t)` is the exponent of multiplying an `n × n` matrix by an `n × ⌊n^t⌋` matrix
(the claim's wording; the textbook `n × ⌊n^t⌋` by `⌊n^t⌋ × n` is `ω(F; 1, t, 1)`). -/
def alphaDual (F : Type) [Field F] : ℝ :=
  sSup {t : ℝ | 0 ≤ t ∧ t ≤ 1 ∧ omegaRect F 1 1 t = 2}

/-- The claimed value of `ω(F; a, b, c)`: with the weights sorted as `x ≥ y ≥ z`,
`x + y + (max 0 ((x + y) z − x y))² / (4 x y z)`. -/
def rectFormula (a b c : ℝ) : ℝ :=
  let x := max a (max b c)
  let z := min a (min b c)
  let y := a + b + c - x - z
  x + y + (max 0 ((x + y) * z - x * y)) ^ 2 / (4 * x * y * z)

/-- Claim 1 (division-free, the main proposition): over every field `F`, the exponent of
square matrix multiplication by division-free programs is `9/4`. -/
def SquareExponent : Prop :=
  ∀ (F : Type) [Field F], omegaSquare F = 9 / 4

/-- Claim 1 with division gates: over every field `F`, the exponent of square matrix
multiplication by programs that may divide (outputs equal to the product's entries as
rational functions) is `9/4`. -/
def SquareExponentWithDivision : Prop :=
  ∀ (F : Type) [Field F], omegaSquareDiv F = 9 / 4

/-- Claim 2: over every field `F`, the dual exponent is `α(F) = 1/2`. -/
def DualExponent : Prop :=
  ∀ (F : Type) [Field F], alphaDual F = 1 / 2

/-- Claim 3: over every field `F`, for positive weights `a, b, c`, the rectangular exponent
`ω(F; a, b, c)` equals `rectFormula a b c`. -/
def RectangularExponent : Prop :=
  ∀ (F : Type) [Field F] (a b c : ℝ), 0 < a → 0 < b → 0 < c →
    omegaRect F a b c = rectFormula a b c

end

end BlindA
