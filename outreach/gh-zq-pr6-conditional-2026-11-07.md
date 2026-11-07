**Stacked on #5** (P₀ has infinite order). Until that PR merges, this diff includes it; the new commit is the second one.

**What this proves, and what it does not.** `CondZQ.exists_bounded_integer_polynomial_defining_integers_of_eight_hypotheses` proves the conclusion of `ZInQ.exists_bounded_integer_polynomial_defining_integers`, byte for byte, from eight hypotheses: `HypM`, `HypH`, `HypPC`, `HypC`, `HypLT`, `HypCC`, `HypH1` and `HypH2`.

**None of the eight is proved here, and the theorem stays conditional.** It does not prove the frozen target or discharge any of the eight, and if any one of them is false it says nothing. In the terms of CONTRIBUTING.md, this is a statement change: it adds eight assumptions to the frozen statement. The conditional theorem lives in its own namespace and library, kept separate from the frozen target as you asked. `Frozen/BoundedIntegerPolynomial.lean` is byte-unchanged (SHA-256 `0889579a…`), and nothing in `CondZQ` imports it. Its axioms are `propext`, `Classical.choice` and `Quot.sound`.

**The eight hypotheses.** Each is an explicit `Prop` in `lean/CondZQ/Hypotheses.lean`, and its docstring names its manuscript source. TeX lines are those of `diophantine_zq.tex` at `97cec7fd`, the same bytes as `docs/theorem-application-audit/source/audited-baseline.tex` on `main`.

| Hypothesis | Manuscript source |
| --- | --- |
| `HypM` | premise M (TeX 96–97), `sec:mult`, `prop:box`, `prop:fixed-prime-pattern` |
| `HypH` | premise H (98–99), `thm:height` (404–408) at `S_ht` |
| `HypPC` | premise PC (100–101), `hyp:PC` (1001–1004) |
| `HypC` | premise C (102–104), `sec:compiler`, the `Close` relation (6103–6106) |
| `HypLT` | `lem:test` (6151–6200), `lem:test-complete` (6202–6235) |
| `HypCC` | `eq:close-complete` (6114) |
| `HypH1` | proof of `prop:cutoff` (6297–6308), Bennett–Martin–O'Bryant–Rechnitzer |
| `HypH2` | proof of `prop:cutoff` (6310–6349), M₀ ≤ N_s¹⁰ |

**The ledger.** `lean/CondZQ/LEDGER.md` is the hypothesis-to-manuscript ledger. For each hypothesis it gives the statement, the TeX lines, the literature it rests on, and the snapshot modules it uses. It also lists the premises that are proved, not assumed: the first clause of `prop:generator`, from #5. And it lists every step proved between the hypotheses and the conclusion:
- the cutoff T < 2^(2^(2^9013)) from H1 and H2;
- injectivity of ι;
- `eq:close-sound` and the exact-value argument of `sec:bridge`;
- the assembled polynomial's zero projection and size;
- the two tower comparisons, through `NumericalTowerBounds`.

I re-checked every TeX line number in the ledger and the docstrings against that file at `036cebe4`. Several ranges in the claimbox version linked from #3 were off (premises M and C, the H1/H2 and dyadic ranges in the proof of `prop:cutoff`), and they are corrected here.

**Where this departs from the saved P\_\*.** The frozen target is existential in P, and the polynomial assembled here is not the saved P\_\*:
- It has no `member` call, since the multiplication relation already types its inputs.
- It has no `value.exceptions` template: a second factor evaluates the same sum of squares at u = t + 1000 ∉ 𝒞.
- Its 292,890,231,498 witnesses are padded into the 292,890,231,904 slots.

`HypM`, `HypC` and `HypLT` are existential, and each one follows from the manuscript's premise for that template together with premise B. Premise B for P\_\* itself is not used.

**Statement checks.** `Checks/ConditionalStatement.lean` imports the frozen file, which the script compiles into its own output directory for this check only, and makes three checks:
1. `CondZQChecks.statement_is_the_frozen_target`, given the eight hypotheses, has type `type_of% @ZInQ.exists_bounded_integer_polynomial_defining_integers`, read from your file and never retyped. It is proved by the conditional theorem, and your `sorry` is not used: its axioms are the standard three.
2. The conditional theorem's type is exactly `HypM → HypH → HypPC → HypC → HypLT → HypCC → HypH1 → HypH2 → τ`, with τ the frozen theorem's type. The comparison uses `Expr.equal`, so binder names count, and each of the eight must be a `Prop`.
3. The script compares bytes: the 355 bytes of the conclusion in `CondZQ/Main.lean`, from `  ∃ P : MvPolynomial` to `:= by`, equal the frozen file's (SHA-256 `5406ba3e…`).

