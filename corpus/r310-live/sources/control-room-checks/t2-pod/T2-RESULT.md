# T2, the all-rows comparison of premise P4 — result (control room, PRIVATE, 2026-11-22 17:52 UTC)

Rules: `T2-PREREG.md` (sha256 085bb714…9516, timestamped 12:49 UTC, before the pod existed).

**Outcome: COMPUTED, all equal.** On all 977,008 rows the bytes written by the program compiled from the Lean
definition `R7Cnf.F` equal the bytes built by our own builder, and both have the hash and the size the production
ledger records. No row is missing, repeated or unequal.

## What is NOT established (read first)
1. **T2 is a computation, not a proof.** Two programs agree with the ledger on every row. That is agreement.
2. **The compiled program rests on the Lean compiler and runtime,** and the hashing on coreutils `sha256sum` and
   Python's `hashlib`. One pod, one run.
3. **The ledger is the production pod's own account** of what the solver read. T2 shows that the file named by each
   ledger hash is F for that row. It does not show the solver read that file: that rests on the production script,
   which hashed the file it had just handed to the solver.
4. **The decoding of the inputs is not proved** (graph6, the records, the 6-set numbers). Two programs written
   separately agree on it.
5. **What Lean still lacks around T2** (corrected, see the erratum at the end): no theorem says that the bytes, read
   back as a clause list, are F (the checkers read the file, Lean states F), and nothing in the kernel pins the
   embedded record and level data to the pinned files.
6. **Three log files are outside the pod's hash list** (`progress.log`, `controls.log`, `tally.log`) and `run.log`
   too. The five result files are in it.
7. **My slip:** the pod stood idle for 20 minutes after the run ended, because the watcher's notice reached me late.
   About US$0.32.

## The run
- Pod `bgsew14nsx9in1`, 32 vCPU (cpu3c, US-NE-1), Lean 4.35.0 commit eb6cafb7…, Python 3.12.3, coreutils 9.4.
  `r7cnf_lean` 97caba91…cd46, the mutant `r7cnf_mut` e88541f9…948f.
- Controls at 12:58 UTC, before the run: baseline 200 of 200 equal; A (9 for 10) 200 of 200 differ; B (wrong level)
  200 of 200 differ by both programs; C (one digit of a ledger hash changed) reported unequal by both. CONTROLS PASS.
- Run: 12:59:00 to 17:31:07 UTC, 16,327 seconds, 32 workers, at most 145 CPU-hours. One pass, no restart.
- The pod's tally: `rows 977008 distinct 977008 missing 0 repeated 0 unequal 0 by level {'3': 879379, '4': 97627,
  '7': 2}`, `ALL-EQUAL`.

## Our own tally, at home (`t2_tally_own.py`, `pod-out/TALLY-own.json`)
Written after the pull, separately from the tally inside the run script. It ignores the flag columns.
- 977,008 rows, 977,008 distinct indices, 0 missing, 0 repeated, 0 malformed.
- The three ledger columns the pod used (level, hash, size) equal the full production ledger kept at home
  (`claude-r7/prod-out/prod.tsv`, sha256 ba545601…7793, all 977,008 rows CERTIFIED-UNSAT) on every row: 0 differ.
- Hash strings compared here: Lean's equals the ledger's on every row; ours equals the ledger's on every row.
  Sizes: the three equal on every row. Flags: all 1.
- By level: 879,379 at 3; 97,627 at 4; 2 at 7. The same as the production tally.

## The pull
The five files in the pod's `OUT.sha256` were re-hashed at home: all equal (`t2.tsv` 1e24208d…ce8a, 228,508,900
bytes, kept as `pod-out/out/t2.tsv.gz`). Pull verified 17:50:25 UTC. The pod was deleted at 17:51 UTC after that.
Cost: 5.0 hours at US$0.96, about US$4.80.

## What this closes
Premise P4 had three parts. T0 (the page's formula against 77 files) and T1 (the Lean proof that F is sound) were
built by our route earlier (`../P4-PAGE-TEST.md`, `../P4-LEAN-READ.md`). T2 is now computed on every row.

## Files
| File | sha256 |
|---|---|
| `T2-PREREG.md` | 085bb714897ea78488b575e90104e306a3d9bd7ceaa49381e7cef90060479516 |
| `t2-bundle.tar.gz` | 11d0055dd1ceb60e7366149ceafb5626a733cc497e839c0d3e74c3b4e3506cf5 |
| `pod-out/OUT.sha256` | 4f77b84e79ff3628a81df861825de4eabef0ba2878e0b153ed94c6905d20db8a |
| `pod-out/out/t2.tsv.gz` (the gzip made during the pull) | 91fdac12286219c9a4f95971bc45e7da8aab03a1c5d680942ffc9705f3319873 |
| `pod-out/out/t2.tsv` (uncompressed, as on the pod) | 1e24208d9122c3070657f55871ce04fcdd8fa52f425a2443f4b850cf5b6bce8a |
| `pod-out/run.log` | 5867813cacf465dae51f4435b95d6fe13485babe1ecf3c8b0fb31f222b86c90c |
| `pod-out/out/progress.log` | 6e3286406fe51e9125b7cb3090e95b6a1c6a74784710cc0f5767d86067def011 |
| `t2_tally_own.py` | fd60d41527913a3def045b6ad67a1bdc310864af8bb5b15e4ef6ce70f1ffac71 |
| `pod-out/TALLY-own.json` | 690057c6c2521ee98a586330601cd489f27ad7b41ce3944bb358503541d83942 |

## Erratum, 2026-11-22 18:59 UTC
Item 5 first read: "No theorem yet joins T1 to the other track's modules … the closing theorem of the other track takes
'every F is unsatisfiable' as a hypothesis in its own words." That was wrong, and the error was mine: it repeated a gap
from our 12:49 UTC reading that the other track's bridge closed at 13:36 UTC. Checked now in the files:
`codex-r7-scout/R7CnfBridge.lean` imports `R7Cnf` and `R7CnfSound` and applies `R7Cnf.T1` at line 54, and the hypothesis
`unsat` of `no_r7_production` is written with the Claude track's own constants (`R7Cnf.Sat`, `R7Cnf.F`,
`R7Cnf.inputOf coreLines cfg idx.val`). So "F at the record's level is unsatisfiable" is one proposition on both sides.
The Claude track pointed this out (its message of 18:51 UTC). Item 5 above now states what is actually missing.

