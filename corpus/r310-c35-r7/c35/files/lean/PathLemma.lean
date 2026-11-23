import Mathlib.Combinatorics.SimpleGraph.Clique
import Mathlib.Tactic.FinCases
import LemmaPCheck
import LemmaPCert

/-! Lemma P without native code (cert-machine, 2026-11-21).

The statement part (`K`, `core`, its decidability instance, `Feasible`, the statement of `lemma_P`) is Codex's
`path-bridge/PathLemma.lean` (sha256 ccf1e82e…69ab) verbatim, so `Outside.lean` and `OutsideSize.lean` compile against
this file unchanged. The proof is new: instead of an LRAT proof run by `native_decide`, a branching certificate (from
cert-machine's own search, `d2/lp_search.c`) is checked by a small Lean function evaluated by the kernel
(`decide +kernel`), whose soundness is proved below. Symmetry used: translation by a core vertex. -/

namespace RamseyScout.PathLemma

abbrev K := Fin 35
def core : SimpleGraph K := SimpleGraph.fromRel fun u v =>
  [1, 7, 11, 16].contains ((v.val + 35 - u.val) % 35) = true

instance : DecidableRel core.Adj := by
  unfold core SimpleGraph.fromRel
  infer_instance

/-- The three independent, disjoint neighbourhoods in Claude's obstruction. -/
structure Feasible (S : Fin 3 → Set K) : Prop where
  independent : ∀ t, core.IsIndepSet (S t)
  disjoint : ∀ i j, i ≠ j → ∀ v ∈ S i, v ∉ S j
  hits : ∀ i : Fin 2, ∀ E : Finset K, core.IsNIndepSet 8 E →
    ∃ v ∈ E, v ∈ S i.castSucc ∨ v ∈ S i.succ


/-! ## Soundness -/
open Check

set_option maxRecDepth 8192 in
theorem adj_iff : ∀ u v : K, core.Adj u v ↔ bit (adjM u.val) v.val = true := by
  decide +kernel

theorem bit_or (a b v : Nat) : bit (a ||| b) v = (bit a v || bit b v) := Nat.testBit_or a b v
theorem bit_and (a b v : Nat) : bit (a &&& b) v = (bit a v && bit b v) := Nat.testBit_and a b v
theorem bit_pow (v u : Nat) : bit (2 ^ v) u = decide (v = u) := Nat.testBit_two_pow
theorem bit_zero (v : Nat) : bit 0 v = false := Nat.zero_testBit v

theorem bit_false_of_and_zero {a b : Nat} (h : a &&& b = 0) (v : Nat) (hb : bit b v = true) :
    bit a v = false := by
  have := bit_and a b v
  rw [h, bit_zero, hb, Bool.and_true] at this
  exact this.symm

theorem bit_false_of_and_zero' {a b : Nat} (h : a &&& b = 0) (v : Nat) (ha : bit a v = true) :
    bit b v = false := by
  have := bit_and a b v
  rw [h, bit_zero, ha, Bool.true_and] at this
  exact this.symm

theorem bit_maskOf (vs : List Nat) (w : Nat) : bit (maskOf vs) w = true ↔ w ∈ vs := by
  induction vs with
  | nil => simp [maskOf, bit_zero]
  | cons v vs ih =>
    simp only [maskOf, bit_or, Bool.or_eq_true, bit_pow, decide_eq_true_eq, ih, List.mem_cons]
    exact or_congr_left eq_comm

theorem s_forbid (st : St) (v : Nat) (X Y : Fin 3) : (st.forbid v X).s Y = st.s Y := by
  fin_cases X <;> fin_cases Y <;> rfl

theorem f_add (st : St) (v : Nat) (X Y : Fin 3) : (st.add v X).f Y = st.f Y := by
  fin_cases X <;> fin_cases Y <;> rfl

theorem s_add (st : St) (v : Nat) (X Y : Fin 3) :
    (st.add v X).s Y = if X = Y then st.s Y ||| 2 ^ v else st.s Y := by
  fin_cases X <;> fin_cases Y <;> rfl

theorem f_forbid (st : St) (v : Nat) (X Y : Fin 3) :
    (st.forbid v X).f Y = if X = Y then st.f Y ||| 2 ^ v else st.f Y := by
  fin_cases X <;> fin_cases Y <;> rfl

/-- Vertex `v` (a Nat) lies in `S X`. -/
def memS (S : Fin 3 → Set K) (X : Fin 3) (v : Nat) : Prop := ∃ h : v < 35, (⟨v, h⟩ : K) ∈ S X

/-- Every configuration that this state's subtree must still account for: `S` extends the state. -/
def Covers (S : Fin 3 → Set K) (st : St) : Prop :=
  ∀ X v, (bit (st.s X) v = true → memS S X v) ∧ (bit (st.f X) v = true → ¬ memS S X v)

theorem covers_add {S : Fin 3 → Set K} {st : St} {v : Nat} {X : Fin 3} (h : Covers S st)
    (hv : memS S X v) : Covers S (st.add v X) := by
  intro Y u
  refine ⟨fun hb => ?_, fun hb => ?_⟩
  · rw [s_add] at hb
    split_ifs at hb with hXY
    · rw [bit_or, Bool.or_eq_true, bit_pow, decide_eq_true_eq] at hb
      rcases hb with hb | hb
      · exact (h Y u).1 hb
      · subst hXY; subst hb; exact hv
    · exact (h Y u).1 hb
  · rw [f_add] at hb
    exact (h Y u).2 hb

theorem covers_forbid {S : Fin 3 → Set K} {st : St} {v : Nat} {X : Fin 3} (h : Covers S st)
    (hv : ¬ memS S X v) : Covers S (st.forbid v X) := by
  intro Y u
  refine ⟨fun hb => ?_, fun hb => ?_⟩
  · rw [s_forbid] at hb
    exact (h Y u).1 hb
  · rw [f_forbid] at hb
    split_ifs at hb with hXY
    · rw [bit_or, Bool.or_eq_true, bit_pow, decide_eq_true_eq] at hb
      rcases hb with hb | hb
      · exact (h Y u).2 hb
      · subst hXY; subst hb; exact hv
    · exact (h Y u).2 hb

theorem occ_bit (st : St) (v : Nat) :
    bit (st.s0 ||| st.s1 ||| st.s2) v = (bit (st.s 0) v || bit (st.s 1) v || bit (st.s 2) v) := by
  simp only [bit_or]; rfl

theorem can_of_sat {S : Fin 3 → Set K} (hF : Feasible S) {st : St} {occ v : Nat} {X : Fin 3}
    (h : Covers S st) (hocc : ∀ u, bit occ u = (bit (st.s 0) u || bit (st.s 1) u || bit (st.s 2) u))
    (hsX : bit (st.s X) v = false) (hv : memS S X v) : can occ st v X = true := by
  obtain ⟨hv35, mv⟩ := hv
  have hall : ∀ Y, bit (st.s Y) v = false := by
    intro Y
    by_cases hY : Y = X
    · subst hY; exact hsX
    · cases hb : bit (st.s Y) v
      · rfl
      · exfalso
        obtain ⟨_, mY⟩ := (h Y v).1 hb
        exact hF.disjoint X Y (Ne.symm hY) _ mv mY
  have hf : bit (st.f X) v = false := by
    cases hb : bit (st.f X) v
    · rfl
    · exact absurd ⟨hv35, mv⟩ ((h X v).2 hb)
  have hadj : adjM v &&& st.s X = 0 := by
    apply Nat.eq_of_testBit_eq
    intro i
    rw [Nat.testBit_and, Nat.zero_testBit]
    cases hi : (st.s X).testBit i
    · simp
    · obtain ⟨hi35, mi⟩ := (h X i).1 hi
      have ne : (⟨v, hv35⟩ : K) ≠ ⟨i, hi35⟩ := by
        intro e
        have : v = i := Fin.mk.inj e
        subst this
        exact absurd hi (by simpa [bit] using hsX)
      have nadj : ¬ core.Adj ⟨v, hv35⟩ ⟨i, hi35⟩ := hF.independent X mv mi ne
      rw [adj_iff] at nadj
      simpa [bit] using nadj
  simp [can, hocc, hall 0, hall 1, hall 2, hf, hadj]

theorem kids_cover {S : Fin 3 → Set K} (hF : Feasible S) (occ : Nat) :
    ∀ (os : List (Nat × Fin 3)) (st : St), Covers S st →
      (∀ u, bit occ u = (bit (st.s 0) u || bit (st.s 1) u || bit (st.s 2) u)) →
      (∀ o ∈ os, bit (st.s o.2) o.1 = false) → (∃ o ∈ os, memS S o.2 o.1) →
      ∃ st' ∈ kids occ st os, Covers S st' := by
  intro os
  induction os with
  | nil => intro st _ _ _ hex; obtain ⟨o, ho, _⟩ := hex; cases ho
  | cons o os ih =>
    obtain ⟨v, X⟩ := o
    intro st hc hocc hfree hex
    by_cases hs : memS S X v
    · have hcan := can_of_sat hF hc hocc (hfree (v, X) List.mem_cons_self) hs
      exact ⟨st.add v X, by simp [kids, hcan], covers_add hc hs⟩
    · have hex' : ∃ o ∈ os, memS S o.2 o.1 := by
        obtain ⟨o, ho, hm⟩ := hex
        rcases List.mem_cons.mp ho with rfl | ho
        · exact absurd hm hs
        · exact ⟨o, ho, hm⟩
      have hfree' : ∀ o ∈ os, bit (st.s o.2) o.1 = false :=
        fun o ho => hfree o (List.mem_cons_of_mem _ ho)
      by_cases hcan : can occ st v X = true
      · obtain ⟨st', h1, h2⟩ := ih (st.forbid v X) (covers_forbid hc hs)
          (by intro u; simp only [s_forbid]; exact hocc u)
          (by intro o ho; rw [s_forbid]; exact hfree' o ho) hex'
        exact ⟨st', by simp [kids, hcan, h1], h2⟩
      · obtain ⟨st', h1, h2⟩ := ih st hc hocc hfree' hex'
        refine ⟨st', ?_, h2⟩
        simp only [kids, hcan]
        exact h1

theorem card_filter_mem (vs : List Nat) (hnd : vs.Nodup) (hlt : ∀ v ∈ vs, v < 35) :
    (Finset.univ.filter (fun u : K => u.val ∈ vs)).card = vs.length := by
  have hmap : (Finset.univ.filter (fun u : K => u.val ∈ vs)).map Fin.valEmbedding = vs.toFinset := by
    ext w
    simp only [Finset.mem_map, Finset.mem_filter, Finset.mem_univ, true_and, Fin.valEmbedding_apply,
      List.mem_toFinset]
    constructor
    · rintro ⟨u, hu, rfl⟩; exact hu
    · intro hw; exact ⟨⟨w, hlt w hw⟩, hw, rfl⟩
  rw [← Finset.card_map Fin.valEmbedding, hmap, List.toFinset_card_of_nodup hnd]

theorem vlist_length (x n : Nat) : (vlist x n).length = n := by
  induction n generalizing x with
  | zero => rfl
  | succ n ih => simp [vlist, ih]

theorem side_sets (side : Bool) :
    (sideSets side).1 = (if side then (1 : Fin 2) else 0).castSucc ∧
    (sideSets side).2 = (if side then (1 : Fin 2) else 0).succ := by
  cases side <;> exact ⟨rfl, rfl⟩

theorem step_cover {S : Fin 3 → Set K} (hF : Feasible S) (stk stk' : List St) (e : Nat)
    (hstep : step stk e = some stk') (hc : ∃ st ∈ stk, Covers S st) : ∃ st ∈ stk', Covers S st := by
  cases stk with
  | nil => simp [step] at hstep
  | cons st rest =>
    simp only [step] at hstep
    split_ifs at hstep with hval
    cases hstep
    obtain ⟨st0, hst0, hcov⟩ := hc
    rcases List.mem_cons.mp hst0 with rfl | hrest
    · -- the covering state is the node being expanded
      set side := e % 2 == 1
      set vs := vlist (e / 2) 8
      simp only [validE, Bool.and_eq_true, decide_eq_true_eq, List.all_eq_true, beq_iff_eq] at hval
      obtain ⟨⟨⟨hnd, hlt⟩, hind⟩, hfreeU⟩ := hval
      let E : Finset K := Finset.univ.filter (fun u : K => u.val ∈ vs)
      have hmemE : ∀ u : K, u ∈ E ↔ u.val ∈ vs := by intro u; simp [E]
      have hE : core.IsNIndepSet 8 E := by
        refine ⟨?_, ?_⟩
        · intro u hu w hw huw hadj
          have hu' : u.val ∈ vs := (hmemE u).1 hu
          have hw' : w.val ∈ vs := (hmemE w).1 hw
          have h0 := hind u.val hu'
          have := bit_false_of_and_zero h0 w.val ((bit_maskOf vs w.val).2 hw')
          rw [adj_iff] at hadj
          rw [hadj] at this
          exact Bool.noConfusion this
        · rw [card_filter_mem vs hnd hlt, vlist_length]
      obtain ⟨v, hvE, hvS⟩ := hF.hits (if side then 1 else 0) E hE
      rw [← (side_sets side).1, ← (side_sets side).2] at hvS
      have hv' : v.val ∈ vs := (hmemE v).1 hvE
      have hfree : ∀ o ∈ opts side vs, bit (st0.s o.2) o.1 = false := by
        intro o ho
        simp only [opts, List.mem_flatMap, List.mem_cons, List.not_mem_nil, or_false] at ho
        obtain ⟨w, hw, ho⟩ := ho
        have hU := bit_false_of_and_zero' hfreeU w ((bit_maskOf vs w).2 hw)
        simp only [unionOf, bit_or, Bool.or_eq_false_iff] at hU
        rcases ho with rfl | rfl
        · exact hU.1
        · exact hU.2
      have hex : ∃ o ∈ opts side vs, memS S o.2 o.1 := by
        rcases hvS with h1 | h1
        · exact ⟨(v.val, (sideSets side).1), by simp [opts]; exact ⟨v.val, hv', Or.inl rfl⟩,
            ⟨v.isLt, by simpa using h1⟩⟩
        · exact ⟨(v.val, (sideSets side).2), by simp [opts]; exact ⟨v.val, hv', Or.inr rfl⟩,
            ⟨v.isLt, by simpa using h1⟩⟩
      obtain ⟨st', h1, h2⟩ := kids_cover hF _ (opts side vs) st0 hcov (occ_bit st0) hfree hex
      exact ⟨st', List.mem_append_left _ h1, h2⟩
    · exact ⟨st0, List.mem_append_right _ hrest, hcov⟩

theorem runChunk_cover {S : Fin 3 → Set K} (hF : Feasible S) :
    ∀ (es : List Nat) (stk stk' : List St), runChunk es stk = some stk' →
      (∃ st ∈ stk, Covers S st) → ∃ st ∈ stk', Covers S st := by
  intro es
  induction es with
  | nil => intro stk stk' h hc; simp only [runChunk, Option.some.injEq] at h; subst h; exact hc
  | cons e es ih =>
    intro stk stk' h hc
    simp only [runChunk] at h
    split at h
    · cases h
    · rename_i stk'' hs
      exact ih _ _ h (step_cover hF _ _ _ hs hc)

theorem runAll_cover {S : Fin 3 → Set K} (hF : Feasible S) :
    ∀ (cs : List (List Nat)) (stk stk' : List St), runAll cs stk = some stk' →
      (∃ st ∈ stk, Covers S st) → ∃ st ∈ stk', Covers S st := by
  intro cs
  induction cs with
  | nil => intro stk stk' h hc; simp only [runAll, Option.some.injEq] at h; subst h; exact hc
  | cons c cs ih =>
    intro stk stk' h hc
    simp only [runAll] at h
    split at h
    · cases h
    · rename_i stk'' hs
      exact ih _ _ h (runChunk_cover hF _ _ _ hs hc)

theorem start_cover (S : Fin 3 → Set K) (h0 : (0 : K) ∈ S 0 ∨ S 0 = ∅) :
    ∃ st ∈ [initA, initE], Covers S st := by
  rcases h0 with h0 | h0
  · refine ⟨initA, List.mem_cons_self, ?_⟩
    intro X v
    refine ⟨fun hb => ?_, fun hb => ?_⟩
    · fin_cases X
      · have : v = 0 := by
          have := hb
          simp only [initA, St.s] at this
          rw [show (1 : Nat) = 2 ^ 0 by rfl, bit_pow, decide_eq_true_eq] at this
          exact this.symm
        subst this; exact ⟨by decide, h0⟩
      all_goals simp [initA, St.s, bit_zero] at hb
    · fin_cases X <;> simp [initA, St.f, bit_zero] at hb
  · refine ⟨initE, List.mem_cons_of_mem _ List.mem_cons_self, ?_⟩
    intro X v
    refine ⟨fun hb => ?_, fun hb => ?_⟩
    · fin_cases X <;> simp [initE, St.s, bit_zero] at hb
    · fin_cases X
      · rintro ⟨_, hm⟩
        simp only [Fin.zero_eta, Fin.isValue] at hm
        rw [h0] at hm
        exact hm
      all_goals simp [initE, St.f, bit_zero] at hb

/-! ## Translation symmetry -/

theorem translate_adj (u w t : K) : core.Adj (u + t) (w + t) ↔ core.Adj u w := by
  have key : ∀ a b : K, ((b + t).val + 35 - (a + t).val) % 35 = (b.val + 35 - a.val) % 35 := by
    intro a b
    simp only [Fin.val_add]
    have := a.isLt; have := b.isLt; have := t.isLt
    omega
  simp only [core, SimpleGraph.fromRel_adj, key, ne_eq, add_left_inj]

def shift (S : Fin 3 → Set K) (t : K) : Fin 3 → Set K := fun X => {u | u + t ∈ S X}

theorem feasible_shift {S : Fin 3 → Set K} (hF : Feasible S) (t : K) : Feasible (shift S t) := by
  refine ⟨?_, ?_, ?_⟩
  · intro X u hu w hw huw hadj
    exact hF.independent X hu hw (fun h => huw (add_right_cancel h)) ((translate_adj u w t).2 hadj)
  · intro i j hij v hv hv'
    exact hF.disjoint i j hij _ hv hv'
  · intro i E hE
    let E' := E.map (addRightEmbedding t)
    have hE' : core.IsNIndepSet 8 E' := by
      refine ⟨?_, by simp [E', hE.card_eq]⟩
      intro x hx y hy hxy hadj
      obtain ⟨u, hu, rfl⟩ := Finset.mem_map.mp hx
      obtain ⟨w, hw, rfl⟩ := Finset.mem_map.mp hy
      simp only [addRightEmbedding_apply] at hxy hadj
      exact hE.isIndepSet hu hw (fun h => hxy (by rw [h])) ((translate_adj u w t).1 hadj)
    obtain ⟨z, hz, hzS⟩ := hF.hits i E' hE'
    obtain ⟨u, hu, rfl⟩ := Finset.mem_map.mp hz
    exact ⟨u, hu, by simpa [shift] using hzS⟩

set_option maxRecDepth 100000 in
theorem piece0 : runAll LemmaPCert.cert0 LemmaPCert.stk0 = some LemmaPCert.stk1 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece1 : runAll LemmaPCert.cert1 LemmaPCert.stk1 = some LemmaPCert.stk2 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece2 : runAll LemmaPCert.cert2 LemmaPCert.stk2 = some LemmaPCert.stk3 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece3 : runAll LemmaPCert.cert3 LemmaPCert.stk3 = some LemmaPCert.stk4 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece4 : runAll LemmaPCert.cert4 LemmaPCert.stk4 = some LemmaPCert.stk5 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece5 : runAll LemmaPCert.cert5 LemmaPCert.stk5 = some LemmaPCert.stk6 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece6 : runAll LemmaPCert.cert6 LemmaPCert.stk6 = some LemmaPCert.stk7 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece7 : runAll LemmaPCert.cert7 LemmaPCert.stk7 = some LemmaPCert.stk8 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece8 : runAll LemmaPCert.cert8 LemmaPCert.stk8 = some LemmaPCert.stk9 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece9 : runAll LemmaPCert.cert9 LemmaPCert.stk9 = some LemmaPCert.stk10 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece10 : runAll LemmaPCert.cert10 LemmaPCert.stk10 = some LemmaPCert.stk11 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece11 : runAll LemmaPCert.cert11 LemmaPCert.stk11 = some LemmaPCert.stk12 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece12 : runAll LemmaPCert.cert12 LemmaPCert.stk12 = some LemmaPCert.stk13 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece13 : runAll LemmaPCert.cert13 LemmaPCert.stk13 = some LemmaPCert.stk14 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece14 : runAll LemmaPCert.cert14 LemmaPCert.stk14 = some LemmaPCert.stk15 := by
  decide +kernel

set_option maxRecDepth 100000 in
theorem piece15 : runAll LemmaPCert.cert15 LemmaPCert.stk15 = some LemmaPCert.stk16 := by
  decide +kernel

/-- No configuration extends a state of the first stack: the pieces carry the cover to the empty stack. -/
theorem no_cover (S : Fin 3 → Set K) (hF : Feasible S) (h0 : ∃ st ∈ LemmaPCert.stk0, Covers S st) : False := by
  obtain ⟨_, hm, _⟩ := (runAll_cover hF _ _ _ piece15 (runAll_cover hF _ _ _ piece14 (runAll_cover hF _ _ _ piece13 (runAll_cover hF _ _ _ piece12 (runAll_cover hF _ _ _ piece11 (runAll_cover hF _ _ _ piece10 (runAll_cover hF _ _ _ piece9 (runAll_cover hF _ _ _ piece8 (runAll_cover hF _ _ _ piece7 (runAll_cover hF _ _ _ piece6 (runAll_cover hF _ _ _ piece5 (runAll_cover hF _ _ _ piece4 (runAll_cover hF _ _ _ piece3 (runAll_cover hF _ _ _ piece2 (runAll_cover hF _ _ _ piece1 (runAll_cover hF _ _ _ piece0 h0))))))))))))))))
  simp [LemmaPCert.stk16] at hm

theorem lemma_P (S : Fin 3 → Set K) : ¬ Feasible S := by
  intro hF
  by_cases hA : S 0 = ∅
  · exact no_cover S hF (start_cover S (Or.inr hA))
  · obtain ⟨t, ht⟩ := Set.nonempty_iff_ne_empty.mpr hA
    exact no_cover (shift S t) (feasible_shift hF t)
      (start_cover (shift S t) (Or.inl (by simpa [shift] using ht)))

#print axioms lemma_P
end RamseyScout.PathLemma
