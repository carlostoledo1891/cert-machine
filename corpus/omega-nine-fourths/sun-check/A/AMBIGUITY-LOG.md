# X1, reconstruction A: ambiguity log (written before any check runs)

Written 2026-11-25, 03:50 UTC (`date -u` 03:50:19), by reconstruction A (a Claude agent), before any code was written or run.
Brief: prompts/sun-check.md (sha256 db6a7b56…72c0, matches the seal in AMENDMENTS.md A10).
Source read: provenance/sun/eprint-v1/P102Final.tex (sha256 267360…2682, matches SUN.md §5). Line numbers below are of that file.
The TeX was read, never compiled or executed. The other X1 folder (sun-check/B/) was not opened, and nothing of OpenAI's release was read.

Disclosure: while reading, I did a few hand-arithmetic spot checks (the W image against T_ar; B_0(15) = 3; the coefficient of B_i
under the scalar restriction; E_L^(6) K_6 E_R^(6)T = I_3; the expansion of the five-empty module and of R_t; the Y-endpoint singular
compiler). They shaped the readings below. No code had run when this file was written.

## 0. Bottom line before any check: the three maps are not printed

Def. 2.2 (l. 633-639) defines S ⊴ T by maps A(t), B(t), C(t). For Theorem 1.3(a) (l. 343-356), M_32 ⊴ D_16 ⊠ S_2048, the paper never
prints them, not as matrices, formulas, or a table, in the body or in Appendix B.2 (l. 4177-4226). This holds for any coordinate system.
What is printed is:

- (a) local Laurent maps for some of the five module types, in LOCAL coordinates (X_0..X_3, Ȳ, P_a, X^sh_i, …) whose physical meaning
  is not given;
- (b) scalar identities (Walsh, Heisenberg and Weyl laws) whose variables (σ, η, α, β, q, r, ρ, β) are never tied to source or
  target coordinates;
- (c) counts.

The global step is asserted in words (l. 1991-2004, 2070-2085). "On each side define one fixed linear map as the direct sum of the
dense-character map and the completion-orbit map". Neither of those two maps, nor the "physical-incidence decoder" (l. 1989), is
defined anywhere in the file. A grep finds the two names only at l. 1995-1996. The only "literal assembly" formula,
eq. (literal-assembly-1024) at l. 4073-4085, is for M_1024. Even there, R_{S,h}, F^den and F^comp are named but not printed.

**Reading chosen: none exists for the global layer.** The reconstruction therefore stops at the local layer. It can check every
printed local identity and every printed count exactly. It cannot form Σ_i A_i(x)B_i(y)C_i(z) for M_32.

## 1. Missing or ambiguous items, each with the reading used for the checks

**G1. The D_16 factor and the row/Weyl maps** (l. 2006-2050)
- Printed:
  - U_X = (2,4,8,3), U_Y = (4,8,3,6), U_Z = (7,14,15,13);
  - the identity (1/16)Σ_h (−1)^{<σ,h>+<η,M_I h>} = 1{σ = M_I^T η}, where M_I depends on the "sector" I. A sector is a property of a
    trilinear term, not of a side, so M_I is not a sidewise map;
  - the Heisenberg phase identity, and three Weyl-matrix laws;
  - "The two remaining central bits are realized by the ordinary matrix units of Mat_2(K)".
- Not printed: the image of a source coordinate (copy g ∈ [16], packet, colour) as a combination of the target variables x_ij.
- Reading: none. I check the printed identities as stand-alone statements over all their arguments.

**G2. Dense target coordinates** (l. 1556-1580, 1624-1645; App. A.3-A.4, l. 3653-3785)
- The packet restrictions are scalars. Each one is a covector on a packet's colour space, so it gives a coefficient and not a target
  vector.
- The chart coordinates (ρ, β) are defined through the DEFECT of a triple (eq. chart-defect32, l. 1631-1637). That is a trilinear
  condition, so it defines no sidewise map.
- The side-colour twists that could make it sidewise appear only in the M_1024 appendix (l. 3676-3685). How a twist becomes a
  vector over the labels u ∈ Ω_32 is not stated.
