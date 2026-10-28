import Bridge.OpenAIStatement
open OAI.Algorithms.SubexponentialSAT
namespace Bridge

/-! Length bounds for OpenAI's CNF encoding. -/

theorem encodeNat_length (m : ℕ) : (Encoding.encodeNat m).length = m + 1 := by
  simp [Encoding.encodeNat]

theorem frame_length (bits : List Bool) : (Encoding.frame bits).length = 2 * bits.length + 1 := by
  induction bits with
  | nil => simp [Encoding.frame]
  | cons b bs ih =>
    simp only [Encoding.frame, List.foldr_cons, List.length_cons] at ih ⊢
    omega

theorem encodeList_length_le {α : Type*} (enc : α → List Bool) (B : ℕ) :
    ∀ l : List α, (∀ a ∈ l, (enc a).length ≤ B) →
      (Encoding.encodeList enc l).length ≤ 1 + l.length * (2 * B + 2) := by
  intro l
  induction l with
  | nil => intro _; simp [Encoding.encodeList]
  | cons a as ih =>
    intro h
    have ha : (enc a).length ≤ B := h a List.mem_cons_self
    have has : ∀ x ∈ as, (enc x).length ≤ B := fun x hx => h x (List.mem_cons_of_mem _ hx)
    have := ih has
    simp only [Encoding.encodeList, List.length_cons, List.length_append, frame_length]
    nlinarith

theorem literalCode_le {n : ℕ} (l : SAT.Literal (Fin n)) : Encoding.literalCode l ≤ 2 * n + 1 := by
  unfold Encoding.literalCode
  have := l.variable.isLt
  split_ifs <;> omega

theorem clauseNumbers_length_le {n : ℕ} (C : SAT.Clause (Fin n)) :
    (Encoding.clauseNumbers C).length ≤ C.card := by
  unfold Encoding.clauseNumbers
  rw [Finset.length_sort]
  exact Finset.card_image_le

theorem mem_clauseNumbers_le {n : ℕ} (C : SAT.Clause (Fin n)) (m : ℕ)
    (hm : m ∈ Encoding.clauseNumbers C) : m ≤ 2 * n + 1 := by
  unfold Encoding.clauseNumbers at hm
  rw [Finset.mem_sort, Finset.mem_image] at hm
  obtain ⟨l, _, rfl⟩ := hm
  exact literalCode_le l

theorem encodeClause_length_le {n k : ℕ} (C : SAT.Clause (Fin n)) (hC : C.card ≤ k) :
    (Encoding.encodeList Encoding.encodeNat (Encoding.clauseNumbers C)).length
      ≤ 1 + k * (4 * n + 6) := by
  have h := encodeList_length_le Encoding.encodeNat (2 * n + 2) (Encoding.clauseNumbers C)
    (fun m hm => by rw [encodeNat_length]; have := mem_clauseNumbers_le C m hm; omega)
  have hl := clauseNumbers_length_le C
  calc (Encoding.encodeList Encoding.encodeNat (Encoding.clauseNumbers C)).length
      ≤ 1 + (Encoding.clauseNumbers C).length * (2 * (2 * n + 2) + 2) := h
    _ ≤ 1 + k * (2 * (2 * n + 2) + 2) := by gcongr; omega
    _ = 1 + k * (4 * n + 6) := by ring

/-- All literals over `Fin n`, as a finset of size at most `2n`. -/
def allLiterals (n : ℕ) : Finset (SAT.Literal (Fin n)) :=
  (Finset.univ : Finset (Fin n × Bool)).image fun p => ⟨p.1, p.2⟩

theorem mem_allLiterals {n : ℕ} (l : SAT.Literal (Fin n)) : l ∈ allLiterals n := by
  unfold allLiterals
  rw [Finset.mem_image]
  exact ⟨(l.variable, l.positive), Finset.mem_univ _, rfl⟩

theorem allLiterals_card {n : ℕ} : (allLiterals n).card ≤ 2 * n := by
  unfold allLiterals
  calc _ ≤ (Finset.univ : Finset (Fin n × Bool)).card := Finset.card_image_le
    _ = 2 * n := by simp [Finset.card_univ, Fintype.card_prod, Fintype.card_fin, Fintype.card_bool]; ring

theorem cnf_card_le {n k : ℕ} (F : SAT.CNF (Fin n)) (hF : SAT.WidthAtMost k F) :
    F.card ≤ (k + 1) * (2 * n + 1) ^ k := by
  have hsub : F ⊆ (Finset.range (k + 1)).biUnion
      (fun j => Finset.powersetCard j (allLiterals n)) := by
    intro C hC
    rw [Finset.mem_biUnion]
    refine ⟨C.card, ?_, ?_⟩
    · rw [Finset.mem_range]; have := hF C hC; omega
    · rw [Finset.mem_powersetCard]
      exact ⟨fun l _ => mem_allLiterals l, rfl⟩
  calc F.card ≤ ((Finset.range (k + 1)).biUnion
        (fun j => Finset.powersetCard j (allLiterals n))).card := Finset.card_le_card hsub
    _ ≤ (Finset.range (k + 1)).card * (2 * n + 1) ^ k := by
        apply Finset.card_biUnion_le_card_mul
        intro j hj
        rw [Finset.mem_range] at hj
        rw [Finset.card_powersetCard]
        calc (allLiterals n).card.choose j ≤ (allLiterals n).card ^ j := Nat.choose_le_pow _ _
          _ ≤ (2 * n + 1) ^ j := by
              apply Nat.pow_le_pow_left
              have := (allLiterals_card (n := n)); omega
          _ ≤ (2 * n + 1) ^ k := Nat.pow_le_pow_right (by omega) (by omega)
    _ = (k + 1) * (2 * n + 1) ^ k := by rw [Finset.card_range]

