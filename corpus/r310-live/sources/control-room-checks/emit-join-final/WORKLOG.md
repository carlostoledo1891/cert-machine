# The second-program join, final: our R(6) three-edge ledger against emit (PRIVATE; 2026-11-24, 03:01 UTC onward)

One agent of the control room, once. Nothing left this machine: no network, no git write, no pod. Written only inside
`control-room-checks/emit-join-final/`; no existing file edited, moved or deleted (scratch copies for the planted
cases were written to the session's scratch folder and deleted after each case). One process of mine at a time, niced
(`nice -n 10`). Python run as `/opt/homebrew/bin/python3 -I` (3.14.7). The Mac was on AC power.

## 1. What is compared in a join (so that "equal" has a meaning)

**The two files.**
- Ours: `r6-full/pod-final-resumed/out/cores.jsonl` — one JSON object per core, written by `full_run.py` on the pods
  (x86_64, gcc). 23,409 rows.
- emit (v1): `emit-pod-2026-11-23/emit-out/cores.jsonl` — one JSON object per core, written by the emit-compare driver
  on pod vqd3jbd3uasgp6 (x86_64, g++ 13.3). 23,409 rows. Source `src/emit.cpp` 0e1618ce…c569.

**The key.** A row belongs to the core named by its `line` field: the 0-based line number in `catalogue.g6`
(0d3d2caf…208d, 23,409 lines). File position means nothing (both files are in completion order; emit's first row is
line 5, ours is line 10).

**The five things compared per core** (my `join_final.py`; all five must hold for "equal"):

| # | Name | Our field | emit's field | What it is |
|---|---|---|---|---|
| 1 | identity | `g6_sha256` | `g6_sha256` | both must also equal sha256 of catalogue line `line`, without its newline (recomputed here) |
| 2 | baseline | `baseline` (enum_own's `configs`) | `baseline` (emit's first stderr number) | the number of canonical baseline configurations. **A number only**: neither program writes these records |
| 3 | hall | `hall` (enum_own's `hall_both_directions`) | `hall` (emit's second stderr number) | the number of records surviving the Hall screen on both sides |
| 4 | bytes | `hall_stream_bytes` | `hall_stream_bytes` | must be 24 × hall on each side |
| 5 | stream | `hall_stream_sha256` | `hall_stream_sha256` | sha256 of all Hall survivors as 24-byte records (six little-endian 32-bit vertex masks: three A rows, then their three matched B rows), in the order written |

Row 5 is the strong one: equal stream hashes mean the two programs wrote the same records in the same order, byte for
byte. Rows 3 and 4 follow from it; row 2 is independent of it and is only a count.

**Per side, a row must also be valid** (else the core is `invalid`, never equal): ours `enum.exit == 0`; emit
`exit == 0`; on both, the three numbers are JSON integers, the two hashes are 64 hex digits, bytes = 24 × hall,
0 ≤ hall ≤ baseline.

**What is NOT compared, because emit has nothing to compare with:** our `verdict` (EXCLUDED on all 23,409), the tests'
outcomes (`reasons`, `open_by_tests`, `direct`, `xcheck`), `rows`, `side_triples`, `oriented`, `self_symmetric`, times,
machines. **emit has no verdict.** It is a counter of the enumeration, not a second decider. A join that says "equal"
says the two programs enumerate the same Hall survivors; it says nothing on whether those survivors are then rightly
refuted.

**Classes** (each core id 0..23408 gets exactly one): `equal`, `different_predicted`, `different_unpredicted`,
`invalid`, `missing_ours`, `missing_emit`, `missing_both`, `duplicated`.
A difference is **predicted** only if the core is one of the 32 of `hall-disagreement/predicted-join.json` AND all of:
identity holds; baselines equal; emit.hall − ours.hall = the predicted extras x; bytes differ by 24x; our hall and our
stream sha256 equal the note's `left_records` / `left_sha256` (emit's stream minus the scanner's extra records;
`verify-diff.jsonl`, `verify-diff-pending.jsonl`); emit's hall and stream equal what the note recorded for emit.
On every core, of any class, one more rule is checked: emit.hall − ours.hall = `scan-all.jsonl`'s `extras` for that line.

