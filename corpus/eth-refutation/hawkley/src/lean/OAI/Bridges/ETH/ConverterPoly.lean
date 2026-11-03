import OAI.Bridges.ETH.ConverterTime
import OAI.Combinatorics.ParityLifts.ExpBounds

/-!
# ETH correspondence, component B2.5b.3: the uniform polynomial bound

For `F : Formula N`, with `G = minimizeList F.bitList`:

* `canonicalWordProgram_time_le`: `canonicalWordProgram.time G ≤ convTime N`, where
  `convTime N = decodeTime N + postProgram.coefficient * ((6N+6) * inputBound N + 1) ^
  postProgram.degree + 1`, from `canonicalWordProgram_time`, `formulaPairsProgram_time_le`,
  `postProgram_time_le` and `pairsSize_le`;
* `convTime_expBound : ExpBound (fun N => (convTime N : ℝ)) 0`, the budget form of
  `sat_code_rate`, proved through the closure lemmas of `NatPoly`
  (`NatPoly f := ExpBound (fun n => (f n : ℝ)) 0`);
* `canonicalWordProgram_time_poly`: `∃ C d : ℕ, ∀ N (F : Formula N),
  canonicalWordProgram.time (minimizeList F.bitList) ≤ C * (N + 1) ^ d`, with `C` and `d`
  independent of `N` and `F`;
* `canonicalWordProgram_rbeval_convTime` and `canonicalWordProgram_rbeval_uniform`: bounded
  `RBEval` runs whose output is OpenAI's `encodeCNF` of `canonicalCNF (bitCanonical F)`, with
  budgets depending only on `N`;
* `converter_seq`: composition with any later stage through `RBEval.seq`, the shape in which
  `sat_code_rate` will consume the converter.

No hypothesis beyond `F : Formula N` is needed: B2.5b.1 derives every size bound from the type.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-! ### Polynomially bounded natural functions -/

/-- `f` is bounded by `C (n+1)^d`, in `ExpBound` form at rate `0`. -/
def NatPoly (f : ℕ → ℕ) : Prop := ExpBound (fun n => (f n : ℝ)) 0

theorem NatPoly.const (c : ℕ) : NatPoly (fun _ => c) := by
  unfold NatPoly
  simpa using ExpBound.const (c : ℝ) (Nat.cast_nonneg c)

theorem NatPoly.id : NatPoly (fun n => n) :=
  ExpBound.mono (ExpBound.poly 1) (fun n => Nat.cast_nonneg n) (fun n => by simp)

theorem NatPoly.add {f g : ℕ → ℕ} (hf : NatPoly f) (hg : NatPoly g) :
    NatPoly (fun n => f n + g n) := by
  unfold NatPoly at *
  simpa only [Nat.cast_add] using hf.add_same hg

theorem NatPoly.mul {f g : ℕ → ℕ} (hf : NatPoly f) (hg : NatPoly g) :
    NatPoly (fun n => f n * g n) := by
  unfold NatPoly at *
  simpa only [Nat.cast_mul, add_zero] using hf.mul hg

theorem NatPoly.pow {f : ℕ → ℕ} (hf : NatPoly f) (d : ℕ) : NatPoly (fun n => f n ^ d) := by
  unfold NatPoly at *
  simpa only [Nat.cast_pow, mul_zero] using hf.pow d

theorem NatPoly.mono {f g : ℕ → ℕ} (hg : NatPoly g) (hle : ∀ n, f n ≤ g n) : NatPoly f :=
  ExpBound.mono hg (fun n => Nat.cast_nonneg _) (fun n => by exact_mod_cast hle n)

