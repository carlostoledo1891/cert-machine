---
titulo: "A bound, not an estimate"
data: 2026-11-16
resumo: "Every navigation system answers where the vehicle is. Atalaia answers how wrong that position can be right now, in the worst case, in a way that another party can recompute."
fontes:
  - t: "Atalaia Core: the integrity layer, version 0.4"
    u: "/atalaia/nucleo/"
  - t: "Atalaia, draft protocol v0.5, section 9 (results with the stage of each)"
    u: "/atalaia/doutrina/"
  - t: "Drevelle and Bonnifait, confidence domains by set inversion, IEEE T-RO, 2013"
    u: "https://doi.org/10.1109/TRO.2013.2262776"
  - t: "Mina, Kanhere, Kousik and Gao, GPS checked against the inertial sensor's reachable set, NAVIGATION, 2023"
    u: "https://doi.org/10.33012/navi.616"
  - t: "Liu, Wang and Abel, protection levels with zonotopes, GPS Solutions, 2023"
    u: "https://doi.org/10.1007/s10291-023-01447-z"
  - t: "Le Bars et al., interval inertial navigation on an autonomous boat, 2022"
    u: "https://doi.org/10.3389/fcteg.2021.786188"
  - t: "Zhu et al., deterministic protection level for LiDAR-inertial odometry, arXiv 2605.09383"
    u: "https://arxiv.org/abs/2605.09383"
---

Ask a drone's navigation system where it is, and it answers with a point. The good ones attach a number to the point: the root mean square error, the circle that contains half the positions, the share of the flight within a tolerance. These are honest numbers about typical performance, and they answer an engineering question: how good is this, usually?

Whoever has to decide whether a mission goes ahead asks a different question: how wrong can this be right now? When the satellite signal may be spoofed, the question gets harder, because a spoofer is not noise. It picks the worst moment, and an average, however good, says nothing about that moment.

Atalaia was designed around that second question.

## The position is a region

The idea fits in a sentence: the position is a region, not a point. Each of the vehicle's sensors has a declared error limit: the inertial sensor, the camera, the terrain beneath it, the height above ground. Atalaia computes the region where the vehicle is sure to be if every sensor stays within its limit. We call it the protection region.

The detail that changes everything is what is left out. The region is computed without GNSS, the satellite signal. GNSS is still used, but as a candidate that has to pass through a gate: the satellite position is accepted only if it falls inside the region, widened by a small margin. If it falls outside, it is declared false, and the box raises the alarm, identifies the source and switches the estimator's source, holds or lands, as agreed before the mission.

Because the region was built without GNSS, the attacker has no way to drag it. The error the attacker can hide is limited to the width of the region plus the margin, whatever the attack. That inequality is proven in Lean 4.35.0, with Mathlib, using only the standard axioms. The bound is also tight: an attacker who knows the region can place the false position on the opposite edge. Every meter taken off the region is therefore a meter less that any attacker can hide, and the engineering work comes down to a single task: shrinking the region without cheating.

If the region comes out empty, some assumption has failed: a sensor went past its declared limit. Removing one source at a time shows which.

## What is not ours

Set-based estimation is an established field, and it is worth saying who got there before us. The empty region that exposes a false source appears in Jaulin, in 2009. Drevelle and Bonnifait have derived confidence domains for localization by set inversion since 2013. Su, Schön and Joerger proposed a set-based GNSS detector in 2023. Mina and coauthors check GPS against the reachable set of the inertial sensor. Liu, Wang and Abel compute protection levels with zonotopes. Le Bars and coauthors do interval-based inertial navigation on an autonomous boat. A 2026 preprint gives a deterministic protection level for LiDAR-inertial odometry.

What we did not find, together, are four things: the inertial sensor's biases inside the region's state, the machine-checked proof, a record that another party redoes and a gate that accepts the outside fix only inside a region built without it. That is an absence in our searches, not proof that it does not exist. That combination is what we built and measured.

## The numbers, with the stage of each

No real-world flights yet. What exists: the true position stayed inside the region in 24,300 of 24,300 checks from 45 simulated flights of 45 minutes over real terrain and imagery, with correlated instants that do not count as independent experiments. In a prototype of the set estimator, run on the inertial sensor data of 8 simulated flights in ArduPilot, the true position stayed inside the region at every epoch, under all three noise models, and the region came out up to 3 times tighter than an interval box with the same limits. All simulation, with the real firmware.

## Why a bound sells

A bound lets you decide. If the region plus the margin fits within the phase's alert limit, ✓ PASS. If it does not fit, × FAIL. If a source has no declared limit, ∅ NEEDS DATA, and the verdict names the data that would decide it. A bound can also be recomputed: every reading is signed at capture and chained, and a verifier written by another party redoes every decision.

There is a cost, and it is published. A guaranteed bound is wider than a typical estimate. With a consumer-grade inertial sensor, the guarantee is lost in about 3 minutes without GNSS. Over flat terrain, the terrain does not help. Over water, the protocol refuses the mission. In a synthetic week of 210 departures, 56 of the 111 held for lack of data would have arrived. It is the price of not guessing, and it falls as calibration flights measure what is missing.

Finally, Atalaia does not replace the navigation system: it judges it. The ArduPilot estimator, a vision product, a manufacturer's position: all become proposals that the gate accepts or rejects. What Atalaia adds is the missing answer: how wrong the position can be right now, and the proof.

Prepared by Carlos Toledo, with AI help (Claude) on research and writing.
