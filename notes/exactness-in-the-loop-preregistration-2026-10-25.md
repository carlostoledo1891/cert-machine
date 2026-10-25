# Exactness in the loop — pre-registration

**Status: DRAFT, 2026-10-25, for the operator's approval. Not frozen, no code written, no run made.** Written on the
operator's "Proceed" after the scout (`corpus/targets.json`, `exactness-in-the-loop-2026-10`). Once approved it is
frozen: its sha256 goes into every record the measurement writes, and it changes only by a dated amendment written
before the data it affects. It is hosted by Clade Code (`~/Projects/clade-code`) and moves into that repository's
`protocol/` when its session builds it; Clade Code's rules bind there.

## 1. Question

Search systems that find mathematical constructions (FunSearch, AlphaEvolve, OpenEvolve, ShinkaEvolve) select with a
float checker that has a tolerance — OpenEvolve accepts a circle packing within 10⁻⁶, ShinkaEvolve within 10⁻⁷ — and
repair or re-check at the end, if at all. The phenomenon of search exploiting that slack is reported as anecdote
(Georgiev, Gómez-Serrano, Tao, Wagner, arXiv 2511.02864, "the cheating phenomenon") and never measured at equal
budget. The question:

**At equal budget, does a search that selects under a tolerant checker and repairs its result at the end do as well as
the same search selecting exactly — and how much of what the tolerant checker admits is false?**

A null ("equivalent") is a result: it says that, here, a tolerant screen plus an exact repair at the end is enough.

## 2. Host and scope

- Clade Code's world, unchanged: the circle-packing-3 niche (`niches/circle-packing-3/spec.json`), decision/2
  (`judge/decide2.{py,js}`, `judge/concord2.py`), era 2's draw of births (`world/hybrid.py`), μ + λ with 16 + 16,
  ties to the newest.
- **Outside any era's record**, as era 2's gates are: it writes `strata/exactness-*.json` and nothing else in
  `strata/`, and changes no file an era pins. Era 2 is not touched.
- **CPU only, blind rules only.** No model, no pod, no GPU: the RunPod credit (US$ 15 on 2026-10-25) stays with era 2.
  A model arm is a later, separate pre-registration (§11).
