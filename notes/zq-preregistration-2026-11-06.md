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

### Lane 4 amendment A, 2026-11-06 (written and committed BEFORE any code of ours runs on the claimant's data)

The operator approved lane 4 on 2026-11-06, about 01:50 UTC ("push to the limits"); the pod was already running
(16 vCPU, 128 GB cgroup, shared with another agent's build, so memory is read per process by GNU time, never from the
cgroup). Before this amendment the pod ran only: tool `--help` probes, and a toy module-system project of ours
(no claimant byte) to learn the v4.35.0 tools' behaviour. What that taught, and what is added beyond the procedure
above:

1. **The tools are the toolchain's own.** elan's `leanprover/lean4:v4.35.0` (Linux, commit `eb6cafb7…`, the same
   commit as their Windows `VALIDATION.json`) ships `leanchecker`, `leanchecker-paranoid`, `leanexport` (lean4export
   3.1.0), `nanoda_bin` 0.4.19 and `lean4lean`; we use those binaries, each recorded by sha256. `lean4lean` failed on
   the toy with "incompatible header" on the toolchain's own `.olean` files: it is run once on the library with a
   15-minute cap and recorded, never a verdict input.
2. **The kernel flag.** `lake build ZInQ` runs at the lakefile's options (the lakefile sets none; the option
   `debug.skipKernelTC` has default `false` in `Lean/Environment.lean` v4.35.0, and the audit prints the default it
   sees). The pre-registered flag is applied literally in a second pass: each of the 48 sources re-elaborated with
   `lake env lean -Ddebug.skipKernelTC=false <file>`; every pass must exit 0 with no error and no `sorry` warning.
3. **Two axiom traversals, not one.** In v4.35.0 `Lean.collectAxioms` reads, for an imported constant, the axiom table
   each `.olean` stores at export time (`exportedAxiomsExt`, `Lean/Util/CollectAxioms.lean`), so an audit built on it
   trusts the stored tables (theirs, our build's, and Mathlib's downloaded cache). Our script
   (`tools/zq-lean-audit.lean`, written without opening `Checks/Axioms.lean`) reports BOTH: `lean` =
   `Lean.collectAxioms`, and `ours` = a fresh traversal of every constant's type, value, constructors and recursor
   rules through Mathlib and core, from the environment's private view, ignoring every stored table (a depth-first
   order, then a bitmask fixpoint, so cycles of inductive families are exact). A difference between the two on any
   declaration is a finding; a non-standard axiom by EITHER is a further axiom.
4. **"Every declaration of the 48 modules"** = every constant whose DEFINING MODULE (the environment's
   constant-to-module map) is `ZInQ` or `ZInQ.*`, never selected by name. Each is listed with its module, kind and
   flags (private, internal name, auxiliary recursor, no-confusion, matcher, instance, unsafe, partial,
   `implemented_by`, `extern`). The code generator's extra names (`extraConstNames`, no kernel declaration) are
   counted apart. **Reconciliation with their 704** (`lean/AXIOMS.json`): matched by name; it reconciles when every
   one of their 704 names is ours with the SAME axiom set, and every name of ours outside theirs falls in a class we
   name and count (for instance compiler- or elaborator-generated declarations). A name of theirs that we do not
   find, an axiom set that differs, or a residue we cannot name is a recorded disagreement: REFUSED (REFUTED if it
   exposes a non-standard axiom). Their `Checks/Axioms.lean` may be READ after our run, only to explain the class
   boundary; that it was read is then recorded.
5. **Kernel replays.** All four are run, each with exit code, wall seconds and GNU-time peak RSS: `leanchecker ZInQ`
   (every `ZInQ*` module replayed onto its imports), `leanchecker-paranoid ZInQ` (the same CLI), `leanchecker --fresh
   ZInQ` (every constant of the whole closure, core and Mathlib included, into an empty environment), and nanoda on
   a `leanexport ZInQ` of the full environment, permitted axioms exactly {propext, Quot.sound, Classical.choice},
   `unpermitted_axiom_hard_error: false` (core DECLARES `sorryAx` and the compiler axioms; a declaration that USES
   one is still an error), Nat and String extensions on. The verdict needs the per-module pass, our audit and at least
   one of `leanchecker --fresh` / nanoda to accept; a replay that REJECTS a constant of the 48 modules is REFUTED; one
   that rejects a Mathlib or core constant, or that cannot finish (time, memory, tool), is recorded and makes that row
   REFUSED, not the claim refuted. The downloaded Mathlib cache is a trusted input of the BUILD only: the fresh replay
   and nanoda re-check every constant of the closure from the oleans.
