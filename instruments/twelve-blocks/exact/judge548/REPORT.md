# judge548: the exclusion at the unit scale (E1)

**E.** Let s be any 2-colouring of 1..548 with at most 15,756 monochromatic 3-term progressions, oriented so that it
differs from the twelve-block colouring B in at most 274 sites. Then s agrees with B outside
F = {b−1, b, b+1, b+2 : b a block boundary} ∪ {31, 32, 517, 518} (48 sites).

**Verdict: CERTIFIED** (nine items, `node judge.js`, about 6 s, exit 0 only if certified), relative to this repository's
delta-three verifier for the four slab bounds (gap 1). E is only the localisation: V(548) = 15,756 and the 102 minimisers
need the two certificates U3 and U4 of the record as well.

Written by an agent of the run's control room (Claude Fable 5.2), from the TEXT of `gpt/Localisation.md` (sections 1, 2,
7, 8, 10), the data file `gpt/unit-tangents.json` and `instruments/delta3`. This file is the agent's report, kept by
the control room, which ran the judge again. Two lines of `judge.js` were changed when it was copied here: where it finds
this repository and the data file.

## Gaps and doubts, first

1. **The four slab lower bounds are the delta-three verifier's, not this judge's.** For 110 ≤ k ≤ 274 the argument needs
   each slab polynomial's bound on its mass range; that comes from `verifyCertificate`. What this judge proves itself is
   the link: each certificate's polynomial, written from the finite inequalities, equals the one the verifier builds,
   coefficient by coefficient. The inner identity and both positive definite matrices are proved by this judge's own code.
2. **The charging rule is under-specified at n = 548.** The text states it for n = 1,096. "The pair touches a window" was
   read as: site 2j−1 or 2j lies in some b−1..b+2. Soundness does not depend on the reading; the weights may differ from
   the track's.
3. **The operations' semantics are partly under-specified** (below). The first plain reading reproduced the stated end
   state exactly. Any such reading is sound; it only affects whether the replay closes.
4. **The control "one tangent entry doubled" is not refused in its first instance, and that is correct.** Every rational
   vector gives a true tangent inequality, so a perturbed file is wrong only if its replay stops closing.
5. **The certificate is redundant.** For 87 of the 120 operations the replay still reaches the conclusion without them.
6. **E does not use the constant 948.** The least slab bound already gives Y ≥ 82.49 for every 110 ≤ k ≤ 274, above
   (274 + 6)/4 = 70. The control "947" breaks only item 6's own sub-claim.
7. The random and near-B tests are sanity checks, not proofs. None broke anything.
8. **One implementation, one author; no second program replayed this one.** Inside the judge: the replay's left side
   equals n²L0(y) + (s·x)²/4 − g·x/4 exactly on 30 point boxes, against the verifier's own evaluation; it never exceeds
   the true value on 400 real flip vectors; all 19 colourings with M ≤ M(B) within three flips inside F lie in the final box.
9. Section 7 of the text cites a "Lemma 9" from a section the agent did not read; the bound it is used for was derived
   independently (item 6).

## The chain to E (paper steps over computed facts)

(a) Items 1–3: M(s) − M(B) = Y + R/4 + (S0² + S1² − 8)/8, and (S0² + S1²)/8 ≥ (s·x)²/4, so a competitor satisfies
Y + (s·x)²/4 + R/4 ≤ 1. (b) −R is at most the number of split pairs, at most 2 + k, so Y ≤ (k + 6)/4. (c) Items 4–5:
Y ≥ n²L(y) for each certificate polynomial. (d) For 110 ≤ k ≤ 274 a slab bound gives Y > n²/3792 = 79.19 > (k + 6)/4, so
k ≤ 109. (e) For k ≤ 109 the inner identity and the 120 operations force every exterior cell to 0 flips except the cells
{31, 32} and {517, 518}, each with at most one. (f) The cells still allowed a flip cover exactly the 48 sites of F.

## The nine items

1. The identity 16M = 4T − 6n + 2(S0² + S1²) + K + 4R by comparing coefficients: 74,802 triples enumerated, the constant
   and all 149,878 pair coefficients agree; 0 ≤ G ≤ 4.
2. M(B) = 15,756 by plain count; parity sums 2 and −2; R(B) = 0.
3. The finite quadratic Y and the site fields h_p (8h_p integers from 4 to 442); the expansion checked on 908 flip vectors.
4. F1: 276 cells on the two grids; 1,372 inequalities hold, 872 with equality.
5. F2: 16,900 + 21,316 ordered pairs of cells; every finite inside sum equals n² times the model's area. Hence, for every
   flip vector, Y ≥ n² × each certificate polynomial (the mass domain enters only in the certificates' own bounds).
6. The inner identity exact; P − wwᵀ/948 positive definite (a float-proposed factor, an exactly diagonally dominant
   remainder); five files VERIFIED by the delta-three verifier, cover complete; k ≤ 242, then k ≤ 109.
7. The charging weights: 14 summands charged to probe sites, 260 to site pairs, each soundly; −R ≤ Σ g·x on 152,567 flip
   vectors with the largest excess 0.
8. The 120 operations with 201 tangent vectors replayed: all 116 exclusions close; the end state is the one the text states.
9. E: the 22 window cells' sites are exactly b−1..b+2; the allowed sites number 48, all in F. A falsification attempt over
   766,315 colourings near B found none with M ≤ M(B) and a flip outside F.

## Controls (`node controls.js`; `--quick` for the named ones)

| Control | Outcome |
|---|---|
| the constant 947 | REFUSED at item 6, with an exact vector of negative value |
| one tangent entry doubled (operation 0, vector 0) | NOT REFUSED: the replay still closes, soundly (gap 4) |
| one tangent entry doubled (operation 1, vector 0) | REFUSED at item 8 |
| operation 1 dropped | REFUSED at item 8, on the count only: the replay still ends as stated |
| operation 3 dropped | REFUSED at item 8; 81 later exclusions fail |
| charging weights 0 on the exterior | REFUSED at item 7 (flipping site 58 violates the inequality) |
| a bathtub constant doubled on one cell | REFUSED at item 4 |
| the baseline flipped at site 200 | REFUSED at item 2 (M = 15,811) |

Sweeps: the largest entry of each of the 201 vectors doubled: the replay stops closing in 191. Each operation dropped:
the conclusion is lost in 33 of 120. A bathtub constant doubled on each cell: refused on 270 of 276 (not on six cells
where the inequality has slack). The baseline flipped at 12 sites: all refused.

## Under-specified or imprecise in the text

- Section 10 says k ≤ 243; the quadratic gives 242. Harmless.
- Section 10 says Y dominates each polynomial "on its stated mass domain"; domination holds on the whole cube. Harmless.
- Section 8 does not say whether cells are judged against the same box within one vector (taken: simultaneously), that
  the budget K is updated inside an exclusion's restricted box (it is), that an operation's vectors apply in order to the
  narrowed box (they do), or what `cell`, `lower` and `[index, value]` mean (0-based inner-grid cell, posited lower
  bound, v = value/scale).
- Nothing the unit-scale localisation uses in sections 7, 8 or 10 was found wrong.

## What was read

`gpt/Localisation.md` lines 1–83, 164–238, 249–277 and its headings; `gpt/unit-tangents.json`; `instruments/delta3`
(README, CERT-FORMAT, verify.js, model.js, the first 60 lines of psd.js); `instruments/interval/rational.js`; the five
certificate files. NOT opened: any program of either track (`unit_cells.py` was not opened), the other data files of the
GPT track, anything of the Claude track, sections 3–6 and 9 of the document.
