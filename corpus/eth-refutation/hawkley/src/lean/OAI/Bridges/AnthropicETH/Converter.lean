import OAI.Bridges.AnthropicETH.Converter.Program

/-!
# RPI-378.3c: H2 discharged

ParityLifts' `Machine.preprocess_run` composes an `FCode` with any machine: if the code turns
`xs` into `ys` within budget `B` and `M` emits `b` on `ys` at step `s`, then `M.preprocess p` emits
`b` on `xs` within `C_M · (B + |xs| + s + 1)^preprocessingDegree` steps, where only `C_M` depends
on `M`. With `p` the converter (`Conv.convProgram`), `B` is at most
`convProgram.coefficient · (5 (|xs| + s + 1))^convProgram.degree`, which gives H2 with the degree

  `D = (convProgram.degree + 1) · preprocessingDegree`,

one number for every machine.
-/

namespace OAI.Bridges.AnthropicETH

open OAI.ParityWL.Complexity

/-- The uniform degree of the converter hypothesis. -/
noncomputable def converterDegree : ℕ := (Conv.convProgram.degree + 1) * preprocessingDegree

/-- Polynomial bookkeeping for the composed bound. -/
theorem compose_bound (A d e B L s : ℕ) (hB : B ≤ A * (L + s + 1) ^ d) :
    (B + L + s + 1) ^ e ≤ (A + 1) ^ e * (L + s + 1) ^ ((d + 1) * e) := by
  set X := L + s + 1 with hX
  have hx : 1 ≤ X := by omega
  have h1 : X ^ d ≤ X ^ (d + 1) := Nat.pow_le_pow_right hx (by omega)
  have h2 : X ≤ X ^ (d + 1) := by simpa using Nat.pow_le_pow_right hx (show 1 ≤ d + 1 by omega)
  have h3 : B + L + s + 1 ≤ (A + 1) * X ^ (d + 1) := by
    have := Nat.mul_le_mul_left A h1
    nlinarith
  calc (B + L + s + 1) ^ e ≤ ((A + 1) * X ^ (d + 1)) ^ e := Nat.pow_le_pow_left h3 e
    _ = (A + 1) ^ e * X ^ ((d + 1) * e) := by rw [mul_pow, ← pow_mul]

/-- **RPI-378.3c.** Hypothesis H2 of RPI-378.3a holds, with the uniform degree
`converterDegree`. -/
theorem converterHypothesis_proved : ConverterHypothesis := by
  refine ⟨converterDegree, fun M => ?_⟩
  obtain ⟨C, -, hrun⟩ := Machine.preprocess_run M Conv.convProgram.program.code
  let A := Conv.convProgram.coefficient * 5 ^ Conv.convProgram.degree
  refine ⟨M.preprocess Conv.convProgram.program.code, C * (A + 1) ^ preprocessingDegree,
    fun n φ hφ s b hs => ?_⟩
  have hb := Conv.convProgram.program.run (MainResults.encClauses 3 φ)
  rw [Conv.conv_encClauses φ hφ.1] at hb
  obtain ⟨r, hr, hle⟩ := hrun _ _ _ s b hb hs
  refine ⟨r, hr, hle.trans ?_⟩
  have ht := Conv.convProgram.bound (MainResults.encClauses 3 φ)
  have hsz := treeEncode_bits_size (MainResults.encClauses 3 φ)
  have hB : Conv.convProgram.program.time (MainResults.encClauses 3 φ) ≤
      A * ((MainResults.encClauses 3 φ).length + s + 1) ^ Conv.convProgram.degree := by
    apply ht.trans
    calc Conv.convProgram.coefficient *
          ((treeEncode (MainResults.encClauses 3 φ)).size + 1) ^ Conv.convProgram.degree
        ≤ Conv.convProgram.coefficient *
          (5 * ((MainResults.encClauses 3 φ).length + s + 1)) ^ Conv.convProgram.degree := by
          gcongr; omega
      _ = A * ((MainResults.encClauses 3 φ).length + s + 1) ^ Conv.convProgram.degree := by
          rw [mul_pow]; ring
  have := compose_bound A Conv.convProgram.degree preprocessingDegree _ _ s hB
  calc C * (Conv.convProgram.program.time (MainResults.encClauses 3 φ) +
        (MainResults.encClauses 3 φ).length + s + 1) ^ preprocessingDegree
      ≤ C * ((A + 1) ^ preprocessingDegree *
        ((MainResults.encClauses 3 φ).length + s + 1) ^ converterDegree) :=
        Nat.mul_le_mul_left C this
    _ = C * (A + 1) ^ preprocessingDegree *
        ((MainResults.encClauses 3 φ).length + s + 1) ^ converterDegree := by ring

end OAI.Bridges.AnthropicETH