- Reading: none for the global map. I check the printed scalar statements:
  - the masks;
  - the restriction values;
  - Prop. (dense32);
  - the "eight Walsh buckets" claim;
  - eq. (literal-dense-T) together with the module–chart table (eq. module-chart-table), as printed for M_1024. It shares the
    32-packet ledger.

**G3. The scalar-restriction coefficient claim** (l. 1556-1580, repeated at l. 3729-3746)
- The printed values are x_0 = 1/128, y_0 = z_0 = 1, (x_i, y_i, z_i) ∈ {0,1}^3 from the G_i table, and x_∞ = (1/128)·1{R}.
- With these values, B_i = x_i y_0 z_i and C_i = x_i y_i z_0 get coefficient 1 when retained, not the 1/128 the text asserts.
  A_i, P, Q and R do get 1/128.
- Reading used: LITERAL (as printed). The check records every retained support whose coefficient differs from 1/128.
- Alternate reading A-G3', recorded but not used for any verdict: x_i ∈ {0, 1/128}, that is, the whole X side scaled by 1/128.

**G4. Packet-table encoding** (l. 1480-1498, 3664-3666)
- p(s,λ) = k(s) + 3λ: "+" is read as XOR in F_2^5. The integer sum already fails row 1, where k(1) + 3 = 5 ≠ 1.
- Integers are read in binary: bit i ↔ basis vector e_{i+1}. "Basis images (2,5,8,16)" means k(e_1) = 2, k(e_2) = 5, k(e_3) = 8,
  k(e_4) = 16. The same convention applies to B_0, B_1, Λ and U_*.
- χ = A_λ s is a matrix–column product over F_2 with s = (bit0, …, bit3)^T, and row i of the result is bit i of χ.
- <u,v> = parity(popcount(u AND v)).
- B^T is defined by <B^T χ, β> = <χ, B β>.
- The check records whether all 32 table rows match these conventions.

**G5. Prop. (dense32)** (l. 1593-1622)
- F_{λ,m}(r) is read as printed: χ runs over H_4, and "m retained at (λ,χ)" follows the Ξ rule (l. 1547-1555).
- The bucket of a retained (λ, m) at character χ is Θ(m) + B_λ^T χ.
- The "common twist φ" is read as Θ(m) → Θ(m) + φ for every m. The "4096 translated identities" are all (φ, r, β) ∈ H_4^3.

**G6. Tangent pairs** (l. 1695-1705)
- The companion CW_3 has no literal map, only words: "one corner of the companion CW_3 supplies the missing monomial, the barred
  center is put in Laurent degree −2, and the three satellite colors on the other two sides are put in degree one … The Y- and
  Z-type modules are cyclic variants".
- The words do not say:
  - which corner (P, Q or R);
  - where the companion's other nine colours go;
  - which target coordinates the satellites take;
  - what the cyclic variants are.
- Reading: none. The tangent module is NOT reconstructed. Only the printed W map (l. 1685-1694) is checked against T_ar.

**G7. Singular active compilers** (l. 1707-1734)
- The Y-endpoint map is literal. A (l. 1719) is read as the 4×3 matrix whose column j is the image of raw X_j in (X_0..X_3).
- The raw Y coordinates (Y_1, Y_2, Y_3) of the map and the Y coordinates (Y_0, Y_1, Y_2) of T_ar differ by an index shift.
  I apply the shift raw Y_k ↦ Y_{k−1} (not printed) and record that it was needed.
- X-endpoint variant: "exchange the X- and Y-roles" is read as swapping the source colours x ↔ y in the literal map, and with them
  the target letters. Then the X-map AR acts on the three raw X coordinates and the Y-map R on the three raw Y coordinates, with the
  same Y shift. This reading is not printed.

**G8. The active D_4 replacement for M_32** (l. 1895-1974; l. 4198-4199; App. A.5, l. 3800-3810; Lemma active-lift-1024, l. 2149-2198)
- §7 prints R_t on 𝒜_can and says the "preceding invertible changes" transfer it. Those changes are printed only partly:
  - the Z-slice combination A = M_0 + M_2;
  - an X-side A^{-1};
  - a simultaneous swap of the 2nd and 3rd basis vectors.