/-- Close a `NatPoly` goal built from `+`, `*`, `^`, constants, the variable, and hypotheses.
Each lemma is tried at reducible transparency, so it matches only by syntactic shape. -/
macro "natpoly" : tactic =>
  `(tactic| repeat (first
    | with_reducible assumption
    | with_reducible exact NatPoly.const _
    | with_reducible exact NatPoly.id
    | with_reducible apply NatPoly.add
    | with_reducible apply NatPoly.mul
    | with_reducible apply NatPoly.pow))

/-! ### The converter's bound is polynomial -/

theorem natPoly_inputBound : NatPoly inputBound := by
  unfold inputBound
  natpoly

theorem natPoly_decPoly {M : ℕ → ℕ} (hM : NatPoly M) : NatPoly (fun n => decPoly (M n)) := by
  unfold decPoly
  natpoly

theorem natPoly_mapTimeBound (α β : Type) [TreeCodec α] [TreeCodec β] {X Y B : ℕ → ℕ}
    (hX : NatPoly X) (hY : NatPoly Y) (hB : NatPoly B) :
    NatPoly (fun n => mapTimeBound α β (X n) (Y n) (B n)) := by
  unfold mapTimeBound stepBound
  natpoly

theorem natPoly_pairsBound : NatPoly (fun n => (6 * n + 6) * inputBound n) := by
  have := natPoly_inputBound
  natpoly

theorem natPoly_litTime : NatPoly litTime := by
  unfold litTime
  have hd : NatPoly (fun n => decPoly (6 * n + 11)) := natPoly_decPoly (by natpoly)
  natpoly

theorem natPoly_clauseTime : NatPoly clauseTime :=
  natPoly_mapTimeBound BitLiteral (ℕ × ℕ) natPoly_inputBound natPoly_pairsBound natPoly_litTime

theorem natPoly_decodeTime : NatPoly decodeTime :=
  natPoly_mapTimeBound BitClause (List (ℕ × ℕ)) natPoly_inputBound natPoly_pairsBound
    natPoly_clauseTime

/-- The converter's explicit time bound. -/
noncomputable def convTime (N : ℕ) : ℕ :=
  decodeTime N + postProgram.coefficient * ((6 * N + 6) * inputBound N + 1) ^ postProgram.degree + 1

theorem natPoly_convTime : NatPoly convTime := by
  unfold convTime
  have h1 := natPoly_decodeTime
  have h2 := natPoly_inputBound
  natpoly

/-- **`sat_code_rate`'s budget form.** -/
theorem convTime_expBound : ExpBound (fun N => (convTime N : ℝ)) 0 := natPoly_convTime

/-! ### The converter's time on the ETH front end's inputs -/

/-- **Explicit bound.** -/
theorem canonicalWordProgram_time_le {N : ℕ} (F : Formula N) :
    canonicalWordProgram.time (minimizeList F.bitList) ≤ convTime N := by
  rw [canonicalWordProgram_time]
  have h1 := formulaPairsProgram_time_le F
  have h2 : postProgram.program.time (List.map (List.map litPair) (minimizeList F.bitList)) ≤
      postProgram.coefficient * ((6 * N + 6) * inputBound N + 1) ^ postProgram.degree := by
    refine (postProgram_time_le _).trans (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left ?_ _))
    have := pairsSize_le F
    omega
  unfold convTime
  omega

/-- **Uniform polynomial bound.** The constants do not depend on `N` or `F`. -/
theorem canonicalWordProgram_time_poly :
    ∃ C d : ℕ, ∀ (N : ℕ) (F : Formula N),
      canonicalWordProgram.time (minimizeList F.bitList) ≤ C * (N + 1) ^ d := by
  obtain ⟨_, C, _, d, h⟩ := natPoly_convTime
  refine ⟨⌈C⌉₊, d, fun N F => ?_⟩
  have h1 := canonicalWordProgram_time_le F
  have h2 : (convTime N : ℝ) ≤ C * ((N : ℝ) + 1) ^ d := by simpa using h N
  have h3 : (canonicalWordProgram.time (minimizeList F.bitList) : ℝ) ≤
      (⌈C⌉₊ : ℝ) * ((N : ℝ) + 1) ^ d :=
    calc
      _ ≤ (convTime N : ℝ) := by exact_mod_cast h1
      _ ≤ C * ((N : ℝ) + 1) ^ d := h2
      _ ≤ (⌈C⌉₊ : ℝ) * ((N : ℝ) + 1) ^ d :=
        mul_le_mul_of_nonneg_right (Nat.le_ceil C) (by positivity)
  exact_mod_cast h3

/-! ### Bounded `RBEval` runs -/

/-- `RBEval` with the explicit budget `convTime N`, output OpenAI's `encodeCNF`. -/
theorem canonicalWordProgram_rbeval_convTime {N : ℕ} (F : Formula N) :
    RBEval canonicalWordProgram.code (treeEncode (minimizeList F.bitList)) (convTime N : ℝ)
      (treeEncode (Encoding.encodeCNF (canonicalCNF (bitCanonical F)))) :=
  (canonicalWordProgram_rbeval (minimizeList F.bitList)).mono
    (by exact_mod_cast canonicalWordProgram_time_le F)

/-- `RBEval` with a uniform budget `C (N+1)^d`. -/
theorem canonicalWordProgram_rbeval_uniform :
    ∃ C d : ℕ, ∀ (N : ℕ) (F : Formula N),
      RBEval canonicalWordProgram.code (treeEncode (minimizeList F.bitList))
        ((C * (N + 1) ^ d : ℕ) : ℝ)
        (treeEncode (Encoding.encodeCNF (canonicalCNF (bitCanonical F)))) := by
  obtain ⟨C, d, h⟩ := canonicalWordProgram_time_poly
  exact ⟨C, d, fun N F => (canonicalWordProgram_rbeval (minimizeList F.bitList)).mono
    (by exact_mod_cast h N F)⟩

/-- **Composition.** A later stage `q` that runs on the converter's output within `S N` gives a
two-stage code on the front end's input within `convTime N + S N + 1`, the shape
`sat_code_rate` asks of its decider. -/
theorem converter_seq {q : OAI.ParityWL.Complexity.FCode} {S : ℕ → ℝ} {b : DataTree} {N : ℕ}
    (F : Formula N)
    (hq : RBEval q (treeEncode (Encoding.encodeCNF (canonicalCNF (bitCanonical F)))) (S N) b) :
    RBEval (.seq canonicalWordProgram.code q) (treeEncode (minimizeList F.bitList))
      ((convTime N : ℝ) + S N + 1) b :=
  (canonicalWordProgram_rbeval_convTime F).seq hq

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.NatPoly
#print axioms OAI.Bridges.ETH.NatPoly.const
#print axioms OAI.Bridges.ETH.NatPoly.id
#print axioms OAI.Bridges.ETH.NatPoly.add
#print axioms OAI.Bridges.ETH.NatPoly.mul
#print axioms OAI.Bridges.ETH.NatPoly.pow
#print axioms OAI.Bridges.ETH.NatPoly.mono
#print axioms OAI.Bridges.ETH.natPoly_inputBound
#print axioms OAI.Bridges.ETH.natPoly_decPoly
#print axioms OAI.Bridges.ETH.natPoly_mapTimeBound
#print axioms OAI.Bridges.ETH.natPoly_pairsBound
#print axioms OAI.Bridges.ETH.natPoly_litTime
#print axioms OAI.Bridges.ETH.natPoly_clauseTime
#print axioms OAI.Bridges.ETH.natPoly_decodeTime
#print axioms OAI.Bridges.ETH.convTime
#print axioms OAI.Bridges.ETH.natPoly_convTime
#print axioms OAI.Bridges.ETH.convTime_expBound
#print axioms OAI.Bridges.ETH.canonicalWordProgram_time_le
#print axioms OAI.Bridges.ETH.canonicalWordProgram_time_poly
#print axioms OAI.Bridges.ETH.canonicalWordProgram_rbeval_convTime
#print axioms OAI.Bridges.ETH.canonicalWordProgram_rbeval_uniform
#print axioms OAI.Bridges.ETH.converter_seq
