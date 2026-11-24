# Adversarial statement reader: VP ≠ VNP lane (PREREG row F5)

Written 2026-11-24 00:18 UTC (`date -u`) by a Claude agent, following `corpus/vp-vnp/prompts/adversarial-reader.md`.

**Inputs.** `notes/vp-vnp-2026-11-23/src/vp-vnp/` (called `src/` below). I read it and did not edit it. The sha256 sums
of Statement.lean, Challenge.lean, Solution.lean, comparator.json, lean-toolchain, lake-manifest.json and paper.pdf
match the PREREG table (COMPUTED: `shasum -a 256`). I did not open the blind writers' folders. I did not build or run
Lean: this project has no toolchain on this machine, and no Mathlib source tree exists anywhere on it (COMPUTED: `find`).
So every claim below about what a Mathlib constant means is either REASONED (from Mathlib as I know it) or SOURCED from
how the release itself uses that constant, and each one comes with a Lean test.

**Outside reading (definitions only).** I fetched Saptharishi, *A survey of lower bounds in arithmetic circuit
complexity*, v9.0.3, from https://github.com/dasarpmar/lowerbounds-survey/releases/download/v9.0.3/main.pdf
(sha256 a7b922ea3747af6f8939ec3378ad90367ebca4f69f5f7ffe3fe4c86d7a91f470). I also fetched Shpilka–Yehudayoff,
*Arithmetic circuits: a survey of recent results and open questions* (2010), from
https://www.cs.tau.ac.il/~shpilka/publications/SY10.pdf (sha256 68e88d3878c19d38d26f1f1e91e632d0cb4f4bbc758da5265cded23c6880e4b2).
I did **not** read BCS97, Bürgisser 2000, Bürgisser 2004 or Valiant 1979/1982: none of them is on this machine.
Where I compare against them I am working from memory, and row 42 records this as UNSURE.

**Result.** 42 rows: **0 MATERIAL, 1 UNSURE, 41 IMMATERIAL.** I found no place where the Lean could be true while the
English claim is false, or where the Lean is vacuous or weaker. The one UNSURE row is about my sources, not the Lean:
I could not check the exact wording of the four books and papers named above. Some IMMATERIAL ratings rest on Mathlib
facts I could not read at the pinned commit (rows 10, 12–13, 19, 34, 41). The release uses each of those facts in a
way that only works under my reading, but each still needs its one-line Lean test (section C) before it counts as
checked.

---

## A. The table

Lean lines refer to `src/Statement.lean` unless another file is named. Ratings: M = MATERIAL, I = IMMATERIAL, U = UNSURE.
The last column names the Lean tests of section C.