- App. B.2 says the 2048 route uses "source-resolved Diag_4 blocks". That is the M_1024 family of App. A.5, a different D_4 map.
- Reading: I build the explicit equivalence from the printed steps, compose it with R_t, and check that the leading term is 𝒜_X / 𝒜_Y
  in local coordinates. I also check the App. A.5 family as printed. Which of the two the M_32 route uses is unresolved.

**G9. Exceptional blocks** (l. 1736-1794; App. C.2, l. 4388-4559)
- K_χ is read as the contraction of the barred side's colour columns, in the printed column order, against b_χ, on CW_q as in
  Def. (CW) (l. 715-722):
  - rows are the first endpoint side and columns the second;
  - E_L acts on the first endpoint side and E_R on the second.
- D_L and D_R are not printed. They are "the dense maps defined by the packet restrictions in Appendix A.3", and their row space is
  not stated. Two readings are tested against the four identities and the printed clean dimensions (7,6), (8,7), (7,6), (8,7),
  read as (first endpoint side, second):
  - R-D1: one row per packet, its restriction covector on that side;
  - R-D2: one combined row per block, the two packets' covectors concatenated.
- The F_3 tilde matrices are tested over F_3.
- "78 source occurrences" is read as the support-monomial count of the eight packets.

**G10. The five-empty module** (l. 1796-1876)
- Fully printed in local coordinates. B_{a,j} is row a, column j of the 7×10 matrix B, and c_j is entry j of c.
- The physical labels of X̄, P_a, Q_a, U, V and X^sh_i are not printed for M_32. App. B.2 gives only label ranges, and App. A.12's
  (q,ε) features are for M_1024.
- Checked as a local Laurent identity, exactly.

**G11. Endpoint labels** (App. B.2, l. 4205-4226)
- The integer labels 1..31 have no printed encoding ↔ (q,ε) ∈ H_4×F_2 \ {0} for M_32.
- Not needed for local checks. Unresolved for the global layer.

**G12. Error degree h**
- Not printed for M_32. The local modules use target degree 0, with entries in t^{−2}..t^4.
- For M_1024 the paper uses a t^2 shift and target [t^6] (l. 287-288).
- Unresolved, and moot without the maps.

**G13. Which object Σ_i A_i B_i C_i ranges over**
- Two candidates: the 2048 rank-one triples, composed with the source realizations of Lemmas cw-explicit, cw2-odd and W and with
  s² D_4, in (t, s); or the tensor D_16 ⊠ S_2048 under Laurent maps.
- Moot without the maps. The source realizations are checked on their own: [s^0] = [s^1] = 0, [s^2] = CW_q or W, degree ≤ 6, and the
  product counts 5, 4, 2.

## 2. Why no "assembly of printed pieces" reading was built and run

This is INFERRED. It is my own mathematics, and the code verifies the relabeling step (check S1) before the report relies on it.

- **T_0 is a 2×2 tensor in disguise.** The paper says the fixed-row local leading tensor is T_dense + T_comp, which is the full zero
  fibre T_0 = Σ_{Δ(u,v,w)=0} X_u Y_v Z_w with coefficient one (l. 1886-1889, 2075-2076).
  - Write u = (q,ε,a) ↦ (q; a, a+ε), and likewise for v and w.
  - Then T_0 = G_{H4} ⊠ M_2, where G_{H4} = Σ_{q+r+s=0} x_q y_r z_s is the group tensor of F_2^4. That tensor is ≅ D_16 when
    char ≠ 2.
- **So the naive assembly is capped at 1792.** Suppose each of the 16 D_16 copies contributed a degree-zero sidewise image of T_0.
  - The leading coefficient would then be a restriction of D_16 ⊠ T_0 ≅ D_256 ⊠ M_2.
  - That tensor has border rank ≤ 256·7 = 1792.
- **M_32 needs more than that over C.** Border rank of M_32 is ≥ 2·32² − log_2 32 − 1 = 2042 (Landsberg–Michałek). The figure is
  quoted in SUN.md; the inequality is from memory.