**Compared with `emit-join-own/join_own.py`** (123711d8…815d; read only after mine was written and run):
- Same key (`line`), same four value fields (`baseline`, `hall`, `hall_stream_bytes`, `hall_stream_sha256`), same
  identity source (sha256 of the catalogue line). So "equal" means the same thing in both on rows that both call equal.
- Differences, all in the direction of mine being stricter:
  - join_own counts a g6 mismatch in a side counter but still calls the core `equal` if the four fields agree. Mine makes
    identity part of "equal".
  - join_own lets a repeated id overwrite the earlier row (counts `dup`, joins the last). Mine classes the core `duplicated`.
  - join_own iterates over emit's rows; a core missing from both files is not seen (it asserts the catalogue length but
    does not walk 0..23408). Mine walks the catalogue.
  - join_own does not check our `enum.exit`, bytes = 24 × hall, hall ≤ baseline or JSON types (`3.0 == 3` in Python).
  - join_own has no notion of a predicted difference.
- I did not run join_own.py on today's files; I compared definitions only, as asked.

## 2. The inputs, re-hashed (03:03 UTC)

| Input | Recorded | Re-hashed here |
|---|---|---|
| our ledger `r6-full/pod-final-resumed/out/cores.jsonl` | `FINAL.sha256`: 34a673241985acea10af966013674de834ff89295303621f2d0ac43f8b6a5d7b | **equal** (`shasum -c FINAL.sha256`: all 9 files OK, the ledger among them) |
| emit's ledger `emit-pod-2026-11-23/emit-out/cores.jsonl` | `OUT.sha256`: f5be47c0f01bfbb8567ad2ebbd8bc9c002a6c8772e1edcb51e128dc0301bcf0b | **equal** (`shasum -c OUT.sha256`: cores.jsonl OK, run.json OK) |
| `r6-full/bundle/catalogue.g6` | emit's `run.json` `catalogue_sha256` and the note: 0d3d2caf830c9d5af9ad64ce6da120c83cd12600bc0acf70ae90f747dfab208d | **equal**; 23,409 lines, 23,409 distinct line hashes |
| `HALL-DISAGREEMENT-2026-11-23.md` | the control room's log: 29f7757c…0d60 | **equal** (29f7757ca931b3b8e5b6d5da88cb7383ffd0aa6df32d7b29b35d8b5458ca0d60) |
| `hall-disagreement/SHA256SUMS` | the note: d0b4ecac…140a, 60 files | **equal**; all 60 files OK |
| emit v1 source `…/gate/.gate/attempt-2z3kjg8k/emit-linux/src/emit.cpp` | emit's own `SHA256SUMS`: 0e1618ce…c569 | **equal**; the same bytes as `hall-disagreement/emit-fix/emit.cpp.orig` and `r6-round38/emit/extract/emit-linux/src/emit.cpp` |
| the pod's emit binary `…/emit-linux/emit` | the gate's PASS.json: 70270e89…2547 | **equal** (ELF x86-64; not runnable here) |

**Coverage of core ids 0..23408** (from `join-final.json`):
- ours: 23,409 file lines, 0 unreadable, 0 ids outside the range, 23,409 distinct ids, 0 missing, 0 repeated; verdict EXCLUDED on all 23,409.
- emit: 23,409 file lines, 0 unreadable, 0 ids outside the range, 23,409 distinct ids, 0 missing, 0 repeated; `exit` 0 on all.

What a hash match means: the files are the ones pulled and recorded. It does not show that the pods computed them
rightly; both hash files were written by the same side that wrote the ledgers.

**The earlier ledger is carried.** The 10,425-row ledger of the first join
(`r6-full/pod-partial-before-final-2026-11-24T0047/out/cores.jsonl`, 265b8eda…1149, the hash the note names; files
dated 07:33 UTC 23 Nov) has all 10,425 rows in the final ledger, identical as JSON.

## 3. The full join (03:03 UTC; re-run 03:05 UTC after a fix to the tally, see below)

`python3 -I join_final.py <ours> <emit> <catalogue> hall-disagreement > join-final.json` — exit 0, about one second.

