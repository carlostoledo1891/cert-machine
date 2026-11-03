import OAI.Bridges.AnthropicETH.Reduction

/-!
# RPI-378.3b, part 1: the `FinTM2` that simulates a ParityLifts machine

For a ParityLifts multitape `Machine` `M` (tapes `Fin (M.tapes+1)`, symbols
`Fin (M.extraSymbols+3)` with blank `0`), `toFinTM2 M` is one of Mathlib's `FinTM2` machines:

* **Stacks** (`Stk`): the input stack `inp` (alphabet `Bool`), the output stack `out` (alphabet
  `Bool`), and for each tape `i` two work stacks `left i`, `right i` (alphabet: `M`'s symbols).
  Tape `i` with head `h` is held as `right i = [cell h, cell h+1, …]` and
  `left i = [cell h-1, cell h-2, …]`; cells beyond the ends of the lists are blank.
* **Labels** (`Lbl`): `load1` (move the input from `inp` onto `left 0`, reversed), `load2` (move
  it from `left 0` onto `right 0`, now in order and as `M`'s input symbols), `sim` (one step of
  `M`), `clean` (pop every work stack once per step until all are empty, then write the answer
  and halt).
* **Internal state** (`Var`): `M`'s control state `q`, a buffer `scan` for the scanned symbols,
  one scratch symbol `tmp`, and one flag.

One Mathlib step runs a whole statement, so one step of `M` costs exactly one step here: the `sim`
statement peeks every `right i`, applies `M.transition`, and rewrites both stacks of every tape.
-/

namespace OAI.Bridges.AnthropicETH.Sim

open OAI.ParityWL.Complexity Turing

/-- The stacks: input, output, and two per tape. -/
inductive Stk (n : ℕ) where
  | inp
  | out
  | left (i : Fin n)
  | right (i : Fin n)
  deriving DecidableEq, Fintype

/-- The four program labels. -/
inductive Lbl where
  | load1
  | load2
  | sim
  | clean
  deriving DecidableEq

instance : Fintype Lbl :=
  ⟨{Lbl.load1, Lbl.load2, Lbl.sim, Lbl.clean}, by intro x; cases x <;> simp⟩

variable (M : Machine)

/-- `M`'s tape symbols. -/
abbrev Sym := Fin (M.extraSymbols + 3)

/-- `M`'s tapes. -/
abbrev Tp := Fin (M.tapes + 1)

/-- Stack alphabets: `Bool` for input and output, `M`'s symbols for the work stacks. -/
@[reducible] def Γ : Stk (M.tapes + 1) → Type
  | .inp => Bool
  | .out => Bool
  | .left _ => Fin (M.extraSymbols + 3)
  | .right _ => Fin (M.extraSymbols + 3)

theorem finite_Γ (k : Stk (M.tapes + 1)) : Finite (Γ M k) := by
  cases k <;> (unfold Γ; infer_instance)

/-- The blank symbol. -/
def blank : Sym M := 0

/-- The internal state of the simulating machine. -/
structure Var where
  q : Fin (M.extraStates + 1)
  scan : Fin (M.tapes + 1) → Fin (M.extraSymbols + 3)
  tmp : Fin (M.extraSymbols + 3)
  flag : Bool
  deriving Fintype

/-- The initial (and final) internal state. -/
def Var.init : Var M := ⟨M.initial, fun _ => 0, 0, false⟩

/-- The internal state at the top of every simulated step: control state `q`, all else cleared. -/
def Var.at (q : Fin (M.extraStates + 1)) : Var M := ⟨q, fun _ => 0, 0, false⟩

theorem Var.init_eq : Var.init M = Var.at M M.initial := rfl

/-- The action of `M` on tape `i`, from the control state and scanned symbols held in `v`. -/
def act (v : Var M) (i : Tp M) : Sym M × Move := (M.transition v.q v.scan).2 i

/-- After the tape updates: the next control state, everything else cleared. -/
def next (v : Var M) : Var M := Var.at M (M.transition v.q v.scan).1

/-- Program statements. -/
abbrev St := TM2.Stmt (Γ M) Lbl (Var M)

/-- Peek at `right i` for each listed tape `i`, recording the scanned symbol in `scan i`. -/
def peekAll : List (Tp M) → St M → St M
  | [], k => k
  | i :: is, k =>
      .peek (.right i) (fun v o => { v with scan := Function.update v.scan i (o.getD (blank M)) })
        (peekAll is k)

/-- Write and move on tape `i` according to `act v i`. With `(L, R) = (left i, right i)`:
pop `R`; then **stay**: push the written symbol on `R`; **right**: push it on `L`;
**left**: push it on `R`, pop `L` and push the popped symbol (blank if none) on `R`. -/
def writeOne (i : Tp M) (k : St M) : St M :=
  .pop (.right i) (fun v _ => v) <|
    .branch (fun v => decide ((act M v i).2 = .left))
      (.push (.right i) (fun v => (act M v i).1) <|
        .pop (.left i) (fun v o => { v with tmp := o.getD (blank M) }) <|
          .push (.right i) (fun v => v.tmp) k)
      (.branch (fun v => decide ((act M v i).2 = .right))
        (.push (.left i) (fun v => (act M v i).1) k)
        (.push (.right i) (fun v => (act M v i).1) k))

/-- `writeOne` for each listed tape. -/
def writeAll : List (Tp M) → St M → St M
  | [], k => k
  | i :: is, k => writeOne M i (writeAll is k)

/-- Pop `left i` and `right i` for each listed tape, raising `flag` if any pop found a symbol. -/
def popAll : List (Tp M) → St M → St M
  | [], k => k
  | i :: is, k =>
      .pop (.left i) (fun v o => { v with flag := v.flag || o.isSome }) <|
        .pop (.right i) (fun v o => { v with flag := v.flag || o.isSome }) (popAll is k)

/-- The program. -/
def prog : Lbl → St M
  | .load1 =>
      .pop .inp (fun v o => { v with tmp := inputSymbol M (o.getD false), flag := o.isSome }) <|
        .branch (fun v => v.flag)
          (.push (.left 0) (fun v => v.tmp) (.goto fun _ => .load1))
          (.goto fun _ => .load2)
  | .load2 =>
      .pop (.left 0) (fun v o => { v with tmp := o.getD (blank M), flag := o.isSome }) <|
        .branch (fun v => v.flag)
          (.push (.right 0) (fun v => v.tmp) (.goto fun _ => .load2))
          (.load (fun _ => Var.init M) (.goto fun _ => .sim))
  | .sim =>
      .branch (fun v => (M.output v.q).isSome)
        (.goto fun _ => .clean)
        (peekAll M (List.finRange (M.tapes + 1)) <|
          writeAll M (List.finRange (M.tapes + 1)) <|
            .load (next M) (.goto fun _ => .sim))
  | .clean =>
      popAll M (List.finRange (M.tapes + 1)) <|
        .branch (fun v => v.flag)
          (.load (fun v => { v with flag := false }) (.goto fun _ => .clean))
          (.push .out (fun v => (M.output v.q).getD false) (.load (fun _ => Var.init M) .halt))

instance : Fintype (Γ M .inp) := inferInstanceAs (Fintype Bool)

/-- The simulating machine. -/
def toFinTM2 : FinTM2 where
  K := Stk (M.tapes + 1)
  k₀ := .inp
  k₁ := .out
  Γ := Γ M
  Λ := Lbl
  main := .load1
  σ := Var M
  initialState := Var.init M
  m := prog M

/-- The simulating machine with its input and output alphabets identified with `Bool`. -/
def toTM2 : TM2ComputableAux Bool Bool where
  tm := toFinTM2 M
  inputAlphabet := Equiv.refl Bool
  outputAlphabet := Equiv.refl Bool

theorem toTM2_finite : ∀ i, Finite ((toTM2 M).tm.Γ i) := finite_Γ M

end OAI.Bridges.AnthropicETH.Sim
