/-
The bridge: OpenAI's formal claim (`Bridge.OpenAIStatement`, their comparator statement verbatim as a
proposition) implies Anthropic's formal `MainResults.ETHIsFalse`. The route reuses Anthropic's machine
layer: a `Groundwork.Stepped` computation with `IsPolyT` init/step/out compiles to one of Mathlib's
FinTM2 machines by `Groundwork.exists_tm`, with polynomial overhead per step; a machine that decides
3-SAT within c·2^{δn} steps for every δ gives `Sat3.SubexpTM`, and `WidthThree.ethFails_of_subexpTM`
turns that into `¬ Sat3.ETH_TM`, which is `MainResults.ETHIsFalse` by unfolding.

Each `sorry` below is one of the four lemmas named in the plan: (1) analysis, (2) encoding length,
(3) the front end, (4) OpenAI's primitive machine as a stepped computation with polynomial-time
init/step/out and states bounded by its visited space.
-/
import MainResults
import ThreeSatRateStatement
import WidthThree.Rates
import ToTuring.Machine.Host
import ToTuring.Closure.Basic
import ToTuring.Closure.Cases
import ToTuring.Closure.Fold
import ToTuring.Lib.Bool
import ToTuring.Lib.Nat1
import ToTuring.Lib.Nat1b
import ToTuring.Lib.Nat2
import ToTuring.Lib.Int
import ToTuring.Lib.List1
import ToTuring.Lib.List1b
import ToTuring.Lib.List2
import ToTuring.Lib.List3
import ToTuring.Lib.Table
import ToTuring.Lib.Unary
import Bridge.OpenAIStatement
import Bridge.BitLength
import Bridge.FrontEnd

open OAI.Algorithms.SubexponentialSAT Turing Groundwork
open scoped NNReal

namespace Bridge


/-! ## 0. The target, and the step that is already theirs -/

/-- `¬ Sat3.ETH_TM` is `MainResults.ETHIsFalse` by unfolding (the same check `Solution.lean` relies on). -/
theorem ethIsFalse_of_subexpTM (h : Sat3.SubexpTM) : MainResults.ETHIsFalse :=
  WidthThree.ethFails_of_subexpTM h

/-! ## 1. Analysis: OpenAI's exponent is o(n). -/

/-- `runtimeScale n = n (ln ln (n+16))² / √(ln (n+16))` is eventually below `δ n` for every δ > 0. -/
theorem runtimeScale_sublinear (δ : ℝ) (hδ : 0 < δ) :
    ∃ N : ℕ, ∀ n : ℕ, N ≤ n → SqrtLog.Statement.runtimeScale n ≤ δ * n := by
  -- (log y)² / √y → 0 as y → ∞, since log = o(y^{1/4}).
  have hlo : (fun y : ℝ => Real.log y ^ 2) =o[Filter.atTop] (fun y : ℝ => Real.sqrt y) := by
    have h := isLittleO_log_rpow_rpow_atTop (2 : ℝ) (by norm_num : (0 : ℝ) < 1 / 2)
    refine h.congr' ?_ ?_
    · filter_upwards with y; exact Real.rpow_two _
    · filter_upwards with y; exact (Real.sqrt_eq_rpow y).symm
  have h1 : Filter.Tendsto (fun y : ℝ => Real.log y ^ 2 / Real.sqrt y) Filter.atTop (nhds 0) :=
    hlo.tendsto_div_nhds_zero
  -- log (n + 16) → ∞.
  have h2 : Filter.Tendsto (fun n : ℕ => Real.log ((n : ℝ) + 16)) Filter.atTop Filter.atTop :=
    Real.tendsto_log_atTop.comp (tendsto_natCast_atTop_atTop.atTop_add tendsto_const_nhds)
  have h3 := (h1.comp h2).eventually (gt_mem_nhds hδ)
  obtain ⟨N, hN⟩ := Filter.eventually_atTop.1 h3
  refine ⟨N, fun n hn => ?_⟩
  have hlt : Real.log (Real.log ((n : ℝ) + 16)) ^ 2 / Real.sqrt (Real.log ((n : ℝ) + 16)) < δ := hN n hn
  unfold SqrtLog.Statement.runtimeScale
  rw [mul_div_assoc, mul_comm δ]
  exact mul_le_mul_of_nonneg_left hlt.le (Nat.cast_nonneg n)

/-! ## 2. The OpenAI input word has length polynomial in n for width-k formulas. -/

theorem formulaBitLength_poly' (k : ℕ) :
    ∃ c : ℕ, ∀ (n : ℕ) (F : SAT.CNF (Fin n)), SAT.WidthAtMost k F →
      Encoding.formulaBitLength F ≤ c * (n + 1) ^ (k + 2) :=
  Bridge.formulaBitLength_poly k

/-! ## 3. The front end: Anthropic's plain code ↦ OpenAI's canonical code. -/

/-- Anthropic's list-of-lists CNF as OpenAI's Finset-of-Finsets CNF. -/
def toFinsetCNF {n : ℕ} (φ : Sat3.CNF n) : SAT.CNF (Fin n) :=
  (φ.map fun C => (C.map fun l => (⟨l.1, l.2⟩ : SAT.Literal (Fin n))).toFinset).toFinset

theorem toFinsetCNF_width {n : ℕ} (φ : Sat3.CNF n) (h : Sat3.Is3CNF φ) :
    SAT.WidthAtMost 3 (toFinsetCNF φ) := by
  intro C' hC'
  unfold toFinsetCNF at hC'
  rw [List.mem_toFinset, List.mem_map] at hC'
  obtain ⟨C, hC, rfl⟩ := hC'
  calc (C.map fun l => (⟨l.1, l.2⟩ : SAT.Literal (Fin n))).toFinset.card
      ≤ (C.map fun l => (⟨l.1, l.2⟩ : SAT.Literal (Fin n))).length := List.toFinset_card_le _
    _ = C.length := by simp
    _ ≤ 3 := h.1 C hC

theorem eval_toFinsetCNF_iff {n : ℕ} (φ : Sat3.CNF n) (a : Fin n → Bool) :
    (toFinsetCNF φ).eval a = true ↔ ∀ C ∈ φ, ∃ l ∈ C, a l.1 = l.2 := by
  rw [SAT.CNF.eval, decide_eq_true_iff]
  simp only [SAT.Clause.eval, decide_eq_true_iff, SAT.Literal.eval, beq_iff_eq, toFinsetCNF,
    List.mem_toFinset, List.mem_map, forall_exists_index, and_imp, forall_apply_eq_imp_iff₂]
  constructor
  · intro h C hC
    obtain ⟨_, ⟨l, hl, rfl⟩, e⟩ := h C hC
    exact ⟨l, hl, e⟩
  · intro h C hC
    obtain ⟨l, hl, e⟩ := h C hC
    exact ⟨_, ⟨l, hl, rfl⟩, e⟩

theorem satisfiable_iff_count_pos {n : ℕ} (φ : Sat3.CNF n) :
    Sat3.Satisfiable φ ↔ 0 < SAT.count (toFinsetCNF φ) := by
  unfold SAT.count SAT.satisfyingAssignments Sat3.Satisfiable
  rw [Finset.card_pos, Finset.filter_nonempty_iff]
  simp only [Finset.mem_univ, true_and, eval_toFinsetCNF_iff]

/-- A polynomial-time `pre` that maps every plain code of a 3-CNF to OpenAI's code of the same formula. -/
theorem frontEnd_exists : ∃ pre : List Bool → List Bool, PolyT pre ∧
    ∀ (n : ℕ) (φ : Sat3.CNF n), Sat3.Is3CNF φ → pre (Sat3.enc φ) = Encoding.encodeCNF (toFinsetCNF φ) := by
  obtain ⟨pre, hp, hs⟩ := frontEnd_exists'
  exact ⟨pre, hp, fun n φ h => hs n φ h⟩

/-! ## 4. OpenAI's primitive machine as a stepped computation.

A tape is kept as (cells left of the head, reversed; the head cell; cells to the right), trimmed, so
that its size is bounded by the span of visited cells. The machine state `Bool ⊕ Fin stateCount` is
kept as `Bool ⊕ ℕ`. All of these types have `Enc` and `HasSize` instances in Anthropic's layer. -/

abbrev TapeRep : Type := List (Option Bool) × Option Bool × List (Option Bool)