6. **Census** over the 48 sources, the root, the frozen file and the lakefile, run on the desk by the recorder from the
   read-only clone (sha256-checked against the manifest): the six pre-registered tokens plus `admit`, `opaque`,
   `partial`, `skipKernelTC`, `set_option`, `run_cmd`, `#eval`, `ofReduceBool`, `trustCompiler`, `addDecl`,
   `elab`, `macro`; each hit with file, line and whether it is in code or in a comment/docstring/string. Reported,
   cross-checked with the audit's flags; a code hit of `sorry`/`admit`/`axiom`/`native_decide` in the 48 sources would
   contradict the audit and is investigated before any verdict.
7. **The frozen target**, two ways: (F1) `lake env lean Frozen/BoundedIntegerPolynomial.lean` in the pristine clone
   must exit 0 with exactly one "declaration uses `sorry`" warning and no error; (F2) in a COPY whose lakefile gains
   one `lean_lib Frozen` (their file byte-identical), the module is built and our audit runs on it: its theorem's
   axioms must be `sorryAx` plus at most the three standard ones, and the constants of its statement must resolve to
   Mathlib's `hyperoperation` (module `Mathlib.Data.Nat.Hyperoperation`), `MvPolynomial`, `Rat`, `Int`. In the same
   file our theorem `∀ k, hyperoperation 4 2 k = T k` with T 0 = 1, T (k+1) = 2^(T k) (so T 1 = 2, the manuscript's
   2↑↑1) is proved and kernel-checked, giving `hyperoperation 4 2 7` = 2↑↑7 and `hyperoperation 4 2 8` = 2↑↑8 exactly,
   and 4 2 1 = 2, 4 2 3 = 16, 4 2 4 = 65536 are decided.
8. **Planted variants**, in a COPY, each appended to one leaf module (the last module of the root's import list that
   no other `ZInQ` module imports; the plant texts are ours, `tools/zq-lean-plants.txt`), the original bytes restored
   and re-hashed between variants. For each: build, our audit, `leanchecker` on the leaf module, and nanoda on a
   `leanexport` of the planted constant's closure. Predictions, fixed here:
   - **P1** (pre-registered) `theorem … := by sorry`: build exit 0 with one new `sorry` warning; the audit flags
     `sorryAx` by both traversals; leanchecker exit 0 (an axiom is not a kernel error); nanoda refuses.
   - **P2** (pre-registered) a new `axiom` and a theorem using it: build exit 0; the audit lists the axiom as a
     declaration of kind axiom and flags both; leanchecker exit 0; nanoda refuses.
   - **P3** `theorem … := by native_decide`: build exit 0; the audit flags `Lean.ofReduceBool`; leanchecker exit 0;
     nanoda refuses.
   - **P4** a theorem of type `False` with value `True.intro`, added by `run_cmd` under `set_option
     debug.skipKernelTC true` (the kernel bypassed at build time): build exit 0; the audit sees NO axiom (its blind
     spot by design, recorded as such); leanchecker exits non-zero with a kernel type mismatch; nanoda refuses. If
     their leaf cannot host it, P4 goes in a new module of the copy imported by the root, said so.
   - **P5** one byte appended to a source: the recorder's re-hash flags exactly that file.
   A control whose outcome differs from its prediction makes the lane REFUSED (an instrument we cannot trust).
