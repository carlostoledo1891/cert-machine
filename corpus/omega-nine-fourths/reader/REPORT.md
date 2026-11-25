# F4 — adversarial statement reader: report

(Saved by the control room from the reader's hand-back message at 03:20 UTC: the harness refused the reader's own
Write of this file, and the reader did not work around it. The text below is the reader's, unedited except for this
note and the two summary tables moved up from its message.)

ω = 9/4 lane, cert-machine. Written by a Claude agent (Opus 5.5), the adversarial reader of row F4, between
02:57 and 03:20 UTC on 2026-11-25 (`date -u` read at 02:57:04, 03:16:07 and 03:19:34). Brief:
`corpus/omega-nine-fourths/prompts/adversarial-reader.md`. I did not open `blind/` or `proof-readers/`. I ran nothing
of the release. Lean tests are files in `reader/tests/` for the control room to run on the pod; none has been compiled.

Labels: **[S]** SOURCED (file and line, or paper page) · **[C]** COMPUTED (what I ran) · **[R]** REASONED. Literature
claims marked [R] are from memory. I did not have Bürgisser–Clausen–Shokrollahi (BCS), Bläser 2013, Strassen or
Coppersmith–Winograd open, so I cite chapters, not theorem numbers.

**Inputs.** I fetched five files with `gh api` at 92b516ef8e2abf66c3db7aa31438d3010bc7956f into `reader/inputs/`. All
five match the PREREG sha256 table [C]: MatrixExponent.lean a56cd226…0534, MatrixExponent.json bf7bd1e6…3699,
ExactExponent.lean a0e24334…c962, 107.md 31d88810…c01d, paper.pdf ddde9ab7…5a01. I read paper pp. 1–12. The extra
closure files I read are in §6.

**Summary: 6 MATERIAL, 1 UNSURE, 28 IMMATERIAL.** Inside the PREREG's CERTIFIED scope (the division-free exponents) I
found no MATERIAL difference; the one open question there is U1.

## 1. Table

### MATERIAL (6)

| # | item | Lean line | difference | proposed test |
|---|---|---|---|---|
| M1 | Division gates, square exponent | `Gate` l.13–18; `square_exponent` l.107 | Theorem 1.1 (p. 1) defines ω_F with gates that "add, subtract, multiply or divide by a nonzero rational function". The challenge's `Gate` has no division gate, so its lower bound covers fewer circuits and is weaker than Theorem 1.1's. 107.md l.12 says the model is division-free. The release does prove the division version: `MatrixExponent.omega_eq : omega F = 9/4` (FieldFormula.lean l.12), where `omega` is the rational-circuit model of RationalCircuits.lean l.30–44 and division requires a nonzero divisor (l.35). `square_exponent`'s own proof runs through it (ExactExponent.lean l.12). There is also `divisionOmega_square_eq_formalOmega` (DivisionExponent.lean l.82). No Comparator challenge pins either. | **T3** (`tests/T3_division/`). Comparator must ACCEPT `ReaderDivision.json`: a byte copy of RationalCircuits.lean l.1–52 plus `theorem omega_eq (F) [Field F] : omega F = 9 / 4`, solution module `…MatrixExponent.FieldFormula`. It must REFUSE `ReaderDivisionPlanted.json` (2.24). `T3_DivisionInEnv.lean` must be green with the three axioms only. If all three hold, M1 becomes IMMATERIAL. |
| M2 | Division gates, dual and rectangular exponents | l.110–131 | The paper's α_F (p. 2) uses the same division model, and its proof of α_F ≤ 2/3 handles divisions through Lemma 2.4 (p. 10). The Lean α is division-free. α_free = 1/2 gives α_div ≥ 1/2, but not α_div ≤ 2/3 or ≤ 1/2. In the files I read, no division equality exists away from the square case. The literature bridge (not in the Lean): pass to an infinite K ⊇ F, apply Strassen 1973 division elimination for degree-2 outputs, then the Lean statement at K. | Target only: `divisionOmega F a b c = formalOmega F a b c`, commented in `T3_DivisionInEnv.lean`. Search for it in CEN or prove it; otherwise leave it OPEN by name. |
| M3 | Per-n gate count ⌈n^{9/4}/2⌉: abstract, §1, Cor. 1.2 | absent | The challenge states exponents only. A weaker form follows in three lines from release lemmas. It counts every `mul` gate, scalar ones included (`productQuotientCount`, DivisionModel.lean l.38–42). The paper's count is nonscalar only (Lemma 2.4, p. 8), which is stronger, and I found no nonscalar lemma. | **T4** `reader_gates_per_n`. Green decides the all-multiplications form; the nonscalar form stays OPEN. |
| M4 | Asymptotic rank of T_n = n^{9/4} (Cor. 1.2) | absent | Not stated. It can be derived from `square_exponent` and `square_asymptoticRank_eq_rpow_formalOmega` (SquareExponent.lean l.75). Its meaning rests on `tensorRank`, `matrixTensor` and `asymptoticRank`, which I did not read. | **T4** `reader_asymptoticRank` and `reader_rank_per_n`. For a full test, add a Comparator challenge with those three bodies copied. |
| M5 | Geometric border rank ≥ n^{9/4} (Cor. 1.2) | absent | Not stated, and I found no border-rank definition in the files I read. | OPEN, for CEN. |
| M6 | Cor. 1.3: max{ab, bc, ca, (abc)^{3/4}} bound for every positive-integer format | absent | Not stated as a per-format bound. Only its exponent form holds for the rectangular formula's right side, and that is computed, not proved. | OPEN, for CEN. |

