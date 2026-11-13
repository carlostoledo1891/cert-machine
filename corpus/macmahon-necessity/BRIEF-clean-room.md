# Brief for the clean-room author of route A (sealed with RULES.md, 2026-11-13)

You are writing one program. It must decide, by exhaustive search, a finite statement about MacMahon's 30 cubes.
You work clean-room: what you may read is listed below, and everything else about this problem is off limits.

## What you may read

- `corpus/macmahon/Challenge.lean` in this repository: the DEFINITIONS only (`faceColours`, `exposedFaces`,
  `rotations`, `FaceFits`, `Stock`, `PhysicalBuilds`, `PhysicalUniversal`, `DiagonalZero`, `total`,
  `twoTriangles`). It states theorems with `sorry`; they are the claim under test, not facts you may use.
- `instruments/macmahon/check.py` in this repository (our own earlier program for the other half), for
  conventions. Do not import it: your program stands alone.
- Python's and C's standard documentation.

## What you may NOT read, open or search for

- Anything under `~/Downloads` (in particular any folder or archive named `macmahon-search`).
- In `corpus/macmahon/`: `src/`, `scripts/`, `paper/`, `results/`, `MacMahon/`, `MacMahon.lean`, `Solution.lean`,
  `README.md`, `validation/`, `kernel-run/`.
- `corpus/macmahon-necessity/RULES.md`, `certs/macmahon-*.json`, `tools/*macmahon*`, `HANDOFF.md`, `corpus/targets.json`,
  `site/`, `notes/`.
- The web, for anything about MacMahon cubes, universal sets, Johnson, Roldán, Davies, or this classification.

If you see any of it by accident, say so in your report.

## The model (from the definitions in Challenge.lean)

A cube has six faces in the order +x, −x, +y, −y, +z, −z, coloured with six distinct colours 1 … 6. Two
colourings are the same VARIETY when a proper rotation (a signed permutation of the axes with determinant +1; there
are 24) carries one to the other; there are 30 varieties. A 2×2×2 model has eight corner SLOTS; the slot at sign
pattern (sx, sy, sz) exposes the three faces pointing outward. A cube FITS a slot of a target variety t when some
proper rotation of it shows, on the slot's three exposed faces, the colours t has on those faces. An INVENTORY
gives each variety a count ≥ 0; its total is the sum. An inventory BUILDS t when the eight slots can be filled with
eight DISTINCT physical cubes of the stock (a variety with count k supplies k physical cubes), each fitting its
slot. It is UNIVERSAL when it builds all 30 varieties.

Build all of this from first principles in your own code: the 24 rotations from signed axis permutations, the 30
varieties as rotation classes of the 720 colourings, the slots from the sign patterns. Use the table `faceColours`
of Challenge.lean ONLY at the end, to name each variety by its Lean pair (i, j), i ≠ j, and check on the way that
the table's 30 off-diagonal rows are 30 different varieties.

## What the program computes

For a variant V of the model:

- m*(V): the least total T in 0, 1, …, 12 for which some inventory of total T is universal (or "none up to 12");
- U(V): ALL universal inventories of total m*(V);
- for every total below m*(V), the fact that no inventory of that total is universal.

The variants, selected by a command-line flag:

- `base`: the model above.
- `reflections`: a cube may be placed under any of the 48 signed axis permutations (reflections included).
- `shared`: the eight slots need not receive distinct physical cubes (one cube may fill several slots).
- `useless`: the variety with Lean pair (0, 1), colours [1, 5, 2, 4, 6, 3], fits no slot of any target.
- `required`: only inventories holding at least one cube of the variety with Lean pair (0, 1) are counted.

## Rules of method

1. The search must be EXHAUSTIVE and you must be able to say why in a few sentences. Write that argument in the
   program's header: one sentence for each pruning rule, saying why it can never discard a universal inventory.
2. Decide "builds" by an explicit matching of slots to physical cubes (any correct bipartite matching you write).
   Do NOT use Hall's theorem, or counting constraints derived from it, as the engine of the search.
3. Prune ONLY by rules whose soundness follows from monotonicity: adding cubes to an inventory never breaks a
   build. (For example: if a partial inventory, topped up with the largest stock any completion could still have,
   fails to build some target, no completion is universal.) No symmetry reduction, no appeal to the structure of
   the expected answer, no use of any theorem stated in Challenge.lean.
4. Standard library only: Python 3.9 and, if speed needs it, ONE C99 file built with `cc -O2` (no other
   dependency). Deterministic: no randomness, no time-dependent behaviour, the same output on every run.
5. Each variant must finish on this Mac in well under an hour; say how long each took.

## What you deliver

- `instruments/macmahon/necessity.py` (and `instruments/macmahon/necessity.c` if you use C; the Python file
  builds it into a temporary folder and runs it, never leaving a binary in the repository).
  `python3 instruments/macmahon/necessity.py <variant>` prints ONE JSON object on stdout:
  `{"variant", "m_star", "universal": [ sorted list of inventories, each a sorted list of [i, j, count] with
  count > 0, (i, j) the Lean pair ], "levels": {"0": 0, …, "<m_star>": <count>} (the number of universal inventories
  found at each total searched), "nodes": <search nodes visited>, "seconds": <float>}` and nothing else on stdout.
- Do not write any other file in the repository, do not commit, do not push.
- A report: what you built, the completeness argument, the output of each of the five variants, the times, anything
  you are unsure of, and a line confirming the reading rules were kept.

Do not tell us what the answer "should" be and do not tune the program toward any expected number: report what it
finds.
