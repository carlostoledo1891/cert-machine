import Mathlib.Tactic
import Mathlib.Combinatorics.SimpleGraph.Finite
import Mathlib.Combinatorics.SimpleGraph.Clique
import Mathlib.Data.Fin.Tuple.Sort
import Mathlib.Order.PiLex
import R7Cnf

/-! T1 of `P4-STATEMENT-v2.md`: soundness of the clause list F. -/

namespace R7Cnf

/-- The truth value of a literal. -/
def lit (τ : ℕ → Bool) (a : Int) : Bool := if a < 0 then !τ a.natAbs else τ a.natAbs

/-- An assignment satisfies a clause list. -/
def Sat (τ : ℕ → Bool) (cs : List Clause) : Prop := ∀ c ∈ cs, ∃ a ∈ c, lit τ a = true

/-- Every variable of the clause list is at most b. -/
def Bdd (b : ℕ) (cs : List Clause) : Prop := ∀ c ∈ cs, ∀ a ∈ c, a.natAbs ≤ b

/-- τ' agrees with τ on the variables up to b. -/
def Agree (b : ℕ) (τ τ' : ℕ → Bool) : Prop := ∀ v, v ≤ b → τ' v = τ v

theorem lit_agree {b : ℕ} {τ τ' : ℕ → Bool} (h : Agree b τ τ') {a : Int} (ha : a.natAbs ≤ b) : lit τ' a = lit τ a := by
  unfold lit; rw [h _ ha]

theorem Sat.agree {b : ℕ} {τ τ' : ℕ → Bool} {cs : List Clause} (hb : Bdd b cs) (h : Agree b τ τ') (hs : Sat τ cs) :
    Sat τ' cs := by
  intro c hc
  obtain ⟨a, ha, hl⟩ := hs c hc
  exact ⟨a, ha, by rw [lit_agree h (hb c hc a ha)]; exact hl⟩

theorem Bdd.mono {b b' : ℕ} {cs : List Clause} (h : Bdd b cs) (hbb : b ≤ b') : Bdd b' cs :=
  fun c hc a ha => le_trans (h c hc a ha) hbb

theorem lit_neg {τ : ℕ → Bool} {a : Int} (ha : a ≠ 0) : lit τ (-a) = !lit τ a := by
  unfold lit
  rcases lt_trichotomy a 0 with h | h | h
  · have h' : ¬ (-a < 0) := by omega
    simp only [h', h, ↓reduceIte, Int.natAbs_neg]; simp
  · exact absurd h ha
  · have h1 : -a < 0 := by omega
    have h2 : ¬ a < 0 := by omega
    simp only [h1, h2, ↓reduceIte, Int.natAbs_neg]

theorem lit_pos {τ : ℕ → Bool} (v : ℕ) : lit τ (pos v) = τ v := by
  unfold lit pos
  have h : ¬ ((Int.ofNat v) < 0) := by simp
  simp only [h, ↓reduceIte]; simp

theorem lit_negv {τ : ℕ → Bool} {v : ℕ} (hv : 0 < v) : lit τ (neg v) = !τ v := by
  unfold lit neg
  have h : (-(Int.ofNat v) : Int) < 0 := by simp only [Int.ofNat_eq_natCast]; omega
  simp only [h, ↓reduceIte]; simp

@[simp] theorem natAbs_pos' (v : ℕ) : (pos v).natAbs = v := by simp [pos]
@[simp] theorem natAbs_neg' (v : ℕ) : (neg v).natAbs = v := by simp [neg]

/-! ## Gadgets and their composition -/

/-- A gadget is good for a class P of assignments: from any assignment in P and any running count at least 189, its clauses use
variables up to the new count only, and some extension that agrees up to the old count satisfies them. -/
def Good (P : (ℕ → Bool) → Prop) (g : Gadget) : Prop :=
  ∀ base τ, 189 ≤ base → P τ →
    base ≤ (g base).2 ∧ Bdd (g base).2 (g base).1 ∧ ∃ τ', Agree base τ τ' ∧ Sat τ' (g base).1

theorem foldl_run (gs : List Gadget) (cs : List Clause) (b : ℕ) :
    gs.foldl (fun acc g => let r := g acc.2; (acc.1 ++ r.1, r.2)) (cs, b) = (cs ++ (run gs b).1, (run gs b).2) := by
  induction gs generalizing cs b with
  | nil => simp [run]
  | cons g gs ih =>
    simp only [run, List.foldl_cons, List.nil_append]
    rw [ih, ih (g b).1 (g b).2]
    simp [List.append_assoc]

theorem run_cons (g : Gadget) (gs : List Gadget) (b : ℕ) :
    run (g :: gs) b = ((g b).1 ++ (run gs (g b).2).1, (run gs (g b).2).2) := by
  simp only [run, List.foldl_cons, List.nil_append]
  exact foldl_run gs (g b).1 (g b).2

theorem Sat.append {τ : ℕ → Bool} {cs ds : List Clause} (h1 : Sat τ cs) (h2 : Sat τ ds) : Sat τ (cs ++ ds) := by
  intro c hc
  rcases List.mem_append.mp hc with h | h
  · exact h1 c h
  · exact h2 c h

theorem run_sat (P : (ℕ → Bool) → Prop) (hP : ∀ τ τ', P τ → Agree 189 τ τ' → P τ')
    (gs : List Gadget) (hg : ∀ g ∈ gs, Good P g) :
    ∀ base τ, 189 ≤ base → P τ → ∃ τ', Agree base τ τ' ∧ Sat τ' (run gs base).1 := by
  induction gs with
  | nil => intro base τ _ _; exact ⟨τ, fun _ _ => rfl, by simp [run, Sat]⟩
  | cons g gs ih =>
    intro base τ hb hτ
    obtain ⟨hle, hbd, τ1, hag1, hs1⟩ := hg g List.mem_cons_self base τ hb hτ
    have hP1 : P τ1 := hP τ τ1 hτ (fun v hv => hag1 v (le_trans hv hb))
    obtain ⟨τ2, hag2, hs2⟩ := ih (fun g' hg' => hg g' (List.mem_cons_of_mem _ hg')) (g base).2 τ1 (le_trans hb hle) hP1
    refine ⟨τ2, fun v hv => ?_, ?_⟩
    · rw [hag2 v (le_trans hv hle), hag1 v hv]
    · rw [run_cons]
      exact Sat.append (Sat.agree hbd hag2 hs1) hs2

/-! ## AtMost -/

theorem getD_lt (l : List Int) {i : ℕ} (h : i < l.length) : l.getD i 0 = l[i] := by
  simp [List.getD_eq_getElem?_getD, List.getElem?_eq_getElem h]

theorem getD_mem (l : List Int) {i : ℕ} (h : i < l.length) : l.getD i 0 ∈ l := by
  rw [getD_lt l h]; exact List.getElem_mem h

/-- The number of true literals among l_0..l_i. -/
def cnt (τ : ℕ → Bool) (l : List Int) (i : ℕ) : ℕ := (l.take (i + 1)).countP (lit τ)

theorem cnt_zero (τ : ℕ → Bool) (l : List Int) (h : 0 < l.length) :
    cnt τ l 0 = if lit τ (l.getD 0 0) = true then 1 else 0 := by
  unfold cnt
  rw [List.take_succ_eq_append_getElem h, getD_lt l h]
  simp [List.countP_cons]

theorem cnt_succ (τ : ℕ → Bool) (l : List Int) (i : ℕ) (h : i + 1 < l.length) :
    cnt τ l (i + 1) = cnt τ l i + if lit τ (l.getD (i + 1) 0) = true then 1 else 0 := by
  unfold cnt
  rw [List.take_succ_eq_append_getElem h, List.countP_append, getD_lt l h]
  simp [List.countP_cons]

theorem cnt_le (τ : ℕ → Bool) (l : List Int) (i : ℕ) : cnt τ l i ≤ l.countP (lit τ) :=
  (List.take_sublist _ _).countP_le

/-- The clauses of AtMost in the main case, one family at a time. -/
theorem atMost_clauses (base : ℕ) (l : List Int) (k : ℕ) (h1 : ¬ l.length ≤ k) (h2 : k ≠ 0) (Q : Clause → Prop)
    (q0 : Q [-(l.getD 0 0), pos (base + 0 * k + 0 + 1)])
    (q1 : ∀ j, 1 ≤ j → j < k → Q [-(pos (base + 0 * k + j + 1))])
    (q2 : ∀ i, 1 ≤ i → i < l.length → Q [-(l.getD i 0), pos (base + i * k + 0 + 1)])
    (q3 : ∀ i, 1 ≤ i → i < l.length → Q [-(pos (base + (i - 1) * k + 0 + 1)), pos (base + i * k + 0 + 1)])
    (q4 : ∀ i j, 1 ≤ i → i < l.length → 1 ≤ j → j < k →
      Q [-(l.getD i 0), -(pos (base + (i - 1) * k + (j - 1) + 1)), pos (base + i * k + j + 1)])
    (q5 : ∀ i j, 1 ≤ i → i < l.length → 1 ≤ j → j < k →
      Q [-(pos (base + (i - 1) * k + j + 1)), pos (base + i * k + j + 1)])
    (q6 : ∀ i, 1 ≤ i → i < l.length → Q [-(l.getD i 0), -(pos (base + (i - 1) * k + (k - 1) + 1))]) :
    ∀ c ∈ (atMost base l k).1, Q c := by
  intro c hc
  unfold atMost at hc
  simp only [h1, h2, ↓reduceIte, List.mem_append, List.mem_cons, List.mem_map, List.mem_flatMap,
    List.mem_range'_1, List.mem_nil_iff, or_false] at hc
  rcases hc with (rfl | ⟨j, ⟨hj1, hj2⟩, rfl⟩) | ⟨i, ⟨hi1, hi2⟩, hc⟩
  · exact q0
  · exact q1 j hj1 (by omega)
  · have hi : i < l.length := by omega
    rcases hc with ((rfl | rfl) | ⟨j, ⟨hj1, hj2⟩, (rfl | rfl)⟩) | rfl
    · exact q2 i hi1 hi
    · exact q3 i hi1 hi
    · exact q4 i j hi1 hi hj1 (by omega)
    · exact q5 i j hi1 hi hj1 (by omega)
    · exact q6 i hi1 hi

theorem atMost_count (base : ℕ) (l : List Int) (k : ℕ) (h1 : ¬ l.length ≤ k) (h2 : k ≠ 0) :
    (atMost base l k).2 = base + l.length * k := by
  unfold atMost; simp only [h1, h2, ↓reduceIte]

/-- The extension of τ to the counter variables: s(i, j) is "at least j + 1 of l_0..l_i are true". -/
def sinz (τ : ℕ → Bool) (l : List Int) (base k : ℕ) : ℕ → Bool := fun v =>
  if base < v ∧ v ≤ base + l.length * k then decide ((v - base - 1) % k + 1 ≤ cnt τ l ((v - base - 1) / k)) else τ v

theorem sinz_bound {n k i j : ℕ} (base : ℕ) (hi : i < n) (hj : j < k) : base + i * k + j + 1 ≤ base + n * k := by
  have h := Nat.mul_le_mul_right k (Nat.succ_le_of_lt hi)
  rw [Nat.succ_mul] at h
  omega

theorem sinz_s (τ : ℕ → Bool) (l : List Int) (base k i j : ℕ) (hi : i < l.length) (hj : j < k) :
    sinz τ l base k (base + i * k + j + 1) = decide (j + 1 ≤ cnt τ l i) := by
  unfold sinz
  have hb := sinz_bound base hi hj
  have hr : base < base + i * k + j + 1 ∧ base + i * k + j + 1 ≤ base + l.length * k := ⟨by omega, hb⟩
  have e : base + i * k + j + 1 - base - 1 = j + i * k := by omega
  have hk : 0 < k := by omega
  simp only [hr, and_self, ↓reduceIte, e, Nat.add_mul_mod_self_right, Nat.mod_eq_of_lt hj,
    Nat.add_mul_div_right _ _ hk, Nat.div_eq_of_lt hj, Nat.zero_add]

theorem sinz_agree (τ : ℕ → Bool) (l : List Int) (base k : ℕ) : Agree base τ (sinz τ l base k) := by
  intro v hv
  unfold sinz
  have : ¬ (base < v ∧ v ≤ base + l.length * k) := by omega
  simp only [this, ↓reduceIte]

theorem atMost_good (base : ℕ) (τ : ℕ → Bool) (l : List Int) (k : ℕ)
    (hl : ∀ a ∈ l, a ≠ 0 ∧ a.natAbs ≤ base) (hk : l.countP (lit τ) ≤ k) :
    base ≤ (atMost base l k).2 ∧ Bdd (atMost base l k).2 (atMost base l k).1 ∧
      ∃ τ', Agree base τ τ' ∧ Sat τ' (atMost base l k).1 := by
  by_cases h1 : l.length ≤ k
  · have e : atMost base l k = ([], base) := by unfold atMost; simp only [h1, ↓reduceIte]
    rw [e]
    exact ⟨le_refl _, fun c hc => by simp at hc, τ, fun _ _ => rfl, fun c hc => by simp at hc⟩
  by_cases h2 : k = 0
  · subst h2
    have e : atMost base l 0 = (l.map fun a => [-a], base) := by unfold atMost; simp only [h1, ↓reduceIte]
    rw [e]
    refine ⟨le_refl _, ?_, τ, fun _ _ => rfl, ?_⟩
    · intro c hc a ha
      obtain ⟨b, hb, rfl⟩ := List.mem_map.mp hc
      rw [List.mem_singleton] at ha
      subst ha
      simpa using (hl b hb).2
    · intro c hc
      obtain ⟨b, hb, rfl⟩ := List.mem_map.mp hc
      refine ⟨-b, List.mem_singleton.mpr rfl, ?_⟩
      rw [lit_neg (hl b hb).1]
      have hf : lit τ b = false := by
        by_contra hne
        have hpos : 0 < l.countP (lit τ) := List.countP_pos_iff.mpr ⟨b, hb, by simpa using hne⟩
        omega
      simp [hf]
  · have hn : 0 < l.length := by omega
    have hk0 : 0 < k := by omega
    rw [atMost_count base l k h1 h2]
    -- facts about the extension
    have hS : ∀ i j, i < l.length → j < k →
        lit (sinz τ l base k) (pos (base + i * k + j + 1)) = decide (j + 1 ≤ cnt τ l i) := by
      intro i j hi hj; rw [lit_pos, sinz_s τ l base k i j hi hj]
    have hNS : ∀ i j, i < l.length → j < k →
        lit (sinz τ l base k) (-(pos (base + i * k + j + 1))) = !decide (j + 1 ≤ cnt τ l i) := by
      intro i j hi hj
      have : (-(pos (base + i * k + j + 1)) : Int) = neg (base + i * k + j + 1) := rfl
      rw [this, lit_negv (by omega), sinz_s τ l base k i j hi hj]
    have hL : ∀ i, i < l.length → lit (sinz τ l base k) (-(l.getD i 0)) = !lit τ (l.getD i 0) := by
      intro i hi
      have hm := hl _ (getD_mem l hi)
      rw [lit_neg hm.1, lit_agree (sinz_agree τ l base k) hm.2]
    have hcs : ∀ i, 1 ≤ i → i < l.length →
        cnt τ l i = cnt τ l (i - 1) + if lit τ (l.getD i 0) = true then 1 else 0 := by
      intro i hi1 hi
      obtain ⟨i', rfl⟩ : ∃ i', i = i' + 1 := ⟨i - 1, by omega⟩
      simpa using cnt_succ τ l i' hi
    have hck : ∀ i, cnt τ l i ≤ k := fun i => le_trans (cnt_le τ l i) hk
    have hbL : ∀ i, i < l.length → (l.getD i 0).natAbs ≤ base + l.length * k := fun i hi =>
      le_trans (hl _ (getD_mem l hi)).2 (Nat.le_add_right _ _)
    have key : ∀ c ∈ (atMost base l k).1,
        (∀ a ∈ c, a.natAbs ≤ base + l.length * k) ∧ ∃ a ∈ c, lit (sinz τ l base k) a = true := by
      apply atMost_clauses base l k h1 h2
      · -- (¬l_0, s(0,0))
        refine ⟨?_, ?_⟩
        · intro a ha
          simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
          rcases ha with rfl | rfl
          · simpa using hbL 0 hn
          · simpa using sinz_bound base hn hk0
        · have h0 := cnt_zero τ l hn
          simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
          rw [hL 0 hn, hS 0 0 hn hk0]
          cases hli : lit τ (l.getD 0 0)
          · left; rfl
          · right
            simp only [hli, ↓reduceIte] at h0
            simp only [decide_eq_true_eq]; omega
      · -- (¬s(0,j))
        intro j hj1 hj
        refine ⟨?_, ?_⟩
        · intro a ha
          simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
          subst ha
          simpa using sinz_bound base hn hj
        · have h0 := cnt_zero τ l hn
          simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_left]
          rw [hNS 0 j hn hj]
          have hle : cnt τ l 0 ≤ 1 := by rw [h0]; split <;> omega
          have : ¬ (j + 1 ≤ cnt τ l 0) := by omega
          simp [this]
      · -- (¬l_i, s(i,0))
        intro i hi1 hi
        refine ⟨?_, ?_⟩
        · intro a ha
          simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
          rcases ha with rfl | rfl
          · simpa using hbL i hi
          · simpa using sinz_bound base hi hk0
        · have h0 := hcs i hi1 hi
          simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
          rw [hL i hi, hS i 0 hi hk0]
          cases hli : lit τ (l.getD i 0)
          · left; rfl
          · right
            simp only [hli, ↓reduceIte] at h0
            simp only [decide_eq_true_eq]; omega
      · -- (¬s(i−1,0), s(i,0))
        intro i hi1 hi
        have hi' : i - 1 < l.length := by omega
        refine ⟨?_, ?_⟩
        · intro a ha
          simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
          rcases ha with rfl | rfl
          · simpa using sinz_bound base hi' hk0
          · simpa using sinz_bound base hi hk0
        · have h0 := hcs i hi1 hi
          simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
          rw [hNS (i - 1) 0 hi' hk0, hS i 0 hi hk0]
          by_cases hc : 0 + 1 ≤ cnt τ l (i - 1)
          · right; simp only [decide_eq_true_eq]; omega
          · left; simp [hc]
      · -- (¬l_i, ¬s(i−1,j−1), s(i,j))
        intro i j hi1 hi hj1 hj
        have hi' : i - 1 < l.length := by omega
        have hj' : j - 1 < k := by omega
        refine ⟨?_, ?_⟩
        · intro a ha
          simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
          rcases ha with rfl | rfl | rfl
          · simpa using hbL i hi
          · simpa using sinz_bound base hi' hj'
          · simpa using sinz_bound base hi hj
        · have h0 := hcs i hi1 hi
          simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
          rw [hL i hi, hNS (i - 1) (j - 1) hi' hj', hS i j hi hj]
          by_cases hc : j - 1 + 1 ≤ cnt τ l (i - 1)
          · cases hli : lit τ (l.getD i 0)
            · left; rfl
            · right; right
              simp only [hli, ↓reduceIte] at h0
              simp only [decide_eq_true_eq]; omega
          · right; left; simp [hc]
      · -- (¬s(i−1,j), s(i,j))
        intro i j hi1 hi hj1 hj
        have hi' : i - 1 < l.length := by omega
        refine ⟨?_, ?_⟩
        · intro a ha
          simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
          rcases ha with rfl | rfl
          · simpa using sinz_bound base hi' hj
          · simpa using sinz_bound base hi hj
        · have h0 := hcs i hi1 hi
          simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
          rw [hNS (i - 1) j hi' hj, hS i j hi hj]
          by_cases hc : j + 1 ≤ cnt τ l (i - 1)
          · right; simp only [decide_eq_true_eq]; omega
          · left; simp [hc]
      · -- (¬l_i, ¬s(i−1,k−1))
        intro i hi1 hi
        have hi' : i - 1 < l.length := by omega
        have hj' : k - 1 < k := by omega
        refine ⟨?_, ?_⟩
        · intro a ha
          simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
          rcases ha with rfl | rfl
          · simpa using hbL i hi
          · simpa using sinz_bound base hi' hj'
        · have h0 := hcs i hi1 hi
          have h3 := hck i
          simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
          rw [hL i hi, hNS (i - 1) (k - 1) hi' hj']
          cases hli : lit τ (l.getD i 0)
          · left; rfl
          · right
            simp only [hli, ↓reduceIte] at h0
            have : ¬ (k - 1 + 1 ≤ cnt τ l (i - 1)) := by omega
            simp [this]
    exact ⟨Nat.le_add_right _ _, fun c hc => (key c hc).1, sinz τ l base k, sinz_agree τ l base k,
      fun c hc => (key c hc).2⟩

/-! ## Exactly -/

theorem exactly_eq (base : ℕ) (l : List Int) (k : ℕ) :
    exactly base l k = ((atMost base l k).1 ++ (atMost (atMost base l k).2 (l.map fun a => -a) (l.length - k)).1,
      (atMost (atMost base l k).2 (l.map fun a => -a) (l.length - k)).2) := rfl

theorem exactly_good (base : ℕ) (τ : ℕ → Bool) (l : List Int) (k : ℕ)
    (hl : ∀ a ∈ l, a ≠ 0 ∧ a.natAbs ≤ base) (hk : l.countP (lit τ) = k) :
    base ≤ (exactly base l k).2 ∧ Bdd (exactly base l k).2 (exactly base l k).1 ∧
      ∃ τ', Agree base τ τ' ∧ Sat τ' (exactly base l k).1 := by
  obtain ⟨hle1, hbd1, τ1, hag1, hs1⟩ := atMost_good base τ l k hl (le_of_eq hk)
  have hl2 : ∀ a ∈ l.map (fun a => -a), a ≠ 0 ∧ a.natAbs ≤ (atMost base l k).2 := by
    intro a ha
    obtain ⟨b, hb, rfl⟩ := List.mem_map.mp ha
    exact ⟨neg_ne_zero.mpr (hl b hb).1, by rw [Int.natAbs_neg]; exact le_trans (hl b hb).2 hle1⟩
  have hk2 : (l.map fun a => -a).countP (lit τ1) ≤ l.length - k := by
    rw [List.countP_map]
    have e : l.countP (lit τ1 ∘ fun a => -a) = l.countP (fun a => decide ¬ lit τ a = true) := by
      apply List.countP_congr
      intro a ha
      simp [lit_neg (hl a ha).1, lit_agree hag1 (hl a ha).2]
    have h := List.length_eq_countP_add_countP (lit τ) (l := l)
    rw [e]; omega
  obtain ⟨hle2, hbd2, τ2, hag2, hs2⟩ :=
    atMost_good (atMost base l k).2 τ1 (l.map fun a => -a) (l.length - k) hl2 hk2
  rw [exactly_eq]
  refine ⟨le_trans hle1 hle2, ?_, τ2, fun v hv => ?_, Sat.append (Sat.agree hbd1 hag2 hs1) hs2⟩
  · intro c hc
    rcases List.mem_append.mp hc with h | h
    · exact (hbd1.mono hle2) c h
    · exact hbd2 c h
  · rw [hag2 v (le_trans hv hle1), hag1 v hv]

/-! ## The gadgets of F -/

theorem xv_le (c : Fin 7) (y : Fin 27) : xv c y ≤ 189 := by
  unfold xv; have := c.isLt; have := y.isLt; omega

theorem xv_pos (c : Fin 7) (y : Fin 27) : 0 < xv c y := by unfold xv; omega

theorem xv_inj {c c' : Fin 7} {y y' : Fin 27} (h : xv c y = xv c' y') : c = c' ∧ y = y' := by
  unfold xv at h
  have := y.isLt; have := y'.isLt
  constructor <;> apply Fin.ext <;> omega

/-- The assignment of the x variables given by seven rows. -/
def tau0 (row : Fin 7 → Fin 27 → Bool) : ℕ → Bool := fun v => decide (∃ c y, xv c y = v ∧ row c y = true)

theorem tau0_x (row : Fin 7 → Fin 27 → Bool) (c : Fin 7) (y : Fin 27) : tau0 row (xv c y) = row c y := by
  unfold tau0
  by_cases h : row c y = true
  · rw [h]; exact decide_eq_true ⟨c, y, rfl, h⟩
  · have hf : row c y = false := by simpa using h
    rw [hf]
    apply decide_eq_false
    rintro ⟨c', y', he, hr⟩
    obtain ⟨rfl, rfl⟩ := xv_inj he
    rw [hf] at hr
    exact Bool.false_ne_true hr

/-- The x variables say: y is in row c. -/
def IsRows (row : Fin 7 → Fin 27 → Bool) (τ : ℕ → Bool) : Prop := ∀ c y, τ (xv c y) = row c y

theorem IsRows.agree {row : Fin 7 → Fin 27 → Bool} {τ τ' : ℕ → Bool} (h : IsRows row τ) (hag : Agree 189 τ τ') :
    IsRows row τ' := fun c y => by rw [hag _ (xv_le c y)]; exact h c y

theorem good_T (inp : Input) (row : Fin 7 → Fin 27 → Bool)
    (hT : ∀ c y z, row c y = true → row c z = true → inp.adj y z = false) :
    Good (IsRows row) (fun b => (clausesT inp.adj, b)) := by
  intro base τ hb hτ
  have key : ∀ cl ∈ clausesT inp.adj, (∀ a ∈ cl, a.natAbs ≤ base) ∧ ∃ a ∈ cl, lit τ a = true := by
    intro cl hcl
    simp only [clausesT, List.mem_flatMap, List.mem_map, List.mem_filter, List.mem_finRange, true_and,
      Bool.and_eq_true, decide_eq_true_eq] at hcl
    obtain ⟨c, y, z, ⟨-, hadj⟩, rfl⟩ := hcl
    refine ⟨?_, ?_⟩
    · intro a ha
      simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
      rcases ha with rfl | rfl
      · rw [natAbs_neg']; exact le_trans (xv_le c y) hb
      · rw [natAbs_neg']; exact le_trans (xv_le c z) hb
    · simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
      rw [lit_negv (xv_pos c y), lit_negv (xv_pos c z), hτ c y, hτ c z]
      cases hy : row c y
      · left; rfl
      · cases hz : row c z
        · right; rfl
        · have := hT c y z hy hz; rw [hadj] at this; exact absurd this (by simp)
  exact ⟨le_refl _, fun cl hcl => (key cl hcl).1, τ, fun _ _ => rfl, fun cl hcl => (key cl hcl).2⟩

theorem good_row (row : Fin 7 → Fin 27 → Bool) (c : Fin 7) (hrow : (List.finRange 27).countP (row c) = 7) :
    Good (IsRows row) (fun b => exactly b ((List.finRange 27).map fun y => pos (xv c y)) 7) := by
  intro base τ hb hτ
  apply exactly_good
  · intro a ha
    obtain ⟨y, -, rfl⟩ := List.mem_map.mp ha
    refine ⟨?_, by rw [natAbs_pos']; exact le_trans (xv_le c y) hb⟩
    have := xv_pos c y
    unfold pos; simp only [Int.ofNat_eq_natCast, ne_eq, Int.natCast_eq_zero]; omega
  · rw [List.countP_map, ← hrow]
    apply List.countP_congr
    intro y _
    simp [lit_pos, hτ c y]

theorem good_col (inp : Input) (row : Fin 7 → Fin 27 → Bool) (y : Fin 27)
    (hcol : (List.finRange 7).countP (fun c => row c y) = rprime inp y) :
    Good (IsRows row) (fun b => exactly b ((List.finRange 7).map fun c => pos (xv c y)) (rprime inp y)) := by
  intro base τ hb hτ
  apply exactly_good
  · intro a ha
    obtain ⟨c, -, rfl⟩ := List.mem_map.mp ha
    refine ⟨?_, by rw [natAbs_pos']; exact le_trans (xv_le c y) hb⟩
    have := xv_pos c y
    unfold pos; simp only [Int.ofNat_eq_natCast, ne_eq, Int.natCast_eq_zero]; omega
  · rw [List.countP_map, ← hcol]
    apply List.countP_congr
    intro c _
    simp [lit_pos, hτ c y]

theorem subsets7_nodup {C' : List (Fin 7)} (h : C' ∈ subsets7) : C'.Nodup := by
  simp only [subsets7, List.mem_map] at h
  obtain ⟨sub, -, rfl⟩ := h
  exact (List.nodup_finRange 7).filter _

theorem good_I (inp : Input) (ℓ : ℕ) (row : Fin 7 → Fin 27 → Bool)
    (hI : ∀ I ∈ indepSets inp.adj, I ≠ [] → ∀ C' : List (Fin 7), C'.Nodup → C'.length = kOf inp I →
      ∃ c ∈ C', ∃ y ∈ I, row c y = true) :
    Good (IsRows row) (fun b => (clausesI inp ℓ, b)) := by
  intro base τ hb hτ
  have key : ∀ cl ∈ clausesI inp ℓ, (∀ a ∈ cl, a.natAbs ≤ base) ∧ ∃ a ∈ cl, lit τ a = true := by
    intro cl hcl
    simp only [clausesI, List.mem_flatMap] at hcl
    obtain ⟨I, hIS, hcl⟩ := hcl
    unfold clausesOfSet at hcl
    split at hcl
    · rename_i hcond
      simp only [Bool.and_eq_true, Bool.not_eq_true', decide_eq_true_eq] at hcond
      simp only [List.mem_map, List.mem_filter, beq_iff_eq] at hcl
      obtain ⟨C', ⟨hC', hlen⟩, rfl⟩ := hcl
      have hne : I ≠ [] := by
        intro h; rw [h] at hcond; simp at hcond
      refine ⟨?_, ?_⟩
      · intro a ha
        simp only [List.mem_flatMap, List.mem_map] at ha
        obtain ⟨c, -, y, -, rfl⟩ := ha
        rw [natAbs_pos']; exact le_trans (xv_le c y) hb
      · obtain ⟨c, hc, y, hy, hr⟩ := hI I hIS hne C' (subsets7_nodup hC') hlen
        refine ⟨pos (xv c y), ?_, ?_⟩
        · simp only [List.mem_flatMap, List.mem_map]
          exact ⟨c, hc, y, hy, rfl⟩
        · rw [lit_pos, hτ c y, hr]
    · simp at hcl
  exact ⟨le_refl _, fun cl hcl => (key cl hcl).1, τ, fun _ _ => rfl, fun cl hcl => (key cl hcl).2⟩

/-! ## The row order (S) -/

/-- Rows c and c′ agree on the positions below n. -/
def agreeBelow (row : Fin 7 → Fin 27 → Bool) (c c' : Fin 7) (n : ℕ) : Prop :=
  ∀ y' : Fin 27, y'.val < n → row c y' = row c' y'

instance (row : Fin 7 → Fin 27 → Bool) (c c' : Fin 7) (n : ℕ) : Decidable (agreeBelow row c c' n) := by
  unfold agreeBelow; infer_instance

/-- The extension to the variables e_0..e_26 of one pair of rows: e_y is "the rows agree below y". -/
def lexTau (row : Fin 7 → Fin 27 → Bool) (c c' : Fin 7) (τ : ℕ → Bool) (base : ℕ) : ℕ → Bool := fun v =>
  if base < v ∧ v ≤ base + 27 then decide (agreeBelow row c c' (v - base - 1)) else τ v

theorem agreeBelow_succ {row : Fin 7 → Fin 27 → Bool} {c c' : Fin 7} {y : Fin 27}
    (h : agreeBelow row c c' y.val) (hy : row c y = row c' y) : agreeBelow row c c' (y.val + 1) := by
  intro y' hy'
  by_cases hlt : y'.val < y.val
  · exact h y' hlt
  · have : y' = y := Fin.ext (by omega)
    rw [this]; exact hy

theorem good_lex (row : Fin 7 → Fin 27 → Bool) (c c' : Fin 7)
    (hS : ∀ y : Fin 27, agreeBelow row c c' y.val → row c y = true → row c' y = true) :
    Good (IsRows row) (fun b => lexPair b c c') := by
  intro base τ hb hτ
  have hE : ∀ n, n ≤ 26 → lexTau row c c' τ base (base + 1 + n) = decide (agreeBelow row c c' n) := by
    intro n hn
    unfold lexTau
    have hr : base < base + 1 + n ∧ base + 1 + n ≤ base + 27 := by omega
    have e : base + 1 + n - base - 1 = n := by omega
    simp only [hr, and_self, ↓reduceIte, e]
  have hag : Agree base τ (lexTau row c c' τ base) := by
    intro v hv
    unfold lexTau
    have : ¬ (base < v ∧ v ≤ base + 27) := by omega
    simp only [this, ↓reduceIte]
  have hX : ∀ c0 y, lexTau row c c' τ base (xv c0 y) = row c0 y := fun c0 y => by
    rw [hag _ (le_trans (xv_le c0 y) hb)]; exact hτ c0 y
  have hxb : ∀ c0 y, xv c0 y ≤ base + 27 := fun c0 y => le_trans (xv_le c0 y) (by omega)
  have key : ∀ cl ∈ (lexPair base c c').1,
      (∀ a ∈ cl, a.natAbs ≤ base + 27) ∧ ∃ a ∈ cl, lit (lexTau row c c' τ base) a = true := by
    intro cl hcl
    simp only [lexPair, List.mem_cons, List.mem_flatMap, List.mem_finRange, true_and] at hcl
    rcases hcl with rfl | ⟨y, rfl | hcl⟩
    · refine ⟨?_, ?_⟩
      · intro a ha
        simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
        subst ha
        rw [natAbs_pos']; omega
      · simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_left]
        rw [lit_pos, hE 0 (by omega)]
        exact decide_eq_true (fun y' h => absurd h (Nat.not_lt_zero _))
    · have hy := y.isLt
      refine ⟨?_, ?_⟩
      · intro a ha
        simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
        rcases ha with rfl | rfl | rfl
        · rw [natAbs_neg']; omega
        · rw [natAbs_neg']; exact hxb _ _
        · rw [natAbs_pos']; exact hxb _ _
      · simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
        rw [lit_negv (by omega), lit_negv (xv_pos _ _), lit_pos, hE y.val (by omega), hX, hX]
        by_cases ha : agreeBelow row c c' y.val
        · cases hc : row c y
          · right; left; rfl
          · right; right; exact hS y ha hc
        · left; simp [ha]
    · have hy := y.isLt
      by_cases hy26 : y.val < 26
      · simp only [hy26, ↓reduceIte, List.mem_cons, List.mem_nil_iff, or_false] at hcl
        rcases hcl with rfl | rfl
        · refine ⟨?_, ?_⟩
          · intro a ha
            simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
            rcases ha with rfl | rfl | rfl | rfl
            · rw [natAbs_neg']; omega
            · rw [natAbs_neg']; exact hxb _ _
            · rw [natAbs_neg']; exact hxb _ _
            · rw [natAbs_pos']; omega
          · simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
            rw [lit_negv (by omega), lit_negv (xv_pos _ _), lit_negv (xv_pos _ _), lit_pos, hE y.val (by omega),
              hE (y.val + 1) (by omega), hX, hX]
            by_cases ha : agreeBelow row c c' y.val
            · cases hc : row c y
              · right; left; rfl
              · cases hc' : row c' y
                · right; right; left; rfl
                · right; right; right
                  exact decide_eq_true (agreeBelow_succ ha (by rw [hc, hc']))
            · left; simp [ha]
        · refine ⟨?_, ?_⟩
          · intro a ha
            simp only [List.mem_cons, List.mem_nil_iff, or_false] at ha
            rcases ha with rfl | rfl | rfl | rfl
            · rw [natAbs_neg']; omega
            · rw [natAbs_pos']; exact hxb _ _
            · rw [natAbs_pos']; exact hxb _ _
            · rw [natAbs_pos']; omega
          · simp only [List.mem_cons, List.mem_nil_iff, or_false, exists_eq_or_imp, exists_eq_left]
            rw [lit_negv (by omega), lit_pos, lit_pos, lit_pos, hE y.val (by omega),
              hE (y.val + 1) (by omega), hX, hX]
            by_cases ha : agreeBelow row c c' y.val
            · cases hc : row c y
              · cases hc' : row c' y
                · right; right; right
                  exact decide_eq_true (agreeBelow_succ ha (by rw [hc, hc']))
                · right; right; left; rfl
              · right; left; rfl
            · left; simp [ha]
      · simp only [hy26, ↓reduceIte, List.mem_nil_iff] at hcl
  exact ⟨by simp [lexPair], fun cl hcl => by simpa [lexPair] using (key cl hcl).1,
    lexTau row c c' τ base, hag, fun cl hcl => (key cl hcl).2⟩

/-! ## T1 on rows given as Boolean tables -/

theorem core (inp : Input) (ℓ : ℕ) (row : Fin 7 → Fin 27 → Bool)
    (hT : ∀ c y z, row c y = true → row c z = true → inp.adj y z = false)
    (hrow : ∀ c, (List.finRange 27).countP (row c) = 7)
    (hcol : ∀ y, (List.finRange 7).countP (fun c => row c y) = rprime inp y)
    (hI : ∀ I ∈ indepSets inp.adj, I ≠ [] → ∀ C' : List (Fin 7), C'.Nodup → C'.length = kOf inp I →
      ∃ c ∈ C', ∃ y ∈ I, row c y = true)
    (hS : ∀ c : Fin 6, ∀ y : Fin 27, agreeBelow row c.castSucc c.succ y.val → row c.castSucc y = true →
      row c.succ y = true) :
    ∃ τ, Sat τ (F inp ℓ).1 := by
  have hg : ∀ g ∈ gadgets inp ℓ, Good (IsRows row) g := by
    intro g hg
    simp only [gadgets, List.mem_append, List.mem_cons, List.mem_map, List.mem_finRange, true_and,
      List.mem_nil_iff, or_false] at hg
    rcases hg with (((rfl | ⟨c, rfl⟩) | ⟨y, rfl⟩) | rfl) | ⟨c, rfl⟩
    · exact good_T inp row hT
    · exact good_row row c (hrow c)
    · exact good_col inp row y (hcol y)
    · exact good_I inp ℓ row hI
    · exact good_lex row c.castSucc c.succ (hS c)
  obtain ⟨τ, -, hs⟩ := run_sat (IsRows row) (fun τ τ' h hag => h.agree hag) (gadgets inp ℓ) hg 189 (tau0 row)
    (le_refl _) (tau0_x row)
  exact ⟨τ, hs⟩

/-! ## T1 on a graph and finite sets -/

theorem finRange_countP {n : ℕ} (p : Fin n → Bool) :
    (List.finRange n).countP p = (Finset.univ.filter fun i => p i = true).card := by
  rw [Fin.univ_def, List.countP_eq_length_filter]
  simp [Finset.card, Finset.filter]

/-- Every member of IS is a subsequence of the list, with no two members adjacent. -/
theorem indepSubs_spec (adj : Fin 27 → Fin 27 → Bool) :
    ∀ (l s : List (Fin 27)), s ∈ indepSubs adj l → s.Sublist l ∧ s.Pairwise (fun a z => adj a z = false)
  | [], s, h => by
    simp only [indepSubs, List.mem_cons, List.mem_nil_iff, or_false] at h
    subst h
    exact ⟨List.Sublist.refl _, List.Pairwise.nil⟩
  | a :: l, s, h => by
    simp only [indepSubs, List.mem_cons, List.mem_append, List.mem_map, List.mem_filter, List.all_eq_true,
      Bool.not_eq_true'] at h
    rcases h with rfl | ⟨s', ⟨hs', hall⟩, rfl⟩ | ht
    · exact ⟨List.nil_sublist _, List.Pairwise.nil⟩
    · obtain ⟨h1, h2⟩ := indepSubs_spec adj l s' hs'
      exact ⟨h1.cons_cons a, List.pairwise_cons.mpr ⟨hall, h2⟩⟩
    · obtain ⟨h1, h2⟩ := indepSubs_spec adj l s (List.mem_of_mem_tail ht)
      exact ⟨h1.cons a, h2⟩

/-- The executable input of a graph and four sides. -/
def inputOfGraph (X : SimpleGraph (Fin 27)) [DecidableRel X.Adj] (S : Fin 4 → Finset (Fin 27)) : Input :=
  ⟨fun y z => decide (X.Adj y z), fun j y => decide (y ∈ S j)⟩

/-- 1 if the side T is disjoint from I, else 0. -/
def missF (T I : Finset (Fin 27)) : ℕ := if Disjoint T I then 1 else 0

/-- **T1 (soundness).** For every graph X on 0..26, every four subsets and every level: seven subsets with (a), (b), (c)
give a satisfying assignment of F. -/
theorem T1 (X : SimpleGraph (Fin 27)) [DecidableRel X.Adj] (S : Fin 4 → Finset (Fin 27)) (ℓ : ℕ)
    (R : Fin 7 → Finset (Fin 27))
    (ha : ∀ c, X.IsIndepSet (R c : Set (Fin 27)) ∧ (R c).card = 7)
    (hb : ∀ y, X.degree y + (Finset.univ.filter fun j => y ∈ S j).card
      + (Finset.univ.filter fun c => y ∈ R c).card = 9)
    (hc : ∀ I : Finset (Fin 27), I.Nonempty → X.IsIndepSet (I : Set (Fin 27)) →
      (Finset.univ.filter fun c => Disjoint (R c) I).card
        < 10 - I.card - max (missF (S 0) I + missF (S 1) I) (missF (S 2) I + missF (S 3) I)) :
    ∃ τ, Sat τ (F (inputOfGraph X S) ℓ).1 := by
  classical
  let f : Fin 7 → Lex (Fin 27 → Bool) := fun c => toLex (fun y => decide (y ∈ R c))
  let σ : Equiv.Perm (Fin 7) := Tuple.sort f
  let row : Fin 7 → Fin 27 → Bool := fun c y => decide (y ∈ R (σ c))
  apply core (inputOfGraph X S) ℓ row
  · intro c y z hy hz
    simp only [row, decide_eq_true_eq] at hy hz
    simp only [inputOfGraph, decide_eq_false_iff_not]
    by_cases hyz : y = z
    · subst hyz; exact X.irrefl
    · exact (ha (σ c)).1 (Finset.mem_coe.mpr hy) (Finset.mem_coe.mpr hz) hyz
  · intro c
    rw [finRange_countP]
    have : (Finset.univ.filter fun y => row c y = true) = R (σ c) := by ext y; simp [row]
    rw [this]; exact (ha (σ c)).2
  · intro y
    rw [finRange_countP]
    have e1 : (Finset.univ.filter fun c => row c y = true).card = (Finset.univ.filter fun c => y ∈ R c).card :=
      Finset.card_equiv σ (fun c => by simp [row])
    have e2 : deg (inputOfGraph X S).adj y = X.degree y := by
      unfold deg
      rw [← List.countP_eq_length_filter, finRange_countP, ← SimpleGraph.card_neighborFinset_eq_degree,
        SimpleGraph.neighborFinset_eq_filter]
      simp [inputOfGraph]
    have e3 : sidesAt (inputOfGraph X S).side y = (Finset.univ.filter fun j => y ∈ S j).card := by
      unfold sidesAt
      rw [← List.countP_eq_length_filter, finRange_countP]
      simp [inputOfGraph]
    have := hb y
    unfold rprime
    rw [e1, e2, e3]; omega
  · intro I hIS hne C' hnd hlen
    obtain ⟨hsub, hpw⟩ := indepSubs_spec _ _ _ hIS
    have hInd : I.Nodup := hsub.nodup (List.nodup_finRange 27)
    have hcard : I.toFinset.card = I.length := List.toFinset_card_of_nodup hInd
    have hnon : I.toFinset.Nonempty := by
      obtain ⟨y, hy⟩ := List.exists_mem_of_ne_nil I hne
      exact ⟨y, List.mem_toFinset.mpr hy⟩
    have hindep : X.IsIndepSet (I.toFinset : Set (Fin 27)) := by
      intro v hv w hw hvw
      have hv' : v ∈ I := by simpa using hv
      have hw' : w ∈ I := by simpa using hw
      have : Std.Symm (fun a z : Fin 27 => (inputOfGraph X S).adj a z = false) :=
        ⟨fun a z h => by
          simp only [inputOfGraph, decide_eq_false_iff_not] at h ⊢
          exact fun h' => h h'.symm⟩
      have := hpw.forall hv' hw' hvw
      simpa [inputOfGraph] using this
    have hk := hc I.toFinset hnon hindep
    have hmiss : ∀ j, missSide (inputOfGraph X S).side j I = missF (S j) I.toFinset := by
      intro j
      unfold missSide missF
      have hiff : (I.all fun y => !(inputOfGraph X S).side j y) = true ↔ Disjoint (S j) I.toFinset := by
        simp [inputOfGraph, Finset.disjoint_right]
      by_cases h : Disjoint (S j) I.toFinset
      · simp only [hiff.mpr h, h, ↓reduceIte]
      · have h' : (I.all fun y => !(inputOfGraph X S).side j y) = false := by
          cases hb' : (I.all fun y => !(inputOfGraph X S).side j y)
          · rfl
          · exact absurd (hiff.mp hb') h
        rw [h']; simp only [h, ↓reduceIte]; rfl
    have hkof : kOf (inputOfGraph X S) I = 10 - I.toFinset.card
        - max (missF (S 0) I.toFinset + missF (S 1) I.toFinset) (missF (S 2) I.toFinset + missF (S 3) I.toFinset) := by
      unfold kOf maxMiss
      rw [hmiss, hmiss, hmiss, hmiss, hcard]
    by_contra hcon
    push Not at hcon
    have hsubset : (C'.map σ).toFinset ⊆ Finset.univ.filter fun c => Disjoint (R c) I.toFinset := by
      intro c hc'
      simp only [List.mem_toFinset, List.mem_map] at hc'
      obtain ⟨c0, hc0, rfl⟩ := hc'
      simp only [Finset.mem_filter, Finset.mem_univ, true_and]
      rw [Finset.disjoint_right]
      intro y hy hyR
      exact hcon c0 hc0 y (by simpa using hy) (by simp [row, hyR])
    have h1 := Finset.card_le_card hsubset
    have h2 : (C'.map σ).toFinset.card = C'.length := by
      rw [List.toFinset_card_of_nodup (hnd.map σ.injective), List.length_map]
    omega
  · intro c y hagree hcy
    have hmono : f (σ c.castSucc) ≤ f (σ c.succ) := Tuple.monotone_sort f (Fin.castSucc_lt_succ).le
    by_contra hne
    have hf : row c.succ y = false := by simpa using hne
    have hlt : f (σ c.succ) < f (σ c.castSucc) := by
      refine ⟨y, fun j hj => (hagree j hj).symm, ?_⟩
      show row c.succ y < row c.castSucc y
      rw [hf, hcy]; decide
    exact absurd hmono (not_le.mpr hlt)

/-! ## T0: the 8 labelled images -/

theorem F_congr (inp inp' : Input) (ℓ : ℕ) (hadj : inp'.adj = inp.adj)
    (hs : ∀ y, sidesAt inp'.side y = sidesAt inp.side y) (hm : ∀ I, maxMiss inp'.side I = maxMiss inp.side I) :
    F inp' ℓ = F inp ℓ := by
  have hr : rprime inp' = rprime inp := by funext y; unfold rprime; rw [hadj, hs]
  have hk : kOf inp' = kOf inp := by funext I; unfold kOf; rw [hm]
  have hcs : clausesOfSet inp' ℓ = clausesOfSet inp ℓ := by funext I; unfold clausesOfSet; rw [hk]
  have hI : clausesI inp' ℓ = clausesI inp ℓ := by unfold clausesI; rw [hadj, hcs]
  unfold F gadgets
  rw [hadj, hr, hI]

/-- The input with the four sides s0, s1 (the A sides) and s2, s3 (the B sides). -/
def mk4 (adj : Fin 27 → Fin 27 → Bool) (s0 s1 s2 s3 : Fin 27 → Bool) : Input :=
  ⟨adj, fun j => if j = 0 then s0 else if j = 1 then s1 else if j = 2 then s2 else s3⟩

theorem sidesAt_mk4 (adj : Fin 27 → Fin 27 → Bool) (s0 s1 s2 s3 : Fin 27 → Bool) (y : Fin 27) :
    sidesAt (mk4 adj s0 s1 s2 s3).side y
      = (if s0 y then 1 else 0) + (if s1 y then 1 else 0) + (if s2 y then 1 else 0) + (if s3 y then 1 else 0) := by
  have hfin : List.finRange 4 = [0, 1, 2, 3] := by decide
  unfold sidesAt mk4
  rw [hfin]
  cases h0 : s0 y <;> cases h1 : s1 y <;> cases h2 : s2 y <;> cases h3 : s3 y <;> simp [List.filter, h0, h1, h2, h3]

theorem maxMiss_mk4 (adj : Fin 27 → Fin 27 → Bool) (s0 s1 s2 s3 : Fin 27 → Bool) (I : List (Fin 27)) :
    maxMiss (mk4 adj s0 s1 s2 s3).side I
      = max ((if I.all (fun y => !s0 y) then 1 else 0) + (if I.all (fun y => !s1 y) then 1 else 0))
          ((if I.all (fun y => !s2 y) then 1 else 0) + (if I.all (fun y => !s3 y) then 1 else 0)) := rfl

theorem F_mk4_congr (adj : Fin 27 → Fin 27 → Bool) (s0 s1 s2 s3 t0 t1 t2 t3 : Fin 27 → Bool) (ℓ : ℕ)
    (hs : ∀ y, sidesAt (mk4 adj t0 t1 t2 t3).side y = sidesAt (mk4 adj s0 s1 s2 s3).side y)
    (hm : ∀ I, maxMiss (mk4 adj t0 t1 t2 t3).side I = maxMiss (mk4 adj s0 s1 s2 s3).side I) :
    F (mk4 adj t0 t1 t2 t3) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ :=
  F_congr (mk4 adj s0 s1 s2 s3) (mk4 adj t0 t1 t2 t3) ℓ rfl hs hm

/-- **T0 (images).** F is the same list for each of the 8 labelled images of the four sides. -/
theorem T0 (adj : Fin 27 → Fin 27 → Bool) (s0 s1 s2 s3 : Fin 27 → Bool) (ℓ : ℕ) :
    F (mk4 adj s1 s0 s2 s3) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ ∧
    F (mk4 adj s0 s1 s3 s2) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ ∧
    F (mk4 adj s1 s0 s3 s2) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ ∧
    F (mk4 adj s2 s3 s0 s1) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ ∧
    F (mk4 adj s2 s3 s1 s0) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ ∧
    F (mk4 adj s3 s2 s0 s1) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ ∧
    F (mk4 adj s3 s2 s1 s0) ℓ = F (mk4 adj s0 s1 s2 s3) ℓ := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;>
  · apply F_mk4_congr
    · intro y; rw [sidesAt_mk4, sidesAt_mk4]; omega
    · intro I; rw [maxMiss_mk4, maxMiss_mk4]
      omega

/-- Every input is the `mk4` of its own four sides, so T0 covers every input. -/
theorem eq_mk4 (inp : Input) : inp = mk4 inp.adj (inp.side 0) (inp.side 1) (inp.side 2) (inp.side 3) := by
  cases inp with
  | mk adj side =>
    unfold mk4
    congr 1
    funext j
    fin_cases j <;> rfl

/-! ## T1 for any executable input with a symmetric, loopless adjacency -/

/-- The set of side j of an input. -/
def sideSet (inp : Input) (j : Fin 4) : Finset (Fin 27) := Finset.univ.filter fun y => inp.side j y = true

/-- **T1, on the input the program runs on.** The same statement with the graph given by the input's own table. -/
theorem T1_input (inp : Input) (ℓ : ℕ) (hsymm : ∀ y z, inp.adj y z = true → inp.adj z y = true)
    (hirr : ∀ y, inp.adj y y = false) (R : Fin 7 → Finset (Fin 27))
    (ha : ∀ c, (∀ y ∈ R c, ∀ z ∈ R c, inp.adj y z = false) ∧ (R c).card = 7)
    (hb : ∀ y, (Finset.univ.filter fun z => inp.adj y z = true).card
      + (Finset.univ.filter fun j => inp.side j y = true).card + (Finset.univ.filter fun c => y ∈ R c).card = 9)
    (hc : ∀ I : Finset (Fin 27), I.Nonempty → (∀ y ∈ I, ∀ z ∈ I, inp.adj y z = false) →
      (Finset.univ.filter fun c => Disjoint (R c) I).card
        < 10 - I.card - max (missF (sideSet inp 0) I + missF (sideSet inp 1) I)
            (missF (sideSet inp 2) I + missF (sideSet inp 3) I)) :
    ∃ τ, Sat τ (F inp ℓ).1 := by
  classical
  let X : SimpleGraph (Fin 27) :=
    { Adj := fun y z => inp.adj y z = true
      symm := ⟨fun y z h => hsymm y z h⟩
      loopless := ⟨fun y h => by rw [hirr y] at h; exact Bool.false_ne_true h⟩ }
  have hX : ∀ y z, X.Adj y z ↔ inp.adj y z = true := fun _ _ => Iff.rfl
  have h1 : (inputOfGraph X (sideSet inp)).adj = inp.adj := by
    funext y z
    show decide (inp.adj y z = true) = inp.adj y z
    simp
  have h2 : (inputOfGraph X (sideSet inp)).side = inp.side := by
    funext j y
    simp [inputOfGraph, sideSet]
  have e : inputOfGraph X (sideSet inp) = inp :=
    calc inputOfGraph X (sideSet inp)
        = ⟨(inputOfGraph X (sideSet inp)).adj, (inputOfGraph X (sideSet inp)).side⟩ := rfl
      _ = ⟨inp.adj, inp.side⟩ := by rw [h1, h2]
      _ = inp := rfl
  rw [← e]
  apply T1 X (sideSet inp) ℓ R
  · intro c
    refine ⟨?_, (ha c).2⟩
    intro y hy z hz _
    rw [hX, (ha c).1 y (Finset.mem_coe.mp hy) z (Finset.mem_coe.mp hz)]
    exact Bool.false_ne_true
  · intro y
    have h := hb y
    have e1 : X.degree y = (Finset.univ.filter fun z => inp.adj y z = true).card := by
      rw [← SimpleGraph.card_neighborFinset_eq_degree, SimpleGraph.neighborFinset_eq_filter]
    have e2 : (Finset.univ.filter fun j => y ∈ sideSet inp j).card
        = (Finset.univ.filter fun j => inp.side j y = true).card := by
      congr 1; ext j; simp [sideSet]
    rw [e1, e2]; exact h
  · intro I hne hind
    apply hc I hne
    intro y hy z hz
    by_cases hyz : y = z
    · subst hyz; exact hirr y
    · have hn : ¬ X.Adj y z := hind (Finset.mem_coe.mpr hy) (Finset.mem_coe.mpr hz) hyz
      rw [hX] at hn
      simpa using hn

#print axioms T1
#print axioms T1_input
#print axioms T0

end R7Cnf
