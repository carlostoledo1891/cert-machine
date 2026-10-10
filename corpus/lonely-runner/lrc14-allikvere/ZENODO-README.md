# Fifteen lonely runners: manuscript, gate certificates, and audit code

Verification package for the paper *Fifteen lonely runners* (J. Allikvere, 2026),
a computer-assisted proof of the Lonely Runner Conjecture for fifteen runners
(fourteen moving runners, LRC(14)), in the finite-checking framework of
Sungkawichai and Trakulthongchai (arXiv:2604.23906), which builds on the
linearly-exponential checking theorem of Malikiosis, Santos and Schymura
(Forum Math. Sigma 13 (2025), e164).

The paper proves a finite-checking threshold of `14 log(A_14/28) - log 360360 =
401.9845...` (natural logarithm; Theorem 3.8 and Lemma 3.9), against `log B_14 =
810.07` from the MSS bound, and certifies `J(14,p) = {}` for 71 primes with
`sum log p > 408.8233`.  The margin, 6.84, exceeds `log p` for every gate, so the
proof survives the removal of any single certificate.

## Files in this record

| File | Content |
| --- | --- |
| `fifteen_lonely_runners.pdf` | the manuscript |
| `fifteen_runners_manuscript_source.zip` | `paper_v2.tex` (the manuscript source; `make_tables.py --v2` regenerates `gates_table_v2.tex`, `cost_table_v2.tex`, `constants.tex` from `gates.json`), and `inputs/`: `gates.json` (one record per gate, extracted from the certificates by `collect_gates.py`), `make_tables.py`, `kz_flag_check.py` and `flag_constants_recheck.py` (exact rational verification of every constant of Section 3), `shape_lemma_symbolic_check.py` (Lemma 3.6), `audit_lrc14_gates.py` |
| `evidence_<p>_s0.tgz` (71 files) | certificate package of the gate `p` (directory `out_<p>/`): `SUMMARY.json`, `MANIFEST_SHA256.json`, the gate log, the `km1low` precondition output, the level-one rows of both generator branches with per-job logs (`rows_ir/`, `rows_km1/`), the cascade outputs and statistics of every job (`filt/*.out`, `filt/*.stats`), and the level-15 kill record of every persistent orbit (`kills/`) |
| `SHA256SUMS.txt` | SHA-256 of the 71 archives, as recorded when each package was collected from its machine |
| `audit_lrc14_gates.py` | independent audit (Python 3, standard library only), see below |
| `LRC15_AUDIT_SUMMARY.json` | output of `audit_lrc14_gates.py` on this record: `all_ok = true`, `proof_complete = true`, 71 manifests verified |
| `fifteen_runners_code_and_logs.zip` | `code/`: the pipeline sources and scripts; `logs/`: the campaign logs of every machine (`run_<p>.log`, `sweep.log`, `sweep_summary.txt`, `SHA256SUMS.txt`) |

## Running the audit

```
python audit_lrc14_gates.py            # all 71 archives, every manifest entry re-hashed
python audit_lrc14_gates.py --sample 8 # certificates of all gates, manifests of 8 random gates
```

For every archive the script checks: `k = 14`; `p` prime and equal to the file
name; `status = GATE_CLOSED`; `smax = 12`; the variant (`decomposition` if no
cover on at most 12 classes exists, `general` otherwise) agrees with the
precondition count; every persistent orbit has a level-15 record with no
improper lift after the gcd clause and the near-gcd lemma, and for the claim
`J(K,p) empty` none after the gcd clause alone; every file listed in
`MANIFEST_SHA256.json` is present with the listed SHA-256; the archive matches
`SHA256SUMS.txt`.  It then recomputes `sum log p` with 60-digit decimal
arithmetic and compares it with the threshold.  Expected final lines:

```
gates ok: 71  failed: []
mass = 408.823317  target = 401.984506  margin = 6.838812  (removing the largest gate: 0.494931)
all_ok=True  proof_complete=True
```

The threshold constant itself is reproduced from the paper's formulas by
`inputs/kz_flag_check.py` and `inputs/flag_constants_recheck.py` (exact
rationals, then 50-digit evaluation).

