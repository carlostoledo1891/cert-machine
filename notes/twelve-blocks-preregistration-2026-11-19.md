# Twelve blocks at finite length: the finite facts — pre-registration, 2026-11-19

Written and committed, with the pinned inputs and nothing else, BEFORE any line of the judge exists. The operator's
word (2026-11-19, in the control-room chat, answering "integrate into cert-machine now?"): "All of it now": the target's
row, this pre-registration, and a decision run by a judge that shares no code with either track; on a private local
branch (`twelve-blocks`), nothing pushed, nothing revealed. He also chose a Lean step on the finite lemmas and a
literature check; both run separately and enter the record as their own entries.

PRIVATE until its own reveal.

## What every artifact of this decision says first

"The theorem (V(548m) = M(B_m) for every even m ≥ 118 and odd m ≥ 123; V(n) to within a bounded error at every n; the
exact V(n) for n ≥ 92,000) is NOT decided here. It was proposed by two AI models working together and read by each other,
and it rests on the delta-three certificates (not refereed) and on two paper lemmas no machine has checked. This decides
finite facts only: the constants, identities, counts and tables the proofs display, each on a stated finite domain."

## What this is, honestly

This pre-registration comes AFTER an exploratory run, not before it. On 2026-11-19 (01:47–02:57 UTC) a GPT chat (the
Codex app) and a Claude chat (Claude Code), opened by the operator with one identical message, worked the operator's
brief (`corpus/twelve-blocks/twelve-block-session.md`) through one folder (`~/Projects/multitrack/runs/twelve-blocks`),
with this chat as the control room. The model ids of the two chats are the operator's to state. The run's chat logs,
claim cards, notes and data are copied into `corpus/twelve-blocks/run/`; every file of the run folder, the two tracks'
programs included, is pinned by sha256 in `corpus/twelve-blocks/MANIFEST.json`
(sha256 `f06d89bf7567769894013f66a1f1f4f115b48e694026095a6b89cc93fa3d2c59`). The programs are NOT copied: no code of
either track is an input of the judge.

**Prior observations** (already computed by the control room during the run; they are not predictions, and the judge
recomputes each from its own code):
- M(B_1) = 15,756, M(B_2) = 63,568, M(B_3) = 143,440, M(B_4) = 255,368 (the brief gave the first two).
- The 22-site census at m = 1..8: minimum 0; 51 masks at odd m, the same index sets; the zero mask alone at even m.
- Fifteen 24-site pieces of the wider windows at m = 1, 2: minimum 0 with the expected ties.
- The inner certificate with N + wwᵀ/1024 is VERIFIED by `instruments/delta3/verify.js` (GPT's constant; 948 not yet run here).
- The lattice identity at even n ≤ 40 on 240 colourings; the outside-window bound exact and attained at m = 1..8.
- The bounds of ALLN contain the 45 values of OEIS A121385.
- The run's decider `ap3` (control room's, `~/Projects/multitrack/adapters/ap3.py`) CERTIFIED GPT's six threshold counts,
  Claude's nine anchors and GPT's eight period witnesses.
- A plain single-flip search (tabu from B_m, annealing from random) found nothing below M(B_m) at m ≤ 4.

## Who decides, and what the judge's author has read