- The founder: **PM-1 with the hexagonal gene behind `if 0:`**, era 2's positive control (`tools/era2_gates.py
  control`): one point mutation from a step that is real. In gate 4 blind rules found it in 2 of 10 runs of 50
  generations (+0.0129 on training) and both times spread it to all 16 parents. Without a step to find, every arm
  would stay flat and the question would be empty.

## 3. Arms

Every run has all three, from the same founder, the same training set and the same seed. They differ only in the
reading that **selection** uses.

| arm | selection reads a candidate as | what it models |
|---|---|---|
| **X**, exact | digits: the niche's reading, every condition exactly | an exact certifier in the loop |
| **T**, tolerant | digits, each condition relaxed by τ = 10⁻⁶ (below) | OpenEvolve's checker |
| **D**, doubles | doubles: each JSON number is the double nearest its characters, conditions exact | a float checker with no tolerance |

**The tolerant reading, exactly.** A candidate is accepted when, in exact rational arithmetic on the digits,
r > 0; r − τ ≤ x ≤ 1 − r + τ; r − τ ≤ y ≤ h − r + τ; and for every i < j, distance ≥ r_i + r_j − τ (compared as
squares when r_i + r_j − τ > 0). Its score is the niche's, (Σr)²/(N h), on the accepted candidate. The tolerance is
computed exactly, so the only difference from X is τ, not floating-point rounding; D carries the rounding alone. One
implementation suffices for T's and D's selection, because nothing they accept is reported as a verdict: every
reported verdict is decision/2's, by both deciders.

**The repair, fixed now.** At the end of a run, every disk of T's champion's candidates has r ← r − τ. This always
certifies when every r > τ: a pair within tolerance has distance ≥ r_i + r_j − τ > (r_i − τ) + (r_j − τ), and a wall
within tolerance has x ≥ r − τ. D's champion is not repaired (no rule repairs a double); it is decided as it is.

## 4. Budget and runs

- 100 generations of 16 + 16 for each arm, 1,600 births each.
- **Pilot:** `exactness-pilot`, inspected and never tested.
- **Confirmatory:** `exactness-1` to `exactness-16`, named here; a run's name is its seed; every run is reported.
- No extension rule: 16 runs, tested once when all are in.
- Cost: gate 4 ran 10 runs of 50 generations for one arm in 546 s on CPU, so about 1.5 h for the 48 confirmatory
  arm-runs on this Mac. US$ 0.

## 5. Endpoints

Champions are chosen as in eras 0–2: the best training fitness **under the arm's own reading**, ties to the newest
(era 2's rule), after generation 100. The panel is era 0's, scored under digits by both deciders, with T's champion's
panel output repaired first.

- **Primary.** dᵢ = panel(T repairedᵢ) − panel(Xᵢ).
- **Secondary** (reported as secondary, whatever the primary says):
  - **S1.** eᵢ = panel(Dᵢ) − panel(Xᵢ).
  - **S2, the false-admission rate.** For T and for D: the share of each generation's selected parents that decision/2
    REFUTES under digits, averaged per run, and the share of runs whose champion (unrepaired) decision/2 REFUTES on
    training. Reported with exact intervals, runs as the units.
- **Existence, always reported.** For each arm, the number of runs whose (repaired) champion stands above the grid's
  ceiling on the panel (0.20516), certified by both deciders: did the arm find the hexagonal step.
- **The cost of exactness.** Seconds per judgment under each reading (median, total, share of the run's wall time).
- **Descriptive.** The generation at which a parent first fails under digits, per arm and run; the largest violation
  admitted (in units of τ) by generation; T's champion's score before and after repair; which operator and which
  function carried each slack gain.

## 6. Statistics

- **Primary and S1:** the exact two-sided sign-flip test on the sum of the differences over all 2¹⁶ sign
  assignments, α = 0.05 each; S1 is one secondary test, read as such. S2 is estimated, not tested.
- **The verdict:** the exact two-sided 90% interval for the mean shift, inverting the same test, read once, δ = 0.003
  (era 2's margin):

  | the 90% interval | verdict | the sentence |
  |---|---|---|
  | above 0 | tolerance helps | "Selecting under a 10⁻⁶ tolerance and repairing at the end did better, by x." |
  | inside ±δ, and some arm gained more than δ over the founder on average | equivalent | "A tolerant screen plus an exact repair at the end was as good, within δ." |
  | below 0 | exactness helps | "Selecting exactly did better, by x." |
  | anything else | inconclusive | "16 runs cannot tell: anywhere from a to b." |
  | always | — | "The tolerant checker's champion was false in k of 16 runs before repair." |

  The guard on "equivalent" keeps three arms that never left the founder from reading as equal; if no arm gains δ on
  average, the verdict is "nothing to compare: no arm found the step at this budget", and only S2 and the cost are
  reported.
- **Red controls, run before any data:** the analysis reads a planted set of differences all above δ as "tolerance
  helps", all below −δ as "exactness helps", and zeros with no gain as "nothing to compare"; the tolerant reading
  accepts a planted packing overlapping by τ/2 that decision/2 REFUTES, and refuses one overlapping by 2τ; the repair
  turns the first into a CERTIFIED candidate under both deciders.

## 7. What the gates lead us to expect (written before any data)

- Slack is cheap to take: PM-1's `fit()` scales a layout "as far as it safely goes", and a point mutation on its margin
  moves every radius. We expect T's population to hold a digits-REFUTED parent within a few generations, and T's
  unrepaired champion to be false in nearly every run; D's rarely.
- What slack is worth: about N·τ in Σr, so about 10⁻⁵ in score — far below δ. So the primary turns on discovery, not
  on slack: whether chasing slack crowds out the hexagonal step (exactness helps) or whether admitting near-misses
  lets a hexagonal layout survive long enough to be fitted (tolerance helps). Both are plausible; the test is
  two-sided for that reason.

## 8. Failures

As era 2's §10. A disagreement between the deciders voids the life and stops the measurement until a person explains
it. The tolerant reading crashing or running past 600 s is a refusal under T, never an acceptance.

## 9. Disclosed limits

One niche, one founder, blind rules only, one τ. The tolerant reading is exact arithmetic with a tolerance, not a
double-precision checker; D is the double-precision one, without tolerance. Real systems also differ in their search,
their prompts and their repairs. Nothing here is claimed for AlphaEvolve or OpenEvolve themselves: it measures what
the tolerance does inside one controlled search.

## 10. What would count

For the primary and S1: the verdict of §6 in its sentence, with p. For S2: the rates with their intervals. For
existence: the counts, each crossing certified by both deciders. No claim from the pilot, from a single run, or from
births counted as if independent.

## 11. Not in this measurement

- A model arm (LQ selecting exactly against LQ selecting under τ): it needs the GPU and waits for credit and for era
  2's result; its own pre-registration, with this one's results disclosed.
- "Learn which verifier to run next": dropped (our deciders are cheap; the scout's row says why).
- Any change to the site's name or description (D1).
