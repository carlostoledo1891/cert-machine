import OAI.Bridges.AnthropicETH.Simulation.Steps

/-!
# RPI-378.3b, part 3: the run of the simulating machine, and H1

The run of `toFinTM2 M` on input `x` has four phases. With `s₀` the first step at which `M` is in
an output state:

| phase | label | Mathlib steps | invariant |
|---|---|---|---|
| copy input to `left 0` | `load1` | `|x| + 1` | `load1_spec` |
| copy it to `right 0` as `M`'s symbols | `load2` | `|x| + 1` | `load2_spec` |
| simulate `M`, one step per step | `sim` | `s₀` | `SimInv` (`sim_step`) |
| see the output state | `sim` | `1` | `sim_to_clean` |
| empty the work stacks, write the answer, halt | `clean` | `≤ |x| + 2 s₀ + 1` | `CleanInv` (`clean_spec`) |

The total is at most `3|x| + 3 s₀ + 4 ≤ 4 (|x| + s + 1)`, so `K = 4` for every machine
(`toTM2_outputsInTime`), which discharges `SimulationHypothesis` (`simulationHypothesis_proved`).
-/

namespace OAI.Bridges.AnthropicETH.Sim

open OAI.ParityWL.Complexity Turing

variable (M : Machine)

/-! ## Runs -/

/-- Configurations of the simulating machine. -/
abbrev SCfg := TM2.Cfg (Γ M) Lbl (Var M)

