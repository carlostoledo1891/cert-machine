import OAI.Bridges.AnthropicETH.Simulation.Machine

/-!
# RPI-378.3b, part 2: what each statement of the program does

`TM2.stepAux` runs one statement to its `goto` or `halt`. This file computes that for the three
compound statements (`peekAll`, `writeAll`, `popAll`) and for one tape update (`writeOne`), and
proves the tape representation invariant `Rep` survives one step of the simulated machine.

Stack contents are described by their values at named stacks (`S (.left i)`, `S (.right i)`,
`S .inp`, `S .out`), so the dependent stack alphabets stay out of the way.
-/

namespace OAI.Bridges.AnthropicETH.Sim

open OAI.ParityWL.Complexity Turing

variable (M : Machine)

/-- The stacks of the simulating machine. -/
abbrev Stacks := (k : Stk (M.tapes + 1)) → List (Γ M k)

/-! ## Generic facts -/

theorem head?_getD {α : Type} (l : List α) (d : α) : l.head?.getD d = l.getD 0 d := by
  cases l <;> rfl

theorem getD_tail {α : Type} (l : List α) (j : ℕ) (d : α) : l.tail.getD j d = l.getD (j + 1) d := by
  cases l <;> simp

/-! ## Tape representation -/

/-- Tape contents `f` with head `h` are held by `L` (cells `h-1, h-2, …`) and `R` (cells
`h, h+1, …`); cells past the end of a list are blank. -/
def Rep (f : ℤ → Sym M) (h : ℤ) (L R : List (Sym M)) : Prop :=
  (∀ j : ℕ, f (h + j) = R.getD j (blank M)) ∧ (∀ j : ℕ, f (h - 1 - j) = L.getD j (blank M))

/-- The new left stack after writing `a.1` and moving by `a.2`. -/
def tapeL (a : Sym M × Move) (L _R : List (Sym M)) : List (Sym M) :=
  match a.2 with
  | .left => L.tail
  | .right => a.1 :: L
  | .stay => L

/-- The new right stack after writing `a.1` and moving by `a.2`. -/
def tapeR (a : Sym M × Move) (L R : List (Sym M)) : List (Sym M) :=
  match a.2 with
  | .left => L.getD 0 (blank M) :: a.1 :: R.tail
  | .right => R.tail
  | .stay => a.1 :: R.tail

theorem tape_length (a : Sym M × Move) (L R : List (Sym M)) :
    (tapeL M a L R).length + (tapeR M a L R).length ≤ L.length + R.length + 2 := by
  obtain ⟨w, mv⟩ := a
  cases mv <;> cases L <;> cases R <;> simp [tapeL, tapeR] <;> omega

/-- **One tape step.** Writing `a.1` at the head and moving by `a.2` keeps the representation. -/
theorem rep_step {f : ℤ → Sym M} {h : ℤ} {L R : List (Sym M)} (hr : Rep M f h L R)
    (a : Sym M × Move) :
    Rep M (fun z => if z = h then a.1 else f z) (h + a.2.offset) (tapeL M a L R) (tapeR M a L R) := by
  have hR : ∀ (j : ℕ) (z : ℤ), z = h + j → f z = R.getD j (blank M) := by
    rintro j z rfl; exact hr.1 j
  have hL : ∀ (j : ℕ) (z : ℤ), z = h - 1 - j → f z = L.getD j (blank M) := by
    rintro j z rfl; exact hr.2 j
  obtain ⟨w, mv⟩ := a
  cases mv
  · -- left
    refine ⟨fun j => ?_, fun j => ?_⟩
    · dsimp only [Move.offset, tapeR]
      rcases j with _ | _ | j
      · split_ifs with hz
        · push_cast at hz; omega
        · rw [hL 0 _ (by push_cast; ring)]; rfl
      · split_ifs with hz
        · rfl
        · push_cast at hz; omega
      · split_ifs with hz
        · push_cast at hz; omega
        · rw [hR (j + 1) _ (by push_cast; ring)]; simp
    · dsimp only [Move.offset, tapeL]
      split_ifs with hz
      · omega
      · rw [hL (j + 1) _ (by push_cast; ring), getD_tail]
  · -- stay
    refine ⟨fun j => ?_, fun j => ?_⟩
    · dsimp only [Move.offset, tapeR]
      rcases j with _ | j
      · split_ifs with hz
        · rfl
        · simp at hz
      · split_ifs with hz
        · push_cast at hz; omega
        · rw [hR (j + 1) _ (by push_cast; ring)]; simp
    · dsimp only [Move.offset, tapeL]
      split_ifs with hz
      · omega
      · rw [hL j _ (by ring)]
  · -- right
    refine ⟨fun j => ?_, fun j => ?_⟩
    · dsimp only [Move.offset, tapeR]
      split_ifs with hz
      · omega
      · rw [hR (j + 1) _ (by push_cast; ring), getD_tail]
    · dsimp only [Move.offset, tapeL]
      rcases j with _ | j
      · split_ifs with hz
        · rfl
        · push_cast at hz; omega
      · split_ifs with hz
        · push_cast at hz; omega
        · rw [hL j _ (by push_cast; ring)]; simp

