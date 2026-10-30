# claimbox objects — the predicate JSON cert-machine decides (the format and its checker)

The PRODUCER of these objects is the claim-machine, a separate project: `~/Projects/claimbox`, a standard-library translator from a claim's text (prose or LaTeX) and the claimant's bytes to this format. This folder is the RECEIVER: the format, the checker that refuses malformed objects, the decider for the exact class. cert-machine never produces objects from prose; claimbox never decides.

 The method paper's Definition 2 says a claim is a pair (B, φ): a domain B, a box or a finite
set of rational points, and a predicate φ, a conjunction of relations g_j(x) ≤ c_j over functions with
interval extensions, read universally or epistemically. Every verdict of the register rests on "decoding the
claimant's bytes, and the reading of the claim as (B, φ)", and the only thing that checks that row of the
paper's trust table is the pins and the scope sentence. This folder makes the reading a file: one object per
claim, refused when malformed, attached to the record that decided it, re-checkable without this system's
code. It does not translate prose. It checks what a proposer wrote.

```
instruments/claimbox/check.py      the checker: ADMITTED or REFUSED with one kind      python3 instruments/claimbox/check.py instruments/claimbox/claims/*.json
instruments/claimbox/claims/       the ten registry-queue claims, written by hand            the claim-machine's calibration targets (nine admitted, one refused with a finding)
instruments/claimbox/battery.py    the gate (make test "claimbox: declared claims")            the ten, the finding, the concord with verdict.js, the red controls, a green
instruments/claimbox/check.js      the second checker (JavaScript, no shared code)          node instruments/claimbox/check.js <object.json>...
instruments/claimbox/primitive/    objects decided from the bytes alone (version 3)
instruments/claimbox/v4/           the format-4 calibration objects (section "Format 4" below)
```

## The object

```json
{ "id": "optq-1d-cert2026",
  "text": "C_1d <= 1.463071582607559, an upper bound exhibited by …",
  "source": { "what": "the registry at 46dbf036", "path": "corpus/…/README.md", "sha256": "2364c271…", "quote": "$C_{1d} \\leq 1.463071582607559*$" },
  "reading": "universal",
  "domain": { "kind": "finite", "pin": { "path": "corpus/…/construction.json", "sha256": "44f3f2b6…" }, "decoder": "300 signed rational cell values …", "count": 300, "variable": "f" },
  "predicate": [ { "g": { "named": "max_t |(f*f)(t)| / (∫ f)^2 …", "where": "instruments/optq/autocorr.py", "args": ["f"] },
                  "rel": "le", "printed": "1.463071582607559", "c": "1463071582607559/1000000000000000" } ],
  "reference": "the bar is the registry's printed decimal taken exactly, not the certificate's fraction …",
  "hypotheses": [ "any signed step function f with ∫ f ≠ 0 gives C_1d <= its ratio (read)" ],
  "falsifier": [ "the ratio of the pinned values computed exactly exceeds the bar", "the pinned block does not hash to 44f3f2b6…" ],
  "record": { "path": "certs/autocorr-replay.json", "row": "1d-cert2026", "value": "js.value", "verdict": "REFUTED" },
  "repair": { "printed": "1.4630715826075594", "c": "14630715826075594/10000000000000000", "verdict": "CERTIFIED", "how": "rounded up at 16 decimals" } }
```

