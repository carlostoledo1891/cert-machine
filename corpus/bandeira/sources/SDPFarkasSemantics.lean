import Mathlib.Data.Real.Basic
import Mathlib.Tactic

/-!
# SDP/Farkas semantics bridge for the Lai--Lim certificate

This file is intentionally **certificate-shaped**, not a beautiful generic SDP
library.  It avoids spending more time on a generic triple-sum LDL algebra loop
and instead exposes exactly the semantic interfaces that the generated
certificate files must provide.

Generated arithmetic files already prove finite rational data:
* `FarkasStandardFull.lean`: standard-form reconstruction, including scalar
  `120*y0+bᵀy = 1417280/1417281`, scalar block `m00 < 0`, and all block entries
  `Q=-M`.
* six `FarkasProbeK31*.lean` files: each block `Q_j` has exact LDL row
  equalities and positive pivots.

The remaining semantic connection is: these block certificates imply the cone
pairing `pairM ≤ 0` for every feasible PSD primal point.  This file packages the
SDP contradiction once that cone-pairing fact is supplied in the same shape that
those generated files are meant to discharge.
-/

namespace QiushiFarkas

/-- A scalarized SDP/Farkas certificate interface. Duplicated here deliberately
so this session-local file can compile without relying on project module import
plumbing for `AbstractFarkas.lean`. -/
structure ScalarFarkasData where
  lambda0 : ℝ
  y0 : ℝ
  c0 : ℝ
  lin : ℝ
  pairM : ℝ

/-- Ordered-linear scalar Farkas contradiction. This is the same semantic core as
`AbstractFarkas.scalar_farkas_contradiction`, repeated here to keep the
certificate-shaped bridge executable as a standalone Lean file. -/
theorem scalar_farkas_contradiction (D : ScalarFarkasData)
    (hy0 : D.y0 < 0)
    (hc0 : D.c0 ≤ D.lambda0)
    (hpair : D.pairM = D.y0 * D.c0 + D.lin)
    (hcone : D.pairM ≤ 0)
    (hscalar : D.lambda0 * D.y0 + D.lin > 0) : False := by
  have hy0_nonpos : D.y0 ≤ 0 := le_of_lt hy0
  have hmul : D.y0 * D.lambda0 ≤ D.y0 * D.c0 := by
    exact mul_le_mul_of_nonpos_left hc0 hy0_nonpos
  have hmul_add : D.y0 * D.lambda0 + D.lin ≤ D.y0 * D.c0 + D.lin := by
    nlinarith [hmul]
  have hscalar_le_pair : D.lambda0 * D.y0 + D.lin ≤ D.pairM := by
    rw [hpair]
    calc
      D.lambda0 * D.y0 + D.lin = D.y0 * D.lambda0 + D.lin := by ring
      _ ≤ D.y0 * D.c0 + D.lin := hmul_add
  have hpos_pair : 0 < D.pairM := lt_of_lt_of_le hscalar hscalar_le_pair
  exact not_lt_of_ge hcone hpos_pair
/-- Certificate-level scalar constants used in the Lai--Lim `(5,5)` Farkas
certificate.  The large finite arithmetic files prove these concrete values. -/
structure LaiLimScalarCertificate where
  y0 : ℝ
  lambda0 : ℝ
  lin : ℝ
  hy0 : y0 < 0
  hscalar : lambda0 * y0 + lin > 0

/-- Exact scalar certificate specialized to the current rational data.  This is
small, but it is anchored to the same numbers checked in `FarkasStandardFull`. -/
noncomputable def lailimScalarCertificate : LaiLimScalarCertificate where
  y0 := (-146 : ℝ) / (2061 : ℝ)
  lambda0 := 120
  lin := (1417280 : ℝ) / (1417281 : ℝ) - 120 * ((-146 : ℝ) / (2061 : ℝ))
  hy0 := by norm_num
  hscalar := by norm_num

/-- A certificate-shaped feasible primal summary.

`c0` is the objective pairing `⟪C0,Y⟫`.
`lin` is `bᵀy`, obtained after substituting standard-form constraints.
`pairM` is `⟪M,Y⟫` for `M = y0*C0 + Σ y_i*C_i`.

The fields are deliberately the exact semantic obligations that should be
discharged from the generated artifacts:
* `h_bound`: the SDP bound `⟪C0,Y⟫ ≤ 120`;
* `h_standard_form`: standard-form constraints plus `FarkasStandardFull` give
  `pairM = y0*c0 + bᵀy`;
* `h_cone`: scalar block negativity plus six LDL-certified blocks give
  `pairM ≤ 0` for feasible PSD `Y`.
