import Mathlib

/-!
# Two input encodings of a pair of naturals, one machine

`reencode` and `bigO_shift` are proved exactly as they were asked: no statement was changed, no
hypothesis added. `PairSym`, `encodeNatPair` and `pairEnc` are the copied definitions.

The machine built in `reencode` (`tmx`) is the given machine behind a three-label prelude:

* stacks `M.tm.K ⊕ Bool`: the old ones, a new input stack (`inr true`, alphabet `PairSym`) and a
  temporary stack (`inr false`, alphabet `Bool ⊕ Bool`);
* state `M.tm.σ × Option (Bool ⊕ Bool)`: the old state and a one-symbol register, empty at the
  start and empty again when the old program starts (so the halting state is the initial one);
* labels `M.tm.Λ ⊕ PL`;
* time `fun L => M.time (L - 1) + 2 * (L + 1)`; the prelude takes exactly `2 * (L - 1) + 3` steps
  on a separated word of length `L`, and the constant of the statement is `c = 2`.

The old program is lifted statement by statement (`liftStmt`); `stepAux_lift` is the simulation
lemma, by induction on `Turing.TM2.Stmt`.
-/

namespace IntMulEnc
open Computability

/-- Input alphabet of the separated encoding (copied verbatim from one project's statement file). -/
inductive PairSym
  | bit (b : Bool)
  | sep
  deriving DecidableEq, Fintype

def encodeNatPair (p : ℕ × ℕ) : List PairSym :=
  (encodeNat p.1).map PairSym.bit ++ PairSym.sep :: (encodeNat p.2).map PairSym.bit

/-- The tagged encoding (copied from the other project's statement file). -/
abbrev pairEnc : ℕ × ℕ → List (Bool ⊕ Bool) :=
  (encodingProd encodingNatBool encodingNatBool).encode

/-! ## Runs of a step function, counted exactly -/

section Run
variable {α : Type*}

/-- `Run f n a b`: exactly `n` steps of `f` take `a` to `b`. -/
def Run (f : α → Option α) (n : ℕ) (a b : α) : Prop :=
  (flip bind f)^[n] (some a) = some b

theorem Run.refl (f : α → Option α) (a : α) : Run f 0 a a := rfl

theorem Run.head {f : α → Option α} {n : ℕ} {a b c : α} (h : f a = some b)
    (h' : Run f n b c) : Run f (n + 1) a c := by
  unfold Run at *
  rw [Function.iterate_succ_apply]
  have e : flip bind f (some a) = some b := h
  rw [e]
  exact h'

theorem Run.trans {f : α → Option α} {n m : ℕ} {a b c : α} (h : Run f n a b)
    (h' : Run f m b c) : Run f (m + n) a c := by
  unfold Run at *
  rw [Function.iterate_add_apply, h, h']

theorem Run.congr {f : α → Option α} {n n' : ℕ} {a b b' : α} (h : Run f n a b)
    (hn : n = n') (hb : b = b') : Run f n' a b' := by
  subst hn hb
  exact h

theorem Run.congr_left {f : α → Option α} {n : ℕ} {a a' b : α} (h : Run f n a b)
    (ha : a' = a) : Run f n a' b := by
  subst ha
  exact h

end Run

/-! ## The construction: a prelude in front of the given machine -/

section Construction
open Turing

/-- The three labels of the prelude: before the separator, after it, copying back. -/
inductive PL
  | A | B | C
  deriving DecidableEq

instance : Fintype PL where
  elems := {PL.A, PL.B, PL.C}
  complete := fun x => by cases x <;> simp

/-- The one-symbol register the prelude adds to the state. -/
abbrev Reg := Option (Bool ⊕ Bool)

variable {K : Type} {Γ : K → Type} {Λ σ : Type}

/-- Stack alphabets of the new machine: the old stacks, the new input stack (`inr true`,
alphabet `PairSym`) and a temporary stack (`inr false`, alphabet `Bool ⊕ Bool`). -/
@[reducible] def Γx (Γ : K → Type) : K ⊕ Bool → Type
  | Sum.inl k => Γ k
  | Sum.inr true => PairSym
  | Sum.inr false => Bool ⊕ Bool

/-- The stacks of the new machine, from the old stacks and the two new ones. -/
def mkS (S : ∀ k, List (Γ k)) (inp : List PairSym) (tmp : List (Bool ⊕ Bool)) :
    ∀ k', List (Γx Γ k')
  | Sum.inl k => S k
  | Sum.inr true => inp
  | Sum.inr false => tmp

@[simp] theorem mkS_inl (S : ∀ k, List (Γ k)) (inp : List PairSym) (tmp : List (Bool ⊕ Bool))
    (k : K) : mkS S inp tmp (Sum.inl k) = S k := rfl

@[simp] theorem mkS_inp (S : ∀ k, List (Γ k)) (inp : List PairSym) (tmp : List (Bool ⊕ Bool)) :
    mkS S inp tmp (Sum.inr true) = inp := rfl

@[simp] theorem mkS_tmp (S : ∀ k, List (Γ k)) (inp : List PairSym) (tmp : List (Bool ⊕ Bool)) :
    mkS S inp tmp (Sum.inr false) = tmp := rfl

theorem cfg_eq (c : TM2.Cfg Γ Λ σ) (l : Option Λ) (v : σ)
    (S : ∀ k, List (Γ k)) (hl : c.l = l) (hv : c.var = v) (hS : ∀ k, c.stk k = S k) :
    c = ⟨l, v, S⟩ := by
  obtain ⟨l', v', S'⟩ := c
  have hS' : S' = S := funext hS
  subst hl hv hS'
  rfl

/-- A statement of the old machine, as a statement of the new one. -/
def liftStmt : TM2.Stmt Γ Λ σ → TM2.Stmt (Γx Γ) (Λ ⊕ PL) (σ × Reg)
  | TM2.Stmt.push k f q => TM2.Stmt.push (Sum.inl k) (fun v => f v.1) (liftStmt q)
  | TM2.Stmt.peek k f q => TM2.Stmt.peek (Sum.inl k) (fun v o => (f v.1 o, v.2)) (liftStmt q)
  | TM2.Stmt.pop k f q => TM2.Stmt.pop (Sum.inl k) (fun v o => (f v.1 o, v.2)) (liftStmt q)
  | TM2.Stmt.load f q => TM2.Stmt.load (fun v => (f v.1, v.2)) (liftStmt q)
  | TM2.Stmt.branch f q₁ q₂ => TM2.Stmt.branch (fun v => f v.1) (liftStmt q₁) (liftStmt q₂)
  | TM2.Stmt.goto f => TM2.Stmt.goto (fun v => Sum.inl (f v.1))
  | TM2.Stmt.halt => TM2.Stmt.halt

/-- What loop A writes in the register for a popped input symbol. -/
def tagA : Option PairSym → Reg
  | some (PairSym.bit b) => some (Sum.inl b)
  | some PairSym.sep => some (Sum.inr false)
  | none => none

/-- What loop B writes in the register for a popped input symbol. -/
def tagB : Option PairSym → Reg
  | some (PairSym.bit b) => some (Sum.inr b)
  | some PairSym.sep => none
  | none => none

/-- In loop A a right tag in the register means: the separator was popped. -/
def isSepTag : Reg → Bool
  | some (Sum.inr _) => true
  | some (Sum.inl _) => false
  | none => false

/-- The prelude. A: move the bits before the separator to the temporary stack, tagged left.
B: the same after the separator, tagged right. C: move the temporary stack onto the old input
stack (restoring the order), then jump to the old `main` with the register empty. -/
def preStmt (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ) :
    PL → TM2.Stmt (Γx Γ) (Λ ⊕ PL) (σ × Reg)
  | PL.A => TM2.Stmt.pop (Sum.inr true) (fun v o => (v.1, tagA o))
      (TM2.Stmt.branch (fun v => v.2.isSome)
        (TM2.Stmt.branch (fun v => isSepTag v.2)
          (TM2.Stmt.goto fun _ => Sum.inr PL.B)
          (TM2.Stmt.push (Sum.inr false) (fun v => (v.2.getD (Sum.inl false) : Bool ⊕ Bool))
            (TM2.Stmt.goto fun _ => Sum.inr PL.A)))
        (TM2.Stmt.goto fun _ => Sum.inr PL.C))
  | PL.B => TM2.Stmt.pop (Sum.inr true) (fun v o => (v.1, tagB o))
      (TM2.Stmt.branch (fun v => v.2.isSome)
        (TM2.Stmt.push (Sum.inr false) (fun v => (v.2.getD (Sum.inl false) : Bool ⊕ Bool))
          (TM2.Stmt.goto fun _ => Sum.inr PL.B))
        (TM2.Stmt.goto fun _ => Sum.inr PL.C))
  | PL.C => TM2.Stmt.pop (Sum.inr false) (fun v o => (v.1, (o : Option (Bool ⊕ Bool))))
      (TM2.Stmt.branch (fun v => v.2.isSome)
        (TM2.Stmt.push (Sum.inl k₀) (fun v => enc (v.2.getD (Sum.inl false)))
          (TM2.Stmt.goto fun _ => Sum.inr PL.C))
        (TM2.Stmt.goto fun _ => Sum.inl main))

/-- The program of the new machine. -/
def mP (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ) :
    Λ ⊕ PL → TM2.Stmt (Γx Γ) (Λ ⊕ PL) (σ × Reg)
  | Sum.inl l => liftStmt (m l)
  | Sum.inr p => preStmt k₀ enc main p

/-- A configuration of the old machine, as one of the new machine (new stacks empty,
register empty). -/
def liftCfg (c : TM2.Cfg Γ Λ σ) : TM2.Cfg (Γx Γ) (Λ ⊕ PL) (σ × Reg) :=
  ⟨c.l.map Sum.inl, (c.var, none), mkS c.stk [] []⟩

variable [DecidableEq K]

theorem update_mkS_inl (S : ∀ k, List (Γ k)) (inp : List PairSym) (tmp : List (Bool ⊕ Bool))
    (k : K) (x : List (Γ k)) :
    Function.update (mkS S inp tmp) (Sum.inl k) x = mkS (Function.update S k x) inp tmp := by
  funext k'
  rcases k' with j | (_ | _)
  · by_cases h : j = k
    · subst h
      exact (Function.update_self (β := fun k' => List (Γx Γ k')) (Sum.inl j) x
        (mkS S inp tmp)).trans (Function.update_self j x S).symm
    · have e1 : Function.update (mkS S inp tmp) (Sum.inl k) x (Sum.inl j) =
          mkS S inp tmp (Sum.inl j) :=
        Function.update_of_ne (β := fun k' => List (Γx Γ k'))
          (fun h' => h (Sum.inl.inj h')) x (mkS S inp tmp)
      have e2 : Function.update S k x j = S j := Function.update_of_ne h x S
      exact e1.trans e2.symm
  · exact Function.update_of_ne (β := fun k' => List (Γx Γ k')) Sum.inr_ne_inl x (mkS S inp tmp)
  · exact Function.update_of_ne (β := fun k' => List (Γx Γ k')) Sum.inr_ne_inl x (mkS S inp tmp)

theorem update_mkS_inp (S : ∀ k, List (Γ k)) (inp : List PairSym) (tmp : List (Bool ⊕ Bool))
    (x : List (Γx Γ (Sum.inr true))) :
    Function.update (mkS S inp tmp) (Sum.inr true) x = mkS S x tmp := by
  funext k'
  rcases k' with j | (_ | _)
  · rw [Function.update_of_ne Sum.inl_ne_inr]
    rfl
  · rw [Function.update_of_ne (by simp)]
    rfl
  · rw [Function.update_self]
    rfl

theorem update_mkS_tmp (S : ∀ k, List (Γ k)) (inp : List PairSym) (tmp : List (Bool ⊕ Bool))
    (x : List (Γx Γ (Sum.inr false))) :
    Function.update (mkS S inp tmp) (Sum.inr false) x = mkS S inp x := by
  funext k'
  rcases k' with j | (_ | _)
  · rw [Function.update_of_ne Sum.inl_ne_inr]
    rfl
  · rw [Function.update_self]
    rfl
  · rw [Function.update_of_ne (by simp)]
    rfl

/-- The simulation lemma: a lifted statement acts on the old part exactly as the old statement
does, and leaves the register and the two new stacks alone. -/
theorem stepAux_lift (r : Reg) (inp : List PairSym) (tmp : List (Bool ⊕ Bool))
    (q : TM2.Stmt Γ Λ σ) (v : σ) (S : ∀ k, List (Γ k)) :
    TM2.stepAux (liftStmt q) (v, r) (mkS S inp tmp) =
      (⟨(TM2.stepAux q v S).l.map Sum.inl, ((TM2.stepAux q v S).var, r),
        mkS (TM2.stepAux q v S).stk inp tmp⟩ : TM2.Cfg (Γx Γ) (Λ ⊕ PL) (σ × Reg)) := by
  induction q generalizing v S with
  | push k f q ih =>
    exact (congrArg (TM2.stepAux (liftStmt q) (v, r))
      (update_mkS_inl S inp tmp k (f v :: S k))).trans (ih v _)
  | peek k f q ih =>
    show TM2.stepAux (liftStmt q) (f v (S k).head?, r) (mkS S inp tmp) = _
    exact ih _ _
  | pop k f q ih =>
    exact (congrArg (TM2.stepAux (liftStmt q) (f v (S k).head?, r))
      (update_mkS_inl S inp tmp k (S k).tail)).trans (ih _ _)
  | load f q ih =>
    show TM2.stepAux (liftStmt q) (f v, r) (mkS S inp tmp) = _
    exact ih _ _
  | branch f q₁ q₂ ih₁ ih₂ =>
    have e : TM2.stepAux (TM2.Stmt.branch f q₁ q₂) v S =
        cond (f v) (TM2.stepAux q₁ v S) (TM2.stepAux q₂ v S) := rfl
    rw [e]
    show cond (f v) (TM2.stepAux (liftStmt q₁) (v, r) (mkS S inp tmp))
      (TM2.stepAux (liftStmt q₂) (v, r) (mkS S inp tmp)) = _
    cases f v
    · exact ih₂ v S
    · exact ih₁ v S
  | goto f => rfl
  | halt => rfl

theorem step_lift (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (c : TM2.Cfg Γ Λ σ) :
    TM2.step (mP m k₀ enc main) (liftCfg c) = (TM2.step m c).map liftCfg := by
  rcases c with ⟨_ | l, v, S⟩
  · rfl
  · show some (TM2.stepAux (liftStmt (m l)) (v, none) (mkS S [] [])) =
      some (liftCfg (TM2.stepAux (m l) v S))
    rw [stepAux_lift]
    rfl

theorem iterate_lift (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (n : ℕ) : ∀ o : Option (TM2.Cfg Γ Λ σ),
    (flip bind (TM2.step (mP m k₀ enc main)))^[n] (o.map liftCfg) =
      ((flip bind (TM2.step m))^[n] o).map liftCfg := by
  induction n with
  | zero => intro o; rfl
  | succ n ih =>
    intro o
    rw [Function.iterate_succ_apply, Function.iterate_succ_apply]
    have e : flip bind (TM2.step (mP m k₀ enc main)) (o.map liftCfg) =
        (flip bind (TM2.step m) o).map liftCfg := by
      rcases o with _ | c
      · rfl
      · exact step_lift m k₀ enc main c
    rw [e]
    exact ih _

/-- A run of the old machine is a run of the new one on lifted configurations, step for step. -/
theorem lifted_run (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (n : ℕ) (c d : TM2.Cfg Γ Λ σ)
    (h : (flip bind (TM2.step m))^[n] (some c) = some d) :
    Run (TM2.step (mP m k₀ enc main)) n (liftCfg c) (liftCfg d) := by
  have h' := iterate_lift m k₀ enc main n (some c)
  rw [h] at h'
  exact h'

/-! ### One step of each prelude label -/

theorem stepA_bit (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (r : Reg) (S : ∀ k, List (Γ k)) (b : Bool) (inp : List PairSym)
    (tmp : List (Bool ⊕ Bool)) :
    TM2.step (mP m k₀ enc main)
        ⟨some (Sum.inr PL.A), (v, r), mkS S (PairSym.bit b :: inp) tmp⟩ =
      some ⟨some (Sum.inr PL.A), (v, some (Sum.inl b)), mkS S inp (Sum.inl b :: tmp)⟩ := by
  simp [TM2.step, TM2.stepAux, mP, preStmt, tagA, isSepTag, update_mkS_inp, update_mkS_tmp]

theorem stepA_sep (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (r : Reg) (S : ∀ k, List (Γ k)) (inp : List PairSym)
    (tmp : List (Bool ⊕ Bool)) :
    TM2.step (mP m k₀ enc main)
        ⟨some (Sum.inr PL.A), (v, r), mkS S (PairSym.sep :: inp) tmp⟩ =
      some ⟨some (Sum.inr PL.B), (v, some (Sum.inr false)), mkS S inp tmp⟩ := by
  simp [TM2.step, TM2.stepAux, mP, preStmt, tagA, isSepTag, update_mkS_inp, update_mkS_tmp]

theorem stepB_bit (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (r : Reg) (S : ∀ k, List (Γ k)) (b : Bool) (inp : List PairSym)
    (tmp : List (Bool ⊕ Bool)) :
    TM2.step (mP m k₀ enc main)
        ⟨some (Sum.inr PL.B), (v, r), mkS S (PairSym.bit b :: inp) tmp⟩ =
      some ⟨some (Sum.inr PL.B), (v, some (Sum.inr b)), mkS S inp (Sum.inr b :: tmp)⟩ := by
  simp [TM2.step, TM2.stepAux, mP, preStmt, tagB, update_mkS_inp, update_mkS_tmp]

theorem stepB_nil (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (r : Reg) (S : ∀ k, List (Γ k)) (tmp : List (Bool ⊕ Bool)) :
    TM2.step (mP m k₀ enc main) ⟨some (Sum.inr PL.B), (v, r), mkS S [] tmp⟩ =
      some ⟨some (Sum.inr PL.C), (v, none), mkS S [] tmp⟩ := by
  simp [TM2.step, TM2.stepAux, mP, preStmt, tagB, update_mkS_inp, update_mkS_tmp]

theorem stepC_cons (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (r : Reg) (S : ∀ k, List (Γ k)) (x : Bool ⊕ Bool) (t : List (Bool ⊕ Bool)) :
    TM2.step (mP m k₀ enc main) ⟨some (Sum.inr PL.C), (v, r), mkS S [] (x :: t)⟩ =
      some ⟨some (Sum.inr PL.C), (v, some x),
        mkS (Function.update S k₀ (enc x :: S k₀)) [] t⟩ := by
  simp [TM2.step, TM2.stepAux, mP, preStmt, update_mkS_tmp, update_mkS_inl]

theorem stepC_nil (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (r : Reg) (S : ∀ k, List (Γ k)) :
    TM2.step (mP m k₀ enc main) ⟨some (Sum.inr PL.C), (v, r), mkS S [] []⟩ =
      some ⟨some (Sum.inl main), (v, none), mkS S [] []⟩ := by
  simp [TM2.step, TM2.stepAux, mP, preStmt, update_mkS_tmp, update_mkS_inl]

/-! ### The three prelude loops -/

theorem loopA (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (S : ∀ k, List (Γ k)) (rest : List PairSym) (as : List Bool) :
    ∀ (r : Reg) (tmp : List (Bool ⊕ Bool)),
      Run (TM2.step (mP m k₀ enc main)) (as.length + 1)
        ⟨some (Sum.inr PL.A), (v, r), mkS S (as.map PairSym.bit ++ PairSym.sep :: rest) tmp⟩
        ⟨some (Sum.inr PL.B), (v, some (Sum.inr false)),
          mkS S rest ((as.map Sum.inl).reverse ++ tmp)⟩ := by
  induction as with
  | nil =>
    intro r tmp
    exact Run.head (stepA_sep m k₀ enc main v r S rest tmp) (Run.refl _ _)
  | cons b as ih =>
    intro r tmp
    have h := ih (some (Sum.inl b)) (Sum.inl b :: tmp)
    have e : ((b :: as).map Sum.inl).reverse ++ tmp =
        (as.map Sum.inl).reverse ++ (Sum.inl b :: tmp) := by simp
    rw [e]
    exact Run.head
      (stepA_bit m k₀ enc main v r S b (as.map PairSym.bit ++ PairSym.sep :: rest) tmp) h

theorem loopB (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (S : ∀ k, List (Γ k)) (bs : List Bool) :
    ∀ (r : Reg) (tmp : List (Bool ⊕ Bool)),
      Run (TM2.step (mP m k₀ enc main)) (bs.length + 1)
        ⟨some (Sum.inr PL.B), (v, r), mkS S (bs.map PairSym.bit) tmp⟩
        ⟨some (Sum.inr PL.C), (v, none), mkS S [] ((bs.map Sum.inr).reverse ++ tmp)⟩ := by
  induction bs with
  | nil =>
    intro r tmp
    exact Run.head (stepB_nil m k₀ enc main v r S tmp) (Run.refl _ _)
  | cons b bs ih =>
    intro r tmp
    have h := ih (some (Sum.inr b)) (Sum.inr b :: tmp)
    have e : ((b :: bs).map Sum.inr).reverse ++ tmp =
        (bs.map Sum.inr).reverse ++ (Sum.inr b :: tmp) := by simp
    rw [e]
    exact Run.head (stepB_bit m k₀ enc main v r S b (bs.map PairSym.bit) tmp) h

theorem loopC (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (t : List (Bool ⊕ Bool)) :
    ∀ (r : Reg) (S : ∀ k, List (Γ k)),
      Run (TM2.step (mP m k₀ enc main)) (t.length + 1)
        ⟨some (Sum.inr PL.C), (v, r), mkS S [] t⟩
        ⟨some (Sum.inl main), (v, none),
          mkS (Function.update S k₀ ((t.map enc).reverse ++ S k₀)) [] []⟩ := by
  induction t with
  | nil =>
    intro r S
    have e : Function.update S k₀ ((([] : List (Bool ⊕ Bool)).map enc).reverse ++ S k₀) = S := by
      simp
    rw [e]
    exact Run.head (stepC_nil m k₀ enc main v r S) (Run.refl _ _)
  | cons x t ih =>
    intro r S
    have h := ih (some x) (Function.update S k₀ (enc x :: S k₀))
    have e : Function.update (Function.update S k₀ (enc x :: S k₀)) k₀
        ((t.map enc).reverse ++ Function.update S k₀ (enc x :: S k₀) k₀) =
        Function.update S k₀ (((x :: t).map enc).reverse ++ S k₀) := by
      simp
    rw [e] at h
    exact Run.head (stepC_cons m k₀ enc main v r S x t) h

/-- The whole prelude: from the separated word on the new input stack to the tagged word on the
old input stack, in `2 * (|a| + |b|) + 3` steps. -/
theorem prelude_run (m : Λ → TM2.Stmt Γ Λ σ) (k₀ : K) (enc : Bool ⊕ Bool → Γ k₀) (main : Λ)
    (v : σ) (as bs : List Bool) :
    Run (TM2.step (mP m k₀ enc main)) (2 * (as.length + bs.length) + 3)
      ⟨some (Sum.inr PL.A), (v, none),
        mkS (fun _ => []) (as.map PairSym.bit ++ PairSym.sep :: bs.map PairSym.bit) []⟩
      ⟨some (Sum.inl main), (v, none),
        mkS (Function.update (fun _ => []) k₀ ((as.map Sum.inl ++ bs.map Sum.inr).map enc))
          [] []⟩ := by
  have hA := loopA m k₀ enc main v (fun _ => []) (bs.map PairSym.bit) as none []
  have hB := loopB m k₀ enc main v (fun _ => []) bs (some (Sum.inr false))
    ((as.map Sum.inl).reverse ++ [])
  have hC := loopC m k₀ enc main v
    ((bs.map Sum.inr).reverse ++ ((as.map Sum.inl).reverse ++ [])) none (fun _ => [])
  have e : (List.map enc ((bs.map Sum.inr).reverse ++ ((as.map Sum.inl).reverse ++ []))).reverse
      ++ ([] : List (Γ k₀)) = (as.map Sum.inl ++ bs.map Sum.inr).map enc := by
    simp
  exact ((hA.trans hB).trans hC).congr (by simp; omega)
    (congrArg (fun L => (⟨some (Sum.inl main), (v, none),
      mkS (Function.update (fun _ => []) k₀ L) [] []⟩ :
        TM2.Cfg (Γx Γ) (Λ ⊕ PL) (σ × Reg))) e)

end Construction

/-! ## The bundled machine -/

section Bundled
open Turing

theorem initList_stk_self (tm : FinTM2) (s : List (tm.Γ tm.k₀)) :
    TM2.Cfg.stk (initList tm s) tm.k₀ = s := by
  unfold initList
  exact dif_pos rfl

theorem initList_stk_ne (tm : FinTM2) (s : List (tm.Γ tm.k₀)) (k : tm.K) (h : k ≠ tm.k₀) :
    TM2.Cfg.stk (initList tm s) k = [] := by
  unfold initList
  exact dif_neg h

theorem haltList_stk_self (tm : FinTM2) (s : List (tm.Γ tm.k₁)) :
    TM2.Cfg.stk (haltList tm s) tm.k₁ = s := by
  unfold haltList
  exact dif_pos rfl

theorem haltList_stk_ne (tm : FinTM2) (s : List (tm.Γ tm.k₁)) (k : tm.K) (h : k ≠ tm.k₁) :
    TM2.Cfg.stk (haltList tm s) k = [] := by
  unfold haltList
  exact dif_neg h

/-- The new machine: the prelude, then the old program. -/
def tmx (tm : FinTM2) (enc : Bool ⊕ Bool → tm.Γ tm.k₀) : FinTM2 where
  K := tm.K ⊕ Bool
  kDecidableEq := inferInstance
  kFin := by
    letI := tm.kFin
    exact inferInstance
  k₀ := Sum.inr true
  k₁ := Sum.inl tm.k₁
  Γ := Γx tm.Γ
  Λ := tm.Λ ⊕ PL
  main := Sum.inr PL.A
  ΛFin := by
    letI := tm.ΛFin
    exact inferInstance
  σ := tm.σ × Reg
  initialState := (tm.initialState, none)
  σFin := by
    letI := tm.σFin
    exact inferInstance
  Γk₀Fin := (inferInstance : Fintype PairSym)
  m := mP tm.m tm.k₀ enc tm.main

theorem initList_tmx (tm : FinTM2) (enc : Bool ⊕ Bool → tm.Γ tm.k₀) (s : List PairSym) :
    initList (tmx tm enc) s =
      (⟨some (Sum.inr PL.A), (tm.initialState, none), mkS (fun _ => []) s []⟩ :
        TM2.Cfg (Γx tm.Γ) (tm.Λ ⊕ PL) (tm.σ × Reg)) := by
  refine cfg_eq _ _ _ _ rfl rfl (fun k => ?_)
  rcases k with k | (_ | _)
  · exact initList_stk_ne (tmx tm enc) s (Sum.inl k) Sum.inl_ne_inr
  · exact initList_stk_ne (tmx tm enc) s (Sum.inr false)
      (show (Sum.inr false : tm.K ⊕ Bool) ≠ Sum.inr true by simp)
  · exact initList_stk_self (tmx tm enc) s

theorem haltList_tmx (tm : FinTM2) (enc : Bool ⊕ Bool → tm.Γ tm.k₀) (s : List (tm.Γ tm.k₁)) :
    haltList (tmx tm enc) s = liftCfg (haltList tm s) := by
  refine cfg_eq _ _ _ _ rfl rfl (fun k => ?_)
  rcases k with k | (_ | _)
  · by_cases h : k = tm.k₁
    · subst h
      exact (haltList_stk_self (tmx tm enc) s).trans (haltList_stk_self tm s).symm
    · exact (haltList_stk_ne (tmx tm enc) s (Sum.inl k) (fun h' => h (Sum.inl.inj h'))).trans
        (haltList_stk_ne tm s k h).symm
  · exact haltList_stk_ne (tmx tm enc) s (Sum.inr false) Sum.inr_ne_inl
  · exact haltList_stk_ne (tmx tm enc) s (Sum.inr true) Sum.inr_ne_inl

theorem liftCfg_initList (tm : FinTM2) (s : List (tm.Γ tm.k₀)) :
    liftCfg (initList tm s) =
      (⟨some (Sum.inl tm.main), (tm.initialState, none),
        mkS (Function.update (fun _ => []) tm.k₀ s) [] []⟩ :
        TM2.Cfg (Γx tm.Γ) (tm.Λ ⊕ PL) (tm.σ × Reg)) := by
  refine cfg_eq _ _ _ _ rfl rfl (fun k => ?_)
  rcases k with k | (_ | _)
  · show TM2.Cfg.stk (initList tm s) k = Function.update (fun _ => []) tm.k₀ s k
    by_cases h : k = tm.k₀
    · subst h
      rw [Function.update_self]
      exact initList_stk_self tm s
    · rw [Function.update_of_ne h]
      exact initList_stk_ne tm s k h
  · rfl
  · rfl

theorem length_pairEnc (a : ℕ × ℕ) :
    (pairEnc a).length = (encodeNat a.1).length + (encodeNat a.2).length := by
  show ((encodeNat a.1).map Sum.inl ++ (encodeNat a.2).map Sum.inr).length = _
  simp

theorem length_encodeNatPair (a : ℕ × ℕ) :
    (encodeNatPair a).length = (encodeNat a.1).length + (encodeNat a.2).length + 1 := by
  simp [encodeNatPair]; omega

/-- The new machine outputs `f a` from the separated encoding of `a`, in the old machine's time
plus the prelude's `2 * |input| + 3` steps. -/
noncomputable def outputsMain {β Γβ : Type} (eb : β → List Γβ) (f : ℕ × ℕ → β)
    (M : Turing.TM2ComputableInTime pairEnc eb f) (a : ℕ × ℕ) :
    Turing.TM2OutputsInTime (tmx M.tm M.inputAlphabet.invFun)
      (List.map (Equiv.refl PairSym).invFun (encodeNatPair a))
      (some (List.map M.outputAlphabet.invFun (eb (f a))))
      (M.time ((encodeNatPair a).length - 1) + 2 * ((encodeNatPair a).length + 1)) := by
  have hM : StateTransition.EvalsToInTime (TM2.step M.tm.m)
      (initList M.tm (List.map M.inputAlphabet.invFun (pairEnc a)))
      (some (haltList M.tm (List.map M.outputAlphabet.invFun (eb (f a)))))
      (M.time (pairEnc a).length) := M.outputsFun a
  have hpre := prelude_run M.tm.m M.tm.k₀ M.inputAlphabet.invFun M.tm.main M.tm.initialState
    (encodeNat a.1) (encodeNat a.2)
  have hpre' : Run (TM2.step (mP M.tm.m M.tm.k₀ M.inputAlphabet.invFun M.tm.main))
      (2 * ((encodeNat a.1).length + (encodeNat a.2).length) + 3)
      (⟨some (Sum.inr PL.A), (M.tm.initialState, none), mkS (fun _ => []) (encodeNatPair a) []⟩ :
        TM2.Cfg (Γx M.tm.Γ) (M.tm.Λ ⊕ PL) (M.tm.σ × Reg))
      (liftCfg (initList M.tm (List.map M.inputAlphabet.invFun (pairEnc a)))) := by
    rw [liftCfg_initList]
    exact hpre
  have hrun : Run (TM2.step (mP M.tm.m M.tm.k₀ M.inputAlphabet.invFun M.tm.main)) hM.steps
      (liftCfg (initList M.tm (List.map M.inputAlphabet.invFun (pairEnc a))))
      (liftCfg (haltList M.tm (List.map M.outputAlphabet.invFun (eb (f a))))) :=
    lifted_run _ _ _ _ _ _ _ hM.evals_in_steps
  have e0 : List.map (Equiv.refl PairSym).invFun (encodeNatPair a) = encodeNatPair a :=
    List.map_id _
  have e1 : initList (tmx M.tm M.inputAlphabet.invFun)
      (List.map (Equiv.refl PairSym).invFun (encodeNatPair a)) =
      (⟨some (Sum.inr PL.A), (M.tm.initialState, none), mkS (fun _ => []) (encodeNatPair a) []⟩ :
        TM2.Cfg (Γx M.tm.Γ) (M.tm.Λ ⊕ PL) (M.tm.σ × Reg)) :=
    (congrArg (initList (tmx M.tm M.inputAlphabet.invFun)) e0).trans
      (initList_tmx M.tm M.inputAlphabet.invFun (encodeNatPair a))
  have e2 := haltList_tmx M.tm M.inputAlphabet.invFun
    (List.map M.outputAlphabet.invFun (eb (f a)))
  have key : Run (TM2.step (mP M.tm.m M.tm.k₀ M.inputAlphabet.invFun M.tm.main))
      (hM.steps + (2 * ((encodeNat a.1).length + (encodeNat a.2).length) + 3))
      (initList (tmx M.tm M.inputAlphabet.invFun)
        (List.map (Equiv.refl PairSym).invFun (encodeNatPair a)))
      (haltList (tmx M.tm M.inputAlphabet.invFun)
        (List.map M.outputAlphabet.invFun (eb (f a)))) :=
    ((hpre'.trans hrun).congr rfl e2.symm).congr_left e1
  have hle : hM.steps + (2 * ((encodeNat a.1).length + (encodeNat a.2).length) + 3) ≤
      M.time ((encodeNatPair a).length - 1) + 2 * ((encodeNatPair a).length + 1) := by
    have h3 : hM.steps ≤ M.time (pairEnc a).length := hM.steps_le_m
    have h4 : M.time (pairEnc a).length =
        M.time ((encodeNat a.1).length + (encodeNat a.2).length) :=
      congrArg M.time (length_pairEnc a)
    rw [length_encodeNatPair, Nat.add_sub_cancel]
    omega
  unfold Turing.TM2OutputsInTime
  exact
    { steps := hM.steps + (2 * ((encodeNat a.1).length + (encodeNat a.2).length) + 3)
      evals_in_steps := key
      steps_le_m := hle }

end Bundled

/-- A machine for the tagged encoding gives one for the separated encoding, at linear extra cost. -/
theorem reencode {β Γβ : Type} (eb : β → List Γβ) (f : ℕ × ℕ → β)
    (M : Turing.TM2ComputableInTime pairEnc eb f) (hfin : ∀ k, Finite (M.tm.Γ k)) :
    ∃ M' : Turing.TM2ComputableInTime encodeNatPair eb f,
      (∀ k, Finite (M'.tm.Γ k)) ∧ ∃ c : ℕ, ∀ L, M'.time (L + 1) ≤ M.time L + c * (L + 2) := by
  refine ⟨{ tm := tmx M.tm M.inputAlphabet.invFun
            inputAlphabet := Equiv.refl PairSym
            outputAlphabet := M.outputAlphabet
            time := fun L => M.time (L - 1) + 2 * (L + 1)
            outputsFun := fun a => outputsMain eb f M a }, ?_, 2, fun L => ?_⟩
  · intro k
    rcases k with k | (_ | _)
    · exact hfin k
    · exact (inferInstance : Finite (Bool ⊕ Bool))
    · exact (inferInstance : Finite PairSym)
  · show M.time (L + 1 - 1) + 2 * (L + 1 + 1) ≤ M.time L + 2 * (L + 2)
    rw [Nat.add_sub_cancel]

/-- The time bound survives the re-encoding. -/
theorem bigO_shift (t t' : ℕ → ℕ) (κ : ℝ) (hκ : κ ≤ 1) (c : ℕ)
    (h : ∀ L, t' (L + 1) ≤ t L + c * (L + 2))
    (ht : (fun n : ℕ => (t n : ℝ)) =O[Filter.atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - κ)) :
    (fun n : ℕ => (t' n : ℝ)) =O[Filter.atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - κ) := by
  obtain ⟨C, hC, hb⟩ := ht.exists_pos
  obtain ⟨N, hN⟩ := Filter.eventually_atTop.mp hb.bound
  have he : 0 ≤ 1 - κ := by linarith
  refine Asymptotics.IsBigO.of_bound (C + 2 * c) ?_
  filter_upwards [Filter.eventually_ge_atTop (max (N + 1) 3)] with n hn
  have hn1 : N + 1 ≤ n := le_trans (le_max_left _ _) hn
  have hn3 : 3 ≤ n := le_trans (le_max_right _ _) hn
  obtain ⟨L, rfl⟩ : ∃ L, n = L + 1 := ⟨n - 1, by omega⟩
  have hLN : N ≤ L := by omega
  have hb' := hN L hLN
  have hL1r : (1 : ℝ) ≤ (L : ℝ) := by exact_mod_cast (by omega : 1 ≤ L)
  have hLpos : (0 : ℝ) < (L : ℝ) := by linarith
  have hcast : ((L + 1 : ℕ) : ℝ) = (L : ℝ) + 1 := by push_cast; ring
  have hlogL : 0 ≤ Real.log (L : ℝ) := Real.log_nonneg hL1r
  have hlog_le : Real.log (L : ℝ) ≤ Real.log ((L + 1 : ℕ) : ℝ) :=
    Real.log_le_log hLpos (by rw [hcast]; linarith)
  have h3 : (3 : ℝ) ≤ ((L + 1 : ℕ) : ℝ) := by exact_mod_cast hn3
  have hlog1 : 1 ≤ Real.log ((L + 1 : ℕ) : ℝ) := by
    rw [Real.le_log_iff_exp_le (by linarith)]
    have h4 : Real.exp 1 < 3 := lt_trans Real.exp_one_lt_d9 (by norm_num)
    linarith
  have hpowL : 0 ≤ Real.log (L : ℝ) ^ (1 - κ) := Real.rpow_nonneg hlogL _
  have hpow_le : Real.log (L : ℝ) ^ (1 - κ) ≤ Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ) :=
    Real.rpow_le_rpow hlogL hlog_le he
  have hpow1 : 1 ≤ Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ) := Real.one_le_rpow hlog1 he
  have hG0 : 0 ≤ ((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ) :=
    mul_nonneg (Nat.cast_nonneg _) (le_trans zero_le_one hpow1)
  rw [Real.norm_of_nonneg (Nat.cast_nonneg _),
    Real.norm_of_nonneg (mul_nonneg (Nat.cast_nonneg _) hpowL)] at hb'
  rw [Real.norm_of_nonneg (Nat.cast_nonneg _), Real.norm_of_nonneg hG0]
  have h1 : (t' (L + 1) : ℝ) ≤ (t L : ℝ) + (c : ℝ) * ((L : ℝ) + 2) := by
    exact_mod_cast h L
  have hg : (L : ℝ) * Real.log (L : ℝ) ^ (1 - κ) ≤
      ((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ) :=
    mul_le_mul (by rw [hcast]; linarith) hpow_le hpowL (Nat.cast_nonneg _)
  have hc : (0 : ℝ) ≤ (c : ℝ) := Nat.cast_nonneg _
  have h2 : (L : ℝ) + 2 ≤ 2 * ((L + 1 : ℕ) : ℝ) := by rw [hcast]; linarith
  have h5 : ((L + 1 : ℕ) : ℝ) ≤
      ((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ) :=
    le_mul_of_one_le_right (Nat.cast_nonneg _) hpow1
  have hlin : (c : ℝ) * ((L : ℝ) + 2) ≤
      2 * (c : ℝ) * (((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ)) := by
    have h6 : (c : ℝ) * ((L : ℝ) + 2) ≤ (c : ℝ) * (2 * ((L + 1 : ℕ) : ℝ)) :=
      mul_le_mul_of_nonneg_left h2 hc
    have h7 : (c : ℝ) * (2 * ((L + 1 : ℕ) : ℝ)) ≤
        (c : ℝ) * (2 * (((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ))) :=
      mul_le_mul_of_nonneg_left (mul_le_mul_of_nonneg_left h5 (by norm_num)) hc
    linarith
  have h8 : C * ((L : ℝ) * Real.log (L : ℝ) ^ (1 - κ)) ≤
      C * (((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ)) :=
    mul_le_mul_of_nonneg_left hg hC.le
  have h9 : (C + 2 * (c : ℝ)) * (((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ)) =
      C * (((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ)) +
      2 * (c : ℝ) * (((L + 1 : ℕ) : ℝ) * Real.log ((L + 1 : ℕ) : ℝ) ^ (1 - κ)) := by ring
  rw [h9]
  linarith

end IntMulEnc

#print axioms IntMulEnc.reencode
#print axioms IntMulEnc.bigO_shift