Carlos Toledo with Claude Fable 5.2 (model id claude-fable-5-2) in Claude Code, as the control room. The judge is written
by that session from the definitions and from the STATEMENTS below. Read by its author: the brief and its appendix (the
appendix's Python included), the chat, the claim cards, `gpt/global.md`, `gpt/sharper-cutoffs.md`, `gpt/rounding.md`, the
first two sections of `gpt/periodic-optimum.md`, `claude/NOTES-alln.md`, and `gpt/global_verifier.js` (26 lines that call
cert-machine's own verifier). NOT opened: any other program of either track (`window_core.py`, `global_core.py`,
`sharper_cutoffs.py`, `all_length_check.py`, `residue_optima.py`, `core_alln.py`, `window_check.py`, `prune_948.py`, …)
and `gpt/windows.md`, `claude/NOTES-window.md`. The judge reuses the control room's own counter (`ap3`), written before the
run from the definition, and `instruments/delta3/verify.js` (in this repository since 2026-10-05).

## Definitions (labelled sites and colours, no quotient by reflection or colour exchange)

n ≥ 1; a colouring is s ∈ {+1, −1}ⁿ on sites 1..n. M(s) = the number of triples (a, a+d, a+2d), d ≥ 1, in 1..n, of one
colour. V(n) = min M. f(n) = 117n²/2192 − n/2. Unit edges B = (28, 34, 62, 99, 158, 274, 390, 449, 486, 514, 520).
B_m: n = 548m, colour changes after sites B_j·m, red (+1) first. C_n: any n ≥ 1, colour changes after sites
b_j(n) = ⌊n B_j/548 + 1/2⌋, red first (C_{548m} = B_m). Windows at scale m: (B_j m − 2m, B_j m + 2m]. o = m mod 2.
φ_s = the step function s_p on ((p−1)/n, p/n]; Q(φ) = ∬ φ(a)φ(b) over {a/2 ≤ b ≤ (1+a)/2} ⊂ [0,1]².
T_n = ⌊(n−1)²/4⌋. S_e, S_o = the sums of s over even and odd sites.
R_n(s) = ¼ Σ_{p,q} s_p s_q ([2p−q = 1] − [2p−q = 0] + [2p−q = n] − [2p−q = n+1]), p, q in 1..n.

## The claims, at their pins

The cards are `corpus/twelve-blocks/run/claims/*.json` (sha256 in the manifest). In the run each was read by the other
family as "holds"; no decider decided any of them beyond the counts named above.

| card | author | statement, shortened |
|---|---|---|
| H3 | gpt (from the brief's appendix) | D_{m+2}(x) = D_m(x) for every m ≥ 1 and every mask of the 22-site family |
| WINDOW | gpt | for every m, every subset of the 44m window sites has D ≥ 0; ties: the 51 masks (odd), the empty mask (even) |
| GLOBAL, SHARP (+ chat c11) | gpt, claude | V(548m) = f + o for even m ≥ 118, odd m ≥ 123; 2 and 102 labelled minimisers |
| ROUNDED | gpt | M(C_n) − f(n) depends only on n mod 1096; extrema −369/548 and 1453/137 |
| ALLN | claude | f(n) − 281/16 ≤ V(n) ≤ f(n) + 54 for every n; M(B_m) − 14 (16) ≤ V(548m) ≤ M(B_m) for every m |
| ANCHORS | gpt | six counts at m = 192, 195 |
| PERIOD | gpt | V(n) = (117n² + c_r)/2192 − n/2 for n ≥ 92,000, r = n mod 1096; table of c_r, multiplicities, one witness each |

## What is decided: ten finite statements

Each is decided CERTIFIED (it holds on the whole stated domain, computed exactly), REFUTED (a counterexample, printed) or
REFUSED (the judge could not finish or read the input; not a refutation). Integers and exact rationals only.

- **D1, the continuum constant.** The inner certificate `certs/delta3/inner-r20-g24_4_8.json` with N replaced by
  N + wwᵀ/948 (w the cell widths; CERT-FORMAT reads N as the upper triangle of a symmetric matrix) is VERIFIED by
  `instruments/delta3/verify.js`, unmodified; each of the four slab bounds exceeds 1/3792; the cover of [0, ½] is complete.
- **D2, the lattice identity.** 4M(s) = T_n − 3n/2 + (S_e² + S_o²)/2 + n²Q(φ_s) + R_n(s) for EVERY colouring of every
  length 2 ≤ n ≤ 14, and for 200 seeded random colourings at each 15 ≤ n ≤ 80; Q by exact integration over unit cells. On
  the same colourings: |R_n| ≤ J₁ (n even), |R_n| ≤ (J₁ + J₂)/2 + ½ (n odd), J₁ (J₂) the number of odd (even) p with
  s_p ≠ s_{p+1}.
- **D3, the outside-window bound.** For m = 1..12 and m = 118, 123: every site outside the eleven windows has single-flip
  cost ≥ 2m + 2 − o, counted from triples.
- **D4, the arithmetic of the cutoffs and of the bands.** (i) Over integers k ≥ 0, a, b with |a| + |b| ≤ k, k ≡ a + b
  (mod 2) and k²/237 + 2(a−o)² + 2(b+o)² ≤ k + 6o, the maximum of 1 + max(|a|, |b|) + k + |a+b| is 237 (o = 0) and 244
  (o = 1). (ii) 2m + 2 − o ≥ that maximum exactly for even m ≥ 118 and odd m ≥ 123. (iii) min over integers k of
  k²/237 − k is −14042/237, and the least integers ≥ (−14042/237 − 6o)/4 are −14 and −16. (iv) (−237/4 − 11)/4 = −281/16
  and the odd-n analogue is −35/2.
- **D5, the baseline and the 22-site family.** M(B_m) = f(548m) + o for m = 1..24 and m = 118, 123, 192, 195; GPT's six
  threshold counts; the census of the 22-site family at m = 1..8 (minimum 0; 51 masks at odd m with one common index set;
  the zero mask alone at even m); the 22 single-flip and 231 pair-flip costs, each measured by recounting the whole
  colouring, equal at m and m + 2 for m = 1..6.
- **D6, pieces of WINDOW.** Exhaustive censuses of 24-site pieces of the windows: at m = 1 six consecutive windows (6
  choices) and 14 seeded random choices of six windows; at m = 2 three consecutive windows (9) and 30 seeded random
  triples; at m = 3 every pair of windows (55). Each: minimum 0; minimisers exactly the 51 masks lying inside the piece
  (odd m), the empty set (even m).
- **D7, ROUNDED.** For every n = 1..3288, M(C_n) − f(n) equals its value at n + 1096 (n ≤ 2192); over one period its
  minimum is −369/548 and its maximum 1453/137, the maximum at residues 220 and 876 only.
- **D8, ALLN against known values.** f(n) − 281/16 ≤ V(n) ≤ f(n) + 1453/137 for the 45 values of OEIS A121385 (pinned,
  `corpus/twelve-blocks/oeis-b121385.txt`); V(n) for n ≤ 14 recomputed by exhaustion and equal to that table; Claude's nine
  anchors (`claude/alln_anchors.json`).
- **D9, the table of PERIOD, as a table.** 1,096 rows, residues 0..1095 once each; c_0 = 0 with 2 minimisers, c_548 = 2192
  with 102; least and greatest c_r −1476 and 3516; multiplicities between 2 and 536; rounded_delta = 0 on exactly 500
  rows, at most 10; and for every row, with n = r + 3288: M(C_n) − (117n² + c_r)/2192 + n/2 = rounded_delta.
- **D10, the witnesses of PERIOD, in the claimed domain.** For 24 residues (0, 548, 220, 876, the rows of least and
  greatest c_r, and 18 seeded at random) and the least n ≥ 92,000 in each class: the row's witness (C_n with the listed
  sites b_j(n) + e flipped) has M = (117n² + c_r)/2192 − n/2. This certifies V(n) ≤ that value at those 24 lengths and
  nothing about the other direction. GPT's eight witnesses (`gpt/period-witnesses.json`) recounted.

Reported, not a verdict: whether each row's witness also attains the row's value at n = r + 3288 (the claim does not
assert it below 92,000).

## Controls: each must be REFUTED or refused, or the judge is not testing the result

- K1 (D1): the constant 947 in place of 948: the verifier must refuse (not positive semidefinite).
- K2 (D2): the identity without R_n; with −R_n; with d = 0 admitted in M; with T_n = (n−1)²/4 unrounded at even n.
- K3 (D3): the bound 2m + 3 − o.
- K4 (D4): the maxima 236 and 243; the cutoffs 116 and 121.
- K5 (D5): the odd tie count 50; "the zero mask is the only minimiser at every scale"; the control room's plant of the run
  (the first-boundary swap costs m at even m); the pair weight without the midpoint completion (sites 28 and 34 at
  scale 1: the cost of flipping both must differ from the sum of the two single costs by −3, third sites 22, 31, 40).
- K6 (D6): a piece's tie count raised by one.
- K7 (D7): period 548; the maximum 1452/137.
- K8 (D8): "V(n) ≥ f(n) for every n".
- K9 (D9, D10): a row with c_r lowered by 2192; a witness with its first listed site dropped.
Every control the judge fails to refuse is reported as MISSED, by name.

## What is NOT decided here, by name

The centring identity and E ≥ L (paper lemmas of the delta-three record); that D1's verified identity yields
E ≥ μ²/948 (it does through those lemmas); the lattice identity beyond the lengths of D2; the outside-window bound beyond
the scales of D3; WINDOW beyond the pieces of D6 (no full 2^(44m) family is walked, at any m); the localisation and
last-deletion arguments of GLOBAL and SHARP; the affine and polynomial-in-k arguments of H3, ROUNDED and PERIOD; the lower
bound of V in every statement (no V(n) is computed beyond n = 14); the multiplicities of PERIOD; that the tracks' programs
do what their notes say. The theorem's standing after this run: proposed, read once by the other family, its displayed
finite facts decided.

## Predictions

D1–D10 CERTIFIED, K1–K9 all refused. A REFUTED on any of D1–D5 would break the proof as written; on D6–D10 it would break
the named claim. A control MISSED is a fault of the judge, reported and fixed by an amendment, never by editing this file.

## Record and replay

`instruments/twelve-blocks/judge.py --write` writes `certs/twelve-blocks.json`; `--check` recomputes and compares.
D1 runs through Node on the repository's verifier. Changes after this commit are amendments below, each dated, each
committed before the code it changes.
