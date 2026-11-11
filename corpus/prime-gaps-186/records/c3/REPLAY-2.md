# Prime gaps 186 — the orchestrator's replays of the clean-room programs: the record (2026-11-10, night)

What was owed by `VERDICT.md` ("Not done"): replays of stage (ii) of the P rows, the H rows and the L rows. Done on
one rented machine (POD.txt: `uxtlppa3idcpcc`, 32 vCPU, 21:05–23:04 UTC, about US$2.92; deleted, 404 confirmed).
**A replay shows that the committed program gives the recorded numbers on a second machine. It is not a second
derivation, it proves no axiom, and it does not verify the bound 186.**

## Gaps first

1. **The L-row author's row records for the outer rows were not written by the committed program byte for byte.**
   For all 32 outer rows (Lean groups 0 and 1) the committed `pg186_c3l.py` writes a diagnostic field
   (`diag_root_abs_over_value`) that the author's row files lack, and in 7 of them it writes `tail_factor` as
   strings where the author's files hold the same digits as integers. So the author changed the program's output
   after those rows had run and did not re-run them. Every deciding field is equal (below); the difference is one
   of form. For the 29 inner rows nothing differs but the timing. It is named here because "replayed identical"
   would otherwise say more than was seen.
2. Same programs, same Python (3.12.3), a second rented machine of the same type (CPU here: AMD EPYC 9575F; the
   CPU of the authors' machine was not recorded). Exact integer and decimal arithmetic should not depend on the CPU.
3. The seven extra row files of the L author (the readings not adopted and two controls) were not replayed; the
   replay ran the adopted reading only (`rows 12 0 1 2 3 4 5`).
4. The pod sat idle for 15 minutes after the last program ended (22:49 → 23:04 UTC) before it was deleted: the
   waiter's notice reached the session late. About US$0.37 of the US$2.92.
5. The first copy home pulled a 331 MB cache folder by mistake; it was removed and is not in the record.

## Result

| what | program (sha256) | replayed | compared with the author's results |
|---|---|---|---|
| the caps (again, as stage (ii)'s input) | `pg186_c2.py` `f61c20dc…` | exit 0 | as before |
| P rows, stage (ii a): 6 rows | `pg186_c3ii.py` `6214f703…` on `pg186_c3.py` `75bec4be…` | exit 0, 1,564 s | **every field equal**; only `seconds` differs |
| P rows, stage (ii b): 12 rows | the same | exit 0, 2,186 s | **every field equal**; only `seconds` differs |
| H rows: 6 rows, 8 integers | `pg186_h.py` `214ff9c2…` | exit 0 (prep, outer, inner) | 6 of 6 row records: **every field equal**; only the batch time differs |
| L rows: 61 rows, 93 integers | `pg186_c3l.py` `a7712357…`, `kern.py` `93ad47f5…`, `geom.py` `943e7bad…`, `prep_c2.py` `e437e892…` | exit 0, 41 rows by the renewal branch and 20 by the delay branch, as the author's | 61 of 61 row records: **every deciding field equal** (28 fields, among them `root`, `face`, the exponents, the branch, the product count); the two differences of form of gap 1 on the 32 outer rows; the three timing fields |

The replay's own log gives the word AGREES for 93 of 93 L-row integers.

With `replay-stage-i.txt` (stage (i), 24 of 24 identical) and C2's replay, **every clean-room program has now been
re-run by the orchestrator from a clean copy, and every recorded number came back.**

## Files

`replay2/`: `replay2.sh` (the script as run), `status`, `pod-facts.txt` (the hashes on the pod, Python, CPU),
`ii/` (the two result files and logs), `h/` (six row records and logs), `l/` (61 row records under `out/`, the
logs). The comparisons: field-by-field scripts, `../../../pg186/c3/podtools/cmp_l.py` for the L rows.
