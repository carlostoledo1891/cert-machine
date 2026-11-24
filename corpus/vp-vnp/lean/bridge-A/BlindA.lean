import Mathlib

/-!
# Blind statement A: "VP ≠ VNP over every field", in the straight-line-program model

Writer A, cert-machine VP ≠ VNP lane, 2026-11-23. Definitions and statements only, no proofs.
Written without a compiler, against Lean v4.33.1 and Mathlib at commit
`0df444a360eaa60ab8c11dca51a86af692955474`.

## The model

Division-free straight-line programs, as in Bürgisser–Clausen–Shokrollahi, *Algebraic Complexity
Theory* (1997), Ch. 4, and Bürgisser, *Completeness and Reduction in Algebraic Complexity Theory*
(2000), Ch. 1–2:

* a program of length `ℓ` over a field `F` in the variables `(X i)_{i : σ}` is a sequence of `ℓ`
  instructions; instruction number `r` applies one of `+`, `−`, `×` to two operands, each operand
  an input variable, a constant of `F`, or the result of an instruction with a smaller number;
* the size of a program is its length `ℓ`, the number of arithmetic operations: every `+`, `−`,
  `×` costs one, inputs and constants cost nothing;
* a program computes `f` when `f` is one of its inputs (a variable or a constant) or one of its
  results;
* the total complexity `L(f)` is the MINIMUM length of a program computing `f` (Bürgisser 2000
  defines it as a minimum; so does this file, via `sInf` on `ℕ`).

"Every circuit for `f` has more than `B` gates" is therefore stated as `B < L(f)`.

See `NOTES.md` beside this file for the sources, the alternatives and the ambiguities.
-/

noncomputable section

namespace BlindA

/-! ## Straight-line programs -/

/-- The three operation symbols of a division-free straight-line program: addition, subtraction
and multiplication. Each is binary and each costs one. -/
inductive Op : Type
  /-- addition `a + b` -/
  | add
  /-- subtraction `a - b` -/
  | sub
  /-- multiplication `a * b` -/
  | mul

/-- The value of an operation symbol applied to two elements `a`, `b` of a commutative ring. -/
def Op.apply {R : Type} [CommRing R] : Op → R → R → R
  | Op.add, a, b => a + b
  | Op.sub, a, b => a - b
  | Op.mul, a, b => a * b

/-- An operand of the instruction with number `r` (instructions are numbered `0, 1, 2, …`): an
input variable `X i` with `i : σ`, a constant `c` of the ground field `F`, or the result of an
earlier instruction, with number `j < r`. -/
inductive Operand (σ : Type) (F : Type) (r : ℕ) : Type
  /-- the input variable `X i` -/
  | var : σ → Operand σ F r
  /-- the constant `c ∈ F` (constants are free inputs) -/
  | const : F → Operand σ F r
  /-- the result of the earlier instruction with number `j < r` -/
  | prev : Fin r → Operand σ F r

/-- The instruction with number `r` of a straight-line program: an operation symbol and its two
operands, both of which must be available at step `r`. -/
structure Instr (σ : Type) (F : Type) (r : ℕ) : Type where
  /-- the operation symbol -/
  op : Op
  /-- the first operand -/
  left : Operand σ F r
  /-- the second operand -/
  right : Operand σ F r

/-- A division-free straight-line program of length `ℓ` over `F` in the input variables
`(X i)_{i : σ}`: one instruction for each number `r < ℓ`, the instruction with number `r` reading
only input variables, constants of `F` and the results of the instructions `0, …, r − 1`.
The length `ℓ` is the size of the program: its number of arithmetic operations. -/
structure SLP (σ : Type) (F : Type) (ℓ : ℕ) : Type where
  /-- the instruction with number `r` -/
  instr : (r : Fin ℓ) → Instr σ F r.val

/-- The value of an operand in an `F`-algebra `R`, given the values `x` of the input variables and
the values `u` of the earlier instructions. A constant `c` takes the value `algebraMap F R c`. -/
def Operand.eval {σ F R : Type} [CommRing F] [CommRing R] [Algebra F R] {r : ℕ}
    (a : Operand σ F r) (x : σ → R) (u : Fin r → R) : R :=
  match a with
  | Operand.var i => x i
  | Operand.const c => algebraMap F R c
  | Operand.prev j => u j

/-- The value of an instruction in an `F`-algebra `R`: its operation applied to the values of its
two operands, given the values `x` of the input variables and `u` of the earlier instructions. -/
def Instr.eval {σ F R : Type} [CommRing F] [CommRing R] [Algebra F R] {r : ℕ}
    (I : Instr σ F r) (x : σ → R) (u : Fin r → R) : R :=
  I.op.apply (I.left.eval x u) (I.right.eval x u)