| # | item | Lean line | difference (Lean vs paper / textbook) | rating | proposed test | basis |
|---|---|---|---|---|---|---|
| 1 | `Computes`: what counts as a gate | 23–27 | Lean counts variables and constants as gates, as paper §1.3 does (p.3–4). SY10 Def 1.1 counts **edges** with fan-in 2. BCS97/Bürgisser count **operations**, with inputs free (from memory). So the Lean size is at least the textbook size, and at most 3/2·(SY10 size)+1 or 5·(op count)+1. With ∃c this only changes c. | I | T4 | SOURCED (SY10 p.2; paper p.3–4) + REASONED |
| 2 | `Computes`: the gate types | 25–26 | Gates are only +, × (binary), variable and constant. There is no −, no λ·, no division, and no unbounded-fan-in linear-combination gate (Saptharishi Def 2.1). Each of these costs at most 2 extra gates per operation, or O(N²) for unbounded fan-in with N nodes, so the classes and the ∃c bounds are unchanged. All four sources define VP without division. | I | T4 | SOURCED (Saptharishi p.19, SY10 p.2) + REASONED |
| 3 | `Computes`: reuse | 26 | Any earlier entry can be read any number of times, and `i = j` is allowed. These are circuits, not formulas, matching §1.3 and SY10. | I | T2 | SOURCED (L26) |
| 4 | `Computes`: cancellation, structure | 25–27 | Gates are elements of `MvPolynomial` compared by `=`. Nothing restricts depth, degree, homogeneity, multilinearity or sign, matching paper p.3 ("no restriction on their depth, on their constants or on cancellations"). | I | T3 (+ T2) | SOURCED |
| 5 | `Computes`: constants | 25 | `C a` for any `a : R`, one gate each, with no restriction on size. This matches SY10 ("field element from F") and Valiant/Bürgisser (constants from k). | I | none needed (reading); T3 | SOURCED |
| 6 | `Computes`: "at most s" | 24–27 | `f` is any one of the first `s` entries, and entries `≥ s` are free. Computes is monotone in `s`, so "∀ s, Computes f s → B < s" means "the smallest circuit has more than B gates". | I | T1 | REASONED (Nc proves monotonicity for the same body, Nc/Final/CClasses.lean:59) |
| 7 | `Computes`: universes | 23 | `R : Type u`, `V : Type`. Variable sets live in universe 0, which is enough since every finite variable set is equivalent to a `Fin k`. | I | T23 | REASONED |
| 8 | `perm`: transposed variables | 30–31 | Lean writes ∏ᵢ x_{σ(i),i} where paper §1 has x_{i,σ(i)}. Reindexing by σ⁻¹ gives the **same** polynomial, not just its transpose. Appendix Q.3 (p.68) discloses this. | I | T5 | REASONED + SOURCED (Q.3) |
| 9 | `perm`, `hc`: small m | 30–36 | Indices run from 0; perm 0 = hc 0 = 1 and hc 1 = x₀₀. This matters only below m₀, which is existential. | I | T6, T7 | REASONED |
| 10 | `hc`: which permutations | 35–36 | `σ.IsCycleOn Set.univ` means one orbit through all points. For m ≥ 2 that is exactly the (m−1)! m-cycles, as on paper p.1. The release proves that the same sum equals the sum over cyclic orders starting at vertex 0 (Nc/Hc/Vnp.lean:51–90, for `genHC`, whose body is the same expression). | I | T6, T21 | SOURCED by use + REASONED |
| 11 | `hc`: `open Classical` | 33 | The decidability instance of the filter has no effect on the value: filter and univ are independent of instances. | I | T21 (`hc = genHC` by `rfl`) | REASONED |
| 12 | `Beyond`: form of the bound | 39 | Real power (rpow), log = `Real.logb 2` (paper: log = log₂), and the exponent `(1/3 : ℝ)` is a real, not ℕ-division. It parses as c·(log₂ m)^{1/3}. It equals 2^{c(log₂ m)^{4/3}} for m ≥ 2, which the release proves (`Paper.thm_main_form`, Paper/Rate.lean:518). | I | T7 | SOURCED (L39; Rate.lean:518) |
| 13 | `Beyond`: m = 0, 1 | 39 | logb 2 0 = logb 2 1 = 0, so the exponent is 0 and the bound is 1: `Beyond c m s ↔ 1 < s`. This is harmless because m₀ is existential, and the release's own m₀ is ≥ 2 (Fields.lean:102). | I | T7 | REASONED (Mathlib conventions log 0 = 0, 0^x = 0 for x ≠ 0, x^0 = 1) |
| 14 | `Beyond`: strict `<` | 39 | `<` reads as "more than gates", as in Thm 1.1. | I | none needed | SOURCED |
| 15 | `MainTheorem`: quantifier order | 45 | ∃c>0 ∀p ∃m₀ ∀F ∀m≥m₀ ∀s, exactly Thm 1.1 / M.3 (p.2, p.61): c is absolute (independent of p, F and the polynomial), and m₀ depends on p only and is uniform over all fields of char p. | I | none needed; T10 (instance) | SOURCED |
| 16 | `MainTheorem`: `∀ p : ℕ` | 45 | The paper says "p, zero or prime". For any other p, no field has `CharP F p`, so the clause is vacuous; Solution handles it with m₀ = 0 (Solution.lean:31). | I | T8 | SOURCED |
| 17 | `MainTheorem`: universes | 41–46 | It is one proposition per universe u, so formally m₀ could depend on u. A circuit's constants generate a countable subfield, so the universe-0 instance transfers with the **same** m₀. Q.3 says the Solution theorems hold in every universe. | I | T9 | REASONED + SOURCED (Q.3, p.66) |
| 18 | `MainTheorem`: content | 45–46 | `0 < c` is present. Without it, c = 0 makes the statement trivial. The hypothesis `Computes (hc F m) s` is satisfiable, so the bound is not vacuous. | I | T3, T11 | REASONED |
| 19 | `Approximates`: k((ε)) and `.coeff` | 53–55 | `LaurentSeries F` is Mathlib's `HahnSeries ℤ F`, and `.coeff i` is the coefficient of ε^i. The release rewrites this same expression with `HahnSeries.coeff_add` (Nc/Rate/Truncate.lean:247), so `.coeff` is the HahnSeries field. | I | T14 | SOURCED by use + REASONED |
| 20 | `Approximates`: the i ≤ 0 condition | 55 | i < 0 → 0 and i = 0 → coeff of f is equivalent to q ∈ f + ε·k[[ε]][x], which is Def 1.3 / N.1 (p.2, p.62) word for word. The release restates it as `Paper.def_approx` (Approximate.lean:28). | I | T13 | SOURCED + REASONED |
| 21 | `Approximates`: constants of the circuit | 54 | Constants may be any Laurent series, with infinite tails and negative powers. The textbook border notions are circuits over k(ε) or k[ε,ε⁻¹] with output in k[ε][x] (from memory), or over ℂ the Euclidean/Zariski closure (Alder). Each of these embeds in the Lean notion, so the Lean approximation is the **more permissive** one and the Lean lower bound is stronger. The release also proves that Laurent-series constants reduce to Laurent-polynomial constants (Nc/Rate/Truncate.lean:241, :251). | I (Lean stronger) | T15 | REASONED + SOURCED (Truncate.lean) |
| 22 | `Approximates`: no other bounds | 53–55 | There is no bound on the x-degree of q or on the ε-orders of the constants. This again makes the notion more permissive and the theorem stronger. | I | none needed | SOURCED |
| 23 | `Approximates` vs `Computes` | 53–55 | The release has no lemma that an exact circuit is an approximating one (COMPUTED: grep). Mathematically it is immediate, and it is what makes MainTheoremApprox contain MainTheorem. | I | T12 | COMPUTED + REASONED |
| 24 | `MainTheoremApprox`: its own c | 58–60 | Thm 1.4 says "Theorem 1.1 holds for approximating circuits" and the docstring says "the same bound". The Lean has a fresh ∃c, but by T12 that one c also serves exact circuits, so nothing is lost. | I | T12 + T7 (monotone in c) | REASONED |
| 25 | `Family` | 65–73 | Variables have type `vars n : Type` with `Fintype`. The count is the ambient variable count, and a polynomial is required for every n. SY10 says "the number of variables in f_n". Any finite variable type can be renamed to `Fin k`. | I | T23, T18(ii) | REASONED |
| 26 | `VP`: the n^a + a bounds | 76–78 | One a bounds variables, degree and size for every n, which is equivalent to SY10 Def 1.2's "polynomial t(n)". | I | T17 | SOURCED (SY10 p.3) + REASONED |
| 27 | `VP`: other details | 76–78 | No bound on the degree of intermediate gates, exactly as SY10 ("we do not require the circuit … to have a polynomial degree"). VP is defined over commutative semirings (Q.3, p.68 discloses this) but is used only over fields. | I | none needed | SOURCED |
| 28 | `VP`/`VNP`: indexing | 76–90 | Saptharishi (Def 1.1, 3.1) indexes by the number of variables; Lean, SY10 and Bürgisser index by n with a polynomially bounded variable count. A family's VNP∖VP membership survives padding and reindexing. | I | T18(ii) | SOURCED (Saptharishi pp.12, 25) + REASONED |
| 29 | `VPBar`: the degree bound | 81–83 | The degree and variable bounds on f are kept, which makes VPBar smaller and so `¬ VNP ⊆ VPBar` a priori weaker. But every VNP family already has polynomially bounded variables and degree, so `VNP ⊆ VPBar ↔ VNP ⊆ VPBar-without-bounds`. | I | T16 | REASONED |
| 30 | `VNP`: shape | 87–90 | f n = Σ_{e∈{0,1}^{r n}} g n (x, e) with g ∈ VP, matching SY10 Def 1.3 and Saptharishi Def 3.2. SY10 indexes the witness as g_{t(n)}, which is the same up to a polynomially bounded reindexing. | I | T18(i) | SOURCED |
| 31 | `VNP`: the 0/1 substitution | 90 | `aeval (Sum.elim X (if e i then 1 else 0))` keeps x as x and puts the field elements 1 and 0 for the bits. | I | none needed (reading); T20 uses it | SOURCED |
| 32 | `VNP`: kind of equality | 90 | Equality is of formal polynomials, not functions. This matches SY10 p.3's explicit remark and is the strong reading over finite fields. | I | none needed | SOURCED |
| 33 | `VNP`: number of bits r | 88–89 | r is bounded only implicitly: card(f.vars n ⊕ Fin (r n)) ≤ n^a + a forces r n ≤ n^a + a, as the textbook requires. | I | none needed | REASONED |
| 34 | `Separation`: strictness of ⊂ | 93 | `⊂` on `Set` means ⊆ ∧ ¬⊇, so this says "proper subset". The release proves it with an anonymous pair ⟨⊆, ¬⊇⟩ (Fields.lean:143). | I | T19 | SOURCED by use + REASONED |
| 35 | `Separation`: what it needs | 93 | It does **not** follow from MainTheorem alone. It also needs VP ⊆ VNP (`Paper.vp_subset_vnp`, Rate.lean:491), HC ∈ VNP over every field (`Paper.hc_mem_VNP`, Fields.lean:131, from Nc/Hc/Vnp.lean:189, :221), and "superpolynomial ⇒ not in VP" (`Paper.exists_beyond_poly`, Fields.lean:113). All three are proved in the release: grep finds no `sorry`, `admit` or `axiom` outside Challenge.lean (COMPUTED). The statement itself does not mention HC. | I | T20; `#print axioms` (= K0) | SOURCED + COMPUTED |
| 36 | `Separation`: which family | 93 | Cor 1.2's text cites both PERM and HC as in VNP. The Lean route uses only HC. PERM ∈ VNP is proved only for fields in `Type` (Paper/Ryser.lean:95) and is used only over ℝ (Cor L.3). | I | none needed | SOURCED |
| 37 | `SeparationClosure` | 96 | `¬ VNP ⊆ VPBar` is "VNP ⊄ VP̄" (Thm 1.4, N.5) exactly. The route is `Paper.thm_approx.2` with `hc_mem_VNP` (Approximate.lean:268–301). | I | T20 | SOURCED |
| 38 | `permanent_over_real` | Challenge.lean:29–30 | This is Thm L.1 (p.59) exactly. It is stated in Challenge.lean, not Statement.lean, which holds **four** propositions, not five. It is the instance p = 0, F = ℝ of MainTheorem.{0}. | I | T10 | SOURCED |
| 39 | Printed file vs pinned file | paper pp.11–12 | The Statement.lean printed in §3 matches the pinned file token for token (1012 tokens each). The only differences come from the PDF glyph mapping: the extraction prints both ℝ and the ring variable `R` as "R". | I | none needed | COMPUTED (difflib, scratchpad `cmp_stmt.py`) |
| 40 | Hidden characters | all | There are no homoglyph identifiers, zero-width characters, tabs or CRs in Statement, Challenge or Solution. The only non-ASCII letters are σ and ε (in comments) and ℕ, ℝ, ℤ. | I | none needed | COMPUTED (`chars.py`) |
| 41 | `Solution.toNc`, `ofNc` | Solution.lean:20–23, 35–36, 48 | These are plain `def`s building structure literals. The type ascriptions in Solution.lean need `f ∈ Statement.VP F` and `toNc f ∈ Nc.VP F` to be definitionally equal, and likewise for VNP and VPBar, `hc ≡ genHC` and `perm ≡ genPerm`. The bodies agree (Nc/Final/CClasses.lean:36, :48; Nc/Rate/Defs.lean:26, :33; Nc/PermValiant.lean:60), so this holds if the build passes. It has **no bearing on meaning**: Comparator fixes the five types to Statement's. | I | T21 (needs the build: K0) | SOURCED + REASONED |
| 42 | Textbook wording not read | — | I could not compare against the exact definitions of BCS97 (straight-line programs, total and nonscalar complexity, approximative complexity), Bürgisser 2000 (p-families, p-definable), Bürgisser 2004 (border complexity, VP̄) or Valiant 1979/1982. From memory they all agree with rows 1–2, 21, 26, 30 up to polynomial factors, but **I don't know** their exact wording. | **U** | T22 (the F2 bridge from writer A's Bürgisser-style file) + T4, T15, T17 | — |

