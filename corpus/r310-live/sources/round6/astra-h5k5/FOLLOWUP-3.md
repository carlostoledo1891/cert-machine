Line F, third task. Your H2: PASS — H5 is K4-free in every 9-regular candidate — is accepted as reported (LEDGER.md,
2026-11-26). Same rules as before (ONE process; no nice inside the sandbox; hourly CHECKPOINT; WORKLOG every half hour;
date -u; new file names; never overwrite a reported file).

YOUR TASK: triangles in H5 (three independent roots pairwise at codegree 5) in a 9-regular candidate. First classify
every intersection pattern of such a triple (the triple intersection t and the pair cells; say how many patterns,
counted two ways). Then your proposed case first — the three roots sharing all five common neighbours (t = 5): the
twelve private neighbours form the small catalogue graph, and the test is whether they can share the 20-vertex exterior
with the five common vertices, each needing six independent neighbours there — then every other pattern, largest
exterior first. Cheap degree and local arguments first, SAT with LRAT through lrat-check AND cake_lpr for the rest;
every split's completeness checked two ways; controls as before (a planted positive must come back).
Gate H3 (written before you start): PASS when every pattern is decided — then H5 is triangle-free in 9-regular
candidates (or the surviving patterns are listed with their frontier); FAIL otherwise, with each pattern's state.
Budget: 2 core-hours, 3 hours of wall time.
Final message: (1) `H3: PASS — <statement>` or `H3: FAIL <k> of <n> patterns decided`; (2) what is NOT established;
(3) the argument, certificates, counts and controls; (4) the per-pattern table; (5) the one next experiment. Last line
exactly the verdict line.