/-! ## `peekAll` -/

/-- The symbol under the head of tape `j`, read off `right j`. -/
def rd (S : Stacks M) (j : Tp M) : Sym M := (S (.right j)).head?.getD (blank M)

theorem stepAux_peekAll (is : List (Tp M)) (k : St M) (v : Var M) (S : Stacks M) :
    TM2.stepAux (peekAll M is k) v S =
      TM2.stepAux k { v with scan := fun j => if j ∈ is then rd M S j else v.scan j } S := by
  induction is generalizing v with
  | nil => simp [peekAll]
  | cons i is ih =>
    simp only [peekAll, TM2.stepAux]
    rw [ih]
    congr 2
    funext j
    by_cases hj : j ∈ is
    · simp [hj]
    · by_cases hji : j = i
      · subst hji; simp [hj, rd]
      · simp [hj, hji]

/-! ## `writeOne` and `writeAll` -/

/-- The internal state after `writeOne`: only `tmp` may change. -/
def afterWrite (a : Sym M × Move) (L : List (Sym M)) (v : Var M) : Var M :=
  match a.2 with
  | .left => { v with tmp := L.getD 0 (blank M) }
  | _ => v

/-- The stacks after `writeOne` on tape `i` with action `a`. -/
def wstk (i : Tp M) (a : Sym M × Move) (S : Stacks M) : Stacks M :=
  Function.update (Function.update S (.left i) (tapeL M a (S (.left i)) (S (.right i))))
    (.right i) (tapeR M a (S (.left i)) (S (.right i)))

theorem wstk_left (i : Tp M) (a) (S : Stacks M) :
    wstk M i a S (.left i) = tapeL M a (S (.left i)) (S (.right i)) := by
  simp [wstk, Function.update_of_ne]

theorem wstk_right (i : Tp M) (a) (S : Stacks M) :
    wstk M i a S (.right i) = tapeR M a (S (.left i)) (S (.right i)) := by
  simp [wstk]

theorem wstk_other (i : Tp M) (a) (S : Stacks M) (k : Stk (M.tapes + 1))
    (h1 : k ≠ .left i) (h2 : k ≠ .right i) : wstk M i a S k = S k := by
  simp [wstk, Function.update_of_ne h1, Function.update_of_ne h2]

theorem stepAux_writeOne (i : Tp M) (k : St M) (v : Var M) (S : Stacks M) :
    TM2.stepAux (writeOne M i k) v S =
      TM2.stepAux k (afterWrite M (act M v i) (S (.left i)) v) (wstk M i (act M v i) S) := by
  unfold writeOne
  rcases h : act M v i with ⟨w, mv⟩
  simp only [TM2.stepAux]
  cases mv
  · simp only [h, decide_true, Bool.cond_true, afterWrite, Function.update_self]
    congr 1
    · simp [Function.update_of_ne, head?_getD]
    · funext k'
      rcases k' with _ | _ | j | j
      · simp [wstk, Function.update_of_ne]
      · simp [wstk, Function.update_of_ne]
      · by_cases hj : j = i
        · subst hj; simp [wstk, tapeL, Function.update_of_ne]
        · simp [wstk, hj, Function.update_of_ne]
      · by_cases hj : j = i
        · subst hj; simp [wstk, tapeR, Function.update_of_ne, head?_getD]
        · simp [wstk, hj, Function.update_of_ne]
  · simp only [h, afterWrite]
    simp only [show decide ((Move.stay : Move) = Move.left) = false by decide,
      show decide ((Move.stay : Move) = Move.right) = false by decide, Bool.cond_false]
    congr 1
    funext k'
    rcases k' with _ | _ | j | j
    · simp [wstk, Function.update_of_ne]
    · simp [wstk, Function.update_of_ne]
    · by_cases hj : j = i
      · subst hj; simp [wstk, tapeL, Function.update_of_ne]
      · simp [wstk, hj, Function.update_of_ne]
    · by_cases hj : j = i
      · subst hj; simp [wstk, tapeR]
      · simp [wstk, hj, Function.update_of_ne]
  · simp only [h, afterWrite]
    simp only [show decide ((Move.right : Move) = Move.left) = false by decide,
      decide_true, Bool.cond_false, Bool.cond_true]
    congr 1
    funext k'
    rcases k' with _ | _ | j | j
    · simp [wstk, Function.update_of_ne]
    · simp [wstk, Function.update_of_ne]
    · by_cases hj : j = i
      · subst hj; simp [wstk, tapeL, Function.update_of_ne]
      · simp [wstk, hj, Function.update_of_ne]
    · by_cases hj : j = i
      · subst hj; simp [wstk, tapeR, Function.update_of_ne]
      · simp [wstk, hj, Function.update_of_ne]

