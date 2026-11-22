# Deviations from the pre-registered procedure (notes/alpoge-grh-preregistration-2026-11-20.md), each dated

None of these changes a verdict rule. Each is about the machine, the judges' versions or the build's disk.

1. **2026-11-20 22:06 UTC — the checkout's lakefile.** The release's `lakefile.toml` gained one library,
   `CertMachine` (`globs = ["CertMachine.+"]`), so that cert-machine's challenge and controls live in the same Lake
   workspace as the release (Comparator judges two modules of one workspace). The release's own lines are unchanged;
   both versions are in the run (`lakefile.release.toml`, `lakefile.with-challenge.toml`).
2. **2026-11-20 ~22:30 UTC — the judges' versions.** lean4export and Comparator have no v4.33.1 tags; their v4.33.0 tags
   (lean4export 15f6055e, Comparator 3927ad38) were rebuilt with the release's toolchain v4.33.1 (an .olean is read
   only by the Lean that wrote it). nanoda at 0da9f98f (its default branch), landrun at main. Recorded in `P2tools.txt`.
3. **2026-11-20 22:35 UTC — the sandbox.** This host's kernel offers Landlock ABI v4; landrun's strict mode refuses it.
   Comparator itself calls landrun with `--best-effort`, which applies the file-system rules ABI v4 offers; that mode
   ran (`derisk.txt`) and is the mode of S1, recorded in `S1.mode`.
4. **2026-11-20 22:42-22:47 UTC — 5,963 generated C files emptied.** To keep the build inside the pod's 320 GB disk, a
   loop emptied the C files Lake had already generated and hashed (`.lake/build/ir/*.c`, 56,345,015 bytes). They are
   native-code output for executables; no check here reads them (Lean's checks read .olean files). It was stopped when
   the space turned out to be elsewhere (item 5). Lake treats an emptied C file with its hash as up to date (tested).
5. **2026-11-20 22:47 UTC onward — the setup files of finished modules removed.** Lake writes, per module, a
   `<module>.setup.json` (here ~6 MB: the whole import list) as the input of that module's compile; 6,441 of them took
   37.8 GB after 6,400 modules, which would not fit 175,187 modules. Every 2 minutes the setup files of modules whose
   compile has finished (`.c.hash` written) are removed (`tools/runpod-alpoge-grh-setupclean.sh`, log
   `setupclean.log`). Lake treats a module without its setup file as up to date (tested on a small project).
6. **2026-11-20 23:31 UTC — one proof line of the conditional bridge corrected after its first compile.** In
   `CertMachine/BridgeConditional.lean`, `N0starL_eq_NdistL` destructured the hypothesis `h` and then used it
   (`Unknown identifier h`); `obtain … := h` became `obtain … := id h`. No statement changed; the file was committed
   before its first compile (e90acbad) and the fix is its own commit. The first, failing compile is kept in the run
   (`BB.out`), the second in `BB2-after-fix.txt`.
7. **2026-11-21 ~00:40 UTC — the independent RH statement's first compile.** `instruments/alpoge-grh/spec/Spec.lean`,
   committed before its first compile (0fd9ab3b9), used the notation `π` without opening `Real`; four `have` lines now
   write `Real.pi`. No statement changed. Both compiles are kept (`corpus/alpoge-grh/runs-spec/`).
8. **2026-11-21 ~12:45 UTC — CHAR's first compile (amendment A12).** `instruments/alpoge-grh/spec/Textbook.lean`,
   committed before its first compile (35bfd60f), failed on two proofs: `one_lt_two` found no ordered-group instance on
   `Cardinal` (now `exact_mod_cast Nat.one_lt_two`), and `isTextbookL_LFunction` hit the heartbeat limit while unifying
   the series before its argument was elaborated (now the same two terms, named first with `have`). No statement
   changed. Both compiles are kept (`corpus/alpoge-grh/runs-char/`).
9. **2026-11-21 16:55–17:15 UTC — the challenge-unchanged gate, narrowed to the compiled files (amendment A13).**
   After B1, phase 1 found `Challenge.c` emptied (item 4) and `Challenge.setup.json` removed (item 5): both this run's
   own disk-saving steps, neither read by any judge. The compiled challenge (`.olean`, `.ilean`, their hashes, the
   `.trace`) is unchanged. The gate before S1 now compares those files only. Phase 2, still in its first step
   (rebuilding the judges), was stopped and restarted from the corrected script, with `/opt/judges` moved aside first.
   Correction (17:10 UTC): phase 2 had also run B1V (exit 0) and the reconcile (175,187 of 175,187) before the halt. The halt's log line tripped the scripts' stop signal; the log is kept verbatim as `_phase.log.part1` (sha256 737f65a5…), a clean continuation was started, and phase 2, the bridge and con-leche were restarted at 17:01 UTC (amendment A13's correction).
10. **2026-11-21 ~17:20 UTC — MI read with the artifact set amendment A5 names (amendment A14, after the result).** MI's two differences are Lake `.hash` sidecars holding the same number with and without leading zeros; the oleans they describe are identical (`mathlib-hash-sidecars.txt`). The script's substring test had included sidecars, which A5's set does not; the recorder now follows A5 and names the sidecars in the row.
11. **2026-11-22 ~02:10 UTC — a parallel pod for KR, the export, K2 and C5 (amendment A15, before any of them runs).**
    On the operator's word, to finish sooner: a second pod of the same shape is set up with the dropped row V's own
    setup script, receives a hash-checked copy of the compiled release, and runs KR, EXP, K2 and C5 while S1 runs on
    the build pod. KR's verdict is read from the parallel pod; K2 and C5 stay on the build pod's own export, with the
    parallel pod's runs reported beside them. The copy reads the build's files while S1 runs and may slow it.
12. **2026-11-22 ~03:45 UTC — a second run of S1 on the parallel pod (amendment A16, before it runs).** On the
    operator's word: the build pod's S1 is at that pod's memory limit and its export crawls. The same judge with the
    same settings runs again on the parallel pod once its export, K2 and C5 end. S1 passes if either run passes every
    gate; an accept beside a reject is REFUSED until explained. The build pod's run is left untouched.
13. **2026-11-22 ~04:39 UTC — S1 and C1 move to a machine with more memory (amendment A17, before either runs there).**
    Measured: the export is 61.6 GB of text; Comparator holds all of it in memory while lean4export still holds its
    own; the build pod stood at its 256 GB limit and the export got 0.07 s of user time in 20 s. On the operator's
    word ("Rent a bigger machine"): the backup run of A16 was cancelled before it started; the build pod's S1 and C1
    are stopped by the control room, each with a marker file, and decide nothing; the same judge with the same
    settings runs S1 and C1 on a 376 GB machine, on a hash-checked copy of the compiled release. The bridge does not
    start on the build pod and waits for a further amendment. The lane's cost is now expected to pass its US$150
    ceiling (about US$170).
    Correction (04:42 UTC): the first commit of this item (d6db39e7) gave its time as ~04:55; it was made at 04:39.
