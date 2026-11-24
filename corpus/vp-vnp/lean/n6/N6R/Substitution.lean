import CertMachine.Anchors

open MvPolynomial Statement CertMachine.Anchors

namespace CertMachine.N6

universe u

variable {R : Type u} [CommSemiring R] {V W : Type}

/-- Copy the defining operation of an earlier gate, including its original operands. -/
theorem gate_repeat {l : ℕ → MvPolynomial V R} {j k : ℕ} (hj : Gate l j)
    (hjk : j < k) (he : l k = l j) : Gate l k := by
  rcases hj with ⟨v, hv⟩ | ⟨a, ha⟩ | ⟨i, hi, r, hr, h⟩ | ⟨i, hi, r, hr, h⟩
  · exact Or.inl ⟨v, he.trans hv⟩
  · exact Or.inr (Or.inl ⟨a, he.trans ha⟩)
  · exact Or.inr (Or.inr (Or.inl ⟨i, hi.trans hjk, r, hr.trans hjk, he.trans h⟩))
  · exact Or.inr (Or.inr (Or.inr ⟨i, hi.trans hjk, r, hr.trans hjk, he.trans h⟩))

/-- Concatenate one circuit for each entry, retaining the location of each result. -/
theorem collect_circuits (P : W → MvPolynomial V R) (t : ℕ) (h : ∀ v, Computes (P v) t)
    (s : Finset W) : ∃ l : ℕ → MvPolynomial V R, Valid l (s.card * t) ∧
      ∀ v ∈ s, ∃ k < s.card * t, l k = P v := by
  classical
  induction s using Finset.induction_on with
  | empty => exact ⟨fun _ => 0, by simp [Valid], by simp⟩
  | @insert v s hv ih =>
    obtain ⟨l, hl, hout⟩ := ih
    obtain ⟨g, hg, j, hj, hjv⟩ := h v
    rw [Finset.card_insert_of_notMem hv, Nat.add_mul, Nat.one_mul]
    refine ⟨cat l g (s.card * t), valid_cat hl hg, ?_⟩
    intro w hw
    rcases Finset.mem_insert.mp hw with rfl | hw
    · exact ⟨s.card * t + j, by omega, by simpa [cat] using hjv⟩
    · obtain ⟨k, hk, hkw⟩ := hout w hw
      exact ⟨k, by omega, by simpa [cat, hk] using hkw⟩

/-- Substitute circuits of size t for the inputs, paying for each distinct input just once. -/
theorem computes_substitute [Fintype W] (P : W → MvPolynomial V R) {t s : ℕ}
    (hP : ∀ v, Computes (P v) t) {f : MvPolynomial W R} (hf : Computes f s) :
    Computes (aeval P f) (s + Fintype.card W * t) := by
  classical
  obtain ⟨l, hl, hout⟩ := collect_circuits P t hP Finset.univ
  simp only [Finset.card_univ, Finset.mem_univ, forall_true_left] at hl hout
  obtain ⟨g, hg, j, hj, rfl⟩ := hf
  let b := Fintype.card W * t
  let L := cat l (fun i => aeval P (g i)) b
  have hleft (i : ℕ) (hi : i < b) : L i = l i := if_pos hi
  have hright (i : ℕ) : L (b + i) = aeval P (g i) := by simp [L, cat]
  have hv (i : ℕ) (hi : i < b) : Gate L i :=
    gate_congr (fun k hk => hleft k (hk.trans_lt hi)) (hl i hi)
  refine ⟨L, ?_, b + j, by dsimp [b]; omega, hright j⟩
  intro k hk
  by_cases hkb : k < b
  · exact hv k hkb
  obtain ⟨i, rfl⟩ := Nat.exists_eq_add_of_le (Nat.le_of_not_gt hkb)
  have hi : i < s := by
    change b + i < s + b at hk
    omega
  rcases hg i hi with ⟨v, h⟩ | ⟨a, h⟩ | ⟨p, hp, q, hq, h⟩ | ⟨p, hp, q, hq, h⟩
  · obtain ⟨k, hk, hkv⟩ := hout v
    apply gate_repeat (k := b + i) (hv k hk) (by change k < b at hk; omega)
    rw [hright, h, aeval_X, hleft k hk, hkv]
  · exact Or.inr (Or.inl ⟨a, by rw [hright, h, aeval_C]; rfl⟩)
  · exact Or.inr (Or.inr (Or.inl ⟨b + p, by omega, b + q, by omega,
      by rw [hright, hright, hright, h, map_add]⟩))
  · exact Or.inr (Or.inr (Or.inr ⟨b + p, by omega, b + q, by omega,
      by rw [hright, hright, hright, h, map_mul]⟩))

end CertMachine.N6
