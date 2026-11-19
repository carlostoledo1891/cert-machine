# The goal: twelve blocks at finite length

The operator's brief is `inherited/twelve-block-session.md`. Read it in full: it is the target, in his words.
This file adds what the control room knows, what a plain search finds, and how claims are decided in this run.
Where the brief says "open the Cert-Machine checkout", this run says: work in this folder. Integration into
cert-machine (target memory, pre-registration, handoff, publication) is the control room's and the operator's,
after the run.

## The question

Colour the integers 1..n, n = 548 m, in twelve alternating blocks, red first, of lengths m times

    28  6  28  37  59  116  116  59  37  28  6  28

This colouring is B_m. M(c) is the number of triples (a, a+d, a+2d), d >= 1, all three sites in 1..n, all of one
colour, each counted once. V(n) is the minimum of M over all 2^n colourings. Sites and colours are labelled:
a quotient by reflection or colour exchange is stated wherever it is used.

For even m, M(B_m) = 117 n^2 / 2192 - n / 2. **Is V(548 m) = M(B_m) for all sufficiently large even m?**
One strictly better colouring settles one length. A construction that beats B_m for unbounded even m refutes
the eventual claim. A matching lower bound proves it.

The brief's order of work: (1) challenge the all-scales claim H3 below; (2) explain the 51; (3) give the global
conjecture a serious chance to fail, starting with the wider window b-1, b, b+1, b+2; (4) try a shortcut to a
theorem (stabilisation scale as a function of window width, then localisation). A smaller theorem with a short
proof is worth more than another table of large searches.

## What is already known

Finding any of this again is a correct reproduction, not an advance.

**Literature** (control room, two web searches on 2026-11-18; not a full literature check):
- V(n) = (117/2192) n^2 (1 + o(1)). Upper bound: Parrilo, Robertson, Saracino 2008 (the twelve blocks). Lower
  bound: the delta-three report, https://carlostoledo.co/reports/delta3.html (five exact certificates; not
  refereed). Butler, Costello, Graham 2010 found the blocks again by experiment. Greenwood, Kariv, Williams 2023
  (arXiv:2301.00336): optimal among antisymmetric colourings with at most twelve blocks.
- OEIS A121385: V(n) exactly for n <= 45 (V(45) = 86; the last values by integer programming, R. Pratt 2014),
  upper bounds for 46..50. A121386 counts the minimising colourings.
- Nothing found on V(n) at n = 548 m, on the term after n^2, or on B_m being exactly extremal at any length.
  The asymptotic result allows a finite improvement of size o(n^2).
- The report's correction of 2026-10-20: its lower bound L satisfies E >= L with L(0) = 0 and nothing more. L is
  NOT a first-order-exact estimate near the minimiser (for sigma = t on [0, 16/1096], E - L has a linear term).
  Do not borrow a near-minimiser estimate from it. `inherited/delta3-README.md` says what its verifier checks.

**Inherited from one Codex chat** (OpenAI family). Claimant evidence, not yet reviewed by anyone:
- H1. M(B_1) = 15,756 and M(B_2) = 63,568.
- H2. The 22-site family (at each of the eleven interior boundaries b, sites b and b+1 flip independently):
  the minimum of D over the 2^22 masks is 0, attained by 51 masks at scale 1 and by the zero mask alone at
  scale 2. At scale 1 flipping 28 and 29 keeps the count; at scale 2 flipping 56 and 57 adds two.
- H3. D_{m+2}(x) = D_m(x) for every m >= 1 and every mask x of that family, where
  D_m(x) = M(B_m with x flipped) - M(B_m). The argument is the brief's appendix: 253 coefficients, each affine
  in m on a parity class for m >= 5, with equal values at 5, 7 and at 6, 8.
- H4, the question itself: a conjecture. Nobody has claimed it.

**Decided by the control room before the run** (`control/prior/`, decider `ap3`, which shares no code with the
appendix):
- H1 holds, each count made by two programs. M(B_3) = 143,440 and M(B_4) = 255,368. At m = 1 and 3 the count
  is one more than 117 n^2/2192 - n/2 (two scales observed, nothing proved for odd m).
- The 22-site census at every scale 1..8: minimum 0; 51 masks at m = 1, 3, 5, 7, the same 51 index sets each
  time; the zero mask alone at m = 2, 4, 6, 8. This agrees with H2 and is consistent with H3. It does not
  prove H3 (it compares minimisers, not all masks, and stops at 8).
- The appendix's script runs as printed and exits 0 here.

## What a plain search already finds

`control/baseline/` (control-room scripts, numpy; a search, not a judge; every best was recounted from bits).
- Every single flip and every pair of flips, anywhere in 1..n: at m = 2 each single flip costs at least +2 and
  no pair costs <= 0. At m = 1 each single flip costs at least +1 and exactly 16 pairs cost 0, all at boundary
  sites: (28,29) (62,63) (62,99) (63,100) (99,100) (99,158) (100,159) (158,159) and their mirror images.