9. **Records.** Pod: `tools/runpod-zq-lane4.sh`, run over SSH under `/root/zq-lane4` only; nothing of theirs leaves
   the pod except small text facts (logs, exit codes, timings, RSS, sha256s, our audit's JSON lines naming their
   declarations) into `corpus/zq/runs/lane4-2026-11-06/`. Desk: `tools/record-zq-lean-replay.js` →
   `certs/zq-lean-replay.json`, which takes every number from those facts and re-derives the census, the re-hash
   and the reconciliation from the read-only clone; `--check` re-derives and refuses on any difference, including a
   change to any of our pod-side files after the run (their sha256s are recorded by the pod).

### Lane 4 amendment B, 2026-11-06 (still before any run on the claimant's data)

Our audit, run on the toy project (our bytes only), showed that in v4.35.0 `native_decide` does not reach
`Lean.ofReduceBool`: it adds an auxiliary private AXIOM named `…._native.native_decide.ax_1_1` to the module, which
the theorem then uses. **P3's prediction is corrected to:** build exit 0; the audit lists that auxiliary axiom as a
declaration of kind axiom of the leaf module and flags it, and the planted theorem, by both traversals; leanchecker
exit 0; nanoda refuses. The other predictions stand (P1, P2, P4 came out as predicted on the toy; P4's theorem is
listed with no axiom at all, the blind spot).

### Lane 4 amendment C, 2026-11-06, written AFTER a first pass and BEFORE the pass that is recorded

**The first pass.** The script as first committed (`tools/runpod-zq-lane4.sh` sha256 `482089e3…`) ran every stage
once, 02:21–02:33 UTC, under `/root/zq-lane4/{src,out,work}`. It showed two faults of ours and one of a tool:
(a) the `modules` stage fed all 53 entries of `SOURCE_MANIFEST.json` to `lean`, the 48 modules plus the root, the
frozen file and three non-Lean files (the three errored, as text that is not Lean does); it now takes exactly the 48
entries whose `module` is `ZInQ.*` (the root is covered by the build, the frozen file by F1);
(b) the bundled `nanoda_bin` 0.4.19 overflowed a worker's stack on the full export (exit 134 after 62 s, peak RSS
22 GB); (c) everything else ran: build, our audit, both `leanchecker` modes and `--fresh` exited 0, the plants exited
as predicted. **Nothing of the first pass is imported into the record.** The recorded pass is a second, clean one of
the final script in a fresh directory, `/root/zq-lane4/final` (new clone, new build). What the first pass taught is
written here before that pass:

1. **nanoda with a configurable stack.** nanoda_lib at commit `8de7e0c4` (v0.4.31, upstream HEAD of 2026-10-29,
   unmodified; its PR #78 adds the config key `stack_size_bytes`) is built with `cargo build --release --locked` (Rust
   stable from rustup, under `/root/zq-lane4/final/rust`) and run with `stack_size_bytes` = 1 GiB on the same full
   export and on each planted export; the binary's sha256 and `rustc --version` are recorded. The bundled 0.4.19 is
   run again on the same inputs and recorded; if it overflows again it is a tool row, never a verdict input. The
   nanoda row of the verdict is the v0.4.31 run, and the plants' "nanoda refuses" (exit ≠ 0) applies to both binaries.
2. **The exported view, measured.** On the toy, our audit run from a module-system file (`module`, `public import`)
   sees no private declaration, and sees every imported THEOREM as an axiom (bodies are not exported), so only
   `Lean.collectAxioms` (the stored tables) means anything there. Our audit body is run once that way on the library
   (stage `exported`), informational: prediction, exactly their 704 names.
3. **The reconciliation classes, named from the first pass.** Ours 990 = their 704 + 286, all theorems with
   `_private` names; by the part after `_private.<module>.0.`: last component `_proof_<i>_<j>` (aux proofs, 198),
   `_simp_<i>_<j>` (15), `_arg_pusher` (4), and any other private name (69 = the "private" count of their own
   SOURCE_MANIFEST). The recorder applies exactly this rule; a non-private extra, a count off the manifest's 69, or a
   name of theirs not ours is a disagreement (REFUSED).