theorem act_afterWrite (a : Sym M × Move) (L : List (Sym M)) (v : Var M) (i : Tp M) :
    act M (afterWrite M a L v) i = act M v i := by
  unfold afterWrite; split <;> rfl

theorem next_afterWrite (a : Sym M × Move) (L : List (Sym M)) (v : Var M) :
    next M (afterWrite M a L v) = next M v := by
  unfold afterWrite; split <;> rfl

/-- The stacks after `writeAll` over the listed tapes. -/
def wAll (A : Tp M → Sym M × Move) : List (Tp M) → Stacks M → Stacks M
  | [], S => S
  | i :: is, S => wAll A is (wstk M i (A i) S)

theorem wAll_left (A : Tp M → Sym M × Move) (is : List (Tp M)) (hnd : is.Nodup) (S : Stacks M)
    (j : Tp M) :
    wAll M A is S (.left j) =
      if j ∈ is then tapeL M (A j) (S (.left j)) (S (.right j)) else S (.left j) := by
  induction is generalizing S with
  | nil => simp [wAll]
  | cons i is ih =>
    simp only [wAll]
    rw [ih (List.nodup_cons.1 hnd).2]
    by_cases hj : j = i
    · subst hj
      simp [(List.nodup_cons.1 hnd).1, wstk_left]
    · by_cases hjs : j ∈ is
      · simp [hjs, wstk_other M i _ S (.left j) (by simpa using hj) (by simp),
          wstk_other M i _ S (.right j) (by simp) (by simpa using hj)]
      · simp [hjs, hj, wstk_other M i _ S (.left j) (by simpa using hj) (by simp)]

theorem wAll_right (A : Tp M → Sym M × Move) (is : List (Tp M)) (hnd : is.Nodup) (S : Stacks M)
    (j : Tp M) :
    wAll M A is S (.right j) =
      if j ∈ is then tapeR M (A j) (S (.left j)) (S (.right j)) else S (.right j) := by
  induction is generalizing S with
  | nil => simp [wAll]
  | cons i is ih =>
    simp only [wAll]
    rw [ih (List.nodup_cons.1 hnd).2]
    by_cases hj : j = i
    · subst hj
      simp [(List.nodup_cons.1 hnd).1, wstk_right]
    · by_cases hjs : j ∈ is
      · simp [hjs, wstk_other M i _ S (.left j) (by simpa using hj) (by simp),
          wstk_other M i _ S (.right j) (by simp) (by simpa using hj)]
      · simp [hjs, hj, wstk_other M i _ S (.right j) (by simp) (by simpa using hj)]

theorem wAll_inp (A : Tp M → Sym M × Move) (is : List (Tp M)) (S : Stacks M) :
    wAll M A is S .inp = S .inp := by
  induction is generalizing S with
  | nil => rfl
  | cons i is ih => simp only [wAll]; rw [ih, wstk_other M i _ S .inp (by simp) (by simp)]

theorem wAll_out (A : Tp M → Sym M × Move) (is : List (Tp M)) (S : Stacks M) :
    wAll M A is S .out = S .out := by
  induction is generalizing S with
  | nil => rfl
  | cons i is ih => simp only [wAll]; rw [ih, wstk_other M i _ S .out (by simp) (by simp)]

/-- `writeAll` changes only `tmp` in the internal state, and the stacks as `wAll`. -/
theorem stepAux_writeAll (is : List (Tp M)) (k : St M) (v : Var M) (S : Stacks M) :
    ∃ v' : Var M, next M v' = next M v ∧
      TM2.stepAux (writeAll M is k) v S = TM2.stepAux k v' (wAll M (act M v) is S) := by
  induction is generalizing v S with
  | nil => exact ⟨v, rfl, rfl⟩
  | cons i is ih =>
    simp only [writeAll, wAll]
    rw [stepAux_writeOne]
    obtain ⟨v', hv', he⟩ := ih (afterWrite M (act M v i) (S (.left i)) v) (wstk M i (act M v i) S)
    refine ⟨v', hv'.trans (next_afterWrite M _ _ v), ?_⟩
    rw [he]
    congr 2
    funext j
    exact act_afterWrite M _ _ v j

/-! ## `popAll` -/

/-- Some listed tape has a nonempty work stack. -/
def anyNonempty (S : Stacks M) (is : List (Tp M)) : Prop :=
  ∃ j ∈ is, S (.left j) ≠ [] ∨ S (.right j) ≠ []