---

## B. Reasoning, definition by definition

### B.1 `Computes f s` (L20–27)

**What it says.** Some function `l : ℕ → MvPolynomial V R` has each of its first `s` entries equal to a variable `X v`,
a constant `C a`, or the sum or product of two earlier entries (repeats allowed), and `f` is one of those first `s`
entries (SOURCED, L24–27).

**Paper.** §1.3 (p.3–4): "a finite list of polynomials over R, each of which is a variable, a constant from R, or the
sum or the product of two earlier entries of the list, which may be the same entry … The size of the circuit is the
length of the list, so that variables and constants are counted as gates." Lean says the same thing (SOURCED).

**Textbooks.**
- SY10 Def 1.1 (p.2), SOURCED: a DAG whose in-degree-0 gates are variables or field elements; other gates are + or ×
  with in-degree 2; "The size of Φ, denoted |Φ|, is the number of edges in Φ."
- Saptharishi Def 2.1 (p.19), SOURCED: a DAG with sources labelled by variables or field constants and internal nodes
  + or ×; "edges entering a + nodes also might have field constants on them to allow the + to compute an F-linear
  combination". Def 2.1 gives no formal size; elsewhere the survey counts edges (Ch. 6, p.51, "the number of edges").
- BCS97 and Bürgisser 2000, from memory and not checked here: straight-line programs over k with +, −, × (and
  scalar multiplication), inputs and constants free, size = number of operations.

**Differences (rows 1–7).** All of them come down to one size comparison. Take a circuit in any of these models.
Remove unused gates. Each operation reads at most two inputs, so the number of input gates is at most twice the number
of operations plus one (REASONED). Simulating − as a + (−1)·b, and λ·a as C λ · a, costs at most 2 Lean gates per
operation. So:

