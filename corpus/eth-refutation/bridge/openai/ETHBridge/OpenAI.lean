import ETHBridge.Generic
import ETHBridge.OpenAIChallenge

/-!
# Instantiation O: OpenAI's machine and encoding

cert-machine, `corpus/eth-refutation/bridge`. Written here; nothing in it is taken from OpenAI's
proof. The model is the one OpenAI's challenge file defines (`ETHBridge/OpenAIChallenge.lean`, the
pinned bytes of `lean/ComparatorChallenges/SubexponentialSAT.lean` at 7ef5c0cc):

* a machine is a `PrimitiveMachine` (finite by construction, so every machine counts);
* a formula on x₀ … x_{n−1} is a `Finset` of clauses, each a `Finset` of literals, and the k-SAT
  instances are the formulas with `WidthAtMost k`;
* the input word is `encodeCNF`;
* "halts within t steps with answer b" is the machine's own convention: `Trace step` reaches, in
  at most t steps from `init`, a configuration whose state is the halting state `inl b`.

`not_eth_of_claim`: the challenge's statement `exact_count_and_sat` (the proposition
`OpenAIClaim`) implies that ETH, in the textbook form of `ETHBridge.ETH`, fails in this model. The
three steps:

* (i) `bitLength_succ_le`: for width-k formulas the input word is polynomial in n (clauses are
  `Finset`s, so a formula has at most (k+1)(2n+1)^k of them);
* (ii) `count_pos_iff`: the halting answer `decide (0 < count F)` decides satisfiability;
* (iii) `bound_le`: for every δ > 0, C·(L+1)^d·2^{A·n(ln ln(n+16))²/√ln(n+16)} ≤ c·2^{δn} for every
  n, with one c ∈ ℕ (it holds for all large n, and the finitely many small n go into c).
-/

namespace ETHBridge.OpenAI

open OAI.Algorithms.SubexponentialSAT
open Filter Topology
open scoped NNReal ENNReal

/-! ### The model -/

/-- `M`, started on the word `w`, halts within `t` steps with answer `b`: some run of
`PrimitiveMachine.step` from `init w` reaches, in at most `t` steps, a configuration in the halting
state `inl b`. -/
def HaltsWithin (M : Computation.PrimitiveMachine) (w : List Bool) (b : Bool) (t : ℕ) : Prop :=
  ∃ (time : ℕ) (final : M.Cfg), time ≤ t ∧
    Computation.Trace M.step time (M.init w) final ∧ final.state = Sum.inl b

/-- Some assignment of x₀ … x_{n−1} makes a literal of every clause true. -/
def IsSatisfiable {n : ℕ} (F : SAT.CNF (Fin n)) : Prop :=
  ∃ a : Fin n → Bool, ∀ C ∈ F, ∃ l ∈ C, a l.variable = l.positive

/-- OpenAI's model: `PrimitiveMachine`s, `Finset` formulas of width at most k, `encodeCNF`. -/
def model : ETHBridge.Model where
  Machine := Computation.PrimitiveMachine
  CNF n := SAT.CNF (Fin n)
  IsKCNF k _ F := SAT.WidthAtMost k F
  Satisfiable _ F := IsSatisfiable F
  encode _ _ F := Encoding.encodeCNF F
  Admissible _ := True
  OutputsInTime := HaltsWithin

/-! ### (ii) The halting answer decides satisfiability -/

/-- The number of satisfying assignments is positive exactly when the formula is satisfiable. -/
theorem count_pos_iff {n : ℕ} (F : SAT.CNF (Fin n)) : 0 < SAT.count F ↔ IsSatisfiable F := by
  simp [SAT.count, SAT.satisfyingAssignments, SAT.CNF.eval, SAT.Clause.eval, SAT.Literal.eval,
    IsSatisfiable, Finset.card_pos, Finset.filter_nonempty_iff]

/-! ### A located run is a run -/