/-- The stacks after `popAll`: one symbol removed from each listed work stack. -/
def pAll : List (Tp M) → Stacks M → Stacks M
  | [], S => S
  | i :: is, S => pAll is (Function.update (Function.update S (.left i) (S (.left i)).tail)
      (.right i) (S (.right i)).tail)

theorem pAll_left (is : List (Tp M)) (hnd : is.Nodup) (S : Stacks M) (j : Tp M) :
    pAll M is S (.left j) = if j ∈ is then (S (.left j)).tail else S (.left j) := by
  induction is generalizing S with
  | nil => simp [pAll]
  | cons i is ih =>
    simp only [pAll]
    rw [ih (List.nodup_cons.1 hnd).2]
    by_cases hj : j = i
    · subst hj; simp [(List.nodup_cons.1 hnd).1, Function.update_of_ne]
    · simp [hj, Function.update_of_ne]

theorem pAll_right (is : List (Tp M)) (hnd : is.Nodup) (S : Stacks M) (j : Tp M) :
    pAll M is S (.right j) = if j ∈ is then (S (.right j)).tail else S (.right j) := by
  induction is generalizing S with
  | nil => simp [pAll]
  | cons i is ih =>
    simp only [pAll]
    rw [ih (List.nodup_cons.1 hnd).2]
    by_cases hj : j = i
    · subst hj; simp [(List.nodup_cons.1 hnd).1]
    · simp [hj, Function.update_of_ne]

theorem pAll_inp (is : List (Tp M)) (S : Stacks M) : pAll M is S .inp = S .inp := by
  induction is generalizing S with
  | nil => rfl
  | cons i is ih => simp only [pAll]; rw [ih]; simp [Function.update_of_ne]

theorem pAll_out (is : List (Tp M)) (S : Stacks M) : pAll M is S .out = S .out := by
  induction is generalizing S with
  | nil => rfl
  | cons i is ih => simp only [pAll]; rw [ih]; simp [Function.update_of_ne]

theorem anyNonempty_cons (S : Stacks M) (i : Tp M) (is : List (Tp M)) :
    anyNonempty M S (i :: is) ↔ (S (.left i) ≠ [] ∨ S (.right i) ≠ []) ∨ anyNonempty M S is := by
  simp [anyNonempty]

theorem anyNonempty_congr {S S' : Stacks M} {is : List (Tp M)}
    (hl : ∀ j ∈ is, S' (.left j) = S (.left j)) (hr : ∀ j ∈ is, S' (.right j) = S (.right j)) :
    anyNonempty M S' is ↔ anyNonempty M S is := by
  unfold anyNonempty
  constructor <;> rintro ⟨j, hj, h⟩ <;> refine ⟨j, hj, ?_⟩
  · rwa [hl j hj, hr j hj] at h
  · rwa [hl j hj, hr j hj]

theorem stepAux_popAll (is : List (Tp M)) (hnd : is.Nodup) (k : St M) (v : Var M)
    (S : Stacks M) :
    ∃ fl : Bool, (fl = true ↔ v.flag = true ∨ anyNonempty M S is) ∧
      TM2.stepAux (popAll M is k) v S = TM2.stepAux k { v with flag := fl } (pAll M is S) := by
  induction is generalizing v S with
  | nil => exact ⟨v.flag, by simp [anyNonempty], rfl⟩
  | cons i is ih =>
    have hi : i ∉ is := (List.nodup_cons.1 hnd).1
    simp only [popAll, pAll, TM2.stepAux]
    set S1 := Function.update S (.left i) (S (.left i)).tail with hS1
    have hS : S1 (.right i) = S (.right i) := by simp [S1, Function.update_of_ne]
    set S2 := Function.update S1 (.right i) (S1 (.right i)).tail with hS2
    obtain ⟨fl, hfl, he⟩ := ih (List.nodup_cons.1 hnd).2
      { v with flag := v.flag || (S (.left i)).head?.isSome || (S1 (.right i)).head?.isSome } S2
    have hcong : anyNonempty M S2 is ↔ anyNonempty M S is := by
      apply anyNonempty_congr
      · intro j hj
        have hji : j ≠ i := fun e => hi (e ▸ hj)
        simp [S2, S1, Function.update_of_ne, hji]
      · intro j hj
        have hji : j ≠ i := fun e => hi (e ▸ hj)
        simp [S2, S1, Function.update_of_ne, hji]
    refine ⟨fl, ?_, ?_⟩
    · rw [hfl, hcong, anyNonempty_cons, hS]
      simp only [Bool.or_eq_true, Option.isSome_iff_ne_none, ne_eq, List.head?_eq_none_iff]
      tauto
    · rw [he]; rfl

end OAI.Bridges.AnthropicETH.Sim
