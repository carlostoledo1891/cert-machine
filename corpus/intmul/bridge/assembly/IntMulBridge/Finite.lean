import IntegerMultBounds.MathlibTM2.Statement
import IntegerMultBounds.MathlibTM2.Stack
import IntegerMultBounds.MathlibTM2.Host.Core
import IntegerMultBounds.MathlibTM2.Fast.Glue
import IntegerMultBounds.MathlibTM2.Fast.CompactMainRunsTime
import IntegerMultBounds.MathlibTM2.Fast.CompactMainDispatch
import IntegerMultBounds.MathlibTM2.Cost.CompactRetunedTransformMatchR
import IntegerMultBounds.MathlibTM2.Fast.CompactFinalR

/-!
# The community machine has finite stack alphabets

Mathlib's `Turing.FinTM2` asks a `Fintype` of the INPUT stack's alphabet only, and the
community statement `IntegerMultBounds.MathlibTM2.MulInTime` hides its machine inside an
existential, so the finiteness of the other stack alphabets cannot be read out of
`IntegerMultBounds.MathlibTM2.mulInTime`. The machine is built in one place,
`IntegerMultBounds.MathlibTM2.Fast.mulInTime_of_host`, as
`Stack.machine body pm .inp .out v₀` of a host procedure table: its stacks are `Option (HK T)`,
the return stack `none` over `Option (Lbl body)` and the host stacks `some k` over `HΓ A k`
(`Bool ⊕ Bool`, `Bool`, `Fin (A + 4)`), every one of them finite.

This file re-runs the community release's own final chain with that extra conjunct:

  `mulInTime_of_host` → `mulInTime_of_dispatch` → `compactMulInTime_of_main_exec` →
  `compactCompletedR_mulInTime` → `compactR_mulInTime` → `compactR_mulInTime_final`

Each lemma below is the release's lemma of the same name with `MulInTime` replaced by
`MulInTimeFinite`, its proof the release's proof with the previous lemma of THIS file in the
place of the release's. Every input (`dispatch_exec`, `isBigO_dispatchTime`, `two_le_time`,
`compactMain_runs_time_isBigO`, `compactCompletedR_hostMul`, `compactRetunedPrefixR_exec`,
`compactRetunedR_transform_cost_le`) is the release's own, used as the release uses it. No
mathematics of the release is proved again here and none of its files is edited.
-/

namespace IntMulBridge

open Turing Computability Asymptotics Filter
open IntegerMultBounds IntegerMultBounds.Machine IntegerMultBounds.MathlibTM2
open IntegerMultBounds.MathlibTM2.Fast IntegerMultBounds.MathlibTM2.Fast.Main
open IntegerMultBounds.MathlibTM2.Host IntegerMultBounds.MathlibTM2.Stack
open IntegerMultBounds.MathlibTM2.Layer IntegerMultBounds.MathlibTM2.LayerMachine
open IntegerMultBounds.MathlibTM2.Node IntegerMultBounds.Networks
open IntegerMultBounds.Networks.Shared50ModularControl (prime)
open IntegerMultBounds.MathlibTM2.Fast.TableVM
open IntegerMultBounds.MathlibTM2.Mult.Sizes IntegerMultBounds.MathlibTM2.Fast.ChirpSt
open IntegerMultBounds.MathlibTM2.Cost

/-- `IntegerMultBounds.MathlibTM2.MulInTime` with one more conjunct: every stack alphabet of the
machine is finite. -/
def MulInTimeFinite (κ : ℝ) : Prop :=
  ∃ M : TM2ComputableInTime pairEnc encodingNatBool.encode (fun p : ℕ × ℕ => p.1 * p.2),
    (∀ k, Finite (M.tm.Γ k)) ∧
    (fun n : ℕ => (M.time n : ℝ)) =O[atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - κ)