| Class | Cores |
|---|---:|
| equal (all five comparisons) | **23,377** |
| different, predicted | **32** |
| different, unpredicted | **0** |
| invalid row | 0 |
| missing in ours / in emit / in both | 0 / 0 / 0 |
| duplicated | 0 |
| affected-list core found equal | 0 |
| scan-rule mismatch (emit.hall − ours.hall ≠ the scanner's extras) | 0 of 23,409 |

Sums over all 23,409: baseline 101,564,232,221 in both; Hall ours 92,080,292,598 (= our TALLY.txt), emit
92,080,307,493; difference **14,895** = the note's total.

**Every core that differs** (all 32 differ in hall, bytes and stream only; identity and baseline equal; every check of
"predicted" true; our verdict EXCLUDED on all 32):

| Line | ours hall | emit hall | emit − ours | predicted | in the 32 | = prediction | pending at the note |
|---:|---:|---:|---:|---:|---|---|---|
| 115 | 3,246,684 | 3,247,368 | 684 | 684 | yes | yes | no |
| 1078 | 3,260,945 | 3,261,094 | 149 | 149 | yes | yes | no |
| 1218 | 4,867,261 | 4,867,627 | 366 | 366 | yes | yes | no |
| 1222 | 5,453,201 | 5,453,591 | 390 | 390 | yes | yes | no |
| 1271 | 5,226,996 | 5,227,229 | 233 | 233 | yes | yes | no |
| 1272 | 4,474,187 | 4,474,352 | 165 | 165 | yes | yes | no |
| 1389 | 2,925,047 | 2,925,067 | 20 | 20 | yes | yes | no |
| 4388 | 6,462,075 | 6,462,517 | 442 | 442 | yes | yes | no |
| 4392 | 4,976,055 | 4,976,560 | 505 | 505 | yes | yes | no |
| 4393 | 6,498,547 | 6,499,187 | 640 | 640 | yes | yes | no |
| 6479 | 2,844,491 | 2,844,513 | 22 | 22 | yes | yes | no |
| 7430 | 3,787,013 | 3,792,591 | 5,578 | 5,578 | yes | yes | no |
| 7978 | 5,413,785 | 5,414,098 | 313 | 313 | yes | yes | no |
| 9605 | 4,792,594 | 4,793,254 | 660 | 660 | yes | yes | no |
| 9938 | 3,663,637 | 3,667,524 | 3,887 | 3,887 | yes | yes | no |
| 10149 | 2,804,534 | 2,804,711 | 177 | 177 | yes | yes | no |
| 10971 | 6,030,628 | 6,030,660 | 32 | 32 | yes | yes | yes |
| 10999 | 5,872,265 | 5,872,306 | 41 | 41 | yes | yes | yes |
| 11968 | 6,489,262 | 6,489,287 | 25 | 25 | yes | yes | yes |
| 11971 | 6,675,225 | 6,675,243 | 18 | 18 | yes | yes | yes |
| 11973 | 7,043,071 | 7,043,088 | 17 | 17 | yes | yes | yes |
| 12813 | 4,628,034 | 4,628,041 | 7 | 7 | yes | yes | yes |
| 12894 | 6,019,135 | 6,019,139 | 4 | 4 | yes | yes | yes |
| 12900 | 5,206,945 | 5,206,947 | 2 | 2 | yes | yes | yes |
| 12902 | 3,676,877 | 3,676,890 | 13 | 13 | yes | yes | yes |
| 13353 | 2,893,638 | 2,893,662 | 24 | 24 | yes | yes | yes |
| 13563 | 13,776,174 | 13,776,200 | 26 | 26 | yes | yes | yes |
| 16673 | 1,744,937 | 1,745,137 | 200 | 200 | yes | yes | yes |
| 17840 | 4,082,203 | 4,082,204 | 1 | 1 | yes | yes | yes |
| 21530 | 3,597,293 | 3,597,416 | 123 | 123 | yes | yes | yes |
| 21708 | 3,905,583 | 3,905,708 | 125 | 125 | yes | yes | yes |
| 23348 | 2,036,207 | 2,036,213 | 6 | 6 | yes | yes | yes |

"= prediction" means the count AND our stream's sha256 equal the note's (`left_records`, `left_sha256`), and emit's
side equals what the note recorded for emit. Both full hashes per core are in `join-final.json`.

**How much of this was a prediction.**
- The 16 "pending" lines: yes. Their predicted counts and stream hashes are printed in the note (hash logged by the
  control room, equal today) and in `verify-diff-pending.jsonl` (file time 07:54 UTC 23 Nov). Our run reached these
  cores later: the earliest (10971) started 08:14:16 UTC 23 Nov, the last (23348) ended 00:42:09 UTC 24 Nov
  (`started_utc`/`ended_utc` in our ledger). I also checked the note's own printed table against our final ledger:
  16 of 16 on count and sha256. The order rests on local file times and our ledger's own clock, not on an outside stamp.
- The 16 "joined" lines: no. Our rows were in hand when the note was written; there the note REPRODUCES our stream
  from emit's (emit minus the scanner's records), which is a consistency check, not a forecast.
