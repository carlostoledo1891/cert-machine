# Lane-S recall experiment: how the planted set was chosen and built

Built 2026-10-19. The source is the openai/math clone at fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb,
which was checked clean and whose challenge files hash to the `statementSha256` values in
cert-machine's `corpus/openai-math/release.json`. The recorded words come from cert-machine's
`certs/openai-math-statements.json`. Nothing in either tree was modified.

## Eligibility

A family is eligible when it meets all of these:

- Its recorded lane-S word is MATCHES.
- It has exactly one Comparator challenge.
- That challenge has at most 70 statement lines, empty `definitionNames` and `holeBodies`
  (so no definition holes), and is not a support challenge (`support` and `supportByName`
  both false).

The brief expected about 35 eligible families. **30 qualify**:

005 Catalan · 012 JointDickman · 020 PowerFreeValues · 026 PrimeGaps · 028 GaussianMoat ·
075 FourierLLogL · 081 RieszQuantitative · 127 GotsmanLinial · 128 Superstring ·
134 GeneralizedStarHeight · 155 PeriodicTilingThree · 156 BorsukNine · 160 QuantitativeVanDerWaerden ·
173 SeymourSecondNeighborhood · 181 CycleDecomposition · 188 TriangleRemoval · 189 CycleCliqueRamsey ·
192 SquareRootDegree · 196 TorsionFreeZeroDivisors · 241 DegreeRigidity · 253 SimpleAmenable ·
295 KadisonRingrose · 322 TingleySphereIsometry · 328 ReflexiveFixedPoints · 329 MetricEntropyDuality ·
333 SurfaceImmersion · 334 IsometricImmersion · 342 TamingCompatibility · 369 HotSpots · 370 HenonEmden

Of the other MATCHES families with a single challenge, most fail only on length. Three
(145 Rokhlin, 169 ElementaryPositivity, 297 Naimark) have short statements but carry
definition holes, and 374 Brenier fails both tests.

## The draws (seeded)

The eligible list is sorted by family number and drawn from one `random.Random(20261019)`
object, under CPython 3.9.6, with three calls in this order:

1. `chosen = sorted(rng.sample(eligible, 24))`
2. `mutated = sorted(rng.sample(chosen, 12))`
3. `order = list(chosen); rng.shuffle(order)`, and packet P01..P24 is `order[0..23]`.

`key/draw.py` reproduces this exactly and writes `key/draw.json`.

- **Chosen (24):** 005 012 026 028 075 081 128 134 155 156 173 181 188 189 192 196 253 295 322 328 329 333 369 370
- **Mutated (12):** 005 026 081 155 156 173 188 189 192 295 328 369
- **Controls (12):** 012 028 075 128 134 181 196 253 322 329 333 370
- **Not drawn (6):** 020 127 160 241 334 342

## The plants (chosen by hand, not seeded)

The seed decided which families are mutated. The kind and the exact edit for each one were
chosen by hand after reading the statement, the headline and the scope note. The aim was to
spread the kinds roughly evenly: (a) constant or exponent ×3, (b) domain restricted ×3,
(c) hypothesis added ×2, (d) conclusion weakened ×2, (e) DIFFERENT ×2. Difficulty is 5 easy
and 7 subtle.

- **Easy:** the edit is a visible clause, or a word that contradicts the headline's own words.
- **Subtle:** a one-token edit, or an edit inside a definition the theorem reaches.

Each edit must make the statement truly weaker than the headline (or DIFFERENT), so an edit
that a stronger, untouched clause would mask was ruled out. These were considered and
rejected:

- **173, no sinks:** restricting to sink-free graphs is equivalent, because a sink is always
  a good vertex.
- **026, the ratio corollary:** the large-gap clause implies the ratio corollary, so weakening
  only the corollary changes nothing. Restricting to C > 1 changes nothing either, because the
  clause is monotone in C.
- **192, a single clause:** the signed and absolute clauses imply each other by flipping input
  signs, so the edit sits in the shared `IsBoolean` definition.
- **369, the extremum inequality:** making it non-strict is masked by the nonvanishing-gradient
  clause, so the domain class was restricted instead.
- **188, the in-probability or expectation clause:** the L² clause implies both, so the L²
  clause itself was weakened.
- **005, flipping (−1)^j to (−1)^(j+1):** that gives −G, whose irrationality is equivalent.

Every mutated file differs from the release file in exactly one line. `key/build.py` asserts
this, and so does a `diff` against the clone. There are no other byte changes and no comment
edits. No added text appears in the family's scope note: each was read for each plant, and
none states the restriction (295's note says the opposite: "No separability ... is imposed").
The controls are byte-identical copies.

Expected words: kinds a–d give NARROWER — UNDECLARED, kind e gives DIFFERENT, and every
control keeps its recorded MATCHES. Three plants carry an `arguable` note in key.json:

- **026:** the scope note claims only the corollary, so DECLARED is defensible.
- **156:** the definition name `HasTenSmallCover` still says ten while its body says Fin 9.
- **328:** the docstring still says "nonexpansive".

## Packets

Each P-directory holds three files:

- `headline.md`: `# <title>`, then the family's CONTENTS.md paragraph, verbatim.
- `scope-note.md`: a byte copy of `lean/docs/NNN.md`.
- `challenge.lean`: the original or mutated statement.

`packets/README.md` only says what each file is. key.json records the sha256 of every packet
file.

## What keeps it blind (the experimenter's job, not the packets')

The edits are recoverable from outside the packets in three ways:

- by diffing against the clone (`/Users/carlostoledo/Projects/openai-math`);
- by hashing `challenge.lean` against `statementSha256` in cert-machine's
  `corpus/openai-math/release.json`, since controls hash to the release value and plants do not;
- by reading the recorded words in `certs/openai-math-statements.json` and
  `corpus/openai-math/readings/`, where all 24 families are MATCHES.

So readers must see `packets/` only: no clone, no cert-machine tree, no `key/`, and no network.
