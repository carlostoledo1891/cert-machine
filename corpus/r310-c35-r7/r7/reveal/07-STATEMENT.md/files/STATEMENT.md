# Chen's case R(7), conditional (sealed 2026-11-22)

If the six premises below hold, no 9-regular triangle-free graph on 40 vertices with independence number at most 9
has two non-adjacent vertices with exactly 7 common neighbours.

Premises (PROD-PREREG.md): P1 e(3,8,27) = 85 (Goedgebeur–Radziszowski); P2 McKay's list of (3,8;27)-graphs is complete;
P3 configs.bin (977,008 configurations, sha256 76c2666b…) is the complete list; P4 r7cnf.c writes the CNF that
REDUCTION.md describes; P5 the derivation in REDUCTION.md; P6 the checkers lrat-check and cake_lpr.

The run: all 977,008 configurations refuted, each proof accepted by both checkers (879,379 at level 3, 97,627 at
level 4, 2 on the full CNF); four controls passed before production; ledger prod-out/prod.tsv, sha256 ba545601….
The rules were timestamped before the pod existed. cert-machine's own decider agrees on the 1,000 registered
cross-check configurations and on the two full-CNF ones, and its own tally of the ledger finds no missing, repeated
or failing row. What is not established is listed first in PROD-RESULT.md.

Work of: the operator's scout with Claude (the reduction, the enumeration, the pipeline and the run's design) and
Astra 6.2 (the second reading of the reduction, the counting rules), and cert-machine (the cross-enumeration, the own
decider, the controls' reading, the tally, the pod).