### UNSURE (1)

| # | item | Lean line | difference | proposed test |
|---|---|---|---|---|
| U1 | Do the three theorems pin the definition bodies? | JSON `"definition_names": []`; every definition | If Comparator matched names and types but not bodies, a solution could prove the statements about altered definitions. Example V1: with floor instead of ceil in `wireDimension`, weight −1 gives 0 rows for every N ≥ 2. Every τ is then admissible, `formalOmega` falls to Lean's junk 0, and `rectangular_exponent` becomes false (its right side is 2). I do not know Comparator's `definition_names` semantics. | C3, plus six planted variants in `tests/planted/`, each changing one definition body and nothing else; each must be REFUSED. V1: floor in `wireDimension`; accepting it would accept a false theorem. V2: `v j - v i`. V3: product commuted in `FormalCorrect`. V4: constant gate costs 1. V5: `Icc 0 2`. V6: `1 ≤ C`. V2–V6 leave every theorem mathematically true, so only a body check can refuse them. |

**IMMATERIAL: 28 items, I1–I28 in §3.** Lean tests cover I11–I14 and I18–I21 (T1, T2, T5). The rest are settled by
reasoning or by release lemmas cited by line.

**Scope note.** All six MATERIAL items concern what PREREG l.129–131 already excludes from CERTIFIED. Inside that scope,
the division-free ω(F; ·,·,·) and α(F), I found no MATERIAL difference; the only open question there is U1. M1 can be
decided now, because the release already contains the division theorem the headline needs.

## 2. Each definition and theorem in plain words

Line numbers refer to the challenge.

1. **`Gate`** (l.13–18). Loads a constant or an input, or adds, subtracts or multiplies two earlier registers. No
   division gate. [S]
2. **`Gate.cost`** (l.24–29). Constants and inputs cost 0; add, subtract and multiply cost 1. A scalar multiplication is
   a `mul`, so it costs 1. [S]
3. **`Program`** (l.33–35). Each step appends a gate reading registers `Fin r` of the program so far. Registers are never
   overwritten and can be read any number of times (a circuit). [S]
4. **`Program.cost`** (l.41–43). The sum of the gate costs; dead gates count. [S]
5. **`MatrixInput a b c`** (l.47). Independent variables x_ij (i<a, j<b) and y_jk (j<b, k<c). [S]
6. **`MatrixAlgorithm F a b c`** (l.49–52). A program plus an output register for each (i,k). Format: a = rows, b = inner,
   c = columns. [S]
7. **`MatrixAlgorithm.cost`** (l.58). The program's cost; it carries an unused `[Field F]` argument. [S]
8. **`gatePolynomial`, `registerPolynomial`** (l.77–84). The polynomial each register holds in `MvPolynomial I F`. The
   newest register is at index 0 (`Fin.cases`), and each gate reads its arguments through the numbering of the program it
   was appended to, so the semantics is the ordinary one. The release proves `registerPolynomial_zero` and
   `registerPolynomial_succ` by `rfl` (FormalCircuit.lean l.32–36). [S][R]