| field | what it is | the rule the checker holds |
|---|---|---|
| `text` | the claim in one sentence, ours | non-empty |
| `source` | the claimant's bytes: a pinned file and a verbatim quote | the file hashes; the quote is byte for byte in it |
| `reading` | universal (a theorem) or epistemic (a measurement with declared uncertainty) | one of the two |
| `domain` | `finite`: a pinned file, how it is decoded, a declared count, the variable name. `box`: sides, each with a rational `lo`, `hi` and the source of its bounds | the pin hashes; lo ≤ hi; finite ends only in version 1 |
| `predicate` | a list of relations; `g` is an expression; `rel` is le, lt, ge, gt, eq, in or holds; `printed` is the bar as the quote prints it; `c` is the exact bar; an `in` predicate may carry a `box` block declaring the platform's resolution (below) | every head in the vocabulary with its arity; every symbol declared; `printed` in the quote; `c` equals the rational of `printed`, or for `in` the half-unit box its digits allow — or, with a `box` block, `printed` ± the declared resolution; `holds` takes a named exact predicate and no bar |
| `predicate[i].box` | optional, `in` only: `{"kind": "resolution", "key": "minImprovement", "halfWidth": "1/10000000000", "source": {"path", "sha256", "quote"}}` — the platform's declared resolution for the score, quoted from a pinned source | the source pins and hashes; the quote is byte for byte in it and prints `"key": <number>` exactly once; `halfWidth` is a rational string equal to that number (a JSON number is refused); when the number is 0 the block states `"rule": "1e-12-relative"` and `halfWidth` is 10⁻¹²·max(1, \|printed\|); `c` equals [printed − halfWidth, printed + halfWidth] exactly; a `box` on any other relation is refused |
| `reference` | what the number is about: which bar, which reading of the bytes, which quantity | non-empty (the lattice-claims lesson) |
| `hypotheses` | what is taken from the literature and read, never decided | a list, may be empty |
| `falsifier` | what would make the object go red | non-empty (the certificate rule) |
| `record` | the deciding record, its row, where its value is, its verdict; optionally `predicate`, the index of the predicate it decided | the record exists, the word is one of the three, the record's bar is the object's, and the record's value re-decided against the object's bar gives the record's verdict. With `predicate` stated (2026-10-21), the value comparison, the bar check and the re-decision apply to that predicate alone; beside it a `holds` predicate takes the record's word and every other predicate is decided from the object (or the object is refused, `record-predicate`); the words compose as before and the composed word is still held to the record's. Without it the checker behaves as before: every predicate is held to the record's one value — the default is "as before", not 0, because an object whose predicate 0 is a `holds` while its record carries a value (optq-86-pinho) would otherwise be refused by the rule that refuses a record naming a `holds` predicate while carrying a value |
| `repair` | optional: the bar the record certifies beside a refuted print | its own `printed`/`c` rule; re-decided the same way |
| `notes` | optional prose | a list of strings |

**Numbers.** A JSON number is a double and is refused everywhere a value is expected. A rational is a string
`p/q`. A printed decimal is refused until it is written as the rational its digits mean (the bar of a
printed bound, taken exactly) or as the box its digits allow (`rel: "in"`, half a unit of the last digit
either way). This is the rule that decided C_1d: the printed bound is a rational, the certificate's value is
another, and the second is above the first.

**Two readings of a printed number, and why both exist (2026-10-21).** A registry's print is a rounded or
truncated statement of a value, so its half-unit box is the claim. A platform's score is a float64 evaluation
printed to 16 or 17 digits, and the exact value of the same arithmetic over the same doubles is in general NOT
within half a unit of that print — under the half-unit rule the checker would refute true claims (circle
packing's Σ r_i over 26 doubles sits 7.9·10⁻¹⁶ below its print, half a unit of its 17th digit being 5·10⁻¹⁷).
The rule the register already applies to those rows (`tools/run-mc100-einstein.js`, `agreement()`): the exact
objective agrees with the printed S within the platform's own resolution, its `minImprovement` for the problem
when nonzero, else 10⁻¹² relative. An `in` predicate carries that resolution as a `box` block with its source,
and `c` is the printed value ± it. The decision of `in` is unchanged; without a `box` block the half-unit rule
stands. The width is the platform's, quoted, never the proposer's: a box wider than the quoted resolution is
refused, and a sum that falls outside the box is a finding, not a reason to widen it.

**Expressions.** Primitive expressions are MathJSON-shaped arrays, `["Add", "x", "1/2"]`, over a closed
vocabulary of 17 heads: Add, Subtract, Multiply, Divide, Abs, Square, Power, Exp, Ln, Sin, Cos, Tanh,
LogGamma, Digamma, Trigamma, GammaP, Phi. Each head names an operation of the interval kernel, and the
checker refuses to run unless `certs/kernel-arb-audit.json` holds that operation: the vocabulary is read from
the audit, not typed here. A quantity no primitive expression states, such as a certificate's bound, is a
*named* function with its definition on disk (`where`), decided by the record's decider; version 2 counts
how many claims need one.

**Decisions the checker makes.** From the record's exact value or enclosure it re-decides each inequality
against the object's bar with the one predicate of `instruments/verdict.js` (written once more here in
Python, and held to the module's by the battery's 600-case concord), composes the words (REFUTED if any,
else REFUSED if any, else CERTIFIED) and refuses the object when the composed word is not the record's.
ADMITTED certifies nothing. It says the object can be handed to a decider.

## The refusal kinds

`python3 instruments/claimbox/check.py --kinds` prints them. They are the checker's, about the object's form;
the register's defect kinds (`tools/run-claims-ledger.js`) are about the claim's truth and stay there.

## What version 1 does not do, on purpose

