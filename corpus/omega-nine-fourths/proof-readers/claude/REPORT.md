# P1 — reader 1 (Claude agent): the lower-bound proof of "The matrix multiplication exponent is nine fourths"

(Saved by the control room from the reader's hand-back message at 03:3x UTC: the harness refused the reader's own
write of this file. The text below is the reader's, unedited except for this note. The reader's own summary for the
control room, given before the report, said: "Steps rated GAP: none … That is not a certification. S12–S18 and S21–S25
(most of pp. 15–107) I followed only in outline. The heaviest pieces are proved in other unrefereed OpenAI preprints
released the same day: S6, S7, and the CAT(0) geometry in S11.")

Brief: `corpus/omega-nine-fourths/prompts/proof-reader.md` (sealed in A2). Written 2026-11-25; reading ran from 02:57 to
03:31 UTC (`date -u` at both ends). The harness refused the file write, so this text was returned to the control room to
save. Nothing was committed or sent.

## 0. Provenance and what was read

- **Fetching.** Everything was fetched with `gh api` at openai/math@92b516ef8e2abf66c3db7aa31438d3010bc7956f into
  `inputs/`. Every fetched byte is hashed in `inputs/SHA256SUMS` (89 files). Nothing was compiled or executed. The PDF
  was only converted to text (`pdftotext`) to get page and result numbers. [COMPUTED]
- **Pins match.** `paper/paper.pdf` sha256 is `ddde9ab7755596c6f0210c148985f9761f2c291582e4d0a045987ad1766e5a01`;
  `paper/README.md` sha256 is `c83864717e5f42acbbef76c7a17a4a8a9ead8df9d07f7701e4a70eb97e127834`. Both are **equal to
  the PREREG pins**. The PDF has 111 pages and was created Nov 24 2026 18:28:47 −03. [COMPUTED, `shasum -a 256`, `pdfinfo`]
- **The paper.** I read all of its LaTeX (`paper/build/*.tex`, 28 files). Results are cited below by their PDF numbers
  and pages, which I matched to the LaTeX labels, together with `file.tex:line`. [COMPUTED]
- **The companion oaG** (*Euclidean geometry in the asymptotic spectrum of tensors*; PDF sha256 `7800f8d8…c385e5`, which
  the PREREG does not pin). I read it where the proof cites it: §2 (prices, Lemma 2.2, field comparison, the closure
  lemma, limits), §3 (Thm 3.1, Prop 3.3), §4 (Thms 4.1, 4.3), Def 8.1, Def 11.1, Prop 14.1 with its proof, and the
  statement of Thm "flats".
- **Beyond the brief's named inputs, disclosed.** The brief asks for "an external citation with its exact statement",
  and two more cited documents carry load, so I also read: (a) the cited statements of **oaP** = OpenAI, *Circuit lower
  bounds for Hamiltonian cycle and the permanent* (Nov 24 2026; PDF `a7bab8a7…62be01`): Thm 6.1, Cor 5.2, Thm 12.1 and
  the proof of 12.1 (`batch.tex`), and its intro; (b) from **[nine]** = OpenAI, *An Upper Bound of 9/4…* (Oct 2 2026; PDF
  `9c430672…19ae6`): its setting, Prop 3.1, Lemma 4.1 and the statement of Lemma 4.2. I did not read their other proofs. I
  did not open `blind/`, `reader/`, `proof-readers/astra/` or any Lean file.
- **Coverage, honestly.** I followed the top-level argument (§§1–4 and §27) line by line. I read Parts I–IV (pp. 15–107)
  in full, but followed most of them only **in outline**. "No gap found" describes how far I got; it is not a
  certification.

**Rating key** (the brief's, plus two labels of mine): **CHECKED** every line followed; **PLAUSIBLE** standard, not
followed line by line; **PLAUSIBLE (outline)** not standard, and followed only in outline; **GAP** as the brief defines
it; **I don't know** content I did not read.

## 1. The theorem proved

**Theorem 1.1** (p. 1, `intro.tex:12-23`): over every field F, ω_F = 9/4. Here ω_F is the infimum of the s for which two
n×n matrices can be multiplied in O_{F,s}(n^s) scalar operations. [SOURCED]

The model is formal arithmetic circuits [SOURCED p. 1, `intro.tex:17-23`]: inputs are the 2n² entries, as independent
variables; constants lie in F; gates add, subtract, multiply, or divide by a nonzero rational function; each output must
equal the corresponding product entry as an identity of rational functions, also over finite fields.

Only the lower bound is new. The upper bound is credited to [nine] (over ℂ) and to Amanov–van den Berg–Zuiddam [abvz]
(every field, arXiv:2610.30054) [SOURCED `intro.tex:25-28`, `obstruction.tex:182-186`].

The per-n headline is Corollary 1.2 (p. 2): at least ⌈n^{9/4}/2⌉ multiplication or division gates for every n ≥ 2, even
when linear operations are free [SOURCED `intro.tex:28-31`]. Its gate count q includes a multiplication only when both
inputs are nonconstant, and a division only when the divisor is nonconstant [SOURCED Lemma 2.4, p. 8,
`obstruction.tex:119-120`].

## 2. The load-bearing steps of the lower bound, in order

**Architecture** [SOURCED pp. 7–9]: (1) suppose ω_F < 9/4; (2) then ω_k < 9/4 for some finite field k (Lemma 2.5);
(3) then every near-linear trivalent k-network can be compressed on tensor powers (Thm 2.1, Parts I–IV); (4) iterating
that compression on a sorting network for list distinctness contradicts the unconditional volume bound for distinctness
(Thm 2.2, §4).

**Where the hypothesis enters** [REASONED from every use]. ω < 9/4 is used inside step 3 only through Theorem 7.1, which
says a nonconstant motion forces R(T_n) ≥ n^{9/4}. Theorem 12.1 uses this, with Lemma 2.4, to rule out the motion, which
yields synchronization. Everything downstream consumes ω < 9/4 only through Thm 12.1 / Cor 12.2, or through Thm 16.1,
which rests on them.

| # | Claim | Where proved | Rating |
|---|---|---|---|
| S1 | A formal circuit with q nonscalar ×/÷ gates gives rank_{F̄}(T_s) ≤ 2q. (Evaluate at A+uX, B+vY with u² = v² = 0, at a point where every intermediate function is regular. Each × or ÷ adds at most 2 products of an X-form and a Y-form.) | Lemma 2.4, p. 8, `obstruction.tex:113-147` | CHECKED |
| S2 | ω_F < 9/4 ⇒ ω_k < 9/4 for some finite k. A decomposition with r < s^{9/4}; a maximal ideal of the coefficient ring has finite residue field (Zariski's lemma, plus an integrality argument in char 0); then recursion and padding. | Lemma 2.5, p. 9, `obstruction.tex:149-180` | CHECKED |
| S3 | The contradiction at fixed length: Batcher gives m₀ = O(n_w w²); Thm 2.1 applied J > 2/γ times gives x_{j+1} ≤ h^{-γ}x_j + h^η, with m_j ≤ n^{1.05}, e ≥ n and t_j = n^{o(1)} ≤ 2^w maintained; the final volume O(t_J n w^η) contradicts Thm 2.2 when η < σ. | Prop 2.3, p. 8, `obstruction.tex:67-106` | CHECKED, given Thms 2.1–2.2 |
| S4 | Two D_w tests realize Tag(h,h): a permutation test, and a signed reserve/comparison sum that factorizes to ∏_j 1{x_{π⁻¹(j)} = y_j} in every characteristic; cost 2V + O(tNh). | §4.1, pp. 12–13, `list.tex:11-43` | CHECKED |
| S5 | No-ports routing inequality: for each pinned permutation, the network tensor is a product of r bit-wires, and price monotonicity and additivity give r·E_μ d ≤ m·E_α d. | Lemma 4.1, p. 13, `list.tex:65-80` | CHECKED |
| S6 | No-ports placement: a no-ports subclass closed under ℓ₂ products [oaP Thm 6.1]; the entropy bound H_ν(Y∣X) ≤ C(1+β_ν) [oaP Cor 5.2]; H ≥ log(q/2) gives β ≥ c log q; minimax gives E_μ d ≥ ½√(c log q); so the size is Ω(r√log q) and σ < ½. | Lemma 4.1, pp. 13–14, `list.tex:82-126` | Interface CHECKED (`circuit-lb/build/product.tex:18-23`, `entropy.tex:436-447` match the use). Content: I don't know; not proved here. |
| S7 | Ports case: descent with Tag gates [oaG Prop 14.1, which assumes ports, `exact.tex:16-31`] plus the exact batch bound vol((U_ℓ*)^{⊗j}) > jℓ^{1+δ} for j ≤ 2^{ℓ^ξ} [oaP Thm 12.1; its section fixes "a characteristic χ admitting ports", `model.tex:3,82-88`]. Bookkeeping: ℓ = h^b, j = N², x' ≤ h^{-a/2}x + h^{2σ}, L > 2A/a steps. | §4.3, pp. 14–15, `list.tex:128-205` | Bookkeeping and hypotheses CHECKED. Content of oaG 14.1 and oaP 12.1: I don't know. |
| S8 | Assembly of Thm 2.1: the margins, J macros with M_j = max{s_j, e_j h^{2a}}, x_{j+1} ≤ q·max{x_j, 2h^{2a}}, lookup factor h^{ρ b_*}, d = 2^u d_J = n^{o(1)}, descent, γ = Δ/2. | §27, pp. 106–107, `shaving.tex:41-120` | CHECKED, given S9, S10, S21, S24 |
| S9 | Descent from K to k at size O(s[K:k]²): a chain of multiplication matrices, then the first coordinate. | Lemma 27.1, p. 106 | CHECKED |
| S10 | Batched lookup at O(2^u s(1+u)^{p-1}): counts with unary factors, a sort of queries and dictionary rows, and a counter. | Lemma 16.2, p. 59, `lookup.tex:9-60` | CHECKED, given Thm 16.1(1) |
| S11 | Imported price geometry: CAT(0) embedding [oaG Thm 4.3], joint convexity [Prop 3.3], ultralimits, Zariski-closed sublevels, field change, strict spectral comparison [Lemma 2.2]. | §3, pp. 10–12, `background.tex:62-99` | Lemma 2.2, closure and field change: PLAUSIBLE (I read oaG's proofs). CAT(0): I don't know. It rests on the shifted crossing, oaG Thm 4.1, attributed to Anthropic (`curvature.tex:16-38`). |
| S12 | Price extension and assisted cost, geodesic determination, pinned minimizers. | Thm 5.1, Lemmas 5.2–5.3, pp. 16–20 | PLAUSIBLE (outline) |
| S13 | Gauss lift; specialization and the star (submean) inequality. | Thm 6.1, Lemma 6.2, pp. 20–25 | PLAUSIBLE (outline) |
| S14 | Thm 7.1: kink, disk tree, and the four-site rate D ≤ 3/2. | §7, pp. 25–30 | PLAUSIBLE (outline). I re-derived the leaf-distance step, the harmonic table (columns sum to 0) and 3(1−D)+D ≥ 0 ⇒ D ≤ 3/2. |
| S15 | Decoder (Lemma 8.2) ⇒ D_ABC ≤ L + h/4 + (2ε+o(1))h ⇒ contact at infinity ⇒ D(1,1,1) = 8/3 ⇒ r ≥ n^{9/4}. | §8, pp. 30–33 | Arithmetic CHECKED and COMPUTED. Lemma 8.2: PLAUSIBLE. Tangent limit: PLAUSIBLE (outline). |
| S16 | Prop 8.1(i), D ≥ D_*, via [nine] Lemmas 4.1–4.2 and pair-entropy through [nine] Prop 3.1 "in the interpolation form of [lu, Prop 2.1]". | Prop 9.2, pp. 35–37, `contact.tex:91-236` | PLAUSIBLE. [nine] is over ℂ (`nine/build/paper.tex:142-144`) and its Prop 3.1 uses a 5M-th root of unity. The transfer to every characteristic is two sentences (`contact.tex:144-149`). [nine] Lemma 4.1's argument is visibly characteristic-free. [lu] not read. |
| S17 | Prop 8.1(ii), propagation of contact (energies, radial contraction, d/dt G = −Δ, minimum principle). | §§10–11, pp. 37–43 | PLAUSIBLE (outline); derivative identity re-derived |
| S18 | Synchronization: pinned sites cannot move (else Thm 7.1); independent parameters follow via the Gauss formula. | Thm 12.1, Cor 12.2, pp. 44–47 | PLAUSIBLE (outline); the last step CHECKED |
| S19 | Sphere prices, E − B_N = O(√(log N / N)). | Thm 14.1, Cors 14.3–14.4, pp. 51–56 | Inequality chain CHECKED, given Prop 13.1, Lemma 13.3, Cor 12.2 |
| S20 | Incidence inequality and the affine-link Poincaré bound. | Thm 15.1, Cor 15.2, pp. 56–59 | CHECKED, given Thm 14.1 |
| S21 | Conditional sorting, Thm 16.1(1)–(2): Garland with C₀ = 100, finite detection, routing identity (Prop 18.1, oaG §9), recursion with 14Ct^ζ < 1/4, radix packing. | §§16–18, pp. 59–72 | Recursion and Garland coefficients CHECKED (COMPUTED for q ≥ 100). Prop 18.1: PLAUSIBLE (outline). |
| S22 | Local concentration. | Lemma 19.1, §§19–22, pp. 72–85 | PLAUSIBLE (outline); the reconstruction step CHECKED |
| S23 | Core-width beat X_out ≤ ½X + C(Z+σ): an unconditional 6-party wiring identity, subrounds, and a reset with rotors from Thm 16.1(2). | Lemmas 24.1–24.2, pp. 89–96 | λ_* < 2 argument CHECKED, given oaG 4.3 and 2.2; rest PLAUSIBLE (outline) |
| S24 | Macro and round iteration. | Lemma 23.1, §25, pp. 86–101 | PLAUSIBLE (outline) |
| S25 | One fixed network for the whole sum. | Lemma 26.1, §26.2, pp. 101–106 | PLAUSIBLE (outline) |

No step is rated GAP. Closest calls: S16's two-sentence characteristic transfer of [nine]; the uniformity asserted at
`contact.tex:241-242`.

## 3. The single most likely place for an error

**Theorem 2.2, the unconditional volume bound for list distinctness** (§4, pp. 7 and 12–15). The paper proves only the
reduction to it (S4–S5 and the S6–S7 bookkeeping, all CHECKED). The content is imported from oaP Thm 6.1 + Cor 5.2
(no-ports case) and oaG Prop 14.1 + oaP Thm 12.1 (ports case).

1. **Its strength is out of proportion to its support.** At t = 1, with the paper's own circuit-to-network embedding, it
   gives an Ω(n (log n)^σ) Boolean circuit lower bound for element distinctness. That is a superlinear lower bound for an
   explicit function in P, against general circuits and even against F_p-summing, work-sharing networks. From memory,
   the best explicit bound is about 3.1n (Li–Yang STOC 2022; (3+1/86)n by Find–Golovnev–Hirsch–Kulikov FOCS 2016). Any
   rank-method route to ω > 2 has to contain a result of this kind somewhere; here it sits in Theorem 2.2, which this
   paper does not prove.
2. **Each branch needs a striking new theorem.** No ports: oaP Cor 5.2 turns qualitative "no ports" into a uniform
   quantitative entropy bound — "no ports ⇒ maximally no ports". Ports: oaP Thm 12.1 is a fixed-polynomial n^{1+δ}
   lower bound against nonuniform F_p-networks for batches up to 2^{n^σ}. It is proved by a self-referential "count
   yourself and add one" diagonalization (`circuit-lb/build/batch.tex:9-90`) that needs a compressed self-simulation
   inside a clock gap (Thm gap(2), not read). That kind of argument is classically fragile on clocks and uniformity.
   From memory, I know of no prior fixed-polynomial lower bound of this kind for Mod_pP; I don't know whether one exists.
3. **Nothing in this paper can catch the error.** Theorem 2.1 is conditional on a hypothesis the paper says is false, so
   Parts I–IV never test Theorem 2.2. A failure in either branch removes the contradiction outright.

**Runner-up, inside the paper's own new reasoning: §§7–12.** This is the only place ω < 9/4 becomes structure, and the
only place 9/4 must come out as an exact equality D(1,1,1) = 8/3. It runs through a chain of limits, each asserted in one
or two sentences: valued fields with uncountably many indeterminates, and a Gauss lift; pinned CAT(0) minimizers; a kink
of a convex displacement function; a rescaled ultralimit "disk tree"; ray convexity and continuity at the origin; tangent
homogeneity; uniformity of (9.x) as one arm → ∞; a Fatou/semiconvexity minimum principle.

**Relation to Phase 1.** If the Lean rows pass, the division-free exponent statement is kernel-checked. A remaining error
would then sit in the Lean statement, or in the paper's claims beyond it (G2, G3). I don't know whether the Lean follows
this route. [REASONED from PREREG]

## 4. The per-n bound, Corollary 1.2, Corollary 1.3, and the division case

- **⌈n^{9/4}/2⌉.** Theorem 1.1's lower bound over F̄, plus the recursion "rank r at size N gives ω ≤ log_N r", gives
  rank_{F̄}(T_n) ≥ n^{9/4} at every n. Lemma 2.4 then gives q ≥ n^{9/4}/2. [SOURCED `consequences.tex:6-13`] Complete in
  this paper and CHECKED; the upper bound is not used.
- **Border rank ≥ n^{9/4}.** The closure-and-span argument, compared against the rank of T_{n^j}.
  [`consequences.tex:15-24`] Complete and CHECKED.
- **Asymptotic rank = n^{9/4}.** The lower bound follows from the above. The upper bound needs [abvz], plus a descent
  from a finite extension (rank ≤ d_j³ r_j^t). The descent is CHECKED; [abvz] I did not read.
- **Corollary 1.3.** The (abc)^{3/4} bound comes from T_{a,b,c} ⊗ T_{b,c,a} ⊗ T_{c,a,b} ≅ T_{abc} (CHECKED). α ≤ 2/3
  comes from that plus Lemma 2.4 (CHECKED). α ≥ 1/2 comes from [abvz].
- **Division case (G2).** Handled in this paper: Lemma 2.4 reduces ÷ to bilinear rank, and the core works with exact
  bilinear rank, through Thm 7.1's conclusion (`sync.tex:136-140`). Complete given Lemma 2.4 (CHECKED).
- **Summary.** Given Theorem 1.1's lower bound, all of these are short and complete. Their difficulty is entirely in
  Theorems 2.1–2.2. None of them is in the Lean challenge (G2, G3).

## 5. What the claim contradicts or makes surprising

- **No known lower bound is contradicted.** Known bounds are all ~n²: Bläser 5/2n² − 3n; Landsberg 3n² − o(n²) over ℂ;
  Landsberg–Michałek border rank 2n² − ⌈log₂ n⌉ − 1 [SOURCED `history.tex:42-47`]. COMPUTED: n^{9/4} first exceeds
  Landsberg–Michałek at n = 16 (512 > 507); it exceeds Bläser from n = 34, and 3n² from n = 82. Small-n upper bounds
  (from memory: T₂ = 7; T₃ border rank between 17 and 20) are consistent. The per-n gate bound is 3, 6, 12, 19 at
  n = 2, 3, 4, 5.
- **What it refutes, if true (conjectures only).** ω = 2. Strassen's tight-tensor asymptotic rank conjecture [SOURCED
  `consequences.tex:49-58`, Strassen 1994 Conj. 5.3]: T_n is tight and concise, and the conjecture predicts n². Hence also
  the general asymptotic rank conjecture. From memory, Björklund–Kaski (STOC 2024) showed it and the set cover conjecture
  cannot both hold, so this is consistent.
- **Barriers.** Rank methods are capped at about 8N in (ℂ^N)^{⊗3} (Efremenko–Garg–Oliveira–Wigderson ITCS 2018, from
  memory). With N = n², the claim exceeds 8N from n = 4097 (COMPUTED). The method here is not a rank method, so this is
  not a contradiction. Every known spectral point (support functionals, quantum functionals, from memory) gives T_n the
  value n². Corollary 11.1 asserts a non-constructive spectral point with value n^{9/4} on T_n and (abc)^{3/4} on
  T_{a,b,c} (p. 43).
- **Upper bound.** From memory, the best known is ω < 2.371339 (ADVWXXZ, SODA 2025); PREREG G5 has DeepMind still citing
  it on 2026-11-04. [nine], [abvz], [lu] and [tensorvalue] are after my knowledge cutoff; I don't know their status. The
  lower bound uses the upper-bound machinery (Prop 8.1(i) is the price form of ω ≤ 9/4, `contact.tex:685-703`), so an
  error in [nine]'s degenerations would also break the lower bound.
- **Circuit complexity.** Theorem 2.2 gives superlinear circuit lower bounds, as in §3. From memory,
  Afshani–Freksen–Kamma–Larsen (ICALP 2019) and Farhadi–Hajiaghayi–Larsen–Shi (STOC 2019) got Ω(n log n) only conditional
  on the network-coding conjecture. The no-ports branch is an unconditional geometric analogue of a cut bound, with a
  √(log) factor. oaP also claims superpolynomial lower bounds for the permanent and Hamiltonian cycle, i.e. "VNP ⊄ border
  VP" [SOURCED `circuit-lb/build/intro.tex:22-31,68-71`]; that is open as far as I know.
- **ETH.** The CAT(0) foundation rests on the shifted crossing, attributed to "Claude (Anthropic), A 2^{o(n)} time
  algorithm for 3-SAT" (Hexagon preprint, Oct 2026) and to Khoruzhii [SOURCED `references.bib`,
  `companion/build/curvature.tex:16-38`]. The paper also cites OpenAI's "ETH is False" (Oct 25 2026). From memory, ETH is
  widely believed and the best 3-SAT algorithms run in about 1.307^n. I don't know whether these refutations stand.
- **The paper's own flag.** Corollary 1.2 conflicts with the first version of Sun's preprint (2^17 against 2^18 at
  n = 2^8) [SOURCED `consequences.tex:44-47`; 2^{8·9/4} = 2^18 COMPUTED]. I don't know Sun's preprint.

**Arithmetic checks, COMPUTED** (`python3 -I checks.py` in the scratchpad, not on the inputs): D_*(1,1,1) = 8/3 and
6/(8/3) = 9/4; D_*(1,1,b) = b + 3/2 + 1/(4b+2); the chain c + ¾(a+b) ≤ c + a + b − ab/(a+b) ≤ D_*, and
D_*(h/2, h/2, L − h/2) ≥ L + h/4, each on 20,000 random samples; n_w = 2w·2^w = 4N(h+1); the §27 margins are feasible
(ρ = 0.9, δ = 0.02, A = 0.01, β = 10⁻⁵); fermion level counts approach Lemma 13.2 (ratio 0.975 at h = 80); the §24.1
layout has 8 permitted pairs, and neither AB nor CD is one.
