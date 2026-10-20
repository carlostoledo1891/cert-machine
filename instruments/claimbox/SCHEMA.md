# claimbox — a declared claim as a file (version 1, 2026-10-20; named claimbox by the operator the same day, formerly "the box")

 The method paper's Definition 2 says a claim is a pair (B, φ): a domain B, a box or a finite
set of rational points, and a predicate φ, a conjunction of relations g_j(x) ≤ c_j over functions with
interval extensions, read universally or epistemically. Every verdict of the register rests on "decoding the
claimant's bytes, and the reading of the claim as (B, φ)", and the only thing that checks that row of the
paper's trust table is the pins and the scope sentence. This folder makes the reading a file: one object per
claim, refused when malformed, attached to the record that decided it, re-checkable without this system's
code. It does not translate prose. It checks what a proposer wrote.

```
instruments/claimbox/check.py      the checker: ADMITTED or REFUSED with one kind      python3 instruments/claimbox/check.py instruments/claimbox/claims/*.json
instruments/claimbox/claims/       the first corpus: the ten registry-queue claims        nine admitted, one refused with a finding
instruments/claimbox/battery.py    the gate (make test "claimbox: declared claims")            the ten, the finding, the concord, the yield, 37 red controls, a green
instruments/claimbox/yield.py      version 2: the yield measurement over the register   certs/claimclaimbox-yield.json; yield-table.json the per-row reading
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
| `predicate` | a list of relations; `g` is an expression; `rel` is le, lt, ge, gt, eq, in or holds; `printed` is the bar as the quote prints it; `c` is the exact bar | every head in the vocabulary with its arity; every symbol declared; `printed` in the quote; `c` equals the rational of `printed`, or for `in` the half-unit box its digits allow; `holds` takes a named exact predicate and no bar |
| `reference` | what the number is about: which bar, which reading of the bytes, which quantity | non-empty (the lattice-claims lesson) |
| `hypotheses` | what is taken from the literature and read, never decided | a list, may be empty |
| `falsifier` | what would make the object go red | non-empty (the certificate rule) |
| `record` | the deciding record, its row, where its value is, its verdict | the record exists, the word is one of the three, the record's bar is the object's, and the record's value re-decided against the object's bar gives the record's verdict |
| `repair` | optional: the bar the record certifies beside a refuted print | its own `printed`/`c` rule; re-decided the same way |
| `notes` | optional prose | a list of strings |

**Numbers.** A JSON number is a double and is refused everywhere a value is expected. A rational is a string
`p/q`. A printed decimal is refused until it is written as the rational its digits mean (the bar of a
printed bound, taken exactly) or as the box its digits allow (`rel: "in"`, half a unit of the last digit
either way). This is the rule that decided C_1d: the printed bound is a rational, the certificate's value is
another, and the second is above the first.

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

## Version 2: the yield measurement (2026-10-20)

`instruments/claimbox/yield.py` classifies every row of the register by the form of the claim it decided, by whether
the version-1 format admits it today, and by the kind of predicate it would carry; the rule is in its docstring,
written before the count, and the per-row reading with its reason is `yield-table.json`. The record is
`certs/claimclaimbox-yield.json`; `--check` re-derives it, and the battery refuses a table that disagrees with the
register on the set of rows.

| | rows |
|---|---|
| admitted as is (v1 yes) | 123 of 132 |
| one named feature missing | 8: six aggregates that need a collection object (one object per item), one QUEUED row with no verdict to attach, one NEEDS DATA row whose pin cannot resolve |
| a reading, no predicate | 1: the formal proof's statement fidelity (the kernel's acceptance is a "holds"; whether the statement is the theorem claimed is read) |
| by form | F2 holds 85 · F1 bar 38 · F4 aggregate 6 · F3 box 2 · F5 formal 1 |
| primitive-expressible | 0 of 132 |

The kill switch (under half admitted as is) is not tripped. The number that matters for version 3 is the last
row: every claim on the register ranges over an indexed family, a sum over index triples, a minimum over pairs,
a maximum over a grid, and the vocabulary of 17 scalar heads has no finite quantifier. Every predicate is a
*named* function with its definition on disk. The next primitive is not another scalar function; it is a finite
indexed sum, product, minimum and maximum over the pinned set, which is what the exhaustive certifier already
computes. Without it, SMT-LIB export covers nothing on the register; with it, the tensor identities and the
configuration bounds unroll. "Admitted" means the decided claim in the row's scope, never the claimant's wider
headline; the ten objects of version 1 are the proof that the form carries scope, reference and hypotheses.

## Next versions

3. The second checker in JavaScript, the concord on twenty rows read twice, the finite quantifier as the one
   new primitive, SMT-LIB export of the predicates it unrolls with Z3 as a third decider.
4. Deciders reading the object, one family at a time, the oracle first; a spin-out repository only when a
   claimant or an outside verifier reads the format.
