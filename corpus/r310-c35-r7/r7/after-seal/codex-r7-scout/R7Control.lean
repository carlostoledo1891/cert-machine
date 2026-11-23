import Mathlib.Logic.Equiv.Fin.Basic
import R7ControlData
import R7SideChoices

/-! A production C-SAT control independently bounded by a verified include/exclude
search on all 40 vertices. Neither the row criterion nor the extremal premise P1
is used to establish its independence number. -/

namespace R7Control
open Finset SimpleGraph R7Independence

private def fits {V : Type} (edge : V → V → Bool) : ℕ → List V → ℕ → Bool
  | 0, L, k => decide (L.length ≤ k)
  | _ + 1, [], _ => true
  | n + 1, v::L, k => if L.length + 1 ≤ k then true else
    match k with
    | 0 => false
    | k+1 => fits edge n L (k+1) && fits edge n (L.filter (fun x => !(edge v x))) k

private theorem fits_sound {V : Type} [DecidableEq V] (H : SimpleGraph V) (edge : V → V → Bool)
    (meaning : ∀ a b, edge a b = true ↔ H.Adj a b) (n : ℕ) (L : List V) (k : ℕ)
    (ok : fits edge n L k = true) (S : Finset V) (sub : S ⊆ L.toFinset)
    (ind : H.IsIndepSet S) : S.card ≤ k := by
  induction n generalizing L k S with
  | zero => exact (card_le_card sub).trans (L.toFinset_card_le.trans (of_decide_eq_true ok))
  | succ n ih =>
    cases L with
    | nil => simpa using (card_le_card sub).trans (by simp : ([] : List V).toFinset.card ≤ k)
    | cons v L =>
      by_cases small : L.length + 1 ≤ k
      · exact (card_le_card sub).trans ((v::L).toFinset_card_le.trans small)
      cases k with
      | zero => simp [fits, small] at ok
      | succ k =>
        have tests := Bool.and_eq_true_iff.mp (by simpa [fits, small] using ok)
        by_cases hv : v ∈ S
        · have keep : S.erase v ⊆ (L.filter fun x => !(edge v x)).toFinset := by
            intro x hx
            obtain ⟨ne, xs⟩ := mem_erase.mp hx
            have inL := List.mem_toFinset.mp (sub xs)
            simp only [List.mem_cons] at inL
            have no : ¬ edge v x = true := fun h => ind hv xs ne.symm ((meaning _ _).mp h)
            simpa [List.mem_filter, no] using inL.resolve_left ne
          have b := ih _ _ tests.2 _ keep (ind.mono (by exact_mod_cast erase_subset v S))
          have := card_erase_add_one hv
          omega
        · apply ih _ _ tests.1 S _ ind
          intro x hx
          have mem := List.mem_toFinset.mp (sub hx)
          exact List.mem_toFinset.mpr ((List.mem_cons.mp mem).resolve_left (fun h => hv (h ▸ hx)))

abbrev Vertex := Fin 27 ⊕ Fixed
private def index : Vertex ≃ Fin 40 := finSumFinEquiv
private def bit (x y : Fin 40) : Bool := (R7ControlData.neighbors[x.val]!).testBit y.val
private def flat : SimpleGraph (Fin 40) where
  Adj x y := bit x y = true
  symm := ⟨by decide +kernel⟩
  loopless := ⟨by decide +kernel⟩

private instance : DecidableRel flat.Adj := fun x y => inferInstanceAs (Decidable (bit x y = true))

def graph : SimpleGraph Vertex := flat.comap index
instance : DecidableRel graph.Adj := fun x y => inferInstanceAs (Decidable (flat.Adj (index x) (index y)))

theorem layout : Layout graph := ⟨by decide +kernel, by decide +kernel⟩

theorem regular : ∀ v, graph.degree v = 9 := by decide +kernel

theorem triangle_free : graph.CliqueFree 3 := by
  have check : ∀ a b c : Fin 40, flat.Adj a b → flat.Adj a c → ¬ flat.Adj b c := by decide +kernel
  intro S h
  obtain ⟨a,b,c,ab,ac,bc,_⟩ := is3Clique_iff.mp h
  exact check (index a) (index b) (index c) ab ac bc

