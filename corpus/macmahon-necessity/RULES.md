# MacMahon cubes, the necessity half: the rules, written before anything is run

Written 2026-11-13, before the reader's search was run here and before a line of our own search existed.
Sealed (Verify Seal, the digest in `seals/registry.jsonl`) and committed in the same push. Every change after
that is a dated amendment at the end of this file, with the text it replaces.

## Why

`/reports/macmahon.html` says the classification was "decided twice". That is true of one half only. Our program
(`instruments/macmahon/check.py`) decides that the ten released sets ARE universal. That no other collection of
12 cubes is universal, and none of 11 or fewer, rests on the claimant's Lean proof, which we passed through two
kernels: a repeat of a check the claimant's own CI and the Palomar registry had run. A reader pointed this out on
2026-11-12 and sent an exhaustive search for the missing half. These rules say how that half is decided here.

## The claim (necessity)

In the model of the pinned `corpus/macmahon/Challenge.lean` (sha256 7bfd5839…, `corpus/macmahon/PINS.json`):
30 varieties; an inventory gives each variety a count; an inventory BUILDS a target variety when the eight corner
slots of a 2×2×2 model can be given eight DISTINCT physical cubes of the stock, each under one of the 24 proper
rotations, so that the three exposed faces of every slot show the target's colours (inner faces free); it is
UNIVERSAL when it builds all 30.

> N. Every universal inventory of total at most 12 has total exactly 12 and no repeated variety, and there are
> exactly ten of them: the ten two-triangle sets, which are the ten released sets.

For a variant V of the model write m*(V) for the least total of a universal inventory, searched over totals
0, 1, …, 12, and U(V) for the set of ALL universal inventories of total m*(V). N says: m* = 12, U has ten
members, each with every count at most 1, and U is the ten released sets.

## Three routes that share no code

- **Route K (exists).** The claimant's Lean proof through Lean's kernel and nanoda (`certs/macmahon-kernel.json`).
- **Route R, the reader's search, replayed.** Five files, named here by sha256 and NOT copied into this
  repository (they carry no licence line; the reader is credited as "a reader"):

  ```
  dbd83c1599e1709341b99e85db233ed982e1c0b47035e63f168de97560b0c482  README.md
  aeb04fb942cbbf9b18912ad84847ca1655f7f1611d0e51138aee3732e820ff03  gen.py
  4cee536cb41e330e702f3e4bb9c32e2a376d3ff29a4bf5162fba5a1d318277c1  dfs.c
  99d5ec3ebdf2dfa11c86d98a4401309336302497f6cc5824d8801d67fa54fb09  describe.py
  5b605839b4beec94ecf3cf3302145c0125c2b850ef2b7d8bedb6a62905572ba2  leaves.txt
  2b33347f2db8d1c72db06f4d23746efc20b03b800211b9a51d96cd07147b2f5e  macmahon-search.tar.gz
  ```

  Its method, as read on 2026-11-12 (not run): Hall's theorem turns "builds" into counting constraints; a
  depth-first search raises one variety of a violated constraint at a time and freezes the varieties tried before.
- **Route A, ours, written clean-room.** A program written by an author who has seen neither the reader's files
  nor the claimant's search (`src/cubes.cpp`, `scripts/`, the paper) nor the Lean proof files; the author's brief is
  `BRIEF-clean-room.md` beside this file and is sealed with it. To make the two searches differ in METHOD and not
  only in bytes, route A may not use Hall's theorem as its engine: it decides "builds" by an explicit matching of
  slots to physical cubes, and it may prune only by rules whose soundness follows from monotonicity (adding cubes
  to an inventory never breaks a build). It lands at `instruments/macmahon/necessity.*` and is what the public can
  re-run.

## What passes

**Route R.**
- R1. The five files and the archive have the sha256 above.
- R2. Run unchanged in a scratch copy, in the README's order (`gen.py`, `dfs.c` built with `cc -O2`, `describe.py`):
  `gen.py` prints 30 types, 40 signatures, and 6,290 as its count of constraints (whether that is its raw or its
  kept count is recorded).