- **Consequence.** Any reading that assembles the printed physical-level pieces with degree-zero row maps must fail over C, and Sun
  claims every field of characteristic ≠ 2. The paper itself insists on keeping records distinct until the decoder (l. 1998-1999,
  2091-2092, 4039). A valid construction would therefore need record-dependent row and Weyl maps, and that is exactly the part that
  is not printed.
- **Why the result would mean nothing.** Building such a reading and watching it fail would only test my design. Under the brief it
  would be NEEDS DATA anyway, so it was not built.

## 3. Checks to run (all exact; decided by integer and Fraction arithmetic over Q, plus F_p replays)

1. **Lemma fibres32** (l. 1278-1288).
   - Every one of the 128 defect fibres has 2048 elements.
   - The zero fibre splits as 1954 + 31 + 31 + 31 + 1.
2. **Prop. orbit32** (l. 1336-1474). The 16·2048 row-translated triples give every cycle x_ij y_jk z_ki exactly once.
3. **S1.** T_0 ≅ G_{H4} ⊠ M_2 under the relabeling in §2.
4. **Packet table** (l. 1500-1542).
   - p and χ against the formulas (G4).
   - Each label occurs once, and each layer covers all 16 characters.
   - Types: 22 CW_3 + 10 CW_2.
   - The masks follow the Ξ rule.
   - 354 packet–support identities, and 128 retained supports.
5. **Scalar restriction** (G3). Retained supports get 1/128 and omitted ones 0, under the literal and the alternate reading.
6. **Maps B_0, B_1, Λ.**
   - B_0(15) = 3 and ker(B_0 + B_1) = {0,15}.
   - Every defect has exactly two chart representatives.
   - For d = 0 they are (0,0) and (3,15).
7. **Prop. dense32 and the bucket claim.** 256 pointwise and 4096 translated identities.
8. **eq. (literal-dense-T) and eq. (module-chart-table)**, as printed for M_1024: the 4096 = 16·16·16 entries over (λ, ρ, β), using
   Table tab:m1024-modules.
9. **§5.1 usage table.**
   - Every label occurs once.
   - The punctures are layer-0 and empty, with types 3 CW_3 + 4 CW_2.
   - S_2128 = 19CW_3 + 6CW_2 + 7W, and the costs 133 and 128.
10. **W map vs T_ar** (l. 1685-1694). Seven of eight monomials, the missing one being X_1Y_1Z_0.
11. **Singular active compilers** (G7). Full Laurent expansion: no negative terms, and degree 0 equals T_ar + endpoint.
12. **Lemma active-rank4.**
    - The slices; det A = −1; A^{-1}B = E_31; A^{-1}C = E_44.
    - The swap to slices (I, E_21, E_44).
    - R_t = 𝒜_can + t x_2y_2z_1, and flattening ranks (4,4,3).
    - The transfer to 𝒜_X and 𝒜_Y.
    - The App. A.5 family.
13. **Exceptional blocks** (G9).
    - E_L K E_R^T = I_r over Q, and the tilde matrices over F_3.
    - The cross identities and clean dimensions under R-D1 and R-D2.
    - The 78 occurrences.
14. **Five-empty module.**
    - eq. (BDc32), and the zero sums of the last five columns.
    - Full expansion: no negative coefficient, the degree-0 output equal to eq. (fiveC3-output32), and the profile (16,15,22).
15. **Endpoint ledger and allocation table arithmetic** (l. 1881, 4205-4226).
16. **§8 identities.**
    - Every nonempty subset sum of {U_X, U_Y, U_Z} has rank 4.
    - eq. (absolute-row32) for every I, σ and η.
    - eq. (heisenberg32) for all α, β, q, r.
    - The Weyl product, Gram and diagonal laws for all arguments.
17. **Source realizations** Φ_3 (Lemma cw-explicit), Φ_2 (Lemma cw2-odd, char ≠ 3) and the W tangent: symbolic in s.
18. **Seeded replay over F_p** for p = 1,000,003 and p = 998,244,353. Each explicit local Laurent identity in items 11, 12, 14 and 17
    is evaluated at random points from SEED.txt, as a Laurent polynomial in t (or s), coefficient by coefficient. This replays the
    exact Q expansions in the brief's form. It is NOT the M_32 falsifier, which cannot be formed (§0).