- The 23,377 equal lines: the note predicted "no extras" for each (the scanner). 10,409 of them had been joined
  already; for the other 12,968 it was a forecast, and it holds on all.

**With no predictions given** (`join_final.py … -`, `join-final-no-predictions.json`): 23,377 equal, 32
`different_unpredicted`, exit 1. So the 32 are differences in the raw join; only the note turns them into "predicted".

**A slip of mine, kept.** The first pass (`first-pass/`) of join_final.py counted a core twice in the `unexpected`
tally when it was both `different_unpredicted` and a scan-rule mismatch. The classes were right; four planted cases
showed the tally at 2 (or 4) where I expected 1 (or 2). I changed the tally to count each core once and re-ran the
join and every planted case. The join's output is identical to the first pass apart from the program hash and the new
`unexpected_cores` list (checked field by field).

## 4. Planted cases (`controls.py` → `controls.json`; 03:05 UTC)

Each case is a copy of one ledger with one change, joined against the other real ledger. Cores touched: unaffected
12345 and 20001, affected 1389 (chosen before any case ran).

| Case | Expected | Observed |
|---|---|---|
| copy, nothing changed | 23,377 / 32 / 0, exit 0 | as expected |
| ours: one count +1 (bytes left alone) | that core `invalid`, exit 1 | as expected |
| ours: one count +1 with bytes +24 | that core `different_unpredicted`, exit 1 | as expected |
| ours: one count −1 with bytes −24 | `different_unpredicted`, exit 1 | as expected |
| ours: one baseline +1 | `different_unpredicted`, exit 1 | as expected |
| ours: one stream hash altered (one hex digit) | `different_unpredicted`, exit 1 | as expected |
| ours: one g6_sha256 altered | `different_unpredicted`, exit 1 | as expected |
| **ours: two rows swapped in the file** | **no difference**, exit 0 | as expected |
| ours: the ids of two rows exchanged | both cores `different_unpredicted`, exit 1 | as expected |
| ours: one row deleted | `missing_ours` 1, exit 1 | as expected |
| ours: one row repeated | `duplicated` 1, exit 1 | as expected |
| ours: one of the 32 off by one more than predicted | 31 predicted + 1 `different_unpredicted`, exit 1 | as expected |
| ours: one of the 32 with the predicted count, another stream | 31 predicted + 1 `different_unpredicted`, exit 1 | as expected |
| ours: one of the 32 made equal to emit | flagged `affected_but_equal`, exit 1 | as expected |
| emit: one stream hash altered | `different_unpredicted`, exit 1 | as expected |
| emit: one exit status 1 | `invalid`, exit 1 | as expected |
| emit: one row deleted | `missing_emit` 1, exit 1 | as expected |
| ours: one count as a float (3.0 for 3) | `invalid`, exit 1 | as expected |
| ours: one row cut to 200 bytes | unreadable line + `missing_ours`, exit 1 | as expected |

19 of 19 on the second pass (15 of 19 on the first, for the tally reason above; the classes were right on all 19).