theorem cnfNumbers_length_le {n : ℕ} (F : SAT.CNF (Fin n)) :
    (Encoding.cnfNumbers F).length ≤ F.card := by
  unfold Encoding.cnfNumbers
  rw [Finset.length_sort]
  exact Finset.card_image_le

theorem mem_cnfNumbers {n : ℕ} (F : SAT.CNF (Fin n)) (L : List ℕ)
    (hL : L ∈ Encoding.cnfNumbers F) : ∃ C ∈ F, Encoding.clauseNumbers C = L := by
  unfold Encoding.cnfNumbers at hL
  rw [Finset.mem_sort, Finset.mem_image] at hL
  exact hL

theorem formulaBitLength_le {n k : ℕ} (F : SAT.CNF (Fin n)) (hF : SAT.WidthAtMost k F) :
    Encoding.formulaBitLength F
      ≤ n + 2 + (k + 1) * (2 * n + 1) ^ k * (2 * (1 + k * (4 * n + 6)) + 2) := by
  unfold Encoding.formulaBitLength Encoding.encodeCNF Encoding.encodeCNFBody
  rw [List.length_append, encodeNat_length]
  have hbody := encodeList_length_le (Encoding.encodeList Encoding.encodeNat)
    (1 + k * (4 * n + 6)) (Encoding.cnfNumbers F) (fun L hL => by
      obtain ⟨C, hC, rfl⟩ := mem_cnfNumbers F L hL
      exact encodeClause_length_le C (hF C hC))
  have hlen : (Encoding.cnfNumbers F).length ≤ (k + 1) * (2 * n + 1) ^ k :=
    (cnfNumbers_length_le F).trans (cnf_card_le F hF)
  calc n + 1 + (Encoding.encodeList (Encoding.encodeList Encoding.encodeNat)
        (Encoding.cnfNumbers F)).length
      ≤ n + 1 + (1 + (Encoding.cnfNumbers F).length * (2 * (1 + k * (4 * n + 6)) + 2)) := by
        gcongr
    _ ≤ n + 1 + (1 + (k + 1) * (2 * n + 1) ^ k * (2 * (1 + k * (4 * n + 6)) + 2)) := by
        gcongr
    _ = _ := by ring

theorem formulaBitLength_poly (k : ℕ) :
    ∃ c : ℕ, ∀ (n : ℕ) (F : SAT.CNF (Fin n)), SAT.WidthAtMost k F →
      Encoding.formulaBitLength F ≤ c * (n + 1) ^ (k + 2) := by
  refine ⟨2 + (k + 1) * 2 ^ k * (12 * k + 4), ?_⟩
  intro n F hF
  have h := formulaBitLength_le F hF
  -- Pieces, in terms of N = n + 1.
  have hN : 1 ≤ n + 1 := by omega
  have h1 : n + 2 ≤ 2 * (n + 1) ^ (k + 2) := by
    have : n + 1 ≤ (n + 1) ^ (k + 2) := Nat.le_self_pow (by omega) _
    omega
  have h2 : (2 * n + 1) ^ k ≤ 2 ^ k * (n + 1) ^ k := by
    rw [← Nat.mul_pow]
    apply Nat.pow_le_pow_left
    omega
  have h3 : 2 * (1 + k * (4 * n + 6)) + 2 ≤ (12 * k + 4) * (n + 1) := by nlinarith
  have h4 : (n + 1) ^ k * (n + 1) ≤ (n + 1) ^ (k + 2) := by
    rw [pow_succ, pow_succ]
    have : (n + 1) ^ k * (n + 1) * 1 ≤ (n + 1) ^ k * (n + 1) * (n + 1) := by gcongr
    omega
  calc Encoding.formulaBitLength F
      ≤ n + 2 + (k + 1) * (2 * n + 1) ^ k * (2 * (1 + k * (4 * n + 6)) + 2) := h
    _ ≤ 2 * (n + 1) ^ (k + 2)
        + (k + 1) * (2 ^ k * (n + 1) ^ k) * ((12 * k + 4) * (n + 1)) := by gcongr
    _ = 2 * (n + 1) ^ (k + 2)
        + (k + 1) * 2 ^ k * (12 * k + 4) * ((n + 1) ^ k * (n + 1)) := by ring
    _ ≤ 2 * (n + 1) ^ (k + 2)
        + (k + 1) * 2 ^ k * (12 * k + 4) * (n + 1) ^ (k + 2) := by gcongr
    _ = (2 + (k + 1) * 2 ^ k * (12 * k + 4)) * (n + 1) ^ (k + 2) := by ring

end Bridge