**Files.** All new except three files from #5. I edited no file of yours.

| File | Lines |
| --- | ---: |
| `lean/CondZQ.lean` (root) | 15 |
| `lean/CondZQ/Basic.lean` (ℓ¹ norm, sums of squares) | 148 |
| `lean/CondZQ/Model.lean` (codes, ι, z, ε, r, `accept`, 𝒞, F, M_S, S_ht, H_6, S₀, Φ) | 103 |
| `lean/CondZQ/Cutoff.lean` (the catalogue, H_max, N_s, M₀, c\_\*, A_ht, T) | 371 |
| `lean/CondZQ/Hypotheses.lean` (the eight) | 128 |
| `lean/CondZQ/Bridge.lean` | 134 |
| `lean/CondZQ/Assembly.lean` | 438 |
| `lean/CondZQ/Main.lean` (the theorem) | 143 |
| `lean/CondZQ/LEDGER.md` | 56 |
| `lean/Checks/ConditionalStatement.lean` | 59 |

The three files changed from #5:
- `scripts/check_lean_contrib.py`: its four configuration lines.
- `lean/Checks/ContribAxioms.lean`: the `CondZQ` root and one `#print axioms` line.
- `lean/CONTRIB_EXPECTED.json` and `lean/CONTRIB.md`: the new facts and source hashes.

**Dependencies.**
- `CondZQ` imports four snapshot modules: `HeightConstantComparison`, `RationalSeparation`, `PolePolynomial` and `ExplicitCutoffBounds`. With their imports, nine snapshot modules are compiled.
- The snapshot declarations used are listed per row in the ledger.
- `CondZQ` also uses `EllipticModel.Curve` and `EllipticModel.InfiniteOrder` from #5, and explicit Mathlib imports.

**Reproduce.**
```sh
cd lean && lake exe cache get && cd ..
python scripts/check_lean_contrib.py --build
```
Expected output: `lean/CONTRIB_EXPECTED.json`, with 11 modules and 241 declarations audited, all on the three standard axioms.

**What I ran.** On a clean clone of this commit (`7663a196`), on an 8-vCPU Linux machine, with Lean 4.35.0 (`eb6cafb7`) and Mathlib v4.35.0 from the cache at your manifest's revisions:
- Your CI's Lean steps: `python scripts/check_lean.py` passes, and `python scripts/check_lean.py --build` passes (48 modules, 704 declarations).
- `python scripts/check_lean_contrib.py --build` passes (24 s).
- `leanchecker --verbose` and `leanchecker-paranoid --verbose` on the 11 new modules both accept.

**Planted wrong variants.** I ran eight planted wrong variants through the same script. Some checks are layered, so I re-ran those plants with the earlier layers switched off, to show the deeper check also refuses them. Each was refused where predicted, and the unmodified tree passed:
- **Conclusion weakened.** The degree bound 2↑↑7 is changed to 2↑↑8 under the theorem's name and proved from the real theorem, with standard axioms only. The byte comparison refuses it. With that off, the statement check refuses it twice: a `type_of%` type mismatch, and "the conclusion is not the frozen theorem's type".
- **A ninth hypothesis** `(hX : True)`. The source hash refuses it. With that off, the statement check refuses it.
- **The conclusion's bound variable `q` renamed `r`.** This is alpha-equivalent, so the `type_of%` check alone accepts it. The byte comparison refuses it. With that off, the syntactic `Expr.equal` check refuses it.
- **A lemma closed by `sorry`.** The lint refuses it. With the lint off, the compiler's "declaration uses `sorry`" warning refuses it. With that off too, the axiom audit refuses it (`sorryAx` in the main theorem).
- **A new `axiom`, used in a proof.** The lint refuses it. With the lint off, the axiom audit refuses it.
- **One byte appended to the frozen file.** `check_lean.py` and the frozen hash refuse it.
- **A comment appended to a snapshot module.** `check_lean.py` refuses it.
- **`HypH2` changed from N_s¹⁰ to N_s⁹.** The source hash refuses it. A changed hypothesis definition is caught by the pin, and by review of the diff to `CONTRIB_EXPECTED.json`, not by Lean.

They are not part of this PR, because I didn't see a Lean negative-test convention here. I'd be glad to add them as a `--self-test` mode if that helps the review.

**How this was made.** I wrote this with Claude agents in my claimbox repository (MIT) and adapted it with Claude's help to this repository's module system and layout. The adaptation:
- The nine-hypothesis form is gone: G is no longer a hypothesis, and #5's theorem is used instead.
- The files are `module` files with explicit imports.
- The docstrings and TeX lines were re-checked.

I ran every check above on a clean checkout. The files are MIT-licensed in claimbox, and you may relicense them with the rest of this repository.
