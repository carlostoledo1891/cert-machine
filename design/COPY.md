# COPY — titles, tone and vocabulary on the public pages (2026-10-16)

The position is one sentence and it does not change before 2027-09-03 (D1,
notes/positioning-decisions-2026-09-03.md): *Independent exact certification of
machine-generated mathematics — exact arithmetic, no code shared with the claimant,
refusal as a verdict.* Everything here is about how the pages around it speak.
Decided in notes/positioning-plan-2026-10-16.md; the operator ruled on it the same day.

## Who reads

Three readers, and the hubs are written for all three at once: people who build and
audit evaluations of AI systems (the hiring audience; their words are *answer-key
contamination, reward hacking, eval ground truth, judge calibration, benchmark
review*); mathematicians who come for one claim and its proof; and the operations
people — energy, maritime, aviation, ocean statistics — who need a number with its
envelope or a stated refusal.

## The three lines of work, and the two shelves

Every report belongs to one series, declared in `design/titles.json`:

| id | series | what belongs |
|---|---|---|
| `audits` | Audits of machine-generated mathematics | claims produced by AI systems or autonomous platforms — releases, registries, manuscripts, announced records — re-decided from their published bytes |
| `evaluation` | Evaluation whose ground truth is a proof | graders measured, answer keys re-decided, environments and benchmarks where a certificate replaces the key |
| `theorems` | Theorems and exact values | results proved here; the calibration of the instruments |
| `decisions` | Certified decisions for operations | engineering numbers decided over declared envelopes |
| `record` | The record | the monthly registers, refusals, the rerun kit, how to submit a claim |

## Titles

- **A title names the object and what was decided.** *Erdős #852: a published
  constant refuted at its twelfth digit.* Not a sentence with a verb and a flourish,
  not a question, not a pronoun for the claimant ("their table"), not first person.
- **≤ 70 characters** where the object allows; a mathematical object is spelled out
  rather than abbreviated past recognition.
- **The editorial line survives as the standfirst** under the H1 (`<p class="standfirst">`),
  one line, italic. The voice is kept; it is no longer the title.
- **No record-derived counts in a title.** A count is a number from a record and
  belongs in the standfirst, the deck or a stat, where the build reads it. The
  mathematical object itself (δ₃ = 117/2192, K(11) ≥ 604) is not a count.
- **The suffix is the person, once:** `<title>` = title · Carlos Toledo on every page
  but the root. "cert-machine" is the repository and stays in the footer, the DOI and
  GitHub.
- **Frozen titles.** A page whose H1 the method paper's bibliography quotes keeps that
  H1 (`frozen: true` in the registry). Today: openai-math, methods-note.
- **URLs never change for a title.** The registry retitles the rendered page
  (`design/titles.js`); a builder's own H1 is the gate value `was`.

## Tone on the hubs

Third person or impersonal ("the audit found", not "we checked"); status words meant
exactly (*published* ≠ *peer-reviewed* ≠ *independently rerun*; a slip is not a
refutation; the correction row is never counted); no rhetorical questions; no quarrel
words ("lying", "sermon", "their") on a hub or in a lead — inside a report's body a
finding may be stated as sharply as the certificate warrants. Pages do not narrate
their own revision history; errata are dated entries on the Method page and in the
monthly register.

## Vocabulary — the paper's

The method paper (paper/tex/cert-machine-method.tex) and the site are read side by
side, so the site uses the paper's words and defines each once on the Method page:
**certificate · enclosure · verdict** (CERTIFIED / REFUTED / REFUSED; NEEDS DATA where
a claimant published no bytes) **· witness · red control · battery · register ·
pinned bytes · refusal · independent** (from the claimant; the three weights counted
apart as in the paper's §4.2).

Not on hubs or in report leads, because the paper never uses them and a reader has no
way to learn them: *shelf, drift, gate/gated, lift, family, funnel, rung, operator,
HANDOFF, make test, control page, faces, power system, the desk, the board,
PROVENANCE, refuse a deploy / refuse to ship.* A report whose subject is one of these
(the gym's rungs; the rerun kit's hashes) defines the word where it uses it.

## Descriptions (unchanged from SEO.md)

One complete sentence, ~140–170 characters, leading with the claim and its named
object; no marketing adjectives; verdicts and exact numbers welcome; never the
positioning sentence itself. The build refuses a page with no description, the default
description, or a description shared with another page.
