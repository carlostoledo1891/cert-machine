# The reading brief (lane S of the openai/math audit, as pre-registered)

You are reading formal statements from OpenAI's openai/math release (Lean 4 + Mathlib). Each packet directory
`P01` … `P24` holds one family:

- `headline.md`: the family's title and its headline claim, as OpenAI's CONTENTS.md gives it;
- `scope-note.md`: OpenAI's own scope note for the family (lean/docs/NNN.md);
- `challenge.lean`: the family's challenge statement, the file Comparator checks a solution against.

**The decider is a reading.** Read each challenge statement against (a) the family's headline and (b) OpenAI's scope
note. A reading is not a certificate; it records what the statement states and what it does not.

**The words** (one per family):

- **MATCHES**: the Lean statement states the family's headline claim, up to the formalization's unavoidable encoding
  choices, each named.
- **NARROWER — DECLARED**: the statement proves less than the headline, and OpenAI's scope note says what is left out.
- **NARROWER — UNDECLARED**: the statement proves less than the headline, and neither the scope note nor the challenge
  file says so.
- **NARROWER — UNLINKED**: the statement proves less than the headline, and every missing clause comes from a
  manuscript of the family that the scope note does not link.
- **DIFFERENT**: the statement neither implies nor is implied by the headline claim.
- **SUPPORT**: OpenAI declares the challenge a supporting result, not a main theorem.

**Precedence**: a family takes the most severe word any of its clauses earns: DIFFERENT > NARROWER — UNDECLARED >
NARROWER — UNLINKED > NARROWER — DECLARED > MATCHES.

**Also read, for every family**: vacuity risk (hypotheses that may be unsatisfiable, a structure that may be
uninhabited), junk-value risk (Lean's total division, log 0, sSup of an unbounded set, a Bochner integral of a
non-integrable function), and quantifier order against the prose. Check every constant, exponent, bound, domain and
hypothesis in the statement against the headline. Split the headline into its clauses and say, for each, which part of
the statement covers it.

**Discipline**: every NARROWER — UNDECLARED and DIFFERENT word quotes both texts verbatim, the headline's words and the
statement's line with its line number (`challenge.lean:LINE`).

**Rules of this reading.** Read only the files in the packets directory you are given. Do not open, search or list any
other file or directory on this machine — no other copy of these statements, no repository, no notes — and do not use
the network. Every word must come from the packet alone. Each packet is a separate family; read every one.

**Output**: one JSON file, at the path you are given, of the form

```json
{"reader": "<your label>", "families": [
  {"packet": "P01", "title": "...", "headline": "...", "word": "MATCHES",
   "clauses": [{"clause": "...", "coveredBy": "...", "note": "..."}],
   "gap": null or "what the headline has that the statement lacks",
   "scopeNoteOnGap": null or "silent" or "declares it: <quote>",
   "asserts": "the statement in words",
   "encoding": ["each encoding choice"],
   "flags": ["vacuity / junk / quantifier notes"],
   "evidence": ["challenge.lean:LINE: <verbatim>"],
   "confidence": "high" | "medium" | "low",
   "suspicious": null or "anything you could not settle"}
]}
```
