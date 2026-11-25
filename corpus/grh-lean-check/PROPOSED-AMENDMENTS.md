# grh-lean — proposed amendments (NOT adopted; for the control room to decide)

Written 2026-11-25 at about 23:23 UTC (date -u) by the agent that prepared instruments/grh-lean/,
tools/runpod-grh-lean.sh and tools/check-grh-lean.py, before any pod or run of these files. Where the PREREG cannot
be followed exactly as written, or where the instruments had to choose something the PREREG leaves open, it is listed
here. Nothing below is in force until the control room adopts it as a dated, sealed amendment in AMENDMENTS.md.

## P1 — what "its real Landlock sandbox" means on a RunPod container (S1, S2, E1, and the Comparator controls)

Comparator v4.35.0 (e3dcf308) calls landrun with `--best-effort --ro / --rw /dev -ldd -add-exec` (Main.lean,
`buildLandrunArgs`): it applies whatever Landlock ABI the kernel offers. Its README also asks for
`systemd-run --property=RestrictAddressFamilies=~AF_UNIX --user` around the run, against a landrun vulnerability
"that will be fixed in Linux 7.1". On the earlier lane's RunPod hosts the kernel offered Landlock ABI v4, and landrun
warned that, at v4, it does not enforce pathname UNIX socket connections (ABI v9), abstract UNIX socket and signal
scoping (ABI v6), device ioctl (v5) and UDP (v10) (corpus/alpoge-grh/runs-judge/*/landrun-test.txt). A container
has no systemd user manager, so the systemd-run guard is not available there.

Proposed: S1, S2, E1 and C1S–C3S count as run "in its real Landlock sandbox" when (a) Comparator's own landrun call ran
(LL1, the same flags, exit 0), (b) the sandbox refused a write outside its paths (LL2: a write to /data/tmp must fail
and leave no file), (c) the kernel's Landlock ABI is recorded (setup.out), and (d) the row states the restrictions that
ABI leaves unenforced and that the systemd-run AF_UNIX guard was absent. The listening UNIX sockets are recorded before
each judge run (`<step>-unix-sockets.txt`, from /proc/net/unix) so a reader can see what a sandboxed process could have
reached. If Landlock is unavailable (LL1 fails or LL2 writes), the Comparator steps do not start; there is no
pass-through mode in the script.

## P2 — how cert-machine's challenge enters the release's workspace (B1, B2, S1, E1)

The PREREG does not say. As in the earlier lane, step CHB appends two libraries (`CertMachine`, `CertMachineCtl`) to
each edition's `lakefile.toml` and puts `src/CertMachine/Challenge.lean` (and, in `grh/`, `ChallengeC3.lean`) there,
BEFORE any module of the release is compiled on the machine (Comparator's assumption 2). B1 and B2 then run
`lake build` (the release's default targets Lib, New, Main, unchanged) on that lakefile. Both lakefiles, before and
after, are kept in /results (`lakefile.<edition>.release.toml`, `.with-challenge.toml`); the release's own bytes are
pinned at I1 before the append. Proposed: B1/B2 "from source" is read on this lakefile, and the row says so.

## P3 — the form of the controls (C1, C2, C3)

- C1 and C2 are copies of the readable edition's `Main.lean` (they import `New.Main`, so they live in the release's own
  environment) with one planted change: C1 proves `LFunction_eq_zero_re_of_isPrimitive` by an added axiom
  `CertMachine.plantedAxiomC1`; C2 replaces the proof of `LFunction_ne_zero_of_half_lt_re` by `sorry` (no other theorem
  of Main uses that one). C3 is the challenge with `1 / 2` changed to `1 / 3` in `DirichletLZerosOnLine`.
- Comparator's configuration for C1 and C2 lists ONLY the planted theorem (default `CTL_NAMES=planted`). Listing all
  five makes Comparator export the whole closure again, an S1-sized run of hours each, against the US$15 ceiling. The
  check that must refuse (Comparator's axiom check over the listed theorem's closure) is the same in both forms.
  `CTL_NAMES=all` runs the full form. C3 lists all five (it cannot be made smaller: its solution is the release).
- "K2's check" for a control: for C1 and C2, con-leche `--verified` on the control's own export and `--compare` of the
  challenge (rooted at the planted theorem) against it; for C3, `--compare` of C3's challenge against the release's
  export (C3 changes the challenge, so `--verified` of the release's export does not test it).
- A control counts as refused only with an exit that is not 0, 124 or 137, its diagnostic naming the plant, and no
  acceptance line (the earlier lane's A20/A23 rule).

## P4 — nanoda inside Comparator

S1 and E1 run Comparator with `enable_nanoda: false`: nanoda is K1, run separately on the same closure's export with
all 16 threads (Comparator gives nanoda 4). S2 uses the release's own `comparator.json` verbatim, so nanoda runs
inside it, as the authors ran it. Proposed: adopt as stated.

## P5 — D1 from the environment, not from the export

The PREREG says D1 lists the declarations outside the closure "by name and file, from the export". The export holds
only the closure, and no module or file for any declaration, so the list of everything else must come from the
environment. instruments/grh-lean/census/Unused.lean imports `Main`, computes the closure of the five theorems
(`getUsedConstantsAsSet` to a fixed point, each inductive type with its block, as lean4export exports them), and lists
every constant of a release module (`Main`, `Statements`, `Lib.*`, `New.*`) outside it, with kind, module and file,
marking compiler- or elaborator-made constants `aux`. Proposed: D1 reads "from the environment of Main, by the closure
rule stated in Unused.lean", for both editions.

## P6 — the order of the steps and the US$15 ceiling (A1)

Estimated pod time for every row is about 14 to 25 hours at US$0.88/h, US$12 to 22 (the estimates and their sources
are in the agent's report). The upper end passes the ceiling. Proposed:
- `all` runs the rows of the verdict rule first: setup, DERISK, I1, CHB, B1, A1 (readable), EXP, K1, K2 (with C3's
  con-leche check), the controls C1 and C2, S1, C3S, KR; then B2, A1 (compact), E1, D1, S2.
- The control room sets `DEADLINE` (unix time) from the balance and the ceiling before the start. No step starts within
  10 minutes of it; a running step is stopped at it (`<step>.deadline`). A row whose step did not run is REFUSED with
  "not run: the lane's deadline (A1 ceiling)".
- To save time, KR (Lean's replay, one thread) may run beside the Comparator steps in a second invocation
  (`bash runpod-grh-lean.sh KR`), memory permitting (Comparator about 64 GB by the authors' README; KR unmeasured here).
- If the ceiling is reached, S2 (the release's own challenge, the most redundant row) is the first to go.

## Notes (facts for the control room; no amendment needed)

- The "authors' shared build cache". lsernau/grh-lean at 72fead10 has no CACHE.md and no cache script
  (`scripts/` holds only `PrintAxioms.lean`). The shared cache belongs to leanprover-community/riemann-hypothesis:
  commits b7a0adab and 686902ae (2026-11-25 22:24–22:28 UTC, after 72fead10) add CACHE.md, a `cache` executable and a
  `[cache]` service in `lakefile.toml` pointing at rh-cache.taucetiproject.org. The script therefore clones
  lsernau/grh-lean only, refuses a lakefile with a cache service, an executable or a `lakefile.lean` (I1), blocks that
  host in /etc/hosts and checks it is unreachable (setup), and runs every Lean step with an empty environment (no
  `LAKE_*` variable). Mathlib's own `lake exe cache get` (cache.mathlib.org) is the only cache.
- Pins beyond the PREREG's three, added to I1 from the GitHub API read of 2026-11-25: the commit's tree
  (5eb1240f…), its 1,627 files, and each edition's `lakefile.toml`, `lake-manifest.json`, `lean-toolchain` and
  `src/Main.lean`. They strengthen I1; they change no row.
- Tool versions: every pin the PREREG and the task name exists. Comparator's repository is archived (2026-10-14) but its
  tag v4.35.0 (e3dcf308) is there, and its manifest pins lean4export 5a9a355d, which is lean4export's tag v4.35.0.
  nanoda 0da9f98f and landrun 573aa723 are still the heads of their default branches; con-leche 5ea446d5 (the earlier
  lane's pin, its own toolchain v4.36.0) is behind its master (cfa7cd1d, 2026-11-25), as pinned. The lean4export format
  is 3.1.0 at both v4.33.0 and v4.35.0.
- CHAR ran under A2 on the Lean-bridge pod and passed (PROGRESS.md). The runner keeps a CHAR step but leaves it out of
  `all`; the recorder reads CHAR from runs/char-alt1te1i1gsnpy/.