- It does not read prose or LaTeX. A proposer, human or model, untrusted, writes the object.
- It does not decide whether the predicate is what the sentence means. That is a reading. Version 3 has two
  readers write the object independently and compares the objects; agreement is consistency, not truth.
- It does not re-run the deciders. The object is attached to the record read-only; the one decision it makes
  is the final comparison of a recorded value with the bar.
- A `count` is declared, not decoded. The decoders are the records'.
- Box domains have finite sides. The paper's infinite-side cases come with the certifier that handles them.

## The first corpus, and what writing it found

The ten registry-queue claims (C_1a ×2, C_1b ×2, C_1c ×2, C_1d, C_86, C_82 ×2), each attached to its replay
record. Nine are admitted and their decisions are the records'. One is refused, kept on purpose: the
claimant's README prints `C ≥ 0.41030211724` for its earlier K = 3072 certificate, the record decided the
seven-digit `0.4103021`, and the checker will not attach a record to a bar it did not decide. Writing the
object showed why the record's choice was the right one: the certificate's exact value is
0.410302117239969943…, below the eleven-digit print by 3.0e-14; it establishes `0.41030211723`. A finding
of the C_1d kind, in a superseded certificate's README, recorded on the object and in HANDOFF, not sent.
A second thing the objects carry that the records did not: the registry prints `C_82 < 0.2534449`, strict,
where the record's claim string wrote `<=`; the checker notes it and decides under the printed relation.

## Version 3: the finite quantifier, decisions from the bytes alone, a second checker, Z3 (2026-10-20)

**Typed data.** A finite domain may carry a `data` block that says how the pinned bytes decode:
`{"select": "data.vectors", "elements": "doubles", "shape": ["n", "d"]}`. `select` is a dotted path into the JSON;
`elements` is one of `doubles` (the exact rational each JSON number denotes), `decimals` (the exact rational the
printed digits mean), `integers`, `rationals` (strings p/q); `shape` names one symbol per dimension, bound to the
decoded size, and the array must be rectangular; `count` must equal the first size. The two readings of a JSON
number are different numbers, and the checker will not choose: see the 605 case below.

**The finite quantifier.** Four heads bind an integer index over a range, inclusive: `["Sum", "k", lo, hi, body]`,
`Product`, `MaxOver`, `MinOver` (the last two refuse an empty range); `["Index", f, i, j]` reads the decoded data;
`Min`, `Max` (binary) and `Kronecker` are exact heads too. A predicate may carry
`"forall": [["i", "0", ["Subtract", "n", "2"]], ["j", ["Add", "i", "1"], ["Subtract", "n", "1"]]]`: the relation
must hold at every index tuple. A bar the claimant printed must still be quoted; only the zero of a structural
inequality may omit `printed`.

**Decided from the object.** Every predicate written in the exact heads over bound symbols is decided by the
checker itself, exactly: a single relation gives a value and a word; a `forall` gives the word, the first violating
index tuple as the witness, and the count of all violations. A transcendental head, a named function or a box side's
symbol leaves the predicate to the record. When a record is attached, its value re-decided and the decision from
the object must agree, and a single value must equal the record's exactly (`record-value-mismatch`). The record is
optional now: an object without one is decided from the bytes or stands as a proposal.

**The second checker.** `check.js` implements the same specification in JavaScript with no code shared with the
Python: BigInt rationals, and a JSON reader of its own that keeps every number's text. The battery holds the two to
each other on every object: the same word, kind, decisions, values, witnesses and counts.

**SMT-LIB.** `check.py --smt <object>` unrolls the exact predicates to a ground QF_NRA problem asserting that some
instance violates: sat is REFUTED, unsat is CERTIFIED. Quantifier terms are named with `define-fun`; an inline ite
chain for a 599-term maximum grew as 2^599 and never finished, which is how that rule was learned. Z3, written by
nobody here, is then a third decider.

**The three primitive objects, and what they found.**

