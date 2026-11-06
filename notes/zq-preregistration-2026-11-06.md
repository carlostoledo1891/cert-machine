# ℤ is Diophantine in ℚ (Glazer et al., 2026-11-05): Track A pre-registration, 2026-11-06

**The theorem is UNDECIDED HERE.** Nothing in this file, and nothing any lane below produces, decides whether ℤ is
Diophantine in ℚ. The main Lean target is unproved (its proof is `sorry`), the manuscript is 148 pages of arithmetic
geometry resting on 62 cited works, and the lanes below decide finite, checkable facts about the artifact and about
the stated size bounds, and nothing more.

Written and committed BEFORE any code of ours runs on the claimant's data. The Phase 0 reading (below) used `jq` and
`sed` only to look at the JSON's structure (key lists, the first rows of arrays, the five composition recipes, the
`multiply` template's nodes) and to read prose. No count, height or bound was computed from their data before this
commit. The operator's approval (2026-11-06, about 00:30 UTC): "Phase 0 + start Track A lane 1". Nothing is pushed, no
pod is created and nothing is posted under this pre-registration.

## The claim, verbatim at the pins

Elliot Glazer with AI agents (Astra 6, Sol 6.1, Opus 5.5; audited by Fable 5.1), announced 2026-11-05 18:00 UTC.
Repository github.com/elliotglazer/diophantine-z-q, cloned read-only at `~/Projects/zq-scout/diophantine-z-q`.

| Pin | sha256 |
|---|---|
| repository commit | `97cec7fdd757d9a8e4f468151a47a6d3610fb2f2` (refs/heads/main = origin/main) |
| `construction/ordinary-integer-definition.json` (23,179,783 bytes) | `4d639d4c44e69ea360d36d4591b8fdc82269d68b9363af0157d1e5c1174c7af6` |
| `construction/ordinary-integer-polynomial-size-bounds.json` | `dfef3ff3da641814edf62f9992cb7a27aa0a770deccc95b084a65751289dbd9e` |
| `lean/Frozen/BoundedIntegerPolynomial.lean` | `0889579ae56e75eca811af520eb4e18c9f697e163db408771b93fdbc651a95b9` |
| `diophantine_zq.tex` (11,259 lines) | `cb1148cd6c7769d2af3f1636b60ff0ada4b40431978d1e98d0c339274b3d792b` |
| `construction/z-in-q-polynomial-size-bound-proof.txt` | `0ab03b116bab829cb9b8dbaea5ecd811d728ccf95345228a85a4fe37527b050e` |
| `construction/README.md` | `94f1e289506baa1cd23d90da6ce83a1cdaf57a9c016f884bc87f0b9a049f784b` |
| `lean/SOURCE_MANIFEST.json` (= `source_manifest_sha256` in `lean/VALIDATION.json`) | `343d2eb94974a9c3defb58b8349f94378fb1984cb260b53162790426d8bbff96` |
| `lean/AXIOMS.json` | `4890463e3344f729a320319f9daa116655b83eeabb7d2de73b3590116977a868` |
| `lean/lake-manifest.json` (Mathlib `v4.35.0` at rev `56a005855ea17e0b0958f73ec801ae140b0a1679`) | `a770787f33b5824f61a0731d59e67fca3f44a531b21d1fc1a804064c6fb54e58` |