**Swapped rows: my join does not report them, and that is the right behaviour.** The join is by core id (`line`), and
a row carries its own id and its own graph hash. Both ledgers are written in completion order by 32 parallel workers,
so position has no meaning and the two files are in different orders already. What must be caught is content under
the wrong id, and it is: exchanging the ids of two rows makes both cores differ (identity fails against the catalogue
line, and the counts differ).

**What no planted case can show:** the same wrong number in both ledgers. The join is blind to it by construction.

## 5. emit v2 on the 32, and the controls (03:06–03:22 UTC)

**Build.** `patch -s -o build/emit_v2.cpp <the pinned src/emit.cpp 0e1618ce…c569> < hall-disagreement/emit-fix/emit-slot.patch`
(89dd391c…4537), exit 0. The result is byte-identical to the note's `emit-fix/emit_slot.cpp` (e92c58b0…9814; `cmp`).
Built as emit's own `build.sh` builds: `c++ -std=c++20 -O3 -Wall -Wextra -pedantic` (Apple clang 21.0.0, arm64), no
compiler message. `build/emit_v2` dbecdf15…7230. The unpatched source built the same way: `build/emit_v1` 9bd2775e…b751.
- My `emit_v2` binary is not byte-identical to the note's `bin/emit_slot` (1bca777c…ca02): same size (57,288 bytes),
  465 bytes differ. Same source bytes, same flags as far as the note says. I did not find out why and did not run the
  note's binary. Everything below is from my build.

**What the patch is** (read in the diff, 7 lines, and in `emit_v2.cpp` l.104–206): a side-level flag `slots_ok`
(|P| ≤ 6; every label p ∈ P has a row meeting P exactly in {p}; with fewer than six labels some row avoids P) is ANDed
into each mate's `ok`. The candidate lists, the visiting order and the baseline counter (`configs++`, before any flag
is read) do not depend on `ok`. So by reading, v2's baseline equals v1's and v2's stream is v1's with some records
removed, in the same order. The runs agree with that on every core run.

**The lists were written before any run**: `selection.json` (03:06:28 UTC; the 32 of `predicted-join.json` and the 20
controls). Controls: the 20 smallest sha256 of the catalogue line without its newline (= `g6_sha256`), among the
23,377 cores not in the affected list: lines 17692, 17071, 19085, 6750, 5, 8328, 13069, 14626, 21918, 2401, 8867,
9340, 13, 2674, 12576, 8148, 9622, 3017, 9565, 2930 (in hash order).

**The runs** (`run_v2.py`; one child process at a time; the stream hashed from the pipe, nothing stored; free disk 9
to 11 GB throughout, floor 3 GB never approached):

| Run | File | Cores | CPU, child processes | Not run |
|---|---|---:|---:|---|
| emit v2 (Mac build) on the 32 + 20 | `v2-runs.jsonl` | 52 | 257.3 s | none |
| emit v1 (Mac build) on the same 52 — an addition | `v1-mac-runs.jsonl` | 52 | 261.9 s | none |
| emit v2 (Mac build) on 77 more controls — an addition, see below | `v2-extra77-runs.jsonl` | 77 | 364.2 s | none |
| | | | **883.4 s = 14.7 CPU-minutes** (budget 3 CPU-hours) | |

Every invocation: exit 0, stream bytes = 24 × Hall count, line hash equal to both ledgers' `g6_sha256`.

**emit v2 on the 32 affected cores: 32 of 32 equal to OUR final ledger** on baseline, Hall count, stream bytes and
stream sha256. On each, v2's baseline equals v1's and v2 has exactly the predicted number fewer records than v1 (sum
14,895). Per core (hall = v2 = ours; stream = v2 = ours, first 12 hex digits; full hashes in `v2-summary.json`):