- Tabu search from B_m, 300,000 steps, three seeds, m = 1, 2, 3, 4: nothing below M(B_m).
- Simulated annealing by single flips from uniformly random colourings: at m = 2, 7 of 8 runs end on B_2 itself
  (up to colour exchange) and one at M(B_2) + 1, four sites away; at m = 4, one of 2 on B_4 and one at +1, two
  sites away; at m = 1 and m = 3 every run ends at exactly M(B_m), 2 to 7 sites from B_m.
So: single-site local search does not beat B_m at m <= 4, and it finds B_m from nothing. A candidate has to come
from somewhere a single-flip search does not reach.

## What would be new

In rising order: a reviewed proof of H3, or its first failing scale and mask; a description of the 51 that a
person can check, and a decomposition of the even-scale cost into nonnegative integer penalties; the same
analysis for the 44-site window; a colouring with M < M(B_m) at any n = 548 m (the strongest single fact this
run can produce: one file decides it); a stabilisation bound in terms of window width; a localisation lemma;
V(548 m) = M(B_m) for some m, with a lower-bound certificate.

## Who does what

- The two tracks do the mathematics and the searches. The control room decides claims and has no vote.
- The appendix is from the OpenAI family. A reading of H3 that counts as the other family's is the `claude`
  track's. To put an inherited claim on the ledger, a track posts it as its own `claim` and answers for it;
  the other track checks it. Suggested first move: `gpt` posts H3 with the appendix as its file; `claude` first
  derives the coefficients from the definition and the statement alone, and only then reads the appendix's code.
- If the first disagreement appears, keep the scale, the mask and the direct triple count.
- The control room may post claims it knows to be false. Read before you build.
- Lean is off. If a combinatorial lemma is worth a Lean proof (the transfer from two scales to all scales is
  the brief's example), say so with `mt ask` and state the declaration you would want checked.

## The deciders of this run

- `ap3` (the main one): colourings, counts, comparisons with B_m, and exhaustive censuses of up to 24 sites.
  Format below. Its source is `control/decider-ap3.py`, for reading; the copy the control room runs is its own.
- finite cores (`--core FILE`): a proof's finite part. One Python script, standard library only, exact
  arithmetic. It is run alone in an empty folder for at most ten minutes, so it must carry its own data (it
  cannot open your other files). A lower-bound certificate too large for that: `mt ask`, and name the files.
- `claimbox`: a claim that is finitely many exact facts in the claimbox language (`inherited/claimbox-GUIDE.md`).
  Use it only where the printed-back statement is the claim you mean; `ap3` is clearer for anything about M.
- `mfg` is listed by the tool and has no use here.

## Formats for `ap3`

One JSON file, `{"items": [ITEM, ...]}`, at most 200 items, posted with `--object FILE --adapter ap3`.

A colouring with at least one stated fact:

    {"name": "swap at the first boundary, scale 2",
     "coloring": {"base": 2, "flip": [56, 57]},
     "count": 63570, "delta": 2, "beats": false}

`coloring` is one of: `{"base": m, "flip": [sites]}` (B_m with those sites flipped), `{"runs": [...],
"first": "R"}` with `"n"`, `{"string": "RRBB..."}` with `"n"`, `{"red": [sites]}` with `"n"`. Sites are 1..n.
Facts: `count` (M is this integer), `delta` (M - M(B_m), n = 548 m only), `beats` (M < M(B_m), strictly).
n up to 200,000; counted by two programs up to n = 12,000 and by one above.

A census over all subsets of a set of sites:

    {"name": "22 sites, scale 1", "census": {"m": 1, "offsets": [0, 1], "min": 0, "ties": 51}}
    {"name": "my own family",     "census": {"m": 2, "sites": [55, 56, 57, 58], "min": 0, "ties": 1}}

`offsets` means the sites b + e for each interior boundary b of B_m and each listed e. At most 24 sites, m <= 21.
The verdict file lists the minimising subsets. A family of more than 24 sites needs a proof with a finite core.

A fact that holds is CERTIFIED; one that fails is REFUTED and the number found is printed; a file the decider
cannot read or will not finish is REFUSED, which is not a refutation.

## Controls every independent replay should pass

From the brief; a replay that cannot tell these apart has not tested the result.
- At scale 1 the pair coefficient of sites 28 and 34 is -3; its three triples have third sites 22, 31, 40.
  Dropping the midpoint completion gives -2, and the first-boundary swap still passes: that test alone is weak.
- Dropping the diagonal subtraction in the linear coefficient breaks integrality.
- Also plant: d = 0 admitted; the odd tie count as 50; "the zero mask is unique at every scale".
Report every planted error your checks missed.

## The final report (`mt done`)

Lead with one sentence: the strongest result and its domain. Then the proof or the smallest counterexample, a
replay command, what each falsifier did, and the gap that remains to V(n). Keep conjecture, numerical evidence,
exact computation and proof apart. A public priority claim would need a fresh literature check; that is the
operator's.
