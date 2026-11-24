# WORKLOG — bridge A (VP ≠ VNP lane, row F2), Author A

Workspace: pod /home/tester/ws-A (copy of the built release; Lean v4.33.1, Mathlib 0df444a3).
Local drafts: scratchpad, final files copied to notes/vp-vnp-blind-2026-11-23/bridge-A/.

## 2026-11-24 00:22 UTC — BlindA elaborates unchanged

- Copied corpus/vp-vnp/blind/A/BlindA.lean to ws-A/CertMachine/BlindA.lean; sha256 on the pod
  d8891151420e827134e7c33a603bc30a6bd754e6db6073576f958a55c29ba3b0 = SEAL-1A.
- `lake env lean CertMachine/BlindA.lean`: no error, no warning (29 s). **No repair needed**; REPAIRS.md says so.
- Workspace change (recorded): appended to ws-A/lakefile.toml
  ```
  [[lean_lib]]
  name = "CertMachine"
  ```
  (original saved at /tmp/certA_lakefile.orig on the pod). `lake build CertMachine.BlindA`: success, 8706 jobs,
  nothing of the release rebuilt.
- Probed names (Probe1.lean): the release's own `Nc.Computes.{mono,rename,join}`, `Nc.CSize.{var,const}`,
  `Nc.coeff_mul_eq_zero` are reachable from `import Solution`; `Statement.Beyond c m s` is `Iff.rfl` to
  `BlindA.claimedBound c m < s`.

## Plan
1. SLP result lemma (the recursion of SLP.vals, unfolded once).
2. Forward conversion: an SLP of length ℓ computing f gives Statement.Computes f (4ℓ + 2) (a constant 0 gate,
   a constant −1 gate, then four gates per instruction: two operand gates, one auxiliary gate for subtraction,
   the result). Subtraction is not a release gate, so a − b = a + (−1)·b; a "prev" operand is a copy b + 0.
3. Reverse conversion: Statement.Computes f s gives an SLP of length s computing f (each gate one instruction).
4. Every polynomial has a release circuit (induction_on + Nc.Computes.join) ⇒ the sInf sets are nonempty.
5. hc/perm of BlindA = hc/perm of Statement (cyclic-permutation predicate; transposed index in perm).
6. Real analysis: Beyond c m (4L+2) ⇒ claimedBound (c/2) m < L for m ≥ m₁(c).
7. Assemble; classes via Solution.separation / separationClosure and family transfer.

## 00:23–00:37 UTC — the bridge, section by section (times below are not separately clocked; `date -u` read 00:22:04 before the first compile and 00:37:47 before the final build)

### sections 1–4

- §1 `vals_succ_eq`, `vals_eq_result`, `result_eq`: one fix (a `dsimp only` to beta-reduce before `dif_pos`).
- §2 forward conversion `fwd_computes : f ∈ P.computed → Statement.Computes f (4ℓ + 2)`: compiled first time.
  (4ℓ + 2, not 3ℓ + 1: subtraction is not a release gate, and an operand that is an earlier result has to be
  re-materialised as a gate, `b + 0`; any linear bound serves.)
