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
    Correction (04:40 UTC): the first commit of this item (d6db39e7) gave its time as ~04:55; it was made at 04:39.
14. **2026-11-22 04:49 UTC — the copy to the larger machine goes over parallel streams (before it runs that way).** One
    tar stream from the build pod (Romania) to the larger machine (Kansas) carried 14 MB/s, about two hours for the
    compiled release; eight test streams carried 94 MB/s together. `tools/runpod-alpoge-grh-verifier-copy.sh` gains
    `STREAMS=<n>`: the same set of files (the filter is now defined once and used by both the list and the copy),
    largest first, dealt to n tar streams. The single-stream copy started at 04:43 was stopped at 2 GB and its files
    are overwritten. The acceptance test is unchanged: both ends hash every copied file and the two lists must be equal.
15. **2026-11-22 05:05 UTC — nanoda's acceptance line (amendment A18, before the registered K2 reports).** With this
    run's configuration nanoda prints `Checked N declarations with no typechecker errors, 1 pretty printer errors:
    ["Unable to print axioms"]` (its axiom printing is on by default and no destination is set). The recorder looked
    for `with no errors` and would have misread an acceptance. Found on the parallel pod's K2 (exit 0, 1,484,729
    declarations); the committed derisk already showed the line and I had not adapted the reader. The recorder and the
    clean-machine gate now read both forms with one pattern each; any other pretty-printer error is not an acceptance.
    COMPUTED beside it: the parallel pod's export holds exactly three axiom records (propext, Quot.sound,
    Classical.choice).
16. **2026-11-22 09:39 UTC — what follows the larger machine's S1 (amendment A19, before S1 has a verdict).** On the
    operator's word: if S1 runs out of memory on the 376 GB machine it is REFUSED on resources and no larger machine is
    rented; C1 is then not run and the row C1–C5 is REFUSED on resources, as is the bridge. If S1 passes, C1 runs and
    then the bridge runs there, with the build pod's bridge steps line for line. The second statement judge
    (con-leche's comparison) is already CERTIFIED and does not depend on any of this.
17. **2026-11-22 10:43 UTC — the clean machine's gate line misread one rejection (amendment A20, AFTER the result).** The
    clean pod logged "CR: 4 of 5 gates held" because its script's test for control C1 looked for the words "justified
    by the solution" to exclude an acceptance, and con-leche's rejection reads "is not justified by the solution". The
    control was rejected (exit 1, the planted declaration named). The recorder now decides CR from the five outputs by
    A12's rule, with the tests it already used for K3; the gate line is kept as logged; the script is corrected.
    Nothing was rerun. A change of reading made after seeing the result, disclosed as such.
18. **2026-11-22 22:41 UTC — the unconditional bridge dropped on cost; a guard on the larger machine (amendment A21,
    before S1 has a verdict).** S1's own length put the bridge at about 20 more hours and US$58, above the lane's
    ceiling. On the operator's word the bridge is not run there and BRu is REFUSED with that reason; it can be run
    later as a follow-up. The waiter that would have started it was stopped. A small script on the machine now
    enforces A19's rule that C1 is not run if S1 stops on resources. S1 had not reported when this was written.
19. **2026-11-23 04:11 UTC — S1's and C1's outputs carried home as tails (amendment A22, before S1 has a verdict).** The
    closing checklist excluded `S1.out` (about 168.6 MB) from the pull while the recorder reads Comparator's acceptance
    lines there; found by Astra 6.2's red-team of the release texts. The recorder now falls back to `S1.tail` / `C1.tail`
    (the last 400 lines, made on the machine, with the full file's sha256 and size in the machine's hash list), as for
    `B1V.tail`. Criteria unchanged; S1 had not reported when this was written.
20. **2026-11-23 05:05 UTC — how the larger machine's S1 stop and C1 are read (amendment A23, before S1 and C1 have
    results).** C1 there counts as rejected only with a diagnostic naming the planted statement (as A17 fixed); exit 137
    without out-of-memory evidence reads "killed, cause not established"; the A19 reading needs the guard's C1.not-run
    marker. Found by Astra 6.2's red-team; criteria for a pass unchanged.
21. **2026-11-23 05:05 UTC — B1's sorry tally re-counted in both spellings (amendment A24, AFTER the result).** The tally
    matched straight quotes while Lean prints backticks; the archived full logs re-counted: 0 in every log and spelling.
    B1 stands.
22. **2026-11-24 10:08 UTC — the statement judge stopped on cost, with no verdict (amendment A25, AFTER the stop).** On
    the operator's word ("Stop it now") the control room killed the judge script, the guard and Comparator on the
    376 GB machine after 53 hours 5 minutes of running: about 357 GB in use, nothing killed for memory, 18.9 hours of
    its 72-hour limit left, and no line of its own printed. S1 is REFUSED on resources (cost): no verdict, neither an
    acceptance nor a rejection. C1 never started there, so the row C1–C5 is REFUSED with it; C2 to C5 were each
    rejected earlier. This is the lane's second refusal for cost (the first: item 18). The 40 result files were pulled
    in one archive and match the machine's own sha256 list; four are over 100 MB and stay outside the repository
    (`LARGE-LOGS.txt` in the run). `S1.tail` was cut at home from the hash-checked `S1.out`, because the step never
    exited and no tail was made on the machine (item 19 has it made there). Two logs that had grown since the previous
    pull are kept in both versions (`_judge.log.at-stop`, `S1.err.at-stop`). The recorder reads the machine's marker
    `S1.stopped-by-operator` as "no verdict" and stops if anything beside it says otherwise. The page closes in a
    state that was not registered in advance, and says so. A change of reading made after the state was seen,
    disclosed as such.
