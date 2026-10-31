/-
cert-machine · the x^x reduction, proved. The step every verdict of reports/xx.html rests on: the recorder
tools/run-xx-ledger.py decides "the real root of x^x = N lies above p/q" by comparing two whole numbers,
p^p and N^q·q^p, and this file proves that the comparison says exactly that.

  1. On (0, 1], x^x ≤ 1; on [1, ∞), x^x is strictly increasing (selfpow_le_one, selfpow_strictMonoOn).
  2. For N ≥ 2, x^x = N has exactly one positive real root, and it is above 1 (existsUnique_root,
     one_lt_of_selfpow_eq).
  3. For whole numbers p, q with 1 ≤ q ≤ p (so p/q ≥ 1) and that root x:
        p/q < x  ↔  p^p < N^q·q^p        p/q ≤ x  ↔  p^p ≤ N^q·q^p
        x < p/q  ↔  N^q·q^p < p^p        x ≤ p/q  ↔  N^q·q^p ≤ p^p
     (lt_root_iff, le_root_iff, root_lt_iff, root_le_iff), and at q = 1 the whole-number bounds
     k ≤ x ↔ k^k ≤ N and x ≤ k ↔ N ≤ k^k (natCast_le_root_iff, root_le_natCast_iff).

x^x is Mathlib's Real.rpow, and every statement is about POSITIVE reals. What a negative base means (Mathlib
defines x^y for x < 0 through the complex logarithm; others leave it undefined) is not decided here: that x^x = N
has no negative root worth counting stays a stated reading of the problem.
-/
import Mathlib

namespace XXReduction

/-- On (0, 1], x^x ≤ 1. -/
theorem selfpow_le_one {x : ℝ} (hx : 0 < x) (h1 : x ≤ 1) : x ^ x ≤ 1 :=
  Real.rpow_le_one hx.le h1 hx.le

/-- x^x is strictly increasing on [1, ∞): for 1 ≤ a < b, a^a ≤ a^b < b^b. -/
theorem selfpow_strictMonoOn : StrictMonoOn (fun x : ℝ => x ^ x) (Set.Ici 1) := by
  intro a ha b hb hab
  have ha' : (1 : ℝ) ≤ a := ha
  show a ^ a < b ^ b
  calc a ^ a ≤ a ^ b := Real.rpow_le_rpow_of_exponent_le ha' hab.le
    _ < b ^ b := Real.rpow_lt_rpow (by linarith) hab (by linarith)

/-- A positive root of x^x = N with N > 1 is above 1. -/
theorem one_lt_of_selfpow_eq {N x : ℝ} (hN : 1 < N) (hx : 0 < x) (h : x ^ x = N) : 1 < x := by
  by_contra hc
  have := selfpow_le_one hx (not_lt.mp hc)
  linarith

