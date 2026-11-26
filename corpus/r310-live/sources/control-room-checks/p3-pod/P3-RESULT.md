# P3 cover run on a pod — result (control room, PRIVATE, 2026-11-22 10:49 UTC)

Against `P3-PREREG.md` (sha256 0ebf3248…, timestamped 10:07 UTC, before the pod existed) and `P3-PART-B-PIN.txt`
(our generator pinned and timestamped at 10:40 UTC, before it ran on the pod).

## What is not established (read first)
1. **That the CNF says what "complete" means.** Two generators written separately give the same clauses on all four
   cores. That is agreement of two readings of `REDUCTION.md` §3, not a proof that §3 is the right definition.
2. **P4 and P5.** That one production CNF per record also serves its 8 images is part of the derivation. So is the
   CNF the production run solved. Neither is touched here.
3. **P1 and P2.** That these four graphs are the cores to consider is from the literature.
4. **The checkers** stay a premise (P6).
5. **Core X0's result was known before the registration** (the Claude track's probe on the Mac). X1, X2 and X3 were
   not run anywhere before.
6. **The agent that wrote our generator saw about 40 lines of `cover7.c` past its header** (the set recursion, the
   graph6 parser, the argument handling), not its clause-writing code. Our generator uses its own enumeration and
   parser. Disclosed in `../P3-X0-CHECK.md`.
7. **One hash in the pod's `OUT.sha256` is of an earlier state of its file:** the script appended its last two lines to
   `progress.log` after hashing it. The same slip as in the production run, this time in my script.
8. **CaDiCaL's binary differs from the production pod's** (3451c0b2… here, 19607ae2… there): the same commit, built
   on another machine. Only the proofs are trusted, through the two checkers, whose binaries are the same as in
   production (dd3b2b90…, ab122a82…).
9. **Nobody outside has read any of it.**

## What the run shows
| Core | Records | Clauses | CaDiCaL | Proof (bytes) | lrat-check | cake_lpr |
|---|---|---|---|---|---|---|
| X0 | 261,824 | 2,135,056 | unsatisfiable, 25 min | 959,209,942 | `c VERIFIED` | `s VERIFIED UNSAT` |
| X1 | 261,586 | 2,133,152 | unsatisfiable, 25 min | 874,612,529 | `c VERIFIED` | `s VERIFIED UNSAT` |
| X2 | 226,943 | 1,856,008 | unsatisfiable, 29 min | 917,941,530 | `c VERIFIED` | `s VERIFIED UNSAT` |
| X3 | 226,655 | 1,853,704 | unsatisfiable, 29 min | 903,232,097 | `c VERIFIED` | `s VERIFIED UNSAT` |

- The records sum to 977,008. Each core has 40,464 side-condition clauses (T 340, M 3,000, L 35,516, R 1,500, X 108)
  and 8 blocking clauses per record.
- **Two generators, one clause set.** On each core the Claude track's `cover7` and our `gen_cover.py` give the same
  multiset (`pod-out/cover*.canon.txt`, `pod-out/ours*.canon.txt`: equal sha256, equal counts, no repeated clause).
- **Controls.** The proof cut to its first half is refused by both checkers on all four cores (lrat-check: `c NOT
  VERIFIED`; cake_lpr: `c empty clause not derived at end of proof`). The twelve left-out records are each
  satisfiable, and each model, decoded at home with our own code, is an image of the left-out record and satisfies the
  side conditions (`CONTROLS-DECODED.txt`).
- X0's CNF and proof have the same sha256 as the Claude track's on the Mac (48cc33ad…, a878ea17…).

## Verdict, by the registered rule
**CERTIFIED on all four cores:** every labelled configuration on each core is one of the 8 images of a record of
`configs.bin`, given items 1–4 above. So premise P3 is now a checked statement up to those items.

## The pod
`gtct64jxg50xsc` (cpu5g, 8 vCPU, 32 GB, US$0.368 an hour): created 10:07 UTC, run 10:08 to 10:39, our generator
10:41, results pulled and hashed at home, deleted at about 10:48 UTC. About US$0.25.