| object | decided from the bytes | agrees with |
|---|---|---|
| prim-1d-cert2026: the C_1d ratio 600·max_m\|Σ_{i+j=m} v_i v_j\|/(Σv)² over the 300 doubles of PR 224 | REFUTED as printed, the repair CERTIFIED; the value equals the record's exact fraction digit for digit | both checkers, the record, Z3 (sat printed, unsat repaired) |
| prim-ae-593-kissing: AlphaEvolve's 593 integer vectors, 4·p·\|p\| ≤ \|u\|²\|v\|² over every pair | CERTIFIED | both checkers, the kissing ledger's row |
| prim-ea-605-kissing: EinsteinArena solution 2560, the same inequality | REFUTED, witness pair (0, 48), 9,510 violating pairs, worst 601/604 | both checkers, the register's mc100 row |
| prim-1b-codexprolong (2026-10-21): the registry's C_1b ≤ 0.3808585749 over the 3,584 heights of EinsteinArena solution 2507 (read as doubles), the record certs/stepfun-replay.json row 1b-codexprolong attached and naming predicate 0, with the two admissibility inequalities beside it — min h ≥ 0 and the rescaled max h ≤ 1 (the scale (n/2)/Σh) — as structural predicates | ADMITTED, CERTIFIED ×3; the value from the object equals the record's exact fraction digit for digit; the inequalities decided from the bytes (the producer had left them out because the receiver held every predicate to the record's one value) | both checkers; the Python evaluation takes minutes and is on the decisions record, not re-run by the battery |
| prim-ea-542-circle-packing (2026-10-21): EinsteinArena solution 542, 26 circles read as doubles; Σ r_i in the printed score ± the platform's resolution 10⁻¹⁰ (a `box` block quoting problems.json), containment r ≤ x ≤ 1 − r, r ≤ y ≤ 1 − r, non-overlap (r_i + r_j)² ≤ \|c_i − c_j\|² over every pair | Σ r_i CERTIFIED (the exact sum is 7.9·10⁻¹⁶ below the print, inside the box; the half-unit box would have refuted it); containment CERTIFIED with a slack of exactly 0 on one wall; non-overlap REFUTED — 3 pairs overlap, (1, 13), (9, 21), (19, 22), by 10⁻¹⁸ in squared distance (float64 tangencies; under the decimal-digits reading 7 pairs). Recorded as found: the platform's verifier admits them, the exact inequality does not | both checkers |

The 605 object first read the heights as `doubles` and counted 9,480 violating pairs where the register's row says
9,510. Neither was wrong: the register's run reads the heights as the decimal digits printed, the object read the
doubles those digits denote, and 30 pairs sit close enough to 60° to flip with the last bits. The object now
declares the register's reading (`decimals`) and says so in its reference; the other reading is noted. This is the
reference field doing exactly what the lattice-claims lesson asked of it, on the register's own data.

**Still to do.** Collection objects for the aggregate rows; infinite box sides; deciders reading the object for the
named class, the oracle first. The second reading and the concord experiment of 2026-10-20 were removed from this
repository the same day (the operator: keep only what verifies the claim-machine's output); their result is in HANDOFF.

## Format 4 (2026-10-30): readings, standings, the canonical form, the Lean kind

Asked by claimbox's growth plan (its HANDOFF, A2 and B8; this repository's HANDOFF ◆ 2026-10-30, ruling 3). An object opts in
with `"format": 4`. **An object without `format` is a version-3 object and is checked exactly as before**: nothing was migrated,
the ten objects and the five primitive ones are unchanged byte for byte and decide as they did. A version-3 object that
carries a format-4 field (`readings`, `standing`, `record.key`, a `lean` domain, `int64` elements) is refused (`schema`, `data`).

```json
{ "id": "v4-1d-cert2026", "format": 4, "text": "…", "source": { … }, "reading": "universal",
  "readings": { "source": "text", "domain": "doubles", "record": "rationals" },
  "standing": { "source": "COMPUTED", "domain": "COMPUTED", "record": "DECIDED" },
  "domain": { … }, "predicate": [ … ], "reference": "…", "hypotheses": [ … ], "falsifier": [ … ], "record": { … } }
```

**The inputs.** A format-4 object's inputs are its roles, in this order: `source` (the quoted page), `domain` (a finite
domain's pinned bytes, or a Lean project), `resolution` (the source of an `in` predicate's resolution box), `record` (the
deciding record). A box domain has no domain input: its sides are rationals typed in the object.

