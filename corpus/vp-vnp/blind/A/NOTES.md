# Writer A: notes on BlindA.lean

Writer A, VP ≠ VNP lane, 2026-11-23. Tradition: straight-line programs (Bürgisser–Clausen–Shokrollahi
1997, Bürgisser 2000). The file has statements only and was written without a compiler. It is meant
to elaborate against Lean v4.33.1 and Mathlib `0df444a360eaa60ab8c11dca51a86af692955474`.

References, with the abbreviations used below:

- **BCS**: P. Bürgisser, M. Clausen, M. A. Shokrollahi, *Algebraic Complexity Theory*, Springer
  Grundlehren 315, 1997.
- **B00**: P. Bürgisser, *Completeness and Reduction in Algebraic Complexity Theory*, Springer
  Algorithms and Computation in Mathematics 7, 2000.
- **B04**: P. Bürgisser, "The complexity of factors of multivariate polynomials", *Found. Comput.
  Math.* 4 (2004). This is where VP-bar is introduced.
- **V79**: L. G. Valiant, "Completeness classes in algebra", STOC 1979. **V82**: Valiant,
  "Reducibility by algebraic projections", *L'Enseignement Math.* 1982.
- **MP08**: G. Malod, N. Portier, "Characterizing Valiant's algebraic complexity classes",
  *J. Complexity* 2008.
- **GMQ16**: J. Grochow, K. Mulmuley, Y. Qiao, "Boundaries of VP and VNP", ICALP 2016.
- **S73**: V. Strassen, "Vermeidung von Divisionen", *J. reine angew. Math.* 1973.

Unless a reference says otherwise, chapter and section pointers are **from memory**. I did not
recall definition numbers reliably, so I give none rather than guess.

---

## 1. Each definition and the textbook definition it follows

