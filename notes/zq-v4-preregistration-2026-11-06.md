# ℤ is Diophantine in ℚ, Version 4 (Glazer et al., 2026-11-06): the explicit quartic — pre-registration, 2026-11-06

Written and committed BEFORE any code of ours runs on the Version 4 package. The operator's word (2026-11-06, ~19:00
UTC): "Pre-register, then check it", to "a clean-room recount of the quartic (variables, degree, its certificate
checks) from his prose, pre-registered before any code. Local first, a pod only if needed, under the same cap."

## What every artifact of this decision says first

"The theorem (ℤ is Diophantine in ℚ) is undecided here. This decides the finite algebra of Version 4: that the
published quartic is the stated polynomial, that it is the sum of the squares of the published residuals, and that the
published certificate carries the published arithmetic source to those residuals by the steps the manuscript describes.
It does not decide the source's arithmetic theorem (thm:quartic-selected-source) or the inherited hypotheses it rests
on."

## The claim, at its pin

- github.com/elliotglazer/diophantine-z-q at `5cb2c1997dde6e358f3c2fe9bbdb4b8f4c23bac6` (Version 4, the head when this is
  written), read from a sparse read-only clone, `~/Projects/zq-scout/v4-5cb2c199`. The repository has no licence:
  nothing of it is copied into cert-machine; every tool reads the clone and checks sha256 first.
- The manuscript `quartic_4973.tex`, sha256 `d1700d3450e9646422516efc0d37ca657b89b7a10734496d7fc02a2c09b12c34`:
  Theorem `thm:quartic` (lines 8695–8711), §"Literal specification and coefficient file" (8713–8729), §"Exact source
  specification and audit boundary" (10036–10063), §"Quadratic reductions preserving the rational input projection"
  (10065–10177), §"Finite realization and proof of the quartic theorem" (10179–10241).
- The package `quartics/quartic-4973/`, each file's sha256 checked against the package's own
  `reproducibility/manifest.json` and, where the TeX states one, against the TeX:
  `polynomial.expanded.txt` `094f6a7e…` (TeX), `polynomial.expanded.txt.gz` `ac7ddfb1…`, `residuals.json.gz`
  `67fa6e25…`, `weights.json` `3dd137c9…`, `variable-map.json` `24029200…`, `certificate.jsonl.gz` `81ca7684…` (TeX),
  `source-residuals.jsonl.gz` `94f8a197…` (TeX; uncompressed `4a82d9a8…`, TeX), `source-entry.json` `39af6e35…`
  (named by the certificate's first line).

## What is not decided (stated before anything else, in every artifact)

The theorem. Theorem `thm:quartic-selected-source`, that the source's rational input projection is ℤ, with the inherited
hypotheses and qualifications of the manuscript's §`sec:degree8-original` and Appendix `app:sources` (among them the
sharper five-contact height estimate, `thm:quartic-height19`). That the 4,513 source residuals are the modules the
manuscript describes (the package's own source audit, not replayed here). The proofs in prose that each kind of step
preserves the rational input projection: they are elementary and are READ, not decided, except where a polynomial
identity they display is checked below. Nothing here is a Lean proof.

## Independence

Our code is written from the TeX sections above and from the JSON as it stands. Before this note, the package was
inspected for its file list, the manifest's `expected` block, the keys of each certificate step kind and one example
step of each kind; no code of ours had computed anything from it. None of the repository's `.py` (`verify_certificate.py`,
`reproducibility/*`, `source/compiler/*`) is run, read or ported. Node.js with BigInt, exact rationals, on the Mac; a pod
only if the Mac cannot, under the US$50 cap (≈US$4.3 spent).

## Procedure

One decider, `tools/zq-v4.js`, writes `certs/zq-v4.json`; `--check` re-derives it from the clone and refuses on any
difference, including a change to the decider after the record was written. Three questions, in order; each its own
verdict.

- **V1 the coefficient table.** `polynomial.expanded.txt` read under the TeX's rules: one comment line, then each line a
  nonzero signed integer and a nondecreasing list of variable indices; like terms collected; rows in lexicographic
  index-list order; the gzip companion the same uncompressed bytes. Then, from the table: the byte count 1,622,053 and
  the sha256 (TeX); 72,925 nonzero monomials; total degree exactly 4; variables 4,973 (indices 0…4,972, each occurring),
  so 4,972 witnesses besides X₀; ‖Φ‖∞ = 685,783,949,153,203,534,233,890 and < 2⁸⁰. Each number agrees, or V1 is REFUTED
  with the number that differs.