/-- `SLP.vals P x r h` is the tuple of the results of the first `r` instructions of `P` (those with
number `< r`) when the input variables take the values `x : σ → R` in an `F`-algebra `R`.
Defined by recursion on `r`: the first `r + 1` results are the first `r` results followed by the
value of instruction number `r` on them. -/
def SLP.vals {σ F R : Type} [CommRing F] [CommRing R] [Algebra F R] {ℓ : ℕ}
    (P : SLP σ F ℓ) (x : σ → R) : (r : ℕ) → r ≤ ℓ → Fin r → R
  | 0, _ => fun j => Fin.elim0 j
  | r + 1, h =>
    have hr : r < ℓ := h
    fun j =>
      if hj : (j : ℕ) < r then SLP.vals P x r (Nat.le_of_lt hr) ⟨j, hj⟩
      else (P.instr ⟨r, hr⟩).eval x (SLP.vals P x r (Nat.le_of_lt hr))

/-- The result sequence `(b_0, …, b_{ℓ−1})` of `P` when the input variables take the values `x`:
`b_r` is the value of the instruction with number `r`. -/
def SLP.result {σ F R : Type} [CommRing F] [CommRing R] [Algebra F R] {ℓ : ℕ}
    (P : SLP σ F ℓ) (x : σ → R) : Fin ℓ → R :=
  SLP.vals P x ℓ (Nat.le_refl ℓ)

/-- The set of polynomials computed by `P` (BCS §4.1: the program computes every element of its
result sequence, the inputs included): the variables `X i`, the constants `C c` with `c ∈ F`, and
the results of all instructions when the input variables take the values `X i` in `F[X]`. -/
def SLP.computed {σ F : Type} [CommRing F] {ℓ : ℕ} (P : SLP σ F ℓ) :
    Set (MvPolynomial σ F) :=
  Set.range (fun i : σ => (MvPolynomial.X i : MvPolynomial σ F)) ∪
    Set.range (fun c : F => (MvPolynomial.C c : MvPolynomial σ F)) ∪
    Set.range (SLP.result (R := MvPolynomial σ F) P (fun i => MvPolynomial.X i))

/-- The total complexity `L_F(f)` of a polynomial `f ∈ F[X]` (Bürgisser 2000, Ch. 1–2): the
minimal length of a straight-line program over `F` that computes `f`; that is, the minimal number
of operations `+`, `−`, `×` sufficient to compute `f` from the variables and constants of `F`.
Every polynomial is computed by some program, so the set below is nonempty and `sInf` is its least
element. -/
def complexity (F : Type) [Field F] {σ : Type} (f : MvPolynomial σ F) : ℕ :=
  sInf {ℓ : ℕ | ∃ P : SLP σ F ℓ, f ∈ P.computed}

/-! ## Approximate computation over `K((ε))` -/

/-- The formal variable `ε` of the field `K((ε))` of formal Laurent series over `K` (Mathlib's
`LaurentSeries K`, the Hahn series `HahnSeries ℤ K`): the series with coefficient `1` at `ε¹` and
`0` elsewhere. -/
def eps (K : Type) [Field K] : LaurentSeries K :=
  HahnSeries.single (1 : ℤ) (1 : K)

/-- A polynomial `G ∈ K((ε))[X]` approximates `f ∈ K[X]`: `G = f + ε·g` for some polynomial `g`
all of whose coefficients lie in `K[[ε]]`. Here `K ⊆ K((ε))` by the constant series and
`K[[ε]] ⊆ K((ε))` by the standard embedding of power series in Laurent series. -/
def Approximates (K : Type) [Field K] {σ : Type}
    (G : MvPolynomial σ (LaurentSeries K)) (f : MvPolynomial σ K) : Prop :=
  ∃ g : MvPolynomial σ (PowerSeries K),
    G = MvPolynomial.map (algebraMap K (LaurentSeries K)) f +
      MvPolynomial.C (eps K) * MvPolynomial.map (HahnSeries.ofPowerSeries ℤ K) g

/-- The approximative complexity `L̲_K(f)` of `f ∈ K[X]`: the minimal length of a straight-line
program over the field `K((ε))` (constants from `K((ε))`) that computes some polynomial `G` which
approximates `f`, i.e. a program that approximates `f`. -/
def approxComplexity (K : Type) [Field K] {σ : Type} (f : MvPolynomial σ K) : ℕ :=
  sInf {ℓ : ℕ | ∃ P : SLP σ (LaurentSeries K) ℓ, ∃ G ∈ P.computed, Approximates K G f}

/-! ## p-families and the classes VP, VNP, VP-bar -/