/-- `c` reaches `c'` in exactly `n` steps (Mathlib's `EvalsTo` iteration). -/
def Reach (c : SCfg M) (n : ℕ) (c' : SCfg M) : Prop :=
  (flip bind (TM2.step (prog M)))^[n] (some c) = some c'

theorem reach_zero (c : SCfg M) : Reach M c 0 c := rfl

theorem reach_one (l : Lbl) (v : Var M) (S : Stacks M) :
    Reach M ⟨some l, v, S⟩ 1 (TM2.stepAux (prog M l) v S) := rfl

theorem reach_one_of {l : Lbl} {v : Var M} {S : Stacks M} {c' : SCfg M}
    (h : TM2.stepAux (prog M l) v S = c') : Reach M ⟨some l, v, S⟩ 1 c' := h ▸ reach_one M l v S

theorem Reach.trans {c c' c'' : SCfg M} {n m : ℕ} (h1 : Reach M c n c') (h2 : Reach M c' m c'') :
    Reach M c (n + m) c'' := by
  unfold Reach at *
  rw [Nat.add_comm n m, Function.iterate_add_apply, h1, h2]

/-! ## Phase 1: `load1` -/

theorem load1_spec (y : List Bool) :
    ∀ (z : List (Sym M)) (v : Var M) (S : Stacks M), S .inp = y → S (.left 0) = z →
      ∃ (v' : Var M) (S' : Stacks M),
        Reach M ⟨some .load1, v, S⟩ (y.length + 1) ⟨some .load2, v', S'⟩ ∧ S' .inp = [] ∧
        S' (.left 0) = (y.map (inputSymbol M)).reverse ++ z ∧
        ∀ k, k ≠ .inp → k ≠ .left 0 → S' k = S k := by
  induction y with
  | nil =>
    intro z v S hy hz
    refine ⟨{ v with tmp := inputSymbol M false, flag := false }, Function.update S .inp [],
      reach_one_of M ?_, by simp, ?_, ?_⟩
    · simp [prog, hy]
    · simp [Function.update_of_ne, hz]
    · intro k hk _; simp [Function.update_of_ne hk]
  | cons b y ih =>
    intro z v S hy hz
    have hstep : TM2.stepAux (prog M .load1) v S =
        ⟨some .load1, { v with tmp := inputSymbol M b, flag := true },
          Function.update (Function.update S .inp y) (.left 0) (inputSymbol M b :: z)⟩ := by
      simp [prog, hy, hz, Function.update_of_ne]
    obtain ⟨v', S', hR, h1, h2, h3⟩ := ih (inputSymbol M b :: z) _
      (Function.update (Function.update S .inp y) (.left 0) (inputSymbol M b :: z))
      (by simp [Function.update_of_ne]) (by simp)
    refine ⟨v', S', ?_, h1, by simp [h2], fun k hk1 hk2 => ?_⟩
    · have h := (reach_one_of M hstep).trans M hR
      rwa [show 1 + (y.length + 1) = (b :: y).length + 1 by simp; omega] at h
    · rw [h3 k hk1 hk2]; simp [Function.update_of_ne hk1, Function.update_of_ne hk2]

/-! ## Phase 2: `load2` -/

theorem load2_spec (u : List (Sym M)) :
    ∀ (w : List (Sym M)) (v : Var M) (S : Stacks M), S (.left 0) = u → S (.right 0) = w →
      ∃ S' : Stacks M,
        Reach M ⟨some .load2, v, S⟩ (u.length + 1) ⟨some .sim, Var.init M, S'⟩ ∧
        S' (.left 0) = [] ∧ S' (.right 0) = u.reverse ++ w ∧
        ∀ k, k ≠ .left 0 → k ≠ .right 0 → S' k = S k := by
  induction u with
  | nil =>
    intro w v S hu hw
    refine ⟨Function.update S (.left 0) [], reach_one_of M ?_, by simp, ?_, ?_⟩
    · simp [prog, hu]
    · simp [Function.update_of_ne, hw]
    · intro k hk _; simp [Function.update_of_ne hk]
  | cons a u ih =>
    intro w v S hu hw
    have hstep : TM2.stepAux (prog M .load2) v S =
        ⟨some .load2, { v with tmp := a, flag := true },
          Function.update (Function.update S (.left 0) u) (.right 0) (a :: w)⟩ := by
      simp [prog, hu, hw, Function.update_of_ne]
    obtain ⟨S', hR, h1, h2, h3⟩ := ih (a :: w) _
      (Function.update (Function.update S (.left 0) u) (.right 0) (a :: w))
      (by simp [Function.update_of_ne]) (by simp)
    refine ⟨S', ?_, h1, by simp [h2], fun k hk1 hk2 => ?_⟩
    · have h := (reach_one_of M hstep).trans M hR
      rwa [show 1 + (u.length + 1) = (a :: u).length + 1 by simp; omega] at h
    · rw [h3 k hk1 hk2]; simp [Function.update_of_ne hk1, Function.update_of_ne hk2]

/-! ## Phase 3: `sim` -/

/-- The stacks represent configuration `c` of `M`, with at most `B` symbols per tape. -/
def SimInv (c : Configuration M) (S : Stacks M) (B : ℕ) : Prop :=
  S .inp = [] ∧ S .out = [] ∧
    ∀ i, Rep M (c.tape i) (c.head i) (S (.left i)) (S (.right i)) ∧
      (S (.left i)).length + (S (.right i)).length ≤ B

theorem step_of_output_none {c : Configuration M} (h : M.output c.state = none) :
    step M c =
      { state := (M.transition c.state (fun i => c.tape i (c.head i))).1
        head := fun i => c.head i + ((M.transition c.state (fun i => c.tape i (c.head i))).2 i).2.offset
        tape := fun i z => if z = c.head i then
            ((M.transition c.state (fun i => c.tape i (c.head i))).2 i).1 else c.tape i z } := by
  unfold step; rw [h]

/-- **One simulated step.** From a non-output state, one Mathlib step carries the invariant from
`c` to `step M c`, adding at most two symbols per tape. -/
theorem sim_step (c : Configuration M) (S : Stacks M) (B : ℕ) (hinv : SimInv M c S B)
    (hout : M.output c.state = none) :
    ∃ S' : Stacks M, Reach M ⟨some .sim, Var.at M c.state, S⟩ 1
        ⟨some .sim, Var.at M (step M c).state, S'⟩ ∧ SimInv M (step M c) S' (B + 2) := by
  obtain ⟨hinp, hout', htape⟩ := hinv
  have hrd : rd M S = fun i => c.tape i (c.head i) := by
    funext i
    have := (htape i).1.1 0
    simp only [Nat.cast_zero, add_zero] at this
    rw [this, rd, head?_getD]
  set v1 : Var M := ⟨c.state, rd M S, 0, false⟩ with hv1
  have hpeek : TM2.stepAux (prog M .sim) (Var.at M c.state) S =
      TM2.stepAux (writeAll M (List.finRange (M.tapes + 1))
        (.load (next M) (.goto fun _ => .sim))) v1 S := by
    simp only [prog, TM2.stepAux, Var.at, hout, Option.isSome_none, Bool.cond_false]
    rw [stepAux_peekAll]
    simp [hv1, List.mem_finRange]
  obtain ⟨v2, hv2, hw⟩ := stepAux_writeAll M (List.finRange (M.tapes + 1))
    (.load (next M) (.goto fun _ => .sim)) v1 S
  have hact : act M v1 = (M.transition c.state (fun i => c.tape i (c.head i))).2 := by
    funext i; simp [act, hv1, hrd]
  have hnext : next M v2 = Var.at M (step M c).state := by
    rw [hv2, step_of_output_none M hout]; simp [next, hv1, hrd]
  refine ⟨wAll M (act M v1) (List.finRange (M.tapes + 1)) S, reach_one_of M ?_, ?_⟩
  · rw [hpeek, hw]; simp [TM2.stepAux, hnext]
  · refine ⟨by rw [wAll_inp, hinp], by rw [wAll_out, hout'], fun i => ?_⟩
    rw [wAll_left M _ _ (List.nodup_finRange _), wAll_right M _ _ (List.nodup_finRange _)]
    simp only [List.mem_finRange, ↓reduceIte]
    refine ⟨?_, ?_⟩
    · rw [step_of_output_none M hout, hact]
      exact rep_step M (htape i).1 _
    · have := tape_length M (act M v1 i) (S (.left i)) (S (.right i))
      have := (htape i).2
      omega

/-- In an output state, `sim` hands over to `clean` without touching the stacks. -/
theorem sim_to_clean (q : Fin (M.extraStates + 1)) (S : Stacks M) (hq : (M.output q).isSome) :
    Reach M ⟨some .sim, Var.at M q, S⟩ 1 ⟨some .clean, Var.at M q, S⟩ :=
  reach_one_of M (by simp [prog, Var.at, hq])

/-! ## Phase 4: `clean` -/

/-- Input and output stacks empty, work stacks of length at most `m`. -/
def CleanInv (S : Stacks M) (m : ℕ) : Prop :=
  S .inp = [] ∧ S .out = [] ∧ ∀ i, (S (.left i)).length ≤ m ∧ (S (.right i)).length ≤ m

/-- The stacks at the end: `[b]` on the output stack, all others empty. -/
def outStk (b : Bool) : Stacks M := fun k =>
  match k with
  | .out => [b]
  | .inp => []
  | .left _ => []
  | .right _ => []

/-- The `clean` statement after its pops. -/
abbrev cleanTail : St M :=
  .branch (fun v => v.flag)
    (.load (fun v => { v with flag := false }) (.goto fun _ => .clean))
    (.push .out (fun v => (M.output v.q).getD false) (.load (fun _ => Var.init M) .halt))

theorem clean_done (q : Fin (M.extraStates + 1)) (b : Bool) (hq : M.output q = some b)
    (S : Stacks M) (hS : CleanInv M S 0 ∨ (S .inp = [] ∧ S .out = [] ∧
      ¬ anyNonempty M S (List.finRange (M.tapes + 1)))) :
    Reach M ⟨some .clean, Var.at M q, S⟩ 1 ⟨none, Var.init M, outStk M b⟩ := by
  have hS' : S .inp = [] ∧ S .out = [] ∧ ¬ anyNonempty M S (List.finRange (M.tapes + 1)) := by
    rcases hS with ⟨h1, h2, h3⟩ | h
    · refine ⟨h1, h2, ?_⟩
      rintro ⟨j, -, hj | hj⟩
      · exact hj (List.length_eq_zero_iff.1 (Nat.le_zero.1 (h3 j).1))
      · exact hj (List.length_eq_zero_iff.1 (Nat.le_zero.1 (h3 j).2))
    · exact h
  obtain ⟨hinp, hout, hne⟩ := hS'
  have hempty : ∀ j, S (.left j) = [] ∧ S (.right j) = [] := fun j => by
    by_contra h
    exact hne ⟨j, List.mem_finRange j, by tauto⟩
  obtain ⟨fl, hfl, he⟩ := stepAux_popAll M (List.finRange (M.tapes + 1)) (List.nodup_finRange _)
    (cleanTail M) (Var.at M q) S
  have hfl' : fl = false := by
    cases fl
    · rfl
    · exact absurd (hfl.1 rfl) (by simp [Var.at, hne])
  subst hfl'
  apply reach_one_of
  show TM2.stepAux (popAll M _ (cleanTail M)) _ _ = _
  rw [he]
  simp only [TM2.stepAux, Bool.cond_false, hq, Option.getD_some, Var.at]
  congr 1
  funext k
  rcases k with _ | _ | j | j
  · simp [Function.update_of_ne, pAll_inp, hinp, outStk]
  · simp [pAll_out, hout, outStk]
  · simp [Function.update_of_ne, pAll_left M _ (List.nodup_finRange _), (hempty j).1, outStk]
  · simp [Function.update_of_ne, pAll_right M _ (List.nodup_finRange _), (hempty j).2, outStk]

theorem clean_more (q : Fin (M.extraStates + 1)) (S : Stacks M)
    (hne : anyNonempty M S (List.finRange (M.tapes + 1))) :
    Reach M ⟨some .clean, Var.at M q, S⟩ 1
      ⟨some .clean, Var.at M q, pAll M (List.finRange (M.tapes + 1)) S⟩ := by
  obtain ⟨fl, hfl, he⟩ := stepAux_popAll M (List.finRange (M.tapes + 1)) (List.nodup_finRange _)
    (cleanTail M) (Var.at M q) S
  have hfl' : fl = true := hfl.2 (Or.inr hne)
  subst hfl'
  apply reach_one_of
  show TM2.stepAux (popAll M _ (cleanTail M)) _ _ = _
  rw [he]
  rfl

/-- **Cleanup.** With work stacks of length at most `m`, `clean` halts in Mathlib's final
configuration for the answer `b` within `m + 1` steps. -/
theorem clean_spec (q : Fin (M.extraStates + 1)) (b : Bool) (hq : M.output q = some b) (m : ℕ) :
    ∀ S : Stacks M, CleanInv M S m →
      ∃ k ≤ m + 1, Reach M ⟨some .clean, Var.at M q, S⟩ k ⟨none, Var.init M, outStk M b⟩ := by
  induction m with
  | zero => intro S hS; exact ⟨1, le_rfl, clean_done M q b hq S (Or.inl hS)⟩
  | succ m ih =>
    intro S hS
    obtain ⟨hinp, hout, hlen⟩ := hS
    by_cases hne : anyNonempty M S (List.finRange (M.tapes + 1))
    · have hS' : CleanInv M (pAll M (List.finRange (M.tapes + 1)) S) m := by
        refine ⟨by rw [pAll_inp, hinp], by rw [pAll_out, hout], fun i => ⟨?_, ?_⟩⟩
        · rw [pAll_left M _ (List.nodup_finRange _)]
          simp only [List.mem_finRange, ↓reduceIte, List.length_tail]
          have := (hlen i).1; omega
        · rw [pAll_right M _ (List.nodup_finRange _)]
          simp only [List.mem_finRange, ↓reduceIte, List.length_tail]
          have := (hlen i).2; omega
      obtain ⟨k, hk, hR⟩ := ih _ hS'
      refine ⟨1 + k, by omega, (clean_more M q S hne).trans M hR⟩
    · exact ⟨1, by omega, clean_done M q b hq S (Or.inr ⟨hinp, hout, hne⟩)⟩

/-! ## Start and finish in Mathlib's conventions -/

/-- The stacks at the start: `x` on the input stack, all others empty. -/
def inStk (x : List Bool) : Stacks M := fun k =>
  match k with
  | .inp => x
  | .out => []
  | .left _ => []
  | .right _ => []

theorem initList_eq (x : List Bool) :
    initList (toFinTM2 M) x = (⟨some .load1, Var.init M, inStk M x⟩ : SCfg M) := by
  unfold initList
  congr 1
  funext k
  rcases k with _ | _ | j | j <;> rfl

theorem haltList_eq (b : Bool) :
    haltList (toFinTM2 M) [b] = (⟨none, Var.init M, outStk M b⟩ : SCfg M) := by
  unfold haltList
  congr 1
  funext k
  rcases k with _ | _ | j | j <;> rfl

/-- The stacks after loading represent `M`'s initial configuration. -/
theorem simInv_init (x : List Bool) (S : Stacks M) (hinp : S .inp = []) (hout : S .out = [])
    (hl0 : S (.left 0) = []) (hr0 : S (.right 0) = x.map (inputSymbol M))
    (hl : ∀ i, i ≠ 0 → S (.left i) = []) (hr : ∀ i, i ≠ 0 → S (.right i) = []) :
    SimInv M (initialConfiguration M x) S x.length := by
  refine ⟨hinp, hout, fun i => ?_⟩
  by_cases hi : i = 0
  · subst hi
    rw [hl0, hr0]
    refine ⟨⟨fun j => ?_, fun j => ?_⟩, by simp⟩
    · simp only [initialConfiguration, Fin.val_zero, zero_add, true_and, Nat.cast_nonneg,
        ↓reduceIte, Int.toNat_natCast]
      rw [List.getD_eq_getElem?_getD, List.getElem?_map]
      cases x[j]? <;> rfl
    · simp only [initialConfiguration, Fin.val_zero, true_and, List.getD_nil]
      split_ifs with hz
      · omega
      · rfl
  · rw [hl i hi, hr i hi]
    have hv : (i : Fin (M.tapes + 1)).val ≠ 0 := fun h => hi (Fin.ext h)
    refine ⟨⟨fun j => ?_, fun j => ?_⟩, by simp⟩ <;>
      simp [initialConfiguration, hi, blank]

/-! ## The first output time -/

theorem run_succ (x : List Bool) (n : ℕ) : run M x (n + 1) = step M (run M x n) :=
  Function.iterate_succ_apply' _ _ _

theorem run_stable (x : List Bool) (n : ℕ) {b : Bool}
    (h : M.output (run M x n).state = some b) (k : ℕ) : run M x (n + k) = run M x n := by
  have hfix : step M (run M x n) = run M x n := by unfold step; rw [h]
  unfold run
  rw [add_comm, Function.iterate_add_apply]
  exact Function.iterate_fixed hfix k

/-! ## The simulation theorem -/

/-- **Linear-time simulation.** If `M` emits `b` at step `s` on input `x`, then `toTM2 M`, started
on `x`, halts with output `[b]`, all other stacks empty and its state reset, within
`4 (|x| + s + 1)` steps. -/
theorem toTM2_outputsInTime (x : List Bool) (s : ℕ) (b : Bool) (h : Emits M x s b) :
    Nonempty (TM2OutputsInTime (toTM2 M).tm (x.map (toTM2 M).inputAlphabet.invFun)
      (some ([b].map (toTM2 M).outputAlphabet.invFun)) (4 * (x.length + s + 1))) := by
  have hx : x.map (toTM2 M).inputAlphabet.invFun = x := List.map_id x
  rw [hx]
  -- first output time `s₀`
  have hp : ∃ n, (M.output (run M x n).state).isSome = true := ⟨s, by simp [Emits] at h; simp [h]⟩
  classical
  set s₀ := Nat.find hp with hs₀def
  have hs₀ : s₀ ≤ s := Nat.find_min' hp (by simp [Emits] at h; simp [h])
  have hbefore : ∀ n < s₀, M.output (run M x n).state = none := fun n hn => by
    have := Nat.find_min hp hn
    simpa using this
  obtain ⟨b₀, hb₀⟩ := Option.isSome_iff_exists.1 (Nat.find_spec hp)
  have hbb : b₀ = b := by
    have hst := run_stable M x s₀ hb₀ (s - s₀)
    rw [show s₀ + (s - s₀) = s by omega] at hst
    have he : M.output (run M x s).state = some b := h
    rw [hst, hb₀] at he
    exact Option.some_injective _ he
  subst hbb
  -- phases 1 and 2
  obtain ⟨v1, S1, hR1, h1inp, h1l0, h1o⟩ :=
    load1_spec M x [] (Var.init M) (inStk M x) rfl rfl
  obtain ⟨S2, hR2, h2l0, h2r0, h2o⟩ :=
    load2_spec M ((x.map (inputSymbol M)).reverse) (S1 (.right 0)) v1 S1 (by simp [h1l0]) rfl
  have hS2 : SimInv M (initialConfiguration M x) S2 x.length := by
    apply simInv_init M x S2
    · rw [h2o _ (by simp) (by simp), h1inp]
    · rw [h2o _ (by simp) (by simp), h1o _ (by simp) (by simp)]; rfl
    · exact h2l0
    · rw [h2r0, h1o _ (by simp) (by simp)]; simp [inStk]
    · intro i hi
      rw [h2o _ (by simpa using hi) (by simp), h1o _ (by simp) (by simpa using hi)]; rfl
    · intro i hi
      rw [h2o _ (by simp) (by simpa using hi), h1o _ (by simp) (by simp)]; rfl
  -- phase 3
  have hsim : ∀ n ≤ s₀, ∃ S : Stacks M,
      Reach M ⟨some .sim, Var.init M, S2⟩ n ⟨some .sim, Var.at M (run M x n).state, S⟩ ∧
        SimInv M (run M x n) S (x.length + 2 * n) := by
    intro n
    induction n with
    | zero => intro _; exact ⟨S2, reach_zero M _, hS2⟩
    | succ n ih =>
      intro hn
      obtain ⟨S, hR, hinv⟩ := ih (by omega)
      obtain ⟨S', hR', hinv'⟩ := sim_step M (run M x n) S _ hinv (hbefore n (by omega))
      refine ⟨S', ?_, ?_⟩
      · rw [run_succ]; exact hR.trans M hR'
      · rw [run_succ, show x.length + 2 * (n + 1) = x.length + 2 * n + 2 by ring]; exact hinv'
  obtain ⟨S3, hR3, hinv3⟩ := hsim s₀ le_rfl
  -- phase 4
  have hR4 := sim_to_clean M (run M x s₀).state S3 (by rw [hb₀]; rfl)
  have hclean : CleanInv M S3 (x.length + 2 * s₀) := by
    obtain ⟨h1, h2, h3⟩ := hinv3
    exact ⟨h1, h2, fun i => ⟨by have := (h3 i).2; omega, by have := (h3 i).2; omega⟩⟩
  obtain ⟨k, hk, hR5⟩ := clean_spec M _ b₀ hb₀ _ S3 hclean
  -- assemble
  have hR := ((((hR1.trans M hR2).trans M hR3).trans M hR4).trans M hR5)
  refine ⟨⟨⟨(x.length + 1) + ((x.map (inputSymbol M)).reverse.length + 1) + s₀ + 1 + k, ?_⟩, ?_⟩⟩
  · show (flip bind (TM2.step (prog M)))^[_] (some (initList (toFinTM2 M) x)) =
      some (haltList (toFinTM2 M) [b₀])
    rw [initList_eq, haltList_eq]
    exact hR
  · simp only [List.length_reverse, List.length_map]
    omega

/-- **RPI-378.3b.** Hypothesis H1 of RPI-378.3a holds, with `K = 4` for every machine. -/
theorem simulationHypothesis_proved : SimulationHypothesis := fun M =>
  ⟨toTM2 M, 4, toTM2_finite M, fun x s b h => toTM2_outputsInTime M x s b h⟩

end OAI.Bridges.AnthropicETH.Sim
