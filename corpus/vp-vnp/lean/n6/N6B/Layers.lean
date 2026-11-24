import N6B.Circuit
import N6B.Bird

/-! The costs in this file are numbers of scalar gates in Statement.Computes.
A layer of the Bird recurrence reads the original input and the preceding
layer, both of which are held on a single gate list. -/

open MvPolynomial BirdDet

namespace N6B

universe u
variable {V : Type} {R : Type u} [CommRing R]
variable {S : MvPolynomial V R → Prop}

/-- The tail sum uses one zero, one addition per term, and the gates for its summands. -/
theorem sumFrom_cost {n c : ℕ} (f : ℕ → MvPolynomial V R)
    (hf : ∀ i < n, Cost S (f i) c) (lo : ℕ) :
    Cost S (BirdDet.sumFrom n lo f) ((n - lo) * (c + 1) + 1) := by
  induction lo using BirdDet.sumFrom_induct n with
  | step lo hlo ih =>
    rw [BirdDet.sumFrom_step n lo f hlo]
    apply ((hf lo hlo).add ih).mono
    rw [show n - lo = (n - (lo + 1)) + 1 by omega, Nat.add_mul, one_mul]
    omega
  | stop lo hlo =>
    rw [BirdDet.sumFrom_stop n lo f hlo, Nat.sub_eq_zero_of_le (by omega : n ≤ lo)]
    simpa using (Cost.constant (S := S) (0 : R))

/-- Uniform tail bound, independent of its starting index. -/
theorem tail_cost {n c : ℕ} (f : ℕ → MvPolynomial V R)
    (hf : ∀ i < n, Cost S (f i) c) (lo : ℕ) :
    Cost S (BirdDet.sumFrom n lo f) (n * (c + 1) + 1) :=
  (sumFrom_cost f hf lo).mono (Nat.add_le_add_right (Nat.mul_le_mul_right _ (Nat.sub_le ..)) 1)

/-- All in-bounds entries are available. The flat implementation takes natural indices. -/
def Entries {P : Type*} (known : P → Prop) (n : ℕ) (F : ℕ → ℕ → P) : Prop :=
  ∀ i j : Fin n, known (F i j)

/-- Cost for one new entry. Negation uses the scalar -1 and multiplication. -/
theorem step_cost {n : ℕ} (A : Array (MvPolynomial V R)) (F : ℕ → ℕ → MvPolynomial V R)
    (hA : Entries S n (BirdDet.get n A)) (hF : Entries S n F) (i j : Fin n) :
    Cost S (stepEntry n A F i j) (3 * n + 6) := by
  have hd := tail_cost (fun k => F k k)
    (fun k hk => Cost.read (hF ⟨k, hk⟩ ⟨k, hk⟩)) (i.val + 1)
  have ht := tail_cost (fun k => F i k * BirdDet.get n A k j)
    (fun k hk => (Cost.read (hF i ⟨k, hk⟩)).mul (Cost.read (hA ⟨k, hk⟩ j))) (i.val + 1)
  have hneg := (Cost.constant (S := S) (-1 : R)).mul hd
  simp only [map_neg, map_one, neg_one_mul] at hneg
  rw [stepEntry_eq]
  apply ((hneg.mul (Cost.read (hA i j))).add ht).mono
  omega

/-- A complete layer costs at most this many gates, including all n² scalar outputs. -/
def layerBudget (n : ℕ) : ℕ := (n * n) * (3 * n + 6)

theorem build_layer {n : ℕ} (A : Array (MvPolynomial V R)) (F : ℕ → ℕ → MvPolynomial V R)
    (t : Tape V R) (hA : Entries t.Has n (BirdDet.get n A)) (hF : Entries t.Has n F) :
    ∃ v, t.Grows v (layerBudget n) ∧ Entries v.Has n (stepEntry n A F) := by
  obtain ⟨v, hv, hout⟩ := Cost.family (S := t.Has) (Finset.univ : Finset (Fin n × Fin n))
    (fun ij => stepEntry n A F ij.1 ij.2) t (fun h => h)
    (fun ij _ => step_cost A F hA hF ij.1 ij.2)
  exact ⟨v, by simpa [layerBudget] using hv, fun i j => hout (i, j) (Finset.mem_univ _)⟩

theorem build_iterate {n : ℕ} (A : Array (MvPolynomial V R)) (t : Tape V R)
    (hA : Entries t.Has n (BirdDet.get n A)) (k : ℕ) :
    ∃ v, t.Grows v (k * layerBudget n) ∧
      Entries v.Has n ((stepEntry n A)^[k] (BirdDet.get n A)) := by
  induction k with
  | zero => exact ⟨t, by simpa using Tape.Grows.refl t, hA⟩
  | succ k ih =>
    obtain ⟨v, hv, hF⟩ := ih
    obtain ⟨w, hw, hout⟩ := build_layer A _ v (fun i j => hv.keep (hA i j)) hF
    exact ⟨w, by simpa [Nat.succ_mul] using hv.trans hw, by
      rw [Function.iterate_succ_apply']; exact hout⟩

end N6B
