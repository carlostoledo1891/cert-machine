**What this proves.** `EllipticModel.P0_addOrderOf : addOrderOf P0 = 0`, also stated as `EllipticModel.P0_not_isOfFinAddOrder : ¬ IsOfFinAddOrder P0`. This is the first clause of `prop:generator` in the November 5 manuscript. The point P₀ = ((1641 − 1160s)/8, (−123720 + 87483s)/32) has infinite order on E : y² = x³ − d²x, d = 75 − 53s, over K₀ = ℚ(s), s² = 2. It takes no hypothesis. Both theorems depend only on `propext`, `Classical.choice` and `Quot.sound`.

**What it does not prove.** It does not prove the second clause of `prop:generator` (2E(K₀) = ℤP₀). It proves nothing about the main theorem or the frozen target. Nothing in the accepted snapshot changes.

This is the separate infinite-order PR you asked for in #3, so you can review and integrate it on its own. The conditional theorem follows in a stacked PR.

**The statement to review.** `lean/EllipticModel/Curve.lean` holds the definitions, transcribed from TeX 254–262 of `diophantine_zq.tex` at `97cec7fd`. Current `main` keeps the same bytes as `docs/theorem-application-audit/source/audited-baseline.tex`.
- `K0` is Mathlib's `QuadraticAlgebra ℚ 2 0`, a field since 2 is not a square in ℚ. `⟨x₀, x₁⟩` is x₀ + x₁s.
- `dco = ⟨75, −53⟩`.
- `E` is the `WeierstrassCurve` with a₄ = −d² and its other coefficients 0. Its points carry Mathlib's group law.
- `P0x = ⟨1641/8, −145⟩` and `P0y = ⟨−15465/4, 87483/32⟩`, with `P0_equation` and `P0_nonsingular` proved.

**The proof** (`lean/EllipticModel/InfiniteOrder.lean`) is 2-adic. The manuscript's argument (reduction at (17, s − 6) and (23, s − 5) with torsion injection, TeX 293–295) needs results Mathlib v4.35.0 lacks. The dyadic step from the proof of `prop:cutoff` (TeX 6335–6338) is enough:
- μ(z) = |N(z)|₂ is multiplicative on ℚ(s) and ultrametric, since μ(z) = max(|z₀|₂², |z₁|₂²/2).
- μ(−d²) = 1 and μ(4) = 1/16.
- Mathlib's duplication formula then gives μ(x(2Q)) = 16·μ(x(Q)) whenever μ(x(Q)) > 1.
- μ(x(P₀)) = |1681/64|₂ = 64.

So the points 2^k·P₀ are pairwise distinct, and a point of finite order cannot have that property.

**Files.** All seven are new. I edited no file of yours.

| File | Lines | Contents |
| --- | ---: | --- |
| `lean/EllipticModel.lean` | 10 | the library root |
| `lean/EllipticModel/Curve.lean` | 77 | the definitions above |
| `lean/EllipticModel/InfiniteOrder.lean` | 255 | the proof |
| `lean/Checks/ContribAxioms.lean` | 35 | the axiom audit of the new modules, modelled on `Checks/Axioms.lean` |
| `scripts/check_lean_contrib.py` | 220 | the build and check script |
| `lean/CONTRIB_EXPECTED.json` | 40 | the script's expected output |
| `lean/CONTRIB.md` | 21 | how to run it |

All are `module` files with explicit Mathlib imports. `lakefile.toml` is pinned in `SOURCE_MANIFEST.json`, so a `lean_lib` entry would make `scripts/check_lean.py` fail; I left both files alone. Instead, the script builds the library the way `check_lean.py --build` builds the snapshot: one `lean -j1 -Ddebug.skipKernelTC=false` per module, into a new output directory, against the pinned dependency libraries. If you want `lake build EllipticModel` to work, the change is `[[lean_lib]] name = "EllipticModel"` plus the manifest hash, and I've left that to you. I tried it, and it builds.

**Reproduce.**
```sh
cd lean && lake exe cache get && cd ..
python scripts/check_lean_contrib.py --build
```
The script runs in this order:
1. `scripts/check_lean.py`, which must pass.
2. A check that the frozen target's SHA-256 is still `0889579a…`.
3. A lint of the new files: a `module` header, and no `sorry`, `admit`, `axiom`, `unsafe`, `native_decide`, `implemented_by` or `opaque`.
4. A check of their SHA-256 against `CONTRIB_EXPECTED.json`.
5. The compile.
6. `Checks/ContribAxioms.lean`, which fails on any declaration of a new module whose axioms leave `propext`, `Quot.sound` and `Classical.choice`, and prints `#print axioms` for the two theorems.

The printed facts must then equal `CONTRIB_EXPECTED.json`: 3 modules, 35 declarations audited, and the three standard axioms for both theorems. Without `--build`, it runs only steps 1–4 and needs no Lean.

**What I ran.** On a clean clone of this commit (`6cf3c1d6`), on an 8-vCPU Linux machine: Lean 4.35.0 (`eb6cafb7`) from elan 4.2.4, and Mathlib v4.35.0 from `lake exe cache get` with every dependency at your manifest's revision.
- Your CI's Lean steps: `python scripts/check_lean.py` passes. `python scripts/check_lean.py --build` passes with 48 modules freshly compiled and 704 declarations axiom-checked (58 s).
- `python scripts/check_lean_contrib.py --build` passes (7 s).
- `leanchecker --verbose` and `leanchecker-paranoid --verbose` on the three new modules both accept.

**How this was made.** I wrote this with Claude agents in my claimbox repository (MIT) and adapted it to this repository's module system and layout with Claude's help. I ran the checks above on a clean checkout. The files are MIT-licensed in claimbox, and you may relicense them with the rest of this repository.