/-- A family `f = (f_n)_{n ∈ ℕ}` of multivariate polynomials over `K`, the polynomial `f_n` in the
`v(n)` variables `X_0, …, X_{v(n)−1}` (Bürgisser 2000 writes `X_1, …, X_{v(n)}`). -/
structure Family (K : Type) [CommRing K] : Type where
  /-- the number of variables `v(n)` of `f_n` -/
  nvars : ℕ → ℕ
  /-- the polynomial `f_n ∈ K[X_0, …, X_{v(n)−1}]` -/
  poly : (n : ℕ) → MvPolynomial (Fin (nvars n)) K

/-- A function `t : ℕ → ℕ` is p-bounded: there is a polynomial `q` with `t(n) ≤ q(n)` for every
`n` (Bürgisser 2000, Ch. 2; `q` with natural-number coefficients, which loses nothing). -/
def PBounded (t : ℕ → ℕ) : Prop :=
  ∃ q : Polynomial ℕ, ∀ n : ℕ, t n ≤ q.eval n

/-- A family is a p-family: both its number of variables `v(n)` and the degree `deg f_n` are
p-bounded functions of `n` (Bürgisser 2000, Ch. 2). -/
def IsPFamily {K : Type} [CommRing K] (f : Family K) : Prop :=
  PBounded f.nvars ∧ PBounded (fun n => (f.poly n).totalDegree)

/-- The class `VP_K` of p-computable families (Bürgisser 2000, Ch. 2): the p-families `f` whose
total complexity `L_K(f_n)` is a p-bounded function of `n`. -/
def VP (K : Type) [Field K] : Set (Family K) :=
  {f | IsPFamily f ∧ PBounded (fun n => complexity K (f.poly n))}

/-- The Boolean sum of `g ∈ K[X_0, …, X_{v+w−1}]` over its last `w` variables:
`Σ_{e ∈ {0,1}^w} g(X_0, …, X_{v−1}, e_0, …, e_{w−1}) ∈ K[X_0, …, X_{v−1}]`. -/
def booleanSum {K : Type} [CommRing K] (v w : ℕ) (g : MvPolynomial (Fin (v + w)) K) :
    MvPolynomial (Fin v) K :=
  ∑ e : (Fin w → Bool),
    MvPolynomial.aeval (R := K)
      (Fin.append (fun i : Fin v => (MvPolynomial.X i : MvPolynomial (Fin v) K))
        (fun j : Fin w => if e j = true then (1 : MvPolynomial (Fin v) K) else 0)) g

/-- The class `VNP_K` of p-definable families (Bürgisser 2000, Ch. 2): the p-families `f` for which
there are a function `w : ℕ → ℕ` and a family `g ∈ VP_K`, `g_n` in the `v(n) + w(n)` variables,
such that `f_n = Σ_{e ∈ {0,1}^{w(n)}} g_n(X_0, …, X_{v(n)−1}, e)` for every `n`. -/
def VNP (K : Type) [Field K] : Set (Family K) :=
  {f | IsPFamily f ∧
    ∃ w : ℕ → ℕ, ∃ g : (n : ℕ) → MvPolynomial (Fin (f.nvars n + w n)) K,
      Family.mk (fun n => f.nvars n + w n) g ∈ VP K ∧
      ∀ n : ℕ, f.poly n = booleanSum (f.nvars n) (w n) (g n)}