/-- For N ≥ 1, x^x = N has a root x ≥ 1: x^x is continuous on [1, N], equal to 1 at 1 and at least N at N. -/
theorem exists_selfpow_eq {N : ℝ} (hN : 1 ≤ N) : ∃ x : ℝ, 1 ≤ x ∧ x ^ x = N := by
  have hc : ContinuousOn (fun x : ℝ => x ^ x) (Set.Icc 1 N) :=
    ContinuousOn.rpow continuousOn_id continuousOn_id
      (fun x hx => Or.inl (lt_of_lt_of_le one_pos hx.1).ne')
  have hNN : N ≤ N ^ N := by
    calc N = N ^ (1 : ℝ) := (Real.rpow_one N).symm
      _ ≤ N ^ N := Real.rpow_le_rpow_of_exponent_le hN hN
  have hmem : N ∈ Set.Icc ((fun x : ℝ => x ^ x) 1) ((fun x : ℝ => x ^ x) N) := by
    show (1 : ℝ) ^ (1 : ℝ) ≤ N ∧ N ≤ N ^ N
    rw [Real.one_rpow]
    exact ⟨hN, hNN⟩
  obtain ⟨x, hx, hfx⟩ := intermediate_value_Icc hN hc hmem
  exact ⟨x, hx.1, hfx⟩

/-- For a real N ≥ 2, x^x = N has exactly one positive real root. -/
theorem existsUnique_selfpow_eq {N : ℝ} (hN : 2 ≤ N) : ∃! x : ℝ, 0 < x ∧ x ^ x = N := by
  obtain ⟨x, hx1, hx⟩ := exists_selfpow_eq (by linarith : (1 : ℝ) ≤ N)
  refine ⟨x, ⟨by linarith, hx⟩, ?_⟩
  rintro y ⟨hy0, hy⟩
  have hy1 := one_lt_of_selfpow_eq (by linarith) hy0 hy
  have hx1' := one_lt_of_selfpow_eq (by linarith) (by linarith) hx
  exact selfpow_strictMonoOn.injOn (Set.mem_Ici.mpr hy1.le) (Set.mem_Ici.mpr hx1'.le)
    (show y ^ y = x ^ x by rw [hy, hx])

/-- For a whole number N ≥ 2, x^x = N has exactly one positive real root. -/
theorem existsUnique_root {N : ℕ} (hN : 2 ≤ N) : ∃! x : ℝ, 0 < x ∧ x ^ x = (N : ℝ) :=
  existsUnique_selfpow_eq (by exact_mod_cast hN)

/-- ((p/q)^(p/q))^q = (p/q)^p for q ≥ 1. -/
theorem frac_selfpow_pow (p q : ℕ) (hq : 0 < q) :
    (((p : ℝ) / q) ^ ((p : ℝ) / q)) ^ q = ((p : ℝ) / q) ^ p := by
  have ha : (0 : ℝ) ≤ (p : ℝ) / q := by positivity
  have hq' : (q : ℝ) ≠ 0 := by exact_mod_cast hq.ne'
  rw [← Real.rpow_natCast (((p : ℝ) / q) ^ ((p : ℝ) / q)) q, ← Real.rpow_mul ha,
    div_mul_cancel₀ (p : ℝ) hq', Real.rpow_natCast]

/-- (p/q)^(p/q) < N exactly when p^p < N^q·q^p, for q ≥ 1 and N ≥ 0. -/
theorem frac_selfpow_lt_iff (p q : ℕ) (hq : 0 < q) {N : ℝ} (hN : 0 ≤ N) :
    ((p : ℝ) / q) ^ ((p : ℝ) / q) < N ↔ (p : ℝ) ^ p < N ^ q * (q : ℝ) ^ p := by
  have hu : (0 : ℝ) ≤ ((p : ℝ) / q) ^ ((p : ℝ) / q) := by positivity
  have hq0 : (0 : ℝ) < q := by exact_mod_cast hq
  rw [← pow_lt_pow_iff_left₀ hu hN hq.ne', frac_selfpow_pow p q hq, div_pow,
    div_lt_iff₀ (pow_pos hq0 p)]

/-- (p/q)^(p/q) ≤ N exactly when p^p ≤ N^q·q^p, for q ≥ 1 and N ≥ 0. -/
theorem frac_selfpow_le_iff (p q : ℕ) (hq : 0 < q) {N : ℝ} (hN : 0 ≤ N) :
    ((p : ℝ) / q) ^ ((p : ℝ) / q) ≤ N ↔ (p : ℝ) ^ p ≤ N ^ q * (q : ℝ) ^ p := by
  have hu : (0 : ℝ) ≤ ((p : ℝ) / q) ^ ((p : ℝ) / q) := by positivity
  have hq0 : (0 : ℝ) < q := by exact_mod_cast hq
  rw [← pow_le_pow_iff_left₀ hu hN hq.ne', frac_selfpow_pow p q hq, div_pow,
    div_le_iff₀ (pow_pos hq0 p)]

/-- **The reduction, x > p/q.** For N ≥ 2, the positive root x of x^x = N, and whole numbers 1 ≤ q ≤ p:
p/q < x exactly when p^p < N^q·q^p. -/
theorem lt_root_iff {N p q : ℕ} (hN : 2 ≤ N) (hq : 0 < q) (hqp : q ≤ p) {x : ℝ} (hx : 0 < x)
    (hroot : x ^ x = (N : ℝ)) : (p : ℝ) / q < x ↔ p ^ p < N ^ q * q ^ p := by
  have hN' : (2 : ℝ) ≤ N := by exact_mod_cast hN
  have hx1 : 1 < x := one_lt_of_selfpow_eq (by linarith) hx hroot
  have hq0 : (0 : ℝ) < q := by exact_mod_cast hq
  have ha : (1 : ℝ) ≤ (p : ℝ) / q := (one_le_div hq0).mpr (by exact_mod_cast hqp)
  have mono : ((p : ℝ) / q) ^ ((p : ℝ) / q) < x ^ x ↔ (p : ℝ) / q < x :=
    selfpow_strictMonoOn.lt_iff_lt (Set.mem_Ici.mpr ha) (Set.mem_Ici.mpr hx1.le)
  rw [← mono, hroot, frac_selfpow_lt_iff p q hq (by positivity)]
  constructor <;> intro h <;> exact_mod_cast h

/-- **The reduction, x ≥ p/q.** For N ≥ 2, the positive root x of x^x = N, and whole numbers 1 ≤ q ≤ p:
p/q ≤ x exactly when p^p ≤ N^q·q^p. -/
theorem le_root_iff {N p q : ℕ} (hN : 2 ≤ N) (hq : 0 < q) (hqp : q ≤ p) {x : ℝ} (hx : 0 < x)
    (hroot : x ^ x = (N : ℝ)) : (p : ℝ) / q ≤ x ↔ p ^ p ≤ N ^ q * q ^ p := by
  have hN' : (2 : ℝ) ≤ N := by exact_mod_cast hN
  have hx1 : 1 < x := one_lt_of_selfpow_eq (by linarith) hx hroot
  have hq0 : (0 : ℝ) < q := by exact_mod_cast hq
  have ha : (1 : ℝ) ≤ (p : ℝ) / q := (one_le_div hq0).mpr (by exact_mod_cast hqp)
  have mono : ((p : ℝ) / q) ^ ((p : ℝ) / q) ≤ x ^ x ↔ (p : ℝ) / q ≤ x :=
    selfpow_strictMonoOn.le_iff_le (Set.mem_Ici.mpr ha) (Set.mem_Ici.mpr hx1.le)
  rw [← mono, hroot, frac_selfpow_le_iff p q hq (by positivity)]
  constructor <;> intro h <;> exact_mod_cast h

/-- **The reduction, x < p/q.** For N ≥ 2, the positive root x of x^x = N, and whole numbers 1 ≤ q ≤ p:
x < p/q exactly when N^q·q^p < p^p. -/
theorem root_lt_iff {N p q : ℕ} (hN : 2 ≤ N) (hq : 0 < q) (hqp : q ≤ p) {x : ℝ} (hx : 0 < x)
    (hroot : x ^ x = (N : ℝ)) : x < (p : ℝ) / q ↔ N ^ q * q ^ p < p ^ p :=
  not_le.symm.trans ((not_congr (le_root_iff hN hq hqp hx hroot)).trans not_le)

/-- **The reduction, x ≤ p/q.** For N ≥ 2, the positive root x of x^x = N, and whole numbers 1 ≤ q ≤ p:
x ≤ p/q exactly when N^q·q^p ≤ p^p. -/
theorem root_le_iff {N p q : ℕ} (hN : 2 ≤ N) (hq : 0 < q) (hqp : q ≤ p) {x : ℝ} (hx : 0 < x)
    (hroot : x ^ x = (N : ℝ)) : x ≤ (p : ℝ) / q ↔ N ^ q * q ^ p ≤ p ^ p :=
  not_lt.symm.trans ((not_congr (lt_root_iff hN hq hqp hx hroot)).trans not_lt)

/-- The whole-number bound from below (q = 1): k ≤ x exactly when k^k ≤ N, for k ≥ 1. -/
theorem natCast_le_root_iff {N k : ℕ} (hN : 2 ≤ N) (hk : 1 ≤ k) {x : ℝ} (hx : 0 < x)
    (hroot : x ^ x = (N : ℝ)) : (k : ℝ) ≤ x ↔ k ^ k ≤ N := by
  have h := le_root_iff (p := k) (q := 1) hN one_pos hk hx hroot
  simpa using h

/-- The whole-number bound from above (q = 1): x ≤ k exactly when N ≤ k^k, for k ≥ 1. -/
theorem root_le_natCast_iff {N k : ℕ} (hN : 2 ≤ N) (hk : 1 ≤ k) {x : ℝ} (hx : 0 < x)
    (hroot : x ^ x = (N : ℝ)) : x ≤ (k : ℝ) ↔ N ≤ k ^ k := by
  have h := root_le_iff (p := k) (q := 1) hN one_pos hk hx hroot
  simpa using h

end XXReduction