9. **`FormalCorrect`** (l.87–89). Each output's polynomial equals Σ_j x_ij·y_jk as a polynomial, over any commutative
   ring, finite fields included. [S]
10. **`wireDimension N w`** (l.94) = ⌈N^w⌉₊. For N ≥ 1 the dimension is at least 1; for w ≤ 0 it is 1; for w = 1 it is N. [R]
11. **`FormalAdmissibleExponent`** (l.97–100). For every ε > 0 there is a C > 0 such that for every N ≥ 1 a correct
    algorithm exists for the format (rows ⌈N^w31⌉, inner ⌈N^w12⌉, columns ⌈N^w23⌉) with cost ≤ C·N^(τ+ε).
    ArithmeticExponent.lean l.7–8 confirms the orientation. [S]
12. **`formalOmega`** (l.103–104). The real `sInf` of the admissible τ. [S]
13. **`square_exponent`** (l.107). For every field F in any universe, `formalOmega F 1 1 1 = 9/4`. [S]
14. **`dualExponent ω`** (l.111–112). The `sSup` of the t ∈ [0,1] with ω t = 2. [S]
15. **`formalAlpha F`** (l.115) = `dualExponent (formalOmega F 1 1)`. Here t is w31, the ROW count: ⌈N^t⌉ × N times
    N × N. [S]
16. **`dual_exponent`** (l.118). `formalAlpha F = 1/2`. [S]
17. **`rectangular_exponent`** (l.123–131). For all real (a,b,c) = (w12, w23, w31): clip each at 0, sort as x ≥ y ≥ z,
    and ω = x + y + max((x+y)z − xy, 0)² / (4xyz). [S]

## 3. Differences and their reasons

### Cost model

- **I1** (l.25–26). Constants and inputs are free. After deleting dead gates, every free register is read by some costed
  gate, and each costed gate reads at most two registers. Charging free gates would multiply the cost by at most 3, so
  the exponent would not change. [R] As far as I remember, BCS ch. 4 treats them the same way. [R]
- **I2** (l.27–29). Scalar multiplications cost 1 and subtraction is counted separately. The paper's ω_F counts "scalar
  operations", which is total cost (p. 1) [S], so this matches. The total, nonscalar and rank exponents are equal
  (Strassen; BCS ch. 14–15 [R]), and the release proves rank ≤ 2·cost (used at ArithmeticExponent.lean l.80) [S]. The
  per-n nonscalar count is M3.
- **I3** (l.33–35, l.84). SSA registers, unlimited reads, no overwriting, newest at index 0. This is a straight-line
  program as BCS defines it [R]. Overwriting would only matter for space, which is not measured. [R]
- **I4**. Dead gates are counted. That only raises a program's cost, and the exponent is an infimum over programs. [R]
- **I5**. The format is the standard ⟨a,b,c⟩ product. Two outputs cannot share a register, because their polynomials
  differ. [R]
- **I6**. The unused `[Field F]` argument changes no value. [R]
- **I7**. The `casesOn` branches are in constructor order (constant, input, add, sub, mul) [S], and the semantics is
  correct. [R]

### Correctness over finite fields

- **I8**. Correctness is a formal identity over every field, which is the paper's convention: "an identity of rational
  functions … also over finite fields" (p. 1) [S]. Without divisions, that is a polynomial identity. Over a finite field
  the formal model is stricter than "computes the function", so its upper bound is stronger and its lower bound weaker
  than in a functional model. Neither the paper nor the Lean claims anything about the functional model. [R]

### Rounded formats and weights