| field | what it is | the rule the checkers hold |
|---|---|---|
| `readings` | the reading of each input's bytes, one word per role: `decimals`, `doubles`, `integers`, `rationals`, `int64`, `table`, `text`, `bytes`, `lean` (claimbox's LANGUAGE.md §5) | exactly the object's roles, no default (a missing one is `readings`); `source` is `text`; a domain with a data block is read as its `elements`, a Lean domain as `lean`, pinned bytes never as `lean`; `resolution` is `decimals` (the quoted number's digits); `record` is `rationals` for an exact value, `doubles` for an enclosure of JSON numbers, `text` for no value (the record's words) |
| `standing` | the standing of each input, one of WARRANT's four, read from `playground/warrant.js` (REFUSED, CHOSEN, COMPUTED, DECIDED) | exactly the object's roles; never stronger than the input's decision: a record whose word is REFUSED, or a Lean project its lane refused, is not DECIDED |
| `domain.kind: "lean"` | `{kind, repository, commit, lane}`: a Lean project at a 40-hex commit, and its kernel lane's workflow on disk | the predicate is one `holds` whose `where` is the lane, with no args; a record is required, carries no value, and names its row with `record.key` |
| `record.key` | the field that identifies the row (default `id`): a kernel lane names its rows by `challenge`, `claim`, `config` or `item` | a symbol |
| `data.elements: "int64"` | JSON integers in [−2⁶³, 2⁶³ − 1], under int64 arithmetic | each datum in range (`data`); see below |

**The certificate carries the inputs.** For an admitted format-4 object both checkers add to their result `inputs` (each
role with its path, its sha256 as read — the record is hashed when it is read —, its reading and its standing), `meet` (the
weakest standing among them, WARRANT's composition rule) and `canonical` (below); `check.py --record` writes them into each
row. The meet is shown, never applied: a standing does not cap a verdict (the operator's ruling of 2026-10-30, "read steps do
not cap a verdict").

**The canonical form: one inequality per bar.** A bar the quote prints carries one inequality: the number of predicates that
print the same digits may not exceed the number of times the quote prints them as a whole number (not inside a longer
number) — else `canonical`. The checkers also compute the object's canonical digest: the sha256 of the decision-bearing
projection — `format`, `reading`, `readings`, the domain (a finite domain's sha256, count, variable and data block; a box's
sides; a Lean project's repository and commit) and the predicates (each `g`, `rel`, `c`, `forall` and resolution
half-width), sorted by their encoding — written as JSON with sorted keys, no whitespace, UTF-8. Prose (text, reference, the
decoder's words, hypotheses, falsifier, notes), paths and the record are left out, so two encodings of one claim have one
digest and claimbox's concord can compare substance by one field; a different bar is a different digest. Bound-variable
names are part of the form (no renaming is attempted).

**The int64 reading.** Exact arithmetic is int64 arithmetic exactly when nothing wraps. Under `int64` the checkers
evaluate exactly and require every value an operation produces, and every partial sum and product, to be an integer in
int64; when one is not (it would wrap, or a division is inexact), the predicate is **not decided from the object** and a note
says where. Wrapped values are never computed: an int64 claim is decided here only where no wrap occurs, or by its record.
The SMT export refuses an int64 object (`readings`).

**The Lean kind, decided by the kernel lanes.** No Lean runs here (there is no toolchain on this machine; the lanes run on
hosted runners). The checkers re-decide the lane's pinned row: CERTIFIED iff the row prints both kernels accepting
(`Lean default kernel accepts…` and `nanoda kernel accepts…`; the row's `kernels`, else its last run's), REFUTED iff a kernel
`rejects`, REFUSED otherwise; the row's word (`word`, else `verdict`) must be that word (`record-decision-mismatch`). The
commit the lane built (the row's `commit`, else the record's `release.commit` or `source.commit`) must be the object's
(`record-pin-mismatch`); a record that names none is refused (`lean`).

**The format-4 calibration objects** (`v4/`, held by the battery's section 7, both checkers on every one):

| object | what it calibrates | outcome |
|---|---|---|
| v4-1d-cert2026 | prim-1d-cert2026 with readings and standings; the certificate's inputs | ADMITTED, REFUTED · repair CERTIFIED (as the primitive), meet COMPUTED |
| v4-ea-542-circle-packing | the `resolution` input (its quoted resolution CHOSEN by the platform) | ADMITTED, the primitive's six decisions, meet CHOSEN |
| v4-int64-sum-integers / -int64 | one pinned byte string (2⁶² and 2⁶², a synthetic fixture in `v4/data/`), two declared readings | `integers`: CERTIFIED from the object (the sum is 2⁶³); `int64`: admitted, not decided (the partial sum leaves int64) |
| v4-lean-abhyankarsathaye | the Lean kind: openai/math's challenge at fd4aeeb2, the lane's row | ADMITTED, CERTIFIED (both kernels) |
| v4-lean-binpackinggap | the refusing one: the lane refused this challenge (nanoda overflowed its stack; one kernel printed) | ADMITTED, REFUSED; standings REFUSED |
| v4-mutant-lean-other-commit | a mutant that must not certify: the certified object pointed at the later release 7ef5c0cc | REFUSED, record-pin-mismatch |
| v4-mutant-two-on-one-bar | a mutant: the C_1d bar, printed once, carrying two inequalities | REFUSED, canonical |

Format 4 adds four refusal kinds: `readings`, `standing`, `canonical`, `lean`.
