/-
The reader's section C statements (corpus/vp-vnp/reader/REPORT.md), typed in again as the reader wrote them,
each closed by the theorem of CertMachine.ReaderTests that proves it. A test whose statement had to change is
marked REPAIR or CHANGE with the reason; everything else is the reader's text with `sorry` replaced. If this file
elaborates, the statements proved in ReaderTests.lean are the reader's (up to definitional equality).
-/
import CertMachine.ReaderTests

open Statement MvPolynomial

universe u

namespace CertMachine.ReaderLiteral

open CertMachine.ReaderTests (ComputesOps ApproxRat VPBar' renameFamily)

-- T4 (CHANGE: the reader left `ComputesOps` as `sorry`; its definition is ours, ReaderTests.ComputesOps; the free
-- variables f, L, s of T4a/T4b are bound explicitly, since the release sets autoImplicit = false)
example {R : Type u} {V : Type} [CommRing R] {f : MvPolynomial V R} {L : ℕ} :
    ComputesOps f L → Computes f (5 * L + 1) := ReaderTests.T4a
example {R : Type u} {V : Type} [CommRing R] {f : MvPolynomial V R} {s : ℕ} :
    Computes f s → ComputesOps f s := ReaderTests.T4b
example : MainTheorem.{u} → ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, ∃ m₀ : ℕ, ∀ (F : Type u) [Field F] [CharP F p], ∀ m ≥ m₀,
    ∀ L : ℕ, (ComputesOps (hc F m) L → Beyond c m L) ∧ (p ≠ 2 → ComputesOps (perm F m) L → Beyond c m L) :=
  ReaderTests.T4c

-- T5
example (F : Type u) [CommSemiring F] (m : ℕ) :
    perm F m = ∑ σ : Equiv.Perm (Fin m), ∏ i, X (i, σ i) := ReaderTests.T5 F m

-- T6
example (F : Type u) [CommSemiring F] (k : ℕ) : hc F (k + 1) =
    ∑ π : Equiv.Perm (Fin (k + 1)) with π 0 = 0, ∏ i, X (π i, π (finRotate (k + 1) i)) := ReaderTests.T6a F k
-- REPAIR: `open Classical in` (no DecidablePred instance for `IsCycleOn`; the release's `hc` opens Classical too)
open Classical in
example (k : ℕ) : (Finset.univ.filter fun σ : Equiv.Perm (Fin (k + 1)) => σ.IsCycleOn Set.univ).card
    = k.factorial := ReaderTests.T6b k
example (F : Type) [Field F] : hc F 2 = X (0, 1) * X (1, 0) := ReaderTests.T6_value F
example (F : Type) [Field F] : hc F 2 ≠ X (0, 0) * X (1, 1) := ReaderTests.T6_planted_refuted F

-- T7 (edge cases and monotonicity; T7s is Author C's)
example (c : ℝ) (s : ℕ) : Beyond c 0 s ↔ 1 < s := ReaderTests.T7_zero c s
example (c : ℝ) (s : ℕ) : Beyond c 1 s ↔ 1 < s := ReaderTests.T7_one c s
example {c c' : ℝ} (h : c' ≤ c) {m s : ℕ} (hm : 2 ≤ m) : Beyond c m s → Beyond c' m s := ReaderTests.T7m h hm

-- T8
example (p : ℕ) (hp : ¬ (p = 0 ∨ p.Prime)) (F : Type u) [Field F] : ¬ CharP F p := ReaderTests.T8 p hp F

-- T9
example : MainTheorem.{u} → MainTheorem.{0} := ReaderTests.T9a
example (c : ℝ) (p m₀ : ℕ)
    (h : ∀ (F : Type) [Field F] [CharP F p], ∀ m ≥ m₀, ∀ s, Computes (hc F m) s → Beyond c m s) :
    ∀ (F : Type u) [Field F] [CharP F p], ∀ m ≥ m₀, ∀ s, Computes (hc F m) s → Beyond c m s :=
  ReaderTests.T9b c p m₀ h

-- T10
example : ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ, Computes (perm ℝ m) s → Beyond c m s := ReaderTests.T10

-- T11b (T11a is Author C's)
example : ∀ (F : Type) [Field F] (m : ℕ), 2 ≤ m → ∀ s, Computes (hc F m) s → Beyond 0 m s := ReaderTests.T11b

-- T13
example {F : Type u} {V : Type} [Field F] (f : MvPolynomial V F) (s : ℕ) : Approximates f s ↔
    ∃ g : MvPolynomial V (PowerSeries F), Computes (map HahnSeries.C f +
      C (HahnSeries.single (1 : ℤ) (1 : F)) * map (HahnSeries.ofPowerSeries ℤ F) g) s := ReaderTests.T13 f s

-- T14
example {F : Type} [Field F] (a : LaurentSeries F) (i : ℤ) : a.coeff i = HahnSeries.coeff a i := rfl
example {F : Type} [Field F] : (HahnSeries.single (1 : ℤ) (1 : F) : LaurentSeries F).coeff 1 = 1 ∧
    (HahnSeries.single (1 : ℤ) (1 : F) : LaurentSeries F).coeff 0 = 0 := ReaderTests.T14b

-- T15 (the reader's definition of ApproxRat, verbatim, is ReaderTests.ApproxRat)
example : @ApproxRat = fun {F : Type} [Field F] {V : Type} (f : MvPolynomial V F) (s : ℕ) =>
    ∃ g : MvPolynomial V (Polynomial F), Computes (map (algebraMap (Polynomial F) (RatFunc F)) g) s ∧
      map (Polynomial.evalRingHom 0) g = f := rfl
example {F : Type} [Field F] {V : Type} {f : MvPolynomial V F} {s : ℕ} : ApproxRat f s → Approximates f s :=
  ReaderTests.T15

-- T16
example : @VPBar' = fun (F : Type u) [Field F] => {f : Family F | ∃ a : ℕ, ∀ n, Approximates (f.poly n) (n ^ a + a)} :=
  rfl
example {F : Type u} [Field F] {f : Family F} (hf : f ∈ VNP F) :
    ∃ a : ℕ, ∀ n, Fintype.card (f.vars n) ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a := ReaderTests.T16a hf
example (F : Type u) [Field F] : VNP F ⊆ VPBar F ↔ VNP F ⊆ VPBar' F := ReaderTests.T16 F

-- T17
example {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VP F ↔ ∃ P : Polynomial ℕ, ∀ n,
    Fintype.card (f.vars n) ≤ P.eval n ∧ (f.poly n).totalDegree ≤ P.eval n ∧ Computes (f.poly n) (P.eval n) :=
  ReaderTests.T17 f

-- T18
example {F : Type u} [CommSemiring F] (g : Family F) (hg : g ∈ VP F) (t : ℕ → ℕ) (b : ℕ)
    (ht : ∀ n, t n ≤ n ^ b + b) : ({ vars := fun n => g.vars (t n), poly := fun n => g.poly (t n) } : Family F) ∈ VP F :=
  ReaderTests.T18i g hg t b ht
example : Separation.{u} → ∀ (F : Type u) [Field F], ∃ f ∈ VNP F, (∃ a : ℕ, ∀ n,
    Fintype.card (f.vars n) ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a) ∧
    ∀ a : ℕ, ∃ n, ¬ Computes (f.poly n) (n ^ a + a) := ReaderTests.T18ii

-- T19
example {α : Type*} (A B : Set α) : A ⊂ B ↔ A ⊆ B ∧ ¬ B ⊆ A := ReaderTests.T19 A B

-- T20
example (F : Type u) [Field F] :
    ({ vars := fun n => Fin n × Fin n, poly := hc F } : Family F) ∈ VNP F := ReaderTests.T20a F
example : MainTheorem.{u} → Separation.{u} := ReaderTests.T20b
example : MainTheoremApprox.{u} → SeparationClosure.{u} := ReaderTests.T20c

-- T21
example {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VP F ↔ Solution.toNc f ∈ Nc.VP F := Iff.rfl
example {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VNP F ↔ Solution.toNc f ∈ Nc.VNP F := Iff.rfl
example {F : Type u} [Field F] (f : Family F) : f ∈ VPBar F ↔ Solution.toNc f ∈ Paper.VPBar F := Iff.rfl
example {F : Type u} [Field F] (m : ℕ) : hc F m = Nc.genHC F m := rfl
example {F : Type u} [Field F] (m : ℕ) : perm F m = Nc.genPerm F m := rfl

-- T23 (CHANGE: the reader gave T23 as a comment only; this is our statement of it)
example {F : Type u} [Field F] (f : Family F) :
    (renameFamily f (fun n => Fin (Fintype.card (f.vars n))) (fun _ => Fintype.equivFin _) ∈ VP F ↔ f ∈ VP F) ∧
    (renameFamily f (fun n => Fin (Fintype.card (f.vars n))) (fun _ => Fintype.equivFin _) ∈ VNP F ↔ f ∈ VNP F) ∧
    (renameFamily f (fun n => Fin (Fintype.card (f.vars n))) (fun _ => Fintype.equivFin _) ∈ VPBar F ↔
      f ∈ VPBar F) := ReaderTests.T23_fin f

end CertMachine.ReaderLiteral
