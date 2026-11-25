# X1 — reconstruction A (a Claude agent): Sun's M_32 construction

(Saved by the control room at 04:03 UTC from the agent's hand-back message: the harness refused the agent's own write
of this file. The text is the agent's, condensed only where its message repeated itself; every number is as reported.)

**VERDICT: NEEDS DATA.** Sun's paper (arXiv:2610.13971v1) never prints the three maps A(t), B(t), C(t) behind Theorem
1.3(a) (M_32 ⊴ D_16 ⊠ S_2048), in any coordinates. So the M_32 identity Σ_i A_i(x)B_i(y)C_i(z) = ε^h M_32(x,y,z) +
O(ε^{h+1}) cannot be formed, and the brief's step-2 falsifier was not run on it. Every local identity and count the paper
does print was decided exactly: 33 checks, 27 pass, 6 fail. The 6 failures are two printed statements that disagree with
the rest of the print (the scalar-restriction coefficient claim; the clean dimensions of the exceptional blocks, under
every reading tried). Both depend on how the tables are read, so under the brief they are NEEDS DATA, not REFUTED.

Times (`date -u`): ambiguity log 03:50 UTC and seed 03:51 UTC, both before any code; checks 03:58–04:00 UTC. Brief
sha256 db6a7b56…72c0 equals the A10 seal; the TeX (P102Final.tex, 267360…2682), the PDF and the e-print match SUN.md §5.
sun-check/B/ was not opened; nothing of OpenAI's release was read; nothing committed or sent.

## 1. Why the global maps cannot be reconstructed

The global step is asserted in words only (l. 1991–2004; proof of Thm global32, l. 2070–2085: "On each side define one
fixed linear map as the direct sum of the dense-character map and the completion-orbit map"). Those two maps and the
"physical-incidence decoder" are never defined (grep: only l. 1989 and 1995–1996). The one literal assembly formula
(l. 4073–4085) is for M_1024, and even there its row, dense and completion maps are named, not printed. For M_32: no
source coordinate (copy g ∈ [16], packet, colour) is given a target combination of x_ij; the row maps U_X, U_Y, U_Z appear
only inside an identity indexed by "sector"; the tangent modules have no literal map (l. 1696–1705); the exceptional dense
maps D_L, D_R are not printed (l. 4414).

Structural reason (the agent's inference, REASONED; check S1 verifies the relabelling): the paper's local leading tensor
T_dense + T_comp is the full 2048-class zero fibre T_0 (C1, C1b); T_0 = G_{H4} ⊠ M_2 exactly, and G_{H4} ≅ D_16 by
Fourier. If each of the 16 copies gave a degree-zero per-side image of T_0 (the literal reading of §8), the leading
coefficient would be a restriction of D_256 ⊠ M_2, whose border rank is ≤ 256·7 = 1792 — below 2042, the
Landsberg–Michałek lower bound for M_32 over ℂ (bound taken from SUN.md and memory). So no assembly of the printed pieces
can work as read; a real construction needs record-dependent row and Weyl maps, exactly what is unprinted.

## 2. Self-checks (exact: Fraction / F_2 / F_3 / F_p; out/results.json)

| Check | What it tests | Result |
|---|---|---|
| T0 | 17 hand transcriptions against the TeX | 17/17 equal |
| C1 | Lemma fibres32: 128 fibres of 2048; zero fibre = 1954 + 31 + 31 + 31 + 1 | PASS |
| C1b | eq. completion32 = the zero-fibre triples with a zero label (94) | PASS |
| C2 | Prop orbit32: 16·2048 = 32³ cycles, each once | PASS |
| S1 | T_0 = G_H4 ⊠ M_2, and G_H4 = D_16 by Fourier | PASS |
| C4a | packet table: p = k(s) XOR 3λ and χ = A_λ s for all 32 rows | PASS ("+" must be XOR) |
| C4b | 22 CW_3 + 10 CW_2 | PASS |
| C4c | masks follow the Ξ rule; 354 identities; 128 retained, 8 per character | PASS |
| **C5** | "every retained support has coefficient 1/128" | **FAIL as printed**: 50 retained supports (30 B_i, 20 C_i) get coefficient 1; the fix x_i ∈ {0, 1/128} passes |
| C6 | B_0(15) = 3; ker(B_0+B_1) = {0,15}; two chart representatives per defect | PASS |
| C7a | Prop dense32: 256 pointwise + 4096 translated identities | PASS |
| C7b | eight Walsh buckets per character | PASS |
| **C7c** | dense32 weighted by the literal restriction coefficients | **FAIL** at 128 of 256 points; passes with the fix |
| C8 | module–chart table: 4096 entries | PASS (27 labels listed; the five absent are the empty packets) |
| C8b | the 12 side-colour twist identities | PASS |
| C9 | usage table; S_2128 = 19CW_3 + 6CW_2 + 7W; costs 133 and 128; bounds 2048 and 2128 | PASS |
| C10 | the W image covers 7 of 8 T_ar monomials; X_1Y_1Z_0 missing | PASS |
| C11a | singular compiler, Y endpoint | PASS only with an unprinted shift raw Y_k → Y_{k−1} |
| C11b | singular compiler, X endpoint, under reading G7 | PASS |
| C12a | Lemma active-rank4 (det = −1, slice and swap identities, flattening ranks (4,4,3), transfer) | PASS |
| C12b | App A.5 active lift and its physical specialization | PASS |
| C13a | E_L K_χ E_R^T = I_r for χ = 6, 7, 10, 11 (78 occurrences) | PASS |
| **C13b** | the cross identities with D_L, D_R plus the clean dimensions (7,6), (8,7), (7,6), (8,7) | **FAIL under all four readings** |
| C14 | five-empty module; degrees 0, 3, 6; profile (16,15,22) | PASS |
| C15 | endpoint ledger (31,31,31); allocation uses each label 1..31 once per sector | PASS |
| C16 | §8: U-subset ranks all 4; absolute-row32; Heisenberg (65,536 cases); Weyl laws | PASS |
| C17 | Φ_3, Φ_2 (char ≠ 3), the W tangent | PASS |
| C18 | seeded F_p replays of the 9 local identities | 432/432 PASS |

## 3. Where the print disagrees with itself (none is a REFUTED; each depends on a reading)

1. Scalar restriction (l. 1556–1580, 3729–3746): as printed x_i ∈ {0,1} and only x_0, x_∞ carry the 1/128, so B_i and C_i
   get coefficient 1, not 1/128; the weighted dense identity then fails; scaling every x_i by 1/128 fixes both (the
   agent's fix).
2. Exceptional blocks: E_L K E_R^T = I_r holds for all four characters; D_L, D_R are not printed; of four readings (one row
   per packet / one combined row, on each side) none gives both the four identities and the printed clean dimensions.
3. Singular compilers: the printed map works only after an unprinted Y re-indexing; the X-endpoint variant is in words only.
4. Wording: "Thirty-two packet columns grouped into sixteen modules" (l. 2251) — the table lists 27; the five empty
   packets' columns are zero, so no count changes.

All other local pieces are exactly consistent as printed; none of them pins down the global maps.

## 4–6. Ambiguity log, points, reproduction

AMBIGUITY-LOG.md (G1–G13), written before any code; changes after the first run: two mixed readings R-D3/R-D4 added,
two script bugs of the agent's own fixed, check C1b added. Seed 2610139701 (SEED.txt, 03:51 UTC; random.Random, CPython
3.9.6, `python3 -I`); primes 1,000,003 and 998,244,353; 24 points per prime per identity on the nine local Laurent
identities only; 432 evaluations, all pass (out/points.jsonl). The M_32 identity was evaluated at no point: there are no
maps to evaluate.

    cd /Users/carlostoledo/Projects/cert-machine/corpus/omega-nine-fourths
    shasum -a 256 prompts/sun-check.md provenance/sun/eprint-v1/P102Final.tex
    python3 -I sun-check/A/x1a.py provenance/sun/eprint-v1/P102Final.tex sun-check/A/out
    shasum -a 256 sun-check/A/out/points.jsonl   # 61895e6ef7f939104a9f92ac08191fdc19a6f3a67dd4d86afbb909334d324906

## 7. What would turn NEEDS DATA into a decision

Sun's three side maps for Theorem 1.3(a), as matrices or code. The SHA-256 fingerprints at l. 4162–4171 name records
that are not published. With the maps, the falsifier runs over both primes in seconds; the dense 2^30-coordinate check
would then need a pod and the control room's word.
