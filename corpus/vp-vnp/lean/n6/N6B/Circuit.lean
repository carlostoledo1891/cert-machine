import CertMachine.Anchors

/-! Building on a shared list of gates. A local computation can read any of
the supplied polynomials at no additional cost. Every extension preserves
access to all outputs already on the list. -/

open MvPolynomial CertMachine.Anchors

namespace N6B

universe u
variable {V : Type} {R : Type u} [CommSemiring R]

structure Tape (V : Type) (R : Type u) [CommSemiring R] where
  line : ℕ → MvPolynomial V R
  size : ℕ
  valid : Valid line size

noncomputable def Tape.empty : Tape V R := ⟨fun _ => 0, 0, by intro k hk; omega⟩

def Tape.Has (t : Tape V R) (p : MvPolynomial V R) : Prop :=
  ∃ i < t.size, t.line i = p

structure Tape.Grows (t v : Tape V R) (budget : ℕ) : Prop where
  keep : ∀ {p}, t.Has p → v.Has p
  bound : v.size ≤ t.size + budget

theorem Tape.Grows.refl (t : Tape V R) : t.Grows t 0 :=
  ⟨id, by simp⟩

theorem Tape.Grows.trans {t v w : Tape V R} {a b : ℕ}
    (h : t.Grows v a) (h' : v.Grows w b) : t.Grows w (a + b) :=
  ⟨fun hp => h'.keep (h.keep hp), by have := h.bound; have := h'.bound; omega⟩

theorem Tape.push (t : Tape V R) (p : MvPolynomial V R)
    (hg : Gate (snoc t.line t.size p) t.size) :
    ∃ v, t.Grows v 1 ∧ v.Has p := by
  let v : Tape V R := ⟨_, _, valid_snoc t.valid hg⟩
  refine ⟨v, ⟨?_, le_rfl⟩, t.size, Nat.lt_succ_self _, by simp [v, snoc]⟩
  rintro q ⟨i, hi, hq⟩
  exact ⟨i, Nat.lt_succ_of_lt hi, by simpa [v, snoc, hi] using hq⟩

/-- Cost of producing a single output from a prefix that already supplies all of S. -/
def Cost (S : MvPolynomial V R → Prop) (p : MvPolynomial V R) (b : ℕ) : Prop :=
  ∀ t : Tape V R, (∀ {q}, S q → t.Has q) → ∃ v, t.Grows v b ∧ v.Has p

namespace Cost

variable {S : MvPolynomial V R → Prop} {p q z : MvPolynomial V R} {a b c : ℕ}

theorem read (h : S p) : Cost S p 0 :=
  fun t ht => ⟨t, Tape.Grows.refl t, ht h⟩

theorem constant (r : R) : Cost S (C r) 1 :=
  fun t _ => t.push _ (Or.inr (Or.inl ⟨r, by simp [snoc]⟩))

theorem var (x : V) : Cost S (X x) 1 :=
  fun t _ => t.push _ (Or.inl ⟨x, by simp [snoc]⟩)

theorem mono (h : Cost S p a) (hab : a ≤ b) : Cost S p b := by
  intro t ht
  obtain ⟨v, hv, hp⟩ := h t ht
  exact ⟨v, ⟨hv.keep, hv.bound.trans (Nat.add_le_add_left hab _)⟩, hp⟩

/-- Build both arguments and then emit one gate on the resulting shared prefix. -/
private theorem binary (hp : Cost S p a) (hq : Cost S q b)
    (emit : ∀ t : Tape V R, t.Has p → t.Has q → ∃ v, t.Grows v 1 ∧ v.Has z) :
    Cost S z (a + b + 1) := by
  intro t ht
  obtain ⟨v, hv, hp'⟩ := hp t ht
  obtain ⟨w, hw, hq'⟩ := hq v (fun h => hv.keep (ht h))
  obtain ⟨u, hu, hz⟩ := emit w (hw.keep hp') hq'
  exact ⟨u, (hv.trans hw).trans hu, hz⟩

theorem add (hp : Cost S p a) (hq : Cost S q b) : Cost S (p + q) (a + b + 1) := by
  apply binary hp hq
  rintro t ⟨i, hi, rfl⟩ ⟨j, hj, rfl⟩
  exact t.push _ (Or.inr (Or.inr (Or.inl ⟨i, hi, j, hj, by simp [snoc, hi, hj]⟩)))

theorem mul (hp : Cost S p a) (hq : Cost S q b) : Cost S (p * q) (a + b + 1) := by
  apply binary hp hq
  rintro t ⟨i, hi, rfl⟩ ⟨j, hj, rfl⟩
  exact t.push _ (Or.inr (Or.inr (Or.inr ⟨i, hi, j, hj, by simp [snoc, hi, hj]⟩)))

/-- Append a whole finite family, keeping inputs and every earlier output accessible. -/
theorem family {ι : Type*} (I : Finset ι) (f : ι → MvPolynomial V R) (t : Tape V R)
    (ht : ∀ {q}, S q → t.Has q) (hf : ∀ i ∈ I, Cost S (f i) b) :
    ∃ v, t.Grows v (I.card * b) ∧ ∀ i ∈ I, v.Has (f i) := by
  classical
  induction I using Finset.induction_on with
  | empty => exact ⟨t, by simpa using Tape.Grows.refl t, by simp⟩
  | @insert i I hi ih =>
    obtain ⟨v, hv, hall⟩ := ih (fun k hk => hf k (Finset.mem_insert_of_mem hk))
    obtain ⟨w, hw, hout⟩ := hf i (Finset.mem_insert_self ..) v (fun h => hv.keep (ht h))
    refine ⟨w, ?_, ?_⟩
    · simpa [Finset.card_insert_of_notMem hi, Nat.add_mul] using hv.trans hw
    · intro k hk
      rcases Finset.mem_insert.mp hk with rfl | hk
      · exact hout
      · exact hw.keep (hall k hk)

end Cost
end N6B
