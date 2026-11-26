A2b — the 9-regular symmetric classes 5^8 and 2^20 at 40, with a calibrated engine (the A2 agent; lane 41, PRIVATE)

A2 is recorded (LEDGER.md, 2026-11-25): Cayley graphs of order 40 and the 258-graph pool are excluded with LRAT; 5^8 and
2^20 (9-regular) undecided at 60 min; K1 failed on speed. Task: (1) move the independent-set check into a C propagator
(or a CaDiCaL external propagator / an incremental C loop) or cube on the root's word pattern — your choice, written in
WORKLOG.md before you build it; (2) re-run the calibrations K1 ((3,9;35) under 2^17 1^1: must be FOUND within 10 min),
K2 and K3 (must reproduce their earlier results); (3) only if all three pass, resume 5^8 and then 2^20 at 40, 9-regular,
from the saved CNFs (sha256 45f87126…, 06aa789f…), 90 min each; every UNSAT with LRAT through both checkers and the
clause check; any model verified by both alpha programs and written as WITNESS-<n>.g6 before anything else.
Gate A2b (written before you start): PASS when at least one of 5^8, 2^20 is decided at 40 (UNSAT certified, or a
verified witness) with K1–K3 passing; FAIL otherwise, with the engine's measured speed and how far each run got.
Budget: 3 core-hours, 4 h wall, normal priority (nice 10), one heavy process. Same rules; date -u before any time.
Final message: (1) `A2b: PASS — <type> <UNSAT|WITNESS>` or `A2b: FAIL — <reason>`; (2) what is NOT established;
(3) the engine and calibrations; (4) per type: result, proof size, time; (5) the one next experiment. Verdict line last.
