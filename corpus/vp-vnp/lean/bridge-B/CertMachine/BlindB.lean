import Mathlib

namespace BlindB

noncomputable section

open scoped BigOperators Classical

/-- A vertex label in an arithmetic circuit over `K` with variables `X` and incoming
wire sources drawn from `W`. The two ports of a binary gate may use the same source. -/
inductive Gate (K X W : Type) where
  /-- A source carrying a field element. -/
  | scalar (a : K)
  /-- A source carrying an input variable. -/
  | input (x : X)
  /-- A binary addition gate. -/
  | add (left right : W)
  /-- A binary multiplication gate. -/
  | mul (left right : W)

/-- A finite arithmetic DAG with a designated output. Vertex indices form a topological
order, so every incoming wire at vertex `i` points back to a vertex numbered below `i`. -/
structure Circuit (K X : Type) where
  /-- The number of vertices, counting both source and arithmetic gates. -/
  size : ℕ
  /-- The label and incoming wires at each vertex. -/
  gate : (i : Fin size) → Gate K X (Fin i.val)
  /-- The vertex whose polynomial is read as the output. -/
  output : Fin size

/-- The formal polynomial at a gate, given the polynomials carried by its incoming wires. -/
def Gate.eval {K X W : Type} [Field K] (g : Gate K X W)
    (value : W → MvPolynomial X K) : MvPolynomial X K :=
  match g with
  | .scalar a => MvPolynomial.C a
  | .input x => MvPolynomial.X x
  | .add u v => value u + value v
  | .mul u v => value u * value v

/-- A circuit computes `f` when its vertices admit a polynomial labelling satisfying every
gate equation and assigning `f` to the designated output. -/
def Circuit.Computes {K X : Type} [Field K] (D : Circuit K X)
    (f : MvPolynomial X K) : Prop :=
  ∃ value : Fin D.size → MvPolynomial X K,
    (∀ i : Fin D.size, value i = (D.gate i).eval
      (fun j => value ⟨j.val, Nat.lt_trans j.isLt i.isLt⟩)) ∧
    value D.output = f

/-- The product of the matrix entries selected by a permutation, one entry from each row. -/
def permMonomial (K : Type) [Field K] {m : ℕ} (σ : Equiv.Perm (Fin m)) :
    MvPolynomial (Fin m × Fin m) K :=
  ∏ i : Fin m, MvPolynomial.X (i, σ i)

/-- A permutation consists of one full cycle if some index has every index in its orbit. -/
def IsFullCycle {m : ℕ} (σ : Equiv.Perm (Fin m)) : Prop :=
  ∃ i : Fin m, ∀ j : Fin m, σ.SameCycle i j

/-- The permanent of the generic square matrix, summed over all permutations of its columns. -/
def PERM (K : Type) [Field K] (m : ℕ) : MvPolynomial (Fin m × Fin m) K :=
  ∑ σ : Equiv.Perm (Fin m), permMonomial K σ

/-- The directed Hamiltonian cycle polynomial, with one monomial for each full cycle. -/
def HC (K : Type) [Field K] (m : ℕ) : MvPolynomial (Fin m × Fin m) K :=
  ∑ σ : Equiv.Perm (Fin m), if IsFullCycle σ then permMonomial K σ else 0

/-- A natural-valued function is polynomially bounded if a fixed multiple of a fixed
natural power of `n + 1` bounds it at every index. -/
def PBounded (t : ℕ → ℕ) : Prop :=
  ∃ a d : ℕ, ∀ n : ℕ, t n ≤ a * (n + 1) ^ d

/-- A nonuniform family specifies a number of variables and a formal polynomial at each index. -/
structure Family (K : Type) [Field K] where
  /-- The number of available variables at each index. -/
  arity : ℕ → ℕ
  /-- The polynomial at each index in its declared variables. -/
  poly : (n : ℕ) → MvPolynomial (Fin (arity n)) K

/-- A p-family has polynomially bounded arity and polynomially bounded total degree. -/
def IsPFamily {K : Type} [Field K] (F : Family K) : Prop :=
  PBounded F.arity ∧ PBounded (fun n => (F.poly n).totalDegree)

/-- VP over `K` consists of p-families computed exactly by polynomial-size circuits over `K`. -/
def VP (K : Type) [Field K] : Set (Family K) :=
  {F | IsPFamily F ∧ ∃ s : ℕ → ℕ, PBounded s ∧
    ∀ n : ℕ, ∃ D : Circuit K (Fin (F.arity n)), D.size ≤ s n ∧ D.Computes (F.poly n)}

