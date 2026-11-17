---
titulo: "The cost of caution"
data: 2026-11-16
resumo: "In a synthetic week, 56 of the 111 sorties Atalaia held back would have arrived. We publish that number on purpose: saying what we refuse, and why, is part of the product."
fontes:
  - t: "Atalaia, draft protocol v0.5, section 9 (the synthetic week and the cost of caution)"
    u: "/atalaia/doutrina/"
  - t: "Atalaia Core, sections 4, 8 and 9 (the carousel, the prototype and G0)"
    u: "/atalaia/nucleo/"
  - t: "Atalaia, landing page (the Costa da Lagoa case)"
    u: "/atalaia/"
---

Every safety technology sells the dangerous situations it prevents. The other half of the ledger shows up far less often: the unavailability it causes. A system that holds back every mission never lets a drone fall, and it never delivers anything either. Atalaia measures both and publishes both, and the second has a name: the cost of caution.

## The synthetic week

To measure it, we built a synthetic fleet week: 210 sorties from one base, with the destination distance (2 to 11 km), the payload (5 to 30 kg) and the wind forecast drawn at random. Before each flight, Atalaia Central decided: it cleared 75, waited for data on 111 and refused 24. Then a simulator flew each one, with a drone and a wind also drawn at random.

The result, in three lines:

- Of the 75 cleared, none landed below reserve, not even the only one in which the wind exceeded the forecast.
- Of the 24 refused, none would have arrived.
- Of the 111 that waited for data, **56 would have arrived with reserve.**

That 56 of 111 is the cost of caution. Half of the sorties held back were, in fact, flyable. Anyone who published only the top line would say "zero failures" and be right. They would also be hiding the number the customer will feel in operation.

Two caveats, because they matter. It is simulation: within the assumptions, a cleared sortie does not fail by construction, because the decision is arithmetic on the worst case. The test checks the arithmetic and measures the cost of caution; the behavior of the real drone, battery and wind can only be measured in the field. And the week is synthetic: the distances, payloads and winds were drawn at random, not taken from a real operation.

## Why NEEDS DATA is not a defect

Atalaia decides in three states: ✓ PASS, × FAIL and ∅ NEEDS DATA. The third is what generates the cost, and it is also what makes it honest. A NEEDS DATA is never a generic no: it names the measurement that would decide. In a resupply mission to a community reachable only by boat or trail, for example, the verdict says what is missing: the real consumption under load, the energy spent on the climb and the health of the batteries. These are things calibration flights measure.

That is why the cost of caution is a central research metric, not a side effect. Every stage of qualification reports both, and the calibration flights will be judged by how much they reduce that cost without clearing any sortie that would not arrive.

## Where else we publish what we refuse

The 56 of 111 is not an isolated case. It is the project's habit.

**The simulation gate did not pass as written, and we said so.** The G0 criterion required a red control, a deliberately wrong declaration, to escape the region in every simulated flight. In the initial round, it escaped in only 4 of 8. We wrote a stronger red control, sealed before running, and a prediction of what would happen. The prediction was wrong on two flights, and the red control escaped in 6 of 8. G0 passed through a dated amendment, made after reading the numbers and labeled as an amendment. The flights that did not serve remain in the records, with the result of each round.

**The bench report says what the equipment does not claim.** In the simulated test with the real ArduPilot firmware, the autopilot alone received ∅ NEEDS DATA on containment and conduct, because it declares neither a region nor a conduct. It did raise the alarm, and under drag it raised it before the box: 14.9 s against 46.0 s, because the 100 m region costs time. The report records both.

**A calculation on paper changed the marine product.** The absolute region without GNSS for a ship in deep water came out at 10 to 18 m, against an alert limit of 2 to 5 m: the absolute gate does not pass. We said so, and the marine product became the gate relative to the installation, which sits at about 3.6 to 3.8 m against 5 m.

**Measurement brought down a model.** The initial version of the autonomy model said that a MEMS inertial sensor, with slow, alternating turns of the drone, would outperform a tactical-grade sensor without them. The simulation showed that the cruise tilt leaks the bias of the vertical gyroscope, and the claim fell. The page says what the old number was and why it was removed.

## Why this is product

Whoever buys integrity buys the right to hear a no. A verifier that never refuses is decorative: it is consistent with the system being right and equally consistent with the test testing nothing. That is why every Atalaia test battery carries red controls, planted forgeries that must be caught. In the record, 53 of 53 planted errors were caught on the bench. In the test report, a forged verdict, a forged number and a planted false alarm were all caught by a separately written verifier.

A customer who sees the cost of caution before buying knows what they are buying. A customer who only finds out afterward loses trust the moment a flight is held back without explanation. Atalaia prefers the hard conversation to happen on the page, with the number on the table.

Prepared by Carlos Toledo, with AI help (Claude) in the research and writing.