| Lean name | What it is | Source |
|---|---|---|
| `Op`, `Op.apply` | the operation symbols `+`, `−`, `×` (binary, no division) | BCS Ch. 4, §4.1 (from memory). BCS's Ω also has `/`, constants `λᶜ` and scalar multiplications `λ·`. Division is dropped because the claim is about polynomial ("arithmetic") circuits. Constants become free operands. A scalar multiplication becomes one `×` with a constant operand. |
| `Operand`, `Instr`, `SLP` | a straight-line program of length `ℓ`: instruction `r` is `(ω; a, b)`, where each of `a`, `b` is an input variable, a constant, or an index `j < r` | BCS §4.1 (from memory): Γ = (Γ₁,…,Γ_r), Γ_ρ = (ω_ρ; i₁,…), with indices pointing back into the input sequence or to earlier results. |
| `Operand.eval`, `Instr.eval`, `SLP.vals`, `SLP.result` | the result sequence `(b₀,…,b_{ℓ−1})` on given input values, in any `F`-algebra `R` | BCS §4.1 (from memory): the result sequence of Γ on input `a`. `SLP.vals` is the plain recursion "the first r+1 results are the first r results, then instruction r applied to them". |
| `SLP.computed` | everything `P` computes: the variables `X i`, the constants `C c`, and the results | BCS §4.1 (from memory): Γ computes F on input `a` when F lies in the set made of the input sequence and the result sequence. B00 Ch. 1–2 (from memory): computing "from the variables and constants of k". |
| `complexity F f` | `L_F(f)`, the **minimum** length of a program over `F` computing `f` | B00 Ch. 2 (from memory): "L(f), the total complexity: the minimal number of arithmetic operations +, −, × sufficient to compute f from the variables and constants by a straight-line program". It is a minimum, written `sInf` on `ℕ`. The set is never empty, since every polynomial is a sum of monomials. |
| `eps K` | `ε ∈ K((ε))`, the Hahn series `single 1 1` | standard. Mathlib's own `ofPowerSeries_X` says that `ofPowerSeries ℤ K PowerSeries.X = single 1 1`. |
| `Approximates K G f` | `G = f + ε·g` with `g ∈ K[[ε]][X]` | claim, item 3, word for word. Compare B04 and BCS Ch. 15 (approximative algorithms and border rank, from memory). |
| `approxComplexity K f` | `L̲_K(f)`, the minimum length of a program over `K((ε))` computing some `G` that approximates `f` | claim, item 3. B04 (from memory) defines approximative complexity the same way, over `k(ε)`; see §2.7. |
| `Family` | `f = (f_n)`, `f_n ∈ K[X_0,…,X_{v(n)−1}]` | B00 Ch. 2 (from memory) writes `f_n ∈ k[X_1,…,X_{v(n)}]`. I use 0-based `Fin (v n)`. |
| `PBounded` | `∃ q ∈ ℕ[T], ∀ n, t(n) ≤ q(n)` | B00 Ch. 2 (from memory): "t is p-bounded iff there is a polynomial p with t(n) ≤ p(n) for all n". |
| `IsPFamily` | `v(n)` and `deg f_n` (total degree) are p-bounded | B00 Ch. 2 (from memory). Also BCS Ch. 21 (from memory). |
| `VP K` | the p-families with `L_K(f_n)` p-bounded ("p-computable") | B00 Ch. 2 (from memory). BCS Ch. 21 (from memory). |
| `booleanSum v w g` | `Σ_{e∈{0,1}^w} g(X_0,…,X_{v−1}, e_0,…,e_{w−1})` | B00 Ch. 2 (from memory): the defining sum of p-definability. |
| `VNP K` | the p-families `f` for which some `w : ℕ → ℕ` and `g ∈ VP` with `v(n)+w(n)` variables give `f_n = booleanSum (g_n)` ("p-definable") | B00 Ch. 2 (from memory): f is p-definable iff there is a p-computable g with `f_n(X) = Σ_{e∈{0,1}^{u(n)−v(n)}} g_n(X, e)`. Also V79 and V82. |
| `VPbar K` | the p-families with `L̲_K(f_n)` p-bounded | claim, item 3 ("defined like VP, with approximating circuits in place of circuits"). Also B04 (from memory). |
| `perm K m` | `PERM_m = Σ_{π∈S_m} Π_i x_{i,π(i)}`, where `x_{i,j}` is `X (i, j)` | claim. Standard (V79; B00 Ch. 2–3; BCS Ch. 21). |
| `IsFullCycle`, `hc K m` | `HC_m`: the same sum restricted to the permutations made of one `m`-cycle, encoded as "any two points lie in the same cycle" | claim. Standard (V79; B00). |
| `permFamily`, `hcFamily` | `PERM` and `HC` as `Family` values (`n²` variables, renamed by `finProdFinEquiv`) | not used by the five propositions. They place PERM and HC among the objects the classes are made of. |
| `claimedBound c m` | `m^(c·(log₂ m)^(1/3))` in ℝ, using real powers and `Real.logb 2` | claim. |
| `MainTheorem` | `∃ c > 0, ∀ p (0 or prime), ∃ m₀, ∀ K : Type, [Field K] [CharP K p], ∀ m ≥ m₀`: `B < L_K(HC_m)`, and also `B < L_K(PERM_m)` when `p ≠ 2` | claim 1 |
| `MainTheoremApprox` | the same with `L̲_K` in place of `L_K`, and `c`, `m₀` quantified afresh | claim 3, last sentence |
| `Separation` | `∀ K : Type, [Field K], VP K ⊂ VNP K` (a strict subset: `⊆` and `⊉`) | claim 2 |
| `SeparationClosure` | `∀ K : Type, [Field K], ¬ (VNP K ⊆ VPbar K)` | claim 4 |
| `PermanentOverReal` | `∃ c > 0, ∃ m₀, ∀ m ≥ m₀, B < L_ℝ(PERM_m)` | claim 5 |

**Minimum or for-all.** The brief asks which my textbook uses. B00 defines complexity as a minimum,
`L(f)`, so the file says "every circuit for `f` has more than `B` gates" as `B < L(f)`. The
for-all form is