- s_Lean ≤ 5·L_ops + 1 (operation count with −, λ·);
- s_Lean ≤ (3/2)·|Φ|_SY10 + 1 (edges, fan-in 2);
- s_Lean ≤ 3E + N ≤ 3N² + N (Saptharishi's unbounded fan-in with N nodes and E edges);
- conversely, each textbook size is at most a constant times s_Lean.

The sizes are polynomially related, so VP is the same class under every model. For the bound: if s_Lean > B(m) with
B(m) = m^{c(log₂ m)^{1/3}}, then L_ops > (B(m) − 1)/5 ≥ m^{(c/2)(log₂ m)^{1/3}} for all large m. That is the English
statement with c/2, and the m₀ grows by an amount that depends on neither p nor F (REASONED). Since the English
asserts only ∃c, this is IMMATERIAL. One more case, which the paper does not claim: Ostrowski's nonscalar complexity
L* gives s_Lean = O((L* + m²)²) for PERM_m, so even L* is bounded below by m^{(c/3)(log m)^{1/3}} for large m (REASONED).

Reuse (row 3) holds: the read indices `i, j < k` are arbitrary, so one entry can be read many times. These are
circuits, not formulas. Test T2: X^{2^k} has k+1 gates, while a formula would need 2^k leaves.

Cancellation and structure (row 4): gates are formal polynomials compared by `=`, and nothing constrains degree,
homogeneity, multilinearity, depth or sign (SOURCED: L25–26 have no further conjunct).

Constants (row 5): any `a : R`, one gate each, with no restriction on size (SOURCED).

"At most s" (row 6): monotone in s (REASONED; the same body is proved monotone as `Nc.Computes.mono`,
Nc/Final/CClasses.lean:59).

Division (row 2): no division gate. VP is division-free in SY10 and Saptharishi (SOURCED), and as I remember it, in
Valiant/Bürgisser too. Paper p.2 mentions bounds for circuits *with* division only as related work and claims none.

### B.2 `perm F m` (L29–31)

**What it says.** Σ_{σ ∈ Sym(Fin m)} ∏ᵢ X(σ i, i).

**Paper.** PERM_m = Σ_σ ∏ᵢ x_{i,σ(i)} (p.1).

**Difference (row 8).** Substitute i = σ⁻¹ j, then sum over τ = σ⁻¹. The result is Σ_τ ∏_j x_{j,τ(j)}, the same
polynomial, not merely its transpose (REASONED). Appendix Q.3 (p.68) says so too. Even a true transpose would be
harmless, because renaming variables preserves circuit size (`Computes.rename`). The Lean form is Mathlib's
`Matrix.permanent` convention (∏ M (σ i) i), and it is what makes `perm ≡ genPerm` definitional
(Nc/PermValiant.lean:60). Test T5.

### B.3 `hc F m` (L33–36)

**What it says.** The sum of ∏ᵢ X(i, σ i) over the permutations that are a cycle on all of `Fin m`.

**Paper.** "the second sum runs over the (m−1)! cyclic permutations in S_m" (p.1), with x_{i,σ(i)}. The orientation
matches the paper exactly, and it does not matter anyway, since inverting σ maps m-cycles to m-cycles.

**Meaning of `IsCycleOn Set.univ`.** REASONED: in Mathlib it is `Set.BijOn σ s s ∧ ∀ x ∈ s, ∀ y ∈ s, σ.SameCycle x y`.
SOURCED by use: the release builds such proofs as `⟨Set.bijOn_univ.2 …, fun u _ v _ => …⟩` (Nc/Hc/Vnp.lean:41–48,
:196). For m ≥ 2 this means exactly the m-cycles. For m = 1 it is the identity, so HC₁ = x₀₀ and the (m−1)! = 1 count
still holds. For m = 0 the empty product gives HC₀ = 1, which Q.3 discloses for Proposition M.2.

The release proves `hcSum M = Σ_{π, π 0 = 0} ∏ᵢ M (π i) (π (i+1 mod m))` (`Nc.Hc.sum_cycles_eq_sum_orders`,
Nc/Hc/Vnp.lean:51–90). That is a bijection between the summation set and the cyclic orders that start at vertex 0, of
which there are (m−1)! (SOURCED). It is stated for `genHC`/`hcSum`, whose body is the same text as Statement's `hc`
(Nc/Rate/Defs.lean:33–34). Rows 9–11: IMMATERIAL. Tests T6, T21.

### B.4 `Beyond c m s` (L38–39)

**What it says.** (m:ℝ)^(c·(logb 2 m)^(1/3)) < s, with a real exponent.

**Parse.** `Real.logb 2 m ^ (1/3 : ℝ)` is `(logb 2 m)^(1/3)`, because application binds tighter than `^`, and `^` (75)
binds tighter than `*` (70) (REASONED). The release's identity m^{c(log m)^{1/3}} = 2^{c(log m)^{4/3}}
(`Paper.thm_main_form`, Rate.lean:518) is proved by `Real.rpow_add` on the base `logb 2 m`, which only works under this
parse (SOURCED). This matches the abstract's 2^{Ω((log m)^{4/3})}, with log = log₂ (p.2, "Here and throughout, log =
log₂"). The `1/3` is typed `ℝ`. A slip to `(1/3 : ℕ)` would have given the polynomial bound m^c; PREREG control C1
(1/3 → 1/2) tests that Comparator refuses such a change.

**Edge cases (row 13).** Mathlib has log 0 = 0, so logb 2 0 = 0 and logb 2 1 = 0. Then 0^(1/3) = 0 for a nonzero real
exponent and x^0 = 1, so `Beyond c 0 s ↔ 1 < s` and `Beyond c 1 s ↔ 1 < s` (REASONED). This never matters: the claims
are for m ≥ m₀ with m₀ existential, and the release takes m₀ = M₁ + M₂ + 2 ≥ 2 (Fields.lean:102). log₂ of m between 1
and 2 cannot occur, since m is a natural number. For m ≥ 2, logb 2 m ≥ 1 > 0, so the rpow is the ordinary one.

**Context, not a difference.** The release's witness is c = 1/1600² (Fields.lean:87). With it the bound exceeds the
trivial m² only when log₂ m > (2·1600²)³ ≈ 1.34·10²⁰, and at m = 2⁶⁴ the bound is 2^{0.0001} (COMPUTED, python). The
English, like the Lean, says only ∃c. This belongs in "what the theorem does not say" (PREREG Phase 4/NC), not here.

### B.5 `MainTheorem` (L41–46)

**What it says.** There is a c > 0 such that for every natural p there is an m₀ such that, for every field F in
universe u of characteristic p, every m ≥ m₀ and every s: if HC_m has a circuit with ≤ s gates then
s > m^{c(log₂ m)^{1/3}}, and the same for PERM_m when p ≠ 2.

**Paper.** Thm 1.1 (p.2) = Thm M.3 (p.61), same order: "absolute constant c > 0 such that for every p, zero or prime,
there is m₀ … Over every field of characteristic p and for every m ≥ m₀, every circuit for HC_m, and every circuit
for PERM_m if p ≠ 2, has more than … gates." (SOURCED.)

- Quantifier order (row 15): c is chosen before p, m₀ before F, and one c serves both polynomials. This is the same as
  the paper and no weaker.
- `∀ p : ℕ` (row 16): Mathlib's `CharP.char_is_prime_or_zero` gives p prime or p = 0 for any field, so for every other
  p (including 1) the inner ∀F is empty. Solution.lean:29–31 uses exactly this (SOURCED).
- Universes (row 17): `MainTheorem.{u}` is one proposition per u, and the Solution theorem is universe-polymorphic. The
  only formal gap is that m₀ might depend on u. It cannot be a real one (REASONED): a circuit over F : Type u has
  finitely many constants; the subfield they generate is countable and hence `Small.{0}`; the circuit lives over that
  subfield, since each gate's coefficients lie in it by induction; and a copy in `Type` of the same characteristic
  exists (`Shrink`). So the universe-0 m₀ serves every universe. Q.3 (p.66) says the given field in M.3 and N.5 "may lie
  in any universe". Test T9.
- Non-vacuity (row 18): `0 < c` is present (L45). Every polynomial has a circuit (T3), so the hypothesis is
  satisfiable. For each fixed c > 0 the bound eventually beats every m^k (T7), so the statement is superpolynomial
  rather than trivial.

### B.6 `Approximates f s` (L50–55)

**What it says.** Some polynomial q over `LaurentSeries F` has a circuit with ≤ s gates, and for every monomial d,
coeff_d(q) has no negative powers of ε and its ε⁰ coefficient equals coeff_d(f).

**Paper.** Def 1.3 = N.1 (p.2, p.62): "A circuit over k((ε)) approximates a polynomial f over k if it computes a
polynomial of the form f + εg, where g is a polynomial all of whose coefficients lie in k[[ε]]." The Lean condition is
equivalent (row 20): q − f has every coefficient of order ≥ 1, so (q − f)/ε has coefficients in k[[ε]] and finitely
many monomials. The release proves the same restatement (`Paper.def_approx`, Approximate.lean:28). Test T13.

- `.coeff` (row 19): `LaurentSeries F := HahnSeries ℤ F` (REASONED, Mathlib), and `.coeff i : F` is the coefficient of
  ε^i. SOURCED by use: Nc/Rate/Truncate.lean:247 rewrites this exact expression with `HahnSeries.coeff_add`. Test T14.
- Constants (row 21): any Laurent series. The textbook notions (REASONED, from memory, not read) are a circuit over k(ε)
  computing F ∈ k[ε][x] with F|_{ε=0} = f, or the same over k[ε,ε⁻¹]. Over ℂ there is also "f is in the closure of the
  set of polynomials with circuits of size ≤ s", which equals the algebraic notion by Alder's theorem (cited by the
  paper, p.62).
  - k(ε) embeds in k((ε)) as a ring (Mathlib `RatFunc` → `LaurentSeries`) and k[ε] ⊂ k[[ε]], so each textbook
    approximation is a Lean approximation of the same size.
  - Over ℝ or ℂ, a limit point of the semialgebraic set of polynomials with circuits ≤ s is reached along a curve whose
    circuit constants are Puiseux series. In ε = t^{1/q} those are Laurent series, so it too is a Lean approximation of
    the same size (REASONED; this is the curve-selection lemma).
  - So Lean's notion is at least as permissive as every one of these, and MainTheoremApprox and SeparationClosure are
    at least as strong as the English and textbook claims.
  - The release also proves the converse reduction to Laurent-polynomial constants
    (`Nc.Approximates.exists_laurentPolynomial`, Truncate.lean:241; `of_laurentPolynomial`, :251; SOURCED).
