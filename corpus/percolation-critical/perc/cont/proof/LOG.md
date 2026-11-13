# LOG — continuity of θ on [0, 1], the proof author's run (2026-11-13)

Pod: the KN3 pod (p-kn3), reached with `perc/kn3/pod/pssh` / `pscp`. All times UTC. Desk: read the rules and the
sources, drafted the whole proof before the first compile.

## Read

- `PREREG-CONT.md` (the rules); `perc/Textbook.lean` (sha256 4dc732f5…e641ae) and `perc/cont/Continuity.lean`
  (sha256 d012845f…8243), both unchanged; `scout/CONTINUITY-SCOUT-2026-11-13.md`; `perc/bridgeA/Bridge.lean` + LOG.md;
  `perc/anchors/ThetaAnchors.lean`, `DimOne.lean`, `PlantedFalse.lean`.
- The lab's source at 795efb86, on the desk, read-only, under
  `…/scratchpad/continuity-scout/repo/percolation/`: `Percolation/Literature/Basic.lean` (model, `theta`,
  `criticalProb`, `labelMeasure`, `configOfLabels`), `PercolationProofs.lean` (measurability, the coupling,
  `theta_mono_holds`), `UniformPercolation.lean:50` (`tendsto_real_siteToBoundary`), `HalfSpaceBGN.lean:92`
  (`continuous_bondPercolation_real_of_determinedBy`), `SharpnessDCTProofs.lean` (only the statements at 405–411,
  493, 562, 1497), `UniquenessInfiniteCluster.lean:97, 1112` (statements), `Connectivity.lean:40–62`,
  `ConnectivityProofs.lean:80–130`, `BernoulliPercolation.lean:95–108`, `BernoulliPercolationProofs.lean:30–40`,
  `CriticalContinuity.lean:55–90`, `CriticalContinuityProofs.lean:222, 441` (statements), `UniquenessZone.lean:185–193`,
  `PercolationEvents.lean:36–42, 104–108`, `LatticeModels/LatticeGraph.lean:44–50`, `Solution.lean:1–20, 100–125`.
- NOT opened: any file under `Percolation/Continuity/`, any `Percolation/Literature/KozmaNitzan*` file, any sibling
  folder of `continuity-scout`, any third party's repository or commentary. The lab's θ(p_c) = 0 is used only
  through `Solution.lean` (`BondPercolation.percolation_continuity`, `BondPercolation.bridge`), as bridge A did.
