# Reader tests, Author D (VP ≠ VNP lane), WORKLOG

Workspace `/home/tester/ws-D` on the lane's pod (a copy of the built release: Lean v4.33.1, Mathlib 0df444a3).
Inputs: `corpus/vp-vnp/prompts/bridge.md` (rules) and `corpus/vp-vnp/reader/REPORT.md` section C (tests T1–T23).
Out of scope: T1, T2, T3, T7s, T11a, T12 (Author C, anchors) and T22 (it is PREREG F2, the bridge for BlindA, Author A).
All times UTC, from `date -u` on the Mac and the pod (the two clocks agreed to the second).

## Files

| file | what |
|---|---|
| `ReaderTests.lean` | module `CertMachine.ReaderTests`, imports `Solution`; 70 theorems, 0 sorry |
| `ReaderLiteral.lean` | module `CertMachine.ReaderLiteral`: the reader's section C statements typed in again as the reader wrote them, each closed by the ReaderTests theorem (`example : <reader's text> := ReaderTests.Txx`). Every REPAIR or CHANGE is marked there. It elaborates, so the proved statements are the reader's up to definitional equality |
| `ReaderTestsAxioms.lean` | `#print axioms` for each of the 70 theorems |
| `print-axioms.txt` | its output: 67 show `[propext, Classical.choice, Quot.sound]`, three show a subset (`T14a`, `pow_add_self_mono`, `shift_bound`: `[propext, Quot.sound]`) |
| `lakefile.diff` | the only change to the workspace's release files: `[[lean_lib]] name = "CertMachine"` appended (original kept as `lakefile.toml.orig-D` in ws-D) |

sha256 (pod and Mac copies agree): ReaderTests.lean `74301dc5…0edd4`, ReaderLiteral.lean `daf71736…6eda`,
ReaderTestsAxioms.lean `0e2951fa…8c77`. Statement.lean, Solution.lean and Challenge.lean in ws-D hash to the PREREG
values (`f090345d…`, `97bdfbf8…`, `808337bc…`): no release file was edited.

The final checks (00:50–00:54):
- `lake build CertMachine.ReaderTests`: 9027 jobs. The release was replayed, not rebuilt. ReaderTests took 13 s, the
  whole command 20 s.
- `lake env lean CertMachine/ReaderTests.lean`: exit 0, no warnings, 12.7 s, 6.9 GB maxrss.
- `lake env lean CertMachine/ReaderLiteral.lean`: exit 0, no warnings, 10.5 s.
- grep finds no `sorry`, `admit`, `axiom`, `native_decide`, `implemented_by`, `extern` or `set_option` in the three
  files. T6_value uses `decide` (kernel evaluation over the two permutations of Fin 2).

## Log