`∀ ℓ (P : SLP σ K ℓ), f ∈ P.computed → B < ℓ`

and it is equivalent to `B < L(f)` as soon as the set `{ℓ | ∃ P, f ∈ P.computed}` is nonempty. One
direction is `Nat.sInf_le`, the other `Nat.sInf_mem`. The set is nonempty for every polynomial, and
for every approximation problem too: run an exact program with its constants mapped into `K((ε))`.
A comparison proof therefore needs that one small lemma.

---

## 2. Choices where textbooks differ, and why

I chose to follow B00 and BCS everywhere. What follows is the list of alternatives. **The robustness
fact behind all of them**: suppose two size measures `s`, `s'` satisfy `s' ≤ A·(s + m²)^k + A` for
constants `A`, `k`, and suppose `s' > m^{c(log₂ m)^{1/3}}` for all `m ≥ m₀`. Then `s` exceeds
`m^{c'(log₂ m)^{1/3}}` for all large `m`, with `c' = c/(2k)`. This works because the bound grows
faster than any polynomial, so it swallows every polynomial change of size and every additive
`poly(m)`. Each of the five propositions puts `c` and `m₀` under `∃`. So each one is **provably
equivalent** across all the conventions below, though it is not definitionally the same statement.
A statement with a fixed numerical `c` would not survive these changes.

1. **What is counted.** I count the arithmetic instructions `+`, `−`, `×`, each costing 1. Inputs
   (variables and constants) are free. This is B00's total complexity, from memory.
   - BCS's total complexity also charges constants `λᶜ` and scalar multiplications `λ·` (from
     memory, unsure about constants). That gives `L ≤ L_BCS ≤ 3L`.
   - In the DAG tradition, "size" counts every node, input nodes included. That gives
     `L ≤ size ≤ 3L + m²`.
   - Counting edges gives `L ≤ edges ≤ 2L`.
2. **Fan-in.** I use binary operations. With unbounded fan-in gates in a simple DAG, `s` gates give
   at most `s·(s + m² + 1)` binary operations, so the change is polynomial.
3. **Subtraction.** I make it a primitive, as in BCS and B00. Without it, `a − b = a + (−1)·b`
   costs at most twice as much.
4. **Division.** I exclude it: the claim says "arithmetic circuit", and B00's VP is division-free.
   Over infinite fields, S73's division elimination costs a polynomial factor in the degree. Over
   finite fields, divisions would need an extension field. Either way this is irrelevant here.
5. **Constants.** I allow arbitrary constants of `K`, at no cost. Alternatives are constant-free
   circuits (`VP⁰`) and constants from the prime field only. Neither is what "over every field"
   means.
6. **"Computes".** I mean formal computation in `K[X]`, not computation of the polynomial
   function. Over finite fields these differ, and the claim speaks of polynomials.
7. **The field of approximation.** I take `K((ε))` with `g ∈ K[[ε]][X]`, as the claim says. B04
   (from memory) uses `k(ε)` with `F ∈ k[ε][X]`, and GMQ16 uses closures in the Zariski or
   Euclidean topology.
   - My unchecked argument that the choice does not change `L̲`: a program of length `ℓ` has formal
     degree at most `2^ℓ` in its constants. Truncating each Laurent constant high enough therefore
     keeps every coefficient of order `ε^{≤0}`. So `k((ε))`, `k(ε)` and `k[ε,ε⁻¹]` give the same
     `L̲`.
   - In any case `K((ε))` allows the most programs. That makes `MainTheoremApprox` and
     `SeparationClosure` the strongest of these versions.
   - No bound is put on the ε-degree. Bürgisser's variants with polynomially bounded ε-order define
     a possibly smaller class.
8. **p-bounded.** I use `∃ q ∈ ℕ[T]` (B00). This is equivalent to `∃ C d, t(n) ≤ C(n+1)^d` and to
   `t = n^{O(1)}`.