- **I9**. The Lean rounds up; the paper rounds down for α ("⌊n^β⌋", p. 2) [S]. For w ≥ 0 and N ≥ 1,
  ⌊N^w⌋ ≤ ⌈N^w⌉ ≤ 2N^w ≤ 4⌊N^w⌋. Zero padding goes one way (the release's `FormalCorrect.pad`, FormalPadding.lean l.35 [S]),
  and 4×4×4 blocking goes the other at constant-factor cost plus O(output) additions. The exponent is the same. [R]
  Not tested in Lean; F3's padding anchor is the related row.
- **I10**. For w ≤ 0 the dimension is 1, and it is never 0 when N ≥ 1 [R]. The release proves this
  (`wireDimension_max_zero`, RectangularCircuitModel.lean l.145, and `formalOmega_max_zero`, l.157) [S], matching the
  `max · 0` on the formula's right side. Rounding up carries weight here: rounding down (V1) makes dimensions 0 and
  sends `formalOmega` to the junk value. [R]

### Quantifiers and the infimum

- **I11**. The definition is "for every ε > 0, some C > 0, then for every N ≥ 1 a program". The paper's ω_F is the
  infimum of s with cost O(n^s) (p. 1) [S]. Let S₁ be that set and S₂ the set of τ with cost O(n^(τ+ε)) for every ε > 0.
  S₁ is upward closed and S₁ ⊆ S₂ ⊆ closure(S₁), so the infima agree. [R] T1 shows the Lean set at (1,1,1) is exactly
  [9/4, ∞).
- **I12**. "For every N ≥ 1 with one C" is equivalent to "for all large N". The schoolbook algorithm is correct at every N
  (`formalCorrect_naiveAlgorithm`, FormalCircuit.lean l.108 [S]) and N^(τ+ε) > 0, so finitely many small N are absorbed
  into C. No finite set of N can matter. [R] T5 proves the equivalence.
- **I13**. The lower bound says the cost is not O(N^(9/4−δ)), which forces a large cost for infinitely many N, not for
  every N. The textbook defines ω the same way. [R] T1 `reader_square_lower` states it. The every-n form is M3.
- **I14**. Lean's `sInf` of an empty or unbounded-below set is 0. Since 9/4 ≠ 0, `square_exponent` itself rules both out
  through `Real.sInf_empty` and `Real.sInf_of_not_bddBelow`. [R] The release also proves the set non-empty
  (`formalAdmissibleExponent_naive`, ArithmeticExponent.lean l.33) and bounded below (`load_le`, l.107) [S]. T1
  `reader_square_nonjunk` uses only the challenge and `square_exponent`. This answers G7.
- **I15**. At weights that are all ≤ 0, the right side is 0 [C] and the junk value is 0, but the true exponent is also 0
  (a 1×1 by 1×1 product). Nothing is hidden. [R]
- **I16**. `F : Type*` with `[Field F]` is "over every field" in every universe. [S]
- **I17**. `square_exponent` also states ω ≤ 9/4, which the paper credits to [41] and [5] (pp. 1, 9) [S]. The Lean claims
  more than this paper proves. G5 is a literature question, not a meaning gap. [R]

### The dual exponent

- **I18**. The supremum is over [0,1] only. For t > 1 the right side is t + 1 + 1/(4t) > 2 [C]. Restricting to [0,1]
  therefore changes nothing compared with the paper's "β ≥ 0". [R]
- **I19**. "= 2" instead of "≤ 2" changes nothing. Input B has N² variables and each costed gate reads at most two
  registers, so ω(1,1,t) ≥ 2. [R]
- **I20**. Lean's `sSup` of an empty set is 0. Here 0 is in the set (`formalOmega_one_one_zero`, DualExponent.lean l.16,
  proved without the rectangular formula) [S], the set is bounded above by 1, and the value 1/2 ≠ 0. [R] T2.
- **I21**. The orientation differs. The Lean's (1,1,t) puts t on the rows (w31) [S, challenge l.99]. The textbook α
  (Coppersmith; Coppersmith–Winograd [R]) and the paper's α_F ("an n × ⌊n^β⌋ matrix by a ⌊n^β⌋ × n matrix", p. 2 [S]) put
  β on the inner dimension. They are equal because the right side of `rectangular_exponent` is symmetric under all six
  permutations [C]; in textbook terms, the exponent has S₃ symmetry through rank [R]. Read alone, `dual_exponent` would
  need the textbook symmetry, whose cyclic part is not trivial for circuits. T2 `reader_alpha_inner` and
  `reader_alpha_textbook` prove α = 1/2 in the inner orientation, with no sSup.