/-- Sum a polynomial over all Boolean assignments to its last `b` variables, keeping its
first `a` variables as indeterminates. -/
def booleanSum {K : Type} [Field K] {a b : ℕ} (g : MvPolynomial (Fin (a + b)) K) :
    MvPolynomial (Fin a) K :=
  ∑ bits : Fin b → Bool,
    MvPolynomial.eval₂ MvPolynomial.C
      (Fin.append (fun i : Fin a => MvPolynomial.X i)
        (fun j : Fin b => if bits j then 1 else 0)) g

/-- VNP consists of p-families obtained by summing a VP witness family over polynomially
many Boolean witness variables at each index. -/
def VNP (K : Type) [Field K] : Set (Family K) :=
  {F | IsPFamily F ∧ ∃ w : ℕ → ℕ, PBounded w ∧
    ∃ g : (n : ℕ) → MvPolynomial (Fin (F.arity n + w n)) K,
      (⟨fun n => F.arity n + w n, g⟩ : Family K) ∈ VP K ∧
      ∀ n : ℕ, F.poly n = booleanSum (a := F.arity n) (b := w n) (g n)}

/-- A Laurent-series circuit approximates `f` if it computes the image of `f + ε g`,
where `f` has constant-series coefficients and `g` has power-series coefficients. -/
def Circuit.Approximates {K X : Type} [Field K] (D : Circuit (LaurentSeries K) X)
    (f : MvPolynomial X K) : Prop :=
  ∃ g : MvPolynomial X (PowerSeries K),
    D.Computes (MvPolynomial.map (HahnSeries.ofPowerSeries ℤ K)
      (MvPolynomial.map (PowerSeries.C : K →+* PowerSeries K) f +
        MvPolynomial.C (PowerSeries.X : PowerSeries K) * g))

/-- VP-bar consists of p-families approximated by polynomial-size Laurent-series circuits. -/
def VPBar (K : Type) [Field K] : Set (Family K) :=
  {F | IsPFamily F ∧ ∃ s : ℕ → ℕ, PBounded s ∧
    ∀ n : ℕ, ∃ D : Circuit (LaurentSeries K) (Fin (F.arity n)),
      D.size ≤ s n ∧ D.Approximates (F.poly n)}

/-- The real gate-count threshold at dimension `m`, with constant `c` and logarithm to base two. -/
def gateBound (c : ℝ) (m : ℕ) : ℝ :=
  Real.rpow (m : ℝ) (c * Real.rpow (Real.logb 2 (m : ℝ)) (1 / 3 : ℝ))

/-- An absolute positive constant gives the stated strict lower bound for exact HC circuits
in every characteristic and for exact permanent circuits in characteristic different from two. -/
def MainTheorem : Prop :=
  ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, (p = 0 ∨ Nat.Prime p) →
    ∃ m₀ : ℕ, ∀ (K : Type) [Field K] [CharP K p], ∀ m : ℕ, m₀ ≤ m →
      ∀ D : Circuit K (Fin m × Fin m),
        (D.Computes (HC K m) ∨ (p ≠ 2 ∧ D.Computes (PERM K m))) →
          gateBound c m < (D.size : ℝ)

/-- An absolute positive constant gives the same strict lower bound for approximating
HC circuits in every characteristic and approximating permanent circuits away from two. -/
def MainTheoremApprox : Prop :=
  ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, (p = 0 ∨ Nat.Prime p) →
    ∃ m₀ : ℕ, ∀ (K : Type) [Field K] [CharP K p], ∀ m : ℕ, m₀ ≤ m →
      ∀ D : Circuit (LaurentSeries K) (Fin m × Fin m),
        (D.Approximates (HC K m) ∨ (p ≠ 2 ∧ D.Approximates (PERM K m))) →
          gateBound c m < (D.size : ℝ)

/-- Over each field, VP is a proper subset of VNP. -/
def Separation : Prop :=
  ∀ (K : Type) [Field K], VP K ⊂ VNP K

/-- Over each field, VNP contains a family outside VP-bar. -/
def SeparationClosure : Prop :=
  ∀ (K : Type) [Field K], ¬ (VNP K ⊆ VPBar K)

/-- Every sufficiently large real permanent requires strictly more gates than the threshold
for some fixed positive constant. -/
def PermanentOverReal : Prop :=
  ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m : ℕ, m₀ ≤ m →
    ∀ D : Circuit ℝ (Fin m × Fin m), D.Computes (PERM ℝ m) → gateBound c m < (D.size : ℝ)

end

end BlindB