9. **VP.** I follow B00: a p-family, plus `L(f_n)` p-bounded, with no restriction on the degree of
   intermediate results.
   - Valiant and MP08 instead require polynomial *formal (syntactic) degree* of the circuit.
   - The two classes are equal over every field by gate-by-gate homogenization (S73; it costs
     `O(d²)` per gate and needs no interpolation, so it works in every characteristic).
   - The class without any degree bound, `VP_nb`, is different; it is not used.
10. **VNP.** I follow B00's p-definability: a Boolean sum, over the last `w(n)` variables, of a VP
    family.
    - Equivalent alternatives: (a) `g` in `VP_e` (formulas), since `VNP = VNP_e` (V82; B00 Ch. 2);
      (b) Valiant's criterion with `#P/poly` coefficient functions (V79; B00 Ch. 2);
      (c) p-projections of `HC` (completeness, V79).
    - The summation variables come **last**, through `Fin.append`. Any other placement is a free
      renaming.
    - `IsPFamily f` is stated explicitly in `VNP`. It already follows from `g ∈ VP`, but B00 phrases
      it as "a p-family is p-definable iff …".
11. **VP-bar.** It is defined as in the claim: B00's VP with `L̲` in place of `L`, the p-family
    condition kept. Alternatives: the closure of VP in GMQ16, and B04's `k(ε)` version.
12. **Variables of a family.** Families live in `MvPolynomial (Fin (v n)) K`. `PERM_n` and `HC_n`
    live in `MvPolynomial (Fin n × Fin n) K` for the bounds, and in `Fin (n·n)` through
    `finProdFinEquiv` for the family. Another bijection gives a different `Family` value, but
    renaming costs nothing, so membership in VP, VNP and VP-bar does not change.
13. **HC for small `m`.** `IsFullCycle` admits the identity when `m = 1` (`(1−1)! = 1`) and when
    `m = 0`. Mathlib's `Equiv.Perm.IsCycle` excludes the identity, so `IsCycle ∧ support = univ`
    would make `HC_1 = 0`. This only matters for `m < 2`, which `m ≥ m₀` makes irrelevant.
14. **Universes.** Fields range over `Type` (universe 0), as the brief allows. A universe-polymorphic
    version follows mathematically: a program uses finitely many constants, so it lives over a
    countable subfield of the same characteristic. It does not follow by `rfl`.

---

## 3. What I found ambiguous in the claim's English

- **What a "gate" is**, and what "has more than N gates" counts. Settled by §2.1–2.2: only the
  existential-`c` reading is convention-free.
- **Claim 3, "the main theorem holds for circuits that approximate…".** I read it as the whole of
  claim 1 with approximating circuits, and with its own `∃ c` and `∃ m₀`. The other reading keeps
  the same `c` as claim 1. That one is slightly stronger as a conjunction, but `L̲ ≤ L` means the
  approximate theorem with any `c` implies the exact one with that same `c`.
- **The dependence of `m₀`.** "For every p … there is m₀ … over every field of characteristic p":
  `m₀` depends on `p` only and is uniform over all fields of that characteristic. So `∃ m₀` comes
  before `∀ K`. `c` is absolute, so `∃ c` comes before `∀ p`.
- **One `m₀` for two bounds.** HC and PERM share `c` and `m₀` in one conjunction. Splitting them is
  equivalent (take the max of the `m₀`, the min of the `c`).
- **"p zero or prime".** It is stated as the hypothesis `p = 0 ∨ p.Prime`. This is redundant,
  because a field with `CharP K p` already forces it.
- **Claim 2.** "VP is a proper subset of VNP" is read as `⊂`: inclusion plus non-equality. The
  inclusion half is the classical easy direction (take `w = 0`).
- **The "computes" of claim 3.** "Computes a polynomial of the form f + εg" is read as: some value
  of the program, inputs included, has that form, as for exact computation.
- **Claim 5** is the case `p = 0`, `K = ℝ`, PERM of claim 1, with its own constants. It is stated
  separately as asked.
