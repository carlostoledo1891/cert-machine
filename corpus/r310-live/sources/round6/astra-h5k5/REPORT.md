H1: PASS — H5 is K5-free in the 9-regular case, without a codegree cap

**REASONED — What remains open.** This does not decide whether a triangle-free graph on 40 vertices with independence number at most nine exists. It excludes five pairwise codegree-five roots in any 9-regular candidate. [Full report](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/REPORT.md)

**REASONED — The decisive contradiction.** Take the exterior of four of the five roots. It has 17 vertices and independence number at most five. The fifth root lies in this exterior, where its only neighbours are its three singleton-trace vertices. It therefore has degree three. Every graph in McKay’s complete seven-graph catalogue has minimum degree four. This argument uses no codegree cap. [Premise and catalogue checks](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/premises.json)

**COMPUTED — Premises.** Independent trace enumeration recovered the two four-root types, the unique five-root profile with exterior \(C_{13}(1,5)\), and zero six-root profiles. The core has 39 independent four-sets and 221 disjoint unordered pairs. Direct affine expansion, centred difference sets, and an independent traversal from cyclic gaps all confirmed the seven-orbit split. Catalogue completeness was taken as input. [Premise counts](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/premises.json) · [Independent audit](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/audit.json)

**COMPUTED — Joint SAT results.** Each orbit used 365 shared edge variables for all five four-trace rows and fifteen singleton rows, with fixed core identities, exact degrees, triangle constraints, and codegree bounds. In every orbit, 195 global ten-set clauses already sufficed for UNSAT. Both LRAT checkers accepted every proof. [Formulas, proof links and checker records](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/REPORT.md)

| Orbit | Disjoint pairs covered | Checked CNF clauses | Result | lrat-check / cake_lpr |
|---:|---:|---:|---|---|
| 1 | 26 | 211,930 | UNSAT | ✓ / ✓ |
| 2 | 26 | 211,930 | UNSAT | ✓ / ✓ |
| 3 | 52 | 211,926 | UNSAT | ✓ / ✓ |
| 4 | 52 | 211,926 | UNSAT | ✓ / ✓ |
| 5 | 13 | 211,930 | UNSAT | ✓ / ✓ |
| 6 | 26 | 211,930 | UNSAT | ✓ / ✓ |
| 7 | 26 | 211,922 | UNSAT | ✓ / ✓ |

**COMPUTED — Independent certificate and controls.** A separate 39-variable proof certifies the uncapped obstruction directly. Two singleton vertices of one root always miss the same independent core four-set. Those six vertices and the other four roots form an independent ten-set. Both checkers accepted this proof. The joint encoder recovered the planted 24-vertex, 7-regular graph with a genuine codegree-five K5. On a soluble 16-vertex control, global separation rejected eight violating models before accepting a graph of exact independence number five. [Local certificate](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/runs/pair-lemma/pairs.lrat) · [Control audit](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/final_audit.json) · [Run register](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/RUNS.md) · [Verified SHA256SUMS](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/SHA256SUMS)

**REASONED — One next experiment.** Test whether either four-root type can extend a 17-vertex exterior to all four overlapping three-root exteriors while sharing every physical edge. This targets a K4 in H5. [Experiment specification](/Users/carlostoledo/Projects/cert-machine/notes/ramsey-r310-scout-2026-11-21/round6/astra-h5k5/work/REPORT.md)

H1: PASS — H5 is K5-free in the 9-regular case, without a codegree cap