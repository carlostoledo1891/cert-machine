# Deviations from the pre-registration (ω = 9/4 lane; each dated before the step it concerns)

D1 (2026-11-25 03:04 UTC, row PIN, script fix, no result changed). The first PIN run (03:02:16 UTC) cloned the release
and printed its head as 92b516ef8e2abf66c3db7aa31438d3010bc7956f (runs/p1/pin-clone.txt), then stopped at 03:03:56 UTC
on its own check "the release is not at 92b516ef": the check ran `git rev-parse` as root on a clone owned by the
unprivileged user, and git refused the directory as of "dubious ownership", printing nothing. No file was checked and no
sum written. The check now runs as the clone's owner (tools/runpod-omega-p1.sh); PIN is run again from the start.

D2 (2026-11-25 03:07 UTC, row PIN, script fix before the seal, nothing sealed). The second PIN run finished at 03:06:18
UTC with a list of 11,278 files (sha256 064b658a…) that was NOT sealed, for two faults found on reading its log: one
imported module, Lake.Util.Casing (imported by Mathlib.Tactic.Linter.TextBased), was left unresolved because the
closure script searched the toolchain's src/lean but not src/lean/lake, where Lake's sources live; and the check of which
compatibility patches touch closure files matched by path suffix only, so three paths inside other packages (e.g.
PrimeNumberTheoremAnd/Erdos970/Mathlib/Analysis/SpecialFunctions/Log/Basic.lean) were reported as Mathlib files. The
script now also searches src/lean/lake and matches a patch's paths only inside the package the patch is named for. PIN
is run a third time from the start; only that run's list is sealed (the unsealed one is kept in runs/p1/pin-attempt2/).

D3 (2026-11-25 03:26 UTC, additions to Phase 1 at the control room's word; no pre-registered row changes). While K0 was
building, the control room sent (a) the provenance scout's facts N1–N3 (AMENDMENTS.md A8) for CEN and the K0 log, and
(b) the statement reader's decision tests for F4 (reader/tests at commit 94b626de: the six planted challenges V1–V6,
each changing one definition body, which Comparator must refuse; the T3 pair ReaderDivision / ReaderDivisionPlanted,
accept / refuse; T1–T5 with `lake env lean`) and its note on `rigidity` / `contact_of_installations`. These run AFTER
the pre-registered rows, from a separate script (tools/runpod-omega-p1x.sh, which sources the running
tools/runpod-omega-p1.sh unchanged; the running file is not edited). Two tests (T3_DivisionInEnv, T4) and N2 need two
modules outside the sealed A1 closure (SpectralBooks.DivisionExponent and SpectralBooks.CircuitRankSpecialization);
the files they add beyond A1, with the reader's test files, are hashed into A1x-SHA256SUMS and stamped (SEAL-A1x)
before anything of them is built. Those two modules are then checked by Lean's kernel at build only (no Comparator
config names them, no external kernel); this is said wherever their results are quoted.

D4 (2026-11-25 04:19 UTC, row PIN's file list, found at CEN, no result changed). Lean imports `Init` implicitly into
every file that does not begin with `prelude`; the PIN closure script read only the written `import` lines, so the
sealed A1-target-SHA256SUMS lists 11,242 modules where the true import closure of the two modules has 11,337. The 95
missing are all toolchain files — Init.lean and 94 files under Init/ — from the official v4.34.1 archive, whose
GitHub digest (47bf4bbd…) IS in A1, so their bytes were pinned before K0 through that digest, not file by file. With the
implicit import added, the script's closure of {the solution module, Lean} equals, module for module, the 11,857
modules Lean's own environment reports in the census (CEN.out, CENIMP lines). The 95 files' sha256s are recorded in
runs/p1/pod/x/init/missing-from-A1.SHA256SUMS (from the digest-checked archive). Found by the Phase 1 runner when the
census compared Lean's import list with A1.

D5 (2026-11-25 04:57 UTC, F4 test T2, a repair, not a finding). T2_AlphaOrientation.lean (reader/tests, 0a87a589…) did
not elaborate on the pod (XT2, 04:53:39 UTC, exit 1): `readerRHS_swap13` (l.40–41) left the goal "unsolved" — the two
sides differ only in how `max a 0 + max b 0 + max c 0` is bracketed, because the simp set had commutativity lemmas but
no `add_assoc` (Lean also warned that `add_left_comm` was unused). The reader's file anticipates exactly this ("a tactic
failure … repair … report it as a repair"). Repair r1: `add_assoc` added to that one `simp only` list; nothing else
changes (runs/p1/inputs/T2_AlphaOrientation_r1.lean, 4569a6bd…, a one-line diff). The statements and the three
#print axioms lines are the reader's, unchanged. Run as XT2r1 with the same green rule.
Phase 1 pod: yfz653o1ck7ew9 deleted 2026-11-25 06:05 UTC (every result home: runs/p1/, bridge/pod-logs/; the bridge author's build and judges on it were its own, at the runner's pins).
Phase 4 pod: 30uvwu2xeeknef, RunPod cpu3m 32 vCPU / 256 GB, US$1.76/h, created 2026-11-25 09:22:01 UTC (US-CA-2), for the Phase 4 prover (A13).
Phase 4 CR pod: cq6kgq4cw61uxt, RunPod cpu3m 16 vCPU / 128 GB, US$0.88/h, created 2026-11-25 10:25:53 UTC (EU-RO-1), for the Phase 4 clean-room replay; it never runs the release's code.
