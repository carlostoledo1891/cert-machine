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