/-- Sanity: the strengthened statement gives the community statement back, with the same
machine. -/
theorem MulInTimeFinite.mulInTime {κ : ℝ} (h : MulInTimeFinite κ) : MulInTime κ := by
  obtain ⟨M, -, hM⟩ := h
  exact ⟨M, hM⟩

section Glue

variable {P : Type} {T Q A : ℕ} {U : Type}

/-- Every stack alphabet of the compiled machine of a host procedure table is finite: the return
stack holds `Option (Lbl body)`, the input stack `Bool ⊕ Bool`, the output stack `Bool`, and the
two stacks of each tape `Fin (A + 4)`. -/
theorem hostMachine_finite [Fintype P] [Fintype U] (body : P → Pr P T Q A U) (pm : P)
    (v₀ : HS T Q A U) : ∀ k, Finite ((machine body pm .inp .out v₀).Γ k) := by
  intro k
  change Finite (MΓ body k)
  rcases k with _ | (_ | _ | i | i)
  · change Finite (Option (Lbl body)); infer_instance
  · change Finite (Bool ⊕ Bool); infer_instance
  · change Finite Bool; infer_instance
  · change Finite (Fin (A + 4)); infer_instance
  · change Finite (Fin (A + 4)); infer_instance

/-- `IntegerMultBounds.MathlibTM2.Fast.mulInTime_of_host` with the finiteness conjunct: the same
machine, the same proof of `outputsFun`. -/
theorem mulInTimeFinite_of_host [Fintype P] [Fintype U] (body : P → Pr P T Q A U) (pm : P)
    (v₀ : HS T Q A U) (time : ℕ → ℕ) {κ : ℝ}
    (hrun : ∀ x y, HostMulWithin body pm v₀ time x y)
    (htime : (fun n => (time n : ℝ)) =O[atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - κ)) :
    MulInTimeFinite κ := by
  refine ⟨{ tm := machine body pm .inp .out v₀
            inputAlphabet := Equiv.refl _
            outputAlphabet := Equiv.refl _
            time := time
            outputsFun := fun p => ?_ }, hostMachine_finite body pm v₀, htime⟩
  have e := Classical.choose_spec (hrun p.1 p.2)
  have o := Exec.toOutputs (body := body) pm .inp .out v₀ e.2 e.1
  simp only [Equiv.refl]
  erw [List.map_id, List.map_id]
  exact o

/-- `IntegerMultBounds.MathlibTM2.Fast.mulInTime_of_dispatch` with the finiteness conjunct. -/
theorem mulInTimeFinite_of_dispatch [Fintype P] [Fintype U] (body : P → Pr P T Q A U) (pm : P)
    (v₀ : HS T Q A U) (time : ℕ → ℕ) (n₀ : ℕ) {κ : ℝ}
    (hfast : ∀ x y, n₀ ≤ (pairEnc (x, y)).length → HostMulWithin body pm v₀ time x y)
    (htime : (fun n => (time n : ℝ)) =O[atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - κ)) :
    MulInTimeFinite κ := by
  have hpos : ∀ᶠ n in atTop, 1 ≤ time n :=
    eventually_atTop.2 ⟨n₀, fun n hn => by have := two_le_time hfast hn; omega⟩
  exact mulInTimeFinite_of_host (dispatch n₀ body pm) none (withBuf v₀ Buf.empty)
    (dispatchTime n₀ time) (dispatch_exec body pm v₀ time n₀ hfast)
    ((isBigO_dispatchTime n₀ time hpos).trans htime)

end Glue