private theorem upper_flat : ∀ S : Finset (Fin 40), flat.IsIndepSet S → S.card ≤ 10 := by
  have checked : fits bit 40 (List.finRange 40) 10 = true := by decide +kernel
  intro S h
  exact fits_sound flat bit (fun _ _ => Iff.rfl) _ _ _ checked S (by simp) h

theorem alpha_eq_ten : graph.indepNum = 10 := by
  have bound (S : Finset Vertex) (h : graph.IsIndepSet S) : S.card ≤ 10 := by
    have : flat.IsIndepSet (S.map index.toEmbedding) := by
      intro a ha b hb ne
      obtain ⟨x,hx,rfl⟩ := mem_map.mp ha
      obtain ⟨y,hy,rfl⟩ := mem_map.mp hb
      exact h hx hy (fun he => ne (congrArg index he))
    simpa using upper_flat _ this
  obtain ⟨s, hs⟩ := graph.exists_isNIndepSet_indepNum
  have upper := bound s hs.isIndepSet
  rw [hs.card_eq] at upper
  let ten : Finset Vertex := (R7ControlData.ten.map fun n => index.symm (Fin.ofNat 40 n)).toFinset
  have independent : graph.IsIndepSet ten := by decide +kernel
  have card : ten.card = 10 := by decide +kernel
  exact Nat.le_antisymm upper (card ▸ independent.card_le_indepNum)

/-- At K=10 the control satisfies the exact criterion, including the indexed
row predicate at its computed threshold, for every independent core set. -/
theorem control_row_tests (I : Finset (Fin 27)) (h : CoreIndependent graph I) :
    I.card + 2 ≤ 10 ∧ I.card + 1 + (missing graph I A).card ≤ 10 ∧
    I.card + 1 + (missing graph I B).card ≤ 10 ∧ RowClauses graph I (threshold graph 10 I) :=
  (bound_iff_rowClauses graph layout 10).mp
    (fun _ ind => ind.card_le_indepNum.trans alpha_eq_ten.le) I h

theorem control_sides : SideChoice graph 10 A ∧ SideChoice graph 10 B ∧
    ∀ a ∈ indices A, ∀ b ∈ indices B, Disjoint (row graph a) (row graph b) :=
  gives_configuration graph layout 10 triangle_free regular alpha_eq_ten.le

/-- The hitting condition at K=10 begins at eight. This particular catalogue
core has no such independent set, so only that component of the test is vacuous. -/
theorem core_bound (I : Finset (Fin 27)) (ind : CoreIndependent graph I) : I.card ≤ 7 := by
  let edge (a b : Fin 27) := bit (index (.inl a)) (index (.inl b))
  have checked : fits edge 27 (List.finRange 27) 7 = true := by decide +kernel
  exact fits_sound (graph.comap Sum.inl) edge (fun _ _ => Iff.rfl) _ _ _ checked I (by simp) ind

def sample : Finset (Fin 27) := {0,1,3,6,12,14,18}

private def sampleMissing (i : Block) : Finset Fixed :=
  univ.filter fun s => block s = i ∧ ∀ x ∈ sample, ¬ graph.Adj (.inr s) (.inl x)

/-- A nonempty core set separates K=9 from K=10 on the same decoded rows. -/
theorem boundary_sample : CoreIndependent graph sample ∧
    threshold graph 9 sample = 3 ∧ threshold graph 10 sample = 4 ∧
    ¬ RowClauses graph sample (threshold graph 9 sample) ∧
    RowClauses graph sample (threshold graph 10 sample) := by
  have equal (i : Block) : missing graph sample i = sampleMissing i := by
    ext s
    simp [missing, sampleMissing]
  have size : sample.card = 7 := by decide
  have a : (sampleMissing A).card = 0 := by decide +kernel
  have b : (sampleMissing B).card = 0 := by decide +kernel
  have c : (sampleMissing C).card = 3 := by decide +kernel
  refine ⟨?_, ?_⟩
  · change (graph.comap Sum.inl).IsIndepSet sample
    decide +kernel
  · simp [rowClauses_iff, threshold, equal, size, a, b, c]

#print axioms layout
#print axioms regular
#print axioms triangle_free
#print axioms alpha_eq_ten
#print axioms control_row_tests
#print axioms control_sides
#print axioms core_bound
#print axioms boundary_sample

end R7Control