The four pins the operator named (definition JSON, bounds JSON, frozen Lean, TeX) were re-hashed on 2026-11-06 and
match. Their files are untrusted data: we read them; we do not run their scripts. Their bytes stay in their clone,
never copied into this repository (their original material is unlicensed: "Licenses for original project material
are awaiting the maintainer's selection", README).

The statement (TeX lines 61–75, `thm:target`; README lines 41–45): there is one P ∈ ℤ[X_0, …, X_292890231904] with
deg P < 2↑↑7, every coefficient |c| < 2↑↑8, and q ∈ ℤ ⇔ ∃ w ∈ ℚ^292890231904, P(q, w) = 0, for q ∈ ℚ; 2↑↑1 = 2,
2↑↑(r+1) = 2^(2↑↑r). "The ambient variable count does not assert that every variable occurs essentially."

## Phase 0: how the two numbers are defined (from their prose and the JSON's own `definitions` block)

- **The artifact** is a finite DAG, not a monomial list: 23 library templates (scalar nodes `const`, `var`, `add`,
  `mul`, `call`, and three finite constructors `fixed_integer`, `psi_component`, `finite_guard_product`) and seven
  recipes. Two are model-evaluation recipes (`power_value`, `precision`: a sum of squares of generator equations,
  natural calls, scalar-constant calls, add/multiply/power-value calls and five root differences); five are
  compositions (`close`, `main`, `value`, `integers` sum squares of their calls; `value_union` multiplies them).
- **The ambient variables.** A call substitutes its arguments for the callee's variables 0…p−1 and the caller's
  variables witnessStart+j for the callee's variable p+j ("libraryCallBinding"). Every call gets a PRIVATE consecutive
  witness block, disjoint from the caller's parameters, its own variables and every other block, "including unused
  disjunction branches". So witness counts ADD over calls: W(X) = (X's own witness variables) + Σ over calls W(callee).
  A template called k times contributes k·W(callee); that is how 5 inputs become 292.9 billion (the `precision`
  recipe allocates one `natural` block of 140,604 per source variable and one block per operation, with the
  multiplication template at 35,134 and the power-value recipe at 17,786,698). The root `integers` has parameter 0 = t
  and a declared 292,890,231,904 witnesses: 292,890,231,905 ambient variables. "Ambient" means the polynomial ring the
  substitution lands in; a slot can be ambient without the variable occurring after expansion (cancellation, or a
  callee that never reads a parameter).
- **The expression height** (size-bound proof §2; TeX `sec:size`, lines 6362–6430): variables 0, constants 1,
  add/mul/finite constructor 1 + max input, a template call 1 + callee height + max argument height. In the outer
  composition recipes the arguments are coordinate variables, so a call is a renaming and charges nothing; a
  sum-of-squares composition adds 2, a product composition 1. A model recipe charges each callee 1 + callee + (argument
  height ≤ 2), the generator equations and root differences at most 4, and its sum of squares 2. Claimed: 23 template
  heights, seven recipe heights 228, 233, 235, 251, 252, 254, 256, root 256. The degree and log-norm majorant
  B^(8h) at height h then gives deg ≤ B^2048 and |c| ≤ 2^(B^2048), with B = T+1 (the bounds JSON: `degree_bound`
  "B^2048", `simplified_B` "T+1").

## Lane 1: the ambient variable count and the root expression-height bound (RUN in this session)

**Claimed.** 292,890,231,905 ambient variables = 1 + 292,890,231,904 witnesses (TeX line 43 and `thm:target`; README
line 41; JSON top-level `witnessCount`; bounds JSON line 3 `total_variables`); root height bound 256 (bounds JSON line
154 `root_height_bound`; TeX lines 6421–6425 list the seven recipe heights); and every per-object number in the bounds
JSON (23 template heights and node counts, seven recipe heights and constraint counts, 173 explicit constant nodes,
50 finite-constructor nodes, max literal 3,181,317 decimal digits).

**Our procedure.** `tools/zq-recount.js`: Node, BigInt, standard library only, no line copied or ported from their
`.js` or `.py` (we do not open `bound-ordinary-integer-polynomial.py` or `ordinary-integer-polynomial.js`). It verifies
the sha256 of the definition JSON against the pin before parsing, then derives from STRUCTURE alone, never trusting a
declared count:
1. For each template, in dependency order (a call may only target an earlier template; a cycle refuses): the arity of
   every call equals the callee's `parameterCount`; node arguments point to earlier nodes; every `var` index and every
   call block [witnessStart, witnessStart + W(callee)) lies in range, where W(callee) is OUR derived count. The own
   witness slots (var indices ≥ parameterCount) and the call blocks must tile [parameterCount, need) exactly: no
   overlap, no gap, no caller variable inside a callee's private block. need = 1 + the largest slot used.
2. For each model recipe: the generator variables, every allocated point (a non-negative point reference outside
   the parameter range: source-variable points, constant points, operation outputs; five slots each), every natural
   block, constant block and operation block (lengths from OUR derived W of the `natural`, scalar-constant,
   addition, multiplication templates and the `power_value` recipe) must tile [parameterCount, need) exactly; every
   point an operation reads must be a parameter point, an allocated point or one of −1, −2, −3.
3. For each composition recipe: `explicitWitnessRanges` and the call blocks (lengths from OUR derived W, never the
   call's own `witnessCount` field) must tile [parameterCount, need); every `[var,i]` argument must be a parameter or
   lie in an explicit range.
4. Our ambient count is need(`integers`). Every declared `variableCount`/`witnessCount`, every call record's
   `witnessCount` and every template's `witnessBlocks` table is then compared with what we derived; each difference is
   listed by object.
5. Heights by the rules above, read from the prose (rule set H-claim). Also computed and reported, not used for the
   verdict: rule set H-strict, which charges +1 for each renaming call in the compositions (the looser reading the
   manuscript explicitly declines, TeX lines 6421–6427), and the actual argument heights in the model recipes in
   place of the stated bound 2.
6. Informational only (never a verdict input): the syntactically reached variables (slots that some var node
   reachable from the root reads, through calls whose callee reads that parameter); the constraint counts; counts of
   constant nodes (total and distinct values) and constructor nodes; the largest literal.

**Verdicts.**
- CERTIFIED: the pin matches; every structural check in 1–3 passes; our ambient count is exactly 292,890,231,905 and
  our root height under H-claim is ≤ 256 (equal to 256 is the expected case; a lower value still makes "≤ 256" true
  and is reported).
- REFUTED: the structure passes every check and our count differs from 292,890,231,905, or our H-claim root height
  exceeds 256; in either case only after our reading of the format is re-checked twice and the difference is
  explained by an exact witness (the object, the slot or node, both numbers). A smaller exact count would still leave
  the theorem's ambient ring valid (padding); that case is recorded as "exact count REFUTED, ambient bound holds".
- REFUSED: the pin does not match (nothing is computed); the reader meets an operation, encoding or reference it was
  not told about; a structural check fails (the count is then not determined by the stated semantics); or a
  disagreement remains that we cannot explain. The reason is written down.
- A per-object difference with the bounds JSON that leaves both headline numbers unchanged is a recorded finding,
  not a verdict change.

**Red controls**, each on a mutated COPY of the JSON written to a fresh temp dir and read back. Each has a prediction
fixed here; a control passes when the outcome equals the prediction, and a control that changes neither our numbers
nor any check is a blind spot, said so in the record:
- RC0 pin: the unmodified bytes with one byte appended must fail the sha256 check.
- RC1 witness block +1, coherent: `integers.explicitWitnessRanges` [1,5] → [1,6] and its call's witnessStart 6 → 7.
  Predicted: count 292,890,231,906; the declared-versus-derived comparison flags `integers`.
- RC2 witness block +1, deep: one extra witness variable in a leaf template (a `var` node at a new index, its
  declared counts raised by one), chosen on the root's call chain. Predicted: the derived W of every caller changes
  and the tiling check refuses with an overlap in its callers.
- RC3 declared field only: the `value` call's own `witnessCount` field inside `integers` raised by one, nothing else.
  Predicted: count unchanged (the reader does not read that field) and the comparison flags it.
- RC4 recipe dropped: delete `power_value` from `recipes`. Predicted: REFUSED, a dangling reference.
- RC5 recipe call duplicated: a second call to `close` appended to `main` with a fresh block at the end. Predicted:
  count + W(close) = + 292,890,196,199; the declared counts flagged.
- RC6 middle call dropped: delete the `member` call from `value`. Predicted: the ambient count is UNCHANGED (ambient is
  the largest slot, and this block is not last) and the tiling check refuses with a gap. This is the count's designed
  blindness; only the tiling sees it.
- RC7 height nesting on the critical path: the root of the template that sets the root height wrapped in one more
  `mul` by a constant 1. Predicted: root height 257.
- RC8 height nesting off the critical path: the same wrap on `member`. Predicted: `member` 19, root unchanged 256.

**Stop rule.** One reader, one pass, the controls, the record. If the count disagrees, the format reading is
re-checked twice (the definitions block, then the manuscript's `app:literal` tables) before any verdict; no
re-tuning of the reader against their number. Lane 1 ends with `certs/zq-recount.json` and its `--check`.

**Out of scope.** The theorem; whether P_* has rational zero projection ℤ; whether the B^(8h) majorant lemma is
true (it is a mathematical induction, checked by reading only); the natural precision polynomial's semantics.

## Lane 2: the tower bounds (RUN in this session if B is clearly defined, else REFUSED)

**Claimed.** deg P_* ≤ (T+1)^2048 and |c| ≤ 2^((T+1)^2048) (TeX lines 6428–6429), T+1 ≤ U = 2^(2^(2^9013)), U^2048 =
2^(2^(2^9013+11)) < 2^(2^(2^9014)), and 9014 < 65536 = 2↑↑4, hence deg < 2↑↑7 and |c| < 2↑↑8 (TeX lines 6431–6438).
Proposition `prop:cutoff` (TeX lines 6283–6296): R = D and T = (96·10^13)^13·D^(2210·G0²·D³) < 2^(2^(2^9013)), with the
proof's intermediate claims 10^5 < W < 2^512, 2^2000 < F0 < 2^2250, log2 N_s < 2^2054, c_* < 2^(2^2059),
2^(2^8008) < D < 2^(2^9010), log2 Q^17 > 50000·D² > log2 C_cm. B is the bounds JSON's
"max(2^20, T+1, 1+|c| for every fixedConstant value, every explicit scalar constant node, every evaluated
fixed_integer or psi index expression)", simplified to T+1 by the size-bound proof §3.

**Our procedure.** `tools/zq-tower.js` (or a section of the same tool): the fixedConstants are read from the pinned
JSON, never retyped. Exact BigInt for everything computable (324!, the primorial ∏_{p≤324} p against the literal P0,
W against 4·P0, every literal's bit length); every astronomically large quantity is carried as an exact BigInt or
rational UPPER and LOWER bound on log2 or on log2 log2 (bit lengths; log2 3 in [1.5849625, 1.5849626]; log2(a+b) ≤
max + 1), so every comparison is an exact integer comparison with outward rounding. Decided: each intermediate claim
above; that the maximum in A_ht is Q^17; that every literal, constant node and psi index is ≤ T (B = T+1); and the two
tower inequalities, as λ := log2 log2 (T+1)^2048 < 2^65536 = log2 log2 2↑↑7.

**What enters as a premise, named, never decided here.** H1: H_max < 2^(W³), from the explicit
primes-in-progressions theorem of Bennett, Martin, O'Bryant and Rechnitzer ([bmor] Thm 1.2, (1.10)–(1.11), Cor. 6.17,
A = 1), as applied in the proof of `prop:cutoff` (only its hypothesis inequality 0.03·√W·(ln W)³ < (ln 2)·W³ is
checked exactly). H2: M_0 ≤ N_s^10, the formal-group and Hasse-bound argument (Silverman VII.2.1, V.1.1). M: the
B^(8h) degree/log-norm majorant lemma. L1: lane 1's height 256.

**Verdicts.** CERTIFIED: every exact comparison in the chain from H1, H2, M and L1 to deg < 2↑↑7 and |c| < 2↑↑8 holds,
recorded as a conditional, its premises named in the record. REFUTED: an exact comparison in the chain fails with the
exact numbers (for instance λ ≥ 2^65536, or D ≥ 2^(2^9010)). REFUSED: B's meaning is ambiguous in a way that changes a
comparison, or a step needs a fact not in the JSON or the stated premises. The unconditional tower claim is REFUSED
here by design (it rests on H1, H2, M), and the record says so.

**Out of scope.** The truth of H1, H2 and M; the numerical value of T (never evaluated, nor needed).

## Lane 3: their four finite suites, re-derived clean-room (PRE-REGISTERED, NOT RUN)

**Claimed** (construction/README.md, "What each check establishes"): `verify-integer-compiler.js` 285 binomial-digit,
4,096 bit, 30,120 packed-trace and 49 backend cases; `verify-division-polynomials.js` 44 exact examples against affine
arithmetic over ℚ(√2), 44 changed-x and 30 changed-y rejections; `verify-finite-polynomial-expressions.js` the
expansion identities at small fixture constants and four malformed bindings rejected; `verify-six-contact.js` its
listed finite identities and inequalities.

**Our procedure.** From the prose (integer-compiler-spec.txt §§2–5, TeX `sec:syntax` and `sec:compiler`) only, never
their code: an exact implementation of the binomial-digit, bitwise and packed-history encodings, the
division-polynomial recurrences over ℚ(√2) with A = −11243 + 7950√2 against an independent group-law computation of
[n]P_0, and the six-contact identities. The case SETS are reconstructed from their stated ranges.

**Verdicts.** CERTIFIED per suite: every case of the stated class agrees exactly and the case count is reproduced.
REFUTED: a case they accept fails our exact check (the case is the witness). REFUSED: the case set cannot be
reconstructed from prose. **Stop rule:** one implementation per suite; a disagreement is re-read twice before a
verdict. **Out of scope:** what these suites cannot reach (the README's own list: the zero projection, the global
height and restricted-converse inputs, the natural polynomial's full semantics).

## Lane 4: kernel replay of the 48 accepted Lean modules (PRE-REGISTERED, NOT RUN; needs a pod and the operator's word)

**Claimed** (lean/README.md, lean/VALIDATION.json): 48 modules of integration 31 compile freshly on Lean 4.35.0 with
Mathlib `v4.35.0` (rev `56a00585…`), 704 declarations axiom-checked against {propext, Quot.sound, Classical.choice},
no `sorry` outside the quarantined frozen target, `main_theorem_proved: false`.

**Our procedure.** A fresh clone at the pinned commit on a pod; the 48 sources re-hashed against
`lean/SOURCE_MANIFEST.json`; `lake build` with `-Ddebug.skipKernelTC=false`; OUR axiom script (not their
`Checks/Axioms.lean`) over every declaration of the 48 modules; leanchecker or nanoda on an export; a census for
`sorry`, `axiom`, `native_decide`, `implemented_by`, `extern`, `unsafe`; the frozen target elaborated alone to confirm it
type-checks with its `sorry` and that `hyperoperation 4 2 7` is 2↑↑7 under Mathlib's definition; planted variants (a
module with a `sorry`, one with a new axiom) that must fail.

**Verdicts.** CERTIFIED: the 48 modules check in the kernel with only the three standard axioms, our declaration count
reconciles with their 704, the frozen statement elaborates. REFUTED: a module fails or a further axiom appears. REFUSED:
the pinned toolchain cannot be reproduced. **Out of scope:** the main theorem (the frozen target is `sorry`); whether
the helper statements mean what the manuscript needs.

## Amendment A1, 2026-11-06 02:15 UTC: the H2 attempt (PRE-REGISTERED, committed before any H2 computation)

The operator approved, 2026-11-06 about 01:50 UTC: lane 3 AND an attempt to discharge H2 exactly. Before this commit
nothing about H2 was computed. The reading used `sed`/`grep` on the TeX and `python3 -I` to print the JSON's
`definitions` block and `fixedConstants`. Nothing is pushed, no pod is created and nothing is posted.

**H2, exactly.** M_0 ≤ N_s^10. It has no label of its own: it is the last sentence of the proof of `prop:cutoff`
(TeX line 6347, "Therefore the literal search succeeds by N_s^4 m_0 and M_0 ≤ N_s^{10}"; the proof runs over lines
6297–6349). Lane 2 uses it once, as log2 M ≤ 10·log2 N_s for the fixedConstant `M = least_formal_multiple(Ns)`.
The objects in it:
- M_0 (TeX lines 239–245, sec:syntax, their source S31; JSON `definitions.coefficientAlgorithms.localMultiplier`):
  the least m ≥ 1 such that 1/x([m]P_0) = (a + b√2)/c, with a, b, c ∈ ℤ, c > 0 and gcd(a,b,c) = 1, satisfies
  N_s^4 | a, N_s^4 | b and gcd(c, N_s) = 1. The inverse abscissa of the identity is 0.
- N_s = P_s·H_cat (fixedConstant `Ns = P0·Hproduct`): P_s = ∏_{p≤324} p (lane 2, row E1); H_cat is the product of the
  catalogue, the first 22 primes > 324 in each unit class mod W = 4P_s (JSON `coefficientAlgorithms.catalogue`).
- P_0 = ((1641 − 1160√2)/8, (−123720 + 87483√2)/32) on E: y² = x³ − d²x, d = 75 − 53√2 (TeX lines 256–262).

**What computation would decide it.** H2 is a statement about one fixed integer, so it is finite in principle. Neither
route to it is a computation anyone can run:
(a) The direct route: N_s needs the whole catalogue, 22·φ(W) primes with φ(W) a 432-bit number (lane 2, row E6), and
    then a search over m ≤ N_s^10.
(b) The manuscript's route: M_0 ≤ N_s^4·m_0, where m_0 is the product of the reduction orders of P_0 at every place
    above every odd prime of N_s, which again means every catalogue prime. The step from m_0 to the valuation bounds
    then uses theorems at all of those places at once: the reduction filtration E_0/E_1 ≅ Ẽ_ns (Silverman VII.2.1),
    Hasse's bound (V.1.1), and the formal-group facts (multiplication by p raises v(z) at an odd place; the logarithm
    is an isometry at the dyadic place once v_s(z) > v_s(2)).

**Prediction, fixed now.** H2 as a whole is REFUSED. Deciding it needs either the catalogue, which cannot be
enumerated, or the cited theorems over all of its places, and neither is a finite computation here. No catalogue
prime is sampled and no heuristic is used.

**What is decided exactly instead: the finite ingredients of the manuscript's proof of H2.** Each one is CERTIFIED or
REFUTED by exact arithmetic in ℚ(√2) and in finite fields (BigInt, no floating point). The tool is
`tools/zq-h2.js` → `certs/zq-h2.json`, with `--check`.
- F1. P_0 lies on E. A = −d² = −11243 + 7950√2 equals the JSON's `quadraticField.A`, and the JSON's
  `fixedPointCodes.P` is P_0.
- F2. Norm(d) = 7, and the discriminant of E is 64·d^6, so the odd places of bad reduction are exactly the places
  dividing d. 7 splits (2 is a square mod 7); d ≡ 0 at √2 ≡ 3 and d ≢ 0 at √2 ≡ 4 (mod 7).
- F3. P_0 is integral at every odd place: the denominators 8 and 32 are powers of 2.
- F4. At √2 ≡ 3 (mod 7), P_0 reduces to (2, 6) on y² = x³ and is nonsingular there (2y ≢ 0). The nonsingular
  points of y² = x³ over F_7, together with ∞, number exactly 7. The equation is minimal at that place
  (v(Δ) = 6 < 12).
- F5. For every odd prime p ≤ 324 (65 primes), the exact order of the reduction of P_0 at every place above p
  (residue field F_p or F_{p²}, or the nonsingular group at the bad place), each one < p³. Their product m_0(P_s) is
  then compared exactly with (P_s/2)^6. This decides the P_s part of "m_0 ≤ N_s^6". The catalogue part cannot be
  computed and stays with Hasse's bound.
- F6. (p+1)² < p³ for every integer p ≥ 3: at p = 3 + t, p³ − (p+1)² has only positive coefficients in t.
- F7. At the dyadic place, with v_s(√2) = 1: v_s(x(P_0)) = −6, v_s(y(P_0)) = −9, and v_s(z) = 3 > 2 = v_s(2), where
  z = −x/y.
- F8. The valuation bookkeeping, as exact integer arithmetic. N_s is squarefree (P_s is squarefree, and the catalogue
  primes are distinct and > 324), so v_p(N_s) = 1 for every p | N_s, 2 included. At an odd place 2 + 8 ≥ 4. At the
  dyadic place 6 + 16 = 22, and extracting a and b loses at most 2 and 3 units of v_s, so v_2(a), v_2(b) ≥ 10 ≥ 4.
  The extraction-loss bound itself (conjugation fixes the prime (√2)) is a one-line valuation argument; it is read,
  not computed.
- F9. The exponent arithmetic: at most two places per prime, each order < p³, gives m_0 < ∏ p^6 ≤ N_s^6, and
  N_s^4·N_s^6 = N_s^10.

**Verdicts.** H2 is CERTIFIED only if an exact computation decided M_0 ≤ N_s^10, which is not expected. H2 is
REFUTED only by an exact counterexample, which cannot be computed here. A failed F-row REFUTES that step of the
manuscript's proof (not H2 itself) and is reported with the exact numbers. H2 REFUSED is the expected verdict, and it
names the theorems H2 rests on.

**How lane 2 would read** (certs/zq-tower.json is not edited here; the operator decides). If H2 were discharged,
lane 2 would read CERTIFIED conditional on H1, M and L1, with L1 itself CERTIFIED by lane 1. If H2 is REFUSED with
F1–F9 CERTIFIED, lane 2 stays conditional on H2. H2 can then be restated as the narrower premise H2′: the cited
theorems (VII.2.1, V.1.1 and the formal-group facts) applied at the places above N_s, with every finite fact of the
proof decided here.

**Red controls** for the H2 tool, each with its prediction:
- HC1: P_0 with its x moved by 1 fails F1.
- HC2: x(P_0) over 16 instead of 8 gives v_s(x) = −8 and fails F7.
- HC3: the bound p² in place of p³ fails F5 at some inert p (an order can reach (p+1)²). If it fails nowhere, that is
  a blind spot and the record says so.
- HC4: d = 75 − 52√2 (norm 5625 − 5408 = 217 = 7·31) moves the bad places, and F2 fails.

## Amendment A2, 2026-11-06 02:15 UTC: lane 3, what the Phase 0 reading found (before any lane-3 code ran)

The lane-3 procedure above assumed the case sets come with stated ranges. They do not. Their README gives only the
counts. Their report (`docs/construction-checks-r2.json`, data) gives counts, the n-values of the division-polynomial
graphs, the fixture constants and hashes of the expression suite, and the output values of the six-contact
checker. Their prose (integer-compiler-spec.txt, the TeX and the JSON's `definitions` block) states the mathematics
but none of the case ranges: the (N,K) range of the 285 digit cases, the pairs of the 4,096 bit cases, the machines
and inputs of the 30,120 packed cases, what a "backend" case is, the four evaluation points per n of the 44 exact
division-polynomial cases, why 30 changed-y cases rather than 44, the serialization behind the expression hashes,
and the four malformed bindings. Their checker code is not read. So, by the pre-registered rule, the following is
fixed now and written down before running:

- Each suite gets two verdicts. **replay**: whether their case set is reconstructed and agrees. It is REFUSED when
  the set is not in the prose, with the reason. **statements**: the mathematics the suite is said to check, decided
  on OUR cases with the ranges below. It is CERTIFIED if every case agrees exactly and REFUTED if one fails (the case
  is the witness). A count of ours that equals theirs is never presented as a reproduction of their set.
- Integer compiler (spec §§1–5). §1, the formula conventions (Eq/And/Or, strict inequality, divisibility,
  congruence), on boxes with entries in [0, 12]. §2, the power macro at Q, R ∈ [0, 7]. §3, the binomial digit at
  N ∈ [0, 20], K ∈ [0, 22], and the subset, disjoint and AND encodings at X, Y ∈ [0, 63]. §§4–5, the packed-history
  equations on small register machines: completeness on inputs a ∈ [0, 12], and soundness by exhaustive enumeration
  in a small (q, c) box.
- Division polynomials (TeX lines 206–233; JSON `psiNormalization`, `fixedPointCodes`). The ι formulas against
  independent affine double-and-add over ℚ(√2) at n ∈ [−10, 10], which contains their eleven n-values, at the points
  P_0, [2]P_0, [−3]P_0 and P_0 + (0,0), with changed-x and changed-y rejections. Beyond their suite, the SAVED
  templates `multiply.scalar` (index c ∈ [1, 8] substituted for cstar) and `scalar.integer_constant_0/1/2` (their
  actual indices) are evaluated by our reader with our psi semantics at p ∈ {ι(1), ι(2), ι(−3)}. Their one witness is
  solved, and changed outputs are rejected by an exact count of real roots in the witness (Sturm).
  `scalar.integer_constant_4` (index 1,399) is attempted; if it does not finish on this Mac it is recorded as not run.
- Finite expressions. The parameter, witness, node and call counts of `multiply` and `natural` against their
  `variableCounts`. Which fixed constants (cstar, ell, T) each named template reaches, against the equal and unequal
  pattern of their hashes across the two fixtures. `multiply.scalar` at cstar ∈ {4, 8}, and `multiply.guard` at
  T ∈ {0, 1} on all 27 code triples in [−1, 1]³, evaluated from the saved DAG with our constructor semantics.
- Six contact (TeX sec:height lines 377–560 and 905–965). Every value in their report's six-contact block,
  recomputed from the manuscript's definitions; a value whose meaning the prose does not give is matched as a number
  only and listed separately. Then every finite identity and inequality those lines state.
- Red controls per suite: a perturbed case or a perturbed formula must fail. Each is listed in the record with its
  outcome.

## What every artifact of Track A says first
"The theorem (ℤ is Diophantine in ℚ) is undecided here: the main Lean target is unproved and nothing in this record
decides it."