| Line | hall (v2 = ours) | v1 − v2 | stream sha256 (v2 = ours) | v2 = ours |
|---:|---:|---:|---|---|
| 115 | 3,246,684 | 684 | 521b54945339 | equal |
| 1078 | 3,260,945 | 149 | 5f893aad8ee1 | equal |
| 1218 | 4,867,261 | 366 | b3b87716fb14 | equal |
| 1222 | 5,453,201 | 390 | 7d993af66ae1 | equal |
| 1271 | 5,226,996 | 233 | 9afd7ef8c0ae | equal |
| 1272 | 4,474,187 | 165 | aa790972ca0b | equal |
| 1389 | 2,925,047 | 20 | 07804f93c165 | equal |
| 4388 | 6,462,075 | 442 | da180c153146 | equal |
| 4392 | 4,976,055 | 505 | 6778f44d3455 | equal |
| 4393 | 6,498,547 | 640 | 01de298931f8 | equal |
| 6479 | 2,844,491 | 22 | a28109956749 | equal |
| 7430 | 3,787,013 | 5,578 | 03a50e09e6bb | equal |
| 7978 | 5,413,785 | 313 | 2cfd14325f0d | equal |
| 9605 | 4,792,594 | 660 | 3e104c616d62 | equal |
| 9938 | 3,663,637 | 3,887 | 9d584ce137af | equal |
| 10149 | 2,804,534 | 177 | 578e7181fb26 | equal |
| 10971 | 6,030,628 | 32 | b5dafec47c7e | equal |
| 10999 | 5,872,265 | 41 | 66e12562c540 | equal |
| 11968 | 6,489,262 | 25 | d67d8bc7be42 | equal |
| 11971 | 6,675,225 | 18 | 54b297c51b74 | equal |
| 11973 | 7,043,071 | 17 | d2dd60f5c8d1 | equal |
| 12813 | 4,628,034 | 7 | d4ad8e56ece2 | equal |
| 12894 | 6,019,135 | 4 | 2d4272e0c95e | equal |
| 12900 | 5,206,945 | 2 | 3c6a4e9d4c9b | equal |
| 12902 | 3,676,877 | 13 | 355ce15a89e5 | equal |
| 13353 | 2,893,638 | 24 | 65e7131a91c1 | equal |
| 13563 | 13,776,174 | 26 | 25f76aff2a11 | equal |
| 16673 | 1,744,937 | 200 | 2c4fd2fa5e46 | equal |
| 17840 | 4,082,203 | 1 | 56dfb1edcbe6 | equal |
| 21530 | 3,597,293 | 123 | 3dc13d8e2c69 | equal |
| 21708 | 3,905,583 | 125 | 30e1a9d16a66 | equal |
| 23348 | 2,036,207 | 6 | 6ddf161c75d5 | equal |

**emit v2 on the 20 controls: 20 of 20, v2 = v1 (pod ledger) = ours**, on all four values.

**emit v1 built here, on the same 52: 52 of 52 equal to v1's pod ledger** (so the pod's x86_64/g++ numbers are
reproduced on arm64/clang for these 52, and the v1 → v2 change on the 32 is the patch, not the compiler); equal to
ours on the 20 controls and on none of the 32, as it must be.

**The 20 controls do not test the patch. The 77 do.** After writing the list of 20 I looked them up in the scanner's
output (`hall-disagreement/scan-all.jsonl`): all 20 have `S_sides` = 0, no slot-failing side. On such a core
`slots_ok` is true everywhere and v2 = v1 is the only possible outcome; the 20 show only that the patched build is
not broken in general. The cores where the patch DOES act and is predicted to change nothing are the 77 with
`S_sides` > 0 and `extras` = 0 (24 of them with a slot-failing side whose three mate domains are all non-empty).
I added them, list written before running (`selection-extra-77.json`, 03:07:58 UTC): **77 of 77, v2 = v1 (pod
ledger) = ours.** Six of the 77 (285, 286, 3069, 3104, 12812, 16962) the note had already run.

**Counted together:** emit v2, built here from the pinned source and the pinned patch, has run on 129 cores:
equal to our ledger on 129 of 129; equal to v1 on 97 of the 97 unaffected ones; different from v1 on the 32, each by
the predicted amount.

## 6. What this join does NOT establish

1. **No single version of emit agrees with us on every core.** The program that ran on all 23,409 (emit v1) differs
   from ours on 32. The patched program (v2) agrees on those 32 and has been run on 129 cores in all, on this Mac
   only. The statement the files support is: *v1 on 23,377 cores, v2 on the 32, and v2 = v1 on the 97 unaffected
   cores tried.* Whether that is "a second program's count agrees with ours on every core" is for the room and the
   operator to say. A v2 run of all 23,409 was priced in the note at about 2.1 pod-hours.