## Code and provenance

`code/` contains the sources that produced the certificates:

| File | SHA-256 (prefix) | Role |
| --- | --- | --- |
| `basegen_k_campaign.cpp`, `bgk_incremental_gain.h` | `4b48224e…`, `bd150a98…` | level-one generator (`bgk14`): irredundant branch, `km1root`/`km1all` branch, `km1low` precondition |
| `cascade_filter_k.cpp` | `50fa9385…` | binary cascade to level 32 (`cascade_k14`), with `--selftest` |
| `tight_lift_L.cpp` | `fb52dca4…` | level-15 kill (`tight_lift_15`): 3-adic and 5-adic witness-free lifts, CRT, gcd clause, near-gcd lemma |
| `gate_k14.py` | `290f4101…` | gate orchestrator (precondition, jobs, cascade, orbit reduction, kill, `SUMMARY.json`, manifest) |
| `gate_k14_rev6626f883.py` | `6626f883…` | earlier revision of the orchestrator used on the first machine (gates 181–233) |
| `tight_lift_L_framework_only_c834ca53.cpp` | `c834ca53…` | kill program without the near-gcd lemma; used only for the `p = 233` run reported in Section 6 (`logs/sweep_pmin2/run_233.log`, `GATE_FAIL`, 13,456 orbits unresolved) |
| `gate_merge_k14.py`, `run_gate.sh`, `run_sweep.sh` | | shard merge (not needed for the final certificates: every gate ran unsharded), build-and-run scripts |

Build (Ubuntu 24.04, g++ 13.3.0), as in `run_gate.sh`:

```
g++ -O3 -march=native -std=c++20 -DK=14 -DNW=8 -DMAXN=512 -DBGK_INCREMENTAL_GAIN -DBGK_DEFERRED_PROBES -DBGK_THRESHOLD_WITNESS -o bgk14 basegen_k_campaign.cpp
g++ -O3 -march=native -std=c++17 -DK=14 -o cascade_k14 cascade_filter_k.cpp
g++ -O3 -march=native -std=c++17 -DK=14 -o tight_lift_15 tight_lift_L.cpp
```

Every `MANIFEST_SHA256.json` records, as entries `../bgk14`, `../cascade_k14`,
`../tight_lift_15`, the SHA-256 of the three executables that produced the gate:
`cc275840…`, `807b250e…`, `ef8bea4d…` for all 71 gates.  The first run log of every
machine (`logs/*/run_<p>.log`, `BUILD` block) records the hashes of the sources
and of the executables built from them.  Rebuilding the three programs from the
sources above on a fresh machine of the same type (Hetzner cpx62, AMD EPYC Genoa,
Ubuntu 24.04.4, g++ 13.3.0) on 8 September 2026 gave byte-identical executables.

The orchestrator `gate_k14.py` went through operational revisions during the
campaign (parallel orbit canonicalisation, memory handling of the kill records,
resumption of an interrupted gate); the revision used by each machine is hashed in
its `BUILD` block.  Revisions `290f4101…` (machines camp1–camp5, 53 gates) and
`6626f883…` (machine pmin2, 10 gates: 181–233) are included.  The revision
`8ef52797…` used on machines pmin3–pmin5 (gates 89, 131, 149, 157, 163, 167, 173,
179) was overwritten before it was archived and is not included; it lies between
the two included revisions and differs from them only in these operational parts.
The three executables, whose hashes are in every manifest, were the same on all
machines.

Every gate ran unsharded on one sixteen-vCPU machine.  Two gates were completed
by a restarted run that reused the level-one rows and cascade files already on
disk: `p = 181` (restart after an orchestrator update; the kill stage, 503,678
CPU-s, was run in full by the restarted run, `logs/sweep_pmin2/run_181.log`) and
`p = 233` (the closing run with the near-gcd lemma reused the rows and cascade of
the framework-only run, `logs/sweep_pmin2/run_233_neargcd.log`).  For these two
gates `SUMMARY.json` records no cascade time.