- **I22**. The Lean says α = 1/2 against the paper's 1/2 ≤ α_F ≤ 2/3 (p. 2), so the Lean is stronger. Its upper half
  rests on the manuscripts listed in 107.md l.5–8 and on `Rectangle.Rigidity` (ExactExponent.lean l.16, 27) [S] (G4).

### The rectangular formula

- **I23**. The exact formula is not claimed in this paper [S]; the Lean is stronger, with the same attribution note as I22.
- **I24**. Lean defines x/0 = 0. The denominator 4xyz is 0 exactly when z = 0, and then the numerator is max(−xy,0)² = 0
  [R]. 0 of 15,625 rational triples have a zero denominator and a nonzero numerator [C]. The formula is continuous as
  z → 0⁺. [R]
- **I25**. Negative weights are clipped at 0, consistent with `wireDimension` (I10). [S]
- **I26**. The theorem's arguments (a,b,c) are (w12, w23, w31) = (inner, columns, rows), not `MatrixAlgorithm`'s (rows,
  inner, columns) [S, l.99]. The right side is symmetric [C], so this is harmless.
- **I27**. `let C := max c 0` shadows `MvPolynomial.C`, opened at l.68 [S]; the right side never uses it. [R]
- **I28**. Sanity checks of the right side, in exact rational arithmetic [C]: 9/4 at (1,1,1), equal to `square_exponent`;
  2 at (1,1,0), matching the release's independent `formalOmega F 1 1 0 = 2`; 1 at (1,0,0) (a dot product) and 0 at
  (0,0,0); symmetric and homogeneous of degree 1; between the largest pairwise sum and a+b+c (schoolbook), and
  ≥ ¾(a+b+c), the exponent form of Cor. 1.3; on (1,1,t): 2 for t ≤ 1/2, and 1 + t + 1/(4t) on [1/2, 1], which is convex.

### Could the theorems hold for a reason other than the mathematics?

- **Junk values.** Ruled out by 9/4 and 1/2 (I14, I20).
- **Trivially satisfiable correctness.** If every program were correct, or none were, the value would be 0, never 9/4. [R]
- **Mis-wired semantics.** Read line by line in I7–I11, the semantics is correct. [S][R]
- **Definitions altered by the solution.** This is U1. The release's definitions in FormalCircuit.lean l.22–41,
  ArithmeticExponent.lean l.22–30 and DualExponent.lean l.14 have the same text as the challenge's [S]; Comparator
  checks the kernel terms.

## 4. Tests in reader/tests/ (none compiled)

Build them inside the release's `lean/` at the pin with `lake env lean`. Green means no error, no `sorry`, and only the
three axioms in every `#print axioms` line.

- **T1_SquareTextbook.lean** decides I11, I13 and I14. Uses `square_exponent` only.
- **T2_AlphaOrientation.lean** decides I19–I21. Uses `rectangular_exponent`, `dual_exponent` and
  `formalOmega_one_one_zero`. If `readerRHS_swap13` fails, it is a tactic repair: case analysis instead of simp.