/-- `IntegerMultBounds.MathlibTM2.Fast.Main.compactMulInTime_of_main_exec` with the finiteness
conjunct. -/
theorem compactMulInTimeFinite_of_main_exec
    {P U : Type} [Fintype P] [Fintype U] {H Q A : ℕ}
    (body : P → Pr P H Q A U) (pm : P) (v₀ : HS H Q A U)
    {K : ℕ} {Lb : LProc → MnPr (prime + K)} {w : ℕ → ℕ}
    {σ : ℕ → LReg SXReg → List (Fin (prime + K + 4))} (D : MnDist K Lb w σ)
    (cF cO : ℕ → ℕ) (c extra : ℕ) {Cs : ℝ}
    (hCs : ∀ᶠ n in atTop, ((cF n + cO n : ℕ) : ℝ) ≤ Cs * CompactTotal.conv n)
    (hexec : ∀ᶠ n in atTop, ∀ x y, (pairEnc (x, y)).length = n →
      HostMulWithin body pm v₀
        (compactMainTime D (fun n => compactMainRuns D cF cO n + extra) H c) x y) :
    MulInTimeFinite (4222422970 / 2 ^ 46 : ℝ) := by
  obtain ⟨n₀, hn₀⟩ := eventually_atTop.1 hexec
  have hfast : ∀ x y, n₀ ≤ (pairEnc (x, y)).length →
      HostMulWithin body pm v₀
        (compactMainTime D (fun n => compactMainRuns D cF cO n + extra) H c) x y := by
    intro x y hn
    exact hn₀ _ hn x y rfl
  exact mulInTimeFinite_of_dispatch body pm v₀ _ n₀ hfast
    (compactMain_runs_time_isBigO D cF cO H c extra hCs)

/-- `IntegerMultBounds.MathlibTM2.Fast.Main.compactCompletedR_mulInTime` with the finiteness
conjunct. -/
theorem compactCompletedR_mulInTimeFinite
    (hcost : ∃ C : ℝ, ∀ᶠ n in atTop,
      ((compactRetunedCFR n + compactRetunedCOR n : ℕ) : ℝ) ≤ C * CompactTotal.conv n)
    (p : CompactMnPr CompactMainProc (prime+mnKa)) (extra : ℕ)
    (hexec : ∀ᶠ n in atTop, ∀ x y, (pairEnc (x,y)).length=n →
      ∃ m v S, m ≤ compactRetunedPreTimeR extra n ∧
        Exec (compactCompletedTableR p) p (Store.only compactMainV₀ .inp (pairEnc (x,y))) m (mk v S) ∧
        S.inp=[] ∧ S.out=encodingNatBool.encode (x*y) ∧ ∀ k,S.L k=[]) :
    MulInTimeFinite (4222422970/2^46:ℝ) := by
  obtain ⟨Cs, hCs⟩ := hcost
  apply compactMulInTimeFinite_of_main_exec (compactCompletedTableR p) (compactMainOldProc .main)
    compactMainV₀ compactRetunedDist compactRetunedCFR compactRetunedCOR (compactCompletedPushR p)
    extra hCs
  filter_upwards [hexec] with n hn x y hxy
  obtain ⟨m,v,S,hm,he,hi,ho,hL⟩ := hn x y hxy
  exact compactCompletedR_hostMul p extra x y he (hxy ▸ hm) hi ho hL

/-- `IntegerMultBounds.MathlibTM2.Fast.Main.compactR_mulInTime` with the finiteness conjunct. -/
theorem compactR_mulInTimeFinite
    (hcost : ∃ C : ℝ, ∀ᶠ n in atTop,
      ((compactRetunedCFR n + compactRetunedCOR n : ℕ) : ℝ) ≤ C * CompactTotal.conv n) :
    MulInTimeFinite (4222422970/2^46:ℝ) :=
  compactCompletedR_mulInTimeFinite hcost compactRetunedPrefixR 16 compactRetunedPrefixR_exec

/-- The community release's headline (`IntegerMultBounds.MathlibTM2.mulInTime`, by
`Fast.Main.compactR_mulInTime_final`) with the finiteness conjunct: the same machine, the same
time function, the same saving, and every stack alphabet finite. -/
theorem mulInTimeFinite : MulInTimeFinite (4222422970 / 2 ^ 46 : ℝ) :=
  compactR_mulInTimeFinite compactRetunedR_transform_cost_le

end IntMulBridge
