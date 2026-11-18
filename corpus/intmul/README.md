# corpus/intmul: the facts of the audit of "integer multiplication below n log n"

Two Lean proofs were audited, each at one commit: the Google/CMU release (`lockqueue/intmul` @ `4738aeff`, Cui, Liu,
Woodruff) and the community release (`platypii/integer-mult-bounds-lean` @ `aaf10926`, Brown, Daniel). The mathematics
and the proofs are theirs. No file of either release is copied here, except the Google/CMU statement file
`SubNLogN/Challenge.lean` (Apache-2.0, byte for byte, sha256 `7aa50930…`), which the joining theorem imports.

The record is `certs/intmul-audit.json`, written by `tools/record-intmul.js` from the files below and from the two
intake records (`certs/lean-intake-intmul-gcmu.json`, `certs/lean-intake-intmul-community.json`, whose own facts are
under `corpus/lean-intake/`). `node tools/record-intmul.js --check` re-derives it and refuses on any difference.
Nothing here needs Lean or a rented machine to re-read.

| Path | What it holds | Written |
|---|---|---|
| `preregistration.json` | the six questions, the verdict words, the stop rules | before the pod (see amendment A11 for its clock) |
| `amendments.json` | every departure from the pre-registration and the plan | after the runs |
| `public-record.json` | dates of the public record around the two proofs, each with its source; a reading, no priority decided | after the runs |
| `readings/` | two readings of the two statement files against their papers, by readers who did not see each other's notes | before the runs |
| `bridge/` | the Lean sources of the theorem joining the two statements, and the logs of their checks | during the runs |
| `checks/first/` | inputs of the checks added after the first result: the generator of the structural comparison and of the encoding pairs, the scan of every Lean file | after the first result |
| `checks/xreplay/` | the challenge module written here for comparator on the community proof, and one changed statement | after the registered runs |
| `checks/diag/` | two diagnostics: the statement as typed against the theorem's type; a scan of an export for large literals | after the registered runs |
| `checks/pod-scripts/` | every script run on the pod outside the two registered runs, as it ran | as dated in each |
| `programs/` | the released programs against Python's integers: scripts, rows (`*.jsonl`), logs | during the runs |
| `pod/` | what the pod wrote outside the two registered runs: `extra/` (fresh replays, the joined theorem's export and its nanoda run, the structural comparison, the encodings, the memory guards), `extra2/` (comparator, lean4lean, con-leche; `r2`, `r3`, `r4` are the later attempts after a guard stopped the one before), `cost.json` | during and after |

| `pod2/` | the second pod (2026-11-18, amendment A17): the proof built again, the same export, con-leche with its heartbeat (`locate/progress.log`, `memory2.txt`), Lean's checker on one module (`locate/module.*`), its scripts, `cost.json`. Nothing in it was changed after it left the pod | after the page was first published |

## Changes made to the copies kept here

- In `pod/`, eight comparator logs of about 2.3 MB each (build warnings) are gzipped (`*.out.gz`, `gzip -n -9`). The
  record tool reads through the compression. Nothing else in `pod/` was changed after it left the pod.
- Four files in `pod/` were written by hand on the pod, and say so in their first words: `extra/community-fresh.stopped`,
  `extra2/r3/C1.comparator-positive.stopped`, `extra/bridge-encodings-comment.diff`, and `extra/bridge-asm2/` (copies of
  the build logs of the joined theorem's five modules).
- In five text files (`checks/first/gen.py`, `bridge/check.log`, `bridge/assembly/check.log`, `programs/run2.sh`,
  `readings/second.md`) the desk's home folder is written `~/Projects/` and its scratch folder `<scratch>/`, and two
  comment lines were reworded. No number, hash, exit code or statement was touched.
- The archives the pod produced for the two registered runs are not kept here; their contents are the files under
  `corpus/lean-intake/<id>/runs/2026-11-17/`, and their sha256 are in `pod/*.tar.gz.sha256`.

## Units and clocks

All times are UTC. Memory printed by `/usr/bin/time -v` and by `ps` is in kB of 1,024 bytes; the guards' lines print
"GB" for what is GiB. Every timing was taken on a pod that was doing something else at the same moment: none is a speed.

## Licence

The files written here are MIT, as the rest of this repository's code. Logs quote lines of the two releases' sources
in compiler warnings; those lines remain under their releases' licences (Apache-2.0 and MIT).