- **00:27** Connected; the pod is shared (load ≈ 70 from other authors' builds and a con-leche build). ws-D holds the
  built release.
- **00:28** Appended `[[lean_lib]] CertMachine` to ws-D's lakefile.toml; the original is saved as `lakefile.toml.orig-D`.
  I worked one file at a time with `lake env lean`, on scratch files `CertMachine/P1..P7.lean`, which have since been
  deleted from ws-D.
- **00:29 batch 1** (T21, T19, T14a, T8, T7 at m = 0, 1, T10): compiled on the first try (29 s). The reader's names
  for the release's constants were all right: `Solution.toNc`, `Nc.VP`, `Nc.VNP`, `Paper.VPBar`, `Nc.genHC`,
  `Nc.genPerm`. Every bridge is `Iff.rfl` or `rfl`.
- **00:31 batch 2** (T6a, T6b, T6 value and planted value, T7m, T14b, T5). Three errors on the first try, all in my own
  proofs:
  - a `fin_cases` that left a goal; replaced by `decide` on the filter over `Perm (Fin 2)`;
  - a leftover `rfl`;
  - `(Equiv.inv _) σ` is not syntactically `σ⁻¹`; fixed with a `show`.
  T6a is the release's `Nc.Hc.sum_cycles_eq_sum_orders` with `M a b := X (a, b)`, accepted by `exact` up to
  beta-reduction, so the summation sets agree definitionally. T6b counts with the same lemma at `M := 1` over ℕ, then
  takes `card {π // π 0 = 0} = k!` through Mathlib's `Equiv.Perm.decomposeFin`.
- **00:34 batch 3** (T13, T16a, T16, T17, T11b). The first try had about a dozen errors, again all in proofs:
  - Mathlib names: there is no `totalDegree_X_le` (I used `totalDegree_X`), and `isCycle_finRotate_of_le` and
    `support_finRotate_of_le` live in the root namespace;
  - `omega` treats `2 ^ k` as an integer atom with no sign, so I added `1 ≤ 2 ^ k` explicitly;
  - one inequality in my own bound was false (`2^k·n^k ≤ n^k·n^k` needs n ≥ 2); I replaced it by `2^k ≤ n`, which gives
    the bound n^(k+1);
  - `HahnSeries.coeff_single`'s `if` carries a different `Decidable` instance; I split on `i = 0` instead;
  - `Finsupp.mapRange` does not elaborate on an `MvPolynomial` argument, so I built the witness g of T13 as a finite sum
    of monomials;
  - `coeff_monomial` needs `DecidableEq V`; I used `classical`.
  It compiled on the third try (00:39).
- **00:40 batch 4** (T18i, T9a, T9b, T9c, T20a–c, T15). Two errors:
  - my map helper had both rings in one universe (ULift.{u} F is in another);
  - Mathlib's `Algebra (RatFunc F) (LaurentSeries F)` is a **scoped** instance (`RatFunc.liftAlgebra`), so the proof of
    T15 needs `open scoped RatFunc`. The statement and the reader's definition `ApproxRat` do not use that algebra.
  It compiled on the second try.
- **00:43** Extra definitional bridges, beyond the reader's five: `Computes ↔ Nc.Computes`, `Approximates ↔
  Nc.Approximates`, `ofNc (toNc f) = f`, the three classes in the `ofNc` direction (the direction
  `separation`/`separationClosure` use), and `permanent_over_real` ↔ the statement of `Paper.thm_main`. All are
  `Iff.rfl` or `rfl`, first try.
- **00:44** Merged everything into `ReaderTests.lean`, then added T18ii and T23. In `vnp_rename`, proving the VP part of
  the witness through the general lemma `vp_rename` hit the 200000-heartbeat limit (whnf timeout while unifying through
  `renameFamily`). I proved that part directly instead, with no heartbeat option. A `congr 1` that stopped at
  `aeval f = aeval g` became `congrArg`. It compiled (00:46).
- **00:48** T4a and T4b compiled on the first try, and T4c on the first try (00:49).
- **00:50** `lake build CertMachine.ReaderTests` succeeded.
- **00:51** Literal check. The reader's T6b as written does **not** elaborate:
  `error: failed to synthesize instance of type class DecidablePred fun σ => σ.IsCycleOn Set.univ`. Repair: `open
  Classical in`, exactly as the release's own `hc` does. Then I wrote ReaderLiteral.lean (all other statements as
  written), and it elaborates.
- **00:52** `#print axioms` over all 70 theorems: only the standard three, as above.

Total about 27 minutes of the 6 hours. Nothing resisted.

## Repairs and changes to the reader's statements

- **T6b, REPAIR (instance).** `open Classical in` is added, because no `DecidablePred` instance exists for
  `IsCycleOn`. The cardinality of a filter does not depend on the instance, and the release's `hc` uses the same
  `open Classical in`. The meaning is unchanged.
- **T4, CHANGE (a definition the reader left as `sorry`).** `ComputesOps` is mine: a straight-line program of L
  operations, each `+`, `−` or `×`, of two operands. An operand is an earlier result, a variable or a constant, so
  inputs and constants are free and a scalar multiple λ·a is one `×` with a constant operand. The output is an operand
  after the last operation (`IsOperand l L f`). The free variables `f L s` of T4a/T4b are bound explicitly, because the
  release sets `autoImplicit = false`.
- **T23, CHANGE (the reader gave only a comment).** My statement: for `e n : f.vars n ≃ W n`, the renamed family
  `renameFamily f W e` (poly n := rename (e n) (f.poly n)) is in VP, VNP or VPBar iff f is. `T23_fin` is the reader's
  instance, `W n = Fin (card (f.vars n))` along `Fintype.equivFin`.
- **Form only.** Each reader `example` became a named theorem (`T6_value`, `T6_planted_refuted`, `T7_zero`, `T7_one`,
  `T8`, `T10`, `T14a`, `T14b`, `T19`, `T21_*`), so that `#print axioms` can name it. ReaderLiteral.lean re-checks each
  one against the reader's text.
- **Extensions (not in the reader's list, labelled as such).** T9c: `MainTheorem.{0} → MainTheorem.{u}`, with the same
  c and m₀ per p. The T21 extras listed at 00:43.

## What the tests used from the release (so not independent of it)

- T6a, T6b, and through T6a also T6_value and T6_planted_refuted: `Nc.Hc.sum_cycles_eq_sum_orders`.
- T9b, T9c: `Paper.exists_closed`, `Paper.lem_transfer`, `Paper.map_genHC`, `Paper.permInt`, `Paper.map_permInt`.
- T20a–c: `Paper.hc_mem_VNP`, `Paper.vp_subset_vnp`, `Paper.exists_beyond_poly`. (T18ii uses none of these: only
  its hypothesis `Separation` and T16a.)
- T10 uses `Solution.mainTheorem`. T4c, T9a, T20b and T20c take MainTheorem or MainTheoremApprox as a hypothesis.
- The helpers `computes_mono`, `computes_map` and the renaming steps use `Nc.Computes.mono`, `Nc.Computes.map` and
  `Nc.Computes.rename`. Each is applied to `Statement.Computes` by definitional unfolding (that equality is T21_Computes).
- Independent of the release's proofs, using Mathlib and Statement only: T5, T7*, T8, T11b, T13, T14, T15's
  coefficient argument, T16a (its own degree lemma `totalDegree_aeval_le`), T17, T18i, T19, T4a, T4b, and T23 apart from
  `Computes.rename`.

## Findings

No test failed. Nothing contradicts any rating in REPORT.md. The ratings that rest on Mathlib facts the reader could
not read (rows 10, 12–13, 19, 34, 41) are each confirmed by a compiled test:

- row 41 by T21 (all bridges definitional);
- rows 10–11 by T21_hc and T6a/T6b (the (m−1)! cyclic orders);
- rows 12–13 by T7_zero, T7_one and T7m;
- row 19 by T14a (`rfl`) and T14b;
- row 34 by T19.

The one statement repair (T6b) is an instance, not a meaning.

Two results go a little beyond the reader:

- **Row 17 (universes).** T9a and T9c together give `MainTheorem.{0} ↔ MainTheorem.{u}` with the same c and the same m₀
  for every p. The formal gap the reader names (m₀ might depend on u) is closed, and the proof needs no
  countable-subfield argument: the release's `lem_transfer` already moves any circuit, in any universe, into a field in
  `Type`.
- **Rows 1, 2 and 42 (operation counts).** T4c proves MainTheorem in the operations-only count (inputs free, +, −, ×)
  with c/2 and an m₀ that does not depend on F. That covers the BCS/Bürgisser-style count for the classes and the bound,
  under my definition of ComputesOps. It does not settle row 42's wording question, which stays with F2 (Author A).
