import Outside
import Mathlib.Data.Fin.VecNotation

namespace RamseyScout.PathLemma
variable {V : Type*} {G : SimpleGraph V} (e : core ↪g G)
  (tri : G.CliqueFree 3) (noTen : ∀ s : Finset V, ¬G.IsNIndepSet 10 s)

include e tri noTen

/-- All indices refer to distinct exterior vertices, with no maximality assumption. -/
private theorem fork {n : ℕ} (w : Fin n ↪ V) (out : ∀ i j, w i ≠ e j)
    (a b c : Fin n) (ab : a ≠ b) (ac : a ≠ c) (bc : b ≠ c) :
    G.Adj (w a) (w b) ∨ G.Adj (w b) (w c) := by
  let f : Fin 3 ↪ Fin n := ⟨![a,b,c], by
    intro i j h
    fin_cases i <;> fin_cases j <;> simp_all [Ne.symm]⟩
  exact outside_fork G e tri noTen (f.trans w) (fun i j => out (f i) j)

private theorem not_three_neighbors {n : ℕ} (w : Fin n ↪ V) (out : ∀ i j, w i ≠ e j)
    (x : V) (a b c : Fin n) (ab : a ≠ b) (ac : a ≠ c) (bc : b ≠ c)
    (ha : G.Adj x (w a)) (hb : G.Adj x (w b)) (hc : G.Adj x (w c)) : False := by
  have ind := G.isIndepSet_neighborSet_of_triangleFree tri x
  exact (fork e tri noTen w out a b c ab ac bc).elim (ind ha hb (w.injective.ne ab))
    (ind hb hc (w.injective.ne bc))

theorem no_five_outside (w : Fin 5 ↪ V) (out : ∀ i j, w i ≠ e j) : False := by
  have atleast (a b : Fin 5) (ha : a ≠ 0) (hb : b ≠ 0) (hab : a ≠ b) :
      G.Adj (w 0) (w a) ∨ G.Adj (w 0) (w b) := by
    exact (fork e tri noTen w out a 0 b ha hab hb.symm).imp (fun h => h.symm) id
  have three := not_three_neighbors e tri noTen w out (w 0)
  by_cases h1 : G.Adj (w 0) (w 1)
  · by_cases h2 : G.Adj (w 0) (w 2)
    · rcases atleast 3 4 (by decide) (by decide) (by decide) with h | h
      · exact three 1 2 3 (by decide) (by decide) (by decide) h1 h2 h
      · exact three 1 2 4 (by decide) (by decide) (by decide) h1 h2 h
    · exact three 1 3 4 (by decide) (by decide) (by decide) h1
        ((atleast 2 3 (by decide) (by decide) (by decide)).resolve_left h2)
        ((atleast 2 4 (by decide) (by decide) (by decide)).resolve_left h2)
  · exact three 2 3 4 (by decide) (by decide) (by decide)
      ((atleast 1 2 (by decide) (by decide) (by decide)).resolve_left h1)
      ((atleast 1 3 (by decide) (by decide) (by decide)).resolve_left h1)
      ((atleast 1 4 (by decide) (by decide) (by decide)).resolve_left h1)

theorem order_at_most_39 [Fintype V] : Fintype.card V ≤ 39 := by
  classical
  let p := fun v => v ∈ Set.range e
  have hcore : Fintype.card {v // p v} = 35 := by
    exact (Fintype.card_congr (Equiv.ofInjective _ e.injective)).symm.trans (Fintype.card_fin _)
  have count := Fintype.card_subtype_compl p
  by_contra! h
  have enough : 5 ≤ Fintype.card {v // ¬ p v} := by omega
  let incl := (Fin.castLEEmb enough).trans (Fintype.equivFin {v // ¬p v}).symm.toEmbedding
  apply no_five_outside e tri noTen (incl.trans (.subtype _))
  intro i j eq
  exact (incl i).property ⟨j, eq.symm⟩

/-- Any four distinct exterior vertices induce the four-cycle. -/
theorem four_outside_C4 (w : Fin 4 ↪ V) (out : ∀ i j, w i ≠ e j) :
    Nonempty (SimpleGraph.cycleGraph 4 ≃g G.comap w) := by
  classical
  have opposite : ∃ p : Equiv.Perm (Fin 4), ¬ G.Adj (w (p 0)) (w (p 2)) := by
    by_cases h : G.Adj (w 0) (w 2)
    · by_cases h1 : G.Adj (w 0) (w 1)
      · have h3 : ¬ G.Adj (w 0) (w 3) := fun h3 =>
          not_three_neighbors e tri noTen w out (w 0) 1 2 3 (by decide) (by decide)
            (by decide) h1 h h3
        exact ⟨Equiv.swap 2 3, by simpa [Equiv.swap_apply_def] using h3⟩
      · exact ⟨Equiv.swap 1 2, by simpa [Equiv.swap_apply_def] using h1⟩
    · exact ⟨Equiv.refl _, h⟩
  obtain ⟨p, opposite⟩ := opposite
  let f := p.toEmbedding.trans w
  have join := fork e tri noTen f (fun i j => out (p i) j)
  change ¬G.Adj (f 0) (f 2) at opposite
  have opp' : ¬G.Adj (f 2) (f 0) := fun h => opposite h.symm
  have e01 := (join 2 0 1 (by decide) (by decide) (by decide)).resolve_left opp'
  have e03 := (join 2 0 3 (by decide) (by decide) (by decide)).resolve_left opp'
  have e21 := (join 0 2 1 (by decide) (by decide) (by decide)).resolve_left opposite
  have e23 := (join 0 2 3 (by decide) (by decide) (by decide)).resolve_left opposite
  have e13 : ¬G.Adj (f 1) (f 3) :=
    G.isIndepSet_neighborSet_of_triangleFree tri (f 0) e01 e03 (f.injective.ne (by decide))
  have e31 : ¬G.Adj (f 3) (f 1) := fun h => e13 h.symm
  refine ⟨{ toEquiv := p, map_rel_iff' := ?_ }⟩
  intro i j
  change G.Adj (f i) (f j) ↔ (SimpleGraph.cycleGraph 4).Adj i j
  fin_cases i <;> fin_cases j <;>
    simp +decide [opposite, opp', e13, e31, e01, e01.symm, e03, e03.symm,
      e21, e21.symm, e23, e23.symm]

#print axioms order_at_most_39
#print axioms four_outside_C4
end RamseyScout.PathLemma