/-- The configuration representation of a primitive machine: state and one tape per index. -/
abbrev CfgRep : Type := (Bool ⊕ ℕ) × List TapeRep

/-- The tape a representation stands for. -/
def TapeRep.toTape (r : TapeRep) : Tape (Option Bool) :=
  Tape.mk' (ListBlank.mk r.1) (ListBlank.mk (r.2.1 :: r.2.2))

/-- The configuration a representation stands for, when its state index and tape count are in range. -/
def toCfg (P : Computation.PrimitiveMachine) (r : CfgRep) : Option P.Cfg :=
  if h : r.2.length = P.tapeCount then
    match r.1 with
    | .inl b => some ⟨.inl b, fun i => (r.2[i.val]'(by rw [h]; exact i.isLt)).toTape⟩
    | .inr q => if hq : q < P.stateCount then
        some ⟨.inr ⟨q, hq⟩, fun i => (r.2[i.val]'(by rw [h]; exact i.isLt)).toTape⟩ else none
  else none

/-- An action: `.inl false` = move left, `.inl true` = move right, `.inr b` = write `b`. -/
abbrev Act : Type := Bool ⊕ Option Bool

/-- A transition result: halt with a bit, or (next state index, action). -/
abbrev Trans : Type := Bool ⊕ (ℕ × Act)

def actOf : Turing.TM0.Stmt (Option Bool) → Act
  | .move .left => .inl false
  | .move .right => .inl true
  | .write b => .inr b

def transOf {P : Computation.PrimitiveMachine} :
    Bool ⊕ (Fin P.stateCount × Turing.TM0.Stmt (Option Bool)) → Trans
  | .inl b => .inl b
  | .inr (q, a) => .inr (q.val, actOf a)

/-- The index of a cell symbol: blank 0, `false` 1, `true` 2. -/
def symIdx (c : Option Bool) : ℕ := c.elim 0 fun b => bif b then 2 else 1

/-- The transition table of `P` as data: row `q`, column `symIdx c`. -/
def table (P : Computation.PrimitiveMachine) : List (List Trans) :=
  (List.finRange P.stateCount).map fun q =>
    [none, some false, some true].map fun c => transOf (P.transition q c)

/-- The scanned tape of each state, as data. -/
def scanTable (P : Computation.PrimitiveMachine) : List ℕ :=
  (List.finRange P.stateCount).map fun q => (P.scan q).val

/-- Head moves and writes on a representation, in combinator form. Leaving the represented span
appends one blank cell, so the representation grows exactly when the run visits a new cell. -/
def moveL (t : TapeRep) : TapeRep := (t.1.tail, t.1.headD none, t.2.1 :: t.2.2)
def moveR (t : TapeRep) : TapeRep := (t.2.1 :: t.1, t.2.2.headD none, t.2.2.tail)
def writeC (b : Option Bool) (t : TapeRep) : TapeRep := (t.1, b, t.2.2)
def applyAct (a : Act) (t : TapeRep) : TapeRep :=
  a.elim (fun d => bif d then moveR t else moveL t) fun b => writeC b t

/-- `List.set` written with `take`/`drop`. -/
def setAt (l : List TapeRep) (i : ℕ) (t : TapeRep) : List TapeRep := l.take i ++ t :: l.drop (i + 1)

theorem default_optionBool : (default : Option Bool) = none := rfl

/-- A trailing blank cell does not change a `ListBlank`. -/
theorem ListBlank.mk_singleton_none : ListBlank.mk ([none] : List (Option Bool)) = ListBlank.mk [] :=
  Quotient.sound (Or.inr ⟨1, rfl⟩)

theorem toTape_moveL (t : TapeRep) : (moveL t).toTape = t.toTape.move .left := by
  obtain ⟨L, h, R⟩ := t
  cases L <;>
    simp [moveL, TapeRep.toTape, Tape.move_left_mk', ListBlank.head_mk, ListBlank.tail_mk,
      ListBlank.cons_mk, default_optionBool]

theorem toTape_moveR (t : TapeRep) : (moveR t).toTape = t.toTape.move .right := by
  obtain ⟨L, h, R⟩ := t
  cases R <;>
    simp [moveR, TapeRep.toTape, Tape.move_right_mk', ListBlank.head_mk, ListBlank.tail_mk,
      ListBlank.cons_mk, default_optionBool, ListBlank.mk_singleton_none]

theorem toTape_writeC (b : Option Bool) (t : TapeRep) : (writeC b t).toTape = t.toTape.write b := by
  obtain ⟨L, h, R⟩ := t
  simp [writeC, TapeRep.toTape, Tape.write_mk', ListBlank.tail_mk, ListBlank.cons_mk]

/-- One step on the representation: look up the scanned tape and the transition in the tables; a
halted state is a fixed point; an out-of-range state halts with `false` (never reached from `toCfg`). -/
def stepRep (P : Computation.PrimitiveMachine) (r : CfgRep) : CfgRep :=
  r.1.elim (fun _ => r) fun q =>
    (((table P).getD q []).getD (symIdx (r.2.getD ((scanTable P).getD q 0) ([], none, [])).2.1)
        (.inl false)).elim
      (fun ans => (.inl ans, r.2))
      fun p => (.inr p.1, setAt r.2 ((scanTable P).getD q 0)
        (applyAct p.2 (r.2.getD ((scanTable P).getD q 0) ([], none, []))))

theorem stepRep_polyT (P : Computation.PrimitiveMachine) : PolyT (stepRep P) := by
  unfold stepRep setAt applyAct writeC moveL moveR symIdx
  fun_prop

/-- The input representation: the word on the input tape, head on its first cell, other tapes blank. -/
def initRep (P : Computation.PrimitiveMachine) (x : List Bool) : CfgRep :=
  (.inr P.start.val, (List.range P.tapeCount).map fun i =>
    if i = P.inputTape.val then ([], x.head?, (x.drop 1).map some) else ([], none, []))

/-- The output: the halting bit, once halted. -/
def outRep (r : CfgRep) : Option Bool := r.1.elim (fun b => some b) fun _ => none

/-- OpenAI's machine behind the front end `pre`, as a stepped computation on bit strings. -/
def stepped (P : Computation.PrimitiveMachine) (pre : List Bool → List Bool) : Stepped (List Bool) Bool where
  σ := CfgRep
  init x := initRep P (pre x)
  step := stepRep P
  out := outRep

theorem toTape_head (t : TapeRep) : t.toTape.head = t.2.1 := by
  obtain ⟨L, h, R⟩ := t
  simp [TapeRep.toTape, ListBlank.head_mk]

theorem setAt_eq_set (l : List TapeRep) (i : ℕ) (t : TapeRep) (hi : i < l.length) :
    setAt l i t = l.set i t := by
  induction l generalizing i with
  | nil => simp at hi
  | cons a l ih =>
    cases i with
    | zero => simp [setAt]
    | succ i =>
      have := ih i (by simpa using hi)
      simp only [setAt] at this
      simp [setAt, this]

theorem scanTable_getD (P : Computation.PrimitiveMachine) (q : Fin P.stateCount) :
    (scanTable P).getD q.val 0 = (P.scan q).val := by
  simp [scanTable, List.getD_eq_getElem?_getD, q.isLt]

theorem table_getD (P : Computation.PrimitiveMachine) (q : Fin P.stateCount) (c : Option Bool) :
    ((table P).getD q.val []).getD (symIdx c) (.inl false) = transOf (P.transition q c) := by
  have h1 : (table P).getD q.val [] = [none, some false, some true].map fun c => transOf (P.transition q c) := by
    simp [table, List.getD_eq_getElem?_getD, q.isLt]
  rw [h1]
  cases c with
  | none => rfl
  | some b => cases b <;> rfl

theorem toTape_applyAct (a : Turing.TM0.Stmt (Option Bool)) (t : TapeRep) :
    (applyAct (actOf a) t).toTape =
      (match a with
        | .move d => t.toTape.move d
        | .write b => t.toTape.write b) := by
  cases a with
  | move d => cases d <;> simp [actOf, applyAct, toTape_moveL, toTape_moveR]
  | write b => simp [actOf, applyAct, toTape_writeC]

theorem stepRep_sound (P : Computation.PrimitiveMachine) (r : CfgRep) (c : P.Cfg) (h : toCfg P r = some c) :
    (toCfg P (stepRep P r)) = (P.step c).elim (toCfg P r) some := by
  obtain ⟨st, tapes⟩ := r
  unfold toCfg at h
  simp only at h
  split_ifs at h with hlen
  cases st with
  | inl b =>
    simp only [Option.some.injEq] at h
    subst h
    simp [stepRep, Computation.PrimitiveMachine.step, toCfg, hlen]
  | inr q =>
    simp only at h
    split_ifs at h with hq
    simp only [Option.some.injEq] at h
    subst h
    have hscan : (P.scan ⟨q, hq⟩).val < tapes.length := by rw [hlen]; exact (P.scan ⟨q, hq⟩).isLt
    simp only [stepRep, Sum.elim_inr, scanTable_getD P ⟨q, hq⟩,
      List.getD_eq_getElem (l := tapes) (d := (([], none, []) : TapeRep)) hscan]
    have ht := table_getD P ⟨q, hq⟩ (tapes[(P.scan ⟨q, hq⟩).val]'hscan).2.1
    rw [ht]
    simp only [Computation.PrimitiveMachine.step, toTape_head]
    cases htr : P.transition ⟨q, hq⟩ (tapes[(P.scan ⟨q, hq⟩).val]'hscan).2.1 with
    | inl ans =>
      simp [transOf, toCfg, hlen]
    | inr qa =>
      obtain ⟨q', act⟩ := qa
      simp only [transOf, Sum.elim_inr, Option.elim]
      rw [setAt_eq_set _ _ _ hscan]
      unfold toCfg
      simp only [List.length_set, hlen, q'.isLt, dite_true, Option.some.injEq,
        Computation.PrimitiveMachine.Cfg.mk.injEq]
      refine ⟨trivial, ?_⟩
      funext i
      by_cases hi : i = P.scan ⟨q, hq⟩
      · subst hi
        simp only [Function.update_self, List.getElem_set_self]
        cases act with
        | move d => cases d <;> simp [actOf, applyAct, toTape_moveL, toTape_moveR]
        | write b => simp [actOf, applyAct, toTape_writeC]
      · have hne : (P.scan ⟨q, hq⟩).val ≠ i.val := fun h => hi (Fin.ext h).symm
        rw [Function.update_of_ne hi, List.getElem_set_ne hne]

instance carried_cfgRep : Carried CfgRep := inferInstance

/-- `IsPolyT` for OpenAI's machine behind a polynomial-time front end. A `def`, not an instance, because
it takes the proof `hpre`; `subexpTM_of_claimAt3` installs it with `haveI`. -/
def isPolyT_stepped (P : Computation.PrimitiveMachine) (pre : List Bool → List Bool) (hpre : PolyT pre) :
    IsPolyT (stepped P pre) where
  enc := inferInstanceAs (Enc CfgRep)
  carried := carried_cfgRep
  init := by
    show PolyT fun x => initRep P (pre x)
    unfold initRep
    fun_prop
  step := stepRep_polyT P
  out := by
    show PolyT outRep
    unfold outRep
    fun_prop

/-! ### The size invariant: representation spans equal OpenAI's visited spans. -/

/-- `r` represents the located configuration `lc`: same machine configuration, and on every tape the
left list has `position − lower` cells and the right list `upper − position` cells. -/
def Rel (P : Computation.PrimitiveMachine) (r : CfgRep) (lc : SqrtLogSpace.LocatedCfg P) : Prop :=
  toCfg P r = some lc.config ∧ r.2.length = P.tapeCount ∧
    ∀ i : Fin P.tapeCount, ∀ hi : i.val < r.2.length,
      ((r.2[i.val]'hi).1.length : ℤ) = lc.position i - lc.lower i ∧
      ((r.2[i.val]'hi).2.2.length : ℤ) = lc.upper i - lc.position i

theorem toTape_blank : TapeRep.toTape ([], none, []) = Tape.mk₁ [] := by
  simp [TapeRep.toTape, Tape.mk₁, Tape.mk₂, ListBlank.mk_singleton_none]

theorem toTape_input (x : List Bool) :
    TapeRep.toTape ([], x.head?, (x.drop 1).map some) = Tape.mk₁ (x.map some) := by
  cases x with
  | nil => simp [TapeRep.toTape, Tape.mk₁, Tape.mk₂, ListBlank.mk_singleton_none]
  | cons b x => simp [TapeRep.toTape, Tape.mk₁, Tape.mk₂]

theorem initRep_length (P : Computation.PrimitiveMachine) (x : List Bool) :
    (initRep P x).2.length = P.tapeCount := by
  simp [initRep]

theorem initRep_getElem (P : Computation.PrimitiveMachine) (x : List Bool) (i : ℕ) (hi : i < (initRep P x).2.length) :
    (initRep P x).2[i] = if i = P.inputTape.val then ([], x.head?, (x.drop 1).map some) else ([], none, []) := by
  simp [initRep]

theorem rel_init (P : Computation.PrimitiveMachine) (x : List Bool) :
    Rel P (initRep P x) (SqrtLogSpace.locatedInit P x) := by
  have hlen := initRep_length P x
  refine ⟨?_, hlen, fun i hi => ?_⟩
  · unfold toCfg
    rw [dif_pos hlen]
    simp only [initRep, dif_pos P.start.isLt, Option.some.injEq, SqrtLogSpace.locatedInit,
      Computation.PrimitiveMachine.init, Computation.PrimitiveMachine.Cfg.mk.injEq, true_and]
    funext k
    rw [List.getElem_map, List.getElem_range]
    by_cases hk : k = P.inputTape
    · subst hk; rw [if_pos rfl, if_pos rfl, toTape_input]
    · rw [if_neg (fun h => hk (Fin.ext h)), if_neg hk, toTape_blank]
  · rw [initRep_getElem]
    simp only [SqrtLogSpace.locatedInit]
    by_cases hk : i = P.inputTape
    · subst hk
      simp
    · rw [if_neg (fun h => hk (Fin.ext h)), if_neg hk]
      simp

theorem monitor_config (P : Computation.PrimitiveMachine) (lc : SqrtLogSpace.LocatedCfg P) (cfg : P.Cfg) :
    (lc.monitor cfg).config = cfg := by
  unfold SqrtLogSpace.LocatedCfg.monitor
  cases lc.config.state with
  | inl _ => rfl
  | inr q =>
    simp only [Sum.elim_inr]
    cases P.transition q (lc.config.tapes (P.scan q)).head with
    | inl _ => rfl
    | inr _ => rfl

/-- What `toCfg P (st, tapes) = some c` says. -/
theorem toCfg_eq_some (P : Computation.PrimitiveMachine) (st : Bool ⊕ ℕ) (tapes : List TapeRep) (c : P.Cfg)
    (h : toCfg P (st, tapes) = some c) :
    ∃ hlen : tapes.length = P.tapeCount,
      c.tapes = (fun i => (tapes[i.val]'(by rw [hlen]; exact i.isLt)).toTape) ∧
      ((∃ b, st = .inl b ∧ c.state = .inl b) ∨
        (∃ (q : ℕ) (hq : q < P.stateCount), st = .inr q ∧ c.state = .inr ⟨q, hq⟩)) := by
  unfold toCfg at h
  simp only at h
  split_ifs at h with hlen
  refine ⟨hlen, ?_⟩
  cases st with
  | inl b =>
    simp only [Option.some.injEq] at h
    subst h
    exact ⟨rfl, Or.inl ⟨b, rfl, rfl⟩⟩
  | inr q =>
    simp only at h
    split_ifs at h with hq
    simp only [Option.some.injEq] at h
    subst h
    exact ⟨rfl, Or.inr ⟨q, hq, rfl, rfl⟩⟩

theorem stepRep_length (P : Computation.PrimitiveMachine) (r : CfgRep) (c : P.Cfg) (hcfg : toCfg P r = some c) :
    (stepRep P r).2.length = r.2.length := by
  obtain ⟨st, tapes⟩ := r
  obtain ⟨hlen, -, hst⟩ := toCfg_eq_some P st tapes c hcfg
  rcases hst with ⟨b, rfl, -⟩ | ⟨q, hq, rfl, -⟩
  · rfl
  · have hscan : (P.scan ⟨q, hq⟩).val < tapes.length := by rw [hlen]; exact (P.scan ⟨q, hq⟩).isLt
    simp only [stepRep, Sum.elim_inr, scanTable_getD P ⟨q, hq⟩]
    cases ((table P).getD q []).getD _ (Sum.inl false) with
    | inl _ => rfl
    | inr p => simp only [Sum.elim_inr, setAt_eq_set _ _ _ hscan, List.length_set]

/-- Span bookkeeping for one head move or write, with OpenAI's `min`/`max` tracking of the visited
interval. -/
theorem span_moveL (t : TapeRep) (pos lo up : ℤ)
    (h1 : (t.1.length : ℤ) = pos - lo) (h2 : (t.2.2.length : ℤ) = up - pos) :
    ((moveL t).1.length : ℤ) = pos + -1 - min lo (pos + -1) ∧
    ((moveL t).2.2.length : ℤ) = max up (pos + -1) - (pos + -1) := by
  obtain ⟨L, h, R⟩ := t
  simp only at h1 h2
  rcases L with _ | ⟨a, L'⟩
  · simp only [List.length_nil, Nat.cast_zero] at h1
    simp only [moveL, List.tail_nil, List.length_nil, List.length_cons, Nat.cast_zero, Nat.cast_add,
      Nat.cast_one]
    rw [min_eq_right (by omega), max_eq_left (by omega)]
    constructor <;> omega
  · simp only [List.length_cons, Nat.cast_add, Nat.cast_one] at h1
    simp only [moveL, List.tail_cons, List.length_cons, Nat.cast_add, Nat.cast_one]
    rw [min_eq_left (by omega), max_eq_left (by omega)]
    constructor <;> omega

theorem span_moveR (t : TapeRep) (pos lo up : ℤ)
    (h1 : (t.1.length : ℤ) = pos - lo) (h2 : (t.2.2.length : ℤ) = up - pos) :
    ((moveR t).1.length : ℤ) = pos + 1 - min lo (pos + 1) ∧
    ((moveR t).2.2.length : ℤ) = max up (pos + 1) - (pos + 1) := by
  obtain ⟨L, h, R⟩ := t
  simp only at h1 h2
  rcases R with _ | ⟨a, R'⟩
  · simp only [List.length_nil, Nat.cast_zero] at h2
    simp only [moveR, List.tail_nil, List.length_nil, List.length_cons, Nat.cast_zero, Nat.cast_add,
      Nat.cast_one]
    rw [min_eq_left (by omega), max_eq_right (by omega)]
    constructor <;> omega
  · simp only [List.length_cons, Nat.cast_add, Nat.cast_one] at h2
    simp only [moveR, List.tail_cons, List.length_cons, Nat.cast_add, Nat.cast_one]
    rw [min_eq_left (by omega), max_eq_left (by omega)]
    constructor <;> omega

theorem span_write (b : Option Bool) (t : TapeRep) (pos lo up : ℤ)
    (h1 : (t.1.length : ℤ) = pos - lo) (h2 : (t.2.2.length : ℤ) = up - pos) :
    ((writeC b t).1.length : ℤ) = pos + 0 - min lo (pos + 0) ∧
    ((writeC b t).2.2.length : ℤ) = max up (pos + 0) - (pos + 0) := by
  obtain ⟨L, h, R⟩ := t
  simp only at h1 h2
  simp only [writeC, add_zero]
  rw [min_eq_left (by omega), max_eq_left (by omega)]
  exact ⟨h1, h2⟩

theorem rel_step (P : Computation.PrimitiveMachine) (r : CfgRep) (lc lc' : SqrtLogSpace.LocatedCfg P)
    (h : Rel P r lc) (hs : SqrtLogSpace.locatedStep P lc = some lc') : Rel P (stepRep P r) lc' := by
  obtain ⟨hcfg, hlen, hrel⟩ := h
  unfold SqrtLogSpace.locatedStep at hs
  obtain ⟨cfg', hstep, rfl⟩ := Option.map_eq_some_iff.1 hs
  refine ⟨?_, ?_, ?_⟩
  · rw [stepRep_sound P r lc.config hcfg, hstep, monitor_config]
    rfl
  · rw [stepRep_length P r lc.config hcfg, hlen]
  · obtain ⟨st, tapes⟩ := r
    obtain ⟨hlen', htapes, hst⟩ := toCfg_eq_some P st tapes lc.config hcfg
    rcases hst with ⟨b, rfl, hb⟩ | ⟨q, hq, rfl, hq'⟩
    · exfalso
      simp [Computation.PrimitiveMachine.step, hb] at hstep
    · have hscan : (P.scan ⟨q, hq⟩).val < tapes.length := by rw [hlen]; exact (P.scan ⟨q, hq⟩).isLt
      simp only [Computation.PrimitiveMachine.step, hq', htapes, toTape_head] at hstep
      simp only [SqrtLogSpace.LocatedCfg.monitor, hq', Sum.elim_inr, htapes, toTape_head]
      simp only [stepRep, Sum.elim_inr, scanTable_getD P ⟨q, hq⟩,
        List.getD_eq_getElem (l := tapes) (d := (([], none, []) : TapeRep)) hscan]
      have ht := table_getD P ⟨q, hq⟩ (tapes[(P.scan ⟨q, hq⟩).val]'hscan).2.1
      simp only [ht]
      obtain ⟨tr, htr⟩ : ∃ tr, P.transition ⟨q, hq⟩ (tapes[(P.scan ⟨q, hq⟩).val]'hscan).2.1 = tr := ⟨_, rfl⟩
      simp only [htr] at hstep ⊢
      cases tr with
      | inl ans =>
        simp only [Option.some.injEq] at hstep
        subst hstep
        simp only [transOf, Sum.elim_inl]
        intro i hi
        exact hrel i hi
      | inr qa =>
        obtain ⟨q', act⟩ := qa
        simp only [Option.some.injEq] at hstep
        subst hstep
        simp only [transOf, Sum.elim_inr]
        intro i hi
        simp only [setAt_eq_set _ _ _ hscan] at hi ⊢
        by_cases hij : i = P.scan ⟨q, hq⟩
        · subst hij
          simp only [List.getElem_set_self, Function.update_self]
          obtain ⟨h1, h2⟩ := hrel (P.scan ⟨q, hq⟩) hscan
          simp only at h1 h2
          cases act with
          | move d =>
            cases d
            · simp only [actOf, applyAct, Sum.elim_inl, cond_false, SqrtLogSpace.headDisplacement]
              exact span_moveL _ _ _ _ h1 h2
            · simp only [actOf, applyAct, Sum.elim_inl, cond_true, SqrtLogSpace.headDisplacement]
              exact span_moveR _ _ _ _ h1 h2
          | write b =>
            simp only [actOf, applyAct, Sum.elim_inr, SqrtLogSpace.headDisplacement]
            exact span_write _ _ _ _ _ h1 h2
        · have hne : (P.scan ⟨q, hq⟩).val ≠ i.val := fun h => hij (Fin.ext h).symm
          simp only [List.getElem_set_ne hne, Function.update_of_ne hij]
          exact hrel i (by simpa using hi)

theorem rel_trace (P : Computation.PrimitiveMachine) (x : List Bool) (t : ℕ) (final : SqrtLogSpace.LocatedCfg P)
    (h : Computation.Trace (SqrtLogSpace.locatedStep P) t (SqrtLogSpace.locatedInit P x) final) :
    Rel P ((stepRep P)^[t] (initRep P x)) final := by
  suffices H : ∀ (t : ℕ) (a b : SqrtLogSpace.LocatedCfg P) (r : CfgRep),
      Computation.Trace (SqrtLogSpace.locatedStep P) t a b → Rel P r a → Rel P ((stepRep P)^[t] r) b from
    H t _ _ _ h (rel_init P x)
  intro t a b r htr
  induction htr generalizing r with
  | refl a => intro h; simpa using h
  | cons hab _ ih =>
    intro hr
    rw [Function.iterate_succ_apply]
    exact ih _ (rel_step P r _ _ hr hab)

/-- The size of a representation, from the lengths of its lists. -/
theorem size_optionBool_le (c : Option Bool) : size c ≤ 2 := by
  cases c <;> simp [HasSize.size]

theorem size_listOptionBool_le (L : List (Option Bool)) : size L ≤ 3 * L.length + 1 := by
  simp only [HasSize.size]
  induction L with
  | nil => simp
  | cons c L ih =>
    have := size_optionBool_le c
    simp only [List.map_cons, List.sum_cons, List.length_cons] at *
    simp only [HasSize.size] at this ih ⊢
    omega

theorem size_tapeRep_le (t : TapeRep) : size t ≤ 3 * (t.1.length + t.2.2.length) + 4 := by
  obtain ⟨L, h, R⟩ := t
  have h1 := size_listOptionBool_le L
  have h2 := size_listOptionBool_le R
  have h3 := size_optionBool_le h
  simp only [HasSize.size] at *
  omega

theorem size_state_le (P : Computation.PrimitiveMachine) (st : Bool ⊕ ℕ) (hst : ∀ q, st = .inr q → q < P.stateCount) :
    size st ≤ P.stateCount + 2 := by
  cases st with
  | inl b => simp [HasSize.size]
  | inr q =>
    have hq := hst q rfl
    have : q.size ≤ q := Nat.size_le.2 (Nat.lt_two_pow_self)
    simp only [HasSize.size]
    omega

/-- A list sum bounded index by index is bounded by a range sum. -/
theorem list_sum_map_le_sum_range {α : Type} (l : List α) (f : α → ℕ) (g : ℕ → ℕ)
    (h : ∀ i (hi : i < l.length), f l[i] ≤ g i) :
    (l.map f).sum ≤ ∑ i ∈ Finset.range l.length, g i := by
  induction l generalizing g with
  | nil => simp
  | cons a l ih =>
    simp only [List.map_cons, List.sum_cons, List.length_cons, Finset.sum_range_succ']
    have h0 := h 0 (by simp)
    have := ih (fun i => g (i + 1)) fun i hi => h (i + 1) (by simpa using hi)
    simp only [List.getElem_cons_zero] at h0
    omega

theorem size_of_rel (P : Computation.PrimitiveMachine) (r : CfgRep) (lc : SqrtLogSpace.LocatedCfg P)
    (h : Rel P r lc) :
    size r ≤ 8 * (SqrtLogSpace.visitedSpace lc + P.tapeCount + P.stateCount + 1) := by
  obtain ⟨hcfg, hlen, hrel⟩ := h
  obtain ⟨st, tapes⟩ := r
  simp only at hlen hrel
  have hst : size st ≤ P.stateCount + 2 := by
    refine size_state_le P st fun q hq => ?_
    subst hq
    unfold toCfg at hcfg
    simp only at hcfg
    rw [dif_pos hlen] at hcfg
    by_contra hlt
    rw [dif_neg hlt] at hcfg
    simp at hcfg
  -- per tape: 3 (|L| + |R|) + 5 ≤ 3 (upper − lower + 1).toNat + 5, and |L| + |R| = upper − lower
  let g : ℕ → ℕ := fun i => if hi : i < P.tapeCount then
    3 * (lc.upper ⟨i, hi⟩ - lc.lower ⟨i, hi⟩ + 1).toNat + 5 else 0
  have hper : ∀ i (hi : i < tapes.length), size tapes[i] + 1 ≤ g i := by
    intro i hi
    have hi' : i < P.tapeCount := hlen ▸ hi
    obtain ⟨h1, h2⟩ := hrel ⟨i, hi'⟩ hi
    have hsz := size_tapeRep_le tapes[i]
    simp only [g, dif_pos hi']
    have hspan : (tapes[i].1.length : ℤ) + tapes[i].2.2.length ≤ ((lc.upper ⟨i, hi'⟩ - lc.lower ⟨i, hi'⟩ + 1).toNat : ℤ) := by
      have h1' : (tapes[i].1.length : ℤ) = lc.position ⟨i, hi'⟩ - lc.lower ⟨i, hi'⟩ := h1
      have h2' : (tapes[i].2.2.length : ℤ) = lc.upper ⟨i, hi'⟩ - lc.position ⟨i, hi'⟩ := h2
      rw [h1', h2']
      have := Int.self_le_toNat (lc.upper ⟨i, hi'⟩ - lc.lower ⟨i, hi'⟩ + 1)
      omega
    have hspan' : tapes[i].1.length + tapes[i].2.2.length ≤ (lc.upper ⟨i, hi'⟩ - lc.lower ⟨i, hi'⟩ + 1).toNat := by
      exact_mod_cast hspan
    omega
  have hsum := list_sum_map_le_sum_range tapes (fun t => size t + 1) g hper
  have hvis : ∑ i ∈ Finset.range tapes.length, g i =
      3 * SqrtLogSpace.visitedSpace lc + 5 * P.tapeCount := by
    rw [hlen, ← Fin.sum_univ_eq_sum_range g P.tapeCount]
    simp only [SqrtLogSpace.visitedSpace, g, Fin.is_lt, dite_true, Fin.eta, Finset.mul_sum,
      Finset.sum_add_distrib, Finset.sum_const, Finset.card_univ, Fintype.card_fin, smul_eq_mul]
    ring
  have htapes : size tapes ≤ 3 * SqrtLogSpace.visitedSpace lc + 5 * P.tapeCount + 1 := by
    simp only [HasSize.size]
    simp only [HasSize.size] at hsum
    omega
  simp only [HasSize.size] at hst htapes ⊢
  omega

/-- The size of a reachable representation is bounded by the visited space of the run. -/
theorem size_le_visitedSpace (P : Computation.PrimitiveMachine) (x : List Bool) (t : ℕ)
    (final : SqrtLogSpace.LocatedCfg P)
    (h : Computation.Trace (SqrtLogSpace.locatedStep P) t (SqrtLogSpace.locatedInit P x) final) :
    size ((stepRep P)^[t] (initRep P x)) ≤
      8 * (SqrtLogSpace.visitedSpace final + P.tapeCount + P.stateCount + 1) :=
  size_of_rel P _ final (rel_trace P x t final h)

/-! ## 5. Assembly. -/

/-- Appending one step at the end of a trace. -/
theorem Trace.snoc {α : Type} {step : α → Option α} {n : ℕ} {a b c : α}
    (h : Computation.Trace step n a b) (hs : step b = some c) : Computation.Trace step (n + 1) a c := by
  induction h with
  | refl a => exact Computation.Trace.cons hs (Computation.Trace.refl _)
  | cons hab _ ih => exact Computation.Trace.cons hab (ih hs)

/-- A located run of OpenAI's machine whose visited space stays below `V` is a `Reaches` of the stepped
machine with states of size at most `8 (V + tapeCount + stateCount + 1)`, by the invariant. -/
theorem reaches_of_trace (P : Computation.PrimitiveMachine) (pre : List Bool → List Bool) (x : List Bool)
    (V : ℕ) (b : Bool) (final : SqrtLogSpace.LocatedCfg P) (hfin : final.config.state = .inl b)
    (T : ℕ)
    (hV : ∀ (m : ℕ), m ≤ T → ∀ (c : SqrtLogSpace.LocatedCfg P),
      Computation.Trace (SqrtLogSpace.locatedStep P) m (SqrtLogSpace.locatedInit P (pre x)) c →
        SqrtLogSpace.visitedSpace c ≤ V) :
    ∀ (k : ℕ) (a : SqrtLogSpace.LocatedCfg P), Computation.Trace (SqrtLogSpace.locatedStep P) k a final →
      ∀ (j : ℕ) (r : CfgRep), j + k ≤ T → Rel P r a →
      Computation.Trace (SqrtLogSpace.locatedStep P) j (SqrtLogSpace.locatedInit P (pre x)) a →
      (stepped P pre).Reaches (8 * (V + P.tapeCount + P.stateCount + 1)) b r k := by
  intro k a hk
  induction hk with
  | refl a =>
    intro j r hjk hrel hj
    have hsz := size_of_rel P r a hrel
    have hvis := hV j (by omega) a hj
    have hsz' : size r ≤ 8 * (V + P.tapeCount + P.stateCount + 1) := hsz.trans (by omega)
    refine Stepped.Reaches.halt ?_ hsz'
    obtain ⟨st, tapes⟩ := r
    obtain ⟨-, -, hst⟩ := toCfg_eq_some P st tapes a.config hrel.1
    rcases hst with ⟨b', rfl, hb'⟩ | ⟨q, hq, rfl, hq'⟩
    · rw [hfin] at hb'
      simp only [Sum.inl.injEq] at hb'
      subst hb'
      rfl
    · rw [hfin] at hq'
      exact absurd hq' (by simp)
  | @cons n a a' c hab htail ih =>
    intro j r hjk hrel hj
    have hsz := size_of_rel P r a hrel
    have hvis := hV j (by omega) a hj
    have hsz' : size r ≤ 8 * (V + P.tapeCount + P.stateCount + 1) := hsz.trans (by omega)
    refine Stepped.Reaches.step ?_ hsz' ?_
    · obtain ⟨st, tapes⟩ := r
      obtain ⟨-, -, hst⟩ := toCfg_eq_some P st tapes a.config hrel.1
      rcases hst with ⟨b', rfl, hb'⟩ | ⟨q, hq, rfl, hq'⟩
      · exfalso
        unfold SqrtLogSpace.locatedStep at hab
        simp [Computation.PrimitiveMachine.step, hb'] at hab
      · rfl
    · exact ih hfin (j + 1) (stepRep P r) (by omega) (rel_step P r a a' hrel hab) (Trace.snoc hj hab)

/-- Every polynomial-plus-constant is below `(n + 2)^d` for some `d`. -/
theorem exists_pow_bound (c K : ℕ) : ∃ d : ℕ, ∀ n : ℕ, c * (n + 1) ^ c + K ≤ (n + 2) ^ d := by
  refine ⟨c + (c + K), fun n => ?_⟩
  have h1 : c * (n + 1) ^ c + K ≤ (c + K) * (n + 2) ^ c := by
    have : (n + 1) ^ c ≤ (n + 2) ^ c := Nat.pow_le_pow_left (by omega) c
    have : 1 ≤ (n + 2) ^ c := Nat.one_le_pow _ _ (by omega)
    nlinarith
  have h2 : c + K ≤ (n + 2) ^ (c + K) :=
    (Nat.lt_two_pow_self).le.trans (Nat.pow_le_pow_left (by omega) _)
  calc c * (n + 1) ^ c + K ≤ (c + K) * (n + 2) ^ c := h1
    _ ≤ (n + 2) ^ (c + K) * (n + 2) ^ c := Nat.mul_le_mul_right _ h2
    _ = (n + 2) ^ (c + (c + K)) := by ring

/-- Polynomial times `2^{A·ρ(n)}` is below `A'·2^{δ n}` for some constant `A'`, for every δ > 0. -/
theorem exists_const_exp_bound (c : ℕ) (A δ : ℝ) (hA : 0 < A) (hδ : 0 < δ) :
    ∃ A' : ℕ, ∀ n : ℕ, (c : ℝ) * ((n : ℝ) + 1) ^ c * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) ≤
      (A' : ℝ) * (2 : ℝ) ^ (δ * n) := by
  -- the polynomial factor is eventually below (2^{δ/2})^n
  set r : ℝ := (2 : ℝ) ^ (δ / 2) with hr
  have hr1 : 1 < r := Real.one_lt_rpow (by norm_num) (by positivity)
  have hr0 : 0 < r := zero_lt_one.trans hr1
  have hpoly : ∃ N1 : ℕ, ∀ n : ℕ, N1 ≤ n → ((n : ℝ) + 1) ^ c ≤ (2 : ℝ) ^ c * r ^ n := by
    have hlo := isLittleO_pow_const_const_pow_of_one_lt (R := ℝ) c hr1
    obtain ⟨N, hN⟩ := Filter.eventually_atTop.1 (hlo.bound (by norm_num : (0 : ℝ) < 1))
    refine ⟨max N 1, fun n hn => ?_⟩
    have h1 := hN n (le_of_max_le_left hn)
    have hn1 : (1 : ℝ) ≤ n := by exact_mod_cast le_of_max_le_right hn
    rw [Real.norm_of_nonneg (by positivity), Real.norm_of_nonneg (by positivity), one_mul] at h1
    calc ((n : ℝ) + 1) ^ c ≤ (2 * n) ^ c := pow_le_pow_left₀ (by positivity) (by linarith) c
      _ = 2 ^ c * (n : ℝ) ^ c := mul_pow _ _ _
      _ ≤ 2 ^ c * r ^ n := mul_le_mul_of_nonneg_left h1 (by positivity)
  obtain ⟨N1, hN1⟩ := hpoly
  obtain ⟨N2, hN2⟩ := runtimeScale_sublinear (δ / (2 * A)) (by positivity)
  -- constants covering the finitely many small n
  set K1 : ℝ := ((N1 : ℝ) + 1) ^ c with hK1
  set K2 : ℝ := ∑ m ∈ Finset.range N2, (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale m) with hK2
  have hK2nn : 0 ≤ K2 := Finset.sum_nonneg fun _ _ => by positivity
  have hpoly' : ∀ n : ℕ, ((n : ℝ) + 1) ^ c ≤ (2 ^ c + K1) * r ^ n := by
    intro n
    have hrn : 1 ≤ r ^ n := one_le_pow₀ hr1.le
    rcases le_or_gt N1 n with hn | hn
    · calc ((n : ℝ) + 1) ^ c ≤ 2 ^ c * r ^ n := hN1 n hn
        _ ≤ (2 ^ c + K1) * r ^ n :=
          mul_le_mul_of_nonneg_right (by linarith [show (0 : ℝ) ≤ K1 by positivity]) (by positivity)
    · calc ((n : ℝ) + 1) ^ c ≤ K1 := by
            rw [hK1]
            have : (n : ℝ) ≤ N1 := by exact_mod_cast hn.le
            exact pow_le_pow_left₀ (by positivity) (by linarith) c
        _ ≤ (2 ^ c + K1) * r ^ n := by
            have hK1nn : (0 : ℝ) ≤ K1 := by rw [hK1]; positivity
            have h2c : (0 : ℝ) ≤ 2 ^ c := by positivity
            calc K1 ≤ 2 ^ c + K1 := by linarith
              _ = (2 ^ c + K1) * 1 := (mul_one _).symm
              _ ≤ (2 ^ c + K1) * r ^ n := mul_le_mul_of_nonneg_left hrn (by linarith)
  have hexp' : ∀ n : ℕ, (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) ≤ (K2 + 1) * r ^ n := by
    intro n
    have hrn : 1 ≤ r ^ n := one_le_pow₀ hr1.le
    have hrn' : r ^ n = (2 : ℝ) ^ (δ / 2 * n) := by
      rw [hr, ← Real.rpow_natCast, ← Real.rpow_mul (by norm_num)]
    rcases le_or_gt N2 n with hn | hn
    · have := hN2 n hn
      calc (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) ≤ (2 : ℝ) ^ (δ / 2 * n) := by
            apply Real.rpow_le_rpow_of_exponent_le (by norm_num)
            calc A * SqrtLog.Statement.runtimeScale n ≤ A * (δ / (2 * A) * n) := by gcongr
              _ = δ / 2 * n := by field_simp
        _ = r ^ n := hrn'.symm
        _ ≤ (K2 + 1) * r ^ n := by nlinarith
    · calc (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) ≤ K2 := by
            rw [hK2]
            exact Finset.single_le_sum (f := fun m => (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale m))
              (fun _ _ => by positivity) (Finset.mem_range.2 hn)
        _ ≤ (K2 + 1) * r ^ n := by nlinarith
  refine ⟨⌈(c : ℝ) * (2 ^ c + K1) * (K2 + 1)⌉₊, fun n => ?_⟩
  have hrr : r ^ n * r ^ n = (2 : ℝ) ^ (δ * n) := by
    rw [hr, ← Real.rpow_natCast, ← Real.rpow_mul (by norm_num), ← Real.rpow_add (by norm_num)]
    ring_nf
  calc (c : ℝ) * ((n : ℝ) + 1) ^ c * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)
      ≤ (c : ℝ) * ((2 ^ c + K1) * r ^ n) * ((K2 + 1) * r ^ n) := by
        gcongr
        · exact hpoly' n
        · exact hexp' n
    _ = (c : ℝ) * (2 ^ c + K1) * (K2 + 1) * (r ^ n * r ^ n) := by ring
    _ = (c : ℝ) * (2 ^ c + K1) * (K2 + 1) * (2 : ℝ) ^ (δ * n) := by rw [hrr]
    _ ≤ (⌈(c : ℝ) * (2 ^ c + K1) * (K2 + 1)⌉₊ : ℝ) * (2 : ℝ) ^ (δ * n) := by
        gcongr
        exact Nat.le_ceil _

/-- A 3-CNF without repeated clauses has at most `(2n+1)^3` clauses: clauses of length ≤ 3 inject into
triples of optional literals. -/
theorem length_le_of_is3CNF {n : ℕ} (φ : Sat3.CNF n) (h : Sat3.Is3CNF φ) : φ.length ≤ (2 * n + 1) ^ 3 := by
  let f : List (Sat3.Lit n) → Option (Sat3.Lit n) × Option (Sat3.Lit n) × Option (Sat3.Lit n) :=
    fun C => (C[0]?, C[1]?, C[2]?)
  have hinj : ∀ C ∈ φ, ∀ D ∈ φ, f C = f D → C = D := by
    intro C hC D hD hfd
    simp only [f, Prod.mk.injEq] at hfd
    obtain ⟨h0, h1, h2⟩ := hfd
    have hC3 := h.1 C hC
    have hD3 := h.1 D hD
    apply List.ext_getElem?
    intro i
    rcases i with _ | _ | _ | i
    · exact h0
    · exact h1
    · exact h2
    · rw [List.getElem?_eq_none (by omega), List.getElem?_eq_none (by omega)]
  have hnd : (φ.map f).Nodup := h.2.map_on hinj
  have hcard := hnd.length_le_card
  rw [List.length_map] at hcard
  refine hcard.trans (le_of_eq ?_)
  simp only [Fintype.card_prod, Fintype.card_option, Fintype.card_fin, Fintype.card_bool]
  ring

/-- The plain code of a 3-CNF on `n` variables has length at most `100 (n+1)^4`. -/
theorem enc_length_le {n : ℕ} (φ : Sat3.CNF n) (h : Sat3.Is3CNF φ) :
    (Sat3.enc φ).length ≤ 100 * (n + 1) ^ 4 := by
  have hm := length_le_of_is3CNF φ h
  have hlog : Nat.log2 (2 * n) + 1 ≤ 2 * n + 1 := by
    have := Nat.log2_le_self (2 * n)
    omega
  have hlen : (Sat3.enc φ).length = n + 1 + φ.length * (3 * (Nat.log2 (2 * n) + 1)) := by
    simp only [Sat3.enc, List.length_append, List.length_replicate, List.length_cons,
      List.length_flatMap, List.map_map, Function.comp_def, List.length_map, List.length_range,
      List.map_const', List.sum_replicate, smul_eq_mul]
    ring
  rw [hlen]
  have h2 : 2 * n + 1 ≤ 2 * (n + 1) := by omega
  calc n + 1 + φ.length * (3 * (Nat.log2 (2 * n) + 1))
      ≤ n + 1 + (2 * n + 1) ^ 3 * (3 * (2 * n + 1)) := by gcongr
    _ ≤ (n + 1) + (2 * (n + 1)) ^ 3 * (3 * (2 * (n + 1))) := by gcongr
    _ = (n + 1) + 48 * (n + 1) ^ 4 := by ring
    _ ≤ 100 * (n + 1) ^ 4 := by
        have : n + 1 ≤ (n + 1) ^ 4 := Nat.le_self_pow (by norm_num) _
        omega

theorem outputs_mono {N : TM2ComputableAux Bool Bool} {x : List (N.tm.Γ N.tm.k₀)}
    {y : Option (List (N.tm.Γ N.tm.k₁))} {t t' : ℕ}
    (h : Nonempty (TM2OutputsInTime N.tm x y t)) (ht : t ≤ t') : Nonempty (TM2OutputsInTime N.tm x y t') :=
  h.elim fun e => ⟨{ e with steps_le_m := e.steps_le_m.trans ht }⟩

/-- The state-size bound of a run, as a polynomial in the input length. -/
theorem size_bound_nat (S : ℝ) (e cL n L xl tc sc : ℕ) (hL : L ≤ cL * (n + 1) ^ 5) (hxn : n + 1 ≤ xl) :
    8 * (⌈S⌉₊ * (L + 1) ^ e + tc + sc + 1) ≤
      (8 * ⌈S⌉₊ * (cL + 1) ^ e + 5 * e) * (xl + 1) ^ (8 * ⌈S⌉₊ * (cL + 1) ^ e + 5 * e) + 8 * (tc + sc + 1) := by
  set a := ⌈S⌉₊ with ha
  have h1 : L + 1 ≤ (cL + 1) * (xl + 1) ^ 5 := by
    have h5 : 1 ≤ (n + 1) ^ 5 := Nat.one_le_pow _ _ (by omega)
    have h6 : (n + 1) ^ 5 ≤ (xl + 1) ^ 5 := Nat.pow_le_pow_left (by omega) 5
    nlinarith
  have h2 : (L + 1) ^ e ≤ (cL + 1) ^ e * (xl + 1) ^ (5 * e) := by
    calc (L + 1) ^ e ≤ ((cL + 1) * (xl + 1) ^ 5) ^ e := Nat.pow_le_pow_left h1 e
      _ = (cL + 1) ^ e * (xl + 1) ^ (5 * e) := by rw [mul_pow, ← pow_mul]
  have h3 : (xl + 1) ^ (5 * e) ≤ (xl + 1) ^ (8 * a * (cL + 1) ^ e + 5 * e) :=
    Nat.pow_le_pow_right (by omega) (by omega)
  have h4 : 8 * a * (L + 1) ^ e ≤
      (8 * a * (cL + 1) ^ e + 5 * e) * (xl + 1) ^ (8 * a * (cL + 1) ^ e + 5 * e) := by
    calc 8 * a * (L + 1) ^ e ≤ 8 * a * ((cL + 1) ^ e * (xl + 1) ^ (5 * e)) := Nat.mul_le_mul_left _ h2
      _ = (8 * a * (cL + 1) ^ e) * (xl + 1) ^ (5 * e) := by ring
      _ ≤ (8 * a * (cL + 1) ^ e + 5 * e) * (xl + 1) ^ (8 * a * (cL + 1) ^ e + 5 * e) :=
          Nat.mul_le_mul (by omega) h3
  nlinarith [h4]

/-- The step bound of the compiled machine, as `cT (n+1)^{cT} 2^{A ρ(n)}`. -/
theorem time_bound_real (c' d cL : ℕ) (C A : ℝ) (hC : 0 < C) (hA : 0 < A) (n L xl time : ℕ)
    (hL : L ≤ cL * (n + 1) ^ 5) (hx : xl ≤ 100 * (n + 1) ^ 4)
    (htime : (time : ℝ) ≤ C * ((L : ℝ) + 1) ^ d * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)) :
    ((c' * (time + 1) * (xl + 1) ^ c' : ℕ) : ℝ) ≤
      ((⌈(c' : ℝ) * (C * ((cL : ℝ) + 1) ^ d + 1) * (101 : ℝ) ^ c'⌉₊ + 5 * d + 4 * c' : ℕ) : ℝ) *
        ((n : ℝ) + 1) ^ (⌈(c' : ℝ) * (C * ((cL : ℝ) + 1) ^ d + 1) * (101 : ℝ) ^ c'⌉₊ + 5 * d + 4 * c') *
        (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) := by
  set cT : ℕ := ⌈(c' : ℝ) * (C * ((cL : ℝ) + 1) ^ d + 1) * (101 : ℝ) ^ c'⌉₊ + 5 * d + 4 * c' with hcT
  set E : ℝ := (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) with hE
  have hρ : 0 ≤ SqrtLog.Statement.runtimeScale n := by
    unfold SqrtLog.Statement.runtimeScale; positivity
  have hE1 : 1 ≤ E := Real.one_le_rpow (by norm_num) (by positivity)
  have hE0 : 0 ≤ E := zero_le_one.trans hE1
  have hn1 : (1 : ℝ) ≤ (n : ℝ) + 1 := by linarith [show (0 : ℝ) ≤ n from Nat.cast_nonneg n]
  have hL1 : ((L : ℝ) + 1) ≤ ((cL : ℝ) + 1) * ((n : ℝ) + 1) ^ 5 := by
    have h5 : (1 : ℝ) ≤ ((n : ℝ) + 1) ^ 5 := one_le_pow₀ hn1
    have hL' : (L : ℝ) ≤ (cL : ℝ) * ((n : ℝ) + 1) ^ 5 := by exact_mod_cast hL
    nlinarith
  have hx1 : ((xl : ℝ) + 1) ≤ 101 * ((n : ℝ) + 1) ^ 4 := by
    have h4 : (1 : ℝ) ≤ ((n : ℝ) + 1) ^ 4 := one_le_pow₀ hn1
    have hx' : (xl : ℝ) ≤ 100 * ((n : ℝ) + 1) ^ 4 := by exact_mod_cast hx
    nlinarith
  have hCL : (0 : ℝ) ≤ C * ((cL : ℝ) + 1) ^ d + 1 := by positivity
  -- time + 1 ≤ (C (cL+1)^d + 1) (n+1)^{5d} E
  have ht1 : ((time : ℝ) + 1) ≤ (C * ((cL : ℝ) + 1) ^ d + 1) * ((n : ℝ) + 1) ^ (5 * d) * E := by
    have hLd : ((L : ℝ) + 1) ^ d ≤ ((cL : ℝ) + 1) ^ d * ((n : ℝ) + 1) ^ (5 * d) := by
      calc ((L : ℝ) + 1) ^ d ≤ (((cL : ℝ) + 1) * ((n : ℝ) + 1) ^ 5) ^ d :=
            pow_le_pow_left₀ (by positivity) hL1 d
        _ = ((cL : ℝ) + 1) ^ d * ((n : ℝ) + 1) ^ (5 * d) := by rw [mul_pow, ← pow_mul]
    have hn5 : (1 : ℝ) ≤ ((n : ℝ) + 1) ^ (5 * d) := one_le_pow₀ hn1
    calc ((time : ℝ) + 1) ≤ C * ((L : ℝ) + 1) ^ d * E + 1 := by linarith
      _ ≤ C * (((cL : ℝ) + 1) ^ d * ((n : ℝ) + 1) ^ (5 * d)) * E + 1 := by gcongr
      _ ≤ C * (((cL : ℝ) + 1) ^ d * ((n : ℝ) + 1) ^ (5 * d)) * E + ((n : ℝ) + 1) ^ (5 * d) * E := by
          nlinarith
      _ = (C * ((cL : ℝ) + 1) ^ d + 1) * ((n : ℝ) + 1) ^ (5 * d) * E := by ring
  have hxc : ((xl : ℝ) + 1) ^ c' ≤ 101 ^ c' * ((n : ℝ) + 1) ^ (4 * c') := by
    calc ((xl : ℝ) + 1) ^ c' ≤ (101 * ((n : ℝ) + 1) ^ 4) ^ c' := pow_le_pow_left₀ (by positivity) hx1 c'
      _ = 101 ^ c' * ((n : ℝ) + 1) ^ (4 * c') := by rw [mul_pow, ← pow_mul]
  have hcoef : (c' : ℝ) * (C * ((cL : ℝ) + 1) ^ d + 1) * (101 : ℝ) ^ c' ≤ (cT : ℝ) := by
    rw [hcT]; push_cast
    linarith [Nat.le_ceil ((c' : ℝ) * (C * ((cL : ℝ) + 1) ^ d + 1) * (101 : ℝ) ^ c'),
      show (0 : ℝ) ≤ 5 * d + 4 * c' by positivity]
  have hpow : ((n : ℝ) + 1) ^ (5 * d + 4 * c') ≤ ((n : ℝ) + 1) ^ cT :=
    pow_le_pow_right₀ hn1 (by rw [hcT]; omega)
  push_cast
  calc (c' : ℝ) * ((time : ℝ) + 1) * ((xl : ℝ) + 1) ^ c'
      ≤ (c' : ℝ) * ((C * ((cL : ℝ) + 1) ^ d + 1) * ((n : ℝ) + 1) ^ (5 * d) * E) *
          (101 ^ c' * ((n : ℝ) + 1) ^ (4 * c')) := by gcongr
    _ = ((c' : ℝ) * (C * ((cL : ℝ) + 1) ^ d + 1) * (101 : ℝ) ^ c') * ((n : ℝ) + 1) ^ (5 * d + 4 * c') * E := by
        rw [pow_add]; ring
    _ ≤ (cT : ℝ) * ((n : ℝ) + 1) ^ cT * E := by gcongr

/-- From `ClaimAt 3`: one FinTM2 decides 3-SAT within A·2^{δn} steps for every δ > 0. -/
theorem subexpTM_of_claimAt3 (h : SqrtLogSpace.ClaimAt 3) : Sat3.SubexpTM := by
  obtain ⟨P, countTape, answerTape, C, A, S, d, e, hC, hA, hS, hd, he, hrun⟩ := h
  obtain ⟨pre, hpre, hspec⟩ := frontEnd_exists
  obtain ⟨cL, hcL⟩ := formulaBitLength_poly' 3
  haveI hP : IsPolyT (stepped P pre) := isPolyT_stepped P pre hpre
  obtain ⟨d', hd'⟩ := exists_pow_bound (8 * ⌈S⌉₊ * (cL + 1) ^ e + 5 * e) (8 * (P.tapeCount + P.stateCount + 1))
  obtain ⟨N, c', hfin, hN⟩ := Groundwork.exists_tm (stepped P pre) d'
  refine ⟨N, hfin, fun δ hδ => ?_⟩
  obtain ⟨A', hA'⟩ := exists_const_exp_bound
    (⌈(c' : ℝ) * (C * ((cL : ℝ) + 1) ^ d + 1) * (101 : ℝ) ^ c'⌉₊ + 5 * d + 4 * c') A δ hA (by exact_mod_cast hδ)
  refine ⟨A', fun n φ hφ => ?_⟩
  have hw : SAT.WidthAtMost 3 (toFinsetCNF φ) := toFinsetCNF_width φ hφ
  obtain ⟨time, final, htr, -, -, hstate, -, -, htime, hspace⟩ := hrun n (toFinsetCNF φ) hw
  refine ⟨decide (0 < SAT.count (toFinsetCNF φ)), ?_, ?_⟩
  · rw [decide_eq_true_iff]
    exact (satisfiable_iff_count_pos φ).symm
  · have hpre' := hspec n φ hφ
    have hLle : Encoding.formulaBitLength (toFinsetCNF φ) ≤ cL * (n + 1) ^ 5 := hcL n (toFinsetCNF φ) hw
    have hxn : n + 1 ≤ (Sat3.enc φ).length := by simp [Sat3.enc]
    have hxle : (Sat3.enc φ).length ≤ 100 * (n + 1) ^ 4 := enc_length_le φ hφ
    -- the visited space along the run, as a natural number
    have hVle : ∀ (m : ℕ), m ≤ time → ∀ (c : SqrtLogSpace.LocatedCfg P),
        Computation.Trace (SqrtLogSpace.locatedStep P) m (SqrtLogSpace.locatedInit P (pre (Sat3.enc φ))) c →
        SqrtLogSpace.visitedSpace c ≤ ⌈S⌉₊ * (Encoding.formulaBitLength (toFinsetCNF φ) + 1) ^ e := by
      intro m hm c htc
      rw [hpre'] at htc
      have h1 := hspace m c hm htc
      have h2 : (SqrtLogSpace.visitedSpace c : ℝ) ≤
          ((⌈S⌉₊ * (Encoding.formulaBitLength (toFinsetCNF φ) + 1) ^ e : ℕ) : ℝ) := by
        push_cast
        exact h1.trans (by gcongr; exact Nat.le_ceil S)
      exact_mod_cast h2
    have htr' : Computation.Trace (SqrtLogSpace.locatedStep P) time
        (SqrtLogSpace.locatedInit P (pre (Sat3.enc φ))) final := by rw [hpre']; exact htr
    have hruns : (stepped P pre).Runs (Sat3.enc φ) time
        (8 * (⌈S⌉₊ * (Encoding.formulaBitLength (toFinsetCNF φ) + 1) ^ e + P.tapeCount + P.stateCount + 1))
        (decide (0 < SAT.count (toFinsetCNF φ))) :=
      reaches_of_trace P pre (Sat3.enc φ) _ _ final hstate time hVle time _ htr' 0 _ (by omega)
        (rel_init P _) (Computation.Trace.refl _)
    have hsize := size_bound_nat S e cL n _ (Sat3.enc φ).length P.tapeCount P.stateCount hLle hxn
    have hout := hN (Sat3.enc φ) time _ _ hruns ((hsize.trans (hd' _)).trans (le_of_eq rfl))
    refine outputs_mono hout ?_
    -- the step bound is below A'·2^{δ n}
    apply Nat.le_floor
    have hreal := time_bound_real c' d cL C A hC hA n _ (Sat3.enc φ).length time hLle hxle htime
    exact hreal.trans (hA' n)

/-- **The bridge.** OpenAI's claim implies Anthropic's `ETHIsFalse`. -/
theorem ethIsFalse_of_claim (h : SqrtLogSpace.Claim) : MainResults.ETHIsFalse :=
  ethIsFalse_of_subexpTM (subexpTM_of_claimAt3 (h 3 (by norm_num)))

end Bridge