/-- Monitoring the head positions never changes the configuration. -/
theorem monitor_config (M : Computation.PrimitiveMachine) (c : SqrtLogSpace.LocatedCfg M)
    (cfg : M.Cfg) : (c.monitor cfg).config = cfg := by
  have key : ∀ {α β : Type} (f : α → SqrtLogSpace.LocatedCfg M)
      (g : β → SqrtLogSpace.LocatedCfg M) (x : α ⊕ β),
      (∀ a, (f a).config = cfg) → (∀ b, (g b).config = cfg) → (Sum.elim f g x).config = cfg := by
    intro α β f g x hf hg
    cases x with
    | inl a => exact hf a
    | inr b => exact hg b
  unfold SqrtLogSpace.LocatedCfg.monitor
  apply key
  · intro _
    rfl
  · intro _
    apply key
    · intro _
      rfl
    · intro _
      rfl

/-- One located step is one step of the machine. -/
theorem locatedStep_config {M : Computation.PrimitiveMachine} {c c' : SqrtLogSpace.LocatedCfg M}
    (h : SqrtLogSpace.locatedStep M c = some c') : M.step c.config = some c'.config := by
  unfold SqrtLogSpace.locatedStep at h
  revert h
  cases M.step c.config with
  | none =>
    intro h
    change none = some c' at h
    cases h
  | some cfg =>
    intro h
    have h' : c.monitor cfg = c' := Option.some.inj h
    rw [← h', monitor_config]

/-- A located trace projects to a trace of the machine, step for step. -/
theorem trace_config {M : Computation.PrimitiveMachine} :
    ∀ {t : ℕ} {a b : SqrtLogSpace.LocatedCfg M},
      Computation.Trace (SqrtLogSpace.locatedStep M) t a b →
        Computation.Trace M.step t a.config b.config := by
  intro t a b h
  induction h with
  | refl a => exact Computation.Trace.refl _
  | cons hstep _ ih => exact Computation.Trace.cons (locatedStep_config hstep) ih

/-! ### (i) The input word is polynomial in n -/

theorem frame_length (bits : List Bool) :
    (Encoding.frame bits).length = 2 * bits.length + 1 := by
  induction bits with
  | nil => rfl
  | cons b bs ih =>
    show (true :: b :: Encoding.frame bs).length = 2 * (b :: bs).length + 1
    simp only [List.length_cons, ih]
    omega

theorem encodeNat_length (c : ℕ) : (Encoding.encodeNat c).length = c + 1 := by
  simp [Encoding.encodeNat]

theorem encodeList_length_le {α : Type*} (enc : α → List Bool) (B : ℕ) :
    ∀ xs : List α, (∀ x ∈ xs, (enc x).length ≤ B) →
      (Encoding.encodeList enc xs).length ≤ 1 + xs.length * (2 * B + 2)
  | [], _ => by simp [Encoding.encodeList]
  | a :: as, h => by
    have ha : (enc a).length ≤ B := h a (by simp)
    have ih := encodeList_length_le enc B as (fun x hx => h x (by simp [hx]))
    have hlen : (Encoding.encodeList enc (a :: as)).length
        = (Encoding.frame (enc a)).length + (Encoding.encodeList enc as).length + 1 := by
      show (true :: (Encoding.frame (enc a) ++ Encoding.encodeList enc as)).length = _
      rw [List.length_cons, List.length_append]
    rw [hlen, frame_length, List.length_cons, Nat.add_mul, Nat.one_mul]
    generalize as.length * (2 * B + 2) = X at ih ⊢
    omega

theorem literalCode_lt {n : ℕ} (l : SAT.Literal (Fin n)) : Encoding.literalCode l < 2 * n := by
  unfold Encoding.literalCode
  have := l.variable.isLt
  split <;> omega

theorem clauseNumbers_length_le {n : ℕ} (C : SAT.Clause (Fin n)) :
    (Encoding.clauseNumbers C).length ≤ C.card := by
  unfold Encoding.clauseNumbers
  rw [Finset.length_sort]
  exact Finset.card_image_le

theorem lt_of_mem_clauseNumbers {n : ℕ} {C : SAT.Clause (Fin n)} {c : ℕ}
    (h : c ∈ Encoding.clauseNumbers C) : c < 2 * n := by
  unfold Encoding.clauseNumbers at h
  rw [Finset.mem_sort, Finset.mem_image] at h
  obtain ⟨l, -, rfl⟩ := h
  exact literalCode_lt l

/-- The word of one clause of at most k literals has at most 1 + k(4n+2) bits. -/
theorem clauseWord_length_le {n k : ℕ} (C : SAT.Clause (Fin n)) (hC : C.card ≤ k) :
    (Encoding.encodeList Encoding.encodeNat (Encoding.clauseNumbers C)).length
      ≤ 1 + k * (4 * n + 2) := by
  have h := encodeList_length_le Encoding.encodeNat (2 * n) (Encoding.clauseNumbers C)
    (fun c hc => by
      rw [encodeNat_length]
      have := lt_of_mem_clauseNumbers hc
      omega)
  have h2 : (Encoding.clauseNumbers C).length * (2 * (2 * n) + 2) ≤ k * (2 * (2 * n) + 2) :=
    Nat.mul_le_mul ((clauseNumbers_length_le C).trans hC) (le_refl _)
  have h3 : k * (2 * (2 * n) + 2) = k * (4 * n + 2) := by ring
  omega

theorem cnfNumbers_length_le {n : ℕ} (F : SAT.CNF (Fin n)) :
    (Encoding.cnfNumbers F).length ≤ F.card := by
  unfold Encoding.cnfNumbers
  rw [Finset.length_sort]
  exact Finset.card_image_le

/-- The input word of a formula with m clauses of at most k literals each has at most
n + 2 + m·(2(1 + k(4n+2)) + 2) bits. -/
theorem formulaBitLength_le {n k : ℕ} (F : SAT.CNF (Fin n)) (hF : SAT.WidthAtMost k F) :
    Encoding.formulaBitLength F ≤ n + 2 + F.card * (2 * (1 + k * (4 * n + 2)) + 2) := by
  have hbody := encodeList_length_le (Encoding.encodeList Encoding.encodeNat)
    (1 + k * (4 * n + 2)) (Encoding.cnfNumbers F) (fun x hx => by
      unfold Encoding.cnfNumbers at hx
      rw [Finset.mem_sort, Finset.mem_image] at hx
      obtain ⟨C, hC, rfl⟩ := hx
      exact clauseWord_length_le C (hF C hC))
  have hm : (Encoding.cnfNumbers F).length * (2 * (1 + k * (4 * n + 2)) + 2)
      ≤ F.card * (2 * (1 + k * (4 * n + 2)) + 2) :=
    Nat.mul_le_mul (cnfNumbers_length_le F) (le_refl _)
  have hL : Encoding.formulaBitLength F
      = (n + 1) + (Encoding.encodeList (Encoding.encodeList Encoding.encodeNat)
          (Encoding.cnfNumbers F)).length := by
    unfold Encoding.formulaBitLength Encoding.encodeCNF Encoding.encodeCNFBody
    rw [List.length_append, encodeNat_length]
  omega

/-- A literal is a variable and a sign. -/
def literalEquiv (n : ℕ) : SAT.Literal (Fin n) ≃ Fin n × Bool where
  toFun l := (l.variable, l.positive)
  invFun p := ⟨p.1, p.2⟩
  left_inv _ := rfl
  right_inv _ := rfl

instance instFintypeLiteral (n : ℕ) : Fintype (SAT.Literal (Fin n)) :=
  Fintype.ofEquiv _ (literalEquiv n).symm

theorem card_literal (n : ℕ) : Fintype.card (SAT.Literal (Fin n)) = 2 * n := by
  rw [Fintype.card_congr (literalEquiv n), Fintype.card_prod, Fintype.card_fin,
    Fintype.card_bool, Nat.mul_comm]

/-- A formula whose clauses have at most k literals has at most (k+1)(2n+1)^k clauses: they are
distinct subsets of the 2n literals. -/
theorem clauseCount_le {n k : ℕ} (F : SAT.CNF (Fin n)) (hF : SAT.WidthAtMost k F) :
    F.card ≤ (k + 1) * (2 * n + 1) ^ k := by
  have hsub : F ⊆ (Finset.range (k + 1)).biUnion
      (fun j => Finset.powersetCard j (Finset.univ : Finset (SAT.Literal (Fin n)))) := by
    intro C hC
    rw [Finset.mem_biUnion]
    exact ⟨C.card, Finset.mem_range.2 (Nat.lt_succ_of_le (hF C hC)),
      Finset.mem_powersetCard.2 ⟨Finset.subset_univ C, rfl⟩⟩
  calc F.card
      ≤ ((Finset.range (k + 1)).biUnion
          (fun j => Finset.powersetCard j (Finset.univ : Finset (SAT.Literal (Fin n))))).card :=
        Finset.card_le_card hsub
    _ ≤ ∑ j ∈ Finset.range (k + 1),
          (Finset.powersetCard j (Finset.univ : Finset (SAT.Literal (Fin n)))).card :=
        Finset.card_biUnion_le
    _ ≤ ∑ _j ∈ Finset.range (k + 1), (2 * n + 1) ^ k := by
        apply Finset.sum_le_sum
        intro j hj
        rw [Finset.card_powersetCard, Finset.card_univ, card_literal]
        calc (2 * n).choose j ≤ (2 * n) ^ j := Nat.choose_le_pow _ _
          _ ≤ (2 * n + 1) ^ j := Nat.pow_le_pow_left (Nat.le_succ _) _
          _ ≤ (2 * n + 1) ^ k :=
            Nat.pow_le_pow_right (Nat.succ_pos _) (Nat.lt_succ_iff.1 (Finset.mem_range.1 hj))
    _ = (k + 1) * (2 * n + 1) ^ k := by
        rw [Finset.sum_const, Finset.card_range, smul_eq_mul]

/-- (i) For a formula whose clauses have at most k literals, L + 1 ≤ K·(n+1)^{k+1}, where L is the
length of its input word and K = 3 + (k+1)·2^k·(4+8k). -/
theorem bitLength_succ_le {n k : ℕ} (F : SAT.CNF (Fin n)) (hF : SAT.WidthAtMost k F) :
    Encoding.formulaBitLength F + 1 ≤ (3 + (k + 1) * 2 ^ k * (4 + 8 * k)) * (n + 1) ^ (k + 1) := by
  have hL := formulaBitLength_le F hF
  have hm := clauseCount_le F hF
  have h1 : n + 3 ≤ 3 * (n + 1) ^ (k + 1) := by
    have h : (n + 1) ^ 1 ≤ (n + 1) ^ (k + 1) := Nat.pow_le_pow_right (by omega) (by omega)
    rw [Nat.pow_one] at h
    omega
  have h2 : (2 * n + 1) ^ k ≤ 2 ^ k * (n + 1) ^ k := by
    rw [← Nat.mul_pow]
    exact Nat.pow_le_pow_left (by omega) k
  have h3 : 2 * (1 + k * (4 * n + 2)) + 2 ≤ (4 + 8 * k) * (n + 1) := by
    nlinarith [Nat.zero_le (k * n)]
  calc Encoding.formulaBitLength F + 1
      ≤ n + 3 + F.card * (2 * (1 + k * (4 * n + 2)) + 2) := by omega
    _ ≤ 3 * (n + 1) ^ (k + 1) + ((k + 1) * (2 ^ k * (n + 1) ^ k)) * ((4 + 8 * k) * (n + 1)) :=
        Nat.add_le_add h1 (Nat.mul_le_mul (hm.trans (Nat.mul_le_mul (le_refl _) h2)) h3)
    _ = (3 + (k + 1) * 2 ^ k * (4 + 8 * k)) * (n + 1) ^ (k + 1) := by ring

/-! ### (iii) The analysis: the claimed bound is 2^{o(n)} -/

theorem tendsto_logsq_div_sqrt :
    Tendsto (fun u : ℝ => Real.log u ^ 2 / Real.sqrt u) atTop (𝓝 0) := by
  have h := (isLittleO_log_rpow_rpow_atTop (2 : ℝ)
    (by norm_num : (0 : ℝ) < 1 / 2)).tendsto_div_nhds_zero
  refine h.congr fun u => ?_
  show Real.log u ^ (2 : ℝ) / u ^ (1 / 2 : ℝ) = Real.log u ^ 2 / Real.sqrt u
  rw [Real.rpow_two, Real.sqrt_eq_rpow]

/-- (ln ln(n+16))²/√ln(n+16) → 0. -/
theorem tendsto_ratio : Tendsto (fun n : ℕ => (Real.log (Real.log ((n : ℝ) + 16))) ^ 2 /
    Real.sqrt (Real.log ((n : ℝ) + 16))) atTop (𝓝 0) :=
  tendsto_logsq_div_sqrt.comp (Real.tendsto_log_atTop.comp
    (tendsto_atTop_add_const_right atTop (16 : ℝ) tendsto_natCast_atTop_atTop))

/-- ln(n+1)/n → 0. -/
theorem tendsto_log_div : Tendsto (fun n : ℕ => Real.log ((n : ℝ) + 1) / n) atTop (𝓝 0) := by
  have h := (Real.tendsto_pow_log_div_mul_add_atTop 1 (-1) 1 one_ne_zero).comp
    (tendsto_atTop_add_const_right atTop (1 : ℝ) tendsto_natCast_atTop_atTop)
  refine h.congr fun n => ?_
  show Real.log ((n : ℝ) + 1) ^ 1 / (1 * ((n : ℝ) + 1) + -1) = Real.log ((n : ℝ) + 1) / n
  rw [pow_one, one_mul, add_neg_cancel_right]

/-- For every δ > 0, from some n on, (n+1)^p·2^{A·n(ln ln(n+16))²/√ln(n+16)} ≤ 2^{δn}. -/
theorem eventually_le (A : ℝ) (p : ℕ) {δ : ℝ} (hδ : 0 < δ) :
    ∃ N : ℕ, ∀ n : ℕ, N ≤ n →
      ((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)
        ≤ (2 : ℝ) ^ (δ * n) := by
  have hlog2 : 0 < Real.log 2 := Real.log_pos one_lt_two
  have hT : Tendsto (fun n : ℕ => (p : ℝ) * (Real.log ((n : ℝ) + 1) / n) +
      A * Real.log 2 * ((Real.log (Real.log ((n : ℝ) + 16))) ^ 2 /
        Real.sqrt (Real.log ((n : ℝ) + 16)))) atTop (𝓝 0) := by
    have h := (tendsto_log_div.const_mul (p : ℝ)).add (tendsto_ratio.const_mul (A * Real.log 2))
    simp only [mul_zero, add_zero] at h
    exact h
  obtain ⟨N, hN⟩ := Metric.tendsto_atTop.1 hT (δ * Real.log 2) (mul_pos hδ hlog2)
  refine ⟨max N 1, fun n hn => ?_⟩
  have hnN : N ≤ n := le_trans (le_max_left N 1) hn
  have hn1 : 1 ≤ n := le_trans (le_max_right N 1) hn
  have hnpos : (0 : ℝ) < n := Nat.cast_pos.mpr (by omega)
  have hn0 : (n : ℝ) ≠ 0 := hnpos.ne'
  have h := hN n hnN
  rw [Real.dist_eq, sub_zero] at h
  have hlt := (le_abs_self _).trans_lt h
  have hrs : SqrtLog.Statement.runtimeScale n = (n : ℝ) *
      ((Real.log (Real.log ((n : ℝ) + 16))) ^ 2 / Real.sqrt (Real.log ((n : ℝ) + 16))) := by
    unfold SqrtLog.Statement.runtimeScale
    rw [mul_div_assoc]
  have hlogn : (n : ℝ) * ((p : ℝ) * (Real.log ((n : ℝ) + 1) / n))
      = (p : ℝ) * Real.log ((n : ℝ) + 1) := by
    rw [← mul_div_assoc, mul_div_cancel₀ _ hn0]
  have hmul := mul_lt_mul_of_pos_left hlt hnpos
  have key : (p : ℝ) * Real.log ((n : ℝ) + 1) + A * SqrtLog.Statement.runtimeScale n * Real.log 2
      ≤ δ * n * Real.log 2 := by
    rw [hrs]
    linarith [hmul, hlogn]
  have h1 : (0 : ℝ) < ((n : ℝ) + 1) ^ p := by positivity
  have h2 : (0 : ℝ) < (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) := by positivity
  have h3 : (0 : ℝ) < (2 : ℝ) ^ (δ * n) := by positivity
  rw [← Real.log_le_log_iff (mul_pos h1 h2) h3, Real.log_mul h1.ne' h2.ne', Real.log_pow,
    Real.log_rpow two_pos, Real.log_rpow two_pos]
  linarith

/-- (iii) For every δ > 0 there is c ∈ ℕ with B·(n+1)^p·2^{A·n(ln ln(n+16))²/√ln(n+16)} ≤ c·2^{δn}
for EVERY n: for n past the threshold of `eventually_le`, c ≥ |B| suffices, and c also exceeds
the finitely many values below it. -/
theorem bound_le (B A : ℝ) (p : ℕ) {δ : ℝ} (hδ : 0 < δ) :
    ∃ c : ℕ, ∀ n : ℕ, B * ((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)
      ≤ c * (2 : ℝ) ^ (δ * n) := by
  obtain ⟨N, hN⟩ := eventually_le A p hδ
  obtain ⟨S, hS⟩ : ∃ S : ℝ, S = ∑ i ∈ Finset.range N,
      |B * ((i : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale i)| := ⟨_, rfl⟩
  refine ⟨⌈S + |B|⌉₊, fun n => ?_⟩
  have hc : S + |B| ≤ (⌈S + |B|⌉₊ : ℝ) := Nat.le_ceil _
  have hS0 : 0 ≤ S := by
    rw [hS]
    refine Finset.sum_nonneg ?_
    intro i _
    exact abs_nonneg _
  have hpow1 : (1 : ℝ) ≤ (2 : ℝ) ^ (δ * n) :=
    Real.one_le_rpow (by norm_num) (mul_nonneg hδ.le (Nat.cast_nonneg n))
  have hpow0 : (0 : ℝ) ≤ (2 : ℝ) ^ (δ * n) := by positivity
  by_cases hn : N ≤ n
  · have hX := hN n hn
    have hX0 : 0 ≤ ((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) := by
      positivity
    calc B * ((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)
        = B * (((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)) :=
          mul_assoc _ _ _
      _ ≤ |B| * (((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)) :=
          mul_le_mul_of_nonneg_right (le_abs_self B) hX0
      _ ≤ |B| * (2 : ℝ) ^ (δ * n) := mul_le_mul_of_nonneg_left hX (abs_nonneg B)
      _ ≤ (⌈S + |B|⌉₊ : ℝ) * (2 : ℝ) ^ (δ * n) :=
          mul_le_mul_of_nonneg_right (by linarith) hpow0
  · have hmem : n ∈ Finset.range N := Finset.mem_range.2 (not_le.1 hn)
    have hfn : |B * ((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)| ≤ S := by
      rw [hS]
      exact Finset.single_le_sum (f := fun i : ℕ =>
        |B * ((i : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale i)|)
        (fun i _ => abs_nonneg _) hmem
    calc B * ((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)
        ≤ |B * ((n : ℝ) + 1) ^ p * (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n)| :=
          le_abs_self _
      _ ≤ (⌈S + |B|⌉₊ : ℝ) := by linarith [abs_nonneg B]
      _ ≤ (⌈S + |B|⌉₊ : ℝ) * (2 : ℝ) ^ (δ * n) := le_mul_of_one_le_right (Nat.cast_nonneg _) hpow1

/-! ### The bridge -/

/-- If OpenAI's challenge statement holds, then for every k ≥ 2 and every δ > 0, k-SAT has an
O(2^{δn}) algorithm in OpenAI's model: the challenge's machine for k, with a constant c ∈ ℕ. -/
theorem inTime_of_claim (h : SqrtLogSpace.OpenAIClaim) (k : ℕ) (hk : 2 ≤ k) (δ : ℝ≥0)
    (hδ : 0 < δ) : ETHBridge.InTime model k δ := by
  obtain ⟨M, countTape, answerTape, C, A, S, d, e, hC, hA, hS, hd, he, hrun⟩ := h k hk
  have hδ' : (0 : ℝ) < (δ : ℝ) := by exact_mod_cast hδ
  obtain ⟨c, hc⟩ := bound_le (C * ((3 + (k + 1) * 2 ^ k * (4 + 8 * k) : ℕ) : ℝ) ^ d) A
    ((k + 1) * d) hδ'
  refine ⟨M, c, trivial, fun n (F : SAT.CNF (Fin n)) (hF : SAT.WidthAtMost k F) => ?_⟩
  obtain ⟨time, final, htrace, -, -, hstate, -, -, htime, -⟩ := hrun n F hF
  refine ⟨decide (0 < SAT.count F), ?_, time, final.config, ?_, trace_config htrace, hstate⟩
  · rw [decide_eq_true_eq]
    exact count_pos_iff F
  · apply Nat.le_floor
    have hL : ((Encoding.formulaBitLength F : ℕ) : ℝ) + 1
        ≤ ((3 + (k + 1) * 2 ^ k * (4 + 8 * k) : ℕ) : ℝ) * ((n : ℝ) + 1) ^ (k + 1) := by
      exact_mod_cast bitLength_succ_le F hF
    calc (time : ℝ)
        ≤ SqrtLog.Statement.runtimeBound C A d (Encoding.formulaBitLength F) n := htime
      _ = C * ((Encoding.formulaBitLength F : ℝ) + 1) ^ d *
            (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) := rfl
      _ ≤ C * (((3 + (k + 1) * 2 ^ k * (4 + 8 * k) : ℕ) : ℝ) * ((n : ℝ) + 1) ^ (k + 1)) ^ d *
            (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) := by
          refine mul_le_mul_of_nonneg_right ?_ (by positivity)
          refine mul_le_mul_of_nonneg_left ?_ hC.le
          exact pow_le_pow_left₀ (by positivity) hL d
      _ = C * ((3 + (k + 1) * 2 ^ k * (4 + 8 * k) : ℕ) : ℝ) ^ d * ((n : ℝ) + 1) ^ ((k + 1) * d) *
            (2 : ℝ) ^ (A * SqrtLog.Statement.runtimeScale n) := by
          rw [mul_pow, ← pow_mul]
          ring
      _ ≤ c * (2 : ℝ) ^ ((δ : ℝ) * n) := hc n

/-- If OpenAI's challenge statement holds, then s_k = 0 in OpenAI's model, for every k ≥ 2. -/
theorem s_eq_zero_of_claim (h : SqrtLogSpace.OpenAIClaim) (k : ℕ) (hk : 2 ≤ k) :
    ETHBridge.s model k = 0 :=
  ETHBridge.s_eq_zero_of_forall_inTime model k fun δ hδ => inTime_of_claim h k hk δ hδ

/-- **The bridge, OpenAI.** If OpenAI's challenge statement `exact_count_and_sat` holds, then the
Exponential Time Hypothesis, in the textbook form `ETHBridge.ETH` (s_k > 0 for every k ≥ 3), is
false in OpenAI's own model of computation and encoding. -/
theorem not_eth_of_claim (h : SqrtLogSpace.OpenAIClaim) : ¬ ETHBridge.ETH model :=
  ETHBridge.not_eth_of_forall_inTime model 3 le_rfl fun δ hδ =>
    inTime_of_claim h 3 (by norm_num) δ hδ

end ETHBridge.OpenAI