-/
structure LaiLimFeasibleSemantic where
  c0 : ℝ
  pairM : ℝ
  h_bound : c0 ≤ lailimScalarCertificate.lambda0
  h_standard_form : pairM = lailimScalarCertificate.y0 * c0 + lailimScalarCertificate.lin
  h_cone : pairM ≤ 0

/-- Turn a feasible semantic package into the scalar data consumed by
`AbstractFarkas.scalar_farkas_contradiction`. -/
noncomputable def toScalarFarkasData (Y : LaiLimFeasibleSemantic) : ScalarFarkasData where
  lambda0 := lailimScalarCertificate.lambda0
  y0 := lailimScalarCertificate.y0
  c0 := Y.c0
  lin := lailimScalarCertificate.lin
  pairM := Y.pairM

/-- The compiled semantic bridge: if a primal feasible object supplies the
standard-form substitution and the cone-pairing inequality matching the generated
Farkas certificate, then it is impossible.

This is not claiming the generated row files have already been imported into
this theorem.  It names the exact remaining machine-checkable obligations:
`h_standard_form` must be instantiated from `FarkasStandardFull.lean`, and
`h_cone` must be instantiated from the six LDL block certificates plus PSD primal
semantics. -/
theorem no_lailim_feasible_from_certificate_semantics : IsEmpty LaiLimFeasibleSemantic := by
  refine ⟨?_⟩
  intro Y
  exact scalar_farkas_contradiction (toScalarFarkasData Y)
    lailimScalarCertificate.hy0
    Y.h_bound
    Y.h_standard_form
    Y.h_cone
    lailimScalarCertificate.hscalar

/-- Same bridge as a reusable theorem over an arbitrary feasible type.  This is
the theorem a later generator/constructor should instantiate once the concrete
SDP primal semantics are encoded. -/
theorem no_feasible_type_from_lailim_certificate {Feas : Type}
    (toSem : Feas → LaiLimFeasibleSemantic) : IsEmpty Feas := by
  refine ⟨?_⟩
  intro x
  have hEmpty : IsEmpty LaiLimFeasibleSemantic := no_lailim_feasible_from_certificate_semantics
  exact IsEmpty.false (toSem x)

/-!
## Adapter layer aligned with generated theorem shapes

The generated files do not currently expose a compact matrix object.  They expose
families of theorems with these shapes:
* `FarkasStandardFull.scalar_reconstructed_pos` and row theorems
  `block*_standard_row*` proving conjunctions of rational equalities `Q=-M`;
* `FarkasProbeK31*.block*_pivot*_pos` and `block*_ldl_K31_row*` proving pivot
  positivity and row-wise LDL equality conjunctions.

The following structure is therefore deliberately theorem-shape based.  A later
generator can fill its fields by exact theorem names from the generated files,
without needing a generic matrix library or a solved generic triple-sum theorem.
-/

structure GeneratedFarkasTheoremShape where
  scalar_reconstructed_pos : ((1417280 : ℚ) / (1417281 : ℚ)) > 0
  m00_reconstructed_neg : ((-1060 : ℚ) / (20438937 : ℚ)) < 0
  standard_rows_verified : Prop
  ldl_rows_verified : Prop
  pivot_rows_pos_verified : Prop
  h_standard_rows : standard_rows_verified
  h_ldl_rows : ldl_rows_verified
  h_pivots : pivot_rows_pos_verified

/-- The semantic consequence expected from the generated row theorem families.
This is the exact adapter target: instantiate it from `block*_standard_row*`,
`block*_ldl_K31_row*`, and `block*_pivot*_pos`, then the contradiction is fully
connected at the SDP/Farkas semantic level. -/
structure GeneratedCertificateAdapter where
  generated_shape : GeneratedFarkasTheoremShape
  toSem : LaiLimFeasibleSemantic

/-- Once the generated theorem-shape adapter supplies a feasible semantic object,
the scalar Farkas contradiction gives `False`.  This theorem is intentionally
compiled now so that future generator work has a fixed target: produce
`GeneratedCertificateAdapter`, not a new abstract boundary. -/
theorem generated_adapter_false (A : GeneratedCertificateAdapter) : False := by
  have hEmpty : IsEmpty LaiLimFeasibleSemantic := no_lailim_feasible_from_certificate_semantics
  exact IsEmpty.false A.toSem

/-- There can be no generated adapter whose fields discharge the semantic
standard-form and cone obligations.  This is the current compiled `IsEmpty`
adapter theorem; the remaining work is to fill `GeneratedCertificateAdapter`
from the actual generated theorem families rather than by assumptions. -/
theorem no_generated_certificate_adapter : IsEmpty GeneratedCertificateAdapter := by
  refine ⟨?_⟩
  intro A
  exact generated_adapter_false A
end QiushiFarkas
