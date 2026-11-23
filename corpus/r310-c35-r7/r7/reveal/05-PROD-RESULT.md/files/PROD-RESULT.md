# R(7) production run — result (PRIVATE; control room, 2026-11-22 08:36 UTC)

Against `PROD-PREREG.md` (sha256 99731718…, timestamped at 02:13 UTC, before the pod existed).

## What is not established (read first)

1. **The theorem is conditional on six premises, and this run checks none of them.**
   - P1, P2: e(3,8,27) = 85, and McKay's list of (3,8;27)-graphs is complete. Both are from the literature. Our own
     filter of McKay's list finds 4 graphs with 85 edges and none below.
   - P3: `configs.bin` is the complete list of configurations. Three enumerations agree and ours is byte-identical
     (sha256 76c2666b…). That is agreement, not a checked proof.
   - P4, P5: `r7cnf.c` writes the CNF that `REDUCTION.md` describes, and the derivation in `REDUCTION.md` is right.
     Neither is formalised. Astra read the reduction (`codex-r7-scout/r7-reduction-review.json`); the control room did
     not re-run that reading.
   - P6: the two proof checkers, lrat-check and cake_lpr.
2. **The proofs are not at home.** Each CNF and proof was deleted on the pod after both checkers read it, as registered
   (about 2.5 TB otherwise). The ledger holds, per configuration, the sha256 of the CNF and of the proof and each
   checker's verdict line. A proof can be made again from the pinned tools. On the 1,200 sampled configurations the CNF
   hashes matched the Mac's on all 1,200 and the proof hashes on 1,184.
3. **The ledger is the pod's own account of what its checkers said.** Independent of it we have the four controls,
   our own decider on 1,002 configurations, and our own tally of the ledger.
4. **One hash in `OUT.sha256` is of an earlier state of its file.** The script hashed `RUN-MACHINE.txt` and then
   appended the end time to it. The file without its last line has the listed hash (bc6f2b34…). Nothing else differs.
5. **Nothing here has an outside reader.** It is private, and nobody outside the scout has seen it.
6. **This closes one case only.** It is Chen's open case R(7). It does not decide R(3,10).

## What the run shows

- **All 977,008 configurations ended `CERTIFIED-UNSAT`.** None is open, none is missing, none is repeated.
  - By level: 879,379 at level 3, 97,627 at level 4, and 2 at level 7 (the full CNF).
  - Each record has the lrat-check line `c VERIFIED` and the cake_lpr line `s VERIFIED UNSAT`.
- **The four controls passed before production.** The solvable cases were found with verified graphs (10 of 10, and
  10, 9 and 2 on the other three cores). Both checkers refused all 24 truncated proofs. The 1,200 samples were
  reproduced at the same level with the same CNF hash.
- **Cost:** 677,467 CPU-seconds (188 CPU-hours of the 400 registered), 22,466 s of wall time on 32 vCPU.
- **Ledger:** `prod-out/prod.tsv`, sha256 ba545601b42d7796ff8e8dc8b8d671f05f83ce14c24c90bb484b985dbeb47793, equal to
  the pod's `OUT.sha256`.

## The control room's own checks

- **Own tally** (`r7-scout/tally_prod.py`, which does not use `prod.py`; result in `r7-scout/PROD-TALLY-own.json`):
  977,008 rows, 977,008 distinct indices, 0 missing, 0 repeated, 0 rows failing a rule of the registration.
- **The registered cross-check.** `xcheck_1000.txt` equals the sample drawn again from seed 20261122. Our own decider
  (`r7-scout/r7own.py`: own CNF, own solver run, own check, written from the statement) found all 1,000 unsatisfiable
  with a verified proof. The ledger agrees on all 1,000 (894 at level 3, 106 at level 4).
- **An extra, not registered.** The sample held neither of the two level-7 configurations (332942 and 745446). Our
  decider ran on both after the run: both unsatisfiable, both proofs verified (`r7-scout/xcheck-own-level7.tsv`).

## The statement, as it stands

If P1–P6 hold: **no 9-regular triangle-free graph on 40 vertices with independence number at most 9 has two
non-adjacent vertices with exactly 7 common neighbours.**

## The pod

`n9hh8s89pb4o4y` (32 vCPU, US$1.12 an hour): created 02:15 UTC, production 02:17:45 to 08:32:12 UTC, results pulled
and hashed at home, pod deleted at about 08:35 UTC. About US$7.
