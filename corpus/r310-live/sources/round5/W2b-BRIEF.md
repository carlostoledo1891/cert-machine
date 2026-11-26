W2b — measure the asymmetric case of W(40,9,3) before attacking it (the window3 agent; PRIVATE)

Your W2: FAIL is accepted as reported (LEDGER.md 2026-11-25 02:28 UTC): no automorphism of prime order >= 11 or of
order 7, order 5 forces G, so every other member has |Aut| = 2^i 3^j; 2^20 down to one sub-part. Astra E is deciding
the prime-order types independently (gate W1c); do NOT work on 2^20 or the order-2/3 types now, and do not read
ROOT/round5/astra-reach/ until it reports.

TASK (measurement only, on mains power; the battery guard stops everything below 30% and continues on mains):
(1) Finish the calibration of the asymmetric split: (22,6,3) from configuration 18,400 to the end (your incremental
    mode), then (23,6,3) in full. Exact classes up to isomorphism, every part through both checkers.
(2) COUNT the configurations of the asymmetric split at (40,9,3) with two programs (genbg pieces and your cfgenum.c),
    or, if the count itself is out of reach, a certified lower bound and an estimate with its method; time per part
    measured on a random sample of at least 50 parts; the projected core-hours.
(3) Propose the coarser split you would use instead (one that also uses the |Aut| = 2^i 3^j fact or the codegree
    profile), with its count at (22,6,3) and (23,6,3) measured, not guessed.
Gate W2b (written before you start): PASS when (22,6,3) is decided in full (exactly the 25 known classes, or new ones
named), (23,6,3) is decided in full, and the (40,9,3) count or bound is computed by two programs. FAIL otherwise, with
what was reached. Budget: 1.5 core-hours, 3 hours of wall time. Same rules as before; new file names only.
Final message: (1) `W2b: PASS — (40,9,3) has <N> configurations, projected <h> core-hours` or `W2b: FAIL — <reason>`;
(2) what is NOT established; (3) the calibration tables; (4) the count and projection; (5) the coarser split with its
measured counts. Last line exactly the verdict line.
