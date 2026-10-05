# δ₃ = 117/2192: an independent exact verifier

A claimant (another AI session) says the least number of monochromatic 3-term progressions over
2-colourings of {1..n} is (117/2192)·n² + o(n²). The lower bound reduces to **Theorem A**:
Q(φ) = ∬_R φ(a)φ(b) ≥ −5/137 for every measurable φ:[0,1]→[−1,1], R = {a/2 ≤ b ≤ (1+a)/2}.
The claim comes with five certificates (`certs/delta3/*.json`). This directory checks them.

```
node instruments/delta3/verify.js [--record]   the five certificates, the cover, THEOREM A  (~1–4 s)
node instruments/delta3/battery.js             GREEN checks + red controls (76 lines)    (~5 s)
node instruments/delta3/lemmas.js              exact tests of the paper-proved steps     (~16 s)
node instruments/delta3/mutate.js              one-line mutations of this verifier       (~2 min)
```

`--record` writes `certs/delta3-ledger.json`; `lemmas.js` writes `certs/delta3-lemmas.json`; `mutate.js` writes
`certs/delta3-mutations.json`.

## What is verified, with proof force

All of it in exact rationals or BigInt (`../interval/rational.js`). A float only ever proposes a
Cholesky factor, and the factor counts only after its exact remainder has been checked.

- **φ\* and h.** The twelve blocks, Q(φ\*) = −5/137 from exact block-pair areas, g\* from the
  antiderivative of φ\*, and h = −φ\*g\*. Every place g\* can kink is shown to be a multiple of
  1/1096, so h is linear between those nodes and its 1097 node values determine it. The verifier
  checks that h is continuous (g\* = 0 at every interior edge), that h ≥ 0, that its zeros are
  exactly the 11 breakpoints, that its one-sided slopes there are ∓1 or ∓3/2, and that
  ∫h = 5/137 = −Q(φ\*).
- **Grids.** The cut points are integers from 0 to 1096, strictly increasing, and include every
  edge of φ\*. For every ordered cell pair, the area of R ∩ (I_i × I_j) is computed two ways: by
  the trapezoid rule on the section length (exact, because its kinks are listed), and by polygon
  clipping with the shoelace formula. The two must agree exactly. Each pair is then classified as
  full, cut or absent.
- **Bathtub constants.** These are recomputed from h: a_i = w_i·min h, b_i = w_i²/(2·sup m′). Here
  m′ is the derivative of the distribution function, so it is the sum of 1/|slope| over every piece
  of h at that level (see "Readings" below).
- **Slabs.** The verifier builds p = L_θ − B − Σμ_f f itself. It uses its own a, b and areas, and
  only the file's θ and μ. Every form must be visibly nonnegative on the region: either a product
  of factors from {y_i, 1−y_i, m−lo, hi−m}, or a triangle form on three distinct indices with
  s₁s₂s₃ = +1. It then proves S + εI ⪰ 0 exactly and recomputes the bound B − ε(1+n), which must be
  > 0 and at least the file's `claim`.
- **Inner.** L₀ minus the multiplier terms must have zero constant and zero linear part, so each
  c_i equals exactly what the linear budget leaves. Its quadratic part P must be proved ⪰ 0. Every
  multiplier must be ≥ 0, with N ≥ 0 entrywise, which is enough because y ≥ 0.
- **Cover.** The verified regions must cover m ∈ [0, 1/2]. The map φ → −φ sends σ to 1 − σ, so it
  sends m to 1 − m and leaves Q unchanged.
- **PSD** (`psd.js`). The matrix is rescaled exactly by powers of 2. A float Cholesky factor of
  A − 2⁻ᵏI is rounded to a dyadic matrix L. The remainder A − LLᵀ is computed exactly and must be
  diagonally dominant (Gershgorin). If that fails, the verifier looks for an exact witness
  vᵀAv < 0, and if there is none, it runs fraction-free Bareiss elimination on the leading minors.
  A matrix with a zero leading minor is refused, never passed.

## What is only tested

These steps are exact tests on chosen cases, not proofs. They cover the steps that
THEOREM-EXACT.md proves on paper. The derivations were re-done by hand while building this, and
they hold.

- The centring identity E(σ) = ∫hσ + Q(φ\*σ), and the symmetry E(σ) = E(1−σ).
- The discretisation lemma E(σ) ≥ L(y), using the verifier's own L, on step functions finer than
  the grid. The cases are random σ, σ on the exact bathtub minimiser, cell indicators, flips next
  to a breakpoint, mass on cut pairs, near-φ\* and random colourings, and constants. Here E is
  computed from areas alone, with no h.
- The bathtub inequality at its exact minimiser {h < v}, on every cell.
- The exact number of monochromatic 3-APs of the PRS colouring of {1..548k}. This is the upper
  bound side.
- A landscape probe: exact-integer greedy descent over ±1 colourings of 1096 cells.

The reduction from Theorem A to δ₃ (PRS Lemma 1) was re-derived by hand and is not
machine-checked.

## Readings chosen where the text is ambiguous (always the sound direction)

- **"max m_i′"** is read as the supremum of the summed derivative, not as the largest single
  1/|slope|. The two differ on 18 of the 130 cells and 20 of the 146 cells, where h is not
  monotone. The single-piece reading is false: `lemmas.js` finds exact violations of the bathtub
  inequality under it. A flat piece of h would force b = 0, but none occurs.
- **Triangle forms** with a repeated index are refused. The text's nonnegativity argument needs
  multilinearity.
- **The inner identity** is required to hold exactly. A leftover linear residual is refused, not
  absorbed.
- **A PSD matrix that is singular** at a leading minor is refused, because the verifier proves
  positive definiteness or nothing.

## Independence

Built clean-room on 2026-10-05.

What was read: `claimant/THEOREM-EXACT.md`, `CERT-FORMAT.md`, the five certificate files, and this
repository's `instruments/interval/rational.js`.

What was not read: anything under `frontier-apps` (the claimant's code, paper, page and logs), and
`certs/delta3/frontier/` (the claimant's verifier logs).

Every formula was derived from the mathematics: φ\*, g\*, h, the areas, the bathtub constants and
the residual matrices. No number was tuned to make a certificate pass.

## The claimant's side (added by the porting session, after this verifier was finished)

`claimant/` holds the claim's own text (`THEOREM-EXACT.md`, lifted first, the only claimant file this
verifier was written from) and, lifted afterwards, the claimant's generators, its verifier
(`vcheck.py`), its forgery and mutation tests, and the s34 note with the reduction. They are exhibits,
pinned byte-for-byte in `PROVENANCE.json`; none of them is imported here. The claimant's verifier is
re-run from the pinned bytes (`certs/delta3/claimant-vcheck-rerun.log`, python-flint 0.9.0 from
`instruments/erdos1/.venv`); it agrees. The generators import `../model.py` from their old layout and
are not meant to run in place: the certificates are the record, and regenerating them (a
nondeterministic SDP solver) would prove nothing.