/-- The class `VP-bar_K` (the claim's definition 3): defined like `VP_K` with approximating
programs over `K((ε))` in place of programs, i.e. the p-families `f` whose approximative complexity
`L̲_K(f_n)` is a p-bounded function of `n`. -/
def VPbar (K : Type) [Field K] : Set (Family K) :=
  {f | IsPFamily f ∧ PBounded (fun n => approxComplexity K (f.poly n))}

/-! ## The permanent and the Hamiltonian cycle polynomial -/

/-- The permanent `PERM_m = Σ_{π ∈ S_m} Π_i x_{i,π(i)}` of the `m × m` matrix of variables
`x_{i,j}`; the variable `x_{i,j}` is `X (i, j)`. -/
def perm (K : Type) [CommRing K] (m : ℕ) : MvPolynomial (Fin m × Fin m) K :=
  ∑ π : Equiv.Perm (Fin m),
    ∏ i : Fin m, (MvPolynomial.X (i, π i) : MvPolynomial (Fin m × Fin m) K)

/-- A permutation `π` of `{0, …, m − 1}` is cyclic, i.e. consists of a single `m`-cycle: any two
points lie in the same cycle of `π`. There are `(m − 1)!` of them for `m ≥ 1`. (For `m ≥ 2` this
is `π.IsCycle ∧ π.support = univ`; for `m = 1` it admits the identity, Mathlib's `IsCycle` does
not.) -/
def IsFullCycle {m : ℕ} (π : Equiv.Perm (Fin m)) : Prop :=
  ∀ i j : Fin m, Equiv.Perm.SameCycle π i j

open Classical in
/-- The Hamiltonian cycle polynomial `HC_m = Σ_{π cyclic} Π_i x_{i,π(i)}`: the permanent's sum
restricted to the `(m − 1)!` cyclic permutations, those consisting of one `m`-cycle. -/
def hc (K : Type) [CommRing K] (m : ℕ) : MvPolynomial (Fin m × Fin m) K :=
  ∑ π ∈ Finset.filter (fun π : Equiv.Perm (Fin m) => IsFullCycle π) Finset.univ,
    ∏ i : Fin m, (MvPolynomial.X (i, π i) : MvPolynomial (Fin m × Fin m) K)

/-- The permanent family `(PERM_n)_n` written as a `Family` in Bürgisser's format: `n²` variables,
`x_{i,j}` renamed to `X_{j + n·i}` by `finProdFinEquiv`. (Not used by the five propositions; it
places `PERM` among the families the classes are made of.) -/
def permFamily (K : Type) [CommRing K] : Family K :=
  Family.mk (fun n => n * n)
    (fun n => MvPolynomial.rename (R := K) (fun ij : Fin n × Fin n => finProdFinEquiv ij) (perm K n))

/-- The Hamiltonian cycle family `(HC_n)_n` written as a `Family`, variables renamed as in
`permFamily`. (Not used by the five propositions.) -/
def hcFamily (K : Type) [CommRing K] : Family K :=
  Family.mk (fun n => n * n)
    (fun n => MvPolynomial.rename (R := K) (fun ij : Fin n × Fin n => finProdFinEquiv ij) (hc K n))

/-! ## The claim -/

/-- The claimed lower bound `m^(c·(log₂ m)^(1/3))`, a real number (both powers are real powers). -/
def claimedBound (c : ℝ) (m : ℕ) : ℝ :=
  (m : ℝ) ^ (c * (Real.logb 2 (m : ℝ)) ^ ((1 : ℝ) / 3))

/-- Claim 1, the main theorem. There is an absolute constant `c > 0` such that for every `p`, zero
or prime, there is `m₀` such that over every field `K` of characteristic `p` and for every
`m ≥ m₀`: every straight-line program over `K` computing `HC_m` has more than
`m^(c·(log₂ m)^(1/3))` operations, and, if `p ≠ 2`, so has every program computing `PERM_m`.
"More than `B` operations for every program" is stated as `B < L_K(·)`, `L_K` the minimum. -/
def MainTheorem : Prop :=
  ∃ c : ℝ, 0 < c ∧
    ∀ p : ℕ, (p = 0 ∨ p.Prime) →
      ∃ m₀ : ℕ, ∀ (K : Type) [Field K] [CharP K p], ∀ m : ℕ, m₀ ≤ m →
        claimedBound c m < (complexity K (hc K m) : ℝ) ∧
          (p ≠ 2 → claimedBound c m < (complexity K (perm K m) : ℝ))

/-- Claim 3, the main theorem for approximate computation: the statement of `MainTheorem` with
programs over `K((ε))` that approximate `HC_m`, respectively `PERM_m`, in place of programs over `K`
that compute them, i.e. with the approximative complexity `L̲_K` in place of `L_K`. The constants
`c` and `m₀` are quantified afresh. -/
def MainTheoremApprox : Prop :=
  ∃ c : ℝ, 0 < c ∧
    ∀ p : ℕ, (p = 0 ∨ p.Prime) →
      ∃ m₀ : ℕ, ∀ (K : Type) [Field K] [CharP K p], ∀ m : ℕ, m₀ ≤ m →
        claimedBound c m < (approxComplexity K (hc K m) : ℝ) ∧
          (p ≠ 2 → claimedBound c m < (approxComplexity K (perm K m) : ℝ))

/-- Claim 2, the corollary: over every field `K`, `VP_K` is a proper subset of `VNP_K`
(`VP_K ⊆ VNP_K` and `VNP_K ⊄ VP_K`). -/
def Separation : Prop :=
  ∀ (K : Type) [Field K], VP K ⊂ VNP K

/-- Claim 4: over every field `K`, `VNP_K` is not contained in `VP-bar_K`. -/
def SeparationClosure : Prop :=
  ∀ (K : Type) [Field K], ¬ (VNP K ⊆ VPbar K)

/-- Claim 5, the special case over the real numbers: there are `c > 0` and `m₀` such that for every
`m ≥ m₀` every straight-line program over `ℝ` computing `PERM_m` has more than
`m^(c·(log₂ m)^(1/3))` operations. -/
def PermanentOverReal : Prop :=
  ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m : ℕ, m₀ ≤ m →
    claimedBound c m < (complexity ℝ (perm ℝ m) : ℝ)

end BlindA

end