- §3 reverse conversion `rev_computes : Statement.Computes f s → ∃ P : SLP σ F s, f ∈ P.computed`.
- §4 `exists_computes` (every polynomial over a commutative semiring has a release circuit, by
  `MvPolynomial.induction_on` and the release's `Nc.Computes.join`), hence `complexity_spec` and
  `approxComplexity_spec` (the sInf sets are nonempty, so the minimum is attained). Two fixes: explicit motive
  for `induction_on`, explicit set for `Nat.sInf_mem`.

### sections 5–7

- §5 `approx_coeff`: BlindA's `G = f + ε·g` (g with K[[ε]] coefficients) gives the release's coefficient
  condition (coefficients of order ≤ 0 are those of f). One fix: `algebraMap K (LaurentSeries K)` is the
  composite through `PowerSeries K` (`HahnSeries.powerSeriesAlgebra`), so `HahnSeries.algebraMap_apply` does not
  rewrite; used the `rfl` identity with `ofPowerSeries (PowerSeries.C a)` and `PowerSeries.coeff_coe`.
  `approx_rename` (approximation is invariant under an equivalence of variables), `fwd_approximates`.
- §6 `perm_eq : BlindA.perm K m = Statement.perm K m` (the release sums ∏ X (σ i, i), BlindA ∏ X (i, π i):
  reindex by π = σ⁻¹); `hc_eq` via `isFullCycle_iff : IsFullCycle π ↔ π.IsCycleOn Set.univ` (all m, including
  m = 0, 1). One fix: decidability instance (went through `congr 1; ext`).
- §7 `bound_halve`: Beyond c m (4L + 2) ⇒ claimedBound (c/2) m < L for m ≥ max 2 ⌈5^(2/c)⌉₊ (y = B(c/2,m) ≥ 5
  and B(c,m) = y², so y ≥ L would give y² < 4y + 2). Compiled first time apart from `push_neg` deprecation.

### the five theorems

- `mainTheorem`, `mainTheoremApprox` (constant c/2, m₀ := max m₀(release) m₁): one fix — `rw [hc_eq] at hC`
  also rewrote inside `complexity K (hc K m)`; replaced by a transport lemma `computes_of_eq`.
- `permanentOverReal` from `mainTheorem` at p = 0, K = ℝ. Also `permanentOverReal_of_release` from
  `Solution.permanent_over_real` directly (not one of the five).
- Classes: `toA` (release family → BlindA family, variables numbered by `Fintype.equivFin`);
  `toA_vnp` (release VNP ⇒ BlindA VNP; needs BlindA's explicit p-family condition, which follows from g ∈ VP via
  `totalDegree_aeval_le`), `toA_vp` (BlindA VP ⇒ release VP), `toA_vpbar` (BlindA VP-bar ⇒ release VP-bar),
  `vp_sub_vnp` (BlindA VP ⊆ BlindA VNP with w = 0, proved inside BlindA, no release theorem needed),
  `exists_pow_bound` (every q ∈ ℕ[X] is ≤ n^a + a). `separation` from `Solution.separation` (its second half),
  `separationClosure` from `Solution.separationClosure`. **Route: via Solution.separation / separationClosure
  and the family transfer, not via the main theorems** (shorter: no VNP membership of HC is needed).
  Fixes: beta-redex in `vp_sub_vnp` (`show` the normal form), missing `totalDegree_X_le` (used
  `(totalDegree_X x).le`), an extra `congr 1`.

## 00:38–00:40 UTC — final check

```
$ lake build CertMachine.BridgeA CertMachine.ChallengeA
⚠ [9028/9029] Built CertMachine.ChallengeA (8.4s)      -- the five intended `sorry`s
✔ [9029/9029] Built CertMachine.BridgeA (20s)          -- no warning
Build completed successfully (9029 jobs).               -- release modules replayed from cache, none rebuilt
$ lake env lean CertMachine/PrintAxiomsA.lean
'CertMachine.BridgeA.mainTheorem' depends on axioms: [propext, Classical.choice, Quot.sound]
'CertMachine.BridgeA.mainTheoremApprox' depends on axioms: [propext, Classical.choice, Quot.sound]
'CertMachine.BridgeA.separation' depends on axioms: [propext, Classical.choice, Quot.sound]
'CertMachine.BridgeA.separationClosure' depends on axioms: [propext, Classical.choice, Quot.sound]
'CertMachine.BridgeA.permanentOverReal' depends on axioms: [propext, Classical.choice, Quot.sound]
'CertMachine.BridgeA.permanentOverReal_of_release' depends on axioms: [propext, Classical.choice, Quot.sound]
```
Release files in ws-A unchanged (sha256 of Statement, Solution, Challenge, comparator.json, lean-toolchain,
lake-manifest.json equal to PREREG.md). No `sorry`, `axiom`, `native_decide`, `implemented_by`, `extern` in
BridgeA.lean or BlindA.lean (grep). Total wall time about 20 minutes of compiling (00:22–00:40 UTC); no wall hit.
Files copied to the Mac 00:40 UTC.