- **T3_division/** (challenge, planted twin, two JSON configs, in-environment file, generator script) decides M1.
- **T4_PerN.lean** decides M3 in the all-multiplications form and M4.
- **T5_Eventually.lean** decides I12.
- **planted/V1–V6** plus `make_planted.py` decide U1: each must be REFUSED against
  `OAI.LinearAlgebra.SpectralBooks.ExactExponent` with the released JSON.
- **formula_check.py** reproduces every [C] claim: `python3 -I formula_check.py`.

sha256 [C]: T1 526ba24371c6127e5f3ccd87eff3cfe263c3bfb95b64729ff0211b115560d9f3 · T2
0a87a589f46ba2e3bfa6ff39175020f173c1f4c984d12983f399f4b014055032 · T4
41b1a6ed32303bafa2979e7a9b4f0bff4f5d006ed24bc548fc655db4886ec32d · T5
d5f6351762d2da218c2b7b629266506f5e93fa1d5efcbb3d6a7d11f676979b92 · formula_check.py
edbb66c2d3a1baa28d06d46a8e5abe95e6e0c16a463ab4f9a4610221f26ffeb0 · ReaderDivision.lean
1cc94e000e663744f4d394ef7e761fd4e49665477a08016d977b15e7f6e3a410 · ReaderDivision.json
957e56dfccc66bc2c41d65cd2174de1bb9fd710c0bd193448a64e8971e65931d · ReaderDivisionPlanted.lean
f5c840ea693254fb6ee56b331ff0ed1e331c83f056c3a589c75a4420330f0e29 · ReaderDivisionPlanted.json
6d6b86f1d05160abeee6794299417045c0641ac7119997e74ff9f31a52ed55b9 · T3_DivisionInEnv.lean
f57d1f2c32466a2a090c9cbf2403893c99bbfaf10bfe0ca5e014a5b7bc570497 · make_division_challenge.py
9eb4d62e88cf4a2e9d118cf0b32b8fd598a0afd4667e545f0a8d9cd6a6113c89 · make_planted.py
d10a760daee97da362986f025e47a261960d65600335758d1b3f1bbbff050682 · V1
097dd3b956edeee6630a8cf994a1a292a8fb0bac0cbc3c79c7bfc7d1953f8b26 · V2
3aa9edc19ba861eac6abea99f2bd749b2bec1c3129a88af63f6c371058c5f125 · V3
83d93be27a0b78c33d8ca83403e50cbf9ffd66ee15eaafdb6e2d6d975359ac3b · V4
d4708ca8a534f233c240645c39a44c910b0c5e06fdea20994d455282d6994d9c · V5
6cb0845c5c92f99f801d2761a231b6c437190a371f33f01b18328200c27fab8f · V6
c1f4eded8643189ddc1e50a59dbc3b180f23bc1c01297bffc83c53f19924bd43

## 5. What I don't know

- What `definition_names` does in Comparator, and so U1, until C3 and V1–V6 run.
- Whether `tensorRank`, `matrixTensor` and `asymptoticRank` are faithful (not read).
- Whether the release has a nonscalar per-n lemma, a border-rank theorem, Cor. 1.3, or a division equality away from the
  square case anywhere outside the files I read.
- Whether `MatrixExponent.omega` in the solution's environment is the RationalCircuits.lean definition; T3 decides this.
- The exact BCS and Bläser theorem numbers for the textbook facts I cite.
- Whether my Lean tests compile as written.

A note for the P1 and K rows, outside my brief: Rectangle.lean l.11–14 and l.59 describe a conditional `rigidity`, which
FieldFormula.lean l.8–9 discharges through `contact_of_installations` [S]. Only the axiom check and the kernels can say
the discharge is complete.

## 6. Extra files read

All fetched at the pin into `reader/inputs/extra/`, with paths under `lean/OAI/LinearAlgebra/`:
SpectralBooks/RectangularCircuitModel.lean ff987cec… · SpectralBooks/DualExponent.lean 6956d40e… ·
SpectralBooks/SquareRankModel.lean 0315d48c… · SpectralBooks/DivisionExponent.lean 58e7dfcf… ·
SpectralBooks/DivisionModel.lean 58af1950… · SpectralBooks/ArithmeticExponent.lean 67cfe295… ·
SpectralBooks/FormalPadding.lean 9eaea5e4… · SpectralBooks/ExponentBounds.lean 51fdbf99… ·
SpectralBooks/CircuitRankSpecialization.lean 55f31d72… · SpectralBooks/SquareExponent.lean 8f85a3dc… ·
SpectralBooks/FormalCircuit.lean 0f15e5d7… · SpectralBooks/FormalRecursion.lean 57ede021… ·
SpectralBooks/QuotientCircuit.lean (declaration lines only) 133c8ac6… · MatrixExponent/Rectangle.lean 76a75406… ·
MatrixExponent/RationalCircuits.lean f25885e4… · MatrixExponent/FieldFormula.lean d5d83f16… ·
MatrixExponent/Integral/RingFormula.lean 985c98a9… · MatrixExponent/Integral/Model.lean b8322d43…
(full sha256 in the reader's hand-back message, kept in the session record.)

Two GitHub code searches ("theorem omega_eq", "rpow_formalOmega_le_tensorRank") were used only to locate files; they
search the default branch, not the pin, and every file read was then fetched at the pin.