- **log₂ and the cube root** are real functions (`Real.logb 2`, `x ^ (1/3 : ℝ)`). For `m ≥ 1` the
  base is ≥ 0, so the real power is unambiguous.

---

## 4. Mathlib names: what I checked and what I am least sure of

I checked these in the source at the pinned commit: `HahnSeries.single` (a `ZeroHom R R⟦Γ⟧`),
`HahnSeries.ofPowerSeries` (explicit `Γ R`, a `PowerSeries R →+* R⟦Γ⟧`), `LaurentSeries` (an
`abbrev` for `R⟦ℤ⟧`), `HahnSeries.instField`, the instance `Algebra R A⟦Γ⟧`,
`Equiv.Perm.SameCycle` (`∃ i : ℤ, (f ^ i) x = y`), `Fin.append`, `finProdFinEquiv` (root namespace,
implicit `m n`), `Real.logb`, `MvPolynomial.{C, X, map, aeval, rename, totalDegree}` (implicit `R`
named `R`), `Polynomial.eval`, `CharP` (with `outParam`), `Equiv.instFintype`, and the notation
`∑ x ∈ s, f x`.

**Least sure:**

1. Whether instance search finds `Field`, `CommRing` and `Algebra K` for `LaurentSeries K` through
   the `abbrev`, and whether the `MvPolynomial σ (LaurentSeries K)` and
   `MvPolynomial σ (HahnSeries ℤ K)` types in `Approximates` unify, including their
   `CommSemiring` instance arguments.
2. `HahnSeries.single (1 : ℤ) (1 : K)` elaborating as a `ZeroHom` applied through `FunLike`, with
   expected type `LaurentSeries K`.
3. The structural recursion in `SLP.vals`: `have hr : r < ℓ := h` relies on `r + 1 ≤ ℓ` and `r < ℓ`
   being defeq. I also use the core lemmas `Fin.elim0`, `Nat.le_of_lt` and `Nat.le_refl`, which I
   could not check, because core Lean was outside what I was allowed to read.
4. `open Classical in` giving the `DecidablePred` for `Finset.filter` in `hc`.
5. The binder `∑ e : (Fin w → Bool), …`, and `if e j = true then … else …`.
6. `Family.mk (fun n => …) g` checking `g` against a type that only matches after beta reduction.
7. The named arguments `MvPolynomial.aeval (R := K)`, `MvPolynomial.rename (R := K)` and
   `SLP.result (R := …)`.

---

## 5. Sources consulted, and independence

- **Read:** the brief `corpus/vp-vnp/prompts/blind-writer.md`.
- **Mathlib source files at commit `0df444a360eaa60ab8c11dca51a86af692955474`.** I fetched them with
  curl from `https://github.com/leanprover-community/mathlib4/raw/<commit>/Mathlib/<path>.lean`,
  which redirects to raw.githubusercontent.com:
  - `RingTheory/HahnSeries/{Basic, PowerSeries, Multiplication, Summable}`
  - `RingTheory/LaurentSeries`
  - `Data/Fin/Tuple/Basic`, `Logic/Equiv/Fin/Basic`
  - `GroupTheory/Perm/Cycle/Basic`
  - `Analysis/SpecialFunctions/Log/Base`
  - `Algebra/MvPolynomial/{Basic, Degrees, Rename, Eval}`, `Algebra/CharP/Defs`
  - `Algebra/BigOperators/Group/Finset/Defs`, `Data/Fintype/Perm`, `Algebra/Polynomial/Eval/Defs`
- **Not opened:** nothing else of Lean, nothing from github.com/anthropics/formal-math, the paper, or
  any discussion of it.
- **Seen in passing (names only, no contents):** the session's automatic git-status snapshot listed
  the untracked directory `corpus/vp-vnp/`. A `ls` of `notes/vp-vnp-blind-2026-11-23/`, run to check
  my own folder, showed the folder names `A`, `B` and `reader`. I opened nothing in `B` or `reader`.
  Nothing in `notes/vp-vnp-2026-11-23/` was touched.

I did not see the claimant's Lean statement