4. **The axiom-set comparison, refined.** Their 704 axiom sets are compared with BOTH traversals. In the first pass
   `Lean.collectAxioms` equalled theirs on all 704 (their checker's method, reproduced) and ours equalled theirs on
   700; on 4, the constructors `verum`, `falsum`, `conj`, `disj` of `ZInQ.EquationCompression.EquationFormula`, ours
   is {propext, Quot.sound, Classical.choice} and theirs and Lean's are empty: those constructors' own types mention
   only the inductive, and ours follows the inductive back to its `equation` constructor (whose `MvPolynomial (Fin n)
   ℚ` reaches the three axioms), as Lean's own uncached walk would; v4.35.0's stored table has [] for them (our
   reading: the shared cache's sentinel when the module's table is written). Amendment A's letter would call these
   4 a disagreement; we refine it here, after seeing them, to: it reconciles when Lean's sets equal theirs on all
   704 and ours contains theirs on all 704 with every strict difference listed, all within the three standard axioms.
   That this rule was written after the first pass is said in the record.

### Lane 4 amendment D, 2026-11-06, during the recorded pass (before the step it adds)

The recorded pass (`/root/zq-lane4/final`, 02:39–02:48 UTC) finished every stage. nanoda v0.4.31 did not finish on
the full export: after 61 s two workers panicked with "memory overflow" inside num-bigint's `pow` (its Nat extension,
`src/tc.rs` `do_nat_bin`, computes `arg1.pow(arg2)` for any two literals; Lean's kernel bounds the exponent before it
computes a power). That is a tool limit, not a type error: under amendment A item 5 the nanoda row is REFUSED (tool)
and the verdict rests on `leanchecker --fresh`, which accepted. The bundled 0.4.19 overflowed its stack again.

**Added, informational, never a verdict input except as said:** localize it. A separate script of ours,
`tools/runpod-zq-lane4-nanoda-modules.sh` (the four files of the recorded pass are not touched), exports, for each of
the 48 modules, the closure of that module's non-private declarations (their names from our audit; a private name is
reached only through the public ones that use it) with `leanexport <module> -- <names>`, and runs nanoda v0.4.31 on
each (same config). Recorded per module: accepted, "memory overflow", stack overflow, or the panic's first line. A
module nanoda accepts is a second, independent kernel's acceptance of those declarations and their closure. A panic
that is a type or definitional-equality error on a constant of the 48 modules (not an overflow) would be
investigated before any verdict and, confirmed, would be REFUTED.

*Addendum to D, before its second run.* Its first run stopped in nanoda's PARSER on 7 modules ("assertion failed:
!matches!(safety, Unsafe | Partial)"): the name lists held the 9 compiler-generated `…._unsafe_rec` definitions of
well-founded recursive defs, which our audit flags `partial` (no `partial` or `unsafe` occurs in the sources) and which
nanoda does not accept as input. They are dropped from the lists (the kernel forbids a safe declaration to use a
partial one, so no theorem's closure needs them), the first run's outputs are deleted, and the localization is run again.

### Lane 4 amendment E, 2026-11-06, on the desk after the recorded pass

Two changes to the RECORDER, nothing on the pod. (1) Its first run failed red control P4: the census token boundary
excluded a preceding `.`, so `set_option debug.skipKernelTC true` was not seen as `skipKernelTC`. The boundary now
allows a preceding `.` (qualified uses such as `Lean.ofReduceBool` are seen too); the census over the claimant's 50
files gave the same 13 hits before and after (7 `set_option` in code — `maxRecDepth` and `exponentiation.threshold` —
1 `partial` in a docstring, 4 `macro` in comments, the frozen file's one `sorry`), and P4 then came out as predicted.
(2) The exported-view audit (X1) is 5.8 MB, because in that view every imported theorem is its own axiom; it is
imported reduced to names, kinds and Lean's axiom sets (`--reduce-exported`), its sha256 and size kept.

Lane 4 has run: `certs/zq-lean-replay.json` (`node tools/record-zq-lean-replay.js --check`), facts in
`corpus/zq/runs/lane4-2026-11-06/`.

## What every artifact of Track A says first
"The theorem (ℤ is Diophantine in ℚ) is undecided here: the main Lean target is unproved and nothing in this record
decides it."