- On the pod, read-only: `/root/pod-replay.sh` and the lab's `.github/scripts/comparator-check.sh` under `/root/k1`
  (to run leanchecker and Comparator the way the orchestrator's replay does). Mathlib lemma names were checked by
  `grep` in the pod's Mathlib checkout (81a5d257). No web use.
- Nothing under `/root/k1`, `/root/kn3`, `/root/replay` was modified. No `pkill`.

## Layout on the pod (`/root/cont`, left as built)

- `/root/cont/percolation` = `cp -a` of the pristine `/root/k1/…/percolation` (exit 0, 33 s). No file of the lab
  changed; `lakefile.toml` has `[[lean_lib]]` entries APPENDED (`logs/lakefile.diff`, `logs/diff-vs-pristine.txt`).
- `Textbook.lean`: the sealed bytes (sha256 4dc732f5…, checked on the pod).
- `ContStatement.lean`: a WRAPPER MODULE = one header line `import Textbook` + the sealed bytes of `Continuity.lean`.
  Check: `tail -n +2 ContStatement.lean | sha256sum` = d012845f1f04304e82a9de0059d2373ed144460b4a5171061dc6a2009cff8243
  (run on the desk and on the pod). The sealed files themselves are also at `/root/cont/sealed/`.
  (Not concatenated into one file: `Bridge.lean` imports the module `Textbook`, and a second copy of its
  definitions would clash.)
- `Bridge.lean` (bridge A, sha256 ab8be23f…), `ThetaAnchors.lean` (46d9ffff…), `DimOne.lean` (5722a128…): unchanged.
- New, ours: `UnitAux.lean` (Mathlib only), `ContPlanted.lean` (Mathlib + anchors + statement only),
  `ContProof.lean` (the proof), `ContAxioms.lean`, `ContChallenge.lean`, `ContChallengePlanted.lean` (Comparator
  challenges; they hold `sorry` by design and are not proof files), `/root/cont/red/Red*.lean`.

## The proof, as planned on the desk and as built

1. Upper semicontinuity (`ContProof.theta_upper`): θ ≤ θ_n, θ_n(p) → θ(p), θ_n continuous in p. With the lab's
   monotonicity: right-continuity (`theta_rightCont`). No uniqueness needed.
2. van den Berg–Keane (`exists_lt_theta`): in the lab's label coupling, levels q_k = max(p₁, p − 1/(k+1)) ↑ p;
   almost surely {0 percolates at level p} ⊆ ⋃_k {0 percolates at level q_k}, from three almost-sure facts
   (no label equals p: `ae_label_ne`; at most one infinite cluster at level p: `ae_label_unique`, the lab's theorem;
   an infinite cluster exists at level p₁: `ae_label_exists`, the lab's zero–one law) and one deterministic lemma
   (`reachable_below`: a finite open path at level p with no label equal to p is open at some m < p; induction on
   `Relation.ReflTransGen`, no `Walk` API). Then `Monotone.measure_iUnion`.
3. `theta_contAt`: continuity at every p with (θ(p) > 0 ⇒ p_c < p). `continuous_of_crit`, `crit_of_continuous`.
4. Transport by `BridgeA.θ_eq`, `BridgeA.pc_eq`.

## Builds (every log with exit code and seconds is in `build-logs/`)

| tag | target | exit | s | note |
|---|---|---|---|---|
| b01-base | Textbook ContStatement Bridge DimOne UnitAux ContPlanted | 0 | 48 | first attempt of everything but the proof; both planted refutations built first time |
| b02-proof | ContProof | 1 | 13 | ONE error, line 127: `zero_le _` — at this Mathlib `zero_le` takes no explicit argument |
| b03-proof | ContProof | 0 | 14 | `zero_le _` → `zero_le`; builds, no warning |
| b04-all | all seven modules | 0 | 13 | after adding the four root-level names (`theta_continuous`, …) at the end of ContProof.lean |
| b05-challenge | ContChallenge ContChallengePlanted | 0 | 13 | the two Comparator challenge modules (`sorry` by design) |

Two compile attempts of the proof file in all. Nothing was weakened or left out between them.

## What was NOT done / limits of what is shown

- The lab's `comparator-check.sh` was not run verbatim: it globs `comparator*.json` in the project directory, so it
  would also run (or need moved) the lab's own `comparator.json`. `cmp/cmp.sh` calls the same Comparator binary
  with the same tools at the same pins (printed in `logs/cmp/*.tools.txt`) and the same environment lines.
- "PROVED" below means C1, C2, C4 (and C3 where the log says so) in MY tree. C5, the orchestrator's replay in a
  fresh copy, is not mine and is not claimed.

## Checks run after the build (all in `/root/cont/percolation`)

| step | command | exit | s | where |
|---|---|---|---|---|
| axioms | `lake env lean ContAxioms.lean` | 0 | 9 | `axioms.out`, `build-logs/axioms.exit` |
| red controls + token grep | `red.sh` (`lake env lean` on each `red/Red*.lean`) | Red0 0; Red1a/1b/2a/2b 1 | 9–10 each | `red-logs/` |
| Comparator, our statement | `cmp/cmp.sh cmp/ours.json ours` | 0, "Your solution is okay!" | 239 | `cmp-logs/ours.*` |
| Comparator, planted `Planted_dimOne` | `cmp/cmp.sh cmp/planted.json planted` | 1, statements do not match | 86 | `cmp-logs/planted.*` |
| leanchecker | `fresh.sh` = `lake env leanchecker --fresh ContProof` (03:50:59Z → 04:20:39Z, one core) | 0 | 1780 | `build-logs/fresh.*` (empty log = accepted) |
| tree vs pristine | `diff -rq --exclude=.lake /root/k1/…/percolation /root/cont/percolation` | only our new files + `lakefile.toml` | | `diff-vs-pristine.txt`, `lakefile.diff` |

One slip on the desk, repaired: unpacking the Comparator logs overwrote the desk copies of `cmp/ours.json` and
`cmp/planted.json` with Comparator's re-serialised copies; the originals were copied back from the pod and the
hashes of desk and pod agree (the re-serialised ones are kept as `cmp-logs/*.checked.json`).

Sequence note: `b03-proof.log` is the build of ContProof.lean BEFORE the four root-level names were appended;
`b04-all.log` is the build of the final bytes (sha256 629738ef…). `axioms.out`, the red runs, Comparator and
leanchecker all ran after b04.

## Time

First pod command 03:37:39Z; first compile of the proof 03:47:11Z (exit 1), second 03:47:40Z (exit 0); axioms,
red controls and both Comparator runs done by 03:57:23Z; leanchecker --fresh done 04:20:39Z; copy-back 04:22Z.
About 45 pod minutes of wall clock in all (the pod is shared with another job and billed once), of which 30 were
the single-core leanchecker run. `/root/cont` is left as built (`lake build --no-build` of all nine modules: "All
targets up-to-date (8921 jobs)"); nothing of ours is still running there.
