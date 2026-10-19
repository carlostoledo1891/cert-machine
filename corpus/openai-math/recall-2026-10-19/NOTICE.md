# Notice: modified files

The `packets/` directory holds copies of files from OpenAI's openai/math release
(https://github.com/openai/math at fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb), licensed under the Apache License 2.0
(`LICENSE-openai-math`, the release's own license file).

**Twelve of the copies were changed on purpose.** In each of these files, one line of the challenge statement was
altered to plant a known defect for a reading-recall test (2026-10-19):

- `packets/P01/challenge.lean` (family 026, `lean/ComparatorChallenges/PrimeGaps.lean`): line 39 changed
- `packets/P06/challenge.lean` (family 295, `lean/ComparatorChallenges/KadisonRingrose.lean`): line 32 changed
- `packets/P07/challenge.lean` (family 192, `lean/ComparatorChallenges/SquareRootDegree.lean`): line 35 changed
- `packets/P08/challenge.lean` (family 189, `lean/ComparatorChallenges/CycleCliqueRamsey.lean`): line 24 changed
- `packets/P09/challenge.lean` (family 081, `lean/ComparatorChallenges/RieszQuantitative.lean`): line 43 changed
- `packets/P11/challenge.lean` (family 155, `lean/ComparatorChallenges/PeriodicTilingThree.lean`): line 57 changed
- `packets/P14/challenge.lean` (family 156, `lean/ComparatorChallenges/BorsukNine.lean`): line 20 changed
- `packets/P16/challenge.lean` (family 173, `lean/ComparatorChallenges/SeymourSecondNeighborhood.lean`): line 28 changed
- `packets/P17/challenge.lean` (family 369, `lean/ComparatorChallenges/HotSpots.lean`): line 21 changed
- `packets/P18/challenge.lean` (family 005, `lean/ComparatorChallenges/Catalan.lean`): line 8 changed
- `packets/P19/challenge.lean` (family 188, `lean/ComparatorChallenges/TriangleRemoval.lean`): line 57 changed
- `packets/P22/challenge.lean` (family 328, `lean/ComparatorChallenges/ReflexiveFixedPoints.lean`): line 27 changed

`key/key.json` gives every change: the original line, the changed line and why.
**These files are not OpenAI's statements and must not be read as them.** Every other file is a byte copy, or, for
`headline.md`, the release's CONTENTS.md paragraph under a title line. `packets/BRIEF.md` and `packets/README.md` were
written here.
