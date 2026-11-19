# Twelve blocks at finite length: the judge of the finite facts (PRIVATE until its reveal)

Two AI models, working together in one folder (a multitrack run, 2026-11-19), proposed that the twelve-block
colouring behind δ₃ = 117/2192 is exactly optimal on the integers at large scales:

- V(548m) = 117n²/2192 − n/2 + (m mod 2) for every even m ≥ 118 and every odd m ≥ 123, with 2 and 102 labelled minimisers;
- 117n²/2192 − n/2 − 281/16 ≤ V(n) ≤ 117n²/2192 − n/2 + 1453/137 at every length n;
- V(n) = (117n² + c_r)/2192 − n/2 for every n ≥ 92,000, with c_r depending only on r = n mod 1096.

V(n) is the least number of monochromatic 3-term progressions over the 2-colourings of 1..n.

**The theorem is not decided here.** Each model read the other's proofs and found no gap; no machine has checked the
proofs, and they rest on the delta-three certificates (not refereed) and on two paper lemmas. This directory decides the
finite facts those proofs display, each on a stated finite domain, as pre-registered in
`notes/twelve-blocks-preregistration-2026-11-19.md` (committed alone, before any line here).

```
python3 instruments/twelve-blocks/judge.py --write     decide D1–D10, run the controls, write certs/twelve-blocks.json
python3 instruments/twelve-blocks/judge.py --check     the pins, and D1, D2 (to n = 10), D4, D8 again        (~10 s)
python3 instruments/twelve-blocks/judge.py --only D7   one statement, printed
node instruments/twelve-blocks/d1.js 948 947           the strengthened inner certificate, and the control
python3 instruments/twelve-blocks/series.py --check    the two series of the report's figure, recounted
sh instruments/twelve-blocks/lean/check.sh             the one lemma in Lean (lean/README.md)
```

Python 3.9+ standard library; numpy for D3 only; Node for D1 (the repository's own delta-three verifier).

## What is decided

| | statement | domain |
|---|---|---|
| D1 | the inner certificate with N + wwᵀ/948 is VERIFIED by `instruments/delta3/verify.js`; slabs > 1/3792 | the five certificates |
| D2 | the lattice identity 4M = T_n − 3n/2 + (S_e² + S_o²)/2 + n²Q + R_n, and the bounds on R_n | every colouring, n = 2..14; 200 seeded at each n = 15..80 |
| D3 | single-flip cost outside the windows ≥ 2m + 2 − (m mod 2) | m = 1..12, 118, 123 |
| D4 | the arithmetic of the cutoffs (maxima 237, 244; 118, 123) and of the bands (−14, −16; −281/16, −35/2) | exact, exhaustive over a box that contains every feasible point |
| D5 | M(B_m) = f + (m mod 2); the 22-site census; the 253 flip costs equal at m and m + 2 | m = 1..24, 118, 123, 192, 195; m = 1..8; m = 1..6 |
| D6 | 24-site pieces of the 44m-site windows: minimum 0, the expected minimisers | 114 pieces at m = 1, 2, 3 |
| D7 | M(C_n) − f(n) has period 1096; extrema −369/548, 1453/137 | n = 1..3288 |
| D8 | the every-length bounds contain the known V(n) | OEIS A121385, n = 1..45; n ≤ 14 recomputed |
| D9 | the table of 1,096 residues, as a table, against the count of C_n | every row, at n = r + 3288 |
| D10 | each sampled row's witness has the row's value in the claimed domain | 24 residues, the least n ≥ 92,000 of each |
| L1 | Lean 4.35.0 proves the 253 closed-form flip coefficients equal at m and m + 2; tied to recounts | every m ≥ 1 (kernel); m = 1..8 (the tie) |

Controls K1–K9 and KL are planted wrong versions of the same statements; each must be refused, and one that is not is
reported as MISSED in the record. All 19 are refused.

**One statement was first refuted, by a fault of ours.** The first full run (`first-run.log`) decided D9 REFUTED: the
pre-registration had read one field of the models' table, `rounded_delta`, with the wrong sign. Amendment A2 restates D9
(committed before the judge changed); `--redo D9 L1` decided it again and added the Lean step. The record keeps the
first verdict under `amendments` and says which statements the first judge decided.

`corpus/twelve-blocks/readings.json` (who proposed and who read what) is written by hand from the chat logs; the report
page states nothing about a reading that is not in it.

## What is not decided, by name

The centring identity and E ≥ L; that D1's identity yields E ≥ μ²/948; the lattice identity beyond D2's lengths; the
outside-window bound beyond D3's scales; the window theorem beyond D6's pieces (no full 2^(44m) family is walked at any
m); the localisation and last-deletion arguments; the affine and polynomial-in-k arguments; the lower bound of V in every
statement (no V(n) is computed beyond n = 14); the multiplicities of the periodic table; that the tracks' programs do what
their notes say.

## Independence

The judge was written by the run's control room (Claude Fable 5.2 in Claude Code), after the run. Its author read the
brief and its appendix, the chat, the claim cards, and these notes of the tracks: `gpt/global.md`,
`gpt/sharper-cutoffs.md`, `gpt/rounding.md`, the first two sections of `gpt/periodic-optimum.md`, `claude/NOTES-alln.md`,
and `gpt/global_verifier.js` (26 lines calling this repository's verifier). No other program of either track was opened,
and none is imported or executed here: they are pinned by sha256 in `corpus/twelve-blocks/MANIFEST.json`, not copied.
`ap3.py` is the control room's own counter, written from the definition before the run (the run's decider, byte for
byte). The judge shares a model family with one of the two tracks; it is a judge of finite facts, not a reader of the
proofs.

Every formula was written from the definitions in the pre-registration: M by shifts of bit masks and by a loop over
midpoints, Q by exact integration over unit cells, the rounded colouring from ⌊nB_j/548 + ½⌋. No number was tuned to make
a statement pass.