- No other bounds (row 22): no bound on the x-degree of q or on the ε-orders, which again only helps the statement.
- Missing anchor (row 23): grep finds no lemma `Computes f s → Approximates f s` in the release (COMPUTED). It is a
  three-line lemma (T12) and PREREG F3 already lists it.

### B.7 `MainTheoremApprox` (L57–60)

**What it says.** MainTheorem with `Approximates` in place of `Computes`.

**Paper.** Thm 1.4 = N.5 (p.2, p.64).

**Difference (row 24).** The Lean has its own ∃c. If "the same bound" meant "with the c of Theorem 1.1", then since
`Computes → Approximates` (T12) and Beyond is monotone in c for m ≥ 2, the c of MainTheoremApprox serves both theorems
at once. So no reading of the English is lost (REASONED).

### B.8 `Family`, `VP`, `VPBar`, `VNP` (L62–90)

- **Family** (row 25): a variable type `vars n : Type` with `Fintype`, and a polynomial for every n. SY10 Def 1.2/1.3
  use x_1 … x_{k(n)}, which is the same after renaming (T23). Lean counts the ambient variables. A family can only
  separate VP from VNP through circuit size, because every VNP family has bounded variables and degree (T18(ii)), so
  the convention does not matter.
- **VP** (rows 26–28): `∃ a, ∀ n, card ≤ n^a + a ∧ totalDegree ≤ n^a + a ∧ Computes (poly n) (n^a + a)`. SY10 Def 1.2
  (SOURCED): "there exists some polynomial t : N → N such that for every n, both the number of variables in f_n and the
  degree of f_n are at most t(n), and there is an arithmetic circuit of size at most t(n) computing f_n". These are
  equivalent: one a can always be raised to cover all three and n = 0, 1; note 0^a + a = a for a ≥ 1 and 0^0 = 1 in ℕ
  (T17). SY10 adds explicitly that intermediate degrees are not bounded, and Lean does not bound them either.
  Saptharishi indexes by the number of variables (Defs 1.1, 3.1), but the classes and the separation transfer by padding
  (REASONED).
- **VPBar** (row 29): VP with `Approximates`, keeping the variable and degree bounds on f. The brief asks whether the
  degree bound is needed. For `SeparationClosure` it is irrelevant: if f ∈ VNP, with witness g ∈ VP at exponent a, then
  card(f.vars n) ≤ card(f.vars n ⊕ Fin (r n)) ≤ n^a + a. Also deg f_n ≤ deg g_n ≤ n^a + a, because substituting X and
  the constants 0, 1 does not raise total degree. Hence `VNP ⊆ VPBar ↔ VNP ⊆ VPBar'` with VPBar' the class without
  those bounds (REASONED, T16). The bound is also the standard one: VP̄ is the closure of a class of polynomially bounded
  degree.