- R3. `dfs` prints `nodes 156751 leaves 10`, and the `leaves.txt` it writes is byte-identical to the one shipped.
- R4. `describe.py` passes its own assertions and matches 10 distinct splits of 10.
- R5. The same `dfs.c` built with `-O0 -fsanitize=address,undefined` gives the same output with no report.

**Route A.**
- A1. m* = 12: no universal inventory at any total 0 … 11; exactly ten at total 12; every count in them ≤ 1.
- A2. Its completeness argument is written in the program's header, one sentence per pruning rule.

**The two against each other and against the release.**
- X1. Route R's ten leaves and route A's ten inventories are the same ten sets of varieties (compared as
  colourings up to proper rotation, by the recorder's own code).
- X2. Named through the pinned table `faceColours` (which `certs/macmahon-witnesses.json` T1 decided lists all 30
  varieties once), the ten are `twoTriangles s` for the ten splits of six labels into two triples, and are the
  ten `cubes` lists of the pinned `results/universal_witnesses.json`, set for set.

**Red controls.** Each is a change to the MODEL, made in both routes (in route R as a patch of a scratch copy,
described in words in the record, the patched bytes kept private). With c0 = the variety labelled (A, b), Lean
pair (0, 1), colours [1, 5, 2, 4, 6, 3]:

| | the change | passes when |
|---|---|---|
| C1 | reflections allowed: 48 signed axis permutations instead of 24 | (m*, U) differs from the base result, and both routes report the same (m*, U) |
| C2 | the distinct-cubes rule dropped: one physical cube may fill several slots | the same |
| C3 | a planted falsehood: variety c0 fits no slot of any target | both routes report m* = 12 and U = the SIX two-triangle sets without c0 |
| C4 | a planted demand: an inventory must also hold at least one c0 | both routes report m* = 12 and U = the FOUR two-triangle sets with c0 |
| C5 | the cap at 11 | route R built with `LIM 11` prints 0 leaves; route A's totals 0 … 11 are empty (A1) |
| C6 | a planted false theorem on route K: `Challenge.lean` with `physical_exactly_ten` changed to `= 9`, the Solution unchanged, one run of `.github/workflows/macmahon-kernel.yml` | Comparator does not accept (no "Your solution is okay!", a non-zero exit) |

The numbers six and four in C3 and C4 are consequences of N (a pair of labels lies on one side of four of the ten
splits). They test that each search RESPONDS to the model; they are not evidence for N by themselves. C1 and C2
carry no predicted number: what is recorded is whatever both routes find, and that they agree.

## The word

- **CERTIFIED** (the necessity half, by exhaustive search, twice, no shared code): R1–R5, A1–A2, X1–X2 and C1–C6
  all pass.
- **REFUTED**: only on an explicit witness: an inventory of total ≤ 12 outside the ten that `check.py`'s own
  `builds` (the sufficiency side's matching, a third piece of code) confirms for all 30 targets.
- **REFUSED**: a route cannot finish on this machine within an hour per variant, or a control is dead (it did not
  move the result), or the two routes disagree and the disagreement is not traced. A dead control is replaced only
  by a dated amendment. A traced bug is fixed by a dated amendment, the earlier output kept.

## What the result will NOT say

- Not a proof in the kernel's sense. Each search is complete by a written argument and a program; neither is
  machine-checked. The Lean proof stays the only formal route. What changes is that the hard half no longer rests
  on it alone.
- Not that the public can re-run route R: its bytes are not published. Route A and the recorder are.
- Not more than the model: "physical cubes" enter through the discrete model the paper declares, as the page
  already says.
- Nothing about Johnson and Roldán's own wording: a statement written by hand from their paper is a later item.

## Machine and order

This desk (Apple clang 21.0.0, Python 3.9.6), no pod. Order: these rules sealed → route R replayed → route A
written and run → the controls on both → X1, X2 → C6 (one free hosted run) → the record
`certs/macmahon-necessity.json` and its battery → the page rebuilt locally (the title true for both halves; the
open list regrouped, none deleted; the two-commit detail moved to the record), pushed only on the operator's word.

## Amendments

(none)
