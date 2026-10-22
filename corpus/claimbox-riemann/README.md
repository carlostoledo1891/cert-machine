# claimbox — the claim-machine

A standard-library pattern-matching translator that reduces a claim, as a human or an AI wrote it, in prose or
LaTeX, to the predicate JSON [cert-machine](https://github.com/carlostoledo1891/cert-machine) decides — and refuses
what its grammar does not cover.

```
[ human or AI text ]  →  [ claimbox: grammar + translate ]  →  [ predicate JSON ]  →  [ cert-machine decides ]
```

No model, no parser framework, no dependency, no guess. The grammar is a closed list of claim shapes; the translator
extracts the printed bar as the exact rational its digits mean, finds the line of the source that prints it, decodes
the claimant's bytes and says how it read them, and emits the object. Anything the grammar does not cover is REFUSED
with the rule named: an asymptotic claim, an unbounded quantifier, an approximation, two relations in one sentence, a
number the source does not print, bytes that do not decode, a quantity with no decider. Every refusal is planted in
the battery and must fire.

The end-to-end runs, with no human typing anything: over EinsteinArena's 30 pinned best solutions, 15 objects written and
admitted by cert-machine — K(11) ≥ 594 and five platform scores decided from the bytes alone, the platform's own verifier written once
as exact predicates: the 367-word Shannon-capacity set and the 148-point no-three-in-line grid as counts, and three float-printed
scores (26 circles in a square, 21 circles in a rectangle, the third autocorrelation over 16,384 values) inside the platform's own
declared resolution, quoted from its problems.json, where the half-unit box of the printed digits would have refuted true sums; the
26-circle packing comes back REFUTED on three pairs that overlap by 10⁻¹⁸, float64 tangencies the platform admits and exact
arithmetic does not — 14 refused with the rule named, 1 skipped (records/einstein-arena-run.json); over AlphaEvolve's results notebook, 17 of 17 (records/alphaevolve-run.json); over the
Qiushi release, the Station's artifacts and FunSearch's files, 0 — those corpora pin bytes without the claimant's sentence, the
sentence without the bytes, or bytes that are not JSON, and the claim-machine says which (records/qiushi-run.json, station-run.json,
funsearch-run.json). The registry's step-function constants C_1a, C_1b, C_1c and C_1d are written once as expressions over the cells;
C_1b on the platform's 3,584 heights and C_1c on rozetyp's 6,148 integer weights are decided from the bytes beside the registry's
records, each value equal to the replay's digit for digit, the admissibility inequalities decided beside the record; the claimant's
earlier C_1c certificate under the eleven-digit bound its README prints comes back REFUTED by 3·10⁻¹⁴ — a lower bound rounded up
(records/primitive-run.json). The platform's 29 problem definitions are pinned here (corpus/platform/einstein-arena), and each
object states the reading of the bytes the platform's verifier makes — the four kissing verifiers read the decimal digits
printed, not the doubles, and the two readings differ (9,510 against 9,480 violating pairs on the 605 record). Planted defects in
the input — a bar moved by one unit, a relation flipped, another constant's name, another claimant's bytes, a count off by one,
an edited score, a rank off by one, a row edited so that the platform's own condition fails, a score moved past the platform's
resolution — 56 of 56 caught (records/recall.json).

The claim-machine put to the 2026 Riemann-hypothesis story (2026-10-22; corpus/riemann, pinned by tools/riemann.py): OpenAI's
quasi-Riemann manuscripts (a zero-free half-plane Re s > 7/8, Lean-checked; an 11/12 companion no machine checked), Alpöge and
Furman's two-thirds theorem found by Claude, its Lean formalization zeta23, Anthropic's post and the video that reported the
checking. Over the 65 sentences the sources print, the grammar reads 10 and refuses 55 with the rule named — every theorem is refused
(prose, asymptotic, no quantity); what it reads is the finite layer underneath: the one numerical certificate of the formalization,
whose displayed hypothesis EnclOK the Lean kernel does not check, and the constants printed to their digits. The certificate's 256
integer enclosures, decoded from LawN256.lean, translate to three objects cert-machine decides from the bytes — the near-CUE rows
|256·S(j) − j| ≤ 3·10⁻⁴⁰, the edge bound |D(1)| ≤ 0.82395317 and the rounded-up p₀ ≤ 0.6818287 — all CERTIFIED, the same integers
Lean's kernel accepted: two checkers on one certificate. The hypothesis EnclOK itself is skipped: the law's bytes are not published.
The four Montgomery–Taylor digits claims (c₁* = 0.7532960…, 2 − 1/c₁* = 0.67250…) are admitted and left undecided — a closed form
over transcendental heads needs a decider the receiver does not have yet. Over eighty phrasings of the same claims an AI wrote as a
claimant would, the grammar reads 3: a claim is read at the head of its sentence or not at all. Fifteen AI-written claims, some wrong
on purpose, come out as a careful reader expects — the false REFUTED or refused with the rule, the true CERTIFIED (records/riemann-ai-run.json).
Planted defects at scale on the certificate — every enclosure moved or widened, rows dropped or exchanged, the scale and the count
edited, the bars moved in the sentence and in copies of the pages — 781 of 781 caught and 511 of 511 within-tolerance edits left
undisturbed, each expectation computed by hand from the integers (records/riemann-recall.json). Found on the way and fixed: a
rational after "=" was read as its numerator (F(3) = 22/7 as 22).

Then the mathematician's own claims (corpus/riemann/mathematician.md, records/riemann-math-run.json). The Montgomery–Taylor
constant c₁* = √2·tan ϑ/(1 + ϑ·tan ϑ), ϑ = 1/√2, reduces to rational arithmetic — with ϑ² = 1/2, sin ϑ = ϑ·s and cos ϑ = c for
two alternating rational series, so c₁* = 2s/(2c + s), and the partial sums bracket it — which makes the formalization's digits
claims decidable by cert-machine's exact evaluator with no interval kernel: c₁* = 0.7532960…, 2 − 1/c₁* = 0.67250…, (3 − 1/c₁*)/2
= 0.83625… CERTIFIED from a certificate whose one datum is the truncation order K = 8, and the AI's wrong last digit REFUTED. Two
findings came with it. The paper's abstract prints 0.8362 for a constant equal to 0.83625035…, a truncation where a rounding
prints 0.8363 (true as a lower bound, refuted as a rounded print). And the machine caught the mathematician: the first grammar
gave an ellipsis print the rounding box, cert-machine refuted the true 0.7532960… and certified a false 0.7532961…, and it was
right about the arithmetic — an ellipsis is a truncation, [p, p + unit), and the grammar now says so. From the enclosures
themselves: every band row contains the exact CUE value j·K/256 (124 at the upper end, 131 at the lower), so the 256-periodic
law sits on the CUE values, not merely within 3·10⁻⁴⁰ of them — CERTIFIED over the 255 rows; and the paper's arithmetic on its
ceiling (within 0.016 of 2/3; below 0.6819 at window norm 8.2; the coefficient 2.55·10⁻⁶) CERTIFIED from the file's own p₀. The ξ′
constants of the paper's Remark 7.1 (at least 0.85838 of the zeros of ξ′ simple and on the line, 0.92919 distinct; 0.86864 and
0.93432 with the quartic window), which Lean proves from a certificate of rationals, were re-derived from their definitions with
exact fractions — the diagonal density's coefficients 2·4^{k+1}·k!/(2k+2)!, nine terms and the tail, the window integrals, the
quartic window's degree-9 autocorrelation by independent polynomial arithmetic — and every closed form the Lean prints came out
equal: five identities, the four eight-digit constants and the paper's four prints CERTIFIED, a control one unit above REFUTED
(records/riemann-math-run.json, 22 claims). The 11/12 manuscript the mathematicians are reading, extracted with pdftotext, prints
no decimal constant at all: a proof for human readers with no finite layer. An exploration in floats of the paper's bandwidth-one
programme at small N (tools/ceiling_lp.py) gives 0.7134, 0.7073, 0.7053 on the half-integer grid for N = 4, 6, 8 — far above the
256-law's 0.6818, with algebraic weights (2 − √2 at N = 8), so the authors' law lives on finer or structured positions.

```
python3 -m claimbox read zeta23 --out jobs.json && python3 -m claimbox batch jobs.json --out out --check     # the Riemann story's certificate
python3 -m claimbox read einstein-arena --out jobs.json && python3 -m claimbox batch jobs.json --out out --check
python3 -m claimbox batch corpus/primitive-jobs.json --out out --check          # C_1b and C_1c from the bytes, about ten minutes
python3 -m claimbox read alphaevolve --out jobs.json && python3 -m claimbox batch jobs.json --out out --check
python3 -m claimbox shape "C_1d <= 1.463071582607559"
python3 -m claimbox translate --claim '$C_{1d} \leq 1.463071582607559*$' \
    --source corpus/optconst-queue/next-2026-10-18/upstream/README.md \
    --data corpus/optconst-queue/next-2026-10-18/pr-224/construction.json --check
make test
```

Paths are relative to cert-machine's root (`CERT_MACHINE`, default `~/Projects/cert-machine`), which is read-only
here: its checker verifies what this program emits, its deciders decide, and no code is shared. `make platform` re-fetches
the platform's definitions at the pinned commit, `make riemann` the Riemann story's sources; `make drift` re-hashes everything pinned.