2. **emit v1's unaffected cores were not re-run with v2, except 97.** For the other 23,280, "v2 would equal v1" rests
   on two things: (a) my reading that the patch can only remove records (above); (b) **the control room's own scanner**
   (`hall-disagreement/slotscan.c`, written by the agent that wrote the note, after it had read enum_own.c and
   emit.cpp — not blind), which says no other core has a slot-failing side with a surviving record. The scanner was
   exact on all 23,409 joined lines as a COUNT (emit − ours = extras on every line, checked here), which is strong
   evidence for (b) but is evidence about v1 and ours, not a run of v2.
3. **emit v2 has never run on x86_64 or in a registered run.** My runs and the note's are on one Apple arm64 machine.
   v2 is not registered ("to register as emit v2" in the log is still to do), has no gate run and no pins beyond the
   hashes here.
4. **On the 32, v2 is not independent of us.** The patch was written by our side, modelled on enum_own.c l.212–214,
   to make emit reproduce our stream. "v2 = ours" on the 32 shows the patch does what it was written to do. That the
   14,895 dropped records are rightly dropped rests on the note: three readings of one Lean definition (`Pass`
   clause 2: pass_own.py, Astra's reference.py, enum_own.c), and on our tests refuting all 14,895 anyway. None of
   that was re-done here.
5. **What the two programs share.**
   - The same catalogue file (0d3d2caf…208d). A wrong or incomplete catalogue is invisible to the join.
   - The same written definitions: one baseline definition (the `claude-r6/r6sides.c` header) and one Hall screen.
     "One definition, two programs" (R6-ROUND38-EMIT-AUDIT, item 4). Agreement checks code against code.
   - Reading: that audit says emit's baseline path was written after the emit track had read and patched our count.c
     ("separately written, not blind"; "no shared code" certified by reading). emit's Hall arm descends from the
     pilot's early_hall.cpp.
   - **A correction to my brief:** the log's sentence "the track read our spec code" (F4) is in the entry for
     E4-PRODUCTION-AUDIT, the four-edge pilot's production program, not emit. For emit the matching fact is the one
     above (it read and patched count.c).
   - The record format and order (both write the same 24-byte records in the same order; the hashes could not match
     otherwise).
6. **A count match is not a verdict match.** emit has no verdict. The join compares the baseline as a number, and the
   Hall survivors as a count and a stream hash. Our 23,409 EXCLUDED verdicts come from the tests (tight_own,
   direct_own, the cross-check sample) applied to the Hall stream; no second program in this join touches them.
   "The second program agrees" means: the same baseline count and the same Hall survivors, record for record.
7. **The baseline is compared as a number only.** Neither program writes the baseline records.
8. **A shared omission is invisible**: a genuine survivor dropped by both programs, or a baseline record missed by both.
9. **The ledgers are taken as written.** I re-hashed them; I did not re-run enum_own or anything of ours. (v2's
   streams on 129 cores do reproduce our pod's stream hashes for those cores, from another program on another
   architecture.)
10. **Clause 3 of the patch is not exercised by any run**: the scanner finds no clause-3 side on the catalogue.
11. **Only the 16 "pending" predictions were forecasts**, and their priority rests on local file times and our
    ledger's clock.
12. **My join program is new and read by nobody else.** 19 planted cases, one tally slip found by them and fixed.
13. **The two v2 binaries differ** (mine and the note's), cause not found.

## 7. Result

- Unexpected differences: **none.**
- The join: 23,377 equal; 32 different, all predicted, each by the predicted amount and to the predicted stream; 0
  different and unpredicted; 0 invalid; 0 missing on either side; 0 duplicated.
- emit v2 (Mac): equal to ours on 32 of 32 affected; v2 = v1 = ours on 20 of 20 hash-chosen controls and on 77 of 77
  controls where the patch acts. No core left unrun.
- Planted cases: 19 of 19 as expected (second pass).
- Inputs: both ledgers equal their recorded hashes; both cover 0..23408 exactly once.

`JOIN: 23377 equal, 32 predicted differences, 0 unexpected, v2 agrees on 32 of 32`
