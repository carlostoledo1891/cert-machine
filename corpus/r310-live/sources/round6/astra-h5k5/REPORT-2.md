H2: PASS — H5 is K4-free in every 9-regular candidate

**REASONED — What remains open.** This does not decide whether a triangle-free graph on 40 vertices with independence number at most nine exists. It excludes four pairwise codegree-five roots in the 9-regular case, without a global codegree cap. Whether H5 can contain a triangle remains open. [Full report](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/REPORT.md)

**COMPUTED — All 14 pairs are UNSAT.** Eleven closed on the overlapping exterior constraints. The other three left 55 assignments for full-graph SAT. The table gives the number of assignments reaching that stage, in McKay catalogue order. [Per-pair audit](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/audit_summary.json)

| Exterior | Type A | Type B |
|---|---|---|
| E1 | 0 · projected UNSAT | 0 · projected UNSAT |
| E2 | 0 · projected UNSAT | 0 · projected UNSAT |
| E3 | 43 · all UNSAT | 8 · all UNSAT |
| E4 | 0 · projected UNSAT | 0 · projected UNSAT |
| E5 | 4 · all UNSAT | 0 · projected UNSAT |
| E6 | 0 · projected UNSAT | 0 · projected UNSAT |
| E7 | 0 · projected UNSAT | 0 · projected UNSAT |

**REASONED — The decisive constraints.** Each 17-vertex core admits three-root extensions in isolation. In type A, exact degrees constrain the edges between singleton classes, and every nonadjacent pair must have a common neighbour. Together these force the unit graph to be a maximal triangle-free subgraph of the allowed cross-class edges. In type B, the three normal roots have five common neighbours. Their twelve private neighbours are anticomplete to those five and therefore induce a catalogue graph with independence number at most four. These restrictions let the four exteriors be joined with every physical edge shared. [Argument and split derivations](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/REPORT.md)

**COMPUTED — Certificates and controls.** Independent enumerators agreed on the split leaves. Both `lrat-check` and `cake_lpr` accepted all **66 primary proofs** on replay. Fixed two-edge paths already exhibit an independent ten-set in 51 of the 55 full-graph assignments. The same physical encoder recovered the planted 24-vertex regular graph with all six root pairs at codegree five. A broader control also returned SAT with only the root traces and core pinned. One preliminary checker failure was superseded and is recorded with the interrupted pilots. [Proof archive](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/H2-PROOFS.tar.gz) · [Replay index](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/proof_index.tsv) · [Ten-set witnesses](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/local_witness.json) · [Run register](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/RUNS.md) · [SHA256SUMS](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/SHA256SUMS)

**REASONED — One next experiment.** Test an H5 triangle whose three roots share all five common neighbours. Its twelve private neighbours still form the small catalogue graph used in type B. The next test is whether it can share a 20-vertex exterior with the five common vertices, each requiring six independent neighbours there. [Experiment specification](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/h2/REPORT.md)

H2: PASS — H5 is K4-free in every 9-regular candidate