- **VNP** (rows 30–33): f n = Σ_{e : Fin (r n) → Bool} g n (x, e), with the bits substituted as 1 and 0 of F through
  `aeval (Sum.elim X …)`, and g a VP family on `f.vars n ⊕ Fin (r n)`. SY10 Def 1.3 (SOURCED) has
  f_n(x_1..x_{k(n)}) = Σ_{w∈{0,1}^{t(n)}} g_{t(n)}(x, w) with t, k polynomially bounded and {g_n} ∈ VP. Saptharishi Def
  3.2 has the same with m = poly(n). The only difference is that SY10 reindexes the witness by t(n), and a VP family
  reindexed by a polynomially bounded t stays in VP (T18(i)). r is bounded implicitly through the variable bound of g
  (row 33). The identity is between formal polynomials (row 32), which is what SY10 p.3 insists on ("we always regard
  an arithmetic circuit as computing a polynomial in F[X] and not a function").

### B.9 `Separation` (L92–93) and `SeparationClosure` (L95–96)

- `Separation`: ∀ fields F (universe u), VP F ⊂ VNP F. `⊂` on `Set` is ⊆ ∧ ¬⊇ (REASONED, Mathlib). The release builds
  it as a pair (Fields.lean:143–149, SOURCED by use). Cor 1.2 says "VP is a proper subset of VNP" (p.2), the same thing
  (row 34).
- Whether it follows from MainTheorem alone (row 35): **no**. It also needs (a) VP ⊆ VNP, (b) a VNP family that
  MainTheorem bounds (HC in every characteristic), and (c) that the bound beats every n^a + a. The release proves all
  three: (a) `Paper.vp_subset_vnp` (Rate.lean:491, r = 0, as on paper p.59); (b) `Paper.hc_mem_VNP` (Fields.lean:131,
  witness `Nc.Hc.hcWit` with one-hot position bits, identity `genHC_eq_sum_wit` at Nc/Hc/Vnp.lean:189, size bound
  `csize_hcWit` at :221, exponent 700); (c) `Paper.exists_beyond_poly` (Fields.lean:113). Grep finds no `sorry` or
  `admit` outside Challenge.lean, and no `axiom`, `opaque`, `native_decide`, `implemented_by` or `extern` declaration
  (COMPUTED). That this is axiom-clean is for the kernel to say (`scripts/PrintAxioms.lean`, PREREG K0). For the
  *meaning* it is irrelevant: `Separation` states VP ⊂ VNP itself and mentions neither HC nor MainTheorem.
- Row 36: the paper's sentence before Cor 1.2 cites both families, but the route uses HC only. PERM ∈ VNP
  (`Paper.perm_mem_VNP`, Ryser.lean:95) is stated for `F : Type` and is used only for ℝ (`cor_classes`, Rate.lean:503).
- `SeparationClosure` (row 37): ¬ VNP F ⊆ VPBar F, which is Thm 1.4/N.5's "VNP ⊄ VP̄". It is proved through
  `Paper.thm_approx.2` (Approximate.lean:268–301) with `hc_mem_VNP` (SOURCED). It does not assert VP ⊆ VP̄, and the
  paper does not claim it.

### B.10 `permanent_over_real` (Challenge.lean:29–30) and cross-checks

- Row 38: ∃c>0 ∃m₀ ∀m≥m₀ ∀s, Computes (perm ℝ m) s → Beyond c m s, which is Thm L.1 (p.59) exactly. Statement.lean has
  four propositions; this fifth one is typed out in Challenge.lean, which imports only Statement (SOURCED, Challenge.lean:6).
  It is the instance p = 0, F = ℝ of MainTheorem.{0} (T10).
- Row 39: the file printed in §3 (pp.11–12) and the pinned Statement.lean agree token for token, 1012 each (COMPUTED:
  `pdftotext -raw` pages 11–12, glyphs mapped N→ℕ, Z→ℤ, 𝜎→σ, 𝜀→ε, m0→m₀, log2→log₂, →0→→₀, ̸=→≠, then
  difflib). The five residual mismatches are the ring variable `R` of `Computes`, which my R→ℝ mapping turned into ℝ;
  the PDF extraction prints both as "R".
- Row 40: in the three files the only non-ASCII letters are σ, ε, ℕ, ℝ, ℤ (in identifiers they are bound variables or
  types), with no zero-width characters, tabs or CRs (COMPUTED). No `notation`, `macro`, `instance` or `set_option`
  appears in Statement.lean except `attribute [instance] Family.fin` (SOURCED).
- Row 41: `toNc`/`ofNc` (Solution.lean:20–23) are plain defs. The proofs at Solution.lean:35–36 and :48 use type
  ascriptions, and `exact h p hp` (:30, :43) needs `hc F m ≡ genHC F m`, `perm F m ≡ genPerm F m` and `Computes ≡
  Nc.Computes`. Comparing the bodies, each pair is identical up to field names (`vars`/`X`, `a`/`C`) and the inlined
  `Nc.IsStep` (REASONED). Whether Lean accepts the ascriptions is decided by the build (K0). Whatever the outcome, it
  cannot change what is proved: Comparator checks the five types against Challenge.lean, which sees only Statement.lean
  and Mathlib.

### B.11 Row 42 (UNSURE): the sources I could not read

The brief names BCS97, Bürgisser 2000, Shpilka–Yehudayoff 2010, Saptharishi and Valiant 1979/1982. I read SY10 and
Saptharishi, which are quoted above. SY10 attributes its definitions of VP and VNP to Valiant ("first defined in the
seminal works of Valiant [Val79a, Val82]", p.3).

From memory:
- BCS97 measures straight-line programs by total complexity (+, −, ×, /, scalar multiples, unit cost) and nonscalar
  complexity, and defines approximative complexity over k(ε) or k[ε,ε⁻¹].
- Bürgisser 2000 defines p-families, VP (p-bounded variables, degree and complexity) and VNP (p-definable), as in SY10.
- Bürgisser 2004 defines VP̄ by approximative complexity.

Each of these is polynomially related to the Lean notion, or contained in it in the strengthening direction (B.1,
B.6). But I have not seen the text, and **I don't know** the exact wording. The test that decides this independently
of my memory is PREREG F2 for writer A (straight-line programs, Bürgisser): if each blind proposition is proved from
the Solution theorems, row 42 is closed. T4, T15 and T17 are the transfer lemmas that bridge will need.

---

## C. Proposed Lean tests

None of these has been elaborated: there is no toolchain for this project here. They are written against the release's
Lean v4.33.1 / Mathlib 0df444a3, with `open Statement MvPolynomial`, and the proof sketches are hints, not proofs.

```lean
-- T1 padding: the bound is about the smallest circuit
theorem T1 {R : Type u} {V : Type} [CommSemiring R] {f : MvPolynomial V R} {s t : ℕ}
    (h : Computes f s) (hst : s ≤ t) : Computes f t := sorry  -- copy of Nc.Computes.mono (Nc/Final/CClasses.lean:59)

-- T2 reuse: circuits, not formulas (a formula needs 2^k leaves)
theorem T2 {R : Type u} {V : Type} [CommSemiring R] (v : V) (k : ℕ) :
    Computes (X v ^ 2 ^ k : MvPolynomial V R) (k + 1) := sorry  -- l i := X v ^ 2 ^ i

-- T3 every polynomial has a circuit (the hypotheses of MainTheorem and MainTheoremApprox are satisfiable)
theorem T3 {R : Type u} {V : Type} [CommSemiring R] (f : MvPolynomial V R) : ∃ s, Computes f s := sorry
  -- MvPolynomial.induction_on with a `join` lemma (Nc.Computes.join)

-- T4 other gate counts: operations only, inputs free, with −; then MainTheorem in that count with c/2
def ComputesOps {R : Type u} {V : Type} [CommRing R] (f : MvPolynomial V R) (L : ℕ) : Prop := sorry -- SLP, ops +,−,×
theorem T4a : ComputesOps f L → Computes f (5 * L + 1) := sorry
theorem T4b : Computes f s → ComputesOps f s := sorry
theorem T4c : MainTheorem.{u} → ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, ∃ m₀ : ℕ, ∀ (F : Type u) [Field F] [CharP F p], ∀ m ≥ m₀,
    ∀ L : ℕ, (ComputesOps (hc F m) L → Beyond c m L) ∧ (p ≠ 2 → ComputesOps (perm F m) L → Beyond c m L) := sorry

-- T5 perm is PERM_m of §1 (not only its transpose)
theorem T5 (F : Type u) [CommSemiring F] (m : ℕ) :
    perm F m = ∑ σ : Equiv.Perm (Fin m), ∏ i, X (i, σ i) := sorry  -- reindex σ ↦ σ⁻¹ and i ↦ σ⁻¹ i

-- T6 hc is HC_m: the (m-1)! cyclic orders; one value; one planted false value (must fail)
theorem T6a (F : Type u) [CommSemiring F] (k : ℕ) : hc F (k + 1) =
    ∑ π : Equiv.Perm (Fin (k + 1)) with π 0 = 0, ∏ i, X (π i, π (finRotate (k + 1) i)) := sorry
  -- Nc.Hc.sum_cycles_eq_sum_orders (Nc/Hc/Vnp.lean:51) with M a b := X (a, b)
theorem T6b (k : ℕ) : (Finset.univ.filter fun σ : Equiv.Perm (Fin (k + 1)) => σ.IsCycleOn Set.univ).card
    = k.factorial := sorry
example (F : Type) [Field F] : hc F 2 = X (0, 1) * X (1, 0) := sorry
example (F : Type) [Field F] : hc F 2 ≠ X (0, 0) * X (1, 1) := sorry   -- the planted value is refuted

-- T7 Beyond: edge cases, monotone in c, superpolynomial
example (c : ℝ) (s : ℕ) : Beyond c 0 s ↔ 1 < s := by simp [Beyond]
example (c : ℝ) (s : ℕ) : Beyond c 1 s ↔ 1 < s := by simp [Beyond]
theorem T7m {c c' : ℝ} (h : c' ≤ c) {m s : ℕ} (hm : 2 ≤ m) : Beyond c m s → Beyond c' m s := sorry
theorem T7s {c : ℝ} (hc : 0 < c) (k : ℕ) :
    ∀ᶠ m : ℕ in Filter.atTop, ((m ^ k + k : ℕ) : ℝ) ≤ (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 3 : ℝ)) := sorry
  -- planted: a Challenge with (1/3 : ℕ) or 1/2 in Beyond must be refused by Comparator (PREREG C1)

-- T8 p neither 0 nor prime is vacuous
example (p : ℕ) (hp : ¬ (p = 0 ∨ p.Prime)) (F : Type u) [Field F] : ¬ CharP F p :=
  fun _ => hp (CharP.char_is_prime_or_zero F p).symm

-- T9 universes: m₀ does not depend on the universe
theorem T9a : MainTheorem.{u} → MainTheorem.{0} := sorry   -- ULift.{u} F, Computes.map along the ring equiv
theorem T9b (c : ℝ) (p m₀ : ℕ)
    (h : ∀ (F : Type) [Field F] [CharP F p], ∀ m ≥ m₀, ∀ s, Computes (hc F m) s → Beyond c m s) :
    ∀ (F : Type u) [Field F] [CharP F p], ∀ m ≥ m₀, ∀ s, Computes (hc F m) s → Beyond c m s := sorry
  -- the subfield generated by the constants is countable → Small.{0} → Shrink; or Paper.lem_transfer (Q.3)

-- T10 Theorem L.1 is an instance of MainTheorem
example : ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ, Computes (perm ℝ m) s → Beyond c m s := by
  obtain ⟨c, hc, h⟩ := Solution.mainTheorem.{0}
  obtain ⟨m₀, h⟩ := h 0
  exact ⟨c, hc, m₀, fun m hm s hs => (h ℝ m hm s).2 (by norm_num) hs⟩

-- T11 red controls: a bound that is too big must be PROVED FALSE; without 0 < c the statement is trivial
theorem T11a : ¬ (∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s, Computes (hc ℚ m) s → (2 : ℝ) ^ (m ^ 2) < s) := sorry
  -- brute-force circuit: (m-1)! products of m variables, ≤ m!·(2m+1)+1 gates (Nc.CSize.sum / prod)
theorem T11b : ∀ (F : Type) [Field F] (m : ℕ), 2 ≤ m → ∀ s, Computes (hc F m) s → Beyond 0 m s := sorry
  -- c = 0 gives 1 < s: hc F m (m ≥ 2) is neither X v nor C a, so the `0 < c` of MainTheorem carries the content

-- T12 an exact circuit is an approximating one; hence MainTheoremApprox ⇒ MainTheorem (same c) and VP ⊆ VPBar
theorem T12 {F : Type u} {V : Type} [Field F] {f : MvPolynomial V F} {s : ℕ} (h : Computes f s) :
    Approximates f s := sorry   -- q := map HahnSeries.C f; Computes.map; coeff of HahnSeries.C a is single 0 a
theorem T12' : MainTheoremApprox.{u} → MainTheorem.{u} := sorry
theorem T12'' (F : Type u) [Field F] : VP F ⊆ VPBar F := sorry

-- T13 Approximates is Definition 1.3 word for word: f + ε g with g over k[[ε]]
theorem T13 {F : Type u} {V : Type} [Field F] (f : MvPolynomial V F) (s : ℕ) : Approximates f s ↔
    ∃ g : MvPolynomial V (PowerSeries F), Computes (map HahnSeries.C f +
      C (HahnSeries.single (1 : ℤ) (1 : F)) * map (HahnSeries.ofPowerSeries ℤ F) g) s := sorry

-- T14 `.coeff` is the coefficient of ε^i
example {F : Type} [Field F] (a : LaurentSeries F) (i : ℤ) : a.coeff i = HahnSeries.coeff a i := rfl
example {F : Type} [Field F] : (HahnSeries.single (1 : ℤ) (1 : F) : LaurentSeries F).coeff 1 = 1 ∧
    (HahnSeries.single (1 : ℤ) (1 : F) : LaurentSeries F).coeff 0 = 0 := sorry

-- T15 textbook border complexity (constants in k(ε), output in k[ε][x]) is a Lean approximation of the same size
def ApproxRat {F : Type} [Field F] {V : Type} (f : MvPolynomial V F) (s : ℕ) : Prop :=
  ∃ g : MvPolynomial V (Polynomial F), Computes (map (algebraMap (Polynomial F) (RatFunc F)) g) s ∧
    map (Polynomial.evalRingHom 0) g = f
theorem T15 {F : Type} [Field F] {V : Type} {f : MvPolynomial V F} {s : ℕ} : ApproxRat f s → Approximates f s := sorry
  -- RatFunc F →+* LaurentSeries F (Mathlib's coercion), Computes.map; the converse direction to Laurent
  -- polynomials is already Nc.Approximates.exists_laurentPolynomial (Nc/Rate/Truncate.lean:241)

-- T16 the degree and variable bounds in VPBar do not matter for SeparationClosure
def VPBar' (F : Type u) [Field F] : Set (Family F) := {f | ∃ a : ℕ, ∀ n, Approximates (f.poly n) (n ^ a + a)}
theorem T16a {F : Type u} [Field F] {f : Family F} (hf : f ∈ VNP F) :
    ∃ a : ℕ, ∀ n, Fintype.card (f.vars n) ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a := sorry
theorem T16 (F : Type u) [Field F] : VNP F ⊆ VPBar F ↔ VNP F ⊆ VPBar' F := sorry

-- T17 n^a + a is "p-bounded" (SY10 Def 1.2)
theorem T17 {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VP F ↔ ∃ P : Polynomial ℕ, ∀ n,
    Fintype.card (f.vars n) ≤ P.eval n ∧ (f.poly n).totalDegree ≤ P.eval n ∧ Computes (f.poly n) (P.eval n) := sorry

-- T18 VNP variants: (i) SY10's reindexed witness g_{t(n)}; (ii) the separation is by circuit size alone
theorem T18i {F : Type u} [CommSemiring F] (g : Family F) (hg : g ∈ VP F) (t : ℕ → ℕ) (b : ℕ)
    (ht : ∀ n, t n ≤ n ^ b + b) : ({ vars := fun n => g.vars (t n), poly := fun n => g.poly (t n) } : Family F) ∈ VP F := sorry
theorem T18ii : Separation.{u} → ∀ (F : Type u) [Field F], ∃ f ∈ VNP F, (∃ a : ℕ, ∀ n,
    Fintype.card (f.vars n) ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a) ∧
    ∀ a : ℕ, ∃ n, ¬ Computes (f.poly n) (n ^ a + a) := sorry

-- T19 ⊂ is proper inclusion
example {α : Type*} (A B : Set α) : A ⊂ B ↔ A ⊆ B ∧ ¬ B ⊆ A := ssubset_iff_subset_not_subset

-- T20 the route of Separation, stated on Statement's own definitions
theorem T20a (F : Type u) [Field F] :
    ({ vars := fun n => Fin n × Fin n, poly := hc F } : Family F) ∈ VNP F := sorry   -- Paper.hc_mem_VNP via T21
theorem T20b : MainTheorem.{u} → Separation.{u} := sorry          -- + VP ⊆ VNP (r = 0) + T7s
theorem T20c : MainTheoremApprox.{u} → SeparationClosure.{u} := sorry
-- and K0: `lake env lean scripts/PrintAxioms.lean` lists only propext, Classical.choice, Quot.sound

-- T21 the bridges Solution relies on are definitional
example {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VP F ↔ Solution.toNc f ∈ Nc.VP F := Iff.rfl
example {F : Type u} [CommSemiring F] (f : Family F) : f ∈ VNP F ↔ Solution.toNc f ∈ Nc.VNP F := Iff.rfl
example {F : Type u} [Field F] (f : Family F) : f ∈ VPBar F ↔ Solution.toNc f ∈ Paper.VPBar F := Iff.rfl
example {F : Type u} [Field F] (m : ℕ) : hc F m = Nc.genHC F m := rfl
example {F : Type u} [Field F] (m : ℕ) : perm F m = Nc.genPerm F m := rfl

-- T22 (row 42) PREREG F2 for writer A's Bürgisser-style statement, using T4, T15, T17 as the transfer lemmas
-- T23 Family: renaming the variables along an Equiv (Fintype.equivFin) preserves VP, VNP and VPBar membership
```

---

## D. The brief's questions, one line each

- **Gate, reuse, cancellation:** variables and constants count as gates; reuse and cancellation are allowed, so these
  are general circuits (rows 1–6).
- **Constants:** any element of the field (exact case) or any Laurent series (approximate case), one gate each (rows
  5, 21).
- **Beyond:** m = 0, 1 give the bound 1; the power is real; log₂ is `logb 2`; nothing is wrong at small m that m ≥ m₀
  does not already remove (rows 12–14).
- **Quantifier order:** c before p, m₀ before F; `CharP F p` with p neither 0 nor prime is unsatisfiable (rows 15–16).
- **Universes:** one proposition per universe; the m₀ transfers between universes (row 17, T9).
- **Fintype and n^a + a:** equivalent to p-bounded (rows 25–26, T17).
- **0/1 substitution:** the constants 1 and 0, with formal equality (rows 31–32).
- **⊂:** strict (row 34).
- **Approximates:** Laurent series contain k(ε); the i ≤ 0 condition is f + εk[[ε]][x]; constants unrestricted; Lean is
  at least as permissive as the textbooks, so it is stronger (rows 19–23).
- **VPBar's degree bound:** irrelevant for `¬ VNP ⊆ VPBar` (row 29, T16).
- **perm vs hc orientation:** the same polynomials as the paper's (rows 8, 10).
- **Separation:** not from MainTheorem alone; it also needs VP ⊆ VNP, HC ∈ VNP and superpolynomiality, all proved in
  the release (sorry-free by grep; axiom-clean is for K0 to show) (rows 35–37).
