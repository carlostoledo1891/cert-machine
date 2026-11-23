# P3 cover run on a pod — pre-registration (control room, PRIVATE, 2026-11-22 10:07 UTC)

Timestamped before the pod exists. The operator's word: "On a small pod now" (the session dialog, about 10:00 UTC).

## What is not established, whatever the run returns
1. **That the CNF says what its header says.** Two generators written separately must give the same clauses (the Claude
   track's `cover7.c` and the control room's own, still being written when this is registered). Equal clause sets are
   agreement of two readings, not a proof.
2. **That the CNF's models are the labelled configurations of `REDUCTION.md` §3.** That is a reading of §3.
3. **Anything about premises P4 and P5.** That one production CNF per record also serves its 8 images is part of the
   derivation, not of this run.
4. **Core X0 already ran once, as a probe on the Mac** (Claude track, Homebrew's CaDiCaL 3.0.1): unsatisfiable, both
   checkers accepted. So the result on X0 is known before this registration. X1, X2 and X3 have not run anywhere.

## The statement, per core
One CNF over the four side rows only, 108 variables v(r, y) = 1 + 27 r + y. Clause families (T), (M), (L), (R), (X) are
the side conditions; family (B) blocks the 8 labelled images of every record of `configs.bin` on that core
(`cover7.c`, header). It is unsatisfiable exactly when every labelled configuration on the core is an image of a record.

## Pins (`bundle/P3-PINS.sha256`)
`cover7.c` 0e9b28ce…, `configs.bin` 76c2666b…, `cores_e85.g6` 6b237361…, this run's script, and the checker sources
from the R(7) bundle (lrat-check.c bf07c2ac…, cake_lpr.S d20ceae0…). CaDiCaL 3.0.1 is built on the pod from commit
c60730422e758ef1cebe7aeddf2dda31c996bf04, as in the production run.

## The run (`p3_pod_run.sh`)
For each core 0..3: the CNF by `cover7`, its sha256 and counts; CaDiCaL with a text LRAT proof (cap 3 hours);
lrat-check and cake_lpr on that CNF and proof; then the proof is hashed and deleted. The CNFs are kept on the pod for
the comparison with the control room's own generator.

## Controls
- Per core, three records left out, drawn by `random.Random(20261122 + core).sample(range(records on the core), 3)`.
  Each must be satisfiable, and its model, decoded at home with our own code, must be an image of the left-out record.
- Per core, the proof cut to the first half of its lines must be refused by both checkers.

## Verdict, per core
- **CERTIFIED** (the list is complete on that core, given items 1–2 above): unsatisfiable; lrat-check prints
  `c VERIFIED` and cake_lpr prints `s VERIFIED UNSAT`; the two generators' clause sets are equal as multisets under a
  stated variable map; the controls pass. Verdicts are read from the output lines, never from exit codes.
- **A satisfiable cover CNF** means a labelled configuration is missing from `configs.bin`. The model is decoded and
  checked twice at home. If it stands, the R(7) result does not cover that configuration. It goes to the operator at
  once and nowhere else.
- **REFUSED**: a cap reached, a checker refusing a full proof, the generators disagreeing, or a control failing, each
  named.
- P3 as a whole is the four cores together. One core missing leaves P3 open.

## Cost
A CPU pod with 8 vCPU and 32 GB (cpu5g, about US$0.37 an hour), about 1 to 1.5 hours: under US$1. Deleted after the pull.