- **V2 the sum of squares.** `residuals.json.gz`: 4,552 integer polynomials, each nonzero and of total degree ≤ 2;
  `weights.json` 4,552 ones; `variable-map.json` a bijection of 4,973 indices fixing 0. Our own expansion of Σ Rᵢ² equals
  the table exactly, every coefficient and cross term. CERTIFIED, or REFUTED with the first monomial that differs.
- **V3 the certificate.** Replayed from the source (`source-residuals.jsonl.gz`: 4,935 coordinates with X₀, 4,513
  residuals, its header's counts) through its 553 lines, keeping the current system (rows by id, variables in use).
  For each kind, the condition the prose states, checked exactly on the current system:
  - **initial** (the quadratic lift): every gate a fresh variable with the defining row `v − x_a·x_b`; every reuse an
    unchanged source row that is such a definition up to nonzero scale; the definitions acyclic; each lifted row of
    degree ≤ 2 and, with every definition substituted back, equal to its source row; the input never a target.
  - **linear**: the new row is `a·R_target + b·R_other` exactly, `a ≠ 0`, other ≠ target, `R_other` retained.
  - **eliminate** (rational definition elimination): the defining row is `c·v − F` up to nonzero scale with `F` free of
    `v` and `F/c` the recorded replacement; every row containing `v` besides it is listed as affected and becomes a
    nonzero rational multiple of itself with `v := F/c`; afterwards `v` occurs nowhere; degree ≤ 2.
  - **relation_eliminate**: the defining row is `x − N(y)` up to nonzero scale, `N` the recorded replacement; for each
    affected row the identity `F_j(N(y), y) = λ_j·G_j(y) + Σ_k M_jk(y)·H_k(y)` holds exactly, `λ_j` a nonzero rational,
    each `H_k` an unchanged `x`-free row not replaced in the step; `x` occurs nowhere afterwards; degree ≤ 2.
  - **shear**: each affected row becomes a nonzero rational multiple of itself with `v := v + c·w`, `c` the recorded
    rational, `w ≠ v` retained; every row containing `v` is affected; degree ≤ 2.
  - **circuit**: old and new rows are product definitions over the same base `r`; the outputs keep their identities and,
    as polynomials in `r` through each definition chain, the same values (the prose: `r², r²⁴, r⁸⁰`); deleted internal
    targets occur nowhere outside the replaced rows; new internal targets are fresh.
  - **parity_conic**: the old block, definitions substituted, is the prose's four equations in `(b; t, U, e, p, q, s, h)`
    up to nonzero scale, its old witnesses occurring nowhere else; the new rows are the prose's nine equations in
    `(b; u, v, a, z, e, p, c, w, s, q, j, k)` up to nonzero scale, the new variables fresh; the two identities the prose
    displays and the forward map's substitution into the nine are checked as exact rational-function identities. The
    converse's case analysis (`b = 0`, `u = −b`) is read.
  - **weights** and **final**: the weights are all one; after the variable map (its direction read from the data, the one
    under which the replayed rows equal `residuals.json`), the replayed system is exactly the 4,552 published residuals,
    each up to sign, and the final report's counts agree.

  Input coordinate 0 is never deleted or redefined, and every new coordinate is fresh, at every step. CERTIFIED when
  every line checks and the end is the published residuals. REFUTED when a condition the prose states fails on fields
  whose meaning is fixed by the prose and the data (a false identity, a removed coordinate still in use, a degree above
  two): the record names the line, the step and the condition. REFUSED when a field's meaning cannot be fixed from the
  prose and the data alone: the record names the field; we do not then read their code to settle it.

## Controls (each must be refused by the same code that decides)

- **C1** one coefficient of the table changed by one: V1 and V2 refuse.
- **C2** one residual dropped, and separately one weight set to 2: V2 refuses.
- **C3** planted certificate mutants, one per kind: a gate's product changed (initial); `a = 0` (linear); one affected
  row left out (eliminate); one multiplier coefficient changed (relation_eliminate); the shear scalar changed; `r²⁴`
  defined as `r¹⁶·r⁴` (circuit); one coefficient of a new parity equation changed; and input 0 deleted. Each refused at
  its line.
- **C4** our polynomial arithmetic against a red list: random identities and planted non-identities, in BigInt.

## Verdict words, written down now

V1 and V2 we expect CERTIFIED (the package says its own checker passed). V3 we expect CERTIFIED or REFUSED on a field we
misread; a REFUTED would be a finding, sent to the authors on the operator's word. The record and `/z-in-q/` state each
verdict with the "not decided" paragraph above first; any reply on elliotglazer/diophantine-z-q#3 is the operator's word.
