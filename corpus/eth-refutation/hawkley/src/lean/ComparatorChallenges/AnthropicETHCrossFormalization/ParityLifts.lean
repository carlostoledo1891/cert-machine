/-
RPI-378.3d trusted definitions: byte-for-byte slices of OpenAI ParityLifts at
thinkthoughts/math 81ec97cd23d21675cee4ee76768fffba33a61e17 (see the challenge file).
-/
import Mathlib

namespace OAI

namespace ParityWL

/-! Finite-alphabet deterministic multitape model.
A transition reads and writes only the currently scanned
cell on each tape and moves each head by at most one cell. -/
namespace Complexity

inductive Move | left | stay | right
  deriving DecidableEq

instance : Fintype Move :=
  ⟨{Move.left, Move.stay, Move.right}, by intro x; cases x <;> simp⟩

def Move.offset : Move → ℤ
  | .left => -1
  | .stay => 0
  | .right => 1

/-- Blank is 0, input bits are 1 and 2. Every work alphabet, state space and
collection of tapes is finite. Tapes are two-way infinite. -/
structure Machine where
  tapes : ℕ
  extraSymbols : ℕ
  extraStates : ℕ
  initial : Fin (extraStates + 1)
  output : Fin (extraStates + 1) → Option Bool
  transition : Fin (extraStates + 1) →
    (Fin (tapes + 1) → Fin (extraSymbols + 3)) →
    Fin (extraStates + 1) × (Fin (tapes + 1) → Fin (extraSymbols + 3) × Move)

structure Configuration (M : Machine) where
  state : Fin (M.extraStates + 1)
  head : Fin (M.tapes + 1) → ℤ
  tape : Fin (M.tapes + 1) → ℤ → Fin (M.extraSymbols + 3)

def inputSymbol (M : Machine) (b : Bool) : Fin (M.extraSymbols + 3) :=
  if b then ⟨2, by omega⟩ else ⟨1, by omega⟩

def initialConfiguration (M : Machine) (input : List Bool) : Configuration M where
  state := M.initial
  head := fun _ => 0
  tape := fun i z => if i.val = 0 ∧ 0 ≤ z then
    match input[z.toNat]? with
    | some b => inputSymbol M b
    | none => 0
    else 0

def step (M : Machine) (x : Configuration M) : Configuration M :=
  match M.output x.state with
  | some _ => x
  | none =>
      let a := M.transition x.state (fun i => x.tape i (x.head i))
      { state := a.1
        head := fun i => x.head i + (a.2 i).2.offset
        tape := fun i z => if z = x.head i then (a.2 i).1 else x.tape i z }

def run (M : Machine) (input : List Bool) (s : ℕ) : Configuration M :=
  (step M)^[s] (initialConfiguration M input)

def Emits (M : Machine) (input : List Bool) (s : ℕ) (b : Bool) : Prop :=
  M.output (run M input s).state = some b


end Complexity
end ParityWL

namespace ParityWL.Complexity
abbrev Literal (N : ℕ) := Fin N × Bool

structure Clause (N : ℕ) where
  literals : List (Literal N)
  width : literals.length ≤ 3

abbrev Formula (N : ℕ) := List (Clause N)

def Clause.Satisfied {N : ℕ} (C : Clause N) (a : Fin N → Bool) : Prop :=
  ∃ l ∈ C.literals, a l.1 = l.2

def Formula.Satisfied {N : ℕ} (F : Formula N) (a : Fin N → Bool) : Prop :=
  ∀ C ∈ F, C.Satisfied a

def Formula.Satisfiable {N : ℕ} (F : Formula N) : Prop :=
  ∃ a, F.Satisfied a

/-- Self-delimiting binary natural numbers, followed by the explicit formula.
The clause width is encoded even for an empty clause. -/
def encodeNat (n : ℕ) : List Bool :=
  List.replicate n.bits.length true ++ false :: n.bits

def encodeClause {N : ℕ} (C : Clause N) : List Bool :=
  encodeNat C.literals.length ++ C.literals.flatMap (fun l => encodeNat l.1.val ++ [l.2])

def encodeFormula {N : ℕ} (F : Formula N) : List Bool :=
  encodeNat N ++ encodeNat F.length ++ F.flatMap encodeClause


end ParityWL.Complexity

namespace ParityWL.Complexity

/-- An actual execution bound; no computation is hidden in its interpretation. -/
def SATTimeBound (M : Machine) (B : ℕ → ℕ → ℝ) : Prop :=
  ∀ (N : ℕ) (F : Formula N), ∃ s b,
    Emits M (encodeFormula F) s b ∧ (b = true ↔ F.Satisfiable) ∧
    (s : ℝ) ≤ B N (encodeFormula F).length

/-- Positive-rate ETH: one positive forbidden rate, with arbitrary fixed
polynomial input factor. This is not the weaker uniform premise below. -/
def PositiveRateETH : Prop :=
  ∃ δ : ℝ, 0 < δ ∧ ¬ ∃ (M : Machine) (C : ℝ) (d : ℕ),
    0 < C ∧ SATTimeBound M (fun N L => C * (L + 1 : ℝ) ^ d * (2 : ℝ) ^ (δ * N))

end ParityWL.Complexity

end OAI
